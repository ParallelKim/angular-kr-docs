# Observable에서 데이터 언래핑하기

Observable은 애플리케이션의 여러 부분 간에 메시지를 전달할 수 있게 해줍니다.
이벤트 처리, 비동기 프로그래밍, 여러 값 처리를 위해 observable을 사용할 수 있습니다.
Observable은 어떤 유형의 단일 또는 다중 값을 동기적으로(함수가 호출자에게 값을 전달하는 방식으로) 또는 비동기적으로 일정에 따라 제공할 수 있습니다.

내장된 [`AsyncPipe`](api/common/AsyncPipe "API description of AsyncPipe")를 사용하여 observable을 입력으로 받아들이고 입력을 자동으로 구독하십시오.
이 파이프가 없으면 구성 요소 코드는 observable의 값을 사용하기 위해 구독하고, 해결된 값을 추출하고, 바인딩을 위해 노출하며, 메모리 누수를 방지하기 위해 observable이 파괴될 때 구독을 취소해야 합니다.
`AsyncPipe`는 구독을 유지하고 observable에서 값을 도착할 때마다 계속 전달하는 데 필요한 보일러플레이트 코드를 구성 요소에서 저장하는 파이프입니다.

다음 코드 예제는 메시지 문자열의 observable(`message$`)을 `async` 파이프가 있는 뷰에 바인딩합니다.

<!-- TODO: Enable preview if this example does not depend on Zone/ or if we run the example with Zone. -->
<docs-code header="src/app/hero-async-message.component.ts"
           path="adev/src/content/examples/pipes/src/app/hero-async-message.component.ts" />