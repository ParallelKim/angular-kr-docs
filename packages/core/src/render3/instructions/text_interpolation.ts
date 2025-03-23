/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {assertDefined, assertIndexInRange, assertNotSame, assertString} from '../../util/assert';
import {RText} from '../interfaces/renderer_dom';
import {LView, RENDERER} from '../interfaces/view';
import {updateTextNode} from '../dom_node_manipulation';
import {getLView, getSelectedIndex} from '../state';
import {NO_CHANGE} from '../tokens';
import {getNativeByIndex} from '../util/view_utils';

import {
  interpolation1,
  interpolation2,
  interpolation3,
  interpolation4,
  interpolation5,
  interpolation6,
  interpolation7,
  interpolation8,
  interpolationV,
} from './interpolation';

/**
 *
 * 단일 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 1개의 보간 값만 포함되어 있을 때 사용되며,
 * 그 보간 값을 둘러싼 추가 텍스트가 없습니다:
 *
 * ```html
 * <div>{{v0}}</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate(v0);
 * ```
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate(v0: any): typeof ɵɵtextInterpolate {
  ɵɵtextInterpolate1('', v0);
  return ɵɵtextInterpolate;
}

/**
 *
 * 다른 텍스트로 둘러싸인 단일 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 1개의 보간 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div>prefix{{v0}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate1('prefix', v0, 'suffix');
 * ```
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate1(
  prefix: string,
  v0: any,
  suffix?: string,
): typeof ɵɵtextInterpolate1 {
  const lView = getLView();
  const interpolated = interpolation1(lView, prefix, v0, suffix);
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolate1;
}

/**
 *
 * 다른 텍스트로 둘러싸인 2개의 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 2개의 보간 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate2('prefix', v0, '-', v1, 'suffix');
 * ```
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate2(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  suffix?: string,
): typeof ɵɵtextInterpolate2 {
  const lView = getLView();
  const interpolated = interpolation2(lView, prefix, v0, i0, v1, suffix);
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolate2;
}

/**
 *
 * 다른 텍스트로 둘러싸인 3개의 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 3개의 보간 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate3(
 * 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate3(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  suffix?: string,
): typeof ɵɵtextInterpolate3 {
  const lView = getLView();
  const interpolated = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolate3;
}

/**
 *
 * 다른 텍스트로 둘러싸인 4개의 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 4개의 보간 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate4(
 * 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see ɵɵtextInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate4(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  suffix?: string,
): typeof ɵɵtextInterpolate4 {
  const lView = getLView();
  const interpolated = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolate4;
}

/**
 *
 * 다른 텍스트로 둘러싸인 5개의 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 5개의 보간 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate5(
 * 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate5(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  i3: string,
  v4: any,
  suffix?: string,
): typeof ɵɵtextInterpolate5 {
  const lView = getLView();
  const interpolated = interpolation5(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix);
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolate5;
}

/**
 *
 * 다른 텍스트로 둘러싸인 6개의 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 6개의 보간 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate6(
 *    'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * @param i4 연결에만 사용되는 정적 값입니다.
 * @param v5 변경 사항을 확인하는 값입니다. @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate6(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  i3: string,
  v4: any,
  i4: string,
  v5: any,
  suffix?: string,
): typeof ɵɵtextInterpolate6 {
  const lView = getLView();
  const interpolated = interpolation6(
    lView,
    prefix,
    v0,
    i0,
    v1,
    i1,
    v2,
    i2,
    v3,
    i3,
    v4,
    i4,
    v5,
    suffix,
  );
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolate6;
}

/**
 *
 * 다른 텍스트로 둘러싸인 7개의 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 7개의 보간 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate7(
 *    'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate7(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  i3: string,
  v4: any,
  i4: string,
  v5: any,
  i5: string,
  v6: any,
  suffix?: string,
): typeof ɵɵtextInterpolate7 {
  const lView = getLView();
  const interpolated = interpolation7(
    lView,
    prefix,
    v0,
    i0,
    v1,
    i1,
    v2,
    i2,
    v3,
    i3,
    v4,
    i4,
    v5,
    i5,
    v6,
    suffix,
  );
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolate7;
}

/**
 *
 * 다른 텍스트로 둘러싸인 8개의 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 텍스트 노드에 8개의 보간 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolate8(
 *  'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, 'suffix');
 * ```
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate8(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  i3: string,
  v4: any,
  i4: string,
  v5: any,
  i5: string,
  v6: any,
  i6: string,
  v7: any,
  suffix?: string,
): typeof ɵɵtextInterpolate8 {
  const lView = getLView();
  const interpolated = interpolation8(
    lView,
    prefix,
    v0,
    i0,
    v1,
    i1,
    v2,
    i2,
    v3,
    i3,
    v4,
    i4,
    v5,
    i5,
    v6,
    i6,
    v7,
    suffix,
  );
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolate8;
}

/**
 * 텍스트 주변에 9개 이상의 바인딩 값으로 텍스트 내용을 업데이트합니다.
 *
 * 보간 값의 수가 8을 초과할 때 사용됩니다.
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix</div>
 * ```
 *
 * 해당 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵtextInterpolateV(
 *  ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 * @param values 값의 컬렉션과 그 값들 사이의 문자열로, 문자열 접두사로 시작하고 문자열 접미사로 끝납니다.
 * (예: `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 *
 * @returns 자신을 반환하여 체이닝이 가능하도록 합니다.
 * @codeGenApi
 */
export function ɵɵtextInterpolateV(values: any[]): typeof ɵɵtextInterpolateV {
  const lView = getLView();
  const interpolated = interpolationV(lView, values);
  if (interpolated !== NO_CHANGE) {
    textBindingInternal(lView, getSelectedIndex(), interpolated as string);
  }
  return ɵɵtextInterpolateV;
}

/**
 * 주어진 LView의 주어진 인덱스에서 텍스트 바인딩을 업데이트합니다.
 */
function textBindingInternal(lView: LView, index: number, value: string): void {
  ngDevMode && assertString(value, 'Value should be a string');
  ngDevMode && assertNotSame(value, NO_CHANGE as any, 'value should not be NO_CHANGE');
  ngDevMode && assertIndexInRange(lView, index);
  const element = getNativeByIndex(index, lView) as any as RText;
  ngDevMode && assertDefined(element, 'native element should exist');
  updateTextNode(lView[RENDERER], element, value);
}
