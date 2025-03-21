# Component Communication with `@Input`

가끔 앱 개발에서는 데이터를 컴포넌트로 전달해야 할 필요가 있습니다. 이 데이터는 컴포넌트를 사용자 정의하거나 부모 컴포넌트에서 자식 컴포넌트로 정보를 전달하는 데 사용될 수 있습니다.

Angular는 `Input`이라는 개념을 사용합니다. 이는 다른 프레임워크의 `props`와 유사합니다. `Input` 속성을 만들려면 `@Input` 데코레이터를 사용하십시오.

이번 활동에서는 `@Input` 데코레이터를 사용하여 컴포넌트에 정보를 전달하는 방법을 배우게 됩니다.

<hr>

`Input` 속성을 생성하려면 컴포넌트 클래스의 속성에 `@Input` 데코레이터를 추가하십시오:

<docs-code header="user.component.ts" language="ts">
class UserComponent {
  @Input() occupation = '';
}
</docs-code>

`Input`을 통해 값을 전달할 준비가 되었을 때, 템플릿에서 속성 구문을 사용하여 값을 설정할 수 있습니다. 예를 들면 다음과 같습니다:

<docs-code header="app.component.ts" language="angular-ts" highlight="[3]">
@Component({
  ...
  template: `<app-user occupation="Angular Developer"></app-user>`
})
class AppComponent {}
</docs-code>

`UserComponent`에서 `occupation` 속성을 바인딩해야 합니다.

<docs-code header="user.component.ts" language="angular-ts">
@Component({
  ...
  template: `<p>사용자의 직업은 {{occupation}}입니다.</p>`
})
</docs-code>

<docs-workflow>

<docs-step title="Define an `@Input` property">
`user.component.ts`의 코드를 업데이트하여 `UserComponent`에서 `name`이라는 `Input` 속성을 정의하십시오. 현재로서는 초기 값을 `empty string`으로 설정하십시오. 문장의 끝에 `name` 속성을 보간하도록 템플릿을 업데이트하는 것을 잊지 마세요.
</docs-step>

<docs-step title="Pass a value to the `@Input` property">
`app.component.ts`의 코드를 업데이트하여 `"Simran"` 값을 가진 `name` 속성을 전달하십시오.
<br>

코드가 성공적으로 업데이트되면 앱은 `사용자의 이름은 Simran입니다.`를 표시합니다.
</docs-step>

</docs-workflow>

이것은 훌륭하지만, 컴포넌트 통신의 한 방향일 뿐입니다. 만약 자식 컴포넌트에서 부모 컴포넌트로 정보를 전달하고 싶다면 어떻게 해야 할까요? 다음 레슨에서 확인해 보세요.

P.S. 잘하고 있어요 - 계속 진행하세요 🎉