# 첫 번째 Angular 앱 만들기

이 튜토리얼은 Angular에서 코딩을 시작하는 데 필요한 Angular 개념을 소개하는 수업으로 구성되어 있습니다.

원하는 만큼 많이 또는 적게 할 수 있으며, 원하는 순서로 진행할 수 있습니다.

도움이 되는 정보: 비디오를 선호하시나요? 이 튜토리얼을 위한 전체 [YouTube 과정](https://youtube.com/playlist?list=PL1w1q3fL4pmj9k1FrJ3Pe91EPub2_h4jF&si=1q9889ulHp8VZ0e7)도 있습니다!

<docs-video src="https://www.youtube.com/embed/xAT0lHYhHMY?si=cKUW_MGn3MesFT7o"/>

## 시작하기 전에

이 튜토리얼을 가장 잘 활용하기 위해, 성공적으로 진행하는 데 필요한 요구 사항을 검토하세요.

### 귀하의 경험

이 튜토리얼의 수업은 다음에 대한 경험이 있다고 가정합니다:

1. HTML을 직접 편집하여 HTML 웹 페이지를 만든 경험
1. JavaScript로 웹 사이트 콘텐츠를 프로그래밍한 경험
1. Cascading Style Sheet (CSS) 콘텐츠를 읽고 선택자가 어떻게 사용되는지 이해한 경험
1. 명령 줄 지침을 사용하여 컴퓨터에서 작업을 수행한 경험

### 귀하의 장비

이 수업은 Angular 도구의 로컬 설치 또는 내장 편집기를 사용하여 완료할 수 있습니다. 로컬 Angular 개발은 Windows, MacOS 또는 Linux 기반 시스템에서 완료할 수 있습니다.

참고: 로컬 편집자 전용 단계를 강조하는 알림을 살펴보세요.

## 첫 번째 Angular 앱에 대한 개념 미리보기

이 튜토리얼의 수업은 임대할 집 목록과 개별 집의 세부 정보를 표시하는 Angular 앱을 만듭니다.
이 앱은 많은 Angular 앱에서 공통적으로 사용되는 기능을 활용합니다.

<img alt="Output of homes landing page" src="assets/images/tutorials/first-app/homes-app-landing-page.png">

## 로컬 개발 환경

참고: 이 단계는 로컬 환경 전용입니다!

이 튜토리얼을 위해 사용하고자 하는 컴퓨터의 명령 줄 도구에서 다음 단계를 수행하세요.

<docs-workflow>

<docs-step title="Angular에 필요한 `node.js` 버전 확인">
Angular는 활성 LTS 또는 유지 관리 LTS 버전의 Node가 필요합니다. `node.js` 버전을 확인해 봅시다. 특정 버전 요구 사항에 대한 정보는 [package.json 파일](https://unpkg.com/browse/@angular/core@15.1.5/package.json)의 engines 속성을 참조하세요.

**터미널** 창에서:

1. 다음 명령을 실행하세요: `node --version`
1. 표시된 버전 번호가 요구 사항을 충족하는지 확인하세요.
</docs-step>

<docs-step title="Angular에 맞는 올바른 `node.js` 버전 설치">
`node.js` 버전이 설치되어 있지 않은 경우, [nodejs.org에서 설치 지침을 따르세요](https://nodejs.org/en/download/)
</docs-step>

<docs-step title="최신 버전의 Angular 설치">
`node.js`와 `npm`이 설치된 후, 다음 단계는 효과적인 Angular 개발을 위한 도구를 제공하는 [Angular CLI](tools/cli)를 설치하는 것입니다.

**터미널** 창에서 다음 명령을 실행하세요: `npm install -g @angular/cli`.
</docs-step>

<docs-step title="통합 개발 환경(IDE) 설치">
Angular로 앱을 제작하기 위해 원하는 도구를 자유롭게 사용할 수 있습니다. 다음을 추천합니다:

1. [Visual Studio Code](https://code.visualstudio.com/)
2. 선택 사항이지만 권장되는 단계로, [Angular Language Service](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template)를 설치하여 개발자 경험을 더욱 향상시킬 수 있습니다.
3. [WebStorm](https://www.jetbrains.com/webstorm/)
</docs-step>

</docs-workflow>

이 수업에서 다룰 주제에 대한 자세한 내용을 원하시면 방문하세요:

<docs-pill-row>
  <docs-pill href="/overview" title="Angular란 무엇인가"/>
  <docs-pill href="/tools/cli/setup-local" title="로컬 환경 및 작업 공간 설정"/>
  <docs-pill href="/cli" title="Angular CLI 참조"/>
</docs-pill-row>