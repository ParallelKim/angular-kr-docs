/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {XSS_SECURITY_URL} from '../error_details_base_url';

export const enum BypassType {
  Url = 'URL',
  Html = 'HTML',
  ResourceUrl = 'ResourceURL',
  Script = 'Script',
  Style = 'Style',
}

/**
 * 특정 맥락에서 안전하게 사용할 수 있는 값에 대한 마커 인터페이스입니다.
 *
 * @publicApi
 */
export interface SafeValue {}

/**
 * HTML로 안전하게 사용할 수 있는 값에 대한 마커 인터페이스입니다.
 *
 * @publicApi
 */
export interface SafeHtml extends SafeValue {}

/**
 * 스타일(CSS)로 안전하게 사용할 수 있는 값에 대한 마커 인터페이스입니다.
 *
 * @publicApi
 */
export interface SafeStyle extends SafeValue {}

/**
 * JavaScript로 안전하게 사용할 수 있는 값에 대한 마커 인터페이스입니다.
 *
 * @publicApi
 */
export interface SafeScript extends SafeValue {}

/**
 * 문서에 링크되는 URL로 안전하게 사용할 수 있는 값에 대한 마커 인터페이스입니다.
 *
 * @publicApi
 */
export interface SafeUrl extends SafeValue {}

/**
 * 실행 가능한 코드를 로드하기 위한 URL로 안전하게 사용할 수 있는 값에 대한 마커 인터페이스입니다.
 *
 * @publicApi
 */
export interface SafeResourceUrl extends SafeValue {}

abstract class SafeValueImpl implements SafeValue {
  constructor(public changingThisBreaksApplicationSecurity: string) {}

  abstract getTypeName(): string;

  toString() {
    return (
      `SafeValue는 [property]=binding을 사용해야 합니다: ${this.changingThisBreaksApplicationSecurity}` +
      ` (자세한 내용은 ${XSS_SECURITY_URL}을 참조하세요)`
    );
  }
}

class SafeHtmlImpl extends SafeValueImpl implements SafeHtml {
  override getTypeName() {
    return BypassType.Html;
  }
}
class SafeStyleImpl extends SafeValueImpl implements SafeStyle {
  override getTypeName() {
    return BypassType.Style;
  }
}
class SafeScriptImpl extends SafeValueImpl implements SafeScript {
  override getTypeName() {
    return BypassType.Script;
  }
}
class SafeUrlImpl extends SafeValueImpl implements SafeUrl {
  override getTypeName() {
    return BypassType.Url;
  }
}
class SafeResourceUrlImpl extends SafeValueImpl implements SafeResourceUrl {
  override getTypeName() {
    return BypassType.ResourceUrl;
  }
}

export function unwrapSafeValue(value: SafeValue): string;
export function unwrapSafeValue<T>(value: T): T;
export function unwrapSafeValue<T>(value: T | SafeValue): T {
  return value instanceof SafeValueImpl
    ? (value.changingThisBreaksApplicationSecurity as any as T)
    : (value as any as T);
}

export function allowSanitizationBypassAndThrow(
  value: any,
  type: BypassType.Html,
): value is SafeHtml;
export function allowSanitizationBypassAndThrow(
  value: any,
  type: BypassType.ResourceUrl,
): value is SafeResourceUrl;
export function allowSanitizationBypassAndThrow(
  value: any,
  type: BypassType.Script,
): value is SafeScript;
export function allowSanitizationBypassAndThrow(
  value: any,
  type: BypassType.Style,
): value is SafeStyle;
export function allowSanitizationBypassAndThrow(value: any, type: BypassType.Url): value is SafeUrl;
export function allowSanitizationBypassAndThrow(value: any, type: BypassType): boolean;
export function allowSanitizationBypassAndThrow(value: any, type: BypassType): boolean {
  const actualType = getSanitizationBypassType(value);
  if (actualType != null && actualType !== type) {
    // URL 컨텍스트에서 ResourceURLs를 허용합니다. 이는 더 신뢰할 수 있습니다.
    if (actualType === BypassType.ResourceUrl && type === BypassType.Url) return true;
    throw new Error(
      `안전한 ${type}이 필요합니다. ${actualType}가 제공되었습니다 (자세한 내용은 ${XSS_SECURITY_URL}을 참조하세요)`,
    );
  }
  return actualType === type;
}

export function getSanitizationBypassType(value: any): BypassType | null {
  return (value instanceof SafeValueImpl && (value.getTypeName() as BypassType)) || null;
}

/**
 * `html` 문자열을 신뢰하는 것으로 표시합니다.
 *
 * 이 함수는 신뢰하는 문자열을 `String`으로 감싸고, 이것이
 * {@link htmlSanitizer}에 의해 암묵적으로 신뢰되는 것을 인식할 수 있도록 브랜드합니다.
 *
 * @param trustedHtml 암묵적으로 신뢰해야 하는 `html` 문자열입니다.
 * @returns 암묵적으로 신뢰하도록 브랜드된 `html`입니다.
 */
export function bypassSanitizationTrustHtml(trustedHtml: string): SafeHtml {
  return new SafeHtmlImpl(trustedHtml);
}
/**
 * `style` 문자열을 신뢰하는 것으로 표시합니다.
 *
 * 이 함수는 신뢰하는 문자열을 `String`으로 감싸고, 이것이
 * {@link styleSanitizer}에 의해 암묵적으로 신뢰되는 것을 인식할 수 있도록 브랜드합니다.
 *
 * @param trustedStyle 암묵적으로 신뢰해야 하는 `style` 문자열입니다.
 * @returns 암묵적으로 신뢰하도록 브랜드된 `style`입니다.
 */
export function bypassSanitizationTrustStyle(trustedStyle: string): SafeStyle {
  return new SafeStyleImpl(trustedStyle);
}
/**
 * `script` 문자열을 신뢰하는 것으로 표시합니다.
 *
 * 이 함수는 신뢰하는 문자열을 `String`으로 감싸고, 이것이
 * {@link scriptSanitizer}에 의해 암묵적으로 신뢰되는 것을 인식할 수 있도록 브랜드합니다.
 *
 * @param trustedScript 암묵적으로 신뢰해야 하는 `script` 문자열입니다.
 * @returns 암묵적으로 신뢰하도록 브랜드된 `script`입니다.
 */
export function bypassSanitizationTrustScript(trustedScript: string): SafeScript {
  return new SafeScriptImpl(trustedScript);
}
/**
 * `url` 문자열을 신뢰하는 것으로 표시합니다.
 *
 * 이 함수는 신뢰하는 문자열을 `String`으로 감싸고, 이것이
 * {@link urlSanitizer}에 의해 암묵적으로 신뢰되는 것을 인식할 수 있도록 브랜드합니다.
 *
 * @param trustedUrl 암묵적으로 신뢰해야 하는 `url` 문자열입니다.
 * @returns 암묵적으로 신뢰하도록 브랜드된 `url`입니다.
 */
export function bypassSanitizationTrustUrl(trustedUrl: string): SafeUrl {
  return new SafeUrlImpl(trustedUrl);
}
/**
 * `url` 문자열을 신뢰하는 것으로 표시합니다.
 *
 * 이 함수는 신뢰하는 문자열을 `String`으로 감싸고, 이것이
 * {@link resourceUrlSanitizer}에 의해 암묵적으로 신뢰되는 것을 인식할 수 있도록 브랜드합니다.
 *
 * @param trustedResourceUrl 암묵적으로 신뢰해야 하는 `url` 문자열입니다.
 * @returns 암묵적으로 신뢰하도록 브랜드된 `url`입니다.
 */
export function bypassSanitizationTrustResourceUrl(trustedResourceUrl: string): SafeResourceUrl {
  return new SafeResourceUrlImpl(trustedResourceUrl);
}
