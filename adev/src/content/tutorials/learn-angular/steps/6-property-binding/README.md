# Angular에서의 속성 바인딩

Angular에서의 속성 바인딩은 HTML 요소, Angular 컴포넌트 등의 속성 값 설정을 가능하게 합니다.

속성 바인딩을 사용하여 속성과 속성 값들을 동적으로 설정할 수 있습니다. 버튼 기능 전환, 이미지 경로 프로그램적으로 설정, 컴포넌트 간 값 공유와 같은 작업을 할 수 있습니다.

이 활동에서는 템플릿에서 속성 바인딩을 사용하는 방법을 배웁니다.

<hr />

요소의 속성에 바인딩하려면 속성 이름을 대괄호로 감싸세요. 다음은 예시입니다:

```angular-html
<img alt="photo" [src]="imageURL">
```

이 예시에서 `src` 속성의 값은 `imageURL` 클래스 속성에 바인딩됩니다. `imageURL`이 가진 값이 `img` 태그의 `src` 속성으로 설정됩니다.

<docs-workflow>

<docs-step title="`isEditable`이라는 속성 추가하기" header="app.component.ts" language="ts">
`app.component.ts`의 코드를 업데이트하여 `AppComponent` 클래스에 `isEditable`이라는 속성을 추가하고 초기 값을 `true`로 설정합니다.

<docs-code highlight="[2]">
export class AppComponent {
    isEditable = true;
}
</docs-code>
</docs-step>

<docs-step title="`contentEditable`에 바인딩하기" header="app.component.ts" language="ts">
다음으로, `<code aria-label="square brackets">[]</code>` 구문을 사용하여 `div`의 `contentEditable` 속성을 `isEditable` 속성에 바인딩합니다.

<docs-code highlight="[3]" language="angular-ts">
@Component({
    ...
    template: `<div [contentEditable]="isEditable"></div>`,
})
</docs-code>
</docs-step>

</docs-workflow>

이제 div는 편집 가능합니다. 잘 했어요 👍

속성 바인딩은 Angular의 많은 강력한 기능 중 하나입니다. 더 알고 싶다면 [Angular 문서](guide/templates/property-binding)를 확인하세요.