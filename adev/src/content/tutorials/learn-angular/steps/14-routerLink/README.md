# Use RouterLink for Navigation

앱의 현재 상태에서는 앱 내의 내부 링크를 클릭할 때마다 전체 페이지가 새로 고쳐집니다. 이것은 작은 앱에서는 큰 문제가 아닌 것처럼 보일 수 있지만, 더 큰 페이지와 더 많은 콘텐츠가 있을 경우 성능에 영향을 미칠 수 있습니다. 사용자들은 자산을 다시 다운로드하고 계산을 다시 수행해야 합니다.

이 활동에서는 Angular Router를 최대한 활용하기 위해 `RouterLink` 지시어를 사용하는 방법을 배울 것입니다.

<hr>

<docs-workflow>

<docs-step title="Import `RouterLink` directive">

`app.component.ts`에서 기존의 `@angular/router`에서 `RouterLink` 지시어를 가져오는 구문을 추가하고, 컴포넌트 데코레이터의 `imports` 배열에 추가합니다.

```ts
...
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterLink, RouterOutlet],
  ...
})
```

</docs-step>

<docs-step title="Add a `routerLink` to template">

`RouterLink` 지시어를 사용하려면 `href` 속성을 `routerLink`로 교체합니다. 이 변경사항으로 템플릿을 업데이트합니다.

```angular-ts
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  ...
  template: `
    ...
    <a routerLink="/">Home</a>
    <a routerLink="/user">User</a>
    ...
  `,
  imports: [RouterLink, RouterOutlet],
})
```

</docs-step>

</docs-workflow>

이제 내비게이션의 링크를 클릭하면 깜빡임이 없고 오직 페이지 자체의 내용(즉, `router-outlet`)만 변경되는 것을 볼 수 있어야 합니다 🎉

Angular로 라우팅에 대해 배우신 것 정말 잘했습니다. 이것은 `Router` API의 표면에 불과하며, 더 많은 내용을 배우려면 [Angular Router Documentation](guide/routing)를 확인하세요.