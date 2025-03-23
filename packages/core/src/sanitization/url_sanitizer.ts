/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {XSS_SECURITY_URL} from '../error_details_base_url';

/**
 * URL 탐색 컨텍스트에서 XSS에 대해 안전한 URL을 인식하는 패턴입니다.
 *
 * 이 정규 표현식은 HTML 문서 내의 URL 컨텍스트에서 사용될 경우 스크립트 실행을 일으키지 않는 URL의 하위 집합에 해당합니다. 구체적으로 이 정규 표현식은 다음과 일치합니다:
 * (1) javascript:가 아닌 프로토콜이 존재하고 유효한 문자
 *     (영숫자 또는 [+-.])가 있는 경우.
 * (2) 또는 프로토콜이 없는 경우. 프로토콜 다음에는 콜론(:)이 따라야 합니다. 아래는 [/?#] 중 하나의 문자 뒤에만 콜론을 허용함으로써 이를 허용합니다.
 *     해시(#) 후의 콜론은 프래그먼트에 있어야 합니다.
 *     그렇지 않으면 ( ?) 뒤의 콜론은 쿼리에 있어야 합니다.
 *     그렇지 않으면 단일 슬래시(/) 뒤의 콜론은 경로에 있어야 합니다.
 *     그렇지 않으면 이중 슬래시(//) 뒤의 콜론은 권한(포트 앞)에 있어야 합니다.
 *
 * 이 패턴은 HTML 엔티티 선언 전에 [/?#] 중 하나의 문자 중 하나로 사용되는 &를 허용하지 않습니다. 이는 절대 일어나서는 안 되는 프로토콜 이름에서 HTML 엔티티 사용을 금지합니다, 예: "h&#116;tp"는 "http"에 대해.
 * 또한 상대 경로의 첫 번째 경로 부분에서 HTML 엔티티 사용을 금지합니다, 예: "foo&lt;bar/baz". 우리의 기존 이스케이프 함수는 이를 생성하지 않아야 합니다. 더 중요한 것은 콜론의 마스킹을 금지한다는 점입니다,
 * 예: "javascript&#58;...".
 *
 * 이 정규 표현식은 Closure 세정 라이브러리에서 가져온 것입니다.
 */
const SAFE_URL_PATTERN = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:\/?#]*(?:[\/?#]|$))/i;
export function _sanitizeUrl(url: string): string {
  url = String(url);
  if (url.match(SAFE_URL_PATTERN)) return url;

  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    console.warn(
      `경고: 안전하지 않은 URL 값 ${url}을 세정하고 있습니다 (자세한 내용은 ${XSS_SECURITY_URL}를 참조하십시오)`,
    );
  }

  return 'unsafe:' + url;
}
