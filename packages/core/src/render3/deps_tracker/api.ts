/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../../interface/type';
import {NgModuleType} from '../../metadata/ng_module_def';
import {
  ComponentType,
  DependencyTypeList,
  DirectiveType,
  NgModuleScopeInfoFromDecorator,
  PipeType,
} from '../interfaces/definition';

/**
 * 특정 컨텍스트에서 타입의 종속성 집합을 나타냅니다.
 */
interface ScopeData {
  pipes: Set<PipeType<any>>;
  directives: Set<DirectiveType<any> | ComponentType<any> | Type<any>>;

  /**
   * true인 경우, 이 범위를 계산하는 것이 성공적이지 않았음을 나타냅니다. 소비자는
   * 이 내용을 빈 종속성으로 해석해야 합니다. 이 플래그의 적용은 범위를 재귀적으로 계산할 때,
   * 범위 종속성에서 이 플래그가 존재하면 범위도 오염된 것이며 따라서 재귀를 계속할 필요 없이
   * 즉시 반환할 수 있습니다. 이 오류의 이유는 오늘날 JIT 동작에 따라 콘솔의 오류 메시지로 표시됩니다.
   * 또한 로컬 컴파일의 경우, 로컬 컴파일과 병렬로 실행되는 다른 빌드/컴파일이 오류에 대한
   * 일부 세부 정보를 드러낼 수 있습니다.
   */
  isPoisoned?: boolean;
}

/**
 * deps 추적기가 런타임 동안 계산한 독립형 컴포넌트를 위한 범위 데이터를 나타냅니다.
 */
interface StandaloneCompScopeData extends ScopeData {
  // 독립형 컴포넌트는 주입기 정보를 결정하기 위해 종속성에 가져온 NgModules를 포함합니다.
  // 다음 필드는 이러한 NgModules의 집합을 저장합니다.
  ngModules: Set<NgModuleType<any>>;
}

/** deps 추적기가 런타임 동안 계산한 NgModule을 위한 범위 데이터를 나타냅니다. */
export interface NgModuleScope {
  compilation: ScopeData;
  exported: ScopeData;
}

/**
 * deps 추적기가 런타임 동안 계산한 독립형 컴포넌트를 위한 범위 데이터를 나타냅니다.
 */
export interface StandaloneComponentScope {
  compilation: StandaloneCompScopeData;
}

/** deps 추적기가 런타임 동안 계산한 컴포넌트 종속성 정보를 나타냅니다. */
export interface ComponentDependencies {
  dependencies: DependencyTypeList;
}

/**
 * 런타임 deps 추적기(RDT)에 대한 공개 API입니다.
 *
 * 모든 하위 도구는 이러한 메소드만 사용해야 합니다.
 */
export interface DepsTrackerApi {
  /**
   * 컴포넌트의 템플릿에 존재할 수 있는 컴포넌트/디렉티브/파이프의 집합인
   * 컴포넌트 종속성을 계산합니다(이 집합은 구현에 따라 컴포넌트의 템플릿에서
   * 반드시 사용되지 않는 디렉티브/컴포넌트/파이프를 포함할 수 있습니다).
   *
   * 독립형 컴포넌트는 이 정보가 타입에서 사용 가능하지 않기 때문에 `rawImports`를 명시해야 합니다.
   * 소비자(예: {@link getStandaloneDefFunctions})는 이 매개변수를 전달할 것으로 예상됩니다.
   *
   * 구현은 이 계산을 최적화하기 위해 일부 캐싱 메커니즘을 사용할 것으로 기대됩니다.
   */
  getComponentDependencies(
    cmp: ComponentType<any>,
    rawImports?: (Type<any> | (() => Type<any>))[],
  ): ComponentDependencies;

  /**
   * 주어진 범위 정보로 추적기에 NgModule을 등록합니다.
   *
   * 이 방법은 로컬 모드로 컴파일되든 상관없이 모든 NgModule에 대해 호출되어야 합니다.
   * 일부 종속성이 서로 다른 컴파일 유닛에서 서로 다른 컴파일 모드로 존재할 수 있기 때문에
   * 컴포넌트의 종속성을 계산하는 데 필요합니다.
   */
  registerNgModule(type: Type<any>, scopeInfo: NgModuleScopeInfoFromDecorator): void;

  /**
   * NgModule 또는 독립형 컴포넌트의 범위 캐시를 지웁니다. 이는 범위를 재계산하도록 강제하며,
   * 이 작업은 전이 폐쇄를 집계하는 것을 포함하기 때문에 비용이 많이 들 수 있습니다.
   *
   * 이 방법의 주요 용도는 테스트 베드로, 캐시를 지워서 재정의 후 범위 업데이트를 강제하고자 할 때입니다.
   */
  clearScopeCacheFor(type: Type<any>): void;

  /**
   * NgModule의 범위를 반환합니다. 주로 JIT 및 테스트 베드에서 사용됩니다.
   *
   * 여기의 범위 값은 메모이즈됩니다. 새 계산을 강제하려면
   * `clearScopeCacheFor` 메소드를 사용하여 캐시를 지우십시오.
   */
  getNgModuleScope(type: NgModuleType<any>): NgModuleScope;

  /**
   * 독립형 컴포넌트의 범위를 반환합니다. 주로 JIT에서 사용됩니다. 이 방법은
   * 모든 순방향 참조를 해결할 수 있도록 초기 파싱 후 지연 호출해야 합니다.
   *
   * @param rawImports 컴포넌트 장식자에 나타나는 가져오기 문으로,
   *     타입뿐만 아니라 순방향 참조로 구성됩니다.
   *
   * 여기의 범위 값은 메모이즈됩니다. 새 계산을 강제하려면
   * `clearScopeCacheFor` 메소드를 사용하여 캐시를 지우십시오.
   */
  getStandaloneComponentScope(
    type: ComponentType<any>,
    rawImports: (Type<any> | (() => Type<any>))[],
  ): StandaloneComponentScope;

  /**
   * 컴포넌트를 선언하는 NgModule이 브라우저에 아직 로드되지 않았는지 확인합니다.
   * 독립형 컴포넌트에는 항상 false를 반환합니다.
   */
  isOrphanComponent(cmp: ComponentType<any>): boolean;
}
