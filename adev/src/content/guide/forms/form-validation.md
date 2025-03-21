# 폼 입력 유효성 검사

사용자 입력의 정확성과 완전성을 검증하여 전체 데이터 품질을 향상시킬 수 있습니다. 이 페이지에서는 UI에서 사용자 입력을 검증하고 유용한 유효성 검사 메시지를 표시하는 방법을 다룹니다. 리액티브 양식과 템플릿 기반 양식 모두에서 설명합니다.

## 템플릿 기반 양식에서의 입력 유효성 검사

템플릿 기반 양식에 유효성 검사를 추가하려면 [네이티브 HTML 폼 유효성 검사](https://developer.mozilla.org/docs/Web/Guide/HTML/HTML5/Constraint_validation)와 동일한 유효성 검사 속성을 추가합니다. Angular는 이러한 속성을 프레임워크의 검증기 함수와 연결하는 지시어를 사용합니다.

폼 컨트롤의 값이 변경될 때마다, Angular는 유효성 검사를 수행하고 `INVALID` 상태를 초래하는 유효성 검사 오류 목록이나 `null`을 생성합니다. 후자는 VALID 상태를 나타냅니다.

그런 다음 `ngModel`을 지역 템플릿 변수로 내보내어 컨트롤의 상태를 검사할 수 있습니다. 다음 예제에서는 `NgModel`을 `name`이라는 변수가 있는 지역 변수로 내보냅니다:

<docs-code header="template/actor-form-template.component.html (name)" path="adev/src/content/examples/form-validation/src/app/template/actor-form-template.component.html" visibleRegion="name-with-error-msg"/>

다음은 예제가 설명하는 몇 가지 기능입니다.

* `<input>` 요소는 HTML 유효성 검사 속성인 `required`와 `minlength`를 가지고 있습니다. 또한 사용자 정의 검증기 지시어인 `forbiddenName`도 포함되어 있습니다. 자세한 내용은 [사용자 정의 검증기](#defining-custom-validators) 섹션을 참조하십시오.

* `#name="ngModel"`은 `NgModel`을 `name`이라는 지역 변수로 내보냅니다. `NgModel`은 기본 `FormControl` 인스턴스의 많은 속성을 반영하므로, 템플릿에서 `valid` 및 `dirty`와 같은 컨트롤 상태를 체크하는 데 사용할 수 있습니다. 모든 컨트롤 속성의 전체 목록은 [AbstractControl](api/forms/AbstractControl) API 참조를 참조하십시오.

* `<div>` 요소의 `*ngIf`는 `name`이 유효하지 않고 컨트롤이 `dirty` 또는 `touched`인 경우에만 중첩 메시지 `div` 세트를 나타냅니다.

* 각 중첩 `<div>`는 가능한 유효성 검사 오류 중 하나를 위한 사용자 지정 메시지를 표시할 수 있습니다. `required`, `minlength` 및 `forbiddenName`에 대한 메시지가 있습니다.

도움말: 유효성 검사기가 사용자가 양식을 수정할 기회를 갖기 전에 오류를 표시하지 않도록 하려면 컨트롤의 `dirty` 또는 `touched` 상태를 확인해야 합니다.

* 사용자가 관찰된 필드의 값을 변경하면, 해당 컨트롤은 "dirty"로 표시됩니다. 
* 사용자가 폼 컨트롤 요소에서 포커스를 잃으면, 해당 컨트롤은 "touched"로 표시됩니다.

## 리액티브 양식에서의 입력 유효성 검사

리액티브 양식에서는 소스 오브 트루스가 컴포넌트 클래스입니다. 템플릿의 속성을 통해 검증기를 추가하는 대신, 컴포넌트 클래스의 폼 컨트롤 모델에 직접 검증기 함수를 추가합니다. Angular는 컨트롤의 값이 변경될 때마다 이러한 함수를 호출합니다.

### 검증기 함수

검증기 함수는 동기 또는 비동기일 수 있습니다.

| 검증기 타입     | 세부 사항 |
|:---              |:---     |
| 동기 검증기      | 컨트롤 인스턴스를 받아들이고 즉시 유효성 검사 오류 집합 또는 `null`을 반환하는 동기 함수입니다. `FormControl`을 인스턴스화할 때 두 번째 인수로 전달합니다.                       |
| 비동기 검증기   | 컨트롤 인스턴스를 받아들이고 나중에 유효성 검사 오류 집합 또는 `null`을 방출하는 Promise 또는 Observable을 반환하는 비동기 함수입니다. `FormControl`을 인스턴스화할 때 세 번째 인수로 전달합니다. |

성능상의 이유로 Angular는 모든 동기 검증기가 통과될 때만 비동기 검증기를 실행합니다. 각 검증기는 오류가 설정되기 전에 완료되어야 합니다.

### 내장 검증기 함수

[자체 검증기 함수를 작성](#defining-custom-validators)할 수도 있지만, Angular의 일부 내장 검증기를 사용할 수도 있습니다.

템플릿 기반 양식에서 속성으로 사용할 수 있는 `required`와 `minlength`와 같은 모든 내장 검증기를 `Validators` 클래스로부터 함수 형태로 사용할 수 있습니다. 내장 검증기의 전체 목록은 [Validators](api/forms/Validators) API 참조를 참조하십시오.

배우 양식을 리액티브 양식으로 업데이트하기 위해, 이전 예제와 마찬가지로 일부 내장 검증기를 사용합니다. 이번에는 함수를 통해 사용합니다.

<docs-code header="reactive/actor-form-reactive.component.ts (validator functions)" path="adev/src/content/examples/form-validation/src/app/reactive/actor-form-reactive.component.1.ts" visibleRegion="form-group"/>

이 예제에서 `name` 컨트롤은 두 가지 내장 검증기 — `Validators.required` 및 `Validators.minLength(4)` — 과 하나의 사용자 정의 검증기인 `forbiddenNameValidator`를 설정합니다.

이러한 검증기는 모두 동기적이므로 두 번째 인수로 전달됩니다. 함수들을 배열로 전달하여 여러 개의 검증기를 지원할 수 있음을 주목하십시오.

이 예제는 몇 개의 getter 메서드도 추가합니다. 리액티브 양식에서는 항상 상위 그룹의 `get` 메서드를 통해 어떤 폼 컨트롤에도 접근할 수 있지만, 때때로 템플릿을 위한 약식으로 getter를 정의하는 것이 유용할 수 있습니다.

다시 `name` 입력의 템플릿을 살펴보면, 템플릿 기반 예제와 상당히 유사합니다.

<docs-code header="reactive/actor-form-reactive.component.html (name with error msg)" path="adev/src/content/examples/form-validation/src/app/reactive/actor-form-reactive.component.html" visibleRegion="name-with-error-msg"/>

이 양식은 이제 더 이상 어떤 지시어도 내보내지 않으며, 대신 컴포넌트 클래스에서 정의된 `name` getter를 사용합니다.

템플릿에 여전히 `required` 속성이 존재하는 것을 주목하십시오. 유효성을 검사하는 데 꼭 필요하지는 않지만 접근성을 위해 유지해야 합니다.

## 사용자 정의 검증기 정의

내장 검증기가 항상 애플리케이션의 정확한 사용 사례와 일치하는 것은 아니므로, 때때로 사용자 정의 검증기를 만들어야 합니다.

이전 예제에 있는 `forbiddenNameValidator` 함수를 고려하십시오. 다음은 해당 함수의 정의 예시입니다.

<docs-code header="shared/forbidden-name.directive.ts (forbiddenNameValidator)" path="adev/src/content/examples/form-validation/src/app/shared/forbidden-name.directive.ts" visibleRegion="custom-validator"/>

이 함수는 특정 금지된 이름을 감지하는 정규 표현식을 받아들이고 유효성 검사기 함수를 반환하는 팩토리입니다.

이 샘플에서는 금지된 이름이 "bob"이므로, 검증기는 "bob"을 포함한 어떤 배우 이름도 거부합니다. 다른 곳에서는 "alice" 또는 구성하는 정규 표현식과 일치하는 이름을 거부할 수 있습니다.

`forbiddenNameValidator` 팩토리는 구성된 검증기 함수를 반환합니다. 해당 함수는 Angular 제어 객체를 받아들이고, 제어 값이 유효하면 *null*을 반환하거나 유효성 검사 오류 객체를 반환합니다. 유효성 검사 오류 객체는 일반적으로 이름이 `'forbiddenName'`인 속성과 Error 메시지에 삽입할 수 있는 임의의 값 사전 `{name}`을 포함합니다.

비동기 사용자 정의 검증기는 동기 검증기와 유사하지만, 반드시 나중에 null 또는 유효성 검사 오류 객체를 방출하는 Promise 또는 Observable을 반환해야 합니다. Observable의 경우, observable은 완료되어야 하며, 이 시점에서 양식은 유효성을 검증하는 데 마지막으로 방출된 값을 사용합니다.

### 리액티브 양식에 사용자 정의 검증기 추가

리액티브 양식에서 사용자 정의 검증기를 추가하려면 함수 자체를 `FormControl`에 전달하여 추가합니다.

<docs-code header="reactive/actor-form-reactive.component.ts (validator functions)" path="adev/src/content/examples/form-validation/src/app/reactive/actor-form-reactive.component.1.ts" visibleRegion="custom-validator"/>

### 템플릿 기반 양식에 사용자 정의 검증기 추가

템플릿 기반 양식에서는 템플릿에 디렉티브를 추가하는 방식으로 검증기 함수를 래핑하는 디렉티브를 추가합니다. 예를 들어, 해당 `ForbiddenValidatorDirective`는 `forbiddenNameValidator`를 감싸는 역할을 합니다.

Angular는 지시어가 유효성 검사 과정에서 역할을 인식한다. 왜냐하면 해당 지시어는 `NG_VALIDATORS` 제공자에 등록되기 때문입니다. 다음 예시를 참조하십시오. `NG_VALIDATORS`는 확장 가능한 검증기 모음을 가진 사전 정의된 제공자입니다.

<docs-code header="shared/forbidden-name.directive.ts (providers)" path="adev/src/content/examples/form-validation/src/app/shared/forbidden-name.directive.ts" visibleRegion="directive-providers"/>

그 다음, 지시어 클래스는 `Validator` 인터페이스를 구현하여 Angular 양식과 쉽게 통합할 수 있도록 합니다. 여기에는 전체 지시어의 나머지 부분이 포함되어 있어 어떻게 모든 것이 통합되는지 이해하는 데 도움이 됩니다.

<docs-code header="shared/forbidden-name.directive.ts (directive)" path="adev/src/content/examples/form-validation/src/app/shared/forbidden-name.directive.ts" visibleRegion="directive"/>

`ForbiddenValidatorDirective`가 준비되면, `appForbiddenName` 선택자를 모든 입력 요소에 추가하여 활성화할 수 있습니다. 예를 들면:

<docs-code header="template/actor-form-template.component.html (forbidden-name-input)" path="adev/src/content/examples/form-validation/src/app/template/actor-form-template.component.html" visibleRegion="name-input"/>

도움말: 사용자 정의 유효성 검사 지시어는 `useExisting`이 아닌 `useClass`로 인스턴스화된다는 점에 유의하십시오. 등록된 검증기는 `forbiddenName` 속성이 "bob"에 바인딩된 `ForbiddenValidatorDirective`의 *이 인스턴스*이어야 합니다.

`useExisting`을 `useClass`로 교체하면, 새 클래스 인스턴스를 등록하게 되며, 이는 `forbiddenName`이 없을 것입니다.

## 제어 상태 CSS 클래스

Angular는 많은 제어 속성을 양식 컨트롤 요소에 CSS 클래스로 자동으로 반영합니다. 이러한 클래스를 사용하여 양식 컨트롤 요소의 상태에 따라 스타일을 지정합니다. 현재 지원되는 클래스는 다음과 같습니다.

* `.ng-valid`
* `.ng-invalid`
* `.ng-pending`
* `.ng-pristine`
* `.ng-dirty`
* `.ng-untouched`
* `.ng-touched`
* `.ng-submitted` (둘러싼 양식 요소만 해당)

다음 예제에서, 배우 양식은 각 폼 컨트롤의 테두리 색상을 설정하기 위해 `.ng-valid` 및 `.ng-invalid` 클래스를 사용합니다.

<docs-code header="forms.css (status classes)" path="adev/src/content/examples/form-validation/src/assets/forms.css"/>

## 교차 필드 유효성 검사

교차 필드 검증기는 폼 내의 다양한 필드 값을 비교하고 조합하여 수용할지 거부하는[사용자 정의 검증기](#defining-custom-validators "Read about custom validators")입니다. 예를 들어, 사용자가 A 또는 B를 선택할 수는 있지만 둘 다 선택할 수 없는 상호 배타적인 옵션을 제공하는 폼이 있을 수 있습니다. 어떤 필드 값은 다른 값에 따라 달라질 수도 있습니다. 사용자는 A가 선택된 경우에만 B를 선택할 수 있습니다.

다음 교차 유효성 검사 예제에서는 다음을 보여줍니다.

* 두 형제 컨트롤의 값에 따라 리액티브 또는 템플릿 기반 양식 입력을 검증합니다.
* 사용자가 양식과 상호작용했지만 유효성 검사가 실패한 후 설명적인 오류 메시지를 표시합니다.

예제에서는 교차 유효성 검사를 사용하여 배우가 자신들의 역할에서 동일한 이름을 재사용하지 않도록 Actor Form을 작성하는 방법을 보여줍니다. 검증기는 배우 이름과 역할이 일치하지 않는지 확인하여 이를 수행합니다.

### 리액티브 양식에 교차 유효성 검사 추가

폼의 구조는 다음과 같습니다:

<docs-code language="javascript">

const actorForm = new FormGroup({
  'name': new FormControl(),
  'role': new FormControl(),
  'skill': new FormControl()
});

</docs-code>

`name`과 `role`이 형제 컨트롤임을 주목하십시오. 두 컨트롤을 단일 사용자 정의 검증기에서 평가하려면, 공통 조상 컨트롤인 `FormGroup`에서 유효성 검사를 수행해야 합니다. `FormGroup`에서 자식 컨트롤을 쿼리하여 값을 비교할 수 있습니다.

`FormGroup`에 검증기를 추가하려면, 생성 시 두 번째 인수로 새 검증기를 전달하면 됩니다.

<docs-code language="javascript">

const actorForm = new FormGroup({
  'name': new FormControl(),
  'role': new FormControl(),
  'skill': new FormControl()
}, { validators: unambiguousRoleValidator });

</docs-code>

검증기 코드는 다음과 같습니다.

<docs-code header="shared/unambiguous-role.directive.ts" path="adev/src/content/examples/form-validation/src/app/shared/unambiguous-role.directive.ts" visibleRegion="cross-validation-validator"/>

`unambiguousRoleValidator` 검증기는 `ValidatorFn` 인터페이스를 구현합니다. Angular 제어 객체를 인수로 받아들이고, 폼이 유효하면 null을 반환하거나 그렇지 않으면 `ValidationErrors`를 반환합니다.

검증기는 `FormGroup`의 [get](api/forms/AbstractControl#get) 메서드를 호출하여 자식 컨트롤을 검색한 후, `name`과 `role` 컨트롤의 값을 비교합니다.

값이 일치하지 않으면 역할이 명확하며 모두 유효하므로 검증기는 null을 반환합니다. 일치하면 배우의 역할이 모호하며, 검증기는 오류 객체를 반환하여 양식을 비유효로 표시해야 합니다.

더 나은 사용자 경험을 제공하기 위해, 템플릿은 폼이 비유효할 때 적절한 오류 메시지를 표시합니다.

<docs-code header="reactive/actor-form-template.component.html" path="adev/src/content/examples/form-validation/src/app/reactive/actor-form-reactive.component.html" visibleRegion="cross-validation-error-message"/>

이 `*ngIf`는 `FormGroup`이 `unambiguousRoleValidator` 검증기에서 반환된 교차 검증 오류를 가지고 있는 경우에만 오류를 표시합니다. 그러나 이는 사용자가 [양식과 상호작용을 완료한 후](#control-status-css-classes)만 해당됩니다.

### 템플릿 기반 양식에 교차 유효성 검사 추가

템플릿 기반 양식에서는 검증기 함수를 래핑하는 디렉티브를 만들어야 합니다. 해당 디렉티브를 검증기로서 [`NG_VALIDATORS` 토큰](/api/forms/NG_VALIDATORS)를 사용하여 제공합니다. 다음 예를 참고하십시오.

<docs-code header="shared/unambiguous-role.directive.ts" path="adev/src/content/examples/form-validation/src/app/shared/unambiguous-role.directive.ts" visibleRegion="cross-validation-directive"/>

HTML 템플릿에 새 디렉티브를 추가해야 합니다. 검증기는 폼에서 가장 높은 수준에서 등록되어야 하므로, 다음 템플릿은 디렉티브를 `form` 태그에 둡니다.

<docs-code header="template/actor-form-template.component.html" path="adev/src/content/examples/form-validation/src/app/template/actor-form-template.component.html" visibleRegion="cross-validation-register-validator"/>

더 나은 사용자 경험을 제공하기 위해, 양형이 비유효할 때 적절한 오류 메시지가 표시됩니다.

<docs-code header="template/actor-form-template.component.html" path="adev/src/content/examples/form-validation/src/app/template/actor-form-template.component.html" visibleRegion="cross-validation-error-message"/>

이는 템플릿 기반 양식과 리액티브 양식 모두에서 동일합니다.

## 비동기 검증기 생성

비동기 검증기는 `AsyncValidatorFn` 및 `AsyncValidator` 인터페이스를 구현합니다. 이러한 인터페이스는 동기 검증기와 매우 유사하지만 다음과 같은 차이점이 있습니다.

* `validate()` 함수는 Promise 또는 observable을 반환해야 합니다.
* 반환된 observable은 유한해야 하며, 즉 언젠가 완료되어야 합니다. 무한 observable을 유한한 것으로 변환하려면 `first`, `last`, `take` 또는 `takeUntil` 과 같은 필터링 연산자를 통해 observable을 파이프합니다.

비동기 유효성 검사는 동기 유효성 검사 후에 발생하며, 동기 유효성 검사가 성공해야만 수행됩니다. 이 체크는 폼이 기본 유효성 검사 방법이 이미 잘못된 입력을 발견한 경우 잠재적으로 비용이 많이 드는 비동기 유효성 검사 프로세스를 피하도록 합니다.

비동기 유효성 검사가 시작되면 폼 컨트롤은 `pending` 상태에 들어갑니다. 제어의 `pending` 속성을 검사하고 이를 사용하여 진행 중인 유효성 검사 작업에 대한 시각적 피드백을 제공합니다.

일반적인 UI 패턴은 비동기 유효성 검사 중인 동안 스피너를 표시하는 것입니다. 다음 예제는 템플릿 기반 양식에서 이를 어떻게 달성하는지 보여줍니다.

<docs-code language="html">

<input [(ngModel)]="name" #model="ngModel" appSomeAsyncValidator>
<app-spinner *ngIf="model.pending"></app-spinner>

</docs-code>

### 사용자 정의 비동기 검증기 구현

다음 예제에서, 비동기 검증기는 배우가 이미 선택되지 않은 역할로 캐스팅되도록 보장합니다. 새로운 배우는 끊임없이 오디션을 보고 있으며, 오래된 배우는 은퇴하고 있으므로, 사용 가능한 역할 목록을 미리 검색할 수는 없습니다. 잠재적인 역할 입력을 검증하기 위해, 검증기는 현재 캐스팅된 모든 배우의 중앙 데이터베이스를 참고하는 비동기 작업을 시작해야 합니다.

다음 코드는 `AsyncValidator` 인터페이스를 구현하는 검증기 클래스 `UniqueRoleValidator`를 생성합니다.

<docs-code path="adev/src/content/examples/form-validation/src/app/shared/role.directive.ts" visibleRegion="async-validator"/>

생성자는 다음 인터페이스를 정의하는 `ActorsService`를 주입합니다.

<docs-code language="typescript">
interface ActorsService {
  isRoleTaken: (role: string) => Observable<boolean>;
}
</docs-code>

실제 애플리케이션에서 `ActorsService`는 역할의 사용 가능성을 확인하기 위해 배우 데이터베이스에 HTTP 요청을 하는 책임이 있습니다. 검증기 관점에서 볼 때, 서비스의 실제 구현은 중요하지 않으므로 예제는 `ActorsService` 인터페이스에 대해 코딩할 수 있습니다.

유효성 검사가 시작되면, `UnambiguousRoleValidator`는 현재 제어 값을 가지고 `ActorsService`의 `isRoleTaken()` 메서드에 위임합니다. 이 시점에서 제어는 `pending`으로 표시되고, `validate()` 메서드에서 반환된 observable 체인이 완료될 때까지 이 상태를 유지합니다.

`isRoleTaken()` 메서드는 역할의 사용 가능성을 확인하는 HTTP 요청을 전송하고 `Observable<boolean>`을 결과로 반환합니다. `validate()` 메서드는 응답을 `map` 연산자를 통해 파이프하고 이를 유효성 검사 결과로 변환합니다.

그런 다음 메서드는, 어떤 검증기와 마찬가지로, 폼이 유효한 경우 `null`을 반환하고 비유효한 경우 `ValidationErrors`를 반환합니다. 이 검증기는 `catchError` 연산자로 잠재적인 오류를 처리합니다. 이 경우, 검증기는 `isRoleTaken()` 오류를 성공적인 유효성 검사로 처리합니다. 왜냐하면 유효성 검사 요청을 수행하지 못한 것이 반드시 역할이 비유효하다는 것을 의미하지 않기 때문입니다. 오류를 다르게 처리하고 `ValidationError` 객체를 반환할 수 있습니다.

어느 정도 시간이 지나면, observable 체인이 완료되고 비동기 유효성 검사가 완료됩니다. `pending` 플래그는 `false`로 설정되고, 폼 유효성이 업데이트됩니다.

### 리액티브 양식에 비동기 검증기 추가

리액티브 양식에서 비동기 검증기를 사용하려면, 먼저 검증기를 컴포넌트 클래스의 생성자에 주입합니다.

<docs-code path="adev/src/content/examples/form-validation/src/app/reactive/actor-form-reactive.component.2.ts" visibleRegion="async-validator-inject"/>

그런 다음, 검증기 함수를 직접 `FormControl`에 전달하여 적용합니다.

다음 예제에서는 `roleControl`에 `UnambiguousRoleValidator`의 `validate` 함수를 적용합니다. 이를 위해 제어의 `asyncValidators` 옵션에 전달하고, `ActorFormReactiveComponent`에 주입된 `UnambiguousRoleValidator` 인스턴스에 바인딩합니다. `asyncValidators`의 값은 단일 비동기 검증기 함수이거나 함수 배열이 될 수 있습니다. `FormControl` 옵션에 대한 자세한 내용은 [AbstractControlOptions](api/forms/AbstractControlOptions) API 참조를 참조하십시오.

<docs-code path="adev/src/content/examples/form-validation/src/app/reactive/actor-form-reactive.component.2.ts" visibleRegion="async-validator-usage"/>

### 템플릿 기반 양식에 비동기 검증기 추가

템플릿 기반 양식에서 비동기 검증기를 사용하려면 새 디렉티브를 만들고 해당 디렉티브에 `NG_ASYNC_VALIDATORS` 제공자를 등록합니다.

아래 예제에서는 디렉티브가 실제 유효성 검사 로직을 포함하는 `UniqueRoleValidator` 클래스를 주입하고, 유효성 검사가 필요할 때 Angular에 의해 트리거되는 `validate` 함수에서 이를 호출합니다.

<docs-code path="adev/src/content/examples/form-validation/src/app/shared/role.directive.ts" visibleRegion="async-validator-directive"/>

그런 다음, 동기 검증기와 마찬가지로, 입력을 활성화하기 위해 디렉티브의 선택자를 입력에 추가합니다.

<docs-code header="template/actor-form-template.component.html (unique-unambiguous-role-input)" path="adev/src/content/examples/form-validation/src/app/template/actor-form-template.component.html" visibleRegion="role-input"/>

### 비동기 검증기의 성능 최적화

기본적으로 모든 검증기는 폼 값이 변경될 때마다 실행됩니다. 동기 검증기에서는 일반적으로 애플리케이션 성능에 눈에 띄는 영향을 미치지 않습니다. 그러나 비동기 검증기는 일반적으로 확인을 위해 HTTP 요청을 수행합니다. 매번 입력할 때마다 HTTP 요청을 전송하면 백엔드 API에 부하를 줄 수 있으며 가능한 한 피해야 합니다.

`updateOn` 속성을 `change`(기본값)에서 `submit` 또는 `blur`로 변경하여 폼 유효성 업데이트를 지연시킬 수 있습니다.

템플릿 기반 양식의 경우, 템플릿에서 속성을 설정합니다.

<docs-code language="html">
<input [(ngModel)]="name" [ngModelOptions]="{updateOn: 'blur'}">
</docs-code>

리액티브 양식의 경우, `FormControl` 인스턴스에서 속성을 설정합니다.

<docs-code language="typescript">
new FormControl('', {updateOn: 'blur'});
</docs-code>

## 네이티브 HTML 폼 유효성 검사와의 상호작용

기본적으로 Angular는 [네이티브 HTML 폼 유효성 검사](https://developer.mozilla.org/docs/Web/Guide/HTML/Constraint_validation)를 비활성화하여 둘러싼 `<form>`에 `novalidate` 속성을 추가하고, 이러한 속성을 프레임워크의 검증기 함수와 연결하는 지시어를 사용합니다. Angular 기반 유효성 검사와 **결합하여** 네이티브 유효성 검사를 사용하려면, `ngNativeValidate` 지시어를 사용하여 다시 활성화할 수 있습니다. 자세한 내용은 [API 문서](api/forms/NgForm#native-dom-validation-ui)를 참조하십시오.