/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {global} from '../util/global';

import localeEn from './locale_en';

/**
 * 이 const는 `registerLocaleData`와 함께 등록된 로케일 데이터를 저장하는 데 사용됩니다.
 */
let LOCALE_DATA: {[localeId: string]: any} = {};

/**
 * Angular에서 내부적으로 사용될 로케일 데이터를 등록합니다. 추가 로케일
 * 데이터를 가져오는 방법은 ["I18n guide"](guide/i18n/format-data-locale)를 참조하세요.
 *
 * `registerLocaleData(data: any, extraData?: any)`의 시그니처는 v5.1부터 사용 중단되었습니다.
 */
export function registerLocaleData(data: any, localeId?: string | any, extraData?: any): void {
  if (typeof localeId !== 'string') {
    extraData = localeId;
    localeId = data[LocaleDataIndex.LocaleId];
  }

  localeId = localeId.toLowerCase().replace(/_/g, '-');

  LOCALE_DATA[localeId] = data;

  if (extraData) {
    LOCALE_DATA[localeId][LocaleDataIndex.ExtraData] = extraData;
  }
}

/**
 * 주어진 로케일에 대한 로케일 데이터를 찾습니다.
 *
 * @param locale 로케일 코드입니다.
 * @returns 로케일 데이터입니다.
 * @see [Internationalization (i18n) Guide](https://angular.io/guide/i18n)
 */
export function findLocaleData(locale: string): any {
  const normalizedLocale = normalizeLocale(locale);

  let match = getLocaleData(normalizedLocale);
  if (match) {
    return match;
  }

  // 부모 로케일을 찾아보겠습니다.
  const parentLocale = normalizedLocale.split('-')[0];
  match = getLocaleData(parentLocale);
  if (match) {
    return match;
  }

  if (parentLocale === 'en') {
    return localeEn;
  }

  throw new RuntimeError(
    RuntimeErrorCode.MISSING_LOCALE_DATA,
    ngDevMode && `로케일 "${locale}"에 대한 로케일 데이터가 없습니다.`,
  );
}

/**
 * 주어진 로케일의 기본 통화 코드를 가져옵니다.
 *
 * 기본값은 여전히 사용되고 있는 첫 번째 통화로 정의됩니다.
 *
 * @param locale 통화 코드를 원하는 로케일의 코드입니다.
 * @returns 주어진 로케일의 기본 통화 코드입니다.
 *
 */
export function getLocaleCurrencyCode(locale: string): string | null {
  const data = findLocaleData(locale);
  return data[LocaleDataIndex.CurrencyCode] || null;
}

/**
 * 특정 로케일에 대해 사용할 복수형 기능을 가져옵니다.
 * @param locale 사용할 로케일 형식 규칙의 로케일 코드입니다.
 * @returns 로케일의 복수형 기능입니다.
 * @see {@link NgPlural}
 * @see [Internationalization (i18n) Guide](guide/i18n)
 */
export function getLocalePluralCase(locale: string): (value: number) => number {
  const data = findLocaleData(locale);
  return data[LocaleDataIndex.PluralCase];
}

/**
 * `LOCALE_DATA`에서 주어진 `normalizedLocale`을 가져오는 헬퍼 함수입니다.
 * 또는 전역 `ng.common.locale`에서 가져옵니다.
 */
export function getLocaleData(normalizedLocale: string): any {
  if (!(normalizedLocale in LOCALE_DATA)) {
    LOCALE_DATA[normalizedLocale] =
      global.ng &&
      global.ng.common &&
      global.ng.common.locales &&
      global.ng.common.locales[normalizedLocale];
  }
  return LOCALE_DATA[normalizedLocale];
}

/**
 * `LOCALE_DATA`에서 모든 로케일 데이터를 제거하는 헬퍼 함수입니다.
 */
export function unregisterAllLocaleData() {
  LOCALE_DATA = {};
}

/**
 * 로케일 데이터 배열에서 각 유형의 로케일 데이터의 인덱스
 */
export enum LocaleDataIndex {
  LocaleId = 0,
  DayPeriodsFormat,
  DayPeriodsStandalone,
  DaysFormat,
  DaysStandalone,
  MonthsFormat,
  MonthsStandalone,
  Eras,
  FirstDayOfWeek,
  WeekendRange,
  DateFormat,
  TimeFormat,
  DateTimeFormat,
  NumberSymbols,
  NumberFormats,
  CurrencyCode,
  CurrencySymbol,
  CurrencyName,
  Currencies,
  Directionality,
  PluralCase,
  ExtraData,
}

/**
 * 추가 로케일 데이터 배열에서 각 유형의 로케일 데이터의 인덱스
 */
export const enum ExtraLocaleDataIndex {
  ExtraDayPeriodFormats = 0,
  ExtraDayPeriodStandalone,
  ExtraDayPeriodsRules,
}

/**
 * 통화 데이터에서 각 값의 인덱스 (currencies.ts의 CURRENCIES_EN 설명에 사용됨)
 */
export const enum CurrencyIndex {
  Symbol = 0,
  SymbolNarrow,
  NbOfDigits,
}

/**
 * 로케일 이름의 정규형을 반환합니다. - 소문자로 `_`가 `-`로 대체됩니다.
 */
function normalizeLocale(locale: string): string {
  return locale.toLowerCase().replace(/_/g, '-');
}
