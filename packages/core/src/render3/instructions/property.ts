/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {bindingUpdated} from '../bindings';
import {TNode} from '../interfaces/node';
import {SanitizerFn} from '../interfaces/sanitization';
import {LView, RENDERER, TView} from '../interfaces/view';
import {getLView, getSelectedTNode, getTView, nextBindingIndex} from '../state';

import {
  elementPropertyInternal,
  setAllInputsForProperty,
  storePropertyBindingMetadata,
} from './shared';

/**
 * 선택된 요소의 속성을 업데이트합니다.
 *
 * {@link select} 명령어를 통해 인덱스에 의해 선택된 요소에서 작동합니다.
 *
 * 속성 이름이 요소의 지시문 중 하나의 입력 속성으로도 존재하는 경우,
 * 요소 속성 대신 구성 요소 속성이 설정됩니다. 이 확인은 런타임에 수행되어야 하므로
 * 새로운 `@Inputs`를 추가하는 하위 구성 요소는 다시 컴파일될 필요가 없습니다.
 *
 * @param propName 속성의 이름입니다. DOM으로 전송되므로, 이 이름은
 *        축소의 일환으로 변경되지 않습니다.
 * @param value 쓸 새로운 값입니다.
 * @param sanitizer 값을 정리하는 데 사용되는 선택적 함수입니다.
 * @returns 이 함수는 스스로를 반환하므로 연결할 수 있습니다
 * (예: `property('name', ctx.name)('title', ctx.title)`)
 *
 * @codeGenApi
 */
export function ɵɵproperty<T>(
  propName: string,
  value: T,
  sanitizer?: SanitizerFn | null,
): typeof ɵɵproperty {
  const lView = getLView();
  const bindingIndex = nextBindingIndex();
  if (bindingUpdated(lView, bindingIndex, value)) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(
      tView,
      tNode,
      lView,
      propName,
      value,
      lView[RENDERER],
      sanitizer,
      false,
    );
    ngDevMode && storePropertyBindingMetadata(tView.data, tNode, propName, bindingIndex);
  }
  return ɵɵproperty;
}

/**
 * `<div style="..." my-dir>`와 `@Input('style')`를 가진 `MyDir`를 고려할 때 지시문 입력에
 * 작성해야 합니다.
 */
export function setDirectiveInputsWhichShadowsStyling(
  tView: TView,
  tNode: TNode,
  lView: LView,
  value: any,
  isClassBased: boolean,
) {
  // 'class'와 `className` 둘 다 지원하므로 fallback이 필요합니다.
  setAllInputsForProperty(tNode, tView, lView, isClassBased ? 'class' : 'style', value);
}
