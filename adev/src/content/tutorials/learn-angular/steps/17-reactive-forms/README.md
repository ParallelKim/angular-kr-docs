# 반응형 폼

템플릿에만 의존하는 대신 프로그램적으로 폼을 관리하고 싶을 때, 반응형 폼이 해결책입니다.

이 활동에서는 반응형 폼을 설정하는 방법을 배우게 됩니다.

<hr>

<docs-workflow>

<docs-step title="`ReactiveForms` 모듈 가져오기">

`app.component.ts`에서 `@angular/forms`에서 `ReactiveFormsModule`을 가져오고 컴포넌트의 `imports` 배열에 추가합니다.

```angular-ts
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  template: `
    <form>
      <label>Name
        <input type="text" />
      </label>
      <label>Email
        <input type="email" />
      </label>
      <button type="submit">제출</button>
    </form>
  `,
  imports: [ReactiveFormsModule],
})
```

</docs-step>

<docs-step title="FormControls로 `FormGroup` 객체 생성">

반응형 폼은 폼 컨트롤(예: 입력)을 나타내기 위해 `FormControl` 클래스를 사용합니다. Angular는 개발자가 큰 폼을 더 쉽게 처리할 수 있도록 돕는 폼 컨트롤의 그룹화를 위한 `FormGroup` 클래스를 제공합니다.

각 폼에 대해 `name`과 `email` 속성을 가진 FormControls로 FormGroup을 생성할 수 있도록 `@angular/forms`에서 `FormControl`과 `FormGroup`을 가져옵니다.

```ts
import {ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
...
export class AppComponent {
  profileForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
  });
}
```

</docs-step>

<docs-step title="폼에 FormGroup과 FormControls 연결">

각 `FormGroup`은 `[formGroup]` 지시어를 사용하여 폼에 연결해야 합니다.

또한, 각 `FormControl`은 `formControlName` 지시어로 연결되어 해당 속성에 할당될 수 있습니다. 다음 폼 코드로 템플릿을 업데이트하세요:

```angular-html
<form [formGroup]="profileForm">
  <label>
    Name
    <input type="text" formControlName="name" />
  </label>
  <label>
    Email
    <input type="email" formControlName="email" />
  </label>
  <button type="submit">제출</button>
</form>
```

</docs-step>

<docs-step title="폼 업데이트 처리">

`FormGroup`의 데이터에 접근하려면 `FormGroup`의 값을 통해 접근할 수 있습니다. 폼 값을 표시하기 위해 `template`을 업데이트하세요:

```angular-html
...
<h2>프로필 폼</h2>
<p>Name: {{ profileForm.value.name }}</p>
<p>Email: {{ profileForm.value.email }}</p>
```

</docs-step>

<docs-step title="FormGroup 값 접근">
컴포넌트 클래스에 `handleSubmit`이라는 새 메서드를 추가하여 나중에 폼 제출을 처리하는 데 사용할 것입니다.
이 메서드는 폼의 값을 표시할 것이며, FormGroup에서 값을 접근할 수 있습니다.

컴포넌트 클래스에서 폼 제출을 처리하기 위해 `handleSubmit()` 메서드를 추가하세요.

<docs-code language="ts">
handleSubmit() {
  alert(
    this.profileForm.value.name + ' | ' + this.profileForm.value.email
  );
}
</docs-code>
</docs-step>

<docs-step title="폼에 `ngSubmit` 추가">
폼 값을 접근할 수 있게 되었습니다. 이제 제출 이벤트를 처리하고 `handleSubmit` 메서드를 사용할 때입니다.
Angular는 이 특정 목적을 위한 이벤트 핸들러인 `ngSubmit`을 가지고 있습니다. 폼이 제출될 때 `handleSubmit` 메서드를 호출하도록 폼 요소를 업데이트하세요.

<docs-code language="angular-html" highlight="[3]">
<form
  [formGroup]="profileForm"
  (ngSubmit)="handleSubmit()">
</docs-code>

</docs-step>

</docs-workflow>

이렇게 해서 Angular에서 반응형 폼을 다루는 방법을 알게 되었습니다.

이 활동에 대해 훌륭한 작업을 수행했습니다. 계속 진행하여 폼 유효성 검사에 대해 학습하세요.