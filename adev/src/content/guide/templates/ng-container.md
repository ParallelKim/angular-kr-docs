# 그룹화 요소 ng-container 사용하기

`<ng-container>`는 Angular에서 여러 요소를 함께 그룹화하거나 템플릿 내 위치를 표시하는 특별한 요소로, 실제 요소를 DOM에 렌더링하지 않습니다.

```angular-html
<!-- 컴포넌트 템플릿 -->
<section>
  <ng-container>
    <h3>사용자 정보</h3>
    <p>사용자에 대한 정보입니다.</p>
  </ng-container>
</section>
```

```angular-html
<!-- 렌더링된 DOM -->
<section>
  <h3>사용자 정보</h3>
  <p>사용자에 대한 정보입니다.</p>
</section>
```

`<ng-container>`에 지시어를 적용하여 템플릿의 일부에 동작이나 구성을 추가할 수 있습니다.

Angular는 `<ng-container>`에 적용된 모든 속성 바인딩 및 이벤트 리스너를 무시하며, 지시어를 통해 적용된 것들도 포함됩니다.

## `<ng-container>`를 사용하여 동적 콘텐츠 표시하기

`<ng-container>`는 동적 콘텐츠를 렌더링하기 위한 자리 표시자로 작용할 수 있습니다.

### 컴포넌트 렌더링하기

Angular의 내장 `NgComponentOutlet` 지시어를 사용하여 `<ng-container>`의 위치에 동적으로 컴포넌트를 렌더링할 수 있습니다.

```angular-ts
@Component({
  template: `
    <h2>당신의 프로필</h2>
    <ng-container [ngComponentOutlet]="profileComponent()" />
  `
})
export class UserProfile {
  isAdmin = input(false);
  profileComponent = computed(() => this.isAdmin() ? AdminProfile : BasicUserProfile);
}
```

위 예제에서 `NgComponentOutlet` 지시어는 `<ng-container>` 요소의 위치에 `AdminProfile` 또는 `BasicUserProfile`을 동적으로 렌더링합니다.

### 템플릿 조각 렌더링하기

Angular의 내장 `NgTemplateOutlet` 지시어를 사용하여 `<ng-container>`의 위치에 템플릿 조각을 동적으로 렌더링할 수 있습니다.

```angular-ts
@Component({
  template: `
    <h2>당신의 프로필</h2>
    <ng-container [ngTemplateOutlet]="profileTemplate()" />

    <ng-template #admin>관리자 프로필입니다</ng-template>
    <ng-template #basic>기본 프로필입니다</ng-template>
  `
})
export class UserProfile {
  isAdmin = input(false);
  adminTemplate = viewChild('admin', {read: TemplateRef});
  basicTemplate = viewChild('basic', {read: TemplateRef});
  profileTemplate = computed(() => this.isAdmin() ? this.adminTemplate() : this.basicTemplate());
}
```

위 예제에서 `ngTemplateOutlet` 지시어는 `<ng-container>` 요소의 위치에 두 개의 템플릿 조각 중 하나를 동적으로 렌더링합니다.

`NgTemplateOutlet`에 대한 자세한 정보는 [NgTemplateOutlets API 문서 페이지](/api/common/NgTemplateOutlet)를 참조하세요.

## `<ng-container>`를 구조적 지시어와 함께 사용하기

구조적 지시어를 `<ng-container>` 요소에 적용할 수도 있습니다. 일반적인 예로 `ngIf`와 `ngFor`가 있습니다.

```angular-html
<ng-container *ngIf="permissions == 'admin'">
  <h1>관리자 대시보드</h1>
  <admin-infographic></admin-infographic>
</ng-container>

<ng-container *ngFor="let item of items; index as i; trackBy: trackByFn">
  <h2>{{ item.title }}</h2>
  <p>{{ item.description }}</p>
</ng-container>
```

## 주입을 위한 `<ng-container>` 사용하기

Angular의 의존성 주입 시스템에 대한 자세한 정보는 의존성 주입 가이드를 참조하세요.

`<ng-container>`에 지시어를 적용하면 자식 요소가 지시어나 지시어가 제공하는 내용을 주입할 수 있습니다. 이는 템플릿의 특정 부분에 값을 선언적으로 제공하려는 경우에 사용합니다.

```angular-ts
@Directive({
  selector: '[theme]',
})
export class Theme {
  // 'light' 또는 'dark'를 수용하는 입력을 생성하며, 기본값은 'light'입니다.
  mode = input<'light' | 'dark'>('light');
}
```

```angular-html
<ng-container theme="dark">
  <profile-pic />
  <user-bio />
</ng-container>
```

위 예제에서 `ProfilePic` 및 `UserBio` 컴포넌트는 `Theme` 지시어를 주입하고 해당 `mode`에 따라 스타일을 적용할 수 있습니다.