# 라우터 참조

다음 섹션에서는 몇 가지 핵심 라우터 개념을 강조합니다.

## 라우터 임포트

Angular Router는 주어진 URL에 대한 특정 컴포넌트 뷰를 제공하는 선택적 서비스입니다.  
이는 Angular의 핵심 부분이 아니므로 별도의 라이브러리 패키지인 `@angular/router`에 있습니다.

다른 Angular 패키지에서와 같이 필요한 것을 가져옵니다.

```ts
import { provideRouter } from '@angular/router';
```

도움이 됨: 브라우저 URL 스타일에 대한 자세한 내용은 [`LocationStrategy` 및 브라우저 URL 스타일](guide/routing/common-router-tasks#browser-url-styles)을 참조하세요.

## 구성

라우팅된 Angular 애플리케이션은 `Router` 서비스의 단일 인스턴스를 가집니다.  
브라우저의 URL이 변경되면 해당 라우터는 어떤 구성 요소를 표시할지 결정하기 위해 해당하는 `Route`를 찾습니다.

라우터는 구성할 때까지 경로가 없습니다.  
다음 예제는 5개의 경로 정의를 생성하고 `provideRouter` 메서드를 통해 라우터를 구성한 다음 결과를 `ApplicationConfig`의 `providers` 배열에 추가합니다.

```ts
const appRoutes: Routes = [
  { path: 'crisis-center', component: CrisisListComponent },
  { path: 'hero/:id',      component: HeroDetailComponent },
  {
    path: 'heroes',
    component: HeroListComponent,
    data: { title: 'Heroes List' }
  },
  { path: '',
    redirectTo: '/heroes',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];
export const appConfig: ApplicationConfig = {
    providers: [provideRouter(appRoutes, withDebugTracing())]
}
```

`routes` 배열은 탐색 방법을 설명합니다.  
이를 `ApplicationConfig`의 `providers`에서 `provideRouter` 메서드에 전달하여 라우터를 구성합니다.

각 `Route`는 URL `path`를 구성 요소에 매핑합니다.  
경로에는 선행 슬래시가 없습니다.  
라우터는 최종 URL을 파싱하고 빌드해 주므로 애플리케이션 뷰 간 탐색 시 상대 경로와 절대 경로를 모두 사용할 수 있습니다.

두 번째 경로의 `:id`는 경로 매개변수의 토큰입니다.  
`/hero/42`와 같은 URL에서 "42"는 `id` 매개변수의 값입니다.  
해당하는 `HeroDetailComponent`는 해당 값을 사용하여 `id`가 42인 영웅을 찾고 표시합니다.

세 번째 경로의 `data` 속성은 특정 경로와 관련된 임의의 데이터를 저장하는 장소입니다.  
데이터 속성은 각 활성화된 경로 내에서 접근할 수 있습니다.  
페이지 제목, 탐색 경로 텍스트 및 기타 읽기 전용 정적 데이터를 저장하는 데 사용합니다.  
동적 데이터를 검색하려면 액세스 가드를 사용하십시오.

네 번째 경로의 빈 경로는 애플리케이션의 기본 경로를 나타냅니다. — URL의 경로가 비어 있을 때 일반적으로 이동하는 장소입니다.  
이 기본 경로는 `/heroes` URL을 위한 경로로 리디렉션되므로 `HeroesListComponent`가 표시됩니다.

탐색 생명주기 동안 어떤 이벤트가 발생하는지 보려면 `withDebugTracing` 기능이 있습니다.  
이 기능은 각 탐색 생명주기 동안 발생한 각 라우터 이벤트를 브라우저 콘솔에 출력합니다.  
`withDebugTracing`은 디버깅 목적으로만 사용하세요.  
`provideRouter` 메서드에 두 번째 인수로 전달된 객체에서 `withDebugTracing` 옵션을 설정합니다.

## 라우터 아울렛

`RouterOutlet`은 라우터 라이브러리의 지시어로 구성 요소처럼 사용됩니다.  
라우터가 해당 아울렛에 대한 구성 요소를 표시해야 하는 템플릿의 위치를 표시하는 자리 표시자로 작용합니다.

<docs-code language="html">

<router-outlet></router-outlet>
<!-- 라우팅된 구성 요소가 여기로 갑니다 -->

</docs-code>

이전 구성에 따라 이 애플리케이션의 브라우저 URL이 `/heroes`가 되면 라우터는 그 URL을 경로 `/heroes`와 일치시키고, 호스트 구성 요소의 템플릿에 배치한 `RouterOutlet`의 형제 요소로서 `HeroListComponent`를 표시합니다.

## 라우터 링크

사용자 행동(예: 앵커 태그 클릭)의 결과로 탐색하려면 `RouterLink`를 사용하십시오.

다음 템플릿을 고려하십시오:

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/router/src/app/app.component.1.html"/>

앵커 태그의 `RouterLink` 지시어는 해당 요소에 대한 라우터의 제어를 제공합니다.  
탐색 경로는 고정되어 있으므로 `routerLink`에 문자열을 일회성 바인딩으로 할당할 수 있습니다.

탐색 경로가 더 동적이었다면 배열의 경로 링크 매개변수를 반환하는 템플릿 표현에 바인딩할 수 있었습니다; 즉, [링크 매개변수 배열](guide/routing/common-router-tasks#link-parameters-array)입니다.  
라우터는 해당 배열을 완전한 URL로 해결합니다.

## 활성 라우터 링크

`RouterLinkActive` 지시어는 현재 `RouterState`에 따라 활성 `RouterLink` 바인딩의 CSS 클래스를 전환합니다.

각 앵커 태그에서 `RouterLinkActive` 지시어에 대한 [속성 바인딩](guide/templates/property-binding)을 볼 수 있습니다.

<docs-code hideCopy language="html">

routerLinkActive="..."

</docs-code>

등호 기호(`=`) 오른쪽의 템플릿 표현에는 활성 링크일 때 라우터가 추가하고 비활성 링크일 때 제거하는 CSS 클래스의 공백으로 구분된 문자열이 포함되어 있습니다.  
`RouterLinkActive` 지시어를 `routerLinkActive="active fluffy"`와 같은 클래스 문자열에 설정하거나 그러한 문자열을 반환하는 구성 요소 속성에 바인딩할 수 있습니다.  
예를 들어,

<docs-code hideCopy language="typescript">

[routerLinkActive]="someStringProperty"

</docs-code>

활성 경로 링크는 각 레벨의 경로 트리를 따라 cascades하므로 부모 및 자식 라우터 링크가 동시에 활성화될 수 있습니다.  
이 동작을 무시하려면 `{ exact: true }` 표현으로 `[routerLinkActiveOptions]` 입력 바인딩에 바인딩하십시오.  
`{ exact: true }`를 사용하면 특정 `RouterLink`는 URL이 현재 URL과 정확히 일치하는 경우에만 활성화됩니다.

`RouterLinkActive`는 활성 요소에 `aria-current` 속성을 쉽게 적용할 수 있도록 하여 모든 사용자에게 더 접근할 수 있는 경험을 제공합니다. 더 많은 정보는 접근성 모범 사례 [활성 링크 식별 섹션](/best-practices/a11y#active-links-identification)을 참조하십시오.

## 라우터 상태

각 성공적인 탐색 생명주기가 끝난 후 라우터는 현재 상태를 구성하는 `ActivatedRoute` 객체의 트리를 구성합니다.  
어디에서나 `Router` 서비스 및 `routerState` 속성을 사용하여 현재 `RouterState`에 접근할 수 있습니다.

`RouterState`의 각 `ActivatedRoute`는 부모, 자식 및 형제 경로에서 정보를 가져오기 위해 경로 트리를 위아래로 탐색하는 메서드를 제공합니다.

## 활성화된 경로

경로 경로 및 매개변수는 [ActivatedRoute](api/router/ActivatedRoute)라는 주입된 라우터 서비스를 통해 사용할 수 있습니다.  
이 서비스는 다음과 같은 유용한 정보를 많이 포함하고 있습니다:

| 속성           | 세부정보 |
|:---            |:---      |
| `url`          | 경로 경로의 배열로 표현되는 경로 경로의 `Observable`입니다.                                                                                                                                                        |
| `data`         | 경로를 위해 제공된 `data` 객체가 포함된 `Observable`입니다. 또한 resolve 가드에서 해결된 값을 포함합니다.                                                                                     |
| `params`       | 경로에 특정한 필수 및 선택 매개변수를 포함한 `Observable`입니다.                                                                                                                 |
| `paramMap`     | 경로에 특정한 필수 및 선택 매개변수의 [맵](api/router/ParamMap)을 포함한 `Observable`입니다. 이 맵은 동일한 매개변수에서 단일 및 다중 값을 검색하는 것을 지원합니다. |
| `queryParamMap`| 모든 경로에서 사용할 수 있는 쿼리 매개변수의 [맵](api/router/ParamMap)을 포함한 `Observable`입니다. 이 맵은 쿼리 매개변수에서 단일 및 다중 값을 검색하는 것을 지원합니다.                       |
| `queryParams`  | 모든 경로에서 사용할 수 있는 쿼리 매개변수를 포함한 `Observable`입니다.                                                                                                                                        |
| `fragment`     | 모든 경로에서 사용할 수 있는 URL 프래그먼트의 `Observable`입니다.                                                                                                                                                               |
| `outlet`       | 경로를 렌더링하는 데 사용되는 `RouterOutlet`의 이름입니다. 이름이 없는 아울렛의 경우 아울렛 이름은 primary입니다.                                                                                                                                                      |
| `routeConfig`  | 원래 경로를 포함하는 경로에 사용되는 경로 구성입니다.                                                                                                                                                                                        |
| `parent`       | 본 경로를 자식 경로로 할 때 경로의 부모 `ActivatedRoute`입니다.                                                                                                                                       |
| `firstChild`   | 이 경로의 자식 경로 목록에서 첫 번째 `ActivatedRoute`를 포함합니다.                                                                                                                                                                                    |
| `children`     | 현재 경로 아래에서 활성화된 모든 자식 경로를 포함합니다.                                                                                                                                            |

## 라우터 이벤트

각 탐색 중에 `Router`는 `Router.events` 속성을 통해 탐색 이벤트를 방출합니다.  
이러한 이벤트는 다음 표에 나타납니다.

| 라우터 이벤트                                               | 세부정보 |
|:---                                                       |:---      |
| [`NavigationStart`](api/router/NavigationStart)           | 탐색이 시작될 때 트리거됩니다.                                                                                                                                                     |
| [`RouteConfigLoadStart`](api/router/RouteConfigLoadStart) | 라우터가 경로 구성을 지연 로드하기 전에 트리거됩니다.                                                                     |
| [`RouteConfigLoadEnd`](api/router/RouteConfigLoadEnd)     | 경로가 지연 로드된 후 트리거됩니다.                                                                                                                                         |
| [`RoutesRecognized`](api/router/RoutesRecognized)         | 라우터가 URL을 파싱하고 경로를 인식할 때 트리거됩니다.                                                                                                               |
| [`GuardsCheckStart`](api/router/GuardsCheckStart)         | 라우터가 라우팅의 가드 단계에 들어갈 때 트리거됩니다.                                                                                                                         |
| [`ChildActivationStart`](api/router/ChildActivationStart) | 라우터가 경로의 자식 활성화를 시작할 때 트리거됩니다.                                                                                                                       |
| [`ActivationStart`](api/router/ActivationStart)           | 라우터가 경로의 활성화를 시작할 때 트리거됩니다.                                                                                                                                  |
| [`GuardsCheckEnd`](api/router/GuardsCheckEnd)             | 라우터가 가드 단계의 라우팅을 성공적으로 완료할 때 트리거됩니다.                                                                                                          |
| [`ResolveStart`](api/router/ResolveStart)                 | 라우터가 라우팅의 해결 단계를 시작할 때 트리거됩니다.                                                                                                                        |
| [`ResolveEnd`](api/router/ResolveEnd)                     | 라우터가 라우팅의 해결 단계를 성공적으로 완료할 때 트리거됩니다.                                                                                                          |
| [`ChildActivationEnd`](api/router/ChildActivationEnd)     | 라우터가 경로 자식 활성화를 완료할 때 트리거됩니다.                                                                                                                     |
| [`ActivationEnd`](api/router/ActivationEnd)               | 라우터가 경로의 활성화를 완료할 때 트리거됩니다.                                                                                                                                |
| [`NavigationEnd`](api/router/NavigationEnd)               | 탐색이 성공적으로 끝날 때 트리거됩니다.                                                                                                                                          |
| [`NavigationCancel`](api/router/NavigationCancel)         | 탐색이 취소될 때 트리거됩니다. 이는 경로 가드가 탐색 중에 false를 반환하거나 `UrlTree` 또는 `RedirectCommand`를 반환하여 리디렉션될 때 발생할 수 있습니다. |
| [`NavigationError`](api/router/NavigationError)           | 예기치 않은 오류로 인해 탐색이 실패할 때 트리거됩니다.                                                                                                                           |
| [`Scroll`](api/router/Scroll)                             | 스크롤 이벤트를 나타냅니다.                                                                                                                                                         |

`withDebugTracing` 기능을 활성화하면 Angular는 이러한 이벤트를 콘솔에 기록합니다.

## 라우터 용어

다음은 주요 `Router` 용어와 그 의미입니다:

| 라우터 부분           | 세부정보 |
|:---                   |:---      |
| `Router`              | 활성 URL에 대한 애플리케이션 구성 요소를 표시합니다. 한 구성 요소에서 다른 구성 요소로의 탐색을 관리합니다.                                                                                        |
| `provideRouter`       | 애플리케이션 뷰를 탐색하는 데 필요한 서비스 제공자를 제공합니다.                                                                                        |
| `RouterModule`        | 애플리케이션 뷰를 탐색하는 데 필요한 서비스 제공자와 지시어를 제공하는 별도의 NgModule입니다.                                                                       |
| `Routes`              | 각 URL 경로를 구성 요소에 매핑하는 Route의 배열을 정의합니다.                                                                                                                              |
| `Route`               | URL 패턴에 따라 라우터가 구성 요소로 탐색해야 하는 방법을 정의합니다. 대부분의 경로는 경로와 구성 요소 유형으로 구성됩니다.                                                                |
| `RouterOutlet`        | 라우터가 뷰를 표시할 위치를 표시하는 지시어 (`<router-outlet>`)입니다.                                                                                                                 |
| `RouterLink`          | 클릭 가능한 HTML 요소를 경로에 바인딩하기 위한 지시어입니다. `routerLink` 지시어에 바인딩된 문자열 또는 링크 매개변수 배열을 가진 요소를 클릭하면 탐색이 트리거됩니다. |
| `RouterLinkActive`    | 연관된 `routerLink`가 활성화/비활성화될 때 HTML 요소에서 클래스를 추가/제거하기 위한 지시어입니다. 이를 통해 활성 링크에 대해 더 나은 접근성을 위한 `aria-current`를 설정할 수 있습니다.                                       |
| `ActivatedRoute`      | 각 경로 구성 요소에 제공되는 서비스로, 경로 매개변수, 정적 데이터, 해결 데이터, 전역 쿼리 매개변수 및 전역 프래그먼트와 같은 경로별 정보를 포함합니다.   |
| `RouterState`         | 현재 활성화된 경로 트리를 포함한 라우터의 현재 상태로, 경로 트리를 탐색하는 편리한 메서드를 제공합니다.                                              |
| 링크 매개변수 배열 | 라우터가 라우팅 지침으로 해석하는 배열입니다. 이 배열을 `RouterLink`에 바인딩하거나 `Router.navigate` 메서드에 인수로 전달할 수 있습니다.                        |
| 라우팅 구성 요소     | 라우터 탐색에 따라 뷰를 표시하는 `RouterOutlet`가 있는 Angular 구성 요소입니다.                                                                                                      |