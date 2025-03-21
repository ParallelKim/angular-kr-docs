# Angular CLI

Angular CLI는 명령줄 인터페이스 도구로, 명령 셸에서 직접 Angular 애플리케이션을 스캐폴드하고 개발, 테스트, 배포 및 유지 관리할 수 있게 해줍니다.

Angular CLI는 npm에서 `@angular/cli` 패키지로 게시되며, `ng`라는 이진 파일을 포함합니다. `ng`를 호출하는 명령은 Angular CLI를 사용하는 것입니다.

<docs-callout title="로컬 설정 없이 Angular 사용해보기">

Angular에 처음이신가요? [지금 시도해보세요!](tutorials/learn-angular)를 시작해보는 것이 좋습니다. 이 튜토리얼은 수정하고 살펴볼 수 있는 기본 온라인 상점 앱의 맥락에서 Angular의 필수 요소를 소개합니다.
이 독립형 튜토리얼은 온라인 개발을 위한 대화형 [StackBlitz](https://stackblitz.com) 환경을 활용합니다.
준비가 될 때까지 로컬 환경을 설정할 필요가 없습니다.

</docs-callout>

<docs-card-container>
  <docs-card title="시작하기" link="시작하기" href="tools/cli/setup-local">
    Angular CLI를 설치하여 첫 번째 앱을 생성하고 빌드합니다.
  </docs-card>
  <docs-card title="명령 참조" link="더 알아보기" href="cli">
    Angular로 생산성을 높이기 위한 CLI 명령을 알아보세요.
  </docs-card>
  <docs-card title="스키매틱" link="더 알아보기" href="tools/cli/schematics">
    애플리케이션의 소스 파일을 자동으로 생성하고 수정하는 스키매틱을 생성하고 실행합니다.
  </docs-card>
  <docs-card title="빌더" link="더 알아보기" href="tools/cli/cli-builder">
    소스 코드에서 생성된 빌드 출력으로 복잡한 변환을 수행하는 빌더를 생성하고 실행합니다.
  </docs-card>
</docs-card-container>

## CLI 명령-언어 문법

Angular CLI는 대략적으로 옵션 문법에 대한 Unix/POSIX 규칙을 따릅니다.

### 불리언 옵션

불리언 옵션은 두 가지 형태가 있습니다: `--this-option`은 플래그를 `true`로 설정하고, `--no-this-option`은 `false`로 설정합니다.
`--this-option=false` 또는 `--this-option=true`를 사용할 수도 있습니다.
어느 옵션도 제공되지 않으면 플래그는 참조 문서에 나열된 기본 상태를 유지합니다.

### 배열 옵션

배열 옵션은 두 가지 형태로 제공될 수 있습니다: `--option value1 value2` 또는 `--option value1 --option value2`입니다.

### 키/값 옵션

`--define`과 같은 일부 옵션은 배열의 `key=value` 쌍을 값으로 기대합니다.
배열 옵션처럼, 키/값 옵션은 두 가지 형태로 제공될 수 있습니다: `--define 'KEY_1="value1"' KEY_2=true` 또는 `--define 'KEY_1="value1"' --define KEY_2=true`입니다.

### 상대 경로

파일을 지정하는 옵션은 절대 경로로 제공할 수 있으며, 현재 작업 디렉토리(일반적으로 작업 공간 또는 프로젝트 루트)에 상대적인 경로로도 제공할 수 있습니다.