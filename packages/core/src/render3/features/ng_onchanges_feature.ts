/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InputSignalNode} from '../../authoring/input/input_signal_node';
import {OnChanges} from '../../interface/lifecycle_hooks';
import {SimpleChange, SimpleChanges} from '../../interface/simple_change';
import {assertString} from '../../util/assert';
import {EMPTY_OBJ} from '../../util/empty';
import {applyValueToInputField} from '../apply_value_input_field';
import {DirectiveDef, DirectiveDefFeature} from '../interfaces/definition';

/**
 * NgOnChangesFeature는 ngOnChanges 생명주기 훅을 지원하는 컴포넌트를 장식하므로,
 * 해당 훅을 구현하는 모든 컴포넌트에 포함되어야 합니다.
 *
 * 컴포넌트나 지시문이 상속을 사용하는 경우, NgOnChangesFeature는
 * {@link InheritDefinitionFeature} 이후에 기능으로 포함되어야 하며, 그렇지 않으면
 * 상속된 속성이 ngOnChanges 생명주기 훅으로 전파되지 않습니다.
 *
 * 사용 예:
 *
 * ```ts
 * static ɵcmp = defineComponent({
 *   ...
 *   inputs: {name: 'publicName'},
 *   features: [NgOnChangesFeature]
 * });
 * ```
 *
 * @codeGenApi
 */
export const ɵɵNgOnChangesFeature: () => DirectiveDefFeature = /* @__PURE__ */ (() => {
  const ɵɵNgOnChangesFeatureImpl = () => NgOnChangesFeatureImpl;

  // 이 옵션은 ngOnChanges 생명주기 훅이
  // 슈퍼클래스(상속정의기능)에서 상속될 것임을 보장합니다.
  /** @nocollapse */
  ɵɵNgOnChangesFeatureImpl.ngInherit = true;

  return ɵɵNgOnChangesFeatureImpl;
})();

export function NgOnChangesFeatureImpl<T>(definition: DirectiveDef<T>) {
  if (definition.type.prototype.ngOnChanges) {
    definition.setInput = ngOnChangesSetInput;
  }
  return rememberChangeHistoryAndInvokeOnChangesHook;
}

/**
 * 이는 `TView.preOrderHooks`에 삽입되어 `ngOnChanges`를 시뮬레이션하는
 * 합성 생명주기 훅입니다.
 *
 * 이 훅은 컴포넌트 인스턴스에서 `NgSimpleChangesStore` 데이터를 읽고,
 * 변경 사항이 발견되면 컴포넌트 인스턴스에서 `ngOnChanges`를 호출합니다.
 *
 * @param this 컴포넌트 인스턴스. 이 함수는 `TView.preOrderHooks`에 삽입되므로,
 *     컴포넌트 인스턴스와 함께 호출되는 것이 보장됩니다.
 */
function rememberChangeHistoryAndInvokeOnChangesHook(this: OnChanges) {
  const simpleChangesStore = getSimpleChangesStore(this);
  const current = simpleChangesStore?.current;

  if (current) {
    const previous = simpleChangesStore!.previous;
    if (previous === EMPTY_OBJ) {
      simpleChangesStore!.previous = current;
    } else {
      // 새로운 변경 사항이 이전 저장소에 복사되어
      // 이번에 변경되지 않은 입력에 대한 기록을 잃지 않도록 합니다.
      for (let key in current) {
        previous[key] = current[key];
      }
    }
    simpleChangesStore!.current = null;
    this.ngOnChanges(current);
  }
}

function ngOnChangesSetInput<T>(
  this: DirectiveDef<T>,
  instance: T,
  inputSignalNode: null | InputSignalNode<unknown, unknown>,
  value: unknown,
  publicName: string,
  privateName: string,
): void {
  const declaredName = (this.declaredInputs as {[key: string]: string})[publicName];
  ngDevMode && assertString(declaredName, 'ngOnChanges의 입력 이름은 문자열이어야 합니다.');
  const simpleChangesStore =
    getSimpleChangesStore(instance) ||
    setSimpleChangesStore(instance, {previous: EMPTY_OBJ, current: null});
  const current = simpleChangesStore.current || (simpleChangesStore.current = {});
  const previous = simpleChangesStore.previous;
  const previousChange = previous[declaredName];
  current[declaredName] = new SimpleChange(
    previousChange && previousChange.currentValue,
    value,
    previous === EMPTY_OBJ,
  );

  applyValueToInputField(instance, inputSignalNode, privateName, value);
}

const SIMPLE_CHANGES_STORE = '__ngSimpleChanges__';

function getSimpleChangesStore(instance: any): null | NgSimpleChangesStore {
  return instance[SIMPLE_CHANGES_STORE] || null;
}

function setSimpleChangesStore(instance: any, store: NgSimpleChangesStore): NgSimpleChangesStore {
  return (instance[SIMPLE_CHANGES_STORE] = store);
}

/**
 * 컴포넌트 인스턴스에 원주율 패치되어 `ngOnChanges`
 * 생명주기 훅에 의해 이전 입력 값을 추적하는 데 사용되는 데이터 구조입니다.
 */
interface NgSimpleChangesStore {
  previous: SimpleChanges;
  current: SimpleChanges | null;
}
