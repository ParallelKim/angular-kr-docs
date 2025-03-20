# 푸시 알림

푸시 알림은 사용자와 상호작용할 수 있는 매력적인 방법입니다.
서비스 워커의 힘을 통해, 애플리케이션이 포커스되고 있지 않을 때에도 푸시 알림을 장치로 전송할 수 있습니다.

Angular 서비스 워커는 푸시 알림의 표시와 알림 클릭 이벤트의 처리를 가능하게 합니다.

도움말: Angular 서비스 워커를 사용할 때, 푸시 알림 상호작용은 `SwPush` 서비스를 사용하여 처리됩니다.
브라우저 API에 대해 더 알아보려면 [푸시 API](https://developer.mozilla.org/docs/Web/API/Push_API) 및 [알림 API 사용](https://developer.mozilla.org/docs/Web/API/Notifications_API/Using_the_Notifications_API)을 참조하세요.

## 알림 페이로드

유효한 페이로드로 메시지를 푸시하여 푸시 알림을 호출합니다.
안내는 `SwPush`를 참조하세요.

도움말: Chrome에서는 백엔드 없이 푸시 알림을 테스트할 수 있습니다.
Devtools -> 응용 프로그램 -> 서비스 워커를 열고 `푸시` 입력을 사용하여 JSON 알림 페이로드를 전송하세요.

## 알림 클릭 처리

`notificationclick` 이벤트에 대한 기본 동작은 알림을 닫고 `SwPush.notificationClicks`에 알립니다.

`data` 객체에 `onActionClick` 속성을 추가하고 `default` 항목을 제공하여 `notificationclick`에서 실행될 추가 작업을 지정할 수 있습니다.
이는 알림이 클릭될 때 열려 있는 클라이언트가 없을 경우 특히 유용합니다.

<docs-code language="json">

{
  "notification": {
    "title": "새 알림!",
    "data": {
      "onActionClick": {
        "default": {"operation": "openWindow", "url": "foo"}
      }
    }
  }
}

</docs-code>

### 작업

Angular 서비스 워커는 다음 작업을 지원합니다:

| 작업                       | 세부정보 |
|:---                        |:---      |
| `openWindow`                | 지정된 URL에서 새 탭을 엽니다.                                                                                                            |
| `focusLastFocusedOrOpen`    | 마지막으로 포커스된 클라이언트에 포커스를 맞춥니다. 클라이언트가 열려 있지 않으면 지정된 URL에서 새 탭을 엽니다.                                       |
| `navigateLastFocusedOrOpen` | 마지막으로 포커스된 클라이언트에 포커스를 맞추고 지정된 URL로 이동합니다. 클라이언트가 열려 있지 않으면 지정된 URL에서 새 탭을 엽니다. |
| `sendRequest`               | 지정된 URL로 간단한 GET 요청을 전송합니다.                                                                                                                                                          |

중요: URL은 서비스 워커의 등록 범위에 상대적으로 해결됩니다.<br />`onActionClick` 항목이 `url`을 정의하지 않으면 서비스 워커의 등록 범위가 사용됩니다.

### 작업

작업은 사용자가 알림과 상호작용할 수 있는 방식을 사용자 정의할 수 있는 방법을 제공합니다.

`actions` 속성을 사용하여 사용 가능한 작업 집합을 정의할 수 있습니다.
각 작업은 사용자가 클릭하여 알림과 상호작용할 수 있는 작업 버튼으로 표시됩니다.

또한, `data` 객체의 `onActionClick` 속성을 사용하여 각 작업을 해당 작업 버튼이 클릭될 때 수행할 작업에 연결할 수 있습니다:

<docs-code language="typescript">

{
  "notification": {
    "title": "새 알림!",
    "actions": [
      {"action": "foo", "title": "새 탭 열기"},
      {"action": "bar", "title": "마지막으로 포커스"},
      {"action": "baz", "title": "마지막으로 이동"},
      {"action": "qux", "title": "백그라운드에서 요청 전송"},
      {"action": "other", "title": "기존 클라이언트에 알림만 보내기"}
    ],
    "data": {
      "onActionClick": {
        "default": {"operation": "openWindow"},
        "foo": {"operation": "openWindow", "url": "/absolute/path"},
        "bar": {"operation": "focusLastFocusedOrOpen", "url": "relative/path"},
        "baz": {"operation": "navigateLastFocusedOrOpen", "url": "https://other.domain.com/"},
        "qux": {"operation": "sendRequest", "url": "https://yet.another.domain.com/"}
      }
    }
  }
}

</docs-code>

중요: 작업에 해당 `onActionClick` 항목이 없는 경우, 알림은 닫히고 `SwPush.notificationClicks`가 기존 클라이언트에 알립니다.

## Angular 서비스 워커에 대한 더 많은 정보

다음 정보에 관심이 있을 수도 있습니다:

<docs-pill-row>

  <docs-pill href="ecosystem/service-workers/communications" title="서비스 워커와의 통신"/>
  <docs-pill href="ecosystem/service-workers/devops" title="서비스 워커 DevOps"/>
</docs-pill-row>