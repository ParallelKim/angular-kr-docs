# `inject` 함수로의 마이그레이션

Angular의 `inject` 함수는 생성자 기반 주입에 비해 보다 정확한 타입과 표준 데코레이터와의 호환성을 제공합니다.

이 스키마는 클래스의 생성자 기반 주입을 대신하여 `inject` 함수를 사용하도록 변환합니다.

다음 명령어를 사용하여 스키마를 실행하십시오:

<docs-code language="shell">

ng generate @angular/core:inject

</docs-code>

#### 이전

<docs-code language="typescript">
import { Component, Inject, Optional } from '@angular/core';
import { MyService } from './service';
import { DI_TOKEN } from './token';

@Component()
export class MyComp {
  constructor(
    private service: MyService,
    @Inject(DI_TOKEN) @Optional() readonly token: string) {}
}
</docs-code>

#### 이후

<docs-code language="typescript">
import { Component, inject } from '@angular/core';
import { MyService } from './service';
import { DI_TOKEN } from './token';

@Component()
export class MyComp {
  private service = inject(MyService);
  readonly token = inject(DI_TOKEN, { optional: true });
}
</docs-code>

## 마이그레이션 옵션

마이그레이션에는 출력 결과를 사용자화할 수 있는 여러 옵션이 포함되어 있습니다.

### `path`

프로젝트에서 어떤 하위 경로를 마이그레이션할지를 결정합니다. 전체 디렉터리를 마이그레이션하려면 `.`를 전달하거나 비워 두십시오.

### `migrateAbstractClasses`

Angular는 추상 클래스의 매개변수가 주입 가능한지 검증하지 않습니다. 이는 마이그레이션이 손상이 발생할 위험 없이 `inject`로 신뢰성 있게 마이그레이션할 수 없음을 의미합니다. 따라서 기본적으로 비활성화됩니다. 추상 클래스가 마이그레이션되기를 원하면 이 옵션을 활성화하십시오. 그러나 **일부 손상을 수동으로 수정해야 할 수도 있습니다**.

### `backwardsCompatibleConstructors`

기본적으로 마이그레이션은 가능한 한 코드를 정리하려고 시도하며, 여기에는 생성자에서 매개변수를 삭제하거나 코드가 포함되지 않은 경우 전체 생성자를 삭제하는 것이 포함됩니다. 일부 경우 Angular 데코레이터가 포함된 클래스가 다른 Angular 데코레이터가 포함된 클래스를 상속할 때 컴파일 오류가 발생할 수 있습니다. 이 옵션을 활성화하면 마이그레이션이 이전 호환성을 유지하기 위해 추가 생성자 서명을 생성하지만, 그 대가로 더 많은 코드가 발생합니다.

#### 이전

<docs-code language="typescript">
import { Component } from '@angular/core';
import { MyService } from './service';

@Component()
export class MyComp {
  constructor(private service: MyService) {}
}
</docs-code>

#### 이후

<docs-code language="typescript">
import { Component } from '@angular/core';
import { MyService } from './service';

@Component()
export class MyComp {
  private service = inject(MyService);

  /** 이전 호환성을 위한 Angular inject() 마이그레이션에 의해 삽입됨 */
  constructor(...args: unknown[]);

  constructor() {}
}
</docs-code>

### `nonNullableOptional`

`@Optional` 데코레이터가 있는 매개변수의 주입이 실패하면 Angular는 `null`을 반환합니다. 이는 모든 `@Optional` 매개변수의 실제 타입이 `| null`이 됨을 의미합니다. 그러나 데코레이터는 자신의 타입에 영향을 미칠 수 없으므로, 타입이 올바르지 않은 기존 코드가 많이 있습니다. 이 타입은 `inject()`에서 수정되며, 새로운 컴파일 오류가 발생할 수 있습니다. 이 옵션을 활성화하면 마이그레이션은 이전 타입과 일치시키기 위해 `inject()` 호출 후에 null이 아님을 단언하는 것을 생성하지만, 그로 인해 잠재적으로 타입 오류를 숨길 수 있습니다.

**참고:** nullable로 타입이 지정된 매개변수에는 null이 아님을 단언하는 문이 추가되지 않습니다. 왜냐하면 이들에 의존하는 코드는 이미 null 가능성을 고려하고 있을 가능성이 높기 때문입니다.

#### 이전

<docs-code language="typescript">
import { Component, Inject, Optional } from '@angular/core';
import { TOKEN_ONE, TOKEN_TWO } from './token';

@Component()
export class MyComp {
  constructor(
    @Inject(TOKEN_ONE) @Optional() private tokenOne: number,
    @Inject(TOKEN_TWO) @Optional() private tokenTwo: string | null) {}
}
</docs-code>

#### 이후

<docs-code language="typescript">
import { Component, inject } from '@angular/core';
import { TOKEN_ONE, TOKEN_TWO } from './token';

@Component()
export class MyComp {
  // 끝에 `!`를 주목하십시오.
  private tokenOne = inject(TOKEN_ONE, { optional: true })!;

  // 끝에 `!`가 없는 이유는 타입이 이미 nullable이기 때문입니다.
  private tokenTwo = inject(TOKEN_TWO, { optional: true });
}
</docs-code>