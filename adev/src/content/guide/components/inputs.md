# 입력 속성으로 데이터 받기

팁: 이 가이드는 여러분이 이미 [필수 가이드](essentials)를 읽었다고 가정합니다. Angular에 익숙하지 않은 경우 먼저 그 내용을 읽어보세요.

팁: 다른 웹 프레임워크에 익숙하다면, 입력 속성은 _props_와 유사합니다.

컴포넌트를 사용할 때, 일반적으로 데이터를 전달하고 싶습니다. 컴포넌트는 **입력**을 선언하여 수용할 수 있는 데이터를 지정합니다:

<docs-code language="ts" highlight="[7]">
import {Component, input} from '@angular/core';

@Component({/*...*/})
export class CustomSlider {
  // 기본 값이 0인 'value'라는 입력을 선언합니다.
  value = input(0);
}
</docs-code>

이렇게 하면 템플릿에서 속성에 바인딩할 수 있습니다:

```angular-html
<custom-slider [value]="50" />
```

입력에 기본 값이 있는 경우, TypeScript는 기본 값으로부터 타입을 추론합니다:

```typescript
@Component({/*...*/})
export class CustomSlider {
  // TypeScript는 이 입력이 숫자임을 추론하여 InputSignal<number>를 반환합니다.
  value = input(0);
}
```

입력에 대한 타입을 명시적으로 선언하려면 함수에 제네릭 매개변수를 지정할 수 있습니다.

기본 값이 없는 입력이 설정되지 않으면, 그 값은 `undefined`입니다:

```typescript
@Component({/*...*/})
export class CustomSlider {
  // `value`가 설정되지 않을 수 있기 때문에 InputSignal<number | undefined>를 생성합니다.
  value = input<number>();
}
```

**Angular는 컴파일 타임에 정적으로 입력을 기록합니다**. 입력은 런타임에 추가하거나 제거할 수 없습니다.

`input` 함수는 Angular 컴파일러에 특별한 의미를 갖습니다. **컴포넌트 및 지시자의 속성 초기화기에만 `input`을 독점적으로 호출할 수 있습니다.**

컴포넌트 클래스가 확장될 때, **입력은 자식 클래스에 상속됩니다.**

**입력 이름은 대소문자를 구분합니다.**

## 입력 읽기

`input` 함수는 `InputSignal`을 반환합니다. 신호를 호출하여 값을 읽을 수 있습니다:

<docs-code language="ts" highlight="[5]">
import {Component, input} from '@angular/core';

@Component({/*...*/})
export class CustomSlider {
  // 기본 값이 0인 'value'라는 입력을 선언합니다. 
  value = input(0);

  // 입력된 값을 읽는 계산된 표현을 만듭니다.
  label = computed(() => `슬라이더의 값은 ${this.value()}`); 
}
</docs-code>

`input` 함수로 생성된 신호는 읽기 전용입니다.

## 필수 입력

입력이 `required`라고 선언하려면 `input.required`를 호출합니다:

<docs-code language="ts" highlight="[3]">
@Component({/*...*/})
export class CustomSlider {
  // 필수 입력인 'value'를 선언합니다. InputSignal<number>를 반환합니다.
  value = input.required<number>();
}
</docs-code>

Angular는 컴포넌트가 템플릿에서 사용될 때 필수 입력이 _반드시_ 설정되어야 한다고 강제합니다. 모든 필수 입력을 지정하지 않고 컴포넌트를 사용하려고 하면, Angular는 빌드 타임에 오류를 보고합니다.

필수 입력은 반환된 `InputSignal`의 제네릭 매개변수에 `undefined`를 자동으로 포함하지 않습니다.

## 입력 구성

`input` 함수는 입력이 작동하는 방식을 변경할 수 있는 구성 객체를 두 번째 매개변수로 받아들입니다.

### 입력 변형

Angular가 설정할 때 입력의 값을 변경할 `transform` 함수를 지정할 수 있습니다.

<docs-code language="ts" highlight="[6]">
@Component({
  selector: 'custom-slider',
  /*...*/
})
export class CustomSlider {
  label = input('', {transform: trimString});
}

function trimString(value: string | undefined): string {
  return value?.trim() ?? '';
}
</docs-code>

```angular-html
<custom-slider [label]="systemVolume" />
```

위 예제에서, `systemVolume`의 값이 변경될 때마다 Angular는 `trimString`을 실행하고 결과로 `label`을 설정합니다.

입력 변형의 가장 일반적인 사용 사례는 비어 있거나 `undefined` 및 `null`을 포함한 더 넓은 범위의 값 유형을 템플릿에서 수용하기 위한 것입니다.

**입력 변형 함수는 빌드 타임에 정적으로 분석 가능해야 합니다.** 변형 함수를 조건부로 설정하거나 표현식 평가의 결과로 설정할 수 없습니다.

**입력 변형 함수는 항상 [순수 함수](https://en.wikipedia.org/wiki/Pure_function)여야 합니다.** 변형 함수 외부의 상태에 의존하는 것은 예측할 수 없는 동작을 초래할 수 있습니다.

#### 타입 검사

입력 변형을 지정할 때 변형 함수의 매개변수 타입은 템플릿에서 입력에 설정할 수 있는 값의 타입을 결정합니다.

<docs-code language="ts">
@Component({/*...*/})
export class CustomSlider {
  widthPx = input('', {transform: appendPx});
}

function appendPx(value: number): string {
  return `${value}px`;
}
</docs-code>

위 예제에서, `widthPx` 입력은 `number`를 수용하고, `InputSignal` 속성은 `string`을 반환합니다.

#### 내장 변형

Angular는 가장 일반적인 두 가지 시나리오, 즉 값을 부울과 숫자로 강제하는 두 가지 내장 변형 함수를 포함합니다.

<docs-code language="ts">
import {Component, input, booleanAttribute, numberAttribute} from '@angular/core';

@Component({/*...*/})
export class CustomSlider {
  disabled = input(false, {transform: booleanAttribute}); 
  value = input(0, {transform: numberAttribute}); 
}
</docs-code>

`booleanAttribute`는 표준 HTML [부울 속성](https://developer.mozilla.org/docs/Glossary/Boolean/HTML)의 동작을 모방하며, 이 경우 속성의 _존재_가 "true" 값을 나타냅니다. 그러나 Angular의 `booleanAttribute`는 리터럴 문자열 `"false"`를 부울 `false`로 간주합니다.

`numberAttribute`는 주어진 값을 숫자로 분석하려고 시도하며, 분석에 실패하면 `NaN`을 생성합니다.

### 입력 별칭

템플릿에서 입력의 이름을 변경할 수 있도록 `alias` 옵션을 지정할 수 있습니다.

<docs-code language="ts" highlight="[3]">
@Component({/*...*/})
export class CustomSlider {
  value = input(0, {alias: 'sliderValue'});
}
</docs-code>

```angular-html
<custom-slider [sliderValue]="50" />
```

이 별칭은 TypeScript 코드에서 속성 사용에 영향을 주지 않습니다.

컴포넌트의 입력에 별칭을 부여하는 것을 일반적으로 피해야 하지만, 이 기능은 원래 이름의 별칭을 유지하거나 네이티브 DOM 요소 속성의 이름과의 충돌을 피하기 위한 유용한 방법이 될 수 있습니다.

## 모델 입력

**모델 입력**은 컴포넌트가 새 값을 부모 컴포넌트로 전파할 수 있게 하는 특별한 유형의 입력입니다.

컴포넌트를 생성할 때, 표준 입력을 생성하는 방식과 유사하게 모델 입력을 정의할 수 있습니다.

두 종류의 입력 모두 누군가가 속성에 값을 바인딩할 수 있게 합니다. 그러나 **모델 입력은 컴포넌트 작성자가 속성에 값을 기록할 수 있게 합니다**. 속성이 양방향 바인딩으로 연결되어 있으면, 새 값이 그 바인딩으로 전파됩니다.

```typescript
@Component({ /* ... */})
export class CustomSlider {
  // "value"라는 모델 입력을 정의합니다.
  value = model(0);

  increment() {
    // 새로운 값으로 모델 입력을 업데이트하여 모든 바인딩에 값을 전파합니다. 
    this.value.update(oldValue => oldValue + 10);
  }
}

@Component({
  /* ... */
  // 양방향 바인딩 구문을 사용하면 슬라이더의
  // 값 변경이 자동으로 `volume` 신호로 전파됩니다.
  // 이 바인딩은 신호의 *인스턴스*를 사용하며, 신호 값이 아닙니다.
  template: `<custom-slider [(value)]="volume" />`,
})
export class MediaControls {
  // `volume` 로컬 상태에 대한 쓰기 가능한 신호를 생성합니다.
  volume = signal(0);
}
```

위 예제에서 `CustomSlider`는 자신의 `value` 모델 입력에 값을 기록할 수 있으며, 그 값은 `MediaControls`의 `volume` 신호로 전파됩니다. 이 바인딩은 `value`와 `volume`의 값을 동기화합니다. 바인딩이 `volume` 신호 인스턴스를 전달하고 신호의 _값_이 아님에 유의하십시오.

다른 측면에서 모델 입력은 표준 입력과 유사하게 작동합니다. 신호 함수를 호출하여 값을 읽을 수 있으며, 반응형 컨텍스트인 `computed` 및 `effect`에서도 포함됩니다.

템플릿에서의 양방향 바인딩에 대한 자세한 내용은 [양방향 바인딩](guide/templates/two-way-binding)을 참조하십시오.

### 일반 속성과의 양방향 바인딩

일반 JavaScript 속성을 모델 입력에 바인딩할 수 있습니다.

```angular-ts
@Component({
  /* ... */
  // `value`는 모델 입력입니다.
  // 대괄호 안의 괄호 구문(일명 "바나나-상자")은 양방향 바인딩을 생성합니다.
  template: '<custom-slider [(value)]="volume" />',
})
export class MediaControls {
  protected volume = 0;
}
```

위 예제에서 `CustomSlider`는 자신의 `value` 모델 입력에 값을 기록할 수 있으며, 그 값은 `MediaControls`의 `volume` 속성으로 전파됩니다. 이 바인딩은 `value`와 `volume`의 값을 동기화합니다.

### 암묵적 `change` 이벤트

컴포넌트나 지시자에 모델 입력을 선언하면 Angular는 해당 모델에 대한 [출력](guide/components/outputs)을 자동으로 생성합니다. 출력의 이름은 모델 입력의 이름 뒤에 "Change"가 추가됩니다.

```angular-ts
@Directive({ /* ... */ })
export class CustomCheckbox {
  // 이로 인해 "checkedChange"라는 출력이 자동으로 생성됩니다.
  // 템플릿에서 `(checkedChange)="handler()"`를 사용하여 구독할 수 있습니다.
  checked = model(false);
}
```

Angular는 모델 입력에 새 값을 기록할 때마다 이 변경 이벤트를 발생시킵니다. 이는 `set` 또는 `update` 메서드를 호출하여 발생합니다.

출력에 대한 자세한 내용은 [출력을 갖춘 사용자 정의 이벤트](guide/components/outputs)를 참조하십시오.

### 모델 입력 사용자 정의

모델 입력을 필수로 만들거나 별칭을 지정할 수 있습니다. 이는 [표준 입력](guide/signals/inputs)과 동일한 방식입니다.

모델 입력은 입력 변형을 지원하지 않습니다.

### 모델 입력 사용 시기

모델 입력은 컴포넌트가 양방향 바인딩을 지원해야 할 때 사용합니다. 이는 일반적으로 컴포넌트가 사용자 상호 작용에 따라 값을 수정하기 위해 존재할 때 적합합니다. 가장 일반적으로, 날짜 선택기 또는 콤보박스와 같은 사용자 정의 폼 컨트롤은 기본 값을 위해 모델 입력을 사용해야 합니다.

## 입력 이름 선택

DOM 요소의 속성과 충돌하는 입력 이름 선택을 피하세요. 이름 충돌은 바인딩된 속성이 컴포넌트에 속하는지 DOM 요소에 속하는지에 대한 혼돈을 초래합니다.

컴포넌트 입력에 접두사를 추가하는 것은 피하세요. 특정 요소는 하나의 컴포넌트만 호스팅할 수 있으므로 모든 사용자 지정 속성은 컴포넌트에 속한다고 가정할 수 있습니다.

## `@Input` 데코레이터로 입력 선언하기

팁: Angular 팀은 새로운 프로젝트에 대해서는 신호 기반의 `input` 함수를 사용하는 것을 권장하지만, 원래의 데코레이터 기반 `@Input` API는 여전히 완전히 지원됩니다.

대신 `@Input` 데코레이터를 속성에 추가하여 컴포넌트 입력을 선언할 수 있습니다:

<docs-code language="ts" highlight="[3]">
@Component({...})
export class CustomSlider {
  @Input() value = 0;
}
</docs-code>

입력에 바인딩하는 것은 신호 기반 입력과 데코레이터 기반 입력 모두에서 동일합니다:

```angular-html
<custom-slider [value]="50" />
```

### 데코레이터 기반 입력 사용자 정의

`@Input` 데코레이터는 입력이 작동하는 방식을 변경할 수 있는 구성 객체를 받아들입니다.

#### 필수 입력

주어진 입력은 항상 값이 있어야 한다고 강제하는 `required` 옵션을 지정할 수 있습니다.

<docs-code language="ts" highlight="[3]">
@Component({...})
export class CustomSlider {
  @Input({required: true}) value = 0;
}
</docs-code>

모든 필수 입력을 지정하지 않고 컴포넌트를 사용하려고 하면 Angular는 빌드 타임에 오류를 보고합니다.

#### 입력 변형

입력의 값을 Angular에 의해 설정할 때 변경할 `transform` 함수를 지정할 수 있습니다. 이 변형 함수는 위에서 설명한 신호 기반 입력의 변형 함수와 동일하게 작동합니다.

<docs-code language="ts" highlight="[6]">
@Component({
  selector: 'custom-slider',
  ...
})
export class CustomSlider {
  @Input({transform: trimString}) label = '';
}

function trimString(value: string | undefined) { return value?.trim() ?? ''; }
</docs-code>

#### 입력 별칭

템플릿에서 입력의 이름을 변경할 수 있도록 `alias` 옵션을 지정할 수 있습니다.

<docs-code language="ts" highlight="[3]">
@Component({...})
export class CustomSlider {
  @Input({alias: 'sliderValue'}) value = 0;
}
</docs-code>

```angular-html
<custom-slider [sliderValue]="50" />
```

`@Input` 데코레이터는 구성 객체 대신 첫 번째 매개변수로 별칭을 받아들입니다.

입력 별칭은 신호 기반 입력에 대해 설명된 방식과 동일하게 작동합니다.

### getter와 setter가 있는 입력

데코레이터 기반 입력을 사용할 때, getter와 setter가 구현된 속성은 입력이 될 수 있습니다:

<docs-code language="ts">
export class CustomSlider {
  @Input()
  get value(): number {
    return this.internalValue;
  }

  set value(newValue: number) { this.internalValue = newValue; }

  private internalValue = 0; 
}
</docs-code>

공용 setter만 정의하여 _쓰기 전용_ 입력을 만들 수도 있습니다:

<docs-code language="ts">
export class CustomSlider {
  @Input()
  set value(newValue: number) {
    this.internalValue = newValue;
  }

  private internalValue = 0; 
}
</docs-code>

**가능한 경우 getters와 setters 대신 입력 변형을 사용하십시오.**

복잡하거나 비용이 많이 드는 getter와 setter를 피하십시오. Angular는 입력의 setter를 여러 번 호출할 수 있으며, setter가 DOM 조작과 같은 비용이 많이 드는 작업을 수행하면 애플리케이션 성능에 부정적인 영향을 미칠 수 있습니다.

## `@Component` 데코레이터에서 입력 지정하기

`@Input` 데코레이터 외에도, `@Component` 데코레이터의 `inputs` 속성을 사용하여 컴포넌트의 입력을 지정할 수 있습니다. 이는 컴포넌트가 기본 클래스에서 속성을 상속받을 때 유용할 수 있습니다:

<docs-code language="ts" highlight="[4]">
// `CustomSlider`는 `BaseSlider`에서 `disabled` 속성을 상속받습니다.
@Component({
  ...,
  inputs: ['disabled'],
})
export class CustomSlider extends BaseSlider { }
</docs-code>

별칭을 추가로 지정할 수 있으며, 문자열 뒤에 콜론(`:`)을 붙여서 입력 별칭을 지정할 수 있습니다:

<docs-code language="ts" highlight="[4]">
// `CustomSlider`는 `BaseSlider`에서 `disabled` 속성을 상속받습니다.
@Component({
  ...,
  inputs: ['disabled: sliderDisabled'],
})
export class CustomSlider extends BaseSlider { }
</docs-code>