/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {FactoryProvider, ProviderToken} from '../../di';
import {resolveForwardRef} from '../../di/forward_ref';
import {InjectionToken} from '../../di/injection_token';
import type {Injector} from '../../di/injector';
import {InjectOptions, InternalInjectFlags} from '../../di/interface/injector';
import type {SingleProvider} from '../../di/provider_collection';
import {Type} from '../../interface/type';
import {throwError} from '../../util/assert';
import type {TNode} from '../interfaces/node';
import type {LView} from '../interfaces/view';
import type {EffectRef} from '../reactivity/effect';

/**
 * 주입기 프로파일러에서 발생할 수 있는 이벤트의 유형을 설명하는 열거형입니다.
 */
export const enum InjectorProfilerEventType {
  /**
   * 서비스가 주입될 때 발생합니다.
   */
  Inject,

  /**
   * 주입기에 의해 Angular 클래스 인스턴스가 생성될 때 발생합니다.
   */
  InstanceCreatedByInjector,

  /**
   * 주입기가 프로바이더를 구성할 때 발생합니다.
   */
  ProviderConfigured,

  /**
   * 이펙트가 생성될 때 발생합니다.
   */
  EffectCreated,

  /**
   * Angular DI 시스템이 주어진 토큰에 해당하는 인스턴스를 생성하려고 할 때 발생합니다.
   */
  InjectorToCreateInstanceEvent,
}

/**
 * 주입기 프로파일러를 위한 주입 맥락을 정의하는 객체입니다.
 */
export interface InjectorProfilerContext {
  /**
   * 서비스가 주입되고 있는 주입기입니다.
   *      - 예: 만약 ModuleA --provides--> ServiceA --injects--> ServiceB
   *                 그러면 ServiceA에서 ServiceB를 주입할 때 ModuleA가 주입기 맥락이 됩니다.
   */
  injector: Injector;

  /**
   * `inject`를 호출하는 생성자가 위치한 클래스입니다.
   *      - 예: 만약 ModuleA --provides--> ServiceA --injects--> ServiceB
   *                 그러면 ServiceA에서 ServiceB를 주입할 때 ServiceA가 생성 맥락이 됩니다.
   */
  token: Type<unknown> | null;
}

export interface InjectedServiceEvent {
  type: InjectorProfilerEventType.Inject;
  context: InjectorProfilerContext;
  service: InjectedService;
}

export interface InjectorToCreateInstanceEvent {
  type: InjectorProfilerEventType.InjectorToCreateInstanceEvent;
  context: InjectorProfilerContext;
  token: ProviderToken<unknown>;
}

export interface InjectorCreatedInstanceEvent {
  type: InjectorProfilerEventType.InstanceCreatedByInjector;
  context: InjectorProfilerContext;
  instance: InjectorCreatedInstance;
}

export interface ProviderConfiguredEvent {
  type: InjectorProfilerEventType.ProviderConfigured;
  context: InjectorProfilerContext;
  providerRecord: ProviderRecord;
}

export interface EffectCreatedEvent {
  type: InjectorProfilerEventType.EffectCreated;
  context: InjectorProfilerContext;
  effect: EffectRef;
}

/**
 * 주입기 프로파일러를 통해 발생되는 이벤트를 나타내는 객체입니다.
 */
export type InjectorProfilerEvent =
  | InjectedServiceEvent
  | InjectorToCreateInstanceEvent
  | InjectorCreatedInstanceEvent
  | ProviderConfiguredEvent
  | EffectCreatedEvent;

/**
 * 구성된 프로바이더에 대한 정보를 포함하는 객체입니다.
 *
 * TODO: 이 객체가 디버그 구조임을 나타내도록 이름을 변경하십시오. 예: ProviderDebugInfo.
 */
export interface ProviderRecord {
  /**
   * 이 프로바이더가 구성하는 DI 토큰입니다.
   */
  token: Type<unknown> | InjectionToken<unknown>;

  /**
   * 프로바이더가 뷰 프로바이더로 구성되었는지 여부를 결정합니다.
   */
  isViewProvider: boolean;

  /**
   * 이 ProviderRecord와 관련된 원시 프로바이더입니다.
   */
  provider: SingleProvider;

  /**
   * 이 프로바이더를 가져오기 위해 따라온 DI 컨테이너의 경로입니다.
   */
  importPath?: Type<unknown>[];
}

/**
 * 주입기 내에서 구성된 값에 대한 정보를 포함하는 객체입니다.
 */
export interface InjectorCreatedInstance {
  /**
   * 생성된 인스턴스의 값입니다.
   */
  value: unknown;
}

/**
 * InjectorProfilerContext 내에서 주입된 서비스에 대한 정보를 포함하는 객체입니다.
 */
export interface InjectedService {
  /**
   * 주입된 서비스의 DI 토큰입니다.
   */
  token?: Type<unknown> | InjectionToken<unknown>;

  /**
   * 주입된 서비스의 값입니다.
   */
  value: unknown;

  /**
   * 이 서비스가 주입된 플래그입니다.
   */
  flags?: InternalInjectFlags | InjectOptions;

  /**
   * 이 서비스가 제공된 주입기입니다.
   */
  providedIn?: Injector;

  /**
   * NodeInjectors에서 이 주입을 처리한 LView와 TNode입니다.
   */
  injectedIn?: {lView: LView; tNode: TNode};
}

export interface InjectorProfiler {
  (event: InjectorProfilerEvent): void;
}

let _injectorProfilerContext: InjectorProfilerContext;
export function getInjectorProfilerContext() {
  !ngDevMode && throwError('getInjectorProfilerContext는 프로덕션 모드에서 호출되어서는 안됩니다.');
  return _injectorProfilerContext;
}

export function setInjectorProfilerContext(context: InjectorProfilerContext) {
  !ngDevMode && throwError('setInjectorProfilerContext는 프로덕션 모드에서 호출되어서는 안됩니다.');

  const previous = _injectorProfilerContext;
  _injectorProfilerContext = context;
  return previous;
}

let injectorProfilerCallback: InjectorProfiler | null = null;

/**
 * 런타임 내에서 특정 DI 이벤트 동안 호출될 콜백 함수를 설정합니다.
 * (예: 서비스 주입, 주입할 수 있는 인스턴스 생성, 프로바이더 구성)
 *
 * 경고: 이 함수는 *내부* 함수이며 애플리케이션 코드에서 의존해서는 안됩니다.
 * 함수의 계약은 모든 릴리스에서 변경될 수 있으며/또는 함수는 완전히 제거될 수 있습니다.
 *
 * @param profiler 호출자에 의해 제공된 함수 또는 프로파일링을 비활성화하기 위한 null 값입니다.
 */
export const setInjectorProfiler = (injectorProfiler: InjectorProfiler | null) => {
  !ngDevMode && throwError('setInjectorProfiler는 프로덕션 모드에서 호출되어서는 안됩니다.');
  injectorProfilerCallback = injectorProfiler;
};

/**
 * 런타임에서 실행된 DI 이벤트에서 발생하는 인젝터 프로파일러 함수입니다.
 *
 * @param event 발생한 DI 이벤트에 해당하는 InjectorProfilerEvent입니다.
 */
function injectorProfiler(event: InjectorProfilerEvent): void {
  !ngDevMode && throwError('Injector 프로파일러는 프로덕션 모드에서 호출되어서는 안됩니다.');

  if (injectorProfilerCallback != null /* 모두 `null` 및 `undefined` */) {
    injectorProfilerCallback!(event);
  }
}

/**
 * Injector 프로파일러에 InjectorProfilerEventType.ProviderConfigured를 발생시킵니다.
 * 발생된 이벤트의 데이터에는 원시 프로바이더와
 * 프로바이더가 제공하는 토큰이 포함됩니다.
 *
 * @param eventProvider 프로바이더 객체
 */
export function emitProviderConfiguredEvent(
  eventProvider: SingleProvider,
  isViewProvider: boolean = false,
): void {
  !ngDevMode && throwError('Injector 프로파일러는 프로덕션 모드에서 호출되어서는 안됩니다.');

  let token;
  // 프로바이더가 TypeProvider (프로바이더의 typeof가 함수)인 경우,
  // 토큰은 프로바이더 자체입니다.
  if (typeof eventProvider === 'function') {
    token = eventProvider;
  }
  // 프로바이더가 주입 토큰인 경우, 토큰은 주입 토큰입니다.
  else if (eventProvider instanceof InjectionToken) {
    token = eventProvider;
  }
  // 모든 다른 경우에 대해, 우리는 프로바이더의 `provide` 속성을 통해 토큰에 접근할 수 있습니다.
  else {
    token = resolveForwardRef(eventProvider.provide);
  }

  let provider = eventProvider;
  // 주입 토큰은 자체 기본 프로바이더를 정의할 수 있으며,
  // 이는 토큰 자체에 `ɵprov`로 첨부됩니다.
  // 이 경우, 우리는 토큰 자체가 아닌 토큰에 첨부된 프로바이더를 발생시키고자 합니다.
  if (eventProvider instanceof InjectionToken) {
    provider = (eventProvider.ɵprov as FactoryProvider) || eventProvider;
  }

  injectorProfiler({
    type: InjectorProfilerEventType.ProviderConfigured,
    context: getInjectorProfilerContext(),
    providerRecord: {token, provider, isViewProvider},
  });
}

/**
 * 주어진 토큰에 해당하는 인스턴스가 주입기에 의해 생성되기 직전에
 * 주입기 프로파일러에 이벤트를 발생시킵니다.
 * 이 발생에 관련된 주입기는 getDebugInjectContext()를 사용하여 접근할 수 있습니다.
 *
 * @param instance 주입기에 의해 생성된 객체
 */
export function emitInjectorToCreateInstanceEvent(token: ProviderToken<unknown>): void {
  !ngDevMode && throwError('Injector 프로파일러는 프로덕션 모드에서 호출되어서는 안됩니다.');

  injectorProfiler({
    type: InjectorProfilerEventType.InjectorToCreateInstanceEvent,
    context: getInjectorProfilerContext(),
    token: token,
  });
}

/**
 * 생성된 인스턴스를 가지고 Injector 프로파일러에 이벤트를 발생시킵니다.
 * 이 발생에 관련된 주입기는 getDebugInjectContext()를 사용하여 접근할 수 있습니다.
 *
 * @param instance 주입기에 의해 생성된 객체
 */
export function emitInstanceCreatedByInjectorEvent(instance: unknown): void {
  !ngDevMode && throwError('Injector 프로파일러는 프로덕션 모드에서 호출되어서는 안됩니다.');

  injectorProfiler({
    type: InjectorProfilerEventType.InstanceCreatedByInjector,
    context: getInjectorProfilerContext(),
    instance: {value: instance},
  });
}

/**
 * @param token 주입된 서비스와 연관된 DI 토큰
 * @param value 주입된 서비스의 인스턴스 (즉, `inject(token)`의 결과)
 * @param flags 토큰이 주입된 플래그
 */
export function emitInjectEvent(
  token: Type<unknown>,
  value: unknown,
  flags: InternalInjectFlags,
): void {
  !ngDevMode && throwError('Injector 프로파일러는 프로덕션 모드에서 호출되어서는 안됩니다.');

  injectorProfiler({
    type: InjectorProfilerEventType.Inject,
    context: getInjectorProfilerContext(),
    service: {token, value, flags},
  });
}

export function emitEffectCreatedEvent(effect: EffectRef): void {
  !ngDevMode && throwError('Injector 프로파일러는 프로덕션 모드에서 호출되어서는 안됩니다.');

  injectorProfiler({
    type: InjectorProfilerEventType.EffectCreated,
    context: getInjectorProfilerContext(),
    effect,
  });
}

export function runInInjectorProfilerContext(
  injector: Injector,
  token: Type<unknown>,
  callback: () => void,
): void {
  !ngDevMode &&
    throwError('runInInjectorProfilerContext는 프로덕션 모드에서 호출되어서는 안됩니다.');

  const prevInjectContext = setInjectorProfilerContext({injector, token});
  try {
    callback();
  } finally {
    setInjectorProfilerContext(prevInjectContext);
  }
}
