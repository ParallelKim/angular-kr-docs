# 지연 로딩 경로로의 마이그레이션

이 스키마틱은 개발자가 즉시 로딩된 구성 요소 경로를 지연 로딩된 경로로 변환하는 데 도움을 줍니다. 이를 통해 빌드 프로세스는 프로덕션 번들을 더 작은 청크로 나눌 수 있으며, 모든 경로를 포함하는 큰 JS 번들을 피할 수 있어 애플리케이션의 초기 페이지 로드에 부정적인 영향을 미칩니다.

다음 명령어를 사용하여 스키마틱을 실행하세요:

<docs-code language="shell">

ng generate @angular/core:route-lazy-loading

</docs-code>

### `path` 구성 옵션

기본적으로 마이그레이션은 전체 애플리케이션을 진행합니다. 특정 파일 집합에 이 마이그레이션을 적용하려면 아래와 같이 path 인수를 전달할 수 있습니다:

<docs-code language="shell">

ng generate @angular/core:route-lazy-loading --path src/app/sub-component

</docs-code>

path 매개변수의 값은 프로젝트 내의 상대 경로입니다.

### 어떻게 작동하나요?

스키마틱은 애플리케이션 경로가 정의된 모든 위치를 찾으려고 시도합니다:

- `RouterModule.forRoot` 및 `RouterModule.forChild`
- `Router.resetConfig`
- `provideRouter`
- `provideRoutes`
- `Routes` 또는 `Route[]` 타입의 변수 (예: `const routes: Routes = [{...}]`)

마이그레이션은 경로의 모든 구성 요소를 확인하고, 그들이 독립적이며 즉시 로딩되었는지 확인한 후, 그렇다면 이를 지연 로딩된 경로로 변환합니다.

#### 이전

<docs-code language="typescript">
// app.module.ts
import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: 'home',
        // HomeComponent는 독립적이며 즉시 로딩됨
        component: HomeComponent,
      },
    ]),
  ],
})
export class AppModule {}
</docs-code>

#### 이후

<docs-code language="typescript">
// app.module.ts
@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: 'home',
        // ↓ HomeComponent는 이제 지연 로딩됨
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
      },
    ]),
  ],
})
export class AppModule {}
</docs-code>

이 마이그레이션은 또한 NgModules에서 선언된 모든 구성 요소에 대한 정보를 수집하고 이를 사용하는 경로의 목록을 출력합니다 (해당 파일의 위치 포함). 이러한 구성 요소를 독립적으로 만들고 이 마이그레이션을 다시 실행하는 것을 고려하세요. 기존의 마이그레이션을 사용하여 (<https://angular-kr-docs.web.app/reference/migrations/standalone> 참조) 이러한 구성 요소를 독립적으로 변환할 수 있습니다.
