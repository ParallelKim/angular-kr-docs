/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {resolveForwardRef} from '../di/forward_ref';
import {ClassProvider, Provider} from '../di/interface/provider';
import {isClassProvider, isTypeProvider, SingleProvider} from '../di/provider_collection';
import {providerToFactory} from '../di/r3_injector';
import {assertDefined} from '../util/assert';

import {emitProviderConfiguredEvent, runInInjectorProfilerContext} from './debug/injector_profiler';
import {
  diPublicInInjector,
  getNodeInjectable,
  getOrCreateNodeInjectorForNode,
  NodeInjector,
} from './di';
import {ɵɵdirectiveInject} from './instructions/all';
import {DirectiveDef} from './interfaces/definition';
import {NodeInjectorFactory} from './interfaces/injector';
import {
  TContainerNode,
  TDirectiveHostNode,
  TElementContainerNode,
  TElementNode,
  TNodeProviderIndexes,
} from './interfaces/node';
import {isComponentDef} from './interfaces/type_checks';
import {DestroyHookData, LView, TData, TVIEW, TView} from './interfaces/view';
import {getCurrentTNode, getLView, getTView} from './state';

/**
 * DirectiveDef에 정의된 프로바이더를 해결합니다.
 *
 * 토큰과 팩토리를 각각의 배열에 삽입할 때, 우리는 이 메소드가 먼저 컴포넌트를 위해 호출되고(있는 경우),
 * 이후 같은 노드의 다른 디렉티브를 위해 호출된다고 가정할 수 있습니다.
 * 결과적으로 프로바이더는 항상 다음과 같은 순서로 처리됩니다:
 * 1) 컴포넌트의 뷰 프로바이더
 * 2) 컴포넌트의 프로바이더
 * 3) 다른 디렉티브의 프로바이더
 * 이는 뷰의 인젝터블 배열 구조와 일치합니다 (각 노드마다).
 * 따라서 토큰과 팩토리는 배열의 끝에 추가될 수 있으며,
 * 멀티 프로바이더의 경우에만 예외가 존재합니다.
 *
 * @param def 디렉티브 정의
 * @param providers: `providers` 배열.
 * @param viewProviders: `viewProviders` 배열.
 */
export function providersResolver<T>(
  def: DirectiveDef<T>,
  providers: Provider[],
  viewProviders: Provider[],
): void {
  const tView = getTView();
  if (tView.firstCreatePass) {
    const isComponent = isComponentDef(def);

    // 뷰 프로바이더 목록이 먼저 처리되며, 플래그가 업데이트됩니다.
    resolveProvider(viewProviders, tView.data, tView.blueprint, isComponent, true);

    // 그런 다음 프로바이더 목록이 처리되며, 플래그가 업데이트됩니다.
    resolveProvider(providers, tView.data, tView.blueprint, isComponent, false);
  }
}

/**
 * 프로바이더를 해결하고 DI 시스템에 게시합니다.
 */
function resolveProvider(
  provider: Provider,
  tInjectables: TData,
  lInjectablesBlueprint: NodeInjectorFactory[],
  isComponent: boolean,
  isViewProvider: boolean,
): void {
  provider = resolveForwardRef(provider);
  if (Array.isArray(provider)) {
    // 'resolveProvider'를 재귀적으로 호출합니다.
    // 이 경우 재귀가 허용되는 이유는 초기 상태 복제를 구현한 후
    // 이 코드가 핫 패스에 있지 않기 때문입니다.
    for (let i = 0; i < provider.length; i++) {
      resolveProvider(
        provider[i],
        tInjectables,
        lInjectablesBlueprint,
        isComponent,
        isViewProvider,
      );
    }
  } else {
    const tView = getTView();
    const lView = getLView();
    const tNode = getCurrentTNode()!;
    let token: any = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);

    const providerFactory = providerToFactory(provider);
    if (ngDevMode) {
      const injector = new NodeInjector(
        tNode as TElementNode | TContainerNode | TElementContainerNode,
        lView,
      );
      runInInjectorProfilerContext(injector, token, () => {
        emitProviderConfiguredEvent(provider as SingleProvider, isViewProvider);
      });
    }

    const beginIndex = tNode.providerIndexes & TNodeProviderIndexes.ProvidersStartIndexMask;
    const endIndex = tNode.directiveStart;
    const cptViewProvidersCount =
      tNode.providerIndexes >> TNodeProviderIndexes.CptViewProvidersCountShift;

    if (isTypeProvider(provider) || !provider.multi) {
      // 단일 프로바이더의 경우: 팩토리가 즉시 생성되고 추가됩니다.
      const factory = new NodeInjectorFactory(providerFactory, isViewProvider, ɵɵdirectiveInject);
      const existingFactoryIndex = indexOf(
        token,
        tInjectables,
        isViewProvider ? beginIndex : beginIndex + cptViewProvidersCount,
        endIndex,
      );
      if (existingFactoryIndex === -1) {
        diPublicInInjector(
          getOrCreateNodeInjectorForNode(
            tNode as TElementNode | TContainerNode | TElementContainerNode,
            lView,
          ),
          tView,
          token,
        );
        registerDestroyHooksIfSupported(tView, provider, tInjectables.length);
        tInjectables.push(token);
        tNode.directiveStart++;
        tNode.directiveEnd++;
        if (isViewProvider) {
          tNode.providerIndexes += TNodeProviderIndexes.CptViewProvidersCountShifter;
        }
        lInjectablesBlueprint.push(factory);
        lView.push(factory);
      } else {
        lInjectablesBlueprint[existingFactoryIndex] = factory;
        lView[existingFactoryIndex] = factory;
      }
    } else {
      // 멀티 프로바이더의 경우:
      // 모든 값을 집계할 멀티 팩토리를 생성합니다.
      // 이러한 팩토리의 출력은 콘텐츠 또는 뷰 인젝션에 따라 달라지므로,
      // 서로 연결된 두 개의 팩토리를 생성합니다.
      //
      // 첫 번째(뷰 프로바이더에 대한)는 항상 인젝터블 배열의 첫 번째 블록에 있고,
      // 두 번째(프로바이더에 대한)는 항상 두 번째 블록에 있습니다.
      // 이는 뷰 프로바이더가 더 높은 우선 순위를 가지므로 중요합니다. 멀티 토큰을 조회할 때
      // 뷰 프로바이더가 먼저 발견되어야 합니다.
      // 디렉티브 블록(세 번째 블록) 내에 멀티 팩토리가 존재할 수는 없습니다.
      //
      // 멀티 프로바이더를 처리하는 알고리즘은 다음과 같습니다:
      // 1) 멀티 프로바이더가 컴포넌트의 'viewProviders'에서 온 경우:
      //   a) 특별한 뷰 프로바이더 팩토리가 존재하지 않으면 생성되어 추가됩니다.
      //   b) 그렇지 않으면 멀티 프로바이더가 기존의 멀티 팩토리에 추가됩니다.
      // 2) 멀티 프로바이더가 컴포넌트 또는 다른 디렉티브의 'providers'에서 온 경우:
      //   a) 멀티 팩토리가 존재하지 않으면 생성되고 프로바이더가 추가됩니다.
      //      필요하다면 기존의 뷰 프로바이더 멀티 팩토리에 연결됩니다.
      //   b) 그렇지 않으면 멀티 프로바이더가 기존의 멀티 팩토리에 추가됩니다.

      const existingProvidersFactoryIndex = indexOf(
        token,
        tInjectables,
        beginIndex + cptViewProvidersCount,
        endIndex,
      );
      const existingViewProvidersFactoryIndex = indexOf(
        token,
        tInjectables,
        beginIndex,
        beginIndex + cptViewProvidersCount,
      );
      const doesProvidersFactoryExist =
        existingProvidersFactoryIndex >= 0 && lInjectablesBlueprint[existingProvidersFactoryIndex];
      const doesViewProvidersFactoryExist =
        existingViewProvidersFactoryIndex >= 0 &&
        lInjectablesBlueprint[existingViewProvidersFactoryIndex];

      if (
        (isViewProvider && !doesViewProvidersFactoryExist) ||
        (!isViewProvider && !doesProvidersFactoryExist)
      ) {
        // 경우 1.a 및 2.a
        diPublicInInjector(
          getOrCreateNodeInjectorForNode(
            tNode as TElementNode | TContainerNode | TElementContainerNode,
            lView,
          ),
          tView,
          token,
        );
        const factory = multiFactory(
          isViewProvider ? multiViewProvidersFactoryResolver : multiProvidersFactoryResolver,
          lInjectablesBlueprint.length,
          isViewProvider,
          isComponent,
          providerFactory,
        );
        if (!isViewProvider && doesViewProvidersFactoryExist) {
          lInjectablesBlueprint[existingViewProvidersFactoryIndex].providerFactory = factory;
        }
        registerDestroyHooksIfSupported(tView, provider, tInjectables.length, 0);
        tInjectables.push(token);
        tNode.directiveStart++;
        tNode.directiveEnd++;
        if (isViewProvider) {
          tNode.providerIndexes += TNodeProviderIndexes.CptViewProvidersCountShifter;
        }
        lInjectablesBlueprint.push(factory);
        lView.push(factory);
      } else {
        // 경우 1.b 및 2.b
        const indexInFactory = multiFactoryAdd(
          lInjectablesBlueprint![
            isViewProvider ? existingViewProvidersFactoryIndex : existingProvidersFactoryIndex
          ],
          providerFactory,
          !isViewProvider && isComponent,
        );
        registerDestroyHooksIfSupported(
          tView,
          provider,
          existingProvidersFactoryIndex > -1
            ? existingProvidersFactoryIndex
            : existingViewProvidersFactoryIndex,
          indexInFactory,
        );
      }
      if (!isViewProvider && isComponent && doesViewProvidersFactoryExist) {
        lInjectablesBlueprint[existingViewProvidersFactoryIndex].componentProviders!++;
      }
    }
  }
}

/**
 * 프로바이더의 'ngOnDestroy' 훅을 등록합니다. 프로바이더가 destroy 훅을 지원하는 경우에만 해당합니다.
 * @param tView 훅을 등록할 'TView'.
 * @param provider 훅을 등록할 프로바이더.
 * @param contextIndex 훅이 호출될 때 훅의 컨텍스트를 찾는 인덱스.
 * @param indexInFactory 멀티 프로바이더에만 필요한 인덱스. 멀티 프로바이더 팩토리에서 프로바이더의 인덱스.
 */
function registerDestroyHooksIfSupported(
  tView: TView,
  provider: Exclude<Provider, any[]>,
  contextIndex: number,
  indexInFactory?: number,
) {
  const providerIsTypeProvider = isTypeProvider(provider);
  const providerIsClassProvider = isClassProvider(provider);

  if (providerIsTypeProvider || providerIsClassProvider) {
    // 'useClass'가 포워드 레퍼런스를 가질 수 있으므로 포워드 레퍼런스를 해결합니다.
    const classToken = providerIsClassProvider ? resolveForwardRef(provider.useClass) : provider;
    const prototype = classToken.prototype;
    const ngOnDestroy = prototype.ngOnDestroy;

    if (ngOnDestroy) {
      const hooks = tView.destroyHooks || (tView.destroyHooks = []);

      if (!providerIsTypeProvider && (provider as ClassProvider).multi) {
        ngDevMode &&
          assertDefined(indexInFactory, 'multi factory destroy hook을 등록할 때 indexInFactory');
        const existingCallbacksIndex = hooks.indexOf(contextIndex);

        if (existingCallbacksIndex === -1) {
          hooks.push(contextIndex, [indexInFactory, ngOnDestroy]);
        } else {
          (hooks[existingCallbacksIndex + 1] as DestroyHookData).push(indexInFactory!, ngOnDestroy);
        }
      } else {
        hooks.push(contextIndex, ngOnDestroy);
      }
    }
  }
}

/**
 * 멀티 팩토리에 팩토리를 추가합니다.
 * @returns 팩토리가 삽입된 인덱스.
 */
function multiFactoryAdd(
  multiFactory: NodeInjectorFactory,
  factory: () => any,
  isComponentProvider: boolean,
): number {
  if (isComponentProvider) {
    multiFactory.componentProviders!++;
  }
  return multiFactory.multi!.push(factory) - 1;
}

/**
 * 배열에서 항목의 인덱스를 반환하지만, 시작 지점에서 끝 지점까지의 범위 내에서만 반환합니다.
 */
function indexOf(item: any, arr: any[], begin: number, end: number) {
  for (let i = begin; i < end; i++) {
    if (arr[i] === item) return i;
  }
  return -1;
}

/**
 * 'multi' 'providers'와 함께 사용합니다.
 */
function multiProvidersFactoryResolver(
  this: NodeInjectorFactory,
  _: undefined,
  tData: TData,
  lData: LView,
  tNode: TDirectiveHostNode,
): any[] {
  return multiResolve(this.multi!, []);
}

/**
 * 'multi' 'viewProviders'와 함께 사용합니다.
 *
 * 이 팩토리는 기존 'multi' 'providers'와 자신을 연결하는 방법을 알고 있습니다.
 */
function multiViewProvidersFactoryResolver(
  this: NodeInjectorFactory,
  _: undefined,
  tData: TData,
  lView: LView,
  tNode: TDirectiveHostNode,
): any[] {
  const factories = this.multi!;
  let result: any[];
  if (this.providerFactory) {
    const componentCount = this.providerFactory.componentProviders!;
    const multiProviders = getNodeInjectable(
      lView,
      lView[TVIEW],
      this.providerFactory!.index!,
      tNode,
    );
    // 컴포넌트에서 'multi' 'providers'를 포함하는 배열의 섹션을 복사합니다.
    result = multiProviders.slice(0, componentCount);
    // 'viewProvider' 인스턴스를 삽입합니다.
    multiResolve(factories, result);
    // 다른 디렉티브에서 'multi' 'providers'를 포함하는 배열의 섹션을 복사합니다.
    for (let i = componentCount; i < multiProviders.length; i++) {
      result.push(multiProviders[i]);
    }
  } else {
    result = [];
    // 'viewProvider' 인스턴스를 삽입합니다.
    multiResolve(factories, result);
  }
  return result;
}

/**
 * 팩토리 배열을 값 배열로 변환합니다.
 */
function multiResolve(factories: Array<() => any>, result: any[]): any[] {
  for (let i = 0; i < factories.length; i++) {
    const factory = factories[i]! as () => null;
    result.push(factory());
  }
  return result;
}

/**
 * 멀티 팩토리를 생성합니다.
 */
function multiFactory(
  factoryFn: (
    this: NodeInjectorFactory,
    _: undefined,
    tData: TData,
    lData: LView,
    tNode: TDirectiveHostNode,
  ) => any,
  index: number,
  isViewProvider: boolean,
  isComponent: boolean,
  f: () => any,
): NodeInjectorFactory {
  const factory = new NodeInjectorFactory(factoryFn, isViewProvider, ɵɵdirectiveInject);
  factory.multi = [];
  factory.index = index;
  factory.componentProviders = 0;
  multiFactoryAdd(factory, f, isComponent && !isViewProvider);
  return factory;
}
