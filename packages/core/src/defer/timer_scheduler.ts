/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector, ɵɵdefineInjectable} from '../di';
import {arrayInsert2, arraySplice} from '../util/array_utils';
import {NgZone} from '../zone';

/**
 * 제공된 지연을 캡처하는 함수를 반환합니다.
 * 반환된 함수를 호출하면 트리거가 예약됩니다.
 */
export function onTimer(delay: number) {
  return (callback: VoidFunction, injector: Injector) =>
    scheduleTimerTrigger(delay, callback, injector);
}

/**
 * 주어진 타임아웃 후에 호출될 콜백을 예약합니다.
 *
 * @param delay 콜백이 실행되기까지 기다릴 ms의 수입니다.
 * @param callback 타임아웃 후에 호출될 함수입니다.
 * @param injector 앱의 injector입니다.
 */
export function scheduleTimerTrigger(delay: number, callback: VoidFunction, injector: Injector) {
  const scheduler = injector.get(TimerScheduler);
  const ngZone = injector.get(NgZone);
  const cleanupFn = () => scheduler.remove(callback);
  scheduler.add(delay, callback, ngZone);
  return cleanupFn;
}

/**
 * 배치된 지연 블록의 `setTimeout`을 예약하기 위한 도우미 서비스로,
 * 각 지연 블록에 대해 `setTimeout`을 호출하지 않도록 합니다 (예: 지연 블록이 for 루프 내부에서 생성되는 경우).
 */
export class TimerScheduler {
  // 현재 콜백이 실행 중인지 여부를 표시합니다.
  executingCallbacks = false;

  // 현재 예약된 `setTimeout` ID입니다.
  timeoutId: number | null = null;

  // 현재 예약된 타이머가 실행될 예측 시간입니다.
  invokeTimerAt: number | null = null;

  // 호출될 콜백 목록입니다.
  // 각 콜백에 대해서 콜백이 호출될 시각의 타임스탬프도 저장합니다.
  // 타임스탬프와 콜백 함수를 평면 배열에 저장하여 각 항목에 대해 새로운 객체를 생성하지 않도록 합니다.
  // [timestamp1, callback1, timestamp2, callback2, ...]
  current: Array<number | VoidFunction> = [];

  // 현재 콜백 집합을 호출하는 동안 수집된 콜백 목록입니다.
  // 이 콜백들은 현재 콜백 호출의 끝에서 "current" 큐에 추가됩니다.
  // 이 목록의 형태는 `current` 목록의 형태와 동일합니다.
  deferred: Array<number | VoidFunction> = [];

  add(delay: number, callback: VoidFunction, ngZone: NgZone) {
    const target = this.executingCallbacks ? this.deferred : this.current;
    this.addToQueue(target, Date.now() + delay, callback);
    this.scheduleTimer(ngZone);
  }

  remove(callback: VoidFunction) {
    const {current, deferred} = this;
    const callbackIndex = this.removeFromQueue(current, callback);
    if (callbackIndex === -1) {
      // 현재 큐에서 콜백을 찾지 못한 경우
      // 지연 큐만 정리합니다.
      this.removeFromQueue(deferred, callback);
    }
    // 마지막 콜백이 제거되고 보류 중인 타임아웃이 있다면 - 취소합니다.
    if (current.length === 0 && deferred.length === 0) {
      this.clearTimeout();
    }
  }

  private addToQueue(
    target: Array<number | VoidFunction>,
    invokeAt: number,
    callback: VoidFunction,
  ) {
    let insertAtIndex = target.length;
    for (let i = 0; i < target.length; i += 2) {
      const invokeQueuedCallbackAt = target[i] as number;
      if (invokeQueuedCallbackAt > invokeAt) {
        // 예약된 첫 번째 타이머가
        // 삽입하려는 시간보다 늦습니다.
        // 삽입해야 하는 위치입니다.
        insertAtIndex = i;
        break;
      }
    }
    arrayInsert2(target, insertAtIndex, invokeAt, callback);
  }

  private removeFromQueue(target: Array<number | VoidFunction>, callback: VoidFunction) {
    let index = -1;
    for (let i = 0; i < target.length; i += 2) {
      const queuedCallback = target[i + 1];
      if (queuedCallback === callback) {
        index = i;
        break;
      }
    }
    if (index > -1) {
      // 2개의 요소를 제거합니다: 타임스탬프 슬롯과
      // 콜백 함수가 있는 슬롯입니다.
      arraySplice(target, index, 2);
    }
    return index;
  }

  private scheduleTimer(ngZone: NgZone) {
    const callback = () => {
      this.clearTimeout();

      this.executingCallbacks = true;

      // 콜백을 호출하는 동안 변경될 수 있으므로
      // 큐의 현재 상태를 복사합니다.
      const current = [...this.current];

      // 현재 시간 이전에 실행할 예정인 콜백을 호출합니다.
      const now = Date.now();
      for (let i = 0; i < current.length; i += 2) {
        const invokeAt = current[i] as number;
        const callback = current[i + 1] as VoidFunction;
        if (invokeAt <= now) {
          callback();
        } else {
          // 아직 호출되지 않아야 하는 타이머에 도달했습니다.
          break;
        }
      }
      // 콜백 호출 후 큐의 상태가 변경되었을 수 있으므로
      // 큐의 *현재* 상태를 바탕으로 정리 로직을 실행합니다.
      let lastCallbackIndex = -1;
      for (let i = 0; i < this.current.length; i += 2) {
        const invokeAt = this.current[i] as number;
        if (invokeAt <= now) {
          // 이벤트 배열의 타임스탬프 뒤에 위치한
          // 콜백 함수를 고려하여 +1을 추가합니다.
          lastCallbackIndex = i + 1;
        } else {
          // 아직 호출되지 않아야 하는 타이머에 도달했습니다.
          break;
        }
      }
      if (lastCallbackIndex >= 0) {
        arraySplice(this.current, 0, lastCallbackIndex + 1);
      }

      this.executingCallbacks = false;

      // 현재 호출 중인 콜백에서 추가된 콜백이 있다면
      // "current" 큐로 이동합니다.
      if (this.deferred.length > 0) {
        for (let i = 0; i < this.deferred.length; i += 2) {
          const invokeAt = this.deferred[i] as number;
          const callback = this.deferred[i + 1] as VoidFunction;
          this.addToQueue(this.current, invokeAt, callback);
        }
        this.deferred.length = 0;
      }
      this.scheduleTimer(ngZone);
    };

    // 평균 프레임 지속 시간 당 타이머 콜백이 하나 이상 실행되지 않도록 합니다.
    // 이것은 더 나은 배치 처리를 위해 필요하며
    // 과도한 변경 감지 사이클을 방지합니다.
    const FRAME_DURATION_MS = 16; // 1000ms / 60fps

    if (this.current.length > 0) {
      const now = Date.now();
      // 큐의 첫 번째 요소는
      // 첫 번째(가장 이른) 이벤트의 타임스탬프를 가리킵니다.
      const invokeAt = this.current[0] as number;
      if (
        this.timeoutId === null ||
        // 큐에 더 이른 타임스탬프를 가진 항목이 있는 경우
        // 시간 차이가 평균 프레임 지속 시간보다 큰지 확인하여
        // 타이머를 재예약합니다.
        (this.invokeTimerAt && this.invokeTimerAt - invokeAt > FRAME_DURATION_MS)
      ) {
        // 이전에 타임아웃이 있었지만 더 이른 이벤트가
        // 큐에 추가되었습니다. 이런 경우 이전 타이머를 제거하고
        // 업데이트된(더 짧은) 타임아웃으로 새로운 타이머를 설정합니다.
        this.clearTimeout();

        const timeout = Math.max(invokeAt - now, FRAME_DURATION_MS);
        this.invokeTimerAt = invokeAt;
        this.timeoutId = ngZone.runOutsideAngular(() => {
          return setTimeout(() => ngZone.run(callback), timeout) as unknown as number;
        });
      }
    }
  }

  private clearTimeout() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  ngOnDestroy() {
    this.clearTimeout();
    this.current.length = 0;
    this.deferred.length = 0;
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: TimerScheduler,
    providedIn: 'root',
    factory: () => new TimerScheduler(),
  });
}
