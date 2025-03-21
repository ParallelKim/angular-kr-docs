# 서버 및 하이브리드 렌더링

## 하이브리드 렌더링이란?

하이브리드 렌더링은 서버 사이드 렌더링(SSR), 사전 렌더링(정적 사이트 생성 또는 SSG이라고도 함) 및 클라이언트 사이드 렌더링(CSR)의 이점을 결합하여 Angular 애플리케이션을 최적화합니다. 이를 통해 애플리케이션의 서로 다른 부분을 서로 다른 전략을 사용하여 렌더링할 수 있으며, 앱이 사용자에게 제공되는 방식에 대해 세밀한 제어를 제공합니다.

## 하이브리드 렌더링 설정

Angular CLI를 사용하여 서버 사이드 렌더링이 포함된 **새** 프로젝트를 생성할 수 있습니다:

```shell
ng new --ssr
```

기존 프로젝트에 서버 사이드 렌더링을 추가하려면 `ng add` 명령을 사용할 수 있습니다:

```shell
ng add @angular/ssr
```

참고: 기본적으로 Angular는 전체 애플리케이션을 사전 렌더링하고 서버 파일을 생성합니다. 이를 비활성화하고 완전 정적 앱을 만들려면 `outputMode`를 `static`으로 설정합니다. SSR을 활성화하려면 서버 라우트를 `RenderMode.Server`를 사용하도록 업데이트하십시오.
자세한 사항은 [`서버 라우팅`](#server-routing) 및 [`완전히 정적 애플리케이션 생성`](#generate-a-fully-static-application)을 참조하세요.

## 서버 라우팅

### 서버 라우트 구성

`[ServerRoute](api/ssr/ServerRoute 'API reference')` 객체의 배열을 선언하여 서버 라우트 구성을 생성할 수 있습니다. 이 구성은 일반적으로 `app.routes.server.ts`라는 파일에 위치합니다.

```typescript
// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '', // 이 경로는 클라이언트에서 "/" 라우트를 렌더링합니다 (CSR)
    renderMode: RenderMode.Client,
  },
  {
    path: 'about', // 이 페이지는 정적이므로 사전 렌더링합니다 (SSG)
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'profile', // 이 페이지는 사용자 특정 데이터를 요구하므로 SSR을 사용합니다
    renderMode: RenderMode.Server,
  },
  {
    path: '**', // 다른 모든 경로는 서버에서 렌더링됩니다 (SSR)
    renderMode: RenderMode.Server,
  },
];
```

[`withRoutes`](api/ssr/withRoutes 'API reference') 함수를 사용하여 [`provideServerRendering`](api/ssr/provideServerRendering 'API reference') 구성을 애플리케이션에 추가할 수 있습니다.


```typescript
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

// app.config.server.ts
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // ... 기타 공급자 ...
  ]
};
```

[App shell 패턴](ecosystem/service-workers/app-shell)을 사용할 때, 클라이언트 사이드 렌더링 라우트에 사용할 컴포넌트를 지정해야 합니다. 이를 위해 [`withAppShell`](api/ssr/withAppShell 'API reference') 기능을 사용합니다:

```typescript
import { provideServerRendering, withRoutes, withAppShell } from '@angular/ssr';
import { AppShellComponent } from './app-shell/app-shell.component';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(
      withRoutes(serverRoutes),
      withAppShell(AppShellComponent),
    ),
    // ... 기타 공급자 ...
  ]
};
```

### 렌더링 모드

서버 라우팅 구성은 각 경로를 어떻게 렌더링할지 [`RenderMode`](api/ssr/RenderMode 'API reference') 설정으로 명시할 수 있습니다:

| 렌더링 모드      | 설명                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **서버 (SSR)**    | 각 요청에 대해 서버에서 애플리케이션을 렌더링하여 브라우저에 완전히 채워진 HTML 페이지를 보냅니다.             |
| **클라이언트 (CSR)**| 브라우저에서 애플리케이션을 렌더링합니다. 이는 기본 Angular 동작입니다.                                      |
| **사전 렌더링 (SSG)**| 빌드 타임에 애플리케이션을 사전 렌더링하여 각 경로에 대한 정적 HTML 파일을 생성합니다.                       |

#### 렌더링 모드 선택

각 렌더링 모드에는 장단점이 있습니다. 애플리케이션의 특정 요구 사항에 따라 렌더링 모드를 선택할 수 있습니다.

##### 클라이언트 사이드 렌더링

클라이언트 사이드 렌더링은 가장 간단한 개발 모델을 가지고 있습니다. 항상 웹 브라우저에서 실행된다고 가정하고 코드를 쓸 수 있습니다. 이렇게 하면 웹 브라우저에서 실행된다고 가정하는 다양한 클라이언트 사이드 라이브러리를 사용할 수 있습니다.

클라이언트 사이드 렌더링은 다른 렌더링 모드보다 일반적으로 성능이 더 낮습니다. 사용자가 렌더링된 콘텐츠를 보기 전에 페이지의 JavaScript를 다운로드, 파싱 및 실행해야 하기 때문입니다. 페이지가 렌더링되는 동안 서버에서 추가 데이터를 가져온다면, 사용자 또한 전체 콘텐츠를 보기 전에 추가 요청을 기다려야 합니다.

페이지가 검색 크롤러에 의해 인덱싱된다면, 클라이언트 사이드 렌더링은 검색 엔진 최적화(SEO)에 부정적인 영향을 미칠 수 있습니다. 왜냐하면 검색 크롤러는 페이지를 인덱싱할 때 실행하는 JavaScript의 양에 제한이 있기 때문입니다.

클라이언트 사이드 렌더링을 할 때, 서버는 정적 JavaScript 자산을 제공하는 것 외에는 페이지를 렌더링할 작업을 할 필요가 없습니다. 서버 비용이 걱정이라면 이 점을 고려할 수 있습니다.

[서비스 워커](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)를 통해 설치 가능한 오프라인 경험을 지원하는 애플리케이션은 서버와의 통신 없이 클라이언트 사이드 렌더링에 의존할 수 있습니다.

##### 서버 사이드 렌더링

서버 사이드 렌더링은 클라이언트 사이드 렌더링보다 더 빠른 페이지 로드를 제공합니다. JavaScript가 다운로드되고 실행되는 것을 기다리는 대신, 서버는 브라우저의 요청을 받은 즉시 HTML 문서를 직접 렌더링합니다. 사용자는 데이터를 가져오고 요청된 페이지를 렌더링하는 데 필요한 지연 시간만 경험하게 됩니다. 이 모드는 서버에서 렌더링 중 데이터를 가져올 수 있으므로 브라우저에서의 추가 네트워크 요청이 필요하지 않습니다.

서버 사이드 렌더링은 검색 크롤러가 완전히 렌더링된 HTML 문서를 수신하므로 일반적으로 뛰어난 검색 엔진 최적화(SEO)를 제공합니다.

서버 사이드 렌더링은 브라우저 API에 엄격히 의존하지 않는 코드를 작성해야 하며, 브라우저에서 실행될 것이라고 가정하는 JavaScript 라이브러리의 선택을 제한합니다.

서버 사이드 렌더링을 할 때, 서버는 각 요청에 대해 HTML 응답을 생성하기 위해 Angular를 실행하므로 서버 호스팅 비용이 증가할 수 있습니다.

##### 빌드 타임 사전 렌더링

사전 렌더링은 클라이언트 사이드 렌더링 및 서버 사이드 렌더링보다 더 빠른 페이지 로드를 제공합니다. 빌드 타임에 HTML 문서를 생성하므로, 서버는 추가 작업 없이 정적 HTML 문서로 요청에 직접 응답할 수 있습니다.

사전 렌더링에는 페이지 렌더링에 필요한 모든 정보가 _빌드 타임_에 사용 가능해야 합니다. 이는 사전 렌더링된 페이지가 페이지를 로드하는 특정 사용자에 대한 데이터를 포함할 수 없음을 의미합니다. 사전 렌더링은 애플리케이션의 모든 사용자에게 동일한 페이지에 주로 유용합니다.

사전 렌더링은 빌드 타임에 발생하므로, 배포를 위한 생산 빌드에 상당한 시간을 추가할 수 있습니다. [`getPrerenderParams`](api/ssr/ServerRoutePrerenderWithParams#getPrerenderParams 'API reference')를 사용하여 대량의 HTML 문서를 생성하면 배포의 총 파일 크기에 영향을 미치고 결과적으로 느린 배포로 이어질 수 있습니다.

사전 렌더링은 검색 크롤러가 완전히 렌더링된 HTML 문서를 수신하므로 일반적으로 뛰어난 검색 엔진 최적화(SEO)를 제공합니다.

사전 렌더링은 브라우저 API에 엄격히 의존하지 않는 코드를 작성해야 하며, 브라우저에서 실행될 것이라고 가정하는 JavaScript 라이브러리의 선택을 제한합니다.

사전 렌더링은 서버 요청당 매우 적은 오버헤드가 발생하므로 서버가 정적 HTML 문서로 응답합니다. 정적 파일은 또한 CDN(콘텐츠 배달 네트워크), 브라우저 및 중간 캐싱 계층에 의해 쉽게 캐시되어 후속 페이지 로드를 더욱 빠르게 할 수 있습니다. 완전 정적 사이트는 CDN이나 정적 파일 서버를 통해 배포할 수 있으며, 애플리케이션에 대한 맞춤형 서버 런타임을 유지할 필요가 없습니다. 이를 통해 애플리케이션 웹 서버의 작업을 분산시켜 확장성을 향상시켜 높은 트래픽 애플리케이션에 특히 유리합니다.

참고: Angular 서비스 워커를 사용할 때, 첫 번째 요청은 서버에서 렌더링되지만 모든 후속 요청은 서비스 워커에 의해 처리되며 클라이언트 측에서 렌더링됩니다.

### 헤더 및 상태 코드 설정

`ServerRoute` 구성에서 `headers` 및 `status` 속성을 사용하여 개별 서버 경로에 대한 사용자 정의 헤더 및 상태 코드를 설정할 수 있습니다.

```typescript
// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'profile',
    renderMode: RenderMode.Server,
    headers: {
      'X-My-Custom-Header': 'some-value',
    },
    status: 201,
  },
  // ... 다른 경로들
];
```

### 리디렉션

Angular는 서버 사이드에서 라우트 구성을 이용해 [`redirectTo`](api/router/Route#redirectTo 'API reference') 속성으로 지정된 리디렉션을 처리합니다.

**서버 사이드 렌더링 (SSR)**
리디렉션은 서버 사이드 렌더링 과정에서 표준 HTTP 리디렉션(예: 301, 302)을 사용하여 수행됩니다.

**사전 렌더링 (SSG)**
리디렉션은 사전 렌더링된 HTML에서 [`<meta http-equiv="refresh">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#refresh) 태그를 사용하여 "소프트 리디렉션"으로 구현됩니다.

### 빌드 타임 사전 렌더링 사용자 지정을 (SSG)

[`RenderMode.Prerender`](api/ssr/RenderMode#Prerender 'API reference')를 사용할 때, 사전 렌더링 및 제공 프로세스를 사용자 지정하기 위해 여러 구성 옵션을 지정할 수 있습니다.

#### 매개변수화된 경로

[`RenderMode.Prerender`](api/ssr/RenderMode#Prerender 'API reference')가 있는 각 경로에 대해 [`getPrerenderParams`](api/ssr/ServerRoutePrerenderWithParams#getPrerenderParams 'API reference') 함수를 지정할 수 있습니다. 이 함수는 어떤 특정 매개변수가 별도의 사전 렌더링 문서를 생성하는지 제어할 수 있게 해줍니다.

[`getPrerenderParams`](api/ssr/ServerRoutePrerenderWithParams#getPrerenderParams 'API reference') 함수는 배열 객체로 해결되는 `Promise`를 반환합니다. 각 객체는 경로 매개변수 이름과 값의 키-값 맵입니다. 예를 들어 `posts/:id`와 같은 경로를 정의하면 `getPrerenderParams`는 배열 `[{id: 123}, {id: 456}]`을 반환하고, 따라서 `posts/123` 및 `posts/456`에 대한 별도의 문서를 렌더링합니다.

[`getPrerenderParams`](api/ssr/ServerRoutePrerenderWithParams#getPrerenderParams 'API reference')의 본문은 Angular의 [`inject`](api/core/inject 'API reference') 함수를 사용하여 종속성을 주입하고 어떤 경로를 사전 렌더링할지 결정하는 작업을 수행할 수 있습니다. 이는 일반적으로 매개변수 값의 배열을 구성하기 위해 데이터를 가져오는 요청을 포함합니다.

```typescript
// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'post/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const dataService = inject(PostService);
      const ids = await dataService.getIds(); // 이 반환값은 ['1', '2', '3']이라 가정

      return ids.map(id => ({ id })); // 사전 렌더링을 위한 객체 배열로 ID 변환

      // 이로 인해 다음 경로가 사전 렌더링됩니다: `/post/1`, `/post/2` 및 `/post/3`
    },
  },
];
```

[`getPrerenderParams`](api/ssr/ServerRoutePrerenderWithParams#getPrerenderParams 'API reference')는 [`RenderMode.Prerender`](api/ssr/RenderMode#Prerender 'API reference')에만 적용되므로 이 함수는 항상 _빌드 타임_에 실행됩니다. `getPrerenderParams`는 데이터를 위해 어떤 브라우저 특화 또는 서버 특화 API에도 의존해서는 안 됩니다.

중요: `getPrerenderParams` 내부에서 [`inject`](api/core/inject 'API reference')를 사용할 때는 `inject`가 동기적으로 사용되어야 합니다. 비동기 콜백 내에서 또는 어떤 `await` 문 이후에서 호출할 수 없습니다. 자세한 정보는 [`runInInjectionContext`](api/core/runInInjectionContext)를 참조하십시오.

#### 폴백 전략

[`RenderMode.Prerender`](api/ssr/RenderMode#Prerender 'API reference') 모드를 사용할 때, 사전 렌더링되지 않은 경로에 대한 요청을 처리하는 폴백 전략을 지정할 수 있습니다.

사용 가능한 폴백 전략은 다음과 같습니다:

- **서버:** 서버 사이드 렌더링으로 폴백합니다. 이는 `fallback` 속성이 지정되지 않은 경우의 **기본** 동작입니다.
- **클라이언트:** 클라이언트 사이드 렌더링으로 폴백합니다.
- **없음:** 폴백이 없습니다. Angular는 사전 렌더링되지 않은 경로의 요청을 처리하지 않습니다.

```typescript
// app.routes.server.ts
import { RenderMode, PrerenderFallback, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'post/:id',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client, // 사전 렌더링되지 않았을 때 CSR로 폴백
    async getPrerenderParams() {
      // 이 함수는 다음 경로에서 사전 렌더링된 게시물의 객체 배열을 반환합니다:
      // `/post/1`, `/post/2`, 및 `/post/3`.
      // 경로 `/post/4`는 요청 시 폴백 동작을 활용할 것입니다.
      return [{ id: 1 }, { id: 2 }, { id: 3 }];
    },
  },
];
```

## DI를 통한 요청 및 응답 액세스

`@angular/core` 패키지는 서버 사이드 렌더링 환경과 상호작용하기 위한 여러 토큰을 제공합니다. 이러한 토큰을 통해 Angular 애플리케이션 내에서 SSR 동안 중요한 정보와 객체에 액세스할 수 있습니다.

- **[`REQUEST`](api/core/REQUEST 'API reference'):** 현재 요청 객체에 대한 액세스를 제공합니다. 이는 웹 API의 [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) 유형입니다. 이를 통해 헤더, 쿠키 및 기타 요청 정보를 액세스할 수 있습니다.
- **[`RESPONSE_INIT`](api/core/RESPONSE_INIT 'API reference'):** 응답 초기화 옵션에 대한 액세스를 제공합니다. 이는 웹 API의 [`ResponseInit`](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#parameters) 유형입니다. 이를 사용하여 응답의 헤더 및 상태 코드를 동적으로 설정할 수 있습니다. 런타임에 결정해야 하는 헤더나 상태 코드를 설정할 때 이 토큰을 사용하십시오.
- **[`REQUEST_CONTEXT`](api/core/REQUEST_CONTEXT 'API reference'):** 현재 요청과 관련된 추가 컨텍스트에 대한 액세스를 제공합니다. 이 컨텍스트는 [`handle`](api/ssr/AngularAppEngine#handle 'API reference') 함수의 두 번째 매개변수로 전달할 수 있습니다. 일반적으로 이는 표준 웹 API의 일부가 아닌 추가 요청 관련 정보를 제공하는 데 사용됩니다.

```angular-ts
import { inject, REQUEST } from '@angular/core';

@Component({
  selector: 'app-my-component',
  template: `<h1>내 컴포넌트</h1>`,
})
export class MyComponent {
  constructor() {
    const request = inject(REQUEST);
    console.log(request?.url);
  }
}
```

중요: 위의 토큰은 다음 시나리오에서 `null`이 됩니다:
- 빌드 프로세스 중.
- 애플리케이션이 브라우저에서 렌더링될 때 (CSR).
- 정적 사이트 생성을 수행할 때 (SSG).
- 개발 중 경로 추출 시 (요청 시점).

## 서버 구성

### Node.js

`@angular/ssr/node`는 Node.js 환경을 위해 특별히 `@angular/ssr`를 확장합니다. 이는 Node.js 애플리케이션 내에서 서버 사이드 렌더링을 구현하는 데 더 쉽게 만드는 API를 제공합니다. 기능 및 사용 예에 대한 전체 목록은 [`@angular/ssr/node` API 참조](api/ssr/node/AngularNodeAppEngine)에서 참조하십시오.

```typescript
// server.ts
import { AngularNodeAppEngine, createNodeRequestHandler, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('*', (req, res, next) => {
  angularApp
    .handle(req)
    .then(response => {
      if (response) {
        writeResponseToNodeResponse(response, res);
      } else {
        next(); // 다음 미들웨어로 제어를 전달
      }
    })
    .catch(next);
});

/**
 * Angular CLI (dev-server 및 빌드 중)에서 사용하는 요청 핸들러입니다.
 */
export const reqHandler = createNodeRequestHandler(app);
```

### 비 Node.js

`@angular/ssr`는 Node.js 이외의 플랫폼에서 Angular 애플리케이션의 서버 사이드 렌더링을 위한 필수 API를 제공합니다. 이는 웹 API의 표준 [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) 및 [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) 객체를 활용하여 Angular SSR을 다양한 서버 환경에 통합할 수 있습니다. 자세한 정보 및 예제는 [`@angular/ssr` API 참조](api/ssr/AngularAppEngine)를 참조하십시오.

```typescript
// server.ts
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularApp = new AngularAppEngine();

/**
 * Angular CLI (dev-server 및 빌드 중)에 사용되는 요청 핸들러입니다.
 */
export const reqHandler = createRequestHandler(async (req: Request) => {
  const res: Response|null = await angularApp.render(req);

  // ...
});
```

## 완전 정적 애플리케이션 생성

기본적으로 Angular는 전체 애플리케이션을 사전 렌더링하고 요청을 처리하는 서버 파일을 생성합니다. 이를 통해 앱은 사용자에게 사전 렌더링된 콘텐츠를 제공할 수 있습니다. 그러나 서버 없이 완전 정적 사이트를 선호하는 경우, `angular.json` 구성 파일에서 `outputMode`를 `static`으로 설정하여 이 동작에서 벗어날 수 있습니다.

`outputMode`가 `static`으로 설정되면, Angular는 빌드 타임에 각 경로에 대한 사전 렌더링된 HTML 파일을 생성하지만, 서버 파일을 생성하지 않거나 앱을 제공하기 위해 Node.js 서버가 필요하지 않습니다. 이는 백엔드 서버가 필요 없는 정적 호스팅 제공업체에 배포하는 데 유용합니다.

이를 구성하려면 `angular.json` 파일을 다음과 같이 업데이트하십시오:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "prerender": {
          "options": {
            "outputMode": "static"
          }
        }
      }
    }
  }
}
```

## HttpClient를 사용할 때 데이터 캐싱

[`HttpClient`](api/common/http/HttpClient)는 서버에서 실행될 때 아웃고잉 네트워크 요청을 캐시합니다. 이 정보는 직렬화되어 서버에서 클라이언트로 전송된 초기 HTML의 일부로 전송됩니다. 브라우저에서 `HttpClient`는 캐시에 데이터가 있는지 확인하고, 그렇다면 초기 애플리케이션 렌더링 중에 새 HTTP 요청을 만들지 않고 이를 재사용합니다. 애플리케이션이 브라우저에서 실행 중일 때 `HttpClient`는 애플리케이션이 안정적이게 되면 캐시 사용을 중단합니다.

기본적으로 `HttpClient`는 `Authorization` 또는 `Proxy-Authorization` 헤더를 포함하지 않는 모든 `HEAD` 및 `GET` 요청을 캐시합니다. hydration을 제공할 때 [`withHttpTransferCacheOptions`](api/platform-browser/withHttpTransferCacheOptions)를 사용하여 이러한 설정을 재정의할 수 있습니다.

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withHttpTransferCacheOptions({
      includePostRequests: true
    }))
  ]
});
```

## 서버 호환 구성 요소 작성하기

일부 일반적인 브라우저 API 및 기능은 서버에서 사용 가능하지 않을 수 있습니다. 애플리케이션은 `window`, `document`, `navigator`, 또는 `location`과 같은 브라우저 특정 전역 객체를 사용할 수 없습니다. `HTMLElement`의 특정 속성도 마찬가지입니다.

일반적으로 브라우저 특정 심볼에 의존하는 코드는 서버가 아닌 브라우저에서만 실행되어야 합니다. 이는 [`afterRender`](api/core/afterRender) 및 [`afterNextRender`](api/core/afterNextRender) 생명주기 훅을 통해 강제할 수 있습니다. 이들은 브라우저에서만 실행되며 서버에서는 건너뛰어집니다.

```angular-ts
import { Component, ViewChild, afterNextRender } from '@angular/core';

@Component({
  selector: 'my-cmp',
  template: `<span #content>{{ ... }}</span>`,
})
export class MyComponent {
  @ViewChild('content') contentRef: ElementRef;

  constructor() {
    afterNextRender(() => {
      // `scrollHeight`를 확인하는 것이 안전합니다. 왜냐하면 이 코드는 브라우저에서만 실행되므로 서버에서는 실행되지 않기 때문입니다.
      console.log('내용 높이: ' + this.contentRef.nativeElement.scrollHeight);
    });
  }
}