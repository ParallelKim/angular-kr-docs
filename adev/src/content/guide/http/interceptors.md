# 인터셉터

`HttpClient`는 _인터셉터_라고 알려진 미들웨어의 형태를 지원합니다.

TLDR: 인터셉터는 재시도, 캐싱, 로깅 및 인증과 같은 일반적인 패턴을 개별 요청에서 추상화할 수 있도록 하는 미들웨어입니다.

`HttpClient`는 기능적 인터셉터와 DI 기반 인터셉터의 두 가지 종류의 인터셉터를 지원합니다. 복잡한 설정에서 더 예측 가능한 동작을 가지기 때문에 기능적 인터셉터를 사용하는 것을 추천합니다. 이 가이드의 예제에서는 기능적 인터셉터를 사용하며, [DI 기반 인터셉터](#di-based-interceptors)는 마지막 섹션에서 별도로 다룹니다.

## 인터셉터

인터셉터는 일반적으로 요청마다 실행할 수 있는 함수로, 요청 및 응답의 내용과 전반적인 흐름에 영향을 미칠 수 있는 광범위한 기능을 가지고 있습니다. 여러 개의 인터셉터를 설치할 수 있으며, 이는 인터셉터 체인을 형성하고 각 인터셉터는 요청이나 응답을 처리한 후 체인의 다음 인터셉터로 전달합니다.

다양한 일반적인 패턴을 구현하기 위해 인터셉터를 사용할 수 있습니다, 예를 들어:

* 특정 API에 대한 아웃고잉 요청에 인증 헤더 추가.
* 지수 백오프를 사용하여 실패한 요청 재시도.
* 일정 기간 동안 응답 캐싱, 또는 변동으로 인해 무효화될 때까지.
* 응답 파싱 사용자 정의.
* 서버 응답 시간을 측정하고 이를 로그에 기록.
* 네트워크 작업이 진행되는 동안 로딩 스피너와 같은 UI 요소 구동.
* 특정 시간 내에 이루어진 요청 수집 및 배치.
* 구성 가능한 기한 또는 타임아웃 후 자동으로 요청 실패.
* 서버를 정기적으로 폴링하고 결과 새로 고침.

## 인터셉터 정의하기

인터셉터의 기본 형태는 아웃고잉 `HttpRequest`와 인터셉터 체인에서 다음 처리 단계를 나타내는 `next` 함수를 받는 함수입니다.

예를 들어, 이 `loggingInterceptor`는 요청을 전달하기 전에 아웃고잉 요청 URL을 `console.log`에 기록합니다:

<docs-code language="ts">
export function loggingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  console.log(req.url);
  return next(req);
}
</docs-code>

이 인터셉터가 실제로 요청을 가로채기 위해서는 `HttpClient`를 사용하도록 구성해야 합니다.

## 인터셉터 구성하기

`HttpClient`를 DI(의존성 주입)를 통해 구성할 때 사용할 인터셉터 집합을 선언합니다. `withInterceptors` 기능을 사용합니다:

<docs-code language="ts">
bootstrapApplication(AppComponent, {providers: [
  provideHttpClient(
    withInterceptors([loggingInterceptor, cachingInterceptor]),
  )
]});
</docs-code>

구성한 인터셉터들은 providers에 나열한 순서에 따라 연결됩니다. 위의 예시에서 `loggingInterceptor`는 요청을 처리한 다음 `cachingInterceptor`로 전달합니다.

### 응답 이벤트 가로채기

인터셉터는 `next`가 반환하는 `HttpEvent`의 `Observable` 스트림을 변형하여 응답에 접근하거나 조작할 수 있습니다. 이 스트림은 모든 응답 이벤트를 포함하므로 최종 응답 객체를 식별하기 위해 각 이벤트의 `.type`을 검사할 필요가 있습니다.

<docs-code language="ts">
export function loggingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  return next(req).pipe(tap(event => {
    if (event.type === HttpEventType.Response) {
      console.log(req.url, 'returned a response with status', event.status);
    }
  }));
}
</docs-code>

팁: 인터셉터는 요청 객체를 캡처하는 클로저에서 응답과 아웃고잉 요청을 자연스럽게 연관시킵니다.

## 요청 수정하기

대부분의 `HttpRequest` 및 `HttpResponse` 인스턴스의 측면은 _불변_이며, 인터셉터는 그것들을 직접 수정할 수 없습니다. 대신 인터셉터는 이러한 객체를 `.clone()` 연산을 사용하여 복제하고 새로운 인스턴스에서 수정할 속성을 지정하여 수정합니다. 이 과정에서 `HttpHeaders` 또는 `HttpParams`와 같은 값에 대해서도 불변 업데이트를 수행할 수 있습니다.

예를 들어, 요청에 헤더를 추가하려면:

<docs-code language="ts">
const reqWithHeader = req.clone({
  headers: req.headers.set('X-New-Header', 'new header value'),
});
</docs-code>

이 불변성 덕분에 대부분의 인터셉터는 동일한 `HttpRequest`가 인터셉터 체인에 여러 번 제출될 경우에도 항등성이 있습니다. 요청이 실패한 후 재시도될 때 이러한 상황이 발생할 수 있습니다.

중요: 요청 또는 응답의 본체는 **깊은 수정으로부터 보호되지 않습니다**. 인터셉터가 본체를 수정해야 하는 경우, 동일한 요청에 대해 여러 번 실행하는 것을 처리하는 데 주의하십시오.

## 인터셉터에서의 의존성 주입

인터셉터는 이를 등록한 주입기의 _주입 컨텍스트_에서 실행되며, Angular의 `inject` API를 사용하여 의존성을 검색할 수 있습니다.

예를 들어, 애플리케이션에 아웃고잉 요청을 위한 인증 토큰을 생성하는 `AuthService`라는 서비스가 있다고 가정합니다. 인터셉터는 이 서비스를 주입하고 사용할 수 있습니다:

<docs-code language="ts">
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // 현재 `AuthService`를 주입하고 인증 토큰을 가져옵니다.
  const authToken = inject(AuthService).getAuthToken();

  // 인증 헤더를 추가하기 위해 요청을 복제합니다.
  const newReq = req.clone({
    headers: req.headers.append('X-Authentication-Token', authToken),
  });
  return next(newReq);
}
</docs-code>

## 요청 및 응답 메타데이터

종종 백엔드로 전송되지 않는 정보가 요청에 포함되는 것이 유용하지만, 특히 인터셉터를 위해 고안된 경우가 있습니다. `HttpRequest`는 이러한 종류의 메타데이터를 `HttpContext`의 인스턴스로 저장하는 `.context` 객체를 가지고 있습니다. 이 객체는 `HttpContextToken` 타입의 키를 가진 타입화된 맵처럼 작동합니다.

이 시스템이 어떻게 작동하는지 설명하기 위해, 메타데이터를 사용하여 특정 요청에 대해 캐싱 인터셉터가 활성화되었는지 여부를 제어해 봅시다.

### 컨텍스트 토큰 정의하기

캐싱 인터셉터가 특정 요청을 캐시해야 하는지 여부를 그 요청의 `.context` 맵에 저장하기 위해 새로운 `HttpContextToken`을 정의하여 키로 사용합니다:

<docs-code language="ts">
export const CACHING_ENABLED = new HttpContextToken<boolean>(() => true);
</docs-code>

제공된 함수는 해당 요청이 명시적으로 값을 설정하지 않은 경우 토큰의 기본값을 생성합니다. 함수를 사용하면 토큰의 값이 객체나 배열인 경우, 각 요청이 고유한 인스턴스를 갖도록 보장합니다.

### 인터셉터에서 토큰 읽기

인터셉터는 토큰을 읽고 그 값에 따라 캐싱 논리를 적용할지 여부를 선택할 수 있습니다:

<docs-code language="ts">
export function cachingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  if (req.context.get(CACHING_ENABLED)) {
    // 캐싱 논리 적용
    return ...;
  } else {
    // 이 요청에 대해 캐싱이 비활성화되었습니다.
    return next(req);
  }
}
</docs-code>

### 요청 시 컨텍스트 토큰 설정하기

`HttpClient` API를 통해 요청을 만들 때, `HttpContextToken`에 대한 값을 제공할 수 있습니다:

<docs-code language="ts">
const data$ = http.get('/sensitive/data', {
  context: new HttpContext().set(CACHING_ENABLED, false),
});
</docs-code>

인터셉터는 요청의 `HttpContext`에서 이러한 값을 읽을 수 있습니다.

### 요청 컨텍스트는 변경 가능

`HttpRequest`의 다른 속성과 달리, 관련된 `HttpContext`는 _변경 가능_합니다. 인터셉터가 나중에 재시도되는 요청의 컨텍스트를 변경하면, 같은 인터셉터가 다시 실행될 때 컨텍스트 변화를 관찰합니다. 이는 필요할 경우 여러 개의 재시도 간에 상태를 전달하는 데 유용합니다.

## 합성 응답

대부분의 인터셉터는 요청이나 응답을 변형하면서 `next` 핸들러를 단순히 호출하지만, 이것은 엄격한 요구사항은 아닙니다. 이 섹션에서는 인터셉터가 더 고급 동작을 통합하는 몇 가지 방법에 대해 설명합니다.

인터셉터는 `next`를 호출할 필요가 없습니다. 대신 캐시에서 또는 대체 메커니즘을 통해 요청을 보내는 것과 같은 다른 메커니즘을 통해 응답을 구성할 수 있습니다.

응답을 구성하는 것은 `HttpResponse` 생성자를 사용하는 것으로 가능합니다:

<docs-code language="ts">
const resp = new HttpResponse({
  body: 'response body',
});
</docs-code>

## DI 기반 인터셉터

`HttpClient`는 인젝터블 클래스 형태로 정의된 인터셉터도 지원하며, DI 시스템을 통해 구성됩니다. DI 기반 인터셉터의 기능은 기능적 인터셉터와 동일하지만, 구성 메커니즘이 다릅니다.

DI 기반 인터셉터는 `HttpInterceptor` 인터페이스를 구현하는 인젝터블 클래스입니다:

<docs-code language="ts">
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, handler: HttpHandler): Observable<HttpEvent<any>> {
    console.log('Request URL: ' + req.url);
    return handler.handle(req);
  }
}
</docs-code>

DI 기반 인터셉터는 의존성 주입 다중 제공자를 통해 구성됩니다:

<docs-code language="ts">
bootstrapApplication(AppComponent, {providers: [
  provideHttpClient(
    // DI 기반 인터셉터는 명시적으로 활성화해야 합니다.
    withInterceptorsFromDi(),
  ),

  {provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true},
]});
</docs-code>

DI 기반 인터셉터는 제공자가 등록된 순서에 따라 실행됩니다. 광범위하고 계층적인 DI 구성으로 된 앱에서는 이 순서를 예측하기 매우 어려울 수 있습니다.