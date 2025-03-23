/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer} from '@angular/core/primitives/signals';

import {ChangeDetectorRef} from '../change_detection/change_detector_ref';
import {
  ChangeDetectionScheduler,
  NotificationSource,
} from '../change_detection/scheduling/zoneless_scheduling';
import {Injector} from '../di/injector';
import {EnvironmentInjector} from '../di/r3_injector';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {Type, Writable} from '../interface/type';
import {
  ComponentFactory as AbstractComponentFactory,
  ComponentRef as AbstractComponentRef,
} from '../linker/component_factory';
import {ComponentFactoryResolver as AbstractComponentFactoryResolver} from '../linker/component_factory_resolver';
import {createElementRef, ElementRef} from '../linker/element_ref';
import {NgModuleRef} from '../linker/ng_module_factory';
import {RendererFactory2} from '../render/api';
import {Sanitizer} from '../sanitization/sanitizer';

import {assertComponentType} from './assert';
import {attachPatchData} from './context_discovery';
import {getComponentDef, getDirectiveDef} from './def_getters';
import {depsTracker} from './deps_tracker/deps_tracker';
import {NodeInjector} from './di';
import {reportUnknownPropertyError} from './instructions/element_validation';
import {markViewDirty} from './instructions/mark_view_dirty';
import {renderView} from './instructions/render';
import {
  createDirectivesInstances,
  locateHostElement,
  setAllInputsForProperty,
} from './instructions/shared';
import {ComponentDef, ComponentTemplate, DirectiveDef, RenderFlags} from './interfaces/definition';
import {InputFlags} from './interfaces/input_flags';
import {TContainerNode, TElementContainerNode, TElementNode, TNode} from './interfaces/node';
import {RElement, RNode} from './interfaces/renderer_dom';
import {
  CONTEXT,
  HEADER_OFFSET,
  LView,
  LViewEnvironment,
  LViewFlags,
  TView,
  TVIEW,
  TViewType,
} from './interfaces/view';
import {MATH_ML_NAMESPACE, SVG_NAMESPACE} from './namespaces';

import {retrieveHydrationInfo} from '../hydration/utils';
import {ChainedInjector} from './chained_injector';
import {createElementNode, setupStaticAttributes} from './dom_node_manipulation';
import {unregisterLView} from './interfaces/lview_tracking';
import {Renderer} from './interfaces/renderer';
import {
  extractAttrsAndClassesFromSelector,
  stringifyCSSSelectorList,
} from './node_selector_matcher';
import {profiler} from './profiler';
import {ProfilerEvent} from './profiler_types';
import {executeContentQueries} from './queries/query_execution';
import {enterView, leaveView} from './state';
import {debugStringifyTypeForError, stringifyForError} from './util/stringify_utils';
import {getComponentLViewByIndex, getTNode} from './util/view_utils';
import {elementEndFirstCreatePass, elementStartFirstCreatePass} from './view/elements';
import {ViewRef} from './view_ref';
import {createLView, createTView, getInitialLViewFlagsFromDef} from './view/construction';
import {BINDING, Binding, DirectiveWithBindings} from './dynamic_bindings';

export class ComponentFactoryResolver extends AbstractComponentFactoryResolver {
  /**
   * @param ngModule 모든 해결된 팩토리가 바인딩되는 NgModuleRef입니다.
   */
  constructor(private ngModule?: NgModuleRef<any>) {
    super();
  }

  override resolveComponentFactory<T>(component: Type<T>): AbstractComponentFactory<T> {
    ngDevMode && assertComponentType(component);
    const componentDef = getComponentDef(component)!;
    return new ComponentFactory(componentDef, this.ngModule);
  }
}

function toInputRefArray<T>(map: DirectiveDef<T>['inputs']): ComponentFactory<T>['inputs'] {
  return Object.keys(map).map((name) => {
    const [propName, flags, transform] = map[name];
    const inputData: ComponentFactory<T>['inputs'][0] = {
      propName: propName,
      templateName: name,
      isSignal: (flags & InputFlags.SignalBased) !== 0,
    };
    if (transform) {
      inputData.transform = transform;
    }
    return inputData;
  });
}

function toOutputRefArray<T>(map: DirectiveDef<T>['outputs']): ComponentFactory<T>['outputs'] {
  return Object.keys(map).map((name) => ({propName: map[name], templateName: name}));
}

function verifyNotAnOrphanComponent(componentDef: ComponentDef<unknown>) {
  // TODO(pk): ngDevMode를 검증하는 assert 생성
  if (
    (typeof ngJitMode === 'undefined' || ngJitMode) &&
    componentDef.debugInfo?.forbidOrphanRendering
  ) {
    if (depsTracker.isOrphanComponent(componentDef.type)) {
      throw new RuntimeError(
        RuntimeErrorCode.RUNTIME_DEPS_ORPHAN_COMPONENT,
        `고아 컴포넌트 발견! ${debugStringifyTypeForError(
          componentDef.type,
        )}를 렌더링하기 전에 선언한 NgModule을 먼저 로드해야 합니다. 이 컴포넌트를 독립적으로 만들어 이 오류를 피하는 것이 좋습니다. 현재 불가능한 경우, 적절한 NgModule에 컴포넌트의 NgModule를 가져오거나 이 컴포넌트를 렌더링하려는 독립형 컴포넌트를 가져오세요. 이것이 지연된 가져오기인 경우, NgModule을 지연 로드하고 해당 모듈 주입기를 사용하세요.`,
      );
    }
  }
}

function createRootViewInjector(
  componentDef: ComponentDef<unknown>,
  environmentInjector: EnvironmentInjector | NgModuleRef<any> | undefined,
  injector: Injector,
): Injector {
  let realEnvironmentInjector =
    environmentInjector instanceof EnvironmentInjector
      ? environmentInjector
      : environmentInjector?.injector;

  if (realEnvironmentInjector && componentDef.getStandaloneInjector !== null) {
    realEnvironmentInjector =
      componentDef.getStandaloneInjector(realEnvironmentInjector) || realEnvironmentInjector;
  }

  const rootViewInjector = realEnvironmentInjector
    ? new ChainedInjector(injector, realEnvironmentInjector)
    : injector;
  return rootViewInjector;
}

function createRootLViewEnvironment(rootLViewInjector: Injector): LViewEnvironment {
  const rendererFactory = rootLViewInjector.get(RendererFactory2, null);
  if (rendererFactory === null) {
    throw new RuntimeError(
      RuntimeErrorCode.RENDERER_NOT_FOUND,
      ngDevMode &&
        'Angular는 렌더러 (RendererFactory2)를 주입할 수 없었습니다. ' +
          '이는 DI 계층이 손상되었기 때문일 수 있습니다. ' +
          '이 컴포넌트를 생성하는 데 사용되는 모든 주입기가 올바른 부모를 가지고 있는지 확인하세요.',
    );
  }

  const sanitizer = rootLViewInjector.get(Sanitizer, null);
  const changeDetectionScheduler = rootLViewInjector.get(ChangeDetectionScheduler, null);

  return {
    rendererFactory,
    sanitizer,
    changeDetectionScheduler,
  };
}

function createHostElement(componentDef: ComponentDef<unknown>, render: Renderer): RElement {
  // 이 컴포넌트가 동적으로 생성될 때 호스트 요소를 생성하는 데 사용되는 태그 이름 결정
  // 선택기에서 태그 이름을 지정하지 않은 경우 기본값으로 'div'로 설정합니다.
  const tagName = ((componentDef.selectors[0][0] as string) || 'div').toLowerCase();
  const namespace =
    tagName === 'svg' ? SVG_NAMESPACE : tagName === 'math' ? MATH_ML_NAMESPACE : null;
  return createElementNode(render, tagName, namespace);
}

/**
 * ComponentFactory 인터페이스 구현.
 */
export class ComponentFactory<T> extends AbstractComponentFactory<T> {
  override selector: string;
  override componentType: Type<any>;
  override ngContentSelectors: string[];
  isBoundToModule: boolean;
  private cachedInputs:
    | {
        propName: string;
        templateName: string;
        isSignal: boolean;
        transform?: (value: any) => any;
      }[]
    | null = null;
  private cachedOutputs: {propName: string; templateName: string}[] | null = null;

  override get inputs(): {
    propName: string;
    templateName: string;
    isSignal: boolean;
    transform?: (value: any) => any;
  }[] {
    this.cachedInputs ??= toInputRefArray(this.componentDef.inputs);
    return this.cachedInputs;
  }

  override get outputs(): {propName: string; templateName: string}[] {
    this.cachedOutputs ??= toOutputRefArray(this.componentDef.outputs);
    return this.cachedOutputs;
  }

  /**
   * @param componentDef 컴포넌트 정의.
   * @param ngModule 팩토리가 바인딩되는 NgModuleRef.
   */
  constructor(
    private componentDef: ComponentDef<any>,
    private ngModule?: NgModuleRef<any>,
  ) {
    super();
    this.componentType = componentDef.type;
    this.selector = stringifyCSSSelectorList(componentDef.selectors);
    this.ngContentSelectors = componentDef.ngContentSelectors ?? [];
    this.isBoundToModule = !!ngModule;
  }

  override create(
    injector: Injector,
    projectableNodes?: any[][] | undefined,
    rootSelectorOrNode?: any,
    environmentInjector?: NgModuleRef<any> | EnvironmentInjector | undefined,
    directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[],
    componentBindings?: Binding[],
  ): AbstractComponentRef<T> {
    profiler(ProfilerEvent.DynamicComponentStart);

    const prevConsumer = setActiveConsumer(null);
    try {
      const cmpDef = this.componentDef;
      ngDevMode && verifyNotAnOrphanComponent(cmpDef);

      const rootTView = createRootTView(rootSelectorOrNode, cmpDef, componentBindings, directives);
      const rootViewInjector = createRootViewInjector(
        cmpDef,
        environmentInjector || this.ngModule,
        injector,
      );

      const environment = createRootLViewEnvironment(rootViewInjector);
      const hostRenderer = environment.rendererFactory.createRenderer(null, cmpDef);
      const hostElement = rootSelectorOrNode
        ? locateHostElement(
            hostRenderer,
            rootSelectorOrNode,
            cmpDef.encapsulation,
            rootViewInjector,
          )
        : createHostElement(cmpDef, hostRenderer);
      const hasInputBindings =
        componentBindings?.some(isInputBinding) ||
        directives?.some((d) => typeof d !== 'function' && d.bindings.some(isInputBinding));

      const rootLView = createLView<T>(
        null,
        rootTView,
        null,
        LViewFlags.IsRoot | getInitialLViewFlagsFromDef(cmpDef),
        null,
        null,
        environment,
        hostRenderer,
        rootViewInjector,
        null,
        retrieveHydrationInfo(hostElement, rootViewInjector, true /* isRootView */),
      );

      const directivesToApply: DirectiveDef<unknown>[] = [this.componentDef];

      if (directives) {
        for (const directive of directives) {
          const directiveType = typeof directive === 'function' ? directive : directive.type;
          const directiveDef = getDirectiveDef(directiveType, true);

          if (ngDevMode && !directiveDef.standalone) {
            throw new RuntimeError(
              RuntimeErrorCode.TYPE_IS_NOT_STANDALONE,
              `The ${stringifyForError(directiveType)} directive must be standalone in ` +
                `order to be applied to a dynamically-created component.`,
            );
          }

          directivesToApply.push(directiveDef);
        }
      }

      rootLView[HEADER_OFFSET] = hostElement;

      // rootView는 부팅할 때 부모입니다.
      // TODO(misko): 여기서 실제로 뷰에 들어가고 있지만 필요하지 않은 것처럼 보입니다.
      // `renderView`가 그렇게 합니다. 그러나 코드가 작성된 방식으로는 필요합니다.
      // `createRootComponentView`와 `createRootComponent` 모두 전역 상태를 읽기 때문입니다.
      // 이러한 문제를 수정하면 이를 제거할 수 있습니다.
      enterView(rootLView);

      let componentView: LView | null = null;

      try {
        const hostTNode = elementStartFirstCreatePass(
          HEADER_OFFSET,
          rootTView,
          rootLView,
          '#host',
          () => directivesToApply,
          true,
          0,
        );

        // ---- 요소 지시문

        // TODO(crisbeto): 실제로 `hostElement`는 항상 정의되어야 하지만
        // 렌더러가 모의되는 일부 테스트에서 `undefined`가 반환됩니다.
        // 이 검사가 제거될 수 있도록 테스트를 업데이트해야 합니다.
        if (hostElement) {
          setupStaticAttributes(hostRenderer, hostElement, hostTNode);
          attachPatchData(hostElement, rootLView);
        }

        // TODO(pk): 이 로직은 노드에 지시문이 있을 수 있는 지시문 코드와 유사합니다.
        createDirectivesInstances(rootTView, rootLView, hostTNode);
        executeContentQueries(rootTView, hostTNode, rootLView);

        elementEndFirstCreatePass(rootTView, hostTNode);

        if (projectableNodes !== undefined) {
          projectNodes(hostTNode, this.ngContentSelectors, projectableNodes);
        }

        componentView = getComponentLViewByIndex(hostTNode.index, rootLView);

        // TODO(pk): 왜 이 로직이 필요합니까?
        rootLView[CONTEXT] = componentView[CONTEXT] as T;

        renderView(rootTView, rootLView, null);
      } catch (e) {
        // 생성에 실패하면 뷰 추적을 중지합니다.
        // 소비자가 이를 참조 해제할 방법이 없기 때문입니다.
        if (componentView !== null) {
          unregisterLView(componentView);
        }
        unregisterLView(rootLView);
        throw e;
      } finally {
        profiler(ProfilerEvent.DynamicComponentEnd);
        leaveView();
      }

      return new ComponentRef(this.componentType, rootLView, !!hasInputBindings);
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }
}

function createRootTView(
  rootSelectorOrNode: any,
  componentDef: ComponentDef<unknown>,
  componentBindings: Binding[] | undefined,
  directives: (Type<unknown> | DirectiveWithBindings<unknown>)[] | undefined,
): TView {
  const tAttributes = rootSelectorOrNode
    ? ['ng-version', '0.0.0-PLACEHOLDER']
    : // 첫 번째 선택기에서 속성과 클래스를 추출하여 VE 동작에 맞춥니다.
      extractAttrsAndClassesFromSelector(componentDef.selectors[0]);
  let creationBindings: Binding[] | null = null;
  let updateBindings: Binding[] | null = null;
  let varsToAllocate = 0;

  if (componentBindings) {
    for (const binding of componentBindings) {
      varsToAllocate += binding[BINDING].requiredVars;

      if (binding.create) {
        (binding as Writable<Binding>).target = componentDef;
        (creationBindings ??= []).push(binding);
      }

      if (binding.update) {
        (binding as Writable<Binding>).target = componentDef;
        (updateBindings ??= []).push(binding);
      }
    }
  }

  if (directives) {
    for (const directive of directives) {
      if (typeof directive !== 'function') {
        const def: DirectiveDef<unknown> = getDirectiveDef(directive.type, true);

        for (const binding of directive.bindings) {
          varsToAllocate += binding[BINDING].requiredVars;

          if (binding.create) {
            (binding as Writable<Binding>).target = def;
            (creationBindings ??= []).push(binding);
          }

          if (binding.update) {
            (binding as Writable<Binding>).target = def;
            (updateBindings ??= []).push(binding);
          }
        }
      }
    }
  }

  const rootTView = createTView(
    TViewType.Root,
    null,
    getRootTViewTemplate(creationBindings, updateBindings),
    1,
    varsToAllocate,
    null,
    null,
    null,
    null,
    [tAttributes],
    null,
  );

  return rootTView;
}

function getRootTViewTemplate(
  creationBindings: Binding[] | null,
  updateBindings: Binding[] | null,
): ComponentTemplate<unknown> | null {
  if (!creationBindings && !updateBindings) {
    return null;
  }

  return (flags) => {
    if (flags & RenderFlags.Create && creationBindings) {
      for (const binding of creationBindings) {
        binding.create!();
      }
    }

    if (flags & RenderFlags.Update && updateBindings) {
      for (const binding of updateBindings) {
        binding.update!();
      }
    }
  };
}

function isInputBinding(binding: Binding): boolean {
  const kind = binding[BINDING].kind;
  return kind === 'input' || kind === 'twoWay';
}

/**
 * {@link ComponentFactory}를 통해 생성된 컴포넌트의 인스턴스를 나타냅니다.
 *
 * `ComponentRef`는 컴포넌트 인스턴스와 관련된 다른 객체에 접근할 수 있도록 하며,
 * {@link #destroy} 메서드를 통해 컴포넌트 인스턴스를 파괴할 수 있습니다.
 *
 */
export class ComponentRef<T> extends AbstractComponentRef<T> {
  override instance: T;
  override hostView: ViewRef<T>;
  override changeDetectorRef: ChangeDetectorRef;
  override componentType: Type<T>;
  override location: ElementRef;
  private previousInputValues: Map<string, unknown> | null = null;
  private _tNode: TElementNode | TContainerNode | TElementContainerNode;

  constructor(
    componentType: Type<T>,
    private readonly _rootLView: LView,
    private readonly _hasInputBindings: boolean,
  ) {
    super();
    this._tNode = getTNode(_rootLView[TVIEW], HEADER_OFFSET) as TElementNode;
    this.location = createElementRef(this._tNode, _rootLView);
    this.instance = getComponentLViewByIndex(this._tNode.index, _rootLView)[CONTEXT] as T;
    this.hostView = this.changeDetectorRef = new ViewRef<T>(
      _rootLView,
      undefined /* _cdRefInjectingView */,
    );
    this.componentType = componentType;
  }

  override setInput(name: string, value: unknown): void {
    if (this._hasInputBindings && ngDevMode) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_SET_INPUT_CALL,
        '입력 바인딩 또는 양방향 바인딩 함수를 사용 중인 컴포넌트에서 `setInput`을 호출할 수 없습니다.',
      );
    }

    const tNode = this._tNode;
    this.previousInputValues ??= new Map();
    // 마지막 값과 동일한 경우 입력을 설정하지 않습니다.
    // 이 동작은 템플릿에서 입력을 바인딩할 때 `bindingUpdated`와 일치합니다.
    if (
      this.previousInputValues.has(name) &&
      Object.is(this.previousInputValues.get(name), value)
    ) {
      return;
    }

    const lView = this._rootLView;
    const hasSetInput = setAllInputsForProperty(tNode, lView[TVIEW], lView, name, value);
    this.previousInputValues.set(name, value);
    const childComponentLView = getComponentLViewByIndex(tNode.index, lView);
    markViewDirty(childComponentLView, NotificationSource.SetInput);

    if (ngDevMode && !hasSetInput) {
      const cmpNameForError = stringifyForError(this.componentType);
      let message = ` '${cmpNameForError}' 컴포넌트의 '${name}' 입력 값 설정할 수 없습니다. `;
      message += ` '${name}' 속성이 @Input()로 주석 처리되었는지 또는 매핑된 @Input('${name}')가 존재하는지 확인하세요.`;
      reportUnknownPropertyError(message);
    }
  }

  override get injector(): Injector {
    return new NodeInjector(this._tNode, this._rootLView);
  }

  override destroy(): void {
    this.hostView.destroy();
  }

  override onDestroy(callback: () => void): void {
    this.hostView.onDestroy(callback);
  }
}

/** 루트 컴포넌트를 만들 때 지정된 `projectableNodes`를 투영합니다. */
function projectNodes(
  tNode: TElementNode,
  ngContentSelectors: string[],
  projectableNodes: any[][],
) {
  const projection: (TNode | RNode[] | null)[] = (tNode.projection = []);
  for (let i = 0; i < ngContentSelectors.length; i++) {
    const nodesforSlot = projectableNodes[i];
    // 투영 가능한 노드는 배열의 배열 또는 반복 가능한 배열로 전달될 수 있습니다.(ngUpgrade 경우).
    // 여기서 전달된 데이터 구조를 배열의 배열로 정규화하여 이후 복잡한 검사를 피합니다.
    // 또한 전달된 투영 가능한 노드의 길이를 정규화하여 컴포넌트에 의해 정의된 <ng-container> 슬롯 수와 일치시킵니다.
    projection.push(nodesforSlot != null && nodesforSlot.length ? Array.from(nodesforSlot) : null);
  }
}
