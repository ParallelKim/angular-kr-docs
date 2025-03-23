/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../di/injector';
import type {ViewRef} from '../linker/view_ref';
import {getComponent} from '../render3/util/discovery_utils';
import {LContainer} from '../render3/interfaces/container';
import {getDocument} from '../render3/interfaces/document';
import {RElement, RNode} from '../render3/interfaces/renderer_dom';
import {isRootView} from '../render3/interfaces/type_checks';
import {HEADER_OFFSET, LView, TVIEW, TViewType} from '../render3/interfaces/view';
import {makeStateKey, TransferState} from '../transfer_state';
import {assertDefined, assertEqual} from '../util/assert';
import type {HydrationContext} from './annotate';

import {
  BlockSummary,
  CONTAINERS,
  DEFER_HYDRATE_TRIGGERS,
  DEFER_PARENT_BLOCK_ID,
  DehydratedView,
  DISCONNECTED_NODES,
  ELEMENT_CONTAINERS,
  MULTIPLIER,
  NUM_ROOT_NODES,
  SerializedContainerView,
  SerializedDeferBlock,
  SerializedTriggerDetails,
  SerializedView,
} from './interfaces';
import {IS_INCREMENTAL_HYDRATION_ENABLED, JSACTION_BLOCK_ELEMENT_MAP} from './tokens';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {DeferBlockTrigger, HydrateTriggerDetails} from '../defer/interfaces';
import {hoverEventNames, interactionEventNames} from '../defer/dom_triggers';
import {DEHYDRATED_BLOCK_REGISTRY} from '../defer/registry';
import {sharedMapFunction} from '../event_delegation_utils';

/**
 * 전이 상태 컬렉션에서 사용되는 키의 이름,
 * 여기서 수분 정보가 위치합니다.
 */
const TRANSFER_STATE_TOKEN_ID = '__nghData__';

/**
 * `TransferState`에서 DOM 수분 데이터(ngh)를 참조하는 데 사용되는 조회 키.
 */
export const NGH_DATA_KEY = makeStateKey<Array<SerializedView>>(TRANSFER_STATE_TOKEN_ID);

/**
 * 전이 상태 컬렉션에서 사용되는 키의 이름,
 * 여기서 직렬화된 지연 블록 정보가 위치합니다.
 */
export const TRANSFER_STATE_DEFER_BLOCKS_INFO = '__nghDeferData__';

/**
 * `TransferState`에서 지연 블록 데이터를 검색하는 데 사용되는 조회 키.
 */
export const NGH_DEFER_BLOCKS_KEY = makeStateKey<{[key: string]: SerializedDeferBlock}>(
  TRANSFER_STATE_DEFER_BLOCKS_INFO,
);

/**
 * 이 호스트 구성 요소 노드에 추가되는 속성의 이름
 * 전이 상태에 있는 특정 슬롯을 참조하고 이 구성 요소에 필요한 수분 정보가 포함됩니다.
 */
export const NGH_ATTR_NAME = 'ngh';

/**
 * 수분 콘텐츠 무결성을 보장하기 위해 주석 노드에서 사용되는 마커
 */
export const SSR_CONTENT_INTEGRITY_MARKER = 'nghm';

export const enum TextNodeMarker {
  /**
   * 서버에 의해 직렬화될 때 비어있는 경우
   * 추가된 텍스트 주석의 내용입니다. 비어 있는
   * 노드는 브라우저가 구문 분석할 때 잃어버립니다. 이 주석 노드는
   * 클라이언트에서 수분 처리 중에 손실된 비어 있는 텍스트
   * 노드를 복원하기 위해 교체됩니다.
   */
  EmptyNode = 'ngetn',

  /**
   * 인접한 텍스트 노드의 경우 추가된 텍스트 주석의 내용입니다.
   * 인접한 텍스트 노드가 서버에 의해 직렬화되어 클라이언트로 전송될 때,
   * 브라우저는 노드의 수에 대한 참조를 잃고 단지 하나의 텍스트 노드만 있을 것으로 가정합니다.
   * 이 구분자는 수분 처리 중에 교체되어
   * 존재해야 하는 텍스트 노드의 올바른 분리와 수량을 복원합니다.
   */
  Separator = 'ngtns',
}

/**
 * 주어진 RNode에서 `ngh` 속성 값을 읽고 그 값을
 * 인덱스로 사용하여 TransferState에서 수분 정보를 검색하는 함수에 대한 참조.
 * 수분이 활성화되지 않은 경우 기본적으로 `null`을 반환합니다.
 *
 * @param rNode 구성 요소의 호스트 요소.
 * @param injector 이 구성 요소가 액세스할 수 있는 주입기.
 * @param isRootView 루트 보기를 위한 수분 정보를 읽으려고 하는지 여부를 지정합니다.
 */
let _retrieveHydrationInfoImpl: typeof retrieveHydrationInfoImpl = () => null;

export function retrieveHydrationInfoImpl(
  rNode: RElement,
  injector: Injector,
  isRootView = false,
): DehydratedView | null {
  let nghAttrValue = rNode.getAttribute(NGH_ATTR_NAME);
  if (nghAttrValue == null) return null;

  // 루트 구성 요소가 ViewContainerRef의 앵커 노드로 작용하는 경우
  // (예를 들어, ViewContainerRef가 루트 구성 요소에 주입됨)에는
  // 구성 요소 자체에 대한 정보와 함께 이 ViewContainerRef를 나타내는 LContainer에 대한
  // 정보를 직렬화해야 합니다. 효과적으로, 두 개의 정보를 직렬화해야 합니다:
  // (1) 루트 구성 요소 자체에 대한 수분 정보 및 (2) ViewContainerRef 인스턴스에 대한 수분 정보 (LContainer).
  // 각 정보 조각은 수분 데이터 (TransferState 객체)에 개별적으로 포함되므로 2개의 id가 생깁니다.
  // 루트 요소가 1개만 있으므로 두 개의 정보를 단일 문자열로 인코딩합니다:
  // id는 `|` 문자로 구분됩니다 (예: `10|25`, 여기서 `10`은 구성 요소 뷰의 ngh
  //이고 `25`는 LContainer를 보유한 루트 뷰의 `ngh`입니다).
  const [componentViewNgh, rootViewNgh] = nghAttrValue.split('|');
  nghAttrValue = isRootView ? rootViewNgh : componentViewNgh;
  if (!nghAttrValue) return null;

  // 한 개의 ngh id를 읽었으므로 나머지 하나는 DOM 요소에 설정할 수 있도록 보관합니다.
  const rootNgh = rootViewNgh ? `|${rootViewNgh}` : '';
  const remainingNgh = isRootView ? componentViewNgh : rootNgh;

  let data: SerializedView = {};
  // 요소에 빈 `ngh` 속성 값이 있을 수 있습니다 (예: `<comp ngh="" />`),
  // 이는 특별한 주석이 필요하지 않음을 의미합니다. 이 경우
  // TransferState에서 읽으려고 하지 마십시오.
  if (nghAttrValue !== '') {
    const transferState = injector.get(TransferState, null, {optional: true});
    if (transferState !== null) {
      const nghData = transferState.get(NGH_DATA_KEY, []);

      // nghAttrValue는 수분 TransferState 데이터의 인덱스를 참조하는 숫자입니다.
      data = nghData[Number(nghAttrValue)];

      // `ngh` 속성이 존재하고 비어 있지 않은 값을 가지면,
      // TransferState에 수분 정보가 *반드시* 존재해야 합니다.
      // 어떤 이유로 데이터가 없으면, 이는 오류입니다.
      ngDevMode && assertDefined(data, 'TransferState에서 수분 정보를 검색할 수 없습니다.');
    }
  }
  const dehydratedView: DehydratedView = {
    data,
    firstChild: rNode.firstChild ?? null,
  };

  if (isRootView) {
    // 루트 뷰에 대한 수분 정보가 존재하면, 이는 루트 구성 요소에 ViewContainerRef가 주입되었음을 의미합니다.
    // 이 시나리오에서 루트 구성 요소 호스트 요소는 앵커 노드로 작용합니다.
    // 결과적으로, 이 ViewContainerRef에서 임베디드 뷰를 나타내는 DOM 노드는
    // 호스트 노드의 형제로 위치합니다, 즉 `<app-root /><#VIEW1><#VIEW2>...<!--container-->`.
    // 이 경우 현재 노드는 이 루트 뷰의 첫 번째 자식이 되고 다음 형제는 DOM 세그먼트의 첫 번째
    // 요소가 됩니다.
    dehydratedView.firstChild = rNode;

    // 우리는 여기서 `0`을 사용합니다. 이는 컴포넌트 LView 또는 LContainer가 루트 LView의 헤더 오프셋
    // 바로 다음 슬롯에 위치하는 곳입니다.
    setSegmentHead(dehydratedView, 0, rNode.nextSibling);
  }

  if (remainingNgh) {
    // 하나의 ngh id만 사용한 경우 나머지 하나를 이 RNode에 다시 저장합니다.
    rNode.setAttribute(NGH_ATTR_NAME, remainingNgh);
  } else {
    // 이제 모든 인덱스에 대한 데이터가 검색되었으므로
    // DOM 노드에서 `ngh` 속성이 지워집니다.
    rNode.removeAttribute(NGH_ATTR_NAME);
  }

  // 주의: 이 노드가 수분 처리를 위해 주장되었는지 확인하지 마세요,
  // 이 노드는 템플릿 지침을 처리하는 동안 이전에 주장될 수 있습니다.
  ngDevMode && markRNodeAsClaimedByHydration(rNode, /* checkIfAlreadyClaimed */ false);
  ngDevMode && ngDevMode.hydratedComponents++;

  return dehydratedView;
}

/**
 * `retrieveHydrationInfo` 함수에 대한 구현을 설정합니다.
 */
export function enableRetrieveHydrationInfoImpl() {
  _retrieveHydrationInfoImpl = retrieveHydrationInfoImpl;
}

/**
 * `ngh` 속성에서 값을 읽고 TransferState 저장소의 해당 슬롯에 액세스하여 수분 정보를 검색합니다.
 */
export function retrieveHydrationInfo(
  rNode: RElement,
  injector: Injector,
  isRootView = false,
): DehydratedView | null {
  return _retrieveHydrationInfoImpl(rNode, injector, isRootView);
}

/**
 * 직렬화할 필요가 있는 주어진 ViewRef에서 필요한 객체를 검색합니다:
 *  - 컴포넌트 뷰의 LView
 *  - 컴포넌트가 ViewContainerRef 앵커로 작용하는 경우의 LContainer
 *  - 임베디드 뷰의 경우 `null`
 */
export function getLNodeForHydration(viewRef: ViewRef): LView | LContainer | null {
  // `ViewRef` 인스턴스에서 내부 필드를 읽습니다.
  let lView = (viewRef as any)._lView as LView;
  const tView = lView[TVIEW];
  // 등록된 ViewRef는 임베디드 뷰의 인스턴스를 나타낼 수 있으며,
  // 이 경우 주석이 필요하지 않습니다.
  if (tView.type === TViewType.Embedded) {
    return null;
  }
  // 루트 뷰인지 확인하고, 그렇다면 헤더 다음 첫 슬롯에서
  // 구성 요소의 LView를 검색합니다.
  if (isRootView(lView)) {
    lView = lView[HEADER_OFFSET];
  }

  return lView;
}

function getTextNodeContent(node: Node): string | undefined {
  return node.textContent?.replace(/\s/gm, '');
}

/**
 * SSR 직렬화 중에 손실된 텍스트 노드와 구분 기호를 DOM으로 복원합니다.
 * 수분 프로세스는 빈 텍스트 노드와 다른 텍스트 노드에 즉시 인접한 텍스트
 * 노드를 주석 노드로 교체하여 이 메서드가 필터링하여
 * 수분 프로세스가 존재할 것으로 예상하는 누락된 노드를 복원합니다.
 *
 * @param node 애플리케이션의 루트 HTML 요소
 */
export function processTextNodeMarkersBeforeHydration(node: HTMLElement) {
  const doc = getDocument();
  const commentNodesIterator = doc.createNodeIterator(node, NodeFilter.SHOW_COMMENT, {
    acceptNode(node) {
      const content = getTextNodeContent(node);
      const isTextNodeMarker =
        content === TextNodeMarker.EmptyNode || content === TextNodeMarker.Separator;
      return isTextNodeMarker ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  let currentNode: Comment;
  // commentIterator를 사용하면서 DOM을 수정할 수 없습니다,
  // 왜냐하면 그것이 반복자 상태를 방해하기 때문입니다.
  // 그래서 우리는 모든 마커 노드를 먼저 수집한 다음
  // DOM에 변경 사항을 적용합니다: 빈 노드를 삽입하거나
  // 구분자로 사용된 경우 마커를 제거합니다.
  const nodes = [];
  while ((currentNode = commentNodesIterator.nextNode() as Comment)) {
    nodes.push(currentNode);
  }
  for (const node of nodes) {
    if (node.textContent === TextNodeMarker.EmptyNode) {
      node.replaceWith(doc.createTextNode(''));
    } else {
      node.remove();
    }
  }
}

/**
 * 주장을 받은 노드를 나타내는 내부 유형입니다.
 * 개발 모드에서만 사용됩니다.
 */
export enum HydrationStatus {
  Hydrated = 'hydrated',
  Skipped = 'skipped',
  Mismatched = 'mismatched',
}

export type HydrationInfo =
  | {
      status: HydrationStatus.Hydrated | HydrationStatus.Skipped;
    }
  | {
      status: HydrationStatus.Mismatched;
      actualNodeDetails: string | null;
      expectedNodeDetails: string | null;
    };

const HYDRATION_INFO_KEY = '__ngDebugHydrationInfo__';

export type HydratedNode = {
  [HYDRATION_INFO_KEY]?: HydrationInfo;
};

function patchHydrationInfo(node: RNode, info: HydrationInfo) {
  (node as HydratedNode)[HYDRATION_INFO_KEY] = info;
}

export function readHydrationInfo(node: RNode): HydrationInfo | null {
  return (node as HydratedNode)[HYDRATION_INFO_KEY] ?? null;
}

/**
 * 수분 처리 프로세스에서 "주장된" 노드로 표시합니다.
 * 이것은 테스트에서 수분 프로세스가 모든 노드를 처리했는지 평가하는 데 필요합니다.
 */
export function markRNodeAsClaimedByHydration(node: RNode, checkIfAlreadyClaimed = true) {
  if (!ngDevMode) {
    throw new Error(
      'prod 모드에서 `markRNodeAsClaimedByHydration`을 호출하는 것은 지원되지 않으며 ' +
        '실수일 가능성이 높습니다.',
    );
  }
  if (checkIfAlreadyClaimed && isRNodeClaimedForHydration(node)) {
    throw new Error('이미 주장된 노드를 주장하려고 했습니다.');
  }
  patchHydrationInfo(node, {status: HydrationStatus.Hydrated});
  ngDevMode.hydratedNodes++;
}

export function markRNodeAsSkippedByHydration(node: RNode) {
  if (!ngDevMode) {
    throw new Error(
      'prod 모드에서 `markRNodeAsSkippedByHydration`을 호출하는 것은 지원되지 않으며 ' +
        '실수일 가능성이 높습니다.',
    );
  }
  patchHydrationInfo(node, {status: HydrationStatus.Skipped});
  ngDevMode.componentsSkippedHydration++;
}

export function countBlocksSkippedByHydration(injector: Injector) {
  const transferState = injector.get(TransferState);
  const nghDeferData = transferState.get(NGH_DEFER_BLOCKS_KEY, {});
  if (ngDevMode) {
    ngDevMode.deferBlocksWithIncrementalHydration = Object.keys(nghDeferData).length;
  }
}

export function markRNodeAsHavingHydrationMismatch(
  node: RNode,
  expectedNodeDetails: string | null = null,
  actualNodeDetails: string | null = null,
) {
  if (!ngDevMode) {
    throw new Error(
      'prod 모드에서 `markRNodeAsMismatchedByHydration`을 호출하는 것은 지원되지 않으며 ' +
        '실수일 가능성이 높습니다.',
    );
  }

  // RNode는 표준 HTMLElement일 수 있습니다 (Angular 구성 요소 또는 지시문이 아님).
  // 개발 도구의 구성 요소 트리는 Angular 구성 요소와 지시문만 표시하므로
  // 가장 가까운 구성 요소/지시문에 디버그 정보를 연결합니다.
  while (node && !getComponent(node as Element)) {
    node = node?.parentNode as RNode;
  }

  if (node) {
    patchHydrationInfo(node, {
      status: HydrationStatus.Mismatched,
      expectedNodeDetails,
      actualNodeDetails,
    });
  }
}

export function isRNodeClaimedForHydration(node: RNode): boolean {
  return readHydrationInfo(node)?.status === HydrationStatus.Hydrated;
}

export function setSegmentHead(
  hydrationInfo: DehydratedView,
  index: number,
  node: RNode | null,
): void {
  hydrationInfo.segmentHeads ??= {};
  hydrationInfo.segmentHeads[index] = node;
}

export function getSegmentHead(hydrationInfo: DehydratedView, index: number): RNode | null {
  return hydrationInfo.segmentHeads?.[index] ?? null;
}

export function isIncrementalHydrationEnabled(injector: Injector): boolean {
  return injector.get(IS_INCREMENTAL_HYDRATION_ENABLED, false, {
    optional: true,
  });
}

/** 증가하는 수분이 구성되지 않은 경우 오류를 발생시킵니다. */
export function assertIncrementalHydrationIsConfigured(injector: Injector) {
  if (!isIncrementalHydrationEnabled(injector)) {
    throw new RuntimeError(
      RuntimeErrorCode.MISCONFIGURED_INCREMENTAL_HYDRATION,
      'Angular는 일부 `@defer` 블록이 `hydrate` 트리거를 사용하고 있지만, ' +
        '증가 수분이 활성화되지 않았음을 감지했습니다. ' +
        '`provideClientHydration()` 함수 호출에 대한 인수로 ' +
        '`withIncrementalHydration()` 호출이 추가되었는지 확인하십시오.',
    );
  }
}

/** LDeferBlockDetails에서 ssrUniqueId가 존재하지 않는 경우 오류를 발생시킵니다. */
export function assertSsrIdDefined(ssrUniqueId: unknown) {
  assertDefined(
    ssrUniqueId,
    '내부 오류: 수분 처리해야 하는 지연 블록에 대한 SSR id가 필요하지만, id가 존재하지 않습니다.',
  );
}

/**
 * <ng-container>의 크기를 반환합니다. `ELEMENT_CONTAINERS`에 직렬화된 정보
 * (요소 컨테이너 크기)를 사용하거나 주어진 컨테이너의 모든 탈수된 뷰의 루트 노드 수의 합계를 계산합니다
 * (이 `<ng-container>`가 뷰 컨테이너 호스트 노드로도 사용된 경우, 예: <ng-container *ngIf>).
 */
export function getNgContainerSize(hydrationInfo: DehydratedView, index: number): number | null {
  const data = hydrationInfo.data;
  let size = data[ELEMENT_CONTAINERS]?.[index] ?? null;
  // `ELEMENT_CONTAINERS` 슬롯에 직렬화된 정보가 없으면,
  // 이 위치에서 뷰 컨테이너에 대한 정보가 있는지 확인하고 (예:
  // `<ng-container *ngIf>`) 해당 요소 컨테이너의 루트 노드 수를 사용합니다.
  if (size === null && data[CONTAINERS]?.[index]) {
    size = calcSerializedContainerSize(hydrationInfo, index);
  }
  return size;
}

export function isSerializedElementContainer(
  hydrationInfo: DehydratedView,
  index: number,
): boolean {
  return hydrationInfo.data[ELEMENT_CONTAINERS]?.[index] !== undefined;
}

export function getSerializedContainerViews(
  hydrationInfo: DehydratedView,
  index: number,
): SerializedContainerView[] | null {
  return hydrationInfo.data[CONTAINERS]?.[index] ?? null;
}

/**
 * 직렬화된 컨테이너의 크기(루트 노드 수)를 계산합니다.
 * 이 컨테이너의 모든 탈수된 뷰에서 루트 노드의 합계를 계산하여 수행합니다.
 */
export function calcSerializedContainerSize(hydrationInfo: DehydratedView, index: number): number {
  const views = getSerializedContainerViews(hydrationInfo, index) ?? [];
  let numNodes = 0;
  for (let view of views) {
    numNodes += view[NUM_ROOT_NODES] * (view[MULTIPLIER] ?? 1);
  }
  return numNodes;
}

/**
 * 주어진 `DehydratedView`의 `disconnectedNodes` 필드를 초기화하려고 시도합니다.
 * 초기화된 값을 반환합니다.
 */
export function initDisconnectedNodes(hydrationInfo: DehydratedView): Set<number> | null {
  // 첫 번째로 분리된 정보를 처리하고 있는지 확인합니다.
  if (typeof hydrationInfo.disconnectedNodes === 'undefined') {
    const nodeIds = hydrationInfo.data[DISCONNECTED_NODES];
    hydrationInfo.disconnectedNodes = nodeIds ? new Set(nodeIds) : null;
  }
  return hydrationInfo.disconnectedNodes;
}

/**
 * 노드가 "분리됨"으로 주석이 달렸는지 여부를 확인합니다. 이는 직렬화 시
 * DOM에 존재하지 않음을 의미합니다. 우리는 이런 노드에 대해 수분 처리를 시도해서는 안되며,
 * 대신 일반 "생성 모드"를 사용해야 합니다.
 */
export function isDisconnectedNode(hydrationInfo: DehydratedView, index: number): boolean {
  // 첫 번째로 분리된 정보를 처리하고 있는지 확인합니다.
  if (typeof hydrationInfo.disconnectedNodes === 'undefined') {
    const nodeIds = hydrationInfo.data[DISCONNECTED_NODES];
    hydrationInfo.disconnectedNodes = nodeIds ? new Set(nodeIds) : null;
  }
  return !!initDisconnectedNodes(hydrationInfo)?.has(index);
}

/**
 * 직렬화를 위해 텍스트 노드를 준비하는 도우미 함수로, DOM의
 * 개별 논리 텍스트 블록이 직렬화 후에도 개별적으로 유지됩니다.
 */
export function processTextNodeBeforeSerialization(context: HydrationContext, node: RNode) {
  // DOM 직렬화 후 텍스트 노드가 손실될 수 있는 경우 처리:
  //  1. DOM에 *빈 텍스트 노드*가 있는 경우: 이 경우 이
  //     노드는 직렬화된 문자열에 포함되지 않아 결과적으로
  //     브라우저에서 이 노드가 생성되지 않습니다. 이로 인해
  //     수분 처리 중 불일치가 발생하고, 런타임 로직은
  //     라이브 DOM에 텍스트 노드가 존재할 것으로 예상하지만, 텍스트 노드는 존재하지 않습니다.
  //     예시: `<span>{{ name }}</span>`에서 `name`이 빈 문자열일 때.
  //     직렬화 후 `<span></span>` 문자열이 생성되고,
  //     브라우저에서는 오직 `span` 요소만 생성됩니다. 이를 해결하기 위해,
  //     빈 텍스트 노드 대신 추가 주석 노드를 추가하고
  //     이 특별한 주석 노드는 수분 처리 *전*에 빈 텍스트 노드로 교체됩니다.
  //  2. DOM에 두 개의 연속 텍스트 노드가 있는 경우.
  //     예시: `<div>Hello <ng-container *ngIf="true">world</ng-container></div>`.
  //     이 시나리오에서 라이브 DOM은 다음과 같습니다:
  //       <div>#text('Hello ') #text('world') #comment('container')</div>
  //     직렬화된 문자열은 다음과 같습니다: `<div>Hello world<!--container--></div>`.
  //     이후 브라우저의 라이브 DOM은 다음과 같습니다:
  //       <div>#text('Hello world') #comment('container')</div>
  //     마침내 두 텍스트 노드가 하나로 "병합"됩니다. 이는 수분 처리 로직이 실패하게 만들고,
  //     기대했던 2개의 텍스트 노드가 아닌 1개만 존재하게 됩니다.
  //     이를 수정하기 위해 우리는 이러한 텍스트 노드 사이에 특별한 주석 노드를 삽입하여,
  //     직렬화된 표현은 다음과 같습니다: `<div>Hello <!--ngtns-->world<!--container--></div>`.
  //     이는 브라우저에 두 개의 텍스트 노드를 주석 노드로 구분하여 생성하도록 강요합니다.
  //     수분 프로세스를 실행하기 전에 이 특별한 주석 노드는 제거되어,
  //     라이브 DOM은 직렬화 이전과 정확히 동일한 상태를 가집니다.

  // 이 노드는 내용이 비어있을 때만 필요한 특별한 주석으로 수집합니다.
  // 그렇지 않을 경우, 클라이언트에서는 서버 측 렌더링 후 이 텍스트 노드가 존재할 것이며,
  // 특별한 처리 필요 없습니다.
  const el = node as HTMLElement;
  const corruptedTextNodes = context.corruptedTextNodes;
  if (el.textContent === '') {
    corruptedTextNodes.set(el, TextNodeMarker.EmptyNode);
  } else if (el.nextSibling?.nodeType === Node.TEXT_NODE) {
    corruptedTextNodes.set(el, TextNodeMarker.Separator);
  }
}

export function convertHydrateTriggersToJsAction(
  triggers: Map<DeferBlockTrigger, HydrateTriggerDetails | null> | null,
): string[] {
  let actionList: string[] = [];
  if (triggers !== null) {
    if (triggers.has(DeferBlockTrigger.Hover)) {
      actionList.push(...hoverEventNames);
    }
    if (triggers.has(DeferBlockTrigger.Interaction)) {
      actionList.push(...interactionEventNames);
    }
  }
  return actionList;
}

/**
 * 수분 처리를 위한 블록의 큐를 빌드합니다. 나무를 위쪽으로 올라가서
 * 수분 처리가 되지 않았지만 레지스트리에 존재하는 가장 최상위 지연 블록을 찾습니다.
 * 이 큐는 지연 블록 id 목록으로 위에서 아래로 위계 정렬됩니다.
 * 주의: 이는 직렬화된 정보를 사용하여 나무를 탐색합니다.
 */
export function getParentBlockHydrationQueue(
  deferBlockId: string,
  injector: Injector,
): {parentBlockPromise: Promise<void> | null; hydrationQueue: string[]} {
  const dehydratedBlockRegistry = injector.get(DEHYDRATED_BLOCK_REGISTRY);
  const transferState = injector.get(TransferState);
  const deferBlockParents = transferState.get(NGH_DEFER_BLOCKS_KEY, {});

  let isTopMostDeferBlock = false;
  let currentBlockId: string | undefined = deferBlockId;
  let parentBlockPromise: Promise<void> | null = null;
  const hydrationQueue: string[] = [];

  while (!isTopMostDeferBlock && currentBlockId) {
    ngDevMode &&
      assertEqual(
        hydrationQueue.indexOf(currentBlockId),
        -1,
        '내부 오류: 지연 블록 계층에 사이클이 있습니다.',
      );

    isTopMostDeferBlock = dehydratedBlockRegistry.has(currentBlockId);
    const hydratingParentBlock = dehydratedBlockRegistry.hydrating.get(currentBlockId);
    if (parentBlockPromise === null && hydratingParentBlock != null) {
      parentBlockPromise = hydratingParentBlock.promise;
      break;
    }
    hydrationQueue.unshift(currentBlockId);
    currentBlockId = deferBlockParents[currentBlockId][DEFER_PARENT_BLOCK_ID];
  }
  return {parentBlockPromise, hydrationQueue};
}

function gatherDeferBlocksByJSActionAttribute(doc: Document): Set<HTMLElement> {
  const jsactionNodes = doc.body.querySelectorAll('[jsaction]');
  const blockMap = new Set<HTMLElement>();
  for (let node of jsactionNodes) {
    const attr = node.getAttribute('jsaction');
    const blockId = node.getAttribute('ngb');
    const eventTypes = [...hoverEventNames.join(':;'), ...interactionEventNames.join(':;')].join(
      '|',
    );
    if (attr?.match(eventTypes) && blockId !== null) {
      blockMap.add(node as HTMLElement);
    }
  }
  return blockMap;
}

export function appendDeferBlocksToJSActionMap(doc: Document, injector: Injector) {
  const blockMap = gatherDeferBlocksByJSActionAttribute(doc);
  for (let rNode of blockMap) {
    const jsActionMap = injector.get(JSACTION_BLOCK_ELEMENT_MAP);
    sharedMapFunction(rNode, jsActionMap);
  }
}

/**
 * TransferState에서 지연 블록 수분 정보를 검색합니다.
 *
 * @param injector 이 구성 요소가 액세스할 수 있는 주입기.
 */
let _retrieveDeferBlockDataImpl: typeof retrieveDeferBlockDataImpl = () => {
  return {};
};

export function retrieveDeferBlockDataImpl(injector: Injector): {
  [key: string]: SerializedDeferBlock;
} {
  const transferState = injector.get(TransferState, null, {optional: true});
  if (transferState !== null) {
    const nghDeferData = transferState.get(NGH_DEFER_BLOCKS_KEY, {});

    ngDevMode &&
      assertDefined(nghDeferData, 'TransferState에서 지연 블록 정보를 검색할 수 없습니다.');
    return nghDeferData;
  }

  return {};
}

/**
 * `retrieveDeferBlockData` 함수에 대한 구현을 설정합니다.
 */
export function enableRetrieveDeferBlockDataImpl() {
  _retrieveDeferBlockDataImpl = retrieveDeferBlockDataImpl;
}

/**
 * TransferState 저장소에서 지연 블록 데이터를 검색합니다.
 */
export function retrieveDeferBlockData(injector: Injector): {[key: string]: SerializedDeferBlock} {
  return _retrieveDeferBlockDataImpl(injector);
}

function isTimerTrigger(triggerInfo: DeferBlockTrigger | SerializedTriggerDetails): boolean {
  return typeof triggerInfo === 'object' && triggerInfo.trigger === DeferBlockTrigger.Timer;
}

function getHydrateTimerTrigger(blockData: SerializedDeferBlock): number | null {
  const trigger = blockData[DEFER_HYDRATE_TRIGGERS]?.find((t) => isTimerTrigger(t));
  return (trigger as SerializedTriggerDetails)?.delay ?? null;
}

function hasHydrateTrigger(blockData: SerializedDeferBlock, trigger: DeferBlockTrigger): boolean {
  return blockData[DEFER_HYDRATE_TRIGGERS]?.includes(trigger) ?? false;
}

/**
 * 특정 트리거를 올바르게 초기화하는 데 나중에 사용되는 주어진 직렬화된 지연 블록의 요약을 생성합니다.
 */
function createBlockSummary(blockInfo: SerializedDeferBlock): BlockSummary {
  return {
    data: blockInfo,
    hydrate: {
      idle: hasHydrateTrigger(blockInfo, DeferBlockTrigger.Idle),
      immediate: hasHydrateTrigger(blockInfo, DeferBlockTrigger.Immediate),
      timer: getHydrateTimerTrigger(blockInfo),
      viewport: hasHydrateTrigger(blockInfo, DeferBlockTrigger.Viewport),
    },
  };
}

/**
 * 전송 상태의 모든 지연 블록 데이터를 처리하고 요약의 맵을 생성합니다.
 */
export function processBlockData(injector: Injector): Map<string, BlockSummary> {
  const blockData = retrieveDeferBlockData(injector);
  let blockDetails = new Map<string, BlockSummary>();
  for (let blockId in blockData) {
    blockDetails.set(blockId, createBlockSummary(blockData[blockId]));
  }
  return blockDetails;
}

function isSsrContentsIntegrity(node: ChildNode | null): boolean {
  return (
    !!node &&
    node.nodeType === Node.COMMENT_NODE &&
    node.textContent?.trim() === SSR_CONTENT_INTEGRITY_MARKER
  );
}

function skipTextNodes(node: ChildNode | null): ChildNode | null {
  // 공백을 무시합니다. `<body>` 이전에는 공백이 아닌 텍스트 노드를 찾지 않아야 합니다.
  while (node && node.nodeType === Node.TEXT_NODE) {
    node = node.previousSibling;
  }
  return node;
}

/**
 * DOM에 특별한 마커가 포함되어 있는지 확인하여 SSR 시간에 추가되어
 * SSR이 완료된 후 SSR 내용 변환이 발생하지 않도록 합니다. 일반적으로 이는
 * CDN에 의해 발생하거나 빌드 프로세스 중 최적화로 댓글 노드가 제거됩니다.
 * 수분 처리 프로세스는 올바른 DOM 세그먼트를 찾기 위해 Angular가 생성한 댓글 노드가 필요합니다.
 * 이 특별한 마커가 *없으면* 오류를 발생시키고 수분 처리를 진행하지 마십시오,
 * 수분 처리가 정확하게 작동할 수 없기 때문입니다.
 *
 * 주의: 이 함수는 클라이언트에서만 호출되므로 DOM API를 사용하는 것이 안전합니다.
 */
export function verifySsrContentsIntegrity(doc: Document): void {
  for (const node of doc.body.childNodes) {
    if (isSsrContentsIntegrity(node)) {
      return;
    }
  }

  // HTML 파서가 마커를 <body> 태그 바로 앞에 이동했는지 확인합니다,
  // 예를 들어 body 태그가 암묵적이고 마크업에 존재하지 않았기 때문입니다. 암묵적 body
  // 태그가 앱의 루트 요소 내부의 공백/주석을 방해할 가능성은 낮습니다.

  // 케이스 1: 암묵적 body. 예시:
  //   <!doctype html><head><title>Hi</title></head><!--nghm--><app-root></app-root>
  const beforeBody = skipTextNodes(doc.body.previousSibling);
  if (isSsrContentsIntegrity(beforeBody)) {
    return;
  }

  // 케이스 2: 암묵적 body & head. 예시:
  //   <!doctype html><head><title>Hi</title><!--nghm--><app-root></app-root>
  let endOfHead = skipTextNodes(doc.head.lastChild);
  if (isSsrContentsIntegrity(endOfHead)) {
    return;
  }

  throw new RuntimeError(
    RuntimeErrorCode.MISSING_SSR_CONTENT_INTEGRITY_MARKER,
    typeof ngDevMode !== 'undefined' &&
      ngDevMode &&
      'Angular 수분 처리 로직이 이 페이지의 HTML 콘텐츠가 서버 측 렌더링 중에 생성된 후 수정되었음을 감지했습니다. 확인하십시오 ' +
        'HTML에서 주석 노드가 제거되지 않도록 하는 최적화가 활성화되어 있지 않은지 확인하십시오. Angular 수분 처리 ' +
        '서버에서 생성된 HTML, 공백 및 주석 노드를 포함합니다.',
  );
}
