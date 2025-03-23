/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

export function getClosureSafeProperty<T>(objWithPropertyToExtract: T): string {
  for (let key in objWithPropertyToExtract) {
    if (objWithPropertyToExtract[key] === (getClosureSafeProperty as any)) {
      return key;
    }
  }
  throw Error('Could not find renamed property on target object.');
}

/**
 * 대상 객체에 속성을 설정하지만
 * 속성이 이미 대상 객체에 존재하지 않는 경우에만 설정합니다.
 * @param target 속성을 설정할 대상
 * @param source 설정할 속성 키와 값의 출처
 */
export function fillProperties(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const key in source) {
    if (source.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}
