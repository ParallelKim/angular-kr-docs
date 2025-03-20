# 동적 텍스트, 속성 및 특성 바인딩

Angular에서 **바인딩**은 구성 요소의 템플릿과 데이터 간의 동적 연결을 생성합니다. 이 연결은 구성 요소의 데이터에 대한 변경 사항이 자동으로 렌더링된 템플릿을 업데이트하도록 보장합니다.

## 텍스트 보간을 사용한 동적 텍스트 렌더링

두 개의 중괄호를 사용하여 템플릿에서 동적 텍스트를 바인딩할 수 있으며, 이는 Angular에게 표현식 내부의 업데이트를 책임지도록 알려줍니다. 이를 **텍스트 보간**이라고 합니다.

```angular-ts
@Component({
  template: `
    <p>Your color preference is {{ theme }}.</p>
  `,
  ...
})
export class AppComponent {
  theme = 'dark';
}
```

이 예에서 코드 조각이 페이지에 렌더링될 때 Angular는 `{{ theme }}`를 `dark`로 바꿉니다.

```angular-html
<!-- 렌더링된 출력 -->
<p>Your color preference is dark.</p>
```

Angular는 처음 렌더링할 때 표현식을 평가하는 것 외에도, 표현식의 값이 변경될 때 렌더링된 콘텐츠를 업데이트합니다.

테마 예제를 계속하면, 사용자가 페이지 로드 후 `theme` 값을 `'light'`로 변경하는 버튼을 클릭하면 페이지는 다음과 같이 업데이트됩니다:

```angular-html
<!-- 렌더링된 출력 -->
<p>Your color preference is light.</p>
```

HTML에서 텍스트를 작성할 때의 모든 위치에서 텍스트 보간을 사용할 수 있습니다.

모든 표현식 값은 문자열로 변환됩니다. 객체와 배열은 값의 `toString` 메서드를 사용하여 변환됩니다.

## 동적 속성 및 특성 바인딩

Angular는 대괄호를 사용하여 객체 속성과 HTML 특성에 동적 값을 바인딩하는 것을 지원합니다.

HTML 요소의 DOM 인스턴스, [컴포넌트](guide/components) 인스턴스 또는 [디렉티브](guide/directives) 인스턴스의 속성에 바인딩할 수 있습니다.

### 기본 요소의 속성

모든 HTML 요소는 해당 DOM 표현이 있습니다. 예를 들어 각 `<button>` HTML 요소는 DOM에서 `HTMLButtonElement`의 인스턴스에 해당합니다. Angular에서는 속성 바인딩을 사용하여 요소의 DOM 표현에 직접적으로 값을 설정합니다.

```angular-html
<!-- 버튼 요소의 DOM 객체에서 `disabled` 속성 바인딩 -->
<button [disabled]="isFormValid">Save</button>
```

이 예에서 `isFormValid`가 변경될 때마다 Angular는 자동으로 `HTMLButtonElement` 인스턴스의 `disabled` 속성을 설정합니다.

### 컴포넌트 및 디렉티브 속성

요소가 Angular 컴포넌트인 경우, 동일한 대괄호 구문을 사용하여 컴포넌트 입력 속성을 설정하기 위해 속성 바인딩을 사용할 수 있습니다.

```angular-html
<!-- `MyListbox` 컴포넌트 인스턴스의 `value` 속성 바인딩 -->
<my-listbox [value]="mySelection" />
```

이 예에서 `mySelection`이 변경될 때마다 Angular는 자동으로 `MyListbox` 인스턴스의 `value` 속성을 설정합니다.

디렉티브 속성에도 바인딩할 수 있습니다.

```angular-html
<!-- `NgOptimizedImage` 디렉티브의 `ngSrc` 속성에 바인딩 -->
<img [ngSrc]="profilePhotoUrl" alt="The current user's profile photo">
```

### 특성

ARIA 특성이나 SVG 특성과 같이 해당 DOM 속성이 없는 HTML 특성을 설정해야 할 때는 `attr.` 접두사를 사용하여 템플릿의 요소에 특성을 바인딩할 수 있습니다.

```angular-html
<!-- `<ul>` 요소의 `role` 특성을 컴포넌트의 `listRole` 속성에 바인딩 -->
<ul [attr.role]="listRole">
```

이 예에서 `listRole`이 변경될 때마다 Angular는 `setAttribute`를 호출하여 `<ul>` 요소의 `role` 특성을 자동으로 설정합니다.

특성 바인딩의 값이 `null`인 경우, Angular는 `removeAttribute`를 호출하여 특성을 제거합니다.

### 속성 및 특성에서의 텍스트 보간

속성 이름이나 특성 이름 주위에 대괄호 대신 두 개의 중괄호 구문을 사용하여 속성과 특성에서 텍스트 보간 구문을 사용할 수도 있습니다. 이 구문을 사용할 때 Angular는 할당을 속성 바인딩으로 처리합니다.

```angular-html
<!-- 이미지 요소의 DOM 객체에 `alt` 속성에 값을 바인딩 -->
<img src="profile-photo.jpg" alt="Profile photo of {{ firstName }}" >
```

텍스트 보간 구문을 사용하여 특성에 바인딩하려면 특성 이름 앞에 `attr.`를 추가하십시오.

```angular-html
<button attr.aria-label="Save changes to {{ objectType }}">
```

## CSS 클래스 및 스타일 속성 바인딩

Angular는 요소에 CSS 클래스 및 CSS 스타일 속성을 바인딩하는 추가 기능을 지원합니다.

### CSS 클래스

바인딩된 값이 [truthy 또는 falsy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy)인지에 따라 요소에서 CSS 클래스를 조건부로 추가하거나 제거하기 위해 CSS 클래스 바인딩을 생성할 수 있습니다.

```angular-html
<!-- `isExpanded`가 truthy일 때 `expanded` CSS 클래스 추가 -->
<ul [class.expanded]="isExpanded">
```

`class` 속성에 직접 바인딩할 수도 있습니다. Angular는 세 가지 유형의 값을 수용합니다:

| `class` 값의 설명                                                                                                                                       | TypeScript 유형       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 공백으로 구분된 하나 이상의 CSS 클래스를 포함하는 문자열                                                                                              | `string`              |
| CSS 클래스 문자열의 배열                                                                                                                                | `string[]`            |
| 각 속성 이름이 CSS 클래스 이름인 객체이며 각 해당 값이 해당 클래스가 요소에 적용되는지 여부를 결정합니다 (truthiness에 따라)                          | `Record<string, any>` |

```angular-ts
@Component({
  template: `
    <ul [class]="listClasses"> ... </ul>
    <section [class]="sectionClasses"> ... </section>
    <button [class]="buttonClasses"> ... </button>
  `,
  ...
})
export class UserProfile {
  listClasses = 'full-width outlined';
  sectionClasses = ['expandable', 'elevated'];
  buttonClasses = {
    highlighted: true,
    embiggened: false,
  };
}
```

위의 예는 다음 DOM을 렌더링합니다:

```angular-html
<ul class="full-width outlined"> ... </ul>
<section class="expandable elevated"> ... </section>
<button class="highlighted"> ... </button>
```

Angular는 유효하지 않은 CSS 클래스 이름이 있는 문자열 값은 무시합니다.

정적 CSS 클래스를 사용할 때는 `class`를 직접 바인딩하고 특정 클래스를 바인딩하면 Angular는 렌더링된 결과에서 모든 클래스를 지능적으로 결합합니다.

```angular-ts
@Component({
  template: `<ul class="list" [class]="listType" [class.expanded]="isExpanded"> ...`,
  ...
})
export class Listbox {
  listType = 'box';
  isExpanded = true;
}
```

위의 예에서 Angular는 모든 세 가지 CSS 클래스로 `ul` 요소를 렌더링합니다.

```angular-html
<ul class="list box expanded">
```

Angular는 렌더링된 요소의 CSS 클래스에 대한 특정 순서를 보장하지 않습니다.

`class`를 배열이나 객체에 바인딩할 때 Angular는 이전 값과 현재 값을 삼중 동등 연산자 (`===`)로 비교합니다. 이러한 값을 수정할 때는 업데이트를 적용할 수 있도록 새 객체 또는 배열 인스턴스를 생성해야 합니다.

요소에 동일한 CSS 클래스를 위한 여러 바인딩이 있는 경우, Angular는 스타일 우선 순위 순서를 따라 충돌을 해결합니다.

### CSS 스타일 속성

요소의 CSS 스타일 속성에 직접 바인딩할 수도 있습니다.

```angular-html
<!-- `isExpanded` 속성에 따라 CSS `display` 속성 설정 -->
<section [style.display]="isExpanded ? 'block' : 'none'">
```

단위가 필요한 CSS 속성에 대해 단위를 추가로 지정할 수 있습니다.

```angular-html
<!-- `sectionHeightInPixels` 속성에 따라 CSS `height` 속성을 픽셀 값으로 설정 -->
<section [style.height.px]="sectionHeightInPixels">
```

하나의 바인딩에서 여러 스타일 값을 설정할 수도 있습니다. Angular는 다음 유형의 값을 수용합니다:

| `style` 값의 설명                                                                                                     | TypeScript 유형       |
| -------------------------------------------------------------------------------------------------------------- | --------------------- |
| `"display: flex; margin: 8px"`와 같은 하나 이상의 CSS 선언을 포함하는 문자열                                              | `string`              |
| 각 속성 이름이 CSS 속성 이름이고 각 해당 값이 해당 CSS 속성의 값인 객체                                                   | `Record<string, any>` |

```angular-ts
@Component({
  template: `
    <ul [style]="listStyles"> ... </ul>
    <section [style]="sectionStyles"> ... </section>
  `,
  ...
})
export class UserProfile {
  listStyles = 'display: flex; padding: 8px';
  sectionStyles = {
    border: '1px solid black',
    'font-weight': 'bold',
  };
}
```

위의 예는 다음 DOM을 렌더링합니다.

```angular-html
<ul style="display: flex; padding: 8px"> ... </ul>
<section style="border: 1px solid black; font-weight: bold"> ... </section>
```

`style`을 객체에 바인딩할 때 Angular는 이전 값과 현재 값을 삼중 동등 연산자 (`===`)로 비교합니다. 이러한 값을 수정할 때는 업데이트를 적용할 수 있도록 새 객체 인스턴스를 만들어야 합니다.

요소에 동일한 스타일 속성에 대한 여러 바인딩이 있는 경우, Angular는 스타일 우선 순위 순서를 따라 충돌을 해결합니다.