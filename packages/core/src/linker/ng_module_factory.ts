/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../di/injector';
import {EnvironmentInjector, R3Injector} from '../di/r3_injector';
import {Type} from '../interface/type';

import {ComponentFactoryResolver} from './component_factory_resolver';

/**
 * `NgModuleFactory`에 의해 생성된 `NgModule` 인스턴스를 나타냅니다.
 * `NgModule` 인스턴스 및 관련 객체에 대한 접근을 제공합니다.
 *
 * @publicApi
 */
export abstract class NgModuleRef<T> {
  /**
   * `NgModule`의 모든 제공자를 포함하는 인젝터입니다.
   */
  abstract get injector(): EnvironmentInjector;

  /**
   * 이 모듈의 컨텍스트에서 컴포넌트 팩토리를 조회할 수 있는 리솔버입니다.
   *
   * 주의: v13부터는
   * [`ViewContainerRef.createComponent`](api/core/ViewContainerRef#createComponent)를 통한 동적 컴포넌트 생성이
   * **컴포넌트 팩토리 리솔빙**을 요구하지 않습니다: 컴포넌트 클래스를 직접 사용할 수 있습니다.
   *
   * @deprecated Angular는 더 이상 컴포넌트 팩토리를 요구하지 않습니다. 컴포넌트 클래스를 직접 사용할 수 있는
   *     다른 API를 사용하십시오.
   */
  abstract get componentFactoryResolver(): ComponentFactoryResolver;

  /**
   * `NgModule` 인스턴스입니다.
   */
  abstract get instance(): T;

  /**
   * 모듈 인스턴스와 관련된 모든 데이터 구조를 파괴합니다.
   */
  abstract destroy(): void;

  /**
   * 모듈이 파괴될 때 실행될 콜백을 등록합니다.
   */
  abstract onDestroy(callback: () => void): void;
}

export interface InternalNgModuleRef<T> extends NgModuleRef<T> {
  // 주의: 우리는 _ 접두사를 사용하고 있습니다. NgModuleData는 NgModuleRef이며 따라서 사용자에게 직접
  // 노출되기 때문에.
  _bootstrapComponents: Type<any>[];
  resolveInjectorInitializers(): void;
}

/**
 * @publicApi
 *
 * @deprecated
 * 이 클래스는 주로 ViewEngine 기반 JIT API의 일부로 사용되었으며 Ivy
 * JIT 모드에서는 더 이상 필요하지 않습니다. Angular는 직접 NgModule 클래스를 수용하는 API를 제공합니다
 * (예: [PlatformRef.bootstrapModule](api/core/PlatformRef#bootstrapModule) 및
 * [createNgModule](api/core/createNgModule)), 공장 기반 API를 사용하는 대신 이러한 API로 전환하는 것을 고려하십시오.
 */
export abstract class NgModuleFactory<T> {
  abstract get moduleType(): Type<T>;
  abstract create(parentInjector: Injector | null): NgModuleRef<T>;
}
