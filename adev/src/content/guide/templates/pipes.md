# 파이프

## 개요

파이프는 Angular 템플릿 표현식에서 데이터를 선언적으로 변환할 수 있는 특별한 연산자입니다. 파이프를 사용하면 한 번 변환 함수를 선언하고 이후 여러 템플릿에서 그 변환을 사용할 수 있습니다. Angular 파이프는 수직 바 문자(`|`)를 사용하며, 이는 [Unix 파이프](<https://en.wikipedia.org/wiki/Pipeline_(Unix)>)에서 영감을 받았습니다.

참고: Angular의 파이프 구문은 비트 연산자([비트 단위 OR 연산자](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_OR))를 사용하는 표준 JavaScript와는 다릅니다. Angular 템플릿 표현식은 비트 연산자를 지원하지 않습니다.

다음은 Angular가 제공하는 몇 가지 내장 파이프를 사용하는 예제입니다:

```angular-ts
import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CurrencyPipe, DatePipe, TitleCasePipe],
  template: `
    <main>
       <!-- 회사 이름을 제목 대문자로 변환하고
       purchasedOn 날짜를 로케일 형식의 문자열로 변환 -->
<h1>{{ company | titlecase }}의 구매  {{ purchasedOn | date }}</h1>

	    <!-- 금액을 통화 형식의 문자열로 변환 -->
      <p>총액: {{ amount | currency }}</p>
    </main>
  `,
})
export class ShoppingCartComponent {
  amount = 123.45;
  company = 'acme corporation';
  purchasedOn = '2024-07-08';
}
```

Angular가 컴포넌트를 렌더링하면 사용자의 로케일에 따라 적절한 날짜 형식과 통화가 적용됩니다. 사용자가 미국에 있는 경우 다음과 같이 렌더링됩니다:

```angular-html
<main>
  <h1>Acme Corporation의 구매 2024년 7월 8일</h1>
  <p>총액: $123.45</p>
</main>
```

Angular가 값을 로컬화하는 방법에 대해 더 배우려면 [i18n에 대한 심층 가이드](/guide/i18n)를 참조하십시오.

### 내장 파이프

Angular는 `@angular/common` 패키지에 내장 파이프 집합을 포함하고 있습니다:

| 이름                                            | 설명                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`AsyncPipe`](api/common/AsyncPipe)            | `Promise` 또는 RxJS `Observable`의 값을 읽습니다.                                          |
| [`CurrencyPipe`](api/common/CurrencyPipe)      | 로케일 규칙에 따라 숫자를 통화 문자열로 변환합니다.                                       |
| [`DatePipe`](api/common/DatePipe)              | 로케일 규칙에 따라 `Date` 값을 형식화합니다.                                             |
| [`DecimalPipe`](api/common/DecimalPipe)        | 로케일 규칙에 따라 소수점이 있는 문자열로 숫자를 변환합니다.                            |
| [`I18nPluralPipe`](api/common/I18nPluralPipe) | 로케일 규칙에 따라 값을 복수형 문자열로 매핑합니다.                                       |
| [`I18nSelectPipe`](api/common/I18nSelectPipe) | 원하는 값을 반환하는 사용자 정의 선택기로 키를 매핑합니다.                               |
| [`JsonPipe`](api/common/JsonPipe)              | 객체를 `JSON.stringify`를 통해 문자열 표현으로 변환하며, 디버깅을 위해 의도됩니다.     |
| [`KeyValuePipe`](api/common/KeyValuePipe)      | 객체 또는 맵을 키-값 쌍의 배열로 변환합니다.                                           |
| [`LowerCasePipe`](api/common/LowerCasePipe)    | 텍스트를 모두 소문자로 변환합니다.                                                      |
| [`PercentPipe`](api/common/PercentPipe)        | 로케일 규칙에 따라 숫자를 백분율 문자열로 변환합니다.                                   |
| [`SlicePipe`](api/common/SlicePipe)            | 요소의 하위 집합(슬라이스)을 포함하는 새 배열 또는 문자열을 생성합니다.                 |
| [`TitleCasePipe`](api/common/TitleCasePipe)    | 텍스트를 제목 대문자로 변환합니다.                                                      |
| [`UpperCasePipe`](api/common/UpperCasePipe)    | 텍스트를 모두 대문자로 변환합니다.                                                      |

## 파이프 사용하기

Angular의 파이프 연산자는 템플릿 표현식 내에서 수직 바 문자(`|`)를 사용합니다. 파이프 연산자는 이항 연산자로, 왼쪽 피연산자는 변환 함수에 전달되는 값을 의미하고, 오른쪽 피연산자는 파이프의 이름 및 추가 인수입니다(아래 설명 참조).

```angular-html
<p>총액: {{ amount | currency }}</p>
```

이 예제에서 `amount`의 값은 `CurrencyPipe`로 전달되며, 파이프 이름은 `currency`입니다. 그러면 사용자의 로케일에 대한 기본 통화로 렌더링됩니다.

### 동일한 표현식에서 여러 파이프 결합하기

여러 파이프 연산자를 사용하여 하나의 값에 여러 변환을 적용할 수 있습니다. Angular는 왼쪽에서 오른쪽으로 파이프를 실행합니다.

다음 예제는 모든 대문자로 로컬화된 날짜를 표시하기 위해 파이프를 조합하는 방법을 보여줍니다:

```angular-html
<p>이벤트는 {{ scheduledOn | date | uppercase }}에 발생합니다.</p>
```

### 파이프에 매개변수 전달하기

일부 파이프는 변환을 구성하기 위해 매개변수를 수용합니다. 매개변수를 지정하려면 파이프 이름 뒤에 콜론(`:`)과 매개변수 값을 붙입니다.

예를 들어, `DatePipe`는 특정 방식으로 날짜를 형식화하기 위해 매개변수를 수용할 수 있습니다.

```angular-html
<p>이벤트는 {{ scheduledOn | date:'hh:mm' }}에 발생합니다.</p>
```

일부 파이프는 여러 매개변수를 수용할 수 있습니다. 추가 매개변수 값은 콜론 문자(`:`)로 구분하여 지정할 수 있습니다.

예를 들어, 시간대를 제어하는 두 번째 선택적 매개변수를 전달할 수 있습니다.

```angular-html
<p>이벤트는 {{ scheduledOn | date:'hh:mm':'UTC' }}에 발생합니다.</p>
```

## 파이프 작동 방식

개념적으로, 파이프는 입력 값을 수용하고 변환된 값을 반환하는 함수입니다.

```angular-ts
import { Component } from '@angular/core';
import { CurrencyPipe} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CurrencyPipe],
  template: `
    <main>
      <p>총액: {{ amount | currency }}</p>
    </main>
  `,
})
export class AppComponent {
  amount = 123.45;
}
```

이 예제에서:

1. `CurrencyPipe`는 `@angular/common`에서 가져옵니다.
1. `CurrencyPipe`는 `imports` 배열에 추가됩니다.
1. `amount` 데이터가 `currency` 파이프에 전달됩니다.

### 파이프 연산자 우선순위

파이프 연산자는 `+`, `-`, `*`, `/`, `%`, `&&`, `||`, `??` 등 다른 이항 연산자보다 낮은 우선순위를 가집니다.

```angular-html
<!-- firstName과 lastName은 대문자 변환 파이프에 전달되기 전에 연결됩니다. -->
{{ firstName + lastName | uppercase }}
```

파이프 연산자는 조건부(삼항) 연산자보다 높은 우선순위를 가집니다.

```angular-html
{{ (isAdmin ? 'Access granted' : 'Access denied') | uppercase }}
```

같은 표현식이 괄호 없이 작성되면:

```angular-html
{{ isAdmin ? 'Access granted' : 'Access denied' | uppercase }}
```

대신 다음과 같이 파싱됩니다:

```angular-html
{{ isAdmin ? 'Access granted' : ('Access denied' | uppercase) }}
```

연산자 우선순위가 모호할 수 있는 경우 표현식에서 항상 괄호를 사용하십시오.

### 파이프와의 변경 감지

기본적으로 모든 파이프는 `순수(pure)`로 간주되며, 이는 기본 입력 값(예: `String`, `Number`, `Boolean`, 또는 `Symbol`) 또는 변경된 객체 참조(예: `Array`, `Object`, `Function`, 또는 `Date`)에 대해서만 실행됨을 의미합니다. 순수 파이프는 성능 이점을 제공합니다. Angular는 전달된 값이 변경되지 않았다면 변환 함수를 호출하지 않을 수 있습니다.

결과적으로, 객체 속성이나 배열 항목에 대한 변형은 전체 객체나 배열 참조가 다른 인스턴스로 대체되지 않는 한 감지되지 않습니다. 이 수준의 변경 감지를 원한다면 [배열이나 객체 내의 변경 감지](#detecting-change-within-arrays-or-objects)를 참조하십시오.

## 사용자 정의 파이프 만들기

`@Pipe` 데코레이터가 있는 TypeScript 클래스를 구현하여 사용자 정의 파이프를 정의할 수 있습니다. 파이프는 두 가지가 필요합니다:

- 데코레이터에서 지정한 이름
- 값 변환을 수행하는 `transform`이라는 메서드

TypeScript 클래스는 파이프에 대한 타입 서명을 만족하도록 `PipeTransform` 인터페이스를 구현해야 합니다.

다음은 문자열을 케밥 케이스로 변환하는 사용자 정의 파이프의 예입니다:

```angular-ts
// kebab-case.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'kebabCase',
})
export class KebabCasePipe implements PipeTransform {
  transform(value: string): string {
    return value.toLowerCase().replace(/ /g, '-');
  }
}
```

### `@Pipe` 데코레이터 사용하기

사용자 정의 파이프를 만들 때 `@angular/core` 패키지에서 `Pipe`를 가져와 TypeScript 클래스의 데코레이터로 사용합니다.

```angular-ts
import { Pipe } from '@angular/core';

@Pipe({
  name: 'myCustomTransformation',
})
export class MyCustomTransformationPipe {}
```

`@Pipe` 데코레이터는 템플릿에서 파이프를 사용하는 방식을 제어하는 `name`이 필요합니다.

### 사용자 정의 파이프의 명명 규칙

사용자 정의 파이프의 명명 규칙은 두 가지 규칙으로 구성됩니다:

- `name` - 카멜 케이스를 권장합니다. 하이픈을 사용하지 마십시오.
- `class name` - `name`의 파스칼 케이스 버전이며 끝에 `Pipe`가 추가됩니다.

### `PipeTransform` 인터페이스 구현하기

`@Pipe` 데코레이터 외에도 사용자 정의 파이프는 항상 `@angular/core`에서 `PipeTransform` 인터페이스를 구현해야 합니다.

```angular-ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'myCustomTransformation',
})
export class MyCustomTransformationPipe implements PipeTransform {}
```

이 인터페이스를 구현하면 파이프 클래스가 올바른 구조를 가지도록 보장됩니다.

### 파이프의 값 변환하기

모든 변환은 `transform` 메서드에 의해 호출되며, 첫 번째 매개변수는 전달되는 값이고 반환 값은 변환된 값입니다.

```angular-ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'myCustomTransformation',
})
export class MyCustomTransformationPipe implements PipeTransform {
  transform(value: string): string {
    return `제 사용자 정의 변환 ${value}.`
  }
}
```

### 사용자 정의 파이프에 매개변수 추가하기

변환에 매개변수를 추가하려면 `transform` 메서드에 추가 매개변수를 추가할 수 있습니다:

```angular-ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'myCustomTransformation',
})
export class MyCustomTransformationPipe implements PipeTransform {
  transform(value: string, format: string): string {
    let msg = `제 사용자 정의 변환 ${value}.`

    if (format === 'uppercase') {
      return msg.toUpperCase()
    } else {
      return msg
    }
  }
}
```

### 배열이나 객체 내에서의 변경 감지

배열이나 객체 내에서 변경을 감지하려면 `pure` 플래그에 `false` 값을 전달하여 비순수 함수로 표시해야 합니다.

필요하지 않은 한 비순수 파이프를 생성하는 것은 피하십시오. 사용 시 성능에 상당한 영향을 미칠 수 있습니다.

```angular-ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'joinNamesImpure',
  pure: false,
})
export class JoinNamesImpurePipe implements PipeTransform {
  transform(names: string[]): string {
    return names.join();
  }
}
```

Angular 개발자들은 종종 다른 개발자에게 잠재적인 성능 문제를 나타내기 위해 파이프의 `name`과 클래스 이름에 `Impure`를 포함하는 관례를 따릅니다.