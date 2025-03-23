/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {Type} from '../interface/type';
import type {NgModuleDef} from '../r3_symbols';
import {stringify} from '../util/stringify';
import {NG_COMP_DEF, NG_DIR_DEF, NG_MOD_DEF, NG_PIPE_DEF} from './fields';
import type {ComponentDef, DirectiveDef, PipeDef} from './interfaces/definition';

export function getNgModuleDef<T>(type: any, throwIfNotFound: true): NgModuleDef<T>;
export function getNgModuleDef<T>(type: any): NgModuleDef<T> | null;
export function getNgModuleDef<T>(type: any, throwIfNotFound?: boolean): NgModuleDef<T> | null {
  const ngModuleDef = type[NG_MOD_DEF] || null;
  if (!ngModuleDef && throwIfNotFound) {
    throw new RuntimeError(
      RuntimeErrorCode.MISSING_NG_MODULE_DEFINITION,
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        `타입 ${stringify(type)}에 'ɵmod' 속성이 없습니다.`,
    );
  }
  return ngModuleDef;
}

/**
 * 다음 getter 메소드는 타입에서 정의를 검색합니다. 현재 검색은
 * 상속을 준수하지만, 앞으로 정의가 명시적이어야 한다는 규칙으로 변경될 수 있습니다.
 * 이는 어떤 유형의 마이그레이션 전략이 필요할 것입니다.
 */

export function getComponentDef<T>(type: any): ComponentDef<T> | null {
  return type[NG_COMP_DEF] || null;
}

export function getDirectiveDef<T>(type: any, throwIfNotFound: true): DirectiveDef<T>;
export function getDirectiveDef<T>(type: any): DirectiveDef<T> | null;
export function getDirectiveDef<T>(type: any, throwIfNotFound?: boolean): DirectiveDef<T> | null {
  const def = type[NG_DIR_DEF] || null;
  if (!def && throwIfNotFound) {
    throw new RuntimeError(
      RuntimeErrorCode.MISSING_DIRECTIVE_DEFINITION,
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        `타입 ${stringify(type)}에 'ɵdir' 속성이 없습니다.`,
    );
  }
  return def;
}

export function getPipeDef<T>(type: any): PipeDef<T> | null {
  return type[NG_PIPE_DEF] || null;
}

/**
 * 주어진 컴포넌트, 디렉티브 또는 파이프가 독립형으로 마킹되어 있는지 확인합니다.
 * 컴포넌트, 디렉티브 또는 파이프 클래스가 아닌 것을 전달 받은 경우 false를 반환합니다.
 * 추가 정보는 [이 가이드](guide/components/importing)를 참조하세요:
 *
 * @param type 컴포넌트, 디렉티브 또는 파이프에 대한 참조입니다.
 * @publicApi
 */
export function isStandalone(type: Type<unknown>): boolean {
  const def = getComponentDef(type) || getDirectiveDef(type) || getPipeDef(type);
  return def !== null && def.standalone;
}
