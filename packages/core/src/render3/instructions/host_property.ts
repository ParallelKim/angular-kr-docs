/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {bindingUpdated} from '../bindings';
import {SanitizerFn} from '../interfaces/sanitization';
import {RENDERER} from '../interfaces/view';
import {
  getCurrentDirectiveDef,
  getLView,
  getSelectedTNode,
  getTView,
  nextBindingIndex,
} from '../state';
import {NO_CHANGE} from '../tokens';

import {
  elementPropertyInternal,
  loadComponentRenderer,
  storePropertyBindingMetadata,
} from './shared';

/**
 * 호스트 요소의 속성을 업데이트합니다. 입력 필드가 아닌 기본 노드 속성에만 적용됩니다.
 *
 * {@link select} 명령을 통해 인덱스로 선택된 요소에서 작동합니다.
 *
 * @param propName 속성 이름. DOM으로 전달되므로 축소의 일환으로 이름이 변경되지 않습니다.
 * @param value 쓸 새 값.
 * @param sanitizer 값을 정리하는 데 사용되는 선택적 함수.
 * @returns 이 함수는 체이닝할 수 있도록 자체를 반환합니다.
 * (예: `property('name', ctx.name)('title', ctx.title)`)
 *
 * @codeGenApi
 */
export function ɵɵhostProperty<T>(
  propName: string,
  value: T,
  sanitizer?: SanitizerFn | null,
): typeof ɵɵhostProperty {
  const lView = getLView();
  const bindingIndex = nextBindingIndex();
  if (bindingUpdated(lView, bindingIndex, value)) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    elementPropertyInternal(tView, tNode, lView, propName, value, lView[RENDERER], sanitizer, true);
    ngDevMode && storePropertyBindingMetadata(tView.data, tNode, propName, bindingIndex);
  }
  return ɵɵhostProperty;
}

/**
 * 컴포넌트나 지시어에서 합성 호스트 바인딩(e.g. `[@foo]`)을 업데이트합니다.
 *
 * 이 명령은 호환성을 위해 존재하며 합성 호스트 바인딩(e.g. `@HostBinding('@foo')`)이
 * 컴포넌트의 렌더러에서 적절하게 렌더링되도록 설계되었습니다. 일반적으로 모든 호스트 바인딩은 부모
 * 컴포넌트의 렌더러로 평가되지만, 애니메이션 @triggers 의 경우, 서브 컴포넌트의 렌더러에서 평가되어야
 * 합니다(애니메이션 트리거가 정의되는 곳이기 때문입니다).
 *
 * 이 명령을 `elementProperty`의 대체물로 사용하지 마십시오. 이 명령은 ViewEngine의 호스트 바인딩
 * 동작과의 호환성을 보장하기 위해 존재합니다.
 *
 * @param index 데이터 배열에서 업데이트할 요소의 인덱스
 * @param propName 속성 이름. DOM으로 전달되므로 축소의 일환으로 이름이 변경되지 않습니다.
 * @param value 쓸 새 값.
 * @param sanitizer 값을 정리하는 데 사용되는 선택적 함수.
 *
 * @codeGenApi
 */
export function ɵɵsyntheticHostProperty<T>(
  propName: string,
  value: T | NO_CHANGE,
  sanitizer?: SanitizerFn | null,
): typeof ɵɵsyntheticHostProperty {
  const lView = getLView();
  const bindingIndex = nextBindingIndex();
  if (bindingUpdated(lView, bindingIndex, value)) {
    const tView = getTView();
    const tNode = getSelectedTNode();
    const currentDef = getCurrentDirectiveDef(tView.data);
    const renderer = loadComponentRenderer(currentDef, tNode, lView);
    elementPropertyInternal(tView, tNode, lView, propName, value, renderer, sanitizer, true);
    ngDevMode && storePropertyBindingMetadata(tView.data, tNode, propName, bindingIndex);
  }
  return ɵɵsyntheticHostProperty;
}
