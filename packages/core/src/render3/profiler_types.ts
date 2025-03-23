/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// Note: ideally we would roll these types into the `profiler.ts`. During the update to TS 5.5
// they had to be moved out into a separate file, because `@microsoft/api-extractor` was throwing
// an error saying `Unable to follow symbol for "Profiler"`.

/**
 * Profiler events은 프로파일러가 애플리케이션 생명주기 전체에서 호출된 사용자 코드를 구별하는 데 사용하는 열거형입니다.
 */
export const enum ProfilerEvent {
  /**
   * `RenderFlags.Create`로 구성 요소의 템플릿 함수를 런타임이 호출하기 전 시점에 해당합니다.
   */
  TemplateCreateStart,

  /**
   * `RenderFlags.Create`로 구성 요소의 템플릿 함수를 런타임이 호출한 후 시점에 해당합니다.
   */
  TemplateCreateEnd,

  /**
   * `RenderFlags.Update`로 구성 요소의 템플릿 함수를 런타임이 호출하기 전 시점에 해당합니다.
   */
  TemplateUpdateStart,

  /**
   * `RenderFlags.Update`로 구성 요소의 템플릿 함수를 런타임이 호출한 후 시점에 해당합니다.
   */
  TemplateUpdateEnd,

  /**
   * 구성 요소 또는 지시문의 생명주기 훅을 런타임이 호출하기 전 시점에 해당합니다.
   */
  LifecycleHookStart,

  /**
   * 구성 요소 또는 지시문의 생명주기 훅을 런타임이 호출한 후 시점에 해당합니다.
   */
  LifecycleHookEnd,

  /**
   * 이벤트 또는 출력을 연결된 표현식을 런타임이 평가하기 전 시점에 해당합니다.
   */
  OutputStart,

  /**
   * 이벤트 또는 출력을 연결된 표현식을 런타임이 평가한 후 시점에 해당합니다.
   */
  OutputEnd,

  /**
   * 애플리케이션 부트스트랩 바로 직전 시점에 해당합니다.
   */
  BootstrapApplicationStart,

  /**
   * 애플리케이션 부트스트랩 후 시점에 해당합니다.
   */
  BootstrapApplicationEnd,

  /**
   * 루트 구성 요소의 부트스트랩 직전 시점에 해당합니다.
   */
  BootstrapComponentStart,

  /**
   * 루트 구성 요소의 부트스트랩 후 시점에 해당합니다.
   */
  BootstrapComponentEnd,

  /**
   * Angular가 변경 감지 틱을 시작하기 직전 시점에 해당합니다.
   */
  ChangeDetectionStart,

  /**
   * Angular가 변경 감지 틱을 종료한 후 시점에 해당합니다.
   */
  ChangeDetectionEnd,

  /**
   * Angular가 변경 감지 틱의 새로운 동기화 패스를 시작하기 직전 시점에 해당합니다.
   */
  ChangeDetectionSyncStart,

  /**
   * Angular가 동기화 패스를 종료한 후 시점에 해당합니다.
   */
  ChangeDetectionSyncEnd,

  /**
   * Angular가 렌더 후 훅을 실행하기 직전 시점에 해당합니다.
   */
  AfterRenderHooksStart,

  /**
   * Angular가 렌더 후 훅을 실행한 후 시점에 해당합니다.
   */
  AfterRenderHooksEnd,

  /**
   * Angular가 구성 요소를 처리하기 시작하기 직전 시점에 해당합니다 (생성 또는 업데이트).
   */
  ComponentStart,

  /**
   * Angular가 구성 요소 처리를 완료한 후 시점에 해당합니다.
   */
  ComponentEnd,

  /**
   * 지연 블록이 상태 간 전환되기 직전 시점에 해당합니다.
   */
  DeferBlockStateStart,

  /**
   * 지연 블록이 상태 간 전환된 후 시점에 해당합니다.
   */
  DeferBlockStateEnd,

  /**
   * 구성 요소 인스턴스가 동적으로 생성되기 직전 시점에 해당합니다.
   */
  DynamicComponentStart,

  /**
   * 구성 요소 인스턴스가 동적으로 생성된 후 시점에 해당합니다.
   */
  DynamicComponentEnd,

  /**
   * 런타임이 지시문의 호스트 바인딩 함수를 호출하기 전 시점에 해당합니다.
   */
  HostBindingsUpdateStart,

  /**
   * 런타임이 지시문의 호스트 바인딩 함수를 호출한 후 시점에 해당합니다.
   */
  HostBindingsUpdateEnd,
}

/**
 * 런타임이 사용자 코드 전후에 호출하는 프로파일러 함수입니다.
 */
export interface Profiler {
  (event: ProfilerEvent, instance?: {} | null, eventFn?: Function): void;
}
