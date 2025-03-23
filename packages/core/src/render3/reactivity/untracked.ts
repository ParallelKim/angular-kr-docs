/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {untracked as untrackedPrimitive} from '@angular/core/primitives/signals';

/**
 * 비반응성(비추적) 컨텍스트에서 임의의 함수를 실행합니다. 실행된 함수는 선택적으로 값을 반환할 수 있습니다.
 */
export function untracked<T>(nonReactiveReadsFn: () => T): T {
  return untrackedPrimitive(nonReactiveReadsFn);
}
