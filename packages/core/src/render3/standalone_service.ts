/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {ɵɵinject as inject} from '../di/injector_compatibility';
import {ɵɵdefineInjectable as defineInjectable} from '../di/interface/defs';
import {internalImportProvidersFrom} from '../di/provider_collection';
import {EnvironmentInjector} from '../di/r3_injector';
import {OnDestroy} from '../interface/lifecycle_hooks';
import {ComponentDef} from './interfaces/definition';
import {createEnvironmentInjector} from './ng_module_ref';

/**
 * 프레임워크가 독립 실행형 주입기의 인스턴스를 생성하는 데 사용하는 서비스입니다. 이러한 주입기는
 * 동적 구성 요소 인스턴스화의 경우 필요에 따라 생성되며, 특정 독립 실행형 구성 요소에 루트된
 * 가져오기 그래프에서 수집된 환경 제공자를 포함합니다.
 */
export class StandaloneService implements OnDestroy {
  cachedInjectors = new Map<ComponentDef<unknown>, EnvironmentInjector | null>();

  constructor(private _injector: EnvironmentInjector) {}

  getOrCreateStandaloneInjector(componentDef: ComponentDef<unknown>): EnvironmentInjector | null {
    if (!componentDef.standalone) {
      return null;
    }

    if (!this.cachedInjectors.has(componentDef)) {
      const providers = internalImportProvidersFrom(false, componentDef.type);
      const standaloneInjector =
        providers.length > 0
          ? createEnvironmentInjector(
              [providers],
              this._injector,
              `Standalone[${componentDef.type.name}]`,
            )
          : null;
      this.cachedInjectors.set(componentDef, standaloneInjector);
    }

    return this.cachedInjectors.get(componentDef)!;
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
    token: StandaloneService,
    providedIn: 'environment',
    factory: () => new StandaloneService(inject(EnvironmentInjector)),
  });
}
