# Angular 서비스 워커 개요

서비스 워커는 전통적인 웹 배포 모델을 보강하고 애플리케이션이 운영 체제 및 하드웨어에서 실행되도록 작성된 코드와 동등한 신뢰성과 성능으로 사용자 경험을 제공할 수 있도록 합니다. Angular 애플리케이션에 서비스 워커를 추가하는 것은 애플리케이션을 [진보적인 웹 애플리케이션](https://web.dev/progressive-web-apps/) (PWA로 알려짐)으로 전환하는 단계 중 하나입니다.

가장 간단하게 말하면, 서비스 워커는 웹 브라우저에서 실행되고 애플리케이션의 캐싱을 관리하는 스크립트입니다.

서비스 워커는 네트워크 프록시로 기능합니다. 
애플리케이션이 만든 모든 아웃고잉 HTTP 요청을 가로채고 응답하는 방법을 선택할 수 있습니다. 
예를 들어, 로컬 캐시를 쿼리하고 사용 가능한 경우 캐시된 응답을 제공할 수 있습니다. 
프록싱은 `fetch`와 같은 프로그래밍 API를 통해 이루어진 요청에 한정되지 않으며, HTML에서 참조된 리소스와 `index.html`에 대한 초기 요청도 포함됩니다. 
따라서 서비스 워커 기반 캐싱은 완전히 프로그래밍 가능하며 서버가 지정한 캐싱 헤더에 의존하지 않습니다.

애플리케이션을 구성하는 다른 스크립트와 달리, Angular 애플리케이션 번들의 경우 서비스 워커는 사용자가 탭을 닫은 후에도 유지됩니다. 
브라우저가 애플리케이션을 다음에 로드할 때, 서비스 워커가 먼저 로드되고 애플리케이션을 로드하기 위해 리소스 요청을 가로챌 수 있습니다. 
서비스 워커가 그렇게 설계되었다면, **네트워크 없이 애플리케이션의 로딩을 완전히 만족시킬 수 있습니다**.

빠르고 안정적인 네트워크에서도 왕복 지연이 애플리케이션을 로드할 때 상당한 지연을 초래할 수 있습니다. 
서비스 워커를 사용하여 네트워크 의존성을 줄이면 사용자 경험을 크게 향상시킬 수 있습니다.

## Angular의 서비스 워커

Angular 애플리케이션은 단일 페이지 애플리케이션으로, 서비스 워커의 이점을 누리기 위한 최적의 위치에 있습니다. Angular는 서비스 워커 구현을 함께 제공하며, Angular 개발자는 이러한 서비스 워커를 활용하여 낮은 수준의 API에 대한 코딩 없이도 제공하는 신뢰성과 성능의 이점을 누릴 수 있습니다.

Angular의 서비스 워커는 느리거나 신뢰할 수 없는 네트워크 연결에서 애플리케이션을 사용할 때 최종 사용자 경험을 최적화하도록 설계되었으며, 구식 콘텐츠 제공의 위험을 최소화합니다.

이를 달성하기 위해 Angular 서비스 워커는 다음 지침을 따릅니다:

* 애플리케이션을 캐싱하는 것은 네이티브 애플리케이션을 설치하는 것과 같습니다.
    애플리케이션은 하나의 단위로 캐시되며 모든 파일이 함께 업데이트됩니다.

* 실행 중인 애플리케이션은 모든 파일의 동일한 버전으로 계속 실행됩니다.
    사용자는 호환되지 않을 가능성이 있는 최신 버전의 캐시된 파일을 갑자기 받지 않습니다.

* 사용자가 애플리케이션을 새로 고치면 최신 전체 캐시된 버전을 볼 수 있습니다.
    새 탭에서는 최신 캐시된 코드가 로드됩니다.

* 업데이트는 변경 사항이 게시된 후 상대적으로 빠르게 백그라운드에서 발생합니다.
    업데이트가 설치되고 준비될 때까지 이전 버전의 애플리케이션이 제공됩니다.

* 서비스 워커는 가능한 경우 대역폭을 절약합니다.
    리소스가 변경된 경우에만 다운로드됩니다.

이러한 동작을 지원하기 위해 Angular 서비스 워커는 서버에서 *매니페스트* 파일을 로드합니다. 
`ngsw.json`이라고 불리는 이 파일은 캐시할 리소스를 설명하며 각 파일 내용의 해시를 포함합니다. 
애플리케이션에 대한 업데이트가 배포되면 매니페스트의 내용이 변경되어 서비스 워커에 새 버전의 애플리케이션을 다운로드하고 캐시해야 한다고 알려줍니다. 
이 매니페스트는 `ngsw-config.json`이라는 CLI 생성 구성 파일에서 생성됩니다.

Angular 서비스 워커 설치는 [Angular CLI 명령 실행](ecosystem/service-workers/getting-started#adding-a-service-worker-to-your-project)처럼 간단합니다. 
브라우저에 Angular 서비스 워커를 등록하는 것 외에도, 서비스 워커와 상호 작용하고 이를 제어하기 위해 사용할 수 있는 몇 가지 서비스를 주입할 수 있습니다. 
예를 들어, 애플리케이션은 새 업데이트가 제공될 때 알림을 받도록 요청할 수 있으며, 애플리케이션은 서비스 워커에 서버에서 사용 가능한 업데이트를 확인하도록 요청할 수 있습니다.

## 시작하기 전에

Angular 서비스 워커의 모든 기능을 활용하려면 최신 버전의 Angular 및 [Angular CLI](tools/cli)를 사용하세요.

서비스 워커가 등록되기 위해서는 애플리케이션에 HTTPS를 통해 액세스해야 하며, HTTP는 허용되지 않습니다. 
브라우저는 불안전한 연결로 제공되는 페이지에서 서비스 워커를 무시합니다. 
그 이유는 서비스 워커가 매우 강력하기 때문에 서비스 워커 스크립트가 변조되지 않았는지 확인하는 추가적인 주의가 필요하기 때문입니다.

이 규칙에는 하나의 예외가 있습니다: 로컬 개발을 더 간단하게 만들기 위해 브라우저는 `localhost`에서 애플리케이션에 액세스할 때 보안 연결을 *필요로 하지 않습니다*.

### 브라우저 지원

Angular 서비스 워커의 이점을 얻으려면 애플리케이션이 일반적으로 서비스 워커를 지원하는 웹 브라우저에서 실행되어야 합니다. 
현재, Chrome, Firefox, Edge, Safari, Opera, UC Browser (Android 버전), Samsung Internet의 최신 버전에서 서비스 워커가 지원됩니다. 
IE 및 Opera Mini와 같은 브라우저는 서비스 워커를 지원하지 않습니다.

사용자가 서비스 워커를 지원하지 않는 브라우저로 애플리케이션에 액세스하면 서비스 워커가 등록되지 않으며 오프라인 캐시 관리 및 푸시 알림과 같은 관련 동작이 발생하지 않습니다. 
보다 구체적으로:

* 브라우저는 서비스 워커 스크립트 및 `ngsw.json` 매니페스트 파일을 다운로드하지 않습니다.
* `SwUpdate.checkForUpdate()` 호출과 같은 서비스 워커와 상호 작용하려는 시도는 거부된 프로미스를 반환합니다.
* `SwUpdate.available`와 같은 관련 서비스의 Observable 이벤트가 트리거되지 않습니다.

브라우저에서 서비스 워커 지원 없이 애플리케이션이 작동하는지 확인하는 것이 강력히 권장됩니다. 
지원되지 않는 브라우저는 서비스 워커 캐싱을 무시하지만, 애플리케이션이 서비스 워커와 상호 작용하려고 할 때 오류를 보고합니다. 
예를 들어, `SwUpdate.checkForUpdate()` 호출은 거부된 프로미스를 반환합니다. 
이러한 오류를 피하기 위해서는 `SwUpdate.isEnabled`를 사용하여 Angular 서비스 워커가 활성화되어 있는지 확인하세요.

서비스 워커 준비가 된 다른 브라우저에 대한 자세한 내용은 [Can I Use](https://caniuse.com/#feat=serviceworkers) 페이지와 [MDN 문서](https://developer.mozilla.org/docs/Web/API/Service_Worker_API)를 참조하세요.

## 관련 리소스

이 섹션의 나머지 기사들은 서비스 워커의 Angular 구현에 구체적으로 다룹니다.

<docs-pill-row>
  <docs-pill href="ecosystem/service-workers/config" title="구성 파일"/>
  <docs-pill href="ecosystem/service-workers/communications" title="서비스 워커와의 통신"/>
  <docs-pill href="ecosystem/service-workers/push-notifications" title="푸시 알림"/>
  <docs-pill href="ecosystem/service-workers/devops" title="서비스 워커 DevOps"/>
  <docs-pill href="ecosystem/service-workers/app-shell" title="앱 셸 패턴"/>
</docs-pill-row>

서비스 워커에 대한 일반적인 정보는 [서비스 워커: 소개](https://developers.google.com/web/fundamentals/primers/service-workers)를 참조하세요.

브라우저 지원에 대한 추가 정보는 [서비스 워커: 소개](https://developers.google.com/web/fundamentals/primers/service-workers) 섹션의 [브라우저 지원](https://developers.google.com/web/fundamentals/primers/service-workers/#browser_support), Jake Archibald의 [서비스워커 준비 상태?](https://jakearchibald.github.io/isserviceworkerready), 및 [Can I Use](https://caniuse.com/serviceworkers)를 참조하십시오.

추가 권장 사항 및 예제는 다음을 참조하세요:

<docs-pill-row>
  <docs-pill href="https://web.dev/precaching-with-the-angular-service-worker" title="Angular 서비스 워커로 프리캐싱하기"/>
  <docs-pill href="https://web.dev/creating-pwa-with-angular-cli" title="Angular CLI로 PWA 만들기"/>
</docs-pill-row>

## 다음 단계

Angular 서비스 워커를 사용하려면 [서비스 워커 시작하기](ecosystem/service-workers/getting-started)를 참조하세요.