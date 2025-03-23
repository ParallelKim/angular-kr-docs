/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injectable} from '../di/injectable';
import {InjectionToken} from '../di/injection_token';
import {StaticProvider} from '../di/interface/provider';
import {Type} from '../interface/type';
import {ViewEncapsulation} from '../metadata/view';
import {ComponentFactory as ComponentFactoryR3} from '../render3/component_ref';
import {getComponentDef, getNgModuleDef} from '../render3/def_getters';
import {NgModuleFactory as NgModuleFactoryR3} from '../render3/ng_module_ref';
import {maybeUnwrapFn} from '../render3/util/misc_utils';

import {ComponentFactory} from './component_factory';
import {NgModuleFactory} from './ng_module_factory';

/**
 * NgModuleFactory와 ComponentFactories의 조합입니다.
 *
 * @publicApi
 *
 * @deprecated
 * Ivy JIT 모드는 이 기호에 접근할 필요가 없습니다.
 */
export class ModuleWithComponentFactories<T> {
  constructor(
    public ngModuleFactory: NgModuleFactory<T>,
    public componentFactories: ComponentFactory<any>[],
  ) {}
}

/**
 * 런타임 동안 Angular 컴파일러를 실행하기 위한 저수준 서비스
 * {@link ComponentFactory}를 생성하여
 * 나중에 Component 인스턴스를 생성하고 렌더링하는 데 사용할 수 있습니다.
 *
 * 각 `@NgModule`은 컴파일을 위해 ng 모듈의 지시문/파이프를 사용할
 * 자신의 `Compiler`를 인젝터에 제공합니다.
 *
 * @publicApi
 *
 * @deprecated
 * Ivy JIT 모드는 이 기호에 접근할 필요가 없습니다.
 */
@Injectable({providedIn: 'root'})
export class Compiler {
  /**
   * 주어진 NgModule과 모든 컴포넌트를 컴파일합니다. 모든 컴포넌트의 템플릿은
   * 인라인되어야 합니다.
   */
  compileModuleSync<T>(moduleType: Type<T>): NgModuleFactory<T> {
    return new NgModuleFactoryR3(moduleType);
  }

  /**
   * 주어진 NgModule과 모든 컴포넌트를 컴파일합니다.
   */
  compileModuleAsync<T>(moduleType: Type<T>): Promise<NgModuleFactory<T>> {
    return Promise.resolve(this.compileModuleSync(moduleType));
  }

  /**
   * {@link Compiler#compileModuleSync compileModuleSync}와 동일하나
   * 모든 컴포넌트에 대한 ComponentFactories도 생성합니다.
   */
  compileModuleAndAllComponentsSync<T>(moduleType: Type<T>): ModuleWithComponentFactories<T> {
    const ngModuleFactory = this.compileModuleSync(moduleType);
    const moduleDef = getNgModuleDef(moduleType)!;
    const componentFactories = maybeUnwrapFn(moduleDef.declarations).reduce(
      (factories: ComponentFactory<any>[], declaration: Type<any>) => {
        const componentDef = getComponentDef(declaration);
        componentDef && factories.push(new ComponentFactoryR3(componentDef));
        return factories;
      },
      [] as ComponentFactory<any>[],
    );
    return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
  }

  /**
   * {@link Compiler#compileModuleAsync compileModuleAsync}와 동일하나
   * 모든 컴포넌트에 대한 ComponentFactories도 생성합니다.
   */
  compileModuleAndAllComponentsAsync<T>(
    moduleType: Type<T>,
  ): Promise<ModuleWithComponentFactories<T>> {
    return Promise.resolve(this.compileModuleAndAllComponentsSync(moduleType));
  }

  /**
   * 모든 캐시를 삭제합니다.
   */
  clearCache(): void {}

  /**
   * 주어진 컴포넌트/ngModule에 대한 캐시를 삭제합니다.
   */
  clearCacheFor(type: Type<any>) {}

  /**
   * 주어진 NgModule에 대한 ID를 반환합니다. 정의되고 컴파일러에 알려진 경우에 한합니다.
   */
  getModuleId(moduleType: Type<any>): string | undefined {
    return undefined;
  }
}

/**
 * 컴파일러를 생성하기 위한 옵션입니다.
 *
 * @publicApi
 */
export type CompilerOptions = {
  defaultEncapsulation?: ViewEncapsulation;
  providers?: StaticProvider[];
  preserveWhitespaces?: boolean;
};

/**
 * 플랫폼 인젝터에서 CompilerOptions를 제공하기 위한 토큰입니다.
 *
 * @publicApi
 */
export const COMPILER_OPTIONS = new InjectionToken<CompilerOptions[]>(
  ngDevMode ? 'compilerOptions' : '',
);

/**
 * 컴파일러를 생성하는 팩토리입니다.
 *
 * @publicApi
 *
 * @deprecated
 * Ivy JIT 모드는 이 기호에 접근할 필요가 없습니다.
 */
export abstract class CompilerFactory {
  abstract createCompiler(options?: CompilerOptions[]): Compiler;
}
