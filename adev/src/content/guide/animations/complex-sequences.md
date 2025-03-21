# 복잡한 애니메이션 시퀀스

지금까지 우리는 단일 HTML 요소의 간단한 애니메이션을 배웠습니다.
Angular는 전체 그리드나 페이지에 들어오고 나가는 요소 목록과 같은 조정된 시퀀스를 애니메이션할 수 있도록 합니다.
여러 애니메이션을 병렬로 실행할 수도 있고, 하나씩 순차적으로 실행할 수도 있습니다.

복잡한 애니메이션 시퀀스를 제어하는 함수는 다음과 같습니다:

| 함수                               | 세부사항 |
|:---                                 |:---       |
| `query()`                           | 하나 이상의 내부 HTML 요소를 찾습니다. |
| `stagger()`                         | 여러 요소의 애니메이션에 계단식 지연을 적용합니다. |
| [`group()`](api/animations/group) | 여러 애니메이션 단계를 병렬로 실행합니다. |
| `sequence()`                        | 애니메이션 단계를 차례로 실행합니다. |

## query() 함수

대부분의 복잡한 애니메이션은 `query()` 함수에 의존하여 자식 요소를 찾고 애니메이션을 적용합니다. 기본적인 예는 다음과 같습니다:

| 예제                                   | 세부사항 |
|:---                                    |:---       |
| `query()` 다음에 `animate()`          | 간단한 HTML 요소를 쿼리하고 그에 직접 애니메이션을 적용하는 데 사용됩니다.                                                                  |
| `query()` 다음에 `animateChild()`     | 자식 요소를 쿼리하는 데 사용되며, 해당 요소에 애니메이션 메타데이터가 적용되어 그러한 애니메이션을 트리거합니다 \(일반적으로는 현재/부모 요소의 애니메이션에 의해 차단됩니다\). |

`query()`의 첫 번째 인수는 다음 Angular 전용 토큰을 포함할 수 있는 [css 선택기](https://developer.mozilla.org/docs/Web/CSS/CSS_Selectors) 문자열입니다:

| 토큰                              | 세부사항 |
|:---                                |:---       |
| `:enter` <br /> `:leave`          | 들어오는/나가는 요소에 대한 것입니다.         |
| `:animating`                       | 현재 애니메이션 중인 요소입니다.              |
| `@*` <br /> `@triggerName`       | 모든 애니메이션이나 특정 트리거가 있는 요소입니다. |
| `:self`                            | 애니메이션을 수행하는 요소 자체입니다.          |

<docs-callout title="들어오고 나가는 요소">

모든 자식 요소가 실제로 들어오거나 나가는 것으로 간주되는 것은 아닙니다. 이는 때때로 직관에 반하고 혼란스러울 수 있습니다. 자세한 내용은 [query api 문서](api/animations/query#entering-and-leaving-elements)를 참조하십시오.

이것에 대한 예시는 애니메이션 예제 \(애니메이션 [소개 섹션](guide/animations#about-this-guide)에서 소개됨\)의 쿼리 탭에서 확인할 수 있습니다.

</docs-callout>

## query()와 stagger() 함수를 사용하여 여러 요소 애니메이션

`query()`를 사용하여 자식 요소를 쿼리한 후, `stagger()` 함수는 애니메이션되는 각 쿼리 항목 간의 시간 간격을 정의하여 요소들 간의 지연을 생성합니다.

다음 예시는 `query()`와 `stagger()` 함수를 사용하여 \(영웅의\) 목록을 아래에서 위로 조금씩 지연을 두고 추가하는 방법을 보여줍니다.

* `query()`를 사용하여 페이지에 들어오는 특정 기준을 충족하는 요소를 찾습니다.
* 각 요소에 대해 `style()`을 사용하여 요소의 동일한 초기 스타일을 설정합니다.
    요소를 투명하게 만들고 `transform`을 사용하여 위치를 이동시켜야지 위치에 맞게 슬라이드할 수 있습니다.

* 각 애니메이션을 30밀리초 지연시킵니다.
* 사용자 정의 이징 곡선을 사용하여 화면의 각 요소를 0.5초 동안 애니메이션하면서 동시에 페이드 인 및 언트랜스폼합니다.

<docs-code header="src/app/hero-list-page.component.ts" path="adev/src/content/examples/animations/src/app/hero-list-page.component.ts" visibleRegion="page-animations"/>

## group() 함수를 사용한 병렬 애니메이션

각 연속 애니메이션 사이에 지연을 추가하는 방법을 보았습니다.
하지만 병렬로 발생하는 애니메이션을 구성할 수도 있습니다.
예를 들어, 동일한 요소의 두 개의 CSS 속성을 애니메이션하고 싶으나 각 속성에 대해 다른 `easing` 함수를 사용하고자 할 수 있습니다.
이 경우 애니메이션 [`group()`](api/animations/group) 함수를 사용할 수 있습니다.

도움이 되는 가이드: [`group()`](api/animations/group) 함수는 애니메이션 *단계*를 그룹화하는 데 사용되며, 애니메이션 요소를 그룹화하는 것이 아닙니다.

다음 예시는 두 가지 다른 타이밍 구성에 대해 `:enter` 및 `:leave`에 [`group()`](api/animations/group)를 사용하는데, 이를 통해 동일한 요소에 두 개의 독립 애니메이션을 동시에 적용합니다.

<docs-code header="src/app/hero-list-groups.component.ts (excerpt)" path="adev/src/content/examples/animations/src/app/hero-list-groups.component.ts" visibleRegion="animationdef"/>

## 순차 애니메이션 vs. 병렬 애니메이션

복잡한 애니메이션은 동시에 많은 일이 발생할 수 있습니다.
하지만 여러 애니메이션이 차례로 발생하는 애니메이션을 생성하고 싶다면 어떻게 해야 하나요? 이전에 [`group()`](api/animations/group)를 사용하여 모든 애니메이션을 동시에 병렬로 실행했었습니다.

두 번째 `sequence()`라는 함수를 사용하면 동일한 애니메이션을 차례로 실행할 수 있습니다.
`sequence()` 내에서 애니메이션 단계는 `style()` 또는 `animate()` 함수 호출로 구성됩니다.

* `style()`을 사용하여 제공된 스타일링 데이터를 즉시 적용합니다.
* `animate()`를 사용하여 주어진 시간 간격에 스타일링 데이터를 적용합니다.

## 필터 애니메이션 예제

예제 페이지의 다른 애니메이션을 살펴보십시오.
Filter/Stagger 탭 아래에서 **Search Heroes** 텍스트 상자에 `Magnet` 또는 `tornado`와 같은 텍스트를 입력하세요.

필터는 입력하는 동안 실시간으로 작동합니다.
새로운 글자를 입력할 때마다 요소는 페이지를 떠나고 필터는 점차적으로 더 엄격해집니다.
영웅 목록은 필터 상자에서 각 글자를 삭제할 때 점차 페이지로 다시 들어옵니다.

HTML 템플릿에는 `filterAnimation`이라는 트리거가 포함되어 있습니다.

<docs-code header="src/app/hero-list-page.component.html" path="adev/src/content/examples/animations/src/app/hero-list-page.component.html" visibleRegion="filter-animations" language="angular-html"/>

컴포넌트 장식자의 `filterAnimation`에는 세 가지 전환이 포함되어 있습니다.

<docs-code header="src/app/hero-list-page.component.ts" path="adev/src/content/examples/animations/src/app/hero-list-page.component.ts" visibleRegion="filter-animations"/>

이 예제의 코드는 다음과 같은 작업을 수행합니다:

* 사용자가 처음 이 페이지를 열거나 탐색할 때 애니메이션을 건너뜁니다 \(필터 애니메이션은 이미 있는 요소에서만 작동하므로, DOM에 존재하는 요소에만 영향을 줍니다\).
* 검색 입력값에 따라 영웅을 필터링합니다.

각 변경사항에 대해:

* DOM을 떠나는 요소의 불투명도와 너비를 0으로 설정하여 숨깁니다.
* 300밀리초 동안 DOM에 들어오는 요소를 애니메이션합니다.
    애니메이션 중에 요소는 기본 너비와 불투명도를 가집니다.

* DOM으로 들어오거나 나가는 요소가 여러 개 있을 경우, 페이지 상단에서 시작하여 각 요소 간의 50밀리초 지연으로 애니메이션을 단계적으로 진행합니다.

## 재정렬 목록의 항목 애니메이션

Angular는 기본적으로 `*ngFor` 목록 항목의 애니메이션을 올바르게 수행하지만, 항목의 순서가 변경되면 수행할 수 없습니다.
이는 어떤 요소가 어떤 것인지 추적을 잃기 때문에 애니메이션이 깨지게 됩니다.
Angular가 이러한 요소를 추적하는 데 도움을 주는 유일한 방법은 `NgForOf` 지시문에 `TrackByFunction`을 할당하는 것입니다.
이렇게 하면 Angular는 항상 어떤 요소가 어떤 것인지 알 수 있으므로 언제나 올바른 요소에 올바른 애니메이션을 적용할 수 있습니다.

중요: `*ngFor` 목록의 항목을 애니메이션할 필요가 있고, 이 항목들의 순서가 런타임 동안 변경될 가능성이 있는 경우, 항상 `TrackByFunction`을 사용하세요.

## 애니메이션 및 컴포넌트 뷰 캡슐화

Angular 애니메이션은 컴포넌트의 DOM 구조를 기반으로 하며 [뷰 캡슐화](guide/components/styling#style-scoping)를 직접 고려하지 않습니다. 이는 `ViewEncapsulation.Emulated`를 사용하는 컴포넌트가 실제로는 `ViewEncapsulation.None`을 사용하는 것처럼 작동한다는 의미입니다 \( `ViewEncapsulation.ShadowDom`은 곧 논의할 내용과 다르게 작동합니다 \).

예를 들어, `query()` 함수가 에뮬레이션된 뷰 캡슐화를 사용하는 컴포넌트 트리 상단에 적용된다면, 그러한 쿼리는 트리의 어떤 깊이에서도 DOM 요소를 식별하고 (따라서 애니메이션을 적용할 수 있습니다).

반면 `ViewEncapsulation.ShadowDom`은 컴포넌트의 DOM 구조를 변경하여 DOM 요소를 [`ShadowRoot`](https://developer.mozilla.org/docs/Web/API/ShadowRoot) 요소 안에 "숨깁니다". 이러한 DOM 조작은 일부 애니메이션 구현이 제대로 작동하지 못하게 하며, 이는 단순한 DOM 구조에 의존하고 `ShadowRoot` 요소를 고려하지 않기 때문입니다. 따라서 ShadowDom 뷰 캡슐화를 사용하는 컴포넌트를 포함하는 뷰에 애니메이션을 적용하는 것은 피하는 것이 좋습니다.

## 애니메이션 시퀀스 요약

Angular는 여러 요소의 애니메이션에 대해 `query()`로 내부 요소를 찾기 시작합니다. 예를 들어, `<div>` 내의 모든 이미지를 모으는 것입니다.
나머지 함수들인 `stagger()`, [`group()`](api/animations/group), 및 `sequence()`는 계단식 효과를 적용하거나 여러 애니메이션 단계를 적용하는 방법을 제어하게 해줍니다.

## Angular 애니메이션에 대한 더 많은 정보

다음 내용에도 관심이 있을 수 있습니다:

<docs-pill-row>
  <docs-pill href="guide/animations" title="Angular 애니메이션 소개"/>
  <docs-pill href="guide/animations/transition-and-triggers" title="전환 및 트리거"/>
  <docs-pill href="guide/animations/reusable-animations" title="재사용 가능한 애니메이션"/>
  <docs-pill href="guide/animations/route-animations" title="경로 전환 애니메이션"/>
</docs-pill-row>