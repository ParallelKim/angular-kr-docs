/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 래핑된 함수가 부작용이 없다고 클로저 컴파일러를 설득합니다.
 *
 * 클로저 컴파일러는 항상 `toString`에 부작용이 없다고 가정합니다. 우리는 이 특징을 활용하여
 * 함수를 실행하지만 클로저 컴파일러가 호출을 부작용 없는 것으로 표시하도록 허용합니다.
 * `noSideEffects` 함수의 반환값이 유지되는 무언가에 할당되어야 하는 것이 중요합니다. 그렇지 않으면
 * 클로저 컴파일러에 의해 `noSideEffects` 호출이 제거될 것입니다.
 */
export function noSideEffects<T>(fn: () => T): T {
  return {toString: fn}.toString() as unknown as T;
}
