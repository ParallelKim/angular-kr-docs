/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// tslint:disable:no-duplicate-imports
import {EventContract} from '@angular/core/primitives/event-dispatch';
import {Attribute} from '@angular/core/primitives/event-dispatch';
import {InjectionToken} from './di';
import {RElement} from './render3/interfaces/renderer_dom';

export const DEFER_BLOCK_SSR_ID_ATTRIBUTE = 'ngb';

declare global {
  interface Element {
    __jsaction_fns: Map<string, Function[]> | undefined;
  }
}

export function setJSActionAttributes(
  nativeElement: Element,
  eventTypes: string[],
  parentDeferBlockId: string | null = null,
) {
  // jsaction 속성은 요소에만 적용되어야 하며 주석 노드에는 적용되지 않아야 합니다.
  // 주석 노드는 setAttribute 함수도 없으므로 이를 통해 오류를 피할 수 있습니다.
  if (eventTypes.length === 0 || nativeElement.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  const existingAttr = nativeElement.getAttribute(Attribute.JSACTION);
  // hydrate 트리거가 사용되는 경우를 중복 제거합니다. 이는
  // 누군가가 hydrate 트리거가 추가하는 것과 일치하는 이벤트 바인딩을 루트 노드에 추가했을 가능성이 있습니다.
  const parts = eventTypes.reduce((prev, curr) => {
    // 기존 속성이 없거나 기존 속성에 없으면 추가해야 합니다.
    return (existingAttr?.indexOf(curr) ?? -1) === -1 ? prev + curr + ':;' : prev;
  }, '');
  // 이는 보안 테스트를 만족시키기 위해 모듈 접근자가 되어야 합니다.
  nativeElement.setAttribute(Attribute.JSACTION, `${existingAttr ?? ''}${parts}`);

  const blockName = parentDeferBlockId ?? '';
  if (blockName !== '' && parts.length > 0) {
    nativeElement.setAttribute(DEFER_BLOCK_SSR_ID_ATTRIBUTE, blockName);
  }
}

export const sharedStashFunction = (rEl: RElement, eventType: string, listenerFn: Function) => {
  const el = rEl as unknown as Element;
  const eventListenerMap = el.__jsaction_fns ?? new Map();
  const eventListeners = eventListenerMap.get(eventType) ?? [];
  eventListeners.push(listenerFn);
  eventListenerMap.set(eventType, eventListeners);
  el.__jsaction_fns = eventListenerMap;
};

export const sharedMapFunction = (rEl: RElement, jsActionMap: Map<string, Set<Element>>) => {
  const el = rEl as unknown as Element;
  let blockName = el.getAttribute(DEFER_BLOCK_SSR_ID_ATTRIBUTE) ?? '';
  const blockSet = jsActionMap.get(blockName) ?? new Set<Element>();
  if (!blockSet.has(el)) {
    blockSet.add(el);
  }
  jsActionMap.set(blockName, blockSet);
};

export function removeListenersFromBlocks(
  blockNames: string[],
  jsActionMap: Map<string, Set<Element>>,
) {
  if (blockNames.length > 0) {
    let blockList: Element[] = [];
    for (let blockName of blockNames) {
      if (jsActionMap.has(blockName)) {
        blockList = [...blockList, ...jsActionMap.get(blockName)!];
      }
    }
    const replayList = new Set(blockList);
    replayList.forEach(removeListeners);
  }
}

export const removeListeners = (el: Element) => {
  el.removeAttribute(Attribute.JSACTION);
  el.removeAttribute(DEFER_BLOCK_SSR_ID_ATTRIBUTE);
  el.__jsaction_fns = undefined;
};

export interface EventContractDetails {
  instance?: EventContract;
}

export const JSACTION_EVENT_CONTRACT = new InjectionToken<EventContractDetails>(
  ngDevMode ? 'EVENT_CONTRACT_DETAILS' : '',
  {
    providedIn: 'root',
    factory: () => ({}),
  },
);

export function invokeListeners(event: Event, currentTarget: Element | null) {
  const handlerFns = currentTarget?.__jsaction_fns?.get(event.type);
  if (!handlerFns || !currentTarget?.isConnected) {
    return;
  }
  for (const handler of handlerFns) {
    handler(event);
  }
}
