# 컴포넌트 하네스 개요

<strong>컴포넌트 하네스</strong>는 테스트가 엔드 유저가 지원하는 API를 통해 컴포넌트와 상호작용할 수 있도록 하는 클래스입니다. 작은 재사용 가능한 위젯에서 전체 페이지에 이르기까지 모든 컴포넌트에 대해 테스트 하네스를 생성할 수 있습니다.

하네스는 여러 가지 이점을 제공합니다:
- 컴포넌트의 DOM 구조와 같은 구현 세부 사항으로부터 격리되어 테스트를 덜 무르기하게 만듭니다.
- 테스트가 더 읽기 쉽고 유지보수가 용이해집니다.
- 여러 테스트 환경에서 사용될 수 있습니다.

<docs-code language="typescript">
// MyButtonComponent용 하네스가 있는 테스트 예제
it('should load button with exact text', async () => {
  const button = await loader.getHarness(MyButtonComponentHarness);
  expect(await button.getText()).toBe('Confirm');
});
</docs-code>

컴포넌트 하네스는 공유 UI 위젯에 특히 유용합니다. 개발자는 종종 위젯의 DOM 구조 및 CSS 클래스와 같은 비공식적인 구현 세부 사항에 의존하는 테스트를 작성합니다. 이러한 의존성은 테스트를 무르기하고 유지보수를 어렵게 만듭니다. 하네스는 엔드 유저가 하는 것과 동일한 방식으로 위젯과 상호작용하는 지원되는 API를 제공합니다. 이제 위젯 구현 변경이 사용자 테스트를 깨뜨릴 가능성이 줄어듭니다. 예를 들어, [Angular Material](https://material.angular.io/components/categories)은 라이브러리의 각 컴포넌트에 대한 테스트 하네스를 제공합니다.

컴포넌트 하네스는 여러 테스트 환경을 지원합니다. 단위 테스트와 엔드 투 엔드 테스트 모두에서 동일한 하네스 구현을 사용할 수 있습니다. 테스트 저자는 하나의 API만 배우면 되고, 컴포넌트 저자는 별도의 단위 및 엔드 투 엔드 테스트 구현을 유지할 필요가 없습니다.

많은 개발자는 다음의 개발자 유형 카테고리 중 하나로 분류할 수 있습니다: 테스트 저자, 컴포넌트 하네스 저자, 그리고 하네스 환경 저자. 아래의 표를 사용하여 이러한 카테고리를 기반으로 이 안내서의 가장 관련성 높은 섹션을 찾으세요:

| 개발자 유형                | 설명                  | 관련 섹션              |
|:---                       | :---                 | :---                  |
| 테스트 저자                | 다른 사람이 작성한 컴포넌트 하네스를 사용하여 애플리케이션을 테스트하는 개발자. 예를 들어, 서드 파티 메뉴 컴포넌트를 사용하는 앱 개발자일 수 있으며, 단위 테스트에서 메뉴와 상호작용할 필요가 있습니다. | [테스트에서 컴포넌트 하네스 사용하기](guide/testing/using-component-harnesses) |
| 컴포넌트 하네스 저자      | 재사용 가능한 Angular 컴포넌트를 유지 관리하고 테스트에 사용자들이 사용할 수 있는 테스트 하네스를 만들고자 하는 개발자. 예를 들어, 서드 파티 Angular 컴포넌트 라이브러리의 저자나 대규모 Angular 애플리케이션을 위한 공통 컴포넌트 집합을 유지 관리하는 개발자일 수 있습니다. | [컴포넌트를 위한 컴포넌트 하네스 만들기](guide/testing/creating-component-harnesses) |
| 하네스 환경 저자          | 추가 테스트 환경에서 컴포넌트 하네스를 사용할 수 있도록 지원을 추가하고자 하는 개발자. 기본 제공되는 지원된 테스트 환경에 대한 정보는 [테스트 하네스 환경 및 로더](guide/testing/using-component-harnesses#test-harness-environments-and-loaders)를 참조하세요. | [추가 테스트 환경에 대한 지원 추가](guide/testing/component-harnesses-testing-environments) |

전체 API 참조는 [Angular CDK의 컴포넌트 하네스 API 참조 페이지](https://material.angular.io/cdk/testing/api)를 참조하세요.