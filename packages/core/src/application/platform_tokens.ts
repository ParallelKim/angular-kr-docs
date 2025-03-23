/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from '../di/injection_token';

/**
 * 현재 HTTP 요청 객체를 나타내는 주입 토큰입니다.
 *
 * 서버측 렌더링 (SSR) 처리 시 현재 요청에 접근하기 위해 이 토큰을 사용하십시오.
 *
 * @remarks
 * 이 토큰은 다음 시나리오에서 `null`일 수 있습니다:
 *
 * * 빌드 과정 중.
 * * 애플리케이션이 브라우저에서 렌더링될 때 (클라이언트 측 렌더링).
 * * 정적 사이트 생성 (SSG)을 수행할 때.
 * * 개발 중 경로 추출 시 (요청 시점에).
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Request | `Request` on MDN}
 *
 * @developerPreview
 */
export const REQUEST = new InjectionToken<Request | null>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'REQUEST' : '',
  {
    providedIn: 'platform',
    factory: () => null,
  },
);

/**
 * 응답 초기화 옵션에 대한 주입 토큰입니다.
 *
 * 서버 측 렌더링 또는 API 엔드포인트의 HTTP 응답을 구성하거나 초기화하기 위해 응답 옵션을 제공하기 위해 이 토큰을 사용하십시오.
 *
 * @remarks
 * 이 토큰은 다음 시나리오에서 `null`일 수 있습니다:
 *
 * * 빌드 과정 중.
 * * 애플리케이션이 브라우저에서 렌더링될 때 (클라이언트 측 렌더링).
 * * 정적 사이트 생성 (SSG)을 수행할 때.
 * * 개발 중 경로 추출 시 (요청 시점에).
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Response/Response | `ResponseInit` on MDN}
 *
 * @developerPreview
 */
export const RESPONSE_INIT = new InjectionToken<ResponseInit | null>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'RESPONSE_INIT' : '',
  {
    providedIn: 'platform',
    factory: () => null,
  },
);

/**
 * 추가 요청 컨텍스트에 대한 주입 토큰입니다.
 *
 * 서버 측 렌더링에서 현재 요청과 관련된 사용자 정의 메타데이터 또는 컨텍스트를 전달하기 위해 이 토큰을 사용하십시오.
 *
 * @remarks
 * 이 토큰은 서버 측 렌더링 중에만 사용할 수 있으며 다른 컨텍스트에서는 `null`이 됩니다.
 *
 * @developerPreview
 */
export const REQUEST_CONTEXT = new InjectionToken<unknown>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'REQUEST_CONTEXT' : '',
  {
    providedIn: 'platform',
    factory: () => null,
  },
);
