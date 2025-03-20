# 라우팅 개요

대부분의 애플리케이션에서는 앱이 단일 페이지 이상이 필요해지는 시점이 있습니다. 그 시점이 불가피하게 오면, 라우팅은 사용자에게 성능 이야기의 큰 부분이 됩니다.

이 활동에서는 Angular Router를 사용하도록 앱을 설정하고 구성하는 방법을 배웁니다.

<hr>

<docs-workflow>

<docs-step title="app.routes.ts 파일 만들기">

`app.routes.ts` 안에서 다음 변경 사항을 수행합니다:

1. `@angular/router` 패키지에서 `Routes`를 임포트합니다.
1. `Routes` 타입의 `routes`라는 상수를 내보내고 값으로 `[]`를 할당합니다.

```ts
import {Routes} from '@angular/router';

export const routes: Routes = [];
```

</docs-step>

<docs-step title="공급자에 라우팅 추가">

`app.config.ts`에서 Angular Router로 앱을 구성하는 다음 단계를 수행합니다:

1. `@angular/router`에서 `provideRouter` 함수를 임포트합니다.
1. `./app.routes.ts`에서 `routes`를 임포트합니다.
1. `providers` 배열에서 매개변수로 `routes`를 전달하여 `provideRouter` 함수를 호출합니다.

<docs-code language="ts" highlight="[2,3,6]">
import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
</docs-code>

</docs-step>

<docs-step title="컴포넌트에 `RouterOutlet` 임포트">

마지막으로, Angular Router를 사용하려면 앱에 라우터가 원하는 콘텐츠를 표시할 위치를 알려야 합니다. 이를 위해 `@angular/router`에서 제공하는 `RouterOutlet` 지시문을 사용합니다.

`AppComponent`의 템플릿을 업데이트하여 `<router-outlet />`를 추가합니다.

<docs-code language="angular-ts" highlight="[11]">
import {RouterOutlet} from '@angular/router';

@Component({
  ...
  template: `
    <nav>
      <a href="/">홈</a>
      |
      <a href="/user">사용자</a>
    </nav>
    <router-outlet />
  `,
  imports: [RouterOutlet],
})
export class AppComponent {}
</docs-code>

</docs-step>

</docs-workflow>

이제 앱이 Angular Router를 사용하도록 설정되었습니다. 잘 했어요! 🙌

다음 단계로 나아가 앱의 라우트를 정의하는 방법을 배워보세요.