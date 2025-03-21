# 테스트 유틸리티 API

이 페이지는 가장 유용한 Angular 테스트 기능을 설명합니다.

Angular 테스트 유틸리티는 `TestBed`, `ComponentFixture` 및 테스트 환경을 제어하는 여러 기능을 포함합니다.
[`TestBed`](#testbed-api-summary) 및 [`ComponentFixture`](#component-fixture-api-summary) 클래스는 별도로 다룹니다.

가능한 유용성의 순서로 독립적인 함수에 대한 요약은 다음과 같습니다:

| 함수                          | 세부사항 |
|:---                           |:---      |
| `waitForAsync`                | 테스트(`it`) 또는 설정(`beforeEach`) 함수의 본체를 특별한 *비동기 테스트 영역* 내에서 실행합니다. [waitForAsync](guide/testing/components-scenarios#waitForAsync)를 참조하세요.                                                                                                                                                                                                                                                                                                                                                                                               |
| `fakeAsync`                   | 테스트(`it`)의 본체를 특별한 *fakeAsync 테스트 영역* 내에서 실행하여 선형 제어 흐름 코딩 스타일을 가능하게 합니다. [fakeAsync](guide/testing/components-scenarios#fake-async)를 참조하세요.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `tick`                        | 시간을 흐르게 하고 *fakeAsync 테스트 영역* 내에서 *타이머* 및 *마이크로 작업* 큐를 플러시하여 보류 중인 비동기 작업의 완료를 시뮬레이션합니다. 호기심 많은 독자라면 ["*작업, 마이크로 작업, 큐 및 일정*"](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules)를 즐겨보실 수 있습니다. 선택적인 인수를 받아 지정된 밀리초 수만큼 가상 시계를 앞으로 이동시키고 해당 시간 프레임 내에 예약된 비동기 작업을 지웁니다. [tick](guide/testing/components-scenarios#tick)을 참조하세요. |
| `inject`                      | 현재 `TestBed` 주입기에서 하나 이상의 서비스를 테스트 함수에 주입합니다. 컴포넌트 자체에서 제공하는 서비스는 주입할 수 없습니다. [debugElement.injector](guide/testing/components-scenarios#get-injected-services)에 대한 논의 참조.                                                                                                                                                                                                                                                                                                       |
| `discardPeriodicTasks`        | `fakeAsync()` 테스트가 보류 중인 타이머 이벤트 *작업*(`setTimeout` 및 `setInterval` 콜백 대기열)에 종료될 경우, 테스트는 명확한 오류 메시지와 함께 실패합니다. <br /> 일반적으로 테스트는 대기 중인 작업 없이 종료되어야 합니다. 대기 중인 타이머 작업이 예상될 경우, `discardPeriodicTasks`를 호출하여 *작업* 대기열을 플러시하고 오류를 방지하세요.                                                                                                                                                       |
| `flushMicrotasks`             | `fakeAsync()` 테스트가 보류 중인 *마이크로 작업*(해결되지 않은 프로미스 등)으로 종료될 경우, 테스트는 명확한 오류 메시지와 함께 실패합니다. <br /> 일반적으로 테스트는 마이크로 작업이 완료될 때까지 기다려야 합니다. 보류 중인 마이크로 작업이 예상될 경우, `flushMicrotasks`를 호출하여 *마이크로 작업* 큐를 플러시하고 오류를 방지하세요.                                                                                                                                                                                                                                          |
| `ComponentFixtureAutoDetect`  | [자동 변경 감지](guide/testing/components-scenarios#automatic-change-detection)를 활성화하는 서비스에 대한 제공자 토큰입니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `getTestBed`                  | 현재 `TestBed` 인스턴스를 가져옵니다. 일반적으로 필요하지 않으며, `TestBed` 클래스의 정적 메서드가 일반적으로 충분하기 때문입니다. `TestBed` 인스턴스는 정적 메서드로는 사용할 수 없는 몇 가지 드물게 사용되는 멤버를 노출합니다.                                                                                                                                                                                                                                                                                                                                                      |

## `TestBed` 클래스 요약

`TestBed` 클래스는 Angular 테스트 유틸리티 중 하나입니다.
그 API는 상당히 방대하며, 조금씩 탐색해보지 않으면 압도될 수 있습니다.
전체 API를 흡수하기 전에 먼저 이 가이드의 초기 부분을 읽고 기본 사항을 익히세요.

`configureTestingModule`에 전달된 모듈 정의는 `@NgModule` 메타데이터 속성의 하위 집합입니다.

<docs-code language="javascript">

type TestModuleMetadata = {
  providers?: any[];
  declarations?: any[];
  imports?: any[];
  schemas?: Array<SchemaMetadata | any[]>;
};

</docs-code>

각 오버라이드 메소드는 `MetadataOverride<T>`를 받아들이며, 여기서 `T`는 메소드에 적합한 메타데이터의 종류입니다. 즉, `@NgModule`, `@Component`, `@Directive`, 또는 `@Pipe`의 매개변수입니다.

<docs-code language="javascript">

type MetadataOverride<T> = {
  add?: Partial<T>;
  remove?: Partial<T>;
  set?: Partial<T>;
};

</docs-code>

`TestBed` API는 *전역* `TestBed` 인스턴스를 업데이트하거나 참조하는 정적 클래스 메서드로 구성됩니다.

내부적으로 모든 정적 메서드는 현재 런타임 `TestBed` 인스턴스의 메서드를 다룹니다. 이 인스턴스는 `getTestBed()` 함수에 의해 반환됩니다.

각 개별 테스트 전에 신규 시작을 보장하기 위해 `beforeEach()` 내에서 `TestBed` 메서드를 호출하세요.

가능한 유용성의 순서로 가장 중요한 정적 메서드는 다음과 같습니다.

| 메서드                                                        | 세부사항 |
|:---                                                            |:---      |
| `configureTestingModule`                                       | 테스트 셈 \(`karma-test-shim`, `browser-test-shim`\)이 [초기 테스트 환경](guide/testing)과 기본 테스트 모듈을 설정합니다. 기본 테스트 모듈은 모든 테스터가 필요로 하는 기본 선언과 일부 Angular 서비스 대체물로 구성됩니다. <br /> 특정 테스트 집합을 위한 테스트 모듈 구성을 세분화하려면 `configureTestingModule`을 호출하여 가져오기, 선언(컴포넌트, 디렉티브 및 파이프) 및 제공자를 추가하고 제거하세요.                                                                                                                                                |
| `compileComponents`                                            | 테스트 모듈 구성이 완료된 후 비동기적으로 테스트 모듈을 컴파일합니다. `templateUrl` 또는 `styleUrls`가 있는 *어떠한* 테스트 모듈 컴포넌트라도 반드시 이 메서드를 호출해야 합니다. 컴포넌트 템플릿과 스타일 파일을 가져오는 것은 본질적으로 비동기이기 때문입니다. [compileComponents](guide/testing/components-scenarios#calling-compilecomponents)를 참조하세요. <br /> `compileComponents`를 호출한 후, 현재 스펙의 지속 시간 동안 `TestBed` 구성은 동결됩니다.                                                                                                                                 |
| `createComponent<T>`                                      | 현재 `TestBed` 구성에 따라 타입 `T`의 컴포넌트 인스턴스를 생성합니다. `createComponent`를 호출한 후, 현재 스펙의 지속 기간 동안 `TestBed` 구성은 동결됩니다.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `overrideModule`                                               | 주어진 `NgModule`의 메타데이터를 대체합니다. 모듈이 다른 모듈을 가져올 수 있음을 기억하세요. `overrideModule` 메서드는 현재 테스트 모듈 깊숙이 들어가 이러한 내부 모듈 중 하나를 수정할 수 있습니다.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `overrideComponent`                                            | 주어진 컴포넌트 클래스의 메타데이터를 대체합니다. 이 컴포넌트는 내부 모듈 내에 깊게 중첩되어 있을 수 있습니다.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `overrideDirective`                                            | 주어진 디렉티브 클래스의 메타데이터를 대체합니다. 이 디렉티브는 내부 모듈 내에 깊게 중첩되어 있을 수 있습니다.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `overridePipe`                                                 | 주어진 파이프 클래스의 메타데이터를 대체합니다. 이 파이프는 내부 모듈 내에 깊게 중첩되어 있을 수 있습니다.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `inject`                           | 현재 `TestBed` 주입기에서 서비스를 검색합니다. `inject` 함수는 이를 위한 경우가 종종 충분합니다. 그러나 `inject`는 서비스를 제공할 수 없는 경우 오류를 발생시킵니다. <br /> 서비스가 선택적인 경우는 어떻게 되나요? <br /> `TestBed.inject()` 메서드는 두 번째 선택적 매개변수를 받아 Angular가 제공자를 찾지 못할 경우 반환할 객체(이 예제에서는 `null`)를 지정할 수 있습니다: <docs-code header="app/demo/demo.testbed.spec.ts" path="adev/src/content/examples/testing/src/app/demo/demo.testbed.spec.ts" visibleRegion="testbed-get-w-null"/> `TestBed.inject`를 호출한 후, 현재 스펙의 지속 기간 동안 `TestBed` 구성은 동결됩니다. |
| `initTestEnvironment` | 전체 테스트 실행을 위한 테스트 환경을 초기화합니다. <br /> 테스트 셈 \(`karma-test-shim`, `browser-test-shim`\)이 이를 위해 호출하므로 자주 스스로 호출할 이유는 거의 없습니다. <br /> 이 메서드를 *정확히 한 번* 호출하세요. 테스트 실행 중간에 이 기본값을 변경하려면 먼저 `resetTestEnvironment`를 호출하세요. <br /> Angular 컴파일러 팩토리, `PlatformRef`, 및 기본 Angular 테스트 모듈을 지정하세요. 비 브라우저 플랫폼을 위한 대체 옵션은 일반 형식 `@angular/platform-<platform_name>/testing/<platform_name>`으로 제공됩니다.  |
| `resetTestEnvironment`                                         | 기본 테스트 모듈을 포함하여 초기 테스트 환경을 재설정합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

`TestBed` 인스턴스 메서드 중 일부는 정적 `TestBed` *클래스* 메서드로 다뤄지지 않습니다.
이들은 드물게 필요합니다.

## `ComponentFixture`

`TestBed.createComponent<T>`는 컴포넌트 `T`의 인스턴스를 생성하고 해당 컴포넌트에 대한 강타입 `ComponentFixture`를 반환합니다.

`ComponentFixture` 속성과 메서드는 컴포넌트, 그 DOM 표현 및 Angular 환경의 측면에 대한 액세스를 제공합니다.

### `ComponentFixture` 속성

테스터를 위한 가장 중요한 속성은 유용성의 순서로 나열됩니다.

| 속성                  | 세부사항 |
|:---                   |:---      |
| `componentInstance`   | `TestBed.createComponent`에 의해 생성된 컴포넌트 클래스의 인스턴스입니다.                                                                                                                                                                                                                          |
| `debugElement`        | 컴포넌트의 루트 요소와 관련된 `DebugElement`입니다. <br /> `debugElement`는 테스트 및 디버깅 중에 컴포넌트 및 그 DOM 요소에 대한 통찰력을 제공합니다. 이는 테스터에게 중요한 속성입니다. 가장 흥미로운 멤버는 [아래](#debug-element-details)에서 다룹니다. |
| `nativeElement`       | 컴포넌트의 루트에 있는 네이티브 DOM 요소입니다.                                                                                                                                                                                                                                        |
| `changeDetectorRef`   | 컴포넌트의 `ChangeDetectorRef`입니다. <br /> `ChangeDetectorRef`는 `ChangeDetectionStrategy.OnPush` 방법이 있거나 컴포넌트의 변경 감지가 프로그래밍적으로 제어될 때 가장 유용합니다.                                           |

### `ComponentFixture` 메서드

*fixture* 메서드는 Angular가 컴포넌트 트리에 대해 특정 작업을 수행하도록 합니다.
이 메서드를 호출하여 시뮬레이션된 사용자 작업에 대한 Angular 동작을 트리거하세요.

테스터를 위한 가장 유용한 메서드는 다음과 같습니다.

| 메서드               | 세부사항 |
|:---                  |:---      |
| `detectChanges`      | 컴포넌트에 대한 변경 감지 주기를 트리거합니다. <br /> 컴포넌트를 초기화하려면 호출하세요 \(이 메서드는 `ngOnInit`을 호출합니다\) 및 테스트 코드 이후에 컴포넌트의 데이터 바인딩 속성 값을 변경하세요. Angular는 `personComponent.name`이 변경되었다는 것을 볼 수 없으며, `name` 바인딩을 업데이트하지 않습니다. `detectChanges`를 호출할 때까지 업데이트되지 않습니다. <br /> 순환 업데이트가 없는지 확인하기 위해 이후 `checkNoChanges`를 실행합니다; `detectChanges(false)`로 호출된 경우를 제외하고.      |
| `autoDetectChanges` | 자동으로 변경 감지를 수행하려는 경우 `true`로 설정하세요. <br /> 자동 감지가 `true`일 때, 테스트 픽스처는 컴포넌트를 생성한 직후 `detectChanges`를 즉시 호출합니다. 그런 다음 관련 영역 이벤트를 리슨하고 그에 따라 `detectChanges`를 호출합니다. 테스트 코드가 컴포넌트 속성 값을 직접 수정할 경우, 아마도 여전히 데이터 바인딩 업데이트를 트리거하기 위해 `fixture.detectChanges`를 호출해야 할 것입니다. <br /> 기본값은 `false`입니다. 테스트 동작에 대한 세밀한 제어를 선호하는 테스터는 일반적으로 `false`로 유지합니다. |
| `checkNoChanges`     | 보류 중인 변경 사항이 없는지 확인하기 위해 변경 감지 실행을 수행합니다. 보류 중인 변경 사항이 있을 경우 예외를 발생시킵니다.                                                                                                                                                                                                                                                                                                                                                          |
| `isStable`           | 픽스처가 현재 *안정적*이면 `true`를 반환합니다. 비동기 작업이 완료되지 않은 경우 `false`를 반환합니다.                                                                                                                                                                                                                                                                                                                                                                                      |
| `whenStable`         | 픽스처가 안정적일 때 해결되는 프로미스를 반환합니다. <br /> 비동기 작업 또는 비동기 변경 감지가 완료된 후 테스트를 재개하려면 해당 프로미스를 연결하세요. [whenStable](guide/testing/components-scenarios#whenstable)을 참조하세요.                                                                                                                                                                                              |
| `destroy`            | 컴포넌트 파괴를 트리거합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

#### `DebugElement`

`DebugElement`는 컴포넌트의 DOM 표현에 대한 중요한 통찰력을 제공합니다.

테스트 루트 컴포넌트의 `DebugElement`에서 반환된 `fixture.debugElement`를 통해 픽스처의 전체 요소 및 컴포넌트 서브 트리를 탐색하고 쿼리할 수 있습니다.

테스터를 위한 가장 유용한 `DebugElement` 멤버는 유용성의 대략적인 순서로 나열됩니다:

| 멤버                  | 세부사항 |
|:---                   |:---      |
| `nativeElement`       | 브라우저의 해당 DOM 요소입니다.                                                                                                                                                                                                                                             |
| `query`               | `query(predicate: Predicate<DebugElement>)`를 호출하면 서브 트리의 어떤 깊이에서든지 [predicate](#query-predicate)와 일치하는 첫 번째 `DebugElement`를 반환합니다.                                                                                                                                                                                                 |
| `queryAll`            | `queryAll(predicate: Predicate<DebugElement>)`를 호출하면 서브 트리의 어떤 깊이에서든지 [predicate](#query-predicate)와 일치하는 모든 `DebugElement`를 반환합니다.                                                                                                                                                                                                       |
| `injector`            | 호스트 의존성 주입기입니다. 예를 들어 루트 요소의 컴포넌트 인스턴스 주입기입니다.                                                                                                                                                                                                                                                                                                              |
| `componentInstance`   | 해당 요소의 자신의 컴포넌트 인스턴스가 있는 경우, 그렇습니다.                                                                                                                                                                                                                                                                                                                                            |
| `context`             | 이 요소에 대한 부모 컨텍스트를 제공하는 객체입니다. 종종 이 요소를 지배하는 상위 컴포넌트 인스턴스입니다. <br /> 요소가 `*ngFor` 내에서 반복되면, 컨텍스트는 `$implicit` 속성이 행 인스턴스 값인 `NgForOf`가 됩니다. 예를 들어, `*ngFor="let hero of heroes"`에서 `hero`가 해당됩니다.                                                  |
| `children`            | 즉각적인 `DebugElement` 자식입니다. `children`을 통해 트리를 하강하여 걷습니다. `DebugElement`는 `DebugNode` 객체 목록인 `childNodes`도 가집니다. `DebugElement`는 `DebugNode` 객체에서 파생되며, 종종 요소보다 더 많은 노드가 있습니다. 테스터는 일반적으로 일반 노드는 무시할 수 있습니다.                                                                |
| `parent`              | `DebugElement` 부모입니다. 루트 요소인 경우 `null`입니다.                                                                                                                                                                                                                                                                                                                                             |
| `name`                | 요소가 있는 경우, 요소 태그 이름입니다.                                                                                                                                                                                                                                                                                                                                                             |
| `triggerEventHandler` | 해당 요소의 `listeners` 컬렉션에 청취자가 있는 경우 해당 이름의 이벤트를 트리거합니다. 두 번째 매개변수는 핸들러가 예상하는 *이벤트 객체*입니다. [triggerEventHandler](guide/testing/components-scenarios#trigger-event-handler)를 참조하세요. <br /> 이벤트에 청취자가 없거나 다른 문제가 있는 경우 `nativeElement.dispatchEvent(eventObject)`를 호출하는 것을 고려하세요.          |
| `listeners`           | 컴포넌트의 `@Output` 속성 및/또는 요소의 이벤트 속성과 연결된 콜백입니다.                                                                                                                                                                                                                                                                                                                      |
| `providerTokens`      | 이 컴포넌트의 주입기 조회 토큰입니다. 컴포넌트 자체 및 컴포넌트가 `providers` 메타데이터에 나열하는 토큰을 포함합니다.                                                                                                                                                                                                                         |
| `source`              | 소스 컴포넌트 템플릿에서 이 요소를 찾는 위치입니다.                                                                                                                                                                                                                                                                                                                                               |
| `references`          | 템플릿 지역 변수(예: `#foo`)와 연관된 객체의 사전이며, 지역 변수 이름으로 키가 지정됩니다.                                                                                                                                                                                                                                                                                               |

`DebugElement.query(predicate)` 및 `DebugElement.queryAll(predicate)` 메서드는 소스 요소의 서브 트리에서 일치하는 `DebugElement`를 필터링하는 프레디케이트를 사용합니다.

프레디케이트는 `DebugElement`를 인수로 받아 *참 값*을 반환하는 any 메서드입니다.
다음 예제는 "content"라는 템플릿 지역 변수에 대한 참조가 있는 모든 `DebugElements`를 찾습니다:

<docs-code header="app/demo/demo.testbed.spec.ts" path="adev/src/content/examples/testing/src/app/demo/demo.testbed.spec.ts" visibleRegion="custom-predicate"/>

Angular `By` 클래스는 일반적인 프레디케이트에 대한 세 가지 정적 메서드를 제공합니다:

| 정적 메서드             | 세부사항 |
|:---                     |:---      |
| `By.all`                | 모든 요소 반환                                                              |
| `By.css(selector)`      | 일치하는 CSS 선택기가 있는 요소 반환                                        |
| `By.directive(directive)`| 디렉티브 클래스의 인스턴스에 Angular가 일치하는 요소 반환 |

<docs-code header="app/hero/hero-list.component.spec.ts" path="adev/src/content/examples/testing/src/app/hero/hero-list.component.spec.ts" visibleRegion="by"/>