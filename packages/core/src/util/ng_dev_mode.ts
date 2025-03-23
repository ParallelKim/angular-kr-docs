/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {global} from './global';

declare global {
  /**
   * ngDevMode의 값
   * 애플리케이션의 현재 상태에 따라 ngDevMode는 여러 값 중 하나를 가질 수 있습니다.
   *
   * 편의성을 위해, 개발 모드를 활성화하는 “truthy” 값은 Angular의 성능 카운터를 포함하는 객체이기도 합니다.
   * 이는 필요하지 않지만, 성능 카운터를 위한 보일러플레이트를 줄여줍니다.
   *
   * ngDevMode는 false로 설정될 수도 있습니다. 이는 몇 가지 방법으로 발생할 수 있습니다:
   * - 사용자가 자신의 애플리케이션 어딘가에서 `window.ngDevMode = false`를 명시적으로 설정합니다.
   * - 사용자가 `enableProdMode()`를 호출합니다.
   * - URL에 `ngDevMode=false` 텍스트가 포함되어 있습니다.
   * 마지막으로, ngDevMode가 전혀 정의되지 않았을 수도 있습니다.
   */
  const ngDevMode: null | NgDevModePerfCounters;

  interface NgDevModePerfCounters {
    namedConstructors: boolean;
    firstCreatePass: number;
    tNode: number;
    tView: number;
    hydratedNodes: number;
    hydratedComponents: number;
    dehydratedViewsRemoved: number;
    dehydratedViewsCleanupRuns: number;
    componentsSkippedHydration: number;
    deferBlocksWithIncrementalHydration: number;
  }
}

export function ngDevModeResetPerfCounters(): NgDevModePerfCounters {
  const locationString = typeof location !== 'undefined' ? location.toString() : '';
  const newCounters: NgDevModePerfCounters = {
    namedConstructors: locationString.indexOf('ngDevMode=namedConstructors') != -1,
    firstCreatePass: 0,
    tNode: 0,
    tView: 0,
    hydratedNodes: 0,
    hydratedComponents: 0,
    dehydratedViewsRemoved: 0,
    dehydratedViewsCleanupRuns: 0,
    componentsSkippedHydration: 0,
    deferBlocksWithIncrementalHydration: 0,
  };

  // ngDevMode를 클로저에서 ['ngDevMode']로 참조해야 합니다.
  const allowNgDevModeTrue = locationString.indexOf('ngDevMode=false') === -1;
  if (!allowNgDevModeTrue) {
    global['ngDevMode'] = false;
  } else {
    if (typeof global['ngDevMode'] !== 'object') {
      global['ngDevMode'] = {};
    }
    Object.assign(global['ngDevMode'], newCounters);
  }
  return newCounters;
}

/**
 * 이 함수는 `ngDevMode`가 설정되었는지 확인합니다. 만약 그렇다면,
 * 이를 존중하고, 그렇지 않으면 추가 검사를 통해 개발 모드로 기본 설정합니다.
 *
 * 아이디어는 우리가 프로덕션 빌드를 진행하지 않는 한, 즉 `ngDevMode == false`를 명시적으로 설정하지 않는 한
 * 가능한 한 개발자를 돕기 위해 가능한 많은 초기 경고 및 오류를 제공해야 한다는 것입니다.
 *
 * `ɵɵdefineComponent`는 모든 컴포넌트 템플릿 함수(그리고 따라서 Ivy 지시어) 이전에 호출된다는 것이 보장되므로,
 * 단일 초기화만 있어도 ngDevMode가 전체 지시 세트에 대해 정의되어 있음을 보장합니다.
 *
 * 최상위에서 `ngDevMode`를 확인할 때, 항상 참조하기 전에 초기화해야 합니다
 * (예: `((typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode())`),
 * 그렇지 않으면 https://github.com/angular/angular/issues/31595와 같은 `ReferenceError`가 발생할 수 있습니다.
 *
 * `ngDevMode`에 대한 가능한 값에 대한 자세한 내용은 문서 문자열에서 확인할 수 있습니다.
 *
 * 주의:
 * - `ngDevMode` 이름의 변경 사항은 `compiler-cli/src/tooling.ts`와 동기화해야 합니다.
 */
export function initNgDevMode(): boolean {
  // 아래의 체크는 `initNgDevMode`를 여러 번 호출해도 카운터가 리셋되지 않도록 보장합니다.
  // `ngDevMode`가 객체가 아니면, 성능 카운터를 아직 생성하지 않았다는 것을 의미합니다.
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    if (typeof ngDevMode !== 'object' || Object.keys(ngDevMode).length === 0) {
      ngDevModeResetPerfCounters();
    }
    return typeof ngDevMode !== 'undefined' && !!ngDevMode;
  }
  return false;
}
