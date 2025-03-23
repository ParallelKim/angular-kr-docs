/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {bindingUpdated} from '../bindings';
import {SanitizerFn} from '../interfaces/sanitization';
import {RENDERER} from '../interfaces/view';
import {isWritableSignal, WritableSignal} from '../reactivity/signal';
import {getCurrentTNode, getLView, getSelectedTNode, getTView, nextBindingIndex} from '../state';

import {listenerInternal} from './listener';
import {elementPropertyInternal, storePropertyBindingMetadata} from './shared';

/**
 * 선택된 요소의 양방향 바인딩된 속성을 업데이트합니다.
 *
 * {@link select} 명령어를 통해 인덱스로 선택된 요소에서 작업합니다.
 *
 * @param propName 속성 이름.
 * @param value 쓸 새로운 값.
 * @param sanitizer 값을 세정하는 데 사용되는 선택적 함수.
 * @returns 이 함수는 체이닝이 가능하도록 자신을 반환합니다
 * (예: `twoWayProperty('name', ctx.name)('title', ctx.title)`)
 *
 * @codeGenApi
 */
export function ɵɵtwoWayProperty<T>(
  propName: string,
  value: T | WritableSignal<T>,
  sanitizer?: SanitizerFn | null,
): typeof ɵɵtwoWayProperty {
  // TODO(crisbeto): 각 변경 탐지 시 이걸 다시 평가하는 성능 영향?
  if (isWritableSignal(value)) {
    value = value();
  }

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

  return ɵɵtwoWayProperty;
}

/**
 * 양방향 리스너 내부에서 바인딩된 표현식의 값을 조건부로 설정하는 데 사용되는 함수입니다.
 *
 * @param target 값을 설정할 필드.
 * @param value 필드에 설정할 값.
 *
 * @codeGenApi
 */
export function ɵɵtwoWayBindingSet<T>(target: unknown, value: T): boolean {
  const canWrite = isWritableSignal(target);
  canWrite && target.set(value);
  return canWrite;
}

/**
 * 현재 노드에 양방향 바인딩을 업데이트하는 이벤트 리스너를 추가합니다.
 *
 * @param eventName 이벤트 이름.
 * @param listenerFn 이벤트가 발생할 때 호출될 함수.
 *
 * @codeGenApi
 */
export function ɵɵtwoWayListener(
  eventName: string,
  listenerFn: (e?: any) => any,
): typeof ɵɵtwoWayListener {
  const lView = getLView<{} | null>();
  const tView = getTView();
  const tNode = getCurrentTNode()!;
  listenerInternal(tView, lView, lView[RENDERER], tNode, eventName, listenerFn);
  return ɵɵtwoWayListener;
}
