# DI in action

이 가이드는 Angular에서 의존성 주입의 추가 기능을 탐구합니다.

## `@Inject`와 함께하는 사용자 지정 제공자

사용자 지정 제공자를 사용하면 내장 브라우저 API와 같은 암시적 의존성에 대한 구체적인 구현을 제공할 수 있습니다.
다음 예제는 `InjectionToken`을 사용하여 `BrowserStorageService`의 종속성으로 [localStorage](https://developer.mozilla.org/docs/Web/API/Window/localStorage) 브라우저 API를 제공합니다:

<docs-code header="src/app/storage.service.ts" language="typescript"
           highlight="[[3,6],[12]]">
import { Inject, Injectable, InjectionToken } from '@angular/core';

export const BROWSER_STORAGE = new InjectionToken<Storage>('Browser Storage', {
  providedIn: 'root',
  factory: () => localStorage
});

@Injectable({
  providedIn: 'root'
})
export class BrowserStorageService {
  constructor(@Inject(BROWSER_STORAGE) public storage: Storage) {}

  get(key: string) {
    return this.storage.getItem(key);
  }

  set(key: string, value: string) {
    this.storage.setItem(key, value);
  }
}
</docs-code>

`factory` 함수는 브라우저의 window 객체에 부착된 `localStorage` 속성을 반환합니다.
`Inject` 데코레이터는 `storage` 생성자 매개변수에 적용되어 종속성의 사용자 지정 제공자를 지정합니다.

이 사용자 지정 제공자는 이제 실제 브라우저 API와 상호작용하는 대신 테스트 중에 `localStorage`의 모의 API로 재정의할 수 있습니다.

## 컴포넌트의 DOM 요소 주입하기

개발자들은 이를 피하려고 노력하지만, 일부 시각 효과 및 서드파티 도구는 직접적인 DOM 접근을 필요로 합니다.
결과적으로 컴포넌트의 DOM 요소에 접근해야 할 수도 있습니다.

Angular는 `ElementRef` 주입 토큰을 사용하여 `@Component` 또는 `@Directive`의 기본 요소를 주입합니다:

<docs-code language="typescript" highlight="[7]">
import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {
  constructor(private element: ElementRef) {}

  update() {
    this.element.nativeElement.style.color = 'red';
  }
}
</docs-code>

## 순환 의존성을 앞으로 참조하여 해결하기

TypeScript에서 클래스 선언 순서는 중요합니다.
정의되기 전까지는 클래스를 직접 참조할 수 없습니다.

일반적으로 문제는 아니지만, 특히 권장되는 *파일당 하나의 클래스* 규칙을 준수하는 경우에는 문제가 되지 않습니다.
하지만 때로는 순환 참조가 불가피합니다.
예를 들어, 클래스 'A'가 클래스 'B'를 참조하고 'B'가 'A'를 참조할 때, 둘 중 하나는 먼저 정의되어야 합니다.

Angular의 `forwardRef()` 함수는 Angular가 나중에 해결할 수 있는 *간접* 참조를 생성합니다.

클래스가 *자기 자신을 참조할 때*도 유사한 문제에 직면하게 됩니다.
예를 들어, `providers` 배열에서 그렇습니다.
`providers` 배열은 클래스 정의보다 먼저 나타나야 하는 `@Component()` 데코레이터 함수의 속성입니다.
`forwardRef`를 사용하여 이러한 순환 참조를 끊을 수 있습니다.

<docs-code header="app.component.ts" language="typescript" highlight="[4]">
providers: [
  {
    provide: PARENT_MENU_ITEM,
    useExisting: forwardRef(() => MenuItem),
  },
],
</docs-code>