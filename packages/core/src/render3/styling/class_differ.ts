/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertNotEqual} from '../../util/assert';
import {CharCode} from '../../util/char_code';

/**
 * `className`에서 `classToSearch`의 인덱스를 반환하며, 토큰 경계를 고려합니다.
 *
 * `classIndexOf('AB A', 'A', 0)`은 3을 반환합니다 (0이 아닌 3은 `AB!==A`이기 때문입니다)
 *
 * @param className 클래스를 포함하는 문자열 (공백으로 구분됨)
 * @param classToSearch 위치를 찾을 클래스 이름
 * @param startingIndex 검색의 시작 위치
 * @returns 위치한 클래스의 인덱스 (찾지 못하면 -1)
 */
export function classIndexOf(
  className: string,
  classToSearch: string,
  startingIndex: number,
): number {
  ngDevMode && assertNotEqual(classToSearch, '', '"" 문자열을 찾을 수 없습니다.');
  let end = className.length;
  while (true) {
    const foundIndex = className.indexOf(classToSearch, startingIndex);
    if (foundIndex === -1) return foundIndex;
    if (foundIndex === 0 || className.charCodeAt(foundIndex - 1) <= CharCode.SPACE) {
      // 앞에 공백이 있는지 확인
      const length = classToSearch.length;
      if (
        foundIndex + length === end ||
        className.charCodeAt(foundIndex + length) <= CharCode.SPACE
      ) {
        // 뒤에 공백이 있는지 확인
        return foundIndex;
      }
    }
    // 잘못된 긍정 결과, 남은 곳에서 계속 검색합니다.
    startingIndex = foundIndex + 1;
  }
}
