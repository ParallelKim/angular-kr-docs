# 기존 Angular 프로젝트를 독립형으로 마이그레이션하기

**독립형 컴포넌트**는 Angular 애플리케이션을 구축하는 간소화된 방법을 제공합니다. 독립형 컴포넌트, 지시어 및 파이프는 `NgModule`의 필요성을 줄임으로써 작성 경험을 간소화하는 것을 목표로 합니다. 기존 애플리케이션은 선택적으로 점진적으로 새로운 독립형 스타일을 도입할 수 있으며, 이 과정에서 파괴적인 변경이 없습니다.

<docs-video src="https://www.youtube.com/embed/x5PZwb4XurU" title="독립형 컴포넌트 시작하기"/>

이 스키매틱은 기존 프로젝트의 컴포넌트, 지시어 및 파이프를 독립형으로 변환하는 데 도움을 줍니다. 스키매틱은 가능한 많은 코드를 자동으로 변환하는 것을 목표로 하지만, 프로젝트 작성자가 수동으로 수정해야 할 수도 있습니다.

다음 명령어를 사용하여 스키매틱을 실행하십시오:

<docs-code language="shell">

ng generate @angular/core:standalone

</docs-code>

## 업데이트 전

스키매틱을 사용하기 전에 프로젝트가 다음 조건을 충족하는지 확인하십시오:

1. Angular 15.2.0 이상을 사용하고 있습니다.
2. 컴파일 오류 없이 빌드됩니다.
3. 깨끗한 Git 브랜치에 있으며 모든 작업이 저장되었습니다.

## 스키매틱 옵션

| 옵션               | 세부사항                                                            |
|:---                |:---                                                                |
| `mode`             | 수행할 변환. 사용 가능한 옵션에 대한 세부정보는 아래의 [Migration modes](#migration-modes)를 참조하십시오. |
| `path`             | 프로젝트 루트에 상대적인 마이그레이트할 경로. 이 옵션을 사용하여 프로젝트의 일부를 점진적으로 마이그레이트할 수 있습니다. |

## 마이그레이션 단계

마이그레이션 프로세스는 세 단계로 구성됩니다. 여러 번 실행해야 하며 각 단계를 수행한 후 프로젝트가 예상대로 빌드되고 작동하는지 수동으로 확인해야 합니다.

주의: 스키매틱이 대부분의 코드를 자동으로 업데이트 할 수 있지만, 일부 엣지 케이스는 개발자의 개입이 필요합니다. 각 마이그레이션 단계 후에 수동 수정을 계획해야 합니다. 또한, 스키매틱에 의해 생성된 새로운 코드가 기존 코드의 포맷팅 규칙과 일치하지 않을 수 있습니다.

아래 나열된 순서대로 마이그레이션을 실행하고 각 단계 간에 코드가 빌드되고 실행되는지 확인하십시오:

1. `ng g @angular/core:standalone`를 실행하고 "모든 컴포넌트, 지시어 및 파이프를 독립형으로 변환"을 선택합니다.
2. `ng g @angular/core:standalone`를 실행하고 "불필요한 NgModule 클래스 제거"를 선택합니다.
3. `ng g @angular/core:standalone`를 실행하고 "독립형 API를 사용하여 프로젝트 부트스트랩"을 선택합니다.
4. 모든 린팅 및 포맷팅 검사를 실행하고, 모든 실패를 수정한 후 결과를 커밋합니다.

## 마이그레이션 후

축하합니다. 귀하의 애플리케이션이 독립형으로 변환되었습니다 🎉. 이제 수행하고 싶은 일부 선택적 후속 단계는 다음과 같습니다:

* 남아 있는 `NgModule` 선언을 찾아서 제거하십시오: ["불필요한 NgModules 제거" 단계](#remove-unnecessary-ngmodules)가 모든 모듈을 자동으로 제거할 수 없기 때문에 남아 있는 선언을 수동으로 제거해야 할 수 있습니다.
* 프로젝트의 단위 테스트를 실행하고 모든 실패를 수정하십시오.
* 프로젝트가 자동 형식을 사용하는 경우 모든 코드 포맷터를 실행하십시오.
* 프로젝트 내에서 모든 린터를 실행하고 새로운 경고를 수정하십시오. 일부 린터는 경고를 자동으로 해결할 수 있는 `--fix` 플래그를 지원합니다.

## 마이그레이션 모드

마이그레이션에는 다음과 같은 모드가 있습니다:

1. 선언을 독립형으로 변환합니다.
2. 불필요한 NgModules를 제거합니다.
3. 독립형 부트스트래핑 API로 전환합니다.
이러한 마이그레이션을 주어진 순서로 실행해야 합니다.

### 선언을 독립형으로 변환하기

이 모드에서 마이그레이션은 모든 컴포넌트, 지시어 및 파이프를 `standalone: false`를 제거하고 해당 `imports` 배열에 의존성을 추가하여 독립형으로 변환합니다.

도움이 되는 점: 스키매틱은 이 단계에서 컴포넌트를 부트스트랩하는 NgModule을 무시합니다. 왜냐하면 이러한 NgModule은 `bootstrapModule`에 의해 사용되는 루트 모듈일 가능성이 높고, 독립형 호환 `bootstrapApplication`이 아니기 때문입니다. 스키매틱은 이러한 선언을 ["독립형 부트스트래핑 API로 전환하기"](#switch-to-standalone-bootstrapping-api) 단계의 일환으로 자동으로 변환합니다.

**이전:**

```typescript
// shared.module.ts
@NgModule({
  imports: [CommonModule],
  declarations: [GreeterComponent],
  exports: [GreeterComponent]
})
export class SharedModule {}
```

```typescript
// greeter.component.ts
@Component({
  selector: 'greeter',
  template: '<div *ngIf="showGreeting">Hello</div>',
  standalone: false,
})
export class GreeterComponent {
  showGreeting = true;
}
```

**이후:**

```typescript
// shared.module.ts
@NgModule({
  imports: [CommonModule, GreeterComponent],
  exports: [GreeterComponent]
})
export class SharedModule {}
```

```typescript
// greeter.component.ts
@Component({
  selector: 'greeter',
  template: '<div *ngIf="showGreeting">Hello</div>',
  imports: [NgIf]
})
export class GreeterComponent {
  showGreeting = true;
}
```

### 불필요한 NgModules 제거하기

모든 선언을 독립형으로 변환한 후, 많은 NgModule을 안전하게 제거할 수 있습니다. 이 단계는 그러한 모듈 선언과 가능한 많은 해당 참조를 삭제합니다. 마이그레이션이 자동으로 참조를 삭제할 수 없는 경우, 개발자가 NgModule을 수동으로 삭제할 수 있도록 TODO 주석이 남겨집니다:

```typescript
/* TODO(standalone-migration): 수동으로 제거된 NgModule 참조 정리 */
```

마이그레이션은 다음 조건을 충족하면 모듈을 안전하게 제거할 수 있다고 간주합니다:

* `declarations`가 없습니다.
* `providers`가 없습니다.
* `bootstrap` 컴포넌트가 없습니다.
* `ModuleWithProviders` 기호를 참조하거나 제거할 수 없는 모듈을 참조하는 `imports`가 없습니다.
* 클래스 멤버가 없습니다. 비어 있는 생성자는 무시됩니다.

**이전:**

```typescript
// importer.module.ts
@NgModule({
  imports: [FooComponent, BarPipe],
  exports: [FooComponent, BarPipe]
})
export class ImporterModule {}
```

**이후:**

```typescript
// importer.module.ts
// 존재하지 않음!
```

### 독립형 부트스트래핑 API로 전환하기

이 단계는 `bootstrapModule`의 모든 사용을 새로운 독립형 기반의 `bootstrapApplication`으로 변환합니다. 또한 루트 컴포넌트에서 `standalone: false`를 제거하고 루트 NgModule을 삭제합니다. 루트 모듈에 `providers` 또는 `imports`가 있는 경우, 마이그레이션은 이 구성의 가능한 많은 부분을 새로운 부트스트랩 호출로 복사하려고 시도합니다.

**이전:**

```typescript
// ./app/app.module.ts
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

```typescript
// ./app/app.component.ts
@Component({
  selector: 'app',
  template: 'hello',
  standalone: false,
})
export class AppComponent {}
```

```typescript
// ./main.ts
import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';

platformBrowser().bootstrapModule(AppModule).catch(e => console.error(e));
```

**이후:**

```typescript
// ./app/app.module.ts
// 존재하지 않음!
```

```typescript
// ./app/app.component.ts
@Component({
  selector: 'app',
  template: 'hello'
})
export class AppComponent {}
```

```typescript
// ./main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch(e => console.error(e));
```

## 일반적인 문제

스키매틱이 올바르게 작동하지 않을 수 있는 몇 가지 일반적인 문제는 다음과 같습니다:

* 컴파일 오류 - 프로젝트에 컴파일 오류가 있는 경우, Angular는 이를 올바르게 분석하고 마이그레이션할 수 없습니다.
* tsconfig에 포함되지 않은 파일 - 스키매틱은 프로젝트의 `tsconfig.json` 파일을 분석하여 마이그레이트할 파일을 결정합니다. 스키매틱은 tsconfig에 의해 포함되지 않은 파일은 제외합니다.
* 정적으로 분석할 수 없는 코드 - 스키매틱은 정적 분석을 사용하여 코드를 이해하고 변경할 위치를 결정합니다. 마이그레이션은 빌드 시간에 정적으로 분석할 수 없는 메타데이터가 포함된 클래스를 건너뛸 수 있습니다.

## 제한 사항

마이그레이션의 크기와 복잡성으로 인해 스키매틱이 처리할 수 없는 경우가 몇 가지 있습니다:

* 단위 테스트가 사전 컴파일(AoT)되지 않기 때문에, 단위 테스트에 추가된 `imports`가 완전히 올바르지 않을 수 있습니다.
* 스키매틱은 Angular API에 대한 직접 호출에 의존합니다. 스키매틱은 Angular API를 감싸는 사용자 지정 래퍼를 인식할 수 없습니다. 예를 들어, `TestBed.configureTestingModule`을 감싸는 사용자 지정 `customConfigureTestModule` 함수를 정의하는 경우, 여기에 선언된 컴포넌트는 인식되지 않을 수 있습니다.