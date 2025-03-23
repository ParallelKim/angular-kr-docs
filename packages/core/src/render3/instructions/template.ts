/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {validateMatchingNode, validateNodeExists} from '../../hydration/error_handling';
import {TEMPLATES} from '../../hydration/interfaces';
import {locateNextRNode, siblingAfter} from '../../hydration/node_lookup_utils';
import {
  calcSerializedContainerSize,
  isDisconnectedNode,
  markRNodeAsClaimedByHydration,
  setSegmentHead,
} from '../../hydration/utils';
import {isDetachedByI18n} from '../../i18n/utils';
import {populateDehydratedViewsInLContainer} from '../../linker/view_container_ref';
import {assertEqual} from '../../util/assert';
import {assertFirstCreatePass} from '../assert';
import {attachPatchData} from '../context_discovery';
import {registerPostOrderHooks} from '../hooks';
import {ComponentTemplate} from '../interfaces/definition';
import {LocalRefExtractor, TAttributes, TContainerNode, TNode, TNodeType} from '../interfaces/node';
import {RComment} from '../interfaces/renderer_dom';
import {isDirectiveHost} from '../interfaces/type_checks';
import {HEADER_OFFSET, HYDRATION, LView, RENDERER, TView, TViewType} from '../interfaces/view';
import {appendChild} from '../node_manipulation';
import {
  getBindingsEnabled,
  getLView,
  getTView,
  isInSkipHydrationBlock,
  lastNodeWasCreated,
  setCurrentTNode,
  wasLastNodeCreated,
} from '../state';
import {getOrCreateTNode} from '../tnode_manipulation';
import {mergeHostAttrs} from '../util/attrs_utils';
import {getConstant} from '../util/view_utils';
import {addToEndOfViewTree, createTView} from '../view/construction';
import {createLContainer} from '../view/container';
import {resolveDirectives} from '../view/directives';

import {
  createDirectivesInstances,
  findDirectiveDefMatches,
  saveResolvedLocalsInData,
} from './shared';

function templateFirstCreatePass(
  index: number,
  tView: TView,
  lView: LView,
  templateFn: ComponentTemplate<any> | null,
  decls: number,
  vars: number,
  tagName?: string | null,
  attrs?: TAttributes | null,
  localRefsIndex?: number | null,
): TContainerNode {
  ngDevMode && assertFirstCreatePass(tView);
  ngDevMode && ngDevMode.firstCreatePass++;
  const tViewConsts = tView.consts;

  // TODO(pk): "create"만 있는 getOrCreateTNode로 리팩토링 하기
  const tNode = getOrCreateTNode(tView, index, TNodeType.Container, tagName || null, attrs || null);

  if (getBindingsEnabled()) {
    resolveDirectives(
      tView,
      lView,
      tNode,
      getConstant<string[]>(tViewConsts, localRefsIndex),
      findDirectiveDefMatches,
    );
  }

  // 템플릿 속성의 병합은 마지막에 하여 가장 높은 우선 순위를 가집니다.
  tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, tNode.attrs);

  registerPostOrderHooks(tView, tNode);

  const embeddedTView = (tNode.tView = createTView(
    TViewType.Embedded,
    tNode,
    templateFn,
    decls,
    vars,
    tView.directiveRegistry,
    tView.pipeRegistry,
    null,
    tView.schemas,
    tViewConsts,
    null /* ssrId */,
  ));

  if (tView.queries !== null) {
    tView.queries.template(tView, tNode);
    embeddedTView.queries = tView.queries.embeddedTView(tNode);
  }

  return tNode;
}

/**
 * 임베디드 뷰를 위한 LContainer를 생성합니다.
 *
 * @param declarationLView 템플릿이 선언된 LView.
 * @param declarationTView 템플릿이 선언된 TView.
 * @param index 데이터 배열에서 컨테이너의 인덱스
 * @param templateFn 인라인 템플릿
 * @param decls 이 템플릿의 노드, 지역 참조 및 파이프의 수
 * @param vars 이 템플릿의 바인딩 수
 * @param tagName 해당하는 경우, 컨테이너 요소의 이름
 * @param attrsIndex `consts` 배열에서 템플릿 속성의 인덱스.
 * @param localRefs `consts` 배열에서 지역 참조의 인덱스.
 * @param localRefExtractor 템플릿에서 지역 참조 값을 추출하는 함수.
 *        지역 참조와 관련된 현재 요소에 기본값이 설정됩니다.
 */
export function declareTemplate(
  declarationLView: LView,
  declarationTView: TView,
  index: number,
  templateFn: ComponentTemplate<any> | null,
  decls: number,
  vars: number,
  tagName?: string | null,
  attrs?: TAttributes | null,
  localRefsIndex?: number | null,
  localRefExtractor?: LocalRefExtractor,
): TNode {
  const adjustedIndex = index + HEADER_OFFSET;
  const tNode = declarationTView.firstCreatePass
    ? templateFirstCreatePass(
        adjustedIndex,
        declarationTView,
        declarationLView,
        templateFn,
        decls,
        vars,
        tagName,
        attrs,
        localRefsIndex,
      )
    : (declarationTView.data[adjustedIndex] as TContainerNode);
  setCurrentTNode(tNode, false);

  const comment = _locateOrCreateContainerAnchor(
    declarationTView,
    declarationLView,
    tNode,
    index,
  ) as RComment;

  if (wasLastNodeCreated()) {
    appendChild(declarationTView, declarationLView, comment, tNode);
  }
  attachPatchData(comment, declarationLView);

  const lContainer = createLContainer(comment, declarationLView, comment, tNode);
  declarationLView[adjustedIndex] = lContainer;
  addToEndOfViewTree(declarationLView, lContainer);

  // 하이드레이션이 활성화된 경우, DOM의 탈수된 뷰를 조회하고
  // 하이드레이션 주석 정보를 사용하여 LContainer에 해당 뷰를 저장합니다.
  // 클라이언트 전용 모드에서는 이 함수가 NOOP입니다.
  populateDehydratedViewsInLContainer(lContainer, tNode, declarationLView);

  if (isDirectiveHost(tNode)) {
    createDirectivesInstances(declarationTView, declarationLView, tNode);
  }

  if (localRefsIndex != null) {
    saveResolvedLocalsInData(declarationLView, tNode, localRefExtractor);
  }

  return tNode;
}

/**
 * ng-template (동적으로 삽입된 뷰), 예:
 *
 * <ng-template #foo>
 *    <div></div>
 * </ng-template>
 *
 * @param index 데이터 배열에서 컨테이너의 인덱스
 * @param templateFn 인라인 템플릿
 * @param decls 이 템플릿의 노드, 지역 참조 및 파이프의 수
 * @param vars 이 템플릿의 바인딩 수
 * @param tagName 해당하는 경우, 컨테이너 요소의 이름
 * @param attrsIndex `consts` 배열에서 템플릿 속성의 인덱스.
 * @param localRefs `consts` 배열에서 지역 참조의 인덱스.
 * @param localRefExtractor 템플릿에서 지역 참조 값을 추출하는 함수.
 *        지역 참조와 관련된 현재 요소에 기본값이 설정됩니다.
 *
 * @codeGenApi
 */
export function ɵɵtemplate(
  index: number,
  templateFn: ComponentTemplate<any> | null,
  decls: number,
  vars: number,
  tagName?: string | null,
  attrsIndex?: number | null,
  localRefsIndex?: number | null,
  localRefExtractor?: LocalRefExtractor,
): typeof ɵɵtemplate {
  const lView = getLView();
  const tView = getTView();
  const attrs = getConstant<TAttributes>(tView.consts, attrsIndex);
  declareTemplate(
    lView,
    tView,
    index,
    templateFn,
    decls,
    vars,
    tagName,
    attrs,
    localRefsIndex,
    localRefExtractor,
  );
  return ɵɵtemplate;
}

let _locateOrCreateContainerAnchor = createContainerAnchorImpl;

/**
 * LContainers 및 해당 앵커(주석) 노드를 위한 일반 생성 모드.
 */
function createContainerAnchorImpl(
  tView: TView,
  lView: LView,
  tNode: TNode,
  index: number,
): RComment {
  lastNodeWasCreated(true);
  return lView[RENDERER].createComment(ngDevMode ? 'container' : '');
}

/**
 * LContainers 및 해당 앵커(주석) 노드를 위한 일반 생성 모드 외에
 * DOM에서 기존 요소를 조회하는 하이드레이션 코드 경로를 활성화합니다.
 */
function locateOrCreateContainerAnchorImpl(
  tView: TView,
  lView: LView,
  tNode: TNode,
  index: number,
): RComment {
  const hydrationInfo = lView[HYDRATION];
  const isNodeCreationMode =
    !hydrationInfo ||
    isInSkipHydrationBlock() ||
    isDetachedByI18n(tNode) ||
    isDisconnectedNode(hydrationInfo, index);
  lastNodeWasCreated(isNodeCreationMode);

  // 일반 생성 모드.
  if (isNodeCreationMode) {
    return createContainerAnchorImpl(tView, lView, tNode, index);
  }

  const ssrId = hydrationInfo.data[TEMPLATES]?.[index] ?? null;

  // 이전에 설정되지 않은 경우 TView에 `ssrId` 값을 적용합니다.
  //
  // 같은 컴포넌트가 템플릿에 여러 번 나타나고 일부 인스턴스가
  // `ngSkipHydration` 속성을 통해 하이드레이션 사용을 선택 해제하는 경우가 있을 수 있습니다.
  // 이 시나리오에서는 TView가 생성될 때 `ssrId`가 `null`일 수 있습니다
  // (첫 번째 컴포넌트가 하이드레이션에서 선택 해제된 경우).
  // 아래 코드는 `ssrId`가 여전히 `null`인 경우 TView에 적용되도록 보장합니다.
  // 그리고 다른 값으로 오버라이드하려고 하지 않도록 검증합니다.
  if (ssrId !== null && tNode.tView !== null) {
    if (tNode.tView.ssrId === null) {
      tNode.tView.ssrId = ssrId;
    } else {
      ngDevMode &&
        assertEqual(tNode.tView.ssrId, ssrId, '이 TView에 대한 `ssrId`의 예기치 않은 값');
    }
  }

  // 하이드레이션 모드, DOM에서 기존 요소를 조회합니다.
  const currentRNode = locateNextRNode(hydrationInfo, tView, lView, tNode)!;
  ngDevMode && validateNodeExists(currentRNode, lView, tNode);

  setSegmentHead(hydrationInfo, index, currentRNode);
  const viewContainerSize = calcSerializedContainerSize(hydrationInfo, index);
  const comment = siblingAfter<RComment>(viewContainerSize, currentRNode)!;

  if (ngDevMode) {
    validateMatchingNode(comment, Node.COMMENT_NODE, null, lView, tNode);
    markRNodeAsClaimedByHydration(comment);
  }

  return comment;
}

export function enableLocateOrCreateContainerAnchorImpl() {
  _locateOrCreateContainerAnchor = locateOrCreateContainerAnchorImpl;
}
