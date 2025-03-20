# 작업공간 및 프로젝트 파일 구조

Angular 작업공간의 맥락에서 애플리케이션을 개발합니다.
작업공간은 하나 이상의 프로젝트 파일을 포함합니다.
프로젝트는 애플리케이션 또는 공유 가능한 라이브러리를 구성하는 파일 집합입니다.

Angular CLI의 `ng new` 명령은 작업공간을 생성합니다.

<docs-code language="shell">

ng new my-project

</docs-code>

이 명령을 실행하면 CLI는 새로운 작업공간에 필요한 Angular npm 패키지와 기타 의존성을 설치하며, *my-project*라는 이름의 루트 수준 애플리케이션을 생성합니다.

기본적으로 `ng new`는 작업공간의 루트 수준에 초기 스켈레톤 애플리케이션과 해당 엔드 투 엔드 테스트를 생성합니다.
이 스켈레톤은 실행 준비가 되어 있고 수정하기 쉬운 간단한 환영 애플리케이션을 위한 것입니다.
루트 수준 애플리케이션은 작업공간과 동일한 이름을 가지며, 소스 파일은 작업공간의 `src/` 하위 폴더에 위치합니다.

이 기본 동작은 각 애플리케이션이 자신의 작업공간에 위치하는 전형적인 "다중 리포" 개발 스타일에 적합합니다.
초보자와 중급 사용자는 각 애플리케이션에 대해 별도의 작업공간을 만들기 위해 `ng new`를 사용하는 것이 권장됩니다.

Angular는 또한 [다수의 프로젝트](#multiple-projects)가 있는 작업공간을 지원합니다.
이러한 개발 환경은 공유 가능한 라이브러리를 개발하고 있는 고급 사용자와 "모노레포" 개발 스타일(단일 리포지토리 및 모든 Angular 프로젝트에 대한 전역 구성)을 사용하는 기업에 적합합니다.

모노레포 작업공간을 설정하려면 루트 애플리케이션 생성을 건너뛰어야 합니다.
아래의 [다중 프로젝트 작업공간 설정](#multiple-projects)을 참조하세요.

## 작업공간 구성 파일

작업공간 내의 모든 프로젝트는 [구성](reference/configs/workspace-config)을 공유합니다.
작업공간의 최상위에는 작업공간 전체 구성 파일, 루트 수준 애플리케이션의 구성 파일 및 루트 수준 애플리케이션 소스 및 테스트 파일을 위한 하위 폴더가 포함됩니다.

| 작업공간 구성 파일          | 목적                                                                                                                                                                                                                         |
|:---                          |:---                                                                                                                                                                                                                           |
| `.editorconfig`              | 코드 편집기를 위한 구성. [EditorConfig](https://editorconfig.org)를 참조하세요.                                                                                                                                                  |
| `.gitignore`                 | [Git](https://git-scm.com)가 무시해야 하는 의도적으로 추적되지 않은 파일을 지정합니다.                                                                                                                                         |
| `README.md`                  | 작업공간에 대한 문서.                                                                                                                                                                                                          |
| `angular.json`               | 모든 프로젝트를 위한 CLI 구성으로, 각 프로젝트를 빌드하고 제공하고 테스트하는 방법에 대한 구성 옵션을 포함합니다. 자세한 내용은 [Angular 작업공간 구성](reference/configs/workspace-config)을 참조하세요.                                     |
| `package.json`               | 작업공간 내의 모든 프로젝트에서 사용할 수 있는 [npm 패키지 의존성](reference/configs/npm-packages)을 구성합니다. 이 파일의 구체적인 형식 및 내용에 대해서는 [npm 문서](https://docs.npmjs.com/files/package.json)를 참조하세요.                           |
| `package-lock.json`          | npm 클라이언트에 의해 `node_modules`에 설치된 모든 패키지에 대한 버전 정보를 제공합니다. 자세한 내용은 [npm 문서](https://docs.npmjs.com/files/package-lock.json)를 참조하세요.                                                                 |
| `src/`                       | 루트 수준 애플리케이션 프로젝트의 소스 파일.                                                                                                                                                                                |
| `public/`                    | 애플리케이션을 빌드할 때 있는 그대로 복사되고 개발 서버에 의해 정적 파일로 제공될 이미지 및 기타 자산 파일을 포함합니다.                                                                                          |
| `node_modules/`              | 전체 작업공간을 위한 설치된 [npm 패키지](reference/configs/npm-packages). 작업공간 전체의 `node_modules` 의존성은 모든 프로젝트에 표시됩니다.                                                                                                   |
| `tsconfig.json`              | 작업공간 내 프로젝트에 대한 기본 [TypeScript](https://www.typescriptlang.org) 구성입니다. 모든 다른 구성 파일은 이 기본 파일을 상속합니다. 추가 정보는 [관련 TypeScript 문서](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#tsconfig-bases)를 참조하세요. |

## 애플리케이션 프로젝트 파일

기본적으로, CLI 명령 `ng new my-app`는 "my-app"이라는 이름의 작업공간 폴더를 생성하고 작업공간의 최상위 `src/` 폴더에 새 애플리케이션 스켈레톤을 생성합니다.
새로 생성된 애플리케이션은 루트 모듈을 위한 소스 파일과 루트 구성 요소 및 템플릿을 포함합니다.

작업공간 파일 구조가 설정되면 명령줄에서 `ng generate` 명령을 사용하여 애플리케이션에 기능과 데이터를 추가할 수 있습니다.
이 초기 루트 수준 애플리케이션은 CLI 명령의 *기본 애플리케이션*입니다 (추가 애플리케이션을 생성한 후 기본값을 변경하지 않는 한) [다중 프로젝트](#multiple-projects).

단일 애플리케이션 작업공간의 경우, 작업공간의 `src` 하위 폴더는 루트 애플리케이션의 소스 파일(애플리케이션 로직, 데이터 및 자산)을 포함합니다.
다중 프로젝트 작업공간의 경우, `projects` 폴더 내의 추가 프로젝트는 동일한 구조의 `project-name/src/` 하위 폴더를 포함합니다.

### 애플리케이션 소스 파일

`src/`의 최상위 파일은 애플리케이션을 실행하는 지원을 제공합니다.
하위 폴더는 애플리케이션 소스 및 애플리케이션 특정 구성을 포함합니다.

| 애플리케이션 지원 파일       | 목적                                                                                                                                                                                                                                       |
|:---                          |:---                                                                                                                                                                                                                                       |
| `app/`                       | 애플리케이션 로직과 데이터가 정의된 구성 요소 파일을 포함합니다. [아래](#app-src)에서 세부정보를 참조하세요.                                                                                                                          |
| `favicon.ico`               | 북마크 바에서 이 애플리케이션에 사용할 아이콘입니다.                                                                                                                                                                                    |
| `index.html`                | 누군가가 귀하의 사이트를 방문할 때 제공되는 주요 HTML 페이지입니다. CLI는 애플리케이션을 빌드할 때 모든 JavaScript 및 CSS 파일을 자동으로 추가하므로, 일반적으로 여기에서 `<script>` 또는 `<link>` 태그를 수동으로 추가할 필요가 없습니다. |
| `main.ts`                   | 애플리케이션의 주요 진입점입니다.                                                                                                                                                                                                         |
| `styles.css`                | 전체 애플리케이션에 적용되는 전역 CSS 스타일입니다.                                                                                                                                                                                     |

`src` 폴더 안에 `app` 폴더가 프로젝트의 로직과 데이터를 포함하고 있습니다.
Angular 구성 요소, 템플릿, 스타일이 여기에 들어갑니다.

| `src/app/` 파일          | 목적                                                                                                                                                                                                                                      |
|:---                      |:---                                                                                                                                                                                                                                      |
| `app.config.ts`         | Angular에 애플리케이션을 조합하는 방법을 알려주는 애플리케이션 구성을 정의합니다. 앱에 더 많은 공급자를 추가할 때, 여기에 선언해야 합니다.<br><br>*`--standalone` 옵션을 사용할 때만 생성됩니다.*                                     |
| `app.component.ts`      | `AppComponent`라는 애플리케이션의 루트 구성 요소를 정의합니다. 이 루트 구성 요소와 관련된 뷰는 구성 요소 및 서비스를 애플리케이션에 추가할 때 뷰 계층의 루트가 됩니다.                                          |
| `app.component.html`    | `AppComponent`와 관련된 HTML 템플릿을 정의합니다.                                                                                                                                                                                     |
| `app.component.css`     | `AppComponent`의 CSS 스타일 시트를 정의합니다.                                                                                                                                                                                         |
| `app.component.spec.ts` | `AppComponent`에 대한 단위 테스트를 정의합니다.                                                                                                                                                                                       |
| `app.module.ts`         | Angular에 애플리케이션을 조합하는 방법을 알려주는 `AppModule`이라는 루트 모듈을 정의합니다. 처음에는 `AppComponent`만 선언합니다. 애플리케이션에 더 많은 구성 요소를 추가할 때, 여기에 선언해야 합니다.<br><br>*`--standalone false` 옵션을 사용할 때만 생성됩니다.* |
| `app.routes.ts`         | 애플리케이션의 라우팅 구성을 정의합니다.                                                                                                                                                                                                 |

### 애플리케이션 구성 파일

루트 애플리케이션에 대한 애플리케이션 특정 구성 파일은 작업공간 루트 수준에 위치합니다.
다중 프로젝트 작업공간의 경우, 프로젝트 특정 구성 파일은 `projects/project-name/` 아래의 프로젝트 루트에 위치합니다.

프로젝트 특정 [TypeScript](https://www.typescriptlang.org) 구성 파일은 작업공간 전체의 `tsconfig.json`을 상속합니다.

| 애플리케이션 특정 구성 파일         | 목적                                                                                                                                                                                                                         |
|:---                                 |:---                                                                                                                                                                                                                           |
| `tsconfig.app.json`                 | 애플리케이션 특정 [TypeScript 구성](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html), 여기에는 [Angular 컴파일러 옵션](reference/configs/angular-compiler-options)이 포함됩니다.                                                   |
| `tsconfig.spec.json`                | 애플리케이션 테스트를 위한 [TypeScript 구성](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).                                                                                                               |

## 다중 프로젝트

다중 프로젝트 작업공간은 여러 Angular 프로젝트에 대한 단일 리포지토리 및 전역 구성을 사용하는 조직에 적합합니다( "모노레포" 모델).
다중 프로젝트 작업공간은 또한 라이브러리 개발을 지원합니다.

### 다중 프로젝트 작업공간 설정

작업공간에 여러 프로젝트를 두려는 경우, 작업공간을 생성할 때 초기 애플리케이션 생성을 건너뛰고, 작업공간에 고유한 이름을 부여할 수 있습니다.
다음 명령은 모든 작업공간 구성 파일이 포함된 작업공간을 생성하지만 루트 수준 애플리케이션은 없습니다.

<docs-code language="shell">

ng new my-workspace --no-create-application

</docs-code>

이후, 작업공간 내에서 고유한 이름을 가진 애플리케이션과 라이브러리를 생성할 수 있습니다.

<docs-code language="shell">

cd my-workspace
ng generate application my-app
ng generate library my-lib

</docs-code>

### 다중 프로젝트 파일 구조

첫 번째로 명시적으로 생성된 애플리케이션은 작업공간의 `projects` 폴더에 다른 모든 프로젝트와 함께 위치합니다.
새롭게 생성된 라이브러리도 `projects` 아래에 추가됩니다.
이렇게 프로젝트를 생성하면 작업공간의 파일 구조가 [작업공간 구성 파일](reference/configs/workspace-config), `angular.json`의 구조와 완전히 일치합니다.

```markdown
my-workspace/
  ├── …                (작업공간 전체의 구성 파일)
  └── projects/        (애플리케이션과 라이브러리)
      ├── my-app/      (명시적으로 생성된 애플리케이션)
      │   └── …        (애플리케이션 특정 코드와 구성)
      └── my-lib/      (생성된 라이브러리)
          └── …        (라이브러리 특정 코드와 구성)
```

## 라이브러리 프로젝트 파일

CLI를 사용하여 라이브러리를 생성할 때(예: `ng generate library my-lib` 명령 사용) 생성된 파일은 작업공간의 `projects/` 폴더에 들어갑니다.
자신의 라이브러리를 만드는 방법에 대한 자세한 정보는 [라이브러리 만들기](tools/libraries/creating-libraries)를 참조하세요.

애플리케이션과 달리, 라이브러리에는 자체 `package.json` 구성 파일이 있습니다.

`projects/` 폴더 아래의 `my-lib` 폴더는 라이브러리 코드를 포함합니다.

| 라이브러리 소스 파일          | 목적                                                                                                                                                                                        |
|:---                         |:---                                                                                                                                                                                        |
| `src/lib`                   | 라이브러리 프로젝트의 로직과 데이터를 포함합니다. 애플리케이션 프로젝트와 마찬가지로, 라이브러리 프로젝트는 구성 요소, 서비스, 모듈, 지시자 및 파이프를 포함할 수 있습니다.                      |
| `src/public-api.ts`         | 라이브러리에서 내보내는 모든 파일을 지정합니다.                                                                                                                                           |
| `ng-package.json`           | 라이브러리를 빌드하기 위해 [ng-packagr](https://github.com/ng-packagr/ng-packagr)에서 사용하는 구성 파일입니다.                                                                                                                  |
| `package.json`              | 이 라이브러리에 필요한 [npm 패키지 의존성](reference/configs/npm-packages)을 구성합니다.                                                                                                         |
| `tsconfig.lib.json`         | 라이브러리 특정 [TypeScript 구성](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html), 여기에는 [Angular 컴파일러 옵션](reference/configs/angular-compiler-options)이 포함됩니다.         |
| `tsconfig.lib.prod.json`    | 라이브러리를 프로덕션 모드로 빌드할 때 사용되는 라이브러리 특정 [TypeScript 구성](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)입니다.                                  |
| `tsconfig.spec.json`        | 라이브러리의 단위 테스트를 위한 [TypeScript 구성](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).                                                                           |