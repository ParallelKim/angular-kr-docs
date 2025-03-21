# 백그라운드 처리를 위한 웹 워커 사용

[웹 워커](https://developer.mozilla.org/docs/Web/API/Web_Workers_API)는 CPU 집약적인 계산을 백그라운드 스레드에서 실행할 수 있게 하여, 메인 스레드가 사용자 인터페이스를 업데이트할 수 있도록 해줍니다.
CAD(Computer-Aided Design) 도면 생성이나 복잡한 기하학적 계산과 같이 많은 계산을 수행하는 애플리케이션은 성능을 향상시키기 위해 웹 워커를 사용할 수 있습니다.

도움말: Angular CLI는 웹 워커에서 자체적으로 실행되는 것을 지원하지 않습니다.

## 웹 워커 추가

기존 프로젝트에 웹 워커를 추가하려면, Angular CLI의 `ng generate` 명령을 사용하십시오.

<docs-code language="shell">

ng generate web-worker <location>

</docs-code>

애플리케이션의 어디에서나 웹 워커를 추가할 수 있습니다.
예를 들어, 루트 컴포넌트인 `src/app/app.component.ts`에 웹 워커를 추가하려면, 다음 명령을 실행하십시오.

<docs-code language="shell">

ng generate web-worker app

</docs-code>

이 명령은 다음 작업을 수행합니다.

1. 프로젝트가 웹 워커를 사용할 수 있도록 구성합니다(아직 사용하지 않는 경우).
1. 메시지를 수신하기 위해 `src/app/app.worker.ts`에 다음 스캐폴드 코드를 추가합니다.

    <docs-code language="typescript" header="src/app/app.worker.ts">

    addEventListener('message', ({ data }) => {
      const response = `worker response to ${data}`;
      postMessage(response);
    });

    </docs-code>

1. 워커를 사용하기 위해 `src/app/app.component.ts`에 다음 스캐폴드 코드를 추가합니다.

    <docs-code language="typescript" header="src/app/app.component.ts">

    if (typeof Worker !== 'undefined') {
      // 새로운 워커 생성
      const worker = new Worker(new URL('./app.worker', import.meta.url));
      worker.onmessage = ({ data }) => {
        console.log(`페이지가 메시지를 받았습니다: ${data}`);
      };
      worker.postMessage('hello');
    } else {
      // 이 환경에서는 웹 워커가 지원되지 않습니다.
      // 프로그램이 여전히 올바르게 실행되도록 대체 방법을 추가해야 합니다.
    }

    </docs-code>

이 초기 스캐폴드를 생성한 후, 워커를 통해 메시지를 주고받도록 코드를 리팩토링해야 합니다.

중요: [서버 측 렌더링](guide/ssr)에서 사용되는 `@angular/platform-server`와 같은 일부 환경 또는 플랫폼은 웹 워커를 지원하지 않습니다.

이러한 환경에서도 애플리케이션이 작동하도록 하려면, 워커가 수행할 수 있는 계산을 수행하기 위한 대체 메커니즘을 제공해야 합니다.