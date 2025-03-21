# 파이프

파이프는 템플릿에서 데이터를 변환하는 데 사용되는 함수입니다. 일반적으로 파이프는 부작용을 일으키지 않는 "순수한" 함수입니다. Angular에는 구성 요소에서 가져와 사용할 수 있는 유용한 내장 파이프가 여러 가지 있습니다. 또한 사용자 정의 파이프를 생성할 수도 있습니다.

이 활동에서는 파이프를 가져와 템플릿에서 사용할 것입니다.

<hr>

템플릿에서 파이프를 사용하려면 보간식에 포함하십시오. 다음 예제를 확인해 보세요:

<docs-code language="angular-ts" highlight="[1,5,6]">
import {UpperCasePipe} from '@angular/common';

@Component({
    ...
    template: `{{ loudMessage | uppercase }}`,
    imports: [UpperCasePipe],
})
class AppComponent {
    loudMessage = 'we think you are doing great!'
}
</docs-code>

이제 여러분의 차례입니다:

<docs-workflow>

<docs-step title="LowerCase 파이프 가져오기">
먼저 `@angular/common`에서 `LowerCasePipe`에 대한 파일 수준 가져오기를 추가하여 `app.component.ts`를 업데이트합니다.

```ts
import { LowerCasePipe } from '@angular/common';
```

</docs-step>

<docs-step title="파이프를 템플릿 가져오기에 추가하기">
다음으로 `@Component()` 데코레이터의 `imports`를 업데이트하여 `LowerCasePipe`에 대한 참조를 포함합니다.

<docs-code language="ts" highlight="[3]">
@Component({
    ...
    imports: [LowerCasePipe]
})
</docs-code>

</docs-step>

<docs-step title="템플릿에 파이프 추가하기">
마지막으로 `app.component.ts`에서 템플릿을 업데이트하여 `lowercase` 파이프를 포함합니다:

```ts
template: `{{username | lowercase }}`
```

</docs-step>

</docs-workflow>

파이프는 또한 출력 구성을 위해 매개변수를 받을 수 있습니다. 다음 활동에서 자세히 알아보세요.

P.S. 여러분은 잘하고 있습니다 ⭐️