# 생성자 기반 의존성 주입

이전 활동에서는 `inject()` 함수를 사용하여 리소스를 사용할 수 있도록 하여 그것들을 구성요소에 "제공"했습니다. `inject()` 함수는 하나의 패턴이며, 생성자 기반 의존성 주입이라는 리소스를 주입하는 다른 패턴이 있다는 것을 아는 것이 유용합니다.

구성 요소의 `constructor` 함수에 리소스를 매개변수로 지정합니다. Angular는 이 리소스를 구성 요소에서 사용할 수 있도록 만듭니다.
<br><br>
이번 활동에서는 생성자 기반 의존성 주입을 사용하는 방법을 배웁니다.

<hr>

서비스나 기타 주입 가능한 리소스를 구성 요소에 주입하려면 다음 구문을 사용하세요:

<docs-code language="ts" highlight="[3]">
@Component({...})
class PetCarDashboardComponent {
    constructor(private petCareService: PetCareService) {
        ...
    }
}
</docs-code>

여기서 주목할 몇 가지 사항이 있습니다:

- `private` 키워드를 사용합니다.
- `petCareService`는 클래스에서 사용할 수 있는 속성이 됩니다.
- `PetCareService` 클래스는 주입된 클래스입니다.

좋습니다, 이제 이걸 시도해 보세요:

<docs-workflow>

<docs-step title="코드를 생성자 기반 DI를 사용하도록 업데이트하기">

`app.component.ts`에서 생성자 코드를 아래 코드를 맞추도록 업데이트하세요:

팁: 막히면 이 활동 페이지의 예제를 참조하세요.

```ts
constructor(private carService: CarService) {
    this.display = this.carService.getCars().join(' ⭐️ ');
}
```

</docs-step>

</docs-workflow>

이 활동을 완료한 것을 축하합니다. 예제 코드는 `inject` 함수를 사용할 때와 동일하게 작동합니다. 이 두 접근 방식은 대체로 비슷하지만 이 튜토리얼의 범위를 넘는 몇 가지 작은 차이점이 있습니다.

<br>

의존성 주입에 대한 더 많은 정보는 [Angular 문서](guide/di)에서 확인할 수 있습니다.