/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {inject} from '../di';
import {InjectionToken} from '../di/injection_token';
import {ɵɵdefineInjectable} from '../di/interface/defs';
import {
  EventContractDetails,
  JSACTION_EVENT_CONTRACT,
  removeListenersFromBlocks,
} from '../event_delegation_utils';
import {JSACTION_BLOCK_ELEMENT_MAP} from '../hydration/tokens';
import {DehydratedDeferBlock} from './interfaces';

/**
 * 트리 섀킥 가능한 방식으로 `DehydratedBlockRegistry` 구현을 참조하기 위한 내부 주입 토큰입니다.
 */
export const DEHYDRATED_BLOCK_REGISTRY = new InjectionToken<DehydratedBlockRegistry>(
  ngDevMode ? 'DEHYDRATED_BLOCK_REGISTRY' : '',
);

/**
 * DehydratedBlockRegistry는 점진적인 수분화 목적에 사용됩니다. 수분화가 필요한 Defer Block을 추적하여
 * 최상위 탈수된 Defer Block으로 효과적으로 탐색하고 수분화 후 적절한 정리 함수가 호출되도록 합니다.
 */
export class DehydratedBlockRegistry {
  private registry = new Map<string, DehydratedDeferBlock>();
  private cleanupFns = new Map<string, Function[]>();
  private jsActionMap: Map<string, Set<Element>> = inject(JSACTION_BLOCK_ELEMENT_MAP);
  private contract: EventContractDetails = inject(JSACTION_EVENT_CONTRACT);

  add(blockId: string, info: DehydratedDeferBlock) {
    this.registry.set(blockId, info);
    // 수분화가 지연 로드된 경로의 해결을 기다리고 있는 경우,
    // 이 경우 콜백 함수를 호출하여 큐에 있는 블록 집합에 대한 수분화 프로세스를 계속 진행합니다.
    if (this.awaitingCallbacks.has(blockId)) {
      const awaitingCallbacks = this.awaitingCallbacks.get(blockId)!;
      for (const cb of awaitingCallbacks) {
        cb();
      }
    }
  }

  get(blockId: string): DehydratedDeferBlock | null {
    return this.registry.get(blockId) ?? null;
  }

  has(blockId: string): boolean {
    return this.registry.has(blockId);
  }

  cleanup(hydratedBlocks: string[]) {
    removeListenersFromBlocks(hydratedBlocks, this.jsActionMap);
    for (let blockId of hydratedBlocks) {
      this.registry.delete(blockId);
      this.jsActionMap.delete(blockId);
      this.invokeTriggerCleanupFns(blockId);
      this.hydrating.delete(blockId);
      this.awaitingCallbacks.delete(blockId);
    }
    if (this.size === 0) {
      this.contract.instance?.cleanUp();
    }
  }

  get size(): number {
    return this.registry.size;
  }

  // 가장 낮은 블록 ID를 레지스트리에 남겨야 하며
  // 해당 블록에 자식이 없는 경우를 제외합니다.
  addCleanupFn(blockId: string, fn: Function) {
    let cleanupFunctions: Function[] = [];
    if (this.cleanupFns.has(blockId)) {
      cleanupFunctions = this.cleanupFns.get(blockId)!;
    }
    cleanupFunctions.push(fn);
    this.cleanupFns.set(blockId, cleanupFunctions);
  }

  invokeTriggerCleanupFns(blockId: string) {
    const fns = this.cleanupFns.get(blockId) ?? [];
    for (let fn of fns) {
      fn();
    }
    this.cleanupFns.delete(blockId);
  }

  // 수분화 중인 블록.
  hydrating = new Map<string, PromiseWithResolvers<void>>();

  // 지연 지시 완료를 기다리는 블록.
  private awaitingCallbacks = new Map<string, Function[]>();

  awaitParentBlock(topmostParentBlock: string, callback: Function) {
    const parentBlockAwaitCallbacks = this.awaitingCallbacks.get(topmostParentBlock) ?? [];
    parentBlockAwaitCallbacks.push(callback);
    this.awaitingCallbacks.set(topmostParentBlock, parentBlockAwaitCallbacks);
  }

  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: DehydratedBlockRegistry,
    providedIn: null,
    factory: () => new DehydratedBlockRegistry(),
  });
}
