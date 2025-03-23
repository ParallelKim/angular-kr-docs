/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {initNgDevMode} from './ng_dev_mode';

/**
 * 이 파일은 렌더링 코드의 다양한 부분에서 기본 반환 값으로 사용할 수 있는 재사용 가능한 "빈" 기호를 포함합니다.
 * 동일한 기호가 반환되므로, 이러한 값에 대한 동일성 검사를 프레임워크 코드에서 일관되게 사용할 수 있습니다.
 */

export const EMPTY_OBJ: never = {} as never;
export const EMPTY_ARRAY: any[] = [];

// 값이 고정되면 어떤 코드도 실수로 새로운 값을 할당할 수 없습니다.
if ((typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode()) {
  // 이러한 속성 접근은 무시해도 되며, ngDevMode가 최적화 코드로 false로 설정될 때
  // 전체 if 문이 제거됩니다.
  // tslint:disable-next-line:no-toplevel-property-access
  Object.freeze(EMPTY_OBJ);
  // tslint:disable-next-line:no-toplevel-property-access
  Object.freeze(EMPTY_ARRAY);
}
