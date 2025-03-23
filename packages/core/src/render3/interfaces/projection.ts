/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 단일 CSS 선택자를 표현합니다.
 *
 * 배열의 시작
 * - 첫 번째 인덱스: 요소 이름
 * - 이후의 홀수 인덱스: 속성 키
 * - 이후의 짝수 인덱스: 속성 값
 *
 * SelectorFlags.CLASS 플래그 이후
 * - 클래스 이름 값
 *
 * SelectorFlags.NOT 플래그
 * - 모드를 NOT으로 변경합니다
 * - 요소 / 속성 / 클래스 모드를 설정하기 위해 다른 플래그와 결합할 수 있습니다
 *
 * 예: SelectorFlags.NOT | SelectorFlags.ELEMENT
 *
 * 예시:
 * 원본: `div.foo.bar[attr1=val1][attr2]`
 * 구문 분석됨: ['div', 'attr1', 'val1', 'attr2', '', SelectorFlags.CLASS, 'foo', 'bar']
 *
 * 원본: 'div[attr1]:not(.foo[attr2])'
 * 구문 분석됨: [
 *  'div', 'attr1', '',
 *  SelectorFlags.NOT | SelectorFlags.ATTRIBUTE 'attr2', '', SelectorFlags.CLASS, 'foo'
 * ]
 *
 * node_selector_matcher_spec.ts에서 더 많은 예를 확인하세요.
 */
export type CssSelector = (string | SelectorFlags)[];

/**
 * CssSelector 목록입니다.
 *
 * 지시문 또는 구성 요소는 여러 선택기를 가질 수 있습니다. 이 유형은
 * 지시문 정의에 사용되므로 목록의 선택기 중 어떤 것이든 해당 지시문과 일치합니다.
 *
 * 원본: 'form, [ngForm]'
 * 구문 분석됨: [['form'], ['', 'ngForm', '']]
 */
export type CssSelectorList = CssSelector[];

/**
 * 프로젝션을 위한 슬롯 목록입니다. 슬롯은 구문 분석된 CSS 선택기를 기반으로 하여
 * 해당 슬롯에 투영될 노드를 결정하는 데 사용됩니다.
 *
 * "*"로 설정하면 슬롯이 예약되며 {@link ViewContainerRef#createComponent}를 사용하여
 * 다중 슬롯 프로젝션에 사용할 수 있습니다. 와일드카드 선택기를 지정하는 마지막 슬롯은
 * 어떤 선택기와도 일치하지 않는 모든 투영 가능한 노드를 검색합니다.
 */
export type ProjectionSlots = (CssSelectorList | '*')[];

/** CssSelectors를 구성하는 데 사용되는 플래그 */
export const enum SelectorFlags {
  /** 새로운 부정 선택기의 시작을 나타냅니다 */
  NOT = 0b0001,

  /** 속성 일치를 위한 모드 */
  ATTRIBUTE = 0b0010,

  /** 태그 이름 일치를 위한 모드 */
  ELEMENT = 0b0100,

  /** 클래스 이름 일치를 위한 모드 */
  CLASS = 0b1000,
}
