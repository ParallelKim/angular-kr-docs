/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {SanitizerFn} from '../interfaces/sanitization';
import {RENDERER} from '../interfaces/view';
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
import {elementPropertyInternal, storePropertyBindingMetadata} from './shared';

/**
 *
 * 단일 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값에 1개의 보간된 값이 포함되어 있고, 해당 보간된 값을 둘러싼 추가 텍스트가 없는 경우에 사용됩니다:
 *
 * ```html
 * <div title="{{v0}}"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate('title', v0);
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate(
  propName: string,
  v0: any,
  sanitizer?: SanitizerFn,
): typeof ɵɵpropertyInterpolate {
  ɵɵpropertyInterpolate1(propName, '', v0, '', sanitizer);
  return ɵɵpropertyInterpolate;
}

/**
 *
 * 텍스트로 둘러싸인 단일 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값이 1개의 보간된 값을 포함할 때 사용됩니다:
 *
 * ```html
 * <div title="prefix{{v0}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate1('title', 'prefix', v0, 'suffix');
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate1(
  propName: string,
  prefix: string,
  v0: any,
  suffix?: string,
  sanitizer?: SanitizerFn,
): typeof ɵɵpropertyInterpolate1 {
  const lView = getLView();
  const interpolatedValue = interpolation1(lView, prefix, v0, suffix);
  if (interpolatedValue !== NO_CHANGE) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode &&
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
        getBindingIndex() - 1,
        prefix,
        suffix ?? '',
      );
  }
  return ɵɵpropertyInterpolate1;
}

/**
 *
 * 텍스트로 둘러싸인 2개의 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값에 2개의 보간된 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate2('title', 'prefix', v0, '-', v1, 'suffix');
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate2(
  propName: string,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  suffix?: string,
  sanitizer?: SanitizerFn,
): typeof ɵɵpropertyInterpolate2 {
  const lView = getLView();
  const interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
  if (interpolatedValue !== NO_CHANGE) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode &&
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
        getBindingIndex() - 2,
        prefix,
        i0,
        suffix ?? '',
      );
  }
  return ɵɵpropertyInterpolate2;
}

/**
 *
 * 텍스트로 둘러싸인 3개의 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값에 3개의 보간된 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate3(
 * 'title', 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경 여부를 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate3(
  propName: string,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  suffix?: string,
  sanitizer?: SanitizerFn,
): typeof ɵɵpropertyInterpolate3 {
  const lView = getLView();
  const interpolatedValue = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
  if (interpolatedValue !== NO_CHANGE) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode &&
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
        getBindingIndex() - 3,
        prefix,
        i0,
        i1,
        suffix ?? '',
      );
  }
  return ɵɵpropertyInterpolate3;
}

/**
 *
 * 텍스트로 둘러싸인 4개의 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값에 4개의 보간된 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate4(
 * 'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경 여부를 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경 여부를 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate4(
  propName: string,
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
): typeof ɵɵpropertyInterpolate4 {
  const lView = getLView();
  const interpolatedValue = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
  if (interpolatedValue !== NO_CHANGE) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode &&
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
        getBindingIndex() - 4,
        prefix,
        i0,
        i1,
        i2,
        suffix ?? '',
      );
  }
  return ɵɵpropertyInterpolate4;
}

/**
 *
 * 텍스트로 둘러싸인 5개의 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값에 5개의 보간된 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate5(
 * 'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경 여부를 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경 여부를 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경 여부를 확인하는 값.
 * @param i3 연결에만 사용되는 정적 값.
 * @param v4 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate5(
  propName: string,
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
): typeof ɵɵpropertyInterpolate5 {
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
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode &&
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
        getBindingIndex() - 5,
        prefix,
        i0,
        i1,
        i2,
        i3,
        suffix ?? '',
      );
  }
  return ɵɵpropertyInterpolate5;
}

/**
 *
 * 텍스트로 둘러싸인 6개의 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값에 6개의 보간된 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate6(
 *    'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경 여부를 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경 여부를 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경 여부를 확인하는 값.
 * @param i3 연결에만 사용되는 정적 값.
 * @param v4 변경 여부를 확인하는 값.
 * @param i4 연결에만 사용되는 정적 값.
 * @param v5 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate6(
  propName: string,
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
): typeof ɵɵpropertyInterpolate6 {
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
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode &&
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
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
  return ɵɵpropertyInterpolate6;
}

/**
 *
 * 텍스트로 둘러싸인 7개의 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값에 7개의 보간된 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate7(
 *    'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경 여부를 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경 여부를 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경 여부를 확인하는 값.
 * @param i3 연결에만 사용되는 정적 값.
 * @param v4 변경 여부를 확인하는 값.
 * @param i4 연결에만 사용되는 정적 값.
 * @param v5 변경 여부를 확인하는 값.
 * @param i5 연결에만 사용되는 정적 값.
 * @param v6 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate7(
  propName: string,
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
): typeof ɵɵpropertyInterpolate7 {
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
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode &&
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
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
  return ɵɵpropertyInterpolate7;
}

/**
 *
 * 텍스트로 둘러싸인 8개의 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 속성에 전달된 값에 8개의 보간된 값이 포함되어 있을 때 사용됩니다:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolate8(
 *  'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, 'suffix');
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름
 * @param prefix 연결에만 사용되는 정적 값.
 * @param v0 변경 여부를 확인하는 값.
 * @param i0 연결에만 사용되는 정적 값.
 * @param v1 변경 여부를 확인하는 값.
 * @param i1 연결에만 사용되는 정적 값.
 * @param v2 변경 여부를 확인하는 값.
 * @param i2 연결에만 사용되는 정적 값.
 * @param v3 변경 여부를 확인하는 값.
 * @param i3 연결에만 사용되는 정적 값.
 * @param v4 변경 여부를 확인하는 값.
 * @param i4 연결에만 사용되는 정적 값.
 * @param v5 변경 여부를 확인하는 값.
 * @param i5 연결에만 사용되는 정적 값.
 * @param v6 변경 여부를 확인하는 값.
 * @param i6 연결에만 사용되는 정적 값.
 * @param v7 변경 여부를 확인하는 값.
 * @param suffix 연결에만 사용되는 정적 값.
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolate8(
  propName: string,
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
): typeof ɵɵpropertyInterpolate8 {
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
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode &&
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
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
  return ɵɵpropertyInterpolate8;
}

/**
 * 텍스트로 둘러싸인 9개 이상의 바인딩 값으로 요소에서 보간된 속성을 업데이트합니다.
 *
 * 보간된 값의 수가 8을 초과할 때 사용됩니다.
 *
 * ```html
 * <div
 *  title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix"></div>
 * ```
 *
 * 컴파일된 표현은::
 *
 * ```ts
 * ɵɵpropertyInterpolateV(
 *  'title', ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 *
 * 속성 이름이 요소의 지시문 중 하나에서 입력 속성으로도 존재하는 경우,
 * 컴포넌트 속성이 요소 속성 대신 설정됩니다. 이 검사는 런타임에 수행되어 자식 컴포넌트가 새로운 `@Inputs`를 추가할 때 다시 컴파일할 필요가 없습니다.
 *
 * @param propName 업데이트할 속성의 이름.
 * @param values 값과 문자열 컬렉션, 접두사 문자열로 시작되고 접미사 문자열로 끝나야 합니다.
 * (예: `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 * @param sanitizer 선택적 세척기 함수
 * @returns 체이닝 가능하도록 자기 자신을 반환합니다.
 * @codeGenApi
 */
export function ɵɵpropertyInterpolateV(
  propName: string,
  values: any[],
  sanitizer?: SanitizerFn,
): typeof ɵɵpropertyInterpolateV {
  const lView = getLView();
  const interpolatedValue = interpolationV(lView, values);
  if (interpolatedValue !== NO_CHANGE) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      interpolatedValue,
      lView[RENDERER],
      sanitizer,
      false,
    );
    if (ngDevMode) {
      const interpolationInBetween = [values[0]]; // 접두사
      for (let i = 2; i < values.length; i += 2) {
        interpolationInBetween.push(values[i]);
      }
      storePropertyBindingMetadata(
        tView.data,
        tNode,
        propName,
        getBindingIndex() - interpolationInBetween.length + 1,
        ...interpolationInBetween,
      );
    }
  }
  return ɵɵpropertyInterpolateV;
}
