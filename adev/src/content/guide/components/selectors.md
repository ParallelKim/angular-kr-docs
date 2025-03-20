# 구성 요소 선택기

팁: 이 가이드는 이미 [필수 가이드](essentials)를 읽었다고 가정합니다. Angular에 익숙하지 않은 경우 먼저 해당 내용을 읽으세요.

모든 구성 요소는 구성 요소가 사용되는 방식을 결정하는 [CSS 선택기](https://developer.mozilla.org/docs/Web/CSS/CSS_selectors)를 정의합니다:

<docs-code language="angular-ts" highlight="[2]">
@Component({
  selector: 'profile-photo',
  ...
})
export class ProfilePhoto { }
</docs-code>

구성 요소는 _다른_ 구성 요소의 템플릿에 일치하는 HTML 요소를 생성함으로써 사용합니다:

<docs-code language="angular-ts" highlight="[3]">
@Component({
  template: `
    <profile-photo />
    <button>새 프로필 사진 업로드</button>`,
  ...,
})
export class UserProfile { }
</docs-code>

**Angular는 컴파일 시간에 선택기를 정적으로 일치시킵니다**. 실행 시간에 DOM을 변경하면 Angular 바인딩이나 DOM API를 통해서도 렌더링된 구성 요소에는 영향을 미치지 않습니다.

**하나의 요소는 정확히 하나의 구성 요소 선택기에만 일치할 수 있습니다.** 여러 구성 요소 선택기가 단일 요소에 일치하는 경우 Angular는 오류를 보고합니다.

**구성 요소 선택기는 대소문자를 구분합니다.**

## 선택기 유형

Angular는 구성 요소 선택기에서 [기본 CSS 선택기 유형](https://developer.mozilla.org/docs/Web/CSS/CSS_Selectors)의 제한된 하위 집합을 지원합니다:

| **선택기 유형**  | **설명**                                                                                                    | **예**                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 유형 선택기      | HTML 태그 이름 또는 노드 이름을 기준으로 요소와 일치합니다.                                               | `profile-photo`              |
| 속성 선택기      | HTML 속성의 존재와 선택적으로 해당 속성의 정확한 값을 기준으로 요소와 일치합니다.                        | `[dropzone]` `[type="reset"]` |
| 클래스 선택기     | CSS 클래스의 존재를 기준으로 요소와 일치합니다.                                                           | `.menu-item`                 |

속성 값의 경우, Angular는 등호(`=`) 연산자를 사용하여 정확한 속성 값을 일치시키는 것을 지원합니다. Angular는 다른 속성 값 연산자를 지원하지 않습니다.

Angular 구성 요소 선택기는 [자손 결합기](https://developer.mozilla.org/docs/Web/CSS/Descendant_combinator) 또는 [자식 결합기](https://developer.mozilla.org/docs/Web/CSS/Child_combinator)를 포함한 결합기를 지원하지 않습니다.

Angular 구성 요소 선택기는 [네임스페이스](https://developer.mozilla.org/docs/Web/SVG/Namespaces_Crash_Course)를 지정하는 것을 지원하지 않습니다.

### `:not` 의사 클래스

Angular는 [`:not` 의사 클래스](https://developer.mozilla.org/docs/Web/CSS/:not)를 지원합니다. 이 의사 클래스를 다른 선택기에 추가하여 구성 요소의 선택기가 어떤 요소와 일치하는지를 좁힐 수 있습니다. 예를 들어 `[dropzone]` 속성 선택기를 정의하고 `textarea` 요소와 일치하지 않도록 할 수 있습니다:

<docs-code language="angular-ts" highlight="[2]">
@Component({
  selector: '[dropzone]:not(textarea)',
  ...
})
export class DropZone { }
</docs-code>

Angular는 구성 요소 선택기에서 다른 의사 클래스나 의사 요소를 지원하지 않습니다.

### 선택기 결합

여러 선택기를 결합하여 사용할 수 있습니다. 예를 들어, `type="reset"`인 `<button>` 요소와 일치시킬 수 있습니다:

<docs-code language="angular-ts" highlight="[2]">
@Component({
  selector: 'button[type="reset"]',
  ...
})
export class ResetButton { }
</docs-code>

쉼표로 구분된 목록을 사용하여 여러 선택기를 정의할 수도 있습니다:

<docs-code language="angular-ts" highlight="[2]">
@Component({
  selector: 'drop-zone, [dropzone]',
  ...
})
export class DropZone { }
</docs-code>

Angular는 목록의 _모든_ 선택기와 일치하는 요소마다 구성 요소를 생성합니다.

## 선택기 선택

대다수의 구성 요소는 선택기로 사용자 정의 요소 이름을 사용하는 것이 좋습니다. 모든 사용자 정의 요소 이름은 [HTML 사양](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name)에 설명된 대로 하이픈을 포함해야 합니다. 기본적으로 Angular는 사용 가능한 구성 요소와 일치하지 않는 사용자 정의 태그 이름을 만나면 오류를 보고하여 잘못 입력된 구성 요소 이름으로 인한 버그를 방지합니다.

[네이티브 사용자 정의 요소](https://developer.mozilla.org/docs/Web/Web_Components)를 Angular 템플릿에서 사용하는 방법에 대한 자세한 내용은 [고급 구성 요소 구성](guide/components/advanced-configuration)을 참조하세요.

### 선택기 접두사

Angular 팀은 프로젝트 내에서 정의된 모든 사용자 정의 구성 요소에 대해 짧고 일관된 접두사를 사용할 것을 권장합니다. 예를 들어 Angular로 YouTube를 빌드하려는 경우 구성 요소에 `yt-` 접두사를 붙일 수 있으며, 그러면 `yt-menu`, `yt-player`와 같은 구성 요소가 생깁니다. 이렇게 선택기에 네임스페이스를 부여하면 특정 구성 요소가 어디에서 오는지 즉시 명확해집니다. 기본적으로 Angular CLI는 `app-`를 사용합니다.

Angular는 자체 프레임워크 API에 대해 `ng` 선택기 접두사를 사용합니다. 사용자 정의 구성 요소에 대한 선택기 접두사로 `ng`를 절대 사용하지 마십시오.

### 속성 선택기를 사용할 때

표준 네이티브 요소에서 구성 요소를 생성하려는 경우 속성 선택기를 고려해야 합니다. 예를 들어 사용자 정의 버튼 구성 요소를 생성하려는 경우, 속성 선택기를 사용하여 표준 `<button>` 요소를 활용할 수 있습니다:

<docs-code language="angular-ts" highlight="[2]">
@Component({
  selector: 'button[yt-upload]',
   ...
})
export class YouTubeUploadButton { }
</docs-code>

이 접근 방식은 구성 요소 소비자가 추가 작업 없이 요소의 모든 표준 API를 직접 사용할 수 있게 합니다. 이는 `aria-label`과 같은 ARIA 속성에 특히 유용합니다.

Angular는 사용 가능한 구성 요소와 일치하지 않는 사용자 정의 속성을 만날 때 오류를 보고하지 않습니다. 속성 선택기를 가진 구성 요소를 사용할 때 소비자가 구성 요소나 해당 NgModule을 가져오는 것을 잊어버릴 수 있으며, 이로 인해 구성 요소가 렌더링되지 않을 수 있습니다. 더 많은 정보는 [구성 요소 가져오기 및 사용](guide/components/importing)을 참조하세요.

속성 선택기를 정의한 구성 요소는 소문자와 대시 구문 속성을 사용해야 합니다. 위에서 설명한 접두사 추천을 따를 수 있습니다.