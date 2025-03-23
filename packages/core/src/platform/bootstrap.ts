/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {Subscription} from 'rxjs';

import {PROVIDED_NG_ZONE} from '../change_detection/scheduling/ng_zone_scheduling';
import {R3Injector} from '../di/r3_injector';
import {ErrorHandler} from '../error_handler';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {DEFAULT_LOCALE_ID} from '../i18n/localization';
import {LOCALE_ID} from '../i18n/tokens';
import {ImagePerformanceWarning} from '../image_performance_warning';
import {Type} from '../interface/type';
import {PLATFORM_DESTROY_LISTENERS} from './platform_destroy_listeners';
import {setLocaleId} from '../render3/i18n/i18n_locale_id';
import {NgZone} from '../zone/ng_zone';

import {ApplicationInitStatus} from '../application/application_init';
import {ApplicationRef, remove} from '../application/application_ref';
import {PROVIDED_ZONELESS} from '../change_detection/scheduling/zoneless_scheduling';
import {InjectionToken, Injector} from '../di';
import {InternalNgModuleRef, NgModuleRef} from '../linker/ng_module_factory';
import {stringify} from '../util/stringify';
import {isPromise} from '../util/lang';

/**
 * 루트 컴포넌트 부트스트랩 동작을 제어하는 InjectionToken입니다.
 *
 * 이 토큰은 주로 Angular의 서버 측 렌더링(SSR) 시나리오에서 사용되며,
 * 특히 `@angular/ssr` 패키지에서 애플리케이션 초기화 과정 중에
 * 루트 컴포넌트를 부트스트랩해야 하는지를 관리합니다.
 *
 * ## 목적:
 * SSR 경로 추출 중 이 토큰을 `false`로 설정하면 Angular가 루트 컴포넌트를
 * 부트스트랩하는 것을 방지합니다. 이는 불필요한 컴포넌트 렌더링을 피하고
 * 추가 API를 요구하거나 컴포넌트 논리를 트리거하지 않고도 경로 추출을 가능하게 합니다.
 *
 * ## 동작:
 * - **`false`**: 루트 컴포넌트의 부트스트랩을 방지합니다.
 * - **`true`** (기본값): 정상적인 루트 컴포넌트 부트스트랩 프로세스를 진행합니다.
 *
 * 이 메커니즘은 SSR이 컴포넌트 렌더링과 경로 추출 로직을 효율적으로 분리할 수 있게 합니다.
 */
export const ENABLE_ROOT_COMPONENT_BOOTSTRAP = new InjectionToken<boolean>(
  ngDevMode ? 'ENABLE_ROOT_COMPONENT_BOOTSTRAP' : '',
);

export interface BootstrapConfig {
  platformInjector: Injector;
}

export interface ModuleBootstrapConfig<M> extends BootstrapConfig {
  moduleRef: InternalNgModuleRef<M>;
  allPlatformModules: NgModuleRef<unknown>[];
}

export interface ApplicationBootstrapConfig extends BootstrapConfig {
  r3Injector: R3Injector;
  rootComponent: Type<unknown> | undefined;
}

function isApplicationBootstrapConfig(
  config: ApplicationBootstrapConfig | ModuleBootstrapConfig<unknown>,
): config is ApplicationBootstrapConfig {
  return !(config as ModuleBootstrapConfig<unknown>).moduleRef;
}

export function bootstrap<M>(
  moduleBootstrapConfig: ModuleBootstrapConfig<M>,
): Promise<NgModuleRef<M>>;
export function bootstrap(
  applicationBootstrapConfig: ApplicationBootstrapConfig,
): Promise<ApplicationRef>;
export function bootstrap<M>(
  config: ModuleBootstrapConfig<M> | ApplicationBootstrapConfig,
): Promise<ApplicationRef> | Promise<NgModuleRef<M>> {
  const envInjector = isApplicationBootstrapConfig(config)
    ? config.r3Injector
    : config.moduleRef.injector;
  const ngZone = envInjector.get(NgZone);
  return ngZone.run(() => {
    if (isApplicationBootstrapConfig(config)) {
      config.r3Injector.resolveInjectorInitializers();
    } else {
      config.moduleRef.resolveInjectorInitializers();
    }
    const exceptionHandler = envInjector.get(ErrorHandler, null);
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (exceptionHandler === null) {
        const errorMessage = isApplicationBootstrapConfig(config)
          ? 'Dependency Injection 트리에서 `ErrorHandler`를 찾을 수 없습니다.'
          : 'ErrorHandler가 없습니다. 플랫폼 모듈(BrowserModule)이 포함되어 있습니까?';
        throw new RuntimeError(
          RuntimeErrorCode.MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP,
          errorMessage,
        );
      }
      if (envInjector.get(PROVIDED_ZONELESS) && envInjector.get(PROVIDED_NG_ZONE)) {
        throw new RuntimeError(
          RuntimeErrorCode.PROVIDED_BOTH_ZONE_AND_ZONELESS,
          '잘못된 변경 감지 구성: ' +
            'provideZoneChangeDetection과 provideExperimentalZonelessChangeDetection을 함께 사용할 수 없습니다.',
        );
      }
    }

    let onErrorSubscription: Subscription;
    ngZone.runOutsideAngular(() => {
      onErrorSubscription = ngZone.onError.subscribe({
        next: (error: any) => {
          exceptionHandler!.handleError(error);
        },
      });
    });

    // 플랫폼이 완전히 파괴되면 부트스트랩된 모든 애플리케이션에 대해 `destroy` 메서드를 호출합니다.
    if (isApplicationBootstrapConfig(config)) {
      const destroyListener = () => envInjector.destroy();
      const onPlatformDestroyListeners = config.platformInjector.get(PLATFORM_DESTROY_LISTENERS);
      onPlatformDestroyListeners.add(destroyListener);

      envInjector.onDestroy(() => {
        onErrorSubscription.unsubscribe();
        onPlatformDestroyListeners.delete(destroyListener);
      });
    } else {
      const destroyListener = () => config.moduleRef.destroy();
      const onPlatformDestroyListeners = config.platformInjector.get(PLATFORM_DESTROY_LISTENERS);
      onPlatformDestroyListeners.add(destroyListener);

      config.moduleRef.onDestroy(() => {
        remove(config.allPlatformModules, config.moduleRef);
        onErrorSubscription.unsubscribe();
        onPlatformDestroyListeners.delete(destroyListener);
      });
    }

    return _callAndReportToErrorHandler(exceptionHandler!, ngZone, () => {
      const initStatus = envInjector.get(ApplicationInitStatus);
      initStatus.runInitializers();

      return initStatus.donePromise.then(() => {
        // 부트스트랩 시 `LOCALE_ID` 제공자가 정의되어 있다면 ivy의 값을 설정합니다.
        const localeId = envInjector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
        setLocaleId(localeId || DEFAULT_LOCALE_ID);

        const enableRootComponentBoostrap = envInjector.get(ENABLE_ROOT_COMPONENT_BOOTSTRAP, true);
        if (!enableRootComponentBoostrap) {
          if (isApplicationBootstrapConfig(config)) {
            return envInjector.get(ApplicationRef);
          }

          config.allPlatformModules.push(config.moduleRef);
          return config.moduleRef;
        }

        if (typeof ngDevMode === 'undefined' || ngDevMode) {
          const imagePerformanceService = envInjector.get(ImagePerformanceWarning);
          imagePerformanceService.start();
        }

        if (isApplicationBootstrapConfig(config)) {
          const appRef = envInjector.get(ApplicationRef);
          if (config.rootComponent !== undefined) {
            appRef.bootstrap(config.rootComponent);
          }
          return appRef;
        } else {
          moduleDoBootstrap(config.moduleRef, config.allPlatformModules);
          return config.moduleRef;
        }
      });
    });
  });
}

function moduleDoBootstrap(
  moduleRef: InternalNgModuleRef<any>,
  allPlatformModules: NgModuleRef<unknown>[],
): void {
  const appRef = moduleRef.injector.get(ApplicationRef);
  if (moduleRef._bootstrapComponents.length > 0) {
    moduleRef._bootstrapComponents.forEach((f) => appRef.bootstrap(f));
  } else if (moduleRef.instance.ngDoBootstrap) {
    moduleRef.instance.ngDoBootstrap(appRef);
  } else {
    throw new RuntimeError(
      RuntimeErrorCode.BOOTSTRAP_COMPONENTS_NOT_FOUND,
      ngDevMode &&
        `모듈 ${stringify(moduleRef.instance.constructor)}이(가) 부트스트랩되었지만, ` +
          `“@NgModule.bootstrap” 컴포넌트 또는 “ngDoBootstrap” 메서드를 선언하지 않았습니다. ` +
          `이 중 하나를 정의하십시오.`,
    );
  }
  allPlatformModules.push(moduleRef);
}

function _callAndReportToErrorHandler(
  errorHandler: ErrorHandler,
  ngZone: NgZone,
  callback: () => any,
): any {
  try {
    const result = callback();
    if (isPromise(result)) {
      return result.catch((e: any) => {
        ngZone.runOutsideAngular(() => errorHandler.handleError(e));
        // 예외 처리기가 이를 하지 않을 수 있으므로 다시 던집니다.
        throw e;
      });
    }

    return result;
  } catch (e) {
    ngZone.runOutsideAngular(() => errorHandler.handleError(e));
    // 예외 처리기가 이를 하지 않을 수 있으므로 다시 던집니다.
    throw e;
  }
}
