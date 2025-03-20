# 주입 기반 의존성 주입

주입 가능한 서비스를 만드는 것은 Angular의 의존성 주입(DI) 시스템의 첫 번째 부분입니다. 서비스를 구성 요소에 어떻게 주입합니까? Angular에는 적절한 컨텍스트에서 사용할 수 있는 `inject()`라는 편리한 기능이 있습니다.

참고: 주입 컨텍스트는 이 튜토리얼의 범위를 넘어가지만, 더 알고 싶으시면 [Angular Docs](guide/di/dependency-injection-context)에서 추가 정보를 찾을 수 있습니다.

이 활동에서는 서비스를 주입하고 구성 요소에서 사용하는 방법을 배웁니다.

<hr>

DI 시스템에서 제공하는 값으로 클래스 속성을 초기화하는 것이 종종 유용합니다. 예를 들어:

<docs-code language="ts" highlight="[3]">
@Component({...})
class PetCareDashboardComponent {
    petRosterService = inject(PetRosterService);
}
</docs-code>

<docs-workflow>

<docs-step title="`CarService` 주입하기">

`app.component.ts`에서 `inject()` 함수를 사용하여 `CarService`를 주입하고 이를 `carService`라는 속성에 할당하세요.

참고: `carService` 속성과 `CarService` 클래스 간의 차이를 주목하세요.

</docs-step>

<docs-step title="`carService` 인스턴스 사용하기">

`inject(CarService)`를 호출하면 애플리케이션에서 사용할 수 있는 `CarService` 인스턴스가 `carService` 속성에 저장됩니다.

`AppComponent`의 `constructor` 함수에 다음 구현을 추가하세요:

```ts
constructor() {
    this.display = this.carService.getCars().join(' ⭐️ ');
}
```

</docs-step>

<docs-step title="`AppComponent` 템플릿 업데이트">

`app.component.ts`에서 구성 요소 템플릿을 다음 코드로 업데이트하세요:

```ts
template: `<p>Car Listing: {{ display }}</p>`,
```

</docs-step>

</docs-workflow>

여러분은 방금 구성 요소에 첫 번째 서비스를 주입했습니다 - 멋진 노력입니다. DI에 대한 이 섹션을 마치기 전에, 구성 요소에 리소스를 주입하는 대체 구문에 대해 배울 것입니다.