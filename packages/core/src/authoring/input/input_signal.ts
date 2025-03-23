/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {producerAccessed, SIGNAL} from '@angular/core/primitives/signals';

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {Signal} from '../../render3/reactivity/api';

import {INPUT_SIGNAL_NODE, InputSignalNode, REQUIRED_UNSET_VALUE} from './input_signal_node';

/**
 * @publicAPI
 *
 * Signal 입력을 위한 옵션.
 */
export interface InputOptions<T, TransformT> {
  /** 입력의 선택적 공개 이름. 기본적으로 클래스 필드 이름이 사용됩니다. */
  alias?: string;
  /**
   * 새로운 값이 바인딩될 때마다 실행되는 선택적 변환. 입력이 업데이트되기 전에
   * 입력 값을 변환하는 데 사용할 수 있습니다.
   *
   * 변환 함수는 입력의 타입을 확장할 수 있습니다. 예를 들어, `disabled`에 대한
   * 입력을 고려해 보십시오. 실제로 컴포넌트 작성자는 불리언만 처리하고 싶지만,
   * 사용자는 `<my-dir input>`를 통해 입력에 바인딩하기 위해 문자열을 바인딩하고자 할 수 있습니다.
   * 그러면 변환이 이러한 문자열 값을 처리하고 이를 `boolean`으로 변환할 수 있습니다. 참조: {@link booleanAttribute}.
   */
  transform?: (v: TransformT) => T;

  /**
   * 입력 신호에 대한 디버그 이름. Angular DevTools에서 신호를 식별하는 데 사용됩니다.
   */
  debugName?: string;
}

/**
 * 변환 옵션 없이 신호 입력 옵션.
 *
 * @publicAPI
 */
export type InputOptionsWithoutTransform<T> =
  // 참고: 자동 완성을 위해 여전히 `transform` 개념을 유지합니다.
  Omit<InputOptions<T, T>, 'transform'> & {transform?: undefined};
/**
 * 변환 옵션이 필수인 신호 입력 옵션.
 *
 * @publicAPI
 */
export type InputOptionsWithTransform<T, TransformT> = Required<
  Pick<InputOptions<T, TransformT>, 'transform'>
> &
  InputOptions<T, TransformT>;

export const ɵINPUT_SIGNAL_BRAND_READ_TYPE = /* @__PURE__ */ Symbol();
export const ɵINPUT_SIGNAL_BRAND_WRITE_TYPE = /* @__PURE__ */ Symbol();

/**
 * `InputSignalWithTransform`은 `transform` 함수를 가진
 * 지시자/컴포넌트 입력을 위한 특수한 `Signal`을 나타냅니다.
 *
 * 변환이 있는 신호 입력은 변환 쓰기 타입을 위해 추가적인 제너릭을 캡처합니다.
 * 변환은 신호 입력의 값 검색이 여전히 제너릭 입력 타입과 일치하도록 하면서
 * 입력에 대한 수용된 바인딩 값을 확장할 수 있습니다.
 *
 * ```ts
 * class MyDir {
 *   disabled = input(false, {
 *     transform: (v: string|boolean) => convertToBoolean(v),
 *   }); // InputSignalWithTransform<boolean, string|boolean>
 *
 *   click() {
 *     this.disabled() // 항상 `boolean`을 반환합니다.
 *   }
 * }
 * ```
 *
 * @see {@link InputSignal} 추가 정보를 참고하세요.
 *
 * @publicAPI
 */
export interface InputSignalWithTransform<T, TransformT> extends Signal<T> {
  [SIGNAL]: InputSignalNode<T, TransformT>;
  [ɵINPUT_SIGNAL_BRAND_READ_TYPE]: T;
  [ɵINPUT_SIGNAL_BRAND_WRITE_TYPE]: TransformT;
}

/**
 * `InputSignal`은 지시자/컴포넌트 입력을 위한 특수한 `Signal`을 나타냅니다.
 *
 * 입력 신호는 쓰기 불가능한 신호와 유사하지만, 변환을 위한 추가 타입 정보를
 * 포함하고 있으며 Angular가 새로운 값이 바인딩될 때마다 신호를 내부적으로 업데이트합니다.
 *
 * @see {@link InputOptionsWithTransform} 변환이 있는 입력을 참조하십시오.
 *
 * @publicAPI
 */
export interface InputSignal<T> extends InputSignalWithTransform<T, T> {}

/**
 * 입력 신호를 생성합니다.
 *
 * @param initialValue 초기값.
 *   필수 입력의 경우 {@link REQUIRED_UNSET_VALUE}로 설정할 수 있습니다.
 * @param options 입력을 위한 추가 옵션. 예: 변환 또는 별칭.
 */
export function createInputSignal<T, TransformT>(
  initialValue: T,
  options?: InputOptions<T, TransformT>,
): InputSignalWithTransform<T, TransformT> {
  const node: InputSignalNode<T, TransformT> = Object.create(INPUT_SIGNAL_NODE);

  node.value = initialValue;

  // 성능 메모: 여기서 항상 `transformFn`을 설정하여 `node`가 항상
  // 동일한 v8 클래스 형태를 가지도록 하여 입력 신호에서 단일형 읽기를 허용합니다.
  node.transformFn = options?.transform;

  function inputValueFn() {
    // 누군가 이 신호를 살펴보았음을 기록합니다.
    producerAccessed(node);

    if (node.value === REQUIRED_UNSET_VALUE) {
      let message: string | null = null;
      if (ngDevMode) {
        const name = options?.debugName ?? options?.alias;
        message = `Input${name ? ` "${name}"` : ''}은(는) 필수이며, 아직 사용할 수 있는 값이 없습니다.`;
      }
      throw new RuntimeError(RuntimeErrorCode.REQUIRED_INPUT_NO_VALUE, message);
    }

    return node.value;
  }

  (inputValueFn as any)[SIGNAL] = node;

  if (ngDevMode) {
    inputValueFn.toString = () => `[Input Signal: ${inputValueFn()}]`;
    node.debugName = options?.debugName;
  }

  return inputValueFn as InputSignalWithTransform<T, TransformT>;
}
