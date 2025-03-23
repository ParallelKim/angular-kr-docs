/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer} from '@angular/core/primitives/signals';
import {PartialObserver, Subject, Subscription} from 'rxjs';

import {OutputRef} from './authoring/output/output_ref';
import {isInInjectionContext} from './di/contextual';
import {inject} from './di/injector_compatibility';
import {DestroyRef} from './linker/destroy_ref';
import {PendingTasksInternal} from './pending_tasks';

/**
 * `@Output` 디렉티브가 있는 구성 요소에서 사용자 정의 이벤트를
 * 동기적 또는 비동기적으로 방출하고, 해당 이벤트에 대한 핸들러를 등록하는 데 사용합니다.
 *
 * @usageNotes
 *
 * RxJS `Subject`를 확장하여 `emit()` 메서드를 추가하여 Angular에서 사용합니다.
 *
 * 다음 예에서, 구성 요소는 이벤트 방출기를 생성하는 두 개의 출력 속성을 정의합니다.
 * 제목을 클릭하면, 방출기는 현재 가시성 상태를 전환하기 위해 열기 또는 닫기 이벤트를 방출합니다.
 *
 * ```angular-ts
 * @Component({
 *   selector: 'zippy',
 *   template: `
 *   <div class="zippy">
 *     <div (click)="toggle()">Toggle</div>
 *     <div [hidden]="!visible">
 *       <ng-content></ng-content>
 *     </div>
 *  </div>`})
 * export class Zippy {
 *   visible: boolean = true;
 *   @Output() open: EventEmitter<any> = new EventEmitter();
 *   @Output() close: EventEmitter<any> = new EventEmitter();
 *
 *   toggle() {
 *     this.visible = !this.visible;
 *     if (this.visible) {
 *       this.open.emit(null);
 *     } else {
 *       this.close.emit(null);
 *     }
 *   }
 * }
 * ```
 *
 * `$event` 인수를 통해 이벤트 객체에 접근하여 출력 이벤트 핸들러에서 사용할 수 있습니다:
 *
 * ```html
 * <zippy (open)="onOpen($event)" (close)="onClose($event)"></zippy>
 * ```
 *
 * @publicApi
 */
export interface EventEmitter<T> extends Subject<T>, OutputRef<T> {
  /**
   * @internal
   */
  __isAsync: boolean;

  /**
   * 동기적 또는 비동기적으로 이벤트를 전달할 수 있는 이 클래스의 인스턴스를 생성합니다.
   *
   * @param [isAsync=false] true일 경우, 비동기적으로 이벤트를 전달합니다.
   *
   */
  new (isAsync?: boolean): EventEmitter<T>;

  /**
   * 주어진 값을 포함하는 이벤트를 방출합니다.
   * @param value 방출할 값.
   */
  emit(value?: T): void;

  /**
   * 이 인스턴스에 의해 방출된 이벤트에 대한 핸들러를 등록합니다.
   * @param next 제공되는 경우, 방출된 이벤트에 대한 사용자 정의 핸들러.
   * @param error 제공되는 경우, 이 방출기에서의 오류 알림에 대한 사용자 정의 핸들러.
   * @param complete 제공되는 경우, 이 방출기에서 완료 알림에 대한 사용자 정의 핸들러.
   */
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): Subscription;
  /**
   * 이 인스턴스에 의해 방출된 이벤트에 대한 핸들러를 등록합니다.
   * @param observerOrNext 제공되는 경우, 방출된 이벤트에 대한 사용자 정의 핸들러 또는 관찰자 객체.
   * @param error 제공되는 경우, 이 방출기에서의 오류 알림에 대한 사용자 정의 핸들러.
   * @param complete 제공되는 경우, 이 방출기에서 완료 알림에 대한 사용자 정의 핸들러.
   */
  subscribe(observerOrNext?: any, error?: any, complete?: any): Subscription;
}

class EventEmitter_ extends Subject<any> implements OutputRef<any> {
  // tslint:disable-next-line:require-internal-with-underscore
  __isAsync: boolean;
  destroyRef: DestroyRef | undefined = undefined;
  private readonly pendingTasks: PendingTasksInternal | undefined = undefined;

  constructor(isAsync: boolean = false) {
    super();
    this.__isAsync = isAsync;

    // `DestroyRef` 및 `PendingTasks`를 선택적으로 검색하려고 시도합니다.
    // 이전 버전과의 호환성 이유로 요구할 수 없습니다.
    if (isInInjectionContext()) {
      // `DestroyRef`는 모든 컨텍스트에서 사용할 수 없기 때문에 선택적입니다.
      // 하지만 컴포넌트/디렉티브가 파괴될 때 `outputToObservable`과 함께 사용되면
      // `EventEmitter`를 적절히 완료하는 데 유용합니다. (자세한 내용은 `outputToObservable`을 참조하세요.)
      this.destroyRef = inject(DestroyRef, {optional: true}) ?? undefined;
      this.pendingTasks = inject(PendingTasksInternal, {optional: true}) ?? undefined;
    }
  }

  emit(value?: any) {
    const prevConsumer = setActiveConsumer(null);
    try {
      super.next(value);
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }

  override subscribe(observerOrNext?: any, error?: any, complete?: any): Subscription {
    let nextFn = observerOrNext;
    let errorFn = error || (() => null);
    let completeFn = complete;

    if (observerOrNext && typeof observerOrNext === 'object') {
      const observer = observerOrNext as PartialObserver<unknown>;
      nextFn = observer.next?.bind(observer);
      errorFn = observer.error?.bind(observer);
      completeFn = observer.complete?.bind(observer);
    }

    if (this.__isAsync) {
      errorFn = this.wrapInTimeout(errorFn);

      if (nextFn) {
        nextFn = this.wrapInTimeout(nextFn);
      }

      if (completeFn) {
        completeFn = this.wrapInTimeout(completeFn);
      }
    }

    const sink = super.subscribe({next: nextFn, error: errorFn, complete: completeFn});

    if (observerOrNext instanceof Subscription) {
      observerOrNext.add(sink);
    }

    return sink;
  }

  private wrapInTimeout(fn: (value: unknown) => any) {
    return (value: unknown) => {
      const taskId = this.pendingTasks?.add();
      setTimeout(() => {
        fn(value);
        if (taskId !== undefined) {
          this.pendingTasks?.remove(taskId);
        }
      });
    };
  }
}

/**
 * @publicApi
 */
export const EventEmitter: {
  new (isAsync?: boolean): EventEmitter<any>;
  new <T>(isAsync?: boolean): EventEmitter<T>;
  readonly prototype: EventEmitter<any>;
} = EventEmitter_ as any;
