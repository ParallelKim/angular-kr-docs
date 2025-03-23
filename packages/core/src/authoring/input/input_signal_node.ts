/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {SIGNAL_NODE, SignalNode, signalSetFn} from '@angular/core/primitives/signals';

export const REQUIRED_UNSET_VALUE = /* @__PURE__ */ Symbol('InputSignalNode#UNSET');

/**
 * 입력 신호를 위한 반응형 노드 타입. 입력 신호는 신호를 확장합니다.
 * 변환 및 필수 입력을 가능하게 하는 특별한 속성이 있습니다.
 */
export interface InputSignalNode<T, TransformT> extends SignalNode<T> {
  /**
   * 새 값이 입력 신호 노드에 적용될 때마다 실행될 사용자 구성 변환 함수입니다.
   */
  transformFn: ((value: TransformT) => T) | undefined;

  /**
   * 입력 신호에 새 값을 적용합니다. 변환이 미리 수동으로 실행되기를 기대합니다.
   *
   * 이 함수는 바인딩이 변경될 때마다 프레임워크 런타임 코드에 의해 호출됩니다.
   * 값은 실제로 런타임에서 무엇이든 될 수 있지만, 타입 목적을 위해 유효한 `T` 값이라고 가정합니다.
   * 타입 검사가 이를 강제할 것입니다.
   */
  applyValueToInputSignal<T, TransformT>(node: InputSignalNode<T, TransformT>, value: T): void;

  /**
   * 입력 신호에 대한 디버그 이름입니다. Angular DevTools에서 신호를 식별하는 데 사용됩니다.
   */
  debugName?: string;
}

// 주의: 스프레드 할당이副작용으로 간주되지 않도록 하기 위해 IIFE를 사용합니다.
// `COMPUTED_NODE` 및 `REACTIVE_NODE`를 보존합니다.
// TODO: https://github.com/evanw/esbuild/issues/3392가 해결될 때 제거합니다.
export const INPUT_SIGNAL_NODE: InputSignalNode<unknown, unknown> = /* @__PURE__ */ (() => {
  return {
    ...SIGNAL_NODE,
    transformFn: undefined,

    applyValueToInputSignal<T, TransformT>(node: InputSignalNode<T, TransformT>, value: T) {
      signalSetFn(node, value);
    },
  };
})();
