# 주입 컨텍스트

의존성 주입(DI) 시스템은 내부적으로 현재 인젝터가 사용 가능한 런타임 컨텍스트에 의존합니다. 이는 인젝터가 이러한 컨텍스트에서 코드가 실행될 때만 작동할 수 있음을 의미합니다.

주입 컨텍스트는 다음과 같은 상황에서 사용 가능합니다:

* `@Injectable` 또는 `@Component`와 같은 DI 시스템에 의해 인스턴스화되는 클래스의 생성자(`constructor`)에서.
* 그러한 클래스의 필드 초기자에서.
* `Provider` 또는 `@Injectable`의 `useFactory`에 지정된 팩토리 함수에서.
* `InjectionToken`에 지정된 `factory` 함수에서.
* 주입 컨텍스트에서 실행되는 스택 프레임 내에서.

주입 컨텍스트에 있는지 알면 [`inject`](api/core/inject) 함수를 사용하여 인스턴스를 주입할 수 있습니다.

## 클래스 생성자

DI 시스템이 클래스를 인스턴스화할 때마다, 그것은 주입 컨텍스트 내에서 이루어집니다. 이는 프레임워크 자체에 의해 처리됩니다. 클래스의 생성자는 해당 런타임 컨텍스트에서 실행되며, [`inject`](api/core/inject) 함수를 사용하여 토큰을 주입할 수 있습니다.

<docs-code language="typescript" highlight="[[3],[6]]">
class MyComponent  {
  private service1: Service1;
  private service2: Service2 = inject(Service2); // 컨텍스트 안에서

  constructor() {
    this.service1 = inject(Service1) // 컨텍스트 안에서
  }
}
</docs-code>

## 컨텍스트 내 스택 프레임

일부 API는 주입 컨텍스트에서 실행되도록 설계되었습니다. 예를 들어, 라우터 가드의 경우입니다. 이는 가드 함수 내에서 서비스를 액세스하기 위해 [`inject`](api/core/inject)를 사용할 수 있게 해줍니다.

다음은 `CanActivateFn`에 대한 예입니다.

<docs-code language="typescript" highlight="[3]">
const canActivateTeam: CanActivateFn =
    (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
      return inject(PermissionsService).canActivate(inject(UserToken), route.params.id);
    };
</docs-code>

## 주입 컨텍스트 내에서 실행

이미 주입 컨텍스트에 있지 않은 상태에서 주어진 함수를 주입 컨텍스트에서 실행하려면 `runInInjectionContext`를 사용할 수 있습니다. 이는 `EnvironmentInjector`와 같은 주어진 인젝터에 대한 액세스를 요구합니다.

<docs-code header="src/app/heroes/hero.service.ts" language="typescript"
           highlight="[9]">
@Injectable({
  providedIn: 'root',
})
export class HeroService {
  private environmentInjector = inject(EnvironmentInjector);

  someMethod() {
    runInInjectionContext(this.environmentInjector, () => {
      inject(SomeService); // 주입된 서비스와 필요한 작업 수행
    });
  }
}
</docs-code>

`inject`는 인젝터가 필요한 토큰을 해결할 수 있는 경우에만 인스턴스를 반환한다는 점에 유의하세요.

## 컨텍스트 단언

Angular는 현재 컨텍스트가 주입 컨텍스트임을 단언하기 위해 `assertInInjectionContext` 도우미 함수를 제공합니다.

## 컨텍스트 외부에서 DI 사용

주입 컨텍스트 외부에서 [`inject`](api/core/inject)를 호출하거나 `assertInInjectionContext`를 호출하면 [오류 NG0203](/errors/NG0203)가 발생합니다.