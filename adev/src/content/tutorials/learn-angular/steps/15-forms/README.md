# 양식 개요

양식은 사용자 입력을 수락할 수 있게 해주기 때문에 많은 앱의 큰 부분입니다. Angular에서 양식이 어떻게 처리되는지 배워봅시다.

Angular에는 템플릿 기반과 반응형의 두 가지 유형의 양식이 있습니다. 다음 몇 가지 활동을 통해 두 가지 모두를 배울 것입니다.

이 활동에서는 템플릿 기반 접근 방식을 사용해 양식을 설정하는 방법을 배울 것입니다.

<hr>

<docs-workflow>

<docs-step title="입력 필드 만들기">

`user.component.ts`에서 `id`를 `framework`로 설정하고, 타입을 `text`로 설정하여 텍스트 입력을 추가하여 템플릿을 업데이트합니다.

```angular-html
<label for="framework">
  좋아하는 프레임워크:
  <input id="framework" type="text" />
</label>
```

</docs-step>

<docs-step title="`FormsModule` 가져오기">

이 양식이 데이터 바인딩 기능을 사용하도록 하려면 `FormsModule`을 가져와야 합니다.

`@angular/forms`에서 `FormsModule`을 가져오고 `UserComponent`의 `imports` 배열에 추가합니다.

<docs-code language="ts" highlight="[2, 7]">
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  ...
  imports: [FormsModule],
})
export class UserComponent {}
</docs-code>

</docs-step>

<docs-step title="입력 값에 바인딩 추가 하기">

`FormsModule`에는 입력 값과 클래스의 속성을 바인딩하는 `ngModel`이라는 지시어가 있습니다.

입력을 업데이트하여 `ngModel` 지시어를 사용하고, 다음 구문 `[(ngModel)]="favoriteFramework"`로 `favoriteFramework` 속성과 바인딩합니다.

<docs-code language="html" highlight="[3]">
<label for="framework">
  좋아하는 프레임워크:
  <input id="framework" type="text" [(ngModel)]="favoriteFramework" />
</label>
</docs-code>

변경을 완료한 후 입력 필드에 값을 입력해 보세요. 화면에서 어떻게 업데이트되는지 주목하세요 (네, 정말 멋집니다).

참고: 구문 `[()]`은 "상자 속의 바나나"라고 알려져 있지만, 양방향 바인딩: 속성 바인딩과 이벤트 바인딩을 나타냅니다. [양방향 데이터 바인딩에 대한 Angular 문서](guide/templates/two-way-binding)에서 더 많은 정보를 알아보세요.

</docs-step>

</docs-workflow>

이제 Angular로 양식을 구축하는 중요한 첫 단계를 밟았습니다.

잘했어요. 이 momentum을 계속 유지해봅시다!