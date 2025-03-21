# 컴포넌트 통신을 위한 `@Output`

컴포넌트 작업 시 다른 컴포넌트에게 무언가 일이 발생했음을 알릴 필요가 있을 수 있습니다. 예를 들어 버튼이 클릭되었거나, 목록에서 항목이 추가/제거되었거나, 기타 중요한 업데이트가 발생했을 수 있습니다. 이러한 시나리오에서 컴포넌트는 부모 컴포넌트와 통신할 필요가 있습니다.

Angular는 이러한 유형의 동작을 가능하게 하기 위해 `@Output` 데코레이터를 사용합니다.

이번 활동에서는 `@Output` 데코레이터와 `EventEmitter`를 사용하여 컴포넌트와 통신하는 방법을 배울 것입니다.

<hr />

자식 컴포넌트에서 부모 컴포넌트로의 통신 경로를 만들기 위해, 클래스 속성에 `@Output` 데코레이터를 사용하고 그것에 `EventEmitter` 유형의 값을 할당합니다:

<docs-code header="child.component.ts" language="ts">
@Component({...})
class ChildComponent {
    @Output() incrementCountEvent = new EventEmitter<number>();
}
</docs-code>

이제 컴포넌트는 부모 컴포넌트에서 수신할 수 있는 이벤트를 생성할 수 있습니다. `emit` 메서드를 호출하여 이벤트를 트리거합니다:

<docs-code header="child.component.ts" language="ts">
class ChildComponent {
    ...

    onClick() {
        this.count++;
        this.incrementCountEvent.emit(this.count);
    }

}
</docs-code>

emit 함수는 `EventEmitter` 인스턴스와 동일한 유형의 이벤트를 생성합니다.

좋습니다. 이제 여러분의 차례입니다. 다음 작업을 수행하여 코드를 완성해 보십시오:

<docs-workflow>

<docs-step title="Add an `@Output` property">
`child.component.ts`를 업데이트하여 `addItemEvent`라는 출력 속성을 추가하고 EventEmitter 유형을 `string`으로 설정해야 합니다.
</docs-step>

<docs-step title="Complete `addItem` method">
`child.component.ts`에서 `addItem` 메서드를 업데이트하고, 다음 코드를 논리로 사용합니다:

<docs-code header="child.component.ts" highlight="[2]" language="ts">
addItem() {
  this.addItemEvent.emit('🐢');
}
</docs-code>

</docs-step>

<docs-step title="Update the `AppComponent` template">
`app.component.ts`에서 템플릿을 업데이트하여 다음 코드를 추가하여 방출된 이벤트를 수신합니다:

```angular-html
<app-child (addItemEvent)="addItem($event)" />
```

이제 "Add Item" 버튼을 클릭할 때마다 목록에 새로운 아이템이 추가됩니다.

</docs-step>

</docs-workflow>

우와, 이 시점에서 여러분은 컴포넌트 기초를 완료했습니다 - 인상적입니다 👏

Angular의 훌륭한 기능을 더 많이 잠금 해제하려면 계속 배우십시오.