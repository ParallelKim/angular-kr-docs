/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {ProviderToken} from '../di';
import {isEnvironmentProviders} from '../di/interface/provider';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {Type} from '../interface/type';
import {stringify} from '../util/stringify';

import {stringifyForError} from './util/stringify_utils';

/** 지시자가 서로 주입될 때 호출됩니다(순환 의존성 생성) */
export function throwCyclicDependencyError(token: string, path?: string[]): never {
  throw new RuntimeError(
    RuntimeErrorCode.CYCLIC_DI_DEPENDENCY,
    ngDevMode
      ? `DI에서 ${token}에 대한 순환 의존성이 감지됨${path ? `. 의존성 경로: ${path.join(' > ')} > ${token}` : ''}`
      : token,
  );
}

export function throwMixedMultiProviderError() {
  throw new Error(`다중 공급자와 일반 공급자를 혼합할 수 없습니다`);
}

export function throwInvalidProviderError(
  ngModuleType?: Type<unknown>,
  providers?: any[],
  provider?: any,
): never {
  if (ngModuleType && providers) {
    const providerDetail = providers.map((v) => (v == provider ? '?' + provider + '?' : '...'));
    throw new Error(
      `NgModule '${stringify(
        ngModuleType,
      )}'에 대한 잘못된 공급자 - Provider 및 Type의 인스턴스만 허용되며, 다음이 포함되었습니다: [${providerDetail.join(', ')}]`,
    );
  } else if (isEnvironmentProviders(provider)) {
    if (provider.ɵfromNgModule) {
      throw new RuntimeError(
        RuntimeErrorCode.PROVIDER_IN_WRONG_CONTEXT,
        `'importProvidersFrom'에서 가져온 잘못된 공급자가 환경이 아닌 주입기에 존재합니다. 'importProvidersFrom'은 구성 요소 공급자에 사용할 수 없습니다.`,
      );
    } else {
      throw new RuntimeError(
        RuntimeErrorCode.PROVIDER_IN_WRONG_CONTEXT,
        `환경이 아닌 주입기에 잘못된 공급자가 존재합니다. 'EnvironmentProviders'는 구성 요소 공급자에 사용할 수 없습니다.`,
      );
    }
  } else {
    throw new Error('잘못된 공급자');
  }
}

/** DI에서 토큰을 찾을 수 없을 때 오류를 던집니다. */
export function throwProviderNotFoundError(
  token: ProviderToken<unknown>,
  injectorName?: string,
): never {
  const errorMessage =
    ngDevMode &&
    `${stringifyForError(token)}에 대한 공급자를 찾을 수 없습니다${injectorName ? ` ${injectorName}에서` : ''}`;
  throw new RuntimeError(RuntimeErrorCode.PROVIDER_NOT_FOUND, errorMessage);
}
