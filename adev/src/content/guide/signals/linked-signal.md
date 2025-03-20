# `linkedSignal`을 사용한 종속 상태

중요: `linkedSignal`은 [개발자 미리 보기](reference/releases#developer-preview)입니다. 사용해 볼 준비가 되었지만 안정화되기 전까지 변경될 수 있습니다.

Angular 코드에서 상태를 유지하는 데 `signal` 함수를 사용할 수 있습니다. 때때로 이 상태는 일부 _다른_ 상태에 따라 달라집니다. 예를 들어 사용자가 주문의 배송 방법을 선택하도록 허용하는 구성 요소를 생각해 보십시오:

```typescript
@Component({/* ... */})
export class ShippingMethodPicker {
  shippingOptions: Signal<ShippingMethod[]> = getShippingOptions();

  // 기본적으로 첫 번째 배송 옵션을 선택합니다.
  selectedOption = signal(this.shippingOptions()[0]);

  changeShipping(newOptionIndex: number) {
    this.selectedOption.set(this.shippingOptions()[newOptionIndex]);
  }
}
```

이 예에서 `selectedOption`은 기본적으로 첫 번째 옵션으로 설정되지만 사용자가 다른 옵션을 선택하면 변경됩니다. 그러나 `shippingOptions`는 신호입니다— 그 값은 변경될 수 있습니다! `shippingOptions`가 변경되면 `selectedOption`은 더 이상 유효한 옵션이 아닌 값을 포함할 수 있습니다.

**`linkedSignal` 함수는 본질적으로 어떤 다른 상태에 _연결된_ 상태를 유지하는 신호를 생성할 수 있게 해줍니다.** 위의 예를 다시 살펴보면 `linkedSignal`이 `signal`을 대체할 수 있습니다:

```typescript
@Component({/* ... */})
export class ShippingMethodPicker {
  shippingOptions: Signal<ShippingMethod[]> = getShippingOptions();

  // 첫 번째 배송 옵션으로 selectedOption을 초기화합니다.
  selectedOption = linkedSignal(() => this.shippingOptions()[0]);

  changeShipping(index: number) {
    this.selectedOption.set(this.shippingOptions()[index]);
  }
}
```

`linkedSignal`은 `signal`과 유사하게 작동하지만 한 가지 주요 차이가 있습니다— 기본값을 전달하는 대신 _계산 함수_를 전달합니다. 값이 계산이 변경되면 `linkedSignal`의 값이 계산 결과로 변경됩니다. 이는 `linkedSignal`이 항상 유효한 값을 가지도록 보장하는 데 도움이 됩니다.

다음 예제는 `linkedSignal`의 값이 연결된 상태에 따라 어떻게 변경될 수 있는지를 보여줍니다:

```typescript
const shippingOptions = signal(['Ground', 'Air', 'Sea']);
const selectedOption = linkedSignal(() => shippingOptions()[0]);
console.log(selectedOption()); // 'Ground'

selectedOption.set(shippingOptions()[2]);
console.log(selectedOption()); // 'Sea'

shippingOptions.set(['Email', 'Will Call', 'Postal service']);
console.log(selectedOption()); // 'Email'
```

## 이전 상태 고려하기

일부 경우 `linkedSignal`의 계산은 `linkedSignal`의 이전 값을 고려해야 합니다.

위의 예에서 `selectedOption`은 항상 `shippingOptions`가 변경될 때 첫 번째 옵션으로 업데이트됩니다. 그러나 사용자가 선택한 옵션이 여전히 목록의 어딘가에 있다면 사용자의 선택을 보존하고 싶을 수 있습니다. 이를 수행하기 위해 별도의 _소스_ 및 _계산_과 함께 `linkedSignal`을 생성할 수 있습니다:

```typescript
@Component({/* ... */})
export class ShippingMethodPicker {
  shippingOptions: Signal<ShippingMethod[]> = getShippingOptions();

  selectedOption = linkedSignal<ShippingMethod[], ShippingMethod>({
    // 이 `source`가 변경될 때마다 `selectedOption`은 `computation` 결과로 설정됩니다.
    source: this.shippingOptions,
    computation: (newOptions, previous) => {
      // 새 옵션에 이전에 선택된 옵션이 포함되어 있으면 해당 선택을 보존합니다.
      // 그렇지 않으면 첫 번째 옵션으로 기본 설정합니다.
      return newOptions.find(opt => opt.id === previous?.value?.id) ?? newOptions[0];
    }
  });

  changeShipping(newOptionIndex: number) {
    this.selectedOption.set(this.shippingOptions()[newOptionIndex]);
  }
}
```

`linkedSignal`을 생성할 때 계산만 제공하는 대신 별도의 `source` 및 `computation` 속성이 있는 객체를 전달할 수 있습니다.

`source`는 `computed` 또는 구성 요소 `input`과 같은 모든 신호가 될 수 있습니다. `source`의 값이 변경되면 `linkedSignal`은 제공된 `computation`의 결과로 값을 업데이트합니다.

`computation`은 `source`의 새 값과 `previous` 객체를 받는 함수입니다. `previous` 객체에는 두 개의 속성이 있습니다— `previous.source`는 `source`의 이전 값이고 `previous.value`는 `computation`의 이전 결과입니다. 이러한 이전 값을 사용하여 계산의 새 결과를 결정할 수 있습니다.

## 사용자 정의 동등성 비교

`linkedSignal`은 다른 신호와 마찬가지로 사용자 정의 동등성 함수를 구성할 수 있습니다. 이 함수는 하위 의존성이 해당 `linkedSignal`의 값(계산 결과)이 변경되었는지를 판단하는 데 사용됩니다:

```typescript
const activeUser = signal({id: 123, name: 'Morgan', isAdmin: true});

const activeUserEditCopy = linkedSignal(() => activeUser(), {
  // 동일한 `id`인 경우 사용자를 동일한 것으로 간주합니다.
  equal: (a, b) => a.id === b.id,
});

// 또는, `source`와 `computation`을 분리하는 경우
const activeUserEditCopy = linkedSignal({
  source: activeUser,
  computation: user => user,
  equal: (a, b) => a.id === b.id,
});