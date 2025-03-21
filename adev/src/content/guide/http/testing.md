# 테스트 요청

외부 의존성과 마찬가지로, HTTP 백엔드를 모킹해야 테스트가 원격 서버와의 상호 작용을 시뮬레이션할 수 있습니다. `@angular/common/http/testing` 라이브러리는 애플리케이션에서 발생하는 요청을 캡처하고, 그것에 대한 assertions를 수행하며, 백엔드의 동작을 모방하기 위한 응답을 모킹하는 도구를 제공합니다.

테스트 라이브러리는 앱이 코드를 실행하고 먼저 요청을 만드는 패턴을 위해 설계되었습니다. 그런 다음 테스트는 특정 요청이 만들어졌는지 아니면 만들어지지 않았는지를 기대하고, 해당 요청에 대한 assertions를 수행하며, 마지막으로 "flushing"을 통해 각 예상 요청에 대한 응답을 제공합니다.

끝으로, 테스트는 앱이 예기치 않은 요청을 하지 않았는지 확인할 수 있습니다.

## 테스트 설정

`HttpClient` 사용을 테스트하려면 `TestBed`를 구성하고 테스트 설정에 `provideHttpClient()` 및 `provideHttpClientTesting()`을 포함해야 합니다. 이렇게 하면 `HttpClient`가 실제 네트워크 대신 테스트 백엔드를 사용하도록 구성됩니다. 또한 테스트 백엔드와 상호 작용하고 어떤 요청이 완료되었는지에 대한 기대를 설정하며, 해당 요청에 대한 응답을 flushing하기 위해 사용할 `HttpTestingController`를 제공합니다. `HttpTestingController`는 구성 후 `TestBed`로부터 주입할 수 있습니다.

`provideHttpClient()`를 `provideHttpClientTesting()` **전**에 제공해야 합니다. 왜냐하면 `provideHttpClientTesting()`이 `provideHttpClient()`의 일부를 덮어쓰게 되기 때문입니다. 반대로 설정하면 테스트가 깨질 수 있습니다.

<docs-code language="ts">
TestBed.configureTestingModule({
  providers: [
    // ... 다른 테스트 제공자
    provideHttpClient(),
    provideHttpClientTesting(),
  ],
});

const httpTesting = TestBed.inject(HttpTestingController);
</docs-code>

이제 테스트가 요청을 만들면 정상적인 백엔드 대신 테스트 백엔드에 도달합니다. `httpTesting`을 사용하여 해당 요청에 대한 assertions를 수행할 수 있습니다.

## 요청 예상 및 응답 제공

예를 들어, 발생할 GET 요청을 예상하고 모킹 응답을 제공하는 테스트를 작성할 수 있습니다:

<docs-code language="ts">
TestBed.configureTestingModule({
  providers: [
    ConfigService,
    provideHttpClient(),
    provideHttpClientTesting(),
  ],
});

const httpTesting = TestBed.inject(HttpTestingController);

// `ConfigService`를 로드하고 현재 구성 요청.
const service = TestBed.inject(ConfigService);
const config$ = this.configService.getConfig<Config>();

// `firstValueFrom`이 `Observable`에 구독하여 HTTP 요청을 발생시키고,
// 응답의 `Promise`를 생성합니다.
const configPromise = firstValueFrom(config$);

// 이 시점에서 요청은 대기 중이며, `HttpTestingController`를 통해 요청이 만들어졌음을 assertion할 수 있습니다:
const req = httpTesting.expectOne('/api/config', '구성을 로드하기 위한 요청');

// 원할 경우 요청의 다양한 속성을 assertion할 수 있습니다.
expect(req.request.method).toBe('GET');

// 요청을 flushing하면 완료되어 결과가 전달됩니다.
req.flush(DEFAULT_CONFIG);

// 그런 다음 `ConfigService`에 의해 응답이 성공적으로 전달되었음을 assertion할 수 있습니다:
expect(await configPromise).toEqual(DEFAULT_CONFIG);

// 마지막으로, 다른 요청이 없었음을 assertion할 수 있습니다.
httpTesting.verify();
</docs-code>

참고: `expectOne`은 테스트가 주어진 기준과 일치하는 요청을 두 개 이상 생성한 경우 실패합니다.

`req.method`에 대한 assertion의 대안으로, 요청 메서드도 일치하도록 `expectOne`의 확장된 형태를 사용할 수 있습니다:

<docs-code language="ts">
const req = httpTesting.expectOne({
  method: 'GET',
  url: '/api/config',
}, '구성을 로드하기 위한 요청');
</docs-code>

유용한 점: expectation API는 쿼리 매개변수를 포함하여 요청의 전체 URL과 일치합니다.

마지막 단계인 미결 요청이 없음을 확인하는 것은 충분히 일반적이므로 `afterEach()` 단계로 이동할 수 있습니다:

<docs-code language="ts">
afterEach(() => {
  // 테스트가 추가 HTTP 요청을 하지 않는지 확인합니다.
  TestBed.inject(HttpTestingController).verify();
});
</docs-code>

## 한 번에 여러 요청 처리

테스트에서 중복 요청에 응답해야 하는 경우 `expectOne()` 대신 `match()` API를 사용하세요. 동일한 인수를 사용하지만 일치하는 요청의 배열을 반환합니다. 반환된 후 이러한 요청은 향후 일치에서 제거되며, flushing 및 확인에 대한 책임이 있습니다.

<docs-code language="ts">
const allGetRequests = httpTesting.match({method: 'GET'});
for (const req of allGetRequests) {
  // 각 요청에 대한 응답을 처리합니다.
}
</docs-code>

## 고급 매칭

모든 매칭 함수는 사용자 정의 매칭 로직을 위한 조건 함수(predicated function)를 수용합니다:

<docs-code language="ts">
// 요청 본문이 있는 요청을 찾습니다.
const requestsWithBody = httpTesting.expectOne(req => req.body !== null);
</docs-code>

`expectNone` 함수는 주어진 기준에 맞는 요청이 없음을 assertion합니다.

<docs-code language="ts">
// 변환 요청이 발행되지 않았음을 assertion합니다.
httpTesting.expectNone(req => req.method !== 'GET');
</docs-code>

## 오류 처리 테스트

HTTP 요청이 실패할 때 앱의 응답을 테스트해야 합니다.

### 백엔드 오류

백엔드 오류(서버가 비성공적인 상태 코드를 반환하는 경우)를 처리하는 테스트를 위해 요청이 실패할 때 백엔드가 반환할 응답을 모방하는 오류 응답으로 요청을 flushing합니다.

<docs-code language="ts">
const req = httpTesting.expectOne('/api/config');
req.flush('실패!', {status: 500, statusText: '내부 서버 오류'});

// 애플리케이션이 백엔드 오류를 성공적으로 처리했음을 assertion합니다.
</docs-code>

### 네트워크 오류

요청은 네트워크 오류로 인해 실패할 수도 있으며, 이러한 오류는 `ProgressEvent` 오류로 나타납니다. 이들은 `error()` 메서드를 사용하여 전달될 수 있습니다:

<docs-code language="ts">
const req = httpTesting.expectOne('/api/config');
req.error(new ProgressEvent('네트워크 오류!'));

// 애플리케이션이 네트워크 오류를 성공적으로 처리했음을 assertion합니다.
</docs-code>

## 인터셉터 테스트

인터셉터가 원하는 상황에서 작동하는지 테스트해야 합니다.

예를 들어, 애플리케이션이 각 아웃고잉 요청에 대해 서비스에서 생성된 인증 토큰을 추가해야 할 수 있습니다.
이 동작은 인터셉터를 사용하여 시행할 수 있습니다:

<docs-code language="ts">
export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);

  const clonedRequest = request.clone({
    headers: request.headers.append('X-Authentication-Token', authService.getAuthToken()),
  });
  return next(clonedRequest);
}
</docs-code>

이 인터셉터의 `TestBed` 구성은 `withInterceptors` 기능에 의존해야 합니다.

<docs-code language="ts">
TestBed.configureTestingModule({
  providers: [
    AuthService,
    // 한 번에 하나의 인터셉터를 테스트하는 것이 좋습니다.
    provideHttpClient(withInterceptors([authInterceptor])),
    provideHttpClientTesting(),
  ],
});
</docs-code>

`HttpTestingController`는 요청 인스턴스를 검색할 수 있으며, 요청이 수정되었는지 확인할 수 있습니다.

<docs-code language="ts">
const service = TestBed.inject(AuthService);
const req = httpTesting.expectOne('/api/config');

expect(req.request.headers.get('X-Authentication-Token')).toEqual(service.getAuthToken());
</docs-code>

유사한 인터셉터는 클래스 기반 인터셉터로 구현할 수 있습니다: 

<docs-code language="ts">
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const clonedRequest = request.clone({
      headers: request.headers.append('X-Authentication-Token', this.authService.getAuthToken()),
    });
    return next.handle(clonedRequest);
  }
}
</docs-code>

테스트할 수 있도록 `TestBed` 구성은 다음과 같아야 합니다:

<docs-code language="ts">
TestBed.configureTestingModule({
  providers: [
    AuthService,
    provideHttpClient(withInterceptorsFromDi()),
    provideHttpClientTesting(), 
    // HTTP_INTERCEPTORS 토큰을 사용하여 AuthInterceptor를 HttpInterceptor로 등록합니다.
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
});
</docs-code>