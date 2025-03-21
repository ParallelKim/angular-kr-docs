# Angular의 구성 요소

구성 요소는 모든 Angular 애플리케이션의 기본 빌딩 블록입니다. 각 구성 요소는 세 부분으로 나뉩니다:

* TypeScript 클래스
* HTML 템플릿
* CSS 스타일

이 활동에서는 구성 요소의 템플릿과 스타일을 업데이트하는 방법을 배웁니다.

<hr />

Angular를 시작할 수 있는 좋은 기회입니다.

<docs-workflow>

<docs-step title="구성 요소 템플릿 업데이트">
`template` 속성을 `Hello Universe`로 읽도록 업데이트합니다.

```ts
template: `
  Hello Universe
`,
```

HTML 템플릿을 변경했을 때, 미리보기가 여러분의 메시지로 업데이트되었습니다. 한 단계 더 나아가 보겠습니다: 텍스트의 색상을 변경합니다.
</docs-step>

<docs-step title="구성 요소 스타일 업데이트">
스타일 값을 업데이트하고 `color` 속성을 `blue`에서 `#a144eb`로 변경합니다.

```ts
styles: `
  :host {
    color: #a144eb;
  }
`,
```

미리보기를 확인하면 텍스트 색상이 변경된 것을 발견할 수 있습니다.
</docs-step>

</docs-workflow>

Angular에서는 사용할 수 있는 모든 브라우저 지원 CSS 및 HTML을 사용할 수 있습니다. 원하시면, 템플릿과 스타일을 별도의 파일에 저장할 수 있습니다.