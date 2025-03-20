# DevTools 개요

Angular DevTools는 Angular 애플리케이션을 위한 디버깅 및 프로파일링 기능을 제공하는 브라우저 확장입니다.

<docs-video src="https://www.youtube.com/embed/bavWOHZM6zE"/>

[Chrome 웹 스토어](https://chrome.google.com/webstore/detail/angular-developer-tools/ienfalfjdbdpebioblfackkekamfmbnh) 또는 [Firefox 부가 기능](https://addons.mozilla.org/firefox/addon/angular-devtools/)에서 Angular DevTools를 설치하세요.

Chrome 또는 Firefox DevTools를 열려면 모든 웹 페이지에서 <kbd>F12</kbd> 또는 <kbd><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd></kbd> (Windows 또는 Linux), <kbd><kbd>Fn</kbd>+<kbd>F12</kbd></kbd> 또는 <kbd><kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd></kbd> (Mac)을 누르세요.
브라우저 DevTools가 열리고 Angular DevTools가 설치되면 "Angular" 탭 아래에서 찾을 수 있습니다.

도움말: Chrome의 새 탭 페이지에서는 설치된 확장이 실행되지 않으므로 Angular 탭은 DevTools에 나타나지 않습니다. 다른 페이지를 방문하여 확인하세요.

<img src="assets/images/guide/devtools/devtools.png" alt="애플리케이션을 위한 구성 요소 트리를 보여주는 Angular DevTools 개요.">

## 애플리케이션 열기

확장을 열면 추가적인 두 개의 탭이 표시됩니다:

| 탭                                   | 세부사항 |
|:---                                  |:---      |
| [Components](tools/devtools#debug-your-application) | 애플리케이션의 구성 요소 및 지시어를 탐색하고 그 상태를 미리 보거나 편집할 수 있습니다.                    |
| [Profiler](tools/devtools#profile-your-application)  | 애플리케이션의 프로파일을 생성하고 변경 감지 실행 중 성능 병목 지점을 이해할 수 있습니다. |

<img src="assets/images/guide/devtools/devtools-tabs.png" alt="왼쪽 상단에 'Components'라는 레이블이 붙은 탭 하나와 'Profiler'라는 레이블이 붙은 두 번째 탭이 있는 Angular DevTools 상단의 스크린샷.">

Angular DevTools의 오른쪽 상단 모서리에서는 페이지에서 실행 중인 Angular 버전과 확장에 대한 최신 커밋 해시를 찾을 수 있습니다.

### Angular 애플리케이션이 감지되지 않음

Angular DevTools를 열 때 "Angular 애플리케이션이 감지되지 않음"이라는 오류 메시지가 나타나면, 이는 페이지에서 Angular 앱과 통신할 수 없음을 의미합니다.
가장 일반적인 이유는 검사 중인 웹 페이지에 Angular 애플리케이션이 포함되어 있지 않기 때문입니다.
올바른 웹 페이지를 검사하고 Angular 앱이 실행 중인지 다시 확인하세요.

### 프로덕션 구성으로 구축된 애플리케이션이 감지됨

"프로덕션 구성으로 구축된 애플리케이션이 감지되었습니다. Angular DevTools는 개발 빌드만 지원합니다."라는 오류 메시지가 나타나면, 이는 페이지에서 Angular 애플리케이션이 발견되었지만 프로덕션 최적화로 컴파일되었음을 의미합니다.
프로덕션을 위해 컴파일할 때 Angular CLI는 성능 향상을 위해 페이지의 JavaScript 양을 최소화하기 위해 다양한 디버그 기능을 제거합니다. 여기에는 DevTools와의 통신에 필요한 기능이 포함됩니다.

DevTools를 실행하려면 최적화를 비활성화하고 애플리케이션을 컴파일해야 합니다. `ng serve`는 기본적으로 이를 수행합니다.
배포된 애플리케이션을 디버깅해야 하는 경우 [`optimization` 구성 옵션](reference/configs/workspace-config#optimization-configuration)으로 빌드에서 최적화를 비활성화하세요 (`{"optimization": false}`).

## 애플리케이션 디버그

**Components** 탭을 통해 애플리케이션의 구조를 탐색할 수 있습니다.
DOM에서 구성 요소 및 지시어 인스턴스를 시각화하고 그 상태를 검사하거나 수정할 수 있습니다.

### 애플리케이션 구조 탐색

구성 요소 트리는 애플리케이션 내의 *구성 요소 및 지시어* 간의 계층 관계를 표시합니다.

<img src="assets/images/guide/devtools/component-explorer.png" alt="애플리케이션의 루트에서 시작하는 Angular 구성 요소 및 지시어의 트리를 보여주는 'Components' 탭의 스크린샷.">

구성 요소 탐색기에서 개별 구성 요소 또는 지시어를 클릭하여 선택하고 속성을 미리 볼 수 있습니다.
Angular DevTools는 구성 요소 트리의 오른쪽에 속성과 메타데이터를 표시합니다.

이름으로 구성 요소나 지시어를 찾으려면 구성 요소 트리 위의 검색 상자를 사용하세요.

<img src="assets/images/guide/devtools/search.png" alt="Components 탭의 스크린샷. 탭 아래에 있는 필터 바가 'todo'를 검색하고 있으며, 이름에 'todo'가 포함된 모든 구성 요소가 트리에서 강조 표시됩니다. 현재 선택되어 있는 것은 `app-todos`이며, 오른쪽 사이드바에는 구성 요소 속성에 대한 정보가 표시됩니다. 여기에는 `@Output` 필드 섹션과 다른 속성 섹션이 포함됩니다.">

### 호스트 노드로 이동

특정 구성 요소 또는 지시어의 호스트 요소로 이동하려면 구성 요소 탐색기에서 두 번 클릭하세요.
Angular DevTools는 Chrome의 Elements 탭 또는 Firefox의 Inspector 탭을 열고 관련 DOM 노드를 선택합니다.

### 소스로 이동

구성 요소의 경우 Angular DevTools는 Sources 탭(Chrome) 및 Debugger 탭(Firefox)에서 구성 요소 정의로 이동할 수 있습니다.
특정 구성 요소를 선택한 후 속성 보기의 오른쪽 상단에 있는 아이콘을 클릭하세요:

<img src="assets/images/guide/devtools/navigate-source.png" alt="Components 탭의 스크린샷. 오른쪽에서 속성 보기가 나타나고, 마우스가 해당 뷰의 오른쪽 상단에 있는 `<>` 아이콘 위에 놓여 있습니다. 인접한 툴팁에는 '구성 요소 소스 열기'라고 적혀 있습니다.">

### 속성 값 업데이트

브라우저의 DevTools와 마찬가지로 속성 보기에서는 입력, 출력 또는 기타 속성의 값을 편집할 수 있습니다.
속성 값을 마우스 오른쪽 버튼으로 클릭하면 이 값 유형에 대해 편집 기능이 가능한 경우 텍스트 입력란이 나타납니다.
새 값을 입력하고 `Enter`를 눌러 이 값을 속성에 적용하세요.

<img src="assets/images/guide/devtools/update-property.png" alt="구성 요소에 대한 속성 보기의 스크린샷을 open. `@Input` 이름이 `todo`인 속성이 선택되었으며, 현재 '우유 사기' 값으로 수동 업데이트되었습니다.">

### 콘솔에서 선택한 구성 요소 또는 지시어에 액세스

콘솔의 바로 가기로 Angular DevTools는 최근 선택된 구성 요소 또는 지시어의 인스턴스에 대한 액세스를 제공합니다.
현재 선택된 구성 요소나 지시어의 인스턴스에 대한 참조를 얻으려면 `$ng0`를 입력하고, 이전에 선택된 인스턴스에 대해서는 `$ng1`, 그 전 인스턴스에 대해서는 `$ng2`와 같이 입력하세요.

<img src="assets/images/guide/devtools/access-console.png" alt="브라우저 콘솔 아래의 'Components' 탭의 스크린샷. 콘솔에 사용자가 `$ng0`, `$ng1`, `$ng2` 세 개의 명령을 입력하여 최근에 선택된 세 개의 요소를 확인하고 있습니다. 각 명령 후에 콘솔은 다른 구성 요소 참조를 출력합니다.">

### 지시어 또는 구성 요소 선택

브라우저의 DevTools와 유사하게 페이지를 검사하여 특정 구성 요소나 지시어를 선택할 수 있습니다.
Angular DevTools의 왼쪽 상단에 있는 ***Inspect element*** 아이콘을 클릭하고 페이지의 DOM 요소 위에 마우스를 올려놓으세요.
확장 프로그램은 관련된 지시어 및/또는 구성 요소를 인식하고 구성 요소 트리에서 해당 요소를 선택할 수 있게 합니다.

<img src="assets/images/guide/devtools/inspect-element.png" alt="Angular todo 애플리케이션이 표시된 'Components' 탭의 스크린샷. Angular DevTools의 왼쪽 상단 모서리에서 아이콘이 선택되어 있으며 마우스가 Angular 애플리케이션 UI의 todo 요소 위에 있습니다. 요소는 `<TodoComponent>`라는 레이블이 있는 툴팁과 함께 강조 표시됩니다.">

## 애플리케이션 프로파일링

**Profiler** 탭은 Angular의 변경 감지 실행을 시각화할 수 있게 해줍니다.
이는 변경 감지가 애플리케이션의 성능에 어떻게 영향을 미치는지를 이해하는 데 유용합니다.

<img src="assets/images/guide/devtools/profiler.png" alt="새로 녹음 시작 버튼을 클릭하거나 프로파일러 데이터를 포함하는 json 파일을 업로드하라는 메시지가 있는 'Profiler' 탭의 스크린샷. 그 옆에는 새로운 프로파일을 기록하기 시작하는 녹음 버튼과 기존 프로파일을 선택하는 파일 선택기가 있습니다.">

Profiler 탭에서는 현재 애플리케이션의 프로파일링을 시작하거나 이전 실행에서 기존 프로파일을 가져올 수 있습니다.
애플리케이션 프로파일링을 시작하려면 **Profiler** 탭의 왼쪽 상단 모서리에 있는 원 위로 마우스를 옮기고 **Start recording**을 클릭하세요.

프로파일링 중 Angular DevTools는 변경 감지 및 생명 주기 훅 실행과 같은 실행 이벤트를 캡처합니다.
변경 감지를 트리거하고 Angular DevTools가 사용할 수 있는 데이터를 생성하려면 애플리케이션과 상호작용하세요.
기록을 마치려면 원을 다시 클릭하여 **Stop recording**하세요.

기존 기록을 가져올 수도 있습니다.
이 기능에 대해 더 알아보려면 [Import recording](tools/devtools#import-and-export-recordings) 섹션을 참조하세요.

### 애플리케이션 실행 이해하기

프로파일을 기록하거나 가져온 후 Angular DevTools는 변경 감지 주기의 시각화를 표시합니다.

<img src="assets/images/guide/devtools/default-profiler-view.png" alt="프로파일이 기록되거나 업로드된 후 'Profiler' 탭의 스크린샷. 다양한 변경 감지 주기를 보여주는 막대 차트를 나타내며 '특정 변경 감지 주기를 미리 보려면 막대를 선택하세요'라는 텍스트가 있습니다.">

순서의 각 막대는 애플리케이션의 변경 감지 주기를 나타냅니다.
막대가 높을수록 이 주기에서 변경 감지를 실행하는 데 더 많은 시간이 소요되었음을 의미합니다.
막대를 선택하면 DevTools는 다음과 같은 유용한 정보를 표시합니다:

* 이 주기에서 캡처된 모든 구성 요소 및 지시어가 포함된 막대 차트
* 이 주기에서 Angular가 변경 감지를 실행하는 데 소요된 시간.
* 사용자 경험에 따른 추정 프레임 속도.
* 변경 감지를 트리거한 소스.

<img src="assets/images/guide/devtools/profiler-selected-bar.png" alt="선택된 사용자가 하나의 막대를 선택한 'Profiler' 탭의 스크린샷. 인접한 드롭다운 메뉴에는 'Bar chart'가 표시되어 있으며 아래에는 두 번째 막대 차트가 있습니다. 새로운 차트에는 `TodosComponent` 및 `NgForOf`라는 두 개의 막대가 있으며, 다른 막대는 무시할 수 있을 만큼 작습니다.">

### 구성 요소 실행 이해하기

변경 감지 주기를 클릭한 후 표시되는 막대 차트는 애플리케이션이 특정 구성 요소나 지시어에서 변경 감지를 실행하는 데 소요된 시간에 대한 자세한 정보를 표시합니다.

이 예제에서는 `NgForOf` 지시어가 소비한 총 시간을 보여줍니다.

<img src="assets/images/guide/devtools/directive-details.png" alt="선택된 `NgForOf` 막대가 보이는 'Profiler' 탭의 스크린샷. 오른쪽에 '소요 시간: 1.76 ms'라고 나와 있습니다. 여기에는 1.76 ms 걸린 `ngDoCheck` 메소드를 포함한 `NgForOf`라는 지시어가 있는 한 개의 행이 포함되어 있습니다. 이 지시어의 상위 계층을 포함하여 'Parent Hierarchy'로 레이블이 붙은 목록도 표시됩니다.">

### 계층적 보기

<img src="assets/images/guide/devtools/flame-graph-view.png" alt="사용자가 선택한 단일 막대가 표시된 'Profiler' 탭의 스크린샷. 근처의 드롭다운 메뉴는 이제 'Flame graph'의 수준을 보여주고, 그 아래에 불꽃 그래프가 표시됩니다. 불꽃 그래프는 '전체 애플리케이션' 및 'AppComponent'라는 두 개의 행으로 시작합니다. 그 아래 행은 여러 항목으로 분리되며, `[RouterOutlet]`와 `DemoAppComponent`가 세 번째 행에 표시됩니다. 몇 단계 깊이의 한 셀은 빨간색으로 강조 표시됩니다.">

변경 감지 실행을 불꽃 그래프와 같은 보기로 시각화할 수도 있습니다.

그래프의 각 타일은 렌더 트리의 특정 위치에서 화면의 요소를 나타냅니다.
예를 들어, 변경 감지 주기에서 `LoggedOutUserComponent`가 제거되고 대신 Angular가 `LoggedInUserComponent`를 렌더링하는 경우 두 구성 요소가 동일한 타일에 표시됩니다.

x축은 변경 감지 주기를 렌더링하는 데 소요된 총 시간을 나타냅니다.
y축은 요소 계층을 나타냅니다. 요소에 대한 변경 감지를 실행하려면 해당 지시어 및 하위 구성 요소를 렌더링해야 합니다.
이 그래프는 어떤 구성 요소가 렌더링하는 데 가장 오랜 시간이 걸리는지, 그 시간이 어디에 쓰이는지를 시각적으로 나타냅니다.

각 타일은 Angular가 그곳에서 얼마나 오랜 시간을 보냈는지에 따라 색이 지정됩니다.
Angular DevTools는 가장 오랜 시간이 소요된 타일에 대해 소요된 시간을 기준으로 색의 강도를 결정합니다.

특정 타일을 클릭하면 오른쪽 패널에서 해당 타일에 대한 세부 정보를 확인할 수 있습니다.
타일을 두 번 클릭하면 확대되어 중첩 자식 구성 요소를 더 쉽게 볼 수 있습니다.

### 변경 감지 및 `OnPush` 구성 요소 디버깅

정상적으로 그래프는 주어진 변경 감지 프레임에서 애플리케이션을 *렌더링*하는 데 소요된 시간을 시각화합니다. 그러나 `OnPush` 구성 요소와 같은 일부 구성 요소는 입력 속성이 변경될 때만 다시 렌더링됩니다. 특정 프레임에 대해 이러한 구성 요소 없이 불꽃 그래프를 시각화하는 것이 유용할 수 있습니다.

변경 감지 프로세스를 거친 구성 요소만을 변경 감지 프레임에서 시각화하려면 불꽃 그래프 위에 있는 **Change detection** 체크박스를 선택하세요.

이 보기는 변경 감지 과정을 거친 모든 구성 요소를 강조 표시하고 다시 렌더링되지 않은 구성 요소(예: `OnPush` 구성 요소)를 회색으로 표시합니다.

<img src="assets/images/guide/devtools/debugging-onpush.png" alt="변경 감지 주기의 불꽃 차트 시각화를 보여주는 'Profiler' 탭의 스크린샷. 'Show only change detection'이라는 레이블이 붙은 체크박스가 이제 선택됨. 불꽃 그래프가 이전과 매우 유사하게 보이지만, 구성 요소의 색상이 주황색에서 파란색으로 변경되었습니다. `[RouterOutlet]`로 레이블이 붙은 여러 개의 타일은 더 이상 색으로 강조 표시되지 않습니다.">

### 기록 가져오기 및 내보내기

기록된 프로파일 세션의 오른쪽 상단에서 **Save Profile** 버튼을 클릭하여 JSON 파일로 내보내기하고 디스크에 저장하세요.
이후 처음 보기에 파일을 가져오려면 **Choose file** 입력을 클릭하세요.

<img src="assets/images/guide/devtools/save-profile.png" alt="변경 감지 주기를 보여주는 'Profiler' 탭의 스크린샷. 오른쪽에 'Save Profile' 버튼이 표시됩니다.">

 ## 인젝터 검사

 참고: 인젝터 트리는 버전 17 이상으로 구축된 Angular 애플리케이션에서 사용할 수 있습니다.

### 애플리케이션의 인젝터 계층 보기

**Injector Tree** 탭은 애플리케이션에서 구성된 인젝터의 구조를 탐색할 수 있게 해줍니다. 여기에는 애플리케이션의 [인젝터 계층](guide/di/hierarchical-dependency-injection)을 나타내는 두 개의 트리가 표시됩니다. 하나의 트리는 환경 계층이고, 다른 하나는 요소 계층입니다.

<img src="assets/images/guide/devtools/di-injector-tree.png" alt="예제 애플리케이션의 인젝터 그래프를 시각화하는 Angular Devtools의 인젝터 트리 탭을 보여주는 'Profiler' 탭의 스크린샷.">

 ### 해상도 경로 시각화

특정 인젝터가 선택되면 Angular의 종속성 주입 알고리즘이 해당 인젝터에서 루트까지 거치는 경로가 강조 표시됩니다. 요소 인젝터의 경우, 이는 종속성 주입 알고리즘이 요소 계층에서 종속성을 해결할 수 없는 경우 점프하는 환경 인젝터도 강조 표시합니다.

Angular가 해상도 경로를 해결하는 방법에 대한 자세한 내용은 [해상도 규칙](guide/di/hierarchical-dependency-injection#resolution-rules)을 참조하세요.

<img src="assets/images/guide/devtools/di-injector-tree-selected.png" alt="선택한 인젝터의 경로가 하이라이트된 인젝터 트리를 시각화하는 'Profiler' 탭의 스크린샷.">

 ### 인젝터 제공자 보기

구성된 제공자가 있는 인젝터를 클릭하면 인젝터 트리 보기의 오른쪽에 있는 제공자 목록이 표시됩니다. 여기서 제공된 토큰과 그 유형을 볼 수 있습니다.

<img src="assets/images/guide/devtools/di-injector-tree-providers.png" alt="선택된 인젝터가 제공자를 표시하는 'Profiler' 탭의 스크린샷.">