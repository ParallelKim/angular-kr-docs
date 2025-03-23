/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createComputed, SIGNAL} from '@angular/core/primitives/signals';

import {Signal, ValueEqualityFn} from './api';

/**
 * `computed` 생성 함수에 전달된 옵션.
 */
export interface CreateComputedOptions<T> {
  /**
   * 계산된 값의 동등성을 정의하는 비교 함수.
   */
  equal?: ValueEqualityFn<T>;

  /**
   * 계산된 신호의 디버그 이름. Angular DevTools에서 신호를 식별하는 데 사용됩니다.
   */
  debugName?: string;
}

/**
 * 표현식에서 반응형 값을 파생하는 계산된 `Signal`을 생성합니다.
 */
export function computed<T>(computation: () => T, options?: CreateComputedOptions<T>): Signal<T> {
  const getter = createComputed(computation, options?.equal);

  if (ngDevMode) {
    getter.toString = () => `[Computed: ${getter()}]`;
    getter[SIGNAL].debugName = options?.debugName;
  }

  return getter;
}
