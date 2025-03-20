# 이벤트 처리

이벤트 처리는 웹 앱에서 인터랙티브한 기능을 활성화합니다. 개발자로서 버튼 클릭, 양식 제출 등의 사용자 작업에 반응할 수 있는 기능을 제공합니다.

이번 활동에서는 이벤트 핸들러를 추가하는 방법을 배웁니다.

<hr />

Angular에서는 괄호 문법 `()`를 사용하여 이벤트에 바인딩합니다. 특정 요소에서 바인딩하려는 이벤트를 괄호로 감싸고 이벤트 핸들러를 설정합니다. 다음 `button` 예제를 고려해 보세요:

```angular-ts
@Component({
    ...
    template: `<button (click)="greet()">`
})
class AppComponent {
    greet() {
        console.log('Hello, there 👋');
    }
}
```

이 예제에서 `greet()` 함수는 버튼이 클릭될 때마다 실행됩니다. `greet()` 문법에는 닫는 괄호가 포함되어 있다는 점에 유의하세요.

자, 이제 여러분 차례입니다. 도전해 보세요:

<docs-workflow>

<docs-step title="이벤트 핸들러 추가">
`AppComponent` 클래스에 `onMouseOver` 이벤트 핸들러 함수를 추가하세요. 아래 코드를 구현으로 사용하세요:

```ts
onMouseOver() {
    this.message = 'Way to go 🚀';
}
```

</docs-step>

<docs-step title="템플릿 이벤트에 바인딩">
`app.component.ts`의 템플릿 코드를 업데이트하여 `section` 요소의 `mouseover` 이벤트에 바인딩하세요.

```angular-html
<section (mouseover)="onMouseOver()">
```

</docs-step>

</docs-workflow>

코드에서 몇 단계만으로 Angular에서 첫 번째 이벤트 핸들러를 만들었습니다. 점점 더 잘하고 있는 것 같네요, 계속해서 좋은 작업 유지하세요.