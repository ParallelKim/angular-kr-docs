# 구성 요소 클래스 업데이트

Angular에서 구성 요소의 로직과 동작은 구성 요소의 TypeScript 클래스에 정의됩니다.

이 활동에서는 구성 요소 클래스를 업데이트하는 방법과 [보간법](/guide/templates/binding#render-dynamic-text-with-text-interpolation)을 사용하는 방법을 배우게 됩니다.

<hr />

<docs-workflow>

<docs-step title="`city`라는 속성 추가">
`AppComponent` 클래스에 `city`라는 속성을 추가하여 구성 요소 클래스를 업데이트합니다.

```ts
export class AppComponent {
  city = 'San Francisco';
}
```

`city` 속성은 `string` 유형이지만 [TypeScript의 유형 추론](https://www.typescriptlang.org/docs/handbook/type-inference.html) 덕분에 유형을 생략할 수 있습니다. `city` 속성은 `AppComponent` 클래스에서 사용될 수 있으며 구성 요소 템플릿에서도 참조할 수 있습니다.

<br>

템플릿에서 클래스 속성을 사용하려면 `{{ }}` 구문을 사용해야 합니다.
</docs-step>

<docs-step title="구성 요소 템플릿 업데이트">
다음 HTML에 맞게 `template` 속성을 업데이트합니다:

```ts
template: `Hello {{ city }}`,
```

이는 보간법의 예이며 Angular 템플릿 구문에 포함됩니다. 이를 통해 템플릿에 동적 텍스트 외에도 훨씬 더 많은 작업을 수행할 수 있습니다. 이 구문을 사용하여 함수 호출, 표현식 작성 등을 할 수도 있습니다.
</docs-step>

<docs-step title="보간법에 대한 추가 연습">
다음과 같이 `1 + 1`이라는 내용을 가진 또 다른 세트의 `{{ }}`를 추가해 보십시오:

```ts
template: `Hello {{ city }}, {{ 1 + 1 }}`,
```

Angular는 `{{ }}`의 내용을 평가하고 템플릿에 출력 결과를 렌더링합니다.
</docs-step>

</docs-workflow>

이것은 Angular 템플릿으로 가능한 것의 시작에 불과합니다. 계속 학습하여 더 많은 내용을 발견하세요.