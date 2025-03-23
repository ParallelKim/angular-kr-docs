/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  TView,
  TVIEW,
  LViewFlags,
  LViewEnvironment,
  HOST,
  FLAGS,
  DECLARATION_VIEW,
  PARENT,
  CONTEXT,
  ENVIRONMENT,
  RENDERER,
  INJECTOR,
  T_HOST,
  ID,
  HYDRATION,
  EMBEDDED_VIEW_INJECTOR,
  TViewType,
  DECLARATION_COMPONENT_VIEW,
  HEADER_OFFSET,
  CHILD_HEAD,
  CHILD_TAIL,
  NEXT,
  LView,
} from '../interfaces/view';
import {assertFirstCreatePass, assertFirstUpdatePass, assertTNodeForLView} from '../assert';
import {assertSame, assertEqual, assertDefined} from '../../util/assert';
import {RElement} from '../interfaces/renderer_dom';
import {TConstantsOrFactory, TElementNode, TNode} from '../interfaces/node';
import {Renderer} from '../interfaces/renderer';
import {Injector} from '../../di';
import {DehydratedView} from '../../hydration/interfaces';
import {getNativeByTNode, resetPreOrderHookFlags} from '../util/view_utils';
import {getUniqueLViewId} from '../interfaces/lview_tracking';
import {NO_CHANGE} from '../tokens';
import {
  ComponentDef,
  ComponentTemplate,
  DirectiveDefListOrFactory,
  PipeDefListOrFactory,
  ViewQueriesFunction,
} from '../interfaces/definition';
import {SchemaMetadata} from '../../metadata/schema';
import {LContainer} from '../interfaces/container';

/**
 * TView 인스턴스를 생성합니다.
 *
 * @param type `TView`의 타입.
 * @param declTNode 이 `TView`의 선언 위치.
 * @param templateFn 템플릿 함수
 * @param decls 이 템플릿의 노드 수, 로컬 refs 및 파이프
 * @param directives 이 뷰의 지시문 레지스트리
 * @param pipes 이 뷰의 파이프 레지스트리
 * @param viewQuery 이 뷰의 뷰 쿼리
 * @param schemas 이 뷰의 스키마
 * @param consts 이 뷰의 상수
 */
export function createTView(
  type: TViewType,
  declTNode: TNode | null,
  templateFn: ComponentTemplate<any> | null,
  decls: number,
  vars: number,
  directives: DirectiveDefListOrFactory | null,
  pipes: PipeDefListOrFactory | null,
  viewQuery: ViewQueriesFunction<any> | null,
  schemas: SchemaMetadata[] | null,
  constsOrFactory: TConstantsOrFactory | null,
  ssrId: string | null,
): TView {
  ngDevMode && ngDevMode.tView++;
  const bindingStartIndex = HEADER_OFFSET + decls;
  // 이 길이는 현재 어떤 지시문이 이 템플릿에서 활성화되어 있는지 알 수 없으므로 자식 지시문으로부터의 호스트 바인딩을 포함하지 않습니다.
  // 호스트 바인딩이 있는 지시문이 일치하면 해당 정의의 hostVars 수로 청사진을 업데이트합니다.
  const initialViewLength = bindingStartIndex + vars;
  const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
  const consts = typeof constsOrFactory === 'function' ? constsOrFactory() : constsOrFactory;
  const tView = (blueprint[TVIEW as any] = {
    type: type,
    blueprint: blueprint,
    template: templateFn,
    queries: null,
    viewQuery: viewQuery,
    declTNode: declTNode,
    data: blueprint.slice().fill(null, bindingStartIndex),
    bindingStartIndex: bindingStartIndex,
    expandoStartIndex: initialViewLength,
    hostBindingOpCodes: null,
    firstCreatePass: true,
    firstUpdatePass: true,
    staticViewQueries: false,
    staticContentQueries: false,
    preOrderHooks: null,
    preOrderCheckHooks: null,
    contentHooks: null,
    contentCheckHooks: null,
    viewHooks: null,
    viewCheckHooks: null,
    destroyHooks: null,
    cleanup: null,
    contentQueries: null,
    components: null,
    directiveRegistry: typeof directives === 'function' ? directives() : directives,
    pipeRegistry: typeof pipes === 'function' ? pipes() : pipes,
    firstChild: null,
    schemas: schemas,
    consts: consts,
    incompleteFirstPass: false,
    ssrId,
  });
  if (ngDevMode) {
    // 성능상의 이유로 tView가 런타임 동안 동일한 형태를 유지하는 것이 중요합니다.
    // (모든 코드가 단일형이 되도록.) 이러한 이유로 객체를 봉인하여 클래스 전환을 방지합니다.
    Object.seal(tView);
  }
  return tView;
}

function createViewBlueprint(bindingStartIndex: number, initialViewLength: number): LView {
  const blueprint = [];

  for (let i = 0; i < initialViewLength; i++) {
    blueprint.push(i < bindingStartIndex ? null : NO_CHANGE);
  }

  return blueprint as LView;
}

/**
 * 템플릿 함수에서 TView를 가져오거나 존재하지 않으면 새로운 TView를 생성합니다.
 *
 * @param def ComponentDef
 * @returns TView
 */
export function getOrCreateComponentTView(def: ComponentDef<any>): TView {
  const tView = def.tView;

  // TView가 없으면 생성하고, 첫 번째 생성 패스가 성공적으로 완료되지 않으면 다시 생성합니다.
  // 사용할 수 있는 형체인지 확실히 알 수 없기 때문입니다.
  if (tView === null || tView.incompleteFirstPass) {
    // 여기서 선언 노드는 null입니다. 이 함수는 동적으로 컴포넌트를 생성할 때 호출되므로
    // 선언이 없습니다.
    const declTNode = null;
    return (def.tView = createTView(
      TViewType.Component,
      declTNode,
      def.template,
      def.decls,
      def.vars,
      def.directiveDefs,
      def.pipeDefs,
      def.viewQuery,
      def.schemas,
      def.consts,
      def.id,
    ));
  }

  return tView;
}

export function createLView<T>(
  parentLView: LView | null,
  tView: TView,
  context: T | null,
  flags: LViewFlags,
  host: RElement | null,
  tHostNode: TNode | null,
  environment: LViewEnvironment | null,
  renderer: Renderer | null,
  injector: Injector | null,
  embeddedViewInjector: Injector | null,
  hydrationInfo: DehydratedView | null,
): LView<T> {
  const lView = tView.blueprint.slice() as LView;
  lView[HOST] = host;
  lView[FLAGS] =
    flags |
    LViewFlags.CreationMode |
    LViewFlags.Attached |
    LViewFlags.FirstLViewPass |
    LViewFlags.Dirty |
    LViewFlags.RefreshView;
  if (
    embeddedViewInjector !== null ||
    (parentLView && parentLView[FLAGS] & LViewFlags.HasEmbeddedViewInjector)
  ) {
    lView[FLAGS] |= LViewFlags.HasEmbeddedViewInjector;
  }
  resetPreOrderHookFlags(lView);
  ngDevMode && tView.declTNode && parentLView && assertTNodeForLView(tView.declTNode, parentLView);
  lView[PARENT] = lView[DECLARATION_VIEW] = parentLView;
  lView[CONTEXT] = context;
  lView[ENVIRONMENT] = (environment || (parentLView && parentLView[ENVIRONMENT]))!;
  ngDevMode && assertDefined(lView[ENVIRONMENT], 'LViewEnvironment is required');
  lView[RENDERER] = (renderer || (parentLView && parentLView[RENDERER]))!;
  ngDevMode && assertDefined(lView[RENDERER], 'Renderer is required');
  lView[INJECTOR as any] = injector || (parentLView && parentLView[INJECTOR]) || null;
  lView[T_HOST] = tHostNode;
  lView[ID] = getUniqueLViewId();
  lView[HYDRATION] = hydrationInfo;
  lView[EMBEDDED_VIEW_INJECTOR as any] = embeddedViewInjector;

  ngDevMode &&
    assertEqual(
      tView.type == TViewType.Embedded ? parentLView !== null : true,
      true,
      'Embedded views must have parentLView',
    );
  lView[DECLARATION_COMPONENT_VIEW] =
    tView.type == TViewType.Embedded ? parentLView![DECLARATION_COMPONENT_VIEW] : lView;
  return lView as LView<T>;
}

export function createComponentLView<T>(
  lView: LView,
  hostTNode: TElementNode,
  def: ComponentDef<T>,
): LView {
  const native = getNativeByTNode(hostTNode, lView) as RElement;
  const tView = getOrCreateComponentTView(def);

  // 컴포넌트 뷰만 뷰 트리에 직접 추가되어야 합니다. 임베디드 뷰는
  // 나중에 제거 / 다시 추가될 수 있기 때문에 컨테이너를 통해 접근됩니다.
  const rendererFactory = lView[ENVIRONMENT].rendererFactory;
  const componentView = addToEndOfViewTree(
    lView,
    createLView(
      lView,
      tView,
      null,
      getInitialLViewFlagsFromDef(def),
      native,
      hostTNode as TElementNode,
      null,
      rendererFactory.createRenderer(native, def),
      null,
      null,
      null,
    ),
  );

  // 컴포넌트 뷰는 모든 주입된 LContainers 이전에 항상 생성되므로,
  // 이는 일반 요소이며, 컴포넌트 뷰로 감싸줍니다.
  return (lView[hostTNode.index] = componentView);
}

/**
 * LView가 나타내는 컴포넌트 정의에 따라 초기 LView 플래그 집합을 가져옵니다.
 * @param def 플래그를 결정하기 위한 컴포넌트 정의.
 */
export function getInitialLViewFlagsFromDef(def: ComponentDef<unknown>): LViewFlags {
  let flags = LViewFlags.CheckAlways;
  if (def.signals) {
    flags = LViewFlags.SignalView;
  } else if (def.onPush) {
    flags = LViewFlags.Dirty;
  }
  return flags;
}

/**
 * 뷰 청사진이 생성된 후 요소가 동적으로 생성될 때(i18nApply()를 통해),
 * 향후 템플릿 패스를 위해 청사진을 조정해야 합니다.
 *
 * @param tView `LView`와 관련된 `TView`
 * @param lView 조정할 청사진을 포함하는 `LView`
 * @param numSlotsToAlloc LView에서 할당할 슬롯의 수, 0보다 커야 함
 * @param initialValue 청사진에 저장할 초기 값
 */
export function allocExpando(
  tView: TView,
  lView: LView,
  numSlotsToAlloc: number,
  initialValue: unknown,
): number {
  if (numSlotsToAlloc === 0) return -1;
  if (ngDevMode) {
    assertFirstCreatePass(tView);
    assertSame(tView, lView[TVIEW], '`LView` must be associated with `TView`!');
    assertEqual(tView.data.length, lView.length, 'Expecting LView to be same size as TView');
    assertEqual(
      tView.data.length,
      tView.blueprint.length,
      'Expecting Blueprint to be same size as TView',
    );
    assertFirstUpdatePass(tView);
  }
  const allocIdx = lView.length;
  for (let i = 0; i < numSlotsToAlloc; i++) {
    lView.push(initialValue);
    tView.blueprint.push(initialValue);
    tView.data.push(null);
  }
  return allocIdx;
}

/**
 * LView 또는 LContainer를 현재 뷰 트리의 끝에 추가합니다.
 *
 * 이 구조는 중첩된 뷰를 통해 탐색하여 리스너를 제거하고
 * onDestroy 콜백을 호출하는 데 사용됩니다.
 *
 * @param lView LView 또는 LContainer가 추가되어야 하는 뷰
 * @param adjustedHostIndex LView[]에서 뷰의 호스트 노드의 인덱스, 헤더에 대해 조정됨
 * @param lViewOrLContainer 추가할 LView 또는 LContainer
 * @returns 전달된 상태
 */
export function addToEndOfViewTree<T extends LView | LContainer>(
  lView: LView,
  lViewOrLContainer: T,
): T {
  // TODO(benlesh/misko): 이 구현은 잘못되었습니다. 항상 LContainer를 큐의 끝에 추가하기 때문에
  // 개발자가 LContainers를 RNodes에서 순서 없이 검색하면 변경 감지가
  // 순서 없이 실행됩니다. LNode로부터 LContainer를 검색하는 행위가 큐에 추가되기 때문입니다.
  if (lView[CHILD_HEAD]) {
    lView[CHILD_TAIL]![NEXT] = lViewOrLContainer;
  } else {
    lView[CHILD_HEAD] = lViewOrLContainer;
  }
  lView[CHILD_TAIL] = lViewOrLContainer;
  return lViewOrLContainer;
}
