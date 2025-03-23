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
import {ɵɵstyleMap} from './styling';

/**
 *
 * 텍스트로 둘러싸인 단일 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 속성에 전달된 값이 1개의 보간된 값을 가질 때 사용됩니다:
 *
 * ```html
 * <div style="key: {{v0}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolate1('key: ', v0, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 여부를 체크하는 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolate1(prefix: string, v0: any, suffix?: string): void {
  const lView = getLView();
  const interpolatedValue = interpolation1(lView, prefix, v0, suffix);
  ɵɵstyleMap(interpolatedValue);
}

/**
 *
 * 텍스트로 둘러싸인 2개의 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 속성에 전달된 값이 2개의 보간된 값을 가질 때 사용됩니다:
 *
 * ```html
 * <div style="key: {{v0}}; key1: {{v1}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolate2('key: ', v0, '; key1: ', v1, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 여부를 체크하는 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 여부를 체크하는 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolate2(
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  suffix?: string,
): void {
  const lView = getLView();
  const interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
  ɵɵstyleMap(interpolatedValue);
}

/**
 *
 * 텍스트로 둘러싸인 3개의 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 속성에 전달된 값이 3개의 보간된 값을 가질 때 사용됩니다:
 *
 * ```html
 * <div style="key: {{v0}}; key2: {{v1}}; key2: {{v2}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolate3(
 *     'key: ', v0, '; key1: ', v1, '; key2: ', v2, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 여부를 체크하는 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 여부를 체크하는 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 여부를 체크하는 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolate3(
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
  ɵɵstyleMap(interpolatedValue);
}

/**
 *
 * 텍스트로 둘러싸인 4개의 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 속성에 전달된 값이 4개의 보간된 값을 가질 때 사용됩니다:
 *
 * ```html
 * <div style="key: {{v0}}; key1: {{v1}}; key2: {{v2}}; key3: {{v3}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolate4(
 *     'key: ', v0, '; key1: ', v1, '; key2: ', v2, '; key3: ', v3, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 여부를 체크하는 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 여부를 체크하는 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 여부를 체크하는 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 여부를 체크하는 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolate4(
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
  ɵɵstyleMap(interpolatedValue);
}

/**
 *
 * 텍스트로 둘러싸인 5개의 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 속성에 전달된 값이 5개의 보간된 값을 가질 때 사용됩니다:
 *
 * ```html
 * <div style="key: {{v0}}; key1: {{v1}}; key2: {{v2}}; key3: {{v3}}; key4: {{v4}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolate5(
 *     'key: ', v0, '; key1: ', v1, '; key2: ', v2, '; key3: ', v3, '; key4: ', v4, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 여부를 체크하는 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 여부를 체크하는 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 여부를 체크하는 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 여부를 체크하는 값입니다.
 * @param i3 연결에만 사용되는 정적 값입니다.
 * @param v4 변경 여부를 체크하는 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolate5(
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
  ɵɵstyleMap(interpolatedValue);
}

/**
 *
 * 텍스트로 둘러싸인 6개의 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 속성에 전달된 값이 6개의 보간된 값을 가질 때 사용됩니다:
 *
 * ```html
 * <div style="key: {{v0}}; key1: {{v1}}; key2: {{v2}}; key3: {{v3}}; key4: {{v4}};
 *             key5: {{v5}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolate6(
 *    'key: ', v0, '; key1: ', v1, '; key2: ', v2, '; key3: ', v3, '; key4: ', v4, '; key5: ', v5,
 *    'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 여부를 체크하는 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 여부를 체크하는 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 여부를 체크하는 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 여부를 체크하는 값입니다.
 * @param i3 연결에만 사용되는 정적 값입니다.
 * @param v4 변경 여부를 체크하는 값입니다.
 * @param i4 연결에만 사용되는 정적 값입니다.
 * @param v5 변경 여부를 체크하는 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolate6(
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
  ɵɵstyleMap(interpolatedValue);
}

/**
 *
 * 텍스트로 둘러싸인 7개의 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 속성에 전달된 값이 7개의 보간된 값을 가질 때 사용됩니다:
 *
 * ```html
 * <div style="key: {{v0}}; key1: {{v1}}; key2: {{v2}}; key3: {{v3}}; key4: {{v4}}; key5: {{v5}};
 *             key6: {{v6}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolate7(
 *    'key: ', v0, '; key1: ', v1, '; key2: ', v2, '; key3: ', v3, '; key4: ', v4, '; key5: ', v5,
 *    '; key6: ', v6, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 여부를 체크하는 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 여부를 체크하는 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 여부를 체크하는 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 여부를 체크하는 값입니다.
 * @param i3 연결에만 사용되는 정적 값입니다.
 * @param v4 변경 여부를 체크하는 값입니다.
 * @param i4 연결에만 사용되는 정적 값입니다.
 * @param v5 변경 여부를 체크하는 값입니다.
 * @param i5 연결에만 사용되는 정적 값입니다.
 * @param v6 변경 여부를 체크하는 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolate7(
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
  ɵɵstyleMap(interpolatedValue);
}

/**
 *
 * 텍스트로 둘러싸인 8개의 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 속성에 전달된 값이 8개의 보간된 값을 가질 때 사용됩니다:
 *
 * ```html
 * <div style="key: {{v0}}; key1: {{v1}}; key2: {{v2}}; key3: {{v3}}; key4: {{v4}}; key5: {{v5}};
 *             key6: {{v6}}; key7: {{v7}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolate8(
 *    'key: ', v0, '; key1: ', v1, '; key2: ', v2, '; key3: ', v3, '; key4: ', v4, '; key5: ', v5,
 *    '; key6: ', v6, '; key7: ', v7, 'suffix');
 * ```
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 여부를 체크하는 값입니다.
 * @param i0 연결에만 사용되는 정적 값입니다.
 * @param v1 변경 여부를 체크하는 값입니다.
 * @param i1 연결에만 사용되는 정적 값입니다.
 * @param v2 변경 여부를 체크하는 값입니다.
 * @param i2 연결에만 사용되는 정적 값입니다.
 * @param v3 변경 여부를 체크하는 값입니다.
 * @param i3 연결에만 사용되는 정적 값입니다.
 * @param v4 변경 여부를 체크하는 값입니다.
 * @param i4 연결에만 사용되는 정적 값입니다.
 * @param v5 변경 여부를 체크하는 값입니다.
 * @param i5 연결에만 사용되는 정적 값입니다.
 * @param v6 변경 여부를 체크하는 값입니다.
 * @param i6 연결에만 사용되는 정적 값입니다.
 * @param v7 변경 여부를 체크하는 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolate8(
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
  ɵɵstyleMap(interpolatedValue);
}

/**
 * 텍스트로 둘러싸인 9개 이상의 바인딩 값을 가진 요소에서 보간된 스타일을 업데이트합니다.
 *
 * 보간된 값의 수가 8을 초과할 때 사용됩니다.
 *
 * ```html
 * <div
 *  class="key: {{v0}}; key1: {{v1}}; key2: {{v2}}; key3: {{v3}}; key4: {{v4}}; key5: {{v5}};
 *         key6: {{v6}}; key7: {{v7}}; key8: {{v8}}; key9: {{v9}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다:
 *
 * ```ts
 * ɵɵstyleMapInterpolateV(
 *    ['key: ', v0, '; key1: ', v1, '; key2: ', v2, '; key3: ', v3, '; key4: ', v4, '; key5: ', v5,
 *     '; key6: ', v6, '; key7: ', v7, '; key8: ', v8, '; key9: ', v9, 'suffix']);
 * ```
 *.
 * @param values 값과 값 사이의 문자열을 포함하는 컬렉션으로, 문자열 프리픽스로 시작하고 문자열 서픽스로 끝납니다.
 * (예: `['prefix', value0, '; key2: ', value1, '; key2: ', value2, ..., value99, 'suffix']`)
 * @codeGenApi
 */
export function ɵɵstyleMapInterpolateV(values: any[]): void {
  const lView = getLView();
  const interpolatedValue = interpolationV(lView, values);
  ɵɵstyleMap(interpolatedValue);
}
