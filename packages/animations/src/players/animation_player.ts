/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * 이 소스 코드의 사용은 https://angular.dev/license 에 있는 MIT 스타일 라이센스에 의해 규제됩니다.
 */

/**
 * 재사용 가능한 애니메이션 시퀀스의 프로그래밍적 제어를 제공합니다,
 * <code>[AnimationBuilder.build](api/animations/AnimationBuilder#build)()</code>
 * 메서드를 사용하여 구축되며, 이는 `AnimationFactory`를 반환하고,
 * <code>[create](api/animations/AnimationFactory#create)()</code> 메서드는 이 인터페이스를 인스턴스화하고
 * 초기화합니다.
 *
 * @see {@link AnimationBuilder}
 * @see {@link AnimationFactory}
 * @see {@link animate}
 *
 * @publicApi
 */
export interface AnimationPlayer {
  /**
   * 애니메이션이 완료될 때 호출할 콜백을 제공합니다.
   * @param fn 콜백 함수.
   * @see {@link #finish}
   */
  onDone(fn: () => void): void;
  /**
   * 애니메이션이 시작될 때 호출할 콜백을 제공합니다.
   * @param fn 콜백 함수.
   * @see {@link #play}
   */
  onStart(fn: () => void): void;
  /**
   * 애니메이션이 파괴된 후 호출할 콜백을 제공합니다.
   * @param fn 콜백 함수.
   * @see {@link #destroy}
   * @see {@link #beforeDestroy}
   */
  onDestroy(fn: () => void): void;
  /**
   * 애니메이션을 초기화합니다.
   */
  init(): void;
  /**
   * 애니메이션이 시작되었는지 여부를 보고합니다.
   * @returns 애니메이션이 시작되었으면 true, 아니면 false.
   */
  hasStarted(): boolean;
  /**
   * 애니메이션을 실행하고, `onStart()` 콜백을 호출합니다.
   */
  play(): void;
  /**
   * 애니메이션을 일시 중지합니다.
   */
  pause(): void;
  /**
   * 일시 중지된 애니메이션을 재시작합니다.
   */
  restart(): void;
  /**
   * 애니메이션을 종료하고, `onDone()` 콜백을 호출합니다.
   */
  finish(): void;
  /**
   * 애니메이션을 파괴하고, `beforeDestroy()` 콜백을 호출한 후.
   * 파괴가 완료되면 `onDestroy()` 콜백을 호출합니다.
   */
  destroy(): void;
  /**
   * 애니메이션을 초기 상태로 재설정합니다.
   */
  reset(): void;
  /**
   * 애니메이션의 위치를 설정합니다.
   * @param position 진행 상황을 나타내는 분수 값.
   */
  setPosition(position: number): void;
  /**
   * 애니메이션의 현재 위치를 보고합니다.
   * @returns 애니메이션을 통한 진행 상황을 나타내는 분수 값.
   */
  getPosition(): number;
  /**
   * 이 플레이어의 부모, 있다면.
   */
  parentPlayer: AnimationPlayer | null;
  /**
   * 애니메이션의 전체 실행 시간, 밀리초 단위.
   */
  readonly totalTime: number;
  /**
   * 애니메이션이 파괴되기 전에 호출할 콜백을 제공합니다.
   */
  beforeDestroy?: () => any;
  /**
   * @internal
   * 내부
   */
  triggerCallback?: (phaseName: string) => void;
  /**
   * @internal
   * 내부
   */
  disabled?: boolean;
}

/**
 * 재사용 가능한 애니메이션을 위한 빈 프로그래밍 컨트롤러.
 * 애니메이션이 비활성화되어 있을 때 내부적으로 사용하여
 * 애니메이션 플레이어가 예상될 때 null 케이스를 확인하는 것을 피합니다.
 *
 * @see {@link animate}
 * @see {@link AnimationPlayer}
 *
 * @publicApi
 */
export class NoopAnimationPlayer implements AnimationPlayer {
  private _onDoneFns: Function[] = [];
  private _onStartFns: Function[] = [];
  private _onDestroyFns: Function[] = [];
  private _originalOnDoneFns: Function[] = [];
  private _originalOnStartFns: Function[] = [];
  private _started = false;
  private _destroyed = false;
  private _finished = false;
  private _position = 0;
  public parentPlayer: AnimationPlayer | null = null;
  public readonly totalTime: number;
  constructor(duration: number = 0, delay: number = 0) {
    this.totalTime = duration + delay;
  }
  private _onFinish() {
    if (!this._finished) {
      this._finished = true;
      this._onDoneFns.forEach((fn) => fn());
      this._onDoneFns = [];
    }
  }
  onStart(fn: () => void): void {
    this._originalOnStartFns.push(fn);
    this._onStartFns.push(fn);
  }
  onDone(fn: () => void): void {
    this._originalOnDoneFns.push(fn);
    this._onDoneFns.push(fn);
  }
  onDestroy(fn: () => void): void {
    this._onDestroyFns.push(fn);
  }
  hasStarted(): boolean {
    return this._started;
  }
  init(): void {}
  play(): void {
    if (!this.hasStarted()) {
      this._onStart();
      this.triggerMicrotask();
    }
    this._started = true;
  }

  /** @internal */
  triggerMicrotask() {
    queueMicrotask(() => this._onFinish());
  }

  private _onStart() {
    this._onStartFns.forEach((fn) => fn());
    this._onStartFns = [];
  }

  pause(): void {}
  restart(): void {}
  finish(): void {
    this._onFinish();
  }
  destroy(): void {
    if (!this._destroyed) {
      this._destroyed = true;
      if (!this.hasStarted()) {
        this._onStart();
      }
      this.finish();
      this._onDestroyFns.forEach((fn) => fn());
      this._onDestroyFns = [];
    }
  }
  reset(): void {
    this._started = false;
    this._finished = false;
    this._onStartFns = this._originalOnStartFns;
    this._onDoneFns = this._originalOnDoneFns;
  }
  setPosition(position: number): void {
    this._position = this.totalTime ? position * this.totalTime : 1;
  }
  getPosition(): number {
    return this.totalTime ? this._position / this.totalTime : 1;
  }

  /** @internal */
  triggerCallback(phaseName: string): void {
    const methods = phaseName == 'start' ? this._onStartFns : this._onDoneFns;
    methods.forEach((fn) => fn());
    methods.length = 0;
  }
}
