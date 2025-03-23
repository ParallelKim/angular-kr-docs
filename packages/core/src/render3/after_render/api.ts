/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * `afterRender` 또는 `afterNextRender` 콜백을 실행할 단계입니다.
 *
 * 동일한 단계의 콜백은 등록된 순서대로 실행됩니다. 단계는 각 렌더링 후 다음과 같은 순서로 실행됩니다:
 *
 *   1. `AfterRenderPhase.EarlyRead`
 *   2. `AfterRenderPhase.Write`
 *   3. `AfterRenderPhase.MixedReadWrite`
 *   4. `AfterRenderPhase.Read`
 *
 * Angular는 단계가 올바르게 사용되고 있는지 확인하거나 강제할 수 없으며, 대신 각 개발자가 각 값에 대해 문서화된 지침을 따르고 적절한 값을 신중하게 선택하며 필요할 경우 코드를 리팩토링하기를 기대합니다. 이렇게 함으로써 Angular는 수동 DOM 접근과 관련된 성능 저하를 최소화하고, 애플리케이션 또는 라이브러리의 최종 사용자에게 최상의 경험을 보장할 수 있습니다.
 *
 * @deprecated 콜백이 실행되는 단계를 지정하려면 `afterRender` 또는 `afterNextRender`에 함수 대신 스펙 객체를 첫 번째 매개변수로 전달하십시오.
 */
export enum AfterRenderPhase {
  /**
   * 후속 `AfterRenderPhase.Write` 콜백 전에 DOM에서 **읽기**만 필요한 콜백에 대해 `AfterRenderPhase.EarlyRead`를 사용하십시오. 예를 들어 브라우저에서 기본적으로 지원하지 않는 사용자 지정 레이아웃을 수행할 수 있습니다. 읽기가 쓰기 단계 이후로 기다릴 수 있는 경우에는 `AfterRenderPhase.EarlyRead` 단계를 선호하십시오.
   * 이 단계에서 DOM에 **쓰기**를 하지 마십시오.
   *
   * <div class="docs-alert docs-alert-important">
   *
   * 이 값을 사용하면 성능이 저하될 수 있습니다.
   * 대신 가능한 경우 기본 브라우저 기능을 사용하는 것을 선호하십시오.
   *
   * </div>
   */
  EarlyRead,

  /**
   * DOM에만 **쓰기**를 하는 콜백에 대해 `AfterRenderPhase.Write`를 사용하십시오. 이 단계에서 DOM에서 **읽기**를 하지 마십시오.
   */
  Write,

  /**
   * 리팩토링되지 않고 DOM에서 읽거나 쓸 콜백에 대해서는 `AfterRenderPhase.MixedReadWrite`를 사용하십시오. 작업을 다른 단계로 나눌 수 있는 경우에는 이 단계를 사용하지 마십시오.
   *
   * <div class="docs-alert docs-alert-critical">
   *
   * 이 값을 사용하면 성능이 **상당히** 저하될 수 있습니다.
   * 대신 적절한 단계 콜백으로 작업을 나누는 것을 선호하십시오.
   *
   * </div>
   */
  MixedReadWrite,

  /**
   * DOM에서 **읽기**만 하는 콜백에 대해 `AfterRenderPhase.Read`를 사용하십시오. 이 단계에서 DOM에 **쓰기**를 하지 마십시오.
   */
  Read,
}

/**
 * 렌더링 후 실행되는 콜백입니다.
 *
 * @developerPreview
 */
export interface AfterRenderRef {
  /**
   * 콜백을 종료하여 다시 호출되지 않도록 합니다.
   */
  destroy(): void;
}
