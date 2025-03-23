/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {WritableSignal} from '../core_reactivity_export_internal';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {Type, Writable} from '../interface/type';
import {assertNotDefined} from '../util/assert';
import {bindingUpdated} from './bindings';
import {setDirectiveInput, storePropertyBindingMetadata} from './instructions/shared';
import {DirectiveDef} from './interfaces/definition';
import {getCurrentTNode, getLView, getSelectedTNode, getTView, nextBindingIndex} from './state';
import {stringifyForError} from './util/stringify_utils';
import {createOutputListener} from './view/directive_outputs';

/** 바인딩에 대한 메타데이터를 저장하고 검색하는 데 사용되는 심볼. */
export const BINDING = /* @__PURE__ */ Symbol('BINDING');

/**
 * 동적으로 정의된 바인딩 타깃.
 * 예를 들어, `inputBinding('value', () => 123)`은 입력 바인딩을 생성합니다.
 */
export interface Binding {
  readonly [BINDING]: {
    readonly kind: string;
    readonly requiredVars: number;
  };

  /** 바인딩을 적용할 타겟. */
  readonly target?: unknown;

  /** 생성 중에 호출되는 콜백. */
  create?(): void;

  /** 업데이트 중에 호출되는 콜백. */
  update?(): void;
}

/**
 * 바인딩이 특정하게 타겟팅된 동적으로 생성된 지시자를 나타냅니다.
 */
export interface DirectiveWithBindings<T> {
  /** 생성해야 하는 지시자 유형. */
  type: Type<T>;

  /** 특정 지시자에 적용해야 하는 바인딩. */
  bindings: Binding[];
}

// 모든 바인딩 간에 상수를 재사용할 수 있습니다.
const INPUT_BINDING_METADATA: Binding[typeof BINDING] = {kind: 'input', requiredVars: 1};
const OUTPUT_BINDING_METADATA: Binding[typeof BINDING] = {kind: 'output', requiredVars: 0};

/**
 * 입력 바인딩을 생성합니다.
 * @param publicName 바인딩할 입력의 공개 이름.
 * @param value 바인딩의 현재 값을 반환하는 콜백. 신호 또는 일반 getter 함수일 수 있습니다.
 *
 * ### 사용 예
 * 이 예에서는 `MyButton` 컴포넌트의 인스턴스를 생성하고
 * `isDisabled` 신호의 값을 그 `disabled` 입력에 바인딩합니다.
 *
 * ```
 * const isDisabled = signal(false);
 *
 * createComponent(MyButton, {
 *   bindings: [inputBinding('disabled', isDisabled)]
 * });
 * ```
 */
export function inputBinding(publicName: string, value: () => unknown): Binding {
  const binding: Binding = {
    [BINDING]: INPUT_BINDING_METADATA,
    target: null,
    update: () => {
      const target = binding.target as DirectiveDef<unknown>;
      const lView = getLView();
      const bindingIndex = nextBindingIndex();
      const resolvedValue = value();
      if (bindingUpdated(lView, bindingIndex, resolvedValue)) {
        const tView = getTView();
        const tNode = getSelectedTNode();

        if (!target && ngDevMode) {
          throw new RuntimeError(
            RuntimeErrorCode.NO_BINDING_TARGET,
            `속성 "${publicName}"에 대한 입력 바인딩은 타겟이 없습니다.`,
          );
        }

        const hasSet = setDirectiveInput(tNode, tView, lView, target, publicName, resolvedValue);

        if (ngDevMode) {
          if (!hasSet) {
            throw new RuntimeError(
              RuntimeErrorCode.NO_BINDING_TARGET,
              `${stringifyForError(target.type)}에는 "${publicName}"의 공개 이름을 가진 입력이 없습니다.`,
            );
          }
          storePropertyBindingMetadata(tView.data, tNode, publicName, bindingIndex);
        }
      }
    },
  };

  return binding;
}

/**
 * 출력 바인딩을 생성합니다.
 * @param eventName 들을 출력의 공개 이름.
 * @param listener 출력이 방출될 때 호출될 함수.
 *
 * ### 사용 예
 * 이 예에서는 `MyCheckbox` 컴포넌트의 인스턴스를 생성하고
 * 그 `onChange` 이벤트를 듣습니다.
 *
 * ```
 * interface CheckboxChange {
 *   value: string;
 * }
 *
 * createComponent(MyCheckbox, {
 *   bindings: [
 *    outputBinding<CheckboxChange>('onChange', event => console.log(event.value))
 *   ],
 * });
 * ```
 */
export function outputBinding<T>(eventName: string, listener: (event: T) => unknown): Binding {
  const binding: Binding = {
    [BINDING]: OUTPUT_BINDING_METADATA,
    target: null,
    create: () => {
      const target = binding.target as DirectiveDef<unknown>;

      if (!target && ngDevMode) {
        throw new RuntimeError(
          RuntimeErrorCode.NO_BINDING_TARGET,
          `출력 바인딩 "${eventName}"은 타겟이 없습니다.`,
        );
      }

      const lView = getLView<{} | null>();
      const tNode = getCurrentTNode()!;

      createOutputListener(tNode, lView, listener, target, eventName);
    },
  };

  return binding;
}

/**
 * 양방향 바인딩을 생성합니다.
 * @param eventName 양방향 호환 입력의 공개 이름.
 * @param value 현재 값을 가져오고 새 값을 쓸 수 있는 Writable 신호.
 *
 * ### 사용 예
 * 이 예에서는 `MyCheckbox` 컴포넌트의 인스턴스를 생성하고
 * 양방향 바인딩을 사용하여 그 `value` 입력에 바인딩합니다.
 *
 * ```
 * const checkboxValue = signal('');
 *
 * createComponent(MyCheckbox, {
 *   bindings: [
 *    twoWayBinding('value', checkboxValue),
 *   ],
 * });
 * ```
 */
export function twoWayBinding(publicName: string, value: WritableSignal<unknown>): Binding {
  const input = inputBinding(publicName, value);
  const output = outputBinding(publicName + 'Change', (eventValue) => value.set(eventValue));

  // 입력은 `create` 블록만 가지고 출력은 `update` 블록만 가지는 특성을 활용하여,
  // 여기서 전용 함수를 만드는 대신 직접 전달합니다. 이러한 가정은
  // 입력이나 출력 중 하나가 두 블록을 모두 대상으로 하기 시작하면 깨질 수 있습니다.
  // 이러한 단언문은 향후 무언가 변경될 경우 이를 포착하는 데 도움이 됩니다.
  ngDevMode && assertNotDefined(input.create, 'Unexpected `create` callback in inputBinding');
  ngDevMode && assertNotDefined(output.update, 'Unexpected `update` callback in outputBinding');

  return {
    [BINDING]: {
      kind: 'twoWay',
      requiredVars: input[BINDING].requiredVars + output[BINDING].requiredVars,
    },
    set target(target: unknown) {
      (input as Writable<Binding>).target = (output as Writable<Binding>).target = target;
    },
    create: output.create,
    update: input.update,
  };
}
