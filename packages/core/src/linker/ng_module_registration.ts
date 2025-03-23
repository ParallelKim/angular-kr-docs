/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {NgModuleType} from '../metadata/ng_module_def';
import {stringify} from '../util/stringify';

/**
 * 모듈 ID에 해당하는 NgModule의 맵.
 */
const modules = new Map<string, NgModuleType>();

/**
 * 중복 NgModule 등록 여부를 확인합니다.
 *
 * 테스트를 위해 비활성화할 수 있습니다.
 */
let checkForDuplicateNgModules = true;

function assertSameOrNotExisting(id: string, type: Type<any> | null, incoming: Type<any>): void {
  if (type && type !== incoming && checkForDuplicateNgModules) {
    throw new Error(
      `${id}에 대해 중복 모듈이 등록되었습니다 - ${stringify(type)} vs ${stringify(type.name)}`,
    );
  }
}

/**
 * 주어진 NgModule 유형을 Angular의 NgModule 레지스트리에 추가합니다.
 *
 * 이는 NgModule 컴파일의 부작용으로 생성됩니다. `id`가 명시적으로 전달되며
 * NgModule 정의에서 읽히지 않는 점에 유의하십시오. 이는 두 가지 이유가 있습니다:
 * 메가형식 읽기를 피하기 위함이며, JIT에서는 NgModule이 등록될 때 완전히
 * 해결되지 않을 수 있는 문제 때문입니다.
 *
 * @codeGenApi
 */
export function registerNgModuleType(ngModuleType: NgModuleType, id: string): void {
  const existing = modules.get(id) || null;
  assertSameOrNotExisting(id, existing, ngModuleType);
  modules.set(id, ngModuleType);
}

export function clearModulesForTest(): void {
  modules.clear();
}

export function getRegisteredNgModuleType(id: string): NgModuleType | undefined {
  return modules.get(id);
}

/**
 * NgModule 등록 시스템이 등록된 각 NgModule 유형이 고유한 ID를 갖도록 enforce하는지 제어합니다.
 *
 * 이는 Angular의 현재 API를 사용하여 테스트 간에 NgModule 레지스트리를 제대로
 * 재설정할 수 없기 때문에 테스트에 유용합니다.
 */
export function setAllowDuplicateNgModuleIdsForTest(allowDuplicates: boolean): void {
  checkForDuplicateNgModules = !allowDuplicates;
}
