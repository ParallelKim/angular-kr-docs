/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertEqual} from '../../util/assert';
import {TNode, TNodeType} from '../interfaces/node';
import {setI18nHandling} from '../node_manipulation';
import {getInsertInFrontOfRNodeWithI18n, processI18nInsertBefore} from '../node_manipulation_i18n';

/**
 * `previousTNodes` 목록에 `tNode`를 추가하고 `previousTNodes` 목록의 관련 `TNode`를 업데이트합니다.
 * `tNode.insertBeforeIndex`.
 *
 * 염두에 두어야 할 사항:
 * 1. 모든 i18n 텍스트 노드는 `TNodeType.Element`로 인코딩되며,
 *    `ɵɵi18nStart` 지시문에 의해 즉시 생성됩니다.
 * 2. 모든 `TNodeType.Placeholder` `TNodes`는 나중에
 *    `ɵɵelementStart` 지시문에 의해 생성될 요소입니다.
 * 3. `ɵɵelementStart` 지시문은 오름차순 `TNode.index` 순서로 `TNode`를 생성합니다. (따라서
 *    작은 인덱스 `TNode`가 큰 인덱스 `TNode`보다 먼저 생성됩니다)
 *
 * 위의 세 가지 불변성을 사용하여 `TNode.insertBeforeIndex`를 결정합니다.
 *
 * 이상적인 세계에서는 `TNode.insertBeforeIndex`가 항상 `TNode.next.index`가 됩니다. 그러나,
 * 이 경우는 작동하지 않습니다. 왜냐하면 `TNode.next.index`가 `TNode.index`보다 클 수 있기 때문에,
 * 이는 다음 노드가 아직 생성되지 않았음을 의미하며 따라서 우리는 그 앞에 삽입할 수 없습니다.
 *
 * 규칙 1: `TNode.insertBeforeIndex = null` 만약 `TNode.next === null`인 경우 (초기 조건, 여기에 더
 *         `TNode`가 삽입될 수 있는지는 알 수 없음)
 * 규칙 2: `previousTNode`가 삽입되는 `tNode` 이후에 생성된 경우,
 *         `previousTNode.insertBeforeNode = tNode.index` (그래서 새로운 `tNode`가 추가될 때
 *         우리는 이전 `TNode`를 확인하여 `insertBeforeTNode`를 업데이트할 수 있는지 확인합니다)
 *
 * 더 많은 문맥을 위해 `TNode.insertBeforeIndex`를 참조하십시오.
 *
 * @param previousTNodes `TNode`를 역순으로 쉽게 순회할 수 있도록 하는 이전 TNodes 목록입니다.
 *     (만약 `TNode`가 `previous`를 가졌다면 이는 필요하지 않을 것입니다.)
 * @param newTNode `previousTNodes` 목록에 추가할 TNode입니다.
 */
export function addTNodeAndUpdateInsertBeforeIndex(previousTNodes: TNode[], newTNode: TNode) {
  // 규칙 1로 시작
  ngDevMode &&
    assertEqual(newTNode.insertBeforeIndex, null, 'insertBeforeIndex가 설정되지 않아야 합니다.');

  previousTNodes.push(newTNode);
  if (previousTNodes.length > 1) {
    for (let i = previousTNodes.length - 2; i >= 0; i--) {
      const existingTNode = previousTNodes[i];
      // 텍스트 노드는 즉시 생성되므로 `indexBeforeIndex`를 업데이트할 필요가 없습니다.
      // 이를 무시하는 것이 안전합니다.
      if (!isI18nText(existingTNode)) {
        if (
          isNewTNodeCreatedBefore(existingTNode, newTNode) &&
          getInsertBeforeIndex(existingTNode) === null
        ) {
          // 생성 시간이 우리보다 이전인 경우, (그리고 아직 `insertBeforeIndex`가 없는 경우)
          // `insertBeforeIndex`를 추가합니다.
          setInsertBeforeIndex(existingTNode, newTNode.index);
        }
      }
    }
  }
}

function isI18nText(tNode: TNode): boolean {
  return !(tNode.type & TNodeType.Placeholder);
}

function isNewTNodeCreatedBefore(existingTNode: TNode, newTNode: TNode): boolean {
  return isI18nText(newTNode) || existingTNode.index > newTNode.index;
}

function getInsertBeforeIndex(tNode: TNode): number | null {
  const index = tNode.insertBeforeIndex;
  return Array.isArray(index) ? index[0] : index;
}

function setInsertBeforeIndex(tNode: TNode, value: number): void {
  const index = tNode.insertBeforeIndex;
  if (Array.isArray(index)) {
    // 자식 노드를 삽입해야 할 경우 배열에 저장됩니다. `TNode.insertBeforeIndex`를 참조하십시오.
    index[0] = value;
  } else {
    setI18nHandling(getInsertInFrontOfRNodeWithI18n, processI18nInsertBefore);
    tNode.insertBeforeIndex = value;
  }
}
