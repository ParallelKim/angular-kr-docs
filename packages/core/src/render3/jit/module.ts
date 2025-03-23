/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  getCompilerFacade,
  JitCompilerUsage,
  R3InjectorMetadataFacade,
} from '../../compiler/compiler_facade';
import {resolveForwardRef} from '../../di/forward_ref';
import {NG_INJ_DEF} from '../../di/interface/defs';
import type {ModuleWithProviders} from '../../di/interface/provider';
import {reflectDependencies} from '../../di/jit/util';
import {Type} from '../../interface/type';
import {registerNgModuleType} from '../../linker/ng_module_registration';
import type {NgModule} from '../../metadata/ng_module';
import type {
  NgModuleDef,
  NgModuleTransitiveScopes,
  NgModuleType,
} from '../../metadata/ng_module_def';
import {deepForEach, flatten} from '../../util/array_utils';
import {assertDefined} from '../../util/assert';
import {EMPTY_ARRAY} from '../../util/empty';
import {GENERATED_COMP_IDS} from '../definition';
import {
  getComponentDef,
  getDirectiveDef,
  getNgModuleDef,
  getPipeDef,
  isStandalone,
} from '../def_getters';
import {depsTracker, USE_RUNTIME_DEPS_TRACKER_FOR_JIT} from '../deps_tracker/deps_tracker';
import {NG_COMP_DEF, NG_DIR_DEF, NG_FACTORY_DEF, NG_MOD_DEF, NG_PIPE_DEF} from '../fields';
import type {ComponentDef} from '../interfaces/definition';
import {maybeUnwrapFn} from '../util/misc_utils';
import {stringifyForError} from '../util/stringify_utils';

import {angularCoreEnv} from './environment';
import {patchModuleCompilation} from './module_patch';
import {isModuleWithProviders, isNgModule} from './util';

interface ModuleQueueItem {
  moduleType: Type<any>;
  ngModule: NgModule;
}

const moduleQueue: ModuleQueueItem[] = [];

/**
 * 구문 검사가 가능한지 체크하기 위해 모듈 정의를 지연시켜 대기열에 추가합니다.
 */
function enqueueModuleForDelayedScoping(moduleType: Type<any>, ngModule: NgModule) {
  moduleQueue.push({moduleType, ngModule});
}

let flushingModuleQueue = false;
/**
 * 대기열의 모듈 정의를 반복하여 각 모듈 정의의 선언이 해결되었는지 확인하고,
 * 해결되었으면 그 모듈 정의를 제거하고 선언에 범위를 설정합니다.
 */
export function flushModuleScopingQueueAsMuchAsPossible() {
  if (!flushingModuleQueue) {
    flushingModuleQueue = true;
    try {
      for (let i = moduleQueue.length - 1; i >= 0; i--) {
        const {moduleType, ngModule} = moduleQueue[i];

        if (ngModule.declarations && ngModule.declarations.every(isResolvedDeclaration)) {
          // 대기열에서 제거
          moduleQueue.splice(i, 1);
          setScopeOnDeclaredComponents(moduleType, ngModule);
        }
      }
    } finally {
      flushingModuleQueue = false;
    }
  }
}

/**
 * 선언이 해결되었는지의 참(true)을 반환합니다.
 * 만약 선언이 배열이라면, 그 배열의 각 선언을 재귀적으로 확인합니다
 * (그 배열도 또 배열일 수 있습니다).
 */
function isResolvedDeclaration(declaration: any[] | Type<any>): boolean {
  if (Array.isArray(declaration)) {
    return declaration.every(isResolvedDeclaration);
  }
  return !!resolveForwardRef(declaration);
}

/**
 * JIT 모드에서 모듈을 컴파일합니다.
 *
 * 이 함수는 클래스에 `@NgModule` 데코레이터가 있을 때 자동으로 호출됩니다.
 */
export function compileNgModule(moduleType: Type<any>, ngModule: NgModule = {}): void {
  patchModuleCompilation();
  compileNgModuleDefs(moduleType as NgModuleType, ngModule);
  if (ngModule.id !== undefined) {
    registerNgModuleType(moduleType as NgModuleType, ngModule.id);
  }

  // NgModule 데코레이터가 실행되는 순간 모든 선언이 해결되었는지 알 수 없기 때문에,
  // 모듈의 선언에 대한 모듈 범위를 설정하기 위해 지연시킵니다.
  enqueueModuleForDelayedScoping(moduleType, ngModule);
}

/**
 * 모듈 클래스에 `ɵmod`, `ɵfac` 및 `ɵinj` 속성을 컴파일하고 추가합니다.
 *
 * 이 API를 사용하여 모듈을 컴파일할 수 있으며, 루트에 중복된 선언이 허용됩니다.
 */
export function compileNgModuleDefs(
  moduleType: NgModuleType,
  ngModule: NgModule,
  allowDuplicateDeclarationsInRoot: boolean = false,
): void {
  ngDevMode && assertDefined(moduleType, '필수 값 moduleType');
  ngDevMode && assertDefined(ngModule, '필수 값 ngModule');
  const declarations: Type<any>[] = flatten(ngModule.declarations || EMPTY_ARRAY);
  let ngModuleDef: any = null;
  Object.defineProperty(moduleType, NG_MOD_DEF, {
    configurable: true,
    get: () => {
      if (ngModuleDef === null) {
        if (ngDevMode && ngModule.imports && ngModule.imports.indexOf(moduleType) > -1) {
          // 즉시 검증해야 합니다. 그렇지 않으면 오류가 발생합니다.
          throw new Error(`'${stringifyForError(moduleType)}' 모듈은 자신을 가져올 수 없습니다`);
        }
        const compiler = getCompilerFacade({
          usage: JitCompilerUsage.Decorator,
          kind: 'NgModule',
          type: moduleType,
        });
        ngModuleDef = compiler.compileNgModule(angularCoreEnv, `ng:///${moduleType.name}/ɵmod.js`, {
          type: moduleType,
          bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY).map(resolveForwardRef),
          declarations: declarations.map(resolveForwardRef),
          imports: flatten(ngModule.imports || EMPTY_ARRAY)
            .map(resolveForwardRef)
            .map(expandModuleWithProviders),
          exports: flatten(ngModule.exports || EMPTY_ARRAY)
            .map(resolveForwardRef)
            .map(expandModuleWithProviders),
          schemas: ngModule.schemas ? flatten(ngModule.schemas) : null,
          id: ngModule.id || null,
        });
        // Set `schemas` on ngModuleDef to an empty array in JIT mode to indicate that runtime
        // should verify that there are no unknown elements in a template. In AOT mode, that check
        // happens at compile time and `schemas` information is not present on Component and Module
        // defs after compilation (so the check doesn't happen the second time at runtime).
        if (!ngModuleDef.schemas) {
          ngModuleDef.schemas = [];
        }
      }
      return ngModuleDef;
    },
  });

  let ngFactoryDef: any = null;
  Object.defineProperty(moduleType, NG_FACTORY_DEF, {
    get: () => {
      if (ngFactoryDef === null) {
        const compiler = getCompilerFacade({
          usage: JitCompilerUsage.Decorator,
          kind: 'NgModule',
          type: moduleType,
        });
        ngFactoryDef = compiler.compileFactory(angularCoreEnv, `ng:///${moduleType.name}/ɵfac.js`, {
          name: moduleType.name,
          type: moduleType,
          deps: reflectDependencies(moduleType),
          target: compiler.FactoryTarget.NgModule,
          typeArgumentCount: 0,
        });
      }
      return ngFactoryDef;
    },
    // 개발 모드에서 속성을 구성 가능으로 하여 테스트에서 재정의할 수 있게 합니다.
    configurable: !!ngDevMode,
  });

  let ngInjectorDef: any = null;
  Object.defineProperty(moduleType, NG_INJ_DEF, {
    get: () => {
      if (ngInjectorDef === null) {
        ngDevMode && verifySemanticsOfNgModuleDef(moduleType, allowDuplicateDeclarationsInRoot);
        const meta: R3InjectorMetadataFacade = {
          name: moduleType.name,
          type: moduleType,
          providers: ngModule.providers || EMPTY_ARRAY,
          imports: [
            (ngModule.imports || EMPTY_ARRAY).map(resolveForwardRef),
            (ngModule.exports || EMPTY_ARRAY).map(resolveForwardRef),
          ],
        };
        const compiler = getCompilerFacade({
          usage: JitCompilerUsage.Decorator,
          kind: 'NgModule',
          type: moduleType,
        });
        ngInjectorDef = compiler.compileInjector(
          angularCoreEnv,
          `ng:///${moduleType.name}/ɵinj.js`,
          meta,
        );
      }
      return ngInjectorDef;
    },
    // 개발 모드에서 속성을 구성 가능으로 하여 테스트에서 재정의할 수 있게 합니다.
    configurable: !!ngDevMode,
  });
}

export function generateStandaloneInDeclarationsError(type: Type<any>, location: string) {
  const prefix = `예상하지 못한 "${stringifyForError(type)}"이 "declarations" 배열에서 발견되었습니다.`;
  const suffix =
    `"${stringifyForError(type)}" 은 독립형으로 표시되어 있으며 ` +
    '어떤 NgModule에도 선언될 수 없습니다 - 대신 임포트하려고 하신 건가요 (임포트 배열에 추가하여)?';
  return `${prefix} ${location}, ${suffix}`;
}

function verifySemanticsOfNgModuleDef(
  moduleType: NgModuleType,
  allowDuplicateDeclarationsInRoot: boolean,
  importingModule?: NgModuleType,
): void {
  if (verifiedNgModule.get(moduleType)) return;

  // 독립형 구성 요소, 지시문 및 파이프의 검증을 건너뜁니다.
  if (isStandalone(moduleType)) return;

  verifiedNgModule.set(moduleType, true);
  moduleType = resolveForwardRef(moduleType);
  let ngModuleDef: NgModuleDef<any>;
  if (importingModule) {
    ngModuleDef = getNgModuleDef(moduleType)!;
    if (!ngModuleDef) {
      throw new Error(
        `예상하지 못한 값 '${moduleType.name}'이 모듈 '${importingModule.name}'에 의해 가져와졌습니다. @NgModule 주석을 추가해주세요.`,
      );
    }
  } else {
    ngModuleDef = getNgModuleDef(moduleType, true);
  }
  const errors: string[] = [];
  const declarations = maybeUnwrapFn(ngModuleDef.declarations);
  const imports = maybeUnwrapFn(ngModuleDef.imports);
  flatten(imports)
    .map(unwrapModuleWithProvidersImports)
    .forEach((modOrStandaloneCmpt) => {
      verifySemanticsOfNgModuleImport(modOrStandaloneCmpt, moduleType);
      verifySemanticsOfNgModuleDef(modOrStandaloneCmpt, false, moduleType);
    });
  const exports = maybeUnwrapFn(ngModuleDef.exports);
  declarations.forEach(verifyDeclarationsHaveDefinitions);
  declarations.forEach(verifyDirectivesHaveSelector);
  declarations.forEach((declarationType) => verifyNotStandalone(declarationType, moduleType));
  const combinedDeclarations: Type<any>[] = [
    ...declarations.map(resolveForwardRef),
    ...flatten(imports.map(computeCombinedExports)).map(resolveForwardRef),
  ];
  exports.forEach(verifyExportsAreDeclaredOrReExported);
  declarations.forEach((decl) => verifyDeclarationIsUnique(decl, allowDuplicateDeclarationsInRoot));

  const ngModule = getAnnotation<NgModule>(moduleType, 'NgModule');
  if (ngModule) {
    ngModule.imports &&
      flatten(ngModule.imports)
        .map(unwrapModuleWithProvidersImports)
        .forEach((mod) => {
          verifySemanticsOfNgModuleImport(mod, moduleType);
          verifySemanticsOfNgModuleDef(mod, false, moduleType);
        });
    ngModule.bootstrap && deepForEach(ngModule.bootstrap, verifyCorrectBootstrapType);
    ngModule.bootstrap && deepForEach(ngModule.bootstrap, verifyComponentIsPartOfNgModule);
  }

  // 감지된 오류가 있으면 오류를 발생시킵니다.
  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////
  function verifyDeclarationsHaveDefinitions(type: Type<any>): void {
    type = resolveForwardRef(type);
    const def = getComponentDef(type) || getDirectiveDef(type) || getPipeDef(type);
    if (!def) {
      errors.push(
        `예상하지 못한 값 '${stringifyForError(type)}'이 모듈 '${stringifyForError(
          moduleType,
        )}'에 의해 선언되었습니다. @Pipe/@Directive/@Component 주석을 추가해주세요.`,
      );
    }
  }

  function verifyDirectivesHaveSelector(type: Type<any>): void {
    type = resolveForwardRef(type);
    const def = getDirectiveDef(type);
    if (!getComponentDef(type) && def && def.selectors.length == 0) {
      errors.push(`지시문 ${stringifyForError(type)}에 선택자가 없습니다, 추가해주세요!`);
    }
  }

  function verifyNotStandalone(type: Type<any>, moduleType: NgModuleType): void {
    type = resolveForwardRef(type);
    const def = getComponentDef(type) || getDirectiveDef(type) || getPipeDef(type);
    if (def?.standalone) {
      const location = `"${stringifyForError(moduleType)}" NgModule`;
      errors.push(generateStandaloneInDeclarationsError(type, location));
    }
  }

  function verifyExportsAreDeclaredOrReExported(type: Type<any>) {
    type = resolveForwardRef(type);
    const kind =
      (getComponentDef(type) && 'component') ||
      (getDirectiveDef(type) && 'directive') ||
      (getPipeDef(type) && 'pipe');
    if (kind) {
      // 구성 요소, 지시문 또는 파이프로 선언된 경우에만 확인합니다.
      // 모듈은 선언되거나 가져올 필요가 없습니다.
      if (combinedDeclarations.lastIndexOf(type) === -1) {
        // 명시적으로 선언되거나 가져오지 않은 것을 내보내고 있습니다.
        errors.push(
          `${kind} ${stringifyForError(type)}를 ${stringifyForError(
            moduleType,
          )}에서 내보낼 수 없습니다! 선언되거나 가져오지 않았습니다!`,
        );
      }
    }
  }

  function verifyDeclarationIsUnique(type: Type<any>, suppressErrors: boolean) {
    type = resolveForwardRef(type);
    const existingModule = ownerNgModule.get(type);
    if (existingModule && existingModule !== moduleType) {
      if (!suppressErrors) {
        const modules = [existingModule, moduleType].map(stringifyForError).sort();
        errors.push(
          `유형 ${stringifyForError(type)}이 2개의 모듈의 선언에 포함되어 있습니다: ${
            modules[0]
          }와 ${modules[1]}! ` +
            `${stringifyForError(type)}을 더 높은 모듈로 옮기는 것을 고려해주세요, ${modules[0]}과 ${modules[1]}를 가져오는 모듈로. ` +
            `새로운 NgModule을 생성하여 ${stringifyForError(type)}을 내보내고 포함시킨 후 ${modules[0]}와 ${modules[1]}에서 그 NgModule을 가져오는 것도 가능합니다.`,
        );
      }
    } else {
      // 유형의 소유자가 있음을 표시합니다.
      ownerNgModule.set(type, moduleType);
    }
  }

  function verifyComponentIsPartOfNgModule(type: Type<any>) {
    type = resolveForwardRef(type);
    const existingModule = ownerNgModule.get(type);
    if (!existingModule && !isStandalone(type)) {
      errors.push(
        `구성 요소 ${stringifyForError(
          type,
        )}이 어떤 NgModule에도 포함되어 있지 않거나 해당 모듈이 당신의 모듈에 가져와지지 않았습니다.`,
      );
    }
  }

  function verifyCorrectBootstrapType(type: Type<any>) {
    type = resolveForwardRef(type);
    if (!getComponentDef(type)) {
      errors.push(`${stringifyForError(type)}은(는) 진입 구성 요소로 사용할 수 없습니다.`);
    }
    if (isStandalone(type)) {
      // 주의: 이 오류는 AOT 컴파일러의
      // `NGMODULE_BOOTSTRAP_IS_STANDALONE` 오류와 동일해야 합니다.
      errors.push(
        `\`${stringifyForError(type)}\` 클래스는 독립형 구성 요소로, ` +
          `\`@NgModule.bootstrap\` 배열에서 사용할 수 없습니다. 대신 \`bootstrapApplication\` ` +
          `함수를 사용하세요.`,
      );
    }
  }

  function verifySemanticsOfNgModuleImport(type: Type<any>, importingModule: Type<any>) {
    type = resolveForwardRef(type);

    const directiveDef = getComponentDef(type) || getDirectiveDef(type);
    if (directiveDef !== null && !directiveDef.standalone) {
      throw new Error(
        `예상치 못한 지시문 '${type.name}'이 모듈 '${importingModule.name}'에 의해 가져와졌습니다. @NgModule 주석을 추가해주세요.`,
      );
    }

    const pipeDef = getPipeDef(type);
    if (pipeDef !== null && !pipeDef.standalone) {
      throw new Error(
        `예상치 못한 파이프 '${type.name}'이 모듈 '${importingModule.name}'에 의해 가져와졌습니다. @NgModule 주석을 추가해주세요.`,
      );
    }
  }
}

function unwrapModuleWithProvidersImports(
  typeOrWithProviders: NgModuleType<any> | {ngModule: NgModuleType<any>},
): NgModuleType<any> {
  typeOrWithProviders = resolveForwardRef(typeOrWithProviders);
  return (typeOrWithProviders as any).ngModule || typeOrWithProviders;
}

function getAnnotation<T>(type: any, name: string): T | null {
  let annotation: T | null = null;
  collect(type.__annotations__);
  collect(type.decorators);
  return annotation;

  function collect(annotations: any[] | null) {
    if (annotations) {
      annotations.forEach(readAnnotation);
    }
  }

  function readAnnotation(decorator: {
    type: {prototype: {ngMetadataName: string}; args: any[]};
    args: any;
  }): void {
    if (!annotation) {
      const proto = Object.getPrototypeOf(decorator);
      if (proto.ngMetadataName == name) {
        annotation = decorator as any;
      } else if (decorator.type) {
        const proto = Object.getPrototypeOf(decorator.type);
        if (proto.ngMetadataName == name) {
          annotation = decorator.args[0];
        }
      }
    }
  }
}

/**
 * 컴파일된 구성 요소를 추적합니다. 테스트에서는 같은 구성 요소를 여러 NgModule로 컴파일하는 경우가 많습니다.
 * 이렇게 되면 구성 요소가 속하는 NgModule가 재설정되지 않으면 오류가 발생합니다.
 * 컴파일된 구성 요소 목록을 여기에서 유지하여 TestBed가 나중에 재설정할 수 있도록 합니다.
 */
let ownerNgModule = new WeakMap<Type<any>, NgModuleType<any>>();
let verifiedNgModule = new WeakMap<NgModuleType<any>, boolean>();

export function resetCompiledComponents(): void {
  ownerNgModule = new WeakMap<Type<any>, NgModuleType<any>>();
  verifiedNgModule = new WeakMap<NgModuleType<any>, boolean>();
  moduleQueue.length = 0;
  GENERATED_COMP_IDS.clear();
}

/**
 * 명시적인 선언과 가져온 모듈의 내보낸 선언을 따라 탐색하여 조합된 선언을 계산합니다.
 * @param type
 */
function computeCombinedExports(type: Type<any>): Type<any>[] {
  type = resolveForwardRef(type);
  const ngModuleDef = getNgModuleDef(type);

  // 독립형 구성 요소, 지시문 또는 파이프
  if (ngModuleDef === null) {
    return [type];
  }

  return flatten(
    maybeUnwrapFn(ngModuleDef.exports).map((type) => {
      const ngModuleDef = getNgModuleDef(type);
      if (ngModuleDef) {
        verifySemanticsOfNgModuleDef(type as any as NgModuleType, false);
        return computeCombinedExports(type);
      } else {
        return type;
      }
    }),
  );
}

/**
 * 선언된 일부 구성 요소는 비동기적으로 컴파일될 수 있으므로 아직 ɵcmp가 설정되지 않았을 수 있습니다.
 * 이 경우, 모듈에 대한 참조가 선언된 유형의 `ngSelectorScope` 속성에 기록됩니다.
 */
function setScopeOnDeclaredComponents(moduleType: Type<any>, ngModule: NgModule) {
  const declarations: Type<any>[] = flatten(ngModule.declarations || EMPTY_ARRAY);

  const transitiveScopes = transitiveScopesFor(moduleType);

  declarations.forEach((declaration) => {
    declaration = resolveForwardRef(declaration);
    if (declaration.hasOwnProperty(NG_COMP_DEF)) {
      // `ɵcmp` 필드가 존재합니다 - 바로 컴포넌트를 패치합니다.
      const component = declaration as Type<any> & {ɵcmp: ComponentDef<any>};
      const componentDef = getComponentDef(component)!;
      patchComponentDefWithScope(componentDef, transitiveScopes);
    } else if (
      !declaration.hasOwnProperty(NG_DIR_DEF) &&
      !declaration.hasOwnProperty(NG_PIPE_DEF)
    ) {
      // 컴포넌트 컴파일이 완료되면 참조를 위해 `ngSelectorScope`를 설정합니다.
      (declaration as Type<any> & {ngSelectorScope?: any}).ngSelectorScope = moduleType;
    }
  });
}

/**
 * 주어진 모듈의 컴파일 스코프에서 지시문과 파이프의 구성 요소 정의를 패치합니다.
 */
export function patchComponentDefWithScope<C>(
  componentDef: ComponentDef<C>,
  transitiveScopes: NgModuleTransitiveScopes,
) {
  componentDef.directiveDefs = () =>
    Array.from(transitiveScopes.compilation.directives)
      .map((dir) =>
        dir.hasOwnProperty(NG_COMP_DEF) ? getComponentDef(dir)! : getDirectiveDef(dir)!,
      )
      .filter((def) => !!def);
  componentDef.pipeDefs = () =>
    Array.from(transitiveScopes.compilation.pipes).map((pipe) => getPipeDef(pipe)!);
  componentDef.schemas = transitiveScopes.schemas;

  // 구성 요소/지시문/파이프의 재컴파일을 방지하기 위해 신선한 TView를 생성합니다.
  componentDef.tView = null;
}

/**
 * 주어진 유형(NgModule 또는 독립형 구성 요소/지시문/파이프)에 대한 전이 스코프(컴파일 스코프 및 내보낸 스코프) 쌍을 계산합니다.
 */
export function transitiveScopesFor<T>(type: Type<T>): NgModuleTransitiveScopes {
  if (isNgModule(type)) {
    if (USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
      const scope = depsTracker.getNgModuleScope(type);
      const def = getNgModuleDef(type, true);
      return {
        schemas: def.schemas || null,
        ...scope,
      };
    } else {
      return transitiveScopesForNgModule(type);
    }
  } else if (isStandalone(type)) {
    const directiveDef = getComponentDef(type) || getDirectiveDef(type);
    if (directiveDef !== null) {
      return {
        schemas: null,
        compilation: {
          directives: new Set<any>(),
          pipes: new Set<any>(),
        },
        exported: {
          directives: new Set<any>([type]),
          pipes: new Set<any>(),
        },
      };
    }

    const pipeDef = getPipeDef(type);
    if (pipeDef !== null) {
      return {
        schemas: null,
        compilation: {
          directives: new Set<any>(),
          pipes: new Set<any>(),
        },
        exported: {
          directives: new Set<any>(),
          pipes: new Set<any>([type]),
        },
      };
    }
  }

  // TODO: 오류 메시지를 더 친근하게 변경하고 독립형을 고려하기
  throw new Error(`${type.name}는 모듈 정의(ɵmod 속성)가 없습니다.`);
}

/**
 * 주어진 모듈에 대한 전이 스코프(컴파일 스코프 및 내보낸 스코프) 쌍을 계산합니다.
 *
 * 이 작업은 메모이제이션되어 결과가 모듈의 정의에 캐시됩니다.
 * 컴파일이 완전히 완료되지 않은 구성 요소가 있는 모듈에서 호출할 수 있지만,
 * 결과는 컴파일이 완료된 후에만 사용해야 합니다.
 *
 * @param moduleType 전이 스코프를 계산해야 하는 모듈.
 */
export function transitiveScopesForNgModule<T>(moduleType: Type<T>): NgModuleTransitiveScopes {
  const def = getNgModuleDef(moduleType, true);

  if (def.transitiveCompileScopes !== null) {
    return def.transitiveCompileScopes;
  }

  const scopes: NgModuleTransitiveScopes = {
    schemas: def.schemas || null,
    compilation: {
      directives: new Set<any>(),
      pipes: new Set<any>(),
    },
    exported: {
      directives: new Set<any>(),
      pipes: new Set<any>(),
    },
  };

  maybeUnwrapFn(def.imports).forEach(<I>(imported: Type<I>) => {
    // 이 모듈이 다른 모듈을 가져올 때,
    // 가져온 모듈의 내보낸 지시문과 파이프가 이 모듈의 컴파일 스코프에 추가됩니다.
    const importedScope = transitiveScopesFor(imported);
    importedScope.exported.directives.forEach((entry) => scopes.compilation.directives.add(entry));
    importedScope.exported.pipes.forEach((entry) => scopes.compilation.pipes.add(entry));
  });

  maybeUnwrapFn(def.declarations).forEach((declared) => {
    const declaredWithDefs = declared as Type<any> & {
      ɵpipe?: any;
    };

    if (getPipeDef(declaredWithDefs)) {
      scopes.compilation.pipes.add(declared);
    } else {
      // 선언된 구성 요소가 ɵcmp 또는 ɵdir이 있거나, 템플릿이 아직 컴파일되지 않은 구성 요소입니다.
      scopes.compilation.directives.add(declared);
    }
  });

  maybeUnwrapFn(def.exports).forEach(<E>(exported: Type<E>) => {
    const exportedType = exported as Type<E> & {
      // 구성 요소, 지시문, NgModules 및 파이프가 내보낼 수 있습니다.
      ɵcmp?: any;
      ɵdir?: any;
      ɵmod?: NgModuleDef<E>;
      ɵpipe?: any;
    };

    // 유형이 모듈, 파이프 또는 구성 요소/지시문일 수 있습니다.
    if (isNgModule(exportedType)) {
      // 이 모듈이 다른 모듈을 내보낼 때,
      // 내보낸 모듈의 내보낸 지시문과 파이프가
      // 이 모듈의 컴파일 및 내보낸 스코프에 추가됩니다.
      const exportedScope = transitiveScopesFor(exportedType);
      exportedScope.exported.directives.forEach((entry) => {
        scopes.compilation.directives.add(entry);
        scopes.exported.directives.add(entry);
      });
      exportedScope.exported.pipes.forEach((entry) => {
        scopes.compilation.pipes.add(entry);
        scopes.exported.pipes.add(entry);
      });
    } else if (getPipeDef(exportedType)) {
      scopes.exported.pipes.add(exportedType);
    } else {
      scopes.exported.directives.add(exportedType);
    }
  });

  def.transitiveCompileScopes = scopes;
  return scopes;
}

function expandModuleWithProviders(value: Type<any> | ModuleWithProviders<{}>): Type<any> {
  if (isModuleWithProviders(value)) {
    return value.ngModule;
  }
  return value;
}
