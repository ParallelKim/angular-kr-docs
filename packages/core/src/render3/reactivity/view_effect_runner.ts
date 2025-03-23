/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {EFFECTS, FLAGS, type LView, LViewFlags} from '../interfaces/view';

export function runEffectsInView(view: LView): void {
  if (view[EFFECTS] === null) {
    return;
  }

  // 효과가 다른 효과를 더럽힐 수 있기 때문에, 더 이상 플러시할 것이 없을 때까지 반복문에서 플러시합니다.
  let tryFlushEffects = true;

  while (tryFlushEffects) {
    let foundDirtyEffect = false;
    for (const effect of view[EFFECTS]) {
      if (!effect.dirty) {
        continue;
      }
      foundDirtyEffect = true;

      // `runEffectsInView`는 변경 감지 중에 호출되며, 따라서 사용 가능할 경우 Angular 존에서 실행됩니다.
      if (effect.zone === null || Zone.current === effect.zone) {
        effect.run();
      } else {
        effect.zone.run(() => effect.run());
      }
    }

    // 계속 플러시해야 하는지 확인합니다. 더러운 효과를 찾지 못했다면, 다시 반복할 필요가 없습니다. 그렇지 않으면, 뷰가 다시 순회하도록 표시되었는지 확인합니다. 그렇다면 실행한 효과 중 하나가 또 다른 효과를 더럽힐 수 있습니다.
    tryFlushEffects = foundDirtyEffect && !!(view[FLAGS] & LViewFlags.HasChildViewsToRefresh);
  }
}
