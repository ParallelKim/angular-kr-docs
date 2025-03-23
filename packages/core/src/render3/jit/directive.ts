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
  R3DirectiveMetadataFacade,
} from '../../compiler/compiler_facade';
import {
  R3ComponentMetadataFacade,
  R3QueryMetadataFacade,
} from '../../compiler/compiler_facade_interface';
import {resolveForwardRef} from '../../di/forward_ref';
import {getReflect, reflectDependencies} from '../../di/jit/util';
import {Type} from '../../interface/type';
import type {Query} from '../../metadata/di';
import type {Component, Directive, Input} from '../../metadata/directives';
import {
  componentNeedsResolution,
  maybeQueueResolutionOfComponentResources,
} from '../../metadata/resource_loading';
import {ViewEncapsulation} from '../../metadata/view';
import {flatten} from '../../util/array_utils';
import {EMPTY_ARRAY, EMPTY_OBJ} from '../../util/empty';
import {initNgDevMode} from '../../util/ng_dev_mode';
import {getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef} from '../def_getters';
import {depsTracker, USE_RUNTIME_DEPS_TRACKER_FOR_JIT} from '../deps_tracker/deps_tracker';
import {NG_COMP_DEF, NG_DIR_DEF, NG_FACTORY_DEF} from '../fields';
import {ComponentDef, ComponentType, DirectiveDefList, PipeDefList} from '../interfaces/definition';
import {stringifyForError} from '../util/stringify_utils';

import {angularCoreEnv} from './environment';
import {getJitOptions} from './jit_options';
import {
  flushModuleScopingQueueAsMuchAsPossible,
  patchComponentDefWithScope,
  transitiveScopesFor,
} from './module';
import {isComponent, verifyStandaloneImport} from './util';

/**
 * JIT 컴파일 중 재진입 문제를 피하기 위해 컴파일 깊이를 추적합니다.
 * 이는 다음 시나리오에서 중요합니다:
 *
 * 'M' 모듈에 선언된 'A' 컴포넌트가 'B' 컴포넌트를 확장하는 경우를 고려해 보세요.
 * 'A'의 컴파일 중에 상속 체인을 캡처하기 위해 'B'의 정의를 요청하면,
 * 'B'의 컴파일을 촉발할 수 있습니다. 이러한 중첩된 컴파일이
 * `flushModuleScopingQueueAsMuchAsPossible`를 촉발할 경우
 * 모듈 'M'이 여전히 큐에 남아 있는 상태에서
 * 'A'와 'B'가 NgModule 범위로 패치될 수 있습니다.
 * 'A'의 컴파일이 아직 진행 중이므로,
 * 이는 컴파일에서 순환 의존성을 도입할 수 있습니다. 이를 피하기 위해
 * 모듈 범위 큐는 깊이 0에서만 플러시됩니다.
 */
let compilationDepth = 0;

/**
 * Angular 컴포넌트를 데코레이터 메타데이터에 따라 컴파일하고
 * 결과 컴포넌트 정의(ɵcmp)를 컴포넌트 유형에 패치합니다.
 *
 * 컴파일은 비동기적일 수 있습니다 (예: 컴포넌트 템플릿
 * 또는 기타 리소스를 위한 URL을 해결해야 할 필요성 때문입니다).
 * 컴파일이 즉시 이루어지지 않는 경우, `compileComponent`는
 * 리소스 해제를 글로벌 큐에 추가하고
 * 글로벌 큐가 `resolveComponentResources` 호출로 해제될 때까지
 * `ɵcmp`를 반환하지 않습니다.
 */
export function compileComponent(type: Type<any>, metadata: Component): void {
  // ngDevMode 초기화. 이것은 compileComponent에서 첫 번째 문장이어야 합니다.
  // 자세한 내용은 `initNgDevMode` 문서 문자열을 참조하세요.
  (typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode();

  let ngComponentDef: ComponentDef<unknown> | null = null;

  // 메타데이터는 해결해야 할 리소스를 가질 수 있습니다.
  maybeQueueResolutionOfComponentResources(type, metadata);

  // ngFactoryDef를 생성하는 데 필요한 메타데이터의 하위 집합인
  // `Directive`와 동일한 함수를 사용하고 있다는 점에 유의하세요.
  addDirectiveFactoryDef(type, metadata);

  Object.defineProperty(type, NG_COMP_DEF, {
    get: () => {
      if (ngComponentDef === null) {
        const compiler = getCompilerFacade({
          usage: JitCompilerUsage.Decorator,
          kind: 'component',
          type: type,
        });

        if (componentNeedsResolution(metadata)) {
          const error = [`컴포넌트 '${type.name}'이(가) 해결되지 않았습니다:`];
          if (metadata.templateUrl) {
            error.push(` - templateUrl: ${metadata.templateUrl}`);
          }
          if (metadata.styleUrls && metadata.styleUrls.length) {
            error.push(` - styleUrls: ${JSON.stringify(metadata.styleUrls)}`);
          }
          if (metadata.styleUrl) {
            error.push(` - styleUrl: ${metadata.styleUrl}`);
          }
          error.push(`'resolveComponentResources()'를 실행하고 기다렸습니까?`);
          throw new Error(error.join('\n'));
        }

        // 이 const는 이전에 `jitOptions`라고 불렸으나
        // 최적화된 JIT 빌드에서 `ReferenceError`를 발생시키는 Terser 버그 때문에
        // `options`로 이름이 변경되어야 했습니다.
        // 이 버그는 https://github.com/angular/angular-cli/issues/17264에서 조사되었습니다.
        // https://github.com/terser/terser/issues/615가 수정될 때까지
        // 다시 이름을 바꾸지 말아야 합니다.
        const options = getJitOptions();
        let preserveWhitespaces = metadata.preserveWhitespaces;
        if (preserveWhitespaces === undefined) {
          if (options !== null && options.preserveWhitespaces !== undefined) {
            preserveWhitespaces = options.preserveWhitespaces;
          } else {
            preserveWhitespaces = false;
          }
        }
        let encapsulation = metadata.encapsulation;
        if (encapsulation === undefined) {
          if (options !== null && options.defaultEncapsulation !== undefined) {
            encapsulation = options.defaultEncapsulation;
          } else {
            encapsulation = ViewEncapsulation.Emulated;
          }
        }

        const templateUrl = metadata.templateUrl || `ng:///${type.name}/template.html`;
        const meta: R3ComponentMetadataFacade = {
          ...directiveMetadata(type, metadata),
          typeSourceSpan: compiler.createParseSourceSpan('Component', type.name, templateUrl),
          template: metadata.template || '',
          preserveWhitespaces,
          styles:
            typeof metadata.styles === 'string'
              ? [metadata.styles]
              : metadata.styles || EMPTY_ARRAY,
          animations: metadata.animations,
          // JIT 컴포넌트는 항상 빈 세트의 `declarations`에 대해 컴파일됩니다. 대신,
          // `directiveDefs`와 `pipeDefs`는 나중에 업데이트됩니다:
          //  * NgModule 기반 컴포넌트의 경우, 해당
          //    컴포넌트를 선언하는 NgModule이 모듈 범위 큐에서 해결될 때 설정됩니다.
          //  * 독립형 컴포넌트의 경우, `compileComponent` 후에 설정됩니다.
          declarations: [],
          changeDetection: metadata.changeDetection,
          encapsulation,
          interpolation: metadata.interpolation,
          viewProviders: metadata.viewProviders || null,
        };

        compilationDepth++;
        try {
          if (meta.usesInheritance) {
            addDirectiveDefToUndecoratedParents(type);
          }
          ngComponentDef = compiler.compileComponent(
            angularCoreEnv,
            templateUrl,
            meta,
          ) as ComponentDef<unknown>;

          if (meta.isStandalone) {
            // 독립형 컴포넌트에 대한 컴포넌트 정의를 패치하고
            // 지연 계산되는 `directiveDefs`와
            // `pipeDefs` 함수를 설정합니다. 또한
            // 지연 해결된 임포트 목록으로 `dependencies`를 설정합니다.
            const imports: Type<any>[] = flatten(metadata.imports || EMPTY_ARRAY);
            const {directiveDefs, pipeDefs} = getStandaloneDefFunctions(type, imports);
            ngComponentDef.directiveDefs = directiveDefs;
            ngComponentDef.pipeDefs = pipeDefs;
            ngComponentDef.dependencies = () => imports.map(resolveForwardRef);
          }
        } finally {
          // 컴파일이 실패하더라도 컴파일 깊이가 감소되도록 합니다.
          compilationDepth--;
        }

        if (compilationDepth === 0) {
          // NgModule 데코레이터가 실행될 때, 우리는 모듈 정의를
          // 큐에 추가하여 모든 선언이 해결되었을 때만
          // 자신을 모듈 범위로 추가할 수 있습니다.
          flushModuleScopingQueueAsMuchAsPossible();
        }

        // 컴포넌트 컴파일이 비동기인 경우, 해당
        // 컴포넌트를 선언하는 @NgModule 주석이 실행될 수 있으며
        // 이는 컴포넌트 유형에서 ngSelectorScope 속성을 설정할 수 있습니다.
        // 이를 통해 컴포넌트는 컴파일이 완료된 후
        // 모듈로부터 directiveDefs로 자신을 패치할 수 있습니다.
        if (hasSelectorScope(type)) {
          const scopes = transitiveScopesFor(type.ngSelectorScope);
          patchComponentDefWithScope(ngComponentDef, scopes);
        }

        if (metadata.schemas) {
          if (meta.isStandalone) {
            ngComponentDef.schemas = metadata.schemas;
          } else {
            throw new Error(
              `스키마는 ${stringifyForError(
                type,
              )}에 대해 지정되었지만 독립형 컴포넌트에서만 유효합니다.`,
            );
          }
        } else if (meta.isStandalone) {
          ngComponentDef.schemas = [];
        }
      }
      return ngComponentDef;
    },
    set: (def: ComponentDef<unknown> | null) => {
      ngComponentDef = def;
    },
    // 테스트에서 오버라이드를 허용하기 위해 개발 모드에서 프로퍼티를 구성 가능하도록 만듭니다.
    configurable: !!ngDevMode,
  });
}

/**
 * 독립형 컴포넌트의 컴포넌트 정의에 대한 메모이즈된
 * `directiveDefs`와 `pipeDefs` 함수를 구축하여
 * `imports`를 처리하고 디렉티브와 파이프를 필터링합니다.
 * 여기서 메모이즈된 함수를 사용하면
 * 컴포넌트의 `imports`에 있는 모든 `forwardRef`의 지연 해석이 가능합니다.
 */
function getStandaloneDefFunctions(
  type: Type<any>,
  imports: Type<any>[],
): {
  directiveDefs: () => DirectiveDefList;
  pipeDefs: () => PipeDefList;
} {
  let cachedDirectiveDefs: DirectiveDefList | null = null;
  let cachedPipeDefs: PipeDefList | null = null;
  const directiveDefs = () => {
    if (!USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
      if (cachedDirectiveDefs === null) {
        // 독립형 컴포넌트는 항상 자기 참조가 가능하므로
        // 컴포넌트의 자체 정의를 `directiveDefs`에 포함합니다.
        cachedDirectiveDefs = [getComponentDef(type)!];
        const seen = new Set<Type<unknown>>([type]);

        for (const rawDep of imports) {
          ngDevMode && verifyStandaloneImport(rawDep, type);

          const dep = resolveForwardRef(rawDep);
          if (seen.has(dep)) {
            continue;
          }
          seen.add(dep);

          if (!!getNgModuleDef(dep)) {
            const scope = transitiveScopesFor(dep);
            for (const dir of scope.exported.directives) {
              const def = getComponentDef(dir) || getDirectiveDef(dir);
              if (def && !seen.has(dir)) {
                seen.add(dir);
                cachedDirectiveDefs.push(def);
              }
            }
          } else {
            const def = getComponentDef(dep) || getDirectiveDef(dep);
            if (def) {
              cachedDirectiveDefs.push(def);
            }
          }
        }
      }
      return cachedDirectiveDefs;
    } else {
      if (ngDevMode) {
        for (const rawDep of imports) {
          verifyStandaloneImport(rawDep, type);
        }
      }

      if (!isComponent(type)) {
        return [];
      }

      const scope = depsTracker.getStandaloneComponentScope(type, imports);

      return [...scope.compilation.directives]
        .map((p) => (getComponentDef(p) || getDirectiveDef(p))!)
        .filter((d) => d !== null);
    }
  };

  const pipeDefs = () => {
    if (!USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
      if (cachedPipeDefs === null) {
        cachedPipeDefs = [];
        const seen = new Set<Type<unknown>>();

        for (const rawDep of imports) {
          const dep = resolveForwardRef(rawDep);
          if (seen.has(dep)) {
            continue;
          }
          seen.add(dep);

          if (!!getNgModuleDef(dep)) {
            const scope = transitiveScopesFor(dep);
            for (const pipe of scope.exported.pipes) {
              const def = getPipeDef(pipe);
              if (def && !seen.has(pipe)) {
                seen.add(pipe);
                cachedPipeDefs.push(def);
              }
            }
          } else {
            const def = getPipeDef(dep);
            if (def) {
              cachedPipeDefs.push(def);
            }
          }
        }
      }
      return cachedPipeDefs;
    } else {
      if (ngDevMode) {
        for (const rawDep of imports) {
          verifyStandaloneImport(rawDep, type);
        }
      }

      if (!isComponent(type)) {
        return [];
      }

      const scope = depsTracker.getStandaloneComponentScope(type, imports);

      return [...scope.compilation.pipes].map((p) => getPipeDef(p)!).filter((d) => d !== null);
    }
  };

  return {
    directiveDefs,
    pipeDefs,
  };
}

function hasSelectorScope<T>(
  component: Type<T>,
): component is Type<T> & {ngSelectorScope: Type<any>} {
  return (component as {ngSelectorScope?: any}).ngSelectorScope !== undefined;
}

/**
 * Angular 지침을 그 데코레이터 메타데이터에 따라 컴파일하고
 * 결과 지침 정의를 컴포넌트 유형에 패치합니다.
 *
 * 컴파일이 즉시 이루어지지 않는 경우, `compileDirective`는
 * 컴파일이 완료되고 지침이 사용 가능해질 때까지
 * 해결될 `Promise`를 반환합니다.
 */
export function compileDirective(type: Type<any>, directive: Directive | null): void {
  let ngDirectiveDef: any = null;

  addDirectiveFactoryDef(type, directive || {});

  Object.defineProperty(type, NG_DIR_DEF, {
    get: () => {
      if (ngDirectiveDef === null) {
        // `directive`는 `@Directive()`를 사용하고
        // 선택자가 없는 추상 지침의 경우 null이 될 수 있습니다.
        // 이 경우, null 대신 빈 객체를 `directiveMetadata`
        // 함수에 전달합니다.
        const meta = getDirectiveMetadata(type, directive || {});
        const compiler = getCompilerFacade({
          usage: JitCompilerUsage.Decorator,
          kind: 'directive',
          type,
        });
        ngDirectiveDef = compiler.compileDirective(
          angularCoreEnv,
          meta.sourceMapUrl,
          meta.metadata,
        );
      }
      return ngDirectiveDef;
    },
    // 테스트에서 오버라이드를 허용하기 위해 개발 모드에서 프로퍼티를 구성 가능하도록 만듭니다.
    configurable: !!ngDevMode,
  });
}

function getDirectiveMetadata(type: Type<any>, metadata: Directive) {
  const name = type && type.name;
  const sourceMapUrl = `ng:///${name}/ɵdir.js`;
  const compiler = getCompilerFacade({usage: JitCompilerUsage.Decorator, kind: 'directive', type});
  const facade = directiveMetadata(type as ComponentType<any>, metadata);
  facade.typeSourceSpan = compiler.createParseSourceSpan('Directive', name, sourceMapUrl);
  if (facade.usesInheritance) {
    addDirectiveDefToUndecoratedParents(type);
  }
  return {metadata: facade, sourceMapUrl};
}

function addDirectiveFactoryDef(type: Type<any>, metadata: Directive | Component) {
  let ngFactoryDef: any = null;

  Object.defineProperty(type, NG_FACTORY_DEF, {
    get: () => {
      if (ngFactoryDef === null) {
        const meta = getDirectiveMetadata(type, metadata);
        const compiler = getCompilerFacade({
          usage: JitCompilerUsage.Decorator,
          kind: 'directive',
          type,
        });
        ngFactoryDef = compiler.compileFactory(angularCoreEnv, `ng:///${type.name}/ɵfac.js`, {
          name: meta.metadata.name,
          type: meta.metadata.type,
          typeArgumentCount: 0,
          deps: reflectDependencies(type),
          target: compiler.FactoryTarget.Directive,
        });
      }
      return ngFactoryDef;
    },
    // 테스트에서 오버라이드를 허용하기 위해 개발 모드에서 프로퍼티를 구성 가능하도록 만듭니다.
    configurable: !!ngDevMode,
  });
}

export function extendsDirectlyFromObject(type: Type<any>): boolean {
  return Object.getPrototypeOf(type.prototype) === Object.prototype;
}

/**
 * 특정 지침(지침 또는 컴포넌트)에 대한 `R3DirectiveMetadata`를 추출합니다.
 */
export function directiveMetadata(type: Type<any>, metadata: Directive): R3DirectiveMetadataFacade {
  // 입력 및 출력을 반영합니다.
  const reflect = getReflect();
  const propMetadata = reflect.ownPropMetadata(type);

  return {
    name: type.name,
    type: type,
    selector: metadata.selector !== undefined ? metadata.selector : null,
    host: metadata.host || EMPTY_OBJ,
    propMetadata: propMetadata,
    inputs: metadata.inputs || EMPTY_ARRAY,
    outputs: metadata.outputs || EMPTY_ARRAY,
    queries: extractQueriesMetadata(type, propMetadata, isContentQuery),
    lifecycle: {usesOnChanges: reflect.hasLifecycleHook(type, 'ngOnChanges')},
    typeSourceSpan: null!,
    usesInheritance: !extendsDirectlyFromObject(type),
    exportAs: extractExportAs(metadata.exportAs),
    providers: metadata.providers || null,
    viewQueries: extractQueriesMetadata(type, propMetadata, isViewQuery),
    isStandalone: metadata.standalone === undefined ? true : !!metadata.standalone,
    isSignal: !!metadata.signals,
    hostDirectives:
      metadata.hostDirectives?.map((directive) =>
        typeof directive === 'function' ? {directive} : directive,
      ) || null,
  };
}

/**
 * Angular 데코레이터가 없는 상위 클래스의 모든 클래스에
 * 지침 정의를 추가합니다.
 */
function addDirectiveDefToUndecoratedParents(type: Type<any>) {
  const objPrototype = Object.prototype;
  let parent = Object.getPrototypeOf(type.prototype).constructor;

  // 프로토타입을 'Object'에 도달할 때까지 올라갑니다.
  while (parent && parent !== objPrototype) {
    // 클래스가 이미 주석이 달려있다면 상속이 작동하므로
    // 주석이 없고 정의가 이미 생성되지 않은 경우에만
    // 정의를 추가해야 합니다.
    if (
      !getDirectiveDef(parent) &&
      !getComponentDef(parent) &&
      shouldAddAbstractDirective(parent)
    ) {
      compileDirective(parent, null);
    }
    parent = Object.getPrototypeOf(parent);
  }
}

function convertToR3QueryPredicate(selector: any): any | string[] {
  return typeof selector === 'string' ? splitByComma(selector) : resolveForwardRef(selector);
}

export function convertToR3QueryMetadata(propertyName: string, ann: Query): R3QueryMetadataFacade {
  return {
    propertyName: propertyName,
    predicate: convertToR3QueryPredicate(ann.selector),
    descendants: ann.descendants,
    first: ann.first,
    read: ann.read ? ann.read : null,
    static: !!ann.static,
    emitDistinctChangesOnly: !!ann.emitDistinctChangesOnly,
    isSignal: !!ann.isSignal,
  };
}
function extractQueriesMetadata(
  type: Type<any>,
  propMetadata: {[key: string]: any[]},
  isQueryAnn: (ann: any) => ann is Query,
): R3QueryMetadataFacade[] {
  const queriesMeta: R3QueryMetadataFacade[] = [];
  for (const field in propMetadata) {
    if (propMetadata.hasOwnProperty(field)) {
      const annotations = propMetadata[field];
      annotations.forEach((ann) => {
        if (isQueryAnn(ann)) {
          if (!ann.selector) {
            throw new Error(
              `속성 "${field}"의 쿼리를 생성할 수 없습니다: ` +
                `"${stringifyForError(type)}"에서 쿼리 선택자가 정의되지 않았습니다.`,
            );
          }
          if (annotations.some(isInputAnnotation)) {
            throw new Error(`@Input 데코레이터와 쿼리 데코레이터를 결합할 수 없습니다.`);
          }
          queriesMeta.push(convertToR3QueryMetadata(field, ann));
        }
      });
    }
  }
  return queriesMeta;
}

function extractExportAs(exportAs: string | undefined): string[] | null {
  return exportAs === undefined ? null : splitByComma(exportAs);
}

function isContentQuery(value: any): value is Query {
  const name = value.ngMetadataName;
  return name === 'ContentChild' || name === 'ContentChildren';
}

function isViewQuery(value: any): value is Query {
  const name = value.ngMetadataName;
  return name === 'ViewChild' || name === 'ViewChildren';
}

function isInputAnnotation(value: any): value is Input {
  return value.ngMetadataName === 'Input';
}

function splitByComma(value: string): string[] {
  return value.split(',').map((piece) => piece.trim());
}

const LIFECYCLE_HOOKS = [
  'ngOnChanges',
  'ngOnInit',
  'ngOnDestroy',
  'ngDoCheck',
  'ngAfterViewInit',
  'ngAfterViewChecked',
  'ngAfterContentInit',
  'ngAfterContentChecked',
];

function shouldAddAbstractDirective(type: Type<any>): boolean {
  const reflect = getReflect();

  if (LIFECYCLE_HOOKS.some((hookName) => reflect.hasLifecycleHook(type, hookName))) {
    return true;
  }

  const propMetadata = reflect.propMetadata(type);

  for (const field in propMetadata) {
    const annotations = propMetadata[field];

    for (let i = 0; i < annotations.length; i++) {
      const current = annotations[i];
      const metadataName = current.ngMetadataName;

      if (
        isInputAnnotation(current) ||
        isContentQuery(current) ||
        isViewQuery(current) ||
        metadataName === 'Output' ||
        metadataName === 'HostBinding' ||
        metadataName === 'HostListener'
      ) {
        return true;
      }
    }
  }

  return false;
}
