# `HttpClient` 보안

`HttpClient`는 두 가지 일반 HTTP 보안 메커니즘인 XSSI 보호와 XSRF/CSRF 보호에 대한 내장 지원을 포함합니다.

팁: API에 대해 [콘텐츠 보안 정책](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy)을 채택하는 것도 고려하세요.

## XSSI 보호

크로스 사이트 스크립트 포함(Cross-Site Script Inclusion, XSSI)은 공격자가 제어하는 페이지에서 `<script>`로 API 엔드포인트의 JSON 데이터를 로드하는 [크로스 사이트 스크립팅](https://en.wikipedia.org/wiki/Cross-site_scripting) 공격의 한 형태입니다. 이후 다양한 JavaScript 기법을 사용하여 이 데이터를 접근할 수 있습니다.

XSSI를 방지하는 일반적인 기법은 "비실행 접두사"와 함께 JSON 응답을 제공하는 것입니다. 일반적으로 `)]}',\n` 이 사용됩니다. 이 접두사는 JSON 응답이 유효한 실행 가능한 JavaScript로 해석되는 것을 방지합니다. API가 데이터로 로드될 때 접두사는 JSON 파싱 전에 제거할 수 있습니다.

`HttpClient`는 응답에서 JSON을 파싱할 때 이 XSSI 접두사를 자동으로 제거합니다(있는 경우).

## XSRF/CSRF 보호

[크로스 사이트 요청 위조(Cross-Site Request Forgery, XSRF 또는 CSRF)](https://en.wikipedia.org/wiki/Cross-site_request_forgery)은 공격자가 인증된 사용자를 속여서 본인의 웹사이트에서 모르게 작업을 수행하게 만드는 공격 기법입니다.

`HttpClient`는 XSRF 공격을 방지하기 위해 사용되는 [일반적인 메커니즘](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Cookie-to-header_token)을 지원합니다. HTTP 요청을 수행할 때 인터셉터는 기본적으로 `XSRF-TOKEN`이라는 쿠키에서 토큰을 읽고 이를 HTTP 헤더 `X-XSRF-TOKEN`으로 설정합니다. 쿠키를 읽을 수 있는 코드는 오직 사용자의 도메인에서만 실행될 수 있으므로 백엔드는 HTTP 요청이 공격자가 아닌 클라이언트 애플리케이션에서 온 것임을 확신할 수 있습니다.

기본적으로 인터셉터는 상대 URL에 대한 모든 변형 요청(예: `POST`)에 대해 이 헤더를 전송하지만 GET/HEAD 요청이나 절대 URL이 있는 요청에서는 전송하지 않습니다.

<docs-callout helpful title="GET 요청을 보호하지 않는 이유?">
CSRF 보호는 백엔드에서 상태를 변경할 수 있는 요청에만 필요합니다. 본질적으로 CSRF 공격은 도메인 경계를 넘기 때문에, 웹의 [동일 출처 정책](https://developer.mozilla.org/docs/Web/Security/Same-origin_policy)으로 인해 공격자가 인증된 GET 요청의 결과를 가져오는 것을 방지합니다.
</docs-callout>

이점을 누리기 위해서는 서버가 페이지 로드나 첫 번째 GET 요청 시 JavaScript에서 읽을 수 있는 세션 쿠키 `XSRF-TOKEN`에 토큰을 설정해야 합니다. 이후 요청에서 서버는 쿠키가 `X-XSRF-TOKEN` HTTP 헤더와 일치하는지 확인할 수 있으며, 따라서 오직 사용자 도메인에서 실행되는 코드만이 요청을 보낼 수 있었음을 보장할 수 있습니다. 이 토큰은 각 사용자마다 고유해야 하며, 서버에 의해 검증 가능해야 합니다. 이는 클라이언트가 자신만의 토큰을 만들지 못하도록 방지합니다. 보안을 강화하기 위해 사이트의 인증 쿠키와 소금을 사용하여 토큰을 설정하십시오.

여러 Angular 앱이 동일한 도메인이나 서브도메인을 공유하는 환경에서 충돌을 방지하려면 각 애플리케이션에 고유한 쿠키 이름을 부여해야 합니다.

<docs-callout important title="HttpClient는 XSRF 보호 체계의 클라이언트 측만 지원합니다">
  백엔드 서비스는 페이지를 위한 쿠키를 설정하고 모든 적격 요청에서 헤더가 존재하는지 확인하도록 구성되어야 합니다. 이를 수행하지 않을 경우 Angular의 기본 보호가 무효화됩니다.
</docs-callout>

### 사용자 정의 쿠키/헤더 이름 구성

백엔드 서비스가 XSRF 토큰 쿠키 또는 헤더에 대해 다른 이름을 사용하는 경우, `withXsrfConfiguration`를 사용하여 기본 설정을 덮어쓸 수 있습니다.

다음과 같이 `provideHttpClient` 호출에 추가하십시오:

<docs-code language="ts">
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'CUSTOM_XSRF_TOKEN',
        headerName: 'X-Custom-Xsrf-Header',
      }),
    ),
  ]
};
</docs-code>

### XSRF 보호 비활성화

내장된 XSRF 보호 메커니즘이 애플리케이션에 작동하지 않는 경우, `withNoXsrfProtection` 기능을 사용하여 이를 비활성화할 수 있습니다:

<docs-code language="ts">
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withNoXsrfProtection(),
    ),
  ]
};
</docs-code>