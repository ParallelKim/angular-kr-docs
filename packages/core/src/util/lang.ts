/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Subscribable} from 'rxjs';

/**
 * 인수가 Promise 형태인지 판단합니다.
 */
export function isPromise<T = any>(obj: any): obj is Promise<T> {
  // 모든 Promise/A+ 호환 thenable을 허용합니다.
  // obj.then이 사양을 준수하도록 호출자가 보장해야 합니다.
  return !!obj && typeof obj.then === 'function';
}

/**
 * 인수가 Subscribable인지 판단합니다.
 */
export function isSubscribable<T>(obj: any | Subscribable<T>): obj is Subscribable<T> {
  return !!obj && typeof obj.subscribe === 'function';
}
