# Angular 임베디드 문서 자습서

- [자습서 파일](#자습서-파일)
- [자습서 디렉토리 구조](#자습서-디렉토리-구조)
- [예약된 자습서 디렉토리](#예약된-자습서-디렉토리)

## 자습서 파일

자습서 내용은 자습서 내용, 소스 코드 및 구성으로 구성됩니다.

### 내용: `README.md`

자습서 내용은 자습서 디렉토리에 있는 `README.md` 파일에 위치해야 합니다.

`learn-angular` 자습서를 예로 들면: [`src/content/tutorials/learn-angular/intro/README.md`](/src/content/tutorials/learn-angular/intro/README.md)

### 구성: `config.json`

각 자습서는 다음 옵션을 가질 수 있는 `config.json`으로 정의됩니다:

- `title`: 자습서 탐색에서 사용되는 자습서 제목 정의
- `nextTutorial`: 다음 자습서의 경로(오직 `intro/` 단계에서만)
- `src`: 임베디드 에디터에서 사용되는 자습서 소스 코드를 정의하는 외부 디렉토리에 대한 상대 경로
- `answerSrc`: 임베디드 에디터에서 사용되는 자습서 답변을 정의하는 외부 디렉토리에 대한 상대 경로
- `openFiles`: 에디터에서 열릴 파일의 배열
- `type`: 자습서가 어떻게 표시될 것인지와 그 자습서에 필요한 구성 요소를 나타내는 유형
  - `cli`: `cli` 유형의 자습서는 내용과 Angular CLI가 포함된 대화형 터미널만 포함합니다
  - `editor`: 코드 에디터, 미리보기, 대화형 터미널 및 개발 서버의 출력이 포함된 콘솔을 포함하는 전체 임베디드 에디터에 사용됩니다
  - `local`: 임베디드 에디터를 비활성화하고 내용만 표시합니다
  - `editor-only`: 내용은 비활성화하고 단지 임베디드 에디터만 표시하는 자습서 놀이터 및 홈페이지 놀이터에 사용되는 특별한 구성

### 소스 코드

자습서 소스 코드는 `README.md` 및 `config.json`을 제외한 자습서 디렉토리의 모든 파일을 포함합니다.

자습서 소스 코드는 [`common`](#common) 프로젝트 파일보다 우선합니다. 따라서 같은 상대 경로를 가진 파일이 [`common`](#common)과 자습서 디렉토리에 모두 존재하는 경우, 자습서 파일이 [`common`](#common) 파일을 덮어씌웁니다.

## 자습서 디렉토리 구조

자습서는 소개 및 단계로 구성됩니다. 소개 및 각 단계는 각각의 내용, 구성 및 소스 코드를 포함합니다.

`learn-angular` 자습서를 예로 들면:

### 소개

[`src/content/tutorials/learn-angular/intro`](/src/content/tutorials/learn-angular/intro)

자습서의 소개로, `/tutorials/learn-angular` 경로에 위치합니다.

### 단계

[`src/content/tutorials/learn-angular/steps`](/src/content/tutorials/learn-angular/steps)는 자습서 단계를 포함하는 디렉토리입니다.

다음은 `learn-angular` 자습서의 몇 가지 예입니다:

- [`learn-angular/steps/1-components-in-angular`](/src/content/tutorials/learn-angular/steps/1-components-in-angular): 경로는 `/tutorials/learn-angular/components-in-angular`가 됩니다
- [`learn-angular/steps/2-updating-the-component-class`](/src/content/tutorials/learn-angular/steps/2-updating-the-component-class): 경로는 `/tutorials/learn-angular/updating-the-component-class`가 됩니다

각 단계 디렉토리는 하이픈 뒤에 숫자로 시작해야 하며, 그 다음에 단계 경로가 옵니다.

- 숫자는 단계, 즉 자습서 내에서 이전 단계와 다음 단계를 정의합니다.
- 하이픈은 구분자입니다 :).
- 디렉토리 이름에서 가져온 경로는 단계 URL을 정의합니다.

## 예약된 자습서 디렉토리

### `common`

공통 프로젝트는 모든 자습서에서 재사용되는 완전한 Angular 프로젝트입니다. 여기에는 모든
종속성(`package.json`, `package-lock.json`), 프로젝트 구성(`tsconfig.json`, `angular.json`) 및 애플리케이션을 부트스트랩하는 주요 파일(`index.html`, `main.ts`, `app.module.ts`)이 포함됩니다.

공통 프로젝트는 다양한 이유로 사용됩니다:

- 자습서의 파일 중복을 피합니다.
- 공통 프로젝트 파일 및 종속성을 한 번만 요청하여 앱 성능을 최적화하고, 이후 요청에서 브라우저 캐시의 이점을 누립니다.
- 모든 자습서에 대해 단일 `npm install`이 필요하므로, 다양한 자습서와 단계 간 탐색 시 자습서와의 대화 시간이 줄어듭니다.
- 모든 자습서에 대해 일관된 환경을 제공합니다.
- 각 자습서가 가르치는 내용에 대한 특정 소스 코드에 집중하고 프로젝트 설정에 집중하지 않도록 합니다.

[`src/content/tutorials/common`](/src/content/tutorials/common)을 참조하십시오.

### `playground`

플레이그라운드는 `/playground`에서 자습서 플레이그라운드의 소스 코드를 포함합니다. 내용은 포함하지 않아야 합니다.

[`src/content/tutorials/playground`](/src/content/tutorials/playground)을 참조하십시오.

### `homepage`

홈페이지는 홈페이지 플레이그라운드의 소스 코드를 포함합니다. 내용은 포함하지 않아야 합니다.

[`src/content/tutorials/homepage`](/src/content/tutorials/homepage)을 참조하십시오.

## 종속성 업데이트 

모든 자습서의 종속성을 업데이트하려면 다음 스크립트를 실행할 수 있습니다.

```bash 
rm ./adev/src/content/tutorials/homepage/package-lock.json  ./adev/src/content/tutorials/first-app/common/package-lock.json ./adev/src/content/tutorials/learn-angular/common/package-lock.json ./adev/src/content/tutorials/playground/common/package-lock.json 

npm i --package-lock-only --prefix ./adev/src/content/tutorials/homepage
npm i --package-lock-only --prefix ./adev/src/content/tutorials/first-app/common
npm i --package-lock-only --prefix ./adev/src/content/tutorials/learn-angular/common               
npm i --package-lock-only --prefix ./adev/src/content/tutorials/playground/common