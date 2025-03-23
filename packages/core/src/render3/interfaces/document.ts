/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../../errors';

/**
 * Angular에서 `document`의 대부분의 사용은 DI 시스템 내에서 이루어지므로
 * `DOCUMENT` 토큰을 간단히 주입하여 작업을 완료할 수 있습니다.
 *
 * Ivy는 DI에 의존하지 않기 때문에 문서를 다른 방법으로 확보해야 합니다.
 *
 * 해결책은 ivy를 위한 `getDocument()` 및 `setDocument()` 최상위 함수를 정의하는 것입니다.
 * Ivy가 글로벌 문서가 필요할 때마다 `getDocument()`를 호출합니다.
 *
 * 브라우저 환경 외부에서 ivy를 실행할 때는 `setDocument()`를 호출하여
 * ivy에 글로벌 `document`가 무엇인지 알려주어야 합니다.
 *
 * Angular는 표준 플랫폼(`Browser` 및 `Server`) 각각에서
 * `DOCUMENT` 토큰을 제공할 때 `setDocument()`를 호출하여 이를 수행합니다.
 */
let DOCUMENT: Document | undefined = undefined;

/**
 * 이 플랫폼에 대한 `document`가 무엇인지 ivy에 알려줍니다.
 *
 * 현재 플랫폼이 브라우저가 아닐 경우에만 이 호출이 필요합니다.
 *
 * @param document 이 환경에서 글로벌 `document`를 나타내는 객체입니다.
 */
export function setDocument(document: Document | undefined): void {
  DOCUMENT = document;
}

/**
 * 이 플랫폼에 대한 `document`를 나타내는 객체에 접근합니다.
 *
 * Ivy는 `document` 객체에 접근해야 할 때마다 이 함수를 호출합니다.
 * 예를 들어 렌더러를 생성하거나 정리 작업을 수행할 때 사용됩니다.
 */
export function getDocument(): Document {
  if (DOCUMENT !== undefined) {
    return DOCUMENT;
  } else if (typeof document !== 'undefined') {
    return document;
  }

  throw new RuntimeError(
    RuntimeErrorCode.MISSING_DOCUMENT,
    (typeof ngDevMode === 'undefined' || ngDevMode) &&
      `이 컨텍스트에서 document 객체를 사용할 수 없습니다. DOCUMENT 주입 토큰이 제공되었는지 확인하십시오.`,
  );

  // "document"를 찾을 수 없습니다. 이는 Ivy가 Angular 외부에서 실행되고
  // 현재 플랫폼이 브라우저가 아닐 경우에만 발생해야 합니다. 현재로서는 지원되지 않는 시나리오이므로
  // Angular 앱에서 이러한 일이 발생해서는 안 됩니다.
  // Angular 외부에서 Ivy를 실행할 수 있게 되면 `setDocument()`를
  // 공용 API로 공개해야 합니다.
}
