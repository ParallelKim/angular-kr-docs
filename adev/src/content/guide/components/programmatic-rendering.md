# 프로그램적으로 컴포넌트 렌더링하기

팁: 이 가이드는 여러분이 이미 [필수 가이드](essentials)를 읽었다고 가정합니다. Angular가 처음이라면 먼저 그 내용을 읽으세요.

템플릿에서 컴포넌트를 직접 사용하는 것 외에도, 컴포넌트를 동적으로 렌더링할 수 있습니다.
컴포넌트를 동적으로 렌더링하는 주요 방법은 `NgComponentOutlet`을 사용하는 것과 `ViewContainerRef`를 사용하는 것입니다.

## NgComponentOutlet 사용하기

`NgComponentOutlet`은 주어진 컴포넌트를 템플릿에서 동적으로 렌더링하는 구조 지시어입니다.

```angular-ts
@Component({ ... })
export class AdminBio { /* ... */ }

@Component({ ... })
export class StandardBio { /* ... */ }

@Component({
  ...,
  template: `
    <p>프로필: {{user.name}}</p>
    <ng-container *ngComponentOutlet="getBioComponent()" /> `
})
export class CustomDialog {
  @Input() user: User;

  getBioComponent() {
    return this.user.isAdmin ? AdminBio : StandardBio;
  }
}
```

지시어의 기능에 대한 더 많은 정보는 [NgComponentOutlet API 참조](api/common/NgComponentOutlet)를 참조하세요.

## ViewContainerRef 사용하기

**뷰 컨테이너**는 Angular의 컴포넌트 트리에서 콘텐츠를 포함할 수 있는 노드를 의미합니다. 어떤 컴포넌트나 지시어도 `ViewContainerRef`를 주입하여 해당 컴포넌트나 지시어의 DOM 내 위치에 해당하는 뷰 컨테이너의 참조를 얻을 수 있습니다.

`ViewContainerRef`의 `createComponent` 메서드를 사용하여 컴포넌트를 동적으로 생성하고 렌더링할 수 있습니다. `ViewContainerRef`로 새로운 컴포넌트를 생성하면 Angular는 이를 `ViewContainerRef`를 주입한 컴포넌트나 지시어의 다음 형제로 DOM에 추가합니다.

```angular-ts
@Component({
  selector: 'leaf-content',
  template: `
    이것은 리프 콘텐츠입니다
  `,
})
export class LeafContent {}

@Component({
  selector: 'outer-container',
  template: `
    <p>이것은 외부 컨테이너의 시작입니다</p>
    <inner-item />
    <p>이것은 외부 컨테이너의 끝입니다</p>
  `,
})
export class OuterContainer {}

@Component({
  selector: 'inner-item',
  template: `
    <button (click)="loadContent()">콘텐츠 로드하기</button>
  `,
})
export class InnerItem {
  constructor(private viewContainer: ViewContainerRef) {}

  loadContent() {
    this.viewContainer.createComponent(LeafContent);
  }
}
```

위의 예에서 "콘텐츠 로드하기" 버튼을 클릭하면 다음과 같은 DOM 구조가 생성됩니다.

```angular-html
<outer-container>
  <p>이것은 외부 컨테이너의 시작입니다</p>
  <inner-item>
    <button>콘텐츠 로드하기</button>
  </inner-item>
  <leaf-content>이것은 리프 콘텐츠입니다</leaf-content>
  <p>이것은 외부 컨테이너의 끝입니다</p>
</outer-container>
```

## 지연 로딩 컴포넌트

위에서 설명한 두 가지 접근 방법인 `NgComponentOutlet`과 `ViewContainerRef`를 사용할 수 있으며, 이를 통해 표준 JavaScript [동적 import](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import)와 함께 지연 로드된 컴포넌트를 렌더링할 수 있습니다.

```angular-ts
@Component({
  ...,
  template: `
    <section>
      <h2>기본 설정</h2>
      <basic-settings />
    </section>
    <section>
      <h2>고급 설정</h2>
      <button (click)="loadAdvanced()" *ngIf="!advancedSettings">
        고급 설정 로드하기
      </button>
      <ng-container *ngComponentOutlet="advancedSettings" />
    </section>
  `
})
export class AdminSettings {
  advancedSettings: {new(): AdvancedSettings} | undefined;

  async loadAdvanced() {
    const { AdvancedSettings } = await import('path/to/advanced_settings.js');
    this.advancedSettings = AdvancedSettings;
  }
}
```

위의 예제는 버튼 클릭을 통해 `AdvancedSettings`를 로드하고 표시합니다.