# 서비스 워커와의 통신

서비스 워커 지원을 활성화하는 것은 서비스 워커를 등록하는 것 이상입니다. 이는 서비스 워커와 상호작용하고 애플리케이션의 캐싱을 제어하는 데 사용할 수 있는 서비스도 제공합니다.

## `SwUpdate` 서비스

`SwUpdate` 서비스는 서비스 워커가 애플리케이션에 대한 사용 가능한 업데이트를 발견하고 설치할 때를 나타내는 이벤트에 접근할 수 있도록 합니다.

`SwUpdate` 서비스는 세 가지 별도의 작업을 지원합니다:

* 서버에서 업데이트된 버전이 *감지*되었을 때, *설치되었으며* 로컬에서 사용할 준비가 되었을 때 또는 *설치 실패* 시 알림 수신.
* 서비스 워커에게 새로운 업데이트가 있는지 서버를 확인하도록 요청.
* 현재 탭에 대해 애플리케이션의 최신 버전을 활성화하도록 서비스 워커에게 요청.

### 버전 업데이트

`versionUpdates`는 `SwUpdate`의 `Observable` 속성이며, 네 가지 이벤트 유형을 발생시킵니다:

| 이벤트 유형                           | 세부 사항 |
|:---                                  |:---     |
| `VersionDetectedEvent`               | 서비스 워커가 서버에서 앱의 새 버전을 감지하고 다운로드를 시작하려고 할 때 발생합니다.                                                  |
| `NoNewVersionDetectedEvent`          | 서비스 워커가 서버에서 앱의 버전을 확인했지만 새 버전을 찾지 못했을 때 발생합니다.                                                             |
| `VersionReadyEvent`                  | 클라이언트가 활성화할 수 있는 새 버전의 앱이 있을 때 발생합니다. 이는 사용자에게 사용 가능한 업데이트를 알리거나 페이지 새로 고침을 요청하는 데 사용될 수 있습니다. |
| `VersionInstallationFailedEvent`     | 새 버전 설치가 실패했을 때 발생합니다. 이는 로깅/모니터링 목적으로 사용될 수 있습니다.                                                                     |

<docs-code header="log-update.service.ts" path="adev/src/content/examples/service-worker-getting-started/src/app/log-update.service.ts" visibleRegion="sw-update"/>

### 업데이트 확인

서비스 워커에게 서버에 배포된 업데이트가 있는지 확인하도록 요청할 수 있습니다.
서비스 워커는 초기화 중 및 각 탐색 요청(즉, 사용자가 다른 주소에서 애플리케이션으로 탐색할 때) 중에 업데이트를 확인합니다.
그러나 변경频繁한 사이트가 있거나 일정에 따라 업데이트가 발생하도록 원한다면 수동으로 업데이트를 확인할 수 있습니다.

`checkForUpdate()` 메서드를 사용하여 수행합니다:

<docs-code header="check-for-update.service.ts" path="adev/src/content/examples/service-worker-getting-started/src/app/check-for-update.service.ts"/>

이 메서드는 활성화가 가능한 업데이트가 있는지를 나타내는 `Promise<boolean>`을 반환합니다.
검사가 실패할 수 있으며, 이 경우 `Promise`가 거부됩니다.

<docs-callout important title="안정화 및 서비스 워커 등록">
페이지의 초기 렌더링에 부정적인 영향을 미치지 않도록, 기본적으로 Angular 서비스 워커 서비스는 애플리케이션이 안정화될 때까지 최대 30초 동안 대기한 후 ServiceWorker 스크립트를 등록합니다.

예를 들어, [setInterval()](https://developer.mozilla.org/docs/Web/API/WindowOrWorkerGlobalScope/setInterval) 또는 RxJS의 [interval()](https://rxjs.dev/api/index/function/interval)을 사용하여 업데이트를 지속적으로 폴링하면 애플리케이션이 안정화되지 못하고, 30초 제한에 도달할 때까지 ServiceWorker 스크립트가 브라우저에 등록되지 않습니다.

이는 애플리케이션에 의해 수행되는 모든 종류의 폴링에 해당합니다.
자세한 내용은 [isStable](api/core/ApplicationRef#isStable) 문서를 참조하십시오.

업데이트를 폴링하기 시작하기 전에 애플리케이션이 먼저 안정화될 때까지 기다려 딜레이를 피하도록 하세요. 이전의 예제처럼요.
대안으로, ServiceWorker에 대해 다른 [등록 전략](api/service-worker/SwRegistrationOptions#registrationStrategy)을 정의할 수도 있습니다.
</docs-callout>

### 최신 버전으로 업데이트하기

새 버전이 준비되면 페이지를 새로 고쳐 기존 탭을 최신 버전으로 업데이트할 수 있습니다.
사용자의 진행 상황이 방해받지 않도록 일반적으로 사용자를 프롬프트하여 페이지를 새로 고치고 최신 버전으로 업데이트해도 괜찮다고 확인하도록 하는 것이 좋습니다:

<docs-code header="prompt-update.service.ts" path="adev/src/content/examples/service-worker-getting-started/src/app/prompt-update.service.ts" visibleRegion="sw-version-ready"/>

<docs-callout important title="페이지 새로 고침 없이 업데이트의 안전성">
`activateUpdate()`를 호출하면 페이지를 새로 고침하지 않고 탭을 최신 버전으로 업데이트하지만, 이것은 애플리케이션을 깨뜨릴 수 있습니다.

새로 고침 없이 업데이트하면 애플리케이션 셸과 lazy-loaded 청크와 같은 기타 페이지 리소스 간에 버전 불일치가 발생할 수 있으며, 이러한 리소스의 파일 이름은 버전 간에 변경될 수 있습니다.

특정 사용 사례에 대해 안전하다고 확신하는 경우에만 `activateUpdate()`를 사용해야 합니다.
</docs-callout>

### 복구 불가능한 상태 처리

일부 경우, 서비스 워커가 클라이언트에 서비스를 제공하는 데 사용하는 애플리케이션의 버전이 전체 페이지 새로 고침 없이 복구할 수 없는 손상된 상태일 수 있습니다.

예를 들어, 다음 시나리오를 가정해 보십시오:

1. 사용자가 애플리케이션을 처음 열고 서비스 워커가 애플리케이션의 최신 버전을 캐싱합니다.
    애플리케이션의 캐시된 자산에는 `index.html`, `main.<main-hash-1>.js` 및 `lazy-chunk.<lazy-hash-1>.js`가 포함됩니다.

1. 사용자가 애플리케이션을 닫고 잠시 동안 열지 않습니다.
1. 시간이 지나고 애플리케이션의 새로운 버전이 서버에 배포됩니다.
    이 새로운 버전에는 `index.html`, `main.<main-hash-2>.js` 및 `lazy-chunk.<lazy-hash-2>.js` 파일이 포함됩니다.

중요: 현재 해시가 다르므로 파일의 내용이 변경되었습니다. 이전 버전은 더 이상 서버에서 사용할 수 없습니다.

1. 그 사이에 사용자의 브라우저는 `lazy-chunk.<lazy-hash-1>.js`를 캐시에서 퇴출하기로 결정합니다.
    브라우저는 디스크 공간을 회수하기 위해 캐시에서 특정(또는 모든) 리소스를 퇴출하기로 결정할 수 있습니다.

1. 사용자가 애플리케이션을 다시 엽니다.
    서비스 워커는 이 시점에서 알고 있는 최신 버전인 이전 버전(`index.html` 및 `main.<main-hash-1>.js`)을 제공합니다.

1. 이후에 애플리케이션이 lazy 번들인 `lazy-chunk.<lazy-hash-1>.js`를 요청합니다.
1. 서비스 워커는 캐시에서 자산을 찾을 수 없습니다(브라우저가 이를 퇴출했기 때문임을 기억하십시오).
    또한 서버에서 이를 검색할 수 없습니다(서버에는 이제 새로운 버전에서 `lazy-chunk.<lazy-hash-2>.js`만 있습니다).

앞의 시나리오에서 서비스 워커는 일반적으로 캐시된 자산을 제공할 수 없습니다.
특정 애플리케이션 버전이 손상되어 클라이언트의 상태를 페이지를 새로 고침하지 않고 수정할 방법이 없습니다.
이러한 경우, 서비스 워커는 `UnrecoverableStateEvent` 이벤트를 보내 클라이언트를 알립니다.
`SwUpdate#unrecoverable`를 구독하여 알림을 받고 이러한 오류를 처리하세요.

<docs-code header="handle-unrecoverable-state.service.ts" path="adev/src/content/examples/service-worker-getting-started/src/app/handle-unrecoverable-state.service.ts" visibleRegion="sw-unrecoverable-state"/>

## Angular 서비스 워커에 대한 더 많은 정보

다음 내용에도 관심이 있을 수 있습니다:

<docs-pill-row>
  <docs-pill href="ecosystem/service-workers/push-notifications" title="푸시 알림"/>
  <docs-pill href="ecosystem/service-workers/devops" title="서비스 워커 DevOps"/>
</docs-pill-row>