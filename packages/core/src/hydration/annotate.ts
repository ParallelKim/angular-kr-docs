/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ApplicationRef} from '../application/application_ref';
import {APP_ID} from '../application/application_tokens';
import {
  DEFER_BLOCK_STATE as CURRENT_DEFER_BLOCK_STATE,
  DeferBlockTrigger,
  HydrateTriggerDetails,
  TDeferBlockDetails,
} from '../defer/interfaces';
import {getLDeferBlockDetails, getTDeferBlockDetails, isDeferBlock} from '../defer/utils';
import {isDetachedByI18n} from '../i18n/utils';
import {ViewEncapsulation} from '../metadata';
import {Renderer2} from '../render';
import {assertTNode} from '../render3/assert';
import {collectNativeNodes, collectNativeNodesInLContainer} from '../render3/collect_native_nodes';
import {getComponentDef} from '../render3/def_getters';
import {CONTAINER_HEADER_OFFSET, LContainer} from '../render3/interfaces/container';
import {isLetDeclaration, isTNodeShape, TNode, TNodeType} from '../render3/interfaces/node';
import {RComment, RElement} from '../render3/interfaces/renderer_dom';
import {
  hasI18n,
  isComponentHost,
  isLContainer,
  isProjectionTNode,
  isRootView,
} from '../render3/interfaces/type_checks';
import {
  CONTEXT,
  HEADER_OFFSET,
  HOST,
  INJECTOR,
  LView,
  PARENT,
  RENDERER,
  TView,
  TVIEW,
  TViewType,
} from '../render3/interfaces/view';
import {unwrapLView, unwrapRNode} from '../render3/util/view_utils';
import {TransferState} from '../transfer_state';

import {
  unsupportedProjectionOfDomNodes,
  validateMatchingNode,
  validateNodeExists,
} from './error_handling';
import {collectDomEventsInfo} from './event_replay';
import {setJSActionAttributes} from '../event_delegation_utils';
import {
  getOrComputeI18nChildren,
  isI18nHydrationEnabled,
  isI18nHydrationSupportEnabled,
  trySerializeI18nBlock,
} from './i18n';
import {
  CONTAINERS,
  DEFER_BLOCK_ID,
  DEFER_BLOCK_STATE,
  DEFER_HYDRATE_TRIGGERS,
  DEFER_PARENT_BLOCK_ID,
  DISCONNECTED_NODES,
  ELEMENT_CONTAINERS,
  I18N_DATA,
  MULTIPLIER,
  NODES,
  NUM_ROOT_NODES,
  SerializedContainerView,
  SerializedDeferBlock,
  SerializedTriggerDetails,
  SerializedView,
  TEMPLATE_ID,
  TEMPLATES,
} from './interfaces';
import {calcPathForNode, isDisconnectedNode} from './node_lookup_utils';
import {isInSkipHydrationBlock, SKIP_HYDRATION_ATTR_NAME} from './skip_hydration';
import {EVENT_REPLAY_ENABLED_DEFAULT, IS_EVENT_REPLAY_ENABLED} from './tokens';
import {
  convertHydrateTriggersToJsAction,
  getLNodeForHydration,
  isIncrementalHydrationEnabled,
  NGH_ATTR_NAME,
  NGH_DATA_KEY,
  NGH_DEFER_BLOCKS_KEY,
  processTextNodeBeforeSerialization,
  TextNodeMarker,
} from './utils';
import {Injector} from '../di';

/**
 * 모든 직렬화된 뷰(`ngh` DOM 주석)를 추적하는 컬렉션으로,
 * 중복을 피하기 위해 사용됩니다. 중복 뷰를 추가하려고 하면
 * 컬렉션은 이전에 수집된 직렬화된 뷰의 인덱스를 반환합니다.
 * 이는 특정 페이지에 필요한 주석의 수를 줄입니다.
 */
class SerializedViewCollection {
  private views: SerializedView[] = [];
  private indexByContent = new Map<string, number>();

  add(serializedView: SerializedView): number {
    const viewAsString = JSON.stringify(serializedView);
    if (!this.indexByContent.has(viewAsString)) {
      const index = this.views.length;
      this.views.push(serializedView);
      this.indexByContent.set(viewAsString, index);
      return index;
    }
    return this.indexByContent.get(viewAsString)!;
  }

  getAll(): SerializedView[] {
    return this.views;
  }
}

/**
 * TViews에 대한 고유한 id를 생성하는 데 사용되는 글로벌 카운터입니다.
 * 직렬화 프로세스 중에 사용됩니다.
 */
let tViewSsrId = 0;

/**
 * 주어진 TView에 대한 고유한 id를 생성하고 이 id를 반환합니다.
 * id는 이 TView의 인스턴스에 저장되며 후속 호출에서 재사용됩니다.
 *
 * 이 id는 런타임에 탈수된 뷰를 고유하게 식별하고 가져오는 데 필요합니다.
 */
function getSsrId(tView: TView): string {
  if (!tView.ssrId) {
    tView.ssrId = `t${tViewSsrId++}`;
  }
  return tView.ssrId;
}

/**
 * 직렬화 프로세스 중에 사용 가능한 컨텍스트를 설명합니다.
 * 이 컨텍스트는 직렬화 중에 정보를 공유하고 수집하는 데 사용됩니다.
 */
export interface HydrationContext {
  serializedViewCollection: SerializedViewCollection;
  corruptedTextNodes: Map<HTMLElement, TextNodeMarker>;
  isI18nHydrationEnabled: boolean;
  isIncrementalHydrationEnabled: boolean;
  i18nChildren: Map<TView, Set<number> | null>;
  eventTypesToReplay: {regular: Set<string>; capture: Set<string>};
  shouldReplayEvents: boolean;
  appId: string; // `APP_ID`의 값
  deferBlocks: Map<string /* defer block id, e.g. `d0` */, SerializedDeferBlock>;
}

/**
 * 주어진 뷰에서 루트 노드의 수를 계산합니다
 * (tNode가 제공된 경우 주어진 컨테이너에서 자식 노드).
 */
function calcNumRootNodes(tView: TView, lView: LView, tNode: TNode | null): number {
  const rootNodes: unknown[] = [];
  collectNativeNodes(tView, lView, tNode, rootNodes);
  return rootNodes.length;
}

/**
 * 주어진 LContainer에 있는 모든 뷰에서 루트 노드의 수를 계산합니다.
 */
function calcNumRootNodesInLContainer(lContainer: LContainer): number {
  const rootNodes: unknown[] = [];
  collectNativeNodesInLContainer(lContainer, rootNodes);
  return rootNodes.length;
}

/**
 * 수화를 위해 루트 수준 컴포넌트의 LView에 주석을 추가합니다.
 * 추가 정보는 `annotateHostElementForHydration`를 참조하십시오.
 */
function annotateComponentLViewForHydration(
  lView: LView,
  context: HydrationContext,
  injector: Injector,
): number | null {
  const hostElement = lView[HOST];
  // 루트 요소는 `ngSkipHydration` 속성으로 주석이 추가될 수 있으며,
  // 직렬화 프로세스가 시작되기 전에 존재하는지 확인하십시오.
  if (hostElement && !(hostElement as HTMLElement).hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
    return annotateHostElementForHydration(hostElement as HTMLElement, lView, null, context);
  }
  return null;
}

/**
 * 수화를 위해 루트 수준 LContainer에 주석을 추가합니다.
 * 이는 루트 컴포넌트가 ViewContainerRef를 주입할 때 발생합니다.
 * 따라서 컴포넌트가 뷰 컨테이너의 앵커가 됩니다.
 * 이 함수는 컴포넌트 자체와 뷰 컨테이너의 모든 뷰를 직렬화합니다.
 */
function annotateLContainerForHydration(
  lContainer: LContainer,
  context: HydrationContext,
  injector: Injector,
) {
  const componentLView = unwrapLView(lContainer[HOST]) as LView<unknown>;

  // 루트 컴포넌트 자체를 직렬화합니다.
  const componentLViewNghIndex = annotateComponentLViewForHydration(
    componentLView,
    context,
    injector,
  );

  if (componentLViewNghIndex === null) {
    // 컴포넌트가 직렬화되지 않았습니다 (예: 수화가 `ngSkipHydration` 속성을 추가하여 건너뛰어졌거나
    // 이 컴포넌트가 템플릿에 i18n 블록을 사용하지만 `withI18nSupport()`가 추가되지 않았습니다)
    // 호스트 요소에 `ngh` 속성으로 주석을 추가하는 것을 피하십시오.
    return;
  }

  const hostElement = unwrapRNode(componentLView[HOST]!) as HTMLElement;

  // 이 뷰 컨테이너 내의 모든 뷰를 직렬화합니다.
  const rootLView = lContainer[PARENT];
  const rootLViewNghIndex = annotateHostElementForHydration(hostElement, rootLView, null, context);

  const renderer = componentLView[RENDERER] as Renderer2;

  // 루트 컴포넌트가 ViewContainerRef의 앵커 노드 역할을 할 때
  // (예를 들어 루트 컴포넌트에 ViewContainerRef가 주입된 경우) 컴포넌트 자체에 대한 정보를
  // 직렬화하고 이 ViewContainerRef를 나타내는 LContainer도 직렬화해야 합니다.
  // 효과적으로 두 개의 정보를 직렬화해야 합니다:
  // (1) 루트 컴포넌트 자체에 대한 수화 정보와 (2) ViewContainerRef 인스턴스에 대한 수화 정보 (LContainer).
  // 각 정보 조각은 수화 데이터(TransferState 객체)에 따로 포함되어 마침내 2개의 id가 생성됩니다.
  // 하나의 루트 요소만 있으므로, 두 정보를 하나의 문자열로 인코딩합니다:
  // id는 `|` 문자로 구분됩니다 (예: `10|25`, 여기서 `10`은 컴포넌트 뷰의 ngh이고
  // `25`는 LContainer를 포함하고 있는 루트 뷰의 ngh입니다).
  const finalIndex = `${componentLViewNghIndex}|${rootLViewNghIndex}`;
  renderer.setAttribute(hostElement, NGH_ATTR_NAME, finalIndex);
}

/**
 * 주어진 ApplicationRef에서 부트스트랩된 모든 컴포넌트에
 * 수화에 필요한 정보를 주석을 추가합니다.
 *
 * @param appRef ApplicationRef 인스턴스입니다.
 * @param doc 현재 Document 인스턴스에 대한 참조입니다.
 * @return 재생해야 하는 이벤트 유형
 */
export function annotateForHydration(appRef: ApplicationRef, doc: Document) {
  const injector = appRef.injector;
  const isI18nHydrationEnabledVal = isI18nHydrationEnabled(injector);
  const isIncrementalHydrationEnabledVal = isIncrementalHydrationEnabled(injector);
  const serializedViewCollection = new SerializedViewCollection();
  const corruptedTextNodes = new Map<HTMLElement, TextNodeMarker>();
  const viewRefs = appRef._views;
  const shouldReplayEvents = injector.get(IS_EVENT_REPLAY_ENABLED, EVENT_REPLAY_ENABLED_DEFAULT);
  const eventTypesToReplay = {
    regular: new Set<string>(),
    capture: new Set<string>(),
  };
  const deferBlocks = new Map<string, SerializedDeferBlock>();
  const appId = appRef.injector.get(APP_ID);
  for (const viewRef of viewRefs) {
    const lNode = getLNodeForHydration(viewRef);

    // `lView`가 `null`일 수 있으며, 이는 `ViewRef`가
    // 내장 뷰(컴포넌트 뷰가 아님)를 나타내는 경우입니다.
    if (lNode !== null) {
      const context: HydrationContext = {
        serializedViewCollection,
        corruptedTextNodes,
        isI18nHydrationEnabled: isI18nHydrationEnabledVal,
        isIncrementalHydrationEnabled: isIncrementalHydrationEnabledVal,
        i18nChildren: new Map(),
        eventTypesToReplay,
        shouldReplayEvents,
        appId,
        deferBlocks,
      };
      if (isLContainer(lNode)) {
        annotateLContainerForHydration(lNode, context, injector);
      } else {
        annotateComponentLViewForHydration(lNode, context, injector);
      }
      insertCorruptedTextNodeMarkers(corruptedTextNodes, doc);
    }
  }

  // 참고: 우리는 *항상* 수화 정보 키와 해당 값을
  // TransferState에 포함합니다. 직렬화된 뷰 목록이 비어 있더라도 말입니다.
  // 이는 서버 측 수화 논리가 올바르게 설정되고 활성화되었음을
  // 클라이언트에 알리기 위한 신호가 필요합니다.
  // 그렇지 않으면 클라이언트 수화가 전송 상태에서 키를 찾지 못하면 에러가 발생합니다.
  const serializedViews = serializedViewCollection.getAll();
  const transferState = injector.get(TransferState);
  transferState.set(NGH_DATA_KEY, serializedViews);

  if (deferBlocks.size > 0) {
    const blocks: {[key: string]: SerializedDeferBlock} = {};
    for (const [id, info] of deferBlocks.entries()) {
      blocks[id] = info;
    }
    transferState.set(NGH_DEFER_BLOCKS_KEY, blocks);
  }

  return eventTypesToReplay;
}

/**
 * lContainer 데이터를 SerializedView 객체 목록으로 직렬화합니다.
 * 이 객체는 이 lContainer 내의 뷰를 나타냅니다.
 *
 * @param lContainer 우리가 직렬화하는 lContainer
 * @param tNode 이 LContainer에 대한 정보를 포함하고 있는 TNode
 * @param lView 이 LContainer를 호스팅하는 LView
 * @param parentDeferBlockId 존재하는 경우 부모의 defer block id
 * @param context 수화 컨텍스트
 * @returns `SerializedView` 객체의 배열
 */
function serializeLContainer(
  lContainer: LContainer,
  tNode: TNode,
  lView: LView,
  parentDeferBlockId: string | null,
  context: HydrationContext,
): SerializedContainerView[] {
  const views: SerializedContainerView[] = [];
  let lastViewAsString = '';

  for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
    let childLView = lContainer[i] as LView;

    let template: string;
    let numRootNodes: number;
    let serializedView: SerializedContainerView | undefined;

    if (isRootView(childLView)) {
      // 이것이 루트 뷰인 경우, 기본 컴포넌트에 대한 LView를 가져옵니다.
      // 이 정보는 직렬화해야 할 뷰에 대한 정보입니다.
      childLView = childLView[HEADER_OFFSET];

      // 이 위치에 LContainer가 있으면, 이는
      // 호스트 요소가 ViewContainerRef 앵커로 사용되었음을 나타냅니다.
      // 이 경우 특별한 처리가 필요합니다.
      if (isLContainer(childLView)) {
        // 주어진 컨테이너의 모든 뷰에서 루트 노드의 수를 계산하고
        // 본질적으로 앵커 노드를 고려하여 1을 추가합니다.
        // 이 시나리오에서는 레이아웃이 다음과 같이 표시됩니다:
        // `<app-root /><#VIEW1><#VIEW2>...<!--container-->`
        // `+1`은 `<app-root />` 요소를 포착하기 위해 추가됩니다.
        numRootNodes = calcNumRootNodesInLContainer(childLView) + 1;

        annotateLContainerForHydration(childLView, context, lView[INJECTOR]);

        const componentLView = unwrapLView(childLView[HOST]) as LView<unknown>;

        serializedView = {
          [TEMPLATE_ID]: componentLView[TVIEW].ssrId!,
          [NUM_ROOT_NODES]: numRootNodes,
        };
      }
    }

    if (!serializedView) {
      const childTView = childLView[TVIEW];

      if (childTView.type === TViewType.Component) {
        template = childTView.ssrId!;

        // 이것은 컴포넌트 뷰이므로 1개의 루트 노드만 있습니다: 컴포넌트의 호스트 노드 자체입니다.
        numRootNodes = 1;
      } else {
        template = getSsrId(childTView);
        numRootNodes = calcNumRootNodes(childTView, childLView, childTView.firstChild);
      }

      serializedView = {
        [TEMPLATE_ID]: template,
        [NUM_ROOT_NODES]: numRootNodes,
      };

      let isHydrateNeverBlock = false;

      // 이것이 defer 블록인 경우, 추가 정보를 직렬화합니다.
      if (isDeferBlock(lView[TVIEW], tNode)) {
        const lDetails = getLDeferBlockDetails(lView, tNode);
        const tDetails = getTDeferBlockDetails(lView[TVIEW], tNode);

        if (context.isIncrementalHydrationEnabled && tDetails.hydrateTriggers !== null) {
          const deferBlockId = `d${context.deferBlocks.size}`;

          if (tDetails.hydrateTriggers.has(DeferBlockTrigger.Never)) {
            isHydrateNeverBlock = true;
          }

          let rootNodes: any[] = [];
          collectNativeNodesInLContainer(lContainer, rootNodes);

          // 정보 컨텍스트에 defer 블록을 추가합니다.
          const deferBlockInfo: SerializedDeferBlock = {
            [NUM_ROOT_NODES]: rootNodes.length,
            [DEFER_BLOCK_STATE]: lDetails[CURRENT_DEFER_BLOCK_STATE],
          };

          const serializedTriggers = serializeHydrateTriggers(tDetails.hydrateTriggers);
          if (serializedTriggers.length > 0) {
            deferBlockInfo[DEFER_HYDRATE_TRIGGERS] = serializedTriggers;
          }

          if (parentDeferBlockId !== null) {
            // 부모 id는 존재할 때만 직렬화합니다.
            deferBlockInfo[DEFER_PARENT_BLOCK_ID] = parentDeferBlockId;
          }

          context.deferBlocks.set(deferBlockId, deferBlockInfo);

          const node = unwrapRNode(lContainer);
          if (node !== undefined) {
            if ((node as Node).nodeType === Node.COMMENT_NODE) {
              annotateDeferBlockAnchorForHydration(node as RComment, deferBlockId);
            }
          } else {
            ngDevMode && validateNodeExists(node, childLView, tNode);
            ngDevMode &&
              validateMatchingNode(node, Node.COMMENT_NODE, null, childLView, tNode, true);

            annotateDeferBlockAnchorForHydration(node as RComment, deferBlockId);
          }

          if (!isHydrateNeverBlock) {
            // 수화 트리igers를 사용하는 루트 노드에 JSAction 속성을 추가합니다.
            annotateDeferBlockRootNodesWithJsAction(tDetails, rootNodes, deferBlockId, context);
          }

          // 현재 블록 id를 중첩 경로의 부모로 사용합니다.
          parentDeferBlockId = deferBlockId;

          // 뷰 객체에 추가 정보를 직렬화합니다.
          // TODO(incremental-hydration): 이 정보는 직렬화되어 다른 수준에서 포함되어야 합니다
          // (뷰 수준이 아닌).
          serializedView[DEFER_BLOCK_ID] = deferBlockId;
        }
        // DEFER_BLOCK_STATE는 수화의 조정에 사용되며, 일반 및 점진적 모두에서 사용됩니다.
        // 수화될 때 어떤 템플릿이 렌더링되었는지 알아야 합니다. 따라서 이 상태를 직렬화합니다.
        // 수화 유형에 상관없이.
        serializedView[DEFER_BLOCK_STATE] = lDetails[CURRENT_DEFER_BLOCK_STATE];
      }

      if (!isHydrateNeverBlock) {
        Object.assign(
          serializedView,
          serializeLView(lContainer[i] as LView, parentDeferBlockId, context),
        );
      }
    }

    // 이전 뷰가 동일한 형태인지 확인합니다 (예: *ngFor에 의해 생성된 경우),
    // 그 경우 이전 뷰에서 카운터를 증가시키고 같은 정보를 다시 포함시키지 않습니다.
    const currentViewAsString = JSON.stringify(serializedView);
    if (views.length > 0 && currentViewAsString === lastViewAsString) {
      const previousView = views[views.length - 1];
      previousView[MULTIPLIER] ??= 1;
      previousView[MULTIPLIER]++;
    } else {
      // 이 뷰를 가장 최근에 추가된 것으로 기록합니다.
      lastViewAsString = currentViewAsString;
      views.push(serializedView);
    }
  }
  return views;
}

function serializeHydrateTriggers(
  triggerMap: Map<DeferBlockTrigger, HydrateTriggerDetails | null>,
): (DeferBlockTrigger | SerializedTriggerDetails)[] {
  const serializableDeferBlockTrigger = new Set<DeferBlockTrigger>([
    DeferBlockTrigger.Idle,
    DeferBlockTrigger.Immediate,
    DeferBlockTrigger.Viewport,
    DeferBlockTrigger.Timer,
  ]);
  let triggers: (DeferBlockTrigger | SerializedTriggerDetails)[] = [];
  for (let [trigger, details] of triggerMap) {
    if (serializableDeferBlockTrigger.has(trigger)) {
      if (details === null) {
        triggers.push(trigger);
      } else {
        triggers.push({trigger, delay: details.delay});
      }
    }
  }
  return triggers;
}

/**
 * 노드 경로를 생성하는 도우미 함수입니다.
 * 이 경로는 런타임 로직이 노드를 찾기 위해 취해야 하는 탐색 단계를 나타냅니다.
 * 현재 직렬화된 뷰의 `NODES` 섹션에 저장합니다.
 */
function appendSerializedNodePath(
  ngh: SerializedView,
  tNode: TNode,
  lView: LView,
  excludedParentNodes: Set<number> | null,
) {
  const noOffsetIndex = tNode.index - HEADER_OFFSET;
  ngh[NODES] ??= {};
  // 경로를 여러 번 계산하지 않도록 합니다.
  ngh[NODES][noOffsetIndex] ??= calcPathForNode(tNode, lView, excludedParentNodes);
}

/**
 * 분리된 노드에 대한 정보를 추가하는 도우미 함수입니다.
 * 런타임에서는 이 요소에 대한 DOM 조회를 피하기 위해
 * 이러한 정보를 필요로 하며 대신 요소를 처음부터 생성해야 합니다.
 */
function appendDisconnectedNodeIndex(ngh: SerializedView, tNodeOrNoOffsetIndex: TNode | number) {
  const noOffsetIndex =
    typeof tNodeOrNoOffsetIndex === 'number'
      ? tNodeOrNoOffsetIndex
      : tNodeOrNoOffsetIndex.index - HEADER_OFFSET;
  ngh[DISCONNECTED_NODES] ??= [];
  if (!ngh[DISCONNECTED_NODES].includes(noOffsetIndex)) {
    ngh[DISCONNECTED_NODES].push(noOffsetIndex);
  }
}

/**
 * lView 데이터를 SerializedView 객체로 직렬화합니다.
 * 이 객체는 나중에 TransferState 저장소에 추가되어 호스트에서 `ngh` 속성을 통해 참조됩니다.
 *
 * @param lView 우리가 직렬화하는 lView
 * @param context 수화 컨텍스트
 * @returns 호스트 노드에 추가될 데이터가 포함된 `SerializedView` 객체
 */
function serializeLView(
  lView: LView,
  parentDeferBlockId: string | null = null,
  context: HydrationContext,
): SerializedView {
  const ngh: SerializedView = {};
  const tView = lView[TVIEW];
  const i18nChildren = getOrComputeI18nChildren(tView, context);
  const nativeElementsToEventTypes = context.shouldReplayEvents
    ? collectDomEventsInfo(tView, lView, context.eventTypesToReplay)
    : null;
  // LView의 DOM 요소 참조를 반복합니다.
  for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
    const tNode = tView.data[i];
    const noOffsetIndex = i - HEADER_OFFSET;

    // 주어진 슬롯에 대한 모든 i18n 데이터를 직렬화하려고 시도합니다.
    // 먼저 이를 수행하는 이유는 i18n이 직렬화에 대한 자체 프로세스를 갖고 있기 때문입니다.
    const i18nData = trySerializeI18nBlock(lView, i, context);
    if (i18nData) {
      ngh[I18N_DATA] ??= {};
      ngh[I18N_DATA][noOffsetIndex] = i18nData.caseQueue;

      for (const nodeNoOffsetIndex of i18nData.disconnectedNodes) {
        appendDisconnectedNodeIndex(ngh, nodeNoOffsetIndex);
      }

      for (const nodeNoOffsetIndex of i18nData.disjointNodes) {
        const tNode = tView.data[nodeNoOffsetIndex + HEADER_OFFSET] as TNode;
        ngDevMode && assertTNode(tNode);
        appendSerializedNodePath(ngh, tNode, lView, i18nChildren);
      }

      continue;
    }

    // 주어진 슬롯의 처리를 건너뛰는 경우:
    // - 지역 참조 (예: <div #localRef>)는 동일한 요소를 저장하기 위해
    //   LViews에서 추가 슬롯을 차지합니다. 이 경우, TNode 데이터 구조에
    //   해당 슬롯에 대한 정보가 없습니다.
    // - 슬롯에 TNode가 아닌 다른 것이 포함되어 있는 경우. 예를 들면,
    //   defer 블록이나 제어 흐름 블록에 대한 메타데이터 정보가 있을 수 있습니다.
    if (!isTNodeShape(tNode)) {
      continue;
    }

    // i18n 블록에 있지만 분리된 것으로 간주되는 노드를 건너뜁니다
    // (즉, 템플릿에 존재하지 않습니다). 이러한 노드는 DOM 트리에서 분리되어 있으므로,
    // 이에 대한 정보를 직렬화하고 싶지 않습니다.
    if (isDetachedByI18n(tNode)) {
      continue;
    }

    // 주어진 TNode를 나타내는 기본 노드가 DOM 트리에서 분리되어 있는지 확인합니다.
    // 이러한 노드는 수화에서 제외되어야 하므로,
    // TNode id를 수집하고 런타임에 수화에서 건너뛰도록 사용합니다.
    //
    // 이러한 상황은 콘텐츠 프로젝션 중에 발생할 수 있으며,
    // 일부 노드가 콘텐츠 프로젝션 슬롯 중 하나에 들어가지 않을 때 발생합니다
    // (예: 프로젝터 컴포넌트 템플릿에 기본 <ng-content /> 슬롯이 없는 경우).
    if (isDisconnectedNode(tNode, lView) && isContentProjectedNode(tNode)) {
      appendDisconnectedNodeIndex(ngh, tNode);
      continue;
    }

    if (Array.isArray(tNode.projection)) {
      for (const projectionHeadTNode of tNode.projection) {
        // 프로젝트된 콘텐츠가 없는 슬롯에 `null`이 있을 수 있습니다.
        if (!projectionHeadTNode) continue;

        if (!Array.isArray(projectionHeadTNode)) {
          // 재투영된 콘텐츠를 처리하는 경우 (즉, `<ng-content>`
          //가 프로젝션 위치에 나타나는 경우), 이 콘텐츠에 대한 주석은 건너뛰어야 합니다.
          // 이 노드는 부모 lView를 처리하는 동안 처리되었기 때문입니다.
          if (
            !isProjectionTNode(projectionHeadTNode) &&
            !isInSkipHydrationBlock(projectionHeadTNode)
          ) {
            if (isDisconnectedNode(projectionHeadTNode, lView)) {
              // 이 노드가 연결되어 있는지 확인합니다.
              appendDisconnectedNodeIndex(ngh, projectionHeadTNode);
            } else {
              appendSerializedNodePath(ngh, projectionHeadTNode, lView, i18nChildren);
            }
          }
        } else {
          // 값이 배열이면, 이는 재투영된 콘텐츠가 DOM 노드로 전달된 경우를 나타냅니다.
          // (예: `ViewContainerRef.createComponent(CmpA, {projectableNodes: [...]})`를 호출할 때).
          // 이 시나리오에서는 노드가 어디서든 올 수 있으며(수동으로 생성되거나
          // `document.querySelector`를 통해 액세스되는 등) 여기에 연결되어 있어서
          // 수화 중에 이러한 상태를 신뢰할 수 없게 됩니다.

          throw unsupportedProjectionOfDomNodes(unwrapRNode(lView[i]));
        }
      }
    }

    conditionallyAnnotateNodePath(ngh, tNode, lView, i18nChildren);
    if (isLContainer(lView[i])) {
      // 템플릿에 대한 정보를 직렬화합니다.
      const embeddedTView = tNode.tView;
      if (embeddedTView !== null) {
        ngh[TEMPLATES] ??= {};
        ngh[TEMPLATES][noOffsetIndex] = getSsrId(embeddedTView);
      }

      // 이 LContainer 내의 뷰를 직렬화합니다.
      const hostNode = lView[i][HOST]!; // 이 컨테이너의 호스트 노드

      // LView[i][HOST]는 2가지 다른 유형이 있을 수 있습니다:
      // - DOM 노드이거나
      // - 배열로, 컴포넌트의 LView를 나타냅니다.
      if (Array.isArray(hostNode)) {
        // 이것은 컴포넌트로, 그에 대한 정보를 직렬화합니다.
        const targetNode = unwrapRNode(hostNode as LView) as RElement;
        if (!(targetNode as HTMLElement).hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
          annotateHostElementForHydration(
            targetNode,
            hostNode as LView,
            parentDeferBlockId,
            context,
          );
        }
      }

      ngh[CONTAINERS] ??= {};
      ngh[CONTAINERS][noOffsetIndex] = serializeLContainer(
        lView[i],
        tNode,
        lView,
        parentDeferBlockId,
        context,
      );
    } else if (Array.isArray(lView[i]) && !isLetDeclaration(tNode)) {
      // 이것은 컴포넌트입니다. `ngh` 속성으로 호스트 노드에 주석을 추가합니다.
      const targetNode = unwrapRNode(lView[i][HOST]!);
      if (!(targetNode as HTMLElement).hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
        annotateHostElementForHydration(
          targetNode as RElement,
          lView[i],
          parentDeferBlockId,
          context,
        );
      }
    } else {
      // <ng-container> 경우
      if (tNode.type & TNodeType.ElementContainer) {
        // <ng-container>는 최상위 노드의 수로 표시됩니다.
        // 이 정보는 해당 노드를 건너뛰고
        // 해당 앵커 노드(주석 노드)에 도달하는 데 필요합니다.
        ngh[ELEMENT_CONTAINERS] ??= {};
        ngh[ELEMENT_CONTAINERS][noOffsetIndex] = calcNumRootNodes(tView, lView, tNode.child);
      } else if (tNode.type & (TNodeType.Projection | TNodeType.LetDeclaration)) {
        // 현재 TNode는 `<ng-content>` 슬롯이나 `@let` 선언을 나타냅니다.
        // 따라서 이와 관련된 DOM 요소가 없으므로 **다음 형제**
        // 노드는 앵커를 찾을 수 없습니다. 이 경우 전체 경로를 대신 사용합니다.
        let nextTNode = tNode.next;
        // 모든 `<ng-content>` 슬롯과 `@let` 선언을 건너뜁니다.
        while (
          nextTNode !== null &&
          nextTNode.type & (TNodeType.Projection | TNodeType.LetDeclaration)
        ) {
          nextTNode = nextTNode.next;
        }
        if (nextTNode && !isInSkipHydrationBlock(nextTNode)) {
          // `<ng-content>` 슬롯 뒤에 있는 tNode를 처리합니다.
          appendSerializedNodePath(ngh, nextTNode, lView, i18nChildren);
        }
      } else if (tNode.type & TNodeType.Text) {
        const rNode = unwrapRNode(lView[i]);
        processTextNodeBeforeSerialization(context, rNode);
      }
    }

    // 등록된 리스너가 있는 요소에 `jsaction` 속성을 추가합니다.
    // 따라서 이벤트 재생이 필요할 수 있습니다.
    if (nativeElementsToEventTypes && tNode.type & TNodeType.Element) {
      const nativeElement = unwrapRNode(lView[i]) as Element;
      if (nativeElementsToEventTypes.has(nativeElement)) {
        setJSActionAttributes(
          nativeElement,
          nativeElementsToEventTypes.get(nativeElement)!,
          parentDeferBlockId,
        );
      }
    }
  }
  return ngh;
}

/**
 * 필요한 경우 노드 위치를 직렬화합니다. 특히:
 *
 *  1. `tNode.projectionNext`가 `tNode.next`와 다르면,
 *     프로젝션 이후의 다음 `tNode`가 원래 템플릿의 것과 다르다는 것을 의미합니다.
 *     수화가 `tNode.next`에 의존하기 때문에, 이 직렬화된 정보가
 *     런타임 코드가 정확한 위치에서 노드를 찾는 데 필요합니다.
 *  2. 특정 콘텐츠 프로젝션 기반 사용 사례의 경우,
 *     프로젝션된 요소의 콘텐츠만 렌더링될 가능성이 있습니다.
 *     이 경우 콘텐츠 노드는 추가 주석을 요구합니다.
 *     런타임 로직은 부모-자식 연결을 기반으로 노드의 위치를 식별할 수 없기 때문입니다.
 */
function conditionallyAnnotateNodePath(
  ngh: SerializedView,
  tNode: TNode,
  lView: LView<unknown>,
  excludedParentNodes: Set<number> | null,
) {
  if (isProjectionTNode(tNode)) {
    // 프로젝션 노드(<ng-content />)에는 주석을 추가하지 마십시오.
    // 이러한 노드는 해당 DOM 노드를 나타내는 것이 없습니다.
    return;
  }

  // 위에서 설명한 경우 #1을 처리합니다.
  if (
    tNode.projectionNext &&
    tNode.projectionNext !== tNode.next &&
    !isInSkipHydrationBlock(tNode.projectionNext)
  ) {
    appendSerializedNodePath(ngh, tNode.projectionNext, lView, excludedParentNodes);
  }

  // 위에서 설명한 경우 #2를 처리합니다.
  // 참고: 우리는 첫 번째 노드에 대해서만 이를 수행합니다
  // (즉, `tNode.prev === null`일 때),
  // 나머지 노드는 현재 노드 위치를 기준으로, 추가 주석이 필요하지 않습니다.
  if (
    tNode.prev === null &&
    tNode.parent !== null &&
    isDisconnectedNode(tNode.parent, lView) &&
    !isDisconnectedNode(tNode, lView)
  ) {
    appendSerializedNodePath(ngh, tNode, lView, excludedParentNodes);
  }
}

/**
 * 주어진 LView로 표현된 컴포넌트 인스턴스가
 * `ViewEncapsulation.ShadowDom`를 사용하는지 결정합니다.
 */
function componentUsesShadowDomEncapsulation(lView: LView): boolean {
  const instance = lView[CONTEXT];
  return instance?.constructor
    ? getComponentDef(instance.constructor)?.encapsulation === ViewEncapsulation.ShadowDom
    : false;
}

/**
 * 수화를 위해 컴포넌트 호스트 요소에 주석을 추가합니다:
 * - `ngh` 속성을 추가하여 수화와 관련된 정보를 수집하고
 *   직렬화 및 클라이언트로 전송합니다.
 * - Angular가 컴포넌트 콘텐츠가 수화에 호환되지 않는다고 감지하는 경우,
 *   `ngSkipHydration` 속성을 추가합니다.
 *
 * @param element 주석을 추가할 호스트 요소
 * @param lView 관련 LView
 * @param context 수화 컨텍스트
 * @returns 전송 상태 객체에서의 직렬화된 뷰 인덱스
 *          또는 주어진 컴포넌트를 직렬화할 수 없는 경우 `null`.
 */
function annotateHostElementForHydration(
  element: RElement,
  lView: LView,
  parentDeferBlockId: string | null,
  context: HydrationContext,
): number | null {
  const renderer = lView[RENDERER];
  if (
    (hasI18n(lView) && !isI18nHydrationSupportEnabled()) ||
    componentUsesShadowDomEncapsulation(lView)
  ) {
    // 이 컴포넌트가 i18n 블록이 있거나,
    // ShadowDom 뷰 캡슐화를 사용하므로 수화가 가능한지 확인하십시오.
    renderer.setAttribute(element, SKIP_HYDRATION_ATTR_NAME, '');
    return null;
  } else {
    const ngh = serializeLView(lView, parentDeferBlockId, context);
    const index = context.serializedViewCollection.add(ngh);
    renderer.setAttribute(element, NGH_ATTR_NAME, index.toString());
    return index;
  }
}

/**
 * 수화를 위한 defer 블록 주석 노드를 주석을 추가합니다:
 *
 * @param comment 주석을 추가할 호스트 요소
 * @param deferBlockId 목표 defer 블록의 ID
 */
function annotateDeferBlockAnchorForHydration(comment: RComment, deferBlockId: string): void {
  comment.textContent = `ngh=${deferBlockId}`;
}

/**
 * 비어 있는 텍스트 노드와 인접한
 * 텍스트 노드 구분 기호를 보존하기 위해 주석 노드를 물리적으로 삽입합니다.
 * 이러한 노드는 클라이언트에서 수화가 발생할 때 비어 있는 텍스트 노드나
 * 구분 기호를 대상으로 바뀌게 됩니다.
 *
 * @param corruptedTextNodes 주석으로 교체될 텍스트 노드의 맵
 * @param doc 문서
 */
function insertCorruptedTextNodeMarkers(
  corruptedTextNodes: Map<HTMLElement, string>,
  doc: Document,
) {
  for (const [textNode, marker] of corruptedTextNodes) {
    textNode.after(doc.createComment(marker));
  }
}

/**
 * 주어진 TNode가 콘텐츠가 프로젝션된 노드를 나타내는지 감지합니다.
 */
function isContentProjectedNode(tNode: TNode): boolean {
  let currentTNode = tNode;
  while (currentTNode != null) {
    // 부모 노드에서 컴포넌트 호스트 노드를 만나면
    // 이 TNode는 콘텐츠 프로젝션 섹션에 있습니다.
    if (isComponentHost(currentTNode)) {
      return true;
    }
    currentTNode = currentTNode.parent as TNode;
  }
  return false;
}

/**
 * 점진적인 수화는 모든 defer 블록 루트 노드에
 * 상호작용 또는 호버 트리거가 있어야 하는 경우에는
 * 모든 루트 노드가 해당 이벤트로 수화를 트리거해야 합니다.
 * 따라서, 모든 루트 노드가 적절한 jsaction 속성을 가지도록 해야 합니다.
 */
function annotateDeferBlockRootNodesWithJsAction(
  tDetails: TDeferBlockDetails,
  rootNodes: any[],
  parentDeferBlockId: string,
  context: HydrationContext,
) {
  const actionList = convertHydrateTriggersToJsAction(tDetails.hydrateTriggers);
  for (let et of actionList) {
    context.eventTypesToReplay.regular.add(et);
  }

  if (actionList.length > 0) {
    const elementNodes = (rootNodes as HTMLElement[]).filter(
      (rn) => rn.nodeType === Node.ELEMENT_NODE,
    );
    for (let rNode of elementNodes) {
      setJSActionAttributes(rNode, actionList, parentDeferBlockId);
    }
  }
}
