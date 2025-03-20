# 제어 흐름

Angular 템플릿은 조건에 따라 요소를 표시, 숨기고 반복할 수 있는 제어 흐름 블록을 지원합니다.

참고: 이것은 이전에 *ngIf, *ngFor 및 \*ngSwitch 지시어로 수행되었습니다.

## `@if`, `@else-if` 및 `@else`로 조건부 콘텐츠 표시

`@if` 블록은 그 조건 표현식이 참일 때 내용을 조건부로 표시합니다:

```angular-html
@if (a > b) {
  <p>{{a}}는 {{b}}보다 큽니다</p>
}
```

대체 콘텐츠를 표시하고 싶다면, 임의의 개수의 `@else if` 블록과 단일 `@else` 블록을 제공할 수 있습니다.

```angular-html
@if (a > b) {
  {{a}}는 {{b}}보다 큽니다
} @else if (b > a) {
  {{a}}는 {{b}}보다 작습니다
} @else {
  {{a}}는 {{b}}와 같습니다
}
```

### 조건 표현식 결과 참조하기

`@if` 조건부는 조건 표현식의 결과를 변수에 저장하여 블록 내에서 재사용할 수 있도록 지원합니다.

```angular-html
@if (user.profile.settings.startDate; as startDate) {
  {{ startDate }}
}
```

이는 템플릿 내에서 읽기 쉽고 유지 관리하기 쉬운 긴 표현식을 참조하는 데 유용할 수 있습니다.

## `@for` 블록으로 콘텐츠 반복

`@for` 블록은 컬렉션을 반복하고 블록의 내용을 반복적으로 렌더링합니다. 컬렉션은 모든 JavaScript [iterable](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Iteration_protocols)일 수 있지만, Angular는 `Array` 값에 대한 추가 성능 최적화를 제공합니다.

전형적인 `@for` 루프는 다음과 같습니다:

```angular-html
@for (item of items; track item.id) {
  {{ item.name }}
}
```

Angular의 `@for` 블록은 JavaScript의 `continue` 또는 `break`와 같은 흐름 수정문을 지원하지 않습니다.

### `@for` 블록의 `track`이 중요한 이유는 무엇인가요?

`track` 표현식은 Angular가 데이터와 페이지의 DOM 노드 간의 관계를 유지하도록 합니다. 이렇게 하면 데이터가 변경될 때 최소한의 DOM 작업을 실행하여 성능을 최적화할 수 있습니다.

트랙을 효과적으로 사용하면 데이터 컬렉션을 반복할 때 애플리케이션의 렌더링 성능을 크게 향상시킬 수 있습니다.

`track` 표현식에서 각 항목을 고유하게 식별하는 속성을 선택하세요. 데이터 모델에 일반적으로 `id` 또는 `uuid`와 같은 고유 식별 속성이 포함되어 있다면 이 값을 사용하세요. 데이터에 이러한 필드가 포함되어 있지 않다면 반드시 추가하는 것을 고려하세요.

변경되지 않는 정적 컬렉션의 경우 `$index`를 사용하여 Angular가 컬렉션 내에서 각 항목을 인덱스로 추적하도록 할 수 있습니다.

다른 옵션이 없으면 `identity`를 지정할 수 있습니다. 이는 Angular가 삼중 등호 연산자(`===`)를 사용하여 항목을 참조 아이덴티티로 추적하도록 지시합니다. 가능한 한 이 옵션은 피하세요. 이 옵션은 Angular가 데이터 항목과 어떤 DOM 노드가 연결되어 있는지 매핑할 수 없기 때문에 렌더링 업데이트가 현저히 느려질 수 있습니다.

### `@for` 블록의 컨텍스트 변수

`@for` 블록 내에서는 항상 여러 암묵적 변수가 사용 가능합니다:

| 변수     | 의미                                         |
| -------- | -------------------------------------------- |
| `$count` | 반복된 컬렉션의 항목 수                   |
| `$index` | 현재 행의 인덱스                             |
| `$first` | 현재 행이 첫 번째 행인지 여부                |
| `$last`  | 현재 행이 마지막 행인지 여부                |
| `$even`  | 현재 행 인덱스가 짝수인지 여부              |
| `$odd`   | 현재 행 인덱스가 홀수인지 여부              |

이 변수들은 항상 이러한 이름으로 사용 가능하지만 `let` 세그먼트를 통해 별칭을 붙일 수 있습니다:

```angular-html
@for (item of items; track item.id; let idx = $index, e = $even) {
  <p>항목 #{{ idx }}: {{ item.name }}</p>
}
```

별칭은 `@for` 블록을 중첩할 때 유용하며, 내부 `@for` 블록에서 외부 `@for` 블록의 변수를 읽을 수 있도록 합니다.

### `@empty` 블록으로 `@for` 블록에 대한 대체 콘텐츠 제공

선택적으로 `@for` 블록 콘텐츠 직후에 `@empty` 섹션을 포함할 수 있습니다. `@empty` 블록의 콘텐츠는 항목이 없을 때 표시됩니다:

```angular-html
@for (item of items; track item.name) {
  <li> {{ item.name }}</li>
} @empty {
  <li aria-hidden="true"> 항목이 없습니다. </li>
}
```

## `@switch` 블록으로 조건부 콘텐츠 표시

`@if` 블록이 대부분의 시나리오에 유용하지만, `@switch` 블록은 데이터를 조건부로 렌더링하기 위한 대체 구문을 제공합니다. 그 구문은 JavaScript의 `switch` 문과 유사합니다.

```angular-html
@switch (userPermissions) {
  @case ('admin') {
    <app-admin-dashboard />
  }
  @case ('reviewer') {
    <app-reviewer-dashboard />
  }
  @case ('editor') {
    <app-editor-dashboard />
  }
  @default {
    <app-viewer-dashboard />
  }
}
```

조건 표현식의 값은 삼중 등호(`===`) 연산자를 사용하여 케이스 표현식과 비교됩니다.

**`@switch`는 추적이 없으므로 블록 내에서 `break` 또는 `return` 문과 같은 동등한 항목이 필요하지 않습니다.**

옵션으로 `@default` 블록을 포함할 수 있습니다. `@default` 블록의 내용은 앞의 케이스 표현식이 스위치 값을 일치시키지 않을 경우 표시됩니다.

어떠한 `@case`도 표현식과 일치하지 않고 `@default` 블록이 없으면, 아무것도 표시되지 않습니다.