# 앱 쉘 패턴

[앱 쉘 패턴](https://developer.chrome.com/blog/app-shell)은 빌드 시 라우트를 사용하여 애플리케이션의 일부를 렌더링하는 방법입니다.
브라우저가 전체 클라이언트 버전을 다운로드하고 코드를 로드한 후 자동으로 전환하는 동안 정적 렌더링 페이지(모든 페이지에 공통적인 스켈레톤)를 빠르게 시작함으로써 사용자 경험을 향상시킬 수 있습니다.

이것은 사용자가 애플리케이션의 의미 있는 첫 번째 페인트를 빨리 볼 수 있게 하며, 브라우저가 JavaScript를 초기화할 필요 없이 HTML과 CSS를 렌더링할 수 있기 때문입니다.

<docs-workflow>
<docs-step title="애플리케이션 준비">
다음 Angular CLI 명령을 사용하여 수행하십시오:

<docs-code language="shell">

ng new my-app

</docs-code>

기존 애플리케이션의 경우, `Router`를 수동으로 추가하고 애플리케이션 내에 `<router-outlet>`을 정의해야 합니다.
</docs-step>
<docs-step title="애플리케이션 쉘 생성">
Angular CLI를 사용하여 애플리케이션 쉘을 자동으로 생성하십시오.

<docs-code language="shell">

ng generate app-shell

</docs-code>

이 명령에 대한 자세한 내용은 [앱 쉘 명령](cli/generate/app-shell)을 참조하십시오.

해당 명령은 애플리케이션 코드를 업데이트하고 프로젝트 구조에 추가 파일을 추가합니다.

<docs-code language="text">
src
├── app
│ ├── app.config.server.ts # 서버 애플리케이션 구성
│ └── app-shell # 앱 쉘 구성 요소
│   ├── app-shell.component.html
│   ├── app-shell.component.scss
│   ├── app-shell.component.spec.ts
│   └── app-shell.component.ts
└── main.server.ts # 메인 서버 애플리케이션 부트스트래핑
</docs-code>

<docs-step title="애플리케이션이 쉘 콘텐츠로 빌드되었는지 확인">
<docs-code language="shell">

ng build --configuration=development

</docs-code>

또는 프로덕션 구성을 사용합니다.

<docs-code language="shell">

ng build

</docs-code>

빌드 출력을 확인하려면 <code class="no-auto-link">dist/my-app/browser/index.html</code>을 엽니다.
기본 텍스트 `app-shell works!`가 표시되어 애플리케이션 쉘 라우트가 출력의 일부로 렌더링되었음을 보여줍니다.
</docs-step>
</docs-workflow>