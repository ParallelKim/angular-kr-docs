/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InputSignalNode} from '../../authoring/input/input_signal_node';
import {ModuleWithProviders, ProcessProvidersFunction} from '../../di/interface/provider';
import {EnvironmentInjector} from '../../di/r3_injector';
import {Type} from '../../interface/type';
import {SchemaMetadata} from '../../metadata/schema';
import {ViewEncapsulation} from '../../metadata/view';
import {FactoryFn} from '../definition_factory';

import {TAttributes, TConstantsOrFactory} from './node';
import {CssSelectorList} from './projection';
import type {TView} from './view';
import {InputFlags} from './input_flags';

/**
 * 컴포넌트의 템플릿 렌더링 함수의 정의입니다.
 */
export type ComponentTemplate<T> = {
  // 참고: ctx 매개변수는 T|U로 타입이 지정됩니다. U만 사용할 경우
  // e.g. ctx: {}가 ComponentTemplate<any>에 할당될 수 없게 되므로,
  // TypeScript가 이 경우 U = any를 추론하지 않기 때문입니다. T를 포함하여
  // 이 호환성 문제를 해결합니다.
  <U extends T>(rf: RenderFlags, ctx: T | U): void;
};

/**
 * 뷰 쿼리 함수의 정의입니다.
 */
export type ViewQueriesFunction<T> = <U extends T>(rf: RenderFlags, ctx: U) => void;

/**
 * 콘텐츠 쿼리 함수의 정의입니다.
 */
export type ContentQueriesFunction<T> = <U extends T>(
  rf: RenderFlags,
  ctx: U,
  directiveIndex: number,
) => void;

export interface ClassDebugInfo {
  className: string;
  filePath?: string;
  lineNumber?: number;
  forbidOrphanRendering?: boolean;
}

/**
 * 템플릿 함수에 전달되는 플래그로, 어떤 블록(예: 생성, 업데이트)
 * 실행해야 하는지를 결정합니다.
 *
 * 일반적으로 템플릿은 초기화 시 생성 블록과 업데이트 블록 모두를 실행하고,
 * 이후의 실행에서는 업데이트 블록만 실행됩니다. 그러나 동적으로 생성된 뷰는
 * 생성 블록이 업데이트 블록과 별도로 실행되어야 합니다(하위 호환성 유지).
 */
export const enum RenderFlags {
  /* 생성 블록을 실행할지 여부 (예: 요소 및 지시어 생성) */
  Create = 0b01,

  /* 업데이트 블록을 실행할지 여부 (예: 바인딩 새로 고침) */
  Update = 0b10,
}

/**
 * 렌더링을 위해 소비할 수 있도록 하는 static `ɵcmp`:`ComponentDef` 필드를 가진
 * `Type`의 서브클래스입니다.
 */
export interface ComponentType<T> extends Type<T> {
  ɵcmp: unknown;
}

/**
 * 렌더링을 위해 소비할 수 있도록 하는 static `ɵdir`:`DirectiveDef` 필드를 가진
 * `Type`의 서브클래스입니다.
 */
export interface DirectiveType<T> extends Type<T> {
  ɵdir: unknown;
  ɵfac: unknown;
}

/**
 * 렌더링을 위해 소비할 수 있도록 하는 static `ɵpipe`:`PipeDef` 필드를 가진
 * `Type`의 서브클래스입니다.
 */
export interface PipeType<T> extends Type<T> {
  ɵpipe: unknown;
}

/**
 * 지시문에 대한 런타임 링크 정보입니다.
 *
 * 이는 렌더가 지시문을 템플릿에 링크하기 위해 사용하는 내부 데이터 구조입니다.
 *
 * 참고: 항상 `defineDirective` 함수를 사용하여 이 객체를 생성해야 하며,
 * 객체를 직접 생성해서는 안 됩니다. 객체의 형식은 버전 간에 변경될 수 있습니다.
 *
 * @param Selector 지시문이나 컴포넌트의 선택기를 지정하는 타입 메타데이터입니다.
 *
 * 참조: {@link defineDirective}
 */
export interface DirectiveDef<T> {
  /**
   * 입력의 공개 이름을 최소화된 속성 이름과
   * (플래그가 있다면) 매핑하는 사전입니다.
   */
  readonly inputs: Record<
    string,
    [minifiedName: string, flags: InputFlags, transform: InputTransformFunction | null]
  >;

  /**
   * 컴파일러가 생성한 원시 입력 정보를 포함합니다.
   * `inputs`가 반전된 후 추가 처리를 위해 사용할 수 있습니다.
   */
  readonly inputConfig: {
    [P in keyof T]?: string | [InputFlags, string, string?, InputTransformFunction?];
  };

  /**
   * @deprecated 이는 `NgOnChanges`가 잘못된 이름을 사용하기 때문에
   * 선언된 이름을 여기에 두었습니다.
   */
  readonly declaredInputs: Record<string, string>;

  /**
   * 출력의 최소화된 속성 이름을 공개 API 이름과 매핑하는 사전입니다.
   * 이들은 별칭이거나 원래의 원본 속성 이름입니다.
   */
  readonly outputs: Record<string, string>;

  /**
   * 주어진 지시문에 연관된 콘텐츠 쿼리를 생성하고 새로 고치는 함수입니다.
   */
  contentQueries: ContentQueriesFunction<T> | null;

  /**
   * 지시문에 대한 쿼리 관련 지침입니다.
   * 지시문은 뷰를 가지지 않으므로 뷰 쿼리가 반드시 작동하지는 않지만,
   * 지시문을 확장하는 컴포넌트가 있을 수 있습니다.
   */
  viewQuery: ViewQueriesFunction<T> | null;

  /**
   * 연관된 지시문에 대한 호스트 바인딩을 새로 고칩니다.
   */
  readonly hostBindings: HostBindingsFunction<T> | null;

  /**
   * 이 지시문 `hostBindings`의 바인딩 수(모든 순수 함수 바인딩 포함)입니다.
   *
   * 컴포넌트의 LView 배열 길이를 계산하는 데 사용되며,
   * 배열을 미리 채우고 호스트 바인딩 시작 인덱스를 설정할 수 있습니다.
   */
  readonly hostVars: number;

  /**
   * 호스트 요소에 정적 속성 값을 할당합니다.
   *
   * 이 속성은 호스트 요소에 정적 속성 값과 클래스 및 스타일 값을 할당합니다.
   * 속성 값은 다양한 유형의 값을 가질 수 있으므로,
   * `hostAttrs` 배열은 다음 형식으로 값을 포함해야 합니다:
   *
   * attrs = [
   *   // 정적 속성 (예: `title`, `name`, `id`...)
   *   attr1, value1, attr2, value,
   *
   *   // 단일 네임스페이스값 (예: `x:id`)
   *   NAMESPACE_MARKER, namespaceUri1, name1, value1,
   *
   *   // 다른 단일 네임스페이스값 (예: `x:name`)
   *   NAMESPACE_MARKER, namespaceUri2, name2, value2,
   *
   *   // 요소에 적용될 CSS 클래스의 시리즈 (공백 없음)
   *   CLASSES_MARKER, class1, class2, class3,
   *
   *   // 요소에 적용될 CSS 스타일의 시리즈 (속성 + 값)
   *   STYLES_MARKER, prop1, value1, prop2, value2
   * ]
   *
   * 모든 비클래스 및 비스타일 속성은 목록 시작 부분에 정의되어야 하며,
   * 모든 클래스 및 스타일 값이 설정되기 전에 먼저 정의되어야 합니다.
   * 값 유형(클래스 및 스타일 도입 시)이 변경될 때는
   * 항목을 구분하기 위해 마커를 사용해야 합니다. 마커 값 자체는
   * [AttributeMarker] 열거형에 있는 항목을 통해 설정됩니다.
   */
  readonly hostAttrs: TAttributes | null;

  /** 지시문을 나타내는 토큰입니다. DI에서 사용됩니다. */
  readonly type: Type<T>;

  /** 제공자를 해결하고 DI 시스템으로 퍼블리시하는 함수입니다. */
  providersResolver:
    | (<U extends T>(def: DirectiveDef<U>, processProvidersFn?: ProcessProvidersFunction) => void)
    | null;

  /** 이 지시문과 매치되는 노드를 확인하는 데 사용되는 선택기입니다. */
  readonly selectors: CssSelectorList;

  /**
   * 지시문이 내보내는 이름 (템플릿 내 로컬 참조에 사용)
   */
  readonly exportAs: string[] | null;

  /**
   * 이 지시문(또는 컴포넌트)이 독립형인지 여부입니다.
   */
  readonly standalone: boolean;

  /**
   * 이 지시문(또는 컴포넌트)이 신호 작성 경험을 사용하는지 여부입니다.
   */
  readonly signals: boolean;

  /**
   * 새로운 지시문 인스턴스를 생성하는 데 사용되는 팩토리 함수입니다.
   * 처음에는 null로 설정됩니다. 지시문 인스턴스화 로직에 의해
   * 팩토리가 처음 요청될 때 채워집니다.
   */
  readonly factory: FactoryFn<T> | null;

  /**
   * 이 지시문에 적용되는 기능입니다.
   */
  readonly features: DirectiveDefFeature[] | null;

  /**
   * 이 컴포넌트에 대한 디버깅/문제 해결 관련 정보입니다.
   * 이 정보는 개발 모드에서만 사용할 수 있습니다.
   */
  debugInfo: ClassDebugInfo | null;

  /**
   * 템플릿 선택기 매칭이 완료된 후 호출되도록 의도된 함수로,
   * 호스트 지시문에 대한 정보를 해결합니다.
   * `ɵɵHostDirectivesFeature`에 의해 정의에 패치됩니다.
   */
  resolveHostDirectives: ((matches: DirectiveDef<unknown>[]) => HostDirectiveResolution) | null;

  /**
   * 지시문이 매치될 때마다 적용할 추가 지시문입니다.
   *
   * `HostDirectiveConfig` 객체는 호스트 지시문을 나타내며,
   * 지시문 정의 시 미리 처리되어야만 하며 지연 로드를 해야 합니다.
   *
   * **참고:** 배열에서 `HostDirectiveConfig`를 사용할 수 없으며,
   * 배열의 함수가 `Type`인지 `() => HostDirectiveConfig[]`인지 구별할 수 있는 방법이 없습니다.
   */
  hostDirectives: (HostDirectiveDef | (() => HostDirectiveConfig[]))[] | null;

  setInput:
    | (<U extends T>(
        this: DirectiveDef<U>,
        instance: U,
        inputSignalNode: null | InputSignalNode<unknown, unknown>,
        value: any,
        publicName: string,
        privateName: string,
      ) => void)
    | null;
}

/**
 * 컴포넌트에 대한 런타임 링크 정보입니다.
 *
 * 이는 렌더가 컴포넌트를 템플릿에 링크하기 위해 사용하는 내부 데이터 구조입니다.
 *
 * 참고: 항상 `defineComponent` 함수를 사용하여 이 객체를 생성해야 하며,
 * 객체를 직접 생성해서는 안 됩니다.
 * 이 객체의 형식은 버전 간에 변경될 수 있습니다.
 *
 * 참조: {@link defineComponent}
 */
export interface ComponentDef<T> extends DirectiveDef<T> {
  /**
   * 컴포넌트의 고유 ID입니다. 뷰 캡슐화와
   * 독립형 컴포넌트에서 주입기를 추적하는 데 사용됩니다.
   */
  readonly id: string;

  /**
   * 컴포넌트의 뷰 템플릿입니다.
   */
  readonly template: ComponentTemplate<T>;

  /** 컴포넌트 뷰와 관련된 상수입니다. */
  readonly consts: TConstantsOrFactory | null;

  /**
   * 템플릿에서 발견된 `ngContent[selector]` 값의 배열입니다.
   */
  readonly ngContentSelectors?: string[];

  /**
   * 컴포넌트가 올바르게 렌더링되려면 필요한 스타일 세트입니다.
   */
  readonly styles: string[];

  /**
   * 이 컴포넌트 템플릿의 노드, 로컬 레프 및 파이프 수입니다.
   *
   * 컴포넌트의 LView 배열 길이를 계산하는 데 사용되며,
   * 배열을 미리 채우고 바인딩 시작 인덱스를 설정할 수 있습니다.
   */
  // TODO(kara): 이 수에서 쿼리를 제거합니다.
  readonly decls: number;

  /**
   * 이 컴포넌트 템플릿의 바인딩 수 (순수 함수 바인딩 포함)입니다.
   *
   * 컴포넌트의 LView 배열 길이를 계산하는 데 사용되며,
   * 배열을 미리 채우고 호스트 바인딩 시작 인덱스를 설정할 수 있습니다.
   */
  readonly vars: number;

  /**
   * 컴포넌트에 대한 쿼리 관련 지침입니다.
   */
  viewQuery: ViewQueriesFunction<T> | null;

  /**
   * 뷰 캡슐화 유형으로, 스타일이 DOM 요소에 어떻게 적용되는지를 결정합니다.
   * 다음 중 하나입니다.
   * - `Emulated`(기본값): 스타일의 기본 범위 모방.
   * - `Native`: 렌더러의 기본 캡슐화 메커니즘 사용.
   * - `ShadowDom`: 최신 [ShadowDOM](https://w3c.github.io/webcomponents/spec/shadow/)을 사용하고
   *   컴포넌트의 호스트 요소에 대한 ShadowRoot 생성.
   * - `None`: 템플릿이나 스타일 캡슐화를 제공하지 않음.
   */
  readonly encapsulation: ViewEncapsulation;

  /**
   * 렌더러 인스턴스에 저장될 임의의 개발자 정의 데이터를 정의합니다.
   * 이는 다른 렌더러에 위임하는 렌더러에 유용합니다.
   */
  readonly data: {
    [kind: string]: any;
    animation?: any[];
  };

  /** 이 컴포넌트의 ChangeDetectionStrategy가 OnPush인지 여부입니다. */
  readonly onPush: boolean;

  /** 이 컴포넌트가 신호 기반인지 여부입니다. */
  readonly signals: boolean;

  /**
   * 이 뷰에서 발견될 수 있는 지시문 및 컴포넌트의 레지스트리입니다.
   *
   * 이 속성은 `DirectiveDef` 배열이거나 `DirectiveDef` 배열을 반환하는 함수입니다.
   * 이 함수는 전방 선언을 지원하기 위해 필요합니다.
   */
  directiveDefs: DirectiveDefListOrFactory | null;

  /**
   * 이 뷰에서 발견될 수 있는 파이프의 레지스트리입니다.
   *
   * 이 속성은 `PipeDefs` 배열이거나 `PipeDefs` 배열을 반환하는 함수입니다.
   * 이 함수는 전방 선언을 지원하기 위해 필요합니다.
   */
  pipeDefs: PipeDefListOrFactory | null;

  /**
   * 컴포넌트의 모든 의존성의 필터링되지 않은 목록입니다.
   * 없을 경우 null입니다.
   */
  dependencies: TypeOrFactory<DependencyTypeList> | null;

  /**
   * 컴포넌트 템플릿에서 허용되는 요소를 선언하는 스키마 집합입니다.
   */
  schemas: SchemaMetadata[] | null;

  /**
   * Ivy 런타임은 이 장소를 사용하여 컴포넌트에 대한 계산된 tView를 저장합니다.
   * 이 값은 컴포넌트의 첫 번째 실행에서 채워집니다.
   */
  tView: TView | null;

  /**
   * 독립형 주입기를 생성하는 데 사용되는 프레임워크의 함수입니다.
   */
  getStandaloneInjector:
    | ((parentInjector: EnvironmentInjector) => EnvironmentInjector | null)
    | null;

  /**
   * 외부 런타임 스타일 URL 목록을 생성하는 프레임워크의 함수입니다.
   */
  getExternalStyles: ((encapsulationId?: string) => string[]) | null;

  /**
   * `noSideEffects` 함수의 결과를 저장하기 위해 사용되며,
   * 이 값은 클로저 컴파일러에 의해 제거되지 않습니다.
   * 이 속성은 절대로 읽으면 안 됩니다.
   */
  readonly _?: unknown;
}

/**
 * 파이프에 대한 런타임 링크 정보입니다.
 *
 * 이는 렌더러가 파이프를 템플릿에 링크하기 위해 사용하는 내부 데이터 구조입니다.
 *
 * 참고: 항상 `definePipe` 함수를 사용하여 이 객체를 생성해야 하며,
 * 객체를 직접 생성해서는 안 됩니다.
 * 이 객체의 형식은 버전 간에 변경될 수 있습니다.
 *
 * 참조: {@link definePipe}
 */
export interface PipeDef<T> {
  /** 파이프를 나타내는 토큰입니다. */
  type: Type<T>;

  /**
   * 파이프 이름입니다.
   *
   * 템플릿에서 파이프를 해결하는 데 사용됩니다.
   */
  readonly name: string;

  /**
   * 새 파이프 인스턴스를 생성하는 데 사용되는 팩토리 함수입니다.
   * 처음에는 null로 설정됩니다. 파이프 인스턴스화 로직에 의해
   * 팩토리가 처음 요청될 때 채워집니다.
   */
  factory: FactoryFn<T> | null;

  /**
   * 파이프가 순수한지 여부입니다.
   *
   * 순수 파이프 결과는 파이프 입력에만 의존하며 내부
   * 상태에 의존하지 않습니다.
   */
  readonly pure: boolean;

  /**
   * 이 파이프가 독립형인지 여부입니다.
   */
  readonly standalone: boolean;

  /* 이 파이프에 대한 생명 주기 훅입니다. */
  onDestroy: (() => void) | null;
}

export interface DirectiveDefFeature {
  <T>(directiveDef: DirectiveDef<T>): void;
  /**
   * {@link InheritDefinitionFeature}가 상속 중에 실행할
   * 것으로 표시된 기능입니다.
   *
   * 참고: 모듈의 루트에서 설정하지 마십시오! 그렇게 하면
   * 트리 쉐이커/번들러가 변경 사항을 부작용으로 인식하므로,
   * 이 기능이 모든 번들에 포함됩니다.
   */
  ngInherit?: true;
}

/** 노드에 대한 호스트 지시문이 해결된 후 생성된 데이터입니다. */
export type HostDirectiveResolution = [
  matches: DirectiveDef<unknown>[],
  hostDirectiveDefs: HostDirectiveDefs | null,
  hostDirectiveRanges: HostDirectiveRanges | null,
];

/**
 * 선택기에 의해 매치된 지시문을 호스트 지시문이 선언된 범위로 추적하는 맵입니다.
 * 특정 지시문에 대한 호스트 지시문은 항상 런타임 내에서 연속적입니다.
 * 시작과 끝 모두 포함되며, 두 값 모두는 `tNode.directiveStart` 이후입니다.
 */
export type HostDirectiveRanges = Map<DirectiveDef<unknown>, [start: number, end: number]>;

/** 호스트 지시문을 구성하는 데 사용되는 런타임 정보입니다. */
export interface HostDirectiveDef<T = unknown> {
  /** 호스트 지시문을 나타내는 클래스입니다. */
  directive: Type<T>;

  /** 노출된 지시문의 입력입니다. */
  inputs: HostDirectiveBindingMap;

  /** 노출된 지시문의 출력입니다. */
  outputs: HostDirectiveBindingMap;
}

/**
 * 공개 별칭과 기저 입력/출력을 매핑하는 것입니다.
 * 저자가 노출하기로 결정한 호스트 지시문의 입력/출력의 허용 목록 역할도 합니다.
 */
export type HostDirectiveBindingMap = {
  [publicName: string]: string;
};

/**
 * 호스트 지시문으로 사용된 지시문과
 * 이를 정의하는 데 사용된 구성을 매핑합니다.
 */
export type HostDirectiveDefs = Map<DirectiveDef<unknown>, HostDirectiveDef>;

/** 호스트 지시문을 구성하는 데 사용될 수 있는 값입니다. */
export type HostDirectiveConfig =
  | Type<unknown>
  | {
      directive: Type<unknown>;
      inputs?: string[];
      outputs?: string[];
    };

export interface ComponentDefFeature {
  <T>(componentDef: ComponentDef<T>): void;
  /**
   * {@link InheritDefinitionFeature}가 상속 중에 실행할
   * 것으로 표시된 기능입니다.
   *
   * 참고: 모듈의 루트에서 설정하지 마십시오! 그렇게 하면
   * 트리 쉐이커/번들러가 변경 사항을 부작용으로 인식하므로,
   * 이 기능이 모든 번들에 포함됩니다.
   */
  ngInherit?: true;
}

/** 들어오는 입력 값을 변환하는 데 사용할 수 있는 함수입니다. */
export type InputTransformFunction = (value: any) => any;

/**
 * 컴포넌트 정의의 directiveDefs에 사용되는 타입입니다.
 *
 * 이 함수는 전방 선언을 지원하기 위해 필요합니다.
 */
export type DirectiveDefListOrFactory = (() => DirectiveDefList) | DirectiveDefList;

export type DirectiveDefList = (DirectiveDef<any> | ComponentDef<any>)[];

export type DependencyDef = DirectiveDef<unknown> | ComponentDef<unknown> | PipeDef<unknown>;

export type DirectiveTypesOrFactory = (() => DirectiveTypeList) | DirectiveTypeList;

export type DirectiveTypeList = (
  | DirectiveType<any>
  | ComponentType<any>
  | Type<any>
) /* Type as workaround for: Microsoft/TypeScript/issues/4881 */[];

export type DependencyType = DirectiveType<any> | ComponentType<any> | PipeType<any> | Type<any>;

export type DependencyTypeList = Array<DependencyType>;

export type TypeOrFactory<T> = T | (() => T);

export type HostBindingsFunction<T> = <U extends T>(rf: RenderFlags, ctx: U) => void;

/**
 * 컴포넌트 정의의 PipeDefs에 사용되는 타입입니다.
 *
 * 이 함수는 전방 선언을 지원하기 위해 필요합니다.
 */
export type PipeDefListOrFactory = (() => PipeDefList) | PipeDefList;

export type PipeDefList = PipeDef<any>[];

export type PipeTypesOrFactory = (() => PipeTypeList) | PipeTypeList;

export type PipeTypeList = (
  | PipeType<any>
  | Type<any>
) /* Type as workaround for: Microsoft/TypeScript/issues/4881 */[];

/**
 * AoT 컴파일러에서 제공하는 NgModule 범위 정보입니다.
 *
 * 전체 컴파일에서 Ivy는 "providers가 있는 모듈"과
 * 전방 참조를 해결하며, 요소가 최소 하나가 전방 참조된 경우
 * 전체 배열을 전달합니다.
 * 그래서 우리는 `Type<any>[] | (() => Type<any>[])` 유형에 도달합니다.
 *
 * 로컬 모드에서 컴파일러는 원시 정보를
 * 런타임 함수에 그대로 전달하며 컴파일 시간에
 * 추가로 해결할 수 없습니다. 그래서 우리는
 * `RawScopeInfoFromDecorator[]` 유형에 도달합니다.
 */
export interface NgModuleScopeInfoFromDecorator {
  /** 이 모듈에 의해 선언된 컴포넌트, 지시문 및 파이프의 목록입니다. */
  declarations?: Type<any>[] | (() => Type<any>[]) | RawScopeInfoFromDecorator[];

  /** 이 모듈에 의해 가져온 모듈 또는 `ModuleWithProviders` 또는 독립형 컴포넌트의 목록입니다. */
  imports?: Type<any>[] | (() => Type<any>[]) | RawScopeInfoFromDecorator[];

  /**
   * 이 모듈에 의해 내보낸 모듈, `ModuleWithProviders`, 컴포넌트, 지시문 또는 파이프의 목록입니다.
   */
  exports?: Type<any>[] | (() => Type<any>[]) | RawScopeInfoFromDecorator[];

  /**
   * 이 모듈 bootstrap되면 bootstrap될 구성 요소의 집합입니다.
   * 이 필드는 로컬 컴파일 모드에서만 사용 가능합니다.
   * 전체 컴파일 모드에서는 bootstrap 정보가
   * 정적으로 분석되고 해결됨에 따라 모듈 정의 런타임에 직접 전달됩니다.
   */
  bootstrap?: Type<any>[] | (() => Type<any>[]) | RawScopeInfoFromDecorator[];
}

/**
 * 다음에 전달된 배열 요소 유형:
 *  - NgModule의 주석 imports/exports/declarations 필드
 *  - 독립형 컴포넌트 주석 imports 필드
 */
export type RawScopeInfoFromDecorator =
  | Type<any>
  | ModuleWithProviders<any>
  | (() => Type<any>)
  | (() => ModuleWithProviders<any>)
  | any[];
