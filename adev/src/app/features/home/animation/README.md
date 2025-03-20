# `Animation` API

`Animation` 클래스는 CSS 기반 애니메이션을 생성하고 처리하는 간단한 인터페이스를 제공합니다. 본질적으로 이는 CSS 애니메이션 플레이어를 나타냅니다.

## API

CSS를 작성할 수 있고, 약간의 창의성이 있는 누구나 `Animation` API로 애니메이션을 생성할 수 있어야 합니다.

### Layers

먼저 애니메이션 템플릿을 논리적으로 의미 있는 레이어로 나누어야 합니다. 이러한 레이어는 필수 `layerId` 속성이 설정된 `AnimationLayerDirective`를 사용해야 합니다. 레이어 ID는 `Animation` 인스턴스에 대해 고유해야 합니다.

```html
<div adevAnimationLayer layerId="layer-1">
  <div class="circle"></div>
</div>
<div adevAnimationLayer layerId="layer-2">
  <div class="square"></div>
</div>
```

레이어는 애니메이션 호스트 컴포넌트 스타일시트의 일반 요소/컴포넌트로서 스타일이 적용되어야 합니다. 이러한 스타일은 초기 애니메이션 스타일로 작용합니다.

> [!CAUTION]
> 애니메이션을 적용할 계획이라면 `style` 속성을 통해 요소에 스타일을 적용하지 마십시오. 오래된 스타일은 애니메이션 프로세서에 의해 제거되므로 `style`을 통해 설정된 초기 스타일도 제거됩니다.

### Creating an `Animation` instance

새 애니메이션 인스턴스를 생성하려면 애니메이션 호스트 컴포넌트에서 `AnimationCreatorService` 서비스를 사용해야 합니다. 다음과 같이 사용할 수 있습니다:

```typescript
class AnimationHost implements AfterViewInit {
  private animationCreator = inject(AnimationCreatorService);
  layers = viewChildren(AnimationLayerDirective);

  constructor() {
    afterNextRender({ read: () => {
      // 레이어는 제공되어야 합니다
      const animation = this.animationCreator.createAnimation(this.layers());
      // ...
    }});
  }
}
```

### Definition

`Animation` 인스턴스를 생성한 후에는 `define()` 메서드에 `AnimationDefinition`을 제공해야 합니다:

```typescript
animation.define(DEFINITION);
```

정의는 실제 애니메이션이 설명되는 곳입니다. API는 CSS `@keyframes`와 매우 유사하며 시작(`from`) 및 종료(`to`) 스타일을 제공하며, 추가로 애니메이션 프로세서가 언제 스타일을 적용해야 할지를 제어할 수 있습니다. 또한, 다음 형식으로 대상 요소 또는 레이어를 지정해야 합니다:

```
<LAYER_ID> >> .<CLASS_NAME>
```

클래스 이름은 레이어 내의 요소에 해당해야 합니다. 지정된 요소 없이 레이어에 직접 접근하는 것도 지원됩니다(즉, `<LAYER_ID>`만 사용). 클래스 이름 앞에 있는 점에 주의하십시오. 내부적으로 `getElementsByClassName`를 사용하더라도, 향후 다른 유형의 선택자에 대한 지원을 추가할 수 있기 때문에 점이 존재합니다. 이는 레이어 ID와 클래스 이름 간의 구분을 제공합니다.

> [!TIP]
> 여러 개의 `AnimationRule`을 서로 다른 타이밍과 변경 비율로 결합하여 `@keyframes` 비율 기반 시퀀싱을 Achieve할 수 있습니다. CSS 타이밍 함수에 대해서도 동일하게 적용될 수 있습니다. 애니메이션 규칙 조합을 통해 유사성을 달성할 수 있습니다(현재는 선형 전환만 지원되지만 필요에 따라 변경될 수 있습니다).

```typescript
const DEFINITION: AnimationDefinition = [
  // 원의 색상을 검정색에서 흰색으로 변경합니다.
  {
    selector: `layer-1 >> .circle`,
    timeframe: [3, 5], // 3초에서 시작하여 5초에 종료됩니다.
    from: {
      'background-color': '#000',
    },
    to: {
      'background-color': '#fff',
    }
  }
];
```

시작 스타일은 요소의 초기 스타일과 일치하는 것이 좋습니다. 일반적으로는 문제가 되지 않지만 애니메이션된 CSS 속성에 `transition`을 추가하면 시각화에 문제가 발생할 수 있습니다.

> [!IMPORTANT]
> `from` 및 `to` CSS 속성은 일치해야 합니다.

#### Static rules

특정 스타일을 특정 시간에 적용하려면 대신 정적 애니메이션 규칙을 사용해야 합니다:

```typescript
// 7초에 레이어를 숨깁니다.
{
  selector: `layer-2`,
  at: 7,
  styles: {
    'display': 'none',
  },
}
```

> [!NOTE]
> `display: none`과 같은 정적 값은 동적 규칙(`timeframe`)의 경우 즉시 적용됩니다. 이들은 애니메이션할 수 없습니다.

### Animation duration and animation control methods

설명에서 언급했듯이, `Animation`은 본질적으로 CSS 플레이어입니다. 따라서 정의를 제공한 후 애니메이션을 시작하고 조작하기 위해 `play`, `pause`, `stop`, `seek`, `reset`과 같은 제어 메서드를 사용할 수 있습니다.

애니메이션 기간은 실행을 마지막으로 종료하는 규칙에 의해 자동으로 추론됩니다.

#### Plugins

플러그인 시스템은 애니메이션 기능을 확장할 수 있게 해줍니다. 현재 사용할 수 있는 두 개의 플러그인이 있습니다:

- `AnimationPlayer` – 개발에 사용됩니다. 이름에서 알 수 있듯이 사용의 용이성을 위해 애니메이션 제어를 렌더링합니다.
- `AnimationScrollHandler` – 애니메이션에 대한 페이지 스크롤 제어를 활성화합니다.

```typescript
animation.addPlugin(new AnimationScrollHandler(...));
```

> [!TIP]
> `AnimationPlugin` 인터페이스를 확장하여 자신만의 플러그인을 만들 수 있습니다.

> [!CAUTION]
> 메모리 누수나 오래된 UI 잔여물로 인해 플러그인을 추가한 경우 호스트 컴포넌트가 파괴될 때 `animation.dispose()`를 사용하십시오.

##### Scroll handler plugin

스크롤 핸들러 플러그인 맥락에서 애니메이션 진행 속도는 애니메이션 지속 시간과 제공된 타임스텝에 의해 결정된다는 점은 주목할 만합니다(자세한 정보는 `AnimationConfig`를 확인하십시오). 정의의 타이밍은 서로 다른 애니메이션 규칙 간의 상대적인 타이밍을 설명하는 방식으로 작용하며, 절대적인 실행 시간은 아닙니다.

기본적으로 플러그인은 호스트 요소에 전체 애니메이션 지속 시간과 일치할 만큼 충분한 높이를 가진 스페이서를 추가합니다. 즉, 애니메이션 레이어가 `position: fixed`를 사용한다고 암시합니다. 스페이서를 비활성화하고 대체 레이아웃을 사용할 수 있습니다.

> [!TIP]
> 스크롤 핸들러를 사용할 때 애니메이션 속성의 초기 스타일의 일부분으로 전환을 적용하십시오. 마우스 스크롤 휠로 스크롤하면 비연속적인 `scrollY`가 발생하여 부드럽지 않은 애니메이션이 발생할 수 있습니다.

## Limitations

`Animation` API 사용과 관련하여 몇 가지 제한 사항이 있습니다. 대부분은 CSS 속성 값 파싱과 관련이 있습니다. 따라서 여러 데이터 유형이 존재한다는 것을 이해하는 것이 중요합니다 – `numeric`, `transition`, `color`, `static` 값. 모든 값은 `static` 값을 제외하고 애니메이션할 수 있습니다. 예를 들어 `display: block`은 정적 값으로 간주됩니다(즉, 애니메이션할 수 없음). 그러나 파서가 애니메이션 가능성 있는 값을 처리할 수 없는 특정 경우도 있으며, 이는 정적 값으로 처리됩니다. 이러한 경우는 다음과 같습니다:

- _`border`와 같은 축약 CSS 속성을 파싱할 경우_ – 애니메이션 프로세서는 `1px solid red` <=> `20px solid red`를 애니메이션할 수 없습니다. 이런 경우에는 속성의 숫자 부분만 설명하는 표준 CSS 속성을 사용하는 것이 좋습니다, 즉 `border-width: 1px <=> 20px`.
- _오직 hex, `rgb`, `rgba` 색상만 지원됨_ – 현재 색상 공간인 `hsl` 또는 `lch`는 지원되지 않습니다.
- _모든 변환 함수가 지원되는 것은 아님_ – 지원되는 함수 목록은 [여기](https://github.com/angular/angular/blob/main/adev/src/app/features/home/animation/parser/css-value-parser.ts#L13)에서 확인할 수 있습니다. 이는 새로운 함수가 표준에 추가되어 파서를 추가 변경이 필요할 경우의 예방 조치일 뿐입니다. 원하는 함수를 목록에 추가하여 작동하는지 검증할 수 있습니다.
- _`calc`와 `var`(및 아마 더 많은 것들) 지원되지 않음_ – 파서는 완전한 CSS 사양을 준수하지 않습니다. 파서가 처리할 수 없는 더 많은 CSS 기능이 있을 수 있지만 현재 기능은 풍부한 애니메이션을 위한 충분한 기능을 제공해야 합니다.

**다른 제한 사항**

- _정의는 동적으로 변경할 수 없음_ – 즉, 애니메이션 실행 중에 추가 레이어나 애니메이션 규칙을 추가할 수 없습니다.
- _애니메이션된 요소 수_ – 많은 요소를 렌더링하고 애니메이션하는 것은 계산 비용이 많이 들 수 있으며, 결과적으로 사용자 경험이 저하됩니다. 그러한 애니메이션에는 HTML Canvas 솔루션을 사용하십시오.

## How it works?

원리는 간단합니다: 시간 진행에 따라 값 진행을 계산합니다(예: timeframe = [0, 4]; 현재 시간 = 3s => 진행 = 75% => `from` 및 `to` 스타일 간의 정의된 CSS 속성 값의 범위 중 75%를 적용합니다. 이는 정적 값이 아닌 경우에 해당합니다). 이는 내부적으로 호출되는 `updateFrame` 메서드를 통해 각 프레임에 대해 발생합니다.

그 외에도 `Animation`의 다양한 단계는 다음과 같습니다:

- 인스턴스화
- 애니메이션 정의
- 객체 참조 추출 및 검증; 속성 검증
- 애니메이션 정의를 내부 데이터 형식으로 파싱(여기서 CSS 값 파싱이 발생)
- 재생/찾기/앞/뒤로의 값 처리/계산(i.e. 프레임 업데이트)