`@if` 블록은 조건 표현식이 참일 때 내용을 조건부로 표시합니다.

## Syntax

```angular-html
@if (a > b) {
  {{a}}는 {{b}}보다 큽니다.
} @else if (b > a) {
  {{a}}는 {{b}}보다 작습니다.
} @else {
  {{a}}는 {{b}}와 같습니다.
}
```

## Description

내용은 `@if` 및 `@else` 블록에서 조건 표현식의 평가에 따라 DOM에 추가되고 제거됩니다.

내장된 `@if`는 일반적인 코딩 패턴을 위한 솔루션을 유지하기 위해 표현식 결과의 참조를 지원합니다:

```angular-html
@if (users$ | async; as users) {
  {{ users.length }}
}
```
