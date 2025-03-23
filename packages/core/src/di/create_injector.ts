/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {EMPTY_ARRAY} from '../util/empty';
import {stringify} from '../util/stringify';

import type {Injector} from './injector';
import type {Provider, StaticProvider} from './interface/provider';
import {importProvidersFrom} from './provider_collection';
import {getNullInjector, R3Injector} from './r3_injector';
import {InjectorScope} from './scope';

/**
 * `InjectorType<any>`s의 `defType`을 사용하여 구성된 새로운 `Injector`를 생성합니다.
 */
export function createInjector(
  defType: /* InjectorType<any> */ any,
  parent: Injector | null = null,
  additionalProviders: Array<Provider | StaticProvider> | null = null,
  name?: string,
): Injector {
  const injector = createInjectorWithoutInjectorInstances(
    defType,
    parent,
    additionalProviders,
    name,
  );
  injector.resolveInjectorInitializers();
  return injector;
}

/**
 * 인젝터 타입을 즉각적으로 해결하지 않고 새로운 인젝터를 생성합니다. 인젝터 타입을 즉시 해결하는 것이
 * 무한 루프를 유발할 수 있는 곳에서 사용할 수 있습니다. 인젝터 타입은
 * `_resolveInjectorDefTypes`를 호출하여 나중에 해결해야 합니다.
 */
export function createInjectorWithoutInjectorInstances(
  defType: /* InjectorType<any> */ any,
  parent: Injector | null = null,
  additionalProviders: Array<Provider | StaticProvider> | null = null,
  name?: string,
  scopes = new Set<InjectorScope>(),
): R3Injector {
  const providers = [additionalProviders || EMPTY_ARRAY, importProvidersFrom(defType)];
  name = name || (typeof defType === 'object' ? undefined : stringify(defType));

  return new R3Injector(providers, parent || getNullInjector(), name || null, scopes);
}
