# 테스트에서 컴포넌트 하네스를 사용하는 방법

## 시작하기 전에

팁: 이 가이드는 당신이 이미 [컴포넌트 하네스 개요 가이드](guide/testing/component-harnesses-overview)를 읽었다고 가정합니다. 컴포넌트 하네스를 처음 사용하는 경우, 먼저 그 내용을 읽어보세요.

### CDK 설치

[Component Dev Kit (CDK)](https://material.angular.io/cdk/categories)는 컴포넌트를 구축하기 위한 동작 기본 요소 집합입니다. 컴포넌트 하네스를 사용하려면 먼저 npm에서 `@angular/cdk`를 설치하십시오. Angular CLI를 사용하여 터미널에서 이렇게 할 수 있습니다:

<docs-code language="shell">
  ng add @angular/cdk
</docs-code>

## 테스트 하네스 환경과 로더

다양한 테스트 환경에서 컴포넌트 테스트 하네스를 사용할 수 있습니다. Angular CDK는 두 가지 기본 제공 환경을 지원합니다:

- Angular의 `TestBed`를 이용한 단위 테스트
- [WebDriver](https://developer.mozilla.org/en-US/docs/Web/WebDriver)를 이용한 종단 간 테스트

각 환경은 <strong>하네스 로더</strong>를 제공합니다. 로더는 테스트 전반에 걸쳐 사용하는 하네스 인스턴스를 생성합니다. 지원되는 테스트 환경에 대한 보다 구체적인 안내는 아래를 참조하세요.

추가 테스트 환경은 사용자 정의 바인딩이 필요합니다. 추가 테스트 환경에 대한 하네스 지원 추가 가이드를 참조하여 더 많은 정보를 확인하세요.

### 단위 테스트를 위한 `TestbedHarnessEnvironment`에서 로더 사용하기

단위 테스트의 경우, [TestbedHarnessEnvironment](https://material.angular.io/cdk/testing/api#TestbedHarnessEnvironment)로부터 하네스 로더를 생성할 수 있습니다. 이 환경은 Angular의 `TestBed`로 생성된 [컴포넌트 픽스쳐](api/core/testing/ComponentFixture)를 사용합니다.

픽스쳐의 루트 요소에 뿌리내린 하네스 로더를 생성하려면 `loader()` 메서드를 사용하십시오:

<docs-code language="typescript">
const fixture = TestBed.createComponent(MyComponent);

// 픽스쳐에서 하네스 로더를 생성합니다.
const loader = TestbedHarnessEnvironment.loader(fixture);
...

// 로더를 사용하여 하네스 인스턴스를 가져옵니다.
const myComponentHarness = await loader.getHarness(MyComponent);
</docs-code>

픽스쳐 바깥에 위치한 요소의 하네스를 위한 하네스 로더를 생성하려면, `documentRootLoader()` 메서드를 사용하십시오. 예를 들어, 플로팅 요소나 팝업을 표시하는 코드는 자주 DOM 요소를 직접 문서 본문에 첨부하는데, Angular CDK의 `Overlay` 서비스와 같은 경우가 이에 해당합니다.

픽스쳐의 루트 요소에 대해 하네스를 직접 가져와 `harnessForFixture()`로 하네스 로더를 생성할 수도 있습니다.

### 종단 간 테스트를 위한 `SeleniumWebDriverHarnessEnvironment`에서 로더 사용하기

WebDriver 기반 종단 간 테스트의 경우, `SeleniumWebDriverHarnessEnvironment`로 하네스 로더를 생성할 수 있습니다.

`loader()` 메서드를 사용하여 현재 HTML 문서에 대한 하네스 로더 인스턴스를 가져오며, 문서의 루트 요소에 뿌리내립니다. 이 환경은 WebDriver 클라이언트를 사용합니다.

<docs-code language="typescript">
let wd: webdriver.WebDriver = getMyWebDriverClient();
const loader = SeleniumWebDriverHarnessEnvironment.loader(wd);
...
const myComponentHarness = await loader.getHarness(MyComponent);
</docs-code>

## 하네스 로더 사용하기

하네스 로더 인스턴스는 특정 DOM 요소와 대응하며, 해당 특정 요소 아래의 컴포넌트 하네스 인스턴스를 생성하는 데 사용됩니다.

요소의 첫 번째 인스턴스를 위한 `ComponentHarness`를 가져오려면 `getHarness()` 메서드를 사용하십시오. 모든 `ComponentHarness` 인스턴스를 가져오려면 `getAllHarnesses()` 메서드를 사용하십시오.

<docs-code language="typescript">
// 요소의 첫 번째 인스턴스에 대한 하네스를 가져옵니다.
const myComponentHarness = await loader.getHarness(MyComponent);

// 요소의 모든 인스턴스에 대한 하네스를 가져옵니다.
const myComponentHarnesses = await loader.getHarnesses(MyComponent);
</docs-code>

예를 들어, 클릭 시 다이얼로그를 여는 재사용 가능한 대화 상자 버튼 컴포넌트를 고려해 보십시오. 이 컴포넌트는 다음과 같은 구성 요소를 포함하며, 각각에 해당하는 하네스가 있습니다:

- `MyDialogButton` (편리한 API로 `MyButton`과 `MyDialog`를 조합합니다)
- `MyButton` (표준 버튼 컴포넌트)
- `MyDialog` (클릭 시 `MyDialogButton`에 의해 `document.body`에 추가되는 다이얼로그)

다음 테스트는 이러한 각 컴포넌트의 하네스를 로드합니다:

<docs-code language="typescript">
let fixture: ComponentFixture<MyDialogButton>;
let loader: HarnessLoader;
let rootLoader: HarnessLoader;

beforeEach(() => {
  fixture = TestBed.createComponent(MyDialogButton);
  loader = TestbedHarnessEnvironment.loader(fixture);
  rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
});

it('loads harnesses', async () => {
  // `harnessForFixture`로 부트스트랩된 컴포넌트를 위한 하네스를 로드합니다.
  dialogButtonHarness =
      await TestbedHarnessEnvironment.harnessForFixture(fixture, MyDialogButtonHarness);
  // 버튼 요소는 픽스쳐 루트 요소 내부에 있으므로 `loader`를 사용합니다.
  const buttonHarness = await loader.getHarness(MyButtonHarness);
  // 다이얼로그를 열기 위해 버튼을 클릭합니다.
  await buttonHarness.click();
  // 다이얼로그는 `document.body`에 추가되며, 픽스쳐 루트 요소 외부에 있으므로,
  // 이 경우 `rootLoader`를 사용합니다.
  const dialogHarness = await rootLoader.getHarness(MyDialogHarness);
  // ... 몇 가지 단언을 수행합니다.
});
</docs-code>

### 다양한 환경에서의 하네스 동작

하네스는 모든 환경에서 동일하게 동작하지 않을 수 있습니다. 일부 차이는 실제 사용자 상호작용과 단위 테스트에서 생성된 시뮬레이션 이벤트 간의 불가피한 차이입니다. Angular CDK는 가능한 한 동작을 정규화하려고 최선을 다합니다.

### 자식 요소와 상호작용하기

이 하네스 로더의 루트 요소 아래에 있는 요소와 상호작용하려면 자식 요소의 `HarnessLoader` 인스턴스를 사용하십시오. 자식 요소의 첫 번째 인스턴스에 대해서는 `getChildLoader()` 메서드를 사용하십시오. 자식 요소의 모든 인스턴스에 대해서는 `getAllChildLoaders()` 메서드를 사용하십시오.

<docs-code language="typescript">
const myComponentHarness = await loader.getHarness(MyComponent);

// '.child' 선택자로 자식 요소의 첫 번째 인스턴스에 대한 로더를 가져옵니다.
const childLoader = await myComponentHarness.getLoader('.child');

// '.child' 선택자로 자식 요소의 모든 인스턴스에 대한 로더를 가져옵니다.
const allChildLoaders = await myComponentHarness.getAllChildLoaders('.child');
</docs-code>

### 하네스 필터링

페이지에 특정 컴포넌트의 여러 인스턴스가 포함되어 있을 때, 특정 컴포넌트 인스턴스를 얻기 위해 컴포넌트의 일부 속성에 따라 필터링하고 싶을 수 있습니다. 이를 위해 하네스 프레디케이트를 사용할 수 있으며, 이는 `ComponentHarness` 클래스를 프레디케이트 함수와 연결하는 데 사용됩니다.

`HarnessLoader`에 하네스를 요청할 때, 실제로는 HarnessQuery를 제공하는 것입니다. 쿼리는 두 가지 중 하나일 수 있습니다:

- 하네스 생성자입니다. 이것은 해당 하네스를 얻습니다.
- `HarnessPredicate`로, 하나 이상의 조건에 따라 필터링된 하네스를 얻습니다.

`HarnessPredicate`는 `ComponentHarness`를 확장하는 모든 항목에서 작동하는 일부 기본 필터(선택자, 조상)를 지원합니다.

<docs-code language="typescript">
// 하네스 프레디케이트를 사용하여 MyButtonComponentHarness를 로드하는 예제
const disabledButtonPredicate = new HarnessPredicate(MyButtonComponentHarness, {selector: '[disabled]'});
const disabledButton = await loader.getHarness(disabledButtonPredicate);
</docs-code>

그러나 하네스는 일반적으로 컴포넌트 특정 필터링 옵션을 수용하는 정적 `with()` 메서드를 구현하여 `HarnessPredicate`를 반환하는 것이 일반적입니다.

<docs-code language="typescript">
// 특정 선택자를 사용하여 MyButtonComponentHarness를 로드하는 예제
const button = await loader.getHarness(MyButtonComponentHarness.with({selector: 'btn'}))
</docs-code>

더 많은 세부정보는 각 하네스 구현에 특정한 추가 필터링 옵션이 있으므로 특정 하네스 문서를 참조하십시오.

## 테스트 하네스 API 사용하기

모든 하네스는 해당하는 컴포넌트에 특정한 API를 정의하지만, 모두 공통 기본 클래스를 공유합니다, [ComponentHarness](https://material.angular.io/cdk/testing/api#ComponentHarness). 이 기본 클래스는 하네스 클래스와 DOM에서의 컴포넌트 인스턴스를 일치시키는 정적 속성인 `hostSelector`를 정의합니다.

그 이상으로, 특정 하네스의 API는 해당하는 컴포넌트에 특정합니다; 특정 하네스를 사용하는 방법을 알기 위해 컴포넌트의 문서를 참조하세요.

예를 들어, 다음은 [Angular Material 슬라이더 컴포넌트 하네스](https://material.angular.io/components/slider/api#MatSliderHarness)를 사용하는 컴포넌트에 대한 테스트입니다:

<docs-code language="typescript">
it('should get value of slider thumb', async () => {
    const slider = await loader.getHarness(MatSliderHarness);
    const thumb = await slider.getEndThumb();
    expect(await thumb.getValue()).toBe(50);
});
</docs-code>

## Angular 변경 감지와의 상호 운용성

기본적으로, 테스트 하네스는 DOM 요소의 상태를 읽기 전에 Angular의 [변경 감지](https://angular-kr-docs.web.app/best-practices/runtime-performance)를 실행하고, DOM 요소와 상호작용한 후에 실행합니다.

테스트에서 변경 감지에 대해 더 세밀한 제어가 필요할 때가 있습니다. 예를 들어, 비동기 작업이 대기 중일 때 컴포넌트의 상태를 확인하는 경우입니다. 이러한 경우, 코드 블록에 대한 변경 감지의 자동 처리를 비활성화하기 위해 `manualChangeDetection` 함수를 사용하십시오.

<docs-code language="typescript">
it('checks state while async action is in progress', async () => {
  const buttonHarness = loader.getHarness(MyButtonHarness);
  await manualChangeDetection(async () => {
    await buttonHarness.click();
    fixture.detectChanges();
    // 비동기 클릭 작업이 진행 중일 때 기대값을 확인합니다.
    expect(isProgressSpinnerVisible()).toBe(true);
    await fixture.whenStable();
    // 비동기 클릭 작업이 완료된 후 기대값을 확인합니다.
    expect(isProgressSpinnerVisible()).toBe(false);
  });
});
</docs-code>

거의 모든 하네스 메서드는 비동기이며 다음을 지원하기 위해 `Promise`를 반환합니다:

- 단위 테스트 지원
- 종단 간 테스트 지원
- 비동기 동작의 변경에 대한 테스트 보호

Angular 팀은 테스트 가독성을 향상시키기 위해 [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) 사용을 권장합니다. `await`를 호출하면 연결된 `Promise`가 해결될 때까지 테스트 실행이 차단됩니다.

가끔, 여러 작업을 동시에 수행하고 각 작업을 순차적으로 수행하는 대신 모두 완료될 때까지 기다리길 원할 수 있습니다. 예를 들어, 단일 컴포넌트의 여러 속성을 읽는 경우입니다. 이러한 상황에서는 `parallel` 함수를 사용하여 작업을 병렬화하십시오. 병렬 함수는 `Promise.all`과 유사하게 작동하면서도 변경 감지 확인을 최적화합니다.

<docs-code language="typescript">
it('reads properties in parallel', async () => {
  const checkboxHarness = loader.getHarness(MyCheckboxHarness);
  // 체크된 속성과 중간 속성을 동시에 읽습니다.
  const [checked, indeterminate] = await parallel(() => [
    checkboxHarness.isChecked(),
    checkboxHarness.isIndeterminate()
  ]);
  expect(checked).toBe(false);
  expect(indeterminate).toBe(true);
});
</docs-code>
