# 지시어 구성 API

Angular 지시어는 재사용 가능한 동작을 캡슐화하는 훌륭한 방법을 제공합니다. 지시어는 요소에 속성, CSS 클래스 및 이벤트 리스너를 적용할 수 있습니다.

*지시어 구성 API*를 사용하면 구성 요소 TypeScript 클래스 *내부*에서 구성 요소의 호스트 요소에 지시어를 적용할 수 있습니다.

## 구성 요소에 지시어 추가하기

구성 요소의 장식자에 `hostDirectives` 속성을 추가하여 구성 요소에 지시어를 적용합니다. 이러한 지시어를 *호스트 지시어*라고 부릅니다.

이 예제에서 우리는 지시어 `MenuBehavior`를 `AdminMenu`의 호스트 요소에 적용합니다. 이는 템플릿의 `<admin-menu>` 요소에 `MenuBehavior`를 적용하는 것과 비슷하게 작동합니다.

```typescript
@Component({
  selector: 'admin-menu',
  template: 'admin-menu.html',
  hostDirectives: [MenuBehavior],
})
export class AdminMenu { }
```

프레임워크가 구성 요소를 렌더링할 때 Angular는 각 호스트 지시어의 인스턴스도 생성합니다. 지시어의 호스트 바인딩은 구성 요소의 호스트 요소에 적용됩니다. 기본적으로 호스트 지시어의 입력 및 출력은 구성 요소의 공개 API의 일부로 노출되지 않습니다. 더 많은 정보는 아래의 [입력 및 출력 포함하기](#including-inputs-and-outputs)를 참조하십시오.

**Angular는 컴파일 시간에 호스트 지시어를 정적으로 적용합니다.** 런타임에 동적으로 지시어를 추가할 수 없습니다.

**`hostDirectives`에 사용된 지시어는 `standalone: false`를 지정할 수 없습니다.**

**Angular는 `hostDirectives` 속성에 적용된 지시어의 `selector`를 무시합니다.**

## 입력 및 출력 포함하기

`hostDirectives`를 구성 요소에 적용할 때, 호스트 지시어에서 입력 및 출력은 기본적으로 구성 요소의 API에 포함되지 않습니다. `hostDirectives` 항목을 확장하여 구성 요소의 API에 입력 및 출력을 명시적으로 포함할 수 있습니다:

```typescript
@Component({
  selector: 'admin-menu',
  template: 'admin-menu.html',
  hostDirectives: [{
    directive: MenuBehavior,
    inputs: ['menuId'],
    outputs: ['menuClosed'],
  }],
})
export class AdminMenu { }
```

입력 및 출력을 명시적으로 지정함으로써, `hostDirective`를 가진 구성 요소의 소비자는 이를 템플릿에서 바인딩할 수 있습니다:

```angular-html

<admin-menu menuId="top-menu" (menuClosed)="logMenuClosed()">
```

또한, 입력 및 출력을 `hostDirective`에서 별칭으로 설정하여 구성 요소의 API를 사용자 정의할 수 있습니다:

```typescript
@Component({
  selector: 'admin-menu',
  template: 'admin-menu.html',
  hostDirectives: [{
    directive: MenuBehavior,
    inputs: ['menuId: id'],
    outputs: ['menuClosed: closed'],
  }],
})
export class AdminMenu { }
```

```angular-html

<admin-menu id="top-menu" (closed)="logMenuClosed()">
```

## 다른 지시어에 지시어 추가하기

구성 요소 외에도 다른 지시어에 `hostDirectives`를 추가할 수 있습니다. 이것은 여러 동작의 전이 집합을 가능하게 합니다.

다음 예제에서는 `Menu`와 `Tooltip`이라는 두 개의 지시어를 정의합니다. 그런 다음 `MenuWithTooltip`에서 이 두 지시어의 동작을 구성합니다. 마지막으로 `MenuWithTooltip`을 `SpecializedMenuWithTooltip`에 적용합니다.

`SpecializedMenuWithTooltip`가 템플릿에서 사용될 때, `Menu`, `Tooltip` 및 `MenuWithTooltip`의 모든 인스턴스를 생성합니다. 이러한 각 지시어의 호스트 바인딩은 `SpecializedMenuWithTooltip`의 호스트 요소에 적용됩니다.

```typescript
@Directive({...})
export class Menu { }

@Directive({...})
export class Tooltip { }

// MenuWithTooltip은 여러 다른 지시어의 동작을 집합할 수 있습니다.
@Directive({
  hostDirectives: [Tooltip, Menu],
})
export class MenuWithTooltip { }

// CustomWidget은 MenuWithTooltip에서 이미 구성된 동작을 적용할 수 있습니다.
@Directive({
  hostDirectives: [MenuWithTooltip],
})
export class SpecializedMenuWithTooltip { }
```

## 호스트 지시어 의미론

### 지시어 실행 순서

호스트 지시어는 템플릿에서 직접 사용된 구성 요소 및 지시어와 동일한 생명 주기를 거칩니다. 그러나 호스트 지시어는 항상 적용되는 구성 요소나 지시어보다 _먼저_ 생성자, 생명 주기 훅 및 바인딩을 실행합니다.

다음 예제는 호스트 지시어를 최소한으로 사용하는 방법을 보여줍니다:

```typescript
@Component({
  selector: 'admin-menu',
  template: 'admin-menu.html',
  hostDirectives: [MenuBehavior],
})
export class AdminMenu { }
```

여기서 실행 순서는 다음과 같습니다:

1. `MenuBehavior` 인스턴스화
2. `AdminMenu` 인스턴스화
3. `MenuBehavior`가 입력을 받음(`ngOnInit`)
4. `AdminMenu`가 입력을 받음(`ngOnInit`)
5. `MenuBehavior`가 호스트 바인딩을 적용함
6. `AdminMenu`가 호스트 바인딩을 적용함

이 작업 순서는 `hostDirectives`가 있는 구성 요소가 호스트 지시어에 의해 지정된 모든 호스트 바인딩을 재정의 할 수 있음을 의미합니다.

이 작업 순서는 다음 예제에서 볼 수 있는 호스트 지시어의 중첩 체인으로 확장됩니다.

```typescript
@Directive({...})
export class Tooltip { }

@Directive({
  hostDirectives: [Tooltip],
})
export class CustomTooltip { }

@Directive({
  hostDirectives: [CustomTooltip],
})
export class EvenMoreCustomTooltip { }
```

위의 예제에서 실행 순서는 다음과 같습니다:

1. `Tooltip` 인스턴스화
2. `CustomTooltip` 인스턴스화
3. `EvenMoreCustomTooltip` 인스턴스화
4. `Tooltip`가 입력을 받음(`ngOnInit`)
5. `CustomTooltip`가 입력을 받음(`ngOnInit`)
6. `EvenMoreCustomTooltip`가 입력을 받음(`ngOnInit`)
7. `Tooltip`가 호스트 바인딩을 적용함
8. `CustomTooltip`가 호스트 바인딩을 적용함
9. `EvenMoreCustomTooltip`가 호스트 바인딩을 적용함

### 의존성 주입

`hostDirectives`를 지정한 구성 요소나 지시어는 해당 호스트 지시어의 인스턴스를 주입할 수 있으며 그 반대도 가능합니다.

구성 요소에 호스트 지시어를 적용할 때, 구성 요소와 호스트 지시어 모두 프로바이더를 정의할 수 있습니다.

`hostDirectives`와 해당 호스트 지시어가 동일한 주입 토큰을 제공하는 경우, `hostDirectives`가 정의한 프로바이더가 호스트 지시어가 정의한 프로바이더보다 우선합니다.