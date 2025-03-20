# 추가 테스트 환경에 대한 하네스 지원 추가하기

## 시작하기 전에

팁: 이 가이드는 이미 [구성 요소 하네스 개요 가이드](guide/testing/component-harnesses-overview)를 읽었다고 가정합니다. 구성 요소 하네스를 사용하는 데 익숙하지 않은 경우 먼저 이를 읽어보세요.

### 테스트 환경에 대한 지원을 추가하는 것이 언제 의미가 있나요?

다음 환경에서 구성 요소 하네스를 사용하려면 Angular CDK의 두 가지 내장 환경을 사용할 수 있습니다:
- 단위 테스트
- WebDriver 종단 간 테스트

지원되는 테스트 환경을 사용하려면 [소프트웨어 구성 요소 하네스 생성 가이드](guide/testing/creating-component-harnesses)를 읽어보세요.

그렇지 않으면 다른 환경에 대한 지원을 추가하려면 DOM 요소와 상호작용하는 방법과 환경 내에서 DOM 상호작용이 작동하는 방법을 정의해야 합니다. 계속 읽어보아 알아보세요.

### CDK 설치

[구성 요소 개발 키트 (CDK)](https://material.angular.io/cdk/categories)는 구성 요소를 구축하기 위한 동작 원시 집합입니다. 구성 요소 하네스를 사용하려면 먼저 npm에서 `@angular/cdk`를 설치해야 합니다. Angular CLI를 사용하여 터미널에서 이 작업을 수행할 수 있습니다:

<docs-code language="shell">
  ng add @angular/cdk
</docs-code>

## `TestElement` 구현 만들기

모든 테스트 환경은 `TestElement` 구현을 정의해야 합니다. `TestElement` 인터페이스는 DOM 요소의 환경 비종속적 표현으로 사용됩니다. 이는 하네스가 기본 환경에 관계없이 DOM 요소와 상호작용할 수 있도록 합니다. 일부 환경은 동기적으로 DOM 요소와 상호작용하는 것을 지원하지 않기 때문에 (예: WebDriver), 모든 `TestElement` 메서드는 비동기적이며 작업의 결과를 가진 `Promise`를 반환합니다.

`TestElement`는 `blur()`, `click()`, `getAttribute()` 등과 같은 기본 DOM과 상호작용할 수 있는 여러 메서드를 제공합니다. 전체 메서드 목록은 [TestElement API 참조 페이지](https://material.angular.io/cdk/testing/api#TestElement)를 참조하세요.

`TestElement` 인터페이스는 주로 `HTMLElement`에서 사용할 수 있는 메서드와 유사한 메서드로 구성됩니다. 대부분의 테스트 환경에 유사한 메서드가 존재하므로 메서드를 구현하는 것은 비교적 간단합니다. 그러나 `sendKeys` 메서드를 구현할 때 주목해야 할 하나의 중요한 차이점은 `TestKey` 열거형의 키 코드가 해당 테스트 환경에서 사용되는 키 코드와 다를 수 있다는 것입니다. 환경 작성자는 `TestKey` 코드와 특정 테스트 환경에서 사용되는 코드 간의 매핑을 유지해야 합니다.

Angular CDK의 [UnitTestElement](https://github.com/angular/components/blob/main/src/cdk/testing/testbed/unit-test-element.ts#L33) 및 [SeleniumWebDriverElement](https://github.com/angular/components/blob/main/src/cdk/testing/selenium-webdriver/selenium-webdriver-keys.ts#L16) 구현은 이 인터페이스의 좋은 구현 예시입니다.

## `HarnessEnvironment` 구현 만들기
테스트 작성자는 `HarnessEnvironment`를 사용하여 테스트에서 사용할 구성 요소 하네스 인스턴스를 생성합니다. `HarnessEnvironment`는 새로운 환경에 대한 구체적인 하위 클래스를 만들기 위해 확장해야 하는 추상 클래스입니다. 새로운 테스트 환경을 지원할 때 모든 추상 멤버에 대한 구체적인 구현을 추가하는 `HarnessEnvironment` 하위 클래스를 만듭니다.

`HarnessEnvironment`는 제네릭 유형 매개변수: `HarnessEnvironment<E>`를 가지고 있습니다. 이 매개변수 `E`는 환경의 원시 요소 유형을 나타냅니다. 예를 들어, 이 매개변수는 단위 테스트 환경에는 Element입니다.

다음은 구현해야 할 추상 메서드입니다:

| 메서드                                                        | 설명               |
|:---                                                           | :---               |
| `abstract getDocumentRoot(): E`                               | 환경의 루트 요소를 가져옵니다 (예: `document.body`). |
| `abstract createTestElement(element: E): TestElement`         | 주어진 원시 요소에 대한 `TestElement`를 생성합니다. |
| `abstract createEnvironment(element: E): HarnessEnvironment`  | 주어진 원시 요소를 기반으로 한 `HarnessEnvironment`를 생성합니다. |
| `abstract getAllRawElements(selector: string): Promise<E[]>`  | 주어진 선택자와 일치하는 환경의 루트 요소 아래의 모든 원시 요소를 가져옵니다. |
| `abstract forceStabilize(): Promise<void>`                    | `NgZone`이 안정적일 때 해결되는 `Promise`를 가져옵니다. 또한, 해당되는 경우 `NgZone`에 안정화하도록 지시합니다 (예: `fakeAsync` 테스트에서 `flush()`를 호출). |
| `abstract waitForTasksOutsideAngular(): Promise<void>`        | `NgZone`의 상위 영역이 안정적일 때 해결되는 `Promise`를 가져옵니다. |

누락된 메서드를 구현하는 것 외에도 이 클래스는 테스트 작성자가 `ComponentHarness` 인스턴스를 얻을 수 있는 방법을 제공해야 합니다. 보호된 생성자를 정의하고 `HarnessLoader` 인스턴스를 반환하는 `loader`라는 정적 메서드를 제공해야 합니다. 이를 통해 테스트 작성자는 `SomeHarnessEnvironment.loader().getHarness(...)`와 같은 코드를 작성할 수 있습니다. 특정 환경의 필요에 따라 클래스는 여러 다른 정적 메서드를 제공하거나 인수를 요구할 수 있습니다. (예: `TestbedHarnessEnvironment`의 `loader` 메서드는 `ComponentFixture`를 받고, 클래스는 `documentRootLoader` 및 `harnessForFixture`라는 추가 정적 메서드를 제공합니다).

Angular CDK의 [`TestbedHarnessEnvironment`](https://github.com/angular/components/blob/main/src/cdk/testing/testbed/testbed-harness-environment.ts#L89) 및 [SeleniumWebDriverHarnessEnvironment](https://github.com/angular/components/blob/main/src/cdk/testing/selenium-webdriver/selenium-web-driver-harness-environment.ts#L71) 구현은 이 인터페이스의 좋은 구현 예시입니다.

## 자동 변경 감지 처리
`manualChangeDetection` 및 병렬 API를 지원하기 위해 환경은 자동 변경 감지 상태에 대한 핸들러를 설치해야 합니다.

환경이 자동 변경 감지 상태를 처리하기 시작하고 싶으면 `handleAutoChangeDetectionStatus(handler)`를 호출할 수 있습니다. 핸들러 함수는 `isDisabled` 및 `onDetectChangesNow()`라는 두 가지 속성이 있는 `AutoChangeDetectionStatus`를 받습니다. 더 많은 정보는 [AutoChangeDetectionStatus API 참조 페이지](https://material.angular.io/cdk/testing/api#AutoChangeDetectionStatus)를 참조하세요.
환경이 자동 변경 감지 상태 처리를 중지하고자 할 경우 `stopHandlingAutoChangeDetectionStatus()`를 호출할 수 있습니다.