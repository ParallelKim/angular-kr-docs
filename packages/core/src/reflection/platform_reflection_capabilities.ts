/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';

export interface PlatformReflectionCapabilities {
  factory(type: Type<any>): Function;
  hasLifecycleHook(type: any, lcProperty: string): boolean;

  /**
   * 생성자 매개변수에 대한 주석/유형의 목록을 반환합니다.
   */
  parameters(type: Type<any>): any[][];

  /**
   * 클래스에 선언된 주석의 목록을 반환합니다.
   */
  annotations(type: Type<any>): any[];

  /**
   * 클래스 필드/속성에 대한 주석을 설명하는 객체 리터럴을 반환합니다.
   */
  propMetadata(typeOrFunc: Type<any>): {[key: string]: any[]};
}
