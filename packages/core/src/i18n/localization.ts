/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {getLocalePluralCase} from './locale_data_api';

const pluralMapping = ['zero', 'one', 'two', 'few', 'many'];

/**
 * 로케일에 따라 복수형 케이스를 반환합니다.
 */
export function getPluralCase(value: string, locale: string): string {
  const plural = getLocalePluralCase(locale)(parseInt(value, 10));
  const result = pluralMapping[plural];
  return result !== undefined ? result : 'other';
}

/**
 * 애플리케이션이 기본적으로 사용하는 로케일 ID (번역 및 ICU 표현식용).
 */
export const DEFAULT_LOCALE_ID = 'en-US';

/**
 * 애플리케이션이 기본적으로 CurrencyPipe에 사용하는 USD 통화 코드로,
 * DEFAULT_CURRENCY_CODE가 제공되지 않을 때 사용됩니다.
 */
export const USD_CURRENCY_CODE = 'USD';
