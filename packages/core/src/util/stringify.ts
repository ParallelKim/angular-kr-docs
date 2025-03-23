/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

export function stringify(token: any): string {
  if (typeof token === 'string') {
    return token;
  }

  if (Array.isArray(token)) {
    return `[${token.map(stringify).join(', ')}]`;
  }

  if (token == null) {
    return '' + token;
  }

  const name = token.overriddenName || token.name;
  if (name) {
    return `${name}`;
  }

  const result = token.toString();

  if (result == null) {
    return '' + result;
  }

  const newLineIndex = result.indexOf('\n');
  return newLineIndex >= 0 ? result.slice(0, newLineIndex) : result;
}

/**
 * 두 개의 문자열을 구분자로 연결하며, 필요한 경우에만 새로운 문자열을 할당합니다.
 *
 * @param before 앞선 문자열.
 * @param separator 구분자 문자열.
 * @param after 뒤의 문자열.
 * @returns 연결된 문자열.
 */
export function concatStringsWithSpace(before: string | null, after: string | null): string {
  if (!before) return after || '';
  if (!after) return before;
  return `${before} ${after}`;
}

/**
 * 최대 길이보다 길 경우 중간에서 문자열을 생략합니다.
 *
 * @param string
 * @param maxLength 출력 문자열의 최대 길이
 * @returns 중간에 ...이 있는 생략된 문자열
 */
export function truncateMiddle(str: string, maxLength = 100): string {
  if (!str || maxLength < 1 || str.length <= maxLength) return str;
  if (maxLength == 1) return str.substring(0, 1) + '...';

  const halfLimit = Math.round(maxLength / 2);
  return str.substring(0, halfLimit) + '...' + str.substring(str.length - halfLimit);
}
