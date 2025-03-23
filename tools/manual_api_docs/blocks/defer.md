컴포넌트 템플릿 내에서 사용되는 컴포넌트, 지시자 및 파이프의 JavaScript를 지연 로드하는 데 사용할 수 있는 [block](api/core/@defer)의 유형입니다.

## Syntax

```angular-html
@defer ( on <trigger>; when <condition>; prefetch on <trigger>; prefetch when <condition> ) {
  <!-- deferred template fragment -->
  <calendar-cmp />
} @placeholder ( minimum? <duration> ) {
  <!-- placeholder template fragment -->
  <p>Placeholder</p>
} @loading ( minimum? <duration>; after? <duration> ) {
  <!-- loading template fragment -->
  <img alt="loading image" src="loading.gif" />
} @error {
  <!-- error template fragment -->
  <p>An loading error occurred</p>
}
```

## Description

### Blocks

지연 블록의 지원되는 섹션. 참고: @defer 블록 템플릿 조각만 지연 로드됩니다. 나머지 선택적 블록은 즉시 로드됩니다.

| block          | Description                                              |
|----------------|----------------------------------------------------------|
| `@defer`       | 지연 로드된 콘텐츠 블록                                 |
| `@placeholder` | 지연 로드 전에 표시되는 콘텐츠 (선택 사항)               |
| `@loading`     | 지연 로드 중에 표시되는 콘텐츠 (선택 사항)               |
| `@error`       | 지연 로드 오류가 발생할 때 표시되는 콘텐츠 (선택 사항) |

<h3>Triggers</h3>

트리거는 지연 로드가 발생하는 조건을 제공합니다. 일부는 선택적 매개변수로 템플릿 참조 변수를 허용합니다. 여러 개의 트리거는 세미콜론으로 구분합니다.

| trigger                         | Triggers...                                   |
|---------------------------------|-----------------------------------------------|
| `on idle`                       | 브라우저가 유휴 상태를 보고할 때 (기본값)       |
| `on viewport(<elementRef>?)`    | 요소가 뷰포트에 들어갈 때                       |
| `on interaction(<elementRef>?)` | 클릭, 터치, 또는 포커스될 때                   |
| `on hover(<elementRef>?)`       | 요소가 호버될 때                               |
| `on immediate`                  | 페이지 렌더링이 완료될 때                     |
| `on timer(<duration>)`          | 특정 시간 초과 후                              |
| `when <condition>`              | 사용자 정의 조건에서                           |

<h2>Prefetch</h2>

`@defer` 매개변수로 사용되는 지연 블록의 프리패칭을 구성하지만 렌더링에는 영향을 주지 않습니다. 렌더링은 표준 `on` 및 `when` 조건에 의해 처리됩니다. 여러 프리패치 구성을 세미콜론으로 구분합니다.

```angular-html
@defer (prefetch on <trigger>; prefetch when <condition>) {
  <!-- deferred template fragment -->
}
```

[지연 로드 가이드](guide/defer)에서 더 알아보세요.
