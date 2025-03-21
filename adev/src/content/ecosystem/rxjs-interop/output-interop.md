# RxJS 컴포넌트 및 지시자 출력과의 상호 운용성

팁: 이 가이드는 [컴포넌트 및 지시자 출력](guide/components/outputs)에 익숙하다고 가정합니다.

`@angular/rxjs-interop` 패키지는 컴포넌트 및 지시자 출력과 관련된 두 가지 API를 제공합니다.

## RxJS Observable을 기반으로 하는 출력 만들기

`outputFromObservable`을 사용하면 RxJS Observable을 기반으로 방출되는 컴포넌트 또는 지시자 출력을 생성할 수 있습니다:

<docs-code language="ts" highlight="[7]">
import {Directive} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';

@Directive({/*...*/})
class Draggable {
  pointerMoves$: Observable<PointerMovements> = listenToPointerMoves();
  
  // `pointerMoves$`가 방출될 때마다 `pointerMove` 이벤트가 발생합니다.
  pointerMove = outputFromObservable(this.pointerMoves$);
}
</docs-code>

`outputFromObservable` 함수는 Angular 컴파일러에 특별한 의미가 있습니다. **컴포넌트 및 지시자 속성 초기화기에서만 `outputFromObservable`을 호출해야 합니다.**

출력에 `subscribe`할 때 Angular는 자동으로 기본 Observable로 구독을 전달합니다. Angular는 컴포넌트 또는 지시자가 파괴될 때 값을 전달하는 것을 중지합니다.

도움이 됨: 명령형으로 값을 방출할 수 있다면 `output()`을 직접 사용하는 것을 고려하세요.

## 컴포넌트 또는 지시자 출에서 RxJS Observable 생성하기

`outputToObservable` 함수는 컴포넌트 출력에서 RxJS Observable을 생성할 수 있게 해줍니다.

<docs-code language="ts" highlight="[11]">
import {outputToObservable} from '@angular/core/rxjs-interop';

@Component(/*...*/)
class CustomSlider {
  valueChange = output<number>();
}

// `CustomSlider`에 대한 인스턴스 참조.
const slider: CustomSlider = createSlider();

outputToObservable(slider.valueChange) // Observable<number>
  .pipe(...)
  .subscribe(...);
</docs-code>

도움이 됨: 필요에 맞는다면 `OutputRef`에서 직접 `subscribe` 메서드를 사용하는 것을 고려하세요.