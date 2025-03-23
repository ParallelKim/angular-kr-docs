/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {DOCUMENT} from '@angular/common';
import {
  ANIMATION_MODULE_TYPE,
  Inject,
  inject,
  Injectable,
  Renderer2,
  RendererFactory2,
  RendererType2,
  ViewEncapsulation,
  ɵAnimationRendererType as AnimationRendererType,
  ɵRuntimeError as RuntimeError,
} from '@angular/core';

import {AnimationMetadata, AnimationOptions, sequence} from './animation_metadata';
import {RuntimeErrorCode} from './errors';
import {AnimationPlayer} from './players/animation_player';

/**
 * Angular 컴포넌트 또는 지시문 내에서 프로그래밍 방식으로 애니메이션 시퀀스를 생성하는 주입 가능한 서비스입니다.
 * `BrowserAnimationsModule` 또는 `NoopAnimationsModule`에서 제공됩니다.
 *
 * @usageNotes
 *
 * 이 서비스를 사용하려면 컴포넌트나 지시문에 종속성으로 추가하십시오.
 * 서비스는 컴포넌트와 함께 인스턴스화됩니다.
 *
 * 앱은 일반적으로 자체 애니메이션 플레이어를 생성할 필요는 없지만,
 * 필요한 경우 다음 단계를 따르세요:
 *
 * 1. <code>[AnimationBuilder.build](api/animations/AnimationBuilder#build)()</code> 메서드를 사용하여 프로그래밍 방식의 애니메이션을 생성합니다. 해당 메서드는 `AnimationFactory` 인스턴스를 반환합니다.
 *
 * 2. 팩토리 객체를 사용하여 `AnimationPlayer`를 생성하고 DOM 요소에 연결합니다.
 *
 * 3. 플레이어 객체를 사용하여 애니메이션을 프로그래밍 방식으로 제어합니다.
 *
 * 예를 들어:
 *
 * ```ts
 * // BrowserAnimationsModule에서 서비스를 가져옵니다.
 * import {AnimationBuilder} from '@angular/animations';
 * // 서비스를 종속성으로 요구합니다.
 * class MyCmp {
 *   constructor(private _builder: AnimationBuilder) {}
 *
 *   makeAnimation(element: any) {
 *     // 먼저 재사용 가능한 애니메이션을 정의합니다.
 *     const myAnimation = this._builder.build([
 *       style({ width: 0 }),
 *       animate(1000, style({ width: '100px' }))
 *     ]);
 *
 *     // 반환된 팩토리 객체를 사용하여 플레이어를 생성합니다.
 *     const player = myAnimation.create(element);
 *
 *     player.play();
 *   }
 * }
 * ```
 *
 * @publicApi
 */
@Injectable({providedIn: 'root', useFactory: () => inject(BrowserAnimationBuilder)})
export abstract class AnimationBuilder {
  /**
   * 정의된 애니메이션을 생성하기 위한 팩토리를 빌드합니다.
   * @param animation 재사용 가능한 애니메이션 정의입니다.
   * @returns 정의된 애니메이션을 위한 플레이어를 생성할 수 있는 팩토리 객체입니다.
   * @see {@link animate}
   */
  abstract build(animation: AnimationMetadata | AnimationMetadata[]): AnimationFactory;
}

/**
 * <code>[AnimationBuilder.build](api/animations/AnimationBuilder#build)()</code>
 * 메서드에서 반환된 팩토리 객체입니다.
 *
 * @publicApi
 */
export abstract class AnimationFactory {
  /**
   * 이 팩토리를 생성한 <code>[AnimationBuilder.build](api/animations/AnimationBuilder#build)()</code>
   * 메서드에서 정의한 재사용 가능한 애니메이션에 대한 `AnimationPlayer` 인스턴스를 생성하고
   * 새로운 플레이어를 DOM 요소에 연결합니다.
   *
   * @param element 플레이어를 연결할 DOM 요소입니다.
   * @param options 시간 지연 및 추가 개발자 정의 매개변수를 포함할 수 있는 옵션 세트입니다.
   */
  abstract create(element: any, options?: AnimationOptions): AnimationPlayer;
}

@Injectable({providedIn: 'root'})
export class BrowserAnimationBuilder extends AnimationBuilder {
  private animationModuleType = inject(ANIMATION_MODULE_TYPE, {optional: true});
  private _nextAnimationId = 0;
  private _renderer: Renderer2;

  constructor(rootRenderer: RendererFactory2, @Inject(DOCUMENT) doc: Document) {
    super();
    const typeData: RendererType2 = {
      id: '0',
      encapsulation: ViewEncapsulation.None,
      styles: [],
      data: {animation: []},
    };
    this._renderer = rootRenderer.createRenderer(doc.body, typeData);

    if (this.animationModuleType === null && !isAnimationRenderer(this._renderer)) {
      // 이 AnimationBuilder의 경우 AnimationRenderer 및 DynamicDelegationRenderer만 지원합니다.

      throw new RuntimeError(
        RuntimeErrorCode.BROWSER_ANIMATION_BUILDER_INJECTED_WITHOUT_ANIMATIONS,
        (typeof ngDevMode === 'undefined' || ngDevMode) &&
          'Angular는 `AnimationBuilder`가 주입되었으나 애니메이션 지원이 활성화되지 않았다는 것을 감지했습니다. ' +
            '애플리케이션에서 `provideAnimations()` 또는 `provideAnimationsAsync()` 함수를 호출하여 애니메이션을 활성화했는지 확인하세요.',
      );
    }
  }

  override build(animation: AnimationMetadata | AnimationMetadata[]): AnimationFactory {
    const id = this._nextAnimationId;
    this._nextAnimationId++;
    const entry = Array.isArray(animation) ? sequence(animation) : animation;
    issueAnimationCommand(this._renderer, null, id, 'register', [entry]);
    return new BrowserAnimationFactory(id, this._renderer);
  }
}

class BrowserAnimationFactory extends AnimationFactory {
  constructor(
    private _id: number,
    private _renderer: Renderer2,
  ) {
    super();
  }

  override create(element: any, options?: AnimationOptions): AnimationPlayer {
    return new RendererAnimationPlayer(this._id, element, options || {}, this._renderer);
  }
}

class RendererAnimationPlayer implements AnimationPlayer {
  public parentPlayer: AnimationPlayer | null = null;
  private _started = false;

  constructor(
    public id: number,
    public element: any,
    options: AnimationOptions,
    private _renderer: Renderer2,
  ) {
    this._command('create', options);
  }

  private _listen(eventName: string, callback: (event: any) => any): () => void {
    return this._renderer.listen(this.element, `@@${this.id}:${eventName}`, callback);
  }

  private _command(command: string, ...args: any[]): void {
    issueAnimationCommand(this._renderer, this.element, this.id, command, args);
  }

  onDone(fn: () => void): void {
    this._listen('done', fn);
  }

  onStart(fn: () => void): void {
    this._listen('start', fn);
  }

  onDestroy(fn: () => void): void {
    this._listen('destroy', fn);
  }

  init(): void {
    this._command('init');
  }

  hasStarted(): boolean {
    return this._started;
  }

  play(): void {
    this._command('play');
    this._started = true;
  }

  pause(): void {
    this._command('pause');
  }

  restart(): void {
    this._command('restart');
  }

  finish(): void {
    this._command('finish');
  }

  destroy(): void {
    this._command('destroy');
  }

  reset(): void {
    this._command('reset');
    this._started = false;
  }

  setPosition(p: number): void {
    this._command('setPosition', p);
  }

  getPosition(): number {
    return unwrapAnimationRenderer(this._renderer)?.engine?.players[this.id]?.getPosition() ?? 0;
  }

  public totalTime = 0;
}

function issueAnimationCommand(
  renderer: Renderer2,
  element: any,
  id: number,
  command: string,
  args: any[],
): void {
  renderer.setProperty(element, `@@${id}:${command}`, args);
}

/**
 * 다음 2개의 메서드는 올바른 유형(애니메이션 렌더러 &
 * 동적 위임 렌더러)을 참조할 수 없으므로 가져오기 사이클을 생성합니다.
 */

function unwrapAnimationRenderer(
  renderer: Renderer2,
): {engine: {players: AnimationPlayer[]}} | null {
  const type = (renderer as unknown as {ɵtype: AnimationRendererType}).ɵtype;
  if (type === AnimationRendererType.Regular) {
    return renderer as any;
  } else if (type === AnimationRendererType.Delegated) {
    return (renderer as any).animationRenderer;
  }

  return null;
}

function isAnimationRenderer(renderer: Renderer2): boolean {
  const type = (renderer as unknown as {ɵtype: AnimationRendererType}).ɵtype;
  return type === AnimationRendererType.Regular || type === AnimationRendererType.Delegated;
}
