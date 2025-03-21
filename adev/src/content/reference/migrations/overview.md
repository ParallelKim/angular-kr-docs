# Migrations

기존 Angular 프로젝트를 최신 기능으로 점진적으로 마이그레이션하는 방법에 대해 알아보세요.

<docs-card-container>
  <docs-card title="Standalone" link="Migrate now" href="reference/migrations/standalone">
    독립형 컴포넌트는 Angular 애플리케이션을 구축하는 단순화된 방법을 제공합니다. 독립형 컴포넌트는 NgModules를 통해 가져오는 대신 자신의 종속성을 직접 지정합니다.
  </docs-card>
  <docs-card title="Control Flow Syntax" link="Migrate now" href="reference/migrations/control-flow">
    내장된 제어 흐름 구문은 더 인체공학적인 문법을 사용할 수 있게 하며, 이는 JavaScript와 가깝고 더 나은 타입 검사를 제공합니다. 이는 `*ngFor`, `*ngIf` 및 `*ngSwitch`와 같은 기능을 사용하기 위해 `CommonModule`을 가져올 필요를 대체합니다.
  </docs-card>
  <docs-card title="inject() Function" link="Migrate now" href="reference/migrations/inject-function">
    Angular의 `inject` 함수는 생성자 기반 주입에 비해 더 정확한 타입과 표준 데코레이터와의 더 나은 호환성을 제공합니다.
  </docs-card>
  <docs-card title="Lazy-loaded routes" link="Migrate now" href="reference/migrations/route-lazy-loading">
    즉시 로드되는 컴포넌트 경로를 지연 로드되는 경로로 변환합니다. 이를 통해 빌드 프로세스는 프로덕션 번들을 더 작은 청크로 나눠 초기 페이지 로드 시 더 적은 JavaScript를 로드할 수 있습니다.
  </docs-card>
  <docs-card title="New `input()` API" link="Migrate now" href="reference/migrations/signal-inputs">
    기존 `@Input` 필드를 이제 프로덕션 준비가 된 새로운 신호 입력 API로 변환합니다.
  </docs-card>
  <docs-card title="New `output()` function" link="Migrate now" href="reference/migrations/outputs">
    기존 `@Output` 사용자 정의 이벤트를 이제 프로덕션 준비가 된 새로운 출력 함수로 변환합니다.
  </docs-card>
  <docs-card title="Queries as signal" link="Migrate now" href="reference/migrations/signal-queries">
    기존 데코레이터 쿼리 필드를 개선된 신호 쿼리 API로 변환합니다. 이 API는 이제 프로덕션 준비가 되어 있습니다.
  </docs-card>
  <docs-card title="Cleanup unused imports" link="Try it now" href="reference/migrations/cleanup-unused-imports">
    프로젝트에서 사용하지 않는 가져오기를 정리합니다.
  </docs-card>
  <docs-card title="Self-closing tags" link="Migrate now" href="reference/migrations/self-closing-tags">
    가능한 경우 컴포넌트 템플릿을 사용하여 자기 닫는 태그로 변환합니다.
  </docs-card>
</docs-card-container>