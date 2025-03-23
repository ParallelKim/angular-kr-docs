/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {validateMatchingNode} from '../../hydration/error_handling';
import {locateNextRNode} from '../../hydration/node_lookup_utils';
import {isDisconnectedNode, markRNodeAsClaimedByHydration} from '../../hydration/utils';
import {isDetachedByI18n} from '../../i18n/utils';
import {assertEqual, assertIndexInRange} from '../../util/assert';
import {TElementNode, TNode, TNodeType} from '../interfaces/node';
import {RText} from '../interfaces/renderer_dom';
import {HEADER_OFFSET, HYDRATION, LView, RENDERER, TView} from '../interfaces/view';
import {appendChild} from '../node_manipulation';
import {createTextNode} from '../dom_node_manipulation';
import {
  getBindingIndex,
  getLView,
  getTView,
  isInSkipHydrationBlock,
  lastNodeWasCreated,
  setCurrentTNode,
  wasLastNodeCreated,
} from '../state';
import {getOrCreateTNode} from '../tnode_manipulation';

/**
 * 정적 텍스트 노드 생성
 *
 * @param index 데이터 배열에서 노드의 인덱스
 * @param value 작성할 정적 문자열 값.
 *
 * @codeGenApi
 */
export function ɵɵtext(index: number, value: string = ''): void {
  const lView = getLView();
  const tView = getTView();
  const adjustedIndex = index + HEADER_OFFSET;

  ngDevMode &&
    assertEqual(
      getBindingIndex(),
      tView.bindingStartIndex,
      '텍스트 노드는 바인딩 전에 생성되어야 합니다.',
    );
  ngDevMode && assertIndexInRange(lView, adjustedIndex);

  const tNode = tView.firstCreatePass
    ? getOrCreateTNode(tView, adjustedIndex, TNodeType.Text, value, null)
    : (tView.data[adjustedIndex] as TElementNode);

  const textNative = _locateOrCreateTextNode(tView, lView, tNode, value, index);
  lView[adjustedIndex] = textNative;

  if (wasLastNodeCreated()) {
    appendChild(tView, lView, textNative, tNode);
  }

  // 텍스트 노드는 자기 닫기입니다.
  setCurrentTNode(tNode, false);
}

let _locateOrCreateTextNode: typeof locateOrCreateTextNodeImpl = (
  tView: TView,
  lView: LView,
  tNode: TNode,
  value: string,
  index: number,
) => {
  lastNodeWasCreated(true);
  return createTextNode(lView[RENDERER], value);
};

/**
 * 텍스트 노드의 일반 생성 모드에 추가하여 DOM에서 기존 요소를 조회하는 수분 코드 경로를 활성화합니다.
 */
function locateOrCreateTextNodeImpl(
  tView: TView,
  lView: LView,
  tNode: TNode,
  value: string,
  index: number,
): RText {
  const hydrationInfo = lView[HYDRATION];
  const isNodeCreationMode =
    !hydrationInfo ||
    isInSkipHydrationBlock() ||
    isDetachedByI18n(tNode) ||
    isDisconnectedNode(hydrationInfo, index);
  lastNodeWasCreated(isNodeCreationMode);

  // 일반 생성 모드.
  if (isNodeCreationMode) {
    return createTextNode(lView[RENDERER], value);
  }

  // 수분 모드, DOM에서 기존 요소를 조회합니다.
  const textNative = locateNextRNode(hydrationInfo, tView, lView, tNode) as RText;

  ngDevMode && validateMatchingNode(textNative, Node.TEXT_NODE, null, lView, tNode);
  ngDevMode && markRNodeAsClaimedByHydration(textNative);

  return textNative;
}

export function enableLocateOrCreateTextNodeImpl() {
  _locateOrCreateTextNode = locateOrCreateTextNodeImpl;
}
