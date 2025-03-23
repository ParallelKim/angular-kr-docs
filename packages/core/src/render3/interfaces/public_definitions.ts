/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// 이 파일은 라이브러리 typings 파일에서 npm에 게시될 유형을 포함합니다.

// 형식 지정은 이러한 선언에 끔찍한 영향을 미칩니다.

/**
 * @publicApi
 */
export type ɵɵDirectiveDeclaration<
  T,
  Selector extends string,
  ExportAs extends string[],
  // `string` 키는 16 이전 버전과의 호환성을 위해 사용됩니다.
  InputMap extends {
    [key: string]: string | {alias: string | null; required: boolean; isSignal?: boolean};
  },
  OutputMap extends {[key: string]: string},
  QueryFields extends string[],
  // 지시문과 구성 요소 선언 사이의 `IsStandalone` 매개변수 정렬을 쉽게 하기 위해
  // 추가된 선택적 항목입니다.
  NgContentSelectors extends never = never,
  // Angular v14에서 추가된 선택적 항목입니다. 모든 기존 지시문은
  // 독립적이지 않습니다.
  IsStandalone extends boolean = false,
  HostDirectives = never,
  IsSignal extends boolean = false,
> = unknown;

/**
 * @publicApi
 */
export type ɵɵComponentDeclaration<
  T,
  Selector extends String,
  ExportAs extends string[],
  // `string` 키는 16 이전 버전과의 호환성을 위해 사용됩니다.
  InputMap extends {[key: string]: string | {alias: string | null; required: boolean}},
  OutputMap extends {[key: string]: string},
  QueryFields extends string[],
  NgContentSelectors extends string[],
  // Angular v14에서 추가된 선택적 항목입니다. 모든 기존 구성 요소는
  // 독립적이지 않습니다.
  IsStandalone extends boolean = false,
  HostDirectives = never,
  IsSignal extends boolean = false,
> = unknown;

/**
 * @publicApi
 */
export type ɵɵNgModuleDeclaration<T, Declarations, Imports, Exports> = unknown;

/**
 * @publicApi
 */
export type ɵɵPipeDeclaration<
  T,
  Name extends string,
  // Angular v14에서 추가된 선택적 항목입니다. 모든 기존 지시문은
  // 독립적이지 않습니다.
  IsStandalone extends boolean = false,
> = unknown;

/**
 * @publicApi
 */
export type ɵɵInjectorDeclaration<T> = unknown;

/**
 * @publicApi
 */
export type ɵɵFactoryDeclaration<T, CtorDependencies extends CtorDependency[]> = unknown;

/**
 * 이 유형의 객체 리터럴은 생성자 종속성의 메타데이터를 나타내는 데 사용됩니다.
 * 유형 자체는 생성된 코드에서 참조되지 않습니다.
 *
 * @publicApi
 */
export type CtorDependency = {
  /**
   * `@Attribute` 데코레이터가 사용되는 경우, 이는 주입된 속성의 이름을 나타냅니다. 만약
   * 속성 이름이 문자열 리터럴이 아닌 동적 표현식일 경우, 이는 알 수 없는
   * 유형이 됩니다.
   */
  attribute?: string | unknown;

  /**
   * `@Optional()`이 사용되는 경우, 이 키는 true로 설정됩니다.
   */
  optional?: true;

  /**
   * `@Host`가 사용되는 경우, 이 키는 true로 설정됩니다.
   */
  host?: true;

  /**
   * `@Self`가 사용되는 경우, 이 키는 true로 설정됩니다.
   */
  self?: true;

  /**
   * `@SkipSelf`가 사용되는 경우, 이 키는 true로 설정됩니다.
   */
  skipSelf?: true;
} | null;
