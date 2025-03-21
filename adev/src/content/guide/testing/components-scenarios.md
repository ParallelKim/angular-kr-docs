# 컴포넌트 테스트 시나리오

이 가이드는 일반적인 컴포넌트 테스트 사용 사례를 탐구합니다.

## 컴포넌트 바인딩

예제 애플리케이션에서 `BannerComponent`는 HTML 템플릿에서 정적 제목 텍스트를 표시합니다.

몇 가지 변경 후, `BannerComponent`는 컴포넌트의 `title` 속성에 바인딩하여 동적 제목을 표시합니다.

<docs-code header="app/banner/banner.component.ts" path="adev/src/content/examples/testing/src/app/banner/banner.component.ts" visibleRegion="component"/>

이것은 최소한으로 보일 수 있지만, 컴포넌트가 실제로 올바른 내용을 표시하는지 확인하기 위해 테스트를 추가하기로 결정합니다.

### `<h1>` 쿼리

여러분은 *title* 속성 보간 바인딩을 감싸는 `<h1>` 요소의 값을 검사하는 테스트 시퀀스를 작성할 것입니다.

`beforeEach`를 업데이트하여 표준 HTML `querySelector`로 해당 요소를 찾고 이를 `h1` 변수에 할당합니다.

<docs-code header="app/banner/banner.component.spec.ts (setup)" path="adev/src/content/examples/testing/src/app/banner/banner.component.spec.ts" visibleRegion="setup"/>

### `createComponent()`는 데이터를 바인딩하지 않음

첫 번째 테스트에서 화면에 기본 `title`이 표시되는지 확인하고 싶습니다.
여러분의 본능은 이렇게 `<h1>`을 즉시 검사하는 테스트를 작성하는 것입니다:

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner.component.spec.ts" visibleRegion="expect-h1-default-v1"/>

*해당 테스트는 실패합니다*라는 메시지와 함께:

<docs-code language="javascript">

expected '' to contain 'Test Tour of Heroes'.

</docs-code>

바인딩은 Angular가 **변경 감지**를 수행할 때 발생합니다.

프로덕션에서 변경 감지는 Angular가 컴포넌트를 생성하거나 사용자가 키를 입력할 때 자동으로 시작됩니다.

`TestBed.createComponent`는 기본적으로 변경 감지를 트리거하지 않습니다; 이는 수정된 테스트에서 확인됩니다:

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner.component.spec.ts" visibleRegion="test-w-o-detect-changes"/>

### `detectChanges()`

`fixture.detectChanges()`를 호출하여 `TestBed`에 데이터 바인딩을 수행하도록 지시할 수 있습니다.
그때서야 `<h1>`이 예상 제목을 가집니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner.component.spec.ts" visibleRegion="expect-h1-default"/>

지연된 변경 감지는 의도적이며 유용합니다.
테스터에게 Angular가 데이터 바인딩을 시작하고 [생명주기 훅](guide/components/lifecycle)을 호출하기 전에 컴포넌트 상태를 검사하고 변경할 기회를 제공합니다.

다음은 `fixture.detectChanges()`를 호출하기 *전에* 컴포넌트의 `title` 속성을 변경하는 또 다른 테스트입니다.

<docs-code path="adev/src/content/examples/testing/src/app/banner/banner.component.spec.ts" visibleRegion="after-change"/>

### 자동 변경 감지

`BannerComponent` 테스트는 자주 `detectChanges`를 호출합니다.
많은 테스터는 Angular의 테스트 환경이 프로덕션과 같이 변경 감지를 자동으로 실행하기를 선호합니다.

이를 위해 `TestBed`를 `ComponentFixtureAutoDetect` 제공자와 함께 구성할 수 있습니다.
먼저 테스트 유틸리티 라이브러리에서 가져옵니다:

<docs-code header="app/banner/banner.component.detect-changes.spec.ts (import)" path="adev/src/content/examples/testing/src/app/banner/banner.component.detect-changes.spec.ts" visibleRegion="import-ComponentFixtureAutoDetect"/>

그런 다음 테스트 모듈 구성의 `providers` 배열에 추가합니다:

<docs-code header="app/banner/banner.component.detect-changes.spec.ts (AutoDetect)" path="adev/src/content/examples/testing/src/app/banner/banner.component.detect-changes.spec.ts" visibleRegion="auto-detect"/>

도움말: 업데이트 후에만 구성 요소의 상태에 대한 자동 변경 감지를 활성화하려는 경우에는 `fixture.autoDetectChanges()` 함수를 사용할 수 있습니다. 더불어, `provideExperimentalZonelessChangeDetection`를 사용할 때 자동 변경 감지가 기본적으로 활성화되며 이를 비활성화하는 것은 권장되지 않습니다.

자동 변경 감지가 작동하는 방식을 설명하는 세 가지 테스트가 있습니다.

<docs-code header="app/banner/banner.component.detect-changes.spec.ts (AutoDetect Tests)" path="adev/src/content/examples/testing/src/app/banner/banner.component.detect-changes.spec.ts" visibleRegion="auto-detect-tests"/>

첫 번째 테스트는 자동 변경 감지의 이점을 보여줍니다.

두 번째 및 세 번째 테스트는 중요한 제한점을 드러냅니다.
Angular 테스트 환경은 컴포넌트의 `title`을 변경한 테스트 케이스 내에서 업데이트가 발생할 때 변경 감지를 동기적으로 실행하지 않습니다.
테스트는 `await fixture.whenStable`을 호출하여 또 다른 변경 감지 라운드를 기다려야 합니다.

도움말: Angular는 신호가 아닌 값에 대한 직접 업데이트에 대해 알지 못합니다. 템플릿에서 읽는 값에 대해 변경 감지가 예약되도록 하려면 신호를 사용하는 것이 가장 간단한 방법입니다.

### `dispatchEvent()`로 입력 값 변경

사용자 입력을 시뮬레이션하려면 입력 요소를 찾아 `value` 속성을 설정합니다.

하지만 중요한 중간 단계가 있습니다.

Angular는 입력 요소의 `value` 속성을 설정했다는 것을 알지 못합니다.
`dispatchEvent()`를 호출하여 요소의 `input` 이벤트를 발생시킬 때까지 해당 속성을 읽지 않습니다.

다음 예제가 올바른 순서를 보여줍니다.

<docs-code header="app/hero/hero-detail.component.spec.ts (pipe test)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="title-case-pipe"/>

## 외부 파일이 있는 컴포넌트

이전의 `BannerComponent`는 `@Component.template` 및 `@Component.styles` 속성에 지정된 *인라인 템플릿* 및 *인라인 CSS*로 정의됩니다.

많은 컴포넌트는 *외부 템플릿*과 *외부 CSS*를 `@Component.templateUrl` 및 `@Component.styleUrls` 속성을 사용해 지정합니다. 이는 다음과 같은 `BannerComponent`의 변형입니다.

<docs-code header="app/banner/banner-external.component.ts (metadata)" path="adev/src/content/examples/testing/src/app/banner/banner-external.component.ts" visibleRegion="metadata"/>

이 구문은 Angular 컴파일러에게 컴포넌트 컴파일 중에 외부 파일을 읽으라고 지시합니다.

CLI `ng test` 명령을 실행할 때는 문제가 발생하지 않는데, 이 명령은 *테스트를 실행하기 전에 애플리케이션을 컴파일하기 때문입니다*.

그러나 **비 CLI 환경**에서 테스트를 실행하면 이 컴포넌트의 테스트가 실패할 수 있습니다.
예를 들어 [plunker](https://plnkr.co)와 같은 웹 코딩 환경에서 `BannerComponent` 테스트를 실행하면 다음과 같은 메시지가 표시됩니다:

<docs-code hideCopy language="shell">

Error: This test module uses the component BannerComponent
which is using a "templateUrl" or "styleUrls", but they were never compiled.
Please call "TestBed.compileComponents" before your test.

</docs-code>

이러한 테스트 실행 중에 런타임 환경이 소스 코드를 컴파일할 때 이 오류 메시지가 표시됩니다.

문제를 해결하려면 다음 [Calling compileComponents](#calling-compilecomponents) 섹션에 설명된 대로 `compileComponents()`를 호출합니다.

## 의존성이 있는 컴포넌트

컴포넌트는 종종 서비스 의존성을 가집니다.

`WelcomeComponent`는 로그인한 사용자에게 환영 메시지를 표시합니다.
이 컴포넌트는 주입된 `UserService`의 속성을 기반으로 누구인지 알고 있습니다:

<docs-code header="app/welcome/welcome.component.ts" path="adev/src/content/examples/testing/src/app/welcome/welcome.component.ts"/>

`WelcomeComponent`는 서비스와 상호 작용하는 결정 논리를 가지고 있으며, 이는 이 컴포넌트를 테스트할 가치가 있게 만듭니다.

### 서비스 테스트 더블 제공

*테스트 중인 컴포넌트*는 실제 서비스를 제공할 필요가 없습니다.

실제 `UserService`를 주입하는 것은 어려울 수 있습니다.
실제 서비스는 사용자에게 로그인 자격 증명을 요청하고 인증 서버에 접근하려고 할 수 있습니다.
이러한 동작은 가로채기가 어려울 수 있습니다. 테스트 더블을 사용하면 테스트가 프로덕션과 다르게 작동하므로 신중하게 사용해야 합니다.

### 주입된 서비스 가져오기

테스트는 `WelcomeComponent`에 주입된 `UserService`에 접근할 수 있어야 합니다.

Angular는 계층적 주입 시스템을 가지고 있습니다.
`TestBed`가 생성한 루트 주입기부터 컴포넌트 트리까지 여러 레벨에서 주입기가 있을 수 있습니다.

주입된 서비스를 가져오는 가장 안전한 방법은 *테스트 중인 컴포넌트의 주입기*에서 가져오는 것입니다.
컴포넌트 주입기는 고정된 `DebugElement`의 속성 중 하나입니다.

<docs-code header="WelcomeComponent's injector" path="adev/src/content/examples/testing/src/app/welcome/welcome.component.spec.ts" visibleRegion="injected-service"/>

도움말: 일반적으로는 필요하지 않습니다. 서비스는 루트 또는 TestBed 오버라이드에서 제공되며, `TestBed.inject()`를 사용하여 더 쉽게 검색할 수 있습니다 (아래 참조).

### `TestBed.inject()`

이는 고정된 `DebugElement`를 사용하여 서비스를 검색하는 것보다 기억하기 쉽고 덜 장황합니다.

이 테스트 스위트에서 `UserService`의 *유일한* 제공자는 루트 테스트 모듈이므로 다음과 같이 안전하게 `TestBed.inject()`를 호출할 수 있습니다:

<docs-code header="TestBed injector" path="adev/src/content/examples/testing/src/app/welcome/welcome.component.spec.ts" visibleRegion="inject-from-testbed" />

도움말: `TestBed.inject()`가 작동하지 않는 사용 사례는 [*Override component providers*](#override-component-providers) 섹션을 참조하십시오. 이 섹션에서는 언제 그리고 왜 컴포넌트의 주입기에서 서비스를 가져와야 하는지 설명합니다.

### 최종 설정 및 테스트

다음은 `TestBed.inject()`를 사용하는 전체 `beforeEach()`입니다:

<docs-code header="app/welcome/welcome.component.spec.ts" path="adev/src/content/examples/testing/src/app/welcome/welcome.component.spec.ts" visibleRegion="setup"/>

여기 몇 가지 테스트가 있습니다:

<docs-code header="app/welcome/welcome.component.spec.ts" path="adev/src/content/examples/testing/src/app/welcome/welcome.component.spec.ts" visibleRegion="tests"/>

첫 번째는 정상성 테스트이며, `UserService`가 호출되고 작동하고 있음을 확인합니다.

도움말: withContext 함수 (예: `'expected name'`)는 선택적 실패 레이블입니다.
기대가 실패하면 Jasmine은 이 레이블을 기대 실패 메시지에 추가합니다.
여러 기대가 있는 사양에서 무엇이 잘못되었는지, 어떤 기대가 실패했는지를 명확히 하는 데 도움이 될 수 있습니다.

나머지 테스트는 서비스가 서로 다른 값을 반환할 때 컴포넌트의 논리를 확인합니다.
두 번째 테스트는 사용자 이름이 변경되는 효과를 검증합니다.
세 번째 테스트는 로그인한 사용자가 없을 때 컴포넌트가 적절한 메시지를 표시하는지 확인합니다.

## 비동기 서비스가 있는 컴포넌트

이 샘플에서 `AboutComponent` 템플릿은 `TwainComponent`를 호스팅합니다.
`TwainComponent`는 마크 트웨인의 인용구를 표시합니다.

<docs-code header="app/twain/twain.component.ts (template)" path="adev/src/content/examples/testing/src/app/twain/twain.component.ts" visibleRegion="template" />

도움말: 컴포넌트의 `quote` 속성 값은 `AsyncPipe`를 통해 전달됩니다.
즉, 속성이 `Promise` 또는 `Observable` 중 하나를 반환함을 의미합니다.

이 예제에서 `TwainComponent.getQuote()` 메서드는 `quote` 속성이 `Observable`을 반환한다고 알려줍니다.

<docs-code header="app/twain/twain.component.ts (getQuote)" path="adev/src/content/examples/testing/src/app/twain/twain.component.ts" visibleRegion="get-quote"/>

`TwainComponent`는 주입된 `TwainService`에서 인용구를 가져옵니다.
이 컴포넌트는 서비스가 첫 번째 인용구를 반환할 수 있기 전에 자리 표시자 값 (`'...'`)으로 반환된 `Observable`을 시작합니다.

`catchError`는 서비스 오류를 가로채고 오류 메시지를 준비하며 성공 채널에서 자리 표시자 값을 반환합니다.

이 모든 기능을 테스트하고자 할 것입니다.

### 스파이를 사용한 테스트

컴포넌트를 테스트할 때는 서비스의 공용 API만 고려하면 됩니다.
일반적으로 테스트는 원격 서버에 대한 호출을 해서는 안 됩니다.
그렇게 하는 대신 이를 에뮬레이트해야 합니다.
다음 `app/twain/twain.component.spec.ts`의 설정이 그 방법 중 하나를 보여줍니다:

<docs-code header="app/twain/twain.component.spec.ts (setup)" path="adev/src/content/examples/testing/src/app/twain/twain.component.spec.ts" visibleRegion="setup"/>

스파이에 집중하세요.

<docs-code path="adev/src/content/examples/testing/src/app/twain/twain.component.spec.ts" visibleRegion="spy"/>

이 스파이는 `getQuote`를 호출하는 모든 함수가 테스트 인용구가 포함된 옵저버블을 받도록 설계되었습니다.
실제 `getQuote()` 메서드와 달리, 이 스파이는 서버를 우회하고 즉시 사용 가능한 값을 가진 동기 옵저버블을 반환합니다.

이 스파이를 사용하여 유용한 많은 테스트를 작성할 수 있습니다. 비록 `Observable`이 동기적일지라도 말입니다.

도움말: 스파이는 테스트에 필요한 만큼만 사용하는 것이 가장 좋습니다. 필요 이상의 목업이나 스파이를 생성하면 취약해질 수 있습니다. 컴포넌트와 주입 가능한 내용이 발전하면서 관련 없는 테스트가 실패할 수 있습니다. 

### `fakeAsync()`를 사용한 비동기 테스트

`fakeAsync()` 기능을 사용하려면 테스트 설정 파일에 `zone.js/testing`을 가져와야 합니다.
Angular CLI로 프로젝트를 생성한 경우, `zone-testing`은 이미 `src/test.ts`에 가져와 있습니다.

다음 테스트는 서비스가 `ErrorObservable`을 반환할 때 예상되는 동작을 확인합니다.

<docs-code path="adev/src/content/examples/testing/src/app/twain/twain.component.spec.ts" visibleRegion="error-test"/>

도움말: `it()` 함수는 다음 형식의 인수를 받습니다.

<docs-code language="javascript">

fakeAsync(() => { /*test body*/ })

</docs-code>

`fakeAsync()` 함수는 특별한 `fakeAsync test zone`에서 테스트 본문을 실행하여 선형 코딩 스타일을 가능하게 합니다.
테스트 본문은 마치 동기적인 것처럼 보입니다.
제어 흐름을 방해하는 중첩 구문(예: `Promise.then()`)이 없습니다.

도움말: 제한 사항: `fakeAsync()` 함수는 테스트 본문이 `XMLHttpRequest` (XHR) 호출을 수행하는 경우 작동하지 않습니다.
테스트 내에서 XHR 호출은 드물지만, XHR을 호출해야 하는 경우는 [`waitForAsync()`](#waitForAsync) 섹션을 참조하십시오.

중요: `fakeAsync` 영역 내에서 발생하는 비동기 작업은 `flush` 또는 `tick`으로 수동으로 실행해야 합니다. 여러분이 `flush`하지 않고,
`fixture.whenStable`을 사용하여 완료되기를 기다리려 하면 테스트가 실패할 가능성이 높습니다. 더 많은 정보는 아래를 참조하십시오.

### `tick()` 함수

가상의 시계를 진행시키려면 [tick()](api/core/testing/tick)을 호출해야 합니다.

[tick()](api/core/testing/tick)을 호출하는 것은 대기 중인 모든 비동기 활동이 완료될 때까지 시간의 흐름을 시뮬레이션합니다.
이 경우 옵저버블의 `setTimeout()`을 대기합니다.

[tick()](api/core/testing/tick) 함수는 `millis`와 `tickOptions`를 매개변수로 받습니다. `millis` 매개변수는 가상의 시계가 얼마나 진행되는지를 지정하며, 제공되지 않으면 기본값은 `0`입니다.
예를 들어, `fakeAsync()` 테스트에 `setTimeout(fn, 100)`이 있는 경우, `tick(100)`을 사용하여 fn 콜백을 트리거해야 합니다.
선택적 `tickOptions` 매개변수에는 `processNewMacroTasksSynchronously`라는 속성이 있습니다. `processNewMacroTasksSynchronously` 속성은 주기를 진행할 때 새로 생성된 매크로 작업을 호출할지 여부를 나타내며, 기본값은 `true`입니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/async-helper.spec.ts" visibleRegion="fake-async-test-tick"/>

[tick()](api/core/testing/tick) 함수는 `TestBed`와 함께 가져오는 Angular 테스트 유틸리티 중 하나입니다.
이는 `fakeAsync()`의 동반자이며 `fakeAsync()` 본문 내에서만 호출할 수 있습니다.

### tickOptions

이 예에서는 새 매크로 작업인 중첩된 `setTimeout` 함수가 있습니다. 기본적으로 `tick`이 `setTimeout`일 때 `outside`와 `nested`가 모두 트리거됩니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/async-helper.spec.ts" visibleRegion="fake-async-test-tick-new-macro-task-sync"/>

일부 경우에는 주기를 진행할 때 새 매크로 작업을 트리거하고 싶지 않을 수 있습니다. `tick(millis, {processNewMacroTasksSynchronously: false})`를 사용하여 새 매크로 작업을 호출하지 않도록 할 수 있습니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/async-helper.spec.ts" visibleRegion="fake-async-test-tick-new-macro-task-async"/>

### `fakeAsync()` 내에서 날짜 비교

`fakeAsync()`는 시간의 흐름을 시뮬레이션하므로 `fakeAsync()` 내에서 날짜 간의 차이를 계산할 수 있습니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/async-helper.spec.ts" visibleRegion="fake-async-test-date"/>

### `fakeAsync()`와 함께 사용하는 jasmine.clock

Jasmine은 날짜를 모의하기 위한 `clock` 기능도 제공합니다.
Angular는 `fakeAsync()` 메서드 내에서 `jasmine.clock().install()`이 호출된 후 실행된 테스트를 자동으로 실행합니다. `jasmine.clock().uninstall()`이 호출될 때까지입니다.
`fakeAsync()`는 필요하지 않으며 중첩된 경우 오류가 발생합니다.

기본적으로 이 기능은 비활성화되어 있습니다.
이 기능을 활성화하려면 `zone-testing`을 가져오기 전에 전역 플래그를 설정해야 합니다.

Angular CLI를 사용하는 경우, 이 플래그를 `src/test.ts`에 설정합니다.

<docs-code language="typescript">

[window as any]('&lowbar;&lowbar;zone&lowbar;symbol__fakeAsyncPatchLock') = true;
import 'zone.js/testing';

</docs-code>

<docs-code path="adev/src/content/examples/testing/src/app/demo/async-helper.spec.ts" visibleRegion="fake-async-test-clock"/>

### `fakeAsync()` 내에서 RxJS 스케줄러 사용

`setTimeout()`이나 `setInterval()`을 사용하는 것처럼 `fakeAsync()` 내에서도 RxJS 스케줄러를 사용할 수 있지만, RxJS 스케줄러를 패치하려면 `zone.js/plugins/zone-patch-rxjs-fake-async`를 가져와야 합니다.

<docs-code path="adev/src/content/examples/testing/src/app/demo/async-helper.spec.ts" visibleRegion="fake-async-test-rxjs"/>

### 더 많은 매크로 태스크 지원

기본적으로 `fakeAsync()`는 다음 매크로 태스크를 지원합니다.

* `setTimeout`
* `setInterval`
* `requestAnimationFrame`
* `webkitRequestAnimationFrame`
* `mozRequestAnimationFrame`

`HTMLCanvasElement.toBlob()`과 같은 다른 매크로 태스크를 실행하면 *"Unknown macroTask scheduled in fake async test"* 오류가 발생합니다.

<docs-code-multifile>
    <docs-code header="src/app/shared/canvas.component.spec.ts (failing)" path="adev/src/content/examples/testing/src/app/shared/canvas.component.spec.ts" visibleRegion="without-toBlob-macrotask"/>
    <docs-code header="src/app/shared/canvas.component.ts" path="adev/src/content/examples/testing/src/app/shared/canvas.component.ts" visibleRegion="main"/>
</docs-code-multifile>

이러한 경우를 지원하려면 `beforeEach()`에서 지원하고자 하는 매크로 작업을 정의해야 합니다.
예를 들어:

<docs-code header="src/app/shared/canvas.component.spec.ts (excerpt)" path="adev/src/content/examples/testing/src/app/shared/canvas.component.spec.ts" visibleRegion="enable-toBlob-macrotask"/>

도움말: 애플리케이션의 `<canvas>` 요소를 Zone.js 인식 가능하게 하려면 `zone-patch-canvas` 패치를 가져와야 합니다 ( `polyfills.ts` 또는 `<canvas>`를 사용하는 특정 파일에서).

<docs-code header="src/polyfills.ts or src/app/shared/canvas.component.ts" path="adev/src/content/examples/testing/src/app/shared/canvas.component.ts" visibleRegion="import-canvas-patch"/>

### 비동기 옵저버블

이 테스트에 대한 커버리지에 만족할 수 있습니다.

하지만 실제 서비스가 정확히 그렇게 작동하지 않는다는 사실에 문제가 있을 수 있습니다.
실제 서비스는 원격 서버에 요청을 보냅니다.
서버는 응답하는 데 시간이 걸리며, 응답이 이전 두 테스트처럼 즉시 제공되지 않을 것입니다.

`getQuote()` 스파이에서 *비동기* 옵저버블을 반환하면 여러분의 테스트는 실제 세계를 더 충실하게 반영합니다.

<docs-code path="adev/src/content/examples/testing/src/app/twain/twain.component.spec.ts" visibleRegion="async-setup"/>

### 비동기 옵저저블 헬퍼

비동기 옵저블은 `asyncData` 헬퍼에 의해 생성되었습니다.
`asyncData` 헬퍼는 여러분이 직접 작성해야 할 유틸리티 함수이거나 샘플 코드에서 이 함수의 내용을 복사하여 사용할 수 있습니다.

<docs-code header="testing/async-observable-helpers.ts" path="adev/src/content/examples/testing/src/testing/async-observable-helpers.ts" visibleRegion="async-data"/>

이 헬퍼의 옵저버블은 JavaScript 엔진의 다음 턴에서 `data` 값을 방출합니다.

[RxJS `defer()` 연산자](http://reactivex.io/documentation/operators/defer.html)는 옵저버블을 반환합니다.
이 함수는 프로미스나 옵저버블을 반환하는 팩토리 함수를 받습니다.
무언가가 *defer*의 옵저버블에 가입할 때, 그 가입자는 해당 팩토리로 생성된 새 옵저버블에 추가됩니다.

`defer()` 연산자는 `Promise.resolve()`를 새로운 옵저버블로 변환하며, `HttpClient`처럼 단 한 번 방출하고 완료됩니다.
가입자는 데이터 값을 받은 후 구독이 해제됩니다.

비동기 오류를 생성하는 유사한 헬퍼가 있습니다.

<docs-code path="adev/src/content/examples/testing/src/testing/async-observable-helpers.ts" visibleRegion="async-error"/>

### 더 많은 비동기 테스트

이제 `getQuote()` 스파이가 비동기 옵저버블을 반환하므로 대부분의 테스트도 비동기여야 합니다.

다음은 실제 세계에서 기대하는 데이터 흐름을 보여주는 `fakeAsync()` 테스트입니다.

<docs-code path="adev/src/content/examples/testing/src/app/twain/twain.component.spec.ts" visibleRegion="fake-async-test"/>

인용구 요소가 `ngOnInit()` 이후 자리 표시자 값(`'...'`)을 표시하는 데 유의하세요.
첫 번째 인용구는 아직 도착하지 않았습니다.

옵저버블에서 첫 번째 인용구를 플러시하려면 [tick()](api/core/testing/tick)을 호출합니다.
그런 다음 `detectChanges()`를 호출하여 Angular에게 화면을 업데이트하라고 알립니다.

그 후에 인용구 요소가 예상하는 텍스트를 표시하는지 확인할 수 있습니다.

### `fakeAsync()`이 없는 비동기 테스트

다음은 `async`로 다시 작성한 이전 `fakeAsync()` 테스트입니다.

<docs-code path="adev/src/content/examples/testing/src/app/twain/twain.component.spec.ts" visibleRegion="async-test"/>

### `whenStable`

테스트는 `getQuote()` 옵저버블이 다음 인용구를 방출할 때까지 기다려야 합니다.
[tick()](api/core/testing/tick)을 호출하는 대신 `fixture.whenStable()`을 호출합니다.

`fixture.whenStable()`은 JavaScript 엔진의 작업 큐가 비어질 때 해결되는 프로미스를 반환합니다.
이 예에서 작업 큐는 옵저버블이 첫 번째 인용구를 방출할 때 비게 됩니다.


## 입력과 출력을 가진 컴포넌트

입력과 출력이 있는 컴포넌트는 일반적으로 호스트 컴포넌트의 보기 템플릿 내에 나타납니다.
호스트는 속성 바인딩을 사용하여 입력 속성을 설정하고, 출력 속성이 발생시키는 이벤트를 수신하기 위해 이벤트 바인딩을 사용합니다.

테스트 목표는 그런 바인딩이 기대대로 작동하는지 확인하는 것입니다.
테스트는 입력 값을 설정하고 출력 이벤트를 수신해야 합니다.

`DashboardHeroComponent`는 이러한 역할의 컴포넌트의 작은 예입니다.
이는 `DashboardComponent`가 제공하는 개별 영웅을 표시합니다.
해당 영웅을 클릭하면 사용자가 영웅을 선택했음을 `DashboardComponent`에 알립니다.

`DashboardHeroComponent`는 다음과 같이 `DashboardComponent` 템플릿에 내장됩니다:

<docs-code header="app/dashboard/dashboard.component.html (excerpt)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard.component.html" visibleRegion="dashboard-hero"/>

`DashboardHeroComponent`는 `*ngFor` 리피터 내에 나타나며, 각 컴포넌트의 `hero` 입력 속성을 반복 값으로 설정하고 해당 컴포넌트의 `selected` 이벤트를 수신합니다.

컴포넌트의 전체 정의는 다음과 같습니다:

<docs-code header="app/dashboard/dashboard-hero.component.ts (component)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.ts" visibleRegion="component"/>

이렇게 단순한 컴포넌트를 테스트하는 것은 본질적인 가치가 적지만, 방법을 아는 것은 유용합니다.
다음 중 하나의 방법을 사용하세요:

* `DashboardComponent`에 의해 사용되는 대로 테스트하기
* 독립형 컴포넌트로 테스트하기
* `DashboardComponent`의 대체로 사용되는 대로 테스트하기

즉각적인 목표는 `DashboardHeroComponent`를 테스트하는 것이지 `DashboardComponent`를 테스트하는 것은 아니므로, 두 번째 및 세 번째 옵션을 시도해 보세요.

### 독립형 `DashboardHeroComponent` 테스트

다음은 사양 파일 설정의 핵심 부분입니다.

<docs-code header="app/dashboard/dashboard-hero.component.spec.ts (setup)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="setup"/>

설정 코드가 테스트 영웅(`expectedHero`)을 컴포넌트의 `hero` 속성에 할당하여, `DashboardComponent`가 반복자에서 사용하는 속성 바인딩을 모방하는 방식에 주목하세요.

다음 테스트는 영웅 이름이 바인딩을 통해 템플릿에 전파되는지 검증합니다.

<docs-code path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="name-test"/>

[template](#dashboard-hero-component)이 영웅 이름을 Angular `UpperCasePipe`를 통해 전달하므로, 테스트는 요소 값을 대문자 이름과 일치시켜야 합니다.

### 클릭

영웅을 클릭하면 호스트 컴포넌트(`DashboardComponent`일 가능성이 높음)가 들을 수 있도록 `selected` 이벤트가 발생해야 합니다:

<docs-code path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="click-test"/>

컴포넌트의 `selected` 속성은 소비자에게 RxJS 동기 `Observable`처럼 보이는 `EventEmitter`를 반환합니다.
테스트는 호스트 컴포넌트가 *암묵적으로* 그렇듯이 이를 *명시적으로* 구독합니다.

컴포넌트가 기대대로 작동한다면, 영웅의 요소를 클릭하면 해당 컴포넌트의 `selected` 속성이 `hero` 객체를 방출해야 합니다.

테스트는 `selected`에 대한 구독을 통해 해당 이벤트를 감지합니다.

### `triggerEventHandler`

이전 테스트의 `heroDe`는 영웅 `<div>`를 나타내는 `DebugElement`입니다.

이는 네이티브 요소와의 상호작용을 추상화하는 Angular 속성과 메소드를 가지고 있습니다.
이 테스트는 "click" 이벤트 이름으로 `DebugElement.triggerEventHandler`를 호출합니다.
"click" 이벤트 바인딩은 `DashboardHeroComponent.click()`을 호출합니다.

Angular의 `DebugElement.triggerEventHandler`는 *이벤트 이름*으로 *모든 데이터 바인딩 이벤트*를 발생시킬 수 있습니다.
두 번째 매개변수는 핸들러에 전달되는 이벤트 객체입니다.

테스트가 "click" 이벤트를 트리거했습니다.

<docs-code path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="trigger-event-handler"/>

이 경우, 테스트는 런타임 이벤트 핸들러, 즉 컴포넌트의 `click()` 메서드가 이벤트 객체에 신경 쓰지 않는다고 올바르게 가정합니다.

도움말: 다른 핸들러는 덜 관대합니다.
예를 들어, `RouterLink` 지시자는 클릭하는 동안 어떤 마우스 버튼이 눌렸는지를識別하는 `button` 속성이 있는 객체를 기대합니다.
이벤트 객체가 누락된 경우 `RouterLink` 지시자가 오류를 발생시킵니다.

### 요소 클릭

다음 테스트 대안은 네이티브 요소의 `click()` 메서드를 호출합니다. 이는 *이 컴포넌트*에 대해서는 완벽하게 괜찮습니다.

<docs-code path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="click-test-2"/>

### `click()` 헬퍼

버튼, 앵커 또는 임의의 HTML 요소를 클릭하는 것은 일반적인 테스트 작업입니다.

클릭 트리거링 프로세스를 다음과 같은 헬퍼 함수인 `click()`로 캡슐화하여 일관되고 간단하게 만드세요:

<docs-code header="testing/index.ts (click helper)" path="adev/src/content/examples/testing/src/testing/index.ts" visibleRegion="click-event"/>

첫 번째 매개변수는 *클릭할 요소*입니다.
원한다면 두 번째 매개변수로 사용자 정의 이벤트 객체를 전달합니다.
기본값은 `RouterLink` 지시자를 포함한 많은 핸들러에서 수용하는 부분적인 [왼쪽 버튼 마우스 이벤트 객체](https://developer.mozilla.org/docs/Web/API/MouseEvent/button)입니다.

중요: `click()` 헬퍼 함수는 Angular 테스트 유틸리티 중 하나가 아닙니다.
이 함수는 *이 가이드의 샘플 코드*에서 정의된 것입니다.
모든 샘플 테스트에서 이를 사용합니다.
마음에 드셨다면 여러분의 헬퍼 모음에 추가하세요.

다음은 클릭 헬퍼를 사용하여 재작성한 이전 테스트입니다.

<docs-code header="app/dashboard/dashboard-hero.component.spec.ts (test with click helper)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="click-test-3"/>

## 테스트 호스트 내의 컴포넌트

이전 테스트는 호스트 `DashboardComponent` 역할을 수행했습니다.
하지만 `DashboardHeroComponent`가 호스트 컴포넌트에 올바르게 데이터가 바인딩되는 경우 작동할까요?

<docs-code header="app/dashboard/dashboard-hero.component.spec.ts (test host)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="test-host"/>

테스트 호스트는 컴포넌트의 `hero` 입력 속성을 테스트 영웅으로 설정합니다.
또한 컴포넌트의 `selected` 이벤트를 `onSelected` 핸들러와 바인딩하여 발산된 영웅을 `selectedHero` 속성에 기록합니다.

이후에, 테스트는 `selectedHero`를 확인하여 `DashboardHeroComponent.selected` 이벤트가 예상하는 영웅을 발산했는지 검증할 수 있습니다.

`test-host` 테스트의 설정은 독립형 테스트의 설정과 유사합니다:

<docs-code header="app/dashboard/dashboard-hero.component.spec.ts (test host setup)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="test-host-setup"/>

이 테스트 모듈 구성은 세 가지 중요한 차이점을 보여줍니다:

* `DashboardHeroComponent` 및 `TestHostComponent`를 *가져옵니다*
* `DashboardHeroComponent` 대신 `TestHostComponent`를 *생성합니다*
* `TestHostComponent`는 바인딩을 통해 `DashboardHeroComponent.hero`를 설정합니다.

`createComponent`는 `DashboardHeroComponent` 대신 `TestHostComponent`의 인스턴스를 보유하는 `fixture`를 반환합니다.

`TestHostComponent`를 생성하면 `DashboardHeroComponent`가 생성되는 부차적인 효과가 있습니다. 왜냐하면 후자가 전자의 템플릿 내에 나타나기 때문입니다.
영웅 요소(`heroEl`)에 대한 쿼리는 여전히 테스트 DOM에서 찾을 수 있지만, 이전보다 요소 트리에서 더 깊은 곳에 있습니다.

테스트 자체는 독립형 버전과 거의 동일합니다:

<docs-code header="app/dashboard/dashboard-hero.component.spec.ts (test-host)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="test-host-tests"/>

선택된 이벤트 테스트만 다릅니다.
이는 선택된 `DashboardHeroComponent` 영웅이 실제로 이벤트 바인딩을 통해 호스트 컴포넌트로 올라간다는 것을 확인합니다.

## 라우팅 컴포넌트

*라우팅 컴포넌트*는 `Router`에게 다른 컴포넌트로 내비게이션할 것을 지시하는 컴포넌트입니다.
`DashboardComponent`는 사용자가 대시보드의 *영웅 버튼* 중 하나를 클릭하여 `HeroDetailComponent`로 탐색할 수 있기 때문에 *라우팅 컴포넌트*입니다.

Angular는 `HttpClient`에 의존하는 코드를 더 효과적으로 테스트할 수 있도록 보일러플레이트를 줄이는 테스트 헬퍼를 제공합니다. `provideRouter` 함수도 테스트 모듈 내에서 직접 사용할 수 있습니다.

<docs-code header="app/dashboard/dashboard.component.spec.ts" path="adev/src/content/examples/testing/src/app/dashboard/dashboard.component.spec.ts" visibleRegion="router-harness"/>

다음 테스트는 표시되는 영웅을 클릭하고 예상 URL로 탐색하는 것을 확인합니다.

<docs-code header="app/dashboard/dashboard.component.spec.ts (navigate test)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard.component.spec.ts" visibleRegion="navigate-test"/>

## 라우팅된 컴포넌트

*라우팅된 컴포넌트*는 `Router` 내비게이션의 목적지입니다.
라우팅 매개변수가 *포함되는* 경로일 때 테스트하기가 더 까다로울 수 있습니다.
`HeroDetailComponent`는 그러한 경로의 목적지인 *라우팅된 컴포넌트*입니다.

사용자가 *대시보드* 영웅을 클릭하면 `DashboardComponent`가 `heroes/:id`로 내비게이션하라고 `Router`에게 지시합니다.
`:id`는 편집할 영웅의 `id`에 해당하는 경로 매개변수입니다.

`Router`는 해당 URL을 `HeroDetailComponent`에 대한 경로와 일치시킵니다.
라우팅 정보를 담고 있는 `ActivatedRoute` 개체를 생성하고 이를 새로운 `HeroDetailComponent` 인스턴스에 주입합니다.

여기 `HeroDetailComponent` 생성자가 있습니다:

<docs-code header="app/hero/hero-detail.component.ts (constructor)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.ts" visibleRegion="ctor"/>

`HeroDetail` 컴포넌트는 해당 영웅을 가져오기 위해 `HeroDetailService`를 사용해야 하므로 `id` 매개변수가 필요합니다.
이 컴포넌트는 `ActivatedRoute.paramMap` 속성에서 `id`를 가져와야 하며, 이는 `Observable`입니다.

`ActivatedRoute.paramMap`의 `id` 속성을 단순히 참조할 수는 없습니다.
이 컴포넌트는 `ActivatedRoute.paramMap` 옵저버블을 *구독*해야 하며, `id`가 그 생애 주기 동안 변경될 수 있도록 대비해야 합니다.

<docs-code header="app/hero/hero-detail.component.ts (ngOnInit)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.ts" visibleRegion="ng-on-init"/>

테스트는 `HeroDetailComponent`가 다양한 `id` 매개변수 값에 대응하는 방식을 탐구할 수 있습니다. 다른 경로로 내비게이션하여 확인하는 것입니다.

### `RouterTestingHarness`로 테스트하기

여기 관찰된 `id`가 기존 영웅을 참조할 때 컴포넌트의 동작을 demonstrating하는 테스트가 있습니다:

<docs-code header="app/hero/hero-detail.component.spec.ts (existing id)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="route-good-id"/>

도움말: 다음 섹션에서는 `createComponent()` 메서드와 `page` 객체에 대해 설명합니다.
지금은 여러분의 직감을 믿으십시오.

`id`를 찾을 수 없으면 컴포넌트는 `HeroListComponent`로 재라우팅해야 합니다.

테스트 스위트 설정은 [위에서 설명한](#routing-component) 동일한 라우터 헌트니스를 제공했습니다.

이 테스트는 컴포넌트가 `HeroListComponent`로 내비게이션하려고 시도할 것으로 기대합니다.

<docs-code header="app/hero/hero-detail.component.spec.ts (bad id)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="route-bad-id"/>

## 중첩된 컴포넌트 테스트

컴포넌트 템플릿은 종종 중첩된 컴포넌트를 가지며, 그 템플릿에는 더 많은 컴포넌트가 포함될 수 있습니다.

컴포넌트 트리는 매우 깊을 수 있으며 때때로 중첩된 컴포넌트는 트리 맨 위의 컴포넌트를 테스트하는 데 아무런 역할을 하지 않을 수 있습니다.

예를 들어, `AppComponent`는 앵커와 해당 `RouterLink` 지시자가 있는 탐색 모음을 표시합니다.

<docs-code header="app/app.component.html" path="adev/src/content/examples/testing/src/app/app.component.html"/>

링크를 검증하지만 내비게이션은 검증할 필요가 없으므로 `Router`가 내비게이션할 필요도 없고 `<router-outlet>`가 *라우팅된 컴포넌트*가 삽입될 위치를 표시할 필요도 없습니다.

`BannerComponent`와 `WelcomeComponent` (`<app-banner>`와 `<app-welcome>`로 각각 표시됨)도 무관합니다.

그럼에도 불구하고 DOM에 `AppComponent`를 생성하는 테스트는 이 세 컴포넌트의 인스턴스를 생성하며, 그렇게 되도록 한다면 `TestBed`를 구성하여 이들을 생성해야 합니다.

그들을 선언하지 않으면 Angular 컴파일러는 `AppComponent` 템플릿에서 `<app-banner>`, `<app-welcome>`, `<router-outlet>` 태그를 인식하지 못하고 오류를 발생시킵니다.

실제 컴포넌트를 선언하면 *그들의* 중첩된 컴포넌트도 선언해야 하며, 트리 내의 *모든* 컴포넌트에서 주입된 모든 서비스에 대한 제공이 필요합니다.

이 섹션에서는 설정 최소화를 위한 두 가지 기술을 설명합니다.
주요 컴포넌트를 테스트하는 데 집중하려면 이 기술들을 단독으로 또는 조합하여 사용하세요.

### 불필요한 컴포넌트 스텁

첫 번째 기술에서는 테스트에서 거의 또는 전혀 역할을 하지 않는 컴포넌트 및 지시자의 스텁 버전을 생성하고 선언합니다.

<docs-code header="app/app.component.spec.ts (stub declaration)" path="adev/src/content/examples/testing/src/app/app.component.spec.ts" visibleRegion="component-stubs"/>

스텁 선택자는 해당 실제 컴포넌트의 선택자와 일치합니다.
그러나 템플릿과 클래스는 비어 있습니다.

그런 다음 이들을 실제가 필요한 컴포넌트, 지시자 및 파이프와 함께 `TestBed` 구성에서 선언하세요.

<docs-code header="app/app.component.spec.ts (TestBed stubs)" path="adev/src/content/examples/testing/src/app/app.component.spec.ts" visibleRegion="testbed-stubs"/>

`AppComponent`는 테스트 주제이므로 물론 실제 버전을 선언합니다.

나머지는 스텁입니다.

### `NO_ERRORS_SCHEMA`

두 번째 접근법은 `NO_ERRORS_SCHEMA`를 `TestBed.schemas` 메타데이터에 추가하는 것입니다.

<docs-code header="app/app.component.spec.ts (NO_ERRORS_SCHEMA)" path="adev/src/content/examples/testing/src/app/app.component.spec.ts" visibleRegion="no-errors-schema"/>

`NO_ERRORS_SCHEMA`는 Angular 컴파일러에게 인식되지 않은 요소와 속성을 무시하라고 지시합니다.

컴파일러는 `<app-root>` 요소와 `routerLink` 속성을 인식합니다. 왜냐하면 `TestBed` 구성에서 해당 `AppComponent`와 `RouterLink`를 선언했기 때문입니다.

하지만 `<app-banner>`, `<app-welcome>` 또는 `<router-outlet>`을 만날 때 컴파일러는 오류를 발생시키지 않습니다.
단순히 빈 태그로 렌더링되고 브라우저는 이를 무시합니다.

이제 더 이상 스텁 컴포넌트가 필요하지 않습니다.

### 두 기술을 함께 사용하기

이들은 *얕은 컴포넌트 테스트*를 위한 기술입니다. 이 이름은 컴포넌트의 시각적 표면을 테스트에 중요한 컴포넌트 템플릿 요소로만 축소하기 때문입니다.

`NO_ERRORS_SCHEMA` 접근법이 두 개 중 더 쉽지만, 남용하지 않도록 하세요.

`NO_ERRORS_SCHEMA`는 또한 컴파일러가 여러분이 실수로 생략한 누락된 컴포넌트와 속성에 대해 알려주지 않게 합니다.
잘못된 철자를 작성한 것들도 포함됩니다.
여러분은 컴파일러가 즉각적으로 잡을 수 있는 유령 버그를 여러 시간 동안 추적하는 데 시간을 낭비할 수 있습니다.

*스텁 컴포넌트* 접근 방식은 또 다른 장점이 있습니다.
이 예에서 스텁은 비어 있었지만, 테스트가 이를 어떤 방식으로든 상호작용할 필요가 있다면 축소된 템플릿과 클래스에 이를 제공할 수도 있습니다.

실제에는 동일한 설정에서 두 기술을 결합할 것입니다. 이 예제를 봐 보세요.

<docs-code header="app/app.component.spec.ts (mixed setup)" path="adev/src/content/examples/testing/src/app/app.component.spec.ts" visibleRegion="mixed-setup"/>

Angular 컴파일러는 `<app-banner>` 요소에 대해 `BannerStubComponent`를 생성하고, `routerLink` 속성이 있는 앵커에 `RouterLink`를 적용하지만, `<app-welcome>` 및 `<router-outlet>` 태그는 무시합니다.

### `By.directive` 및 주입된 지시자

조금 더 많은 설정이 초기 데이터 바인딩을 트리거하고 탐색 링크에 대한 참조를 가져옵니다:

<docs-code header="app/app.component.spec.ts (test setup)" path="adev/src/content/examples/testing/src/app/app.component.spec.ts" visibleRegion="test-setup"/>

세 가지 특별한 관심 포인트:

* `By.directive`를 사용하여 연결된 지시자가 있는 앵커 요소 찾기
* 쿼리는 일치하는 요소 주위에 `DebugElement` 래퍼를 반환합니다
* 각 `DebugElement`는 해당 요소에 연결된 지시자의 특정 인스턴스가 있는 종속성 주입기를 노출합니다

검증할 `AppComponent` 링크는 다음과 같습니다:

<docs-code header="app/app.component.html (navigation links)" path="adev/src/content/examples/testing/src/app/app.component.html" visibleRegion="links"/>

여기 이러한 링크가 예상대로 `routerLink` 지시자에 연결되었음을 확인하는 몇 가지 테스트가 있습니다:

<docs-code header="app/app.component.spec.ts (selected tests)" path="adev/src/content/examples/testing/src/app/app.component.spec.ts" visibleRegion="tests"/>

## `page` 객체 사용

`HeroDetailComponent`는 제목, 두 개의 영웅 필드 및 두 개의 버튼을 가진 간단한 보기입니다.

하지만 이 간단한 폼에도 상당한 템플릿 복잡성이 있습니다.

<docs-code
  path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.html" header="app/hero/hero-detail.component.html"/>

컴포넌트를 실행하는 테스트는 필요합니다...

* 영웅이 도착할 때까지 기다린 후 DOM에 요소가 나타납니다.
* 제목 텍스트에 대한 참조
* 검사하고 설정할 이름 입력 상자에 대한 참조
* 클릭할 수 있도록 두 개의 버튼에 대한 참조

이러한 작은 폼조차도 얽히고 섥힌 조건부 설정 및 CSS 요소 선택의 혼란을 만들 수 있습니다.

`Page` 클래스를 사용하여 컴포넌트 속성에 접근하고 이를 설정하는 로직을 캡슐화하여 복잡성을 제어하세요.

여기 `hero-detail.component.spec.ts`의 `Page` 클래스가 있습니다.

<docs-code header="app/hero/hero-detail.component.spec.ts (Page)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="page"/>

이제 컴포넌트 조작 및 검사에 대한 주요 후크가 깔끔하게 정리되어 `Page`의 인스턴스에서 접근할 수 있습니다.

`createComponent` 메서드는 `page` 객체를 생성하고 영웅이 도착하면 빈틈을 채웁니다.

<docs-code header="app/hero/hero-detail.component.spec.ts (createComponent)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="create-component"/>

여기 몇 가지 추가 `HeroDetailComponent` 테스트가 있으며 이를 강화합니다.

<docs-code header="app/hero/hero-detail.component.spec.ts (selected tests)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="selected-tests"/>

## `compileComponents()` 호출

도움말: CLI `ng test` 명령으로만 테스트를 실행하는 경우 이 섹션을 무시하세요. CLI가 테스트 실행 전에 애플리케이션을 컴파일하기 때문입니다.

**비 CLI 환경**에서 테스트를 실행하면 아래와 같은 메시지가 나타날 수 있습니다.

<docs-code hideCopy language="shell">

Error: This test module uses the component BannerComponent
which is using a "templateUrl" or "styleUrls", but they were never compiled.
Please call "TestBed.compileComponents" before your test.

</docs-code>

문제의 근본 원인은 테스트에 포함된 최소한 하나의 컴포넌트가 아래 버전의 `BannerComponent`와 같이 외부 템플릿이나 CSS 파일을 지정하고 있다는 것입니다.

<docs-code header="app/banner/banner-external.component.ts (external template & css)" path="adev/src/content/examples/testing/src/app/banner/banner-external.component.ts"/>

테스트는 `TestBed`가 컴포넌트를 생성하려고 할 때 실패합니다.

<docs-code avoid header="app/banner/banner-external.component.spec.ts (setup that fails)" path="adev/src/content/examples/testing/src/app/banner/banner-external.component.spec.ts" visibleRegion="setup-may-fail"/>

애플리케이션이 아직 컴파일되지 않았음을 기억하십시오.
따라서 `createComponent()`를 호출할 때, `TestBed`는 암묵적으로 컴파일을 수행합니다.

소스 코드가 메모리에 있을 때에는 문제가 되지 않지만, `BannerComponent`는 컴파일러가 파일 시스템에서 읽어야 하는 외부 파일이 필요하며, 이는 본질적으로 *비동기* 작업입니다.

`TestBed`가 진행되도록 하면 테스트가 실행되며 컴파일러가 완료되기 전에 신비롭게 실패합니다.

사전 오류 메시지는 `compileComponents()`로 명시적으로 컴파일해야 한다고 알려줍니다.

### `compileComponents()`는 비동기입니다

`compileComponents()`는 비동기 테스트 함수 내에서 호출해야 합니다.

중요: 테스트 함수가 비동기 함수를 만들지 않으면 (예를 들어, `waitForAsync()`를 사용하는 것을 잊는 것과 같은) 다음 오류 메시지가 표시됩니다.

<docs-code hideCopy language="shell">

Error: ViewDestroyedError: Attempt to use a destroyed view

</docs-code>

전형적인 접근 방식은 설정 로직을 두 개의 별도 `beforeEach()` 함수로 나누는 것입니다:

| 함수                      | 세부정보                   |
| :------------------------- | :------------------------- |
| 비동기 `beforeEach()`     | 컴포넌트를 컴파일합니다     |
| 동기 `beforeEach()`       | 나머지 설정을 수행합니다    |

### 비동기 `beforeEach`

첫 번째 비동기 `beforeEach`를 다음과 같이 작성합니다.

<docs-code header="app/banner/banner-external.component.spec.ts (async beforeEach)" path="adev/src/content/examples/testing/src/app/banner/banner-external.component.spec.ts" visibleRegion="async-before-each"/>

`TestBed.configureTestingModule()` 메서드는 `TestBed` 클래스를 반환하므로, `compileComponents()`와 같은 다른 `TestBed` 정적 메서드에 대한 호출을 연결할 수 있습니다.

이 예에서 `BannerComponent`는 유일하게 컴파일될 컴포넌트입니다.
다른 예제에서는 여러 컴포넌트로 테스트 모듈을 구성하거나, 더 많은 컴포넌트를 보유하는 애플리케이션 모듈을 가져올 수 있습니다.
그 중 어떤 것도 외부 파일이 필요할 수 있습니다.

`TestBed.compileComponents` 메서드는 테스트 모듈에서 구성된 모든 컴포넌트를 비동기적으로 컴파일합니다.

중요: `compileComponents()`를 호출한 후에는 `TestBed`를 다시 구성하지 마십시오.

`compileComponents()`는 현재 `TestBed` 인스턴스를 더 이상 구성할 수 없도록 닫습니다.
`configureTestingModule()`이나 `override...` 메서드를 호출할 수 없습니다.
이렇게 시도하면 `TestBed`에서 오류를 발생시킵니다.

`TestBed.createComponent()`를 호출하기 전 마지막 단계로 `compileComponents()`를 호출하세요.

### 동기 `beforeEach`

두 번째 동기 `beforeEach()`는 컴포넌트를 생성하고 검토할 요소를 쿼리하는 등 나머지 설정 단계를 포함합니다.

<docs-code header="app/banner/banner-external.component.spec.ts (synchronous beforeEach)" path="adev/src/content/examples/testing/src/app/banner/banner-external.component.spec.ts" visibleRegion="sync-before-each"/>

테스트 러너는 첫 번째 비동기 `beforeEach`가 완료될 때까지 기다렸다가 두 번째를 호출할 것을 기대합니다.

### 통합된 설정

두 개의 `beforeEach()` 함수를 단일 비동기 `beforeEach()`로 통합할 수 있습니다.

`compileComponents()` 메서드는 프로미스를 반환하므로, 비동기 코드가 해결된 후 컴파일이 완료된 후 동기 설정 작업을 수행할 수 있습니다. `await` 키워드 뒤로 동기 코드를 이동하세요.

<docs-code header="app/banner/banner-external.component.spec.ts (one beforeEach)" path="adev/src/content/examples/testing/src/app/banner/banner-external.component.spec.ts" visibleRegion="one-before-each"/>

### `compileComponents()`는 무해합니다

`compileComponents()`를 호출하는 것은 필요하지 않을 때 해가 되지 않습니다.

CLI에 의해 생성된 컴포넌트 테스트 파일은 `ng test`를 실행할 때 필요하지 않더라도 `compileComponents()`를 호출합니다.

이 가이드의 테스트는 필요할 때만 `compileComponents`를 호출합니다.

## 모듈 가져오기로 설정

이전에 컴포넌트 테스트는 다음과 같이 몇 가지 `declarations`로 테스트 모듈을 구성했습니다:

<docs-code header="app/dashboard/dashboard-hero.component.spec.ts (configure TestBed)" path="adev/src/content/examples/testing/src/app/dashboard/dashboard-hero.component.spec.ts" visibleRegion="config-testbed"/>

`DashboardComponent`는 간단합니다.
도움이 필요하지 않습니다.
하지만 더 복잡한 컴포넌트는 종종 다른 컴포넌트, 지시자, 파이프 및 제공자에 의존하며, 이를 테스트 모듈에 추가해야 합니다.

다행히도 `TestBed.configureTestingModule` 매개변수는 `@NgModule` 데코레이터에 전달되는 메타데이터와 평행을 이루므로 `providers`와 `imports`도 지정할 수 있습니다.

`HeroDetailComponent`는 작지만 간단한 구성으로 인해 많은 도움이 필요합니다.
기본 테스트 모듈 `CommonModule`로부터 제공되는 지원 외에도, 다음이 필요합니다:

* 두 방향 데이터 바인딩을 활성화하기 위한 `FormsModule`의 `NgModel` 및 친구들
* `shared` 폴더의 `TitleCasePipe`
* 라우터 서비스
* 영웅 데이터 접근 서비스

하나는 다음 예제와 같이 개별 조각에서 테스트 모듈 구성을 다루는 것입니다:

<docs-code header="app/hero/hero-detail.component.spec.ts (FormsModule setup)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="setup-forms-module"/>

도움말: `HeroDetailComponent`에 외부 템플릿과 CSS 파일이 있기 때문에 `beforeEach()`은 비동기이며 `TestBed.compileComponents`를 호출합니다.

[Calling `compileComponents()`](#calling-compilecomponents)에서 설명된 대로 이러한 테스트는 Angular가 브라우저에서 컴파일해야 하는 비 CLI 환경에서 실행될 수 있습니다.

### 공유 모듈 가져오기

많은 애플리케이션 컴포넌트가 `FormsModule` 및 `TitleCasePipe`를 필요로 하므로 개발자는 이를 결합한 `SharedModule`을 만들었습니다.

테스트 구성은 다음과 같이 `SharedModule`을 사용할 수 있습니다:

<docs-code header="app/hero/hero-detail.component.spec.ts (SharedModule setup)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="setup-shared-module"/>

조금 더 간결하고 작으며, 적은 수의 가져오기 문이 포함되어 있습니다. 이 예제에서는 표시되지 않습니다.

### 기능 모듈 가져오기

`HeroDetailComponent`는 `SharedModule` 등 서로 의존하는 조각들을 집합적으로 포함하는 `HeroModule`의 일부입니다.
다음과 같이 `HeroModule`을 가져오는 테스트 구성을 시도해 보세요:

<docs-code header="app/hero/hero-detail.component.spec.ts (HeroModule setup)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="setup-hero-module"/>

* 테스트 더블 *는 `providers`에 잔류합니다.
`HeroDetailComponent` 선언도 사라졌습니다.

사실, 이를 선언하려고 하면 Angular가 `HeroDetailComponent`가 `HeroModule`과 `DynamicTestModule`의 두 곳에 선언되기 때문에 오류를 발생시킵니다.

도움말: 컴포넌트의 기능 모듈을 가져오는 것은 모듈 내에 서로 많은 의존성이 있을 경우, 테스트를 구성하는 가장 좋은 방법일 수 있으며, 기능 모듈은 작기 때문입니다.

## 컴포넌트 제공자 변경

`HeroDetailComponent`는 자신의 `HeroDetailService`를 제공합니다.

<docs-code header="app/hero/hero-detail.component.ts (prototype)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.ts" visibleRegion="prototype"/>

`TestBed.configureTestingModule`의 `providers`에서 컴포넌트의 `HeroDetailService`를 스텁할 수는 없습니다.
이는 *테스트 모듈*을 위한 제공자이지 컴포넌트가 아닙니다.
테스트를 위해서는 주입기를 *Fixture 수준*에서 준비합니다.

Angular는 *자신의* 주입기와 함께 컴포넌트를 생성하며, 이는 `fixture` 주입기의 *자식*입니다.
컴포넌트 제공자(`HeroDetailService`인 경우)가 자식 주입기에 등록됩니다.

테스트는 `fixture` 주입기에서 자식 주입기 서비스로 접근할 수 없습니다.
`TestBed.configureTestingModule`이 이것들을 구성할 수 없습니다.

Angular는 항상 실제 `HeroDetailService`의 새 인스턴스를 생성해왔습니다!

도움말: 이러한 테스트는 `HeroDetailService`가 원격 서버에 대한 자체 XHR 호출을 하는 경우 실패하거나 타임아웃될 수 있습니다.
호출할 원격 서버가 없을 수 있습니다.

다행히도 `HeroDetailService`는 주입된 `HeroService`에 원격 데이터 접근의 책임을 위임합니다.

<docs-code header="app/hero/hero-detail.service.ts (prototype)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.service.ts" visibleRegion="prototype"/>

[이전 테스트 구성](#import-a-feature-module)은 실제 `HeroService`를 서버 요청을 가로채고 응답을 가장하는 `TestHeroService`로 대체합니다.

운이 좋지 않다면 어떨까요.
`HeroService`를 가장하는 것이 어렵다면?
`HeroDetailService`가 자신의 서버 요청을 한다면?

`TestBed.overrideComponent` 메서드는 다음 설정 변형과 같이 컴포넌트의 `providers`를 쉽게 관리할 수 있는 *테스트 더블*로 대체할 수 있습니다:

<docs-code header="app/hero/hero-detail.component.spec.ts (Override setup)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="setup-override"/>

`TestBed.configureTestingModule`가 더 이상 가짜 `HeroService`를 제공하지 않는 점에 유의하세요. 필요하지 않기 때문입니다.

### `overrideComponent` 메서드

`overrideComponent` 메서드에 집중하세요.

<docs-code header="app/hero/hero-detail.component.spec.ts (overrideComponent)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="override-component-method"/>

이것은 두 개의 인수를 받습니다: 대체할 컴포넌트 유형 (`HeroDetailComponent`)과 대체 메타데이터 객체.
[오버라이드 메타데이터 객체](guide/testing/utility-apis#metadata-override-object)는 다음과 같이 정의된 제네릭입니다.

<docs-code language="javascript">

type MetadataOverride<T> = {
  add?: Partial<T>;
  remove?: Partial<T>;
  set?: Partial<T>;
};

</docs-code>

메타데이터 오버라이드 객체는 메타데이터 속성에서 요소를 추가 및 제거하거나 그 속성을 완전히 재설정할 수 있습니다.
이 예제는 컴포넌트의 `providers` 메타데이터를 재설정합니다.

제네릭 매개변수 `T`는 `@Component` 데코레이터에 전달할 메타데이터의 종류입니다:

<docs-code language="javascript">

selector?: string;
template?: string;
templateUrl?: string;
providers?: any[];
…

</docs-code>

### *스파이 스텁* 제공 (`HeroDetailServiceSpy`)

이 예제는 컴포넌트의 `providers` 배열을 `HeroDetailServiceSpy`인 새 배열로 완전히 대체합니다.

`HeroDetailServiceSpy`는 해당 서비스의 모든 필요한 기능을 가장하는 스텁된 버전입니다.
이는 하위 수준의 `HeroService`에 의존하지 않으며 이를 주입하거나 위임하지 않으니 해당 테스트 더블을 제공할 필요가 없습니다.

관련 `HeroDetailComponent` 테스트는 `HeroDetailService`의 메서드가 호출되었음을 스파이를 사용하여 확인합니다.
따라서 스텁은 다음과 같이 스파이로 메서드를 구현합니다:

<docs-code header="app/hero/hero-detail.component.spec.ts (HeroDetailServiceSpy)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="hds-spy"/>

### 오버라이드 테스트

이제 테스트는 스파이 스텁의 `testHero`를 조작하여 컴포넌트의 영웅을 직접 제어하고 서비스 메서드가 호출되었음을 확인할 수 있습니다.

<docs-code header="app/hero/hero-detail.component.spec.ts (override tests)" path="adev/src/content/examples/testing/src/app/hero/hero-detail.component.spec.ts" visibleRegion="override-tests"/>

### 더 많은 오버라이드

`TestBed.overrideComponent` 메서드는 동일한 또는 다른 컴포넌트에 대해 여러 번 호출될 수 있습니다.
`TestBed`는 이러한 다른 클래스의 일부를 다루고 교체하기 위해 비슷한 `overrideDirective`, `overrideModule`, `overridePipe` 메서드를 제공합니다.

자신의 옵션과 조합을 탐색해 보세요.