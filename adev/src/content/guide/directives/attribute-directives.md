# 속성 지시자

속성 지시자를 사용하여 DOM 요소와 Angular 구성 요소의 모양이나 동작을 변경합니다.

## 속성 지시자 만들기

이 섹션에서는 호스트 요소의 배경 색상을 노란색으로 설정하는 하이라이트 지시자를 생성하는 과정을 안내합니다.

1. 지시자를 만들려면 CLI 명령어 [`ng generate directive`](tools/cli/schematics)를 사용합니다.

    <docs-code language="shell">

    ng generate directive highlight

    </docs-code>

    CLI는 `src/app/highlight.directive.ts`와 해당하는 테스트 파일 `src/app/highlight.directive.spec.ts`를 생성합니다.

    <docs-code header="src/app/highlight.directive.ts" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.0.ts"/>

    `@Directive()` 데코레이터의 구성 속성은 지시자의 CSS 속성 선택기인 `[appHighlight]`를 지정합니다.

1. `@angular/core`에서 `ElementRef`를 가져옵니다.
    `ElementRef`는 호스트 DOM 요소에 대한 직접 액세스를 `nativeElement` 속성을 통해 제공합니다.

1. 지시자의 `constructor()`에서 `ElementRef`를 추가하여 `appHighlight`를 적용하는 호스트 DOM 요소에 대한 참조를 [주입](guide/di)합니다.

1. 배경을 노란색으로 설정하는 로직을 `HighlightDirective` 클래스에 추가합니다.

    <docs-code header="src/app/highlight.directive.ts" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.1.ts"/>

도움말: 지시자는 *이름 공간*을 지원하지 않습니다.

<docs-code header="src/app/app.component.avoid.html (unsupported)" path="adev/src/content/examples/attribute-directives/src/app/app.component.avoid.html" visibleRegion="unsupported"/>

## 속성 지시자 적용하기

1. `HighlightDirective`를 사용하려면 HTML 템플릿에 지시자를 속성으로 가진 `<p>` 요소를 추가합니다.

    <docs-code header="src/app/app.component.html" path="adev/src/content/examples/attribute-directives/src/app/app.component.1.html" visibleRegion="applied"/>

Angular는 `HighlightDirective` 클래스의 인스턴스를 생성하고 지시자의 생성자에 `<p>` 요소에 대한 참조를 주입하여 `<p>` 요소의 배경 스타일을 노란색으로 설정합니다.

## 사용자 이벤트 처리

이 섹션에서는 사용자가 요소로 마우스를 들어가거나 나갈 때 감지하고 하이라이트 색상을 설정하거나 지우는 방법을 보여줍니다.

1. `@angular/core`에서 `HostListener`를 가져옵니다.

    <docs-code header="src/app/highlight.directive.ts (imports)" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.2.ts" visibleRegion="imports"/>

1. 마우스가 들어오거나 나갈 때 반응하는 두 개의 이벤트 핸들러를 추가하고 각각에 `@HostListener()` 데코레이터를 추가합니다.

    <docs-code header="src/app/highlight.directive.ts (mouse-methods)" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.2.ts" visibleRegion="mouse-methods"/>

속성 지시자를 호스팅하는 DOM 요소의 이벤트에 구독합니다. 이 경우 `<p>`에서 `@HostListener()` 데코레이터를 사용합니다.

도움말: 핸들러는 호스트 DOM 요소 `el`에서 색상을 설정하는 도우미 메서드인 `highlight()`에 위임합니다.

전체 지시자는 다음과 같습니다.

<docs-code header="src/app/highlight.directive.ts" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.2.ts"/>

배경 색상은 포인터가 단락 요소 위에 있을 때 나타나고 포인터가 나가면 사라집니다.

<img alt="Second Highlight" src="assets/images/guide/attribute-directives/highlight-directive-anim.gif">

## 속성 지시자에 값 전달하기

이 섹션에서는 `HighlightDirective`를 적용하면서 하이라이트 색상을 설정하는 과정을 안내합니다.

1. `highlight.directive.ts`에서 `@angular/core`에서 `Input`을 가져옵니다.

    <docs-code header="src/app/highlight.directive.ts (imports)" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.3.ts" visibleRegion="imports"/>

1. `appHighlight` `@Input()` 속성을 추가합니다.

    <docs-code header="src/app/highlight.directive.ts" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.3.ts" visibleRegion="input"/>

    `@Input()` 데코레이터는 클래스에 메타데이터를 추가하여 지시자의 `appHighlight` 속성을 바인딩 가능하게 만듭니다.

1. `app.component.ts`에서 `AppComponent`에 `color` 속성을 추가합니다.

    <docs-code header="src/app/app.component.ts (class)" path="adev/src/content/examples/attribute-directives/src/app/app.component.1.ts" visibleRegion="class"/>

1. 지시자와 색상을 동시에 적용하려면 `appHighlight` 지시자 선택기를 사용하여 속성 바인딩을 수행하고 `color`와 동일하게 설정합니다.

    <docs-code header="src/app/app.component.html (color)" path="adev/src/content/examples/attribute-directives/src/app/app.component.html" visibleRegion="color"/>

    `[appHighlight]` 속성 바인딩은 두 가지 작업을 수행합니다:

    * `<p>` 요소에 하이라이팅 지시자를 적용합니다.
    * 속성 바인딩으로 지시자의 하이라이트 색상을 설정합니다.

### 사용자 입력으로 값 설정

이 섹션에서는 색상 선택을 `appHighlight` 지시자에 바인딩하기 위해 라디오 버튼을 추가하는 방법을 안내합니다.

1. 색상을 선택하기 위한 마크업을 `app.component.html`에 추가합니다:

    <docs-code header="src/app/app.component.html (v2)" path="adev/src/content/examples/attribute-directives/src/app/app.component.html" visibleRegion="v2"/>

1. `AppComponent.color`를 수정하여 초기값이 없도록 합니다.

    <docs-code header="src/app/app.component.ts (class)" path="adev/src/content/examples/attribute-directives/src/app/app.component.ts" visibleRegion="class"/>

1. `highlight.directive.ts`에서 `onMouseEnter` 메서드를 수정하여 먼저 `appHighlight`로 하이라이트를 시도하고 `appHighlight`가 `undefined`인 경우 `red`로 대체합니다.

    <docs-code header="src/app/highlight.directive.ts (mouse-enter)" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.3.ts" visibleRegion="mouse-enter"/>

1. 애플리케이션을 제공하여 사용자가 라디오 버튼으로 색상을 선택할 수 있는지 확인합니다.

    <img alt="Animated gif of the refactored highlight directive changing color according to the radio button the user selects" src="assets/images/guide/attribute-directives/highlight-directive-v2-anim.gif">

## 두 번째 속성에 바인딩하기

이 섹션에서는 개발자가 기본 색상을 설정할 수 있도록 애플리케이션을 구성하는 방법을 안내합니다.

1. `HighlightDirective`에 두 번째 `Input()` 속성인 `defaultColor`를 추가합니다.

    <docs-code header="src/app/highlight.directive.ts (defaultColor)" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.ts" visibleRegion="defaultColor"/>

1. 지시자의 `onMouseEnter`를 수정하여 먼저 `appHighlight`로 하이라이트하고, 다음으로 `defaultColor`로 하이라이트하며, 두 속성이 모두 `undefined`인 경우 `red`로 대체합니다.

    <docs-code header="src/app/highlight.directive.ts (mouse-enter)" path="adev/src/content/examples/attribute-directives/src/app/highlight.directive.ts" visibleRegion="mouse-enter"/>

1. `AppComponent.color`에 바인딩하고 기본 색상을 "violet"으로 설정하려면 다음 HTML을 추가합니다.
    이 경우 `defaultColor` 바인딩은 정적이므로 대괄호 `[]`를 사용하지 않습니다.

    <docs-code header="src/app/app.component.html (defaultColor)" path="adev/src/content/examples/attribute-directives/src/app/app.component.html" visibleRegion="defaultColor"/>

    구성 요소와 마찬가지로 호스트 요소에 여러 지시자 속성 바인딩을 추가할 수 있습니다.

기본 색상이 없으면 기본 색상은 빨강입니다.
사용자가 색상을 선택하면 선택한 색상이 활성 하이라이트 색상이 됩니다.

<img alt="Animated gif of final highlight directive that shows red color with no binding and violet with the default color set. When user selects color, the selection takes precedence." src="assets/images/guide/attribute-directives/highlight-directive-final-anim.gif">

## `NgNonBindable`로 Angular 처리 비활성화하기

브라우저에서 표현식 평가를 방지하려면 호스트 요소에 `ngNonBindable`을 추가합니다.
`ngNonBindable`은 템플릿에서 보간, 지시자 및 바인을딩을 비활성화합니다.

다음 예제에서 표현식 `{{ 1 + 1 }}`는 코드 편집기와 동일하게 렌더링되며, `2`를 표시하지 않습니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/attribute-directives/src/app/app.component.html" visibleRegion="ngNonBindable"/>

요소에 `ngNonBindable`을 적용하면 해당 요소의 자식 요소에 대한 바인딩이 중단됩니다.
그러나 `ngNonBindable`은 `ngNonBindable`을 적용한 요소에서 지시자가 작동하도록 허용합니다.
다음 예제에서 `appHighlight` 지시자는 여전히 활성 상태이지만 Angular는 표현식 `{{ 1 + 1 }}`를 평가하지 않습니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/attribute-directives/src/app/app.component.html" visibleRegion="ngNonBindable-with-directive"/>

부모 요소에 `ngNonBindable`을 적용하면 Angular는 해당 요소의 자식에 대한 모든 종류의 보간 및 바인딩, 즉 속성 바인딩이나 이벤트 바인딩을 비활성화합니다.
