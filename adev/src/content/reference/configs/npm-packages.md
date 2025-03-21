# 워크스페이스 npm 의존성

Angular 프레임워크, Angular CLI 및 Angular 애플리케이션에서 사용하는 구성 요소는 [npm 패키지](https://docs.npmjs.com/getting-started/what-is-npm "npm이란?")로 패키징되어 [npm 레지스트리](https://docs.npmjs.com)를 통해 배포됩니다.

[npm CLI 클라이언트](https://docs.npmjs.com/cli/install)를 사용하여 이러한 npm 패키지를 다운로드하고 설치할 수 있습니다.
기본적으로 Angular CLI는 npm 클라이언트를 사용합니다.

도움이 되는 정보: `Node.js` 및 `npm`의 필수 버전 및 설치에 대한 정보는 [로컬 환경 설정](tools/cli/setup-local "로컬 개발을 위한 설정")을 참조하세요.

다른 버전의 Node.js 및 npm을 사용하는 프로젝트가 이미 기계에서 실행 중인 경우 [nvm](https://github.com/creationix/nvm)을 사용하여 여러 버전의 Node.js 및 npm을 관리하는 것을 고려하세요.

## `package.json`

`npm`은 [`package.json`](https://docs.npmjs.com/files/package.json) 파일에 명시된 패키지를 설치합니다.

CLI 명령 `ng new`는 새 워크스페이스를 만들 때 `package.json` 파일을 생성합니다.
이 `package.json`은 워크스페이스의 모든 프로젝트에서 사용되며, CLI가 워크스페이스를 만들 때 생성한 초기 애플리케이션 프로젝트도 포함됩니다.
`ng generate library`로 생성된 라이브러리는 자체 `package.json` 파일을 포함합니다.

초기에는 이 `package.json`이 Angular에서 필수인 일부 패키지와 일반 애플리케이션 시나리오를 지원하는 다른 패키지를 포함한 *스타터 패키지 세트*를 포함합니다.
응용 프로그램이 발전함에 따라 `package.json`에 패키지를 추가합니다.

## 기본 의존성

다음 Angular 패키지는 새로운 Angular 워크스페이스의 기본 `package.json` 파일에 의존성으로 포함됩니다.
Angular 패키지의 전체 목록은 [API 참조](api)를 참조하세요.

| 패키지 이름                                                              | 세부정보                                                                                                                                                                                        |
|:---                                                                       |:---                                                                                                                                                                                            |
| [`@angular/animations`](api#animations)                                   | Angular의 애니메이션 라이브러리는 페이지 및 목록 전환과 같은 애니메이션 효과를 정의하고 적용하는 것을 쉽게 만듭니다. 더 많은 정보는 [애니메이션 가이드](guide/animations)를 참조하세요.        |
| [`@angular/common`](api#common)                                           | Angular 팀에서 제공하는 일반적으로 필요한 서비스, 파이프 및 지시문입니다.                                                                                                              |
| `@angular/compiler`                                                       | Angular의 템플릿 컴파일러. Angular 템플릿을 이해하고 애플리케이션을 실행하는 코드를 변환할 수 있습니다.                                                                     |
| `@angular/compiler-cli`                                                   | Angular CLI의 `ng build` 및 `ng serve` 명령에 의해 호출되는 Angular의 컴파일러. Angular 템플릿을 `@angular/compiler`로 처리하여 표준 TypeScript 컴파일 내에서 실행합니다. |
| [`@angular/core`](api#core)                                               | 모든 애플리케이션에 필요한 프레임워크의 중요한 런타임 부분. `@Component`와 같은 모든 메타데이터 장식자, 의존성 주입 및 구성 요소 생명주기 훅을 포함합니다.      |
| [`@angular/forms`](api#forms)                                             | [템플릿 기반](guide/forms) 및 [반응형 양식](guide/forms/reactive-forms)을 모두 지원합니다. [양식 소개](guide/forms)를 참조하세요.                                                    |
| [`@angular/platform-browser`](api#platform-browser)                       | DOM 및 브라우저와 관련된 모든 것, 특히 DOM에 렌더링하는 데 도움이 되는 구성 요소들입니다.                                                                                                       |
| [`@angular/platform-browser-dynamic`](api#platform-browser-dynamic)       | [JIT 컴파일러](tools/cli/aot-compiler#choosing-a-compiler)를 사용하여 클라이언트에서 애플리케이션을 컴파일하고 실행하기 위한 [제공자](api/core/Provider) 및 메서드를 포함합니다.                     |
| [`@angular/router`](api#router)                                           | 브라우저 URL이 변경될 때 애플리케이션 페이지 간을 탐색하는 라우터 모듈입니다. 더 많은 정보는 [라우팅 및 탐색](guide/routing)을 참조하세요.                                       |
| [`@angular/cli`](https://github.com/angular/angular-cli)                  | `ng` 명령을 실행하는 Angular CLI 이진 파일이 포함되어 있습니다.                                                                                                                                     |
| [`@angular-devkit/build-angular`](https://github.com/angular/angular-cli) | Angular 애플리케이션 및 라이브러리를 번들링, 테스트 및 제공하기 위한 기본 CLI 빌더가 포함되어 있습니다.                                                                                           |
| `rxjs`                                                                    | `Observables`를 사용하는 반응형 프로그래밍을 위한 라이브러리입니다.                                                                                                                                        |
| [`zone.js`](https://github.com/angular/zone.js)                           | Angular는 네이티브 JavaScript 작업이 이벤트를 발생시킬 때 Angular의 변경 감지 프로세스를 실행하기 위해 `zone.js`에 의존합니다.                                                                       |
| [`typescript`](https://www.npmjs.com/package/typescript)                  | TypeScript 컴파일러, 언어 서버 및 내장형 타입 정의입니다.                                                                                                                       |