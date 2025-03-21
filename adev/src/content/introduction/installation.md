<docs-decorative-header title="설치" imgSrc="adev/src/assets/images/what_is_angular.svg"> <!-- markdownlint-disable-line -->
</docs-decorative-header>

터미널을 사용하거나 온라인 스타터로 Angular를 빠르게 시작하십시오.

## 온라인에서 놀기

프로젝트를 설정하지 않고 브라우저에서 Angular를 가지고 놀고 싶다면, 온라인 샌드박스를 사용할 수 있습니다:

<docs-card-container>
  <docs-card title="" href="/playground" link="Playground에서 열기">
  Angular 앱을 가지고 노는 가장 빠른 방법입니다. 설정이 필요하지 않습니다.
  </docs-card>
</docs-card-container>

## 로컬에서 새 프로젝트 설정하기

새 프로젝트를 시작한다면, Git과 같은 도구를 사용할 수 있도록 로컬 프로젝트를 만들고 싶을 것입니다.

### 필수 조건

- **Node.js** - v[^18.19.1 이상](/reference/versions)
- **텍스트 편집기** - [Visual Studio Code](https://code.visualstudio.com/)를 추천합니다.
- **터미널** - Angular CLI 명령 실행을 위해 필요합니다.
- **개발 도구** - 개발 워크플로를 개선하기 위해 [Angular Language Service](/tools/language-service)를 추천합니다.

### 지침

다음 가이드는 로컬 Angular 프로젝트 설정을 안내합니다.

#### Angular CLI 설치

터미널을 열고 ([Visual Studio Code](https://code.visualstudio.com/)를 사용하는 경우 [통합 터미널](https://code.visualstudio.com/docs/editor/integrated-terminal)을 열 수 있습니다) 다음 명령을 실행합니다:

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

Windows나 Unix에서 이 명령 실행에 문제가 있는 경우, [CLI 문서](/tools/cli/setup-local#install-the-angular-cli)를 확인하십시오.

#### 새 프로젝트 만들기

터미널에서 원하는 프로젝트 이름으로 `ng new` CLI 명령을 실행합니다. 다음 예제에서는 `my-first-angular-app`라는 예제 프로젝트 이름을 사용합니다.

<docs-code language="shell">

ng new <project-name>

</docs-code>

프로젝트에 대한 몇 가지 구성 옵션이 제공됩니다. 화살표 및 Enter 키를 사용하여 원하는 옵션을 탐색하고 선택하십시오.

선호 사항이 없다면, 기본 옵션을 선택하고 설정을 계속 진행하려면 Enter 키를 누르십시오.

구성 옵션을 선택하고 CLI가 설정을 완료하면 다음 메시지를 보게 됩니다:

```shell
✔ 패키지를 성공적으로 설치하였습니다.
    git이 성공적으로 초기화되었습니다.
```

이제 로컬에서 프로젝트를 실행할 준비가 되었습니다!

#### 로컬에서 새 프로젝트 실행하기

터미널에서 새 Angular 프로젝트로 전환합니다.

<docs-code language="shell">

cd my-first-angular-app

</docs-code>

이 시점에서 모든 의존성이 설치되어 있어야 합니다(프로젝트에 `node_modules` 폴더가 존재하는지 확인하여 검증할 수 있습니다), 따라서 다음 명령을 실행하여 프로젝트를 시작할 수 있습니다:

<docs-code language="shell">

npm start

</docs-code>

모든 것이 성공적으로 완료되면 터미널에서 비슷한 확인 메시지를 보게 될 것입니다:

```shell
감시 모드가 활성화되었습니다. 파일 변경을 감시하고 있습니다...
참고: 원본 파일 크기는 개발 서버의 요청별 변환을 반영하지 않습니다.
  ➜  로컬:   http://localhost:4200/
  ➜  도움말을 보려면 h + Enter를 누르십시오.
```

이제 `Local`에 있는 경로(예: `http://localhost:4200`)를 방문하여 애플리케이션을 확인할 수 있습니다. 행복한 코딩 되세요! 🎉

## 다음 단계

이제 Angular 프로젝트를 만들었으므로, [Essential 가이드](/essentials)에서 Angular에 대해 더 배우거나 심화 가이드에서 주제를 선택할 수 있습니다!