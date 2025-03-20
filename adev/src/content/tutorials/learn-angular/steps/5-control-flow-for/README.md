# 컴포넌트에서의 제어 흐름 - `@for`

웹 애플리케이션을 구축할 때, 코드를 특정한 횟수만큼 반복해야 할 때가 많습니다. 예를 들어, 이름 배열이 주어지면 각 이름을 `<p>` 태그에 표시하고 싶을 수 있습니다.

이 활동에서는 템플릿에서 `@for`를 사용하여 요소를 반복하는 방법을 배웁니다.
<hr/>

템플릿에서 요소를 반복할 수 있게 해주는 구문은 `@for`입니다.

다음은 컴포넌트에서 `@for` 구문을 사용하는 방법의 예입니다:

```angular-ts
@Component({
  ...
  template: `
    @for (os of operatingSystems; track os.id) {
      {{ os.name }}
    }
  `,
})
export class AppComponent {
  operatingSystems = [{id: 'win', name: 'Windows'}, {id: 'osx', name: 'MacOS'}, {id: 'linux', name: 'Linux'}];
}
```

두 가지 유의해야 할 사항:

* `for` 앞에 `@` 접두사가 붙어 있습니다. 이는 [Angular 템플릿 구문](guide/templates)이라고 불리는 특별한 구문입니다.
* v16 및 이전 버전을 사용하는 애플리케이션의 경우 [NgFor에 대한 Angular 문서](guide/directives/structural-directives)를 참조하세요.

<docs-workflow>

<docs-step title="`users` 속성 추가">
`AppComponent` 클래스에서 사용자와 그들의 이름을 포함하는 `users`라는 속성을 추가합니다.

```ts
[{id: 0, name: 'Sarah'}, {id: 1, name: 'Amy'}, {id: 2, name: 'Rachel'}, {id: 3, name: 'Jessica'}, {id: 4, name: 'Poornima'}]
```

</docs-step>

<docs-step title="템플릿 업데이트">
템플릿을 업데이트하여 `@for` 템플릿 구문을 사용하여 각 사용자 이름을 `p` 요소에 표시합니다.

```angular-html
@for (user of users; track user.id) {
  <p>{{ user.name }}</p>
}
```

참고: `track`의 사용은 필수이며, `id` 또는 다른 고유 식별자를 사용할 수 있습니다.

</docs-step>

</docs-workflow>

이러한 유형의 기능을 제어 흐름이라고 합니다. 다음에는 컴포넌트를 사용자 정의하고 통신하는 방법을 배웁니다. 그나저나, 지금까지 잘 하고 계십니다.