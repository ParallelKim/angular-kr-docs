/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertNumber} from '../../util/assert';

import {ID, LView} from './view';

// 현재 활성화된 LViews를 추적합니다.
const TRACKED_LVIEWS = new Map<number, LView>();

// LViews를 위한 고유 ID를 생성하는 데 사용됩니다.
let uniqueIdCounter = 0;

/** LView에 할당할 수 있는 고유 ID를 가져옵니다. */
export function getUniqueLViewId(): number {
  return uniqueIdCounter++;
}

/** LView의 추적을 시작합니다. */
export function registerLView(lView: LView): void {
  ngDevMode && assertNumber(lView[ID], 'LView는 등록되기 위해 ID를 가져야 합니다');
  TRACKED_LVIEWS.set(lView[ID], lView);
}

/** 고유 ID로 LView를 가져옵니다. */
export function getLViewById(id: number): LView | null {
  ngDevMode && assertNumber(id, 'LView 검색에 사용되는 ID는 숫자여야 합니다');
  return TRACKED_LVIEWS.get(id) || null;
}

/** LView의 추적을 중지합니다. */
export function unregisterLView(lView: LView): void {
  ngDevMode && assertNumber(lView[ID], 'ID가 없는 LView의 추적을 중지할 수 없습니다');
  TRACKED_LVIEWS.delete(lView[ID]);
}

/** 현재 추적되고 있는 뷰를 가져옵니다. */
export function getTrackedLViews(): ReadonlyMap<number, LView> {
  return TRACKED_LVIEWS;
}
