# 보안

이 주제에서는 Angular의 웹 애플리케이션에서 발생할 수 있는 일반적인 취약성과 공격, 예를 들어 크로스 사이트 스크립팅 공격에 대한 내장 보호 기능을 설명합니다. 인증 및 권한 부여와 같은 애플리케이션 수준의 보안은 다루지 않습니다.

아래 설명된 공격 및 완화 조치에 대한 자세한 내용은 [Open Web Application Security Project (OWASP) 가이드](https://www.owasp.org/index.php/Category:OWASP_Guide_Project)를 참조하세요.

<a id="report-issues"></a>

<docs-callout title="취약점 신고">

Angular는 Google의 [오픈 소스 소프트웨어 취약점 보상 프로그램](https://bughunters.google.com/about/rules/6521337925468160/google-open-source-software-vulnerability-reward-program-rules)의 일환입니다. Angular의 취약점에 대해서는 [https://bughunters.google.com](https://bughunters.google.com/report)에서 신고해 주세요.

Google이 보안 문제를 처리하는 방법에 대한 자세한 내용은 [Google의 보안 철학](https://www.google.com/about/appsecurity)을 참조하세요.

</docs-callout>

## 모범 사례

Angular 애플리케이션이 안전하도록 하기 위해 기억해야 할 몇 가지 모범 사례입니다.

1. **최신 Angular 라이브러리 릴리스에 유지하기** - Angular 라이브러리는 정기적으로 업데이트되며, 이러한 업데이트는 이전 버전에서 발견된 보안 결함을 수정할 수 있습니다. 보안 관련 업데이트는 Angular [변경 로그](https://github.com/angular/angular/blob/main/CHANGELOG.md)를 확인하세요.
2. **Angular 사본을 수정하지 않기** - 비공식적인 맞춤형 Angular 버전은 최신 버전에서 뒤처질 수 있으며, 중요한 보안 수정 및 향상이 포함되지 않을 수 있습니다. 대신, 커뮤니티와 Angular 개선 사항을 공유하고 풀 리퀘스트를 작성하세요.
3. **문서에서 “_보안 위험_”으로 표시된 Angular API를 피하기** - 자세한 내용은 이 페이지의 [안전한 값 신뢰하기](#trusting-safe-values) 섹션을 참조하세요.

## 크로스 사이트 스크립팅(XSS) 방지

[크로스 사이트 스크립팅(XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) 공격자는 웹 페이지에 악성 코드를 주입할 수 있습니다. 그런 코드는 사용자 및 로그인 데이터를 훔치거나 사용자를 가장한 작업을 수행할 수 있습니다. 이는 웹에서 가장 일반적인 공격 중 하나입니다.

XSS 공격을 차단하려면 악성 코드가 문서 객체 모델(DOM)에 들어오는 것을 방지해야 합니다. 예를 들어, 공격자가 DOM에 `<script>` 태그를 삽입하도록 속일 수 있다면, 그들은 귀하의 웹사이트에서 임의의 코드를 실행할 수 있습니다. 이 공격은 `<script>` 태그에 국한되지 않으며, DOM 내에서 코드를 실행할 수 있는 많은 요소 및 속성이 존재합니다. 예를 들어 `<img alt="" onerror="...">` 및 `<a href="javascript:...">`와 같습니다. 공격자가 제어하는 데이터가 DOM에 들어오면 보안 취약점이 발생할 수 있습니다.

### Angular의 크로스 사이트 스크립팅 보안 모델

Angular는 XSS 버그를 체계적으로 차단하기 위해 기본적으로 모든 값을 신뢰할 수 없는 것으로 간주합니다. 템플릿 바인딩 또는 보간에서 DOM에 값이 삽입될 때 Angular는 신뢰할 수 없는 값을 청소하고 이스케이프합니다. 만약 값이 Angular 외부에서 이미 청소되고 안전한 것으로 간주된다면, [신뢰된 값으로 마킹](#trusting-safe-values)하여 Angular에 이를 알려주세요.

렌더링에 사용될 값과는 달리 Angular 템플릿은 기본적으로 신뢰할 수 있는 것으로 간주되며 실행 가능한 코드로 처리되어야 합니다. 사용자 입력과 템플릿 구문을 연결하여 템플릿을 만들지 마세요. 이렇게 하면 공격자가 귀하의 애플리케이션에 [임의의 코드](https://en.wikipedia.org/wiki/Code_injection)를 주입할 수 있습니다. 이러한 취약점을 방지하기 위해 항상 프로덕션 배포에서 기본 [사전 컴파일 시간(AOT) 템플릿 컴파일러](#use-the-aot-template-compiler)를 사용하세요.

추가적인 보호 레이어는 콘텐츠 보안 정책 및 신뢰할 수 있는 타입을 사용하여 제공될 수 있습니다. 이러한 웹 플랫폼 기능은 DOM 레벨에서 작동하여 XSS 문제를 예방하는 가장 효과적인 장소입니다. 여기서는 다른 낮은 수준의 API를 사용하여 우회할 수 없습니다. 이러한 이유로 이러한 기능을 활용하는 것이 강력히 권장됩니다. 이를 위해 애플리케이션에 대한 [콘텐츠 보안 정책](#content-security-policy)을 구성하고 [신뢰된 타입 시행](#enforcing-trusted-types)을 활성화하세요.

### 청소 및 보안 컨텍스트

*청소*는 신뢰할 수 없는 값을 검사하여 DOM에 삽입할 수 있게 안전한 값으로 바꾸는 것입니다. 많은 경우에 청소는 값을 전혀 변경하지 않습니다. 청소는 컨텍스트에 따라 다릅니다. 예를 들어, CSS에서는 해롭지 않은 값이 URL에서는 잠재적으로 위험할 수 있습니다.

Angular는 다음과 같은 보안 컨텍스트를 정의합니다:

| 보안 컨텍스트      | 세부 사항                                                                          |
| :----------------- | :--------------------------------------------------------------------------------- |
| HTML               | 값을 HTML로 해석할 때 사용됩니다. 예를 들어, `innerHtml`에 바인딩할 때입니다.   |
| 스타일            | `style` 속성에 CSS를 바인딩할 때 사용됩니다.                                     |
| URL                | `<a href>`와 같은 URL 속성에 사용됩니다.                                        |
| 리소스 URL         | 코드로 실행되도록 로드되는 URL 예를 들어, `<script src>`에 사용됩니다.          |

Angular는 HTML 및 URL에 대한 신뢰할 수 없는 값을 청소합니다. 리소스 URL을 청소하는 것은 불가능합니다. 이에 따라 임의의 코드가 포함될 수 있습니다. 개발 모드에서는 Angular가 청소 중 값을 변경해야 할 때 콘솔 경고를 인쇄합니다.

### 청소 예시

다음 템플릿은 `htmlSnippet`의 값을 바인딩합니다. 한 번은 요소의 콘텐츠에 보간하여, 또 한 번은 요소의 `innerHTML` 속성에 바인딩하여 사용합니다:

<docs-code header="src/app/inner-html-binding.component.html" path="adev/src/content/examples/security/src/app/inner-html-binding.component.html"/>

보간된 콘텐츠는 항상 이스케이프됩니다 — HTML은 해석되지 않고 브라우저는 요소의 텍스트 콘텐츠에 각괄호(<>)를 표시합니다.

HTML을 해석하려면 `innerHTML`과 같은 HTML 속성에 바인딩하세요. 공격자가 제어할 수 있는 값을 `innerHTML`에 바인딩하는 것은 일반적으로 XSS 취약점을 초래합니다. 예를 들어, JavaScript를 다음과 같이 실행할 수 있습니다:

<docs-code header="src/app/inner-html-binding.component.ts (class)" path="adev/src/content/examples/security/src/app/inner-html-binding.component.ts" visibleRegion="class"/>

Angular는 값을 안전하지 않은 것으로 인식하고 자동으로 청소하여 `script` 요소를 제거하고 `<b>` 요소와 같은 안전한 콘텐츠는 유지합니다.

<img alt="Interpolated and bound HTML values" src="assets/images/guide/security/binding-inner-html.png#small">

### DOM API의 직접 사용 및 명시적 청소 호출

신뢰할 수 있는 타입을 시행하지 않는 한, 기본 제공 브라우저 DOM API는 보안 취약점으로부터 자동으로 보호해 주지 않습니다. 예를 들어, `document`, `ElementRef`를 통해 사용할 수 있는 노드 및 많은 서드파티 API는 안전하지 않은 메서드를 포함합니다. 마찬가지로 DOM을 조작하는 다른 라이브러리와 상호작용할 경우 Angular 보간과 같은 자동 청소가 없을 수 있습니다. DOM과 직접 상호작용하는 것을 피하고 가능한 경우 Angular 템플릿을 사용하세요.

이것이 불가피한 경우, Angular의 내장 청소 함수를 사용하세요. [DomSanitizer.sanitize](api/platform-browser/DomSanitizer#sanitize) 메서드와 적절한 `SecurityContext`를 사용하여 신뢰할 수 없는 값을 청소합니다. 이 함수는 `bypassSecurityTrust` 함수로 신뢰된 것으로 마킹된 값도 수락하며, 이에 대해서는 [신뢰된 값으로 마킹하기](#trusting-safe-values)에서 설명하고 있습니다.

### 안전한 값 신뢰하기

때때로 애플리케이션은 실행 가능한 코드를 포함하거나, 특정 URL에서 `<iframe>`을 표시하거나, 잠재적으로 위험한 URL을 구성해야 할 필요가 있습니다. 이러한 상황에서 자동 청소를 방지하려면 Angular에 값을 검사했고, 생성 방법을 확인했으며 안전하다는 것을 알리세요. _주의하세요_. 악성 코드일 수 있는 값을 신뢰하면 애플리케이션에 보안 취약점을 도입하게 됩니다. 의심스러운 경우 경험이 풍부한 보안 검토자를 찾으세요.

값을 신뢰된 것으로 마킹하기 위해 `DomSanitizer`를 주입하고 다음 메서드 중 하나를 호출하세요:

* `bypassSecurityTrustHtml`
* `bypassSecurityTrustScript`
* `bypassSecurityTrustStyle`
* `bypassSecurityTrustUrl`
* `bypassSecurityTrustResourceUrl`

값의 안전 여부는 컨텍스트에 따라 다르므로, 의도한 사용에 맞는 올바른 컨텍스트를 선택하세요. 다음 템플릿이 `javascript:alert(...)` 호출에 URL을 바인딩해야 한다고 가정해 보겠습니다:

<docs-code header="src/app/bypass-security.component.html (URL)" path="adev/src/content/examples/security/src/app/bypass-security.component.html" visibleRegion="URL"/>

보통 Angular는 URL을 자동으로 청소하고 위험한 코드를 비활성화하며, 개발 모드에서는 이 작업을 콘솔에 기록합니다. 이를 방지하려면 `bypassSecurityTrustUrl` 호출을 사용하여 URL 값을 신뢰된 URL로 표시하세요:

<docs-code header="src/app/bypass-security.component.ts (trust-url)" path="adev/src/content/examples/security/src/app/bypass-security.component.ts" visibleRegion="trust-url"/>

<img alt="신뢰된 URL에서 생성된 알림 상자의 스크린샷" src="assets/images/guide/security/bypass-security-component.png#medium">

사용자 입력을 신뢰된 값으로 변환해야 할 경우 컴포넌트 메서드를 사용하세요. 다음 템플릿은 사용자가 YouTube 비디오 ID를 입력하고 해당 비디오를 `<iframe>`에서 로드하도록 허용합니다. `<iframe src>` 속성은 리소스 URL 보안 컨텍스트입니다. 신뢰할 수 없는 소스가 예를 들어, 사용자들이 실행할 수 있는 파일 다운로드를 몰래 숨길 수 있기 때문입니다. 이를 방지하기 위해, 신뢰된 비디오 URL을 구성하는 컴포넌트의 메서드를 호출하여 Angular가 `<iframe src>`에 바인딩할 수 있도록 합니다:

<docs-code header="src/app/bypass-security.component.html (iframe)" path="adev/src/content/examples/security/src/app/bypass-security.component.html" visibleRegion="iframe"/>

<docs-code header="src/app/bypass-security.component.ts (trust-video-url)" path="adev/src/content/examples/security/src/app/bypass-security.component.ts" visibleRegion="trust-video-url"/>

### 콘텐츠 보안 정책

콘텐츠 보안 정책(CSP)은 XSS를 방지하기 위한 심층 방어 기술입니다. CSP를 활성화하려면 웹 서버를 구성하여 적절한 `Content-Security-Policy` HTTP 헤더를 반환하도록 합니다. Google 개발자 웹사이트의 [웹 기초 가이드](https://developers.google.com/web/fundamentals/security/csp)에서 콘텐츠 보안 정책에 대한 자세한 내용을 읽어보세요.

새로운 Angular 애플리케이션에 필요한 최소 정책은 다음과 같습니다:

<docs-code language="text">

default-src 'self'; style-src 'self' 'nonce-randomNonceGoesHere'; script-src 'self' 'nonce-randomNonceGoesHere';

</docs-code>

Angular 애플리케이션을 제공할 때 서버는 각 요청에 대해 무작위로 생성된 nonce를 HTTP 헤더에 포함해야 합니다. 이 nonce를 Angular에 제공해야 `<style>` 요소를 렌더링할 수 있습니다. Angular의 nonce를 설정하는 방법은 두 가지입니다:

1. 루트 애플리케이션 요소에 `ngCspNonce` 속성을 설정합니다: `<app ngCspNonce="randomNonceGoesHere"></app>`. 서버 측 템플릿을 사용하여 응답을 구성할 때 헤더와 `index.html` 모두에 nonce를 추가할 수 있는 경우 이 방법을 사용하세요.
2. 런타임에 nonce에 접근할 수 있고 `index.html`을 캐시할 수 있게 하려면 `CSP_NONCE` 주입 토큰을 사용하여 nonce를 제공하세요.

<docs-code language="typescript">

import {bootstrapApplication, CSP_NONCE} from '@angular/core';
import {AppComponent} from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [{
    provide: CSP_NONCE,
    useValue: globalThis.myRandomNonceValue
  }]
});

</docs-code>

<docs-callout title="고유 nonce">

제공하는 nonce가 <strong>각 요청마다 고유한지</strong> 확인하고 예측 가능하거나 추측할 수 없도록 하세요. 공격자가 미래의 nonce를 예측할 수 있다면 CSP로 제공되는 보호를 우회할 수 있습니다.

</docs-callout>

프로젝트에서 nonce를 생성할 수 없는 경우 CSP 헤더의 `style-src` 섹션에 `'unsafe-inline'`을 추가하여 인라인 스타일을 허용할 수 있습니다.

| 섹션                                         | 세부 사항                                                                                                                                                                                                          |
| :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src 'self';`                        | 페이지가 필요한 모든 리소스를 같은 출처에서 로드할 수 있도록 허용합니다.                                                                                                                                      |
| `style-src 'self' 'nonce-randomNonceGoesHere';` | 페이지가 같은 출처(`'self'`)의 글로벌 스타일 및 Angular에서 삽입한 스타일을 사용할 수 있도록 허용합니다.                                                                                                          |
| `script-src 'self' 'nonce-randomNonceGoesHere';` | 페이지가 같은 출처(`'self'`)의 JavaScript와 Angular CLI에서 삽입한 스크립트를 사용할 수 있도록 허용합니다. 이는 크리티컬 CSS 인라인을 사용하는 경우에만 필요합니다.                                |

Angular 자체는 올바르게 작동하는 데 필요한 이러한 설정만 요구합니다. 프로젝트가 커짐에 따라 애플리케이션에 특정한 추가 기능을 수용하기 위해 CSP 설정을 확장해야 할 수 있습니다.

### 신뢰된 타입 시행

앱이 크로스 사이트 스크립팅 공격으로부터 보호되는 데 도움을 주기 위해 [신뢰된 타입](https://w3c.github.io/trusted-types/dist/spec/)을 사용하는 것이 좋습니다. 신뢰된 타입은 보다 안전한 코딩 관행을 시행하여 XSS 공격을 방지할 수 있는 [웹 플랫폼](https://en.wikipedia.org/wiki/Web_platform) 기능입니다. 신뢰된 타입은 애플리케이션 코드의 감사 작업을 단순화하는 데 도움이 될 수도 있습니다.

<docs-callout title="신뢰된 타입">

신뢰된 타입은 귀하의 애플리케이션이 대상하는 모든 브라우저에서 사용할 수 없을 수도 있습니다. 신뢰된 타입을 지원하지 않는 브라우저에서 신뢰된 타입 사용이 가능한 애플리케이션이 실행될 경우 애플리케이션의 기능은 유지됩니다. Angular의 DomSanitizer를 통해 XSS로부터 보호됩니다. 현재 브라우저 지원 상태는 [caniuse.com/trusted-types](https://caniuse.com/trusted-types)를 참조하세요.

</docs-callout>

애플리케이션에 대해 신뢰된 타입을 시행하려면 애플리케이션의 웹 서버를 구성하여 다음 Angular 정책 중 하나를 방출하는 HTTP 헤더를 설정해야 합니다:

| 정책                     | 세부 사항                                                                                                                                                                                                                                                      |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular`                | 신뢰된 타입이 시행될 때 Angular가 작동하기 위해 필요한 보안 검토 코드에 사용되는 정책입니다. Angular로 청소된 인라인 템플릿 값이나 콘텐츠는 이 정책에 의해 안전한 것으로 간주됩니다.                                                                                                      |
| `angular#bundler`        | 이 정책은 Angular CLI 번들러가 지연 청크 파일을 생성할 때 사용됩니다.                                                                                                                                                                                                 |
| `angular#unsafe-bypass`  | 이 정책은 `bypassSecurityTrustHtml` 등의 Angular의 보안을 우회하는 메서드를 사용하는 애플리케이션에 사용됩니다. 이러한 메서드를 사용하는 애플리케이션은 이 정책을 활성화해야 합니다.                                                                                |
| `angular#unsafe-jit`     | 이 정책은 [즉시 컴파일(JIT) 컴파일러](api/core/Compiler)에서 사용됩니다. JIT 컴파일러와 직접 상호작용하거나 [플랫폼 브라우저 동적](api/platform-browser-dynamic/platformBrowserDynamic) 사용 중인 경우 이 정책을 활성화해야 합니다.                           |
| `angular#unsafe-upgrade` | 이 정책은 [@angular/upgrade](api/upgrade/static/UpgradeModule) 패키지에서 사용됩니다. 응용 프로그램이 AngularJS 하이브리드일 경우 이 정책을 활성화해야 합니다.                                                                                                |

신뢰된 타입에 대한 HTTP 헤더를 다음 위치에서 구성해야 합니다:

* 생산 제공 인프라
* Angular CLI(`ng serve`), `angular.json` 파일의 `headers` 속성을 사용하여 로컬 개발 및 종단 간 테스트
* Karma(`ng test`), `karma.config.js` 파일의 `customHeaders` 속성을 사용하여 단위 테스트

다음은 신뢰된 타입 및 Angular에 대해 특별히 구성된 헤더의 예입니다:

<docs-code language="html">

Content-Security-Policy: trusted-types angular; require-trusted-types-for 'script';

</docs-code>

다음은 신뢰된 타입 및 Angular의 보안 우회를 우회하는 Angular의 메서드를 사용하는 애플리케이션에 대해 특별히 구성된 헤더의 예입니다:

<docs-code language="html">

Content-Security-Policy: trusted-types angular angular#unsafe-bypass; require-trusted-types-for 'script';

</docs-code>

다음은 JIT를 사용하는 신뢰된 타입 및 Angular 애플리케이션에 대해 특별히 구성된 헤더의 예입니다:

<docs-code language="html">

Content-Security-Policy: trusted-types angular angular#unsafe-jit; require-trusted-types-for 'script';

</docs-code>

다음은 지연 로딩 모듈을 사용하는 신뢰된 타입 및 Angular 애플리케이션에 대해 특별히 구성된 헤더의 예입니다:

<docs-code language="html">

Content-Security-Policy: trusted-types angular angular#bundler; require-trusted-types-for 'script';

</docs-code>

<docs-callout title="커뮤니티 기여">

신뢰된 타입 구성 문제를 해결하는 방법에 대해 더 알고 싶다면 다음 자원이 유용할 수 있습니다:

[신뢰된 타입으로 DOM 기반 크로스 사이트 스크립팅 취약점 방지](https://web.dev/trusted-types/#how-to-use-trusted-types)

</docs-callout>

### AOT 템플릿 컴파일러 사용하기

AOT 템플릿 컴파일러는 템플릿 주입이라는 전반적인 유형의 취약점을 방지하고 애플리케이션 성능을 크게 개선합니다. AOT 템플릿 컴파일러는 Angular CLI 애플리케이션에서 사용되는 기본 컴파일러이며 모든 프로덕션 배포에서 사용해야 합니다.

AOT 컴파일러의 대안은 JIT 컴파일러로, 런타임 시 브라우저 내에서 실행 가능한 템플릿 코드로 템플릿을 컴파일합니다. Angular는 템플릿 코드를 신뢰하므로, 특히 사용자 데이터를 포함한 템플릿을 동적으로 생성하고 컴파일하는 것은 Angular의 내장 방어를 우회하는 보안 안티 패턴입니다. 안전하게 동적으로 폼을 구성하는 방법에 대한 정보는 [동적 폼](guide/forms/dynamic-forms) 가이드를 참고하세요.

### 서버 측 XSS 보호

서버에서 생성된 HTML은 주입 공격에 취약합니다. Angular 애플리케이션에 템플릿 코드를 주입하는 것은 실행 가능한 코드를 애플리케이션에 주입하는 것과 같습니다. 이는 공격자에게 애플리케이션에 대한 완전한 제어권을 부여합니다. 이를 방지하려면 XSS 취약점을 방지하기 위해 값을 자동으로 이스케이프하는 템플릿 언어를 사용하세요. 서버 측에서 템플릿 언어를 사용하여 Angular 템플릿을 생성하지 마세요. 이는 템플릿 주입 취약점이 발생할 가능성이 매우 높습니다.

## HTTP 수준 취약점

Angular는 크로스 사이트 요청 위조(CSRF 또는 XSRF) 및 크로스 사이트 스크립트 포함(XSSI)이라는 두 가지 일반적인 HTTP 취약점을 방지하기 위한 기본 제공 지원을 제공합니다. 이 두 가지는 주로 서버 측에서 완화해야 하지만, Angular는 클라이언트 측 통합을 쉽게 하도록 도와주는 도우미를 제공합니다.

### 크로스 사이트 요청 위조

크로스 사이트 요청 위조(CSRF 또는 XSRF)에서 공격자는 사용자가 악성 코드가 있는 다른 웹 페이지(예: `evil.com`)를 방문하도록 속입니다. 이 웹 페이지는 애플리케이션의 웹 서버(예: `example-bank.com`)에 악의적인 요청을 비밀리에 전송합니다.

사용자가 `example-bank.com`에 로그인했다고 가정합니다. 사용자는 이메일을 열고 `evil.com` 링크를 클릭하여 새 탭에서 엽니다.

`evil.com` 페이지는 즉시 `example-bank.com`에 악의적인 요청을 보냅니다. 아마도 사용자의 계좌에서 공격자의 계좌로 돈을 이체하는 요청일 것입니다. 브라우저는 이러한 요청과 함께 인증 쿠키를 포함하여 `example-bank.com` 쿠키를 자동으로 전송합니다.

`example-bank.com` 서버가 XSRF 보호 기능이 없다면 합법적인 애플리케이션 요청과 `evil.com`의 위조 요청을 구분할 수 없습니다.

이를 방지하려면 애플리케이션은 사용자의 요청이 다른 사이트가 아닌 실제 애플리케이션에서 발생했음을 확인해야 합니다. 서버와 클라이언트는 이 공격을 저지하기 위해 협력해야 합니다.

일반적인 XSRF 방어 기술에서는 애플리케이션 서버가 쿠키에 임의로 생성된 인증 토큰을 전송합니다. 클라이언트 코드는 쿠키를 읽고 모든 후속 요청에 토큰을 담은 커스텀 요청 헤더를 추가합니다. 서버는 수신된 쿠키 값과 요청 헤더 값을 비교하고 값이 누락되었거나 일치하지 않으면 요청을 거부합니다.

이 기술은 모든 브라우저가 _같은 출처 정책_을 구현하기 때문에 효과적입니다. 쿠키가 설정된 사이트의 코드만 해당 사이트에서 쿠키를 읽고 그 사이트에 요청을 보내는 커스텀 헤더를 설정할 수 있습니다. 이는 귀하의 애플리케이션만이 이 쿠키 토큰을 읽고 커스텀 헤더를 설정할 수 있다는 것을 의미합니다. `evil.com`의 악성 코드 것은 할 수 없습니다.

### `HttpClient` XSRF/CSRF 보안

`HttpClient`는 XSRF 공격을 방지하는 데 사용되는 [일반적인 메커니즘](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Cookie-to-header_token)을 지원합니다. HTTP 요청을 실행할 때 인터셉터는 기본적으로 `XSRF-TOKEN`이라는 쿠키에서 토큰을 읽고 이를 HTTP 헤더 `X-XSRF-TOKEN`으로 설정합니다. 본인의 도메인에서 실행되는 코드만이 쿠키를 읽을 수 있으므로, 백엔드는 HTTP 요청이 귀하의 클라이언트 애플리케이션에서 발생했음을 확신할 수 있습니다.

기본적으로 인터셉터는 상대 URL에 대한 모든 변경 요청(예: `POST`)에서 이 헤더를 전송하지만 GET/HEAD 요청이나 절대 URL 요청에서는 전송하지 않습니다.

<docs-callout helpful title="GET 요청을 보호하지 않는 이유?">
CSRF 방지는 백엔드에서 상태를 변경할 수 있는 요청에만 필요합니다. 본질적으로 CSRF 공격은 도메인 경계를 초과하며 웹의 [같은 출처 정책](https://developer.mozilla.org/docs/Web/Security/Same-origin_policy)은 공격 페이지가 인증된 GET 요청의 결과를 검색하는 것을 방지합니다.
</docs-callout>

이를 활용하기 위해서는 서버가 페이지 로드 또는 첫 번째 GET 요청 시 `XSRF-TOKEN`이라는 JavaScript에서 읽을 수 있는 세션 쿠키에 토큰을 설정해야 합니다. 후속 요청에서 서버는 쿠키가 `X-XSRF-TOKEN` HTTP 헤더와 일치하는지 확인할 수 있으며, 따라서 귀하의 도메인에서 실행되는 코드만 요청을 보낼 수 있었던 것임을 확인합니다. 이 토큰은 각 사용자마다 고유해야 하며, 서버에서 확인 가능해야 합니다. 이렇게 하면 클라이언트가 자체 토큰을 만들지 못하도록 방지합니다. 추가 보안을 위해 사이트의 인증 쿠키를 해시한 값을 salt와 함께 설정하세요.

여러 Angular 애플리케이션이 같은 도메인이나 하위 도메인을 공유하는 환경에서 충돌을 방지하려면 각 애플리케이션에 고유한 쿠키 이름을 부여하세요.

<docs-callout important title="HttpClient는 XSRF 보호 계획의 클라이언트 절반만 지원합니다.">
백엔드 서비스는 페이지에 대한 쿠키를 설정하고 모든 적합한 요청에 대해 헤더가 존재하는지 확인하도록 구성되어야 합니다. 그렇지 않으면 Angular의 기본 보호 기능이 효과적이지 않습니다.
</docs-callout>

### 사용자 정의 쿠키/헤더 이름 구성

백엔드 서비스에서 XSRF 토큰 쿠키나 헤더의 이름이 다른 경우 `withXsrfConfiguration`을 사용하여 기본값을 재정의하세요.

다음과 같이 `provideHttpClient` 호출에 추가하세요:

<docs-code language="ts">
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'CUSTOM_XSRF_TOKEN',
        headerName: 'X-Custom-Xsrf-Header',
      }),
    ),
  ]
};
</docs-code>

### XSRF 보호 비활성화

내장 XSRF 보호 메커니즘이 애플리케이션에 작동하지 않는 경우 `withNoXsrfProtection` 기능을 사용하여 비활성화할 수 있습니다:

<docs-code language="ts">
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withNoXsrfProtection(),
    ),
  ]
};
</docs-code>

OWASP에서 CSRF에 대한 정보는 [크로스 사이트 요청 위조(CSRF)](https://owasp.org/www-community/attacks/csrf)와 [크로스 사이트 요청 위조(CSRF) 방지 요약](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)을 참조하세요. 스탠포드 대학교 논문인 [크로스 사이트 요청 위조에 대한 강력한 방어](https://seclab.stanford.edu/websec/csrf/csrf.pdf)는 자세한 정보를 제공하는 출처입니다.

또한 Dave Smith의 [AngularConnect 2016에서 XSRF에 대한 발표](https://www.youtube.com/watch?v=9inczw6qtpY "Cross Site Request Funkery Securing Your Angular Apps From Evil Doers")도 확인하세요.

### 크로스 사이트 스크립트 포함(XSSI)

크로스 사이트 스크립트 포함은 JSON 취약점이라고도 하며, 공격자의 웹사이트가 JSON API의 데이터를 읽을 수 있게 할 수 있습니다. 이 공격은 내장 JavaScript 객체 생성자를 오버라이드하고 `<script>` 태그를 사용하여 API URL을 포함하여 오래된 브라우저에서 작동합니다.

이 공격은 반환된 JSON이 자바스크립트로 실행 가능할 경우에만 성공합니다. 서버는 모든 JSON 응답에 비실행 가능한 접두사를 추가하여 공격을 방지할 수 있으며, 일반적으로 잘 알려진 문자열 `")]}',\n"`을 사용합니다.

Angular의 `HttpClient` 라이브러리는 이러한 규칙을 인식하고 모든 응답에서 문자열 `")]}',\n"`을 자동으로 제거하여 추가 파싱 전에 처리합니다.

더 많은 정보는 [Google 웹 보안 블로그 게시물](https://security.googleblog.com/2011/05/website-security-for-webmasters.html)의 XSSI 섹션을 참고하세요.

## Angular 애플리케이션 감사

Angular 애플리케이션은 일반 웹 애플리케이션과 동일한 보안 원칙을 따라야 하며, 따라서 감사 대상이 되어야 합니다. 보안 검토에서 감사해야 하는 Angular 특정 API는 [_bypassSecurityTrust_](#trusting-safe-values) 메서드와 같이 문서에 보안 민감도로 표시되어 있습니다.