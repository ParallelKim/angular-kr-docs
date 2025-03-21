# `HttpClient` 설정

앱에서 `HttpClient`를 사용하기 전에 [의존성 주입](guide/di)을 사용하여 구성해야 합니다.

## 의존성 주입을 통한 `HttpClient` 제공

`HttpClient`는 `app.config.ts`의 애플리케이션 `providers`에 대부분의 앱에서 포함하는 `provideHttpClient` 도우미 함수를 사용하여 제공됩니다.

<docs-code language="ts">
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
  ]
};
</docs-code>

앱이 NgModule 기반 부트를 사용하는 경우, 앱의 NgModule의 providers에 `provideHttpClient`를 포함할 수 있습니다:

<docs-code language="ts">
@NgModule({
  providers: [
    provideHttpClient(),
  ],
  // ... 다른 애플리케이션 구성
})
export class AppModule {}
</docs-code>

그런 다음 구성요소, 서비스 또는 기타 클래스의 의존성으로 `HttpClient` 서비스를 주입할 수 있습니다:

<docs-code language="ts">
@Injectable({providedIn: 'root'})
export class ConfigService {
  constructor(private http: HttpClient) {
    // 이제 이 서비스는 `this.http`를 통해 HTTP 요청을 할 수 있습니다.
  }
}
</docs-code>

## `HttpClient`의 기능 구성

`provideHttpClient`는 클라이언트의 다양한 측면의 동작을 활성화하거나 구성하기 위한 선택적 기능 구성 목록을 수용합니다. 이 섹션에서는 선택적 기능과 그 용도를 자세히 설명합니다.

### `withFetch`

<docs-code language="ts">
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
    ),
  ]
};
</docs-code>

기본적으로 `HttpClient`는 [`XMLHttpRequest`](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest) API를 사용하여 요청을 합니다. `withFetch` 기능은 클라이언트를 [`fetch`](https://developer.mozilla.org/docs/Web/API/Fetch_API) API를 사용하도록 전환합니다.

`fetch`는 더 최신의 API이며, `XMLHttpRequest`가 지원되지 않는 몇 가지 환경에서 사용할 수 있습니다. 업로드 진행 상황 이벤트를 생성하지 않는 등 몇 가지 제한사항이 있습니다.

### `withInterceptors(...)`

`withInterceptors`는 `HttpClient`를 통해 수행된 요청을 처리할 인터셉터 함수 집합을 구성합니다. 자세한 내용은 [인터셉터 가이드](guide/http/interceptors)를 참조하십시오.

### `withInterceptorsFromDi()`

`withInterceptorsFromDi`는 `HttpClient` 구성에서 구식 클래스 기반 인터셉터를 포함합니다. 자세한 내용은 [인터셉터 가이드](guide/http/interceptors)를 참조하십시오.

유용한 팁: 기능적 인터셉터(`withInterceptors`를 통해)는 더 예측 가능한 순서를 가지며, DI 기반 인터셉터보다 추천합니다.

### `withRequestsMadeViaParent()`

기본적으로, `provideHttpClient`를 사용하여 특정 주입기 내에서 `HttpClient`를 구성할 때, 이 구성은 부모 주입기에 존재할 수 있는 `HttpClient`에 대한 구성을 덮어씁니다.

`withRequestsMadeViaParent()`를 추가하면, `HttpClient`는 요청을 현재 레벨에서 구성된 인터셉터를 통과한 후 부모 주입기의 `HttpClient` 인스턴스로 요청을 전달하도록 구성됩니다. 이는 요청을 부모 주입기의 인터셉터를 통해 전송하면서 자식 주입기에 인터셉터를 _추가_하려는 경우에 유용합니다.

중요: 현재 주입기 위에 `HttpClient`의 인스턴스를 구성해야 합니다. 그렇지 않으면 이 옵션은 유효하지 않으며, 사용 시 런타임 오류가 발생합니다.

### `withJsonpSupport()`

`withJsonpSupport`를 포함하면, `HttpClient`에서 `.jsonp()` 메서드를 활성화하여 데이터의 교차 도메인 로드를 위한 [JSONP 규약](https://en.wikipedia.org/wiki/JSONP)을 통해 GET 요청을 수행합니다.

유용한 팁: 가능할 때 JSONP 대신 [CORS](https://developer.mozilla.org/docs/Web/HTTP/CORS)를 사용하여 교차 도메인 요청을 하는 것이 좋습니다.

### `withXsrfConfiguration(...)`

이 옵션을 포함하면 `HttpClient`의 내장 XSRF 보안 기능을 사용자 정의할 수 있습니다. 자세한 내용은 [보안 가이드](best-practices/security)를 참조하십시오.

### `withNoXsrfProtection()`

이 옵션을 포함하면 `HttpClient`의 내장 XSRF 보안 기능이 비활성화됩니다. 자세한 내용은 [보안 가이드](best-practices/security)를 참조하십시오.

## `HttpClientModule` 기반 구성

일부 애플리케이션은 NgModules 기반의 구형 API를 사용하여 `HttpClient`를 구성할 수 있습니다.

이 표는 `@angular/common/http`에서 제공되는 NgModules와 그들이 위의 공급자 구성 함수와 어떻게 관련되어 있는지를 보여줍니다.

| **NgModule**                            | `provideHttpClient()` 동등물              |
| --------------------------------------- | --------------------------------------------- |
| `HttpClientModule`                      | `provideHttpClient(withInterceptorsFromDi())` |
| `HttpClientJsonpModule`                 | `withJsonpSupport()`                          |
| `HttpClientXsrfModule.withOptions(...)` | `withXsrfConfiguration(...)`                  |
| `HttpClientXsrfModule.disable()`        | `withNoXsrfProtection()`                      |

<docs-callout important title="여러 주입기에서 HttpClientModule을 사용할 때 주의하십시오">
`HttpClientModule`이 여러 주입기에 존재할 때 인터셉터의 동작은 정의되지 않았으며, 정확한 옵션 및 공급자/가져오기 순서에 따라 달라집니다.

다중 주입기 구성을 위해 `provideHttpClient`를 선호하십시오. 이 구성은 더 안정적인 동작을 가지고 있습니다. 위에서 설명한 `withRequestsMadeViaParent` 기능을 참조하십시오.
</docs-callout>