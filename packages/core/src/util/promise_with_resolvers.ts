/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * TODO(incremental-hydration): PromiseWithResolvers가 안정적인 node / TS에 도달하면
 * 이 파일을 완전히 제거하십시오.
 */
interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

interface PromiseConstructor {
  /**
   * 새로운 Promise를 생성하고, 그것과 resolve 및 reject 함수와 함께 객체로 반환합니다.
   * @returns `promise`, `resolve`, 및 `reject` 속성이 포함된 객체입니다.
   *
   * ```ts
   * const { promise, resolve, reject } = Promise.withResolvers<T>();
   * ```
   */
  withResolvers<T>(): PromiseWithResolvers<T>;
}
