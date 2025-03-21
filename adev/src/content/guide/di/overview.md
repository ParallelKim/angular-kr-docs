<docs-decorative-header title="Angular의 의존성 주입" imgSrc="adev/src/assets/images/dependency_injection.svg"> <!-- markdownlint-disable-line -->
"DI"는 앱의 일부를 필요로 하는 앱의 다른 부분에 생성하고 전달하는 디자인 패턴 및 메커니즘입니다.
</docs-decorative-header>

팁: 이 포괄적인 가이드에 뛰어들기 전에 Angular의 [필수 사항](essentials/dependency-injection)을 확인하세요.

시스템의 작은 부분, 예를 들어 모듈이나 클래스를 개발할 때, 다른 클래스의 기능을 사용해야 할 수도 있습니다. 예를 들어, 백엔드 호출을 위한 HTTP 서비스가 필요할 수 있습니다. 의존성 주입(Dependency Injection, DI)은 애플리케이션의 일부를 필요에 따라 다른 부분에 생성하고 전달하는 디자인 패턴 및 메커니즘입니다. Angular는 이 디자인 패턴을 지원하며, 어플리케이션에서 이를 사용하여 유연성과 모듈성을 높일 수 있습니다.

Angular에서 의존성은 일반적으로 서비스지만, 문자열이나 함수와 같은 값일 수도 있습니다. 애플리케이션의 주입기는 필요할 때 서비스 또는 값의 구성된 제공자를 사용하여 의존성을 인스턴스화합니다(부트스트랩 중 자동 생성됨).

## Angular 의존성 주입에 대해 배우기

<docs-card-container>
  <docs-card title="의존성 주입 이해하기" href="/guide/di/dependency-injection">
    Angular에서 의존성 주입의 기본 원칙을 배웁니다.
  </docs-card>
  <docs-card title="서비스 생성 및 주입" href="/guide/di/creating-injectable-service">
    서비스를 생성하고 다른 서비스 및 구성 요소에 주입하는 방법을 설명합니다.
  </docs-card>
  <docs-card title="의존성 제공자 구성" href="/guide/di/dependency-injection-providers">
    @Component 및 @NgModule 데코레이터의 제공자 필드를 사용하여 의존성을 구성하는 방법을 설명합니다. 또한 DI에서 의존성으로서 클래스 외의 값을 사용하고자 할 때 유용할 수 있는 InjectionToken을 제공하고 주입하는 방법을 설명합니다.
  </docs-card>
  <docs-card title="주입 컨텍스트" href="/guide/di/dependency-injection-context">
    주입 컨텍스트가 무엇인지와 필요한 곳에서 DI 시스템을 사용하는 방법을 설명합니다.
  </docs-card>
  <docs-card title="계층적 주입기" href="/guide/di/hierarchical-dependency-injection">
    계층적 DI는 필요할 때와 필요에 따라 애플리케이션의 다른 부분 간에 의존성을 공유할 수 있도록 합니다. 이것은 고급 주제입니다.
  </docs-card>
</docs-card-container>