/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import '../util/ng_dev_mode';

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {OnDestroy} from '../interface/lifecycle_hooks';
import {Type} from '../interface/type';
import {
  emitInjectorToCreateInstanceEvent,
  emitInstanceCreatedByInjectorEvent,
  emitProviderConfiguredEvent,
  InjectorProfilerContext,
  runInInjectorProfilerContext,
  setInjectorProfilerContext,
} from '../render3/debug/injector_profiler';
import {FactoryFn, getFactoryDef} from '../render3/definition_factory';
import {
  throwCyclicDependencyError,
  throwInvalidProviderError,
  throwMixedMultiProviderError,
} from '../render3/errors_di';
import {NG_ENV_ID} from '../render3/fields';
import {newArray} from '../util/array_utils';
import {EMPTY_ARRAY} from '../util/empty';
import {stringify} from '../util/stringify';

import {resolveForwardRef} from './forward_ref';
import {ENVIRONMENT_INITIALIZER} from './initializer_token';
import {setInjectImplementation} from './inject_switch';
import {InjectionToken} from './injection_token';
import type {Injector} from './injector';
import {
  BackwardsCompatibleInjector,
  catchInjectorError,
  convertToBitFlags,
  injectArgs,
  NG_TEMP_TOKEN_PATH,
  setCurrentInjector,
  THROW_IF_NOT_FOUND,
  ɵɵinject,
} from './injector_compatibility';
import {INJECTOR} from './injector_token';
import {
  getInheritedInjectableDef,
  getInjectableDef,
  InjectorType,
  ɵɵInjectableDeclaration,
} from './interface/defs';
import {InternalInjectFlags, InjectOptions} from './interface/injector';
import {
  ClassProvider,
  ConstructorProvider,
  EnvironmentProviders,
  InternalEnvironmentProviders,
  isEnvironmentProviders,
  Provider,
  StaticClassProvider,
  TypeProvider,
} from './interface/provider';
import {INJECTOR_DEF_TYPES} from './internal_tokens';
import {NullInjector} from './null_injector';
import {
  isExistingProvider,
  isFactoryProvider,
  isTypeProvider,
  isValueProvider,
  SingleProvider,
} from './provider_collection';
import {ProviderToken} from './provider_token';
import {INJECTOR_SCOPE, InjectorScope} from './scope';
import {setActiveConsumer} from '@angular/core/primitives/signals';
import {
  Injector as PrimitivesInjector,
  InjectionToken as PrimitivesInjectionToken,
  NOT_FOUND,
  NotFound,
} from '@angular/core/primitives/di';

/**
 * 팩토리 함수에서 아직 값이 생성되지 않았음을 나타내는 마커.
 */
const NOT_YET = {};

/**
 * 토큰에 대한 팩토리 함수가 호출 중임을 나타내는 마커.
 *
 * 주입기가 CIRCULAR로 설정된 토큰을 주입하도록 요청받으면, 이는
 * 의존성 주입이 원래의 토큰을 재귀적으로 시도했음을 나타내며, 제공자 간의
 * 순환 종속성이 있음을 의미합니다.
 */
const CIRCULAR = {};

/**
 * 지연 초기화된 NullInjector.
 */
let NULL_INJECTOR: Injector | undefined = undefined;

export function getNullInjector(): Injector {
  if (NULL_INJECTOR === undefined) {
    NULL_INJECTOR = new NullInjector();
  }
  return NULL_INJECTOR;
}

/**
 * 주어진 토큰에 대한 정보를 추적하는 주입기의 항목으로, 가능한 현재 값도 포함.
 */
interface Record<T> {
  factory: (() => T) | undefined;
  value: T | {};
  multi: any[] | undefined;
}

/**
 * 구성 요소 트리 외부에 존재하는 환경 주입기 계층의 일부인 `Injector`.
 *
 * @publicApi
 */
export abstract class EnvironmentInjector implements Injector {
  /**
   * 제공된 토큰을 기반으로 주입기에서 인스턴스를 검색합니다.
   * @returns 정의된 경우 주입기에서 인스턴스를 반환하며, 그렇지 않으면 `notFoundValue`를 반환합니다.
   * @throws `notFoundValue`가 `undefined`이거나 `Injector.THROW_IF_NOT_FOUND`일 때.
   */
  abstract get<T>(
    token: ProviderToken<T>,
    notFoundValue: undefined,
    options: InjectOptions & {
      optional?: false;
    },
  ): T;
  /**
   * 제공된 토큰을 기반으로 주입기에서 인스턴스를 검색합니다.
   * @returns 정의된 경우 주입기에서 인스턴스를 반환하며, 그렇지 않으면 `notFoundValue`를 반환합니다.
   * @throws `notFoundValue`가 `undefined`이거나 `Injector.THROW_IF_NOT_FOUND`일 때.
   */
  abstract get<T>(
    token: ProviderToken<T>,
    notFoundValue: null | undefined,
    options: InjectOptions,
  ): T | null;
  /**
   * 제공된 토큰을 기반으로 주입기에서 인스턴스를 검색합니다.
   * @returns 정의된 경우 주입기에서 인스턴스를 반환하며, 그렇지 않으면 `notFoundValue`를 반환합니다.
   * @throws `notFoundValue`가 `undefined`이거나 `Injector.THROW_IF_NOT_FOUND`일 때.
   */
  abstract get<T>(token: ProviderToken<T>, notFoundValue?: T, options?: InjectOptions): T;
  /**
   * @deprecated v4.0.0부터 ProviderToken<T> 사용
   * @suppress {duplicate}
   */
  abstract get<T>(token: string | ProviderToken<T>, notFoundValue?: any): any;

  /**
   * 주어진 함수를 이 `EnvironmentInjector`의 컨텍스트에서 실행합니다.
   *
   * 함수의 스택 프레임 내에서 [`inject`](api/core/inject) 를 사용하여
   * 이 주입기에서 의존성을 주입할 수 있습니다. `inject`는 동기적으로만 사용할 수 있으며,
   * 비동기 콜백이나 `await` 포인트 이후에는 사용할 수 없습니다.
   *
   * @param fn 이 주입기의 컨텍스트에서 실행될 클로저
   * @returns 함수의 반환 값이 있을 경우
   * @deprecated 독립 함수 `runInInjectionContext`를 대신 사용
   */
  abstract runInContext<ReturnT>(fn: () => ReturnT): ReturnT;

  abstract destroy(): void;

  /**
   * @internal
   */
  abstract onDestroy(callback: () => void): () => void;
}

export class R3Injector extends EnvironmentInjector implements PrimitivesInjector {
  /**
   * 토큰과 해당 토큰의 인스턴스를 포함하는 레코드의 맵.
   * - `null` 값은 레코드가 없음을 의미합니다. 추가 검색을 방지하기 위해 트리-쉐이커블 주입기에서 사용됨.
   */
  private records = new Map<ProviderToken<any>, Record<any> | null>();

  /**
   * 이 주입기에 의해 인스턴스화된 값의 집합으로, `ngOnDestroy` 생명주기 훅을 포함합니다.
   */
  private _ngOnDestroyHooks = new Set<OnDestroy>();

  private _onDestroyHooks: Array<() => void> = [];

  /**
   * 이 주입기가 이전에 파괴되었음을 나타내는 플래그.
   */
  get destroyed(): boolean {
    return this._destroyed;
  }
  private _destroyed = false;

  private injectorDefTypes: Set<Type<unknown>>;

  constructor(
    providers: Array<Provider | EnvironmentProviders>,
    readonly parent: Injector,
    readonly source: string | null,
    readonly scopes: Set<InjectorScope>,
  ) {
    super();
    // 모든 제공자에 대한 레코드를 생성하는 것으로 시작합니다.
    forEachSingleProvider(providers as Array<Provider | InternalEnvironmentProviders>, (provider) =>
      this.processProvider(provider),
    );

    // 현재 주입기가 환경 범위여야 하는 경우
    this.records.set(INJECTOR, makeRecord(undefined, this));

    // 현재 주입기가 환경 범위여야 하는 경우 `EnvironmentInjector`도 설정합니다.
    if (scopes.has('environment')) {
      this.records.set(EnvironmentInjector, makeRecord(undefined, this));
    }

    // 이 주입기에 APP_ROOT_SCOPE 토큰이 있는지 감지하고, 따라서
    // APP_ROOT_SCOPE에 주입 가능한 항목을 제공해야 하는지를 확인합니다.
    const record = this.records.get(INJECTOR_SCOPE) as Record<InjectorScope | null>;
    if (record != null && typeof record.value === 'string') {
      this.scopes.add(record.value as InjectorScope);
    }

    this.injectorDefTypes = new Set(this.get(INJECTOR_DEF_TYPES, EMPTY_ARRAY, {self: true}));
  }

  retrieve<T>(token: PrimitivesInjectionToken<T>, options?: unknown): T | NotFound {
    const flags: InternalInjectFlags =
      convertToBitFlags(options as InjectOptions | undefined) || InternalInjectFlags.Default;
    return (this as BackwardsCompatibleInjector).get(
      token as unknown as InjectionToken<T>,
      // 의존성이 선택적 플래그로 요청될 때 DI는 NULL을 기본값으로 반환합니다.
      flags & InternalInjectFlags.Optional ? null : undefined,
      flags,
    )!;
  }

  /**
   * 주입기를 파괴하고 그것과 연관된 모든 인스턴스 또는 제공자에 대한 참조를 해제합니다.
   *
   * 또한 훅이 발견된 경우 생성된 모든 인스턴스의 `OnDestroy` 생명주기 훅을 호출합니다.
   */
  override destroy(): void {
    assertNotDestroyed(this);

    // 라이프사이클 훅이 재진입하는 경우를 대비해 먼저 destroyed = true로 설정합니다.
    this._destroyed = true;
    const prevConsumer = setActiveConsumer(null);
    try {
      // 모든 생명 주기 훅을 호출합니다.
      for (const service of this._ngOnDestroyHooks) {
        service.ngOnDestroy();
      }
      const onDestroyHooks = this._onDestroyHooks;
      // 반복 중지된 훅이 배열을 변형하는 것을 방지하기 위해 _onDestroyHooks 배열을 재설정합니다.
      this._onDestroyHooks = [];
      for (const hook of onDestroyHooks) {
        hook();
      }
    } finally {
      // 모든 참조를 해제합니다.
      this.records.clear();
      this._ngOnDestroyHooks.clear();
      this.injectorDefTypes.clear();
      setActiveConsumer(prevConsumer);
    }
  }

  override onDestroy(callback: () => void): () => void {
    assertNotDestroyed(this);
    this._onDestroyHooks.push(callback);
    return () => this.removeOnDestroy(callback);
  }

  override runInContext<ReturnT>(fn: () => ReturnT): ReturnT {
    assertNotDestroyed(this);

    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(undefined);

    let prevInjectContext: InjectorProfilerContext | undefined;
    if (ngDevMode) {
      prevInjectContext = setInjectorProfilerContext({injector: this, token: null});
    }

    try {
      return fn();
    } finally {
      setCurrentInjector(previousInjector);
      setInjectImplementation(previousInjectImplementation);
      ngDevMode && setInjectorProfilerContext(prevInjectContext!);
    }
  }

  override get<T>(
    token: ProviderToken<T>,
    notFoundValue: any = THROW_IF_NOT_FOUND,
    options?: InjectOptions,
  ): T {
    assertNotDestroyed(this);

    if (token.hasOwnProperty(NG_ENV_ID)) {
      return (token as any)[NG_ENV_ID](this);
    }

    const flags = convertToBitFlags(options) as InternalInjectFlags;

    // 주입 컨텍스트 설정
    let prevInjectContext: InjectorProfilerContext;
    if (ngDevMode) {
      prevInjectContext = setInjectorProfilerContext({injector: this, token: token as Type<T>});
    }
    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(undefined);
    try {
      // SkipSelf 플래그 확인
      if (!(flags & InternalInjectFlags.SkipSelf)) {
        // SkipSelf가 설정되지 않은 경우, 기록이 이 주입기에 속하는지 확인합니다.
        let record: Record<T> | undefined | null = this.records.get(token);
        if (record === undefined) {
          // 기록이 없지만, 토큰이 이 주입기에 대해 범위가 설정되어 있을 수 있습니다.
          const def = couldBeInjectableType(token) && getInjectableDef(token);
          if (def && this.injectableDefInScope(def)) {
            // 주입 가능한 정의를 찾았고, 이 주입기에 범위 설정됨.
            // 여기가 처음부터 있었던 것처럼 가장합니다.

            if (ngDevMode) {
              runInInjectorProfilerContext(this, token as Type<T>, () => {
                emitProviderConfiguredEvent(token as TypeProvider);
              });
            }

            record = makeRecord(injectableDefOrInjectorDefFactory(token), NOT_YET);
          } else {
            record = null;
          }
          this.records.set(token, record);
        }
        // 기록이 발견되면, 해당 인스턴스를 가져와서 반환합니다.
        if (record != null /* NOT null || undefined */) {
          return this.hydrate(token, record);
        }
      }

      // Self 플래그에 따라 다음 주입기를 선택합니다 - Self가 설정되면 NullInjector, 그렇지 않으면 부모가 됩니다.
      const nextInjector = !(flags & InternalInjectFlags.Self) ? this.parent : getNullInjector();
      // Optional 플래그에 따라 notFoundValue를 설정합니다 - optional이 설정되고 notFoundValue가 undefined인 경우
      // 값은 null이며, 그렇지 않으면 notFoundValue입니다.
      notFoundValue =
        flags & InternalInjectFlags.Optional && notFoundValue === THROW_IF_NOT_FOUND
          ? null
          : notFoundValue;
      return nextInjector.get(token, notFoundValue);
    } catch (e: any) {
      if (e.name === 'NullInjectorError') {
        const path: any[] = (e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || []);
        path.unshift(stringify(token));
        if (previousInjector) {
          // 여전히 부모 주입기가 있습니다. 계속해서 예외를 throw합니다.
          throw e;
        } else {
          // 이전 주입기가 없는 경우 마지막 오류 메시지를 형식화하고 throw합니다.
          return catchInjectorError(e, token, 'R3InjectorError', this.source);
        }
      } else {
        throw e;
      }
    } finally {
      // 마지막으로 이전 주입 컨텍스트를 복원합니다.
      setInjectImplementation(previousInjectImplementation);
      setCurrentInjector(previousInjector);
      ngDevMode && setInjectorProfilerContext(prevInjectContext!);
    }
  }

  /** @internal */
  resolveInjectorInitializers() {
    const prevConsumer = setActiveConsumer(null);
    const previousInjector = setCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(undefined);
    let prevInjectContext: InjectorProfilerContext | undefined;
    if (ngDevMode) {
      prevInjectContext = setInjectorProfilerContext({injector: this, token: null});
    }

    try {
      const initializers = this.get(ENVIRONMENT_INITIALIZER, EMPTY_ARRAY, {self: true});
      if (ngDevMode && !Array.isArray(initializers)) {
        throw new RuntimeError(
          RuntimeErrorCode.INVALID_MULTI_PROVIDER,
          '예상과 다른 `ENVIRONMENT_INITIALIZER` 토큰 값의 유형 ' +
            `(배열이 예상되지만 ${typeof initializers}가 확인됨). ` +
            '`ENVIRONMENT_INITIALIZER` 토큰이 ' +
            '`multi: true` 제공자로 구성되어 있는지 확인하십시오.',
        );
      }
      for (const initializer of initializers) {
        initializer();
      }
    } finally {
      setCurrentInjector(previousInjector);
      setInjectImplementation(previousInjectImplementation);
      ngDevMode && setInjectorProfilerContext(prevInjectContext!);
      setActiveConsumer(prevConsumer);
    }
  }

  override toString() {
    const tokens: string[] = [];
    const records = this.records;
    for (const token of records.keys()) {
      tokens.push(stringify(token));
    }
    return `R3Injector[${tokens.join(', ')}]`;
  }

  /**
   * `SingleProvider`를 처리하고 추가합니다.
   */
  private processProvider(provider: SingleProvider): void {
    // 공급자로부터 토큰을 결정합니다. 자기 자신의 토큰이거나 {provide: ...} 속성이 있습니다.
    provider = resolveForwardRef(provider);
    let token: any = isTypeProvider(provider)
      ? provider
      : resolveForwardRef(provider && provider.provide);

    // 공급자를 위한 `Record`를 생성합니다.
    const record = providerToRecord(provider);
    if (ngDevMode) {
      runInInjectorProfilerContext(this, token, () => {
        // 공급자가 값 제공자일 경우 InjectorProfilerEventType.Create를 발생시킵니다.
        // 그들만이 이 이벤트가 발생해야 하는 값 수화 로직을 통과하지 않기 때문입니다.
        if (isValueProvider(provider)) {
          emitInjectorToCreateInstanceEvent(token);
          emitInstanceCreatedByInjectorEvent(provider.useValue);
        }

        emitProviderConfiguredEvent(provider);
      });
    }

    if (!isTypeProvider(provider) && provider.multi === true) {
      // 공급자가 다중 공급자임을 나타내는 경우, 특별히 처리합니다.
      // 먼저 이미 정의되었는지 확인합니다.
      let multiRecord = this.records.get(token);
      if (multiRecord) {
        // 이미 있습니다.
        if (ngDevMode && multiRecord.multi === undefined) {
          throwMixedMultiProviderError();
        }
      } else {
        multiRecord = makeRecord(undefined, NOT_YET, true);
        multiRecord.factory = () => injectArgs(multiRecord!.multi!);
        this.records.set(token, multiRecord);
      }
      token = provider;
      multiRecord.multi!.push(provider);
    } else {
      if (ngDevMode) {
        const existing = this.records.get(token);
        if (existing && existing.multi !== undefined) {
          throwMixedMultiProviderError();
        }
      }
    }
    this.records.set(token, record);
  }

  private hydrate<T>(token: ProviderToken<T>, record: Record<T>): T {
    const prevConsumer = setActiveConsumer(null);
    try {
      if (record.value === CIRCULAR) {
        throwCyclicDependencyError(stringify(token));
      } else if (record.value === NOT_YET) {
        record.value = CIRCULAR;

        if (ngDevMode) {
          runInInjectorProfilerContext(this, token as Type<T>, () => {
            emitInjectorToCreateInstanceEvent(token);
            record.value = record.factory!();
            emitInstanceCreatedByInjectorEvent(record.value);
          });
        } else {
          record.value = record.factory!();
        }
      }
      if (typeof record.value === 'object' && record.value && hasOnDestroy(record.value)) {
        this._ngOnDestroyHooks.add(record.value);
      }
      return record.value as T;
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }

  private injectableDefInScope(def: ɵɵInjectableDeclaration<any>): boolean {
    if (!def.providedIn) {
      return false;
    }
    const providedIn = resolveForwardRef(def.providedIn);
    if (typeof providedIn === 'string') {
      return providedIn === 'any' || this.scopes.has(providedIn);
    } else {
      return this.injectorDefTypes.has(providedIn);
    }
  }

  private removeOnDestroy(callback: () => void): void {
    const destroyCBIdx = this._onDestroyHooks.indexOf(callback);
    if (destroyCBIdx !== -1) {
      this._onDestroyHooks.splice(destroyCBIdx, 1);
    }
  }
}

function injectableDefOrInjectorDefFactory(token: ProviderToken<any>): FactoryFn<any> {
  // 대부분의 토큰은 직접 팩토리를 지정하는 주입할 수 있는 정의를 가집니다.
  const injectableDef = getInjectableDef(token);
  const factory = injectableDef !== null ? injectableDef.factory : getFactoryDef(token);

  if (factory !== null) {
    return factory;
  }

  // InjectionTokens는 주입할 수 있는 정의(ɵprov)를 가져야 하며, 따라서 위에서 처리되어야 합니다.
  // 누락된 경우 오류입니다.
  if (token instanceof InjectionToken) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_INJECTION_TOKEN,
      ngDevMode && `토큰 ${stringify(token)}에 ɵprov 정의가 없습니다.`,
    );
  }

  // 인수를 갖지 않는 경우 비장식된 타입이 생성될 수 있습니다.
  if (token instanceof Function) {
    return getUndecoratedInjectableFactory(token);
  }

  // 이 토큰에 대해 팩토리를 해결할 방법이 없었습니다.
  throw new RuntimeError(RuntimeErrorCode.INVALID_INJECTION_TOKEN, ngDevMode && '도달 불가능');
}

function getUndecoratedInjectableFactory(token: Function) {
  // 토큰이 인수를 가지면 해결할 수 없는 종속성이 있습니다.
  const paramLength = token.length;
  if (paramLength > 0) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_INJECTION_TOKEN,
      ngDevMode &&
        `${stringify(token)}의 모든 매개변수를 해결할 수 없습니다: (${newArray(
          paramLength,
          '?',
        ).join(', ')}).`,
    );
  }

  // 생성자 함수는 인수가 없는 것으로 보입니다.
  // 이것은 상위 클래스에서 상속되기 때문일 수 있습니다. 이 경우, 조상이 있는 경우 주입 가능한 정의를 사용합니다.
  // 그렇지 않으면, 종속성이 없는 간단한 클래스이므로 인수가 없는 생성자를 단순히 인스턴스화하는 팩토리를 반환합니다.
  const inheritedInjectableDef = getInheritedInjectableDef(token);
  if (inheritedInjectableDef !== null) {
    return () => inheritedInjectableDef.factory(token as Type<any>);
  } else {
    return () => new (token as Type<any>)();
  }
}

function providerToRecord(provider: SingleProvider): Record<any> {
  if (isValueProvider(provider)) {
    return makeRecord(undefined, provider.useValue);
  } else {
    const factory: (() => any) | undefined = providerToFactory(provider);
    return makeRecord(factory, NOT_YET);
  }
}

/**
 * `SingleProvider`를 팩토리 함수로 변환합니다.
 *
 * @param provider 팩토리로 변환할 제공자
 */
export function providerToFactory(
  provider: SingleProvider,
  ngModuleType?: InjectorType<any>,
  providers?: any[],
): () => any {
  let factory: (() => any) | undefined = undefined;
  if (ngDevMode && isEnvironmentProviders(provider)) {
    throwInvalidProviderError(undefined, providers, provider);
  }

  if (isTypeProvider(provider)) {
    const unwrappedProvider = resolveForwardRef(provider);
    return getFactoryDef(unwrappedProvider) || injectableDefOrInjectorDefFactory(unwrappedProvider);
  } else {
    if (isValueProvider(provider)) {
      factory = () => resolveForwardRef(provider.useValue);
    } else if (isFactoryProvider(provider)) {
      factory = () => provider.useFactory(...injectArgs(provider.deps || []));
    } else if (isExistingProvider(provider)) {
      factory = () => ɵɵinject(resolveForwardRef(provider.useExisting));
    } else {
      const classRef = resolveForwardRef(
        provider &&
          ((provider as StaticClassProvider | ClassProvider).useClass || provider.provide),
      );
      if (ngDevMode && !classRef) {
        throwInvalidProviderError(ngModuleType, providers, provider);
      }
      if (hasDeps(provider)) {
        factory = () => new classRef(...injectArgs(provider.deps));
      } else {
        return getFactoryDef(classRef) || injectableDefOrInjectorDefFactory(classRef);
      }
    }
  }
  return factory;
}

export function assertNotDestroyed(injector: R3Injector): void {
  if (injector.destroyed) {
    throw new RuntimeError(
      RuntimeErrorCode.INJECTOR_ALREADY_DESTROYED,
      ngDevMode && '주입기가 이미 파괴되었습니다.',
    );
  }
}

function makeRecord<T>(
  factory: (() => T) | undefined,
  value: T | {},
  multi: boolean = false,
): Record<T> {
  return {
    factory: factory,
    value: value,
    multi: multi ? [] : undefined,
  };
}

function hasDeps(
  value: ClassProvider | ConstructorProvider | StaticClassProvider,
): value is ClassProvider & {deps: any[]} {
  return !!(value as any).deps;
}

function hasOnDestroy(value: any): value is OnDestroy {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as OnDestroy).ngOnDestroy === 'function'
  );
}

function couldBeInjectableType(value: any): value is ProviderToken<any> {
  return (
    typeof value === 'function' || (typeof value === 'object' && value instanceof InjectionToken)
  );
}

function forEachSingleProvider(
  providers: Array<Provider | EnvironmentProviders>,
  fn: (provider: SingleProvider) => void,
): void {
  for (const provider of providers) {
    if (Array.isArray(provider)) {
      forEachSingleProvider(provider, fn);
    } else if (provider && isEnvironmentProviders(provider)) {
      forEachSingleProvider(provider.ɵproviders, fn);
    } else {
      fn(provider as SingleProvider);
    }
  }
}
