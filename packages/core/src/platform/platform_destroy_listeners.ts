/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from '../di';

/**
 * 내부 토큰으로, `PlatformRef.destroy` 작업 중에 호출되어야 하는 추가 콜백을 등록할 수 있게 해줍니다.
 * 이 토큰은 `PlatformRef` 클래스에 대한 직접 참조를 피하기 위해 필요합니다
 * (즉, `PlatformRef.onDestroy`를 통해 콜백을 등록함으로써), 따라서 전체 클래스가 트리 쉐이킹 가능하게 만듭니다.
 */
export const PLATFORM_DESTROY_LISTENERS = new InjectionToken<Set<VoidFunction>>(
  ngDevMode ? 'PlatformDestroyListeners' : '',
);
