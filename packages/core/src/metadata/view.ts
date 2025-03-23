/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * {@link /api/core/Component Component} 장식자의 `encapsulation` 옵션에 대한 CSS 스타일 캡슐화 정책을 정의합니다.
 *
 * {@link Component#encapsulation 캡슐화}를 참조하십시오.
 *
 * @usageNotes
 * ### 예제
 *
 * {@example core/ts/metadata/encapsulation.ts region='longform'}
 *
 * @publicApi
 */
export enum ViewEncapsulation {
  // TODO: `ViewEncapsulation`을 `const enum`으로 만드는 것을 고려하십시오. 추가 정보는
  // https://github.com/angular/angular/issues/44119를 참조하십시오.

  /**
   * 특정 속성을 구성 요소의 호스트 요소에 추가하고 {@link Component#styles styles} 또는
   * {@link Component#styleUrls styleUrls}를 통해 제공된 모든 CSS 선택자에 동일한 속성을 적용하여
   * 네이티브 섀도우 DOM 캡슐화 동작을 에뮬레이트합니다.
   *
   * 이것이 기본 옵션입니다.
   */
  Emulated = 0,

  // 역사적으로 1 값은 v11에서 제거된 `Native` 캡슐화를 위한 것이었습니다.

  /**
   * CSS 스타일 캡슐화를 제공하지 않으며, 이는 {@link Component#styles styles} 또는
   * {@link Component#styleUrls styleUrls}를 통해 제공된 모든 스타일이 호스트 구성 요소와 관계없이
   * 애플리케이션의 모든 HTML 요소에 적용됨을 의미합니다.
   */
  None = 2,

  /**
   * 브라우저의 네이티브 섀도우 DOM API를 사용하여 CSS 스타일을 캡슐화합니다. 즉, 구성 요소의
   * 호스트 요소에 대해 ShadowRoot를 생성하고, 이를 사용하여 모든 구성 요소의 스타일링을 캡슐화합니다.
   */
  ShadowDom = 3,
}
