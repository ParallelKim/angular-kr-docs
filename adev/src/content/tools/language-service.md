# Angular 언어 서비스

Angular 언어 서비스는 코드 편집기가 Angular 템플릿 내에서 완성, 오류, 힌트 및 탐색을 얻는 방법을 제공합니다. 
이는 별도의 HTML 파일로 된 외부 템플릿과 인라인 템플릿 모두에서 작동합니다.

## Angular 언어 서비스의 컴파일러 옵션 구성

최신 언어 서비스 기능을 활성화하려면 `tsconfig.json`에서 `strictTemplates` 옵션을 `true`로 설정하여 다음 예와 같이 설정하십시오:

<docs-code language="json">

"angularCompilerOptions": {
  "strictTemplates": true
}

</docs-code>

자세한 내용은 [Angular 컴파일러 옵션](reference/configs/angular-compiler-options) 가이드를 참조하십시오.

## 기능

편집기는 Angular 파일을 열고 있는 것을 자동으로 인식합니다.
그 후 Angular 언어 서비스를 사용하여 `tsconfig.json` 파일을 읽고, 애플리케이션에 있는 모든 템플릿을 찾고, 열어본 모든 템플릿에 대해 언어 서비스를 제공합니다.

언어 서비스에는 다음이 포함됩니다:

* 완성 목록
* AOT 진단 메시지
* 빠른 정보
* 정의로 이동

### 자동 완성

자동 완성은 입력하는 동안 상황에 맞는 가능성과 힌트를 제공하여 개발 시간을 단축할 수 있습니다.
이 예제는 보간에서 자동 완성을 보여줍니다.
이것을 입력하면서 탭을 눌러 완료할 수 있습니다.

<img alt="자동 완성" src="assets/images/guide/language-service/language-completion.gif">

요소 내에서도 완성이 가능합니다.
컴포넌트 선택기로 가지고 있는 모든 요소가 완성 목록에 표시됩니다.

### 오류 검사

Angular 언어 서비스는 코드의 오류를 미리 경고할 수 있습니다.
이 예제에서 Angular는 `orders`가 무엇인지 또는 어디에서 왔는지 모릅니다.

<img alt="오류 검사" src="assets/images/guide/language-service/language-error.gif">

### 빠른 정보 및 탐색

빠른 정보 기능을 통해 컴포넌트, 지시자, 모듈의 출처를 확인할 수 있도록 마우스를 올릴 수 있습니다.
그런 다음 "정의로 이동"을 클릭하거나 F12를 눌러 정의로 직접 이동할 수 있습니다.

<img alt="탐색" src="assets/images/guide/language-service/language-navigation.gif">

## 편집기에서 Angular 언어 서비스 사용하기

Angular 언어 서비스는 현재 [Visual Studio Code](https://code.visualstudio.com), [WebStorm](https://www.jetbrains.com/webstorm), [Sublime Text](https://www.sublimetext.com) 및 [Eclipse IDE](https://www.eclipse.org/eclipseide)의 확장으로 제공됩니다.

### Visual Studio Code

[Visual Studio Code](https://code.visualstudio.com)에서 [Extensions: Marketplace](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template)에서 확장을 설치하십시오.
편집기에서 왼쪽 메뉴 창의 Extensions 아이콘을 사용하여 마켓플레이스를 열거나 VS Quick Open \(⌘+P on Mac, CTRL+P on Windows\)를 사용하고 "? ext"를 입력하십시오.
마켓플레이스에서 Angular 언어 서비스 확장을 검색하고 **설치** 버튼을 클릭하십시오.

Visual Studio Code와 Angular 언어 서비스 간의 통합은 Angular 팀에 의해 유지 관리되고 배포됩니다.

### Visual Studio

[Visual Studio](https://visualstudio.microsoft.com)에서 [Extensions: Marketplace](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.AngularLanguageService)에서 확장을 설치하십시오.
편집기에서 상단 메뉴 창의 Extensions를 선택한 후 Manage Extensions를 선택하여 마켓플레이스를 엽니다.
마켓플레이스에서 Angular 언어 서비스 확장을 검색하고 **설치** 버튼을 클릭하십시오.

Visual Studio와 Angular 언어 서비스의 통합은 Microsoft가 Angular 팀의 도움을 받아 유지 관리하고 배포합니다.
프로젝트를 [여기](https://github.com/microsoft/vs-ng-language-service)에서 확인하십시오.

### WebStorm

[WebStorm](https://www.jetbrains.com/webstorm)에서 [Angular 및 AngularJS](https://plugins.jetbrains.com/plugin/6971-angular-and-angularjs) 플러그인을 활성화하십시오.

WebStorm 2019.1 이후로 `@angular/language-service`는 더 이상 필요하지 않으며 `package.json`에서 제거해야 합니다.

### Sublime Text

[Sublime Text](https://www.sublimetext.com)에서 언어 서비스는 플러그인으로 설치된 경우에만 인라인 템플릿을 지원합니다.
HTML 파일의 완성을 위해서는 사용자 지정 Sublime 플러그인 \(또는 현재 플러그인 수정\)이 필요합니다.

인라인 템플릿에 대해 언어 서비스를 사용하려면 먼저 TypeScript를 허용하는 확장을 추가한 후 Angular 언어 서비스 플러그인을 설치해야 합니다.
TypeScript 2.3부터 TypeScript는 언어 서비스에서 사용할 수 있는 플러그인 모델을 가지고 있습니다.

1. 로컬 `node_modules` 디렉터리에 TypeScript의 최신 버전을 설치합니다:

    <docs-code language="shell">

    npm install --save-dev typescript

    </docs-code>

2. 같은 위치에 Angular 언어 서비스 패키지를 설치합니다:

    <docs-code language="shell">

    npm install --save-dev @angular/language-service

    </docs-code>

3. 패키지가 설치되면 프로젝트의 `tsconfig.json`의 `"compilerOptions"` 섹션에 다음을 추가합니다.

    <docs-code header="tsconfig.json" language="json">

    "plugins": [
        {"name": "@angular/language-service"}
    ]

    </docs-code>

4. 편집기의 사용자 기본 설정 \(`Cmd+,` 또는 `Ctrl+,`\)에서 다음을 추가합니다:

    <docs-code header="Sublime Text 사용자 기본 설정" language="json">

    "typescript-tsdk": "<path to your folder>/node_modules/typescript/lib"

    </docs-code>

이렇게 하면 Angular 언어 서비스가 `.ts` 파일에서 진단 및 완성을 제공합니다.

### Eclipse IDE

"웹 및 자바스크립트 개발자를 위한 Eclipse IDE" 패키지를 직접 설치하거나 다른 Eclipse IDE 패키지에서 도움 > Eclipse Marketplace를 사용하여 [Eclipse Wild Web Developer](https://marketplace.eclipse.org/content/wild-web-developer-html-css-javascript-typescript-nodejs-angular-json-yaml-kubernetes-xml)를 찾아 설치합니다.

### Neovim

Angular 언어 서비스는 [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) 플러그인을 사용하여 Neovim과 함께 사용할 수 있습니다.

1. [nvim-lspconfig 설치하기](https://github.com/neovim/nvim-lspconfig?tab=readme-ov-file#install)

2. [nvim-lspconfig에 angularls 구성하기](https://github.com/neovim/nvim-lspconfig/blob/master/doc/configs.md#angularls)

## 언어 서비스 작동 방식

언어 서비스가 있는 편집기를 사용할 때, 편집기는 별도의 언어 서비스 프로세스를 시작하고 [RPC](https://en.wikipedia.org/wiki/Remote_procedure_call)를 통해 [언어 서버 프로토콜](https://microsoft.github.io/language-server-protocol)을 사용하여 통신합니다. 
편집기에 입력할 때, 편집기는 프로젝트의 상태를 추적하기 위해 언어 서비스 프로세스에 정보를 보냅니다.

템플릿 내에서 완성 목록을 트리거하면, 편집기는 먼저 템플릿을 HTML [추상 구문 트리 (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree)로 구문 분석합니다. 
Angular 컴파일러는 해당 트리를 해석하여 컨텍스트를 결정합니다: 템플릿이 어떤 모듈의 일부인지, 현재 범위, 컴포넌트 선택기, 그리고 템플릿 AST에서 커서가 있는 위치를 결정합니다. 
그런 다음 해당 위치에 있을 수 있는 기호를 결정할 수 있습니다.

보간에 있는 경우는 조금 더 복잡합니다.
`div` 내부에 `{{data.---}}`의 보간이 있고 `data.---` 다음에 완성 목록이 필요하면, 컴파일러는 HTML AST를 사용하여 답변을 찾을 수 없습니다. 
HTML AST는 컴파일러에게 "`{{data.---}}`"라는 문자가 있는 일부 텍스트가 있다는 것만 알릴 수 있습니다. 
이때 템플릿 파서는 표현식 AST를 생성하여 템플릿 AST 내에 위치시킵니다. 
그 후 Angular 언어 서비스는 컨텍스트 내에서 `data.---`를 살펴보고 TypeScript 언어 서비스에 `data`의 구성원이 무엇인지 물어본 후 가능성 목록을 반환합니다.

## 추가 정보

* 구현에 대한 더 심도 있는 정보는 [Angular 언어 서비스 소스](https://github.com/angular/angular/blob/main/packages/language-service/src)를 참조하십시오.
* 디자인 고려 사항 및 의도에 대한 자세한 내용은 [여기 디자인 문서](https://github.com/angular/vscode-ng-language-service/wiki/Design)를 참조하십시오.