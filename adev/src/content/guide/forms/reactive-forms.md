# 반응형 폼

반응형 폼은 시간이 지나면서 값이 변경되는 폼 입력을 처리하는 데 모델 기반 접근 방식을 제공합니다. 이 가이드에서는 기본 폼 제어를 생성하고 업데이트하는 방법, 그룹 내에서 여러 제어를 사용하고, 폼 값을 검증하며, 런타임에 제어를 추가하거나 제거할 수 있는 동적 폼을 만드는 방법을 보여줍니다.

## 반응형 폼 개요

반응형 폼은 주어진 시점에서 폼의 상태를 관리하는 명시적이고 불변의 접근 방식을 사용합니다. 폼 상태의 각 변경은 새로운 상태를 반환하며, 이는 변경 간 모델의 무결성을 유지합니다. 반응형 폼은 관찰 가능한 스트림을 기반으로 구축되며, 여기서는 폼 입력 및 값이 스트림의 입력 값으로 제공되어 동기식으로 접근할 수 있습니다.

반응형 폼은 데이터를 요청할 때 데이터의 일관성과 예측 가능성을 보장하므로 테스트에 대한 간단한 경로도 제공합니다. 스트림의 소비자는 해당 데이터를 안전하게 조작할 수 있는 접근 권한을 갖습니다.

반응형 폼은 [템플릿 기반 폼](guide/forms/template-driven-forms)과 여러 가지 점에서 다릅니다. 반응형 폼은 데이터 모델에 대한 동기식 접근, 관찰 가능한 연산자를 통한 불변성, 관찰 가능한 스트림을 통한 변경 추적을 제공합니다.

템플릿 기반 폼은 템플릿에서 직접 데이터에 대한 접근을 허용하지만 템플릿에 내장된 지시문과 비가변 데이터를 통해 변경을 비동기적으로 추적하기 때문에 반응형 폼보다 덜 명시적입니다. 두 패러다임의 차이를 자세히 보려면 [폼 개요](guide/forms)를 참조하십시오.

## 기본 폼 제어 추가하기

폼 제어를 사용하려면 세 가지 단계를 따릅니다.

1. 애플리케이션에 반응형 폼 모듈을 등록합니다. 이 모듈은 반응형 폼을 사용하기 위해 필요한 반응형 폼 지시문을 선언합니다.
2. 새 컴포넌트를 생성하고 새로운 `FormControl`을 인스턴스화합니다.
3. 템플릿에서 `FormControl`을 등록합니다.

그런 다음 컴포넌트를 템플릿에 추가하여 폼을 표시할 수 있습니다.

다음 예제에서는 단일 폼 제어를 추가하는 방법을 보여줍니다. 이 예제에서는 사용자가 입력 필드에 자신의 이름을 입력하고 해당 입력 값을 캡처하여 폼 제어 요소의 현재 값을 표시합니다.

<docs-workflow>

<docs-step title="ReactiveFormsModule 가져오기">
반응형 폼 제어를 사용하려면 `@angular/forms` 패키지에서 `ReactiveFormsModule`을 가져오고 NgModule의 `imports` 배열에 추가하십시오.

<docs-code header="src/app/app.module.ts (발췌)" path="adev/src/content/examples/reactive-forms/src/app/app.module.ts" visibleRegion="imports" />
</docs-step>

<docs-step title="FormControl로 새 컴포넌트 생성하기">
CLI 명령 `ng generate component`를 사용하여 제어를 호스팅할 컴포넌트를 생성하십시오.

<docs-code header="src/app/name-editor/name-editor.component.ts" path="adev/src/content/examples/reactive-forms/src/app/name-editor/name-editor.component.ts" visibleRegion="create-control"/>

`FormControl`의 생성자를 사용하여 초기 값을 설정하세요. 이 경우 빈 문자열입니다. 컴포넌트 클래스에 이러한 제어를 생성함으로써 폼 입력 상태를 듣고 업데이트하며 검증하는 즉각적인 접근을 얻습니다.
</docs-step>

<docs-step title="템플릿에 제어 등록하기">
컴포넌트 클래스에서 제어를 생성한 후 템플릿의 폼 제어 요소와 연결해야 합니다. `ReactiveFormsModule`에 포함된 `FormControlDirective`에서 제공하는 `formControl` 바인딩을 사용하여 템플릿을 폼 제어로 업데이트합니다.

<docs-code header="src/app/name-editor/name-editor.component.html" path="adev/src/content/examples/reactive-forms/src/app/name-editor/name-editor.component.html" visibleRegion="control-binding" />

템플릿 바인딩 구문을 사용하여 폼 제어가 이제 템플릿의 `name` 입력 요소에 등록됩니다. 폼 제어와 DOM 요소는 서로 통신합니다: 뷰는 모델의 변경 사항을 반영하고, 모델은 뷰의 변경 사항을 반영합니다.
</docs-step>

<docs-step title="컴포넌트 표시하기">
`name` 속성에 할당된 `FormControl`은 `<app-name-editor>` 컴포넌트가 템플릿에 추가될 때 표시됩니다.

<docs-code header="src/app/app.component.html (이름 편집기)" path="adev/src/content/examples/reactive-forms/src/app/app.component.1.html" visibleRegion="app-name-editor"/>
</docs-step>
</docs-workflow>

### 폼 제어 값 표시하기

다음을 통해 값을 표시할 수 있습니다.

* 템플릿에서 `AsyncPipe`를 사용하거나 컴포넌트 클래스에서 `subscribe()` 메서드를 사용하여 폼의 값이 변경될 때를 들을 수 있는 `valueChanges` 관찰 가능성을 통해
* 현재 값을 스냅샷으로 제공하는 `value` 속성으로

다음 예제는 템플릿에서 보간법을 사용하여 현재 값을 표시하는 방법을 보여줍니다.

<docs-code header="src/app/name-editor/name-editor.component.html (제어 값)" path="adev/src/content/examples/reactive-forms/src/app/name-editor/name-editor.component.html" visibleRegion="display-value"/>

표시된 값은 폼 제어 요소를 업데이트함에 따라 변경됩니다.

반응형 폼은 각 인스턴스와 함께 제공되는 속성과 메서드를 통해 특정 제어에 대한 정보를 접근할 수 있습니다. 이러한 속성과 메서드는 기본 [AbstractControl](api/forms/AbstractControl "API 참조") 클래스로 폼 상태를 제어하고 [입력 검증](#validating-form-input "입력 검증에 대해 자세히 알아보기") 처리 시 메시지를 표시하는 시점을 결정하는 데 사용됩니다.

`FormControl` 속성과 메서드에 대한 자세한 내용은 [API 참조](api/forms/FormControl "상세 구문 참조")를 참조하세요.

### 폼 제어 값 바꾸기

반응형 폼은 제어의 값을 프로그래밍 방식으로 변경할 수 있는 메서드를 제공하여 사용자 상호 작용 없이 값을 업데이트할 수 있는 유연성을 제공합니다. 폼 제어 인스턴스는 제어의 값을 업데이트하고 제공된 값의 구조를 제어의 구조와 검증하는 `setValue()` 메서드를 제공합니다. 예를 들어, 백엔드 API 또는 서비스에서 폼 데이터를 가져올 때 `setValue()` 메서드를 사용하여 제어를 새 값으로 업데이트하고 이전 값을 완전히 대체합니다.

다음 예제는 `setValue()` 메서드를 사용하여 컴포넌트 클래스에 제어 값을 *Nancy*로 업데이트하는 메서드를 추가합니다.

<docs-code header="src/app/name-editor/name-editor.component.ts (값 업데이트)" path="adev/src/content/examples/reactive-forms/src/app/name-editor/name-editor.component.ts" visibleRegion="update-value"/>

템플릿에 이름 업데이트를 시뮬레이션하는 버튼을 추가합니다. **이름 업데이트** 버튼을 클릭하면 폼 제어 요소에 입력된 값이 현재 값으로 반영됩니다.

<docs-code header="src/app/name-editor/name-editor.component.html (값 업데이트)" path="adev/src/content/examples/reactive-forms/src/app/name-editor/name-editor.component.html" visibleRegion="update-value"/>

폼 모델은 제어의 진실한 원천이므로 버튼을 클릭하면 입력의 값이 컴포넌트 클래스 내에서 변경되어 현재 값을 재정의합니다.

HELPFUL: 이 예제에서는 단일 제어를 사용하고 있습니다. [폼 그룹](#grouping-form-controls) 또는 [폼 배열](#creating-dynamic-forms) 인스턴스를 사용하여 `setValue()` 메서드를 사용할 때 값은 그룹 또는 배열 구조와 일치해야 합니다.

## 폼 제어 그룹화

폼에는 일반적으로 여러 관련 제어가 포함됩니다. 반응형 폼은 여러 관련 제어를 단일 입력 폼으로 그룹화하는 두 가지 방법을 제공합니다.

| 폼 그룹 | 세부 정보 |
|:---         |:---     |
| 폼 그룹  | 함께 관리할 수 있는 고정된 제어 세트를 정의합니다. 폼 그룹의 기본 사항은 이 섹션에서 논의됩니다. 또한 [중첩된 폼 그룹 생성하기](#creating-nested-form-groups "중첩된 그룹에 대해 자세히 알아보기")와 같은 더 복잡한 폼을 만들기 위해 폼 그룹을 중첩할 수 있습니다.      |
| 폼 배열  | 런타임에 제어를 추가 및 제거할 수 있는 동적 폼을 정의합니다. 더 복잡한 폼을 만들기 위해 폼 배열도 중첩할 수 있습니다. 이 옵션에 대한 자세한 내용은 [동적 폼 만들기](#creating-dynamic-forms)를 참조하세요. |

폼 제어 인스턴스는 단일 입력 필드에 대한 제어를 제공하는 것처럼, 폼 그룹 인스턴스는 폼 제어 인스턴스 그룹의 폼 상태를 추적합니다(예: 폼). 폼 그룹 인스턴스의 각 제어는 폼 그룹을 생성할 때 이름으로 추적됩니다. 다음 예제는 단일 그룹에서 여러 폼 제어 인스턴스를 관리하는 방법을 보여줍니다.

`ProfileEditor` 컴포넌트를 생성하고 `@angular/forms` 패키지에서 `FormGroup` 및 `FormControl` 클래스를 가져옵니다.

<docs-code language="shell">
ng generate component ProfileEditor
</docs-code>

<docs-code header="src/app/profile-editor/profile-editor.component.ts (가져오기)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.1.ts" visibleRegion="imports"/>

이 컴포넌트에 폼 그룹을 추가하려면 다음 단계를 따릅니다.

1. `FormGroup` 인스턴스를 생성합니다.
2. `FormGroup` 모델과 뷰를 연결합니다.
3. 폼 데이터를 저장합니다.

<docs-workflow>

<docs-step title="FormGroup 인스턴스 생성하기">
컴포넌트 클래스에 `profileForm`이라는 속성을 생성하고 이를 새로운 폼 그룹 인스턴스로 설정합니다. 폼 그룹을 초기화하려면 생성자에 제어에 매핑된 명명 키를 포함하는 개체를 제공합니다.

프로필 폼에 `firstName` 및 `lastName`이라는 이름을 가진 두 개의 폼 제어 인스턴스를 추가합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (폼 그룹)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.1.ts" visibleRegion="formgroup"/>

이제 개별 폼 제어가 그룹 내에서 수집됩니다. `FormGroup` 인스턴스는 그룹 내 각 제어의 값을 줄여서 얻은 객체로서 모델 값을 제공합니다. 폼 그룹 인스턴스는 폼 제어 인스턴스와 동일한 속성(`value` 및 `untouched` 등)과 메서드(`setValue()` 등)를 가집니다.
</docs-step>

<docs-step title="FormGroup 모델과 뷰 연결하기">
폼 그룹은 각 제어의 상태 및 변경을 추적하므로 제어 중 하나가 변경되면 상위 제어도 새로운 상태 또는 값 변경을 방출합니다. 그룹의 모델은 구성원으로부터 유지됩니다. 모델을 정의한 후, 이는 뷰에서 모델을 반영하도록 템플릿을 업데이트해야 합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.html (템플릿 폼 그룹)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.1.html" visibleRegion="formgroup"/>

폼 그룹은 제어 그룹을 포함하는 것처럼, *profileForm* `FormGroup`은 `FormGroup` 지시문을 통해 `form` 요소에 바인딩되어 모델과 입력을 포함하는 폼 간의 통신 계층을 생성합니다. `formControlName` 입력은 `FormControlName` 지시문에 의해 제공되며 각 개별 입력을 `FormGroup`에 정의된 폼 제어에 바인딩합니다. 폼 제어는 각 요소와 통신하며 또한 폼 그룹 인스턴스에 변화를 전달하여 모델 값의 진실한 원천을 제공합니다.
</docs-step>

<docs-step title="폼 데이터 저장하기">
`ProfileEditor` 컴포넌트는 사용자로부터 입력을 받지만 실제 시나리오에서는 폼 값을 캡처하고 이를 컴포넌트 외부의 추가 처리에 사용할 수 있도록 해야 합니다. `FormGroup` 지시문은 `form` 요소에서 방출되는 `submit` 이벤트를 듣고 이를 콜백 함수에 바인딩할 수 있는 `ngSubmit` 이벤트를 방출합니다. `form` 태그에 `onSubmit()` 콜백 메서드로 `ngSubmit` 이벤트 리스너를 추가합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.html (제출 이벤트)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.html" visibleRegion="ng-submit"/>

`ProfileEditor` 컴포넌트의 `onSubmit()` 메서드는 현재 `profileForm`의 값을 캡처합니다. `EventEmitter`를 사용하여 폼을 캡슐화하고 폼 값을 컴포넌트 외부로 제공할 수 있습니다. 다음 예제는 `console.warn`을 사용하여 브라우저 콘솔에 메시지를 기록합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (제출 메서드)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.ts" visibleRegion="on-submit"/>

`submit` 이벤트는 기본 DOM 이벤트를 사용하여 `form` 태그에서 방출됩니다. `submit` 유형의 버튼을 클릭하여 이벤트를 트리거합니다. 이를 통해 사용자가 **Enter** 키를 눌러 완료된 폼을 제출할 수 있습니다.

폼 제출을 트리거하기 위해 폼 하단에 버튼을 추가하십시오.

<docs-code header="src/app/profile-editor/profile-editor.component.html (제출 버튼)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.html" visibleRegion="submit-button"/>

앞의 코드 조각에서 버튼은 `profileForm`이 유효하지 않을 때 버튼을 비활성화하는 `disabled` 바인딩이 추가되어 있습니다. 아직 유효성을 검사하고 있지 않으므로 버튼은 항상 활성화되어 있습니다. 기본 폼 유효성 검사는 [폼 입력 검증](#validating-form-input) 섹션에서 다루고 있습니다.
</docs-step>

<docs-step title="컴포넌트 표시하기">
폼을 포함하는 `ProfileEditor` 컴포넌트를 표시하기 위해 이를 컴포넌트 템플릿에 추가합니다.

<docs-code header="src/app/app.component.html (프로필 편집기)" path="adev/src/content/examples/reactive-forms/src/app/app.component.1.html" visibleRegion="app-profile-editor"/>

`ProfileEditor`는 폼 그룹 인스턴스 내에서 `firstName` 및 `lastName` 제어에 대한 폼 제어 인스턴스를 관리할 수 있도록 합니다.

### 중첩 폼 그룹 생성하기

폼 그룹은 개별 폼 제어 인스턴스와 다른 폼 그룹 인스턴스를 자식으로 수용할 수 있습니다. 이를 통해 복잡한 폼 모델을 보다 쉽게 유지 관리하고 논리적으로 그룹화할 수 있습니다.

복잡한 폼을 구축할 때 다양한 정보 영역을 더 작은 섹션으로 관리하는 것이 더 쉽습니다. 중첩된 폼 그룹 인스턴스를 사용하면 큰 폼 그룹을 더 작고 관리 가능한 그룹으로 나눌 수 있습니다.

더 복잡한 폼을 만들려면 다음 단계를 따릅니다.

1. 중첩 그룹을 생성합니다.
2. 템플릿에서 중첩 폼 그룹을 그룹화합니다.

정보의 일부 유형은 자연스럽게 동일한 그룹에 포함됩니다. 이름과 주소는 전형적인 중첩 그룹의 예이며 다음 예제에서 사용됩니다.

<docs-workflow>
<docs-step title="중첩 그룹 생성하기">
`profileForm`에서 중첩 그룹을 생성하려면 폼 그룹 인스턴스에 중첩된 `address` 요소를 추가합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (중첩 폼 그룹)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.1.ts" visibleRegion="nested-formgroup"/>

이 예제에서 `address group`은 현재 `firstName` 및 `lastName` 제어를 새로운 `street`, `city`, `state` 및 `zip` 제어와 결합합니다. 폼 그룹의 `address` 요소는 전체 `profileForm` 요소의 자식이지만, 값과 상태 변경에 대한 동일한 규칙이 적용됩니다. 중첩 폼 그룹의 상태 및 값 변경 사항은 부모 폼 그룹으로 전파되어 전체 모델과 일관성을 유지합니다.
</docs-step>

<docs-step title="템플릿에서 중첩 폼 그룹 그룹화하기">
컴포넌트 클래스에서 모델을 업데이트한 후 템플릿을 업데이트하여 폼 그룹 인스턴스 및 입력 요소를 연결합니다. `street`, `city`, `state` 및 `zip` 필드를 포함하는 `address` 폼 그룹을 `ProfileEditor` 템플릿에 추가합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.html (템플릿 중첩 폼 그룹)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.1.html" visibleRegion="formgroupname"/>

`ProfileEditor` 폼은 하나의 그룹으로 표시되지만, 모델은 논리적 그룹 영역을 나타내기 위해 더 세분화됩니다.

폼 그룹 인스턴스의 값을 컴포넌트 템플릿에서 `value` 속성과 `JsonPipe`를 사용하여 표시합니다.
</docs-step>
</docs-workflow>

### 데이터 모델의 일부 업데이트하기

여러 제어가 포함된 폼 그룹 인스턴스의 값을 업데이트할 때 모델의 일부만 업데이트하려고 할 수 있습니다. 이 섹션에서는 특정 폼 제어 데이터 모델의 일부를 업데이트하는 방법을 다룹니다.

모델 값을 업데이트하는 방법은 두 가지가 있습니다:

| 메서드        | 세부 정보 |
|:---            |:---     |
| `setValue()`   | 개별 제어에 대한 새 값을 설정합니다. `setValue()` 메서드는 폼 그룹의 구조를 엄격히 준수하며, 제어의 전체 값을 대체합니다. |
| `patchValue()` | 폼 모델에서 변경된 객체의 속성만 교체합니다.                                                                                     |

`setValue()` 메서드의 엄격한 검사는 복잡한 폼에서 중첩 오류를 포착하는 데 도움이 되며, `patchValue()`는 이러한 오류에 대해 조용히 실패합니다.

`ProfileEditorComponent`에서 다음 예제를 사용하여 사용자에 대한 이름과 거리 주소를 업데이트하는 `updateProfile` 메서드를 사용하세요.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (patch value)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.1.ts" visibleRegion="patch-value"/>

필요에 따라 사용자 프로필을 업데이트하는 버튼을 템플릿에 추가하여 업데이트를 시뮬레이션합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.html (값 업데이트)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.1.html" visibleRegion="patch-value"/>

사용자가 버튼을 클릭하면 `profileForm` 모델이 `firstName` 및 `street`의 새 값으로 업데이트됩니다. `street`는 `address` 속성 내 객체에 제공됩니다. 이는 `patchValue()` 메서드가 모델 구조에 대해 업데이트를 적용하기 때문에 필요합니다. `PatchValue()`는 폼 모델이 정의한 속성만 업데이트합니다.

## FormBuilder 서비스를 사용하여 제어 생성하기

여러 폼을 처리할 때 수동으로 폼 제어 인스턴스를 생성하는 것은 반복적일 수 있습니다. `FormBuilder` 서비스는 제어 생성을 위한 편리한 메서드를 제공합니다.

이 서비스를 활용하기 위해 다음 단계를 진행합니다.

1. `FormBuilder` 클래스를 가져옵니다.
2. `FormBuilder` 서비스를 주입합니다.
3. 폼 내용을 생성합니다.

다음 예제에서는 폼 빌더 서비스를 사용하여 `ProfileEditor` 컴포넌트를 리팩토링하여 폼 제어 및 폼 그룹 인스턴스를 생성하는 방법을 보여줍니다.

<docs-workflow>
<docs-step title="FormBuilder 클래스 가져오기">
`@angular/forms` 패키지에서 `FormBuilder` 클래스를 가져오세요.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (가져오기)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.2.ts" visibleRegion="form-builder-imports"/>

</docs-step>

<docs-step title="FormBuilder 서비스 주입하기">
`FormBuilder` 서비스는 반응형 폼 모듈의 주입 가능한 프로바이더입니다. `inject()` 함수를 사용하여 이 종속성을 컴포넌트에 주입합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (생성자)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.2.ts" visibleRegion="inject-form-builder"/>

</docs-step>
<docs-step title="폼 제어 생성하기">
`FormBuilder` 서비스에는 `control()`, `group()`, `array()`의 세 가지 방법이 있습니다. 이들은 컴포넌트 클래스에서 폼 제어, 폼 그룹 및 폼 배열 인스턴스를 생성하기 위한 팩토리 메서드입니다. `group` 메서드를 사용하여 `profileForm` 제어를 생성합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (폼 빌더)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.2.ts" visibleRegion="form-builder"/>

앞의 예제에서는 동일한 개체를 `group()` 메서드와 함께 사용하여 모델의 속성을 정의합니다. 각 제어 이름에 대한 값은 배열의 첫 번째 항목으로서 초기 값을 포함하는 배열입니다.

팁: 초기 값만으로 제어를 정의할 수 있지만, 제어에 동기 또는 비동기 유효성이 필요하다면 배열의 두 번째 및 세 번째 항목으로 동기 및 비동기 검증기를 추가하세요. 폼 빌더를 사용하여 인스턴스를 수동으로 생성하는 것과 비교하십시오.

  <docs-code-multifile>
    <docs-code header="src/app/profile-editor/profile-editor.component.ts (인스턴스)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.1.ts" visibleRegion="formgroup-compare"/>
    <docs-code header="src/app/profile-editor/profile-editor.component.ts (폼 빌더)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.2.ts" visibleRegion="formgroup-compare"/>
  </docs-code-multifile>
</docs-step>

</docs-workflow>

## 폼 입력 검증하기

*폼 유효성 검증*은 사용자 입력이 완료되고 올바른지 확인하는 데 사용됩니다. 이 섹션에서는 폼 제어에 단일 검증기를 추가하고 전체 폼 상태를 표시하는 방법을 다룹니다. 폼 유효성 검증은 [폼 유효성 검증](guide/forms/form-validation) 가이드에서 더 자세히 다루어집니다.

폼 유효성 검증을 추가하려면 다음 단계를 진행합니다.

1. 폼 구성 요소에서 검증기 함수를 가져옵니다.
2. 필드에 검증기를 추가합니다.
3. 검증 상태를 처리할 논리를 추가합니다.

가장 일반적인 유효성 검증은 필드를 필수로 만드는 것입니다. 다음 예제에서는 `firstName` 제어에 필수 유효성 검사를 추가하고 유효성 검사 결과를 표시하는 방법을 보여줍니다.

<docs-workflow>
<docs-step title="검증기 함수 가져오기">
반응형 폼에는 일반적인 사용 사례를 위한 검증기 함수 세트가 포함됩니다. 이 함수는 검증할 제어를 받아들이고 유효성 검사 확인에 따라 오류 객체 또는 null 값을 반환합니다.

`@angular/forms` 패키지에서 `Validators` 클래스를 가져옵니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (가져오기)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.ts" visibleRegion="validator-imports"/>
</docs-step>

<docs-step title="필드를 필수로 만들기">
`ProfileEditor` 컴포넌트에서 `firstName` 제어의 배열의 두 번째 항목으로 `Validators.required` 정적 메서드를 추가합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (필수 검증기)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.ts" visibleRegion="required-validator"/>
</docs-step>

<docs-step title="폼 상태 표시하기">
폼 제어에 필수 필드를 추가하면 초기 상태가 유효하지 않게 됩니다. 이 유효하지 않은 상태는 상위 폼 그룹 요소에 전파되어 상태를 유효하지 않게 만듭니다. 폼 그룹 인스턴스의 현재 상태를 `status` 속성을 통해 접근할 수 있습니다.

보간법을 사용하여 `profileForm`의 현재 상태를 표시합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.html (상태 표시)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.html" visibleRegion="display-status"/>

**제출** 버튼은 `firstName` 폼 제어가 필수로 인해 `profileForm`이 유효하지 않으므로 비활성화됩니다. `firstName` 입력을 작성하면 폼이 유효해지고 **제출** 버튼이 활성화됩니다.

폼 유효성 검증에 대해 더 알아보려면 [폼 유효성 검증](guide/forms/form-validation) 가이드를 방문하세요.
</docs-step>
</docs-workflow>

## 동적 폼 생성하기

`FormArray`는 이름이 없는 여러 제어를 관리하기 위해 `FormGroup`의 대안입니다. 폼 그룹 인스턴스와 마찬가지로, 폼 배열 인스턴스에서 제어를 동적으로 삽입하고 제거할 수 있으며, 폼 배열 인스턴스의 값과 유효성 상태는 자식 제어에서 계산됩니다. 그러나 각 제어의 이름별로 키를 정의할 필요가 없으므로 자식 값의 수를 미리 알지 못할 때 좋은 옵션입니다.

동적 폼을 정의하려면 다음 단계를 따릅니다.

1. `FormArray` 클래스를 가져옵니다.
2. `FormArray` 제어를 정의합니다.
3. getter 메서드를 사용하여 `FormArray` 제어에 접근합니다.
4. 템플릿에서 폼 배열을 표시합니다.

다음 예제에서는 `ProfileEditor`에서 *별칭* 배열을 관리하는 방법을 보여줍니다.

<docs-workflow>
<docs-step title="`FormArray` 클래스 가져오기">
`@angular/forms`에서 `FormArray` 클래스를 가져와 타입 정보를 사용할 수 있도록 합니다. `FormBuilder` 서비스는 `FormArray` 인스턴스를 생성할 준비가 되어 있습니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (가져오기)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.2.ts" visibleRegion="form-array-imports"/>
</docs-step>

<docs-step title="`FormArray` 제어 정의하기">
폼 배열은 0개에서 여러 개의 제어를 정의하여 초기화할 수 있습니다. `profileForm`의 폼 그룹 인스턴스에 `aliases` 속성을 추가하여 폼 배열을 정의합니다.

`FormBuilder.array()` 메서드를 사용하여 배열을 정의하고, `FormBuilder.control()` 메서드를 사용하여 배열을 초기 제어로 채웁니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (별칭 폼 배열)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.ts" visibleRegion="aliases"/>

폼 그룹 인스턴스의 별칭 제어는 이제 더 많은 제어가 동적으로 추가될 때까지 단일 제어로 채워집니다.
</docs-step>

<docs-step title="`FormArray` 제어에 접근하기">
getter는 별칭 폼 배열 인스턴스에서 접근성을 제공하여 각 인스턴스에 대해 `profileForm.get()` 메서드를 반복적으로 사용하는 것보다 편리합니다. 폼 배열 인스턴스는 배열의 명명이 없는 제어를 나타냅니다. getter를 통해 제어에 접근하는 것이 편리하며, 추가 제어를 위해 반복하기도 간단합니다. <br />

getter 구문을 사용하여 부모 폼 그룹에서 별칭의 폼 배열 제어를 검색하는 `aliases` 클래스 속성을 생성합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (별칭 getter)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.ts" visibleRegion="aliases-getter"/>

반환된 제어는 `AbstractControl` 유형이므로 메서드 구문에 접근하기 위해 명시적 유형을 제공해야 합니다. 별칭의 폼 배열에 동적으로 별칭 제어를 삽입하는 메서드를 정의합니다. `FormArray.push()` 메서드는 배열에 새 항목으로 제어를 삽입합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.ts (별칭 추가)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.ts" visibleRegion="add-alias"/>

템플릿에서는 각 제어가 개별 입력 필드로 표시됩니다.

</docs-step>

<docs-step title="템플릿에서 폼 배열 표시하기">

폼 모델에서 별칭을 연결하려면 템플릿에 추가해야 합니다. `FormGroupNameDirective`에 의해 제공된 `formGroupName` 입력과 유사하게 `formArrayName`은 폼 배열 인스턴스와 템플릿 간의 통신을 `FormArrayNameDirective`를 통해 바인딩합니다.

`formGroupName` 요소의 `<div>` 닫는 태그 다음에 다음 템플릿 HTML을 추가합니다.

<docs-code header="src/app/profile-editor/profile-editor.component.html (별칭 폼 배열 템플릿)" path="adev/src/content/examples/reactive-forms/src/app/profile-editor/profile-editor.component.html" visibleRegion="formarrayname"/>

`*ngFor` 지시문은 별칭 폼 배열 인스턴스에서 제공된 각 폼 제어 인스턴스를 반복합니다. 폼 배열 요소는 이름이 없으므로 인덱스를 `i` 변수에 할당하고 각 제어에 전달하여 `formControlName` 입력에 바인딩합니다.

각 새 별칭 인스턴스가 추가될 때마다 인덱스를 기반으로 새 폼 배열 인스턴스가 제공되며, 이를 통해 루트 제어의 상태 및 값을 계산할 때 각 개별 제어를 추적할 수 있습니다.

</docs-step>

<docs-step title="별칭 추가하기">

처음에 폼은 하나의 `Alias` 필드를 포함합니다. 다른 필드를 추가하려면 **Add Alias** 버튼을 클릭하십시오. 또한 템플릿 하단에 `Form Value`로 표시된 폼 모델에서 보고된 별칭 배열을 검증할 수 있습니다. 각 별칭에 대해 폼 제어 인스턴스가 아닌, 추가 필드가 있는 또 다른 폼 그룹 인스턴스를 구성할 수 있습니다. 각 항목에 대한 제어를 정의하는 프로세스는 동일합니다.
</docs-step>

</docs-workflow>

## 반응형 폼 API 요약

다음 표는 반응형 폼 제어를 생성하고 관리하는 데 사용되는 기본 클래스와 서비스를 나열합니다. 전체 구문 세부정보는 [Forms 패키지](api#forms "API 참조")에 대한 API 참조 문서를 참조하십시오.

### 클래스

| 클래스             | 세부 정보 |
|:---               |:---     |
| `AbstractControl` | 구체적인 폼 제어 클래스인 `FormControl`, `FormGroup`, 및 `FormArray`의 추상 기본 클래스입니다. 이 클래스는 공통 동작과 속성을 제공합니다.                           |
| `FormControl`     | 개별 폼 제어의 값과 유효성 상태를 관리합니다. 이는 `<input>` 또는 `<select>`와 같은 HTML 폼 제어에 해당합니다.                                            |
| `FormGroup`       | `AbstractControl` 인스턴스 그룹의 값과 유효성 상태를 관리합니다. 그룹의 속성은 자식 제어를 포함합니다. 컴포넌트의 최상위 폼은 `FormGroup`입니다. |
| `FormArray`       | 숫자 인덱스 배열의 `AbstractControl` 인스턴스의 값과 유효성 상태를 관리합니다.                                                                                     |
| `FormBuilder`     | 제어 인스턴스를 생성하기 위한 팩토리 메서드를 제공하는 주입 가능한 서비스입니다.                                                                                                     |
| `FormRecord`      | 각 제어 인스턴스의 값과 유효성 상태를 추적하며, 모든 인스턴스는 동일한 값 유형을 가집니다.                                                                  |

### 지시문

| 지시문              | 세부 정보 |
|:---                    |:---     |
| `FormControlDirective` | 독립형 `FormControl` 인스턴스를 폼 제어 요소와 동기화합니다.                       |
| `FormControlName`      | 기존 `FormGroup` 인스턴스의 `FormControl`을 이름으로 폼 제어 요소와 동기화합니다. |
| `FormGroupDirective`   | 기존 `FormGroup` 인스턴스를 DOM 요소와 동기화합니다.                                   |
| `FormGroupName`        | 중첩된 `FormGroup` 인스턴스를 DOM 요소와 동기화합니다.                                      |
| `FormArrayName`        | 중첩된 `FormArray` 인스턴스를 DOM 요소와 동기화합니다.                                      |