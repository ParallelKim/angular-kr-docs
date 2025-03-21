# 애니메이션 전환 및 트리거

이 가이드는 `*` 와일드카드 및 `void`와 같은 특별한 전환 상태에 대해 깊이 설명합니다. 이 특별한 상태들이 요소가 뷰에 들어가고 나갈 때 어떻게 사용되는지를 보여줍니다. 이 섹션에서는 여러 애니메이션 트리거, 애니메이션 콜백 및 키프레임을 사용한 시퀀스 기반 애니메이션도 탐구합니다.

## 미리 정의된 상태 및 와일드카드 일치

Angular에서 전환 상태는 [`state()`](api/animations/state) 함수를 통해 명시적으로 정의하거나 미리 정의된 `*` 와일드카드 및 `void` 상태를 사용할 수 있습니다.

### 와일드카드 상태

별표 `*` 또는 *와일드카드*는 모든 애니메이션 상태와 일치합니다. 이는 HTML 요소의 시작 또는 종료 상태에 관계없이 적용되는 전환을 정의하는 데 유용합니다.

예를 들어 `open => *`의 전환은 요소의 상태가 열림에서 다른 어떤 것으로 변경될 때 적용됩니다.

<img alt="와일드카드 상태 표현식" src="assets/images/guide/animations/wildcard-state-500.png">

다음은 와일드카드 상태를 사용한 또 다른 코드 샘플로, 이전 예제의 `open`과 `closed` 상태의 사용과 함께 합니다. 각 상태 간의 전환 쌍을 정의하는 대신, `closed`로의 모든 전환은 1초가 걸리고, `open`으로의 모든 전환은 0.5초가 걸립니다.

이렇게 하면 각 상태에 대해 별도의 전환을 포함하지 않고도 새로운 상태를 추가할 수 있습니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="trigger-wildcard1"/>

상태-상태 전환을 양방향으로 지정하기 위해 더블 화살표 구문을 사용하세요.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="trigger-wildcard2"/>

### 여러 전환 상태와 함께 와일드카드 상태 사용

이중 상태 버튼 예제에서, 와일드카드의 유용성은 `open`과 `closed`의 두 가지 가능한 상태만 있기 때문에 그다지 크지 않습니다. 일반적으로 요소가 변경할 수 있는 여러 잠재적 상태가 있을 때 와일드카드 상태를 사용합니다. 버튼이 `open`에서 `closed` 또는 `inProgress`와 같은 것으로 변경될 수 있다면, 와일드카드 상태를 사용하면 필요한 코드 양을 줄일 수 있습니다.

<img alt="3개 상태의 와일드카드 상태" src="assets/images/guide/animations/wildcard-3-states.png">

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="trigger-transition"/>

`* => *` 전환은 두 상태 간의 변화가 발생할 때 적용됩니다.

전환은 정의된 순서에 따라 일치합니다. 따라서 `* => *` 전환 위에 다른 전환을 적용할 수 있습니다. 예를 들어, `open => closed`에만 적용될 스타일 변경 또는 애니메이션을 정의한 다음, 상태 쌍이 다른 방식으로 호출되지 않을 경우 `* => *`을 폴백으로 사용합니다.

이를 하려면 보다 구체적인 전환을 `* => *` 이전에 나열합니다.

### 스타일과 함께 와일드카드 사용

와일드카드 `*`를 스타일과 함께 사용하여 애니메이션이 현재 스타일 값을 사용하는지 알려주고 그 값으로 애니메이션을 진행합니다. 와일드카드는 애니메이션이 선언되지 않은 상태에서 사용되는 폴백 값입니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="transition4"/>

### Void 상태

`void` 상태를 사용하여 페이지에 들어가거나 나가는 요소의 전환을 구성합니다. [뷰에 들어가거나 나가는 애니메이션](guide/animations/transition-and-triggers#aliases-enter-and-leave)을 참조하세요.

### 와일드카드 및 void 상태 결합

와일드카드 및 void 상태를 전환에 결합하여 페이지에 들어오고 나가는 애니메이션을 트리거합니다:

* `* => void`의 전환은 요소가 뷰를 떠날 때 적용되며, 떠나기 전에 어떤 상태에 있었는지는 관계가 없습니다.
* `void => *`의 전환은 요소가 뷰에 들어갈 때 적용되며, 들어갈 때 어떤 상태를 갖는지는 관계가 없습니다.
* 와일드카드 상태 `*`는 `void`를 포함한 *모든* 상태와 일치합니다.

## 뷰에 들어가고 나가는 애니메이션

이 섹션에서는 페이지에 들어가거나 나가는 요소를 애니메이션하는 방법을 보여줍니다.

새로운 동작 추가:

* 히어로를 히어로 목록에 추가하면, 왼쪽에서 페이지로 날아오는 것처럼 나타납니다.
* 목록에서 히어로를 제거하면, 오른쪽으로 날아가는 것처럼 나타납니다.

<docs-code header="src/app/hero-list-enter-leave.component.ts" path="adev/src/content/examples/animations/src/app/hero-list-enter-leave.component.ts" visibleRegion="animationdef"/>

앞선 코드에서는 HTML 요소가 뷰에 첨부되지 않을 때 `void` 상태를 적용했습니다.

## 별칭 :enter 및 :leave

`:enter` 및 `:leave`는 `void => *` 및 `* => void` 전환의 별칭입니다. 이 별칭은 여러 애니메이션 함수에 의해 사용됩니다.

<docs-code hideCopy language="typescript">

transition ( ':enter', [ … ] );  // void => *의 별칭
transition ( ':leave', [ … ] );  // * => void의 별칭

</docs-code>

뷰에 들어가는 요소를 타겟으로 하는 것이 더 어렵습니다. 왜냐하면 그 요소는 아직 DOM에 없기 때문입니다. HTML 요소를 타겟으로 하려면 뷰에 삽입되거나 제거될 때 `:enter` 및 `:leave` 별칭을 사용하세요.

### :enter 및 :leave와 함께 `*ngIf` 및 `*ngFor` 사용

`:enter` 전환은 모든 `*ngIf` 또는 `*ngFor` 뷰가 페이지에 배치될 때 실행되며, `:leave`는 해당 뷰가 페이지에서 제거될 때 실행됩니다.

중요: 들어가거나 나가는 동작은 때때로 혼란을 줄 수 있습니다. 일반적으로 Angular에 의해 DOM에 추가되는 모든 요소는 `:enter` 전환을 거치게 됩니다. Angular에 의해 DOM에서 직접 제거되는 요소만이 `:leave` 전환을 거치게 됩니다. 예를 들어, 요소의 뷰가 DOM에서 제거되는 것은 그 부모가 DOM에서 제거되기 때문입니다.

이 예제에는 `myInsertRemoveTrigger`라는 이름의 들어가고 나가는 애니메이션을 위한 특별한 트리거가 있습니다. HTML 템플릿은 다음 코드를 포함합니다.

<docs-code header="src/app/insert-remove.component.html" path="adev/src/content/examples/animations/src/app/insert-remove.component.html" visibleRegion="insert-remove"/>

컴포넌트 파일에서 `:enter` 전환은 초기 불투명도를 0으로 설정합니다. 그런 다음 요소가 뷰에 삽입될 때 불투명도를 1로 변경되도록 애니메이션을 통해 진행합니다.

<docs-code header="src/app/insert-remove.component.ts" path="adev/src/content/examples/animations/src/app/insert-remove.component.ts" visibleRegion="enter-leave-trigger"/>

이 예제는 [`state()`](api/animations/state)를 사용할 필요가 없습니다.

## 전환 :increment 및 :decrement

`transition()` 함수는 다른 선택자 값인 `:increment` 및 `:decrement`를 사용할 수 있습니다. 수치 값이 증가하거나 감소할 때 전환을 시작하는 데 사용합니다.

도움이 되는 팁: 다음 예제는 `query()` 및 `stagger()` 메소드를 사용합니다. 이러한 메소드에 대한 자세한 정보는 [복잡한 시퀀스](guide/animations/complex-sequences) 페이지를 참조하세요.

<docs-code header="src/app/hero-list-page.component.ts" path="adev/src/content/examples/animations/src/app/hero-list-page.component.ts" visibleRegion="increment"/>

## 전환에서의 부울 값

트리거에 부울 값이 바인딩 값으로 포함되어 있는 경우, 이 값은 `transition()` 표현식을 사용하여 `true`와 `false` 또는 `1`과 `0`을 비교함으로써 일치시킬 수 있습니다.

<docs-code header="src/app/open-close.component.html" path="adev/src/content/examples/animations/src/app/open-close.component.2.html" visibleRegion="trigger-boolean"/>

위 코드 조각에서 HTML 템플릿은 `<div>` 요소를 `isOpen`의 상태 표현식으로 `openClose`라는 트리거에 바인딩하고 `true` 및 `false`의 가능한 값을 가집니다. 이 패턴은 `open` 및 `close`와 같은 이름이 지정된 두 개의 상태를 생성하는 관행에 대한 대안입니다.

`@Component` 메타데이터의 `animations:` 속성 내에서 상태가 `true`로 평가되면, 관련된 HTML 요소의 높이는 와일드카드 스타일 또는 기본값이 됩니다. 이 경우 애니메이션은 애니메이션 시작 전 요소가 이미 가지고 있던 높이를 사용합니다. 요소가 `closed`일 때, 해당 요소는 높이가 0으로 애니메이션되어 보이지 않게 됩니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.2.ts" visibleRegion="trigger-boolean"/>

## 여러 애니메이션 트리거

컴포넌트에 대해 하나 이상의 애니메이션 트리거를 정의할 수 있습니다. 애니메이션 트리거를 서로 다른 요소에 연결하면 요소 간의 부모-자식 관계가 애니메이션이 실행되는 방식과 시기에 영향을 미칩니다.

### 부모-자식 애니메이션

Angular에서 애니메이션이 트리거될 때마다 부모 애니메이션은 항상 우선 순위를 가지며 자식 애니메이션은 차단됩니다. 자식 애니메이션이 실행되려면 부모 애니메이션이 자식 애니메이션을 포함하는 각 요소를 쿼리해야 합니다. 그 후 [`animateChild()`](api/animations/animateChild) 함수를 사용하여 애니메이션을 실행할 수 있습니다.

#### HTML 요소에서 애니메이션 비활성화

`@.disabled`라는 특별한 애니메이션 제어 바인딩을 HTML 요소에 배치하여 해당 요소와 모든 중첩 요소의 애니메이션을 끌 수 있습니다. 참일 경우 `@.disabled` 바인딩은 모든 애니메이션을 렌더링하는 것을 방지합니다.

다음 코드 샘플은 이 기능을 사용하는 방법을 보여줍니다.

<docs-code-multifile>
    <docs-code header="src/app/open-close.component.html" path="adev/src/content/examples/animations/src/app/open-close.component.4.html" visibleRegion="toggle-animation"/>
    <docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.4.ts" visibleRegion="toggle-animation" language="typescript"/>
</docs-code-multifile>

`@.disabled` 바인딩이 참일 때, `@childAnimation` 트리거는 작동하지 않습니다. 

HTML 템플릿 내에서 요소에 애니메이션을 끄려면 `@.disabled` 호스트 바인딩을 사용해야 하며, 애니메이션은 모든 하위 요소에서도 꺼집니다. 단일 요소에서 여러 애니메이션을 선택적으로 끌 수는 없습니다. 

비활성화된 부모에서 선택적으로 자식 애니메이션을 실행할 수 있는 방법은 다음과 같습니다:

* 부모 애니메이션은 `query()`([api/animations/query](api/animations/query)) 함수를 사용하여 HTML 템플릿의 비활성 영역에 위치한 내부 요소를 수집할 수 있습니다. 그런 요소들은 여전히 애니메이션될 수 있습니다.
* 부모에 의해 자식 애니메이션이 쿼리되고 후에 `animateChild()` 함수로 애니메이션될 수 있습니다.

#### 모든 애니메이션 비활성화

Angular 애플리케이션에 대해 모든 애니메이션을 끄려면 가장 상위 Angular 컴포넌트에 `@.disabled` 호스트 바인딩을 배치하십시오.

<docs-code header="src/app/app.component.ts" path="adev/src/content/examples/animations/src/app/app.component.ts" visibleRegion="toggle-app-animations"/>

도움이 되는 팁: 애플리케이션 전역에서 애니메이션을 비활성화하는 것은 종단 간 (E2E) 테스트 중에 유용합니다.

## 애니메이션 콜백

애니메이션 `trigger()` 함수는 시작할 때와 끝낼 때 *콜백*을 발생시킵니다. 다음 예제는 `openClose` 트리거를 포함하는 컴포넌트를 보여줍니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="events1"/>

HTML 템플릿에서 애니메이션 이벤트는 `$event`를 통해 반환되며, `@triggerName.start` 및 `@triggerName.done`으로 전달됩니다. 여기서 `triggerName`은 사용되는 트리거의 이름입니다. 이 예제에서 `openClose` 트리거는 다음과 같이 나타납니다.

<docs-code header="src/app/open-close.component.html" path="adev/src/content/examples/animations/src/app/open-close.component.3.html" visibleRegion="callbacks"/>

애니메이션 콜백의 잠재적인 용도는 느린 API 호출, 예를 들어 데이터베이스 조회를 커버하는 것입니다. 예를 들어, **InProgress** 버튼은 백엔드 시스템 작업이 완료될 때까지 자체 루프 애니메이션을 가질 수 있습니다.

현재 애니메이션이 완료될 때 다른 애니메이션을 호출할 수 있습니다. 예를 들어, API 호출이 완료되면 버튼이 `inProgress` 상태에서 `closed` 상태로 전환됩니다.

애니메이션은 최종 사용자가 작업을 더 빠르게 *인식하도록* 영향을 줄 수 있습니다. 비록 실제로는 그렇지 않을지라도.

콜백은 디버깅 도구로 사용될 수 있으며, 예를 들어, `console.warn()`와 함께 사용하여 브라우저의 개발자 JavaScript 콘솔에서 애플리케이션의 진행 상황을 볼 수 있습니다. 다음 코드 조각은 원래 예제인 `open` 및 `closed` 두 상태를 가진 버튼에 대한 콘솔 로그 출력을 생성합니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="events"/>

## 키프레임

여러 단계로 순차적으로 실행되는 애니메이션을 생성하려면 *키프레임*을 사용하십시오.

Angular의 `keyframe()` 함수는 단일 타이밍 세그먼트 내에서 여러 스타일 변경을 허용합니다. 예를 들어 버튼이 서서히 사라지는 대신 한 개의 2초 시간 동안 여러 번 색상을 변경할 수 있습니다.

<img alt="키프레임" src="assets/images/guide/animations/keyframes-500.png">

이 색상 변경에 대한 코드는 다음과 같을 수 있습니다.

<docs-code header="src/app/status-slider.component.ts" path="adev/src/content/examples/animations/src/app/status-slider.component.ts" visibleRegion="keyframes"/>

### 오프셋

키프레임은 각 스타일 변경이 발생하는 시점을 정의하는 `offset`을 포함합니다. 오프셋은 영에서 1까지의 상대적 조치로, 애니메이션의 시작과 끝을 표시합니다. 사용된 경우 각 키프레임 단계에 적용해야 합니다.

키프레임에 대한 오프셋을 정의하는 것은 선택 사항입니다. 생략할 경우 균등하게 간격이 배치된 오프셋이 자동으로 할당됩니다. 예를 들어, 사전 정의된 오프셋이 없는 세 개의 키프레임은 0, 0.5, 1의 오프셋을 받습니다. 이전 예에서 중간 전환에 대한 오프셋으로 0.8을 지정할 수 있습니다.

<img alt="오프셋이 있는 키프레임" src="assets/images/guide/animations/keyframes-offset-500.png">

오프셋이 지정된 코드는 다음과 같습니다.

<docs-code header="src/app/status-slider.component.ts" path="adev/src/content/examples/animations/src/app/status-slider.component.ts" visibleRegion="keyframesWithOffsets"/>

`duration`, `delay`, `easing`과 함께 해주며 키프레임을 단일 애니메이션 내에서 조합할 수 있습니다.

### 맥박이 있는 키프레임

애니메이션 전반에 걸쳐 특정 오프셋에서 스타일을 정의하여 애니메이션에 맥박 효과를 생성하려면 키프레임을 사용하세요.

다음은 키프레임을 사용하여 맥박 효과를 생성하는 예입니다:

* 원래의 `open` 및 `closed` 상태, 원래 높이, 색상 및 불투명도의 변화가 1초의 시간 범위에서 발생합니다.
* 그 중간에 삽입된 키프레임 시퀀스가 버튼이 같은 1초의 시간 범위 내에서 불규칙하게 맥박치는 것처럼 보이게 합니다.

<img alt="불규칙한 맥박이 있는 키프레임" src="assets/images/guide/animations/keyframes-pulsation.png">

이 애니메이션에 대한 코드 조각은 다음과 같을 수 있습니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.1.ts" visibleRegion="trigger"/>

### 애니메이션 가능한 속성과 단위

Angular 애니메이션은 웹 애니메이션 위에서 구성되므로 브라우저가 애니메이션 똑바로 고려하는 모든 속성을 애니메이션할 수 있습니다. 여기에는 위치, 크기, 변환, 색상, 테두리 등이 포함됩니다. W3C는 [CSS 전환](https://www.w3.org/TR/css-transitions-1) 페이지에서 애니메이션 가능한 속성의 목록을 유지합니다.

수치 값을 가지는 속성의 경우, 적절한 접미사를 포함한 문자열로 값을 제공하여 단위를 정의합니다:

* 50픽셀:
    `'50px'`

* 상대적 글꼴 크기:
    `'3em'`

* 비율:
    `'100%'`

숫자로 값을 제공할 수도 있습니다. 이 경우 Angular는 기본 단위를 픽셀, 즉 `px`로 간주합니다. 50픽셀을 `50`으로 표현하는 것은 `'50px'`라고 말하는 것과 같습니다.

도움이 되는 팁: 문자열 `"50"`은 유효한 것으로 간주되지 않습니다.

### 와일드카드를 통한 자동 속성 계산

때때로, 차원 스타일 속성의 값은 런타임까지 알려지지 않을 수 있습니다. 예를 들어, 요소는 종종 내용이나 화면 크기에 따라 너비와 높이가 달라집니다. 이러한 속성은 CSS를 사용하여 애니메이션하기가 종종 어렵습니다.

이 경우 `style()` 아래에서 특별한 와일드카드 `*` 속성 값을 사용할 수 있습니다. 해당 스타일 속성의 값은 런타임에 계산되어 애니메이션에 연결됩니다.

다음 예제에는 HTML 요소가 페이지를 떠날 때 사용되는 `shrinkOut`라는 트리거가 있습니다. 애니메이션은 요소가 떠나기 전에 갖고 있던 높이를 가져오고, 그 높이에서 0으로 애니메이션됩니다.

<docs-code header="src/app/hero-list-auto.component.ts" path="adev/src/content/examples/animations/src/app/hero-list-auto.component.ts" visibleRegion="auto-calc"/>

### 키프레임 요약

Angular의 `keyframes()` 함수는 단일 전환 내에서 여러 중간 스타일을 지정할 수 있도록 합니다. 각 스타일 변경이 발생해야 할 애니메이션 내의 시점을 정의하기 위해 선택적 `offset`을 사용할 수 있습니다.

## Angular 애니메이션에 대한 더 많은 정보

다음 항목에도 관심이 있을 수 있습니다:

<docs-pill-row>
  <docs-pill href="guide/animations" title="Angular 애니메이션 소개"/>
  <docs-pill href="guide/animations/complex-sequences" title="복잡한 애니메이션 시퀀스"/>
  <docs-pill href="guide/animations/reusable-animations" title="재사용 가능한 애니메이션"/>
  <docs-pill href="guide/animations/route-animations" title="경로 전환 애니메이션"/>
</docs-pill-row>