# 애플리케이션에 라우트를 추가하세요

이 튜토리얼 레슨에서는 앱에 라우트를 추가하는 방법을 보여줍니다.

<docs-video src="https://www.youtube.com/embed/r5DEBMuStPw?si=H6Bx6nLJoMLaMxkx" />

중요: 라우팅을 배우기 위해 로컬 환경을 사용하는 것이 좋습니다.

## 배울 내용

이 레슨이 끝나면 애플리케이션에서 라우팅을 지원하게 됩니다.

## 라우팅 개념 미리보기

이 튜토리얼은 Angular에서의 라우팅을 소개합니다. 라우팅은 애플리케이션의 한 구성 요소에서 다른 구성 요소로 이동할 수 있는 기능입니다. [Single Page Applications (SPA)](guide/routing)에서는 요청된 사용자 뷰를 나타내기 위해 페이지의 일부만 업데이트됩니다.

[Angular Router](guide/routing)를 사용하면 사용자가 라우트를 선언하고 애플리케이션에서 해당 라우트가 요청될 경우 어떤 구성 요소를 화면에 표시해야 할지를 지정할 수 있습니다.

이번 레슨에서는 애플리케이션에서 라우팅을 활성화하여 세부 정보 페이지로 이동할 수 있도록 합니다.

<docs-workflow>

<docs-step title="기본 세부정보 구성 요소 만들기">
1. 터미널에서 다음 명령어를 입력하여 `DetailsComponent`를 생성합니다:

    <docs-code language="shell">
    ng generate component details
    </docs-code>

    이 구성 요소는 주어진 주거 위치에 대한 추가 정보를 제공하는 세부 정보 페이지를 나타냅니다.
</docs-step>

<docs-step title="애플리케이션에 라우팅 추가하기">
1. `src/app` 디렉토리에서 `routes.ts`라는 파일을 만듭니다. 이 파일에서 애플리케이션의 라우트를 정의할 것입니다.

1. `main.ts`에서 애플리케이션에서 라우팅을 활성화하기 위해 다음 업데이트를 수행합니다:
    1. 라우트 파일과 `provideRouter` 함수를 가져옵니다:

        <docs-code header="src/main.ts에서 라우팅 세부정보 가져오기" path="adev/src/content/tutorials/first-app/steps/11-details-page/src/main.ts" visibleLines="[7,8]"/>

    1. 라우팅 구성을 포함하도록 `bootstrapApplication` 호출을 업데이트합니다:

        <docs-code header="src/main.ts에 라우터 구성 추가하기" path="adev/src/content/tutorials/first-app/steps/11-details-page/src/main.ts" visibleLines="[10,17]"/>

1. `src/app/app.component.ts`에서 라우팅을 사용하도록 구성 요소를 업데이트합니다:
    1. `RoutingModule`에 대한 파일 수준 가져오기를 추가합니다:

        <docs-code header="src/app/app.component.ts에서 RouterModule 가져오기" path="adev/src/content/tutorials/first-app/steps/11-details-page/src/app/app.component.ts" visibleLines="[3]"/>

    1. `@Component` 메타데이터 가져오기에 `RouterModule`을 추가합니다:

        <docs-code header="src/app/app.component.ts에서 RouterModule 가져오기" path="adev/src/content/tutorials/first-app/steps/11-details-page/src/app/app.component.ts" visibleLines="[7]"/>

    1. `template` 속성에서 `<app-home></app-home>` 태그를 `<router-outlet>` 지시문으로 교체하고 홈페이지로 돌아가는 링크를 추가합니다. 귀하의 코드는 다음 코드와 일치해야 합니다:

        <docs-code header="src/app/app.component.ts에 router-outlet 추가하기" path="adev/src/content/tutorials/first-app/steps/11-details-page/src/app/app.component.ts" visibleLines="[8,18]"/>

</docs-step>

<docs-step title="새 구성 요소에 라우트 추가하기">
이전 단계에서는 템플릿에서 `<app-home>` 구성 요소에 대한 참조를 제거했습니다. 이번 단계에서는 해당 구성 요소에 새 라우트를 추가합니다.

1. `routes.ts`에서 라우트를 생성하기 위해 다음 업데이트를 수행합니다.
    1. 라우트 정의에 사용할 `HomeComponent`, `DetailsComponent` 및 `Routes` 유형에 대한 파일 수준 가져오기를 추가합니다.

        <docs-code header="구성 요소 및 Routes 가져오기" path="adev/src/content/tutorials/first-app/steps/11-details-page/src/app/routes.ts" visibleLines="[1,3]"/>

    1. `Routes` 유형의 `routeConfig`라는 변수를 정의하고 앱을 위한 두 개의 라우트를 정의합니다:
        <docs-code header="앱에 라우트 추가하기" path="adev/src/content/tutorials/first-app/steps/11-details-page/src/app/routes.ts" visibleLines="[5,18]"/>

        `routeConfig` 배열의 항목은 애플리케이션의 라우트를 나타냅니다. 첫 번째 항목은 URL이 `''`에 일치할 때마다 `HomeComponent`로 이동합니다. 두 번째 항목은 향후 레슨에서 다시 다룰 특별한 형식을 사용합니다.

1. 모든 변경 사항을 저장하고 애플리케이션이 브라우저에서 작동하는지 확인합니다. 애플리케이션은 여전히 주거 위치 목록을 표시해야 합니다.
</docs-step>

</docs-workflow>

요약: 이번 레슨에서는 애플리케이션에서 라우팅을 활성화하고 새로운 라우트를 정의했습니다. 이제 귀하의 앱은 뷰 간 탐색을 지원할 수 있습니다. 다음 레슨에서는 주어진 주거 위치에 대한 "세부정보" 페이지로 이동하는 방법을 배웁니다.

귀하의 앱에서 큰 진전을 이루고 있습니다. 잘하고 계십니다.

이번 레슨에서 다룬 주제에 대한 자세한 정보를 보려면 방문하세요:

<docs-pill-row>
  <docs-pill href="guide/routing" title="Angular에서의 라우팅 개요"/>
  <docs-pill href="guide/routing/common-router-tasks" title="일반 라우팅 작업"/>
</docs-pill-row>