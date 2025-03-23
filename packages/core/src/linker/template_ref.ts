/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../di/injector';
import {DehydratedContainerView} from '../hydration/interfaces';
import {TContainerNode, TNode, TNodeType} from '../render3/interfaces/node';
import {LView} from '../render3/interfaces/view';
import {getCurrentTNode, getLView} from '../render3/state';
import {createAndRenderEmbeddedLView} from '../render3/view_manipulation';
import {ViewRef as R3_ViewRef} from '../render3/view_ref';
import {assertDefined} from '../util/assert';

import {createElementRef, ElementRef} from './element_ref';
import {EmbeddedViewRef} from './view_ref';

/**
 * 임베드된 뷰를 인스턴스화하는 데 사용할 수 있는 임베드된 템플릿을 나타냅니다.
 * 템플릿을 기반으로 임베드된 뷰를 인스턴스화하려면 `ViewContainerRef`
 * 메서드 `createEmbeddedView()`를 사용하십시오.
 *
 * `<ng-template>` 요소에 지시어를 배치하여 `TemplateRef` 인스턴스에 접근하십시오
 * (또는 `*`로 접두사가 붙은 지시어). 임베드된 뷰에 대한 `TemplateRef`는
 * 지시어의 생성자에 주입되어,
 * `TemplateRef` 토큰을 사용합니다.
 *
 * 구성 요소 또는 지시어와 연관된 `TemplateRef`를 찾기 위해 `Query`를 사용할 수도 있습니다.
 *
 * @see {@link ViewContainerRef}
 *
 * @publicApi
 */
export abstract class TemplateRef<C> {
  /**
   * 이 임베드된 뷰에 대한 부모 뷰의 앵커 요소입니다.
   *
   * 이 `TemplateRef`로 생성된 임베드된 뷰의 데이터 바인딩 및 [주입 컨텍스트](guide/di/dependency-injection-context)는 이 위치의 컨텍스트를 상속받습니다.
   *
   * 일반적으로 새로운 임베드된 뷰는 이 위치의 뷰 컨테이너에 연결되지만,
   * 고급 사용 사례에서는 원래 위치의 데이터 바인딩 및 주입 컨텍스트를 유지하면서
   * 다른 컨테이너에 연결할 수 있습니다.
   *
   */
  // TODO(i): anchor 또는 location으로 이름 변경
  abstract readonly elementRef: ElementRef;

  /**
   * 이 템플릿을 기반으로 연결되지 않은 임베드된 뷰를 인스턴스화합니다.
   * @param context 임베드된 뷰의 데이터 바인딩 컨텍스트, `<ng-template>` 사용에서 선언된 대로.
   * @param injector 임베드된 뷰 내에서 사용할 주입기.
   * @returns 새로운 임베드된 뷰 객체.
   */
  abstract createEmbeddedView(context: C, injector?: Injector): EmbeddedViewRef<C>;

  /**
   * `createEmbeddedView` 함수의 구현입니다.
   *
   * 이 구현은 내부적이며 프레임워크 코드가 추가 매개 변수를 사용하여 호출할 수 있도록
   * 허용합니다 (예: 수분 보존을 위한) 공용 API에 영향을 주지 않습니다.
   *
   * @internal
   */
  abstract createEmbeddedViewImpl(
    context: C,
    injector?: Injector,
    dehydratedView?: DehydratedContainerView | null,
  ): EmbeddedViewRef<C>;

  /**
   * 이 `TemplateRef` 인스턴스를 생성하는 데 사용된 TView와 관련된 `ssrId`를 반환합니다.
   *
   * @internal
   */
  abstract get ssrId(): string | null;

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__: () => TemplateRef<any> | null = injectTemplateRef;
}

const ViewEngineTemplateRef = TemplateRef;

// TODO(alxhub): 인터페이스와 구현을 결합하십시오. 현재 이것은 도전적입니다.
// g3의 일부는 별도로 있어야 하는 데 의존합니다.
const R3TemplateRef = class TemplateRef<T> extends ViewEngineTemplateRef<T> {
  constructor(
    private _declarationLView: LView,
    private _declarationTContainer: TContainerNode,
    public override elementRef: ElementRef,
  ) {
    super();
  }

  /**
   * 이 `TemplateRef` 인스턴스를 생성하는 데 사용된 TView와 관련된 `ssrId`를 반환합니다.
   *
   * @internal
   */
  override get ssrId(): string | null {
    return this._declarationTContainer.tView?.ssrId || null;
  }

  override createEmbeddedView(context: T, injector?: Injector): EmbeddedViewRef<T> {
    return this.createEmbeddedViewImpl(context, injector);
  }

  /**
   * @internal
   */
  override createEmbeddedViewImpl(
    context: T,
    injector?: Injector,
    dehydratedView?: DehydratedContainerView,
  ): EmbeddedViewRef<T> {
    const embeddedLView = createAndRenderEmbeddedLView(
      this._declarationLView,
      this._declarationTContainer,
      context,
      {embeddedViewInjector: injector, dehydratedView},
    );
    return new R3_ViewRef<T>(embeddedLView);
  }
};

/**
 * 노드를 주어진 TemplateRef 생성합니다.
 *
 * @returns 사용할 TemplateRef 인스턴스
 */
export function injectTemplateRef<T>(): TemplateRef<T> | null {
  return createTemplateRef<T>(getCurrentTNode()!, getLView());
}

/**
 * TemplateRef를 생성하고 주입기에 저장합니다.
 *
 * @param hostTNode TemplateRef를 요청하는 노드
 * @param hostLView 노드가 속한 `LView`
 * @returns TemplateRef 인스턴스 또는 주어진 노드 유형에서 TemplateRef를 생성할 수 없는 경우 null
 */
export function createTemplateRef<T>(hostTNode: TNode, hostLView: LView): TemplateRef<T> | null {
  if (hostTNode.type & TNodeType.Container) {
    ngDevMode && assertDefined(hostTNode.tView, 'TView는 할당되어야 합니다.');
    return new R3TemplateRef(
      hostLView,
      hostTNode as TContainerNode,
      createElementRef(hostTNode, hostLView),
    );
  }
  return null;
}
