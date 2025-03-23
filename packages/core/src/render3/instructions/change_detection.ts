/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  consumerAfterComputation,
  consumerBeforeComputation,
  consumerDestroy,
  consumerPollProducersForChange,
  getActiveConsumer,
  ReactiveNode,
} from '@angular/core/primitives/signals';

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {assertDefined, assertEqual} from '../../util/assert';
import {addAfterRenderSequencesForView} from '../after_render/view';
import {executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags} from '../hooks';
import {CONTAINER_HEADER_OFFSET, LContainerFlags, MOVED_VIEWS} from '../interfaces/container';
import {ComponentTemplate, HostBindingsFunction, RenderFlags} from '../interfaces/definition';
import {
  CONTEXT,
  EFFECTS_TO_SCHEDULE,
  ENVIRONMENT,
  FLAGS,
  InitPhaseState,
  LView,
  LViewFlags,
  REACTIVE_TEMPLATE_CONSUMER,
  TVIEW,
  TView,
} from '../interfaces/view';
import {
  getOrBorrowReactiveLViewConsumer,
  getOrCreateTemporaryConsumer,
  maybeReturnReactiveLViewConsumer,
  ReactiveLViewConsumer,
  viewShouldHaveReactiveConsumer,
} from '../reactive_lview_consumer';
import {
  CheckNoChangesMode,
  enterView,
  isExhaustiveCheckNoChanges,
  isInCheckNoChangesMode,
  isRefreshingViews,
  leaveView,
  setBindingIndex,
  setBindingRootForHostBindings,
  setIsInCheckNoChangesMode,
  setIsRefreshingViews,
  setSelectedIndex,
} from '../state';
import {getFirstLContainer, getNextLContainer} from '../util/view_traversal_utils';
import {
  getComponentLViewByIndex,
  isCreationMode,
  markAncestorsForTraversal,
  markViewForRefresh,
  requiresRefreshOrTraversal,
  resetPreOrderHookFlags,
  viewAttachedToChangeDetector,
} from '../util/view_utils';

import {isDestroyed} from '../interfaces/type_checks';
import {profiler} from '../profiler';
import {ProfilerEvent} from '../profiler_types';
import {executeViewQueryFn, refreshContentQueries} from '../queries/query_execution';
import {runEffectsInView} from '../reactivity/view_effect_runner';
import {executeTemplate} from './shared';

/**
 * 변경 감지 순회가 오류를 던지기 전에 다시 실행될 최대 횟수입니다.
 */
export const MAXIMUM_REFRESH_RERUNS = 100;

export function detectChangesInternal(lView: LView, mode = ChangeDetectionMode.Global) {
  const environment = lView[ENVIRONMENT];
  const rendererFactory = environment.rendererFactory;

  // 변화 없음 모드는 바인딩이 할당된 이후로 변화가 없음을 확인하기 위해
  // 개발 모드에서만 사용됩니다. 해당 모드에서는 렌더러 팩토리 함수가 호출되는 것을
  // 원하지 않습니다. 가능한 부작용을 피하기 위해서입니다.
  const checkNoChangesMode = !!ngDevMode && isInCheckNoChangesMode();

  if (!checkNoChangesMode) {
    rendererFactory.begin?.();
  }

  try {
    detectChangesInViewWhileDirty(lView, mode);
  } finally {
    if (!checkNoChangesMode) {
      rendererFactory.end?.();
    }
  }
}

function detectChangesInViewWhileDirty(lView: LView, mode: ChangeDetectionMode) {
  const lastIsRefreshingViewsValue = isRefreshingViews();
  try {
    setIsRefreshingViews(true);
    detectChangesInView(lView, mode);

    // 만약 전체 검사를 하고 있는 상태에서 변화가 없다면
    // 모든 뷰를 이미 순회했으므로 변화가 없으므 다음 패스를 진행할 필요가 없습니다.
    if (ngDevMode && isExhaustiveCheckNoChanges()) {
      return;
    }

    let retries = 0;
    // 변경 감지 후 이 뷰가 여전히 새로 고침이 필요하거나 후손 뷰가
    // 재더러터링으로 인해 새로 고침이 필요한 경우, 다시 변경 사항을 감지합니다.
    // `Targeted` 모드에서 변경 감지를 실행하여 `RefreshView` 플래그가
    // 있는 뷰만 새로 고칩니다.
    while (requiresRefreshOrTraversal(lView)) {
      if (retries === MAXIMUM_REFRESH_RERUNS) {
        throw new RuntimeError(
          RuntimeErrorCode.INFINITE_CHANGE_DETECTION,
          ngDevMode &&
            '뷰 새로 고침 중 무한 변경 감지. ' +
              '서로 새로 고침을 요구하는 컴포넌트가 있을 수 있으며, ' +
              '무한 루프를 발생시킵니다.',
        );
      }
      retries++;
      detectChangesInView(lView, ChangeDetectionMode.Targeted);
    }
  } finally {
    // 변경 감지 루프에 들어가기 전의 상태로 복원합니다.
    setIsRefreshingViews(lastIsRefreshingViewsValue);
  }
}

export function checkNoChangesInternal(lView: LView, mode: CheckNoChangesMode) {
  setIsInCheckNoChangesMode(mode);
  try {
    detectChangesInternal(lView);
  } finally {
    setIsInCheckNoChangesMode(CheckNoChangesMode.Off);
  }
}

/**
 * 변경 감지 중 논리적 뷰 트리를 순회하는 다양한 모드입니다.
 *
 *
 * 변화 감지 순회 알고리즘은 다양한 조건에 따라 이러한 모드 사이를 전환합니다.
 */
export const enum ChangeDetectionMode {
  /**
   * `Global` 모드에서 `Dirty` 및 `CheckAlways` 뷰뿐만 아니라
   * `RefreshView` 플래그가 있는 뷰가 새로 고쳐집니다.
   */
  Global,
  /**
   * `Targeted` 모드에서는 `RefreshView` 플래그가 있거나 업데이트된 신호가 있는 뷰만 새로 고쳐집니다.
   */
  Targeted,
}

/**
 * 업데이트 모드에서 뷰를 처리합니다. 여기에는 특정 순서의 여러 단계가 포함됩니다:
 * - 업데이트 모드에서 템플릿 함수 실행;
 * - 후크 실행;
 * - 쿼리 새로 고침;
 * - 호스트 바인딩 설정;
 * - 자식(내장 및 컴포넌트) 뷰 새로 고침.
 */

export function refreshView<T>(
  tView: TView,
  lView: LView,
  templateFn: ComponentTemplate<{}> | null,
  context: T,
) {
  ngDevMode && assertEqual(isCreationMode(lView), false, '업데이트 모드에서 실행되어야 합니다.');

  if (isDestroyed(lView)) return;

  const flags = lView[FLAGS];

  // 변화 없음 모드는 바인딩이 할당된 이후로 변화가 없음을 확인하기 위해
  // 개발 모드에서만 사용됩니다. 해당 모드에서는 생명주기 후크를 실행하고 싶지 않습니다.
  const isInCheckNoChangesPass = ngDevMode && isInCheckNoChangesMode();
  const isInExhaustiveCheckNoChangesPass = ngDevMode && isExhaustiveCheckNoChanges();

  // 컴포넌트 반응형 컨텍스트 시작
  // - 이 호스트의 내장 뷰라면 이미 반응형 컨텍스트에 있을 수 있습니다.
  // - 소비자가 필요한 뷰로 내려갈 수 있습니다.
  enterView(lView);
  let returnConsumerToPool = true;
  let prevConsumer: ReactiveNode | null = null;
  let currentConsumer: ReactiveLViewConsumer | null = null;
  if (!isInCheckNoChangesPass) {
    if (viewShouldHaveReactiveConsumer(tView)) {
      currentConsumer = getOrBorrowReactiveLViewConsumer(lView);
      prevConsumer = consumerBeforeComputation(currentConsumer);
    } else if (getActiveConsumer() === null) {
      returnConsumerToPool = false;
      currentConsumer = getOrCreateTemporaryConsumer(lView);
      prevConsumer = consumerBeforeComputation(currentConsumer);
    } else if (lView[REACTIVE_TEMPLATE_CONSUMER]) {
      consumerDestroy(lView[REACTIVE_TEMPLATE_CONSUMER]);
      lView[REACTIVE_TEMPLATE_CONSUMER] = null;
    }
  }

  try {
    resetPreOrderHookFlags(lView);

    setBindingIndex(tView.bindingStartIndex);
    if (templateFn !== null) {
      executeTemplate(tView, lView, templateFn, RenderFlags.Update, context);
    }

    const hooksInitPhaseCompleted =
      (flags & LViewFlags.InitPhaseStateMask) === InitPhaseState.InitPhaseCompleted;

    // 사전 순회 후크 실행 (OnInit, OnChanges, DoCheck)
    // 성능 경고: 이 함수는 분리하여 추출하지 마십시오. 벤치마크를 실행하지 않고.
    if (!isInCheckNoChangesPass) {
      if (hooksInitPhaseCompleted) {
        const preOrderCheckHooks = tView.preOrderCheckHooks;
        if (preOrderCheckHooks !== null) {
          executeCheckHooks(lView, preOrderCheckHooks, null);
        }
      } else {
        const preOrderHooks = tView.preOrderHooks;
        if (preOrderHooks !== null) {
          executeInitAndCheckHooks(lView, preOrderHooks, InitPhaseState.OnInitHooksToBeRun, null);
        }
        incrementInitPhaseFlags(lView, InitPhaseState.OnInitHooksToBeRun);
      }
    }

    // 전체 검사를 수행할 때 이식된 뷰를 새로 고침할 필요가 없습니다.
    if (!isInExhaustiveCheckNoChangesPass) {
      markTransplantedViewsForRefresh(lView);
    }
    runEffectsInView(lView);
    detectChangesInEmbeddedViews(lView, ChangeDetectionMode.Global);

    // 콘텐츠 쿼리 결과는 콘텐츠 후크가 호출되기 전에 새로 고쳐야 합니다.
    if (tView.contentQueries !== null) {
      refreshContentQueries(tView, lView);
    }

    // 콘텐츠 후크 실행 (AfterContentInit, AfterContentChecked)
    // 성능 경고: 이 함수를 분리하여 추출하지 마십시오. 벤치마크를 실행하지 않고.
    if (!isInCheckNoChangesPass) {
      if (hooksInitPhaseCompleted) {
        const contentCheckHooks = tView.contentCheckHooks;
        if (contentCheckHooks !== null) {
          executeCheckHooks(lView, contentCheckHooks);
        }
      } else {
        const contentHooks = tView.contentHooks;
        if (contentHooks !== null) {
          executeInitAndCheckHooks(
            lView,
            contentHooks,
            InitPhaseState.AfterContentInitHooksToBeRun,
          );
        }
        incrementInitPhaseFlags(lView, InitPhaseState.AfterContentInitHooksToBeRun);
      }
    }

    processHostBindingOpCodes(tView, lView);

    // 자식 컴포넌트 뷰 새로 고침.
    const components = tView.components;
    if (components !== null) {
      detectChangesInChildComponents(lView, components, ChangeDetectionMode.Global);
    }

    // 뷰 쿼리는 자식 컴포넌트를 새로 고친 후에 실행되어야 합니다.
    const viewQuery = tView.viewQuery;
    if (viewQuery !== null) {
      executeViewQueryFn<T>(RenderFlags.Update, viewQuery, context);
    }

    // 뷰 후크 실행 (AfterViewInit, AfterViewChecked)
    // 성능 경고: 이 함수를 분리하여 추출하지 마십시오. 벤치마크를 실행하지 않고.
    if (!isInCheckNoChangesPass) {
      if (hooksInitPhaseCompleted) {
        const viewCheckHooks = tView.viewCheckHooks;
        if (viewCheckHooks !== null) {
          executeCheckHooks(lView, viewCheckHooks);
        }
      } else {
        const viewHooks = tView.viewHooks;
        if (viewHooks !== null) {
          executeInitAndCheckHooks(lView, viewHooks, InitPhaseState.AfterViewInitHooksToBeRun);
        }
        incrementInitPhaseFlags(lView, InitPhaseState.AfterViewInitHooksToBeRun);
      }
    }
    if (tView.firstUpdatePass === true) {
      tView.firstUpdatePass = false;
    }

    // 이 뷰의 업데이트 패스에서 기다리는 효과를 예약합니다.
    if (lView[EFFECTS_TO_SCHEDULE]) {
      for (const notifyEffect of lView[EFFECTS_TO_SCHEDULE]) {
        notifyEffect();
      }

      // Once they've been run, we can drop the array.
      lView[EFFECTS_TO_SCHEDULE] = null;
    }

    // Do not reset the dirty state when running in check no changes mode. We don't want components
    // to behave differently depending on whether check no changes is enabled or not. For example:
    // Marking an OnPush component as dirty from within the `ngAfterViewInit` hook in order to
    // refresh a `NgClass` binding should work. If we would reset the dirty state in the check
    // no changes cycle, the component would be not be dirty for the next update pass. This would
    // be different in production mode where the component dirty state is not reset.
    if (!isInCheckNoChangesPass) {
      addAfterRenderSequencesForView(lView);

      lView[FLAGS] &= ~(LViewFlags.Dirty | LViewFlags.FirstLViewPass);
    }
  } catch (e) {
    if (!isInCheckNoChangesPass) {
      // If refreshing a view causes an error, we need to remark the ancestors as needing traversal
      // because the error might have caused a situation where views below the current location are
      // dirty but will be unreachable because the "has dirty children" flag in the ancestors has been
      // cleared during change detection and we failed to run to completion.
      markAncestorsForTraversal(lView);
    }
    throw e;
  } finally {
    if (currentConsumer !== null) {
      consumerAfterComputation(currentConsumer, prevConsumer);
      if (returnConsumerToPool) {
        maybeReturnReactiveLViewConsumer(currentConsumer);
      }
    }
    leaveView();
  }
}

/**
 * 내장 뷰 (ViewContainerRef API를 통해 생성된 뷰)를 순회하고
 * 관련 템플릿 함수를 실행하여 새로 고칩니다.
 */
function detectChangesInEmbeddedViews(lView: LView, mode: ChangeDetectionMode) {
  for (
    let lContainer = getFirstLContainer(lView);
    lContainer !== null;
    lContainer = getNextLContainer(lContainer)
  ) {
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
      const embeddedLView = lContainer[i];
      detectChangesInViewIfAttached(embeddedLView, mode);
    }
  }
}

/**
 * 이식된 뷰를 해당 부착 지점에서 새로 고쳐야 함으로 표시합니다.
 *
 * @param lView 이식된 뷰를 가질 수 있는 `LView`.
 */
function markTransplantedViewsForRefresh(lView: LView) {
  for (
    let lContainer = getFirstLContainer(lView);
    lContainer !== null;
    lContainer = getNextLContainer(lContainer)
  ) {
    if (!(lContainer[FLAGS] & LContainerFlags.HasTransplantedViews)) continue;

    const movedViews = lContainer[MOVED_VIEWS]!;
    ngDevMode && assertDefined(movedViews, '이식된 뷰 플래그 설정되었지만 MOVED_VIEWS가 없음');
    for (let i = 0; i < movedViews.length; i++) {
      const movedLView = movedViews[i]!;
      markViewForRefresh(movedLView);
    }
  }
}

/**
 * 컴포넌트 뷰에 들어가 바인딩, 쿼리 등을 처리하면서
 * CheckAlways, OnPush 및 Dirty 등일 경우 변경을 감지합니다.
 *
 * @param componentHostIdx  LView[]의 요소 인덱스 (HEADER_OFFSET에 대해 조정됨)
 */
function detectChangesInComponent(
  hostLView: LView,
  componentHostIdx: number,
  mode: ChangeDetectionMode,
): void {
  ngDevMode &&
    assertEqual(isCreationMode(hostLView), false, '업데이트 모드에서 실행되어야 합니다.');
  profiler(ProfilerEvent.ComponentStart);

  const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
  detectChangesInViewIfAttached(componentView, mode);

  profiler(ProfilerEvent.ComponentEnd, componentView[CONTEXT] as any as {});
}

/**
 * 변경 감지 순회의 일환으로 뷰를 방문합니다.
 *
 * 뷰가 분리된 경우 추가 순회가 발생하지 않습니다.
 */
function detectChangesInViewIfAttached(lView: LView, mode: ChangeDetectionMode) {
  if (!viewAttachedToChangeDetector(lView)) {
    return;
  }
  detectChangesInView(lView, mode);
}

/**
 * 변경 감지 순회의 일환으로 뷰를 방문합니다.
 *
 * 뷰가 새로 고쳐지는 조건:
 * - 뷰가 CheckAlways 또는 Dirty이고 변화 감지 모드가 `Global`인 경우
 * - 뷰에 `RefreshView` 플래그가 있는 경우
 *
 * 뷰가 새로 고쳐지지 않지만 후손은 `ChangeDetectionMode.Targeted`로 순회됩니다.
 */
function detectChangesInView(lView: LView, mode: ChangeDetectionMode) {
  const isInCheckNoChangesPass = ngDevMode && isInCheckNoChangesMode();
  const tView = lView[TVIEW];
  const flags = lView[FLAGS];
  const consumer = lView[REACTIVE_TEMPLATE_CONSUMER];

  // 글로벌 모드에서 CheckAlways 뷰 새로 고침.
  let shouldRefreshView: boolean = !!(
    mode === ChangeDetectionMode.Global && flags & LViewFlags.CheckAlways
  );

  // 글로벌 모드에서 더러운 뷰를 새로 고침합니다. 다만 변화 없음 모두가 아닐 경우에만.
  shouldRefreshView ||= !!(
    flags & LViewFlags.Dirty &&
    mode === ChangeDetectionMode.Global &&
    !isInCheckNoChangesPass
  );

  // 새로 고침이 표시된 뷰는 모드와 관계없이 항상 새로 고쳐집니다.
  shouldRefreshView ||= !!(flags & LViewFlags.RefreshView);

  // 더러운 반응형 소비자가 있을 경우 모드에 상관없이 새로 고침합니다.
  shouldRefreshView ||= !!(consumer?.dirty && consumerPollProducersForChange(consumer));

  shouldRefreshView ||= !!(ngDevMode && isExhaustiveCheckNoChanges());

  // 컴포넌트를 새로 고치기 전에 플래그와 `ReactiveNode`를 더럽혀지지 않도록 설정합니다.
  if (consumer) {
    consumer.dirty = false;
  }
  lView[FLAGS] &= ~(LViewFlags.HasChildViewsToRefresh | LViewFlags.RefreshView);

  if (shouldRefreshView) {
    refreshView(tView, lView, tView.template, lView[CONTEXT]);
  } else if (flags & LViewFlags.HasChildViewsToRefresh) {
    if (!isInCheckNoChangesPass) {
      runEffectsInView(lView);
    }
    detectChangesInEmbeddedViews(lView, ChangeDetectionMode.Targeted);
    const components = tView.components;
    if (components !== null) {
      detectChangesInChildComponents(lView, components, ChangeDetectionMode.Targeted);
    }
    if (!isInCheckNoChangesPass) {
      addAfterRenderSequencesForView(lView);
    }
  }
}

/** 현재 뷰 내의 자식 컴포넌트를 새로 고칩니다 (업데이트 모드). */
function detectChangesInChildComponents(
  hostLView: LView,
  components: number[],
  mode: ChangeDetectionMode,
): void {
  for (let i = 0; i < components.length; i++) {
    detectChangesInComponent(hostLView, components[i], mode);
  }
}

/**
 * 뷰에 대한 `HostBindingsFunction` 호출합니다.
 *
 * 이 메서드는 `TView.hostBindingOpCodes`를 실행합니다.
 * 현재 `LView`와 관련된 `HostBindingsFunction`을 실행하는 데 사용됩니다.
 *
 * @param tView 현재 `TView`.
 * @param lView 현재 `LView`.
 */
function processHostBindingOpCodes(tView: TView, lView: LView): void {
  const hostBindingOpCodes = tView.hostBindingOpCodes;
  if (hostBindingOpCodes === null) return;
  try {
    for (let i = 0; i < hostBindingOpCodes.length; i++) {
      const opCode = hostBindingOpCodes[i] as number;
      if (opCode < 0) {
        // 음수는 요소 인덱스입니다.
        setSelectedIndex(~opCode);
      } else {
        // 양수는 NumberTuple로 바인딩 루트 인덱스 및 지시자 인덱스를 저장합니다.
        const directiveIdx = opCode;
        const bindingRootIndx = hostBindingOpCodes[++i] as number;
        const hostBindingFn = hostBindingOpCodes[++i] as HostBindingsFunction<any>;
        setBindingRootForHostBindings(bindingRootIndx, directiveIdx);
        const context = lView[directiveIdx];
        profiler(ProfilerEvent.HostBindingsUpdateStart, context);
        hostBindingFn(RenderFlags.Update, context);
        profiler(ProfilerEvent.HostBindingsUpdateEnd, context);
      }
    }
  } finally {
    setSelectedIndex(-1);
  }
}
