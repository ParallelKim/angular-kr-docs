# 스케매틱을 사용한 코드 생성

스케매틱은 복잡한 논리를 지원하는 템플릿 기반 코드 생성기입니다.
코드를 생성하거나 수정하여 소프트웨어 프로젝트를 변환하기 위한 일련의 지침입니다.
스케매틱은 컬렉션으로 패키징되어 npm으로 설치됩니다.

스케매틱 컬렉션은 소프트웨어 프로젝트를 생성, 수정 및 유지관리하는 데 강력한 도구가 될 수 있으며, 특히 Angular 프로젝트를 귀하의 조직의 특정 요구 사항에 맞게 사용자 지정하는 데 유용합니다.
예를 들어, 미리 정의된 템플릿이나 레이아웃을 사용하여 일반적으로 사용되는 UI 패턴이나 특정 구성 요소를 생성하는 데 스케매틱을 사용할 수 있습니다.
스케매틱을 사용하여 아키텍처 규칙과 관습을 강화하여 프로젝트의 일관성과 상호 운용성을 유지합니다.

## Angular CLI를 위한 스케매틱

스케매틱은 Angular 생태계의 일부입니다.
Angular CLI는 스케매틱을 사용하여 웹 앱 프로젝트에 변환을 적용합니다.
이 스케매틱을 수정하거나 코드를 업데이트하여 의존성의 중단 변경을 수정하거나, 기존 프로젝트에 새로운 구성 옵션이나 프레임워크를 추가하는 것과 같이 새로운 스케매틱을 정의할 수 있습니다.

`@schematics/angular` 컬렉션에 포함된 스케매틱은 기본적으로 `ng generate` 및 `ng add` 명령어에 의해 실행됩니다.
패키지에는 `ng generate` 하위 명령어에 대한 CLI에서 사용 가능한 옵션을 구성하는 이름이 지정된 스케매틱이 포함되어 있으며, 예를 들어 `ng generate component` 및 `ng generate service`가 있습니다.
`ng generate`의 하위 명령어는 해당 스케매틱에 대한 약어입니다.
특정 스케매틱 또는 스케매틱 컬렉션을 지정하고 생성하려면 긴 형식을 사용하여:

<docs-code language="shell">

ng generate my-schematic-collection:my-schematic-name

</docs-code>

또는

<docs-code language="shell">

ng generate my-schematic-name --collection collection-name

</docs-code>

### CLI 스케매틱 구성

스케매틱과 연결된 JSON 스키마는 Angular CLI에 명령어 및 하위 명령어에 사용할 수 있는 옵션과 기본값을 정의합니다.
이러한 기본값은 명령줄에서 옵션에 대해 다른 값을 제공하여 덮어쓸 수 있습니다.
작업 공간의 생성 옵션 기본값을 변경하는 방법에 대한 정보는 [작업 공간 구성](reference/configs/workspace-config)을 참조하십시오.

CLI에서 프로젝트 및 프로젝트의 일부를 생성하는 데 사용하는 기본 스케매틱의 JSON 스키마는 패키지 [`@schematics/angular`](https://github.com/angular/angular-cli/tree/main/packages/schematics/angular)에 수집되어 있습니다.
스키마는 `ng generate` 하위 명령어에 대한 CLI에서 사용 가능한 옵션을 설명합니다.

## 라이브러리를 위한 스케매틱 개발

라이브러리 개발자로서 Angular CLI와 통합할 맞춤형 스케매틱 컬렉션을 생성할 수 있습니다.

* *추가 스케매틱*은 개발자들이 `ng add`를 사용하여 Angular 작업 공간에 라이브러리를 설치할 수 있게 합니다.
* *생성 스케매틱*은 `ng generate` 하위 명령어가 프로젝트를 수정하고, 구성 및 스크립트를 추가하고, 라이브러리에 정의된 아티팩트를 스캐폴딩하는 방법을 알릴 수 있습니다.
* *업데이트 스케매틱*은 `ng update` 명령어가 라이브러리의 의존성을 업데이트하고 새 버전을 출시할 때 중단 변경점에 조정하는 방법을 알려줄 수 있습니다.

이들이 어떻게 생겼고 어떻게 생성하는지에 대한 자세한 내용은 다음을 참조하십시오:

<docs-pill-row>
  <docs-pill href="tools/cli/schematics-authoring" title="스케매틱 작성"/>
  <docs-pill href="tools/cli/schematics-for-libraries" title="라이브러리를 위한 스케매틱"/>
</docs-pill-row>

### 추가 스케매틱

*추가 스케매틱*은 일반적으로 라이브러리와 함께 제공되어, 라이브러리를 기존 프로젝트에 `ng add`로 추가할 수 있게 합니다.
`add` 명령은 패키지 관리자를 사용하여 새로운 의존성을 다운로드하고, 스케매틱으로 구현된 설치 스크립트를 호출합니다.

예를 들어, [`@angular/material`](https://material.angular.io/guide/schematics) 스케매틱은 `add` 명령에게 Angular Material 및 테마를 설치 및 설정하고, `ng generate`로 생성할 수 있는 새로운 시작 구성 요소를 등록하도록 지시합니다.
이를 예로 삼아 여러분의 추가 스케매틱을 모델링하십시오.

파트너 및 제3자 라이브러리도 추가 스케매틱을 통해 Angular CLI를 지원합니다.
예를 들어, `@ng-bootstrap/schematics`는 앱에 [ng-bootstrap](https://ng-bootstrap.github.io)을 추가하고, `@clr/angular`는 [VMWare의 Clarity](https://clarity.design/documentation/get-started)를 설치하고 설정합니다.

*추가 스케매틱*은 구성 변경으로 프로젝트를 업데이트하거나, 추가적인 의존성(예: 폴리필)을 추가하거나, 패키지 별 초기화 코드를 스캐폴딩할 수도 있습니다.
예를 들어, `@angular/pwa` 스케매틱은 애플리케이션 매니페스트 및 서비스 워커를 추가하여 애플리케이션을 PWA로 변환합니다.

### 생성 스케매틱

생성 스케매틱은 `ng generate` 명령어의 지침입니다.
문서화된 하위 명령어는 기본 Angular 생성 스케매틱을 사용하지만, 라이브러리에 정의된 아티팩트를 생성하기 위해 다른 스케매틱(하위 명령 대신)을 지정할 수 있습니다.

예를 들어, Angular Material은 정의된 UI 구성 요소에 대한 생성 스케매틱을 제공합니다.
다음 명령어는 정렬 및 페이지 매김을 위한 데이터 소스로 사전 구성된 Angular Material `<mat-table>`을 렌더링하기 위해 이러한 스케매틱 중 하나를 사용합니다.

<docs-code language="shell">

ng generate @angular/material:table <component-name>

</docs-code>

### 업데이트 스케매틱

`ng update` 명령어를 사용하여 작업 공간의 라이브러리 의존성을 업데이트할 수 있습니다.
옵션을 제공하지 않거나 도움말 옵션을 사용하면, 명령어는 작업 공간을 검사하고 업데이트할 라이브러리를 제안합니다.

<docs-code language="shell">

ng update
우리는 당신의 package.json을 분석했습니다. 업데이트할 패키지가 있습니다:

    이름                                      버전                     업데이트할 명령
    &hyphen;-------------------------------------------------------------------------------
    @angular/cdk                       7.2.2 -> 7.3.1           ng update @angular/cdk
    @angular/cli                       7.2.3 -> 7.3.0           ng update @angular/cli
    @angular/core                      7.2.2 -> 7.2.3           ng update @angular/core
    @angular/material                  7.2.2 -> 7.3.1           ng update @angular/material
    rxjs                                      6.3.3 -> 6.4.0           ng update rxjs

</docs-code>

명령어에 업데이트할 라이브러리 집합을 전달하면, 해당 라이브러리와 그 피어 의존성 및 해당 라이브러리에 의존하는 피어 의존성이 업데이트됩니다.

도움말: 일관성이 없을 경우(예: 피어 의존성을 단순한 [semver](https://semver.io) 범위로 매칭할 수 없는 경우) 명령어는 오류를 생성하고 작업 공간에서 아무것도 변경하지 않습니다.

기본적으로 모든 의존성의 업데이트를 강제로 수행하지 않는 것이 좋습니다.
특정 의존성을 먼저 업데이트해 보십시오.

`ng update` 명령어가 작동하는 방식에 대한 자세한 내용은 [업데이트 명령어](https://github.com/angular/angular-cli/blob/main/docs/specifications/update.md)를 참조하십시오.

기존 버전에서 새 버전으로 마이그레이션을 커버하는 업데이트 스케매틱을 제공할 수 있는 잠재적인 중단 변경을 도입하는 새 버전의 라이브러리를 만든 경우, `ng update` 명령어가 프로젝트에서 이러한 변경 사항을 자동으로 해결할 수 있도록 하는 *업데이트 스케매틱*을 제공할 수 있습니다.

예를 들어, Angular Material 라이브러리를 업데이트하려고 한다고 가정해 보겠습니다.

<docs-code language="shell">
ng update @angular/material
</docs-code>

이 명령어는 작업 공간의 `package.json`에서 `@angular/material`과 그 의존성인 `@angular/cdk`를 모두 업데이트합니다.
어떤 패키지든지 기존 버전에서 새 버전으로 마이그레이션을 다루는 업데이트 스케매틱이 포함되어 있다면, 명령어는 작업 공간에서 해당 스케매틱을 실행합니다.