/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertEqual, assertGreaterThanOrEqual, assertNotSame} from '../util/assert';
import {assertTNodeForTView} from './assert';
import {
  TAttributes,
  TContainerNode,
  TElementContainerNode,
  TElementNode,
  TIcuContainerNode,
  TLetDeclarationNode,
  TNode,
  TNodeFlags,
  TNodeType,
  TProjectionNode,
} from './interfaces/node';
import {TStylingRange} from './interfaces/styling';
import {HEADER_OFFSET, TView} from './interfaces/view';
import {assertPureTNodeType} from './node_assert';
import {
  getCurrentParentTNode,
  getCurrentTNodePlaceholderOk,
  isCurrentTNodeParent,
  isInI18nBlock,
  isInSkipHydrationBlock,
  setCurrentTNode,
} from './state';

/**
 * TNode를 생성하고 저장하고, 이를 트리에 연결합니다.
 *
 * @param tView 현재 `TView`.
 * @param index TNode가 저장되어야 하는 인덱스 (view인 경우 null, 저장되지 않음).
 * @param type 생성할 TNode의 유형
 * @param native 해당 노드의 네이티브 요소, 해당되는 경우
 * @param name 관련 네이티브 요소의 태그 이름, 해당되는 경우
 * @param attrs 네이티브 요소의 모든 attrs, 해당되는 경우
 */
export function getOrCreateTNode(
  tView: TView,
  index: number,
  type: TNodeType.Element | TNodeType.Text,
  name: string | null,
  attrs: TAttributes | null,
): TElementNode;
export function getOrCreateTNode(
  tView: TView,
  index: number,
  type: TNodeType.Container,
  name: string | null,
  attrs: TAttributes | null,
): TContainerNode;
export function getOrCreateTNode(
  tView: TView,
  index: number,
  type: TNodeType.Projection,
  name: null,
  attrs: TAttributes | null,
): TProjectionNode;
export function getOrCreateTNode(
  tView: TView,
  index: number,
  type: TNodeType.ElementContainer,
  name: string | null,
  attrs: TAttributes | null,
): TElementContainerNode;
export function getOrCreateTNode(
  tView: TView,
  index: number,
  type: TNodeType.Icu,
  name: null,
  attrs: TAttributes | null,
): TElementContainerNode;
export function getOrCreateTNode(
  tView: TView,
  index: number,
  type: TNodeType.LetDeclaration,
  name: null,
  attrs: null,
): TLetDeclarationNode;
export function getOrCreateTNode(
  tView: TView,
  index: number,
  type: TNodeType,
  name: string | null,
  attrs: TAttributes | null,
): TElementNode &
  TContainerNode &
  TElementContainerNode &
  TProjectionNode &
  TIcuContainerNode &
  TLetDeclarationNode {
  ngDevMode &&
    index !== 0 && // 0은 허위 노드이며 괜찮습니다. 추가 컨텍스트는 `view_engine_compatibility`의
    // `createContainerRef`를 참조하세요.
    assertGreaterThanOrEqual(index, HEADER_OFFSET, 'TNodes는 LView 헤더에 있을 수 없습니다.');
  // 이 함수를 짧게 유지하여 VM이 인라인될 수 있도록 합니다.
  ngDevMode && assertPureTNodeType(type);
  let tNode = tView.data[index] as TNode;
  if (tNode === null) {
    tNode = createTNodeAtIndex(tView, index, type, name, attrs);
    if (isInI18nBlock()) {
      // i18n 블록 안에 있으면 모든 요소는 `Placeholder`를 통해 미리 선언되어야 합니다.
      // 추가 컨텍스트는 `TNodeType.Placeholder` 및 `LFrame.inI18n`을 참조하세요.
      // `TNode`가 미리 선언되지 않았다면 이는 언급되지 않았고 이는 제거되었음을 의미하므로
      // 분리된 것으로 표시합니다.
      tNode.flags |= TNodeFlags.isDetached;
    }
  } else if (tNode.type & TNodeType.Placeholder) {
    tNode.type = type;
    tNode.value = name;
    tNode.attrs = attrs;
    const parent = getCurrentParentTNode();
    tNode.injectorIndex = parent === null ? -1 : parent.injectorIndex;
    ngDevMode && assertTNodeForTView(tNode, tView);
    ngDevMode && assertEqual(index, tNode.index, '같은 인덱스를 기대합니다.');
  }
  setCurrentTNode(tNode, true);
  return tNode as TElementNode &
    TContainerNode &
    TElementContainerNode &
    TProjectionNode &
    TIcuContainerNode;
}

export function createTNodeAtIndex(
  tView: TView,
  index: number,
  type: TNodeType,
  name: string | null,
  attrs: TAttributes | null,
) {
  const currentTNode = getCurrentTNodePlaceholderOk();
  const isParent = isCurrentTNodeParent();
  const parent = isParent ? currentTNode : currentTNode && currentTNode.parent;

  // 부모는 구성 요소 경계를 넘을 수 없으므로 구성 요소가 여러 곳에서 사용될 수 있습니다.
  const tNode = (tView.data[index] = createTNode(
    tView,
    parent as TElementNode | TContainerNode,
    type,
    index,
    name,
    attrs,
  ));

  // 주어진 뷰의 첫 번째 자식 노드에 대한 포인터를 할당합니다. 첫 번째 노드는 항상 인덱스 0일 필요는 없으며
  // i18n의 경우 인덱스 0은 `i18nStart` 지침일 수 있으며 첫 번째 노드는 인덱스 1 이상이므로
  // 단순히 노드 인덱스를 확인할 수 없습니다.
  linkTNodeInTView(tView, tNode, currentTNode, isParent);

  return tNode;
}

function linkTNodeInTView(
  tView: TView,
  tNode: TNode,
  currentTNode: TNode | null,
  isParent: boolean,
) {
  if (tView.firstChild === null) {
    tView.firstChild = tNode;
  }
  if (currentTNode !== null) {
    if (isParent) {
      // FIXME(misko): 이 로직은 불필요하게 복잡해 보입니다. 간단히 할 수 있을까요?
      if (currentTNode.child == null && tNode.parent !== null) {
        // 우리는 같은 뷰 안에 있으며 이는 부모 뷰에 내용 노드를 추가하는 것을 의미합니다.
        currentTNode.child = tNode;
      }
    } else {
      if (currentTNode.next === null) {
        // i18n의 경우 `currentTNode`가 이미 연결되어 있을 수 있으며, 이 경우
        // i18n이 생성한 링크를 끊고 싶지 않습니다.
        currentTNode.next = tNode;
        tNode.prev = currentTNode;
      }
    }
  }
}

/**
 * 인수로부터 TNode 객체를 생성합니다.
 *
 * @param tView 이 `TNode`가 속한 `TView`
 * @param tParent 부모 `TNode`
 * @param type 노드의 유형
 * @param index TView.data에서 TNode의 인덱스, HEADER_OFFSET에 조정됨
 * @param tagName 노드의 태그 이름
 * @param attrs 이 노드에 정의된 속성
 * @returns TNode 객체
 */
export function createTNode(
  tView: TView,
  tParent: TElementNode | TContainerNode | null,
  type: TNodeType.Container,
  index: number,
  tagName: string | null,
  attrs: TAttributes | null,
): TContainerNode;
export function createTNode(
  tView: TView,
  tParent: TElementNode | TContainerNode | null,
  type: TNodeType.Element | TNodeType.Text,
  index: number,
  tagName: string | null,
  attrs: TAttributes | null,
): TElementNode;
export function createTNode(
  tView: TView,
  tParent: TElementNode | TContainerNode | null,
  type: TNodeType.ElementContainer,
  index: number,
  tagName: string | null,
  attrs: TAttributes | null,
): TElementContainerNode;
export function createTNode(
  tView: TView,
  tParent: TElementNode | TContainerNode | null,
  type: TNodeType.Icu,
  index: number,
  tagName: string | null,
  attrs: TAttributes | null,
): TIcuContainerNode;
export function createTNode(
  tView: TView,
  tParent: TElementNode | TContainerNode | null,
  type: TNodeType.Projection,
  index: number,
  tagName: string | null,
  attrs: TAttributes | null,
): TProjectionNode;
export function createTNode(
  tView: TView,
  tParent: TElementNode | TContainerNode | null,
  type: TNodeType.LetDeclaration,
  index: number,
  tagName: null,
  attrs: null,
): TLetDeclarationNode;
export function createTNode(
  tView: TView,
  tParent: TElementNode | TContainerNode | null,
  type: TNodeType,
  index: number,
  tagName: string | null,
  attrs: TAttributes | null,
): TNode;
export function createTNode(
  tView: TView,
  tParent: TElementNode | TContainerNode | null,
  type: TNodeType,
  index: number,
  value: string | null,
  attrs: TAttributes | null,
): TNode {
  ngDevMode &&
    index !== 0 && // 0은 허위 노드이며 괜찮습니다. 추가 컨텍스트는 `view_engine_compatibility`의
    // `createContainerRef`를 참조하세요.
    assertGreaterThanOrEqual(index, HEADER_OFFSET, 'TNodes는 LView 헤더에 있을 수 없습니다.');
  ngDevMode && assertNotSame(attrs, undefined, "'undefined'는 'attrs'의 유효한 값이 아닙니다.");
  ngDevMode && ngDevMode.tNode++;
  ngDevMode && tParent && assertTNodeForTView(tParent, tView);
  let injectorIndex = tParent ? tParent.injectorIndex : -1;
  let flags = 0;
  if (isInSkipHydrationBlock()) {
    flags |= TNodeFlags.inSkipHydrationBlock;
  }

  // TODO: 신호와 유사하게 프로토타입 상속을 사용하는 것이 도움이 될까요?
  const tNode = {
    type,
    index,
    insertBeforeIndex: null,
    injectorIndex,
    directiveStart: -1,
    directiveEnd: -1,
    directiveStylingLast: -1,
    componentOffset: -1,
    propertyBindings: null,
    flags,
    providerIndexes: 0,
    value: value,
    attrs: attrs,
    mergedAttrs: null,
    localNames: null,
    initialInputs: null,
    inputs: null,
    hostDirectiveInputs: null,
    outputs: null,
    hostDirectiveOutputs: null,
    directiveToIndex: null,
    tView: null,
    next: null,
    prev: null,
    projectionNext: null,
    child: null,
    parent: tParent,
    projection: null,
    styles: null,
    stylesWithoutHost: null,
    residualStyles: undefined,
    classes: null,
    classesWithoutHost: null,
    residualClasses: undefined,
    classBindings: 0 as TStylingRange,
    styleBindings: 0 as TStylingRange,
  };

  if (ngDevMode) {
    // 성능을 위해 tNode가 런타임 동안 같은 형태를 유지하는 것이 중요합니다.
    // (모든 코드가 모노모픽인지 확인하기 위해). 이 이유로 객체를 봉인하여
    // 클래스 전환을 방지합니다.
    Object.seal(tNode);
  }

  return tNode;
}
