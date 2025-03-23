/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertParentView} from './assert';
import {icuContainerIterate} from './i18n/i18n_tree_shaking';
import {CONTAINER_HEADER_OFFSET, LContainer, NATIVE} from './interfaces/container';
import {TIcuContainerNode, TNode, TNodeType} from './interfaces/node';
import {RNode} from './interfaces/renderer_dom';
import {isLContainer} from './interfaces/type_checks';
import {DECLARATION_COMPONENT_VIEW, HOST, LView, TVIEW, TView} from './interfaces/view';
import {assertTNodeType} from './node_assert';
import {getProjectionNodes} from './node_manipulation';
import {getLViewParent, unwrapRNode} from './util/view_utils';

export function collectNativeNodes(
  tView: TView,
  lView: LView,
  tNode: TNode | null,
  result: any[],
  isProjection: boolean = false,
): any[] {
  while (tNode !== null) {
    // let 선언은 해당 DOM 노드가 없으므로 건너뜁니다.
    if (tNode.type === TNodeType.LetDeclaration) {
      tNode = isProjection ? tNode.projectionNext : tNode.next;
      continue;
    }

    ngDevMode &&
      assertTNodeType(
        tNode,
        TNodeType.AnyRNode | TNodeType.AnyContainer | TNodeType.Projection | TNodeType.Icu,
      );

    const lNode = lView[tNode.index];
    if (lNode !== null) {
      result.push(unwrapRNode(lNode));
    }

    // 주어진 lNode는 원래 노드 또는 LContainer를 나타낼 수 있습니다 (ViewContainerRef의 호스트일 경우). LContainer를 찾으면 내부로 내려가서
    // 이 컨테이너의 뷰에서 루트 노드를 수집해야 합니다.
    if (isLContainer(lNode)) {
      collectNativeNodesInLContainer(lNode, result);
    }

    const tNodeType = tNode.type;
    if (tNodeType & TNodeType.ElementContainer) {
      collectNativeNodes(tView, lView, tNode.child, result);
    } else if (tNodeType & TNodeType.Icu) {
      const nextRNode = icuContainerIterate(tNode as TIcuContainerNode, lView);
      let rNode: RNode | null;
      while ((rNode = nextRNode())) {
        result.push(rNode);
      }
    } else if (tNodeType & TNodeType.Projection) {
      const nodesInSlot = getProjectionNodes(lView, tNode);
      if (Array.isArray(nodesInSlot)) {
        result.push(...nodesInSlot);
      } else {
        const parentView = getLViewParent(lView[DECLARATION_COMPONENT_VIEW])!;
        ngDevMode && assertParentView(parentView);
        collectNativeNodes(parentView[TVIEW], parentView, nodesInSlot, result, true);
      }
    }
    tNode = isProjection ? tNode.projectionNext : tNode.next;
  }

  return result;
}

/**
 * 주어진 LContainer의 모든 뷰에서 모든 루트 노드를 수집합니다.
 */
export function collectNativeNodesInLContainer(lContainer: LContainer, result: any[]) {
  for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
    const lViewInAContainer = lContainer[i];
    const lViewFirstChildTNode = lViewInAContainer[TVIEW].firstChild;
    if (lViewFirstChildTNode !== null) {
      collectNativeNodes(lViewInAContainer[TVIEW], lViewInAContainer, lViewFirstChildTNode, result);
    }
  }

  // LContainer가 생성될 때, 앵커(주석) 노드는:
  // - (1) ElementContainer(<ng-container>)의 경우 재사용됩니다.
  // - (2) 또는 새로운 주석 노드가 생성됩니다.
  // 첫 번째 경우, 앵커 주석 노드는 최종 리스트에 추가됩니다.
  // (collectNativeNodes 함수의 코드에서 확인할 수 있습니다
  // (result.push(unwrapRNode(lNode)) 라인 참조), 그러나 두 번째 경우는 추가 처리를 요구합니다:
  // 앵커 노드를 최종 리스트에 수동으로 추가해야 합니다. `view_container_ref.ts`의
  // createAnchorNode 함수에서 추가 정보를 참조하십시오.
  //
  // 첫 번째 경우, 같은 참조가 LContainer의 NATIVE 및 HOST 슬롯에 저장됩니다. 그렇지 않으면,
  // 이는 두 번째 경우이며 최종 리스트에 요소를 추가해야 합니다.
  if (lContainer[NATIVE] !== lContainer[HOST]) {
    result.push(lContainer[NATIVE]);
  }
}
