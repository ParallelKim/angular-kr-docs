/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 기본 변경 감지기가 변경 사항을 감지하는 데 사용하는 전략입니다.
 * 설정 시, 변경 감지가 트리거될 때 다음에 적용됩니다.
 *
 * @see {@link /api/core/ChangeDetectorRef?tab=usage-notes 변경 감지 사용}
 * @see {@link /best-practices/skipping-subtrees 구성 요소 서브트리 생략}
 *
 * @publicApi
 */
export enum ChangeDetectionStrategy {
  /**
   * `CheckOnce` 전략을 사용하며, 이는 자동 변경 감지가 비활성화되었다가
   * 전략을 `Default`(`CheckAlways`)로 설정하여 재활성화될 때까지 유지됩니다.
   * 변경 감지는 여전히 명시적으로 호출할 수 있습니다.
   * 이 전략은 모든 자식 지시문에 적용되며 재정의할 수 없습니다.
   */
  OnPush = 0,

  /**
   * 기본 `CheckAlways` 전략을 사용하며, 이 경우 변경 감지는
   * 명시적으로 비활성화될 때까지 자동으로 수행됩니다.
   */
  Default = 1,
}
