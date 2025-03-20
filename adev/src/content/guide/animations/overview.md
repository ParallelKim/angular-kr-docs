# Angular 애니메이션 소개

애니메이션은 움직임의 환상을 제공합니다: HTML 요소는 시간이 지남에 따라 스타일이 변경됩니다. 잘 설계된 애니메이션은 애플리케이션을 더 재미있고 직관적으로 사용할 수 있게 하지만, 단지 장식적인 요소가 아닙니다. 애니메이션은 몇 가지 방법으로 애플리케이션과 사용자 경험을 개선할 수 있습니다:

* 애니메이션이 없으면 웹 페이지 전환이 갑작스럽고 충격적으로 보일 수 있습니다.
* 움직임은 사용자 경험을 크게 향상시키므로, 애니메이션은 사용자가 자신의 행동에 대한 애플리케이션의 반응을 감지할 수 있는 기회를 제공합니다.
* 좋은 애니메이션은 직관적으로 사용자가 주목해야 할 부분을 알려줍니다.

일반적으로 애니메이션은 시간이 지남에 따라 여러 스타일 *변환*을 포함합니다. HTML 요소는 이동할 수 있고, 색상을 변경하며, 커지거나 줄어들고, 서서히 사라지거나 페이지에서 미끄러질 수 있습니다. 이러한 변화는 동시에 또는 순차적으로 발생할 수 있으며, 각 변환의 타이밍을 제어할 수 있습니다.

Angular의 애니메이션 시스템은 CSS 기능에 기반하여 구축되었으며, 이는 브라우저가 애니메이션 가능하다고 간주하는 모든 속성을 애니메이션 할 수 있음을 의미합니다. 여기에는 위치, 크기, 변형, 색상, 경계 등이 포함됩니다. W3C는 자신의 [CSS Transitions](https://www.w3.org/TR/css-transitions-1) 페이지에 애니메이션 가능한 속성 목록을 유지하고 있습니다.

## 이 가이드에 대하여

이 가이드는 Angular 애니메이션을 프로젝트에 추가하는 데 필요한 기본 Angular 애니메이션 기능을 다룹니다.

## 시작하기

애니메이션을 위한 주요 Angular 모듈은 `@angular/animations`와 `@angular/platform-browser`입니다.

프로젝트에 Angular 애니메이션을 추가하려면, 표준 Angular 기능과 함께 애니메이션 전용 모듈을 가져옵니다.

<docs-workflow>
<docs-step title="애니메이션 모듈 활성화">
`@angular/platform-browser/animations/async`에서 `provideAnimationsAsync`를 가져와 `bootstrapApplication` 함수 호출의 제공자 목록에 추가합니다.

<docs-code header="애니메이션 활성화" language="ts" linenums>
bootstrapApplication(AppComponent, {
  providers: [
    provideAnimationsAsync(),
  ]
});
</docs-code>

<docs-callout important title="애플리케이션에서 즉각적인 애니메이션이 필요한 경우">
  애플리케이션이 로드될 때 즉각적으로 애니메이션이 발생해야 하는 경우,
  기꺼이 로드된 애니메이션 모듈로 전환하는 것이 좋습니다. 대신 `@angular/platform-browser/animations`에서 `provideAnimations`를 가져오고,
  `bootstrapApplication` 함수 호출에서 `provideAnimationsAsync` **대신에** `provideAnimations`를 사용하세요.
</docs-callout>

`NgModule` 기반 애플리케이션의 경우, 애니메이션 기능을 Angular 루트 애플리케이션 모듈에 도입하는 `BrowserAnimationsModule`을 가져옵니다.

<docs-code header="src/app/app.module.ts" path="adev/src/content/examples/animations/src/app/app.module.1.ts"/>
</docs-step>
<docs-step title="컴포넌트 파일에 애니메이션 함수 가져오기">
컴포넌트 파일에서 특정 애니메이션 함수를 사용할 계획이라면, `@angular/animations`에서 해당 함수를 가져옵니다.

<docs-code header="src/app/app.component.ts" path="adev/src/content/examples/animations/src/app/app.component.ts" visibleRegion="imports"/>

이 가이드 끝에서 모든 [사용 가능한 애니메이션 함수](guide/animations#animations-api-summary)를 확인하세요.

</docs-step>
<docs-step title="애니메이션 메타데이터 속성 추가하기">
컴포넌트 파일에서 `@Component()` 데코레이터 내에 `animations:`라는 메타데이터 속성을 추가합니다. 애니메이션을 정의하는 트리거를 `animations` 메타데이터 속성 내에 넣습니다.

<docs-code header="src/app/app.component.ts" path="adev/src/content/examples/animations/src/app/app.component.ts" visibleRegion="decorator"/>
</docs-step>
</docs-workflow>

## 전환 애니메이션

하나의 HTML 요소가 한 상태에서 다른 상태로 변경되는 전환을 애니메이션해 보겠습니다. 예를 들어 버튼이 사용자의 마지막 행동에 따라 **열기** 또는 **닫기**를 표시하도록 지정할 수 있습니다. 버튼이 `open` 상태에 있을 때는 표시되고 노란색입니다. `closed` 상태일 때는 반투명하고 파란색입니다.

HTML에서 이러한 속성은 색상 및 불투명도와 같은 일반적인 CSS 스타일을 사용하여 설정됩니다. Angular에서는 `style()` 함수를 사용하여 애니메이션에 사용할 CSS 스타일 세트를 지정합니다. 애니메이션 상태에서 스타일 세트를 수집하고, 상태에 이름(예: `open` 또는 `closed`)을 지정합니다.

도움이 되는 정보: 간단한 전환으로 애니메이션할 새로운 `open-close` 컴포넌트를 만들어 보겠습니다.

다음 명령어를 터미널에서 실행하여 컴포넌트를 생성합니다:

<docs-code language="shell">

ng g component open-close

</docs-code>

이렇게 하면 `src/app/open-close.component.ts`에 컴포넌트가 생성됩니다.

### 애니메이션 상태 및 스타일

Angular의 [링크를 이용해](api/animations/state) 다양한 상태를 정의하여 각 전환의 끝에서 호출할 수 있습니다. 이 함수는 두 개의 인수를 받습니다: `open` 또는 `closed`와 같은 고유한 이름과 `style()` 함수입니다.

`style()` 함수를 사용하여 주어진 상태 이름과 연관된 스타일 세트를 정의합니다. 대시가 포함된 스타일 속성은 *camelCase* 형식으로 사용해야 하며, 예를 들어 `backgroundColor`와 같은 형식이나, `'background-color'`와 같이 따옴표로 묶을 수 있습니다.

Angular의 [state()](api/animations/state) 함수가 `style()` 함수와 어떻게 함께 작동하는지 확인해 보겠습니다. 이 코드 조각에서는 상태에 대해 여러 스타일 속성이 동시에 설정됩니다. `open` 상태에서 버튼은 높이가 200픽셀이고, 불투명도는 1이며, 배경 색상은 노란색입니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="state1"/>

이후의 `closed` 상태에서 버튼의 높이는 100픽셀, 불투명도는 0.8이며, 배경 색상은 파란색입니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="state2"/>

### 전환 및 타이밍

Angular에서는 애니메이션 없이 여러 스타일을 설정할 수 있습니다. 그러나 추가적인 정제가 없다면 버튼은 변화 없이 즉시 변형되어 버립니다.

변화를 덜 갑작스럽게 만들려면, 애니메이션 *전환*을 정의하여 한 상태에서 다른 상태로의 변화가 시간에 따라 발생하도록 해야 합니다. `transition()` 함수는 두 개의 인수를 받습니다: 첫 번째 인수는 두 전환 상태 간의 방향을 정의하는 표현식을 받고, 두 번째 인수는 하나 또는 여러 개의 `animate()` 단계를 받습니다.

`animate()` 함수를 사용하여 전환의 길이, 지연 및 진동을 정의하고, 애니메이션이 진행되는 동안 스타일을 정의하는 스타일 함수를 지정합니다. `animate()` 함수는 다단계 애니메이션을 위한 `keyframes()` 함수를 정의하는 데 사용됩니다. 이러한 정의는 `animate()` 함수의 두 번째 인수에 위치하게 됩니다.

#### 애니메이션 메타데이터: 지속 시간, 지연 및 진동

`animate()` 함수 (전이 함수의 두 번째 인수)는 `timings` 및 `styles` 입력 매개변수를 받습니다.

`timings` 매개변수는 숫자나 세 부분으로 정의된 문자열을 받을 수 있습니다.

<docs-code language="typescript">

animate (duration)

</docs-code>

또는

<docs-code language="typescript">

animate ('duration delay easing')

</docs-code>

첫 번째 부분인 `duration`은 필수입니다. 지속 시간은 따옴표 없이 숫자로 밀리초로 표현할 수 있고, 따옴표와 시간 지정자가 있는 문자열로 표현할 수도 있습니다. 예를 들어, 0.1초의 지속 시간은 다음과 같이 표현할 수 있습니다:

* 일반 숫자로, 밀리초로:
    `100`

* 문자열로, 밀리초로:
    `'100ms'`

* 문자열로, 초로:
    `'0.1s'`

두 번째 인수인 `delay`는 `duration`과 동일한 구문을 가집니다. 예를 들면:

* 100ms 기다린 다음 200ms 실행: `'0.2s 100ms'`

세 번째 인수인 `easing`은 애니메이션이 실행되는 동안 [가속과 감속을](https://easings.net) 제어합니다. 예를 들어, `ease-in`은 애니메이션이 천천히 시작하고 진행됨에 따라 속도가 빨라지게 합니다.

* 100ms 기다리고 200ms 실행.
    시작하는 기울기를 사용하여 빠르게 시작하고 느리게 감속하여 안정된 지점에 도달하게 합니다: `'0.2s 100ms ease-out'`

* 200ms 실행하고 지연 없음.
    표준 곡선을 사용하여 천천히 시작하고 중간에 가속한 후 마지막에 서서히 감속합니다: `'0.2s ease-in-out'`

* 즉시 시작하고 200ms 실행.
    가속 곡선을 사용하여 천천히 시작하고 전체 속도로 끝나게 합니다: `'0.2s ease-in'`

도움이 되는 정보: [자연스러운 진동 곡선에 대한](https://material.io/design/motion/speed.html#easing) Material Design 웹사이트의 주제를 확인하세요.

이 예는 `open`에서 `closed` 상태로의 상태 전환을 제공하며, 상태 간의 1초 전환이 있습니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="transition1"/>

앞선 코드 조각에서 `=>` 연산자는 단방향 전환을 나타내고, `<=>`는 양방향입니다. 전환 내에서 `animate()`는 전환이 걸리는 시간을 지정합니다. 이 경우, `open`에서 `closed`로의 상태 변화는 1초가 걸리며, 여기서는 `1s`로 표현됩니다.

이 예제는 `closed` 상태에서 `open` 상태로의 상태 전환을 추가하며, 0.5초의 전환 애니메이션 아크를 가집니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="transition2"/>

도움이 되는 정보: `state`(api/animations/state) 및 `transition` 함수 내에서 스타일을 사용하는 것에 대한 추가적인 메모입니다.

* `state()`를 사용하여 각 전환 끝에 적용되는 스타일을 정의하면 애니메이션 완료 후에도 지속됩니다.
* `transition()`을 사용하여 애니메이션 동안 움직임의 환상을 제공하는 중간 스타일을 정의합니다.
* 애니메이션이 비활성화되어 있는 경우, `transition()` 스타일은 건너뛸 수 있지만 `state()` 스타일은 건너뛸 수 없습니다.
* 동일한 `transition()` 인수 내에 여러 상태 쌍을 포함할 수 있습니다:

    <docs-code language="typescript">

    transition( 'on => off, off => void' )

    </docs-code>

### 애니메이션 시작하기

애니메이션은 시작할 때 알림을 받을 수 있는 *트리거*가 필요합니다. `trigger()` 함수는 상태와 전환을 수집하고 애니메이션에 이름을 부여하여 HTML 템플릿의 트리거 요소에 연결할 수 있도록 합니다.

`trigger()` 함수는 변경 사항을 관찰할 속성 이름을 설명합니다. 변경이 발생하면 트리거는 정의에 포함된 동작을 시작합니다. 이러한 동작은 전환이나 다른 함수일 수 있으며, 나중에 보게 될 것입니다.

이 예제에서는 트리거 이름을 `openClose`로 정하고 `button` 요소에 부착합니다. 트리거는 열린 상태와 닫힌 상태 및 두 전환의 타이밍을 설명합니다.

도움이 되는 정보: 각 `trigger()` 함수 호출 내에서 요소는 언제든지 하나의 상태에만 있을 수 있습니다. 그러나 여러 트리거가 동시에 활성화될 수 있습니다.

### 애니메이션 정의 및 HTML 템플릿에 부착하기

애니메이션은 애니메이션할 HTML 요소를 제어하는 컴포넌트의 메타데이터에서 정의됩니다. 애니메이션을 정의하는 코드를 `@Component()` 데코레이터 내의 `animations:` 속성 아래에 배치합니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="component"/>

컴포넌트에 애니메이션 트리거를 정의한 후, 해당 컴포넌트의 템플릿에서 트리거 이름을 괄호로 감싸고 '@' 기호로 앞에 붙여 요소에 부착합니다. 그런 다음 다음과 같이 표준 Angular 속성 바인딩 구문을 사용하여 트리거를 템플릿 표현식에 바인딩할 수 있습니다. 여기서 `triggerName`은 트리거의 이름이고, `expression`은 정의된 애니메이션 상태로 평가됩니다.

<docs-code language="typescript">

<div [@triggerName]="expression">…</div>;

</docs-code>

애니메이션은 표현식 값이 새로운 상태로 변경될 때 실행되거나 트리거됩니다.

다음 코드 조각은 트리거를 `isOpen` 속성의 값에 바인딩합니다.

<docs-code header="src/app/open-close.component.html" path="adev/src/content/examples/animations/src/app/open-close.component.1.html" visibleRegion="trigger"/>

이 예제에서는 `isOpen` 표현식이 `open` 또는 `closed`의 정의된 상태로 평가될 때, 트리거 `openClose`에 상태 변경을 알립니다. 그런 다음 `openClose` 코드가 상태 변경을 처리하고 상태 변경 애니메이션을 시작하는 작업을 수행합니다.

페이지에 들어가거나 나가는 요소( DOM에 삽입 또는 제거되는 경우) 애니메이션을 조건부로 만들 수 있습니다. 예를 들어, HTML 템플릿에서 애니메이션 트리거와 함께 `*ngIf`를 사용할 수 있습니다.

도움이 되는 정보: 컴포넌트 파일에서는 트리거가 애니메이션을 정의하는 값을 `@Component()` 데코레이터의 `animations:` 속성으로 설정합니다.

HTML 템플릿 파일에서는 트리거 이름을 사용하여 정의된 애니메이션을 애니메이션할 HTML 요소에 부착합니다.

### 코드 검토

여기 전환 예제에서 논의된 코드 파일들이 있습니다.

<docs-code-multifile>
    <docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.ts" visibleRegion="component"/>
    <docs-code header="src/app/open-close.component.html" path="adev/src/content/examples/animations/src/app/open-close.component.1.html" visibleRegion="trigger"/>
    <docs-code header="src/app/open-close.component.css" path="adev/src/content/examples/animations/src/app/open-close.component.css"/>
</docs-code-multifile>

### 요약

두 상태 간의 전환에 애니메이션을 추가하는 방법을 `style()` 및 [state()](api/animations/state)와 함께 `animate()`를 사용하여 타이밍을 다루는 방법을 배웠습니다.

[전환 및 트리거](guide/animations/transition-and-triggers)에서 고급 기술이 포함된 Angular 애니메이션의 고급 기능에 대해 알아보세요.

## 애니메이션 API 요약

`@angular/animations` 모듈에서 제공하는 기능적 API는 Angular 애플리케이션에서 애니메이션을 생성하고 제어하기 위한 도메인 특정 언어(DSL)를 제공합니다. 핵심 함수 및 관련 데이터 구조의 완전한 목록 및 구문 세부정보는 [API 참고자료](api#animations)를 참조하세요.

| 함수 이름                         | 기능                                                                                                                                                                                                    |
|:---                               |:---                                                                                                                                                                                                     |
| `trigger()`                       | 애니메이션을 시작하고 모든 다른 애니메이션 함수 호출을 위한 컨테이너 역할을 합니다. HTML 템플릿은 `triggerName`에 바인딩됩니다. 첫 번째 인수를 사용하여 고유한 트리거 이름을 선언하세요. 배열 구문을 사용합니다. |
| `style()`                         | 애니메이션에서 사용할 하나 이상의 CSS 스타일을 정의합니다. 애니메이션 중 HTML 요소의 시각적 모양을 제어합니다. 객체 구문을 사용합니다.                                                                                        |
| [`state()`](api/animations/state) | 성공적으로 지정된 상태로 전환될 때 적용해야 하는 CSS 스타일 세트를 만듭니다. 이 상태는 다른 애니메이션 함수 내에서 이름으로 참조될 수 있습니다.                                                            |
| `animate()`                       | 전환의 타이밍 정보를 지정합니다. `delay` 및 `easing`에 대한 선택적 값을 포함할 수 있습니다. 그 안에 `style()` 호출을 포함할 수 있습니다.                                                                         |
| `transition()`                    | 두 이름이 지정된 상태 간의 애니메이션 시퀀스를 정의합니다. 배열 구문을 사용합니다.                                                                                                                                 |
| `keyframes()`                     | 특정 시간 간격 내에서 스타일 간의 순차적 변경을 허용합니다. `animate()` 내에서 사용합니다. 각 `keyframe()` 내에 여러 `style()` 호출을 포함할 수 있습니다. 배열 구문을 사용합니다.                              |
| [`group()`](api/animations/group) | 병렬로 실행될 애니메이션 단계(*내부 애니메이션*)의 그룹을 지정합니다. 모든 내부 애니메이션 단계가 완료된 후에만 애니메이션이 계속됩니다. `sequence()` 또는 `transition()` 내에서 사용됩니다.                            |
| `query()`                         | 현재 요소 내에서 하나 이상의 내부 HTML 요소를 찾습니다.                                                                                                                                                        |
| `sequence()`                      | 순차적으로 실행되는 애니메이션 단계 목록을 지정합니다.                                                                                                                                                    |
| `stagger()`                       | 여러 요소의 애니메이션 시작 시간을 미루게 합니다.                                                                                                                                                       |
| `animation()`                     | 다른 곳에서 호출할 수 있는 재사용 가능한 애니메이션을 생성합니다. `useAnimation()`과 함께 사용합니다.                                                                                                       |
| `useAnimation()`                  | 재사용 가능한 애니메이션을 활성화합니다. `animation()`과 함께 사용합니다.                                                                                                                                 |
| `animateChild()`                  | 부모와 같은 시간 내에 자식 컴포넌트의 애니메이션을 실행할 수 있게 합니다.                                                                                                           |

</table>

## Angular 애니메이션에 대한 추가 정보

도움이 되는 정보: [AngularConnect 2017년 11월 회의에서 보여준 이 프레젠테이션](https://www.youtube.com/watch?v=rnTK9meY5us) 및 동반한 [소스 코드](https://github.com/matsko/animationsftw.in)를 확인하세요.

다음 내용에도 관심이 있을 수 있습니다:

<docs-pill-row>
  <docs-pill href="guide/animations/transition-and-triggers" title="전환 및 트리거"/>
  <docs-pill href="guide/animations/complex-sequences" title="복잡한 애니메이션 시퀀스"/>
  <docs-pill href="guide/animations/reusable-animations" title="재사용 가능한 애니메이션"/>
  <docs-pill href="guide/animations/route-animations" title="경로 전환 애니메이션"/>
</docs-pill-row>