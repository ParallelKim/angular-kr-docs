/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {SIGNAL} from '@angular/core/primitives/signals';

/**
 * 변경 사항을 소비자에게 알리는 반응형 값입니다.
 *
 * 신호(Signal)는 현재 값을 반환하는 함수입니다. 신호의 현재 값에 접근하려면,
 * 호출하십시오.
 *
 * 일반 값은 `signal` 함수를 사용하여 `Signal`로 변환할 수 있습니다.
 */
export type Signal<T> = (() => T) & {
  [SIGNAL]: unknown;
};

/**
 * 주어진 `value`가 반응형 `Signal`인지 확인합니다.
 */
export function isSignal(value: unknown): value is Signal<unknown> {
  return typeof value === 'function' && (value as Signal<unknown>)[SIGNAL] !== undefined;
}

/**
 * 두 값이 같은지 비교할 수 있는 함수입니다.
 */
export type ValueEqualityFn<T> = (a: T, b: T) => boolean;
