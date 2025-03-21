<docs-decorative-header title="템플릿 구문" imgSrc="adev/src/assets/images/templates.svg"> <!-- markdownlint-disable-line -->
Angular에서 템플릿은 HTML의 조각입니다.
템플릿 내에서 특수 구문을 사용하여 Angular의 많은 기능을 활용하세요.
</docs-decorative-header>

팁: 이 포괄적인 가이드를 살펴보기 전에 Angular의 [필수 사항](essentials/templates)을 확인하세요.

모든 Angular 컴포넌트에는 페이지에 렌더링되는 [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)을 정의하는 **템플릿**이 있습니다. 템플릿을 사용하면 Angular는 데이터가 변경될 때 페이지를 자동으로 최신 상태로 유지할 수 있습니다.

템플릿은 일반적으로 `*.component.ts` 파일의 `template` 속성 또는 `*.component.html` 파일 내에서 찾을 수 있습니다. 더 배우고 싶다면 [심층 컴포넌트 가이드](/guide/components)를 확인하세요.

## 템플릿은 어떻게 작동합니까?

템플릿은 [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) 구문을 기반으로 하며, 내장 템플릿 함수, 데이터 바인딩, 이벤트 리스닝, 변수 등과 같은 추가 기능이 있습니다.

Angular는 템플릿을 JavaScript로 컴파일하여 애플리케이션에 대한 내부 이해를 구축합니다. 이의 이점 중 하나는 Angular가 애플리케이션에 자동으로 적용하는 내장 렌더링 최적화입니다.

### 표준 HTML과의 차이점

템플릿과 표준 HTML 구문 간의 몇 가지 차이점은 다음과 같습니다:

- 템플릿 소스 코드의 주석은 렌더링된 출력에 포함되지 않습니다.
- 컴포넌트 및 디렉티브 요소는 자기 닫힘이 가능합니다 (예: `<UserProfile />`).
- 특정 문자를 포함한 속성(예: `[]`, `()`, 등)은 Angular에 특별한 의미를 갖습니다. 자세한 내용은 [바인딩 문서](guide/templates/binding)와 [이벤트 리스너 추가 문서](guide/templates/event-listeners)를 참조하세요.
- `@` 문자는 템플릿에 [제어 흐름](guide/templates/control-flow)과 같은 동적 동작을 추가하기 위해 Angular에 특별한 의미가 있습니다. 리터럴 `@` 문자를 포함하려면 HTML 엔터티 코드(`&commat;` 또는 `&#64;`)로 이스케이프하면 됩니다.
- Angular는 불필요한 공백 문자를 무시하고 축소합니다. 자세한 내용은 [템플릿의 공백](guide/templates/whitespace)을 참조하세요.
- Angular는 동적 콘텐츠에 대한 자리 표시자 역할을 하는 주석 노드를 페이지에 추가할 수 있지만, 개발자는 이를 무시할 수 있습니다.

또한 대부분의 HTML 구문이 유효한 템플릿 구문이지만, Angular는 템플릿 내에서 `<script>` 요소를 지원하지 않습니다. 자세한 내용은 [보안](best-practices/security) 페이지를 참조하세요.

## 다음은 무엇입니까?

다음도 관심이 있을 수 있습니다:

| 주제                                                                        | 세부정보                                                                                  |
| :-------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| [동적 텍스트, 속성 및 속성 바인딩](guide/templates/binding)               | 텍스트, 속성 및 속성에 동적 데이터를 바인딩합니다.                                        |
| [이벤트 리스너 추가](guide/templates/event-listeners)                      | 템플릿 내에서 이벤트에 응답합니다.                                                        |
| [양방향 바인딩](guide/templates/two-way-binding)                          | 값을 동시에 바인딩하고 변경 사항을 전파합니다.                                            |
| [제어 흐름](guide/templates/control-flow)                                   | 요소를 조건부로 보여주거나 숨기고 반복합니다.                                            |
| [파이프](guide/templates/pipes)                                            | 데이터 변환을 선언적으로 수행합니다.                                                      |
| [ng-content를 사용한 자식 콘텐츠 슬롯팅](guide/templates/ng-content)       | 컴포넌트가 콘텐츠를 렌더링하는 방식을 제어합니다.                                          |
| [ng-template로 템플릿 조각 만들기](guide/templates/ng-template)           | 템플릿 조각을 선언합니다.                                                                  |
| [ng-container로 요소 그룹화](guide/templates/ng-container)                 | 여러 요소를 함께 그룹화하거나 렌더링을 위한 위치를 표시합니다.                            |
| [템플릿의 변수](guide/templates/variables)                                 | 변수 선언에 대해 배우세요.                                                                |
| [@defer로 지연 로딩](guide/templates/defer)                                | `@defer`를 사용해 지연 가능 뷰를 생성합니다.                                              |
| [표현식 구문](guide/templates/expression-syntax)                           | Angular 표현식과 표준 JavaScript 간의 유사점과 차이점을 학습합니다.                       |
| [템플릿에서의 공백](guide/templates/whitespace)                           | Angular가 공백을 처리하는 방법을 배웁니다.                                               |