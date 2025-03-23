/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ApplicationRef} from '../application/application_ref';
import {DehydratedDeferBlock} from '../defer/interfaces';
import {DehydratedBlockRegistry} from '../defer/registry';
import {
  CONTAINER_HEADER_OFFSET,
  DEHYDRATED_VIEWS,
  LContainer,
} from '../render3/interfaces/container';
import {Renderer} from '../render3/interfaces/renderer';
import {RNode} from '../render3/interfaces/renderer_dom';
import {isLContainer, isLView} from '../render3/interfaces/type_checks';
import {HEADER_OFFSET, HOST, LView, PARENT, RENDERER, TVIEW} from '../render3/interfaces/view';
import {nativeRemoveNode} from '../render3/dom_node_manipulation';

import {validateSiblingNodeExists} from './error_handling';
import {cleanupI18nHydrationData} from './i18n';
import {DEFER_BLOCK_ID, DehydratedContainerView, NUM_ROOT_NODES} from './interfaces';
import {getLNodeForHydration} from './utils';

/**
 * 주어진 LContainer에서 모든 탈수된 뷰를 제거합니다:
 * 내부 데이터 구조에서도 해당하며 해당 탈수된 뷰에 속하는
 * 대응하는 DOM 노드를 제거합니다.
 */
export function removeDehydratedViews(lContainer: LContainer) {
  const views = lContainer[DEHYDRATED_VIEWS] ?? [];
  const parentLView = lContainer[PARENT];
  const renderer = parentLView[RENDERER];
  const retainedViews = [];
  for (const view of views) {
    // `@defer` 블록의 내용은 정리하지 마십시오.
    // 이 내용의 정리는 주어진 블록이 트리거되고 탈수되었을 때 발생합니다.
    if (view.data[DEFER_BLOCK_ID] !== undefined) {
      retainedViews.push(view);
    } else {
      removeDehydratedView(view, renderer);
      ngDevMode && ngDevMode.dehydratedViewsRemoved++;
    }
  }
  // 더 이상의 처리가 필요 없음을 나타내기 위해 값을 배열로 재설정합니다.
  // 이 뷰 컨테이너에 대해 탈수된 뷰의 처리가 더 이상 필요하지 않습니다
  // `ViewContainerRef`가 나중에 생성되는 경우 다시 조회 프로세스를 트리거하지 않습니다.
  lContainer[DEHYDRATED_VIEWS] = retainedViews;
}

export function removeDehydratedViewList(deferBlock: DehydratedDeferBlock) {
  const {lContainer} = deferBlock;
  const dehydratedViews = lContainer[DEHYDRATED_VIEWS];
  if (dehydratedViews === null) return;
  const parentLView = lContainer[PARENT];
  const renderer = parentLView[RENDERER];
  for (const view of dehydratedViews) {
    removeDehydratedView(view, renderer);
    ngDevMode && ngDevMode.dehydratedViewsRemoved++;
  }
}

/**
 * 탈수된 뷰에서 모든 노드를 제거하는 도우미 함수.
 */
function removeDehydratedView(dehydratedView: DehydratedContainerView, renderer: Renderer) {
  let nodesRemoved = 0;
  let currentRNode = dehydratedView.firstChild;
  if (currentRNode) {
    const numNodes = dehydratedView.data[NUM_ROOT_NODES];
    while (nodesRemoved < numNodes) {
      ngDevMode && validateSiblingNodeExists(currentRNode);
      const nextSibling: RNode = currentRNode.nextSibling!;
      nativeRemoveNode(renderer, currentRNode, false);
      currentRNode = nextSibling;
      nodesRemoved++;
    }
  }
}

/**
 * 이 LContainer 내의 모든 뷰를 순회하며 각 뷰에 대해
 * 탈수된 뷰 정리 함수를 호출합니다.
 */
export function cleanupLContainer(lContainer: LContainer) {
  removeDehydratedViews(lContainer);

  // 호스트가 이 컨테이너가 구성 요소 노드에 있는 경우 LView일 수 있습니다.
  // 이 경우 further 정리를 위해 호스트 LView로 내려갑니다. 추가 정보는
  // LContainer[HOST] 문서도 참조하세요.
  const hostLView = lContainer[HOST];
  if (isLView(hostLView)) {
    cleanupLView(hostLView);
  }

  for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
    cleanupLView(lContainer[i] as LView);
  }
}

/**
 * 이 LView에 등록된 `LContainer`와 구성 요소를 순회하며
 * 각각에 대해 탈수된 뷰 정리 함수를 호출합니다.
 */
function cleanupLView(lView: LView) {
  cleanupI18nHydrationData(lView);

  const tView = lView[TVIEW];
  for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
    if (isLContainer(lView[i])) {
      const lContainer = lView[i];
      cleanupLContainer(lContainer);
    } else if (isLView(lView[i])) {
      // 이것은 구성 요소로, 재귀적으로 `cleanupLView`에 들어갑니다.
      cleanupLView(lView[i]);
    }
  }
}

/**
 * ApplicationRef에 등록된 모든 뷰를 순회하여
 * 모든 `LContainer`에서 모든 탈수된 뷰를 제거합니다.
 */
export function cleanupDehydratedViews(appRef: ApplicationRef) {
  const viewRefs = appRef._views;
  for (const viewRef of viewRefs) {
    const lNode = getLNodeForHydration(viewRef);
    // `lView`는 `ViewRef`가
    // 내장된 뷰(구성 요소 뷰가 아님)를 나타낼 경우 `null`일 수 있습니다.
    if (lNode !== null && lNode[HOST] !== null) {
      if (isLView(lNode)) {
        cleanupLView(lNode);
      } else {
        // 이 뷰 컨테이너 내의 모든 뷰를 정리합니다.
        cleanupLContainer(lNode);
      }
      ngDevMode && ngDevMode.dehydratedViewsCleanupRuns++;
    }
  }
}

/**
 * 점진적으로 탈수된 블록에 대한 탈수 후 정리 처리를 수행합니다.
 * 이로 인해 모든 jsaction 속성, 타이머, 옵저버,
 * 탈수된 뷰 및 컨테이너가 제거됩니다.
 */
export function cleanupHydratedDeferBlocks(
  deferBlock: DehydratedDeferBlock | null,
  hydratedBlocks: string[],
  registry: DehydratedBlockRegistry,
  appRef: ApplicationRef,
): void {
  if (deferBlock !== null) {
    registry.cleanup(hydratedBlocks);
    cleanupLContainer(deferBlock.lContainer);
    cleanupDehydratedViews(appRef);
  }
}
