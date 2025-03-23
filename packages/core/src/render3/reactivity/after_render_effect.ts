/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  consumerAfterComputation,
  consumerBeforeComputation,
  consumerPollProducersForChange,
  producerAccessed,
  SIGNAL,
  SIGNAL_NODE,
  type SignalNode,
} from '@angular/core/primitives/signals';

import {type Signal} from '../reactivity/api';
import {type EffectCleanupFn, type EffectCleanupRegisterFn} from './effect';

import {TracingService, TracingSnapshot} from '../../application/tracing';
import {
  ChangeDetectionScheduler,
  NotificationSource,
} from '../../change_detection/scheduling/zoneless_scheduling';
import {assertInInjectionContext} from '../../di/contextual';
import {Injector} from '../../di/injector';
import {inject} from '../../di/injector_compatibility';
import {DestroyRef} from '../../linker/destroy_ref';
import {AfterRenderPhase, type AfterRenderRef} from '../after_render/api';
import {NOOP_AFTER_RENDER_REF, type AfterRenderOptions} from '../after_render/hooks';
import {
  AFTER_RENDER_PHASES,
  AfterRenderImpl,
  AfterRenderManager,
  AfterRenderSequence,
} from '../after_render/manager';
import {LView} from '../interfaces/view';
import {ViewContext} from '../view_context';
import {assertNotInReactiveContext} from './asserts';

const NOT_SET = Symbol('NOT_SET');
const EMPTY_CLEANUP_SET = new Set<() => void>();

/** `afterRenderEffect` 단계 효과에 대한 콜백 유형 */
type AfterRenderPhaseEffectHook = (
  // 클린업 함수 또는 파이프라인된 값과 클린업 함수
  ...args:
    | [onCleanup: EffectCleanupRegisterFn]
    | [previousPhaseValue: unknown, onCleanup: EffectCleanupRegisterFn]
) => unknown;

/**
 * 이 `afterRenderEffect` 단계 효과에 대한 그래프의 반응형 노드입니다.
 *
 * 이 노드 유형은 `SignalNode`를 확장합니다. 왜냐하면 `afterRenderEffect` 단계 효과가
 * 후속 단계에서 `Signal`로 소비되는 값을 생성하기 때문입니다.
 */
interface AfterRenderPhaseEffectNode extends SignalNode<unknown> {
  /** 이 노드에 의해 구현된 효과의 단계 */
  phase: AfterRenderPhase;
  /** 이 노드가 속하는 단계의 시퀀스, 전체 시퀀스의 상태에 사용됩니다 */
  sequence: AfterRenderEffectSequence;
  /** 사용자의 콜백 함수 */
  userFn: AfterRenderPhaseEffectHook;
  /** 이 노드의 값을 검색하는 신호 함수, 다음 단계의 값으로 사용됩니다 */
  signal: Signal<unknown>;
  /** 등록된 클린업 함수, 등록된 것이 없으면 `null` */
  cleanup: Set<() => void> | null;
  /** `this.cleanup`에 기록하는 사용자의 콜백에 전달되는 미리 바인딩된 도우미 함수 */
  registerCleanupFn: EffectCleanupRegisterFn;
  /** `afterRender` 기계에 주어진 이 효과를 실행하는 진입점 */
  phaseFn(previousValue?: unknown): unknown;
}

const AFTER_RENDER_PHASE_EFFECT_NODE = /* @__PURE__ */ (() => ({
  ...SIGNAL_NODE,
  consumerIsAlwaysLive: true,
  consumerAllowSignalWrites: true,
  value: NOT_SET,
  cleanup: null,
  /** 효과가 더러워질 때 호출됨 */
  consumerMarkedDirty(this: AfterRenderPhaseEffectNode): void {
    if (this.sequence.impl.executing) {
      // 훅이 실행되는 중이면, 이 노드가 시퀀스 내에서 아직 실행되었는지 여부가 중요합니다.
      // 그렇지 않으면, 스케줄러에 알리기를 원하지 않습니다. 왜냐하면
      // 이 노드는 자연스럽게 도달할 것이기 때문입니다.
      if (this.sequence.lastPhase === null || this.sequence.lastPhase < this.phase) {
        return;
      }

      // 후속 단계의 실행 중에 이전 단계가 더러워진 경우,
      // 이전이 다시 실행될 때까지 추가 단계 실행을 방지해야 합니다.
      this.sequence.erroredOrDestroyed = true;
    }

    // 훅이 실행되고 있지 않거나, 이미 실행된 시퀀스 내의 노드를 더럽히고 있습니다.
    this.sequence.scheduler.notify(NotificationSource.RenderHook);
  },
  phaseFn(this: AfterRenderPhaseEffectNode, previousValue?: unknown): unknown {
    this.sequence.lastPhase = this.phase;

    if (!this.dirty) {
      return this.signal;
    }

    this.dirty = false;
    if (this.value !== NOT_SET && !consumerPollProducersForChange(this)) {
      // 마지막으로 읽은 이후로 프로듀서가 변화를 보고하지 않았다면,
      // 우리의 값의 재계산이 필요하지 않습니다.
      return this.signal;
    }

    // 필요한 클린업 함수를 실행합니다.
    try {
      for (const cleanupFn of this.cleanup ?? EMPTY_CLEANUP_SET) {
        cleanupFn();
      }
    } finally {
      // 클린업 함수에서 오류가 발생하더라도, 이를 지워야 합니다.
      this.cleanup?.clear();
    }

    // 사용자의 효과 콜백을 호출할 준비를 합니다. 이전 단계가 있었다면,
    // 그것은 `Signal`로서의 값을 주었고, 그렇지 않으면 `previousValue`는 `undefined`가 됩니다.
    const args: unknown[] = [];
    if (previousValue !== undefined) {
      args.push(previousValue);
    }
    args.push(this.registerCleanupFn);

    // 우리의 반응형 컨텍스트 내에서 사용자의 콜백을 호출합니다.
    const prevConsumer = consumerBeforeComputation(this);
    let newValue;
    try {
      newValue = this.userFn.apply(null, args as any);
    } finally {
      consumerAfterComputation(this, prevConsumer);
    }

    if (this.value === NOT_SET || !this.equal(this.value, newValue)) {
      this.value = newValue;
      this.version++;
    }

    return this.signal;
  },
}))();

/**
 * `afterRenderEffect`의 단계 효과를 관리하는 `AfterRenderSequence`입니다.
 */
class AfterRenderEffectSequence extends AfterRenderSequence {
  /**
   * 이 시퀀스가 실행되는 동안, 이는 `afterRender` 기계에 의해 호출된 마지막 단계를 추적합니다.
   *
   * 단계 효과가 더러워지면, 이는 이미 실행되었는지 여부를 판단하는 데 사용됩니다.
   */
  lastPhase: AfterRenderPhase | null = null;

  /**
   * 각 단계의 반응형 노드입니다. 해당 단계에 대한 단계 효과가 정의된 경우.
   *
   * 초기화는 `undefined`로 되어 있지만 생성자에서 설정됩니다.
   */
  private readonly nodes: [
    AfterRenderPhaseEffectNode | undefined,
    AfterRenderPhaseEffectNode | undefined,
    AfterRenderPhaseEffectNode | undefined,
    AfterRenderPhaseEffectNode | undefined,
  ] = [undefined, undefined, undefined, undefined];

  constructor(
    impl: AfterRenderImpl,
    effectHooks: Array<AfterRenderPhaseEffectHook | undefined>,
    view: LView | undefined,
    readonly scheduler: ChangeDetectionScheduler,
    destroyRef: DestroyRef,
    snapshot: TracingSnapshot | null = null,
  ) {
    // 기본 `AfterRenderSequence` 훅을 `undefined`로 초기화하고,
    // 아래의 반응형 노드를 생성할 때 채웁니다.
    super(impl, [undefined, undefined, undefined, undefined], view, false, destroyRef, snapshot);

    // 각 단계에 대한 반응형 노드를 설정합니다.
    for (const phase of AFTER_RENDER_PHASES) {
      const effectHook = effectHooks[phase];
      if (effectHook === undefined) {
        continue;
      }

      const node = Object.create(AFTER_RENDER_PHASE_EFFECT_NODE) as AfterRenderPhaseEffectNode;
      node.sequence = this;
      node.phase = phase;
      node.userFn = effectHook;
      node.dirty = true;
      node.signal = (() => {
        producerAccessed(node);
        return node.value;
      }) as Signal<unknown>;
      node.signal[SIGNAL] = node;
      node.registerCleanupFn = (fn: EffectCleanupFn) =>
        (node.cleanup ??= new Set<() => void>()).add(fn);

      this.nodes[phase] = node;

      // 이 단계에 대한 `phaseFn`을 실행하는 업스트림 훅을 설치합니다.
      this.hooks[phase] = (value) => node.phaseFn(value);
    }
  }

  override afterRun(): void {
    super.afterRun();
    // 이 시퀀스 실행이 끝났으므로 `lastPhase`를 리셋합니다.
    this.lastPhase = null;
  }

  override destroy(): void {
    super.destroy();

    // 각 노드에 대한 클린업 함수를 실행합니다.
    for (const node of this.nodes) {
      for (const fn of node?.cleanup ?? EMPTY_CLEANUP_SET) {
        fn();
      }
    }
  }
}

/**
 * 주어진 유형 배열에서 첫 번째 비-네버 유형을 포함하는 인수 목록,
 * 또는 유형 배열에 비-네버 유형이 없는 경우 빈 인수 목록입니다.
 */
export type ɵFirstAvailableSignal<T extends unknown[]> = T extends [infer H, ...infer R]
  ? [H] extends [never]
    ? ɵFirstAvailableSignal<R>
    : [Signal<H>]
  : [];

/**
 * 효과를 등록하여, 이 효과가 트리거될 때 애플리케이션의 렌더링이 끝난 후
 * `mixedReadWrite` 단계에서 호출되도록 합니다.
 *
 * <div class="docs-alert docs-alert-critical">
 *
 * 효과에 대해 명시적인 단계를 지정하는 것이 바람직하며,
 * 그렇지 않으면 성능 저하가 발생할 위험이 있습니다.
 *
 * </div>
 *
 * 콜백 기반의 `afterRenderEffect`는 다음과 같이 실행됩니다.
 * - 등록된 순서로
 * - 더럽혀졌을 때만
 * - 브라우저 플랫폼에서만
 * - `mixedReadWrite` 단계에서
 *
 * <div class="docs-alert docs-alert-important">
 *
 * 콜백이 실행되기 전에 구성 요소가 [하이드레이션](guide/hydration)되었다고 보장되지 않습니다.
 * DOM과 레이아웃을 직접 읽거나 기록할 때 주의해야 합니다.
 *
 * </div>
 *
 * @param callback 등록할 효과 콜백 함수
 * @param options 콜백 동작을 제어하는 옵션
 *
 * @experimental
 */
export function afterRenderEffect(
  callback: (onCleanup: EffectCleanupRegisterFn) => void,
  options?: Omit<AfterRenderOptions, 'phase'>,
): AfterRenderRef;
/**
 * 트리거될 때 애플리케이션이 렌더링을 끝낸 후,
 * 지정된 단계에서 호출되는 효과를 등록합니다. 사용 가능한 단계는 다음과 같습니다:
 * - `earlyRead`
 *   다음 `write` 콜백 이전에 DOM에서 **읽기** 위해 이 단계를 사용합니다.
 *   예를 들어 브라우저가 원래 지원하지 않는 사용자 정의 레이아웃을 수행합니다.
 *   쓰기 단계가 끝난 후 읽기가 가능하다면 `read` 단계를 선호합니다.
 *   이 단계에서는 **절대** DOM에 쓰지 마십시오.
 * - `write`
 *    DOM에 **쓰기** 위해 이 단계를 사용합니다. 이 단계에서는 **절대** DOM에서 읽지 마십시오.
 * - `mixedReadWrite`
 *    DOM에서 동시에 읽고 쓰기 위해 이 단계를 사용합니다.
 *    다른 단계 간에 작업을 나눌 수 있다면 이 단계를 사용하지 마십시오.
 * - `read`
 *    DOM에서 **읽기** 위해 이 단계를 사용합니다. 이 단계에서는 **절대** DOM에 쓰지 마십시오.
 *
 * <div class="docs-alert docs-alert-critical">
 *
 * 가능한 경우 `earlyRead`와 `mixedReadWrite` 단계보다 `read` 및 `write` 단계를 사용하는 것이 성능 저하를 피하는 데 바람직합니다.
 *
 * </div>
 *
 * 다음과 같은 점에 유의하세요:
 * - 효과는 신호 종속성을 통해 더럽혀졌을 때만 실행됩니다.
 *   1. `earlyRead`
 *   2. `write`
 *   3. `mixedReadWrite`
 *   4. `read`
 * - 동일한 단계의 `afterRenderEffect`는 등록된 순서대로 실행됩니다.
 * - `afterRenderEffect`는 브라우저 플랫폼에서만 실행되며, 서버에서는 실행되지 않습니다.
 * - `afterRenderEffect`는 최소한 한 번은 실행됩니다.
 *
 * 이 스펙의 일부로 실행되는 첫 번째 단계 콜백은 매개변수를 받지 않습니다.
 * 이 스펙의 이후 단계 콜백은 이전에 실행된 단계 콜백의 반환 값을 `Signal`로 받게 됩니다.
 * 이는 여러 단계 간 작업을 조정하는 데 사용할 수 있습니다.
 *
 * Angular는 단계가 올바르게 사용되었는지를 확인하거나 강제할 수 없으며,
 * 대신 각 개발자가 각 값에 대한 문서화된 지침을 따르고,
 * 필요한 경우 적절한 값을 신중하게 선택하여 코드 리팩토링을 진행해야 합니다.
 * 이렇게 하면 Angular는 수동 DOM 접근과 관련된 성능 저하를 최소화하고,
 * 애플리케이션이나 라이브러리의 최종 사용자에게 최고의 경험을 제공할 수 있습니다.
 *
 * <div class="docs-alert docs-alert-important">
 *
 * 콜백이 실행되기 전에 구성 요소가 [하이드레이션](guide/hydration)되었다고 보장되지 않습니다.
 * DOM과 레이아웃을 직접 읽거나 기록할 때 주의해야 합니다.
 *
 * </div>
 *
 * @param spec 등록할 효과 함수들
 * @param options 효과 동작을 제어하는 옵션
 *
 * @usageNotes
 *
 * `afterRenderEffect`를 사용하여 DOM에서 읽거나 쓸 효과를 생성하고,
 * 따라서 렌더링 후 실행해야 합니다.
 *
 * @experimental
 */
export function afterRenderEffect<E = never, W = never, M = never>(
  spec: {
    earlyRead?: (onCleanup: EffectCleanupRegisterFn) => E;
    write?: (...args: [...ɵFirstAvailableSignal<[E]>, EffectCleanupRegisterFn]) => W;
    mixedReadWrite?: (...args: [...ɵFirstAvailableSignal<[W, E]>, EffectCleanupRegisterFn]) => M;
    read?: (...args: [...ɵFirstAvailableSignal<[M, W, E]>, EffectCleanupRegisterFn]) => void;
  },
  options?: Omit<AfterRenderOptions, 'phase'>,
): AfterRenderRef;

/**
 * @experimental
 */
export function afterRenderEffect<E = never, W = never, M = never>(
  callbackOrSpec:
    | ((onCleanup: EffectCleanupRegisterFn) => void)
    | {
        earlyRead?: (onCleanup: EffectCleanupRegisterFn) => E;
        write?: (...args: [...ɵFirstAvailableSignal<[E]>, EffectCleanupRegisterFn]) => W;
        mixedReadWrite?: (
          ...args: [...ɵFirstAvailableSignal<[W, E]>, EffectCleanupRegisterFn]
        ) => M;
        read?: (...args: [...ɵFirstAvailableSignal<[M, W, E]>, EffectCleanupRegisterFn]) => void;
      },
  options?: Omit<AfterRenderOptions, 'phase'>,
): AfterRenderRef {
  ngDevMode &&
    assertNotInReactiveContext(
      afterRenderEffect,
      '`afterRenderEffect`를 반응형 컨텍스트 외부에서 호출하십시오. 예를 들어 컴포넌트 생성자 내부에서 렌더링 효과를 생성하세요.',
    );

  !options?.injector && assertInInjectionContext(afterRenderEffect);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    return NOOP_AFTER_RENDER_REF;
  }

  const injector = options?.injector ?? inject(Injector);
  const scheduler = injector.get(ChangeDetectionScheduler);
  const manager = injector.get(AfterRenderManager);
  const tracing = injector.get(TracingService, null, {optional: true});
  manager.impl ??= injector.get(AfterRenderImpl);

  let spec = callbackOrSpec;
  if (typeof spec === 'function') {
    spec = {mixedReadWrite: callbackOrSpec as any};
  }

  const viewContext = injector.get(ViewContext, null, {optional: true});

  const sequence = new AfterRenderEffectSequence(
    manager.impl,
    [spec.earlyRead, spec.write, spec.mixedReadWrite, spec.read] as AfterRenderPhaseEffectHook[],
    viewContext?.view,
    scheduler,
    injector.get(DestroyRef),
    tracing?.snapshot(null),
  );
  manager.impl.register(sequence);
  return sequence;
}
