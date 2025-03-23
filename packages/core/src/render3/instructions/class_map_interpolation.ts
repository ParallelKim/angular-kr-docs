/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {keyValueArraySet} from '../../util/array_utils';
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
import {checkStylingMap, classStringParser} from './styling';

/**
 *
 * 단일 바인드 값이 텍스트로 둘러싸인 요소의 보간된 클래스를 업데이트합니다.
 *
 * 속성에 전달된 값에 1개의 보간 값이 포함된 경우 사용됩니다:
 *
 * ```html
 * <div class="prefix{{v0}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolate1('prefix', v0, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경을 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate1(prefix: string, v0: any, suffix?: string): void {
  const lView = getLView();
  const interpolatedValue = interpolation1(lView, prefix, v0, suffix);
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}

/**
 *
 * 2개의 바인드 값이 텍스트로 둘러싸인 요소의 보간된 클래스를 업데이트합니다.
 *
 * 속성에 전달된 값에 2개의 보간 값이 포함된 경우 사용됩니다:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolate2('prefix', v0, '-', v1, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경을 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경을 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate2(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  suffix?: string,
): void {
  const lView = getLView();
  const interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}

/**
 *
 * 3개의 바인드 값이 텍스트로 둘러싸인 요소의 보간된 클래스를 업데이트합니다.
 *
 * 속성에 전달된 값에 3개의 보간 값이 포함된 경우 사용됩니다:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolate3(
 * 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경을 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경을 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경을 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate3(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  suffix?: string,
): void {
  const lView = getLView();
  const interpolatedValue = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}

/**
 *
 * 4개의 바인드 값이 텍스트로 둘러싸인 요소의 보간된 클래스를 업데이트합니다.
 *
 * 속성에 전달된 값에 4개의 보간 값이 포함된 경우 사용됩니다:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolate4(
 * 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경을 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경을 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경을 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경을 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate4(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  suffix?: string,
): void {
  const lView = getLView();
  const interpolatedValue = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}

/**
 *
 * 5개의 바인드 값이 텍스트로 둘러싸인 요소의 보간된 클래스를 업데이트합니다.
 *
 * 속성에 전달된 값에 5개의 보간 값이 포함된 경우 사용됩니다:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolate5(
 * 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경을 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경을 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경을 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경을 확인하는 값.
 * @param i3 연결에만 사용되는 정적 값.
 * @param v4 변경을 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate5(
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
): void {
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
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}

/**
 *
 * 6개의 바인드 값이 텍스트로 둘러싸인 요소의 보간된 클래스를 업데이트합니다.
 *
 * 속성에 전달된 값에 6개의 보간 값이 포함된 경우 사용됩니다:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolate6(
 *    'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경을 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경을 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경을 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경을 확인하는 값.
 * @param i3 연결에만 사용되는 정적 값.
 * @param v4 변경을 확인하는 값.
 * @param i4 연결에만 사용되는 정적 값.
 * @param v5 변경을 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate6(
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
): void {
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
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}

/**
 *
 * 7개의 바인드 값이 텍스트로 둘러싸인 요소의 보간된 클래스를 업데이트합니다.
 *
 * 속성에 전달된 값에 7개의 보간 값이 포함된 경우 사용됩니다:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolate7(
 *    'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경을 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경을 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경을 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경을 확인하는 값.
 * @param i3 연결에만 사용되는 정적 값.
 * @param v4 변경을 확인하는 값.
 * @param i4 연결에만 사용되는 정적 값.
 * @param v5 변경을 확인하는 값.
 * @param i5 연결에만 사용되는 정적 값.
 * @param v6 변경을 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate7(
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
): void {
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
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}

/**
 *
 * 8개의 바인드 값이 텍스트로 둘러싸인 요소의 보간된 클래스를 업데이트합니다.
 *
 * 속성에 전달된 값에 8개의 보간 값이 포함된 경우 사용됩니다:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolate8(
 *  'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경을 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경을 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경을 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경을 확인하는 값.
 * @param i3 연결에만 사용되는 정적 값.
 * @param v4 변경을 확인하는 값.
 * @param i4 연결에만 사용되는 정적 값.
 * @param v5 변경을 확인하는 값.
 * @param i5 연결에만 사용되는 정적 값.
 * @param v6 변경을 확인하는 값.
 * @param i6 연결에만 사용되는 정적 값.
 * @param v7 변경을 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate8(
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
): void {
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
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}

/**
 * 텍스트로 둘러싸인 9개 이상의 바인드 값이 있는 요소의 보간 클래스를 업데이트합니다.
 *
 * 보간 값의 수가 8을 초과할 때 사용됩니다.
 *
 * ```html
 * <div
 *  class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix"></div>
 * ```
 *
 * 그것의 컴파일된 표현은:
 *
 * ```ts
 * ɵɵclassMapInterpolateV(
 *  ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 *.
 * @param values 값의 모음 및 그 값들 사이의 문자열, 문자열 접두사로 시작하고 문자열 접미사로 끝납니다.
 * (예: `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 * @codeGenApi
 */
export function ɵɵclassMapInterpolateV(values: any[]): void {
  const lView = getLView();
  const interpolatedValue = interpolationV(lView, values);
  checkStylingMap(keyValueArraySet, classStringParser, interpolatedValue, true);
}
