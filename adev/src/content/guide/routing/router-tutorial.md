# Angular 라우트를 사용하여 단일 페이지 애플리케이션 만들기

이 튜토리얼은 여러 Angular 라우트를 사용하는 단일 페이지 애플리케이션(SPA)을 만드는 방법에 대해 설명합니다.

단일 페이지 애플리케이션(SPA)에서는 애플리케이션의 모든 기능이 단일 HTML 페이지에 존재합니다.
사용자가 애플리케이션의 기능에 접근할 때 브라우저는 새로운 페이지를 로드하는 대신 사용자에게 중요한 부분만 렌더링해야 합니다.
이 패턴은 애플리케이션의 사용자 경험을 크게 개선할 수 있습니다.

사용자가 애플리케이션을 탐색하는 방식을 정의하기 위해 라우트를 사용합니다.
라우트를 추가하여 사용자가 애플리케이션의 한 부분에서 다른 부분으로 어떻게 탐색하는지를 정의합니다.
예기치 않거나 허가되지 않은 동작을 방지하기 위해 라우트를 구성할 수도 있습니다.

## 목표

* 샘플 애플리케이션의 기능을 모듈로 구성합니다.
* 구성 요소로 이동하는 방법을 정의합니다.
* 매개변수를 사용하여 구성 요소에 정보를 전달합니다.
* 여러 라우트를 중첩하여 라우트를 구조화합니다.
* 사용자가 라우트에 접근할 수 있는지 확인합니다.
* 애플리케이션이 저장되지 않은 변경 사항을 무시할 수 있는지 제어합니다.
* 라우트 데이터를 미리 가져오고 기능 모듈을 지연 로드하여 성능을 향상시킵니다.
* 특정 기준이 충족될 때 구성 요소를 로드하도록 요구합니다.

## 샘플 애플리케이션 만들기

Angular CLI를 사용하여 새 애플리케이션 *angular-router-sample*을 생성합니다.
이 애플리케이션에는 두 개의 구성 요소가 있습니다: *crisis-list*와 *heroes-list*입니다.

1. 새 Angular 프로젝트인 *angular-router-sample*을 생성합니다.

    <docs-code language="shell">
    ng new angular-router-sample
    </docs-code>

    `Angular 라우팅을 추가하시겠습니까?`라는 메시지가 표시되면 `N`을 선택합니다.

    `어떤 스타일 시트 형식을 사용하시겠습니까?`라는 메시지가 표시되면 `CSS`를 선택합니다.

    잠시 후 새 프로젝트인 `angular-router-sample`이 준비됩니다.

1. 터미널에서 `angular-router-sample` 디렉토리로 이동합니다.
1. 구성 요소 *crisis-list*를 생성합니다.

    <docs-code language="shell">
    ng generate component crisis-list
    </docs-code>

1. 코드 편집기에서 파일 `crisis-list.component.html`을 찾아서 자리 표시자 내용을 다음 HTML로 교체합니다.

    <docs-code header="src/app/crisis-list/crisis-list.component.html" path="adev/src/content/examples/router-tutorial/src/app/crisis-list/crisis-list.component.html"/>

1. 두 번째 구성 요소인 *heroes-list*를 생성합니다.

    <docs-code language="shell">
    ng generate component heroes-list
    </docs-code>

1. 코드 편집기에서 파일 `heroes-list.component.html`을 찾아서 자리 표시자 내용을 다음 HTML로 교체합니다.

    <docs-code header="src/app/heroes-list/heroes-list.component.html" path="adev/src/content/examples/router-tutorial/src/app/heroes-list/heroes-list.component.html"/>

1. 코드 편집기에서 파일 `app.component.html`을 열고 내용을 다음 HTML로 바꿉니다.

    <docs-code header="src/app/app.component.html" path="adev/src/content/examples/router-tutorial/src/app/app.component.html" visibleRegion="setup"/>

1. `ng serve` 명령을 실행하여 새 애플리케이션이 예상대로 실행되는지 확인합니다.

    <docs-code language="shell">
    ng serve
    </docs-code>

1. 브라우저를 열고 `http://localhost:4200`으로 이동합니다.

    제목과 두 구성 요소의 HTML로 구성된 단일 웹 페이지가 표시됩니다.

## 라우트 정의하기

이 섹션에서는 두 개의 라우트를 정의합니다:

* 라우트 `/crisis-center`는 `crisis-center` 구성 요소를 엽니다.
* 라우트 `/heroes-list`는 `heroes-list` 구성 요소를 엽니다.

라우트 정의는 JavaScript 객체입니다.
각 라우트는 일반적으로 두 개의 속성을 가집니다.
첫 번째 속성인 `path`는 라우트의 URL 경로를 지정하는 문자열입니다.
두 번째 속성인 `component`는 애플리케이션이 해당 경로에 대해 표시해야 할 구성 요소를 지정하는 문자열입니다.

1. 코드 편집기에서 `app.routes.ts` 파일을 생성하고 엽니다.
1. 애플리케이션의 라우트 목록을 생성하고 내보냅니다:

    ```ts
    import {Routes} from '@angular/router';

    export const routes = [];
    ```

1. 첫 번째 두 구성 요소에 대한 두 개의 라우트를 추가합니다:

    ```ts
    {path: 'crisis-list', component: CrisisListComponent},
    {path: 'heroes-list', component: HeroesListComponent},
    ```

이 라우트 목록은 각 객체가 라우트의 속성을 정의하는 JavaScript 객체의 배열입니다.

## `@angular/router`에서 `provideRouter` 가져오기

라우팅을 사용하면 URL 경로에 따라 애플리케이션의 특정 뷰를 표시할 수 있습니다.
이 기능을 샘플 애플리케이션에 추가하려면 `app.config.ts` 파일을 업데이트하여 라우터 공급자 함수인 `provideRouter`를 사용해야 합니다.
이 공급자 함수는 `@angular/router`에서 가져옵니다.

1. 코드 편집기에서 `app.config.ts` 파일을 엽니다.
1. 다음 가져오기 문을 추가합니다:

    ```ts
    import { provideRouter } from '@angular/router';
    import { routes } from './app.routes';
    ```

1. `appConfig`의 제공자를 업데이트합니다:

    ```ts
    providers: [provideRouter(routes)]
    ```

`NgModule` 기반 애플리케이션의 경우 `provideRouter`를 `AppModule`의 `providers` 목록에 넣거나 애플리케이션에서 `bootstrapModule`에 전달되는 모듈에 넣습니다.

## `router-outlet`로 구성 요소 업데이트

이 시점에서 애플리케이션의 두 개의 라우트를 정의했습니다.
하지만 애플리케이션은 여전히 `app.component.html` 템플릿에 `crisis-list`와 `heroes-list` 구성 요소가 하드코딩되어 있습니다.
라우트가 작동하려면 URL 경로에 따라 동적으로 구성 요소를 로드하도록 템플릿을 업데이트해야 합니다.

이 기능을 구현하려면 템플릿 파일에 `router-outlet` 지시어를 추가합니다.

1. 코드 편집기에서 `app.component.html` 파일을 엽니다.
1. 다음 줄을 삭제합니다.

    <docs-code header="src/app/app.component.html" path="adev/src/content/examples/router-tutorial/src/app/app.component.html" visibleRegion="components"/>

1. `router-outlet` 지시어를 추가합니다.

    <docs-code header="src/app/app.component.html" path="adev/src/content/examples/router-tutorial/src/app/app.component.html" visibleRegion="router-outlet"/>

1. `app.component.ts`의 `AppComponent`의 가져오기 목록에 `RouterOutlet`을 추가합니다.

    ```ts
    imports: [RouterOutlet],
    ```

브라우저에서 업데이트된 애플리케이션을 보십시오.
애플리케이션 제목만 표시되어야 합니다.
`crisis-list` 구성 요소를 보려면 브라우저 주소 표시줄에 경로 끝에 `crisis-list`를 추가하십시오.
예를 들어:

<docs-code language="http">
http://localhost:4200/crisis-list
</docs-code>

`crisis-list` 구성 요소가 표시되는 것을 확인하십시오.
Angular는 정의한 라우트를 사용하여 구성 요소를 동적으로 로드하고 있습니다.
`heroes-list` 구성 요소를 동일한 방식으로 로드할 수 있습니다:

<docs-code language="http">
http://localhost:4200/heroes-list
</docs-code>

## UI 요소로 탐색 제어하기

현재 애플리케이션은 두 개의 라우트를 지원합니다.
그러나 이러한 라우트를 사용하는 유일한 방법은 사용자가 브라우저 주소 표시줄에 경로를 수동으로 입력하는 것입니다.
이 섹션에서는 사용자가 `heroes-list`와 `crisis-list` 구성 요소 간에 탐색할 수 있는 두 개의 링크를 추가합니다.
또한 몇 가지 CSS 스타일을 추가합니다.
이 스타일은 필수는 아니지만 현재 표시되는 구성 요소의 링크를 식별하기 쉽게 만듭니다.
다음 섹션에서 이 기능을 추가할 것입니다.

1. `app.component.html` 파일을 열고 제목 아래에 다음 HTML을 추가합니다.

    <docs-code header="src/app/app.component.html" path="adev/src/content/examples/router-tutorial/src/app/app.component.html" visibleRegion="nav"/>

    이 HTML은 Angular 지시어 `routerLink`를 사용합니다.
    이 지시어는 정의한 라우트를 템플릿 파일에 연결합니다.

1. `app.component.ts`의 `AppComponent`의 가져오기 목록에 `RouterLink` 지시어를 추가합니다.

1. `app.component.css` 파일을 열고 다음 스타일을 추가합니다.

    <docs-code header="src/app/app.component.css" path="adev/src/content/examples/router-tutorial/src/app/app.component.css"/>

브라우저에서 애플리케이션을 보면 이 두 개의 링크가 표시되어야 합니다.
링크를 클릭하면 해당 구성 요소가 나타납니다.

## 활성 라우트 식별하기

사용자가 이전 섹션에서 추가한 링크를 사용하여 애플리케이션을 탐색할 수 있지만 현재 활성 라우트를 식별할 수 있는 간단한 방법이 없습니다.
Angular의 `routerLinkActive` 지시어를 사용하여 이 기능을 추가합니다.

1. 코드 편집기에서 `app.component.html` 파일을 엽니다.
1. 앵커 태그를 업데이트하여 `routerLinkActive` 지시어를 포함합니다.

    <docs-code header="src/app/app.component.html" path="adev/src/content/examples/router-tutorial/src/app/app.component.html" visibleRegion="routeractivelink"/>
1. `app.component.ts`의 `AppComponent`의 가져오기 목록에 `RouterLinkActive` 지시어를 추가합니다.

다시 애플리케이션을 보기 위해 확인하십시오.
버튼 중 하나를 클릭하면 해당 버튼의 스타일이 자동으로 업데이트되어 활성 구성 요소를 사용자에게 식별합니다.
`routerLinkActive` 지시어를 추가하면 활성 라우트에 특정 CSS 클래스를 적용하도록 애플리케이션에 알립니다.
이 튜토리얼에서 해당 CSS 클래스는 `activebutton`이지만 원하는 모든 클래스를 사용할 수 있습니다.

`routerLinkActive`의 `ariaCurrentWhenActive` 값도 지정하고 있다는 점에 주목하십시오. 이렇게 하면 시각적으로 장애가 있는 사용자가(스타일이 달라지는 것을 인식하지 못할 수 있음) 활성 버튼을 식별할 수 있습니다. 자세한 내용은 접근성 모범 사례의 [활성 링크 식별 섹션](/best-practices/a11y#active-links-identification)을 참조하십시오.

## 리디렉션 추가하기

이 튜토리얼의 단계에서 사용자가 `/heroes-list` 구성 요소를 표시하도록 리디렉션하는 라우트를 추가합니다.

1. 코드 편집기에서 `app.routes.ts` 파일을 엽니다.
1. `routes` 섹션을 다음과 같이 업데이트합니다.

    ```ts
    {path: '', redirectTo: '/heroes-list', pathMatch: 'full'},
    ```

    이 새 라우트가 경로로 빈 문자열을 사용한다는 점에 유의하십시오.
    또한 `component` 속성을 두 개의 새로운 속성으로 대체합니다:

    | 속성      | 세부정보 |
    |:---      |:---    |
    | `redirectTo` | 이 속성은 Angular에게 빈 경로에서 `heroes-list` 경로로 리디렉션하라고 지시합니다.                                                                                                                                                       |
    | `pathMatch`  | 이 속성은 Angular에게 URL의 얼마나 많은 부분을 일치시킬지를 지시합니다. 이 튜토리얼에서는 이 속성을 `full`로 설정해야 합니다. 이 전략은 경로가 빈 문자열일 때 권장됩니다. 이 속성에 대한 자세한 내용은 [라우트 API 문서](api/router/Route)를 참조하십시오. |

이제 애플리케이션을 열면 기본적으로 `heroes-list` 구성 요소가 표시됩니다.

## 404 페이지 추가하기

사용자가 정의하지 않은 라우트에 접근하려고 할 수 있습니다.
이 행동을 처리하기 위해 모범 사례는 404 페이지를 표시하는 것입니다.
이 섹션에서는 404 페이지를 만들고 라우트 구성을 업데이트하여 지정되지 않은 모든 라우트에 대해 해당 페이지를 표시합니다.

1. 터미널에서 새 구성 요소 `PageNotFound`를 생성합니다.

    <docs-code language="shell">
    ng generate component page-not-found
    </docs-code>

1. 코드 편집기에서 `page-not-found.component.html` 파일을 열고 내용을 다음 HTML로 교체합니다.

    <docs-code header="src/app/page-not-found/page-not-found.component.html" path="adev/src/content/examples/router-tutorial/src/app/page-not-found/page-not-found.component.html"/>

1. `app.routes.ts` 파일을 열고 라우트 목록에 다음 라우트를 추가합니다:

    ```ts
    {path: '**', component: PageNotFoundComponent}
    ```

    새 라우트는 경로 `**`를 사용합니다.
    이 경로는 Angular가 와일드카드 라우트를 식별하는 방법입니다.
    구성에서 정의된 기존 라우트와 일치하지 않는 모든 경로는 이 라우트를 사용합니다.

중요: 와일드카드 라우트가 배열의 끝에 위치해야 한다는 점에 유의하십시오.
라우트의 순서는 중요하며 Angular는 순서대로 라우트를 적용하고 처음 일치하는 것을 사용합니다.

애플리케이션에서 존재하지 않는 라우트로 이동해 보십시오, 예를 들어 `http://localhost:4200/powers`.
이 라우트는 `app.routes.ts` 파일에 정의된 아무것과도 일치하지 않습니다.
그러나 와일드카드 라우트를 정의했기 때문에 애플리케이션은 자동으로 `PageNotFound` 구성 요소를 표시합니다.

## 다음 단계

이 시점에서 URL 주소에 따라 사용자가 볼 수 있는 구성 요소를 변경하는 Angular의 라우팅 기능을 사용하는 기본 애플리케이션이 있습니다.
이 기능을 리디렉션과 함께 확장했으며, 사용자 정의 404 페이지를 표시하기 위한 와일드카드 라우트도 추가했습니다.

라우팅에 대한 자세한 내용은 다음 주제를 참조하십시오:

<docs-pill-row>
  <docs-pill href="guide/routing/common-router-tasks" title="앱 내 라우팅 및 탐색"/>
  <docs-pill href="api/router/Router" title="라우터 API"/>
</docs-pill-row>