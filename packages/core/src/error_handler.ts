/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {inject, InjectionToken} from './di';

/**
 * 중앙 집중식 예외 처리를 위한 훅을 제공합니다.
 *
 * `ErrorHandler`의 기본 구현은 오류 메시지를 `console`에 출력합니다. 오류 처리를 가로채려면
 * 이 기본값을 대체하는 사용자 정의 예외 처리기를 작성하여 귀하의 앱에 적합하게 만드세요.
 *
 * @usageNotes
 * ### 예제
 *
 * ```ts
 * class MyErrorHandler implements ErrorHandler {
 *   handleError(error) {
 *     // 예외로 무엇인가를 수행
 *   }
 * }
 *
 * // 독립형 앱에서 제공
 * bootstrapApplication(AppComponent, {
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 *
 * // 모듈 기반 앱에서 제공
 * @NgModule({
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 * class MyModule {}
 * ```
 *
 * @publicApi
 */
export class ErrorHandler {
  /**
   * @internal
   */
  _console: Console = console;

  handleError(error: any): void {
    this._console.error('ERROR', error);
  }
}

/**
 * `ErrorHandler`를 호출하는 방법을 구성하는 데 사용되는 `InjectionToken`입니다.
 */
export const INTERNAL_APPLICATION_ERROR_HANDLER = new InjectionToken<(e: any) => void>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'internal error handler' : '',
  {
    providedIn: 'root',
    factory: () => {
      const userErrorHandler = inject(ErrorHandler);
      return (e: unknown) => userErrorHandler.handleError(e);
    },
  },
);
