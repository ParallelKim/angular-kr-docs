# 앵귤러 앱 빌드하기

`ng build` 명령어를 사용하여 앵귤러 CLI 애플리케이션 또는 라이브러리를 빌드할 수 있습니다. 이렇게 하면 TypeScript 코드를 JavaScript로 컴파일하고, 출력 결과를 최적화하고, 번들링하고, 필요에 따라 축소합니다.

`ng build`는 `angular.json`에 지정된 기본 프로젝트의 `build` 대상에 대한 빌더만 실행합니다. 앵귤러 CLI에는 일반적으로 `build` 대상으로 사용되는 네 가지 빌더가 포함되어 있습니다:

| 빌더                                           | 목적                                                                                                                                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@angular-devkit/build-angular:application`     | 클라이언트 측 번들과 Node 서버, [esbuild](https://esbuild.github.io/)로 빌드 시 미리 렌더링된 경로를 포함하여 애플리케이션을 빌드합니다.                                     |
| `@angular-devkit/build-angular:browser-esbuild` | [esbuild](https://esbuild.github.io/)를 사용하여 브라우저에서 사용할 클라이언트 측 애플리케이션을 번들링합니다. 추가 정보는 [`browser-esbuild` 문서](tools/cli/build-system-migration#manual-migration-to-the-compatibility-builder)를 참조하십시오. |
| `@angular-devkit/build-angular:browser`         | [webpack](https://webpack.js.org/)를 사용하여 브라우저에서 사용할 클라이언트 측 애플리케이션을 번들링합니다.                                                                                   |
| `@angular-devkit/build-angular:ng-packagr`      | [Angular 패키지 포맷](tools/libraries/angular-package-format)을 준수하는 앵귤러 라이브러리를 빌드합니다.                                                                           |

`ng new`로 생성된 애플리케이션은 기본적으로 `@angular-devkit/build-angular:application`을 사용합니다. `ng generate library`로 생성된 라이브러리는 기본적으로 `@angular-devkit/build-angular:ng-packagr`을 사용합니다.

특정 프로젝트에 사용되는 빌더를 확인하려면 해당 프로젝트의 `build` 대상을 조회하면 됩니다.

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        // `ng build`는 `build`라는 이름의 Architect 대상을 호출합니다.
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          …
        },
        "serve": { … }
        "test": { … }
        …
      }
    }
  }
}

</docs-code>

이 페이지는 `@angular-devkit/build-angular:application`의 사용법과 옵션에 대해 설명합니다.

## 출력 디렉토리

이 빌드 프로세스의 결과는 디렉토리(`dist/${PROJECT_NAME}`가 기본값)로 출력됩니다.

## 크기 예산 구성

애플리케이션이 기능적으로 성장함에 따라 크기도 함께 증가합니다. CLI를 사용하면 구성에서 크기 임계값을 설정하여 애플리케이션의 일부가 정의한 크기 경계 내에 유지되도록 할 수 있습니다.

크기 경계를 CLI 구성 파일인 `angular.json`의 `budgets` 섹션에 정의합니다. 이는 각 [구성된 환경](tools/cli/environments)마다 가능합니다.

<docs-code language="json">

{
  …
  "configurations": {
    "production": {
      …
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "250kb",
          "maximumError": "500kb"
        },
      ]
    }
  }
}

</docs-code>

전체 앱 및 특정 부분에 대한 크기 예산을 지정할 수 있습니다. 각 예산 항목은 특정 유형의 예산을 구성합니다. 다음 형식으로 크기 값을 지정합니다:

| 크기 값        | 세부정보                                                                     |
| :------------- | :-------------------------------------------------------------------------- |
| `123` 또는 `123b` | 바이트 단위의 크기입니다.                                                              |
| `123kb`         | 킬로바이트 단위의 크기입니다.                                                          |
| `123mb`         | 메가바이트 단위의 크기입니다.                                                          |
| `12%`           | 기준선에 대한 크기의 백분율입니다. \(기준선 값에는 유효하지 않습니다.\) |

예산을 구성하면 설정한 경계 크기에 도달하거나 초과할 때, 빌더는 경고를 하거나 오류를 보고합니다.

각 예산 항목은 다음 속성이 있는 JSON 객체입니다:

| 속성          | 값                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type          | 예산의 유형. 다음 중 하나: <table> <thead> <tr> <th> 값 </th> <th> 세부정보 </th> </tr> </thead> <tbody> <tr> <td> <code>bundle</code> </td> <td> 특정 번들의 크기. </td> </tr> <tr> <td> <code>initial</code> </td> <td> 애플리케이션 부트스트랩에 필요한 JavaScript 및 CSS의 크기. 기본적으로 500kb에서 경고하고 1mb에서 오류를 발생시킵니다. </td> </tr> <tr> <td> <code>allScript</code> </td> <td> 모든 스크립트의 크기. </td> </tr> <tr> <td> <code>all</code> </td> <td> 전체 애플리케이션의 크기. </td> </tr> <tr> <td> <code>anyComponentStyle</code> </td> <td> 어떤 구성 요소 스타일시트의 크기. 기본적으로 2kb에서 경고하고 4kb에서 오류를 발생시킵니다. </td> </tr> <tr> <td> <code>anyScript</code> </td> <td> 어떤 하나의 스크립트의 크기. </td> </tr> <tr> <td> <code>any</code> </td> <td> 어떤 파일의 크기. </td> </tr> </tbody> </table> |
| name          | 번들의 이름 (type=bundle에 대해).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| baseline      | 비교를 위한 기준 크기.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| maximumWarning| 기준선에 대해 경고의 최대 임계값.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| maximumError  | 기준선에 대해 오류의 최대 임계값.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| minimumWarning| 기준선에 대해 경고의 최소 임계값.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| minimumError  | 기준선에 대해 오류의 최소 임계값.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| warning       | 기준선에 대한 경고의 임계값 (최소 및 최대).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| error         | 기준선에 대한 오류의 임계값 (최소 및 최대).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## CommonJS 의존성 구성

애플리케이션과 그 의존성 전체에서 항상 네이티브 [ECMAScript 모듈](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/import) (ESM)을 추구하십시오. ESM은 완전한 명세의 웹 표준 및 강력한 정적 분석 지원을 갖춘 JavaScript 언어 기능입니다. 이 때문에 번들 최적화가 다른 모듈 형식보다 더 강력해집니다.

앵귤러 CLI는 또한 프로젝트에 [CommonJS](https://nodejs.org/api/modules.html) 의존성을 가져오고 이러한 의존성을 자동으로 번들링하는 것을 지원합니다. 그러나 CommonJS 모듈은 번들러와 축소기가 이러한 모듈을 효과적으로 최적화하는 것을 방해하여 더 큰 번들 크기를 초래할 수 있습니다. 추가 정보는 [CommonJS가 번들을 더 크게 만드는 방법](https://web.dev/commonjs-larger-bundles)을 참조하십시오.

앵귤러 CLI는 애플리케이션이 CommonJS 모듈에 의존하고 있음을 감지하면 경고를 출력합니다. CommonJS 의존성이 발생하면 유지관리자에게 ECMAScript 모듈을 지원하도록 요청하거나 지원을 직접 추가하거나 필요를 충족하는 대체 의존성을 사용해보십시오. 최선의 선택이 CommonJS 의존성을 사용하는 경우 `angular.json`의 `build` 옵션에 있는 `allowedCommonJsDependencies` 옵션에 CommonJS 모듈 이름을 추가하여 이러한 경고를 비활성화할 수 있습니다.

<docs-code language="json">

"build": {
  "builder": "@angular-devkit/build-angular:browser",
  "options": {
     "allowedCommonJsDependencies": [
        "lodash"
     ]
     …
   }
   …
},

</docs-code>

## 브라우저 호환성 구성

앵귤러 CLI는 [Browserslist](https://github.com/browserslist/browserslist)를 사용하여 다양한 브라우저 버전과의 호환성을 보장합니다. 지원되는 브라우저에 따라 앵귤러는 특정 JavaScript 및 CSS 기능을 자동으로 변환하여 빌드된 애플리케이션이 지원되는 브라우저에 의해 구현되지 않은 기능을 사용하지 않도록 합니다. 그러나 앵귤러 CLI는 누락된 웹 API를 보완하기 위해 자동으로 폴리Fill을 추가하지 않습니다. `angular.json`에서 `polyfills` 옵션을 사용하여 폴리Fill을 추가하십시오.

내부적으로 앵귤러 CLI는 앵귤러에 의해 [지원되는 브라우저](reference/versions#browser-support)와 일치하는 기본 `browserslist` 구성을 사용합니다.

<docs-code language="text">

last 2 Chrome versions
last 1 Firefox version
last 2 Edge major versions
last 2 Safari major versions
last 2 iOS major versions
last 2 Android major versions
Firefox ESR

</docs-code>

내부 구성을 덮어쓰려면 [`ng generate config browserslist`](cli/generate/config)를 실행하여 프로젝트 디렉토리에 `.browserslistrc` 구성 파일을 생성합니다.

특정 브라우저 및 버전을 대상으로 하는 방법에 대한 더 많은 예제를 보려면 [browserslist 리포지토리](https://github.com/browserslist/browserslist)를 참조하십시오. 이 목록을 더 많은 브라우저로 확장하는 것을 피하십시오. 애플리케이션 코드가 더 넓게 호환 가능하더라도 앵귤러 자체는 그럴 수도 있습니다. 이 목록에서 브라우저 또는 버전 집합을 _줄이는_ 것이 좋습니다.

도움됨: [browsersl.ist](https://browsersl.ist)를 사용하여 `browserslist` 쿼리에 대해 호환 가능한 브라우저를 표시할 수 있습니다.

## Tailwind 구성

앵귤러는 유틸리티 우선 CSS 프레임워크인 [Tailwind](https://tailwindcss.com/)를 지원합니다.

앵귤러 CLI와 통합하려면 [Tailwind 문서](https://tailwindcss.com/docs/installation/framework-guides/angular)를 따르십시오.