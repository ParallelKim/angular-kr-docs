/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

declare global {
  /**
   * 애플리케이션이 서버 렌더링 모드에서 작동하는지 여부를 나타냅니다.
   *
   * `ngServerMode`는 Angular의 서버 사이드 렌더링 메커니즘에 의해 설정된 전역 플래그로,
   * 일반적으로 런타임 동안 `provideServerRendering` 및 `platformServer`에 의해 구성됩니다.
   *
   * @remarks
   * - **내부 Angular 플래그**: 이것은 *내부* Angular 플래그입니다 (공식 API가 아님), 애플리케이션 코드에서 의존하지 않도록 하세요.
   * - **직접 사용 피하기**: 이 변수는 런타임 구성용으로 의도되었으며; 애플리케이션 코드에서 직접 접근해서는 안 됩니다.
   */
  var ngServerMode: boolean | undefined;
}

// 이 파일이 ES 모듈로 취급되도록 빈 객체를 내보내어 전역 범위를 확장할 수 있도록 합니다.
export {};
