/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {StaticProvider} from '../di';

import {createPlatformFactory} from './platform';
import {PlatformRef} from './platform_ref';

/**
 * 이 플랫폼은 다른 모든 플랫폼에 포함되어야 합니다.
 *
 * @publicApi
 */
export const platformCore: (extraProviders?: StaticProvider[] | undefined) => PlatformRef =
  createPlatformFactory(null, 'core', []);
