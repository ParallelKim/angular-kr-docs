/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertIndexInRange, assertLessThan, assertNotSame} from '../util/assert';
import {devModeEqual} from '../util/comparison';

import {getExpressionChangedErrorDetails, throwErrorIfNoChangesMode} from './errors';
import {LView} from './interfaces/view';
import {isInCheckNoChangesMode} from './state';
import {NO_CHANGE} from './tokens';

// TODO(misko): consider inlining
/** 바인딩을 업데이트하고 값을 반환합니다. */
export function updateBinding(lView: LView, bindingIndex: number, value: any): any {
  return (lView[bindingIndex] = value);
}

/** 현재 바인딩 값을 가져옵니다. */
export function getBinding(lView: LView, bindingIndex: number): any {
  ngDevMode && assertIndexInRange(lView, bindingIndex);
  ngDevMode &&
    assertNotSame(lView[bindingIndex], NO_CHANGE, '저장된 값은 결코 NO_CHANGE여서는 안 됩니다.');
  return lView[bindingIndex];
}

/**
 * 변경된 경우 바인딩을 업데이트하고 업데이트 여부를 반환합니다.
 *
 * 이 함수는 `CheckNoChangesMode`를 확인하고 변경이 있을 경우 예외를 발생시킵니다.
 * `CheckNoChangesMode` 동안의 일부 변경(Object/iterables)은 VE 동작을 준수하기 위해 면제됩니다.
 *
 * @param lView 현재 `LView`
 * @param bindingIndex 확인할 `LView`의 바인딩
 * @param value `lView[bindingIndex]`와 비교할 새로운 값
 * @returns 바인딩이 변경된 경우 `true`를 반환합니다. (`CheckNoChangesMode` 동안 바인딩이 변경되면 예외 발생)
 */
export function bindingUpdated(lView: LView, bindingIndex: number, value: any): boolean {
  ngDevMode && assertNotSame(value, NO_CHANGE, '수신 값은 결코 NO_CHANGE여서는 안 됩니다.');
  ngDevMode &&
    assertLessThan(bindingIndex, lView.length, `슬롯은 NO_CHANGE로 초기화되어야 했습니다.`);
  const oldValue = lView[bindingIndex];

  if (Object.is(oldValue, value)) {
    return false;
  } else {
    if (ngDevMode && isInCheckNoChangesMode()) {
      // 뷰 엔진은 첫 번째 checkNoChanges 통과에서 정의되지 않은 값을 변경된 것으로 보고하지 않았습니다.
      // (변경 감지가 실행되기 전입니다).
      const oldValueToCompare = oldValue !== NO_CHANGE ? oldValue : undefined;
      if (!devModeEqual(oldValueToCompare, value)) {
        const details = getExpressionChangedErrorDetails(
          lView,
          bindingIndex,
          oldValueToCompare,
          value,
        );
        throwErrorIfNoChangesMode(
          oldValue === NO_CHANGE,
          details.oldValue,
          details.newValue,
          details.propName,
          lView,
        );
      }
      // 변경이 있었지만 `devModeEqual`이 변경이 오류에서 면제되었다고 결정했습니다.
      // 이러한 이유로 우리는 변경이 없는 것처럼 종료합니다. 조기 종료는 변경된
      // 값을 `LView`에 쓸 수 없도록 하기 위해 필요합니다. (만약 새로운 값을 쓴다면 다음 CD에서
      // 그것을 변경으로 보지 않을 것입니다.)
      return false;
    }
    lView[bindingIndex] = value;
    return true;
  }
}

/** 변경된 경우 2개의 바인딩을 업데이트하고 둘 중 하나가 업데이트되었는지 반환합니다. */
export function bindingUpdated2(lView: LView, bindingIndex: number, exp1: any, exp2: any): boolean {
  const different = bindingUpdated(lView, bindingIndex, exp1);
  return bindingUpdated(lView, bindingIndex + 1, exp2) || different;
}

/** 변경된 경우 3개의 바인딩을 업데이트하고 하나라도 업데이트되었는지 반환합니다. */
export function bindingUpdated3(
  lView: LView,
  bindingIndex: number,
  exp1: any,
  exp2: any,
  exp3: any,
): boolean {
  const different = bindingUpdated2(lView, bindingIndex, exp1, exp2);
  return bindingUpdated(lView, bindingIndex + 2, exp3) || different;
}

/** 변경된 경우 4개의 바인딩을 업데이트하고 하나라도 업데이트되었는지 반환합니다. */
export function bindingUpdated4(
  lView: LView,
  bindingIndex: number,
  exp1: any,
  exp2: any,
  exp3: any,
  exp4: any,
): boolean {
  const different = bindingUpdated2(lView, bindingIndex, exp1, exp2);
  return bindingUpdated2(lView, bindingIndex + 2, exp3, exp4) || different;
}
