/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * NgModule과 관련된 스키마 정의입니다.
 *
 * @see {@link NgModule}
 * @see {@link CUSTOM_ELEMENTS_SCHEMA}
 * @see {@link NO_ERRORS_SCHEMA}
 *
 * @param name 정의된 스키마의 이름입니다.
 *
 * @publicApi
 */
export interface SchemaMetadata {
  name: string;
}

/**
 * NgModule이 다음을 포함할 수 있도록 허용하는 스키마를 정의합니다:
 * - 대시 표기법(`-`)으로 명명된 비-Angular 요소들.
 * - 대시 표기법(`-`)으로 명명된 요소 속성들.
 * 대시 표기법은 사용자 정의 요소를 위한 명명 규칙입니다.
 *
 * @publicApi
 */
export const CUSTOM_ELEMENTS_SCHEMA: SchemaMetadata = {
  name: 'custom-elements',
};

/**
 * 모든 요소의 모든 속성을 허용하는 스키마를 정의합니다.
 *
 * 이 스키마는 템플릿 내의 알 수 없는 요소나 속성과 관련된 오류를 무시할 수 있도록 허용합니다. 이 스키마의 사용은 일반적으로 권장되지 않으며, 유용한 검증을 방해하고 템플릿 내의 실제 오류를 숨길 수 있습니다. 대신 `CUSTOM_ELEMENTS_SCHEMA`를 사용하는 것을 고려하십시오.
 *
 * @publicApi
 */
export const NO_ERRORS_SCHEMA: SchemaMetadata = {
  name: 'no-errors-schema',
};
