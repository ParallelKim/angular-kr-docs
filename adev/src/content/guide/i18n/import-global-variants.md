# 전역 지역 데이터 가져오기

[Angular CLI][CliMain]는 `--localize` 옵션과 함께 [`ng build`][CliBuild] 명령을 실행하면 자동으로 지역 데이터를 포함합니다.

<!--todo: replace with docs-code -->

<docs-code language="shell">

ng build --localize

</docs-code>

도움말: Angular의 초기 설치에는 미국 영어에 대한 지역 데이터 \(`en-US`\)가 이미 포함되어 있습니다.
[Angular CLI][CliMain]는 `--localize` 옵션과 함께 [`ng build`][CliBuild] 명령을 사용할 때 지역 데이터를 자동으로 포함하고 `LOCALE_ID` 값을 설정합니다.

npm의 `@angular/common` 패키지에는 지역 데이터 파일이 포함되어 있습니다.
전역 지역 데이터 변형은 `@angular/common/locales/global`에서 사용할 수 있습니다.

## 프랑스어 `import` 예제

예를 들어, 애플리케이션을 부트스트랩하는 `main.ts`에서 프랑스어 \(`fr`\)에 대한 전역 변형을 가져올 수 있습니다.

<docs-code header="src/main.ts (지역 가져오기)" path="adev/src/content/examples/i18n/src/main.ts" visibleRegion="global-locale"/>

도움말: `NgModules` 애플리케이션에서는 `app.module`에서 가져옵니다.

[CliMain]: cli "CLI 개요 및 명령 참조 | Angular"
[CliBuild]: cli/build "ng build | CLI | Angular"