/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {throwProviderNotFoundError} from '../render3/errors_di';
import {assertNotEqual} from '../util/assert';

import {getInjectableDef, ɵɵInjectableDeclaration} from './interface/defs';
import {InternalInjectFlags} from './interface/injector';
import {ProviderToken} from './provider_token';

/**
 * 현재 inject의 구현입니다.
 *
 * 기본적으로 `injectInjectorOnly`이며, 이는 `Injector`에만 인식됩니다. 이를 `directiveInject`로 변경하여 ivy의 `NodeInjector` 시스템을 도입할 수 있습니다. 이렇게 설계된 이유는 두 가지입니다:
 *  1. `Injector`는 ivy 논리에 의존해서는 안 됩니다.
 *  2. 트리 쉐이크 가능성을 유지하기 위해 불필요한 코드를 추가하고 싶지 않습니다.
 */
let _injectImplementation:
  | (<T>(token: ProviderToken<T>, flags?: InternalInjectFlags) => T | null)
  | undefined;
export function getInjectImplementation() {
  return _injectImplementation;
}

/**
 * 현재 inject 구현을 설정합니다.
 */
export function setInjectImplementation(
  impl: (<T>(token: ProviderToken<T>, flags?: InternalInjectFlags) => T | null) | undefined,
): (<T>(token: ProviderToken<T>, flags?: InternalInjectFlags) => T | null) | undefined {
  const previous = _injectImplementation;
  _injectImplementation = impl;
  return previous;
}

/**
 * limp 모드에서 `root` 토큰을 주입합니다.
 *
 * injector가 존재하지 않더라도 `"root"`로 설정된 tree-shakable providers를 주입할 수 있습니다. 이를 limp 모드 주입이라고 합니다. 이 경우 해당 값은 주입 가능 정의에 저장됩니다.
 */
export function injectRootLimpMode<T>(
  token: ProviderToken<T>,
  notFoundValue: T | undefined,
  flags: InternalInjectFlags,
): T | null {
  const injectableDef: ɵɵInjectableDeclaration<T> | null = getInjectableDef(token);
  if (injectableDef && injectableDef.providedIn == 'root') {
    return injectableDef.value === undefined
      ? (injectableDef.value = injectableDef.factory())
      : injectableDef.value;
  }
  if (flags & InternalInjectFlags.Optional) return null;
  if (notFoundValue !== undefined) return notFoundValue;
  throwProviderNotFoundError(token, 'Injector');
}

/**
 * `_injectImplementation`가 `fn`과 같지 않음을 확인합니다.
 *
 * 이는 무한 재귀를 방지하는 데 유용합니다.
 *
 * @param fn 같지 않아야 하는 함수
 */
export function assertInjectImplementationNotEqual(
  fn: <T>(token: ProviderToken<T>, flags?: InternalInjectFlags) => T | null,
) {
  ngDevMode &&
    assertNotEqual(_injectImplementation, fn, 'Calling ɵɵinject would cause infinite recursion');
}
