/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {type Injector} from '../../di/injector';
import {assertGreaterThan, assertNotEqual, assertNumber} from '../../util/assert';
import {ChainedInjector} from '../chained_injector';
import {
  NO_PARENT_INJECTOR,
  RelativeInjectorLocation,
  RelativeInjectorLocationFlags,
} from '../interfaces/injector';
import {DECLARATION_VIEW, HEADER_OFFSET, LView} from '../interfaces/view';

/// 부모 Injector 유틸리티 ///////////////////////////////////////////////////////////////
export function hasParentInjector(parentLocation: RelativeInjectorLocation): boolean {
  return parentLocation !== NO_PARENT_INJECTOR;
}

export function getParentInjectorIndex(parentLocation: RelativeInjectorLocation): number {
  if (ngDevMode) {
    assertNumber(parentLocation, '숫자가 예상됩니다.');
    assertNotEqual(parentLocation as any, -1, '유효한 상태가 아닙니다.');
    const parentInjectorIndex = parentLocation & RelativeInjectorLocationFlags.InjectorIndexMask;

    assertGreaterThan(
      parentInjectorIndex,
      HEADER_OFFSET,
      '부모 injector는 HEADER_OFFSET을 초과해야 합니다.',
    );
  }
  return parentLocation & RelativeInjectorLocationFlags.InjectorIndexMask;
}

export function getParentInjectorViewOffset(parentLocation: RelativeInjectorLocation): number {
  return parentLocation >> RelativeInjectorLocationFlags.ViewOffsetShift;
}

/**
 * 부모 injector 위치 번호의 래핑을 해제하여 현재 injector로부터 보기 오프셋을 찾고,
 * 그런 다음 부모 injector를 포함하는 보기를 찾을 때까지 선언 보기 트리를 올라갑니다.
 *
 * @param location 부모 injector의 위치, 뷰 오프셋이 포함되어 있습니다.
 * @param startView 뷰 트리를 upward으로 탐색할 시작 LView 인스턴스
 * @returns 부모 injector를 포함하는 LView 인스턴스
 */
export function getParentInjectorView(location: RelativeInjectorLocation, startView: LView): LView {
  let viewOffset = getParentInjectorViewOffset(location);
  let parentView = startView;
  // 대부분의 경우 부모 injector는 호스트 노드에 있을 수 있지만(예: 컴포넌트나 컨테이너의 경우),
  // 부모 injector가 자식 injector 위에 여러 개의 뷰에 존재할 수 있는 희귀한 경우를 지원하기 위해 루프를 유지해야 합니다.
  while (viewOffset > 0) {
    parentView = parentView[DECLARATION_VIEW]!;
    viewOffset--;
  }
  return parentView;
}

/**
 * injector가 `ChainedInjector`의 인스턴스인지 감지합니다,
 * `OutletInjector`를 기반으로 생성됩니다.
 */
export function isRouterOutletInjector(currentInjector: Injector): boolean {
  return (
    currentInjector instanceof ChainedInjector &&
    typeof (currentInjector.injector as any).__ngOutletInjector === 'function'
  );
}
