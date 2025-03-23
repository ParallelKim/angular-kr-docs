/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {getActiveConsumer} from '@angular/core/primitives/signals';

import {RuntimeError, RuntimeErrorCode} from '../../errors';

/**
 * 현재 스택 프레임이 반응형 컨텍스트 내에 있지 않음을 확정합니다. 특정 코드가 반응형 컨텍스트 내에서 실행되는 것을 허용하지 않기 위해 유용합니다(see {@link /api/core/rxjs/toSignal toSignal})
 *
 * @param debugFn 주장을 하는 함수에 대한 참조(오류 메시지에 사용됨).
 *
 * @publicApi
 */
export function assertNotInReactiveContext(debugFn: Function, extraContext?: string): void {
  // 여기서 `Function`을 문자열 이름 대신 사용하는 것은 함수의 비축소 이름이 축소 여부에 관계없이 번들에 유지되지 않도록 방지합니다.
  if (getActiveConsumer() !== null) {
    throw new RuntimeError(
      RuntimeErrorCode.ASSERTION_NOT_INSIDE_REACTIVE_CONTEXT,
      ngDevMode &&
        `${debugFn.name}()는 반응형 컨텍스트 내에서 호출될 수 없습니다.${
          extraContext ? ` ${extraContext}` : ''
        }`,
    );
  }
}
