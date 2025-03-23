/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {SCHEDULE_IN_ROOT_ZONE_DEFAULT} from '../change_detection/scheduling/flags';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {EventEmitter} from '../event_emitter';
import {scheduleCallbackWithRafRace} from '../util/callback_scheduler';
import {noop} from '../util/noop';

import {AsyncStackTaggingZoneSpec} from './async-stack-tagging';

// 아래는 G3에서 여러 대상을 실패하게 하는 오류를 방지하기 위해 필요합니다:
// ERROR - [JSC_UNDEFINED_VARIABLE] 변수 Zone이 선언되지 않았습니다
declare const Zone: any;

const isAngularZoneProperty = 'isAngularZone';
export const angularZoneInstanceIdProperty = isAngularZoneProperty + '_ID';

let ngZoneInstanceId = 0;

/**
 * Angular 존 내 또는 외부에서 작업을 실행하기 위한 주입 가능한 서비스입니다.
 *
 * 이 서비스의 가장 일반적인 사용은 UI 업데이트나 오류 처리를 Angular가 처리할 필요가 없는 하나 이상의 비동기 작업으로 구성된 작업을 시작할 때 성능을 최적화하는 것입니다.
 * 이러한 작업은 {@link #runOutsideAngular}를 통해 시작될 수 있으며, 필요에 따라 {@link #run}을 통해 Angular 존으로 다시 들어올 수 있습니다.
 *
 * <!-- TODO: 링크 추가/수정:
 *   - Angular에서의 존과 존 사용, 변경 감지에 대한 문서 설명
 *   - runOutsideAngular/run에 대한 링크 (이 파일 전체에서!)
 *   -->
 *
 * @usageNotes
 * ### 예제
 *
 * ```ts
 * import {Component, NgZone} from '@angular/core';
 * import {NgIf} from '@angular/common';
 *
 * @Component({
 *   selector: 'ng-zone-demo',
 *   template: `
 *     <h2>예제: NgZone</h2>
 *
 *     <p>진행 상황: {{progress}}%</p>
 *     <p *ngIf="progress >= 100">Angular 존의 {{label}} 처리가 완료되었습니다!</p>
 *
 *     <button (click)="processWithinAngularZone()">Angular 존 내에서 처리하기</button>
 *     <button (click)="processOutsideOfAngularZone()">Angular 존 외부에서 처리하기</button>
 *   `,
 * })
 * export class NgZoneDemo {
 *   progress: number = 0;
 *   label: string;
 *
 *   constructor(private _ngZone: NgZone) {}
 *
 *   // Angular 존 내에서 반복
 *   // 각 setTimeout 주기 후 UI가 새로 고침됩니다
 *   processWithinAngularZone() {
 *     this.label = 'inside';
 *     this.progress = 0;
 *     this._increaseProgress(() => console.log('내부 완료!'));
 *   }
 *
 *   // Angular 존 외부에서 반복
 *   // 각 setTimeout 주기 후 UI가 새로 고침되지 않습니다
 *   processOutsideOfAngularZone() {
 *     this.label = 'outside';
 *     this.progress = 0;
 *     this._ngZone.runOutsideAngular(() => {
 *       this._increaseProgress(() => {
 *         // Angular 존으로 돌아가서 완료를 표시합니다
 *         this._ngZone.run(() => { console.log('외부 완료!'); });
 *       });
 *     });
 *   }
 *
 *   _increaseProgress(doneCallback: () => void) {
 *     this.progress += 1;
 *     console.log(`현재 진행 상황: ${this.progress}%`);
 *
 *     if (this.progress < 100) {
 *       window.setTimeout(() => this._increaseProgress(doneCallback), 10);
 *     } else {
 *       doneCallback();
 *     }
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export class NgZone {
  readonly hasPendingMacrotasks: boolean = false;
  readonly hasPendingMicrotasks: boolean = false;

  /**
   * 미확인 마이크로작업이나 매크로작업이 없는지 여부.
   */
  readonly isStable: boolean = true;

  /**
   * 코드가 Angular 존에 들어갈 때 알림을 보냅니다. VM 턴에서 가장 먼저 호출됩니다.
   */
  readonly onUnstable: EventEmitter<any> = new EventEmitter(false);

  /**
   * 현재 VM 턴에서 더 이상 대기 중인 마이크로작업이 없을 때 알림을 보냅니다.
   * 이는 Angular가 변경 감지를 수행하게 하여 더 많은 마이크로작업을 큐에 추가할 수 있습니다.
   * 이러한 이유로 이 이벤트는 VM 턴당 여러 번 호출될 수 있습니다.
   */
  readonly onMicrotaskEmpty: EventEmitter<any> = new EventEmitter(false);

  /**
   * 마지막 `onMicrotaskEmpty`가 실행되고 더 이상 마이크로작업이 없을 때 알림을 보냅니다.
   * 이는 우리는 곧 VM 턴을 넘기려 하고 있음을 의미합니다.
   * 이 이벤트는 한 번만 호출됩니다.
   */
  readonly onStable: EventEmitter<any> = new EventEmitter(false);

  /**
   * 오류가 발생했음을 알립니다.
   */
  readonly onError: EventEmitter<any> = new EventEmitter(false);

  constructor(options: {
    enableLongStackTrace?: boolean;
    shouldCoalesceEventChangeDetection?: boolean;
    shouldCoalesceRunChangeDetection?: boolean;
  }) {
    const {
      enableLongStackTrace = false,
      shouldCoalesceEventChangeDetection = false,
      shouldCoalesceRunChangeDetection = false,
      scheduleInRootZone = SCHEDULE_IN_ROOT_ZONE_DEFAULT,
    } = options as InternalNgZoneOptions;

    if (typeof Zone == 'undefined') {
      throw new RuntimeError(
        RuntimeErrorCode.MISSING_ZONEJS,
        ngDevMode && `Angular는 이 구성에서 Zone.js가 필요합니다.`,
      );
    }

    Zone.assertZonePatched();
    const self = this as any as NgZonePrivate;
    self._nesting = 0;

    self._outer = self._inner = Zone.current;

    // AsyncStackTaggingZoneSpec는 비동기 작업이 예약된 위치를 표시하는 '연결된 스택 추적'을 제공합니다.
    // 더 자세한 내용은 이 기사를 참조하십시오, https://developer.chrome.com/blog/devtools-better-angular-debugging/
    // 우리는 개발 모드에서만 이 AsyncStackTaggingZoneSpec을 가져옵니다.
    // 프로덕션 모드에서는 AsyncStackTaggingZoneSpec이 트리 쉐이킹됩니다.
    if (ngDevMode) {
      self._inner = self._inner.fork(new AsyncStackTaggingZoneSpec('Angular'));
    }

    if ((Zone as any)['TaskTrackingZoneSpec']) {
      self._inner = self._inner.fork(new ((Zone as any)['TaskTrackingZoneSpec'] as any)());
    }

    if (enableLongStackTrace && (Zone as any)['longStackTraceZoneSpec']) {
      self._inner = self._inner.fork((Zone as any)['longStackTraceZoneSpec']);
    }
    // shouldCoalesceRunChangeDetection이 true이면 모든 작업, 이벤트 작업을 포함하여
    // 묶일 것이고, 따라서 shouldCoalesceEventChangeDetection 옵션은 필요하지 않으며 건너뛸 수 있습니다.
    self.shouldCoalesceEventChangeDetection =
      !shouldCoalesceRunChangeDetection && shouldCoalesceEventChangeDetection;
    self.shouldCoalesceRunChangeDetection = shouldCoalesceRunChangeDetection;
    self.callbackScheduled = false;
    self.scheduleInRootZone = scheduleInRootZone;
    forkInnerZoneWithAngularBehavior(self);
  }

  /**
    이 메서드는 메서드 호출이 Angular Zone 인스턴스 내에서 이루어지는지 확인합니다.
  */
  static isInAngularZone(): boolean {
    // Zone은 확인해야 합니다. 왜냐하면 이 메서드는 NoopNgZone이 사용된 경우에도 호출될 수 있기 때문입니다.
    return typeof Zone !== 'undefined' && Zone.current.get(isAngularZoneProperty) === true;
  }

  /**
    메서드가 Angular Zone 내에서 호출되도록 보장합니다. 그렇지 않으면 오류를 발생시킵니다.
  */
  static assertInAngularZone(): void {
    if (!NgZone.isInAngularZone()) {
      throw new RuntimeError(
        RuntimeErrorCode.UNEXPECTED_ZONE_STATE,
        ngDevMode && 'Angular Zone 내에 있어야 하지만 그렇지 않습니다!',
      );
    }
  }

  /**
    메서드가 Angular Zone 외부에서 호출되도록 보장합니다. 그렇지 않으면 오류를 발생시킵니다.
  */
  static assertNotInAngularZone(): void {
    if (NgZone.isInAngularZone()) {
      throw new RuntimeError(
        RuntimeErrorCode.UNEXPECTED_ZONE_STATE,
        ngDevMode && 'Angular Zone 내에 있지 않아야 하지만 그렇습니다!',
      );
    }
  }

  /**
   * Angular 존 내에서 `fn` 함수를 동기적으로 실행하고,
   * 함수가 반환한 값을 반환합니다.
   *
   * `run`을 통한 함수 실행은 Angular 존 외부에서 실행된 작업에서 Angular 존으로 다시 들어오는 것을 허용합니다
   * (일반적으로 {@link #runOutsideAngular}를 통해 시작된).
   *
   * 이 함수 내에서 예약된 모든 향후 작업이나 마이크로 작업은
   * Angular 존 내에서 계속 실행됩니다.
   *
   * 동기 오류가 발생하면 재발생되어 `onError`로 보고되지 않습니다.
   */
  run<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
    return (this as any as NgZonePrivate)._inner.run(fn, applyThis, applyArgs);
  }

  /**
   * Angular 존 내에서 `fn` 함수를 동기적으로 작업으로 실행하고,
   * 함수가 반환한 값을 반환합니다.
   *
   * `runTask`를 통한 함수 실행은 Angular 존 외부에서 실행된 작업에서 Angular 존으로 다시 들어오는 것을 허용합니다
   * (일반적으로 {@link #runOutsideAngular}를 통해 시작된).
   *
   * 이 함수 내에서 예약된 모든 향후 작업이나 마이크로 작업은
   * Angular 존 내에서 계속 실행됩니다.
   *
   * 동기 오류가 발생하면 재발생되어 `onError`로 보고되지 않습니다.
   */
  runTask<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], name?: string): T {
    const zone = (this as any as NgZonePrivate)._inner;
    const task = zone.scheduleEventTask('NgZoneEvent: ' + name, fn, EMPTY_PAYLOAD, noop, noop);
    try {
      return zone.runTask(task, applyThis, applyArgs);
    } finally {
      zone.cancelTask(task);
    }
  }

  /**
   * `run`과 동일하지만 동기 오류는 잡아서 `onError`로 전달되며
   * 재발생되지 않습니다.
   */
  runGuarded<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
    return (this as any as NgZonePrivate)._inner.runGuarded(fn, applyThis, applyArgs);
  }

  /**
   * Angular의 부모 존 내에서 `fn` 함수를 동기적으로 실행하고,
   * 함수가 반환한 값을 반환합니다.
   *
   * {@link #runOutsideAngular}를 통한 함수 실행은 Angular의 존에서 벗어나 작업을 수행할 수 있으며,
   * 이는 Angular 변경 감지를 유발하지 않거나 Angular의 오류 처리를 받습니다.
   *
   * 이 함수 내에서 예약된 모든 향후 작업이나 마이크로 작업은
   * Angular 존 외부에서 계속 실행됩니다.
   *
   * Angular 존으로 다시 들어오려면 {@link #run}을 사용하여 애플리케이션 모델을 업데이트하는 작업을 수행하십시오.
   */
  runOutsideAngular<T>(fn: (...args: any[]) => T): T {
    return (this as any as NgZonePrivate)._outer.run(fn);
  }
}

const EMPTY_PAYLOAD = {};

export interface NgZonePrivate extends NgZone {
  _outer: Zone;
  _inner: Zone;
  _nesting: number;
  _hasPendingMicrotasks: boolean;

  hasPendingMacrotasks: boolean;
  hasPendingMicrotasks: boolean;
  callbackScheduled: boolean;
  /**
   * NgZone이 현재 checkStable에 있는지 여부를 나타내는 플래그로 재진입을 방지합니다.
   * 이 플래그는 변경 감지를 내부에서 호출하여 잘못된 동작을 초래할 수 있기 때문에 필요합니다.
   *
   * 자세한 내용은 여기를 참조하십시오,
   * https://github.com/angular/angular/pull/40540
   */
  isCheckStableRunning: boolean;
  isStable: boolean;
  /**
   * 이벤트 변경 감지를 묶을지 여부를 선택적으로 지정합니다.
   * 다음의 경우를 고려하십시오.
   *
   * <div (click)="doSomething()">
   *   <button (click)="doSomethingElse()"></button>
   * </div>
   *
   * 버튼이 클릭될 때 이벤트 버블링 때문에 두 이벤트 핸들러가 호출되고 2번의 변경 감지가 발생합니다.
   * 우리는 이러한 종류의 이벤트를 묶어 변경 감지가 한 번만 발생하도록 할 수 있습니다.
   *
   * 기본적으로 이 옵션은 false입니다. 따라서 이벤트는 묶이지 않고 변경 감지가 여러 번 발생합니다.
   * 또한 이 옵션이 true로 설정되면 변경 감지가 비동기적으로 애니메이션 프레임에 예약됩니다. 따라서 위의 경우에서
   * 변경 감지는 한 번만 발생합니다.
   */
  shouldCoalesceEventChangeDetection: boolean;
  /**
   * `NgZone#run()` 메서드 호출이 단일 변경 감지로 묶일지 여부를 선택적으로 지정합니다.
   *
   * 다음 경우를 고려하십시오.
   *
   * for (let i = 0; i < 10; i ++) {
   *   ngZone.run(() => {
   *     // 작업 수행
   *   });
   * }
   *
   * 이 경우 변경 감지는 여러 번 발생합니다.
   * ngZoneRunCoalescing 옵션을 사용하면 이벤트 루프에서 모든 변경 감지가 한 번만 발생합니다.
   * 또한 변경 감지는 requestAnimation에서 실행됩니다.
   *
   */
  shouldCoalesceRunChangeDetection: boolean;

  /**
   * 루트 존에서 묶인 변경 감지를 예약할지 여부
   */
  scheduleInRootZone: boolean;
}

function checkStable(zone: NgZonePrivate) {
  // TODO: @JiaLiPassion, 재진입을 방지하기 위해 zone.isCheckStableRunning를 확인해야 합니다.
  // 다음과 같은 경우:
  //
  // @Component({...})
  // export class AppComponent {
  // constructor(private ngZone: NgZone) {
  //   this.ngZone.onStable.subscribe(() => {
  //     this.ngZone.run(() => console.log('안정적이다'););
  //   });
  // }
  //
  // onStable 구독자는 ngZone 내부에서 다른 함수를 실행하여
  // checkStable()의 재진입을 초래합니다.
  // 그러나 이 수정은 g3에서 일부 문제를 일으키므로 다른 PR에서 구현됩니다.
  if (zone._nesting == 0 && !zone.hasPendingMicrotasks && !zone.isStable) {
    try {
      zone._nesting++;
      zone.onMicrotaskEmpty.emit(null);
    } finally {
      zone._nesting--;
      if (!zone.hasPendingMicrotasks) {
        try {
          zone.runOutsideAngular(() => zone.onStable.emit(null));
        } finally {
          zone.isStable = true;
        }
      }
    }
  }
}

function delayChangeDetectionForEvents(zone: NgZonePrivate) {
  /**
   * 여기서 _nesting도 확인해야 합니다
   * shouldCoalesceRunChangeDetection = true인 경우 다음과 같이 고려하십시오.
   *
   * ngZone.run(() => {});
   * ngZone.run(() => {});
   *
   * 우리는 두 `ngZone.run()`이 shouldCoalesceRunChangeDetection이 true일 때 한 번만 변경 감지를 유발하도록 하고 싶습니다.
   * 그리고 이 경우 변경 감지는 비동기 방식(requestAnimationFrame)으로 실행되므로,
   * 우리는 여러 번의 변경 감지를 방지하기 위해 여기서도 _nesting을 확인해야 합니다.
   */
  if (zone.isCheckStableRunning || zone.callbackScheduled) {
    return;
  }
  zone.callbackScheduled = true;
  function scheduleCheckStable() {
    scheduleCallbackWithRafRace(() => {
      zone.callbackScheduled = false;
      updateMicroTaskStatus(zone);
      zone.isCheckStableRunning = true;
      checkStable(zone);
      zone.isCheckStableRunning = false;
    });
  }
  if (zone.scheduleInRootZone) {
    Zone.root.run(() => {
      scheduleCheckStable();
    });
  } else {
    zone._outer.run(() => {
      scheduleCheckStable();
    });
  }
  updateMicroTaskStatus(zone);
}

function forkInnerZoneWithAngularBehavior(zone: NgZonePrivate) {
  const delayChangeDetectionForEventsDelegate = () => {
    delayChangeDetectionForEvents(zone);
  };
  const instanceId = ngZoneInstanceId++;
  zone._inner = zone._inner.fork({
    name: 'angular',
    properties: <any>{
      [isAngularZoneProperty]: true,
      [angularZoneInstanceIdProperty]: instanceId,
      [angularZoneInstanceIdProperty + instanceId]: true,
    },
    onInvokeTask: (
      delegate: ZoneDelegate,
      current: Zone,
      target: Zone,
      task: Task,
      applyThis: any,
      applyArgs: any,
    ): any => {
      // 플래그가 감지되면 변경 감지를 유발하지 않도록 합니다.
      if (shouldBeIgnoredByZone(applyArgs)) {
        return delegate.invokeTask(target, task, applyThis, applyArgs);
      }

      try {
        onEnter(zone);
        return delegate.invokeTask(target, task, applyThis, applyArgs);
      } finally {
        if (
          (zone.shouldCoalesceEventChangeDetection && task.type === 'eventTask') ||
          zone.shouldCoalesceRunChangeDetection
        ) {
          delayChangeDetectionForEventsDelegate();
        }
        onLeave(zone);
      }
    },

    onInvoke: (
      delegate: ZoneDelegate,
      current: Zone,
      target: Zone,
      callback: Function,
      applyThis: any,
      applyArgs?: any[],
      source?: string,
    ): any => {
      try {
        onEnter(zone);
        return delegate.invoke(target, callback, applyThis, applyArgs, source);
      } finally {
        if (
          zone.shouldCoalesceRunChangeDetection &&
          // 스케줄러의 틱이 아닌 경우 변경 감지를 지연하지 않습니다.
          // 우리는 안정성 논리를 동기적으로 트리거할 필요가 있습니다.
          // 이는 zone 기반 스케줄러가 중복 ApplicationRef.tick을 방지할 수 있도록 하기 위해서입니다.
          // 이 로직은 다소 우회적이긴 하지만,
          // 우리는 여전히 zone.run을 종료할 때 모든 올바른 이벤트를 트리거하고 싶습니다
          // (`onMicrotaskEmpty` 및 `onStable`이 발생해야 함; 개발자는 이러한 이벤트가
          // 변경 감지가 실행된 후 발생하는 코드가 있을 수 있습니다).
          // 참고: `zone.callbackScheduled`는 이미 delayChangeDetectionForEventsDelegate에 있지만
          // 불필요한 applyArgs 읽기를 방지하기 위해 여기에도 추가됩니다.
          !zone.callbackScheduled &&
          !isSchedulerTick(applyArgs)
        ) {
          delayChangeDetectionForEventsDelegate();
        }
        onLeave(zone);
      }
    },

    onHasTask: (
      delegate: ZoneDelegate,
      current: Zone,
      target: Zone,
      hasTaskState: HasTaskState,
    ) => {
      delegate.hasTask(target, hasTaskState);
      if (current === target) {
        // 우리는 우리의 존에서 발생하는 hasTask 이벤트에만 관심이 있습니다.
        // (자식 hasTask 이벤트는 우리에게 흥미롭지 않습니다)
        if (hasTaskState.change == 'microTask') {
          zone._hasPendingMicrotasks = hasTaskState.microTask;
          updateMicroTaskStatus(zone);
          checkStable(zone);
        } else if (hasTaskState.change == 'macroTask') {
          zone.hasPendingMacrotasks = hasTaskState.macroTask;
        }
      }
    },

    onHandleError: (delegate: ZoneDelegate, current: Zone, target: Zone, error: any): boolean => {
      delegate.handleError(target, error);
      zone.runOutsideAngular(() => zone.onError.emit(error));
      return false;
    },
  });
}

function updateMicroTaskStatus(zone: NgZonePrivate) {
  if (
    zone._hasPendingMicrotasks ||
    ((zone.shouldCoalesceEventChangeDetection || zone.shouldCoalesceRunChangeDetection) &&
      zone.callbackScheduled === true)
  ) {
    zone.hasPendingMicrotasks = true;
  } else {
    zone.hasPendingMicrotasks = false;
  }
}

function onEnter(zone: NgZonePrivate) {
  zone._nesting++;
  if (zone.isStable) {
    zone.isStable = false;
    zone.onUnstable.emit(null);
  }
}

function onLeave(zone: NgZonePrivate) {
  zone._nesting--;
  checkStable(zone);
}

/**
 * 아무것도 하지 않는 `NgZone`의 noop 구현을 제공합니다. 이 존은 렌더링을 수행하기 위해 프레임워크에 대한 명시적인 호출이 필요합니다.
 */
export class NoopNgZone implements NgZone {
  readonly hasPendingMicrotasks = false;
  readonly hasPendingMacrotasks = false;
  readonly isStable = true;
  readonly onUnstable = new EventEmitter<any>();
  readonly onMicrotaskEmpty = new EventEmitter<any>();
  readonly onStable = new EventEmitter<any>();
  readonly onError = new EventEmitter<any>();

  run<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any): T {
    return fn.apply(applyThis, applyArgs);
  }

  runGuarded<T>(fn: (...args: any[]) => any, applyThis?: any, applyArgs?: any): T {
    return fn.apply(applyThis, applyArgs);
  }

  runOutsideAngular<T>(fn: (...args: any[]) => T): T {
    return fn();
  }

  runTask<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any, name?: string): T {
    return fn.apply(applyThis, applyArgs);
  }
}

function shouldBeIgnoredByZone(applyArgs: unknown): boolean {
  return hasApplyArgsData(applyArgs, '__ignore_ng_zone__');
}

function isSchedulerTick(applyArgs: unknown): boolean {
  return hasApplyArgsData(applyArgs, '__scheduler_tick__');
}

function hasApplyArgsData(applyArgs: unknown, key: string) {
  if (!Array.isArray(applyArgs)) {
    return false;
  }

  // invokeTask에 전달되는 인수가 하나만 있기를 원합니다.
  // 이 동작이 변경될 경우를 대비하여 여기에서 단숨에 확인합니다.
  if (applyArgs.length !== 1) {
    return false;
  }

  return applyArgs[0]?.data?.[key] === true;
}

// NgZone에서 인식하는 옵션 집합.
export interface InternalNgZoneOptions {
  enableLongStackTrace?: boolean;
  shouldCoalesceEventChangeDetection?: boolean;
  shouldCoalesceRunChangeDetection?: boolean;
  scheduleInRootZone?: boolean;
}

export function getNgZone(
  ngZoneToUse: NgZone | 'zone.js' | 'noop' = 'zone.js',
  options: InternalNgZoneOptions,
): NgZone {
  if (ngZoneToUse === 'noop') {
    return new NoopNgZone();
  }
  if (ngZoneToUse === 'zone.js') {
    return new NgZone(options);
  }
  return ngZoneToUse;
}
