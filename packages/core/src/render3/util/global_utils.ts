/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {assertDefined} from '../../util/assert';
import {global} from '../../util/global';
import {setupFrameworkInjectorProfiler} from '../debug/framework_injector_profiler';
import {setProfiler} from '../profiler';
import {isSignal} from '../reactivity/api';

import {applyChanges} from './change_detection_utils';
import {getDeferBlocks} from './defer';
import {
  getComponent,
  getContext,
  getDirectiveMetadata,
  getDirectives,
  getHostElement,
  getInjector,
  getListeners,
  getOwningComponent,
  getRootComponents,
} from './discovery_utils';
import {
  getDependenciesFromInjectable,
  getInjectorMetadata,
  getInjectorProviders,
  getInjectorResolutionPath,
} from './injector_discovery_utils';
import {getSignalGraph} from './signal_debug';

/**
 * 이 파일은 Angular 디버깅 스토리가 작동하도록 허용하기 위해
 * 전역적으로 접근 가능한 디버그 도구 시리즈를 도입합니다.
 *
 * 이를 실행해 보려면 다음 명령어를 실행하세요:
 *
 *   bazel run //packages/core/test/bundling/todo:devserver
 *
 *  그런 다음 `localhost:5432`를 로드하고 콘솔 도구를 사용하세요.
 */

/**
 * 이 값은 dev 도구가 패치된 창의 속성을 반영합니다 (window.ng).
 * */
export const GLOBAL_PUBLISH_EXPANDO_KEY = 'ng';

// 외부에 게시된 전역 유틸리티 함수의 타입 지정
// 이상적으로는 선언 병합을 사용하여 `NgGlobalPublishUtils`를 사용할 수 있어야 하지만,
// API 추출기와는 아직 작동하지 않습니다.
// 타입 안전성을 위해 지원하는 편집기(예: VSCode)에서 작업할 때 타입을 포함했습니다.
interface NgGlobalPublishUtils {
  ɵgetLoadedRoutes(route: any): any;
}

const globalUtilsFunctions = {
  /**
   * 경고: `ɵ`로 시작하는 함수는 *내부*로 간주되며
   * 애플리케이션 코드에서 의존해서는 안 됩니다. 이러한 함수의 계약은
   * 모든 릴리스에서 변경될 수 있으며, 함수가 완전히 제거될 수도 있습니다.
   */
  'ɵgetDependenciesFromInjectable': getDependenciesFromInjectable,
  'ɵgetInjectorProviders': getInjectorProviders,
  'ɵgetInjectorResolutionPath': getInjectorResolutionPath,
  'ɵgetInjectorMetadata': getInjectorMetadata,
  'ɵsetProfiler': setProfiler,
  'ɵgetSignalGraph': getSignalGraph,
  'ɵgetDeferBlocks': getDeferBlocks,

  'getDirectiveMetadata': getDirectiveMetadata,
  'getComponent': getComponent,
  'getContext': getContext,
  'getListeners': getListeners,
  'getOwningComponent': getOwningComponent,
  'getHostElement': getHostElement,
  'getInjector': getInjector,
  'getRootComponents': getRootComponents,
  'getDirectives': getDirectives,
  'applyChanges': applyChanges,
  'isSignal': isSignal,
};
type CoreGlobalUtilsFunctions = keyof typeof globalUtilsFunctions;
type ExternalGlobalUtilsFunctions = keyof NgGlobalPublishUtils;

let _published = false;
/**
 * 기본 디버그 도구 모음을 `window.ng`에 공개합니다.
 *
 * 이러한 함수는 Angular가 개발 모드에 있을 때 전역적으로 사용 가능하며,
 * 프로덕션 모드에서는 자동으로 제거됩니다.
 */
export function publishDefaultGlobalUtils() {
  if (!_published) {
    _published = true;

    if (typeof window !== 'undefined') {
      // 브라우저에서 실행할 때만 주입기 프로파일러를 구성합니다.
      setupFrameworkInjectorProfiler();
    }

    for (const [methodName, method] of Object.entries(globalUtilsFunctions)) {
      publishGlobalUtil(methodName as CoreGlobalUtilsFunctions, method);
    }
  }
}

/**
 * `window.ng` 아래에서 사용할 수 있는 기본 디버그 도구입니다.
 */
export type GlobalDevModeUtils = {
  [GLOBAL_PUBLISH_EXPANDO_KEY]: typeof globalUtilsFunctions;
};

/**
 * 주어진 함수를 `window.ng`에 게시하여
 * 프로덕션이 아닐 때 브라우저 콘솔에서 사용할 수 있도록 합니다.
 */
export function publishGlobalUtil<K extends CoreGlobalUtilsFunctions>(
  name: K,
  fn: (typeof globalUtilsFunctions)[K],
): void {
  publishUtil(name, fn);
}

/**
 * @angular/core가 아닌 패키지에서 `window.ng`에 주어진 함수를 게시합니다.
 * 프로덕션이 아닐 때 브라우저 콘솔에서 사용될 수 있습니다.
 */
export function publishExternalGlobalUtil<K extends ExternalGlobalUtilsFunctions>(
  name: K,
  fn: NgGlobalPublishUtils[K],
): void {
  publishUtil(name, fn);
}

function publishUtil(name: string, fn: Function) {
  if (typeof COMPILED === 'undefined' || !COMPILED) {
    // 주의: Closure 최적화를 사용하는 경우 `ng`를 내보낼 수 없습니다:
    // - Closure는 최소화된 이름에 대해 전역을 선언하므로, 때때로 우리의 `ng` 전역을 덮어쓸 수 있습니다.
    // - Google 내에서 AngularJS에 대한 타이핑을 위해 우승 소스가 이미 사용되고 있는 네임스페이스 `ng`로 Closure extern을 선언할 수 없습니다.
    const w = global;
    ngDevMode && assertDefined(fn, '함수가 정의되지 않음');

    w[GLOBAL_PUBLISH_EXPANDO_KEY] ??= {} as any;
    w[GLOBAL_PUBLISH_EXPANDO_KEY][name] = fn;
  }
}
