/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {type Profiler} from './profiler_types';

let profilerCallback: Profiler | null = null;

/**
 * 특정 작업을 실행하기 전과 후에 호출되는 콜백 함수를 설정합니다.
 * 런타임에서 (예: 변경 감지를 실행하기 전과 후).
 *
 * 경고: 이 함수는 *내부* 함수이며 애플리케이션 코드에서 의존해서는 안 됩니다.
 * 함수의 계약은 어떤 릴리스에서도 변경될 수 있으며, 함수는 완전히 제거될 수 있습니다.
 *
 * @param profiler 호출자가 제공한 함수 또는 프로파일링을 비활성화하기 위한 null 값.
 */
export const setProfiler = (profiler: Profiler | null) => {
  profilerCallback = profiler;
};

/**
 * 런타임에서 실행되는 사용자 코드를 래핑하는 프로파일러 함수입니다.
 *
 * @param event 실행 컨텍스트에 해당하는 ProfilerEvent
 * @param instance 컴포넌트 인스턴스
 * @param eventFn 이벤트와 관련된 함수.
 *    예를 들어 템플릿 함수, 라이프사이클 훅 또는 출력 리스너.
 *    값은 실행 컨텍스트에 따라 다릅니다.
 * @returns
 */
export const profiler: Profiler = function (event, instance = null, eventFn) {
  if (profilerCallback != null /* both `null` and `undefined` */) {
    profilerCallback(event, instance, eventFn);
  }
};
