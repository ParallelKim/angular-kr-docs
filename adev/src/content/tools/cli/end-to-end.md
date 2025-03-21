# 엔드 투 엔드 테스트

엔드 투 엔드(E2E) 테스트는 전체 애플리케이션이 처음부터 끝까지 예상대로 작동하는지 확인하기 위해 사용되는 테스트의 형태입니다. E2E 테스트는 코드의 기본 구현 세부 사항과는 완전히 분리되어 있다는 점에서 단위 테스트와 다릅니다. 일반적으로 사용자가 애플리케이션과 상호 작용하는 방식을 모방하여 애플리케이션을 검증하는 데 사용됩니다. 이 페이지는 Angular CLI를 사용하여 Angular에서 엔드 투 엔드 테스트를 시작하는 방법에 대한 가이드 역할을 합니다.

## E2E 테스트 설정

Angular CLI는 Angular 애플리케이션에 대한 엔드 투 엔드 테스트를 실행하는 데 필요한 모든 것을 다운로드하고 설치합니다.

<docs-code language="shell">

ng e2e

</docs-code>

`ng e2e` 명령은 먼저 프로젝트에서 "e2e" 대상을 확인합니다. 이를 찾을 수 없는 경우, CLI는 사용하려는 e2e 패키지를 묻고 설정 과정을 안내합니다.

<docs-code language="shell">

지정된 프로젝트에 대한 "e2e" 대상을 찾을 수 없습니다.
이러한 기능을 구현하는 패키지를 추가할 수 있습니다.

예를 들어:
Cypress: ng add @cypress/schematic
Nightwatch: ng add @nightwatch/schematics
WebdriverIO: ng add @wdio/schematics
Playwright: ng add playwright-ng-schematics
Puppeteer: ng add @puppeteer/ng-schematics

지금 "e2e" 기능이 있는 패키지를 추가하시겠습니까?
아니요
❯ Cypress
Nightwatch
WebdriverIO
Playwright
Puppeteer

</docs-code>

위 목록에서 사용하려는 테스트 러너를 찾지 못한 경우 `ng add`를 사용하여 패키지를 수동으로 추가할 수 있습니다.

## E2E 테스트 실행

이제 애플리케이션이 엔드 투 엔드 테스트에 맞게 구성되었으므로 동일한 명령을 실행하여 테스트를 실행할 수 있습니다.

<docs-code language="shell">

ng e2e

</docs-code>

특히 통합된 e2e 패키지를 사용하여 테스트를 실행하는 것에 대해 "특별한" 점은 없습니다. `ng e2e` 명령은 기본적으로 `e2e` 빌더를 실행하고 있습니다. 항상 [자신만의 커스텀 빌더](tools/cli/cli-builder#creating-a-builder)인 `e2e`를 생성하고 이를 사용하여 `ng e2e`로 실행할 수 있습니다.

## 엔드 투 엔드 테스트 도구에 대한 추가 정보

| 테스트 도구   | 세부 정보                                                                                                            |
| :----------- | :------------------------------------------------------------------------------------------------------------------- |
| Cypress      | [Cypress 시작하기](https://docs.cypress.io/guides/end-to-end-testing/writing-your-first-end-to-end-test)          |
| Nightwatch   | [Nightwatch 시작하기](https://nightwatchjs.org/guide/writing-tests/introduction.html)                              |
| WebdriverIO  | [Webdriver.io 시작하기](https://webdriver.io/docs/gettingstarted)                                                 |
| Playwright   | [Playwright 시작하기](https://playwright.dev/docs/writing-tests)                                                   |
| Puppeteer    | [Puppeteer 시작하기](https://pptr.dev)                                                                             |