/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {producerAccessed, SIGNAL, signalSetFn} from '@angular/core/primitives/signals';

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {Signal} from '../../render3/reactivity/api';
import {
  signalAsReadonlyFn,
  WritableSignal,
  ɵWRITABLE_SIGNAL,
} from '../../render3/reactivity/signal';
import {
  InputSignal,
  ɵINPUT_SIGNAL_BRAND_READ_TYPE,
  ɵINPUT_SIGNAL_BRAND_WRITE_TYPE,
} from '../input/input_signal';
import {INPUT_SIGNAL_NODE, InputSignalNode, REQUIRED_UNSET_VALUE} from '../input/input_signal_node';
import {OutputEmitterRef} from '../output/output_emitter_ref';
import {OutputRef} from '../output/output_ref';

/**
 * @publicAPI
 *
 * 모델 신호에 대한 옵션.
 */
export interface ModelOptions {
  /**
   * 모델의 입력 측에 대한 선택적 공용 이름입니다. 출력 측은 입력과 동일한 이름을 가지지만, `Change`로 접미사가 붙습니다. 기본적으로 클래스 필드 이름이 사용됩니다.
   */
  alias?: string;

  /**
   * 모델 신호에 대한 디버그 이름. Angular DevTools에서 신호를 식별하는 데 사용됩니다.
   */
  debugName?: string;
}

/**
 * `ModelSignal`은 지시자/컴포넌트 모델 필드에 대한 특별한 `Signal`을 나타냅니다.
 *
 * 모델 신호는 출력으로 노출될 수 있는 쓰기 가능한 신호입니다.
 * 값이 업데이트될 때마다 출력으로 방출됩니다.
 *
 * @publicAPI
 */
export interface ModelSignal<T> extends WritableSignal<T>, InputSignal<T>, OutputRef<T> {
  [SIGNAL]: InputSignalNode<T, T>;
}

/**
 * 모델 신호를 생성합니다.
 *
 * @param initialValue 초기 값입니다.
 *   필수 모델 신호의 경우 {@link REQUIRED_UNSET_VALUE}로 설정할 수 있습니다.
 * @param options 모델에 대한 추가 옵션입니다.
 */
export function createModelSignal<T>(initialValue: T, opts?: ModelOptions): ModelSignal<T> {
  const node: InputSignalNode<T, T> = Object.create(INPUT_SIGNAL_NODE);
  const emitterRef = new OutputEmitterRef<T>();

  node.value = initialValue;

  function getter(): T {
    producerAccessed(node);
    assertModelSet(node.value);
    return node.value;
  }

  getter[SIGNAL] = node;
  getter.asReadonly = signalAsReadonlyFn.bind(getter as any) as () => Signal<T>;

  // TODO: 파괴된 모델을 업데이트할 때 오류를 던져야 할까요?
  getter.set = (newValue: T) => {
    if (!node.equal(node.value, newValue)) {
      signalSetFn(node, newValue);
      emitterRef.emit(newValue);
    }
  };

  getter.update = (updateFn: (value: T) => T) => {
    assertModelSet(node.value);
    getter.set(updateFn(node.value));
  };

  getter.subscribe = emitterRef.subscribe.bind(emitterRef);
  getter.destroyRef = emitterRef.destroyRef;

  if (ngDevMode) {
    getter.toString = () => `[Model Signal: ${getter()}]`;
    node.debugName = opts?.debugName;
  }

  return getter as typeof getter &
    Pick<
      ModelSignal<T>,
      | typeof ɵINPUT_SIGNAL_BRAND_READ_TYPE
      | typeof ɵINPUT_SIGNAL_BRAND_WRITE_TYPE
      | typeof ɵWRITABLE_SIGNAL
    >;
}

/** 모델의 값이 설정되었는지 확인합니다. */
function assertModelSet(value: unknown): void {
  if (value === REQUIRED_UNSET_VALUE) {
    throw new RuntimeError(
      RuntimeErrorCode.REQUIRED_MODEL_NO_VALUE,
      ngDevMode && '모델이 필수이나 값이 아직 사용할 수 없습니다.',
    );
  }
}
