/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import '../util/ng_dev_mode';

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {Type} from '../interface/type';
import {emitInjectEvent} from '../render3/debug/injector_profiler';
import {stringify} from '../util/stringify';

import {resolveForwardRef} from './forward_ref';
import {getInjectImplementation, injectRootLimpMode} from './inject_switch';
import type {Injector} from './injector';
import {DecoratorFlags, InternalInjectFlags, InjectOptions} from './interface/injector';
import {ProviderToken} from './provider_token';
import type {HostAttributeToken} from './host_attribute_token';
import {
  Injector as PrimitivesInjector,
  NotFound,
  InjectionToken as PrimitivesInjectionToken,
  getCurrentInjector,
} from '@angular/core/primitives/di';
import {InjectionToken} from './injection_token';

const _THROW_IF_NOT_FOUND = {};
export const THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;

export {getCurrentInjector, setCurrentInjector} from '@angular/core/primitives/di';

/*
 * DI 데코레이터에 패치하는 속성 이름으로, 이 데코레이터가 나타내는 InjectFlag의 주석으로 사용됩니다.
 * 이는 코드에서 DI 데코레이터에 대한 직접 참조를 피할 수 있게 하여 트리 쉐이커블하게 만듭니다.
 */
const DI_DECORATOR_FLAG = '__NG_DI_FLAG__';

/**
 * `PrimitivesInjector` 인터페이스를 구현하는 `Injector`에 대한 래퍼입니다.
 *
 * 이는 새로운 primitives 기반 DI 시스템에서 `inject` 함수를 사용할 수 있도록 허용합니다.
 */
export class RetrievingInjector implements PrimitivesInjector {
  constructor(readonly injector: Injector) {}
  retrieve<T>(token: PrimitivesInjectionToken<T>, options: unknown): T | NotFound {
    const flags: InternalInjectFlags =
      convertToBitFlags(options as InjectOptions | undefined) || InternalInjectFlags.Default;
    return (this.injector as BackwardsCompatibleInjector).get(
      token as unknown as InjectionToken<T>,
      // 선택적 플래그로 의존성이 요청되면 DI는 기본값으로 null을 반환합니다.
      flags & InternalInjectFlags.Optional ? null : undefined,
      flags,
    ) as T;
  }
}

export const NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
const NG_TOKEN_PATH = 'ngTokenPath';
const NEW_LINE = /\n/gm;
const NO_NEW_LINE = 'ɵ';
export const SOURCE = '__source';

/**
 * 내부 기호가 주입 플래그를 사용할 수 있게 하는 임시 유형입니다. 이 플래그는
 * 통합할 때 제거되어야 하며 객체 리터럴 접근 방식과 함께 사용됩니다.
 */
export type BackwardsCompatibleInjector = Injector & {
  get<T>(
    token: ProviderToken<T>,
    notFoundValue?: T,
    options?: InternalInjectFlags | InjectOptions,
  ): T;
};

export function injectInjectorOnly<T>(token: ProviderToken<T>): T;
export function injectInjectorOnly<T>(
  token: ProviderToken<T>,
  flags?: InternalInjectFlags,
): T | null;
export function injectInjectorOnly<T>(
  token: ProviderToken<T>,
  flags = InternalInjectFlags.Default,
): T | null {
  const currentInjector = getCurrentInjector();
  if (currentInjector === undefined) {
    throw new RuntimeError(
      RuntimeErrorCode.MISSING_INJECTION_CONTEXT,
      ngDevMode &&
        `\`${stringify(token)}\` 토큰 주입에 실패했습니다. \`inject()\` 함수는 생성자, 팩토리 함수, 필드 초기화기 또는 \`runInInjectionContext\`와 함께 사용되는 함수와 같은 주입 컨텍스트에서 호출되어야 합니다.`,
    );
  } else if (currentInjector === null) {
    return injectRootLimpMode(token, undefined, flags);
  } else {
    const value = currentInjector.retrieve(
      token as PrimitivesInjectionToken<T>,
      convertToInjectOptions(flags),
    ) as T;
    ngDevMode && emitInjectEvent(token as Type<unknown>, value, flags);
    return value;
  }
}

/**
 * 생성된 명령: 현재 활성 주입기로부터 토큰을 주입합니다.
 *
 * (추가 문서는 `inject`로 이동되었으며, 이는 공개 API이며 이
 * 명령의 별칭입니다.)
 *
 * @see inject
 * @codeGenApi
 * @publicApi 이 명령은 ViewEngine에 의해 일정 기간 발생하였으며 npm에 배포되었습니다.
 */
export function ɵɵinject<T>(token: ProviderToken<T>): T;
export function ɵɵinject<T>(token: ProviderToken<T>, flags?: InternalInjectFlags): T | null;
export function ɵɵinject(token: HostAttributeToken): string;
export function ɵɵinject(token: HostAttributeToken, flags?: InternalInjectFlags): string | null;
export function ɵɵinject<T>(
  token: ProviderToken<T> | HostAttributeToken,
  flags?: InternalInjectFlags,
): string | null;
export function ɵɵinject<T>(
  token: ProviderToken<T> | HostAttributeToken,
  flags = InternalInjectFlags.Default,
): T | null {
  return (getInjectImplementation() || injectInjectorOnly)(
    resolveForwardRef(token as Type<T>),
    flags,
  );
}

/**
 * 특정 클래스에 대해 컴파일러가 생성할 수 없는 팩토리 함수가 있다는 것을 나타내는 오류를 던집니다.
 *
 * 클래스의 이름은 여기 언급되지 않지만, 생성된 팩토리 함수의 이름에 있으며,
 * 따라서 스택 추적에 나타납니다.
 *
 * @codeGenApi
 */
export function ɵɵinvalidFactoryDep(index: number): never {
  throw new RuntimeError(
    RuntimeErrorCode.INVALID_FACTORY_DEPENDENCY,
    ngDevMode &&
      `이 생성자는 Angular 의존성 주입과 호환되지 않습니다. 인덱스 ${index}의 매개변수 목록에서 해당 의존성이 유효하지 않습니다.
이는 의존성 유형이 문자열과 같은 원시 유형인 경우나 이 클래스의 조상이 Angular 데코레이터가 없는 경우 발생할 수 있습니다.

1) 인덱스 ${index}의 매개변수 유형이 올바른지 확인하고, 2) 이 클래스 및 그 조상에 대해 올바른 Angular 데코레이터가 정의되어 있는지 확인하세요.`,
  );
}

/**
 * @param token 주입되어야 하는 의존성을 나타내는 토큰입니다.
 * @returns 작업이 성공하면 주입된 값, 그렇지 않으면 `null`입니다.
 * @throws 지원되는 컨텍스트 외부에서 호출 된 경우.
 *
 * @publicApi
 */
export function inject<T>(token: ProviderToken<T>): T;
/**
 * @param token 주입되어야 하는 의존성을 나타내는 토큰입니다.
 * @param options 주입 실행 방식을 제어합니다. 옵션은 매개변수 데코레이터 `@Host`, `@Self`, `@SkipSelf`, 및
 *     `@Optional`로 지정할 수 있는 주입 전략과 일치합니다.
 * @returns 작업이 성공하면 주입된 값입니다.
 * @throws 지원되는 컨텍스트 외부에서 호출되거나 토큰을 찾을 수 없는 경우.
 *
 * @publicApi
 */
export function inject<T>(token: ProviderToken<T>, options: InjectOptions & {optional?: false}): T;
/**
 * @param token 주입되어야 하는 의존성을 나타내는 토큰입니다.
 * @param options 주입 실행 방식을 제어합니다. 옵션은 매개변수 데코레이터 `@Host`, `@Self`, `@SkipSelf`, 및
 *     `@Optional`로 지정할 수 있는 주입 전략과 일치합니다.
 * @returns 작업이 성공하면 주입된 값, 토큰이 발견되지 않고 선택적 주입이 요청된 경우 `null`입니다.
 * @throws 지원되는 컨텍스트 외부에서 호출되거나 토큰을 찾을 수 없고 선택적
 *     주입이 요청되지 않은 경우.
 *
 * @publicApi
 */
export function inject<T>(token: ProviderToken<T>, options: InjectOptions): T | null;
/**
 * @param token 주입되어야 하는 호스트 노드의 정적 속성을 나타내는 토큰입니다.
 * @returns 속성이 존재하는 경우 값입니다.
 * @throws 지원되는 컨텍스트 외부에서 호출되거나 속성이 존재하지 않는 경우.
 *
 * @publicApi
 */
export function inject(token: HostAttributeToken): string;
/**
 * @param token 주입되어야 하는 호스트 노드의 정적 속성을 나타내는 토큰입니다.
 * @returns 속성이 존재하는 경우 속성의 값, 그렇지 않으면 `null`입니다.
 * @throws 지원되는 컨텍스트 외부에서 호출되는 경우.
 *
 * @publicApi
 */
export function inject(token: HostAttributeToken, options: {optional: true}): string | null;
/**
 * @param token 주입되어야 하는 호스트 노드의 정적 속성을 나타내는 토큰입니다.
 * @returns 속성이 존재하는 경우 값입니다.
 * @throws 지원되는 컨텍스트 외부에서 호출되거나 속성이 존재하지 않는 경우.
 *
 * @publicApi
 */
export function inject(token: HostAttributeToken, options: {optional: false}): string;
/**
 * 현재 활성 주입기로부터 토큰을 주입합니다.
 * `inject`는 [주입 컨텍스트](guide/di/dependency-injection-context)에서만 지원됩니다.
 * 다음 중에서 사용할 수 있습니다:
 * - DI 시스템에 의해 인스턴스화되는 클래스의 `constructor`를 통한 생성(예: `@Injectable` 또는 `@Component`).
 * - 이러한 클래스의 필드 초기화기에서.
 * - `Provider` 또는 `@Injectable`의 `useFactory`로 지정된 팩토리 함수에서.
 * - `InjectionToken`에 지정된 `factory` 함수에서.
 * - DI 컨텍스트의 함수 호출 스택프레임에서.
 *
 * @param token 주입되어야 하는 의존성을 나타내는 토큰입니다.
 * @param flags 주입 실행 방식을 제어하는 선택적 플래그입니다.
 * 이 플래그는 매개변수 데코레이터 `@Host`, `@Self`, `@SkipSelf`, 및 `@Optional`로 지정할 수 있는 주입 전략과 일치합니다.
 * @returns 작업이 성공하면 주입된 값, 그렇지 않으면 `null`입니다.
 * @throws 지원되는 컨텍스트 외부에서 호출되는 경우.
 *
 * @usageNotes
 * 실제로 `inject()` 호출은 생성자, 생성자 매개변수 및 필드 초기화기에서 허용됩니다:
 *
 * ```ts
 * @Injectable({providedIn: 'root'})
 * export class Car {
 *   radio: Radio|undefined;
 *   // OK: 필드 초기화기
 *   spareTyre = inject(Tyre);
 *
 *   constructor() {
 *     // OK: 생성자 본문
 *     this.radio = inject(Radio);
 *   }
 * }
 * ```
 *
 * 팩토리의 현재 주입된 클래스를 호출하는 것도 합법입니다:
 *
 * ```ts
 * providers: [
 *   {provide: Car, useFactory: () => {
 *     // OK: 클래스 팩토리
 *     const engine = inject(Engine);
 *     return new Car(engine);
 *   }}
 * ]
 * ```
 *
 * 클래스 생성 컨텍스트 외부에서 `inject()` 함수에 대한 호출은 오류를 발생시킵니다. 특히,
 * 클래스 인스턴스가 생성된 후 `inject()` 호출은 허용되지 않습니다:
 *
 * ```ts
 * @Component({ ... })
 * export class CarComponent {
 *   ngOnInit() {
 *     // 오류: 너무 늦었습니다. 컴포넌트 인스턴스가 이미 생성되었습니다.
 *     const engine = inject(Engine);
 *     engine.start();
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export function inject<T>(token: ProviderToken<T> | HostAttributeToken, options?: InjectOptions) {
  // 여기에 있는 `as any`는 _필요하지_ 않지만, JSCompiler가
  // 여러 서명으로 인해 모호성 오류를 발생시키기 때문에 사용해야 합니다.
  return ɵɵinject(token as any, convertToBitFlags(options));
}

// 객체 기반 DI 플래그(`InjectOptions`)를 비트 플래그(`InjectFlags`)로 변환합니다.
export function convertToBitFlags(
  flags: InjectOptions | InternalInjectFlags | undefined,
): InternalInjectFlags | undefined {
  if (typeof flags === 'undefined' || typeof flags === 'number') {
    return flags;
  }

  // TypeScript가 캐스트 없이 수용하지 않지만,
  // JavaScript에서 falsey 값으로 비트wise OR 연산은 no-op입니다.
  // 이를 통해 `InjectOptions`에서 `InjectFlags`로 매우 코드 크기 효율적인 변환을 할 수 있습니다.
  return (InternalInjectFlags.Default | // formatter에서 강제로 줄 바꿈을 생성하기 위한 주석
    ((flags.optional && InternalInjectFlags.Optional) as number) |
    ((flags.host && InternalInjectFlags.Host) as number) |
    ((flags.self && InternalInjectFlags.Self) as number) |
    ((flags.skipSelf && InternalInjectFlags.SkipSelf) as number)) as InternalInjectFlags;
}

// 비트 플래그를 주입 옵션으로 변환합니다.
function convertToInjectOptions(flags: InternalInjectFlags): InjectOptions {
  return {
    optional: !!(flags & InternalInjectFlags.Optional),
    host: !!(flags & InternalInjectFlags.Host),
    self: !!(flags & InternalInjectFlags.Self),
    skipSelf: !!(flags & InternalInjectFlags.SkipSelf),
  };
}

export function injectArgs(types: (ProviderToken<any> | any[])[]): any[] {
  const args: any[] = [];
  for (let i = 0; i < types.length; i++) {
    const arg = resolveForwardRef(types[i]);
    if (Array.isArray(arg)) {
      if (arg.length === 0) {
        throw new RuntimeError(
          RuntimeErrorCode.INVALID_DIFFER_INPUT,
          ngDevMode && '인수 배열은 인수를 포함해야 합니다.',
        );
      }
      let type: Type<any> | undefined = undefined;
      let flags: InternalInjectFlags = InternalInjectFlags.Default;

      for (let j = 0; j < arg.length; j++) {
        const meta = arg[j];
        const flag = getInjectFlag(meta);
        if (typeof flag === 'number') {
          // @Inject 데코레이터를 처리할 때의 특별한 경우.
          if (flag === DecoratorFlags.Inject) {
            type = meta.token;
          } else {
            flags |= flag;
          }
        } else {
          type = meta;
        }
      }

      args.push(ɵɵinject(type!, flags));
    } else {
      args.push(ɵɵinject(arg));
    }
  }
  return args;
}

/**
 * 주어진 주입 플래그를 주어진 데코레이터에 몽키 패칭하여 연결합니다.
 * DI 데코레이터는 주입이 초기화 없이 실행자를 구성할 수 있는 제공자의 `deps` 배열에서
 * 사용될 수 있으므로 (예: `Host`) 및 인스턴스 할 수 있으므로 (예: `new Host()`) 이 플래그를
 * 연결하여 정적 속성으로도 제공되고 데코레이터 인스턴스의 필드로도 제공됩니다.
 *
 * @param decorator 제공된 DI 데코레이터입니다.
 * @param flag 적용해야 하는 InjectFlag입니다.
 */
export function attachInjectFlag(decorator: any, flag: InternalInjectFlags | DecoratorFlags): any {
  decorator[DI_DECORATOR_FLAG] = flag;
  decorator.prototype[DI_DECORATOR_FLAG] = flag;
  return decorator;
}

/**
 * 데코레이터에 부착된 InjectFlag를 포함하는 몽키 패칭된 속성을 읽습니다.
 *
 * @param token 몽키 패칭된 DI 플래그 속성을 포함할 수 있는 토큰입니다.
 */
export function getInjectFlag(token: any): number | undefined {
  return token[DI_DECORATOR_FLAG];
}

export function catchInjectorError(
  e: any,
  token: any,
  injectorErrorName: string,
  source: string | null,
): never {
  const tokenPath: any[] = e[NG_TEMP_TOKEN_PATH];
  if (token[SOURCE]) {
    tokenPath.unshift(token[SOURCE]);
  }
  e.message = formatError('\n' + e.message, tokenPath, injectorErrorName, source);
  e[NG_TOKEN_PATH] = tokenPath;
  e[NG_TEMP_TOKEN_PATH] = null;
  throw e;
}

export function formatError(
  text: string,
  obj: any,
  injectorErrorName: string,
  source: string | null = null,
): string {
  text = text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE ? text.slice(2) : text;
  let context = stringify(obj);
  if (Array.isArray(obj)) {
    context = obj.map(stringify).join(' -> ');
  } else if (typeof obj === 'object') {
    let parts = <string[]>[];
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        let value = obj[key];
        parts.push(
          key + ':' + (typeof value === 'string' ? JSON.stringify(value) : stringify(value)),
        );
      }
    }
    context = `{${parts.join(', ')}}`;
  }
  return `${injectorErrorName}${source ? '(' + source + ')' : ''}[${context}]: ${text.replace(
    NEW_LINE,
    '\n  ',
  )}`;
}
