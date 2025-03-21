# 사전 컴파일(AOT) 

Angular 애플리케이션은 주로 구성 요소와 해당 HTML 템플릿으로 구성됩니다.  
Angular가 제공하는 구성 요소와 템플릿은 브라우저가 직접 이해할 수 없기 때문에, Angular 애플리케이션은 브라우저에서 실행되기 전에 컴파일 프로세스가 필요합니다. 

Angular 사전 컴파일(AOT) 컴파일러는 Angular HTML 및 TypeScript 코드를 빌드 단계에서 브라우저가 코드 다운로드 및 실행하기 전에 효율적인 JavaScript 코드로 변환합니다.  
애플리케이션을 빌드 프로세스 중에 컴파일하면 브라우저에서 더 빠른 렌더링을 제공합니다. 

이 가이드는 메타데이터를 지정하고 사용 가능한 컴파일러 옵션을 적용하여 AOT 컴파일러를 사용하여 애플리케이션을 효율적으로 컴파일하는 방법을 설명합니다. 

도움이 됨: [Alex Rickabaugh의 Angular 컴파일러 설명 보기](https://www.youtube.com/watch?v=anphffaCZrQ) (AngularConnect 2019에서) 

AOT를 사용하려는 몇 가지 이유는 다음과 같습니다. 

| 이유                                   | 세부사항 |
|:---                                   |:---     |
| 더 빠른 렌더링                       | AOT를 사용하면 브라우저가 애플리케이션의 사전 컴파일 버전을 다운로드합니다. 브라우저는 즉시 애플리케이션을 렌더링할 수 있도록 실행 가능한 코드를 로드하므로 애플리케이션을 먼저 컴파일할 때까지 기다릴 필요가 없습니다.                                       |
| 더 적은 비동기 요청                   | 컴파일러는 외부 HTML 템플릿과 CSS 스타일 시트를 애플리케이션 JavaScript 내에서 *인라인*하여 해당 소스 파일에 대한 별도의 ajax 요청을 제거합니다.                                                                                  |
| 더 작은 Angular 프레임워크 다운로드 크기 | 애플리케이션이 이미 컴파일되어 있다면 Angular 컴파일러를 다운로드할 필요가 없습니다. 컴파일러는 Angular 자체의 대략 절반 크기이므로 이를 생략하면 애플리케이션 페이로드가 크게 줄어듭니다.                                              |
| 템플릿 오류를 더 일찍 감지           | AOT 컴파일러는 사용자가 이를 볼 수 있기 전에 빌드 단계에서 템플릿 바인딩 오류를 감지하고 보고합니다.                                                                                                                                      |
| 더 나은 보안                          | AOT는 HTML 템플릿과 구성 요소를 클라이언트에 제공되기 훨씬 전에 JavaScript 파일로 컴파일합니다. 읽을 수 있는 템플릿이 없고 위험한 클라이언트 측 HTML 또는 JavaScript 평가가 없으므로 주입 공격의 가능성이 줄어듭니다. |

## 컴파일러 선택하기 

Angular는 애플리케이션을 컴파일하는 두 가지 방법을 제공합니다: 

| Angular 컴파일                | 세부사항 |
|:---                          |:---     |
| Just-in-Time \(JIT\)        | 런타임에 브라우저에서 애플리케이션을 컴파일합니다. 이는 Angular 8까지 기본값이었습니다.        |
| Ahead-of-Time \(AOT\)       | 빌드 시간에 애플리케이션 및 라이브러리를 컴파일합니다. Angular 9부터 기본값입니다. |

[`ng build`](cli/build) \(오직 빌드\) 또는 [`ng serve`](cli/serve) \(빌드 및 로컬 제공\) CLI 명령을 실행할 때, 컴파일 유형 \(JIT 또는 AOT\)은 `angular.json`에 지정된 빌드 구성의 `aot` 속성 값에 따라 달라집니다.  
기본적으로 새 CLI 애플리케이션에 대해 `aot`는 `true`로 설정되어 있습니다.

자세한 내용은 [CLI 명령 참조](cli)와 [Angular 앱 빌드 및 제공](tools/cli/build)을 참조하세요.

## AOT 작동 원리 

Angular AOT 컴파일러는 Angular가 관리해야 하는 애플리케이션 부분을 해석하기 위해 **메타데이터**를 추출합니다.  
메타데이터는 `@Component()` 및 `@Input()`와 같은 **데코레이터**에서 명시적으로 지정하거나, 장식된 클래스의 생성자 선언에서 암시적으로 지정할 수 있습니다.  
메타데이터는 Angular에 애플리케이션 클래스의 인스턴스를 구성하고 런타임에 상호 작용하는 방법을 알려줍니다. 

다음 예에서 `@Component()` 메타데이터 객체와 클래스 생성자는 Angular에 `TypicalComponent` 인스턴스를 생성하고 표시하는 방법을 알려줍니다. 

<docs-code language="typescript">

@Component({
  selector: 'app-typical',
  template: '<div>A typical component for {{data.name}}</div>'
})
export class TypicalComponent {
  @Input() data: TypicalData;
  constructor(private someService: SomeService) { … }
}

</docs-code>

Angular 컴파일러는 메타데이터를 *한 번* 추출하고 `TypicalComponent`를 위한 *팩토리*를 생성합니다.  
`TypicalComponent` 인스턴스를 생성해야 할 때, Angular는 팩토리를 호출하여 주입된 종속성을 가진 새로운 구성 요소 클래스의 새로운 인스턴스에 바인딩된 새로운 시각적 요소를 생성합니다. 

### 컴파일 단계 

AOT 컴파일에는 세 가지 단계가 있습니다. 

|     | 단계                    | 세부사항                                                                                                                                                                                                                                                                                                        |
|:--- |:---                     |:---                                                                                                                                                                                                                                                                                                            |
| 1   | 코드 분석               | 이 단계에서 TypeScript 컴파일러와 *AOT 수집기*는 소스의 표현을 생성합니다. 수집기는 수집한 메타데이터를 해석할 수 없습니다. 메타데이터를 가능한 한 잘 표현하고 메타데이터 구문 위반을 감지하면 오류를 기록합니다.                              |
| 2   | 코드 생성               | 이 단계에서 컴파일러의 `StaticReflector`는 1단계에서 수집한 메타데이터를 해석하고, 메타데이터에 대한 추가 유효성 검사를 수행하며, 메타데이터 제한 위반이 감지되면 오류를 발생시킵니다.                                                                                              |
| 3   | 템플릿 타입 검사       | 이 선택적 단계에서 Angular *템플릿 컴파일러*는 TypeScript 컴파일러를 사용하여 템플릿의 바인딩 표현식을 검증합니다. 이 단계를 명시적으로 활성화하려면 `strictTemplates` 구성 옵션을 설정하세요. [Angular 컴파일러 옵션](reference/configs/angular-compiler-options)을 참조하세요. |

### 메타데이터 제한 사항 

당신은 다음 일반 제약을 준수하는 *부분* TypeScript로 메타데이터를 작성해야 합니다: 

* 지원되는 JavaScript의 하위 집합에 [표현 구문](#expression-syntax-limitations)을 제한합니다. 
* [코드 접기](#code-folding) 이후에만 내보내는 기호를 참조합니다. 
* 컴파일러에 의해 [지원되는 함수](#supported-classes-and-functions)만 호출합니다. 
* Input/Output 및 데이터 바인딩된 클래스 멤버는 public 또는 protected 여야 합니다. AOT 컴파일 준비에 대한 추가 지침 및 지침은 [Angular: AOT 지원 애플리케이션 작성](https://medium.com/sparkles-blog/angular-writing-aot-friendly-applications-7b64c8afbe3f)을 참조하세요. 

도움이 됨: AOT 컴파일러의 오류는 일반적으로 메타데이터가 컴파일러의 요구 사항에 부합하지 않을 때 발생합니다 \(아래에서 더 자세히 설명됨\).  
이러한 문제를 이해하고 해결하는 데 도움이 필요하면 [AOT 메타데이터 오류](tools/cli/aot-metadata-errors)를 참조하세요. 

### AOT 컴파일 구성 

컴파일 프로세스를 제어하는 [TypeScript 구성 파일](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)에서 옵션을 제공할 수 있습니다.  
사용 가능한 옵션의 전체 목록은 [Angular 컴파일러 옵션](reference/configs/angular-compiler-options)을 참조하세요. 

## 1단계: 코드 분석 

TypeScript 컴파일러는 첫 번째 단계의 분석 작업 중 일부를 수행합니다.  
그것은 AOT 컴파일러가 애플리케이션 코드를 생성하는 데 필요한 타입 정보를 포함한 `.d.ts` *타입 정의 파일*을 발생합니다.  
동시에 AOT **수집기**는 Angular 데코레이터에 기록된 메타데이터를 분석하고 **`.metadata.json`** 파일에 메타데이터 정보를 출력합니다. 이를 각 `.d.ts` 파일마다 하나씩 생성합니다. 

`.metadata.json`은 데코레이터의 메타데이터 전체 구조의 다이어그램으로 생각할 수 있으며, [추상 구문 트리 (AST)](https://en.wikipedia.org/wiki/Abstract_syntax_tree)로 표현됩니다. 

도움이 됨: Angular의 [schema.ts](https://github.com/angular/angular/blob/main/packages/compiler-cli/src/metadata/schema.ts)는 JSON 형식을 TypeScript 인터페이스 모음으로 설명합니다. 

### 표현 구문 제한 사항 

AOT 수집기는 JavaScript의 하위 집합만 이해합니다.  
다음 제한된 구문으로 메타데이터 객체를 정의합니다: 

| 구문                          | 예      |
|:---                           |:---     |
| 리터럴 객체                   | `{cherry: true, apple: true, mincemeat: false}`                        |
| 리터럴 배열                   | `['cherries', 'flour', 'sugar']`                                       |
| 리터럴 배열의 전개           | `['apples', 'flour', …]`                                               |
| 호출                          | `bake(ingredients)`                                                    |
| 생성                          | `new Oven()`                                                           |
| 속성 접근                     | `pie.slice`                                                            |
| 배열 인덱스                   | `ingredients[0]`                                                       |
| 아이덴티티 참조               | `Component`                                                            |
| 템플릿 문자열                 | <code>`pie is ${multiplier} times better than cake`</code> |
| 리터럴 문자열                 | `'pi'`                                                                 |
| 리터럴 숫자                   | `3.14153265`                                                           |
| 리터럴 불리언                | `true`                                                                 |
| 리터럴 null                   | `null`                                                                 |
| 지원되는 접두사 연산자       | `!cake`                                                                |
| 지원되는 이진 연산자         | `a+b`                                                                  |
| 조건부 연산자                 | `a ? b : c`                                                            |
| 괄호                          | `(a+b)`                                                                |

표현식이 지원되지 않는 구문을 사용하는 경우, 수집기는 `.metadata.json` 파일에 오류 노드를 기록합니다.  
컴파일러는 나중에 애플리케이션 코드를 생성하기 위해 해당 메타데이터 조각이 필요할 경우 오류를 보고합니다. 

도움이 됨: `ngc`가 구문 오류를 즉시 보고하도록 하려면 TypeScript 구성 파일에서 `strictMetadataEmit` 옵션을 설정하세요. 

<docs-code language="json">

"angularCompilerOptions": {
  …
  "strictMetadataEmit" : true
}

</docs-code>

Angular 라이브러리는 모든 Angular `.metadata.json` 파일이 깨끗한지 확인하는 이 옵션을 가지고 있으며, 자신의 라이브러리를 구축할 때도 동일하게 하는 것이 모범 사례입니다. 

### 화살표 함수 없음 

AOT 컴파일러는 [함수 표현식](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/function) 및 [화살표 함수](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Functions/Arrow_functions)(가끔 *람다* 함수라고도 함)을 지원하지 않습니다. 

다음 구성 요소 데코레이터를 고려하세요: 

<docs-code language="typescript">

@Component({
  …
  providers: [{provide: server, useFactory: () => new Server()}]
})

</docs-code>

AOT 수집기는 메타데이터 표현식에서 화살표 함수 `() => new Server()`를 지원하지 않습니다.  
대신 함수 위치에 오류 노드를 생성합니다.  
나중에 컴파일러가 이 노드를 해석하면 화살표 함수를 *내보내는 함수*로 변환하라는 오류를 보고합니다. 

다음과 같이 변환하여 오류를 수정할 수 있습니다: 

<docs-code language="typescript">

export function serverFactory() {
  return new Server();
}

@Component({
  …
  providers: [{provide: server, useFactory: serverFactory}]
})

</docs-code>

버전 5 이상에서는 컴파일러가 `.js` 파일을 발생하는 동안 이 rewriting을 자동으로 수행합니다. 

### 코드 접기 

컴파일러는 ***내보내는*** 기호에 대한 참조만 해결할 수 있습니다.  
그러나 수집기는 수집 중에 표현식을 평가하고 결과를 원래 표현식 대신 `.metadata.json`에 기록할 수 있습니다.  
이렇게 하면 표현식 내에서 비내보내 기호를 제한적으로 사용할 수 있습니다. 

예를 들어, 수집기는 표현식 `1 + 2 + 3 + 4`를 평가하고 그 결과 `10`으로 대체할 수 있습니다.  
이 과정을 *접기*라고 합니다.  
이와 같은 방식으로 축소될 수 있는 표현식을 *접을 수 있는* 표현식이라고 합니다. 

수집기는 모듈-로컬 `const` 선언과 초기화된 `var` 및 `let` 선언에 대한 참조를 평가하여 이를 `.metadata.json` 파일에서 효과적으로 제거할 수 있습니다. 

다음 구성 요소 정의를 고려하세요: 

<docs-code language="typescript">

const template = '<div>{{hero.name}}</div>';

@Component({
  selector: 'app-hero',
  template: template
})
export class HeroComponent {
  @Input() hero: Hero;
}

</docs-code>

컴파일러는 `template` 상수를 참조할 수 없습니다. 이는 내보내지 않기 때문입니다.  
그러나 수집기는 `template` 상수를 인라인하여 메타데이터 정의에 접을 수 있습니다.  
이렇게 하면 다음과 같이 작성하는 것과 동일한 효과가 있습니다: 

<docs-code language="typescript">

@Component({
  selector: 'app-hero',
  template: '<div>{{hero.name}}</div>'
})
export class HeroComponent {
  @Input() hero: Hero;
}

</docs-code>

이제 `template`에 대한 참조가 더 이상 없으며 따라서 나중에 컴파일러가 `.metadata.json`에서 *수집기*의 출력을 해석할 때 문제가 발생하지 않습니다. 

다음과 같이 `template` 상수를 다른 표현식에 포함시켜 이 예제를 한 단계 더 나아가게 할 수 있습니다: 

<docs-code language="typescript">

const template = '<div>{{hero.name}}</div>';

@Component({
  selector: 'app-hero',
  template: template + '<div>{{hero.title}}</div>'
})
export class HeroComponent {
  @Input() hero: Hero;
}

</docs-code>

수집기는 이 표현식을 그것과 동등한 *접힌* 문자열로 줄여줍니다: 

<docs-code language="typescript">

'<div>{{hero.name}}</div><div>{{hero.title}}</div>'

</docs-code>

#### 접을 수 있는 구문 

다음 표는 수집기가 접을 수 있는 표현식과 접을 수 없는 표현식을 설명합니다: 

| 구문                             | 접을 수 있음 |
|:---                             |:---          |
| 리터럴 객체                      | 예                         |
| 리터럴 배열                      | 예                         |
| 리터럴 배열의 전개              | 아니요                      |
| 호출                             | 아니요                      |
| 생성                             | 아니요                      |
| 속성 접근                        | 예, 대상이 접을 수 있는 경우  |
| 배열 인덱스                     | 예, 대상과 인덱스가 접을 수 있는 경우 |
| 아이덴티티 참조                 | 예, 로컬 참조인 경우       |
| 대체가 없는 템플릿              | 예                         |
| 대체가 있는 템플릿              | 예, 대체가 접을 수 있는 경우  |
| 리터럴 문자열                   | 예                         |
| 리터럴 숫자                     | 예                         |
| 리터럴 불리언                   | 예                         |
| 리터럴 null                      | 예                         |
| 지원되는 접두사 연산자          | 예, 피연산자가 접을 수 있는 경우 |
| 지원되는 이진 연산자            | 예, 왼쪽과 오른쪽이 모두 접을 수 있는 경우 |
| 조건부 연산자                   | 예, 조건이 접을 수 있는 경우   |
| 괄호                            | 예, 표현식이 접을 수 있는 경우 |

표현식이 접을 수 없는 경우, 수집기는 이를 `.metadata.json` 파일에 저장하여 컴파일러가 해결할 수 있도록 [AST](https://en.wikipedia.org/wiki/Abstract*syntax*tree)로 남깁니다. 

## 2단계: 코드 생성 

수집기는 수집하는 메타데이터를 해석하기 위한 시도를 하지 않으며, 이를 `.metadata.json`에 출력합니다.  
수집기는 메타데이터를 가능한 한 잘 표현하고 메타데이터 구문 위반을 감지하면 오류를 기록합니다.  
코드 생성 단계에서 `.metadata.json`을 해석하는 것은 컴파일러의 작업입니다. 

컴파일러는 수집기가 지원하는 모든 구문 형태를 이해하지만, 수집기의 *의미*가 컴파일러 규칙을 위반할 경우 *문법적으로* 올바른 메타데이터를 거부할 수 있습니다. 

### 공개 또는 보호된 기호 

컴파일러는 *내보내는 기호*만 참조할 수 있습니다. 

* 장식된 구성 요소 클래스 멤버는 public 또는 protected여야 합니다.  
  `@Input()` 속성을 private으로 만들 수 없습니다. 

* 데이터 바인딩된 속성도 public 또는 protected 여야 합니다. 

### 지원되는 클래스 및 함수 

수집기는 유효한 구문인 한 함수 호출 또는 `new`로 객체 생성을 나타낼 수 있습니다.  
그러나 컴파일러는 나중에 *특정* 함수에 대한 호출이나 *특정* 객체 생성을 생성하는 것을 거부할 수 있습니다. 

컴파일러는 특정 클래스의 인스턴스만 생성할 수 있으며 핵심 데코레이터만 지원하며, 표현식을 반환하는 매크로 \(함수 또는 정적 메서드\)에 대한 호출만 지원합니다. 

| 컴파일러 작업       | 세부사항 |
|:---                |:---     |
| 새 인스턴스        | 컴파일러는 `@angular/core`에서 `InjectionToken` 클래스의 인스턴스를 생성하는 메타데이터만 허용합니다.                                            |
| 지원되는 데코레이터 | 컴파일러는 [Angular 데코레이터를 위한 메타데이터만 지원합니다](api/core#decorators).                                   |
| 함수 호출          | 팩토리 함수는 내보내는, 이름이 있는 함수여야 합니다. AOT 컴파일러는 팩토리 함수에 화살표 표현식 \(“람다 함수”\)를 지원하지 않습니다. |

### 함수 및 정적 메서드 호출 

수집기는 단일 `return` 문을 포함하는 모든 함수 또는 정적 메서드를 수락합니다.  
그러나 컴파일러는 *표현식*을 반환하는 함수 또는 정적 메서드 형태의 매크로만 지원합니다. 

다음 함수 예를 고려하세요: 

<docs-code language="typescript">

export function wrapInArray<T>(value: T): T[] {
  return [value];
}

</docs-code>

다음과 같은 메타데이터 정의에서 `wrapInArray`를 호출할 수 있습니다. 이는 컴파일러의 제한적인 JavaScript 하위 집합을 준수하는 표현식의 값을 반환합니다. 

다음과 같은 방식으로 `wrapInArray()`를 사용할 수 있습니다: 

<docs-code language="typescript">

@NgModule({
  declarations: wrapInArray(TypicalComponent)
})
export class TypicalModule {}

</docs-code>

컴파일러는 이 사용을 당신이 다음과 같이 작성한 것과 동일하게 처리합니다: 

<docs-code language="typescript">

@NgModule({
  declarations: [TypicalComponent]
})
export class TypicalModule {}

</docs-code>

Angular [`RouterModule`](api/router/RouterModule)는 루트 및 자식 경로를 선언하는 데 도움을 주기 위해 두 개의 매크로 정적 메서드인 `forRoot`와 `forChild`를 내보냅니다.  
복잡한 [NgModules](guide/ngmodules) 구성을 단순화할 수 있는 방법을 보려면 [소스 코드](https://github.com/angular/angular/blob/main/packages/router/src/router_module.ts#L139 "RouterModule.forRoot source code")를 확인하세요. 

### 메타데이터 재작성 

컴파일러는 `useClass`, `useValue`, `useFactory`, 및 `data` 필드를 포함하는 객체 리터럴을 특별하게 처리하며, 이러한 필드 중 하나를 초기화하는 표현식을 내보내는 변수로 변환합니다.  
이러한 표현식을 재작성하는 과정에서 필드 내에서 포함될 수 있는 것에 대한 모든 제약이 제거됩니다. 
컴파일러는 표현식의 값을 알 필요는 없으며 단지 해당 값에 대한 참조를 생성할 수 있어야 합니다. 

다음과 같은 방식으로 작성할 수 있습니다: 

<docs-code language="typescript">

class TypicalServer {

}

@NgModule({
  providers: [{provide: SERVER, useFactory: () => TypicalServer}]
})
export class TypicalModule {}

</docs-code>

재작성 없이 이것은 유효하지 않으며, 람다를 지원하지 않고 `TypicalServer`가 내보내지 않기 때문입니다.  
이를 허용하기 위해 컴파일러는 이를 다음과 같은 형식으로 자동으로 재작성합니다: 

<docs-code language="typescript">

class TypicalServer {

}

export const θ0 = () => new TypicalServer();

@NgModule({
  providers: [{provide: SERVER, useFactory: θ0}]
})
export class TypicalModule {}

</docs-code>

이렇게 하면 컴파일러가 `θ0`의 값을 알 필요 없이 팩토리의 `θ0`에 대한 참조를 생성할 수 있습니다. 

컴파일러는 `.js` 파일을 내보낼 때 재작업을 수행합니다.  
그러나 `.d.ts` 파일은 재작성하지 않으므로 TypeScript는 이를 내보내기(export)로 인식하지 않습니다.  
또한 ES 모듈의 내보낸 API에는 영향을 미치지 않습니다. 

## 3단계: 템플릿 타입 검사 

Angular 컴파일러의 가장 유용한 기능 중 하나는 템플릿 내에서 표현식의 유형을 검사하고, 이러한 잘못된 사용이 런타임에 충돌을 일으키기 전에 잡는 것입니다.  
템플릿 타입 검사 단계에서 Angular 템플릿 컴파일러는 TypeScript 컴파일러를 사용하여 템플릿의 바인딩 표현식을 검증합니다. 

프로젝트의 TypeScript 구성 파일의 `"angularCompilerOptions"`에 `"fullTemplateTypeCheck"` 컴파일러 옵션을 추가하여 이 단계를 명시적으로 활성화하세요.  
(자세한 정보는 [Angular 컴파일러 옵션](reference/configs/angular-compiler-options)을 참조하세요). 

템플릿 검증은 템플릿 바인딩 표현식에서 타입 오류가 감지될 때 오류 메시지를 생성합니다.  
이러한 오류 메시지는 `.ts` 파일의 코드에 대해 TypeScript 컴파일러가 오류를 보고하는 방식과 유사합니다. 

예를 들어, 다음 구성 요소를 고려하세요: 

<docs-code language="typescript">

@Component({
  selector: 'my-component',
  template: '{{person.addresss.street}}'
})
class MyComponent {
  person?: Person;
}

</docs-code>

이것은 다음과 같은 오류를 생성합니다: 

<docs-code hideCopy language="shell">

my.component.ts.MyComponent.html(1,1): : Property 'addresss' does not exist on type 'Person'. Did you mean 'address'?

</docs-code>

오류 메시지에 보고된 파일 이름인 `my.component.ts.MyComponent.html`은 템플릿 컴파일러에 의해 생성된 합성 파일로서, `MyComponent` 클래스 템플릿의 내용을 포함합니다.  
컴파일러는 이 파일을 디스크에 작성하지 않습니다.  
줄 및 열 번호는 이 경우 `MyComponent` 클래스의 `@Component` 주석에서 템플릿 문자열에 상대적입니다.  
구성 요소가 `template` 대신 `templateUrl`을 사용하는 경우 오류는 합성 파일 대신 `templateUrl`로 참조된 HTML 파일에서 보고됩니다. 

오류 위치는 오류가 포함된 보간 표현식이 있는 텍스트 노드의 시작입니다.  
`[value]="person.address.street"`와 같은 속성 바인딩에 오류가 있는 경우, 오류 위치는 오류가 포함된 속성의 위치입니다. 

유효성 검사는 TypeScript 타입 검사기와 TypeScript 컴파일러에 제공된 옵션을 사용하여 타입 검사의 세부 사항을 제어합니다.  
예를 들어, `strictTypeChecks`가 지정되면 다음 오류가 보고됩니다. 

<docs-code hideCopy language="shell">

my.component.ts.MyComponent.html(1,1): : Object is possibly 'undefined'

</docs-code>

### 타입 축소 

`ngIf` 지시문에 사용된 표현식은 Angular 템플릿 컴파일러 내에서 타입 유니온을 축소하는 데 사용되며, 이는 TypeScript에서 `if` 표현식이 작동하는 방식과 동일합니다.  
예를 들어, 위 템플릿에서 `Object is possibly 'undefined'` 오류를 피하려면 `person`의 값이 초기화되어 있을 때만 보간을 발생시키도록 수정합니다: 

<docs-code language="typescript">

@Component({
  selector: 'my-component',
  template: '<span *ngIf="person"> {{person.address.street}} </span>'
})
class MyComponent {
  person?: Person;
}

</docs-code>

`*ngIf`를 사용하면 TypeScript 컴파일러는 바인딩 표현식에서 사용된 `person`이 절대 `undefined`가 아님을 유추할 수 있습니다. 

입력 타입 축소에 대한 자세한 내용은 [커스텀 지시문에 대한 템플릿 타입 검사 개선](guide/directives/structural-directives#directive-type-checks)을 참조하세요. 

### 널이 아님 타입 단언 연산자 

`*ngIf`를 사용하는 것이 불편할 때나 컴포넌트에서 일부 제약 조건이 표현식이 바인딩 표현식이 있는 동안 항상 널이 아님을 보장할 때 `Object is possibly 'undefined'` 오류를 억제하기 위해 널이 아님 타입 단언 연산자를 사용하세요. 

다음 예에서 `person`과 `address` 속성은 항상 함께 설정되므로 `person`이 널이 아닐 경우 `address`도 항상 널이 아님을 암시합니다.  
이 제약 조건을 TypeScript와 템플릿 컴파일러에 편리하게 설명할 수는 없지만, 예에서는 `address!.street`를 사용하여 오류를 억제하고 있습니다: 

<docs-code language="typescript">

@Component({
  selector: 'my-component',
  template: '<span *ngIf="person"> {{person.name}} lives on {{address!.street}} </span>'
})
class MyComponent {
  person?: Person;
  address?: Address;

  setData(person: Person, address: Address) {
    this.person = person;
    this.address = address;
  }
}

</docs-code>

널이 아님 어설션 연산자는 신중하게 사용해야 합니다. 컴포넌트를 리팩토링하면 이 제약 조건이 문제가 될 수 있습니다. 

이 예제에서는 `*ngIf` 안에 `address`를 추가로 확인하는 것이 좋습니다: 

<docs-code language="typescript">

@Component({
  selector: 'my-component',
  template: '<span *ngIf="person && address"> {{person.name}} lives on {{address.street}} </span>'
})
class MyComponent {
  person?: Person;
  address?: Address;

  setData(person: Person, address: Address) {
    this.person = person;
    this.address = address;
  }
}

</docs-code>