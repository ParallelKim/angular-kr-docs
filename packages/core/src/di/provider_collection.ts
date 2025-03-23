/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {Type} from '../interface/type';
import {getComponentDef} from '../render3/def_getters';
import {getFactoryDef} from '../render3/definition_factory';
import {throwCyclicDependencyError, throwInvalidProviderError} from '../render3/errors_di';
import {stringifyForError} from '../render3/util/stringify_utils';
import {deepForEach} from '../util/array_utils';
import {EMPTY_ARRAY} from '../util/empty';
import {getClosureSafeProperty} from '../util/property';
import {stringify} from '../util/stringify';

import {resolveForwardRef} from './forward_ref';
import {ENVIRONMENT_INITIALIZER} from './initializer_token';
import {ɵɵinject as inject} from './injector_compatibility';
import {getInjectorDef, InjectorType, InjectorTypeWithProviders} from './interface/defs';
import {
  ClassProvider,
  ConstructorProvider,
  EnvironmentProviders,
  ExistingProvider,
  FactoryProvider,
  InternalEnvironmentProviders,
  isEnvironmentProviders,
  ModuleWithProviders,
  Provider,
  StaticClassProvider,
  TypeProvider,
  ValueProvider,
} from './interface/provider';
import {INJECTOR_DEF_TYPES} from './internal_tokens';

/**
 * `Provider`의 배열을 `EnvironmentProviders`로 감싸서 컴포넌트 주입기에서
 * 우발적으로 참조되는 것을 방지합니다.
 */
export function makeEnvironmentProviders(
  providers: (Provider | EnvironmentProviders)[],
): EnvironmentProviders {
  return {
    ɵproviders: providers,
  } as unknown as EnvironmentProviders;
}

/**
 * @description
 * 이 함수는 환경 주입기 구축 시 실행될 초기화 함수를 제공합니다.
 *
 * 제공된 초기화 함수는 주입 컨텍스트에서 실행됩니다.
 *
 * 이전에는 이 작업이 이제 더 이상 사용되지 않는 `ENVIRONMENT_INITIALIZER` 토큰을 사용하여 수행되었습니다.
 *
 * @see {@link ENVIRONMENT_INITIALIZER}
 *
 * @usageNotes
 * 다음 예는 `provideEnvironmentInitializer()`를 사용하여
 * 초기화 함수를 구성하는 방법을 설명합니다.
 * ```ts
 * createEnvironmentInjector(
 *   [
 *     provideEnvironmentInitializer(() => {
 *       console.log('환경 초기화됨');
 *     }),
 *   ],
 *   parentInjector
 * );
 * ```
 *
 * @publicApi
 */
export function provideEnvironmentInitializer(initializerFn: () => void): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: initializerFn,
    },
  ]);
}

/**
 * `importProvidersFrom` 함수의 제공자 출처.
 *
 * @publicApi
 */
export type ImportProvidersSource =
  | Type<unknown>
  | ModuleWithProviders<unknown>
  | Array<ImportProvidersSource>;

type WalkProviderTreeVisitor = (
  provider: SingleProvider,
  container: Type<unknown> | InjectorType<unknown>,
) => void;

/**
 * 모든 NgModule 및 독립형 컴포넌트에서 제공자를 수집하며,
 * 전이적으로 가져온 것들도 포함합니다.
 *
 * `importProvidersFrom`을 통해 추출된 제공자는
 * 응용 프로그램 주입기 또는 다른 환경 주입기(예: 라우트 주입기)에서만 사용 가능하며
 * 컴포넌트 제공자에서는 사용해서는 안 됩니다.
 *
 * 독립형 컴포넌트에 대한 자세한 정보는 [이 가이드](guide/components/importing)에서 확인할 수 있습니다.
 *
 * @usageNotes
 * `importProvidersFrom` 호출의 결과는 `bootstrapApplication` 호출에서 사용할 수 있습니다:
 *
 * ```ts
 * await bootstrapApplication(RootComponent, {
 *   providers: [
 *     importProvidersFrom(NgModuleOne, NgModuleTwo)
 *   ]
 * });
 * ```
 *
 * 독립형 컴포넌트를 사용할 때 라우트의 `providers` 필드에서도
 * `importProvidersFrom` 결과를 사용할 수 있습니다:
 *
 * ```ts
 * export const ROUTES: Route[] = [
 *   {
 *     path: 'foo',
 *     providers: [
 *       importProvidersFrom(NgModuleOne, NgModuleTwo)
 *     ],
 *     component: YourStandaloneComponent
 *   }
 * ];
 * ```
 *
 * @returns 지정된 타입 목록에서 수집된 제공자.
 * @publicApi
 */
export function importProvidersFrom(...sources: ImportProvidersSource[]): EnvironmentProviders {
  return {
    ɵproviders: internalImportProvidersFrom(true, sources),
    ɵfromNgModule: true,
  } as InternalEnvironmentProviders;
}

export function internalImportProvidersFrom(
  checkForStandaloneCmp: boolean,
  ...sources: ImportProvidersSource[]
): Provider[] {
  const providersOut: SingleProvider[] = [];
  const dedup = new Set<Type<unknown>>(); // 이미 본 타입들
  let injectorTypesWithProviders: InjectorTypeWithProviders<unknown>[] | undefined;

  const collectProviders: WalkProviderTreeVisitor = (provider) => {
    providersOut.push(provider);
  };

  deepForEach(sources, (source) => {
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && checkForStandaloneCmp) {
      const cmpDef = getComponentDef(source);
      if (cmpDef?.standalone) {
        throw new RuntimeError(
          RuntimeErrorCode.IMPORT_PROVIDERS_FROM_STANDALONE,
          `프로바이더 가져오기는 NgModule 또는 ModuleWithProviders를 지원하지만 독립형 컴포넌트 "${stringifyForError(
            source,
          )}"를 얻었습니다.`,
        );
      }
    }

    // `ModuleWithProviders`의 내부 타입 유사체에 접근하기 위해 `source`를 좁힙니다.
    const internalSource = source as Type<unknown> | InjectorTypeWithProviders<unknown>;
    if (walkProviderTree(internalSource, collectProviders, [], dedup)) {
      injectorTypesWithProviders ||= [];
      injectorTypesWithProviders.push(internalSource);
    }
  });
  // `ModuleWithProviders` 타입에서 모든 제공자를 수집합니다.
  if (injectorTypesWithProviders !== undefined) {
    processInjectorTypesWithProviders(injectorTypesWithProviders, collectProviders);
  }

  return providersOut;
}

/**
 * `ModuleWithProviders` 목록에서 모든 제공자를 수집하고 제공된 배열에 추가합니다.
 */
function processInjectorTypesWithProviders(
  typesWithProviders: InjectorTypeWithProviders<unknown>[],
  visitor: WalkProviderTreeVisitor,
): void {
  for (let i = 0; i < typesWithProviders.length; i++) {
    const {ngModule, providers} = typesWithProviders[i];
    deepForEachProvider(
      providers! as Array<Provider | InternalEnvironmentProviders>,
      (provider) => {
        ngDevMode && validateProvider(provider, providers || EMPTY_ARRAY, ngModule);
        visitor(provider, ngModule);
      },
    );
  }
}

/**
 * 깊은 제공자 배열의 단일 제공자에 대한 내부 타입입니다.
 */
export type SingleProvider =
  | TypeProvider
  | ValueProvider
  | ClassProvider
  | ConstructorProvider
  | ExistingProvider
  | FactoryProvider
  | StaticClassProvider;

/**
 * 이 로직은 `InjectorType`, `InjectorTypeWithProviders` 또는 독립형
 * `ComponentType`를 방문하고 모든 전이적 제공자를 수집합니다.
 *
 * 제공자 외에 제공자를 선언하는 `InjectorTypeWithProviders`가 지정되면,
 * 이 함수는 제공자 형식 정의를 처리해야 함을 나타내기 위해 "true"를 반환합니다.
 * 이로 인해 주입기 정의의 모든 가져오기가 처리된 후 주입기 형식의 제공자를 처리할 수 있습니다.
 * (View Engine 의미론에 따름: FW-1349 참조)
 */
export function walkProviderTree(
  container: Type<unknown> | InjectorTypeWithProviders<unknown>,
  visitor: WalkProviderTreeVisitor,
  parents: Type<unknown>[],
  dedup: Set<Type<unknown>>,
): container is InjectorTypeWithProviders<unknown> {
  container = resolveForwardRef(container);
  if (!container) return false;

  // 정의를 가진 실제 타입. 일반적으로 `container`이지만,
  // `InjectorTypeWithProviders`의 언랩된 타입일 수 있습니다.
  let defType: Type<unknown> | null = null;

  let injDef = getInjectorDef(container);
  const cmpDef = !injDef && getComponentDef(container);
  if (!injDef && !cmpDef) {
    // `container`는 주입기 유형이나 컴포넌트 유형이 아닙니다. 다음일 수 있습니다:
    //  * 주입기 유형을 감싸는 `InjectorTypeWithProviders`.
    //  * 독립형 컴포넌트의 종속성에서 끌어온 독립형 지시자 또는 파이프.
    // 먼저 `InjectorTypeWithProviders`로 언랩하려고 시도합니다.
    const ngModule: Type<unknown> | undefined = (container as InjectorTypeWithProviders<any>)
      .ngModule as Type<unknown> | undefined;
    injDef = getInjectorDef(ngModule);
    if (injDef) {
      defType = ngModule!;
    } else {
      // 컴포넌트나 주입기 타입이 아니므로 무시합니다.
      return false;
    }
  } else if (cmpDef && !cmpDef.standalone) {
    return false;
  } else {
    defType = container as Type<unknown>;
  }

  // 순환 종속성을 확인합니다.
  if (ngDevMode && parents.indexOf(defType) !== -1) {
    const defName = stringify(defType);
    const path = parents.map(stringify);
    throwCyclicDependencyError(defName, path);
  }

  // 동일한 모듈의 여러 가져오기를 확인합니다.
  const isDuplicate = dedup.has(defType);

  if (cmpDef) {
    if (isDuplicate) {
      // 이 컴포넌트 정의는 이미 처리되었습니다.
      return false;
    }
    dedup.add(defType);

    if (cmpDef.dependencies) {
      const deps =
        typeof cmpDef.dependencies === 'function' ? cmpDef.dependencies() : cmpDef.dependencies;
      for (const dep of deps) {
        walkProviderTree(dep, visitor, parents, dedup);
      }
    }
  } else if (injDef) {
    // 먼저, 모든 가져오기에서 제공자를 포함합니다.
    if (injDef.imports != null && !isDuplicate) {
      // defType의 가져오기를 처리하기 전에 부모 목록에 추가합니다.
      // 이렇게 하면 깊게 자기 자신을 가져오는 경우 감지할 수 있습니다.
      ngDevMode && parents.push(defType);
      // 동일한 모듈의 여러 가져오기를 감지할 수 있도록 dedup에 추가합니다.
      dedup.add(defType);

      let importTypesWithProviders: InjectorTypeWithProviders<any>[] | undefined;
      try {
        deepForEach(injDef.imports, (imported) => {
          if (walkProviderTree(imported, visitor, parents, dedup)) {
            importTypesWithProviders ||= [];
            // 처리된 가져오리가 제공자를 가진 주입기 유형이라면
            // 제공자 목록에 저장하여 이후에 처리할 수 있도록 합니다.
            importTypesWithProviders.push(imported);
          }
        });
      } finally {
        // 작업이 끝나면 부모 목록에서 제거합니다.
        ngDevMode && parents.pop();
      }

      // 제공자를 가진(형 타이프)으로 선언된 가져오는 것은
      // 모든 가져온 모듈이 처리된 후 처리되어야 합니다.
      // 이는 View Engine이 메타데이터 리졸버에서 모듈 가져오기를
      // 처리/병합하는 방법과 유사합니다. FW-1349 참조.
      if (importTypesWithProviders !== undefined) {
        processInjectorTypesWithProviders(importTypesWithProviders, visitor);
      }
    }

    if (!isDuplicate) {
      // InjectorType을 추적하고 그에 대한 제공자를 추가합니다.
      // def의 가져오기 후에 이것이 중요합니다.
      const factory = getFactoryDef(defType) || (() => new defType!());

      // 소비자(주입기 유형 검색)뿐만 아니라 내부적으로
      // 주입 범위를 올바르게 계산하고 `defType`을 조기에 인스턴스화하기 위해
      // 추가 제공자를 추가합니다.

      // 팩토리를 사용하여 `defType`을 생성하는 제공자.
      visitor({provide: defType, useFactory: factory, deps: EMPTY_ARRAY}, defType);

      // 주입기 범위를 계산하는 내부 로직에
      // 이 `defType`을 사용 가능하게 합니다.
      visitor({provide: INJECTOR_DEF_TYPES, useValue: defType, multi: true}, defType);

      // `INJECTOR_INITIALIZER`를 통해 `defType`을 조기에 인스턴스화하는 제공자.
      visitor(
        {provide: ENVIRONMENT_INITIALIZER, useValue: () => inject(defType!), multi: true},
        defType,
      );
    }

    // 다음으로, 정의 자체에 나열된 제공자를 포함합니다.
    const defProviders = injDef.providers as Array<SingleProvider | InternalEnvironmentProviders>;
    if (defProviders != null && !isDuplicate) {
      const injectorType = container as InjectorType<any>;
      deepForEachProvider(defProviders, (provider) => {
        ngDevMode && validateProvider(provider as SingleProvider, defProviders, injectorType);
        visitor(provider, injectorType);
      });
    }
  } else {
    // 발생해서는 안되지만 만일에 대비하여.
    return false;
  }

  return (
    defType !== container && (container as InjectorTypeWithProviders<any>).providers !== undefined
  );
}

function validateProvider(
  provider: SingleProvider,
  providers: Array<SingleProvider | InternalEnvironmentProviders>,
  containerType: Type<unknown>,
): void {
  if (
    isTypeProvider(provider) ||
    isValueProvider(provider) ||
    isFactoryProvider(provider) ||
    isExistingProvider(provider)
  ) {
    return;
  }

  // 여기서는 제공자가 `useClass` 제공자여야 한다고 기대합니다(제외).
  const classRef = resolveForwardRef(
    provider && ((provider as StaticClassProvider | ClassProvider).useClass || provider.provide),
  );
  if (!classRef) {
    throwInvalidProviderError(containerType, providers, provider);
  }
}

function deepForEachProvider(
  providers: Array<Provider | InternalEnvironmentProviders>,
  fn: (provider: SingleProvider) => void,
): void {
  for (let provider of providers) {
    if (isEnvironmentProviders(provider)) {
      provider = provider.ɵproviders;
    }
    if (Array.isArray(provider)) {
      deepForEachProvider(provider, fn);
    } else {
      fn(provider);
    }
  }
}

export const USE_VALUE = getClosureSafeProperty<ValueProvider>({
  provide: String,
  useValue: getClosureSafeProperty,
});

export function isValueProvider(value: SingleProvider): value is ValueProvider {
  return value !== null && typeof value == 'object' && USE_VALUE in value;
}

export function isExistingProvider(value: SingleProvider): value is ExistingProvider {
  return !!(value && (value as ExistingProvider).useExisting);
}

export function isFactoryProvider(value: SingleProvider): value is FactoryProvider {
  return !!(value && (value as FactoryProvider).useFactory);
}

export function isTypeProvider(value: SingleProvider): value is TypeProvider {
  return typeof value === 'function';
}

export function isClassProvider(value: SingleProvider): value is ClassProvider {
  return !!(value as StaticClassProvider | ClassProvider).useClass;
}
