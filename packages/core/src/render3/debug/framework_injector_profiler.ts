/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../../di/injector';
import {EnvironmentInjector} from '../../di/r3_injector';
import {Type} from '../../interface/type';
import {assertDefined, throwError} from '../../util/assert';
import {assertTNodeForLView} from '../assert';
import {getComponentDef} from '../def_getters';
import {getNodeInjectorLView, getNodeInjectorTNode, NodeInjector} from '../di';
import {TNode} from '../interfaces/node';
import {LView} from '../interfaces/view';
import {EffectRef} from '../reactivity/effect';

import {
  InjectedService,
  InjectorCreatedInstance,
  InjectorProfilerContext,
  InjectorProfilerEvent,
  InjectorProfilerEventType,
  ProviderRecord,
  setInjectorProfiler,
} from './injector_profiler';

/**
 * 이 데이터 구조는 DI 디버깅 API를 지원하기 위해 프레임워크 인젝터 프로파일러가 데이터를 채우는 구조입니다.
 *
 * resolverToTokenToDependencies: 인젝터를 토큰과 의존성의 배열을 매핑하는 맵에 맵핑합니다.
 * Injector -> Token -> Dependencies 이것은 인젝터와 토큰을 사용하여 의존성을 반환하는
 * getDependenciesFromInjectable API를 지원하는 데 사용됩니다.
 *
 * resolverToProviders: DI 리졸버(인젝터 또는 TNode)를 그 안에 구성된 프로바이더와 매핑합니다.
 * 이것은 인젝터를 입력받고 그와 함께 구성된 프로바이더를 반환하는 getInjectorProviders API를 지원하는 데 사용됩니다.
 * 요소 인젝터의 경우 LView가 아닌 TNode를 DI 리졸버로 사용합니다. 이는 프로바이더의 등록이
 * TNode의 유형당 한 번만 발생하기 때문입니다. 동일한 TNode로 인젝터가 생성되면,
 * 해당 인젝터의 프로바이더는 다시 구성되지 않습니다.
 *
 * standaloneInjectorToComponent: 독립형 컴포넌트의 인젝터를 그와 연관된 독립형 컴포넌트에 매핑합니다.
 * getInjectorProviders API에서 사용되며, 각 프로바이더의 가져오기 경로를 발견하는 데 구체적입니다.
 * 독립형 컴포넌트의 가져오기 배열은 해당 독립형 인젝터에서 처리되고 구성되지만,
 * 컴포넌트의 정의 내에 존재하기 때문에 이 것이 필요합니다. getInjectorProviders가 인젝터를 입력받기 때문에,
 * 그 인젝터가 독립형 컴포넌트의 인젝터라면, 가져오기 배열이 위치하는 장소(컴포넌트)를 발견해야 하며,
 * 이를 통해 가져오기 배열을 평탄화하여 모든 프로바이더를 발견합니다.
 *
 * 이러한 모든 데이터 구조는 WeakMaps로 인스턴스화됩니다. 이것은
 * 이 맵의 키에 있는 객체의 존재가 쓰레기 수집기가 해당 객체를 수집하는 것을 방지하지 않도록 보장합니다.
 * WeakMaps의 이 속성 덕분에 이러한 데이터 구조는 절대 메모리 누수의 원인이 되지 않습니다.
 *
 * 이러한 이점을 보여주는 예: 컴포넌트가 파괴될 때,
 * 우리는 해당 컴포넌트를 매핑에서 제거하기 위해 추가 작업을 할 필요가 없습니다.
 *
 */
class DIDebugData {
  resolverToTokenToDependencies = new WeakMap<
    Injector | LView,
    WeakMap<Type<unknown>, InjectedService[]>
  >();
  resolverToProviders = new WeakMap<Injector | TNode, ProviderRecord[]>();
  resolverToEffects = new WeakMap<Injector | LView, EffectRef[]>();
  standaloneInjectorToComponent = new WeakMap<Injector, Type<unknown>>();

  reset() {
    this.resolverToTokenToDependencies = new WeakMap<
      Injector | LView,
      WeakMap<Type<unknown>, InjectedService[]>
    >();
    this.resolverToProviders = new WeakMap<Injector | TNode, ProviderRecord[]>();
    this.standaloneInjectorToComponent = new WeakMap<Injector, Type<unknown>>();
  }
}

let frameworkDIDebugData = new DIDebugData();

export function getFrameworkDIDebugData(): DIDebugData {
  return frameworkDIDebugData;
}

/**
 * 인젝터 이벤트의 기본 처리를 초기화합니다. 이 처리는 이벤트가 발생할 때
 * 이벤트를 구문 분석하고 일부 디버그 API를 지원하는 데 필요한 데이터 구조를 생성합니다.
 *
 * 각 핸들러에 대한 설명은 handleInjectEvent, handleCreateEvent 및 handleProviderConfiguredEvent를 참조하십시오.
 *
 * 지원되는 API:
 *               - getDependenciesFromInjectable
 *               - getInjectorProviders
 */
export function setupFrameworkInjectorProfiler(): void {
  frameworkDIDebugData.reset();
  setInjectorProfiler((injectorProfilerEvent) =>
    handleInjectorProfilerEvent(injectorProfilerEvent),
  );
}

function handleInjectorProfilerEvent(injectorProfilerEvent: InjectorProfilerEvent): void {
  const {context, type} = injectorProfilerEvent;

  if (type === InjectorProfilerEventType.Inject) {
    handleInjectEvent(context, injectorProfilerEvent.service);
  } else if (type === InjectorProfilerEventType.InstanceCreatedByInjector) {
    handleInstanceCreatedByInjectorEvent(context, injectorProfilerEvent.instance);
  } else if (type === InjectorProfilerEventType.ProviderConfigured) {
    handleProviderConfiguredEvent(context, injectorProfilerEvent.providerRecord);
  } else if (type === InjectorProfilerEventType.EffectCreated) {
    handleEffectCreatedEvent(context, injectorProfilerEvent.effect);
  }
}

function handleEffectCreatedEvent(context: InjectorProfilerContext, effect: EffectRef): void {
  const diResolver = getDIResolver(context.injector);
  if (diResolver === null) {
    throwError('EffectCreated 이벤트는 주입 컨텍스트 내에서 실행되어야 합니다.');
  }

  const {resolverToEffects} = frameworkDIDebugData;

  if (!resolverToEffects.has(diResolver)) {
    resolverToEffects.set(diResolver, []);
  }

  resolverToEffects.get(diResolver)!.push(effect);
}

/**
 *
 * 주입된 서비스를 frameworkDIDebugData.resolverToTokenToDependencies에 토큰에 따라 저장합니다.
 *
 * @param context InjectorProfilerContext 이 이벤트가 발생한 주입 컨텍스트입니다.
 * @param data InjectedService 이 인젝트 이벤트와 연관된 서비스입니다.
 *
 */
function handleInjectEvent(context: InjectorProfilerContext, data: InjectedService) {
  const diResolver = getDIResolver(context.injector);
  if (diResolver === null) {
    throwError('Inject 이벤트는 주입 컨텍스트 내에서 실행되어야 합니다.');
  }

  const diResolverToInstantiatedToken = frameworkDIDebugData.resolverToTokenToDependencies;

  if (!diResolverToInstantiatedToken.has(diResolver)) {
    diResolverToInstantiatedToken.set(diResolver, new WeakMap<Type<unknown>, InjectedService[]>());
  }

  // 토큰이 원시 유형인 경우, 이 이벤트를 무시합니다. 우리는 WeakMaps에서
  // 수집되지 않는 비원시 토큰을 추적할 수 없기 때문에 이렇게 합니다.
  if (!canBeHeldWeakly(context.token)) {
    return;
  }

  const instantiatedTokenToDependencies = diResolverToInstantiatedToken.get(diResolver)!;
  if (!instantiatedTokenToDependencies.has(context.token!)) {
    instantiatedTokenToDependencies.set(context.token!, []);
  }

  const {token, value, flags} = data;

  assertDefined(context.token, 'Injector 프로파일러 컨텍스트 토큰이 정의되지 않았습니다.');

  const dependencies = instantiatedTokenToDependencies.get(context.token);
  assertDefined(dependencies, '토큰에 대한 의존성을 해결할 수 없습니다.');

  if (context.injector instanceof NodeInjector) {
    dependencies.push({token, value, flags, injectedIn: getNodeInjectorContext(context.injector)});
  } else {
    dependencies.push({token, value, flags});
  }
}

/**
 *
 * NodeInjector와 관련된 LView 및 TNode를 반환합니다. 인젝터가 NodeInjector가 아닌 경우 undefined를 반환합니다.
 *
 * @param injector
 * @returns {lView: LView, tNode: TNode}|undefined
 */
function getNodeInjectorContext(injector: Injector): {lView: LView; tNode: TNode} | undefined {
  if (!(injector instanceof NodeInjector)) {
    throwError('getNodeInjectorContext는 NodeInjector로 호출되어야 합니다.');
  }

  const lView = getNodeInjectorLView(injector);
  const tNode = getNodeInjectorTNode(injector);
  if (tNode === null) {
    return;
  }

  assertTNodeForLView(tNode, lView);

  return {lView, tNode};
}

/**
 *
 * 생성된 인스턴스가 독립형 컴포넌스 인스턴스인 경우, 프레임워크DIDebugData.standaloneInjectorToComponent에서
 * 해당 인젝터를 그 독립형 컴포넌트에 매핑합니다.
 *
 * @param context InjectorProfilerContext 이 이벤트가 발생한 주입 컨텍스트입니다.
 * @param data InjectorCreatedInstance 방금 생성된 인스턴스를 포함하는 객체입니다.
 *
 */
function handleInstanceCreatedByInjectorEvent(
  context: InjectorProfilerContext,
  data: InjectorCreatedInstance,
): void {
  const {value} = data;

  // DI 토큰이 요청되었지만 해당 값이 없는 경우가 있을 수 있습니다.
  // 이 경우에도 InstanceCreatedByInjectorEvent가 발행되지만 (InjectorToCreateInstanceEvent를 반영하기 위해)
  // 우리는 그러한 상황에 대해 특별한 처리를 하고 싶지 않습니다.
  if (data.value == null) {
    return;
  }

  if (getDIResolver(context.injector) === null) {
    throwError('InjectorCreatedInstance 이벤트는 주입 컨텍스트 내에서 실행되어야 합니다.');
  }

  // 우리의 값이 독립형 컴포넌트의 인스턴스인 경우, 해당 독립형 컴포넌트의 인젝터를 컴포넌트 클래스로 매핑합니다.
  // 그렇지 않으면, 이 이벤트는 noop입니다.
  let standaloneComponent: Type<unknown> | undefined | null = undefined;
  if (typeof value === 'object') {
    standaloneComponent = value?.constructor as Type<unknown> | undefined | null;
  }

  // `standaloneComponent === null`을 추가로 확인하고 싶습니다.
  if (standaloneComponent == undefined || !isStandaloneComponent(standaloneComponent)) {
    return;
  }

  const environmentInjector: EnvironmentInjector | null = context.injector.get(
    EnvironmentInjector,
    null,
    {optional: true},
  );
  // 독립형 컴포넌트는 환경 인젝터를 가져야 합니다. 찾을 수 없는 경우,
  // 우리는 이 인젝터를 명시적으로 설정하지 않은 저수준 기능에 대한 테스트 케이스에 있을 수 있습니다.
  // 그 경우 우리는 이 이벤트를 무시합니다.
  if (environmentInjector === null) {
    return;
  }

  const {standaloneInjectorToComponent} = frameworkDIDebugData;

  // 인젝터가 이미 매핑된 경우, 다른 독립형 컴포넌트를 가져오는 경우
  // 원래 컴포넌트(가져오는 컴포넌트)를 인젝터와 연결된 컴포넌트로 간주합니다.
  if (standaloneInjectorToComponent.has(environmentInjector)) {
    return;
  }
  // 인젝터가 매핑되지 않은 경우 독립형 컴포넌트에 매핑합니다.
  standaloneInjectorToComponent.set(environmentInjector, standaloneComponent);
}

function isStandaloneComponent(value: Type<unknown>): boolean {
  const def = getComponentDef(value);
  return !!def?.standalone;
}

/**
 *
 * InjectorProfilerEventType.ProviderConfigured 이벤트에서 발생한 ProviderRecords를
 * frameworkDIDebugData.resolverToProviders에 저장합니다.
 *
 * @param context InjectorProfilerContext 이 이벤트가 발생한 주입 컨텍스트입니다.
 * @param data ProviderRecord 방금 생성된 인스턴스를 포함하는 객체입니다.
 *
 */
function handleProviderConfiguredEvent(
  context: InjectorProfilerContext,
  data: ProviderRecord,
): void {
  const {resolverToProviders} = frameworkDIDebugData;

  let diResolver: Injector | TNode;
  if (context?.injector instanceof NodeInjector) {
    diResolver = getNodeInjectorTNode(context.injector) as TNode;
  } else {
    diResolver = context.injector;
  }

  if (diResolver === null) {
    throwError('ProviderConfigured 이벤트는 주입 컨텍스트 내에서 실행되어야 합니다.');
  }

  if (!resolverToProviders.has(diResolver)) {
    resolverToProviders.set(diResolver, []);
  }

  resolverToProviders.get(diResolver)!.push(data);
}

function getDIResolver(injector: Injector | undefined): Injector | LView | null {
  let diResolver: Injector | LView | null = null;

  if (injector === undefined) {
    return diResolver;
  }

  // NodeInjectors에 대해 LView를 diResolver로 사용합니다. 이는
  // 프레임워크 어디에서도 지속되지 않기 때문에, LView와 TNode를 감싸는 단순한 레이어입니다.
  // 이러한 이유로, 우리는 NodeInjector의 LView를 사용하여 이 인젝터를 나타내는 구체적인 키로 사용합니다.
  // 나중에 동일한 LView를 얻으면, 우리는 같은 인젝터를 보고 있다고 알 수 있습니다.
  if (injector instanceof NodeInjector) {
    diResolver = getNodeInjectorLView(injector);
  }
  // 다른 인젝터는 인스턴스가 지속되기 때문에 맵의 키로 사용될 수 있습니다.
  else {
    diResolver = injector;
  }

  return diResolver;
}

// 영감을 받아서
// https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-canbeheldweakly
function canBeHeldWeakly(value: any): boolean {
  // null !== value를 확인합니다. typeof null === 'object'이기 때문입니다.
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function' || typeof value === 'symbol')
  );
}
