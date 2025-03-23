`@let`는 지역 변수를 정의하고 템플릿 전역에서 재사용할 수 있도록 합니다.

## Syntax

```angular-html
@let name = user.name;
@let data = data$ | async;
```

## Description

`@let` 선언은 [JavaScript의 `let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)과 유사하며,
그 값은 유효한 Angular 표현식일 수 있습니다. 표현식은 템플릿이 실행될 때마다 다시 평가됩니다.

JavaScript 변수와 유사하게, `@let`으로 선언된 변수는 다음과 같이 사용할 수 있습니다:

- 선언된 후
- 동일하거나 하위 스코프 내에서

```angular-html
@let user = user$ | async;

@if (user) {
  <h1>Hello, {{user.name}}</h1>
  <user-avatar [photo]="user.photo"/>

  <ul>
    @for (snack of user.favoriteSnacks; track snack.id) {
      <li>{{snack.name}}</li>
    }
  </ul>

  <button (click)="update(user)">Update profile</button>
}
```

## 구문 정의

`@let` 구문은 공식적으로 다음과 같이 정의됩니다:

- `@let` 키워드.
- 한 개 이상의 공백, 개행을 제외한.
- 유효한 JavaScript 이름과 0개 이상의 공백.
- = 기호와 0개 이상의 공백.
- 여러 줄일 수 있는 Angular 표현식.
- `;` 기호로 종료.

도움말: 이 기능에 대한 포괄적인 설명은 [템플릿 가이드](guide/templates/variables#local-template-variables-with-let)에서 확인할 수 있습니다.
