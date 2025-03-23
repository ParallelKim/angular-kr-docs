DOM에 새로운 요소를 추가하지 않고도 구조적 지침을 유지할 수 있는 특별한 요소입니다.

`<ng-container>`는 추가적인 요소 없이 구조적 지시어를 사용할 수 있도록 하여, 오직 지시어가 결정하는 DOM 변경만이 적용되도록 합니다.

이것은 브라우저가 렌더링해야 할 요소 수를 줄이기 때문에 성능을 약간 개선할 수 있을 뿐만 아니라, 더 깨끗한 DOM과 스타일을 유지하는 데 귀중한 자산이 될 수 있습니다.

예를 들어, 구조적 지시어를 사용하여 정밀한 DOM 구조에 의존하는 스타일링을 깨지 않고 사용할 수 있습니다(예: 플렉스 컨테이너, 마진, 자식 조합자 선택자 등을 사용할 때).

## Usage notes

### `*NgIf`와 함께

`<ng-container>`의 일반적인 사용 사례 중 하나는 `*ngIf` 구조적 지시어와 함께 사용하는 것입니다. 이 특별한 요소를 사용하면 매우 깔끔하고 이해하기 쉬운 템플릿을 만들 수 있습니다.

예를 들어, 조건에 따라 여러 요소를 표시하고 싶지만 모든 요소가 동일한 루트 요소 아래에 있을 필요는 없습니다. 이를 쉽게 블록으로 감싸는 것으로 해결할 수 있습니다:

<code-example format="html" language="html">

&lt;ng-container *ngIf="condition"&gt;
  &hellip;
&lt;/ng-container&gt;

</code-example>

이것은 `else` 문과 함께 `<ng-template>`와 결합할 수도 있습니다:

<code-example format="html" language="html">

&lt;ng-container *ngIf="condition; else templateA"&gt;
  &hellip;
&lt;/ng-container&gt;
&lt;ng-template #templateA&gt;
  &hellip;
&lt;/ng-template&gt;

</code-example>

### 여러 구조적 지시어의 조합

여러 구조적 지시어를 동일한 요소에 사용할 수 없습니다. 여러 개의 구조적 지시어를 활용해야 하는 경우, 각 구조적 지시어마다 `<ng-container>`를 사용하는 것이 좋습니다.

가장 일반적인 시나리오는 `*ngIf`와 `*ngFor`가 함께 사용하는 것입니다. 예를 들어, 항목 목록이 있지만 각 항목은 특정 조건이 참일 때만 표시되어야 한다고 가정해 보겠습니다. 다음과 같은 방법으로 시도하고 싶을 수 있습니다:

<code-example format="html" language="html">

&lt;ul&gt;
  &lt;li *ngFor="let item of items"*ngIf="item.isValid"&gt;
    {{ item.name }}
  &lt;/li&gt;
&lt;/ul&gt;

</code-example>

앞서 말했던 것처럼, 이 방법은 작동하지 않으며, 구조적 지시어 중 하나를 `<ng-container>` 요소로 간단히 이동하여 다른 구조적 지시어를 감싸게 할 수 있습니다. 다음과 같이 말입니다:

<code-example format="html" language="html">

&lt;ul&gt;
  &lt;ng-container *ngFor="let item of items"&gt;
    &lt;li* ngIf="item.isValid"&gt;
      {{ item.name }}
    &lt;/li&gt;
  &lt;/ng-container&gt;
&lt;/ul&gt;

</code-example>

이것은 의도한 대로 작동하며 DOM에 불필요한 새로운 요소를 추가하지 않습니다.

자세한 내용은 [하나의 구조적 지시어마다 하나의 요소](guide/directives/structural-directives#one-structural-directive-per-element)를 참조하세요.

### ngTemplateOutlet과 함께 사용

`NgTemplateOutlet` 지시어는 모든 요소에 적용할 수 있지만 대부분의 경우 `<ng-container>` 요소에 적용됩니다. 두 개를 결합하면 추가적인 요소 없이 매우 명확하고 따라하기 쉬운 HTML 및 DOM 구조를 얻을 수 있으며, 요청된 곳에 템플릿 뷰가 인스턴스화됩니다.

예를 들어, 큰 HTML이 있고 그 중 작은 부분이 다른 곳에서 반복해야 하는 상황을 상상해 보세요. 간단한 해결책은 반복되는 HTML을 포함하는 `<ng-template>`를 정의하고 필요에 따라 `<ng-container>`와 `NgTemplateOutlet`을 사용하여 렌더링하는 것입니다.

다음과 같이:

<code-example format="html" language="html">

&lt;!-- &hellip; --&gt;

&lt;ng-container *ngTemplateOutlet="tmpl; context: {&dollar;implicit: 'Hello'}"&gt;
&lt;/ng-container&gt;

&lt;!-- &hellip; --&gt;

&lt;ng-container *ngTemplateOutlet="tmpl; context: {&dollar;implicit: 'World'}"&gt;
&lt;/ng-container&gt;

&lt;!-- &hellip; --&gt;

&lt;ng-template #tmpl let-text&gt;
  &lt;h1&gt;{{ text }}&lt;/h1&gt;
&lt;/ng-template&gt;

</code-example>

`NgTemplateOutlet`에 대한 자세한 정보는 [`NgTemplateOutlet`의 API 문서 페이지](api/common/NgTemplateOutlet)를 참조하세요.
