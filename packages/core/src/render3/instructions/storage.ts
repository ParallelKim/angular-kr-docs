/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {HEADER_OFFSET, LView, TView} from '../interfaces/view';
import {getContextLView} from '../state';
import {load} from '../util/view_utils';

/** 주어진 `index`에 `data`에 값을 저장합니다. */
export function store<T>(tView: TView, lView: LView, index: number, value: T): void {
  // 우리는 지역 변수에 대한 정적 데이터를 저장하지 않으므로,
  // 템플릿을 처음 볼 때는 희소 배열을 피하기 위해 null로 저장해야 합니다.
  if (index >= tView.data.length) {
    tView.data[index] = null;
    tView.blueprint[index] = null;
  }
  lView[index] = value;
}

/**
 * 현재 contextViewData에서 로컬 참조를 검색합니다.
 *
 * 검색할 참조가 부모 뷰에 있는 경우, 이 명령은 tree를 올라가고
 * contextViewData 인스턴스를 업데이트하는 nextContext() 호출과 함께 사용됩니다.
 *
 * @param index contextViewData에서 로컬 참조의 인덱스.
 *
 * @codeGenApi
 */
export function ɵɵreference<T>(index: number) {
  const contextLView = getContextLView();
  return load<T>(contextLView, HEADER_OFFSET + index);
}
