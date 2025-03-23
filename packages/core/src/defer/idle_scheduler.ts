/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector, inject, ɵɵdefineInjectable} from '../di';
import {NgZone} from '../zone';

/**
 * 브라우저가 유휴 상태가 되었을 때 호출될 콜백을 예약하는 도우미 함수입니다.
 *
 * @param callback 브라우저가 유휴 상태가 되었을 때 호출될 함수.
 * @param injector 앱에 대한 injector
 */
export function onIdle(callback: VoidFunction, injector: Injector) {
  const scheduler = injector.get(IdleScheduler);
  const cleanupFn = () => scheduler.remove(callback);
  scheduler.add(callback);
  return cleanupFn;
}

/**
 * 이 함수들은 해당 함수들이 사용 가능한 환경(예: Node.js 및 Safari)에서 `requestIdleCallback` 및 `cancelIdleCallback`의 shim을 사용합니다.
 *
 * 참고: 테스트 환경에서 오버라이드/모킹할 수 있도록 `requestIdleCallback` 호출을 함수로 감쌉니다.
 */
const _requestIdleCallback = () =>
  typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout;
const _cancelIdleCallback = () =>
  typeof requestIdleCallback !== 'undefined' ? cancelIdleCallback : clearTimeout;

/**
 * 지연 블록(batch of defer blocks)에 대해 `requestIdleCallback`을 예약하는 도우미 서비스로, 각 지연 블록에 대해 `requestIdleCallback`을 호출하지 않도록 합니다.
 */
export class IdleScheduler {
  // 현재 콜백이 호출되고 있는지 여부를 나타냅니다.
  executingCallbacks = false;

  // 현재 예약된 유휴 콜백 ID입니다.
  idleId: number | null = null;

  // 다음에 호출될 콜백 집합입니다.
  current = new Set<VoidFunction>();

  // 현재 콜백을 호출하는 동안 수집된 콜백의 집합입니다.
  // 이러한 콜백은 다음 유휴 기간을 위해 예약됩니다.
  deferred = new Set<VoidFunction>();

  ngZone = inject(NgZone);

  requestIdleCallbackFn = _requestIdleCallback().bind(globalThis);
  cancelIdleCallbackFn = _cancelIdleCallback().bind(globalThis);

  add(callback: VoidFunction) {
    const target = this.executingCallbacks ? this.deferred : this.current;
    target.add(callback);
    if (this.idleId === null) {
      this.scheduleIdleCallback();
    }
  }

  remove(callback: VoidFunction) {
    const {current, deferred} = this;

    current.delete(callback);
    deferred.delete(callback);

    // 마지막 콜백이 제거되고 대기 중인
    // 유휴 콜백이 있는 경우 - 이를 취소합니다.
    if (current.size === 0 && deferred.size === 0) {
      this.cancelIdleCallback();
    }
  }

  private scheduleIdleCallback() {
    const callback = () => {
      this.cancelIdleCallback();

      this.executingCallbacks = true;

      for (const callback of this.current) {
        callback();
      }
      this.current.clear();

      this.executingCallbacks = false;

      // 현재 호출 중에 추가된 콜백이 있는 경우
      // 이를 "현재"로 만들고 새로운 유휴 콜백을 예약합니다.
      if (this.deferred.size > 0) {
        for (const callback of this.deferred) {
          this.current.add(callback);
        }
        this.deferred.clear();
        this.scheduleIdleCallback();
      }
    };
    // `requestIdleCallback`이 현재 Zone.js에 의해 패치되지 않았으므로
    // 콜백이 NgZone 내에서 실행되도록 보장합니다.
    this.idleId = this.requestIdleCallbackFn(() => this.ngZone.run(callback)) as number;
  }

  private cancelIdleCallback() {
    if (this.idleId !== null) {
      this.cancelIdleCallbackFn(this.idleId);
      this.idleId = null;
    }
  }

  ngOnDestroy() {
    this.cancelIdleCallback();
    this.current.clear();
    this.deferred.clear();
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: IdleScheduler,
    providedIn: 'root',
    factory: () => new IdleScheduler(),
  });
}
