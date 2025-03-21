# 컴포넌트 테스트의 기초

컴포넌트는 Angular 애플리케이션의 다른 모든 부분과 달리 HTML 템플릿과 TypeScript 클래스를 결합합니다.  
컴포넌트는 실제로 템플릿과 클래스가 *협력하여* 작동하는 것입니다.  
컴포넌트를 적절하게 테스트하려면 이들이 의도한 대로 함께 작동하는지를 테스트해야 합니다.

이러한 테스트는 Angular가 수행하는 것처럼 브라우저 DOM에서 컴포넌트의 호스트 요소를 생성하고, 템플릿에 의해 설명된 DOM과의 컴포넌트 클래스의 상호작용을 조사해야 합니다.

Angular의 `TestBed`는 다음 섹션에서 보게 될 이러한 종류의 테스트를 용이하게 합니다.  
그러나 많은 경우 *DOM 참여 없이 컴포넌트 클래스를 단독으로 테스트하는 것*이 컴포넌트의 행동을 보다 직관적이고 명확하게 검증할 수 있습니다.

## 컴포넌트 DOM 테스트

컴포넌트는 단순히 클래스만이 아닙니다.  
컴포넌트는 DOM 및 다른 컴포넌트와 상호작용합니다.  
클래스만으로는 컴포넌트가 제대로 렌더링될지, 사용자 입력 및 제스처에 반응할지, 부모 및 자식 컴포넌트와 통합될지를 알 수 없습니다.

* `Lightswitch.clicked()`가 사용자가 호출할 수 있도록 바인딩되어 있습니까?  
* `Lightswitch.message`가 표시됩니까?  
* 사용자가 실제로 `DashboardHeroComponent`에서 표시되는 영웅을 선택할 수 있습니까?  
* 영웅 이름이 예상대로 표시됩니까 (예: 대문자)?  
* `WelcomeComponent`의 템플릿에서 환영 메시지가 표시됩니까?  

이 질문들은 이전의 간단한 컴포넌트들에는 큰 문제가 아닐 수 있습니다.  
그러나 많은 컴포넌트는 상태가 변경됨에 따라 HTML이 나타나고 사라지는 복잡한 DOM 요소와 상호작용합니다.

이러한 질문에 답하기 위해서는 컴포넌트와 연관된 DOM 요소를 생성해야 하고, 컴포넌트 상태가 적절한 시기에 올바르게 표시되는지 확인하기 위해 DOM을 검사해야 하며, 화면과 사용자 상호작용을 시뮬레이션하여 이러한 상호작용이 컴포넌트를 예상한 대로 동작하게 하는지를 확인해야 합니다.

이러한 종류의 테스트를 작성하려면 `TestBed`의 추가 기능과 기타 테스트 도우미를 사용해야 합니다.

### CLI로 생성된 테스트

CLI는 새로운 컴포넌트를 생성하라고 요청할 때 기본적으로 초기 테스트 파일을 생성합니다.

예를 들어, 다음 CLI 명령은 `app/banner` 폴더에 `BannerComponent`를 생성합니다(인라인 템플릿 및 스타일 포함):

<docs-code language="shell">

ng generate component banner --inline-template --inline-style --module app

</docs-code>

또한 해당 컴포넌트에 대한 초기 테스트 파일인 `banner-external.component.spec.ts`도 생성되며, 다음과 같습니다:

<docs-code header="app/banner/banner-external.component.spec.ts (initial)" path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="v1"/>

도움말: `compileComponents`는 비동기이므로 `@angular/core/testing`에서 가져온 [`waitForAsync`](api/core/testing/waitForAsync) 유틸리티 함수를 사용합니다.

자세한 내용은 [waitForAsync](guide/testing/components-scenarios#waitForAsync) 섹션을 참조하십시오.

### 설정 줄이기

이 파일의 마지막 세 줄만 실제로 컴포넌트를 테스트하며, Angular가 컴포넌트를 생성할 수 있음을 단언하는 것만 합니다.

파일의 나머지 부분은 컴포넌트가 본질적으로 발전하게 될 경우 더 고급 테스트를 예상하는 보일러플레이트 설정 코드입니다.

이러한 고급 테스트 기능에 대해서는 다음 섹션에서 배울 수 있습니다.  
현재는 이 테스트 파일을 더 관리하기 쉬운 크기로 극적으로 줄일 수 있습니다:

<docs-code header="app/banner/banner-initial.component.spec.ts (minimal)" path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="v2"/>

이 예제에서 `TestBed.configureTestingModule`에 전달된 메타데이터 객체는 단순히 테스트할 컴포넌트인 `BannerComponent`를 선언합니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="configureTestingModule"/>

도움말: 다른 항목을 선언하거나 가져올 필요가 없습니다.  
기본 테스트 모듈은 `@angular/platform-browser`의 `BrowserModule`과 유사하게 사전 구성되어 있습니다.

이후에는 테스트 요구에 맞게 가져오고 제공자 및 더 많은 선언을 할 수 있도록 `TestBed.configureTestingModule()`을 호출할 것입니다.  
선택적 `override` 메서드는 구성의 여러 측면을 추가로 세부 조정할 수 있습니다.

### `createComponent()`

`TestBed`를 구성한 후, `createComponent()` 메서드를 호출합니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="createComponent"/>

`TestBed.createComponent()`는 `BannerComponent`의 인스턴스를 생성하고, 테스트 실행기 DOM에 해당 요소를 추가하며, [`ComponentFixture`](#componentfixture)를 반환합니다.

중요: `createComponent`를 호출한 후에는 `TestBed`를 재구성하지 마십시오.

`createComponent` 메서드는 현재 `TestBed` 정의를 동결하여 추가 구성을 종료합니다.

이후 더 이상 `TestBed` 구성 메서드를 호출할 수 없으며 `configureTestingModule()`, `get()` 또는 `override...` 메서드도 호출할 수 없습니다.  
만약 호출하면 `TestBed`가 오류를 발생시킵니다.

### `ComponentFixture`

[ComponentFixture](api/core/testing/ComponentFixture)는 생성된 컴포넌트와 해당 요소와 상호작용하기 위한 테스트 하네스입니다.

픽스처를 통해 컴포넌트 인스턴스에 접근하고 존재하는지 Jasmine 기대값으로 확인합니다:

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="componentInstance"/>

### `beforeEach()`

이 컴포넌트가 발전함에 따라 더 많은 테스트를 추가할 것입니다.  
각 테스트에 대해 `TestBed` 구성을 중복하는 대신, Jasmine `beforeEach()`와 몇 가지 지원 변수를 통해 설정을 리팩토링합니다:

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="v3"/>

이제 `fixture.nativeElement`에서 컴포넌트의 요소를 가져와서 예상되는 텍스트를 찾는 테스트를 추가합니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="v4-test-2"/>

### `nativeElement`

`ComponentFixture.nativeElement`의 값은 `any` 타입입니다.  
나중에 `DebugElement.nativeElement`를 접하게 될 것이며, 이것도 `any` 타입입니다.

Angular는 컴파일 타임에 `nativeElement`가 어떤 종류의 HTML 요소인지 또는 HTML 요소인지조차 알 수 없습니다.  
애플리케이션은 서버나 [Web Worker](https://developer.mozilla.org/docs/Web/API/Web_Workers_API)와 같은 *비브라우저 플랫폼*에서 실행되고 있을 수 있으며, 이곳에서는 요소의 API가 제한되거나 아예 존재하지 않을 수 있습니다.

이 가이드의 테스트는 브라우저에서 실행되도록 설계되었으므로 `nativeElement` 값은 항상 `HTMLElement` 또는 그 파생 클래스 중 하나입니다.

어떤 종류의 `HTMLElement`인지 알기 때문에, 표준 HTML `querySelector`를 사용하여 요소 트리를 더 깊이 파고들 수 있습니다.

여기에는 `HTMLElement.querySelector`를 호출하여 단락 요소를 가져오고 배너 텍스트를 찾는 또 다른 테스트가 있습니다:

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="v4-test-3"/>

### `DebugElement`

Angular *fixture*는 `fixture.nativeElement`를 통해 컴포넌트의 요소를 직접 제공합니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="nativeElement"/>

이는 실제로 `fixture.debugElement.nativeElement`로 구현된 편의 메서드입니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="debugElement-nativeElement"/>

이러한 복잡한 경로로 요소에 접근하는 데는 좋은 이유가 있습니다.

`nativeElement`의 속성은 런타임 환경에 따라 달라집니다.  
이 테스트를 *비브라우저* 플랫폼에서 실행하고 있다면 DOM이 없거나 DOM 에뮬레이션이 전체 `HTMLElement` API를 지원하지 않을 수 있습니다.

Angular는 모든 지원 플랫폼에서 안전하게 작동하기 위해 `DebugElement` 추상화를 신뢰합니다.  
HTML 요소 트리를 만드는 대신, Angular는 런타임 플랫폼에 대한 *네이티브 요소*를 래핑하는 `DebugElement` 트리를 생성합니다.  
`nativeElement` 속성은 `DebugElement`의 래핑을 풀고 플랫폼별 요소 객체를 반환합니다.

이 가이드의 샘플 테스트는 브라우저에서만 실행되도록 설계되었기 때문에, 이 테스트의 `nativeElement`는 항상 테스트 내에서 탐색할 수 있는 친숙한 메서드와 속성을 가진 `HTMLElement`입니다.

다음은 `fixture.debugElement.nativeElement`로 다시 구현된 이전 테스트입니다:

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="v4-test-4"/>

`DebugElement`에는 테스트에서 유용한 다른 메서드와 속성도 있으며, 이 가이드의 다른 곳에서 살펴볼 수 있습니다.

`DebugElement` 기호를 Angular 핵심 라이브러리에서 가져옵니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="import-debug-element"/>

### `By.css()`

이 가이드의 모든 테스트는 브라우저에서 실행되지만, 일부 애플리케이션은 적어도 일부 시간에 다른 플랫폼에서 실행될 수 있습니다.

예를 들어, 이 컴포넌트는 애플리케이션을 느린 연결 장치에서 더 빠르게 시작할 수 있도록 서버에서 먼저 렌더링될 수 있습니다.  
서버 측 렌더러는 전체 HTML 요소 API를 지원하지 않을 수 있습니다.  
만약 `querySelector`를 지원하지 않는다면 이전 테스트는 실패할 수 있습니다.

`DebugElement`는 모든 지원 플랫폼에서 작동하는 쿼리 메서드를 제공합니다.  
이러한 쿼리 메서드는 `DebugElement` 트리에서 노드가 선택 기준과 일치할 때 `true`를 반환하는 *프레디케이트* 함수를 받습니다.

런타임 플랫폼을 위한 라이브러리에서 가져온 `By` 클래스를 도움으로 *프레디케이트*를 생성합니다.  
다음은 브라우저 플랫폼에 대한 `By` 가져오기입니다:

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="import-by"/>

다음 예제는 이전 테스트를 `DebugElement.query()`와 브라우저의 `By.css` 메서드로 다시 구현합니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner-initial.component.spec.ts" visibleRegion="v4-test-5"/>

주목할 만한 점은 다음과 같습니다:

* `By.css()` 정적 메서드는 [표준 CSS 선택자](https://developer.mozilla.org/docs/Learn/CSS/Building_blocks/Selectors 'CSS 선택자')로 `DebugElement` 노드를 선택합니다.  
* 쿼리는 단락에 대한 `DebugElement`를 반환합니다.  
* 결과를 풀어내야 단락 요소를 얻을 수 있습니다.

CSS 선택자로 필터링하고 브라우저의 *네이티브 요소*의 속성만 테스트하는 경우 `By.css` 접근 방식이 과할 수 있습니다.

종종 `querySelector()` 또는 `querySelectorAll()`과 같은 표준 `HTMLElement` 메서드로 필터링하는 것이 명확하고 간단할 수 있습니다.