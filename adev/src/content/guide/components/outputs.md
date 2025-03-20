# 사용자 정의 이벤트와 출력

팁: 이 가이드는 이미 [필수 가이드](essentials)를 읽었다고 가정합니다. Angular에 익숙하지 않다면 먼저 해당 내용을 읽어보세요.

Angular 구성 요소는 `output` 함수에 속성을 할당하여 사용자 정의 이벤트를 정의할 수 있습니다:

<docs-code language="ts" highlight="3">
@Component({/*...*/})
export class ExpandablePanel {
  panelClosed = output<void>();
}
</docs-code>

```angular-html
<expandable-panel (panelClosed)="savePanelState()" />
```

`output` 함수는 `OutputEmitterRef`를 반환합니다. `OutputEmitterRef`에서 `emit` 메서드를 호출하여 이벤트를 발생시킬 수 있습니다:

<docs-code language="ts" highlight="">
  this.panelClosed.emit();
</docs-code>

Angular는 `output` 함수로 초기화된 속성을 **출력**이라고 합니다. 출력은 클릭과 같은 기본 브라우저 이벤트와 유사하게 사용자 정의 이벤트를 발생시키는 데 사용할 수 있습니다.

**Angular 사용자 정의 이벤트는 DOM에서 버블링되지 않습니다.**

**출력 이름은 대소문자를 구분합니다.**

구성 요소 클래스를 확장할 때 **출력은 자식 클래스에 상속됩니다.**

`output` 함수는 Angular 컴파일러에 특별한 의미가 있습니다. **구성 요소 및 지시문 속성 초기화자에서만 `output`을 호출할 수 있습니다.**

## 이벤트 데이터 발생

`emit` 호출 시 이벤트 데이터를 전달할 수 있습니다:

<docs-code language="ts" highlight="">
// 원시 값을 발생시킬 수 있습니다.
this.valueChanged.emit(7);

// 사용자 정의 이벤트 객체를 발생시킬 수 있습니다.
this.thumbDropped.emit({
  pointerX: 123,
  pointerY: 456,
})
</docs-code>

템플릿에서 이벤트 리스너를 정의할 때 `$event` 변수를 통해 이벤트 데이터에 접근할 수 있습니다:

```angular-html
<custom-slider (valueChanged)="logValue($event)" />
```

## 출력 이름 사용자 지정

`output` 함수는 템플릿에서 이벤트의 다른 이름을 지정할 수 있는 매개변수를 받습니다:

<docs-code language="ts" highlight="">
@Component({/*...*/})
export class CustomSlider {
  changed = output({alias: 'valueChanged'});
}
</docs-code>

```angular-html
<custom-slider (valueChanged)="saveVolume()" />
```

이 별칭은 TypeScript 코드에서 속성 사용에 영향을 미치지 않습니다.

구성 요소의 출력에 별칭을 사용하는 것을 일반적으로 피해야 하지만, 이 기능은 원래 이름에 대한 별칭을 유지하면서 속성의 이름을 변경하거나 기본 DOM 이벤트의 이름과 충돌을 피하는 데 유용할 수 있습니다.

## 프로그래밍 방식으로 출력 구독

구성 요소를 동적으로 만들 때 구성 요소 인스턴스에서 출력 이벤트를 프로그래밍 방식으로 구독할 수 있습니다. `OutputRef` 유형은 `subscribe` 메서드를 포함합니다:

```ts
const someComponentRef: ComponentRef<SomeComponent> = viewContainerRef.createComponent(/*...*/);

someComponentRef.instance.someEventProperty.subscribe(eventData => {
  console.log(eventData);
});
```

Angular는 구독자가 있는 구성 요소를 파괴할 때 자동으로 이벤트 구독을 정리합니다. 또는 이벤트에서 수동으로 구독을 취소할 수 있습니다. `subscribe` 함수는 `unsubscribe` 메서드가 있는 `OutputRefSubscription`을 반환합니다:

```typescript
const eventSubscription = someComponent.someEventProperty.subscribe(eventData => {
  console.log(eventData);
});

// ...

eventSubscription.unsubscribe();
```

## 이벤트 이름 선택하기

DOM 요소의 이벤트와 충돌하는 출력 이름을 선택하지 않도록 하세요. 이름 충돌은 연결된 속성이 구성 요소에 속하는지 DOM 요소에 속하는지에 대한 혼란을 초래합니다.

구성 요소 선택자처럼 구성 요소 출력에 접두사를 추가하지 마세요. 주어진 요소는 하나의 구성 요소만 호스팅할 수 있으므로 모든 사용자 정의 속성은 구성 요소에 속한다고 가정할 수 있습니다.

항상 [camelCase](https://en.wikipedia.org/wiki/Camel_case) 출력 이름을 사용하세요. "on"으로 출력 이름에 접두사를 추가하는 것은 피하세요.

## RxJS와 함께 출력 사용하기

출력과 RxJS 간의 상호 운용성에 대한 자세한 내용은 [RxJS와 구성 요소 및 지시문 출력을 이용한 상호 운용](ecosystem/rxjs-interop/output-interop)을 참조하세요.

## `@Output` 데코레이터로 출력 선언하기

팁: Angular 팀은 새로운 프로젝트에 `output` 함수를 사용하는 것을 권장하지만, 원래의 데코레이터 기반 `@Output` API는 여전히 완전히 지원됩니다.

대신 새 `EventEmitter`에 속성을 할당하고 `@Output` 데코레이터를 추가하여 사용자 정의 이벤트를 정의할 수 있습니다:

<docs-code language="ts" highlight="">
@Component({/*...*/})
export class ExpandablePanel {
  @Output() panelClosed = new EventEmitter<void>();
}
</docs-code>

`EventEmitter`에서 `emit` 메서드를 호출하여 이벤트를 발생시킬 수 있습니다.

### `@Output` 데코레이터의 별칭

`@Output` 데코레이터는 템플릿에서 이벤트의 다른 이름을 지정할 수 있는 매개변수를 받습니다:

<docs-code language="ts" highlight="">
@Component({/*...*/})
export class CustomSlider {
  @Output('valueChanged') changed = new EventEmitter<number>();
}
</docs-code>

```angular-html
<custom-slider (valueChanged)="saveVolume()" />
```

이 별칭은 TypeScript 코드에서 속성 사용에 영향을 미치지 않습니다.

## `@Component` 데코레이터에서 출력 지정하기

`@Output` 데코레이터 외에도 `@Component` 데코레이터의 `outputs` 속성을 사용하여 구성 요소의 출력을 지정할 수 있습니다. 이는 구성 요소가 기본 클래스에서 속성을 상속받을 때 유용할 수 있습니다:

<docs-code language="ts" highlight="">
// `CustomSlider`는 `BaseSlider`에서 `valueChanged` 속성을 상속합니다.
@Component({
  /*...*/
  outputs: ['valueChanged'],
})
export class CustomSlider extends BaseSlider {}
</docs-code>

별칭을 지정할 경우 문자열에서 콜론 뒤에 별칭을 적어 `outputs` 목록에서 별칭을 추가할 수 있습니다:

<docs-code language="ts" highlight="">
// `CustomSlider`는 `BaseSlider`에서 `valueChanged` 속성을 상속합니다.
@Component({
  /*...*/
  outputs: ['valueChanged: volumeChanged'],
})
export class CustomSlider extends BaseSlider {}
</docs-code>