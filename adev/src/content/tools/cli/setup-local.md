# 로컬 환경 및 작업 공간 설정

이 가이드는 [Angular CLI](cli "CLI 명령어 참조")를 사용하여 Angular 개발을 위한 환경을 설정하는 방법을 설명합니다.
이 가이드는 CLI 설치, 초기 작업 공간 및 시작 앱 생성, 앱을 로컬에서 실행하여 설정을 확인하는 방법에 대한 정보를 포함합니다.

<docs-callout title="로컬 설정 없이 Angular 사용해 보기">

Angular가 처음이라면, 브라우저에서 Angular의 필수 요소를 소개하는 [지금 시도해 보기!](tutorials/learn-angular)로 시작하는 것이 좋습니다.
이 독립형 튜토리얼은 온라인 개발을 위한 대화형 [StackBlitz](https://stackblitz.com) 환경을 활용합니다.
준비가 될 때까지 로컬 환경을 설정할 필요가 없습니다.

</docs-callout>

## 시작하기 전에

Angular CLI를 사용하려면 다음 사항에 익숙해야 합니다:

<docs-pill-row>
  <docs-pill href="https://developer.mozilla.org/docs/Web/JavaScript/A_re-introduction_to_JavaScript" title="JavaScript"/>
  <docs-pill href="https://developer.mozilla.org/docs/Learn/HTML/Introduction_to_HTML" title="HTML"/>
  <docs-pill href="https://developer.mozilla.org/docs/Learn/CSS/First_steps" title="CSS"/>
</docs-pill-row>

또한 명령줄 인터페이스(CLI) 도구의 사용에 익숙하고 명령 셸에 대한 일반적인 이해가 있어야 합니다.
[TypeScript](https://www.typescriptlang.org)에 대한 지식이 있으면 도움이 되지만 필수는 아닙니다.

## 의존성

로컬 시스템에 Angular CLI를 설치하려면 [Node.js](https://nodejs.org/)를 설치해야 합니다.
Angular CLI는 Node와 그에 연결된 패키지 관리자 npm을 사용하여 브라우저 외부에서 JavaScript 도구를 설치하고 실행합니다.

[Node.js 다운로드 및 설치](https://nodejs.org/en/download)하면 `npm` CLI도 포함됩니다.
Angular는 [활성 LTS 또는 유지 관리 LTS](https://nodejs.org/en/about/previous-releases) 버전의 Node.js를 요구합니다.
자세한 내용은 [Angular 버전 호환성](reference/versions) 가이드를 참조하세요.

## Angular CLI 설치

Angular CLI를 설치하려면 터미널 창을 열고 다음 명령어를 실행하세요:

<docs-code-multifile>
   <docs-code
     header="npm"
     >
     npm install -g @angular/cli
     </docs-code>
   <docs-code
     header="pnpm"
     >
     pnpm install -g @angular/cli
     </docs-code>
   <docs-code
     header="yarn"
     >
     yarn global add @angular/cli
     </docs-code>
   <docs-code
     header="bun"
     >
     bun install -g @angular/cli
     </docs-code>

 </docs-code-multifile>

### PowerShell 실행 정책

Windows 클라이언트 컴퓨터에서는 기본적으로 PowerShell 스크립트 실행이 비활성화되어 있으므로 위 명령어가 오류와 함께 실패할 수 있습니다.
npm 글로벌 바이너리 실행에 필요한 PowerShell 스크립트 실행을 허용하려면 다음 <a href="https://docs.microsoft.com/powershell/module/microsoft.powershell.core/about/about_execution_policies">실행 정책</a>을 설정해야 합니다:

<docs-code language="sh">

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

</docs-code>

명령어 실행 후 표시된 메시지를 주의 깊게 읽고 지시에 따르세요. 실행 정책 설정의 의미를 이해하는 것이 중요합니다.

### Unix 권한

일부 유닉스와 유사한 설정에서는 글로벌 스크립스가 루트 사용자에 의해 소유될 수 있으므로 위 명령어가 권한 오류로 실패할 수 있습니다.
`sudo`를 사용하여 루트 사용자로 명령어를 실행하고 요청 시 비밀번호를 입력하세요:

<docs-code-multifile>
   <docs-code
     header="npm"
     >
     sudo npm install -g @angular/cli
     </docs-code>
   <docs-code
     header="pnpm"
     >
     sudo pnpm install -g @angular/cli
     </docs-code>
   <docs-code
     header="yarn"
     >
     sudo yarn global add @angular/cli
     </docs-code>
   <docs-code
     header="bun"
     >
     sudo bun install -g @angular/cli
     </docs-code>

 </docs-code-multifile>

루트 사용자로 명령을 실행하는 것의 의미를 이해하는 것이 중요합니다.

## 작업 공간 및 초기 애플리케이션 생성

Angular **작업 공간**의 맥락에서 앱을 개발합니다.

새 작업 공간과 초기 시작 앱을 만들려면 CLI 명령 `ng new`를 실행하고 `my-app`이라는 이름을 제공하면 됩니다. 다음과 같이 입력한 후 포함할 기능에 대한 프롬프트에 답하세요:

<docs-code language="shell">

ng new my-app

</docs-code>

Angular CLI는 필요한 Angular npm 패키지 및 기타 의존성을 설치합니다.
이 작업은 몇 분 정도 걸릴 수 있습니다.

CLI는 새 작업 공간을 만들고 동일한 이름의 새 디렉토리에 소규모 환영 앱을 생성하여 실행할 준비를 합니다.
새 디렉토리로 이동하여 이후 명령이 이 작업 공간을 사용하도록 합니다.

<docs-code language="shell">

cd my-app

</docs-code>

## 애플리케이션 실행

Angular CLI에는 애플리케이션을 로컬에서 빌드하고 제공하기 위한 개발 서버가 포함되어 있습니다. 다음 명령어를 실행하세요:

<docs-code language="shell">

ng serve --open

</docs-code>

`ng serve` 명령어는 서버를 시작하고 파일을 감시하며, 파일에 변경 사항이 있을 때 앱을 다시 빌드하고 브라우저를 다시 로드합니다.

`--open` (또는 `-o`) 옵션은 브라우저를 `http://localhost:4200/`로 자동으로 열어 생성된 애플리케이션을 볼 수 있게 합니다.

## 작업 공간 및 프로젝트 파일

[`ng new`](cli/new) 명령어는 [Angular 작업 공간](reference/configs/workspace-config) 폴더를 생성하고 그 안에 새로운 애플리케이션을 생성합니다.
작업 공간은 여러 개의 애플리케이션과 라이브러리를 포함할 수 있습니다.
[`ng new`](cli/new) 명령어로 생성된 초기 애플리케이션은 작업 공간의 루트 디렉토리에 있습니다.
기존 작업 공간에서 추가 애플리케이션이나 라이브러리를 생성하면 기본적으로 `projects/` 하위 폴더에 들어갑니다.

새로 생성된 애플리케이션에는 루트 컴포넌트와 템플릿의 소스 파일이 포함됩니다.
각 애플리케이션에는 구성 요소, 데이터 및 자산이 포함된 `src` 폴더가 있습니다.

생성된 파일을 직접 수정하거나 CLI 명령어를 사용하여 추가 및 수정할 수 있습니다.
[`ng generate`](cli/generate) 명령어를 사용하여 추가 구성 요소, 지시자, 파이프, 서비스 등을 위한 새로운 파일을 추가하세요.
[`ng add`](cli/add) 및 [`ng generate`](cli/generate)와 같은 명령어는 애플리케이션과 라이브러리를 생성하거나 조작하며, 작업 공간 내에서 실행되어야 합니다. 반대로, `ng new`와 같은 명령어는 새로운 작업 공간을 생성하므로 작업 공간 외부에서 실행되어야 합니다.

## 다음 단계

* 생성된 작업 공간의 [파일 구조](reference/configs/file-structure) 및 [구성](reference/configs/workspace-config)에 대해 자세히 알아보세요.

* [`ng test`](cli/test)로 새로운 애플리케이션을 테스트하세요.

* [`ng generate`](cli/generate)로 구성 요소, 지시자, 파이프와 같은 보일러플레이트를 생성하세요.

* [`ng deploy`](cli/deploy)로 새로운 애플리케이션을 배포하고 실제 사용자에게 제공하세요.

* [`ng e2e`](cli/e2e)로 애플리케이션의 엔드투엔드 테스트를 설정하고 실행하세요.