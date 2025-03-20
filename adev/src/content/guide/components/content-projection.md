# 콘텐츠 투영 ng-content 사용하기

팁: 이 가이드는 여러분이 [필수 가이드](essentials)를 이미 읽었다고 가정합니다. Angular에 처음이라면 먼저 그것을 읽어보세요.

여러분은 종종 다양한 유형의 콘텐츠를 위한 컨테이너 역할을 하는 컴포넌트를 만들어야 합니다. 예를 들어, 사용자 지정 카드 컴포넌트를 만들고 싶을 수 있습니다:

```angular-ts
@Component({
  selector: 'custom-card',
  template: '<div class="card-shadow"> <!-- 카드 내용은 여기로 --> </div>',
})
export class CustomCard {/* ... */}
```

**`<ng-content>` 요소를 자리 표시자로 사용하여 콘텐츠가 들어갈 위치를 표시할 수 있습니다**:

```angular-ts
@Component({
  selector: 'custom-card',
  template: '<div class="card-shadow"> <ng-content></ng-content> </div>',
})
export class CustomCard {/* ... */}
```

팁: `<ng-content>`는 [네이티브 `<slot>` 요소](https://developer.mozilla.org/docs/Web/HTML/Element/slot)와 유사하게 작동하지만, Angular 특정 기능이 있습니다.

`<ng-content>`와 함께 컴포넌트를 사용할 때, 컴포넌트 호스트 요소의 자식들은 그 `<ng-content>` 위치에 **렌더링**되거나 **투영**됩니다:

```angular-ts
// 컴포넌트 소스
@Component({
  selector: 'custom-card',
  template: `
    <div class="card-shadow">
      <ng-content />
    </div>
  `,
})
export class CustomCard {/* ... */}
```

```angular-html
<!-- 컴포넌트 사용하기 -->
<custom-card>
  <p>이것은 투영된 콘텐츠입니다</p>
</custom-card>
```

```angular-html
<!-- 렌더링된 DOM -->
<custom-card>
  <div class="card-shadow">
    <p>이것은 투영된 콘텐츠입니다</p>
  </div>
</custom-card>
```

Angular는 이러한 방식으로 전달된 컴포넌트의 모든 자식을 **콘텐츠**라고 부릅니다. 이는 컴포넌트의 **뷰**와 구별됩니다. 뷰는 컴포넌트 템플릿에 정의된 요소를 가리킵니다.

**`<ng-content>` 요소는 컴포넌트도 아니고 DOM 요소도 아닙니다**. 대신, Angular에 콘텐츠를 렌더링할 위치를 표시하는 특별한 자리 표시자입니다. Angular의 컴파일러는 빌드 타임에 모든 `<ng-content>` 요소를 처리합니다. 런타임에 `<ng-content>`를 삽입, 제거 또는 수정할 수 없습니다. `<ng-content>`에 지시문, 스타일 또는 임의의 속성을 추가할 수 없습니다.

`@if`, `@for` 또는 `@switch`로 `<ng-content>`를 조건부로 포함해서는 안 됩니다. Angular는 콘텐츠를 `<ng-content>` 자리 표시자로 렌더링할 때 항상 인스턴스화하고 DOM 노드를 생성합니다. 콘텐츠가 hidden 상태인 경우에도 마찬가지입니다. 컴포넌트 콘텐츠의 조건부 렌더링에 대한 내용은 [템플릿 조각](api/core/ng-template)을 참조하세요.

## 여러 콘텐츠 자리 표시자

Angular는 CSS 선택자에 따라 서로 다른 `<ng-content>` 자리 표시자에 여러 서로 다른 요소를 투영하는 것을 지원합니다. 위의 카드 예제를 확장하여 카드 제목과 카드 본문에 대한 두 개의 자리 표시자를 `select` 속성을 사용하여 만들 수 있습니다:

```angular-html
<!-- 컴포넌트 템플릿 -->
<div class="card-shadow">
  <ng-content select="card-title"></ng-content>
  <div class="card-divider"></div>
  <ng-content select="card-body"></ng-content>
</div>
```

```angular-html
<!-- 컴포넌트 사용하기 -->
<custom-card>
  <card-title>안녕하세요</card-title>
  <card-body>예제에 오신 것을 환영합니다</card-body>
</custom-card>
```

```angular-html
<!-- 렌더링된 DOM -->
<custom-card>
  <div class="card-shadow">
    <card-title>안녕하세요</card-title>
    <div class="card-divider"></div>
    <card-body>예제에 오신 것을 환영합니다</card-body>
  </div>
</custom-card>
```

`<ng-content>` 자리 표시자는 [컴포넌트 선택자](guide/components/selectors)와 동일한 CSS 선택자를 지원합니다.

하나 이상의 `select` 속성을 가진 `<ng-content>` 자리 표시자와 `select` 속성이 없는 `<ng-content>` 자리를 포함하면, 후자는 `select` 속성과 일치하지 않는 모든 요소를 캡처합니다:

```angular-html
<!-- 컴포넌트 템플릿 -->
<div class="card-shadow">
  <ng-content select="card-title"></ng-content>
  <div class="card-divider"></div>
  <!-- "card-title"를 제외한 모든 것을 캡처 -->
  <ng-content></ng-content>
</div>
```

```angular-html
<!-- 컴포넌트 사용하기 -->
<custom-card>
  <card-title>안녕하세요</card-title>
  <img src="..." />
  <p>예제에 오신 것을 환영합니다</p>
</custom-card>
```

```angular-html
<!-- 렌더링된 DOM -->
<custom-card>
  <div class="card-shadow">
    <card-title>안녕하세요</card-title>
    <div class="card-divider"></div>
    <img src="..." />
    <p>예제에 오신 것을 환영합니다></p>
  </div>
</custom-card>
```

컴포넌트가 `select` 속성이 없는 `<ng-content>` 자리 표시자를 포함하지 않으면, 컴포넌트의 자리 표시자와 일치하지 않는 요소는 DOM에 렌더링되지 않습니다.

## 기본 콘텐츠

Angular는 컴포넌트의 `<ng-content>` 자리 표시자에 대한 *기본 콘텐츠*를 표시할 수 있습니다. 이 경우 컴포넌트에 일치하는 자식 콘텐츠가 없으면 기본 콘텐츠를 사용할 수 있습니다. 기본 콘텐츠는 `<ng-content>` 요소 자체에 자식 콘텐츠를 추가하여 지정할 수 있습니다.

```angular-html
<!-- 컴포넌트 템플릿 -->
<div class="card-shadow">
  <ng-content select="card-title">기본 제목</ng-content>
  <div class="card-divider"></div>
  <ng-content select="card-body">기본 본문</ng-content>
</div>
```

```angular-html
<!-- 컴포넌트 사용하기 -->
<custom-card>
  <card-title>안녕하세요</card-title>
  <!-- 카드 본문 제공하지 않음 -->
</custom-card>
```

```angular-html
<!-- 렌더링된 DOM -->
<custom-card>
  <div class="card-shadow">
    안녕하세요
    <div class="card-divider"></div>
    기본 본문
  </div>
</custom-card>
```

## 투영을 위한 콘텐츠 별칭 만들기

Angular는 `ngProjectAs`라는 특별한 속성을 지원합니다. 이 속성을 사용하여 임의의 요소에 대한 CSS 선택자를 지정할 수 있습니다. `ngProjectAs`가 있는 요소가 `<ng-content>` 자리 표시자와 비교될 때마다 Angular는 요소의 정체성 대신 `ngProjectAs` 값을 비교합니다:

```angular-html
<!-- 컴포넌트 템플릿 -->
<div class="card-shadow">
  <ng-content select="card-title"></ng-content>
  <div class="card-divider"></div>
  <ng-content></ng-content>
</div>
```

```angular-html
<!-- 컴포넌트 사용하기 -->
<custom-card>
  <h3 ngProjectAs="card-title">안녕하세요</h3>

  <p>예제에 오신 것을 환영합니다</p>
</custom-card>
```

```angular-html
<!-- 렌더링된 DOM -->
<custom-card>
  <div class="card-shadow">
    <h3>안녕하세요</h3>
    <div class="card-divider"></div>
    <p>예제에 오신 것을 환영합니다></p>
  </div>
</custom-card>
```

`ngProjectAs`는 정적 값만 지원하며 동적 표현식에 바인딩할 수 없습니다.