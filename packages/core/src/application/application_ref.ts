/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import '../util/ng_jit_mode';
import '../util/ng_server_mode';

import {
  setActiveConsumer,
  setThrowInvalidWriteToSignalError,
} from '@angular/core/primitives/signals';
import {Observable, Subject, Subscription} from 'rxjs';
import {map} from 'rxjs/operators';

import {ZONELESS_ENABLED} from '../change_detection/scheduling/zoneless_scheduling';
import {Console} from '../console';
import {inject} from '../di';
import {Injectable} from '../di/injectable';
import {InjectionToken} from '../di/injection_token';
import {Injector} from '../di/injector';
import {EnvironmentInjector, type R3Injector} from '../di/r3_injector';
import {formatRuntimeError, RuntimeError, RuntimeErrorCode} from '../errors';
import {ErrorHandler, INTERNAL_APPLICATION_ERROR_HANDLER} from '../error_handler';
import {Type} from '../interface/type';
import {ComponentFactory, ComponentRef} from '../linker/component_factory';
import {ComponentFactoryResolver} from '../linker/component_factory_resolver';
import {NgModuleRef} from '../linker/ng_module_factory';
import {ViewRef} from '../linker/view_ref';
import {PendingTasksInternal} from '../pending_tasks';
import {RendererFactory2} from '../render/api';
import {AfterRenderManager} from '../render3/after_render/manager';
import {ComponentFactory as R3ComponentFactory} from '../render3/component_ref';
import {isStandalone} from '../render3/def_getters';
import {ChangeDetectionMode, detectChangesInternal} from '../render3/instructions/change_detection';
import {LView} from '../render3/interfaces/view';
import {publishDefaultGlobalUtils as _publishDefaultGlobalUtils} from '../render3/util/global_utils';
import {requiresRefreshOrTraversal} from '../render3/util/view_utils';
import {ViewRef as InternalViewRef} from '../render3/view_ref';
import {TESTABILITY} from '../testability/testability';
import {NgZone} from '../zone/ng_zone';

import {profiler} from '../render3/profiler';
import {ProfilerEvent} from '../render3/profiler_types';
import {EffectScheduler} from '../render3/reactivity/root_effect_scheduler';
import {ApplicationInitStatus} from './application_init';
import {TracingAction, TracingService, TracingSnapshot} from './tracing';

/**
 * 부트스트랩된 모든 컴포넌트에 대해 호출될 콜백의 집합을 제공하는 DI 토큰입니다.
 *
 * 각 콜백은 `ComponentRef` 인스턴스를 받고 아무 것도 반환하지 않아야 합니다.
 *
 * `(componentRef: ComponentRef) => void`
 *
 * @publicApi
 */
export const APP_BOOTSTRAP_LISTENER = new InjectionToken<
  ReadonlyArray<(compRef: ComponentRef<any>) => void>
>(ngDevMode ? 'appBootstrapListener' : '');

export function publishDefaultGlobalUtils() {
  ngDevMode && _publishDefaultGlobalUtils();
}

/**
 * 신호에 대한 잘못된 쓰기의 오류를 Angular `RuntimeError`로 설정합니다.
 */
export function publishSignalConfiguration(): void {
  setThrowInvalidWriteToSignalError(() => {
    throw new RuntimeError(
      RuntimeErrorCode.SIGNAL_WRITE_FROM_ILLEGAL_CONTEXT,
      ngDevMode && '`computed`에서 신호에 쓰는 것은 허용되지 않습니다.',
    );
  });
}

export function isBoundToModule<C>(cf: ComponentFactory<C>): boolean {
  return (cf as R3ComponentFactory<C>).isBoundToModule;
}

/**
 * NgProbe에 자신을 등록할 수 있는 서드파티 컴포넌트용 토큰입니다.
 *
 * @deprecated
 * @publicApi
 */
export class NgProbeToken {
  constructor(
    public name: string,
    public token: any,
  ) {}
}

/**
 * 부트스트랩 프로세스에 추가 옵션을 제공합니다.
 *
 * @publicApi
 */
export interface BootstrapOptions {
  /**
   * 제공자에서 구성되지 않은 경우 사용할 `NgZone`을 선택적으로 지정합니다.
   *
   * - 자체 `NgZone` 인스턴스를 제공합니다.
   * - `zone.js` - `Zone.js`가 필요한 기본 `NgZone`을 사용합니다.
   * - `noop` - 아무 작업도 수행하지 않는 `NoopNgZone`을 사용합니다.
   */
  ngZone?: NgZone | 'zone.js' | 'noop';

  /**
   * 이벤트 변경 감지를 병합할지 여부를 선택적으로 지정합니다.
   * 다음과 같은 경우를 고려하십시오.
   *
   * ```html
   * <div (click)="doSomething()">
   *   <button (click)="doSomethingElse()"></button>
   * </div>
   * ```
   *
   * 버튼을 클릭하면 이벤트 버블링 때문에 두 개의 이벤트 핸들러가 호출되고 2개의 변경 감지가 트리거됩니다.
   * 우리는 이런 종류의 이벤트를 병합하여 변경 감지가 한 번만 트리거되도록 할 수 있습니다.
   *
   * 기본적으로 이 옵션은 false로 설정됩니다. 따라서 이벤트는 병합되지 않고 변경 감지가 여러 번 트리거됩니다.
   * 이 옵션이 true로 설정되면 변경 감지는 애니메이션 프레임을 예약하여 비동기로 트리거됩니다. 따라서 위의 경우에서
   * 변경 감지는 한 번만 트리거됩니다.
   */
  ngZoneEventCoalescing?: boolean;

  /**
   * `NgZone#run()` 메서드 호출이 단일 변경 감지로 병합되어야 하는지 여부를 선택적으로 지정합니다.
   *
   * 다음 상황을 고려하십시오.
   * ```ts
   * for (let i = 0; i < 10; i ++) {
   *   ngZone.run(() => {
   *     // 무언가를 수행합니다
   *   });
   * }
   * ```
   *
   * 이 경우는 여러 번 변경 감지를 트리거합니다.
   * ngZoneRunCoalescing 옵션을 사용하면 이벤트 루프의 모든 변경 감지가 한 번만 트리거됩니다.
   * 또한 변경 감지는 requestAnimation에서 실행됩니다.
   *
   */
  ngZoneRunCoalescing?: boolean;

  /**
   * false로 설정하면 Angular가 템플릿을 새로 고칠 필요가 있다는 명확한 표시를 받으면 변경 감지가 예약됩니다. 이는 다음을 포함합니다:
   *
   * - `ChangeDetectorRef.markForCheck` 호출
   * - `ComponentRef.setInput` 호출
   * - 템플릿에서 읽는 신호 업데이트
   * - 더럽혀진 마크가 있는 뷰 부착
   * - 뷰 제거
   * - 렌더 후 훅 등록(렌더 훅이 위의 작업 중 하나를 수행해야만 템플릿이 새로 고쳐짐)
   *
   * @deprecated 이 옵션은 주의로 인해 도입되었습니다. 모니터링 결과, 이 기능은 의도한 대로 작동하며 이 옵션을 `true`로 설정하여 비활성화되어서는 안 된다고 판단했습니다.
   */
  ignoreChangesOutsideZone?: boolean;
}

/** ApplicationRef가 단일 틱에서 모든 부착된 뷰를 새로 고치는 최대 횟수. */
const MAXIMUM_REFRESH_RERUNS = 10;

export function optionsReducer<T extends Object>(dst: T, objs: T | T[]): T {
  if (Array.isArray(objs)) {
    return objs.reduce(optionsReducer, dst);
  }
  return {...dst, ...objs};
}

/**
 * 페이지에서 실행 중인 Angular 애플리케이션에 대한 참조입니다.
 *
 * @usageNotes
 * ### isStable 예제 및 주의사항
 *
 * 다음과 같이 `isStable`에 대한 두 가지 중요한 사항이 있습니다:
 * - 애플리케이션 시작 시 반복 비동기 작업을 시작하면 애플리케이션은 절대 안정적이지 않습니다
 * (예를 들어 `setInterval`, `setTimeout`으로 시작된 폴링 프로세스 또는 `interval`과 같은 RxJS 연산자를 사용).
 * - `isStable` Observable은 Angular 영역 외부에서 실행됩니다.
 *
 * 다음과 같이 반복 작업을 시작한다면
 * (여기서는 카운터를 증가시키는 RxJS `interval` 사용)
 * 그리고 동시에 `isStable`에 구독합니다.
 *
 * ```ts
 * constructor(appRef: ApplicationRef) {
 *   appRef.isStable.pipe(
 *      filter(stable => stable)
 *   ).subscribe(() => console.log('앱이 이제 안정적입니다.'));
 *   interval(1000).subscribe(counter => console.log(counter));
 * }
 * ```
 * 이 예제에서 `isStable`은 절대 `true`를 방출하지 않으며,
 * "앱이 이제 안정적입니다."라는 로그가 기록되지 않습니다.
 *
 * 앱이 안정적일 때 무언가를 실행하려면,
 * 폴링 프로세스를 시작하기 전에 애플리케이션이 안정적이 될 때까지 기다려야 합니다.
 *
 * ```ts
 * constructor(appRef: ApplicationRef) {
 *   appRef.isStable.pipe(
 *     first(stable => stable),
 *     tap(stable => console.log('앱이 이제 안정적입니다.')),
 *     switchMap(() => interval(1000))
 *   ).subscribe(counter => console.log(counter));
 * }
 * ```
 * 이 예제에서 "앱이 이제 안정적입니다."라는 로그가 기록되고
 * 카운터가 매초 증가하기 시작합니다.
 *
 * 또한 이 Observable은 Angular 영역 외부에서 실행되므로,
 * 이 Observable에 대한 구독의 코드는 변경 감지를 트리거하지 않습니다.
 *
 * 만약 카운터 값을 로그하는 대신,
 * 컴포넌트의 필드를 업데이트하고 이를 템플릿에 표시한다면.
 *
 * ```ts
 * constructor(appRef: ApplicationRef) {
 *   appRef.isStable.pipe(
 *     first(stable => stable),
 *     switchMap(() => interval(1000))
 *   ).subscribe(counter => this.value = counter);
 * }
 * ```
 * `isStable` Observable이 영역 외부에서 실행되므로,
 * `value` 필드는 제대로 업데이트되지만,
 * 템플릿은 새로 고쳐지지 않을 것입니다!
 *
 * 템플릿 업데이트를 위해 수동으로 변경 감지를 트리거해야 합니다.
 *
 * ```ts
 * constructor(appRef: ApplicationRef, cd: ChangeDetectorRef) {
 *   appRef.isStable.pipe(
 *     first(stable => stable),
 *     switchMap(() => interval(1000))
 *   ).subscribe(counter => {
 *     this.value = counter;
 *     cd.detectChanges();
 *   });
 * }
 * ```
 *
 * 또는 구독 콜백이 영역 내에서 실행되도록 만듭니다.
 *
 * ```ts
 * constructor(appRef: ApplicationRef, zone: NgZone) {
 *   appRef.isStable.pipe(
 *     first(stable => stable),
 *     switchMap(() => interval(1000))
 *   ).subscribe(counter => zone.run(() => this.value = counter));
 * }
 * ```
 *
 * @publicApi
 */
@Injectable({providedIn: 'root'})
export class ApplicationRef {
  /** @internal */
  _runningTick: boolean = false;
  private _destroyed = false;
  private _destroyListeners: Array<() => void> = [];
  /** @internal */
  _views: InternalViewRef<unknown>[] = [];
  private readonly internalErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
  private readonly afterRenderManager = inject(AfterRenderManager);
  private readonly zonelessEnabled = inject(ZONELESS_ENABLED);
  private readonly rootEffectScheduler = inject(EffectScheduler);

  /**
   * 여러 차원(뷰, 후속 렌더 훅 등)에서 애플리케이션의 현재 더러운 상태입니다.
   *
   * 여기서 설정된 플래그는 `tick()`이 실행될 때 불순성을 해결하려고 시도함을 의미합니다.
   *
   * @internal
   */
  dirtyFlags = ApplicationRefDirtyFlags.None;

  /**
   * `TracingService`의 가장 최근 스냅샷, 존재하는 경우입니다.
   *
   * 이 스냅샷은 `tick()`이 처음 예약될 때의 컨텍스트를 캡처하려고 시도합니다. 그런 다음 이 컨텍스트 내에서 실행됩니다.
   *
   * @internal
   */
  tracingSnapshot: TracingSnapshot | null = null;

  // ComponentFixture의 자동 감지 동작 마이그레이션 동안 임시로 필요합니다
  // Eventually the hostView of the fixture should just attach to ApplicationRef.
  private externalTestViews: Set<InternalViewRef<unknown>> = new Set();
  /** @internal */
  afterTick = new Subject<void>();
  /** @internal */
  get allViews(): Array<InternalViewRef<unknown>> {
    return [...this.externalTestViews.keys(), ...this._views];
  }

  /**
   * 이 인스턴스가 파괴되었는지 여부를 나타냅니다.
   */
  get destroyed() {
    return this._destroyed;
  }

  /**
   * 이 애플리케이션에 등록된 컴포넌트 유형의 목록을 가져옵니다.
   * 이 목록은 컴포넌트가 생성되기 전에도 채워집니다.
   */
  public readonly componentTypes: Type<any>[] = [];

  /**
   * 이 애플리케이션에 등록된 컴포넌트의 목록을 가져옵니다.
   */
  public readonly components: ComponentRef<any>[] = [];

  /**
   * 애플리케이션이 안정적이거나 불안정함을 나타내는 Observable을 반환합니다.
   */
  public readonly isStable: Observable<boolean> = inject(PendingTasksInternal).hasPendingTasks.pipe(
    map((pending) => !pending),
  );

  constructor() {
    // 추적 서비스를 주입하여 초기화합니다.
    inject(TracingService, {optional: true});
  }

  /**
   * @returns 애플리케이션이 안정적이 될 때 해결되는 약속입니다.
   */
  whenStable(): Promise<void> {
    let subscription: Subscription;
    return new Promise<void>((resolve) => {
      subscription = this.isStable.subscribe({
        next: (stable) => {
          if (stable) {
            resolve();
          }
        },
      });
    }).finally(() => {
      subscription.unsubscribe();
    });
  }

  private readonly _injector = inject(EnvironmentInjector);
  private _rendererFactory: RendererFactory2 | null = null;

  /**
   * 이 애플리케이션을 생성하는 데 사용되는 `EnvironmentInjector`입니다.
   */
  get injector(): EnvironmentInjector {
    return this._injector;
  }

  /**
   * 선택기로 식별된 요소에 컴포넌트를 부트스트랩하거나, 선택적으로 지정된 요소에 부트스트랩합니다.
   *
   * @usageNotes
   * ### 부트스트랩 프로세스
   *
   * 컴포넌트를 부트스트랩할 때 Angular는 이를 대상 DOM 요소에 마운트하고 자동 변경 감지를 시작합니다.
   * 대상 DOM 요소는 `rootSelectorOrNode` 인수를 사용하여 제공할 수 있습니다.
   *
   * 대상 DOM 요소가 제공되지 않으면 Angular는 부트스트랩되는 컴포넌트의 `selector`를 사용하여 페이지에서 하나를 찾으려고 시도합니다
   * (첫 번째로 일치하는 요소가 사용됩니다).
   *
   * ### 예제
   *
   * 일반적으로 부트스트랩할 컴포넌트는 `NgModule`의 `bootstrap` 배열에 정의하지만,
   * 이를 위해서는 애플리케이션 코드를 작성할 때 컴포넌트를 알아야 합니다.
   *
   * API 호출을 기다려야 컴포넌트를 부트스트랩해야 하는 상황을 상상해 보십시오.
   * `NgModule`의 `ngDoBootstrap` 훅을 사용하여 이 메서드를 호출하여
   * 동적으로 컴포넌트를 부트스트랩할 수 있습니다.
   *
   * {@example core/ts/platform/platform.ts region='componentSelector'}
   *
   * 선택적으로, 컴포넌트는 부트스트랩된 컴포넌트의 선택자와 일치하지 않는 DOM 요소에 마운트될 수 있습니다.
   *
   * 다음 예제에서는 대상 요소와 일치하는 CSS 선택기를 제공하고 있습니다.
   *
   * {@example core/ts/platform/platform.ts region='cssSelector'}
   *
   * 이 예제에서는 DOM 노드에 대한 참조를 제공합니다.
   *
   * {@example core/ts/platform/platform.ts region='domNode'}
   */
  bootstrap<C>(component: Type<C>, rootSelectorOrNode?: string | any): ComponentRef<C>;

  /**
   * 선택기로 식별된 요소에 컴포넌트를 부트스트랩하거나, 선택적으로 지정된 요소에 부트스트랩합니다.
   *
   * @usageNotes
   * ### 부트스트랩 프로세스
   *
   * 컴포넌트를 부트스트랩할 때 Angular는 이를 대상 DOM 요소에 마운트하고 자동 변경 감지를 시작합니다.
   * 대상 DOM 요소는 `rootSelectorOrNode` 인수를 사용하여 제공할 수 있습니다.
   *
   * 대상 DOM 요소가 제공되지 않으면 Angular는 부트스트랩되는 컴포넌트의 `selector`를 사용하여 페이지에서 하나를 찾으려고 시도합니다
   * (첫 번째로 일치하는 요소가 사용됩니다).
   *
   * ### 예제
   *
   * 일반적으로 부트스트랩할 컴포넌트는 `NgModule`의 `bootstrap` 배열에 정의하지만,
   * 이를 위해서는 애플리케이션 코드를 작성할 때 컴포넌트를 알아야 합니다.
   *
   * API 호출을 기다려야 컴포넌트를 부트스트랩해야 하는 상황을 상상해 보십시오.
   * `NgModule`의 `ngDoBootstrap` 훅을 사용하여 이 메서드를 호출하여
   * 동적으로 컴포넌트를 부트스트랩할 수 있습니다.
   *
   * {@example core/ts/platform/platform.ts region='componentSelector'}
   *
   * 선택적으로, 컴포넌트는 부트스트랩된 컴포넌트의 선택자와 일치하지 않는 DOM 요소에 마운트될 수 있습니다.
   *
   * 다음 예제에서는 대상 요소와 일치하는 CSS 선택기를 제공하고 있습니다.
   *
   * {@example core/ts/platform/platform.ts region='cssSelector'}
   *
   * 이 예제에서는 DOM 노드에 대한 참조를 제공합니다.
   *
   * {@example core/ts/platform/platform.ts region='domNode'}
   *
   * @deprecated 컴포넌트 팩토리를 `Application.bootstrap` 함수 인수로 전달하는 것이
   *     더 이상 지원되지 않습니다. 대신 컴포넌트 유형을 전달하십시오.
   */
  bootstrap<C>(
    componentFactory: ComponentFactory<C>,
    rootSelectorOrNode?: string | any,
  ): ComponentRef<C>;

  /**
   * 선택기로 식별된 요소에 컴포넌트를 부트스트랩하거나, 선택적으로 지정된 요소에 부트스트랩합니다.
   *
   * @usageNotes
   * ### 부트스트랩 프로세스
   *
   * 컴포넌트를 부트스트랩할 때 Angular는 이를 대상 DOM 요소에 마운트하고 자동 변경 감지를 시작합니다.
   * 대상 DOM 요소는 `rootSelectorOrNode` 인수를 사용하여 제공할 수 있습니다.
   *
   * 대상 DOM 요소가 제공되지 않으면 Angular는 부트스트랩되는 컴포넌트의 `selector`를 사용하여 페이지에서 하나를 찾으려고 시도합니다
   * (첫 번째로 일치하는 요소가 사용됩니다).
   *
   * ### 예제
   *
   * 일반적으로 부트스트랩할 컴포넌트는 `NgModule`의 `bootstrap` 배열에 정의하지만,
   * 이를 위해서는 애플리케이션 코드를 작성할 때 컴포넌트를 알아야 합니다.
   *
   * API 호출을 기다려야 컴포넌트를 부트스트랩해야 하는 상황을 상상해 보십시오.
   * `NgModule`의 `ngDoBootstrap` 훅을 사용하여 이 메서드를 호출하여
   * 동적으로 컴포넌트를 부트스트랩할 수 있습니다.
   *
   * {@example core/ts/platform/platform.ts region='componentSelector'}
   *
   * 선택적으로, 컴포넌트는 부트스트랩된 컴포넌트의 선택자와 일치하지 않는 DOM 요소에 마운트될 수 있습니다.
   *
   * 다음 예제에서는 대상 요소와 일치하는 CSS 선택기를 제공하고 있습니다.
   *
   * {@example core/ts/platform/platform.ts region='cssSelector'}
   *
   * 이 예제에서는 DOM 노드에 대한 참조를 제공합니다.
   *
   * {@example core/ts/platform/platform.ts region='domNode'}
   */
  bootstrap<C>(
    componentOrFactory: ComponentFactory<C> | Type<C>,
    rootSelectorOrNode?: string | any,
  ): ComponentRef<C> {
    profiler(ProfilerEvent.BootstrapComponentStart);

    (typeof ngDevMode === 'undefined' || ngDevMode) && warnIfDestroyed(this._destroyed);
    const isComponentFactory = componentOrFactory instanceof ComponentFactory;
    const initStatus = this._injector.get(ApplicationInitStatus);

    if (!initStatus.done) {
      let errorMessage = '';
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        const standalone = !isComponentFactory && isStandalone(componentOrFactory);
        errorMessage =
          '여전히 비동기 초기화기가 실행되고 있으므로 부트스트랩할 수 없습니다. ' +
          (standalone
            ? ''
            : ' 루트 모듈의 `ngDoBootstrap` 메서드에서 컴포넌트를 부트스트랩하십시오.');
      }
      throw new RuntimeError(RuntimeErrorCode.ASYNC_INITIALIZERS_STILL_RUNNING, errorMessage);
    }

    let componentFactory: ComponentFactory<C>;
    if (isComponentFactory) {
      componentFactory = componentOrFactory;
    } else {
      const resolver = this._injector.get(ComponentFactoryResolver);
      componentFactory = resolver.resolveComponentFactory(componentOrFactory)!;
    }
    this.componentTypes.push(componentFactory.componentType);

    // 현재 모듈에 연관된 팩토리를 생성하지만 다른 것에 바인딩되지 않았습니다.
    const ngModule = isBoundToModule(componentFactory)
      ? undefined
      : this._injector.get(NgModuleRef);
    const selectorOrNode = rootSelectorOrNode || componentFactory.selector;
    const compRef = componentFactory.create(Injector.NULL, [], selectorOrNode, ngModule);
    const nativeElement = compRef.location.nativeElement;
    const testability = compRef.injector.get(TESTABILITY, null);
    testability?.registerApplication(nativeElement);

    compRef.onDestroy(() => {
      this.detachView(compRef.hostView);
      remove(this.components, compRef);
      testability?.unregisterApplication(nativeElement);
    });

    this._loadComponent(compRef);
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      const _console = this._injector.get(Console);
      _console.log(`Angular가 개발 모드에서 실행되고 있습니다.`);
    }

    profiler(ProfilerEvent.BootstrapComponentEnd, compRef);

    return compRef;
  }

  /**
   * 변경 감지 및 그 부작용을 명시적으로 처리하려면 이 메서드를 호출합니다.
   *
   * 개발 모드에서 `tick()`은 추가 변경이 감지되지 않도록 두 번째 변경 감지 주기를 수행합니다. 이 두 번째 주기 동안 추가 변경이 감지되면,
   * 애플리케이션의 바인딩에 대해 단일 변경 감지 주기에서 해결할 수 없는 부작용이 발생합니다.
   * 이 경우 Angular는 오류를 발생시킵니다. Angular 애플리케이션은 모든 변경 감지가 완료되는 동안 단 하나의 변경 감지 패스만 가질 수 있습니다.
   */
  tick(): void {
    if (!this.zonelessEnabled) {
      this.dirtyFlags |= ApplicationRefDirtyFlags.ViewTreeGlobal;
    }
    this._tick();
  }

  /** @internal */
  _tick(): void {
    profiler(ProfilerEvent.ChangeDetectionStart);

    if (this.tracingSnapshot !== null) {
      // 가장 최근 스냅샷의 컨텍스트 내에서 `tickImpl()`이 항상 실행되도록 합니다,
      // 존재하는 경우에 대해서입니다. 스냅샷은 구현에 의해 참조 카운트될 수 있으므로
      // 요청한 스냅샷을 사용하도록 합니다.
      this.tracingSnapshot.run(TracingAction.CHANGE_DETECTION, this.tickImpl);
    } else {
      this.tickImpl();
    }
  }

  private tickImpl = (): void => {
    (typeof ngDevMode === 'undefined' || ngDevMode) && warnIfDestroyed(this._destroyed);
    if (this._runningTick) {
      throw new RuntimeError(
        RuntimeErrorCode.RECURSIVE_APPLICATION_REF_TICK,
        ngDevMode && 'ApplicationRef.tick이 재귀적으로 호출되었습니다.',
      );
    }

    const prevConsumer = setActiveConsumer(null);
    try {
      this._runningTick = true;
      this.synchronize();
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        for (let view of this.allViews) {
          view.checkNoChanges();
        }
      }
    } finally {
      this._runningTick = false;
      this.tracingSnapshot?.dispose();
      this.tracingSnapshot = null;
      setActiveConsumer(prevConsumer);
      this.afterTick.next();

      profiler(ProfilerEvent.ChangeDetectionEnd);
    }
  };

  /**
   * 애플리케이션 상태를 UI와 동기화하는 핵심 작업을 수행하고,
   * 모든 대기 중인 더러움을 해결합니다(상당히 루프에서).
   */
  private synchronize(): void {
    if (this._rendererFactory === null && !(this._injector as R3Injector).destroyed) {
      this._rendererFactory = this._injector.get(RendererFactory2, null, {optional: true});
    }

    let runs = 0;
    while (this.dirtyFlags !== ApplicationRefDirtyFlags.None && runs++ < MAXIMUM_REFRESH_RERUNS) {
      profiler(ProfilerEvent.ChangeDetectionSyncStart);
      this.synchronizeOnce();
      profiler(ProfilerEvent.ChangeDetectionSyncEnd);
    }

    if ((typeof ngDevMode === 'undefined' || ngDevMode) && runs >= MAXIMUM_REFRESH_RERUNS) {
      throw new RuntimeError(
        RuntimeErrorCode.INFINITE_CHANGE_DETECTION,
        ngDevMode &&
          '애플리케이션 뷰를 새로 고치는 동안 무한 변경 감지가 발생했습니다. ' +
            '템플릿 실행 중에 모든 뷰가 `markForCheck`를 호출하지 않거나, ' +
            'afterRender 훅이 항상 뷰를 검사하도록 설정되어 있는지 확인해주세요.',
      );
    }
  }

  /**
   * 단일 동기화 패스를 수행합니다.
   */
  private synchronizeOnce(): void {
    // 먼저, 더러운 루트 효과를 처리합니다.
    if (this.dirtyFlags & ApplicationRefDirtyFlags.RootEffects) {
      this.dirtyFlags &= ~ApplicationRefDirtyFlags.RootEffects;
      this.rootEffectScheduler.flush();
    }

    // 먼저 더러운 뷰를 확인합니다, 있다면.
    if (this.dirtyFlags & ApplicationRefDirtyFlags.ViewTreeAny) {
      // 뷰에 대한 변경 감지는 타겟 모드에서 시작됩니다
      // (더럽혀진 경우에만 컴포넌트를 확인) 그러나 글로벌 확인이
      // `ApplicationRef.tick()`과 같은 API를 통해 특별히 요청되는 경우에는 아닙니다.
      const useGlobalCheck = Boolean(this.dirtyFlags & ApplicationRefDirtyFlags.ViewTreeGlobal);

      // 뷰 관련 더러움을 지웁니다.
      this.dirtyFlags &= ~ApplicationRefDirtyFlags.ViewTreeAny;

      // 렌더 후 비트를 설정합니다. 뷰를 검사하고 렌더 후 훅을 실행해야 합니다.
      this.dirtyFlags |= ApplicationRefDirtyFlags.AfterRender;

      // 모든 잠재적으로 더러운 뷰를 확인합니다.
      for (let {_lView} of this.allViews) {
        detectChangesInViewIfRequired(_lView, useGlobalCheck, this.zonelessEnabled);
      }

      // `markForCheck()`가 뷰 검사 중에 호출된 경우, `ViewTreeCheck` 플래그를 설정했을 것입니다.
      // 이 플래그를 지우는 것은 호환성을 위해, 뷰 검사를 수행한다는 이유로,
      // 뷰를 재검사하지 않도록 했습니다.
      this.dirtyFlags &= ~ApplicationRefDirtyFlags.ViewTreeCheck;

      // 확인 후 여전히 더러운 뷰가 있는지 확인하고 루프를 다시 돌고,
      // 실행하기 전에 더럽혀진 루트 효과가 여전히 있는지 확인합니다.
      this.syncDirtyFlagsWithViews();
      if (
        this.dirtyFlags &
        (ApplicationRefDirtyFlags.ViewTreeAny | ApplicationRefDirtyFlags.RootEffects)
      ) {
        // 확인 후 여전히 더러운 뷰 또는 효과가 있으면 렌더
        // 훅을 실행하기 전에 루프를 다시 돌립니다.
        return;
      }
    } else {
      // 위에서 뷰를 새로 고치지 않았다면,
      // 여전히 플러시되지 않은 애니메이션이 있을 수 있으므로,
      // 뷰에서 `detectChangesInternal`을 호출하지 않습니다.
      this._rendererFactory?.begin?.();
      this._rendererFactory?.end?.();
    }

    // 더러운 뷰가 없더라도 afterRender 훅이 여전히 더럽혀진 상태일 수 있습니다.
    if (this.dirtyFlags & ApplicationRefDirtyFlags.AfterRender) {
      this.dirtyFlags &= ~ApplicationRefDirtyFlags.AfterRender;
      this.afterRenderManager.execute();

      // afterRender 훅은 더러운 플래그에 영향을 줄 수 있습니다.
    }
    this.syncDirtyFlagsWithViews();
  }

  /**
   * `allViews`에서 새로 고침/순회가 필요한 뷰를 확인하고,
   * 그에 따라 `dirtyFlags`를 업데이트합니다. 두 가지 잠재적 행동:
   *
   * 1. 뷰 중 어느 것이든 업데이트가 필요한 경우, `ViewTreeTraversal` 더러운 플래그가 추가됩니다.
   *    이는 비어 있어야 하며, 스케줄러는 뷰가 업데이트가 필요하다고 표시될 때 이미 플래그를 추가했어야 합니다.
   *
   *    TODO(alxhub): 이 행동이 여전히 엣지 케이스에 필요하다면 알아내기.
   *
   * 2. 뷰 중 어느 것도 업데이트가 필요하지 않은 경우,
   *    뷰 관련 `dirtyFlag`를 지웁니다. 이는 스케줄러가
   *    뷰가 더럽혀졌음을 알렸지만 뷰 자체가 우리의 뿌리에서 순회 가능하지 않을 때 발생합니다.
   */
  private syncDirtyFlagsWithViews(): void {
    if (this.allViews.some(({_lView}) => requiresRefreshOrTraversal(_lView))) {
      // 모든 afterRender 콜백을 실행한 후 새 뷰가 더럽혀진 경우, 루프를 다시 돌도록 합니다.
      this.dirtyFlags |= ApplicationRefDirtyFlags.ViewTreeTraversal;
      return;
    } else {
      // 이 플래그가 설정되어 있을 수 있지만, 우리의 뷰 중 어느 것도 순회가 필요하지 않으므로,
      // `ApplicationRef`는 반복된 확인이 필요하지 않습니다.
      this.dirtyFlags &= ~ApplicationRefDirtyFlags.ViewTreeAny;
    }
  }

  /**
   * 뷰를 부착하여 더러운 검사할 수 있도록 합니다.
   * 뷰는 파괴될 때 자동으로 분리됩니다.
   * 뷰가 이미 ViewContainer에 부착되어 있으면 예외가 발생합니다.
   */
  attachView(viewRef: ViewRef): void {
    (typeof ngDevMode === 'undefined' || ngDevMode) && warnIfDestroyed(this._destroyed);
    const view = viewRef as InternalViewRef<unknown>;
    this._views.push(view);
    view.attachToAppRef(this);
  }

  /**
   * 뷰를 다시 더러운 검사에서 분리합니다.
   */
  detachView(viewRef: ViewRef): void {
    (typeof ngDevMode === 'undefined' || ngDevMode) && warnIfDestroyed(this._destroyed);
    const view = viewRef as InternalViewRef<unknown>;
    remove(this._views, view);
    view.detachFromAppRef();
  }

  private _loadComponent(componentRef: ComponentRef<any>): void {
    this.attachView(componentRef.hostView);
    try {
      this.tick();
    } catch (e) {
      this.internalErrorHandler(e);
    }
    this.components.push(componentRef);
    // DI 사이클을 방지하기 위해 리스너를 게으르게 가져옵니다.
    const listeners = this._injector.get(APP_BOOTSTRAP_LISTENER, []);
    if (ngDevMode && !Array.isArray(listeners)) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_MULTI_PROVIDER,
        '`APP_BOOTSTRAP_LISTENER` 토큰 값의 예기치 않은 유형 ' +
          `(예상된 배열이지만 ${typeof listeners}이(가) 나왔습니다). ` +
          '`APP_BOOTSTRAP_LISTENER` 토큰이 `multi: true` 제공자로 구성되어 있는지 확인하십시오.',
      );
    }
    listeners.forEach((listener) => listener(componentRef));
  }

  /** @internal */
  ngOnDestroy() {
    if (this._destroyed) return;

    try {
      // 모든 생명주기 훅을 호출합니다.
      this._destroyListeners.forEach((listener) => listener());

      // 모든 등록된 뷰를 파괴합니다.
      this._views.slice().forEach((view) => view.destroy());
    } finally {
      // 이 인스턴스가 파괴되었음을 나타냅니다.
      this._destroyed = true;

      // 모든 참조를 해제합니다.
      this._views = [];
      this._destroyListeners = [];
    }
  }

  /**
   * 인스턴스가 파괴될 때 호출될 리스너를 등록합니다.
   *
   * @param callback 리스너로 추가할 콜백 함수입니다.
   * @returns 리스너를 등록 해제하는 함수입니다.
   */
  onDestroy(callback: () => void): VoidFunction {
    (typeof ngDevMode === 'undefined' || ngDevMode) && warnIfDestroyed(this._destroyed);
    this._destroyListeners.push(callback);
    return () => remove(this._destroyListeners, callback);
  }

  /**
   * 이 `ApplicationRef`로 표현된 Angular 애플리케이션을 파괴합니다. 이 함수를 호출하면
   * 연결된 환경 주입기와 모든 부트스트랩된 컴포넌트가 그들의 뷰와 함께 파괴됩니다.
   */
  destroy(): void {
    if (this._destroyed) {
      throw new RuntimeError(
        RuntimeErrorCode.APPLICATION_REF_ALREADY_DESTROYED,
        ngDevMode && '`ApplicationRef`의 이 인스턴스는 이미 파괴되었습니다.',
      );
    }

    const injector = this._injector as R3Injector;

    // 이 주입기 인스턴스가 파괴 작업을 지원하는지 확인합니다.
    if (injector.destroy && !injector.destroyed) {
      // 기본 주입기를 파괴하면 남은 정리 작업을 호출하는 `ngOnDestroy` 생명주기
      // 훅이 트리거됩니다.
      injector.destroy();
    }
  }

  /**
   * 부착된 뷰의 수를 반환합니다.
   */
  get viewCount() {
    return this._views.length;
  }
}

function warnIfDestroyed(destroyed: boolean): void {
  if (destroyed) {
    console.warn(
      formatRuntimeError(
        RuntimeErrorCode.APPLICATION_REF_ALREADY_DESTROYED,
        '`ApplicationRef`의 이 인스턴스는 이미 파괴되었습니다.',
      ),
    );
  }
}

export function remove<T>(list: T[], el: T): void {
  const index = list.indexOf(el);
  if (index > -1) {
    list.splice(index, 1);
  }
}

export const enum ApplicationRefDirtyFlags {
  None = 0,

  /**
   * 글로벌 변경 감지 라운드가 요청되었습니다.
   */
  ViewTreeGlobal = 0b00000001,

  /**
   * 뷰 트리의 일부가 순회로 표시됩니다.
   */
  ViewTreeTraversal = 0b00000010,

  /**
   * 뷰 트리의 일부가 확인(더러운)로 표시됩니다.
   */
  ViewTreeCheck = 0b00000100,

  /**
   * 어떤 뷰 트리 비트가 설정되는 데 도움이 됩니다.
   */
  ViewTreeAny = ViewTreeGlobal | ViewTreeTraversal | ViewTreeCheck,

  /**
   * 렌더 후 훅을 실행해야 합니다.
   */
  AfterRender = 0b00001000,

  /**
   * `ApplicationRef` 수준의 효과입니다.
   */
  RootEffects = 0b00010000,
}

export function detectChangesInViewIfRequired(
  lView: LView,
  isFirstPass: boolean,
  zonelessEnabled: boolean,
) {
  // 재확인할 때, 실제로 필요한 뷰만 확인합니다.
  if (!isFirstPass && !requiresRefreshOrTraversal(lView)) {
    return;
  }

  const mode =
    isFirstPass && !zonelessEnabled
      ? // 첫 번째 패스는 항상 글로벌 모드에서 수행되며, `CheckAlways` 뷰가 포함됩니다.
        // 존리스 사용 시 모든 루트 뷰는 새로 고침을 위해 명시적으로 표시해야 하며, 아니면
        // `CheckAlways`여도 마찬가지입니다.
        ChangeDetectionMode.Global
      : // `RefreshView` 플래그가 있는 뷰 또는 변경된 신호가 있는 뷰만 새로 고칩니다.
        ChangeDetectionMode.Targeted;
  detectChangesInternal(lView, mode);
}
