/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertInInjectionContext} from '../../di';

import {OutputEmitterRef} from './output_emitter_ref';

/**
 * 출력을 선언하기 위한 옵션.
 *
 * @publicAPI
 */
export interface OutputOptions {
  alias?: string;
}

/**
 * `output` 함수는 지시자와 구성 요소에서 Angular 출력을 선언할 수 있게 해줍니다.
 *
 * 출력을 사용하여 부모 지시자와 구성 요소에 값을 emit할 수 있습니다.
 * 부모는 다음을 통해 변경 사항을 구독할 수 있습니다:
 *
 * - 템플릿 이벤트 바인딩. 예: `(myOutput)="doSomething($event)"`
 * - `OutputRef#subscribe`를 사용한 프로그래밍적 구독.
 *
 * @usageNotes
 *
 * `output()`을 사용하려면, `@angular/core`에서 함수를 가져옵니다.
 *
 * ```ts
 * import {output} from '@angular/core';
 * ```
 *
 * 구성 요소 내부에서 새로운 클래스 멤버를 소개하고
 * `output` 호출로 초기화합니다.
 *
 * ```ts
 * @Directive({
 *   ...
 * })
 * export class MyDir {
 *   nameChange = output<string>();    // OutputEmitterRef<string>
 *   onClick    = output();            // OutputEmitterRef<void>
 * }
 * ```
 *
 * `OutputEmitterRef`의 `emit` 메서드를 사용하여
 * 지시자의 소비자에게 값을 emit할 수 있습니다.
 *
 * ```ts
 * updateName(newName: string): void {
 *   this.nameChange.emit(newName);
 * }
 * ```
 * @initializerApiFunction {"showTypesInSignaturePreview": true}
 * @publicAPI
 */
export function output<T = void>(opts?: OutputOptions): OutputEmitterRef<T> {
  ngDevMode && assertInInjectionContext(output);
  return new OutputEmitterRef<T>();
}
