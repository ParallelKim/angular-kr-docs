/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 속성 배열에서 사용될 마커 값 집합. 이러한 마커는 일부 항목이 일반 속성이 아님을 나타내며,
 * 처리 방식이 이에 따라 조정되어야 함을 나타냅니다.
 */
export const enum AttributeMarker {
  /**
   * 배열의 값이 `attributeKey`,
   * `attributeValue` 형식임을 나타내는 암시적 마커입니다.
   *
   * NOTE: 마커가 배열에 없을 때의 유형이므로 이것은 암시적입니다. 런타임에 존재하지 않아야 함을
   * 음수로 나타냅니다.
   */
  ImplicitAttributes = -1,

  /**
   * 속성 배열의 다음 3 값이:
   * namespaceUri, attributeName, attributeValue
   * 순서대로 있다는 것을 나타냅니다.
   */
  NamespaceURI = 0,

  /**
   * 클래스 선언을 알립니다.
   *
   * `Classes` 뒤에 오는 각 값은 요소에 포함될 클래스 이름을 지정합니다.
   * ## 예시:
   *
   * 주어진:
   * ```html
   * <div class="foo bar baz">...</div>
   * ```
   *
   * 생성된 코드는:
   * ```ts
   * var _c1 = [AttributeMarker.Classes, 'foo', 'bar', 'baz'];
   * ```
   */
  Classes = 1,

  /**
   * 스타일 선언을 알립니다.
   *
   * `Styles` 뒤에 오는 각 값 쌍은 요소에 포함될 스타일 이름과 값을 지정합니다.
   * ## 예시:
   *
   * 주어진:
   * ```html
   * <div style="width:100px; height:200px; color:red">...</div>
   * ```
   *
   * 생성된 코드는:
   * ```ts
   * var _c1 = [AttributeMarker.Styles, 'width', '100px', 'height', '200px', 'color', 'red'];
   * ```
   */
  Styles = 2,

  /**
   * 다음 속성 이름이 입력 또는 출력 바인딩에서 추출되었음을 알립니다.
   *
   * 예를 들어, 다음 HTML이 주어졌을 때:
   *
   * ```html
   * <div moo="car" [foo]="exp" (bar)="doSth()">
   * ```
   *
   * 생성된 코드는:
   *
   * ```ts
   * var _c1 = ['moo', 'car', AttributeMarker.Bindings, 'foo', 'bar'];
   * ```
   */
  Bindings = 3,

  /**
   * 다음 속성 이름이 인라인 템플릿 선언에서 끌어올려졌음을 알립니다.
   *
   * 예를 들어, 다음 HTML이 주어졌을 때:
   *
   * ```html
   * <div *ngFor="let value of values; trackBy:trackBy" dirA [dirB]="value">
   * ```
   *
   * `template()` 명령어에 대한 생성된 코드는 다음과 같습니다:
   *
   * ```
   * ['dirA', '', AttributeMarker.Bindings, 'dirB', AttributeMarker.Template, 'ngFor', 'ngForOf',
   * 'ngForTrackBy', 'let-value']
   * ```
   *
   * 템플릿 함수 내의 `element()` 명령어에 대한 생성된 코드는 다음과 같습니다:
   *
   * ```
   * ['dirA', '', AttributeMarker.Bindings, 'dirB']
   * ```
   */
  Template = 4,

  /**
   * 다음 속성이 `ngProjectAs`이고 그 값이 파싱된
   * `CssSelector`임을 알립니다.
   *
   * 예를 들어, 다음 HTML이 주어졌을 때:
   *
   * ```html
   * <h1 attr="value" ngProjectAs="[title]">
   * ```
   *
   * `element()` 명령어에 대한 생성된 코드는 다음과 같습니다:
   *
   * ```ts
   * ['attr', 'value', AttributeMarker.ProjectAs, ['', 'title', '']]
   * ```
   */
  ProjectAs = 5,

  /**
   * 다음 속성이 런타임 i18n에 의해 변역될 것임을 알립니다.
   *
   * 예를 들어, 다음 HTML이 주어졌을 때:
   *
   * ```html
   * <div moo="car" foo="value" i18n-foo [bar]="binding" i18n-bar>
   * ```
   *
   * 생성된 코드는:
   *
   * ```ts
   * var _c1 = ['moo', 'car', AttributeMarker.I18n, 'foo', 'bar'];
   * ```
   */
  I18n = 6,
}
