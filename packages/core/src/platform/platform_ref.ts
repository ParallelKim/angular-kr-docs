/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {compileNgModuleFactory} from '../application/application_ngmodule_factory_compiler';
import {BootstrapOptions, optionsReducer} from '../application/application_ref';
import {
  getNgZoneOptions,
  internalProvideZoneChangeDetection,
} from '../change_detection/scheduling/ng_zone_scheduling';
import {ChangeDetectionScheduler} from '../change_detection/scheduling/zoneless_scheduling';
import {ChangeDetectionSchedulerImpl} from '../change_detection/scheduling/zoneless_scheduling_impl';
import {Injectable, Injector} from '../di';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {Type} from '../interface/type';
import {CompilerOptions} from '../linker';
import {NgModuleFactory, NgModuleRef} from '../linker/ng_module_factory';
import {createNgModuleRefWithProviders} from '../render3/ng_module_ref';
import {getNgZone, NgZone} from '../zone/ng_zone';
import {bootstrap} from './bootstrap';
import {PLATFORM_DESTROY_LISTENERS} from './platform_destroy_listeners';

/**
 * Angular 플랫폼은 웹 페이지에서 Angular의 진입점입니다.
 * 각 페이지에는 정확히 하나의 플랫폼이 있습니다. 반사와 같은 서비스는
 * 페이지에서 실행되는 모든 Angular 애플리케이션에 공통적으로 바인딩됩니다.
 * 페이지의 플랫폼은 `PlatformBrowser`와 같은 플랫폼 팩토리를 사용하여 플랫폼을 생성할 때 암묵적으로 초기화되거나,
 * `createPlatform()` 함수를 호출하여 명시적으로 초기화됩니다.
 *
 * @publicApi
 */
@Injectable({providedIn: 'platform'})
export class PlatformRef {
  private _modules: NgModuleRef<any>[] = [];
  private _destroyListeners: Array<() => void> = [];
  private _destroyed: boolean = false;

  /** @internal */
  constructor(private _injector: Injector) {}

  /**
   * 주어진 플랫폼에 대한 `@NgModule` 인스턴스를 생성합니다.
   *
   * @deprecated `PlatformRef.bootstrapModuleFactory` 함수 인수로 NgModule 팩토리를 전달하는 것은 더 이상 권장되지 않습니다.
   * 대신 `PlatformRef.bootstrapModule` API를 사용하십시오.
   */
  bootstrapModuleFactory<M>(
    moduleFactory: NgModuleFactory<M>,
    options?: BootstrapOptions,
  ): Promise<NgModuleRef<M>> {
    const scheduleInRootZone = (options as any)?.scheduleInRootZone;
    const ngZoneFactory = () =>
      getNgZone(options?.ngZone, {
        ...getNgZoneOptions({
          eventCoalescing: options?.ngZoneEventCoalescing,
          runCoalescing: options?.ngZoneRunCoalescing,
        }),
        scheduleInRootZone,
      });
    const ignoreChangesOutsideZone = options?.ignoreChangesOutsideZone;
    const allAppProviders = [
      internalProvideZoneChangeDetection({
        ngZoneFactory,
        ignoreChangesOutsideZone,
      }),
      {provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl},
    ];
    const moduleRef = createNgModuleRefWithProviders(
      moduleFactory.moduleType,
      this.injector,
      allAppProviders,
    );

    return bootstrap({
      moduleRef,
      allPlatformModules: this._modules,
      platformInjector: this.injector,
    });
  }

  /**
   * 주어진 플랫폼에 대한 `@NgModule` 인스턴스를 생성합니다.
   *
   * @usageNotes
   * ### 간단한 예
   *
   * ```ts
   * @NgModule({
   *   imports: [BrowserModule]
   * })
   * class MyModule {}
   *
   * let moduleRef = platformBrowser().bootstrapModule(MyModule);
   * ```
   *
   */
  bootstrapModule<M>(
    moduleType: Type<M>,
    compilerOptions:
      | (CompilerOptions & BootstrapOptions)
      | Array<CompilerOptions & BootstrapOptions> = [],
  ): Promise<NgModuleRef<M>> {
    const options = optionsReducer({}, compilerOptions);
    return compileNgModuleFactory(this.injector, options, moduleType).then((moduleFactory) =>
      this.bootstrapModuleFactory(moduleFactory, options),
    );
  }

  /**
   * 플랫폼이 파괴될 때 호출되는 리스너를 등록합니다.
   */
  onDestroy(callback: () => void): void {
    this._destroyListeners.push(callback);
  }

  /**
   * 플랫폼 {@link Injector}를 가져옵니다. 이는 페이지의 모든 Angular 애플리케이션에 대한 부모 주입기로
   * 단일 프로바이더를 제공합니다.
   */
  get injector(): Injector {
    return this._injector;
  }

  /**
   * 현재 Angular 플랫폼과 페이지의 모든 Angular 애플리케이션을 파괴합니다.
   * 플랫폼에 등록된 모든 모듈과 리스너를 파괴합니다.
   */
  destroy() {
    if (this._destroyed) {
      throw new RuntimeError(
        RuntimeErrorCode.PLATFORM_ALREADY_DESTROYED,
        ngDevMode && '플랫폼은 이미 파괴되었습니다!',
      );
    }
    this._modules.slice().forEach((module) => module.destroy());
    this._destroyListeners.forEach((listener) => listener());

    const destroyListeners = this._injector.get(PLATFORM_DESTROY_LISTENERS, null);
    if (destroyListeners) {
      destroyListeners.forEach((listener) => listener());
      destroyListeners.clear();
    }

    this._destroyed = true;
  }

  /**
   * 이 인스턴스가 파괴되었는지 여부를 나타냅니다.
   */
  get destroyed() {
    return this._destroyed;
  }
}
