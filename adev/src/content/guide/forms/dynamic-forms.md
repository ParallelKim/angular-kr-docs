# 동적 양식 구축

설문지와 같은 많은 양식은 형식과 의도가 매우 유사할 수 있습니다.
이러한 양식의 다양한 버전을 생성하는 데 더 빠르고 쉽게 만들기 위해 비즈니스 개체 모델을 설명하는 메타데이터를 기반으로 하는 _동적 양식 템플릿_을 생성할 수 있습니다.
그런 다음, 데이터 모델의 변경 사항에 따라 새 양식을 자동으로 생성하기 위해 템플릿을 사용합니다.

이 기술은 내용이 자주 변경되어야 하는 양식 유형이 있을 때 특히 유용합니다. 
일반적인 사용 사례는 설문지입니다.
사용자로부터 다양한 맥락에서 입력을 받아야 할 수 있습니다.
사용자가 보는 양식의 형식과 스타일은 일정하게 유지되어야 하지만, 실제로 질문해야 하는 내용은 맥락에 따라 달라집니다.

이번 튜토리얼에서는 기본 설문지를 제공하는 동적 양식을 구축합니다.
취업을 원하는 영웅들에 대한 온라인 응용 프로그램을 만듭니다.
이 기관은 계속해서 신청 프로세스를 수정하고 있지만, 동적 양식을 사용함으로써 애플리케이션 코드를 변경하지 않고도 즉석에서 새 양식을 생성할 수 있습니다.

튜토리얼은 다음 단계를 안내합니다.

1. 프로젝트에 대한 반응형 양식 활성화.
1. 양식 컨트롤을 나타내기 위한 데이터 모델 설정.
1. 모델에 샘플 데이터로 채우기.
1. 양식 컨트롤을 동적으로 생성하기 위한 컴포넌트 개발.

당신이 생성한 양식은 사용자 경험을 개선하기 위해 입력 유효성 검사 및 스타일링을 사용합니다.
모든 사용자 입력이 유효할 때만 활성화되는 제출 버튼이 있으며, 색상 코드 및 오류 메시지로 잘못된 입력을 표시합니다.

기본 버전은 더 다양한 질문을 지원하고, 더 우아하게 렌더링하며, 우수한 사용자 경험을 제공하기 위해 발전할 수 있습니다.

## 프로젝트에 대한 반응형 양식 활성화

동적 양식은 반응형 양리를 기반으로 합니다.

응용 프로그램이 반응형 양식 지시문에 접근할 수 있도록 필수 구성 요소에 `@angular/forms` 라이브러리에서 `ReactiveFormsModule`을 가져옵니다.

예제에서 다음 코드는 루트 모듈 설정을 보여줍니다.

<docs-code-multifile>
    <docs-code header="dynamic-form.component.ts" path="adev/src/content/examples/dynamic-form/src/app/dynamic-form.component.ts"/>
    <docs-code header="dynamic-form-question.component.ts" path="adev/src/content/examples/dynamic-form/src/app/dynamic-form-question.component.ts"/>
</docs-code-multifile>

## 양식 객체 모델 만들기

동적 양식은 양식 기능에 필요한 모든 시나리오를 설명할 수 있는 객체 모델이 필요합니다.
예제 영웅 신청 양식은 질문의 집합으로 구성되며 — 즉, 양식의 각 컨트롤은 질문을 하고 답변을 받아야 합니다.

이 유형의 양식에 대한 데이터 모델은 질문을 나타내야 합니다.
예제에는 모델의 기본 객체로 질문을 정의하는 `DynamicFormQuestionComponent`가 포함되어 있습니다.

다음 `QuestionBase`는 질문과 그 답변을 양식에 나타낼 수 있는 컨트롤 집합을 위한 기본 클래스입니다.

<docs-code header="src/app/question-base.ts" path="adev/src/content/examples/dynamic-form/src/app/question-base.ts"/>

### 컨트롤 클래스 정의

이 기본 클래스에서 예제는 `TextboxQuestion` 및 `DropdownQuestion`의 두 개의 새로운 클래스를 파생시켜 서로 다른 컨트롤 유형을 나타냅니다.
다음 단계에서 양식 템플릿을 만들 때 이러한 특정 질문 유형을 인스턴스화하여 적절한 컨트롤을 동적으로 렌더링합니다.

`TextboxQuestion` 컨트롤 유형은 `<input>` 요소를 사용하여 양식 템플릿에 나타냅니다. 질문을 제시하고 사용자가 입력할 수 있도록 합니다. 요소의 `type` 속성은 `options` 인수에 지정된 `type` 필드를 기반으로 정의됩니다(예: `text`, `email`, `url`).

<docs-code header="question-textbox.ts" path="adev/src/content/examples/dynamic-form/src/app/question-textbox.ts"/>

`DropdownQuestion` 컨트롤 유형은 선택 상자에서 선택 목록을 제시합니다.

<docs-code header="question-dropdown.ts" path="adev/src/content/examples/dynamic-form/src/app/question-dropdown.ts"/>

### 양식 그룹 구성

동적 양식은 양식 모델을 기반으로 입력 컨트롤의 그룹 세트를 만들기 위해 서비스를 사용합니다.
다음 `QuestionControlService`는 질문 모델에서 메타데이터를 소비하는 여러 `FormGroup` 인스턴스를 수집합니다.
기본값 및 유효성 검사 규칙을 지정할 수 있습니다.

<docs-code header="src/app/question-control.service.ts" path="adev/src/content/examples/dynamic-form/src/app/question-control.service.ts"/>

## 동적 양식 내용 구성하기

동적 양식 자체는 나중에 추가할 컨테이너 컴포넌트로 표시됩니다.
각 질문은 양식 컴포넌트의 템플릿에서 `<app-question>` 태그로 표시되며, 이는 `DynamicFormQuestionComponent`의 인스턴스와 일치합니다.

`DynamicFormQuestionComponent`는 데이터 바인딩된 질문 객체의 값에 기반하여 개별 질문의 세부정보를 렌더링하는 책임을 집니다.
양식은 템플릿 HTML을 기본 컨트롤 객체와 연결하는 [`[formGroup]` 지시문](api/forms/FormGroupDirective "API reference")에 의존합니다.
`DynamicFormQuestionComponent`는 양식 그룹을 생성하고 질문 모델에 정의된 컨트롤로 채우며, 표시 및 유효성 검사 규칙을 지정합니다.

<docs-code-multifile>
  <docs-code header="dynamic-form-question.component.html" path="adev/src/content/examples/dynamic-form/src/app/dynamic-form-question.component.html"/>
  <docs-code header="dynamic-form-question.component.ts" path="adev/src/content/examples/dynamic-form/src/app/dynamic-form-question.component.ts"/>
</docs-code-multifile>

`DynamicFormQuestionComponent`의 목표는 모델에 정의된 질문 유형을 나타내는 것입니다.
이 시점에서 질문 유형은 두 가지에 불과하지만, 훨씬 더 많은 질문 유형을 상상할 수 있습니다.
템플릿의 `ngSwitch` 문은 표시할 질문 유형을 결정합니다.
스위치는 [`formControlName`](api/forms/FormControlName "FormControlName directive API reference") 및 [`formGroup`](api/forms/FormGroupDirective "FormGroupDirective API reference") 선택기가 포함된 지시문을 사용합니다.
두 지시문은 `ReactiveFormsModule`에 정의되어 있습니다.

### 데이터 제공

개별 양식을 빌드하기 위한 특정 질문 세트를 제공하기 위해 또 다른 서비스가 필요합니다.
이번 연습에서는 하드코딩된 샘플 데이터에서 이 질문 배열을 제공할 `QuestionService`를 생성합니다.
실제 애플리케이션에서는 서비스가 백엔드 시스템에서 데이터를 가져올 수 있습니다.
그러나 핵심은 `QuestionService`에서 반환된 객체를 통해 영웅 구직 질문을 완전히 제어할 수 있다는 것입니다.
요구 사항이 변경됨에 따라 설문지를 유지 관리하려면 `questions` 배열에서 객체를 추가, 업데이트 및 제거하기만 하면 됩니다.

`QuestionService`는 `@Input()` 질문에 바인딩된 형태로 질문 세트를 제공합니다.

<docs-code header="src/app/question.service.ts" path="adev/src/content/examples/dynamic-form/src/app/question.service.ts"/>

## 동적 양식 템플릿 만들기

`DynamicFormComponent` 컴포넌트는 진입점이자 양식의 주요 컨테이너로, 템플릿에서 `<app-dynamic-form>`을 사용하여 표현됩니다.

`DynamicFormComponent` 컴포넌트는 각 질문을 `DynamicFormQuestionComponent`와 일치하는 `<app-question>` 요소에 바인딩하여 질문 목록을 제공합니다.

<docs-code-multifile>
    <docs-code header="dynamic-form.component.html" path="adev/src/content/examples/dynamic-form/src/app/dynamic-form.component.html"/>
    <docs-code header="dynamic-form.component.ts" path="adev/src/content/examples/dynamic-form/src/app/dynamic-form.component.ts"/>
</docs-code-multifile>

### 양식 표시하기

동적 양식의 인스턴스를 표시하기 위해 `AppComponent` 셸 템플릿은 `QuestionService`에서 반환된 `questions` 배열을 양식 컨테이너 컴포넌트 `<app-dynamic-form>`에 전달합니다.

<docs-code header="app.component.ts" path="adev/src/content/examples/dynamic-form/src/app/app.component.ts"/>

모델과 데이터의 분리는 질문 객체 모델과 호환되는 한 모든 유형의 설문조사를 위해 컴포넌트를 재사용할 수 있게 합니다.

### 유효한 데이터 보장

양식 템플릿은 특정 질문에 대한 하드코딩된 가정을 하지 않고 메타데이터의 동적 데이터 바인딩을 사용하여 양식을 렌더링합니다.
제어 메타데이터와 유효성 검사 기준을 동적으로 추가합니다.

유효한 입력을 보장하기 위해 _저장_ 버튼은 양식이 유효한 상태가 될 때까지 비활성화됩니다.
양식이 유효할 때 _저장_을 클릭하면 애플리케이션이 현재 양식 값을 JSON 형식으로 렌더링합니다.

다음 그림은 최종 양식을 보여줍니다.

<img alt="Dynamic-Form" src="assets/images/guide/dynamic-form/dynamic-form.png">

## 다음 단계

<docs-pill-row>
  <docs-pill title="양식 입력 유효성 검사" href="guide/forms/reactive-forms#validating-form-input" />
  <docs-pill title="양식 유효성 검사 가이드" href="guide/forms/form-validation" />
</docs-pill-row>