# 파이프 테스트

Angular 테스트 유틸리티 없이 [파이프](guide/templates/pipes)를 테스트할 수 있습니다.

## `TitleCasePipe` 테스트

파이프 클래스는 입력 값을 변형된 출력 값으로 변형하는 `transform`이라는 하나의 메서드를 가지고 있습니다.
`transform` 구현은 DOM과 거의 상호작용하지 않습니다.
대부분의 파이프는 `@Pipe` 메타데이터와 인터페이스 외에는 Angular에 의존하지 않습니다.

각 단어의 첫 글자를 대문자로 만드는 `TitleCasePipe`를 고려해 보세요.
정규 표현식을 사용한 구현 예시는 다음과 같습니다.

<docs-code header="app/shared/title-case.pipe.ts" path="adev/src/content/examples/testing/src/app/shared/title-case.pipe.ts"/>

정규 표현식을 사용하는 모든 것은 철저하게 테스트할 가치가 있습니다.
간단한 Jasmine을 사용하여 예상되는 케이스와 엣지 케이스를 탐색하세요.

<docs-code header="app/shared/title-case.pipe.spec.ts" path="adev/src/content/examples/testing/src/app/shared/title-case.pipe.spec.ts" visibleRegion="excerpt"/>

## 파이프 테스트를 지원하는 DOM 테스트 작성하기

이것은 *고립된 상태에서* 파이프 테스트입니다.
애플리케이션 컴포넌트에 적용된 `TitleCasePipe`가 제대로 작동하는지 알 수 없습니다.

다음과 같은 컴포넌트 테스트를 추가하는 것을 고려해 보세요:

<docs-code header="app/hero/hero-detail.component.spec.ts (pipe test)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="title-case-pipe"/>