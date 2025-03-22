# npm에 게시된 Angular 라이브러리 사용법

Angular 애플리케이션을 빌드할 때 정교한 첫 번째 라이브러리와 풍부한 생태계의 타사 라이브러리를 활용하세요.
[Angular Material][AngularMaterialMain]은 정교한 첫 번째 라이브러리의 예입니다.

## 라이브러리 설치

라이브러리는 [npm 패키지][GuideNpmPackages]로 게시되며, 일반적으로 Angular CLI와 통합하는 스키마와 함께 제공됩니다.
재사용 가능한 라이브러리 코드를 애플리케이션에 통합하려면 패키지를 설치하고 사용하려는 위치에서 제공된 기능을 가져와야 합니다.
게시된 대부분의 Angular 라이브러리에 대해 `ng add <lib_name>` Angular CLI 명령을 사용하세요.

`ng add` Angular CLI 명령은 패키지 관리자를 사용하여 라이브러리 패키지를 설치하고, 프로젝트 코드 내의 다른 스캐폴딩을 위해 패키지에 포함된 스키마를 호출합니다.
패키지 관리자에는 [npm][NpmjsMain] 또는 [yarn][YarnpkgMain]이 포함됩니다.
프로젝트 코드 내의 추가 스캐폴딩에는 가져오기 문, 글꼴 및 테마가 포함됩니다.

게시된 라이브러리는 일반적으로 해당 라이브러리를 애플리케이션에 추가하는 방법에 대한 `README` 파일 또는 기타 문서를 제공합니다.
예를 보려면 [Angular Material][AngularMaterialMain] 문서를 참조하세요.

### 라이브러리 타입 정의

일반적으로 라이브러리 패키지는 `.d.ts` 파일에 타입 정의를 포함합니다; 예시는 `node_modules/@angular/material`에서 확인할 수 있습니다.
라이브러리 패키지에 타입 정의가 포함되어 있지 않고 IDE에서 불만이 제기되는 경우, 라이브러리와 함께 `@types/<lib_name>` 패키지를 설치해야 할 수 있습니다.

예를 들어, `d3`라는 이름의 라이브러리가 있다고 가정해 보겠습니다:

<docs-code language="shell">

npm install d3 --save
npm install @types/d3 --save-dev

</docs-code>

워크스페이스에 설치된 라이브러리에 대한 `@types/` 패키지에 정의된 타입은 자동으로 해당 라이브러리를 사용하는 프로젝트의 TypeScript 구성에 추가됩니다.
TypeScript는 기본적으로 `node_modules/@types` 디렉터리에서 타입을 찾기 때문에 각 타입 패키지를 개별적으로 추가할 필요가 없습니다.

라이브러리에 대한 `@types/`에서 사용할 수 있는 타입 정의가 없는 경우, 수동으로 타입 정의를 추가하여 사용할 수 있습니다.
이렇게 하려면:

1. `src/` 디렉터리에 `typings.d.ts` 파일을 만듭니다.
    이 파일은 자동으로 전역 타입 정의로 포함됩니다.

1. `src/typings.d.ts`에 다음 코드를 추가합니다:

    <docs-code language="typescript">

    declare module 'host' {
      export interface Host {
        protocol?: string;
        hostname?: string;
        pathname?: string;
      }
      export function parse(url: string, queryString?: string): Host;
    }

    </docs-code>

1. 라이브러리를 사용하는 구성 요소 또는 파일에서 다음 코드를 추가합니다:

    <docs-code language="typescript">

    import * as host from 'host';
    const parsedUrl = host.parse('<https://angular.io>');
    console.log(parsedUrl.hostname);

    </docs-code>

필요에 따라 더 많은 타입 정의를 추가합니다.

## 라이브러리 업데이트

라이브러리는 게시자에 의해 업데이트될 수 있으며, 또한 최신 상태로 유지해야 하는 개별 종속성이 있습니다.
설치된 라이브러리에 대한 업데이트를 확인하려면 [`ng update`][CliUpdate] Angular CLI 명령을 사용하세요.

개별 라이브러리 버전을 업데이트하려면 `ng update <lib_name>` Angular CLI 명령을 사용하세요.
Angular CLI는 라이브러리의 최신 게시 릴리스를 검사하고, 최신 버전이 설치된 버전보다 새로우면 해당 버전을 다운로드하고 `package.json`을 최신 버전으로 업데이트합니다.

Angular를 새 버전으로 업데이트할 때 사용 중인 라이브러리가 최신 상태인지 확인해야 합니다.
라이브러리에 상호 의존성이 있는 경우, 특정 순서로 업데이트해야 할 수 있습니다.
도움이 필요하면 [Angular 업데이트 가이드][AngularUpdateMain]를 참조하세요.

## 라이브러리를 런타임 전역 범위에 추가하기

레거시 JavaScript 라이브러리가 애플리케이션에 가져오지 않았다면, 이를 런타임 전역 범위에 추가하고 스크립트 태그와 같이 로드할 수 있습니다.
`angular.json`[GuideWorkspaceConfig] 작업 공간 빌드 구성 파일의 빌드 대상의 `scripts` 및 `styles` 옵션을 사용하여 Angular CLI를 구성합니다.

예를 들어, [Bootstrap 4][GetbootstrapDocs40GettingStartedIntroduction] 라이브러리를 사용하려면

1. npm 패키지 관리자를 사용하여 라이브러리와 관련 종속성을 설치합니다:

    <docs-code language="shell">

    npm install jquery --save
    npm install popper.js --save
    npm install bootstrap --save

    </docs-code>

1. `angular.json` 구성 파일에서 관련 스크립트 파일을 `scripts` 배열에 추가합니다:

    <docs-code language="json">

    "scripts": [
      "node_modules/jquery/dist/jquery.slim.js",
      "node_modules/popper.js/dist/umd/popper.js",
      "node_modules/bootstrap/dist/js/bootstrap.js"
    ],

    </docs-code>

1. `styles` 배열에 `bootstrap.css` CSS 파일을 추가합니다:

    <docs-code language="css">

    "styles": [
      "node_modules/bootstrap/dist/css/bootstrap.css",
      "src/styles.css"
    ],

    </docs-code>

1. `ng serve` Angular CLI 명령을 실행하거나 재시작하여 Bootstrap 4가 애플리케이션에서 작동하는지 확인합니다.

### 애플리케이션 내에서 런타임 전역 라이브러리 사용하기

"scripts" 배열을 사용하여 라이브러리를 가져온 후, TypeScript 코드에서 가져오기 문을 사용하여 그 라이브러리를 **가져오지 마세요**.
다음 코드 조각은 가져오기 문 예시입니다.

<docs-code language="typescript">

import * as $ from 'jquery';

</docs-code>

가져오기 문을 사용하여 가져오면, 라이브러리에 두 개의 다른 복사본이 생깁니다: 하나는 전역 라이브러리로 가져온 것이고, 다른 하나는 모듈로 가져온 것입니다.
이것은 특히 JQuery와 같은 플러그인을 가진 라이브러리에서 나쁜데, 각 복사본에는 다른 플러그인이 포함되기 때문입니다.

대신, `npm install @types/jquery` Angular CLI 명령을 실행하여 라이브러리에 대한 타입을 다운로드한 다음 라이브러리 설치 단계를 따르세요.
이렇게 하면 해당 라이브러리에 의해 노출된 전역 변수에 접근할 수 있습니다.

### 런타임 전역 라이브러리에 대한 타입 정의

사용해야 하는 전역 라이브러리에 전역 타입 정의가 없는 경우, `src/typings.d.ts`에서 수동으로 `any`로 선언할 수 있습니다.

예를 들어:

<docs-code language="typescript">

declare var libraryName: any;

</docs-code>

일부 스크립트는 다른 라이브러리를 확장합니다; 예를 들면 JQuery 플러그인과 같은 경우:

<docs-code language="typescript">

$('.test').myPlugin();

</docs-code>

이 경우, 설치된 `@types/jquery`는 `myPlugin`을 포함하지 않으므로, `src/typings.d.ts`에서 인터페이스를 추가해야 합니다.
예를 들면:

<docs-code language="typescript">

interface JQuery {
  myPlugin(options?: any): any;
}

</docs-code>

스크립트 정의 확장에 대한 인터페이스를 추가하지 않으면, IDE에서 오류를 표시합니다:

<docs-code language="text">

[TS][Error] Property 'myPlugin' does not exist on type 'JQuery'

</docs-code>

[CliUpdate]: cli/update "ng update | CLI |Angular"

[GuideNpmPackages]: reference/configs/npm-packages "Workspace npm dependencies | Angular"

[GuideWorkspaceConfig]: reference/configs/workspace-config "Angular workspace configuration | Angular"


[AngularMaterialMain]: https://material.angular.io "Angular Material | Angular"

[AngularUpdateMain]: https://angular-kr-docs.web.app/update-guide "Angular Update Guide | Angular"

[GetbootstrapDocs40GettingStartedIntroduction]: https://getbootstrap.com/docs/4.0/getting-started/introduction "Introduction | Bootstrap"

[NpmjsMain]: https://www.npmjs.com "npm"

[YarnpkgMain]: https://yarnpkg.com " Yarn"
