/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ApplicationRef} from '../../application/application_ref';
import {ChangeDetectionSchedulerImpl} from './zoneless_scheduling_impl';
import {inject} from '../../di/injector_compatibility';
import {makeEnvironmentProviders} from '../../di/provider_collection';
import {NgZone} from '../../zone/ng_zone';

import {EnvironmentInjector} from '../../di/r3_injector';
import {ENVIRONMENT_INITIALIZER} from '../../di/initializer_token';
import {CheckNoChangesMode} from '../../render3/state';
import {ErrorHandler} from '../../error_handler';
import {checkNoChangesInternal} from '../../render3/instructions/change_detection';
import {ZONELESS_ENABLED} from './zoneless_scheduling';

/**
 * 주기적으로 표현식이 변경되지 않았는지 확인하는 데 사용됩니다.
 *
 * @param options 확인이 실행될 때를 설정하는 데 사용됩니다.
 *   - `interval`은 애플리케이션 뷰에서 포괄적으로 `checkNoChanges`를 주기적으로 실행합니다.
 *   - `useNgZoneOnStable`은 ZoneJS를 사용하여 변경 감지가 실행되었을 수 있는 시점을 결정합니다.
 *      ZoneJS를 사용하여 변경 감지를 수행하는 애플리케이션에서 `NgZone.onStable`이 호출될 때,
 *      `ApplicationRef`에 연결된 모든 뷰가 변경 여부를 확인합니다.
 *   - 'exhaustive'는 `ApplicationRef`에 연결된 모든 뷰와 그 뷰의 모든 자손을 확인합니다.
 *     ( `ChangeDetectorRef.detach()`를 통해 분리된 서브트리는 제외됨)
 *     이는 일반 변경 감지 후 실행되는 확인이 `ChangeDetectionStrategy.OnPush`를 사용하는 구성 요소에는 작동하지 않기 때문에 유용합니다.
 *     이 검사는 `OnPush` 구성 요소에 의해 숨겨진 기존 오류를 드러냅니다. 기본적으로 이 검사는 포괄적이며 모든 뷰를
 *     "더러운" 상태와 `ChangeDetectionStrategy`에 관계없이 항상 확인합니다.
 *
 * `useNgZoneOnStable` 옵션이 `true`일 경우, 이 함수는 자신의 `NgZone` 구현을 제공하며
 * 다른 모든 `NgZone` 제공자 뒤에 와야 합니다. 이는 `provideZoneChangeDetection()`와 `provideExperimentalZonelessChangeDetection()`을 포함합니다.
 *
 * @experimental
 * @publicApi
 */
export function provideExperimentalCheckNoChangesForDebug(options: {
  interval?: number;
  useNgZoneOnStable?: boolean;
  exhaustive?: boolean;
}) {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    if (options.interval === undefined && !options.useNgZoneOnStable) {
      throw new Error('Must provide one of `useNgZoneOnStable` or `interval`');
    }
    const checkNoChangesMode =
      options?.exhaustive === false
        ? CheckNoChangesMode.OnlyDirtyViews
        : CheckNoChangesMode.Exhaustive;
    return makeEnvironmentProviders([
      options?.useNgZoneOnStable
        ? {provide: NgZone, useFactory: () => new DebugNgZoneForCheckNoChanges(checkNoChangesMode)}
        : [],
      options?.interval !== undefined
        ? exhaustiveCheckNoChangesInterval(options.interval, checkNoChangesMode)
        : [],
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useValue: () => {
          if (
            options?.useNgZoneOnStable &&
            !(inject(NgZone) instanceof DebugNgZoneForCheckNoChanges)
          ) {
            throw new Error(
              '`provideExperimentalCheckNoChangesForDebug` with `useNgZoneOnStable` must be after any other provider for `NgZone`.',
            );
          }
        },
      },
    ]);
  } else {
    return makeEnvironmentProviders([]);
  }
}

export class DebugNgZoneForCheckNoChanges extends NgZone {
  private applicationRef?: ApplicationRef;
  private scheduler?: ChangeDetectionSchedulerImpl;
  private errorHandler?: ErrorHandler;
  private readonly injector = inject(EnvironmentInjector);

  constructor(private readonly checkNoChangesMode: CheckNoChangesMode) {
    const zonelessEnabled = inject(ZONELESS_ENABLED);
    // Use coalescing to ensure we aren't ever running this check synchronously
    super({
      shouldCoalesceEventChangeDetection: true,
      shouldCoalesceRunChangeDetection: zonelessEnabled,
    });

    if (zonelessEnabled) {
      // prevent emits to ensure code doesn't rely on these
      this.onMicrotaskEmpty.emit = () => {};
      this.onStable.emit = () => {
        this.scheduler ||= this.injector.get(ChangeDetectionSchedulerImpl);
        if (this.scheduler.pendingRenderTaskId || this.scheduler.runningTick) {
          return;
        }
        this.checkApplicationViews();
      };
      this.onUnstable.emit = () => {};
    } else {
      this.runOutsideAngular(() => {
        this.onStable.subscribe(() => {
          this.checkApplicationViews();
        });
      });
    }
  }

  private checkApplicationViews() {
    this.applicationRef ||= this.injector.get(ApplicationRef);
    for (const view of this.applicationRef.allViews) {
      try {
        checkNoChangesInternal(view._lView, this.checkNoChangesMode);
      } catch (e) {
        this.errorHandler ||= this.injector.get(ErrorHandler);
        this.errorHandler.handleError(e);
      }
    }
  }
}

function exhaustiveCheckNoChangesInterval(
  interval: number,
  checkNoChangesMode: CheckNoChangesMode,
) {
  return {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useFactory: () => {
      const applicationRef = inject(ApplicationRef);
      const errorHandler = inject(ErrorHandler);
      const scheduler = inject(ChangeDetectionSchedulerImpl);
      const ngZone = inject(NgZone);

      return () => {
        function scheduleCheckNoChanges() {
          ngZone.runOutsideAngular(() => {
            setTimeout(() => {
              if (applicationRef.destroyed) {
                return;
              }
              if (scheduler.pendingRenderTaskId || scheduler.runningTick) {
                scheduleCheckNoChanges();
                return;
              }

              for (const view of applicationRef.allViews) {
                try {
                  checkNoChangesInternal(view._lView, checkNoChangesMode);
                } catch (e) {
                  errorHandler.handleError(e);
                }
              }

              scheduleCheckNoChanges();
            }, interval);
          });
        }
        scheduleCheckNoChanges();
      };
    },
  };
}
