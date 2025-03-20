# AOT 메타데이터 오류

다음은 발생할 수 있는 메타데이터 오류와 그 설명, 수정 제안입니다.

## 지원되지 않는 표현 형식

유용함: 컴파일러가 Angular 메타데이터를 평가하는 동안 이해할 수 없는 표현을 만났습니다.

컴파일러의 [제한된 표현 구문](tools/cli/aot-compiler#expression-syntax) 외부의 언어 기능이 이 오류를 발생시킬 수 있으며, 다음 예에서 볼 수 있습니다:

<docs-code language="typescript">
// 오류
export class Fooish { … }
…
const prop = typeof Fooish; // typeof는 메타데이터에서 유효하지 않음
  …
  // 대괄호 표기법은 메타데이터에서 유효하지 않음
  { provide: 'token', useValue: { [prop]: 'value' } };
  …
</docs-code>

정상적인 애플리케이션 코드에서는 `typeof`와 대괄호 표기법을 사용할 수 있습니다.
하지만 Angular 메타데이터를 정의하는 표현 내에서는 이러한 기능을 사용할 수 없습니다.

Angular 메타데이터를 작성할 때 컴파일러의 [제한된 표현 구문](tools/cli/aot-compiler#expression-syntax)을 고수하여 이 오류를 피하고, 새로운 또는 특이한 TypeScript 기능에 주의하세요.

## 로컬(비수출) 심볼에 대한 참조

유용함: 로컬(비수출) 심볼 'symbol name'에 대한 참조. 심볼을 수출하는 것을 고려하십시오.

컴파일러가 수출되지 않거나 초기화되지 않은 로컬로 정의된 심볼에 대한 참조를 만났습니다.

문제의 `provider` 예는 다음과 같습니다.

<docs-code language="typescript">

// 오류
let foo: number; // 수출되지도 초기화되지도 않음

@Component({
  selector: 'my-component',
  template: … ,
  providers: [
    { provide: Foo, useValue: foo }
  ]
})
export class MyComponent {}

</docs-code>

컴파일러는 `useValue` 제공자 코드를 포함한 구성 요소 팩토리를 별도의 모듈에서 생성합니다. *그* 팩토리 모듈은 로컬(비수출) `foo` 변수를 접근하기 위해 *이* 소스 모듈로 다시 돌아갈 수 없습니다.

문제를 해결하려면 `foo`를 초기화하면 됩니다.

<docs-code language="typescript">
let foo = 42; // 초기화됨
</docs-code>

컴파일러는 표현을 제공자에 [접기](tools/cli/aot-compiler#code-folding)하여 마치 다음과 같이 작성한 것처럼 처리합니다.

<docs-code language="typescript">
providers: [
  { provide: Foo, useValue: 42 }
]
</docs-code>

또는 `foo`를 수출하여 런타임에서 `foo`가 실제 값을 알 때 할당될 것이라고 기대하여 문제를 해결할 수 있습니다.

<docs-code language="typescript">
// 수정됨
export let foo: number; // 수출됨

@Component({
  selector: 'my-component',
  template: … ,
  providers: [
    { provide: Foo, useValue: foo }
  ]
})
export class MyComponent {}
</docs-code>

`export`를 추가하면 종종 `providers` 및 `animations`와 같은 메타데이터에 참조된 변수에 대해 작동합니다. 이는 컴파일러가 이러한 표현에서 수출된 변수에 대한 *참조*를 생성할 수 있기 때문입니다. 변수의 *값*이 필요하지 않습니다.

하지만 컴파일러가 코드를 생성하기 위해 *실제 값*이 필요할 경우 `export` 추가는 효과가 없습니다.
예를 들어, `template` 속성에는 효과가 없습니다.

<docs-code language="typescript">

// 오류
export let someTemplate: string; // 수출되었지만 초기화되지 않음

@Component({
  selector: 'my-component',
  template: someTemplate
})
export class MyComponent {}

</docs-code>

컴파일러는 구성 요소 팩토리를 생성하기 위해 현재 `template` 속성의 값을 필요로 합니다.
변수 참조만으로는 충분하지 않습니다.
선언 앞에 `export`를 접두어로 추가하면 새 오류 "[`Only initialized variables and constants can be referenced`](#only-initialized-variables)"가 발생합니다.

## 초기화된 변수 및 상수만 참조 가능

유용함: *초기화된 변수와 상수만 참조할 수 있습니다. 템플릿 컴파일러에서 이 변수의 값이 필요하기 때문입니다.*

컴파일러가 초기화되지 않은 수출된 변수 또는 정적 필드에 대한 참조를 발견했습니다.
코드를 생성하기 위해 해당 변수의 값이 필요합니다.

다음 예제는 구성 요소의 `template` 속성을 수출된 `someTemplate` 변수의 값으로 설정하려고 시도하지만, 그 변수는 선언되었으나 *할당되지 않았습니다*.

<docs-code language="typescript">

// 오류
export let someTemplate: string;

@Component({
  selector: 'my-component',
  template: someTemplate
})
export class MyComponent {}

</docs-code>

다른 모듈에서 `someTemplate`를 가져오고 거기에서 초기화하지 않으면 이 오류가 발생합니다.

<docs-code language="typescript">

// 오류 - 거기서도 초기화되지 않음
import { someTemplate } from './config';

@Component({
  selector: 'my-component',
  template: someTemplate
})
export class MyComponent {}

</docs-code>

컴파일러는 템플릿 정보를 런타임까지 기다릴 수 없습니다.
소스 코드에서 `someTemplate` 변수의 값을 정적으로 유도해야 컴포넌트 팩토리를 생성할 수 있으며, 여기에는 템플릿 기반 요소를 빌드하기 위한 지침이 포함됩니다.

이 오류를 수정하려면 초기화 구문에서 변수를 같은 줄에 초기값을 제공하십시오.

<docs-code language="typescript">

// 수정됨
export let someTemplate = '<h1>Angular로부터 인사드립니다</h1>';

@Component({
  selector: 'my-component',
  template: someTemplate
})
export class MyComponent {}

</docs-code>

## 비수출 클래스에 대한 참조

유용함: *비수출 클래스 `<class name>`에 대한 참조.*
*클래스를 수출하는 것을 고려하십시오.*

메타데이터가 수출되지 않은 클래스를 참조했습니다.

예를 들어, 클래스를 정의하고 제공자 배열에서 주입 토큰으로 사용했지만 해당 클래스를 수출하는 것을 잊었을 수 있습니다.

<docs-code language="typescript">

// 오류
abstract class MyStrategy { }

  …
  providers: [
    { provide: MyStrategy, useValue: … }
  ]
  …

</docs-code>

Angular는 별도의 모듈에서 클래스 팩토리를 생성하며, 해당 팩토리는 [수출된 클래스에만 접근할 수 있습니다](tools/cli/aot-compiler#exported-symbols).
이 오류를 수정하려면 참조된 클래스를 수출하십시오.

<docs-code language="typescript">

// 수정됨
export abstract class MyStrategy { }

  …
  providers: [
    { provide: MyStrategy, useValue: … }
  ]
  …

</docs-code>

## 비수출 함수에 대한 참조

유용함: *메타데이터가 수출되지 않은 함수를 참조했습니다.*

예를 들어, 제공자 `useFactory` 속성을 수출하지 않은 로컬로 정의된 함수에 설정했을 수 있습니다.

<docs-code language="typescript">

// 오류
function myStrategy() { … }

  …
  providers: [
    { provide: MyStrategy, useFactory: myStrategy }
  ]
  …

</docs-code>

Angular는 별도의 모듈에서 클래스 팩토리를 생성하며, 해당 팩토리는 [수출된 함수에만 접근할 수 있습니다](tools/cli/aot-compiler#exported-symbols).
이 오류를 수정하려면 함수를 수출하십시오.

<docs-code language="typescript">

// 수정됨
export function myStrategy() { … }

  …
  providers: [
    { provide: MyStrategy, useFactory: myStrategy }
  ]
  …

</docs-code>

## 함수 호출은 지원되지 않음

유용함: *함수 호출은 지원되지 않습니다. 수출된 함수에 대한 참조로 함수를 또는 람다를 대체하는 것을 고려하십시오.*

현재 컴파일러는 [함수 표현식 또는 람다 함수](tools/cli/aot-compiler#function-expression)를 지원하지 않습니다.
예를 들어, 익명 함수나 화살표 함수를 다음과 같이 제공자의 `useFactory`로 설정할 수 없습니다.

<docs-code language="typescript">

// 오류
  …
  providers: [
    { provide: MyStrategy, useFactory: function() { … } },
    { provide: OtherStrategy, useFactory: () => { … } }
  ]
  …

</docs-code>

제공자의 `useValue`에서 함수나 메서드를 호출하면 이 오류가 발생합니다.

<docs-code language="typescript">

// 오류
import { calculateValue } from './utilities';

  …
  providers: [
    { provide: SomeValue, useValue: calculateValue() }
  ]
  …

</docs-code>

이 오류를 수정하려면 모듈에서 함수를 수출하고 대신 `useFactory` 제공자에서 그 함수를 참조하십시오.

<docs-code language="typescript">

// 수정됨
import { calculateValue } from './utilities';

export function myStrategy() { … }
export function otherStrategy() { … }
export function someValueFactory() {
  return calculateValue();
}
  …
  providers: [
    { provide: MyStrategy, useFactory: myStrategy },
    { provide: OtherStrategy, useFactory: otherStrategy },
    { provide: SomeValue, useFactory: someValueFactory }
  ]
  …

</docs-code>

## 구조 분해된 변수 또는 상수는 지원되지 않음

유용함: *수출된 구조 분해된 변수 또는 상수를 참조하는 것은 템플릿 컴파일러에서 지원되지 않습니다. 구조 분해를 피하기 위해 이를 단순화하는 것을 고려하십시오.*

컴파일러는 [구조 분해](https://www.typescriptlang.org/docs/handbook/variable-declarations.html#destructuring)로 할당된 변수에 대한 참조를 지원하지 않습니다.

예를 들어, 다음과 같이 쓸 수는 없습니다:

<docs-code language="typescript">

// 오류
import { configuration } from './configuration';

// foo와 bar에 대한 구조 분해 할당
const {foo, bar} = configuration;
  …
  providers: [
    {provide: Foo, useValue: foo},
    {provide: Bar, useValue: bar},
  ]
  …

</docs-code>

이 오류를 수정하려면 비구조 분해된 값을 참조하십시오.

<docs-code language="typescript">

// 수정됨
import { configuration } from './configuration';
  …
  providers: [
    {provide: Foo, useValue: configuration.foo},
    {provide: Bar, useValue: configuration.bar},
  ]
  …

</docs-code>

## 유형을 해결할 수 없음

유용함: *컴파일러가 유형을 발견하고 해당 유형을 내보내는 모듈을 결정할 수 없습니다.*

이러한 문제는 환경 유형을 참조하는 경우 발생할 수 있습니다.
예를 들어, `Window` 유형은 전역 `.d.ts` 파일에 선언된 환경 유형입니다.

구성 요소 생성자에서 이를 참조하면 오류가 발생합니다. 컴파일러는 이를 정적으로 분석해야 합니다.

<docs-code language="typescript">

// 오류
@Component({ })
export class MyComponent {
  constructor (private win: Window) { … }
}

</docs-code>

TypeScript는 환경 유형을 이해하므로 이를 가져오지 않습니다.
Angular 컴파일러는 수출되거나 가져와야 할 유형을 이해하지 못합니다.

이 경우 컴파일러는 `Window` 토큰으로 무언가를 주입하는 방법을 이해하지 못합니다.

메타데이터 표현에서 환경 유형을 참조하지 마십시오.

환경 유형의 인스턴스를 주입해야 한다면,
다음 4단계를 통해 문제를 해결할 수 있습니다:

1. 환경 유형의 인스턴스에 대한 주입 토큰을 생성합니다.
1. 해당 인스턴스를 반환하는 팩토리 함수를 생성합니다.
1. 해당 팩토리 함수로 `useFactory` 제공자를 추가합니다.
1. `@Inject`를 사용하여 인스턴스를 주입합니다.

다음은 설명적인 예입니다.

<docs-code language="typescript">

// 수정됨
import { Inject } from '@angular/core';

export const WINDOW = new InjectionToken('Window');
export function _window() { return window; }

@Component({
  …
  providers: [
    { provide: WINDOW, useFactory: _window }
  ]
})
export class MyComponent {
  constructor (@Inject(WINDOW) private win: Window) { … }
}

</docs-code>

생성자에서 `Window` 유형은 컴파일러에 더 이상 문제가 되지 않습니다. 왜냐하면 `@Inject(WINDOW)`를 사용하여 주입 코드를 생성하기 때문입니다.

Angular는 `DOCUMENT` 토큰에서 비슷한 작업을 수행하므로 브라우저의 `document` 객체(또는 애플리케이션이 실행되는 플랫폼에 따라 그 추상화)를 주입할 수 있습니다.

<docs-code language="typescript">

import { Inject }   from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({ … })
export class MyComponent {
  constructor (@Inject(DOCUMENT) private doc: Document) { … }
}

</docs-code>

## 이름이 예상됨

유용함: *컴파일러가 평가 중인 표현에서 이름을 예상했습니다.*

다음 예와 같이 숫자를 속성 이름으로 사용할 경우 이 문제가 발생할 수 있습니다.

<docs-code language="typescript">

// 오류
provider: [{ provide: Foo, useValue: { 0: 'test' } }]

</docs-code>

속성의 이름을 비숫자 값으로 변경하십시오.

<docs-code language="typescript">

// 수정됨
provider: [{ provide: Foo, useValue: { '0': 'test' } }]

</docs-code>

## 지원되지 않는 열거형 멤버 이름

유용함: *Angular가 메타데이터에서 참조한 [열거형 멤버](https://www.typescriptlang.org/docs/handbook/enums.html)의 값을 결정할 수 없었습니다.*

컴파일러는 간단한 열거형 값을 이해할 수 있지만, 계산된 속성과 같은 복잡한 값은 이해할 수 없습니다.

<docs-code language="typescript">

// 오류
enum Colors {
  Red = 1,
  White,
  Blue = "Blue".length // 계산됨
}

  …
  providers: [
    { provide: BaseColor,   useValue: Colors.White } // 괜찮음
    { provide: DangerColor, useValue: Colors.Red }   // 괜찮음
    { provide: StrongColor, useValue: Colors.Blue }  // 나쁨
  ]
  …

</docs-code>

복잡한 초기값이나 계산된 속성을 가진 열거형은 참조하지 마십시오.

## 태그가 있는 템플릿 표현은 지원되지 않음

유용함: *메타데이터에서 태그가 있는 템플릿 표현은 지원되지 않습니다.*

컴파일러가 JavaScript ES2015 [태그가 있는 템플릿 표현](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals)인 다음과 같은 것을 만났습니다.

<docs-code language="typescript">

// 오류
const expression = 'funky';
const raw = String.raw`A tagged template ${expression} string`;
 …
 template: '<div>' + raw + '</div>'
 …

</docs-code>

[`String.raw()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/raw)는 JavaScript ES2015의 *태그 함수*입니다.

AOT 컴파일러는 태그가 있는 템플릿 표현을 지원하지 않으므로 메타데이터 표현에서 이를 피해야 합니다.

## 기호 참조 예상됨

유용함: *컴파일러가 오류 메시지에 지정된 위치에서 심볼에 대한 참조를 예상했습니다.*

이 오류는 클래스의 `extends` 절에서 표현식을 사용할 경우 발생할 수 있습니다.