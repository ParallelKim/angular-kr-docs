# 주입 가능한 서비스 만들기

서비스는 애플리케이션에 필요한 값, 기능 또는 특성의 폭넓은 범주입니다.
서비스는 일반적으로 좁고 잘 정의된 목적을 가진 클래스입니다.
구성 요소는 DI를 사용할 수 있는 클래스의 한 종류입니다.

Angular는 모듈성 및 재사용성을 높이기 위해 구성 요소와 서비스를 구분합니다.
구성 요소의 보기 관련 기능을 다른 종류의 처리와 분리함으로써 구성 요소 클래스를 간결하고 효율적으로 만들 수 있습니다.

이상적으로 구성 요소의 작업은 사용자 경험을 가능하게 하는 것뿐입니다.
구성 요소는 데이터 바인딩을 위한 속성과 메서드를 제공하여 보기(템플릿에 의해 렌더링됨)와 애플리케이션 논리(종종 모델 개념을 포함하는) 간의 중재를 해야 합니다.

구성 요소는 데이터 서버에서 가져오기, 사용자 입력 유효성 검사 또는 콘솔에 직접 로깅과 같은 특정 작업을 서비스에 위임할 수 있습니다.
주입 가능한 서비스 클래스로 이러한 처리 작업을 정의하면 모든 구성 요소에서 이러한 작업을 사용할 수 있게 됩니다.
또한 상황에 따라 적절한 동일 종류의 서비스 제공자를 구성하여 애플리케이션을 더 적응 가능하게 만들 수 있습니다.

Angular는 이러한 원칙을 강요하지 않습니다.
Angular는 애플리케이션 논리를 서비스로 분리하고 DI를 통해 이러한 서비스가 구성 요소에 제공되도록 쉽게 할 수 있도록 도와줍니다.

## 서비스 예시

다음은 브라우저 콘솔에 로깅하는 서비스 클래스의 예입니다:

<docs-code header="src/app/logger.service.ts (클래스)" language="typescript">
export class Logger {
  log(msg: unknown) { console.log(msg); }
  error(msg: unknown) { console.error(msg); }
  warn(msg: unknown) { console.warn(msg); }
}
</docs-code>

서비스는 다른 서비스에 의존할 수 있습니다.
예를 들어, 다음은 `Logger` 서비스에 의존하고 영웅을 가져오기 위해 `BackendService`를 사용하는 `HeroService`입니다.
그 서비스는 서버에서 비동기적으로 영웅을 가져오기 위해 `HttpClient` 서비스에 의존할 수 있습니다:

<docs-code header="src/app/hero.service.ts" language="typescript"
           highlight="[7,8,12,13]">
import { inject } from "@angular/core";

export class HeroService {
  private heroes: Hero[] = [];

  private backend = inject(BackendService);
  private logger = inject(Logger);

  async getHeroes() {
    // 가져오기
    this.heroes = await this.backend.getAll(Hero);
    // 로그
    this.logger.log(`Fetched ${this.heroes.length} heroes.`);
    return this.heroes;
  }
}
</docs-code>

## 주입 가능한 서비스 만들기

Angular CLI는 새로운 서비스를 만들기 위한 명령어를 제공합니다. 다음 예제에서는 기존 애플리케이션에 새로운 서비스를 추가합니다.

`src/app/heroes` 폴더에 새로운 `HeroService` 클래스를 생성하려면 다음 단계를 따르십시오:

1. 이 [Angular CLI](/tools/cli) 명령어를 실행합니다:

<docs-code language="sh">
ng generate service heroes/hero
</docs-code>

이 명령어는 다음 기본 `HeroService`를 생성합니다:

<docs-code header="src/app/heroes/hero.service.ts (CLI 생성)" language="typescript">
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeroService {}
</docs-code>

`@Injectable()` 데코레이터는 Angular가 DI 시스템에서 이 클래스를 사용할 수 있음을 지정합니다.
메타데이터 `providedIn: 'root'`는 `HeroService`가 애플리케이션 전체에서 제공됨을 의미합니다.

영웅 모의 데이터를 가져오기 위해 `mock.heroes.ts`의 영웅을 반환하는 `getHeroes()` 메서드를 추가합니다:

<docs-code header="src/app/heroes/hero.service.ts" language="typescript">
import { Injectable } from '@angular/core';
import { HEROES } from './mock-heroes';

@Injectable({
  // 이 서비스가 루트 애플리케이션 인젝터에 의해 생성되어야 함을 선언합니다.
  providedIn: 'root',
})
export class HeroService {
  getHeroes() {
    return HEROES;
  }
}
</docs-code>

명확성과 유지 관리를 위해, 구성 요소와 서비스를 별도의 파일에 정의할 것을 권장합니다.

## 서비스 주입

서비스를 구성 요소에 대한 의존성으로 주입하려면 의존성을 나타내는 클래스 필드를 선언하고 Angular의 `inject` 함수를 사용하여 초기화할 수 있습니다.

다음 예제는 `HeroListComponent`에서 `HeroService`를 지정합니다.
`heroService`의 타입은 `HeroService`입니다.
Angular는 이전에 `@Injectable` 데코레이터로 주석 처리된 클래스로 인해 `HeroService` 타입을 의존성으로 인식합니다:

<docs-code header="src/app/heroes/hero-list.component.ts" language="typescript">
import { inject } from "@angular/core";

export class HeroListComponent {
  private heroService = inject(HeroService);
}
</docs-code>

구성 요소의 생성자를 사용하여 서비스 구현도 가능합니다:

<docs-code header="src/app/heroes/hero-list.component.ts (생성자 서명)" language="typescript">
  constructor(private heroService: HeroService)
</docs-code>

`inject` 메서드는 클래스와 함수 모두에서 사용할 수 있지만, 생성자 메서드는 자연스럽게 클래스 생성자에서만 사용될 수 있습니다. 그러나 어떤 경우든 의존성은 유효한 [주입 컨텍스트](guide/di/dependency-injection-context)에서만 주입될 수 있으며, 일반적으로 구성 요소의 생성 또는 초기화에서 주입됩니다.

## 다른 서비스에 서비스 주입

서비스가 다른 서비스에 의존할 때는 구성 요소에 주입하는 것과 동일한 패턴을 따릅니다.
다음 예제에서 `HeroService`는 활동을 보고하기 위해 `Logger` 서비스에 의존합니다:

<docs-code header="src/app/heroes/hero.service.ts" language="typescript"
           highlight="[3,9,12]">
import { inject, Injectable } from '@angular/core';
import { HEROES } from './mock-heroes';
import { Logger } from '../logger.service';

@Injectable({
  providedIn: 'root',
})
export class HeroService {
  private logger = inject(Logger);

  getHeroes() {
    this.logger.log('Getting heroes.');
    return HEROES;
  }
}
</docs-code>

이 예제에서 `getHeroes()` 메서드는 영웅을 가져올 때 메시지를 로깅하여 `Logger` 서비스를 사용합니다.

## 다음 단계

<docs-pill-row>
  <docs-pill href="/guide/di/dependency-injection-providers" title="의존성 제공자 구성"/>
  <docs-pill href="/guide/di/dependency-injection-providers#using-an-injectiontoken-object" title="`InjectionTokens`"/>
</docs-pill-row>