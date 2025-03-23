/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {validateMatchingNode, validateNodeExists} from '../../hydration/error_handling';
import {locateNextRNode, siblingAfter} from '../../hydration/node_lookup_utils';
import {
  getNgContainerSize,
  isDisconnectedNode,
  markRNodeAsClaimedByHydration,
  setSegmentHead,
} from '../../hydration/utils';
import {isDetachedByI18n} from '../../i18n/utils';
import {assertEqual, assertIndexInRange, assertNumber} from '../../util/assert';
import {assertHasParent} from '../assert';
import {attachPatchData} from '../context_discovery';
import {createCommentNode} from '../dom_node_manipulation';
import {registerPostOrderHooks} from '../hooks';
import {TAttributes, TElementContainerNode, TNode, TNodeType} from '../interfaces/node';
import {RComment} from '../interfaces/renderer_dom';
import {isContentQueryHost, isDirectiveHost} from '../interfaces/type_checks';
import {HEADER_OFFSET, HYDRATION, LView, RENDERER, TView} from '../interfaces/view';
import {assertTNodeType} from '../node_assert';
import {appendChild} from '../node_manipulation';
import {executeContentQueries} from '../queries/query_execution';
import {
  getBindingIndex,
  getBindingsEnabled,
  getCurrentTNode,
  getLView,
  getTView,
  isCurrentTNodeParent,
  isInSkipHydrationBlock,
  lastNodeWasCreated,
  setCurrentTNode,
  setCurrentTNodeAsNotParent,
  wasLastNodeCreated,
} from '../state';
import {computeStaticStyling} from '../styling/static_styling';
import {mergeHostAttrs} from '../util/attrs_utils';
import {getConstant} from '../util/view_utils';

import {getOrCreateTNode} from '../tnode_manipulation';
import {resolveDirectives} from '../view/directives';
import {
  createDirectivesInstances,
  findDirectiveDefMatches,
  saveResolvedLocalsInData,
} from './shared';

function elementContainerStartFirstCreatePass(
  index: number,
  tView: TView,
  lView: LView,
  attrsIndex?: number | null,
  localRefsIndex?: number,
): TElementContainerNode {
  ngDevMode && ngDevMode.firstCreatePass++;

  const tViewConsts = tView.consts;
  const attrs = getConstant<TAttributes>(tViewConsts, attrsIndex);
  const tNode = getOrCreateTNode(tView, index, TNodeType.ElementContainer, 'ng-container', attrs);

  // ng-container가 스타일링을 지원하지는 않지만,
  // 스타일 컨텍스트를 사용하여 ng-container에서 직접 지시문을 식별하고 실행합니다.
  if (attrs !== null) {
    computeStaticStyling(tNode, attrs, true);
  }

  const localRefs = getConstant<string[]>(tViewConsts, localRefsIndex);
  if (getBindingsEnabled()) {
    resolveDirectives(tView, lView, tNode, localRefs, findDirectiveDefMatches);
  }

  // 템플릿 속성을 마지막에 병합하여 가장 높은 우선 순위를 갖도록 합니다.
  tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, tNode.attrs);

  if (tView.queries !== null) {
    tView.queries.elementStart(tView, tNode);
  }

  return tNode;
}

/**
 * DOM의 주석 노드에 의해 지원되는 다른 노드를 위한 논리적 컨테이너(<ng-container>)를 생성합니다.
 * 이 명령은 나중에 `elementContainerEnd()` 호출이 뒤따라야 합니다.
 *
 * @param index LView 배열에서 요소의 인덱스
 * @param attrsIndex `consts` 배열에서 컨테이너 속성의 인덱스.
 * @param localRefsIndex `consts` 배열에서 컨테이너의 로컬 참조 인덱스.
 * @returns 이 함수는 체이닝을 위해 자신을 반환합니다.
 *
 * 이 명령이 속성 집합을 수락하더라도 실제 속성 값은 DOM에 전파되지 않습니다
 * (주석 노드는 속성을 가질 수 없기 때문입니다). 속성은 여기서 단지 지시문
 * 일치 목적과 지시문의 초기 입력 설정을 위한 것입니다.
 *
 * @codeGenApi
 */
export function ɵɵelementContainerStart(
  index: number,
  attrsIndex?: number | null,
  localRefsIndex?: number,
): typeof ɵɵelementContainerStart {
  const lView = getLView();
  const tView = getTView();
  const adjustedIndex = index + HEADER_OFFSET;

  ngDevMode && assertIndexInRange(lView, adjustedIndex);
  ngDevMode &&
    assertEqual(
      getBindingIndex(),
      tView.bindingStartIndex,
      'element containers should be created before any bindings',
    );

  const tNode = tView.firstCreatePass
    ? elementContainerStartFirstCreatePass(adjustedIndex, tView, lView, attrsIndex, localRefsIndex)
    : (tView.data[adjustedIndex] as TElementContainerNode);
  setCurrentTNode(tNode, true);

  const comment = _locateOrCreateElementContainerNode(tView, lView, tNode, index);
  lView[adjustedIndex] = comment;

  if (wasLastNodeCreated()) {
    appendChild(tView, lView, comment, tNode);
  }
  attachPatchData(comment, lView);

  if (isDirectiveHost(tNode)) {
    createDirectivesInstances(tView, lView, tNode);
    executeContentQueries(tView, tNode, lView);
  }

  if (localRefsIndex != null) {
    saveResolvedLocalsInData(lView, tNode);
  }

  return ɵɵelementContainerStart;
}

/**
 * <ng-container>의 끝을 표시합니다.
 * @returns 이 함수는 체이닝을 위해 자신을 반환합니다.
 *
 * @codeGenApi
 */
export function ɵɵelementContainerEnd(): typeof ɵɵelementContainerEnd {
  let currentTNode = getCurrentTNode()!;
  const tView = getTView();
  if (isCurrentTNodeParent()) {
    setCurrentTNodeAsNotParent();
  } else {
    ngDevMode && assertHasParent(currentTNode);
    currentTNode = currentTNode.parent!;
    setCurrentTNode(currentTNode, false);
  }

  ngDevMode && assertTNodeType(currentTNode, TNodeType.ElementContainer);

  if (tView.firstCreatePass) {
    registerPostOrderHooks(tView, currentTNode);
    if (isContentQueryHost(currentTNode)) {
      tView.queries!.elementEnd(currentTNode);
    }
  }
  return ɵɵelementContainerEnd;
}

/**
 * {@link elementContainerStart}와 {@link elementContainerEnd}를
 * 사용하여 빈 논리 컨테이너를 생성합니다.
 *
 * @param index LView 배열에서 요소의 인덱스
 * @param attrsIndex `consts` 배열에서 컨테이너 속성의 인덱스.
 * @param localRefsIndex `consts` 배열에서 컨테이너의 로컬 참조 인덱스.
 * @returns 이 함수는 체이닝을 위해 자신을 반환합니다.
 *
 * @codeGenApi
 */
export function ɵɵelementContainer(
  index: number,
  attrsIndex?: number | null,
  localRefsIndex?: number,
): typeof ɵɵelementContainer {
  ɵɵelementContainerStart(index, attrsIndex, localRefsIndex);
  ɵɵelementContainerEnd();
  return ɵɵelementContainer;
}

let _locateOrCreateElementContainerNode: typeof locateOrCreateElementContainerNode = (
  tView: TView,
  lView: LView,
  tNode: TNode,
  index: number,
) => {
  lastNodeWasCreated(true);
  return createCommentNode(lView[RENDERER], ngDevMode ? 'ng-container' : '');
};

/**
 * DOM에서 기존 요소를 조회하기 위해 수화 코드 경로를 활성화합니다.
 * 이는 <ng-container>의 앵커를 나타내는 주석 노드의 일반 생성 모드와
 * 함께 있습니다.
 */
function locateOrCreateElementContainerNode(
  tView: TView,
  lView: LView,
  tNode: TNode,
  index: number,
): RComment {
  let comment: RComment;
  const hydrationInfo = lView[HYDRATION];
  const isNodeCreationMode =
    !hydrationInfo ||
    isInSkipHydrationBlock() ||
    isDisconnectedNode(hydrationInfo, index) ||
    isDetachedByI18n(tNode);

  lastNodeWasCreated(isNodeCreationMode);

  // 일반 생성 모드.
  if (isNodeCreationMode) {
    return createCommentNode(lView[RENDERER], ngDevMode ? 'ng-container' : '');
  }

  // 수화 모드, DOM에서 기존 요소를 조회합니다.
  const currentRNode = locateNextRNode(hydrationInfo, tView, lView, tNode)!;
  ngDevMode && validateNodeExists(currentRNode, lView, tNode);

  const ngContainerSize = getNgContainerSize(hydrationInfo, index) as number;
  ngDevMode &&
    assertNumber(
      ngContainerSize,
      '예상치 못한 상태: <ng-container>을 수화하는 중, ' + '그러나 수화 정보가 없습니다.',
    );

  setSegmentHead(hydrationInfo, index, currentRNode);
  comment = siblingAfter<RComment>(ngContainerSize, currentRNode)!;

  if (ngDevMode) {
    validateMatchingNode(comment, Node.COMMENT_NODE, null, lView, tNode);
    markRNodeAsClaimedByHydration(comment);
  }

  return comment;
}

export function enableLocateOrCreateElementContainerNodeImpl() {
  _locateOrCreateElementContainerNode = locateOrCreateElementContainerNode;
}
