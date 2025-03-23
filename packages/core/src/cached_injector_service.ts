/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ɵɵdefineInjectable as defineInjectable} from './di/interface/defs';
import {Provider} from './di/interface/provider';
import {EnvironmentInjector} from './di/r3_injector';
import {OnDestroy} from './interface/lifecycle_hooks';
import {createEnvironmentInjector} from './render3/ng_module_ref';

/**
 * 프레임워크에서 인젝터 인스턴스를 생성하고 캐시하는 데 사용되는 서비스입니다.
 *
 * 이 서비스는 각 지연 블록 정의에 대해 단일 인젝터 인스턴스를 생성하는 데 사용되며,
 * 특정 유형의 각 지연 블록 인스턴스에 대해 인젝터를 생성하는 것을 방지합니다.
 */
export class CachedInjectorService implements OnDestroy {
  private cachedInjectors = new Map<unknown, EnvironmentInjector | null>();

  getOrCreateInjector(
    key: unknown,
    parentInjector: EnvironmentInjector,
    providers: Provider[],
    debugName?: string,
  ) {
    if (!this.cachedInjectors.has(key)) {
      const injector =
        providers.length > 0
          ? createEnvironmentInjector(providers, parentInjector, debugName)
          : null;
      this.cachedInjectors.set(key, injector);
    }
    return this.cachedInjectors.get(key)!;
  }

  ngOnDestroy() {
    try {
      for (const injector of this.cachedInjectors.values()) {
        if (injector !== null) {
          injector.destroy();
        }
      }
    } finally {
      this.cachedInjectors.clear();
    }
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ defineInjectable({
    token: CachedInjectorService,
    providedIn: 'environment',
    factory: () => new CachedInjectorService(),
  });
}
