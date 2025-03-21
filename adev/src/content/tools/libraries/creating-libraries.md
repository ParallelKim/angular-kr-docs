# 라이브러리 만들기

이 페이지는 Angular 기능을 확장하기 위해 새 라이브러리를 생성하고 게시하는 방법에 대한 개념적 개요를 제공합니다.

여러 애플리케이션에서 동일한 문제를 해결해야 한다고 느끼거나(또는 다른 개발자와 솔루션을 공유하고 싶다면), 라이브러리의 후보가 될 수 있습니다.
간단한 예로는 사용자를 회사 웹사이트로 보내는 버튼이 있을 수 있으며, 이는 귀사에서 구축하는 모든 애플리케이션에 포함될 수 있습니다.

## 시작하기

다음 명령어를 사용하여 새로운 작업공간에 새 라이브러리 골격을 생성하려면 Angular CLI를 사용합니다.

<docs-code language="shell">

ng new my-workspace --no-create-application
cd my-workspace
ng generate library my-lib

</docs-code>

<docs-callout title="라이브러리 이름 지정">

공개 패키지 레지스트리(예: npm)에 나중에 배포하려면 라이브러리 이름을 선택할 때 매우 주의해야 합니다.
[라이브러리 게시하기](tools/libraries/creating-libraries#publishing-your-library)를 참조하십시오.

`ng-`로 접두사가 붙은 이름(예: `ng-library`)을 사용하지 않도록 하십시오.
`ng-` 접두사는 Angular 프레임워크와 그 라이브러리에서 사용되는 예약어입니다.
라이브러리가 Angular와 함께 사용하기에 적합하다는 것을 나타내기 위해 `ngx-` 접두사가 선호됩니다.
또한, 이는 레지스트리 소비자에게 다른 JavaScript 프레임워크의 라이브러리와 구별할 수 있는 훌륭한 표시입니다.

</docs-callout>

`ng generate` 명령은 작업 공간 내에 `projects/my-lib` 폴더를 생성합니다. 이 폴더에는 NgModule 내에 구성 요소와 서비스가 포함됩니다.

도움말: 라이브러리 프로젝트의 구조에 대한 자세한 내용은 [라이브러리 프로젝트 파일](reference/configs/file-structure#library-project-files) 섹션의 [프로젝트 파일 구조 가이드](reference/configs/file-structure)를 참조하십시오.

단일 작업 공간에서 여러 프로젝트를 사용하려면 모노레포 모델을 사용하십시오.
[다중 프로젝트 작업 공간 설정](reference/configs/file-structure#multiple-projects)을 참조하십시오.

새로운 라이브러리를 생성하면 작업 공간 구성 파일인 `angular.json`이 `library` 유형의 프로젝트로 업데이트됩니다.

<docs-code language="json">

"projects": {
  …
  "my-lib": {
    "root": "projects/my-lib",
    "sourceRoot": "projects/my-lib/src",
    "projectType": "library",
    "prefix": "lib",
    "architect": {
      "build": {
        "builder": "@angular-devkit/build-angular:ng-packagr",
        …

</docs-code>

CLI 명령으로 프로젝트를 빌드, 테스트 및 린트합니다.

<docs-code language="shell">

ng build my-lib --configuration development
ng test my-lib
ng lint my-lib

</docs-code>

프로젝트에 구성된 빌더가 애플리케이션 프로젝트의 기본 빌더와 다르다는 점을 주목하십시오.
이 빌더는 여러 가지 외에도 라이브러리가 항상 [AOT 컴파일러](tools/cli/aot-compiler)로 빌드되도록 보장합니다.

라이브러리 코드를 재사용 가능하게 만들려면 공개 API를 정의해야 합니다.
이 "사용자 레이어"는 라이브러리 소비자에게 어떤 기능이 제공되는지를 정의합니다.
라이브러리 사용자들은 단일 import 경로를 통해 NgModules, 서비스 제공자 및 일반 유틸리티 함수와 같은 공개 기능에 접근할 수 있어야 합니다.

라이브러리에 대한 공개 API는 라이브러리 폴더의 `public-api.ts` 파일에 유지됩니다.
이 파일에서 내보낸 모든 것은 라이브러리가 애플리케이션에 임포트되었을 때 공개됩니다.
서비스와 구성 요소를 노출하려면 NgModule을 사용하십시오.

귀하의 라이브러리는 설치 및 유지 관리를 위한 문서(일반적으로 README 파일)를 제공해야 합니다.

## 애플리케이션의 일부를 라이브러리로 리팩토링하기

해결책을 재사용 가능하게 만들기 위해 애플리케이션 특정 코드에 의존하지 않도록 조정해야 합니다.
여기 애플리케이션 기능을 라이브러리로 마이그레이션할 때 고려해야 할 사항이 있습니다.

* 구성 요소 및 파이프와 같은 선언은 상태가 없도록 설계되어야 하며, 즉 외부 변수에 의존하거나 이를 변경하지 않아야 합니다.
    상태에 의존하는 경우, 모든 사례를 평가하고 이것이 애플리케이션 상태인지 라이브러리가 관리할 상태인지 결정해야 합니다.

* 구성 요소가 내부적으로 구독하는 모든 observables는 해당 구성 요소의 생애 주기 동안 정리되고 처리되어야 합니다.
* 구성 요소는 입력을 통해 컨텍스트를 제공하고 출력으로 다른 구성 요소에 이벤트를 전달하여 상호작용을 노출해야 합니다.

* 모든 내부 의존성을 확인하십시오.
  * 구성 요소나 서비스에서 사용되는 사용자 정의 클래스 또는 인터페이스의 경우 추가 클래스나 인터페이스에 의존하는지 확인하십시오. 이들도 마이그레이션해야 합니다.
  * 유사하게, 라이브러리 코드가 서비스에 의존하는 경우 해당 서비스도 마이그레이션해야 합니다.
  * 라이브러리 코드나 템플릿이 다른 라이브러리(예: Angular Material)에 의존하는 경우, 해당 종속성으로 라이브러리를 구성해야 합니다.

* 클라이언트 애플리케이션에 서비스를 제공하는 방법을 고려하십시오.

  * 서비스는 NgModule이나 구성 요소에서 제공자를 선언하는 대신 자체 제공자를 선언해야 합니다.
        제공자를 선언하면 해당 서비스가 *트리 쉐이커블*이 됩니다.
        이 관행은 컴파일러가 라이브러리를 가져오는 애플리케이션에 주입되지 않는 경우 번들에서 해당 서비스를 제외할 수 있도록 합니다.
        이에 대한 자세한 내용은 [트리 쉐이커블 제공자](guide/di/lightweight-injection-tokens)를 참조하십시오.

  * 전역 서비스 제공자를 등록하거나 여러 NgModule 간에 제공자를 공유하는 경우, [RouterModule](api/router/RouterModule)에서 제공하는 [`forRoot()` 및 `forChild()` 디자인 패턴을] (guide/ngmodules/singleton-services) 사용하십시오.
  * 라이브러리가 모든 클라이언트 애플리케이션에서 사용되지 않을 수도 있는 선택적 서비스를 제공하는 경우, [경량 토큰 디자인 패턴](guide/di/lightweight-injection-tokens)을 사용하여 그 경우에 대한 적절한 트리 쉐이킹을 지원하십시오.

## 코드 생성 스키마를 사용하여 CLI와 통합하기

라이브러리는 일반적으로 구성 요소, 서비스 및 프로젝트에 가져오는 기타 Angular 유물(파이프, 지시문)을 정의하는 *재사용 가능한 코드*를 포함합니다.
라이브러리는 게시 및 공유를 위해 npm 패키지로 포장됩니다.
이 패키지에는 프로젝트 내에서 직접 코드를 생성하거나 변환하는 지침을 제공하는 스키마를 포함할 수 있습니다. 이는 CLI가 `ng generate component`로 일반적인 새 구성 요소를 생성하는 것과 동일합니다.
라이브러리와 함께 패키지된 스키마는 예를 들어 Angular CLI에 필요한 정보(특정 기능 또는 라이브러리에서 정의된 기능의 집합을 구성하고 사용하는 구성 요소 생성)를 제공할 수 있습니다.
이의 예로는 CDK의 [BreakpointObserver](https://material.angular.io/cdk/layout/overview#breakpointobserver)를 구성하고 Material의 [MatSideNav](https://material.angular.io/components/sidenav/overview) 및 [MatToolbar](https://material.angular.io/components/toolbar/overview) 구성 요소와 함께 사용하는 [Angular Material의 내비게이션 스키마틱](https://material.angular.io/guide/schematics#navigation-schematic)이 있습니다.

다음과 같은 종류의 스키마를 생성하고 포함하십시오:

* `ng add`가 프로젝트에 라이브러리를 추가할 수 있도록 설치 스키마를 포함하십시오.
* `ng generate`가 프로젝트에 정의된 아티팩트(구성 요소, 서비스, 테스트)를 생성할 수 있도록 라이브러리에 생성 스키마를 포함하십시오.
* `ng update`가 라이브러리의 종속성을 업데이트하고 새로운 릴리스의 중단 변경 사항에 대한 마이그레이션을 제공할 수 있도록 업데이트 스키마를 포함하십시오.

라이브러리에 포함할 내용은 귀하의 작업에 따라 달라집니다.
예를 들어, 애플리케이션에 추가하는 방법을 보여주기 위해 미리 데이터가 채워진 드롭다운을 생성하는 스키마를 정의할 수 있습니다.
각각 다른 전달 값을 포함하는 드롭다운이 필요할 경우, 라이브러리는 주어진 구성으로 생성하는 스키마를 정의할 수 있습니다.
그 후 개발자는 자신의 애플리케이션 인스턴스를 구성하기 위해 `ng generate`를 사용할 수 있습니다.

구성 파일을 읽은 다음 해당 구성에 따라 양식을 생성하려고 한다고 가정합니다.
그 양식이 라이브러리를 사용하는 개발자에 의해 추가적인 사용자 정의가 필요하다면, 스키마로 만드는 것이 가장 좋습니다.
그러나 양식이 항상 동일하고 개발자가 많은 사용자 정의를 필요로 하지 않는다면, 구성과 함께 양식을 생성하는 동적 구성 요소를 만들 수 있습니다.
일반적으로 사용자 정의가 복잡할수록 스키마 접근 방식이 더 유용합니다.

자세한 내용은 [스키마틱 개요](tools/cli/schematics) 및 [라이브러리를 위한 스키마틱](tools/cli/schematics-for-libraries)을 참조하십시오.

## 라이브러리 게시하기

Angular CLI와 npm 패키지 관리자를 사용하여 라이브러리를 npm 패키지로 빌드하고 게시합니다.

Angular CLI는 npm에 게시할 수 있는 컴파일된 코드에서 패키지를 생성하는 도구인 [ng-packagr](https://github.com/ng-packagr/ng-packagr/blob/master/README.md)를 사용합니다.
`ng-packagr`가 지원하는 배포 형식에 대한 정보와 라이브러리에 적합한 형식 선택 방법에 대한 안내는 [아이비를 사용하여 라이브러리 빌드하기](tools/libraries/creating-libraries#publishing-libraries)를 참조하십시오.

라이브러리를 배포할 때는 항상 `production` 구성을 사용하여 빌드해야 합니다.
이렇게 하면 생성된 출력이 적절한 최적화 및 npm에 대한 올바른 패키지 형식을 사용하도록 보장됩니다.

<docs-code language="shell">

ng build my-lib
cd dist/my-lib
npm publish

</docs-code>

## 라이브러리에서 자산 관리하기

Angular 라이브러리에서는 배포 가능한 파일에 테마 파일, Sass 믹스인 또는 문서(예: 변경 로그)와 같은 추가 자산을 포함할 수 있습니다.
자세한 내용은 [빌드의 일부로 자산 복사하기](https://github.com/ng-packagr/ng-packagr/blob/master/docs/copy-assets.md) 및 [구성 요소 스타일에 자산 삽입하기](https://github.com/ng-packagr/ng-packagr/blob/master/docs/embed-assets-css.md)를 참조하십시오.

중요: Sass 믹스인 또는 미리 컴파일된 CSS와 같은 추가 자산을 포함할 때
이들을 `package.json`의 기본 진입점의 조건부 ["exports"](tools/libraries/angular-package-format#quotexportsquot)에 수동으로 추가해야 합니다.

`ng-packagr`는 수동으로 작성한 `"exports"`와 자동으로 생성된 `"exports"`를 병합하여 라이브러리 작성자가 추가적인 내보내기 하위 경로 또는 사용자 지정 조건을 구성할 수 있도록 합니다.

<docs-code language="json">

"exports": {
  ".": {
    "sass": "./_index.scss",
  },
  "./theming": {
    "sass": "./_theming.scss"
  },
  "./prebuilt-themes/indigo-pink.css": {
    "style": "./prebuilt-themes/indigo-pink.css"
  }
}

</docs-code>

위 내용은 [@angular/material](https://unpkg.com/browse/@angular/material/package.json) 배포물에서 발췌한 것입니다.

## 피어 종속성

Angular 라이브러리는 라이브러리가 의존하는 모든 `@angular/*` 의존성을 피어 종속성으로 나열해야 합니다.
이는 모듈이 Angular를 요청할 때 모두 정확히 동일한 모듈을 받도록 보장합니다.
라이브러리가 `dependencies`에서 `@angular/core`를 나열하면 `peerDependencies` 대신 다른 Angular 모듈이 수신될 수 있으며, 이로 인해 애플리케이션이 실패할 수 있습니다.

## 애플리케이션에서 나만의 라이브러리 사용하기

같은 작업공간에서 사용하는 경우에 라이브러리를 npm 패키지 관리자로 게시할 필요는 없지만, 먼저 빌드해야 합니다.

자신의 라이브러리를 애플리케이션에서 사용하려면:

* 라이브러리를 빌드합니다.
    라이브러리는 빌드되기 전에는 사용할 수 없습니다.

    <docs-code language="shell">

    ng build my-lib

    </docs-code>

* 애플리케이션에서 이름으로 라이브러리에서 가져옵니다:

    <docs-code language="typescript">

    import { myExport } from 'my-lib';

    </docs-code>

### 라이브러리 빌드 및 재빌드하기

빌드 단계는 라이브러리를 npm 패키지로 게시하지 않고, 그러고 나서 npm에서 애플리케이션으로 패키지를 다시 설치한 경우 중요합니다.
예를 들어, git 리포지토리를 클론하고 `npm install`을 실행하면, 라이브러리를 아직 빌드하지 않았다면 편집기에서 `my-lib` 임포트를 찾지 못하게 표시됩니다.

도움말: Angular 애플리케이션에서 라이브러리에서 무언가를 가져오면 Angular는 라이브러리 이름과 디스크의 위치 간의 매핑을 찾습니다.
라이브러리 패키지를 설치하면 매핑이 `node_modules` 폴더에 있습니다.
자신의 라이브러리를 빌드하면 `tsconfig` 경로에서 매핑을 찾아야 합니다.

Angular CLI로 라이브러리를 생성하면 자동으로 그 경로가 `tsconfig` 파일에 추가됩니다.
Angular CLI는 빌드 시스템에 라이브러리를 찾기 위해 `tsconfig` 경로를 사용합니다.

자세한 내용은 [경로 매핑 개요](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)를 참조하십시오.

라이브러리에 대한 변경 사항이 애플리케이션에 반영되지 않는 것을 발견하면, 애플리케이션은 아마도 라이브러리의 오래된 빌드를 사용하고 있을 것입니다.

라이브러리에 변경할 때마다 재빌드할 수 있지만, 이 추가 단계는 시간이 걸립니다.
*증분 빌드* 기능은 라이브러리 개발 경험을 향상시킵니다.
파일이 변경될 때마다 부분 빌드가 수행되어 수정된 파일을 생성합니다.

증분 빌드는 개발 환경에서 백그라운드 프로세스로 실행될 수 있습니다.
이 기능을 활용하려면 빌드 명령에 `--watch` 플래그를 추가하십시오:

<docs-code language="shell">

ng build my-lib --watch

</docs-code>

중요: CLI `build` 명령은 애플리케이션보다 라이브러리에 대해 다른 빌더를 사용하고 다른 빌드 도구를 호출합니다.

* 애플리케이션 빌드 시스템인 `@angular-devkit/build-angular`는 `webpack`을 기반으로 하며, 모든 새로운 Angular CLI 프로젝트에 포함되어 있습니다.
* 라이브러리를 위한 빌드 시스템은 `ng-packagr`을 기반으로 합니다.
    라이브러리를 `ng generate library my-lib`를 사용하여 추가할 때만 종속성에 추가됩니다.

두 빌드 시스템은 서로 다른 사항을 지원하며, 동일한 사항을 지원하는 경우에도 그 방식이 다릅니다.
이는 TypeScript 소스가 빌드된 라이브러리에서 있는 JavaScript 코드와 빌드된 애플리케이션에서 생성된 JavaScript 코드가 다를 수 있음을 의미합니다.

그렇기 때문에 라이브러리에 의존하는 애플리케이션은 *빌드된 라이브러리*를 가리키는 TypeScript 경로 매핑을 사용해야 합니다.
TypeScript 경로 매핑은 라이브러리 소스 `.ts` 파일을 가리키지 않아야 합니다.

## 라이브러리 게시하기

라이브러리를 게시할 때 사용할 수 있는 두 가지 배포 형식이 있습니다:

| 배포 형식                | 상세 내용 |
|:---                       |:---       |
| 부분-아이비(권장)       | 모든 버전의 Angular v12 이상으로 빌드된 아이비 애플리케이션에서 소비할 수 있는 휴대 가능한 코드를 포함합니다. |
| 전체-아이비              | 서로 다른 Angular 버전에서 작동하지 않도록 보장되지 않는 비공식 Angular 아이비 지침을 포함합니다. 이 형식은 라이브러리와 애플리케이션이 *정확히* 동일한 Angular 버전으로 빌드되어야 합니다. 이 형식은 모든 라이브러리와 애플리케이션 코드가 소스에서 직접 빌드되는 환경에서 유용합니다. |

npm에 게시할 때는 Angular의 패치 버전 간에 안정적이기 때문에 부분-아이비 형식을 사용하십시오.

npm에 게시할 경우 전체-아이비 코드를 컴파일하는 것은 피하십시오. 생성된 아이비 지침은 Angular의 공개 API에 포함되지 않으므로 패치 버전 간에 변경될 수 있습니다.

## 라이브러리 버전 호환성 보장하기

애플리케이션을 빌드하는 데 사용되는 Angular 버전은 항상 해당 라이브러리가 사용하는 Angular 버전과 같거나 커야 합니다.
예를 들어 Angular 버전 13을 사용하는 라이브러리가 있다면 해당 라이브러리에 의존하는 애플리케이션은 Angular 버전 13 이상을 사용해야 합니다.
Angular는 애플리케이션에 대해 이전 버전을 사용하는 것을 지원하지 않습니다.

npm에 라이브러리를 게시하려는 경우 `tsconfig.prod.json`에서 `"compilationMode": "partial"`로 설정하여 부분-아이비 코드로 컴파일하십시오.
이 부분 형식은 Angular의 다양한 버전 간에 안정적이므로 npm에 게시하는 것이 안전합니다.
이 형식의 코드는 Angular 컴파일러의 동일한 버전을 사용하여 애플리케이션 빌드 중에 처리되어 애플리케이션과 모든 라이브러리가 단일 버전의 Angular를 사용합니다.

npm에 게시할 경우 전체-아이비 코드를 컴파일하는 것을 피하십시오. 생성된 아이비 지침은 Angular의 공개 API에 포함되지 않으므로 패치 버전 간에 변경될 수 있습니다.

npm에서 패키지를 게시한 적이 없다면 사용자 계정을 생성해야 합니다.
자세한 내용은 [npm 패키지 게시하기](https://docs.npmjs.com/getting-started/publishing-npm-packages)를 참조하십시오.

## Angular CLI 외부에서 부분-아이비 코드 사용하기

애플리케이션은 `node_modules` 디렉토리에 npm으로부터 다수의 Angular 라이브러리를 설치합니다.
그러나 이러한 라이브러리의 코드는 전체 컴파일되지 않았기 때문에 빌드된 애플리케이션과 직접 번들화될 수 없습니다.
컴파일을 마치려면 Angular 링커를 사용하십시오.

Angular CLI를 사용하지 않는 애플리케이션의 경우 링커는 [바벨](https://babeljs.io) 플러그인으로 사용할 수 있습니다.
플러그인은 `@angular/compiler-cli/linker/babel`에서 가져와야 합니다.

Angular 링커 바벨 플러그인은 빌드 캐싱을 지원하므로, 라이브러리는 추가 npm 작업에 관계없이 링커에서 단 한번만 처리하면 됩니다.

플러그인을 사용자 지정 [webpack](https://webpack.js.org) 빌드에 등록하여 통합하는 예입니다. 바벨 플러그인으로 링커를 사용합니다 [바벨 로더](https://webpack.js.org/loaders/babel-loader/#options).

<docs-code header="webpack.config.mjs" path="adev/src/content/examples/angular-linker-plugin/webpack.config.mjs" visibleRegion="webpack-config"/>

도움말: Angular CLI는 링커 플러그인을 자동으로 통합하므로 라이브러리 소비자가 CLI를 사용하는 경우 추가 구성 없이 npm에서 아이비 네이티브 라이브러리를 설치할 수 있습니다.