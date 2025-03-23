/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {findMatchingDehydratedView} from '../../hydration/views';
import {isDetachedByI18n} from '../../i18n/utils';
import {newArray} from '../../util/array_utils';
import {assertLContainer, assertTNode} from '../assert';
import {ComponentTemplate} from '../interfaces/definition';
import {TAttributes, TElementNode, TNode, TNodeType} from '../interfaces/node';
import {ProjectionSlots} from '../interfaces/projection';
import {
  DECLARATION_COMPONENT_VIEW,
  HEADER_OFFSET,
  HYDRATION,
  LView,
  T_HOST,
  TView,
} from '../interfaces/view';
import {applyProjection} from '../node_manipulation';
import {
  getProjectAsAttrValue,
  isNodeMatchingSelectorList,
  isSelectorInSelectorList,
} from '../node_selector_matcher';
import {getLView, getTView, isInSkipHydrationBlock, setCurrentTNodeAsNotParent} from '../state';
import {getOrCreateTNode} from '../tnode_manipulation';
import {addLViewToLContainer} from '../view/container';
import {createAndRenderEmbeddedLView, shouldAddViewToDom} from '../view_manipulation';

import {declareTemplate} from './template';

/**
 * 주어진 노드를 일치하는 프로젝션 슬롯과 비교하고,
 * 결정된 슬롯 인덱스를 반환합니다. 주어진 노드와 일치하는 슬롯이 없으면 "null"을 반환합니다.
 *
 * 이 함수는 노드의 속성에서 구문 분석된 ngProjectAs 선택기를 고려합니다.
 * 존재할 경우, ngProjectAs 선택기가 프로젝션 슬롯 선택기와 일치하는지 확인합니다.
 */
export function matchingProjectionSlotIndex(
  tNode: TNode,
  projectionSlots: ProjectionSlots,
): number | null {
  let wildcardNgContentIndex = null;
  const ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
  for (let i = 0; i < projectionSlots.length; i++) {
    const slotValue = projectionSlots[i];
    // 마지막 와일드카드 프로젝션 슬롯은 어떤 선택자와도 일치하지 않는 모든 노드와 일치해야 합니다.
    // 이는 뷰 엔진과의 호환성을 유지하는데 필요합니다.
    if (slotValue === '*') {
      wildcardNgContentIndex = i;
      continue;
    }
    // `ngProjectAs` 속성과 마주쳤다면, 그 구문 분석된 선택기를 목록의 선택자와 비교해야 합니다.
    // 그렇지 않으면 노드와 비교하는 기본으로 돌아갑니다.
    if (
      ngProjectAsAttrVal === null
        ? isNodeMatchingSelectorList(tNode, slotValue, /* isProjectionMode */ true)
        : isSelectorInSelectorList(ngProjectAsAttrVal, slotValue)
    ) {
      return i; // 첫 번째 일치하는 선택자가 주어진 노드를 "포획"합니다.
    }
  }
  return wildcardNgContentIndex;
}

/**
 * 주어진 템플릿의 <ng-content> 발생 사이에 프로젝터블 노드를 분배하는 지침입니다.
 * 전체 컴포넌트의 템플릿에서 모든 선택자를 가져와 각 프로젝션 노드가
 * 어디에 속하는지 결정합니다(각 "버킷"이 선택자에 의해 지원됩니다).
 *
 * 이 함수는 CSS 선택자가 두 가지 형식으로 제공되어야 합니다: 구문 분석된(컴파일러에 의해) 형식과
 * 텍스트, 구문 분석되지 않은 형식.
 *
 * 구문 분석된 형식은 주어진 CSS 선택자에 대한 노드의 효율적인 비교를 위해 필요합니다.
 * 구문 분석되지 않은 텍스트 형식은 ngProjectAs 속성의 지원을 위해 필요합니다.
 *
 * 두 가지 다른 형식으로 CSS 선택자를 갖는 것은 이상적이지 않지만, 대안은 더 큰 단점을 가지고 있습니다:
 * - 텍스트 형식만 있으면 CSS 선택자의 런타임 구문 분석이 필요합니다;
 * - 구문 분석된 선택자만 있을 수 없습니다, 그로부터 구문 분석되지 않은 형식을 재구성할 수 없기 때문입니다(템플릿 작성자가 입력한 대로).
 *
 * @param projectionSlots? 프로젝션 슬롯의 컬렉션. 프로젝션 슬롯은 구문 분석된 CSS 선택자를 기반으로 할 수 있으며,
 *        모든 노드가 어떤 선택자와도 일치하지 않도록 와일드카드 선택자("*")로 설정할 수 있습니다.
 *        지정하지 않으면, 단일 와일드카드 선택자 프로젝션 슬롯이 정의됩니다.
 *
 * @codeGenApi
 */
export function ɵɵprojectionDef(projectionSlots?: ProjectionSlots): void {
  const componentNode = getLView()[DECLARATION_COMPONENT_VIEW][T_HOST] as TElementNode;

  if (!componentNode.projection) {
    // 명시적인 프로젝션 슬롯이 정의되지 않은 경우, 와일드카드 선택어로 단일 프로젝션 슬롯으로 돌아갑니다.
    const numProjectionSlots = projectionSlots ? projectionSlots.length : 1;
    const projectionHeads: (TNode | null)[] = (componentNode.projection = newArray(
      numProjectionSlots,
      null! as TNode,
    ));
    const tails: (TNode | null)[] = projectionHeads.slice();

    let componentChild: TNode | null = componentNode.child;

    while (componentChild !== null) {
      // let 선언은 슬롯을 차지하지 않도록 투영하지 않습니다.
      if (componentChild.type !== TNodeType.LetDeclaration) {
        const slotIndex = projectionSlots
          ? matchingProjectionSlotIndex(componentChild, projectionSlots)
          : 0;

        if (slotIndex !== null) {
          if (tails[slotIndex]) {
            tails[slotIndex]!.projectionNext = componentChild;
          } else {
            projectionHeads[slotIndex] = componentChild;
          }
          tails[slotIndex] = componentChild;
        }
      }

      componentChild = componentChild.next;
    }
  }
}

/**
 * 이전에 재분배된 프로젝션 노드를 삽입합니다. 이 명령문은 projectionDef 명령문 호출이
 * 선행되어야 합니다.
 *
 * @param nodeIndex 프로젝션 노드의 인덱스.
 * @param selectorIndex 슬롯 선택자의 인덱스.
 *  - 선택자가 `*`일 때 0(또는 지정되지 않음, 기본 값임),
 *  - {@link projectionDef}에서의 선택자의 1 기반 인덱스
 * @param attrs `ng-content` 노드에 설정된 정적 속성.
 * @param fallbackTemplateFn 폴백 콘텐츠가 포함된 템플릿 함수.
 *   런타임에 슬롯이 비어 있을 때 렌더링됩니다.
 * @param fallbackDecls 폴백 템플릿에 있는 선언 수.
 * @param fallbackVars 폴백 템플릿에 있는 변수 수.
 *
 * @codeGenApi
 */
export function ɵɵprojection(
  nodeIndex: number,
  selectorIndex: number = 0,
  attrs?: TAttributes,
  fallbackTemplateFn?: ComponentTemplate<unknown>,
  fallbackDecls?: number,
  fallbackVars?: number,
): void {
  const lView = getLView();
  const tView = getTView();
  const fallbackIndex = fallbackTemplateFn ? nodeIndex + 1 : null;

  // 슬롯이 비어 있는지와 관계없이 폴백 콘텐츠는 선언되어야 합니다.
  // 또한 다른 컴포넌트 인스턴스가 그것을 삽입할 수 있습니다. 런타임에서 작동하도록 하기 위해
  // 프로젝션 노드 앞에서 선언해야 합니다.
  if (fallbackIndex !== null) {
    declareTemplate(
      lView,
      tView,
      fallbackIndex,
      fallbackTemplateFn!,
      fallbackDecls!,
      fallbackVars!,
      null,
      attrs,
    );
  }

  const tProjectionNode = getOrCreateTNode(
    tView,
    HEADER_OFFSET + nodeIndex,
    TNodeType.Projection,
    null,
    attrs || null,
  );

  // 프로젝션 노드는 임베디드 뷰에 중첩될 수 있으므로 viewData[HOST_NODE]를 사용할 수 없습니다.
  if (tProjectionNode.projection === null) {
    tProjectionNode.projection = selectorIndex;
  }

  // `<ng-content>`에는 내용이 없습니다. 폴백이 있더라도,
  // 폴백은 그 옆에 표시됩니다.
  setCurrentTNodeAsNotParent();

  const hydrationInfo = lView[HYDRATION];
  const isNodeCreationMode = !hydrationInfo || isInSkipHydrationBlock();
  const componentHostNode = lView[DECLARATION_COMPONENT_VIEW][T_HOST] as TElementNode;
  const isEmpty = componentHostNode.projection![tProjectionNode.projection] === null;

  if (isEmpty && fallbackIndex !== null) {
    insertFallbackContent(lView, tView, fallbackIndex);
  } else if (isNodeCreationMode && !isDetachedByI18n(tProjectionNode)) {
    // 프로젝터블 노드의 재분배는 컴포넌트의 뷰 수준에 저장됩니다.
    applyProjection(tView, lView, tProjectionNode);
  }
}

/** 프로젝션 슬롯의 폴백 콘텐츠를 삽입합니다. 프로젝션 콘텐츠가 없다고 가정합니다. */
function insertFallbackContent(lView: LView, tView: TView, fallbackIndex: number) {
  const adjustedIndex = HEADER_OFFSET + fallbackIndex;
  const fallbackTNode = tView.data[adjustedIndex] as TNode;
  const fallbackLContainer = lView[adjustedIndex];
  ngDevMode && assertTNode(fallbackTNode);
  ngDevMode && assertLContainer(fallbackLContainer);

  const dehydratedView = findMatchingDehydratedView(fallbackLContainer, fallbackTNode.tView!.ssrId);
  const fallbackLView = createAndRenderEmbeddedLView(lView, fallbackTNode, undefined, {
    dehydratedView,
  });
  addLViewToLContainer(
    fallbackLContainer,
    fallbackLView,
    0,
    shouldAddViewToDom(fallbackTNode, dehydratedView),
  );
}
