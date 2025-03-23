/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {DEFAULT_LOCALE_ID} from '../../i18n/localization';
import {assertDefined} from '../../util/assert';

/**
 * 애플리케이션이 현재 사용 중인 로케일 ID(번역 및 ICU 표현용).
 * 이는 뷰 엔진을 위한 주입 토큰으로 정의된 `LOCALE_ID`의 아이비 버전이며,
 * 이제는 글로벌 값으로 정의됩니다.
 */
let LOCALE_ID = DEFAULT_LOCALE_ID;

/**
 * 번역 및 ICU 표현에 대해 사용될 로케일 ID를 설정합니다.
 * 이는 뷰 엔진을 위한 주입 토큰으로 정의된 `LOCALE_ID`의 아이비 버전이며,
 * 이제는 글로벌 값으로 정의됩니다.
 *
 * @param localeId
 */
export function setLocaleId(localeId: string) {
  ngDevMode && assertDefined(localeId, `localeId가 정의되어야 합니다`);
  if (typeof localeId === 'string') {
    LOCALE_ID = localeId.toLowerCase().replace(/_/g, '-');
  }
}

/**
 * 번역 및 ICU 표현에 대해 사용될 로케일 ID를 가져옵니다.
 * 이는 뷰 엔진을 위한 주입 토큰으로 정의된 `LOCALE_ID`의 아이비 버전이며,
 * 이제는 글로벌 값으로 정의됩니다.
 */
export function getLocaleId(): string {
  return LOCALE_ID;
}
