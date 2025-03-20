# 구성 요소 스타일링

팁: 이 가이드는 이미 [필수 가이드](essentials)를 읽었다고 가정합니다. Angular에 익숙하지 않다면 먼저 그것을 읽으세요.

구성 요소는 해당 구성 요소의 DOM에 적용되는 CSS 스타일을 선택적으로 포함할 수 있습니다:

<docs-code language="angular-ts" highlight="[4]">
@Component({
  selector: 'profile-photo',
  template: `<img src="profile-photo.jpg" alt="Your profile photo">`,
  styles: ` img { border-radius: 50%; } `,
})
export class ProfilePhoto { }
</docs-code>

또한 스타일을 별도의 파일로 작성할 수도 있습니다:

<docs-code language="angular-ts" highlight="[4]">
@Component({
  selector: 'profile-photo',
  templateUrl: 'profile-photo.html',
  styleUrl: 'profile-photo.css',
})
export class ProfilePhoto { }
</docs-code>

Angular가 구성 요소를 컴파일할 때, 이러한 스타일은 해당 구성 요소의 JavaScript 출력과 함께 전송됩니다. 이는 구성 요소 스타일이 JavaScript 모듈 시스템에 참여한다는 것을 의미합니다. Angular 구성 요소를 렌더링할 때 프레임워크는 관련 스타일을 자동으로 포함하며, 구성 요소를 지연 로드할 때도 마찬가지입니다.

Angular는 [Sass](https://sass-lang.com), [less](https://lesscss.org),
및 [stylus](https://stylus-lang.com)를 포함하여 CSS를 출력하는 모든 도구와 함께 작동합니다.

## 스타일 스코핑

모든 구성 요소는 프레임워크가 구성 요소의 스타일을 스코핑하는 방법을 결정하는 **뷰 캡슐화** 설정을 가집니다. 세 가지 뷰 캡슐화 모드가 있습니다: `Emulated`, `ShadowDom`, 및 `None`. `@Component` 데코레이터에서 모드를 지정할 수 있습니다:

<docs-code language="angular-ts" highlight="[3]">
@Component({
  ...,
  encapsulation: ViewEncapsulation.None,
})
export class ProfilePhoto { }
</docs-code>

### ViewEncapsulation.Emulated

기본적으로 Angular는 에뮬레이티드 캡슐화를 사용하여 구성 요소의 스타일이 해당 구성 요소의 템플릿에 정의된 요소에만 적용되도록 합니다. 이 모드에서 프레임워크는 각 구성 요소 인스턴스에 대해 고유한 HTML 속성을 생성하고, 해당 속성을 구성 요소의 템플릿의 요소에 추가하며, 해당 속성을 구성 요소 스타일에 정의된 CSS 선택기에 삽입합니다.

이 모드는 구성 요소의 스타일이 누출되어 다른 구성 요소에 영향을 미치지 않도록 보장합니다. 그러나 구성 요소 외부에 정의된 글로벌 스타일은 여전히 에뮬레이티드 캡슐화가 있는 구성 요소 내부의 요소에 영향을 줄 수 있습니다.

에뮬레이티드 모드에서는 Angular가 [`:host`](https://developer.mozilla.org/docs/Web/CSS/:host)
및 [`:host-context()`](https://developer.mozilla.org/docs/Web/CSS/:host-context) 의사 클래스를
[Shadow DOM](https://developer.mozilla.org/docs/Web/Web_Components/Using_shadow_DOM)을 사용하지 않고 지원합니다.
컴파일 중에 프레임워크는 이러한 의사 클래스를 속성으로 변환하여 런타임에 이러한 네이티브 의사 클래스의 규칙을 준수하지 않게 만듭니다(예: 브라우저 호환성, 특정성). Angular의 에뮬레이티드 캡슐화 모드는 `::shadow`나 `::part`와 같은 Shadow DOM과 관련된 다른 의사 클래스를 지원하지 않습니다.

#### `::ng-deep`

Angular의 에뮬레이티드 캡슐화 모드는 사용자 정의 의사 클래스 `::ng-deep`을 지원합니다. 이 의사 클래스를 CSS 규칙에 적용하면 해당 규칙에 대한 캡슐화가 비활성화되어 전역 스타일로 변환됩니다. **Angular 팀은 `::ng-deep`의 새 사용을 강력히 권장하지 않습니다.** 이러한 API는 오직 이전 버전과의 호환성을 위해 남아 있습니다.

### ViewEncapsulation.ShadowDom

이 모드는 [웹 표준 Shadow DOM API](https://developer.mozilla.org/docs/Web/Web_Components/Using_shadow_DOM)를 사용하여 구성 요소 내에서 스타일을 스코핑합니다. 이 모드를 활성화하면 Angular는 구성 요소의 호스트 요소에 그림자 루트를 첨부하고 구성 요소의 템플릿과 스타일을 해당 그림자 트리에 렌더링합니다.

이 모드는 _오로지_ 해당 구성 요소의 스타일만 구성 요소의 템플릿의 요소에 적용되도록 엄격하게 보장합니다. 글로벌 스타일은 그림자 트리의 요소에 영향을 줄 수 없으며 그림자 트리 내의 스타일은 해당 그림자 트리 외부의 요소에 영향을 미칠 수 없습니다.

`ShadowDom` 캡슐화를 활성화하면 스타일 스코핑 외에도 더 많은 영향을 미칩니다. 그림자 트리에서 구성 요소를 렌더링하면 이벤트 전파, [<slot> API](https://developer.mozilla.org/docs/Web/Web_Components/Using_templates_and_slots)와의 상호 작용, 및 브라우저 개발자 도구가 요소를 보여주는 방식에 영향을 줍니다. 이 옵션을 활성화하기 전에 애플리케이션에서 Shadow DOM을 사용할 때의 전체적인 영향을 항상 이해하십시오.

### ViewEncapsulation.None

이 모드는 구성 요소에 대한 모든 스타일 캡슐화를 비활성화합니다. 구성 요소에 관련된 모든 스타일은 전역 스타일과 같이 작동합니다.

## 템플릿에서 스타일 정의

구성 요소의 템플릿에서 `<style>` 요소를 사용하여 추가 스타일을 정의할 수 있습니다. 방식으로 정의된 스타일에는 구성 요소의 뷰 캡슐화 모드가 적용됩니다.

Angular는 스타일 요소 내에서 바인딩을 지원하지 않습니다.

## 외부 스타일 파일 참조

구성 요소 템플릿은 [<link> 요소](https://developer.mozilla.org/docs/Web/HTML/Element/link)를 사용하여 CSS 파일을 참조할 수 있습니다. 또한 CSS에서 CSS 파일을 참조하기 위해 [@import at-rule](https://developer.mozilla.org/docs/Web/CSS/@import)를 사용할 수 있습니다. Angular는 이러한 참조를 _외부_ 스타일로 처리합니다. 외부 스타일은 에뮬레이티드 뷰 캡슐화의 영향을 받지 않습니다.