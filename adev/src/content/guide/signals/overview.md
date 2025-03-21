<docs-decorative-header title="Angular Signals" imgSrc="adev/src/assets/images/signals.svg"> <!-- markdownlint-disable-line -->
Angular Signals는 애플리케이션 전반에서 상태가 어떻게 그리고 어디에서 사용되는지를 세부적으로 추적하는 시스템으로, 프레임워크가 렌더링 업데이트를 최적화하도록 도와줍니다.
</docs-decorative-header>

Tip: 이 포괄적인 가이드를 시작하기 전에 Angular의 [Essentials](essentials/signals)를 확인하세요.

## 신호란 무엇인가요?

**신호**는 값의 래퍼로, 해당 값이 변경될 때 관심 있는 소비자에게 알리는 역할을 합니다. 신호는 기본형부터 복잡한 데이터 구조까지 모든 값을 포함할 수 있습니다.

신호의 값을 읽으려면 getter 함수를 호출해야 하며, 이를 통해 Angular는 신호가 어디에서 사용되는지 추적할 수 있습니다.

신호는 _읽기 가능_ 또는 _읽기 전용_일 수 있습니다.

### 쓰기 가능한 신호

쓰기가 가능한 신호는 그 값들을 직접 업데이트할 수 있는 API를 제공합니다. 신호의 초기 값을 사용하여 `signal` 함수를 호출함으로써 쓰기 가능한 신호를 생성할 수 있습니다:

```ts
const count = signal(0);

// 신호는 getter 함수입니다 - 이를 호출하면 값이 읽힙니다.
console.log('The count is: ' + count());
```

쓰기가 가능한 신호의 값을 변경하려면, `.set()`을 사용하여 직접 설정할 수 있습니다:

```ts
count.set(3);
```

또는 `.update()` 연산을 사용하여 이전 값을 기반으로 새로운 값을 계산할 수 있습니다:

```ts
// 값을 1 증가시킵니다.
count.update(value => value + 1);
```

쓰기가 가능한 신호는 `WritableSignal` 유형입니다.

### 계산된 신호

**계산된 신호**는 다른 신호에서 값을 파생한 읽기 전용 신호입니다. `computed` 함수를 사용하여 파생 관계를 지정함으로써 계산된 신호를 정의합니다:

```typescript
const count: WritableSignal<number> = signal(0);
const doubleCount: Signal<number> = computed(() => count() * 2);
```

`doubleCount` 신호는 `count` 신호에 의존합니다. `count`가 업데이트될 때마다 Angular는 `doubleCount`도 업데이트해야 함을 인지합니다.

#### 계산된 신호는 지연 평가 및 메모이제이션을 합니다

`doubleCount`의 파생 함수는 처음으로 `doubleCount`를 읽을 때까지 실행되지 않습니다. 계산된 값은 캐시되며, 이후에 `doubleCount`를 다시 읽으면 재계산 없이 캐시된 값을 반환합니다.

그 후 `count`를 변경하면 Angular는 `doubleCount`의 캐시된 값이 더 이상 유효하지 않다고 인식하고, 다음에 `doubleCount`를 읽을 때 새로운 값을 계산합니다.

결과적으로 계산된 신호에서 배열 필터링과 같은 계산적으로 비용이 많이 드는 파생 작업을 안전하게 수행할 수 있습니다.

#### 계산된 신호는 쓰기 가능한 신호가 아닙니다

계산된 신호에 직접 값을 할당할 수 없습니다. 즉,

```ts
doubleCount.set(3);
```

는 `doubleCount`가 `WritableSignal`이 아니기 때문에 컴파일 오류를 발생시킵니다.

#### 계산된 신호 종속성은 동적입니다

파생 중 실제로 읽힌 신호만 추적됩니다. 예를 들어, 이 `computed`에서 `count` 신호는 `showCount` 신호가 true일 때만 읽힙니다:

```ts
const showCount = signal(false);
const count = signal(0);
const conditionalCount = computed(() => {
  if (showCount()) {
    return `The count is ${count()}.`;
  } else {
    return 'Nothing to see here!';
  }
});
```

`conditionalCount`를 읽을 때, 만약 `showCount`가 `false`라면 "Nothing to see here!" 메시지가 반환되며, `count` 신호는 읽히지 않습니다. 이는 이후에 `count`를 업데이트해도 `conditionalCount`의 재계산을 초래하지 않음을 의미합니다.

`showCount`를 `true`로 설정하고 다시 `conditionalCount`를 읽으면, 파생이 다시 실행되고 `showCount`가 `true`인 경우의 브랜치를 선택하여 `count`의 값을 보여주는 메시지를 반환합니다. `count`를 변경하면 `conditionalCount`의 캐시된 값이 무효화됩니다.

파생 중 종속성을 제거할 수도 있으며 추가할 수도 있다는 점에 유의하세요. 나중에 `showCount`를 다시 `false`로 설정하면 `count`는 더 이상 `conditionalCount`의 종속성으로 간주되지 않습니다.

## `OnPush` 컴포넌트에서 신호 읽기

`OnPush` 컴포넌트의 템플릿 내에서 신호를 읽을 때, Angular는 해당 신호를 컴포넌트의 종속성으로 추적합니다. 해당 신호의 값이 변경되면, Angular는 자동으로 [마크](api/core/ChangeDetectorRef#markforcheck)하여 다음 변경 감지 실행 시 업데이트되도록 합니다. `OnPush` 컴포넌트에 대한 자세한 내용은 [Skipping component subtrees](best-practices/skipping-subtrees) 가이드를 참고하세요.

## 효과

신호는 변경될 때 관심 있는 소비자에게 알리기 때문에 유용합니다. **효과**는 하나 이상의 신호 값이 변경될 때마다 실행되는 작업입니다. `effect` 함수를 사용하여 효과를 생성할 수 있습니다:

```ts
effect(() => {
  console.log(`The current count is: ${count()}`);
});
```

효과는 항상 **최소 한 번 이상** 실행됩니다. 효과가 실행될 때, 어떤 신호 값 읽기가 추적됩니다. 이 신호 값 중 하나라도 변경되면 효과는 다시 실행됩니다. 계산된 신호와 유사하게, 효과는 종속성을 동적으로 추적하며, 최근 실행에서 읽힌 신호만 추적합니다.

효과는 항상 **비동기적으로** 실행되며, 변경 감지 프로세스 중에 발생합니다.

### 효과의 사용 사례

효과는 대부분의 애플리케이션 코드에서 거의 필요하지 않지만 특정 상황에서 유용할 수 있습니다. 다음은 `effect`가 좋은 해결책이 될 수 있는 상황의 몇 가지 예입니다:

* 분석 또는 디버깅 도구로서 표시된 데이터와 변경 시점을 기록하기.
* `window.localStorage`와 데이터를 동기화 유지하기.
* 템플릿 문법으로 표현할 수 없는 사용자 정의 DOM 동작 추가하기.
* `<canvas>`, 차트 라이브러리 또는 기타 서드 파티 UI 라이브러리에 대한 사용자 정의 렌더링 수행하기.

<docs-callout critical title="효과를 사용하지 않아야 할 경우">
상태 변경 전파를 위해 효과를 사용하는 것은 피하세요. 이는 `ExpressionChangedAfterItHasBeenChecked` 오류, 무한 순환 업데이트 또는 불필요한 변경 감지 주기를 초래할 수 있습니다.

대신, 다른 상태에 의존하는 상태 모델링을 위해 `computed` 신호를 사용하세요.
</docs-callout>

### 주입 컨텍스트

기본적으로 [주입 컨텍스트](guide/di/dependency-injection-context) 내에서만 `effect()`를 생성할 수 있습니다(여기서 `inject` 함수에 접근할 수 있습니다). 이 요구 사항을 충족하는 가장 쉬운 방법은 컴포넌트, 지시어 또는 서비스의 `constructor` 내에서 `effect`를 호출하는 것입니다:

```ts
@Component({...})
export class EffectiveCounterComponent {
  readonly count = signal(0);
  constructor() {
    // 새로운 효과를 등록합니다.
    effect(() => {
      console.log(`The count is: ${this.count()}`);
    });
  }
}
```

또는 효과를 필드에 할당할 수 있습니다(설명적인 이름도 부여됨).

```ts
@Component({...})
export class EffectiveCounterComponent {
  readonly count = signal(0);

  private loggingEffect = effect(() => {
    console.log(`The count is: ${this.count()}`);
  });
}
```

생성자 외부에서 효과를 생성하려면 `effect`에 `Injector`를 통해 옵션을 전달할 수 있습니다:

```ts
@Component({...})
export class EffectiveCounterComponent {
  readonly count = signal(0);
  constructor(private injector: Injector) {}

  initializeLogging(): void {
    effect(() => {
      console.log(`The count is: ${this.count()}`);
    }, {injector: this.injector});
  }
}
```

### 효과 제거

효과를 생성할 때, 해당 효과가 포함된 컨텍스트가 파괴되면 자동으로 제거됩니다. 즉, 컴포넌트 내에서 생성된 효과는 컴포넌트가 제거될 때 사라집니다. 지시어, 서비스 등에서도 동일합니다.

효과는 수동으로 제거할 수 있도록 `EffectRef`를 반환하며, `.destroy()` 메서드를 호출하여 제거합니다. 이를 `manualCleanup` 옵션과 결합하여 수동으로 제거될 때까지 지속되는 효과를 만들 수 있습니다. 이러한 효과가 더 이상 필요 없을 때 실제로 정리하는 것에 유의하세요.

## 고급 주제

### 신호 동등성 함수

신호를 생성할 때 선택적으로 동등성 함수를 제공할 수 있으며, 이는 새 값이 실제로 이전 값과 다른지 확인하는 데 사용됩니다.

```ts
import _ from 'lodash';

const data = signal(['test'], {equal: _.isEqual});

// 이 서로 다른 배열 인스턴스임에도 불구하고, 깊은 동등성
// 함수는 값을 동일하게 간주하므로 신호는
// 어떤 업데이트도 트리거하지 않습니다.
data.set(['test']);
```

동등성 함수는 쓰기 가능한 신호와 계산된 신호 모두에 제공될 수 있습니다.

도움말: 기본적으로 신호는 참조 동등성([`Object.is()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/is) 비교)를 사용합니다.

### 종속성 추적 없이 읽기

드물게, 계산된 `computed` 또는 `effect`와 같은 반응형 함수 내에서 신호를 읽으면서 종속성을 생성하지 않고 코드를 실행하고 싶을 수 있습니다.

예를 들어, `currentUser`가 변경될 때 `counter`의 값을 기록해야 한다고 가정해 보겠습니다. 두 신호를 읽는 `effect`를 생성할 수 있습니다:

```ts
effect(() => {
  console.log(`User set to ${currentUser()} and the counter is ${counter()}`);
});
```

이 예제는 `currentUser` 또는 `counter`가 변경될 때 메시지를 기록합니다. 그러나 효과가 `currentUser` 변경 시에만 실행되어야 하고, `counter`의 읽기는 단순한 부수적 효과여야 하기 때문에 `counter`에 대한 변화가 새로운 메시지를 기록해서는 안 됩니다.

신호 읽기가 추적되는 것을 방지하려면 `untracked`로 getter를 호출하면 됩니다:

```ts
effect(() => {
  console.log(`User set to ${currentUser()} and the counter is ${untracked(counter)}`);
});
```

`untracked`는 효과가 종속성으로 간주되지 않아야 하는 외부 코드를 호출할 때도 유용합니다:

```ts
effect(() => {
  const user = currentUser();
  untracked(() => {
    // `loggingService`가 신호를 읽으면, 이는
    // 이 효과의 종속성으로 간주되지 않습니다.
    this.loggingService.log(`User set to ${user}`);
  });
});
```

### 효과 정리 함수

효과는 장기 실행 작업을 시작할 수 있으며, 효과가 파괴되거나 첫 번째 작업이 완료되기 전에 다시 실행될 경우 취소해야 합니다. 효과를 생성할 때, 함수는 선택적으로 첫 번째 매개변수로 `onCleanup` 함수를 수락할 수 있습니다. 이 `onCleanup` 함수는 효과의 다음 실행이 시작되기 전에 호출되는 콜백을 등록할 수 있게 해줍니다.

```ts
effect((onCleanup) => {
  const user = currentUser();

  const timer = setTimeout(() => {
    console.log(`1 second ago, the user became ${user}`);
  }, 1000);

  onCleanup(() => {
    clearTimeout(timer);
  });
});
```

## RxJS와 함께 신호 사용하기

신호와 RxJS 간의 상호 운용성에 대한 자세한 내용은 [RxJS interop with Angular signals](ecosystem/rxjs-interop)를 참조하세요.