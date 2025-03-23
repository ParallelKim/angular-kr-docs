/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../../interface/type';
import {getClosureSafeProperty} from '../../util/property';

import {
  ClassProvider,
  ConstructorProvider,
  EnvironmentProviders,
  ExistingProvider,
  FactoryProvider,
  StaticClassProvider,
  ValueProvider,
} from './provider';

/**
 * DI 시스템과의 관계에서 타입 또는 `InjectionToken`에 대한 정보입니다.
 *
 * 최소한, 이는 주어진 타입 `T`를 생성하는 방법을 정의하는 `factory`를 포함하며,
 * 필요한 경우 다른 타입의 주입을 요청할 수 있습니다.
 *
 * 선택적으로, `providedIn` 매개변수는 주어진 타입이 특정 `Injector`, `NgModule`,
 * 또는 특별한 범위(예: `'root'`)에 속함을 지정합니다. `null` 값은
 * 주입이 어떤 범위에도 속하지 않음을 나타냅니다.
 *
 * @codeGenApi
 * @publicApi ViewEngine 컴파일러는 주입 가능한 객체에 대해 이 타입으로 코드를 생성합니다. 이 코드는
 *   npm에 배포되며, 공개 API로 취급되어야 합니다.
 */
export interface ɵɵInjectableDeclaration<T> {
  /**
   * 주어진 타입이 특정 주입기에 속함을 명시합니다:
   * - `InjectorType`, 예를 들어 `NgModule`,
   * - `'root'` 루트 주입기
   * - `'any'` 모든 주입기.
   * - `null`, 어떤 주입기에도 속하지 않습니다. 주입기에서
   *   `providers`에 명시적으로 나열해야 합니다.
   */
  providedIn: InjectorType<any> | 'root' | 'platform' | 'any' | 'environment' | null;

  /**
   * 이 정의가 속하는 토큰입니다.
   *
   * 이는 `factory`가 생성할 타입과 동일하지 않을 수 있습니다.
   */
  token: unknown;

  /**
   * 주입 가능한 인스턴스를 생성하기 위해 실행할 팩토리 메소드입니다.
   */
  factory: (t?: Type<any>) => T;

  /**
   * 명시적인 주입기가 없는 경우, 주입 가능한 인스턴스가 저장된 위치입니다.
   */
  value: T | undefined;
}

/**
 * `Injector`에 포함될 공급자에 대한 정보와 주어진 타입을
 * DI 시스템이 어떻게 생성해야 하는지를 나타냅니다.
 *
 * `InjectorDef`는 `InjectorDefs`를 가진 다른 타입을 가져올 수 있으며,
 * 정의된 우선순위를 가진 공급자의 깊고 중첩된 구조를 형성합니다
 * (`NgModule`도 가져오기/의존성 구조를 가집니다).
 *
 * NOTE: 이는 비공식 타입이며 내보내지 않아야 합니다.
 *
 * @codeGenApi
 */
export interface ɵɵInjectorDef<T> {
  // TODO(alxhub): 장식자가 장식하는 클래스의 반환 타입을 제대로 변경할 때 이곳에서 타입을 좁히기.
  providers: (
    | Type<any>
    | ValueProvider
    | ExistingProvider
    | FactoryProvider
    | ConstructorProvider
    | StaticClassProvider
    | ClassProvider
    | EnvironmentProviders
    | any[]
  )[];

  imports: (InjectorType<any> | InjectorTypeWithProviders<any>)[];
}

/**
 * `ɵprov: ɵɵInjectableDeclaration` 정적 필드를 가진 `Type`입니다.
 *
 * `InjectableType`은 자체 의존성 주입 메타데이터를 포함하며,
 * `InjectorDef` 기반의 `StaticInjector`에서 사용 가능합니다.
 *
 * @publicApi
 */
export interface InjectableType<T> extends Type<T> {
  /**
   * 구조가 버전에 매우 의존적인 불투명한 타입입니다. 어떤 속성에도 의존해서는 안 됩니다.
   */
  ɵprov: unknown;
}

/**
 * `InjectorDef` 정적 필드를 가진 타입입니다.
 *
 * `InjectorTypes`는 `StaticInjector`를 구성하는 데 사용될 수 있습니다.
 *
 * 이는 구조가 버전에 매우 의존적인 불투명한 타입입니다. 어떤 속성에도 의존해서는 안 됩니다.
 *
 * @publicApi
 */
export interface InjectorType<T> extends Type<T> {
  ɵfac?: unknown;
  ɵinj: unknown;
}

/**
 * 공급자 배열과 연결된 `InjectorType`의 `ModuleWithProviders`에 해당하는 `InjectorDef`를 설명합니다.
 *
 * 이 타입의 객체는 `InjectorDef`의 가져오기 섹션에 나열될 수 있습니다.
 *
 * NOTE: 이는 비공식 타입이며 내보내지 않아야 합니다.
 */
export interface InjectorTypeWithProviders<T> {
  ngModule: InjectorType<T>;
  providers?: (
    | Type<any>
    | ValueProvider
    | ExistingProvider
    | FactoryProvider
    | ConstructorProvider
    | StaticClassProvider
    | ClassProvider
    | EnvironmentProviders
    | any[]
  )[];
}

/**
 * DI 시스템에 의해 토큰이 어떻게 구성될지를 정의하고,
 * 어떤 주입기에서(있는 경우) 사용 가능한지를 정의하는 주입 가능한 정의를 구성합니다.
 *
 * 이는 타입의 정적 `ɵprov` 필드에 할당되어야 하며,
 * 그러면 `InjectableType`이 됩니다.
 *
 * 옵션:
 * * `providedIn`은 주입 가능한 객체를 포함할 주입기를 결정합니다.
 *   이는 `@NgModule` 또는 다른 `InjectorType`에 연결되거나,
 *   이 주입 가능한 객체가 대부분의 앱에서 애플리케이션 수준의 주입기인
 *   `'root'` 주입기에서 제공되어야 함을 지정합니다.
 * * `factory`는 주입 가능한 객체의 인스턴스를 생성할 제로 인수 함수를 제공합니다.
 *   팩토리는 [`inject`](api/core/inject)를 호출하여 `Injector`에 접근하고 의존성의 주입을 요청할 수 있습니다.
 *
 * @codeGenApi
 * @publicApi 이 지침은 ViewEngine에 의해 오랫동안 발행되었으며, npm에 배포됩니다.
 */
export function ɵɵdefineInjectable<T>(opts: {
  token: unknown;
  providedIn?: Type<any> | 'root' | 'platform' | 'any' | 'environment' | null;
  factory: () => T;
}): unknown {
  return {
    token: opts.token,
    providedIn: (opts.providedIn as any) || null,
    factory: opts.factory,
    value: undefined,
  } as ɵɵInjectableDeclaration<T>;
}

/**
 * @deprecated v8에서 사용 중단, v10 이후 삭제. 이 API는 생성된 코드만 사용해야 하며,
 * 현재 해당 코드는 대신 ɵɵdefineInjectable를 사용해야 합니다.
 * @publicApi
 */
export const defineInjectable = ɵɵdefineInjectable;

/**
 * 주입기를 구성하는 `InjectorDef`를 구성합니다.
 *
 * 이는 타입의 정적 주입기 정의(`ɵinj`) 필드에 할당되어야 하며,
 * 그러면 `InjectorType`이 됩니다.
 *
 * 옵션:
 *
 * * `providers`: 주입기에 추가할 선택적 공급자 배열입니다. 각 공급자는
 *   팩토리를 가지고 있거나 `ɵprov` 정적 속성을 가진 타입을 가리켜야 합니다
 *   (타입은 `InjectableType`이어야 합니다).
 * * `imports`: 공급자가 추가될 다른 `InjectorType` 또는 `InjectorTypeWithModule`의 선택적 가져오기 배열입니다.
 *   로컬에서 제공되는 타입은 가져온 공급자를 재정의합니다.
 *
 * @codeGenApi
 */
export function ɵɵdefineInjector(options: {providers?: any[]; imports?: any[]}): unknown {
  return {providers: options.providers || [], imports: options.imports || []};
}

/**
 * 주입 가능한 정의(`ɵprov`)를 읽어 `type`에 대한 상속된 값을 우연히 읽지 않도록
 * 하는 방법입니다.
 *
 * @param type 자체의 (비상속) `ɵprov`를 가질 수 있는 타입입니다.
 */
export function getInjectableDef<T>(type: any): ɵɵInjectableDeclaration<T> | null {
  return getOwnDefinition(type, NG_PROV_DEF) || getOwnDefinition(type, NG_INJECTABLE_DEF);
}

export function isInjectable(type: any): boolean {
  return getInjectableDef(type) !== null;
}

/**
 * 정의가 `type`의 상위 클래스에서 상속되지 않고,
 * 직접 정의된 경우에만 반환합니다.
 */
function getOwnDefinition<T>(type: any, field: string): ɵɵInjectableDeclaration<T> | null {
  return type.hasOwnProperty(field) ? type[field] : null;
}

/**
 * 주입 가능한 정의(`ɵprov`)를 읽거나 상위 클래스 중 하나에서 `ɵprov`를 읽습니다.
 *
 * @param type 상속을 통해 `ɵprov`을 가질 수 있는 타입입니다.
 *
 * @deprecated 나중에 Angular의 미래 버전에서 제거되며,
 *     상위 클래스에서만 `ɵprov`를 찾는 경우 오류가 발생합니다.
 */
export function getInheritedInjectableDef<T>(type: any): ɵɵInjectableDeclaration<T> | null {
  const def = type && (type[NG_PROV_DEF] || type[NG_INJECTABLE_DEF]);

  if (def) {
    ngDevMode &&
      console.warn(
        `DEPRECATED: DI가 "@Injectable" 데코레이터를 상속하지만 자체적으로 제공하지 않는 토큰 "${type.name}"을 인스턴스화 하고 있습니다.\n` +
          `이것은 Angular의 미래 버전에서 오류가 될 것입니다. "${type.name}" 클래스에 @Injectable()을 추가하십시오.`,
      );
    return def;
  } else {
    return null;
  }
}

/**
 * 주입기 정의 타입을 읽는 방법으로 우연히 상속된 값을 읽지 않도록
 * 합니다.
 *
 * @param type 주입기 정의(`ɵinj`)를 가질 수 있는 타입입니다.
 */
export function getInjectorDef<T>(type: any): ɵɵInjectorDef<T> | null {
  return type && (type.hasOwnProperty(NG_INJ_DEF) || type.hasOwnProperty(NG_INJECTOR_DEF))
    ? (type as any)[NG_INJ_DEF]
    : null;
}

export const NG_PROV_DEF = getClosureSafeProperty({ɵprov: getClosureSafeProperty});
export const NG_INJ_DEF = getClosureSafeProperty({ɵinj: getClosureSafeProperty});

// 새 정의가 없는 경우 구형 정의를 읽기 위해 유지해야 합니다.
export const NG_INJECTABLE_DEF = getClosureSafeProperty({ngInjectableDef: getClosureSafeProperty});
export const NG_INJECTOR_DEF = getClosureSafeProperty({ngInjectorDef: getClosureSafeProperty});
