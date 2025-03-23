/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {nextContextImpl} from '../state';

/**
 * 지정된 수준의 컨텍스트를 검색하고 이를 전역 contextViewData로 저장합니다.
 * 수준이 지정되지 않은 경우 다음 수준을 가져옵니다.
 *
 * 이는 부모 뷰의 컨텍스트를 저장하여 임베디드 뷰에서 바인딩할 수 있도록 하거나,
 * reference()와 함께 사용하여 부모 뷰로부터 참조(ref)를 바인딩하는 데 사용됩니다.
 *
 * @param level contextViewData와 비교하여 컨텍스트를 가져오려는 뷰의 상대적 수준
 * @returns context
 *
 * @codeGenApi
 */
export function ɵɵnextContext<T = any>(level: number = 1): T {
  return nextContextImpl(level);
}
