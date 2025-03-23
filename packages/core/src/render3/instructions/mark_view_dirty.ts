/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {NotificationSource} from '../../change_detection/scheduling/zoneless_scheduling';
import {isRootView} from '../interfaces/type_checks';
import {ENVIRONMENT, FLAGS, LView, LViewFlags} from '../interfaces/view';
import {isRefreshingViews} from '../state';
import {getLViewParent} from '../util/view_utils';

/**
 * 현재 뷰와 모든 조상을 더러움(dirty) 표시합니다.
 *
 * 뷰 트리를 더러운 것으로 표시할 때의 부산물로 루트 뷰를 반환하며,
 * markViewDirty()를 소비하는 메서드가 변경 감지를 쉽게 예약할 수 있도록 사용할 수 있습니다.
 * 그렇지 않으면 이러한 메서드는 루트 뷰를 가져오기 위해 추가로 뷰 트리를 위로 탐색해야 하고,
 * 이를 기반으로 예약할 수 있습니다.
 *
 * @param lView 더러운 상태로 표시할 시작 LView
 * @returns 루트 LView
 */
export function markViewDirty(lView: LView, source: NotificationSource): LView | null {
  const dirtyBitsToUse = isRefreshingViews()
    ? // 뷰를 적극적으로 새로 고치는 중일 때, 우리는 뷰를 체크하기 위해 오직 `Dirty` 비트만 사용할 뿐입니다.
      // 이 비트는 특정 뷰 집합(즉, `RefreshView` 플래그가 있는 뷰와 더러운 신호 소비자가 있는 뷰)에 대해
      // 동기적으로 변경 감지를 다시 실행하는 데 사용되는 ChangeDetectionMode.Targeted에서 무시됩니다.
      // `LViewFlags.Dirty`는 단독으로 재진입 변경 감지를 지원하지 않습니다.
      LViewFlags.Dirty
    : // 뷰 트리를 적극적으로 새로 고치지 않을 때, 상태를 업데이트하고 뷰를 더럽히는 것은 절대적으로
      // 타당합니다. 이 경우, 우리는 동기적으로 변경 감지를 다시 실행할 수 있도록 `RefreshView` 플래그를 사용합니다.
      // 이는 현재 렌더링 후 훅과 렌더링 팩토리가 플러시될 때 뷰 내에 변경 사항을 감지한 후 실행되는 애니메이션 리스너에 적용됩니다.
      LViewFlags.RefreshView | LViewFlags.Dirty;
  lView[ENVIRONMENT].changeDetectionScheduler?.notify(source);
  while (lView) {
    lView[FLAGS] |= dirtyBitsToUse;
    const parent = getLViewParent(lView);
    // 루트 뷰를 찾으면 즉시 탐색을 중단합니다. 루트 뷰는 어떤 컨테이너에도 연결되지 않았습니다.
    if (isRootView(lView) && !parent) {
      return lView;
    }
    // 그렇지 않으면 계속 진행
    lView = parent!;
  }
  return null;
}
