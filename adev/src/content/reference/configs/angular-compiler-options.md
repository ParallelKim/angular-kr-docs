# Angular 컴파일러 옵션

[AOT (사전 컴파일)](tools/cli/aot-compiler)을 사용하는 경우, TypeScript 구성 파일에서 Angular 컴파일러 옵션을 지정하여 애플리케이션이 어떻게 컴파일되는지를 제어할 수 있습니다.

Angular 옵션 객체인 `angularCompilerOptions`는 TypeScript 컴파일러에 표준 옵션을 공급하는 `compilerOptions` 객체의 형제입니다.

<docs-code header="tsconfig.json" path="adev/src/content/examples/angular-compiler-options/tsconfig.json" visibleRegion="angular-compiler-options"/>

## `extends`를 통한 구성 상속

TypeScript 컴파일러와 마찬가지로 Angular AOT 컴파일러는 TypeScript 구성 파일의 `angularCompilerOptions` 섹션에서 `extends`를 지원합니다.
`extends` 속성은 최상위 수준에 있으며, `compilerOptions` 및 `angularCompilerOptions`와 나란히 존재합니다.

TypeScript 구성은 `extends` 속성을 사용하여 다른 파일에서 설정을 상속받을 수 있습니다.
기본 파일의 구성 옵션이 먼저 로드되고, 그렇게 하여 상속된 구성 파일의 옵션으로 덮어씌워집니다.

예를 들어:

<docs-code header="tsconfig.app.json" path="adev/src/content/examples/angular-compiler-options/tsconfig.app.json" visibleRegion="angular-compiler-options-app"/>

자세한 내용은 [TypeScript 핸드북](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)을 참조하십시오.

## 템플릿 옵션

다음 옵션들은 Angular AOT 컴파일러를 구성하는 데 사용할 수 있습니다.

### `annotationsAs`

트리 쉐이킹을 개선하기 위해 Angular 전용 주석이 어떻게 생성되는지를 수정합니다.
비-Angular 주석에는 영향을 미치지 않습니다.
`static fields` 또는 `decorators` 중 하나입니다. 기본값은 `static fields`입니다.

* 기본적으로, 컴파일러는 데코레이터를 클래스의 정적 필드로 교체하여 [Closure compiler](https://github.com/google/closure-compiler)와 같은 고급 트리 쉐이커가 사용되지 않는 클래스를 제거할 수 있도록 합니다.
* `decorators` 값은 데코레이터를 그대로 두어 컴파일 속도를 빠르게 합니다.
    TypeScript는 `__decorate` 헬퍼에 대한 호출을 생성합니다.
    런타임 반사를 위해 `--emitDecoratorMetadata`를 사용하십시오.

    유용함: 결과 코드가 올바르게 트리 쉐이크할 수 없습니다.

### `annotateForClosureCompiler`

<!-- vale Angular.Angular_Spelling = NO -->

`true`인 경우, 발생된 JavaScript를 [Closure Compiler](https://github.com/google/closure-compiler)에 필요한 [JSDoc](https://jsdoc.app) 주석으로 주석합니다.
기본값은 `false`입니다.

<!-- vale Angular.Angular_Spelling = YES -->

### `compilationMode`

사용할 컴파일 모드를 지정합니다.
다음 모드를 사용할 수 있습니다:

| 모드       | 세부 정보 |
|:---        |:---      |
| `'full'`   | 현재 사용 중인 Angular 버전에 따라 완전히 AOT 컴파일된 코드를 생성합니다. |
| `'partial'`| 게시된 라이브러리에 적합한 안정적이지만 중간 형태로 코드를 생성합니다. |

기본값은 `'full'`입니다.

대부분의 애플리케이션에서는 `'full'`이 올바른 컴파일 모드입니다.

독립적으로 게시된 라이브러리, 예를 들어 NPM 패키지에는 `'partial'`을 사용하십시오.
`'partial'` 컴파일은 서로 다른 Angular 버전에서 구축된 응용 프로그램에 의해 사용되기에 더 나은 안정적인 중간 형식을 출력합니다.
애플리케이션과 함께 "HEAD"에서 구축된 라이브러리들은 `'full'`을 사용할 수 있으며, 이 경우 버전 불일치의 위험이 없습니다.

### `disableExpressionLowering`

`true`인 경우, 기본값이며, 주석에서 사용되거나 사용될 수 있는 코드의 변환을 통해 템플릿 팩토리 모듈에서 가져올 수 있도록 합니다.
자세한 내용은 [메타데이터 재작업](tools/cli/aot-compiler#metadata-rewriting)을 참조하십시오.

`false`인 경우, 이 재작업을 비활성화하여 수동으로 재작업이 필요합니다.

### `disableTypeScriptVersionCheck`

`true`인 경우, 컴파일러는 TypeScript 버전을 확인하지 않으며 지원되지 않는 TypeScript 버전이 사용될 때 오류를 보고하지 않습니다.
지원되지 않는 TypeScript 버전은 정의되지 않은 동작을 일으킬 수 있으므로 권장하지 않습니다.
기본값은 `false`입니다.

### `enableI18nLegacyMessageIdFormat`

Angular 템플릿 컴파일러에 의해 `i18n` 속성으로 태그된 메시지에 대해 레거시 ID를 생성하도록 지시합니다.
현지화를 위해 메시지를 표시하는 방법에 대한 자세한 내용은 [Mark text for translations][GuideI18nCommonPrepareMarkTextInComponentTemplate]를 참조하십시오.

레거시 ID를 사용하여 이전에 생성된 번역에 의존하지 않는 한 이 옵션을 `false`로 설정하십시오.
기본값은 `true`입니다.

사전 Ivy 메시지 추출 도구는 추출된 메시지 ID에 대해 다양한 레거시 형식을 생성했습니다.
이 메시지 형식에는 공백 처리 및 템플릿의 원래 HTML 내부 정보 의존과 같은 몇 가지 문제가 있습니다.

새 메시지 형식은 공백 변경에 대한 저항력이 더 강하며, 모든 번역 파일 형식에서 동일하고, `$localize` 호출에서 직접 생성될 수 있습니다.
이렇게 하면 애플리케이션 코드의 `$localize` 메시지가 컴포넌트 템플릿에서 동일한 `i18n` 메시지와 동일한 ID를 사용할 수 있습니다.

### `enableResourceInlining`

`true`인 경우, 모든 `@Component` 데코레이터의 `templateUrl` 및 `styleUrls` 속성을 `template` 및 `styles` 속성에 인라인 콘텐츠로 교체합니다.

활성화되면 `ngc`의 `.js` 출력에는 지연 로드된 템플릿이나 스타일 URL이 포함되지 않습니다.

Angular CLI로 생성된 라이브러리 프로젝트에서는 개발 구성 기본값이 `true`입니다.

### `enableLegacyTemplate`

`true`인 경우, `<ng-template>` 대신에 사용 중단된 `<template>` 요소를 활성화합니다.
기본값은 `false`입니다.
일부 서드파티 Angular 라이브러리에 의해 필요할 수 있습니다.

### `flatModuleId`

플랫 모듈 \( `flatModuleOutFile`이 `true`인 경우 \)을 임포트하는 데 사용할 모듈 ID.
템플릿 컴파일러에서 생성된 참조는 플랫 모듈에서 기호를 임포트할 때 이 모듈 이름을 사용합니다.
`flatModuleOutFile`이 `false`인 경우 무시됩니다.

### `flatModuleOutFile`

`true`인 경우, 지정된 파일 이름과 해당하는 플랫 모듈 메타데이터의 평면 모듈 인덱스를 생성합니다.
`@angular/core` 및 `@angular/common`과 유사하게 패키징된 평면 모듈을 만드는 데 사용됩니다.
이 옵션을 사용할 때 라이브러리의 `package.json`은 생성된 플랫 모듈 인덱스를 참조해야 하며 라이브러리 인덱스 파일은 참조하지 않아야 합니다.

모듈 인덱스에서 내보낸 기호에 필요한 모든 메타데이터를 포함하는 `.metadata.json` 파일이 하나만 생성됩니다.
생성된 `.ngfactory.js` 파일에서는 플랫 모듈 인덱스를 사용하여 기호를 임포트합니다. 기호는 라이브러리 인덱스로부터의 공공 API와 내부 기호를 포함합니다.

기본적으로 `files` 필드에 제공된 `.ts` 파일이 라이브러리 인덱스로 가정됩니다.
`.ts` 파일이 둘以上 지정되면 `libraryIndex`가 사용되어 사용할 파일을 선택합니다.
하나의 `libraryIndex` 없이 여러 개의 `.ts` 파일이 제공되면 오류가 발생합니다.

지정된 `flatModuleOutFile` 이름으로 라이브러리 인덱스 `.d.ts` 파일과 동일한 위치에 플랫 모듈 인덱스 `.d.ts` 및 `.js`가 생성됩니다.

예를 들어, 라이브러리가 모듈의 라이브러리 인덱스으로 `public_api.ts` 파일을 사용하는 경우, `tsconfig.json`의 `files` 필드는 `["public_api.ts"]`가 됩니다.
그런 다음 `flatModuleOutFile` 옵션은 예를 들어 `"index.js"`로 설정할 수 있습니다. 이는 `index.d.ts` 및 `index.metadata.json` 파일을 생성합니다.
라이브러리의 `package.json`의 `module` 필드는 `"index.js"`가 되고, `typings` 필드는 `"index.d.ts"`가 됩니다.

### `fullTemplateTypeCheck`

`true`인 경우, 추천 값이며, 템플릿 컴파일러의 [바인딩 표현 검증](tools/cli/aot-compiler#binding-expression-validation) 단계를 활성화합니다. 이 단계는 TypeScript를 사용하여 바인딩 표현을 검증합니다.
자세한 내용은 [템플릿 유형 검사](tools/cli/template-typecheck)를 참조하십시오.

기본값은 `false`이지만, Angular CLI 명령 `ng new --strict`를 사용할 경우 새로운 프로젝트의 구성에서 `true`로 설정됩니다.

중요: `fullTemplateTypeCheck` 옵션은 Angular 13에서 `strictTemplates` 컴파일러 옵션 패밀리로 대체되었습니다.

### `generateCodeForLibraries`

`true`인 경우, `.d.ts` 파일에 대해 `.ngfactory.js` 및 `.ngstyle.js` 팩토리 파일을 생성합니다. 기본값은 `true`입니다.

`false`인 경우, 팩토리 파일은 `.ts` 파일에 대해서만 생성됩니다.
팩토리 요약을 사용할 때 이렇게 하십시오.

### `preserveWhitespaces`

`false`인 경우, 기본값이며, 컴파일된 템플릿에서 공백 텍스트 노드를 제거하여 생성된 템플릿 팩토리 모듈의 크기를 줄입니다.
공백 텍스트 노드를 유지하려면 `true`로 설정하십시오.

유용함: 수화(hydration)를 사용하는 경우, 기본값인 `preserveWhitespaces: false`를 사용하는 것이 좋습니다. `preserveWhitespaces: true`를 tsconfig에 추가하여 공백 유지 활성화를 선택하는 경우, 수화에서 문제가 발생할 수 있습니다. 이는 아직 완전히 지원되는 구성이 아닙니다. 서버와 클라이언트 tsconfig 파일 간에도 일관되게 설정되었는지 확인하십시오. 더 자세한 내용은 [수화 가이드](guide/hydration#preserve-whitespaces)를 참조하십시오.

### `skipMetadataEmit`

`true`인 경우, `.metadata.json` 파일을 생성하지 않습니다.
기본값은 `false`입니다.

`.metadata.json` 파일은 TypeScript 컴파일러가 생성한 `.d.ts` 파일에 포함되지 않은 `.ts` 파일에서 템플릿 컴파일러에 필요한 정보를 포함합니다.
이 정보에는 예를 들어 컴포넌트의 템플릿과 같은 주석의 내용이 포함되며, TypeScript는 이를 `.js` 파일에는 내보내지만 `.d.ts` 파일에는 내보내지 않습니다.

팩토리 요약을 사용할 때 `true`로 설정할 수 있습니다. 왜냐하면 팩토리 요약에는 `.metadata.json` 파일에 있는 정보의 복사본이 포함되어 있기 때문입니다.

TypeScript의 `--outFile` 옵션을 사용할 때 `true`로 설정하십시오. 왜냐하면 메타데이터 파일은 이 스타일의 TypeScript 출력에 대해 유효하지 않기 때문입니다.
Angular 커뮤니티는 Angular와 함께 `--outFile` 사용을 권장하지 않습니다.
대신, [webpack](https://webpack.js.org)과 같은 번들러를 사용하십시오.

### `skipTemplateCodegen`

`true`인 경우, `.ngfactory.js` 및 `.ngstyle.js` 파일을 생성하지 않습니다.
이것은 대부분의 템플릿 컴파일러를 비활성화하고 템플릿 진단 보고를 비활성화합니다.

이것은 템플릿 컴파일러에 `.metadata.json` 파일을 배포하기 위해 생성하도록 지시할 수 있습니다. 이는 `.ngfactory.js` 및 `.ngstyle.js` 파일의 생산을 피합니다.

Angular CLI로 생성된 라이브러리 프로젝트에서는 개발 구성 기본값이 `true`입니다.

### `strictMetadataEmit`

`true`인 경우, `"skipMetadataEmit"`가 `false`일 때 `.metadata.json` 파일에 오류를 보고합니다.
기본값은 `false`입니다.
`"skipMetadataEmit"`가 `false`이고 `"skipTemplateCodegen"`가 `true`인 경우에만 사용하십시오.

이 옵션은 npm 패키지와 함께 번들할 `.metadata.json` 파일이 내보내는 것을 검증하기 위해 설계되었습니다.
검증은 엄격하며, 템플릿 컴파일러에서 사용 시 오류가 발생하지 않는 메타데이터의 경우에도 오류를 발생시킬 수 있습니다.
기호를 문서화하는 주석 내에 `@dynamic`을 포함하여 이 옵션에 의해 발생된 오류를 억제할 수 있습니다.

`.metadata.json` 파일에 오류가 포함되는 것은 유효합니다.
템플릿 컴파일러는 주석의 내용을 결정하기 위해 메타데이터가 사용될 경우 이러한 오류를 보고합니다.
메타데이터 수집기는 주석에서 사용하도록 설계된 기호를 예측할 수 없습니다. 내보내진 기호에 대한 메타데이터에 사전 예방적으로 오류 노드를 포함합니다.
템플릿 컴파일러는 이러한 기호가 사용될 때 오류를 보고하기 위해 오류 노드를 사용할 수 있습니다.

라이브러리의 클라이언트가 주석에서 기호를 사용하려는 경우, 템플릿 컴파일러는 일반적으로 이를 보고하지 않습니다. 클라이언트가 실제로 기호를 사용할 때 보고됩니다.
이 옵션은 라이브러리의 빌드 단계에서 이러한 오류를 감지할 수 있도록 하며, 예를 들어 Angular 라이브러리 자체 생산에 사용됩니다.

Angular CLI로 생성된 라이브러리 프로젝트에서는 개발 구성 기본값이 `true`입니다.

### `strictInjectionParameters`

`true`인 경우, 주입 유형을 확인할 수 없는 제공된 매개변수에 대해 오류를 보고합니다.
`false`일 경우, `@Injectable`로 표시된 클래스의 생성자 매개변수는 유형을 확인할 수 없을 때 경고를 생성합니다.
권장 값은 `true`이지만 기본값은 `false`입니다.

Angular CLI 명령 `ng new --strict`를 사용할 때 생성된 프로젝트의 구성에서 `true`로 설정됩니다.

### `strictTemplates`

`true`인 경우, [엄격한 템플릿 유형 검사를 활성화합니다](tools/cli/template-typecheck#strict-mode).

이 옵션이 활성화하는 엄격성 플래그를 통해 특정 유형의 엄격한 템플릿 유형 검사를 켜고 끌 수 있습니다.
[템플릿 오류 문제 해결](tools/cli/template-typecheck#troubleshooting-template-errors)을 참조하십시오.

Angular CLI 명령 `ng new --strict`를 사용할 때 새로운 프로젝트의 구성에서 `true`로 설정됩니다.

### `strictStandalone`

`true`인 경우, 컴포넌트, 지시어 또는 파이프가 독립적이지 않은 경우 오류를 보고합니다.

### `trace`

`true`인 경우, 템플릿 컴파일 중 추가 정보를 출력합니다.
기본값은 `false`입니다.

## 명령줄 옵션

대부분의 경우, Angular 컴파일러와 간접적으로 상호 작용하는 [Angular CLI](reference/configs/angular-compiler-options)를 사용합니다. 특정 문제를 디버깅할 때 Angular 컴파일러를 직접 호출하는 것이 유용할 수 있습니다.
커맨드 라인에서 컴파일러를 호출하기 위해 `@angular/compiler-cli` npm 패키지에서 제공하는 `ngc` 명령을 사용할 수 있습니다.

`ngc` 명령은 TypeScript의 `tsc` 컴파일러 명령을 감싸는 래퍼입니다. Angular 컴파일러는 주로 `tsconfig.json`을 통해 구성되며 Angular CLI는 주로 `angular.json`을 통해 구성됩니다.

구성 파일 외에도 [`tsc` 명령줄 옵션](https://www.typescriptlang.org/docs/handbook/compiler-options.html)을 사용하여 `ngc`를 구성할 수 있습니다.

[GuideI18nCommonPrepareMarkTextInComponentTemplate]: guide/i18n/prepare#mark-text-in-component-template "컴포넌트 템플릿에서 텍스트 표시 - 번역을 위한 구성 요소 준비 | Angular"