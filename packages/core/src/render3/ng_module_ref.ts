/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createInjectorWithoutInjectorInstances} from '../di/create_injector';
import {Injector} from '../di/injector';
import {EnvironmentProviders, Provider, StaticProvider} from '../di/interface/provider';
import {EnvironmentInjector, getNullInjector, R3Injector} from '../di/r3_injector';
import {Type} from '../interface/type';
import {ComponentFactoryResolver as viewEngine_ComponentFactoryResolver} from '../linker/component_factory_resolver';
import {
  InternalNgModuleRef,
  NgModuleFactory as viewEngine_NgModuleFactory,
  NgModuleRef as viewEngine_NgModuleRef,
} from '../linker/ng_module_factory';
import {assertDefined} from '../util/assert';
import {stringify} from '../util/stringify';

import {ComponentFactoryResolver} from './component_ref';
import {getNgModuleDef} from './def_getters';
import {maybeUnwrapFn} from './util/misc_utils';

/**
 * 제공된 NgModule 클래스와 부모 인젝터를 기반으로 새로운 NgModuleRef 인스턴스를 반환합니다.
 *
 * @param ngModule NgModule 클래스.
 * @param parentInjector 모듈 인젝터의 부모로 사용할 선택적 인젝터 인스턴스. 제공되지 않으면 `NullInjector`가 대신 사용됩니다.
 * @returns NgModule 인스턴스를 나타내는 NgModuleRef.
 *
 * @publicApi
 */
export function createNgModule<T>(
  ngModule: Type<T>,
  parentInjector?: Injector,
): viewEngine_NgModuleRef<T> {
  return new NgModuleRef<T>(ngModule, parentInjector ?? null, []);
}

/**
 * 호환성을 위해 `createNgModule`의 함수 별칭.
 * 직접 사용하지 마시고 대신 `createNgModule`를 사용해 주십시오.
 *
 * @deprecated 대신 `createNgModule`를 사용하십시오.
 */
export const createNgModuleRef = createNgModule;
export class NgModuleRef<T> extends viewEngine_NgModuleRef<T> implements InternalNgModuleRef<T> {
  // tslint:disable-next-line:require-internal-with-underscore
  _bootstrapComponents: Type<any>[] = [];
  private readonly _r3Injector: R3Injector;
  override instance!: T;
  destroyCbs: (() => void)[] | null = [];

  // 모듈을 부트스트랩 할 때 우리는 다음과 같은 의존성 그래프를 가집니다:
  // ApplicationRef -> ComponentFactoryResolver -> NgModuleRef. 문제는 해결하고 있는 모듈이 ComponentFactoryResolver를 주입하려고 하면
  // 순환 의존성이 발생하여 런타임 오류가 발생합니다. 왜냐하면 인젝터가 아직 존재하지 않기 때문입니다. 우리는 인젝터가 해결하도록 두지 않고
  // 우리가 직접 ComponentFactoryResolver를 생성하고 제공함으로써 문제를 해결합니다.
  override readonly componentFactoryResolver: ComponentFactoryResolver =
    new ComponentFactoryResolver(this);

  constructor(
    private readonly ngModuleType: Type<T>,
    public _parent: Injector | null,
    additionalProviders: StaticProvider[],
    runInjectorInitializers = true,
  ) {
    super();
    const ngModuleDef = getNgModuleDef(ngModuleType);
    ngDevMode &&
      assertDefined(
        ngModuleDef,
        `NgModule '${stringify(ngModuleType)}'는 'NgModuleType'의 하위 유형이 아닙니다.`,
      );

    this._bootstrapComponents = maybeUnwrapFn(ngModuleDef!.bootstrap);
    this._r3Injector = createInjectorWithoutInjectorInstances(
      ngModuleType,
      _parent,
      [
        {provide: viewEngine_NgModuleRef, useValue: this},
        {
          provide: viewEngine_ComponentFactoryResolver,
          useValue: this.componentFactoryResolver,
        },
        ...additionalProviders,
      ],
      stringify(ngModuleType),
      new Set(['environment']),
    ) as R3Injector;

    // 인젝터 생성과는 별도로 인젝터 유형을 해결해야 합니다. 왜냐하면
    // 모듈이 DI를 위해 생성자에서 이 참조를 사용하려고 할 수 있기 때문에,
    // 이는 순환 오류를 초래하여 결국 오류가 발생할 것입니다. 왜냐하면 인젝터가 아직 생성되지 않았기 때문입니다.
    if (runInjectorInitializers) {
      this.resolveInjectorInitializers();
    }
  }

  resolveInjectorInitializers() {
    this._r3Injector.resolveInjectorInitializers();
    this.instance = this._r3Injector.get(this.ngModuleType);
  }

  override get injector(): EnvironmentInjector {
    return this._r3Injector;
  }

  override destroy(): void {
    ngDevMode && assertDefined(this.destroyCbs, 'NgModule가 이미 파괴되었습니다');
    const injector = this._r3Injector;
    !injector.destroyed && injector.destroy();
    this.destroyCbs!.forEach((fn) => fn());
    this.destroyCbs = null;
  }
  override onDestroy(callback: () => void): void {
    ngDevMode && assertDefined(this.destroyCbs, 'NgModule가 이미 파괴되었습니다');
    this.destroyCbs!.push(callback);
  }
}

export class NgModuleFactory<T> extends viewEngine_NgModuleFactory<T> {
  constructor(public moduleType: Type<T>) {
    super();
  }

  override create(parentInjector: Injector | null): viewEngine_NgModuleRef<T> {
    return new NgModuleRef(this.moduleType, parentInjector, []);
  }
}

export function createNgModuleRefWithProviders<T>(
  moduleType: Type<T>,
  parentInjector: Injector | null,
  additionalProviders: StaticProvider[],
): InternalNgModuleRef<T> {
  return new NgModuleRef(moduleType, parentInjector, additionalProviders, false);
}

export class EnvironmentNgModuleRefAdapter extends viewEngine_NgModuleRef<null> {
  override readonly injector: R3Injector;
  override readonly componentFactoryResolver: ComponentFactoryResolver =
    new ComponentFactoryResolver(this);
  override readonly instance = null;

  constructor(config: {
    providers: Array<Provider | EnvironmentProviders>;
    parent: EnvironmentInjector | null;
    debugName: string | null;
    runEnvironmentInitializers: boolean;
  }) {
    super();
    const injector = new R3Injector(
      [
        ...config.providers,
        {provide: viewEngine_NgModuleRef, useValue: this},
        {provide: viewEngine_ComponentFactoryResolver, useValue: this.componentFactoryResolver},
      ],
      config.parent || getNullInjector(),
      config.debugName,
      new Set(['environment']),
    );
    this.injector = injector;
    if (config.runEnvironmentInitializers) {
      injector.resolveInjectorInitializers();
    }
  }

  override destroy(): void {
    this.injector.destroy();
  }

  override onDestroy(callback: () => void): void {
    this.injector.onDestroy(callback);
  }
}

/**
 * 새로운 환경 인젝터를 생성합니다.
 *
 * @param providers 제공자 배열.
 * @param parent 부모 환경 인젝터.
 * @param debugName 이 인젝터 인스턴스에 대한 선택적 이름, 오류 메시지에 사용됩니다.
 *
 * @publicApi
 */
export function createEnvironmentInjector(
  providers: Array<Provider | EnvironmentProviders>,
  parent: EnvironmentInjector,
  debugName: string | null = null,
): EnvironmentInjector {
  const adapter = new EnvironmentNgModuleRefAdapter({
    providers,
    parent,
    debugName,
    runEnvironmentInitializers: true,
  });
  return adapter.injector;
}
