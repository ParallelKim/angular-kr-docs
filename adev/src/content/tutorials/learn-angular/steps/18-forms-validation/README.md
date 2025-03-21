# 폼 검증

폼 작업 시 흔히 발생하는 또 다른 시나리오는 올바른 데이터가 제출되도록 입력을 검증해야 하는 경우입니다.

이번 활동에서는 반응형 폼으로 폼을 검증하는 방법을 배웁니다.

<hr>

<docs-workflow>

<docs-step title="유효성 검사기 가져오기">

Angular는 일련의 유효성 검사 도구를 제공합니다. 이를 사용하려면 먼저 `@angular/forms`로부터 `Validators`를 가져오도록 구성 요소를 업데이트합니다.

<docs-code language="ts" highlight="[1]">
import {ReactiveFormsModule, Validators} from '@angular/forms';

@Component({...})
export class AppComponent {}
</docs-code>

</docs-step>

<docs-step title="폼에 유효성 검사 추가하기">

모든 `FormControl`은 원하는 유효성 검사기를 전달하여 `FormControl` 값을 검증할 수 있습니다. 예를 들어, `profileForm`의 `name` 필드를 필수로 만들고 싶다면 `Validators.required`를 사용합니다.
우리 Angular 폼의 `email` 필드에서는 비어 있지 않도록 하고 유효한 이메일 주소 구조를 따르도록 하고 싶습니다. 이를 위해 `Validators.required`와 `Validators.email` 유효성 검사기를 배열로 결합할 수 있습니다.
`name`과 `email` `FormControl`을 업데이트합니다:

```ts
profileForm = new FormGroup({
  name: new FormControl('', Validators.required),
  email: new FormControl('', [Validators.required, Validators.email]),
});
```

</docs-step>

<docs-step title="템플릿에서 폼 유효성 검사 확인하기">

폼이 유효한지 판단하기 위해 `FormGroup` 클래스에는 `valid` 속성이 있습니다.
이 속성을 사용하여 동적으로 속성을 바인딩할 수 있습니다. 폼의 유효성에 따라 제출 `button`을 활성화하도록 업데이트합니다.

```angular-html
<button type="submit" [disabled]="!profileForm.valid">제출</button>
```

</docs-step>

</docs-workflow>

이제 반응형 폼에서 유효성 검증이 어떻게 작동하는지 기본을 알게 되었습니다.

Angular에서 폼 작업의 이러한 핵심 개념을 배우는 훌륭한 작업을 해냈습니다. 더 배우고 싶다면 [Angular 폼 문서](guide/forms/form-validation)를 참조하세요.