/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../di/injector';
import {InjectOptions} from '../di/interface/injector';
import {ProviderToken} from '../di/provider_token';
import {NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR} from '../view/provider_flags';

/**
 * 특정 인젝터를 사용하여 값을 조회한 후 모듈 인젝터로의 백업이 진행되는 인젝터입니다.
 * 주로 컴포넌트나 임베디드 뷰를 동적으로 생성할 때 사용됩니다.
 */
export class ChainedInjector implements Injector {
  constructor(
    public injector: Injector,
    public parentInjector: Injector,
  ) {}

  get<T>(token: ProviderToken<T>, notFoundValue?: T, options?: InjectOptions): T {
    const value = this.injector.get<T | typeof NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR>(
      token,
      NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR,
      options,
    );

    if (
      value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR ||
      notFoundValue === (NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR as unknown as T)
    ) {
      // 루트 엘리먼트 인젝터에서 값을 반환할 때
      // - 그것이 값을 제공하는 경우
      //   (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
      // - 모듈 인젝터를 확인할 필요가 없는 경우
      //   (notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
      return value as T;
    }

    return this.parentInjector.get(token, notFoundValue, options);
  }
}
