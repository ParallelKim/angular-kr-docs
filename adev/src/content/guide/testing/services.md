# 테스트 서비스

서비스가 의도한 대로 작동하는지 확인하기 위해, 특정 서비스에 대한 테스트를 작성할 수 있습니다.

서비스는 종종 단위 테스트하기 가장 쉬운 파일입니다.  
다음은 Angular 테스트 유틸리티의 도움 없이 작성된 `ValueService`의 동기 및 비동기 단위 테스트입니다.

<docs-code header="app/demo/demo.spec.ts" path="adev/src/content/examples/testing/src/app/demo/demo.spec.ts" visibleRegion="ValueService"/>

## 의존성이 있는 서비스

서비스는 종종 Angular가 생성자에 주입하는 다른 서비스에 의존합니다.  
많은 경우 서비스의 생성자를 호출할 때 이러한 의존성을 수동으로 *생성하고 주입*할 수 있습니다.

`MasterService`는 간단한 예입니다:

<docs-code header="app/demo/demo.ts" path="adev/src/content/examples/testing/src/app/demo/demo.ts" visibleRegion="MasterService"/>

`MasterService`는 주입된 `ValueService`에 있는 유일한 메서드 `getValue`를 위임합니다.

테스트하는 여러 방법이 있습니다.

<docs-code header="app/demo/demo.spec.ts" path="adev/src/content/examples/testing/src/app/demo/demo.spec.ts" visibleRegion="MasterService"/>

첫 번째 테스트는 `new`를 사용하여 `ValueService`를 생성하고 이를 `MasterService` 생성자에 전달합니다.

그러나 실제 서비스를 주입하면 대부분의 의존 서비스가 생성하고 제어하기 어려운 경우가 많기 때문에 잘 작동하지 않습니다.

대신 의존성을 모의(mock)하거나 더미 값을 사용하거나 관련 서비스 메서드에 대한 [스파이](https://jasmine.github.io/tutorials/your_first_suite#section-Spies)를 생성합니다.

도움말: 서비스 모의(mock)에는 스파이를 사용하는 것이 가장 좋습니다.

이러한 표준 테스트 기술은 서비스를 고립된 상태에서 단위 테스트하기에는 매우 유용합니다.

그러나 거의 항상 Angular 의존성 주입을 사용하여 서비스가 애플리케이션 클래스에 주입되며 이 사용 패턴을 반영하는 테스트가 필요합니다.  
Angular 테스트 유틸리티를 사용하면 주입된 서비스의 동작을 조사하는 것이 간단합니다.

## `TestBed`로 서비스 테스트하기

응용 프로그램은 Angular [의존성 주입(DI)](guide/di)를 사용하여 서비스를 생성합니다.  
서비스가 의존 서비스가 있으면 DI는 해당 의존 서비스를 찾거나 생성합니다.  
그리고 그 의존 서비스가 자체 의존성이 있다면 DI는 그것도 찾거나 생성합니다.

서비스 *소비자*로서 이러한 것에 대해 걱정할 필요는 없습니다.  
생성자 인자의 순서나 생성 방식에 대해 걱정하지 않아도 됩니다.

서비스 *테스터*로서 최소한 서비스 의존성의 첫 번째 수준에 대해 생각해야 하지만, `TestBed` 테스트 유틸리티를 사용할 때 Angular DI가 서비스 생성 및 생성자 인자 순서 문제를 처리하게 할 수 있습니다.

## Angular `TestBed`

`TestBed`는 Angular 테스트 유틸리티 중 가장 중요합니다.  
`TestBed`는 Angular [@NgModule](guide/ngmodules)를 에뮬레이트하는 동적으로 구성된 Angular *테스트* 모듈을 생성합니다.

`TestBed.configureTestingModule()` 메서드는 대부분의 [@NgModule](guide/ngmodules) 속성을 가질 수 있는 메타데이터 객체를 사용합니다.

서비스를 테스트하려면 테스트할(또는 모의할) 서비스의 배열로 `providers` 메타데이터 속성을 설정합니다.

<docs-code header="app/demo/demo.testbed.spec.ts (ValueService를 beforeEach에서 제공)" path="adev/src/content/examples/testing/src/app/demo/demo.testbed.spec.ts" visibleRegion="value-service-before-each"/>

그런 다음 서비스 클래스를 인자로 하여 `TestBed.inject()`를 호출하여 테스트 안에서 주입합니다.

도움말: `TestBed.get()`는 Angular 버전 9부터 사용 중지되었습니다.  
깨지는 변경을 최소화하기 위해 Angular는 대신 사용할 새로운 함수 `TestBed.inject()`를 도입합니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/demo.testbed.spec.ts" visibleRegion="value-service-inject-it"/>

서비스를 설정의 일부로 주입하려는 경우 `beforeEach()` 내부에서 할 수 있습니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/demo.testbed.spec.ts" visibleRegion="value-service-inject-before-each"> </docs-code>

의존성이 있는 서비스를 테스트할 때는 `providers` 배열에 모의(Mock) 서비스를 제공하세요.

다음 예에서 모의는 스파이 객체입니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/demo.testbed.spec.ts" visibleRegion="master-service-before-each"/>

테스트는 이전과 동일한 방식으로 해당 스파이를 소비합니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/demo.testbed.spec.ts" visibleRegion="master-service-it"/>

## `beforeEach()` 없이 테스트하기

이 가이드의 대부분의 테스트 스위트는 각 `it()` 테스트에 대한 전제 조건을 설정하기 위해 `beforeEach()`를 호출하고 클래스 생성 및 서비스 주입을 위해 `TestBed`에 의존합니다.

`beforeEach()`를 호출하지 않고 클래스를 명시적으로 생성하는 것을 선호하는 또 다른 테스트 방식이 있습니다.

다음은 이러한 스타일로 `MasterService` 테스트 중 하나를 다시 작성하는 방법입니다.

재사용 가능한 준비 코드를 `beforeEach()` 대신 *setup* 함수에 배치합니다.

<docs-code header="app/demo/demo.spec.ts (setup)" path="adev/src/content/examples/testing/src/app/demo/demo.spec.ts" visibleRegion="no-before-each-setup"/>

`setup()` 함수는 테스트가 참조할 수 있는 변수가 포함된 객체 리터럴을 반환합니다.  
`describe()` 본문에서 *반전역(semi-global)* 변수를 정의하지 않습니다 \(예: `let masterService: MasterService`\).

그런 다음 각 테스트는 첫 번째 줄에서 `setup()`을 호출하여 테스트 주제를 조작하고 기대 결과를 단언합니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/demo.spec.ts" visibleRegion="no-before-each-test"/>

테스트가 필요한 설정 변수를 추출하는 데 [*구조 분해 할당*](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)을 사용하는 방법에 유의하세요.

<docs-code path="adev/src/content/examples/testing/src/app/demo/demo.spec.ts" visibleRegion="no-before-each-setup-call"/>

많은 개발자는 이 접근 방식이 전통적인 `beforeEach()` 스타일보다 더 깔끔하고 명확하다고 느낍니다.

이 테스트 가이드는 전통적인 스타일을 따르며 기본 [CLI 스키마틱](https://github.com/angular/angular-cli)은 `beforeEach()` 및 `TestBed`와 함께 테스트 파일을 생성하지만, 자신의 프로젝트에서는 *이 대안 접근 방식*을 자유롭게 채택할 수 있습니다.

## HTTP 서비스 테스트하기

원격 서버에 HTTP 호출을 하는 데이터 서비스는 일반적으로 Angular [`HttpClient`](guide/http/testing) 서비스로 주입하고 위임합니다.

주입된 `HttpClient` 스파이를 사용하여 데이터 서비스를 테스트할 수 있으며, 이는 의존성이 있는 서비스에 대한 테스트와 마찬가지입니다.

<docs-code header="app/model/hero.service.spec.ts (스파이로 테스트)" path="adev/src/content/examples/testing/src/app/model/hero.service.spec.ts" visibleRegion="test-with-spies"/>

중요: `HeroService` 메서드는 `Observables`를 반환합니다.  
함수를 실행시키고 메서드가 성공 또는 실패하는지를 단언하기 위해서는 *구독(subscribe)*해야 합니다.

`subscribe()` 메서드는 성공(`next`)과 실패(`error`) 콜백을 사용합니다.  
두 개의 콜백을 모두 제공하여 오류를 캡처해야 합니다.  
이를 소홀히 하면 비동기적으로 처리되지 않은 observable 오류가 발생할 수 있으며, 테스트 실행기가 이를 완전히 다른 테스트에 귀속시킬 가능성이 높습니다.

## `HttpClientTestingModule`

데이터 서비스와 `HttpClient` 사이의 확장된 상호 작용은 복잡하고 스파이로 모의(mock)하기 어려울 수 있습니다.

`HttpClientTestingModule`은 이러한 테스트 시나리오를 관리하기 쉽게 만들어 줍니다.

이 가이드와 함께 제공되는 *코드 샘플*은 `HttpClientTestingModule`을 보여주지만, 이 페이지는 [Http 가이드](guide/http/testing)로 위임하여 `HttpClientTestingModule`을 사용한 테스트를 상세히 설명합니다.