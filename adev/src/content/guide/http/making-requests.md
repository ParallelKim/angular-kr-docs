# HTTP 요청 만들기

`HttpClient`는 데이터를 불러오거나 서버에서 변형을 적용하기 위해 요청을 만드는 데 사용되는 다양한 HTTP 동사에 해당하는 메서드를 가지고 있습니다. 각 메서드는 요청을 보내고 서버가 응답할 때 결과를 방출하는 [RxJS `Observable`](https://rxjs.dev/guide/observable)를 반환합니다.

참고: `HttpClient`로 생성된 `Observable`은 몇 번이라도 구독할 수 있으며, 각 구독마다 새 백엔드 요청을 만듭니다.

요청 메서드에 전달된 옵션 객체를 통해 요청의 다양한 속성과 반환된 응답 유형을 조정할 수 있습니다.

## JSON 데이터 가져오기

백엔드에서 데이터를 가져올 때는 종종 [`HttpClient.get()`](api/common/http/HttpClient#get) 메서드를 사용하여 GET 요청을 수행해야 합니다. 이 메서드는 두 개의 인수를 취합니다: 데이터를 가져올 문자열 엔드포인트 URL과 요청을 구성하기 위한 *선택적 옵션* 객체입니다.

예를 들어, `HttpClient.get()` 메서드를 사용하여 가상의 API에서 구성 데이터를 가져오는 방법은 다음과 같습니다:

<docs-code language="ts">
http.get<Config>('/api/config').subscribe(config => {
  // 구성 처리
});
</docs-code>

서버가 반환하는 데이터가 `Config` 유형이 될 것이라고 지정하는 일반 타입 인수를 주의하세요. 이 인수는 선택 사항이며, 생략하면 반환되는 데이터의 유형은 `Object`가 됩니다.

팁: 구조가 불확실하고 잠재적으로 `undefined` 또는 `null` 값을 처리할 때는 응답 유형으로 `Object` 대신 `unknown` 유형을 사용하는 것을 고려하세요.

중요: 요청 메서드의 일반 타입은 서버가 반환하는 데이터에 대한 **단언**입니다. `HttpClient`는 실제 반환 데이터가 이 타입과 일치하는지 확인하지 않습니다.

## 다른 유형의 데이터 가져오기

기본적으로 `HttpClient`는 서버가 JSON 데이터를 반환할 것이라고 가정합니다. 비-JSON API와 상호작용할 때는 요청 시 예상 및 반환할 응답 유형을 `HttpClient`에 전달할 수 있습니다. 이는 `responseType` 옵션으로 수행됩니다.

| **`responseType` 값** | **반환된 응답 유형** |
| - | - |
| `'json'` (기본값) | 주어진 일반 유형의 JSON 데이터 |
| `'text'` | 문자열 데이터 |
| `'arraybuffer'` | 원시 응답 바이트를 포함하는 [`ArrayBuffer`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) |
| `'blob'` | [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob) 인스턴스 |

예를 들어, `HttpClient`에 `.jpeg` 이미지의 원시 바이트를 `ArrayBuffer`로 다운로드하도록 요청할 수 있습니다:

<docs-code language="ts">
http.get('/images/dog.jpg', {responseType: 'arraybuffer'}).subscribe(buffer => {
  console.log('이미지가 ' + buffer.byteLength + ' 바이트 크기입니다');
});
</docs-code>

<docs-callout important title="`responseType`에 대한 리터럴 값">
`responseType`의 값은 `HttpClient`가 반환하는 타입에 영향을 미치므로, 리터럴 타입이어야 하며 `string` 타입이 되어서는 안 됩니다.

이것은 요청 메서드에 전달된 옵션 객체가 리터럴 객체일 경우 자동으로 발생하지만, 요청 옵션을 변수나 헬퍼 메서드로 분리하는 경우 리터럴로 명시해야 할 수 있습니다. 예: `responseType: 'text' as const`.
</docs-callout>

## 서버 상태 변경

변형을 수행하는 서버 API는 종종 새로운 상태나 변경사항을 지정하는 요청 본체를 포함하는 POST 요청을 수행해야 합니다.

[`HttpClient.post()`](api/common/http/HttpClient#post) 메서드는 `get()`와 유사하게 동작하며, 옵션 전에 추가적인 `body` 인수를 수락합니다:

<docs-code language="ts">
http.post<Config>('/api/config', newConfig).subscribe(config => {
  console.log('업데이트된 구성:', config);
});
</docs-code>

요청의 `body`로 제공할 수 있는 다양한 유형의 값이 있으며, `HttpClient`는 그에 따라 직렬화합니다:

| **`body` 유형** | **직렬화된 형태** |
| - | - |
| 문자열 | 일반 텍스트 |
| 숫자, 불린, 배열, 또는 일반 객체 | JSON |
| [`ArrayBuffer`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) | 버퍼의 원시 데이터 |
| [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob) | `Blob`의 콘텐츠 유형을 가진 원시 데이터 |
| [`FormData`](https://developer.mozilla.org/docs/Web/API/FormData) | `multipart/form-data`로 인코딩된 데이터 |
| [`HttpParams`](api/common/http/HttpParams) 또는 [`URLSearchParams`](https://developer.mozilla.org/docs/Web/API/URLSearchParams) | `application/x-www-form-urlencoded` 형식의 문자열 |

중요: 요청을 실제로 발생시키기 위해 변형 요청 `Observable`에 반드시 `.subscribe()` 해야 합니다.

## URL 매개변수 설정

요청 URL에 포함되어야 할 요청 매개변수를 `params` 옵션을 사용하여 지정합니다.

객체 리터럴을 전달하는 것이 URL 매개변수를 구성하는 가장 간단한 방법입니다:

<docs-code language="ts">
http.get('/api/config', {
  params: {filter: 'all'},
}).subscribe(config => {
  // ...
});
</docs-code>

또는 매개변수의 구성이나 직렬화에 대한 추가적인 제어가 필요하면 `HttpParams` 인스턴스를 전달합니다.

중요: `HttpParams`의 인스턴스는 _불변_이며 직접 변경할 수 없습니다. 대신, `append()`와 같은 변형 메서드는 변형이 적용된 새로운 `HttpParams` 인스턴스를 반환합니다.

<docs-code language="ts">
const baseParams = new HttpParams().set('filter', 'all');

http.get('/api/config', {
  params: baseParams.set('details', 'enabled'),
}).subscribe(config => {
  // ...
});
</docs-code>

사용자가 `HttpClient`가 매개변수를 URL에 어떻게 인코딩할지를 결정하는 사용자 정의 `HttpParameterCodec`로 `HttpParams`를 인스턴스화할 수 있습니다.

## 요청 헤더 설정

요청에 포함되어야 할 요청 헤더를 `headers` 옵션을 사용하여 지정합니다.

객체 리터럴을 전달하는 것이 요청 헤더를 구성하는 가장 간단한 방법입니다:

<docs-code language="ts">
http.get('/api/config', {
  headers: {
    'X-Debug-Level': 'verbose',
  }
}).subscribe(config => {
  // ...
});
</docs-code>

또는 헤더 구조에 대한 더 많은 제어가 필요하면 `HttpHeaders`의 인스턴스를 전달합니다.

중요: `HttpHeaders`의 인스턴스는 _불변_이며 직접 변경할 수 없습니다. 대신, `append()`와 같은 변형 메서드는 변형이 적용된 새로운 `HttpHeaders` 인스턴스를 반환합니다.

<docs-code language="ts">
const baseHeaders = new HttpHeaders().set('X-Debug-Level', 'minimal');

http.get<Config>('/api/config', {
  headers: baseHeaders.set('X-Debug-Level', 'verbose'),
}).subscribe(config => {
  // ...
});
</docs-code>

## 서버 응답 이벤트와 상호작용

편의를 위해, `HttpClient`는 기본적으로 서버가 반환하는 데이터의 `Observable` (응답 본문)을 반환합니다. 때때로 특정 응답 헤더를 검색하는 등의 이유로 실제 응답을 조사하는 것이 바람직합니다.

전체 응답에 접근하려면 `observe` 옵션을 `'response'`로 설정합니다:

<docs-code language="ts">
http.get<Config>('/api/config', {observe: 'response'}).subscribe(res => {
  console.log('응답 상태:', res.status);
  console.log('본문:', res.body);
});
</docs-code>

<docs-callout important title="`observe`에 대한 리터럴 값">
`observe`의 값은 `HttpClient`가 반환하는 타입에 영향을 미치므로, 리터럴 타입이어야 하며 `string` 타입이 되어서는 안 됩니다.

이것은 요청 메서드에 전달된 옵션 객체가 리터럴 객체일 경우 자동으로 발생하지만, 요청 옵션을 변수나 헬퍼 메서드로 분리하는 경우 리터럴로 명시해야 할 수 있습니다. 예: `observe: 'response' as const`.
</docs-callout>

## 원시 진행 상태 이벤트 수신

응답 본문이나 응답 객체 외에도 `HttpClient`는 요청 생명주기의 특정 순간에 해당하는 원시 _이벤트_의 스트림을 반환할 수도 있습니다. 이러한 이벤트에는 요청이 전송되는 시점, 응답 헤더가 반환되는 시점 및 본체가 완료되는 시점이 포함됩니다. 이러한 이벤트는 대규모 요청 또는 응답 본체에 대한 업로드 및 다운로드 상태를 보고하는 _진행 상태 이벤트_를 포함할 수 있습니다.

진행 상태 이벤트는 기본적으로 비활성화되어 있으며(성능 비용이 발생함) `reportProgress` 옵션을 통해 활성화할 수 있습니다.

참고: `HttpClient`의 선택적 `fetch` 구현은 _업로드_ 진행 상태 이벤트를 보고하지 않습니다.

이벤트 스트림을 관찰하려면 `observe` 옵션을 `'events'`로 설정합니다:

<docs-code language="ts">
http.post('/api/upload', myData, {
  reportProgress: true,
  observe: 'events',
}).subscribe(event => {
  switch (event.type) {
    case HttpEventType.UploadProgress:
      console.log('업로드된 ' + event.loaded + ' 바이트 중 ' + event.total + ' 바이트');
      break;
    case HttpEventType.Response:
      console.log('업로드 완료!');
      break;
  }
});
</docs-code>

<docs-callout important title="`observe`에 대한 리터럴 값">
`observe`의 값은 `HttpClient`가 반환하는 타입에 영향을 미치므로, 리터럴 타입이어야 하며 `string` 타입이 되어서는 안 됩니다.

이것은 요청 메서드에 전달된 옵션 객체가 리터럴 객체일 경우 자동으로 발생하지만, 요청 옵션을 변수나 헬퍼 메서드로 분리하는 경우 리터럴로 명시해야 할 수 있습니다. 예: `observe: 'events' as const`.
</docs-callout>

이벤트 스트림에서 보고된 각 `HttpEvent`는 이벤트가 무엇을 나타내는지를 구별하는 `type`을 가지고 있습니다:

| **`type` 값** | **이벤트 의미** |
| - | - |
| `HttpEventType.Sent` | 요청이 서버에 전송되었습니다 |
| `HttpEventType.UploadProgress` | 요청 본체 업로드 진행 상황을 보고하는 `HttpUploadProgressEvent` |
| `HttpEventType.ResponseHeader` | 상태 및 헤더를 포함한 응답의 헤드가 수신되었습니다 |
| `HttpEventType.DownloadProgress` | 응답 본체 다운로드 진행 상황을 보고하는 `HttpDownloadProgressEvent` |
| `HttpEventType.Response` | 응답 본체를 포함한 전체 응답이 수신되었습니다 |
| `HttpEventType.User` | Http 인터셉터에서 전송된 사용자 정의 이벤트입니다.

## 요청 실패 처리

HTTP 요청이 실패할 수 있는 두 가지 방식이 있습니다:

* 네트워크 또는 연결 오류가 요청이 백엔드 서버에 도달하는 것을 방지할 수 있습니다.
* 백엔드는 요청을 수신하지만 처리에 실패하여 오류 응답을 반환할 수 있습니다.

`HttpClient`는 두 가지 유형의 오류를 `HttpErrorResponse`로 캡처하여 `Observable`의 오류 채널을 통해 반환합니다. 네트워크 오류는 `status` 코드가 `0`이고, `error`는 [`ProgressEvent`](https://developer.mozilla.org/docs/Web/API/ProgressEvent)의 인스턴스입니다. 백엔드 오류는 백엔드에서 반환된 실패하는 `status` 코드 및 오류 응답을 `error`로 가집니다. 응답을 검사하여 오류의 원인과 이를 처리하기 위한 적절한 조치를 식별합니다.

[RxJS 라이브러리](https://rxjs.dev/)는 오류 처리를 위해 유용할 수 있는 여러 연산자를 제공합니다.

`catchError` 연산자를 사용하여 오류 응답을 UI용 값으로 변환할 수 있습니다. 이 값은 UI에 오류 페이지나 값을 표시하라고 지시하고, 필요 시 오류의 원인을 캡처할 수 있습니다.

때때로 네트워크 중단과 같은 일시적인 오류로 인해 요청이 예기치 않게 실패할 수 있으며, 단순히 요청을 다시 시도하면 성공할 수 있습니다. RxJS는 특정 조건에서 실패한 `Observable`을 자동으로 다시 구독하는 여러 *재시도* 연산자를 제공합니다. 예를 들어, `retry()` 연산자는 지정된 횟수만큼 자동으로 다시 구독을 시도합니다.

## Http `Observable`

`HttpClient`의 각 요청 메서드는 요청된 응답 유형의 `Observable`을 구성하고 반환합니다. 이러한 `Observable`이 작동하는 방식을 이해하는 것은 `HttpClient`를 사용할 때 중요합니다.

`HttpClient`는 RxJS에서 "콜드" `Observable`이라고 부르며, 이는 `Observable`이 구독될 때까지 실제 요청이 발생하지 않는 것을 의미합니다. 구독해야 요청이 실제로 서버에 전송됩니다. 동일한 `Observable`에 여러 번 구독하면 여러 백엔드 요청이 발생합니다. 각 구독은 독립적입니다.

팁: `HttpClient`의 `Observable`을 실제 서버 요청에 대한 _청사진_으로 생각할 수 있습니다.

구독한 후 구독 취소는 진행 중인 요청을 중단합니다. 이는 `Observable`이 `async` 파이프를 통해 구독되는 경우 매우 유용하며, 사용자가 현재 페이지에서 탐색할 경우 요청을 자동으로 취소합니다. 또한 RxJS의 조합자 `switchMap`과 함께 `Observable`을 사용할 경우 이 취소는 오래된 요청을 정리합니다.

응답이 반환되면 `HttpClient`의 `Observable`은 일반적으로 완료됩니다(인터셉터가 이를 영향을 미칠 수 있음).

자동 완성 덕분에 `HttpClient` 구독이 정리되지 않더라도 메모리 누수의 위험은 일반적으로 없습니다. 그러나 모든 비동기 작업과 마찬가지로, 사용하는 컴포넌트가 파괴될 때 구독을 정리할 것을 강력히 권장합니다. 그렇지 않으면 구독 콜백이 실행되어 파괴된 컴포넌트와 상호작용하려고 할 때 오류가 발생할 수 있습니다.

팁: `Observable`에 구독하기 위해 `async` 파이프나 `toSignal` 연산자를 사용하면 구독이 적절히 해제됩니다.

## 모범 사례

`HttpClient`를 컴포넌트에서 직접 주입하고 사용할 수 있지만, 일반적으로 재사용 가능한 주입 가능한 서비스를 생성하여 데이터 접근 로직을 격리하고 캡슐화하는 것을 권장합니다. 예를 들어, 이 `UserService`는 사용자 ID로 데이터를 요청하는 로직을 캡슐화합니다:

<docs-code language="ts">
@Injectable({providedIn: 'root'})
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/user/${id}`);
  }
}
</docs-code>

컴포넌트 내에서 `@if`를 `async` 파이프와 결합하여 데이터가 로딩을 마친 후에만 UI를 렌더링할 수 있습니다:

<docs-code language="ts">
import { AsyncPipe } from '@angular/common';
@Component({
  imports: [AsyncPipe],
  template: `
    @if (user$ | async; as user) {
      <p>이름: {{ user.name }}</p>
      <p>전기: {{ user.biography }}</p>
    }
  `,
})
export class UserProfileComponent {
  @Input() userId!: string;
  user$!: Observable<User>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.user$ = this.userService.getUser(this.userId);
  }
}
</docs-code>