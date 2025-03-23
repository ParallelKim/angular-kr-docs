/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  publishDefaultGlobalUtils,
  publishSignalConfiguration,
} from '../application/application_ref';
import {PLATFORM_INITIALIZER} from '../application/application_tokens';
import {
  EnvironmentProviders,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  runInInjectionContext,
  StaticProvider,
} from '../di';
import {INJECTOR_SCOPE} from '../di/scope';
import {RuntimeError, RuntimeErrorCode} from '../errors';

import {PlatformRef} from './platform_ref';
import {PLATFORM_DESTROY_LISTENERS} from './platform_destroy_listeners';

let _platformInjector: Injector | null = null;

/**
 * 다수의 부트스트랩된 플랫폼을 허용할지 여부를 나타내는 내부 토큰입니다 (기본적으로
 * 하나의 부트스트랩된 플랫폼만 허용됩니다). 이 토큰은 SSR 시나리오를 지원하는 데 도움이 됩니다.
 */
export const ALLOW_MULTIPLE_PLATFORMS = new InjectionToken<boolean>(
  ngDevMode ? 'AllowMultipleToken' : '',
);

/**
 * 플랫폼을 생성합니다.
 * 플랫폼은 이 함수를 사용하여 시작 시 생성되어야 합니다.
 *
 * @publicApi
 */
export function createPlatform(injector: Injector): PlatformRef {
  if (_platformInjector && !_platformInjector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
    throw new RuntimeError(
      RuntimeErrorCode.MULTIPLE_PLATFORMS,
      ngDevMode &&
        '플랫폼은 하나만 존재할 수 있습니다. 새 플랫폼을 만들기 위해 이전 플랫폼을 파괴하세요.',
    );
  }
  publishDefaultGlobalUtils();
  publishSignalConfiguration();
  _platformInjector = injector;
  const platform = injector.get(PlatformRef);
  runPlatformInitializers(injector);
  return platform;
}

/**
 * 플랫폼을 위한 팩토리를 생성합니다. 이를 사용하여 애플리케이션의 실행 시간 요구에 따라 `Providers`를 제공하거나 재정의할 수 있습니다.
 * 예: `PLATFORM_INITIALIZER` 및 `PLATFORM_ID`.
 * @param parentPlatformFactory 수정할 다른 플랫폼 팩토리입니다. 서로 다른 라이브러리나
 * 애플리케이션의 일부에 의해 요구될 수 있는 구성을 구성할 수 있습니다.
 * @param name 새 플랫폼 팩토리를 식별합니다.
 * @param providers 새 팩토리로 작성된 플랫폼을 위한 일련의 의존성 제공자입니다.
 *
 * @publicApi
 */
export function createPlatformFactory(
  parentPlatformFactory: ((extraProviders?: StaticProvider[]) => PlatformRef) | null,
  name: string,
  providers: StaticProvider[] = [],
): (extraProviders?: StaticProvider[]) => PlatformRef {
  const desc = `플랫폼: ${name}`;
  const marker = new InjectionToken(desc);
  return (extraProviders: StaticProvider[] = []) => {
    let platform = getPlatform();
    if (!platform || platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
      const platformProviders: StaticProvider[] = [
        ...providers,
        ...extraProviders,
        {provide: marker, useValue: true},
      ];
      if (parentPlatformFactory) {
        parentPlatformFactory(platformProviders);
      } else {
        createPlatform(createPlatformInjector(platformProviders, desc));
      }
    }
    return assertPlatform(marker);
  };
}

/**
 * '플랫폼' 범위를 유지하는 플랫폼 인젝터의 인스턴스를 생성하는 도우미 함수입니다.
 */
function createPlatformInjector(providers: StaticProvider[] = [], name?: string): Injector {
  return Injector.create({
    name,
    providers: [
      {provide: INJECTOR_SCOPE, useValue: 'platform'},
      {provide: PLATFORM_DESTROY_LISTENERS, useValue: new Set([() => (_platformInjector = null)])},
      ...providers,
    ],
  });
}

/**
 * 주어진 토큰이 제공자로 포함된 플랫폼이 현재 존재하는지 확인합니다.
 *
 * @publicApi
 */
export function assertPlatform(requiredToken: any): PlatformRef {
  const platform = getPlatform();

  if (!platform) {
    throw new RuntimeError(
      RuntimeErrorCode.PLATFORM_NOT_FOUND,
      ngDevMode && '플랫폼이 존재하지 않습니다!',
    );
  }

  if (
    (typeof ngDevMode === 'undefined' || ngDevMode) &&
    !platform.injector.get(requiredToken, null)
  ) {
    throw new RuntimeError(
      RuntimeErrorCode.MULTIPLE_PLATFORMS,
      '다른 구성으로 플랫폼이 생성되었습니다. 먼저 이를 파괴하십시오.',
    );
  }

  return platform;
}

/**
 * 현재 플랫폼을 반환합니다.
 *
 * @publicApi
 */
export function getPlatform(): PlatformRef | null {
  return _platformInjector?.get(PlatformRef) ?? null;
}

/**
 * 현재 Angular 플랫폼과 페이지의 모든 Angular 애플리케이션을 파괴합니다.
 * 플랫폼에 등록된 모든 모듈과 리스너를 파괴합니다.
 *
 * @publicApi
 */
export function destroyPlatform(): void {
  getPlatform()?.destroy();
}

/**
 * 이 함수의 목표는 플랫폼 인젝터를 부트스트랩하는 것이지만,
 * `PlatformRef` 클래스에 대한 참조는 피하는 것입니다.
 * 이 함수는 독립형 구성 요소를 부트스트랩하는 데 필요합니다.
 */
export function createOrReusePlatformInjector(providers: StaticProvider[] = []): Injector {
  // 플랫폼 인젝터가 이미 존재하면, 이는 플랫폼이 이미
  // 부트스트랩되었다는 것을 의미하며 추가 작업이 필요하지 않습니다.
  if (_platformInjector) return _platformInjector;

  publishDefaultGlobalUtils();
  // 그렇지 않으면, 새 플랫폼 인젝터를 설정하고 플랫폼 초기화기를 실행합니다.
  const injector = createPlatformInjector(providers);
  _platformInjector = injector;
  publishSignalConfiguration();
  runPlatformInitializers(injector);
  return injector;
}

/**
 * @description
 * 이 함수는 플랫폼 인젝터 초기화 시 실행될 초기화 함수를 제공합니다.
 *
 * 제공된 초기화 함수는 주입 컨텍스트에서 실행됩니다.
 *
 * 이전에는 이를 `PLATFORM_INITIALIZER` 토큰을 사용하여 수행했으나 현재는 더 이상 사용되지 않습니다.
 *
 * @see {@link PLATFORM_INITIALIZER}
 *
 * @publicApi
 */
export function providePlatformInitializer(initializerFn: () => void): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: PLATFORM_INITIALIZER,
      useValue: initializerFn,
      multi: true,
    },
  ]);
}

function runPlatformInitializers(injector: Injector): void {
  const inits = injector.get(PLATFORM_INITIALIZER, null);
  runInInjectionContext(injector, () => {
    inits?.forEach((init) => init());
  });
}
