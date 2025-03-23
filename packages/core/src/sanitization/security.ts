/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * SecurityContext는 위험한 보안 문제를 유발할 수 있는 위치를 표시합니다. 예를 들어,
 * 잘못 처리될 경우 Cross Site Scripting (XSS) 보안 버그를 유발할 수 있는 `innerHTML`과 같은
 * DOM 속성입니다.
 *
 * Angular 애플리케이션에서 보안에 대한 더 자세한 내용은 DomSanitizer를 참조하십시오.
 *
 * @publicApi
 */
export enum SecurityContext {
  NONE = 0,
  HTML = 1,
  STYLE = 2,
  SCRIPT = 3,
  URL = 4,
  RESOURCE_URL = 5,
}
