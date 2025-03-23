/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TrustedHTML, TrustedScript, TrustedScriptURL} from '../../util/security/trusted_type_defs';

/**
 * 여기서의 목표는 브라우저 DOM API가 Renderer가 되도록 하는 것입니다.
 * 이를 위해 DOM API의 하위 집합을 정의하여 렌더러로 만들고
 * 런타임에서 렌더링을 위해 이를 사용합니다.
 *
 * 런타임에서 우리는 DOM API를 직접 사용할 수 있으며, 서버나 웹 워커에서
 * 그러한 API를 쉽게 구현할 수 있습니다.
 */

/** 요소 및 텍스트 노드를 추가하는 데 필요한 API의 하위 집합. */
export interface RNode {
  /**
   * 부모 요소, 문서 또는 DocumentFragment를 반환합니다.
   */
  parentNode: RNode | null;

  /**
   * 부모 요소가 있으면 반환합니다.
   */
  parentElement: RElement | null;

  /**
   * 부모의 childNodes에서 이 노드 바로 다음의 노드를 가져옵니다.
   */
  nextSibling: RNode | null;

  /**
   * 자식 노드를 삽입합니다.
   *
   * View root 노드를 ViewAnchor 위치에 추가하는 데 사용할 전용입니다.
   */
  insertBefore(newChild: RNode, refChild: RNode | null, isViewRoot: boolean): void;

  /**
   * 자식 노드를 추가합니다.
   *
   * 정적 DOM(즉, View 루트가 아닌)을 구축하는 데 사용할 전용입니다.
   */
  appendChild(newChild: RNode): RNode;
}

/**
 * 속성, 프로퍼티를 작성하고 Element에서 리스너를 설정하는 데 필요한 API의 하위 집합.
 */
export interface RElement extends RNode {
  firstChild: RNode | null;
  style: RCssStyleDeclaration;
  classList: RDomTokenList;
  className: string;
  tagName: string;
  textContent: string | null;
  hasAttribute(name: string): boolean;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string | TrustedHTML | TrustedScript | TrustedScriptURL): void;
  removeAttribute(name: string): void;
  setAttributeNS(
    namespaceURI: string,
    qualifiedName: string,
    value: string | TrustedHTML | TrustedScript | TrustedScriptURL,
  ): void;
  addEventListener(type: string, listener: EventListener, useCapture?: boolean): void;
  removeEventListener(type: string, listener?: EventListener, options?: boolean): void;
  remove(): void;
  setProperty?(name: string, value: any): void;
}

export interface RCssStyleDeclaration {
  removeProperty(propertyName: string): string;
  setProperty(propertyName: string, value: string | null, priority?: string): void;
}

export interface RDomTokenList {
  add(token: string): void;
  remove(token: string): void;
}

export interface RText extends RNode {
  textContent: string | null;
}

export interface RComment extends RNode {
  textContent: string | null;
}

export interface RTemplate extends RElement {
  tagName: 'TEMPLATE';
  content: RNode;
}
