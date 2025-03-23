/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {DeferBlockDetails, getDeferBlocks as getDeferBlocksInternal} from '../../defer/discovery';
import {
  DEFER_BLOCK_STATE,
  DeferBlockInternalState,
  DeferBlockState,
  DeferBlockTrigger,
  LDeferBlockDetails,
  LOADING_AFTER_SLOT,
  MINIMUM_SLOT,
  SSR_UNIQUE_ID,
  TDeferBlockDetails,
} from '../../defer/interfaces';
import {DEHYDRATED_BLOCK_REGISTRY, DehydratedBlockRegistry} from '../../defer/registry';
import {getLDeferBlockDetails} from '../../defer/utils';
import {assertLView} from '../assert';
import {collectNativeNodes} from '../collect_native_nodes';
import {getLContext} from '../context_discovery';
import {CONTAINER_HEADER_OFFSET} from '../interfaces/container';
import {INJECTOR, LView, TVIEW} from '../interfaces/view';
import {getNativeByTNode} from './view_utils';

/** `@defer` 블록에 대한 정보입니다. */
interface DeferBlockData {
  /** 블록의 현재 상태. */
  state: 'placeholder' | 'loading' | 'complete' | 'error' | 'initial';

  /** 블록의 수분 상태. */
  incrementalHydrationState: 'not-configured' | 'hydrated' | 'dehydrated';

  /** 블록에 연결된 `@error` 블록이 있는지 여부. */
  hasErrorBlock: boolean;

  /** 연결된 `@loading` 블록에 대한 정보. */
  loadingBlock: {
    /** 블록이 정의되어 있는지 여부. */
    exists: boolean;

    /** 블록을 보여줘야하는 최소 밀리초 수. */
    minimumTime: number | null;

    /** 블록을 보여줘야하는 시간. */
    afterTime: number | null;
  };

  /** 연결된 `@placeholder` 블록에 대한 정보. */
  placeholderBlock: {
    /** 블록이 정의되어 있는지 여부. */
    exists: boolean;

    /** 블록을 보여줘야하는 최소 시간. */
    minimumTime: number | null;
  };

  /** 블록의 트리거에 대한 문자열화된 버전. */
  triggers: string[];

  /** 현재 블록에서 보여지고 있는 루트 노드. */
  rootNodes: Node[];
}

/**
 * 지정된 DOM 노드 안에 존재하는 모든 `@defer` 블록을 가져옵니다.
 * @param node `@defer` 블록을 찾을 노드.
 *
 * @publicApi
 */
export function getDeferBlocks(node: Node): DeferBlockData[] {
  const results: DeferBlockData[] = [];
  const lView = getLContext(node)?.lView;

  if (lView) {
    findDeferBlocks(node, lView, results);
  }

  return results;
}

/**
 * 특정 노드와 뷰 안에 있는 모든 `@defer` 블록을 찾습니다.
 * @param node 블록을 검색할 노드.
 * @param lView 블록을 검색할 노드 내 뷰.
 * @param results 블록이 발견되면 추가할 배열.
 */
function findDeferBlocks(node: Node, lView: LView, results: DeferBlockData[]) {
  const registry = lView[INJECTOR].get(DEHYDRATED_BLOCK_REGISTRY, null, {optional: true});
  const blocks: DeferBlockDetails[] = [];
  getDeferBlocksInternal(lView, blocks);

  for (const details of blocks) {
    const native = getNativeByTNode(details.tNode, details.lView);
    const lDetails = getLDeferBlockDetails(details.lView, details.tNode);

    // `getLContext`에서 가져온 LView는 요소가 위치한 뷰일 수 있습니다.
    // 지정된 루트 노드 안에 있지 않은 지연 블록은 필터링합니다.
    if (!node.contains(native as Node)) {
      continue;
    }

    const tDetails = details.tDetails;
    const renderedLView = getRendererLView(details);
    const rootNodes: Node[] = [];

    if (renderedLView !== null) {
      collectNativeNodes(
        renderedLView[TVIEW],
        renderedLView,
        renderedLView[TVIEW].firstChild,
        rootNodes,
      );
    }

    const data: DeferBlockData = {
      state: stringifyState(lDetails[DEFER_BLOCK_STATE]),
      incrementalHydrationState: inferHydrationState(tDetails, lDetails, registry),
      hasErrorBlock: tDetails.errorTmplIndex !== null,
      loadingBlock: {
        exists: tDetails.loadingTmplIndex !== null,
        minimumTime: tDetails.loadingBlockConfig?.[MINIMUM_SLOT] ?? null,
        afterTime: tDetails.loadingBlockConfig?.[LOADING_AFTER_SLOT] ?? null,
      },
      placeholderBlock: {
        exists: tDetails.placeholderTmplIndex !== null,
        minimumTime: tDetails.placeholderBlockConfig?.[MINIMUM_SLOT] ?? null,
      },
      triggers: tDetails.debug?.triggers ? Array.from(tDetails.debug.triggers).sort() : [],
      rootNodes,
    };

    results.push(data);

    // `getDeferBlocks`는 중첩된 지연 블록을 해결하지 않으므로 수동으로 재귀해야합니다.
    if (renderedLView !== null) {
      findDeferBlocks(node, renderedLView, results);
    }
  }
}

/**
 * `DeferBlockState`를 문자열로 변환하여 열거형 형태보다 더 읽기 쉽게 만듭니다.
 *
 * @param lDetails 정보
 * @returns
 */
function stringifyState(state: DeferBlockState | DeferBlockInternalState): DeferBlockData['state'] {
  switch (state) {
    case DeferBlockState.Complete:
      return 'complete';
    case DeferBlockState.Loading:
      return 'loading';
    case DeferBlockState.Placeholder:
      return 'placeholder';
    case DeferBlockState.Error:
      return 'error';
    case DeferBlockInternalState.Initial:
      return 'initial';
    default:
      throw new Error(`인식되지 않는 상태 ${state}`);
  }
}

/**
 * 특정 지연 블록의 수분 상태를 추론합니다.
 * @param tDetails 정적 지연 블록 정보.
 * @param lDetails 인스턴스 지연 블록 정보.
 * @param registry 지연 블록의 수분을 조정하는 레지스트리.
 */
function inferHydrationState(
  tDetails: TDeferBlockDetails,
  lDetails: LDeferBlockDetails,
  registry: DehydratedBlockRegistry | null,
): DeferBlockData['incrementalHydrationState'] {
  if (
    registry === null ||
    lDetails[SSR_UNIQUE_ID] === null ||
    tDetails.hydrateTriggers === null ||
    tDetails.hydrateTriggers.has(DeferBlockTrigger.Never)
  ) {
    return 'not-configured';
  }
  return registry.has(lDetails[SSR_UNIQUE_ID]) ? 'dehydrated' : 'hydrated';
}

/**
 * 지연 블록에서 렌더링되는 현재 LView를 가져옵니다.
 * @param details 블록에 대한 인스턴스 정보.
 */
function getRendererLView(details: DeferBlockDetails): LView | null {
  // 지연 블록 컨테이너는 한 뷰만 포함할 수 있습니다.
  // 비어 있으면 아무 것도 렌더링되지 않았음을 의미합니다.
  if (details.lContainer.length <= CONTAINER_HEADER_OFFSET) {
    return null;
  }

  const lView = details.lContainer[CONTAINER_HEADER_OFFSET];
  ngDevMode && assertLView(lView);
  return lView;
}
