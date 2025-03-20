# CLI 개요 및 명령어 참조

Angular CLI는 명령 셸에서 Angular 애플리케이션을 초기화, 개발, 스캐폴드 및 유지 관리하는 데 사용하는 명령 줄 인터페이스 도구입니다.

## Angular CLI 설치

Angular CLI의 주요 버전은 지원되는 Angular의 주요 버전을 따르지만, 부버전은 별도로 출시될 수 있습니다.

`npm` 패키지 관리자를 사용하여 CLI를 설치합니다:

<code-example format="shell" language="shell">

npm install -g @angular/cli<aio-angular-dist-tag class="pln"></aio-angular-dist-tag>

</code-example>

버전 간 변경 사항에 대한 자세한 내용과 이전 릴리스에서 업데이트하는 방법에 대한 정보는 GitHub의 릴리스 탭을 참조하십시오: https://github.com/angular/angular-cli/releases

## 기본 워크플로우

`ng` 실행 파일을 통해 명령 줄에서 도구를 호출합니다.
온라인 도움말은 명령 줄에서 사용할 수 있습니다.
다음 명령을 입력하여 주어진 명령(예: [new](cli/new))에 대한 명령 또는 옵션을 짧은 설명과 함께 나열합니다.

<code-example format="shell" language="shell">

ng --help
ng new --help

</code-example>

새롭고 기본 Angular 프로젝트를 개발 서버에서 생성, 빌드 및 제공하려면 새 작업공간의 상위 디렉토리로 가서 다음 명령을 사용하세요:

<code-example format="shell" language="shell">

ng new my-first-project
cd my-first-project
ng serve

</code-example>

브라우저에서 http://localhost:4200/을 열어 새 애플리케이션이 실행되는 것을 확인하세요.
[ng serve](cli/serve) 명령을 사용하여 애플리케이션을 빌드하고 로컬로 제공하면, 서버는 소스 파일 중 하나를 변경할 때마다 애플리케이션을 자동으로 재구축하고 페이지를 새로 고칩니다.

<div class="docs-alert docs-alert-helpful">

`ng new my-first-project`를 실행하면 현재 작업 디렉토리에 `my-first-project`라는 새 폴더가 생성됩니다.
그 폴더 안에 파일을 생성할 수 있도록, 명령을 실행하기 전에 현재 작업 디렉토리에서 충분한 권한이 있는지 확인하세요.

현재 작업 디렉토리가 프로젝트에 적합하지 않은 경우, `cd <path-to-other-directory>`를 실행하여 보다 적절한 디렉토리로 변경할 수 있습니다.

</div>

## 작업공간 및 프로젝트 파일

[ng new](cli/new) 명령은 *Angular 작업공간* 폴더를 생성하고 새 애플리케이션 스켈레톤을 만듭니다.
작업공간에는 여러 애플리케이션과 라이브러리를 포함할 수 있습니다.
[ng new](cli/new) 명령으로 생성된 초기 애플리케이션은 작업공간의 최상위 수준에 있습니다.
작업공간에서 추가 애플리케이션이나 라이브러리를 생성하면 `projects/` 하위 폴더에 들어갑니다.

새로 생성된 애플리케이션에는 루트 모듈에 대한 소스 파일, 루트 컴포넌트 및 템플릿이 포함됩니다.
각 애플리케이션은 로직, 데이터 및 자산을 포함하는 `src` 폴더가 있습니다.

생성된 파일을 직접 편집하거나 CLI 명령을 사용하여 추가 및 수정할 수 있습니다.
[ng generate](cli/generate) 명령을 사용하여 추가 컴포넌트 및 서비스에 대한 새로운 파일을 추가하고 새로운 파이프, 지시자 등을 위한 코드를 생성합니다.
애플리케이션 및 라이브러리를 생성하거나 운영하는 [add](cli/add) 및 [generate](cli/generate)와 같은 명령은 작업공간 또는 프로젝트 폴더 내에서 실행되어야 합니다.

*   [작업공간 파일 구조](guide/file-structure)에 대한 자세한 내용을 확인하세요.

### 작업공간 및 프로젝트 구성

작업공간의 최상위 수준에 단일 작업공간 구성 파일 `angular.json`이 생성됩니다.
여기에서 CLI 명령 옵션에 대한 프로젝트별 기본값을 설정하고, CLI가 서로 다른 대상을 위해 프로젝트를 빌드할 때 사용할 구성을 지정할 수 있습니다.

[ng config](cli/config) 명령을 사용하여 명령 줄에서 구성 값을 설정하고 검색할 수 있으며, 또는 `angular.json` 파일을 직접 편집할 수 있습니다.

<div class="alert is-helpful">

**참고**: <br />
구성 파일의 옵션 이름은 [camelCase](guide/glossary#case-types)를 사용해야 하며, 명령에 제공되는 옵션 이름은 대시 형태여야 합니다.

</div>

*   [작업공간 구성](guide/workspace-config)에 대한 자세한 내용을 확인하세요.

## CLI 명령어 언어 구문

명령 구문은 다음과 같이 표시됩니다:

`ng` *<command-name>* *<required-arg>* [*optional-arg*] `[options]`

*   대부분의 명령 및 일부 옵션은 별칭을 가집니다.
    별칭은 각 명령의 구문에서 보여집니다.

*   옵션 이름은 두 개의 대시 \(`--`\) 문자로 시작합니다.
    옵션 별칭은 하나의 대시 \(`-`\) 문자로 시작합니다.
    인수에는 접두사가 없습니다.
    예를 들면:

    <code-example format="shell" language="shell">

    ng build my-app -c production

    </code-example>

*   일반적으로 생성된 아티팩트의 이름은 명령에 대한 인수로 지정하거나 `--name` 옵션으로 지정할 수 있습니다.

*   인수 및 옵션 이름은 [대시 케이스](guide/glossary#case-types)로 제공되어야 합니다.
    예: `--my-option-name`

### 부울 옵션

부울 옵션에는 두 가지 형태가 있습니다: `--this-option`은 플래그를 `true`로 설정하고, `--no-this-option`은 `false`로 설정합니다.
두 옵션이 제공되지 않으면, 플래그는 참조 문서에 나열된 기본 상태로 유지됩니다.

### 배열 옵션

배열 옵션은 두 가지 형식으로 제공될 수 있습니다: `--option value1 value2` 또는 `--option value1 --option value2`.

### 상대 경로

파일을 지정하는 옵션은 절대 경로 또는 현재 작업 디렉토리에 대한 경로(일반적으로 작업공간 또는 프로젝트 루트)를 상대적으로 지정할 수 있습니다.

### 스키매틱

[ng generate](cli/generate) 및 [ng add](cli/add) 명령은 현재 프로젝트에 생성되거나 추가될 아티팩트 또는 라이브러리를 인수로 사용합니다.
일반 옵션 외에도, 각 아티팩트 또는 라이브러리는 *스키매틱*에서 자신의 옵션을 정의합니다.
스키매틱 옵션은 즉각적인 명령 옵션과 동일한 형식으로 명령에 제공됩니다.

<!-- links -->

<!-- external links -->

<!-- end links -->

@reviewed 2022-02-28