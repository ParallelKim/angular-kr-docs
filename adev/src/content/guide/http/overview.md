# 백엔드 서비스와 HTTP를 사용하여 통신 이해하기

대부분의 프론트엔드 애플리케이션은 HTTP 프로토콜을 통해 서버와 통신해야 하며, 데이터를 다운로드하거나 업로드하고 다른 백엔드 서비스에 접근해야 합니다. Angular는 Angular 애플리케이션을 위한 클라이언트 HTTP API인 `@angular/common/http`의 `HttpClient` 서비스 클래스를 제공합니다.

## HTTP 클라이언트 서비스 기능

HTTP 클라이언트 서비스는 다음과 같은 주요 기능을 제공합니다:

* [타입이 지정된 응답 값 요청](guide/http/making-requests#fetching-json-data) 기능
* 간소화된 [오류 처리](guide/http/making-requests#handling-request-failure)
* 요청 및 응답 [가로채기](guide/http/interceptors)
* 강력한 [테스트 유틸리티](guide/http/testing)

## 다음 단계

<docs-pill-row>
  <docs-pill href="guide/http/setup" title="HttpClient 설정하기"/>
  <docs-pill href="guide/http/making-requests" title="HTTP 요청 만들기"/>
</docs-pill-row>