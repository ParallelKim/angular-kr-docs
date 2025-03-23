/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {NgModule} from '../metadata';

import {ApplicationRef} from './application_ref';

/**
 * `BrowserModule`에 의해 재수출되며, 이는 CLI `new` 명령어로 새 앱을 생성할 때 루트
 * `AppModule`에 자동으로 포함됩니다. `ApplicationRef`를 즉시 주입하여 인스턴스화합니다.
 *
 * @publicApi
 */
@NgModule()
export class ApplicationModule {
  // 즉시 사용하기 위해 ApplicationRef를 주입합니다...
  constructor(appRef: ApplicationRef) {}
}
