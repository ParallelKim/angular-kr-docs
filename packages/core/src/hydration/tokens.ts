/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from '../di/injection_token';

/**
 * 내부 토큰으로, 수화(복원) 중 DOM 재사용 로직이 활성화되어 있는지 여부를 지정합니다.
 */
export const IS_HYDRATION_DOM_REUSE_ENABLED = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || !!ngDevMode ? 'IS_HYDRATION_DOM_REUSE_ENABLED' : '',
);

// 기본적으로(클라이언트 렌더링 모드에서는) 호스트 요소의 모든 내용을 제거하고 그 후 애플리케이션을 렌더링합니다.
export const PRESERVE_HOST_CONTENT_DEFAULT = false;

/**
 * 부트스트랩(부팅) 중 호스트 요소 내용이 유지되어야 하는지 여부를 나타내는 내부 토큰입니다.
 */
export const PRESERVE_HOST_CONTENT = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || !!ngDevMode ? 'PRESERVE_HOST_CONTENT' : '',
  {
    providedIn: 'root',
    factory: () => PRESERVE_HOST_CONTENT_DEFAULT,
  },
);

/**
 * i18n에 대한 수화(복원) 지원이 활성화되어 있는지 여부를 나타내는 내부 토큰입니다.
 */
export const IS_I18N_HYDRATION_ENABLED = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || !!ngDevMode ? 'IS_I18N_HYDRATION_ENABLED' : '',
);

/**
 * SSR에 대한 이벤트 재생 지원이 활성화되어 있는지 여부를 나타내는 내부 토큰입니다.
 */
export const IS_EVENT_REPLAY_ENABLED = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || !!ngDevMode ? 'IS_EVENT_REPLAY_ENABLED' : '',
);

export const EVENT_REPLAY_ENABLED_DEFAULT = false;

/**
 * 점진적 수화(복원) 지원이 활성화되어 있는지 여부를 나타내는 내부 토큰입니다.
 */
export const IS_INCREMENTAL_HYDRATION_ENABLED = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || !!ngDevMode ? 'IS_INCREMENTAL_HYDRATION_ENABLED' : '',
);

/**
 * `jsaction` 속성이 있는 DOM 요소의 동작명별로 그룹화된 맵입니다.
 */
export const JSACTION_BLOCK_ELEMENT_MAP = new InjectionToken<Map<string, Set<Element>>>(
  ngDevMode ? 'JSACTION_BLOCK_ELEMENT_MAP' : '',
  {
    providedIn: 'root',
    factory: () => new Map<string, Set<Element>>(),
  },
);
