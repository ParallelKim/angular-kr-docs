# 상속

팁: 이 가이드는 이미 [필수 가이드](essentials)를 읽었고 Angular에 익숙하지 않은 경우 먼저 읽어야 한다고 가정합니다.

Angular 컴포넌트는 TypeScript 클래스이며 표준 JavaScript 상속 의미론에 참여합니다.

컴포넌트는 어떤 기본 클래스도 확장할 수 있습니다:

```ts
export class ListboxBase {
  value: string;
}

@Component({ ... })
export class CustomListbox extends ListboxBase {
  // CustomListbox는 `value` 속성을 상속받습니다.
}
```

## 다른 컴포넌트 및 지시문 확장

컴포넌트가 다른 컴포넌트 또는 지시문을 확장할 때, 기본 클래스의 장식자에 정의된 일부 메타데이터와 기본 클래스의 장식된 멤버를 상속받습니다. 여기에는 호스트 바인딩, 입력, 출력, 생명 주기 메소드가 포함됩니다.

```angular-ts
@Component({
  selector: 'base-listbox',
  template: `
    ...
  `,
  host: {
    '(keydown)': 'handleKey($event)',
  },
})
export class ListboxBase {
  @Input() value: string;
  handleKey(event: KeyboardEvent) {
    /* ... */
  }
}

@Component({
  selector: 'custom-listbox',
  template: `
    ...
  `,
  host: {
    '(click)': 'focusActiveOption()',
  },
})
export class CustomListbox extends ListboxBase {
  @Input() disabled = false;
  focusActiveOption() {
    /* ... */
  }
}
```

위의 예에서 `CustomListbox`는 `ListboxBase`와 관련된 모든 정보를 상속받으며, 자신의 값으로 선택자와 템플릿을 재정의합니다. `CustomListbox`에는 두 개의 입력(`value` 및 `disabled`)과 두 개의 이벤트 리스너(`keydown` 및 `click`)가 있습니다.

자식 클래스는 모든 조상의 입력, 출력 및 호스트 바인딩과 자신의 입력의 _합집합_을 가지게 됩니다.

### 주입된 종속성 전달

기본 클래스가 종속성 주입에 의존하는 경우, 자식 클래스는 이러한 종속성을 `super`에 명시적으로 전달해야 합니다.

```ts
@Component({ ... })
export class ListboxBase {
  constructor(private element: ElementRef) { }
}

@Component({ ... })
export class CustomListbox extends ListboxBase {
  constructor(element: ElementRef) {
    super(element);
  }
}
```

### 생명 주기 메소드 재정의

기본 클래스가 `ngOnInit`와 같은 생명 주기 메소드를 정의하는 경우, `ngOnInit`을 구현하는 자식 클래스는 기본 클래스의 구현을 _재정의_합니다. 기본 클래스의 생명 주기 메소드를 보존하려면 `super`를 사용하여 메소드를 명시적으로 호출하십시오:

```ts
@Component({ ... })
export class ListboxBase {
  protected isInitialized = false;
  ngOnInit() {
    this.isInitialized = true;
  }
}

@Component({ ... })
export class CustomListbox extends ListboxBase {
  override ngOnInit() {
    super.ngOnInit();
    /* ... */
  }
}