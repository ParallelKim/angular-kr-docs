# Angular 요소 개요

_Angular 요소_는 _커스텀 요소_ (웹 컴포넌트라고도 함)로 패키징된 Angular 컴포넌트로, 프레임워크에 구애받지 않는 방식으로 새로운 HTML 요소를 정의하기 위한 웹 표준입니다.

[커스텀 요소](https://developer.mozilla.org/docs/Web/Web_Components/Using_custom_elements)는 Angular에서 지원하는 모든 브라우저에서 사용할 수 있는 웹 플랫폼 기능입니다.
커스텀 요소는 JavaScript 코드로 생성되고 제어되는 콘텐츠를 정의하는 태그를 허용하여 HTML을 확장합니다.
브라우저는 정의된 커스텀 요소의 `CustomElementRegistry`를 유지하며, 이는 인스턴스화 가능한 JavaScript 클래스를 HTML 태그에 매핑합니다.

`@angular/elements` 패키지는 Angular의 컴포넌트 인터페이스와 변경 감지 기능에서 내장 DOM API로의 브리지를 제공하는 `createCustomElement()` API를 내보냅니다.

컴포넌트를 커스텀 요소로 변환하면 브라우저에서 필요한 Angular 인프라가 모두 사용 가능해집니다.
커스텀 요소를 만드는 것은 간단하고 직관적이며, 자동으로 컴포넌트 정의 뷰를 변경 감지 및 데이터 바인딩과 연결하여 Angular 기능을 해당 내장 HTML 동등물에 매핑합니다.

## 커스텀 요소 사용하기

커스텀 요소는 스스로 부트스트랩됩니다 - DOM에 추가되면 시작하고, DOM에서 제거되면 파괴됩니다.
커스텀 요소가 어떤 페이지의 DOM에 추가되면, 다른 HTML 요소처럼 보이고 작동하며, Angular 용어 또는 사용 관례에 대한 특별한 지식을 필요로 하지 않습니다.

`@angular/elements` 패키지를 작업 공간에 추가하려면 다음 명령을 실행합니다:

<docs-code language="shell">

npm install @angular/elements --save

</docs-code>

### 작동 방식

`createCustomElement()` 함수는 컴포넌트를 브라우저에 커스텀 요소로 등록할 수 있는 클래스으로 변환합니다.
구성된 클래스를 브라우저의 커스텀 요소 레지스트리에 등록한 후, DOM에 직접 추가한 콘텐츠에서 내장 HTML 요소처럼 새 요소를 사용하세요:

<docs-code language="html">

<my-popup message="Use Angular!"></my-popup>

</docs-code>

커스텀 요소가 페이지에 배치되면, 브라우저는 등록된 클래스의 인스턴스를 생성하고 DOM에 추가합니다.
콘텐츠는 Angular 템플릿 구문을 사용하는 컴포넌트의 템플릿에 의해 제공되며, 컴포넌트와 DOM 데이터로 렌더링됩니다.
컴포넌트의 입력 속성은 요소의 입력 속성과 대응됩니다.

## 컴포넌트를 커스텀 요소로 변환하기

Angular는 Angular 컴포넌트를 해당 의존성과 함께 커스텀 요소로 변환하기 위해 `createCustomElement()` 함수를 제공합니다.

변환 프로세스는 `NgElementConstructor` 인터페이스를 구현하고, 컴포넌트의 자가 부트스트랩 인스턴스를 생성하도록 구성된 생성자 클래스를 만듭니다.

브라우저의 기본 [`customElements.define()`](https://developer.mozilla.org/docs/Web/API/CustomElementRegistry/define) 함수를 사용하여 구성된 생성자와 해당 커스텀 요소 태그를 브라우저의 [`CustomElementRegistry`](https://developer.mozilla.org/docs/Web/API/CustomElementRegistry)에 등록합니다.
브라우저가 등록된 요소의 태그를 인식하면, 생성자를 사용하여 커스텀 요소 인스턴스를 생성합니다.

중요: 컴포넌트의 선택기를 커스텀 요소 태그 이름으로 사용하는 것을 피하세요.
이로 인해 Angular가 단일 DOM 요소에 대해 두 개의 컴포넌트 인스턴스를 생성하는 예기치 않은 동작이 발생할 수 있습니다:
하나는 일반 Angular 컴포넌트이고, 또 하나는 커스텀 요소를 사용하는 것입니다.

### 매핑

커스텀 요소는 Angular 컴포넌트를 _호스팅_하며, 컴포넌트에 정의된 데이터와 로직 및 표준 DOM API 사이의 브리지를 제공합니다.
컴포넌트의 속성과 로직은 HTML 속성과 브라우저의 이벤트 시스템으로 직접 매핑됩니다.

* 생성 API는 입력 속성을 찾기 위해 컴포넌트를 분석하고, 커스텀 요소에 대해 대응하는 속성을 정의합니다.
  속성 이름을 변환하여 대소문자 구분을 인식하지 않는 커스텀 요소와 호환되도록 합니다.
  결과적으로 속성 이름은 하이픈으로 구분된 소문자로 사용됩니다.
  예를 들어 `@Input('myInputProp') inputProp`인 컴포넌트의 경우, 대응하는 커스텀 요소는 `my-input-prop` 속성을 정의합니다.

* 컴포넌트 출력은 HTML [커스텀 이벤트](https://developer.mozilla.org/docs/Web/API/CustomEvent)로 전송되며, 커스텀 이벤트의 이름은 출력 이름과 일치합니다.
    예를 들어 `@Output() valueChanged = new EventEmitter()`인 컴포넌트의 경우, 대응하는 커스텀 요소는 "valueChanged"라는 이름으로 이벤트를 전송하며, 방출된 데이터는 이벤트의 `detail` 속성에 저장됩니다.
    별칭을 제공하면 해당 값이 사용됩니다; 예를 들어 `@Output('myClick') clicks = new EventEmitter<string>();`는 "myClick"이라는 이름의 이벤트를 전송합니다.

자세한 내용은 [커스텀 이벤트 만들기](https://developer.mozilla.org/docs/Web/Guide/Events/Creating_and_triggering_events#Creating_custom_events)에서 확인하세요.

## 예제: 팝업 서비스

이전에 런타임에서 애플리케이션에 컴포넌트를 추가하려면 _동적 컴포넌트_를 정의하고, 이를 로드하고, DOM의 요소에 연결하고, 모든 의존성, 변경 감지 및 이벤트 처리를 설정해야 했습니다.

Angular 커스텀 요소를 사용하면 모든 인프라와 프레임워크를 자동으로 제공하여 프로세스를 더 간단하고 투명하게 만들 수 있습니다 — 당신이 해야 할 일은 원하는 이벤트 처리를 정의하는 것뿐입니다.
\(애플리케이션에서 사용하지 않을 경우 컴포넌트를 컴파일에서 제외해야 한다는 점은 여전히 유의해야 합니다.\)

다음 팝업 서비스 예제 애플리케이션은 동적으로 로드하거나 커스텀 요소로 변환할 수 있는 컴포넌트를 정의합니다.

| 파일                  | 상세 설명                                                                                                                                                                                                                     |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `popup.component.ts` | 입력 메시지를 표시하는 간단한 팝업 요소를 정의하며, 일부 애니메이션 및 스타일링이 적용됩니다.                                                                                                                                      |
| `popup.service.ts`   | `PopupComponent`를 동적 컴포넌트 또는 커스텀 요소로 호출하는 두 가지 다른 방법을 제공하는 주입 가능한 서비스를 생성합니다. 동적 로딩 방법에 대해 얼마나 많은 설정이 필요한지 주목하세요.                        |  |
| `app.component.ts`   | `PopupService`를 사용하여 런타임에 DOM에 팝업을 추가하는 애플리케이션의 루트 컴포넌트를 정의합니다. 애플리케이션이 실행되면 루트 컴포넌트의 생성자가 `PopupComponent`를 커스텀 요소로 변환합니다. |

비교를 위해 데모에서는 두 가지 방법을 모두 보여줍니다.
한 버튼은 동적 로딩 방법을 사용하여 팝업을 추가하고, 다른 버튼은 커스텀 요소를 사용합니다.
결과는 같지만 준비 과정이 다릅니다.

<docs-code-multifile>
    <docs-code header="popup.component.ts" path="adev/src/content/examples/elements/src/app/popup.component.ts"/>
    <docs-code header="popup.service.ts" path="adev/src/content/examples/elements/src/app/popup.service.ts"/>
    <docs-code header="app.component.ts" path="adev/src/content/examples/elements/src/app/app.component.ts"/>
</docs-code-multifile>

## 커스텀 요소에 대한 타이핑

`document.createElement()` 또는 `document.querySelector()`와 같은 일반 DOM API는 지정된 인수에 적합한 요소 유형을 반환합니다.
예를 들어, `document.createElement('a')`를 호출하면 TypeScript가 `href` 속성을 가진 `HTMLAnchorElement`를 반환합니다.
유사하게, `document.createElement('div')`는 `href` 속성이 없는 `HTMLDivElement`를 반환합니다.

알 수 없는 요소로 호출할 때, 예를 들어 커스텀 요소 이름 (`popup-element` 예제에서)으로 호출할 때, 메서드는 `HTMLElement`와 같은 일반 유형을 반환합니다. TypeScript가 반환된 요소의 올바른 유형을 추론할 수 없기 때문입니다.

Angular로 생성된 커스텀 요소는 `NgElement`를 확장합니다 (이는 또 `HTMLElement`를 확장합니다).
또한, 이러한 커스텀 요소는 해당 컴포넌트의 각 입력에 대한 속성을 가집니다.
예를 들어, `popup-element`에는 `string` 유형의 `message` 속성이 있습니다.

커스텀 요소에 대한 올바른 유형을 얻으려면 몇 가지 옵션이 있습니다.
다음 컴포넌트를 기반으로 하는 `my-dialog` 커스텀 요소를 만든다고 가정합니다:

<docs-code language="typescript">

@Component(…)
class MyDialog {
  @Input() content: string;
}

</docs-code>

정확한 타이핑을 얻는 가장 간단한 방법은 관련 DOM 메서드의 반환 값을 올바른 타입으로 캐스팅하는 것입니다.
그렇기 위해서는 `NgElement` 및 `WithProperties` 유형을 사용하세요 \(둘 다 `@angular/elements`에서 내보냄\):

<docs-code language="typescript">

const aDialog = document.createElement('my-dialog') as NgElement & WithProperties<{content: string}>;
aDialog.content = 'Hello, world!';
aDialog.content = 123;  // <-- 오류: TypeScript는 이것이 문자열이어야 한다고 알고 있습니다.
aDialog.body = 'News';  // <-- 오류: TypeScript는 `aDialog`에 `body` 속성이 없다는 것을 알고 있습니다.

</docs-code>

이것은 커스텀 요소에 대해 유형 검증 및 자동 완성 지원과 같은 TypeScript 기능을 빠르게 얻는 좋은 방법입니다.
하지만 여러 곳에서 필요할 경우 매번 반환 유형을 캐스팅해야 하므로 번거로워질 수 있습니다.

한 번만 각 커스텀 요소의 유형을 정의해야 하는 대안적인 방법은 TypeScript가 태그 이름을 기반으로 반환된 요소의 유형을 추론하는 데 사용하는 `HTMLElementTagNameMap`을 확장하는 것입니다\(DOM 메서드에서 `document.createElement()`, `document.querySelector()`, 등\):

<docs-code language="typescript">

declare global {
  interface HTMLElementTagNameMap {
    'my-dialog': NgElement & WithProperties<{content: string}>;
    'my-other-element': NgElement & WithProperties<{foo: 'bar'}>;
    …
  }
}

</docs-code>

이제 TypeScript는 내장 요소에 대해 수행하는 것처럼 동일한 방식으로 올바른 유형을 추론할 수 있습니다:

<docs-code language="typescript">

document.createElement('div')               //--> HTMLDivElement (내장 요소)
document.querySelector('foo')               //--> Element        (알 수 없는 요소)
document.createElement('my-dialog')         //--> NgElement & WithProperties<{content: string}> (커스텀 요소)
document.querySelector('my-other-element')  //--> NgElement & WithProperties<{foo: 'bar'}>      (커스텀 요소)

</docs-code>

## 제한 사항

`@angular/elements`로 생성된 커스텀 요소를 파괴한 후 다시 부착할 때 [disconnect()](https://github.com/angular/angular/issues/38778) 콜백 문제 때문에 주의해야 합니다. 이 문제에 직면할 수 있는 경우는 다음과 같습니다.

- `AngularJs`의 `ng-if` 또는 `ng-repeat`에서 컴포넌트를 렌더링하는 경우
- DOM에 요소를 수동으로 분리하고 다시 부착하는 경우