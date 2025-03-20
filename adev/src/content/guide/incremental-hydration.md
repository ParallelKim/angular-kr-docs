# 증분 수분

팁: 증분 수분은 현재 [개발자 미리보기](/reference/releases#developer-preview)에 있습니다.

**증분 수분**은 애플리케이션의 일부를 탈수 상태로 두고 필요에 따라 그 섹션의 수분을 _점진적으로_ 트리거할 수 있는 고급 유형의 [수분](guide/hydration)입니다.

## 왜 증분 수분을 사용해야 하나요?

증분 수분은 전체 애플리케이션 수분 위에 구축된 성능 향상입니다. 이는 초기 번들을 더 작게 만들 수 있으며 여전히 전체 애플리케이션 수분 경험과 비교할 수 있는 최종 사용자 경험을 제공합니다. 더 작은 번들은 초기 로드 시간을 개선하여 [첫 입력 지연(FID)](https://web.dev/fid) 및 [누적 레이아웃 이동(CLS)](https://web.dev/cls)를 줄입니다.

증분 수분은 또한 이전에 지연 가능하지 않았던 콘텐츠에 대해 지연 가능한 뷰(`@defer`)를 사용할 수 있게 해줍니다. 구체적으로, 이제는 폴드 위의 콘텐츠에 대해 지연 가능한 뷰를 사용할 수 있습니다. 증분 수분 이전에는 폴드 위에 `@defer` 블록을 배치하면 자리 표시자 콘텐츠가 렌더링되고 나중에 `@defer` 블록의 기본 템플릿 콘텐츠로 대체되었습니다. 이는 레이아웃 이동을 초래했습니다. 증분 수분은 `@defer` 블록의 기본 템플릿이 수분 시 레이아웃 이동 없이 렌더링됨을 의미합니다.

## Angular에서 증분 수분을 어떻게 활성화하나요?

서버 측 렌더링(SSR)과 수분을 이미 사용하는 애플리케이션에 대해 증분 수분을 활성화할 수 있습니다. 서버 측 렌더링을 활성화하려면 [Angular SSR 가이드](guide/ssr)를 따르고 먼저 수분을 활성화하려면 [Angular 수분 가이드](guide/hydration)를 따르세요.

`provideClientHydration` 제공자에 `withIncrementalHydration()` 함수를 추가하여 증분 수분을 활성화하세요.

```typescript
import {
  bootstrapApplication,
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';
...

bootstrapApplication(AppComponent, {
  providers: [provideClientHydration(withIncrementalHydration())]
});
```

증분 수분은 이벤트 재상태 재생에 의존하며 자동으로 활성화합니다. 이미 목록에 `withEventReplay()`가 있는 경우, 증분 수분을 활성화한 후 안전하게 제거할 수 있습니다.

## 증분 수분은 어떻게 작동하나요?

증분 수분은 전체 애플리케이션 [수분](guide/hydration), [지연 가능한 뷰](guide/defer) 및 [이벤트 재생](guide/hydration#capturing-and-replaying-events)에 기반하여 구축됩니다. 증분 수분을 사용하면 `@defer` 블록에 추가 트리거를 추가하여 증분 수분 경계를 정의할 수 있습니다. 지연 블록에 `hydrate` 트리거를 추가하면 Angular는 서버 측 렌더링 동안 해당 지연 블록의 의존성 로드를 수행하고 `@placeholder` 대신 기본 템플릿을 렌더링해야 함을 알립니다. 클라이언트 측 렌더링 시, 의존성은 여전히 지연 상태이며, 지연 블록 콘텐츠는 `hydrate` 트리거가 활성화될 때까지 탈수 상태로 유지됩니다. 이 트리거는 지연 블록에서 의존성을 가져오고 콘텐츠를 수분하라고 지시합니다. 수분 전 사용자에 의해 트리거된 모든 브라우저 이벤트, 즉 구성 요소에 등록된 리스너와 일치하는 이벤트는 큐에 저장되고 수분 프로세스가 완료되면 재생됩니다.

## 트리거를 사용하여 콘텐츠 수분 제어

**수분 트리거**를 지정하여 Angular가 지연 콘텐츠를 로드하고 수분할 때를 제어할 수 있습니다. 이는 일반 `@defer` 트리거와 함께 사용할 수 있는 추가 트리거입니다.

각 `@defer` 블록은 세미콜론(`;`)으로 구분된 여러 수분 이벤트 트리거를 가질 수 있습니다. Angular는 _어떤_ 트리거가 활성화될 때 수분을 트리거합니다.

수분 트리거에는 세 가지 유형이 있습니다: `hydrate on`, `hydrate when`, 및 `hydrate never`.

### `hydrate on`

`hydrate on`은 `@defer` 블록의 수분이 트리거되는 조건을 지정합니다.

사용 가능한 트리거는 다음과 같습니다:

| 트리거                                               | 설명                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| [`hydrate on idle`](#hydrate-on-idle)                 | 브라우저가 유휴 상태일 때 트리거됩니다.                                  |
| [`hydrate on viewport`](#hydrate-on-viewport)         | 지정된 콘텐츠가 뷰포트에 들어올 때 트리거됩니다.                         |
| [`hydrate on interaction`](#hydrate-on-interaction)   | 사용자가 지정된 요소와 상호작용할 때 트리거됩니다.                       |
| [`hydrate on hover`](#hydrate-on-hover)               | 마우스가 지정된 영역 위에 있을 때 트리거됩니다.                          |
| [`hydrate on immediate`](#hydrate-on-immediate)       | 지연되지 않은 콘텐츠의 렌더링이 완료된 직후 트리거됩니다.                  |
| [`hydrate on timer`](#hydrate-on-timer)               | 특정 기간 후에 트리거됩니다.                                           |

#### `hydrate on idle`

`hydrate on idle` 트리거는 브라우저가 유휴 상태에 도달하면 지연 가능한 뷰의 의존성을 로드하고 콘텐츠를 수분합니다. 이는 `requestIdleCallback` 기반입니다.

```angular-html
@defer (hydrate on idle) {
  <large-cmp />
} @placeholder {
  <div>대형 구성 요소 자리 표시자</div>
}
```

#### `hydrate on viewport`

`hydrate on viewport` 트리거는 지정된 콘텐츠가 뷰포트에 들어올 때 지연 가능한 뷰의 의존성을 로드하고 해당 페이지를 수분합니다. 이는 [Intersection Observer API](https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API)를 사용합니다.

```angular-html
@defer (hydrate on viewport) {
  <large-cmp />
} @placeholder {
  <div>대형 구성 요소 자리 표시자</div>
}
```

#### `hydrate on interaction`

`hydrate on interaction` 트리거는 사용자가 클릭이나 키다운 이벤트를 통해 지정된 요소와 상호작용할 때 지연 가능한 뷰의 의존성을 로드하고 콘텐츠를 수분합니다.

```angular-html
@defer (hydrate on interaction) {
  <large-cmp />
} @placeholder {
  <div>대형 구성 요소 자리 표시자</div>
}
```

#### `hydrate on hover`

`hydrate on hover` 트리거는 마우스가 특정 영역에 호버할 때 지연 가능한 뷰의 의존성을 로드하고 콘텐츠를 수분합니다. 이는 `mouseover` 및 `focusin` 이벤트를 통해 발생합니다.

```angular-html
@defer (hydrate on hover) {
  <large-cmp />
} @placeholder {
  <div>대형 구성 요소 자리 표시자</div>
}
```

#### `hydrate on immediate`

`hydrate on immediate` 트리거는 지연 가능한 뷰의 의존성을 즉시 로드하고 콘텐츠를 수분합니다. 즉, 지연 블록은 모든 다른 비지연 콘텐츠의 렌더링이 완료되자마자 로드됩니다.

```angular-html
@defer (hydrate on immediate) {
  <large-cmp />
} @placeholder {
  <div>대형 구성 요소 자리 표시자</div>
}
```

#### `hydrate on timer`

`hydrate on timer` 트리거는 지정된 기간 후에 지연 가능한 뷰의 의존성을 로드하고 콘텐츠를 수분합니다.

```angular-html
@defer (hydrate on timer(500ms)) {
  <large-cmp />
} @placeholder {
  <div>대형 구성 요소 자리 표시자</div>
}
```

기간 매개변수는 밀리초(`ms`) 또는 초(`s`)로 지정해야 합니다.

### `hydrate when`

`hydrate when` 트리거는 사용자 지정 조건식을 수용하고 조건이 truthy가 될 때 지연 가능한 뷰의 의존성을 로드하고 콘텐츠를 수분합니다.

```angular-html
@defer (hydrate when condition) {
  <large-cmp />
} @placeholder {
  <div>대형 구성 요소 자리 표시자</div>
}
```

참고: `hydrate when` 조건은 가장 상단의 탈수된 `@defer` 블록일 때만 트리거됩니다. 트리거에 제공된 조건은 부모 구성 요소에서 지정되어야 하며, 트리거될 수 있도록 존재해야 합니다. 부모 블록이 탈수 상태인 경우 Angular에서 해당 표현식은 아직 해결될 수 없습니다.

### `hydrate never`

`hydrate never`는 사용자가 지연 블록의 콘텐츠가 무한히 탈수 상태로 남아 있게 하도록 지정할 수 있게 해줍니다. 이는 콘텐츠가 정적 콘텐츠로 변환됩니다. 이는 초기 렌더링에만 적용된다는 점에 유의하세요. 이후 클라이언트 측 렌더링 기간 동안 `hydrate never`가 있는 `@defer` 블록은 여전히 의존성을 가져올 것입니다. 수분은 서버 측 렌더링된 콘텐츠의 초기 로드에만 적용됩니다. 아래 예제에서는 이후 클라이언트 측 렌더링이 뷰포트에서 `@defer` 블록 의존성을 로드합니다.

```angular-html
@defer (on viewport; hydrate never) {
  <large-cmp />
} @placeholder {
  <div>대형 구성 요소 자리 표시자</div>
}
```

참고: `hydrate never`를 사용하면 주어진 `@defer` 블록의 전체 중첩 하위 트리가 수분되는 것을 방지합니다. 그 블록 아래에 중첩된 콘텐츠에 대해서는 다른 `hydrate` 트리거가 활성화되지 않습니다.

## 일반 트리거와 함께하는 수분 트리거

수분 트리거는 `@defer` 블록의 일반 트리거와 함께 사용되는 추가 트리거입니다. 수분은 초기 로드 최적화이며, 이는 수분 트리거가 초기 로드에만 적용됨을 의미합니다. 이후의 클라이언트 측 렌더링은 여전히 일반 트리거를 사용합니다.

```angular-html
@defer (on idle; hydrate on interaction) {
  <example-cmp />
} @placeholder {
  <div>예제 자리 표시자</div>
}
```

이 예제에서는 초기 로드 시 `hydrate on interaction`이 적용됩니다. `<example-cmp />` 구성 요소와 상호작용하면 수분이 트리거됩니다. 이후 클라이언트 측 렌더링(예: 사용자가 이 구성 요소가 있는 페이지를 로드하는 routerLink를 클릭할 때)에서는 `on idle`이 적용됩니다.

## 중첩된 `@defer` 블록에서 증분 수분은 어떻게 작동하나요?

Angular의 구성 요소 및 의존성 시스템은 계층적이며, 이는 어떤 구성 요소의 수분은 모든 부모가 또한 수분되어야 함을 의미합니다. 따라서 중첩된 탈수된 `@defer` 블록 세트의 자식 `@defer` 블록에 대해 수분이 트리거되면, 최상위 탈수된 `@defer` 블록에서 트리거된 자식까지 내려가면서 그 순서대로 수분이 트리거됩니다.

```angular-html
@defer (hydrate on interaction) {
  <parent-block-cmp />
  @defer (hydrate on hover) {
    <child-block-cmp />
  } @placeholder {
    <div>자식 자리 표시자</div>
  }
} @placeholder {
  <div>부모 자리 표시자</div>
}
```

위 예에서 중첩된 `@defer` 블록에 마우스를 올리면 수분이 트리거됩니다. `<parent-block-cmp />`가 있는 부모 `@defer` 블록이 먼저 수분되고, 그 다음에 `<child-block-cmp />`가 있는 자식 `@defer` 블록이 수분됩니다.

## 제약 조건

증분 수분은 전체 애플리케이션 수분과 동일한 제약 조건을 가지며, 여기에는 직접 DOM 조작에 대한 제한 및 유효한 HTML 구조 요구 사항이 포함됩니다. 더 많은 세부정보는 [수분 가이드 제약 조건](guide/hydration#constraints) 섹션을 방문하세요.

## 여전히 `@placeholder` 블록을 지정해야 하나요?

예. `@placeholder` 블록 콘텐츠는 증분 수분에 사용되지 않지만, 이후 클라이언트 측 렌더링 사례에는 여전히 `@placeholder`가 필요합니다. 콘텐츠가 초기 로드의 일부인 경로에 없었다면, 해당 `@defer` 블록 콘텐츠가 있는 경로로 탐색할 때 일반 `@defer` 블록처럼 렌더링됩니다. 따라서 이러한 클라이언트 측 렌더링 사례에서 `@placeholder`가 렌더링됩니다.