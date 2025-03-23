/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  isEarlyEventType,
  isCaptureEventType,
  EventContractContainer,
  EventContract,
  EventDispatcher,
  registerDispatcher,
  getAppScopedQueuedEventInfos,
  clearAppScopedEarlyEventContract,
  EventPhase,
} from '@angular/core/primitives/event-dispatch';

import {APP_BOOTSTRAP_LISTENER, ApplicationRef} from '../application/application_ref';
import {ENVIRONMENT_INITIALIZER, Injector} from '../di';
import {inject} from '../di/injector_compatibility';
import {Provider} from '../di/interface/provider';
import {setStashFn} from '../render3/instructions/listener';
import {RElement, RNode} from '../render3/interfaces/renderer_dom';
import {CLEANUP, LView, TView} from '../render3/interfaces/view';
import {unwrapRNode} from '../render3/util/view_utils';

import {
  JSACTION_BLOCK_ELEMENT_MAP,
  EVENT_REPLAY_ENABLED_DEFAULT,
  IS_EVENT_REPLAY_ENABLED,
} from './tokens';
import {
  sharedStashFunction,
  sharedMapFunction,
  DEFER_BLOCK_SSR_ID_ATTRIBUTE,
  EventContractDetails,
  JSACTION_EVENT_CONTRACT,
  invokeListeners,
  removeListeners,
} from '../event_delegation_utils';
import {APP_ID} from '../application/application_tokens';
import {performanceMarkFeature} from '../util/performance';
import {triggerHydrationFromBlockName} from '../defer/triggering';
import {isIncrementalHydrationEnabled} from './utils';

/** 이벤트 재생 기능을 활성화한 앱.
 *  이는 각 앱에서 이벤트 재생을 한 번 이상 초기화하는 것을 방지하기 위한 것입니다.
 */
const appsWithEventReplay = new WeakSet<ApplicationRef>();

/**
 * 지연 블록에 없는 모든 재생 가능한 요소를 나타내는 키입니다.
 */
const EAGER_CONTENT_LISTENERS_KEY = '';

/**
 * 재생해야 할 블록 이벤트의 목록입니다.
 */
let blockEventQueue: {event: Event; currentTarget: Element}[] = [];

/**
 * 클라이언트에서 이벤트 재생 기능을 활성화해야 하는지 여부를 결정합니다.
 */
function shouldEnableEventReplay(injector: Injector) {
  return injector.get(IS_EVENT_REPLAY_ENABLED, EVENT_REPLAY_ENABLED_DEFAULT);
}

/**
 * 이벤트 재생 지원을 설정하는 데 필요한 프로바이더 세트를 반환합니다.
 * 하이드레이션을 별도로 활성화해야 합니다.
 */
export function withEventReplay(): Provider[] {
  const providers: Provider[] = [
    {
      provide: IS_EVENT_REPLAY_ENABLED,
      useFactory: () => {
        let isEnabled = true;
        if (typeof ngServerMode === 'undefined' || !ngServerMode) {
          // 참고: globalThis[CONTRACT_PROPERTY]는 이벤트 재생 기능이 활성화되어 있지만,
          // 이 애플리케이션에 구성된 이벤트가 없을 경우 undefined일 수 있습니다.
          // 이런 경우에는 재생할 이벤트가 없으므로 이 기능을 활성화하지 않습니다.
          const appId = inject(APP_ID);
          isEnabled = !!window._ejsas?.[appId];
        }
        if (isEnabled) {
          performanceMarkFeature('NgEventReplay');
        }
        return isEnabled;
      },
    },
  ];

  if (typeof ngServerMode === 'undefined' || !ngServerMode) {
    providers.push(
      {
        provide: ENVIRONMENT_INITIALIZER,
        useValue: () => {
          const appRef = inject(ApplicationRef);
          const {injector} = appRef;
          // 동일 페이지에 여러 앱이 존재할 수 있으므로 여기에서 appRef를 확인해야 합니다.
          // 실제로 이벤트 재생을 원하는 앱에 대해서만 활성화하길 원합니다.
          if (!appsWithEventReplay.has(appRef)) {
            const jsActionMap = inject(JSACTION_BLOCK_ELEMENT_MAP);
            if (shouldEnableEventReplay(injector)) {
              setStashFn((rEl: RNode, eventName: string, listenerFn: VoidFunction) => {
                // 사용자가 ng-container에 바인딩하고 호스트 리스너를 사용하여 바인딩하는 지시문을 사용하면
                // 이 요소는 주석 노드일 수 있습니다. 따라서 실제 요소 노드가 있어야 합니다.
                if ((rEl as Node).nodeType !== Node.ELEMENT_NODE) return;
                sharedStashFunction(rEl as RElement, eventName, listenerFn);
                sharedMapFunction(rEl as RElement, jsActionMap);
              });
            }
          }
        },
        multi: true,
      },
      {
        provide: APP_BOOTSTRAP_LISTENER,
        useFactory: () => {
          const appId = inject(APP_ID);
          const appRef = inject(ApplicationRef);
          const {injector} = appRef;

          return () => {
            // 동일 페이지에 여러 앱이 존재할 수 있으므로 여기에서 appRef를 확인해야 합니다.
            // 실제로 이벤트 재생을 원하는 앱에 대해서만 활성화하길 원합니다.
            if (!shouldEnableEventReplay(injector) || appsWithEventReplay.has(appRef)) {
              return;
            }

            appsWithEventReplay.add(appRef);

            appRef.onDestroy(() => {
              appsWithEventReplay.delete(appRef);
              // 항상 브라우저에서 안전하게 호출할 수 있도록 합니다.
              if (typeof ngServerMode !== 'undefined' && !ngServerMode) {
                // 앱이 파괴될 때 `_ejsa`가 삭제되어야 하며,
                // 이를 통해 글로벌 목록의 요소가 여전히 캡처되지 않고
                // 가비지 수집되지 않도록 합니다.
                clearAppScopedEarlyEventContract(appId);
                // 환경 초기화기에서 설정한 함수에 대한 참조를 정리합니다.
                // 함수 클로저가 주입된 요소를 캡처할 수 있으며 이를 통해
                // 제대로 가비지 수집되지 않을 수 있습니다.
                setStashFn(() => {});
              }
            });

            // 애플리케이션의 초기 부분에 대한 하이드레이션이 완료되면 이벤트 재생 로직을 시작합니다.
            // 이 타이밍은 청구되지 않은 탈수된 뷰의 정리 타이밍과 유사합니다.
            appRef.whenStable().then(() => {
              // 참고: `injector`에 대한 다른 작업을 수행하기 전에 애플리케이션이 파괴되었는지 확인해야 합니다.
              // 애플리케이션은 안정성이 확보되기 **전**에 파괴될 수 있으므로,
              // `whenStable`이 해결될 때 `injector`가 이미 파괴된 상태일 수 있습니다.
              // 따라서 `injector.get`을 호출하면 인젝터가 이미 파괴되었다는 오류가 발생합니다.
              if (appRef.destroyed) {
                return;
              }

              const eventContractDetails = injector.get(JSACTION_EVENT_CONTRACT);
              initEventReplay(eventContractDetails, injector);
              const jsActionMap = injector.get(JSACTION_BLOCK_ELEMENT_MAP);
              jsActionMap.get(EAGER_CONTENT_LISTENERS_KEY)?.forEach(removeListeners);
              jsActionMap.delete(EAGER_CONTENT_LISTENERS_KEY);

              const eventContract = eventContractDetails.instance!;
              // 이는 컨테이너 관리자 사용을 통해 등록된 이벤트 리스너를 제거합니다.
              // `document.body`에 등록된 리스너는 계약을 정리하지 않으면 제거되지 않을 수 있습니다.
              if (isIncrementalHydrationEnabled(injector)) {
                // 점진적 하이드레이션이 활성화된 경우, 동시 하이드레이션이 있는지 확인할 수 없으므로
                // 이벤트 계약을 즉시 정리할 수 없습니다. 앱이 파괴될 때 계약 정리를 예약할 수 있습니다.
                appRef.onDestroy(() => eventContract.cleanUp());
              } else {
                eventContract.cleanUp();
              }
            });
          };
        },
        multi: true,
      },
    );
  }

  return providers;
}

const initEventReplay = (eventDelegation: EventContractDetails, injector: Injector) => {
  const appId = injector.get(APP_ID);
  // 이는 packages/platform-server/src/utils.ts에서 설정됩니다.
  const earlyJsactionData = window._ejsas![appId]!;
  const eventContract = (eventDelegation.instance = new EventContract(
    new EventContractContainer(earlyJsactionData.c),
  ));
  for (const et of earlyJsactionData.et) {
    eventContract.addEvent(et);
  }
  for (const et of earlyJsactionData.etc) {
    eventContract.addEvent(et);
  }
  const eventInfos = getAppScopedQueuedEventInfos(appId);
  eventContract.replayEarlyEventInfos(eventInfos);
  clearAppScopedEarlyEventContract(appId);
  const dispatcher = new EventDispatcher((event) => {
    invokeRegisteredReplayListeners(injector, event, event.currentTarget as Element);
  });
  registerDispatcher(eventContract, dispatcher);
};

/**
 * 주어진 LView의 요소에 등록된 모든 DOM 이벤트에 대한 정보를 추출합니다(템플릿에 추가됨).
 * 수집된 이벤트를 해당 DOM 요소에 매핑합니다(요소가 키로 사용됨).
 */
export function collectDomEventsInfo(
  tView: TView,
  lView: LView,
  eventTypesToReplay: {regular: Set<string>; capture: Set<string>},
): Map<Element, string[]> {
  const domEventsInfo = new Map<Element, string[]>();
  const lCleanup = lView[CLEANUP];
  const tCleanup = tView.cleanup;
  if (!tCleanup || !lCleanup) {
    return domEventsInfo;
  }
  for (let i = 0; i < tCleanup.length; ) {
    const firstParam = tCleanup[i++];
    const secondParam = tCleanup[i++];
    if (typeof firstParam !== 'string') {
      continue;
    }
    const eventType = firstParam;
    if (!isEarlyEventType(eventType)) {
      continue;
    }
    if (isCaptureEventType(eventType)) {
      eventTypesToReplay.capture.add(eventType);
    } else {
      eventTypesToReplay.regular.add(eventType);
    }
    const listenerElement = unwrapRNode(lView[secondParam]) as any as Element;
    i++; // 다음 위치(리스너 인덱스의 위치)로 커서를 이동합니다.
    const useCaptureOrIndx = tCleanup[i++];
    // useCaptureOrIndx가 부울이면 그대로 보고합니다.
    // useCaptureOrIndx가 양수이면 unsubscribe 메서드에 있습니다.
    // useCaptureOrIndx가 음수이면 Subscription입니다.
    const isDomEvent = typeof useCaptureOrIndx === 'boolean' || useCaptureOrIndx >= 0;
    if (!isDomEvent) {
      continue;
    }
    if (!domEventsInfo.has(listenerElement)) {
      domEventsInfo.set(listenerElement, [eventType]);
    } else {
      domEventsInfo.get(listenerElement)!.push(eventType);
    }
  }
  return domEventsInfo;
}

export function invokeRegisteredReplayListeners(
  injector: Injector,
  event: Event,
  currentTarget: Element | null,
) {
  const blockName =
    (currentTarget && currentTarget.getAttribute(DEFER_BLOCK_SSR_ID_ATTRIBUTE)) ?? '';
  if (/d\d+/.test(blockName)) {
    hydrateAndInvokeBlockListeners(blockName, injector, event, currentTarget!);
  } else if (event.eventPhase === EventPhase.REPLAY) {
    invokeListeners(event, currentTarget);
  }
}

function hydrateAndInvokeBlockListeners(
  blockName: string,
  injector: Injector,
  event: Event,
  currentTarget: Element,
) {
  blockEventQueue.push({event, currentTarget});
  triggerHydrationFromBlockName(injector, blockName, replayQueuedBlockEvents);
}

function replayQueuedBlockEvents(hydratedBlocks: string[]) {
  // 큐를 복제합니다.
  const queue = [...blockEventQueue];
  const hydrated = new Set<string>(hydratedBlocks);
  // 큐를 비웁니다.
  blockEventQueue = [];
  for (let {event, currentTarget} of queue) {
    const blockName = currentTarget.getAttribute(DEFER_BLOCK_SSR_ID_ATTRIBUTE)!;
    if (hydrated.has(blockName)) {
      invokeListeners(event, currentTarget);
    } else {
      // 아직 하이드레이션되지 않은 이벤트를 다시 큐에 추가합니다.
      blockEventQueue.push({event, currentTarget});
    }
  }
}
