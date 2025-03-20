# 공통 라우팅 작업

이 주제는 Angular 라우터를 애플리케이션에 추가할 때 일반적으로 수행되는 여러 작업을 구현하는 방법을 설명합니다.

## 라우팅이 활성화된 애플리케이션 생성

다음 명령은 Angular CLI를 사용하여 애플리케이션 경로와 함께 기본 Angular 애플리케이션을 생성합니다. 다음 예제에서 애플리케이션 이름은 `routing-app`입니다.

```shell
ng new routing-app
```

### 라우팅을 위한 컴포넌트 추가

Angular 라우터를 사용하려면 애플리케이션에 최소 두 개의 컴포넌트가 필요하여 서로 간에 탐색할 수 있습니다. CLI를 사용하여 컴포넌트를 만들려면 `first`가 컴포넌트 이름인 명령 줄에 다음을 입력합니다:

```shell
ng generate component first
```

두 번째 컴포넌트에 대해서도 이 단계를 반복하지만 다른 이름을 지정하세요. 여기서 새로운 이름은 `second`입니다.

<docs-code language="shell">

ng generate component second

</docs-code>

CLI는 자동으로 `Component`를 추가하므로, `first-component`라고 작성하면 컴포넌트는 `FirstComponentComponent`가 됩니다.

<docs-callout title="`base href`">

이 가이드는 CLI에서 생성한 Angular 애플리케이션에서 작동합니다. 수동으로 작업하는 경우 `<head>`의 index.html 파일에 `<base href="/">`가 포함되어 있는지 확인하세요.
이는 `app` 폴더가 애플리케이션 루트로 가정하고 `"/"`을 사용합니다.

</docs-callout>

### 새 컴포넌트 가져오기

새 컴포넌트를 사용하려면 파일 최상단의 `app.routes.ts`에 가져옵니다. 다음과 같이:

<docs-code language="ts">

import {FirstComponent} from './first/first.component';
import {SecondComponent} from './second/second.component';

</docs-code>

## 기본 경로 정의

경로를 만들기 위한 세 가지 기본 요소가 있습니다.

`app.config.ts`에 경로를 가져오고 `provideRouter` 함수에 추가합니다. 다음은 CLI를 사용한 기본 `ApplicationConfig`입니다.

<docs-code language="ts">

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};

</docs-code>

Angular CLI는 이 단계를 자동으로 수행합니다. 그러나 애플리케이션을 수동으로 생성하거나 기존 비-CLI 애플리케이션과 작업하는 경우 가져오기 및 구성 설정이 올바른지 확인하세요.

<docs-workflow>

<docs-step title="경로용 `Routes` 배열 설정">

Angular CLI는 이 단계를 자동으로 수행합니다.

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [];
```

</docs-step>

<docs-step title="경로 배열에서 경로 정의">

이 배열의 각 경로는 두 개의 속성을 포함하는 JavaScript 객체입니다. 첫 번째 속성인 `path`는 경로의 URL 경로를 정의합니다. 두 번째 속성인 `component`는 Angular가 해당 경로에 사용할 컴포넌트를 정의합니다.

```ts
const routes: Routes = [
  { path: 'first-component', component: FirstComponent },
  { path: 'second-component', component: SecondComponent },
];
```

</docs-step>

<docs-step title="애플리케이션에 경로 추가">

이제 경로를 정의했으므로 애플리케이션에 추가합니다. 먼저 두 컴포넌트에 대한 링크를 추가합니다. 라우트를 추가할 앵커 태그를 `routerLink` 속성에 할당하세요. 사용자가 각 링크를 클릭할 때 표시할 컴포넌트로 속성값을 설정하세요. 다음으로, `<router-outlet>`를 포함하도록 컴포넌트 템플릿을 업데이트합니다. 이 요소는 Angular에게 선택된 경로에 대한 컴포넌트로 애플리케이션 뷰를 업데이트하도록 지시합니다.

```angular-html
<h1>Angular Router App</h1>
<nav>
  <ul>
    <li><a routerLink="/first-component" routerLinkActive="active" ariaCurrentWhenActive="page">첫 번째 컴포넌트</a></li>
    <li><a routerLink="/second-component" routerLinkActive="active" ariaCurrentWhenActive="page">두 번째 컴포넌트</a></li>
  </ul>
</nav>
<!-- 경로의 뷰가 <router-outlet>에 렌더링됩니다 -->
<router-outlet />
```

또한 `AppComponent`의 `imports` 배열에 `RouterLink`, `RouterLinkActive`, 및 `RouterOutlet`을 추가해야 합니다.

```ts
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'routing-app';
}
```

</docs-step>

</docs-workflow>

### 경로 순서

경로의 순서는 중요합니다. 왜냐하면 `Router`가 경로를 일치시킬 때 첫 번째 일치가 우선시되기 때문에 더 특정한 경로는 덜 특정한 경로보다 위에 배치되어야 합니다.
정적 경로가 있는 경로를 먼저 나열하고, 그 다음은 기본 경로를 자주 사용하는 빈 경로입니다.
[와일드카드 경로](guide/routing/common-router-tasks#setting-up-wildcard-routes)는 모든 URL과 일치하기 때문에 마지막에 위치합니다. `Router`는 다른 경로가 먼저 일치하지 않으면 이 경로를 선택합니다.

## 경로 정보 가져오기

종종 사용자가 애플리케이션을 탐색할 때 한 컴포넌트에서 다른 컴포넌트로 정보를 전달하고 싶을 것입니다.
예를 들어, 장바구니 항목이 표시되는 애플리케이션을 고려해 보세요.
목록의 각 항목에는 고유한 `id`가 있습니다.
항목을 수정하려면 사용자가 수정 버튼을 클릭하여 `EditGroceryItem` 컴포넌트를 열어야 합니다.
이 컴포넌트가 장바구니 항목의 `id`를 검색하여 사용자에게 올바른 정보를 표시하도록 하길 원합니다.

이러한 유형의 정보를 애플리케이션 컴포넌트에 전달하기 위해 경로를 사용하세요.
이를 위해 `provideRouter`와 함께 [withComponentInputBinding](api/router/withComponentInputBinding) 기능 또는 `RouterModule.forRoot`의 `bindToComponentInputs` 옵션을 사용합니다.

경로로부터 정보를 얻으려면:

<docs-workflow>

<docs-step title="`withComponentInputBinding` 추가">

`provideRouter` 메서드에 `withComponentInputBinding` 기능을 추가하세요.

```ts
providers: [
  provideRouter(appRoutes, withComponentInputBinding()),
]
```

</docs-step>

<docs-step title="컴포넌트에 `Input` 추가">

컴포넌트 업데이트하여 매개변수 이름과 일치하는 `Input`을 추가하세요.

```ts
@Input()
set id(heroId: string) {
  this.hero$ = this.service.getHero(heroId);
}
```

참고: 모든 경로 데이터를 키, 값 쌍으로 컴포넌트 입력에 바인딩할 수 있습니다: 정적 또는 해결된 경로 데이터, 경로 매개변수, 행렬 매개변수 및 쿼리 매개변수.
부모 컴포넌트의 경로 정보를 사용하려면 라우터의 `paramsInheritanceStrategy` 옵션을 설정해야 합니다:
`withRouterConfig({paramsInheritanceStrategy: 'always'})`

</docs-step>

</docs-workflow>

## 와일드카드 경로 설정

잘 작동하는 애플리케이션은 사용자가 존재하지 않는 애플리케이션의 일부로 탐색하려 할 때 이를 원활하게 처리해야 합니다.
이 기능을 애플리케이션에 추가하려면 와일드카드 경로를 설정하세요.
Angular 라우터는 요청된 URL이 어떤 라우터 경로와도 일치하지 않을 때마다 이 경로를 선택합니다.

와일드카드 경로를 설정하려면 다음 코드를 `routes` 정의에 추가하세요.

<docs-code>

{ path: '**', component: <component-name> }

</docs-code>

두 개의 별표 `**`는 Angular에게 이 `routes` 정의가 와일드카드 경로임을 나타냅니다.
컴포넌트 속성에서는 애플리케이션의 모든 컴포넌트를 정의할 수 있습니다.
일반적인 선택으로는 애플리케이션 전용 `PageNotFoundComponent`가 있으며, 이를 정의하여 사용자에게 [404 페이지를 표시](guide/routing/common-router-tasks#displaying-a-404-page)할 수 있습니다; 또는 애플리케이션의 주요 컴포넌트로 리디렉션할 수 있습니다.
와일드카드 경로는 모든 URL과 일치하기 때문에 마지막 경로입니다.
경로에 대한 순서의 중요성에 대한 자세한 내용은 [경로 순서](guide/routing/common-router-tasks#route-order)를 참조하세요.

## 404 페이지 표시

404 페이지를 표시하려면 `component` 속성을 사용하여 원하는 404 페이지 컴포넌트로 설정된 [와일드카드 경로](guide/routing/common-router-tasks#setting-up-wildcard-routes)를 설정하세요.

```ts
const routes: Routes = [
  { path: 'first-component', component: FirstComponent },
  { path: 'second-component', component: SecondComponent },
  { path: '**', component: PageNotFoundComponent },  // 404 페이지에 대한 와일드카드 경로
];
```

`path`가 `**`인 마지막 경로는 와일드카드 경로입니다.
라우터는 요청한 URL이 목록의 이전 경로와 일치하지 않을 때 이 경로를 선택하고 사용자를 `PageNotFoundComponent`로 보냅니다.

## 리디렉션 설정

리디렉션을 설정하려면 리디렉션하려는 `path`, 리디렉션할 `component`, 및 URL을 일치시키는 방법을 라우터에 알려주는 `pathMatch` 값을 가진 경로를 구성하세요.

```ts
const routes: Routes = [
  { path: 'first-component', component: FirstComponent },
  { path: 'second-component', component: SecondComponent },
  { path: '',   redirectTo: '/first-component', pathMatch: 'full' }, // `first-component`로 리디렉션
  { path: '**', component: PageNotFoundComponent },  // 404 페이지에 대한 와일드카드 경로
];
```

이 예제에서 세 번째 경로는 리디렉션으로, 라우터가 기본적으로 `first-component` 경로로 설정됩니다.
이 리디렉션은 와일드카드 경로보다 먼저 옵니다.
여기서 `path: ''`는 초기 상대 URL를 사용하라는 의미입니다 \(`''`\).

때때로 리디렉션은 간단한 정적 리디렉션이 아닙니다. `redirectTo` 속성은 더 복잡한 논리가 포함된 함수일 수 있습니다.
이 함수는 문자열이나 `UrlTree`를 반환합니다.

```ts
const routes: Routes = [
  { path: "first-component", component: FirstComponent },
  {
    path: "old-user-page",
    redirectTo: ({ queryParams }) => {
      const errorHandler = inject(ErrorHandler);
      const userIdParam = queryParams['userId'];
      if (userIdParam !== undefined) {
        return `/user/${userIdParam}`;
      } else {
        errorHandler.handleError(new Error('사용자 ID 없이 사용자 페이지로 전환하려고 시도했습니다.'));
        return `/not-found`;
      }
    },
  },
  { path: "user/:userId", component: OtherComponent },
];
```

## 경로 중첩

애플리케이션이 더 복잡해짐에 따라 루트 컴포넌트 외에 다른 컴포넌트에 상대적인 경로를 만들고 싶을 수 있습니다.
이러한 유형의 중첩 경로를 자식 경로라고 합니다.
이는 애플리케이션에 두 번째 `<router-outlet>`을 추가하는 것을 의미합니다. `AppComponent`의 `<router-outlet>` 외에도 추가됩니다.

이 예제에서는 두 개의 추가 자식 컴포넌트가 있습니다: `child-a` 및 `child-b`.
여기서 `FirstComponent`는 자신의 `<nav>`와 `AppComponent`의 `<router-outlet>` 외에 두 번째 `<router-outlet>`을 가지고 있습니다.

```angular-html
<h2>첫 번째 컴포넌트</h2>

<nav>
  <ul>
    <li><a routerLink="child-a">Child A</a></li>
    <li><a routerLink="child-b">Child B</a></li>
  </ul>
</nav>

<router-outlet />
```

자식 경로는 다른 경로와 마찬가지로 `path`와 `component`가 필요합니다.
유일한 차이점은 자식 경로를 부모 경로 내의 `children` 배열에 배치한다는 것입니다.

```ts
const routes: Routes = [
  {
    path: 'first-component',
    component: FirstComponent, // 이 템플릿에 <router-outlet>가 있는 컴포넌트입니다.
    children: [
      {
        path: 'child-a', // 자식 경로의 경로
        component: ChildAComponent, // 라우터가 렌더링하는 자식 경로 컴포넌트
      },
      {
        path: 'child-b',
        component: ChildBComponent, // 라우터가 렌더링하는 또 다른 자식 경로 컴포넌트
      },
    ],
  },
];
```

## 페이지 제목 설정

애플리케이션의 각 페이지는 고유한 제목을 가져야 하며, 이를 통해 브라우저 기록에서 식별할 수 있습니다.
`Router`는 `Route` 구성의 `title` 속성을 사용하여 문서 제목을 설정합니다.

```ts
const routes: Routes = [
  {
    path: 'first-component',
    title: '첫 번째 컴포넌트',
    component: FirstComponent,  // 이 컴포넌트는 템플릿에 <router-outlet>이 있습니다.
    children: [
      {
        path: 'child-a',  // 자식 경로의 경로
        title: resolvedChildATitle,
        component: ChildAComponent,  // 라우터가 렌더링하는 자식 경로 컴포넌트
      },
      {
        path: 'child-b',
        title: 'child b',
        component: ChildBComponent,  // 라우터가 렌더링하는 또 다른 자식 경로 컴포넌트
      },
    ],
  },
];

const resolvedChildATitle: ResolveFn<string> = () => Promise.resolve('child a');
```

도움말: `title` 속성은 정적 경로 `data` 및 `ResolveFn`을 구현하는 동적 값과 동일한 규칙을 따릅니다.

또한 `TitleStrategy`를 확장하여 맞춤 제목 전략을 제공할 수 있습니다.

```ts
@Injectable({ providedIn: 'root' })
export class TemplatePageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.title.setTitle(`내 애플리케이션 | ${title}`);
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
  ]
};
```

## 상대 경로 사용

상대 경로를 사용하면 현재 URL 세그먼트에 상대적인 경로를 정의할 수 있습니다.
다음 예제는 다른 컴포넌트인 `second-component`에 대한 상대 경로를 보여줍니다.
`FirstComponent`와 `SecondComponent`는 트리에서 동일한 수준에 있지만, `SecondComponent`에 대한 링크는 `FirstComponent` 내에 있어 라우터는 한 수준 위로 이동한 후 두 번째 디렉터리로 들어가 `SecondComponent`를 찾아야 합니다.
`SecondComponent`에 접근하기 위해 전체 경로를 작성하는 대신 `../` 표기를 사용하여 한 수준 위로 이동하세요.

```angular-html
<h2>첫 번째 컴포넌트</h2>

<nav>
  <ul>
    <li><a routerLink="../second-component">두 번째 컴포넌트로의 상대 경로</a></li>
  </ul>
</nav>
<router-outlet />
```

`../` 외에도 현재 수준을 지정하려면 `./`를 사용하거나 앞 슬래시 없이 지정할 수 있습니다.

### 상대 경로 지정하기

상대 경로를 지정하려면 `NavigationExtras`의 `relativeTo` 속성을 사용하세요.
컴포넌트 클래스에서 `@angular/router`에서 `NavigationExtras`를 가져옵니다.

그런 다음 내비게이션 메서드에서 `relativeTo`를 사용하세요.
링크 매개변수 배열 다음, 여기서 `items`가 포함되어 있는 객체를 추가하고 `relativeTo` 속성을 `ActivatedRoute`로 설정합니다. 여기서 `this.route`입니다.

```ts
goToItems() {
  this.router.navigate(['items'], { relativeTo: this.route });
}
```

`navigate()` 인자는 라우터가 현재 경로를 기준으로 `items`를 추가하도록 구성합니다.

`goToItems()` 메서드는 목적지 URI를 활성화된 경로에 상대적으로 해석하고 `items` 경로로 탐색합니다.

## 쿼리 매개변수 및 프래그먼트 접근

때때로 애플리케이션의 기능이 쿼리 매개변수나 프래그먼트와 같은 경로의 일부에 접근해야 할 수도 있습니다.
이 예제에서 경로에는 특정 영웅 페이지를 타겟팅하는 데 사용할 수 있는 `id` 매개변수가 포함되어 있습니다.

```ts
import { ApplicationConfig } from "@angular/core";
import { Routes } from '@angular/router';
import { HeroListComponent } from './hero-list.component';

export const routes: Routes = [
  { path: 'hero/:id', component: HeroDetailComponent }
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
```

먼저 탐색하려는 컴포넌트에서 다음 멤버를 가져옵니다.

```ts
import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
```

그런 다음 활성화된 경로 서비스를 주입합니다:

```ts
private readonly route = inject(ActivatedRoute);
```

클래스를 구성하여 `heroes$`라는 옵저버블, 영웅의 `id` 숫자를 보유할 `selectedId`, 및 `ngOnInit()`에 다음 코드를 추가하여 선택된 영웅의 `id`를 가져옵니다.
이 코드 스니펫은 영웅 목록, 영웅 서비스, 영웅을 가져오는 함수, 목록 및 세부정보를 렌더링하는 HTML이 필요함을 가정합니다. 이는 영웅 투어 예제와 유사합니다.

```ts
heroes$: Observable<Hero[]>;
selectedId: number;
heroes = HEROES;

ngOnInit() {
  this.heroes$ = this.route.paramMap.pipe(
    switchMap(params => {
      this.selectedId = Number(params.get('id'));
      return this.service.getHeroes();
    })
  );
}
```

그 다음으로, 탐색하려는 컴포넌트에서 다음 멤버를 가져옵니다.

```ts
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
```

컴포넌트 클래스의 생성자에 `ActivatedRoute`와 `Router`를 주입하여 이 컴포넌트에서 사용할 수 있게 합니다:

```ts
private readonly route = inject(ActivatedRoute);
private readonly router = inject(Router);

hero$: Observable<Hero>;

ngOnInit() {
  const heroId = this.route.snapshot.paramMap.get('id');
  this.hero$ = this.service.getHero(heroId);
}

gotoItems(hero: Hero) {
  const heroId = hero ? hero.id : null;
  // 사용 가능한 경우 영웅 id를 전달합니다.
  // HeroList 컴포넌트가 해당 항목을 선택할 수 있게 하기 위해서입니다.
  this.router.navigate(['/heroes', { id: heroId }]);
}
```

## 지연 로딩

라우트를 지연 로드하도록 구성할 수 있습니다. 이 의미는 Angular가 애플리케이션이 시작될 때 모든 모듈을 로드하는 대신 필요할 때 모듈을 로드하는 것입니다.
또한 백그라운드에서 애플리케이션의 일부를 미리 로드하여 사용자 경험을 개선할 수 있습니다.

어떤 라우트도 `loadComponent:`를 사용하여 자신의 라우팅된 독립형 컴포넌트를 지연 로드할 수 있습니다.

<docs-code header="독립형 컴포넌트 지연 로딩" language="typescript">

const routes: Routes = [
  {
    path: 'lazy',
    loadComponent: () => import('./lazy.component').then(c => c.LazyComponent)
  }
];
</docs-code>
이는 로드된 컴포넌트가 독립형인 한 작동합니다.

지연 로딩 및 미리 로딩에 대한 더 많은 정보는 전용 가이드 [지연 로딩](guide/ngmodules/lazy-loading)을 참조하세요.

## 무단 접근 방지

라우트 가드를 사용하여 사용자가 승인 없이 애플리케이션의 특정 부분으로 탐색하지 못하도록 할 수 있습니다.
Angular에서 사용할 수 있는 다음과 같은 라우트 가드가 있습니다:

<docs-pill-row>
  <docs-pill href="api/router/CanActivateFn" title="`canActivate`"/>
  <docs-pill href="api/router/CanActivateChildFn" title="`canActivateChild`"/>
  <docs-pill href="api/router/CanDeactivateFn" title="`canDeactivate`"/>
  <docs-pill href="api/router/CanMatchFn" title="`canMatch`"/>
  <docs-pill href="api/router/ResolveFn" title="`resolve`"/>
  <docs-pill href="api/router/CanLoadFn" title="`canLoad`"/>
</docs-pill-row>

라우트 가드를 사용하려면 [컴포넌트 없는 경로](api/router/Route#componentless-routes)를 사용하는 것을 고려하세요. 이는 자식 경로를 방어하는 데 유리합니다.

가드를 위한 파일을 만드세요:

```bash
ng generate guard your-guard
```

가드 파일에 사용하려는 가드 함수를 추가하세요.
다음 예제는 경로를 방어하기 위해 `canActivateFn`을 사용합니다.

```ts
export const yourGuardFunction: CanActivateFn = (
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  // 여기에 로직을 추가하세요
}
```

라우팅 모듈에서는 `routes` 구성에서 적절한 속성을 사용합니다.
여기서 `canActivate`는 라우터에게 이 특정 경로로의 탐색을 중재하도록 지시합니다.

```ts
{
  path: '/your-path',
  component: YourComponent,
  canActivate: [yourGuardFunction],
}
```

## 링크 매개변수 배열

링크 매개변수 배열은 라우터 탐색을 위한 다음과 같은 요소들을 포함합니다:

- 목적지 컴포넌트의 경로
- 경로 URL에 들어갈 필수 및 선택적 경로 매개변수

`RouterLink` 지시문을 이러한 배열에 바인딩하세요:

```angular-html
<a [routerLink]="['/heroes']">영웅들</a>
```

다음은 경로 매개변수를 지정할 때의 두 요소 배열입니다:

```angular-html
<a [routerLink]="['/hero', hero.id]">
  <span class="badge">{{ hero.id }}</span>{{ hero.name }}
</a>
```

선택적 경로 매개변수를 객체로 제공하세요, `{ foo: 'foo' }`와 같이:

```angular-html
<a [routerLink]="['/crisis-center', { foo: 'foo' }]">위기 센터</a>
```

이 세 가지 예제는 하나의 경로 수준을 가진 애플리케이션의 필요를 충족합니다.
그러나 위기 센터와 같은 자식 라우터가 있는 경우 새로운 링크 배열 가능성을 만듭니다.

다음 최소 `RouterLink` 예제는 위기 센터의 기본 자식 경로를 기반으로 구축됩니다.

```angular-html
<a [routerLink]="['/crisis-center']">위기 센터</a>
```

다음 내용을 검토하세요:

- 배열의 첫 번째 항목은 부모 경로 \(`/crisis-center`\)를 식별합니다.
- 이 부모 경로에 대한 매개변수가 없습니다.
- 자식 경로에 대한 기본값이 없으므로 하나를 선택해야 합니다.
- `CrisisListComponent`로 탐색하고 있으며, 이 경로 경로는 `/`이지만 슬래시를 명시적으로 추가할 필요는 없습니다.

애플리케이션의 루트에서 드래곤 위기로 내려가는 다음 라우터 링크를 고려하세요:

```angular-html
<a [routerLink]="['/crisis-center', 1]">드래곤 위기</a>
```

- 배열의 첫 번째 항목은 부모 경로 \(`/crisis-center`\)를 식별합니다.
- 이 부모 경로에 대한 매개변수가 없습니다.
- 두 번째 항목은 특정 위기에 대한 세부정보 \(`/:id`\)의 자식 경로를 식별합니다.
- 세부정보 자식 경로는 `id` 경로 매개변수를 요구합니다.
- 드래곤 위기의 `id`를 배열의 두 번째 항목 \(`1`\)으로 추가합니다.
- 결과 경로는 `/crisis-center/1`입니다.

위기 센터의 경로로만 `AppComponent` 템플릿을 다시 정의할 수도 있습니다:

```angular-ts
@Component({
  template: `
    <h1 class="title">Angular Router</h1>
    <nav>
      <a [routerLink]="['/crisis-center']">위기 센터</a>
      <a [routerLink]="['/crisis-center/1', { foo: 'foo' }]">드래곤 위기</a>
      <a [routerLink]="['/crisis-center/2']">상어 위기</a>
    </nav>
    <router-outlet />
  `
})
export class AppComponent {}
```

요약하면, 하나, 둘 또는 그 이상의 경로 수준으로 애플리케이션을 작성할 수 있습니다.
링크 매개변수 배열은 모든 경로 깊이와 모든 합법적인 경로의 순서를 표현할 수 있는 유연성을 제공합니다, \(필수\) 라우터 매개변수와 \(선택적\) 경로 매개변수 객체를 포함하여.

## `LocationStrategy` 및 브라우저 URL 스타일

라우터가 새 컴포넌트 뷰로 탐색할 때 브라우저의 위치와 기록을 해당 뷰의 URL로 업데이트합니다.

현대의 HTML5 브라우저는 [history.pushState](https://developer.mozilla.org/docs/Web/API/History_API/Working_with_the_History_API#adding_and_modifying_history_entries 'HTML5 브라우저 역사 푸시 상태')를 지원합니다. 이 기술은 서버 페이지 요청을 유발하지 않고 브라우저의 위치와 기록을 변경합니다.
라우터는 페이지 로드를 요구하는 URL과 구별할 수 없는 "자연스러운" URL을 구성할 수 있습니다.

다음은 이 "HTML5 pushState" 스타일의 위기 센터 URL입니다:

```text
localhost:3002/crisis-center
```

이전 브라우저들은 위치 URL이 변경될 때 서버에 페이지 요청을 보냅니다. 변화를 "#" \(해시\) 뒤에서 유발한 경우를 제외하고는.
라우터는 해시가 있는 애플리케이션 내 라우트 URL을 구성함으로써 이 예외를 이용할 수 있습니다.
다음은 위기 센터로 라우팅되는 "해시 URL"입니다.

```text
localhost:3002/src/#/crisis-center
```

라우터는 두 개의 `LocationStrategy` 제공자로 두 가지 스타일을 모두 지원합니다:

| 제공자                  | 세부정보                                |
| :--------------------- | :----------------------------------- |
| `PathLocationStrategy` | 기본 "HTML5 pushState" 스타일입니다.  |
| `HashLocationStrategy` | "해시 URL" 스타일입니다.               |

`RouterModule.forRoot()` 함수는 `LocationStrategy`를 `PathLocationStrategy`로 설정하여 기본 전략으로 만듭니다.
부트스트랩 과정 중에 오버라이드를 통해 `HashLocationStrategy`로 전환할 옵션도 제공합니다.

도움말: 제공자 및 부트스트랩 프로세스에 대한 자세한 내용은 [의존성 주입](guide/di/dependency-injection-providers)을 참조하세요.

## 라우팅 전략 선택

프로젝트 개발 초기에 라우팅 전략을 선택해야 합니다. 애플리케이션이 프로덕션되면 사이트 방문자는 애플리케이션 URL 참조를 사용하고 의존하게 되기 때문입니다.

거의 모든 Angular 프로젝트는 기본 HTML5 스타일을 사용하는 것이 좋습니다.
이는 사용자에게 이해하기 쉬운 URL을 생성하며 서버 측 렌더링 옵션을 보존합니다.

서버에서 주요 페이지를 렌더링하는 것은 애플리케이션이 처음 로드될 때 인지된 반응성을 크게 개선할 수 있는 기술입니다.
그렇지 않으면 10초 이상 걸릴 수 있는 애플리케이션을 서버에서 렌더링하고 사용자의 장치에 1초 미만으로 전달할 수 있습니다.

이 옵션은 애플리케이션 URL이 해시 \(`#`\) 문자가 없는 일반 웹 URL처럼 보일 때만 사용할 수 있습니다.

## `<base href>`

라우터는 탐색에 브라우저의 [history.pushState](https://developer.mozilla.org/docs/Web/API/History_API/Working_with_the_History_API#adding_and_modifying_history_entries 'HTML5 브라우저 역사 푸시 상태')를 사용합니다.
`pushState`를 사용하면 애플리케이션 내 URL 경로를 사용자 정의할 수 있습니다. 예를 들어 `localhost:4200/crisis-center`입니다.
애플리케이션 내 URL은 서버 URL과 구별되지 않을 수 있습니다.

현대 HTML5 브라우저는 처음으로 `pushState`를 지원하였습니다. 그래서 많은 사람들이 이러한 URL을 "HTML5 스타일" URL이라고 부르는 이유입니다.

도움말: HTML5 스타일 탐색은 라우터의 기본값입니다.
[LocationStrategy 및 브라우저 URL 스타일](#locationstrategy-and-browser-url-styles) 섹션에서 HTML5 스타일이 바람직한 이유와 그 동작을 조정하는 방법, 그리고 필요 시 이전 해시 \(`#`\) 스타일로 전환하는 방법을 알아보세요.

`pushState` 라우팅이 작동하려면 애플리케이션의 `index.html`에 [`<base href>` 요소](https://developer.mozilla.org/docs/Web/HTML/Element/base 'base href')를 추가해야 합니다.
브라우저는 CSS 파일, 스크립트 및 이미지에 대한 상대 URL을 참조할 때 `<base href>` 값을 사용하여 접두사로 붙입니다.

`<head>` 태그 바로 뒤에 `<base>` 요소를 추가하세요.
`app` 폴더가 애플리케이션 루트인 경우 이 애플리케이션의 `index.html`에서 `href` 값을 다음과 같이 설정합니다.

<docs-code header="src/index.html (base-href)" path="adev/src/content/examples/router/src/index.html" visibleRegion="base-href"/>

### HTML5 URL과 `<base href>`

다음 가이드라인은 URL의 다양한 부분을 참조합니다.
이 다이어그램은 해당 부분이 무엇을 나타내는지 설명합니다:

<docs-code hideCopy language="text">
foo://example.com:8042/over/there?name=ferret#nose
\_/   \______________/\_________/ \_________/ \__/
 |           |            |            |        |
스킴      권한         경로        쿼리     프래그먼트
</docs-code>

라우터가 기본적으로 [HTML5 pushState](https://developer.mozilla.org/docs/Web/API/History_API#Adding_and_modifying_history_entries '브라우저 역사 푸시 상태') 스타일을 사용하지만, `<base href>`로 해당 전략을 구성해야 합니다.

전략을 구성하는 선호되는 방법은 `index.html`의 `<head>`에 [`<base href>` 요소](https://developer.mozilla.org/docs/Web/HTML/Element/base 'base href') 태그를 추가하는 것입니다.

```angular-html
<base href="/">
```

이 태그 없이 "딥 링크"를 애플리케이션에 사용 시 브라우저가 리소스 \(이미지, CSS, 스크립트\)를 로드할 수 없게 될 수 있습니다.

일부 개발자는 `<head>` 또는 `index.html`에 접근할 수 없기 때문에 `<base>` 요소를 추가하지 못할 수 있습니다.

이러한 개발자는 다음 두 단계를 통해 여전히 HTML5 URL을 사용할 수 있습니다:

1. 라우터에 적절한 `APP_BASE_HREF` 값을 제공합니다.
1. 모든 웹 리소스에 대해 루트 URL \(URL에 `authority`\)를 사용합니다: CSS, 이미지, 스크립트 및 템플릿 HTML 파일.

   - `<base href>` `path`는 "/"로 끝나야 하며, 브라우저는 오른쪽 끝의 "`/`" 뒤의 문자를 무시합니다.
   - `<base href>`가 쿼리 부분을 포함하면, 링크의 `path`가 비어있고 쿼리가 없는 경우에만 해당 쿼리가 사용됩니다.
     이는 `<base href>`의 쿼리는 `HashLocationStrategy`를 사용할 때만 포함됨을 의미합니다.

   - 페이지의 링크가 루트 URL \(`authority`\)인 경우, `<base href>`는 사용되지 않습니다.
     이렇게 하면 권한이 있는 `APP_BASE_HREF`가 모든 Angular에서 생성한 링크가 `<base href>` 값을 무시하게 합니다.

   - `<base href>`의 프래그먼트는 _결코_ 지속되지 않습니다.

목표 URI를 구성하는 데 `<base href>`가 어떻게 사용되는지에 대한 더 완전한 정보는 [RFC](https://tools.ietf.org/html/rfc3986#section-5.2.2) 참조 섹션에서 찾아볼 수 있습니다.

### `HashLocationStrategy`

`HashLocationStrategy`를 사용하려면 `AppModule`의 `RouterModule.forRoot()`의 두 번째 인수로 객체의 `useHash: true`를 제공하세요.

```ts
providers: [
  provideRouter(appRoutes, withHashLocation())
]
```

`RouterModule.forRoot`를 사용할 때는 두 번째 인수에 `useHash: true`를 구성합니다: `RouterModule.forRoot(routes, {useHash: true})`.