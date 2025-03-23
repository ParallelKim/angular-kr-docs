/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertInInjectionContext} from '../../di';

import {
  createInputSignal,
  InputOptions,
  InputOptionsWithoutTransform,
  InputOptionsWithTransform,
  InputSignal,
  InputSignalWithTransform,
} from './input_signal';
import {REQUIRED_UNSET_VALUE} from './input_signal_node';

export function inputFunction<ReadT, WriteT>(
  initialValue?: ReadT,
  opts?: InputOptions<ReadT, WriteT>,
): InputSignalWithTransform<ReadT | undefined, WriteT> {
  ngDevMode && assertInInjectionContext(input);
  return createInputSignal(initialValue, opts);
}

export function inputRequiredFunction<ReadT, WriteT = ReadT>(
  opts?: InputOptions<ReadT, WriteT>,
): InputSignalWithTransform<ReadT, WriteT> {
  ngDevMode && assertInInjectionContext(input);
  return createInputSignal(REQUIRED_UNSET_VALUE as never, opts);
}

/**
 * `input` 함수는 지시자와
 * 컴포넌트에서 입력을 선언할 수 있습니다.
 *
 * 이 함수는 `input.required` 함수를 통해 필수 입력을 선언할 수 있는 API를 노출합니다.
 *
 * @publicAPI
 * @docsPrivate `input`이 표준 API 항목이므로 무시됩니다.
 */
export interface InputFunction {
  /**
   * 유형 `T`의 입력을 초기 값으로 `undefined`로 초기화합니다.
   * Angular는 암시적으로 `undefined`를 초기 값으로 사용합니다.
   */
  <T>(): InputSignal<T | undefined>;
  /** 명시적인 초기 값을 가진 유형 `T`의 입력을 선언합니다. */
  <T>(initialValue: T, opts?: InputOptionsWithoutTransform<T>): InputSignal<T>;
  /** 초기 값 없이 입력 옵션을 가진 유형 `T|undefined`의 입력을 선언합니다. */
  <T>(initialValue: undefined, opts: InputOptionsWithoutTransform<T>): InputSignal<T | undefined>;
  /**
   * 초기 값과 변환 함수가 있는 유형 `T`의 입력을 선언합니다.
   *
   * 입력은 `TransformT` 유형의 값을 받아들이며,
   * 제공된 변환 함수는 값을 `T` 유형으로 변환합니다.
   */
  <T, TransformT>(
    initialValue: T,
    opts: InputOptionsWithTransform<T, TransformT>,
  ): InputSignalWithTransform<T, TransformT>;
  /**
   * 초기 값 없이 변환 함수가 있는 유형 `T|undefined`의 입력을 선언합니다.
   *
   * 입력은 `TransformT` 유형의 값을 받아들이며,
   * 제공된 변환 함수는 값을 `T|undefined` 유형으로 변환합니다.
   */ <T, TransformT>(
    initialValue: undefined,
    opts: InputOptionsWithTransform<T | undefined, TransformT>,
  ): InputSignalWithTransform<T | undefined, TransformT>;

  /**
   * 필수 입력을 초기화합니다.
   *
   * 귀하의 지시자/컴포넌트 소비자는 이
   * 입력에 바인딩해야 합니다. 설정되지 않으면, 컴파일 시간 오류가 보고됩니다.
   *
   * @publicAPI
   */
  required: {
    /** 유형 `T`의 필수 입력을 선언합니다. */
    <T>(opts?: InputOptionsWithoutTransform<T>): InputSignal<T>;
    /**
     * 변환 함수가 있는 유형 `T`의 필수 입력을 선언합니다.
     *
     * 입력은 `TransformT` 유형의 값을 받아들이며,
     * 제공된 변환 함수는 값을 `T` 유형으로 변환합니다.
     */
    <T, TransformT>(
      opts: InputOptionsWithTransform<T, TransformT>,
    ): InputSignalWithTransform<T, TransformT>;
  };
}

/**
 * `input` 함수는 Angular 입력을 지시자
 * 및 컴포넌트에서 선언할 수 있게 합니다.
 *
 * 선언할 수 있는 입력의 두 가지 변형이 있습니다:
 *
 *   1. **초기 값이 있는 선택적 입력**.
 *   2. **소비자가 설정해야 하는 필수 입력**.
 *
 * 기본적으로 `input` 함수는 항상 초기 값을 가진 선택적 입력을 선언합니다.
 * 필수 입력은 `input.required()` 함수를 사용하여 선언할 수 있습니다.
 *
 * 입력은 신호입니다. 입력의 값은 `Signal`로 노출됩니다.
 * 신호는 항상 부모로부터 바인딩된 입력의 최신 값을 보유합니다.
 *
 * @usageNotes
 * 신호 기반 입력을 사용하려면 `@angular/core`에서 `input`을 가져옵니다.
 *
 * ```ts
 * import {input} from '@angular/core`;
 * ```
 *
 * 컴포넌트 내부에서 새로운 클래스 멤버를 도입하고
 * `input` 또는 `input.required`를 호출하여 초기화합니다.
 *
 * ```ts
 * @Component({
 *   ...
 * })
 * export class UserProfileComponent {
 *   firstName = input<string>();             // Signal<string|undefined>
 *   lastName  = input.required<string>();    // Signal<string>
 *   age       = input(0)                     // Signal<number>
 * }
 * ```
 *
 * 컴포넌트 템플릿 내부에서 신호를 호출하여 입력의 값을 표시할 수 있습니다.
 *
 * ```html
 * <span>{{firstName()}}</span>
 * ```
 *
 * @publicAPI
 * @initializerApiFunction
 */
export const input: InputFunction = (() => {
  // 참고: 이 작업은 부작용으로 간주될 수 있지만,
  // 이 `input` 상수 내보내기에 접근하지 않는 한
  // 이 할당에 의존하는 것은 없습니다. 이는 사용자 면의 `input` 내보내기에
  // 국한된 자급자족 부작용입니다.
  (inputFunction as any).required = inputRequiredFunction;
  return inputFunction as typeof inputFunction & {required: typeof inputRequiredFunction};
})();
