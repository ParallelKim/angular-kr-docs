/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * @fileoverview
 *
 * 이 파일은 `TIcuContainerNode`와 관련된 코드가 템플릿에 ICU가 존재하는 경우에만 로드되도록
 * 하는 메커니즘을 제공합니다.
 */

import {TIcuContainerNode} from '../interfaces/node';
import {RNode} from '../interfaces/renderer_dom';
import {LView} from '../interfaces/view';

let _icuContainerIterate: (
  tIcuContainerNode: TIcuContainerNode,
  lView: LView,
) => () => RNode | null;

/**
 * 모든 `TIcuContainerNode` 루트 `RNode`를 방문할 수 있는 기능을 제공하는 반복자입니다.
 */
export function icuContainerIterate(
  tIcuContainerNode: TIcuContainerNode,
  lView: LView,
): () => RNode | null {
  return _icuContainerIterate(tIcuContainerNode, lView);
}

/**
 * `IcuContainerVisitor`의 구현이 존재하는지 확인합니다.
 *
 * 이 함수는 i18n 지시문이 ICU를 만날 때 호출됩니다. 목적은 번들러가 ICU 로직을 트리 쉐이크하고
 * ICU 지시문이 실행될 경우에만 로드하도록 허용하는 것입니다.
 */
export function ensureIcuContainerVisitorLoaded(
  loader: () => (tIcuContainerNode: TIcuContainerNode, lView: LView) => () => RNode | null,
) {
  if (_icuContainerIterate === undefined) {
    // 이 함수를 인라인하지 마십시오. 우리는 `ensureIcuContainerVisitorLoaded`를 가볍게 유지하고자 하므로,
    // 호출 지점에 인라인할 수 있습니다.
    _icuContainerIterate = loader();
  }
}
