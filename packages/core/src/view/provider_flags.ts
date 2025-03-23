/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// 이 기본 값은 토큰의 계층을 확인할 때 사용됩니다.
//
// 이는 두 가지를 의미합니다:
// - 현재 주입기가 토큰을 제공하지 않습니다,
// - 엘리먼트 주입기만 확인해야 합니다 (즉, 모듈 주입기는 확인하지 마십시오).
//
//          mod1
//         /
//       el1   mod2
//         \  /
//         el2
//
// el2.injector.get(token)를 요청할 때, 다음 순서로 확인하고
// 첫 번째로 찾은 값을 반환해야 합니다:
// - el2.injector.get(token, default)
// - el1.injector.get(token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) -> 모듈은 확인하지 마십시오.
// - mod2.injector.get(token, default)
export const NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR = {};
