/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

export interface NO_CHANGE {
  // 이 브랜드는 이 타입이 다른 어떤 것과도 일치할 수 없음을 보장합니다.
  __brand__: 'NO_CHANGE';
}

/** 값이 변경되지 않았음을 나타내는 특수 값입니다. */
export const NO_CHANGE: NO_CHANGE =
  typeof ngDevMode === 'undefined' || ngDevMode ? {__brand__: 'NO_CHANGE'} : ({} as NO_CHANGE);
