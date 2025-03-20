# 종속성 제공자 구성

이전 섹션에서는 클래스 인스턴스를 종속성으로 사용하는 방법에 대해 설명했습니다. 클래스 외에도 `boolean`, `string`, `Date` 및 객체와 같은 값을 종속성으로 사용할 수 있습니다. Angular는 종속성 구성을 유연하게 만드는 데 필요한 API를 제공하므로 DI에서 이러한 값을 사용할 수 있습니다.

## 제공자 토큰 지정

서비스 클래스를 제공자 토큰으로 지정하면 기본 동작은 주입기가 `new` 연산자를 사용하여 해당 클래스를 인스턴스화하는 것입니다.

다음 예제에서 앱 구성 요소는 `Logger` 인스턴스를 제공합니다:

<docs-code header="src/app/app.component.ts" language="typescript">
providers: [Logger],
</docs-code>

그러나 DI를 구성하여 `Logger` 제공자 토큰을 다른 클래스나 기타 값과 연결할 수 있습니다. 따라서 `Logger`가 주입될 때 구성된 값이 대신 사용됩니다.

실제로 클래스 제공자 구문은 `Provider` 인터페이스에 의해 정의된 제공자 구성으로 확장되는 축약형 표현입니다. Angular는 이 경우 `providers` 값을 전체 제공자 객체로 다음과 같이 확장합니다:

<docs-code header="src/app/app.component.ts" language="typescript">
[{ provide: Logger, useClass: Logger }]
</docs-code>

확장된 제공자 구성은 두 개의 속성을 가진 객체 리터럴입니다:

- `provide` 속성은 종속성 값을 소비하는 데 사용되는 키 역할을 하는 토큰을 보유합니다.
- 두 번째 속성은 종속성 값을 생성하는 방법을 주입기에 알리는 제공자 정의 객체입니다. 제공자 정의는 다음 중 하나일 수 있습니다:
  - `useClass` - 이 옵션은 Angular DI에 종속성이 주입될 때 제공된 클래스를 인스턴스화하라고 지시합니다.
  - `useExisting` - 토큰을 별칭으로 지정하고 기존의 어떤 것을 참조할 수 있도록 합니다.
  - `useFactory` - 종속성을 구성하는 함수를 정의할 수 있도록 합니다.
  - `useValue` - 종속성으로 사용해야 하는 정적 값을 제공합니다.

아래 섹션에서는 다양한 제공자 정의를 사용하는 방법을 설명합니다.

### 클래스 제공자: useClass

`useClass` 제공자 키를 사용하면 지정된 클래스의 새 인스턴스를 생성하고 반환할 수 있습니다.

이 유형의 제공자를 사용하여 일반 또는 기본 클래스에 대한 대체 구현을 대체할 수 있습니다. 대체 구현은 예를 들어, 다른 전략을 구현하거나 기본 클래스를 확장하거나 테스트 사례에서 실제 클래스의 동작을 에뮬레이트할 수 있습니다.

다음 예제에서 `Logger` 종속성이 구성 요소나 다른 클래스에서 요청될 때 `BetterLogger`가 인스턴스화됩니다:

<docs-code header="src/app/app.component.ts" language="typescript">
[{ provide: Logger, useClass: BetterLogger }]
</docs-code>

대체 클래스 제공자가 자체 종속성이 있는 경우 부모 모듈 또는 구성 요소의 제공자 메타데이터 속성에 두 제공자를 모두 지정합니다:

<docs-code header="src/app/app.component.ts" language="typescript">
[
  UserService, // `EvenBetterLogger`에서 필요한 종속성.
  { provide: Logger, useClass: EvenBetterLogger },
]
</docs-code>

이 예제에서 `EvenBetterLogger`는 로그 메시지에 사용자 이름을 표시합니다. 이 로거는 주입된 `UserService` 인스턴스에서 사용자를 가져옵니다:

<docs-code header="src/app/even-better-logger.component.ts" language="typescript"
           highlight="[[3],[6]]">
@Injectable()
export class EvenBetterLogger extends Logger {
  constructor(private userService: UserService) {}

  override log(message: string) {
    const name = this.userService.user.name;
    super.log(`Message to ${name}: ${message}`);
  }
}
</docs-code>

Angular DI는 `UserService` 종속성을 구성하는 방법을 알고 있습니다. 이는 위에서 구성되었고 주입기에서 사용 가능합니다.

### 별칭 제공자: useExisting

`useExisting` 제공자 키를 사용하면 한 토큰을 다른 토큰에 매핑할 수 있습니다. 실제로 첫 번째 토큰은 두 번째 토큰과 관련된 서비스의 별칭이 되어 동일한 서비스 객체에 접근하는 두 가지 방법을 만듭니다.

다음 예제에서 주입기는 구성 요소가 새 로거 또는 이전 로거를 요청할 때 `NewLogger`의 싱글톤 인스턴스를 주입합니다. 이렇게 하면 `OldLogger`가 `NewLogger`의 별칭이 됩니다.

<docs-code header="src/app/app.component.ts" language="typescript" highlight="[4]">
[
  NewLogger,
  // OldLogger를 NewLogger에 대한 참조로 별칭
  { provide: OldLogger, useExisting: NewLogger},
]
</docs-code>

주의: `useClass`로 `OldLogger`를 `NewLogger`에 별칭으로 지정하지 않도록 하십시오. 이는 두 개의 다른 `NewLogger` 인스턴스를 생성합니다.

### 팩토리 제공자: useFactory

`useFactory` 제공자 키를 사용하면 팩토리 함수를 호출하여 종속성 객체를 생성할 수 있습니다. 이 접근 방식을 사용하면 DI 및 애플리케이션의 다른 곳에서 사용할 수 있는 정보를 바탕으로 동적 값을 생성할 수 있습니다.

다음 예제에서는 인증된 사용자만 `HeroService`에서 비밀 영웅을 볼 수 있도록 해야 합니다. 인증은 한 애플리케이션 세션 동안 변경될 수 있으며, 예를 들어 다른 사용자가 로그인을 할 때입니다.

`UserService`에 보안 관련 정보를 유지하고 `HeroService`에서는 제거하기 위해 `HeroService` 생성자에 비밀 영웅의 표시를 제어하는 부울 플래그를 제공합니다:

<docs-code header="src/app/heroes/hero.service.ts" language="typescript"
           highlight="[[4],[7]]">
class HeroService {
  constructor(
    private logger: Logger,
    private isAuthorized: boolean) { }

  getHeroes() {
    const auth = this.isAuthorized ? 'authorized' : 'unauthorized';
    this.logger.log(`Getting heroes for ${auth} user.`);
    return HEROES.filter(hero => this.isAuthorized || !hero.isSecret);
  }
}
</docs-code>

`isAuthorized` 플래그를 구현하려면 `HeroService`를 위해 새 로거 인스턴스를 생성하는 팩토리 제공자를 사용합니다. 이는 로거를 수동으로 전달해야 하기 때문에 필요합니다:

<docs-code header="src/app/heroes/hero.service.provider.ts" language="typescript">
const heroServiceFactory = (logger: Logger, userService: UserService) =>
  new HeroService(logger, userService.user.isAuthorized);
</docs-code>

팩토리 함수는 `UserService`에 접근할 수 있습니다. 주입기가 이들을 팩토리 함수에 전달할 수 있도록 두 개의 `Logger`와 `UserService`를 팩토리 제공자에 주입합니다:

<docs-code header="src/app/heroes/hero.service.provider.ts" language="typescript"
           highlight="[3,4]">
export const heroServiceProvider = {
  provide: HeroService,
  useFactory: heroServiceFactory,
  deps: [Logger, UserService]
};
</docs-code>

- `useFactory` 필드는 제공자가 `heroServiceFactory`로 구현된 팩토리 함수임을 지정합니다.
- `deps` 속성은 제공자 토큰의 배열입니다. `Logger`와 `UserService` 클래스를 각자의 클래스 제공자에 대한 토큰으로 사용합니다. 주입기는 이러한 토큰을 해결하고 해당 서비스들을 지정된 순서에 따라 일치하는 `heroServiceFactory` 팩토리 함수 매개변수에 주입합니다.

팩토리 제공자를 내보낸 변수 `heroServiceProvider`에 캡처함으로써 팩토리 제공자가 재사용 가능하게 됩니다.

### 값 제공자: useValue

`useValue` 키를 사용하면 정적 값을 DI 토큰과 연결할 수 있습니다.

이 기술을 사용하여 웹사이트 기본 주소 및 기능 플래그와 같은 런타임 구성 상수를 제공합니다. 단위 테스트에서 프로덕션 데이터 서비스를 대신하여 모의 데이터를 제공하기 위해 값 제공자를 사용할 수도 있습니다.

다음 섹션에서는 `useValue` 키에 대한 정보를 제공합니다.

## `InjectionToken` 객체 사용

비클래스 종속성에 대한 제공자 토큰으로 `InjectionToken` 객체를 사용합니다. 다음 예제는 `InjectionToken` 유형의 `APP_CONFIG` 토큰을 정의합니다:

<docs-code header="src/app/app.config.ts" language="typescript" highlight="[3]">
import { InjectionToken } from '@angular/core';

export interface AppConfig {
  title: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config description');
</docs-code>

선택적 유형 매개변수 `<AppConfig>`와 토큰 설명 `app.config description`은 토큰의 용도를 지정합니다.

다음으로 `APP_CONFIG`의 `InjectionToken` 객체를 사용하여 구성 요소에 종속성 제공자를 등록합니다:

<docs-code header="src/app/app.component.ts" language="typescript">
const MY_APP_CONFIG_VARIABLE: AppConfig = {
  title: 'Hello',
};

providers: [{ provide: APP_CONFIG, useValue: MY_APP_CONFIG_VARIABLE }]
</docs-code>

이제 구성자에 `@Inject()` 매개변수 장식자를 사용하여 구성 객체를 주입합니다:

<docs-code header="src/app/app.component.ts" language="typescript" highlight="[2]">
export class AppComponent {
  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.title = config.title;
  }
}
</docs-code>

### 인터페이스와 DI

TypeScript `AppConfig` 인터페이스는 클래스 내에서 타이핑을 지원하지만, `AppConfig` 인터페이스는 DI에서 아무런 역할을 하지 않습니다. TypeScript에서 인터페이스는 설계 시간 아티팩트이며, DI 프레임워크가 사용할 수 있는 런타임 표현 또는 토큰이 없습니다.

TypeScript가 JavaScript로 변환될 때, 인터페이스는 사라집니다. JavaScript는 인터페이스가 없기 때문입니다. Angular가 런타임에 찾을 수 있는 인터페이스가 없기 때문에, 인터페이스는 토큰이 될 수 없으며 주입할 수 없습니다:

<docs-code header="src/app/app.component.ts" language="typescript">
// 인터페이스를 제공자 토큰으로 사용할 수 없음
[{ provide: AppConfig, useValue: MY_APP_CONFIG_VARIABLE })]
</docs-code>

<docs-code header="src/app/app.component.ts" language="typescript" highlight="[3]">
export class AppComponent {
  // 인터페이스를 매개변수 유형으로 사용하여 주입할 수 없음
  constructor(private config: AppConfig) {}
}
</docs-code>