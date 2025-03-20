# 부모 컴포넌트에서 `ng-content`로 템플릿 렌더링

`<ng-content>`는 마크업이나 템플릿 조각을 수용하고 컴포넌트가 콘텐츠를 렌더링하는 방법을 제어하는 특별한 요소입니다. 실제 DOM 엘리먼트를 렌더링하지 않습니다.

다음은 부모로부터 모든 마크업을 수용하는 `BaseButton` 컴포넌트의 예입니다.

```angular-ts
// ./base-button/base-button.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'button[baseButton]',
  template: `
      <ng-content />
  `,
})
export class BaseButton {}
```

```angular-ts
// ./app.component.ts
import { Component } from '@angular/core';
import { BaseButton } from './base-button/base-button.component.ts';

@Component({
  selector: 'app-root',
  imports: [BaseButton],
  template: `
    <button baseButton>
      다음 <span class="icon arrow-right" />
    </button>
  `,
})
export class AppComponent {}
```

자세한 내용은 다른 방법으로 이 패턴을 활용할 수 있는 [`<ng-content>` 심층 가이드](/guide/components/content-projection)를 확인하세요.