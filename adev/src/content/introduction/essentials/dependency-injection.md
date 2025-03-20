<docs-decorative-header title="의존성 주입" imgSrc="adev/src/assets/images/dependency_injection.svg"> <!-- markdownlint-disable-line -->
코드를 재사용하고 애플리케이션과 테스트 전반에 걸쳐 동작을 제어하십시오.
</docs-decorative-header>

구성 요소 간에 로직을 공유해야 할 때 Angular는 [의존성 주입](guide/di) 디자인 패턴을 활용하여 “서비스”를 생성할 수 있게 하며, 이를 통해 단일 진실의 소스에서 코드를 강조하고 구성 요소에 주입할 수 있습니다.

## 서비스란 무엇인가요?

서비스는 주입할 수 있는 재사용 가능한 코드 조각입니다.

구성 요소를 정의하는 것과 유사하게, 서비스는 다음으로 구성됩니다:

- `@Injectable`을 사용하여 클래스를 Angular 서비스로 선언하고 `providedIn` 속성을 통해 서비스에 접근할 수 있는 애플리케이션의 부분을 정의할 수 있게 해주는 **TypeScript 데코레이터** (일반적으로 `'root'`입니다).
- 서비스가 주입될 때 접근할 수 있는 원하는 코드를 정의하는 **TypeScript 클래스** 

여기 `Calculator` 서비스의 예가 있습니다.

```angular-ts
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class Calculator {
  add(x: number, y: number) {
    return x + y;
  }
}
```

## 서비스 사용 방법

구성 요소에서 서비스를 사용하려면 다음을 수행해야 합니다:

1. 서비스를 가져옵니다.
2. 서비스가 주입될 클래스 필드를 선언합니다. 클래스 필드를 내장 함수 `inject`의 호출 결과로 할당하여 서비스를 생성합니다.

`Receipt` 구성 요소에서 이것이 어떻게 보일 수 있는지 보여줍니다:

```angular-ts
import { Component, inject } from '@angular/core';
import { Calculator } from './calculator';

@Component({
  selector: 'app-receipt',
  template: `<h1>총액은 {{ totalCost }}입니다</h1>`,
})

export class Receipt {
  private calculator = inject(Calculator);
  totalCost = this.calculator.add(50, 25);
}
```

이 예제에서는 `Calculator`가 Angular 함수 `inject`를 호출하고 서비스로 전달하여 사용되고 있습니다.

## 다음 단계

<docs-pill-row>
  <docs-pill title="기초 후 다음 단계" href="essentials/next-steps" />
  <docs-pill title="심층 의존성 주입 가이드" href="guide/di" />
</docs-pill-row>