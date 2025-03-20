# 타입이 지정된 양식

Angular 14부터 반응형 양식은 기본적으로 엄격하게 타입이 지정됩니다.

이 가이드를 위해, 여러분은 이미 [Angular 반응형 양식](guide/forms/reactive-forms)에 익숙해야 합니다.

## 타입이 지정된 양식 개요

<docs-video src="https://www.youtube.com/embed/L-odCf4MfJc" alt="Angular의 타입이 지정된 양식" />

Angular 반응형 양식을 사용하면 *양식 모델*을 명시적으로 지정합니다. 간단한 예로, 이 기본 사용자 로그인 양식을 고려해보세요:

```ts
const login = new FormGroup({
  email: new FormControl(''),
  password: new FormControl(''),
});
```

Angular는 이 `FormGroup`과 상호 작용하기 위한 많은 API를 제공합니다. 예를 들어, `login.value`, `login.controls`, `login.patchValue` 등을 호출할 수 있습니다. (전체 API 참조는 [API 문서](api/forms/FormGroup)를 참조하세요.)

이전 Angular 버전에서는 이러한 API의 대부분에 `any`가 포함되어 있거나, 컨트롤 구조 또는 값 자체와의 상호 작용이 타입 안전하지 않았습니다. 예를 들어, 다음과 같은 유효하지 않은 코드를 작성할 수 있었습니다:

```ts
const emailDomain = login.value.email.domain;
```

엄격하게 타입이 지정된 반응형 양식에서는 위 코드는 컴파일되지 않습니다. 왜냐하면 `email`에는 `domain` 속성이 없기 때문입니다.

추가된 안전성 외에도, 타입은 IDE에서 더 나은 자동 완성을 제공하고 양식 구조를 명시적으로 지정할 수 있는 다양한 개선을 가능하게 합니다.

이러한 개선 사항은 현재 *반응형* 양식에만 적용됩니다(여기에는 [*템플릿 기반* 양식](guide/forms/template-driven-forms)이 포함되지 않습니다).

## 타입이 없는 양식

비타입 양식은 여전히 지원되며, 이전과 같이 계속 작동합니다. 사용하려면 `@angular/forms`에서 `Untyped` 심볼을 가져와야 합니다:

```ts
const login = new UntypedFormGroup({
  email: new UntypedFormControl(''),
  password: new UntypedFormControl(''),
});
```

각 `Untyped` 심볼은 이전 Angular 버전과 정확히 동일한 의미를 가집니다. `Untyped` 접두사를 제거하면 점진적으로 타입을 활성화할 수 있습니다.

## `FormControl`: 시작하기

가장 간단한 양식은 단일 컨트롤로 구성됩니다:

```ts
const email = new FormControl('angularrox@gmail.com');
```

이 컨트롤은 자동으로 `FormControl<string|null>` 타입으로 추론됩니다. TypeScript는 `email.value`, `email.valueChanges`, `email.setValue(...)` 등과 같은 [`FormControl` API](api/forms/FormControl) 전반에 걸쳐 이 타입을 자동으로 enforcing합니다.

### 널 가능성

여러분은 왜 이 컨트롤의 타입에 `null`이 포함되어 있는지 궁금할 수 있습니다. 이는 컨트롤이 언제든지 리셋(reset) 호출로 인해 `null`이 될 수 있기 때문입니다:

```ts
const email = new FormControl('angularrox@gmail.com');
email.reset();
console.log(email.value); // null
```

TypeScript는 컨트롤이 `null`로 바뀌었을 가능성을 항상 처리하도록 enforcing할 것입니다. 이 컨트롤을 널이 아닐 수 있도록 하려면 `nonNullable` 옵션을 사용할 수 있습니다. 이 옵션은 컨트롤이 `null` 대신 초기값으로 리셋되도록 합니다:

```ts
const email = new FormControl('angularrox@gmail.com', {nonNullable: true});
email.reset();
console.log(email.value); // angularrox@gmail.com
```

다시 말씀드리지만, 이 옵션은 `.reset()`이 호출될 때 양식의 런타임 동작에 영향을 미치며 신중하게 조정해야 합니다.

### 명시적 타입 지정

추론에 의존하는 대신 타입을 명시적으로 지정할 수 있습니다. `null`로 초기화된 컨트롤을 고려해보세요. 초기값이 `null`이기 때문에 TypeScript는 `FormControl<null>`로 추론합니다. 이는 우리가 원하는 것보다 좁은 타입입니다.

```ts
const email = new FormControl(null);
email.setValue('angularrox@gmail.com'); // 오류!
```

이를 방지하기 위해, 우리는 타입을 `string|null`로 명시적으로 지정합니다:

```ts
const email = new FormControl<string|null>(null);
email.setValue('angularrox@gmail.com');
```

## `FormArray`: 동적이고 동질적인 컬렉션

`FormArray`는 무한한 수의 컨트롤 목록을 포함합니다. 타입 매개변수는 각 내부 컨트롤의 타입에 해당합니다:

```ts
const names = new FormArray([new FormControl('Alex')]);
names.push(new FormControl('Jess'));
```

이 `FormArray`는 내부 컨트롤 타입이 `FormControl<string|null>`이 됩니다.

배열 내에 여러 다른 요소 타입을 포함하려면 `UntypedFormArray`를 사용해야 합니다. TypeScript는 어떤 요소 타입이 어느 위치에 발생할 것인지 추론할 수 없습니다.

## `FormGroup` 및 `FormRecord`

Angular는 열거된 키 집합이 있는 양식을 위해 `FormGroup` 타입을 제공하고, 열려 있는(동적) 그룹을 위해 `FormRecord`라는 타입을 제공합니다.

### 부분 값

로그인 양식을 다시 고려해보세요:

```ts
const login = new FormGroup({
    email: new FormControl('', {nonNullable: true}),
    password: new FormControl('', {nonNullable: true}),
});
```

모든 `FormGroup`에 대해 컨트롤을 [비활성화](api/forms/FormGroup)할 수 있습니다. 모든 비활성화된 컨트롤은 그룹의 값에 나타나지 않습니다.

결과적으로, `login.value`의 타입은 `Partial<{email: string, password: string}>`입니다. 이 타입의 `Partial`은 각 멤버가 정의되지 않을 수 있음(언디파인드)을 의미합니다.

더 구체적으로, `login.value.email`의 타입은 `string|undefined`이며, TypeScript는 여러분이 어쩌면 `undefined`일 수 있는 값을 처리하도록 enforcing합니다(만약 `strictNullChecks`가 활성화되어 있다면).

비활성화된 컨트롤의 값을 포함하여 값을 접근하고, 따라서 가능성 있는 `undefined` 필드를 우회하려면 `login.getRawValue()`를 사용할 수 있습니다.

### 선택적 컨트롤 및 동적 그룹

일부 양식에는 런타임에 추가되거나 제거될 수 있는 컨트롤이 있을 수 있습니다. 이러한 컨트롤은 *선택적 필드*를 사용하여 표현할 수 있습니다:

```ts
interface LoginForm {
  email: FormControl<string>;
  password?: FormControl<string>;
}

const login = new FormGroup<LoginForm>({
  email: new FormControl('', {nonNullable: true}),
  password: new FormControl('', {nonNullable: true}),
});

login.removeControl('password');
```

이 양식에서 우리는 타입을 명시적으로 지정하여 `password` 컨트롤을 선택적으로 만들 수 있습니다. TypeScript는 선택적 컨트롤만 추가하거나 제거할 수 있도록 enforcing합니다.

### `FormRecord`

일부 `FormGroup` 사용은 키가 미리 알려지지 않아 위의 패턴에 맞지 않습니다. `FormRecord` 클래스는 그런 경우를 위해 설계되었습니다:

```ts
const addresses = new FormRecord<FormControl<string|null>>({});
addresses.addControl('Andrew', new FormControl('2340 Folsom St'));
```

타입이 `string|null`인 모든 컨트롤을 이 `FormRecord`에 추가할 수 있습니다.

동적(열려 있는)이고 이질적인(컨트롤이 서로 다른 타입) `FormGroup`이 필요한 경우, 개선된 타입 안전성은 가능하지 않으며 `UntypedFormGroup`을 사용해야 합니다.

`FormRecord`는 `FormBuilder`를 사용하여 구축될 수도 있습니다:

```ts
const addresses = fb.record({'Andrew': '2340 Folsom St'});
```

## `FormBuilder` 및 `NonNullableFormBuilder`

`FormBuilder` 클래스는 위의 예제와 같은 방식으로 새로운 타입을 지원하도록 업그레이드되었습니다.

추가적으로, `NonNullableFormBuilder`라는 추가 빌더가 제공됩니다. 이 타입은 모든 컨트롤에 대해 `{nonNullable: true}`를 지정하는 축약형이며, 큰 비널러블 양식에서 중복 코드를 크게 줄일 수 있습니다. `FormBuilder`에서 `nonNullable` 속성을 사용하여 액세스할 수 있습니다:

```ts
const fb = new FormBuilder();
const login = fb.nonNullable.group({
  email: '',
  password: '',
});
```

위 예제에서, 두 개의 내부 컨트롤은 비널러블이 됩니다(즉, `nonNullable`이 설정됩니다).

이것을 `NonNullableFormBuilder`라는 이름으로 주입할 수도 있습니다.