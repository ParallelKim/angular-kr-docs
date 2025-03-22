# EmbeddedEditor 구성 요소, 서비스 및 기능

- [시나리오](#scenarios)
  - [프로젝트 로딩](#loading-a-project)
  - [코드 업데이트](#updating-the-code)
  - [새 파일 생성](#creating-a-new-file)
  - [파일 삭제](#deleting-a-file)
  - [프로젝트 전환](#switching-a-project)
- [구성 요소 및 서비스](#components-and-services)

  - [EmbeddedEditor](#embeddededitor)
  - [CodeEditor](#codeeditor)
    - [CodeMirrorEditor](#codemirroreditor)
      - [TypeScript 웹 워커](#typescript-web-worker)
  - [미리보기](#preview)
  - [터미널](#terminal)
    - [InteractiveTerminal](#interactiveterminal)
    - [콘솔](#Console)
  - [NodeRuntimeSandbox](#noderuntimesandbox)
    - [NodeRuntimeState](#noderuntimestate)
  - [EmbeddedTutorialManager](#embeddedtutorialmanager)
  - [EditorUiState](#editoruistate)
  - [DownloadManager](#downloadmanager)
  - [AlertManager](#alertmanager)
  - [TypingsLoader](#typingsloader)

## 외부 라이브러리

- [WebContainers API](https://webcontainers.io/)
- [CodeMirror](https://codemirror.net/)
- [@typescript/vfs](https://www.npmjs.com/package/@typescript/vfs)
- [Xterm.js](https://xtermjs.org/)

## 노트

- 튜토리얼 스크립트에 대한 자세한 정보는 [scripts/tutorials/README.md](/scripts/tutorials/README.md)를 참조하세요.
- 튜토리얼 콘텐츠에 대한 자세한 정보는 [adev/src/content/tutorials/README.md](/adev/src/content/tutorials/README.md)를 참조하세요.

---

## 시나리오

### 프로젝트 로딩

1. EmbeddedEditor를 위한 페이지는 [`EmbeddedEditor`](./embedded-editor.component.ts) 구성 요소와 [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)를 지연 로딩하고, 모든 구성 요소 및 서비스의 초기화를 트리거합니다. EmbeddedEditor는 다음 페이지에서 사용할 수 있습니다:

   - 홈페이지: <https:angular-kr-docs.web.appv>
   - 플레이그라운드: https:/angular-kr-docs.web.app/playground
   - 튜토리얼 페이지: <https:/angular-kr-docs.web.app/tutorials>

2. 프로젝트 자산은 [`EmbeddedTutorialManager`](./embedded-tutorial-manager.service.ts)에 의해 가져옵니다. 이 동안:

   - 코드 편집기가 초기화됩니다
   - 코드 편집기는 TypeScript 웹 워커를 초기화하며, 이는 TypeScript의 CDN을 사용해 "기본 파일 시스템 맵"을 초기화합니다.
   - WebContainer가 초기화됩니다
   - 터미널이 초기화됩니다

3. 튜토리얼 소스 코드는 [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)에 의해 `WebContainer`의 파일 시스템에 마운트됩니다.
4. 튜토리얼 프로젝트의 종속성이 [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)에 의해 설치됩니다.
5. 개발 서버는 [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)에 의해 시작되며, 타입은 [`TypingsLoader`](./typings-loader.service.ts) 서비스에 의해 로드됩니다.
6. 미리보기는 개발 서버가 시작된 후 WebContainer API에서 제공하는 URL로 로드됩니다.
7. 프로젝트가 준비됩니다.

### 코드 업데이트

1. 사용자는 코드 편집기에서 코드를 업데이트합니다.
2. 코드 편집기 상태는 실시간으로 업데이트되며, 사용자에게 코드 편집기에서 변경 사항을 확인할 수 있도록 하며, CodeMirror는 변경 사항을 적절히 처리합니다.
3. 동시에, 변경 사항은 TypeScript 웹 워커에 전달되어 가능한 한 빨리 진단, 자동 완완 및 타입 기능을 제공합니다.
4. 코드 변경 사항은 [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)에 의해 WebContainer 파일 시스템에 기록되기 위해 디바운스됩니다.
5. 디바운스 시간이 초과되면 코드 변경 사항이 [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)에 의해 WebContainer 파일 시스템에 기록되며, 사용자는 미리보기에서 변경 사항을 확인할 수 있습니다.

### 새 파일 생성

1. 사용자가 새 파일 버튼을 클릭합니다.
2. 새 파일 탭이 열립니다.
3. 사용자가 새 파일 이름을 입력합니다.
4. 파일 이름이 유효하면, [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)에 의해 WebContainer 파일 시스템에서 파일이 생성됩니다.

   - `..`는 사용자들이 `src` 디렉토리 외부에 파일을 생성하지 못하도록 파일 이름에 허용되지 않습니다.

5. 파일은 TypeScript 가상 파일 시스템에 추가되어 새로운 파일에 대한 진단, 자동 완완 및 타입 기능을 제공할 수 있게 됩니다. 또한, 새로운 파일에서의 내보내기는 다른 파일에서 사용할 수 있습니다.
6. 새로운 파일은 코드 편집기에서 마지막 탭으로 추가되며, 새 파일은 편집할 수 있습니다.

노트: 새 파일 이름이 이미 존재하지만 코드 편집기에서 숨겨진 파일과 일치할 경우, 해당 파일의 콘텐츠가 생성된 파일에 표시됩니다. 항상 존재하는 파일의 예는 `index.html`입니다.

### 파일 삭제

1. 사용자가 파일 삭제 버튼을 클릭합니다.
2. 파일은 [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)에 의해 WebContainer 파일 시스템에서 삭제됩니다.
3. 파일은 TypeScript 가상 파일 시스템에서 제거됩니다.
4. 파일은 코드 편집기 탭에서 제거됩니다.

노트: 일부 파일은 사용자가 애플리케이션을 파괴하는 것을 방지하기 위해 삭제할 수 없습니다. 해당 파일은 `src/main.ts` 및 `src/index.html`입니다.

### 프로젝트 전환

EmbeddedEditor는 EmbeddedEditor가 이미 초기화된 상태에서 사용자가 다음 시나리오에서 페이지를 변경할 때 프로젝트 변경을 고려합니다:

- 튜토리얼 단계를 탐색할 때
- EmbeddedEditor가 초기화된 후 홈페이지에서 플레이그라운드로 이동할 때
- 튜토리얼 페이지에서 플레이그라운드로 이동할 때
- 튜토리얼 페이지에서 홈페이지로 이동할 때
- 플레이그라운드에서 홈페이지로 이동할 때

프로젝트 변경이 감지되면, [`EmbeddedTutorialManager`](./embedded-tutorial-manager.service.ts)는 `tutorialChanged` 옵저버블을 방출하며, 이는 여러 하위 구성 요소 및 서비스에서 수신 대기되고, 각 구성 요소/서비스는 프로젝트 전환에 필요한 작업을 수행합니다.

프로젝트 변경 시 다음 단계가 실행됩니다:

1. 새로운 프로젝트 파일은 [`EmbeddedTutorialManager`](./embedded-tutorial-manager.service.ts)에 의해 가져옵니다.
2. 새로운 프로젝트 파일은 WebContainer 파일 시스템에 마운트됩니다.
3. TypeScript 가상 파일 시스템은 새로운 파일 및 내용으로 업데이트됩니다.
4. 이전 프로젝트와 새로운 프로젝트 파일이 비교됩니다.
   1. 새로운 프로젝트에 없는 파일은 WebContainer 파일 시스템에서 삭제됩니다.
   2. 같은 경로와 이름을 가진 파일은 파일이 마운트 될 때 이전 단계에서 그 콘텐츠가 대체됩니다.
5. 이전 프로젝트 종속성이 새로운 프로젝트 종속성과 비교됩니다.
   1. 차이가 있으면, `npm install`이 실행되어 미리보기를 숨기고 설치 로딩 단계로 진행됩니다.
   2. 차이가 없으면, 프로젝트가 준비됩니다.
6. 일부 상태가 리셋되며, 예를 들어 이전 프로젝트가 "답안 표시" 상태였던 경우 "답안 표시" 상태가 리셋됩니다.

## 구성 요소 및 서비스

### [`EmbeddedEditor`](./embedded-editor.component.ts)

EmbeddedEditor는 EmbeddedEditor를 구성하는 모든 구성 요소 및 서비스를 보유하는 부모 구성 요소입니다.

#### [`CodeEditor`](./code-editor/code-editor.component.ts)

코드 편집기 뷰와 코드 편집기 상태를 보유하는 구성 요소입니다.

##### [`CodeMirrorEditor`](./code-editor/code-mirror-editor.service.ts)

[CodeMirror](https://codemirror.net/)는 코드 편집기를 다루기 위해 사용되는 라이브러리입니다.

`CodeMirrorEditor` 서비스는 CodeMirror 인스턴스와 코드 편집기를 다루기 위해 사용되는 모든 상호작용을 관리합니다.

- 파일 편집 및 CodeMirror 뷰와 상태 처리
- 코드 편집기에서 현재 프로젝트 파일 관리
- 파일 생성 및 삭제 처리
- 파일 변경 처리
- 모든 CodeMirror 특화 이벤트와 확장을 처리

###### [TypeScript 웹 워커](./code-editor/workers/typescript-vfs.worker.ts)

TypeScript 기능은 `CodeMirrorEditor` 서비스에 의해 초기화된 TypeScript 웹 워커에 의해 제공됩니다.

TypeScript 웹 워커는 `@typescript/vfs` 및 TypeScript 언어 서비스를 사용하여 진단, 자동 완완 및 타입 기능을 제공합니다.

#### [`Preview`](./preview/preview.component.ts)

미리보기 구성 요소는 튜토리얼 프로젝트 미리보기를 표시하는 책임이 있는 `iframe`을 관리하며, 개발 서버가 시작된 후 WebContainer API에서 제공되는 URL을 사용합니다.

프로젝트가 초기화되는 동안, 미리보기는 로딩 상태를 표시합니다.

#### [`Terminal`](./terminal/terminal.component.ts)

[Xterm.js](https://xtermjs.org/)는 터미널을 다루기 위해 사용되는 라이브러리입니다.

터미널 구성 요소는 콘솔을 위한 Xterm.js 인스턴스와 인터랙티브 터미널을 처리합니다.

##### [`InteractiveTerminal`](./terminal/interactive-terminal.ts)

인터랙티브 터미널은 사용자가 터미널과 상호작용하고 명령어를 실행할 수 있는 터미널로 Angular CLI용 명령어만 지원합니다.

##### 콘솔

콘솔은 `npm install` 및 `ng serve`의 출력을 표시합니다.

#### [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)

WebContainer 인스턴스와 API 간의 모든 통신을 관리하는 책임이 있는 서비스입니다. 이 서비스는 다음을 처리합니다:

- WebContainer 인스턴스
- 모든 Node.js 스크립트
- WebContainer 파일 시스템, 튜토리얼 프로젝트 파일을 마운트하고 새로운 내용을 기록하고, 파일을 삭제 및 생성합니다.
- 터미널 세션, 사용자 입력을 읽고 처리합니다.
- 튜토리얼 프로젝트 종속성, 종속성을 설치합니다.
- WebContainer 내부에서 실행되는 프로세스, 종속성을 설치하고 개발 서버를 실행하며 사용자의 입력을 `ng` CLI에 전달합니다.

##### [`NodeRuntimeState`](./node-runtime-state.service.ts)

[`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)의 로딩 및 오류 상태를 관리합니다.

#### [`EmbeddedTutorialManager`](./embedded-tutorial-manager.service.ts)

튜토리얼 자산을 관리하며, 튜토리얼 소스 코드와 메타데이터를 가져오는 책임이 있습니다.

소스 코드는 [`NodeRuntimeSandbox`](./node-runtime-sandbox.service.ts)에 의해 WebContainer 파일 시스템에 마운트됩니다.

메타데이터는 프로젝트 관리, 프로젝트 변경 처리 및 사용자와 애플리케이션 간의 상호작용을 처리하는 데 사용됩니다.

이 서비스는 또한 답안 표시 및 답안 표시 재설정 기능을 처리합니다.

#### [`EditorUiState`](./editor-ui-state.service.ts)

편집기 UI 상태를 관리하며, 편집기 탭 간의 사용자 상호작용을 처리하고 미리보기, 터미널 및 콘솔 간의 전환을 담당합니다.

#### [`DownloadManager`](./download-manager.service.ts)

EmbeddedEditor에서 다운로드 버튼을 처리하는 책임이 있으며, 튜토리얼 프로젝트 파일을 가져오고 프로젝트 내용을 포함하는 zip 파일을 생성합니다.

#### [`AlertManager`](./alert-manager.service.ts)

EmbeddedEditor에서 표시되는 알림을 관리하며, 여러 탭이 열린 경우 메모리 부족 경고 및 지원되지 않는 환경 경고를 포함합니다.

#### [`TypingsLoader`](./typings-loader.service.ts)

코드 편집기를 위한 타입 정의를 관리합니다.
