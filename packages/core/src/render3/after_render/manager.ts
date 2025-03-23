/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TracingAction, TracingService, TracingSnapshot} from '../../application/tracing';
import {
  ChangeDetectionScheduler,
  NotificationSource,
} from '../../change_detection/scheduling/zoneless_scheduling';
import {inject} from '../../di/injector_compatibility';
import {ɵɵdefineInjectable} from '../../di/interface/defs';
import {ErrorHandler} from '../../error_handler';
import {type DestroyRef} from '../../linker/destroy_ref';
import {NgZone} from '../../zone';
import {AFTER_RENDER_SEQUENCES_TO_ADD, FLAGS, LView, LViewFlags} from '../interfaces/view';
import {profiler} from '../profiler';
import {ProfilerEvent} from '../profiler_types';
import {markAncestorsForTraversal} from '../util/view_utils';
import {AfterRenderPhase, AfterRenderRef} from './api';

export class AfterRenderManager {
  impl: AfterRenderImpl | null = null;

  execute(): void {
    this.impl?.execute();
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: AfterRenderManager,
    providedIn: 'root',
    factory: () => new AfterRenderManager(),
  });
}

export const AFTER_RENDER_PHASES = /* @__PURE__ **/ (() =>
  [
    AfterRenderPhase.EarlyRead,
    AfterRenderPhase.Write,
    AfterRenderPhase.MixedReadWrite,
    AfterRenderPhase.Read,
  ] as const)();

export class AfterRenderImpl {
  private readonly ngZone = inject(NgZone);
  private readonly scheduler = inject(ChangeDetectionScheduler);
  private readonly errorHandler = inject(ErrorHandler, {optional: true});

  /** 현재 활성화된 시퀀스 집합. */
  private readonly sequences = new Set<AfterRenderSequence>();

  /** 현재 실행 집합 동안의 등록 추적. */
  private readonly deferredRegistrations = new Set<AfterRenderSequence>();

  /** 현재 `AfterRenderManager`가 후크를 실행 중인지 여부. */
  executing = false;

  constructor() {
    // 추적 서비스를 주입하여 초기화되었는지 확인합니다.
    inject(TracingService, {optional: true});
  }

  /**
   * 후크의 단계 시퀀스를 한 번 실행합니다. 후크의 실행 결과로 인해
   * 추가적으로 스케줄링될 수 있습니다.
   */
  execute(): void {
    const hasSequencesToExecute = this.sequences.size > 0;

    if (hasSequencesToExecute) {
      profiler(ProfilerEvent.AfterRenderHooksStart);
    }

    this.executing = true;
    for (const phase of AFTER_RENDER_PHASES) {
      for (const sequence of this.sequences) {
        if (sequence.erroredOrDestroyed || !sequence.hooks[phase]) {
          continue;
        }

        try {
          sequence.pipelinedValue = this.ngZone.runOutsideAngular(() =>
            this.maybeTrace(() => {
              const hookFn = sequence.hooks[phase]!;
              const value = hookFn(sequence.pipelinedValue);
              return value;
            }, sequence.snapshot),
          );
        } catch (err) {
          sequence.erroredOrDestroyed = true;
          this.errorHandler?.handleError(err);
        }
      }
    }
    this.executing = false;

    // 상태를 리셋하고 즉시 제거할 원샷 시퀀스를 수집하는 클린업 단계.
    for (const sequence of this.sequences) {
      sequence.afterRun();
      if (sequence.once) {
        this.sequences.delete(sequence);
        // 파괴 콜백을 즉시 정리할 수 있도록 시퀀스를 파괴합니다.
        sequence.destroy();
      }
    }

    for (const sequence of this.deferredRegistrations) {
      this.sequences.add(sequence);
    }
    if (this.deferredRegistrations.size > 0) {
      this.scheduler.notify(NotificationSource.RenderHook);
    }
    this.deferredRegistrations.clear();

    if (hasSequencesToExecute) {
      profiler(ProfilerEvent.AfterRenderHooksEnd);
    }
  }

  register(sequence: AfterRenderSequence): void {
    const {view} = sequence;
    if (view !== undefined) {
      // 관리자로 추가하는 것을 지연시키고, 대신 뷰에 추가합니다.
      (view[AFTER_RENDER_SEQUENCES_TO_ADD] ??= []).push(sequence);

      // 다음 렌더링을 보장하기 위해 조상을 탐색하도록 뷰를 표시합니다.
      markAncestorsForTraversal(view);
      view[FLAGS] |= LViewFlags.HasChildViewsToRefresh;
    } else if (!this.executing) {
      this.addSequence(sequence);
    } else {
      this.deferredRegistrations.add(sequence);
    }
  }

  addSequence(sequence: AfterRenderSequence): void {
    this.sequences.add(sequence);
    // 새로운 렌더 후크가 실행되어야 하므로 `ApplicationRef.tick()`을 트리거합니다.
    this.scheduler.notify(NotificationSource.RenderHook);
  }

  unregister(sequence: AfterRenderSequence): void {
    if (this.executing && this.sequences.has(sequence)) {
      // 반복 중에 `AfterRenderSequence`를 제거할 수 없습니다.
      // 대신, 더 이상 실행되지 않도록 파괴된 것으로 표시하고, 현재 실행의 끝에서 제거되도록 원샷으로 표시합니다.
      sequence.erroredOrDestroyed = true;
      sequence.pipelinedValue = undefined;
      sequence.once = true;
    } else {
      // 이 시퀀스를 직접 제거하는 것이 안전합니다.
      this.sequences.delete(sequence);
      this.deferredRegistrations.delete(sequence);
    }
  }

  protected maybeTrace<T>(fn: () => T, snapshot: TracingSnapshot | null): T {
    // 스냅샷이 정의되어 있는 경우에만 실행을 추적합니다.
    return snapshot ? snapshot.run(TracingAction.AFTER_NEXT_RENDER, fn) : fn();
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: AfterRenderImpl,
    providedIn: 'root',
    factory: () => new AfterRenderImpl(),
  });
}

export type AfterRenderHook = (value?: unknown) => unknown;
export type AfterRenderHooks = [
  /*      EarlyRead */ AfterRenderHook | undefined,
  /*          Write */ AfterRenderHook | undefined,
  /* MixedReadWrite */ AfterRenderHook | undefined,
  /*           Read */ AfterRenderHook | undefined,
];

export class AfterRenderSequence implements AfterRenderRef {
  /**
   * 이 시퀀스가 이 실행 중에 오류가 발생했거나 파괴되었는지 여부, 후크가 더 이상
   * 실행되면 안 됩니다.
   */
  erroredOrDestroyed: boolean = false;

  /**
   * 마지막 후크 실행에서 반환된 값(있는 경우), 다음
   * 후크로 파이프라인되기를 기다리고 있습니다.
   */
  pipelinedValue: unknown = undefined;

  private unregisterOnDestroy: (() => void) | undefined;

  constructor(
    readonly impl: AfterRenderImpl,
    readonly hooks: AfterRenderHooks,
    readonly view: LView | undefined,
    public once: boolean,
    destroyRef: DestroyRef | null,
    public snapshot: TracingSnapshot | null = null,
  ) {
    this.unregisterOnDestroy = destroyRef?.onDestroy(() => this.destroy());
  }

  afterRun(): void {
    this.erroredOrDestroyed = false;
    this.pipelinedValue = undefined;

    // 초기 실행 후 스냅샷을 지웁니다. 이 스냅샷은 후크의 초기 실행과
    // 그것을 생성한 컨텍스트를 연결합니다.
    // 후속 실행은 해당 초기 컨텍스트와 독립적이며 다른 트리거를 가지고 있습니다.
    this.snapshot?.dispose();
    this.snapshot = null;
  }

  destroy(): void {
    this.impl.unregister(this);
    this.unregisterOnDestroy?.();
    const scheduled = this.view?.[AFTER_RENDER_SEQUENCES_TO_ADD];
    if (scheduled) {
      this.view[AFTER_RENDER_SEQUENCES_TO_ADD] = scheduled.filter((s) => s !== this);
    }
  }
}
