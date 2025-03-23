/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {APP_BOOTSTRAP_LISTENER, ApplicationRef} from '../application/application_ref';
import {Console} from '../console';
import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  Injector,
  makeEnvironmentProviders,
  Provider,
} from '../di';
import {inject} from '../di/injector_compatibility';
import {formatRuntimeError, RuntimeError, RuntimeErrorCode} from '../errors';
import {enableLocateOrCreateContainerRefImpl} from '../linker/view_container_ref';
import {enableLocateOrCreateI18nNodeImpl} from '../render3/i18n/i18n_apply';
import {enableLocateOrCreateElementNodeImpl} from '../render3/instructions/element';
import {enableLocateOrCreateElementContainerNodeImpl} from '../render3/instructions/element_container';
import {enableApplyRootElementTransformImpl} from '../render3/instructions/shared';
import {enableLocateOrCreateContainerAnchorImpl} from '../render3/instructions/template';
import {enableLocateOrCreateTextNodeImpl} from '../render3/instructions/text';
import {getDocument} from '../render3/interfaces/document';
import {TransferState} from '../transfer_state';
import {performanceMarkFeature} from '../util/performance';
import {NgZone} from '../zone';
import {withEventReplay} from './event_replay';

import {cleanupDehydratedViews} from './cleanup';
import {
  enableClaimDehydratedIcuCaseImpl,
  enablePrepareI18nBlockForHydrationImpl,
  setIsI18nHydrationSupportEnabled,
} from './i18n';
import {
  IS_HYDRATION_DOM_REUSE_ENABLED,
  IS_I18N_HYDRATION_ENABLED,
  IS_INCREMENTAL_HYDRATION_ENABLED,
  PRESERVE_HOST_CONTENT,
} from './tokens';
import {
  appendDeferBlocksToJSActionMap,
  countBlocksSkippedByHydration,
  enableRetrieveDeferBlockDataImpl,
  enableRetrieveHydrationInfoImpl,
  isIncrementalHydrationEnabled,
  NGH_DATA_KEY,
  processBlockData,
  verifySsrContentsIntegrity,
} from './utils';
import {enableFindMatchingDehydratedViewImpl} from './views';
import {DEHYDRATED_BLOCK_REGISTRY, DehydratedBlockRegistry} from '../defer/registry';
import {gatherDeferBlocksCommentNodes} from './node_lookup_utils';
import {processAndInitTriggers} from '../defer/triggering';

/**
 * 하이드레이션 관련 코드가 추가되었는지 여부를 나타냅니다,
 * 여러 번 추가하는 것을 방지합니다.
 */
let isHydrationSupportEnabled = false;

/**
 * i18n 관련 코드가 추가되었는지 여부를 나타냅니다,
 * 여러 번 추가하는 것을 방지합니다.
 *
 * 참고: 이것은 단지 코드가 로드되는지 제어하는 것일 뿐,
 * `setIsI18nHydrationSupportEnabled`은 i18n 블록이
 * 직렬화되거나 하이드레이션되는지 결정합니다.
 */
let isI18nHydrationRuntimeSupportEnabled = false;

/**
 * 증분 하이드레이션 코드가 추가되었는지 여부를 나타냅니다,
 * 여러 번 추가하는 것을 방지합니다.
 */
let isIncrementalHydrationRuntimeSupportEnabled = false;

/**
 * Angular가 `ApplicationRef.isStable`이 `true`를 내보낼 때까지 기다리는 시간을 정의합니다.
 * 이 시간 동안 `true` 값의 이벤트가 없으면, Angular는 경고를 보고합니다.
 */
const APPLICATION_IS_STABLE_TIMEOUT = 10_000;

/**
 * 필요한 하이드레이션 코드를 트리 셰이킹 가능한 방식으로 가져옵니다.
 * 이 코드는 `provideClientHydration`이 호출될 때만 존재합니다.
 * 그렇지 않으면, 이 코드는 빌드 최적화 단계에서 트리 셰이킹됩니다.
 *
 * 이 기법은 하이드레이션이 비활성화되거나 활성화되었을 때
 * 트리 셰이킹이 적절하게 작동하도록 메서드의 구현을 교체할 수 있게 합니다.
 * 이는 하이드레이션이 활성화된 경우에만 하이드레이션을 지원하는
 * 적절한 버전의 메서드를 제공합니다.
 */
function enableHydrationRuntimeSupport() {
  if (!isHydrationSupportEnabled) {
    isHydrationSupportEnabled = true;
    enableRetrieveHydrationInfoImpl();
    enableLocateOrCreateElementNodeImpl();
    enableLocateOrCreateTextNodeImpl();
    enableLocateOrCreateElementContainerNodeImpl();
    enableLocateOrCreateContainerAnchorImpl();
    enableLocateOrCreateContainerRefImpl();
    enableFindMatchingDehydratedViewImpl();
    enableApplyRootElementTransformImpl();
  }
}

/**
 * 필요한 i18n 하이드레이션 코드를 트리 셰이킹 가능한 방식으로 가져옵니다.
 * `enableHydrationRuntimeSupport`와 유사하게, 이 코드는
 * `withI18nSupport`가 호출될 때만 존재합니다.
 */
function enableI18nHydrationRuntimeSupport() {
  if (!isI18nHydrationRuntimeSupportEnabled) {
    isI18nHydrationRuntimeSupportEnabled = true;
    enableLocateOrCreateI18nNodeImpl();
    enablePrepareI18nBlockForHydrationImpl();
    enableClaimDehydratedIcuCaseImpl();
  }
}

/**
 * 필요한 증분 하이드레이션 코드를 트리 셰이킹 가능한 방식으로 가져옵니다.
 * `enableHydrationRuntimeSupport`와 유사하게, 이 코드는
 * `enableIncrementalHydrationRuntimeSupport`가 호출될 때만 존재합니다.
 */
function enableIncrementalHydrationRuntimeSupport() {
  if (!isIncrementalHydrationRuntimeSupportEnabled) {
    isIncrementalHydrationRuntimeSupportEnabled = true;
    enableRetrieveDeferBlockDataImpl();
  }
}

/**
 * 콘솔에 하이드레이션 통계 메시지를 출력합니다.
 */
function printHydrationStats(injector: Injector) {
  const console = injector.get(Console);
  const message =
    `Angular hydrated ${ngDevMode!.hydratedComponents} component(s) ` +
    `and ${ngDevMode!.hydratedNodes} node(s), ` +
    `${ngDevMode!.componentsSkippedHydration} component(s) were skipped. ` +
    (isIncrementalHydrationEnabled(injector)
      ? `${ngDevMode!.deferBlocksWithIncrementalHydration} defer block(s) were configured to use incremental hydration. `
      : '') +
    `Learn more at https://angular.dev/guide/hydration.`;
  // tslint:disable-next-line:no-console
  console.log(message);
}

/**
 * 애플리케이션이 안정 상태가 되면 해결되는 Promise를 반환합니다.
 */
function whenStableWithTimeout(appRef: ApplicationRef): Promise<void> {
  const whenStablePromise = appRef.whenStable();
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    const timeoutTime = APPLICATION_IS_STABLE_TIMEOUT;
    const console = appRef.injector.get(Console);
    const ngZone = appRef.injector.get(NgZone);

    // 다음 호출은 앱이 안정 상태가 되는 것을 방지하지 않으며, 방지해서도 안 됩니다.
    // 여기서는 앱이 불안정한 상태로 유지되므로 RxJS 타이머를 사용할 수 없습니다.
    // 이는 추가적인 변경 감지 사이클도 방지합니다.
    const timeoutId = ngZone.runOutsideAngular(() => {
      return setTimeout(() => logWarningOnStableTimedout(timeoutTime, console), timeoutTime);
    });

    whenStablePromise.finally(() => clearTimeout(timeoutId));
  }

  return whenStablePromise;
}

/**
 * `RenderMode.Client`로 구성된 라우트의 경우,
 * `index.html` 파일의 <body> 태그에 추가되는 속성의 이름을 정의합니다.
 * 'cm'은 "Client Mode"의 약자입니다.
 */
export const CLIENT_RENDER_MODE_FLAG = 'ngcm';

/**
 * 현재 라우트에 대해 `RenderMode.Client`가 정의되었는지 확인합니다.
 */
function isClientRenderModeEnabled(): boolean {
  const doc = getDocument();
  return (
    (typeof ngServerMode === 'undefined' || !ngServerMode) &&
    doc.body.hasAttribute(CLIENT_RENDER_MODE_FLAG)
  );
}

/**
 * 서버 사이드 렌더링된 애플리케이션에 대한 하이드레이션 지원을 설정하는 데
 * 필요한 프로바이더 세트를 반환합니다. 이 함수는
 * `platform-browser` 패키지의 `provideClientHydration` 공개 API 함수에
 * 포함되어 있습니다.
 *
 * 이 함수는 서버 사이드 렌더링 시간 동안에도 인식되는 내부 플래그를 설정하므로,
 * 기능을 활성화하기 위해 NgUniversal에서 아무것도 구성하거나 변경할 필요가 없습니다.
 */
export function withDomHydration(): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: IS_HYDRATION_DOM_REUSE_ENABLED,
      useFactory: () => {
        let isEnabled = true;
        if (typeof ngServerMode === 'undefined' || !ngServerMode) {
          // On the client, verify that the server response contains
          // hydration annotations. Otherwise, keep hydration disabled.
          const transferState = inject(TransferState, {optional: true});
          isEnabled = !!transferState?.get(NGH_DATA_KEY, null);
        }
        if (isEnabled) {
          performanceMarkFeature('NgHydration');
        }
        return isEnabled;
      },
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => {
        // i18n support is enabled by calling withI18nSupport(), but there's
        // no way to turn it off (e.g. for tests), so we turn it off by default.
        setIsI18nHydrationSupportEnabled(false);

        if (typeof ngServerMode !== 'undefined' && ngServerMode) {
          // Since this function is used across both server and client,
          // make sure that the runtime code is only added when invoked
          // on the client (see the `enableHydrationRuntimeSupport` function
          // call below).
          return;
        }

        if (inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
          verifySsrContentsIntegrity(getDocument());
          enableHydrationRuntimeSupport();
        } else if (typeof ngDevMode !== 'undefined' && ngDevMode && !isClientRenderModeEnabled()) {
          const console = inject(Console);
          const message = formatRuntimeError(
            RuntimeErrorCode.MISSING_HYDRATION_ANNOTATIONS,
            'Angular hydration was requested on the client, but there was no ' +
              'serialized information present in the server response, ' +
              'thus hydration was not enabled. ' +
              'Make sure the `provideClientHydration()` is included into the list ' +
              'of providers in the server part of the application configuration.',
          );
          console.warn(message);
        }
      },
      multi: true,
    },
  ];

  if (typeof ngServerMode === 'undefined' || !ngServerMode) {
    providers.push(
      {
        provide: PRESERVE_HOST_CONTENT,
        useFactory: () => {
          // Preserve host element content only in a browser
          // environment and when hydration is configured properly.
          // On a server, an application is rendered from scratch,
          // so the host content needs to be empty.
          return inject(IS_HYDRATION_DOM_REUSE_ENABLED);
        },
      },
      {
        provide: APP_BOOTSTRAP_LISTENER,
        useFactory: () => {
          if (inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
            const appRef = inject(ApplicationRef);

            return () => {
              // Wait until an app becomes stable and cleanup all views that
              // were not claimed during the application bootstrap process.
              // The timing is similar to when we start the serialization process
              // on the server.
              //
              // Note: the cleanup task *MUST* be scheduled within the Angular zone in Zone apps
              // to ensure that change detection is properly run afterward.
              whenStableWithTimeout(appRef).then(() => {
                // Note: we have to check whether the application is destroyed before
                // performing other operations with the `injector`.
                // The application may be destroyed **before** it becomes stable, so when
                // the `whenStableWithTimeout` resolves, the injector might already be in
                // a destroyed state. Thus, calling `injector.get` would throw an error
                // indicating that the injector has already been destroyed.
                if (appRef.destroyed) {
                  return;
                }

                cleanupDehydratedViews(appRef);
                if (typeof ngDevMode !== 'undefined' && ngDevMode) {
                  countBlocksSkippedByHydration(appRef.injector);
                  printHydrationStats(appRef.injector);
                }
              });
            };
          }
          return () => {}; // noop
        },
        multi: true,
      },
    );
  }

  return makeEnvironmentProviders(providers);
}

/**
 * i18n 하이드레이션 지원을 설정하는 데 필요한 프로바이더 세트를 반환합니다.
 * 하이드레이션을 별도로 활성화해야 합니다.
 */
export function withI18nSupport(): Provider[] {
  return [
    {
      provide: IS_I18N_HYDRATION_ENABLED,
      useFactory: () => inject(IS_HYDRATION_DOM_REUSE_ENABLED),
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => {
        if (inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
          enableI18nHydrationRuntimeSupport();
          setIsI18nHydrationSupportEnabled(true);
          performanceMarkFeature('NgI18nHydration');
        }
      },
      multi: true,
    },
  ];
}

/**
 * 증분 하이드레이션 지원을 설정하는 데 필요한 프로바이더 세트를 반환합니다.
 * 하이드레이션을 별도로 활성화해야 합니다.
 * 증분 하이드레이션을 활성화하면 전체 앱에 대한 이벤트 재생도 활성화됩니다.
 *
 * @developerPreview
 */
export function withIncrementalHydration(): Provider[] {
  const providers: Provider[] = [
    withEventReplay(),
    {
      provide: IS_INCREMENTAL_HYDRATION_ENABLED,
      useValue: true,
    },
    {
      provide: DEHYDRATED_BLOCK_REGISTRY,
      useClass: DehydratedBlockRegistry,
    },
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => {
        enableIncrementalHydrationRuntimeSupport();
        performanceMarkFeature('NgIncrementalHydration');
      },
      multi: true,
    },
  ];

  if (typeof ngServerMode === 'undefined' || !ngServerMode) {
    providers.push({
      provide: APP_BOOTSTRAP_LISTENER,
      useFactory: () => {
        const injector = inject(Injector);
        const doc = getDocument();

        return () => {
          const deferBlockData = processBlockData(injector);
          const commentsByBlockId = gatherDeferBlocksCommentNodes(doc, doc.body);
          processAndInitTriggers(injector, deferBlockData, commentsByBlockId);
          appendDeferBlocksToJSActionMap(doc, injector);
        };
      },
      multi: true,
    });
  }

  return providers;
}

/**
 *
 * @param time 안정 타임아웃 경고 메시지가 기록될 때까지의 시간(ms)
 */
function logWarningOnStableTimedout(time: number, console: Console): void {
  const message =
    `Angular hydration expected the ApplicationRef.isStable() to emit \`true\`, but it ` +
    `didn't happen within ${time}ms. Angular hydration logic depends on the application becoming stable ` +
    `as a signal to complete hydration process.`;

  console.warn(formatRuntimeError(RuntimeErrorCode.HYDRATION_STABLE_TIMEDOUT, message));
}
