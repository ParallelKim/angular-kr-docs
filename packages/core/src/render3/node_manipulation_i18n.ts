/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertDomNode, assertIndexInRange} from '../util/assert';

import {TNode, TNodeType} from './interfaces/node';
import {Renderer} from './interfaces/renderer';
import {RElement, RNode} from './interfaces/renderer_dom';
import {LView} from './interfaces/view';
import {getInsertInFrontOfRNodeWithNoI18n} from './node_manipulation';
import {nativeInsertBefore} from './dom_node_manipulation';
import {unwrapRNode} from './util/view_utils';

/**
 * `currentTNode`가 삽입되어야 하는 노드 앞을 찾습니다 (i18n을 고려합니다).
 *
 * 이 메소드는 `currentRNode`를 삽입해야 할 `RNode`를 결정합니다. 이는 `TNode.insertBeforeIndex`를 고려합니다.
 *
 * @param parentTNode 부모 `TNode`
 * @param currentTNode 현재 `TNode` (DOM에 삽입하려는 노드)
 * @param lView 현재 `LView`
 */
export function getInsertInFrontOfRNodeWithI18n(
  parentTNode: TNode,
  currentTNode: TNode,
  lView: LView,
): RNode | null {
  const tNodeInsertBeforeIndex = currentTNode.insertBeforeIndex;
  const insertBeforeIndex = Array.isArray(tNodeInsertBeforeIndex)
    ? tNodeInsertBeforeIndex[0]
    : tNodeInsertBeforeIndex;
  if (insertBeforeIndex === null) {
    return getInsertInFrontOfRNodeWithNoI18n(parentTNode, currentTNode, lView);
  } else {
    ngDevMode && assertIndexInRange(lView, insertBeforeIndex);
    return unwrapRNode(lView[insertBeforeIndex]);
  }
}

/**
 * i18n 텍스트 노드를 추가하여 `TNode.insertBeforeIndex`를 처리합니다.
 *
 * `TNode.insertBeforeIndex`를 참조하십시오.
 */
export function processI18nInsertBefore(
  renderer: Renderer,
  childTNode: TNode,
  lView: LView,
  childRNode: RNode | RNode[],
  parentRElement: RElement | null,
): void {
  const tNodeInsertBeforeIndex = childTNode.insertBeforeIndex;
  if (Array.isArray(tNodeInsertBeforeIndex)) {
    // 배열은 이 `childRNode`의 자식으로 추가해야 할 i18n 노드가 있음을 나타냅니다.
    // 이 i18n 노드는 이 `childRNode`를 사용할 수 있기 전에 생성되었으므로 이제야 추가할 수 있습니다. 배열의 첫 번째 요소는 `childRNode`를 삽입해야 하는 일반 인덱스입니다. 추가 요소는 `childRNode`의 자식으로 추가할 추가 노드입니다.
    ngDevMode && assertDomNode(childRNode);
    let i18nParent: RElement | null = childRNode as RElement;
    let anchorRNode: RNode | null = null;
    if (!(childTNode.type & TNodeType.AnyRNode)) {
      anchorRNode = i18nParent;
      i18nParent = parentRElement;
    }
    if (i18nParent !== null && childTNode.componentOffset === -1) {
      for (let i = 1; i < tNodeInsertBeforeIndex.length; i++) {
        // 모든 인덱스가 i18n 텍스트 노드를 가리키므로 `unwrapRNode`가 필요하지 않습니다.
        // 아래의 `assertDomNode`를 참조하십시오.
        const i18nChild = lView[tNodeInsertBeforeIndex[i]];
        nativeInsertBefore(renderer, i18nParent, i18nChild, anchorRNode, false);
      }
    }
  }
}
