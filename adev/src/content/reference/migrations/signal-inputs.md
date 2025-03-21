# 신호 입력으로의 마이그레이션

Angular는 v19부터 프로덕션 준비가 완료된 것으로 간주되는 개선된 입력 API를 도입했습니다.
신호 입력 및 그 이점에 대한 자세한 내용은 [전문 가이드](guide/signals/inputs)를 참조하세요.

신호 입력을 사용하고 싶어하는 기존 팀을 지원하기 위해, Angular 팀은 `@Input` 필드를 새로운 `input()` API로 변환하는 자동 마이그레이션을 제공합니다.

다음 명령어를 사용하여 스키매틱을 실행하세요:

```bash
ng generate @angular/core:signal-input-migration
```

또는 마이그레이션은 VSCode에서 [코드 리팩토링 액션](https://code.visualstudio.com/docs/typescript/typescript-refactoring#_refactoring)으로도 사용할 수 있습니다.
최신 버전의 VSCode 확장을 설치하고 `@Input` 필드를 클릭하세요.
자세한 내용은 [아래](#vscode-extension) 섹션을 참조하세요.

## 마이그레이션에서 변경되는 사항은 무엇인가요?

1. `@Input()` 클래스 멤버가 신호 `input()`에 해당하는 것으로 업데이트됩니다.
2. 마이그레이션된 입력에 대한 참조가 신호를 호출하도록 업데이트됩니다.
   - 여기에는 템플릿, 호스트 바인딩 또는 TypeScript 코드의 참조가 포함됩니다.

**이전**

```typescript
import {Component, Input} from '@angular/core';

@Component({
  template: `Name: {{name ?? ''}}`
})
export class MyComponent {
  @Input() name: string|undefined = undefined;

  someMethod(): number {
    if (this.name) {
      return this.name.length;
    }
    return -1;
  }
}
```

**후**

<docs-code language="angular-ts" highlight="[[4],[7], [10,12]]">
import {Component, input} from '@angular/core';

@Component({
  template: `Name: {{name() ?? ''}}`
})
export class MyComponent {
  readonly name = input<string>();

  someMethod(): number {
    const name = this.name();
    if (name) {
      return name.length;
    }
    return -1;
  }
}
</docs-code>

## 구성 옵션

마이그레이션은 특정 요구 사항에 맞게 조정할 수 있는 몇 가지 옵션을 지원합니다.

### `--path`

기본적으로 마이그레이션은 전체 Angular CLI 작업 영역을 업데이트합니다.
이 옵션을 사용하여 마이그레이션을 특정 하위 디렉토리로 제한할 수 있습니다.

### `--best-effort-mode`

기본적으로 마이그레이션은 안전하게 마이그레이션할 수 없는 입력을 건너뛰습니다.
마이그레이션은 가능한 한 안전하게 코드를 리팩토링하려고 합니다.

`--best-effort-mode` 플래그가 활성화되면, 마이그레이션은 빌드를 깨뜨릴 수 있음에도 불구하고 가능한 한 많이 마이그레이션하려고 시도합니다.

### `--insert-todos`

활성화되면, 마이그레이션은 마이그레이션할 수 없는 입력에 TODO를 추가합니다.
TODO에는 입력이 건너뛴 이유가 포함됩니다. 예를 들어:

```ts
// TODO: 마이그레이션을 건너뜀 이유:
//  당신의 애플리케이션 코드가 입력에 쓰기 때문에. 이는 마이그레이션을 방해합니다.
@Input() myInput = false;
```

### `--analysis-dir`

대규모 프로젝트에서는 이 옵션을 사용하여 분석되는 파일 수를 줄일 수 있습니다.
기본적으로 마이그레이션은 `--path` 옵션에 관계없이 전체 작업 영역을 분석하여 `@Input()` 마이그레이션에 영향을 받는 모든 참조를 업데이트합니다.

이 옵션을 사용하면 분석을 하위 폴더로 제한할 수 있습니다. 이는 이 디렉토리 외부의 모든 참조가 조용히 건너뛰어지며, 이는 빌드를 파손할 수 있음을 의미합니다.

## VSCode 확장

![`@Input` 필드를 클릭하는 VSCode 확장의 스크린샷](assets/images/migrations/signal-inputs-vscode.png "`@Input` 필드를 클릭하는 VSCode 확장의 스크린샷.")

마이그레이션은 VSCode에서 [코드 리팩토링 액션](https://code.visualstudio.com/docs/typescript/typescript-refactoring#_refactoring)으로 제공됩니다.

VSCode를 통한 마이그레이션을 사용하려면, 최신 버전의 VSCode 확장을 설치하고 다음 중 하나를 클릭하세요:

- `@Input` 필드를 클릭합니다.
- 또는, 지시어/컴포넌트를 클릭합니다.

그런 다음, 노란색 전구 VSCode 리팩토링 버튼이 나타날 때까지 기다립니다.
이 버튼을 통해 신호 입력 마이그레이션을 선택할 수 있습니다.