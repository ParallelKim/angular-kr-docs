<docs-decorative-header title="신호" imgSrc="adev/src/assets/images/signals.svg"> <!-- markdownlint-disable-line -->
동적 데이터를 생성하고 관리하세요.
</docs-decorative-header>

Angular에서는 *신호*를 사용하여 상태를 생성하고 관리합니다. 신호는 값을 감싸는 경량 래퍼입니다.

`signal` 함수를 사용하여 로컬 상태를 보유할 신호를 생성합니다:

```typescript
import {signal} from '@angular/core';

// `signal` 함수를 사용하여 신호를 생성합니다.
const firstName = signal('Morgan');

// 신호 값을 읽으려면 호출하십시오—신호는 함수입니다.
console.log(firstName());

// 새로운 값으로 `set` 메서드를 호출하여 이 신호의 값을 변경합니다.
firstName.set('Jaime');

// 이전 값에 따라 값을 변경하기 위해 `update` 메서드도 사용할 수 있습니다.
firstName.update(name => name.toUpperCase());
```

Angular는 신호가 읽히는 위치와 업데이트되는 시기를 추적합니다. 프레임워크는 이 정보를 사용하여 새 상태로 DOM을 업데이트하는 등의 추가 작업을 수행합니다. 시간이 지남에 따라 변경되는 신호 값에 반응하는 이 능력을 *반응성*이라고 합니다.

## 계산된 표현식

`computed`는 다른 신호를 기반으로 값을 생성하는 신호입니다.

```typescript
import {signal, computed} from '@angular/core';

const firstName = signal('Morgan');
const firstNameCapitalized = computed(() => firstName().toUpperCase());

console.log(firstNameCapitalized()); // MORGAN
``` 

`computed` 신호는 읽기 전용이며, `set` 또는 `update` 메서드가 없습니다. 대신, 읽는 신호가 변경될 때 `computed` 신호의 값은 자동으로 변경됩니다:

```typescript
import {signal, computed} from '@angular/core';

const firstName = signal('Morgan');
const firstNameCapitalized = computed(() => firstName().toUpperCase());
console.log(firstNameCapitalized()); // MORGAN

firstName.set('Jaime');
console.log(firstNameCapitalized()); // JAIME
```

## 구성 요소에서 신호 사용하기

너의 구성 요소 안에서 상태를 생성하고 관리하기 위해 `signal`과 `computed`를 사용하세요:

```typescript
@Component({/* ... */})
export class UserProfile {
  isTrial = signal(false);
  isTrialExpired = signal(false);
  showTrialDuration = computed(() => this.isTrial() && !this.isTrialExpired());

  activateTrial() {
    this.isTrial.set(true);
  }
}
```

팁: Angular 신호에 대해 더 알고 싶나요? 전체 세부정보는 [심층 신호 가이드](guide/signals)를 참조하세요.

## 다음 단계

동적 데이터를 선언하고 관리하는 방법을 배웠으니, 이제 템플릿 내에서 그 데이터를 사용하는 방법을 배울 시간입니다.

<docs-pill-row>
  <docs-pill title="템플릿을 사용한 동적 인터페이스" href="essentials/templates" />
  <docs-pill title="심층 신호 가이드" href="guide/signals" />
</docs-pill-row>