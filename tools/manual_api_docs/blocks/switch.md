The `@switch` 블록은 JavaScript `switch` 문에서 영감을 받았습니다:

## Syntax

```angular-html
@switch (condition) {
  @case (caseA) {
    Case A.
  }
  @case (caseB) {
    Case B.
  }
  @default {
    Default case.
  }
}
```

## Description

`@switch` 블록은 조건 표현식에 맞는 경우 중 하나에 의해 선택된 내용을 표시합니다. 조건 표현식의 값은 `===` 연산자를 사용하여 경우 표현식과 비교됩니다.

`@default` 블록은 선택 사항이며 생략할 수 있습니다. 만약 어떤 `@case`도 표현식과 일치하지 않고 `@default` 블록이 없다면, 아무것도 표시되지 않습니다.

**`@switch`는 fallthrough가 없습니다**, 그래서 `break` 또는 `return` 문에 해당하는 것이 필요하지 않습니다.
