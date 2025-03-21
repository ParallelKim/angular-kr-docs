# 홈 컴포넌트 만들기

이 튜토리얼 수업에서는 Angular 앱을 위한 새로운 [컴포넌트](guide/components)를 만드는 방법을 보여줍니다.

<docs-video src="https://www.youtube.com/embed/R0nRX8jD2D0?si=OMVaw71EIa44yIOJ"/>

## 당신이 배울 내용

당신의 앱에는 새로운 컴포넌트인 `HomeComponent`가 포함됩니다.

## Angular 컴포넌트의 개념적 미리보기

Angular 앱은 컴포넌트를 중심으로 구축되며, 이는 Angular의 구성 요소입니다.
컴포넌트는 앱 내 요소의 기능과 외관을 제공하는 코드, HTML 레이아웃 및 CSS 스타일 정보를 포함합니다.
Angular에서는 컴포넌트가 다른 컴포넌트를 포함할 수 있습니다. 앱의 기능과 외관은 컴포넌트로 나누어지고 구분될 수 있습니다.

Angular에서 컴포넌트는 속성을 정의하는 메타데이터를 가집니다.
`HomeComponent`를 만들 때 이러한 속성을 사용합니다:

* `selector`: Angular가 템플릿에서 컴포넌트를 참조하는 방법을 설명합니다.
* `standalone`: 컴포넌트가 `NgModule`을 필요로 하는지 여부를 설명합니다.
* `imports`: 컴포넌트의 종속성을 설명합니다.
* `template`: 컴포넌트의 HTML 마크업 및 레이아웃을 설명합니다.
* `styleUrls`: 컴포넌트가 사용하는 CSS 파일의 URL을 배열로 나열합니다.

<docs-pill-row>
  <docs-pill href="api/core/Component" title="컴포넌트에 대해 더 알아보세요"/>
</docs-pill-row>

<docs-workflow>

<docs-step title="`HomeComponent` 만들기">
이 단계에서는 앱을 위한 새로운 컴포넌트를 생성합니다.

**터미널** 패널에서:

1. 프로젝트 디렉토리에서 `first-app` 디렉토리로 이동합니다.
1. 새로운 `HomeComponent`를 만들기 위해 이 명령어를 실행합니다.

    <docs-code language="shell">
    ng generate component home
    </docs-code>

1. 앱을 빌드하고 제공합니다.

    주의: 이 단계는 로컬 환경에서만 해당됩니다!

    <docs-code language="shell">
    ng serve
    </docs-code>

1. 브라우저를 열고 `http://localhost:4200`으로 이동하여 애플리케이션을 찾아보세요.

1. 앱이 오류 없이 빌드되는지 확인합니다.

    도움이 되는 정보: 새 컴포넌트를 추가했지만 아직 앱의 템플릿에 포함하지 않았기 때문에 이전 수업에서와 동일하게 렌더링되어야 합니다.

1. 다음 단계를 완료하는 동안 `ng serve`가 계속 실행되도록 합니다.
</docs-step>

<docs-step title="앱 레이아웃에 새로운 컴포넌트 추가하기">
이 단계에서는 앱의 루트 컴포넌트인 `AppComponent`에 새로운 컴포넌트인 `HomeComponent`를 추가하여 앱의 레이아웃에 표시합니다.

**편집** 패널에서:

1. `app.component.ts`를 편집기에서 엽니다.
1. `app.component.ts`에서 파일 수준의 import에 이 줄을 추가하여 `HomeComponent`를 가져옵니다.

    <docs-code header="src/app/app.component.ts에서 HomeComponent 가져오기" path="adev/src/content/tutorials/first-app/steps/03-HousingLocation/src/app/app.component.ts" visibleLines="[2]"/>

1. `app.component.ts` 내의 `@Component`에서 `imports` 배열 속성을 업데이트하고 `HomeComponent`를 추가합니다.

    <docs-code header="src/app/app.component.ts에서 교체하기" path="adev/src/content/tutorials/first-app/steps/03-HousingLocation/src/app/app.component.ts" visibleLines="[7]"/>

1. `app.component.ts` 내의 `@Component`에서 `template` 속성을 업데이트하여 다음 HTML 코드를 포함합니다.

    <docs-code header="src/app/app.component.ts에서 교체하기" path="adev/src/content/tutorials/first-app/steps/03-HousingLocation/src/app/app.component.ts" visibleLines="[8,17]"/>

1. `app.component.ts`의 변경 사항을 저장합니다.
1. `ng serve`가 실행 중이면 앱이 업데이트되어야 합니다.
    만약 `ng serve`가 실행 중이 아니라면 다시 시작합니다.
    당신의 앱 내의 *Hello world*는 `HomeComponent`에서 *home works!*로 변경되어야 합니다.
1. 브라우저에서 실행 중인 앱을 확인하고 앱이 업데이트되었는지 확인합니다.

    <img alt="페이지에 'home works!'라는 텍스트가 표시된 브라우저 프레임" src="assets/images/tutorials/first-app/homes-app-lesson-02-step-2.png">

</docs-step>

<docs-step title="`HomeComponent`에 기능 추가하기">

이 단계에서는 `HomeComponent`에 기능을 추가합니다.

이전 단계에서는 기본 `HomeComponent`를 앱의 템플릿에 추가하여 기본 HTML이 앱에 나타나게 했습니다.
이번 단계에서는 이후 수업에서 사용될 검색 필터 및 버튼을 추가합니다.
현재로서는 `HomeComponent`가 가진 모든 내용입니다.
이 단계에서는 기능 없이 레이아웃에 검색 요소만 추가됩니다.

**편집** 패널에서:

1. `first-app` 디렉토리에서 `home.component.ts`를 편집기에서 엽니다.
1. `home.component.ts`의 `@Component` 내에서 `template` 속성을 다음 코드로 업데이트합니다.

    <docs-code header="src/app/home/home.component.ts에서 교체하기" path="adev/src/content/tutorials/first-app/steps/03-HousingLocation/src/app/home/home.component.ts" visibleLines="[8,15]"/>

1. 다음으로 `home.component.css`를 편집기에서 열고 이 스타일로 내용을 업데이트합니다.

    주의: 브라우저에서 이들은 `src/app/home/home.component.ts`의 `styles` 배열에 포함될 수 있습니다.

    <docs-code header="src/app/home/home.component.css에서 교체하기" path="adev/src/content/tutorials/first-app/steps/03-HousingLocation/src/app/home/home.component.css"/>

1. 앱이 오류 없이 빌드되는지 확인합니다.
    앱 내에서 필터 쿼리 박스와 버튼을 찾아야 하며 스타일이 적용되어 있어야 합니다.
    다음 단계로 진행하기 전에 오류를 수정합니다.

    <img alt="로고, 필터 텍스트 입력 박스 및 검색 버튼이 표시된 homes-app의 브라우저 프레임" src="assets/images/tutorials/first-app/homes-app-lesson-02-step-3.png">
</docs-step>

</docs-workflow>

요약: 이 수업에서는 앱을 위한 새로운 컴포넌트를 만들고 필터 편집 제어 및 버튼을 추가했습니다.

이 수업에서 다룬 주제에 대한 자세한 내용은 다음을 방문하세요:

<docs-pill-row>
  <docs-pill href="cli/generate/component" title="`ng generate component`"/>
  <docs-pill href="api/core/Component" title="`Component` 참조"/>
  <docs-pill href="guide/components" title="Angular 컴포넌트 개요"/>
</docs-pill-row>