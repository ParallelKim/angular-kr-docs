/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {CONTAINER_HEADER_OFFSET} from '../render3/interfaces/container';
import {TNode} from '../render3/interfaces/node';
import {isLContainer, isLView} from '../render3/interfaces/type_checks';
import {HEADER_OFFSET, LView, TVIEW} from '../render3/interfaces/view';

import {DehydratedDeferBlock, TDeferBlockDetails} from './interfaces';
import {getTDeferBlockDetails, isTDeferBlockDetails} from './utils';

/**
 * 테스트를 위한 Defer 블록 인스턴스.
 */
export interface DeferBlockDetails extends DehydratedDeferBlock {
  tDetails: TDeferBlockDetails;
}

/**
 * 주어진 LView에서 모든 Defer 블록을 검색합니다.
 *
 * @param lView Defer 블록이 있는 lView
 * @param deferBlocks Defer 블록 집계 배열
 */
export function getDeferBlocks(lView: LView, deferBlocks: DeferBlockDetails[]) {
  const tView = lView[TVIEW];
  for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
    if (isLContainer(lView[i])) {
      const lContainer = lView[i];
      // LContainer는 Defer 블록의 인스턴스를 나타낼 수 있으며,
      // 이 경우 결과로 저장합니다. 그렇지 않으면 LContainer 뷰를 계속 반복하며
      // Defer 블록을 찾습니다.
      const isLast = i === tView.bindingStartIndex - 1;
      if (!isLast) {
        const tNode = tView.data[i] as TNode;
        const tDetails = getTDeferBlockDetails(tView, tNode);
        if (isTDeferBlockDetails(tDetails)) {
          deferBlocks.push({lContainer, lView, tNode, tDetails});
          // 이 LContainer는 Defer 블록을 나타내므로
          // 이 반복을 종료하고 이 LContainer의 뷰를 검사하지 않습니다.
          continue;
        }
      }
      for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        getDeferBlocks(lContainer[i] as LView, deferBlocks);
      }
    } else if (isLView(lView[i])) {
      // 이것은 컴포넌트이며, `getDeferBlocks`를 재귀적으로 호출합니다.
      getDeferBlocks(lView[i], deferBlocks);
    }
  }
}
