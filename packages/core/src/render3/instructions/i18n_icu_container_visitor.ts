/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertDomNode, assertNumber, assertNumberInRange} from '../../util/assert';
import {EMPTY_ARRAY} from '../../util/empty';
import {assertTIcu, assertTNodeForLView} from '../assert';
import {getCurrentICUCaseIndex} from '../i18n/i18n_util';
import {I18nRemoveOpCodes, TIcu} from '../interfaces/i18n';
import {TIcuContainerNode} from '../interfaces/node';
import {RNode} from '../interfaces/renderer_dom';
import {LView, TVIEW} from '../interfaces/view';

interface IcuIteratorState {
  stack: any[];
  index: number;
  lView?: LView;
  removes?: I18nRemoveOpCodes;
}

type IcuIterator = () => RNode | null;

function enterIcu(state: IcuIteratorState, tIcu: TIcu, lView: LView) {
  state.index = 0;
  const currentCase = getCurrentICUCaseIndex(tIcu, lView);
  if (currentCase !== null) {
    ngDevMode && assertNumberInRange(currentCase, 0, tIcu.cases.length - 1);
    state.removes = tIcu.remove[currentCase];
  } else {
    state.removes = EMPTY_ARRAY as any;
  }
}

function icuContainerIteratorNext(state: IcuIteratorState): RNode | null {
  if (state.index < state.removes!.length) {
    const removeOpCode = state.removes![state.index++] as number;
    ngDevMode && assertNumber(removeOpCode, 'Expecting OpCode number');
    if (removeOpCode > 0) {
      const rNode = state.lView![removeOpCode];
      ngDevMode && assertDomNode(rNode);
      return rNode;
    } else {
      state.stack.push(state.index, state.removes);
      // ICUs는 음수 인덱스로 표시됩니다
      const tIcuIndex = ~removeOpCode;
      const tIcu = state.lView![TVIEW].data[tIcuIndex] as TIcu;
      ngDevMode && assertTIcu(tIcu);
      enterIcu(state, tIcu, state.lView!);
      return icuContainerIteratorNext(state);
    }
  } else {
    if (state.stack.length === 0) {
      return null;
    } else {
      state.removes = state.stack.pop();
      state.index = state.stack.pop();
      return icuContainerIteratorNext(state);
    }
  }
}

export function loadIcuContainerVisitor() {
  const _state: IcuIteratorState = {
    stack: [],
    index: -1,
  };

  /**
   * `TIcu.remove`에서 루트 노드 집합을 검색합니다. `TNodeType.ICUContainer`에 의해 사용되어
   * 어떤 루트가 ICU에 속하는지 결정합니다.
   *
   * 사용 예:
   * ```ts
   * const nextRNode = icuContainerIteratorStart(tIcuContainerNode, lView);
   * let rNode: RNode|null;
   * while(rNode = nextRNode()) {
   *   console.log(rNode);
   * }
   * ```
   *
   * @param tIcuContainerNode 현재 `TIcuContainerNode`
   * @param lView `RNode`s가 검색되어야 하는 `LView`.
   */
  function icuContainerIteratorStart(
    tIcuContainerNode: TIcuContainerNode,
    lView: LView,
  ): IcuIterator {
    _state.lView = lView;
    while (_state.stack.length) _state.stack.pop();
    ngDevMode && assertTNodeForLView(tIcuContainerNode, lView);
    enterIcu(_state, tIcuContainerNode.value, lView);
    return icuContainerIteratorNext.bind(null, _state);
  }

  return icuContainerIteratorStart;
}

export function createIcuIterator(tIcu: TIcu, lView: LView): IcuIterator {
  const state: IcuIteratorState = {
    stack: [],
    index: -1,
    lView,
  };
  ngDevMode && assertTIcu(tIcu);
  enterIcu(state, tIcu, lView);
  return icuContainerIteratorNext.bind(null, state);
}
