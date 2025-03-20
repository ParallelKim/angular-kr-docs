# 컴포넌트 구성

당신은 컴포넌트 템플릿, 컴포넌트 로직, 그리고 컴포넌트 스타일을 업데이트하는 법을 배웠지만, 애플리케이션에서 컴포넌트를 어떻게 사용할 수 있을까요?

컴포넌트 구성의 `selector` 속성은 다른 템플릿에서 컴포넌트를 참조할 때 사용할 이름을 제공합니다. `selector`는 HTML 태그처럼 사용하며, 예를 들어 `app-user`는 템플릿에서 `<app-user />`로 사용됩니다.

이 활동에서는 컴포넌트를 구성하는 방법을 배울 것입니다.

<hr/>

이 예제에서는 두 개의 컴포넌트인 `UserComponent`와 `AppComponent`가 있습니다.

<docs-workflow>

<docs-step title="Add a reference to `UserComponent`">
`UserComponent`에 대한 참조를 포함하도록 `AppComponent` 템플릿을 업데이트합니다. 이때 `app-user` 선택자를 사용합니다. `UserComponent`를 `AppComponent`의 imports 배열에 추가해야 하며, 이는 `AppComponent` 템플릿에서 사용할 수 있게 합니다.

```ts
template: `<app-user />`,
imports: [UserComponent]
```

이제 컴포넌트는 `Username: youngTech`라는 메시지를 표시합니다. 더 많은 마크업을 포함하도록 템플릿 코드를 업데이트할 수 있습니다.
</docs-step>

<docs-step title="Add more markup">
템플릿에는 원하는 HTML 마크업을 사용할 수 있으므로 `AppComponent`의 템플릿을 업데이트하여 더 많은 HTML 요소를 포함하도록 해보세요. 이 예제에서는 `<app-user>` 요소의 부모로 `<section>` 요소를 추가합니다.

```ts
template: `<section><app-user /></section>`,
```

</docs-step>

</docs-workflow>
애플리케이션 아이디어를 현실로 가져오기 위해 필요한 만큼 많은 HTML 마크업과 많은 컴포넌트를 사용할 수 있습니다. 심지어 같은 페이지에 컴포넌트를 여러 번 복사하여 사용할 수도 있습니다.

그렇다면 데이터를 기반으로 컴포넌트를 조건부로 표시하려면 어떻게 해야 할까요? 다음 섹션으로 가서 알아보세요.