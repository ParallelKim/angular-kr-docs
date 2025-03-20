# 테스트 속성 지시자

*속성 지시자*는 요소, 구성 요소 또는 다른 지시자의 동작을 수정합니다. 
그 이름은 지시자가 적용되는 방식을 반영합니다: 호스트 요소의 속성으로서.

## `HighlightDirective` 테스트

샘플 애플리케이션의 `HighlightDirective`는 데이터로 바인딩된 색상 또는 기본 색상(연한 회색)에 따라 요소의 배경 색상을 설정합니다. 
또한 요소의 사용자 정의 속성(`customProperty`)을 `true`로 설정하여 보여주기 위해 사용합니다.

<docs-code header="app/shared/highlight.directive.ts" path="adev/src/content/examples/testing/src/app/shared/highlight.directive.ts"/>

이는 애플리케이션 전역에서 사용되며, 아마도 가장 간단하게는 `AboutComponent`에서 사용됩니다:

<docs-code header="app/about/about.component.ts" path="adev/src/content/examples/testing/src/app/about/about.component.ts"/>

`AboutComponent` 내에서 `HighlightDirective`의 특정 사용을 테스트하려면 [구성 요소 테스트 시나리오](guide/testing/components-scenarios) 섹션의 ["중첩 구성 요소 테스트"](guide/testing/components-scenarios#nested-component-tests)에서 탐구한 기술 만으로 충분합니다.

<docs-code header="app/about/about.component.spec.ts" path="adev/src/content/examples/testing/src/app/about/about.component.spec.ts" visibleRegion="tests"/>

그러나 단일 사용 사례를 테스트하는 것은 지시자의 모든 기능을 탐구할 가능성이 낮습니다. 
지시자를 사용하는 모든 구성 요소를 찾고 테스트하는 것은 지루하고, 취약하며, 전체 범위를 보장하기 어려운 작업입니다.

*클래스 전용 테스트*는 유용할 수 있지만, 이러한 속성 지시자는 DOM을 조작하는 경향이 있습니다. 
격리된 단위 테스트는 DOM을 접촉하지 않으므로, 지시자의 효능에 대한 확신을 주지 않습니다.

더 나은 해결책은 지시자를 적용하는 모든 방법을 보여주는 인위적인 테스트 구성 요소를 만드는 것입니다.

<docs-code header="app/shared/highlight.directive.spec.ts (TestComponent)" path="adev/src/content/examples/testing/src/app/shared/highlight.directive.spec.ts" visibleRegion="test-component"/>

<img alt="HighlightDirective spec in action" src="assets/images/guide/testing/highlight-directive-spec.png">

도움말: `<input>` 케이스는 `HighlightDirective`를 입력 상자의 색상 값 이름에 바인딩합니다. 
초기 값은 "cyan"라는 단어로, 이는 입력 상자의 배경 색상이 되어야 합니다.

다음은 이 구성 요소에 대한 몇 가지 테스트입니다:

<docs-code header="app/shared/highlight.directive.spec.ts (selected tests)" path="adev/src/content/examples/testing/src/app/shared/highlight.directive.spec.ts" visibleRegion="selected-tests"/>

몇 가지 기술이 주목할 가치가 있습니다:

* `By.directive` 조건자는 요소 유형이 알려지지 않았을 때 이 지시자가 있는 요소를 가져오는 좋은 방법입니다.
* `By.css('h2:not([highlight])')`의 [`:not` 가상 클래스](https://developer.mozilla.org/docs/Web/CSS/:not)는 지시자가 없는 `<h2>` 요소를 찾는 데 도움이 됩니다. 
    `By.css('*:not([highlight])')`는 지시자가 없는 *모든* 요소를 찾습니다.

* `DebugElement.styles`는 실제 브라우저가 없을 때에도 요소 스타일에 접근할 수 있게 해주며, 이는 `DebugElement` 추상 덕분입니다. 
    그러나 추상보다 더 쉽거나 명확해 보일 경우 `nativeElement`를 활용해도 좋습니다.

* Angular는 지시자가 적용된 요소의 주입기에 지시자를 추가합니다. 
    기본 색상을 위한 테스트는 두 번째 `<h2>`의 주입기를 사용하여 해당 `HighlightDirective` 인스턴스와 `defaultColor`를 가져옵니다.

* `DebugElement.properties`는 지시자에 의해 설정된 인위적인 사용자 정의 속성에 접근할 수 있게 해줍니다.