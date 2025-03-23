/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isLView} from '../render3/interfaces/type_checks';
import {RENDERER} from '../render3/interfaces/view';
import {getCurrentTNode, getLView} from '../render3/state';
import {getComponentLViewByIndex} from '../render3/util/view_utils';

import {RendererStyleFlags2, RendererType2} from './api_flags';

/**
 * 커스텀 렌더러를 생성하고 초기화합니다. 이 렌더러는 `Renderer2` 기본 클래스를 구현합니다.
 *
 * @publicApi
 */
export abstract class RendererFactory2 {
  /**
   * 호스트 DOM 요소에 대한 커스텀 렌더러를 생성하고 초기화합니다.
   * @param hostElement 렌더링할 요소입니다.
   * @param type 구현할 기본 클래스입니다.
   * @returns 새로운 커스텀 렌더러 인스턴스입니다.
   */
  abstract createRenderer(hostElement: any, type: RendererType2 | null): Renderer2;
  /**
   * 렌더링이 시작될 때 호출되는 콜백입니다.
   */
  abstract begin?(): void;
  /**
   * 렌더링이 완료될 때 호출되는 콜백입니다.
   */
  abstract end?(): void;
  /**
   * 애니메이션 테스트 전용 모드와 함께 사용합니다. 렌더링이 완료되었을 때 테스트에 알림을 보냅니다.
   * @returns 개발자가 정의한 함수의 비동기 결과입니다.
   */
  abstract whenRenderingDone?(): Promise<any>;
}

/**
 * 이 기본 클래스를 확장하여 커스텀 렌더링을 구현합니다. 기본적으로 Angular는
 * 템플릿을 DOM에 렌더링합니다. 커스텀 렌더링을 사용하여
 * 렌더링 호출을 가로채거나 DOM 외의 다른 곳에 렌더링할 수 있습니다.
 *
 * `RendererFactory2`를 사용하여 커스텀 렌더러를 만듭니다.
 *
 * 커스텀 렌더러를 사용하여 Angular의 템플릿을 우회하고
 * 선언적으로 표현할 수 없는 커스텀 UI 변경을 수행합니다.
 * 예를 들어, 이름이 정적으로 알려지지 않은 속성이나 속성을 설정해야 하는 경우
 * `setProperty()` 또는
 * `setAttribute()` 메서드를 사용하세요.
 *
 * @publicApi
 */
export abstract class Renderer2 {
  /**
   * 렌더러 인스턴스에 임의의 개발자 정의 데이터를 저장하는 데 사용합니다.
   * 키-값 쌍을 포함하는 객체로 저장합니다.
   * 이는 다른 렌더러에 위임하는 렌더러에 유용합니다.
   */
  abstract get data(): {[key: string]: any};

  /**
   * 이 콜백을 구현하여 렌더러 또는 호스트 요소를 제거합니다.
   */
  abstract destroy(): void;
  /**
   * 호스트 요소의 인스턴스를 생성하기 위해 이 콜백을 구현합니다.
   * @param name 새 요소의 식별 이름, 네임스페이스 내에서 고유합니다.
   * @param namespace 새 요소의 네임스페이스입니다.
   * @returns 새 요소입니다.
   */
  abstract createElement(name: string, namespace?: string | null): any;
  /**
   * 호스트 요소의 DOM에 주석을 추가하기 위해 이 콜백을 구현합니다.
   * @param value 주석 텍스트입니다.
   * @returns 수정된 요소입니다.
   */
  abstract createComment(value: string): any;

  /**
   * 호스트 요소의 DOM에 텍스트를 추가하기 위해 이 콜백을 구현합니다.
   * @param value 텍스트 문자열입니다.
   * @returns 수정된 요소입니다.
   */
  abstract createText(value: string): any;
  /**
   * null 또는 undefined인 경우, 뷰 엔진은 이를 호출하지 않습니다.
   * 이는 생산 모드의 성능 최적화로 사용됩니다.
   */
  destroyNode: ((node: any) => void) | null = null;
  /**
   * 호스트 요소 DOM의 주어진 부모 노드에 자식을 추가합니다.
   * @param parent 부모 노드입니다.
   * @param newChild 새로운 자식 노드입니다.
   */
  abstract appendChild(parent: any, newChild: any): void;
  /**
   * 호스트 요소 DOM 내의 부모 노드의 주어진 위치에 자식 노드를 삽입하기 위해
   * 이 콜백을 구현합니다.
   * @param parent 부모 노드입니다.
   * @param newChild 새로운 자식 노드입니다.
   * @param refChild `newChild`가 삽입되는 기존 자식 노드입니다.
   * @param isMove 현재의 `insertBefore`가 이동의 결과인지 여부를 표시하는 선택적 인수입니다.
   *     애니메이션은 이 정보를 사용하여 이동 애니메이션을 트리거합니다. 과거에 애니메이션은
   *     모든 `insertBefore`가 이동이라고 가정했습니다. 이는 항상 사실이 아니며,
   *     런타임 i18n을 사용하여 `insertBefore`를 호출할 수 있으므로 애니메이션 이동을
   *     트리거하지 않아야 합니다.
   */
  abstract insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean): void;
  /**
   * 호스트 요소의 DOM에서 자식 노드를 제거하기 위해 이 콜백을 구현합니다.
   * @param parent 부모 노드입니다.
   * @param oldChild 제거할 자식 노드입니다.
   * @param isHostElement 이 요소가 호스트 요소인지 여부를 렌더러에 선택적으로 신호 보내기
   */
  abstract removeChild(parent: any, oldChild: any, isHostElement?: boolean): void;
  /**
   * 부트스트랩할 루트 요소로 준비하기 위해 이 콜백을 구현하고,
   * 요소 인스턴스를 반환합니다.
   * @param selectorOrNode DOM 요소입니다.
   * @param preserveContent 루트 요소의 내용을 유지할지 여부
   * 부트스트랩 중에 지워져야 할 것입니다 (기본 동작).
   * `<slot>` 요소를 통해 간단한 네이티브 콘텐츠 투영을 허용하려면 `ViewEncapsulation.ShadowDom`와 함께 사용하세요.
   * @returns 루트 요소입니다.
   */
  abstract selectRootElement(selectorOrNode: string | any, preserveContent?: boolean): any;
  /**
   * 호스트 요소의 DOM에서 주어진 노드의 부모를 얻기 위해
   * 이 콜백을 구현합니다.
   * @param node 쿼리할 자식 노드입니다.
   * @returns 부모 노드, 또는 Eltern이 없으면 null입니다.
   * 이는 체크가 동기적이며,
   * 호출자가 null 확인에 의존할 수 없기 때문입니다.
   */
  abstract parentNode(node: any): any;
  /**
   * 호스트 요소의 DOM에서 주어진 노드의 다음 형제 노드를 얻기 위해
   * 이 콜백을 구현합니다.
   * @returns 형제 노드, 없으면 null입니다.
   * 이는 체크가 동기적이며,
   * 호출자가 null 확인에 의존할 수 없기 때문입니다.
   */
  abstract nextSibling(node: any): any;
  /**
   * DOM의 요소에 대한 속성 값을 설정하기 위해 이 콜백을 구현합니다.
   * @param el 요소입니다.
   * @param name 속성 이름입니다.
   * @param value 새로운 값입니다.
   * @param namespace 네임스페이스입니다.
   */
  abstract setAttribute(el: any, name: string, value: string, namespace?: string | null): void;

  /**
   * DOM의 요소에서 속성을 제거하기 위해 이 콜백을 구현합니다.
   * @param el 요소입니다.
   * @param name 속성 이름입니다.
   * @param namespace 네임스페이스입니다.
   */
  abstract removeAttribute(el: any, name: string, namespace?: string | null): void;
  /**
   * DOM의 요소에 클래스를 추가하기 위해 이 콜백을 구현합니다.
   * @param el 요소입니다.
   * @param name 클래스 이름입니다.
   */
  abstract addClass(el: any, name: string): void;

  /**
   * DOM의 요소에서 클래스를 제거하기 위해 이 콜백을 구현합니다.
   * @param el 요소입니다.
   * @param name 클래스 이름입니다.
   */
  abstract removeClass(el: any, name: string): void;

  /**
   * DOM의 요소에 대한 CSS 스타일을 설정하기 위해 이 콜백을 구현합니다.
   * @param el 요소입니다.
   * @param style 스타일 이름입니다.
   * @param value 새로운 값입니다.
   * @param flags 스타일 변형을 위한 플래그입니다. 기본적으로 아무 플래그도 설정되지 않습니다.
   */
  abstract setStyle(el: any, style: string, value: any, flags?: RendererStyleFlags2): void;

  /**
   * DOM의 요소에 대한 CSS 스타일에서 값을 제거하기 위해 이 콜백을 구현합니다.
   * @param el 요소입니다.
   * @param style 스타일 이름입니다.
   * @param flags 제거할 스타일 변형을 위한 플래그, 설정되어 있으면.
   */
  abstract removeStyle(el: any, style: string, flags?: RendererStyleFlags2): void;

  /**
   * DOM의 요소 속성값을 설정하기 위해 이 콜백을 구현합니다.
   * @param el 요소입니다.
   * @param name 속성 이름입니다.
   * @param value 새로운 값입니다.
   */
  abstract setProperty(el: any, name: string, value: any): void;

  /**
   * 호스트 요소의 노드 값을 설정하기 위해 이 콜백을 구현합니다.
   * @param node 노드입니다.
   * @param value 새로운 값입니다.
   */
  abstract setValue(node: any, value: string): void;

  /**
   * 이벤트 리스너를 시작하기 위해 이 콜백을 구현합니다.
   * @param target 이벤트를 수신하기 위한 컨텍스트입니다. 전체 창 또는 문서,
   * 문서의 본문 또는 특정 DOM 요소일 수 있습니다.
   * @param eventName 수신할 이벤트입니다.
   * @param callback 이벤트가 발생할 때 호출할 핸들러 함수입니다.
   * @param options 이벤트 리스너가 바인딩되는 방법을 구성하는 옵션입니다.
   * @returns 이 핸들러를 처리하기 위한 "unlisten" 함수입니다.
   */
  abstract listen(
    target: 'window' | 'document' | 'body' | any,
    eventName: string,
    callback: (event: any) => boolean | void,
    options?: ListenerOptions,
  ): () => void;

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__: () => Renderer2 = () => injectRenderer2();
}

/** 현재 구성 요소에 대한 Renderer2를 주입합니다. */
export function injectRenderer2(): Renderer2 {
  // 우리는 주입되는 구성 요소를 기반으로 렌더러가 필요하지만,
  // DI는 뷰에 들어가기 전에 발생하므로, `getLView`는 부모 뷰를 반환합니다.
  const lView = getLView();
  const tNode = getCurrentTNode()!;
  const nodeAtIndex = getComponentLViewByIndex(tNode.index, lView);
  return (isLView(nodeAtIndex) ? nodeAtIndex : lView)[RENDERER] as Renderer2;
}

/**
 * 이 열거형은 프레임워크에 의해 구현된 다양한 렌더러의 `ɵtype` 속성을 사용하기 위한 것입니다.
 *
 * 공개 API에 노출되는 것을 피하기 위해 `Renderer2`에 `ɵtype`을 추가하지 않기로 선택합니다.
 */
export const enum AnimationRendererType {
  Regular = 0,
  Delegated = 1,
}

/**
 * 이벤트 리스너를 구성하는 데 사용할 수 있는 옵션입니다.
 * @publicApi
 */
export interface ListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
}
