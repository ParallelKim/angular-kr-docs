# 고급 구성 요소 설정

팁: 이 가이드는 이미 [필수 가이드](essentials)를 읽었다고 가정합니다. Angular에 익숙하지 않다면 먼저 그것을 읽으세요.

## ChangeDetectionStrategy

`@Component` 데코레이터는 구성 요소의 **변경 감지 모드**를 제어하는 `changeDetection` 옵션을 받습니다. 변경 감지 모드 옵션은 두 가지가 있습니다.

**`ChangeDetectionStrategy.Default`**는 말할 필요도 없이 기본 전략입니다. 이 모드에서는 Angular가 응용 프로그램 전반에 어떤 활동이 발생했을 때 구성 요소의 DOM이 업데이트되어야 하는지를 확인합니다. 이 확인을 트리거하는 활동에는 사용자 상호작용, 네트워크 응답, 타이머 등이 포함됩니다.

**`ChangeDetectionStrategy.OnPush`**는 Angular가 수행해야 하는 검사의 양을 줄이는 선택적 모드입니다. 이 모드에서는 프레임워크가 구성 요소의 DOM이 업데이트되어야 하는지를 확인할 때 다음과 같은 경우에만 확인합니다:

- 템플릿의 바인딩 결과로 구성 요소 입력에 변경이 발생한 경우, 또는
- 이 구성 요소의 이벤트 리스너가 실행되는 경우
- `ChangeDetectorRef.markForCheck` 또는 `AsyncPipe`와 같이 그것을 감싸는 것을 통해 구성 요소가 명시적으로 체크하기 위해 표시된 경우.

추가로, OnPush 구성 요소가 체크될 때 Angular는 _또한_ 애플리케이션 트리를 통해 위쪽으로 이동하면서 모든 조상 구성 요소를 체크합니다.

## PreserveWhitespaces

기본적으로 Angular는 템플릿에서 불필요한 공백을 제거하고 축소합니다. 일반적으로 줄 바꿈 및 들여쓰기를 제거합니다. 구성 요소의 메타데이터에서 `preserveWhitespaces`를 `true`로 명시적으로 설정하여 이 설정을 변경할 수 있습니다.

## 사용자 정의 요소 스키마

기본적으로 Angular는 알 수 없는 HTML 요소를 만났을 때 오류를 발생시킵니다. 구성 요소 메타데이터의 `schemas` 속성에 `CUSTOM_ELEMENTS_SCHEMA`를 포함하여 이 동작을 비활성화할 수 있습니다.

```angular-ts
import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

@Component({
  ...,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<some-unknown-component></some-unknown-component>'
})
export class ComponentWithCustomElements { }
```

현재 Angular는 다른 스키마를 지원하지 않습니다.