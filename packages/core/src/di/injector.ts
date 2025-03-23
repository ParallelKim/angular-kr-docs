/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createInjector} from './create_injector';
import {THROW_IF_NOT_FOUND, ɵɵinject} from './injector_compatibility';
import {InjectorMarkers} from './injector_marker';
import {INJECTOR} from './injector_token';
import {ɵɵdefineInjectable} from './interface/defs';
import {InjectOptions} from './interface/injector';
import {Provider, StaticProvider} from './interface/provider';
import {NullInjector} from './null_injector';
import {ProviderToken} from './provider_token';

/**
 * 구체적인 인젝터는 이 인터페이스를 구현합니다. 인젝터는 다양한 유형의 의존성과
 * [주입 토큰](guide/di/dependency-injection-providers)과 연결된 [프로바이더](guide/di/dependency-injection-providers)로 구성됩니다.
 *
 * @see [DI Providers](guide/di/dependency-injection-providers).
 * @see {@link StaticProvider}
 *
 * @usageNotes
 *
 * 다음 예제는 서비스 인젝터 인스턴스를 생성합니다.
 *
 * {@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
 *
 * ### 사용 예
 *
 * {@example core/di/ts/injector_spec.ts region='Injector'}
 *
 * `Injector`는 `Injector`를 토큰으로 제공할 때 자신을 반환합니다:
 *
 * {@example core/di/ts/injector_spec.ts region='injectInjector'}
 *
 * @publicApi
 */
export abstract class Injector {
  static THROW_IF_NOT_FOUND = THROW_IF_NOT_FOUND;
  static NULL: Injector = /* @__PURE__ */ new NullInjector();

  /**
   * 제공된 토큰을 기준으로 인젝터에서 인스턴스를 검색합니다.
   * @returns 정의된 경우 인젝터에서 인스턴스, 그렇지 않으면 `notFoundValue`.
   * @throws `notFoundValue`가 `undefined`이거나 `Injector.THROW_IF_NOT_FOUND`일 때.
   */
  abstract get<T>(
    token: ProviderToken<T>,
    notFoundValue: undefined,
    options: InjectOptions & {
      optional?: false;
    },
  ): T;
  /**
   * 제공된 토큰을 기준으로 인젝터에서 인스턴스를 검색합니다.
   * @returns 정의된 경우 인젝터에서 인스턴스, 그렇지 않으면 `notFoundValue`.
   * @throws `notFoundValue`가 `undefined`이거나 `Injector.THROW_IF_NOT_FOUND`일 때.
   */
  abstract get<T>(
    token: ProviderToken<T>,
    notFoundValue: null | undefined,
    options: InjectOptions,
  ): T | null;
  /**
   * 제공된 토큰을 기준으로 인젝터에서 인스턴스를 검색합니다.
   * @returns 정의된 경우 인젝터에서 인스턴스, 그렇지 않으면 `notFoundValue`.
   * @throws `notFoundValue`가 `undefined`이거나 `Injector.THROW_IF_NOT_FOUND`일 때.
   */
  abstract get<T>(token: ProviderToken<T>, notFoundValue?: T, options?: InjectOptions): T;
  /**
   * @deprecated v4.0.0부터 ProviderToken<T> 사용
   * @suppress {duplicate}
   */
  abstract get<T>(token: string | ProviderToken<T>, notFoundValue?: any): any;

  /**
   * @deprecated v5부터 새로운 서명 Injector.create(options) 사용
   */
  static create(providers: StaticProvider[], parent?: Injector): Injector;

  /**
   * 주어진 유형 또는 유형의 `StaticProvider`에 따라 하나 이상의 의존성을 제공하는
   * 새로운 인젝터 인스턴스를 생성합니다.
   *
   * @param options 다음 속성이 포함된 객체:
   * * `providers`: [StaticProvider 유형](api/core/StaticProvider)의 프로바이더 배열.
   * * `parent`: (선택 사항) 부모 인젝터.
   * * `name`: (선택 사항) 새로운 인젝터에 대한 개발자 정의 식별 이름.
   *
   * @returns 새로운 인젝터 인스턴스.
   *
   */
  static create(options: {
    providers: Array<Provider | StaticProvider>;
    parent?: Injector;
    name?: string;
  }): DestroyableInjector;

  static create(
    options:
      | StaticProvider[]
      | {providers: Array<Provider | StaticProvider>; parent?: Injector; name?: string},
    parent?: Injector,
  ): Injector {
    if (Array.isArray(options)) {
      return createInjector({name: ''}, parent, options, '');
    } else {
      const name = options.name ?? '';
      return createInjector({name}, options.parent, options.providers, name);
    }
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: Injector,
    providedIn: 'any',
    factory: () => ɵɵinject(INJECTOR),
  });

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__ = InjectorMarkers.Injector;
}

/**
 * 소유자가 파괴할 수 있으며 DestroyRef.destroy 훅을 트리거할 수 있는 인젝터.
 *
 * @publicApi
 */
export interface DestroyableInjector extends Injector {
  destroy(): void;
}
