/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {NgModuleFactory as R3NgModuleFactory} from '../render3/ng_module_ref';

import {NgModuleFactory} from './ng_module_factory';
import {getRegisteredNgModuleType} from './ng_module_registration';

/**
 * 주어진 ID( [@NgModule.id 필드](api/core/NgModule#id) 사용)로 NgModuleFactory를 반환합니다.
 * 존재하고 로드된 경우에만 반환됩니다. `id`를 지정하지 않은 NgModule의 팩토리는
 * 검색할 수 없습니다. NgModule을 찾을 수 없는 경우 예외가 발생합니다.
 * @publicApi
 * @deprecated `getNgModuleById`를 대신 사용하세요.
 */
export function getModuleFactory(id: string): NgModuleFactory<any> {
  const type = getRegisteredNgModuleType(id);
  if (!type) throw noModuleError(id);
  return new R3NgModuleFactory(type);
}

/**
 * 주어진 ID( [@NgModule.id 필드](api/core/NgModule#id) 사용)로 NgModule 클래스를 반환합니다.
 * 존재하고 로드된 경우에만 반환됩니다. `id`를 지정하지 않은 NgModule의 클래스는
 * 검색할 수 없습니다. NgModule을 찾을 수 없는 경우 예외가 발생합니다.
 * @publicApi
 */
export function getNgModuleById<T>(id: string): Type<T> {
  const type = getRegisteredNgModuleType(id);
  if (!type) throw noModuleError(id);
  return type;
}

function noModuleError(id: string): Error {
  return new Error(`ID ${id}를 가진 모듈이 로드되지 않았습니다.`);
}
