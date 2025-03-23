/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {DEHYDRATED_VIEWS, LContainer} from '../render3/interfaces/container';
import {RNode} from '../render3/interfaces/renderer_dom';

import {removeDehydratedViews} from './cleanup';
import {
  DehydratedContainerView,
  MULTIPLIER,
  NUM_ROOT_NODES,
  SerializedContainerView,
  TEMPLATE_ID,
} from './interfaces';
import {siblingAfter} from './node_lookup_utils';

/**
 * 현재 DOM 노드와 컨테이너 내 뷰에 대한 직렬화된 정보를 기반으로
 * DOM 구조를 탐색하며, 탈수된 뷰의 목록을 수집합니다.
 */
export function locateDehydratedViewsInContainer(
  currentRNode: RNode,
  serializedViews: SerializedContainerView[],
): [RNode, DehydratedContainerView[]] {
  const dehydratedViews: DehydratedContainerView[] = [];
  for (const serializedView of serializedViews) {
    // 직렬화된 정보를 기반으로 필요에 따라 뷰를 여러 번 반복합니다.
    // (예: *ngFor로 생성된 뷰의 경우).
    for (let i = 0; i < (serializedView[MULTIPLIER] ?? 1); i++) {
      const view: DehydratedContainerView = {
        data: serializedView,
        firstChild: null,
      };
      if (serializedView[NUM_ROOT_NODES] > 0) {
        // 이 뷰의 첫 번째 노드에 대한 참조를 유지합니다,
        // 그래서 템플릿 지침을 호출할 때 접근할 수 있습니다.
        view.firstChild = currentRNode as HTMLElement;

        // 이 뷰 다음 노드로 넘어갑니다. 이는
        // 다음 뷰의 첫 번째 노드이거나 컨테이너 내의 마지막 뷰 뒤의 앵커 주석
        // 노드가 될 수 있습니다.
        currentRNode = siblingAfter(serializedView[NUM_ROOT_NODES], currentRNode)!;
      }
      dehydratedViews.push(view);
    }
  }

  return [currentRNode, dehydratedViews];
}

/**
 * 주어진 lContainer에 저장된 일치하는 탈수된 뷰를 검색하는 함수에 대한 참조입니다.
 * 수분 공급이 활성화되지 않은 경우 기본적으로 `null`을 반환합니다.
 */
let _findMatchingDehydratedViewImpl: typeof findMatchingDehydratedViewImpl = () => null;

/**
 * LContainer에서 다음 탈수된 뷰를 검색하고
 * 주어진 템플릿 ID(이 뷰 인스턴스를 만드는 데 사용된 TView에서 유래한)와 일치하는지 확인합니다.
 * ID가 일치하지 않으면 예상치 못한 상태에 있으며
 * 화합 프로세스를 완료할 수 없음을 의미합니다. 따라서,
 * 이 LContainer의 모든 탈수된 뷰가 제거되고(상응하는 DOM 노드 포함)
 * 이 컨테이너에 탈수된 뷰가 없는 것처럼 렌더링이 수행됩니다.
 */
function findMatchingDehydratedViewImpl(
  lContainer: LContainer,
  template: string | null,
): DehydratedContainerView | null {
  const views = lContainer[DEHYDRATED_VIEWS];
  if (!template || views === null || views.length === 0) {
    return null;
  }
  const view = views[0];
  // 컨테이너의 첫 번째 탈수된 뷰가
  // 이 함수에 전달된 템플릿 ID와 일치하는지 확인합니다(탬플릿 ID는
  // 내장 뷰나 컴포넌트 뷰 인스턴스를 만드는 데 사용된 TView에서 유래).
  if (view.data[TEMPLATE_ID] === template) {
    // 만약 템플릿 ID가 일치하면 - 첫 번째 뷰를 추출하고 반환합니다.
    return views.shift()!;
  } else {
    // 그렇지 않으면 화합을 완료할 수 없는 상태에 처해
    // 이 컨테이너 내의 모든 탈수된 뷰를 제거합니다
    // (내부 데이터 구조에서 제거하고
    // DOM 트리에서 연관된 요소를 삭제합니다).
    removeDehydratedViews(lContainer);
    return null;
  }
}

export function enableFindMatchingDehydratedViewImpl() {
  _findMatchingDehydratedViewImpl = findMatchingDehydratedViewImpl;
}

export function findMatchingDehydratedView(
  lContainer: LContainer,
  template: string | null,
): DehydratedContainerView | null {
  return _findMatchingDehydratedViewImpl(lContainer, template);
}
