/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {XSS_SECURITY_URL} from '../error_details_base_url';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {getDocument} from '../render3/interfaces/document';
import {ENVIRONMENT} from '../render3/interfaces/view';
import {getLView} from '../render3/state';
import {renderStringify} from '../render3/util/stringify_utils';
import {TrustedHTML, TrustedScript, TrustedScriptURL} from '../util/security/trusted_type_defs';
import {trustedHTMLFromString, trustedScriptURLFromString} from '../util/security/trusted_types';
import {
  trustedHTMLFromStringBypass,
  trustedScriptFromStringBypass,
  trustedScriptURLFromStringBypass,
} from '../util/security/trusted_types_bypass';

import {allowSanitizationBypassAndThrow, BypassType, unwrapSafeValue} from './bypass';
import {_sanitizeHtml as _sanitizeHtml} from './html_sanitizer';
import {Sanitizer} from './sanitizer';
import {SecurityContext} from './security';
import {_sanitizeUrl as _sanitizeUrl} from './url_sanitizer';

/**
 * 신뢰할 수 없는 `html` **문자열**을 위험한 콘텐츠를 제거하여 신뢰할 수 있는 문자열로 변환하는 `html` sanitizer입니다.
 *
 * 이 메소드는 `html`을 파싱하고 잠재적으로 위험한 콘텐츠(예: url 및
 * javascript)를 찾아 제거합니다.
 *
 * {@link bypassSanitizationTrustHtml}를 호출하여 문자열을 신뢰할 수 있는 것으로 표시할 수 있습니다.
 *
 * @param unsafeHtml 신뢰할 수 없는 `html`, 일반적으로 사용자로부터.
 * @returns 사용자에게 표시하기에 안전한 `html` 문자열이 반환되며, 모든 위험한 javascript와
 * url가 제거되었습니다.
 *
 * @codeGenApi
 */
export function ɵɵsanitizeHtml(unsafeHtml: any): TrustedHTML | string {
  const sanitizer = getSanitizer();
  if (sanitizer) {
    return trustedHTMLFromStringBypass(sanitizer.sanitize(SecurityContext.HTML, unsafeHtml) || '');
  }
  if (allowSanitizationBypassAndThrow(unsafeHtml, BypassType.Html)) {
    return trustedHTMLFromStringBypass(unwrapSafeValue(unsafeHtml));
  }
  return _sanitizeHtml(getDocument(), renderStringify(unsafeHtml));
}

/**
 * 신뢰할 수 없는 `style` **문자열**을 위험한 콘텐츠를 제거하여 신뢰할 수 있는 문자열로 변환하는 `style` sanitizer입니다.
 *
 * {@link bypassSanitizationTrustStyle}를 호출하여 문자열을 신뢰할 수 있는 것으로 표시할 수 있습니다.
 *
 * @param unsafeStyle 신뢰할 수 없는 `style`, 일반적으로 사용자로부터.
 * @returns `style` 문자열이 반환되며, 이는 `style` 속성에 바인딩하기에 안전합니다.
 *
 * @codeGenApi
 */
export function ɵɵsanitizeStyle(unsafeStyle: any): string {
  const sanitizer = getSanitizer();
  if (sanitizer) {
    return sanitizer.sanitize(SecurityContext.STYLE, unsafeStyle) || '';
  }
  if (allowSanitizationBypassAndThrow(unsafeStyle, BypassType.Style)) {
    return unwrapSafeValue(unsafeStyle);
  }
  return renderStringify(unsafeStyle);
}

/**
 * 신뢰할 수 없는 `url` **문자열**을 위험한 콘텐츠를 제거하여 신뢰할 수 있는 문자열로 변환하는 `url` sanitizer입니다.
 *
 * 이 메소드는 `url`을 파싱하고 잠재적으로 위험한 콘텐츠(예: javascript)를 찾아 제거합니다.
 *
 * {@link bypassSanitizationTrustUrl}를 호출하여 문자열을 신뢰할 수 있는 것으로 표시할 수 있습니다.
 *
 * @param unsafeUrl 신뢰할 수 없는 `url`, 일반적으로 사용자로부터.
 * @returns 안전한 `url` 문자열이 반환되며, 이는 `<img src>`와 같은 `src` 속성에 바인딩하기에 안전합니다.
 * 모든 위험한 javascript가 제거되었습니다.
 *
 * @codeGenApi
 */
export function ɵɵsanitizeUrl(unsafeUrl: any): string {
  const sanitizer = getSanitizer();
  if (sanitizer) {
    return sanitizer.sanitize(SecurityContext.URL, unsafeUrl) || '';
  }
  if (allowSanitizationBypassAndThrow(unsafeUrl, BypassType.Url)) {
    return unwrapSafeValue(unsafeUrl);
  }
  return _sanitizeUrl(renderStringify(unsafeUrl));
}

/**
 * 신뢰할 수 있는 `url`만 통과시키는 `url` sanitizer입니다.
 *
 * 이것은 {@link bypassSanitizationTrustResourceUrl}를 호출하여 신뢰할 수 있는 것으로 표시된
 * `url`만 통과합니다.
 *
 * @param unsafeResourceUrl 신뢰할 수 없는 `url`, 일반적으로 사용자로부터.
 * @returns 안전한 `url` 문자열이 반환되며, 이는 `<img src>`와 같은 `src` 속성에 바인딩하기에 안전합니다.
 * 오직 신뢰할 수 있는 `url`만 통과되었습니다.
 *
 * @codeGenApi
 */
export function ɵɵsanitizeResourceUrl(unsafeResourceUrl: any): TrustedScriptURL | string {
  const sanitizer = getSanitizer();
  if (sanitizer) {
    return trustedScriptURLFromStringBypass(
      sanitizer.sanitize(SecurityContext.RESOURCE_URL, unsafeResourceUrl) || '',
    );
  }
  if (allowSanitizationBypassAndThrow(unsafeResourceUrl, BypassType.ResourceUrl)) {
    return trustedScriptURLFromStringBypass(unwrapSafeValue(unsafeResourceUrl));
  }
  throw new RuntimeError(
    RuntimeErrorCode.UNSAFE_VALUE_IN_RESOURCE_URL,
    ngDevMode && `리소스 URL 컨텍스트에서 사용된 안전하지 않은 값 (see ${XSS_SECURITY_URL})`,
  );
}

/**
 * 신뢰할 수 있는 javascript만 통과시키는 `script` sanitizer입니다.
 *
 * 이것은 {@link bypassSanitizationTrustScript}를 호출하여 신뢰할 수 있는 것으로 표시된
 * `script`만 통과합니다.
 *
 * @param unsafeScript 신뢰할 수 없는 `script`, 일반적으로 사용자로부터.
 * @returns 안전한 `url` 문자열이 반환되며, 이는 `<script>` 요소와 같은 `<img src>`에 바인딩하기에 안전합니다.
 * 오직 신뢰할 수 있는 `scripts`만 통과되었습니다.
 *
 * @codeGenApi
 */
export function ɵɵsanitizeScript(unsafeScript: any): TrustedScript | string {
  const sanitizer = getSanitizer();
  if (sanitizer) {
    return trustedScriptFromStringBypass(
      sanitizer.sanitize(SecurityContext.SCRIPT, unsafeScript) || '',
    );
  }
  if (allowSanitizationBypassAndThrow(unsafeScript, BypassType.Script)) {
    return trustedScriptFromStringBypass(unwrapSafeValue(unsafeScript));
  }
  throw new RuntimeError(
    RuntimeErrorCode.UNSAFE_VALUE_IN_SCRIPT,
    ngDevMode && '스크립트 컨텍스트에서 사용된 안전하지 않은 값',
  );
}

/**
 * 연결된 상수 리터럴을 TrustedHTML로 승격하기 위한 템플릿 태그 함수입니다. 보간은 명시적으로 허용되지 않습니다.
 *
 * @param html 신뢰할 수 있는 HTML을 포함하는 상수 템플릿 리터럴.
 * @returns `html`을 감싸는 TrustedHTML.
 *
 * @security 이는 보안에 민감한 함수이며,
 * 애플리케이션에서 제공하는 Angular 템플릿의 속치 및 속성의 상수 값을 TrustedHTML로 변환하는 데만 사용해야 합니다.
 *
 * @codeGenApi
 */
export function ɵɵtrustConstantHtml(html: TemplateStringsArray): TrustedHTML | string {
  // 다음 런타임 체크는 함수가 템플릿 태그로 호출되었는지 확인합니다
  // (예: ɵɵtrustConstantHtml`content`), 보간 없이
  // (예: ɵɵtrustConstantHtml`content ${variable}` 아님). TemplateStringsArray
  // 는 `raw` 속성이 있는 배열입니다. 관련된 템플릿 리터럴이 보간이 없다면
  // TemplateStringsArray의 길이가 1일 때만 가능합니다.
  if (ngDevMode && (!Array.isArray(html) || !Array.isArray(html.raw) || html.length !== 1)) {
    throw new Error(`신뢰할 수 있는 HTML 상수에서 예상치 않은 보간: ${html.join('?')}`);
  }
  return trustedHTMLFromString(html[0]);
}

/**
 * 연결된 상수 리터럴을 TrustedScriptURL로 승격하기 위한 템플릿 태그 함수입니다. 보간은 명시적으로 허용되지 않습니다.
 *
 * @param url 신뢰할 수 있는 스크립트 URL을 포함하는 상수 템플릿 리터럴.
 * @returns `url`을 감싸는 TrustedScriptURL.
 *
 * @security 이는 보안에 민감한 함수이며,
 * 애플리케이션에서 제공하는 Angular 템플릿의 속치 및 속성의 상수 값을 TrustedScriptURL로 변환하는 데만 사용해야 합니다.
 *
 * @codeGenApi
 */
export function ɵɵtrustConstantResourceUrl(url: TemplateStringsArray): TrustedScriptURL | string {
  // 다음 런타임 체크는 함수가 템플릿 태그로 호출되었는지 확인합니다
  // (예: ɵɵtrustConstantResourceUrl`content`), 보간 없이
  // (예: ɵɵtrustConstantResourceUrl`content ${variable}` 아님). A
  // TemplateStringsArray는 `raw` 속성이 있는 배열입니다. 관련된 템플릿 리터럴이
  // 보간이 없다면 TemplateStringsArray의 길이가 1일 때만 가능합니다.
  if (ngDevMode && (!Array.isArray(url) || !Array.isArray(url.raw) || url.length !== 1)) {
    throw new Error(`신뢰할 수 있는 URL 상수에서 예상치 않은 보간: ${url.join('?')}`);
  }
  return trustedScriptURLFromString(url[0]);
}

/**
 * 태그 이름과 속성 이름에 따라 URL 속성에 사용할 sanitizer를 감지합니다.
 *
 * 규칙은 `packages/compiler/src/schema/dom_security_schema.ts`의 RESOURCE_URL 컨텍스트 구성에 기반합니다.
 * 태그 및 속성 이름이 리소스 URL 스키마와 일치하지 않으면 URL sanitizer를 사용합니다.
 */
export function getUrlSanitizer(tag: string, prop: string) {
  if (
    (prop === 'src' &&
      (tag === 'embed' ||
        tag === 'frame' ||
        tag === 'iframe' ||
        tag === 'media' ||
        tag === 'script')) ||
    (prop === 'href' && (tag === 'base' || tag === 'link'))
  ) {
    return ɵɵsanitizeResourceUrl;
  }
  return ɵɵsanitizeUrl;
}

/**
 * URL을 정리하며, 태그와 속성 이름에 따라 sanitizer 함수를 선택합니다.
 *
 * 이 함수는 보안 컨텍스트를 컴파일 시간에 정의할 수 없을 때 사용되며,
 * 단지 속성 이름만 제공됩니다. 이것은 디렉티브/컴포넌트를 위한 호스트 바인딩을
 * 생성할 때 발생합니다. 호스트 요소는 컴파일 시간에 알 수 없으므로 특정 sanitizer 계산을 런타임으로 미룹니다.
 *
 * @param unsafeUrl 신뢰할 수 없는 `url`, 일반적으로 사용자로부터.
 * @param tag 대상 요소 태그 이름.
 * @param prop 값이 포함된 속성의 이름.
 * @returns 안전하게 바인딩할 수 있는 `url` 문자열.
 *
 * @codeGenApi
 */
export function ɵɵsanitizeUrlOrResourceUrl(unsafeUrl: any, tag: string, prop: string): any {
  return getUrlSanitizer(tag, prop)(unsafeUrl);
}

export function validateAgainstEventProperties(name: string) {
  if (name.toLowerCase().startsWith('on')) {
    const errorMessage =
      `이벤트 속성 '${name}'에 바인딩하는 것은 보안상의 이유로 부여되지 않습니다. ` +
      `(${name.slice(2)})=...를 사용하세요.` +
      `\n'${name}'가 지시자 입력이라면, 해당 지시자가 현재 모듈에 임포트되어 있는지 확인하세요.`;
    throw new RuntimeError(RuntimeErrorCode.INVALID_EVENT_BINDING, errorMessage);
  }
}

export function validateAgainstEventAttributes(name: string) {
  if (name.toLowerCase().startsWith('on')) {
    const errorMessage =
      `이벤트 속성 '${name}'에 바인딩하는 것은 보안상의 이유로 부여되지 않습니다. ` +
      `(${name.slice(2)})=...를 사용하세요.`;
    throw new RuntimeError(RuntimeErrorCode.INVALID_EVENT_BINDING, errorMessage);
  }
}

function getSanitizer(): Sanitizer | null {
  const lView = getLView();
  return lView && lView[ENVIRONMENT].sanitizer;
}
