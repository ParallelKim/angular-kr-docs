/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer} from '@angular/core/primitives/signals';

import {
  DEFER_BLOCK_ID,
  DEFER_BLOCK_STATE as SERIALIZED_DEFER_BLOCK_STATE,
} from '../hydration/interfaces';
import {populateDehydratedViewsInLContainer} from '../linker/view_container_ref';
import {bindingUpdated} from '../render3/bindings';
import {declareTemplate} from '../render3/instructions/template';
import {DEHYDRATED_VIEWS} from '../render3/interfaces/container';
import {HEADER_OFFSET, INJECTOR, TVIEW} from '../render3/interfaces/view';
import {
  getCurrentTNode,
  getLView,
  getSelectedTNode,
  getTView,
  nextBindingIndex,
} from '../render3/state';
import {removeLViewOnDestroy, storeLViewOnDestroy} from '../render3/util/view_utils';
import {performanceMarkFeature} from '../util/performance';
import {invokeAllTriggerCleanupFns, storeTriggerCleanupFn} from './cleanup';
import {onHover, onInteraction, onViewport, registerDomTrigger} from './dom_triggers';
import {onIdle} from './idle_scheduler';
import {
  DEFER_BLOCK_STATE,
  DeferBlockInternalState,
  DeferBlockState,
  DeferDependenciesLoadingState,
  DependencyResolverFn,
  DeferBlockTrigger,
  LDeferBlockDetails,
  TDeferBlockDetails,
  TriggerType,
  SSR_UNIQUE_ID,
  TDeferDetailsFlags,
} from './interfaces';
import {onTimer} from './timer_scheduler';
import {
  getLDeferBlockDetails,
  getTDeferBlockDetails,
  setLDeferBlockDetails,
  setTDeferBlockDetails,
  trackTriggerForDebugging,
} from './utils';
import {DEHYDRATED_BLOCK_REGISTRY, DehydratedBlockRegistry} from './registry';
import {assertIncrementalHydrationIsConfigured, assertSsrIdDefined} from '../hydration/utils';
import {ɵɵdeferEnableTimerScheduling, renderPlaceholder} from './rendering';

import {
  getHydrateTriggers,
  triggerHydrationFromBlockName,
  scheduleDelayedHydrating,
  scheduleDelayedPrefetching,
  scheduleDelayedTrigger,
  triggerDeferBlock,
  triggerPrefetching,
  triggerResourceLoading,
  shouldAttachTrigger,
} from './triggering';

/**
 * 지연 블록에 대한 런타임 데이터 구조를 생성합니다.
 *
 * @param index `defer` 명령의 인덱스입니다.
 * @param primaryTmplIndex 기본 블록 콘텐츠가 있는 템플릿의 인덱스입니다.
 * @param dependencyResolverFn 이 지연 블록에 대한 종속성을 포함하는 함수입니다.
 * @param loadingTmplIndex 로딩 블록 콘텐츠가 있는 템플릿의 인덱스입니다.
 * @param placeholderTmplIndex 플레이스 홀더 블록 콘텐츠가 있는 템플릿의 인덱스입니다.
 * @param errorTmplIndex 오류 블록 콘텐츠가 있는 템플릿의 인덱스입니다.
 * @param loadingConfigIndex 로딩 블록의 구성이 포함된 상수 배열의 인덱스입니다.
 * @param placeholderConfigIndex 플레이스 홀더 블록의 구성이 포함된 상수 배열의 인덱스입니다.
 * @param enableTimerScheduling `@loading` 또는 `@placeholder` 블록이 설정된 경우
 *     타이머 관련 일정을 활성화하는 함수입니다.
 * @param flags 특정 동작을 정의하는 플래그 집합입니다 (예: 수분 트리거가 존재한다는 것을 나타내고 특정 시나리오에서 일반 트리거를 비활성화해야 함).
 *
 * @codeGenApi
 */
export function ɵɵdefer(
  index: number,
  primaryTmplIndex: number,
  dependencyResolverFn?: DependencyResolverFn | null,
  loadingTmplIndex?: number | null,
  placeholderTmplIndex?: number | null,
  errorTmplIndex?: number | null,
  loadingConfigIndex?: number | null,
  placeholderConfigIndex?: number | null,
  enableTimerScheduling?: typeof ɵɵdeferEnableTimerScheduling,
  flags?: TDeferDetailsFlags | null,
) {
  const lView = getLView();
  const tView = getTView();
  const adjustedIndex = index + HEADER_OFFSET;
  const tNode = declareTemplate(lView, tView, index, null, 0, 0);
  const injector = lView[INJECTOR];

  if (tView.firstCreatePass) {
    performanceMarkFeature('NgDefer');

    const tDetails: TDeferBlockDetails = {
      primaryTmplIndex,
      loadingTmplIndex: loadingTmplIndex ?? null,
      placeholderTmplIndex: placeholderTmplIndex ?? null,
      errorTmplIndex: errorTmplIndex ?? null,
      placeholderBlockConfig: null,
      loadingBlockConfig: null,
      dependencyResolverFn: dependencyResolverFn ?? null,
      loadingState: DeferDependenciesLoadingState.NOT_STARTED,
      loadingPromise: null,
      providers: null,
      hydrateTriggers: null,
      debug: null,
      flags: flags ?? TDeferDetailsFlags.Default,
    };
    enableTimerScheduling?.(tView, tDetails, placeholderConfigIndex, loadingConfigIndex);
    setTDeferBlockDetails(tView, adjustedIndex, tDetails);
  }

  const lContainer = lView[adjustedIndex];

  // 수분이 활성화된 경우, DOM에서 탈수된 뷰를 찾아서
  // 이를 LContainer에 저장합니다. 클라이언트 전용 모드에서는
  // 이 함수는 noop입니다.
  populateDehydratedViewsInLContainer(lContainer, tNode, lView);

  let ssrBlockState = null;
  let ssrUniqueId: string | null = null;
  if (lContainer[DEHYDRATED_VIEWS]?.length > 0) {
    const info = lContainer[DEHYDRATED_VIEWS][0].data;
    ssrUniqueId = info[DEFER_BLOCK_ID] ?? null;
    ssrBlockState = info[SERIALIZED_DEFER_BLOCK_STATE];
  }

  // 인스턴스별 지연 세부정보를 초기화하고 저장합니다.
  const lDetails: LDeferBlockDetails = [
    null, // NEXT_DEFER_BLOCK_STATE
    DeferBlockInternalState.Initial, // DEFER_BLOCK_STATE
    null, // STATE_IS_FROZEN_UNTIL
    null, // LOADING_AFTER_CLEANUP_FN
    null, // TRIGGER_CLEANUP_FNS
    null, // PREFETCH_TRIGGER_CLEANUP_FNS
    ssrUniqueId, // SSR_UNIQUE_ID
    ssrBlockState, // SSR_BLOCK_STATE
    null, // ON_COMPLETE_FNS
    null, // HYDRATE_TRIGGER_CLEANUP_FNS
  ];
  setLDeferBlockDetails(lView, adjustedIndex, lDetails);

  let registry: DehydratedBlockRegistry | null = null;
  if (ssrUniqueId !== null) {
    ngDevMode && assertIncrementalHydrationIsConfigured(injector);

    // 이 지연 블록을 레지스트리에 저장하여
    // 수분 런타임 코드에서 내부 데이터 구조에 액세스 할 수 있도록 합니다.
    registry = injector.get(DEHYDRATED_BLOCK_REGISTRY);
    registry.add(ssrUniqueId, {lView, tNode, lContainer});
  }

  const onLViewDestroy = () => {
    invokeAllTriggerCleanupFns(lDetails);
    if (ssrUniqueId !== null) {
      registry?.cleanup([ssrUniqueId]);
    }
  };

  // 지연 블록이 트리거 될 때 - LView 파괴 정리에서 구독 취소합니다.
  storeTriggerCleanupFn(TriggerType.Regular, lDetails, () =>
    removeLViewOnDestroy(lView, onLViewDestroy),
  );
  storeLViewOnDestroy(lView, onLViewDestroy);
}

/**
 * 트리거 값이 true가 될 때 지연 블록 종속성을 로드합니다.
 * @codeGenApi
 */
export function ɵɵdeferWhen(rawValue: unknown) {
  const lView = getLView();
  const tNode = getSelectedTNode();

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'when <expression>');
  }

  if (!shouldAttachTrigger(TriggerType.Regular, lView, tNode)) return;

  const bindingIndex = nextBindingIndex();
  if (bindingUpdated(lView, bindingIndex, rawValue)) {
    const prevConsumer = setActiveConsumer(null);
    try {
      const value = Boolean(rawValue); // true or false 값을 처리
      const lDetails = getLDeferBlockDetails(lView, tNode);
      const renderedState = lDetails[DEFER_BLOCK_STATE];
      if (value === false && renderedState === DeferBlockInternalState.Initial) {
        // 아무것도 렌더링되지 않은 경우, 플레이스 홀더를 렌더링합니다 (정의된 경우).
        renderPlaceholder(lView, tNode);
      } else if (
        value === true &&
        (renderedState === DeferBlockInternalState.Initial ||
          renderedState === DeferBlockState.Placeholder)
      ) {
        triggerDeferBlock(TriggerType.Regular, lView, tNode);
      }
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
}

/**
 * 값이 true가 될 때 지연 콘텐츠를 미리 가져옵니다.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchWhen(rawValue: unknown) {
  const lView = getLView();
  const tNode = getSelectedTNode();

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'prefetch when <expression>');
  }

  if (!shouldAttachTrigger(TriggerType.Prefetch, lView, tNode)) return;

  const bindingIndex = nextBindingIndex();

  if (bindingUpdated(lView, bindingIndex, rawValue)) {
    const prevConsumer = setActiveConsumer(null);
    try {
      const value = Boolean(rawValue); // true or false 값을 처리
      const tView = lView[TVIEW];
      const tNode = getSelectedTNode();
      const tDetails = getTDeferBlockDetails(tView, tNode);
      if (value === true && tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
        // 로딩이 시작되지 않은 경우, 지금 트리거합니다.
        triggerPrefetching(tDetails, lView, tNode);
      }
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
}

/**
 * 값이 true가 될 때 지연 콘텐츠를 수분합니다.
 * @codeGenApi
 */
export function ɵɵdeferHydrateWhen(rawValue: unknown) {
  const lView = getLView();
  const tNode = getSelectedTNode();

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'hydrate when <expression>');
  }

  if (!shouldAttachTrigger(TriggerType.Hydrate, lView, tNode)) return;

  // TODO(incremental-hydration): 모든 지연 명령을 감사하여
  // 관련 제어 플로우 블록 내로 함수 호출을 이동하여 불필요한 작업을 줄입니다.
  const bindingIndex = nextBindingIndex();
  const tView = getTView();
  const hydrateTriggers = getHydrateTriggers(tView, tNode);
  hydrateTriggers.set(DeferBlockTrigger.When, null);

  if (bindingUpdated(lView, bindingIndex, rawValue)) {
    if (typeof ngServerMode !== 'undefined' && ngServerMode) {
      // 우리는 서버에 있으며, 지연 블록에 대해 SSR이 활성화되어 있습니다.
      triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
    } else {
      const injector = lView[INJECTOR];
      const prevConsumer = setActiveConsumer(null);
      try {
        const value = Boolean(rawValue); // true or false 값을 처리
        if (value === true) {
          // `when` 조건이 `true`로 변경되었으며, 블록이 초기 상태(렌더링된 것이 없음) 또는 플레이스 홀더 상태일 경우, 지연 블록 로딩을 트리거합니다.
          const lDetails = getLDeferBlockDetails(lView, tNode);
          const ssrUniqueId = lDetails[SSR_UNIQUE_ID]!;
          ngDevMode && assertSsrIdDefined(ssrUniqueId);
          triggerHydrationFromBlockName(injector, ssrUniqueId);
        }
      } finally {
        setActiveConsumer(prevConsumer);
      }
    }
  }
}

/**
 * 수분이 절대로 발생하지 않음을 명시합니다.
 * @codeGenApi
 */
export function ɵɵdeferHydrateNever() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'hydrate never');
  }

  if (!shouldAttachTrigger(TriggerType.Hydrate, lView, tNode)) return;

  const hydrateTriggers = getHydrateTriggers(getTView(), tNode);
  hydrateTriggers.set(DeferBlockTrigger.Never, null);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    // 우리는 서버에 있으며, 지연 블록에 대해 SSR이 활성화되어 있습니다.
    triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
  }
}

/**
 * `on idle` 지연 트리거를 처리하기 위한 로직을 설정합니다.
 * @codeGenApi
 */
export function ɵɵdeferOnIdle() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'on idle');
  }

  if (!shouldAttachTrigger(TriggerType.Regular, lView, tNode)) return;

  scheduleDelayedTrigger(onIdle);
}

/**
 * `prefetch on idle` 지연 트리거를 처리하기 위한 로직을 설정합니다.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnIdle() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'prefetch on idle');
  }

  if (!shouldAttachTrigger(TriggerType.Prefetch, lView, tNode)) return;

  scheduleDelayedPrefetching(onIdle, DeferBlockTrigger.Idle);
}

/**
 * `on idle` 지연 트리거를 처리하기 위한 로직을 설정합니다.
 * @codeGenApi
 */
export function ɵɵdeferHydrateOnIdle() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'hydrate on idle');
  }

  if (!shouldAttachTrigger(TriggerType.Hydrate, lView, tNode)) return;

  const hydrateTriggers = getHydrateTriggers(getTView(), tNode);
  hydrateTriggers.set(DeferBlockTrigger.Idle, null);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    // 우리는 서버에 있으며, 지연 블록에 대해 SSR이 활성화되어 있습니다.
    triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
  } else {
    scheduleDelayedHydrating(onIdle, lView, tNode);
  }
}

/**
 * `on immediate` 지연 트리거를 처리하기 위한 로직을 설정합니다.
 * @codeGenApi
 */
export function ɵɵdeferOnImmediate() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'on immediate');
  }

  if (!shouldAttachTrigger(TriggerType.Regular, lView, tNode)) return;

  // 로딩 템플릿이 존재하지 않고 클라이언트에 있는 경우에만 플레이스 홀더 블록을 렌더링하여 깜박임을 피합니다.
  const tDetails = getTDeferBlockDetails(lView[TVIEW], tNode);
  if (tDetails.loadingTmplIndex === null) {
    renderPlaceholder(lView, tNode);
  }
  triggerDeferBlock(TriggerType.Regular, lView, tNode);
}

/**
 * `prefetch on immediate` 지연 트리거를 처리하기 위한 로직을 설정합니다.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnImmediate() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'prefetch on immediate');
  }

  if (!shouldAttachTrigger(TriggerType.Prefetch, lView, tNode)) return;

  const tView = lView[TVIEW];
  const tDetails = getTDeferBlockDetails(tView, tNode);

  if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
    triggerResourceLoading(tDetails, lView, tNode);
  }
}

/**
 * `on immediate` hydrate 트리거를 처리하기 위한 로직을 설정합니다.
 * @codeGenApi
 */
export function ɵɵdeferHydrateOnImmediate() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'hydrate on immediate');
  }

  if (!shouldAttachTrigger(TriggerType.Hydrate, lView, tNode)) return;

  const hydrateTriggers = getHydrateTriggers(getTView(), tNode);
  hydrateTriggers.set(DeferBlockTrigger.Immediate, null);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
  } else {
    const injector = lView[INJECTOR];
    const lDetails = getLDeferBlockDetails(lView, tNode);
    const ssrUniqueId = lDetails[SSR_UNIQUE_ID]!;
    ngDevMode && assertSsrIdDefined(ssrUniqueId);
    triggerHydrationFromBlockName(injector, ssrUniqueId);
  }
}
/**
 * `on timer` 지연 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param delay 콘텐츠를 로딩하기 전에 기다려야 하는 시간입니다.
 * @codeGenApi
 */
export function ɵɵdeferOnTimer(delay: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, `on timer(${delay}ms)`);
  }

  if (!shouldAttachTrigger(TriggerType.Regular, lView, tNode)) return;

  scheduleDelayedTrigger(onTimer(delay));
}

/**
 * `prefetch on timer` 지연 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param delay 콘텐츠를 미리 가져오기 전에 기다려야 하는 시간입니다.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnTimer(delay: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, `prefetch on timer(${delay}ms)`);
  }

  if (!shouldAttachTrigger(TriggerType.Prefetch, lView, tNode)) return;

  scheduleDelayedPrefetching(onTimer(delay), DeferBlockTrigger.Timer);
}

/**
 * `on timer` hydrate 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param delay 콘텐츠를 로딩하기 전에 기다려야 하는 시간입니다.
 * @codeGenApi
 */
export function ɵɵdeferHydrateOnTimer(delay: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, `hydrate on timer(${delay}ms)`);
  }

  if (!shouldAttachTrigger(TriggerType.Hydrate, lView, tNode)) return;

  const hydrateTriggers = getHydrateTriggers(getTView(), tNode);
  hydrateTriggers.set(DeferBlockTrigger.Timer, {delay});

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    // 우리는 서버에 있으며, 지연 블록에 대해 SSR이 활성화되어 있습니다.
    triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
  } else {
    scheduleDelayedHydrating(onTimer(delay), lView, tNode);
  }
}

/**
 * `on hover` 지연 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param triggerIndex 트리거 요소를 찾기 위한 인덱스입니다.
 * @param walkUpTimes 트리거를 찾기 위해 트리 구조를 얼마나 많이 올라갈지를 나타냅니다.
 * @codeGenApi
 */
export function ɵɵdeferOnHover(triggerIndex: number, walkUpTimes?: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(
      lView[TVIEW],
      tNode,
      `on hover${walkUpTimes === -1 ? '' : '(<target>)'}`,
    );
  }

  if (!shouldAttachTrigger(TriggerType.Regular, lView, tNode)) return;

  renderPlaceholder(lView, tNode);

  // 이 명령이 서버에서 호출될 때 이벤트 리스너를 추가하지 않도록 합니다.
  if (!(typeof ngServerMode !== 'undefined' && ngServerMode)) {
    registerDomTrigger(
      lView,
      tNode,
      triggerIndex,
      walkUpTimes,
      onHover,
      () => triggerDeferBlock(TriggerType.Regular, lView, tNode),
      TriggerType.Regular,
    );
  }
}

/**
 * `prefetch on hover` 지연 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param triggerIndex 트리거 요소를 찾기 위한 인덱스입니다.
 * @param walkUpTimes 트리거를 찾기 위해 트리 구조를 얼마나 많이 올라갈지를 나타냅니다.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnHover(triggerIndex: number, walkUpTimes?: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(
      lView[TVIEW],
      tNode,
      `prefetch on hover${walkUpTimes === -1 ? '' : '(<target>)'}`,
    );
  }

  if (!shouldAttachTrigger(TriggerType.Prefetch, lView, tNode)) return;

  const tView = lView[TVIEW];
  const tDetails = getTDeferBlockDetails(tView, tNode);

  if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
    registerDomTrigger(
      lView,
      tNode,
      triggerIndex,
      walkUpTimes,
      onHover,
      () => triggerPrefetching(tDetails, lView, tNode),
      TriggerType.Prefetch,
    );
  }
}

/**
 * `on hover` hydrate 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @codeGenApi
 */
export function ɵɵdeferHydrateOnHover() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'hydrate on hover');
  }

  if (!shouldAttachTrigger(TriggerType.Hydrate, lView, tNode)) return;

  const hydrateTriggers = getHydrateTriggers(getTView(), tNode);
  hydrateTriggers.set(DeferBlockTrigger.Hover, null);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    // 우리는 서버에 있으며, 지연 블록에 대해 SSR이 활성화되어 있습니다.
    triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
  }
  // hover 시 hydration의 실제 트리거는 event_replay.ts의 JSAction에 의해 처리됩니다.
}

/**
 * `on interaction` 지연 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param triggerIndex 트리거 요소를 찾기 위한 인덱스입니다.
 * @param walkUpTimes 트리거를 찾기 위해 트리 구조를 얼마나 많이 올라갈지를 나타냅니다.
 * @codeGenApi
 */
export function ɵɵdeferOnInteraction(triggerIndex: number, walkUpTimes?: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(
      lView[TVIEW],
      tNode,
      `on interaction${walkUpTimes === -1 ? '' : '(<target>)'}`,
    );
  }

  if (!shouldAttachTrigger(TriggerType.Regular, lView, tNode)) return;

  renderPlaceholder(lView, tNode);

  // 이 명령이 서버에서 호출될 때 이벤트 리스너를 추가하지 않도록 합니다.
  if (!(typeof ngServerMode !== 'undefined' && ngServerMode)) {
    registerDomTrigger(
      lView,
      tNode,
      triggerIndex,
      walkUpTimes,
      onInteraction,
      () => triggerDeferBlock(TriggerType.Regular, lView, tNode),
      TriggerType.Regular,
    );
  }
}

/**
 * `prefetch on interaction` 지연 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param triggerIndex 트리거 요소를 찾기 위한 인덱스입니다.
 * @param walkUpTimes 트리거를 찾기 위해 트리 구조를 얼마나 많이 올라갈지를 나타냅니다.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnInteraction(triggerIndex: number, walkUpTimes?: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(
      lView[TVIEW],
      tNode,
      `prefetch on interaction${walkUpTimes === -1 ? '' : '(<target>)'}`,
    );
  }

  if (!shouldAttachTrigger(TriggerType.Prefetch, lView, tNode)) return;

  const tView = lView[TVIEW];
  const tDetails = getTDeferBlockDetails(tView, tNode);

  if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
    registerDomTrigger(
      lView,
      tNode,
      triggerIndex,
      walkUpTimes,
      onInteraction,
      () => triggerPrefetching(tDetails, lView, tNode),
      TriggerType.Prefetch,
    );
  }
}

/**
 * `on interaction` hydrate 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @codeGenApi
 */
export function ɵɵdeferHydrateOnInteraction() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'hydrate on interaction');
  }

  if (!shouldAttachTrigger(TriggerType.Hydrate, lView, tNode)) return;

  const hydrateTriggers = getHydrateTriggers(getTView(), tNode);
  hydrateTriggers.set(DeferBlockTrigger.Interaction, null);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    // 우리는 서버에 있으며, 지연 블록에 대해 SSR이 활성화되어 있습니다.
    triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
  }
  // interaction 시 hydration의 실제 트리거는 event_replay.ts의 JSAction에 의해 처리됩니다.
}

/**
 * `on viewport` 지연 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param triggerIndex 트리거 요소를 찾기 위한 인덱스입니다.
 * @param walkUpTimes 트리거를 찾기 위해 트리 구조를 얼마나 많이 올라갈지를 나타냅니다.
 * @codeGenApi
 */
export function ɵɵdeferOnViewport(triggerIndex: number, walkUpTimes?: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(
      lView[TVIEW],
      tNode,
      `on viewport${walkUpTimes === -1 ? '' : '(<target>)'}`,
    );
  }

  if (!shouldAttachTrigger(TriggerType.Regular, lView, tNode)) return;

  renderPlaceholder(lView, tNode);

  // 이 명령이 서버에서 호출될 때 이벤트 리스너를 추가하지 않도록 합니다.
  if (!(typeof ngServerMode !== 'undefined' && ngServerMode)) {
    registerDomTrigger(
      lView,
      tNode,
      triggerIndex,
      walkUpTimes,
      onViewport,
      () => triggerDeferBlock(TriggerType.Regular, lView, tNode),
      TriggerType.Regular,
    );
  }
}

/**
 * `prefetch on viewport` 지연 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @param triggerIndex 트리거 요소를 찾기 위한 인덱스입니다.
 * @param walkUpTimes 트리거를 찾기 위해 트리 구조를 얼마나 많이 올라갈지를 나타냅니다.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnViewport(triggerIndex: number, walkUpTimes?: number) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(
      lView[TVIEW],
      tNode,
      `prefetch on viewport${walkUpTimes === -1 ? '' : '(<target>)'}`,
    );
  }

  if (!shouldAttachTrigger(TriggerType.Prefetch, lView, tNode)) return;

  const tView = lView[TVIEW];
  const tDetails = getTDeferBlockDetails(tView, tNode);

  if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
    registerDomTrigger(
      lView,
      tNode,
      triggerIndex,
      walkUpTimes,
      onViewport,
      () => triggerPrefetching(tDetails, lView, tNode),
      TriggerType.Prefetch,
    );
  }
}

/**
 * `on viewport` hydrate 트리거를 위한 런타임 데이터 구조를 생성합니다.
 * @codeGenApi
 */
export function ɵɵdeferHydrateOnViewport() {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  if (ngDevMode) {
    trackTriggerForDebugging(lView[TVIEW], tNode, 'hydrate on viewport');
  }

  if (!shouldAttachTrigger(TriggerType.Hydrate, lView, tNode)) return;

  const hydrateTriggers = getHydrateTriggers(getTView(), tNode);
  hydrateTriggers.set(DeferBlockTrigger.Viewport, null);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    // 우리는 서버에 있으며, 지연 블록에 대해 SSR이 활성화되어 있습니다.
    triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
  }
  // viewport에서의 hydration의 실제 트리거는 triggering.ts에서 발생합니다.
  // 탈수된 콘텐츠에 대해 이러한 명령은 존재하지 않습니다.
}
