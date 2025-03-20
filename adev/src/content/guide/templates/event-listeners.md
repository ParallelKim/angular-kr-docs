# 이벤트 리스너 추가하기

Angular는 템플릿의 요소에 이벤트 리스너를 정의하도록 지원하며, 이벤트 이름을 괄호 안에 지정하고 이벤트가 발생할 때마다 실행되는 문장을 함께 명시합니다.

## 네이티브 이벤트 듣기

HTML 요소에 이벤트 리스너를 추가하려면 이벤트를 괄호 `()`로 감싸서 리스너 문장을 지정할 수 있습니다.

```angular-ts
@Component({
  template: `
    <input type="text" (keyup)="updateField()" />
  `,
  ...
})
export class AppComponent{
  updateField(): void {
    console.log('필드가 업데이트되었습니다!');
  }
}
```

이 예제에서 Angular는 `<input>` 요소가 `keyup` 이벤트를 발생시킬 때마다 `updateField`를 호출합니다.

`click`, `keydown`, `mouseover` 등과 같은 모든 네이티브 이벤트에 대한 리스너를 추가할 수 있습니다. 더 알아보려면 [MDN의 요소에서 사용할 수 있는 모든 이벤트](https://developer.mozilla.org/en-US/docs/Web/API/Element#events)를 확인하세요.

## 이벤트 인수 접근하기

모든 템플릿 이벤트 리스너에서 Angular는 이벤트 객체를 참조하는 `$event`라는 변수를 제공합니다.

```angular-ts
@Component({
  template: `
    <input type="text" (keyup)="updateField($event)" />
  `,
  ...
})
export class AppComponent {
  updateField(event: KeyboardEvent): void {
    console.log(`사용자가 입력한 키: ${event.key}`);
  }
}
```

## 키 수정자 사용하기

특정 키에 대한 특정 키보드 이벤트를 캡처하고 싶을 때, 다음과 같은 코드를 작성할 수 있습니다.

```angular-ts
@Component({
  template: `
    <input type="text" (keyup)="updateField($event)" />
  `,
  ...
})
export class AppComponent {
  updateField(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      console.log('사용자가 텍스트 필드에서 Enter 키를 눌렀습니다.');
    }
  }
}
```

하지만 이는 일반적인 시나리오이기 때문에, Angular는 점(`.`) 문자를 사용하여 특정 키로 이벤트를 필터링할 수 있게 해줍니다. 이렇게 하면 코드를 다음과 같이 간소화할 수 있습니다:

```angular-ts
@Component({
  template: `
    <input type="text" (keyup.enter)="updateField($event)" />
  `,
  ...
})
export class AppComponent{
  updateField(event: KeyboardEvent): void {
    console.log('사용자가 텍스트 필드에서 Enter 키를 눌렀습니다.');
  }
}
```

추가적인 키 수정자도 추가할 수 있습니다:

```angular-html
<!-- Shift와 Enter에 해당 -->
<input type="text" (keyup.shift.enter)="updateField($event)" />
```

Angular는 `alt`, `control`, `meta` 및 `shift` 수정자를 지원합니다.

키보드 이벤트에 바인딩할 키 또는 코드를 지정할 수 있습니다. 키와 코드 필드는 브라우저 키보드 이벤트 객체의 기본적인 부분입니다. 기본적으로 이벤트 바인딩은 [키보드 이벤트에 대한 키 값](https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_key_values)을 사용하려고 한다고 가정합니다.

Angular는 또한 [키보드 이벤트에 대한 코드 값](https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_code_values)을 제공하여 내장된 `code` 접미사를 사용할 수 있도록 허용합니다.

```angular-html
<!-- Alt와 왼쪽 Shift에 해당 -->
<input type="text" (keydown.code.alt.shiftleft)="updateField($event)" />
```

이는 다양한 운영 체제에서 키보드 이벤트를 일관되게 처리하는 데 유용할 수 있습니다. 예를 들어, MacOS 장치에서 Alt 키를 사용할 때 `key` 속성은 Alt 키로 이미 수정된 문자를 기반으로 키를 보고합니다. 즉, Alt + S 조합은 `key` 값으로 `'ß'`를 보고합니다. 하지만 `code` 속성은 물리적 또는 가상 버튼이 눌린 것에 해당하며 생성된 문자와는 무관합니다.