# 헬로 월드

이 첫 번째 수업은 이 튜토리얼의 각 수업이 완전한 Angular 앱을 구축하기 위해 새로운 기능을 추가하는 출발점 역할을 합니다. 이 수업에서는 유명한 텍스트인 "Hello World"를 표시하도록 애플리케이션을 업데이트합니다.

<docs-video src="https://www.youtube.com/embed/UnOwDuliqZA?si=uML-cDRbrxmYdD_9"/>

## 당신이 배울 것

이 수업 이후에 여러분이 가지게 될 업데이트된 앱은 여러분과 여러분의 IDE가 Angular 앱을 생성할 준비가 되었음을 확인합니다.

참고: 임베디드 편집기를 사용하고 있다면 [3단계](#create-%60hello-world%60)로 건너뛰세요.
브라우저 플레이그라운드에서 작업할 때는 앱을 실행하기 위해 `ng serve`를 실행할 필요가 없습니다. `ng generate`와 같은 다른 명령은 오른쪽의 콘솔 창에서 수행할 수 있습니다.

<docs-workflow>

<docs-step title="기본 앱 다운로드">
코드 편집기 오른쪽 상단의 "다운로드" 아이콘을 클릭하여 시작하세요. 이렇게 하면 이 튜토리얼의 소스 코드가 포함된 `.zip` 파일이 다운로드됩니다. 이 파일을 로컬 터미널과 IDE에서 열고 기본 앱 테스트로 진행합니다.

튜토리얼의 어떤 단계에서도 이 아이콘을 클릭하여 단계의 소스 코드를 다운로드하고 거기에서 시작할 수 있습니다.
</docs-step>

<docs-step title="기본 앱 테스트">
이 단계에서는 기본 시작 앱을 다운로드 한 후 기본 Angular 앱을 구축합니다.
이것은 여러분의 개발 환경이 튜토리얼을 계속하기 위해 필요한 것들을 갖추었다는 것을 확인합니다.

여러분의 IDE의 **터미널** 창에서:

1. 프로젝트 디렉터리에서 `first-app` 디렉터리로 이동합니다.
1. 앱을 실행하는 데 필요한 종속성을 설치하기 위해 이 명령을 실행합니다.

    <docs-code language="shell">
    npm install
    </docs-code>

1. 기본 앱을 구축하고 제공하기 위해 이 명령을 실행합니다.

    <docs-code language="shell">
    ng serve
    </docs-code>

    앱은 오류 없이 빌드되어야 합니다.

1. 개발 컴퓨터의 웹 브라우저에서 `http://localhost:4200`을 엽니다.
1. 브라우저에 기본 웹사이트가 표시되는지 확인합니다.
1. 다음 단계를 완료하는 동안 `ng serve`를 계속 실행 상태로 둘 수 있습니다.
</docs-step>

<docs-step title="프로젝트의 파일 검토">
이 단계에서는 기본 Angular 앱을 구성하는 파일을 알아봅니다.

여러분의 IDE의 **탐색기** 창에서:

1. 프로젝트 디렉터리에서 `first-app` 디렉터리로 이동합니다.
1. 이러한 파일을 보려면 `src` 디렉터리를 엽니다.
    1. 파일 탐색기에서 Angular 앱 파일(`/src`)을 찾습니다.
        1. `index.html`은 앱의 최상위 HTML 템플릿입니다.
        1. `styles.css`는 앱의 최상위 스타일 시트입니다.
        1. `main.ts`는 앱이 실행되는 곳입니다.
        1. `favicon.ico`는 웹사이트에서 볼 수 있는 앱의 아이콘입니다.
    1. 파일 탐색기에서 Angular 앱의 컴포넌트 파일(`/app`)을 찾습니다.
        1. `app.component.ts`는 `app-root` 컴포넌트를 설명하는 소스 파일입니다.
            이는 앱의 최상위 Angular 컴포넌트입니다. 컴포넌트는 Angular 애플리케이션의 기본 구성 요소입니다.
            컴포넌트 설명에는 컴포넌트의 코드, HTML 템플릿, 스타일이 포함되며, 이는 이 파일 또는 별도의 파일에 설명될 수 있습니다.

            이 앱에서는 스타일이 별도의 파일에 있으며, 컴포넌트의 코드와 HTML 템플릿은 이 파일에 있습니다.
        1. `app.component.css`는 이 컴포넌트의 스타일 시트입니다.
        1. 새로운 컴포넌트는 이 디렉터리에 추가됩니다.
    1. 파일 탐색기에서 앱에서 사용하는 이미지가 포함된 이미지 디렉터리(`/assets`)를 찾습니다.
    1. 파일 탐색기에서 Angular 앱이 빌드되고 실행되는 데 필요한 파일과 디렉터리를 찾지만, 일반적으로 상호작용하지 않는 파일입니다.
        1. `.angular`는 Angular 앱을 빌드하는 데 필요한 파일을 포함하고 있습니다.
        1. `.e2e`는 앱 테스트에 사용되는 파일을 포함하고 있습니다.
        1. `.node_modules`는 앱에서 사용하는 node.js 패키지를 포함하고 있습니다.
        1. `angular.json`은 앱 빌드 도구에 Angular 앱을 설명합니다.
        1. `package.json`은 완료된 앱을 실행하기 위해 `npm`(node 패키지 관리자)에서 사용됩니다.
        1. `tsconfig.*`는 TypeScript 컴파일러에게 앱의 구성을 설명하는 파일입니다.

Angular 앱 프로젝트를 구성하는 파일을 검토한 후, 다음 단계로 진행하세요.
</docs-step>

<docs-step title="`Hello World` 만들기">
이 단계에서는 표시할 내용을 변경하기 위해 Angular 프로젝트 파일을 업데이트합니다.

여러분의 IDE에서:

1. `first-app/src/index.html`을 엽니다.
    참고: 이 단계와 다음 단계는 여러분의 로컬 환경에만 해당됩니다!

1. `index.html`에서 `<title>` 요소를 아래 코드로 바꿉니다.

    <docs-code header="src/index.html에서 교체" path="adev/src/content/tutorials/first-app/steps/02-HomeComponent/src/index.html" visibleLines="[5]"/>

    그런 다음 `index.html`에서 방금 변경한 내용을 저장합니다.

1. 다음으로 `first-app/src/app/app.component.ts`를 엽니다.
1. `app.component.ts`의 `@Component` 정의에서 `template` 줄을 아래 코드로 교체하여 앱 컴포넌트의 텍스트를 변경합니다.

    <docs-code header="src/app/app.component.ts에서 교체" path="adev/src/content/tutorials/first-app/steps/02-HomeComponent/src/app/app.component.ts" visibleLines="[7,9]"/>

1. `app.component.ts`의 `AppComponent` 클래스 정의에서 `title` 줄을 아래 코드로 교체하여 컴포넌트 제목을 변경합니다.

    <docs-code header="src/app/app.component.ts에서 교체" path="adev/src/content/tutorials/first-app/steps/02-HomeComponent/src/app/app.component.ts" visibleLines="[12,14]"/>

    그런 다음 `app.component.ts`에서 변경한 내용을 저장합니다.

1. 1단계에서 `ng serve` 명령을 중지한 경우, 여러분의 IDE의 **터미널** 창에서 `ng serve`를 다시 실행합니다.
1. 브라우저를 열고 `localhost:4200`으로 이동하여 앱이 오류 없이 빌드되고 앱의 제목과 본문에서 *Hello world*를 표시하는지 확인합니다:
    <img alt="텍스트 'Hello World'를 표시하는 페이지의 브라우저 프레임" src="assets/images/tutorials/first-app/homes-app-lesson-01-browser.png">
</docs-step>

</docs-workflow>

요약: 이 수업에서는 기본 Angular 앱을 업데이트하여 *Hello world*를 표시했습니다.
이 과정에서 앱을 로컬에서 테스트하기 위해 `ng serve` 명령에 대해 배웠습니다.

이 수업에서 다룬 주제에 대한 자세한 내용은 다음을 방문하세요:

<docs-pill-row>
  <docs-pill href="guide/components" title="Angular 컴포넌트"/>
  <docs-pill href="tools/cli" title="Angular CLI로 애플리케이션 만들기"/>
</docs-pill-row>