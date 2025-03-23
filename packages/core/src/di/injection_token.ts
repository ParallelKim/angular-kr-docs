/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {assertLessThan} from '../util/assert';

import {ɵɵdefineInjectable} from './interface/defs';

/**
 * DI 제공자에서 사용할 수 있는 토큰을 생성합니다.
 *
 * 인터페이스, 호출 가능한 타입, 배열 또는 매개변수화된 타입과 같이 주입하는 타입이
 * 구체화되지 않았을 때(런타임 표현이 없는 경우) `InjectionToken`을 사용합니다.
 *
 * `InjectionToken`은 `Injector`에서 반환할 객체의 타입인 `T`로 매개변수화됩니다.
 * 이는 추가적인 타입 안전성을 제공합니다.
 *
 * <div class="docs-alert docs-alert-helpful">
 *
 * **중요한 참고 사항**: 제공자와 주입 호출에서 `InjectionToken`의 동일한 인스턴스를 사용해야 합니다.
 * 서로 다른 위치에서 동일한 설명과 함께 `InjectionToken`의 새 인스턴스를 생성하면 Angular의 DI 시스템에서
 * 서로 다른 토큰으로 취급되어 `NullInjectorError`가 발생합니다.
 *
 * </div>
 *
 * {@example injection-token/src/main.ts region='InjectionToken'}
 *
 * `InjectionToken`을 생성할 때, 매개변수화된 타입 `T`의 기본값을 반환(필요시 생성)하는
 * 팩토리 함수를 선택적으로 지정할 수 있습니다. 이는 애플리케이션의 루트 인젝터에 명시적으로 정의된 것처럼
 * 이 팩토리를 제공자로 사용하여 `InjectionToken`을 설정합니다. 인수가 없는 팩토리 함수가
 * 의존성을 주입해야 하는 경우, [`inject`](api/core/inject) 함수를 사용하여 이를 수행할 수 있습니다.
 * 아래의 트리-쉐이커블 InjectionToken 예제를 참고하세요.
 *
 * 추가적으로 `factory`가 지정된 경우 `providedIn` 옵션을 지정할 수 있으며, 이는 위의 동작을
 * 재정의하고 특정 `@NgModule`에 속하는 토큰으로 표시합니다(참고: 이 옵션은 이제 더 이상 권장되지 않음).
 * 위에서 언급했듯이, `'root'`는 `providedIn`의 기본값입니다.
 *
 * `providedIn: NgModule` 및 `providedIn: 'any'` 옵션은 더 이상 권장되지 않습니다.
 *
 * @usageNotes
 * ### 기본 예제
 *
 * ### 일반 InjectionToken
 *
 * {@example core/di/ts/injector_spec.ts region='InjectionToken'}
 *
 * ### 트리-쉐이커블 InjectionToken
 *
 * {@example core/di/ts/injector_spec.ts region='ShakableInjectionToken'}
 *
 * @publicApi
 */
export class InjectionToken<T> {
  /** @internal */
  readonly ngMetadataName = 'InjectionToken';

  readonly ɵprov: unknown;

  /**
   * @param _desc   토큰에 대한 설명,
   *                디버깅 목적으로만 사용됩니다,
   *                고유해야 하지만 고유할 필요는 없습니다
   * @param options 위에서 설명한 토큰 사용에 대한 옵션
   */
  constructor(
    protected _desc: string,
    options?: {
      providedIn?: Type<any> | 'root' | 'platform' | 'any' | null;
      factory: () => T;
    },
  ) {
    this.ɵprov = undefined;
    if (typeof options == 'number') {
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        assertLessThan(options, 0, '여기서는 음수만 지원됩니다');
      // 이는 이 인스턴스에 __NG_ELEMENT_ID__를 할당하는 특수 해킹입니다.
      // `InjectorMarkers`를 참조하세요.
      (this as any).__NG_ELEMENT_ID__ = options;
    } else if (options !== undefined) {
      this.ɵprov = ɵɵdefineInjectable({
        token: this,
        providedIn: options.providedIn || 'root',
        factory: options.factory,
      });
    }
  }

  /**
   * @internal
   */
  get multi(): InjectionToken<Array<T>> {
    return this as InjectionToken<Array<T>>;
  }

  toString(): string {
    return `InjectionToken ${this._desc}`;
  }
}

export interface InjectableDefToken<T> extends InjectionToken<T> {
  ɵprov: unknown;
}
