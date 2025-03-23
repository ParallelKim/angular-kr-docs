/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * @description
 *
 * 컴포넌트 또는 다른 객체가 인스턴스인 유형을 나타냅니다.
 *
 * `Type`의 예는 `MyCustomComponent` 클래스이며, 이는 JavaScript에서
 * `MyCustomComponent` 생성자 함수로 표현됩니다.
 *
 * @publicApi
 */
export const Type = Function;

export function isType(v: any): v is Type<any> {
  return typeof v === 'function';
}

/**
 * @description
 *
 * 구체적인 클래스에 적용되면 인스턴스화할 수 없는 추상 클래스 `T`를 나타냅니다.
 *
 * @publicApi
 */
export interface AbstractType<T> extends Function {
  prototype: T;
}

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

/**
 * 타입의 쓰기 가능한 유형 버전을 반환합니다.
 *
 * 사용법:
 * 주어진:
 * ```ts
 * interface Person {readonly name: string}
 * ```
 *
 * 우리는 `Person`의 읽기/쓰기 버전을 얻고 싶습니다.
 * ```ts
 * const WritablePerson = Writable<Person>;
 * ```
 *
 * 결과적으로 우리는 다음을 할 수 있습니다:
 *
 * ```ts
 * const readonlyPerson: Person = {name: 'Marry'};
 * readonlyPerson.name = 'John'; // TypeError
 * (readonlyPerson as WritablePerson).name = 'John'; // OK
 *
 * // 오류: `Person`에 `age` 속성이 없음을 정확히 감지합니다.
 * (readonlyPerson as WritablePerson).age = 30;
 * ```
 */
export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};
