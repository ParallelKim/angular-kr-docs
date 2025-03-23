/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertEqual, assertLessThanOrEqual} from './assert';

/**
 * 두 배열의 내용이 동일한지 여부를 판단합니다.
 *
 * @param a 첫 번째 배열
 * @param b 두 번째 배열
 * @param identityAccessor 배열의 값에서 안정적인 객체 아이덴티티를 추출하기 위한 선택적 함수.
 */
export function arrayEquals<T>(a: T[], b: T[], identityAccessor?: (value: T) => unknown): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    let valueA = a[i];
    let valueB = b[i];
    if (identityAccessor) {
      valueA = identityAccessor(valueA) as any;
      valueB = identityAccessor(valueB) as any;
    }
    if (valueB !== valueA) {
      return false;
    }
  }
  return true;
}

/**
 * 배열을 평면화합니다.
 */
export function flatten(list: any[]): any[] {
  return list.flat(Number.POSITIVE_INFINITY);
}

export function deepForEach<T>(input: (T | any[])[], fn: (value: T) => void): void {
  input.forEach((value) => (Array.isArray(value) ? deepForEach(value, fn) : fn(value)));
}

export function addToArray(arr: any[], index: number, value: any): void {
  // 성능: array.push가 array.splice보다 빠릅니다!
  if (index >= arr.length) {
    arr.push(value);
  } else {
    arr.splice(index, 0, value);
  }
}

export function removeFromArray(arr: any[], index: number): any {
  // 성능: array.pop이 array.splice보다 빠릅니다!
  if (index >= arr.length - 1) {
    return arr.pop();
  } else {
    return arr.splice(index, 1)[0];
  }
}

export function newArray<T = any>(size: number): T[];
export function newArray<T>(size: number, value: T): T[];
export function newArray<T>(size: number, value?: T): T[] {
  const list: T[] = [];
  for (let i = 0; i < size; i++) {
    list.push(value!);
  }
  return list;
}

/**
 * 배열에서 항목을 제거합니다. (Array.splice()와 같지만 더 빠름.)
 *
 * `Array.splice()`는 제거된 요소들을 위한 배열을 할당해야 하므로 그리 빠르지 않습니다.
 * 이는 메모리 압박을 유발하고 대부분의 경우 삭제된 항목 배열에 신경 쓰지 않는 상황에서는
 * 코드 실행을 느리게 만듭니다.
 *
 * https://jsperf.com/fast-array-splice (약 20배 빠름)
 *
 * @param array Splice할 배열
 * @param index 제거할 배열의 요소의 인덱스.
 * @param count 제거할 항목 수.
 */
export function arraySplice(array: any[], index: number, count: number): void {
  const length = array.length - count;
  while (index < length) {
    array[index] = array[index + count];
    index++;
  }
  while (count--) {
    array.pop(); // 배열 크기 축소
  }
}

/**
 * Array.splice(index, 0, value)와 같지만 더 빠릅니다.
 *
 * `Array.splice()`는 제거된 요소들을 위한 배열을 할당해야 하므로 그리 빠르지 않습니다.
 * 이는 메모리 압박을 유발하고 대부분의 경우 삭제된 항목 배열에 신경 쓰지 않는 상황에서는
 * 코드 실행을 느리게 만듭니다.
 *
 * @param array Splice할 배열.
 * @param index 배열에 value를 추가해야 할 인덱스.
 * @param value 배열에 추가할 값.
 */
export function arrayInsert(array: any[], index: number, value: any): void {
  ngDevMode && assertLessThanOrEqual(index, array.length, '배열의 끝을 넘어 삽입할 수 없습니다.');
  let end = array.length;
  while (end > index) {
    const previousEnd = end - 1;
    array[end] = array[previousEnd];
    end = previousEnd;
  }
  array[index] = value;
}

/**
 * Array.splice2(index, 0, value1, value2)와 같지만 더 빠릅니다.
 *
 * `Array.splice()`는 제거된 요소들을 위한 배열을 할당해야 하므로 그리 빠르지 않습니다.
 * 이는 메모리 압박을 유발하고 대부분의 경우 삭제된 항목 배열에 신경 쓰지 않는 상황에서는
 * 코드 실행을 느리게 만듭니다.
 *
 * @param array Splice할 배열.
 * @param index 배열에 value를 추가해야 할 인덱스.
 * @param value1 배열에 추가할 값.
 * @param value2 배열에 추가할 값.
 */
export function arrayInsert2(array: any[], index: number, value1: any, value2: any): void {
  ngDevMode && assertLessThanOrEqual(index, array.length, '배열의 끝을 넘어 삽입할 수 없습니다.');
  let end = array.length;
  if (end == index) {
    // 끝에 삽입.
    array.push(value1, value2);
  } else if (end === 1) {
    // 배열의 항목 수가 삽입할 항목 수보다 적다는 극단적인 경우.
    array.push(value2, array[0]);
    array[0] = value1;
  } else {
    end--;
    array.push(array[end - 1], array[end]);
    while (end > index) {
      const previousEnd = end - 2;
      array[end] = array[previousEnd];
      end--;
    }
    array[index] = value1;
    array[index + 1] = value2;
  }
}

/**
 * 정렬된 배열에서 `value`의 인덱스를 가져옵니다.
 *
 * 참고:
 * - 빠른 제거를 위해 이진 검색 알고리즘을 사용합니다.
 *
 * @param array 이진 검색할 정렬된 배열.
 * @param value 찾고자 하는 값.
 * @returns 값의 인덱스.
 *   - 값이 발견되면 양수 인덱스.
 *   - 값이 발견되지 않으면 음수 인덱스. (`~index`를 사용하여 있어야 했던 위치를 얻습니다.)
 */
export function arrayIndexOfSorted(array: string[], value: string): number {
  return _arrayIndexOfSorted(array, value, 0);
}

/**
 * `KeyValueArray`는 짝수 위치에는 키가, 홀수 위치에는 값이 포함된 배열입니다.
 *
 * `KeyValueArray`는 그 내용물을 반복하는 매우 효율적인 방법을 제공합니다. 작은 집합(약 10개)의 경우
 * `KeyValueArray`의 이진 검색 비용은 `Map`과 비슷한 성능 특성을 가지며 메모리 사용량이 훨씬 좋습니다.
 *
 * `Map`으로 사용될 경우 키는 알파벳 순서로 저장되어 검색을 위해 이진 검색할 수 있습니다.
 *
 * See: `keyValueArraySet`, `keyValueArrayGet`, `keyValueArrayIndexOf`, `keyValueArrayDelete`.
 */
export interface KeyValueArray<VALUE> extends Array<VALUE | string> {
  __brand__: 'array-map';
}

/**
 * `key`에 대한 `value`를 설정합니다.
 *
 * @param keyValueArray 수정할 배열.
 * @param key 찾거나 생성할 키.
 * @param value 키에 대해 설정할 값.
 * @returns 값이 설정된 인덱스(항상 짝수).
 */
export function keyValueArraySet<V>(
  keyValueArray: KeyValueArray<V>,
  key: string,
  value: V,
): number {
  let index = keyValueArrayIndexOf(keyValueArray, key);
  if (index >= 0) {
    // 찾은 경우 설정합니다.
    keyValueArray[index | 1] = value;
  } else {
    index = ~index;
    arrayInsert2(keyValueArray, index, key, value);
  }
  return index;
}

/**
 * 누락된 경우 `undefined`로 `key`에 대한 `value`를 검색합니다.
 *
 * @param keyValueArray 검색할 배열.
 * @param key 찾고자 하는 키.
 * @return 키 위치에 저장된 `value` 또는 찾지 못한 경우 `undefined`.
 */
export function keyValueArrayGet<V>(keyValueArray: KeyValueArray<V>, key: string): V | undefined {
  const index = keyValueArrayIndexOf(keyValueArray, key);
  if (index >= 0) {
    // 찾은 경우 검색합니다.
    return keyValueArray[index | 1] as V;
  }
  return undefined;
}

/**
 * 배열에서 키 인덱스 값을 검색하거나 찾지 못한 경우 `-1`을 반환합니다.
 *
 * @param keyValueArray 검색할 배열.
 * @param key 찾고자 하는 키.
 * @returns 키가 있는 인덱스(혹은 있어야 했던 인덱스).
 *   - 키가 발견된 경우 양수(짝수) 인덱스.
 *   - 키가 발견되지 않은 경우 음수 인덱스. (`~index` (짝수)를 사용하여 삽입되었어야 했던 인덱스 얻기.)
 */
export function keyValueArrayIndexOf<V>(keyValueArray: KeyValueArray<V>, key: string): number {
  return _arrayIndexOfSorted(keyValueArray as string[], key, 1);
}

/**
 * `KeyValueArray`에서 `key`(및 `value`)를 삭제합니다.
 *
 * @param keyValueArray 수정할 배열.
 * @param key 위치를 찾거나 삭제할 키(존재할 경우).
 * @returns 키가 있던 위치의 인덱스(혹은 있어야 했던 인덱스).
 *   - 키가 발견되어 삭제된 경우 양수(짝수) 인덱스.
 *   - 키가 발견되지 않은 경우 음수 인덱스. (`~index` (짝수)를 사용하여 있었어야 했던 인덱스 얻기.)
 */
export function keyValueArrayDelete<V>(keyValueArray: KeyValueArray<V>, key: string): number {
  const index = keyValueArrayIndexOf(keyValueArray, key);
  if (index >= 0) {
    // 찾은 경우 제거합니다.
    arraySplice(keyValueArray, index, 2);
  }
  return index;
}

/**
 * 내부: `shift`로 검색을 그룹화하여 정렬된 배열에서 `value`의 인덱스를 가져옵니다.
 *
 * 참고:
 * - 빠른 제거를 위해 이진 검색 알고리즘을 사용합니다.
 *
 * @param array 이진 검색할 정렬된 배열.
 * @param value 찾고자 하는 값.
 * @param shift 그룹화 시프트.
 *   - `0`은 모든 위치를 검색.
 *   - `1`은 매 홀수 위치(짝수 위치만 검색).
 * @returns 값의 인덱스.
 *   - 값이 발견되면 양수 인덱스.
 *   - 값이 발견되지 않으면 음수 인덱스. (`~index` 를 사용하여 삽입되었어야 했던 위치 얻기)
 */
function _arrayIndexOfSorted(array: string[], value: string, shift: number): number {
  ngDevMode && assertEqual(Array.isArray(array), true, '배열을 기대합니다');
  let start = 0;
  let end = array.length >> shift;
  while (end !== start) {
    const middle = start + ((end - start) >> 1); // 중간을 찾습니다.
    const current = array[middle << shift];
    if (value === current) {
      return middle << shift;
    } else if (current > value) {
      end = middle;
    } else {
      start = middle + 1; // 이미 중간을 검색했으므로 비포함 독립성 증가
    }
  }
  return ~(end << shift);
}
