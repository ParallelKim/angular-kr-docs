/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {resolveForwardRef} from '../../di';
import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {Type} from '../../interface/type';
import {NgModuleType} from '../../metadata/ng_module_def';
import {flatten} from '../../util/array_utils';
import type {
  ComponentType,
  NgModuleScopeInfoFromDecorator,
  RawScopeInfoFromDecorator,
} from '../interfaces/definition';
import {isComponent, isDirective, isNgModule, isPipe, verifyStandaloneImport} from '../jit/util';
import {getComponentDef, getNgModuleDef, isStandalone} from '../def_getters';
import {maybeUnwrapFn} from '../util/misc_utils';

import {
  ComponentDependencies,
  DepsTrackerApi,
  NgModuleScope,
  StandaloneComponentScope,
} from './api';

/**
 * JIT 컴파일에서 스코프 계산을 위해 런타임 의존성 트래커를 사용할지 여부를 나타냅니다.
 * 값 "false"는 유형에 스코프 정보를 패치하는 기반의 이전 코드 경로가
 * 사용됨을 의미합니다.
 *
 * @deprecated 마이그레이션 목적을 위해서만, 곧 제거될 예정입니다.
 */
export const USE_RUNTIME_DEPS_TRACKER_FOR_JIT = true;

/**
 * JIT 및 로컬 컴파일에 사용될 DepsTrackerApi의 구현입니다.
 */
class DepsTracker implements DepsTrackerApi {
  private ownerNgModule = new Map<ComponentType<any>, NgModuleType<any>>();
  private ngModulesWithSomeUnresolvedDecls = new Set<NgModuleType<any>>();
  private ngModulesScopeCache = new Map<NgModuleType<any>, NgModuleScope>();
  private standaloneComponentsScopeCache = new Map<ComponentType<any>, StandaloneComponentScope>();

  /**
   * 가능한 한 많이 ng 모듈의 포워드 참조 선언을 해결하고
   * `ownerNgModule` 맵에 추가하려고 시도합니다. 이 메서드는 일반적으로
   * 초기 구문 분석 후에 호출되어야 하며, 이때 모든 포워드 참조가 해결됩니다
   * (예: 컴포넌트를 렌더링하려고 할 때).
   */
  private resolveNgModulesDecls(): void {
    if (this.ngModulesWithSomeUnresolvedDecls.size === 0) {
      return;
    }

    for (const moduleType of this.ngModulesWithSomeUnresolvedDecls) {
      const def = getNgModuleDef(moduleType);
      if (def?.declarations) {
        for (const decl of maybeUnwrapFn(def.declarations)) {
          if (isComponent(decl)) {
            this.ownerNgModule.set(decl, moduleType);
          }
        }
      }
    }

    this.ngModulesWithSomeUnresolvedDecls.clear();
  }

  /** @override */
  getComponentDependencies(
    type: ComponentType<any>,
    rawImports?: RawScopeInfoFromDecorator[],
  ): ComponentDependencies {
    this.resolveNgModulesDecls();

    const def = getComponentDef(type);
    if (def === null) {
      throw new Error(`컴포넌트가 아닌 유형의 컴포넌트 의존성을 가져오려고 시도했습니다: ${type}`);
    }

    if (def.standalone) {
      const scope = this.getStandaloneComponentScope(type, rawImports);

      if (scope.compilation.isPoisoned) {
        return {dependencies: []};
      }

      return {
        dependencies: [
          ...scope.compilation.directives,
          ...scope.compilation.pipes,
          ...scope.compilation.ngModules,
        ],
      };
    } else {
      if (!this.ownerNgModule.has(type)) {
        // 이 컴포넌트는 고아입니다! 이 오류를 처리할 필요는 없습니다.
        // 구성에 따라 오류를 확인할 것입니다.
        return {dependencies: []};
      }

      const scope = this.getNgModuleScope(this.ownerNgModule.get(type)!);

      if (scope.compilation.isPoisoned) {
        return {dependencies: []};
      }

      return {
        dependencies: [...scope.compilation.directives, ...scope.compilation.pipes],
      };
    }
  }

  /**
   * @override
   * 이 구현은 scopeInfo를 사용하지 않습니다.
   * 이는 scope 정보가 {@link ɵɵsetNgModuleScope}와 같은 방법을 통해
   * 유형 자체에 이미 추가되었다고 가정하기 때문입니다.
   */
  registerNgModule(type: Type<any>, scopeInfo: NgModuleScopeInfoFromDecorator): void {
    if (!isNgModule(type)) {
      throw new Error(`NgModule이 아닌 유형을 NgModule로 등록하려고 시도했습니다: ${type}`);
    }

    // 필요할 때 NgModules를 지연 처리를 합니다.
    this.ngModulesWithSomeUnresolvedDecls.add(type);
  }

  /** @override */
  clearScopeCacheFor(type: Type<any>): void {
    this.ngModulesScopeCache.delete(type as NgModuleType);
    this.standaloneComponentsScopeCache.delete(type as ComponentType<any>);
  }

  /** @override */
  getNgModuleScope(type: NgModuleType<any>): NgModuleScope {
    if (this.ngModulesScopeCache.has(type)) {
      return this.ngModulesScopeCache.get(type)!;
    }

    const scope = this.computeNgModuleScope(type);
    this.ngModulesScopeCache.set(type, scope);

    return scope;
  }

  /** NgModule 스코프를 새롭게 계산합니다. */
  private computeNgModuleScope(type: NgModuleType<any>): NgModuleScope {
    const def = getNgModuleDef(type, true);
    const scope: NgModuleScope = {
      exported: {directives: new Set(), pipes: new Set()},
      compilation: {directives: new Set(), pipes: new Set()},
    };

    // 가져오기 분석
    for (const imported of maybeUnwrapFn(def.imports)) {
      if (isNgModule(imported)) {
        const importedScope = this.getNgModuleScope(imported);

        // 이 모듈이 다른 모듈을 가져올 때,
        // 가져온 모듈의 내보낸 지시자와 파이프가
        // 이 모듈의 컴파일 스코프에 추가됩니다.
        addSet(importedScope.exported.directives, scope.compilation.directives);
        addSet(importedScope.exported.pipes, scope.compilation.pipes);
      } else if (isStandalone(imported)) {
        if (isDirective(imported) || isComponent(imported)) {
          scope.compilation.directives.add(imported);
        } else if (isPipe(imported)) {
          scope.compilation.pipes.add(imported);
        } else {
          // 독립 실행형 유형이 아니라면 ... (뭐지?)
          throw new RuntimeError(
            RuntimeErrorCode.RUNTIME_DEPS_INVALID_IMPORTED_TYPE,
            '독립 실행형으로 가져온 유형은 컴포넌트, 지시자, 파이프가 아닙니다',
          );
        }
      } else {
        // 가져오는 것이 모듈이나 제공자가 있는 모듈 또는 독립 실행형이 아닙니다.
        // 이는 오류가 생길 것입니다.
        // 그래서 우리는 짧은 경로로 갑니다.
        scope.compilation.isPoisoned = true;
        break;
      }
    }

    // 선언 분석
    if (!scope.compilation.isPoisoned) {
      for (const decl of maybeUnwrapFn(def.declarations)) {
        // 다른 NgModule이나 독립형을 선언할 수 없습니다.
        if (isNgModule(decl) || isStandalone(decl)) {
          scope.compilation.isPoisoned = true;
          break;
        }

        if (isPipe(decl)) {
          scope.compilation.pipes.add(decl);
        } else {
          // decl은 지시자 또는 컴포넌트입니다. 이 컴포넌트는 비동기 컴파일로 인해
          // ɵcmp을 아직 가지지 않을 수 있습니다.
          scope.compilation.directives.add(decl);
        }
      }
    }

    // 내보내기 분석
    for (const exported of maybeUnwrapFn(def.exports)) {
      if (isNgModule(exported)) {
        // 이 모듈이 다른 모듈을 내보낼 때,
        // 내보낸 모듈의 내보낸 지시자와 파이프가
        // 이 모듈의 컴파일 및 내보내기 스코프에 추가됩니다.
        const exportedScope = this.getNgModuleScope(exported);

        // 현재 로직에 따르면 내보낸 스코프가 오염된 경우가 없습니다.
        // 그래서 확인할 필요가 없습니다.
        addSet(exportedScope.exported.directives, scope.exported.directives);
        addSet(exportedScope.exported.pipes, scope.exported.pipes);

        // JIT 모드에서 실행되는 일부 테스트 도구는 이 행동을
        // 의존합니다. 내보낸 스코프는 컴파일 스코프에도 나타나야 합니다.
        // AoT는 이를 지원하지 않으며 NgModule 메타데이터 정의와도
        // 맞지 않습니다. 이것이 없으면 Google의 일부 테스트는 실패할 것입니다.
        addSet(exportedScope.exported.directives, scope.compilation.directives);
        addSet(exportedScope.exported.pipes, scope.compilation.pipes);
      } else if (isPipe(exported)) {
        scope.exported.pipes.add(exported);
      } else {
        scope.exported.directives.add(exported);
      }
    }

    return scope;
  }

  /** @override */
  getStandaloneComponentScope(
    type: ComponentType<any>,
    rawImports?: RawScopeInfoFromDecorator[],
  ): StandaloneComponentScope {
    if (this.standaloneComponentsScopeCache.has(type)) {
      return this.standaloneComponentsScopeCache.get(type)!;
    }

    const ans = this.computeStandaloneComponentScope(type, rawImports);
    this.standaloneComponentsScopeCache.set(type, ans);

    return ans;
  }

  private computeStandaloneComponentScope(
    type: ComponentType<any>,
    rawImports?: RawScopeInfoFromDecorator[],
  ): StandaloneComponentScope {
    const ans: StandaloneComponentScope = {
      compilation: {
        // 독립 실행형 컴포넌트는 항상 자기 참조가 가능합니다.
        directives: new Set([type]),
        pipes: new Set(),
        ngModules: new Set(),
      },
    };

    for (const rawImport of flatten(rawImports ?? [])) {
      const imported = resolveForwardRef(rawImport) as Type<any>;

      try {
        verifyStandaloneImport(imported, type);
      } catch (e) {
        // 가져온 것이 유효하지 않으면 짧은 경로로 이동
        ans.compilation.isPoisoned = true;
        return ans;
      }

      if (isNgModule(imported)) {
        ans.compilation.ngModules.add(imported);
        const importedScope = this.getNgModuleScope(imported);

        // 가져온 NgModule가 내보낸 스코프를 손상시킨 경우 짧은 경로로 이동.
        if (importedScope.exported.isPoisoned) {
          ans.compilation.isPoisoned = true;
          return ans;
        }

        addSet(importedScope.exported.directives, ans.compilation.directives);
        addSet(importedScope.exported.pipes, ans.compilation.pipes);
      } else if (isPipe(imported)) {
        ans.compilation.pipes.add(imported);
      } else if (isDirective(imported) || isComponent(imported)) {
        ans.compilation.directives.add(imported);
      } else {
        // 가져온 것은 모듈/파이프/지시자/컴포넌트가 아니므로 오류가 발생하고 짧은 경로로 이동합니다.
        ans.compilation.isPoisoned = true;
        return ans;
      }
    }

    return ans;
  }

  /** @override */
  isOrphanComponent(cmp: Type<any>): boolean {
    const def = getComponentDef(cmp);

    if (!def || def.standalone) {
      return false;
    }

    this.resolveNgModulesDecls();

    return !this.ownerNgModule.has(cmp as ComponentType<any>);
  }
}

function addSet<T>(sourceSet: Set<T>, targetSet: Set<T>): void {
  for (const m of sourceSet) {
    targetSet.add(m);
  }
}

/** 현재 Angular 앱에서 개발 모드로 사용될 deps 트래커입니다. */
export const depsTracker = new DepsTracker();

export const TEST_ONLY = {DepsTracker};
