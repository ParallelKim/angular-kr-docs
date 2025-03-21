# 배포

Angular 애플리케이션을 원격 서버에 배포할 준비가 되면 여러 가지 옵션이 있습니다.

## CLI를 사용한 자동 배포

Angular CLI 명령 `ng deploy`는 프로젝트와 연결된 `deploy` [CLI 빌더](tools/cli/cli-builder)를 실행합니다.
여러 타사 빌더가 다양한 플랫폼에 대한 배포 기능을 구현합니다.
이들 중 아무거나 `ng add`를 사용하여 프로젝트에 추가할 수 있습니다.

배포 기능이 있는 패키지를 추가하면 선택한 프로젝트에 대한 `배포` 섹션으로 작업 공간 구성(`angular.json` 파일)이 자동으로 업데이트됩니다.
그런 다음 `ng deploy` 명령을 사용하여 해당 프로젝트를 배포할 수 있습니다.

예를 들어, 다음 명령은 프로젝트를 [Firebase](https://firebase.google.com/)에 자동으로 배포합니다.

<docs-code language="shell">

ng add @angular/fire
ng deploy

</docs-code>

명령은 인터랙티브합니다.
이 경우 Firebase 계정이 있거나 만들어야 하며, 이를 사용하여 인증해야 합니다.
명령은 애플리케이션을 빌드하고 프로덕션 자산을 Firebase에 업로드하기 전에 배포할 Firebase 프로젝트를 선택하도록 요청합니다.

아래 표는 다양한 플랫폼에 배포 기능을 구현하는 도구를 나열합니다.
각 패키지에 대한 `deploy` 명령은 서로 다른 명령줄 옵션이 필요할 수 있습니다.
아래 패키지 이름과 관련된 링크를 따라 추가 정보를 읽을 수 있습니다:

| 배포 대상                                                      | 설정 명령                                                                              |
|:---                                                          |:---                                                                                  |
| [Firebase 호스팅](https://firebase.google.com/docs/hosting)      | [`ng add @angular/fire`](https://npmjs.org/package/@angular/fire)                           |
| [Vercel](https://vercel.com/solutions/angular)                     | [`vercel init angular`](https://github.com/vercel/vercel/tree/main/examples/angular) |
| [Netlify](https://www.netlify.com)                                 | [`ng add @netlify-builder/deploy`](https://npmjs.org/package/@netlify-builder/deploy)       |
| [GitHub 페이지](https://pages.github.com)                          | [`ng add angular-cli-ghpages`](https://npmjs.org/package/angular-cli-ghpages)               |
| [Amazon Cloud S3](https://aws.amazon.com/s3/?nc2=h_ql_prod_st_s3) | [`ng add @jefiozie/ngx-aws-deploy`](https://www.npmjs.com/package/@jefiozie/ngx-aws-deploy) |

자체 관리 서버에 배포하거나 좋아하는 클라우드 플랫폼에 대한 빌더가 없는 경우, `ng deploy` 명령을 사용할 수 있는 빌더를 [생성](tools/cli/cli-builder)하거나 이 가이드를 읽고 애플리케이션을 수동으로 배포하는 방법을 배울 수 있습니다.

## 원격 서버에 수동 배포

애플리케이션을 수동으로 배포하려면 프로덕션 빌드를 생성하고 출력 디렉토리를 웹 서버 또는 콘텐츠 전송 네트워크(CDN)에 복사합니다.
기본적으로 `ng build`는 `production` 구성을 사용합니다.
빌드 구성을 사용자 정의한 경우, 배포하기 전에 [프로덕션 최적화](tools/cli/deployment#production-optimizations)가 적용되고 있는지 확인하는 것이 좋습니다.

`ng build`는 기본적으로 빌드된 산출물을 `dist/my-app/`에 출력하지만, 이 경로는 `@angular-devkit/build-angular:browser` 빌더의 `outputPath` 옵션으로 설정할 수 있습니다.
이 디렉토리를 서버에 복사하고 디렉토리를 제공하도록 구성합니다.

이것은 최소한의 배포 솔루션이지만, 서버가 Angular 애플리케이션을 올바르게 제공하기 위한 몇 가지 요구 사항이 있습니다.

## 서버 구성

이 섹션에서는 Angular 애플리케이션을 실행하기 위해 서버에서 구성해야 할 수 있는 변경 사항을 다룹니다.

### 라우팅된 앱은 `index.html`로 다시 돌아가야 합니다

클라이언트 측에서 렌더링된 Angular 애플리케이션은 모든 콘텐츠가 정적이고 빌드 시 생성되기 때문에 정적 HTML 서버와 함께 제공하기에 적합한 후보입니다.

애플리케이션이 Angular 라우터를 사용하는 경우, 서버에 파일이 없을 때 애플리케이션의 호스트 페이지(`index.html`)를 반환하도록 구성해야 합니다.

라우팅된 애플리케이션은 "딥 링크"를 지원해야 합니다.
*딥 링크*는 애플리케이션 내부의 구성요소에 대한 경로를 지정하는 URL입니다.
예를 들어, `http://my-app.test/users/42`는 `id`가 42인 사용자를 표시하는 사용자 세부정보 페이지에 대한 *딥 링크*입니다.

사용자가 처음으로 인덱스 페이지를 로드한 후 실행 중인 클라이언트 내에서 해당 URL로 탐색할 때는 문제가 없습니다.
Angular 라우터는 탐색을 *클라이언트 측*에서 수행하며 새 HTML 페이지를 요청하지 않습니다.

그러나 이메일에서 딥 링크를 클릭하거나 브라우저 주소 표시줄에 입력하거나 이미 딥 링크된 페이지에서 브라우저를 새로 고치는 경우 모두 애플리케이션이 실행되고 있는 *외부*에서 브라우저에 의해 처리됩니다.
브라우저는 Angular의 라우터를 우회하여 `/users/42`에 대한 직접 요청을 서버에 보냅니다.

정적 서버는 `http://my-app.test/`에 대한 요청을 받을 때마다 `index.html`을 반환하는 것이 일반적입니다.
하지만 대부분의 서버는 기본적으로 `http://my-app.test/users/42`를 거부하고 `404 - Not Found` 오류를 반환합니다 *단, `index.html`을 대신 반환하도록 구성되지 않은 경우*.
딥 링크에 대해 Angular가 제공되고 올바른 경로를 표시할 수 있도록 서버의 폴백 경로나 404 페이지를 `index.html`로 구성하세요.
일부 서버는 이 폴백 동작을 "단일 페이지 애플리케이션"(SPA) 모드라고 부릅니다.

브라우저가 애플리케이션을 로드하면 Angular 라우터는 URL을 읽고 현재 페이지를 결정하며 `/users/42`를 올바르게 표시합니다.

`http://my-app.test/does-not-exist`와 같은 "진짜" 404 페이지의 경우, 서버는 추가 구성이 필요하지 않습니다.
[Angular 라우터에서 구현된 404 페이지](guide/routing/common-router-tasks#displaying-a-404-page)는 올바르게 표시됩니다.

### 다른 서버에서 데이터 요청하기 (CORS)

웹 개발자는 애플리케이션의 호스트 서버 이외의 서버에 네트워크 요청을 할 때 [*교차 출처 리소스 공유*](https://developer.mozilla.org/docs/Web/HTTP/CORS "교차 출처 리소스 공유") 오류에 직면할 수 있습니다.
브라우저는 서버가 명시적으로 허용하지 않는 한 이러한 요청을 금지합니다.

이 오류에 대해 Angular 또는 클라이언트 애플리케이션에서 할 수 있는 것은 없습니다.
서버는 애플리케이션의 요청을 수락하도록 구성되어야 합니다.
특정 서버에 대해 CORS를 활성화하는 방법에 대한 자세한 내용은 [enable-cors.org](https://enable-cors.org/server.html "CORS 서버 활성화")를 참조하세요.

## 프로덕션 최적화

`ng build`는 다른 구성이 없으면 `production` 구성을 사용합니다. 이 구성은 다음 빌드 최적화 기능을 활성화합니다.

| 기능                                                            | 세부 사항                                                                                        |
|:---                                                           |:---                                                                                            |
| [선행 컴파일(AOT)](tools/cli/aot-compiler)                     | Angular 구성 요소 템플릿을 미리 컴파일합니다.                                                       |
| [프로덕션 모드](tools/cli/deployment#development-only-features) | 애플리케이션을 최상의 런타임 성능을 위해 최적화합니다.                                                   |
| 번들링                                                       | 여러 애플리케이션 및 라이브러리 파일을 최소한의 배포 파일 수로 연결합니다.                               |
| 축소                                                         | 과도한 공백, 주석 및 선택적 토큰을 제거합니다.                                                      |
| 변수명 변경                                                  | 함수, 클래스 및 변수를 더 짧고 임의의 식별자로 이름을 변경합니다.                                     |
| 사용되지 않는 코드 제거                                        | 참조되지 않는 모듈 및 사용하지 않는 코드를 제거합니다.                                                |

CLI 빌드 옵션과 그 효과에 대한 자세한 내용은 [`ng build`](cli/build)를 참조하세요.

### 개발 전용 기능

`ng serve`를 사용하여 애플리케이션을 로컬에서 실행할 때 Angular는 런타임에 개발 구성을 사용하여 다음과 같은 기능을 활성화합니다:

* [`expression-changed-after-checked`](errors/NG0100) 감지와 같은 추가 안전성 검사.
* 보다 상세한 오류 메시지.
* 전역 `ng` 변수와 [디버깅 함수](api#core-global) 및 [Angular DevTools](tools/devtools) 지원과 같은 추가 디버깅 유틸리티.

이러한 기능은 개발하는 동안 유용하지만, 애플리케이션에 추가 코드를 요구하므로 프로덕션에서는 바람직하지 않습니다. 이러한 기능이 최종 사용자에게 번들 크기에 부정적인 영향을 미치지 않도록 Angular CLI는 프로덕션용 빌드 시 번들에서 개발 전용 코드를 제거합니다.

애플리케이션을 기본적으로 `ng build`로 빌드하면 `production` 구성을 사용하여 최적의 번들 크기를 위해 이러한 기능을 출력에서 제거합니다.

## `--deploy-url`

`--deploy-url`은 자산(이미지, 스크립트 및 스타일 시트와 같은)의 상대 URL을 *컴파일* 시 해결하기 위한 기본 경로를 지정하는 데 사용되는 명령줄 옵션입니다.

<docs-code language="shell">

ng build --deploy-url /my/assets

</docs-code>

`--deploy-url`의 효과와 목적은 [`<base href>`](guide/routing/common-router-tasks)와 중복됩니다. 두 가지 모두 초기 스크립트, 스타일시트, 지연 스크립트 및 CSS 리소스에 사용할 수 있습니다.

실행 시 단일 위치에서 정의할 수 있는 `<base href>`와 달리, `--deploy-url`은 빌드 시간에 애플리케이션에 하드 코딩되어야 합니다.
가능한 경우 `<base href>`를 선호하십시오.