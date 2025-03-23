/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {AbstractType, Type} from '../interface/type';
import {InjectionToken} from './injection_token';

/**
 * @description
 *
 * 인젝터에서 인스턴스를 검색하거나 쿼리를 통해 검색하는 데 사용할 수 있는 토큰입니다.
 *
 * @publicApi
 */
export type ProviderToken<T> = Type<T> | AbstractType<T> | InjectionToken<T>;
