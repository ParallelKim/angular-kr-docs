/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * Ivy의 `NodeInjector`에 의해 사용되는 `Type.__NG_ELEMENT_ID__`에 남길 수 있는 특별한 마커입니다.
 * 일반적으로 이 마커들은 팩토리 함수들을 포함합니다. 그러나 이 특별한 마커의 경우
 * 함수로 남길 수 없으므로 트리 쉐이킹 문제가 발생할 수 있습니다.
 *
 * 현재 `Injector`만 특별합니다.
 *
 * NOTE: 여기의 숫자는 음수여야 하며, 양수는 블룸 필터의 ID로 사용됩니다.
 */
export const enum InjectorMarkers {
  /**
   * 현재 유형이 `Injector`임을 나타냅니다.
   */
  Injector = -1,
}
