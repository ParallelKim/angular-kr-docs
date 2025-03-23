/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Subscription} from 'rxjs';

import {ApplicationRef, ApplicationRefDirtyFlags} from '../../application/application_ref';
import {Injectable} from '../../di/injectable';
import {inject} from '../../di/injector_compatibility';
import {EnvironmentProviders} from '../../di/interface/provider';
import {makeEnvironmentProviders} from '../../di/provider_collection';
import {RuntimeError, RuntimeErrorCode, formatRuntimeError} from '../../errors';
import {PendingTasksInternal} from '../../pending_tasks';
import {
  scheduleCallbackWithMicrotask,
  scheduleCallbackWithRafRace,
} from '../../util/callback_scheduler';
import {performanceMarkFeature} from '../../util/performance';
import {NgZone, NgZonePrivate, NoopNgZone, angularZoneInstanceIdProperty} from '../../zone/ng_zone';

import {
  ChangeDetectionScheduler,
  NotificationSource,
  PROVIDED_ZONELESS,
  SCHEDULE_IN_ROOT_ZONE,
  ZONELESS_ENABLED,
  ZONELESS_SCHEDULER_DISABLED,
} from './zoneless_scheduling';
import {TracingService} from '../../application/tracing';
import {INTERNAL_APPLICATION_ERROR_HANDLER} from '../../error_handler';

const CONSECUTIVE_MICROTASK_NOTIFICATION_LIMIT = 100;
let consecutiveMicrotaskNotifications = 0;
let stackFromLastFewNotifications: string[] = [];

function trackMicrotaskNotificationForDebugging() {
  consecutiveMicrotaskNotifications++;
  if (CONSECUTIVE_MICROTASK_NOTIFICATION_LIMIT - consecutiveMicrotaskNotifications < 5) {
    const stack = new Error().stack;
    if (stack) {
      stackFromLastFewNotifications.push(stack);
    }
  }

  if (consecutiveMicrotaskNotifications === CONSECUTIVE_MICROTASK_NOTIFICATION_LIMIT) {
    throw new RuntimeError(
      RuntimeErrorCode.INFINITE_CHANGE_DETECTION,
      'Angular는 브라우저 이벤트 루프 내에서 끝없는 변경 알림이 있었기 때문에 안정화될 수 없었습니다. ' +
        '마지막 몇 개의 알림에서의 스택: \n' +
        stackFromLastFewNotifications.join('\n'),
    );
  }
}

@Injectable({providedIn: 'root'})
export class ChangeDetectionSchedulerImpl implements ChangeDetectionScheduler {
  private readonly applicationErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
  private readonly appRef = inject(ApplicationRef);
  private readonly taskService = inject(PendingTasksInternal);
  private readonly ngZone = inject(NgZone);
  private readonly zonelessEnabled = inject(ZONELESS_ENABLED);
  private readonly tracing = inject(TracingService, {optional: true});
  private readonly disableScheduling =
    inject(ZONELESS_SCHEDULER_DISABLED, {optional: true}) ?? false;
  private readonly zoneIsDefined = typeof Zone !== 'undefined' && !!Zone.root.run;
  private readonly schedulerTickApplyArgs = [{data: {'__scheduler_tick__': true}}];
  private readonly subscriptions = new Subscription();
  private readonly angularZoneId = this.zoneIsDefined
    ? (this.ngZone as NgZonePrivate)._inner?.get(angularZoneInstanceIdProperty)
    : null;
  private readonly scheduleInRootZone =
    !this.zonelessEnabled &&
    this.zoneIsDefined &&
    (inject(SCHEDULE_IN_ROOT_ZONE, {optional: true}) ?? false);

  private cancelScheduledCallback: null | (() => void) = null;
  private useMicrotaskScheduler = false;
  runningTick = false;
  pendingRenderTaskId: number | null = null;

  constructor() {
    this.subscriptions.add(
      this.appRef.afterTick.subscribe(() => {
        // 스케줄러가 틱을 실행하지 않지만 애플리케이션이 틱을 실행한 경우는
        // 누군가가 ApplicationRef.tick을 수동으로 호출했음을 의미합니다. 이 경우,
        // 스케줄되었던 모든 변경 감지를 취소해야 추가로 실행되지 않도록 해야 합니다.
        if (!this.runningTick) {
          this.cleanup();
        }
      }),
    );
    this.subscriptions.add(
      this.ngZone.onUnstable.subscribe(() => {
        // 우리가 틱을 실행하지 않고 영역이 불안정해지면(이 경우 zone.run에서 발생함),
        // 이 시점에서 영역이 일정 시점에 안정될 것이라는 것을 알므로
        // 예정된 변경 감지를 취소해야 합니다.
        if (!this.runningTick) {
          this.cleanup();
        }
      }),
    );

    // TODO(atscott): 이러한 조건은 zoneless가 기본 옵션이 될 때 변경해야 합니다.
    // 대신, ZoneJS 스케줄링이 제공되는지 확인하도록 변경해야 합니다.
    this.disableScheduling ||=
      !this.zonelessEnabled &&
      // NoopNgZone를 사용하여 zoneless를 활성화하지 않으면 스케줄링이 전혀 없음을 의미합니다.
      (this.ngZone instanceof NoopNgZone ||
        // Zoneless 스케줄링을 활성화하지 않은 상태에서 Zone이 없으면 마찬가지입니다.
        !this.zoneIsDefined);
  }

  notify(source: NotificationSource): void {
    if (!this.zonelessEnabled && source === NotificationSource.Listener) {
      // 알림이 리스너에서 오는 경우, 애플리케이션이 zoneless를 활성화하지 않은 한 알림을 건너뜁니다.
      return;
    }

    let force = false;

    switch (source) {
      case NotificationSource.MarkAncestorsForTraversal: {
        this.appRef.dirtyFlags |= ApplicationRefDirtyFlags.ViewTreeTraversal;
        break;
      }
      case NotificationSource.DebugApplyChanges:
      case NotificationSource.DeferBlockStateUpdate:
      case NotificationSource.MarkForCheck:
      case NotificationSource.Listener:
      case NotificationSource.SetInput: {
        this.appRef.dirtyFlags |= ApplicationRefDirtyFlags.ViewTreeCheck;
        break;
      }
      case NotificationSource.CustomElement: {
        // We use `ViewTreeTraversal` to ensure we refresh the element even if this is triggered
        // during CD. In practice this is a no-op since the elements code also calls via a
        // `markForRefresh()` API which sends `NotificationSource.MarkAncestorsForTraversal` anyway.
        this.appRef.dirtyFlags |= ApplicationRefDirtyFlags.ViewTreeTraversal;
        force = true;
        break;
      }
      case NotificationSource.RootEffect: {
        this.appRef.dirtyFlags |= ApplicationRefDirtyFlags.RootEffects;
        // Root effects still force a CD, even if the scheduler is disabled. This ensures that
        // effects always run, even when triggered from outside the zone when the scheduler is
        // otherwise disabled.
        force = true;
        break;
      }
      case NotificationSource.ViewEffect: {
        // This is technically a no-op, since view effects will also send a
        // `MarkAncestorsForTraversal` notification. Still, we set this for logical consistency.
        this.appRef.dirtyFlags |= ApplicationRefDirtyFlags.ViewTreeTraversal;
        // View effects still force a CD, even if the scheduler is disabled. This ensures that
        // effects always run, even when triggered from outside the zone when the scheduler is
        // otherwise disabled.
        force = true;
        break;
      }
      case NotificationSource.PendingTaskRemoved: {
        // Removing a pending task via the public API forces a scheduled tick, ensuring that
        // stability is async and delayed until there was at least an opportunity to run
        // application synchronization. This prevents some footguns when working with the
        // public API for pending tasks where developers attempt to update application state
        // immediately after removing the last task.
        force = true;
        break;
      }
      case NotificationSource.ViewDetachedFromDOM:
      case NotificationSource.ViewAttached:
      case NotificationSource.RenderHook:
      case NotificationSource.AsyncAnimationsLoaded:
      default: {
        // These notifications only schedule a tick but do not change whether we should refresh
        // views. Instead, we only need to run render hooks unless another notification from the
        // other set is also received before `tick` happens.
        this.appRef.dirtyFlags |= ApplicationRefDirtyFlags.AfterRender;
      }
    }

    // If not already defined, attempt to capture a tracing snapshot of this
    // notification so that the resulting CD run can be attributed to the
    // context which produced the notification.
    this.appRef.tracingSnapshot = this.tracing?.snapshot(this.appRef.tracingSnapshot) ?? null;

    if (!this.shouldScheduleTick(force)) {
      return;
    }

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (this.useMicrotaskScheduler) {
        trackMicrotaskNotificationForDebugging();
      } else {
        consecutiveMicrotaskNotifications = 0;
        stackFromLastFewNotifications.length = 0;
      }
    }

    const scheduleCallback = this.useMicrotaskScheduler
      ? scheduleCallbackWithMicrotask
      : scheduleCallbackWithRafRace;
    this.pendingRenderTaskId = this.taskService.add();
    if (this.scheduleInRootZone) {
      this.cancelScheduledCallback = Zone.root.run(() => scheduleCallback(() => this.tick()));
    } else {
      this.cancelScheduledCallback = this.ngZone.runOutsideAngular(() =>
        scheduleCallback(() => this.tick()),
      );
    }
  }

  private shouldScheduleTick(force: boolean): boolean {
    if ((this.disableScheduling && !force) || this.appRef.destroyed) {
      return false;
    }
    // already scheduled or running
    if (this.pendingRenderTaskId !== null || this.runningTick || this.appRef._runningTick) {
      return false;
    }
    // If we're inside the zone don't bother with scheduler. Zone will stabilize
    // eventually and run change detection.
    if (
      !this.zonelessEnabled &&
      this.zoneIsDefined &&
      Zone.current.get(angularZoneInstanceIdProperty + this.angularZoneId)
    ) {
      return false;
    }

    return true;
  }

  /**
   * NgZone 안에서 ApplicationRef._tick을 호출합니다.
   *
   * 직접적으로 tick을 호출하면 변경 감지가 실행되며, 이전에 예정되어 있던 모든
   * 변경 감지가 취소됩니다.
   *
   * @param shouldRefreshViews 직접적으로 ApplicationRef._tick에 전달되며 `false`일 경우
   *     렌더 후크로 바로 건너뜁니다.
   */
  private tick(): void {
    // When ngZone.run below exits, onMicrotaskEmpty may emit if the zone is
    // stable. We want to prevent double ticking so we track whether the tick is
    // already running and skip it if so.
    if (this.runningTick || this.appRef.destroyed) {
      return;
    }

    // If we reach the tick and there is no work to be done in ApplicationRef.tick,
    // skip it altogether and clean up. There may be no work if, for example, the only
    // event that notified the scheduler was the removal of a pending task.
    if (this.appRef.dirtyFlags === ApplicationRefDirtyFlags.None) {
      this.cleanup();
      return;
    }

    // The scheduler used to pass "whether to check views" as a boolean flag instead of setting
    // fine-grained dirtiness flags, and global checking was always used on the first pass. This
    // created an interesting edge case: if a notification made a view dirty and then ticked via the
    // scheduler (and not the zone) a global check was still performed.
    //
    // Ideally, this would not be the case, and only zone-based ticks would do global passes.
    // However this is a breaking change and requires fixes in g3. Until this cleanup can be done,
    // we add the `ViewTreeGlobal` flag to request a global check if any views are dirty in a
    // scheduled tick (unless zoneless is enabled, in which case global checks aren't really a
    // thing).
    //
    // TODO(alxhub): clean up and remove this workaround as a breaking change.
    if (!this.zonelessEnabled && this.appRef.dirtyFlags & ApplicationRefDirtyFlags.ViewTreeAny) {
      this.appRef.dirtyFlags |= ApplicationRefDirtyFlags.ViewTreeGlobal;
    }

    const task = this.taskService.add();
    try {
      this.ngZone.run(
        () => {
          this.runningTick = true;
          this.appRef._tick();
        },
        undefined,
        this.schedulerTickApplyArgs,
      );
    } catch (e: unknown) {
      this.taskService.remove(task);
      this.applicationErrorHandler(e);
    } finally {
      this.cleanup();
    }
    // If we're notified of a change within 1 microtask of running change
    // detection, run another round in the same event loop. This allows code
    // which uses Promise.resolve (see NgModel) to avoid
    // ExpressionChanged...Error to still be reflected in a single browser
    // paint, even if that spans multiple rounds of change detection.
    this.useMicrotaskScheduler = true;
    scheduleCallbackWithMicrotask(() => {
      this.useMicrotaskScheduler = false;
      this.taskService.remove(task);
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.cleanup();
  }

  private cleanup() {
    this.runningTick = false;
    this.cancelScheduledCallback?.();
    this.cancelScheduledCallback = null;
    // If this is the last task, the service will synchronously emit a stable
    // notification. If there is a subscriber that then acts in a way that
    // tries to notify the scheduler again, we need to be able to respond to
    // schedule a new change detection. Therefore, we should clear the task ID
    // before removing it from the pending tasks (or the tasks service should
    // not synchronously emit stable, similar to how Zone stableness only
    // happens if it's still stable after a microtask).
    if (this.pendingRenderTaskId !== null) {
      const taskId = this.pendingRenderTaskId;
      this.pendingRenderTaskId = null;
      this.taskService.remove(taskId);
    }
  }
}

/**
 * `bootstrapApplication`을 사용하여 부트스트랩된 애플리케이션에 대해 ZoneJS 없이 변경 감지를 제공합니다.
 *
 * 이 함수는 애플리케이션이 ZoneJS의 상태/상태 변경을 사용하여 변경 감지를 설정하지 않도록 구성할 수 있게 합니다.
 * ZoneJS가 전혀 페이지에 없거나 다른 Angular 애플리케이션이 ZoneJS를 사용하여 스케줄링하는 경우에도 작동합니다.
 *
 * 이 기능은 `TestBed` 제공자에 추가되어 테스트 환경이 실제 환경의 동작에 더 가깝게 일치하도록 구성할 수 있습니다.
 * 이는 구성 요소가 zoneless 변경 감지와 호환되는지에 대한 신뢰도를 높이는 데 도움이 됩니다.
 *
 * ZoneJS는 브라우저 이벤트를 사용하여 변경 감지를 트리거합니다. 이 제공자를 사용할 때는 Angular가
 * 대신 Angular API를 사용하여 변경 감지를 스케줄링합니다. 이 API에는 다음이 포함됩니다:
 *
 * - `ChangeDetectorRef.markForCheck`
 * - `ComponentRef.setInput`
 * - 템플릿에서 읽는 신호 업데이트
 * - 바인딩된 호스트 또는 템플릿 리스너가 실행될 때
 * - 위에서 더러움으로 표시된 뷰 첨부
 * - 뷰 제거
 * - 렌더 후크 등록 (렌더 후크가 위에서 몇 가지 작업을 하면 템플릿이 새로 고쳐집니다)
 *
 * @usageNotes
 * ```ts
 * bootstrapApplication(MyApp, {providers: [
 *   provideExperimentalZonelessChangeDetection(),
 * ]});
 * ```
 *
 * 이 API는 실험적입니다. 형태도, 기본 동작도 안정적이지 않으며 패치 버전에서 변경될 수 있습니다.
 * 알려진 기능 격차와 API 사용 편의성 고려 사항이 있습니다. 피드백과 문제 및 솔루션 공간에 대한 이해를 바탕으로
 * 정확한 API를 반복할 것입니다.
 *
 * @publicApi
 * @experimental
 * @see {@link /api/platform-browser/bootstrapApplication bootstrapApplication}
 */
export function provideExperimentalZonelessChangeDetection(): EnvironmentProviders {
  performanceMarkFeature('NgZoneless');

  if ((typeof ngDevMode === 'undefined' || ngDevMode) && typeof Zone !== 'undefined' && Zone) {
    const message = formatRuntimeError(
      RuntimeErrorCode.UNEXPECTED_ZONEJS_PRESENT_IN_ZONELESS_MODE,
      `애플리케이션이 zoneless 변경 감지를 사용하고 있지만 여전히 Zone.js를 로드하고 있습니다. ` +
        `zoneless의 모든 이점을 얻으려면 Zone.js를 제거하십시오. ` +
        `Angular CLI를 사용하는 애플리케이션에서는 일반적으로 angular.json 파일의 "polyfills" 섹션에 Zone.js가 포함됩니다.`,
    );
    console.warn(message);
  }

  return makeEnvironmentProviders([
    {provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl},
    {provide: NgZone, useClass: NoopNgZone},
    {provide: ZONELESS_ENABLED, useValue: true},
    {provide: SCHEDULE_IN_ROOT_ZONE, useValue: false},
    typeof ngDevMode === 'undefined' || ngDevMode
      ? [{provide: PROVIDED_ZONELESS, useValue: true}]
      : [],
  ]);
}
