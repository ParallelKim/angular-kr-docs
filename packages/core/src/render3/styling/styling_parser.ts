/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertEqual, throwError} from '../../util/assert';
import {CharCode} from '../../util/char_code';

/**
 * 스타일을 파싱하는 동안 키/값 인덱스의 위치를 저장합니다.
 *
 * `cssText` 파싱의 경우 인덱스는 다음과 같습니다:
 * ```
 *   "key1: value1; key2: value2; key3: value3"
 *                  ^   ^ ^     ^             ^
 *                  |   | |     |             +-- textEnd
 *                  |   | |     +---------------- valueEnd
 *                  |   | +---------------------- value
 *                  |   +------------------------ keyEnd
 *                  +---------------------------- key
 * ```
 *
 * `className` 파싱의 경우 인덱스는 다음과 같습니다:
 * ```
 *   "key1 key2 key3"
 *         ^   ^    ^
 *         |   |    +-- textEnd
 *         |   +------------------------ keyEnd
 *         +---------------------------- key
 * ```
 * NOTE: `value`와 `valueEnd`는 클래스가 아닌 스타일에만 사용됩니다.
 */
interface ParserState {
  textEnd: number;
  key: number;
  keyEnd: number;
  value: number;
  valueEnd: number;
}
// 파서의 전역 상태. (이것은 파서를 재진입 불가능하게 만듭니다, 하지만 문제는 없음)
const parserState: ParserState = {
  textEnd: 0,
  key: 0,
  keyEnd: 0,
  value: 0,
  valueEnd: 0,
};

/**
 * 마지막으로 파싱된 스타일의 `key`를 가져옵니다.
 * @param text 키에서 서브스트링을 가져올 텍스트.
 */
export function getLastParsedKey(text: string): string {
  return text.substring(parserState.key, parserState.keyEnd);
}

/**
 * 마지막으로 파싱된 스타일의 `value`를 가져옵니다.
 * @param text 키에서 서브스트링을 가져올 텍스트.
 */
export function getLastParsedValue(text: string): string {
  return text.substring(parserState.value, parserState.valueEnd);
}

/**
 * 파싱을 위한 `className` 문자열을 초기화하고 첫 번째 토큰을 파싱합니다.
 *
 * 이 함수는 다음 형식으로 사용될 것을 의도합니다:
 * ```ts
 * for (let i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
 *   const key = getLastParsedKey();
 *   ...
 * }
 * ```
 * @param text 파싱할 `className`
 * @returns 다음 `parseClassNameNext`의 호출이 재개될 인덱스.
 */
export function parseClassName(text: string): number {
  resetParserState(text);
  return parseClassNameNext(text, consumeWhitespace(text, 0, parserState.textEnd));
}

/**
 * 다음 `className` 토큰을 파싱합니다.
 *
 * 이 함수는 다음 형식으로 사용될 것을 의도합니다:
 * ```ts
 * for (let i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
 *   const key = getLastParsedKey();
 *   ...
 * }
 * ```
 *
 * @param text 파싱할 `className`
 * @param index 파싱이 재개되어야 할 지점.
 * @returns 다음 `parseClassNameNext`의 호출이 재개될 인덱스.
 */
export function parseClassNameNext(text: string, index: number): number {
  const end = parserState.textEnd;
  if (end === index) {
    return -1;
  }
  index = parserState.keyEnd = consumeClassToken(text, (parserState.key = index), end);
  return consumeWhitespace(text, index, end);
}

/**
 * 파싱을 위한 `cssText` 문자열을 초기화하고 첫 번째 키/값을 파싱합니다.
 *
 * 이 함수는 다음 형식으로 사용될 것을 의도합니다:
 * ```ts
 * for (let i = parseStyle(text); i >= 0; i = parseStyleNext(text, i))) {
 *   const key = getLastParsedKey();
 *   const value = getLastParsedValue();
 *   ...
 * }
 * ```
 * @param text 파싱할 `cssText`
 * @returns 다음 `parseStyleNext`의 호출이 재개될 인덱스.
 */
export function parseStyle(text: string): number {
  resetParserState(text);
  return parseStyleNext(text, consumeWhitespace(text, 0, parserState.textEnd));
}

/**
 * 다음 `cssText` 키/값을 파싱합니다.
 *
 * 이 함수는 다음 형식으로 사용될 것을 의도합니다:
 * ```ts
 * for (let i = parseStyle(text); i >= 0; i = parseStyleNext(text, i))) {
 *   const key = getLastParsedKey();
 *   const value = getLastParsedValue();
 *   ...
 * }
 *
 * @param text 파싱할 `cssText`
 * @param index 파싱이 재개되어야 할 지점.
 * @returns 다음 `parseStyleNext`의 호출이 재개될 인덱스.
 */
export function parseStyleNext(text: string, startIndex: number): number {
  const end = parserState.textEnd;
  let index = (parserState.key = consumeWhitespace(text, startIndex, end));
  if (end === index) {
    // 끝에 도달했으므로 종료
    return -1;
  }
  index = parserState.keyEnd = consumeStyleKey(text, index, end);
  index = consumeSeparator(text, index, end, CharCode.COLON);
  index = parserState.value = consumeWhitespace(text, index, end);
  index = parserState.valueEnd = consumeStyleValue(text, index, end);
  return consumeSeparator(text, index, end, CharCode.SEMI_COLON);
}

/**
 * 스타일 파서의 전역 상태를 리셋합니다.
 * @param text 파싱할 스타일 텍스트.
 */
export function resetParserState(text: string): void {
  parserState.key = 0;
  parserState.keyEnd = 0;
  parserState.value = 0;
  parserState.valueEnd = 0;
  parserState.textEnd = text.length;
}

/**
 * 다음 비공백 문자 인덱스를 반환합니다.
 *
 * @param text 스캔할 텍스트
 * @param startIndex 문자 스캔을 시작할 인덱스.
 * @param endIndex 문자 스캔을 종료할 인덱스.
 * @returns 다음 비공백 문자의 인덱스 (해당 위치에서 공백이 없으면 `start`와 동일할 수 있음.)
 */
export function consumeWhitespace(text: string, startIndex: number, endIndex: number): number {
  while (startIndex < endIndex && text.charCodeAt(startIndex) <= CharCode.SPACE) {
    startIndex++;
  }
  return startIndex;
}

/**
 * 클래스 토큰의 마지막 문자의 인덱스를 반환합니다.
 *
 * @param text 스캔할 텍스트
 * @param startIndex 문자 스캔을 시작할 인덱스.
 * @param endIndex 문자 스캔을 종료할 인덱스.
 * @returns 클래스 토큰의 마지막 문자 이후 인덱스.
 */
export function consumeClassToken(text: string, startIndex: number, endIndex: number): number {
  while (startIndex < endIndex && text.charCodeAt(startIndex) > CharCode.SPACE) {
    startIndex++;
  }
  return startIndex;
}

/**
 * 스타일 키 및 토큰에 속하는 모든 문자를 소모합니다.
 *
 * @param text 스캔할 텍스트
 * @param startIndex 문자 스캔을 시작할 인덱스.
 * @param endIndex 문자 스캔을 종료할 인덱스.
 * @returns 마지막 스타일 키 문자의 이후 인덱스.
 */
export function consumeStyleKey(text: string, startIndex: number, endIndex: number): number {
  let ch: number;
  while (
    startIndex < endIndex &&
    ((ch = text.charCodeAt(startIndex)) === CharCode.DASH ||
      ch === CharCode.UNDERSCORE ||
      ((ch & CharCode.UPPER_CASE) >= CharCode.A && (ch & CharCode.UPPER_CASE) <= CharCode.Z) ||
      (ch >= CharCode.ZERO && ch <= CharCode.NINE))
  ) {
    startIndex++;
  }
  return startIndex;
}

/**
 * 스타일 키 이후에 모든 공백 및 구분자 `:`를 소모합니다.
 *
 * @param text 스캔할 텍스트
 * @param startIndex 문자 스캔을 시작할 인덱스.
 * @param endIndex 문자 스캔을 종료할 인덱스.
 * @returns 구분자 및 주변 공백 이후의 인덱스.
 */
export function consumeSeparator(
  text: string,
  startIndex: number,
  endIndex: number,
  separator: number,
): number {
  startIndex = consumeWhitespace(text, startIndex, endIndex);
  if (startIndex < endIndex) {
    if (ngDevMode && text.charCodeAt(startIndex) !== separator) {
      malformedStyleError(text, String.fromCharCode(separator), startIndex);
    }
    startIndex++;
  }
  return startIndex;
}

/**
 * `url()` 및 `""` 텍스트를 고려하여 스타일 값을 소모합니다.
 *
 * @param text 스캔할 텍스트
 * @param startIndex 문자 스캔을 시작할 인덱스.
 * @param endIndex 문자 스캔을 종료할 인덱스.
 * @returns 마지막 스타일 값 문자 이후의 인덱스.
 */
export function consumeStyleValue(text: string, startIndex: number, endIndex: number): number {
  let ch1 = -1; // 1번째 이전 문자
  let ch2 = -1; // 2번째 이전 문자
  let ch3 = -1; // 3번째 이전 문자
  let i = startIndex;
  let lastChIndex = i;
  while (i < endIndex) {
    const ch: number = text.charCodeAt(i++);
    if (ch === CharCode.SEMI_COLON) {
      return lastChIndex;
    } else if (ch === CharCode.DOUBLE_QUOTE || ch === CharCode.SINGLE_QUOTE) {
      lastChIndex = i = consumeQuotedText(text, ch, i, endIndex);
    } else if (
      startIndex === i - 4 && // 이제까지 4개의 문자만 보았음 "URL(" (Ignore "foo_URL()")
      ch3 === CharCode.U &&
      ch2 === CharCode.R &&
      ch1 === CharCode.L &&
      ch === CharCode.OPEN_PAREN
    ) {
      lastChIndex = i = consumeQuotedText(text, CharCode.CLOSE_PAREN, i, endIndex);
    } else if (ch > CharCode.SPACE) {
      // 비공백 문자가 있는 경우 위치를 캡처합니다.
      lastChIndex = i;
    }
    ch3 = ch2;
    ch2 = ch1;
    ch1 = ch & CharCode.UPPER_CASE;
  }
  return lastChIndex;
}

/**
 * 모든 인용된 문자를 소모합니다.
 *
 * @param text 스캔할 텍스트
 * @param quoteCharCode `"` 또는 `'` 인용어의 CharCode 또는 `url(...)`의 `)`입니다.
 * @param startIndex 문자 스캔을 시작할 인덱스.
 * @param endIndex 문자 스캔을 종료할 인덱스.
 * @returns 인용된 문자 이후의 인덱스.
 */
export function consumeQuotedText(
  text: string,
  quoteCharCode: number,
  startIndex: number,
  endIndex: number,
): number {
  let ch1 = -1; // 1번째 이전 문자
  let index = startIndex;
  while (index < endIndex) {
    const ch = text.charCodeAt(index++);
    if (ch == quoteCharCode && ch1 !== CharCode.BACK_SLASH) {
      return index;
    }
    if (ch == CharCode.BACK_SLASH && ch1 === CharCode.BACK_SLASH) {
      // 두 개의 백슬래시가 서로 취소됩니다. 예를 들어 `"\\"`로 인해
      // 인용이 제대로 끝나야 합니다. (마지막 `"`이 이스케이프된 것으로 간주해서는 안 됩니다.)
      ch1 = 0;
    } else {
      ch1 = ch;
    }
  }
  throw ngDevMode
    ? malformedStyleError(text, String.fromCharCode(quoteCharCode), endIndex)
    : new Error();
}

function malformedStyleError(text: string, expecting: string, index: number): never {
  ngDevMode && assertEqual(typeof text === 'string', true, '여기서 문자열이 예상됩니다.');
  throw throwError(
    `문자열의 위치 ${index}에서 잘못된 스타일이 있습니다: '` +
      text.substring(0, index) +
      '[>>' +
      text.substring(index, index + 1) +
      '<<]' +
      text.slice(index + 1) +
      `'. '${expecting}'가 예상됩니다.`,
  );
}
