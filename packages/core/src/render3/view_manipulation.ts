/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer} from '@angular/core/primitives/signals';

import {Injector} from '../di/injector';
import {DehydratedContainerView} from '../hydration/interfaces';
import {hasInSkipHydrationBlockFlag} from '../hydration/skip_hydration';
import {assertDefined} from '../util/assert';

import {assertLContainer, assertTNodeForLView} from './assert';
import {renderView} from './instructions/render';
import {TNode} from './interfaces/node';
import {DECLARATION_LCONTAINER, FLAGS, LView, LViewFlags, QUERIES} from './interfaces/view';
import {createLView} from './view/construction';

export function createAndRenderEmbeddedLView<T>(
  declarationLView: LView<unknown>,
  templateTNode: TNode,
  context: T,
  options?: {
    injector?: Injector;
    embeddedViewInjector?: Injector;
    dehydratedView?: DehydratedContainerView | null;
  },
): LView<T> {
  const prevConsumer = setActiveConsumer(null);
  try {
    const embeddedTView = templateTNode.tView!;
    ngDevMode && assertDefined(embeddedTView, 'TView는 템플릿 노드에 대해 정의되어야 합니다.');
    ngDevMode && assertTNodeForLView(templateTNode, declarationLView);

    // 포함된 뷰는 선언된 뷰의 변경 감지 전략을 따릅니다.
    const isSignalView = declarationLView[FLAGS] & LViewFlags.SignalView;
    const viewFlags = isSignalView ? LViewFlags.SignalView : LViewFlags.CheckAlways;
    const embeddedLView = createLView<T>(
      declarationLView,
      embeddedTView,
      context,
      viewFlags,
      null,
      templateTNode,
      null,
      null,
      options?.injector ?? null,
      options?.embeddedViewInjector ?? null,
      options?.dehydratedView ?? null,
    );

    const declarationLContainer = declarationLView[templateTNode.index];
    ngDevMode && assertLContainer(declarationLContainer);
    embeddedLView[DECLARATION_LCONTAINER] = declarationLContainer;

    const declarationViewLQueries = declarationLView[QUERIES];
    if (declarationViewLQueries !== null) {
      embeddedLView[QUERIES] = declarationViewLQueries.createEmbeddedView(embeddedTView);
    }

    // 뷰의 생성 모드를 실행합니다.
    renderView(embeddedTView, embeddedLView, context);

    return embeddedLView;
  } finally {
    setActiveConsumer(prevConsumer);
  }
}

/**
 * 뷰에 속하는 요소가 DOM에 삽입되어야 하는지 여부를 반환합니다.
 * 클라이언트 전용 경우, DOM 요소는 항상 삽입됩니다.
 * 수화(hydration) 경우에는, 뷰에 대한 직렬화된 정보가 사용 가능한지와
 * 뷰가 "skip hydration" 블록에 있지 않은지 확인합니다.
 * (이 경우 뷰 내용이 재생성되었으므로 삽입이 필요합니다.)
 */
export function shouldAddViewToDom(
  tNode: TNode,
  dehydratedView?: DehydratedContainerView | null,
): boolean {
  return (
    !dehydratedView || dehydratedView.firstChild === null || hasInSkipHydrationBlockFlag(tNode)
  );
}
