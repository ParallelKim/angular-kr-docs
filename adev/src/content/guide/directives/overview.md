<docs-decorative-header title="내장 지시어" imgSrc="adev/src/assets/images/directives.svg"> <!-- markdownlint-disable-line -->
지시어는 Angular 애플리케이션 내의 요소에 추가적인 동작을 추가하는 클래스입니다.
</docs-decorative-header>

Angular의 내장 지시어를 사용하여 양식, 목록, 스타일 및 사용자가 보는 내용을 관리하십시오.

Angular 지시어는 다음과 같은 다양한 유형이 있습니다:

| 지시어 유형                                               | 세부 사항                                                                           |
| :------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| [컴포넌트](guide/components)                             | 템플릿과 함께 사용됩니다. 이 유형의 지시어는 가장 일반적인 지시어 유형입니다.   |
| [속성 지시어](#built-in-attribute-directives)           | 요소, 컴포넌트 또는 다른 지시어의 모양이나 동작을 변경합니다.                    |
| [구조 지시어](#built-in-structural-directives)         | DOM 요소를 추가하고 제거하여 DOM 레이아웃을 변경합니다.                         |

이 가이드는 내장 [속성 지시어](#built-in-attribute-directives)와 [구조 지시어](#built-in-structural-directives)를 다룹니다.

## 내장 속성 지시어

속성 지시어는 다른 HTML 요소, 속성, 속성과 컴포넌트의 동작을 듣고 수정합니다.

가장 일반적인 속성 지시어는 다음과 같습니다:

| 일반적인 지시어                                             | 세부 사항                                            |
| :---------------------------------------------------------- | :------------------------------------------------- |
| [`NgClass`](#adding-and-removing-classes-with-ngclass)    | CSS 클래스 집합을 추가하고 제거합니다.             |
| [`NgStyle`](#setting-inline-styles-with-ngstyle)          | HTML 스타일 집합을 추가하고 제거합니다.           |
| [`NgModel`](#displaying-and-updating-properties-with-ngmodel) | HTML 양식 요소에 양방향 데이터 바인딩을 추가합니다. |

도움이 되는 정보: 내장 지시어는 오직 공개 API만 사용합니다. 다른 지시어가 접근할 수 없는 개인 API에 특별한 접근 권한이 없습니다.

## `NgClass`로 클래스 추가 및 제거

`ngClass`를 사용하여 여러 CSS 클래스를 동시에 추가하거나 제거합니다.

도움이 되는 정보: 단일 클래스를 추가하거나 제거하려면 `NgClass` 대신 [클래스 바인딩](guide/templates/class-binding)을 사용하십시오.

### 컴포넌트에서 `NgClass` 가져오기

`NgClass`를 사용하려면, 컴포넌트의 `imports` 목록에 추가하십시오.

<docs-code header="src/app/app.component.ts (NgClass import)" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="import-ng-class"/>

### 표현식과 함께 `NgClass` 사용하기

스타일을 지정할 요소에 `[ngClass]`를 추가하고 이를 표현식에 설정하십시오.
이 경우 `isSpecial`은 `app.component.ts`에서 `true`로 설정된 불리언입니다.
`isSpecial`이 true이므로 `ngClass`는 `<div>`에 `special` 클래스를 적용합니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="special-div"/>

### 메서드와 함께 `NgClass` 사용하기

1. 메서드와 함께 `NgClass`를 사용하려면, 컴포넌트 클래스에 메서드를 추가합니다.
   다음 예제에서 `setCurrentClasses()`는 세 개의 다른 컴포넌트 속성의 `true` 또는 `false` 상태에 따라 클래스를 추가하거나 제거하는 객체로 `currentClasses` 속성을 설정합니다.

   객체의 각 키는 CSS 클래스 이름입니다.
   키가 `true`이면 `ngClass`는 클래스를 추가합니다.
   키가 `false`이면 `ngClass`는 클래스를 제거합니다.

   <docs-code header="src/app/app.component.ts" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="setClasses"/>

1. 템플릿에서 `currentClasses`에 `ngClass` 속성 바인딩을 추가하여 요소의 클래스를 설정하십시오:

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgClass-1"/>

이 사용 사례에 대해 Angular는 초기화 시 클래스를 적용하고 `currentClasses` 객체의 재할당으로 인한 변경 시에 적용합니다.
전체 예제는 사용자가 `Refresh currentClasses` 버튼을 클릭할 때 `ngOnInit()`으로 `setCurrentClasses()`를 처음 호출합니다.
이 단계는 `ngClass`를 구현하는 데 필요하지 않습니다.

## `NgStyle`로 인라인 스타일 설정하기

도움이 되는 정보: 단일 스타일을 추가하거나 제거하려면 `NgStyle` 대신 [스타일 바인딩](guide/templates/binding#css-class-and-style-property-bindings)을 사용하십시오.

### 컴포넌트에서 `NgStyle` 가져오기

`NgStyle`을 사용하려면, 컴포넌트의 `imports` 목록에 추가하십시오.

<docs-code header="src/app/app.component.ts (NgStyle import)" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="import-ng-style"/>

`NgStyle`을 사용하여 컴포넌트의 상태에 따라 여러 인라인 스타일을 동시에 설정하십시오.

1. `NgStyle`을 사용하려면, 메서드를 컴포넌트 클래스에 추가하십시오.

   다음 예제에서 `setCurrentStyles()`는 세 개의 다른 컴포넌트 속성의 상태에 따라 세 가지 스타일을 정의하는 객체로 `currentStyles` 속성을 설정합니다.

   <docs-code header="src/app/app.component.ts" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="setStyles"/>

1. 요소의 스타일을 설정하려면 `currentStyles`에 `ngStyle` 속성 바인딩을 추가하십시오.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgStyle-2"/>

이 사용 사례에 대해 Angular는 초기화 시 및 변경 시 스타일을 적용합니다.
이렇게 하려면 전체 예제에서 종속 속성이 버튼 클릭을 통해 변경될 때 기본적으로 `setCurrentStyles()`를 `ngOnInit()`으로 초기 호출합니다.
그러나 이러한 단계는 `ngStyle`을 단독으로 구현하는 데 필요하지 않습니다.

## `ngModel`로 속성 표시 및 업데이트하기

`NgModel` 지시어를 사용하여 데이터 속성을 표시하고 사용자가 변경할 경우 해당 속성을 업데이트하십시오.

1. `FormsModule`을 가져오고 AppComponent의 `imports` 목록에 추가하십시오.

<docs-code header="src/app/app.component.ts (FormsModule import)" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="import-forms-module" />

1. HTML `<form>` 요소에 `[(ngModel)]` 바인딩을 추가하고 이를 `name` 속성과 설정하십시오.

   <docs-code header="src/app/app.component.html (NgModel example)" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgModel-1"/>

   이 `[(ngModel)]` 구문은 데이터 바인딩된 속성만 설정할 수 있습니다.

구성을 사용자 지정하려면 속성과 이벤트 바인딩을 분리하는 확장된 형태를 작성하십시오.
속성을 설정하기 위해 [속성 바인딩](guide/templates/property-binding)을 사용하고 변경에 반응하기 위해 [이벤트 바인딩](guide/templates/event-listeners)을 사용하십시오.
다음 예제는 `<input>` 값을 대문자로 변경합니다:

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="uppercase"/>

모든 변형이 작동하는 모습은 다음과 같습니다. 대문자 버전을 포함하여:

<img alt="NgModel variations" src="assets/images/guide/built-in-directives/ng-model-anim.gif">

### `NgModel` 및 값 접근자

`NgModel` 지시어는 [ControlValueAccessor](api/forms/ControlValueAccessor)로 지원되는 요소에 작동합니다.
Angular는 모든 기본 HTML 양식 요소에 대해 _값 접근자_를 제공합니다.
자세한 내용은 [양식](guide/forms)을 참조하십시오.

`[(ngModel)]`을 비양식 내장 요소 또는 타사 사용자 정의 컴포넌트에 적용하려면 값 접근자를 작성해야 합니다.
자세한 내용은 [DefaultValueAccessor](api/forms/DefaultValueAccessor)에 대한 API 문서를 참조하십시오.

도움이 되는 정보: Angular 컴포넌트를 작성할 때, Angular의 [양방향 바인딩 구문](guide/templates/two-way-binding#how-two-way-binding-works) 에 따라 값과 이벤트 속성을 이름 붙이면 값 접근자 또는 `NgModel`이 필요하지 않습니다.

## 내장 구조 지시어

구조 지시어는 HTML 레이아웃을 책임집니다.
그들은 일반적으로 다루는 요소가 추가되고 제거되며 조작됨에 따라 DOM의 구조를 형성하거나 재형성합니다.

이 섹션에서는 가장 일반적인 내장 구조 지시어를 소개합니다:

| 일반적인 내장 구조 지시어                                  | 세부 사항                                                          |
| :-------------------------------------------------------- | :--------------------------------------------------------------- |
| [`NgIf`](#adding-or-removing-an-element-with-ngif)       | 조건적으로 템플릿에서 하위 보기를 생성하거나 폐기합니다. |
| [`NgFor`](#listing-items-with-ngfor)                      | 목록의 각 항목에 대해 노드를 반복합니다.                           |
| [`NgSwitch`](#switching-cases-with-ngswitch)              | 대체 보기를 전환하는 지시어 세트입니다.                           |

자세한 정보는 [구조 지시어](guide/directives/structural-directives)를 참조하십시오.

## `NgIf`로 요소 추가 또는 제거하기

호스트 요소에 `NgIf` 지시어를 적용하여 요소를 추가하거나 제거하십시오.

`NgIf`가 `false`일 때 Angular는 DOM에서 요소와 그 자손을 제거합니다.
그런 다음 Angular는 구성 요소를 폐기하여 메모리와 리소스를 해제합니다.

### 컴포넌트에서 `NgIf` 가져오기

`NgIf`를 사용하려면, 컴포넌트의 `imports` 목록에 추가하십시오.

<docs-code header="src/app/app.component.ts (NgIf import)" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="import-ng-if"/>

### `NgIf` 사용하기

요소를 추가하거나 제거하려면 조건 표현식에 `*ngIf`를 바인딩합니다. 예를 들어 `isActive`:

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgIf-1"/>

`isActive` 표현식이 true값을 반환하면 `NgIf`는 DOM에 `ItemDetailComponent`를 추가합니다.
표현식이 false일 경우 `NgIf`는 DOM에서 `ItemDetailComponent`를 제거하고 구성 요소 및 모든 하위 구성 요소를 폐기합니다.

`NgIf` 및 `NgIfElse`에 대한 자세한 내용은 [NgIf API 문서](api/common/NgIf)를 참조하십시오.

### `null` 보호

기본적으로 `NgIf`는 null 값에 바인딩된 요소의 표시를 방지합니다.

`<div>`를 보호하기 위해 `*ngIf="yourProperty"`를 추가하십시오.
다음 예제에서 `currentCustomer` 이름이 나타나는 이유는 `currentCustomer`가 존재하기 때문입니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgIf-2"/>

그러나 속성이 `null`인 경우 Angular는 `<div>`를 표시하지 않습니다.
이 예제에서는 Angular가 `nullCustomer`를 표시하지 않습니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgIf-2b"/>

## `NgFor`로 항목 나열하기

`NgFor` 지시어를 사용하여 항목 목록을 표시합니다.

### 컴포넌트에서 `NgFor` 가져오기

`NgFor`를 사용하려면, 컴포넌트의 `imports` 목록에 추가하십시오.

<docs-code header="src/app/app.component.ts (NgFor import)" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="import-ng-for"/>

### `NgFor` 사용하기

`NgFor`를 사용하려면 다음을 수행해야 합니다:

1. Angular가 단일 항목을 렌더링하는 방식을 결정하는 HTML 블록을 정의합니다.
1. 항목을 나열하려면, `*ngFor`에 약식으로 `let item of items`를 할당하십시오.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgFor-1"/>

문자열 `"let item of items"`는 Angular에게 다음을 지시합니다:

- `items` 배열의 각 항목을 로컬 `item` 반복 변수에 저장합니다.
- 각 반복을 위해 템플릿 HTML에서 각 항목을 사용할 수 있게 합니다.
- `"let item of items"`를 호스트 요소 주위에 `<ng-template>`로 변환합니다.
- 목록의 각 `item`에 대해 `<ng-template>`를 반복합니다.

자세한 정보는 [구조 지시어 약식](guide/directives/structural-directives#structural-directive-shorthand) 및 [구조 지시어](guide/directives/structural-directives) 섹션을 참조하십시오.

### 컴포넌트 뷰 반복하기

컴포넌트 요소를 반복하기 위해 선택자에 `*ngFor`를 적용하십시오.
다음 예제에서는 선택자가 `<app-item-detail>`입니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgFor-2"/>

템플릿 입력 변수인 `item`을 다음 위치에 참조하십시오:

- `ngFor` 호스트 요소 내
- 호스트 요소의 자손 내에서 항목의 속성에 접근하기 위해

다음 예제에서는 `item`을 먼저 보간으로 참조한 후, `<app-item-detail>` 컴포넌트의 `item` 속성에 바인딩합니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgFor-1-2"/>

템플릿 입력 변수에 대한 자세한 내용은 [구조 지시어 약식](guide/directives/structural-directives#structural-directive-shorthand)을 참조하십시오.

### `*ngFor`의 `index` 가져오기

템플릿 입력 변수에서 `*ngFor`의 `index`를 가져와 템플릿에서 사용하십시오.

`*ngFor`에서 약식으로 세미콜론과 `let i=index`를 추가하십시오.
다음 예제에서는 `index`를 `i`라는 이름의 변수에 가져와 항목 이름과 함께 표시합니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgFor-3"/>

`NgFor` 지시어 컨텍스트의 index 속성은 각 반복에서 항목의 0 기반 인덱스를 반환합니다.

Angular는 이 지시를 호스트 요소 주위에 `<ng-template>`로 변환한 후,
이 템플릿을 사용하여 목록의 각 `item`에 새 요소 및 바인딩 세트를 생성하는 데 반복하여 사용합니다.
약식에 대한 자세한 내용은 [구조 지시어](guide/directives/structural-directives#structural-directive-shorthand) 가이드를 참조하십시오.

## 특정 조건이 true일 때 요소 반복하기

특정 조건이 true일 때 HTML 블록을 반복하려면, `*ngIf`를 `*ngFor` 요소를 래핑하는 컨테이너 요소에 두십시오.

자세한 정보는 [각 요소당 하나의 구조 지시어](guide/directives/structural-directives#one-structural-directive-per-element)를 참조하십시오.

### `*ngFor`의 `trackBy`로 항목 추적하기

항목 목록의 변경 사항을 추적하여 애플리케이션이 서버에 호출하는 수를 줄이십시오.
`*ngFor`의 `trackBy` 속성을 사용하면 Angular는 변경된 항목만 변경하고 다시 렌더링할 수 있습니다. 전체 항목 목록을 리로드하는 대신.

1. `NgFor`에서 추적해야 할 값을 반환하는 메서드를 컴포넌트에 추가하십시오.
이 예제에서는 추적하려는 값이 항목의 `id`입니다.
브라우저가 `id`를 이미 렌더링한 경우, Angular는 이를 추적하여 동일한 `id`에 대해 서버를 다시 쿼리하지 않습니다.

<docs-code header="src/app/app.component.ts" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="trackByItems"/>

1. 약식 표현식에서 `trackBy`를 `trackByItems()` 메서드로 설정하십시오.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="trackBy"/>

**ID 변경**은 새로운 `item.id`를 가진 새 항목을 생성합니다.
다음 `trackBy` 효과 예시에서는 **Reset items**가 동일한 `item.id`를 가진 새 항목을 생성합니다.

- `trackBy` 없이 두 버튼 모두 완전한 DOM 요소 교체를 트리거합니다.
- `trackBy`를 사용하면 `id` 변경만 요소 교체를 트리거합니다.

<img alt="Animation of trackBy" src="assets/images/guide/built-in-directives/ngfor-trackby.gif">

## DOM 요소 없이 지시어 호스팅하기

Angular의 `<ng-container>`는 스타일이나 레이아웃에 방해하지 않는 그룹화 요소입니다. Angular가 DOM에 이를 반영하지 않기 때문에 가능합니다.

단일 요소가 지시어를 호스트하지 않는 경우 `<ng-container>`를 사용하십시오.

여기 `<ng-container>`를 사용하는 조건부 단락이 있습니다.

<docs-code header="src/app/app.component.html (ngif-ngcontainer)" path="adev/src/content/examples/structural-directives/src/app/app.component.html" visibleRegion="ngif-ngcontainer"/>

<img alt="ngcontainer paragraph with proper style" src="assets/images/guide/structural-directives/good-paragraph.png">

1. `FormsModule`에서 `ngModel` 지시어를 가져옵니다.

1. 관련 Angular 모듈의 imports 섹션에 `FormsModule`을 추가합니다.

1. 조건부로 `<option>`을 제외하려면, `<option>`을 `<ng-container>`로 감싸십시오.

   <docs-code header="src/app/app.component.html (select-ngcontainer)" path="adev/src/content/examples/structural-directives/src/app/app.component.html" visibleRegion="select-ngcontainer"/>

   <img alt="ngcontainer options work properly" src="assets/images/guide/structural-directives/select-ngcontainer-anim.gif">

## `NgSwitch`로 케이스 전환하기

JavaScript `switch` 문과 유사하게, `NgSwitch`는 스위치 조건에 따라 여러 가능한 요소 중 하나를 표시합니다.
Angular는 선택된 요소만 DOM에 넣습니다.

<!--todo: API Flagged -->

`NgSwitch`는 세 개의 지시어 집합입니다:

| `NgSwitch` 지시어   | 세부 사항                                                                                                                                                                |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NgSwitch`          | 동반 지시어의 동작을 변경하는 속성 지시어입니다.                                                                                                                      |
| `NgSwitchCase`      | 바인딩된 값이 스위치 값과 같을 때 요소를 DOM에 추가하고 그렇지 않을 때는 바인딩된 값을 제거하는 구조 지시어입니다.                                                   |
| `NgSwitchDefault`   | 선택된 `NgSwitchCase`가 없을 때 요소를 DOM에 추가하는 구조 지시어입니다.                                                                                                                 |

지시어를 사용하려면 컴포넌트의 `imports` 목록에 `NgSwitch`, `NgSwitchCase`, `NgSwitchDefault`를 추가하십시오.

<docs-code header="src/app/app.component.ts (NgSwitch imports)" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="import-ng-switch"/>

### `NgSwitch` 사용하기

1. `<div>`와 같은 요소에 스위치 값을 반환하는 표현식에 `[ngSwitch]`를 바인딩합니다. 이 예제의 `feature` 값은 문자열이지만 스위치 값은 어떤 유형도 가능합니다.

1. 케이스의 요소에 `*ngSwitchCase` 및 `*ngSwitchDefault`에 바인딩합니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgSwitch"/>

1. 상위 컴포넌트에서 `currentItem`을 정의하여 `[ngSwitch]` 표현식에서 사용할 수 있도록 합니다.

<docs-code header="src/app/app.component.ts" path="adev/src/content/examples/built-in-directives/src/app/app.component.ts" visibleRegion="item"/>

1. 각 하위 컴포넌트에서 상위 컴포넌트의 `currentItem`에 바인딩된 `item` [입력 속성](guide/components/inputs)을 추가합니다.
   다음 두 코드는 상위 컴포넌트와 하위 컴포넌트 중 하나의 코드를 보여줍니다.
   다른 하위 컴포넌트는 `StoutItemComponent`와 동일합니다.

   <docs-code header="각 하위 컴포넌트에 사용, 여기 StoutItemComponent" path="adev/src/content/examples/built-in-directives/src/app/item-switch.component.ts" visibleRegion="input"/>

   <img alt="Animation of NgSwitch" src="assets/images/guide/built-in-directives/ngswitch.gif">

스위치 지시어는 내장 HTML 요소 및 웹 컴포넌트와 함께 작동합니다.
예를 들어, `<app-best-item>` 스위치 케이스를 `<div>`로 교체할 수 있습니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/built-in-directives/src/app/app.component.html" visibleRegion="NgSwitch-div"/>

## 다음 단계

<docs-pill-row>
  <docs-pill href="guide/directives/attribute-directives" title="속성 지시어"/>
  <docs-pill href="guide/directives/structural-directives" title="구조 지시어"/>
  <docs-pill href="guide/directives/directive-composition-api" title="지시어 조합 API"/>
</docs-pill-row>
