# 애플리케이션의 HousingLocation 컴포넌트 만들기

이 튜토리얼 수업에서는 `HousingLocation` 컴포넌트를 Angular 앱에 추가하는 방법을 보여줍니다.

<docs-video src="https://www.youtube.com/embed/R0nRX8jD2D0?si=U4ONEbPvtptdUHTt&amp;start=440"/>

## 배울 내용

* 앱에 새로운 컴포넌트인 `HousingLocationComponent`가 추가되며, 이 컴포넌트가 애플리케이션에 추가되었음을 확인하는 메시지를 표시합니다.

<docs-workflow>

<docs-step title="`HousingLocationComponent` 만들기">
이 단계에서는 앱용으로 새로운 컴포넌트를 생성합니다.

**터미널** 창에서 IDE:

1. 프로젝트 디렉토리에서 `first-app` 디렉토리로 이동하세요.

1. 새로운 `HousingLocationComponent`를 생성하기 위해 다음 명령어를 실행합니다.

    <docs-code language="shell">
    ng generate component housingLocation
    </docs-code>

1. 앱을 빌드하고 제공하기 위해 다음 명령어를 실행하세요.

    <docs-code language="shell">
    ng serve
    </docs-code>

    주의: 이 단계는 로컬 환경에서만 해당됩니다!

1. 브라우저를 열고 `http://localhost:4200`으로 이동하여 애플리케이션을 찾습니다.
1. 앱이 오류 없이 빌드되었는지 확인합니다.

    도움이 됩니다: 새로운 컴포넌트를 추가했지만 앱의 템플릿에는 아직 포함되지 않았기 때문에 이전 수업과 동일하게 렌더링되어야 합니다.

1. 다음 단계를 완료하는 동안 `ng serve`를 계속 실행합니다.
</docs-step>

<docs-step title="새 컴포넌트를 앱의 레이아웃에 추가하기">
이 단계에서는 새 컴포넌트인 `HousingLocationComponent`를 앱의 `HomeComponent`에 추가하여 앱의 레이아웃에 표시되도록 합니다.

**편집** 창에서 IDE:

1. 편집기에서 `home.component.ts`를 엽니다.
1. `home.component.ts`에서 다음 줄을 파일 레벨의 import에 추가하여 `HousingLocationComponent`를 가져옵니다.

    <docs-code header="src/app/home/home.component.ts에서 HousingLocationComponent 가져오기" path="adev/src/content/tutorials/first-app/steps/04-interfaces/src/app/home/home.component.ts" visibleLines="[3]"/>

1. 다음으로, `@Component` 메타데이터의 `imports` 속성을 업데이트하고 `HousingLocationComponent`를 배열에 추가합니다.

    <docs-code header="src/app/home/home.component.ts의 imports 배열에 HousingLocationComponent 추가" path="adev/src/content/tutorials/first-app/steps/04-interfaces/src/app/home/home.component.ts" visibleLines="[7]"/>

1. 이제 컴포넌트는 `HomeComponent`의 템플릿에서 사용할 준비가 되었습니다. `@Component` 메타데이터의 `template` 속성을 업데이트하여 `<app-housing-location>` 태그에 대한 참조를 포함합니다.

    <docs-code header="src/app/home/home.component.ts의 컴포넌트 템플릿에 주택 위치 추가" path="adev/src/content/tutorials/first-app/steps/04-interfaces/src/app/home/home.component.ts" visibleLines="[8,18]"/>

</docs-step>

<docs-step title="컴포넌트 스타일 추가하기">
이 단계에서는 앱이 제대로 렌더링되도록 하기 위해 `HousingLocationComponent`에 대한 미리 작성된 스타일을 앱에 복사합니다.

1. `src/app/housing-location/housing-location.component.css`를 열고 아래 스타일을 파일에 붙여넣습니다:

    주의: 브라우저에서는 이것이 `src/app/housing-location/housing-location.component.ts`의 `styles` 배열에 포함될 수 있습니다.

    <docs-code header="src/app/housing-location/housing-location.component.css에서 주택 위치에 CSS 스타일 추가" path="adev/src/content/tutorials/first-app/steps/04-interfaces/src/app/housing-location/housing-location.component.css"/>

1. 코드를 저장하고 브라우저로 돌아가서 앱이 오류 없이 빌드되는지 확인합니다. "housing-location works!"라는 메시지가 화면에 렌더링되어야 합니다. 다음 단계로 진행하기 전에 모든 오류를 수정하세요.

    <img alt="로고, 필터 텍스트 입력 상자, 검색 버튼 및 'housing-location works!'라는 메시지를 표시하는 homes-app의 브라우저 프레임" src="assets/images/tutorials/first-app/homes-app-lesson-03-step-2.png">

</docs-step>

</docs-workflow>

요약: 이 수업에서는 앱을 위한 새로운 컴포넌트를 생성하고 이를 앱의 레이아웃에 추가했습니다.