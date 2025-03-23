/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from './injection_token';

export type InjectorScope = 'root' | 'platform' | 'environment';

/**
 * 주입기에서 이 내부 토큰의 존재는 주입기가
 * Root 스코프 주입기로 스스로를 대우해야 함을 나타내며,
 * 이는 알 수 없는 토큰에 대한 요청을 처리할 때,
 * 해당 토큰이 root 범위에서 제공될 수 있음을 나타낼 수 있습니다.
 */
export const INJECTOR_SCOPE = new InjectionToken<InjectorScope | null>(
  ngDevMode ? 'Set Injector scope.' : '',
);
