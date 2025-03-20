# 테스트

Angular 애플리케이션을 테스트하면 애플리케이션이 기대하는 대로 작동하는지 확인할 수 있습니다.

## 테스트 설정

Angular CLI는 [Jasmine 테스트 프레임워크](https://jasmine.github.io)로 Angular 애플리케이션을 테스트하는 데 필요한 모든 것을 다운로드하고 설치합니다.

CLI로 생성한 프로젝트는 즉시 테스트할 준비가 되어 있습니다.
다음 [`ng test`](cli/test) CLI 명령을 실행하세요:

<docs-code language="shell">

ng test

</docs-code>

`ng test` 명령은 애플리케이션을 *감시 모드*로 빌드하고,
[Karma 테스트 러너](https://karma-runner.github.io)를 시작합니다.

콘솔 출력은 다음과 같습니다:

<docs-code language="shell">

02 11 2022 09:08:28.605:INFO [karma-server]: Karma v6.4.1 server started at http://localhost:9876/
02 11 2022 09:08:28.607:INFO [launcher]: Launching browsers Chrome with concurrency unlimited
02 11 2022 09:08:28.620:INFO [launcher]: Starting browser Chrome
02 11 2022 09:08:31.312:INFO [Chrome]: Connected on socket -LaEYvD2R7MdcS0-AAAB with id 31534482
Chrome: Executed 3 of 3 SUCCESS (0.193 secs / 0.172 secs)
TOTAL: 3 SUCCESS

</docs-code>

로그의 마지막 줄은 Karma가 세 개의 테스트를 실행했으며 모두 통과했음을 보여줍니다.

테스트 출력은 [Karma Jasmine HTML Reporter](https://github.com/dfederm/karma-jasmine-html-reporter)를 사용하여 브라우저에서 표시됩니다.

<img alt="브라우저의 Jasmine HTML Reporter" src="assets/images/guide/testing/initial-jasmine-html-reporter.png">

테스트 행을 클릭하여 해당 테스트만 다시 실행하거나 설명을 클릭하여 선택한 테스트 그룹(“테스트 스위트”)의 테스트를 다시 실행할 수 있습니다.

한편, `ng test` 명령은 변경 사항을 감시 중입니다.

이를 실제로 보기 위해 `app.component.ts`에 작은 변경을 하고 저장하세요.
테스트가 다시 실행되고, 브라우저가 새로 고쳐지며 새로운 테스트 결과가 나타납니다.

## 설정

Angular CLI는 Jasmine 및 Karma 구성을 처리합니다. `angular.json` 파일에 지정된 옵션을 기반으로 메모리 내에서 전체 구성을 구성합니다.

Karma를 사용자 정의하려는 경우 다음 명령을 실행하여 `karma.conf.js`를 생성할 수 있습니다:

<docs-code language="shell">

ng generate config karma

</docs-code>

도움이 되는 정보: [Karma 구성 가이드](http://karma-runner.github.io/6.4/config/configuration-file.html)에서 Karma 구성에 대해 자세히 알아보세요.

### 기타 테스트 프레임워크

다른 테스트 라이브러리 및 테스트 러너를 사용하여 Angular 애플리케이션을 단위 테스트할 수도 있습니다.
각 라이브러리와 러너는 고유한 설치 절차, 구성 및 구문이 있습니다.

### 테스트 파일 이름 및 위치

`src/app` 폴더 내에서 Angular CLI는 `AppComponent`에 대한 테스트 파일인 `app.component.spec.ts`를 생성했습니다.

중요: 테스트 파일 확장자 **는 `.spec.ts`여야 합니다** 도구가 이것을 테스트가 포함된 파일(일명 *spec* 파일)로 식별할 수 있게 됩니다.

`app.component.ts`와 `app.component.spec.ts` 파일은 같은 폴더 내의 형제입니다.
루트 파일 이름(`app.component`)은 두 파일 모두 동일합니다.

자신의 프로젝트에서 *모든 종류*의 테스트 파일에 대해 이 두 가지 규칙을 따르십시오.

#### 사양 파일을 그들이 테스트하는 파일 옆에 배치하세요

단위 테스트 사양 파일을 애플리케이션 소스 코드 파일과 동일한 폴더에 두는 것이 좋습니다:

* 이러한 테스트를 찾기가 쉽습니다.
* 애플리케이션의 일부가 테스트가 없는지 즉시 확인할 수 있습니다.
* 가까운 테스트는 특정 부분이 컨텍스트에서 어떻게 작동하는지 보여줄 수 있습니다.
* 소스를 이동할 때(불가피하게) 테스트도 함께 이동해야 함을 기억합니다.
* 소스 파일 이름을 바꿀 때(불가피하게) 테스트 파일 이름도 바꿔야 함을 기억합니다.

#### 사양 파일을 테스트 폴더에 배치하세요

애플리케이션 통합 사양은 여러 부분의 상호 작용을 테스트할 수 있습니다.
폴더와 모듈에 걸쳐 있습니다.
그들은 특정 부분에 속하지 않으므로 어떤 파일 옆에 놓기에도 자연스러운 자리가 없습니다.

일반적으로 `tests` 디렉토리 내에 적절한 폴더를 만드는 것이 더 좋습니다.

물론 테스트 도우미를 테스트하는 스펙은 해당 도우미 파일 옆에 있는 `test` 폴더에 있어야 합니다.

## 지속적 통합에서의 테스트

프로젝트의 버그 없는 상태를 유지하는 가장 좋은 방법 중 하나는 테스트 스위트를 사용하는 것이지만, 항상 테스트를 실행하는 것을 잊을 수 있습니다.

지속적 통합(CI) 서버는 프로젝트 저장소를 설정하여 커밋 및 풀 요청마다 테스트가 실행되도록 합니다.

지속적 통합(CI)에서 Angular CLI 애플리케이션을 테스트하려면 다음 명령을 실행하세요:

<docs-code language="shell">
ng test --no-watch --no-progress --browsers=ChromeHeadless
</docs-code>

## 테스트에 대한 추가 정보

애플리케이션을 테스트를 위해 설정한 후 다음 테스트 가이드를 유용하게 사용할 수 있습니다.

|                                                                    | 세부정보 |
|:---                                                                |:---     |
| [코드 커버리지](guide/testing/code-coverage)                       | 테스트가 앱의 몇 퍼센트를 커버하고 요구되는 양을 지정하는 방법. |
| [서비스 테스트](guide/testing/services)                         | 애플리케이션에서 사용하는 서비스를 테스트하는 방법.                                   |
| [컴포넌트 테스트의 기초](guide/testing/components-basics)    | Angular 컴포넌트를 테스트하는 기초.                                             |
| [컴포넌트 테스트 시나리오](guide/testing/components-scenarios)  | 다양한 종류의 컴포넌트 테스트 시나리오와 사용 사례.                       |
| [속성 지시문 테스트](guide/testing/attribute-directives) | 속성 지시문을 테스트하는 방법.                                            |
| [파이프 테스트](guide/testing/pipes)                               | 파이프를 테스트하는 방법.                                                                |
| [테스트 디버깅](guide/testing/debugging)                            | 일반적인 테스트 버그.                                                              |
| [유틸리티 API 테스트](guide/testing/utility-apis)                 | Angular 테스트 기능.                                                         |