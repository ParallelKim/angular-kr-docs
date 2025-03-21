# 컴포넌트의 제어 흐름 - `@if`

사용자에게 화면에 무엇을 표시할지를 결정하는 것은 애플리케이션 개발에서 일반적인 작업입니다. 종종 이 결정을 조건을 사용하여 프로그래밍적으로 수행합니다.

템플릿에서 조건부 표시를 표현하기 위해 Angular는 `@if` 템플릿 구문을 사용합니다.

이 활동에서는 템플릿에서 조건문을 사용하는 방법을 배웁니다.

<hr/>

템플릿에서 요소의 조건부 디스플레이를 가능하게 하는 구문은 `@if`입니다.

다음은 컴포넌트에서 `@if` 구문을 사용하는 방법의 예입니다:

```angular-ts
@Component({
  ...
  template: `
    @if (isLoggedIn) {
      <p>Welcome back, Friend!</p>
    }
  `,
})
class AppComponent {
  isLoggedIn = true;
}
```

주의해야 할 두 가지 사항:

- `if` 앞에 `@` 접두사가 있습니다. 이는 특수한 유형의 구문인 [Angular 템플릿 구문](guide/templates)입니다.
- v16 및 이전 버전을 사용하는 애플리케이션의 경우 [NgIf에 대한 Angular 문서](guide/directives/structural-directives)를 참조하여 더 많은 정보를 확인하십시오.

<docs-workflow>

<docs-step title="isServerRunning이라는 속성을 생성합니다">
`AppComponent` 클래스에 `isServerRunning`이라는 `boolean` 속성을 추가하고 초기 값을 `true`로 설정합니다.
</docs-step>

<docs-step title="템플릿에서 `@if` 사용">
`isServerRunning`의 값이 `true`일 경우 메시지 `Yes, the server is running`을 표시하도록 템플릿을 업데이트합니다.

</docs-step>

<docs-step title="템플릿에서 `@else` 사용">
이제 Angular는 `@else` 구문으로 else 케이스를 정의하는 기본 템플릿 구문을 지원합니다. 템플릿을 업데이트하여 else 케이스로 메시지 `No, the server is not running`을 표시합니다.

다음은 그 예입니다:

```angular-ts
template: `
  @if (isServerRunning) { ... }
  @else { ... }
`;
```

누락된 마크업을 채우기 위해 코드를 추가하세요.

</docs-step>

</docs-workflow>

이러한 유형의 기능은 조건부 제어 흐름이라고 합니다. 다음으로 템플릿에서 항목을 반복하는 방법을 배우게 됩니다.