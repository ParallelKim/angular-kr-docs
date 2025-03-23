/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// 이 파일의 함수는 명령어의 상태에 대한 우리의 가정이
// 어떤 로직을 구현하기 전에 올바른지 확인합니다.
// 이 함수들은 오직 개발 모드에서만 호출해야 하는 검사 목적으로 의도되었습니다.

import {getActiveConsumer} from '@angular/core/primitives/signals';

import {stringify} from './stringify';

export function assertNumber(actual: any, msg: string): asserts actual is number {
  if (!(typeof actual === 'number')) {
    throwError(msg, typeof actual, 'number', '===');
  }
}

export function assertNumberInRange(
  actual: any,
  minInclusive: number,
  maxInclusive: number,
): asserts actual is number {
  assertNumber(actual, 'Expected a number');
  assertLessThanOrEqual(actual, maxInclusive, 'Expected number to be less than or equal to');
  assertGreaterThanOrEqual(actual, minInclusive, 'Expected number to be greater than or equal to');
}

export function assertString(actual: any, msg: string): asserts actual is string {
  if (!(typeof actual === 'string')) {
    throwError(msg, actual === null ? 'null' : typeof actual, 'string', '===');
  }
}

export function assertFunction(actual: any, msg: string): asserts actual is Function {
  if (!(typeof actual === 'function')) {
    throwError(msg, actual === null ? 'null' : typeof actual, 'function', '===');
  }
}

export function assertEqual<T>(actual: T, expected: T, msg: string) {
  if (!(actual == expected)) {
    throwError(msg, actual, expected, '==');
  }
}

export function assertNotEqual<T>(actual: T, expected: T, msg: string): asserts actual is T {
  if (!(actual != expected)) {
    throwError(msg, actual, expected, '!=');
  }
}

export function assertSame<T>(actual: T, expected: T, msg: string): asserts actual is T {
  if (!(actual === expected)) {
    throwError(msg, actual, expected, '===');
  }
}

export function assertNotSame<T>(actual: T, expected: T, msg: string) {
  if (!(actual !== expected)) {
    throwError(msg, actual, expected, '!==');
  }
}

export function assertLessThan<T>(actual: T, expected: T, msg: string): asserts actual is T {
  if (!(actual < expected)) {
    throwError(msg, actual, expected, '<');
  }
}

export function assertLessThanOrEqual<T>(actual: T, expected: T, msg: string): asserts actual is T {
  if (!(actual <= expected)) {
    throwError(msg, actual, expected, '<=');
  }
}

export function assertGreaterThan<T>(actual: T, expected: T, msg: string): asserts actual is T {
  if (!(actual > expected)) {
    throwError(msg, actual, expected, '>');
  }
}

export function assertGreaterThanOrEqual<T>(
  actual: T,
  expected: T,
  msg: string,
): asserts actual is T {
  if (!(actual >= expected)) {
    throwError(msg, actual, expected, '>=');
  }
}

export function assertNotDefined<T>(actual: T, msg: string) {
  if (actual != null) {
    throwError(msg, actual, null, '==');
  }
}

export function assertDefined<T>(actual: T | null | undefined, msg: string): asserts actual is T {
  if (actual == null) {
    throwError(msg, actual, null, '!=');
  }
}

export function throwError(msg: string): never;
export function throwError(msg: string, actual: any, expected: any, comparison: string): never;
export function throwError(msg: string, actual?: any, expected?: any, comparison?: string): never {
  throw new Error(
    `ASSERTION ERROR: ${msg}` +
      (comparison == null ? '' : ` [Expected=> ${expected} ${comparison} ${actual} <=Actual]`),
  );
}

export function assertDomNode(node: any): asserts node is Node {
  if (!(node instanceof Node)) {
    throwError(`The provided value must be an instance of a DOM Node but got ${stringify(node)}`);
  }
}

export function assertElement(node: any): asserts node is Element {
  if (!(node instanceof Element)) {
    throwError(`The provided value must be an element but got ${stringify(node)}`);
  }
}

export function assertIndexInRange(arr: any[], index: number) {
  assertDefined(arr, 'Array must be defined.');
  const maxLen = arr.length;
  if (index < 0 || index >= maxLen) {
    throwError(`Index expected to be less than ${maxLen} but got ${index}`);
  }
}

export function assertOneOf(value: any, ...validValues: any[]) {
  if (validValues.indexOf(value) !== -1) return true;
  throwError(
    `Expected value to be one of ${JSON.stringify(validValues)} but was ${JSON.stringify(value)}.`,
  );
}

export function assertNotReactive(fn: string): void {
  if (getActiveConsumer() !== null) {
    throwError(`${fn}() should never be called in a reactive context.`);
  }
}
