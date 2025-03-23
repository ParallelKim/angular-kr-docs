/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TracingService} from '../../application/tracing';
import {assertInInjectionContext} from '../../di';
import {Injector} from '../../di/injector';
import {inject} from '../../di/injector_compatibility';
import {DestroyRef} from '../../linker/destroy_ref';
import {performanceMarkFeature} from '../../util/performance';
import {assertNotInReactiveContext} from '../reactivity/asserts';
import {ViewContext} from '../view_context';
import {AfterRenderPhase, AfterRenderRef} from './api';
import {
  AfterRenderHooks,
  AfterRenderImpl,
  AfterRenderManager,
  AfterRenderSequence,
} from './manager';

/**
 * 주어진 타입 배열에서 첫 번째 비-결코 타입을 포함하는 인수 목록,
 * 타입 배열에 비-결코 타입이 없으면 빈 인수 목록입니다.
 */
export type ɵFirstAvailable<T extends unknown[]> = T extends [infer H, ...infer R]
  ? [H] extends [never]
    ? ɵFirstAvailable<R>
    : [H]
  : [];

/**
 * `afterRender` 및 `afterNextRender`에 전달되는 옵션입니다.
 *
 * @developerPreview
 */
export interface AfterRenderOptions {
  /**
   * 생성 중에 사용할 `Injector`입니다.
   *
   * 제공되지 않으면 현재 주입 컨텍스트가 대신 사용됩니다( `inject`를 통해).
   */
  injector?: Injector;

  /**
   * 훅이 수동 정리가 필요한지 여부입니다.
   *
   * 이것이 `false`인 경우(기본값) 훅은 현재 `DestroyRef`와 함께 자동으로 정리되도록 등록됩니다.
   */
  manualCleanup?: boolean;

  /**
   * 콜백을 호출해야 하는 단계입니다.
   *
   * <div class="docs-alert docs-alert-critical">
   *
   * 기본값은 `AfterRenderPhase.MixedReadWrite`입니다. 대신 더 구체적인
   * 단계를 선택해야 합니다. 더 많은 정보는 `AfterRenderPhase`를 참조하세요.
   *
   * </div>
   *
   * @deprecated 콜백이 실행될 단계를 명시적으로 지정하려면 함수를 대신하여
   *   `afterRender` 또는 `afterNextRender`의 첫 번째 매개변수로 사양 객체를 전달하세요.
   */
  phase?: AfterRenderPhase;
}

/**
 * 응용 프로그램이 렌더링을 완료할 때마다 지정된 단계에서 호출되도록 콜백을 등록합니다. 사용 가능한 단계는 다음과 같습니다:
 * - `earlyRead`
 *   후속 `write` 콜백 전에 DOM에서 **읽기** 위해 이 단계를 사용하세요. 예를 들어 브라우저가
 *   본래 지원하지 않는 사용자 정의 레이아웃을 수행하기 위해 사용합니다. 쓰기 단계 후에 읽기가
 *   기다릴 수 있다면 `read` 단계를 선호하세요. 이 단계에서 DOM에 **결코** 쓰지 마세요.
 * - `write`
 *   DOM에 **쓰기** 위해 이 단계를 사용하세요. 이 단계에서 DOM에서 **결코** 읽지 마세요.
 * - `mixedReadWrite`
 *   DOM에서 동시에 읽고 쓰기 위해 이 단계를 사용하세요. 다른 단계에서 작업을 나눌 수
 *   있는 경우 이 단계를 **결코** 사용하지 마세요.
 * - `read`
 *   DOM에서 **읽기** 위해 이 단계를 사용하세요. 이 단계에서 DOM에 **결코** 쓰지 마세요.
 *
 * <div class="docs-alert docs-alert-critical">
 *
 * 성능 저하를 피하기 위해 가능한 경우 `earlyRead` 및 `mixedReadWrite` 단계보다
 * `read` 및 `write` 단계를 사용하는 것이 좋습니다.
 *
 * </div>
 *
 * 다음 사항에 유의하세요:
 * - 콜백은 *각 렌더링 후* 다음 단계 순서로 실행됩니다:
 *   1. `earlyRead`
 *   2. `write`
 *   3. `mixedReadWrite`
 *   4. `read`
 * - 동일한 단계의 콜백은 등록된 순서로 실행됩니다.
 * - 콜백은 브라우저 플랫폼에서만 실행되며 서버에서는 실행되지 않습니다.
 *
 * 이 사양의 첫 번째 단계 콜백은 매개변수를 받지 않습니다. 이 사양의 각
 * 후속 콜백은 이전에 실행된 단계 콜백의 반환 값을 매개변수로 받습니다. 이를 사용하여
 * 여러 단계 간 작업을 조정할 수 있습니다.
 *
 * Angular는 단계가 올바르게 사용되는지 확인하거나 강제할 수 없으며,
 * 대신 각 개발자가 문서화된 가이드를 따라 각 값을 신중하게 선택하고
 * 필요시 코드 리펙토링을 수행할 것을 의존합니다. 그렇게 함으로써 Angular는
 * 수동 DOM 접근과 관련된 성능 저하를 최소화할 수 있으며, 응용프로그램이나
 * 라이브러리의 최종 사용자에게 최상의 경험을 보장합니다.
 *
 * <div class="docs-alert docs-alert-important">
 *
 * 콜백이 실행되기 전에 구성 요소가 [수화](guide/hydration)된다고 보장되지 않습니다.
 * DOM 및 레이아웃을 직접 읽거나 쓸 때 주의해야 합니다.
 *
 * </div>
 *
 * @param spec 등록할 콜백 함수
 * @param options 콜백의 동작을 제어하는 옵션
 *
 * @usageNotes
 *
 * 각 렌더링 후 DOM을 읽거나 쓰기 위해 `afterRender`를 사용하세요.
 *
 * ### 예
 * ```angular-ts
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<span #content>{{ ... }}</span>`,
 * })
 * export class MyComponent {
 *   @ViewChild('content') contentRef: ElementRef;
 *
 *   constructor() {
 *     afterRender({
 *       read: () => {
 *         console.log('content height: ' + this.contentRef.nativeElement.scrollHeight);
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterRender<E = never, W = never, M = never>(
  spec: {
    earlyRead?: () => E;
    write?: (...args: ɵFirstAvailable<[E]>) => W;
    mixedReadWrite?: (...args: ɵFirstAvailable<[W, E]>) => M;
    read?: (...args: ɵFirstAvailable<[M, W, E]>) => void;
  },
  options?: Omit<AfterRenderOptions, 'phase'>,
): AfterRenderRef;

/**
 * 응용 프로그램이 렌더링을 완료할 때마다 `mixedReadWrite` 단계에서 호출될 콜백을 등록합니다.
 *
 * <div class="docs-alert docs-alert-critical">
 *
 * 대신 콜백에 대해 명시적인 단계를 지정하는 것이 좋으며, 그렇지 않으면 성능 저하의 위험이 있습니다.
 *
 * </div>
 *
 * 콜백은 다음에서 실행됩니다:
 * - 등록된 순서대로
 * - 각 렌더링마다 한 번
 * - 브라우저 플랫폼에서만
 * - `mixedReadWrite` 단계에서
 *
 * <div class="docs-alert docs-alert-important">
 *
 * 콜백이 실행되기 전에 구성 요소가 [수화](guide/hydration)된다고 보장되지 않습니다.
 * DOM 및 레이아웃을 직접 읽거나 쓸 때 주의해야 합니다.
 *
 * </div>
 *
 * @param callback 등록할 콜백 함수
 * @param options 콜백의 동작을 제어하는 옵션
 *
 * @usageNotes
 *
 * 각 렌더링 후 DOM을 읽거나 쓰기 위해 `afterRender`를 사용하세요.
 *
 * ### 예
 * ```angular-ts
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<span #content>{{ ... }}</span>`,
 * })
 * export class MyComponent {
 *   @ViewChild('content') contentRef: ElementRef;
 *
 *   constructor() {
 *     afterRender({
 *       read: () => {
 *         console.log('content height: ' + this.contentRef.nativeElement.scrollHeight);
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterRender(callback: VoidFunction, options?: AfterRenderOptions): AfterRenderRef;

export function afterRender(
  callbackOrSpec:
    | VoidFunction
    | {
        earlyRead?: () => unknown;
        write?: (r?: unknown) => unknown;
        mixedReadWrite?: (r?: unknown) => unknown;
        read?: (r?: unknown) => void;
      },
  options?: AfterRenderOptions,
): AfterRenderRef {
  ngDevMode &&
    assertNotInReactiveContext(
      afterRender,
      '리액티브 컨텍스트를 벗어나 `afterRender`를 호출하세요. 예: ' +
        '컴포넌트 생성자 안에 렌더링 콜백을 예약합니다.`',
    );

  !options?.injector && assertInInjectionContext(afterRender);
  const injector = options?.injector ?? inject(Injector);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    return NOOP_AFTER_RENDER_REF;
  }

  performanceMarkFeature('NgAfterRender');

  return afterRenderImpl(callbackOrSpec, injector, options, /* once */ false);
}

/**
 * 지정된 단계에서 응용 프로그램이 렌더링을 완료할 때마다 호출되도록 콜백을 등록합니다. 사용 가능한 단계는 다음과 같습니다:
 * - `earlyRead`
 *   후속 `write` 콜백 전에 DOM에서 **읽기** 위해 이 단계를 사용하세요. 예를 들어 브라우저가
 *   본래 지원하지 않는 사용자 정의 레이아웃을 수행하기 위해 사용합니다. 쓰기 단계 후에 읽기가
 *   기다릴 수 있다면 `read` 단계를 선호하세요. 이 단계에서 DOM에 **결코** 쓰지 마세요.
 * - `write`
 *   DOM에 **쓰기** 위해 이 단계를 사용하세요. 이 단계에서 DOM에서 **결코** 읽지 마세요.
 * - `mixedReadWrite`
 *   DOM에서 동시에 읽고 쓰기 위해 이 단계를 사용하세요. 다른 단계에서 작업을 나눌 수
 *   있는 경우 이 단계를 **결코** 사용하지 마세요.
 * - `read`
 *   DOM에서 **읽기** 위해 이 단계를 사용하세요. 이 단계에서 DOM에 **결코** 쓰지 마세요.
 *
 * <div class="docs-alert docs-alert-critical">
 *
 * 성능 저하를 피하기 위해 가능한 경우 `earlyRead` 및 `mixedReadWrite` 단계보다
 * `read` 및 `write` 단계를 사용하는 것이 좋습니다.
 *
 * </div>
 *
 * 다음 사항에 유의하세요:
 * - 콜백은 *다음 렌더링 후 한 번* 다음 단계 순서로 실행됩니다:
 *   1. `earlyRead`
 *   2. `write`
 *   3. `mixedReadWrite`
 *   4. `read`
 * - 동일한 단계의 콜백은 등록된 순서로 실행됩니다.
 * - 콜백은 브라우저 플랫폼에서만 실행되며 서버에서는 실행되지 않습니다.
 *
 * 이 사양의 첫 번째 단계 콜백은 매개변수를 받지 않습니다. 이 사양의 각
 * 후속 콜백은 이전에 실행된 단계 콜백의 반환 값을 매개변수로 받습니다. 이를 사용하여
 * 여러 단계 간 작업을 조정할 수 있습니다.
 *
 * Angular는 단계가 올바르게 사용되는지 확인하거나 강제할 수 없으며,
 * 대신 각 개발자가 문서화된 가이드를 따라 각 값을 신중하게 선택하고
 * 필요시 코드 리펙토링을 수행할 것을 의존합니다. 그렇게 함으로써 Angular는
 * 수동 DOM 접근과 관련된 성능 저하를 최소화할 수 있으며, 응용 프로그램이나
 * 라이브러리의 최종 사용자에게 최상의 경험을 보장합니다.
 *
 * <div class="docs-alert docs-alert-important">
 *
 * 콜백이 실행되기 전에 구성 요소가 [수화](guide/hydration)된다고 보장되지 않습니다.
 * DOM 및 레이아웃을 직접 읽거나 쓸 때 주의해야 합니다.
 *
 * </div>
 *
 * @param spec 등록할 콜백 함수
 * @param options 콜백의 동작을 제어하는 옵션
 *
 * @usageNotes
 *
 * `afterNextRender`를 사용하여 DOM을 한 번 읽거나 씁니다.
 * 예를 들어 비-Angular 라이브러리를 초기화하는 데 사용할 수 있습니다.
 *
 * ### 예
 * ```angular-ts
 * @Component({
 *   selector: 'my-chart-cmp',
 *   template: `<div #chart>{{ ... }}</div>`,
 * })
 * export class MyChartCmp {
 *   @ViewChild('chart') chartRef: ElementRef;
 *   chart: MyChart|null;
 *
 *   constructor() {
 *     afterNextRender({
 *       write: () => {
 *         this.chart = new MyChart(this.chartRef.nativeElement);
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterNextRender<E = never, W = never, M = never>(
  spec: {
    earlyRead?: () => E;
    write?: (...args: ɵFirstAvailable<[E]>) => W;
    mixedReadWrite?: (...args: ɵFirstAvailable<[W, E]>) => M;
    read?: (...args: ɵFirstAvailable<[M, W, E]>) => void;
  },
  options?: Omit<AfterRenderOptions, 'phase'>,
): AfterRenderRef;

/**
 * 다음 렌더링이 완료될 때, `mixedReadWrite` 단계에서 호출될 콜백을 등록합니다.
 *
 * <div class="docs-alert docs-alert-critical">
 *
 * 대신 콜백에 대해 명시적인 단계를 지정하는 것이 좋으며, 그렇지 않으면 성능 저하의 위험이 있습니다.
 *
 * </div>
 *
 * 콜백은 다음에서 실행됩니다:
 * - 등록된 순서대로
 * - 브라우저 플랫폼에서만
 * - `mixedReadWrite` 단계에서
 *
 * <div class="docs-alert docs-alert-important">
 *
 * 콜백이 실행되기 전에 구성 요소가 [수화](guide/hydration)된다고 보장되지 않습니다.
 * DOM 및 레이아웃을 직접 읽거나 쓸 때 주의해야 합니다.
 *
 * </div>
 *
 * @param callback 등록할 콜백 함수
 * @param options 콜백의 동작을 제어하는 옵션
 *
 * @usageNotes
 *
 * `afterNextRender`를 사용하여 DOM을 한 번 읽거나 씁니다.
 * 예를 들어 비-Angular 라이브러리를 초기화하는 데 사용할 수 있습니다.
 *
 * ### 예
 * ```angular-ts
 * @Component({
 *   selector: 'my-chart-cmp',
 *   template: `<div #chart>{{ ... }}</div>`,
 * })
 * export class MyChartCmp {
 *   @ViewChild('chart') chartRef: ElementRef;
 *   chart: MyChart|null;
 *
 *   constructor() {
 *     afterNextRender({
 *       write: () => {
 *         this.chart = new MyChart(this.chartRef.nativeElement);
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterNextRender(
  callback: VoidFunction,
  options?: AfterRenderOptions,
): AfterRenderRef;

export function afterNextRender(
  callbackOrSpec:
    | VoidFunction
    | {
        earlyRead?: () => unknown;
        write?: (r?: unknown) => unknown;
        mixedReadWrite?: (r?: unknown) => unknown;
        read?: (r?: unknown) => void;
      },
  options?: AfterRenderOptions,
): AfterRenderRef {
  !options?.injector && assertInInjectionContext(afterNextRender);
  const injector = options?.injector ?? inject(Injector);

  if (typeof ngServerMode !== 'undefined' && ngServerMode) {
    return NOOP_AFTER_RENDER_REF;
  }

  performanceMarkFeature('NgAfterNextRender');

  return afterRenderImpl(callbackOrSpec, injector, options, /* once */ true);
}

function getHooks(
  callbackOrSpec:
    | VoidFunction
    | {
        earlyRead?: () => unknown;
        write?: (r?: unknown) => unknown;
        mixedReadWrite?: (r?: unknown) => unknown;
        read?: (r?: unknown) => void;
      },
  phase: AfterRenderPhase,
): AfterRenderHooks {
  if (callbackOrSpec instanceof Function) {
    const hooks: AfterRenderHooks = [undefined, undefined, undefined, undefined];
    hooks[phase] = callbackOrSpec;
    return hooks;
  } else {
    return [
      callbackOrSpec.earlyRead,
      callbackOrSpec.write,
      callbackOrSpec.mixedReadWrite,
      callbackOrSpec.read,
    ];
  }
}

/**
 * `afterRender` 및 `afterNextRender`의 공유 구현.
 */
function afterRenderImpl(
  callbackOrSpec:
    | VoidFunction
    | {
        earlyRead?: () => unknown;
        write?: (r?: unknown) => unknown;
        mixedReadWrite?: (r?: unknown) => unknown;
        read?: (r?: unknown) => void;
      },
  injector: Injector,
  options: AfterRenderOptions | undefined,
  once: boolean,
): AfterRenderRef {
  const manager = injector.get(AfterRenderManager);
  // 필요에 따라 핸들러 구현을 지연 초기화합니다. 이를 통해
  // `afterRender` 및 `afterNextRender`가 사용되지 않는 경우 트리 쉐이킹이 가능합니다.
  manager.impl ??= injector.get(AfterRenderImpl);

  const tracing = injector.get(TracingService, null, {optional: true});

  const hooks = options?.phase ?? AfterRenderPhase.MixedReadWrite;
  const destroyRef = options?.manualCleanup !== true ? injector.get(DestroyRef) : null;
  const viewContext = injector.get(ViewContext, null, {optional: true});
  const sequence = new AfterRenderSequence(
    manager.impl,
    getHooks(callbackOrSpec, hooks),
    viewContext?.view,
    once,
    destroyRef,
    tracing?.snapshot(null),
  );
  manager.impl.register(sequence);
  return sequence;
}

/** 아무것도 하지 않는 `AfterRenderRef`. */
export const NOOP_AFTER_RENDER_REF: AfterRenderRef = {
  destroy() {},
};
