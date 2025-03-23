/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ERROR_DETAILS_PAGE_BASE_URL} from './error_details_base_url';

/**
 * `core` 패키지의 런타임 코드에서 사용되는 오류 코드 목록입니다.
 * 예약된 오류 코드 범위: 100-999.
 *
 * 주: 마이너스 기호는 특정 코드에 대한 자세한 가이드가
 * angular.io에 있음을 나타냅니다. 이 추가 주석은 가이드가 있는 오류 코드를 저장하기 위해 별도의 집합을 도입하는 것을 방지하기 위해 필요합니다.
 *
 * 사용 가능한 오류 가이드의 전체 목록은 https://angular.dev/errors에서 확인할 수 있습니다.
 *
 * 패키지별 오류 코드 범위:
 *  - core (이 패키지): 100-999
 *  - forms: 1000-1999
 *  - common: 2000-2999
 *  - animations: 3000-3999
 *  - router: 4000-4999
 *  - platform-browser: 5000-5500
 */
export const enum RuntimeErrorCode {
  // 변경 감지 오류
  EXPRESSION_CHANGED_AFTER_CHECKED = -100,
  RECURSIVE_APPLICATION_REF_TICK = 101,
  INFINITE_CHANGE_DETECTION = 103,

  // 의존성 주입 오류
  CYCLIC_DI_DEPENDENCY = -200,
  PROVIDER_NOT_FOUND = -201,
  INVALID_FACTORY_DEPENDENCY = 202,
  MISSING_INJECTION_CONTEXT = -203,
  INVALID_INJECTION_TOKEN = 204,
  INJECTOR_ALREADY_DESTROYED = 205,
  PROVIDER_IN_WRONG_CONTEXT = 207,
  MISSING_INJECTION_TOKEN = 208,
  INVALID_MULTI_PROVIDER = -209,
  MISSING_DOCUMENT = 210,

  // 템플릿 오류
  MULTIPLE_COMPONENTS_MATCH = -300,
  EXPORT_NOT_FOUND = -301,
  PIPE_NOT_FOUND = -302,
  UNKNOWN_BINDING = 303,
  UNKNOWN_ELEMENT = 304,
  TEMPLATE_STRUCTURE_ERROR = 305,
  INVALID_EVENT_BINDING = 306,
  HOST_DIRECTIVE_UNRESOLVABLE = 307,
  HOST_DIRECTIVE_NOT_STANDALONE = 308,
  DUPLICATE_DIRECTIVE = 309,
  HOST_DIRECTIVE_COMPONENT = 310,
  HOST_DIRECTIVE_UNDEFINED_BINDING = 311,
  HOST_DIRECTIVE_CONFLICTING_ALIAS = 312,
  MULTIPLE_MATCHING_PIPES = 313,
  UNINITIALIZED_LET_ACCESS = 314,
  NO_BINDING_TARGET = 315,
  INVALID_BINDING_TARGET = 316,
  INVALID_SET_INPUT_CALL = 317,

  // 부트스트랩 오류
  MULTIPLE_PLATFORMS = 400,
  PLATFORM_NOT_FOUND = 401,
  MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP = 402,
  BOOTSTRAP_COMPONENTS_NOT_FOUND = -403,
  PLATFORM_ALREADY_DESTROYED = 404,
  ASYNC_INITIALIZERS_STILL_RUNNING = 405,
  APPLICATION_REF_ALREADY_DESTROYED = 406,
  RENDERER_NOT_FOUND = 407,
  PROVIDED_BOTH_ZONE_AND_ZONELESS = 408,

  // 하이드레이션 오류
  HYDRATION_NODE_MISMATCH = -500,
  HYDRATION_MISSING_SIBLINGS = -501,
  HYDRATION_MISSING_NODE = -502,
  UNSUPPORTED_PROJECTION_DOM_NODES = -503,
  INVALID_SKIP_HYDRATION_HOST = -504,
  MISSING_HYDRATION_ANNOTATIONS = -505,
  HYDRATION_STABLE_TIMEDOUT = -506,
  MISSING_SSR_CONTENT_INTEGRITY_MARKER = -507,
  MISCONFIGURED_INCREMENTAL_HYDRATION = 508,

  // 신호 오류
  SIGNAL_WRITE_FROM_ILLEGAL_CONTEXT = 600,
  REQUIRE_SYNC_WITHOUT_SYNC_EMIT = 601,
  ASSERTION_NOT_INSIDE_REACTIVE_CONTEXT = -602,

  // 스타일링 오류

  // 선언 오류

  // i18n 오류
  INVALID_I18N_STRUCTURE = 700,
  MISSING_LOCALE_DATA = 701,

  // 지연 오류 (750-799 범위)
  DEFER_LOADING_FAILED = -750,

  // 독립형 오류
  IMPORT_PROVIDERS_FROM_STANDALONE = 800,

  // JIT 컴파일 오류
  // 기타
  INVALID_DIFFER_INPUT = 900,
  NO_SUPPORTING_DIFFER_FACTORY = 901,
  VIEW_ALREADY_ATTACHED = 902,
  INVALID_INHERITANCE = 903,
  UNSAFE_VALUE_IN_RESOURCE_URL = 904,
  UNSAFE_VALUE_IN_SCRIPT = 905,
  MISSING_GENERATED_DEF = 906,
  TYPE_IS_NOT_STANDALONE = 907,
  MISSING_ZONEJS = 908,
  UNEXPECTED_ZONE_STATE = 909,
  UNSAFE_IFRAME_ATTRS = -910,
  VIEW_ALREADY_DESTROYED = 911,
  COMPONENT_ID_COLLISION = -912,
  IMAGE_PERFORMANCE_WARNING = -913,
  UNEXPECTED_ZONEJS_PRESENT_IN_ZONELESS_MODE = 914,
  MISSING_NG_MODULE_DEFINITION = 915,
  MISSING_DIRECTIVE_DEFINITION = 916,

  // 신호 통합 오류
  REQUIRED_INPUT_NO_VALUE = -950,
  REQUIRED_QUERY_NO_VALUE = -951,
  REQUIRED_MODEL_NO_VALUE = 952,

  // Output()
  OUTPUT_REF_DESTROYED = 953,

  // 반복기 오류
  LOOP_TRACK_DUPLICATE_KEYS = -955,
  LOOP_TRACK_RECREATE = -956,

  // 런타임 의존성 추적기 오류
  RUNTIME_DEPS_INVALID_IMPORTED_TYPE = 980,
  RUNTIME_DEPS_ORPHAN_COMPONENT = 981,

  // core 런타임 오류의 상한선은 999입니다.
}

/**
 * 런타임 오류를 나타내는 클래스입니다.
 * 오류 메시지를 일관된 방식으로 포맷하고 출력합니다.
 *
 * 예시:
 * ```ts
 *  throw new RuntimeError(
 *    RuntimeErrorCode.INJECTOR_ALREADY_DESTROYED,
 *    ngDevMode && 'Injector has already been destroyed.');
 * ```
 *
 * 주: `message` 인자는 개발 모드(ngDevMode가 정의된 경우)에서 설명적인 오류 메시지를 문자열로 포함합니다.
 * 프로덕션 모드(트리 세이킹 패스 이후)에서는 `message` 인자가 false가 되어 이를 typings 및 런타임 로직에서 고려합니다.
 */
export class RuntimeError<T extends number = RuntimeErrorCode> extends Error {
  constructor(
    public code: T,
    message: null | false | string,
  ) {
    super(formatRuntimeError<T>(code, message));
  }
}

/**
 * 런타임 오류를 포맷하기 위해 호출됩니다.
 * `RuntimeError` 클래스 설명의 `message` 인자 유형에 대한 추가 정보를 참조하세요.
 */
export function formatRuntimeError<T extends number = RuntimeErrorCode>(
  code: T,
  message: null | false | string,
): string {
  // 오류 코드는 음수일 수 있으며 이는 angular.io에서 오류 세부정보 페이지에 대한 링크를 생성하도록 지시하는 특별한 기호입니다.
  // 컴파일 타임 오류가 아닌 경우 `0`을 추가합니다.
  const fullCode = `NG0${Math.abs(code)}`;

  let errorMessage = `${fullCode}${message ? ': ' + message : ''}`;

  if (ngDevMode && code < 0) {
    const addPeriodSeparator = !errorMessage.match(/[.,;!?\n]$/);
    const separator = addPeriodSeparator ? '.' : '';
    errorMessage = `${errorMessage}${separator} Find more at ${ERROR_DETAILS_PAGE_BASE_URL}/${fullCode}`;
  }
  return errorMessage;
}
