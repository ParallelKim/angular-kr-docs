/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ɵɵdefineInjectable} from '../../di/interface/defs';
import {PendingTasksInternal} from '../../pending_tasks';
import {inject} from '../../di/injector_compatibility';

/**
 * 예약할 수 있는 모든 종류의 효과를 포함하는 추상화입니다.
 */
export interface SchedulableEffect {
  run(): void;
  zone: {
    run<T>(fn: () => T): T;
  } | null;
}

/**
 * 효과의 실행을 관리하는 스케줄러입니다.
 */
export abstract class EffectScheduler {
  /**
   * 주어진 효과를 나중에 실행되도록 예약합니다.
   *
   * 스케줄링 작업 중에 효과를 동기적으로 실행하려고 시도하는 것은 오류입니다.
   */
  abstract schedule(e: SchedulableEffect): void;

  /**
   * 예약된 모든 효과를 실행합니다.
   */
  abstract flush(): void;

  /** 예약된 효과를 제거합니다 */
  abstract remove(e: SchedulableEffect): void;

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: EffectScheduler,
    providedIn: 'root',
    factory: () => new ZoneAwareEffectScheduler(),
  });
}

/**
 * 마이크로 태스크 큐를 통해 플러시를 예약하는 `ZoneAwareQueueingScheduler`의 래퍼입니다.
 */
export class ZoneAwareEffectScheduler implements EffectScheduler {
  private queuedEffectCount = 0;
  private queues = new Map<Zone | null, Set<SchedulableEffect>>();

  schedule(handle: SchedulableEffect): void {
    this.enqueue(handle);
  }

  remove(handle: SchedulableEffect): void {
    const zone = handle.zone as Zone | null;
    const queue = this.queues.get(zone)!;
    if (!queue.has(handle)) {
      return;
    }

    queue.delete(handle);
    this.queuedEffectCount--;
  }

  private enqueue(handle: SchedulableEffect): void {
    const zone = handle.zone as Zone | null;
    if (!this.queues.has(zone)) {
      this.queues.set(zone, new Set());
    }

    const queue = this.queues.get(zone)!;
    if (queue.has(handle)) {
      return;
    }
    this.queuedEffectCount++;
    queue.add(handle);
  }

  /**
   * 예약된 모든 효과를 실행합니다.
   *
   * 동일한 영역 내에서 효과의 실행 순서는 FIFO로 보장되지만, 서로 다른 영역에서 예약된 효과 간의 순서 보장은 없습니다.
   */
  flush(): void {
    while (this.queuedEffectCount > 0) {
      for (const [zone, queue] of this.queues) {
        // 여기서 `zone`은 정의되어 있어야 합니다.
        if (zone === null) {
          this.flushQueue(queue);
        } else {
          zone.run(() => this.flushQueue(queue));
        }
      }
    }
  }

  private flushQueue(queue: Set<SchedulableEffect>): void {
    for (const handle of queue) {
      queue.delete(handle);
      this.queuedEffectCount--;

      // TODO: 만약 이 실행 중 오류가 발생하면 어떻게 될까요?
      handle.run();
    }
  }
}
