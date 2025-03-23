Angular의 `<ng-template>` 요소는 기본적으로 렌더링되지 않는 템플릿을 정의합니다.

`<ng-template>`을 사용하면 Angular에게 직접적으로 또는 간접적으로 특정한 지시를 하지 않는 한 렌더링되지 않는 템플릿 콘텐츠를 정의할 수 있습니다. 이를 통해 콘텐츠가 표시되는 방법과 시점을 완전히 제어할 수 있습니다.

<div class="alter is-helpful">

내용을 `<ng-template>` 내부에 감싸지만 Angular에게 렌더링하도록 지시하지 않으면 해당 콘텐츠는 페이지에 나타나지 않음을 유의하세요. 예를 들어, 다음 HTML 코드를 보시면 Angular는 "Hip! Hip! Hooray!"라는 문구에서 중간의 "Hip!"을 렌더링하지 않을 것입니다. 이는 주변의 `<ng-template>` 때문입니다.

```html
  <p>Hip!</p>
  <ng-template>
    <p>Hip!</p>
  </ng-template>
  <p>Hooray!</p>
```

</div>

## 사용 노트

### 구조 지시자

`<ng-template>`의 주요 용도 중 하나는 [구조 지시자](guide/directives/structural-directives)에서 사용할 템플릿 콘텐츠를 보관하는 것입니다. 이러한 지시자는 고유의 논리에 따라 템플릿 콘텐츠의 복사본을 추가하거나 제거할 수 있습니다.

[구조 지시자 단축형](guide/directives/structural-directives#structural-directive-shorthand)을 사용할 때 Angular는 백그라운드에서 `<ng-template>` 요소를 생성합니다.

### TemplateRef

`<ng-template>` 요소는 `TemplateRef` 클래스의 인스턴스로 표현됩니다.

템플릿을 DOM에 복사하려면 이 객체를 `ViewContainerRef` 메소드 `createEmbeddedView()`에 전달하십시오.

### 템플릿 변수

`<ng-template>` 요소는 [표준 템플릿 변수](guide/templates/variables#template-reference-variables#how-angular-assigns-values-to-template-variables)를 사용하여 템플릿에서 참조할 수 있습니다.

_이것이 `<ng-template>` 요소를 `ngIf` else 절로 사용하는 방법입니다._

이러한 템플릿 변수는 `ngTemplateOutlet` 지시자와 함께 사용하여 `<ng-template>` 태그 내부에 정의된 콘텐츠를 렌더링하는 데 사용할 수 있습니다.

### 쿼리

[쿼리](api/core/Query) (예: `ViewChild`)는 `<ng-template>` 요소와 연결된 `TemplateRef`를 찾아 프로그래밍 방식으로 사용할 수 있습니다. 예를 들어, 이를 `ViewContainerRef` 메소드 `createEmbeddedView()`에 전달하는 경우입니다.

### 컨텍스트

`<ng-template>` 태그 내부에서는 주변 외부 템플릿에 존재하는 변수를 참조할 수 있습니다. 또한 `<ng-template>` 요소와 연결된 컨텍스트 객체를 설정할 수 있습니다. 이러한 객체는 템플릿 콘텐츠 내에서 템플릿 선언(`let` 및 `as`)을 통해 접근할 수 있는 변수를 포함합니다.