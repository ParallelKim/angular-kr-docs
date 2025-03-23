/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {BehaviorSubject} from 'rxjs';

import {inject} from './di/injector_compatibility';
import {ɵɵdefineInjectable} from './di/interface/defs';
import {OnDestroy} from './interface/lifecycle_hooks';
import {
  ChangeDetectionScheduler,
  NotificationSource,
} from './change_detection/scheduling/zoneless_scheduling';
import {INTERNAL_APPLICATION_ERROR_HANDLER} from './error_handler';

/**
 * 보류 중인 작업 서비스의 내부 구현.
 */
export class PendingTasksInternal implements OnDestroy {
  private taskId = 0;
  private pendingTasks = new Set<number>();
  private get _hasPendingTasks() {
    return this.hasPendingTasks.value;
  }
  hasPendingTasks = new BehaviorSubject<boolean>(false);

  add(): number {
    if (!this._hasPendingTasks) {
      this.hasPendingTasks.next(true);
    }
    const taskId = this.taskId++;
    this.pendingTasks.add(taskId);
    return taskId;
  }

  has(taskId: number): boolean {
    return this.pendingTasks.has(taskId);
  }

  remove(taskId: number): void {
    this.pendingTasks.delete(taskId);
    if (this.pendingTasks.size === 0 && this._hasPendingTasks) {
      this.hasPendingTasks.next(false);
    }
  }

  ngOnDestroy(): void {
    this.pendingTasks.clear();
    if (this._hasPendingTasks) {
      this.hasPendingTasks.next(false);
    }
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: PendingTasksInternal,
    providedIn: 'root',
    factory: () => new PendingTasksInternal(),
  });
}

/**
 * Angular 애플리케이션의 안정성에 기여하는 보류 중인 작업을 추적하는 서비스입니다.
 * 여러 기존 Angular 서비스(예: `HttpClient`)는 내부적으로 안정성에 영향을 미치는 작업을 관리하지만,
 * 이 API는 Angular 내부에서 다루지 않는 특정 사례에 대해 라이브러리 및 애플리케이션 개발자에게
 * 안정성을 제어할 수 있는 기능을 제공합니다.
 *
 * 안정성 개념은 여러 중요한 시나리오에서 적용됩니다:
 * - SSR 과정은 렌더링된 HTML을 직렬화하고 전송하기 전에 애플리케이션 안정성을 기다려야 합니다;
 * - 테스트는 애플리케이션이 안정적이 될 때까지 단언을 지연시키고 싶을 수 있습니다;
 *
 * @usageNotes
 * ```ts
 * const pendingTasks = inject(PendingTasks);
 * const taskCleanup = pendingTasks.add();
 * // 애플리케이션의 안정성을 차단해야 하는 작업을 수행한 후:
 * taskCleanup();
 * ```
 *
 * @publicApi
 * @developerPreview
 */
export class PendingTasks {
  private readonly internalPendingTasks = inject(PendingTasksInternal);
  private readonly scheduler = inject(ChangeDetectionScheduler);
  private readonly errorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
  /**
   * 애플리케이션의 안정성을 차단해야 하는 새 작업을 추가합니다.
   * @returns 호출 시 작업을 제거하는 정리 함수입니다.
   */
  add(): () => void {
    const taskId = this.internalPendingTasks.add();
    return () => {
      if (!this.internalPendingTasks.has(taskId)) {
        // 이 보류 중인 작업은 이미 제거되었습니다.
        return;
      }
      // 스케줄러에 알림은 다음 틱까지 애플리케이션의 안정성을 유지합니다.
      this.scheduler.notify(NotificationSource.PendingTaskRemoved);
      this.internalPendingTasks.remove(taskId);
    };
  }

  /**
   * 비동기 함수를 실행하고 함수가 완료될 때까지 애플리케이션의 안정성을 차단합니다.
   *
   * ```ts
   * pendingTasks.run(async () => {
   *   const userData = await fetch('/api/user');
   *   this.userData.set(userData);
   * });
   * ```
   *
   * @param fn 실행할 비동기 함수
   */
  run<T>(fn: () => Promise<T>): void {
    const removeTask = this.add();
    fn().catch(this.errorHandler).finally(removeTask);
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: PendingTasks,
    providedIn: 'root',
    factory: () => new PendingTasks(),
  });
}
