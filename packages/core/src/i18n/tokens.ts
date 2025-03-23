/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from '../di/injection_token';
import {inject} from '../di/injector_compatibility';

import {DEFAULT_LOCALE_ID, USD_CURRENCY_CODE} from './localization';

declare const $localize: {locale?: string};

/**
 * 잠재적인 전역 속성에서 로케일을 계산합니다.
 *
 * * 클로저 컴파일러: `goog.LOCALE` 사용.
 * * 아이비 활성화: `$localize.locale` 사용
 */
export function getGlobalLocale(): string {
  if (
    typeof ngI18nClosureMode !== 'undefined' &&
    ngI18nClosureMode &&
    typeof goog !== 'undefined' &&
    goog.LOCALE !== 'en'
  ) {
    // * 기본 `goog.LOCALE` 값은 `en`이고, Angular는 `en-US`를 사용합니다.
    // * 이전 호환성을 유지하기 위해, 클로저 컴파일러의 값보다 Angular 기본 값을 사용합니다.
    return goog.LOCALE;
  } else {
    // LOCALIZE 컴파일 타임 인라이너와 동기화된 `typeof $localize !== 'undefined' && $localize.locale` 유지.
    //
    // * 번역의 컴파일 타임 인라이닝 동안, 이 표현은 현재 로케일인 문자열 리터럴로 대체됩니다. 이 표현의 다른 형식은 대체될 것으로 보장되지 않습니다.
    //
    // * 런타임 번역 평가 동안 개발자는 필요하다면 `$localize.locale`을 설정해야 하며, 또는 자신의 `LOCALE_ID` 제공자를 제공해야 합니다.
    return (typeof $localize !== 'undefined' && $localize.locale) || DEFAULT_LOCALE_ID;
  }
}

/**
 * 이 토큰을 제공하여 애플리케이션의 로케일을 설정합니다.
 * 이 토큰은 i18n 추출, i18n 파이프(DatePipe, I18nPluralPipe, CurrencyPipe,
 * DecimalPipe 및 PercentPipe) 및 ICU 표현식에 사용됩니다.
 *
 * 더 많은 정보는 [i18n 가이드](guide/i18n/locale-id)를 참조하십시오.
 *
 * @usageNotes
 * ### 예제
 *
 * ```ts
 * import { LOCALE_ID } from '@angular/core';
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: LOCALE_ID, useValue: 'en-US' }]
 * });
 * ```
 *
 * @publicApi
 */
export const LOCALE_ID: InjectionToken<string> = new InjectionToken(ngDevMode ? 'LocaleId' : '', {
  providedIn: 'root',
  factory: () => inject(LOCALE_ID, {optional: true, skipSelf: true}) || getGlobalLocale(),
});

/**
 * 이 토큰을 제공하여 CurrencyPipe가 사용할 기본 통화 코드를 설정합니다.
 * 이 토큰은 통화 코드가 전달되지 않았을 때만 CurrencyPipe에서 사용됩니다. 이는 통화 로케일과 관련이 없습니다. 구성하지 않으면 기본값은 USD입니다.
 *
 * 더 많은 정보는 [i18n 가이드](guide/i18n/locale-id)를 참조하십시오.
 *
 * <div class="docs-alert docs-alert-helpful">
 *
 * 기본 통화 코드는 현재 항상 `USD`입니다.
 *
 * 이전 동작이 필요하다면 애플리케이션 `NgModule`에서 `DEFAULT_CURRENCY_CODE` 제공자를 만들어 설정하십시오:
 *
 * ```ts
 * {provide: DEFAULT_CURRENCY_CODE, useValue: 'USD'}
 * ```
 *
 * </div>
 *
 * @usageNotes
 * ### 예제
 *
 * ```ts
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' }]
 * });
 * ```
 *
 * @publicApi
 */
export const DEFAULT_CURRENCY_CODE = new InjectionToken<string>(
  ngDevMode ? 'DefaultCurrencyCode' : '',
  {
    providedIn: 'root',
    factory: () => USD_CURRENCY_CODE,
  },
);

/**
 * 이 토큰을 부트스트랩 시점에 사용하여 다른 언어로 응용 프로그램을 번역할 때
 * 번역 파일(`xtb`, `xlf` 또는 `xlf2`)의 내용을 제공합니다.
 *
 * 더 많은 정보는 [i18n 가이드](guide/i18n/merge)를 참조하십시오.
 *
 * @usageNotes
 * ### 예제
 *
 * ```ts
 * import { TRANSLATIONS } from '@angular/core';
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * // 번역 파일의 내용
 * const translations = '....';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: TRANSLATIONS, useValue: translations }]
 * });
 * ```
 *
 * @publicApi
 */
export const TRANSLATIONS = new InjectionToken<string>(ngDevMode ? 'Translations' : '');

/**
 * 부트스트랩 시점에 이 토큰을 제공하여 {@link TRANSLATIONS}의 형식을 설정합니다: `xtb`,
 * `xlf` 또는 `xlf2`.
 *
 * 더 많은 정보는 [i18n 가이드](guide/i18n/merge)를 참조하십시오.
 *
 * @usageNotes
 * ### 예제
 *
 * ```ts
 * import { TRANSLATIONS_FORMAT } from '@angular/core';
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: TRANSLATIONS_FORMAT, useValue: 'xlf' }]
 * });
 * ```
 *
 * @publicApi
 */
export const TRANSLATIONS_FORMAT = new InjectionToken<string>(
  ngDevMode ? 'TranslationsFormat' : '',
);

/**
 * 이 열거형을 부트스트랩 시키면서 `bootstrapModule`의 옵션으로 사용하여,
 * 컴파일러가 누락된 번역에 사용할 전략을 정의합니다:
 * - 오류: 누락된 번역이 있는 경우 예외를 발생시킵니다.
 * - 경고(기본값): 콘솔 및/또는 셸에 경고를 표시합니다.
 * - 무시: 아무것도 하지 않습니다.
 *
 * 더 많은 정보는 [i18n 가이드](guide/i18n/merge#report-missing-translations)를 참조하십시오.
 *
 * @usageNotes
 * ### 예제
 * ```ts
 * import { MissingTranslationStrategy } from '@angular/core';
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   missingTranslation: MissingTranslationStrategy.Error
 * });
 * ```
 *
 * @publicApi
 */
export enum MissingTranslationStrategy {
  Error = 0,
  Warning = 1,
  Ignore = 2,
}
