/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertDefined} from '../../util/assert';
import {assertLView} from '../assert';
import {readPatchedLView} from '../context_discovery';
import {LContainer} from '../interfaces/container';
import {isLContainer, isLView, isRootView} from '../interfaces/type_checks';
import {CHILD_HEAD, CONTEXT, LView, NEXT} from '../interfaces/view';

import {getLViewParent} from './view_utils';

/**
 * 부모 `LView`를 따라 걸어가서 루트 `LView`에 도달할 때까지 어떤 컴포넌트나 `LView`에서 루트 뷰를 검색합니다.
 *
 * @param componentOrLView 어떤 컴포넌트 또는 `LView`
 */
export function getRootView<T>(componentOrLView: LView | {}): LView<T> {
  ngDevMode && assertDefined(componentOrLView, 'component');
  let lView = isLView(componentOrLView) ? componentOrLView : readPatchedLView(componentOrLView)!;
  while (lView && !isRootView(lView)) {
    lView = getLViewParent(lView)!;
  }
  ngDevMode && assertLView(lView);
  return lView as LView<T>;
}

/**
 * 대상이 위치한 애플리케이션과 관련된 컨텍스트 정보를 반환합니다. 이는 루트 뷰에 도달할 때까지 부모 뷰를 따라 걸어간 후,
 * 그에서 컨텍스트를 가져오는 방식으로 수행됩니다.
 *
 * @param viewOrComponent 루트 컨텍스트를 가져오기 위한 `LView` 또는 컴포넌트.
 */
export function getRootContext<T>(viewOrComponent: LView<T> | {}): T {
  const rootView = getRootView(viewOrComponent);
  ngDevMode &&
    assertDefined(rootView[CONTEXT], 'Root view has no context. Perhaps it is disconnected?');
  return rootView[CONTEXT] as T;
}

/**
 * LView의 첫 번째 `LContainer`를 가져오고, 존재하지 않으면 `null`을 반환합니다.
 */
export function getFirstLContainer(lView: LView): LContainer | null {
  return getNearestLContainer(lView[CHILD_HEAD]);
}

/**
 * 주어진 컨테이너의 형제인 다음 `LContainer`를 가져옵니다.
 */
export function getNextLContainer(container: LContainer): LContainer | null {
  return getNearestLContainer(container[NEXT]);
}

function getNearestLContainer(viewOrContainer: LContainer | LView | null) {
  while (viewOrContainer !== null && !isLContainer(viewOrContainer)) {
    viewOrContainer = viewOrContainer[NEXT];
  }
  return viewOrContainer as LContainer | null;
}
