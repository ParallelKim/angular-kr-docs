/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {EnvironmentProviders, Provider} from '../di';

/**
 * 애플리케이션 부트스트랩 작업 중 사용 가능한 구성 옵션 세트입니다.
 *
 * @publicApi
 */
export interface ApplicationConfig {
  /**
   * 루트 구성 요소와 그 모든 자식 구성 요소에서 사용할 수 있어야 하는 제공자의 목록입니다.
   */
  providers: Array<Provider | EnvironmentProviders>;
}

/**
 * 여러 애플리케이션 구성을 왼쪽에서 오른쪽으로 병합합니다.
 *
 * @param configs 병합할 두 개 이상의 구성입니다.
 * @returns 병합된 [ApplicationConfig](api/core/ApplicationConfig)입니다.
 *
 * @publicApi
 */
export function mergeApplicationConfig(...configs: ApplicationConfig[]): ApplicationConfig {
  return configs.reduce(
    (prev, curr) => {
      return Object.assign(prev, curr, {providers: [...prev.providers, ...curr.providers]});
    },
    {providers: []},
  );
}
