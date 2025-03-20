# 템플릿 기반 폼 만들기

이 자습서는 템플릿 기반 폼을 만드는 방법을 보여줍니다. 폼의 제어 요소는 입력 검증이 있는 데이터 속성에 바인딩되어 있습니다. 입력 검증은 데이터 무결성을 유지하고 사용자 경험을 개선하기 위해 스타일링에 도움을 줍니다.

템플릿 기반 폼은 [양방향 데이터 바인딩](guide/templates/two-way-binding)을 사용하여 템플릿에서 변경 사항이 발생할 때 컴포넌트의 데이터 모델을 업데이트하고 그 반대의 경우에도 마찬가지입니다.

<docs-callout helpful title="템플릿과 반응형 폼">
Angular는 상호작용하는 폼을 위한 두 가지 설계 접근 방식을 지원합니다. 템플릿 기반 폼은 Angular 템플릿 내에서 폼 특정 지시어를 사용할 수 있게 합니다. 반응형 폼은 폼 구축을 위한 모델 기반 접근 방식을 제공합니다.

템플릿 기반 폼은 소규모 또는 간단한 폼에 적합하며, 반응형 폼은 보다 확장 가능하고 복잡한 폼에 적합합니다. 두 접근 방식의 비교는 [접근 방식 선택하기](guide/forms#choosing-an-approach)를 참조하세요.
</docs-callout>

Angular 템플릿을 사용하여 거의 모든 종류의 폼을 구축할 수 있습니다. 로그인 폼, 연락처 폼, 그리고 거의 모든 비즈니스 폼을 포함합니다.
제어 요소를 창의적으로 배치하고 객체 모델의 데이터에 바인딩할 수 있습니다.
유효성 검사 규칙을 지정하고 유효성 검사 오류를 표시하며, 특정 제어 요소의 입력을 조건부로 허용하고, 내장된 시각적 피드백을 트리거하는 등의 작업도 가능합니다.

## 목표

이 자습서는 다음을 수행하는 방법을 가르쳐 줍니다.

- 컴포넌트 및 템플릿을 사용하여 Angular 폼 구축하기
- `ngModel`을 사용하여 입력 제어 값을 읽고 쓰기 위한 양방향 데이터 바인딩 생성하기
- 제어의 상태를 추적하는 특수 CSS 클래스를 사용하여 시각적 피드백 제공하기
- 사용자에게 유효성 검사 오류를 표시하고 폼 상태에 따라 폼 제어에서 입력을 조건부로 허용하기
- [템플릿 참조 변수를](guide/templates/variables#template-reference-variables) 사용하여 HTML 요소 간에 정보 공유하기

## 템플릿 기반 폼 구축하기

템플릿 기반 폼은 `FormsModule`에 정의된 지시어에 의존합니다.

| 지시어           | 세부사항                                                                                                                                                                                                                                                                                            |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NgModel`        | 부착된 폼 요소의 값 변화를 데이터 모델의 변화와 조화시켜, 입력 검증 및 오류 처리를 통해 사용자 입력에 응답할 수 있게 합니다.                                                                                                                                                            |
| `NgForm`         | 최상위 `FormGroup` 인스턴스를 생성하고 이를 `<form>` 요소에 바인딩하여 집계된 폼 값과 유효성 검토 상태를 추적합니다. `FormsModule`을 가져오면 이 지시어는 기본적으로 모든 `<form>` 태그에서 활성화됩니다. 특별한 선택기를 추가할 필요는 없습니다.                               |
| `NgModelGroup`   | DOM 요소에 `FormGroup` 인스턴스를 생성하고 바인딩합니다.                                                                                                                                                                                                                                         |

### 단계 개요

이 자습서의 과정에서 샘플 폼을 데이터에 바인딩하고 사용자 입력을 처리하는 다음 단계들을 수행합니다.

1. 기본 폼 구축하기.
   - 샘플 데이터 모델 정의
   - `FormsModule`과 같은 필수 인프라 포함하기
2. `ngModel` 지시어와 양방향 데이터 바인딩 문법을 사용하여 폼 제어를 데이터 속성에 바인딩하기.
   - CSS 클래스를 사용하여 `ngModel`이 제어 상태를 보고하는 방법 검토하기
   - `ngModel`에 접근 가능하도록 제어에 이름 지정하기
3. `ngModel`을 사용하여 입력 유효성 및 제어 상태 추적하기.
   - 상태에 대한 시각적 피드백을 제공하기 위해 사용자 정의 CSS 추가하기
   - 유효성 검사 오류 메시지를 표시하고 숨기기
4. 네이티브 HTML 버튼 클릭 이벤트에 응답하여 모델 데이터에 추가하기.
5. 폼의 [`ngSubmit`](api/forms/NgForm#properties) 출력 속성을 사용하여 폼 제출 처리하기.
   - 폼이 유효할 때까지 **제출** 버튼 비활성화하기
   - 제출 후, 완료된 폼을 페이지의 다른 콘텐츠로 바꾸기

## 폼 만들기

<!-- TODO: link to preview -->
<!-- <docs-code live/> -->

1. 제공된 샘플 애플리케이션은 폼에 반영된 데이터 모델을 정의하는 `Actor` 클래스를 생성합니다.

<docs-code header="src/app/actor.ts" language="typescript" path="adev/src/content/examples/forms/src/app/actor.ts"/>

1. 폼 레이아웃과 세부사항은 `ActorFormComponent` 클래스에 정의되어 있습니다.

   <docs-code header="src/app/actor-form/actor-form.component.ts (v1)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.ts" visibleRegion="v1"/>

   컴포넌트의 `selector` 값은 "app-actor-form"으로, 이를 통해 `<app-actor-form>` 태그를 사용하여 부모 템플릿에 이 폼을 추가할 수 있습니다.

1. 다음 코드는 새로운 배우 인스턴스를 생성하여 초기 폼에 예제 배우를 표시할 수 있게 합니다.

   <docs-code language="typescript" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.ts" language="typescript" visibleRegion="Marilyn"/>

   이 데모는 `model`과 `skills`에 더미 데이터를 사용합니다.
   실제 앱에서는 데이터 서비스를 주입하여 실제 데이터 가져오기 및 저장하기, 또는 이러한 속성을 입력 및 출력으로 노출할 것입니다.

1. 애플리케이션은 Forms 기능을 활성화하고 생성된 폼 컴포넌트를 등록합니다.

<docs-code header="src/app/app.module.ts" language="typescript" path="adev/src/content/examples/forms/src/app/app.module.ts"/>

1. 폼은 루트 컴포넌트의 템플릿에 의해 정의된 애플리케이션 레이아웃에 표시됩니다.

   <docs-code header="src/app/app.component.html" language="html" path="adev/src/content/examples/forms/src/app/app.component.html"/>

   초기 템플릿은 두 개의 폼 그룹과 제출 버튼이 있는 폼의 레이아웃을 정의합니다.
   폼 그룹은 배우 데이터 모델의 두 속성, 이름과 스튜디오에 해당합니다.
   각 그룹은 사용자 입력을 위한 레이블과 상자를 가지고 있습니다.

   - **이름** `<input>` 제어 요소는 HTML5 `required` 속성이 있습니다.
   - **스튜디오** `<input>` 제어 요소는 `studio`가 선택 사항이므로 속성이 없습니다.

   **제출** 버튼에는 스타일링을 위한 클래스가 일부 있습니다.
   이 시점에서 폼 레이아웃은 모든 것이 일반 HTML5이므로 바인딩이나 지시어가 없습니다.

1. 샘플 폼은 [Twitter Bootstrap](https://getbootstrap.com/css)의 일부 스타일 클래스를 사용합니다: `container`, `form-group`, `form-control`, 및 `btn`.
이 스타일을 사용하기 위해 애플리케이션의 스타일 시트는 라이브러리를 가져옵니다.

<docs-code header="src/styles.css" path="adev/src/content/examples/forms/src/styles.1.css"/>

1. 폼은 `ActorFormComponent` 내부에 유지되는 미리 정의된 `skills` 목록에서 배우의 기술을 선택해야 합니다.
Angular [NgForOf 지시어](api/common/NgForOf 'API reference')는 데이터 값을 반복하여 `<select>` 요소를 채웁니다.

<docs-code header="src/app/actor-form/actor-form.component.html (skills)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="skills"/>

지금 애플리케이션을 실행하면 선택 제어에서 기술 목록이 표시됩니다.
입력 요소는 아직 데이터 값이나 이벤트에 바인딩되어 있지 않으므로 여전히 비어 있고 동작이 없습니다.

## 입력 제어를 데이터 속성에 바인딩하기

다음 단계는 입력 제어를 해당 `Actor` 속성에 양방향 데이터 바인딩하여 사용자의 입력에 응답하고 데이터의 프로그래밍 변경에도 표시를 업데이트하는 것입니다.

`FormsModule`에서 선언된 `ngModel` 지시어를 사용하면 템플릿 기반 폼의 제어를 데이터 모델의 속성에 바인딩할 수 있습니다.
양방향 데이터 바인딩 문법 `[(ngModel)]`을 사용하여 지시어를 포함하면, Angular는 제어의 값과 사용자 상호 작용을 추적하고 모델과 뷰를 동기화할 수 있습니다.

1. 템플릿 파일 `actor-form.component.html`을 편집합니다.
2. **이름** 레이블 옆에 있는 `<input>` 태그를 찾습니다.
3. 양방향 데이터 바인딩 문법 `[(ngModel)]="..."`을 사용하여 `ngModel` 지시어를 추가합니다.

<docs-code header="src/app/actor-form/actor-form.component.html (excerpt)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="ngModelName-1"/>

HELPFUL: 이 예제는 각 입력 태그 이후에 임시 진단 보간 `{{model.name}}`을 포함하여 해당 속성의 현재 데이터 값을 표시합니다. 이 주석은 양방향 데이터 바인딩 작동을 관찰한 후 진단 줄을 제거하라는 알림입니다.

### 전체 폼 상태 접근하기

컴포넌트에서 `FormsModule`을 가져오면 Angular는 템플릿의 `<form>` 태그에 자동으로 [NgForm](api/forms/NgForm) 지시어 인스턴스를 생성하고 부착합니다(인스턴스의 선택자가 `<form>` 요소와 일치하기 때문입니다).

`NgForm`과 전체 폼 상태에 접근하려면 [템플릿 참조 변수](guide/templates/variables#template-reference-variables)를 선언하세요.

1. 템플릿 파일 `actor-form.component.html`을 편집합니다.
2. `<form>` 태그에 템플릿 참조 변수 `#actorForm`을 추가하고 다음과 같이 값을 설정합니다.

   <docs-code header="src/app/actor-form/actor-form.component.html (excerpt)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="template-variable"/>

   `actorForm` 템플릿 변수는 이제 폼 전체를 관리하는 `NgForm` 지시어 인스턴스를 참조합니다.

3. 앱을 실행합니다.
4. **이름** 입력 상자에 타이핑하기 시작합니다.

   문자를 추가하고 삭제하면 이들이 데이터 모델에 나타나고 사라지는 것을 볼 수 있습니다.

진단 줄은 보간된 값이 입력 상자에서 모델로, 그리고 다시 돌아오는 것을 보여줍니다.

### 제어 요소 이름 지정하기

`[(ngModel)]`을 요소에서 사용하면 해당 요소에 대해 `name` 속성을 정의해야 합니다.
Angular는 할당된 이름을 사용하여 부모 `<form>` 요소에 부착된 `NgForm` 지시어와 함께 요소를 등록합니다.

예제에서는 `<input>` 요소에 `name` 속성을 추가하고 이를 "name"으로 설정하여 배우의 이름에 맞게 설정했습니다.
고유한 값을 사용해도 상관 없지만, 설명적인 이름을 사용하는 것이 유용합니다.

1. **스튜디오** 및 **기술**에 대해 유사한 `[(ngModel)]` 바인딩과 `name` 속성을 추가합니다.
2. 이제 보간된 값을 보여주는 진단 메시지를 제거할 수 있습니다.
3. 전체 배우 모델에 대해 양방향 데이터 바인딩이 작동하는지 확인하기 위해, 상단에[`json`](api/common/JsonPipe) 파이프와 함께 새로운 텍스트 바인딩을 추가하여 데이터를 문자열로 직렬화하세요.

이러한 수정 후, 폼 템플릿은 다음과 같이 보여야 합니다:

<docs-code header="src/app/actor-form/actor-form.component.html (excerpt)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="ngModel-2"/>

다음 사항을 알 수 있습니다:

- 각 `<input>` 요소는 `id` 속성을 가지고 있습니다.
  이는 `<label>` 요소의 `for` 속성이 레이블과 해당 입력 제어를 일치시키는 데 사용됩니다.
  이는 [표준 HTML 기능](https://developer.mozilla.org/docs/Web/HTML/Element/label)입니다.

- 각 `<input>` 요소는 Angular가 제어를 폼에 등록하는 데 사용하는 필수 `name` 속성도 있습니다.

효과를 관찰한 후, `{{ model | json }}` 텍스트 바인딩을 삭제할 수 있습니다.

## 폼 상태 추적하기

Angular는 폼이 제출된 후 `form` 요소에 `ng-submitted` 클래스를 적용합니다. 이 클래스는 폼 제출 후 폼의 스타일을 변경하는 데 사용될 수 있습니다.

## 제어 상태 추적하기

제어에 `NgModel` 지시어를 추가하면 제어의 상태를 설명하는 클래스 이름이 추가됩니다.
이 클래스는 제어의 상태에 따라 스타일을 변경하는 데 사용될 수 있습니다.

다음 표는 Angular가 제어의 상태에 따라 적용하는 클래스 이름을 설명합니다.

| 상태                             | 참일 경우 클래스  | 거짓일 경우 클래스  |
| :------------------------------- | :---------------- | :------------------ |
| 제어가 방문되었습니다.            | `ng-touched`      | `ng-untouched`      |
| 제어의 값이 변경되었습니다.       | `ng-dirty`        | `ng-pristine`       |
| 제어의 값이 유효합니다.           | `ng-valid`        | `ng-invalid`        |

Angular는 제출 시 `form` 요소에 `ng-submitted` 클래스도 적용하지만, `form` 요소 내의 제어에는 적용하지 않습니다.

이 CSS 클래스는 상태에 따라 제어의 스타일을 정의하는 데 사용됩니다.

### 제어 상태 관찰하기

프레임워크가 클래스를 추가하고 제거하는 방법을 보려면 브라우저의 개발자 도구를 열고 배우 이름을 나타내는 `<input>` 요소를 검사하세요.

1. 브라우저의 개발자 도구를 사용하여 **이름** 입력 상자에 해당하는 `<input>` 요소를 찾습니다.
   이 요소는 "form-control" 외에 여러 CSS 클래스를 포함하고 있음을 알 수 있습니다.

2. 처음으로 이를 열면, 클래스는 유효한 값을 가지고 있으며, 초기화 또는 재설정 이후 값이 변경되지 않았고, 제어가 초기화 또는 재설정 이후 방문되지 않았음을 나타냅니다.

   <docs-code language="html">

   <input class="form-control ng-untouched ng-pristine ng-valid">;

   </docs-code>

3. **이름** `<input>` 상자에서 다음 작업을 수행하고 어떤 클래스가 나타나는지 관찰합니다.

   - 보지만 만지지 않기.
     클래스는 이것이 터치되지 않았고, 순수하며, 유효하다고 나타냅니다.

   - 이름 상자 안을 클릭한 후 바깥쪽을 클릭합니다.
     이제 제어가 방문되었으며, 요소는 `ng-untouched` 클래스 대신 `ng-touched` 클래스를 가지고 있습니다.

   - 이름의 끝에 슬래시를 추가합니다.
     이제 터치되었고 더럽혀졌습니다.

   - 이름을 지웁니다.
     값이 유효하지 않게 되므로 `ng-valid` 클래스가 `ng-invalid` 클래스로 교체됩니다.

### 상태에 대한 시각적 피드백 생성하기

`ng-valid`/`ng-invalid` 쌍은 특히 흥미롭습니다. 왜냐하면 값이 유효하지 않을 때 강한 시각적 신호를 보내고 싶기 때문입니다.
필수 필드를 표시하는 것도 원합니다.

입력 상자의 왼쪽에 색 바를 사용하여 필수 필드와 유효하지 않은 데이터를 동시에 표시할 수 있습니다.

이런 식으로 모양을 바꾸려면 다음 단계를 따르세요.

1. `ng-*` CSS 클래스에 대한 정의 추가하기.
2. 이러한 클래스 정의를 새로운 `forms.css` 파일에 추가하기.
3. 새로운 파일을 프로젝트에 `index.html`의 형제로 추가합니다:

<docs-code header="src/assets/forms.css" language="css" path="adev/src/content/examples/forms/src/assets/forms.css"/>

4. `index.html` 파일에서 `<head>` 태그를 업데이트하여 새로운 스타일 시트를 포함합니다.

<docs-code header="src/index.html (styles)" path="adev/src/content/examples/forms/src/index.html" visibleRegion="styles"/>

### 유효성 검사 오류 메시지 표시 및 숨기기

**이름** 입력 상자는 필수이며, 이를 지우면 막대가 빨간색으로 변합니다.
이것은 뭔가 잘못되었음을 나타내지만, 사용자는 무엇이 잘못되었는지 또는 무엇을 해야 하는지 모릅니다.
제어 상태를 확인하고 응답하여 유용한 메시지를 제공할 수 있습니다.

**기술** 선택 상자 또한 필수이지만, 이와 같은 오류 처리가 필요하지 않습니다. 선택 상자는 이미 유효한 값으로 제한되기 때문입니다.

적절할 때 오류 메시지를 정의하고 표시하려면 다음 단계를 따르세요.

<docs-workflow>
<docs-step title="입력에 로컬 참조 추가하기">
템플릿 내에서 입력 상자의 Angular 제어를 접근할 수 있도록 할 수 있는 템플릿 참조 변수를 사용하여 `input` 태그를 확장합니다. 예제에서 변수는 `#name="ngModel"`입니다.

템플릿 참조 변수(`#name`)는 `NgModel.exportAs` 속성의 값인 `"ngModel"`으로 설정됩니다. 이 속성은 Angular에 참조 변수를 지시어에 연결하는 방법을 알려 줍니다.
</docs-step>

<docs-step title="오류 메시지 추가하기">
적절한 오류 메시지가 포함된 `<div>`를 추가합니다.
</docs-step>

<docs-step title="오류 메시지를 조건부로 만들기">
`name` 제어의 속성을 메시지 `<div>` 요소의 `hidden` 속성과 바인딩하여 오류 메시지를 표시하거나 숨깁니다.
</docs-step>

<docs-code header="src/app/actor-form/actor-form.component.html (hidden-error-msg)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="hidden-error-msg"/>

<docs-step title="이름에 조건부 오류 메시지 추가하기">
다음 예제와 같이 `name` 입력 상자에 조건부 오류 메시지를 추가합니다.

<docs-code header="src/app/actor-form/actor-form.component.html (excerpt)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="name-with-error-msg"/>
</docs-step>
</docs-workflow>

<docs-callout title='"순수" 상태 설명하기'>

이 예제에서는 제어가 유효하거나 _순수한_ 상태일 때 메시지를 숨깁니다.
순수하다는 것은 사용자가 이 폼에 표시된 이후 값이 변경되지 않았음을 의미합니다.
`pristine` 상태를 무시하면 값이 유효한 경우에만 메시지를 숨길 수 있게 됩니다.
새로운 비어 있는 배우나 잘못된 배우와 함께 이 컴포넌트에 도착하면 아무 것도 하지 않기 전에 즉시 오류 메시지가 표시됩니다.

사용자가 잘못된 변경을 할 때만 메시지가 표시되기를 원할 수 있습니다.
제어가 `pristine` 상태일 때 메시지를 숨기는 것은 이 목표를 달성합니다.
다음 단계에서 폼에 새로운 배우를 추가할 때 이 선택의 중요성을 알 수 있습니다.

</docs-callout>

## 새로운 배우 추가하기

이 연습은 사용자가 네이티브 HTML 버튼 클릭 이벤트에 응답하여 모델 데이터에 추가하는 방법을 보여줍니다.
폼 사용자가 새로운 배우를 추가할 수 있도록 **새 배우** 버튼을 추가하여 클릭 이벤트에 응답합니다.

1. 템플릿의 하단에 "새 배우" `<button>` 요소를 배치합니다.
2. 컴포넌트 파일에 배우 생성 메서드를 actor 데이터 모델에 추가합니다.

<docs-code header="src/app/actor-form/actor-form.component.ts (New Actor method)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.ts" visibleRegion="new-actor"/>

3. 버튼의 클릭 이벤트를 배우 생성 메서드인 `newActor()`에 바인딩합니다.

<docs-code header="src/app/actor-form/actor-form.component.html (New Actor button)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="new-actor-button-no-reset"/>

4. 애플리케이션을 다시 실행하고 **새 배우** 버튼을 클릭합니다.

   폼이 지워지고 입력 상자의 왼쪽에 있는 _필수_ 막대가 빨간색으로 변하여 유효하지 않은 `name` 및 `skill` 속성을 나타냅니다.
   오류 메시지가 숨겨져 있는 점에 유의하세요.
   이는 폼이 순수했기 때문입니다. 아직 아무 것도 변경하지 않았기 때문입니다.

5. 이름을 입력하고 다시 **새 배우**를 클릭합니다.

   이제 애플리케이션은 입력 상자가 더 이상 순수하지 않기 때문에 `이름은 필수입니다` 오류 메시지를 표시합니다.
   폼은 사용자가 **새 배우** 버튼을 클릭하기 전에 이름을 입력한 것을 기억합니다.

6. 폼 제어의 순수 상태를 복원하기 위해 `newActor()` 메서드를 호출한 후 폼의 `reset()` 메서드를 통해 모든 플래그를 명시적으로 지웁니다.

   <docs-code header="src/app/actor-form/actor-form.component.html (Reset the form)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="new-actor-button-form-reset"/>

   이제 **새 배우**를 클릭하면 폼과 제어 플래그가 모두 초기화됩니다.

## `ngSubmit`로 폼 제출하기

사용자는 이 폼을 채운 후 제출할 수 있어야 합니다.
폼 하단의 **제출** 버튼은 단독으로는 아무 것도 하지 않지만, 타입이 `type="submit"`이기 때문에 폼 제출 이벤트를 트리거합니다.

이 이벤트에 응답하기 위해 다음 단계를 수행합니다.

<docs-workflow>

<docs-step title="ngOnSubmit을 수신 대기하기">
폼의 [`ngSubmit`](api/forms/NgForm#properties) 이벤트 속성을 배우 폼 컴포넌트의 `onSubmit()` 메서드에 바인딩합니다.

<docs-code header="src/app/actor-form/actor-form.component.html (ngSubmit)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="ngSubmit"/>
</docs-step>

<docs-step title="비활성화 속성 바인딩하기">
템플릿 참조 변수 `#actorForm`을 사용하여 **제출** 버튼이 포함된 폼에 접근하고 이벤트 바인딩을 만듭니다.

폼의 전체 유효성을 나타내는 폼 속성을 **제출** 버튼의 `disabled` 속성에 바인딩합니다.

<docs-code header="src/app/actor-form/actor-form.component.html (submit-button)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="submit-button"/>
</docs-step>

<docs-step title="애플리케이션 실행하기">
버튼이 활성화되었음을 알 수 있습니다 —비록 아직 유용한 작업을 수행하지는 않지만요.
</docs-step>

<docs-step title="이름 값을 삭제하기">
이것은 "필수" 규칙을 위반하므로 오류 메시지를 표시합니다 — 또한 **제출** 버튼을 비활성화합니다.

버튼의 활성화 상태를 폼의 유효성과 명시적으로 연결할 필요는 없었습니다.
`FormsModule`이 이를 자동으로 수행했습니다. 강화된 폼 요소에 템플릿 참조 변수를 정의한 후 버튼 제어에서 해당 변수를 참조했습니다.
</docs-step>
</docs-workflow>

### 폼 제출에 응답하기

폼 제출에 대한 응답을 보여주기 위해, 데이터 입력 영역을 숨기고 그 자리에 다른 것을 표시할 수 있습니다.

<docs-workflow>
<docs-step title="폼 랩핑하기">
전체 폼을 `<div>`로 래핑하고 이를 `ActorFormComponent.submitted` 속성의 `hidden` 속성에 바인딩합니다.

<docs-code header="src/app/actor-form/actor-form.component.html (excerpt)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="edit-div"/>

메인 폼은 `submitted` 속성이 false인 상태이므로 처음부터 보입니다. 폼을 제출할 때까지는 false 상태를 유지하며, 이는 `ActorFormComponent`의 이 부분에서 보여줍니다:

<docs-code header="src/app/actor-form/actor-form.component.ts (submitted)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.ts" visibleRegion="submitted"/>

**제출** 버튼을 클릭하면, `submitted` 플래그가 true가 되고 폼이 사라집니다.
</docs-step>

<docs-step title="제출 상태 추가하기">
폼이 제출된 상태일 때 다른 것을 표시하기 위해, 새 `<div>` 래퍼 아래에 다음 HTML을 추가합니다.

<docs-code header="src/app/actor-form/actor-form.component.html (excerpt)" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="submitted"/>

이 `<div>`는 읽기 전용 배우를 보여주며, 보간 바인딩을 포함합니다. 컴포넌트가 제출된 상태일 때만 나타납니다.

대체 표시에는 `submitted` 플래그를 초기화하는 클릭 이벤트가 바인딩된 _편집_ 버튼이 포함됩니다.
</docs-step>

<docs-step title="편집 버튼 테스트하기">
*편집* 버튼을 클릭하여 표시를 편집 가능한 폼으로 전환하세요.
</docs-step>
</docs-workflow>

## 요약

이 페이지에서 논의된 Angular 폼은 데이터 수정, 검증 및 기타 기능을 지원하기 위해 다음 프레임워크 기능을 활용합니다.

- Angular HTML 폼 템플릿
- `@Component` 데코레이터가 있는 폼 컴포넌트 클래스
- `NgForm.ngSubmit` 이벤트 속성에 바인딩하여 폼 제출 처리하기
- `#actorForm` 및 `#name`과 같은 템플릿 참조 변수
- 양방향 데이터 바인딩을 위한 `[(ngModel)]` 문법
- 검증 및 폼 요소 변경 추적을 위한 `name` 속성의 사용
- 입력 제어에서 참조 변수의 `valid` 속성을 통해 제어가 유효한지 또는 오류 메시지를 표시해야 하는지 여부를 나타냄
- `NgForm` 유효성에 바인딩하여 **제출** 버튼의 활성화 상태 제어하기
- 유효하지 않은 제어에 대한 사용자에게 시각적 피드백을 제공하는 사용자 정의 CSS 클래스

최종 애플리케이션 버전의 코드는 다음과 같습니다:

<docs-code-multifile>
    <docs-code header="actor-form/actor-form.component.ts" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.ts" visibleRegion="final"/>
    <docs-code header="actor-form/actor-form.component.html" path="adev/src/content/examples/forms/src/app/actor-form/actor-form.component.html" visibleRegion="final"/>
    <docs-code header="actor.ts" path="adev/src/content/examples/forms/src/app/actor.ts"/>
    <docs-code header="app.module.ts" path="adev/src/content/examples/forms/src/app/app.module.ts"/>
    <docs-code header="app.component.html" path="adev/src/content/examples/forms/src/app/app.component.html"/>
    <docs-code header="app.component.ts" path="adev/src/content/examples/forms/src/app/app.component.ts"/>
    <docs-code header="main.ts" path="adev/src/content/examples/forms/src/main.ts"/>
    <docs-code header="forms.css" path="adev/src/content/examples/forms/src/assets/forms.css"/>
</docs-code-multifile>