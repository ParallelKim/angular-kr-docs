/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer} from '@angular/core/primitives/signals';

import {NotificationSource} from '../../change_detection/scheduling/zoneless_scheduling';
import {TNode} from '../interfaces/node';
import {isComponentHost} from '../interfaces/type_checks';
import {INJECTOR, LView} from '../interfaces/view';
import {getComponentLViewByIndex} from '../util/view_utils';
import {profiler} from '../profiler';
import {ProfilerEvent} from '../profiler_types';
import {ErrorHandler} from '../../error_handler';
import {markViewDirty} from '../instructions/mark_view_dirty';

/**
 * 이벤트 리스터를 래핑하여 조상 노드를 더럽히고 기본 동작을 방지하는 함수입니다,
 * 적용 가능한 경우.
 *
 * @param tNode 이 리스터와 관련된 TNode
 * @param lView 이 리스터를 포함하는 LView
 * @param listenerFn 호출할 리스터 함수
 * @param wrapWithPreventDefault 기본 동작을 방지할지 여부
 * (절차적 렌더러는 이미 이를 수행하므로 이러한 경우는 건너뛰어야 합니다)
 */
export function wrapListener(
  tNode: TNode,
  lView: LView<{} | null>,
  context: {} | null,
  listenerFn: (e?: any) => any,
): EventListener {
  // 참고: 리스터 등록을 최적화하기 위해 리스터 함수 자체에서 대부분의 작업을 수행하고 있습니다.
  return function wrapListenerIn_markDirtyAndPreventDefault(e: any) {
    // Ivy는 `Function`을 특별한 토큰으로 사용하여 함수를 언랩할 수 있도록
    // 하고, 이렇게 하면 `DebugNode.triggerEventHandler`로 프로그램적으로 호출될 수 있습니다.
    if (e === Function) {
      return listenerFn;
    }

    // View Engine과의 호환성을 유지하기 위해, 컴포넌트 호스트 노드의 이벤트는
    // 해당 컴포넌트 뷰 자체를 더럽히도록 해야 합니다 (즉, 소유하는 뷰).
    const startView = isComponentHost(tNode) ? getComponentLViewByIndex(tNode.index, lView) : lView;
    markViewDirty(startView, NotificationSource.Listener);

    let result = executeListenerWithErrorHandling(lView, context, listenerFn, e);
    // 방금 호출된 리스터 함수는 합쳐진 리스터를 가질 수 있으므로,
    // 그 존재 여부를 확인하고 필요에 따라 호출해야 합니다.
    let nextListenerFn = (<any>wrapListenerIn_markDirtyAndPreventDefault).__ngNextListenerFn__;
    while (nextListenerFn) {
      // 리스터가 명시적으로 false를 반환하는 경우 기본 동작을 방지해야 합니다.
      result = executeListenerWithErrorHandling(lView, context, nextListenerFn, e) && result;
      nextListenerFn = (<any>nextListenerFn).__ngNextListenerFn__;
    }

    return result;
  };
}

function executeListenerWithErrorHandling(
  lView: LView,
  context: {} | null,
  listenerFn: (e?: any) => any,
  e: any,
): boolean {
  const prevConsumer = setActiveConsumer(null);
  try {
    profiler(ProfilerEvent.OutputStart, context, listenerFn);
    // 리스터에서 명시적으로 false를 반환하는 경우에만 preventDefault
    return listenerFn(e) !== false;
  } catch (error) {
    // TODO(atscott): 이 오류는 LView 주입기의 ErrorHandler가 아닌 애플리케이션 오류 처리기에 보고해야 합니다.
    handleError(lView, error);
    return false;
  } finally {
    profiler(ProfilerEvent.OutputEnd, context, listenerFn);
    setActiveConsumer(prevConsumer);
  }
}

/**
 * LView에서 발생한 오류를 처리합니다.
 * @deprecated 애플리케이션 오류 처리기에 보고하려면 handleUncaughtError를 사용하십시오.
 */
function handleError(lView: LView, error: any): void {
  const injector = lView[INJECTOR];
  if (!injector) {
    return;
  }
  injector.get(ErrorHandler, null)?.handleError(error);
}
