/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  REACTIVE_NODE,
  ReactiveNode,
  SIGNAL,
  consumerAfterComputation,
  consumerBeforeComputation,
  consumerDestroy,
  consumerPollProducersForChange,
  isInNotificationPhase,
} from '@angular/core/primitives/signals';
import {FLAGS, LViewFlags, LView, EFFECTS} from '../interfaces/view';
import {markAncestorsForTraversal} from '../util/view_utils';
import {InjectionToken} from '../../di/injection_token';
import {inject} from '../../di/injector_compatibility';
import {performanceMarkFeature} from '../../util/performance';
import {Injector} from '../../di/injector';
import {assertNotInReactiveContext} from './asserts';
import {assertInInjectionContext} from '../../di/contextual';
import {DestroyRef, NodeInjectorDestroyRef} from '../../linker/destroy_ref';
import {ViewContext} from '../view_context';
import {noop} from '../../util/noop';
import {
  ChangeDetectionScheduler,
  NotificationSource,
} from '../../change_detection/scheduling/zoneless_scheduling';
import {setIsRefreshingViews} from '../state';
import {EffectScheduler, SchedulableEffect} from './root_effect_scheduler';

import {emitEffectCreatedEvent, setInjectorProfilerContext} from '../debug/injector_profiler';

/**
 * 글로벌 반응 효과로, 수동으로 파괴할 수 있습니다.
 *
 * @developerPreview
 */
export interface EffectRef {
  /**
   * 효과를 종료하고 예정된 모든 실행에서 제거합니다.
   */
  destroy(): void;
}

export class EffectRefImpl implements EffectRef {
  [SIGNAL]: EffectNode;

  constructor(node: EffectNode) {
    this[SIGNAL] = node;
  }

  destroy(): void {
    this[SIGNAL].destroy();
  }
}

/**
 * `effect` 함수에 전달된 옵션.
 *
 * @developerPreview
 */
export interface CreateEffectOptions {
  /**
   * 효과를 생성할 `Injector`.
   *
   * 제공하지 않으면 현재 [주입 컨텍스트](guide/di/dependency-injection-context)를 대신 사용합니다( `inject`를 통해).
   */
  injector?: Injector;

  /**
   * `effect`가 수동 정리(cleanup)를 요구하는지 여부.
   *
   * 이것이 `false`(기본값)인 경우, 효과는 자동으로 현재 `DestroyRef`와 함께 정리되도록 등록됩니다.
   */
  manualCleanup?: boolean;

  /**
   * 컴포넌트 내에서 `effect`가 호출되는지 여부와 관계없이 항상 루트 효과를 생성합니다(마이크로태스크로 예약됨).
   */
  forceRoot?: true;

  /**
   * @deprecated 더 이상 필요하지 않으며, 기본적으로 신호 쓰기가 허용됩니다.
   */
  allowSignalWrites?: boolean;

  /**
   * 효과에 대한 디버그 이름. Angular DevTools에서 효과를 식별하는 데 사용됩니다.
   */
  debugName?: string;
}

/**
 * 효과는 선택적으로 정리 함수를 등록할 수 있습니다. 등록된 경우, 정리는 다음 효과 실행 전에 실행됩니다. 정리 함수는 이전 효과 실행이 시작했을 수 있는 작업을 "취소"할 수 있게 합니다.
 *
 * @developerPreview
 */
export type EffectCleanupFn = () => void;

/**
 * 효과 함수에 전달되는 콜백으로, 정리 로직을 등록할 수 있게 합니다.
 *
 * @developerPreview
 */
export type EffectCleanupRegisterFn = (cleanupFn: EffectCleanupFn) => void;

/**
 * 읽는 신호가 변경될 때마다 스케줄되고 실행될 "효과"를 등록합니다.
 *
 * Angular에는 두 가지 종류의 효과가 있습니다: 컴포넌트 효과와 루트 효과. 컴포넌트 효과는 `effect()`가 컴포넌트, 지시어 또는 컴포넌트/지시어의 서비스 내에서 호출될 때 생성됩니다. 루트 효과는 `effect()`가 컴포넌트 트리 외부, 예를 들어 루트 서비스내에서 호출되거나 `forceRoot` 옵션이 제공될 때 생성됩니다.
 *
 * 두 가지 효과 유형은 타이밍이 다릅니다. 컴포넌트 효과는 Angular의 동기화(변경 감지) 과정 중 컴포넌트 생명주기 이벤트로 실행되며 컴포넌트 상태에 의존하는 입력 신호를 안전하게 읽거나 뷰를 생성/삭제할 수 있습니다. 루트 효과는 마이크로태스크로 실행되며 컴포넌트 트리 또는 변경 감지와 연결되어 있지 않습니다.
 *
 * `effect()`는 주입 컨텍스트 내에서 실행해야 하며, `injector` 옵션이 수동으로 지정되지 않는 한 그렇습니다.
 *
 * @developerPreview
 */
export function effect(
  effectFn: (onCleanup: EffectCleanupRegisterFn) => void,
  options?: CreateEffectOptions,
): EffectRef {
  ngDevMode &&
    assertNotInReactiveContext(
      effect,
      '반응 컨텍스트 외부에서 `effect`를 호출하세요. 예를 들어, 컴포넌트 생성자 내에서 효과를 예약합니다.',
    );

  !options?.injector && assertInInjectionContext(effect);

  if (ngDevMode && options?.allowSignalWrites !== undefined) {
    console.warn(
      `'allowSignalWrites' 플래그는 더 이상 사용되지 않으며 effect()에 영향이 없습니다(쓰기는 항상 허용됩니다).`,
    );
  }

  const injector = options?.injector ?? inject(Injector);
  let destroyRef = options?.manualCleanup !== true ? injector.get(DestroyRef) : null;

  let node: EffectNode;

  const viewContext = injector.get(ViewContext, null, {optional: true});
  const notifier = injector.get(ChangeDetectionScheduler);
  if (viewContext !== null && !options?.forceRoot) {
    // 이 효과는 뷰의 컨텍스트 내에서 생성되었으며 뷰에 연결됩니다.
    node = createViewEffect(viewContext.view, notifier, effectFn);
    if (destroyRef instanceof NodeInjectorDestroyRef && destroyRef._lView === viewContext.view) {
      // 효과가 `DestroyRef` 참조와 동일한 뷰에서 생성되고 있으므로 명시적인 `DestroyRef` 등록 없이 자동으로 파괴됩니다.
      destroyRef = null;
    }
  } else {
    // 이 효과는 뷰의 컨텍스트 외부에서 생성되었으며 독립적으로 스케줄됩니다.
    node = createRootEffect(effectFn, injector.get(EffectScheduler), notifier);
  }
  node.injector = injector;

  if (destroyRef !== null) {
    // 정리를 등록해야 하는 경우 여기서 수행합니다.
    node.onDestroyFn = destroyRef.onDestroy(() => node.destroy());
  }

  const effectRef = new EffectRefImpl(node);

  if (ngDevMode) {
    node.debugName = options?.debugName ?? '';
    const prevInjectorProfilerContext = setInjectorProfilerContext({injector, token: null});
    try {
      emitEffectCreatedEvent(effectRef);
    } finally {
      setInjectorProfilerContext(prevInjectorProfilerContext);
    }
  }

  return effectRef;
}

export interface EffectNode extends ReactiveNode, SchedulableEffect {
  hasRun: boolean;
  cleanupFns: EffectCleanupFn[] | undefined;
  injector: Injector;
  notifier: ChangeDetectionScheduler;

  onDestroyFn: () => void;
  fn: (cleanupFn: EffectCleanupRegisterFn) => void;
  run(): void;
  destroy(): void;
  maybeCleanup(): void;
}

export interface ViewEffectNode extends EffectNode {
  view: LView;
}

export interface RootEffectNode extends EffectNode {
  scheduler: EffectScheduler;
}

/**
 * 공개 API가 아니며, `EffectScheduler`는 항상 애플리케이션 루트 주입기에서만 옵니다.
 */
export const APP_EFFECT_SCHEDULER = /* @__PURE__ */ new InjectionToken('', {
  providedIn: 'root',
  factory: () => inject(EffectScheduler),
});

export const BASE_EFFECT_NODE: Omit<EffectNode, 'fn' | 'destroy' | 'injector' | 'notifier'> =
  /* @__PURE__ */ (() => ({
    ...REACTIVE_NODE,
    consumerIsAlwaysLive: true,
    consumerAllowSignalWrites: true,
    dirty: true,
    hasRun: false,
    cleanupFns: undefined,
    zone: null,
    kind: 'effect',
    onDestroyFn: noop,
    run(this: EffectNode): void {
      this.dirty = false;

      if (ngDevMode && isInNotificationPhase()) {
        throw new Error(`스케줄링 중에는 관찰자가 동기적으로 실행될 수 없습니다.`);
      }

      if (this.hasRun && !consumerPollProducersForChange(this)) {
        return;
      }
      this.hasRun = true;

      const registerCleanupFn: EffectCleanupRegisterFn = (cleanupFn) =>
        (this.cleanupFns ??= []).push(cleanupFn);

      const prevNode = consumerBeforeComputation(this);

      // 우리는 `setIsRefreshingViews`를 지워서 효과의 본문 내에서 `markForCheck()`가 문제의 컴포넌트에 도달하도록 합니다.
      const prevRefreshingViews = setIsRefreshingViews(false);
      try {
        this.maybeCleanup();
        this.fn(registerCleanupFn);
      } finally {
        setIsRefreshingViews(prevRefreshingViews);
        consumerAfterComputation(this, prevNode);
      }
    },

    maybeCleanup(this: EffectNode): void {
      if (!this.cleanupFns?.length) {
        return;
      }
      try {
        // 정리 함수를 실행하려고 시도합니다. 실패하든 성공하든 우리는 정리를 "완료"된 것으로 간주하고 효과의 다음 실행을 위해 목록을 비웁니다. 정리 함수에서 오류가 발생하면 현재 효과 실행이 중단됩니다.
        while (this.cleanupFns.length) {
          this.cleanupFns.pop()!();
        }
      } finally {
        this.cleanupFns = [];
      }
    },
  }))();

export const ROOT_EFFECT_NODE: Omit<RootEffectNode, 'fn' | 'scheduler' | 'notifier' | 'injector'> =
  /* @__PURE__ */ (() => ({
    ...BASE_EFFECT_NODE,
    consumerMarkedDirty(this: RootEffectNode) {
      this.scheduler.schedule(this);
      this.notifier.notify(NotificationSource.RootEffect);
    },
    destroy(this: RootEffectNode) {
      consumerDestroy(this);
      this.onDestroyFn();
      this.maybeCleanup();
      this.scheduler.remove(this);
    },
  }))();

export const VIEW_EFFECT_NODE: Omit<ViewEffectNode, 'fn' | 'view' | 'injector' | 'notifier'> =
  /* @__PURE__ */ (() => ({
    ...BASE_EFFECT_NODE,
    consumerMarkedDirty(this: ViewEffectNode): void {
      this.view[FLAGS] |= LViewFlags.HasChildViewsToRefresh;
      markAncestorsForTraversal(this.view);
      this.notifier.notify(NotificationSource.ViewEffect);
    },
    destroy(this: ViewEffectNode): void {
      consumerDestroy(this);
      this.onDestroyFn();
      this.maybeCleanup();
      this.view[EFFECTS]?.delete(this);
    },
  }))();

export function createViewEffect(
  view: LView,
  notifier: ChangeDetectionScheduler,
  fn: (onCleanup: EffectCleanupRegisterFn) => void,
): ViewEffectNode {
  const node = Object.create(VIEW_EFFECT_NODE) as ViewEffectNode;
  node.view = view;
  node.zone = typeof Zone !== 'undefined' ? Zone.current : null;
  node.notifier = notifier;
  node.fn = fn;

  view[EFFECTS] ??= new Set();
  view[EFFECTS].add(node);

  node.consumerMarkedDirty(node);
  return node;
}

export function createRootEffect(
  fn: (onCleanup: EffectCleanupRegisterFn) => void,
  scheduler: EffectScheduler,
  notifier: ChangeDetectionScheduler,
): RootEffectNode {
  const node = Object.create(ROOT_EFFECT_NODE) as RootEffectNode;
  node.fn = fn;
  node.scheduler = scheduler;
  node.notifier = notifier;
  node.zone = typeof Zone !== 'undefined' ? Zone.current : null;
  node.scheduler.schedule(node);
  node.notifier.notify(NotificationSource.RootEffect);
  return node;
}
