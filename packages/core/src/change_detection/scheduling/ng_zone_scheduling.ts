/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Subscription} from 'rxjs';

import {ApplicationRef} from '../../application/application_ref';
import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  makeEnvironmentProviders,
  StaticProvider,
} from '../../di';
import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {PendingTasksInternal} from '../../pending_tasks';
import {performanceMarkFeature} from '../../util/performance';
import {NgZone} from '../../zone';
import {InternalNgZoneOptions} from '../../zone/ng_zone';

import {
  ChangeDetectionScheduler,
  ZONELESS_SCHEDULER_DISABLED,
  ZONELESS_ENABLED,
  SCHEDULE_IN_ROOT_ZONE,
} from './zoneless_scheduling';
import {SCHEDULE_IN_ROOT_ZONE_DEFAULT} from './flags';
import {INTERNAL_APPLICATION_ERROR_HANDLER, ErrorHandler} from '../../error_handler';

@Injectable({providedIn: 'root'})
export class NgZoneChangeDetectionScheduler {
  private readonly zone = inject(NgZone);
  private readonly changeDetectionScheduler = inject(ChangeDetectionScheduler);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly applicationErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);

  private _onMicrotaskEmptySubscription?: Subscription;

  initialize(): void {
    if (this._onMicrotaskEmptySubscription) {
      return;
    }

    this._onMicrotaskEmptySubscription = this.zone.onMicrotaskEmpty.subscribe({
      next: () => {
        // `onMicroTaskEmpty`는 조정 없는 스케줄러 변경 감지 도중 발생할 수 있습니다.
        // zone.run(() => {})는 `zone.run` 클로저의 끝에서 `checkStable`을 결과로 하며
        // run coalescing이 false일 경우 `onMicrotaskEmpty`를 동기적으로 방출합니다.
        if (this.changeDetectionScheduler.runningTick) {
          return;
        }
        this.zone.run(() => {
          try {
            this.applicationRef.tick();
          } catch (e) {
            this.applicationErrorHandler(e);
          }
        });
      },
    });
  }

  ngOnDestroy() {
    this._onMicrotaskEmptySubscription?.unsubscribe();
  }
}

/**
 * `provideZoneChangeDetection`이 bootstrapModule API와 함께 사용되지 않는지 확인하는 데 사용되는 내부 토큰.
 */
export const PROVIDED_NG_ZONE = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'provideZoneChangeDetection token' : '',
  {factory: () => false},
);

export function internalProvideZoneChangeDetection({
  ngZoneFactory,
  ignoreChangesOutsideZone,
  scheduleInRootZone,
}: {
  ngZoneFactory?: () => NgZone;
  ignoreChangesOutsideZone?: boolean;
  scheduleInRootZone?: boolean;
}): StaticProvider[] {
  ngZoneFactory ??= () =>
    new NgZone({...getNgZoneOptions(), scheduleInRootZone} as InternalNgZoneOptions);
  return [
    {provide: NgZone, useFactory: ngZoneFactory},
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: () => {
        const ngZoneChangeDetectionScheduler = inject(NgZoneChangeDetectionScheduler, {
          optional: true,
        });
        if (
          (typeof ngDevMode === 'undefined' || ngDevMode) &&
          ngZoneChangeDetectionScheduler === null
        ) {
          throw new RuntimeError(
            RuntimeErrorCode.MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP,
            `필수 Injectable이 의존성 주입 트리에서 발견되지 않았습니다. ` +
              'NgModule을 부트스트랩하는 경우 `BrowserModule`이 임포트되었는지 확인하세요.',
          );
        }
        return () => ngZoneChangeDetectionScheduler!.initialize();
      },
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: () => {
        const service = inject(ZoneStablePendingTask);
        return () => {
          service.initialize();
        };
      },
    },
    // 항상 명시적으로 비활성화될 때 스케줄러를 비활성화합니다.
    ignoreChangesOutsideZone === true ? {provide: ZONELESS_SCHEDULER_DISABLED, useValue: true} : [],
    {
      provide: SCHEDULE_IN_ROOT_ZONE,
      useValue: scheduleInRootZone ?? SCHEDULE_IN_ROOT_ZONE_DEFAULT,
    },
    {
      provide: INTERNAL_APPLICATION_ERROR_HANDLER,
      useFactory: () => {
        const zone = inject(NgZone);
        const userErrorHandler = inject(ErrorHandler);
        return (e: unknown) => zone.runOutsideAngular(() => userErrorHandler.handleError(e));
      },
    },
  ];
}

/**
 * `bootstrapApplication`을 사용하여 부트스트랩된 애플리케이션용 `NgZone` 기반 변경 감지를 제공합니다.
 *
 * 기본적으로 애플리케이션에서 이미 `NgZone`이 제공됩니다. 이 프로바이더를 사용하면
 * `NgZone`의 `eventCoalescing`과 같은 옵션을 구성할 수 있습니다.
 * 이 프로바이더는 `platformBrowser().bootstrapModule`에는 제공되지 않으며, 대신
 * `BootstrapOptions`를 사용합니다.
 *
 * @usageNotes
 * ```ts
 * bootstrapApplication(MyApp, {providers: [
 *   provideZoneChangeDetection({eventCoalescing: true}),
 * ]});
 * ```
 *
 * @publicApi
 * @see {@link /api/platform-browser/bootstrapApplication bootstrapApplication}
 * @see {@link NgZoneOptions}
 */
export function provideZoneChangeDetection(options?: NgZoneOptions): EnvironmentProviders {
  const ignoreChangesOutsideZone = options?.ignoreChangesOutsideZone;
  const scheduleInRootZone = (options as any)?.scheduleInRootZone;
  const zoneProviders = internalProvideZoneChangeDetection({
    ngZoneFactory: () => {
      const ngZoneOptions = getNgZoneOptions(options);
      ngZoneOptions.scheduleInRootZone = scheduleInRootZone;
      if (ngZoneOptions.shouldCoalesceEventChangeDetection) {
        performanceMarkFeature('NgZone_CoalesceEvent');
      }
      return new NgZone(ngZoneOptions);
    },
    ignoreChangesOutsideZone,
    scheduleInRootZone,
  });
  return makeEnvironmentProviders([
    {provide: PROVIDED_NG_ZONE, useValue: true},
    {provide: ZONELESS_ENABLED, useValue: false},
    zoneProviders,
  ]);
}

/**
 * `provideZoneChangeDetection`과 함께 이벤트 및 실행 집합을 구성하는 데 사용됩니다.
 *
 * @publicApi
 *
 * @see {@link provideZoneChangeDetection}
 */
export interface NgZoneOptions {
  /**
   * 이벤트 변경 감지가 집합되는지 여부를 선택적으로 지정합니다.
   * 다음 경우를 고려하세요.
   *
   * ```html
   * <div (click)="doSomething()">
   *   <button (click)="doSomethingElse()"></button>
   * </div>
   * ```
   *
   * 버튼이 클릭되면 이벤트 버블링 때문에 두 개의 이벤트 핸들러가 모두 호출되고
   * 두 번의 변경 감지가 트리거됩니다. 이러한 종류의 이벤트를 집합할 수 있습니다.
   * 변경 감지를 한 번만 트리거하도록.
   *
   * 기본적으로 이 옵션은 false로 설정되어 있으며, 이는 이벤트가 집합되지 않고
   * 변경 감지가 여러 번 트리거됨을 의미합니다. 이 옵션이 true로 설정되면
   * 위에서 설명한 시나리오에서 변경 감지가 한 번 트리거됩니다.
   */
  eventCoalescing?: boolean;

  /**
   * 선택적으로 `NgZone#run()` 메서드 호출이 단일 변경 감지로 집합되도록 설정합니다.
   *
   * 다음 경우를 고려하세요.
   * ```ts
   * for (let i = 0; i < 10; i ++) {
   *   ngZone.run(() => {
   *     // 작업 수행
   *   });
   * }
   * ```
   *
   * 이 경우 변경 감지가 여러 번 트리거됩니다.
   * ngZoneRunCoalescing 옵션을 사용하면 이벤트 루프 내의 모든 변경 감지가 한 번만 트리거됩니다.
   * 또한 변경 감지는 requestAnimation으로 실행됩니다.
   *
   */
  runCoalescing?: boolean;

  /**
   * false일 때, Angular가 템플릿을 새로고침해야 한다는 명확한 표시를 수신할 때
   * 변경 감지가 예약됩니다. 여기에는 다음이 포함됩니다:
   *
   * - `ChangeDetectorRef.markForCheck` 호출
   * - `ComponentRef.setInput` 호출
   * - 템플릿에서 읽은 신호 업데이트
   * - 더러운 것으로 표시된 뷰 연결
   * - 뷰 제거
   * - 렌더 후크 등록 (렌더 후크가 위의 작업 중 하나를 수행해야지만 템플릿이 새로고침됩니다)
   *
   * @deprecated 이 옵션은 개발자가 새로운 동작을 선택할 수 있는 방법으로
   *    v18에서 도입되었습니다. 이 이벤트가 발생할 때 변경 감지가 예약됩니다.
   *    새로운 기능이 예상대로 작동한다고 판단하여 이 옵션을 true로 설정하여 비활성화
   *    해서는 안 된다고 믿습니다.
   */
  ignoreChangesOutsideZone?: boolean;
}

// `BootstrapOptions`의 집합을 변환합니다 (NgModule 기반 부트스트랩 API에서 지원됨) ->
// `NgZone` 생성자가 인식하는 `NgZoneOptions`. 옵션이 없으면 기본 옵션 집합이 반환됩니다.
export function getNgZoneOptions(options?: NgZoneOptions): InternalNgZoneOptions {
  return {
    enableLongStackTrace: typeof ngDevMode === 'undefined' ? false : !!ngDevMode,
    shouldCoalesceEventChangeDetection: options?.eventCoalescing ?? false,
    shouldCoalesceRunChangeDetection: options?.runCoalescing ?? false,
  };
}

@Injectable({providedIn: 'root'})
export class ZoneStablePendingTask {
  private readonly subscription = new Subscription();
  private initialized = false;
  private readonly zone = inject(NgZone);
  private readonly pendingTasks = inject(PendingTasksInternal);

  initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    let task: number | null = null;
    if (!this.zone.isStable && !this.zone.hasPendingMacrotasks && !this.zone.hasPendingMicrotasks) {
      task = this.pendingTasks.add();
    }

    this.zone.runOutsideAngular(() => {
      this.subscription.add(
        this.zone.onStable.subscribe(() => {
          NgZone.assertNotInAngularZone();

          // 다음 틱에서 대기 중인 매크로/마이크로 작업이 없음을 확인합니다.
          // NgZone이 상태를 업데이트하도록 허용합니다.
          queueMicrotask(() => {
            if (
              task !== null &&
              !this.zone.hasPendingMacrotasks &&
              !this.zone.hasPendingMicrotasks
            ) {
              this.pendingTasks.remove(task);
              task = null;
            }
          });
        }),
      );
    });

    this.subscription.add(
      this.zone.onUnstable.subscribe(() => {
        NgZone.assertInAngularZone();
        task ??= this.pendingTasks.add();
      }),
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
