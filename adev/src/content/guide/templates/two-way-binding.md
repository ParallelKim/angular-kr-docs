# 양방향 바인딩

**양방향 바인딩**은 값을 요소에 동시에 바인딩하고, 해당 요소가 이 바인딩을 통해 변경 사항을 전파할 수 있는 기능을 부여하는 약어입니다.

## 문법

양방향 바인딩의 문법은 대괄호와 괄호의 조합인 `[()]`입니다. 이는 속성 바인딩의 문법인 `[]`와 이벤트 바인딩의 문법인 `()`를 조합한 것입니다. Angular 커뮤니티에서는 이 문법을 비공식적으로 "바나나 인 박스"라고 부릅니다.

## 양방향 바인딩을 이용한 폼 컨트롤

개발자들은 일반적으로 사용자가 폼 컨트롤과 상호작용할 때 컴포넌트 데이터를 동기화하기 위해 양방향 바인딩을 사용합니다. 예를 들어, 사용자가 텍스트 입력을 작성하면 컴포넌트의 상태가 업데이트되어야 합니다.

다음 예는 페이지에서 `firstName` 속성을 동적으로 업데이트합니다:

```angular-ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  template: `
    <main>
      <h2>Hello {{ firstName }}!</h2>
      <input type="text" [(ngModel)]="firstName" />
    </main>
  `
})
export class AppComponent {
  firstName = 'Ada';
}
```

네이티브 폼 컨트롤과 함께 양방향 바인딩을 사용하려면 다음이 필요합니다:

1. `@angular/forms`에서 `FormsModule`을 가져옵니다.
2. 양방향 바인딩 문법을 사용하여 `ngModel` 지시어를 사용합니다 (예: `[(ngModel)]`).
3. 업데이트할 상태를 할당합니다 (예: `firstName`).

이 설정이 완료되면 Angular는 텍스트 입력의 모든 업데이트가 컴포넌트 상태에 올바르게 반영되도록 보장합니다!

공식 문서에서 [`NgModel`](guide/directives#displaying-and-updating-properties-with-ngmodel)에 대해 더 알아보세요.

## 컴포넌트 간 양방향 바인딩

부모 컴포넌트와 자식 컴포넌트 간의 양방향 바인딩은 폼 요소에 비해 더 많은 구성이 필요합니다.

다음 예에서는 `AppComponent`가 초기 카운트 상태를 설정하는 책임이 있지만, 카운터의 UI를 업데이트하고 렌더링하는 로직은 주로 자식 `CounterComponent` 내에 존재합니다.

```angular-ts
// ./app.component.ts
import { Component } from '@angular/core';
import { CounterComponent } from './counter/counter.component';

@Component({
  selector: 'app-root',
  imports: [CounterComponent],
  template: `
    <main>
      <h1>Counter: {{ initialCount }}</h1>
      <app-counter [(count)]="initialCount"></app-counter>
    </main>
  `,
})
export class AppComponent {
  initialCount = 18;
}
```

```angular-ts
// './counter/counter.component.ts';
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button (click)="updateCount(-1)">-</button>
    <span>{{ count() }}</span>
    <button (click)="updateCount(+1)">+</button>
  `,
})
export class CounterComponent {
  count = model<number>(0);

  updateCount(amount: number): void {
    this.count.update(currentCount => currentCount + amount);
  }
}
```

### 컴포넌트 간 양방향 바인딩 활성화

위의 예제를 핵심으로 나누면, 각 컴포넌트에 대한 양방향 바인딩은 다음을 요구합니다:

자식 컴포넌트는 `model` 속성을 포함해야 합니다.

여기 간단한 예가 있습니다:

```angular-ts
// './counter/counter.component.ts';
import { Component, model } from '@angular/core';

@Component({ // 간결함을 위해 생략됨 })
export class CounterComponent {
  count = model<number>(0);

  updateCount(amount: number): void {
    this.count.update(currentCount => currentCount + amount);
  }
}
```

부모 컴포넌트는 다음을 수행해야 합니다:

1. 양방향 바인딩 문법으로 `model` 속성 이름을 감쌉니다.
2. `model` 속성에 속성 또는 신호를 할당합니다.

여기 간단한 예가 있습니다:

```angular-ts
// ./app.component.ts
import { Component } from '@angular/core';
import { CounterComponent } from './counter/counter.component';

@Component({
  selector: 'app-root',
  imports: [CounterComponent],
  template: `
    <main>
      <app-counter [(count)]="initialCount"></app-counter>
    </main>
  `,
})
export class AppComponent {
  initialCount = 18;
}