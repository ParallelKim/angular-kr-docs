/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  assertEqual,
  assertGreaterThan,
  assertGreaterThanOrEqual,
  throwError,
} from '../../util/assert';
import {assertTIcu, assertTNode} from '../assert';
import {IcuCreateOpCode, TIcu} from '../interfaces/i18n';
import {TIcuContainerNode, TNode, TNodeType} from '../interfaces/node';
import {LView, TView} from '../interfaces/view';
import {assertTNodeType} from '../node_assert';
import {setI18nHandling} from '../node_manipulation';
import {getInsertInFrontOfRNodeWithI18n, processI18nInsertBefore} from '../node_manipulation_i18n';
import {createTNodeAtIndex} from '../tnode_manipulation';

import {addTNodeAndUpdateInsertBeforeIndex} from './i18n_insert_before_index';

/**
 * 주어진 `index`에서 `TIcu`를 검색합니다.
 *
 * `TIcu`는 중첩 ICU인 경우 직접 저장되거나, 최상위 ICU인 경우 `TIcuContainer` 내부에 저장됩니다.
 *
 * 최상위 ICU는 렌더 트리의 일부가 되기 위해 `TNode`가 필요하지만, 중첩 ICU는 TNode가 없는데,
 * 그 이유는 중첩 ICU가 표현될지 여부를 미리 알 수 없기 때문입니다 (부모 ICU가 그것을 포함하지 않는 경우를 선택했을 수 있습니다.)
 *
 * @param tView 현재 `TView`.
 * @param index 값을 읽어야 할 인덱스.
 */
export function getTIcu(tView: TView, index: number): TIcu | null {
  const value = tView.data[index] as null | TIcu | TIcuContainerNode | string;
  if (value === null || typeof value === 'string') return null;
  if (
    ngDevMode &&
    !(value.hasOwnProperty('tView') || value.hasOwnProperty('currentCaseLViewIndex'))
  ) {
    throwError("우리는 'null'|'TIcu'|'TIcuContainer'를 예상했지만, 다음을 얻었습니다: " + value);
  }
  // Here the `value.hasOwnProperty('currentCaseLViewIndex')` is a polymorphic read as it can be
  // either TIcu or TIcuContainerNode. This is not ideal, but we still think it is OK because it
  // will be just two cases which fits into the browser inline cache (inline cache can take up to
  // 4)
  const tIcu = value.hasOwnProperty('currentCaseLViewIndex')
    ? (value as TIcu)
    : (value as TIcuContainerNode).value;
  ngDevMode && assertTIcu(tIcu);
  return tIcu;
}

/**
 * 주어진 `index`에 `TIcu`를 저장합니다.
 *
 * `TIcu`는 중첩 ICU인 경우 직접 저장되거나, 최상위 ICU인 경우 `TIcuContainer` 내부에 저장됩니다.
 *
 * 최상위 ICU는 렌더 트리의 일부가 되기 위해 `TNode`가 필요하지만, 중첩 ICU는 TNode가 없는데,
 * 그 이유는 중첩 ICU가 표현될지 여부를 미리 알 수 없기 때문입니다 (부모 ICU가 그것을 포함하지 않는 경우를 선택했을 수 있습니다.)
 *
 * @param tView 현재 `TView`.
 * @param index `Tview.data`에서 값을 저장해야 할 인덱스
 * @param tIcu 저장할 TIcu.
 */
export function setTIcu(tView: TView, index: number, tIcu: TIcu): void {
  const tNode = tView.data[index] as null | TIcuContainerNode;
  ngDevMode &&
    assertEqual(
      tNode === null || tNode.hasOwnProperty('tView'),
      true,
      "우리는 'null'|'TIcuContainer'를 예상했습니다.",
    );
  if (tNode === null) {
    tView.data[index] = tIcu;
  } else {
    ngDevMode && assertTNodeType(tNode, TNodeType.Icu);
    tNode.value = tIcu;
  }
}

/**
 * `Array`를 고려하여 `TNode.insertBeforeIndex`를 설정합니다.
 *
 * `TNode.insertBeforeIndex`를 참조하십시오.
 */
export function setTNodeInsertBeforeIndex(tNode: TNode, index: number) {
  ngDevMode && assertTNode(tNode);
  let insertBeforeIndex = tNode.insertBeforeIndex;
  if (insertBeforeIndex === null) {
    setI18nHandling(getInsertInFrontOfRNodeWithI18n, processI18nInsertBefore);
    insertBeforeIndex = tNode.insertBeforeIndex = [
      null! /* 나중에 숫자로 업데이트될 수 있습니다 */,
      index,
    ];
  } else {
    assertEqual(Array.isArray(insertBeforeIndex), true, '여기에는 배열이 있어야 합니다.');
    (insertBeforeIndex as number[]).push(index);
  }
}

/**
 * `TNode.type=TNodeType.Placeholder` 노드를 생성합니다.
 *
 * 자세한 내용은 `TNodeType.Placeholder`를 참조하십시오.
 */
export function createTNodePlaceholder(
  tView: TView,
  previousTNodes: TNode[],
  index: number,
): TNode {
  const tNode = createTNodeAtIndex(tView, index, TNodeType.Placeholder, null, null);
  addTNodeAndUpdateInsertBeforeIndex(previousTNodes, tNode);
  return tNode;
}

/**
 * 현재 ICU 케이스를 반환합니다.
 *
 * ICU 케이스는 `TIcu.cases`에 대한 인덱스로 저장됩니다.
 * 때때로 ICU 케이스가 전환되었음을 통신하고 다음 ICU 업데이트가 마스크에 관계없이 모든 바인딩을 업데이트해야 할 필요가 있습니다. 그런 경우 전환된 케이스에 대해 음수 값을 저장합니다. 이 함수는 음수 플래그를 제거합니다.
 */
export function getCurrentICUCaseIndex(tIcu: TIcu, lView: LView) {
  const currentCase: number | null = lView[tIcu.currentCaseLViewIndex];
  return currentCase === null ? currentCase : currentCase < 0 ? ~currentCase : currentCase;
}

export function getParentFromIcuCreateOpCode(mergedCode: number): number {
  return mergedCode >>> IcuCreateOpCode.SHIFT_PARENT;
}

export function getRefFromIcuCreateOpCode(mergedCode: number): number {
  return (mergedCode & IcuCreateOpCode.MASK_REF) >>> IcuCreateOpCode.SHIFT_REF;
}

export function getInstructionFromIcuCreateOpCode(mergedCode: number): number {
  return mergedCode & IcuCreateOpCode.MASK_INSTRUCTION;
}

export function icuCreateOpCode(opCode: IcuCreateOpCode, parentIdx: number, refIdx: number) {
  ngDevMode && assertGreaterThanOrEqual(parentIdx, 0, '부모 인덱스가 없습니다.');
  ngDevMode && assertGreaterThan(refIdx, 0, '참조 인덱스가 없습니다.');
  return (
    opCode | (parentIdx << IcuCreateOpCode.SHIFT_PARENT) | (refIdx << IcuCreateOpCode.SHIFT_REF)
  );
}

// 주어진 값이 루트 템플릿 메시지에 해당하는지, 또는 하위 템플릿에 해당하는지 여부를 반환합니다.
export function isRootTemplateMessage(subTemplateIndex: number): subTemplateIndex is -1 {
  return subTemplateIndex === -1;
}
