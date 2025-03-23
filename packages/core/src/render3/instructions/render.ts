/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {retrieveHydrationInfo} from '../../hydration/utils';
import {assertEqual, assertNotReactive} from '../../util/assert';
import {RenderFlags} from '../interfaces/definition';
import {
  CONTEXT,
  FLAGS,
  HOST,
  HYDRATION,
  INJECTOR,
  LView,
  LViewFlags,
  QUERIES,
  TVIEW,
  TView,
} from '../interfaces/view';
import {profiler} from '../profiler';
import {ProfilerEvent} from '../profiler_types';
import {executeViewQueryFn, refreshContentQueries} from '../queries/query_execution';
import {enterView, leaveView} from '../state';
import {getComponentLViewByIndex, isCreationMode} from '../util/view_utils';

import {executeTemplate} from './shared';

export function renderComponent(hostLView: LView, componentHostIdx: number) {
  ngDevMode && assertEqual(isCreationMode(hostLView), true, '생성 모드에서 실행되어야 함');
  const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
  const componentTView = componentView[TVIEW];
  syncViewWithBlueprint(componentTView, componentView);

  const hostRNode = componentView[HOST];
  // TransferState를 통해 DOM에서 검색된 수화 정보로 LView를 채움.
  if (hostRNode !== null && componentView[HYDRATION] === null) {
    componentView[HYDRATION] = retrieveHydrationInfo(hostRNode, componentView[INJECTOR]);
  }

  profiler(ProfilerEvent.ComponentStart);

  renderView(componentTView, componentView, componentView[CONTEXT]);

  profiler(ProfilerEvent.ComponentEnd, componentView[CONTEXT] as any as {});
}

/**
 * LView 인스턴스가 청사진과 동기화되지 않았을 경우 동기화합니다.
 *
 * 일반적으로 청사진과 해당 보기 인스턴스는 항상 동기화되어야 하므로 여기의 루프는
 * 건너뛰어질 것입니다. 그러나 다음 두 개의 구성 요소가 나란히 있을 경우를 고려하십시오:
 *
 * 앱 템플릿:
 * ```html
 * <comp></comp>
 * <comp></comp>
 * ```
 *
 * 다음과 같은 일이 발생합니다:
 * 1. 앱 템플릿이 처리되기 시작합니다.
 * 2. 첫 번째 <comp>가 구성 요소로 일치하고 해당 LView가 생성됩니다.
 * 3. 두 번째 <comp>가 구성 요소로 일치하고 해당 LView가 생성됩니다.
 * 4. 앱 템플릿 처리가 완료되므로 이제 자식 템플릿을 확인할 때입니다.
 * 5. 첫 번째 <comp> 템플릿이 확인됩니다. 지시문이 있으므로 그 정의가 청사진으로 푸시됩니다.
 * 6. 두 번째 <comp> 템플릿이 확인됩니다. 첫 번째 <comp> 템플릿에 의해 청사진이 업데이트되었지만,
 * 이 업데이트 이전에 LView가 생성되었으므로 동기화되지 않았습니다.
 *
 * ngFor 루프 내의 포함된 뷰는 생성되는 즉시 처리되므로 절대 동기화되지 않습니다.
 *
 * @param tView 동기화 청사진을 포함하는 `TView`
 * @param lView 동기화할 보기
 */
export function syncViewWithBlueprint(tView: TView, lView: LView) {
  for (let i = lView.length; i < tView.blueprint.length; i++) {
    lView.push(tView.blueprint[i]);
  }
}

/**
 * 생성 모드에서 보기를 처리합니다. 이는 특정 순서로 여러 단계를 포함합니다:
 * - 보기 쿼리 함수를 생성합니다 (있다면);
 * - 생성 모드에서 템플릿 함수를 실행합니다;
 * - 정적 쿼리를 업데이트합니다 (있다면);
 * - 주어진 보기에서 정의된 자식 구성 요소를 생성합니다.
 */
export function renderView<T>(tView: TView, lView: LView<T>, context: T): void {
  ngDevMode && assertEqual(isCreationMode(lView), true, '생성 모드에서 실행되어야 함');
  ngDevMode && assertNotReactive(renderView.name);
  enterView(lView);
  try {
    const viewQuery = tView.viewQuery;
    if (viewQuery !== null) {
      executeViewQueryFn<T>(RenderFlags.Create, viewQuery, context);
    }

    // 이 뷰와 연결된 템플릿을 실행합니다. 루트 구성 요소 보기에는 템플릿 함수가
    // 정의되지 않을 수 있습니다.
    const templateFn = tView.template;
    if (templateFn !== null) {
      executeTemplate<T>(tView, lView, templateFn, RenderFlags.Create, context);
    }

    // 이 작업은 자식이 처리되기 전에 설정되어야 하며, 이는 재귀 구성 요소를 지원합니다.
    // 최초 생성 실행 직후 false로 설정해야 합니다.
    // ngFor 루프에서 모든 뷰가 업데이트 모드가 실행되기 전에 함께 생성됩니다.
    // 처음 생성 패스가 꺼진 뒤 이 값을 설정하지 않으면 인스턴스가 지시문
    // 매칭 등을 반복 수행합니다.
    if (tView.firstCreatePass) {
      tView.firstCreatePass = false;
    }

    // 이 뷰에서 모든 활성 쿼리를 더럽혀진 상태로 표시합니다. 이는 신호 기반 쿼리의
    // 결과를 원자적으로 읽을 수 있는 명확한 표시 지점이 필요합니다 (특정 보기의 경우).
    lView[QUERIES]?.finishViewCreation(tView);

    // 우리는 생성 모드에서 `static`으로 표시된 콘텐츠 쿼리를 해결합니다.
    // 동적 콘텐츠 쿼리는 변경 감지 중 (즉, 업데이트 모드) 해결되며,
    // 포함된 뷰가 새로 고침됩니다 (위 블록 참조).
    if (tView.staticContentQueries) {
      refreshContentQueries(tView, lView);
    }

    // 자식 구성 요소가 프로젝션 컨테이너를 가질 경우,
    // 자식 구성 요소가 처리되기 전에 쿼리 결과를 실제화해야 합니다.
    // LContainer가 존재해야 하므로 포함된 뷰가 적절히 컨테이너에 부착됩니다.
    if (tView.staticViewQueries) {
      executeViewQueryFn<T>(RenderFlags.Update, tView.viewQuery!, context);
    }

    // 자식 구성 요소 보기를 렌더링합니다.
    const components = tView.components;
    if (components !== null) {
      renderChildComponents(lView, components);
    }
  } catch (error) {
    // 첫 번째 템플릿 통과를 오류로 인해 통과하지 못했다면
    // 보기 상태를 손상된 것으로 표시하여 복구를 시도할 수 있도록 합니다.
    if (tView.firstCreatePass) {
      tView.incompleteFirstPass = true;
      tView.firstCreatePass = false;
    }

    throw error;
  } finally {
    lView[FLAGS] &= ~LViewFlags.CreationMode;
    leaveView();
  }
}

/** 현재 보기에서 자식 구성 요소를 렌더링합니다 (생성 모드). */
function renderChildComponents(hostLView: LView, components: number[]): void {
  for (let i = 0; i < components.length; i++) {
    renderComponent(hostLView, components[i]);
  }
}
