/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  invalidSkipHydrationHost,
  validateMatchingNode,
  validateNodeExists,
} from '../../hydration/error_handling';
import {locateNextRNode} from '../../hydration/node_lookup_utils';
import {
  hasSkipHydrationAttrOnRElement,
  hasSkipHydrationAttrOnTNode,
} from '../../hydration/skip_hydration';
import {
  getSerializedContainerViews,
  isDisconnectedNode,
  markRNodeAsClaimedByHydration,
  markRNodeAsSkippedByHydration,
  setSegmentHead,
} from '../../hydration/utils';
import {isDetachedByI18n} from '../../i18n/utils';
import {assertDefined, assertEqual, assertIndexInRange} from '../../util/assert';
import {assertHasParent} from '../assert';
import {attachPatchData} from '../context_discovery';
import {
  clearElementContents,
  createElementNode,
  setupStaticAttributes,
} from '../dom_node_manipulation';
import {hasClassInput, hasStyleInput, TElementNode, TNode, TNodeType} from '../interfaces/node';
import {Renderer} from '../interfaces/renderer';
import {RElement} from '../interfaces/renderer_dom';
import {isComponentHost, isDirectiveHost} from '../interfaces/type_checks';
import {HEADER_OFFSET, HYDRATION, LView, RENDERER, TView} from '../interfaces/view';
import {assertTNodeType} from '../node_assert';
import {appendChild} from '../node_manipulation';
import {executeContentQueries} from '../queries/query_execution';
import {
  decreaseElementDepthCount,
  enterSkipHydrationBlock,
  getBindingIndex,
  getBindingsEnabled,
  getCurrentTNode,
  getElementDepthCount,
  getLView,
  getNamespace,
  getTView,
  increaseElementDepthCount,
  isCurrentTNodeParent,
  isInSkipHydrationBlock,
  isSkipHydrationRootTNode,
  lastNodeWasCreated,
  leaveSkipHydrationBlock,
  setCurrentTNode,
  setCurrentTNodeAsNotParent,
  wasLastNodeCreated,
} from '../state';
import {elementEndFirstCreatePass, elementStartFirstCreatePass} from '../view/elements';

import {validateElementIsKnown} from './element_validation';
import {setDirectiveInputsWhichShadowsStyling} from './property';
import {
  createDirectivesInstances,
  findDirectiveDefMatches,
  saveResolvedLocalsInData,
} from './shared';

/**
 * DOM 요소를 생성합니다. 이 명령은 나중에 `elementEnd()` 호출이 뒤따라야 합니다.
 *
 * @param index LView 배열에서 요소의 인덱스
 * @param name DOM 노드의 이름
 * @param attrsIndex `consts` 배열에서 요소의 속성 인덱스.
 * @param localRefsIndex `consts` 배열에서 요소의 로컬 참조 인덱스.
 * @returns 이 함수는 체이닝할 수 있도록 자신을 반환합니다.
 *
 * 속성과 localRefs는 요소의 짝수 인덱스에 속성 이름을, 홀수 인덱스에 속성 값을 가진 문자열 배열로 전달됩니다. 예:
 * ['id', 'warning5', 'class', 'alert']
 *
 * @codeGenApi
 */
export function ɵɵelementStart(
  index: number,
  name: string,
  attrsIndex?: number | null,
  localRefsIndex?: number,
): typeof ɵɵelementStart {
  const lView = getLView();
  const tView = getTView();
  const adjustedIndex = HEADER_OFFSET + index;

  ngDevMode &&
    assertEqual(
      getBindingIndex(),
      tView.bindingStartIndex,
      'elements should be created before any bindings',
    );
  ngDevMode && assertIndexInRange(lView, adjustedIndex);

  const renderer = lView[RENDERER];
  const tNode = tView.firstCreatePass
    ? elementStartFirstCreatePass(
        adjustedIndex,
        tView,
        lView,
        name,
        findDirectiveDefMatches,
        getBindingsEnabled(),
        attrsIndex,
        localRefsIndex,
      )
    : (tView.data[adjustedIndex] as TElementNode);

  const native = _locateOrCreateElementNode(tView, lView, tNode, renderer, name, index);
  lView[adjustedIndex] = native;

  const hasDirectives = isDirectiveHost(tNode);

  if (ngDevMode && tView.firstCreatePass) {
    validateElementIsKnown(native, lView, tNode.value, tView.schemas, hasDirectives);
  }

  setCurrentTNode(tNode, true);
  setupStaticAttributes(renderer, native, tNode);

  if (!isDetachedByI18n(tNode) && wasLastNodeCreated()) {
    // i18n의 경우 번역이 이 요소를 제거했을 수 있으므로 분리되지 않은 경우에만 추가합니다.
    // 추가 컨텍스트는 `TNodeType.Placeholder` 및 `LFrame.inI18n`를 참조하세요.
    appendChild(tView, lView, native, tNode);
  }

  // 구성 요소 또는 템플릿 컨테이너의 모든 즉각적인 자식은
  // 나중에 어떤 요소 탐색 유틸리티 메서드를 사용하여 검사할 수 있도록
  // 구성 요소 뷰 데이터로 사전 패치해야 합니다. (자세한 내용은 `element_discovery.ts` 참조)
  if (getElementDepthCount() === 0 || hasDirectives) {
    attachPatchData(native, lView);
  }
  increaseElementDepthCount();

  if (hasDirectives) {
    createDirectivesInstances(tView, lView, tNode);
    executeContentQueries(tView, tNode, lView);
  }
  if (localRefsIndex !== null) {
    saveResolvedLocalsInData(lView, tNode);
  }
  return ɵɵelementStart;
}

/**
 * 요소의 끝을 표시합니다.
 * @returns 이 함수는 체이닝할 수 있도록 자신을 반환합니다.
 *
 * @codeGenApi
 */
export function ɵɵelementEnd(): typeof ɵɵelementEnd {
  let currentTNode = getCurrentTNode()!;
  ngDevMode && assertDefined(currentTNode, '닫아야 할 부모 노드가 없습니다.');
  if (isCurrentTNodeParent()) {
    setCurrentTNodeAsNotParent();
  } else {
    ngDevMode && assertHasParent(getCurrentTNode());
    currentTNode = currentTNode.parent!;
    setCurrentTNode(currentTNode, false);
  }

  const tNode = currentTNode;
  ngDevMode && assertTNodeType(tNode, TNodeType.AnyRNode);

  if (isSkipHydrationRootTNode(tNode)) {
    leaveSkipHydrationBlock();
  }

  decreaseElementDepthCount();

  const tView = getTView();
  if (tView.firstCreatePass) {
    elementEndFirstCreatePass(tView, tNode);
  }

  if (tNode.classesWithoutHost != null && hasClassInput(tNode)) {
    setDirectiveInputsWhichShadowsStyling(tView, tNode, getLView(), tNode.classesWithoutHost, true);
  }

  if (tNode.stylesWithoutHost != null && hasStyleInput(tNode)) {
    setDirectiveInputsWhichShadowsStyling(tView, tNode, getLView(), tNode.stylesWithoutHost, false);
  }
  return ɵɵelementEnd;
}

/**
 * {@link elementStart}와 {@link elementEnd}를 사용하여 빈 요소를 생성합니다.
 *
 * @param index 데이터 배열에서 요소의 인덱스
 * @param name DOM 노드의 이름
 * @param attrsIndex `consts` 배열에서 요소의 속성 인덱스.
 * @param localRefsIndex `consts` 배열에서 요소의 로컬 참조 인덱스.
 * @returns 이 함수는 체이닝할 수 있도록 자신을 반환합니다.
 *
 * @codeGenApi
 */
export function ɵɵelement(
  index: number,
  name: string,
  attrsIndex?: number | null,
  localRefsIndex?: number,
): typeof ɵɵelement {
  ɵɵelementStart(index, name, attrsIndex, localRefsIndex);
  ɵɵelementEnd();
  return ɵɵelement;
}

let _locateOrCreateElementNode: typeof locateOrCreateElementNodeImpl = (
  tView: TView,
  lView: LView,
  tNode: TNode,
  renderer: Renderer,
  name: string,
  index: number,
) => {
  lastNodeWasCreated(true);
  return createElementNode(renderer, name, getNamespace());
};

/**
 * DOM에서 기존 요소를 lookup하는 수분 코드 경로를 활성화합니다.
 * 요소 노드를 생성하는 일반 모드 외에도 사용됩니다.
 */
function locateOrCreateElementNodeImpl(
  tView: TView,
  lView: LView,
  tNode: TNode,
  renderer: Renderer,
  name: string,
  index: number,
): RElement {
  const hydrationInfo = lView[HYDRATION];
  const isNodeCreationMode =
    !hydrationInfo ||
    isInSkipHydrationBlock() ||
    isDetachedByI18n(tNode) ||
    isDisconnectedNode(hydrationInfo, index);
  lastNodeWasCreated(isNodeCreationMode);

  // 일반 생성 모드.
  if (isNodeCreationMode) {
    return createElementNode(renderer, name, getNamespace());
  }

  // 수분 모드, DOM에서 기존 요소를 lookup합니다.
  const native = locateNextRNode<RElement>(hydrationInfo, tView, lView, tNode)!;
  ngDevMode && validateMatchingNode(native, Node.ELEMENT_NODE, name, lView, tNode);
  ngDevMode && markRNodeAsClaimedByHydration(native);

  // 이 요소는 뷰 컨테이너의 앵커일 수도 있습니다.
  if (getSerializedContainerViews(hydrationInfo, index)) {
    // 중요한 주의: 이 요소는 앵커 역할을 하지만 **내장된 뷰의 일부가 아닙니다**.
    // 그러므로 이 요소 **후에** 세그먼트를 시작합니다. 다음 형제를 참조합니다.
    // 예를 들어, 다음 템플릿: `<div #vcrTarget>`은 DOM에서 `<div></div>...<!--container-->`로 표현됩니다.
    // 따라서 `<div>` 명령을 처리할 때 다음 형제를 세그먼트 시작으로 가리킵니다.
    ngDevMode && validateNodeExists(native.nextSibling, lView, tNode);
    setSegmentHead(hydrationInfo, index, native.nextSibling);
  }

  // 수분 처리 중 수분 생략 속성이 존재하는지 확인하여 이 블록을 수분 처리하지 않도록
  // 확인합니다. 우리는 TNode와 RElement 모두에서 속성을 확인합니다.
  // RElement 경우는 주석 단계에서 호스트 요소에 추가할 때 필요합니다.
  if (
    hydrationInfo &&
    (hasSkipHydrationAttrOnTNode(tNode) || hasSkipHydrationAttrOnRElement(native))
  ) {
    if (isComponentHost(tNode)) {
      enterSkipHydrationBlock(tNode);

      // 수분 처리할 수 없으므로 노드를 비워서 렌더 후 중복 콘텐츠가 없도록 합니다.
      clearElementContents(native);

      ngDevMode && markRNodeAsSkippedByHydration(native);
    } else if (ngDevMode) {
      // 이 요소가 컴포넌트 호스트가 아니므로 오류를 발생시킵니다.
      // 수분 처리는 개별 컴포넌트 기준으로만 생략할 수 있습니다.
      throw invalidSkipHydrationHost(native);
    }
  }
  return native;
}

export function enableLocateOrCreateElementNodeImpl() {
  _locateOrCreateElementNode = locateOrCreateElementNodeImpl;
}
