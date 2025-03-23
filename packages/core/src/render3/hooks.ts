/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer} from '@angular/core/primitives/signals';

import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  DoCheck,
  OnChanges,
  OnDestroy,
  OnInit,
} from '../interface/lifecycle_hooks';
import {assertDefined, assertEqual, assertNotEqual} from '../util/assert';

import {assertFirstCreatePass} from './assert';
import {NgOnChangesFeatureImpl} from './features/ng_onchanges_feature';
import {DirectiveDef} from './interfaces/definition';
import {TNode} from './interfaces/node';
import {
  FLAGS,
  HookData,
  InitPhaseState,
  LView,
  LViewFlags,
  PREORDER_HOOK_FLAGS,
  PreOrderHookFlags,
  TView,
} from './interfaces/view';
import {profiler} from './profiler';
import {ProfilerEvent} from './profiler_types';
import {isInCheckNoChangesMode} from './state';

/**
 * 주어진 `DirectiveDef`의 모든 지시자 생명 주기 후크를 주어진 `TView`에 추가합니다.
 *
 * *오직* 첫 번째 템플릿 패스에서만 실행해야 합니다.
 *
 * 제공된 `tView`에서 미리 주문 후크를 설정합니다.
 * 데이터 구조에 대한 자세한 정보는 {@link HookData}를 참조하십시오.
 *
 * @param directiveIndex LView에서 지시자의 인덱스
 * @param directiveDef tView에서 설정할 후크를 포함하는 정의
 * @param tView 현재 TView
 */
export function registerPreOrderHooks(
  directiveIndex: number,
  directiveDef: DirectiveDef<any>,
  tView: TView,
): void {
  ngDevMode && assertFirstCreatePass(tView);
  const {ngOnChanges, ngOnInit, ngDoCheck} = directiveDef.type.prototype as OnChanges &
    OnInit &
    DoCheck;

  if (ngOnChanges as Function | undefined) {
    const wrappedOnChanges = NgOnChangesFeatureImpl(directiveDef);
    (tView.preOrderHooks ??= []).push(directiveIndex, wrappedOnChanges);
    (tView.preOrderCheckHooks ??= []).push(directiveIndex, wrappedOnChanges);
  }

  if (ngOnInit) {
    (tView.preOrderHooks ??= []).push(0 - directiveIndex, ngOnInit);
  }

  if (ngDoCheck) {
    (tView.preOrderHooks ??= []).push(directiveIndex, ngDoCheck);
    (tView.preOrderCheckHooks ??= []).push(directiveIndex, ngDoCheck);
  }
}

/**
 *
 * 제공된 `tNode`의 지시자를 반복하여 초기화 후크가 아닌 후크를 실행할 수 있도록 큐에 추가합니다.
 *
 * `elementEnd()` 동안 실행되어야 하며,
 * 후크 실행 순서를 유지합니다.
 * 프로젝트된 구성 요소 및 지시자의 내용, 보기 및 파괴 후크는
 * 그 호스트보다 *먼저* 호출해야 합니다.
 *
 * 제공된 `tView`에서 내용, 보기 및 파괴 후크를 설정합니다.
 * 데이터 구조에 대한 자세한 정보는 {@link HookData}를 참조하십시오.
 *
 * 참고: 이는 `onChanges`, `onInit` 또는 `doCheck`를 설정하지 않습니다. 이는 `elementStart`에서 별도로 설정됩니다.
 *
 * @param tView 현재 TView
 * @param tNode 후크를 큐에 추가할 지시자를 검색할 TNode
 */
export function registerPostOrderHooks(tView: TView, tNode: TNode): void {
  ngDevMode && assertFirstCreatePass(tView);
  // 현재 후크 순서를 보존하기 위해 elementEnd()에서 지시자를 반복하는 것이 필요합니다.
  // 예상된 지시자를 처리하려면.
  for (let i = tNode.directiveStart, end = tNode.directiveEnd; i < end; i++) {
    const directiveDef = tView.data[i] as DirectiveDef<any>;
    ngDevMode && assertDefined(directiveDef, 'Expecting DirectiveDef');
    const lifecycleHooks: AfterContentInit &
      AfterContentChecked &
      AfterViewInit &
      AfterViewChecked &
      OnDestroy = directiveDef.type.prototype;
    const {
      ngAfterContentInit,
      ngAfterContentChecked,
      ngAfterViewInit,
      ngAfterViewChecked,
      ngOnDestroy,
    } = lifecycleHooks;

    if (ngAfterContentInit) {
      (tView.contentHooks ??= []).push(-i, ngAfterContentInit);
    }

    if (ngAfterContentChecked) {
      (tView.contentHooks ??= []).push(i, ngAfterContentChecked);
      (tView.contentCheckHooks ??= []).push(i, ngAfterContentChecked);
    }

    if (ngAfterViewInit) {
      (tView.viewHooks ??= []).push(-i, ngAfterViewInit);
    }

    if (ngAfterViewChecked) {
      (tView.viewHooks ??= []).push(i, ngAfterViewChecked);
      (tView.viewCheckHooks ??= []).push(i, ngAfterViewChecked);
    }

    if (ngOnDestroy != null) {
      (tView.destroyHooks ??= []).push(i, ngOnDestroy);
    }
  }
}

/**
 * 후크 실행에는 복잡한 논리가 필요합니다.
 * 2가지 제약조건을 처리해야 하므로:
 *
 * 1. 초기화 후크 (ngOnInit, ngAfterContentInit, ngAfterViewInit)는 여러 변경 감지 주기 동안 한 번만 실행되어야 합니다.
 * 일부 후크가 예외를 발생시키거나 누군가가 재귀적으로 변경 감지 주기를 트리거하더라도 마찬가지입니다.
 * 이를 해결하기 위해 이러한 초기화 후크의 실행 상태를 추적해야 합니다.
 * 이는 뷰에 플래그를 저장하고 유지하는 것으로 수행됩니다: {@link InitPhaseState}와 해당 단계 내 인덱스.
 * 이들은 다음 구조에서 커서처럼 볼 수 있습니다:
 * [[onInit1, onInit2], [afterContentInit1], [afterViewInit1, afterViewInit2, afterViewInit3]]
 * LView[FLAGS]에 플래그로 저장됩니다.
 *
 * 2. 미리 주문 후크는 선택 지침으로 인해 배치로 실행될 수 있습니다.
 * 그 실행을 일시 중지 및 재개할 수 있도록 처리 중인 후크 배열에 대한 상태도 필요합니다:
 * - 실행할 다음 후크의 인덱스
 * - 배열의 처리된 부분에서 이미 발견된 초기화 후크의 수
 * 이들은 LView[PREORDER_HOOK_FLAGS]에 플래그로 저장됩니다.
 */

/**
 * 초기화 후크가 한 번 실행된 뷰를 주어진 상태에서 전주문 체크 후크(OnChanges, DoChanges)를 실행합니다.
 * 이는 초기 후크 관련 플래그의 읽기 / 쓰기를 건너뛸 수 있는 executeInitAndCheckPreOrderHooks의 간단한 버전입니다.
 * @param lView 후크가 정의된 LView
 * @param hooks 실행할 후크
 * @param nodeIndex 값에 따라 3가지 경우:
 * - undefined: 배열의 모든 후크가 실행되어야 합니다 (후주문 케이스)
 * - null: 저장된 인덱스부터 배열의 끝까지 후크를 실행합니다 (전주문 케이스, 남은 후크를 플러시할 때)
 * - number: 저장된 인덱스부터 해당 노드 인덱스까지 후크를 실행합니다( 전주문 케이스, select(number)를 실행할 때)
 */
export function executeCheckHooks(lView: LView, hooks: HookData, nodeIndex?: number | null) {
  callHooks(lView, hooks, InitPhaseState.InitPhaseCompleted, nodeIndex);
}

/**
 * 초기화 후크가 실행할 수 있는 대기 중인 경우에 대해 후주문 초기화 및 체크 후크 (AfterContentInit, AfterContentChecked, AfterViewInit, AfterViewChecked)를 실행합니다.
 * @param lView 후크가 정의된 LView
 * @param hooks 실행할 후크
 * @param initPhase 후크가 실행되어야 하는 단계
 * @param nodeIndex 값에 따라 3가지 경우:
 * - undefined: 배열의 모든 후크가 실행되어야 합니다 (후주문 케이스)
 * - null: 저장된 인덱스부터 배열의 끝까지 후크를 실행합니다 (전주문 케이스, 남은 후크를 플러시할 때)
 * - number: 저장된 인덱스부터 해당 노드 인덱스까지 후크를 실행합니다( 전주문 케이스, select(number)를 실행할 때)
 */
export function executeInitAndCheckHooks(
  lView: LView,
  hooks: HookData,
  initPhase: InitPhaseState,
  nodeIndex?: number | null,
) {
  ngDevMode &&
    assertNotEqual(
      initPhase,
      InitPhaseState.InitPhaseCompleted,
      'Init pre-order hooks should not be called more than once',
    );
  if ((lView[FLAGS] & LViewFlags.InitPhaseStateMask) === initPhase) {
    callHooks(lView, hooks, initPhase, nodeIndex);
  }
}

export function incrementInitPhaseFlags(lView: LView, initPhase: InitPhaseState): void {
  ngDevMode &&
    assertNotEqual(
      initPhase,
      InitPhaseState.InitPhaseCompleted,
      'Init hooks phase should not be incremented after all init hooks have been run.',
    );
  let flags = lView[FLAGS];
  if ((flags & LViewFlags.InitPhaseStateMask) === initPhase) {
    flags &= LViewFlags.IndexWithinInitPhaseReset;
    flags += LViewFlags.InitPhaseStateIncrementer;
    lView[FLAGS] = flags;
  }
}

/**
 * 초기 LView 패스가 아닌 경우 초기 후크를 건너뛰고
 * 해당 컨텍스트로 생명 주기 후크를 호출합니다.
 *
 * @param currentView 현재 뷰
 * @param arr 후크가 발견된 배열
 * @param initPhaseState 초기화 단계의 현재 상태
 * @param currentNodeIndex 값에 따라 3가지 경우:
 * - undefined: 배열의 모든 후크가 실행되어야 합니다 (후주문 케이스)
 * - null: 저장된 인덱스부터 배열의 끝까지 후크를 실행합니다 (전주문 케이스, 남은 후크를 플러시할 때)
 * - number: 저장된 인덱스부터 해당 노드 인덱스까지 후크를 실행합니다( 전주문 케이스, select(number)를 실행할 때)
 */
function callHooks(
  currentView: LView,
  arr: HookData,
  initPhase: InitPhaseState,
  currentNodeIndex: number | null | undefined,
): void {
  ngDevMode &&
    assertEqual(
      isInCheckNoChangesMode(),
      false,
      'Hooks should never be run when in check no changes mode.',
    );
  const startIndex =
    currentNodeIndex !== undefined
      ? currentView[PREORDER_HOOK_FLAGS] & PreOrderHookFlags.IndexOfTheNextPreOrderHookMaskMask
      : 0;
  const nodeIndexLimit = currentNodeIndex != null ? currentNodeIndex : -1;
  const max = arr.length - 1; // 우리는 i + 1에서 후크를 찾기 때문에 루프를 길이 - 1에서 멈춥니다.
  let lastNodeIndexFound = 0;
  for (let i = startIndex; i < max; i++) {
    const hook = arr[i + 1] as number | (() => void);
    if (typeof hook === 'number') {
      lastNodeIndexFound = arr[i] as number;
      if (currentNodeIndex != null && lastNodeIndexFound >= currentNodeIndex) {
        break;
      }
    } else {
      const isInitHook = (arr[i] as number) < 0;
      if (isInitHook) {
        currentView[PREORDER_HOOK_FLAGS] += PreOrderHookFlags.NumberOfInitHooksCalledIncrementer;
      }
      if (lastNodeIndexFound < nodeIndexLimit || nodeIndexLimit == -1) {
        callHook(currentView, initPhase, arr, i);
        currentView[PREORDER_HOOK_FLAGS] =
          (currentView[PREORDER_HOOK_FLAGS] & PreOrderHookFlags.NumberOfInitHooksCalledMask) +
          i +
          2;
      }
      i++;
    }
  }
}

/**
 * 단일 생명 주기 후크를 실행하고, 다음과 같은 사항을 보장합니다:
 * - 비반응 컨텍스트에서 호출되는지;
 * - 프로파일링 데이터가 등록됩니다.
 */
function callHookInternal(directive: any, hook: () => void) {
  profiler(ProfilerEvent.LifecycleHookStart, directive, hook);
  const prevConsumer = setActiveConsumer(null);
  try {
    hook.call(directive);
  } finally {
    setActiveConsumer(prevConsumer);
    profiler(ProfilerEvent.LifecycleHookEnd, directive, hook);
  }
}

/**
 * 현재 `LView`에 대해 하나의 후크를 실행합니다.
 *
 * @param currentView 현재 뷰
 * @param initPhaseState 초기 단계의 현재 상태
 * @param arr 후크가 발견된 배열
 * @param i 후크 데이터 배열 내의 현재 인덱스
 */
function callHook(currentView: LView, initPhase: InitPhaseState, arr: HookData, i: number) {
  const isInitHook = (arr[i] as number) < 0;
  const hook = arr[i + 1] as () => void;
  const directiveIndex = isInitHook ? -arr[i] : (arr[i] as number);
  const directive = currentView[directiveIndex];
  if (isInitHook) {
    const indexWithintInitPhase = currentView[FLAGS] >> LViewFlags.IndexWithinInitPhaseShift;
    // 초기 단계 상태는 항상 여기에서 확인해야 하며, 재귀적으로 업데이트되었을 수 있습니다.
    if (
      indexWithintInitPhase <
        currentView[PREORDER_HOOK_FLAGS] >> PreOrderHookFlags.NumberOfInitHooksCalledShift &&
      (currentView[FLAGS] & LViewFlags.InitPhaseStateMask) === initPhase
    ) {
      currentView[FLAGS] += LViewFlags.IndexWithinInitPhaseIncrementer;
      callHookInternal(directive, hook);
    }
  } else {
    callHookInternal(directive, hook);
  }
}
