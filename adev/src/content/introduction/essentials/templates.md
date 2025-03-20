<docs-decorative-header title="템플릿" imgSrc="adev/src/assets/images/templates.svg"> <!-- markdownlint-disable-line -->
Angular의 템플릿 구문을 사용하여 동적 사용자 인터페이스를 만듭니다.
</docs-decorative-header>

컴포넌트 템플릿은 단순한 정적 HTML이 아닙니다. 컴포넌트 클래스의 데이터를 사용하고 사용자 상호작용에 대한 핸들러를 설정할 수 있습니다.

## 동적 텍스트 표시

Angular에서 *바인딩*은 컴포넌트의 템플릿과 데이터 간의 동적 연결을 생성합니다. 이 연결은 컴포넌트의 데이터에 대한 변경 사항이 자동으로 렌더링된 템플릿을 업데이트하도록 보장합니다.

다음과 같이 중괄호 두 개를 사용하여 템플릿에서 동적 텍스트를 표시하기 위한 바인딩을 생성할 수 있습니다.

```angular-ts
@Component({
  selector: 'user-profile',
  template: `<h1>Profile for {{userName()}}</h1>`,
})
export class TodoListItem {
  userName = signal('pro_programmer_123');
}
```

Angular가 컴포넌트를 렌더링할 때 다음과 같이 표시됩니다:

```html
<h1>Profile for pro_programmer_123</h1>
```

Angular는 signal의 값이 변경될 때 바인딩을 자동으로 최신 상태로 유지합니다. 위의 예를 기반으로, `userName` signal의 값을 업데이트하면:

```typescript
this.userName.set('cool_coder_789');
```

렌더링된 페이지는 새로운 값을 반영하도록 업데이트됩니다:

```html
<h1>Profile for cool_coder_789</h1>
```

## 동적 속성 및 특성 설정

Angular는 정사각형 괄호를 사용하여 DOM 속성에 동적 값을 바인딩하는 것을 지원합니다:

```angular-ts
@Component({
  /*...*/
  // `isValidUserId` 값에 따라 버튼의 `disabled` 속성을 설정합니다.
  template: `<button [disabled]="isValidUserId()">변경 사항 저장</button>`,
})
export class UserProfile {
  isValidUserId = signal(false);
}
```

속성 이름에 `attr.`를 접두사로 추가하여 HTML _속성_에 바인딩할 수도 있습니다:

```angular-html
<!-- `<ul>` 요소의 `role` 속성을 `listRole`의 값에 바인딩합니다. -->
<ul [attr.role]="listRole()">
```

Angular는 바인딩된 값이 변경될 때 DOM 속성과 속성을 자동으로 업데이트합니다.

## 사용자 상호작용 처리

Angular는 템플릿의 요소에 괄호를 사용하여 이벤트 리스너를 추가할 수 있게 해줍니다:

```angular-ts
@Component({
  /*...*/
  // `cancelSubscription` 메서드를 호출하는 'click' 이벤트 핸들러를 추가합니다.
  template: `<button (click)="cancelSubscription()">구독 취소</button>`,
})
export class UserProfile {
  /* ... */
  
  cancelSubscription() { /* 여기에 이벤트 처리 코드를 작성하세요. */  }
}
```

이벤트[객체](https://developer.mozilla.org/docs/Web/API/Event)를 리스너에 전달해야 하는 경우 함수 호출 내에서 Angular의 내장 `$event` 변수를 사용할 수 있습니다:

```angular-ts
@Component({
  /*...*/
  // `cancelSubscription` 메서드를 호출하는 'click' 이벤트 핸들러를 추가합니다. 
  template: `<button (click)="cancelSubscription($event)">구독 취소</button>`,
})
export class UserProfile {
  /* ... */
  
  cancelSubscription(event: Event) { /* 여기에 이벤트 처리 코드를 작성하세요. */  }
}
```

## `@if` 및 `@for`를 사용한 제어 흐름

Angular의 `@if` 블록을 사용하여 템플릿의 일부를 조건부로 숨기거나 표시할 수 있습니다:

```angular-html
<h1>사용자 프로필</h1>

@if (isAdmin()) {
  <h2>관리자 설정</h2>
  <!-- ... -->
}
```

`@if` 블록은 선택적 `@else` 블록도 지원합니다:

```angular-html
<h1>사용자 프로필</h1>

@if (isAdmin()) {
  <h2>관리자 설정</h2>
  <!-- ... -->
} @else {
  <h2>사용자 설정</h2>
  <!-- ... -->  
}
```

Angular의 `@for` 블록을 사용하여 템플릿의 일부를 여러 번 반복할 수 있습니다:

```angular-html
<h1>사용자 프로필</h1>

<ul class="user-badge-list">
  @for (badge of badges(); track badge.id) {
    <li class="user-badge">{{badge.name}}</li>
  }
</ul>
```

Angular는 위의 예에서 `track` 키워드를 사용하여 `@for`에 의해 생성된 DOM 요소와 데이터를 연관시킵니다. 더 많은 정보는 [_@for 블록의 track이 중요한 이유_](guide/templates/control-flow#why-is-track-in-for-blocks-important)를 참조하세요.

팁: Angular 템플릿에 대해 더 알고 싶으신가요? 전체 세부사항은 [심층 템플릿 가이드](guide/templates)를 참조하세요.

## 다음 단계

이제 애플리케이션에 동적 데이터와 템플릿이 생겼으니, 특정 요소를 조건부로 숨기거나 표시하고, 요소를 반복하는 방법을 배울 때입니다.

<docs-pill-row>
  <docs-pill title="종속성 주입이 있는 모듈형 디자인" href="essentials/dependency-injection" />
  <docs-pill title="심층 템플릿 가이드" href="guide/templates" />
</docs-pill-row>