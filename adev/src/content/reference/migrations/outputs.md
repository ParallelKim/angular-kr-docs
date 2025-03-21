# Migration to output function

Angular은 v17.3에서 출력에 대한 개선된 API를 도입하였으며, v19 시점에서 프로덕션 준비 완료로 간주됩니다. 이 API는 `input()` API를 모방하지만 Signals에 기반하지 않습니다. [전문 가이드](guide/components/outputs)에서 사용자 정의 이벤트 출력 기능 및 이점에 대해 더 자세히 읽어보십시오.

출력 기능을 사용하려는 기존 프로젝트를 지원하기 위해 Angular 팀은 `@Output` 사용자 정의 이벤트를 새로운 `output()` API로 변환하는 자동 마이그레이션을 제공합니다.

다음 명령어를 사용하여 스키매틱을 실행하십시오:

```bash
ng generate @angular/core:output-migration
```

## 마이그레이션 변경 사항은 무엇인가요?

1. `@Output()` 클래스 멤버가 해당 `output()`으로 업데이트 됩니다.
2. 컴포넌트 또는 지시자의 파일에서 Imports가 Typescript 모듈 수준으로 업데이트 됩니다.
3. 사용이 권장되지 않는 `event.next()`와 같은 API 함수가 `event.emit()`으로 마이그레이션되며 `event.complete()` 호출은 제거됩니다.

**이전**

```typescript
import {Component, Output} from '@angular/core';

@Component({
  template: `<button (click)="someMethod('test')">emit</button>`
})
export class MyComponent {
  @Output() someChange = new EventEmitter<string>();

  someMethod(value: string): void {
    this.someChange.emit(value);
  }
}
```

**이후**

```typescript
import {Component, output} from '@angular/core';

@Component({
  template: `<button (click)="someMethod('test')">emit</button>`
})
export class MyComponent {
  readonly someChange = output<string>();

  someMethod(value: string): void {
    this.someChange.emit(value);
  }
}
```

## 구성 옵션

마이그레이션은 특정 요구 사항에 맞게 마이그레이션을 미세 조정하기 위한 몇 가지 옵션을 지원합니다.

### `--path`

지정하지 않은 경우, 마이그레이션은 경로를 요청하고 전체 Angular CLI 작업 공간을 업데이트합니다. 이 옵션을 사용하여 특정 하위 디렉토리로 마이그레이션을 제한할 수 있습니다.

### `--analysis-dir`

대규모 프로젝트에서는 이 옵션을 사용하여 분석되는 파일 수를 줄일 수 있습니다. 기본적으로 마이그레이션은 `@Output()` 마이그레이션의 영향을 받는 모든 참조를 업데이트하기 위해 `--path` 옵션과 관계없이 전체 작업 공간을 분석합니다.

이 옵션을 사용하면 분석을 하위 폴더로 제한할 수 있습니다. 즉, 이 디렉토리 외부의 모든 참조는 조용히 스킵되며, 이로 인해 빌드가 중단될 수 있습니다.

아래와 같이 이 옵션을 사용하십시오:

```bash
ng generate @angular/core:output-migration --path src/app/sub-folder
```

## 예외

일부 경우에 마이그레이션은 코드를 건드리지 않습니다. 이러한 예외 중 하나는 이벤트가 `pipe()` 메서드와 함께 사용되는 경우입니다. 다음 코드는 마이그레이션되지 않습니다:

```typescript
export class MyDialogComponent {
  @Output() close = new EventEmitter<void>();
  doSome(): void {
    this.close.complete();
  }
  otherThing(): void {
    this.close.pipe();
  }
}