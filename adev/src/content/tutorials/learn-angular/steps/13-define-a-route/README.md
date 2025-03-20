# 경로 정의하기

이제 앱이 Angular Router를 사용하도록 설정했으므로, 경로를 정의해야 합니다.

이 활동에서는 앱과 함께 경로를 추가하고 구성하는 방법을 배웁니다.

<hr>

<docs-workflow>

<docs-step title="`app.routes.ts`에서 경로 정의하기">

앱에는 표시할 두 개의 페이지가 있습니다: (1) 홈 페이지 및 (2) 사용자 페이지.

경로를 정의하려면 `app.routes.ts`의 `routes` 배열에 경로 객체를 추가합니다. 이 객체는 다음을 포함합니다:

- 경로의 `path` (자동으로 루트 경로에서 시작됨 (즉, `/`))
- 경로에 표시할 `component`

```ts
import {Routes} from '@angular/router';

import {HomeComponent} from './home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
];
```

위의 코드는 `HomeComponent`를 경로로 추가하는 방법의 예입니다. 이제 플레이그라운드에서 `UserComponent`와 함께 이를 구현하세요.

`UserComponent`의 경로에는 `'user'`를 사용하세요.

</docs-step>

<docs-step title="경로 정의에 제목 추가하기">

경로를 올바르게 정의하는 것 외에도, Angular Router는 사용자가 탐색할 때마다 각 경로에 `title` 속성을 추가하여 페이지 제목을 설정할 수 있게 해줍니다.

`app.routes.ts`에서 기본 경로(`path: ''`)와 사용자 경로에 `title` 속성을 추가하세요. 예를 들면 다음과 같습니다:

<docs-code language="ts" highlight="[8]">
import {Routes} from '@angular/router';

import {HomeComponent} from './home/home.component';

export const routes: Routes = [
  {
    path: '',
    title: '앱 홈 페이지',
    component: HomeComponent,
  },
];
</docs-code>

</docs-step>

</docs-workflow>

이 활동에서 Angular 앱에서 경로를 정의하고 구성하는 방법을 배웠습니다. 훌륭한 작업입니다. 🙌

앱에서 라우팅을 완전히 활성화하는 여정은 거의 완료되었습니다. 계속 진행하세요.