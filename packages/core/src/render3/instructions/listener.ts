/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TNode, TNodeType} from '../interfaces/node';
import {GlobalTargetResolver, Renderer} from '../interfaces/renderer';
import {RElement, RNode} from '../interfaces/renderer_dom';
import {isDirectiveHost} from '../interfaces/type_checks';
import {CLEANUP, CONTEXT, LView, RENDERER, TView} from '../interfaces/view';
import {assertTNodeType} from '../node_assert';
import {getCurrentDirectiveDef, getCurrentTNode, getLView, getTView} from '../state';
import {
  getNativeByTNode,
  getOrCreateLViewCleanup,
  getOrCreateTViewCleanup,
  unwrapRNode,
} from '../util/view_utils';

import {listenToOutput} from '../view/directive_outputs';
import {wrapListener} from '../view/listeners';
import {loadComponentRenderer} from './shared';

/**
 * 서버 사이드 렌더링 애플리케이션을 위한 이벤트 재생 기능을 비활성화하는 함수에 대한 참조를 포함합니다.
 * 이 함수는 `withEventReplay()` 호출을 통해 이벤트 재생 기능이 활성화될 때 실제 구현으로 재정의됩니다.
 */
let stashEventListener = (el: RNode, eventName: string, listenerFn: (e?: any) => any) => {};

export function setStashFn(fn: typeof stashEventListener) {
  stashEventListener = fn;
}

/**
 * 현재 노드에 이벤트 리스너를 추가합니다.
 *
 * 노드의 지시문 중 하나에 출력이 존재하는 경우, 출력에 구독하고 나중에 정리를 위해 구독을 저장합니다.
 *
 * @param eventName 이벤트의 이름
 * @param listenerFn 이벤트가 발생할 때 호출할 함수
 * @param eventTargetResolver 이 리스너가 전역 객체(예: window, document 또는 body)에 연결되어야 하는 경우 전역 대상 정보를 반환하는 함수
 *
 * @codeGenApi
 */
export function ɵɵlistener(
  eventName: string,
  listenerFn: (e?: any) => any,
  eventTargetResolver?: GlobalTargetResolver,
): typeof ɵɵlistener {
  const lView = getLView<{} | null>();
  const tView = getTView();
  const tNode = getCurrentTNode()!;
  listenerInternal(
    tView,
    lView,
    lView[RENDERER],
    tNode,
    eventName,
    listenerFn,
    eventTargetResolver,
  );
  return ɵɵlistener;
}

/**
 * 컴포넌트 또는 지시문에서 합성 호스트 리스너(예: `(@foo.start)`)를 등록합니다.
 *
 * 이 명령어는 호환성을 위한 것이며 합성 호스트 리스너(예: `@HostListener('@foo.start')`)가
 * 컴포넌트의 렌더러에서 올바르게 렌더링되도록 설계되었습니다. 일반적으로 모든 호스트 리스너는
 * 부모 컴포넌트의 렌더러로 평가되지만, 애니메이션 @triggers 의 경우, 하위 컴포넌트의 렌더러로
 * 평가되어야 합니다(애니메이션 트리거가 정의되는 곳).
 *
 * 이 명령어를 `listener`의 대체물로 사용하지 마세요. 이 명령어는 ViewEngine의 호스트 바인딩 동작과의
 * 호환성을 보장하기 위해서만 존재합니다.
 *
 * @param eventName 이벤트의 이름
 * @param listenerFn 이벤트가 발생할 때 호출할 함수
 * @param useCapture 이벤트 리스너에서 캡처를 사용할지 여부
 * @param eventTargetResolver 이 리스너가 전역 객체(예: window, document 또는 body)에 연결되어야 하는 경우 전역 대상 정보를 반환하는 함수
 *
 * @codeGenApi
 */
export function ɵɵsyntheticHostListener(
  eventName: string,
  listenerFn: (e?: any) => any,
): typeof ɵɵsyntheticHostListener {
  const tNode = getCurrentTNode()!;
  const lView = getLView<{} | null>();
  const tView = getTView();
  const currentDef = getCurrentDirectiveDef(tView.data);
  const renderer = loadComponentRenderer(currentDef, tNode, lView);
  listenerInternal(tView, lView, renderer, tNode, eventName, listenerFn);
  return ɵɵsyntheticHostListener;
}

/**
 * 주어진 요소에 대해 특정 이름의 이벤트 핸들러가 이미 등록되어 있는지 확인하는 유틸리티 함수입니다.
 * TView.cleanup 데이터 구조를 사용하여 특정 요소에 대해 등록된 이벤트를 확인합니다.
 */
function findExistingListener(
  tView: TView,
  lView: LView,
  eventName: string,
  tNodeIdx: number,
): ((e?: any) => any) | null {
  const tCleanup = tView.cleanup;
  if (tCleanup != null) {
    for (let i = 0; i < tCleanup.length - 1; i += 2) {
      const cleanupEventName = tCleanup[i];
      if (cleanupEventName === eventName && tCleanup[i + 1] === tNodeIdx) {
        // 동일한 노드에서 일치하는 이벤트 이름을 찾았지만 아직 등록되지 않았을 수 있으므로,
        // LView 정리 데이터 구조의 항목을 명시적으로 확인해야 합니다.
        const lCleanup = lView[CLEANUP]!;
        const listenerIdxInLCleanup = tCleanup[i + 2];
        return lCleanup.length > listenerIdxInLCleanup ? lCleanup[listenerIdxInLCleanup] : null;
      }
      // TView.cleanup은 이벤트 핸들러 정리를 위한 4-요소 항목 또는 지시문 및 쿼리 제거 후크에 대한
      // 2-요소 항목의 혼합을 가질 수 있습니다. 따라서 tView.cleanup에서 2 또는 4 항목 블록을 반복하며
      // 리스너 정리(4 요소)를 탐지할 경우 2 요소를 건너뛰어야 합니다. 이 데이터 구조 레이아웃에 대한
      // 자세한 내용은 TView.cleanup의 문서를 확인하세요.
      if (typeof cleanupEventName === 'string') {
        i += 2;
      }
    }
  }
  return null;
}

export function listenerInternal(
  tView: TView,
  lView: LView<{} | null>,
  renderer: Renderer,
  tNode: TNode,
  eventName: string,
  listenerFn: (e?: any) => any,
  eventTargetResolver?: GlobalTargetResolver,
): void {
  const isTNodeDirectiveHost = isDirectiveHost(tNode);
  const firstCreatePass = tView.firstCreatePass;
  const tCleanup = firstCreatePass ? getOrCreateTViewCleanup(tView) : null;
  const context = lView[CONTEXT];

  // ɵɵlistener 명령문이 생성되어 실행될 때, 이 요소에 기본 리스너 또는 지시문 출력을
  // 등록해야 한다고 알고 있습니다. 따라서 리스너를 등록하고 LView에 정리 함수를 저장해야 합니다.
  const lCleanup = getOrCreateLViewCleanup(lView);

  ngDevMode && assertTNodeType(tNode, TNodeType.AnyRNode | TNodeType.AnyContainer);

  let processOutputs = true;

  // 네이티브 이벤트 리스너를 추가하는 것은 다음과 같은 경우에 적용됩니다:
  // - 해당 TNode가 DOM 요소를 나타냅니다.
  // - 이벤트 대상에 해결자가 있습니다(보통 전역 객체와 연결됩니다).
  if (tNode.type & TNodeType.AnyRNode || eventTargetResolver) {
    const native = getNativeByTNode(tNode, lView) as RElement;
    const target = eventTargetResolver ? eventTargetResolver(native) : native;
    const lCleanupIndex = lCleanup.length;
    const idxOrTargetGetter = eventTargetResolver
      ? (_lView: LView) => eventTargetResolver(unwrapRNode(_lView[tNode.index]))
      : tNode.index;

    // 현재 동작을 일치시키기 위해 모든 이벤트(출력을 포함하여)에 대해 기본 DOM 이벤트 리스너를 추가해야 합니다.

    // 동일한 이벤트에 대해 동일한 요소에서 여러 지시문이 이벤트 핸들러 함수를 등록하려고 할 수 있습니다.
    // 이 경우 여러 기본 리스너 등록을 피하는 것이 좋습니다. 각 등록은 NgZone에 의해 가로채지며
    // 변경 감지를 촉발하게 됩니다. 이는 단일 사용자 작업으로 여러 변경 감지가 발생하게 됩니다.
    // 이러한 상황을 피하기 위해 동일한 요소와 동일한 유형의 이벤트에 대해 한 번만 기본 핸들러를 등록합니다.
    //
    // 여러 핸들러 함수가 있는 경우, 첫 번째 핸들러 함수를 기본 이벤트 리스너로 등록하고
    // 이후 다른 핸들러 함수를 첫 번째 기본 핸들러 함수에 연결하여 처리합니다.
    let existingListener = null;
    // 연쇄 등록이 발생하지 않는 것은 대체 대상을 지정한 이벤트(ex. (document:click))에만 적용됩니다.
    // 이는 뷰 엔진과의 하위 호환성을 유지하기 위한 것입니다.
    // 주어진 노드에 지시문이 없으면 기존 리스너를 검색할 필요가 없습니다.
    if (!eventTargetResolver && isTNodeDirectiveHost) {
      existingListener = findExistingListener(tView, lView, eventName, tNode.index);
    }
    if (existingListener !== null) {
      // 중복된 리스너 리스트에 새로운 리스너를 추가하여 등록된 순서를 유지합니다.
      // 성능상의 이유로, 마지막 리스너에 대한 참조를 유지하여 새로운 리스너를 추가할 때마다
      // 전체 세트를 반복하지 않도록 합니다.
      const lastListenerFn = (<any>existingListener).__ngLastListenerFn__ || existingListener;
      lastListenerFn.__ngNextListenerFn__ = listenerFn;
      (<any>existingListener).__ngLastListenerFn__ = listenerFn;
      processOutputs = false;
    } else {
      listenerFn = wrapListener(tNode, lView, context, listenerFn);
      stashEventListener(target as RElement, eventName, listenerFn);
      const cleanupFn = renderer.listen(target as RElement, eventName, listenerFn);

      lCleanup.push(listenerFn, cleanupFn);
      tCleanup && tCleanup.push(eventName, idxOrTargetGetter, lCleanupIndex, lCleanupIndex + 1);
    }
  } else {
    // 기본 리스너를 추가할 수 없는 경우에도, 리스너를 래핑하여 OnPush 조상들이 이벤트가 발생할 때 더러워지도록 합니다.
    listenerFn = wrapListener(tNode, lView, context, listenerFn);
  }

  if (processOutputs) {
    const outputConfig = tNode.outputs?.[eventName];
    const hostDirectiveOutputConfig = tNode.hostDirectiveOutputs?.[eventName];

    if (hostDirectiveOutputConfig && hostDirectiveOutputConfig.length) {
      for (let i = 0; i < hostDirectiveOutputConfig.length; i += 2) {
        const index = hostDirectiveOutputConfig[i] as number;
        const lookupName = hostDirectiveOutputConfig[i + 1] as string;
        listenToOutput(
          tNode,
          tView,
          lView,
          index,
          lookupName,
          eventName,
          listenerFn,
          lCleanup,
          tCleanup,
        );
      }
    }

    if (outputConfig && outputConfig.length) {
      for (const index of outputConfig) {
        listenToOutput(
          tNode,
          tView,
          lView,
          index,
          eventName,
          eventName,
          listenerFn,
          lCleanup,
          tCleanup,
        );
      }
    }
  }
}
