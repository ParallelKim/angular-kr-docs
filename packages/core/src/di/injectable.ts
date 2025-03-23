/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {makeDecorator, TypeDecorator} from '../util/decorators';

import {
  ClassSansProvider,
  ConstructorSansProvider,
  ExistingSansProvider,
  FactorySansProvider,
  StaticClassSansProvider,
  ValueSansProvider,
} from './interface/provider';
import {compileInjectable} from './jit/injectable';

export {compileInjectable};

/**
 * `@Injectable` 데코레이터에서 사용되는 Injectable 프로바이더입니다.
 *
 * @publicApi
 */
export type InjectableProvider =
  | ValueSansProvider
  | ExistingSansProvider
  | StaticClassSansProvider
  | ConstructorSansProvider
  | FactorySansProvider
  | ClassSansProvider;

/**
 * Injectable 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface InjectableDecorator {
  /**
   * 클래스를 제공될 수 있도록 표시하며,
   * 의존성으로 주입받을 수 있도록 만드는 데코레이터입니다.
   *
   * @see [서비스 및 DI 소개](guide/di)
   * @see [의존성 주입 가이드](guide/di/dependency-injection)
   *
   * @usageNotes
   *
   * `@Injectable`로 클래스를 표시하면 컴파일러가 클래스를 주입할 때
   * 클래스의 의존성을 생성하는 데 필요한 메타데이터를 생성합니다.
   *
   * 다음 예시는 서비스 클래스가 적절히 표시되어 지원 서비스가
   * 생성 시 주입될 수 있도록 하는 방법을 보여줍니다.
   *
   * {@example core/di/ts/metadata_spec.ts region='Injectable'}
   *
   */
  (): TypeDecorator;
  (
    options?: {providedIn: Type<any> | 'root' | 'platform' | 'any' | null} & InjectableProvider,
  ): TypeDecorator;
  new (): Injectable;
  new (
    options?: {providedIn: Type<any> | 'root' | 'platform' | 'any' | null} & InjectableProvider,
  ): Injectable;
}

/**
 * Injectable 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Injectable {
  /**
   * 어떤 인젝터가 injectable을 제공할지 결정합니다.
   *
   * - `Type<any>` - injectable을 `@NgModule` 또는 다른 `InjectorType`과 연관시킵니다. 이
   * 옵션은 더 이상 사용되지 않습니다.
   * - 'null' : `undefined`와 동등합니다. injectable이 자동으로 어떤 스코프에서도 제공되지 않으며
   * [@NgModule](api/core/NgModule#providers),
   * [@Component](api/core/Directive#providers) 또는 [@Directive](api/core/Directive#providers)의
   * `providers` 배열에 추가해야 합니다.
   *
   * 다음 옵션들은 이 injectable이 다음 인젝터 중 하나에서 제공되어야 함을 지정합니다:
   * - 'root' : 대부분의 앱의 애플리케이션 레벨 인젝터.
   * - 'platform' : 페이지의 모든 애플리케이션이 공유하는 특별한 싱글톤 플랫폼 인젝터.
   * - 'any' : 모든 지연 로드 모듈에서 고유한 인스턴스를 제공하는 반면, 모든 즉시 로드된
   * 모듈은 하나의 인스턴스를 공유합니다. 이 옵션은 더 이상 사용되지 않습니다.
   *
   */
  providedIn?: Type<any> | 'root' | 'platform' | 'any' | null;
}

/**
 * Injectable 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const Injectable: InjectableDecorator = makeDecorator(
  'Injectable',
  undefined,
  undefined,
  undefined,
  (type: Type<any>, meta: Injectable) => compileInjectable(type as any, meta),
);
