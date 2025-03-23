/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {trustedHTMLFromString} from '../util/security/trusted_types';

/**
 * 이 헬퍼는 위생 처리(sanitizing)가 필요한 더러운(dirty) HTML을 포함하는 비활성 DOM 요소 트리를 얻기 위해 사용됩니다.
 * 브라우저 지원에 따라 두 가지 전략 중 하나를 사용합니다.
 * 기본: DOMParser 전략
 * 대체: InertDocument 전략
 */
export function getInertBodyHelper(defaultDoc: Document): InertBodyHelper {
  const inertDocumentHelper = new InertDocumentHelper(defaultDoc);
  return isDOMParserAvailable() ? new DOMParserHelper(inertDocumentHelper) : inertDocumentHelper;
}

export interface InertBodyHelper {
  /**
   * 제공된 더러운 HTML 문자열로 생성된 DOM을 포함하는 비활성 DOM 요소를 가져옵니다.
   */
  getInertBodyElement: (html: string) => HTMLElement | null;
}

/**
 * DOMParser를 사용하여 비활성 본문 요소를 생성하고 채웁니다.
 * 이는 이를 지원하는 브라우저에서 사용되는 기본 전략입니다.
 */
class DOMParserHelper implements InertBodyHelper {
  constructor(private inertDocumentHelper: InertBodyHelper) {}

  getInertBodyElement(html: string): HTMLElement | null {
    // 나머지 콘텐츠가 예상대로 파싱되도록 추가 요소를 추가합니다.
    // 예: 선행 공백이 유지되고 `<meta>`와 같은 태그가 `<head>` 태그로 승격되지 않도록 합니다.
    // `html`에서 닫히지 않은 태그가 명시적 `</body>` 태그를 소비하지 않도록 `<body>` 태그가 암시적으로 닫힙니다.
    html = '<body><remove></remove>' + html;
    try {
      const body = new window.DOMParser().parseFromString(
        trustedHTMLFromString(html) as string,
        'text/html',
      ).body as HTMLBodyElement;
      if (body === null) {
        // 일부 브라우저에서는 (예: Mozilla/5.0 iPad AppleWebKit Mobile) `body` 속성이 JS 엔진의 다음 틱에서만 사용 가능해집니다.
        // 그 경우, 대신 `inertDocumentHelper`로 대체합니다.
        return this.inertDocumentHelper.getInertBodyElement(html);
      }
      body.firstChild?.remove();
      return body;
    } catch {
      return null;
    }
  }
}

/**
 * HTML5 `template` 요소를 사용하여 비활성 DOM 요소를 생성하고 채웁니다.
 * 이는 브라우저가 DOMParser를 지원하지 않을 경우의 대체 전략입니다.
 */
class InertDocumentHelper implements InertBodyHelper {
  private inertDocument: Document;

  constructor(private defaultDoc: Document) {
    this.inertDocument = this.defaultDoc.implementation.createHTMLDocument('sanitization-inert');
  }

  getInertBodyElement(html: string): HTMLElement | null {
    const templateEl = this.inertDocument.createElement('template');
    templateEl.innerHTML = trustedHTMLFromString(html) as string;
    return templateEl;
  }
}

/**
 * 글로벌 컨텍스트에 DOMParser가 존재하는지 여부와
 * HTML 파싱을 지원하는지를 확인해야 합니다; HTML 파싱 지원은 다른 형식만큼 넓지 않습니다.
 * https://developer.mozilla.org/en-US/docs/Web/API/DOMParser#Browser_compatibility를 참조하십시오.
 *
 * @suppress {uselessCode}
 */
export function isDOMParserAvailable() {
  try {
    return !!new window.DOMParser().parseFromString(
      trustedHTMLFromString('') as string,
      'text/html',
    );
  } catch {
    return false;
  }
}
