# 컴포넌트 호스트 요소

팁: 이 가이드는 여러분이 [필수 가이드](essentials)를 이미 읽었다고 가정합니다. Angular에 처음이라면 먼저 그것을 읽어보세요.

Angular는 컴포넌트의 선택자와 일치하는 HTML 요소마다 컴포넌트의 인스턴스를 생성합니다. 컴포넌트의 선택자와 일치하는 DOM 요소는 해당 컴포넌트의 **호스트 요소**입니다. 컴포넌트의 템플릿 내용은 호스트 요소 내에 렌더링됩니다.

```angular-ts
// 컴포넌트 소스
@Component({
  selector: 'profile-photo',
  template: `
    <img src="profile-photo.jpg" alt="Your profile photo" />
  `,
})
export class ProfilePhoto {}
```

```angular-html
<!-- 컴포넌트 사용 -->
<h3>당신의 프로필 사진</h3>
<profile-photo />
<button>새 프로필 사진 업로드</button>
```

```angular-html
<!-- 렌더링된 DOM -->
<h3>당신의 프로필 사진</h3>
<profile-photo>
  <img src="profile-photo.jpg" alt="Your profile photo" />
</profile-photo>
<button>새 프로필 사진 업로드</button>
```

위의 예에서 `<profile-photo>`는 `ProfilePhoto` 컴포넌트의 호스트 요소입니다.

## 호스트 요소에 바인딩

컴포넌트는 호스트 요소에 속성, 특성 및 이벤트를 바인딩할 수 있습니다. 이는 컴포넌트의 템플릿 내 요소에 대한 바인딩과 동일하게 작동하지만, `@Component` 데코레이터의 `host` 속성으로 정의됩니다:

```angular-ts
@Component({
  ...,
  host: {
    'role': 'slider',
    '[attr.aria-valuenow]': 'value',
    '[class.active]': 'isActive()',
    '[tabIndex]': 'disabled ? -1 : 0',
    '(keydown)': 'updateValue($event)',
  },
})
export class CustomSlider {
  value: number = 0;
  disabled: boolean = false;
  isActive = signal(false);
  updateValue(event: KeyboardEvent) { /* ... */ }

  /* ... */
}
```

## `@HostBinding` 및 `@HostListener` 데코레이터

대안으로 클래스 멤버에 `@HostBinding` 및 `@HostListener` 데코레이터를 적용하여 호스트 요소에 바인딩할 수 있습니다.

`@HostBinding`은 호스트 속성과 특성을 속성 및 메서드에 바인딩할 수 있게 해줍니다:

```angular-ts
@Component({
  /* ... */
})
export class CustomSlider {
  @HostBinding('attr.aria-valuenow')
  value: number = 0;

  @HostBinding('tabIndex')
  getTabIndex() {
    return this.disabled ? -1 : 0;
  }

  /* ... */
}
```

`@HostListener`는 호스트 요소에 이벤트 리스너를 바인딩할 수 있게 해줍니다. 이 데코레이터는 이벤트 이름과 선택적으로 인수 배열을 받습니다:

```ts
export class CustomSlider {
  @HostListener('keydown', ['$event'])
  updateValue(event: KeyboardEvent) {
    /* ... */
  }
}
```

**항상 `@HostBinding` 및 `@HostListener`보다 `host` 속성을 사용하는 것을 선호하세요.** 이 데코레이터는 오직 하위 호환성을 위해 존재합니다.

## 바인딩 충돌

템플릿에서 컴포넌트를 사용할 때 해당 컴포넌트 인스턴스의 요소에 바인딩을 추가할 수 있습니다. 컴포넌트는 동일한 속성이나 특성에 대해 호스트 바인딩도 정의할 수 있습니다.

```angular-ts
@Component({
  ...,
  host: {
    'role': 'presentation',
    '[id]': 'id',
  }
})
export class ProfilePhoto { /* ... */ }
```

```angular-html
<profile-photo role="group" [id]="otherId" />
```

이와 같은 경우, 다음 규칙에 따라 어떤 값이 우선하는지를 결정합니다:

- 두 값이 모두 정적이면 인스턴스 바인딩이 우선합니다.
- 하나의 값이 정적이고 다른 하나가 동적이라면 동적 값이 우선합니다.
- 두 값이 모두 동적이면 컴포넌트의 호스트 바인딩이 우선합니다.