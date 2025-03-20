# 템플릿의 변수

Angular는 템플릿에서 두 가지 유형의 변수 선언을 제공합니다: 로컬 템플릿 변수와 템플릿 참조 변수.

## `@let`을 사용한 로컬 템플릿 변수

Angular의 `@let` 구문은 로컬 변수를 정의하고 템플릿 전반에 걸쳐 재사용할 수 있도록 허용하며, 이는 [JavaScript `let` 구문](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)과 유사합니다.

### `@let` 사용하기

`@let`을 사용하여 템플릿 표현식의 결과에 기반한 값을 가지는 변수를 선언합니다. Angular는 주어진 표현식에 따라 변수의 값을 자동으로 최신 상태로 유지합니다, 이는 [바인딩](./bindings)과 유사합니다.

```angular-html
@let name = user.name;
@let greeting = 'Hello, ' + name;
@let data = data$ | async;
@let pi = 3.1459;
@let coordinates = {x: 50, y: 100};
@let longExpression = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit ' +
                      'sed do eiusmod tempor incididunt ut labore et dolore magna ' +
                      'Ut enim ad minim veniam...';
```

각 `@let` 블록은 정확히 하나의 변수를 선언할 수 있습니다. 같은 블록 내에서 여러 변수를 쉼표로 선언할 수는 없습니다.

### `@let`의 값 참조하기

`@let`으로 변수를 선언한 후, 같은 템플릿 내에서 재사용할 수 있습니다:

```angular-html
@let user = user$ | async;

@if (user) {
  <h1>Hello, {{user.name}}</h1>
  <user-avatar [photo]="user.photo"/>

  <ul>
    @for (snack of user.favoriteSnacks; track snack.id) {
      <li>{{snack.name}}</li>
    }
  </ul>

  <button (click)="update(user)">프로필 업데이트</button>
}
```

### 할당 가능성

`@let`과 JavaScript의 `let` 간의 주요 차이점은 `@let`은 선언 후 재할당할 수 없다는 것입니다. 그러나 Angular는 주어진 표현식에 따라 변수의 값을 자동으로 최신 상태로 유지합니다.

```angular-html
@let value = 1;

<!-- 유효하지 않음 - 작동하지 않음! -->
<button (click)="value = value + 1">값 증가</button>
```

### 변수 범위

`@let` 선언은 현재 뷰와 그 하위 요소에 대한 범위를 가집니다. Angular는 컴포넌트 경계에서 새로운 뷰를 생성하며, 템플릿이 동적 콘텐츠를 포함할 수 있는 곳에서도 마찬가지입니다, 예를 들어 제어 흐름 블록, `@defer` 블록, 또는 구조 지시문 등이 있습니다.

`@let` 선언은 호이스팅되지 않기 때문에, 부모 뷰나 형제 요소에서 **접근할 수 없습니다**:

```angular-html
@let topLevel = value;

<div>
  @let insideDiv = value;
</div>

{{topLevel}} <!-- 유효함 -->
{{insideDiv}} <!-- 유효함 -->

@if (condition) {
  {{topLevel + insideDiv}} <!-- 유효함 -->

  @let nested = value;

  @if (condition) {
    {{topLevel + insideDiv + nested}} <!-- 유효함 -->
  }
}

<div *ngIf="condition">
  {{topLevel + insideDiv}} <!-- 유효함 -->

  @let nestedNgIf = value;

  <div *ngIf="condition">
     {{topLevel + insideDiv + nestedNgIf}} <!-- 유효함 -->
  </div>
</div>

{{nested}} <!-- 오류, @if에서 호이스팅되지 않음 -->
{{nestedNgIf}} <!-- 오류, *ngIf에서 호이스팅되지 않음 -->
```

### 전체 구문

`@let` 구문은 공식적으로 다음과 같이 정의됩니다:

- `@let` 키워드.
- 줄 바꿈을 포함하지 않는 하나 이상의 공백으로 이어짐.
- 유효한 JavaScript 이름과 0개 이상의 공백으로 이어짐.
- `=` 기호와 0개 이상의 공백으로 이어짐.
- 다중 줄일 수 있는 Angular 표현식으로 이어짐.
- `;` 기호로 종료됨.

## 템플릿 참조 변수

템플릿 참조 변수는 템플릿 내의 요소에서 값을 참조하는 변수를 선언하는 방법을 제공합니다.

템플릿 참조 변수는 다음을 참조할 수 있습니다:

- 템플릿 내의 DOM 요소(사용자 정의 요소 포함 [custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements))
- Angular 컴포넌트 또는 지시문
- [TemplateRef](/api/core/TemplateRef)여서 [ng-template](/api/core/ng-template)에서

템플릿 참조 변수를 사용하여 템플릿의 한 부분에서 다른 부분으로 정보를 읽을 수 있습니다.

### 템플릿 참조 변수를 선언하기

해시 문자(`#`)로 시작하는 속성을 추가하여 템플릿의 요소에 변수를 선언할 수 있습니다. 그 뒤에는 변수 이름이 옵니다.

```angular-html
<!-- "taskInput"이라는 템플릿 참조 변수를 생성하며, HTMLInputElement를 참조합니다. -->
<input #taskInput placeholder="작업 이름 입력">
```

### 템플릿 참조 변수에 값 할당하기

Angular는 변수가 선언된 요소를 기준으로 템플릿 변수에 값을 할당합니다.

Angular 컴포넌트에 변수를 선언하면, 해당 변수는 컴포넌트 인스턴스를 참조합니다.

```angular-html
<!-- `startDate` 변수는 `MyDatepicker`의 인스턴스로 할당됩니다. -->
<my-datepicker #startDate />
```

`<ng-template>` 요소에 변수를 선언하면, 해당 변수는 템플릿을 나타내는 TemplateRef 인스턴스를 참조합니다. 더 많은 정보는 [How Angular uses the asterisk, \*, syntax](/guide/directives/structural-directives#asterisk) in [Structural directives](/guide/directives/structural-directives)에서 확인하십시오.

```angular-html
<!-- `myFragment` 변수는 이 템플릿 조각에 해당하는 `TemplateRef` 인스턴스로 할당됩니다. -->
<ng-template #myFragment>
  <p>이것은 템플릿 조각입니다</p>
</ng-template>
```

다른 표시된 요소에 변수를 선언하면, 해당 변수는 HTMLElement 인스턴스를 참조합니다.

```angular-html
<!-- "taskInput" 변수는 HTMLInputElement 인스턴스를 참조합니다. -->
<input #taskInput placeholder="작업 이름 입력">
```

#### Angular 지시문에 참조 할당하기

Angular 지시문은 템플릿 내에서 지시문을 참조할 수 있는 이름을 정의하는 `exportAs` 속성을 가질 수 있습니다:

```angular-ts
@Directive({
  selector: '[dropZone]',
  exportAs: 'dropZone',
})
export class DropZone { /* ... */ }
```

요소에 템플릿 변수를 선언할 때, 이 `exportAs` 이름을 사용하여 지시문 인스턴스를 변수에 할당할 수 있습니다:

```angular-html
<!-- `firstZone` 변수는 `DropZone` 지시문 인스턴스를 참조합니다. -->
<section dropZone #firstZone="dropZone"> ... </section>
```

`exportAs` 이름을 지정하지 않은 지시문을 참조할 수는 없습니다.

### 쿼리와 함께 템플릿 참조 변수 사용하기

같은 템플릿의 다른 부분에서 값을 읽기 위해 템플릿 변수를 사용하는 것 외에도, 이 스타일의 변수 선언을 사용하여 요소를 [컴포넌트 및 지시문 쿼리](/guide/components/queries)를 위해 "마킹"할 수 있습니다.

템플릿에서 특정 요소를 쿼리하려는 경우, 해당 요소에 템플릿 변수를 선언한 후 변수 이름을 기준으로 그 요소를 쿼리할 수 있습니다.

```angular-html
 <input #description value="원본 설명">
```

```angular-ts
@Component({
  /* ... */,
  template: `<input #description value="원본 설명">`,
})
export class AppComponent {
  // 템플릿 변수 이름을 기준으로 입력 요소를 쿼리합니다.
  @ViewChild('description') input: ElementRef | undefined;
}
```

쿼리에 대한 더 많은 정보는 [Referencing children with queries](/guide/components/queries)에서 확인하십시오.