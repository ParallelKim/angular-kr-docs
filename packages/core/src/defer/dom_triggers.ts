/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {Injector} from '../di';
import {AfterRenderRef} from '../render3/after_render/api';
import {afterRender} from '../render3/after_render/hooks';
import {assertLContainer, assertLView} from '../render3/assert';
import {CONTAINER_HEADER_OFFSET} from '../render3/interfaces/container';
import {TNode} from '../render3/interfaces/node';
import {isDestroyed} from '../render3/interfaces/type_checks';
import {HEADER_OFFSET, INJECTOR, LView} from '../render3/interfaces/view';
import {
  getNativeByIndex,
  removeLViewOnDestroy,
  storeLViewOnDestroy,
  walkUpViews,
} from '../render3/util/view_utils';
import {assertElement, assertEqual} from '../util/assert';
import {NgZone} from '../zone';
import {storeTriggerCleanupFn} from './cleanup';

import {
  DEFER_BLOCK_STATE,
  DeferBlockInternalState,
  DeferBlockState,
  TriggerType,
} from './interfaces';
import {getLDeferBlockDetails} from './utils';

/** 수동 및 캡처 이벤트를 등록하는 데 사용되는 구성 객체. */
const eventListenerOptions: AddEventListenerOptions = {
  passive: true,
  capture: true,
};

/** 현재 등록된 `on hover` 트리거를 추적합니다. */
const hoverTriggers = new WeakMap<Element, DeferEventEntry>();

/** 현재 등록된 `on interaction` 트리거를 추적합니다. */
const interactionTriggers = new WeakMap<Element, DeferEventEntry>();

/** 현재 등록된 `viewport` 트리거. */
const viewportTriggers = new WeakMap<Element, DeferEventEntry>();

/** 상호작용 이벤트로 간주되는 이벤트의 이름. */
export const interactionEventNames = ['click', 'keydown'] as const;

/** Hover 이벤트로 간주되는 이벤트의 이름. */
export const hoverEventNames = ['mouseenter', 'mouseover', 'focusin'] as const;

/** `viewport` 트리거를 관찰하는 데 사용되는 `IntersectionObserver`. */
let intersectionObserver: IntersectionObserver | null = null;

/** 현재 `viewport` 트리거로 관찰 중인 요소의 수. */
let observedViewportElements = 0;

/** 지연된 블록 트리거에 대한 등록된 콜백을 추적하는 객체. */
class DeferEventEntry {
  callbacks = new Set<VoidFunction>();

  listener = () => {
    for (const callback of this.callbacks) {
      callback();
    }
  };
}

/**
 * 상호작용 트리거를 등록합니다.
 * @param trigger 트리거가 되는 요소.
 * @param callback 트리거와 상호작용할 때 호출되는 콜백.
 */
export function onInteraction(trigger: Element, callback: VoidFunction): VoidFunction {
  let entry = interactionTriggers.get(trigger);

  // 이 요소에 대한 첫 번째 항목인 경우, 리스너를 추가합니다.
  if (!entry) {
    // 이처럼 이벤트를 중앙에서 관리하는 것은 전역 이벤트 위임을 잘 사용할 수 있게 합니다.
    // 현재는 문서 수준이 아닌 요소 수준에서 위임을 수행하고 있습니다. 그 이유는:
    // 1. 전역 위임은 동시에 많은 이벤트가 등록될 때 가장 효과적입니다.
    //    지연 블록은 그런 식으로 사용될 가능성이 낮습니다.
    // 2. 이벤트를 타겟에 매칭하는 것은 비용이 듭니다.
    //    각 `click` 및 `keydown` 이벤트에 대해 모든 트리거를 확인하고
    //    타겟이 해당 요소인지 여부를 확인해야 합니다.
    //    `click` 및 `keydown`은 가장 일반적인 이벤트 중 일부이기 때문에
    //    이로 인해 많은 런타임 오버헤드가 초래될 수 있습니다.
    // 3. 지연 블록이 이를 참조하는 한, 요소당 여전히 두 개의 이벤트만 등록하고 있습니다.
    entry = new DeferEventEntry();
    interactionTriggers.set(trigger, entry);

    for (const name of interactionEventNames) {
      trigger.addEventListener(name, entry!.listener, eventListenerOptions);
    }
  }

  entry.callbacks.add(callback);

  return () => {
    const {callbacks, listener} = entry!;
    callbacks.delete(callback);

    if (callbacks.size === 0) {
      interactionTriggers.delete(trigger);

      for (const name of interactionEventNames) {
        trigger.removeEventListener(name, listener, eventListenerOptions);
      }
    }
  };
}

/**
 * Hover 트리거를 등록합니다.
 * @param trigger 트리거가 되는 요소.
 * @param callback 트리거가 호버될 때 호출되는 콜백.
 */
export function onHover(trigger: Element, callback: VoidFunction): VoidFunction {
  let entry = hoverTriggers.get(trigger);

  // 이 요소에 대한 첫 번째 항목인 경우, 리스너를 추가합니다.
  if (!entry) {
    entry = new DeferEventEntry();
    hoverTriggers.set(trigger, entry);

    for (const name of hoverEventNames) {
      trigger.addEventListener(name, entry!.listener, eventListenerOptions);
    }
  }

  entry.callbacks.add(callback);

  return () => {
    const {callbacks, listener} = entry!;
    callbacks.delete(callback);

    if (callbacks.size === 0) {
      for (const name of hoverEventNames) {
        trigger.removeEventListener(name, listener, eventListenerOptions);
      }
      hoverTriggers.delete(trigger);
    }
  };
}

/**
 * Viewport 트리거를 등록합니다.
 * @param trigger 트리거가 되는 요소.
 * @param callback 트리거가 viewport에 들어올 때 호출되는 콜백.
 * @param injector 트리거가 DI 토큰을 해결하는 데 사용할 수 있는 Injector.
 */
export function onViewport(
  trigger: Element,
  callback: VoidFunction,
  injector: Injector,
): VoidFunction {
  const ngZone = injector.get(NgZone);
  let entry = viewportTriggers.get(trigger);

  intersectionObserver =
    intersectionObserver ||
    ngZone.runOutsideAngular(() => {
      return new IntersectionObserver((entries) => {
        for (const current of entries) {
          // 특정 요소가 교차하는 경우에만 콜백을 호출합니다.
          if (current.isIntersecting && viewportTriggers.has(current.target)) {
            ngZone.run(viewportTriggers.get(current.target)!.listener);
          }
        }
      });
    });

  if (!entry) {
    entry = new DeferEventEntry();
    ngZone.runOutsideAngular(() => intersectionObserver!.observe(trigger));
    viewportTriggers.set(trigger, entry);
    observedViewportElements++;
  }

  entry.callbacks.add(callback);

  return () => {
    // 다른 클린업 콜백이 이미 이 요소를 완전히 제거했을 가능성이 있습니다.
    if (!viewportTriggers.has(trigger)) {
      return;
    }

    entry!.callbacks.delete(callback);

    if (entry!.callbacks.size === 0) {
      intersectionObserver?.unobserve(trigger);
      viewportTriggers.delete(trigger);
      observedViewportElements--;
    }

    if (observedViewportElements === 0) {
      intersectionObserver?.disconnect();
      intersectionObserver = null;
    }
  };
}

/**
 * 지연 블록의 트리거가 렌더링된 LView를 가져오는 헬퍼 함수입니다.
 * @param deferredHostLView 지연 블록이 정의된 LView.
 * @param deferredTNode 지연 블록을 정의하는 TNode.
 * @param walkUpTimes 트리거의 뷰를 찾기 위해 뷰 계층 구조에서 위로 이동할 횟수.
 *   음수 값은 트리거가 블록의 플레이스홀더 안에 있음을 의미하며,
 *   정의되지 않은 값은 트리거가 지연 블록과 같은 LView에 있음을 의미합니다.
 */
export function getTriggerLView(
  deferredHostLView: LView,
  deferredTNode: TNode,
  walkUpTimes: number | undefined,
): LView | null {
  // 트리거가 같은 뷰에 있으므로, 탐색할 필요가 없습니다.
  if (walkUpTimes == null) {
    return deferredHostLView;
  }

  // 양수 값 또는 0은 트리거가 부모 뷰에 있음을 의미합니다.
  if (walkUpTimes >= 0) {
    return walkUpViews(walkUpTimes, deferredHostLView);
  }

  // 값이 음수인 경우, 트리거가 플레이스홀더 내부에 있음을 의미합니다.
  const deferredContainer = deferredHostLView[deferredTNode.index];
  ngDevMode && assertLContainer(deferredContainer);
  const triggerLView = deferredContainer[CONTAINER_HEADER_OFFSET] ?? null;

  // 플레이스홀더가 아직 렌더링되지 않았을 수 있으므로 null 체크가 필요합니다.
  if (ngDevMode && triggerLView !== null) {
    const lDetails = getLDeferBlockDetails(deferredHostLView, deferredTNode);
    const renderedState = lDetails[DEFER_BLOCK_STATE];
    assertEqual(
      renderedState,
      DeferBlockState.Placeholder,
      '이 지연 블록에서 플레이스홀더를 렌더링해야 합니다.',
    );
    assertLView(triggerLView);
  }

  return triggerLView;
}

/**
 * 지연 블록의 트리거가 가리키는 요소를 가져옵니다.
 * @param triggerLView 트리거가 정의된 LView.
 * @param triggerIndex 트리거 요소가 렌더링되어야 하는 인덱스.
 */
export function getTriggerElement(triggerLView: LView, triggerIndex: number): Element {
  const element = getNativeByIndex(HEADER_OFFSET + triggerIndex, triggerLView);
  ngDevMode && assertElement(element);
  return element as Element;
}

/**
 * DOM 노드 기반 트리거를 등록합니다.
 * @param initialLView 지연 블록이 렌더링되는 LView.
 * @param tNode 지연 블록을 나타내는 TNode.
 * @param triggerIndex 트리거 요소를 찾을 인덱스.
 * @param walkUpTimes 트리거를 찾기 위해 뷰 계층에서 위/아래로 이동할 횟수.
 * @param registerFn DOM 이벤트를 등록할 함수.
 * @param callback 트리거가 지연 블록을 렌더링해야 하는 이벤트를 수신할 때 호출되는 콜백.
 * @param type 일반 트리거와 사전 가져오기 트리거를 구분하기 위한 트리거 유형.
 */
export function registerDomTrigger(
  initialLView: LView,
  tNode: TNode,
  triggerIndex: number,
  walkUpTimes: number | undefined,
  registerFn: (element: Element, callback: VoidFunction, injector: Injector) => VoidFunction,
  callback: VoidFunction,
  type: TriggerType,
) {
  const injector = initialLView[INJECTOR];
  const zone = injector.get(NgZone);
  let poll: AfterRenderRef;
  function pollDomTrigger() {
    // 초기 뷰가 파괴되었으면 아무 것도 할 필요가 없습니다.
    if (isDestroyed(initialLView)) {
      poll.destroy();
      return;
    }

    const lDetails = getLDeferBlockDetails(initialLView, tNode);
    const renderedState = lDetails[DEFER_BLOCK_STATE];

    // 트리거가 해결되기 전에 블록이 로드되었으면 아무 것도 할 필요가 없습니다.
    if (
      renderedState !== DeferBlockInternalState.Initial &&
      renderedState !== DeferBlockState.Placeholder
    ) {
      poll.destroy();
      return;
    }

    const triggerLView = getTriggerLView(initialLView, tNode, walkUpTimes);

    // 트리거의 LView를 해결할 때까지 계속 폴링합니다.
    if (!triggerLView) {
      // 계속 폴링합니다.
      return;
    }

    poll.destroy();

    // 트리거 요소를 해결하기 전에 트리거의 뷰가 파괴되었을 수 있습니다.
    if (isDestroyed(triggerLView)) {
      return;
    }

    const element = getTriggerElement(triggerLView, triggerIndex);
    const cleanup = registerFn(
      element,
      () => {
        // `pollDomTrigger`는 영역 외부에서 실행되며(`afterNextRender` 때문)
        // 외부에서 리스너를 등록하므로 콜백을 실행하기 전에 영역으로 다시 진입합니다.
        zone.run(() => {
          if (initialLView !== triggerLView) {
            removeLViewOnDestroy(triggerLView, cleanup);
          }
          callback();
        });
      },
      injector,
    );

    // 트리거와 지연 블록이 다른 LView에 있을 수 있습니다.
    // 기본 LView의 경우 정리를 `storeTriggerCleanupFn` 로직의 일부로 수행합니다.
    // 트리거 LView에 대해서는, 트리거가 호출되기 전에 LView가 파괴되면 이벤트 핸들러를 제거하기 위해
    // 그곳에 클린업 함수를 등록합니다.
    if (initialLView !== triggerLView) {
      storeLViewOnDestroy(triggerLView, cleanup);
    }

    storeTriggerCleanupFn(type, lDetails, cleanup);
  }

  // 트리거에 대해 폴링을 시작합니다.
  poll = afterRender({read: pollDomTrigger}, {injector});
}
