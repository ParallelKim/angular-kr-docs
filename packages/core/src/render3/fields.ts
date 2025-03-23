/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {getClosureSafeProperty} from '../util/property';

export const NG_COMP_DEF = getClosureSafeProperty({ɵcmp: getClosureSafeProperty});
export const NG_DIR_DEF = getClosureSafeProperty({ɵdir: getClosureSafeProperty});
export const NG_PIPE_DEF = getClosureSafeProperty({ɵpipe: getClosureSafeProperty});
export const NG_MOD_DEF = getClosureSafeProperty({ɵmod: getClosureSafeProperty});
export const NG_FACTORY_DEF = getClosureSafeProperty({ɵfac: getClosureSafeProperty});

/**
 * 지시어가 diPublic인 경우, bloomAdd는 이 상수를 키로 하고 지시어의 고유 ID를 값으로 가지는
 * 유형에 대한 속성을 설정합니다. 이는 지시어를 DI를 위한 bloom 필터 비트에 매핑할 수 있게 해줍니다.
 */
// TODO(misko): 이것은 잘못되었습니다. NG_ELEMENT_ID는 절대 축소되어서는 안 됩니다.
export const NG_ELEMENT_ID = getClosureSafeProperty({__NG_ELEMENT_ID__: getClosureSafeProperty});

/**
 * DI 토큰의 `NG_ENV_ID` 필드는 `EnvironmentInjector`에서 특별한 처리를 나타냅니다:
 * `EnvironmentInjector`에서 이러한 토큰을 가져오는 것은 표준 DI 해결 전략을 우회하고
 * 대신 `NG_ENV_ID` 팩토리 함수로 생성된 구현을 반환합니다.
 *
 * 이 DI 토큰의 특정 검색은 주로 순환 종속성을 제거하고
 * 트리 쉐이킹을 개선하기 위해 수행됩니다.
 */
export const NG_ENV_ID = getClosureSafeProperty({__NG_ENV_ID__: getClosureSafeProperty});
