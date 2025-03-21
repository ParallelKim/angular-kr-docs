# Angular 패키지 형식

이 문서는 Angular 패키지 형식 \(APF\)에 대해 설명합니다.  
APF는 모든 1차 Angular 패키지 \(`@angular/core`, `@angular/material` 등\) 및 대부분의 3자 Angular 라이브러리에서 사용되는 npm 패키지의 구조와 형식에 대한 Angular 특정 사양입니다.

APF는 패키지가 Angular를 사용하는 대부분의 일반적인 시나리오에서 원활하게 작동하도록 합니다.  
APF를 사용하는 패키지는 Angular 팀에서 제공하는 도구 및 더 넓은 JavaScript 생태계와 호환됩니다.  
3자 라이브러리 개발자는 동일한 npm 패키지 형식을 따르는 것이 권장됩니다.

도움말: APF는 Angular의 나머지와 함께 버전 관리되며, 모든 주요 버전이 패키지 형식을 개선합니다.  
버전 13 이전의 사양 버전은 이 [google 문서](https://docs.google.com/document/d/1CZC2rcpxffTDfRDs6p1cfbmKNLA6x5O-NtkJglDaBVs/preview)에서 찾을 수 있습니다.

## 패키지 형식을 명시하는 이유는 무엇입니까?

오늘날 JavaScript 환경에서 개발자는 다양한 방법으로 많은 패키지를 사용하며, 다양한 도구 체인 \(webpack, Rollup, esbuild 등\)을 사용합니다.  
이 도구들은 서로 다른 입력을 이해하고 요구할 수 있습니다 - 일부 도구는 최신 ES 언어 버전을 처리할 수 있는 반면, 다른 도구는 구식 ES 버전을 직접 소비하는 것으로 이익을 볼 수 있습니다.

Angular 배포 형식은 일반적으로 사용되는 모든 개발 도구 및 워크플로를 지원하며, 애플리케이션 페이로드 크기가 작거나 더 빠른 개발 반복 주기 \(빌드 시간\)로 이어지는 최적화에 중점을 둡니다.

개발자는 Angular 패키지 형식으로 패키지를 생성하기 위해 Angular CLI 및 [ng-packagr](https://github.com/ng-packagr/ng-packagr) \(Angular CLI가 사용하는 빌드 도구\)를 사용할 수 있습니다.  
더 많은 세부정보는 [라이브러리 생성](tools/libraries/creating-libraries) 가이드를 참조하십시오.

## 파일 레이아웃

다음 예시는 `@angular/core` 패키지의 파일 레이아웃의 단순화된 버전을 보여주며, 패키지의 각 파일에 대한 설명이 포함되어 있습니다.

```markdown
node_modules/@angular/core
├── README.md
├── package.json
├── index.d.ts
├── fesm2022
│   ├── core.mjs
│   ├── core.mjs.map
│   ├── testing.mjs
│   └── testing.mjs.map
└── testing
    └── index.d.ts
```

이 표는 `node_modules/@angular/core` 아래의 파일 레이아웃을 설명하며, 파일 및 디렉토리의 목적을 설명합니다:

| 파일                                                                                                                                                       | 목적 |
|:---                                                                                                                                                       |:---     |
| `README.md`                                                                                                                                               | 패키지 README, npmjs 웹 UI에서 사용됨.                                                                                                                                                                          |
| `package.json`                                                                                                                                            | 기본 `package.json`, 패키지 자신 및 모든 사용 가능한 진입점 및 코드 형식을 설명합니다. 이 파일에는 런타임 및 도구가 모듈 해상도를 수행하는 데 사용하는 "exports" 매핑이 포함되어 있습니다. |
| `index.d.ts`                                                                                                                                               | 기본 진입점 `@angular/core`에 대한 번들된 `.d.ts` 파일.                                                                                                                                                    |
| `fesm2022/` <br /> &nbsp;&nbsp;─ `core.mjs` <br /> &nbsp;&nbsp;─ `core.mjs.map` <br /> &nbsp;&nbsp;─ `testing.mjs` <br /> &nbsp;&nbsp;─ `testing.mjs.map` | 모든 진입점의 코드를 평면화된 \(FESM\) ES2022 형식으로 소스 맵과 함께 제공합니다.                                                                                                                           |
| `testing/`                                                                                                                                                | "testing" 진입점을 나타내는 디렉토리.                                                                                                                                                               |
| `testing/index.d.ts`                                                                                                                                    | `@angular/core/testing` 진입점에 대한 번들된 `.d.ts`.                                                                                                                                                     |

## `package.json`

기본 `package.json`은 다음을 포함하는 중요한 패키지 메타데이터를 포함합니다:

* 패키지가 EcmaScript Module \(ESM\) 형식이라고 [선언합니다](#esm-declaration)
* 모든 진입점의 사용 가능한 소스 코드 형식을 정의하는 [`"exports"` 필드](#exports)가 포함됩니다.
* `"exports"`를 이해하지 못하는 도구를 위한 기본 `@angular/core` 진입점의 사용 가능한 소스 코드 형식을 정의하는 [키](#legacy-resolution-keys)가 포함됩니다.  
  이러한 키는 더 이상 사용되지 않는 것으로 간주되며, `"exports"`에 대한 지원이 생태계 전반에 걸쳐 늘어남에 따라 제거될 수 있습니다.
* 패키지가 [부작용](#side-effects)을 포함하는지를 선언합니다.

### ESM 선언

최상위 `package.json`에는 다음 키가 포함되어 있습니다:

<docs-code language="javascript">

{
  "type": "module"
}

</docs-code>

이는 해결자에게 패키지 내 코드가 CommonJS 모듈이 아닌 EcmaScript 모듈을 사용하고 있음을 알립니다.

### `"exports"`

`"exports"` 필드는 다음 구조를 가집니다:

<docs-code language="javascript">

"exports": {
  "./schematics/*": {
    "default": "./schematics/*.js"
  },
  "./package.json": {
    "default": "./package.json"
  },
  ".": {
    "types": "./core.d.ts",
    "default": "./fesm2022/core.mjs"
  },
  "./testing": {
    "types": "./testing/testing.d.ts",
    "default": "./fesm2022/testing.mjs"
  }
}

</docs-code>

주요 관심사는 `"."` 및 `"./testing"` 키로, 이는 각각 `@angular/core` 기본 진입점과 `@angular/core/testing` 보조 진입점의 사용 가능한 코드 형식을 정의합니다.  
각 진입점에 대해 사용 가능한 형식은 다음과 같습니다:

| 형식                   | 세부정보 |
|:---                       |:---     |
| 타입 정의 \(`.d.ts` 파일\) | `.d.ts` 파일은 주어진 패키지에 의존할 때 TypeScript에서 사용됩니다.                                                                                                           |
| `default`               | 단일 소스로 평면화된 ES2022 코드입니다.

이러한 키를 인식하는 도구는 `"exports"`에서 바람직한 코드 형식을 선택할 수 있습니다.

라이브러리는 Sass 믹스인 또는 미리 컴파일된 CSS와 같은 JavaScript 기반 진입점 내에서 캡처되지 않은 추가 정적 파일을 노출하고 싶을 수 있습니다.

자세한 정보는 [라이브러리에서 자산 관리하기](tools/libraries/creating-libraries#managing-assets-in-a-library)를 참조하십시오.

### 레거시 해상도 키

`"exports"` 외에도 최상위 `package.json`은 `"exports"`를 지원하지 않는 해석기를 위해 레거시 모듈 해상도 키도 정의합니다.  
`@angular/core`의 경우 이러한 키는 다음과 같습니다:

<docs-code language="javascript">

{
  "module": "./fesm2022/core.mjs",
  "typings": "./core.d.ts",
}

</docs-code>

앞의 코드 조각에 표시된 대로, 모듈 해석기는 이러한 키를 사용하여 특정 코드 형식을 로드할 수 있습니다.

### 부작용

`package.json`의 마지막 기능은 패키지가 [부작용](#sideeffects-flag)을 가지고 있는지를 선언하는 것입니다.

<docs-code language="javascript">

{
  "sideEffects": false
}

</docs-code>

대부분의 Angular 패키지는 최상위 부작용에 의존하지 않아야 하므로 이 선언을 포함해야 합니다.

## 진입점 및 코드 분할

Angular 패키지 형식의 패키지는 하나의 기본 진입점과 0개 이상의 보조 진입점을 포함합니다 \(예: `@angular/common/http`\).  
진입점은 여러 기능을 수행합니다.

1. 사용자가 코드 \(예: `@angular/core` 및 `@angular/core/testing`\)를 가져오는 모듈 식별자를 정의합니다.

    사용자는 일반적으로 이러한 진입점을 기호의 다양한 목적 또는 기능을 가진 개별 그룹으로 인식합니다.

    특정 진입점은 테스트와 같은 특별한 목적에만 사용될 수 있습니다.  
    이러한 API는 기본 진입점에서 분리되어 우연히 또는 잘못 사용될 가능성을 줄입니다.

2. 코드가 지연 로드될 수 있는 세분성을 정의합니다.

    많은 현대 빌드 도구는 ES 모듈 레벨에서만 "코드 분할" \(즉, 지연 로드\)을 수행할 수 있습니다.  
    Angular 패키지 형식은 주로 각 진입점당 하나의 "평면" ES 모듈을 사용합니다. 즉, 대부분의 빌드 도구는 단일 진입점을 사용하여 코드를 여러 출력 청크로 분할할 수 없습니다.

APF 패키지에 대한 일반 규칙은 가능한 최소의 논리적으로 연결된 코드 세트를 위해 진입점을 사용하는 것입니다.  
예를 들어, Angular Material 패키지는 각 논리적 구성 요소 또는 구성 요소 집합을 별도의 진입점으로 게시합니다 - 버튼용 하나, 탭용 하나 등.  
이렇게 하면 각 Material 구성 요소를 선택적으로 지연 로드할 수 있습니다.

모든 라이브러리가 이러한 세분성을 요구하는 것은 아닙니다.  
단일 논리적 목적을 가진 대부분의 라이브러리는 단일 진입점으로 게시해야 합니다.  
예를 들어 `@angular/core`는 런타임에 대해 단일 진입점을 사용합니다. 이는 Angular 런타임이 일반적으로 단일 엔터티로 사용되기 때문입니다.

### 보조 진입점의 해상도

보조 진입점은 패키지의 `package.json`의 `"exports"` 필드를 통해 해석할 수 있습니다.

## README.md

README 파일은 npm 및 GitHub에서 패키지의 설명을 표시하는 데 사용되는 Markdown 형식입니다.

`@angular/core` 패키지의 예시 README 내용:

<docs-code language="html">

Angular
&equals;&equals;&equals;&equals;&equals;&equals;&equals;

이 패키지의 소스는 주요 [Angular](https://github.com/angular/angular) 레포지토리에 있습니다.  
문제 및 풀 리퀘스트는 해당 레포지토리에 제출해 주세요.

라이센스: MIT

</docs-code>

## 부분 컴파일

Angular 패키지 형식의 라이브러리는 "부분 컴파일" 모드로 게시해야 합니다.  
이는 특정 Angular 런타임 버전과 연결되지 않는 컴파일된 Angular 코드를 생성하는 `ngc`의 컴파일 모드로, 애플리케이션에 사용되는 전체 컴파일과는 대조됩니다.

Angular 코드를 부분적으로 컴파일하려면 `tsconfig.json`의 `angularCompilerOptions` 속성에 `compilationMode` 플래그를 사용하십시오:

<docs-code language="javascript">

{
  …
  "angularCompilerOptions": {
    "compilationMode": "partial",
  }
}

</docs-code>

부분적으로 컴파일된 라이브러리 코드는 Angular CLI에 의해 애플리케이션 빌드 과정에서 완전한 컴파일된 코드로 변환됩니다.

귀하의 빌드 파이프라인이 Angular CLI를 사용하지 않는 경우, [Angular CLI 외부에서 부분 ivy 코드 소비하기](tools/libraries/creating-libraries#consuming-partial-ivy-code-outside-the-angular-cli) 가이드를 참조하십시오.

## 최적화

### ES 모듈 평면화

Angular 패키지 형식은 코드가 "평면화된" ES 모듈 형식으로 게시되도록 지정합니다.  
이는 Angular 애플리케이션의 빌드 시간뿐만 아니라 최종 애플리케이션 번들의 다운로드 및 구문 분석 시간을 상당히 줄입니다.  
Nolan Lawson의 훌륭한 포스트 ["The cost of small modules"](https://nolanlawson.com/2016/08/15/the-cost-of-small-modules)를 확인해 주세요.

Angular 컴파일러는 인덱스 ES 모듈 파일을 생성할 수 있습니다. Rollup와 같은 도구는 이러한 파일을 사용하여 평면화된 모듈을 *Flattened ES Module* \(FESM\) 파일 형식으로 생성할 수 있습니다.

FESM은 진입점에서 접근 가능한 모든 ES 모듈을 단일 ES 모듈로 평면화하여 생성된 파일 형식입니다.  
이는 패키지에서 모든 가져오기 경로를 따라 해당 코드를 단일 파일로 복사하면서 모든 공개 ES 내보내기를 보존하고 모든 비공식 가져입을 제거하여 형성됩니다.

약어 이름인 FESM, 발음은 *phe-som*,은 FESM2020과 같은 숫자가 뒤따를 수 있습니다.  
숫자는 모듈 내 JavaScript의 언어 수준을 나타냅니다.  
따라서 FESM2022 파일은 ESM+ES2022가 되며 가져오기/내보내기 선언 및 ES2022 소스 코드를 포함합니다.

평면화된 ES 모듈 인덱스 파일을 생성하려면 `tsconfig.json` 파일에서 다음 구성 옵션을 사용하십시오:

<docs-code language="javascript">

{
  "compilerOptions": {
    …
    "module": "esnext",
    "target": "es2022",
    …
  },
  "angularCompilerOptions": {
    …
    "flatModuleOutFile": "my-ui-lib.js",
    "flatModuleId": "my-ui-lib"
  }
}

</docs-code>

인덱스 파일 \(예: `my-ui-lib.js`\)이 ngc에 의해 생성된 후에는 Rollup과 같은 번들러 및 최적화 도구를 사용하여 평면화된 ESM 파일을 생성할 수 있습니다.

### "sideEffects" 플래그

기본적으로, EcmaScript 모듈은 부작용이 있습니다: 모듈에서 가져오면 해당 모듈의 최상위 코드가 실행됩니다.  
이는 종종 바람직하지 않으며, 일반적인 모듈에서 대부분의 부작용 코드가 실제로 부작용이 아니고 특정 기호에만 영향을 미치기 때문입니다.  
이러한 기호가 임포트되고 사용되지 않는 경우, 나무 흔들기(tree-shaking)라는 최적화 과정에서 이를 제거하는 것이 바람직하며, 부작용 코드는 이를 방해할 수 있습니다.

webpack과 같은 빌드 도구는 패키지가 모듈의 최상위에서 부작용 코드에 의존하지 않음을 선언할 수 있는 플래그를 지원하여, 도구가 패키지에서 코드를 나무 흔들 수 있는 더 많은 자유를 줍니다.  
이러한 최적화의 최종 결과는 코드 분할 후 번들 청크에서 더 작은 번들 크기와 더 나은 코드 분포입니다.  
이 최적화는 비지역적 부작용이 포함된 코드를 손상시킬 수 있으나 - 이는 Angular 애플리케이션에서 일반적이지 않으며, 보통 나쁜 설계의 징후입니다.  
모든 패키지가 `sideEffects` 속성을 `false`로 설정하여 부작용 없는 상태를 주장하는 것이 권장되며, 개발자는 자연스럽게 비지역적 부작용이 없는 코드를 생성하는 [Angular 스타일 가이드](/style-guide)를 따라야 합니다.

자세한 정보: [부작용에 대한 webpack 문서](https://github.com/webpack/webpack/tree/master/examples/side-effects)

### ES2022 언어 수준

ES2022 언어 수준은 이제 Angular CLI 및 기타 도구에서 소비되는 기본 언어 수준입니다.  
Angular CLI는 애플리케이션 빌드 시간에 모든 대상 브라우저에서 지원되는 언어 수준으로 번들을 다운 레벨합니다.

### d.ts 번들링 / 타입 정의 평면화

APF v8부터는 TypeScript 정의를 번들링하는 것이 권장됩니다.  
타입 정의의 번들링은 특히 라이브러리에 많은 개별 `.ts` 소스 파일이 있는 경우 사용자에게 컴파일 속도를 크게 높일 수 있습니다.

Angular는 [`rollup-plugin-dts`](https://github.com/Swatinem/rollup-plugin-dts)를 사용하여 `.d.ts` 파일을 평면화합니다 \(FESM 파일이 생성되는 방식과 유사하게\).

`.d.ts` 번들링을 위해 Rollup을 사용하는 것은 진입점 간 코드 분할을 지원하므로 유리합니다.  
예를 들어, 여러 진입점이 동일한 공유 타입에 의존하는 경우, 공유 `.d.ts` 파일과 함께 더 큰 평면화된 `.d.ts` 파일이 생성됩니다.  
이는 바람직하며 유형 중복을 피할 수 있습니다.

### Tslib

APF v10부터는 기본 진입점의 직접적인 종속성으로 tslib를 추가하는 것이 권장됩니다.  
이는 tslib 버전이 라이브러리를 컴파일하는 데 사용된 TypeScript 버전과 연결되어 있기 때문입니다.

## 예제

<docs-pill-row>
  <docs-pill href="https://unpkg.com/browse/@angular/core@17.0.0/" title="@angular/core 패키지"/>
  <docs-pill href="https://unpkg.com/browse/@angular/material@17.0.0/" title="@angular/material 패키지"/>
</docs-pill-row>

## 용어 정의

이 문서 전체에서 의도적으로 사용되는 다음 용어들이 있습니다.  
이 섹션에서는 모두에 대한 정의를 제공하여 추가적인 명확성을 부여합니다.

### 패키지

NPM에 게시되고 함께 설치되는 가장 작은 파일 세트입니다. 예를 들어 `@angular/core`.  
이 패키지에는 package.json이라는 매니페스트, 컴파일된 소스 코드, TypeScript 정의 파일, 소스 맵, 메타데이터 등이 포함됩니다.  
패키지는 `npm install @angular/core`를 사용하여 설치됩니다.

### 기호

모듈에 포함된 클래스, 함수, 상수 또는 변수를 의미하며, 모듈 내보내기를 통해 외부 세계에 선택적으로 표시될 수 있습니다.

### 모듈

ECMAScript 모듈의 약자입니다.  
기호를 가져오고 내보내는 명령어가 포함된 파일입니다.  
이는 ECMAScript 사양의 모듈 정의와 동일합니다.

### ESM

ECMAScript 모듈의 약자입니다 \(위 참조\).

### FESM

평면화된 ES 모듈의 약자이며, 진입점에서 접근 가능한 모든 ES 모듈을 단일 ES 모듈로 평면화하여 생성된 파일 형식을 가진 것입니다.

### 모듈 ID

가져오기 명령문에서 사용하는 모듈의 식별자입니다 \(예: `@angular/core`\).  
이 ID는 종종 파일 시스템의 경로와 직접적으로 매핑되지만, 여러 모듈 해상도 전략으로 인해 항상 그런 것은 아닙니다.

### 모듈 식별자

모듈 식별자 \(위 참조\).

### 모듈 해상도 전략

모듈 ID를 파일 시스템 경로로 변환하는 데 사용되는 알고리즘입니다.  
Node.js는 잘 정의되고 널리 사용되는 모듈 해상도 전략을 가지고 있으며, TypeScript는 여러 모듈 해상도 전략을 지원하고, [Closure Compiler](https://developers.google.com/closure/compiler)에는 또 다른 전략이 있습니다.

### 모듈 형식

파일에서의 가져오기 및 내보내기를 위한 구문을 최소한으로 포함하는 모듈 구문의 사양입니다.  
일반적인 모듈 형식은 CommonJS \(CJS, 일반적으로 Node.js 애플리케이션에 사용됨\) 또는 ECMAScript 모듈 \(ESM\)입니다.  
모듈 형식은 개별 모듈의 패키징만 나타내며 모듈 내용을 구성하는 데 사용되는 JavaScript 언어 기능은 나타내지 않습니다.  
이 때문에 Angular 팀은 종종 언어 수준 지정자를 모듈 형식의 접미사로 사용합니다 \(예: ESM+ES2022는 모듈이 ESM 형식이며 ES2022 코드를 포함한다고 명시합니다\).

### 번들

하나 이상의 모듈에서 기원한 기호를 포함하는 단일 JS 파일 형태의 산출물이며, 빌드 도구 \(예: [webpack](https://webpack.js.org) 또는 [Rollup](https://rollupjs.org)\)에 의해 생성됩니다.  
번들은 수백 개, 수천 개의 파일을 다운로드하기 시작할 경우 브라우저에 의해 발생할 네트워크 부담을 줄이는 브라우저 특정 우회 방법입니다.  
Node.js는 일반적으로 번들을 사용하지 않습니다.  
일반적인 번들 형식은 UMD 및 System.register입니다.

### 언어 수준

코드의 언어 \(ES2022\).  
모듈 형식과는 무관합니다.

### 진입점

사용자가 가져오도록 의도된 모듈입니다.  
고유한 모듈 ID로 참조되며, 해당 모듈 ID에서 참조되는 공개 API를 내보냅니다.  
예시는 `@angular/core` 또는 `@angular/core/testing`입니다.  
두 진입점은 `@angular/core` 패키지에 존재하지만 서로 다른 기호를 내보냅니다.  
패키지는 여러 진입점을 가질 수 있습니다.

### 딥 임포트

진입점이 아닌 모듈에서 기호를 검색하는 과정을 의미합니다.  
이러한 모듈 ID는 일반적으로 프로젝트의 생애 주기 동안 변경될 수 있는 비공식 API로 간주됩니다.

### 최상위 임포트

진입점에서 오는 임포트입니다.  
사용 가능한 최상위 임포트는 공개 API를 정의하며 "@angular/name" 모듈에서 노출됩니다. 예를 들어 `@angular/core` 또는 `@angular/common`입니다.

### 나무 흔들기

응용 프로그램에서 사용되지 않는 코드를 식별하고 제거하는 과정입니다 - 즉, 죽은 코드 제거로도 알려져 있습니다.  
이는 [Rollup](https://rollupjs.org), [Closure Compiler](https://developers.google.com/closure/compiler), 또는 [Terser](https://github.com/terser/terser)와 같은 도구를 사용하여 수행되는 글로벌 최적화입니다.

### AOT 컴파일러

Angular의 Ahead of Time 컴파일러입니다.

### 평면화된 타입 정의

[API Extractor](https://api-extractor.com)에서 생성된 번들 타입스크립트 정의입니다.