/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TNode, TNodeFlags} from '../render3/interfaces/node';
import {RElement} from '../render3/interfaces/renderer_dom';

/**
 * 수조 경계 노드(컴포넌트 호스트 노드)에 추가할 수 있는 속성 이름으로,
 * 해당 경계 내의 콘텐츠에 대한 수조를 비활성화합니다.
 */
export const SKIP_HYDRATION_ATTR_NAME = 'ngSkipHydration';

/** 대소문자를 구분하지 않는 비교에 사용되는 `ngSkipHydration` 속성의 소문자 이름. */
const SKIP_HYDRATION_ATTR_NAME_LOWER_CASE = 'ngskiphydration';

/**
 * 주어진 TNode가 'ngSkipHydration' 속성을 가지고 있는지 확인하는 헬퍼 함수.
 */
export function hasSkipHydrationAttrOnTNode(tNode: TNode): boolean {
  const attrs = tNode.mergedAttrs;
  if (attrs === null) return false;
  // 항상 속성 이름만 보고 값을 건너뜁니다.
  for (let i = 0; i < attrs.length; i += 2) {
    const value = attrs[i];
    // 이것은 마커로, 정적 속성 섹션이 끝났음을 의미하므로 조기에 종료할 수 있습니다.
    if (typeof value === 'number') return false;
    if (typeof value === 'string' && value.toLowerCase() === SKIP_HYDRATION_ATTR_NAME_LOWER_CASE) {
      return true;
    }
  }
  return false;
}

/**
 * 주어진 RElement가 'ngSkipHydration' 속성을 가지고 있는지 확인하는 헬퍼 함수.
 */
export function hasSkipHydrationAttrOnRElement(rNode: RElement): boolean {
  return rNode.hasAttribute(SKIP_HYDRATION_ATTR_NAME);
}

/**
 * TNode가 건너뛰기 수조 블록의 일부임을 나타내는 플래그가 있는지 확인합니다.
 */
export function hasInSkipHydrationBlockFlag(tNode: TNode): boolean {
  return (tNode.flags & TNodeFlags.inSkipHydrationBlock) === TNodeFlags.inSkipHydrationBlock;
}

/**
 * 주어진 노드가 수조 건너뛰기 블록 안에 있는지를 확인하는 헬퍼 함수로,
 * TNode 트리를 올라가면서 부모 노드 중에 수조 건너뛰기 속성을 가진 노드가 있는지 확인합니다.
 */
export function isInSkipHydrationBlock(tNode: TNode): boolean {
  if (hasInSkipHydrationBlockFlag(tNode)) {
    return true;
  }
  let currentTNode: TNode | null = tNode.parent;
  while (currentTNode) {
    if (hasInSkipHydrationBlockFlag(tNode) || hasSkipHydrationAttrOnTNode(currentTNode)) {
      return true;
    }
    currentTNode = currentTNode.parent;
  }
  return false;
}

/**
 * i18n 블록이 수조 건너뛰기 섹션에 있는지를 확인하기 위해 부모 TNode를 살펴보아
 * 이 TNode가 수조 건너뛰기 섹션에 있는지 또는 TNode가 `ngSkipHydration` 속성을 가지고 있는지를 확인합니다.
 */
export function isI18nInSkipHydrationBlock(parentTNode: TNode): boolean {
  return (
    hasInSkipHydrationBlockFlag(parentTNode) ||
    hasSkipHydrationAttrOnTNode(parentTNode) ||
    isInSkipHydrationBlock(parentTNode)
  );
}
