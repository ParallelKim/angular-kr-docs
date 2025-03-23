/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertEqual, assertLessThan} from '../../util/assert';
import {bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4} from '../bindings';
import {LView} from '../interfaces/view';
import {getBindingIndex, incrementBindingIndex, nextBindingIndex, setBindingIndex} from '../state';
import {NO_CHANGE} from '../tokens';
import {renderStringify} from '../util/stringify_utils';

/**
 * 변수 개수에 따라 보간바인딩을 생성합니다.
 *
 * 표현식이 1개에서 8개까지 'interpolation1()'에서 'interpolation8()'를 사용해야 합니다.
 * 이는 표현식 배열을 생성하고 반복할 필요가 없기 때문에 더 빠릅니다.
 *
 * `values`:
 * - 짝수 인덱스에 정적 텍스트가 있으며,
 * - 홀수 인덱스에 평가된 표현식이 있습니다.
 *
 * 인자 중 하나라도 변경되면 연결된 문자열을 반환하고, 그렇지 않으면 `NO_CHANGE`를 반환합니다.
 */
export function interpolationV(lView: LView, values: any[]): string | NO_CHANGE {
  ngDevMode && assertLessThan(2, values.length, '최소 3개의 값을 가져야 합니다');
  let isBindingUpdated = false;
  let bindingIndex = getBindingIndex();

  for (let i = 1; i < values.length; i += 2) {
    // 바인딩(홀수 인덱스)이 변경되었는지 확인
    isBindingUpdated = bindingUpdated(lView, bindingIndex++, values[i]) || isBindingUpdated;
  }
  setBindingIndex(bindingIndex);

  if (!isBindingUpdated) {
    return NO_CHANGE;
  }

  // 업데이트된 콘텐츠 빌드
  let content = values[0];
  for (let i = 1; i < values.length; i += 2) {
    // 조건은 범위를 넘어가는 읽기를 방지합니다
    content += renderStringify(values[i]) + (i + 1 !== values.length ? values[i + 1] : '');
  }

  return content;
}

/**
 * 1개의 표현식으로 보간 바인딩을 생성합니다.
 *
 * @param prefix 연결에만 사용되는 정적 값입니다.
 * @param v0 변경 사항을 확인할 값입니다.
 * @param suffix 연결에만 사용되는 정적 값입니다.
 */
export function interpolation1(
  lView: LView,
  prefix: string,
  v0: any,
  suffix = '',
): string | NO_CHANGE {
  const different = bindingUpdated(lView, nextBindingIndex(), v0);
  return different ? prefix + renderStringify(v0) + suffix : NO_CHANGE;
}

/**
 * 2개의 표현식으로 보간 바인딩을 생성합니다.
 */
export function interpolation2(
  lView: LView,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  suffix = '',
): string | NO_CHANGE {
  const bindingIndex = getBindingIndex();
  const different = bindingUpdated2(lView, bindingIndex, v0, v1);
  incrementBindingIndex(2);

  return different ? prefix + renderStringify(v0) + i0 + renderStringify(v1) + suffix : NO_CHANGE;
}

/**
 * 3개의 표현식으로 보간 바인딩을 생성합니다.
 */
export function interpolation3(
  lView: LView,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  suffix = '',
): string | NO_CHANGE {
  const bindingIndex = getBindingIndex();
  const different = bindingUpdated3(lView, bindingIndex, v0, v1, v2);
  incrementBindingIndex(3);

  return different
    ? prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + suffix
    : NO_CHANGE;
}

/**
 * 4개의 표현식으로 보간 바인딩을 생성합니다.
 */
export function interpolation4(
  lView: LView,
  prefix: string,
  v0: any,
  i0: string,
  v1: any,
  i1: string,
  v2: any,
  i2: string,
  v3: any,
  suffix = '',
): string | NO_CHANGE {
  const bindingIndex = getBindingIndex();
  const different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
  incrementBindingIndex(4);

  return different
    ? prefix +
        renderStringify(v0) +
        i0 +
        renderStringify(v1) +
        i1 +
        renderStringify(v2) +
        i2 +
        renderStringify(v3) +
        suffix
    : NO_CHANGE;
}

/**
 * 5개의 표현식으로 보간 바인딩을 생성합니다.
 */
export function interpolation5(
  lView: LView,
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
  suffix = '',
): string | NO_CHANGE {
  const bindingIndex = getBindingIndex();
  let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
  different = bindingUpdated(lView, bindingIndex + 4, v4) || different;
  incrementBindingIndex(5);

  return different
    ? prefix +
        renderStringify(v0) +
        i0 +
        renderStringify(v1) +
        i1 +
        renderStringify(v2) +
        i2 +
        renderStringify(v3) +
        i3 +
        renderStringify(v4) +
        suffix
    : NO_CHANGE;
}

/**
 * 6개의 표현식으로 보간 바인딩을 생성합니다.
 */
export function interpolation6(
  lView: LView,
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
  suffix = '',
): string | NO_CHANGE {
  const bindingIndex = getBindingIndex();
  let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
  different = bindingUpdated2(lView, bindingIndex + 4, v4, v5) || different;
  incrementBindingIndex(6);

  return different
    ? prefix +
        renderStringify(v0) +
        i0 +
        renderStringify(v1) +
        i1 +
        renderStringify(v2) +
        i2 +
        renderStringify(v3) +
        i3 +
        renderStringify(v4) +
        i4 +
        renderStringify(v5) +
        suffix
    : NO_CHANGE;
}

/**
 * 7개의 표현식으로 보간 바인딩을 생성합니다.
 */
export function interpolation7(
  lView: LView,
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
  suffix = '',
): string | NO_CHANGE {
  const bindingIndex = getBindingIndex();
  let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
  different = bindingUpdated3(lView, bindingIndex + 4, v4, v5, v6) || different;
  incrementBindingIndex(7);

  return different
    ? prefix +
        renderStringify(v0) +
        i0 +
        renderStringify(v1) +
        i1 +
        renderStringify(v2) +
        i2 +
        renderStringify(v3) +
        i3 +
        renderStringify(v4) +
        i4 +
        renderStringify(v5) +
        i5 +
        renderStringify(v6) +
        suffix
    : NO_CHANGE;
}

/**
 * 8개의 표현식으로 보간 바인딩을 생성합니다.
 */
export function interpolation8(
  lView: LView,
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
  suffix = '',
): string | NO_CHANGE {
  const bindingIndex = getBindingIndex();
  let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
  different = bindingUpdated4(lView, bindingIndex + 4, v4, v5, v6, v7) || different;
  incrementBindingIndex(8);

  return different
    ? prefix +
        renderStringify(v0) +
        i0 +
        renderStringify(v1) +
        i1 +
        renderStringify(v2) +
        i2 +
        renderStringify(v3) +
        i3 +
        renderStringify(v4) +
        i4 +
        renderStringify(v5) +
        i5 +
        renderStringify(v6) +
        i6 +
        renderStringify(v7) +
        suffix
    : NO_CHANGE;
}
