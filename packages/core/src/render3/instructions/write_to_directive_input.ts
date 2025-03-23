/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer, SIGNAL} from '@angular/core/primitives/signals';

import {InputSignalWithTransform} from '../../authoring/input/input_signal';
import {InputSignalNode} from '../../authoring/input/input_signal_node';
import {applyValueToInputField} from '../apply_value_input_field';
import {DirectiveDef} from '../interfaces/definition';
import {InputFlags} from '../interfaces/input_flags';
import {NodeInjectorFactory} from '../interfaces/injector';

export function writeToDirectiveInput<T>(
  def: DirectiveDef<T>,
  instance: T,
  publicName: string,
  value: unknown,
) {
  const prevConsumer = setActiveConsumer(null);
  try {
    if (ngDevMode) {
      if (!def.inputs.hasOwnProperty(publicName)) {
        throw new Error(
          `ASSERTION ERROR: 지시어 ${def.type.name}는 "${publicName}"의 공개 이름을 가진 입력이 없습니다.`,
        );
      }

      // 일반적으로 입력을 쓰기 전에 `LView[someIndex]`를 사용하여 지시어 인스턴스를 해결합니다.
      // 그러나 읽기가 너무 일찍 발생하면 `LView[someIndex]`가 실제로
      // `NodeInjectorFactory`일 수 있습니다. 이 특정 사례를 확인하십시오.
      // 이는 섬세한 방식으로 깨질 수 있습니다.
      if (instance instanceof NodeInjectorFactory) {
        throw new Error(
          `ASSERTION ERROR: 유형 ${def.type.name}의 팩토리에 입력을 쓸 수 없습니다. 지시어가 아직 생성되지 않았습니다.`,
        );
      }
    }

    const [privateName, flags, transform] = def.inputs[publicName];

    // 신호 입력을 처리하고 있는 경우 레퍼런스를 캐시합니다.
    // 트리-셔커블 방식으로. 입력 신호 노드는
    // 값 변환 실행 또는 실제 값 업데이트를 위해 사용할 수 있습니다.
    // 인스턴스 필드에 대한 추가 메가모픽 액세스를 도입하지 않습니다.
    let inputSignalNode: InputSignalNode<unknown, unknown> | null = null;
    if ((flags & InputFlags.SignalBased) !== 0) {
      const field = (instance as any)[privateName] as InputSignalWithTransform<unknown, unknown>;
      inputSignalNode = field[SIGNAL];
    }

    // 신호 노드와 변환이 있다면, 잠재적으로
    // `NgOnChanges`와 같은 기능을 위임하기 전에 실행합니다.
    if (inputSignalNode !== null && inputSignalNode.transformFn !== undefined) {
      value = inputSignalNode.transformFn(value);
    } else if (transform !== null) {
      // 장식자 입력 변환이 있다면 실행합니다.
      value = transform.call(instance, value);
    }

    if (def.setInput !== null) {
      def.setInput(instance, inputSignalNode, value, publicName, privateName);
    } else {
      applyValueToInputField(instance, inputSignalNode, privateName, value);
    }
  } finally {
    setActiveConsumer(prevConsumer);
  }
}
