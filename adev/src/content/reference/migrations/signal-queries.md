# 신호 쿼리를 위한 마이그레이션

Angular는 v19 기준으로 프로덕션 준비가 완료된 것으로 간주되는 쿼리에 대한 개선된 API를 도입했습니다.
신호 쿼리와 그 장점에 대해 더 많은 정보를 보려면 [전용 가이드](guide/signals/queries)를 읽어보세요.

신호 쿼리를 사용하고자 하는 기존 팀을 지원하기 위해 Angular 팀은 
기존 장식자 쿼리 필드를 새로운 API로 변환하는 자동화된 마이그레이션을 제공합니다.

다음 명령어를 사용하여 스케매틱을 실행하세요:

```bash
ng generate @angular/core:signal-queries-migration
```

또는 마이그레이션은 VSCode의 [코드 리팩터링 작업](https://code.visualstudio.com/docs/typescript/typescript-refactoring#_refactoring)으로도 제공됩니다.
최신 버전의 VSCode 확장을 설치하고, 예를 들어 `@ViewChild` 필드에 클릭하세요.
자세한 내용은 [아래 섹션](#vscode-extension)을 참조하세요.

## 마이그레이션은 무엇을 변경하나요?

1. `@ViewChild()`, `@ViewChildren`, `@ContentChild` 및 `@ContentChildren` 클래스 멤버가
   신호 동등물로 업데이트됩니다.
2. 마이그레이션된 쿼리에 대한 애플리케이션의 참조가 업데이트되어 신호를 호출합니다.
   - 여기에는 템플릿, 호스트 바인딩 또는 TypeScript 코드에서의 참조가 포함됩니다.

**이전**

```typescript
import {Component, ContentChild} from '@angular/core';

@Component({
  template: `Has ref: {{someRef ? 'Yes' : 'No'}}`
})
export class MyComponent {
  @ContentChild('someRef') ref: ElementRef|undefined = undefined;

  someMethod() {
    if (this.ref) {
      this.ref.nativeElement;
    }
  }
}
```

**이후**

```typescript
import {Component, contentChild} from '@angular/core';

@Component({
  template: `Has ref: {{someRef() ? 'Yes' : 'No'}}`
})
export class MyComponent {
  readonly ref = contentChild<ElementRef>('someRef');

  someMethod() {
    const ref = this.ref();
    if (ref) {
      ref.nativeElement;
    }
  }
}
```

## 구성 옵션

마이그레이션은 특정 요구 사항에 맞게 마이그레이션을 미세 조정하기 위한 몇 가지 옵션을 지원합니다.

### `--path`

기본적으로 마이그레이션은 전체 Angular CLI 작업 공간을 업데이트합니다.
이 옵션을 사용하여 특정 하위 디렉토리로 마이그레이션을 제한할 수 있습니다.

### `--best-effort-mode`

기본적으로 마이그레이션은 안전하게 마이그레이션할 수 없는 쿼리를 건너뜁니다.
마이그레이션은 가능한 한 안전하게 코드를 리팩터링하려고 합니다.

`--best-effort-mode` 플래그가 활성화되면, 마이그레이션은 
빌드를 깨뜨릴 수 있는 경우에도 가능한 한 많은 마이그레이션을 시도합니다.

### `--insert-todos`

활성화되면 마이그레이션은 마이그레이션할 수 없는 쿼리에 TODO를 추가합니다.
TODO는 쿼리가 건너뛴 이유를 포함합니다. 예를 들어:

```ts
// TODO: Migration으로 건너뜀 이유:
//  애플리케이션 코드가 쿼리에 기록됩니다. 이로 인해 마이그레이션이 불가능합니다.
@ViewChild('ref') ref?: ElementRef;
```

### `--analysis-dir`

대규모 프로젝트에서는 이 옵션을 사용하여 분석되는 파일 수를 줄일 수 있습니다.
기본적으로 마이그레이션은 `--path` 옵션과 관계없이 전체 작업 공간을 분석하여
마이그레이션되는 쿼리 선언의 영향을 받는 모든 참조를 업데이트합니다.

이 옵션을 사용하면 분석을 하위 폴더로 제한할 수 있습니다. 이 경우 이 디렉터리 외부의 모든 
참조는 조용히 건너뛰어지며, 이로 인해 빌드에 문제가 생길 수 있습니다.

## VSCode 확장

![`@ViewChild` 필드에 클릭하는 VSCode 확장 스크린샷](assets/images/migrations/signal-queries-vscode.png "VSCode 확장과 `@ViewChild` 필드에 클릭하는 스크린샷.")

마이그레이션은 VSCode의 [코드 리팩터링 작업](https://code.visualstudio.com/docs/typescript/typescript-refactoring#_refactoring)으로 제공됩니다.

VSCode를 통해 마이그레이션을 사용하려면 최신 버전의 VSCode 확장을 설치하고 다음 중 하나를 클릭하세요:

- `@ViewChild`, `@ViewChildren`, `@ContentChild`, 또는 `@ContentChildren` 필드에서
- 지시어/컴포넌트에서

그런 다음 노란색 전구 VSCode 리팩터링 버튼이 나타날 때까지 기다리세요.
이 버튼을 통해 신호 쿼리 마이그레이션을 선택할 수 있습니다.