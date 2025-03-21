# Create template fragments with ng-template

네이티브 `<template>` 요소에서 영감을 받아 [native `<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template), `<ng-template>` 요소를 사용하면 **템플릿 조각**을 선언할 수 있습니다. 이는 동적으로 또는 프로그래밍적으로 렌더링할 수 있는 콘텐츠 섹션입니다.

## Creating a template fragment

`<ng-template>` 요소로 모든 컴포넌트 템플릿 내에서 템플릿 조각을 생성할 수 있습니다:

```angular-html
<p>일반 요소입니다</p>

<ng-template>
  <p>템플릿 조각입니다</p>
</ng-template>
```

위 내용이 렌더링될 때, `<ng-template>` 요소의 콘텐츠는 페이지에 렌더링되지 않습니다. 대신, 템플릿 조각에 대한 참조를 얻고 이를 동적으로 렌더링하는 코드를 작성할 수 있습니다.

### Binding context for fragments

템플릿 조각은 동적 표현식과 바인딩을 포함할 수 있습니다:

```angular-ts
@Component({
  /* ... */,
  template: `<ng-template>선택한 항목 수: {{count}}입니다.</ng-template>`,
})
export class ItemCounter {
  count: number = 0;
}
```

템플릿 조각 내의 표현식이나 문장은 조각이 선언된 컴포넌트를 기준으로 평가됩니다. 조각이 어디에 렌더링되든지 관계없이 적용됩니다.

## Getting a reference to a template fragment

템플릿 조각에 대한 참조를 얻는 방법은 세 가지가 있습니다:

- `<ng-template>` 요소에 [템플릿 참조 변수](/guide/templates/variables#template-reference-variables)를 선언하여
- [컴포넌트 또는 디렉티브 쿼리](/guide/components/queries)를 통해 조각을 조회하여
- `<ng-template>` 요소에 직접 적용된 디렉티브에서 조각을 주입하여.

세 가지 경우 모두, 조각은 [TemplateRef](/api/core/TemplateRef) 객체로 표현됩니다.

### Referencing a template fragment with a template reference variable

`<ng-template>` 요소에 템플릿 참조 변수를 추가하여 같은 템플릿 파일의 다른 부분에서 해당 템플릿 조각을 참조할 수 있습니다:

```angular-html
<p>일반 요소입니다</p>

<ng-template #myFragment>
  <p>템플릿 조각입니다</p>
</ng-template>
```

이제 `myFragment` 변수를 통해 템플릿의 다른 곳에서 이 조각을 참조할 수 있습니다.

### Referencing a template fragment with queries

어떠한 [컴포넌트 또는 디렉티브 쿼리 API](/guide/components/queries)를 사용하여 템플릿 조각에 대한 참조를 얻을 수 있습니다.

예를 들어, 템플릿에 정확히 하나의 템플릿 조각이 있는 경우, `@ViewChild` 쿼리를 사용하여 `TemplateRef` 객체를 직접 조회할 수 있습니다:

```angular-ts
@Component({
  /* ... */,
  template: `
    <p>일반 요소입니다</p>

    <ng-template>
      <p>템플릿 조각입니다</p>
    </ng-template>
  `,
})
export class ComponentWithFragment {
  @ViewChild(TemplateRef) myFragment: TemplateRef<unknown> | undefined;
}
```

그런 다음, 이 조각을 컴포넌트 코드나 컴포넌트의 템플릿에서 다른 클래스 멤버처럼 참조할 수 있습니다.

템플릿에 여러 조각이 포함된 경우, 각 `<ng-template>` 요소에 템플릿 참조 변수를 추가하여 이름을 할당하고 해당 이름을 기반으로 조각을 조회할 수 있습니다:

```angular-ts
@Component({
  /* ... */,
  template: `
    <p>일반 요소입니다</p>

    <ng-template #fragmentOne>
      <p>하나의 템플릿 조각입니다</p>
    </ng-template>

    <ng-template #fragmentTwo>
      <p>또 다른 템플릿 조각입니다</p>
    </ng-template>
  `,
})
export class ComponentWithFragment {
  // 이름으로 조회할 때, 요소와 관련된 TemplateRef 객체를 가져오려면 'read' 옵션을 사용해야 합니다.
  @ViewChild('fragmentOne', {read: TemplateRef}) fragmentOne: TemplateRef<unknown> | undefined;
  @ViewChild('fragmentTwo', {read: TemplateRef}) fragmentTwo: TemplateRef<unknown> | undefined;
}
```

다시 말해, 이 조각을 컴포넌트 코드나 컴포넌트 템플릿에서 다른 클래스 멤버처럼 참조할 수 있습니다.

### Injecting a template fragment

디렉티브가 `<ng-template>` 요소에 직접 적용된 경우 `TemplateRef`를 주입할 수 있습니다:

```angular-ts
@Directive({
  selector: '[myDirective]'
})
export class MyDirective {
  private fragment = inject(TemplateRef);
}
```

```angular-html
<ng-template myDirective>
  <p>하나의 템플릿 조각입니다</p>
</ng-template>
```

이제 이 조각을 디렉티브 코드에서 다른 클래스 멤버처럼 참조할 수 있습니다.

## Rendering a template fragment

템플릿 조각의 `TemplateRef` 객체에 대한 참조를 얻은 후, 두 가지 방법 중 하나로 조각을 렌더링할 수 있습니다: `NgTemplateOutlet` 디렉티브를 사용하거나 TypeScript 코드에서 `ViewContainerRef`를 사용하는 것입니다.

### Using `NgTemplateOutlet`

`@angular/common`의 `NgTemplateOutlet` 디렉티브는 `TemplateRef`를 받아들이고 조각을 아울렛이 있는 요소의 **형제**로 렌더링합니다. 일반적으로 이 디렉티브는 [`<ng-container>` 요소](/guide/templates/ng-container)에서 사용해야 합니다.

먼저 `NgTemplateOutlet`을 가져옵니다:
```typescript
import { NgTemplateOutlet } from '@angular/common';
```

다음 예제는 템플릿 조각을 선언하고 해당 조각을 `NgTemplateOutlet`을 사용하여 `<ng-container>` 요소에 렌더링합니다:

```angular-html
<p>일반 요소입니다</p>

<ng-template #myFragment>
  <p>이것은 조각입니다</p>
</ng-template>

<ng-container *ngTemplateOutlet="myFragment"></ng-container>
```

이 예제는 다음과 같이 렌더링된 DOM을 생성합니다:

```angular-html
<p>일반 요소입니다</p>
<p>이것은 조각입니다</p>
```

### Using `ViewContainerRef`

**뷰 컨테이너**는 Angular의 컴포넌트 트리 내에서 콘텐츠를 포함할 수 있는 노드입니다. 모든 컴포넌트나 디렉티브는 `ViewContainerRef`를 주입하여 해당 컴포넌트 또는 디렉티브의 DOM 내 위치에 대응하는 뷰 컨테이너에 대한 참조를 얻을 수 있습니다.

`ViewContainerRef`의 `createEmbeddedView` 메서드를 사용하여 템플릿 조각을 동적으로 렌더링할 수 있습니다. `ViewContainerRef`를 사용하여 조각을 렌더링하면 Angular는 DOM에 컴포넌트 또는 디렉티브의 다음 형제 요소로 추가합니다.

다음 예제는 템플릿 조각에 대한 참조를 입력으로 받아 해당 조각을 버튼 클릭 시 DOM에 렌더링하는 컴포넌트를 보여줍니다.

```angular-ts
@Component({
  /* ... */,
  selector: 'component-with-fragment',
  template: `
    <h2>조각이 있는 컴포넌트</h2>
    <ng-template #myFragment>
      <p>이것은 조각입니다</p>
    </ng-template>
    <my-outlet [fragment]="myFragment" />
  `,
})
export class ComponentWithFragment { }

@Component({
  /* ... */,
  selector: 'my-outlet',
  template: `<button (click)="showFragment()">보여주기</button>`,
})
export class MyOutlet {
  private viewContainer = inject(ViewContainerRef);
  @Input() fragment: TemplateRef<unknown> | undefined;

  showFragment() {
    if (this.fragment) {
      this.viewContainer.createEmbeddedView(this.fragment);
    }
  }
}
```

위 예제에서 "보여주기" 버튼을 클릭하면 다음과 같은 출력이 생성됩니다:

```angular-html
<component-with-fragment>
  <h2>조각이 있는 컴포넌트</h2>
  <my-outlet>
    <button>보여주기</button>
  </my-outlet>
  <p>이것은 조각입니다</p>
</component-with-fragment>
```

## Passing parameters when rendering a template fragment

`<ng-template>`로 템플릿 조각을 선언할 때, 추가로 조각이 수용하는 매개변수를 선언할 수 있습니다. 조각을 렌더링할 때, 이러한 매개변서에 해당하는 `context` 객체를 최적으로 전달할 수 있습니다. 이 컨텍스트 객체의 데이터를 바인딩 표현식이나 문장에서 사용할 수 있으며, 조각이 선언된 컴포넌트의 데이터도 참조할 수 있습니다.

각 매개변수는 `let-`으로 시작하는 속성으로 쓰여지며, 값은 컨텍스트 객체의 속성 이름과 일치해야 합니다:

```angular-html
<ng-template let-pizzaTopping="topping">
  <p>선택한 토핑: {{pizzaTopping}}</p>
</ng-template>
```

### Using `NgTemplateOutlet`

`ngTemplateOutletContext` 입력에 컨텍스트 객체를 바인딩할 수 있습니다:

```angular-html
<ng-template #myFragment let-pizzaTopping="topping">
  <p>선택한 토핑: {{pizzaTopping}}</p>
</ng-template>

<ng-container
  [ngTemplateOutlet]="myFragment"
  [ngTemplateOutletContext]="{topping: '양파'}"
/>
```

### Using `ViewContainerRef`

컨텍스트 객체를 `createEmbeddedView`의 두 번째 인수로 전달할 수 있습니다:

```angular-ts
this.viewContainer.createEmbeddedView(this.myFragment, {topping: '양파'});
```

## Structural directives

**구조적 디렉티브**는 다음의 디렉티브입니다:

- `TemplateRef`를 주입하고
- `ViewContainerRef`를 주입하여 주입된 `TemplateRef`를 프로그래밍적으로 렌더링합니다.

Angular는 구조적 디렉티브에 대한 특별한 편의 구문을 지원합니다. 디렉티브를 요소에 적용하고 디렉티브 선택자 앞에 별표(`*`) 문자를 접두사로 붙이면 Angular는 전체 요소와 그 모든 내용을 템플릿 조각으로 해석합니다:

```angular-html
<section *myDirective>
  <p>이것은 조각입니다</p>
</section>
```

이는 다음과 같습니다:

```angular-html
<ng-template myDirective>
  <section>
    <p>이것은 조각입니다</p>
  </section>
</ng-template>
```

개발자들은 일반적으로 구조적 디렉티브를 사용하여 조각을 조건부로 렌더링하거나 조각을 여러 번 렌더링합니다.

자세한 내용은 [구조적 디렉티브](/guide/directives/structural-directives)를 참조하세요.

## Additional resources

`ng-template`이 다른 라이브러리에서 어떻게 사용되는지에 대한 예시를 보려면 다음을 확인하세요:

- [Angular Material의 탭](https://material.angular.io/components/tabs/overview) - 탭이 활성화될 때까지 DOM에 아무것도 렌더링되지 않습니다.
- [Angular Material의 테이블](https://material.angular.io/components/table/overview) - 개발자가 데이터를 렌더링하는 다양한 방법을 정의할 수 있게 합니다.