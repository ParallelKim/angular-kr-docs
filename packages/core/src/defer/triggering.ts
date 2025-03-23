/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {afterNextRender} from '../render3/after_render/hooks';
import {Injector} from '../di';
import {internalImportProvidersFrom} from '../di/provider_collection';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {
  cleanupHydratedDeferBlocks,
  cleanupLContainer,
  removeDehydratedViewList,
} from '../hydration/cleanup';
import {BlockSummary, ElementTrigger, NUM_ROOT_NODES} from '../hydration/interfaces';
import {
  assertSsrIdDefined,
  getParentBlockHydrationQueue,
  isIncrementalHydrationEnabled,
} from '../hydration/utils';
import {PendingTasksInternal} from '../pending_tasks';
import {assertLContainer} from '../render3/assert';
import {getComponentDef, getDirectiveDef, getPipeDef} from '../render3/def_getters';
import {getTemplateLocationDetails} from '../render3/instructions/element_validation';
import {handleUncaughtError} from '../render3/instructions/shared';
import {DirectiveDefList, PipeDefList} from '../render3/interfaces/definition';
import {TNode} from '../render3/interfaces/node';
import {INJECTOR, LView, TView, TVIEW} from '../render3/interfaces/view';
import {getCurrentTNode, getLView} from '../render3/state';
import {throwError} from '../util/assert';
import {
  invokeAllTriggerCleanupFns,
  invokeTriggerCleanupFns,
  storeTriggerCleanupFn,
} from './cleanup';
import {onViewport} from './dom_triggers';
import {onIdle} from './idle_scheduler';
import {
  DEFER_BLOCK_STATE,
  DeferBlockBehavior,
  DeferBlockState,
  DeferBlockTrigger,
  DeferDependenciesLoadingState,
  DehydratedDeferBlock,
  HydrateTriggerDetails,
  LDeferBlockDetails,
  ON_COMPLETE_FNS,
  SSR_UNIQUE_ID,
  TDeferBlockDetails,
  TDeferDetailsFlags,
  TriggerType,
} from './interfaces';
import {DEHYDRATED_BLOCK_REGISTRY, DehydratedBlockRegistry} from './registry';
import {
  DEFER_BLOCK_CONFIG,
  DEFER_BLOCK_DEPENDENCY_INTERCEPTOR,
  renderDeferBlockState,
  renderDeferStateAfterResourceLoading,
  renderPlaceholder,
} from './rendering';
import {onTimer} from './timer_scheduler';
import {
  addDepsToRegistry,
  assertDeferredDependenciesLoaded,
  getLDeferBlockDetails,
  getPrimaryBlockTNode,
  getTDeferBlockDetails,
} from './utils';
import {ApplicationRef} from '../application/application_ref';
import {DEHYDRATED_VIEWS} from '../render3/interfaces/container';

/**
 * 일정 지연 트리거를 예약합니다. `idle` 및 `timer` 조건에 대해.
 */
export function scheduleDelayedTrigger(
  scheduleFn: (callback: VoidFunction, injector: Injector) => VoidFunction,
) {
  const lView = getLView();
  const tNode = getCurrentTNode()!;

  renderPlaceholder(lView, tNode);

  // 서버에서 불필요하게 직렬화를 지연할 수 있는 `setTimeout` 호출을 추가하지 않도록
  // `scheduleFn`을 호출하지 않고 조기 종료합니다.
  if (!shouldTriggerDeferBlock(TriggerType.Regular, lView)) return;

  const injector = lView[INJECTOR];
  const lDetails = getLDeferBlockDetails(lView, tNode);

  const cleanupFn = scheduleFn(
    () => triggerDeferBlock(TriggerType.Regular, lView, tNode),
    injector,
  );
  storeTriggerCleanupFn(TriggerType.Regular, lDetails, cleanupFn);
}

/**
 * `idle` 및 `timer` 트리거에 대한 미리 가져오기를 예약합니다.
 *
 * @param scheduleFn 일정을 잡는 함수입니다.
 */
export function scheduleDelayedPrefetching(
  scheduleFn: (callback: VoidFunction, injector: Injector) => VoidFunction,
  trigger: DeferBlockTrigger,
) {
  if (typeof ngServerMode !== 'undefined' && ngServerMode) return;

  const lView = getLView();
  const injector = lView[INJECTOR];

  // 서버 응답을 지연시키고 싶지 않기 때문에 브라우저에서만 예약된 트리거를 실행합니다.
  const tNode = getCurrentTNode()!;
  const tView = lView[TVIEW];
  const tDetails = getTDeferBlockDetails(tView, tNode);

  if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
    const lDetails = getLDeferBlockDetails(lView, tNode);
    const prefetch = () => triggerPrefetching(tDetails, lView, tNode);
    const cleanupFn = scheduleFn(prefetch, injector);
    storeTriggerCleanupFn(TriggerType.Prefetch, lDetails, cleanupFn);
  }
}

/**
 * `idle` 및 `timer` 조건에 대한 수분 트리거를 예약합니다.
 */
export function scheduleDelayedHydrating(
  scheduleFn: (callback: VoidFunction, injector: Injector) => VoidFunction,
  lView: LView,
  tNode: TNode,
) {
  if (typeof ngServerMode !== 'undefined' && ngServerMode) return;

  // 서버 응답을 지연시키고 싶지 않기 때문에 브라우저에서만 예약된 트리거를 실행합니다.
  const injector = lView[INJECTOR];
  const lDetails = getLDeferBlockDetails(lView, tNode);
  const ssrUniqueId = lDetails[SSR_UNIQUE_ID]!;
  ngDevMode && assertSsrIdDefined(ssrUniqueId);

  const cleanupFn = scheduleFn(
    () => triggerHydrationFromBlockName(injector, ssrUniqueId),
    injector,
  );
  storeTriggerCleanupFn(TriggerType.Hydrate, lDetails, cleanupFn);
}

/**
 * 지연 블록에 대한 의존성의 미리 가져오기를 트리거합니다.
 *
 * @param tDetails 이 지연 블록 대한 정적 정보입니다.
 * @param lView 호스트 뷰의 LView입니다.
 * @param tNode 지연 블록을 나타내는 TNode입니다.
 */
export function triggerPrefetching(tDetails: TDeferBlockDetails, lView: LView, tNode: TNode) {
  triggerResourceLoading(tDetails, lView, tNode);
}

/**
 * 프로세스가 아직 시작되지 않은 경우 지연 블록 의존성을 로드하는 트리거를 트리거합니다.
 *
 * @param tDetails 이 지연 블록 대한 정적 정보입니다.
 * @param lView 호스트 뷰의 LView입니다.
 */
export function triggerResourceLoading(
  tDetails: TDeferBlockDetails,
  lView: LView,
  tNode: TNode,
): Promise<unknown> {
  const injector = lView[INJECTOR];
  const tView = lView[TVIEW];

  if (tDetails.loadingState !== DeferDependenciesLoadingState.NOT_STARTED) {
    // 로딩 상태가 초기 상태와 다른 경우 의존성 로딩 중이며
    // 이 함수에서 수행할 작업이 없습니다.
    return tDetails.loadingPromise ?? Promise.resolve();
  }

  const lDetails = getLDeferBlockDetails(lView, tNode);
  const primaryBlockTNode = getPrimaryBlockTNode(tView, tDetails);

  // NOT_STARTED에서 IN_PROGRESS 상태로 전환합니다.
  tDetails.loadingState = DeferDependenciesLoadingState.IN_PROGRESS;

  // 미리 가져오기가 트리거되면 등록된 모든 미리 가져오기 트리거를 정리합니다.
  invokeTriggerCleanupFns(TriggerType.Prefetch, lDetails);

  let dependenciesFn = tDetails.dependencyResolverFn;

  if (ngDevMode) {
    // 의존성 함수 인터셉터가 구성되어 있는지 확인합니다.
    const deferDependencyInterceptor = injector.get(DEFER_BLOCK_DEPENDENCY_INTERCEPTOR, null, {
      optional: true,
    });

    if (deferDependencyInterceptor) {
      dependenciesFn = deferDependencyInterceptor.intercept(dependenciesFn);
    }
  }

  // 애플리케이션이 안정적이지 않고 보류 중인 작업이 있음을 표시합니다.
  const pendingTasks = injector.get(PendingTasksInternal);
  const taskId = pendingTasks.add();

  // `dependenciesFn`은 모든 의존성이 파일 내에서 미리 참조되었을 때
  // 동적 `import()`가 생성되지 않기 때문에 `null`일 수 있습니다.
  if (!dependenciesFn) {
    tDetails.loadingPromise = Promise.resolve().then(() => {
      tDetails.loadingPromise = null;
      tDetails.loadingState = DeferDependenciesLoadingState.COMPLETE;
      pendingTasks.remove(taskId);
    });
    return tDetails.loadingPromise;
  }

  // 지연 블록 의존성을 다운로드하기 시작합니다.
  tDetails.loadingPromise = Promise.allSettled(dependenciesFn()).then((results) => {
    let failed = false;
    const directiveDefs: DirectiveDefList = [];
    const pipeDefs: PipeDefList = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const dependency = result.value;
        const directiveDef = getComponentDef(dependency) || getDirectiveDef(dependency);
        if (directiveDef) {
          directiveDefs.push(directiveDef);
        } else {
          const pipeDef = getPipeDef(dependency);
          if (pipeDef) {
            pipeDefs.push(pipeDef);
          }
        }
      } else {
        failed = true;
        break;
      }
    }

    // 로딩이 완료되면 더 이상 로딩 약속이 필요하지 않으며
    // 보류 중인 작업도 제거되어야 합니다.
    tDetails.loadingPromise = null;
    pendingTasks.remove(taskId);

    if (failed) {
      tDetails.loadingState = DeferDependenciesLoadingState.FAILED;

      if (tDetails.errorTmplIndex === null) {
        const templateLocation = ngDevMode ? getTemplateLocationDetails(lView) : '';
        const error = new RuntimeError(
          RuntimeErrorCode.DEFER_LOADING_FAILED,
          ngDevMode &&
            'Loading dependencies for `@defer` block failed, ' +
              `but no \`@error\` block was configured${templateLocation}. ` +
              'Consider using the `@error` block to render an error state.',
        );
        handleUncaughtError(lView, error);
      }
    } else {
      tDetails.loadingState = DeferDependenciesLoadingState.COMPLETE;

      // 새로 다운로드된 의존성을 추가하기 위해 지시자 및 파이프 레지스트리를 업데이트합니다.
      const primaryBlockTView = primaryBlockTNode.tView!;
      if (directiveDefs.length > 0) {
        primaryBlockTView.directiveRegistry = addDepsToRegistry<DirectiveDefList>(
          primaryBlockTView.directiveRegistry,
          directiveDefs,
        );

        // 이 지연 블록 내에서 사용되는 독립형 구성 요소로 가져온 모든 NgModule에서 제공자를 추출합니다.
        const directiveTypes = directiveDefs.map((def) => def.type);
        const providers = internalImportProvidersFrom(false, ...directiveTypes);
        tDetails.providers = providers;
      }
      if (pipeDefs.length > 0) {
        primaryBlockTView.pipeRegistry = addDepsToRegistry<PipeDefList>(
          primaryBlockTView.pipeRegistry,
          pipeDefs,
        );
      }
    }
  });
  return tDetails.loadingPromise;
}

/**
 * 주어진 지연 블록을 트리거할지 여부를 정의합니다.
 */
function shouldTriggerDeferBlock(triggerType: TriggerType, lView: LView): boolean {
  // 서버에서 일반 트리거가 트리거되는 것을 방지합니다.
  if (triggerType === TriggerType.Regular && typeof ngServerMode !== 'undefined' && ngServerMode) {
    return false;
  }

  // 수동 지연 블록 구성으로 테스트 실행의 경우 트리거를 방지합니다.
  const injector = lView[INJECTOR];
  const config = injector.get(DEFER_BLOCK_CONFIG, null, {optional: true});
  if (config?.behavior === DeferBlockBehavior.Manual) {
    return false;
  }
  return true;
}

/**
 * 지연 블록 의존성을 로드하기 위한 트리거를 시도합니다.
 * 블록이 이미 로드 중이거나 완료되었거나 오류 상태인 경우 -
 * 추가 작업이 수행되지 않습니다.
 */
export function triggerDeferBlock(triggerType: TriggerType, lView: LView, tNode: TNode) {
  const tView = lView[TVIEW];
  const lContainer = lView[tNode.index];
  ngDevMode && assertLContainer(lContainer);

  if (!shouldTriggerDeferBlock(triggerType, lView)) return;

  const lDetails = getLDeferBlockDetails(lView, tNode);
  const tDetails = getTDeferBlockDetails(tView, tNode);

  // 지연 블록이 트리거되고 모든 등록된 트리거 함수를 정리합니다.
  invokeAllTriggerCleanupFns(lDetails);

  switch (tDetails.loadingState) {
    case DeferDependenciesLoadingState.NOT_STARTED:
      renderDeferBlockState(DeferBlockState.Loading, tNode, lContainer);
      triggerResourceLoading(tDetails, lView, tNode);

      // `loadingState`가 "로딩"으로 변경되었을 수 있습니다.
      if (
        (tDetails.loadingState as DeferDependenciesLoadingState) ===
        DeferDependenciesLoadingState.IN_PROGRESS
      ) {
        renderDeferStateAfterResourceLoading(tDetails, tNode, lContainer);
      }
      break;
    case DeferDependenciesLoadingState.IN_PROGRESS:
      renderDeferBlockState(DeferBlockState.Loading, tNode, lContainer);
      renderDeferStateAfterResourceLoading(tDetails, tNode, lContainer);
      break;
    case DeferDependenciesLoadingState.COMPLETE:
      ngDevMode && assertDeferredDependenciesLoaded(tDetails);
      renderDeferBlockState(DeferBlockState.Complete, tNode, lContainer);
      break;
    case DeferDependenciesLoadingState.FAILED:
      renderDeferBlockState(DeferBlockState.Error, tNode, lContainer);
      break;
    default:
      if (ngDevMode) {
        throwError('Unknown defer block state');
      }
  }
}

/**
 * 점진적 수분에 대한 핵심 메커니즘입니다. 이것은 수분이 필요한 모든 블록의 트리거를
 * 수행하거나 대기열을 설정하고 수분된 모든 블록을 추적합니다.
 *
 * 참고: `replayQueuedEventsFn`은 수분이 이벤트 재생의 결과로 호출될 때만 제공됩니다
 * (JsAction을 통해). `deferOnImmediate`와 같은 명령 집합에서 수분이 호출되면 -
 * 이벤트를 다시 재생할 필요가 없습니다.
 */
export async function triggerHydrationFromBlockName(
  injector: Injector,
  blockName: string,
  replayQueuedEventsFn?: Function,
) {
  const dehydratedBlockRegistry = injector.get(DEHYDRATED_BLOCK_REGISTRY);
  const blocksBeingHydrated = dehydratedBlockRegistry.hydrating;

  // 동일한 작업을 여러 번 수분 처리/트리거하지 않도록 합니다.
  if (blocksBeingHydrated.has(blockName)) {
    return;
  }

  // 큐에서 블록의 리소스 로딩 및 수분을 상위 블록의
  // 가장 높은 블록에서 가장 낮은 블록 순서로 트리거합니다. 블록이 리소스 로딩을 마치면
  // 수분이 완료된 후 다음 렌더링이 트리거됩니다. 새 블록은 지연 지시문이 호출되고 레지스트리에
  // 추가됩니다. 잠재적인 중첩 제어 흐름과 관련된 타이밍으로 인해 이 작업은 다음 렌더링 후에 예약해야 합니다.
  const {parentBlockPromise, hydrationQueue} = getParentBlockHydrationQueue(blockName, injector);
  if (hydrationQueue.length === 0) return;

  // 수분 대기열의 가장 상위 항목이 실제로 수분 처리 중일 수 있으며
  // 이미 약속이 있을 수 있습니다. 그런 경우 해당 약속을 파괴하고 다시 대기열에 추가하지 않습니다.
  if (parentBlockPromise !== null) {
    hydrationQueue.shift();
  }

  // 레지스트리의 수분 맵은 이미 수분 대기열에 있는 블록을
  // 재트리거하는 것을 방지합니다. 여기에서 수분 상태에 대한 약속을 생성합니다.
  populateHydratingStateForQueue(dehydratedBlockRegistry, hydrationQueue);

  // 이 약속을 대기하는 동안 동일한 블록에 대해 수분을 다시 트리거하는 것을 방지합니다.
  if (parentBlockPromise !== null) {
    await parentBlockPromise;
  }

  const topmostParentBlock = hydrationQueue[0];
  if (dehydratedBlockRegistry.has(topmostParentBlock)) {
    // 가장 상위 부모 블록이 이미 레지스트리에 있으므로
    // 수분을 진행할 수 있습니다.
    await triggerHydrationForBlockQueue(injector, hydrationQueue, replayQueuedEventsFn);
  } else {
    // 가장 상위 부모 블록이 아직 레지스트리에 없는 경우
    // 지연 로드된 경로일 수 있으며,
    // 제어 흐름 분기가 발생했거나
    // 경로가 이동되었을 수 있습니다. 따라서 수분 프로세스를 대기열에 추가해야 하므로
    // 첫 번째 블록의 지연 지시문이 실행된 후 완료될 수 있습니다.
    dehydratedBlockRegistry.awaitParentBlock(
      topmostParentBlock,
      async () =>
        await triggerHydrationForBlockQueue(injector, hydrationQueue, replayQueuedEventsFn),
    );
  }
}

/**
 * 점진적 수분에 대한 핵심 메커니즘입니다. 이것은 수분이 필요한 모든 블록의 트리거를
 * 수행하고 수분된 모든 블록을 추적합니다.
 *
 * 참고: `replayQueuedEventsFn`은 수분이 이벤트 재생의 결과로 호출될 때만 제공됩니다
 * (JsAction을 통해). `deferOnImmediate`와 같은 명령 집합에서 수분이 호출되면 -
 * 이벤트를 다시 재생할 필요가 없습니다.
 */
export async function triggerHydrationForBlockQueue(
  injector: Injector,
  hydrationQueue: string[],
  replayQueuedEventsFn?: Function,
): Promise<void> {
  const dehydratedBlockRegistry = injector.get(DEHYDRATED_BLOCK_REGISTRY);
  const blocksBeingHydrated = dehydratedBlockRegistry.hydrating;

  // 보류 중인 비동기 작업이 있음을 표시합니다.
  const pendingTasks = injector.get(PendingTasksInternal);
  const taskId = pendingTasks.add();

  // 실제로 대기열의 블록을 트리거하고 수분 처리합니다.
  for (let blockQueueIdx = 0; blockQueueIdx < hydrationQueue.length; blockQueueIdx++) {
    const dehydratedBlockId = hydrationQueue[blockQueueIdx];
    const dehydratedDeferBlock = dehydratedBlockRegistry.get(dehydratedBlockId);

    if (dehydratedDeferBlock != null) {
      // 리소스를 트리거하고 수분 처리를 위해 다음 렌더링을 대기합니다. 이는 다음 블록의
      // ɵɵdefer 지시문이 호출되고 해당 블록이 탈수된 레지스트리에 추가되는 것을 초래합니다.
      await triggerResourceLoadingForHydration(dehydratedDeferBlock);
      await nextRender(injector);

      // 서버 렌더링 이후 내용이 변경되었다면
      // 예상 블록이 레지스트리에 있는지 또는 오류가 발생했는지 확인해야 합니다.
      if (deferBlockHasErrored(dehydratedDeferBlock)) {
        // 예상 블록이 아직 ɵɵdefer 지시문이 호출되지 않았거나,
        // 리소스 가져오는 도중 오류가 발생했습니다. 전자의 경우
        // 너무 빨리 수분 처리 중이거나 클라이언트와 서버가 다를 수 있습니다.
        // 두 경우 모두 자식 콘텐츠 및 약속을 정리해야 합니다.
        removeDehydratedViewList(dehydratedDeferBlock);
        cleanupRemainingHydrationQueue(
          hydrationQueue.slice(blockQueueIdx),
          dehydratedBlockRegistry,
        );
        break;
      }
      // 지연 블록이 오류가 없고 리소스를 가져오고 렌더링을 완료했습니다.
      // 이 시점에서 수분 약속을 해결하는 것이 안전합니다.
      blocksBeingHydrated.get(dehydratedBlockId)!.resolve();
    } else {
      // 예상 블록이 아직 ɵɵdefer 지시문이 호출되지 않았습니다.
      // 이는 클라이언트와 서버 간의 콘텐츠 변경으로 인해 발생합니다.
      // 이제 더 이상 유효하지 않으므로 컨테이너에서 탈수된 DOM을 정리해야 합니다.
      cleanupParentContainer(blockQueueIdx, hydrationQueue, dehydratedBlockRegistry);
      cleanupRemainingHydrationQueue(hydrationQueue.slice(blockQueueIdx), dehydratedBlockRegistry);
      break;
    }
  }

  const lastBlockName = hydrationQueue[hydrationQueue.length - 1];

  // 마지막 블록의 수분 완료를 대기합니다.
  await blocksBeingHydrated.get(lastBlockName)?.promise;

  // 모든 비동기 작업이 완료되었으므로
  // 레지스트리에서 taskId를 제거합니다.
  pendingTasks.remove(taskId);

  // 대기 열에 있는 이벤트가 존재하고 재생 작업이 요청되었다면
  // 모든 대기 이벤트를 재생합니다.
  if (replayQueuedEventsFn) {
    replayQueuedEventsFn(hydrationQueue);
  }

  // 영향을 받는 모든 지연 블록의 수분 후 정리합니다.
  cleanupHydratedDeferBlocks(
    dehydratedBlockRegistry.get(lastBlockName),
    hydrationQueue,
    dehydratedBlockRegistry,
    injector.get(ApplicationRef),
  );
}

export function deferBlockHasErrored(deferBlock: DehydratedDeferBlock): boolean {
  return (
    getLDeferBlockDetails(deferBlock.lView, deferBlock.tNode)[DEFER_BLOCK_STATE] ===
    DeferBlockState.Error
  );
}

/**
 * 서버와 클라이언트 간에 내용이 변경된 블록의 상위 컨테이너를 정리합니다.
 * `triggerHydrationFromBlockName`를 통해 진행 중인 블록의 상위는
 * 정리해야 할 탈수 콘텐츠를 포함할 것입니다. 따라서 트리에서 해당 위치에서 정리를 수행해야 합니다.
 */
function cleanupParentContainer(
  currentBlockIdx: number,
  hydrationQueue: string[],
  dehydratedBlockRegistry: DehydratedBlockRegistry,
) {
  // 부모 블록이 존재하는 경우 현재 블록 앞에 있는 수분 대기열에 있습니다.
  const parentDeferBlockIdx = currentBlockIdx - 1;
  const parentDeferBlock =
    parentDeferBlockIdx > -1
      ? dehydratedBlockRegistry.get(hydrationQueue[parentDeferBlockIdx])
      : null;
  if (parentDeferBlock) {
    cleanupLContainer(parentDeferBlock.lContainer);
  }
}

function cleanupRemainingHydrationQueue(
  hydrationQueue: string[],
  dehydratedBlockRegistry: DehydratedBlockRegistry,
) {
  const blocksBeingHydrated = dehydratedBlockRegistry.hydrating;
  for (const dehydratedBlockId in hydrationQueue) {
    blocksBeingHydrated.get(dehydratedBlockId)?.reject();
  }
  dehydratedBlockRegistry.cleanup(hydrationQueue);
}

/**
 * 수분 대기열에 있는 모든 지연 블록에 대해 새 약속을 생성합니다.
 */
function populateHydratingStateForQueue(registry: DehydratedBlockRegistry, queue: string[]) {
  for (let blockId of queue) {
    registry.hydrating.set(blockId, Promise.withResolvers());
  }
}

// 다음 렌더링 주기가 완료될 때까지 대기합니다.
function nextRender(injector: Injector): Promise<void> {
  return new Promise<void>((resolveFn) => afterNextRender(resolveFn, {injector}));
}

async function triggerResourceLoadingForHydration(
  dehydratedBlock: DehydratedDeferBlock,
): Promise<void> {
  const {tNode, lView} = dehydratedBlock;
  const lDetails = getLDeferBlockDetails(lView, tNode);

  return new Promise<void>((resolve) => {
    onDeferBlockCompletion(lDetails, resolve);
    triggerDeferBlock(TriggerType.Hydrate, lView, tNode);
  });
}

/**
 * 블록의 로딩 및 렌더링이 완료된 후 지연 블록에 대한 정리 함수를 등록합니다.
 */
function onDeferBlockCompletion(lDetails: LDeferBlockDetails, callback: VoidFunction) {
  if (!Array.isArray(lDetails[ON_COMPLETE_FNS])) {
    lDetails[ON_COMPLETE_FNS] = [];
  }
  lDetails[ON_COMPLETE_FNS].push(callback);
}

/**
 * 특정 트리거 유형이 명령이 발생할 때 첨부되어야 하는지 여부를 결정합니다.
 * 특정 유형에 적합한 트리거가 사용되도록 합니다.
 */
export function shouldAttachTrigger(triggerType: TriggerType, lView: LView, tNode: TNode): boolean {
  if (triggerType === TriggerType.Regular) {
    return shouldAttachRegularTrigger(lView, tNode);
  } else if (triggerType === TriggerType.Hydrate) {
    return !shouldAttachRegularTrigger(lView, tNode);
  }
  // TriggerType.Prefetch는 클라이언트에서만 활성화됩니다.
  return !(typeof ngServerMode !== 'undefined' && ngServerMode);
}

/**
 * 일반 트리거 로직("on viewport")이 지연 블록에 첨부되어야 하는지 정의합니다. 이 함수는
 * 지연 지시문을 사용 가능한 경우 MutualExclude를 정의합니다.
 */
function shouldAttachRegularTrigger(lView: LView, tNode: TNode): boolean {
  const injector = lView[INJECTOR];

  const tDetails = getTDeferBlockDetails(lView[TVIEW], tNode);
  const incrementalHydrationEnabled = isIncrementalHydrationEnabled(injector);
  const hasHydrateTriggers =
    tDetails.flags !== null &&
    (tDetails.flags & TDeferDetailsFlags.HasHydrateTriggers) ===
      TDeferDetailsFlags.HasHydrateTriggers;

  // 서버에서:
  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    // 서버에서 일반 트리거가 활성화되는 경우:
    //  - 점진적 수분이 *비활성*인 경우
    //  - 또는 점진적 수분이 활성화되었지만 특정 블록에 "수분" 트리거가 없는 경우
    return !incrementalHydrationEnabled || !hasHydrateTriggers;
  }

  // 클라이언트에서:
  const lDetails = getLDeferBlockDetails(lView, tNode);
  const wasServerSideRendered = lDetails[SSR_UNIQUE_ID] !== null;

  if (hasHydrateTriggers && wasServerSideRendered && incrementalHydrationEnabled) {
    return false;
  }
  return true;
}

/**
 * 지연 블록의 수분 트리거 목록을 가져옵니다.
 */
export function getHydrateTriggers(
  tView: TView,
  tNode: TNode,
): Map<DeferBlockTrigger, HydrateTriggerDetails | null> {
  const tDetails = getTDeferBlockDetails(tView, tNode);
  return (tDetails.hydrateTriggers ??= new Map());
}

/**
 * 모든 지연 블록 요약을 반복하고 모든 블록의 트리거가
 * 적절하게 초기화되었는지 확인합니다.
 */
export function processAndInitTriggers(
  injector: Injector,
  blockData: Map<string, BlockSummary>,
  nodes: Map<string, Comment>,
) {
  const idleElements: ElementTrigger[] = [];
  const timerElements: ElementTrigger[] = [];
  const viewportElements: ElementTrigger[] = [];
  const immediateElements: ElementTrigger[] = [];
  for (let [blockId, blockSummary] of blockData) {
    const commentNode = nodes.get(blockId);
    if (commentNode !== undefined) {
      const numRootNodes = blockSummary.data[NUM_ROOT_NODES];
      let currentNode: Comment | HTMLElement = commentNode;
      for (let i = 0; i < numRootNodes; i++) {
        currentNode = currentNode.previousSibling as HTMLElement;
        if (currentNode.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        const elementTrigger: ElementTrigger = {el: currentNode, blockName: blockId};
        // hydrate
        if (blockSummary.hydrate.idle) {
          idleElements.push(elementTrigger);
        }
        if (blockSummary.hydrate.immediate) {
          immediateElements.push(elementTrigger);
        }
        if (blockSummary.hydrate.timer !== null) {
          elementTrigger.delay = blockSummary.hydrate.timer;
          timerElements.push(elementTrigger);
        }
        if (blockSummary.hydrate.viewport) {
          viewportElements.push(elementTrigger);
        }
      }
    }
  }

  setIdleTriggers(injector, idleElements);
  setImmediateTriggers(injector, immediateElements);
  setViewportTriggers(injector, viewportElements);
  setTimerTriggers(injector, timerElements);
}

function setIdleTriggers(injector: Injector, elementTriggers: ElementTrigger[]) {
  for (const elementTrigger of elementTriggers) {
    const registry = injector.get(DEHYDRATED_BLOCK_REGISTRY);
    const onInvoke = () => triggerHydrationFromBlockName(injector, elementTrigger.blockName);
    const cleanupFn = onIdle(onInvoke, injector);
    registry.addCleanupFn(elementTrigger.blockName, cleanupFn);
  }
}

function setViewportTriggers(injector: Injector, elementTriggers: ElementTrigger[]) {
  if (elementTriggers.length > 0) {
    const registry = injector.get(DEHYDRATED_BLOCK_REGISTRY);
    for (let elementTrigger of elementTriggers) {
      const cleanupFn = onViewport(
        elementTrigger.el,
        () => triggerHydrationFromBlockName(injector, elementTrigger.blockName),
        injector,
      );
      registry.addCleanupFn(elementTrigger.blockName, cleanupFn);
    }
  }
}

function setTimerTriggers(injector: Injector, elementTriggers: ElementTrigger[]) {
  for (const elementTrigger of elementTriggers) {
    const registry = injector.get(DEHYDRATED_BLOCK_REGISTRY);
    const onInvoke = () => triggerHydrationFromBlockName(injector, elementTrigger.blockName);
    const timerFn = onTimer(elementTrigger.delay!);
    const cleanupFn = timerFn(onInvoke, injector);
    registry.addCleanupFn(elementTrigger.blockName, cleanupFn);
  }
}

function setImmediateTriggers(injector: Injector, elementTriggers: ElementTrigger[]) {
  for (const elementTrigger of elementTriggers) {
    // 주의: 우리는 의도적으로 각 호출을 대기하는 것을 피하고
    // 동시에 모든 지연 블록에 대한 수분 처리를 시작합니다.
    triggerHydrationFromBlockName(injector, elementTrigger.blockName);
  }
}
