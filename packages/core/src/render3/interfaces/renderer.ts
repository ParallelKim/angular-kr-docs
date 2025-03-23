/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RendererStyleFlags2, RendererType2} from '../../render/api_flags';
import type {ListenerOptions} from '../../render/api';
import {TrustedHTML, TrustedScript, TrustedScriptURL} from '../../util/security/trusted_type_defs';

import {RComment, RElement, RNode, RText} from './renderer_dom';

/**
 * 여기서의 목표는 브라우저 DOM API가 Renderer임을 보장하는 것입니다.
 * 이를 위해 DOM API의 하위 집합을 렌더러로 정의하고
 * 런타임에서 렌더링을 위해 그것을 사용합니다.
 *
 * 런타임에서는 DOM api를 직접 사용할 수 있으며, 서버나 웹 워커에서도
 * 이러한 API를 쉽게 구현할 수 있습니다.
 */

export type GlobalTargetName = 'document' | 'window' | 'body';

export type GlobalTargetResolver = (element: any) => EventTarget;

/**
 * 요소와 텍스트 노드를 생성하는 데 필요한 절차적 스타일의 API입니다.
 *
 * 기본이 아닌 브라우저 환경(예: 웹 워커와 같은 플랫폼)에서는 요소 조작을 가능하게 하는
 * 외관입니다. 실제로 이것은 `Renderer2`에 의해 구현됩니다.
 */
export interface Renderer {
  destroy(): void;
  createComment(value: string): RComment;
  createElement(name: string, namespace?: string | null): RElement;
  createText(value: string): RText;
  /**
   * 이 속성은 null/undefined일 수 있으며,
   * 이 경우 뷰 엔진이 이를 호출하지 않습니다.
   * 이는 프로덕션 모드에서 성능 최적화를 위해 사용됩니다.
   */
  destroyNode?: ((node: RNode) => void) | null;
  appendChild(parent: RElement, newChild: RNode): void;
  insertBefore(parent: RNode, newChild: RNode, refChild: RNode | null, isMove?: boolean): void;
  removeChild(parent: RElement | null, oldChild: RNode, isHostElement?: boolean): void;
  selectRootElement(selectorOrNode: string | any, preserveContent?: boolean): RElement;

  parentNode(node: RNode): RElement | null;
  nextSibling(node: RNode): RNode | null;

  setAttribute(
    el: RElement,
    name: string,
    value: string | TrustedHTML | TrustedScript | TrustedScriptURL,
    namespace?: string | null,
  ): void;
  removeAttribute(el: RElement, name: string, namespace?: string | null): void;
  addClass(el: RElement, name: string): void;
  removeClass(el: RElement, name: string): void;
  setStyle(el: RElement, style: string, value: any, flags?: RendererStyleFlags2): void;
  removeStyle(el: RElement, style: string, flags?: RendererStyleFlags2): void;
  setProperty(el: RElement, name: string, value: any): void;
  setValue(node: RText | RComment, value: string): void;

  // TODO(misko): addEventListener/removeEventListener로 대체 예정
  listen(
    target: GlobalTargetName | RNode,
    eventName: string,
    callback: (event: any) => boolean | void,
    options?: ListenerOptions,
  ): () => void;
}

export interface RendererFactory {
  createRenderer(hostElement: RElement | null, rendererType: RendererType2 | null): Renderer;
  begin?(): void;
  end?(): void;
}
