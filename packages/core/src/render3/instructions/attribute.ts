/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {bindingUpdated} from '../bindings';
import {SanitizerFn} from '../interfaces/sanitization';
import {getLView, getSelectedTNode, getTView, nextBindingIndex} from '../state';
import {elementAttributeInternal, storePropertyBindingMetadata} from './shared';

/**
 * 요소에서 바인딩된 속성의 값을 업데이트하거나 제거합니다.
 *
 * `[attr.title]="value"`의 경우에 사용됩니다.
 *
 * @param name name 속성의 이름입니다.
 * @param value value 값이 `null` 또는 `undefined`일 때 속성이 제거됩니다.
 *               그렇지 않으면 속성 값이 문자열로 변환된 값으로 설정됩니다.
 * @param sanitizer 값을 정화하는 데 사용되는 선택적 함수입니다.
 * @param namespace 속성을 설정할 때 사용할 선택적 네임스페이스입니다.
 *
 * @codeGenApi
 */
export function ɵɵattribute(
  name: string,
  value: any,
  sanitizer?: SanitizerFn | null,
  namespace?: string,
): typeof ɵɵattribute {
  const lView = getLView();
  const bindingIndex = nextBindingIndex();
  if (bindingUpdated(lView, bindingIndex, value)) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementAttributeInternal(tNode, lView, name, value, sanitizer, namespace);
    ngDevMode && storePropertyBindingMetadata(tView.data, tNode, 'attr.' + name, bindingIndex);
  }
  return ɵɵattribute;
}
