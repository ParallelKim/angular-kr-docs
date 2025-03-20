# 흐름 제어 구문으로의 마이그레이션

[흐름 제어 구문](guide/templates/control-flow)은 Angular v17부터 사용할 수 있습니다. 새로운 구문은 템플릿에 내장되어 있으므로 더 이상 `CommonModule`을 임포트할 필요가 없습니다.

이 스키마틱은 애플리케이션의 모든 기존 코드를 새로운 흐름 제어 구문을 사용하도록 마이그레이션합니다.

다음 명령어를 사용하여 스키마틱을 실행하세요:

<docs-code language="shell">

ng generate @angular/core:control-flow

</docs-code>