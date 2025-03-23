/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {performanceMarkFeature} from '../../util/performance';
import {TNodeType} from '../interfaces/node';
import {HEADER_OFFSET} from '../interfaces/view';
import {getContextLView, getLView, getSelectedIndex, getTView, setCurrentTNode} from '../state';
import {getOrCreateTNode} from '../tnode_manipulation';
import {load} from '../util/view_utils';
import {store} from './storage';

/** 초기화되지 않은 `@let` 선언의 값을 나타내는 객체. */
const UNINITIALIZED_LET = {};

/**
 * 특정 데이터 슬롯에 `@let`을 선언합니다. 체이닝을 허용하기 위해 자신을 반환합니다.
 *
 * @param index `@let`을 선언할 인덱스.
 *
 * @codeGenApi
 */
export function ɵɵdeclareLet(index: number): typeof ɵɵdeclareLet {
  const tView = getTView();
  const lView = getLView();
  const adjustedIndex = index + HEADER_OFFSET;
  const tNode = getOrCreateTNode(tView, adjustedIndex, TNodeType.LetDeclaration, null, null);
  setCurrentTNode(tNode, false);
  store(tView, lView, adjustedIndex, UNINITIALIZED_LET);
  return ɵɵdeclareLet;
}

/**
 * 현재 뷰에 `@let` 선언의 값을 저장하는 명령입니다.
 * 변수 초기화 내에서 사용을 허용하기 위해 값을 반환합니다.
 *
 * @codeGenApi
 */
export function ɵɵstoreLet<T>(value: T): T {
  performanceMarkFeature('NgLet');
  const tView = getTView();
  const lView = getLView();
  const index = getSelectedIndex();
  store(tView, lView, index, value);
  return value;
}

/**
 * 부모 뷰에서 정의된 `@let` 선언의 값을 검색합니다.
 *
 * @param index 뷰 내에서 선언의 인덱스.
 *
 * @codeGenApi
 */
export function ɵɵreadContextLet<T>(index: number): T {
  const contextLView = getContextLView();
  const value = load<T>(contextLView, HEADER_OFFSET + index);

  if (value === UNINITIALIZED_LET) {
    throw new RuntimeError(
      RuntimeErrorCode.UNINITIALIZED_LET_ACCESS,
      ngDevMode && '@let 선언의 값이 아직 사용 가능하지 않은 시도입니다',
    );
  }

  return value;
}
