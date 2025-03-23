/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from './injection_token';
import type {Injector} from './injector';
import {InjectorMarkers} from './injector_marker';

/**
 * `createInjector()` 스타일 인젝터에 대한 현재 `Injector`를 가져오는 InjectionToken입니다.
 *
 * `Injector` 대신 이 토큰을 요청하면 `StaticInjector`를 프로젝트에서 트리 셰이킹할 수 있습니다.
 *
 * @publicApi
 */
export const INJECTOR = new InjectionToken<Injector>(
  ngDevMode ? 'INJECTOR' : '',
  // 이거는 최상위 속성 접근이 아닌 인라인되는 const enum이기 때문에 tslint를 비활성화 합니다.
  // tslint:disable-next-line: no-toplevel-property-access
  InjectorMarkers.Injector as any, // Ivy가 `Injector`를 식별하는 데 사용하는 특수 값입니다.
);
