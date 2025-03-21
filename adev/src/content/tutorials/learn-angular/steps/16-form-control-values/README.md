# 폼 제어 값 가져오기

Angular로 폼을 설정했으니 다음 단계는 폼 컨트롤에서 값을 가져오는 것입니다.

이번 활동에서는 폼 입력값을 가져오는 방법을 배우게 됩니다.

<hr>

<docs-workflow>

<docs-step title="템플릿에서 입력 필드의 값을 표시하기">

템플릿에서 입력 값을 표시하려면, 컴포넌트의 다른 클래스 속성과 마찬가지로 보간법 구문 `{{}}`을 사용할 수 있습니다:

<docs-code language="angular-ts" highlight="[5]">
@Component({
  selector: 'app-user',
  template: `
    ...
    <p>프레임워크: {{ favoriteFramework }}</p>
    <label for="framework">
      좋아하는 프레임워크:
      <input id="framework" type="text" [(ngModel)]="favoriteFramework" />
    </label>
  `,
})
export class UserComponent {
  favoriteFramework = '';
}
</docs-code>

</docs-step>

<docs-step title="입력 필드의 값을 가져오기">

컴포넌트 클래스에서 입력 필드 값을 참조해야 할 때, `this` 구문으로 클래스 속성에 접근하여 수행할 수 있습니다.

<docs-code language="angular-ts" highlight="[15]">
...
@Component({
  selector: 'app-user',
  template: `
    ...
    <button (click)="showFramework()">프레임워크 표시</button>
  `,
  ...
})
export class UserComponent {
  favoriteFramework = '';
  ...

  showFramework() {
    alert(this.favoriteFramework);
  }
}
</docs-code>

</docs-step>

</docs-workflow>

템플릿에서 입력 값을 표시하고 프로그래밍적으로 접근하는 방법을 배우신 것을 축하합니다.

이제 Angular로 폼을 관리하는 다음 방법인 반응형 폼으로 넘어갈 시간입니다. 템플릿 기반 폼에 대해 더 알고 싶으시면 [Angular 폼 문서](guide/forms/template-driven-forms)를 참조하시기 바랍니다.