/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ComponentDef} from '../render3';
import {readPatchedLView} from '../render3/context_discovery';
import {isComponentHost, isLContainer, isLView} from '../render3/interfaces/type_checks';
import {HEADER_OFFSET, HOST, TVIEW} from '../render3/interfaces/view';
import {getTNode} from '../render3/util/view_utils';

/**
 * 노드에 가장 가까운 컴포넌트의 클래스 이름을 가져옵니다.
 * 경고! 이 함수는 컴포넌트의 이름이 축소된 경우 축소된 이름을 반환합니다.
 * 함수의 소비자는 축소된 이름을 원래 이름으로 해결해야 합니다.
 * @param node 검색을 시작할 노드.
 */
export function getClosestComponentName(node: Node): string | null {
  let currentNode = node as Node | null;

  while (currentNode) {
    const lView = readPatchedLView(currentNode);

    if (lView !== null) {
      for (let i = HEADER_OFFSET; i < lView.length; i++) {
        const current = lView[i];

        if ((!isLView(current) && !isLContainer(current)) || current[HOST] !== currentNode) {
          continue;
        }

        const tView = lView[TVIEW];
        const tNode = getTNode(tView, i);
        if (isComponentHost(tNode)) {
          const def = tView.data[tNode.directiveStart + tNode.componentOffset] as ComponentDef<{}>;
          const name = def.debugInfo?.className || def.type.name;

          // 참고: 클래스 이름이 축소로 인해 비어 있는 문자열일 수 있습니다.
          // 이러한 경우에는 계속 트리를 올라갑니다.
          if (name) {
            return name;
          } else {
            break;
          }
        }
      }
    }

    currentNode = currentNode.parentNode;
  }

  return null;
}
