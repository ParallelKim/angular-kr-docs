# NgOptimizedImage 시작하기

`NgOptimizedImage` 지시자는 이미지 로딩에 대한 성능 최적화 모범 사례를 쉽게 채택할 수 있도록 해줍니다.

이 지시자는 [가장 큰 내용 페인트 (LCP)](http://web.dev/lcp) 이미지 로딩의 우선 순위를 설정합니다:

* `<img>` 태그에 자동으로 `fetchpriority` 속성을 설정
* 기본적으로 다른 이미지를 지연 로딩
* 문서 헤드에 자동으로 preconnect 링크 태그 생성
* 자동으로 `srcset` 속성 생성
* 앱이 SSR을 사용하는 경우 [preload 힌트](https://developer.mozilla.org/docs/Web/HTML/Link_types/preload) 생성

LCP 이미지 로딩 최적화 외에도 `NgOptimizedImage`는 다음과 같은 이미지 모범 사례를 강제로 적용합니다:

* [이미지 CDN URL을 사용하여 이미지 최적화적용](https://web.dev/image-cdns/#how-image-cdns-use-urls-to-indicate-optimization-options)
* `width` 및 `height`를 필수로 하여 레이아웃 이동 방지
* `width` 또는 `height`가 잘못 설정된 경우 경고
* 렌더링 시 이미지가 시각적으로 왜곡될 경우 경고

CSS에서 배경 이미지를 사용하는 경우, [여기에서 시작하세요](#how-to-migrate-your-background-image).

**참고: `NgOptimizedImage` 지시자는 Angular 버전 15에서 안정적인 기능으로 채택되었으나, 13.4.0 및 14.3.0 버전에서도 안정적인 기능으로 제공됩니다.**

## 시작하기

<docs-workflow>
<docs-step title="`NgOptimizedImage` 지시자 가져오기">
`@angular/common`에서 `NgOptimizedImage` 지시자를 가져옵니다:

<docs-code language="typescript">

import { NgOptimizedImage } from '@angular/common'

</docs-code>

그리고 독립형 컴포넌트나 NgModule의 `imports` 배열에 포함시킵니다:

<docs-code language="typescript">

imports: [
  NgOptimizedImage,
  // ...
],

</docs-code>
</docs-step>
<docs-step title="(선택사항) 로더 설정">
NgOptimizedImage를 사용하기 위해 이미지 로더는 **필수**는 아니지만, 이미지 CDN과 함께 사용하면 이미지에 대한 자동 `srcset` 등 강력한 성능 기능을 활성화할 수 있습니다.

로더 설정에 대한 간단한 가이드는 이 페이지 끝의 [이미지 로더 구성하기](#configuring-an-image-loader-for-ngoptimizedimage) 섹션에서 확인할 수 있습니다.
</docs-step>
<docs-step title="지시자 활성화">
`NgOptimizedImage` 지시자를 활성화하려면 이미지의 `src` 속성을 `ngSrc`로 교체합니다.

<docs-code language="angular-html">

<img ngSrc="cat.jpg">

</docs-code>

[내장된 서드파티 로더](#built-in-loaders)를 사용하는 경우, `src`에서 기본 URL 경로를 생략해야 하며, 이는 로더에 의해 자동으로 추가됩니다.
</docs-step>
<docs-step title="이미지를 `priority`로 표시">
페이지의 [LCP 이미지](https://web.dev/lcp/#what-elements-are-considered)를 항상 `priority`로 표시하여 로딩의 우선 순위를 높이세요.

<docs-code language="angular-html">

<img ngSrc="cat.jpg" width="400" height="200" priority>

</docs-code>

이미지를 `priority`로 표시하면 다음 최적화가 적용됩니다:

* `fetchpriority=high` 설정 (우선 순위 힌트에 대한 자세한 내용은 [여기](https://web.dev/priority-hints)에서 읽어주세요)
* `loading=eager` 설정 (네이티브 지연 로딩에 대한 자세한 내용은 [여기](https://web.dev/browser-level-image-lazy-loading)에서 읽어주세요)
* [서버에서 렌더링](guide/ssr)하는 경우 자동으로 [preload 링크 요소](https://developer.mozilla.org/docs/Web/HTML/Link_types/preload)를 생성합니다.

Angular는 개발 중 LCP 요소가 `priority` 속성이 없는 이미지인 경우 경고를 표시합니다. 페이지의 LCP 요소는 사용자의 화면 크기와 같은 여러 요인에 따라 달라질 수 있으므로, 페이지에는 `priority`로 표시해야 하는 여러 이미지가 있을 수 있습니다. 더 자세한 내용은 [웹 비타일을 위한 CSS](https://web.dev/css-web-vitals/#images-and-largest-contentful-paint-lcp)를 참조하세요.
</docs-step>
<docs-step title="너비와 높이 포함">
[이미지와 관련된 레이아웃 이동](https://web.dev/css-web-vitals/#images-and-layout-shifts)을 방지하기 위해 NgOptimizedImage는 다음과 같이 이미지에 대한 높이와 너비를 지정하도록 요구합니다:

<docs-code language="angular-html">

<img ngSrc="cat.jpg" width="400" height="200">

</docs-code>

**반응형 이미지** (뷰포트에 따라 크기를 조정하도록 스타일링된 이미지)의 경우, `width` 및 `height` 속성은 이미지 파일의 본래 크기여야 합니다. 반응형 이미지에는 `sizes`에 대한 값을 설정하는 것도 중요합니다. [이곳](#responsive-images)에서 확인하세요.

**고정 크기 이미지**의 경우, `width` 및 `height` 속성은 이미지의 원하는 렌더링 크기를 반영해야 합니다. 이 속성의 종횡비는 항상 이미지의 본래 종횡비와 일치해야 합니다.

참고: 이미지의 크기를 모르는 경우, 아래 설명된 대로 부모 컨테이너의 크기를 상속받기 위해 "fill 모드"를 사용하는 것을 고려하세요.
</docs-step>
</docs-workflow>

## `fill` 모드 사용

포함 요소를 채우는 이미지를 원할 경우, `fill` 속성을 사용할 수 있습니다. 이는 "배경 이미지" 동작을 달성하려고 할 때 유용합니다. 정확한 너비와 높이를 모를 때도 알아서 맞출 수 있는 부모 컨테이너가 있는 경우에도 유용합니다 (아래 "object-fit" 참조).

이미지에 `fill` 속성을 추가하면 `width` 및 `height`를 포함할 필요가 없으며, 다음과 같이 작성합니다:

<docs-code language="angular-html">

<img ngSrc="cat.jpg" fill>

</docs-code>

[object-fit](https://developer.mozilla.org/docs/Web/CSS/object-fit) CSS 속성을 사용하여 이미지가 컨테이너를 채우는 방식을 변경할 수 있습니다. `object-fit: "contain"`로 스타일링하면 이미지의 종횡비를 유지하고 요소에 맞게 "레터박스" 처리됩니다. `object-fit: "cover"` 설정 시 요소의 종횡비가 유지되며, 요소를 완전히 채우고 일부 내용이 "잘라질" 수 있습니다.

위의 시각적 예제는 [MDN object-fit 문서](https://developer.mozilla.org/docs/Web/CSS/object-fit)에서 확인할 수 있습니다.

[object-position 속성](https://developer.mozilla.org/docs/Web/CSS/object-position)을 사용하여 이미지의 위치를 포함 요소 내에서 조정할 수 있습니다.

중요: "fill" 이미지가 제대로 렌더링되기 위해서는 부모 요소에 **반드시** `position: "relative"`, `position: "fixed"`, `position: "absolute"` 스타일이 적용되어야 합니다.

## 배경 이미지 마이그레이션 방법

`background-image`에서 `NgOptimizedImage`로 마이그레이션하기 위한 간단한 단계별 프로세스는 다음과 같습니다. 이러한 단계에서 이미지 배경이 있는 요소를 "포함 요소"라고 하겠습니다:

1) 포함 요소에서 `background-image` 스타일을 제거합니다.
2) 포함 요소에 `position: "relative"`, `position: "fixed"` 또는 `position: "absolute"`가 있는지 확인합니다.
3) 포함 요소의 자식으로 새 이미지 요소를 생성하고 `ngSrc`를 사용하여 `NgOptimizedImage` 지시자를 활성화합니다.
4) 해당 요소에 `fill` 속성을 부여합니다. `height` 및 `width`를 포함하지 마세요.
5) 이 이미지가 [LCP 요소](https://web.dev/lcp/)일 가능성이 있다고 생각된다면 이미지 요소에 `priority` 속성을 추가합니다.

배경 이미지가 컨테이너를 채우는 방식을 [fill 모드 사용](#using-fill-mode) 섹션에 설명된 것처럼 조정할 수 있습니다.

## 플레이스홀더 사용하기

### 자동 플레이스홀더

NgOptimizedImage는 CDN 또는 자동 이미지 크기를 제공하는 호스트를 사용하는 경우 이미지의 자동 저해상도 플레이스홀더를 표시할 수 있습니다. 이 기능을 활용하기 위해 이미지에 `placeholder` 속성을 추가하세요:

<docs-code format="typescript" language="angular-html">

<img ngSrc="cat.jpg" width="400" height="200" placeholder>

</docs-code>

이 속성을 추가하면 지정한 이미지 로더를 사용하여 이미지의 작은 버전을 자동으로 요청합니다. 이 작은 이미지는 이미지가 로드되는 동안 CSS 블러 스타일의 `background-image`로 적용됩니다. 이미지 로더가 제공되지 않는 경우 플레이스홀더 이미지를 생성할 수 없으며 오류가 발생합니다.

생성된 플레이스홀더의 기본 크기는 30px 넓이입니다. 이 크기는 `IMAGE_CONFIG` 공급자에서 픽셀 값을 지정하여 변경할 수 있습니다:

<docs-code format="typescript" language="typescript">
providers: [
  {
    provide: IMAGE_CONFIG,
    useValue: {
      placeholderResolution: 40
    }
  },
],
</docs-code>

블러 처리된 플레이스홀더 주변에 선명한 가장자리를 원한다면, 이미지와 같은 크기의 포함 `<div>`로 이미지를 감싸는 것을 고려하십시오 (`width: fit-content` 스타일을 사용하여).

### 데이터 URL 플레이스홀더

이미지 로더 없이 base64 [데이터 URL](https://developer.mozilla.org/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)을 사용하여 플레이스홀더를 지정할 수도 있습니다. 데이터 URL 형식은 `data:image/[imagetype];[data]`이며, 여기서 `[imagetype]`은 `png`와 같은 이미지 형식이고, `[data]`는 이미지의 base64 인코딩입니다. 인코딩은 명령줄 또는 JavaScript를 사용하여 수행할 수 있습니다. 특정 명령어는 [MDN 문서](https://developer.mozilla.org/docs/Web/HTTP/Basics_of_HTTP/Data_URLs#encoding_data_into_base64_format)에서 확인하세요. 잘린 데이터와 함께하는 데이터 URL 플레이스홀더의 예는 다음과 같습니다:

<docs-code language="angular-html">

<img 
  ngSrc="cat.jpg" 
  width="400" 
  height="200" 
  placeholder="data:image/png;base64,iVBORw0K..."
/>

</docs-code>

그러나 대규모 데이터 URL은 Angular 번들의 크기를 증가시키고 페이지 로드를 느리게 합니다. 이미지 로더를 사용할 수 없는 경우, Angular 팀은 base64 플레이스홀더 이미지를 4KB보다 작게 유지하고 주요 이미지에 독점적으로 사용하도록 권장합니다. 플레이스홀더의 크기를 줄이는 것 외에도 이미지 형식 또는 이미지를 저장할 때 사용하는 매개변수를 변경하는 것을 고려하세요. 매우 낮은 해상도에서 이러한 매개변수는 파일 크기에 큰 영향을 미칠 수 있습니다.

### 비블러 플레이스홀더

기본적으로 NgOptimizedImage는 이미지 플레이스홀더에 CSS 블러 효과를 적용합니다. 블러 없이 플레이스홀더를 렌더링하려면 `blur` 속성이 false로 설정된 객체와 함께 `placeholderConfig` 인수를 제공하십시오. 예를 들면:

<docs-code language="angular-html">

<img 
  ngSrc="cat.jpg" 
  width="400" 
  height="200" 
  placeholder 
  [placeholderConfig]="{blur: false}"
/>

</docs-code>

## 이미지 스타일 조정

이미지의 스타일링에 따라 `width` 및 `height` 속성을 추가하면 이미지가 다르게 렌더링될 수 있습니다. `NgOptimizedImage`는 이미지 스타일링으로 인해 이미지가 왜곡된 종횡비로 렌더링되는 경우 경고합니다.

보통 `height: auto` 또는 `width: auto`를 이미지 스타일에 추가하여 이 문제를 해결할 수 있습니다. 자세한 내용은 [웹.dev의 `<img>` 태그에 관한 기사](https://web.dev/patterns/web-vitals-patterns/images/img-tag)를 참조하세요.

이미지에 대한 `width` 및 `height` 속성이 CSS를 사용하여 이미지를 원하는 크기로 조정하는 것을 방해하는 경우 `fill` 모드를 사용하는 것을 고려하고 이미지의 부모 요소 스타일링을 조정하세요.

## 성능 기능

NgOptimizedImage는 애플리케이션의 로드 성능을 개선하기 위해 설계된 여러 기능을 포함하고 있습니다. 이 섹션에서는 이 기능에 대해 설명합니다.

### 리소스 힌트 추가

이미지 출처에 대한 [`preconnect` 리소스 힌트](https://web.dev/preconnect-and-dns-prefetch)는 LCP 이미지가 가능한 한 빨리 로드되도록 보장합니다.

도메인에 대한 preconnect 링크는 [로더](#optional-set-up-a-loader)에 인수로 제공된 도메인에 대해 자동으로 생성됩니다. 이미지 출처를 자동으로 식별할 수 없고 LCP 이미지에 대한 preconnect 링크가 감지되지 않는 경우 `NgOptimizedImage`는 개발 중 경고합니다. 이 경우 `index.html`에 수동으로 리소스 힌트를 추가해야 합니다. 문서의 `<head>` 내에 `rel="preconnect"`와 함께 `link` 태그를 추가합니다:

<docs-code language="html">

<link rel="preconnect" href="https://my.cdn.origin" />

</docs-code>

preconnect 경고를 비활성화하려면 `PRECONNECT_CHECK_BLOCKLIST` 토큰을 주입합니다:

<docs-code language="typescript">

providers: [
  {provide: PRECONNECT_CHECK_BLOCKLIST, useValue: 'https://your-domain.com'}
],

</docs-code>

자동 preconnect 생성에 대한 자세한 내용은 [여기](#why-is-a-preconnect-element-not-being-generated-for-my-image-domain)에서 확인하세요.

### 자동 `srcset`으로 올바른 크기로 이미지 요청하기

[`srcset` 속성](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/srcset)을 정의하면 브라우저가 사용자의 뷰포트에 맞는 크기로 이미지를 요청하므로, 너무 큰 이미지를 다운로드하는 데 시간을 낭비하지 않습니다. `NgOptimizedImage`는 이미지 태그의 [`sizes` 속성](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/sizes)의 존재 및 값에 따라 적절한 `srcset`을 생성합니다.

#### 고정 크기 이미지

이미지가 "고정" 크기여야 하는 경우 (즉, 장치에 따라 크기가 동일하며 [픽셀 밀도](https://web.dev/codelab-density-descriptors/)만 제외됨), `sizes` 속성을 설정할 필요가 없습니다. `srcset`은 이미지의 너비 및 높이 속성에서 자동으로 생성될 수 있으며 추가 입력이 필요하지 않습니다.

생성된 srcset 예시:
```angular-html
<img ... srcset="image-400w.jpg 1x, image-800w.jpg 2x">
```

#### 반응형 이미지

이미지가 반응형이어야 하는 경우 (즉, 뷰포트 크기에 따라 크기 조정 가능), `sizes` 속성을 정의해야 `srcset`을 생성할 수 있습니다.

이전에 `sizes`를 사용한 적이 없다면, 일반적으로 뷰포트 너비를 기준으로 설정하는 것이 좋습니다. 예를 들어, CSS로 이미지가 뷰포트 너비의 100%를 차지하게 되는 경우, `sizes`를 `100vw`로 설정하면 브라우저가 픽셀 밀도를 고려한 후 `srcset`에서 뷰포트 너비에 가장 가까운 이미지를 선택합니다. 이미지가 화면의 절반만 차지할 것으로 예상되는 경우(예: 사이드바에서는) `sizes`를 `50vw`로 설정하여 브라우저가 더 작은 이미지를 선택하도록 보장할 수 있습니다. 등을 계속해서 조정할 수 있습니다.

위의 내용이 원하는 이미지 동작을 다루지 못한다면, [고급 사이즈 값 문서](#advanced-sizes-values)를 참조하세요.

`NgOptimizedImage`는 제공된 `sizes` 값에 자동으로 `"auto"`를 추가합니다. 이는 `sizes="auto"`를 지원하는 브라우저에서의 srcset 선택 정확도를 높이는 최적화이며, 지원하지 않는 브라우저에서는 무시됩니다.

기본 반응형 비율은 다음과 같습니다:

`[16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]`

이 비율을 사용자 정의하고 싶다면 `IMAGE_CONFIG` 공급자를 사용하여 할 수 있습니다:

<docs-code language="typescript">
providers: [
  {
    provide: IMAGE_CONFIG,
    useValue: {
      breakpoints: [16, 48, 96, 128, 384, 640, 750, 828, 1080, 1200, 1920]
    }
  },
],
</docs-code>

`srcset` 속성을 수동으로 정의하고 싶다면, `ngSrcset` 속성을 사용하여 직접 제공할 수 있습니다:

<docs-code language="angular-html">

<img ngSrc="hero.jpg" ngSrcset="100w, 200w, 300w">

</docs-code>

`ngSrcset` 속성이 존재하는 경우, `NgOptimizedImage`는 포함된 크기를 기반으로 `srcset`을 생성하고 설정합니다. `ngSrcset`에 이미지 파일 이름을 포함하지 마세요 - 지시자가 이 정보를 `ngSrc`에서 유추합니다. 이 지시자는 너비 기술자 (예: `100w`)와 밀도 기술자 (예: `1x`)를 모두 지원합니다.

<docs-code language="angular-html">

<img ngSrc="hero.jpg" ngSrcset="100w, 200w, 300w" sizes="50vw">

</docs-code>

### 자동 srcset 생성 비활성화하기

단일 이미지에 대해 srcset 생성을 비활성화하려면 이미지에 `disableOptimizedSrcset` 속성을 추가할 수 있습니다:

<docs-code language="angular-html">

<img ngSrc="about.jpg" disableOptimizedSrcset>

</docs-code>

### 이미지 지연 로딩 비활성화

기본적으로 `NgOptimizedImage`는 `priority`로 표시되지 않은 모든 이미지에 대해 `loading=lazy`를 설정합니다. 비우선 이미지를 위해 이 동작을 비활성화하려면 `loading` 속성을 설정하세요. 이 속성은 `eager`, `auto`, 및 `lazy`의 값을 허용합니다. [표준 이미지 `loading` 속性에 대한 문서](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/loading#value)를 참조하세요.

<docs-code language="angular-html">

<img ngSrc="cat.jpg" width="400" height="200" loading="eager">

</docs-code>

### 고급 'sizes' 값

여러 크기의 화면에 따라 다양한 너비로 이미지를 표시하고 싶을 수 있습니다. 이 패턴의 일반적인 예는 모바일 장치에서 단일 열을 렌더링하고 큰 장치에서는 두 개의 열을 렌더링하는 그리드 또는 열 기반 레이아웃입니다. 이 동작은 `sizes` 속성에서 미디어 쿼리 구문을 사용하여 포착할 수 있습니다. 예를 들어:

<docs-code language="angular-html">

<img ngSrc="cat.jpg" width="400" height="200" sizes="(max-width: 768px) 100vw, 50vw">

</docs-code>

위의 예에서 `sizes` 속성은 "768px 너비 이하의 장치에서 이 이미지를 화면 너비의 100%로 예상합니다. 그렇지 않으면 화면 너비의 50%로 예상합니다"라고 말합니다.

`sizes` 속성에 대한 추가 정보는 [web.dev](https://web.dev/learn/design/responsive-images/#sizes) 또는 [mdn](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/sizes)을 참조하세요.

## `NgOptimizedImage`를 위한 이미지 로더 구성

"로더"는 주어진 이미지 파일에 대한 [이미지 변환 URL](https://web.dev/image-cdns/#how-image-cdns-use-urls-to-indicate-optimization-options)을 생성하는 함수입니다. 적절한 경우, `NgOptimizedImage`는 이미지의 크기, 형식 및 이미지 품질 변환을 설정합니다.

`NgOptimizedImage`는 변환을 적용하지 않는 일반 로더와 다양한 서드파티 이미지 서비스에 대한 로더를 제공합니다. 또한 사용자 정의 로더를 작성하는 것도 지원합니다.

| 로더 유형 | 동작 |
|:--- |:--- |
| 일반 로더 | 일반 로더가 반환하는 URL은 항상 `src` 값과 일치합니다. 즉, 이 로더는 변환을 적용하지 않습니다. Angular를 사용하여 이미지를 제공하는 사이트가 이 로더의 주요 용도입니다. |
| 서드파티 이미지 서비스를 위한 로더 | 서드파티 이미지 서비스에 대한 로더가 반환하는 URL은 해당 서비스에서 사용하는 API 규칙을 따릅니다. |
| 사용자 정의 로더 | 사용자 정의 로더의 동작은 개발자가 정의합니다. 로더가 `NgOptimizedImage`와 함께 미리 구성된 로더에서 지원하지 않는 이미지 서비스인 경우 사용자 정의 로더를 사용해야 합니다. |

Angular 애플리케이션에서 일반적으로 사용되는 이미지 서비스를 기반으로, `NgOptimizedImage`는 다음 이미지 서비스에 맞게 미리 구성된 로더를 제공합니다:

| 이미지 서비스 | Angular API | 문서 |
|:--- |:--- |:--- |
| Cloudflare 이미지 크기 조절 | `provideCloudflareLoader` | [문서](https://developers.cloudflare.com/images/image-resizing/) |
| Cloudinary | `provideCloudinaryLoader` | [문서](https://cloudinary.com/documentation/resizing_and_cropping) |
| ImageKit | `provideImageKitLoader` | [문서](https://docs.imagekit.io/) |
| Imgix | `provideImgixLoader` | [문서](https://docs.imgix.com/) |
| Netlify | `provideNetlifyLoader` | [문서](https://docs.netlify.com/image-cdn/overview/) |

**일반 로더**를 사용하려면 추가 코드 변경이 필요하지 않습니다. 이는 기본 동작입니다.

### 내장 로더

**서드파티 이미지 서비스**에 대한 기존 로더를 사용하려면 선택한 서비스에 대한 프로바이더 팩토리를 `providers` 배열에 추가하십시오. 아래 예는 Imgix 로더가 사용됩니다:

<docs-code language="typescript">
providers: [
  provideImgixLoader('https://my.base.url/'),
],
</docs-code>

이미지 자산의 기본 URL은 프로바이더 팩토리에 전달되어야합니다. 대부분의 사이트에서 이 기본 URL은 다음 패턴 중 하나와 일치해야 합니다:

* <https://yoursite.yourcdn.com>
* <https://subdomain.yoursite.com>
* <https://subdomain.yourcdn.com/yoursite>

해당 CDN 프로바이더의 문서에서 기본 URL 구조에 대해 더 알아보세요.

### 사용자 정의 로더

**사용자 정의 로더**를 사용하려면 `IMAGE_LOADER` DI 토큰에 대한 값을 제공하여 로더 함수를 제공해야 합니다. 아래 예제에서 사용자 정의 로더 함수는 URL 매개변수로 `src` 및 `width`를 포함하여 `https://example.com`으로 시작하는 URL을 반환합니다.

<docs-code language="typescript">
providers: [
  {
    provide: IMAGE_LOADER,
    useValue: (config: ImageLoaderConfig) => {
      return `https://example.com/images?src=${config.src}&width=${config.width}`;
    },
  },
],
</docs-code>

`NgOptimizedImage` 지시자에 대한 로더 함수는 `@angular/common`의 `ImageLoaderConfig` 유형 객체를 인수로 받아 이미지 자산의 절대 URL을 반환합니다. `ImageLoaderConfig` 객체는 `src` 속성과 선택적 `width` 및 `loaderParams` 속성을 포함합니다.

참고: `width` 속성이 항상 존재하지 않을 수 있지만 사용자 정의 로더는 `ngSrcset`이 제대로 작동하도록 다양한 너비의 이미지를 요청하는 데 사용해야 합니다.

### `loaderParams` 속성

`NgOptimizedImage` 지시자에 의해 지원되는 추가 속성인 `loaderParams`는 사용자 정의 로더 사용을 지원하도록 특별히 설계되었습니다. `loaderParams` 속성은 값으로 임의의 속성을 가진 객체를 취하고, 스스로는 아무것도 하지 않습니다. `loaderParams`에 데이터가 포함되면 `나의 사용자 정의 로더로 전달되는 ImageLoaderConfig` 객체에 추가됩니다.

`loaderParams`의 일반적인 용도는 고급 이미지 CDN 기능을 제어하는 것입니다.

### 예시 사용자 정의 로더

다음은 사용자 정의 로더 함수의 예제입니다. 이 예제 함수는 `src`와 `width`를 연결하고, 라운드 코너에 대한 사용자 정의 CDN 기능을 제어하기 위해 `loaderParams`를 사용합니다:

<docs-code language="typescript">
const myCustomLoader = (config: ImageLoaderConfig) => {
  let url = `https://example.com/images/${config.src}?`;
  let queryParams = [];
  if (config.width) {
    queryParams.push(`w=${config.width}`);
  }
  if (config.loaderParams?.roundedCorners) {
    queryParams.push('mask=corners&corner-radius=5');
  }
  return url + queryParams.join('&');
};
</docs-code>

위 예제에서는 사용자 정의 로더의 기능을 제어하기 위해 'roundedCorners' 속성 이름을 만들어 사용했습니다. 그런 다음 이미지를 작성할 때 다음과 같이 이 기능을 사용할 수 있습니다:

<docs-code language="angular-html">

<img ngSrc="profile.jpg" width="300" height="300" [loaderParams]="{roundedCorners: true}">

</docs-code>

## 자주 묻는 질문

### NgOptimizedImage가 `background-image` CSS 속성을 지원하나요?

NgOptimizedImage는 `background-image` CSS 속성을 직접 지원하지 않지만, 다른 요소의 배경으로 이미지를 사용하는 사용 사례를 쉽게 수용할 수 있도록 설계되었습니다.

`background-image`에서 `NgOptimizedImage`로 마이그레이션하는 단계별 프로세스는 위의 [배경 이미지 마이그레이션 방법](#how-to-migrate-your-background-image) 섹션을 참조하세요.

### `NgOptimizedImage`와 함께 `src` 속성을 사용할 수 없는 이유는 무엇인가요?

기술적인 고려사항으로 인해 NgOptimizedImage의 트리거로 `ngSrc` 속성이 선택되었습니다. NgOptimizedImage는 `loading` 속성에 대한 프로그래밍 방식 변경을 수행합니다. 브라우저가 이러한 변경이 이루어지기 전에 `src` 속성을 발견하면, 이미지를 파일을 조기에 다운로드하기 시작하게 되고 로딩 변경은 무시됩니다.

### 왜 내 이미지 도메인에 대해 preconnect 요소가 생성되지 않나요?
Preconnect 생성을 수행하기 위해서는 애플리케이션에 대한 정적 분석이 수행됩니다. 이는 이미지 도메인이 로더 매개변수에 직접 포함되어야 함을 의미합니다. 다음 예제를 참조하세요:

<docs-code language="typescript">
providers: [
  provideImgixLoader('https://my.base.url/'),
],
</docs-code>

도메인 문자열을 로더에 전달하기 위해 변수를 사용하거나 로더를 사용하지 않는 경우 정적 분석이 도메인을 식별할 수 없어 preconnect 링크가 생성되지 않습니다. 이 경우 문서 헤드에 수동으로 preconnect 링크를 추가해야 하며, [위에서 설명한 대로](#add-resource-hints) 진행하면 됩니다.

### 같은 페이지에 두 개의 다른 이미지 도메인을 사용할 수 있나요?

[이미지 로더](#configuring-an-image-loader-for-ngoptimizedimage) 프로바이더 패턴은 컴포넌트 내에서 단일 이미지 CDN만 사용하는 일반적인 사용 사례를 최대한 간단하게 만들기 위해 설계되었습니다. 그러나 여전히 단일 프로바이더를 사용하여 여러 이미지 CDN을 관리할 수 있습니다.

이를 위해 `loaderParams` 속성을 사용하여 사용할 이미지 CDN을 지정하는 플래그를 전달하는 [사용자 정의 이미지 로더](#custom-loaders)를 작성하는 것이 좋습니다. 그런 다음 플래그에 따라 적절한 로더를 호출합니다.

### 내가 원하는 CDN에 대한 새로운 내장 로더를 추가할 수 있나요?

유지 관리 이유로 현재 Angular 레포지토리에서 추가 내장 로더를 지원할 계획은 없습니다. 대신, 개발자가 추가 이미지 로더를 제3자 패키지로 게시하도록 권장합니다.

### `<picture>` 태그와 함께 사용할 수 있나요?

아니요, 하지만 이것은 우리의 로드맵에 있으므로 주목해 주세요. 

이 기능을 기다리고 계신다면 [여기에서 Github 문제에 투표해 주세요](https://github.com/angular/angular/issues/56594).

### Chrome DevTools로 내 LCP 이미지를 어떻게 찾나요?

1. Chrome DevTools의 성능 탭을 사용하여 왼쪽 상단의 "프로파일링 시작 및 페이지 새로 고치기" 버튼을 클릭합니다. 페이지 새로 고침 아이콘처럼 생겼습니다.
2. 이것은 Angular 애플리케이션의 프로파일링 스냅샷을 트리거합니다.
3. 프로파일링 결과가 제공되면, 타이밍 섹션에서 "LCP"를 선택합니다.
4. 요약 항목이 하단 패널에 나타날 것입니다. "관련 노드" 행에 LCP 요소가 있습니다. 클릭하면 요소가 요소 패널에서 표시됩니다. 

<img alt="Chrome DevTools의 LCP" src="assets/images/guide/image-optimization/devtools-lcp.png">

참고: 이것은 테스트하는 페이지의 뷰포트 내에서 LCP 요소만 식별합니다. 작은 화면의 LCP 요소를 식별하기 위해 모바일 에뮬레이션을 사용하는 것이 좋습니다.