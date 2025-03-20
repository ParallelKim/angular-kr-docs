# 주입 가능한 서비스 만들기

Angular의 의존성 주입(DI)은 프레임워크의 가장 강력한 기능 중 하나입니다. 의존성 주입을 Angular가 애플리케이션을 실행하는 동안 필요한 자원을 _제공_하는 능력으로 생각하세요. 의존성은 서비스나 다른 자원일 수 있습니다.

[Angular 문서에서 의존성 주입에 대해 더 알아보세요](guide/di). 지금은 `injectable` 자원을 만드는 연습을 하게 됩니다.

이번 활동에서는 주입 가능한 서비스를 만드는 방법을 배울 것입니다.

<hr>

서비스를 사용하는 한 가지 방법은 데이터 및 API와 상호 작용하는 방법으로 작동하는 것입니다. 서비스를 재사용 가능하게 만들기 위해서는 서비스 내의 논리를 유지하고 필요할 때 애플리케이션 전반에 걸쳐 공유해야 합니다.

서비스가 DI 시스템에 의해 주입되도록 하려면 `@Injectable` 데코레이터를 사용하세요. 예를 들면:

<docs-code language="ts" highlight="[1, 2, 3]">
@Injectable({
    providedIn: 'root'
})
class UserService {
    // 데이터를 검색하고 반환하는 메서드
}
</docs-code>

`@Injectable` 데코레이터는 DI 시스템에 `UserService`가 클래스에서 요청될 준비가 되어 있음을 알립니다. `providedIn`은 이 자원이 사용 가능한 범위를 설정합니다. 현재로서는 `providedIn: 'root'`가 `UserService`가 전체 애플리케이션에서 사용 가능하다는 것을 이해하는 것으로 충분합니다.

좋습니다, 당신이 해보세요:

<docs-workflow>

<docs-step title="Add the `@Injectable` decorator">
`car.service.ts`의 코드를 업데이트하여 `@Injectable` 데코레이터를 추가하세요.
</docs-step>

<docs-step title="Configure the decorator">
데코레이터에 전달된 객체의 값은 데코레이터의 구성으로 간주됩니다.
<br>
`car.service.ts`의 `@Injectable` 데코레이터를 업데이트하여 `providedIn: 'root'`에 대한 구성을 포함하세요.

팁: 위의 예제를 사용하여 올바른 구문을 찾으세요.

</docs-step>

</docs-workflow>

잘했습니다 👍 이제 그 서비스는 `injectable`이 되어 재미에 참여할 수 있습니다. 이제 서비스가 `injectable`이 되었으니 컴포넌트에 주입해 보겠습니다 👉