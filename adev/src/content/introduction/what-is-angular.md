<docs-decorative-header title="Angular은 무엇인가요?" imgSrc="adev/src/assets/images/what_is_angular.svg"> <!-- markdownlint-disable-line -->
</docs-decorative-header>

<big style="margin-top: 2em">
Angular는 개발자가 빠르고 신뢰할 수 있는 애플리케이션을 구축할 수 있도록 지원하는 웹 프레임워크입니다.
</big>

Google의 전담 팀에 의해 유지 관리되는 Angular는 개발 작업 흐름을 간소화하고 효율화하기 위한 다양한 도구, API 및 라이브러리 모음을 제공합니다. Angular는 팀의 규모와 코드베이스의 규모 모두에 맞게 확장되는 빠르고 신뢰할 수 있는 애플리케이션을 구축할 수 있는 견고한 플랫폼을 제공합니다.

**코드를 보고 싶으신가요?** Angular를 사용하는 것이 어떤 느낌인지 빠르게 알아보려면 [기초](essentials)로 이동하거나 단계별 지침을 따르려면 [튜토리얼](tutorials/learn-angular)을 시작하세요.

## 개발을 지원하는 기능

<docs-card-container>
  <docs-card title="의견이 반영된 컴포넌트 모델 및 유연한 의존성 주입 시스템으로 코드베이스를 정리하세요" href="guide/components" link="컴포넌트 시작하기">
  Angular 컴포넌트를 사용하면 코드를 잘 캡슐화된 부분으로 나누기가 쉽습니다.

  다용도 의존성 주입을 통해 코드를 모듈화하고 느슨하게 결합되며 테스트 가능하도록 유지할 수 있습니다.
  </docs-card>
  <docs-card title="신호를 기반으로 한 세밀한 반응형으로 빠른 상태 업데이트를 얻으세요" href="guide/signals" link="Angular 신호 탐색하기">
  우리의 세밀한 반응형 모델과 컴파일 시간 최적화를 결합하여 기본적으로 애플리케이션 개발을 단순화하고 더 빠른 앱을 구축할 수 있도록 합니다.

  애플리케이션 전반에서 상태가 어떻게 사용되고 어디서 사용되는지를 세밀하게 추적하여 프레임워크가 최적화된 지침을 통해 빠른 업데이트를 렌더링할 수 있도록 합니다.
  </docs-card>
  <docs-card title="SSR, SSG, 수화, 차세대 지연 로딩으로 성능 목표 달성" href="guide/ssr" link="SSR에 대해 읽기">
    Angular는 서버 측 렌더링(SSR)과 정적 사이트 생성(SSG) 모두를 지원하며 전체 DOM 수화도 지원합니다. 템플릿의 `@defer` 블록을 사용하면 템플릿을 지연 불러오기 가능한 부분으로 선언적으로 나누기가 간단합니다.
  </docs-card>
  <docs-card title="폼, 라우팅 등과 함께 Angular의 1차 모듈로 모든 것이 함께 작동하도록 보장합니다">
  [Angular의 라우터](guide/routing)는 경로 보호자, 데이터 해상도, 지연 로딩 등을 포함한 기능이 풍부한 내비게이션 도구 키트를 제공합니다.

  [Angular의 폼 모듈](guide/forms)은 폼 참여 및 유효성 검사를 위한 표준화된 시스템을 제공합니다.
  </docs-card>
</docs-card-container>

## 그 어느 때보다 빠르게 애플리케이션 개발

<docs-card-container>
  <docs-card title="Angular CLI로 손쉽게 빌드, 서비스, 테스트, 배포하기" href="tools/cli" link="Angular CLI">
  Angular CLI는 필요한 명령으로 프로젝트를 1분 이내에 실행할 수 있게 해줍니다.
  </docs-card>
  <docs-card title="Angular DevTools 브라우저 확장으로 시각적으로 코드 디버그, 분석, 최적화하기" href="tools/devtools" link="Angular DevTools">
  Angular DevTools는 브라우저의 개발자 도구와 함께 사용됩니다. 이 도구는 구성 요소 트리 검사기, 의존성 주입 트리 보기 및 사용자 정의 성능 프로파일링 플레임 차트를 포함하여 앱을 디버그하고 분석하는 데 도움을 줍니다.
  </docs-card>
  <docs-card title="ng update로 버전을 놓치지 마세요" href="cli/update" link="ng update">
  Angular CLI의 `ng update`는 루틴의 주요 버전 업데이트를 자동으로 처리하는 자동화된 코드 변환을 실행합니다. 최신 버전을 유지하면 애플리케이션이 가능한 한 빠르고 안전하게 유지됩니다.
  </docs-card>
  <docs-card title="최고의 편집기에서 IDE 통합으로 생산성을 유지하세요" href="tools/language-service" link="언어 서비스">
  Angular의 IDE 언어 서비스는 최고의 편집기에서 코드 완성, 탐색, 리팩토링 및 실시간 진단을 지원합니다.
  </docs-card>
</docs-card-container>

## 자신 있게 배포하세요

<docs-card-container>
  <docs-card title="Google의 거대한 모노리포에 대한 커밋별 검증" href="https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext" link="Google의 모노리포에 대해 알아보기">
  모든 Angular 커밋은 Google의 내부 코드 리포지토리에 있는 _수십만 개_의 테스트에 대해 확인되며, 이는 수많은 실제 시나리오를 나타냅니다.

  Angular는 Google Cloud를 포함한 Google의 가장 큰 제품들에 대해 안정성을 확보하는 데 전념하고 있습니다. 이들 변경사항은 잘 테스트되고 이전 버전과 호환되며 가능한 경우 마이그레이션 도구를 포함하도록 보장합니다.
  </docs-card>
  <docs-card title="명확한 지원 정책 및 예측 가능한 릴리스 일정" href="reference/releases" link="버전 관리 및 릴리스">
  Angular의 예측 가능한 시간 기반 릴리스 일정은 프레임워크의 안정성과 이전 버전과 호환성에 대한 신뢰를 조직에 제공합니다. 장기 지원(LTS) 윈도우를 통해 필요할 때 중요한 보안 수정을 받을 수 있습니다. 1차 업데이트 도구, 가이드 및 자동화된 마이그레이션 도면은 애플리케이션이 최신의 프레임워크 및 웹 플랫폼 발전에 맞춰 최신 상태를 유지하는 데 도움을 줍니다.
  </docs-card>
</docs-card-container>

## 모든 규모에서 작동

<docs-card-container>
  <docs-card title="국제화 지원으로 사용자에게 도달하세요" href="guide/i18n" link="국제화">
  Angular의 국제화 기능은 메시지 번역 및 형식을 처리하며, 유니코드 표준 ICU 구문을 지원합니다.
  </docs-card>
  <docs-card title="기본적으로 보안으로 사용자를 보호하세요" href="best-practices/security" link="보안">
  Google의 세계적 수준의 보안 엔지니어와 협력하여 Angular는 기본적으로 안전한 개발을 목표로 하고 있습니다. HTML 정화 및 신뢰할 수 있는 유형 지원을 포함한 내장 보안 기능은 교차 사이트 스크립팅 및 교차 사이트 요청 위조와 같은 일반적인 취약성으로부터 사용자를 보호하는 데 도움을 줍니다.
  </docs-card>
  <docs-card title="Vite와 esbuild로 대규모 팀의 생산성을 유지하세요" href="tools/cli/build-system-migration" link="ESBuild 및 Vite">
  Angular CLI에는 Vite 및 ESBuild를 사용한 빠르고 현대적인 빌드 파이프라인이 포함되어 있습니다. 개발자는 수십만 줄의 코드로 프로젝트를 1분 이내에 빌드할 수 있다고 보고하고 있습니다.
  </docs-card>
  <docs-card title="Google의 주요 웹 앱에서 입증된 성능">
  대규모 Google 제품은 Angular 아키텍처 위에 구축되며 Angular의 확장성을 더욱 향상시키기 위한 새로운 기능 개발에 도움을 줍니다. [Google Fonts](https://fonts.google.com/)에서 [Google Cloud](https://console.cloud.google.com)까지 다양합니다.
  </docs-card>
</docs-card-container>

## 오픈 소스 우선

<docs-card-container>
  <docs-card title="GitHub에서 공개하여 제작됨" href="https://github.com/angular/angular" link="GitHub 별표 달기">
  우리가 작업하고 있는 내용이 궁금하신가요? 모든 PR 및 커밋은 우리의 GitHub에서 확인할 수 있습니다. 문제가 발생했거나 버그가 발생했나요? 우리는 정기적으로 GitHub 문제를 분류하여 우리 커뮤니티와의 상호작용을 보장하고 여러분이 직면하는 실제 문제를 해결하고 있습니다.
  </docs-card>
  <docs-card title="투명성 있게 구축됨" href="roadmap" link="공식 로드맵 읽기">
  우리 팀은 현재와 미래의 작업에 대한 공개 로드맵을 게시하고 있으며 귀하의 피드백을 소중히 여깁니다. 우리는 더 큰 기능 변경에 대한 피드백을 수집하기 위해 댓글 요청(RFC)을 게시하여 커뮤니티의 목소리가 Angular의 미래 방향을 형성하는 데 반영되도록 합니다.
  </docs-card>
</docs-card-container>

## 번창하는 커뮤니티

<docs-card-container>
  <docs-card title="강좌, 블로그 및 리소스" href="https://devlibrary.withgoogle.com/products/angular?sort=added" link="DevLibrary 확인하기">
  우리 커뮤니티는 재능 있는 개발자, 작가, 강사, 팟캐스터 등으로 구성되어 있습니다. Google for Developers 라이브러리는 새로운 개발자와 경험이 풍부한 개발자가 계속해서 발전할 수 있도록 제공되는 고품질 리소스의 샘플에 불과합니다.
  </docs-card>
  <docs-card title="오픈 소스" href="https://github.com/angular/angular/blob/main/CONTRIBUTING.md" link="Angular에 기여하기">
  우리는 Angular를 모든 사람이 더 나은 프레임워크가 되도록 돕는 오픈 소스 기여자에게 감사드립니다. 문서에서 오타를 수정하는 것부터 주요 기능을 추가하는 것까지, 우리 GitHub에서 시작하시기를 권장합니다.
  </docs-card>
  <docs-card title="커뮤니티 파트너십" href="https://developers.google.com/community/experts/directory?specialization=angular" link="Angular GDE를 만나다">
  우리 팀은 지속적으로 개발자를 지원하기 위해 개인, 교육자 및 기업과 협력합니다. Angular Google Developer Experts(GDE)는 전 세계의 커뮤니티 리더를 대표하여 Angular와 함께 교육, 조직 및 개발하고 있습니다. 기업 파트너십은 Angular가 기술 산업 리더에게 원활하게 확장될 수 있도록 보장합니다.
  </docs-card>
  <docs-card title="다른 Google 기술과의 파트너십">
  Angular는 웹 개선을 위해 다른 Google 기술 및 팀과 밀접하게 협력하고 있습니다.

  Chrome의 Aurora와의 지속적인 파트너십은 웹 전반에 걸쳐 사용자 경험 개선을 탐색하고 NgOptimizedImage 및 Angular의 Core Web Vitals와 같은 내장 성능 최적화를 개발하고 있습니다.

  우리는 또한 [Firebase](https://firebase.google.com/), [Tensorflow](https://www.tensorflow.org/), [Flutter](https://flutter.dev/), [Material Design](https://m3.material.io/) 및 [Google Cloud](https://cloud.google.com/)와 협력하여 개발자 작업 흐름 전반에 걸쳐 의미 있는 통합을 제공하고 있습니다.
  </docs-card>
</docs-card-container>

<docs-callout title="운동에 참여하세요!">
  <docs-pill-row>
    <docs-pill href="roadmap" title="Angular의 로드맵 읽기"/>
    <docs-pill href="playground" title="우리의 놀이터 사용해 보기"/>
    <docs-pill href="tutorials" title="튜토리얼로 배우기"/>
    <docs-pill href="https://youtube.com/playlist?list=PL1w1q3fL4pmj9k1FrJ3Pe91EPub2_h4jF" title="YouTube 강좌 보기"/>
    <docs-pill href="api" title="API 참조하기"/>
  </docs-pill-row>
</docs-callout>