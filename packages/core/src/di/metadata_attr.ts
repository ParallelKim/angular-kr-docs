/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ɵɵinjectAttribute} from '../render3/instructions/di_attr';
import {makeParamDecorator} from '../util/decorators';

/**
 * Attribute decorator / constructor function의 타입.
 *
 * @publicApi
 */
export interface AttributeDecorator {
  /**
   * 상수 문자열 리터럴로 주입되는 호스트 요소 속성을 지정하는 지시자 생성자의 매개변수 데코레이터.
   *
   * @usageNotes
   *
   * `<input>` 요소가 있고 그 `type`을 알고 싶다고 가정해 보겠습니다.
   *
   * ```html
   * <input type="text">
   * ```
   *
   * 다음 예제는 지시자에서 문자열 리터럴 `text`를 주입하기 위해 데코레이터를 사용하는 방법입니다.
   *
   * {@example core/ts/metadata/metadata.ts region='attributeMetadata'}
   *
   * 다음 예제는 구성 요소 생성자에서 데코레이터를 사용하는 방법입니다.
   *
   * {@example core/ts/metadata/metadata.ts region='attributeFactory'}
   *
   */
  (name: string): any;
  new (name: string): Attribute;
}

/**
 * Attribute 메타데이터의 타입.
 *
 * @publicApi
 */
export interface Attribute {
  /**
   * 주입할 수 있는 속성의 이름입니다.
   */
  attributeName: string;
}

/**
 * Attribute 데코레이터 및 메타데이터.
 *
 * @Annotation
 * @publicApi
 */
export const Attribute: AttributeDecorator = makeParamDecorator(
  'Attribute',
  (attributeName?: string) => ({
    attributeName,
    __NG_ELEMENT_ID__: () => ɵɵinjectAttribute(attributeName!),
  }),
);
