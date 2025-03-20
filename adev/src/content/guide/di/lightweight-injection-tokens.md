# 클라이언트 애플리케이션 크기를 최적화하는 경량 주입 토큰 사용

이 페이지는 라이브러리 개발자를 위한 권장 종속성 주입 기술의 개념적 개요를 제공합니다.
*경량 주입 토큰*으로 라이브러리를 설계하면 라이브러리를 사용하는 클라이언트 애플리케이션의 번들 크기를 최적화하는 데 도움이 됩니다.

트리 쉐이커블 프로바이더를 사용하여 구성 요소 및 주입 가능한 서비스 간의 종속성 구조를 관리하여 번들 크기를 최적화할 수 있습니다.
이렇게 하면 제공된 구성 요소나 서비스가 애플리케이션에서 실제로 사용되지 않을 경우, 컴파일러가 해당 코드를 번들에서 제거할 수 있습니다.

Angular가 주입 토큰을 저장하는 방식 때문에, 사용되지 않는 구성 요소나 서비스가 최종적으로 번들에 포함될 수 있습니다.
이 페이지에서는 경량 주입 토큰을 사용하여 적절한 트리 쉐이킹을 지원하는 종속성 주입 디자인 패턴을 설명합니다.

경량 주입 토큰 디자인 패턴은 라이브러리 개발자에게 특히 중요합니다.
애플리케이션이 라이브러리의 일부 기능만 사용할 때, 사용되지 않는 코드를 클라이언트 애플리케이션 번들에서 제거할 수 있도록 보장합니다.

애플리케이션이 라이브러리를 사용할 때, 클라이언트 애플리케이션에서 사용하지 않는 라이브러리가 제공하는 서비스가 있을 수 있습니다.
이 경우 애플리케이션 개발자는 해당 서비스가 트리 쉐이킹 되어 컴파일된 애플리케이션의 크기에 기여하지 않을 것이라고 예상해야 합니다.
애플리케이션 개발자는 라이브러리의 트리 쉐이킹 문제를 알거나 remedy할 수 없기 때문에, 이를 해결하는 것은 라이브러리 개발자의 책임입니다.
사용되지 않는 구성 요소의 보존을 방지하기 위해 라이브러리는 경량 주입 토큰 디자인 패턴을 사용해야 합니다.

## 토큰이 보존되는 경우

토큰 보존이 발생하는 조건을 더 잘 설명하기 위해, 라이브러리 카드 구성 요소를 제공하는 라이브러리를 고려해 보십시오.
이 구성 요소는 본문을 포함하고 선택적 헤더를 포함할 수 있습니다:

<docs-code language="html">

<lib-card>;
  <lib-header>…</lib-header>;
</lib-card>;

</docs-code>

가능한 구현에서는 `<lib-card>` 구성 요소가 다음과 같이 `@ContentChild()` 또는 `@ContentChildren()`를 사용하여 `<lib-header>`와 `<lib-body>`를 가져옵니다:

<docs-code language="typescript" highlight="[12]">
@Component({
  selector: 'lib-header',
  …,
})
class LibHeaderComponent {}

@Component({
  selector: 'lib-card',
  …,
})
class LibCardComponent {
  @ContentChild(LibHeaderComponent) header: LibHeaderComponent|null = null;
}

</docs-code>

`<lib-header>`가 선택적이기 때문에, 요소는 최소 형태인 `<lib-card></lib-card>`로 템플릿에 나타날 수 있습니다.
이 경우 `<lib-header>`는 사용되지 않으며 트리 쉐이킹될 것으로 예상되지만, 실제로 그렇게 되지 않습니다.
이는 `LibCardComponent`가 실제로 `LibHeaderComponent`에 대한 두 개의 참조를 포함하기 때문입니다:

<docs-code language="typescript">
@ContentChild(LibHeaderComponent) header: LibHeaderComponent;
</docs-code>

* 이 참조 중 하나는 *타입 위치*에 있습니다 -- 즉, `header: LibHeaderComponent;`로 `LibHeaderComponent`를 타입으로 지정합니다.
* 다른 참조는 *값 위치*에 있습니다 -- 즉, `@ContentChild(LibHeaderComponent)` 매개변수 데코레이터의 값입니다.

컴파일러는 이러한 위치의 토큰 참조를 다르게 처리합니다:

* 컴파일러는 TypeScript에서 변환한 후 *타입 위치* 참조를 제거하므로 트리 쉐이킹에 영향을 주지 않습니다.
* 컴파일러는 런타임 시 *값 위치* 참조를 유지해야 하므로, 이는 **구성 요소**가 트리 쉐이킹되는 것을 방지합니다.

예제에서는 컴파일러가 값 위치에서 발생하는 `LibHeaderComponent` 토큰을 보존합니다.
이것은 애플리케이션이 실제로 `<lib-header>`를 어디서든 사용하지 않더라도 해당 참조된 구성 요소가 트리 쉐이킹되지 않도록 합니다.
`LibHeaderComponent`의 코드, 템플릿 및 스타일이 너무 커지면, 불필요하게 포함되면 클라이언트 애플리케이션의 크기를 상당히 증가시킬 수 있습니다.

## 경량 주입 토큰 패턴을 사용할 때

트리 쉐이킹 문제는 구성 요소가 주입 토큰으로 사용될 때 발생합니다.
다음과 같은 두 가지 경우가 있습니다:

* 토큰이 [콘텐츠 쿼리](guide/components/queries#content-queries)의 값 위치에서 사용됩니다.
* 토큰이 생성자 주입을 위한 타입 지정자로 사용됩니다.

다음 예제에서 `OtherComponent` 토큰의 두 사용이 모두 `OtherComponent`가 보존되도록 하여 사용되지 않을 때 트리 쉐이킹되는 것을 방지합니다:

<docs-code language="typescript" highlight="[[2],[4]]">
class MyComponent {
  constructor(@Optional() other: OtherComponent) {}

  @ContentChild(OtherComponent) other: OtherComponent|null;
}
</docs-code>

타입 지정자로만 사용되는 토큰은 JavaScript로 변환할 때 제거되지만, 종속성 주입에 사용되는 모든 토큰은 런타임에 필요합니다.
이로 인해 실제로 `constructor(@Optional() other: OtherComponent)`가 `constructor(@Optional() @Inject(OtherComponent) other)`로 변경됩니다.
이제 토큰은 값 위치에 있어 트리 쉐이커가 참조를 유지하게 됩니다.

도움이 되는: 라이브러리는 모든 서비스에 대해 [트리 쉐이커블 프로바이더](guide/di/dependency-injection#providing-dependency)를 사용하여 구성 요소나 모듈이 아닌 루트 수준에서 종속성을 제공해야 합니다.

## 경량 주입 토큰 사용하기

경량 주입 토큰 디자인 패턴은 작은 추상 클래스를 주입 토큰으로 사용하고, 실제 구현을 나중에 제공하는 것으로 구성됩니다.
추상 클래스는 보존되며 트리 쉐이킹되지 않지만, 작고 애플리케이션 크기에 실질적인 영향을 미치지 않습니다.

다음 예제는 이것이 `LibHeaderComponent`에 대해 어떻게 작용하는지를 보여줍니다:

<docs-code language="typescript" language="[[1],[6],[17]]">
abstract class LibHeaderToken {}

@Component({
  selector: 'lib-header',
  providers: [
    {provide: LibHeaderToken, useExisting: LibHeaderComponent}
  ]
  …,
})
class LibHeaderComponent extends LibHeaderToken {}

@Component({
  selector: 'lib-card',
  …,
})
class LibCardComponent {
  @ContentChild(LibHeaderToken) header: LibHeaderToken|null = null;
}
</docs-code>

이 예제에서 `LibCardComponent` 구현은 이제 타입 위치나 값 위치에서 `LibHeaderComponent`를 참조하지 않습니다.
이로 인해 `LibHeaderComponent`의 완전한 트리 쉐이킹이 발생합니다.
`LibHeaderToken`은 보존되지만, 구체적인 구현이 없는 클래스 선언일 뿐입니다.
규모가 작고 컴파일 후 보존될 때 애플리케이션 크기에 실질적인 영향을 미치지 않습니다.

대신 `LibHeaderComponent` 자체가 추상 `LibHeaderToken` 클래스를 구현합니다.
이 토큰을 컴포넌트 정의에서 프로바이더로 안전하게 사용하면 Angular가 정확하게 구체적인 타입을 주입할 수 있습니다.

요약하면, 경량 주입 토큰 패턴은 다음으로 구성됩니다:

1. 추상 클래스로 표현된 경량 주입 토큰.
1. 추상 클래스를 구현하는 구성 요소 정의.
1. `@ContentChild()` 또는 `@ContentChildren()`를 사용한 경량 패턴의 주입.
1. 경량 주입 토큰의 구현에서 경량 주입 토큰과 구현을 연관 짓는 프로바이더.

### API 정의를 위한 경량 주입 토큰 사용하기

경량 주입 토큰을 주입하는 구성 요소는 주입된 클래스의 메서드를 호출해야 할 수 있습니다.
토큰은 이제 추상 클래스입니다. 주입 가능한 구성 요소가 해당 클래스를 구현하므로, 추상 경량 주입 토큰 클래스에서도 추상 메서드를 선언해야 합니다.
메서드의 구현은 모든 코드 오버헤드를 가진 주입 가능한 구성 요소에 있으며 이는 트리 쉐이킹될 수 있습니다.
이로 인해 부모가 자식과 안전한 방식으로 통신할 수 있습니다.

예를 들어 `LibCardComponent`는 이제 `LibHeaderComponent`가 아닌 `LibHeaderToken`을 쿼리합니다.
다음 예제는 이 패턴이 부모가 `LibHeaderComponent`를 실제로 참조하지 않고도 `LibHeaderComponent`와 통신할 수 있도록 보여줍니다:

<docs-code language="typescript" highlight="[[3],[13,16],[27]]">
abstract class LibHeaderToken {
  abstract doSomething(): void;
}

@Component({
  selector: 'lib-header',
  providers: [
    {provide: LibHeaderToken, useExisting: LibHeaderComponent}
  ]
  …,
})
class LibHeaderComponent extends LibHeaderToken {
  doSomething(): void {
    // `doSomething`의 구체적인 구현
  }
}

@Component({
  selector: 'lib-card',
  …,
})
class LibCardComponent implement AfterContentInit {
  @ContentChild(LibHeaderToken) header: LibHeaderToken|null = null;

  ngAfterContentInit(): void {
    if (this.header !== null) {
      this.header?.doSomething();
    }
  }
}
</docs-code>

이 예제에서 부모는 토큰을 쿼리하여 자식 구성 요소를 가져오고, 자식이 존재하는 경우 결과 구성 요소 참조를 저장합니다.
자식의 메서드를 호출하기 전에 부모 구성 요소는 자식 구성 요소가 존재하는지 확인합니다.
자식 구성 요소가 트리 쉐이킹된 경우, 런타임 참조가 없고 메서드 호출이 없습니다.

### 경량 주입 토큰 이름 짓기

경량 주입 토큰은 구성 요소와 함께만 유용합니다.
Angular 스타일 가이드는 "Component" 접미사를 사용하여 구성 요소의 이름을 지정할 것을 권장합니다.
예제 "LibHeaderComponent"는 이 규칙을 따릅니다.

구성 요소와 해당 토큰 간의 관계를 유지하면서 둘 사이를 구별해야 합니다.
권장 스타일은 구성 요소 기본 이름에 "`Token`" 접미사를 사용하여 경량 주입 토큰의 이름을 지정하는 것입니다: "`LibHeaderToken`."