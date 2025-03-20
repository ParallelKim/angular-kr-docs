# 표현식 구문

Angular 표현식은 JavaScript를 기반으로 하지만 몇 가지 핵심적인 차이점이 있습니다. 이 가이드는 Angular 표현식과 표준 JavaScript 간의 유사점과 차이점을 설명합니다.

## 값 리터럴

Angular는 JavaScript의 [리터럴 값](https://developer.mozilla.org/en-US/docs/Glossary/Literal)의 하위 집합을 지원합니다.

### 지원되는 값 리터럴

| 리터럴 유형            | 예제 값                       |
| -------------------- | ---------------------------- |
| 문자열                  | `'안녕하세요'`, `"세계"`        |
| 불리언                | `true`, `false`              |
| 숫자                  | `123`, `3.14`                |
| 객체                  | `{name: '앨리스'}`            |
| 배열                  | `['양파', '치즈', '마늘']`     |
| null                  | `null`                       |
| 템플릿 문자열           | `` `안녕하세요 ${name}` ``     |
| 태그가 있는 템플릿 문자열 | `` tag`안녕하세요 ${name}` ``  |

### 지원되지 않는 리터럴

| 리터럴 유형            | 예제 값                  |
| -------------------- | ----------------------- |
| 정규 표현식          | `/\d+/`                  |
| 태그가 있는 템플릿 문자열 | `` tag`안녕하세요 ${name}` `` |

## 전역 변수

Angular 표현식은 다음 [전역 변수](https://developer.mozilla.org/en-US/docs/Glossary/Global_object)를 지원합니다:

- [undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)
- [$any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)

기타 JavaScript 전역 변수는 지원되지 않습니다. 일반적인 JavaScript 전역 변수로는 `Number`, `Boolean`, `NaN`, `Infinity`, `parseInt` 등이 있습니다.

## 지역 변수

Angular는 특정 컨텍스트에서 표현식에 사용할 수 있도록 특별한 지역 변수를 자동으로 제공합니다. 이 특별한 변수는 항상 달러 기호(`$`)로 시작합니다.

예를 들어, `@for` 블록은 `$index`와 같은 루프에 대한 정보를 나타내는 여러 지역 변수를 만듭니다.

## 어떤 연산자가 지원되나요?

### 지원되는 연산자

Angular는 표준 JavaScript에서 다음 연산자를 지원합니다.

| 연산자                  | 예제                             |
| --------------------- | ------------------------------- |
| 더하기 / 연결           | `1 + 2`                          |
| 빼기                  | `52 - 3`                         |
| 곱하기                  | `41 * 6`                         |
| 나누기                  | `20 / 4`                         |
| 나머지 (모듈로)         | `17 % 5`                         |
| 지수                   | `10 ** 3`                        |
| 괄호                   | `9 * (8 + 4)`                    |
| 조건부 (삼항)          | `a > b ? true : false`           |
| 논리적 그리고           | `&&`                             |
| 논리적 또는            | `\|\|`                           |
| 논리적 부정            | `!`                              |
| nullish 병합           | `possiblyNullValue ?? 'default'` |
| 비교 연산자            | `<`, `<=`, `>`, `>=`, `==`, `===`, `!==` |
| 단항 부정              | `-x`                             |
| 단항 덧셈              | `+y`                             |
| 속성 접근자             | `person['name']`                |
| typeof                | `typeof 42`                     |
| void                  | `void 1`                        |

Angular 표현식은 또한 다음 비표준 연산자를 추가로 지원합니다:

| 연산자                       | 예제                           |
| ---------------------------- | ------------------------------ |
| [파이프](/guide/templates/pipes) | `{{ total \| currency }}`      |
| 선택적 체이닝\*              | `someObj.someProp?.nestedProp` |
| 널 아닌 단언 (TypeScript)     | `someObj!.someProp`            |

\*참고: 선택적 체이닝은 Angular의 선택적 체이닝 연산자의 왼쪽이 `null` 또는 `undefined`일 경우 `undefined` 대신 `null`을 반환하는 표준 JavaScript 버전과 다르게 동작합니다.

### 지원되지 않는 연산자

| 연산자                  | 예제                           |
| --------------------- | ------------------------------- |
| 모든 비트 연산자      | `&`, `&=`, `~`, `\|=`, `^=`, 등 |
| 할당 연산자           | `=`                             |
| 객체 분해              | `const { name } = person`      |
| 배열 분해              | `const [firstItem] = items`    |
| 쉼표 연산자           | `x = (x++, x)`                 |
| in                    | `'model' in car`               |
| instanceof            | `car instanceof Automobile`     |
| new                   | `new Car()`                    |

## 표현식의 문맥

Angular 표현식은 구성 요소 클래스의 문맥과 관련된 [템플릿 변수](/guide/templates/variables), 지역 변수 및 전역 내에서 평가됩니다.

클래스 멤버를 참조할 때는 항상 `this`가 암시됩니다.

## 선언

일반적으로 선언은 Angular 표현식에서 지원되지 않습니다. 여기에는 다음이 포함되지만 이에 국한되지는 않습니다:

| 선언               | 예제                             |
| ---------------- | -------------------------------- |
| 변수              | `let label = 'abc'`, `const item = 'apple'` |
| 함수              | `function myCustomFunction() { }` |
| 화살표 함수       | `() => { }`                     |
| 클래스            | `class Rectangle { }`           |

# 이벤트 리스너 문장

이벤트 핸들러는 **표현식**이 아니라 **문장**입니다. Angular 표현식과 동일한 구문을 모두 지원하지만 두 가지 주요 차이점이 있습니다:

1. 문장은 **할당 연산자**를 지원합니다(단, 분해 할당은 지원하지 않음).
2. 문장은 **파이프**를 지원하지 않습니다.