# 코드 테스트량 확인하기

Angular CLI는 단위 테스트를 실행하고 코드 커버리지 보고서를 생성할 수 있습니다.
코드 커버리지 보고서는 단위 테스트가 제대로 테스트하지 않은 코드베이스의 부분을 보여줍니다.

커버리지 보고서를 생성하려면 프로젝트 루트에서 다음 명령을 실행합니다.

<docs-code language="shell">
ng test --no-watch --code-coverage
</docs-code>

테스트가 완료되면 이 명령은 프로젝트 내에 새 `/coverage` 디렉토리를 생성합니다.
`index.html` 파일을 열어 소스 코드와 코드 커버리지 값을 포함한 보고서를 확인하세요.

테스트할 때마다 코드 커버리지 보고서를 생성하려면 Angular CLI 구성 파일인 `angular.json`에 다음 옵션을 설정하세요:

<docs-code language="json">
"test": {
  "options": {
    "codeCoverage": true
  }
}
</docs-code>

## 코드 커버리지 강제 실행

코드 커버리지 비율은 테스트된 코드의 양을 추정하는 데 도움이 됩니다.
팀이 설정한 최소 단위 테스트 양이 있다면, 이 최소값을 Angular CLI로 강제 적용하세요.

예를 들어, 코드베이스에 최소 80% 코드 커버리지를 원한다고 가정합시다.
이를 활성화하려면 [Karma](https://karma-runner.github.io) 테스트 플랫폼 구성 파일인 `karma.conf.js`를 열고 `coverageReporter:` 키에 `check` 속성을 추가하세요.

<docs-code language="javascript">
coverageReporter: {
  dir: require('path').join(__dirname, './coverage/<project-name>'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' }
  ],
  check: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}
</docs-code>

도움말: [테스트 가이드](guide/testing#configuration)에서 Karma 구성 생성 및 조정에 대해 더 읽어보세요.

`check` 속성은 프로젝트에서 단위 테스트가 실행될 때 최소 80% 코드 커버리지를 강제합니다.

코드 커버리지 구성 옵션에 대한 자세한 내용은 [karma coverage documentation](https://github.com/karma-runner/karma-coverage/blob/master/docs/configuration.md)에서 확인하세요.