/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {addToArray, removeFromArray} from '../../util/array_utils';
import {assertDefined, assertEqual} from '../../util/assert';
import {assertLContainer, assertLView} from '../assert';
import {
  CONTAINER_HEADER_OFFSET,
  LContainer,
  LContainerFlags,
  MOVED_VIEWS,
  NATIVE,
} from '../interfaces/container';
import {TNode} from '../interfaces/node';
import {RComment, RElement} from '../interfaces/renderer_dom';
import {isLView} from '../interfaces/type_checks';
import {
  DECLARATION_COMPONENT_VIEW,
  DECLARATION_LCONTAINER,
  FLAGS,
  HYDRATION,
  LView,
  LViewFlags,
  NEXT,
  PARENT,
  QUERIES,
  RENDERER,
  T_HOST,
  TView,
  TVIEW,
} from '../interfaces/view';
import {
  addViewToDOM,
  destroyLView,
  detachMovedView,
  getBeforeNodeForView,
  removeViewFromDOM,
} from '../node_manipulation';
import {updateAncestorTraversalFlagsOnAttach} from '../util/view_utils';

/**
 * 컨테이너 지시문 또는 ViewContainerRef에서 LContainer를 생성합니다.
 *
 * @param hostNative LContainer의 호스트 요소
 * @param hostTNode LContainer의 호스트 TNode
 * @param currentView LContainer의 부모 뷰
 * @param native 네이티브 주석 요소
 * @param isForViewContainerRef ViewContainerRef의 경우를 나타내는 선택적 플래그
 * @returns LContainer
 */
export function createLContainer(
  hostNative: RElement | RComment | LView,
  currentView: LView,
  native: RComment,
  tNode: TNode,
): LContainer {
  ngDevMode && assertLView(currentView);
  const lContainer: LContainer = [
    hostNative, // 호스트 네이티브
    true, // 이 위치에 있는 Boolean `true`는 이것이 `LContainer`임을 의미합니다
    0, // 플래그
    currentView, // 부모
    null, // 다음
    tNode, // t_host
    null, // 탈수된 뷰
    native, // 네이티브,
    null, // 뷰 참조
    null, // 이동된 뷰
  ];
  ngDevMode &&
    assertEqual(
      lContainer.length,
      CONTAINER_HEADER_OFFSET,
      'LContainer 헤더에 대한 올바른 슬롯 수를 할당해야 합니다.',
    );
  return lContainer;
}

export function getLViewFromLContainer<T>(
  lContainer: LContainer,
  index: number,
): LView<T> | undefined {
  const adjustedIndex = CONTAINER_HEADER_OFFSET + index;
  // 배열 경계를 초과 읽지 않도록 합니다.
  if (adjustedIndex < lContainer.length) {
    const lView = lContainer[adjustedIndex];
    ngDevMode && assertLView(lView);
    return lView as LView<T>;
  }
  return undefined;
}

export function addLViewToLContainer(
  lContainer: LContainer,
  lView: LView<unknown>,
  index: number,
  addToDOM = true,
): void {
  const tView = lView[TVIEW];

  // 새로운 뷰가 변경 감지될 수 있도록 뷰 트리에 삽입합니다.
  insertView(tView, lView, lContainer, index);

  // 이 뷰에 속한 요소를 DOM 트리에 삽입합니다.
  if (addToDOM) {
    const beforeNode = getBeforeNodeForView(index, lContainer);
    const renderer = lView[RENDERER];
    const parentRNode = renderer.parentNode(lContainer[NATIVE] as RElement | RComment);
    if (parentRNode !== null) {
      addViewToDOM(tView, lContainer[T_HOST], renderer, lView, parentRNode, beforeNode);
    }
  }

  // 수화 모드에서 첫 번째 자식에 대한 포인터를 재설정합니다.
  // 이는 뷰가 수화되었음을 나타내며
  // 추가/제거 작업은 이 뷰로 정상적으로 작동해야 합니다.
  const hydrationInfo = lView[HYDRATION];
  if (hydrationInfo !== null && hydrationInfo.firstChild !== null) {
    hydrationInfo.firstChild = null;
  }
}

export function removeLViewFromLContainer(
  lContainer: LContainer,
  index: number,
): LView<unknown> | undefined {
  const lView = detachView(lContainer, index);
  if (lView !== undefined) {
    destroyLView(lView[TVIEW], lView);
  }
  return lView;
}

/**
 * 컨테이너에서 뷰를 분리합니다.
 *
 * 이 메서드는 활성 뷰의 컨테이너 배열에서 뷰를 제거합니다. 또한
 * 뷰의 요소를 DOM에서 제거합니다.
 *
 * @param lContainer 뷰를 분리할 컨테이너
 * @param removeIndex 분리할 뷰의 인덱스
 * @returns 분리된 LView 인스턴스.
 */
export function detachView(lContainer: LContainer, removeIndex: number): LView | undefined {
  if (lContainer.length <= CONTAINER_HEADER_OFFSET) return;

  const indexInContainer = CONTAINER_HEADER_OFFSET + removeIndex;
  const viewToDetach = lContainer[indexInContainer];

  if (viewToDetach) {
    const declarationLContainer = viewToDetach[DECLARATION_LCONTAINER];
    if (declarationLContainer !== null && declarationLContainer !== lContainer) {
      detachMovedView(declarationLContainer, viewToDetach);
    }

    if (removeIndex > 0) {
      lContainer[indexInContainer - 1][NEXT] = viewToDetach[NEXT] as LView;
    }
    const removedLView = removeFromArray(lContainer, CONTAINER_HEADER_OFFSET + removeIndex);
    removeViewFromDOM(viewToDetach[TVIEW], viewToDetach);

    // 뷰가 제거되었음을 쿼리에 알립니다.
    const lQueries = removedLView[QUERIES];
    if (lQueries !== null) {
      lQueries.detachView(removedLView[TVIEW]);
    }

    viewToDetach[PARENT] = null;
    viewToDetach[NEXT] = null;
    // 연결 플래그를 해제합니다.
    viewToDetach[FLAGS] &= ~LViewFlags.Attached;
  }
  return viewToDetach;
}

/**
 * 뷰를 컨테이너에 삽입합니다.
 *
 * 이는 뷰를 활성 뷰의 컨테이너 배열에 올바른
 * 위치에 추가합니다. 또한 컨테이너가 다른 뷰의 루트 노드가 아닌 경우에는
 * 뷰의 요소를 DOM에 추가합니다(그 경우, 뷰의 요소는 컨테이너의 부모 뷰가 나중에 추가될 때 추가됩니다).
 *
 * @param tView 삽입할 `LView`의 `TView`
 * @param lView 삽입할 뷰
 * @param lContainer 뷰가 삽입되어야 하는 컨테이너
 * @param index 자식 뷰를 삽입할 컨테이너 내의 인덱스
 */
function insertView(tView: TView, lView: LView, lContainer: LContainer, index: number) {
  ngDevMode && assertLView(lView);
  ngDevMode && assertLContainer(lContainer);
  const indexInContainer = CONTAINER_HEADER_OFFSET + index;
  const containerLength = lContainer.length;

  if (index > 0) {
    // 새로운 뷰입니다. 자식으로 추가해야 합니다.
    lContainer[indexInContainer - 1][NEXT] = lView;
  }
  if (index < containerLength - CONTAINER_HEADER_OFFSET) {
    lView[NEXT] = lContainer[indexInContainer];
    addToArray(lContainer, CONTAINER_HEADER_OFFSET + index, lView);
  } else {
    lContainer.push(lView);
    lView[NEXT] = null;
  }

  lView[PARENT] = lContainer;

  // 선언과 삽입 지점이 다른 뷰를 추적합니다.
  const declarationLContainer = lView[DECLARATION_LCONTAINER];
  if (declarationLContainer !== null && lContainer !== declarationLContainer) {
    trackMovedView(declarationLContainer, lView);
  }

  // 새로운 뷰가 추가되었음을 쿼리에 알립니다.
  const lQueries = lView[QUERIES];
  if (lQueries !== null) {
    lQueries.insertView(tView);
  }

  updateAncestorTraversalFlagsOnAttach(lView);
  // 연결 플래그를 설정합니다.
  lView[FLAGS] |= LViewFlags.Attached;
}

/**
 * 선언 컨테이너(TemplateRef)에서 생성된 뷰를 추적하고
 * 다른 LContainer에 삽입하거나 ApplicationRef에 직접 연결합니다.
 */
export function trackMovedView(declarationContainer: LContainer, lView: LView) {
  ngDevMode && assertDefined(lView, 'LView가 필요합니다.');
  ngDevMode && assertLContainer(declarationContainer);
  const movedViews = declarationContainer[MOVED_VIEWS];
  const parent = lView[PARENT]!;
  ngDevMode && assertDefined(parent, '부모가 누락되었습니다.');
  if (isLView(parent)) {
    declarationContainer[FLAGS] |= LContainerFlags.HasTransplantedViews;
  } else {
    const insertedComponentLView = parent[PARENT]![DECLARATION_COMPONENT_VIEW];
    ngDevMode && assertDefined(insertedComponentLView, '삽입된 컴포넌트 LView가 누락되었습니다.');
    const declaredComponentLView = lView[DECLARATION_COMPONENT_VIEW];
    ngDevMode && assertDefined(declaredComponentLView, '선언된 컴포넌트 LView가 누락되었습니다.');
    if (declaredComponentLView !== insertedComponentLView) {
      // 이 시점에서 선언 컴포넌트는 삽입 컴포넌트와 다릅니다. 이는
      // 이 뷰가 이식된 뷰라는 것을 의미합니다. 이식된 뷰를 가진 것으로 표시하여
      // 해당 뷰들이 CD에서 참여할 수 있도록 합니다.
      declarationContainer[FLAGS] |= LContainerFlags.HasTransplantedViews;
    }
  }
  if (movedViews === null) {
    declarationContainer[MOVED_VIEWS] = [lView];
  } else {
    movedViews.push(lView);
  }
}
