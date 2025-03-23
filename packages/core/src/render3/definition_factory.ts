/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {stringify} from '../util/stringify';
import {NG_FACTORY_DEF} from './fields';

/**
 * 팩토리 함수의 정의가 어떻게 보여야 하는지를 나타냅니다.
 */
export type FactoryFn<T> = {
  /**
   * 명시적인 생성자 없이 서브클래스는 자신들의 생성자를 제공하여 기본 정의의 팩토리로 호출합니다.
   */
  <U extends T>(t?: Type<U>): U;

  /**
   * 인스턴스화를 위한 생성자가 제공되지 않으면, 타입 T 자체의 인스턴스가 생성됩니다.
   */
  (t?: undefined): T;
};

export function getFactoryDef<T>(type: any, throwNotFound: true): FactoryFn<T>;
export function getFactoryDef<T>(type: any): FactoryFn<T> | null;
export function getFactoryDef<T>(type: any, throwNotFound?: boolean): FactoryFn<T> | null {
  const hasFactoryDef = type.hasOwnProperty(NG_FACTORY_DEF);
  if (!hasFactoryDef && throwNotFound === true && ngDevMode) {
    throw new Error(`타입 ${stringify(type)}는 'ɵfac' 속성이 없습니다.`);
  }
  return hasFactoryDef ? type[NG_FACTORY_DEF] : null;
}
