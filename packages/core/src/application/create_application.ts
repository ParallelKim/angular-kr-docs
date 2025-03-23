/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {internalProvideZoneChangeDetection} from '../change_detection/scheduling/ng_zone_scheduling';
import {EnvironmentProviders, Provider, StaticProvider} from '../di/interface/provider';
import {EnvironmentInjector} from '../di/r3_injector';
import {Type} from '../interface/type';
import {createOrReusePlatformInjector} from '../platform/platform';
import {assertStandaloneComponentType} from '../render3/errors';
import {EnvironmentNgModuleRefAdapter} from '../render3/ng_module_ref';

import {ApplicationRef} from './application_ref';
import {ChangeDetectionScheduler} from '../change_detection/scheduling/zoneless_scheduling';
import {ChangeDetectionSchedulerImpl} from '../change_detection/scheduling/zoneless_scheduling_impl';
import {bootstrap} from '../platform/bootstrap';
import {profiler} from '../render3/profiler';
import {ProfilerEvent} from '../render3/profiler_types';

/**
 * 내부 애플리케이션 생성 API로, 핵심 애플리케이션 생성 논리와 선택적 부트스트랩 논리를 구현합니다.
 *
 * 플랫폼(예: `platform-browser`)은 애플리케이션이 올바르게 작동하기 위해 다른 애플리케이션 및 플랫폼 제공자 집합이 필요할 수 있습니다. 결과적으로, 플랫폼은 이 함수를 내부에서 사용할 수 있으며 부트스트랩 중에 필요한 제공자를 공급하고, 플랫폼별 API를 공용 API의 일부로 노출할 수 있습니다.
 *
 * @returns 해결되면 `ApplicationRef` 인스턴스를 반환하는 약속입니다.
 */

export function internalCreateApplication(config: {
  rootComponent?: Type<unknown>;
  appProviders?: Array<Provider | EnvironmentProviders>;
  platformProviders?: Provider[];
}): Promise<ApplicationRef> {
  profiler(ProfilerEvent.BootstrapApplicationStart);
  try {
    const {rootComponent, appProviders, platformProviders} = config;

    if ((typeof ngDevMode === 'undefined' || ngDevMode) && rootComponent !== undefined) {
      assertStandaloneComponentType(rootComponent);
    }

    const platformInjector = createOrReusePlatformInjector(platformProviders as StaticProvider[]);

    // 플랫폼 부트스트랩 수준에서 구성된 제공자 집합 및 사용자가 부트스트랩 호출에 전달한 제공자를 기반으로 루트 애플리케이션 인젝터를 생성합니다.
    const allAppProviders = [
      internalProvideZoneChangeDetection({}),
      {provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl},
      ...(appProviders || []),
    ];
    const adapter = new EnvironmentNgModuleRefAdapter({
      providers: allAppProviders,
      parent: platformInjector as EnvironmentInjector,
      debugName: typeof ngDevMode === 'undefined' || ngDevMode ? '환경 인젝터' : '',
      // 우리는 NgZone 내부에서 실행해야 하므로 환경 초기화기를 건너뛰며, 이는 Injector로부터 NgZone 인스턴스를 얻은 후 발생합니다.
      runEnvironmentInitializers: false,
    });

    return bootstrap({
      r3Injector: adapter.injector,
      platformInjector,
      rootComponent,
    });
  } catch (e) {
    return Promise.reject(e);
  } finally {
    profiler(ProfilerEvent.BootstrapApplicationEnd);
  }
}
