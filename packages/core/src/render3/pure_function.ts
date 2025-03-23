/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertIndexInRange} from '../util/assert';
import {
  bindingUpdated,
  bindingUpdated2,
  bindingUpdated3,
  bindingUpdated4,
  getBinding,
  updateBinding,
} from './bindings';
import {LView} from './interfaces/view';
import {getBindingRoot, getLView} from './state';
import {NO_CHANGE} from './tokens';

/**
 * 순수 함수에 대한 바인딩은 일반 바인딩 이후에 저장됩니다.
 *
 * |-------decls------|---------vars---------|                 |----- hostVars (dir1) ------|
 * ------------------------------------------------------------------------------------------
 * | nodes/refs/pipes | bindings | fn slots  | injector | dir1 | host bindings | host slots |
 * ------------------------------------------------------------------------------------------
 *                    ^                      ^
 *      TView.bindingStartIndex      TView.expandoStartIndex
 *
 * 순수 함수 지침은 바인딩 루트에서 오프셋을 부여받습니다. 오프셋을 바인딩 루트에 추가하면 바인딩이 저장되는 첫 번째 인덱스가 얻어집니다. 컴포넌트 뷰에서는 바인딩 루트가 bindingStartIndex입니다. 호스트 바인딩에서는 바인딩 루트가 expandoStartIndex + 평가된 어떤 지시기 인스턴스 + 지시기 내의 어떤 hostVars입니다.
 *
 * 호스트 바인딩 해석에 대한 자세한 내용은 VIEW_DATA.md를 참조하십시오.
 */

/**
 * 값이 저장되지 않았다면, 순수 함수를 호출하여 값을 저장하고 반환합니다. 값이 저장되어 있다면 저장된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn 값을 반환하는 함수
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction0<T>(slotOffset: number, pureFn: () => T, thisArg?: any): T {
  const bindingIndex = getBindingRoot() + slotOffset;
  const lView = getLView();
  return lView[bindingIndex] === NO_CHANGE
    ? updateBinding(lView, bindingIndex, thisArg ? pureFn.call(thisArg) : pureFn())
    : getBinding(lView, bindingIndex);
}

/**
 * 제공된 exp의 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn 업데이트된 값을 반환하는 함수
 * @param exp 업데이트된 표현식 값
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction1(
  slotOffset: number,
  pureFn: (v: any) => any,
  exp: any,
  thisArg?: any,
): any {
  return pureFunction1Internal(getLView(), getBindingRoot(), slotOffset, pureFn, exp, thisArg);
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction2(
  slotOffset: number,
  pureFn: (v1: any, v2: any) => any,
  exp1: any,
  exp2: any,
  thisArg?: any,
): any {
  return pureFunction2Internal(
    getLView(),
    getBindingRoot(),
    slotOffset,
    pureFn,
    exp1,
    exp2,
    thisArg,
  );
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction3(
  slotOffset: number,
  pureFn: (v1: any, v2: any, v3: any) => any,
  exp1: any,
  exp2: any,
  exp3: any,
  thisArg?: any,
): any {
  return pureFunction3Internal(
    getLView(),
    getBindingRoot(),
    slotOffset,
    pureFn,
    exp1,
    exp2,
    exp3,
    thisArg,
  );
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction4(
  slotOffset: number,
  pureFn: (v1: any, v2: any, v3: any, v4: any) => any,
  exp1: any,
  exp2: any,
  exp3: any,
  exp4: any,
  thisArg?: any,
): any {
  return pureFunction4Internal(
    getLView(),
    getBindingRoot(),
    slotOffset,
    pureFn,
    exp1,
    exp2,
    exp3,
    exp4,
    thisArg,
  );
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param exp5
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction5(
  slotOffset: number,
  pureFn: (v1: any, v2: any, v3: any, v4: any, v5: any) => any,
  exp1: any,
  exp2: any,
  exp3: any,
  exp4: any,
  exp5: any,
  thisArg?: any,
): any {
  const bindingIndex = getBindingRoot() + slotOffset;
  const lView = getLView();
  const different = bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4);
  return bindingUpdated(lView, bindingIndex + 4, exp5) || different
    ? updateBinding(
        lView,
        bindingIndex + 5,
        thisArg
          ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5)
          : pureFn(exp1, exp2, exp3, exp4, exp5),
      )
    : getBinding(lView, bindingIndex + 5);
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param exp5
 * @param exp6
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction6(
  slotOffset: number,
  pureFn: (v1: any, v2: any, v3: any, v4: any, v5: any, v6: any) => any,
  exp1: any,
  exp2: any,
  exp3: any,
  exp4: any,
  exp5: any,
  exp6: any,
  thisArg?: any,
): any {
  const bindingIndex = getBindingRoot() + slotOffset;
  const lView = getLView();
  const different = bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4);
  return bindingUpdated2(lView, bindingIndex + 4, exp5, exp6) || different
    ? updateBinding(
        lView,
        bindingIndex + 6,
        thisArg
          ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6)
          : pureFn(exp1, exp2, exp3, exp4, exp5, exp6),
      )
    : getBinding(lView, bindingIndex + 6);
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param exp5
 * @param exp6
 * @param exp7
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction7(
  slotOffset: number,
  pureFn: (v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any) => any,
  exp1: any,
  exp2: any,
  exp3: any,
  exp4: any,
  exp5: any,
  exp6: any,
  exp7: any,
  thisArg?: any,
): any {
  const bindingIndex = getBindingRoot() + slotOffset;
  const lView = getLView();
  let different = bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4);
  return bindingUpdated3(lView, bindingIndex + 4, exp5, exp6, exp7) || different
    ? updateBinding(
        lView,
        bindingIndex + 7,
        thisArg
          ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7)
          : pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7),
      )
    : getBinding(lView, bindingIndex + 7);
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param exp5
 * @param exp6
 * @param exp7
 * @param exp8
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunction8(
  slotOffset: number,
  pureFn: (v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any) => any,
  exp1: any,
  exp2: any,
  exp3: any,
  exp4: any,
  exp5: any,
  exp6: any,
  exp7: any,
  exp8: any,
  thisArg?: any,
): any {
  const bindingIndex = getBindingRoot() + slotOffset;
  const lView = getLView();
  const different = bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4);
  return bindingUpdated4(lView, bindingIndex + 4, exp5, exp6, exp7, exp8) || different
    ? updateBinding(
        lView,
        bindingIndex + 8,
        thisArg
          ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8)
          : pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8),
      )
    : getBinding(lView, bindingIndex + 8);
}

/**
 * 순수 함수 지침은 임의의 수의 바인딩을 지원할 수 있습니다.
 *
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn 바인딩 값을 가져와 객체나 배열을 생성하는 순수 함수
 * @param exps 바인딩 값의 배열
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 * @codeGenApi
 */
export function ɵɵpureFunctionV(
  slotOffset: number,
  pureFn: (...v: any[]) => any,
  exps: any[],
  thisArg?: any,
): any {
  return pureFunctionVInternal(getLView(), getBindingRoot(), slotOffset, pureFn, exps, thisArg);
}

/**
 * 순수 함수 호출의 결과는 NO_CHANGE로 초기화된 전용 슬롯에서 LView에 저장됩니다. 드물게 순수 파이프가 첫 번째 호출 시 예외를 발생시키고 유효한 결과를 생성하지 않을 수 있습니다. 이 경우 LView는 NO_CHANGE 값을 계속 가지고 있게 됩니다. NO_CHANGE는 표현식 / 바인딩에서 사용할 수 있는 것이 아니므로 `undefined`로 변환합니다.
 */
function getPureFunctionReturnValue(lView: LView, returnValueIndex: number) {
  ngDevMode && assertIndexInRange(lView, returnValueIndex);
  const lastReturnValue = lView[returnValueIndex];
  return lastReturnValue === NO_CHANGE ? undefined : lastReturnValue;
}

/**
 * 제공된 exp의 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param lView 함수가 실행되는 LView.
 * @param bindingRoot 바인딩 루트 인덱스.
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn 업데이트된 값을 반환하는 함수
 * @param exp 업데이트된 표현식 값
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 */
export function pureFunction1Internal(
  lView: LView,
  bindingRoot: number,
  slotOffset: number,
  pureFn: (v: any) => any,
  exp: any,
  thisArg?: any,
): any {
  const bindingIndex = bindingRoot + slotOffset;
  return bindingUpdated(lView, bindingIndex, exp)
    ? updateBinding(lView, bindingIndex + 1, thisArg ? pureFn.call(thisArg, exp) : pureFn(exp))
    : getPureFunctionReturnValue(lView, bindingIndex + 1);
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param lView 함수가 실행되는 LView.
 * @param bindingRoot 바인딩 루트 인덱스.
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 */
export function pureFunction2Internal(
  lView: LView,
  bindingRoot: number,
  slotOffset: number,
  pureFn: (v1: any, v2: any) => any,
  exp1: any,
  exp2: any,
  thisArg?: any,
): any {
  const bindingIndex = bindingRoot + slotOffset;
  return bindingUpdated2(lView, bindingIndex, exp1, exp2)
    ? updateBinding(
        lView,
        bindingIndex + 2,
        thisArg ? pureFn.call(thisArg, exp1, exp2) : pureFn(exp1, exp2),
      )
    : getPureFunctionReturnValue(lView, bindingIndex + 2);
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param lView 함수가 실행되는 LView.
 * @param bindingRoot 바인딩 루트 인덱스.
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 */
export function pureFunction3Internal(
  lView: LView,
  bindingRoot: number,
  slotOffset: number,
  pureFn: (v1: any, v2: any, v3: any) => any,
  exp1: any,
  exp2: any,
  exp3: any,
  thisArg?: any,
): any {
  const bindingIndex = bindingRoot + slotOffset;
  return bindingUpdated3(lView, bindingIndex, exp1, exp2, exp3)
    ? updateBinding(
        lView,
        bindingIndex + 3,
        thisArg ? pureFn.call(thisArg, exp1, exp2, exp3) : pureFn(exp1, exp2, exp3),
      )
    : getPureFunctionReturnValue(lView, bindingIndex + 3);
}

/**
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param lView 함수가 실행되는 LView.
 * @param bindingRoot 바인딩 루트 인덱스.
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn
 * @param exp1
 * @param exp2
 * @param exp3
 * @param exp4
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 *
 */
export function pureFunction4Internal(
  lView: LView,
  bindingRoot: number,
  slotOffset: number,
  pureFn: (v1: any, v2: any, v3: any, v4: any) => any,
  exp1: any,
  exp2: any,
  exp3: any,
  exp4: any,
  thisArg?: any,
): any {
  const bindingIndex = bindingRoot + slotOffset;
  return bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4)
    ? updateBinding(
        lView,
        bindingIndex + 4,
        thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4) : pureFn(exp1, exp2, exp3, exp4),
      )
    : getPureFunctionReturnValue(lView, bindingIndex + 4);
}

/**
 * 순수 함수 지침은 임의의 수의 바인딩을 지원할 수 있습니다.
 *
 * 제공된 exp 중 어떤 것이든 값이 변경되었다면, 순수 함수를 호출하여 업데이트된 값을 반환합니다. 값이 변경되지 않았다면, 캐시된 값을 반환합니다.
 *
 * @param lView 함수가 실행되는 LView.
 * @param bindingRoot 바인딩 루트 인덱스.
 * @param slotOffset 바인딩 루트에서 예약된 슬롯까지의 오프셋
 * @param pureFn 바인딩 값을 가져와 객체나 배열을 생성하는 순수 함수
 * @param exps 바인딩 값의 배열
 * @param thisArg 순수 함수의 선택적 호출 컨텍스트
 * @returns 업데이트된 값 또는 캐시된 값
 */
export function pureFunctionVInternal(
  lView: LView,
  bindingRoot: number,
  slotOffset: number,
  pureFn: (...v: any[]) => any,
  exps: any[],
  thisArg?: any,
): any {
  let bindingIndex = bindingRoot + slotOffset;
  let different = false;
  for (let i = 0; i < exps.length; i++) {
    bindingUpdated(lView, bindingIndex++, exps[i]) && (different = true);
  }
  return different
    ? updateBinding(lView, bindingIndex, pureFn.apply(thisArg, exps))
    : getPureFunctionReturnValue(lView, bindingIndex);
}
