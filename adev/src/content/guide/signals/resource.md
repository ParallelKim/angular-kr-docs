# 비동기 반응성 자원

중요: `resource`는 [실험적](reference/releases#experimental)입니다. 사용해볼 수 있지만, 안정화되기 전에 변경될 수 있습니다.

대부분의 신호 API는 동기적입니다 — `signal`, `computed`, `input` 등. 그러나 애플리케이션은 종종 비동기적으로 사용할 수 있는 데이터로 작업해야 합니다. `Resource`는 비동기 데이터를 애플리케이션의 신호 기반 코드에 통합할 수 있는 방법을 제공합니다.

`Resource`를 사용하여 모든 유형의 비동기 작업을 수행할 수 있지만, `Resource`의 가장 일반적인 사용 사례는 서버에서 데이터를 가져오는 것입니다. 다음 예제는 몇 가지 사용자 데이터를 가져오기 위해 리소스를 생성합니다.

`Resource`를 생성하는 가장 쉬운 방법은 `resource` 함수입니다.

```typescript
import {resource, Signal} from '@angular/core';

const userId: Signal<string> = getUserId();

const userResource = resource({
  // 반응형 요청 계산을 정의합니다.
  // 요청 값은 읽기 신호가 변경될 때마다 다시 계산됩니다.
  request: () => ({id: userId()}),

  // 데이터를 검색하는 비동기 로더를 정의합니다.
  // 리소스는 `request` 값이 변경될 때마다 이 함수를 호출합니다.
  loader: ({request}) => fetchUser(request),
});

// 리소스의 로더 함수 결과를 기반으로 계산된 신호를 생성합니다.
const firstName = computed(() => userResource.value().firstName);
```

`resource` 함수는 `request`와 `loader`의 두 가지 주요 속성을 갖는 `ResourceOptions` 객체를 받아들입니다.

`request` 속성은 요청 값을 생성하는 반응형 계산을 정의합니다. 이 계산에서 읽는 신호가 변경될 때마다 리소스는 새 요청 값을 생성합니다. 이는 `computed`와 유사합니다.

`loader` 속성은 일부 상태를 검색하는 비동기 함수인 `ResourceLoader`를 정의합니다. 리소스는 `request` 계산이 새 값을 생성할 때마다 로더를 호출하고, 해당 값을 로더에 전달합니다. 더 많은 세부정보는 아래의 [Resource loaders](#resource-loaders)를 참조하십시오.

`Resource`에는 로더의 결과를 포함하는 `value` 신호가 있습니다.

## Resource loaders

리소스를 생성할 때 `ResourceLoader`를 지정합니다. 이 로더는 단일 매개변수인 `ResourceLoaderParams` 객체를 수락하고 값을 반환하는 비동기 함수입니다.

`ResourceLoaderParams` 객체는 세 가지 속성을 포함합니다: `request`, `previous`, 및 `abortSignal`.

| 속성          | 설명                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`     | 리소스의 `request` 계산 값입니다.                                                                                               |
| `previous`    | 이전 `ResourceStatus`를 포함하는 `status` 속성을 가진 객체입니다.                                                                    |
| `abortSignal` | [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)입니다. 요청 중단에 대한 세부정보는 아래의 [Aborting requests](#aborting-requests)를 참조하십시오. |


`request` 계산이 `undefined`를 반환하면 로더 함수는 실행되지 않으며 리소스 상태는 `Idle`이 됩니다.

### 요청 중단

리소스는 로딩 중일 때 `request` 계산이 변경되면 미결 요청을 중단합니다.

`ResourceLoaderParams`의 `abortSignal`을 사용하여 중단된 요청에 응답할 수 있습니다. 예를 들어, 기본 제공 `fetch` 함수는 `AbortSignal`을 수락합니다:

```typescript
const userId: Signal<string> = getUserId();

const userResource = resource({
  request: () => ({id: userId()}),
  loader: ({request, abortSignal}): Promise<User> => {
    // fetch는 주어진 `AbortSignal`이 요청이 중단되었음을 나타내면
    // 모든 미결 HTTP 요청을 취소합니다.
    return fetch(`users/${request.id}`, {signal: abortSignal});
  },
});
```

요청 취소에 대한 더 많은 세부정보는 [`AbortSignal` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)을 참조하십시오.

### 로딩 다시 시작

`reload` 메서드를 호출하여 프로그래밍적으로 자원의 `loader`를 트리거할 수 있습니다.

```typescript
const userId: Signal<string> = getUserId();

const userResource = resource({
  request: () => ({id: userId()}),
  loader: ({request}) => fetchUser(request),
});

// ...

userResource.reload();
```

## 자원 상태

리소스 객체에는 비동기 로더의 상태를 읽기 위한 여러 신호 속성이 있습니다.

| 속성        | 설명                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| `value`     | 리소스의 가장 최근 값, 값이 수신되지 않은 경우 `undefined`입니다.                            |
| `hasValue`  | 리소스에 값이 있는지 여부입니다.                                                                               |
| `error`     | 리소스의 로더를 실행하는 동안 발생한 가장 최근의 오류, 오류가 발생하지 않으면 `undefined`입니다. |
| `isLoading` | 리소스 로더가 현재 실행 중인지 여부입니다.                                                               |
| `status`    | 아래에 설명된 리소스의 특정 `ResourceStatus`입니다.                                                   |

`status` 신호는 리소스의 상태를 설명하는 특정 `ResourceStatus`를 제공합니다.

| 상태        | `value()`         | 설명                                                                  |
| ----------- | :---------------- | ---------------------------------------------------------------------------- |
| `Idle`      | `undefined`       | 리소스에 유효한 요청이 없으며 로더가 실행되지 않았습니다.                |
| `Error`     | `undefined`       | 로더가 오류를 Encounter했습니다.                                         |
| `Loading`   | `undefined`       | `request` 값의 변경으로 인해 로더가 실행 중입니다.           |
| `Reloading` | 이전 값          | 리소스의 `reload` 메서드 호출로 인해 로더가 실행 중입니다. |
| `Resolved`  | 해결된 값         | 로더가 완료되었습니다.                                                    |
| `Local`     | 로컬로 설정된 값 | 리소스의 값이 `.set()` 또는 `.update()`를 통해 로컬로 설정되었습니다.        |

이 상태 정보를 사용하여 로딩 표시 및 오류 메시지와 같은 사용자 인터페이스 요소를 조건부로 표시할 수 있습니다.