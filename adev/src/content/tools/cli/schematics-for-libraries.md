# 라이브러리 스키매틱

Angular 라이브러리를 만들 때, Angular CLI와 통합되는 스키매틱을 제공하고 패키징할 수 있습니다. 
당신의 스키매틱을 사용하면 사용자가 `ng add`를 통해 라이브러리의 초기 버전을 설치하고,
`ng generate`를 통해 라이브러리에 정의된 아티팩트를 생성하며, `ng update`를 사용하여 프로젝트를 새 버전의 라이브러리에 맞게 조정할 수 있습니다. 
이 과정에서 라이브러리가 파괴적인 변경사항을 도입합니다.

세 가지 유형의 스키매틱은 모두 라이브러리와 함께 패키징되는 컬렉션의 일부가 될 수 있습니다.

## 스키매틱 컬렉션 만들기

컬렉션을 시작하려면, 스키매틱 파일을 생성해야 합니다. 
다음 단계를 통해 프로젝트 파일을 수정하지 않고 초기 지원을 추가하는 방법을 보여줍니다.

1. 라이브러리의 루트 폴더에서 `schematics` 폴더를 생성합니다.
1. `schematics/` 폴더 내에 첫 번째 스키매틱을 위한 `ng-add` 폴더를 생성합니다.
1. `schematics` 폴더의 루트 수준에서 `collection.json` 파일을 생성합니다.
1. `collection.json` 파일을 편집하여 컬렉션의 초기 스키마를 정의합니다.

    <docs-code header="projects/my-lib/schematics/collection.json (스키매틱 컬렉션)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/collection.1.json"/>

    * `$schema` 경로는 Angular Devkit 컬렉션 스키마에 상대적입니다.
    * `schematics` 객체는 이 컬렉션의 일부인 명명된 스키매틱을 설명합니다.
    * 첫 번째 항목은 `ng-add`라는 이름의 스키매틱에 대한 것입니다. 
        이 스키매틱은 설명을 포함하고, 스키매틱이 실행될 때 호출되는 공장 함수에 대한 포인터를 포함합니다.

1. 라이브러리 프로젝트의 `package.json` 파일에 스키마 파일의 경로를 가진 "schematics" 항목을 추가합니다.
    Angular CLI는 이 항목을 사용하여 명명된 스키매틱을 찾습니다.

    <docs-code header="projects/my-lib/package.json (스키매틱 컬렉션 참조)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/package.json" visibleRegion="collection"/>

당신이 생성한 초기 스키마는 CLI가 `ng add` 명령을 지원하는 스키매틱을 찾는 위치를 알려줍니다.
이제 그 스키매틱을 생성할 준비가 되었습니다.

## 설치 지원 제공

`ng add` 명령에 대한 스키매틱은 사용자의 초기 설치 프로세스를 향상시킬 수 있습니다.
다음 단계는 이 유형의 스키매틱을 정의합니다.

1. `<lib-root>/schematics/ng-add` 폴더로 이동합니다.
1. 주요 파일인 `index.ts`를 생성합니다.
1. `index.ts`를 열고 스키매틱 공장 함수의 소스 코드를 추가합니다.

    <docs-code header="projects/my-lib/schematics/ng-add/index.ts (ng-add 규칙 공장)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/ng-add/index.ts"/>

Angular CLI는 라이브러리의 최신 버전을 자동으로 설치하며, 이 예시는 애플리케이션의 루트에 `MyLibModule`을 추가하는 한 단계 더 나아갑니다. `addRootImport` 함수는 코드 블록을 반환해야 하는 콜백을 받아들입니다. `code` 함수로 태그가 지정된 문자열 내부에 어떤 코드든 작성할 수 있으며, 외부 기호는 적절한 import 문이 생성되도록 `external` 함수로 감싸야 합니다.

### 종속성 유형 정의

`ng-add`의 `save` 옵션을 사용하여 라이브러리가 `dependencies`, `devDependencies`에 추가되거나 전혀 저장되지 않도록 구성합니다.

<docs-code header="projects/my-lib/package.json (ng-add 참조)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/package.json" visibleRegion="ng-add"/>

가능한 값은 다음과 같습니다:

| 값                  | 세부사항 |
|:---                 |:---      |
| `false`             | `package.json`에 패키지를 추가하지 않음 |
| `true`              | 패키지를 종속성에 추가 |
| `"dependencies"`    | 패키지를 종속성에 추가 |
| `"devDependencies"` | 패키지를 devDependencies에 추가 |

## 스키매틱 빌드

스키매틱을 라이브러리와 함께 번들로 묶으려면, 라이브러리가 스키매틱을 별도로 빌드하도록 구성한 다음, 이를 번들에 추가해야 합니다.
라이브러리를 빌드한 후에 스키매틱을 빌드해야 하므로 올바른 디렉토리에 배치됩니다.

* 라이브러리에는 스키매틱을 배포 라이브러리로 컴파일하는 방법에 대한 지침이 포함된 사용자 지정 Typescript 구성 파일이 필요합니다.
* 스키매틱을 라이브러리 번들에 추가하려면, 라이브러리의 `package.json` 파일에 스크립트를 추가합니다.

Angular 작업 공간에 `my-lib`라는 라이브러리 프로젝트가 있다고 가정해 봅시다.
스키매틱을 빌드하는 방법을 라이브러리에 알리려면, 자동 생성된 `tsconfig.lib.json` 파일 옆에 `tsconfig.schematics.json` 파일을 추가하여 라이브러리 빌드를 구성합니다.

1. `tsconfig.schematics.json` 파일을 편집하여 다음 내용을 추가합니다.

    <docs-code header="projects/my-lib/tsconfig.schematics.json (TypeScript 구성)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/tsconfig.schematics.json"/>

    | 옵션      | 세부사항 |
    |:---       |:---      |
    | `rootDir` | `schematics` 폴더가 컴파일할 입력 파일을 포함하고 있음을 지정합니다.                                 |
    | `outDir`  | 라이브러리의 출력 폴더에 매핑됩니다. 기본적으로 이 경로는 작업 공간의 루트에 있는 `dist/my-lib` 폴더입니다. |

1. 스키매틱 원본 파일이 라이브러리 번들에 컴파일되도록 하려면, 라이브러리 프로젝트의 루트 폴더 ( `projects/my-lib` )의 `package.json` 파일에 다음 스크립트를 추가합니다.

    <docs-code header="projects/my-lib/package.json (빌드 스크립트)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/package.json"/>

    * `build` 스크립트는 사용자 지정 `tsconfig.schematics.json` 파일을 사용하여 당신의 스키매틱을 컴파일합니다.
    * `postbuild` 스크립트는 `build` 스크립트가 완료된 후 스키매틱 파일을 복사합니다.
    * `build` 및 `postbuild` 스크립트는 `copyfiles`와 `typescript` 의존성을 요구합니다.
        의존성을 설치하려면 `devDependencies`에 정의된 경로로 이동하여 `npm install`을 실행한 후 스크립트를 실행하십시오.

## 생성 지원 제공

사용자가 `ng generate` 명령을 사용하여 라이브러리에 정의된 아티팩트를 생성할 수 있도록 하는 명명된 스키매틱을 컬렉션에 추가할 수 있습니다.

당신의 라이브러리가 일부 설정이 필요한 `my-service`라는 서비스를 정의한다고 가정하겠습니다.
사용자가 다음 CLI 명령을 사용하여 이를 생성할 수 있기를 원합니다.

<docs-code language="shell">

ng generate my-lib:my-service

</docs-code>

시작하려면, `schematics` 폴더 내에 새로운 하위 폴더 `my-service`를 만듭니다.

### 새로운 스키매틱 구성

컬렉션에 스키매틱을 추가할 때, 컬렉션의 스키마에서 이를 가리키고 사용자가 명령에 전달할 수 있는 옵션을 정의하는 구성 파일을 제공해야 합니다.

1. `schematics/collection.json` 파일을 편집하여 새로운 스키매틱 하위 폴더를 가리키고, 새로운 스키매틱에 대한 입력을 지정하는 스키마 파일을 포함시킵니다.

    <docs-code header="projects/my-lib/schematics/collection.json (스키매틱 컬렉션)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/collection.json"/>

1. `<lib-root>/schematics/my-service` 폴더로 이동합니다.
1. `schema.json` 파일을 생성하고 스키매틱에 대한 사용 가능한 옵션을 정의합니다.

    <docs-code header="projects/my-lib/schematics/my-service/schema.json (스키매틱 JSON 스키마)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/schema.json"/>

    * *id*: 컬렉션의 스키마에 대한 고유 ID.
    * *title*: 스키마에 대한 사람이 읽을 수 있는 설명.
    * *type*: 속성으로 제공되는 유형을 설명하는 설명자.
    * *properties*: 스키매틱에 대한 사용 가능한 옵션을 정의하는 객체.

    각 옵션은 키와 유형, 설명 및 선택적 별칭을 연결합니다. 
    유형은 예상되는 값의 모양을 정의하고 설명은 사용자가 스키매틱의 사용 도움말을 요청할 때 표시됩니다.

    스키매틱 옵션에 대한 추가 사용자 정의는 작업 공간 스키마를 참조하십시오.

1. `schema.ts` 파일을 생성하고 `schema.json` 파일에 정의된 옵션의 값을 저장하는 인터페이스를 정의합니다.

    <docs-code header="projects/my-lib/schematics/my-service/schema.ts (스키매틱 인터페이스)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/schema.ts"/>

    | 옵션     | 세부사항 |
    |:---      |:---      |
    | name     | 생성된 서비스에 제공할 이름.                                                                                       |
    | path     | 스키매틱에 제공된 경로를 오버라이드합니다. 기본 경로 값은 현재 작업 디렉토리를 기반으로 합니다.                             |
    | project  | 스키매틱을 실행할 특정 프로젝트를 제공합니다. 스키매틱에서 사용자가 옵션을 제공하지 않으면 기본값을 제공할 수 있습니다. |

### 템플릿 파일 추가

아티팩트를 프로젝트에 추가하기 위해 스키매틱은 고유한 템플릿 파일이 필요합니다. 
스키매틱 템플릿은 코드 실행 및 변수 치환을 위한 특별 문법을 지원합니다.

1. `schematics/my-service/` 폴더 내에 `files/` 폴더를 생성합니다.
1. 파일 생성 시 사용할 템플릿을 정의하는 `__name@dasherize__.service.ts.template`이라는 파일을 생성합니다. 
    이 템플릿은 Angular의 `HttpClient`가 생성자의 주입되어 있는 서비스를 생성합니다.

    <docs-code lang="typescript" header="projects/my-lib/schematics/my-service/files/__name@dasherize__.service.ts.template (스키매틱 템플릿)">

    import { Injectable } from '@angular/core';
    import { HttpClient } from '@angular/common/http';

    @Injectable({
      providedIn: 'root'
    })
    export class <%= classify(name) %>Service {
      constructor(private http: HttpClient) { }
    }

    </docs-code>

    * `classify`와 `dasherize` 메서드는 스키매틱이 소스 템플릿 및 파일 이름을 변환하는 데 사용하는 유틸리티 함수입니다.
    * `name`은 공장 함수에서 제공되는 속성으로, 스키마에서 정의한 동일한 `name`입니다.

### 공장 함수 추가

이제 인프라가 마련되었으므로, 사용자의 프로젝트에서 필요한 수정을 수행하는 주요 함수를 정의할 수 있습니다.

스키매틱 프레임워크는 파일 템플릿 시스템을 제공하며, 이는 경로 및 콘텐츠 템플릿 모두를 지원합니다. 
이 시스템은 입력 `Tree`에 로드된 파일 또는 경로 내 정의된 자리 표시자에 대해 작동하며, `Rule`로 전달된 값을 사용하여 채웁니다.

이러한 데이터 구조 및 문법에 대한 자세한 내용은 [스키매틱 README](https://github.com/angular/angular-cli/blob/main/packages/angular_devkit/schematics/README.md)를 참조하십시오.

1. 주요 파일 `index.ts`를 생성하고 스키매틱 공장 함수의 소스 코드를 추가합니다.
1. 먼저, 필요한 스키매틱 정의를 가져옵니다. 
    스키매틱 프레임워크는 스키매틱을 실행할 때 규칙을 생성하고 사용하는 데 사용할 수 있는 많은 유틸리티 함수를 제공합니다.

    <docs-code header="projects/my-lib/schematics/my-service/index.ts (가져오기)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.ts" visibleRegion="schematics-imports"/>

1. 스키매틱 옵션에 대한 유형 정보를 제공하는 정의된 스키마 인터페이스를 가져옵니다.

    <docs-code header="projects/my-lib/schematics/my-service/index.ts (스키마 가져오기)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.ts" visibleRegion="schema-imports"/>

1. 생성 스키매틱을 구축하려면 빈 규칙 공장으로 시작합니다.

    <docs-code header="projects/my-lib/schematics/my-service/index.ts (초기 규칙)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.1.ts" visibleRegion="factory"/>

이 규칙 공장은 수정 없이 나무를 반환합니다. 
옵션은 `ng generate` 명령으로 전달된 옵션 값입니다.

## 생성 규칙 정의

이제 사용자의 애플리케이션을 수정하여 라이브러리에 정의된 서비스에 대한 설정을 준비하는 코드를 생성하는 기본 틀이 마련되었습니다.

사용자가 라이브러리를 설치한 Angular 작업 공간에는 여러 프로젝트(애플리케이션과 라이브러리)가 포함되어 있습니다. 
사용자는 커맨드 라인에서 프로젝트를 지정하거나 기본값으로 설정할 수 있습니다. 
두 경우 모두, 당신의 코드는 이 스키매틱이 적용되는 특정 프로젝트를 식별해야 하므로, 프로젝트 구성에서 정보를 검색할 수 있습니다.

이 작업은 공장 함수에 전달된 `Tree` 객체를 사용하여 수행됩니다. 
`Tree` 메소드는 작업 공간의 전체 파일 트리에 접근할 수 있도록 해주어 스키매틱이 실행되는 동안 파일을 읽고 쓸 수 있습니다.

### 프로젝트 구성 가져오기

1. 대상 프로젝트를 결정하기 위해 `workspaces.readWorkspace` 메소드를 사용하여 작업 공간 구성 파일인 `angular.json`의 내용을 읽습니다.
    `workspaces.readWorkspace`를 사용하려면, `Tree`로부터 `workspaces.WorkspaceHost`를 생성해야 합니다.
    다음 코드를 공장 함수에 추가합니다.

    <docs-code header="projects/my-lib/schematics/my-service/index.ts (스키마 가져오기)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.ts" visibleRegion="workspace"/>

    컨텍스트가 존재하는지 확인하고 적절한 오류를 발생시킵니다.

1. 이제 프로젝트 이름이 생겼으므로, 이를 사용하여 프로젝트별 구성 정보를 검색합니다.

    <docs-code header="projects/my-lib/schematics/my-service/index.ts (프로젝트)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.ts" visibleRegion="project-info"/>

    `workspace.projects` 객체는 모든 프로젝트별 구성 정보를 포함합니다.

1. `options.path`는 스키매틱이 적용된 후 스키매틱 템플릿 파일이 이동할 위치를 결정합니다.

    스키매틱 스키마의 `path` 옵션은 기본적으로 현재 작업 디렉토리로 대체됩니다. 
    `path`가 정의되지 않았으면 프로젝트 구성의 `sourceRoot`와 `projectType`을 사용하십시오.

    <docs-code header="projects/my-lib/schematics/my-service/index.ts (프로젝트 정보)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.ts" visibleRegion="path"/>

### 규칙 정의

`Rule`은 외부 템플릿 파일을 사용할 수 있으며, 이를 변환하고 변환된 템플릿으로 다른 `Rule` 객체를 반환할 수 있습니다. 
이제 템플릿을 사용하여 스키매틱에 필요한 사용자 정의 파일을 생성합니다.

1. 공장 함수에 다음 코드를 추가합니다.

    <docs-code header="projects/my-lib/schematics/my-service/index.ts (템플릿 변환)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.ts" visibleRegion="template"/>

    | 메소드            | 세부사항 |
    |:---               |:---      |
    | `apply()`         | 소스에 여러 규칙을 적용하고 변환된 소스를 반환합니다. 두 개의 인수, 하나의 소스와 규칙의 배열을 받습니다.                                                                                                                     |
    | `url()`           | 스키매틱에 상대적인 파일 시스템에서 원본 파일을 읽습니다.                                                                                                                                                                              |
    | `applyTemplates()` | 스키매틱 템플릿과 스키매틱 파일 이름에 적용할 메소드와 속성의 인수를 수신합니다. `Rule`을 반환합니다. 여기서 `classify()` 및 `dasherize()` 메소드와 `name` 속성을 정의합니다. |
    | `classify()`      | 값을 받아 제목 케이스로 반환합니다. 예를 들어, 제공된 이름이 `my service`일 경우, `MyService`로 반환됩니다.                                                                                                             |
    | `dasherize()`     | 값을 받아 하이픈 및 소문자로 반환합니다. 예를 들어, 제공된 이름이 `MyService`일 경우, `my-service`로 반환됩니다.                                                                                                     |
    | `move()`          | 스키매틱이 적용될 때 제공된 원본 파일을 대상 위치로 이동합니다.                                                                                                                                                              |

1. 마지막으로, 규칙 공장은 규칙을 반환해야 합니다.

    <docs-code header="projects/my-lib/schematics/my-service/index.ts (연결 규칙)" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.ts" visibleRegion="chain"/>

    `chain()` 메소드는 여러 규칙을 단일 규칙으로 결합할 수 있도록 하여 단일 스키매틱에서 여러 작업을 수행할 수 있게 합니다. 
    여기서는 템플릿 규칙과 스키매틱에 의해 실행되는 코드를 결합하고 있습니다.

다음 스키매틱 규칙 함수의 완전한 예제를 참조하십시오.

<docs-code header="projects/my-lib/schematics/my-service/index.ts" path="adev/src/content/examples/schematics-for-libraries/projects/my-lib/schematics/my-service/index.ts"/>

규칙 및 유틸리티 메서드에 대한 자세한 내용은 [제공된 규칙](https://github.com/angular/angular-cli/tree/main/packages/angular_devkit/schematics#provided-rules)을 참조하십시오.

## 라이브러리 스키매틱 실행

라이브러리와 스키매틱을 빌드한 후, 스키매틱 컬렉션을 설치하여 프로젝트에 적용할 수 있습니다. 
다음 단계는 이전에 생성한 스키매틱을 사용하여 서비스를 생성하는 방법을 보여줍니다.

### 라이브러리와 스키매틱 빌드

작업 공간의 루트에서 라이브러리에 대해 `ng build` 명령을 실행합니다.

<docs-code language="shell">

ng build my-lib

</docs-code>

그런 다음 스키매틱을 빌드하기 위해 라이브러리 디렉토리로 변경합니다.

<docs-code language="shell">

cd projects/my-lib
npm run build

</docs-code>

### 라이브러리 링크

라이브러리와 스키매틱은 패키징되어 작업 공간의 루트에 있는 `dist/my-lib` 폴더에 배치됩니다. 
스키매틱을 실행하기 위해 라이브러리를 `node_modules` 폴더에 링크해야 합니다. 
작업 공간의 루트에서 배포 가능한 라이브러리의 경로와 함께 `npm link` 명령을 실행합니다.

<docs-code language="shell">

npm link dist/my-lib

</docs-code>

### 스키매틱 실행

이제 라이브러리가 설치되었으므로, `ng generate` 명령을 사용하여 스키매틱을 실행합니다.

<docs-code language="shell">

ng generate my-lib:my-service --name my-data

</docs-code>

콘솔에서 스키매틱이 실행되었고, `my-data.service.ts` 파일이 애플리케이션 폴더에 생성되었음을 확인할 수 있습니다.

<docs-code language="shell" hideCopy>

CREATE src/app/my-data.service.ts (208 bytes)

</docs-code>