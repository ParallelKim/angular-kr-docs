/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 데코레이터가 `Inject` 유형임을 나타내는 특별 플래그입니다. `Inject`
 * 데코레이터를 트리셰이 커블(tree-shakable)하게 만들기 위해 사용됩니다(따라서 `instanceof` 체크에 의존할 필요가 없습니다).
 * 참고: 이 플래그는 내부 API이기 때문에 `InjectFlags`에 포함되지 않습니다.
 */
export const enum DecoratorFlags {
  Inject = -1,
}

/**
 * 이 열거형(enum)은 위의 `InjectFlags` 열거형과 정확히 동일하지만, 차이점은 이것이
 * const enum이라는 점입니다. 그래서 실제 열거형 값은 생성된 코드에 인라인됩니다. `InjectFlags` 열거형은
 * ViewEngine이 제거될 때 const enum으로 변환될 수 있습니다(위의 `InjectFlags` 열거형의 TODO 참조).
 * 인라인의 이점은 트리셰이킹에 영향을 주지 않고 최상위 수준에서 이러한 플래그를 사용할 수 있다는 점입니다
 * (더 많은 정보는 "no-toplevel-property-access" tslint 규칙을 참조하십시오).
 * 이 열거형은 위의 `InjectFlags` 열거형과 동기화 상태를 유지하십시오.
 */
export const enum InternalInjectFlags {
  /** 자신을 확인하고 필요한 경우 부모 인젝터를 확인합니다. */
  Default = 0b0000,

  /**
   * 인젝터가 현재 구성 요소의 호스트 요소에 도달할 때까지
   * 모든 인젝터에서 종속성을 검색해야 함을 지정합니다. (Element Injector와만 사용)
   */
  Host = 0b0001,

  /** 주입을 요청하는 노드의 조상으로 올라가지 않습니다. */
  Self = 0b0010,

  /** 주입을 요청하는 노드를 건너뜁니다. */
  SkipSelf = 0b0100,

  /** 토큰을 찾지 못한 경우 대신 `defaultValue`를 주입합니다. */
  Optional = 0b1000,

  /**
   * 이 토큰이 파이프에 주입되고 있습니다.
   *
   * 이 플래그는 의도적으로 공개되는 `InjectFlags`에 포함되지 않으며, 오직
   * 컴파일러에 의해 추가되며 개발자에게 적용되는 플래그가 아닙니다.
   */
  ForPipe = 0b10000,
}

/**
 * [`inject`](api/core/inject)에 대한 옵션 인자의 유형입니다.
 *
 * @publicApi
 */
export interface InjectOptions {
  /**
   * 선택적 주입을 사용하고, 요청된 토큰을 찾지 못하면 `null`을 반환합니다.
   */
  optional?: boolean;

  /**
   * 현재 인젝터의 부모에서 주입을 시작합니다.
   */
  skipSelf?: boolean;

  /**
   * 현재 인젝터에서만 토큰을 조회하고, 찾지 못하면 부모 인젝터로
   * 되돌아가지 않습니다.
   */
  self?: boolean;

  /**
   * 호스트 컴포넌트의 인젝터에서 주입을 중지합니다. 요소 인젝터에서 주입할 때만 관련이 있으며,
   * 환경 인젝터에 대해 무의미한 작업입니다.
   */
  host?: boolean;
}
