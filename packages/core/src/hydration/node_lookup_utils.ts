/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TNode, TNodeType} from '../render3/interfaces/node';
import {RElement, RNode} from '../render3/interfaces/renderer_dom';
import {
  DECLARATION_COMPONENT_VIEW,
  HEADER_OFFSET,
  HOST,
  LView,
  TView,
} from '../render3/interfaces/view';
import {getFirstNativeNode} from '../render3/node_manipulation';
import {ɵɵresolveBody} from '../render3/util/misc_utils';
import {renderStringify} from '../render3/util/stringify_utils';
import {getNativeByTNode, unwrapRNode} from '../render3/util/view_utils';
import {assertDefined, assertEqual} from '../util/assert';

import {compressNodeLocation, decompressNodeLocation} from './compression';
import {
  nodeNotFoundAtPathError,
  nodeNotFoundError,
  validateSiblingNodeExists,
} from './error_handling';
import {
  DehydratedView,
  NODE_NAVIGATION_STEP_FIRST_CHILD,
  NODE_NAVIGATION_STEP_NEXT_SIBLING,
  NodeNavigationStep,
  NODES,
  REFERENCE_NODE_BODY,
  REFERENCE_NODE_HOST,
} from './interfaces';
import {calcSerializedContainerSize, getSegmentHead} from './utils';

/** 현재 TNode가 <ng-container>의 첫 번째 노드인지 여부. */
function isFirstElementInNgContainer(tNode: TNode): boolean {
  return !tNode.prev && tNode.parent?.type === TNodeType.ElementContainer;
}

/** 인덱스 반환 (HEADER_OFFSET 제외). */
function getNoOffsetIndex(tNode: TNode): number {
  return tNode.index - HEADER_OFFSET;
}

/**
 * 주어진 노드가 존재하지만 DOM에서 분리되었는지 확인합니다.
 */
export function isDisconnectedNode(tNode: TNode, lView: LView) {
  return (
    !(tNode.type & (TNodeType.Projection | TNodeType.LetDeclaration)) &&
    !!lView[tNode.index] &&
    isDisconnectedRNode(unwrapRNode(lView[tNode.index]))
  );
}

/**
 * 주어진 노드가 존재하지만 DOM에서 분리되었는지 확인합니다.
 *
 * 참고: 현재는 DOM 에뮬레이션 레이어(도미노)에 이 정보가 제공된다는 사실을 활용합니다.
 * 장기 솔루션은 DOM 에뮬레이션에 의존하지 않으며, 이 정보를 계산하기 위해 내부 데이터 구조 및 상태만 사용해야 합니다.
 */
export function isDisconnectedRNode(rNode: RNode | null) {
  return !!rNode && !(rNode as Node).isConnected;
}

/**
 * 주어진 명령 인덱스에 해당하는 i18n 트리의 노드를 찾습니다.
 *
 * @param hydrationInfo 수화 주석 데이터
 * @param noOffsetIndex 명령 인덱스
 * @returns 인덱스에 해당하는 RNode
 */
export function locateI18nRNodeByIndex<T extends RNode>(
  hydrationInfo: DehydratedView,
  noOffsetIndex: number,
): T | null | undefined {
  const i18nNodes = hydrationInfo.i18nNodes;
  if (i18nNodes) {
    return i18nNodes.get(noOffsetIndex) as T | null | undefined;
  }
  return undefined;
}

/**
 * 경로로 RNode를 찾으려고 시도합니다.
 *
 * @param hydrationInfo 수화 주석 데이터
 * @param lView 현재 lView
 * @param noOffsetIndex 명령 인덱스
 * @returns 인덱스에 해당하는 RNode 또는 경로가 없으면 null
 */
export function tryLocateRNodeByPath(
  hydrationInfo: DehydratedView,
  lView: LView<unknown>,
  noOffsetIndex: number,
): RNode | null {
  const nodes = hydrationInfo.data[NODES];
  const path = nodes?.[noOffsetIndex];
  return path ? locateRNodeByPath(path, lView) : null;
}

/**
 * 주어진 TNode에 해당하는 DOM 트리에서 노드를 찾습니다.
 *
 * @param hydrationInfo 수화 주석 데이터
 * @param tView 현재 tView
 * @param lView 현재 lView
 * @param tNode 현재 tNode
 * @returns 주어진 tNode를 나타내는 RNode
 */
export function locateNextRNode<T extends RNode>(
  hydrationInfo: DehydratedView,
  tView: TView,
  lView: LView<unknown>,
  tNode: TNode,
): T | null {
  const noOffsetIndex = getNoOffsetIndex(tNode);
  let native = locateI18nRNodeByIndex(hydrationInfo, noOffsetIndex);

  if (native === undefined) {
    const nodes = hydrationInfo.data[NODES];
    if (nodes?.[noOffsetIndex]) {
      // 노드의 정확한 위치를 알고 있습니다.
      native = locateRNodeByPath(nodes[noOffsetIndex], lView);
    } else if (tView.firstChild === tNode) {
      // 이 뷰에서 첫 번째 노드를 생성하므로, 이 DOM 세그먼트에서 첫 번째 자식을 참조합니다.
      native = hydrationInfo.firstChild;
    } else {
      // 이전 형제 또는 부모 노드를 기반으로 노드를 찾습니다.
      const previousTNodeParent = tNode.prev === null;
      const previousTNode = (tNode.prev ?? tNode.parent)!;
      ngDevMode &&
        assertDefined(
          previousTNode,
          '예상치 못한 상태: 현재 TNode가 이전 노드 또는 부모 노드와 연결되어 있지 않습니다.',
        );
      if (isFirstElementInNgContainer(tNode)) {
        const noOffsetParentIndex = getNoOffsetIndex(tNode.parent!);
        native = getSegmentHead(hydrationInfo, noOffsetParentIndex);
      } else {
        let previousRElement = getNativeByTNode(previousTNode, lView);
        if (previousTNodeParent) {
          native = (previousRElement as RElement).firstChild;
        } else {
          // 이전 노드가 요소이지만 컨테이너 정보도 있는 경우,
          // 이는 `<div #vcrTarget>`와 같은 노드를 처리하고 있으며
          // DOM에서는 `<div></div>...<!--container-->`로 표시됩니다.
          // 이 경우, 이 요소 뒤에는 노드가 있으며
          // 우리가 찾고 있는 요소에 도달하기 위해 이들을 모두 건너뛰어야 합니다.
          const noOffsetPrevSiblingIndex = getNoOffsetIndex(previousTNode);
          const segmentHead = getSegmentHead(hydrationInfo, noOffsetPrevSiblingIndex);
          if (previousTNode.type === TNodeType.Element && segmentHead) {
            const numRootNodesToSkip = calcSerializedContainerSize(
              hydrationInfo,
              noOffsetPrevSiblingIndex,
            );
            // `+1`은 이 컨테이너의 모든 뷰 뒤에 있는 앵커 주석 노드를 나타냅니다.
            const nodesToSkip = numRootNodesToSkip + 1;
            // 이 세그먼트 뒤의 첫 번째 노드입니다.
            native = siblingAfter(nodesToSkip, segmentHead);
          } else {
            native = previousRElement.nextSibling;
          }
        }
      }
    }
  }
  return native as T;
}

/**
 * 지정된 수의 노드를 건너뛰고 그 뒤의 다음 형제 노드를 반환합니다.
 */
export function siblingAfter<T extends RNode>(skip: number, from: RNode): T | null {
  let currentNode = from;
  for (let i = 0; i < skip; i++) {
    ngDevMode && validateSiblingNodeExists(currentNode);
    currentNode = currentNode.nextSibling!;
  }
  return currentNode as T;
}

/**
 * 탐색 단계의 문자열 표현을 생성하는 도우미 함수
 * (`nextSibling` 및 `firstChild` 탐색 측면에서). 개발 모드에서 오류 메시지에 사용됩니다.
 */
function stringifyNavigationInstructions(instructions: (number | NodeNavigationStep)[]): string {
  const container = [];
  for (let i = 0; i < instructions.length; i += 2) {
    const step = instructions[i];
    const repeat = instructions[i + 1] as number;
    for (let r = 0; r < repeat; r++) {
      container.push(step === NODE_NAVIGATION_STEP_FIRST_CHILD ? 'firstChild' : 'nextSibling');
    }
  }
  return container.join('.');
}

/**
 * 시작점 노드(`from` 노드)에서 제공된 탐색 지침 집합(path 인수 내)을 사용하여 노드를 탐색하는 도우미 함수입니다.
 */
function navigateToNode(from: Node, instructions: (number | NodeNavigationStep)[]): RNode {
  let node = from;
  for (let i = 0; i < instructions.length; i += 2) {
    const step = instructions[i];
    const repeat = instructions[i + 1] as number;
    for (let r = 0; r < repeat; r++) {
      if (ngDevMode && !node) {
        throw nodeNotFoundAtPathError(from, stringifyNavigationInstructions(instructions));
      }
      switch (step) {
        case NODE_NAVIGATION_STEP_FIRST_CHILD:
          node = node.firstChild!;
          break;
        case NODE_NAVIGATION_STEP_NEXT_SIBLING:
          node = node.nextSibling!;
          break;
      }
    }
  }
  if (ngDevMode && !node) {
    throw nodeNotFoundAtPathError(from, stringifyNavigationInstructions(instructions));
  }
  return node as RNode;
}

/**
 * 탐색 지침 집합을 사용하여 RNode를 찾습니다.
 */
function locateRNodeByPath(path: string, lView: LView): RNode {
  const [referenceNode, ...navigationInstructions] = decompressNodeLocation(path);
  let ref: Element;
  if (referenceNode === REFERENCE_NODE_HOST) {
    ref = lView[DECLARATION_COMPONENT_VIEW][HOST] as unknown as Element;
  } else if (referenceNode === REFERENCE_NODE_BODY) {
    ref = ɵɵresolveBody(
      lView[DECLARATION_COMPONENT_VIEW][HOST] as RElement & {ownerDocument: Document},
    );
  } else {
    const parentElementId = Number(referenceNode);
    ref = unwrapRNode((lView as any)[parentElementId + HEADER_OFFSET]) as Element;
  }
  return navigateToNode(ref, navigationInstructions);
}

/**
 * 노드 `start`에서 노드 `finish`로 이동하기 위한 DOM 탐색 작업 목록을 생성합니다.
 *
 * 참고: 노드 `start`가 DOM 트리의 중위 순회에서 노드 `finish`보다 먼저 발생한다고 가정합니다.
 * 즉, 우리는 `.firstChild` 및 `.nextSibling` 작업만 사용하여 `start`에서 `finish`로 이동할 수 있어야 합니다.
 */
export function navigateBetween(start: Node, finish: Node): NodeNavigationStep[] | null {
  if (start === finish) {
    return [];
  } else if (start.parentElement == null || finish.parentElement == null) {
    return null;
  } else if (start.parentElement === finish.parentElement) {
    return navigateBetweenSiblings(start, finish);
  } else {
    // `finish`는 부모의 자식이므로 부모는 항상 자식을 가지고 있습니다.
    const parent = finish.parentElement!;

    const parentPath = navigateBetween(start, parent);
    const childPath = navigateBetween(parent.firstChild!, finish);
    if (!parentPath || !childPath) return null;

    return [
      // 먼저 `finish`의 부모로 이동
      ...parentPath,
      // 그런 다음 첫 번째 자식으로 이동합니다.
      NODE_NAVIGATION_STEP_FIRST_CHILD,
      // 마지막으로 해당 노드에서 `finish`로 이동합니다 (이미 그곳이라면 noop일 수 있습니다).
      ...childPath,
    ];
  }
}

/**
 * 2개의 형제 노드 사이의 경로를 계산합니다 (여러 개의 `NextSibling` 탐색을 생성합니다).
 * 주어진 노드 사이에 경로가 존재하지 않으면 `null`을 반환합니다.
 */
function navigateBetweenSiblings(start: Node, finish: Node): NodeNavigationStep[] | null {
  const nav: NodeNavigationStep[] = [];
  let node: Node | null = null;
  for (node = start; node != null && node !== finish; node = node.nextSibling) {
    nav.push(NODE_NAVIGATION_STEP_NEXT_SIBLING);
  }
  // 마지막에 `node`가 `null` 또는 `undefined`이면, `end` 노드를 찾지 못한 것을 의미하므로
  // `null`을 반환합니다 (이렇게 하면 직렬화 오류가 발생합니다).
  return node == null ? null : nav;
}

/**
 * `nextSibling` 및 `firstChild` 탐색 측면에서 2개의 노드 간의 경로를 계산합니다:
 * - `from` 노드는 알려진 노드이며, 탐색의 시작점으로 사용됩니다.
 *   (`fromNodeName` 인수는 노드의 문자열 표현입니다).
 * - `to` 노드는 런타임 로직이 탐색할 노드이며,
 *   이 함수에서 생성된 경로를 사용합니다.
 */
export function calcPathBetween(from: Node, to: Node, fromNodeName: string): string | null {
  const path = navigateBetween(from, to);
  return path === null ? null : compressNodeLocation(fromNodeName, path);
}

/**
 * 직렬화 시간에 호출됩니다 (서버에서) TNode에 대한 탐색 지침 세트를 생성해야 할 때.
 */
export function calcPathForNode(
  tNode: TNode,
  lView: LView,
  excludedParentNodes: Set<number> | null,
): string {
  let parentTNode = tNode.parent;
  let parentIndex: number | string;
  let parentRNode: RNode;
  let referenceNodeName: string;

  // DOM에서 분리된 모든 부모 노드를 건너뜁니다. 그런 노드는 앵커로 사용할 수 없습니다.
  //
  // 이는 콘텐츠 프로젝션 기반 사용 사례에서 발생할 수 있으며,
  // 요소의 콘텐츠가 프로젝션되고 사용될 때 부모 요소
  // 자체는 DOM에서 분리된 상태로 남아 있을 수 있습니다. 이 경우 우리는
  // DOM에 연결된 부모 요소를 찾아 앵커로 사용하려고 합니다.
  //
  // 또한 parent 노드는 제외해야 할 수 있습니다. 예를 들어,
  // i18n 블록에 속하기 때문에 다른 뷰에 대해 상대적이지 않은 경로가 필요합니다.
  while (
    parentTNode !== null &&
    (isDisconnectedNode(parentTNode, lView) || excludedParentNodes?.has(parentTNode.index))
  ) {
    parentTNode = parentTNode.parent;
  }

  if (parentTNode === null || !(parentTNode.type & TNodeType.AnyRNode)) {
    // 부모 TNode가 없거나 부모 TNode가 RNode를 나타내지 않는 경우
    // (즉, DOM 노드가 아님), 구성 요소 호스트 요소를 참조 노드로 사용합니다.
    parentIndex = referenceNodeName = REFERENCE_NODE_HOST;
    parentRNode = lView[DECLARATION_COMPONENT_VIEW][HOST]!;
  } else {
    // 부모 TNode를 참조 노드로 사용합니다.
    parentIndex = parentTNode.index;
    parentRNode = unwrapRNode(lView[parentIndex]);
    referenceNodeName = renderStringify(parentIndex - HEADER_OFFSET);
  }
  let rNode = unwrapRNode(lView[tNode.index]);
  if (tNode.type & (TNodeType.AnyContainer | TNodeType.Icu)) {
    // <ng-container> 노드의 경우, 앵커 주석 노드에 대한 참조를 직렬화하는 대신
    // 첫 번째 DOM 요소의 위치를 직렬화합니다. 컨테이너 크기(부분으로 직렬화됨
    // `ngh.containers`에 포함됨)와 쌍을 이루어 런타임에
    // 이 컨테이너의 노드를 수화할 수 있는 충분한 정보를 제공해야 합니다.
    const firstRNode = getFirstNativeNode(lView, tNode);

    // 컨테이너가 비어 있지 않으면 첫 번째 요소에 대한 참조를 사용하고,
    // 그렇지 않으면 rNode는 앵커 주석 노드를 가리키게 됩니다.
    if (firstRNode) {
      rNode = firstRNode;
    }
  }
  let path: string | null = calcPathBetween(parentRNode as Node, rNode as Node, referenceNodeName);
  if (path === null && parentRNode !== rNode) {
    // 호스트 노드 내의 요소 간 경로를 찾는 데 실패했습니다.
    // 대신 `document.body`에서 시작하는 요소에 대한 경로를 찾으려고 합니다.
    //
    // 중요 참고: 이 유형의 참조는 상대적으로 불안정합니다. Angular는
    // 런타임 로직이 탐색하는 페이지 부분을 제어할 수 없을 수 있습니다.
    // 이는 주로 "포털" 사용 사례(메뉴, 대화 상자 등)로 인해 필요합니다.
    // 노드는 호스트 노드 밖으로 콘텐츠 프로젝션(직접 DOM 조작 포함)됩니다.
    // 더 나은 솔루션은 "포털"과 함께 작업할 수 있는 API를 제공하는 것이며,
    // 그 시점에서 이 코드 경로는 필요하지 않게 됩니다.
    const body = (parentRNode as Node).ownerDocument!.body as Node;
    path = calcPathBetween(body, rNode as Node, REFERENCE_NODE_BODY);

    if (path === null) {
      // 경로가 여전히 비어 있으면 이 노드는 분리된 것으로 보이며
      // 수화 중에 찾을 수 없습니다.
      throw nodeNotFoundError(lView, tNode);
    }
  }
  return path!;
}

/**
 * 지연 블록을 참조하는 ngh 주석을 포함하는 모든 주석 노드를 수집합니다.
 */
export function gatherDeferBlocksCommentNodes(
  doc: Document,
  node: HTMLElement,
): Map<string, Comment> {
  const commentNodesIterator = doc.createNodeIterator(node, NodeFilter.SHOW_COMMENT, {acceptNode});
  let currentNode: Comment;

  const nodesByBlockId = new Map<string, Comment>();
  while ((currentNode = commentNodesIterator.nextNode() as Comment)) {
    const nghPattern = 'ngh=';
    const content = currentNode?.textContent;
    const nghIdx = content?.indexOf(nghPattern) ?? -1;
    if (nghIdx > -1) {
      const nghValue = content!.substring(nghIdx + nghPattern.length).trim();
      // 값이 예상 형식을 갖추었는지 확인합니다.
      ngDevMode &&
        assertEqual(
          nghValue.startsWith('d'),
          true,
          '주석 노드에서 잘못된 지연 블록 ID를 찾았습니다.',
        );
      nodesByBlockId.set(nghValue, currentNode);
    }
  }
  return nodesByBlockId;
}

function acceptNode(node: HTMLElement) {
  return node.textContent?.trimStart().startsWith('ngh=')
    ? NodeFilter.FILTER_ACCEPT
    : NodeFilter.FILTER_REJECT;
}
