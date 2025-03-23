/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {SanitizerFn} from '../interfaces/sanitization';
import {getBindingIndex, getLView, getSelectedTNode, getTView} from '../state';
import {NO_CHANGE} from '../tokens';
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
import {elementAttributeInternal, storePropertyBindingMetadata} from './shared';

/**
 *
 * 텍스트로 둘러싸인 단일 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 1개의 보간 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div attr.title="prefix{{v0}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolate1('title', 'prefix', v0, 'suffix');
 * ```
 *
 * @param attrName 업데이트할 속성 이름
 * @param prefix 연결용으로만 사용되는 정적 값.
 * @param v0 변경 여부를 체크하는 값.
 * @param suffix 연결용으로만 사용되는 정적 값.
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate1(
  attrName: string,
  prefix: string,
  v0: any,
  suffix?: string,
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolate1 {
  const lView = getLView();
  const interpolatedValue = interpolation1(lView, prefix, v0, suffix);
  if (interpolatedValue !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolatedValue, sanitizer, namespace);
    ngDevMode &&
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - 1,
        prefix,
        suffix ?? '',
      );
  }
  return ɵɵattributeInterpolate1;
}

/**
 *
 * 텍스트로 둘러싸인 2개의 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 2개의 보간 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolate2('title', 'prefix', v0, '-', v1, 'suffix');
 * ```
 *
 * @param attrName 업데이트할 속성 이름
 * @param prefix 연결용으로만 사용되는 정적 값.
 * @param v0 변경 여부를 체크하는 값.
 * @param i0 연결용으로만 사용되는 정적 값.
 * @param v1 변경 여부를 체크하는 값.
 * @param suffix 연결용으로만 사용되는 정적 값.
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate2(
  attrName: string,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  suffix?: string,
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolate2 {
  const lView = getLView();
  const interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
  if (interpolatedValue !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolatedValue, sanitizer, namespace);
    ngDevMode &&
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - 2,
        prefix,
        i0,
        suffix ?? '',
      );
  }
  return ɵɵattributeInterpolate2;
}

/**
 *
 * 텍스트로 둘러싸인 3개의 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 3개의 보간 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolate3(
 * 'title', 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 *
 * @param attrName 업데이트할 속성 이름
 * @param prefix 연결용으로만 사용되는 정적 값.
 * @param v0 변경 여부를 체크하는 값.
 * @param i0 연결용으로만 사용되는 정적 값.
 * @param v1 변경 여부를 체크하는 값.
 * @param i1 연결용으로만 사용되는 정적 값.
 * @param v2 변경 여부를 체크하는 값.
 * @param suffix 연결용으로만 사용되는 정적 값.
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate3(
  attrName: string,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  suffix?: string,
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolate3 {
  const lView = getLView();
  const interpolatedValue = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
  if (interpolatedValue !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolatedValue, sanitizer, namespace);
    ngDevMode &&
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - 3,
        prefix,
        i0,
        i1,
        suffix ?? '',
      );
  }
  return ɵɵattributeInterpolate3;
}

/**
 *
 * 텍스트로 둘러싸인 4개의 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 4개의 보간 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolate4(
 * 'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 *
 * @param attrName 업데이트할 속성 이름
 * @param prefix 연결용으로만 사용되는 정적 값.
 * @param v0 변경 여부를 체크하는 값.
 * @param i0 연결용으로만 사용되는 정적 값.
 * @param v1 변경 여부를 체크하는 값.
 * @param i1 연결용으로만 사용되는 정적 값.
 * @param v2 변경 여부를 체크하는 값.
 * @param i2 연결용으로만 사용되는 정적 값.
 * @param v3 변경 여부를 체크하는 값.
 * @param suffix 연결용으로만 사용되는 정적 값.
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate4(
  attrName: string,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  suffix?: string,
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolate4 {
  const lView = getLView();
  const interpolatedValue = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
  if (interpolatedValue !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolatedValue, sanitizer, namespace);
    ngDevMode &&
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - 4,
        prefix,
        i0,
        i1,
        i2,
        suffix ?? '',
      );
  }
  return ɵɵattributeInterpolate4;
}

/**
 *
 * 텍스트로 둘러싸인 5개의 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 5개의 보간 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolate5(
 * 'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 *
 * @param attrName 업데이트할 속성 이름
 * @param prefix 연결용으로만 사용되는 정적 값.
 * @param v0 변경 여부를 체크하는 값.
 * @param i0 연결용으로만 사용되는 정적 값.
 * @param v1 변경 여부를 체크하는 값.
 * @param i1 연결용으로만 사용되는 정적 값.
 * @param v2 변경 여부를 체크하는 값.
 * @param i2 연결용으로만 사용되는 정적 값.
 * @param v3 변경 여부를 체크하는 값.
 * @param i3 연결용으로만 사용되는 정적 값.
 * @param v4 변경 여부를 체크하는 값.
 * @param suffix 연결용으로만 사용되는 정적 값.
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate5(
  attrName: string,
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
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolate5 {
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
  if (interpolatedValue !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolatedValue, sanitizer, namespace);
    ngDevMode &&
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - 5,
        prefix,
        i0,
        i1,
        i2,
        i3,
        suffix ?? '',
      );
  }
  return ɵɵattributeInterpolate5;
}

/**
 *
 * 텍스트로 둘러싸인 6개의 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 6개의 보간 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolate6(
 *    'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * @param attrName 업데이트할 속성 이름
 * @param prefix 연결용으로만 사용되는 정적 값.
 * @param v0 변경 여부를 체크하는 값.
 * @param i0 연결용으로만 사용되는 정적 값.
 * @param v1 변경 여부를 체크하는 값.
 * @param i1 연결용으로만 사용되는 정적 값.
 * @param v2 변경 여부를 체크하는 값.
 * @param i2 연결용으로만 사용되는 정적 값.
 * @param v3 변경 여부를 체크하는 값.
 * @param i3 연결용으로만 사용되는 정적 값.
 * @param v4 변경 여부를 체크하는 값.
 * @param i4 연결용으로만 사용되는 정적 값.
 * @param v5 변경 여부를 체크하는 값.
 * @param suffix 연결용으로만 사용되는 정적 값.
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate6(
  attrName: string,
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
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolate6 {
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
  if (interpolatedValue !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolatedValue, sanitizer, namespace);
    ngDevMode &&
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - 6,
        prefix,
        i0,
        i1,
        i2,
        i3,
        i4,
        suffix ?? '',
      );
  }
  return ɵɵattributeInterpolate6;
}

/**
 *
 * 텍스트로 둘러싸인 7개의 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 7개의 보간 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolate7(
 *    'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 *
 * @param attrName 업데이트할 속성 이름
 * @param prefix 연결용으로만 사용되는 정적 값.
 * @param v0 변경 여부를 체크하는 값.
 * @param i0 연결용으로만 사용되는 정적 값.
 * @param v1 변경 여부를 체크하는 값.
 * @param i1 연결용으로만 사용되는 정적 값.
 * @param v2 변경 여부를 체크하는 값.
 * @param i2 연결용으로만 사용되는 정적 값.
 * @param v3 변경 여부를 체크하는 값.
 * @param i3 연결용으로만 사용되는 정적 값.
 * @param v4 변경 여부를 체크하는 값.
 * @param i4 연결용으로만 사용되는 정적 값.
 * @param v5 변경 여부를 체크하는 값.
 * @param i5 연결용으로만 사용되는 정적 값.
 * @param v6 변경 여부를 체크하는 값.
 * @param suffix 연결용으로만 사용되는 정적 값.
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate7(
  attrName: string,
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
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolate7 {
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
  if (interpolatedValue !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolatedValue, sanitizer, namespace);
    ngDevMode &&
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - 7,
        prefix,
        i0,
        i1,
        i2,
        i3,
        i4,
        i5,
        suffix ?? '',
      );
  }
  return ɵɵattributeInterpolate7;
}

/**
 *
 * 텍스트로 둘러싸인 8개의 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 8개의 보간 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolate8(
 *  'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, 'suffix');
 * ```
 *
 * @param attrName 업데이트할 속성 이름
 * @param prefix 연결용으로만 사용되는 정적 값.
 * @param v0 변경 여부를 체크하는 값.
 * @param i0 연결용으로만 사용되는 정적 값.
 * @param v1 변경 여부를 체크하는 값.
 * @param i1 연결용으로만 사용되는 정적 값.
 * @param v2 변경 여부를 체크하는 값.
 * @param i2 연결용으로만 사용되는 정적 값.
 * @param v3 변경 여부를 체크하는 값.
 * @param i3 연결용으로만 사용되는 정적 값.
 * @param v4 변경 여부를 체크하는 값.
 * @param i4 연결용으로만 사용되는 정적 값.
 * @param v5 변경 여부를 체크하는 값.
 * @param i5 연결용으로만 사용되는 정적 값.
 * @param v6 변경 여부를 체크하는 값.
 * @param i6 연결용으로만 사용되는 정적 값.
 * @param v7 변경 여부를 체크하는 값.
 * @param suffix 연결용으로만 사용되는 정적 값.
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate8(
  attrName: string,
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
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolate8 {
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
  if (interpolatedValue !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolatedValue, sanitizer, namespace);
    ngDevMode &&
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - 8,
        prefix,
        i0,
        i1,
        i2,
        i3,
        i4,
        i5,
        i6,
        suffix ?? '',
      );
  }
  return ɵɵattributeInterpolate8;
}

/**
 * 텍스트로 둘러싸인 9개 이상의 바인드 값을 가진 요소의 보간 속성을 업데이트합니다.
 *
 * 보간 값의 수가 8을 초과할 때 사용됩니다.
 *
 * ```html
 * <div
 *  title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은 다음과 같습니다::
 *
 * ```ts
 * ɵɵattributeInterpolateV(
 *  'title', ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 *
 * @param attrName 업데이트할 속성 이름.
 * @param values 값 컬렉션 및 해당 값들 사이의 문자열, 문자열 접두어로 시작하고 문자열 접미사로 끝납니다.
 * (예: `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 * @param sanitizer 선택적인 샌itize 함수
 * @returns 체이닝할 수 있도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵattributeInterpolateV(
  attrName: string,
  values: any[],
  sanitizer?: SanitizerFn,
  namespace?: string,
): typeof ɵɵattributeInterpolateV {
  const lView = getLView();
  const interpolated = interpolationV(lView, values);
  if (interpolated !== NO_CHANGE) {
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, attrName, interpolated, sanitizer, namespace);
    if (ngDevMode) {
      const interpolationInBetween = [values[0] as string]; // prefix
      for (let i = 2; i < values.length; i += 2) {
        interpolationInBetween.push(values[i]);
      }
      storePropertyBindingMetadata(
        getTView().data,
        tNode,
        'attr.' + attrName,
        getBindingIndex() - interpolationInBetween.length + 1,
        ...interpolationInBetween,
      );
    }
  }
  return ɵɵattributeInterpolateV;
}
