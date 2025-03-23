/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from './injection_token';

/**
 * 환경 주입기가 생성될 때 실행될 초기화 함수에 대한 다중 공급자 토큰입니다.
 *
 * @deprecated v19.0.0부터, provideEnvironmentInitializer를 대신 사용하십시오.
 *
 * @see {@link provideEnvironmentInitializer}
 *
 * 참고: `APP_INITIALIZER` 토큰과는 달리, `ENVIRONMENT_INITIALIZER` 함수는 대기하지 않으므로
 * `async`이어서는 안 됩니다.
 *
 * @publicApi
 */
export const ENVIRONMENT_INITIALIZER = new InjectionToken<ReadonlyArray<() => void>>(
  ngDevMode ? 'ENVIRONMENT_INITIALIZER' : '',
);
