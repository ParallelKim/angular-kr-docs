# 구조 지시자

구조 지시자는 `<ng-template>` 요소에 적용되어 해당 `<ng-template>`의 내용을 조건부로 또는 반복적으로 렌더링하는 지시자입니다.

## 예제 사용 사례

이 가이드에서는 주어진 데이터 소스에서 데이터를 가져오고 해당 데이터가 사용할 수 있을 때 템플릿을 렌더링하는 구조 지시자를 만들 것입니다. 이 지시자는 SQL 키워드 `SELECT`에 따라 이름 지어진 `SelectDirective`이며, 특성 선택자 `[select]`와 일치합니다.

`SelectDirective`는 사용될 데이터 소스를 명명하는 입력값을 가지며, 이를 `selectFrom`이라 부릅니다. 이 입력의 `select` 접두사는 [축약 구문](#structural-directive-shorthand)에 중요합니다. 이 지시자는 선택된 데이터를 제공하는 템플릿 컨텍스트로 `<ng-template>`을 인스턴스화합니다.

다음은 `<ng-template>`에서 이 지시자를 직접 사용하는 예제입니다:

```angular-html
<ng-template select let-data [selectFrom]="source">
  <p>데이터는: {{ data }}</p>
</ng-template>
```

구조 지시자는 데이터가 사용할 수 있게 될 때까지 기다렸다가 `<ng-template>`을 렌더링할 수 있습니다.

도움말: Angular의 `<ng-template>` 요소는 기본적으로 아무 것도 렌더링하지 않는 템플릿을 정의합니다. 구조 지시자를 적용하지 않고 요소를 `<ng-template>`으로 단순히 감싸면 해당 요소는 렌더링되지 않습니다.

자세한 내용은 [ng-template API](api/core/ng-template) 문서를 참조하십시오.

## 구조 지시자 축약 구문

Angular는 구조 지시자에 대해 명시적으로 `<ng-template>` 요소를 작성할 필요가 없는 축약 구문을 지원합니다.

구조 지시자는 지시자 속성 선택자 앞에 별표(`*`)를 접두사로 붙여 요소에 직접 적용할 수 있습니다. 예를 들어 `*select`와 같이 사용합니다. Angular는 구조 지시자 앞의 별표를 지시자를 호스팅하고 요소 및 그 자손을 둘러싸는 `<ng-template>`으로 변환합니다.

`SelectDirective`와 함께 다음과 같이 사용할 수 있습니다:

```angular-html
<p *select="let data from source">데이터는: {{data}}</p>
```

이 예제는 때때로 _마이크로구문_이라고 불리는 구조 지시자 축약 구문의 유연성을 보여줍니다.

이와 같이 사용될 때 구조 지시자와 그 바인딩만이 `<ng-template>`에 적용됩니다. `<p>` 태그의 다른 속성이나 바인딩은 그대로 남아 있습니다. 예를 들어, 다음 두 형태는 동등합니다:

```angular-html
<!-- 축약 구문: -->
<p class="data-view" *select="let data from source">데이터는: {{data}}</p>

<!-- 장황한 구문: -->
<ng-template select let-data [selectFrom]="source">
  <p class="data-view">데이터는: {{data}}</p>
</ng-template>
```

축약 구문은 일련의 관례를 통해 확장됩니다. 더 철저한 [문법](#structural-directive-syntax-reference)은 아래에 정의되어 있지만, 위의 예에서는 이 변환을 다음과 같이 설명할 수 있습니다:

`*select` 표현의 첫 번째 부분은 `let data`로, 템플릿 변수를 선언합니다. 할당이 뒤따르지 않으므로 템플릿 변수는 템플릿 컨텍스트 속성 `$implicit`에 바인딩됩니다.

두 번째 구문 조각은 키-표현 쌍인 `from source`입니다. `from`은 바인딩 키이며 `source`는 일반 템플릿 표현입니다. 바인딩 키는 PascalCase로 변환되고 구조 지시자 선택자에 접두사가 붙여서 속성에 매핑됩니다. `from` 키는 `selectFrom`에 매핑되며, 이후 표현식 `source`에 바인딩됩니다. 이는 많은 구조 지시자들이 모두 구조 지시자의 선택자로 접두사가 붙은 입력값을 가지는 이유입니다.

## 요소당 하나의 구조 지시자

축약 구문을 사용할 때 각 요소에 하나의 구조 지시자만 적용할 수 있습니다. 이는 해당 지시자가 펼쳐질 `<ng-template>` 요소가 하나만 존재하기 때문입니다. 여러 지시자가 필요한 경우 여러 개의 중첩 `<ng-template>`이 필요하며, 어떤 지시자가 먼저 와야 하는지 명확하지 않습니다. `<ng-container>`는 같은 물리적 DOM 요소 또는 구성 요소 주위에 여러 구조 지시자를 적용해야 할 때 래퍼 레이어를 생성하는 데 사용될 수 있으며, 사용자가 중첩 구조를 정의할 수 있게 해줍니다.

## 구조 지시자 만들기

이 섹션에서는 `SelectDirective`를 만드는 방법을 안내합니다.

<docs-workflow>
<docs-step title="지시자 생성">
Angular CLI를 사용하여 다음 명령을 실행합니다. 여기서 `select`는 지시자 이름입니다:

```shell
ng generate directive select
```

Angular는 지시자 클래스를 생성하고 템플릿에서 지시자를 식별하는 CSS 선택자 `[select]`를 지정합니다.
</docs-step>
<docs-step title="지시자 구조형 만들기">
`TemplateRef`와 `ViewContainerRef`를 가져옵니다. 지시자 생성자에 `TemplateRef`와 `ViewContainerRef`를 개인 변수로 주입합니다.

```ts
import {Directive, TemplateRef, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[select]',
})
export class SelectDirective {
  constructor(private templateRef: TemplateRef, private ViewContainerRef: ViewContainerRef) {}
}

```

</docs-step>
<docs-step title="‘selectFrom’ 입력 추가">
`selectFrom` `@Input()` 속성을 추가합니다.

```ts
export class SelectDirective {
  // ...

  @Input({required: true}) selectFrom!: DataSource;
}
```

</docs-step>
<docs-step title="비즈니스 논리 추가">
이제 구조 지시자로 틀을 갖춘 `SelectDirective`에 데이터를 가져오고 템플릿을 렌더링하는 논리를 추가할 수 있습니다:

```ts
export class SelectDirective {
  // ...

  async ngOnInit() {
    const data = await this.selectFrom.load();
    this.viewContainerRef.createEmbeddedView(this.templateRef, {
      // 데이터 키 `$implicit`로 구성된 컨텍스트 개체로 내장된 뷰를 생성합니다.
      $implicit: data,
    });
  }
}
```

</docs-step>
</docs-workflow>

그것으로 `SelectDirective`가 실행됩니다. 후속 단계는 [템플릿 유형 검사 지원 추가](#typing-the-directives-context)일 수 있습니다.

## 구조 지시자 구문 참조

자체 구조 지시자를 작성할 때 다음 구문을 사용하십시오:

<docs-code hideCopy language="typescript">

*:prefix="( :let | :expression ) (';' | ',')? ( :let | :as | :keyExp )*"

</docs-code>

다음 패턴은 구조 지시자 문법의 각 부분을 설명합니다:

```ts
as = :export "as" :local ";"?
keyExp = :key ":"? :expression ("as" :local)? ";"?
let = "let" :local "=" :export ";"?
```

| 키워드      | 세부정보                                            |
| :----------- | :------------------------------------------------- |
| `prefix`     | HTML 속성 키                                      |
| `key`        | HTML 속성 키                                      |
| `local`      | 템플릿에서 사용되는 로컬 변수 이름               |
| `export`     | 주어진 이름으로 지시자에 의해 내보낸 값          |
| `expression` | 표준 Angular 표현                                 |

### Angular가 축약형을 변환하는 방법

Angular는 구조 지시자 축약형을 정상 바인딩 구문으로 변환합니다:

| 축약형 | 변환 |
|:--- |:--- |
| `prefix` 및 나체 `expression` | `[prefix]="expression"` |
| `keyExp` | `[prefixKey]="expression"` (여기서 `prefix`는 `key`에 추가됨) |
| `let local` | `let-local="export"` |

### 축약형 예제

다음 표는 축약형 예제를 제공합니다:

| 축약형 | Angular가 구문을 해석하는 방법 |
|:--- |:--- |
| `*ngFor="let item of [1,2,3]"` | `<ng-template ngFor let-item [ngForOf]="[1, 2, 3]">` |
| `*ngFor="let item of [1,2,3] as items; trackBy: myTrack; index as i"` | `<ng-template ngFor let-item [ngForOf]="[1,2,3]" let-items="ngForOf" [ngForTrackBy]="myTrack" let-i="index">` |
| `*ngIf="exp"`| `<ng-template [ngIf]="exp">` |
| `*ngIf="exp as value"` | `<ng-template [ngIf]="exp" let-value="ngIf">` |

## 맞춤 지시자의 템플릿 유형 검사 개선하기

맞춤 지시자의 템플릿 유형 검사를 개선하려면 지시자 정의에 템플릿 가드를 추가할 수 있습니다. 이러한 가드는 Angular 템플릿 유형 검사기가 컴파일 타임에 템플릿의 오류를 찾도록 도와주며, 이는 런타임 오류를 피할 수 있습니다. 두 가지 유형의 가드가 가능합니다:

* `ngTemplateGuard_(input)`를 사용하면 특정 입력 유형에 따라 입력 표현식을 좁히는 방법을 제어할 수 있습니다.
* `ngTemplateContextGuard`는 템플릿의 컨텍스트 객체 유형을 지시자 자체 유형에 따라 결정하는 데 사용됩니다.

이 섹션에서는 두 가지 유형의 가드 예제를 제공합니다. 자세한 내용은 [템플릿 유형 검사](tools/cli/template-typecheck "템플릿 유형 검사 가이드")를 참조하십시오.

### 템플릿 가드를 사용한 유형 좁히기

템플릿의 구조 지시자는 해당 템플릿이 런타임에서 렌더링되는지 여부를 제어합니다. 일부 구조 지시자는 입력 표현식의 유형에 따라 유형 좁히기를 수행하고자 합니다.

입력 가드를 사용하여 아래 두 가지 유형의 좁히기가 가능합니다:

* TypeScript 유형 단언 기능을 기반으로 입력 표현식을 좁히기.
* 진리성을 기반으로 입력 표현식을 좁히기.

타입 단언 기능을 정의하여 입력 표현식을 좁히려면:

```ts
// 이 지시자는 배우가 사용자일 경우에만 템플릿을 렌더링합니다.
// 템플릿 내에서 `actor` 표현식의 유형이 `User`로 좁혀지도록 단언하고자 합니다.
@Directive(...)
class ActorIsUser {
  @Input() actor: User|Robot;

  static ngTemplateGuard_actor(dir: ActorIsUser, expr: User|Robot): expr is User {
    // 반환문은 실제로 필요하지 않지만 TypeScript 오류를 피하기 위해 포함되어 있습니다.
    return true;
  }
}
```

유형 검사는 템플릿 내에서 입력에 바인딩된 표현식에 `ngTemplateGuard_actor`가 단언된 것처럼 행동합니다.

일부 지시자는 입력이 진리성(true)일 때만 템플릿을 렌더링합니다. 진리성의 전체 의미를 타입 단언 기능으로 포착할 수는 없으므로, 대신 `binding`이라는 리터럴 유형을 사용하여 템플릿 유형 검사기에 바인딩 표현식 자체가 가드로 사용되도록 신호를 전달할 수 있습니다:

```ts
@Directive(...)
class CustomIf {
  @Input() condition!: any;

  static ngTemplateGuard_condition: 'binding';
}
```

템플릿 유형 검사기는 조건에 바인딩된 표현식이 템플릿 내에서 진리성으로 단언되었다고 가정하여 동작합니다.

### 지시자의 컨텍스트 유형 지정

구조 지시자가 인스턴스화된 템플릿에 컨텍스트를 제공하는 경우, 템플릿 내에서 이를 적절히 타입 지정할 수 있습니다. 이를 위해 정적 `ngTemplateContextGuard` 유형 단언 기능을 제공할 수 있습니다. 이 함수는 지시자의 유형을 사용하여 컨텍스트의 유형을 유도할 수 있으며, 지시자의 유형이 일반적일 때 유용합니다.

위에서 설명한 `SelectDirective`의 경우, 데이터 유형을 올바르게 지정하기 위해 `ngTemplateContextGuard`를 구현할 수 있습니다. 데이터 소스가 일반적인 경우에도 가능합니다.

```ts
// 템플릿 컨텍스트에 대한 인터페이스를 선언합니다:
export interface SelectTemplateContext<T> {
  $implicit: T;
}

@Directive(...)
export class SelectDirective<T> {
  // 지시자의 일반 유형 `T`는 입력으로 전달된 `DataSource` 유형에서 유추됩니다.
  @Input({required: true}) selectFrom!: DataSource<T>;

  // 지시자의 일반 유형을 사용하여 컨텍스트 유형을 좁힙니다.
  static ngTemplateContextGuard<T>(dir: SelectDirective<T>, ctx: any): ctx is SelectTemplateContext<T> {
    // 이전과 마찬가지로 가드 본체는 런타임에서 사용되지 않으며, TypeScript 오류를 방지하기 위해 포함되어 있습니다.
    return true;
  }
}