/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from '../../di/injection_token';

export const enum NotificationSource {
  // 다음 알림이 수신되면 애플리케이션 상태를 DOM과 동기화하기 위해 변경 감지가 실행되어야 합니다:
  // 이 작업은 변경 감지 중에 하위 트리를 탐색해야 함을 나타냅니다.
  MarkAncestorsForTraversal,
  // 구성 요소/지시자가 새로운 입력을 받습니다.
  SetInput,
  // 지연 블록 상태 업데이트는 상태를 완전히 렌더링하기 위해 변경 감지가 필요합니다.
  DeferBlockStateUpdate,
  // 디버깅 도구가 상태를 업데이트하고 변경 감지를 요청했습니다.
  DebugApplyChanges,
  // ChangeDetectorRef.markForCheck는 구성 요소가 더럽혀졌거나 새로 고침이 필요함을 나타냅니다.
  MarkForCheck,

  // 바인드된 리스너 콜백이 실행되며 위에서 발생하는 다른 알림 없이 상태를 업데이트할 수 있습니다.
  Listener,

  // 사용자 정의 요소는 때때로 직접 확인이 필요합니다.
  CustomElement,

  // 다음 알림은 뷰를 새로 고칠 필요는 없지만
  // 렌더 후크를 실행해야 합니다:
  // 렌더 후크는 스케줄러의 타이밍으로 실행될 것이 보장됩니다.
  RenderHook,
  // 뷰는 밖에서 생성되고 우리가 인식할 수 없는 방식으로 조작될 수 있습니다.
  // 뷰가 연결되면 Angular는 이제 그것에 대해 "알고" 있으며,
  // DOM이 변경되었을 수 있다고 알게 됩니다 (그리고 우리는
  // 렌더 후크를 실행해야 합니다). 연결된 뷰가 더럽혀져 있다면,
  // `MarkAncestorsForTraversal` 알림도 수신해야 합니다.
  ViewAttached,
  // DOM 제거가 발생할 때, 렌더 후크는 새로운
  // DOM 상태에 관심이 있을 수 있지만 새로 고칠 필요가 없습니다.
  // DOM 제거 후 변경 감지가 필요하다면,
  // 또 다른 알림이 수신되어야 합니다 (예: `markForCheck`).
  ViewDetachedFromDOM,
  // 애니메이션 적용은 새로운 DOM 상태를 초래할 수 있으며 렌더 후크를 다시 실행해야 합니다.
  AsyncAnimationsLoaded,
  // 대기 중인 작업이 공개 API를 통해 제거될 때 스케줄러에 알립니다.
  // 이는 안정성을 비동기로 만들어 다음 애플리케이션 틱까지 지연될 수 있도록 합니다.
  PendingTaskRemoved,
  // 뷰 트리 외부에서의 `effect()`가 더럽혀졌으며 실행이 필요할 수 있습니다.
  RootEffect,
  // 뷰 트리 내의 `effect()`가 더럽혀졌습니다.
  ViewEffect,
}

/**
 * 애플리케이션 상태 변경에 대해 `LView`가 알림을 받을 때 인젝터블 클래스입니다.
 */
export abstract class ChangeDetectionScheduler {
  abstract notify(source: NotificationSource): void;
  abstract runningTick: boolean;
}

/** zoneless가 provideZonelessChangeDetection()을 통해 활성화되었는지를 나타내는 토큰입니다. */
export const ZONELESS_ENABLED = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'Zoneless enabled' : '',
  {providedIn: 'root', factory: () => false},
);

/** `provideExperimentalZonelessChangeDetection`이 사용되었음을 나타내는 토큰입니다. */
export const PROVIDED_ZONELESS = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'Zoneless provided' : '',
  {providedIn: 'root', factory: () => false},
);

export const ZONELESS_SCHEDULER_DISABLED = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'scheduler disabled' : '',
);

// TODO(atscott): v19에서 제거합니다. 스케줄러는 runOutsideAngular로 완료되어야 합니다.
export const SCHEDULE_IN_ROOT_ZONE = new InjectionToken<boolean>(
  typeof ngDevMode === 'undefined' || ngDevMode ? 'run changes outside zone in root' : '',
);
