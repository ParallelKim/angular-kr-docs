# 재사용 가능한 애니메이션

이 주제에서는 재사용 가능한 애니메이션을 만드는 방법에 대한 몇 가지 예를 제공합니다.

## 재사용 가능한 애니메이션 만들기

재사용 가능한 애니메이션을 만들기 위해서는 [`animation()`](api/animations/animation) 함수를 사용하여 별도의 `.ts` 파일에서 애니메이션을 정의하고 이 애니메이션 정의를 `const` export 변수로 선언합니다.
그런 다음 [`useAnimation()`](api/animations/useAnimation) 함수를 사용하여 애플리케이션의 모든 구성 요소에서 이 애니메이션을 가져와서 재사용할 수 있습니다.

<docs-code header="src/app/animations.ts" path="adev/src/content/examples/animations/src/app/animations.1.ts" visibleRegion="animation-const"/>

위의 코드 스니펫에서 `transitionAnimation`은 export 변수로 선언하여 재사용 가능하게 만들어졌습니다.

도움이 되는 점: `height`, `opacity`, `backgroundColor`, 및 `time` 입력은 런타임 동안 대체됩니다.

애니메이션의 일부를 내보낼 수도 있습니다.
예를 들어, 다음 스니펫은 애니메이션 `trigger`를 내보냅니다.

<docs-code header="src/app/animations.1.ts" path="adev/src/content/examples/animations/src/app/animations.1.ts" visibleRegion="trigger-const"/>

이 시점부터는 구성 요소 클래스에서 재사용 가능한 애니메이션 변수를 가져올 수 있습니다.
예를 들어, 다음 코드 스니펫은 `transitionAnimation` 변수를 가져오고 `useAnimation()` 함수를 통해 사용합니다.

<docs-code header="src/app/open-close.component.ts" path="adev/src/content/examples/animations/src/app/open-close.component.3.ts" visibleRegion="reusable"/>

## Angular 애니메이션에 대한 더 많은 정보

다음 내용에도 관심이 있을 수 있습니다:

<docs-pill-row>
  <docs-pill href="guide/animations" title="Angular 애니메이션 소개"/>
  <docs-pill href="guide/animations/transition-and-triggers" title="전환 및 트리거"/>
  <docs-pill href="guide/animations/complex-sequences" title="복잡한 애니메이션 시퀀스"/>
  <docs-pill href="guide/animations/route-animations" title="경로 전환 애니메이션"/>
</docs-pill-row>