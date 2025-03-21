# Angular 애플리케이션 빌드 시스템

v17 이상에서는 새로운 빌드 시스템이 Angular 애플리케이션을 빌드하는 개선된 방법을 제공합니다. 이 새로운 빌드 시스템에는 다음이 포함됩니다:

- 동적 import 표현식을 사용한 ESM을 사용하는 현대적인 출력 형식으로, 지연 모듈 로딩을 지원합니다.
- 초기 빌드 및 증분 재빌드 모두에 대해 더 빠른 빌드 시간 성능을 제공합니다.
- [esbuild](https://esbuild.github.io/) 및 [Vite](https://vitejs.dev/)와 같은 최신 JavaScript 생태계 도구를 포함합니다.
- 통합된 SSR 및 사전 렌더링 기능을 제공합니다.
- 자동 글로벌 및 컴포넌트 스타일시트 핫 교체를 지원합니다.

이 새로운 빌드 시스템은 안정적이며 Angular 애플리케이션에서 사용할 수 있도록 완전히 지원됩니다. `browser` 빌더를 사용하는 애플리케이션에서 새로운 빌드 시스템으로 마이그레이션할 수 있습니다. 사용자 정의 빌더를 사용하는 경우, 가능한 마이그레이션 옵션에 대한 해당 빌더의 문서를 참조하십시오.

중요: 기존 webpack 기반 빌드 시스템은 여전히 안정적이고 완전히 지원된다고 간주됩니다. 애플리케이션은 계속해서 `browser` 빌더를 사용할 수 있으며 프로젝트는 업데이트 중에 마이그레이션을 선택하지 않을 수 있습니다.

## 새로운 애플리케이션의 경우

새로운 애플리케이션은 기본적으로 `application` 빌더를 통해 이 새로운 빌드 시스템을 사용합니다.

## 기존 애플리케이션의 경우

프로젝트의 요구 사항에 따라 자동화된 절차와 수동 절차가 모두 사용할 수 있습니다. v18부터는 업데이트 과정에서 기존 애플리케이션을 새 빌드 시스템으로 마이그레이션할 것인지 질문할 것입니다. 마이그레이션 전에 [알려진 문제](#known-issues) 섹션을 검토하는 것이 좋습니다. 이 섹션에는 프로젝트에 대한 관련 정보가 포함될 수 있습니다.

도움말: SSR을 사용하는 경우 애플리케이션 서버 코드에서 `require`, `__filename`, `__dirname` 또는 [CommonJS 모듈 범위](https://nodejs.org/api/modules.html#the-module-scope)에서 유래된 기타 구성 요소와 같은 모든 CommonJS 가정을 제거하는 것을 기억하세요. 모든 애플리케이션 코드는 ESM 호환 가능해야 합니다. 이는 서드파티 종속성에는 적용되지 않습니다.

### 자동 마이그레이션 (권장)

자동 마이그레이션은 이전의 webpack 특정 기능 사용을 제거하기 위해 `angular.json` 내의 애플리케이션 구성 및 코드와 스타일시트를 조정합니다. 많은 변경 사항을 자동화할 수 있으며 대부분의 애플리케이션은 추가 변경이 필요하지 않지만 각 애플리케이션은 고유하므로 몇 가지 수동 변경이 필요할 수 있습니다. 마이그레이션 후에는 애플리케이션을 빌드해 보십시오. 코드 내에서 조정이 필요한 새로운 오류가 발생할 수 있습니다. 오류는 가능한 경우 문제에 대한 해결책을 제공하려고 시도하며 이 가이드의 후속 섹션에서는 여러분이 만날 수 있는 더 일반적인 상황을 설명합니다. `ng update`를 통해 Angular v18로 업데이트할 때 마이그레이션을 실행하라는 요청을 받게 됩니다. v18에 대한 이 마이그레이션은 완전히 선택 사항이며 업데이트 후 언제든지 다음 명령으로 수동으로 실행할 수 있습니다:

<docs-code language="shell">

ng update @angular/cli --name use-application-builder

</docs-code>

마이그레이션은 다음을 수행합니다:

* 기존의 `browser` 또는 `browser-esbuild` 대상을 `application`으로 변환합니다.
* 이전 SSR 빌더를 제거합니다 (이제 `application`이 이를 수행합니다).
* 구성에 따라 업데이트합니다.
* `tsconfig.server.json`을 `tsconfig.app.json`과 병합하고 TypeScript 옵션 `"esModuleInterop": true`를 추가하여 `express` 가져오기가 [ESM 준수](#esm-default-imports-vs-namespace-imports)를 보장합니다.
* 애플리케이션 서버 코드를 새로운 부트스트랩 및 출력 디렉터리 구조를 사용하도록 업데이트합니다.
* `@import`/`url()`에서 물결 또는 캐릿과 같은 webpack 특정 빌더 스타일시트 사용을 제거하고 엇비슷한 동작을 제공하기 위해 구성을 업데이트합니다.
* 다른 `@angular-devkit/build-angular` 사용이 발견되지 않으면 새로운 낮은 의존성의 `@angular/build` Node.js 패키지를 사용하도록 변환합니다.

### 수동 마이그레이션

기존 프로젝트의 경우, 두 가지 다른 옵션으로 애플리케이션 단위로 새로운 빌더를 수동으로 선택할 수 있습니다. 두 가지 옵션 모두 Angular 팀에서 안정적이고 완전히 지원됩니다. 어떤 옵션을 사용할지는 마이그레이션에 얼마나 많은 변경을 해야 하는지와 프로젝트에서 사용하고 싶은 새로운 기능에 따라 다릅니다.

- `browser-esbuild` 빌더는 기존 `browser` 빌더와 호환되도록 설계된 애플리케이션의 클라이언트 측 번들만 빌드합니다. 이 빌더는 동등한 빌드 옵션을 제공하며, 많은 경우 기존 `browser` 애플리케이션에 대한 드롭인 교체 역할을 합니다.
- `application` 빌더는 클라이언트 측 번들뿐만 아니라 서버 측 렌더링을 위한 서버를 선택적으로 빌드하고 정적 페이지의 빌드 시간 사전 렌더링을 수행하는 등 전체 애플리케이션을 포함합니다.

`application` 빌더가 일반적으로 권장됩니다. 이는 서버 측 렌더링(SSR) 빌드를 개선하고 클라이언트 측 렌더링 프로젝트가 향후 SSR을 채택하기 쉽게 만듭니다. 그러나 기존 SSR 애플리케이션에 대해 수동으로 수행할 경우 마이그레이션 작업이 조금 더 필요합니다. `application` 빌더가 프로젝트에 적용하기 어려운 경우, `browser-esbuild`가 더 적은 충돌 변화로 대부분의 빌드 성능 이점을 제공하는 더 쉬운 해결책이 될 수 있습니다.

#### 호환성 빌더로의 수동 마이그레이션

`browser-esbuild`라는 빌더는 Angular CLI로 생성된 애플리케이션의 `@angular-devkit/build-angular` 패키지 내에서 사용할 수 있습니다. `browser` 빌더를 사용하는 애플리케이션의 경우 새로운 빌드 시스템을 사용해 볼 수 있습니다. 사용자 정의 빌더를 사용하는 경우, 해당 빌더의 가능한 마이그레이션 옵션에 대한 문서를 참조하십시오.

호환성 옵션은 애플리케이션을 처음 마이그레이션하는 데 필요한 변경 사항의 양을 최소화하기 위해 구현되었습니다. 이는 대체 빌더(`browser-esbuild`)를 통해 제공됩니다. 모든 애플리케이션 대상에 대해 `build` 대상을 업데이트하여 새로운 빌드 시스템으로 마이그레이션할 수 있습니다.

다음은 애플리케이션의 `angular.json`에서 일반적으로 발견되는 내용입니다:

<docs-code language="json">
...
"architect": {
  "build": {
    "builder": "@angular-devkit/build-angular:browser",
...
</docs-code>

`builder` 필드를 변경하는 것이 필요하 기초로 하여 요구할 변화의 유일한 부분입니다.

<docs-code language="json">
...
"architect": {
  "build": {
    "builder": "@angular-devkit/build-angular:browser-esbuild",
...
</docs-code>

#### 새로운 `application` 빌더로의 수동 마이그레이션

`application`이라는 빌더는 Angular CLI로 생성된 애플리케이션의 `@angular-devkit/build-angular` 패키지 내에서도 사용할 수 있습니다. 이 빌더는 `ng new`를 통해 생성된 모든 새로운 애플리케이션의 기본값입니다.

다음은 애플리케이션의 `angular.json`에서 일반적으로 발견되는 내용입니다:

<docs-code language="json">
...
"architect": {
  "build": {
    "builder": "@angular-devkit/build-angular:browser",
...
</docs-code>

`builder` 필드를 변경하는 것이 첫 번째 변경이 필요합니다.

<docs-code language="json">
...
"architect": {
  "build": {
    "builder": "@angular-devkit/build-angular:application",
...
</docs-code>

빌더 이름이 변경되면 `build` 대상 내의 옵션도 업데이트해야 합니다. 다음 목록은 조정이 필요한 모든 `browser` 빌더 옵션을 설명합니다.

- `main`은 `browser`로 이름을 변경해야 합니다.
- `polyfills`는 단일 파일이 아닌 배열이어야 합니다.
- `buildOptimizer`는 제거해야 하며, 이는 `optimization` 옵션으로 다룹니다.
- `resourcesOutputPath`는 제거해야 하며, 이제 항상 `media`입니다.
- `vendorChunk`는 제거해야 하며, 이는 더 이상 필요하지 않은 성능 최적화입니다.
- `commonChunk`는 제거해야 하며, 이는 더 이상 필요하지 않은 성능 최적화입니다.
- `deployUrl`는 제거되어 지원되지 않습니다. 대신 [`<base href>`](guide/routing/common-router-tasks)를 사용하세요. 자세한 내용은 [배포 문서](tools/cli/deployment#--deploy-url)를 참조하십시오.
- `ngswConfigPath`는 `serviceWorker`로 이름이 변경되어야 합니다.

애플리케이션이 현재 SSR을 사용하지 않는 경우, 이는 `ng build`가 작동할 수 있도록 하는 최종 단계가 되어야 합니다. 처음 `ng build`를 실행한 후에는 동작의 차이 또는 webpack 특정 기능 사용에 따라 새로운 경고 또는 오류가 발생할 수 있습니다. 많은 경고가 문제를 해결하는 방법에 대한 제안을 제공합니다. 경고가 잘못되었거나 해결 방법이 명확하지 않은 경우 [GitHub](https://github.com/angular/angular-cli/issues)에서 이슈를 열어주시기 바랍니다. 또한 이 가이드의 후속 섹션에서는 여러 특정 사례 및 현재 알려진 문제에 대한 추가 정보를 제공합니다.

SSR에 새로 진입하는 애플리케이션의 경우, [Angular SSR 가이드](guide/ssr)는 애플리케이션에 SSR을 추가하는 설정 프로세스에 대한 추가 정보를 제공합니다.

이미 SSR을 사용하는 애플리케이션의 경우, 애플리케이션 서버를 업데이트하여 새로운 통합 SSR 기능을 지원하기 위한 추가 조정이 필요합니다. `application` 빌더는 이제 다음 기존 빌더에 대해 통합된 기능을 제공합니다:

- `app-shell`
- `prerender`
- `server`
- `ssr-dev-server`

`ng update` 프로세스는 일부 기존 빌더에서 이전의 `@nguniversal` 범위 패키지의 사용을 자동으로 제거합니다. 새로운 `@angular/ssr` 패키지도 자동으로 추가되고 업데이트 중에 구성 및 코드가 조정됩니다. `@angular/ssr` 패키지는 `browser` 빌더와 `application` 빌더를 지원합니다.

## 빌드 실행

애플리케이션 구성업데이트를 완료한 후, 이전과 같이 `ng build`를 사용하여 빌드를 수행할 수 있습니다. 빌더 마이그레이션 선택에 따라 일부 명령 줄 옵션이 다를 수 있습니다. 빌드 명령이 `npm` 또는 기타 스크립트에 포함되어 있는 경우, 해당 스크립트가 검토되고 업데이트되었는지 확인하십시오. `application` 빌더로 마이그레이션된 애플리케이션 및 SSR과/또는 사전 렌더링을 사용하는 애플리케이션의 경우, 이제 `ng build`가 SSR 지원을 통합했기 때문에 추가 `ng run` 명령을 스크립트에서 제거할 수 있을 수 있습니다.

<docs-code language="shell">

ng build

</docs-code>

## 개발 서버 시작

개발 서버는 새로운 빌드 시스템을 자동으로 감지하고 이를 사용하여 애플리케이션을 빌드합니다. 개발 서버를 시작하는 데 `dev-server` 빌더 구성이나 명령 줄에 대한 변경이 필요하지 않습니다.

<docs-code language="shell">

ng serve

</docs-code>

개발 서버에서 과거에 사용했던 [명령 줄 옵션](/cli/serve)을 계속해서 사용할 수 있습니다.

도움말: 개발 서버를 사용할 때 서버가 초기화되는 동안 스타일이 적용되지 않은 콘텐츠(FOUC)가 잠시 나타날 수 있습니다. 개발 서버는 스타일시트의 처리를 최초 사용 전으로 연기하여 재빌드 시간을 향상시키려고 시도합니다. 이는 개발 서버 외부의 빌드에서는 발생하지 않습니다.

### 핫 모듈 교체

핫 모듈 교체(HMR)는 개발 서버가 애플리케이션의 일부만 변경되었을 때 전체 페이지를 다시 로드하지 않도록 해주는 기술입니다. 많은 경우 변경 사항이 브라우저에서 즉시 표시될 수 있어 애플리케이션을 개발할 때 개선된 편집/새로 고침 주기를 제공합니다. 일반 JavaScript 기반 핫 모듈 교체(HMR)는 현재 지원되지 않지만 몇 가지 더 구체적인 형태의 HMR이 사용할 수 있습니다:
- **전역 스타일시트** (`styles` 빌드 옵션)
- **컴포넌트 스타일시트** (인라인 및 파일 기반)
- **컴포넌트 템플릿** (인라인 및 파일 기반)

HMR 기능은 자동으로 활성화되며 사용하기 위해 코드나 구성 변경이 필요하지 않습니다. Angular는 파일 기반(`templateUrl`/`styleUrl`/`styleUrls`) 및 인라인(`template`/`styles`) 컴포넌트 스타일 및 템플릿에 대해 HMR 지원을 제공합니다. 빌드 시스템은 스타일시트만 변경된 것을 감지할 때 최소한의 애플리케이션 코드 컴파일 및 처리를 시도합니다.

원하는 경우 `hmr` 개발 서버 옵션을 `false`로 설정하여 HMR 기능을 비활성화할 수 있습니다. 이는 명령 줄에서도 다음과 같이 변경할 수 있습니다:

<docs-code language="shell">

ng serve --no-hmr

</docs-code>

### Vite를 개발 서버로 사용하기

Angular CLI에서 Vite의 사용은 현재 _개발 서버 기능만_ 포함됩니다. 기본 Vite 빌드 시스템을 사용하지 않더라도 Vite는 클라이언트 측 지원이 포함된 풀 기능 개발 서버를 제공합니다. 이로 인해 Vite는 포괄적인 개발 서버 기능을 제공하는 이상적인 후보입니다. 현재 개발 서버 프로세스는 새로운 빌드 시스템을 사용하여 메모리 내에서 애플리케이션의 개발 빌드를 생성하고 결과를 Vite에 전달하여 애플리케이션을 제공합니다. Vite의 사용은 Webpack 기반 개발 서버와 마찬가지로 Angular CLI의 `dev-server` 빌더 내에서 캡슐화되어 있으며 현재 직접 구성할 수 없습니다.

### 사전 번들링

사전 번들은 개발 서버를 사용할 때 개선된 빌드 및 재빌드 시간을 제공합니다. Vite는 Angular CLI를 사용할 때 기본적으로 활성화되는 [사전 번들링 기능](https://vite.dev/guide/dep-pre-bundling)을 제공합니다. 사전 번들링 프로세스는 개발 서버가 실행될 때 프로젝트 내의 모든 서드파티 프로젝트 의존성을 분석하고 이를 처리합니다. 이 프로세스는 재빌드가 발생할 때마다 또는 개발 서버가 실행될 때마다 프로젝트의 의존성을 다시 빌드하고 번들링할 필요를 제거합니다.

대부분의 경우 추가 커스터마이징이 필요하지 않습니다. 그러나 필요할 수 있는 몇 가지 상황은 다음과 같습니다:
- 의존성 내의 가져오기용 로더 동작을 사용자 정의하는 경우 [`loader` 옵션](#file-extension-loader-customization)
- 개발용으로 로컬 코드에 대한 의존성을 심볼링하는 경우 [`npm link`](https://docs.npmjs.com/cli/v10/commands/npm-link)
- 의존성의 사전 번들링 중에 발생한 오류를 해결하는 경우

사전 번들링 프로세스는 프로젝트에서 필요에 따라 완전히 비활성화하거나 개별 의존성을 제외할 수 있습니다. `dev-server` 빌더의 `prebundle` 옵션을 사용해 이러한 커스터마이징을 할 수 있습니다. 특정 의존성을 제외하려면 `prebundle.exclude` 옵션을 사용할 수 있습니다:

<docs-code language="json">
    "serve": {
      "builder": "@angular/build:dev-server",
      "options": {
        "prebundle": {
          "exclude": ["some-dep"]
        }
      },
</docs-code>

기본적으로 `prebundle`은 `true`로 설정되어 있지만, `false`로 설정하여 사전 번들링을 완전히 비활성화하는 것이 가능합니다. 그러나 특정 의존성을 제외하는 것이 권장됩니다. 사전 번들링 비활성화 시 재빌드 시간이 증가합니다.

<docs-code language="json">
    "serve": {
      "builder": "@angular/build:dev-server",
      "options": {
        "prebundle": false
      },
</docs-code>

## 새로운 기능

애플리케이션 빌드 시스템의 주요 이점 중 하나는 개선된 빌드 및 재빌드 속도입니다. 그러나 새로운 애플리케이션 빌드 시스템은 `browser` 빌더에 없는 추가 기능도 제공합니다.

중요: 여기에 설명된 `application` 빌더의 새로운 기능은 기본적으로 `karma` 테스트 빌더와 호환되지 않습니다. `karma` 빌더는 내부적으로 `browser` 빌더를 사용하고 있습니다. 사용자는 `karma` 빌더에 대해 `builderMode` 옵션을 `application`으로 설정하여 새 빌더를 사용하도록 선택할 수 있습니다. 이 옵션은 현재 개발 미리보기 상태입니다. 문제가 발생하면 [여기](https://github.com/angular/angular-cli/issues)에 보고해 주십시오.

### 빌드 시간 값 대체 (define)

`define` 옵션은 코드에 존재하는 식별자를 빌드 시간에 다른 값으로 대체할 수 있도록 해줍니다. 이는 이전에 서드파티 빌더를 사용하는 몇몇 맞춤형 Webpack 구성으로 사용된 Webpack의 `DefinePlugin` 동작과 유사합니다. 이 옵션은 `angular.json` 구성 파일 내에서 사용하거나 명령 줄에서 사용할 수 있습니다. `angular.json` 내에서 `define`을 구성하는 것은 값이 상수이고 소스 제어에 체크인할 수 있는 경우에 유용합니다.

구성 파일 내에서 이 옵션은 객체 형식으로 제공됩니다. 객체의 키는 대체할 식별자를 나타내며, 객체의 값은 식별자에 대한 해당 대체 값을 나타냅니다. 예시는 다음과 같습니다:

<docs-code language="json">
  "build": {
    "builder": "@angular/build:application",
    "options": {
      ...
      "define": {
          "SOME_NUMBER": "5",
          "ANOTHER": "'this is a string literal, note the extra single quotes'",
          "REFERENCE": "globalThis.someValue.noteTheAbsentSingleQuotes"
      }
    }
  }
</docs-code>

도움말: 모든 대체 값은 구성 파일 내에서 문자열로 정의됩니다. 대체가 실제 문자열 리터럴일 경우, 이는 작은 따옴표로 묶어야 합니다. 이는 어떤 유효한 JSON 유형 및 다른 식별자를 대체 용도로 사용하는 유연성을 허용합니다.

명령 줄 사용은 빌드 실행에 따라 변경될 수 있는 값, 예를 들어 git 커밋 해시나 환경 변수에 대해 선호됩니다. CLI는 명령 줄의 `--define` 값과 `angular.json`에서의 `define` 값을 함께 병합하여 빌드에 포함합니다. 동일한 식별자가 모두 존재하는 경우 명령 줄 사용이 우선됩니다. 명령 줄 사용에 대해 `--define` 옵션은 `IDENTIFIER=VALUE` 형태를 사용합니다.

<docs-code language="shell">
ng build --define SOME_NUMBER=5 --define "ANOTHER='these will overwrite existing'"
</docs-code>

환경 변수를 빌드에 선택적으로 포함할 수도 있습니다. 비윈도우 셸의 경우, 해시 리터럴 주위의 따옴표를 직접 이스케이프할 수 있습니다. 이 예시는 bash와 유사한 셸을 가정하지만 다른 셸에서도 비슷한 동작이 가능합니다.

<docs-code language="shell">
export MY_APP_API_HOST="http://example.com"
export API_RETRY=3
ng build --define API_HOST=\'$MY_APP_API_HOST\' --define API_RETRY=$API_RETRY
</docs-code>

어떤 사용이든 TypeScript는 빌드 중에 타입 검사 오류를 방지하기 위해 식별자의 타입을 인식해야 합니다. 이는 애플리케이션 소스 코드 내의 추가 타입 정의 파일(`src/types.d.ts` 등)로 비슷한 내용으로 추가하여 달성할 수 있습니다:

```ts
declare const SOME_NUMBER: number;
declare const ANOTHER: string;
declare const GIT_HASH: string;
declare const API_HOST: string;
declare const API_RETRY: number;
```

기본 프로젝트 구성은 이미 프로젝트 소스 디렉터리에 있는 모든 타입 정의 파일을 사용하도록 설정되어 있습니다. 프로젝트의 TypeScript 구성이 변경된 경우, 이 새로 추가된 타입 정의 파일을 참조하도록 조정해야 할 수 있습니다.

중요: 이 옵션은 컴포넌트나 디렉티브 장식자와 같은 Angular 메타데이터에 포함된 식별자를 대체하지 않습니다.

### 파일 확장자 로더 사용자 정의

중요: 이 기능은 `application` 빌더와 함께 사용할 수 있습니다.

일부 프로젝트는 특정 파일 확장자를 가진 모든 파일이 로드 및 애플리케이션에 번들링되는 방식을 제어할 필요가 있을 수 있습니다. `application` 빌더를 사용할 때, `loader` 옵션을 사용해 이러한 경우를 처리할 수 있습니다. 이 옵션은 프로젝트가 특정 파일 확장자에 사용할 로더 유형을 정의할 수 있게 합니다. 정의된 확장자를 가진 파일은 import 문 또는 동적 import 표현식을 통해 애플리케이션 코드 내에서 사용할 수 있습니다. 사용할 수 있는 로더는 다음과 같습니다:
* `text` - 콘텐츠를 문자열로 인라인하여 기본 내보내기로 제공합니다.
* `binary` - 콘텐츠를 Uint8Array로 인라인하여 기본 내보내기로 제공합니다.
* `file` - 애플리케이션 출력 경로에 파일을 방출하고 파일의 런타임 위치를 기본 내보내기로 제공합니다.
* `empty` - 콘텐츠를 비어 있다고 간주하고 번들에 포함하지 않습니다.

`empty` 값은 덜 일반적이지만, 제거할 필요가 있는 번들러 특정 가져오기 사용을 포함하는 서드파티 라이브러리의 호환성에 유용할 수 있습니다. 한 사례는 CSS 파일에서 사이드 이펙트 가져오기(`import 'my.css';`)로, 브라우저에서는 효과가 없습니다. 대신 프로젝트는 `empty`를 사용하고 CSS 파일을 `styles` 빌드 옵션에 추가하거나 다른 주입 방법을 사용할 수 있습니다.

로더 옵션은 객체 기반 옵션으로, 키를 사용해 파일 확장자를 정의하고 값을 사용해 로더 유형을 정의합니다.

SVG 파일의 콘텐츠를 번들링된 애플리케이션에 인라인하기 위한 빌드 옵션 사용의 예시는 다음과 같습니다:

<docs-code language="json">
  "build": {
    "builder": "@angular/build:application",
    "options": {
      ...
      "loader": {
        ".svg": "text"
      }
    }
  }
</docs-code>

그런 다음 SVG 파일을 가져올 수 있습니다:
```ts
import contents from './some-file.svg';

console.log(contents); // <svg>...</svg>
```

또한 TypeScript는 빌드 중 타입 검사 오류를 방지하기 위해 import의 모듈 유형을 인식해야 합니다. 이는 애플리케이션 소스 코드 내의 추가 타입 정의 파일(`src/types.d.ts` 등)로 다음 또는 유사한 내용을 추가하여 달성할 수 있습니다:
```ts
declare module "*.svg" {
  const content: string;
  export default content;
}
```

기본 프로젝트 구성은 이미 프로젝트 소스 디렉터리에 있는 모든 타입 정의 파일(`.d.ts` 파일)을 사용하도록 설정되어 있습니다. 프로젝트의 TypeScript 구성이 변경된 경우, tsconfig는 이 새로 추가된 타입 정의 파일을 참조하도록 조정해야 할 수 있습니다.

### import 속성 로더 사용자 정의

특정 파일을 특정 방식으로 로드해야 하는 경우, 개별 파일에 대한 로드 동작 제어를 사용할 수 있습니다. 이는 모든 import 문 및 표현식과 함께 사용할 수 있는 `loader` [import 속성](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import/with)으로 구현됩니다. import 속성의 존재는 JS/TS 포함 여타 모든 로드 동작 및 `loader` 빌드 옵션 값을 초과합니다. 일반적으로 지원되지 않는 파일 유형의 모든 파일에 대한 로드에는 [`loader`](#file-extension-loader-customization) 빌드 옵션을 권장합니다.

import 속성에 대해 지원되는 로더 값은 다음과 같습니다:
* `text` - 콘텐츠를 문자열로 인라인하여 기본 내보내기로 제공합니다.
* `binary` - 콘텐츠를 Uint8Array로 인라인하여 기본 내보내기로 제공합니다.
* `file` - 애플리케이션 출력 경로에 파일을 방출하고 파일의 런타임 위치를 기본 내보내기로 제공합니다.

import 속성을 사용하려면 TypeScript의 `module` 옵션을 `esnext`로 설정해야 하며, 그래야 TypeScript가 애플리케이션 코드를 성공적으로 빌드할 수 있습니다. TypeScript에서 `ES2025`가 사용 가능해지면 이 변경은 더 이상 필요하지 않습니다.

현재 TypeScript는 import 속성 값에 기반한 타입 정의를 지원하지 않습니다. `@ts-expect-error`/`@ts-ignore` 또는 개별 타입 정의 파일의 사용(가정: 동일한 로더 속성으로만 가져옵니다)이 현재 필요합니다. 예를 들어, SVG 파일은 다음과 같이 텍스트로 가져올 수 있습니다:
```ts
// @ts-expect-error TypeScript는 속성을 기반으로 타입을 제공할 수 없습니다.
import contents from './some-file.svg' with { loader: 'text' };
```

이는 비동기 함수 안의 import 표현식으로 동일하게 수행할 수 있습니다.
```ts
async function loadSvg(): Promise<string> {
  // @ts-expect-error TypeScript는 속성을 기반으로 타입을 제공할 수 없습니다.
  return import('./some-file.svg', { with: { loader: 'text' } }).then((m) => m.default);
}
```
import 표현식에 대해 `loader` 값은 정적 분석을 위해 문자열 리터럴이어야 합니다. 값이 문자열 리터럴이 아닌 경우 경고가 발행됩니다.

`file` 로더는 파일이 런타임에 `fetch()`를 통해 로드되거나 이미지 요소의 `src`에 설정되거나 기타 유사한 방식으로 로드될 때 유용합니다.
```ts
// @ts-expect-error TypeScript는 속성을 기반으로 타입을 제공할 수 없습니다.
import imagePath from './image.webp' with { loader: 'file' };

console.log(imagePath); // media/image-ULK2SIIB.webp
```
위의 코드 주석에서 보여 준 생산 빌드의 경우, 경로에 해싱이 자동으로 추가되어 장기 캐싱을 지원합니다.

도움말: 개발 서버를 사용할 때 Node.js 패키지에서 파일을 가져오기 위해 `loader` 속성을 사용할 경우, 해당 패키지는 개발 서버의 `prebundle` 옵션을 통해 사전 번들링에서 제외해야 합니다.

### import/export 조건

프로젝트에서는 특정 import 경로를 빌드 유형에 따라 다른 파일로 매핑해야 할 필요가 있을 수 있습니다. 이는 `ng serve`가 디버그/개발 특정 코드를 필요로 하지만 `ng build`는 개발 기능/정보가 없는 코드를 필요로 하는 경우와 같은 상황에 특히 유용할 수 있습니다. 몇 가지 import/export [조건](https://nodejs.org/api/packages.html#community-conditions-definitions)이 이러한 프로젝트 요구를 지원하기 위해 자동으로 적용됩니다:
* 최적화된 빌드의 경우, `production` 조건이 활성화됩니다.
* 비최적화된 빌드의 경우, `development` 조건이 활성화됩니다.
* 브라우저 출력 코드의 경우, `browser` 조건이 활성화됩니다.

최적화된 빌드는 `optimization` 옵션의 값에 따라 결정됩니다. `optimization`이 `true`로 설정되거나 더 구체적으로 `optimization.scripts`가 `true`로 설정되면 빌드는 최적화된 것으로 간주됩니다. 이 분류는 `ng build` 및 `ng serve` 모두에 적용됩니다. 새로운 프로젝트에서는 `ng build`가 기본적으로 최적화되며 `ng serve`는 기본적으로 비최적화됩니다.

응용 프로그램 코드 내에서 이러한 조건을 활용하는 유용한 방법은 [서브경로 임포트](https://nodejs.org/api/packages.html#subpath-imports)와 결합하는 것입니다. 다음과 같은 import 문을 사용하여:
```ts
import {verboseLogging} from '#logger';
```

파일은 `package.json`의 `imports` 필드에서 전환될 수 있습니다:

<docs-code language="json">
{
  ...
  "imports": {
    "#logger": {
      "development": "./src/logging/debug.ts",
      "default": "./src/logging/noop.ts"
    }
  }
}
</docs-code>

SSR을 사용하는 애플리케이션에서도 브라우저 및 서버 코드를 전환할 수 있습니다:
<docs-code language="json">
{
  ...
  "imports": {
    "#crashReporter": {
      "browser": "./src/browser-logger.ts",
      "default": "./src/server-logger.ts"
    }
  }
}
</docs-code>

이러한 조건은 Node.js 패키지 및 패키지 내에서 정의된 [`exports`](https://nodejs.org/api/packages.html#conditional-exports)에도 적용됩니다.

도움말: 현재 `fileReplacements` 빌드 옵션을 사용하고 있는 경우, 이 기능이 해당 사용을 대체할 수 있습니다.

## 알려진 문제

새로운 빌드 시스템을 시도할 때 발생할 수 있는 여러 알려진 문제가 현재 있습니다. 이 목록은 최신 상태를 유지하기 위해 업데이트됩니다. 이러한 문제 중 일부가 새로운 빌드 시스템을 시험해보는 데 방해가 되면, 추후 이 문제가 해결되었는지 확인하시기 바랍니다.

### 웹 워커 코드의 타입 검사 및 중첩 웹 워커 처리

웹 워커는 `browser` 빌더와 지원되는 같은 구문(`new Worker(new URL('<workerfile>', import.meta.url))`)을 사용하여 애플리케이션 코드 내에서 사용할 수 있습니다. 그러나 현재 Worker 내의 코드는 TypeScript 컴파일러에 의해 타입 검사를 받지 않습니다. TypeScript 코드가 지원되긴 하지만 타입 검사를 받지 않습니다. 추가적으로, 중첩된 워커는 빌드 시스템에서 처리되지 않습니다. 중첩 워커란 다른 워커 파일 내에서의 워커 인스턴화입니다.

### ESM 기본 임포트와 네임스페이스 임포트

TypeScript는 기본적으로 기본 내보내기가 네임스페이스 임포트로 임포트되고 호출 표현식에서 사용될 수 있도록 허용합니다. 이는 불행히도 ECMAScript 사양과의 불일치입니다. 새로운 빌드 시스템 내의 기본 번들러(`esbuild`)는 사양에 부합하는 ESM 코드를 기대합니다. 애플리케이션이 패키지의 잘못된 유형의 임포트를 사용할 경우, 빌드 시스템은 이제 경고를 생성합니다. 그러나 TypeScript가 올바른 사용을 허용하도록 하려면, 애플리케이션의 `tsconfig` 파일 내에서 TypeScript 옵션이 활성화되어야 합니다. 활성화되면 [`esModuleInterop`](https://www.typescriptlang.org/tsconfig#esModuleInterop) 옵션은 ECMAScript 사양과의 더 나은 일치를 제공합니다. 이는 TypeScript 팀에서도 권장됩니다. 활성화되면 적용 가능한 곳에 패키지 임포트를 ECMAScript 준수 형식으로 업데이트할 수 있습니다.

예를 들어 [`moment`](https://npmjs.com/package/moment) 패키지를 사용하면 다음 애플리케이션 코드는 런타임 오류를 유발합니다:

```ts
import * as moment from 'moment';

console.log(moment().format());
```

빌드는 문제의 가능성을 알리는 경고를 생성합니다. 경고는 다음과 유사할 것입니다:

<docs-code language="text">
▲ [경고] "moment"를 호출하면 런타임에 충돌합니다. 이는 함수가 아니라 가져오기 네임스페이스 객체입니다 [call-import-namespace]

    src/main.ts:2:12:
      2 │ console.log(moment().format());
        ╵             ~~~~~~

"moment"를 기본 임포트로 변경하는 것을 고려하십시오:

    src/main.ts:1:7:
      1 │ import * as moment from 'moment';
        │        ~~~~~~~~~~~
        ╵        moment

</docs-code>

하지만 애플리케이션에 대해 `esModuleInterop` TypeScript 옵션을 활성화하고 가져오기를 다음과 같이 변경하여 런타임 오류 및 경고를 피할 수 있습니다:

```ts
import moment from 'moment';

console.log(moment().format());
```

### 느린 모듈에서 순서 의존적인 부수 효과가 있는 가져오기

특정 순서에 의존하고 여러 지연 모듈에서 사용되는 가져오기 문은 최상위 문이 순서에 맞지 않게 실행되게 만들 수 있습니다. 이는 일반적이지 않으며 부수 효과가 있는 모듈 사용에 의존하며 `polyfills` 옵션에는 적용되지 않습니다. 이는 기본 번들러의 [결함](https://github.com/evanw/esbuild/issues/399)으로 인해 발생하지만 향후 업데이트에서 해결될 것입니다.

중요: 부수 효과가 없는 모듈(폴리필 제외)의 사용을 피하는 것이 가능한 경우 추천됩니다. 이는 특정 문제를 피합니다. 부수 효과가 없는 모듈은 애플리케이션 크기 및 런타임 성능에 부정적인 영향을 미칠 수 있습니다.

## 버그 보고서

문제 및 기능 요청은 [GitHub](https://github.com/angular/angular-cli/issues)에 보고하십시오.

이슈를 해결하는 데 도움이 되도록 가능한 경우 최소한의 재현을 제공해 주십시오.