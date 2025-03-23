/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from '../di/injection_token';

/** 추적 프레임워크에서 지원하는 작업. */
export enum TracingAction {
  CHANGE_DETECTION,
  AFTER_NEXT_RENDER,
}

/** 단일 추적 스냅샷. */
export interface TracingSnapshot {
  run<T>(action: TracingAction, fn: () => T): T;

  /** 추적 스냅샷을 처리합니다. TracingSnapshot 당 정확히 한 번 실행되어야 합니다. */
  dispose(): void;
}

/**
 * `TracingService`에 대한 주입 토큰, 선택적으로 제공됩니다.
 */
export const TracingService = new InjectionToken<TracingService<TracingSnapshot>>(
  ngDevMode ? 'TracingService' : '',
);

/**
 * 원인(스냅샷)과 후속 작업 실행을 연결할 수 있는 추적 메커니즘.
 *
 * Angular에 의해 직접 정의되지 않지만 추적이 원하는 컨텍스트에서 정의됩니다.
 */
export interface TracingService<T extends TracingSnapshot> {
  /**
   * Angular에 의해 저장되고 이 컨텍스트에서 예약된 추가 작업이 수행될 때 사용될
   * 현재 컨텍스트의 스냅샷을 가져옵니다.
   *
   * @param linkedSnapshot 현재 컨텍스트에 연결할 선택적 스냅샷입니다.
   * 호출자는 더 이상 linkedSnapshot에 대해 dispose를 호출할 책임이 없습니다.
   *
   * @return 추적 스냅샷입니다. 호출자가 스냅샷을 처리할 책임이 있습니다.
   */
  snapshot(linkedSnapshot: T | null): T;

  /**
   * 추적을 위한 프레임워크에서 바인딩된 이벤트 리스너를 래핑합니다.
   * @param element 이벤트가 바인딩된 요소입니다.
   * @param eventName 이벤트의 이름입니다.
   * @param handler 이벤트 핸들러입니다.
   * @return 원래의 핸들러 대신 바인딩될 새 이벤트 핸들러입니다.
   */
  wrapEventListener?<T extends Function>(element: HTMLElement, eventName: string, handler: T): T;
}
