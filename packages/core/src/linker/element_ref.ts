/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TNode} from '../render3/interfaces/node';
import {RElement} from '../render3/interfaces/renderer_dom';
import {LView} from '../render3/interfaces/view';
import {getCurrentTNode, getLView} from '../render3/state';
import {getNativeByTNode} from '../render3/util/view_utils';

/**
 * 가장 최근의 노드에서 ElementRef를 생성합니다.
 *
 * @returns 사용할 ElementRef 인스턴스
 */
export function injectElementRef(): ElementRef {
  return createElementRef(getCurrentTNode()!, getLView());
}

/**
 * 주어진 노드로부터 ElementRef를 생성합니다.
 *
 * @param tNode ElementRef를 원하는 노드
 * @param lView 노드가 포함된 뷰
 * @returns 사용할 ElementRef 인스턴스
 */
export function createElementRef(tNode: TNode, lView: LView): ElementRef {
  return new ElementRef(getNativeByTNode(tNode, lView) as RElement);
}

/**
 * View 내의 네이티브 요소에 대한 래퍼입니다.
 *
 * `ElementRef`는 렌더링 특정 요소로 지원됩니다. 브라우저에서는 일반적으로 DOM
 * 요소입니다.
 *
 * @security DOM에 대한 직접 접근을 허용하면 애플리케이션이 XSS 공격에 더 취약해질 수 있습니다.
 * 코드에서 `ElementRef`의 사용을 신중하게 검토하십시오. 더 자세한 내용은
 * [Security Guide](https://g.co/ng/security)를 참조하십시오.
 *
 * @publicApi
 */
// 주의: 여기서는 `Injector`, `ViewContainer`와 같은 것을 노출하지 않습니다,
// 즉, 사용자는 필요로 하는 것을 요청해야 합니다. 이를 통해 더 나은 분석 도구를 구축할 수 있으며,
// 미래에는 더 나은 코드 생성을 할 수 있습니다.
export class ElementRef<T = any> {
  /**
   * <div class="callout is-critical">
   *   <header>주의하여 사용하십시오</header>
   *   <p>
   *    DOM에 대한 직접 접근이 필요할 때 이 API를 마지막 수단으로 사용하십시오. 대신 Angular에서 제공하는 템플릿과
   *    데이터 바인딩을 사용하십시오. 또는 안전하게 사용할 수 있는 API를 제공하는
   *    {@link Renderer2}를 살펴볼 수 있습니다.
   *   </p>
   * </div>
   */
  public nativeElement: T;

  constructor(nativeElement: T) {
    this.nativeElement = nativeElement;
  }

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__: () => ElementRef = injectElementRef;
}

/**
 * `ElementRef`를 언래핑하고 `nativeElement`를 반환합니다.
 *
 * @param value 언래핑할 값
 * @returns `ElementRef`인 경우 `nativeElement`를, 그렇지 않으면 값 그대로를 반환합니다.
 */
export function unwrapElementRef<T, R>(value: T | ElementRef<R>): T | R {
  return value instanceof ElementRef ? value.nativeElement : value;
}
