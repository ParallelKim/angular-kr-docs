# 지연 로딩과 `@defer`

지연 가능한 뷰, 즉 `@defer` 블록은 페이지의 초기 렌더링에 필수적이지 않은 코드의 로딩을 지연시켜 애플리케이션의 초기 번들 크기를 줄입니다. 이로 인해 초기 로드 속도가 빨라지고 Core Web Vitals(CWV), 주로 Largest Contentful Paint(LCP)와 Time to First Byte(TTFB)가 개선되는 경향이 있습니다.

이 기능을 사용하려면 템플릿의 섹션을 @defer 블록으로 선언적으로 감쌀 수 있습니다:

```angular-html
@defer {
  <large-component />
}
```

`@defer` 블록 내부의 모든 컴포넌트, 지시문 및 파이프의 코드는 별도의 JavaScript 파일로 분할되어 필요할 때만 로딩되며, 나머지 템플릿이 렌더링된 후 로드됩니다.

지연 가능한 뷰는 다양한 트리거, 미리 불러오기 옵션 및 자리 표시자, 로딩 및 오류 상태 관리를 위한 하위 블록을 지원합니다.

## 어떤 종속성이 지연됩니까?

애플리케이션을 로드할 때 컴포넌트, 지시문, 파이프 및 모든 컴포넌트 CSS 스타일을 지연시킬 수 있습니다.

`@defer` 블록 내의 종속성이 지연되기 위해서는 두 가지 조건을 충족해야 합니다:

1. **독립적이어야 합니다.** 비독립적인 종속성은 지연될 수 없으며 `@defer` 블록 내부에 있더라도 여전히 즉시 로드됩니다.
1. **같은 파일 내의 `@defer` 블록 외부에서 참조할 수 없습니다.** `@defer` 블록 외부에서 참조되거나 ViewChild 쿼리 내에서 참조되면 종속성이 즉시 로드됩니다.

`@defer` 블록에서 사용되는 컴포넌트, 지시문 및 파이프의 _전이_ 종속성은 엄격하게 독립적일 필요는 없으며, 전이 종속성은 여전히 `NgModule`에 선언되고 지연 로딩에 참여할 수 있습니다.

Angular의 컴파일러는 `@defer` 블록에서 사용되는 각 컴포넌트, 지시문 및 파이프에 대해 [동적 import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) 문을 생성합니다. 블록의 주요 내용은 모든 import가 해결된 후 렌더링됩니다. Angular는 이러한 import의 특정 순서를 보장하지 않습니다.

## 지연 로딩의 다양한 단계를 관리하는 방법

`@defer` 블록은 지연 로딩 과정의 다양한 단계를 우아하게 처리할 수 있도록 여러 하위 블록을 가지고 있습니다.

### `@defer`

이 블록은 지연 로드되는 콘텐츠 섹션을 정의하는 기본 블록입니다. 처음에는 렌더링되지 않으며, 지연된 콘텐츠는 지정된 [트리거](/guide/defer#triggers)가 발생하거나 `when` 조건이 충족되면 로드되고 렌더링됩니다.

기본적으로, @defer 블록은 브라우저의 상태가 [idle](/guide/defer#idle) 상태에 있을 때 트리거됩니다.

```angular-html
@defer {
  <large-component />
}
```

### `@placeholder`로 자리 표시자 콘텐츠 표시

기본적으로 지연 블록은 트리거되기 전까지 어떤 콘텐츠도 렌더링하지 않습니다.

`@placeholder`는 `@defer` 블록이 트리거되기 전에 표시할 콘텐츠를 선언하는 선택적 블록입니다.

```angular-html
@defer {
  <large-component />
} @placeholder {
  <p>Placeholder content</p>
}
```

선택적이지만, 특정 트리거는 기능을 위해 `@placeholder` 또는 [템플릿 참조 변수](/guide/templates/variables#template-reference-variables)의 존재를 요구할 수 있습니다. 자세한 내용은 [Triggers](/guide/defer#triggers) 섹션을 참조하세요.

Angular는 로딩이 완료되면 자리 표시자 콘텐츠를 주요 콘텐츠로 교체합니다. 자리 표시자 섹션에는 일반 HTML, 컴포넌트, 지시문 및 파이프를 포함한 모든 콘텐츠를 사용할 수 있습니다. 자리 표시자 블록의 _종속성은 즉시 로드됩니다_.

`@placeholder` 블록은 자리 표시자 콘텐츠가 처음 렌더링된 후 이 자리 표시자가 표시되어야 하는 `minimum` 시간을 지정하는 선택적 매개변수를 허용합니다.

```angular-html
@defer {
  <large-component />
} @placeholder (minimum 500ms) {
  <p>Placeholder content</p>
}
```

이 `minimum` 매개변수는 밀리초(ms) 또는 초(s) 단위로 지정됩니다. 이 매개변수를 사용하여 지연 종속성이 빠르게 가져오기 될 경우 자리 표시자 콘텐츠가 너무 빠르게 깜박이는 것을 방지할 수 있습니다.

### `@loading`으로 로딩 콘텐츠 표시

`@loading` 블록은 지연 종속성이 로드되는 동안 표시할 콘텐츠를 선언할 수 있는 선택적 블록입니다. 로딩이 트리거되면 `@placeholder` 블록을 교체합니다.

```angular-html
@defer {
  <large-component />
} @loading {
  <img alt="loading..." src="loading.gif" />
} @placeholder {
  <p>Placeholder content</p>
}
```

그 종속성은 즉시 로드됩니다(`@placeholder`와 유사).

`@loading` 블록은 지연 종속성이 빠르게 가져오기 될 때 발생할 수 있는 콘텐츠의 빠른 깜박임을 방지하기 위해 두 개의 선택적 매개변수를 허용합니다:

- `minimum` - 이 자리 표시자가 표시되어야 하는 최소 시간
- `after` - 로딩 시작 후 로딩 템플릿을 표시하기 전 대기할 시간

```angular-html
@defer {
  <large-component />
} @loading (after 100ms; minimum 1s) {
  <img alt="loading..." src="loading.gif" />
}
```

두 매개변수는 밀리초(ms) 또는 초(s) 단위로 지정됩니다. 또한 두 매개변수의 타이머는 로딩이 트리거된 직후에 시작됩니다.

### `@error`로 지연 로딩 실패 시 오류 상태 표시

`@error` 블록은 지연 로딩이 실패할 경우 표시되는 선택적 블록입니다. `@placeholder` 및 `@loading`과 유사하게, `@error` 블록의 종속성은 즉시 로드됩니다.

```angular-html
@defer {
  <large-component />
} @error {
  <p>Failed to load large component.</p>
}
```

## 트리거로 지연 콘텐츠 로딩 제어하기

**트리거**를 지정하여 Angular가 지연 콘텐츠를 로드하고 표시하는 시점을 제어할 수 있습니다.

`@defer` 블록이 트리거되면 자리 표시자 콘텐츠가 지연 로드된 콘텐츠로 교체됩니다.

여러 이벤트 트리거는 세미콜론 `;`으로 구분하여 정의할 수 있으며, OR 조건으로 평가됩니다.

트리거에는 두 가지 유형이 있습니다: `on` 및 `when`.

### `on`

`on`은 `@defer` 블록이 트리거되는 조건을 지정합니다.

사용 가능한 트리거는 다음과 같습니다:

| 트리거                        | 설명                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| [`idle`](#idle)              | 브라우저가 idle 상태일 때 트리거됩니다.                           |
| [`viewport`](#viewport)      | 지정된 콘텐츠가 뷰포트에 들어올 때 트리거됩니다.                  |
| [`interaction`](#interaction)| 사용자가 지정된 요소와 상호 작용할 때 트리거됩니다.             |
| [`hover`](#hover)            | 마우스가 지정된 영역 위에 있을 때 트리거됩니다.                   |
| [`immediate`](#immediate)    | 비지연 콘텐츠가 렌더링을 완료한 직후에 트리거됩니다.               |
| [`timer`](#timer)            | 특정 기간이 지난 후 트리거됩니다.                                 |

#### `idle`

`idle` 트리거는 브라우저가 idle 상태에 도달했을 때 지연 콘텐츠를 로드합니다. 이는 지연 블록의 기본 동작입니다.

```angular-html
<!-- @defer (on idle) -->
@defer {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

#### `viewport`

`viewport` 트리거는 지정된 콘텐츠가 뷰포트에 들어올 때 지연 콘텐츠를 로드합니다. 이는 [Intersection Observer API](https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API)를 사용합니다. 관찰된 콘텐츠는 `@placeholder` 콘텐츠 또는 명시적인 요소 참조일 수 있습니다.

기본적으로는 `@defer`가 자리 표시자가 뷰포트에 들어오는 것을 감시합니다. 이렇게 사용된 자리 표시자는 단일 루트 요소가 있어야 합니다.

```angular-html
@defer (on viewport) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

또는 `@defer` 블록과 같은 템플릿에서 [템플릿 참조 변수](/guide/templates/variables)를 지정하여 뷰포트에 들어오는 요소로 사용할 수 있습니다. 이 변수는 뷰포트 트리거에서 매개변수로 전달됩니다.

```angular-html
<div #greeting>Hello!</div>
@defer (on viewport(greeting)) {
  <greetings-cmp />
}
```

#### `interaction`

`interaction` 트리거는 사용자가 `click` 또는 `keydown` 이벤트를 통해 지정된 요소와 상호 작용할 때 지연 콘텐츠를 로드합니다.

기본적으로 자리 표시자는 상호 작용 요소로 작용합니다. 이렇게 사용된 자리 표시자는 단일 루트 요소가 있어야 합니다.

```angular-html
@defer (on interaction) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

또는 `@defer` 블록과 같은 템플릿에서 [템플릿 참조 변수](/guide/templates/variables)를 지정하여 상호 작용할 요소로 사용할 수 있습니다. 이 변수는 뷰포트 트리거에서 매개변수로 전달됩니다.

```angular-html
<div #greeting>Hello!</div>
@defer (on interaction(greeting)) {
  <greetings-cmp />
}
```

#### `hover`

`hover` 트리거는 마우스가 트리거된 영역 위에 있을 때 (`mouseover` 및 `focusin` 이벤트)를 통해 지연 콘텐츠를 로드합니다.

기본적으로 자리 표시자는 상호 작용 요소로 작용합니다. 이렇게 사용된 자리 표시자는 단일 루트 요소가 있어야 합니다.

```angular-html
@defer (on hover) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

또는 `@defer` 블록과 같은 템플릿에서 [템플릿 참조 변수](/guide/templates/variables)를 지정하여 뷰포트에 들어오는 요소로 사용할 수 있습니다. 이 변수는 뷰포트 트리거에서 매개변수로 전달됩니다.

```angular-html
<div #greeting>Hello!</div>
@defer (on hover(greeting)) {
  <greetings-cmp />
}
```

#### `immediate`

`immediate` 트리거는 지연 콘텐츠를 즉시 로드합니다. 즉, 비지연 블록이 모든 다른 비지연 콘텐츠의 렌더링을 완료한 직후에 지연 블록이 로드됩니다.

```angular-html
@defer (on immediate) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

#### `timer`

`timer` 트리거는 지정된 기간 후에 지연 콘텐츠를 로드합니다.

```angular-html
@defer (on timer(500ms)) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

기간 매개변수는 밀리초(`ms`) 또는 초(`s`) 단위로 지정해야 합니다.

### `when`

`when` 트리거는 사용자 정의 조건 표현식을 허용하고 조건이 참으로 바뀔 때 지연 콘텐츠를 로드합니다.

```angular-html
@defer (when condition) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

이것은 일회성 작업입니다. `@defer` 블록은 조건이 참에서 거짓으로 바뀌어도 자리 표시자로 되돌아가지 않습니다.

## 미리 데이터 불러오기와 `prefetch`

지연 콘텐츠가 표시되는 시점을 결정하는 조건을 지정하는 것 외에도, 선택적으로 **prefetch 트리거**를 지정할 수 있습니다. 이 트리거를 통해 `@defer` 블록과 관련된 JavaScript를 지연 콘텐츠가 표시되기 전에 로드할 수 있습니다.

미리 불러오기는 사용자가 실제로 지연 블록을 보거나 상호 작용하기 전에 리소스를 미리 불러오기 시작할 수 있게 해주므로, 리소스를 더 빨리 사용할 수 있도록 합니다.

`prefetch` 키워드로 구분하여 블록의 메인 트리거와 미리 불러오기 트리거를 지정할 수 있습니다. 블록의 메인 트리거와 미리 불러오기 트리거는 세미콜론(`;`) 문자로 구분됩니다.

아래 예제에서는 브라우저가 idle이 될 때 미리 불러오기가 시작되고, 사용자가 자리 표시자와 상호 작용할 때만 블록의 내용이 렌더링됩니다.

```angular-html
@defer (on interaction; prefetch on idle) {
  <large-cmp />
} @placeholder {
  <div>Large component placeholder</div>
}
```

## `@defer` 블록 테스트하기

Angular는 `@defer` 블록을 테스트하고 테스트 중 다양한 상태를 트리거하는 과정을 간소화하기 위해 TestBed API를 제공합니다. 기본적으로 테스트에서 `@defer` 블록은 실제 애플리케이션에서 동작하는 것처럼 작동합니다. 상태를 수동으로 단계별로 진행하고 싶으면 TestBed 구성에서 지연 블록 동작을 `Manual`로 전환할 수 있습니다.

```angular-ts
it('should render a defer block in different states', async () => {
  // 수동 제어를 위해 "paused" 상태에서 시작하도록 지연 블록 동작을 구성합니다.
  TestBed.configureTestingModule({deferBlockBehavior: DeferBlockBehavior.Manual});
  @Component({
    // ...
    template: `
      @defer {
        <large-component />
      } @placeholder {
        Placeholder
      } @loading {
        Loading...
      }
    `
  })
  class ComponentA {}
  // 컴포넌트 픽스처 생성.
  const componentFixture = TestBed.createComponent(ComponentA);
  // 모든 지연 블록 픽스처 목록을 가져오고 첫 번째 블록을 가져옵니다.
  const deferBlockFixture = (await componentFixture.getDeferBlocks())[0];
  // 기본적으로 자리 표시자 상태를 렌더링합니다.
  expect(componentFixture.nativeElement.innerHTML).toContain('Placeholder');
  // 로딩 상태를 렌더링하고 렌더링된 출력을 확인합니다.
  await deferBlockFixture.render(DeferBlockState.Loading);
  expect(componentFixture.nativeElement.innerHTML).toContain('Loading');
  // 최종 상태를 렌더링하고 출력을 확인합니다.
  await deferBlockFixture.render(DeferBlockState.Complete);
  expect(componentFixture.nativeElement.innerHTML).toContain('large works!');
});
```

## `@defer`는 `NgModule`와 함께 작동합니까?

`@defer` 블록은 독립형 및 NgModule 기반의 컴포넌트, 지시문 및 파이프 모두와 호환됩니다. 그러나 **독립형 컴포넌트, 지시문 및 파이프만 지연될 수 있습니다**. NgModule 기반의 종속성은 지연되지 않으며 즉시 로딩되는 번들에 포함됩니다.

## `@defer`는 서버 측 렌더링(SSR) 및 정적 사이트 생성(SSG)과 함께 어떻게 작동합니까?

기본적으로 서버에서 애플리케이션을 렌더링할 때(SSR 또는 SSG 사용 시) 지연 블록은 항상 `@placeholder`(또는 자리 표시자가 지정되지 않은 경우 아무것도 렌더링하지 않음)를 렌더링하며 트리거는 호출되지 않습니다. 클라이언트에서는 `@placeholder`의 내용이 수화되고 트리거가 활성화됩니다.

서버에서 `@defer` 블록의 주요 콘텐츠를 렌더링하려면(SSR 및 SSG 모두) [증분 수화 기능](/guide/incremental-hydration)을 활성화하고 필요한 블록에 대해 `hydrate` 트리거를 구성할 수 있습니다.

## 뷰 지연을 위한 모범 사례

### 중첩 된 `@defer` 블록으로 인한 연쇄 로드를 피하십시오

중첩된 `@defer` 블록이 있는 경우 동시에 로드되지 않도록 서로 다른 트리거를 가져야 합니다. 그렇지 않으면 연쇄 요청이 발생하고 페이지 로드 성능에 부정적인 영향을 줄 수 있습니다.

### 레이아웃Shift 피하기

초기 로드에서 사용자의 뷰포트에 보이는 컴포넌트를 지연 로딩하는 것을 피하십시오. 이렇게 하면 누적 레이아웃 이동(CLS)이 증가하여 Core Web Vitals에 부정적인 영향을 미칠 수 있습니다.

이것이 필요하다면 초기 페이지 렌더링 동안 콘텐츠가 로드되도록 하는 `immediate`, `timer`, `viewport` 및 사용자 정의 `when` 트리거를 피하십시오.