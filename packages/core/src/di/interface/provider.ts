/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../../interface/type';

/**
 * `Injector`가 토큰에 대한 값을 반환하도록 구성합니다.
 * `ValueProvider` 데코레이터의 기반입니다.
 *
 * @publicApi
 */
export interface ValueSansProvider {
  /**
   * 주입할 값.
   */
  useValue: any;
}

/**
 * `Injector`가 토큰에 대한 값을 반환하도록 구성합니다.
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @usageNotes
 *
 * ### 예제
 *
 * {@example core/di/ts/provider_spec.ts region='ValueProvider'}
 *
 * ### 다중 값 예제
 *
 * {@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * @publicApi
 */
export interface ValueProvider extends ValueSansProvider {
  /**
   * 주입 토큰. 일반적으로 `Type` 또는 `InjectionToken`의 인스턴스지만 `any`일 수 있습니다.
   */
  provide: any;

  /**
   * true인 경우, injector는 인스턴스 배열을 반환합니다. 이는 여러 파일에 분산된
   * 여러 프로바이더가 공통 토큰에 구성 정보를 제공하는 데 유용합니다.
   */
  multi?: boolean;
}

/**
 * `Injector`가 토큰에 대한 `useClass` 인스턴스를 반환하도록 구성합니다.
 * `StaticClassProvider` 데코레이터의 기반입니다.
 *
 * @publicApi
 */
export interface StaticClassSansProvider {
  /**
   * `token`에 대해 인스턴스화할 선택적 클래스. 기본적으로 `provide`
   * 클래스가 인스턴스화됩니다.
   */
  useClass: Type<any>;

  /**
   * injector에 의해 해결될 `token` 목록입니다. 값 목록은
   * `useClass` 생성자에 대한 인수로 사용됩니다.
   */
  deps: any[];
}

/**
 * `Injector`가 토큰에 대한 `useClass` 인스턴스를 반환하도록 구성합니다.
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @usageNotes
 *
 * {@example core/di/ts/provider_spec.ts region='StaticClassProvider'}
 *
 * 다음 두 프로바이더는 같지 않음에 유의하십시오:
 *
 * {@example core/di/ts/provider_spec.ts region='StaticClassProviderDifference'}
 *
 * ### 다중 값 예제
 *
 * {@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * @publicApi
 */
export interface StaticClassProvider extends StaticClassSansProvider {
  /**
   * 주입 토큰. 일반적으로 `Type` 또는 `InjectionToken`의 인스턴스지만 `any`일 수 있습니다.
   */
  provide: any;

  /**
   * true인 경우, injector는 인스턴스 배열을 반환합니다. 이는 여러 파일에 분산된
   * 여러 프로바이더가 공통 토큰에 구성 정보를 제공하는 데 유용합니다.
   */
  multi?: boolean;
}

/**
 * `Injector`가 토큰의 인스턴스를 반환하도록 구성합니다.
 *
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @usageNotes
 *
 * ```ts
 * @Injectable(SomeModule, {deps: []})
 * class MyService {}
 * ```
 *
 * @publicApi
 */
export interface ConstructorSansProvider {
  /**
   * injector에 의해 해결될 `token` 목록입니다.
   */
  deps?: any[];
}

/**
 * `Injector`가 토큰의 인스턴스를 반환하도록 구성합니다.
 *
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @usageNotes
 *
 * {@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
 *
 * ### 다중 값 예제
 *
 * {@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * @publicApi
 */
export interface ConstructorProvider extends ConstructorSansProvider {
  /**
   * 주입 토큰. 일반적으로 `Type` 또는 `InjectionToken`의 인스턴스지만 `any`일 수 있습니다.
   */
  provide: Type<any>;

  /**
   * true인 경우, injector는 인스턴스 배열을 반환합니다. 이는 여러 파일에 분산된
   * 여러 프로바이더가 공통 토큰에 구성 정보를 제공하는 데 유용합니다.
   */
  multi?: boolean;
}

/**
 * 또 다른 `useExisting` 토큰의 값을 반환하도록 `Injector`를 구성합니다.
 *
 * @see {@link ExistingProvider}
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @publicApi
 */
export interface ExistingSansProvider {
  /**
   * 반환할 기존 `token`. (Equivalent to `injector.get(useExisting)`)
   */
  useExisting: any;
}

/**
 * 또 다른 `useExisting` 토큰의 값을 반환하도록 `Injector`를 구성합니다.
 *
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @usageNotes
 *
 * {@example core/di/ts/provider_spec.ts region='ExistingProvider'}
 *
 * ### 다중 값 예제
 *
 * {@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * @publicApi
 */
export interface ExistingProvider extends ExistingSansProvider {
  /**
   * 주입 토큰. 일반적으로 `Type` 또는 `InjectionToken`의 인스턴스지만 `any`일 수 있습니다.
   */
  provide: any;

  /**
   * true인 경우, injector는 인스턴스 배열을 반환합니다. 이는 여러 파일에 분산된
   * 여러 프로바이더가 공통 토큰에 구성 정보를 제공하는 데 유용합니다.
   */
  multi?: boolean;
}

/**
 * `useFactory` 함수를 호출하여 값을 반환하도록 `Injector`를 구성합니다.
 *
 * @see {@link FactoryProvider}
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @publicApi
 */
export interface FactorySansProvider {
  /**
   * 이 `token`에 대한 값을 생성하기 위해 호출할 함수. 함수는
   * `deps` 필드에 있는 `token`의 해결된 값으로 호출됩니다.
   */
  useFactory: Function;

  /**
   * injector에 의해 해결될 `token` 목록입니다. 값 목록은
   * `useFactory` 함수에 대한 인수로 사용됩니다.
   */
  deps?: any[];
}

/**
 * `useFactory` 함수를 호출하여 값을 반환하도록 `Injector`를 구성합니다.
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @usageNotes
 *
 * {@example core/di/ts/provider_spec.ts region='FactoryProvider'}
 *
 * 종속성은 선택적일 수도 있습니다:
 *
 * {@example core/di/ts/provider_spec.ts region='FactoryProviderOptionalDeps'}
 *
 * ### 다중 값 예제
 *
 * {@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * @publicApi
 */
export interface FactoryProvider extends FactorySansProvider {
  /**
   * 주입 토큰. (일반적으로 `Type` 또는 `InjectionToken`의 인스턴스이지만 `any`일 수 있습니다).
   */
  provide: any;

  /**
   * true인 경우, injector는 인스턴스 배열을 반환합니다. 이는 여러 파일에 분산된
   * 여러 프로바이더가 공통 토큰에 구성 정보를 제공하는 데 유용합니다.
   */
  multi?: boolean;
}

/**
 * `Injector`가 정적으로 구성되어야 함을 기술합니다 (즉, 반사가 없이).
 * 정적 프로바이더는 다양한 종속성 유형에 대해 injector에 토큰을 제공합니다.
 *
 * @see {@link Injector.create()}
 * @see [의존성 주입 가이드](guide/di/dependency-injection-providers).
 *
 * @publicApi
 */
export type StaticProvider =
  | ValueProvider
  | ExistingProvider
  | StaticClassProvider
  | ConstructorProvider
  | FactoryProvider
  | any[];

/**
 * `Type`이 토큰으로 사용될 때 `Injector`가 `Type`의 인스턴스를 반환하도록 구성합니다.
 *
 * `new` 연산자를 호출하고 추가 인자를 제공합니다.
 * 이 형식은 `TypeProvider`의 축약형입니다;
 *
 * 자세한 내용은 ["의존성 주입 가이드"](guide/di/dependency-injection)를 참조하십시오.
 *
 * @usageNotes
 *
 * {@example core/di/ts/provider_spec.ts region='TypeProvider'}
 *
 * @publicApi
 */
export interface TypeProvider extends Type<any> {}

/**
 * `useClass` 함수를 호출하여 값을 반환하도록 `Injector`를 구성합니다.
 * `ClassProvider` 데코레이터의 기반입니다.
 *
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @publicApi
 */
export interface ClassSansProvider {
  /**
   * `token`에 대해 인스턴스화할 클래스.
   */
  useClass: Type<any>;
}

/**
 * `Injector`가 토큰에 대한 `useClass` 인스턴스를 반환하도록 구성합니다.
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @usageNotes
 *
 * {@example core/di/ts/provider_spec.ts region='ClassProvider'}
 *
 * 다음 두 프로바이더는 같지 않음에 유의하십시오:
 *
 * {@example core/di/ts/provider_spec.ts region='ClassProviderDifference'}
 *
 * ### 다중 값 예제
 *
 * {@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * @publicApi
 */
export interface ClassProvider extends ClassSansProvider {
  /**
   * 주입 토큰. (일반적으로 `Type` 또는 `InjectionToken`의 인스턴스지만 `any`일 수 있습니다).
   */
  provide: any;

  /**
   * true인 경우, injector는 인스턴스 배열을 반환합니다. 이는 여러 파일에 분산된
   * 여러 프로바이더가 공통 토큰에 구성 정보를 제공하는 데 유용합니다.
   */
  multi?: boolean;
}

/**
 * `Injector`를 구성하는 방법을 설명합니다.
 * @see [의존성 주입 가이드](guide/di/dependency-injection).
 *
 * @see {@link StaticProvider}
 *
 * @publicApi
 */
export type Provider =
  | TypeProvider
  | ValueProvider
  | ClassProvider
  | ConstructorProvider
  | ExistingProvider
  | FactoryProvider
  | any[];

/**
 * `EnvironmentInjector`를 생성하는 동안만 허용되는 `Provider`s을 캡슐화합니다 (예를 들어
 * `NgModule`에서).
 *
 * 이 래퍼 타입을 사용하면 애플리케이션/환경 주입기에만 적합한 프로바이더가
 * 실수로 `@Component.providers`에 포함되어 구성 요소 주입기에 포함되는 것을 방지합니다.
 *
 * 이 래퍼 타입은 내부의 `Provider`s에 대한 접근을 방지합니다.
 *
 * @see {@link makeEnvironmentProviders}
 * @see {@link importProvidersFrom}
 *
 * @publicApi
 */
export type EnvironmentProviders = {
  ɵbrand: 'EnvironmentProviders';
};

export interface InternalEnvironmentProviders extends EnvironmentProviders {
  ɵproviders: (Provider | EnvironmentProviders)[];

  /**
   * 존재하는 경우, `EnvironmentProviders`가 NgModule 프로바이더에서 파생되었음을 나타냅니다.
   *
   * 이는 더 명확한 오류 메시지를 생성하는 데 사용됩니다.
   */
  ɵfromNgModule?: true;
}

export function isEnvironmentProviders(
  value: Provider | EnvironmentProviders | InternalEnvironmentProviders,
): value is InternalEnvironmentProviders {
  return value && !!(value as InternalEnvironmentProviders).ɵproviders;
}

/**
 * 프로바이더 목록(예: 프로바이더 오버라이드)을 처리하는 데 사용되는 함수를 설명합니다.
 */
export type ProcessProvidersFunction = (providers: Provider[]) => Provider[];

/**
 * 프로바이더와 연결된 NgModule 주변 래퍼
 * 일반 유형 없이 사용하는 것은 더 이상 권장되지 않습니다.
 *
 * @publicApi
 */
export interface ModuleWithProviders<T> {
  ngModule: Type<T>;
  providers?: Array<Provider | EnvironmentProviders>;
}

/**
 * `importProvidersFrom` 함수를 통해 NgModules에서 가져온 프로바이더.
 *
 * 이러한 프로바이더는 애플리케이션 주입기(또는 기타 환경 주입기)에서 사용되며
 * 구성 요소 주입기에서 사용해서는 안 됩니다.
 *
 * 이 유형은 직접 구현할 수 없습니다. 이는 `importProvidersFrom` 함수에서 반환되며
 * 잘못된 컨텍스트에서 추출된 NgModule 프로바이더가 사용되지 않도록 방지합니다.
 *
 * @see {@link importProvidersFrom}
 *
 * @publicApi
 * @deprecated `EnvironmentProviders`로 대체됨
 */
export type ImportedNgModuleProviders = EnvironmentProviders;
