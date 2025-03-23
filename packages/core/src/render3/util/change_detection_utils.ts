/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {NotificationSource} from '../../change_detection/scheduling/zoneless_scheduling';
import {assertDefined} from '../../util/assert';
import {getComponentViewByInstance} from '../context_discovery';
import {detectChangesInternal} from '../instructions/change_detection';
import {markViewDirty} from '../instructions/mark_view_dirty';
import {FLAGS, LViewFlags} from '../interfaces/view';

import {getRootComponents} from './discovery_utils';

/**
 * OnPush 컴포넌트의 경우 체크를 위해 컴포넌트를 표시하고 이 컴포넌트가 속하는 애플리케이션에서
 * 동기 변경 감지를 수행합니다.
 *
 * @param component {@link /api/core/ChangeDetectorRef#markForCheck 체크를 위해 표시할 컴포넌트}
 *
 * @publicApi
 */
export function applyChanges(component: {}): void {
  ngDevMode && assertDefined(component, 'component');
  markViewDirty(getComponentViewByInstance(component), NotificationSource.DebugApplyChanges);
  getRootComponents(component).forEach((rootComponent) => detectChanges(rootComponent));
}

/**
 * 컴포넌트(및 가능하면 하위 컴포넌트)에서 동기 변경 감지를 수행합니다.
 *
 * 이 함수는 컴포넌트에서 동기식으로 변경 감지를 트리거합니다.
 *
 * @param component 변경 감지를 수행해야 하는 컴포넌트.
 */
function detectChanges(component: {}): void {
  const view = getComponentViewByInstance(component);
  view[FLAGS] |= LViewFlags.RefreshView;
  detectChangesInternal(view);
}
