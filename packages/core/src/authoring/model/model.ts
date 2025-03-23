/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertInInjectionContext} from '../../di';
import {REQUIRED_UNSET_VALUE} from '../input/input_signal_node';

import {createModelSignal, ModelOptions, ModelSignal} from './model_signal';

export function modelFunction<T>(
  initialValue?: T,
  opts?: ModelOptions,
): ModelSignal<T | undefined> {
  ngDevMode && assertInInjectionContext(model);

  return createModelSignal(initialValue, opts);
}

export function modelRequiredFunction<T>(opts?: ModelOptions): ModelSignal<T> {
  ngDevMode && assertInInjectionContext(model);

  return createModelSignal(REQUIRED_UNSET_VALUE as T, opts);
}

/**
 * `model`은 포함된 지시어에서 입력/출력 쌍으로 노출되는 쓰기 가능한 신호를 선언합니다.
 * 입력 이름은 클래스 멤버 또는 `alias` 옵션에서 가져옵니다.
 * 출력 이름은 입력 이름을 사용하고 `Change`를 추가하여 생성됩니다.
 *
 * 이 함수는 `model.required` 함수를 통해 필수 모델을 선언하는 API도 제공합니다.
 *
 * @publicAPI
 * @docsPrivate Ignored because `model` is the canonical API entry.
 */
export interface ModelFunction {
  /**
   * 초기 값이 `undefined`인 `T` 유형의 모델을 초기화합니다.
   * Angular는 암묵적으로 `undefined`를 초기 값으로 사용합니다.
   */
  <T>(): ModelSignal<T | undefined>;
  /** 주어진 초기 값으로 `T` 유형의 모델을 초기화합니다. */
  <T>(initialValue: T, opts?: ModelOptions): ModelSignal<T>;

  required: {
    /**
     * 필수 모델을 초기화합니다.
     *
     * 지시어/컴포넌트의 사용자는 모델의 입력 측에 바인딩해야 합니다.
     * 설정하지 않으면 컴파일 타임 오류가 보고됩니다.
     */
    <T>(opts?: ModelOptions): ModelSignal<T>;
  };
}

/**
 * `model`은 포함된 지시어에서 입력/출력 쌍으로 노출되는 쓰기 가능한 신호를 선언합니다.
 *
 * 입력 이름은 클래스 멤버 또는 `alias` 옵션에서 가져옵니다.
 * 출력 이름은 입력 이름을 사용하고 `Change`를 추가하여 생성됩니다.
 *
 * @usageNotes
 *
 * `model()`을 사용하려면 `@angular/core`에서 함수를 가져옵니다.
 *
 * ```ts
 * import {model} from '@angular/core';
 * ```
 *
 * 컴포넌트 안에서 새로운 클래스 멤버를 소개하고
 * `model` 또는 `model.required` 호출로 초기화합니다.
 *
 * ```ts
 * @Directive({
 *   ...
 * })
 * export class MyDir {
 *   firstName = model<string>();            // ModelSignal<string|undefined>
 *   lastName  = model.required<string>();   // ModelSignal<string>
 *   age       = model(0);                   // ModelSignal<number>
 * }
 * ```
 *
 * 컴포넌트 템플릿 내에서 신호를 호출하여 `model`의 값을 표시할 수 있습니다.
 *
 * ```html
 * <span>{{firstName()}}</span>
 * ```
 *
 * `model`을 업데이트하는 것은 쓰기 가능한 신호를 업데이트하는 것과 같습니다.
 *
 * ```ts
 * updateName(newFirstName: string): void {
 *   this.firstName.set(newFirstName);
 * }
 * ```
 *
 * @publicAPI
 * @initializerApiFunction
 */
export const model: ModelFunction = (() => {
  // 참고: 이것은 부작용으로 간주될 수 있지만,
  // 이 `model` 상수 내보내기가 접근되지 않는 한
  // 이 할당에 의존하는 것은 없습니다. 그것은 사용자 중심의 `model` 내보내기에 로컬한
  // 자급자족하는 부작용입니다.
  (modelFunction as any).required = modelRequiredFunction;
  return modelFunction as typeof modelFunction & {required: typeof modelRequiredFunction};
})();
