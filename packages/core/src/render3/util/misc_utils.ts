/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RElement} from '../interfaces/renderer_dom';

/**
 *
 * @codeGenApi
 */
export function ɵɵresolveWindow(element: RElement & {ownerDocument: Document}) {
  return element.ownerDocument.defaultView;
}

/**
 *
 * @codeGenApi
 */
export function ɵɵresolveDocument(element: RElement & {ownerDocument: Document}) {
  return element.ownerDocument;
}

/**
 *
 * @codeGenApi
 */
export function ɵɵresolveBody(element: RElement & {ownerDocument: Document}) {
  return element.ownerDocument.body;
}

/**
 * 속성 바인딩 메타데이터에서 속성 이름, 접두사 및 접미사를 구분하는 데 사용하는 특별한 구분자입니다. storeBindingMetadata()를 참조하십시오.
 *
 * 우리는 의도적으로 유니코드 "교체 문자"(U+FFFD)를 구분자로 사용합니다.
 * 이는 사용자의 속성 이름이나 보간 문자열의 일부일 가능성이 아주 낮은 매우 드문 문자이기 때문입니다.
 * 만약 실제로 속성 바인딩에 사용된다면, DebugElement.properties는 해당 바인딩의 올바른 값을 반환하지 않을 것입니다.
 * 그러나 실제 애플리케이션에서는 런타임 효과가 없어야 합니다.
 *
 * 이 문자는 일반적으로 다이아몬드 안에 물음표로 렌더링됩니다.
 * https://en.wikipedia.org/wiki/Specials_(Unicode_block) 참조
 *
 */
export const INTERPOLATION_DELIMITER = `�`;

/**
 * 클로저 뒤에 있을 수 있는 값을 풀어냅니다 (전방 선언 이유로).
 */
export function maybeUnwrapFn<T>(value: T | (() => T)): T {
  if (value instanceof Function) {
    return value();
  } else {
    return value;
  }
}
