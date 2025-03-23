/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {REACTIVE_NODE, ReactiveNode} from '@angular/core/primitives/signals';

import {
  LView,
  PARENT,
  REACTIVE_TEMPLATE_CONSUMER,
  TVIEW,
  TView,
  TViewType,
} from './interfaces/view';
import {getLViewParent, markAncestorsForTraversal, markViewForRefresh} from './util/view_utils';
import {assertDefined} from '../util/assert';

let freeConsumers: ReactiveNode[] = [];
export interface ReactiveLViewConsumer extends ReactiveNode {
  lView: LView | null;
}

/**
 * 지정된 LView를 가리키는 새로운 템플릿 소비자를 생성합니다.
 * 때때로, 이전에 생성된 소비자가 재사용될 수 있으며, 이는 할당을 절약하기 위함입니다. 그런 경우에는 LView가 업데이트됩니다.
 */
export function getOrBorrowReactiveLViewConsumer(lView: LView): ReactiveLViewConsumer {
  return lView[REACTIVE_TEMPLATE_CONSUMER] ?? borrowReactiveLViewConsumer(lView);
}

function borrowReactiveLViewConsumer(lView: LView): ReactiveLViewConsumer {
  const consumer = freeConsumers.pop() ?? Object.create(REACTIVE_LVIEW_CONSUMER_NODE);
  consumer.lView = lView;
  return consumer;
}

export function maybeReturnReactiveLViewConsumer(consumer: ReactiveLViewConsumer): void {
  if (consumer.lView![REACTIVE_TEMPLATE_CONSUMER] === consumer) {
    // 소비자가 커밋되었습니다.
    return;
  }
  consumer.lView = null;
  freeConsumers.push(consumer);
}

export const REACTIVE_LVIEW_CONSUMER_NODE: Omit<ReactiveLViewConsumer, 'lView'> = {
  ...REACTIVE_NODE,
  consumerIsAlwaysLive: true,
  kind: 'template',
  consumerMarkedDirty: (node: ReactiveLViewConsumer) => {
    markAncestorsForTraversal(node.lView!);
  },
  consumerOnSignalRead(this: ReactiveLViewConsumer): void {
    this.lView![REACTIVE_TEMPLATE_CONSUMER] = this;
  },
};

/**
 * 소비자가 없어야 하는 `LView`와 함께 사용할 임시 소비자를 만듭니다.
 * LView에 이미 소비자가 있는 경우, 기존 소비자를 반환합니다.
 *
 * 이는 일부 API가 소비자가 없어야 하는 LView에서 직접 변경 감지를 유발할 수 있기 때문에 필요합니다(오늘날의 임베디드 뷰).
 * 결과적으로 호스트 구성 요소에서 변경 감지를 실행할 때 활성 소비자가 없게 되고 LView 템플릿의 모든 신호가 추적되지 않습니다.
 * 대신, 우리는 첫 번째 부모를 마킹하는 이 임시 소비자를 생성하여 새로 고침을 위해 소비자가 _있어야_ 합니다.
 * 변경 감지가 해당 새로 고침의 일부로 실행되면, 이 소비자는 버려집니다.
 * 그 이유는 그러면 부모 소비자가 신호를 추적하게 되기 때문입니다.
 */
export function getOrCreateTemporaryConsumer(lView: LView): ReactiveLViewConsumer {
  const consumer = lView[REACTIVE_TEMPLATE_CONSUMER] ?? Object.create(TEMPORARY_CONSUMER_NODE);
  consumer.lView = lView;
  return consumer;
}

export const TEMPORARY_CONSUMER_NODE = {
  ...REACTIVE_NODE,
  consumerIsAlwaysLive: true,
  kind: 'template',
  consumerMarkedDirty: (node: ReactiveLViewConsumer) => {
    let parent = getLViewParent(node.lView!);
    while (parent && !viewShouldHaveReactiveConsumer(parent[TVIEW])) {
      parent = getLViewParent(parent);
    }
    if (!parent) {
      // 소비자가 있어야 하는 적절한 부모를 찾을 수 없으면,
      // 우리는 이 LView를 애플리케이션 동기화의 일부로 적절하게 새로 고칠 방법이 없습니다.
      return;
    }

    markViewForRefresh(parent);
  },
  consumerOnSignalRead(this: ReactiveLViewConsumer): void {
    this.lView![REACTIVE_TEMPLATE_CONSUMER] = this;
  },
};

/**
 * 뷰가 자체 반응 소비자 노드를 가져야 하는지 여부를 나타냅니다.
 *
 * 현재 설계에서 모든 임베디드 뷰는 컴포넌트 뷰와 소비자를 공유합니다. 이로 인해 우리는
 * 개별 뷰 수준이 아니라 컴포넌트 수준에서 새로 고칠 수 있습니다. 또한 루트 뷰는
 * 자체 반응 노드를 가지는데, 이는 루트 컴포넌트가 컴포넌트의 호스트 바인딩을 실행하는
 * 호스트 뷰를 가질 것이기 때문입니다. 이것도 소비자에서 추적해야 합니다.
 *
 * 컴포넌트별보다 더 세분화된 변경 감지를 얻으려면, 여기에서 조건을 업데이트하여
 * 주어진 뷰가 부모 컴포넌트와 독립적으로 더럽혀질 수 있는 반응 소비자를 얻도록 하면 됩니다.
 * 예를 들어, 신호 컴포넌트를 위한 임베디드 뷰는 새로운 유형 "SignalEmbeddedView"로 생성될 수 있으며,
 * 신호 컴포넌트에 대한 세분화된 개별 뷰 변경 감지를 얻기 위해 조건을 업데이트할 필요조차 없습니다.
 */
export function viewShouldHaveReactiveConsumer(tView: TView) {
  return tView.type !== TViewType.Embedded;
}
