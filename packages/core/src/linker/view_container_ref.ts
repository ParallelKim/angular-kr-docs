/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../di/injector';
import {EnvironmentInjector} from '../di/r3_injector';
import {validateMatchingNode} from '../hydration/error_handling';
import {CONTAINERS} from '../hydration/interfaces';
import {isInSkipHydrationBlock} from '../hydration/skip_hydration';
import {
  getSegmentHead,
  isDisconnectedNode,
  markRNodeAsClaimedByHydration,
} from '../hydration/utils';
import {findMatchingDehydratedView, locateDehydratedViewsInContainer} from '../hydration/views';
import {isType, Type} from '../interface/type';
import {assertNodeInjector} from '../render3/assert';
import {ComponentFactory as R3ComponentFactory} from '../render3/component_ref';
import {getComponentDef} from '../render3/def_getters';
import {getParentInjectorLocation, NodeInjector} from '../render3/di';
import {
  CONTAINER_HEADER_OFFSET,
  DEHYDRATED_VIEWS,
  LContainer,
  NATIVE,
  VIEW_REFS,
} from '../render3/interfaces/container';
import {NodeInjectorOffset} from '../render3/interfaces/injector';
import {
  TContainerNode,
  TDirectiveHostNode,
  TElementContainerNode,
  TElementNode,
  TNode,
  TNodeType,
} from '../render3/interfaces/node';
import {RComment, RNode} from '../render3/interfaces/renderer_dom';
import {isLContainer} from '../render3/interfaces/type_checks';
import {
  HEADER_OFFSET,
  HYDRATION,
  LView,
  PARENT,
  RENDERER,
  T_HOST,
  TVIEW,
} from '../render3/interfaces/view';
import {assertTNodeType} from '../render3/node_assert';
import {destroyLView} from '../render3/node_manipulation';
import {nativeInsertBefore} from '../render3/dom_node_manipulation';
import {getCurrentTNode, getLView} from '../render3/state';
import {
  getParentInjectorIndex,
  getParentInjectorView,
  hasParentInjector,
} from '../render3/util/injector_utils';
import {getNativeByTNode, unwrapRNode, viewAttachedToContainer} from '../render3/util/view_utils';
import {shouldAddViewToDom} from '../render3/view_manipulation';
import {ViewRef as R3ViewRef} from '../render3/view_ref';
import {addToArray, removeFromArray} from '../util/array_utils';
import {
  assertDefined,
  assertEqual,
  assertGreaterThan,
  assertLessThan,
  throwError,
} from '../util/assert';

import {ComponentFactory, ComponentRef} from './component_factory';
import {createElementRef, ElementRef} from './element_ref';
import {NgModuleRef} from './ng_module_factory';
import {TemplateRef} from './template_ref';
import {EmbeddedViewRef, ViewRef} from './view_ref';
import {addLViewToLContainer, createLContainer, detachView} from '../render3/view/container';
import {addToEndOfViewTree} from '../render3/view/construction';
import {Binding, DirectiveWithBindings} from '../render3/dynamic_bindings';

/**
 * 컴포넌트에 하나 이상의 뷰를 연결할 수 있는 컨테이너를 나타냅니다.
 *
 * *호스트 뷰* (*createComponent()* 메소드를 사용하여 생성된 컴포넌트)와
 * *임베디드 뷰* (*createEmbeddedView()* 메소드를 사용하여 `TemplateRef`를 인스턴스화하여 생성됨)을 포함할 수 있습니다.
 *
 * 뷰 컨테이너 인스턴스는 다른 뷰 컨테이너를 포함할 수 있어,
 * 뷰 계층 구조를 생성합니다.
 *
 * @usageNotes
 *
 * 아래 예제에서는 `createComponent` 함수가 어떻게 동적으로 `ComponentRef` 인스턴스를 생성하고
 * `ApplicationRef`에 연결할 수 있는지를 보여줍니다. 이를 통해 변경 탐지 주기에 포함됩니다.
 *
 * 참고: 예제는 독립 실행형 컴포넌트를 사용하지만, 이 함수는 비독립 실행형 컴포넌트(모듈에서 선언)에도 사용할 수 있습니다.
 *
 * ```angular-ts
 * @Component({
 *   standalone: true,
 *   selector: 'dynamic',
 *   template: `<span>This is a content of a dynamic component.</span>`,
 * })
 * class DynamicComponent {
 *   vcr = inject(ViewContainerRef);
 * }
 *
 * @Component({
 *   standalone: true,
 *   selector: 'app',
 *   template: `<main>Hi! This is the main content.</main>`,
 * })
 * class AppComponent {
 *   vcr = inject(ViewContainerRef);
 *
 *   ngAfterViewInit() {
 *     const compRef = this.vcr.createComponent(DynamicComponent);
 *     compRef.changeDetectorRef.detectChanges();
 *   }
 * }
 * ```
 *
 * @see {@link ComponentRef}
 * @see {@link EmbeddedViewRef}
 *
 * @publicApi
 */
export abstract class ViewContainerRef {
  /**
   * 이 컨테이너의 위치를 나타내는 앵커 요소.
   * 각 뷰 컨테이너는 하나의 앵커 요소만 가질 수 있으며,
   * 각 앵커 요소는 단일 뷰 컨테이너만 가질 수 있습니다.
   *
   * 이 컨테이너에 연결된 뷰의 루트 요소는
   * 렌더링된 뷰에서 앵커 요소의 형제가 됩니다.
   *
   * 앵커 요소에 `ViewContainerRef`가 주입된 `Directive`를 배치하거나 `ViewChild` 쿼리를 사용하여
   * 엑세스합니다.
   *
   * <!-- TODO: rename to anchorElement -->
   */
  abstract get element(): ElementRef;

  /**
   * 이 뷰 컨테이너에 대한 의존성 주입기.
   */
  abstract get injector(): Injector;

  /** @deprecated 대체 항목 없음 */
  abstract get parentInjector(): Injector;

  /**
   * 이 컨테이너의 모든 뷰를 파괴합니다.
   */
  abstract clear(): void;

  /**
   * 이 컨테이너에서 뷰를 검색합니다.
   * @param index 검색할 뷰의 0 기반 인덱스.
   * @returns 인스턴스 `ViewRef` 또는 인덱스가 범위를 벗어났다면 null.
   */
  abstract get(index: number): ViewRef | null;

  /**
   * 현재 이 컨테이너에 연결된 뷰의 수를 보고합니다.
   * @returns 뷰의 수.
   */
  abstract get length(): number;

  /**
   * 임베디드 뷰를 인스턴스화하고
   * 이 컨테이너에 삽입합니다.
   * @param templateRef 뷰를 정의하는 HTML 템플릿입니다.
   * @param context <ng-template> 안에서 정의된 임베디드 뷰의 데이터 바인딩 컨텍스트입니다.
   * @param options 생성된 뷰에 대한 추가 구성을 포함합니다:
   *  * index: 새로운 뷰를 이 컨테이너에 삽입할 0 기반 인덱스.
   *           지정하지 않으면 새로운 뷰가 마지막 항목으로 추가됩니다.
   *  * injector: 임베디드 뷰 내에서 사용할 주입기입니다.
   *
   * @returns 새로 생성된 뷰의 `ViewRef` 인스턴스입니다.
   */
  abstract createEmbeddedView<C>(
    templateRef: TemplateRef<C>,
    context?: C,
    options?: {
      index?: number;
      injector?: Injector;
    },
  ): EmbeddedViewRef<C>;

  /**
   * 임베디드 뷰를 인스턴스화하고
   * 이 컨테이너에 삽입합니다.
   * @param templateRef 뷰를 정의하는 HTML 템플릿입니다.
   * @param context <ng-template> 안에서 정의된 임베디드 뷰의 데이터 바인딩 컨텍스트입니다.
   * @param index 새로운 뷰를 이 컨테이너에 삽입할 0 기반 인덱스.
   * 지정하지 않으면 새로운 뷰가 마지막 항목으로 추가됩니다.
   *
   * @returns 새로 생성된 뷰의 `ViewRef` 인스턴스입니다.
   */
  abstract createEmbeddedView<C>(
    templateRef: TemplateRef<C>,
    context?: C,
    index?: number,
  ): EmbeddedViewRef<C>;

  /**
   * 단일 컴포넌트를 인스턴스화하고
   * 그 호스트 뷰를 이 컨테이너에 삽입합니다.
   *
   * @param componentType 사용할 컴포넌트 유형입니다.
   * @param options 추가 매개변수를 포함하는 객체:
   *  * index: 새로운 컴포넌트의 호스트 뷰를 이 컨테이너에 삽입할 인덱스.
   *           지정하지 않으면 새로운 뷰가 마지막 항목으로 추가됩니다.
   *  * injector: 새 컴포넌트의 부모로 사용할 주입기입니다.
   *  * ngModuleRef: 컴포넌트의 NgModule의 NgModuleRef, 일반적으로 제공해야 합니다.
   *                 이렇게 하면 컴포넌트 인스턴스화에 필요한 모든 제공자를 보장할 수 있습니다.
   *  * environmentInjector: 컴포넌트의 환경을 제공할 EnvironmentInjector입니다.
   *                 일반적으로 제공해야 합니다. 이렇게 하면 컴포넌트 인스턴스화에 필요한 모든 제공자를 보장할 수 있습니다.
   *                 이 옵션은 `ngModuleRef` 매개변수를 대체하려고 합니다.
   *  * projectableNodes: 새 컴포넌트 인스턴스를 통해 투영되어야 하는 DOM 노드 목록입니다.
   *  * directives: 컴포넌트에 적용해야 하는 지시어입니다.
   *  * bindings: 컴포넌트에 적용해야 하는 바인딩입니다.
   *
   * @returns 컴포넌트 인스턴스와 호스트 뷰를 포함하는 새로운 `ComponentRef`입니다.
   */
  abstract createComponent<C>(
    componentType: Type<C>,
    options?: {
      index?: number;
      injector?: Injector;
      ngModuleRef?: NgModuleRef<unknown>;
      environmentInjector?: EnvironmentInjector | NgModuleRef<unknown>;
      projectableNodes?: Node[][];
      directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[];
      bindings?: Binding[];
    },
  ): ComponentRef<C>;

  /**
   * 단일 컴포넌트를 인스턴스화하고
   * 그 호스트 뷰를 이 컨테이너에 삽입합니다.
   *
   * @param componentFactory 사용할 컴포넌트 팩토리입니다.
   * @param index 새로운 컴포넌트의 호스트 뷰를 이 컨테이너에 삽입할 인덱스.
   * 지정하지 않으면 새로운 뷰가 마지막 항목으로 추가됩니다.
   * @param injector 새로운 컴포넌트의 부모로 사용할 주입기입니다.
   * @param projectableNodes 새 컴포넌트 인스턴스의 [`<ng-content>`](api/core/ng-content)를 통해 투영되어야 하는 DOM 노드 목록입니다.
   * @param ngModuleRef NgModule를 나타내는 NgModuleRef의 인스턴스입니다.
   * 이 정보는 해당 NgModule 주입기를 검색하는 데 사용됩니다.
   * @param directives 컴포넌트에 적용해야 하는 지시어입니다.
   * @param bindings 컴포넌트에 적용해야 하는 바인딩입니다.
   *
   * @returns 컴포넌트 인스턴스와 호스트 뷰를 포함하는 새로운 `ComponentRef`입니다.
   *
   * @deprecated Angular는 더 이상 컴포넌트 팩토리를 사용하여 동적으로 컴포넌트를 생성할 필요가 없습니다.
   *     컴포넌트 클래스를 직접 전달할 수 있는 `createComponent` 메소드의 다른 시그니처를 사용하십시오.
   */
  abstract createComponent<C>(
    componentFactory: ComponentFactory<C>,
    index?: number,
    injector?: Injector,
    projectableNodes?: any[][],
    environmentInjector?: EnvironmentInjector | NgModuleRef<any>,
    directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[],
    bindings?: Binding[],
  ): ComponentRef<C>;

  /**
   * 뷰를 이 컨테이너에 삽입합니다.
   * @param viewRef 삽입할 뷰입니다.
   * @param index 삽입할 뷰의 0 기반 인덱스.
   * 지정하지 않으면 새로운 뷰가 마지막 항목으로 추가됩니다.
   * @returns 삽입된 `ViewRef` 인스턴스입니다.
   *
   */
  abstract insert(viewRef: ViewRef, index?: number): ViewRef;

  /**
   * 뷰를 이 컨테이너의 새로운 위치로 이동합니다.
   * @param viewRef 이동할 뷰입니다.
   * @param index 새 위치의 0 기반 인덱스입니다.
   * @returns 이동된 `ViewRef` 인스턴스입니다.
   */
  abstract move(viewRef: ViewRef, currentIndex: number): ViewRef;

  /**
   * 현재 컨테이너 내에서 뷰의 인덱스를 반환합니다.
   * @param viewRef 쿼리할 뷰입니다.
   * @returns 이 컨테이너 내에서 뷰의 위치의 0 기반 인덱스입니다.
   * 또는 이 컨테이너가 뷰를 포함하지 않는 경우 `-1`입니다.
   */
  abstract indexOf(viewRef: ViewRef): number;

  /**
   * 이 컨테이너에 연결된 뷰를 파괴합니다.
   * @param index 파괴할 뷰의 0 기반 인덱스입니다.
   * 지정하지 않으면 컨테이너에서 마지막 뷰가 제거됩니다.
   */
  abstract remove(index?: number): void;

  /**
   * 이 컨테이너에서 뷰를 분리하지만 파괴하지는 않습니다.
   * 현재 컨테이너 내에서 뷰를 이동하기 위해 `insert()`와 함께 사용합니다.
   * @param index 분리할 뷰의 0 기반 인덱스입니다.
   * 지정하지 않으면 컨테이너에서 마지막 뷰가 분리됩니다.
   */
  abstract detach(index?: number): ViewRef | null;

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__: () => ViewContainerRef = injectViewContainerRef;
}

/**
 * ViewContainerRef를 생성하고 주입기에 저장합니다.
 * 또는, ViewContainerRef가 이미 존재하는 경우, 기존 ViewContainerRef를 검색합니다.
 *
 * @returns 사용할 ViewContainerRef 인스턴스입니다.
 */
export function injectViewContainerRef(): ViewContainerRef {
  const previousTNode = getCurrentTNode() as TElementNode | TElementContainerNode | TContainerNode;
  return createContainerRef(previousTNode, getLView());
}

const VE_ViewContainerRef = ViewContainerRef;

// TODO(alxhub): 이 사이드 키워드를 정리하면 g3의 Closure에서 미세한 버그를 유발합니다. 수리되고 나면,
// 이 부분을 정리할 수 있습니다.
const R3ViewContainerRef = class ViewContainerRef extends VE_ViewContainerRef {
  constructor(
    private _lContainer: LContainer,
    private _hostTNode: TElementNode | TContainerNode | TElementContainerNode,
    private _hostLView: LView,
  ) {
    super();
  }

  override get element(): ElementRef {
    return createElementRef(this._hostTNode, this._hostLView);
  }

  override get injector(): Injector {
    return new NodeInjector(this._hostTNode, this._hostLView);
  }

  /** @deprecated 대체 항목 없음 */
  override get parentInjector(): Injector {
    const parentLocation = getParentInjectorLocation(this._hostTNode, this._hostLView);
    if (hasParentInjector(parentLocation)) {
      const parentView = getParentInjectorView(parentLocation, this._hostLView);
      const injectorIndex = getParentInjectorIndex(parentLocation);
      ngDevMode && assertNodeInjector(parentView, injectorIndex);
      const parentTNode = parentView[TVIEW].data[
        injectorIndex + NodeInjectorOffset.TNODE
      ] as TElementNode;
      return new NodeInjector(parentTNode, parentView);
    } else {
      return new NodeInjector(null, this._hostLView);
    }
  }

  override clear(): void {
    while (this.length > 0) {
      this.remove(this.length - 1);
    }
  }

  override get(index: number): ViewRef | null {
    const viewRefs = getViewRefs(this._lContainer);
    return (viewRefs !== null && viewRefs[index]) || null;
  }

  override get length(): number {
    return this._lContainer.length - CONTAINER_HEADER_OFFSET;
  }

  override createEmbeddedView<C>(
    templateRef: TemplateRef<C>,
    context?: C,
    options?: {
      index?: number;
      injector?: Injector;
    },
  ): EmbeddedViewRef<C>;
  override createEmbeddedView<C>(
    templateRef: TemplateRef<C>,
    context?: C,
    index?: number,
  ): EmbeddedViewRef<C>;
  override createEmbeddedView<C>(
    templateRef: TemplateRef<C>,
    context?: C,
    indexOrOptions?:
      | number
      | {
          index?: number;
          injector?: Injector;
        },
  ): EmbeddedViewRef<C> {
    let index: number | undefined;
    let injector: Injector | undefined;

    if (typeof indexOrOptions === 'number') {
      index = indexOrOptions;
    } else if (indexOrOptions != null) {
      index = indexOrOptions.index;
      injector = indexOrOptions.injector;
    }

    const dehydratedView = findMatchingDehydratedView(this._lContainer, templateRef.ssrId);
    const viewRef = templateRef.createEmbeddedViewImpl(
      context || <any>{},
      injector,
      dehydratedView,
    );
    this.insertImpl(viewRef, index, shouldAddViewToDom(this._hostTNode, dehydratedView));
    return viewRef;
  }

  override createComponent<C>(
    componentType: Type<C>,
    options?: {
      index?: number;
      injector?: Injector;
      projectableNodes?: Node[][];
      ngModuleRef?: NgModuleRef<unknown>;
      directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[];
      bindings?: Binding[];
    },
  ): ComponentRef<C>;
  /**
   * @deprecated Angular는 더 이상 컴포넌트 팩토리를 사용하여 동적으로 컴포넌트를 생성할 필요가 없습니다.
   *     컴포넌트 클래스를 직접 전달할 수 있는 `createComponent` 메소드의 다른 시그니처를 사용하십시오.
   */
  override createComponent<C>(
    componentFactory: ComponentFactory<C>,
    index?: number | undefined,
    injector?: Injector | undefined,
    projectableNodes?: any[][] | undefined,
    environmentInjector?: EnvironmentInjector | NgModuleRef<any> | undefined,
    directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[],
    bindings?: Binding[],
  ): ComponentRef<C>;
  override createComponent<C>(
    componentFactoryOrType: ComponentFactory<C> | Type<C>,
    indexOrOptions?:
      | number
      | undefined
      | {
          index?: number;
          injector?: Injector;
          ngModuleRef?: NgModuleRef<unknown>;
          environmentInjector?: EnvironmentInjector | NgModuleRef<unknown>;
          projectableNodes?: Node[][];
          directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[];
          bindings?: Binding[];
        },
    injector?: Injector | undefined,
    projectableNodes?: any[][] | undefined,
    environmentInjector?: EnvironmentInjector | NgModuleRef<any> | undefined,
    directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[],
    bindings?: Binding[],
  ): ComponentRef<C> {
    const isComponentFactory = componentFactoryOrType && !isType(componentFactoryOrType);
    let index: number | undefined;

    // 이 함수는 2개의 시그니처를 지원하며, 두 가지 옵션을 모두 처리해야 합니다:
    //   1. 첫 번째 인자가 컴포넌트 유형입니다. 이 시그니처는 추가
    //      옵션이 객체 형식으로 제공되어야 합니다(더 인체공학적인 옵션).
    //   2. 첫 번째 인자가 컴포넌트 팩토리입니다. 이 경우 추가 옵션은
    //      위치 인수로 나타납니다. 이 시그니처는 덜 인체공학적이며 곧 사용 중단됩니다.
    if (isComponentFactory) {
      if (ngDevMode) {
        assertEqual(
          typeof indexOrOptions !== 'object',
          true,
          '첫 번째 인자로 컴포넌트 팩토리가 제공되고 두 번째 인자로 옵션 객체가 제공된 것 같습니다. 이 인수 조합은 호환되지 않습니다. 첫 번째 인수를 컴포넌트 유형으로 변경하거나 두 번째 인수를 새 컴포넌트의 호스트 뷰를 삽입할 인덱스를 나타내는 숫자로 변경할 수 있습니다.',
        );
      }
      index = indexOrOptions as number | undefined;
    } else {
      if (ngDevMode) {
        assertDefined(
          getComponentDef(componentFactoryOrType),
          '제공된 컴포넌트 클래스에는 컴포넌트 정의가 포함되어 있지 않습니다. 제공된 클래스에 @Component 장식자가 있는지 확인하십시오.',
        );
        assertEqual(
          typeof indexOrOptions !== 'number',
          true,
          '첫 번째 인자로 컴포넌트 유형이 제공되고 두 번째 인자로 새 컴포넌트의 호스트 뷰를 삽입할 인덱스를 나타내는 숫자가 제공된 것 같습니다. 이 인수 조합은 호환되지 않습니다. 두 번째 인수로 대신 객체를 사용하십시오.',
        );
      }
      const options = (indexOrOptions || {}) as {
        index?: number;
        injector?: Injector;
        ngModuleRef?: NgModuleRef<unknown>;
        environmentInjector?: EnvironmentInjector | NgModuleRef<unknown>;
        projectableNodes?: Node[][];
        directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[];
        bindings?: Binding[];
      };
      if (ngDevMode && options.environmentInjector && options.ngModuleRef) {
        throwError(
          'createComponent()에 environmentInjector와 ngModuleRef 옵션을 모두 전달할 수 없습니다.',
        );
      }
      index = options.index;
      injector = options.injector;
      projectableNodes = options.projectableNodes;
      environmentInjector = options.environmentInjector || options.ngModuleRef;
      directives = options.directives;
      bindings = options.bindings;
    }

    const componentFactory: ComponentFactory<C> = isComponentFactory
      ? (componentFactoryOrType as ComponentFactory<C>)
      : new R3ComponentFactory(getComponentDef(componentFactoryOrType)!);
    const contextInjector = injector || this.parentInjector;

    // `NgModuleRef`가 명시적으로 제공되지 않은 경우, DI 트리에서 검색합니다.
    if (!environmentInjector && (componentFactory as any).ngModule == null) {
      // `ComponentFactory` 경우에는 이 논리를 진입하기가 매우 드물며,
      // `ComponentFactory`의 인스턴스가 `ComponentFactoryResolver`를 통해 해결되면
      // `ngModule` 필드를 갖게 된다고 기대합니다.
      // 일부 테스트 시나리오 및 일부 JIT 기반 사용 사례에서 가능할 수 있습니다.
      // 컴포넌트 팩토리의 경우, 이전 호환성을 유지하고 제공된 주입기를 먼저 사용한 다음,
      // 이 `ViewContainerRef` 인스턴스의 부모 주입기로 되돌립니다.
      //
      // 팩토리 없는 경우에는 모듈 주입기 트리와 연결을 설정하는 것이 중요합니다.
      // (NgModuleRef의 인스턴스를 검색하고 해당 주입기를 액세스하여),
      // 컴포넌트가 MgModules에서 제공하는 DI 토큰을 사용할 수 있도록 합니다.
      // 따라서 제공된 주입기에 의존할 수 없으며, DI 트리에서 분리될 수 있습니다.
      // (예: 부모 주입기를 지정하지 않고 `Injector.create`를 통해 생성되거나,
      // NgModule 외부 모듈 트리에 사용되는 NgModuleRef에서 주입기를 검색한 경우).
      // 대신, 우리는 항상 `ViewContainerRef`의 부모 주입기를 사용합니다.
      // 이는 일반적으로 DI 트리와 연결되어 있습니다.
      const _injector = isComponentFactory ? contextInjector : this.parentInjector;

      // 리팩터링하지 마십시오. 여기의 코드는 `injector.get(NgModuleRef, null) || undefined` 표현식을 가지고 있어
      // 내부 구글 앱에서 실패하게 보입니다. 이는 다음 내부 버그 문제에서 문서화되었습니다: go/b/142967802
      const result = _injector.get(EnvironmentInjector, null);
      if (result) {
        environmentInjector = result;
      }
    }

    const componentDef = getComponentDef(componentFactory.componentType ?? {});
    const dehydratedView = findMatchingDehydratedView(this._lContainer, componentDef?.id ?? null);
    const rNode = dehydratedView?.firstChild ?? null;
    const componentRef = componentFactory.create(
      contextInjector,
      projectableNodes,
      rNode,
      environmentInjector,
      directives,
      bindings,
    );
    this.insertImpl(
      componentRef.hostView,
      index,
      shouldAddViewToDom(this._hostTNode, dehydratedView),
    );
    return componentRef;
  }

  override insert(viewRef: ViewRef, index?: number): ViewRef {
    return this.insertImpl(viewRef, index, true);
  }

  private insertImpl(viewRef: ViewRef, index?: number, addToDOM?: boolean): ViewRef {
    const lView = (viewRef as R3ViewRef<any>)._lView!;

    if (ngDevMode && viewRef.destroyed) {
      throw new Error('파괴된 뷰를 ViewContainer에 삽입할 수 없습니다!');
    }

    if (viewAttachedToContainer(lView)) {
      // 뷰가 이미 첨부된 경우, 먼저 분리하여 참조를 적절히 정리합니다.

      const prevIdx = this.indexOf(viewRef);

      // 뷰가 이 컨테이너나 다른 컨테이너에 첨부되어 있을 수 있습니다.
      // 이러한 경우의 `prevIdx`는 다음과 같습니다:
      // 이 ViewContainerRef에 첨부된 뷰는 -1과 같음
      // 다른 ViewContainerRef에 첨부된 뷰는 >= 0
      if (prevIdx !== -1) {
        this.detach(prevIdx);
      } else {
        const prevLContainer = lView[PARENT] as LContainer;
        ngDevMode &&
          assertEqual(
            isLContainer(prevLContainer),
            true,
            '첨부된 뷰는 PARENT가 컨테이너를 가리켜야 합니다.',
          );

        // R3ViewContainerRef 인스턴스를 다시 생성해야 합니다.
        const prevVCRef = new R3ViewContainerRef(
          prevLContainer,
          prevLContainer[T_HOST] as TDirectiveHostNode,
          prevLContainer[PARENT],
        );

        prevVCRef.detach(prevVCRef.indexOf(viewRef));
      }
    }

    // LView를 LContainer에 추가하는 논리 작업
    const adjustedIdx = this._adjustIndex(index);
    const lContainer = this._lContainer;

    addLViewToLContainer(lContainer, lView, adjustedIdx, addToDOM);

    (viewRef as R3ViewRef<any>).attachToViewContainerRef();
    addToArray(getOrCreateViewRefs(lContainer), adjustedIdx, viewRef);

    return viewRef;
  }

  override move(viewRef: ViewRef, newIndex: number): ViewRef {
    if (ngDevMode && viewRef.destroyed) {
      throw new Error('파괴된 뷰를 ViewContainer에서 이동할 수 없습니다!');
    }
    return this.insert(viewRef, newIndex);
  }

  override indexOf(viewRef: ViewRef): number {
    const viewRefsArr = getViewRefs(this._lContainer);
    return viewRefsArr !== null ? viewRefsArr.indexOf(viewRef) : -1;
  }

  override remove(index?: number): void {
    const adjustedIdx = this._adjustIndex(index, -1);
    const detachedView = detachView(this._lContainer, adjustedIdx);

    if (detachedView) {
      // 뷰를 파괴하기 전에, 컨테이너의 `ViewRef` 목록에서 제거합니다.
      // 이렇게 하면 `destroyLView`를 호출하기 전에 뷰 컨테이너 길이가 업데이트됩니다.
      // (예: 호출된 메소드에서 자식 지시어의 OnDestroy 생명주기 후크가 호출될 수 있습니다.)
      removeFromArray(getOrCreateViewRefs(this._lContainer), adjustedIdx);
      destroyLView(detachedView[TVIEW], detachedView);
    }
  }

  override detach(index?: number): ViewRef | null {
    const adjustedIdx = this._adjustIndex(index, -1);
    const view = detachView(this._lContainer, adjustedIdx);

    const wasDetached =
      view && removeFromArray(getOrCreateViewRefs(this._lContainer), adjustedIdx) != null;
    return wasDetached ? new R3ViewRef(view!) : null;
  }

  private _adjustIndex(index?: number, shift: number = 0) {
    if (index == null) {
      return this.length + shift;
    }
    if (ngDevMode) {
      assertGreaterThan(index, -1, `ViewRef 인덱스는 양수여야 하며, ${index}를 얻었습니다.`);
      // +1은 끝에 삽입할 수 있도록 합법적입니다.
      assertLessThan(index, this.length + 1 + shift, '인덱스');
    }
    return index;
  }
};

function getViewRefs(lContainer: LContainer): ViewRef[] | null {
  return lContainer[VIEW_REFS] as ViewRef[];
}

function getOrCreateViewRefs(lContainer: LContainer): ViewRef[] {
  return (lContainer[VIEW_REFS] || (lContainer[VIEW_REFS] = [])) as ViewRef[];
}

/**
 * ViewContainerRef를 생성하고 주입기에 저장합니다.
 *
 * @param hostTNode ViewContainerRef를 요청하는 노드입니다.
 * @param hostLView 노드가 속한 뷰입니다.
 * @returns 사용할 ViewContainerRef 인스턴스입니다.
 */
export function createContainerRef(
  hostTNode: TElementNode | TContainerNode | TElementContainerNode,
  hostLView: LView,
): ViewContainerRef {
  ngDevMode && assertTNodeType(hostTNode, TNodeType.AnyContainer | TNodeType.AnyRNode);

  let lContainer: LContainer;
  const slotValue = hostLView[hostTNode.index];
  if (isLContainer(slotValue)) {
    // 호스트가 컨테이너인 경우, 새로운 LContainer를 생성할 필요가 없습니다.
    lContainer = slotValue;
  } else {
    // LContainer 앵커는 null이 될 수 없지만, 여기서는 임시로 설정하고
    // 이 함수의 나중에 실제 값을 업데이트합니다 (see
    // `_locateOrCreateAnchorNode`).
    lContainer = createLContainer(slotValue, hostLView, null!, hostTNode);
    hostLView[hostTNode.index] = lContainer;
    addToEndOfViewTree(hostLView, lContainer);
  }
  _locateOrCreateAnchorNode(lContainer, hostLView, hostTNode, slotValue);

  return new R3ViewContainerRef(lContainer, hostTNode, hostLView);
}

/**
 * 뷰 컨테이너의 앵커 역할을 하는 주석 노드를 생성하고 삽입합니다.
 *
 * 호스트가 일반 요소인 경우, 요소를 삽입할 때 사용되는 주석 노드를 수동으로 삽입해야 합니다.
 * 이 특정 경우에는 저수준 DOM 조작을 사용하여 삽입합니다.
 */
function insertAnchorNode(hostLView: LView, hostTNode: TNode): RComment {
  const renderer = hostLView[RENDERER];
  const commentNode = renderer.createComment(ngDevMode ? 'container' : '');

  const hostNative = getNativeByTNode(hostTNode, hostLView)!;
  const parentOfHostNative = renderer.parentNode(hostNative);
  nativeInsertBefore(
    renderer,
    parentOfHostNative!,
    commentNode,
    renderer.nextSibling(hostNative),
    false,
  );
  return commentNode;
}

let _locateOrCreateAnchorNode = createAnchorNode;
let _populateDehydratedViewsInLContainer: typeof populateDehydratedViewsInLContainerImpl = () =>
  false; // 기본적으로 noop

/**
 * 주어진 LContainer에 속한 탈수된 뷰를 검색하고
 * 이 정보를 `LContainer[DEHYDRATED_VIEWS]` 슬롯에 채웁니다.
 * 클라이언트 전용 모드로 실행될 때,
 * 이 함수는 noop입니다.
 *
 * @param lContainer 채워야 할 LContainer입니다.
 * @param tNode 해당 TNode입니다.
 * @param hostLView LContainer를 포함하는 LView입니다.
 * @returns 채우기 작업이 성공적으로 수행되었는지의 여부를 나타내는 부울 플래그입니다.
 * 채우기 작업은 이전에 완료되었거나, 클라이언트 전용 모드에서 렌더링되거나,
 * 이 콘텐츠가 스킵 수화 섹션에 위치한 경우에 실패할 수 있습니다.
 */
export function populateDehydratedViewsInLContainer(
  lContainer: LContainer,
  tNode: TNode,
  hostLView: LView,
): boolean {
  return _populateDehydratedViewsInLContainer(lContainer, tNode, hostLView);
}

/**
 * 일반 생성 모드: 앵커가 생성되고
 * `lContainer[NATIVE]` 슬롯에 할당됩니다.
 */
function createAnchorNode(
  lContainer: LContainer,
  hostLView: LView,
  hostTNode: TNode,
  slotValue: any,
) {
  // 이미 네이티브 요소(앵커)가 설정되어 있으면 반환합니다.
  if (lContainer[NATIVE]) return;

  let commentNode: RComment;
  // 호스트가 요소 컨테이너인 경우, 네이티브 호스트 요소는 댓글을 할당되어 있으며,
  // 그 댓글을 새 LContainer의 앵커 요소로 재사용할 수 있습니다.
  // 해당 주석 노드는 이미 DOM 구조의 일부이므로 다시 추가할 필요가 없습니다.
  if (hostTNode.type & TNodeType.ElementContainer) {
    commentNode = unwrapRNode(slotValue) as RComment;
  } else {
    commentNode = insertAnchorNode(hostLView, hostTNode);
  }
  lContainer[NATIVE] = commentNode;
}

/**
 * 이 컨테이너의 모든 탈수된 뷰를 검색하고
 * `lContainer[DEHYDRATED_VIEWS]` 슬롯에 저장합니다.
 *
 * @returns 폴링 작업이 성공적으로 수행되었는지의 여부를 나타내는 부울 플래그입니다.
 * 작업이 완료된 경우, 클라이언트 전용 모드에서 렌더링되고 있거나,
 * 이 콘텐츠가 스킵 수화 섹션에 위치한 경우에 실패할 수 있습니다.
 */
function populateDehydratedViewsInLContainerImpl(
  lContainer: LContainer,
  tNode: TNode,
  hostLView: LView,
): boolean {
  // 이미 네이티브 요소(앵커)가 설정되어 있고 탈수된 뷰 검색이 이루어졌습니다
  // (그래서 `lContainer[DEHYDRATED_VIEWS]`가 null이 아닙니다), 일찍 종료됩니다.
  if (lContainer[NATIVE] && lContainer[DEHYDRATED_VIEWS]) {
    return true;
  }

  const hydrationInfo = hostLView[HYDRATION];
  const noOffsetIndex = tNode.index - HEADER_OFFSET;
  const isNodeCreationMode =
    !hydrationInfo ||
    isInSkipHydrationBlock(tNode) ||
    isDisconnectedNode(hydrationInfo, noOffsetIndex);

  // 일반 생성 모드.
  if (isNodeCreationMode) {
    return false;
  }

  // 수화 모드, DOM에서 앵커 노드 및 탈수된 뷰를 검색합니다.
  const currentRNode: RNode | null = getSegmentHead(hydrationInfo, noOffsetIndex);

  const serializedViews = hydrationInfo.data[CONTAINERS]?.[noOffsetIndex];
  ngDevMode &&
    assertDefined(
      serializedViews,
      '예상치 못한 상태: 주어진 TNode에 대한 수화 정보가 없습니다. ' +
        'view 컨테이너를 나타내고 있습니다.',
    );

  const [commentNode, dehydratedViews] = locateDehydratedViewsInContainer(
    currentRNode!,
    serializedViews!,
  );

  if (ngDevMode) {
    validateMatchingNode(commentNode, Node.COMMENT_NODE, null, hostLView, tNode, true);
    // 이 노드가 이미 클레임된 경우 예외를 발생시키지 않습니다(따라서 두 번째
    // 인수로 `false`를 전달합니다). 이 컨테이너가 `<ng-template>`을 기반으로 생성된 경우,
    // 주석 노드는 `template` 지시문으로부터 이미 클레임된 상태일 수 있습니다. 요소가
    // 앵커 역할을 하는 경우 (예: <div #vcRef>), 별도의 주석 노드가 생성/위치할 수 있으므로
    // 이를 여기서 클레임할 필요가 있습니다.
    markRNodeAsClaimedByHydration(commentNode, false);
  }

  lContainer[NATIVE] = commentNode as RComment;
  lContainer[DEHYDRATED_VIEWS] = dehydratedViews;

  return true;
}

function locateOrCreateAnchorNode(
  lContainer: LContainer,
  hostLView: LView,
  hostTNode: TNode,
  slotValue: any,
): void {
  if (!_populateDehydratedViewsInLContainer(lContainer, hostTNode, hostLView)) {
    // 탈수된 뷰 채우기 작업이 `false`를 반환했으며, 이는
    // 클라이언트 전용 모드에서 실행 중임을 나타냅니다. 이 컨테이너를 위한
    // 주석 요소가 생성되어야 합니다.
    createAnchorNode(lContainer, hostLView, hostTNode, slotValue);
  }
}

export function enableLocateOrCreateContainerRefImpl() {
  _locateOrCreateAnchorNode = locateOrCreateAnchorNode;
  _populateDehydratedViewsInLContainer = populateDehydratedViewsInLContainerImpl;
}
