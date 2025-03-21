# 서비스 워커 시작하기

이 문서는 [Angular CLI](tools/cli)로 생성한 프로젝트에서 Angular 서비스 워커 지원을 활성화하는 방법을 설명합니다. 그런 다음 예제를 사용하여 작동 중인 서비스 워커를 보여주며, 로딩 및 기본 캐싱을 시연합니다.

## 프로젝트에 서비스 워커 추가하기

프로젝트에서 Angular 서비스 워커를 설정하려면 다음 CLI 명령을 실행하세요:

<docs-code language="shell">

ng add @angular/pwa

</docs-code>

CLI는 다음의 작업을 수행하여 애플리케이션을 서비스 워커를 사용하도록 구성합니다:

1. `@angular/service-worker` 패키지를 프로젝트에 추가합니다.
1. CLI에서 서비스 워커 빌드 지원을 활성화합니다.
1. 애플리케이션의 루트 제공자에 서비스 워커를 가져오고 등록합니다.
1. `index.html` 파일을 업데이트합니다:
    * `manifest.webmanifest` 파일을 추가하는 링크 포함
    * `theme-color`에 대한 메타 태그 추가
1. 설치된 진행형 웹 애플리케이션(PWA)을 지원하기 위해 아이콘 파일을 설치합니다.
1. 캐싱 동작 및 기타 설정을 지정하는 [`ngsw-config.json`](ecosystem/service-workers/config)라는 서비스 워커 구성 파일을 생성합니다.

이제 프로젝트를 빌드합니다:

<docs-code language="shell">

ng build

</docs-code>

이제 CLI 프로젝트가 Angular 서비스 워커를 사용할 준비가 되었습니다.

## 서비스 워커 작동 중: 투어

이 섹션은 예제 애플리케이션을 사용하여 서비스 워커가 작동하는 모습을 시연합니다. 로컬 개발 중에 서비스 워커 지원을 활성화하려면 다음 명령으로 프로덕션 구성을 사용하세요:

<docs-code language="shell">

ng serve --prod

</docs-code>

또는 npm에서 서비스 워커 애플리케이션을 지원하는 [`http-server 패키지`](https://www.npmjs.com/package/http-server)를 사용할 수 있습니다. 다음과 같이 설치 없이 실행합니다:

<docs-code language="shell">

npx http-server -p 8080 -c-1 dist/&lt;project-name&gt;/browser

</docs-code>

이 명령은 http://localhost:8080에서 서비스 워커 지원이 있는 애플리케이션을 제공합니다.

### 초기 로드

서버가 포트 `8080`에서 실행되고 있으므로 브라우저에서 `http://localhost:8080`을 입력합니다. 애플리케이션은 정상적으로 로드되어야 합니다.

팁: Angular 서비스 워커를 테스트할 때 서비스 워커가 이전의 남은 상태를 읽지 않도록 브라우저에서 인코그니토 또는 개인 창을 사용하는 것이 좋습니다. 이전 상태를 읽으면 예기치 않은 동작이 발생할 수 있습니다.

도움말: HTTPS를 사용하지 않으면 서비스 워커는 `localhost`에서 애플리케이션에 접근할 때만 등록됩니다.

### 네트워크 문제 시뮬레이션

네트워크 문제를 시뮬레이션하려면 애플리케이션의 네트워크 상호작용을 비활성화합니다.

Chrome에서:

1. **도구** > **개발자 도구**를 선택합니다 (우측 상단에 있는 Chrome 메뉴에서).
1. **네트워크 탭**으로 이동합니다.
1. **Throttle** 드롭다운 메뉴에서 **Offline**을 선택합니다.

<img alt="네트워크 탭에서 오프라인 옵션이 선택되었습니다" src="assets/images/guide/service-worker/offline-option.png">

이제 애플리케이션은 네트워크 상호작용에 접근할 수 없습니다.

Angular 서비스 워커를 사용하지 않는 애플리케이션에서는 지금 새로 고침하면 "인터넷 연결이 없습니다"라는 Chrome의 인터넷 연결 끊김 페이지가 표시됩니다.

Angular 서비스 워커가 추가되면 애플리케이션의 동작이 변경됩니다. 새로 고침하면 페이지가 정상적으로 로드됩니다.

네트워크 탭을 확인하여 서비스 워커가 활성화되어 있는지 확인하세요.

<img alt="요청이 ServiceWorker로 표시됨" src="assets/images/guide/service-worker/sw-active.png">

도움말: "크기" 열 아래에서 요청 상태가 `(ServiceWorker)`로 표시됩니다. 이는 리소스가 네트워크에서 로드되지 않고 서비스 워커의 캐시에서 로드되고 있음을 의미합니다.

### 무엇이 캐시되고 있나요?

브라우저에서 이 애플리케이션을 렌더링하는 데 필요한 모든 파일이 캐시되고 있음을 주목하세요. `ngsw-config.json` 보일러플레이트 구성은 CLI에서 사용하는 특정 리소스를 캐시하도록 설정되어 있습니다:

* `index.html`
* `favicon.ico`
* 빌드 결과물 (JS 및 CSS 번들)
* `assets` 아래의 모든 항목
* 구성된 `outputPath` (기본값 `./dist/<project-name>/`) 또는 `resourcesOutputPath` 아래의 이미지 및 폰트.
    이러한 옵션에 대한 자세한 내용은 `ng build` 문서를 참조하세요.

중요: 생성된 `ngsw-config.json`에는 캐시 가능한 폰트 및 이미지 확장자의 제한된 목록이 포함되어 있습니다. 경우에 따라 glob 패턴을 수정하여 필요에 맞출 수 있습니다.

중요: 구성 파일이 생성된 후 `resourcesOutputPath` 또는 `assets` 경로가 수정되면 `ngsw-config.json`에서 경로를 수동으로 변경해야 합니다.

### 애플리케이션 변경 사항

서비스 워커가 애플리케이션을 캐시하는 방법을 확인했으므로, 다음 단계는 업데이트 작동 방식을 이해하는 것입니다. 애플리케이션을 변경하고 서비스 워커가 업데이트를 설치하는 모습을 지켜보세요:

1. 인코그니토 창에서 테스트 중이라면 빈 탭을 하나 더 엽니다.
    이렇게 하면 테스트 중 인코그니토 및 캐시 상태가 유지됩니다.

1. 애플리케이션 탭을 닫지만 창은 닫지 않습니다.
    이 작업은 개발자 도구도 닫을 것입니다.

1. `http-server`를 종료합니다 (Ctrl-c).
1. `src/app/app.component.html`을 편집을 위해 엽니다.
1. 텍스트 `Welcome to {{title}}!`를 `Bienvenue à {{title}}!`로 변경합니다.
1. 서버를 다시 빌드하고 실행합니다:

    <docs-code language="shell">

    ng build
    npx http-server -p 8080 -c-1 dist/<project-name>/browser

    </docs-code>

### 브라우저에서 애플리케이션 업데이트하기

이제 브라우저와 서비스 워커가 업데이트된 애플리케이션을 처리하는 방법을 살펴보세요.

1. 같은 창에서 [http://localhost:8080](http://localhost:8080)을 다시 엽니다.
    무슨 일이 일어나나요?

    <img alt="여전히 Welcome to Service Workers!라고 표시됩니다" src="assets/images/guide/service-worker/welcome-msg-en.png">

    무슨 일이 잘못되었나요?
    _사실 아무 일도 일어나지 않았습니다!_
    Angular 서비스 워커는 자신의 **설치된** 애플리케이션 버전을 제공하고 있으며, 업데이트가 가능하더라도 말입니다.
    속도를 위해 서비스 워커는 애플리케이션이 캐시된 내용을 제공하기 전에 업데이트를 확인하지 않습니다.

    서비스 워커가 `/ngsw.json`을 요청하는 것을 보려면 `http-server` 로그를 확인하세요.

    <docs-code language="shell">
    [2023-09-07T00:37:24.372Z]  "GET /ngsw.json?ngsw-cache-bust=0.9365263935102124" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    </docs-code>

    이것이 서비스 워커가 업데이트를 확인하는 방법입니다.

1. 페이지를 새로 고칩니다.

    <img alt="텍스트가 Bienvenue à app!으로 변경되었습니다" src="assets/images/guide/service-worker/welcome-msg-fr.png">

    서비스 워커가 _백그라운드에서_ 업데이트된 애플리케이션 버전을 설치했으며, 다음 번 페이지가 로드되거나 새로 고침될 때 서비스 워커가 최신 버전으로 전환됩니다.

## Angular 서비스 워커에 대한 추가 정보

다음 사항에도 관심이 있을 수 있습니다:

<docs-pill-row>
  <docs-pill href="ecosystem/service-workers/config" title="구성 파일"/>
  <docs-pill href="ecosystem/service-workers/communications" title="서비스 워커와의 통신"/>
  <docs-pill href="ecosystem/service-workers/push-notifications" title="푸시 알림"/>
  <docs-pill href="ecosystem/service-workers/devops" title="서비스 워커 DevOps"/>
  <docs-pill href="ecosystem/service-workers/app-shell" title="앱 쉘 패턴"/>
</docs-pill-row>