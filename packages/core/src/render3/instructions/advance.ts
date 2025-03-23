/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {assertGreaterThan} from '../../util/assert';
import {assertIndexInDeclRange} from '../assert';
import {executeCheckHooks, executeInitAndCheckHooks} from '../hooks';
import {FLAGS, InitPhaseState, LView, LViewFlags, TVIEW, TView} from '../interfaces/view';
import {
  getLView,
  getSelectedIndex,
  getTView,
  isInCheckNoChangesMode,
  setSelectedIndex,
} from '../state';

/**
 * 나중에 바인딩 지시 사항을 위한 요소로 넘어감.
 *
 * {@link property}와 같은 지시 사항과 함께 사용되어, {@link element} 또는 {@link elementStart}와 같이
 * 지정된 인덱스를 가진 요소에 작용합니다.
 *
 * ```ts
 * (rf: RenderFlags, ctx: any) => {
 *   if (rf & 1) {
 *     text(0, 'Hello');
 *     text(1, 'Goodbye')
 *     element(2, 'div');
 *   }
 *   if (rf & 2) {
 *     advance(2); // <div>로 두 번 이동.
 *     property('title', 'test');
 *   }
 * }
 * ```
 * @param delta 앞으로 이동할 요소의 수입니다.
 *
 * @codeGenApi
 */
export function ɵɵadvance(delta: number = 1): void {
  ngDevMode && assertGreaterThan(delta, 0, '앞으로만 이동할 수 있습니다.');
  selectIndexInternal(
    getTView(),
    getLView(),
    getSelectedIndex() + delta,
    !!ngDevMode && isInCheckNoChangesMode(),
  );
}

export function selectIndexInternal(
  tView: TView,
  lView: LView,
  index: number,
  checkNoChangesMode: boolean,
) {
  ngDevMode && assertIndexInDeclRange(lView[TVIEW], index);

  // 현재까지 뷰에 추가된 요소의 초기 후크를 플러시합니다.
  // PERF WARNING: 이 코드를 별도의 함수로 추출하지 마세요, 벤치마크를 실행하지 않고
  if (!checkNoChangesMode) {
    const hooksInitPhaseCompleted =
      (lView[FLAGS] & LViewFlags.InitPhaseStateMask) === InitPhaseState.InitPhaseCompleted;
    if (hooksInitPhaseCompleted) {
      const preOrderCheckHooks = tView.preOrderCheckHooks;
      if (preOrderCheckHooks !== null) {
        executeCheckHooks(lView, preOrderCheckHooks, index);
      }
    } else {
      const preOrderHooks = tView.preOrderHooks;
      if (preOrderHooks !== null) {
        executeInitAndCheckHooks(lView, preOrderHooks, InitPhaseState.OnInitHooksToBeRun, index);
      }
    }
  }

  // 우리는 후크를 실행한 *후*에 선택된 인덱스를 설정해야 합니다,
  // 왜냐하면 후크가 다른 템플릿 함수의 실행을 유발하여
  // 선택된 인덱스를 업데이트할 수 있기 때문입니다. 선택된 인덱스는 전역 상태입니다.
  // 후크를 실행하기 *전*에 `setSelectedIndex`를 실행하면,
  // 어떤 경우에서 선택된 인덱스가 `ɵɵadvance` 지시를 떠날 때 변경될 수 있습니다.
  setSelectedIndex(index);
}
