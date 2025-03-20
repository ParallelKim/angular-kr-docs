# DOM API 사용하기

팁: 이 가이드는 여러분이 이미 [필수 가이드](essentials)를 읽었다고 가정합니다. Angular에 처음이라면 먼저 그 내용을 읽으세요.

Angular는 대부분의 DOM 생성, 업데이트 및 제거를 자동으로 처리합니다. 그러나 드물게 구성 요소의 DOM과 직접 상호작용해야 할 필요가 있을 수 있습니다. 구성 요소는 ElementRef를 주입하여 구성 요소의 호스트 요소에 대한 참조를 가져올 수 있습니다:

```ts
@Component({...})
export class ProfilePhoto {
  constructor(elementRef: ElementRef) {
    console.log(elementRef.nativeElement);
  }
}
```

`nativeElement` 속성은 호스트 [Element](https://developer.mozilla.org/docs/Web/API/Element) 인스턴스를 참조합니다.

Angular의 `afterRender` 및 `afterNextRender` 함수를 사용하여 Angular가 페이지의 렌더링을 완료했을 때 실행되는 **렌더 콜백**을 등록할 수 있습니다.

```ts
@Component({...})
export class ProfilePhoto {
  constructor(elementRef: ElementRef) {
    afterRender(() => {
      // 이 구성 요소의 첫 번째 입력 요소에 포커스를 맞춥니다.
      elementRef.nativeElement.querySelector('input')?.focus();
    });
  }
}
```

`afterRender` 및 `afterNextRender`는 일반적으로 구성 요소의 생성자와 같은 _주입 컨텍스트_에서 호출되어야 합니다.

**가능한 한 직접적인 DOM 조작을 피하는 것이 좋습니다.** 항상 구성 요소 템플릿에서 DOM 구조를 표현하고 바인딩으로 해당 DOM을 업데이트하는 것을 선호하세요.

**렌더 콜백은 서버 측 렌더링 또는 빌드 타임 사전 렌더링 중에 실행되지 않습니다.**

**다른 Angular 생명 주기 훅 안에서 직접 DOM을 조작하지 마세요.** Angular는 구성 요소의 DOM이 렌더 콜백이 아닌 시점에서 완전히 렌더링되었음을 보장하지 않습니다. 또한, 다른 생명 주기 훅에서 DOM을 읽거나 수정하면 [레이아웃 스래싱](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing)을 일으켜 페이지 성능에 부정적인 영향을 미칠 수 있습니다.

## 구성 요소의 렌더러 사용하기

구성 요소는 `Renderer2` 인스턴스를 주입하여 다른 Angular 기능과 관련된 특정 DOM 조작을 수행할 수 있습니다.

구성 요소의 `Renderer2`로 생성된 모든 DOM 요소는 해당 구성 요소의 [스타일 캡슐화](guide/components/styling#style-scoping)에 참여합니다.

특정 `Renderer2` API는 Angular의 애니메이션 시스템과 연결되어 있습니다. `setProperty` 메서드를 사용하여 합성 애니메이션 속성을 업데이트하고 `listen` 메서드를 사용하여 합성 애니메이션 이벤트에 대한 이벤트 리스너를 추가할 수 있습니다. 자세한 내용은 [애니메이션 가이드](guide/animations)를 참조하세요.

이 두 가지 한정된 사용 사례 외에도 `Renderer2`를 사용하는 것과 기본 DOM API를 사용하는 것 사이에는 차이가 없습니다. `Renderer2` API는 서버 측 렌더링 또는 빌드 타임 사전 렌더링 컨텍스트에서 DOM 조작을 지원하지 않습니다.

## DOM API 사용 시기

Angular가 대부분의 렌더링 문제를 처리하는 반면, 일부 동작은 여전히 DOM API를 사용해야 할 수 있습니다. 일반적인 사용 사례는 다음과 같습니다:

- 요소 포커스 관리
- `getBoundingClientRect`와 같은 요소 기하학 측정
- 요소의 텍스트 콘텐츠 읽기
- [`MutationObserver`](https://developer.mozilla.org/docs/Web/API/MutationObserver),
  [`ResizeObserver`](https://developer.mozilla.org/docs/Web/API/ResizeObserver) 또는
  [`IntersectionObserver`](https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API)와 같은 기본 관찰자 설정.

DOM 요소를 삽입, 제거 및 수정하는 것을 피하세요. 특히, **결코 요소의 `innerHTML` 속성을 직접 설정하지 마세요**, 이는 응용 프로그램을 [교차 사이트 스크립팅(XSS) 공격](https://developer.mozilla.org/docs/Glossary/Cross-site_scripting)에 취약하게 만들 수 있습니다. Angular의 템플릿 바인딩, 특히 `innerHTML`에 대한 바인딩은 XSS 공격으로부터 보호하는 데 도움이 되는 안전 장치를 포함하고 있습니다. 자세한 내용은 [보안 가이드](best-practices/security)를 참조하세요.