/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {makeParamDecorator} from '../util/decorators';

import {attachInjectFlag} from './injector_compatibility';
import {DecoratorFlags, InternalInjectFlags} from './interface/injector';

/**
 * Inject 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface InjectDecorator {
  /**
   * 경고: 문자열 토큰은 권장되지 않습니다.
   *
   * 대신 InjectionToken이나 클래스를 토큰으로 사용하세요.
   */
  (token: string): any;
  new (token: string): Inject;

  /**
   * 사용자 정의 제공자를 지정하는 클래스 생성자의 종속성 매개변수에 대한 매개변수 데코레이터입니다.
   *
   * @usageNotes
   * 다음 예시는 매개변수 데코레이터를 사용하여 종속성의 사용자 정의 제공자를 지정하는 클래스 생성자를 보여줍니다.
   *
   * `@Inject()`가 없을 때, 주입기는 매개변수의 유형 주석을 제공자로 사용합니다.
   *
   * {@example core/di/ts/metadata_spec.ts region='InjectWithoutDecorator'}
   *
   * @see [의존성 주입 가이드](guide/di/dependency-injection)
   *
   */
  (token: any): any;
  new (token: any): Inject;
}

/**
 * Inject 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Inject {
  /**
   * 주입될 종속성에 매핑되는 DI 토큰입니다.
   */
  token: any;
}

/**
 * Inject 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const Inject: InjectDecorator = attachInjectFlag(
  // Tslint를 비활성화합니다. `DecoratorFlags`는 인라인 처리되는(const enum) 상수 입니다.
  makeParamDecorator('Inject', (token: any) => ({token})),
  // tslint:disable-next-line: no-toplevel-property-access
  DecoratorFlags.Inject,
);

/**
 * Optional 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface OptionalDecorator {
  /**
   * 생성자 매개변수에 사용되는 매개변수 데코레이터로,
   * 매개변수를 선택적 종속성으로 표시합니다.
   * 종속성이 발견되지 않으면 DI 프레임워크가 `null`을 제공합니다.
   *
   * 종속성 주입 작동 방식을 수정하는 다른 매개변수 데코레이터와 함께 사용할 수 있습니다.
   *
   * @usageNotes
   *
   * 다음 코드는 `null` 결과의 가능성을 허용합니다:
   *
   * {@example core/di/ts/metadata_spec.ts region='Optional'}
   *
   * @see [의존성 주입 가이드](guide/di/dependency-injection).
   */
  (): any;
  new (): Optional;
}

/**
 * Optional 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Optional {}

/**
 * Optional 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const Optional: OptionalDecorator =
  // Tslint를 비활성화합니다. `InternalInjectFlags`는 인라인 처리되는(const enum) 상수입니다.
  // tslint:disable-next-line: no-toplevel-property-access
  attachInjectFlag(makeParamDecorator('Optional'), InternalInjectFlags.Optional);

/**
 * Self 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface SelfDecorator {
  /**
   * 생성자 매개변수에 사용되는 매개변수 데코레이터로,
   * DI 프레임워크에 로컬 주입기로부터 종속성 해결을 시작하라고 알려줍니다.
   *
   * 해결은 주입기 계층을 통해 위쪽으로 작동하므로, 이 클래스의 자식은
   * 자신의 제공자를 구성해야 하며 또는 `null` 결과에 대비해야 합니다.
   *
   * @usageNotes
   *
   * 다음 예시에서 종속성은 클래스를 인스턴스화할 때 로컬 주입기에 의해 해결될 수 있지만,
   * 자식을 인스턴스화할 때는 해결할 수 없습니다.
   *
   * {@example core/di/ts/metadata_spec.ts region='Self'}
   *
   * @see {@link SkipSelf}
   * @see {@link Optional}
   *
   */
  (): any;
  new (): Self;
}

/**
 * Self 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Self {}

/**
 * Self 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const Self: SelfDecorator =
  // Tslint를 비활성화합니다. `InternalInjectFlags`는 인라인 처리되는(const enum) 상수입니다.
  // tslint:disable-next-line: no-toplevel-property-access
  attachInjectFlag(makeParamDecorator('Self'), InternalInjectFlags.Self);

/**
 * `SkipSelf` 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface SkipSelfDecorator {
  /**
   * 생성자 매개변수에 사용되는 매개변수 데코레이터로,
   * DI 프레임워크에 부모 주입기로부터 종속성 해결을 시작하라고 알려줍니다.
   * 해결은 주입기 계층을 통해 위쪽으로 작동하므로, 로컬 주입기는
   * 제공자에 대해 확인되지 않습니다.
   *
   * @usageNotes
   *
   * 다음 예시에서 종속성은
   * 자식을 인스턴스화할 때 해결될 수 있지만, 클래스를 인스턴스화할 때는 해결될 수 없습니다.
   *
   * {@example core/di/ts/metadata_spec.ts region='SkipSelf'}
   *
   * @see [의존성 주입 가이드](guide/di/di-in-action#skip).
   * @see {@link Self}
   * @see {@link Optional}
   *
   */
  (): any;
  new (): SkipSelf;
}

/**
 * `SkipSelf` 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface SkipSelf {}

/**
 * `SkipSelf` 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const SkipSelf: SkipSelfDecorator =
  // Tslint를 비활성화합니다. `InternalInjectFlags`는 인라인 처리되는(const enum) 상수입니다.
  // tslint:disable-next-line: no-toplevel-property-access
  attachInjectFlag(makeParamDecorator('SkipSelf'), InternalInjectFlags.SkipSelf);

/**
 * `Host` 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface HostDecorator {
  /**
   * 클래스 생성자의 뷰 제공자 매개변수에 대한 매개변수 데코레이터로,
   * DI 프레임워크에 자식 요소의 주입기를 확인하여
   * 뷰를 해결하라고 알려주며, 현재 컴포넌트의 호스트 요소에 도달할 때까지 멈춥니다.
   *
   * @usageNotes
   *
   * 다음은 `@Optional` 데코레이터와 함께 사용되는 예시로,
   * `null` 결과를 허용합니다.
   *
   * {@example core/di/ts/metadata_spec.ts region='Host'}
   *
   * 확장된 예시는 ["의존성 주입 가이드"](guide/di/di-in-action#optional)를 참조하세요.
   */
  (): any;
  new (): Host;
}

/**
 * Host 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Host {}

/**
 * Host 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const Host: HostDecorator =
  // Tslint를 비활성화합니다. `InternalInjectFlags`는 인라인 처리되는(const enum) 상수입니다.
  // tslint:disable-next-line: no-toplevel-property-access
  attachInjectFlag(makeParamDecorator('Host'), InternalInjectFlags.Host);
