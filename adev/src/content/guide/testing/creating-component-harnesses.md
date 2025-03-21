# 컴포넌트를 위한 하네스 생성하기

## 시작하기 전에

팁: 이 가이드는 이미 [컴포넌트 하네스 개요 가이드](guide/testing/component-harnesses-overview)를 읽었음을 전제로 합니다. 컴포넌트 하네스를 처음 사용하는 경우 먼저 이 부분을 읽어보세요.

### 테스트 하네스를 만드는 것이 언제 의미가 있나요?

Angular 팀은 여러 곳에서 사용되고 사용자 상호작용이 있는 공유 컴포넌트에 대한 컴포넌트 테스트 하네스를 생성할 것을 권장합니다. 이는 일반적으로 위젯 라이브러리 및 유사한 재사용 가능한 컴포넌트에 적용됩니다. 하네스는 이러한 경우에 유용한데, 이는 이러한 공유 컴포넌트의 소비자에게 컴포넌트와 상호작용하기 위한 잘 지원된 API를 제공하기 때문입니다. 하네스를 사용하는 테스트는 DOM 구조 및 특정 이벤트 리스너와 같은 이러한 공유 컴포넌트의 신뢰할 수 없는 구현 세부정보에 의존하는 것을 피할 수 있습니다.

애플리케이션의 페이지와 같이 한 곳에만 나타나는 컴포넌트의 경우, 하네스는 그리 큰 이점을 제공하지 않습니다. 이러한 상황에서는 컴포넌트의 테스트가 이 컴포넌트의 구현 세부정보에 합리적으로 의존할 수 있습니다. 왜냐하면 테스트와 컴포넌트가 동시에 업데이트되기 때문입니다. 하지만 유닛 테스트와 종단 간 테스트 모두에서 하네스를 사용할 경우 하네스는 여전히 어느 정도 가치를 제공합니다.

### CDK 설치

[컴포넌트 개발 키트 (CDK)](https://material.angular.io/cdk/categories)는 컴포넌트를 구축하기 위한 행동 원시 집합입니다. 컴포넌트 하네스를 사용하려면 먼저 npm에서 `@angular/cdk`를 설치하세요. Angular CLI를 사용하여 터미널에서 다음과 같이 할 수 있습니다:

<docs-code language="shell">
  ng add @angular/cdk
</docs-code>

## `ComponentHarness` 확장하기

추상 `ComponentHarness` 클래스는 모든 컴포넌트 하네스의 기본 클래스입니다. 사용자 정의 컴포넌트 하네스를 생성하려면 `ComponentHarness`를 확장하고 정적 속성 `hostSelector`를 구현합니다.

`hostSelector` 속성은 이 하네스 서브클래스와 일치하는 DOM의 요소를 식별합니다. 대부분의 경우, `hostSelector`는 해당 `Component` 또는 `Directive`의 선택자와 동일해야 합니다. 예를 들어 간단한 팝업 컴포넌트를 고려해보세요:

<docs-code language="typescript">
@Component({
  selector: 'my-popup',
  template: `
    <button (click)="toggle()">{{triggerText()}}</button>
    @if (isOpen()) {
      <div class="my-popup-content"><ng-content></ng-content></div>
    }
  `
})
class MyPopup {
  triggerText = input('');

  isOpen = signal(false);

  toggle() {
    this.isOpen.update((value) => !value);
  }
}
</docs-code>

이 경우, 컴포넌트에 대한 최소 하네스는 다음과 같아야 합니다:

<docs-code language="typescript">
class MyPopupHarness extends ComponentHarness {
  static hostSelector = 'my-popup';
}
</docs-code>

`ComponentHarness` 서브클래스는 `hostSelector` 속성만 필요하지만 대부분의 하네스는 정적 `with` 메소드를 구현하여 `HarnessPredicate` 인스턴스를 생성해야 합니다. [필터링 하네스 섹션](guide/testing/using-component-harnesses#filtering-harnesses)에서는 이 부분을 더 자세히 다룹니다.

## 컴포넌트 DOM에서 요소 찾기

각 `ComponentHarness` 서브클래스의 인스턴스는 해당 컴포넌트의 특정 인스턴스를 나타냅니다. `ComponentHarness` 기본 클래스의 `host()` 메서드를 통해 컴포넌트의 호스트 요소에 접근할 수 있습니다.

`ComponentHarness`는 또한 컴포넌트의 DOM 내에서 요소를 찾기 위한 여러 메소드를 제공합니다. 이 메소드들은 `locatorFor()`, `locatorForOptional()`, `locatorForAll()`입니다. 이러한 메소드는 요소를 찾는 함수를 만들지만, 직접적으로 요소를 찾지 않습니다. 이 접근 방식은 구식 요소에 대한 참조를 캐시하는 것을 방지합니다. 예를 들어 `ngIf`가 요소를 숨겼다가 다시 표시할 때 결과는 새로운 DOM 요소입니다. 함수를 사용하면 테스트가 항상 DOM의 현재 상태를 참조할 수 있도록 보장합니다.

다양한 `locatorFor` 메소드의 전체 목록에 대한 자세한 내용은 [ComponentHarness API 참조 페이지](https://material.angular.io/cdk/testing/api#ComponentHarness)를 참조하세요.

예를 들어, 위에서 논의된 `MyPopupHarness`는 트리거와 콘텐츠 요소를 얻기 위한 메소드를 다음과 같이 제공할 수 있습니다:

<docs-code language="typescript">
class MyPopupHarness extends ComponentHarness {
  static hostSelector = 'my-popup';

  /** 트리거 요소를 가져옵니다 */
  getTriggerElement = this.locatorFor('button');

  /** 콘텐츠 요소를 가져옵니다. */
  getContentElement = this.locatorForOptional('.my-popup-content');
}
</docs-code>

## `TestElement` 인스턴스와 작업하기

`TestElement`는 다른 테스트 환경(유닛 테스트, WebDriver 등)에서 작동하도록 설계된 추상화입니다. 하네스를 사용할 때는 모든 DOM 상호작용을 이 인터페이스를 통해 수행해야 합니다. `document.querySelector()`와 같은 DOM 요소에 접근하는 다른 방법은 모든 테스트 환경에서 작동하지 않습니다.

`TestElement`는 `blur()`, `click()`, `getAttribute()` 등과 같은 기본 DOM과 상호작용할 수 있는 여러 메소드를 제공합니다. 모든 메소드 목록에 대한 자세한 내용은 [TestElement API 참조 페이지](https://material.angular.io/cdk/testing/api#TestElement)를 참조하세요.

컴포넌트 소비자가 직접 정의하는 요소(예: 컴포넌트의 호스트 요소)가 아닌 한 `TestElement` 인스턴스를 하네스 사용자에게 노출하지 마세요. 내부 요소에 대한 `TestElement` 인스턴스를 노출하면 사용자가 컴포넌트의 내부 DOM 구조에 의존하게 됩니다.

대신 최종 사용자가 수행할 수 있는 특정 작업이나 관찰할 수 있는 특정 상태에 대한 더 좁은 집중의 메소드를 제공합니다. 예를 들어, 이전 섹션의 `MyPopupHarness`는 `toggle` 및 `isOpen`과 같은 메소드를 제공할 수 있습니다:

<docs-code language="typescript">
class MyPopupHarness extends ComponentHarness {
  static hostSelector = 'my-popup';

  protected getTriggerElement = this.locatorFor('button');
  protected getContentElement = this.locatorForOptional('.my-popup-content');

  /** 팝업의 열림 상태를 전환합니다. */
  async toggle() {
    const trigger = await this.getTriggerElement();
    return trigger.click();
  }

  /** 팝업이 열려 있는지 확인합니다. */
  async isOpen() {
    const content = await this.getContentElement();
    return !!content;
  }
}
</docs-code>

## 하위 컴포넌트를 위한 하네스 로딩

더 큰 컴포넌트는 종종 하위 컴포넌트를 구성합니다. 이 구조를 컴포넌트의 하네스에도 반영할 수 있습니다. `ComponentHarness`의 각 `locatorFor` 메소드는 요소가 아닌 하위 하네스를 찾는 데 사용할 수 있는 대체 시그니처가 있습니다.

다양한 locatorFor 메소드에 대한 전체 목록은 [ComponentHarness API 참조 페이지](https://material.angular.io/cdk/testing/api#ComponentHarness)를 참조하세요.

예를 들어, 위에서 언급한 팝업을 사용하여 빌드한 메뉴를 고려해보세요:

<docs-code language="typescript">
@Directive({
  selector: 'my-menu-item'
})
class MyMenuItem {}

@Component({
  selector: 'my-menu',
  template: `
    <my-popup>
      <ng-content></ng-content>
    </my-popup>
  `
})
class MyMenu {
  triggerText = input('');

  @ContentChildren(MyMenuItem) items: QueryList<MyMenuItem>;
}
</docs-code>

그런 다음 `MyMenu`의 하네스는 `MyPopup` 및 `MyMenuItem`에 대한 다른 하네스를 활용할 수 있습니다:

<docs-code language="typescript">
class MyMenuHarness extends ComponentHarness {
  static hostSelector = 'my-menu';

  protected getPopupHarness = this.locatorFor(MyPopupHarness);

  /** 현재 표시된 메뉴 항목을 가져옵니다 (메뉴가 닫히면 빈 목록). */
  getItems = this.locatorForAll(MyMenuItemHarness);

  /** 메뉴의 열림 상태를 전환합니다. */
  async toggle() {
    const popupHarness = await this.getPopupHarness();
    return popupHarness.toggle();
  }
}

class MyMenuItemHarness extends ComponentHarness {
  static hostSelector = 'my-menu-item';
}
</docs-code>

## `HarnessPredicate`로 하네스 인스턴스 필터링
페이지에 특정 컴포넌트의 여러 인스턴스가 포함된 경우, 특정 컴포넌트 인스턴스를 얻기 위해 컴포넌트의 일부 속성을 기반으로 필터링할 수 있습니다. 예를 들어, 특정 텍스트가 있는 버튼이나 특정 ID를 가진 메뉴가 있을 수 있습니다. `HarnessPredicate` 클래스는 `ComponentHarness` 서브클래스에 대한 이러한 기준을 캡처할 수 있습니다. 테스트 작성자가 `HarnessPredicate` 인스턴스를 수동으로 구성할 수 있지만, `ComponentHarness` 서브클래스가 일반 필터를 위한 헬퍼 메소드를 제공하면 더 쉽습니다.

각 `ComponentHarness` 서브클래스에 대한 `HarnessPredicate`를 반환하는 정적 `with()` 메소드를 생성해야 합니다. 이는 테스트 작성자가 쉽게 이해할 수 있는 코드를 작성할 수 있도록 합니다. 예를 들어, `loader.getHarness(MyMenuHarness.with({selector: '#menu1'}))`와 같이 사용할 수 있습니다. 표준 선택자 및 조상 옵션 외에도, `with` 메소드는 특정 서브클래스에 대해 의미 있는 기타 옵션을 추가해야 합니다.

추가 옵션을 추가해야 하는 하네스는 필요에 따라 `BaseHarnessFilters` 인터페이스와 추가 선택적 속성을 확장해야 합니다. `HarnessPredicate`는 옵션을 추가하기 위한 여러 편의 메소드를 제공합니다: `stringMatches()`, `addOption()`, `add()`. 전체 설명은 [HarnessPredicate API 페이지](https://material.angular.io/cdk/testing/api#HarnessPredicate)를 참조하세요.

예를 들어, 메뉴와 작업할 때 트리거 텍스트를 기반으로 필터링하고 메뉴 항목의 텍스트를 기반으로 필터링하는 것이 유용합니다:

<docs-code language="typescript">
interface MyMenuHarnessFilters extends BaseHarnessFilters {
  /** 메뉴의 트리거 텍스트에 따라 필터링합니다. */
  triggerText?: string | RegExp;
}

interface MyMenuItemHarnessFilters extends BaseHarnessFilters {
  /** 메뉴 항목의 텍스트에 따라 필터링합니다. */
  text?: string | RegExp;
}

class MyMenuHarness extends ComponentHarness {
  static hostSelector = 'my-menu';

  /** 특정 `MyMenuHarness`를 찾기 위해 사용되는 `HarnessPredicate`를 생성합니다. */
  static with(options: MyMenuHarnessFilters): HarnessPredicate<MyMenuHarness> {
    return new HarnessPredicate(MyMenuHarness, options)
        .addOption('trigger text', options.triggerText,
            (harness, text) => HarnessPredicate.stringMatches(harness.getTriggerText(), text));
  }

  protected getPopupHarness = this.locatorFor(MyPopupHarness);

  /** 메뉴 트리거의 텍스트를 가져옵니다. */
  async getTriggerText(): Promise<string> {
    const popupHarness = await this.getPopupHarness();
    return popupHarness.getTriggerText();
  }
  ...
}

class MyMenuItemHarness extends ComponentHarness {
  static hostSelector = 'my-menu-item';

  /** 특정 `MyMenuItemHarness`를 찾기 위해 사용되는 `HarnessPredicate`를 생성합니다. */
  static with(options: MyMenuItemHarnessFilters): HarnessPredicate<MyMenuItemHarness> {
    return new HarnessPredicate(MyMenuItemHarness, options)
        .addOption('text', options.text,
            (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }

  /** 메뉴 항목의 텍스트를 가져옵니다. */
  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }
}
</docs-code>

`HarnessPredicate`를 `ComponentHarness` 클래스 대신에 `HarnessLoader`, `LocatorFactory`, 또는 `ComponentHarness`의 어떤 API에든 전달할 수 있습니다. 이는 테스트 작성자가 하네스 인스턴스를 생성할 때 특정 컴포넌트 인스턴스를 쉽게 목표로 할 수 있게 합니다. 또한 하네스 작성자가 같은 `HarnessPredicate`를 활용하여 하네스 클래스에서 더 강력한 API를 활성화할 수 있습니다. 예를 들어, 위의 `MyMenuHarness`에 있는 `getItems` 메소드를 고려하세요. 필터링 API를 추가하면 하네스 사용자가 특정 메뉴 항목을 검색할 수 있습니다:

<docs-code language="typescript">
class MyMenuHarness extends ComponentHarness {
  static hostSelector = 'my-menu';

  /** 메뉴의 항목 목록을 가져옵니다. 주어진 기준에 따라 필터링될 수 있습니다. */
  async getItems(filters: MyMenuItemHarnessFilters = {}): Promise<MyMenuItemHarness[]> {
    const getFilteredItems = this.locatorForAll(MyMenuItemHarness.with(filters));
    return getFilteredItems();
  }
  ...
}
</docs-code>

## 콘텐츠 프로젝션을 사용하는 요소에 대한 `HarnessLoader` 생성

일부 컴포넌트는 컴포넌트의 템플릿에 추가 콘텐츠를 프로젝션합니다. 자세한 내용은 [콘텐츠 프로젝션 가이드](guide/components/content-projection)를 참조하세요.

콘텐츠 프로젝션을 사용하는 컴포넌트에 대한 하네스를 생성할 때 `<ng-content>`를 포함하는 요소에 특정된 `HarnessLoader` 인스턴스를 추가하십시오. 이는 하네스 사용자가 콘텐츠로 전달된 어떤 컴포넌트에 대해서도 추가 하네스를 로드할 수 있게 합니다. `ComponentHarness`는 이와 같은 경우에 `harnessLoaderFor()`, `harnessLoaderForOptional()`, `harnessLoaderForAll()`과 같은 하네스 로더 인스턴스를 생성하는 데 사용할 수 있는 여러 메소드를 가지고 있습니다. 더 자세한 내용은 [HarnessLoader 인터페이스 API 참조 페이지](https://material.angular.io/cdk/testing/api#HarnessLoader)를 참조하세요.

예를 들어, 위의 `MyPopupHarness` 예는 `<ng-content>` 내에서 하네스를 로드할 수 있는 지원을 추가하기 위해 `ContentContainerComponentHarness`를 확장할 수 있습니다.

<docs-code language="typescript">
class MyPopupHarness extends ContentContainerComponentHarness<string> {
  static hostSelector = 'my-popup';
}
</docs-code>

## 컴포넌트 호스트 요소 외부의 요소에 접근하기

컴포넌트 하네스가 해당 컴포넌트의 호스트 요소 외부의 요소에 접근해야 할 때가 있습니다. 예를 들어, 떠 있는 요소나 팝업을 표시하는 코드는 종종 DOM 요소를 문서 본체에 직접 첨부합니다. Angular CDK의 `Overlay` 서비스와 같은 예입니다.

이 경우 `ComponentHarness`는 문서의 루트 요소에 대한 `LocatorFactory`를 얻는 데 사용할 수 있는 메소드를 제공합니다. `LocatorFactory`는 `ComponentHarness` 기본 클래스와 유사한 대부분의 API를 지원하며, 문서의 루트 요소를 기준으로 쿼리하는 데 사용할 수 있습니다.

위의 `MyPopup` 컴포넌트가 팝업 콘텐츠를 위해 자체 템플릿의 요소 대신 CDK 오버레이를 사용하는 경우를 고려해 보세요. 이 경우, `MyPopupHarness`는 문서 루트에 뿌리를 두고 있는 로케이터 팩토리를 얻는 `documentRootLocatorFactory()` 메서드를 통해 콘텐츠 요소에 접근해야 합니다.

<docs-code language="typescript">
class MyPopupHarness extends ComponentHarness {
  static hostSelector = 'my-popup';

  /** 팝업의 콘텐츠 요소를 루트 요소로 하는 `HarnessLoader`를 가져옵니다. */
  async getHarnessLoaderForContent(): Promise<HarnessLoader> {
    const rootLocator = this.documentRootLocatorFactory();
    return rootLocator.harnessLoaderFor('my-popup-content');
  }
}
</docs-code>

## 비동기 작업 기다리기

`TestElement`의 메소드는 Angular의 변경 감지를 자동으로 트리거하고 `NgZone` 내부의 작업을 기다립니다. 대부분의 경우, 하네스 작성자가 비동기 작업을 기다리는 데 특별한 노력을 기울일 필요는 없습니다. 그러나 충분하지 않은 일부 엣지 케이스가 있습니다.

일부 경우, Angular 애니메이션은 애니메이션 이벤트가 완전히 플러시되기 전에 변경 감지와 후속 `NgZone` 안정성을 위해 두 번째 사이클이 필요할 수 있습니다. 이러한 경우에는 `ComponentHarness`에서 두 번째 라운드를 수행하기 위해 호출할 수 있는 `forceStabilize()` 메소드를 제공합니다.

`NgZone.runOutsideAngular()`를 사용하여 NgZone 외부에서 작업을 예약할 수 있습니다. NgZone 외부의 작업을 명시적으로 기다려야 하는 경우, 해당 하네스에서 `waitForTasksOutsideAngular()` 메서드를 호출해야 합니다. 이는 자동으로 발생하지 않기 때문입니다.