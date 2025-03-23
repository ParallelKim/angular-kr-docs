/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 값을 (일반적으로 문자열) 부울로 변환합니다.
 * 입력의 변환 함수로 사용될 예정입니다.
 *
 *  @usageNotes
 *  ```ts
 *  @Input({ transform: booleanAttribute }) status!: boolean;
 *  ```
 * @param value 변환할 값.
 *
 * @publicApi
 */
export function booleanAttribute(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value != null && value !== 'false';
}

/**
 * 값을 (일반적으로 문자열) 숫자로 변환합니다.
 * 입력의 변환 함수로 사용될 예정입니다.
 * @param value 변환할 값.
 * @param fallbackValue 제공된 값을 숫자로 파싱할 수 없을 경우 사용할 값.
 *
 *  @usageNotes
 *  ```ts
 *  @Input({ transform: numberAttribute }) id!: number;
 *  ```
 *
 * @publicApi
 */
export function numberAttribute(value: unknown, fallbackValue = NaN): number {
  // parseFloat(value)는 우리가 관심 있는 대부분의 경우를 처리합니다 (null, 빈 문자열,
  // 및 기타 숫자가 아닌 값은 NaN으로 처리합니다. 반면 Number는 0을 사용합니다) 그러나 문자열
  // '123hello'를 유효한 숫자로 간주합니다. 따라서 우리는 또한 Number(value)가 NaN인지 확인합니다.
  const isNumberValue = !isNaN(parseFloat(value as any)) && !isNaN(Number(value));
  return isNumberValue ? Number(value) : fallbackValue;
}
