# 스키마 작성

Angular 프로젝트에서 작동하는 자체 스키마를 만들 수 있습니다.  
라이브러리 개발자는 일반적으로 스키마를 라이브러리와 함께 패키징하여 Angular CLI와 통합합니다.  
또한 Angular 애플리케이션의 파일과 구성 요소를 조작할 수 있는 독립적인 스키마를 만들어 개발 환경에 맞게 사용자화하고 표준과 제약 조건에 맞출 수 있습니다.  
스키마는 체이닝할 수 있으며, 복잡한 작업을 수행하기 위해 다른 스키마를 실행합니다.

애플리케이션의 코드를 조작하는 것은 매우 강력할 수 있지만 그에 상응하는 위험도 따릅니다.  
예를 들어, 이미 존재하는 파일을 생성하는 것은 오류를 발생시키며, 즉시 적용되면 지금까지 적용된 모든 다른 변경 사항이 폐기됩니다.  
Angular 스키마 툴은 가상 파일 시스템을 생성하여 부작용과 오류로부터 보호합니다.  
스키마는 가상 파일 시스템에 적용할 수 있는 변환의 파이프라인을 설명합니다.  
스키마가 실행되면 변환이 메모리에 기록되고, 유효성이 확인되면 실제 파일 시스템에 적용됩니다.

## 스키마 개념

스키마의 공개 API는 기본 개념을 나타내는 클래스를 정의합니다.

* 가상 파일 시스템은 `Tree`로 나타납니다.  
  `Tree` 데이터 구조는 *기본* \(이미 존재하는 파일 집합\)과 *스테이징 영역* \(기본에 적용할 변경 목록\)을 포함합니다.  
  수정할 때는 실제로 기본을 변경하지 않고 그 수정 사항을 스테이징 영역에 추가합니다.

* `Rule` 객체는 `Tree`를 받아 변환을 적용하고 새로운 `Tree`를 반환하는 함수를 정의합니다.  
  스키마에 대한 주 파일인 `index.ts`는 스키마의 논리를 구현하는 규칙 세트를 정의합니다.

* 변환은 `Action`으로 나타납니다.  
  네 가지 액션 유형이 있습니다: `Create`, `Rename`, `Overwrite`, 및 `Delete`.

* 각 스키마는 `SchematicContext` 객체로 표현되는 컨텍스트에서 실행됩니다.

규칙에 전달된 컨텍스트 객체는 스키마가 작업하는 데 필요할 수 있는 유틸리티 함수 및 메타데이터에 대한 접근을 제공합니다. 여기에는 디버깅을 도와주는 로깅 API도 포함됩니다.  
컨텍스트는 또한 변화가 스테이징 트리에서 기본 트리로 어떻게 병합될지를 결정하는 *병합 전략*을 정의합니다.  
변화는 수용하거나 무시할 수 있으며, 예외를 던질 수도 있습니다.

### 규칙 및 행동 정의

[스키마 CLI](#schematics-cli)를 사용하여 새로운 빈 스키마를 생성할 때, 생성된 진입 함수는 *규칙 팩토리*입니다.  
`RuleFactory` 객체는 `Rule`을 생성하는 고차 함수입니다.

<docs-code header="index.ts" language="typescript">

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

// 함수를 기본적으로 내보낼 필요는 없습니다.
// 파일당 하나 이상의 규칙 팩토리를 가질 수도 있습니다.
export function helloWorld(_options: any): Rule {
 return (tree: Tree,_context: SchematicContext) => {
   return tree;
 };
}

</docs-code>

규칙은 외부 도구를 호출하고 논리를 구현하여 프로젝트를 변경할 수 있습니다.  
예를 들어, 스키마의 템플릿이 호스팅 프로젝트에 어떻게 병합되는지를 정의하는 규칙이 필요합니다.

규칙은 `@schematics/angular` 패키지와 함께 제공되는 유틸리티를 사용할 수 있습니다.  
모듈, 종속성, TypeScript, AST, JSON, Angular CLI 작업공간 및 프로젝트와 함께 작업할 수 있는 헬퍼 함수를 찾아보세요.

<docs-code header="index.ts" language="typescript">

import {
  JsonAstObject,
  JsonObject,
  JsonValue,
  Path,
  normalize,
  parseJsonAst,
  strings,
} from '@angular-devkit/core';

</docs-code>

### 스키마 및 인터페이스로 입력 옵션 정의

규칙은 호출자로부터 옵션 값을 수집하고 이를 템플릿에 주입할 수 있습니다.  
규칙에서 사용할 수 있는 옵션과 해당 허용 값 및 기본값은 스키마의 JSON 스키마 파일 `<schematic>/schema.json`에서 정의됩니다.  
TypeScript 인터페이스를 사용하여 스키마의 변수를 정의하십시오.

스키마는 스키마에서 사용되는 변수의 유형과 기본값을 정의합니다.  
예를 들어, 가상 "Hello World" 스키마는 다음과 같은 스키마를 가질 수 있습니다.

<docs-code header="src/hello-world/schema.json" language="json">

{
    "properties": {
        "name": {
            "type": "string",
            "minLength": 1,
            "default": "world"
        },
        "useColor": {
            "type": "boolean"
        }
    }
}
</docs-code>

Angular CLI 명령 스키마에 대한 스키마 파일 예시는 [`@schematics/angular`](https://github.com/angular/angular-cli/blob/main/packages/schematics/angular/application/schema.json)에서 확인할 수 있습니다.

### 스키마 프롬프트

스키마 *프롬프트*는 스키마 실행에 사용자 상호작용을 도입합니다.  
스키마 옵션을 구성하여 사용자에게 맞춤형 질문을 표시할 수 있습니다.  
프롬프트는 스키마 실행 전에 표시되며, 그 다음 응답을 옵션의 값으로 사용합니다.  
이를 통해 사용자는 사용할 수 있는 모든 옵션의 전체 범위에 대한 깊은 지식 없이도 스키마의 동작을 안내할 수 있습니다.

예를 들어, "Hello World" 스키마는 사용자에게 이름을 묻고, 그 이름을 기본 이름 "world" 대신 표시할 수 있습니다.  
이런 프롬프트를 정의하려면 `name` 변수의 스키마에 `x-prompt` 속성을 추가하십시오.

유사하게, 스키마가 hello 작업을 실행할 때 색상을 사용할지 여부를 결정하도록 사용자가 선택할 수 있도록 하는 프롬프트를 추가할 수 있습니다.  
두 프롬프트가 모두 포함된 스키마는 다음과 같습니다.

<docs-code header="src/hello-world/schema.json" language="json">

{
    "properties": {
        "name": {
            "type": "string",
            "minLength": 1,
            "default": "world",
            "x-prompt": "당신의 이름은 무엇입니까?"
        },
        "useColor": {
            "type": "boolean",
            "x-prompt": "응답을 색상으로 표시하시겠습니까?"
        }
    }
}
</docs-code>

#### 프롬프트 단축 형식 구문

이 예제는 질문의 텍스트만 제공하는 프롬프트 구문의 단축 형식을 사용합니다.  
대부분의 경우, 이게 필요한 전부입니다.  
그러나 두 프롬프트는 서로 다른 유형의 입력을 기대한다는 점에 유의하세요.  
단축 형식을 사용할 때, 해당 속성의 스키마에 따라 가장 적합한 유형이 자동으로 선택됩니다.  
예제에서는 `name` 프롬프트가 문자열 속성이므로 `input` 유형을 사용합니다.  
`useColor` 프롬프트는 불리언 속성이므로 `confirmation` 유형을 사용합니다.  
이 경우 "yes"는 `true`에 해당하고 "no"는 `false`에 해당합니다.

지원되는 입력 유형은 세 가지입니다.

| 입력 유형   | 세부사항 |
|:---          |:----    |
| confirmation | 예 또는 아니오 질문; 불리언 옵션에 가장 적합합니다.   |
| input        | 텍스트 입력; 문자열 또는 숫자 옵션에 가장 적합합니다. |
| list         | 허용된 값의 미리 정의된 집합입니다.                |

단축 형식에서는 유형이 속성의 유형과 제약 조건에서 유추됩니다.

| 속성 스키마 | 프롬프트 유형 |
|:---             |:---         |
| "type": "boolean"  | confirmation \("yes"=`true`, "no"=`false`\)  |
| "type": "string"   | input                                        |
| "type": "number"   | input \(유효한 숫자만 수용\)        |
| "type": "integer"  | input \(유효한 숫자만 수용\)        |
| "enum": […] | list \(enum 구성 요소는 목록 선택이 됨\) |

다음 예제에서는 속성이 열거형 값을 취하므로, 스키마는 자동으로 목록 유형을 선택하고 가능한 값에서 메뉴를 생성합니다.

<docs-code header="schema.json" language="json">

"style": {
  "description": "스타일 파일에 사용할 파일 확장자 또는 전처리기.",
  "type": "string",
  "default": "css",
  "enum": [
    "css",
    "scss",
    "sass",
    "less",
    "styl"
  ],
  "x-prompt": "어떤 스타일시트 형식을 사용하시겠습니까?"
}

</docs-code>

프롬프트 런타임은 JSON 스키마에 제공된 제약 조건에 따라 제공된 응답을 자동으로 검증합니다.  
값이 허용되지 않으면 사용자는 새로운 값을 다시 요청받습니다.  
이렇게 하면 스키마에 전달된 모든 값이 스키마의 구현 기대사항을 충족하여 추가적인 검사 없이 스키마 코드 내에서 작업할 수 있습니다.

#### 프롬프트 장황 형태 구문

`x-prompt` 필드 구문은 프롬프트의 사용자 맞춤형 정의 및 동작 제어가 추가로 필요한 경우 더 긴 형식을 지원합니다.  
이 형식에서는 `x-prompt` 필드 값이 프롬프트의 동작을 사용자 정의하는 하위 필드를 가진 JSON 객체입니다.

| 필드   | 데이터 값 |
|:---     |:---        |
| type    | `confirmation`, `input`, 또는 `list` \(단축 형식에서 자동 선택\) |
| message | 문자열 \(필수\)                                                         |
| items   | 문자열 및/또는 레이블/값 쌍 객체 \(유형 `list`에서만 유효\)       |

장황형식의 다음 예제는 CLI가 응용 프로그램을 생성하는 데 사용하는 스키마의 JSON 스키마에서 가져온 것입니다.  
응용 프로그램을 생성할 때 사용자가 원하는 스타일 전처리기를 선택하는 프롬프트를 정의합니다.  
장황형식을 사용하면 스키마는 메뉴 선택의 형식을 더 명확하게 제공할 수 있습니다.

<docs-code header="package/schematics/angular/application/schema.json" language="json">

"style": {
  "description": "스타일 파일에 사용할 파일 확장자 또는 전처리기.",
  "type": "string",
  "default": "css",
  "enum": [
    "css",
    "scss",
    "sass",
    "less"
  ],
  "x-prompt": {
    "message": "어떤 스타일시트 형식을 사용하시겠습니까?",
    "type": "list",
    "items": [
      { "value": "css",  "label": "CSS" },
      { "value": "scss", "label": "SCSS   [ https://sass-lang.com/documentation/syntax#scss                ]" },
      { "value": "sass", "label": "Sass   [ https://sass-lang.com/documentation/syntax#the-indented-syntax ]" },
      { "value": "less", "label": "Less   [ https://lesscss.org/                                            ]" }
    ]
  },
},

</docs-code>

#### x-prompt 스키마

스키마의 옵션을 정의하는 JSON 스키마는 프롬프트의 선언적 정의 및 각기 다른 동작을 허용하는 확장을 지원합니다.  
프롬프트를 지원하기 위해 스키마의 코드에 추가적인 논리나 변경이 필요하지 않습니다.  
다음 JSON 스키마는 `x-prompt` 필드의 장황형식 구문에 대한 완벽한 설명입니다.

<docs-code header="x-prompt schema" language="json">

{
    "oneOf": [
        { "type": "string" },
        {
            "type": "object",
            "properties": {
                "type": { "type": "string" },
                "message": { "type": "string" },
                "items": {
                    "type": "array",
                    "items": {
                        "oneOf": [
                            { "type": "string" },
                            {
                                "type": "object",
                                "properties": {
                                    "label": { "type": "string" },
                                    "value": { }
                                },
                                "required": [ "value" ]
                            }
                        ]
                    }
                }
            },
            "required": [ "message" ]
        }
    ]
}

</docs-code>

## 스키마 CLI

스키마에는 자체 명령줄 도구가 있습니다.  
Node 6.9 이상을 사용하여 전역적으로 스키마 명령줄 도구를 설치하십시오:

<docs-code language="shell">

npm install -g @angular-devkit/schematics-cli

</docs-code>

이 명령은 새로운 스키마 컬렉션을 생성할 수 있는 `schematics` 실행 파일을 설치합니다.  
이 실행 파일은 고유 프로젝트 폴더를 생성하거나 기존 컬렉션에 새 스키마를 추가하거나 기존 스키마를 확장하는 데 사용할 수 있습니다.

다음 섹션에서는 CLI를 사용하여 새로운 스키마 컬렉션을 생성하여 파일 및 파일 구조 및 기본 개념을 소개합니다.  
그러나 스키마의 가장 일반적인 사용법은 Angular 라이브러리를 Angular CLI와 통합하는 것입니다.  
스키마 CLI를 사용하지 않고 Angular 작업 공간의 라이브러리 프로젝트 내에서 스키마 파일을 직접 생성하여 작업을 수행합니다.  
[라이브러리를 위한 스키마](tools/cli/schematics-for-libraries)를 참조하십시오.

### 스키마 컬렉션 생성

다음 명령을 사용하여 새로운 프로젝트 폴더에 `hello-world`라는 이름의 새로운 스키마를 생성합니다.

<docs-code language="shell">

schematics blank --name=hello-world

</docs-code>

`blank` 스키마는 스키마 CLI에서 제공됩니다.  
이 명령은 새 프로젝트 폴더 \(컬렉션의 루트 폴더\)와 컬렉션 내의 초기 이름 스키마를 생성합니다.

컬렉션 폴더로 이동하고, npm 종속성을 설치한 후 새 컬렉션을 좋아하는 편집기로 열어 생성된 파일을 확인하십시오.  
예를 들어, VS Code를 사용하는 경우:

<docs-code language="shell">

cd hello-world
npm install
npm run build
code .

</docs-code>

초기 스키마는 프로젝트 폴더와 동일한 이름을 가지며 `src/hello-world`에 생성됩니다.  
이 컬렉션에 관련 스키마를 추가하고 생성된 골격 코드를 수정하여 스키마의 기능을 정의하십시오.  
각 스키마 이름은 컬렉션 내에서 고유해야 합니다.

### 스키마 실행

`schematics` 명령을 사용하여 이름이 지정된 스키마를 실행하십시오.  
프로젝트 폴더의 경로, 스키마 이름 및 필수 옵션을 제공해야 합니다. 다음 형식으로 작성하세요.

<docs-code language="shell">

schematics <path-to-schematics-project>:<schematics-name> --<required-option>=<value>

</docs-code>

경로는 현재 작업 디렉토리에 대해 절대 경로일 수도 있고 상대 경로일 수도 있습니다.  
예를 들어, 방금 생성된 스키마를 실행하려면 \(필수 옵션이 없는 경우\) 다음 명령을 사용하십시오.

<docs-code language="shell">

schematics .:hello-world

</docs-code>

### 컬렉션에 스키마 추가

기존 컬렉션에 스키마를 추가하려면 새 스키마 프로젝트를 시작하는 데 사용하는 것과 동일한 명령을 사용하되 프로젝트 폴더 내에서 명령을 실행합니다.

<docs-code language="shell">

cd hello-world
schematics blank --name=goodbye-world

</docs-code>

이 명령은 컬렉션 내에 새로운 이름의 스키마를 생성하며, 기본 `index.ts` 파일과 관련된 테스트 사양 파일을 추가합니다.  
또한 새 스키마의 이름, 설명 및 팩토리 함수를 컬렉션의 스키마인 `collection.json` 파일에 추가합니다.

## 컬렉션 내용

컬렉션의 루트 프로젝트 폴더 최상위에는 구성 파일, `node_modules` 폴더 및 `src/` 폴더가 있습니다.  
`src/` 폴더는 컬렉션 내의 이름이 지정된 스키마에 대한 하위 폴더와 스키마를 설명하는 `collection.json`을 포함합니다.  
각 스키마는 이름, 설명 및 팩토리 함수와 함께 생성됩니다.

<docs-code language="json">

{
  "$schema":
     "../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "hello-world": {
      "description": "빈 스키마입니다.",
      "factory": "./hello-world/index#helloWorld"
    }
  }
}

</docs-code>

* `$schema` 속성은 CLI가 검증을 위해 사용하는 스키마를 지정합니다.  
* `schematics` 속성은 이 컬렉션에 속하는 이름이 지정된 스키마를 나열합니다.  
  각 스키마는 간단한 텍스트 설명을 가지고 있으며 주 파일 내에서 생성된 진입 함수로 포인터를 설정합니다.

* `factory` 속성은 생성된 진입 함수를 가리킵니다.  
  이 예에서는 `hello-world` 스키마를 `helloWorld()` 팩토리 함수를 호출하여 사용할 수 있습니다.

* 선택적 `schema` 속성은 스키마에 사용할 수 있는 명령줄 옵션을 정의하는 JSON 스키마 파일을 가리킵니다.  
* 선택적 `aliases` 배열은 스키마를 호출할 수 있는 하나 이상의 문자열을 지정합니다.  
  예를 들어, Angular CLI "generate" 명령에 대한 스키마는 "g"라는 별칭을 가지고 있어 사용자가 `ng g` 명령을 사용할 수 있게 합니다.

### 이름이 지정된 스키마

스키마 CLI를 사용하여 빈 스키마 프로젝트를 생성할 때 새로운 빈 스키마는 컬렉션의 첫 번째 구성원이자 컬렉션과 동일한 이름을 가집니다.  
이 컬렉션에 새로운 이름의 스키마를 추가하면 자동으로 `collection.json` 스키마에 추가됩니다.

이름, 설명 외에도 각 스키마에는 스키마의 진입점을 식별하는 `factory` 속성이 있습니다.  
예제를 통해 스키마의 정의된 기능을 `hello-world/index.ts`의 `helloWorld()` 함수를 호출하여 사용할 수 있습니다.

<img alt="overview" src="assets/images/guide/schematics/collection-files.gif">

컬렉션 내의 각 이름이 지정된 스키마는 다음과 같은 주요 부분으로 구성됩니다.

| 구성 요소          | 세부 정보 |
|:---            |:---     |
| `index.ts`     | 이름이 지정된 스키마의 변환 논리를 정의하는 코드입니다.  |
| `schema.json`  | 스키마 변수 정의입니다.                                     |
| `schema.d.ts`  | 스키마 변수입니다.                                               |
| `files/`       | 복제할 선택적 구성 요소/템플릿 파일입니다.                    |

스키마는 추가적인 템플릿 없이 `index.ts` 파일에 모든 논리를 제공할 수 있습니다.  
그러나 Angular용 동적 스키마를 생성할 수 있으며, 이를 위해 `files` 폴더에 구성 요소와 템플릿을 제공하여 독립형 Angular 프로젝트의 예와 같이 만들 수 있습니다.  
인덱스 파일의 논리는 이러한 템플릿을 데이터 주입 및 변수 수정을 정의하는 규칙을 통해 구성합니다.