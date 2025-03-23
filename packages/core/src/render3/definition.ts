/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ChangeDetectionStrategy} from '../change_detection/constants';
import {EnvironmentInjector} from '../di/r3_injector';
import {formatRuntimeError, RuntimeErrorCode} from '../errors';
import {Type, Writable} from '../interface/type';
import {NgModuleDef} from '../metadata/ng_module_def';
import {SchemaMetadata} from '../metadata/schema';
import {ViewEncapsulation} from '../metadata/view';
import {assertNotEqual} from '../util/assert';
import {noSideEffects} from '../util/closure';
import {EMPTY_ARRAY, EMPTY_OBJ} from '../util/empty';
import {initNgDevMode} from '../util/ng_dev_mode';
import {performanceMarkFeature} from '../util/performance';
import {getComponentDef, getDirectiveDef, getPipeDef} from './def_getters';

import type {
  ComponentDef,
  ComponentDefFeature,
  ComponentTemplate,
  ContentQueriesFunction,
  DependencyTypeList,
  DirectiveDef,
  DirectiveDefFeature,
  DirectiveDefListOrFactory,
  HostBindingsFunction,
  InputTransformFunction,
  PipeDef,
  PipeDefListOrFactory,
  TypeOrFactory,
  ViewQueriesFunction,
} from './interfaces/definition';
import {InputFlags} from './interfaces/input_flags';
import type {TAttributes, TConstantsOrFactory} from './interfaces/node';
import {CssSelectorList} from './interfaces/projection';
import {stringifyCSSSelectorList} from './node_selector_matcher';
import {StandaloneService} from './standalone_service';

/**
 * 주어진 지시자/컴포넌트에 대한 입력 맵입니다.
 *
 * 주어진:
 * ```ts
 * class MyComponent {
 *   @Input()
 *   publicInput1: string;
 *
 *   @Input('publicInput2')
 *   declaredInput2: string;
 *
 *   @Input({transform: (value: boolean) => value ? 1 : 0})
 *   transformedInput3: number;
 *
 *   signalInput = input(3);
 * }
 * ```
 *
 * 다음과 같이 설명됩니다:
 * ```ts
 * {
 *   publicInput1: 'publicInput1',
 *   declaredInput2: [InputFlags.None, 'declaredInput2', 'publicInput2'],
 *   transformedInput3: [
 *     InputFlags.None,
 *     'transformedInput3',
 *     'transformedInput3',
 *     (value: boolean) => value ? 1 : 0
 *   ],
 *   signalInput: [InputFlags.SignalBased, "signalInput"],
 * }
 * ```
 *
 * 이는 압축 해제기가 다음과 같이 변환할 수 있습니다:
 * ```ts
 * {
 *   minifiedPublicInput1: 'publicInput1',
 *   minifiedDeclaredInput2: [InputFlags.None, 'publicInput2', 'declaredInput2'],
 *   minifiedTransformedInput3: [
 *     InputFlags.None,
 *     'transformedInput3',
 *     'transformedInput3',
 *     (value: boolean) => value ? 1 : 0
 *   ],
 *   minifiedSignalInput: [InputFlags.SignalBased, "signalInput"],
 * }
 * ```
 *
 * 이렇게 하면 렌더링이 속성의 압축 해제된, 공개된 및 선언된 이름을 재구성할 수 있습니다.
 *
 * 참고:
 *  - 선언된 이름과 공개된 이름이 일반적으로 동일하므로 둘이 다를 때만 구분하여 `['declared', 'public']` 형식의 배열을 생성합니다.
 *  - 이 API와 `outputs` API가 동일하지 않은 이유는 `NgOnChanges`가 압축된 이름이 아닌 선언된 이름을 사용하는 불일치 behavior 때문입니다.
 */
type DirectiveInputs<T> = {
  [P in keyof T]?:  // 기본 경우. 압축된 이름을 공개된 이름에 매핑.
    | string
    // 플래그가 있거나 공개된 이름과 선언된 이름이 다른 경우 또는 변환이 있는 경우 복잡한 입력입니다. 이러한 입력은 일반적이지 않으므로 배열 형식은 그때만 생성됩니다.
    | [
        flags: InputFlags,
        publicName: string,
        declaredName?: string,
        transform?: InputTransformFunction,
      ];
};

interface DirectiveDefinition<T> {
  /**
   * 주입기를 구성하는 데 필요한 지시자 유형.
   */
  type: Type<T>;

  /** 이 지시자에 노드를 매칭하기 위해 사용되는 선택자들. */
  selectors?: CssSelectorList;

  /**
   * 입력 이름의 맵입니다.
   */
  inputs?: DirectiveInputs<T>;

  /**
   * 출력 이름의 맵입니다.
   *
   * 형식은: `{[actualPropertyName: string]:string}`입니다.
   *
   * 이는 압축 해제기가 변환할 수 있습니다: `{[minifiedPropertyName: string]:string}`.
   *
   * 이를 통해 렌더링이 속성의 압축 해제 및 비압축 해제된 이름을 재구성할 수 있습니다.
   */
  outputs?: {[P in keyof T]?: string};

  /**
   * 적용할 선택적 기능 목록입니다.
   *
   * 참조: {@link NgOnChangesFeature}, {@link ProvidersFeature}, {@link InheritDefinitionFeature}
   */
  features?: DirectiveDefFeature[];

  /**
   * 자식 지시자가 호스트 바인딩을 적용할 수 있도록 부모 템플릿에 의해 실행되는 함수.
   */
  hostBindings?: HostBindingsFunction<T>;

  /**
   * 이 지시자의 `hostBindings`에서의 바인딩 수(순수 함수 바인딩 포함).
   *
   * 이는 구성 요소의 LView 배열의 길이를 계산하는 데 사용됩니다. 따라서 배열을 미리 채우고 호스트 바인딩 시작 인덱스를 설정할 수 있습니다.
   */
  hostVars?: number;

  /**
   * 호스트 요소에 정적 속성 값을 할당합니다.
   *
   * 이 속성은 호스트 요소에 정적 속성 값과 클래스 및 스타일 값을 할당합니다. 속성 값은 다양한 유형의 값을 포함할 수 있으므로 `hostAttrs` 배열에는 다음 형식으로 값을 포함해야 합니다:
   *
   * attrs = [
   *   // 정적 속성 (예: `title`, `name`, `id`...)
   *   attr1, value1, attr2, value,
   *
   *   // 단일 네임스페이스 값 (예: `x:id`)
   *   NAMESPACE_MARKER, namespaceUri1, name1, value1,
   *
   *   // 또 다른 단일 네임스페이스 값 (예: `x:name`)
   *   NAMESPACE_MARKER, namespaceUri2, name2, value2,
   *
   *   // 요소에 적용될 일련의 CSS 클래스 (공백 없음)
   *   CLASSES_MARKER, class1, class2, class3,
   *
   *   // 요소에 적용될 일련의 CSS 스타일 (속성 + 값)
   *   STYLES_MARKER, prop1, value1, prop2, value2
   * ]
   *
   * 모든 비클래스 및 비스타일 속성은 클래스 및 스타일 값이 설정되기 전에 목록의 시작 부분에 먼저 정의되어야 합니다. 값 유형이 변경될 때(예: 클래스 및 스타일이 도입될 때) 항목을 구분하기 위해 마커를 사용해야 합니다. 마커 값 자체는 [AttributeMarker] 열거형에 있는 항목을 통해 설정됩니다.
   */
  hostAttrs?: TAttributes;

  /**
   * 주어진 지시자와 관련된 콘텐츠 쿼리 인스턴스를 생성하는 함수입니다.
   */
  contentQueries?: ContentQueriesFunction<T>;

  /**
   * 보기 쿼리 처리에 특별한 추가 지침 세트입니다. 이는 템플릿 함수에 삽입될 지침 세트로 간주될 수 있습니다.
   */
  viewQuery?: ViewQueriesFunction<T> | null;

  /**
   * 이 지시자를 변수에 할당하는 데 템플릿에서 사용할 수 있는 이름을 정의합니다.
   *
   * 참조: {@link Directive.exportAs}
   */
  exportAs?: string[];

  /**
   * 이 지시자/컴포넌트가 독립적인지 여부.
   */
  standalone?: boolean;

  /**
   * 이 지시자/컴포넌트가 신호 기반인지 여부.
   */
  signals?: boolean;
}

interface ComponentDefinition<T> extends Omit<DirectiveDefinition<T>, 'features'> {
  /**
   * 이 컴포넌트 템플릿의 노드, 로컬 참조 및 파이프 수.
   *
   * 이는 이 컴포넌트의 LView 배열의 길이를 계산하는 데 사용됩니다. 따라서 배열을 미리 채우고 바인딩 시작 인덱스를 설정할 수 있습니다.
   */
  decls: number;

  /**
   * 이 컴포넌트 템플릿의 바인딩 수(순수 함수 바인딩 포함).
   *
   * 이는 이 컴포넌트의 LView 배열의 길이를 계산하는 데 사용됩니다. 따라서 배열을 미리 채우고 호스트 바인딩 시작 인덱스를 설정할 수 있습니다.
   */
  vars: number;

  /**
   * DOM 렌더링에 사용되는 템플릿 함수입니다.
   *
   * 이 함수는 다음 구조를 가집니다.
   *
   * ```ts
   * function Template<T>(ctx:T, creationMode: boolean) {
   *   if (creationMode) {
   *     // 생성 모드 지침이 포함됩니다.
   *   }
   *   // 바인딩 업데이트 지침이 포함됩니다.
   * }
   * ```
   *
   * 일반적인 지침은 다음과 같습니다:
   * 생성 모드 지침:
   *  - `elementStart`, `elementEnd`
   *  - `text`
   *  - `container`
   *  - `listener`
   *
   * 바인딩 업데이트 지침:
   * - `bind`
   * - `elementAttribute`
   * - `elementProperty`
   * - `elementClass`
   * - `elementStyle`
   *
   */
  template: ComponentTemplate<T>;

  /**
   * 구성 요소의 뷰에 있는 노드에 대한 상수입니다.
   * 속성 배열, 로컬 정의 배열 등이 포함됩니다.
   */
  consts?: TConstantsOrFactory;

  /**
   * 템플릿에서 발견된 `ngContent[selector]` 값의 배열입니다.
   */
  ngContentSelectors?: string[];

  /**
   * 적용할 선택적 기능 목록입니다.
   *
   * 참조: {@link NgOnChangesFeature}, {@link ProvidersFeature}
   */
  features?: ComponentDefFeature[];

  /**
   * 구성 요소의 {@link /api/core/Component Component}에 대해 사용할 수 있는 템플릿 및 스타일 캡슐화 옵션을 정의합니다.
   */
  encapsulation?: ViewEncapsulation;

  /**
   * 렌더러 인스턴스에 저장될 개발자 정의 임의 데이터입니다.
   * 이는 다른 렌더러로 위임하는 렌더러에 유용합니다.
   *
   * 참조: 애니메이션
   */
  data?: {[kind: string]: any};

  /**
   * 구성 요소가 렌더링이 올바르게 이루어지기 위해 필요한 스타일 세트입니다.
   */
  styles?: string[];

  /**
   * 기본 변경 감지기가 변경을 감지하는 데 사용하는 전략입니다.
   * 설정 시, 다음 번 변경 감지가 트리거 될 때 적용됩니다.
   */
  changeDetection?: ChangeDetectionStrategy;

  /**
   * 이 구성 요소의 뷰에서 발견될 수 있는 지시자, 구성 요소 및 파이프의 등록부입니다.
   *
   * 이 속성은 유형 배열이거나 배열 유형이 반환되는 함수입니다. 이 함수는 전달 선언을 지원하기 위해 필요할 수 있습니다.
   */
  dependencies?: TypeOrFactory<DependencyTypeList>;

  /**
   * 구성 요소 템플릿에 허용될 요소를 선언하는 스키마 세트입니다.
   */
  schemas?: SchemaMetadata[] | null;
}

/**
 * 구성 요소 정의 객체를 생성합니다.
 *
 *
 * # 예시
 * ```ts
 * class MyComponent {
 *   // Angular 컴포넌트 컴파일러에 의해 생성됨
 *   // [Symbol] 구문은 v2.7까지 TypeScript에서 지원되지 않습니다.
 *   static ɵcmp = defineComponent({
 *     ...
 *   });
 * }
 * ```
 * @codeGenApi
 */
export function ɵɵdefineComponent<T>(
  componentDefinition: ComponentDefinition<T>,
): ComponentDef<any> {
  return noSideEffects(() => {
    // ngDevMode 초기화. 이것은 ɵɵdefineComponent의 첫 번째 문의어야 합니다.
    // 더 많은 정보를 보려면 `initNgDevMode` 문서 문자열을 참조하십시오.
    (typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode();

    const baseDef = getNgDirectiveDef(componentDefinition as DirectiveDefinition<T>);
    const def: Writable<ComponentDef<T>> = {
      ...baseDef,
      decls: componentDefinition.decls,
      vars: componentDefinition.vars,
      template: componentDefinition.template,
      consts: componentDefinition.consts || null,
      ngContentSelectors: componentDefinition.ngContentSelectors,
      onPush: componentDefinition.changeDetection === ChangeDetectionStrategy.OnPush,
      directiveDefs: null!, // noSideEffects에서 할당됨
      pipeDefs: null!, // noSideEffects에서 할당됨
      dependencies: (baseDef.standalone && componentDefinition.dependencies) || null,
      getStandaloneInjector: baseDef.standalone
        ? (parentInjector: EnvironmentInjector) => {
            return parentInjector.get(StandaloneService).getOrCreateStandaloneInjector(def);
          }
        : null,
      getExternalStyles: null,
      signals: componentDefinition.signals ?? false,
      data: componentDefinition.data || {},
      encapsulation: componentDefinition.encapsulation || ViewEncapsulation.Emulated,
      styles: componentDefinition.styles || EMPTY_ARRAY,
      _: null,
      schemas: componentDefinition.schemas || null,
      tView: null,
      id: '',
    };

    // TODO: 이게 아직 필요한가요/원하는가요?
    if (baseDef.standalone) {
      performanceMarkFeature('NgStandalone');
    }

    initFeatures(def);
    const dependencies = componentDefinition.dependencies;
    def.directiveDefs = extractDefListOrFactory(dependencies, /* pipeDef */ false);
    def.pipeDefs = extractDefListOrFactory(dependencies, /* pipeDef */ true);
    def.id = getComponentId(def);

    return def;
  });
}

export function extractDirectiveDef(type: Type<any>): DirectiveDef<any> | ComponentDef<any> | null {
  return getComponentDef(type) || getDirectiveDef(type);
}

function nonNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * @codeGenApi
 */
export function ɵɵdefineNgModule<T>(def: {
  /** 모듈을 나타내는 토큰. DI에서 사용됩니다. */
  type: T;

  /** 부트스트랩할 구성 요소 목록입니다. */
  bootstrap?: Type<any>[] | (() => Type<any>[]);

  /** 이 모듈에 의해 선언된 구성 요소, 지시자 및 파이프 목록입니다. */
  declarations?: Type<any>[] | (() => Type<any>[]);

  /** 이 모듈에서 가져온 모듈 또는 `ModuleWithProviders` 목록입니다. */
  imports?: Type<any>[] | (() => Type<any>[]);

  /**
   * 이 모듈에서 내보낸 모듈, `ModuleWithProviders`, 구성 요소, 지시자 또는 파이프 목록입니다.
   */
  exports?: Type<any>[] | (() => Type<any>[]);

  /** NgModule에 허용될 요소를 선언하는 스키마 세트입니다. */
  schemas?: SchemaMetadata[] | null;

  /** `getModuleFactory`와 함께 사용되는 모듈의 고유 ID입니다. */
  id?: string | null;
}): unknown {
  return noSideEffects(() => {
    const res: NgModuleDef<T> = {
      type: def.type,
      bootstrap: def.bootstrap || EMPTY_ARRAY,
      declarations: def.declarations || EMPTY_ARRAY,
      imports: def.imports || EMPTY_ARRAY,
      exports: def.exports || EMPTY_ARRAY,
      transitiveCompileScopes: null,
      schemas: def.schemas || null,
      id: def.id || null,
    };
    return res;
  });
}

/**
 * `DirectiveDefinition`에서 바인딩 객체를 변환하여 프레임워크 런타임에 최적화된 더 효율적인 조회 사전으로 변환합니다.
 *
 * 이 함수는 입력 또는 출력 지시자 정보를 새로운 객체로 변환하여 공개 이름이 압축된 내부 필드 이름에 적절히 매핑됩니다.
 *
 * 입력의 경우 입력 플래그도 새로운 데이터 구조에 유지되어 필요할 때 신속하게 검색할 수 있습니다.
 *
 * 예를 들어
 *
 * ```ts
 * class Comp {
 *   @Input()
 *   propName1: string;
 *
 *   @Input('publicName2')
 *   declaredPropName2: number;
 *
 *   inputSignal = input(3);
 * }
 * ```
 *
 * 다음과 같이 직렬화됩니다:
 *
 * ```ts
 * {
 *   propName1: 'propName1',
 *   declaredPropName2: ['publicName2', 'declaredPropName2'],
 *   inputSignal: [InputFlags.SignalBased, 'inputSignal'],
 * }
 * ```
 *
 * 이는 다음과 같이 변환됩니다:
 *
 * ```ts
 * {
 *   minifiedPropName1: 'propName1',
 *   minifiedPropName2: ['publicName2', 'declaredPropName2'],
 *   minifiedInputSignal: [InputFlags.SignalBased, 'inputSignal'],
 * }
 * ```
 *
 * 이는 다음과 같이 됩니다: (공식 이름 => 압축된 이름 + 필요 시 신호)
 *
 * ```ts
 * {
 *  'propName1': 'minifiedPropName1',
 *  'publicName2': 'minifiedPropName2',
 *  'inputSignal': ['minifiedInputSignal', InputFlags.SignalBased],
 * }
 * ```
 *
 * 선택적으로 이 함수는 `declaredInputs`를 받아 결과적으로: (공식 이름 => 선언된 이름)
 *
 * ```ts
 * {
 *  'propName1': 'propName1',
 *  'publicName2': 'declaredPropName2',
 *  'inputSignal': 'inputSignal',
 * }
 * ```
 *
 */
function parseAndConvertInputsForDefinition<T>(
  obj: DirectiveDefinition<T>['inputs'],
  declaredInputs: Record<string, string>,
) {
  if (obj == null) return EMPTY_OBJ as any;
  const newLookup: Record<
    string,
    [minifiedName: string, flags: InputFlags, transform: InputTransformFunction | null]
  > = {};
  for (const minifiedKey in obj) {
    if (obj.hasOwnProperty(minifiedKey)) {
      const value = obj[minifiedKey]!;
      let publicName: string;
      let declaredName: string;
      let inputFlags: InputFlags;
      let transform: InputTransformFunction | null;

      if (Array.isArray(value)) {
        inputFlags = value[0];
        publicName = value[1];
        declaredName = value[2] ?? publicName; // 선언된 이름은 바이트를 절약하기 위해 설정되지 않을 수 있습니다.
        transform = value[3] || null;
      } else {
        publicName = value;
        declaredName = value;
        inputFlags = InputFlags.None;
        transform = null;
      }

      newLookup[publicName] = [minifiedKey, inputFlags, transform];
      declaredInputs[publicName] = declaredName as string;
    }
  }
  return newLookup;
}

function parseAndConvertOutputsForDefinition<T>(
  obj: DirectiveDefinition<T>['outputs'],
): Record<keyof T, string> {
  if (obj == null) return EMPTY_OBJ as any;
  const newLookup: any = {};
  for (const minifiedKey in obj) {
    if (obj.hasOwnProperty(minifiedKey)) {
      newLookup[obj[minifiedKey]!] = minifiedKey;
    }
  }
  return newLookup;
}

/**
 * 지시자 정의 객체를 생성합니다.
 *
 * # 예시
 * ```ts
 * class MyDirective {
 *   // 각무 템플릿 컴파일러에 의해 생성됨
 *   // [Symbol] 구문은 v2.7까지 TypeScript에서 지원되지 않습니다.
 *   static ɵdir = ɵɵdefineDirective({
 *     ...
 *   });
 * }
 * ```
 *
 * @codeGenApi
 */
export function ɵɵdefineDirective<T>(
  directiveDefinition: DirectiveDefinition<T>,
): DirectiveDef<any> {
  return noSideEffects(() => {
    const def = getNgDirectiveDef(directiveDefinition);
    initFeatures(def);

    return def;
  });
}

/**
 * 파이프 정의 객체를 생성합니다.
 *
 * # 예시
 * ```ts
 * class MyPipe implements PipeTransform {
 *   // 각무 템플릿 컴파일러에 의해 생성됨
 *   static ɵpipe = definePipe({
 *     ...
 *   });
 * }
 * ```
 * @param pipeDef 컴파일러에 의해 생성된 파이프 정의
 *
 * @codeGenApi
 */
export function ɵɵdefinePipe<T>(pipeDef: {
  /** 파이프의 이름. 템플릿에서 파이프 정의와 일치시키는 데 사용됩니다. */
  name: string;

  /** 파이프 클래스 참조. 파이프 생명 주기 훅을 추출하는 데 필요합니다. */
  type: Type<T>;

  /** 파이프가 순수한지 여부. */
  pure?: boolean;

  /**
   * 파이프가 독립적인지 여부.
   */
  standalone?: boolean;
}): unknown {
  return <PipeDef<T>>{
    type: pipeDef.type,
    name: pipeDef.name,
    factory: null,
    pure: pipeDef.pure !== false,
    standalone: pipeDef.standalone ?? true,
    onDestroy: pipeDef.type.prototype.ngOnDestroy || null,
  };
}

function getNgDirectiveDef<T>(directiveDefinition: DirectiveDefinition<T>): DirectiveDef<T> {
  const declaredInputs: Record<string, string> = {};

  return {
    type: directiveDefinition.type,
    providersResolver: null,
    factory: null,
    hostBindings: directiveDefinition.hostBindings || null,
    hostVars: directiveDefinition.hostVars || 0,
    hostAttrs: directiveDefinition.hostAttrs || null,
    contentQueries: directiveDefinition.contentQueries || null,
    declaredInputs: declaredInputs,
    inputConfig: directiveDefinition.inputs || EMPTY_OBJ,
    exportAs: directiveDefinition.exportAs || null,
    standalone: directiveDefinition.standalone ?? true,
    signals: directiveDefinition.signals === true,
    selectors: directiveDefinition.selectors || EMPTY_ARRAY,
    viewQuery: directiveDefinition.viewQuery || null,
    features: directiveDefinition.features || null,
    setInput: null,
    resolveHostDirectives: null,
    hostDirectives: null,
    inputs: parseAndConvertInputsForDefinition(directiveDefinition.inputs, declaredInputs),
    outputs: parseAndConvertOutputsForDefinition(directiveDefinition.outputs),
    debugInfo: null,
  };
}

function initFeatures<T>(definition: DirectiveDef<T> | ComponentDef<T>): void {
  definition.features?.forEach((fn) => fn(definition));
}

export function extractDefListOrFactory(
  dependencies: TypeOrFactory<DependencyTypeList> | undefined,
  pipeDef: false,
): DirectiveDefListOrFactory | null;
export function extractDefListOrFactory(
  dependencies: TypeOrFactory<DependencyTypeList> | undefined,
  pipeDef: true,
): PipeDefListOrFactory | null;
export function extractDefListOrFactory(
  dependencies: TypeOrFactory<DependencyTypeList> | undefined,
  pipeDef: boolean,
): unknown {
  if (!dependencies) {
    return null;
  }

  const defExtractor = pipeDef ? getPipeDef : extractDirectiveDef;

  return () =>
    (typeof dependencies === 'function' ? dependencies() : dependencies)
      .map((dep) => defExtractor(dep))
      .filter(nonNull);
}

/**
 * 생성된 컴포넌트 ID와 유형을 포함하는 맵입니다.
 */
export const GENERATED_COMP_IDS = new Map<string, Type<unknown>>();

/**
 * 해당 구성 요소 정의에서 구성 요소 ID를 반환할 수 있는 메서드로, DJB2 해시의 변형을 사용합니다.
 */
function getComponentId<T>(componentDef: ComponentDef<T>): string {
  let hash = 0;

  // i18n이 있는 템플릿의 경우 `consts` 배열은 컴파일러에 의해 함수로 생성됩니다.
  // 클라이언트 및 서버 번들이 서로 다른 압축 구성을 사용하여 생성된 경우,
  // 함수 본문의 직렬화 가능한 내용은 클라이언트와 서버에서 다를 수 있습니다. 이로 인해
  // 다른 ID가 생성될 수 있습니다. 이 문제를 피하기 위해 `consts` 내용은 참조하지 않습니다.
  // 참조: https://github.com/angular/angular/issues/58713.
  const componentDefConsts = typeof componentDef.consts === 'function' ? '' : componentDef.consts;

  // 모듈마다 같은 선택자가 사용할 수 있으므로 구성 요소 선택자에만 의존할 수 없습니다.
  //
  // `componentDef.style`는 일관성 문제를 발생시키므로 사용되지 않습니다.
  //
  // 예시:
  // https://github.com/angular/components/blob/d9f82c8f95309e77a6d82fd574c65871e91354c2/src/material/core/option/option.ts#L248
  // https://github.com/angular/components/blob/285f46dc2b4c5b127d356cb7c4714b221f03ce50/src/material/legacy-core/option/option.ts#L32
  const hashSelectors = [
    componentDef.selectors,
    componentDef.ngContentSelectors,
    componentDef.hostVars,
    componentDef.hostAttrs,
    componentDefConsts,
    componentDef.vars,
    componentDef.decls,
    componentDef.encapsulation,
    componentDef.standalone,
    componentDef.signals,
    componentDef.exportAs,
    JSON.stringify(componentDef.inputs),
    JSON.stringify(componentDef.outputs),
    // 'componentDef.type.name'를 사용할 수 없습니다. 기호 이름이 변경되고 서버와 브라우저 번들에서 일치하지 않기 때문입니다.
    Object.getOwnPropertyNames(componentDef.type.prototype),
    !!componentDef.contentQueries,
    !!componentDef.viewQuery,
  ];

  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    // 클라이언트 및 서버 번들이 서로 다른 압축 구성을 사용하여 생성된 경우,
    // 함수 본문의 직렬화 가능한 내용이 클라이언트와 서버에서 다를 수 있습니다.
    // 컴포넌트 ID 계산에 함수가 우연히 사용되지 않도록 해야 합니다.
    for (const item of hashSelectors) {
      assertNotEqual(
        typeof item,
        'function',
        'Internal error: attempting to use a function in component id computation logic.',
      );
    }
  }

  for (const char of hashSelectors.join('|')) {
    hash = (Math.imul(31, hash) + char.charCodeAt(0)) << 0;
  }

  // 양수 해시 강제화.
  // 2147483647 = Integer.MAX_VALUE의 동등값.
  hash += 2147483647 + 1;

  const compId = 'c' + hash;

  if (
    (typeof ngDevMode === 'undefined' || ngDevMode) &&
    // 요청 간에 동일한 컴포넌트 인스턴스의 보장을 할 수 없기 때문에 서버에서 검사를 건너뜁니다.
    // 구성 요소가 아직 초기화되지 않았으므로 DI를 사용하여 서버에서 있는지 확인할 수 없습니다.
    (typeof ngServerMode === 'undefined' || !ngServerMode)
  ) {
    if (GENERATED_COMP_IDS.has(compId)) {
      const previousCompDefType = GENERATED_COMP_IDS.get(compId)!;
      if (previousCompDefType !== componentDef.type) {
        console.warn(
          formatRuntimeError(
            RuntimeErrorCode.COMPONENT_ID_COLLISION,
            `구성 요소 ID 생성 충돌이 감지되었습니다. '${previousCompDefType.name}' 및 '${componentDef.type.name}'이 '${stringifyCSSSelectorList(
              componentDef.selectors,
            )}' 선택자로 동일한 구성 요소 ID를 생성했습니다. 이를 수정하려면 이들 구성 요소 중 하나의 선택자를 변경하거나 별도의 호스트 속성을 추가하여 다른 ID를 강제화할 수 있습니다.`,
          ),
        );
      }
    } else {
      GENERATED_COMP_IDS.set(compId, componentDef.type);
    }
  }

  return compId;
}
