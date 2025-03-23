/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from '../di/injection_token';
import {getDocument} from '../render3/interfaces/document';

/**
 * 문자열 ID를 나타내는 DI 토큰으로,
 * 주로 {@link ViewEncapsulation#Emulated}가 사용될 때
 * 응용 프로그램 속성과 CSS 스타일을 접두사로 붙이는 데 사용됩니다.
 *
 * 여러 응용 프로그램이 페이지에서 부트스트랩될 때
 * (예: `bootstrapApplication` 호출 사용) 필요한 토큰입니다.
 * 이 경우, 해당 응용 프로그램들이 서로 다른 `APP_ID` 값을 설정했는지 확인하세요. 예를 들어:
 *
 * ```ts
 * bootstrapApplication(ComponentA, {
 *   providers: [
 *     { provide: APP_ID, useValue: 'app-a' },
 *     // ... 다른 제공자들 ...
 *   ]
 * });
 *
 * bootstrapApplication(ComponentB, {
 *   providers: [
 *     { provide: APP_ID, useValue: 'app-b' },
 *     // ... 다른 제공자들 ...
 *   ]
 * });
 * ```
 *
 * 기본적으로, 부트스트랩된 응용 프로그램이 하나만 있을 경우,
 * `APP_ID` 토큰을 제공할 필요가 없습니다
 * (`ng`가 앱 ID로 사용됩니다).
 *
 * @publicApi
 */
export const APP_ID = new InjectionToken<string>(ngDevMode ? 'AppId' : '', {
  providedIn: 'root',
  factory: () => DEFAULT_APP_ID,
});

/** `APP_ID` 토큰의 기본 값. */
const DEFAULT_APP_ID = 'ng';

/**
 * 플랫폼이 초기화될 때 실행되는 함수입니다.
 *
 * @deprecated v19.0.0부터, 대신 providePlatformInitializer를 사용하세요.
 *
 * @see {@link providePlatformInitializer}
 *
 * @publicApi
 */
export const PLATFORM_INITIALIZER = new InjectionToken<ReadonlyArray<() => void>>(
  ngDevMode ? 'Platform Initializer' : '',
);

/**
 * 불투명한 플랫폼 ID를 표시하는 토큰입니다.
 * @publicApi
 */
export const PLATFORM_ID = new InjectionToken<Object>(ngDevMode ? 'Platform ID' : '', {
  providedIn: 'platform',
  factory: () => 'unknown', // 명시적으로 설정되지 않았을 때 기본 플랫폼 이름 설정
});

/**
 * 응용 프로그램의 루트 디렉터리를 나타내는 DI 토큰입니다.
 * @publicApi
 * @deprecated
 */
export const PACKAGE_ROOT_URL = new InjectionToken<string>(
  ngDevMode ? 'Application Packages Root URL' : '',
);

// 이 토큰은 애니메이션 패키지가 아닌 여기에서 유지됩니다.
// 이렇게 하면 특정 애니메이션 모듈이 로드되었는지를 확인하는 모듈들(CDK 등)이
// 추가 종속성을 포함하지 않고도 이를 검색할 수 있습니다. 자세한 내용은 #44970을 참조하십시오.

/**
 * 로드된 애니메이션 모듈을 표시하는 [DI 토큰](api/core/InjectionToken)입니다.
 * @publicApi
 */
export const ANIMATION_MODULE_TYPE = new InjectionToken<'NoopAnimations' | 'BrowserAnimations'>(
  ngDevMode ? 'AnimationModuleType' : '',
);

// TODO(crisbeto): CSP 가이드를 여기 링크하세요.
/**
 * Angular가 인라인 스타일을 삽입할 때 적용할 [Content Security Policy](https://web.dev/strict-csp/) nonce를 구성하는 데 사용되는 토큰입니다.
 * 제공되지 않은 경우, Angular는 응용 프로그램 루트 노드의 `ngCspNonce` 속성에서 값을 찾아봅니다.
 *
 * @publicApi
 */
export const CSP_NONCE = new InjectionToken<string | null>(ngDevMode ? 'CSP nonce' : '', {
  providedIn: 'root',
  factory: () => {
    // 이상적으로는 nonce가 루트 노드에 있을 것임을 알고 있기 때문에 여기서 `querySelector`를 사용할 필요가 없습니다.
    // 하지만 토큰 값이 렌더러에서 사용되기 때문에 부트스트랩 과정에서 아주 초기 단계에서 사용 가능해야 합니다.
    // 이는 꽤 얕은 검색이 되어야 합니다. 왜냐하면 앱이 아직 DOM에 추가되지 않았기 때문입니다.
    // 고려했던 접근 방식:
    // 1. `ApplicationRef.components[i].location`을 통해 루트 노드를 찾습니다 -
    // 일반적으로, 이는 우리의 목적에 충분하지만, 토큰이 매우 일찍 주입되어 `components` 배열은 아직 채워지지 않았습니다.
    // 2. 현재 `LView`를 통해 루트 `LView`를 찾습니다 - 렌더러는 `LView`를 생성하기 위한 필수 조건입니다.
    // 이는 루트 컴포넌트의 이 팩토리가 호출될 때 어떤 `LView`에도 들어가지 않음을 의미합니다.
    // 3. 토큰 팩토리가 nonce 요청 시 호출되는 `() => string`을 반환하도록 합니다 -
    // 약간 늦은 실행은 `LView` 참조를 얻는 것을 허용하지만,
    // 그것이 함수라는 사실은 *언제든지* (즉시 포함) 실행될 수 있음을 의미하며,
    // 이는 이상한 버그로 이어질 수 있습니다.
    // 4. `ComponentFactory`가 속성을 읽어 이를 주입자에게 제공하도록 합니다 -
    // 이는 루트 노드에 대한 쿼리를 수행할 때 렌더러가 사용된다는 점에서 #1 및 #2와 동일한 문제점을 가지고 있습니다.
    return getDocument().body?.querySelector('[ngCspNonce]')?.getAttribute('ngCspNonce') || null;
  },
});

/**
 * 이미지 관련 옵션을 위한 구성 객체입니다. 다음을 포함합니다:
 * - breakpoints: 반응형 이미지에 대한 srcset을 생성하는 데 사용되는 정수 브레이크포인트 배열입니다.
 * - disableImageSizeWarning: 부울 값. 이를 true로 설정하면
 *      과도한 이미지에 대한 콘솔 경고가 비활성화됩니다.
 * - disableImageLazyLoadWarning: 부울 값. 이를 true로 설정하면
 *      `loading="lazy"`로 구성된 LCP 이미지에 대한 콘솔 경고가 비활성화됩니다.
 * [NgOptimizedImage 가이드](guide/image-optimization)에서 반응형 이미지 구성에 대해 더 알아보세요.
 * [관련 오류 페이지](errors/NG0913)에서 이미지 경고 옵션에 대해 더 알아보세요.
 * @publicApi
 */
export type ImageConfig = {
  breakpoints?: number[];
  placeholderResolution?: number;
  disableImageSizeWarning?: boolean;
  disableImageLazyLoadWarning?: boolean;
};

export const IMAGE_CONFIG_DEFAULTS: ImageConfig = {
  breakpoints: [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  placeholderResolution: 30,
  disableImageSizeWarning: false,
  disableImageLazyLoadWarning: false,
};

/**
 * 이미지 최적화된 이미지 기능을 구성하는 주입 토큰입니다.
 * 사용 가능한 매개변수에 대한 추가 정보는 {@link ImageConfig}를 참조하세요.
 *
 * @see {@link NgOptimizedImage}
 * @see {@link ImageConfig}
 * @publicApi
 */
export const IMAGE_CONFIG = new InjectionToken<ImageConfig>(ngDevMode ? 'ImageConfig' : '', {
  providedIn: 'root',
  factory: () => IMAGE_CONFIG_DEFAULTS,
});
