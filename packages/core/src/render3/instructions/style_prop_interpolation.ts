/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {getLView} from '../state';
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
import {checkStylingProperty} from './styling';

/**
 *
 * 텍스트로 둘러싸인 단일 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 속성으로 전달된 값에 1개의 보간된 값이 있는 경우 사용됩니다:
 *
 * ```html
 * <div style.color="prefix{{v0}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolate1(0, 'prefix', v0, 'suffix');
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate1(
  prop: string,
  prefix: string,
  v0: any,
  suffix?: string,
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolate1 {
  const lView = getLView();
  const interpolatedValue = interpolation1(lView, prefix, v0, suffix);
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolate1;
}

/**
 *
 * 텍스트로 둘러싸인 2개의 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 속성으로 전달된 값에 2개의 보간된 값이 있는 경우 사용됩니다:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolate2(0, 'prefix', v0, '-', v1, 'suffix');
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate2(
  prop: string,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  suffix?: string,
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolate2 {
  const lView = getLView();
  const interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolate2;
}

/**
 *
 * 텍스트로 둘러싸인 3개의 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 속성으로 전달된 값에 3개의 보간된 값이 있는 경우 사용됩니다:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolate3(0, 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 사항을 확인할 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate3(
  prop: string,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  suffix?: string,
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolate3 {
  const lView = getLView();
  const interpolatedValue = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolate3;
}

/**
 *
 * 텍스트로 둘러싸인 4개의 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 속성으로 전달된 값에 4개의 보간된 값이 있는 경우 사용됩니다:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolate4(0, 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 사항을 확인할 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 사항을 확인할 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate4(
  prop: string,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  suffix?: string,
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolate4 {
  const lView = getLView();
  const interpolatedValue = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolate4;
}

/**
 *
 * 텍스트로 둘러싸인 5개의 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 속성으로 전달된 값에 5개의 보간된 값이 있는 경우 사용됩니다:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolate5(0, 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 사항을 확인할 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 사항을 확인할 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 사항을 확인할 값입니다.
 * @param i3 연결에만 사용되는 정적 값입니다.
 * @param v4 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate5(
  prop: string,
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
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolate5 {
  const lView = getLView();
  const interpolatedValue = interpolation5(
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
    suffix,
  );
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolate5;
}

/**
 *
 * 텍스트로 둘러싸인 6개의 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 속성으로 전달된 값에 6개의 보간된 값이 있는 경우 사용됩니다:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolate6(0, 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 사항을 확인할 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 사항을 확인할 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 사항을 확인할 값입니다.
 * @param i3 연결에만 사용되는 정적 값입니다.
 * @param v4 변경 사항을 확인할 값입니다.
 * @param i4 연결에만 사용되는 정적 값입니다.
 * @param v5 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate6(
  prop: string,
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
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolate6 {
  const lView = getLView();
  const interpolatedValue = interpolation6(
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
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolate6;
}

/**
 *
 * 텍스트로 둘러싸인 7개의 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 속성으로 전달된 값에 7개의 보간된 값이 있는 경우 사용됩니다:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolate7(
 *    0, 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 사항을 확인할 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 사항을 확인할 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 사항을 확인할 값입니다.
 * @param i3 연결에만 사용되는 정적 값입니다.
 * @param v4 변경 사항을 확인할 값입니다.
 * @param i4 연결에만 사용되는 정적 값입니다.
 * @param v5 변경 사항을 확인할 값입니다.
 * @param i5 연결에만 사용되는 정적 값입니다.
 * @param v6 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate7(
  prop: string,
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
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolate7 {
  const lView = getLView();
  const interpolatedValue = interpolation7(
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
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolate7;
}

/**
 *
 * 텍스트로 둘러싸인 8개의 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 속성으로 전달된 값에 8개의 보간된 값이 있는 경우 사용됩니다:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolate8(0, 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6,
 * '-', v7, 'suffix');
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 사항을 확인할 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 사항을 확인할 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 사항을 확인할 값입니다.
 * @param i3 연결에만 사용되는 정적 값입니다.
 * @param v4 변경 사항을 확인할 값입니다.
 * @param i4 연결에만 사용되는 정적 값입니다.
 * @param v5 변경 사항을 확인할 값입니다.
 * @param i5 연결에만 사용되는 정적 값입니다.
 * @param v6 변경 사항을 확인할 값입니다.
 * @param i6 연결에만 사용되는 정적 값입니다.
 * @param v7 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate8(
  prop: string,
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
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolate8 {
  const lView = getLView();
  const interpolatedValue = interpolation8(
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
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolate8;
}

/**
 * 텍스트로 둘러싸인 9개 이상의 바인드 값이 있는 요소의 보간된 스타일 속성을 업데이트합니다.
 *
 * 보간된 값의 수가 8을 초과할 때 사용됩니다.
 *
 * ```html
 * <div
 *  style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix">
 * </div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstylePropInterpolateV(
 *  0, ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 *
 * @param styleIndex 업데이트할 스타일의 인덱스. 이 인덱스 값은
 *        `styling`에 전달된 스타일 바인딩 배열의 스타일 인덱스를 참조합니다.
 * @param values 값과 해당 값들 사이의 문자열을 포함하는 컬렉션, 문자열 접두사로 시작하고 문자열 접미사로 끝납니다.
 * (예: `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 * @param valueSuffix 선택적 접미사. 스칼라 값에 `px`와 같은 단위를 추가하는 데 사용됩니다.
 * @returns 체이닝할 수 있도록 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolateV(
  prop: string,
  values: any[],
  valueSuffix?: string | null,
): typeof ɵɵstylePropInterpolateV {
  const lView = getLView();
  const interpolatedValue = interpolationV(lView, values);
  checkStylingProperty(prop, interpolatedValue, valueSuffix, false);
  return ɵɵstylePropInterpolateV;
}
