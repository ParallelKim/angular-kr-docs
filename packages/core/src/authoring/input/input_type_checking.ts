/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InputSignalWithTransform} from './input_signal';

/** `InputSignal` 및 `InputSignalWithTransform`의 쓰기 유형을 검색합니다. */
export type ɵUnwrapInputSignalWriteType<Field> =
  Field extends InputSignalWithTransform<any, infer WriteT> ? WriteT : never;

/**
 * 주어진 지시문의 모든 `InputSignal`/`InputSignalWithTransform` 클래스 필드를 풀어냅니다.
 */
export type ɵUnwrapDirectiveSignalInputs<Dir, Fields extends keyof Dir> = {
  [P in Fields]: ɵUnwrapInputSignalWriteType<Dir[P]>;
};
