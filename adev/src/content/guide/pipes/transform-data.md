# 새로운 변환을 위한 커스텀 파이프

내장 파이프에서 제공되지 않는 변환을 캡슐화하기 위해 커스텀 파이프를 생성합니다.
그런 다음, 내장 파이프를 사용하는 것과 같은 방식으로 템플릿 표현식에서 커스텀 파이프를 사용하여 입력 값을 화면에 표시할 출력 값으로 변환합니다.

## 클래스를 파이프로 표시하기

클래스를 파이프로 표시하고 구성 메타데이터를 제공하려면 `@Pipe`를 클래스에 적용합니다.

파이프 클래스 이름에는 UpperCamelCase(클래스 이름의 일반적인 규칙)를 사용하고, 해당하는 `name` 문자열에는 camelCase를 사용합니다.
`name`에 하이픈을 사용하지 마십시오.

자세한 내용과 더 많은 예시는 [Pipe names](/style-guide#pipe-names "Angular 코딩 스타일 가이드의 파이프 이름")를 참조하십시오.

내장 파이프에 대해 사용하는 것처럼 템플릿 표현식에서 `name`을 사용합니다.

```ts
import { Pipe } from '@angular/core';

@Pipe({
  name: 'greet',
})
export class GreetPipe {}
```

## PipeTransform 인터페이스 사용하기

변환을 수행하기 위해 커스텀 파이프 클래스에서 [`PipeTransform`](/api/core/PipeTransform "API reference for PipeTransform") 인터페이스를 구현합니다.

Angular는 바인딩의 값을 첫 번째 인수로 사용하여 `transform` 메서드를 호출하고, 두 번째 인수는 리스트 형식으로 모든 매개변수를 전달하며, 변환된 값을 반환합니다.

```ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'greet',
})
export class GreetPipe implements PipeTransform {
  transform(value: string, param1: boolean, param2: boolean): string {
    return `Hello ${value}`;
  }
}
```

## 예: 값을 지수적으로 변환하기

게임에서 영웅의 힘을 증가시키기 위해 값을 지수적으로 증가시키는 변환을 구현하고 싶을 수 있습니다.
예를 들어, 영웅의 점수가 2일 때, 영웅의 힘을 10으로 지수적으로 증가시키면 1024의 점수가 생성됩니다(`2**10`).
이 변환을 위해 커스텀 파이프를 사용하십시오.

다음 코드 예시는 두 개의 컴포넌트 정의를 보여줍니다:

| 파일                           | 세부 사항 |
|:---                           |:---     |
| `exponential-strength.pipe.ts` | 변환을 수행하는 `transform` 메서드를 가진 `exponentialStrength`라는 커스텀 파이프를 정의합니다. 파이프에 전달된 매개변수에 대한 인수(`exponent`)를 `transform` 메서드에 정의합니다. |
| `power-booster.component.ts`   | 값을 지정하고(`2`), 지수 매개변수(`10`)를 지정하여 파이프를 사용하는 방법을 설명합니다. |

<docs-code-multifile>
  <docs-code header="src/app/exponential-strength.pipe.ts" language="ts" path="adev/src/content/examples/pipes/src/app/exponential-strength.pipe.ts"/>
  <docs-code header="src/app/power-booster.component.ts" language="ts" path="adev/src/content/examples/pipes/src/app/power-booster.component.ts"/>
</docs-code-multifile>