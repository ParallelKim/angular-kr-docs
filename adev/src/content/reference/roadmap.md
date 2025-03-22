<docs-decorative-header title="Angular 로드맵" imgSrc="adev/src/assets/images/roadmap.svg"> <!-- markdownlint-disable-line -->
Angular 팀이 웹에서 어떻게 동력을 구축하고 있는지 알아보세요.
</docs-decorative-header>

오픈 소스 프로젝트로서, Angular의 일일 커밋, PR 및 동향은 모두 GitHub에서 추적 가능합니다. 매일의 작업이 프레임워크의 미래와 어떻게 연결되는지를 보다 투명하게 하기 위해, 우리의 로드맵은 팀의 현재 및 미래 계획된 비전을 집약합니다.

다음 프로젝트는 특정 Angular 버전과 관련이 없습니다. 우리는 이들을 완료 후에 릴리스할 것이며, 이는 우리의 릴리스 일정에 따라 특정 버전의 일부가 될 것입니다. 예를 들어, 완료 후 다음 마이너에서 기능을 릴리스하거나, 파괴적 변경사항이 포함된 경우 다음 주요 버전에서 릴리스합니다.

현재 Angular는 프레임워크에 대해 두 가지 목표를 가지고 있습니다:

1. [Angular 개발자 경험 개선하기](#improving-the-angular-developer-experience) 및
2. [프레임워크 성능 개선하기](#fast-by-default).

특정 프로젝트 작업을 통해 이러한 목표를 달성하기 위한 계획에 대해 계속 읽어보세요.

## 현대 Angular 탐색하기

로드맵의 최신 Angular 기능으로 개발을 시작하세요. 이 목록은 우리의 로드맵에서 새 기능의 현재 상태를 나타냅니다:

### 실험해보기 가능

* [증분 수화](/guide/incremental-hydration)
* [존 없는 변화 감지](/guide/experimental/zoneless)
* [i18n 블록에 대한 수화 지원](/api/platform-browser/withI18nSupport)
* [리소스 API](/guide/signals/resource)
* [이펙트 API](/api/core/effect)
* [연결된 신호 API](/guide/signals/linked-signal)

### 프로덕션 준비 완료

* [Angular 신호 탐색하기](/guide/signals)
* [SSR을 통한 이벤트 재생](/api/platform-browser/withEventReplay)
* [지연 가능한 뷰](/guide/defer)
* [내장 제어 흐름](/guide/templates/control-flow)
* [로컬 변수 선언](/guide/templates/variables)
* [신호 입력](/guide/signals/inputs)
* [모델 입력](/guide/signals/model)
* [신호 쿼리](/guide/signals/queries)
* [함수 기반 출력](/guide/components/outputs)
* [라우트 수준 렌더 모드](/guide/ssr)

## Angular 개발자 경험 개선하기

### 개발자 속도

<docs-card-container>
  <docs-card title="Angular 신호 제공하기" href="https://github.com/angular/angular/discussions/49685">
  이 프로젝트는 신호를 반응성 기본 요소로 도입하여 Angular 반응성 모델을 재고합니다. 초기 계획은 수백 개의 토론, 개발자와의 대화, 피드백 세션, 사용자 경험 연구 및 일련의 RFC를 초래하였으며, 이는 1,000개 이상의 댓글을 받았습니다.

  v17 릴리스의 일환으로 Angular 신호 라이브러리를 개발자 미리보기에서 졸업했습니다. v19에서는 신호 기반 쿼리, 입력 및 모델 입력을 안정적 상태로 이동했습니다. 다음으로, 이 프로젝트를 완료하기 전에 효과를 최종화해야 합니다.
  </docs-card>
  <docs-card title="존 없는 Angular" href="">
  v18에서는 Angular에 실험적 존 없는 지원을 추가했습니다. 이는 개발자가 번들에 zone.js를 포함하지 않고도 프레임워크를 사용할 수 있게 하여 성능, 디버깅 경험 및 상호 운영성을 개선합니다. 초기 릴리스의 일환으로 Angular CDK 및 Angular Material에도 존 없는 지원을 도입했습니다.

  v19에서는 서버 사이드 렌더링에 존 없는 지원을 도입하고, 일부 엣지 케이스를 다루었으며, 존 없는 프로젝트를 스캐폴드할 수 있는 스키매틱을 만들었습니다. 우리는 <a href="https://fonts.google.com/">Google Fonts</a>를 존 없는 것으로 전환하여 성능, 개발자 경험을 개선하고 이 기능을 개발자 미리보기로 전환하기 전에 해결해야 할 격차를 식별할 수 있었습니다. 다음 몇 달 동안 더 많은 업데이트를 기대해 주세요.
  </docs-card>
  <docs-card title="신호 통합" href="">
  우리는 신호와 함께 폼, HTTP 및 라우터와 같은 기본 Angular 패키지의 통합 개선 작업을 하고 있습니다. 이 프로젝트의 일환으로, 전반적인 개발자 경험을 향상시키는 편리한 신호 기반 API 또는 래퍼를 도입할 기회를 모색할 것입니다.
  </docs-card>
  <docs-card title="Angular DevTools에서 신호 디버깅" href="">
  Angular의 신호 진화와 함께, 우리는 이들을 디버깅하기 위한 더 나은 도구를 개발하고 있습니다. 우선적으로 신호를 검사하고 디버깅할 UI가 필요합니다.
  </docs-card>
  <docs-card title="HMR(핫 모듈 리로드) 개선" href="https://github.com/angular/angular/issues/39367#issuecomment-1439537306">
  우리는 핫 모듈 교체를 통해 더 빠른 편집/새로 고침 주기를 만들기 위해 노력하고 있습니다.

  Angular v19에서는 CSS 및 템플릿 HMR에 대한 초기 지원을 출시했습니다. 이 프로젝트를 완료하기 전에 개발자의 요구를 충족하는지 피드백을 계속 수집할 것입니다.
  </docs-card>
</docs-card-container>

### Angular Material 및 CDK 개선하기

<docs-card-container>
  <docs-card title="새 CDK 기본 요소" href="">
  우리는 [Combobox](https://www.w3.org/TR/wai-aria-practices-1.1/#combobox)와 같은 WAI-ARIA 디자인 패턴에 기반하여 사용자 정의 컴포넌트를 만드는 데 도움이 되는 새로운 CDK 기본 요소를 작업하고 있습니다. Angular v14에서는 이 프로젝트의 일환으로 안정적인 [메뉴 및 대화 상자 기본 요소](https://material.angular.io/cdk/categories)를 도입했으며, v15에서는 리스트박스를 도입했습니다.
  </docs-card>
  <docs-card title="Angular 컴포넌트 접근성" href="">
  우리는 접근성 기준인 WCAG에 대해 Angular Material에서 컴포넌트를 평가하고 이 과정에서 발생하는 문제를 해결하기 위해 작업하고 있습니다.
  </docs-card>
</docs-card-container>

### 도구 개선하기

<docs-card-container>
  <docs-card title="ng test로 단위 테스트 도구 현대화하기" href="">
  v12에서는 Protractor를 Cypress, Nightwatch, Puppeteer, Playwright 및 Webdriver.io와 같은 현대적인 대안으로 대체하여 Angular 엔드 투 엔드 테스트 경험을 재검토했습니다. 우리는 다음으로 `ng test`를 다루어 Angular의 단위 테스트 경험을 현대화하고자 합니다.

  현재 Web Test Runner, Vitest 및 Jest를 Angular 프로젝트에 대한 새로운 테스트 실행기의 후보로 평가하고 있으며, 기존 테스트가 깨지지 않도록 Jasmine을 단언 라이브러리로 유지할 계획입니다.
  </docs-card>
  <docs-card title="Angular CLI에서 Nitro 지원 평가하기" href="https://nitro.unjs.io/">
  우리는 더 많은 배포 옵션, 다양한 런타임과 파일 기반 라우팅과의 향상된 서버 사이드 렌더링 호환성 등 Nitro에서 제공하는 기능 세트에 대해 흥미롭게 생각하고 있습니다. 2025년에 우리는 Angular 서버 사이드 렌더링 모델에서 Nitro가 어떻게 잘 맞는지를 평가할 것입니다.

  조사 진행 사항에 따라 업데이트를 공유할 예정입니다.
  </docs-card>
</docs-card-container>

## 기본적으로 빠르다

<docs-card-container>
  <docs-card title="증분 수화 활성화하기" href="">
  v17에서는 수화를 개발자 미리보기에서 졸업하였으며 LCP에서 40-50% 향상이 지속적으로 관찰되고 있습니다. 그 이후로 우리는 증분 수화를 프로토타입으로 제작하였고 ng-conf에서 데모를 공유했습니다.

  v19에서는 `@defer` 블록을 기반으로 개발자 미리보기 모드에서 증분 수화를 출시했습니다. 사용해보고 <a href="https://github.com/angular/angular/issues">피드백을 공유해 주세요</a>!
  </docs-card>
  <docs-card title="서버 라우트 구성" href="">
  우리는 서버에서 더 인체공학적인 라우트 구성을 가능하게 하기 위해 작업하고 있습니다. 어떤 라우트를 서버 사이드 렌더링, 미리 렌더링 또는 클라이언트 사이드 렌더링해야 하는지를 선언하는 것이 손쉬워지기를 원합니다.

  Angular v19에서는 Angular가 미리 렌더링, 서버 사이드 렌더링 또는 클라이언트 사이드 렌더링할 라우트를 세분화하여 구성할 수 있는 라우트 수준 렌더 모드의 개발자 미리보기를 출시했습니다.
  </docs-card>
</docs-card-container>

## 미래 작업, 탐색 및 프로토타이핑

이 섹션은 잠재적인 미래 프로젝트의 탐색 및 프로토타이핑을 나타냅니다. 합리적인 결과는 현재 솔루션이 최선의 옵션이라는 결론에 도달하는 것입니다. 다른 프로젝트는 RFC로 이어지거나 진행 중인 프로젝트로 졸업하거나, 우리의 프레임워크와 함께 웹이 계속 혁신함에 따라 우선순위가 낮아질 수 있습니다.

<docs-card-container>
  <docs-card title="신호 양식" href="">
  우리는 Angular 양식에 대한 기존 피드백을 분석하고 개발자의 요구를 충족하며 반응 상태 관리에 신호를 사용하는 솔루션을 설계할 계획입니다.
  </docs-card>
  <docs-card title="선택자 없는" href="">
  보일러플레이트를 줄이고 독립형 컴포넌트의 인체공학성을 개선하기 위해 선택자를 선택 사항으로 만들 수 있는 솔루션을 설계하고 있습니다. 컴포넌트나 지시어를 사용하려면 이를 가져오고 컴포넌트의 템플릿에서 직접 사용할 수 있습니다.

  우리는 아직 선택자 없는 계획의 초기 단계에 있습니다. 초기 디자인을 가지고 준비가 되었을 때 요청 사항을 공유할 것입니다.
  </docs-card>
  <docs-card title="스트리밍 서버 사이드 렌더링 탐색" href="">
  최근 몇 개 릴리스 동안, Angular의 서버 사이드 렌더링 스토리를 더욱 견고하게 만들기 위해 작업해왔습니다. 우리의 우선 순위 목록에는 존이 없는 애플리케이션을 위한 스트리밍 서버 사이드 렌더링 탐색이 포함되어 있습니다.
  </docs-card>
  <docs-card title="작성 형식 개선 조사" href="">
  우리의 개발자 설문 조사 결과를 바탕으로, 컴포넌트 작성 형식의 인체공학성을 개선할 기회가 있다고 보았습니다. 이 과정의 첫 번째 단계는 요구 사항을 수집하고 문제 영역을 이해하여 RFC로 발전하는 것입니다. 우리는 진행 상황에 따라 업데이트를 공유할 것입니다. 미래 작업의 높은 우선 순위는 하위 호환성 및 상호 운용성입니다.
  </docs-card>
  <docs-card title="TestBed 개선" href="">
  수년간의 피드백 및 최근 Angular 런타임의 업데이트를 바탕으로, 우리는 TestBed를 평가하여 단위 테스트를 개발할 때 개발자 경험을 개선하고 보일러플레이트를 줄일 기회를 식별할 것입니다.
  </docs-card>
  <docs-card title="점진적 채택" href="">
  Angular는 다중 페이지 앱에 상호작용성을 추가하거나 다른 프레임워크로 구축된 기존 애플리케이션 내에 Angular 구성 요소를 삽입하는 도구와 유연성이 부족합니다.

  이 프로젝트의 일환으로, 우리는 교차 프레임워크 상호 운용성 및 이 사용 사례를 가능하게 하기 위한 빌드 도구 제공의 요구 사항 공간을 탐색할 것입니다.
  </docs-card>
</docs-card-container>

## 완료된 프로젝트

<docs-card-container>
  <docs-card title="2차원 드래그 앤 드롭 지원" link="2024년 2분기에 완료됨" href="https://github.com/angular/components/issues/13372">
  이 프로젝트의 일환으로, Angular CDK 드래그 앤 드롭에 대한 혼합 방향 지원을 구현했습니다. 이는 저장소에서 가장 많은 요청을 받은 기능 중 하나입니다.
  </docs-card>
  <docs-card title="SSR 및 사전 렌더링을 통한 이벤트 재생" link="2024년 4분기에 완료됨" href="https://angular-kr-docs.web.app/api/platform-browser/withEventReplay">
  v18에서 서버 사이드 렌더링 또는 사전 렌더링을 사용할 때 이벤트 재생 기능을 도입했습니다. 이 기능을 위해 Google.com에서 실행되는 이벤트 배치 기본 요소(이전에는 jsaction으로 알려짐)에 의존합니다.

  Angular v19에서 우리는 이벤트 재생을 안정적 상태로 졸업하고 모든 새로운 프로젝트에 대해 기본적으로 활성화했습니다.
  </docs-card>
  <docs-card title="Angular 언어 서비스와 스키매틱 통합" link="2024년 4분기에 완료됨" href="">
  현대 Angular API를 더 쉽게 사용할 수 있도록 Angular 언어 서비스와 스키매틱 간의 통합을 활성화하여 단일 클릭으로 애플리케이션을 리팩토링할 수 있습니다.
  </docs-card>
  <docs-card title="언어 서비스와 함께 독립형 가져오기 간소화" link="2024년 4분기에 완료됨" href="">
  이 이니셔티브의 일환으로, 언어 서비스는 독립형 및 NgModule 기반 애플리케이션에서 자동으로 구성 요소 및 파이프를 가져옵니다. 또한, 우리는 독립형 구성 요소 내에서 사용하지 않는 가져오기를 강조하는 템플릿 진단을 추가하여 애플리케이션 번들을 더 작게 만드는 데 도움을 줄 것입니다.
  </docs-card>
  <docs-card title="로컬 템플릿 변수" link="2024년 3분기에 완료됨">
  Angular의 로컬 템플릿 변수 지원을 출시했습니다. 추가 정보는 [`@let` 문서](https://angular-kr-docs.web.app/api/core/@let)를 참조하세요.
  </docs-card>
  <docs-card title="Angular Material의 사용자 정의 가능성 확장" link="2024년 2분기에 완료됨" href="https://material.angular.io/guide/theming">
  Angular Material 구성 요소의 더 나은 사용자 정의를 제공하고 Material 3 기능을 가능하게 하기 위해 Google의 Material Design 팀과 협력하여 토큰 기반 테마 API를 정의할 것입니다.

  v17.2에서는 Angular Material 3에 대한 실험적 지원을 공유하였고, v18에서는 이를 안정적으로 졸업했습니다.
  </docs-card>
  <docs-card title="지연 로딩 도입" link="2024년 2분기에 완료됨" href="https://next.angular.dev/guide/defer">
  v17에서는 개발자 미리보기에서 지연 가능한 뷰를 출시하였으며, 이는 지연된 코드 로딩을 위한 인체공학적 API를 제공합니다. v18에서는 라이브러리 개발자를 위해 지연 가능한 뷰를 활성화하고 API를 안정적으로 전환했습니다.
  </docs-card>
  <docs-card title="Angular DevTools에서 iframe 지원" link="2024년 2분기에 완료됨" href="">
  페이지 내에 iframe으로 포함된 Angular 애플리케이션의 디버깅 및 프로파일링을 활성화했습니다.
  </docs-card>
  <docs-card title="기존 하이브리드 렌더링 프로젝트를 esbuild 및 vite로 전환하는 자동화" link="2024년 2분기에 완료됨" href="tools/cli/build-system-migration">
  v17에서는 vite 및 esbuild 기반의 애플리케이션 빌더를 출시하고, 기본적으로 새로운 프로젝트에 대해 활성화했습니다. 하이브리드 렌더링을 사용하는 프로젝트의 빌드 시간을 최대 87% 향상시킵니다. v18의 일환으로 기존 하이브리드 렌더링 프로젝트를 새로운 빌드 파이프라인으로 мигрировать하기 위한 스키매틱과 가이드를 제공했습니다.
  </docs-card>
  <docs-card title="Angular 개발자를 위한 공식 홈페이지로 Angular.dev 만들기" link="2024년 2분기에 완료됨" href="https://goo.gle/angular-dot-dev">
  Angular.dev는 Angular 개발을 위한 새 사이트, 도메인 및 홈입니다. 이 새 사이트는 Angular의 최신 기능으로 개발자가 빌드하는 데 도움이 되는 업데이트된 문서, 튜토리얼 및 지침을 포함하고 있습니다.
  </docs-card>
  <docs-card title="내장 제어 흐름 도입" link="2024년 2분기에 완료됨" href="https://next.angular-kr-docs.web.app/essentials/conditionals-and-loops">
  v17에서는 새로운 제어 흐름의 개발자 미리보기 버전을 출시했습니다. 이는 성능 개선과 템플릿 작성의 인체공학성을 크게 향상시킵니다. 또한 기존 `*ngIf`, `*ngFor`, 및 `*ngSwitch`의 마이그레이션을 제공하여 프로젝트를 새로운 구현으로 이동할 수 있도록 했습니다. v18부터 내장 제어 흐름은 이제 안정적입니다.
  </docs-card>
  <docs-card title="시작하기 튜토리얼 현대화" link="2023년 4분기에 완료됨" href="">
  지난 두 분기 동안 우리는 독립형 구성 요소를 기반으로 하는 새로운 [비디오](https://www.youtube.com/watch?v=xAT0lHYhHMY&list=PL1w1q3fL4pmj9k1FrJ3Pe91EPub2_h4jF)와 [텍스트](https://angular-kr-docs.web.app/tutorials/learn-angular) 튜토리얼을 개발했습니다.
  </docs-card>
  <docs-card title="현대 번들러 조사" link="2023년 4분기에 완료됨" href="guide/hydration">
  Angular v16에서는 `ng build` 및 `ng serve`를 지원하는 esbuild 기반 빌더의 개발자 미리보기를 출시했습니다. `ng serve` 개발 서버는 Vite와 esbuild 및 Angular 컴파일러의 다중 파일 컴파일을 사용합니다. v17에서는 이 빌드 도구를 개발자 미리보기에서 졸업하고 기본적으로 새로운 프로젝트에 대해 활성화했습니다.
  </docs-card>
  <docs-card title="의존성 주입 디버깅 API 도입" link="2023년 4분기에 완료됨" href="tools/devtools">
  Angular 및 Angular DevTools의 디버깅 유틸리티를 개선하기 위해 의존성 주입 런타임에 대한 액세스를 제공하는 API를 개발할 것입니다. 이 프로젝트의 일환으로, 우리는 인젝터 계층 구조와 해당 공급자와의 의존성을 탐색할 수 있는 디버깅 메서드를 노출합니다. v17부터 우리는 의존성 주입 생명주기에 참여할 수 있는 기능을 출시했습니다. 우리는 또한 각 개별 노드에 선언된 공급자를 검사하는 인젝터 트리 시각화를 시작했습니다.
  </docs-card>
  <docs-card title="독립형 구성 요소에 대한 문서 및 스키매틱 개선" link="2023년 4분기에 완료됨" href="components">
  우리는 `ng new --standalone` 스키매틱 컬렉션의 개발자 미리보기를 출시하여 NgModules가 없는 앱을 생성할 수 있도록 했습니다. v17에서는 새로운 애플리케이션 작성 형식을 독립형 API로 전환하고 문서를 해당 권장 사항을 반영하도록 변경했습니다. 또한, 기존 애플리케이션을 독립형 구성 요소, 지시어 및 파이프로 업데이트하는 것을 지원하는 스키매틱을 출시했습니다. NgModules는 당분간 남아 있겠지만, 새로운 API의 이점을 탐색하여 개발자 경험을 개선하고 우리가 그들을 위해 구축하는 새로운 기능의 혜택을 누리는 것을 권장합니다.
  </docs-card>
  <docs-card title="수화 및 서버 사이드 렌더링 개선 탐색" link="2023년 4분기에 완료됨">
  v16에서는 비파괴 전체 수화의 개발자 미리보기를 출시했습니다. 추가 정보는 [수화 가이드](guide/hydration) 및 [블로그 게시물](https://blog.angular.dev/whats-next-for-server-side-rendering-in-angular-2a6f27662b67)을 참조하세요. 우리는 Core Web Vitals, 특히 [LCP](https://web.dev/lcp) 및 [CLS](https://web.dev/cls)에서 상당한 향상을 보고 있습니다. 연구실 테스트에서, 우리는 실제 애플리케이션의 LCP가 45% 더 나은 것을 지속적으로 관찰했습니다.

  v17에서는 개발자 미리보기 외부에서 수화를 출시하고, 서버 사이드 렌더링 스토리에서 일련의 개선을 수행했습니다. 여기에는 SSG를 위한 런타임 라우트 발견, 하이브리드 렌더링 애플리케이션의 최대 87% 더 빠른 빌드 시간, 새로운 프로젝트를 위한 하이브리드 렌더링을 활성화하는 프롬프트가 포함됩니다.
  </docs-card>
  <docs-card title="비파괴 전체 애플리케이션 수화" link="2023년 1분기에 완료됨" href="guide/hydration">
  v16에서는 서버 사이드 렌더링된 페이지에서 기존 DOM 노드를 재사용할 수 있는 비파괴 전체 수화의 개발자 미리보기를 출시했습니다. 이는 애플리케이션을 처음부터 다시 생성하는 대신 기존 DOM 노드를 재사용할 수 있게 합니다. 추가 정보는 수화 가이드를 참조하세요.
  </docs-card>
  <docs-card title="이미지 지시어 개선" link="2023년 1분기에 완료됨" href="guide/image-optimization">
  우리는 v15에서 Angular 이미지 지시어를 안정적으로 출시했습니다. 우리는 이미지가 명시적인 치수 대신 부모 컨테이너에 맞게 조정할 수 있는 새로운 채우기 모드 기능을 도입했습니다. 지난 두 달 동안 Chrome Aurora 팀이 이 지시어를 v12 및 이후 버전으로 백포트했습니다.
  </docs-card>
  <docs-card title="문서 리팩토링" link="2023년 1분기에 완료됨" href="https://angular.io">
  모든 기존 문서가 일관된 콘텐츠 유형 세트에 맞도록 보장합니다. 지나치게 사용된 튜토리얼 스타일의 문서를 독립적인 주제로 업데이트합니다. 우리는 주요 튜토리얼 외부의 콘텐츠가 일련의 가이드에 긴밀하게 연결되지 않고도 자급자족을 보장하기를 원합니다. 2022년 2분기에는 템플릿 콘텐츠 및 의존성 주입을 리팩토링했습니다. 2023년 1분기에는 HTTP 가이드를 개선하였으며, 이로써 문서 리팩토링 프로젝트를 보류합니다.
  </docs-card>
  <docs-card title="이미지 성능 개선" link="2022년 4분기에 완료됨" href="guide/image-optimization">
  Aurora 및 Angular 팀은 Core Web Vitals를 개선하기 위한 이미지 지시어 구현 작업을 진행하고 있습니다. 우리는 v15에서 이미지 지시어의 안정적인 버전을 출시했습니다.
  </docs-card>
  <docs-card title="현대 CSS" link="2022년 4분기에 완료됨" href="https://blog.angular.dev/modern-css-in-angular-layouts-4a259dca9127">
  웹 생태계는 지속적으로 발전하고 있으며, 우리는 Angular에서 최신 현대 표준을 반영하고자 합니다. 이 프로젝트의 목적은 Angular에서 현대 CSS 기능을 사용하는 것에 대한 가이드라인을 제공하여 개발자가 레이아웃, 스타일링 등에서 모범 사례를 따르도록 하는 것입니다. 우리는 레이아웃에 대한 공식 가이드라인을 공유하고, 이 이니셔티브의 일환으로 플렉스 레이아웃의 출판을 중단했습니다.
  </docs-card>
  <docs-card title="호스트 요소에 지시어 추가 지원" link="2022년 4분기에 완료됨" href="guide/directives/directive-composition-api">
  오래된 기능 요청 중 하나는 호스트 요소에 지시어를 추가하는 능력을 부여하는 것입니다. 이 기능은 개발자가 상속을 사용하지 않고도 추가 행동으로 자신의 구성 요소를 보강할 수 있도록 합니다. v15에서는 지시어와 함께 호스트 요소를 강화할 수 있는 지시어 조합 API를 출시했습니다.
  </docs-card>
  <docs-card title="더 나은 스택 트레이스" link="2022년 4분기에 완료됨" href="https://developer.chrome.com/blog/devtools-better-angular-debugging/">
  Angular 및 Chrome DevTools는 오류 메시지에 대한 보다 읽기 쉬운 스택 트레이스를 제공하기 위해 협력하고 있습니다. v15에서는 보다 관련성 있고 연결된 스택 트레이스를 개선했습니다. 낮은 우선 순위의 이니셔티브로서, 우리는 템플릿에 대한 보다 정확한 호출 프레임 이름을 제공하여 스택 트레이스를 더 친근하게 만드는 방법을 탐색할 것입니다.
  </docs-card>
  <docs-card title="MDC Web을 통합하여 Angular Material 구성 요소 향상" link="2022년 4분기에 완료됨" href="https://material.angular.io/guide/mdc-migration">
  MDC Web은 Google Material Design 팀에서 만든 라이브러리로, Material Design 구성 요소를 구축하기 위한 재사용 가능한 기본 요소를 제공합니다. Angular 팀은 이러한 기본 요소를 Angular Material에 통합하고 있습니다. MDC Web을 사용하면 Angular Material이 Material Design 사양에 더 가깝게 정렬됨에 따라 접근성이 확장되고 구성 요소 품질이 개선되며 팀의 속도가 개선됩니다.
  </docs-card>
  <docs-card title="선택적 NgModules용 API 구현" link="2022년 4분기에 완료됨" href="https://blog.angular.dev/angular-v15-is-now-available-df7be7f2f4c8">
  Angular를 단순화하는 과정에서, 우리는 개발자가 NgModules 없이 앱을 초기화하고, 구성 요소를 인스턴스화하며, 라우터를 사용할 수 있도록 허용하는 API를 도입하는 작업을 진행하고 있습니다. Angular v14는 독립형 구성 요소, 지시어 및 파이프를 위한 API의 개발자 미리보기를 도입합니다. 향후 몇 분기 동안 우리는 개발자로부터 피드백을 수집하고 프로젝트를 마무리하여 API를 안정적으로 만들 것입니다. 다음 단계로 TestBed, Angular 요소 등과 같은 사용 사례를 개선하는 작업을 진행할 것입니다.
  </docs-card>
  <docs-card title="템플릿에서 보호된 필드에 바인딩하기 허용" link="2022년 2분기에 완료됨" href="guide/templates/binding">
  Angular 구성 요소의 캡슐화를 개선하기 위해 구성 요소 인스턴스의 보호된 멤버에 대한 바인딩을 활성화했습니다. 이를 통해 템플릿 내에서 사용하기 위해 필드나 메서드를 공용으로 노출할 필요가 없습니다.
  </docs-card>
  <docs-card title="고급 개념에 대한 가이드 게시" link="2022년 2분기에 완료됨" href="https://angular.io/guide/change-detection">
  변화 감지에 대한 심도 있는 가이드를 개발하고 게시합니다. Angular 앱의 성능 프로파일링을 위한 콘텐츠를 개발합니다. 변화 감지가 Zone.js와 어떻게 상호작용하는지, 언제 트리거되는지, 지속 시간을 프로파일링하는 방법, 성능 최적화를 위한 일반적인 관행을 설명합니다.
  </docs-card>
  <docs-card title="전달 엄격한 타입 지정하기 위해 @angular/forms에 대한 철저한 타입 지정 롤아웃" link="2022년 2분기에 완료됨" href="guide/forms/typed-forms">
  2021년 4분기에는 형태에 대한 엄격한 타입 지정을 도입하기 위한 솔루션을 설계하고, 2022년 1분기에는 해당 요청서에 대한 논의를 마무리했습니다. 현재, 우리는 기존 프로젝트의 향상을 가능하게 할 자동 마이그레이션 단계를 포함하여 출시 전략을 구현하고 있습니다. 우리는 먼저 Google 내 2,500개 이상의 프로젝트에서 이 솔루션을 테스트하여 외부 커뮤니티에 대한 매끄러운 마이그레이션 경로를 확실히 하고자 합니다.
  </docs-card>
  <docs-card title="구식 View Engine 제거" link="2022년 1분기에 완료됨" href="https://blog.angular.dev/angular-v15-is-now-available-df7be7f2f4c8">
  모든 내부 도구를 Ivy로 전환한 후, Angular의 개념적 오버헤드를 줄이고, 패키지 크기를 줄이며, 유지 관리 비용을 줄이고, 코드베이스 복잡성을 낮추기 위해 구식 View Engine을 제거할 것입니다.
  </docs-card>
  <docs-card title="선택적 NgModules로 Angular 정신 모델 간소화" link="2022년 1분기에 완료됨" href="https://blog.angular.dev/angular-v15-is-now-available-df7be7f2f4c8">
  Angular 정신 모델 및 학습 여정을 간소화하기 위해, NgModules를 선택 사항으로 만드는 작업을 진행하고 있습니다. 이 작업은 개발자가 독립형 구성 요소를 개발하고 구성 요소의 컴파일 범위를 선언하기 위한 대안 API를 구현할 수 있게 합니다. 우리는 이 프로젝트를 고급 설계 토론으로 시작했으며, 이를 RFC로 기록했습니다.
  </docs-card>
  <docs-card title="@angular/forms에 대한 엄격한 타입 지정 설계" link="2022년 1분기에 완료됨" href="guide/forms/typed-forms">
  우리는 최소한의 하위 호환성을 유지하면서 반응형 양식에 대한 더 엄격한 타입 검사를 구현할 방법을 찾기 위해 작업하고 있습니다. 이를 통해 개발자가 개발 시간에 더 많은 문제를 발견할 수 있고 텍스트 편집기 및 IDE 지원을 개선하며 반응형 양식에 대한 타입 검사를 개선할 수 있습니다.
  </docs-card>
  <docs-card title="프레임워크와의 Angular DevTools 통합 개선" link="2022년 1분기에 완료됨" href="tools/devtools">
  Angular DevTools와 프레임워크의 통합을 개선하기 위해, 우리는 코드베이스를 angular/angular 모노 레포지토리로 이동하는 작업을 진행하고 있습니다. 여기에는 Angular DevTools를 Bazel로 전환하고 기존 프로세스 및 CI 파이프라인에 통합하는 것이 포함됩니다.
  </docs-card>
  <docs-card title="고급 컴파일러 진단 발표" link="2022년 1분기에 완료됨" href="reference/extended-diagnostics">
  Angular 컴파일러의 진단을 타입 검사 외부로 확장합니다. 정확성과 적합성 검사를 추가하여 정확성을 보장하고 최선의 관행을 보장합니다.
  </docs-card>
  <docs-card title="e2e 테스트 전략 업데이트" link="2021년 3분기에 완료됨" href="guide/testing">
  우리는 미래를 염두에 두고 e2e 테스트 전략을 제공할 수 있도록 Protractor, 커뮤니티 혁신, e2e 모범 사례의 상태를 평가하고 새로운 기회를 탐색하고자 합니다. 이 노력의 첫 단계로 우리는 RFC를 공유하고 Angular CLI와 최첨단 e2e 테스트 도구 사이의 원활한 통합을 보장하기 위해 파트너와 작업했습니다. 다음 단계로 우리는 추천 사항을 최종화하고 전환을 위한 자원 목록을 컴파일할 필요가 있습니다.
  </docs-card>
  <docs-card title="Angular 라이브러리에서 Ivy 사용" link="2021년 3분기에 완료됨" href="tools/libraries">
  2020년 초, 우리는 Ivy 라이브러리 배포에 대한 RFC를 공유했습니다. 커뮤니티의 귀중한 피드백 후, 우리는 프로젝트 설계를 개발했습니다. 이제 우리는 Ivy 라이브러리 배포, Ivy 컴파일을 사용하여 라이브러리 패키지 형식을 업데이트하고 View Engine 라이브러리 형식의 사용 중단을 차단하고 ngcc 개선 작업에 투자하고 있습니다.
  </docs-card>
  <docs-card title="자동 테스트 환경 정리로 테스트 시간 및 디버깅 개선" link="2021년 3분기에 완료됨" href="guide/testing">
  테스트 시간 및 테스트 간 격리를 개선하기 위해 TestBed가 각 테스트 실행 후 테스트 환경을 자동으로 정리하도록 변경하고자 합니다.
  </docs-card>
  <docs-card title="IE11 지원 중단 및 제거" link="2021년 3분기에 완료됨" href="https://github.com/angular/angular/issues/41840">
  Internet Explorer 11 (IE11)은 Angular가 웹 플랫폼의 일부 최신 기능을 활용하는 것을 방해해왔습니다. 이번 프로젝트의 일환으로 우리는 IE11 지원을 중단 및 제거하여 최신 기능을 제공하는 에버그린 브라우저를 위한 길을 열 것입니다. 우리는 커뮤니티의 피드백을 수집하기 위해 RFC를 진행하여 다음 단계로 나아갈 수 있도록 결정했습니다.
  </docs-card>
  <docs-card title="ES2017+를 기본 출력 언어로 활용" link="2021년 3분기에 완료됨" href="https://www.typescriptlang.org/docs/handbook/tsconfig-json.html">
  최신 브라우저를 지원함으로써 더 간결하고 표현력이 풍부하며 성능이 향상된 JavaScript의 새로운 구문을 활용할 수 있습니다. 본 프로젝트의 일환으로 우리는 이 작업을 진행하기 위한 차단 요인이 무엇인지 조사하고 단계를 밟아 이를 가능하게 할 것입니다.
  </docs-card>
  <docs-card title="Angular DevTools로 디버깅 및 성능 프로파일링 가속" link="2021년 2분기에 완료됨" href="tools/devtools">
  우리는 Angular에 대한 디버깅 및 성능 프로파일링 유틸리티를 제공하는 개발 도구를 작업하고 있습니다. 이 프로젝트는 개발자가 Angular 애플리케이션의 구성 요소 구조 및 변화 감지를 이해하는 데 도움을 주는 것을 목표로 하고 있습니다.
  </docs-card>
  <docs-card title="Angular 버전 관리 및 분기 통합으로 릴리스 간소화" link="2021년 2분기에 완료됨" href="reference/releases">
  우리는 Angular의 여러 GitHub 리포지토리(angular/angular, angular/angular-cli, angular/components) 간 릴리스 관리 도구를 통합하고자 합니다. 이 작업은 인프라를 재사용하고 프로세스를 통합 및 단순화하며 릴리스 과정의 신뢰성을 향상시키는 것을 가능하게 합니다.
  </docs-card>
  <docs-card title="커밋 메시지 표준화로 개발자 일관성 증가" link="2021년 2분기에 완료됨" href="https://github.com/angular/angular">
  우리는 Angular 리포지토리(angular/angular, angular/components, angular/angular-cli) 간 커밋 메시지 요구 사항 및 적합성 통합을 통한 개발 프로세스의 일관성을 높이고 인프라 도구를 재사용하고자 합니다.
  </docs-card>
  <docs-card title="Angular 언어 서비스를 Ivy로 전환" link="2021년 2분기에 완료됨" href="tools/language-service">
  이 프로젝트의 목표는 경험을 개선하고 언어 서비스를 Ivy로 전환하여 구식 의존성을 제거하는 것입니다. 현재 언어 서비스는 여전히 Ivy 앱조차도 View Engine 컴파일러 및 타입 검사를 사용합니다. Angular 언어 서비스에 Ivy 템플릿 파서를 사용하고 앱 동작과 일치하도록 향상된 타입 검사를 사용하고 싶습니다. 이 마이그레이션은 View Engine 제거를 위한 길을 여는 한 단계이기도 하며, 이는 Angular를 단순화하고 npm 패키지 크기를 줄이며 프레임워크의 유지 관리성을 개선할 것입니다.
  </docs-card>
  <docs-card title="Angular에서 네이티브 Trusted Types로 보안 강화" link="2021년 2분기에 완료됨" href="best-practices/security">
  Google 보안 팀과 협력하여 새로운 Trusted Types API를 지원합니다. 이 웹 플랫폼 API는 개발자가 더 안전한 웹 애플리케이션을 구축하는 데 도움을 줍니다.
  </docs-card>
  <docs-card title="Angular CLI webpack 5로 빌드 속도 및 번들 크기 최적화" link="2021년 2분기에 완료됨" href="tools/cli/build">
  v11 릴리스의 일환으로 Angular CLI에서 webpack 5의 선택적 미리보기를 도입했습니다. 안정성을 보장하기 위해 빌드 속도 및 번들 크기 향상을 위한 구현을 계속 반복할 것입니다.
  </docs-card>
  <docs-card title="Universal 앱에서 중요한 스타일을 인라인하여 더 빠른 앱 제공" link="2021년 1분기에 완료됨" href="guide/ssr">
  외부 스타일시트 로드는 차단 작업으로, 이는 브라우저가 참조된 CSS를 모두 로드할 때까지 애플리케이션 렌더링을 시작할 수 없음을 의미합니다. 페이지 헤더에 렌더 차단 리소스가 있으면 로드 성능, 예를 들어 최초 콘텐츠 페인트에 크게 영향을 미칠 수 있습니다. 앱을 더 빠르게 만드는 방법으로, 우리는 Google Chrome 팀과 협력하여 중요한 CSS를 인라인으로 삽입하고 나머지 스타일을 비동기적으로 로드하고 있습니다.
  </docs-card>
  <docs-card title="향상된 Angular 오류 메시지로 디버깅 개선" link="2021년 1분기에 완료됨" href="reference/errors">
  오류 메시지는 종종 개발자가 문제를 해결하는 데 도움이 되는 제한된 실행 정보를 제공합니다. 우리는 오류 메시지를 더 쉽게 발견할 수 있도록 관련 코드를 추가하고 가이드 및 기타 자료를 개발하여 더 매끄러운 디버깅 경험을 보장하기 위해 노력해왔습니다.
  </docs-card>
  <docs-card title="새로운 소개 문서로 개선된 개발자 온보딩" link="2021년 1분기에 완료됨" href="tutorials">
  우리는 사용자 학습 여정을 재정의하고 소개 문서를 새롭게 할 것입니다. Angular의 이점, 기능을 탐색하는 방법을 명확히 하고, 개발자가 최대한 빨리 프레임워크에 능숙해질 수 있도록 가이드를 제공합니다.
  </docs-card>
  <docs-card title="구성 요소 하네스의 모범 사례 확장" link="2021년 1분기에 완료됨" href="https://material.angular.io/guide/using-component-harnesses">
  Angular CDK는 버전 9에서 Angular에 구성 요소 테스트 하네스 개념을 도입했습니다. 테스트 하네스는 구성 요소 작성자가 구성 요소 상호 작용을 테스트하기 위한 지원 API를 생성할 수 있게 합니다. 우리는 이 하네스 인프라를 지속적으로 개선하고 있으며, 하네스를 사용하는 것에 대한 모범 사례를 명확히 하기 위해 작업하고 있습니다. 또한 Google 내에서 더 많은 하네스 채택을 촉진하기 위해 작업하고 있습니다.
  </docs-card>
  <docs-card title="내용 투사에 대한 가이드 작성" link="2021년 2분기에 완료됨" href="https://angular.io/docs">
  내용 투사는 Angular의 핵심 개념으로, 문서에 적절한 존재감을 가지지 못하고 있습니다. 이 프로젝트의 일환으로, 우리는 내용 투사에 대한 핵심 사용 사례 및 개념을 확인하고 문서화하고자 합니다.
  </docs-card>
  <docs-card title="ESLint로 마이그레이션" link="2020년 4분기에 완료됨" href="tools/cli">
  TSLint의 사용 중단으로 인해 우리는 ESLint로 전환하고 있습니다. 이 과정의 일환으로 현재 권장하는 TSLint 구성을 기존과 일치시키고, 기존 Angular 앱에 대한 마이그레이션 전략을 구현하고, Angular CLI 툴 체인에 새로운 도구를 도입하기 위해 작업하고 있습니다.
  </docs-card>
  <docs-card title="작전 바이 바이 백로그(작전 바이엘로그로도 알려짐)" link="2020년 4분기에 완료됨" href="https://github.com/angular/angular/issues">
  우리는 더 넓은 커뮤니티의 필요를 명확히 이해할 때까지 문제와 PR을 분류하는 데 엔지니어링 능력의 최대 50%를 적극적으로 투자하고 있습니다. 그 후, 우리는 새로운 제출을 신속하게 따라잡기 위해 엔지니어링 능력의 최대 20%를 약속할 것입니다.
  </docs-card>
</docs-card-container>
