/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ApplicationRef} from '../application/application_ref';

/**
 * @description
 * @NgModule 주석에서 `bootstrap` 배열을 사용하는 대신 응용 프로그램을 수동으로 부트스트랩하기 위한 훅입니다.
 * 이 훅은 `bootstrap` 배열이 비어있거나 제공되지 않을 때만 호출됩니다.
 *
 * 현재 애플리케이션에 대한 참조는 매개변수로 제공됩니다.
 *
 * ["부트스트래핑"](guide/ngmodules/bootstrapping)을 참조하십시오.
 *
 * @usageNotes
 * 아래 예제는 `ApplicationRef.bootstrap()`을 사용하여
 * 페이지에 `AppComponent`를 렌더링합니다.
 *
 * ```ts
 * class AppModule implements DoBootstrap {
 *   ngDoBootstrap(appRef: ApplicationRef) {
 *     appRef.bootstrap(AppComponent); // 또는 다른 구성 요소
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export interface DoBootstrap {
  ngDoBootstrap(appRef: ApplicationRef): void;
}
