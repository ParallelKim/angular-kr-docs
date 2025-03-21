# NgModules

중요: Angular 팀은 모든 새로운 코드에 대해 `NgModule` 대신 [독립 구성 요소](guide/components/anatomy-of-components#-imports-in-the-component-decorator)를 사용하는 것을 권장합니다. 이 가이드는 `@NgModule`로 작성된 기존 코드를 이해하는 데 도움이 됩니다.

NgModule은 `@NgModule` 데코레이터로 표시된 클래스입니다. 이 데코레이터는 Angular가 구성 요소 템플릿을 컴파일하고 종속성 주입을 구성하는 방법을 알려주는 *메타데이터*를 수락합니다.

```typescript
import {NgModule} from '@angular/core';

@NgModule({
  // 메타데이터가 여기에 옵니다
})
export class CustomMenuModule { }
```

NgModule은 두 가지 주요 책임이 있습니다:
* NgModule에 속하는 구성 요소, 지시자 및 파이프를 선언하는 것
* NgModule을 가져오는 구성 요소, 지시자 및 파이프에 대한 공급자를 주입기에 추가하는 것

## 선언

`@NgModule` 메타데이터의 `declarations` 속성은 NgModule에 속하는 구성 요소, 지시자 및 파이프를 선언합니다.

```typescript
@NgModule({
  /* ... */
  // CustomMenu와 CustomMenuItem은 구성 요소입니다.
  declarations: [CustomMenu, CustomMenuItem],
})
export class CustomMenuModule { }
```

위의 예에서 `CustomMenu`와 `CustomMenuItem` 구성 요소는 `CustomMenuModule`에 속합니다.

`declarations` 속성은 또한 구성 요소, 지시자 및 파이프의 _배열_을 수락합니다. 이러한 배열은 다른 배열을 포함할 수도 있습니다.

```typescript
const MENU_COMPONENTS = [CustomMenu, CustomMenuItem];
const WIDGETS = [MENU_COMPONENTS, CustomSlider];

@NgModule({
  /* ... */
  // 이 NgModule은 CustomMenu, CustomMenuItem,
  // CustomSlider 및 CustomCheckbox를 선언합니다.
  declarations: [WIDGETS, CustomCheckbox],
})
export class CustomMenuModule { }
```

Angular가 두 개 이상의 NgModule에서 선언된 구성 요소, 지시자 또는 파이프를 발견하면 오류를 보고합니다.

모든 구성 요소, 지시자 또는 파이프는 NgModule에 선언되기 위해 명시적으로 `standalone: false`로 표시되어야 합니다.

```typescript
@Component({
  // 이 구성 요소를 `standalone: false`로 표시하여 NgModule에 선언할 수 있도록 합니다.
  standalone: false,
  /* ... */
})
export class CustomMenu { /* ... */ }
```

### 가져오기

NgModule에서 선언된 구성 요소는 다른 구성 요소, 지시자 및 파이프에 의존할 수 있습니다. 이러한 의존성을 `@NgModule` 메타데이터의 `imports` 속성에 추가합니다.

```typescript
@NgModule({
  /* ... */
  // CustomMenu와 CustomMenuItem은 PopupTrigger 및 SelectorIndicator 구성 요소에 의존합니다.
  imports: [PopupTrigger, SelectionIndicator],
  declarations: [CustomMenu, CustomMenuItem],
})
export class CustomMenuModule { }
```

`imports` 배열은 다른 NgModule은 물론 독립 구성 요소, 지시자 및 파이프도 수용합니다.

### 내보내기

NgModule은 선언한 구성 요소, 지시자 및 파이프를 _내보낼_ 수 있어 다른 구성 요소 및 NgModule에서 사용할 수 있게 합니다.

 ```typescript
@NgModule({
  imports: [PopupTrigger, SelectionIndicator],
  declarations: [CustomMenu, CustomMenuItem],

  // CustomMenu와 CustomMenuItem을 사용할 수 있게 하여
  // CustomMenuModule을 가져오는 구성 요소 및 NgModule에서 사용합니다.
  exports: [CustomMenu, CustomMenuItem],
})
export class CustomMenuModule { }
```

`exports` 속성은 선언에 한정되지 않습니다. NgModule은 또한 가져오는 다른 구성 요소, 지시자, 파이프 및 NgModule을 내보낼 수 있습니다.

 ```typescript
@NgModule({
  imports: [PopupTrigger, SelectionIndicator],
  declarations: [CustomMenu, CustomMenuItem],

  // 또한 CustomMenuModule을 가져오는 모든 구성 요소 또는 NgModule에서 PopupTrigger를 사용할 수 있게 합니다.
  exports: [CustomMenu, CustomMenuItem, PopupTrigger],
})
export class CustomMenuModule { }
```

## `NgModule` 공급자

팁: 종속성 주입 및 공급자에 대한 정보는 [종속성 주입 가이드](guide/di)를 참조하세요.

`NgModule`은 주입된 종속성에 대한 `providers`를 지정할 수 있습니다. 이러한 공급자는 다음에 사용할 수 있습니다:
* NgModule을 가져오는 모든 독립 구성 요소, 지시자 또는 파이프
* NgModule을 가져오는 모든 _다른_ NgModule의 `declarations` 및 `providers`

```typescript
@NgModule({
  imports: [PopupTrigger, SelectionIndicator],
  declarations: [CustomMenu, CustomMenuItem],

  // OverlayManager 서비스를 제공합니다
  providers: [OverlayManager],
  /* ... */
})
export class CustomMenuModule { }

@NgModule({
  imports: [CustomMenuModule],
  declarations: [UserProfile],
  providers: [UserDataClient],
})
export class UserProfileModule { }
```

위의 예에서:
* `CustomMenuModule`은 `OverlayManager`를 제공합니다.
* `CustomMenu` 및 `CustomMenuItem` 구성 요소는 `CustomMenuModule`에 선언되었기 때문에 `OverlayManager`를 주입할 수 있습니다.
* `UserProfile`은 자신의 NgModule이 `CustomMenuModule`을 가져오기 때문에 `OverlayManager`를 주입할 수 있습니다.
* `UserDataClient`는 자신의 NgModule이 `CustomMenuModule`을 가져오기 때문에 `OverlayManager`를 주입할 수 있습니다.

### `forRoot` 및 `forChild` 패턴

일부 NgModule은 구성을 수락하고 공급자 배열을 반환하는 정적 `forRoot` 메서드를 정의합니다. "`forRoot`"라는 이름은 이러한 공급자가 부트스트랩 중에 애플리케이션의 _루트_에만 추가되도록 의도되었음을 나타내는 관례입니다.

이 방식으로 포함된 모든 공급자는 즉시 로드되며, 초기 페이지 로드의 JavaScript 번들 크기를 증가시킵니다.

```typescript
boorstrapApplication(MyApplicationRoot, {
  providers: [
    CustomMenuModule.forRoot(/* some config */),
  ],
});
```

유사하게, 일부 NgModule은 구성 요소 내에서 추가하도록 의도된 공급자를 나타내는 정적 `forChild`를 정의할 수 있습니다.

```typescript
@Component({
  /* ... */
  providers: [
    CustomMenuModule.forChild(/* some config */),
  ],
})
export class UserProfile { /* ... */ }
```

## 애플리케이션 부트스트랩

중요: Angular 팀은 모든 새로운 코드를 위해 `bootstrapModule` 대신 [bootstrapApplication](api/platform-browser/bootstrapApplication)을 사용하는 것을 권장합니다. 이 가이드는 `@NgModule`로 부트스트랩된 기존 애플리케이션을 이해하는 데 도움이 됩니다.

`@NgModule` 데코레이터는 하나 이상의 구성 요소를 포함할 수 있는 선택적 `bootstrap` 배열을 수락합니다.

Angular 애플리케이션을 시작하려면 [`platformBrowser`](api/platform-browser/platformBrowser) 또는 [`platformServer`](api/platform-server/platformServer)에서 [`bootstrapModule`](https://angular.dev/api/core/PlatformRef#bootstrapModule) 메서드를 사용할 수 있습니다. 이 함수가 실행되면 페이지에서 나열된 구성 요소의 CSS 선택자와 일치하는 요소를 찾고 해당 구성 요소를 페이지에 렌더링합니다.

```typescript
import {platformBrowser} from '@angular/platform-browser';

@NgModule({
  bootstrap: [MyApplication],
})
export class MyApplicationModule { }

platformBrowser().bootstrapModule(MyApplicationModule);
```

`bootstrap`에 나열된 구성 요소는 NgModule의 선언에 자동으로 포함됩니다.

NgModule에서 애플리케이션을 부트스트랩할 때 이 모듈의 수집된 `providers`와 모든 `imports`의 `providers`가 즉시 로드되고 애플리케이션 전체에 주입할 수 있게 됩니다.