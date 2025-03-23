/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * 이 소스 코드는 https://angular.dev/license 에 있는 LICENSE 파일에서 확인할 수 있는 MIT 스타일의 라이센스에 의해 관리됩니다.
 */

/**
 * 이 클래스의 인스턴스는 애니메이션의 시작 또는 완료 단계에서 애니메이션 콜백이 캡처될 때 이벤트 매개변수로 반환됩니다.
 *
 * ```ts
 * @Component({
 *   host: {
 *     '[@myAnimationTrigger]': 'someExpression',
 *     '(@myAnimationTrigger.start)': 'captureStartEvent($event)',
 *     '(@myAnimationTrigger.done)': 'captureDoneEvent($event)',
 *   },
 *   animations: [
 *     trigger("myAnimationTrigger", [
 *        // ...
 *     ])
 *   ]
 * })
 * class MyComponent {
 *   someExpression: any = false;
 *   captureStartEvent(event: AnimationEvent) {
 *     // toState, fromState 및 totalTime 데이터는 이벤트 변수에서 접근할 수 있습니다.
 *   }
 *
 *   captureDoneEvent(event: AnimationEvent) {
 *     // toState, fromState 및 totalTime 데이터는 이벤트 변수에서 접근할 수 있습니다.
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export interface AnimationEvent {
  /**
   * 애니메이션이 시작되는 상태의 이름.
   */
  fromState: string;
  /**
   * 애니메이션이 완료되는 상태의 이름.
   */
  toState: string;
  /**
   * 애니메이션이 완료되는 데 걸리는 시간(밀리초).
   */
  totalTime: number;
  /**
   * 콜백이 호출된 애니메이션 단계로, "start" 또는 "done" 중 하나입니다.
   */
  phaseName: string;
  /**
   * 애니메이션이 연결된 요소.
   */
  element: any;
  /**
   * 내부.
   */
  triggerName: string;
  /**
   * 내부.
   */
  disabled: boolean;
}
