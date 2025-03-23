/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 주석에서 허용되지 않는 문자열.
 *
 * 자세한 내용: https://html.spec.whatwg.org/multipage/syntax.html#comments
 */
const COMMENT_DISALLOWED = /^>|^->|<!--|-->|--!>|<!-$/g;
/**
 * 허용되지 않는 문자열에서 0 너비 문자로 감싸야 하는 구분 기호.
 */
const COMMENT_DELIMITER = /(<|>)/g;
const COMMENT_DELIMITER_ESCAPED = '\u200B$1\u200B';

/**
 * 주석 문자열의 내용을 이스케이프하여 주석 노드에 안전하게 삽입될 수 있도록 합니다.
 *
 * 문제는 HTML이 주석 내의 주석 종료 텍스트를 이스케이프하는 방법을 지정하지 않는 것입니다.
 * 고려해보십시오: `<!-- 주석을 닫는 방법은 ">"와 "->"로 시작하거나 "-->" 또는
 * "--!>"로 끝나는 것입니다. -->`. 위의 `"-->"`는 주석을 종료하는 것이 아니라 텍스트를 의미합니다. 이것은 DOM API를 통해 프로그래밍적으로 생성될 수 있습니다. (`<!--` 도 허용되지 않습니다.)
 *
 * 자세한 내용: https://html.spec.whatwg.org/multipage/syntax.html#comments
 *
 * ```ts
 * div.innerHTML = div.innerHTML
 * ```
 *
 * 위 코드를 안전하게 수행할 수 있을 것이라고 예상될 수 있지만, 주석 텍스트가 이스케이프되지 않기 때문에,
 * 주석에는 주석을 조기에 종료시킬 수 있는 텍스트가 포함될 수 있어 XSS 공격에 취약해질 수 있습니다. (SSR에서는 프로그램적으로
 * 해당 텍스트를 포함할 수 있는 주석 노드를 생성하고 이를 안전하다고 기대합니다.)
 *
 * 이 함수는 주석 구분 기호(`<` 및 `>`)를 찾아 `_>_`로 감싸서 주석 텍스트를 이스케이프합니다. 여기서 `_`는 0 너비 공백 `\u200B`입니다. 결과적으로 주석이
 * 주석 시작/종료 구분 기호(예: `<!--`, `-->` 또는 `--!>`)를 포함할 경우 텍스트는 정상적으로 렌더링되지만 HTML 파서를
 * 주석을 닫거나 여는 모르도록 합니다.
 *
 * @param value 주석 열기/닫기 문자 시퀀스를 이스케이프하여 주석 노드에 안전하게 만들기 위한 텍스트.
 */
export function escapeCommentText(value: string): string {
  return value.replace(COMMENT_DISALLOWED, (text) =>
    text.replace(COMMENT_DELIMITER, COMMENT_DELIMITER_ESCAPED),
  );
}
