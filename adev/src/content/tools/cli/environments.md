# 애플리케이션 환경 구성하기

프로젝트에 대해 `development`와 `staging`과 같은 다른 이름의 빌드 구성을 정의할 수 있으며, 각각의 기본값이 다를 수 있습니다.

각 이름 구성은 `build`, `serve` 및 `test`와 같은 다양한 빌더 대상에 적용되는 모든 옵션에 대한 기본값을 가질 수 있습니다.
[Angular CLI](tools/cli) `build`, `serve` 및 `test` 명령은 이후 대상 환경에 맞는 적절한 버전으로 파일을 교체할 수 있습니다.

## Angular CLI 구성

Angular CLI 빌더는 명령줄에 제공된 구성에 따라 빌더에 대한 특정 옵션을 덮어쓰는 `configurations` 객체를 지원합니다.

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            // 기본적으로 소스 맵 생성을 비활성화합니다.
            "sourceMap": false
          },
          "configurations": {
            // `debug` 구성에 대해 소스 맵을 활성화합니다.
            "debug": {
              "sourceMap": true
            }
          }
        },
        …
      }
    }
  }
}

</docs-code>

`--configuration` 옵션을 사용하여 사용할 구성을 선택할 수 있습니다.

<docs-code language="shell">

ng build --configuration debug

</docs-code>

구성은 모든 Angular CLI 빌더에 적용될 수 있습니다. 여러 구성을 쉼표로 구분하여 지정할 수 있습니다. 구성은 순서대로 적용되며, 충돌하는 옵션은 마지막 구성에서 값을 사용합니다.

<docs-code language="shell">

ng build --configuration debug,production,customer-facing

</docs-code>

## 환경별 기본값 구성

`@angular-devkit/build-angular:browser`는 빌드를 실행 전에 소스 파일을 대체할 수 있는 파일 교체 옵션을 지원합니다.
이를 `--configuration`와 결합하여 애플리케이션에서 환경별 데이터를 구성하는 메커니즘을 제공합니다.

먼저 [환경 생성하기](cli/generate/environments)를 통해 `src/environments/` 디렉토리를 만들고 프로젝트를 파일 교체를 사용하도록 구성합니다.

<docs-code language="shell">

ng generate environments

</docs-code>

프로젝트의 `src/environments/` 디렉토리에는 생산에 대한 기본 구성을 제공하는 기본 구성 파일 `environment.ts`가 포함되어 있습니다.
대상별 구성 파일에서 `development` 및 `staging`과 같은 추가 환경에 대한 기본값을 덮어쓸 수 있습니다.

예를 들어:

<docs-code language="text">

my-app/src/environments
├── environment.development.ts
├── environment.staging.ts
└── environment.ts

</docs-code>

기본 파일 `environment.ts`는 기본 환경 설정을 포함합니다.
예를 들어:

<docs-code language="typescript">

export const environment = {
  production: true
};

</docs-code>

`build` 명령은 환경이 지정되지 않았을 때 이 설정을 빌드 대상으로 사용합니다.
환경 객체에 추가 속성으로 추가 변수를 추가하거나 별도의 객체로 추가할 수 있습니다.
예를 들어, 다음은 기본 환경에 대한 변수의 기본값을 추가합니다:

<docs-code language="typescript">

export const environment = {
  production: true,
  apiUrl: 'http://my-prod-url'
};

</docs-code>

대상별 구성 파일을 추가할 수 있습니다. 예를 들어 `environment.development.ts`.
다음 내용은 개발 빌드 대상을 위한 기본값을 설정합니다:

<docs-code language="typescript">

export const environment = {
  production: false,
  apiUrl: 'http://my-dev-url'
};

</docs-code>

## 애플리케이션에서 환경별 변수 사용하기

정의한 환경 구성을 사용하려면, 컴포넌트가 원래의 환경 파일을 import해야 합니다:

<docs-code language="typescript">

import { environment } from './environments/environment';

</docs-code>

이렇게 하면 빌드 및 서브 명령이 특정 빌드 대상을 위한 구성을 찾을 수 있습니다.

컴포넌트 파일(`app.component.ts`)의 다음 코드는 구성 파일에 정의된 환경 변수를 사용합니다.

<docs-code language="typescript">

import { environment } from './../environments/environment';

// 프로덕션에서는 `http://my-prod-url`, 개발에서는 `http://my-dev-url`에서 가져옵니다.
fetch(environment.apiUrl);

</docs-code>

주요 CLI 구성 파일인 `angular.json`에는 각 빌드 대상의 구성을 위한 `fileReplacements` 섹션이 포함되어 있어 TypeScript 프로그램의 파일을 대상별 버전으로 교체할 수 있습니다.
이는 특정 환경, 예를 들어 생산 또는 스테이징을 목표로 하는 빌드에 대상별 코드나 변수를 포함하는 데 유용합니다.

기본적으로 파일은 교체되지 않지만 `ng generate environments`는 이 구성을 자동으로 설정합니다.
특정 빌드 대상을 위해 파일 교체를 변경하거나 추가할 수 있으며, `angular.json` 구성을 직접 편집하여 할 수 있습니다.

<docs-code language="json">

  "configurations": {
    "development": {
      "fileReplacements": [
          {
            "replace": "src/environments/environment.ts",
            "with": "src/environments/environment.development.ts"
          }
        ],
        …

</docs-code>

이는 개발 구성을 `ng build --configuration development`로 빌드할 때 `src/environments/environment.ts` 파일이 대상별 파일인 `src/environments/environment.development.ts`로 교체됨을 의미합니다.

스테이징 환경을 추가하려면 `src/environments/environment.ts`의 복사본을 만들어 `src/environments/environment.staging.ts`라고 이름을 지정한 다음, `angular.json`에 `staging` 구성을 추가합니다:

<docs-code language="json">

  "configurations": {
    "development": { … },
    "production": { … },
    "staging": {
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.staging.ts"
        }
      ]
    }
  }

</docs-code>

이 대상 환경에 대해 더 많은 구성 옵션을 추가할 수 있습니다.
빌드에서 지원하는 모든 옵션은 빌드 대상 구성에서 덮어쓸 수 있습니다.

스테이징 구성으로 빌드하려면 다음 명령을 실행합니다:

<docs-code language="shell">

ng build --configuration staging

</docs-code>

기본적으로 `build` 대상은 `production` 및 `development` 구성을 포함하고, `ng serve`는 애플리케이션의 개발 빌드를 사용합니다.
`buildTarget` 옵션을 설정하면 `ng serve`가 대상 빌드 구성을 사용하도록 구성할 수도 있습니다:

<docs-code language="json">

  "serve": {
    "builder": "@angular-devkit/build-angular:dev-server",
    "options": { … },
    "configurations": {
      "development": {
        // `build` 대상의 `development` 구성을 사용합니다.
        "buildTarget": "my-app:build:development"
      },
      "production": {
        // `build` 대상의 `production` 구성을 사용합니다.
        "buildTarget": "my-app:build:production"
      }
    },
    "defaultConfiguration": "development"
  },

</docs-code>

`defaultConfiguration` 옵션은 기본적으로 사용되는 구성을 지정합니다.
`defaultConfiguration`이 설정되지 않으면 `options`는 수정 없이 직접 사용됩니다.