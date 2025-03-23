/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {inject, Injector} from '../di';
import {isRootTemplateMessage} from '../render3/i18n/i18n_util';
import {createIcuIterator} from '../render3/instructions/i18n_icu_container_visitor';
import {I18nNode, I18nNodeKind, I18nPlaceholderType, TI18n, TIcu} from '../render3/interfaces/i18n';
import {isTNodeShape, TNode, TNodeType} from '../render3/interfaces/node';
import type {Renderer} from '../render3/interfaces/renderer';
import type {RNode} from '../render3/interfaces/renderer_dom';
import {HEADER_OFFSET, HYDRATION, LView, RENDERER, TView, TVIEW} from '../render3/interfaces/view';
import {getFirstNativeNode} from '../render3/node_manipulation';
import {nativeRemoveNode} from '../render3/dom_node_manipulation';
import {unwrapRNode} from '../render3/util/view_utils';
import {assertDefined, assertNotEqual} from '../util/assert';

import type {HydrationContext} from './annotate';
import {DehydratedIcuData, DehydratedView, I18N_DATA} from './interfaces';
import {isDisconnectedRNode, locateNextRNode, tryLocateRNodeByPath} from './node_lookup_utils';
import {isI18nInSkipHydrationBlock} from './skip_hydration';
import {IS_I18N_HYDRATION_ENABLED} from './tokens';
import {
  getNgContainerSize,
  initDisconnectedNodes,
  isDisconnectedNode,
  isSerializedElementContainer,
  processTextNodeBeforeSerialization,
} from './utils';

let _isI18nHydrationSupportEnabled = false;

let _prepareI18nBlockForHydrationImpl: typeof prepareI18nBlockForHydrationImpl = () => {
  // noop unless `enablePrepareI18nBlockForHydrationImpl` is invoked.
};

export function setIsI18nHydrationSupportEnabled(enabled: boolean) {
  _isI18nHydrationSupportEnabled = enabled;
}

export function isI18nHydrationSupportEnabled() {
  return _isI18nHydrationSupportEnabled;
}

/**
 * 주어진 뷰 및 명령 인덱스에 위치한 i18n 블록과 그 자식을 수분에 맞게 준비합니다.
 *
 * @param lView i18n 블록이 있는 lView
 * @param index lView에서 i18n 블록의 인덱스
 * @param parentTNode i18n 블록의 부모 TNode
 * @param subTemplateIndex 서브 템플릿 인덱스, 또는 메인 템플릿의 경우 -1
 */
export function prepareI18nBlockForHydration(
  lView: LView,
  index: number,
  parentTNode: TNode | null,
  subTemplateIndex: number,
): void {
  _prepareI18nBlockForHydrationImpl(lView, index, parentTNode, subTemplateIndex);
}

export function enablePrepareI18nBlockForHydrationImpl() {
  _prepareI18nBlockForHydrationImpl = prepareI18nBlockForHydrationImpl;
}

export function isI18nHydrationEnabled(injector?: Injector) {
  injector = injector ?? inject(Injector);
  return injector.get(IS_I18N_HYDRATION_ENABLED, false);
}

/**
 * 주어진 TView에서 i18n 블록의 자식인 모든 인덱스를 수집합니다.
 *
 * i18n 블록은 부모 TNode를 도입하지 않기 때문에, LView에서 어떤 인덱스가 번역되었는지를 결정하기 위해 필요합니다.
 */
export function getOrComputeI18nChildren(
  tView: TView,
  context: HydrationContext,
): Set<number> | null {
  let i18nChildren = context.i18nChildren.get(tView);
  if (i18nChildren === undefined) {
    i18nChildren = collectI18nChildren(tView);
    context.i18nChildren.set(tView, i18nChildren);
  }
  return i18nChildren;
}

function collectI18nChildren(tView: TView): Set<number> | null {
  const children = new Set<number>();

  function collectI18nViews(node: I18nNode) {
    children.add(node.index);

    switch (node.kind) {
      case I18nNodeKind.ELEMENT:
      case I18nNodeKind.PLACEHOLDER: {
        for (const childNode of node.children) {
          collectI18nViews(childNode);
        }
        break;
      }

      case I18nNodeKind.ICU: {
        for (const caseNodes of node.cases) {
          for (const caseNode of caseNodes) {
            collectI18nViews(caseNode);
          }
        }
        break;
      }
    }
  }

  // LView의 각 i18n 블록의 AST를 탐색하고 모든 명령 인덱스를 수집합니다.
  for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
    const tI18n = tView.data[i] as TI18n | undefined;
    if (!tI18n || !tI18n.ast) {
      continue;
    }

    for (const node of tI18n.ast) {
      collectI18nViews(node);
    }
  }

  return children.size === 0 ? null : children;
}

/**
 * i18n 블록 직렬화 결과 데이터.
 */
export interface SerializedI18nBlock {
  /**
   * i18n AST의 깊이 우선 탐색에서 활성 ICU 사례의 큐입니다.
   * 이를 클라이언트에 직렬화하여 수분 시 DOM 노드를 i18n 노드와 올바르게 연결합니다.
   */
  caseQueue: Array<number>;

  /**
   * DOM에서 분리된 노드의 lView 블록 내의 인덱스 집합입니다.
   * i18n에서는 콘텐츠 프로젝션을 사용할 때 이럴 수 있습니다.
   */
  disconnectedNodes: Set<number>;

  /**
   * lView의 블록에서 "분리된" 노드로 간주되는 인덱스 집합입니다.
   * 수분을 하려면 노드에 대한 경로를 직렬화해야 합니다.
   *
   * 노드는 RNode가 이전 i18n 노드의 RNode 바로 뒤에 존재하지 않을 때 분리된 것으로 간주됩니다.
   */
  disjointNodes: Set<number>;
}

/**
 * 주어진 뷰 및 명령 인덱스에 위치한 i18n 블록의 i18n 데이터를 직렬화하려고 시도합니다.
 *
 * @param lView i18n 블록이 있는 lView
 * @param index lView에서 i18n 블록의 인덱스
 * @param context 수분 컨텍스트
 * @returns i18n 데이터 또는 관련 데이터가 없으면 null
 */
export function trySerializeI18nBlock(
  lView: LView,
  index: number,
  context: HydrationContext,
): SerializedI18nBlock | null {
  if (!context.isI18nHydrationEnabled) {
    return null;
  }

  const tView = lView[TVIEW];
  const tI18n = tView.data[index] as TI18n | undefined;
  if (!tI18n || !tI18n.ast) {
    return null;
  }

  const parentTNode = tView.data[tI18n.parentTNodeIndex] as TNode;
  if (parentTNode && isI18nInSkipHydrationBlock(parentTNode)) {
    return null;
  }

  const serializedI18nBlock: SerializedI18nBlock = {
    caseQueue: [],
    disconnectedNodes: new Set(),
    disjointNodes: new Set(),
  };
  serializeI18nBlock(lView, serializedI18nBlock, context, tI18n.ast);

  return serializedI18nBlock.caseQueue.length === 0 &&
    serializedI18nBlock.disconnectedNodes.size === 0 &&
    serializedI18nBlock.disjointNodes.size === 0
    ? null
    : serializedI18nBlock;
}

function serializeI18nBlock(
  lView: LView,
  serializedI18nBlock: SerializedI18nBlock,
  context: HydrationContext,
  nodes: I18nNode[],
): Node | null {
  let prevRNode = null;
  for (const node of nodes) {
    const nextRNode = serializeI18nNode(lView, serializedI18nBlock, context, node);
    if (nextRNode) {
      if (isDisjointNode(prevRNode, nextRNode)) {
        serializedI18nBlock.disjointNodes.add(node.index - HEADER_OFFSET);
      }
      prevRNode = nextRNode;
    }
  }
  return prevRNode;
}

/**
 * 주어진 노드들이 "분리된" 노드인지 결정하는 헬퍼.
 *
 * i18n 수분 과정은 동시에 DOM과 i18n 노드를 탐색합니다.
 * 이전 i18n 노드의 형제 DOM 노드가 다음 i18n 노드의 첫 번째 노드로 예상됩니다.
 *
 * 콘텐츠 프로젝션의 경우, 항상 그런 것은 아닙니다. 이럴 경우 노드를 "분리된" 노드로 표시하여 경로를 직렬화하도록 합니다.
 */
function isDisjointNode(prevNode: Node | null, nextNode: Node) {
  return prevNode && prevNode.nextSibling !== nextNode;
}

/**
 * 주어진 i18n 노드를 직렬화를 위해 처리합니다.
 * 수분을 시작하기 위해 i18n 노드의 첫 번째 RNode를 반환합니다.
 */
function serializeI18nNode(
  lView: LView,
  serializedI18nBlock: SerializedI18nBlock,
  context: HydrationContext,
  node: I18nNode,
): Node | null {
  const maybeRNode = unwrapRNode(lView[node.index]!);
  if (!maybeRNode || isDisconnectedRNode(maybeRNode)) {
    serializedI18nBlock.disconnectedNodes.add(node.index - HEADER_OFFSET);
    return null;
  }

  const rNode = maybeRNode as Node;
  switch (node.kind) {
    case I18nNodeKind.TEXT: {
      processTextNodeBeforeSerialization(context, rNode);
      break;
    }

    case I18nNodeKind.ELEMENT:
    case I18nNodeKind.PLACEHOLDER: {
      serializeI18nBlock(lView, serializedI18nBlock, context, node.children);
      break;
    }

    case I18nNodeKind.ICU: {
      const currentCase = lView[node.currentCaseLViewIndex] as number | null;
      if (currentCase != null) {
        // i18n은 새로운 케이스로의 변경을 신호하기 위해 음수 값을 사용하므로
        // 올바른 값을 얻기 위해 반전해야 합니다.
        const caseIdx = currentCase < 0 ? ~currentCase : currentCase;
        serializedI18nBlock.caseQueue.push(caseIdx);
        serializeI18nBlock(lView, serializedI18nBlock, context, node.cases[caseIdx]);
      }
      break;
    }
  }

  return getFirstNativeNodeForI18nNode(lView, node) as Node | null;
}

/**
 * 주어진 i18n 노드를 수분하기 위해 시작하는 첫 번째 네이티브 노드를 가져오는 헬퍼 함수.
 */
function getFirstNativeNodeForI18nNode(lView: LView, node: I18nNode) {
  const tView = lView[TVIEW];
  const maybeTNode = tView.data[node.index];

  if (isTNodeShape(maybeTNode)) {
    // 노드가 실제 TNode에 의해 지원되는 경우 간단히 위임합니다.
    return getFirstNativeNode(lView, maybeTNode);
  } else if (node.kind === I18nNodeKind.ICU) {
    // 중첩된 ICU 컨테이너는 실제 TNode가 없으므로 이 경우 반복자를 사용하여
    // 첫 번째 자식을 찾을 수 있습니다.
    const icuIterator = createIcuIterator(maybeTNode as TIcu, lView);
    let rNode: RNode | null = icuIterator();

    // ICU 컨테이너에 노드가 없으면 ICU 앵커를 노드로 사용합니다.
    return rNode ?? unwrapRNode(lView[node.index]);
  } else {
    // 그렇지 않으면 노드는 ICU 컨테이너의 텍스트 또는 무시할 수 있는 요소이며
    // RNode를 직접 사용할 수 있습니다.
    return unwrapRNode(lView[node.index]) ?? null;
  }
}

/**
 * 수분 과정에서 사용할 수 있는 공유 데이터를 설명합니다.
 */
interface I18nHydrationContext {
  hydrationInfo: DehydratedView;
  lView: LView;
  i18nNodes: Map<number, RNode | null>;
  disconnectedNodes: Set<number>;
  caseQueue: number[];
  dehydratedIcuData: Map<number, DehydratedIcuData>;
}

/**
 * 현재 수분 상태를 설명합니다.
 */
interface I18nHydrationState {
  // 현재 노드
  currentNode: Node | null;

  /**
   * 트리가 연결되어야 하는지 여부.
   *
   * 수분 중에 현재 RNode가 있다고 예상되지만 그렇지 않은 경우가 발생할 수 있습니다.
   * 이러한 경우에도 적절한 다운스트림 오류 처리를 위해 LViews에 기대값을 전파해야 합니다.
   */
  isConnected: boolean;
}

function setCurrentNode(state: I18nHydrationState, node: Node | null) {
  state.currentNode = node;
}

/**
 * 주어진 AST 노드에 대한 수분 루트로 현재 RNode를 표시합니다.
 */
function appendI18nNodeToCollection(
  context: I18nHydrationContext,
  state: I18nHydrationState,
  astNode: I18nNode,
) {
  const noOffsetIndex = astNode.index - HEADER_OFFSET;
  const {disconnectedNodes} = context;
  const currentNode = state.currentNode;

  if (state.isConnected) {
    context.i18nNodes.set(noOffsetIndex, currentNode);

    // 노드가 연결되어야 하므로 찾은 여부에 관계없이 세트에 있지 않도록 합니다.
    disconnectedNodes.delete(noOffsetIndex);
  } else {
    disconnectedNodes.add(noOffsetIndex);
  }

  return currentNode;
}

/**
 * 수분 중 일부 형제 노드를 건너뜁니다.
 *
 * 참고: `siblingAfter` 대신 이 방법을 사용합니다. 때때로 null 노드가 있을 수 있기 때문입니다.
 * 그런 경우에는 다운스트림 오류 처리가 적절한 컨텍스트를 제공해야 합니다.
 */
function skipSiblingNodes(state: I18nHydrationState, skip: number) {
  let currentNode = state.currentNode;
  for (let i = 0; i < skip; i++) {
    if (!currentNode) {
      break;
    }
    currentNode = currentNode?.nextSibling ?? null;
  }
  return currentNode;
}

/**
 * 주어진 상태를 자녀 수분을 위한 새 상태로 나눕니다.
 */
function forkHydrationState(state: I18nHydrationState, nextNode: Node | null) {
  return {currentNode: nextNode, isConnected: state.isConnected};
}

function prepareI18nBlockForHydrationImpl(
  lView: LView,
  index: number,
  parentTNode: TNode | null,
  subTemplateIndex: number,
) {
  const hydrationInfo = lView[HYDRATION];
  if (!hydrationInfo) {
    return;
  }

  if (
    !isI18nHydrationSupportEnabled() ||
    (parentTNode &&
      (isI18nInSkipHydrationBlock(parentTNode) ||
        isDisconnectedNode(hydrationInfo, parentTNode.index - HEADER_OFFSET)))
  ) {
    return;
  }

  const tView = lView[TVIEW];
  const tI18n = tView.data[index] as TI18n;
  ngDevMode && assertDefined(tI18n, '수분 중에 주어진 TView 슬롯에 i18n 데이터가 있어야 함');

  function findHydrationRoot() {
    if (isRootTemplateMessage(subTemplateIndex)) {
      // 이곳은 i18n 블록의 루트입니다. 이 경우, 우리의 수분 루트는 부모 TNode가
      // DOM에서 어디에 위치하는가에 따라 달라집니다.
      ngDevMode && assertDefined(parentTNode, 'i18n 루트를 수분할 때 부모 TNode가 예상됨');
      const rootNode = locateNextRNode(hydrationInfo!, tView, lView, parentTNode!) as Node;

      // 이 i18n 블록이 <ng-container>에 연결되어 있다면 RNode로 직접 수분을 시작합니다.
      // 반면에, 물리적 DOM 요소를 가진 TNode의 경우 첫 번째 자식으로 재귀적으로 들어갑니다.
      return parentTNode!.type & TNodeType.ElementContainer ? rootNode : rootNode.firstChild;
    }

    // 이곳은 i18n 블록 내의 중첩 템플릿입니다. 이 경우, 전체 뷰가 번역되며,
    // 컨테이너 내의 탈수된 뷰의 일부입니다. 따라서 우리는 첫 번째 탈수된 자식으로 수분을 시작하면 됩니다.
    return hydrationInfo?.firstChild as Node;
  }

  const currentNode = findHydrationRoot();
  ngDevMode && assertDefined(currentNode, '수분 중에 루트 i18n 노드가 예상됨');

  const disconnectedNodes = initDisconnectedNodes(hydrationInfo) ?? new Set();
  const i18nNodes = (hydrationInfo.i18nNodes ??= new Map<number, RNode | null>());
  const caseQueue = hydrationInfo.data[I18N_DATA]?.[index - HEADER_OFFSET] ?? [];
  const dehydratedIcuData = (hydrationInfo.dehydratedIcuData ??= new Map<
    number,
    DehydratedIcuData
  >());

  collectI18nNodesFromDom(
    {hydrationInfo, lView, i18nNodes, disconnectedNodes, caseQueue, dehydratedIcuData},
    {currentNode, isConnected: true},
    tI18n.ast,
  );

  // 비활성 ICU 사례의 노드는 분리된 것으로 간주해야 합니다. 위에서 이를 추적합니다.
  // 이들은 (그리고 그렇게 되어서는 안 됩니다) 직렬화되며, 따라서 예상하는 값을
  // 탈수된 뷰에 다시 써야 합니다.
  hydrationInfo.disconnectedNodes = disconnectedNodes.size === 0 ? null : disconnectedNodes;
}

function collectI18nNodesFromDom(
  context: I18nHydrationContext,
  state: I18nHydrationState,
  nodeOrNodes: I18nNode | I18nNode[],
) {
  if (Array.isArray(nodeOrNodes)) {
    let nextState = state;
    for (const node of nodeOrNodes) {
      // 노드가 이전 RNode와 직접 연결되지 않는 경우 경로를 설정합니다.
      const targetNode = tryLocateRNodeByPath(
        context.hydrationInfo,
        context.lView,
        node.index - HEADER_OFFSET,
      );
      if (targetNode) {
        nextState = forkHydrationState(state, targetNode as Node);
      }
      collectI18nNodesFromDom(context, nextState, node);
    }
  } else {
    if (context.disconnectedNodes.has(nodeOrNodes.index - HEADER_OFFSET)) {
      // i18n 노드는 콘텐츠 프로젝션 등으로 인해 분리된 것으로 간주될 수 있습니다.
      // 그런 경우 이를 건너뛰어야 합니다.
      return;
    }

    switch (nodeOrNodes.kind) {
      case I18nNodeKind.TEXT: {
        // 수분을 위해 텍스트 노드를 확보합니다.
        const currentNode = appendI18nNodeToCollection(context, state, nodeOrNodes);
        setCurrentNode(state, currentNode?.nextSibling ?? null);
        break;
      }

      case I18nNodeKind.ELEMENT: {
        // 현재 요소의 자식으로 재귀적으로 들어갑니다...
        collectI18nNodesFromDom(
          context,
          forkHydrationState(state, state.currentNode?.firstChild ?? null),
          nodeOrNodes.children,
        );

        // 그리고 부모 요소 자체를 확보합니다.
        const currentNode = appendI18nNodeToCollection(context, state, nodeOrNodes);
        setCurrentNode(state, currentNode?.nextSibling ?? null);
        break;
      }

      case I18nNodeKind.PLACEHOLDER: {
        const noOffsetIndex = nodeOrNodes.index - HEADER_OFFSET;
        const {hydrationInfo} = context;
        const containerSize = getNgContainerSize(hydrationInfo, noOffsetIndex);

        switch (nodeOrNodes.type) {
          case I18nPlaceholderType.ELEMENT: {
            // 수분은 요소의 머리를 찾아야 합니다.
            const currentNode = appendI18nNodeToCollection(context, state, nodeOrNodes);

            // 첫 번째 패스를 수행하는 동안 TNode가 없을 수 있으므로,
            // 직렬화된 데이터를 사용하여 이것이 <ng-container>인지 결정합니다.
            if (isSerializedElementContainer(hydrationInfo, noOffsetIndex)) {
              // <ng-container>는 물리적 DOM 노드가 없으므로 형제에서 계속 수분해야 합니다.
              collectI18nNodesFromDom(context, state, nodeOrNodes.children);

              // 앵커 요소를 건너뜁니다. 이는 하류 컨테이너 수분에 의해 확보됩니다.
              const nextNode = skipSiblingNodes(state, 1);
              setCurrentNode(state, nextNode);
            } else {
              // 비컨테이너 요소는 DOM의 실제 노드를 나타내므로,
              // 자식으로 수분을 계속하고 노드를 확보해야 합니다.
              collectI18nNodesFromDom(
                context,
                forkHydrationState(state, state.currentNode?.firstChild ?? null),
                nodeOrNodes.children,
              );
              setCurrentNode(state, currentNode?.nextSibling ?? null);

              // 요소는 뷰 컨테이너의 앵커가 될 수 있으므로,
              // 이 노드 이후에 건너뛰어야 할 요소가 있을 수 있습니다.
              if (containerSize !== null) {
                // `+1`은 컨테이너의 모든 뷰 뒤에 있는 앵커 노드를 나타냅니다.
                const nextNode = skipSiblingNodes(state, containerSize + 1);
                setCurrentNode(state, nextNode);
              }
            }
            break;
          }

          case I18nPlaceholderType.SUBTEMPLATE: {
            ngDevMode &&
              assertNotEqual(containerSize, null, 'i18n 서브 템플릿 수분 중 컨테이너 크기 예상됨');

            // 수분은 템플릿의 머리를 찾아야 합니다.
            appendI18nNodeToCollection(context, state, nodeOrNodes);

            // 템플릿 자식과 앵커 노드를 모두 건너뜁니다.
            const nextNode = skipSiblingNodes(state, containerSize! + 1);
            setCurrentNode(state, nextNode);
            break;
          }
        }
        break;
      }

      case I18nNodeKind.ICU: {
        // 현재 노드가 연결되어 있다면, 큐에서 다음 사례를 팝해야 합니다.
        const selectedCase = state.isConnected ? context.caseQueue.shift()! : null;
        const childState = {currentNode: null, isConnected: false};

        // 우리는 각 사례를 탐색합니다. 비활성일지라도,
        // 분리된 노드를 올바르게 채우기 위함입니다.
        for (let i = 0; i < nodeOrNodes.cases.length; i++) {
          collectI18nNodesFromDom(
            context,
            i === selectedCase ? state : childState,
            nodeOrNodes.cases[i],
          );
        }

        if (selectedCase !== null) {
          // ICU는 분기 상태를 나타내며, 선택된 사례가 서버의 상태와 다를 수 있습니다.
          // 이 경우 원래 사례의 노드를 정리할 수 있어야 합니다.
          context.dehydratedIcuData.set(nodeOrNodes.index, {case: selectedCase, node: nodeOrNodes});
        }

        // 수분은 ICU 앵커 요소를 찾아야 합니다.
        const currentNode = appendI18nNodeToCollection(context, state, nodeOrNodes);
        setCurrentNode(state, currentNode?.nextSibling ?? null);
        break;
      }
    }
  }
}

let _claimDehydratedIcuCaseImpl: typeof claimDehydratedIcuCaseImpl = () => {
  // noop unless `enableClaimDehydratedIcuCaseImpl` is invoked
};

/**
 * 주어진 뷰의 인덱스에서 ICU 노드는 주장되며,
 * 해당 노드를 수분 가능하게 하고 삭제되지 않도록 합니다.
 */
export function claimDehydratedIcuCase(lView: LView, icuIndex: number, caseIndex: number) {
  _claimDehydratedIcuCaseImpl(lView, icuIndex, caseIndex);
}

export function enableClaimDehydratedIcuCaseImpl() {
  _claimDehydratedIcuCaseImpl = claimDehydratedIcuCaseImpl;
}

function claimDehydratedIcuCaseImpl(lView: LView, icuIndex: number, caseIndex: number) {
  const dehydratedIcuDataMap = lView[HYDRATION]?.dehydratedIcuData;
  if (dehydratedIcuDataMap) {
    const dehydratedIcuData = dehydratedIcuDataMap.get(icuIndex);
    if (dehydratedIcuData?.case === caseIndex) {
      // 우리가 주장하려는 사례가 탈수된 사례와 일치하면,
      // 이를 지워 "주장된" 것으로 표시합니다.
      dehydratedIcuDataMap.delete(icuIndex);
    }
  }
}

/**
 * 주어진 뷰와 관련된 모든 i18n 수분 데이터를 정리합니다.
 */
export function cleanupI18nHydrationData(lView: LView) {
  const hydrationInfo = lView[HYDRATION];
  if (hydrationInfo) {
    const {i18nNodes, dehydratedIcuData: dehydratedIcuDataMap} = hydrationInfo;
    if (i18nNodes && dehydratedIcuDataMap) {
      const renderer = lView[RENDERER];
      for (const dehydratedIcuData of dehydratedIcuDataMap.values()) {
        cleanupDehydratedIcuData(renderer, i18nNodes, dehydratedIcuData);
      }
    }

    hydrationInfo.i18nNodes = undefined;
    hydrationInfo.dehydratedIcuData = undefined;
  }
}

function cleanupDehydratedIcuData(
  renderer: Renderer,
  i18nNodes: Map<number, RNode | null>,
  dehydratedIcuData: DehydratedIcuData,
) {
  for (const node of dehydratedIcuData.node.cases[dehydratedIcuData.case]) {
    const rNode = i18nNodes.get(node.index - HEADER_OFFSET);
    if (rNode) {
      nativeRemoveNode(renderer, rNode, false);
    }
  }
}
