# 이미지 최적화

이미지는 많은 애플리케이션에서 중요한 부분을 차지하며, 낮은 [Core Web Vitals](https://web.dev/explore/learn-core-web-vitals) 점수를 포함하여 애플리케이션 성능 문제에 주요한 기여자가 될 수 있습니다.

이미지 최적화는 복잡한 주제가 될 수 있지만, Angular는 `NgOptimizedImage` 지시어를 사용하여 대부분의 작업을 처리합니다. 이 활동에서는 `NgOptimizedImage`를 사용하여 이미지를 효율적으로 로드하는 방법을 배웁니다.

<hr>

<docs-workflow>

<docs-step title="NgOptimizedImage 지시어 가져오기">

`NgOptimizedImage` 지시어를 활용하기 위해서는 먼저 `@angular/common` 라이브러리에서 가져오고 컴포넌트의 `imports` 배열에 추가해야 합니다.

```ts
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  ...
})
```

</docs-step>

<docs-step title="src 속성을 ngSrc로 업데이트">

`NgOptimizedImage` 지시어를 사용하려면 `src` 속성을 `ngSrc`로 바꿔야 합니다. 이는 정적 이미지 소스(즉, `src`)와 동적 이미지 소스(즉, `[src]`) 모두에 해당합니다.

<docs-code language="angular-ts" highlight="[[9], [13]]">
import { NgOptimizedImage } from '@angular/common';

@Component({
  template: `
    ...
    <li>
      정적 이미지:
      <img ngSrc="/assets/logo.svg" alt="Angular logo" width="32" height="32" />
    </li>
    <li>
      동적 이미지:
      <img [ngSrc]="logoUrl" [alt]="logoAlt" width="32" height="32" />
    </li>
    ...
  `,
  imports: [NgOptimizedImage],
})
</docs-code>

</docs-step>

<docs-step title="width와 height 속성 추가">

위 코드 예제에서 각 이미지에는 `width`와 `height` 속성이 모두 있어야 합니다. [레이아웃 이동](https://web.dev/articles/cls)을 방지하기 위해 `NgOptimizedImage` 지시어는 각 이미지에 대해 두 개의 크기 속성이 필요합니다.

정적 `height`와 `width`를 정의할 수 없거나 원하지 않는 경우, 이미지를 "배경 이미지"처럼 작동하도록 요청하는 [`fill` 속성](https://web.dev/articles/cls)을 사용할 수 있습니다:

```angular-html
<div class="image-container"> //Container div has 'position: "relative"'
  <img ngSrc="www.example.com/image.png" fill />
</div>
```

참고: `fill` 이미지가 올바르게 렌더링되려면 부모 요소에 `position: "relative"`, `position: "fixed"`, 또는 `position: "absolute"` 스타일이 적용되어야 합니다.

</docs-step>

<docs-step title="중요한 이미지 우선 순위 지정">

로딩 성능을 위한 가장 중요한 최적화 중 하나는 페이지가 로드될 때 가장 큰 화면 그래픽 요소인 ["LCP 요소"](https://web.dev/articles/optimize-lcp)로 간주될 수 있는 이미지를 우선적으로 처리하는 것입니다. 로딩 시간을 최적화하려면 "히어로 이미지" 또는 LCP 요소일 수 있다고 생각되는 이미지에 `priority` 속성을 추가해야 합니다.

```ts
<img ngSrc="www.example.com/image.png" height="600" width="800" priority />
```

</docs-step>

<docs-step title="선택 사항: 이미지 로더 사용">

`NgOptimizedImage`는 지시어에 이미지의 URL 형식을 지정하는 [이미지 로더](guide/image-optimization#configuring-an-image-loader-for-ngoptimizedimage)를 정의할 수 있게 해줍니다. 로더를 사용하면 짧고 상대적인 URL로 이미지를 정의할 수 있습니다:

```ts
providers: [
  provideImgixLoader('https://my.base.url/'),
]
```

최종 URL은 'https://my.base.url/image.png'가 됩니다.
```angular-html
<img ngSrc="image.png" height="600" width="800" />
```

이미지 로더는 편의성을 넘어서 `NgOptimizedImage`의 모든 기능을 활용할 수 있습니다. 이러한 최적화 및 인기 있는 CDN의 내장 로더에 대한 자세한 내용은 [여기](guide/image-optimization#configuring-an-image-loader-for-ngoptimizedimage)를 참조하세요.

</docs-step>

</docs-workflow>

이 지시어를 워크플로우에 추가함으로써 Angular의 도움으로 이제 최적의 방식으로 이미지를 로드하고 있습니다 🎉

더 배우고 싶다면 [NgOptimizedImage에 대한 문서](guide/image-optimization)를 확인하세요. 훌륭한 작업을 계속하고 다음에 라우팅에 대해 배우겠습니다.