/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';

import {SchemaMetadata} from './schema';

export interface NgModuleType<T = any> extends Type<T> {
  ɵmod: NgModuleDef<T>;
}

/**
 * `NgModule`의 범위 확장을 나타냅니다.
 *
 * 범위는 특정 컨텍스트에서 보이는 지시어와 파이프의 집합입니다. 각 `NgModule`은 두 개의 범위를 가집니다. `compilation` 범위는 모듈에 의해 선언된 구성 요소의 템플릿에서 인식될 지시어와 파이프의 집합입니다. `exported` 범위는 모듈에 의해 내보낸 지시어와 파이프의 집합입니다 (즉, 모듈 A가 B를 가져올 때, 모듈 B의 내보낸 범위가 모듈 A의 컴파일 범위에 추가됩니다).
 */
export interface NgModuleTransitiveScopes {
  compilation: {directives: Set<any>; pipes: Set<any>};
  exported: {directives: Set<any>; pipes: Set<any>};
  schemas: SchemaMetadata[] | null;
}

/**
 * NgModules에 대한 런타임 링크 정보입니다.
 *
 * 이것은 런타임에서 구성 요소, 지시어, 파이프 및 주입기를 조립하는 데 사용되는 내부 데이터 구조입니다.
 *
 * 주의: 이 객체를 생성할 때는 항상 `ɵɵdefineNgModule` 함수를 사용해야 하며,
 * 객체의 모양이 버전 간에 변경될 수 있으므로 직접 객체를 생성해서는 안 됩니다.
 */
export interface NgModuleDef<T> {
  /** 모듈을 나타내는 토큰. DI에서 사용됩니다. */
  type: T;

  /**
   * 부트스트랩할 구성 요소 목록입니다.
   *
   * @see {NgModuleScopeInfoFromDecorator} 이 필드는 전역 컴파일 모드에서만 사용됩니다. 로컬 컴파일 모드에서는 부트스트랩 정보가 런타임에 계산되어 추가됩니다.
   */
  bootstrap: Type<any>[] | (() => Type<any>[]);

  /** 이 모듈에 의해 선언된 구성 요소, 지시어 및 파이프의 목록입니다. */
  declarations: Type<any>[] | (() => Type<any>[]);

  /** 이 모듈에 의해 가져온 모듈 또는 `ModuleWithProviders`의 목록입니다. */
  imports: Type<any>[] | (() => Type<any>[]);

  /**
   * 이 모듈에 의해 내보낸 모듈, `ModuleWithProviders`, 구성 요소, 지시어 또는 파이프의 목록입니다.
   */
  exports: Type<any>[] | (() => Type<any>[]);

  /**
   * 이 모듈에 대한 계산된 `transitiveCompileScopes`의 캐시된 값입니다.
   *
   * 이는 직접 읽어서는 안 되며, `transitiveScopesFor`를 통해 접근해야 합니다.
   */
  transitiveCompileScopes: NgModuleTransitiveScopes | null;

  /** NgModule에서 허용된 요소를 선언하는 스키마의 집합입니다. */
  schemas: SchemaMetadata[] | null;

  /** 등록해야 할 모듈에 대한 고유 ID입니다.  */
  id: string | null;
}
