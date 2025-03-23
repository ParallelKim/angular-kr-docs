/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {CachedInjectorService} from '../cached_injector_service';
import {NotificationSource} from '../change_detection/scheduling/zoneless_scheduling';
import {EnvironmentInjector, InjectionToken, Injector, Provider} from '../di';
import {
  DehydratedContainerView,
  DEFER_BLOCK_STATE as SERIALIZED_DEFER_BLOCK_STATE,
} from '../hydration/interfaces';
import {assertLContainer, assertTNodeForLView} from '../render3/assert';
import {ChainedInjector} from '../render3/chained_injector';
import {markViewDirty} from '../render3/instructions/mark_view_dirty';
import {handleUncaughtError} from '../render3/instructions/shared';
import {DEHYDRATED_VIEWS, LContainer} from '../render3/interfaces/container';
import {TContainerNode, TNode} from '../render3/interfaces/node';
import {isDestroyed} from '../render3/interfaces/type_checks';
import {HEADER_OFFSET, INJECTOR, LView, PARENT, TVIEW, TView} from '../render3/interfaces/view';
import {getConstant, getTNode} from '../render3/util/view_utils';
import {createAndRenderEmbeddedLView, shouldAddViewToDom} from '../render3/view_manipulation';
import {assertDefined} from '../util/assert';

import {
  DEFER_BLOCK_STATE,
  DeferBlockConfig,
  DeferBlockDependencyInterceptor,
  DeferBlockInternalState,
  DeferBlockState,
  DeferDependenciesLoadingState,
  DeferredLoadingBlockConfig,
  DeferredPlaceholderBlockConfig,
  LDeferBlockDetails,
  LOADING_AFTER_CLEANUP_FN,
  NEXT_DEFER_BLOCK_STATE,
  ON_COMPLETE_FNS,
  SSR_BLOCK_STATE,
  STATE_IS_FROZEN_UNTIL,
  TDeferBlockDetails,
} from './interfaces';
import {scheduleTimerTrigger} from './timer_scheduler';
import {
  assertDeferredDependenciesLoaded,
  getLDeferBlockDetails,
  getLoadingBlockAfter,
  getMinimumDurationForState,
  getTDeferBlockDetails,
  getTemplateIndexForState,
} from './utils';
import {profiler} from '../render3/profiler';
import {ProfilerEvent} from '../render3/profiler_types';
import {addLViewToLContainer, removeLViewFromLContainer} from '../render3/view/container';

/**
 * **INTERNAL**, 애플리케이션 코드에서 참조하지 마십시오.
 * *
 * `DeferBlockDependencyInterceptor` 클래스 구현을 제공할 수 있는
 * Injector 토큰입니다.
 *
 * 이 토큰은 devMode에서만 주입됩니다.
 */
export const DEFER_BLOCK_DEPENDENCY_INTERCEPTOR =
  /* @__PURE__ */ new InjectionToken<DeferBlockDependencyInterceptor>(
    'DEFER_BLOCK_DEPENDENCY_INTERCEPTOR',
  );

/**
 * **INTERNAL**, 지연 블록 동작 구성에 사용되는 토큰입니다.
 */
export const DEFER_BLOCK_CONFIG = new InjectionToken<DeferBlockConfig>(
  ngDevMode ? 'DEFER_BLOCK_CONFIG' : '',
);

/**
 * 주어진 지연 블록 선언과 관련된 캐시된 인젝터가 있는지 확인하고 존재할 경우 반환합니다.
 * 캐시된 인젝터가 없으면 새 인젝터를 생성하고 캐시에 저장합니다.
 */
function getOrCreateEnvironmentInjector(
  parentInjector: Injector,
  tDetails: TDeferBlockDetails,
  providers: Provider[],
) {
  return parentInjector
    .get(CachedInjectorService)
    .getOrCreateInjector(
      tDetails,
      parentInjector as EnvironmentInjector,
      providers,
      ngDevMode ? 'DeferBlock Injector' : '',
    );
}

/** 인젝터 헬퍼 */

/**
 * 지연 로드된 구성 요소의 종속성(NgModules)에서 수집된 공급자를 포함하는 새로운 인젝터를 생성합니다.
 * 이 함수는 다양한 유형의 상위 인젝터를 감지하고 그에 따라 새로운 인젝터를 생성합니다.
 */
function createDeferBlockInjector(
  parentInjector: Injector,
  tDetails: TDeferBlockDetails,
  providers: Provider[],
) {
  // 상위 인젝터가 `ChainedInjector`의 인스턴스인지 확인합니다.
  //
  // 이 경우 인젝터의 모양을 유지하고 새로 생성된
  // `EnvironmentInjector`를 `ChainedInjector`의 상위로 사용합니다.
  // 기본 인젝터가 먼저 참조되도록 보장하기 위해 필요합니다
  // (일반적으로 NodeInjector이므로) `EnvironmentInjector` 트리는 그 다음에 참조됩니다.
  if (parentInjector instanceof ChainedInjector) {
    const origInjector = parentInjector.injector;
    // 환경 인젝터일 것이라고 보장됩니다.
    const parentEnvInjector = parentInjector.parentInjector;

    const envInjector = getOrCreateEnvironmentInjector(parentEnvInjector, tDetails, providers);
    return new ChainedInjector(origInjector, envInjector);
  }

  const parentEnvInjector = parentInjector.get(EnvironmentInjector);

  // `parentInjector`가 `EnvironmentInjector`가 아닌 경우 -
  // 다음 설정을 가진 새로운 `ChainedInjector`를 생성해야 합니다:
  //
  //  - 제공된 `parentInjector`가 기본 인젝터가 됩니다.
  //  - 기존(진짜) `EnvironmentInjector`가 새로 생성된 인젝터의 상위 인젝터가 됩니다.
  //
  // 이 경우 인젝터를 참조하는 최종 순서는 다음과 같습니다:
  //
  //  1. 제공된 `parentInjector`
  //  2. 추가 공급자를 가진 새로 생성된 `EnvironmentInjector`
  //  3. `parentInjector`에서 온 `EnvironmentInjector`
  if (parentEnvInjector !== parentInjector) {
    const envInjector = getOrCreateEnvironmentInjector(parentEnvInjector, tDetails, providers);
    return new ChainedInjector(parentInjector, envInjector);
  }

  // `parentInjector`는 `EnvironmentInjector`의 인스턴스입니다.
  // 특별한 처리가 필요 없으며, `parentInjector`를
  // 상위 인젝터로 직접 사용할 수 있습니다.
  return getOrCreateEnvironmentInjector(parentInjector, tDetails, providers);
}

/** 렌더링 헬퍼 */

/**
 * 지연 블록을 새 상태로 전환합니다. 필요한 데이터 구조를 업데이트하고
 * 해당 블록을 렌더링합니다.
 *
 * @param newState 지연 블록에 적용해야 할 새 상태입니다.
 * @param tNode 지연 블록을 나타내는 TNode입니다.
 * @param lContainer 지연 블록의 인스턴스를 나타냅니다.
 * @param skipTimerScheduling `@loading` 및 `@placeholder` 블록이
 *   `after` 또는 `minimum` 구성 옵션이 설정되었더라도 즉시 렌더링되어야 함을 나타냅니다.
 *   이 플래그는 `DeferFixture.render` 메서드를 통해 상태 간에 지연 블록을 전환하기 위한 테스트 API에 필요합니다.
 */
export function renderDeferBlockState(
  newState: DeferBlockState,
  tNode: TNode,
  lContainer: LContainer,
  skipTimerScheduling = false,
): void {
  const hostLView = lContainer[PARENT];
  const hostTView = hostLView[TVIEW];

  // 이 뷰가 파기되지 않았는지 확인합니다. 로딩 과정이 비동기적이었기 때문에,
  // 렌더링이 발생하는 동안 뷰가 파기될 수 있습니다.
  if (isDestroyed(hostLView)) return;

  // 이 TNode가 호스트 LView를 나타내는 TView에 속하는지 확인합니다.
  ngDevMode && assertTNodeForLView(tNode, hostLView);

  const lDetails = getLDeferBlockDetails(hostLView, tNode);

  ngDevMode && assertDefined(lDetails, '지연 블록 상태가 정의되어 있을 것으로 예상했습니다.');

  const currentState = lDetails[DEFER_BLOCK_STATE];

  const ssrState = lDetails[SSR_BLOCK_STATE];
  if (ssrState !== null && newState < ssrState) {
    return; // 이전 상태를 렌더링하려고 하므로 종료합니다.
  }

  if (
    isValidStateChange(currentState, newState) &&
    isValidStateChange(lDetails[NEXT_DEFER_BLOCK_STATE] ?? -1, newState)
  ) {
    const tDetails = getTDeferBlockDetails(hostTView, tNode);
    // 서버에서는 예약을 건너뜁니다. 서버 응답을 지연시킬 수 있습니다.
    const needsScheduling =
      !skipTimerScheduling &&
      (typeof ngServerMode === 'undefined' || !ngServerMode) &&
      (getLoadingBlockAfter(tDetails) !== null ||
        getMinimumDurationForState(tDetails, DeferBlockState.Loading) !== null ||
        getMinimumDurationForState(tDetails, DeferBlockState.Placeholder));

    if (ngDevMode && needsScheduling) {
      assertDefined(
        applyDeferBlockStateWithSchedulingImpl,
        '예약 함수가 정의될 것으로 예상했습니다.',
      );
    }

    const applyStateFn = needsScheduling
      ? applyDeferBlockStateWithSchedulingImpl!
      : applyDeferBlockState;
    try {
      applyStateFn(newState, lDetails, lContainer, tNode, hostLView);
    } catch (error: unknown) {
      handleUncaughtError(hostLView, error);
    }
  }
}

function findMatchingDehydratedViewForDeferBlock(
  lContainer: LContainer,
  lDetails: LDeferBlockDetails,
): {dehydratedView: DehydratedContainerView | null; dehydratedViewIx: number} {
  const dehydratedViewIx =
    lContainer[DEHYDRATED_VIEWS]?.findIndex(
      (view: any) => view.data[SERIALIZED_DEFER_BLOCK_STATE] === lDetails[DEFER_BLOCK_STATE],
    ) ?? -1;
  const dehydratedView =
    dehydratedViewIx > -1 ? lContainer[DEHYDRATED_VIEWS]![dehydratedViewIx] : null;
  return {dehydratedView, dehydratedViewIx};
}

/**
 * 주어진 상태를 반영하도록 DOM에 변경 사항을 적용합니다.
 */
function applyDeferBlockState(
  newState: DeferBlockState,
  lDetails: LDeferBlockDetails,
  lContainer: LContainer,
  tNode: TNode,
  hostLView: LView<unknown>,
) {
  profiler(ProfilerEvent.DeferBlockStateStart);

  const stateTmplIndex = getTemplateIndexForState(newState, hostLView, tNode);

  if (stateTmplIndex !== null) {
    lDetails[DEFER_BLOCK_STATE] = newState;
    const hostTView = hostLView[TVIEW];
    const adjustedIndex = stateTmplIndex + HEADER_OFFSET;

    // 지연 블록에서 활성화될 템플릿을 나타내는 TNode입니다.
    const activeBlockTNode = getTNode(hostTView, adjustedIndex) as TContainerNode;

    // LContainer에는 지연 블록을 나타내는 뷰가 하나만 존재할 수 있으므로
    // 항상 첫 번째 뷰를 참조합니다.
    const viewIndex = 0;

    removeLViewFromLContainer(lContainer, viewIndex);

    let injector: Injector | undefined;
    if (newState === DeferBlockState.Complete) {
      // 지연 블록을 완료된 상태로 렌더링할 때,
      // 그 블록 내에서 사용되는 새로 로드된 독립 구성 요소가 있을 수 있으며,
      // 이는 공급자가 있는 NgModules를 가져올 수 있습니다.
      // 이러한 공급자를 해당 NgModule에 선언된 구성 요소에서 사용할 수 있도록,
      // 이러한 공급자를 호스팅할 환경 인젝터의 인스턴스를 생성하고
      // 이 인젝터를 뷰를 생성하는 로직에 전달합니다.
      const tDetails = getTDeferBlockDetails(hostTView, tNode);
      const providers = tDetails.providers;
      if (providers && providers.length > 0) {
        injector = createDeferBlockInjector(hostLView[INJECTOR], tDetails, providers);
      }
    }
    const {dehydratedView, dehydratedViewIx} = findMatchingDehydratedViewForDeferBlock(
      lContainer,
      lDetails,
    );

    const embeddedLView = createAndRenderEmbeddedLView(hostLView, activeBlockTNode, null, {
      injector,
      dehydratedView,
    });
    addLViewToLContainer(
      lContainer,
      embeddedLView,
      viewIndex,
      shouldAddViewToDom(activeBlockTNode, dehydratedView),
    );
    markViewDirty(embeddedLView, NotificationSource.DeferBlockStateUpdate);

    if (dehydratedViewIx > -1) {
      // 주어진 LContainer에서 탈수된 뷰 정보를 지우고,
      // 해당 뷰가 후처리 정리 과정에서 나중에 제거되지 않도록 합니다
      // (해당 과정은 컴포넌트 트리의 모든 탈수된 뷰를 반복합니다).
      // 이는 해당 렌더에 대해 검색된 탈수된 뷰만 지우고,
      // 대부분의 경우에는 유일한 뷰가 될 것입니다.
      // 제어 흐름이 변경된 경우, 해당하는 뷰가 하나 이상 있을 수 있으며,
      // 서버에서 렌더링된 내용이 제어 흐름의 다른 분기에 있기 때문에 일치하지 않을 수 있습니다.
      lContainer[DEHYDRATED_VIEWS]?.splice(dehydratedViewIx, 1);
    }

    if (
      (newState === DeferBlockState.Complete || newState === DeferBlockState.Error) &&
      Array.isArray(lDetails[ON_COMPLETE_FNS])
    ) {
      for (const callback of lDetails[ON_COMPLETE_FNS]) {
        callback();
      }
      lDetails[ON_COMPLETE_FNS] = null;
    }
  }

  profiler(ProfilerEvent.DeferBlockStateEnd);
}

/**
 * 타이머 기반 스케줄링을 사용하여 `applyDeferBlockState`를 확장합니다.
 * 이 함수는 `@loading` 또는 `@placeholder` 블록의 `after` 또는 `minimum` 매개변수를 사용하는 지연 블록이 있는 페이지에서 사용할 수 있습니다.
 */
function applyDeferBlockStateWithScheduling(
  newState: DeferBlockState,
  lDetails: LDeferBlockDetails,
  lContainer: LContainer,
  tNode: TNode,
  hostLView: LView<unknown>,
) {
  const now = Date.now();
  const hostTView = hostLView[TVIEW];
  const tDetails = getTDeferBlockDetails(hostTView, tNode);

  if (lDetails[STATE_IS_FROZEN_UNTIL] === null || lDetails[STATE_IS_FROZEN_UNTIL] <= now) {
    lDetails[STATE_IS_FROZEN_UNTIL] = null;

    const loadingAfter = getLoadingBlockAfter(tDetails);
    const inLoadingAfterPhase = lDetails[LOADING_AFTER_CLEANUP_FN] !== null;
    if (newState === DeferBlockState.Loading && loadingAfter !== null && !inLoadingAfterPhase) {
      // 로딩을 렌더링하려고 하지만 `after` 구성 항목이 있습니다.
      // 따라서 타임아웃 후 업데이트 작업을 예약합니다.
      lDetails[NEXT_DEFER_BLOCK_STATE] = newState;
      const cleanupFn = scheduleDeferBlockUpdate(
        loadingAfter,
        lDetails,
        tNode,
        lContainer,
        hostLView,
      );
      lDetails[LOADING_AFTER_CLEANUP_FN] = cleanupFn;
    } else {
      // 완료 또는 오류 상태로 전환하고, 타임아웃 후 로딩을 렌더링하기 위한 보류 작업이 있는 경우,
      // 타이머를 정지하는 클린업 작업을 호출합니다.
      if (newState > DeferBlockState.Loading && inLoadingAfterPhase) {
        lDetails[LOADING_AFTER_CLEANUP_FN]!();
        lDetails[LOADING_AFTER_CLEANUP_FN] = null;
        lDetails[NEXT_DEFER_BLOCK_STATE] = null;
      }

      applyDeferBlockState(newState, lDetails, lContainer, tNode, hostLView);

      const duration = getMinimumDurationForState(tDetails, newState);
      if (duration !== null) {
        lDetails[STATE_IS_FROZEN_UNTIL] = now + duration;
        scheduleDeferBlockUpdate(duration, lDetails, tNode, lContainer, hostLView);
      }
    }
  } else {
    // 여전히 이전 상태를 렌더링하고 있습니다.
    // 다음 상태로 전환할 때 잡을 수 있는 `NEXT_DEFER_BLOCK_STATE`를 업데이트합니다.
    lDetails[NEXT_DEFER_BLOCK_STATE] = newState;
  }
}

/**
 * 지정된 타임아웃 후 업데이트 작업을 예약합니다.
 */
function scheduleDeferBlockUpdate(
  timeout: number,
  lDetails: LDeferBlockDetails,
  tNode: TNode,
  lContainer: LContainer,
  hostLView: LView<unknown>,
): VoidFunction {
  const callback = () => {
    const nextState = lDetails[NEXT_DEFER_BLOCK_STATE];
    lDetails[STATE_IS_FROZEN_UNTIL] = null;
    lDetails[NEXT_DEFER_BLOCK_STATE] = null;
    if (nextState !== null) {
      renderDeferBlockState(nextState, tNode, lContainer);
    }
  };
  return scheduleTimerTrigger(timeout, callback, hostLView[INJECTOR]);
}

/**
 * 다음 상태로 전환할 수 있는지 확인합니다.
 *
 * 이전 상태가 다음 상태보다 작은 숫자로 표시된 경우 다음 상태로 전환합니다.
 * 예를 들어 현재 상태가 "로딩"( `1`로 표시됨)인 경우,
 * 우리는 플레이스홀더( `0`으로 표시됨)를 보여서는 안 되지만
 * 완료된 상태( `2`로 표시됨) 또는 오류 상태( `3`로 표시됨)을 보여줄 수 있습니다.
 */
function isValidStateChange(
  currentState: DeferBlockState | DeferBlockInternalState,
  newState: DeferBlockState,
): boolean {
  return currentState < newState;
}

/** 플레이스홀더 콘텐츠를 렌더링하는 유틸리티 함수(있는 경우) */
export function renderPlaceholder(lView: LView, tNode: TNode) {
  const lContainer = lView[tNode.index];
  ngDevMode && assertLContainer(lContainer);

  renderDeferBlockState(DeferBlockState.Placeholder, tNode, lContainer);
}

/**
 * "로딩" Promise에 구독하고 로딩 결과에 따라 해당 지연 하위 블록을 렌더링합니다.
 *
 * @param lContainer 지연 블록의 인스턴스를 나타냅니다.
 * @param tNode 모든 인스턴스에서 공유되는 지연 블록 정보를 나타냅니다.
 */
export function renderDeferStateAfterResourceLoading(
  tDetails: TDeferBlockDetails,
  tNode: TNode,
  lContainer: LContainer,
) {
  ngDevMode &&
    assertDefined(tDetails.loadingPromise, '이 지연 블록에 로딩 Promise가 존재해야 합니다.');

  tDetails.loadingPromise!.then(() => {
    if (tDetails.loadingState === DeferDependenciesLoadingState.COMPLETE) {
      ngDevMode && assertDeferredDependenciesLoaded(tDetails);

      // 모든 것이 로드되었습니다. 기본 블록 콘텐츠를 표시합니다.
      renderDeferBlockState(DeferBlockState.Complete, tNode, lContainer);
    } else if (tDetails.loadingState === DeferDependenciesLoadingState.FAILED) {
      renderDeferBlockState(DeferBlockState.Error, tNode, lContainer);
    }
  });
}

/**
 * 지연 블록 상태 렌더링 방법의 타이머 기반 스케줄러 구현에 대한 참조입니다.
 * 타이머 기반 스케줄링을 트리-쉐이커블하게 만들기 위해 사용됩니다.
 * `minimum` 또는 `after` 매개변수가 사용되면 컴파일러는
 * 타이머 기반 구현을 참조하는 `ɵɵdefer` 명령어의 추가 인수를 생성합니다.
 */
let applyDeferBlockStateWithSchedulingImpl: typeof applyDeferBlockState | null = null;

/**
 * `@loading` 또는 `@placeholder` 블록에 `after` 또는 `minimum` 매개변수가 설정된 경우
 * 타이머 관련 스케줄링을 활성화합니다.
 */
export function ɵɵdeferEnableTimerScheduling(
  tView: TView,
  tDetails: TDeferBlockDetails,
  placeholderConfigIndex?: number | null,
  loadingConfigIndex?: number | null,
) {
  const tViewConsts = tView.consts;
  if (placeholderConfigIndex != null) {
    tDetails.placeholderBlockConfig = getConstant<DeferredPlaceholderBlockConfig>(
      tViewConsts,
      placeholderConfigIndex,
    );
  }
  if (loadingConfigIndex != null) {
    tDetails.loadingBlockConfig = getConstant<DeferredLoadingBlockConfig>(
      tViewConsts,
      loadingConfigIndex,
    );
  }

  // 타이머 기반 스케줄링을 지원하는 구현을 활성화합니다.
  if (applyDeferBlockStateWithSchedulingImpl === null) {
    applyDeferBlockStateWithSchedulingImpl = applyDeferBlockStateWithScheduling;
  }
}
