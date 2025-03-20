# 템플릿 타입 검사

## 템플릿 타입 검사 개요

TypeScript가 코드에서 타입 오류를 잡는 것처럼 Angular는 애플리케이션의 템플릿 내 표현식과 바인딩을 검사하고 발견한 타입 오류를 보고할 수 있습니다.
Angular는 현재 `fullTemplateTypeCheck` 및 `strictTemplates` 플래그의 값에 따라 이 작업을 수행하는 세 가지 모드를 가지고 있습니다. [Angular의 컴파일러 옵션](reference/configs/angular-compiler-options).

### 기본 모드

가장 기본적인 타입 검사 모드에서 `fullTemplateTypeCheck` 플래그가 `false`로 설정된 경우, Angular는 템플릿 내 최상위 표현식만 검증합니다.

`<map [city]="user.address.city">`를 작성하면 컴파일러는 다음을 확인합니다:

* `user`는 컴포넌트 클래스의 속성입니다.
* `user`는 주소 속성을 가진 객체입니다.
* `user.address`는 도시 속성을 가진 객체입니다.

컴파일러는 `user.address.city`의 값이 `<map>` 컴포넌트의 city 입력에 할당 가능한지 여부를 검증하지 않습니다.

또한 이 모드에서 컴파일러는 몇 가지 주요 제한 사항이 있습니다:

* 중요한 점은, `*ngIf`, `*ngFor`, 기타 `<ng-template>` 내장 뷰와 같은 내장 뷰를 체크하지 않습니다.
* `#refs`의 타입, 파이프의 결과, 이벤트 바인딩에서 `$event`의 타입을 파악하지 않습니다.

많은 경우 이러한 것들은 타입 `any`로 남아 결과적으로 표현식의 후속 부분이 체크되지 않을 수 있습니다.

### 전체 모드

`fullTemplateTypeCheck` 플래그가 `true`로 설정된 경우, Angular는 템플릿 내 타입 검사에서 더 적극적입니다.
특히:

* 내장 뷰(`*ngIf` 또는 `*ngFor`내의 것)가 검사됩니다.
* 파이프는 올바른 반환 타입을 가집니다.
* 지시문 및 파이프에 대한 로컬 참조는 올바른 타입을 가집니다(일반 매개변수는 `any`가 됩니다).

다음은 여전히 타입 `any`입니다.

* DOM 요소에 대한 로컬 참조
* `$event` 객체
* 안전 탐색 표현식

중요: `fullTemplateTypeCheck` 플래그는 Angular 13에서 사용 중단되었습니다.
대신 `strictTemplates` 컴파일러 옵션을 사용해야 합니다.

### 엄격 모드

Angular는 `fullTemplateTypeCheck` 플래그의 동작을 유지하며 세 번째 "엄격 모드"를 도입합니다.
엄격 모드는 전체 모드의 상위 집합이며 `strictTemplates` 플래그를 `true`로 설정하여 접근할 수 있습니다.
이 플래그는 `fullTemplateTypeCheck` 플래그를 대체합니다.

전체 모드의 동작 외에도 Angular는 다음과 같은 작업을 수행합니다:

* 컴포넌트/지시문 바인딩이 해당 `@Input()`에 할당 가능함을 검증합니다.
* 이전 모드를 검증할 때 TypeScript의 `strictNullChecks` 플래그를 준수합니다.
* 컴포넌트/지시문의 올바른 타입을 추론하며 일반 매개변수를 포함합니다.
* 구성된 경우 템플릿 컨텍스트 타입을 추론합니다(예: `NgFor`의 올바른 타입 검사 허용).
* 컴포넌트/지시문, DOM 및 애니메이션 이벤트 바인딩에서 `$event`의 올바른 타입을 추론합니다.
* 태그 이름에 따라 DOM 요소에 대한 로컬 참조의 올바른 타입을 추론합니다(예: `document.createElement`가 이 태그에 대해 반환할 타입).

## `*ngFor`의 검사

세 가지 타입 검사 모드는 내장 뷰를 다르게 처리합니다.
다음 예시를 고려하세요.

<docs-code language="typescript" header="사용자 인터페이스">

interface User {
  name: string;
  address: {
    city: string;
    state: string;
  }
}

</docs-code>

<docs-code language="html">

<div *ngFor="let user of users">
  <h2>{{config.title}}</h2>
  <span>도시: {{user.address.city}}</span>
</div>

</docs-code>

`<h2>`와 `<span>`는 `*ngFor` 내장 뷰에 있습니다.
기본 모드에서는 Angular가 둘 다 검증하지 않습니다.
그러나 전체 모드에서는 Angular가 `config`와 `user`가 존재하는지 확인하고 타입을 `any`로 간주합니다.
엄격 모드에서는 Angular가 `<span>`의 `user`가 `User` 타입이며 `address`가 `string` 타입의 `city` 속성을 가진 객체임을 알게 됩니다.

## 템플릿 오류 문제 해결

엄격 모드에서는 이전 두 모드에서 발생하지 않은 템플릿 오류가 발생할 수 있습니다.
이 오류는 종종 이전 도구에서 잡히지 않은 템플릿의 실제 타입 불일치를 나타냅니다.
이 경우 오류 메시지는 템플릿의 어느 부분에서 문제가 발생했는지 명확하게 알려줍니다.

Angular 라이브러리의 타이핑이 불완전하거나 부정확하거나 타이핑이 기대에 부합하지 않는 경우에도 잘못된 긍정이 발생할 수 있습니다. 다음과 같은 경우입니다.

* 라이브러리의 타이핑이 잘못되었거나 불완전한 경우(예: `strictNullChecks`를 염두에 두지 않고 작성된 경우 `null | undefined` 누락).
* 라이브러리의 입력 타입이 너무 좁고 Angular가 이 사실을 파악할 수 있도록 적절한 메타데이터를 추가하지 않은 경우.
    이는 일반적인 불리언 입력을 속성으로 사용할 때, 예를 들어 `<input disabled>`와 같이 비활성화된 경우에 자주 발생합니다.

* DOM 이벤트에 대해 `$event.target`을 사용할 때(이벤트 버블링 가능성 때문에 `$event.target`이 DOM 타이핑에서 기대하는 타입을 가지지 않음).

이와 같은 잘못된 긍정의 경우 몇 가지 옵션이 있습니다:

* 특정 컨텍스트에서 `$any()` 타입 캐스트 함수를 사용하여 표현식의 일부에 대한 타입 검사를 제외합니다.
* 애플리케이션의 TypeScript 구성 파일인 `tsconfig.json`에서 `strictTemplates: false`로 설정하여 엄격 검사를 완전히 비활성화합니다.
* 다른 측면의 엄격성을 유지하면서 일부 타입 검사 작업을 개별적으로 비활성화하기 위해 *엄격성 플래그*를 `false`로 설정합니다.
* `strictTemplates`와 `strictNullChecks`를 함께 사용하려면 `strictNullInputTypes`를 사용하여 입력 바인딩에 대한 엄격한 널 타입 검사를 제외합니다.

주석이 달리지 않는 한, 다음 각 옵션은 `strictTemplates`에 대한 값으로 설정됩니다(`strictTemplates`가 `true`인 경우는 `true`, 그 반대의 경우는 그 반대).

| 엄격성 플래그               | 효과 |
|:---                         |:---   |
| `strictInputTypes`         | 바인딩 표현식이 `@Input()` 필드에 할당 가능한지 여부를 검사합니다. 또한 지시문의 일반 타입 추론에 영향을 미칩니다.                                                                                                                                                                                                                                                                                             |
| `strictInputAccessModifiers` | 바인딩 표현식을 `@Input()`에 할당할 때 `private` / `protected` / `readonly`와 같은 접근 제어자를 준수할지 여부를 결정합니다. 비활성화하면 `@Input`의 접근 제어자가 무시되며, 타입만 검사됩니다. 이 옵션은 기본적으로 `false`이며, `strictTemplates`가 `true`로 설정되더라도 마찬가지입니다.                                                                                                                                                                 |
| `strictNullInputTypes`       | `@Input()` 바인딩을 검사할 때 `strictNullChecks`를 준수할지 여부입니다(`strictInputTypes`에 따라). 이를 끄면 `strictNullChecks`를 염두에 두지 않고 작성된 라이브러리를 사용할 때 유용할 수 있습니다.                                                                                                                                                                                                                       |
| `strictAttributeTypes`       | 텍스트 속성을 이용하여 이루어진 `@Input()` 바인딩을 검사할지 여부입니다. 예를 들어, `<input matInput disabled="true">`(속성에 문자열 `'true'`가 설정됨)와 `<input matInput [disabled]="true">`(속성에 불리언 `true`가 설정됨)입니다. |
| `strictSafeNavigationTypes`  | 안전 탐색 작업의 반환 타입을 제대로 추론할지 여부입니다(예: `user?.name`은 `user` 타입에 따라 정확하게 추론됩니다). 비활성화하면 `user?.name`은 타입이 `any`가 됩니다.                                                                                                                                                                                                                                                |
| `strictDomLocalRefTypes`     | DOM 요소에 대한 로컬 참조가 올바른 타입을 가질지 여부입니다. 비활성화되면 `<input #ref>`의 `ref`는 타입이 `any`가 됩니다.                                                                                                                                                                                                                                                                              |
| `strictOutputEventTypes`     | `$event`가 컴포넌트/지시문에서의 이벤트 바인딩이나 애니메이션 이벤트에 대한 올바른 타입을 가질지 여부입니다. 비활성화되면 타입은 `any`가 됩니다.                                                                                                                                                                                                                                                                         |
| `strictDomEventTypes`        | `$event`가 DOM 이벤트에 대한 이벤트 바인딩에서 올바른 타입을 가질지 여부입니다. 비활성화되면 타입은 `any`가 됩니다.                                                                                                                                                                                                                                                                                                      |
| `strictContextGenerics`      | 일반 컴포넌트의 타입 매개변수들이 제대로 추론될지 여부(모든 일반 제한 포함)입니다. 비활성화되면 모든 타입 매개변수는 `any`가 됩니다.                                                                                                                                                                                                                                                               |
| `strictLiteralTypes`         | 템플릿에서 선언된 객체 및 배열 리터럴의 타입이 추론되는지 여부입니다. 비활성화되면 이러한 리터럴의 타입은 `any`가 됩니다. 이 플래그는 *either* `fullTemplateTypeCheck`나 `strictTemplates`가 `true`로 설정될 때 `true`입니다.                                                                                                                                                                |

이 플래그들로 문제 해결을 한 후에도 여전히 문제가 발생하면 `strictTemplates`를 비활성화하여 전체 모드로 되돌린다.

이것이 효과가 없다면, 마지막 수단으로 `fullTemplateTypeCheck: false`를 설정하여 전체 모드를 완전히 끌 수 있습니다.

추천된 방법으로 해결할 수 없는 타입 검사 오류는 템플릿 타입 검사기 자체의 버그로 인해 발생할 수 있습니다.
기본 모드로 되돌아가야 하는 오류가 발생하면 고장일 가능성이 높습니다.
이런 일이 발생하면, [문제를 제기](https://github.com/angular/angular/issues)하여 팀이 문제를 해결할 수 있도록 하세요.

## 입력 및 타입 검사

템플릿 타입 검사기는 바인딩 표현식의 타입이 해당 지시문 입력과 호환되는지 여부를 확인합니다.
예를 들어, 다음 컴포넌트를 고려하십시오:

<docs-code language="typescript">

export interface User {
  name: string;
}

@Component({
  selector: 'user-detail',
  template: '{{ user.name }}',
})
export class UserDetailComponent {
  @Input() user: User;
}

</docs-code>

`AppComponent` 템플릿은 이 컴포넌트를 다음과 같이 사용합니다:

<docs-code language="typescript">

@Component({
  selector: 'app-root',
  template: '<user-detail [user]="selectedUser"></user-detail>',
})
export class AppComponent {
  selectedUser: User | null = null;
}

</docs-code>

여기서 `AppComponent`의 템플릿 타입 검사는 `[user]="selectedUser"` 바인딩이 `UserDetailComponent.user` 입력에 상응함을 확인합니다.
따라서 Angular는 `selectedUser` 속성을 `UserDetailComponent.user`에 할당하는데, 그 타입이 호환되지 않으면 오류가 발생합니다.
TypeScript는 그 타입 시스템에 따라 할당을 검사하며, 애플리케이션에 구성된 `strictNullChecks`와 같은 플래그를 준수합니다.

템플릿 타입 검사기에 더 구체적인 타입 요구 사항을 제공하여 런타임 타입 오류를 피하도록 하세요.
지시문에 대한 입력 타입 요구 사항을 문서화 함수로 제공하여 가능한 한 구체적으로 설정하세요.
이 가이드의 [사용자 정의 지시문을 위한 템플릿 타입 검사 개선](guide/directives/structural-directives#directive-type-checks)에서 참조하세요.

### 엄격 널 검사

`strictTemplates`와 TypeScript 플래그 `strictNullChecks`를 활성화하면 피할 수 없는 특정 상황에 대해 타입 검사 오류가 발생할 수 있습니다.
예를 들어:

* `strictNullChecks`가 활성화되지 않은 라이브러리의 지시문에 바인딩된 nullable 값입니다.

    `strictNullChecks` 없이 컴파일된 라이브러리의 선언 파일은 필드가 `null`일 수 있는지 여부를 나타내지 않습니다.
    라이브러리가 `null`을 올바르게 처리하는 상황에서는 문제가 되며, 컴파일러는 nullable 값을 `null` 타입이 생략된 선언 파일과 검사합니다.
    따라서 컴파일러는 `strictNullChecks`를 준수하기 때문에 타입 검사 오류를 발생시킵니다.

* 비동기적으로 발행될 것으로 알고 있는 Observable에 `async` 파이프를 사용할 때입니다.

    현재 `async` 파이프는 구독하는 Observable이 비동기적일 수 있다고 가정하므로, 아직 값이 제공되지 않을 가능성이 있습니다.
    이 경우에도 무언가를 반환해야 하는데, 이는 `null`입니다.
    즉, `async` 파이프의 반환 타입에는 `null`이 포함되어 있으므로 Observable이 비null 값으로 동기적으로 발행되는 상황에서는 오류가 발생할 수 있습니다.

다음 두 가지 대안이 있습니다:

* 템플릿에서 nullable 표현식 끝에 non-null 단언 연산자 `!`를 포함하세요, 예를 들어

    <docs-code hideCopy language="html">

    <user-detail [user]="user!"></user-detail>

    </docs-code>

    이 경우, 컴파일러는 TypeScript 코드와 같이 nullability의 타입 불일치를 무시합니다.
    `async` 파이프의 경우, 표현식을 괄호로 감싸야 합니다. 예를 들어

    <docs-code hideCopy language="html">

    <user-detail [user]="(user$ | async)!"></user-detail>

    </docs-code>

* Angular 템플릿 내에서 엄격 널 검사를 완전히 비활성화합니다.

    `strictTemplates`가 활성화된 경우에도 타입 검사의 특정 측면을 비활성화할 수 있습니다.
    `strictNullInputTypes` 옵션을 `false`로 설정하면 Angular 템플릿 내 엄격한 널 검사를 비활성화할 수 있습니다.
    이 플래그는 애플리케이션의 모든 컴포넌트에 적용됩니다.

### 라이브러리 저자를 위한 조언

라이브러리 저자로서 사용자에게 최적의 경험을 제공하기 위해 여러 조치를 취할 수 있습니다.
첫째, 필요할 경우 `strictNullChecks`를 활성화하고 입력의 타입에 `null`을 포함하면 사용자가 nullable 값을 제공할 수 있는지 여부를 명확하게 할 수 있습니다.
또한 템플릿 타입 검사기에 구체적인 타입 힌트를 제공할 수 있습니다.
이 가이드의 [사용자 정의 지시문을 위한 템플릿 타입 검사 개선](guide/directives/structural-directives#directive-type-checks), 및 [입력 설정자 변환](#input-setter-coercion)을 참조하세요.

## 입력 설정자 변환

때때로 지시문이나 컴포넌트의 `@Input()`이 바인딩된 값을 변경해야 할 필요가 있으며, 일반적으로 입력에 대해 getter/setter 쌍을 사용합니다.
예를 들어, 다음의 사용자 정의 버튼 컴포넌트를 고려하세요:

다음 지시문을 고려하세요:

<docs-code language="typescript">

@Component({
  selector: 'submit-button',
  template: `
    <div class="wrapper">
      <button [disabled]="disabled">제출</button>
    </div>
  `,
})
class SubmitButton {
  private _disabled: boolean;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = value;
  }
}

</docs-code>

여기서 컴포넌트의 `disabled` 입력은 템플릿의 `<button>`으로 전달됩니다.
모두 예상대로 작동하지만, 불리언 값이 입력에 바인딩될 때만 그렇습니다.
하지만 소비자가 템플릿에서 이 입력을 속성으로 사용할 경우:

<docs-code language="html">

<submit-button disabled></submit-button>

</docs-code>

사실상 바인딩과 동일한 효과를 가집니다:

<docs-code language="html">

<submit-button [disabled]="''"></submit-button>

</docs-code>

런타임에서는 입력이 빈 문자열로 설정되어 불리언 값이 아닙니다.
이 문제를 처리하는 Angular 컴포넌트 라이브러리는 종종 설정자에서 값을 올바른 타입으로 "변환"합니다:

<docs-code language="typescript">

set disabled(value: boolean) {
  this._disabled = (value === '') || value;
}

</docs-code>

이 경우 `value`의 타입을 `boolean`에서 `boolean|''`로 변경하는 것이 이상적입니다.
TypeScript 4.3 이전 버전은 getter와 setter 모두 동일한 타입이 있어야 하므로, getter가 `boolean`을 반환하면 setter는 좁은 타입을 가지게 됩니다.

소비자가 Angular의 템플릿에 대한 가장 엄격한 타입 검사를 활성화하면 문제가 발생합니다: 빈 문자열(`''`)은 실질적으로 `disabled` 필드에 할당할 수 없으므로 속성 형태를 사용할 때 타입 오류가 발생하게 됩니다.

이 문제의 해결 방법으로, Angular는 `@Input()`에 대해 입력 필드에 선언된 것보다 더 넓고 관대하게 타입을 검사하는 것을 지원합니다.
이를 위해 컴포넌트 클래스에 `ngAcceptInputType_` 접두사가 있는 정적 속성을 추가하십시오:

<docs-code language="typescript">

class SubmitButton {
  private _disabled: boolean;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = (value === '') || value;
  }

  static ngAcceptInputType_disabled: boolean|'';
}

</docs-code>

TypeScript 4.3 이후에는 setter가 `boolean|''`를 타입으로 수용할 수 있도록 선언할 수 있었으므로 입력 설정자 변환 필드가 불필요하게 되었습니다.
따라서 입력 설정자 변환 필드는 사용 중단되었습니다.

이 필드는 값이 필요하지 않습니다.
그 존재는 Angular 타입 검사기에 `disabled` 입력이 `boolean|''` 타입과 일치하는 바인딩을 허용해야 함을 전달합니다.
접미사는 `@Input` *필드* 이름이어야 합니다.

주어진 입력에 대해 `ngAcceptInputType_` 재정의가 있는 경우, 설정자는 재정의된 타입의 모든 값을 처리할 수 있어야 합니다.

## `$any()`를 사용한 타입 검사 비활성화

바인딩 표현식의 검사를 비활성화하려면 표현식을 `$any()` 캐스트 가상의 함수 호출로 감싸십시오.
컴파일러는 TypeScript에서 `<any>` 또는 `as any` 캐스트를 사용할 때처럼 이를 `any` 타입으로 캐스트로 처리합니다.

다음 예시에서는 `person`을 `any` 타입으로 캐스트하여 `Property address does not exist` 오류를 억제합니다.

<docs-code language="typescript">

@Component({
  selector: 'my-component',
  template: '{{$any(person).address.street}}'
})
class MyComponent {
  person?: Person;
}

</docs-code>