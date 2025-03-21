# 자식 컴포넌트 참조하기

팁: 이 가이드는 당신이 이미 [기본 가이드](essentials)를 읽었음을 가정합니다. Angular에 처음이라면, 먼저 그것을 읽으세요.

컴포넌트는 자식 요소를 찾고 인젝터에서 값을 읽어오는 **쿼리**를 정의할 수 있습니다.

개발자는 일반적으로 쿼리를 사용하여 자식 컴포넌트, 지시자, DOM 요소 등의 참조를 가져옵니다.

모든 쿼리 함수는 가장 최신의 결과를 반영하는 신호를 반환합니다. 신호 함수를 호출하여 결과를 읽을 수 있으며, `computed`나 `effect`와 같은 반응형 컨텍스트에서도 가능합니다.

쿼리는 두 가지 범주가 있습니다: **뷰 쿼리**와 **콘텐츠 쿼리**.

## 뷰 쿼리

뷰 쿼리는 컴포넌트의 _뷰_에 있는 요소로부터 결과를 검색합니다 — 컴포넌트의 자체 템플릿에서 정의된 요소입니다. `viewChild` 함수를 사용하여 단일 결과를 쿼리할 수 있습니다.

<docs-code language="angular-ts" highlight="[14, 15]">
@Component({
  selector: 'custom-card-header',
  /*...*/
})
export class CustomCardHeader {
  text: string;
}

@Component({
  selector: 'custom-card',
  template: '<custom-card-header>Visit sunny California!</custom-card-header>',
})
export class CustomCard {
  header = viewChild(CustomCardHeader);
  headerText = computed(() => this.header()?.text);
}
</docs-code>

이 예제에서 `CustomCard` 컴포넌트는 자식 `CustomCardHeader`를 쿼리하고 `computed`에서 결과를 사용합니다.

쿼리가 결과를 찾지 못하면, 그 값은 `undefined`가 됩니다. 이는 대상 요소가 `@if`로 숨겨져 있을 때 발생할 수 있습니다. Angular는 애플리케이션 상태가 변화함에 따라 `viewChild`의 결과를 최신 상태로 유지합니다.

또한 `viewChildren` 함수를 사용하여 여러 결과를 쿼리할 수 있습니다.

<docs-code language="angular-ts" highlight="[17, 19, 20, 21, 22, 23]">
@Component({
  selector: 'custom-card-action',
  /*...*/
})
export class CustomCardAction {
  text: string;
}

@Component({
  selector: 'custom-card',
  template: `
    <custom-card-action>Save</custom-card-action>
    <custom-card-action>Cancel</custom-card-action>
  `,
})
export class CustomCard {
  actions = viewChildren(CustomCardAction);
  actionsTexts = computed(() => this.actions().map(action => action.text));
}
</docs-code>

`viewChildren`는 쿼리 결과의 `Array`로 신호를 생성합니다.

**쿼리는 컴포넌트 경계를 넘을 수 없습니다.** 뷰 쿼리는 컴포넌트의 템플릿에서만 결과를 검색할 수 있습니다.

## 콘텐츠 쿼리

콘텐츠 쿼리는 컴포넌트의 _내용_에 있는 요소로부터 결과를 검색합니다 — 사용될 템플릿 내에 컴포넌트 내부에 중첩된 요소입니다. `contentChild` 함수를 사용하여 단일 결과를 쿼리할 수 있습니다.

<docs-code language="angular-ts" highlight="[14, 15]">
@Component({
  selector: 'custom-toggle',
  /*...*/
})
export class CustomToggle {
  text: string;
}

@Component({
  selector: 'custom-expando',
  /*...*/
})
export class CustomExpando {
  toggle = contentChild(CustomToggle);
  toggleText = computed(() => this.toggle()?.text);
}

@Component({ 
  /* ... */
  // CustomToggle는 CustomExpando 내부에서 내용으로 사용됩니다.  
  template: `
    <custom-expando>
      <custom-toggle>Show</custom-toggle>
    </custom-expando>
  `
})
export class UserProfile { }
</docs-code>

이 예제에서 `CustomExpando` 컴포넌트는 자식 `CustomToggle`을 쿼리하고 `computed`에서 결과에 접근합니다.

쿼리가 결과를 찾지 못하면, 그 값은 `undefined`가 됩니다. 이는 대상 요소가 존재하지 않거나 `@if`로 숨겨져 있을 때 발생할 수 있습니다. Angular는 애플리케이션 상태가 변화함에 따라 `contentChild`의 결과를 최신 상태로 유지합니다.

기본적으로 콘텐츠 쿼리는 컴포넌트의 _직접_ 자식만 찾으며, 자손으로는 탐색하지 않습니다.

또한 `contentChildren` 함수를 사용하여 여러 결과를 쿼리할 수 있습니다.

<docs-code language="angular-ts" highlight="[14, 16, 17, 18, 19, 20]">
@Component({
  selector: 'custom-menu-item',
  /*...*/
})
export class CustomMenuItem {
  text: string;
}

@Component({
  selector: 'custom-menu',
  /*...*/
})
export class CustomMenu {
  items = contentChildren(CustomMenuItem);
  itemTexts = computed(() => this.items().map(item => item.text));
}

@Component({
  selector: 'user-profile',
  template: `
    <custom-menu>
      <custom-menu-item>Cheese</custom-menu-item>
      <custom-menu-item>Tomato</custom-menu-item>
    </custom-menu>
  `
})
export class UserProfile { }
</docs-code>

`contentChildren`는 쿼리 결과의 `Array`로 신호를 생성합니다.

**쿼리는 컴포넌트 경계를 넘을 수 없습니다.** 콘텐츠 쿼리는 컴포넌트 자체와 동일한 템플릿에서만 결과를 검색할 수 있습니다.

## 필수 쿼리

자식 쿼리(`viewChild` 또는 `contentChild`)가 결과를 찾지 못하면, 그 값은 `undefined`가 됩니다. 이는 대상 요소가 `@if` 또는 `@for`와 같은 제어 흐름 문으로 숨겨져 있을 수 있습니다. 이로 인해 자식 쿼리는 값 유형에 `undefined`가 포함된 신호를 반환합니다.

특히 `viewChild`와 관련하여, 특정 자식이 항상 사용 가능하다는 확신이 있는 경우가 있습니다. 다른 경우에는 특정 자식이 반드시 존재하도록 엄격히 enforce하고 싶을 수도 있습니다. 이러한 경우, *필수 쿼리*를 사용할 수 있습니다.

```angular-ts
@Component({/* ... */})
export class CustomCard {
  header = viewChild.required(CustomCardHeader);
  body = contentChild.required(CustomCardBody);
}
```

필수 쿼리가 일치하는 결과를 찾지 못하면, Angular는 오류를 보고합니다. 결과가 항상 사용 가능하다는 보장을 제공하므로, 필수 쿼리는 신호의 값 유형에 자동으로 `undefined`를 포함하지 않습니다.

## 쿼리 로케이터

각 쿼리 데코레이터의 첫 번째 매개변수는 그 **로케이터**입니다.

대부분의 경우, 컴포넌트나 지시자를 로케이터로 사용하고 싶습니다.

대안으로, [템플릿 참조 변수](guide/templates/variables#template-reference-variables)에 해당하는 문자열 로케이터를 지정할 수 있습니다.

```angular-ts
@Component({
  /*...*/
  template: `
    <button #save>Save</button>
    <button #cancel>Cancel</button>
  `
})
export class ActionBar {
  saveButton = viewChild<ElementRef<HTMLButtonElement>>('save');
}
```

하나 이상의 요소가 동일한 템플릿 참조 변수를 정의하는 경우, 쿼리는 첫 번째 일치하는 요소를 가져옵니다.

Angular는 쿼리 로케이터로 CSS 선택기를 지원하지 않습니다.

### 쿼리와 인젝터 트리

팁: 제공자와 Angular의 인젝션 트리에 대한 배경을 보려면 [의존성 주입](guide/di)을 참조하세요.

더 발전된 경우, `ProviderToken`을 로케이터로 사용할 수 있습니다. 이렇게 하면 컴포넌트 및 지시자 제공자를 기반으로 요소를 찾을 수 있습니다.

```angular-ts
const SUB_ITEM = new InjectionToken<string>('sub-item');

@Component({
  /*...*/
  providers: [{provide: SUB_ITEM, useValue: 'special-item'}],
})
export class SpecialItem { }

@Component({/*...*/})
export class CustomList {
  subItemType = contentChild(SUB_ITEM);
}
```

위의 예제는 로케이터로 `InjectionToken`을 사용하지만, 특정 요소를 찾기 위해 어떤 `ProviderToken`도 사용할 수 있습니다.

## 쿼리 옵션

모든 쿼리 함수는 두 번째 매개변수로 옵션 객체를 허용합니다. 이러한 옵션은 쿼리가 결과를 찾는 방식을 제어합니다.

### 요소의 인젝터에서 특정 값 읽기

기본적으로, 쿼리 로케이터는 검색 중인 요소와 검색된 값을 모두 나타냅니다. 대신 로케이터에 의해 일치하는 요소에서 다른 값을 검색하기 위해 `read` 옵션을 지정할 수 있습니다.

```ts
@Component({/*...*/})
export class CustomExpando {
  toggle = contentChild(ExpandoContent, {read: TemplateRef});
}
```

위의 예제는 `ExpandoContent` 지시어를 가진 요소를 찾고 해당 요소와 연결된 `TemplateRef`를 검색합니다.

개발자는 일반적으로 `read`를 사용하여 `ElementRef`와 `TemplateRef`를 검색합니다.

### 콘텐츠 자손

기본적으로 콘텐츠 쿼리는 컴포넌트의 _직접_ 자식만 찾으며, 자손으로는 탐색하지 않습니다.

<docs-code language="angular-ts" highlight="[13, 14, 15, 16]">
@Component({
  selector: 'custom-expando',
  /*...*/
})
export class CustomExpando {
  toggle = contentChild(CustomToggle);
}

@Component({
  selector: 'user-profile',
  template: `
    <custom-expando>
      <some-other-component>
        <!-- custom-toggle는 발견되지 않습니다! -->
        <custom-toggle>Show</custom-toggle>
      </some-other-component>
    </custom-expando>
  `
})
export class UserProfile { }
</docs-code>

위의 예제에서 `CustomExpando`는 `<custom-toggle>`을 찾을 수 없습니다. 이는 `<custom-expando>`의 직접 자식이 아니기 때문입니다. `descendants: true`를 설정하면 쿼리가 동일한 템플릿 내의 모든 자손을 탐색하도록 구성할 수 있습니다. 그러나 쿼리는 _절대_ 다른 템플릿의 요소를 탐색하기 위해 컴포넌트 내부로 뚫고 들어가지는 않습니다.

뷰 쿼리에는 이 옵션이 없습니다. 왜냐하면 뷰 쿼리는 _항상_ 자손으로 들어가기 때문입니다.

## 데코레이터 기반 쿼리 
팁: Angular 팀은 새로운 프로젝트에 신호 기반 쿼리 함수를 사용할 것을 권장하지만, 원래의 데코레이터 기반 쿼리 API는 여전히 완전히 지원됩니다.

속성에 해당하는 데코레이터를 추가하여 쿼리를 선언할 수 있습니다. 데코레이터 기반 쿼리는 아래에서 설명하는 것을 제외하고 신호 기반 쿼리와 동일하게 작동합니다.

### 뷰 쿼리

`@ViewChild` 데코레이터를 사용하여 단일 결과를 쿼리할 수 있습니다.

<docs-code language="angular-ts" highlight="[14, 16, 17, 18]">
@Component({
  selector: 'custom-card-header',
  /*...*/
})
export class CustomCardHeader {
  text: string;
}

@Component({
  selector: 'custom-card',
  template: '<custom-card-header>Visit sunny California!</custom-card-header>',
})
export class CustomCard {
  @ViewChild(CustomCardHeader) header: CustomCardHeader;

  ngAfterViewInit() {
    console.log(this.header.text);
  }
}
</docs-code>

이 예제에서 `CustomCard` 컴포넌트는 자식 `CustomCardHeader`를 쿼리하고 `ngAfterViewInit`에서 결과에 접근합니다.

Angular는 애플리케이션 상태가 변화함에 따라 `@ViewChild`의 결과를 최신 상태로 유지합니다.

**뷰 쿼리 결과는 `ngAfterViewInit` 생명주기 메서드에서 사용할 수 있게 됩니다**. 이 시점 이전에는 값이 `undefined`입니다. 컴포넌트 생명 주기에 대한 자세한 내용은 [Lifecycle](guide/components/lifecycle) 섹션을 참조하세요.

`@ViewChildren` 데코레이터를 사용하여 여러 결과를 쿼리할 수도 있습니다.

<docs-code language="angular-ts" highlight="[17, 19, 20, 21, 22, 23]">
@Component({
  selector: 'custom-card-action',
  /*...*/
})
export class CustomCardAction {
  text: string;
}

@Component({
  selector: 'custom-card',
  template: `
    <custom-card-action>Save</custom-card-action>
    <custom-card-action>Cancel</custom-card-action>
  `,
})
export class CustomCard {
  @ViewChildren(CustomCardAction) actions: QueryList<CustomCardAction>;

  ngAfterViewInit() {
    this.actions.forEach(action => {
      console.log(action.text);
    });
  }
}
</docs-code>

`@ViewChildren`는 쿼리 결과가 포함된 `QueryList` 객체를 생성합니다. 시간 경과에 따른 쿼리 결과의 변경 사항을 `changes` 속성을 통해 구독할 수 있습니다.

### 콘텐츠 쿼리

`@ContentChild` 데코레이터를 사용하여 단일 결과를 쿼리할 수 있습니다.

<docs-code language="angular-ts" highlight="[14, 16, 17, 18, 25]">
@Component({
  selector: 'custom-toggle',
  /*...*/
})
export class CustomToggle {
  text: string;
}

@Component({
  selector: 'custom-expando',
  /*...*/
})
export class CustomExpando {
  @ContentChild(CustomToggle) toggle: CustomToggle;

  ngAfterContentInit() {
    console.log(this.toggle.text);
  }
}

@Component({
  selector: 'user-profile',
  template: `
    <custom-expando>
      <custom-toggle>Show</custom-toggle>
    </custom-expando>
  `
})
export class UserProfile { }
</docs-code>

이 예제에서 `CustomExpando` 컴포넌트는 자식 `CustomToggle`를 쿼리하고 `ngAfterContentInit`에서 결과에 접근합니다.

Angular는 애플리케이션 상태가 변화함에 따라 `@ContentChild`의 결과를 최신 상태로 유지합니다.

**콘텐츠 쿼리 결과는 `ngAfterContentInit` 생명주기 메서드에서 사용할 수 있게 됩니다**. 이 시점 이전에는 값이 `undefined`입니다. 컴포넌트 생명 주기에 대한 자세한 내용은 [Lifecycle](guide/components/lifecycle) 섹션을 참조하세요.

`@ContentChildren` 데코레이터를 사용하여 여러 결과를 쿼리할 수도 있습니다.

<docs-code language="angular-ts" highlight="[14, 16, 17, 18, 19, 20]">
@Component({
  selector: 'custom-menu-item',
  /*...*/
})
export class CustomMenuItem {
  text: string;
}

@Component({
  selector: 'custom-menu',
  /*...*/
})
export class CustomMenu {
  @ContentChildren(CustomMenuItem) items: QueryList<CustomMenuItem>;

  ngAfterContentInit() {
    this.items.forEach(item => {
      console.log(item.text);
    });
  }
}

@Component({
  selector: 'user-profile',
  template: `
    <custom-menu>
      <custom-menu-item>Cheese</custom-menu-item>
      <custom-menu-item>Tomato</custom-menu-item>
    </custom-menu>
  `
})
export class UserProfile { }
</docs-code>

`@ContentChildren`는 쿼리 결과가 포함된 `QueryList` 객체를 생성합니다. 시간 경과에 따른 쿼리 결과의 변경 사항을 `changes` 속성을 통해 구독할 수 있습니다.

### 데코레이터 기반 쿼리 옵션

모든 쿼리 데코레이터는 두 번째 매개변수로 옵션 객체를 허용합니다. 이러한 옵션은 아래에서 설명하는 곳을 제외하고 신호 기반 쿼리와 동일하게 작동합니다.

### 정적 쿼리

`@ViewChild` 및 `@ContentChild` 데코레이터는 `static` 옵션을 허용합니다.

```angular-ts
@Component({
  selector: 'custom-card',
  template: '<custom-card-header>Visit sunny California!</custom-card-header>',
})
export class CustomCard {
  @ViewChild(CustomCardHeader, {static: true}) header: CustomCardHeader;

  ngOnInit() {
    console.log(this.header.text);
  }
}
```

`static: true`를 설정하면 Angular에 이 쿼리의 대상이 _항상_ 존재하고 조건부 렌더링되지 않음을 보장합니다. 이로 인해 결과를 `ngOnInit` 생명주기 메서드에서 더 일찍 사용할 수 있게 됩니다.

정적 쿼리 결과는 초기화 후 업데이트되지 않습니다.

`@ViewChildren` 및 `@ContentChildren` 쿼리에는 `static` 옵션이 없습니다.

### QueryList 사용하기

`@ViewChildren` 및 `@ContentChildren`는 모두 결과 목록이 포함된 `QueryList` 객체를 제공합니다.

`QueryList`는 `map`, `reduce`, `forEach`와 같이 배열과 유사하게 결과를 처리하는 여러 편리한 API를 제공합니다. 현재 결과의 배열을 얻으려면 `toArray`를 호출하면 됩니다.

결과가 변경될 때마다 수행할 작업이 있으면 `changes` 속성을 구독할 수 있습니다.

## 일반적인 쿼리 함정

쿼리를 사용할 때, 일반적인 함정은 코드를 이해하고 유지관리하기 어렵게 만들 수 있습니다.

여러 컴포넌트 간에 공유되는 상태의 단일 진실 소스를 항상 유지하세요. 이는 서로 다른 컴포넌트에서 반복된 상태가 동기화되지 않는 시나리오를 피하는 데 도움이 됩니다.

자식 컴포넌트에 상태를 직접 작성하는 것을 피하세요. 이 패턴은 이해하기 어려운 깨지기 쉬운 코드를 초래할 수 있으며, [ExpressionChangedAfterItHasBeenChecked](errors/NG0100) 오류에 취약합니다.

부모 또는 조상 컴포넌트에 상태를 직접 작성하지 마세요. 이 패턴은 이해하기 어려운 깨지기 쉬운 코드를 초래할 수 있으며, [ExpressionChangedAfterItHasBeenChecked](errors/NG0100) 오류에 취약합니다.