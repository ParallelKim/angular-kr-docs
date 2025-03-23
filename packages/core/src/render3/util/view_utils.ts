/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {NotificationSource} from '../../change_detection/scheduling/zoneless_scheduling';
import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {
  assertDefined,
  assertGreaterThan,
  assertGreaterThanOrEqual,
  assertIndexInRange,
  assertLessThan,
} from '../../util/assert';
import {assertLView, assertTNode, assertTNodeForLView} from '../assert';
import {LContainer, TYPE} from '../interfaces/container';
import {TConstants, TNode} from '../interfaces/node';
import {RNode} from '../interfaces/renderer_dom';
import {isDestroyed, isLContainer, isLView} from '../interfaces/type_checks';
import {
  CLEANUP,
  DECLARATION_VIEW,
  ENVIRONMENT,
  FLAGS,
  HEADER_OFFSET,
  HOST,
  LView,
  LViewFlags,
  ON_DESTROY_HOOKS,
  PARENT,
  PREORDER_HOOK_FLAGS,
  PreOrderHookFlags,
  REACTIVE_TEMPLATE_CONSUMER,
  TData,
  TView,
} from '../interfaces/view';

/**
 * 효율성 이유로 우리는 종종 여러 다른 데이터 타입(`RNode`, `LView`, `LContainer`)을
 * `LView`의 같은 장소에 넣습니다. 이는 저장소가 희소하기 때문에 이를 위해 공간을
 * 미리 할당하고 싶지 않기 때문입니다. 이 파일은 이러한 데이터 타입을 다루기 위한 유틸리티를 포함합니다.
 *
 * `LView`의 주어진 위치에 어떤 것이 저장되어 있는지 어떻게 알 수 있을까요?
 * - `Array.isArray(value) === false` => `RNode` (정상 저장 값)
 * - `Array.isArray(value) === true` => 그러면 `value[0]`는 래핑된 값을 나타냅니다.
 *   - `typeof value[TYPE] === 'object'` => `LView`
 *      - 이는 주어진 위치에 컴포넌트가 있을 때 발생합니다.
 *   - `typeof value[TYPE] === true` => `LContainer`
 *      - 이는 주어진 위치에 `LContainer` 바인딩이 있을 때 발생합니다.
 *
 *
 * 주의: `Array.isArray`와 `typeof` 작업이 매우 효율적이라고 가정합니다.
 */

/**
 * `RNode`를 반환합니다.
 * @param value `RNode`, `LView`, `LContainer`의 래핑된 값
 */
export function unwrapRNode(value: RNode | LView | LContainer): RNode {
  while (Array.isArray(value)) {
    value = value[HOST] as any;
  }
  return value as RNode;
}

/**
 * `LView`를 반환하거나 발견되지 않으면 `null`을 반환합니다.
 * @param value `RNode`, `LView`, `LContainer`의 래핑된 값
 */
export function unwrapLView(value: RNode | LView | LContainer): LView | null {
  while (Array.isArray(value)) {
    // 이 체크는 `isLView()`와 동일하지만 두 번 호출하고 싶지 않기 때문에
    // `Array.isArray()`를 두 번 호출하지 않습니다. JITer의 인라인화를 늘리지 않기 위해서입니다.
    if (typeof value[TYPE] === 'object') return value as LView;
    value = value[HOST] as any;
  }
  return null;
}

/**
 * 제공된 `viewData`에서 요소 값을 검색합니다. 이는
 * 모든 컨테이너, 컴포넌트 뷰 또는 스타일 컨텍스트에서 언랩하여 검색됩니다.
 */
export function getNativeByIndex(index: number, lView: LView): RNode {
  ngDevMode && assertIndexInRange(lView, index);
  ngDevMode && assertGreaterThanOrEqual(index, HEADER_OFFSET, 'HEADER_OFFSET을 초과해야 합니다.');
  return unwrapRNode(lView[index]);
}

/**
 * 주어진 `TNode` 및 `LView`에 대한 `RNode`를 검색합니다.
 *
 * 이 함수는 개발 모드에서 널이 아닌 `RNode`를 검색하는 것을 보장합니다.
 *
 * @param tNode
 * @param lView
 */
export function getNativeByTNode(tNode: TNode, lView: LView): RNode {
  ngDevMode && assertTNodeForLView(tNode, lView);
  ngDevMode && assertIndexInRange(lView, tNode.index);
  const node: RNode = unwrapRNode(lView[tNode.index]);
  return node;
}

/**
 * 주어진 `TNode` 및 `LView`에 대한 `RNode` 또는 `null`을 검색합니다.
 *
 * 일부 `TNode`는 연결된 `RNode`가 없습니다. 예를 들어 `Projection`
 *
 * @param tNode
 * @param lView
 */
export function getNativeByTNodeOrNull(tNode: TNode | null, lView: LView): RNode | null {
  const index = tNode === null ? -1 : tNode.index;
  if (index !== -1) {
    ngDevMode && assertTNodeForLView(tNode!, lView);
    const node: RNode | null = unwrapRNode(lView[index]);
    return node;
  }
  return null;
}

// fixme(misko): 반환 타입은 `TNode|null`이어야 합니다.
export function getTNode(tView: TView, index: number): TNode {
  ngDevMode && assertGreaterThan(index, -1, 'TNode의 잘못된 인덱스');
  ngDevMode && assertLessThan(index, tView.data.length, 'TNode의 잘못된 인덱스');
  const tNode = tView.data[index] as TNode;
  ngDevMode && tNode !== null && assertTNode(tNode);
  return tNode;
}

/** `LView` 또는 `TData`에서 값을 검색합니다. */
export function load<T>(view: LView | TData, index: number): T {
  ngDevMode && assertIndexInRange(view, index);
  return view[index];
}

export function getComponentLViewByIndex(nodeIndex: number, hostView: LView): LView {
  // LView 또는 LContainer일 수 있습니다. LContainer이면 언랩하여 LView를 찾습니다.
  ngDevMode && assertIndexInRange(hostView, nodeIndex);
  const slotValue = hostView[nodeIndex];
  const lView = isLView(slotValue) ? slotValue : slotValue[HOST];
  return lView;
}

/** 주어진 뷰가 생성 모드인지 확인합니다. */
export function isCreationMode(view: LView): boolean {
  return (view[FLAGS] & LViewFlags.CreationMode) === LViewFlags.CreationMode;
}

/**
 * 뷰가 변경 감지 트리에 연결되어 있는지 여부에 대한 불리언을 반환합니다.
 *
 * 주의: 이는 뷰가 체크되어야 하는지를 결정하지만, 컨테이너에 삽입되었는지를 결정하지 않습니다.
 * 그에 대해선 아래의 `viewAttachedToContainer`를 확인해야 합니다.
 */
export function viewAttachedToChangeDetector(view: LView): boolean {
  return (view[FLAGS] & LViewFlags.Attached) === LViewFlags.Attached;
}

/** 뷰가 컨테이너에 연결되어 있는지 여부에 대한 불리언을 반환합니다. */
export function viewAttachedToContainer(view: LView): boolean {
  return isLContainer(view[PARENT]);
}

/** `TConstants` 인스턴스에서 상수를 반환합니다. */
export function getConstant<T>(consts: TConstants | null, index: null | undefined): null;
export function getConstant<T>(consts: TConstants, index: number): T | null;
export function getConstant<T>(
  consts: TConstants | null,
  index: number | null | undefined,
): T | null;
export function getConstant<T>(
  consts: TConstants | null,
  index: number | null | undefined,
): T | null {
  if (index === null || index === undefined) return null;
  ngDevMode && assertIndexInRange(consts!, index);
  return consts![index] as unknown as T;
}

/**
 * 뷰의 사전 주문 훅 플래그를 재설정합니다.
 * @param lView 플래그가 재설정되는 LView
 */
export function resetPreOrderHookFlags(lView: LView) {
  lView[PREORDER_HOOK_FLAGS] = 0 as PreOrderHookFlags;
}

/**
 * lView에서 `RefreshView` 플래그를 추가하고 부모의 HAS_CHILD_VIEWS_TO_REFRESH 플래그를 업데이트합니다.
 */
export function markViewForRefresh(lView: LView) {
  if (lView[FLAGS] & LViewFlags.RefreshView) {
    return;
  }
  lView[FLAGS] |= LViewFlags.RefreshView;
  if (viewAttachedToChangeDetector(lView)) {
    markAncestorsForTraversal(lView);
  }
}

/**
 * LView 계층을 위로 걷습니다.
 * @param nestingLevel 계층을 몇 번 위로 걷을지를 나타냅니다.
 * @param currentView 검색을 시작할 뷰.
 */
export function walkUpViews(nestingLevel: number, currentView: LView): LView {
  while (nestingLevel > 0) {
    ngDevMode &&
      assertDefined(
        currentView[DECLARATION_VIEW],
        '중첩 수준이 0보다 큰 경우 선언 뷰는 정의되어야 합니다.',
      );
    currentView = currentView[DECLARATION_VIEW]!;
    nestingLevel--;
  }
  return currentView;
}

export function requiresRefreshOrTraversal(lView: LView) {
  return !!(
    lView[FLAGS] & (LViewFlags.RefreshView | LViewFlags.HasChildViewsToRefresh) ||
    lView[REACTIVE_TEMPLATE_CONSUMER]?.dirty
  );
}

/**
 * `LView`의 부모들에 대해 `HasChildViewsToRefresh` 플래그를 업데이트합니다.
 */
export function updateAncestorTraversalFlagsOnAttach(lView: LView) {
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(NotificationSource.ViewAttached);
  if (lView[FLAGS] & LViewFlags.Dirty) {
    lView[FLAGS] |= LViewFlags.RefreshView;
  }
  if (requiresRefreshOrTraversal(lView)) {
    markAncestorsForTraversal(lView);
  }
}

/**
 * 주어진 `lView` 위의 뷰를 변경 감지 동안 더럽지 않아도 탐색되도록 보장합니다.
 *
 * 이는 `HAS_CHILD_VIEWS_TO_REFRESH` 플래그를 루트까지 설정하여 이미 `true`이거나
 * `lView`가 분리될 때까지 중지됩니다.
 */
export function markAncestorsForTraversal(lView: LView) {
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(NotificationSource.MarkAncestorsForTraversal);
  let parent = getLViewParent(lView);
  while (parent !== null) {
    // 우리는 이미 플래그가 있는 조상에게 도달하면 더 이상 마커를 추가하지 않습니다. 이는
    // 마커가 이미 존재할 때 루트까지 불필요하게 탐색하는 것을 피하기 위함입니다.
    if (parent[FLAGS] & LViewFlags.HasChildViewsToRefresh) {
      break;
    }

    parent[FLAGS] |= LViewFlags.HasChildViewsToRefresh;
    if (!viewAttachedToChangeDetector(parent)) {
      break;
    }
    parent = getLViewParent(parent);
  }
}

/**
 * LView 전용 파괴 콜백을 저장합니다.
 */
export function storeLViewOnDestroy(lView: LView, onDestroyCallback: () => void) {
  if (isDestroyed(lView)) {
    throw new RuntimeError(
      RuntimeErrorCode.VIEW_ALREADY_DESTROYED,
      ngDevMode && '뷰가 이미 파괴되었습니다.',
    );
  }
  if (lView[ON_DESTROY_HOOKS] === null) {
    lView[ON_DESTROY_HOOKS] = [];
  }
  lView[ON_DESTROY_HOOKS].push(onDestroyCallback);
}

/**
 * 이전에 등록된 LView 전용 파괴 콜백을 제거합니다.
 */
export function removeLViewOnDestroy(lView: LView, onDestroyCallback: () => void) {
  if (lView[ON_DESTROY_HOOKS] === null) return;

  const destroyCBIdx = lView[ON_DESTROY_HOOKS].indexOf(onDestroyCallback);
  if (destroyCBIdx !== -1) {
    lView[ON_DESTROY_HOOKS].splice(destroyCBIdx, 1);
  }
}

/**
 * 전달된 LView의 부모 LView를 가져옵니다. PARENT가 LContainer인 경우
 * 해당 LContainer의 부모를 가져오며, 이는 LView입니다.
 * @param lView 부모를 가져올 LView
 */
export function getLViewParent(lView: LView): LView | null {
  ngDevMode && assertLView(lView);
  const parent = lView[PARENT];
  return isLContainer(parent) ? parent[PARENT] : parent;
}

export function getOrCreateLViewCleanup(view: LView): any[] {
  // 성능 이유로 상위 레벨 변수는 노출되지 않아야 합니다 (PERF_NOTES.md)
  return (view[CLEANUP] ??= []);
}

export function getOrCreateTViewCleanup(tView: TView): any[] {
  return (tView.cleanup ??= []);
}

/**
 * LView.cleanupInstances에 이 클린업 함수의 컨텍스트를 저장합니다.
 *
 * 첫 번째 템플릿 통과 시 TView에 저장합니다:
 * - 클린업 함수
 * - LView.cleanupInstances에 방금 저장한 컨텍스트의 인덱스
 */
export function storeCleanupWithContext(
  tView: TView,
  lView: LView,
  context: any,
  cleanupFn: Function,
): void {
  const lCleanup = getOrCreateLViewCleanup(lView);

  // 역사적으로 `storeCleanupWithContext`는 프레임워크 수준과
  // 사용자 정의 클린업 콜백을 모두 등록하는 데 사용되었지만, 시간이 지나면서
  // 이 두 유형의 클린업이 분리되었습니다. 이 개발 모드 검사로 인해
  // 사용자 수준의 클린업 콜백이 프레임워크 전용 훅을 위해 예약된 데이터 구조에 저장되지 않도록 합니다.
  ngDevMode &&
    assertDefined(context, '프레임워크 수준의 파괴 훅을 등록할 때 클린업 컨텍스트는 필수입니다.');
  lCleanup.push(context);

  if (tView.firstCreatePass) {
    getOrCreateTViewCleanup(tView).push(cleanupFn, lCleanup.length - 1);
  } else {
    // 첫 번째 템플릿 통과 후 새로운 프레임워크 수준 클린업 함수가 등록되지 않도록 합니다
    // (TView 데이터 구조가 완전히 구성될 것을 의미합니다).
    if (ngDevMode) {
      Object.freeze(getOrCreateTViewCleanup(tView));
    }
  }
}
