/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Renderer} from './interfaces/renderer';
import {RComment, RElement, RNode, RText} from './interfaces/renderer_dom';
import {escapeCommentText} from '../util/dom';
import {assertDefined, assertString} from '../util/assert';
import {setUpAttributes} from './util/attrs_utils';
import {TNode} from './interfaces/node';

export function createTextNode(renderer: Renderer, value: string): RText {
  return renderer.createText(value);
}

export function updateTextNode(renderer: Renderer, rNode: RText, value: string): void {
  renderer.setValue(rNode, value);
}

export function createCommentNode(renderer: Renderer, value: string): RComment {
  return renderer.createComment(escapeCommentText(value));
}

/**
 * 태그 이름을 사용하여 네이티브 요소를 생성하고 렌더러를 사용합니다.
 * @param renderer 사용할 렌더러
 * @param name 태그 이름
 * @param namespace 요소의 선택적 네임스페이스입니다.
 * @returns 생성된 요소
 */
export function createElementNode(
  renderer: Renderer,
  name: string,
  namespace: string | null,
): RElement {
  return renderer.createElement(name, namespace);
}

/**
 * 주어진 부모를 위해 다른 네이티브 노드 앞에 네이티브 노드를 삽입합니다.
 * 이것은 네이티브 노드가 결정되었을 때 사용할 수 있는 유틸리티 함수입니다.
 */
export function nativeInsertBefore(
  renderer: Renderer,
  parent: RElement,
  child: RNode,
  beforeNode: RNode | null,
  isMove: boolean,
): void {
  renderer.insertBefore(parent, child, beforeNode, isMove);
}

export function nativeAppendChild(renderer: Renderer, parent: RElement, child: RNode): void {
  ngDevMode && assertDefined(parent, '부모 노드는 정의되어야 합니다');
  renderer.appendChild(parent, child);
}

export function nativeAppendOrInsertBefore(
  renderer: Renderer,
  parent: RElement,
  child: RNode,
  beforeNode: RNode | null,
  isMove: boolean,
) {
  if (beforeNode !== null) {
    nativeInsertBefore(renderer, parent, child, beforeNode, isMove);
  } else {
    nativeAppendChild(renderer, parent, child);
  }
}

/**
 * 주어진 렌더러를 사용하여 네이티브 노드 자체를 제거합니다. 노드를 제거하기 위해 우리는
 * 네이티브 트리에서 그것의 부모를 조회하고 모든 플랫폼/브라우저가
 * node.remove()와 동등한 것을 지원하지 않기 때문입니다.
 *
 * @param renderer 사용할 렌더러
 * @param rNode 제거해야 할 네이티브 노드
 * @param isHostElement 컴포넌트의 호스트인 노드인지 여부를 나타내는 플래그.
 */
export function nativeRemoveNode(renderer: Renderer, rNode: RNode, isHostElement?: boolean): void {
  renderer.removeChild(null, rNode, isHostElement);
}

/**
 * 주어진 RElement의 내용을 지웁니다.
 *
 * @param rElement 지워야 할 네이티브 RElement
 */
export function clearElementContents(rElement: RElement): void {
  rElement.textContent = '';
}

/**
 * `cssText`를 `RElement`에 씁니다.
 *
 * 이 함수는 어떤 조정 없이 직접 쓰기를 수행합니다. 초기 값을 쓰기 위해 사용되며,
 * 정적 스타일링 값이 스타일 파서를 불러오지 않도록 합니다.
 *
 * @param renderer 사용할 렌더러
 * @param element 업데이트해야 할 요소.
 * @param newValue 쓸 새로운 클래스 리스트.
 */
function writeDirectStyle(renderer: Renderer, element: RElement, newValue: string) {
  ngDevMode && assertString(newValue, "'newValue'는 문자열이어야 합니다");
  renderer.setAttribute(element, 'style', newValue);
}

/**
 * `className`을 `RElement`에 씁니다.
 *
 * 이 함수는 어떤 조정 없이 직접 쓰기를 수행합니다. 초기 값을 쓰기 위해 사용되며,
 * 정적 스타일링 값이 스타일 파서를 불러오지 않도록 합니다.
 *
 * @param renderer 사용할 렌더러
 * @param element 업데이트해야 할 요소.
 * @param newValue 쓸 새로운 클래스 리스트.
 */
function writeDirectClass(renderer: Renderer, element: RElement, newValue: string) {
  ngDevMode && assertString(newValue, "'newValue'는 문자열이어야 합니다");
  if (newValue === '') {
    // `google3`에서 `element.getAttribute('class')`가 `null`일 것으로 기대하는 테스트가 있습니다.
    renderer.removeAttribute(element, 'class');
  } else {
    renderer.setAttribute(element, 'class', newValue);
  }
}

/** `RNode`에서 정적 DOM 속성을 설정합니다. */
export function setupStaticAttributes(renderer: Renderer, element: RElement, tNode: TNode) {
  const {mergedAttrs, classes, styles} = tNode;

  if (mergedAttrs !== null) {
    setUpAttributes(renderer, element, mergedAttrs);
  }

  if (classes !== null) {
    writeDirectClass(renderer, element, classes);
  }

  if (styles !== null) {
    writeDirectStyle(renderer, element, styles);
  }
}
