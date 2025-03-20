# RxJS와 Angular 신호 간의 상호 운용성

중요: RxJS Interop 패키지는 [개발자 미리 보기](reference/releases#developer-preview)로 제공됩니다. 시도할 준비가 되었지만 안정화되기 전까지 변경될 수 있습니다.

`@angular/rxjs-interop` 패키지는 RxJS와 Angular 신호를 통합하는 데 도움이 되는 API를 제공합니다.

## `toSignal`로 RxJs Observable에서 신호 만들기

`toSignal` 함수를 사용하여 Observable의 값을 추적하는 신호를 생성합니다. 이는 템플릿의 `async` 파이프와 유사하게 동작하지만 더 유연하며 애플리케이션의 어디에서나 사용할 수 있습니다.

```ts
import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { interval } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  template: `{{ counter() }}`,
})
export class Ticker {
  counterObservable = interval(1000);

  // `counterObservable`의 값을 나타내는 `Signal`을 가져옴.
  counter = toSignal(this.counterObservable, {initialValue: 0});
}
```

`async` 파이프와 마찬가지로 `toSignal`은 Observable에 즉시 구독하여 부작용을 발생시킬 수 있습니다. `toSignal`로 생성된 구독은 `toSignal`을 호출하는 컴포넌트나 서비스가 파괴될 때 자동으로 주어진 Observable에서 구독을 해제합니다.

중요: `toSignal`은 구독을 생성합니다. 동일한 Observable에 대해 반복해서 호출하는 것은 피하고 대신 반환된 신호를 재사용해야 합니다.

### 주입 컨텍스트

기본적으로 `toSignal`은 컴포넌트나 서비스의 생성 중과 같은 [주입 컨텍스트](guide/di/dependency-injection-context) 내에서 실행되어야 합니다. 주입 컨텍스트를 사용할 수 없는 경우 수동으로 사용할 `Injector`를 지정할 수 있습니다.

### 초기 값

Observable은 구독 시 동기적으로 값을 생성하지 않을 수 있지만, 신호는 항상 현재 값을 요구합니다. `toSignal` 신호의 이 "초기" 값을 처리하는 여러 가지 방법이 있습니다.

#### `initialValue` 옵션

위의 예와 같이, Observable이 처음으로 값을 방출하기 전에 신호가 반환해야 하는 값을 가진 `initialValue` 옵션을 지정할 수 있습니다.

#### `undefined` 초기 값

`initialValue`를 제공하지 않으면, 결과 신호는 Observable이 방출될 때까지 `undefined`를 반환합니다. 이는 `async` 파이프의 `null` 반환 동작과 유사합니다.

#### `requireSync` 옵션

일부 Observable은 `BehaviorSubject`와 같은 동기적으로 방출될 것을 보장합니다. 이러한 경우 `requireSync: true` 옵션을 지정할 수 있습니다.

`requiredSync`가 `true`일 때, `toSignal`은 구독 시 Observable이 동기적으로 방출되도록 보장합니다. 이는 신호가 항상 값을 가지도록 보장하며, `undefined` 유형이나 초기 값이 필요하지 않습니다.

### `manualCleanup`

기본적으로 `toSignal`은 그것을 생성한 컴포넌트나 서비스가 파괴될 때 Observable에서 자동으로 구독을 해제합니다.

이 동작을 재정의하려면 `manualCleanup` 옵션을 전달할 수 있습니다. 이 설정은 자연적으로 완료되는 Observable에 사용할 수 있습니다.

### 오류 및 완료

`toSignal`에서 사용된 Observable이 오류를 발생시키면, 그 오류는 신호가 읽힐 때 발생합니다.

`toSignal`에서 사용된 Observable이 완료되면, 신호는 완료 전 마지막으로 방출된 값을 계속 반환합니다.

## 신호에서 RxJS Observable 만들기 `toObservable`

`toObservable` 유틸리티를 사용하여 신호의 값을 추적하는 `Observable`을 생성합니다. 신호의 값은 변할 때 Observable에 값을 방출하는 `effect`로 모니터링됩니다.

```ts
import { Component, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Component(...)
export class SearchResults {
  query: Signal<string> = inject(QueryService).query;
  query$ = toObservable(this.query);

  results$ = this.query$.pipe(
    switchMap(query => this.http.get('/search?q=' + query ))
  );
}
```

`query` 신호가 변경됨에 따라 `query$` Observable은 최신 쿼리를 방출하고 새로운 HTTP 요청을 트리거합니다.

### 주입 컨텍스트

기본적으로 `toObservable`은 컴포넌트나 서비스의 생성 중과 같은 [주입 컨텍스트](guide/di/dependency-injection-context) 내에서 실행되어야 합니다. 주입 컨텍스트를 사용할 수 없는 경우 수동으로 사용할 `Injector`를 지정할 수 있습니다.

### `toObservable`의 타이밍

`toObservable`은 `ReplaySubject`에서 신호의 값을 추적하기 위해 effect를 사용합니다. 구독 시 첫 번째 값(가능한 경우)은 동기적으로 방출될 수 있으며, 이후의 모든 값은 비동기적으로 방출됩니다.

Observable과 달리 신호는 변경에 대한 동기 알림을 제공하지 않습니다. 신호의 값을 여러 번 업데이트하더라도, `toObservable`은 신호가 안정화된 후에만 값을 방출합니다.

```ts
const obs$ = toObservable(mySignal);
obs$.subscribe(value => console.log(value));

mySignal.set(1);
mySignal.set(2);
mySignal.set(3);
```

여기서 마지막 값(3)만이 로그에 기록됩니다.