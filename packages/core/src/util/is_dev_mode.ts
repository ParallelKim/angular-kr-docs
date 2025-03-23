/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {global} from './global';

/**
 * Angular가 개발 모드인지 여부를 반환합니다.
 *
 * 기본적으로, 이는 true이며, `enableProdMode`가 이 메서드를 호출하기 전에 호출되거나,
 * 응용 프로그램이 `optimization` 옵션을 사용하여 Angular CLI로 빌드될 경우에는 false가 됩니다.
 * @see {@link /cli/build ng build}
 *
 * @publicApi
 */
export function isDevMode(): boolean {
  return typeof ngDevMode === 'undefined' || !!ngDevMode;
}

/**
 * Angular의 개발 모드를 비활성화하며, 이는 프레임워크 내에서의 단언 및 기타 체크를 끕니다.
 *
 * 이 비활성화되는 중요한 단언 중 하나는 변경 감지 패스가
 * 바인딩에 추가적인 변경을 초래하지 않는지를 검증합니다 (일방향 데이터 흐름이라고도 함).
 *
 * 이 메서드의 사용은 권장되지 않으며, Angular CLI는
 * `optimization` 옵션을 사용할 때 프로덕션 모드를 설정합니다.
 * @see {@link /cli/build ng build}
 *
 * @publicApi
 */
export function enableProdMode(): void {
  // 아래의 체크는 ngDevMode가 terser를 통해 설정된 경우에도
  // `global['ngDevMode'] = false;`가 생략되도록 하기 위해 있습니다.
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    global['ngDevMode'] = false;
  }
}
