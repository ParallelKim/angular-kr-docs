# 사용자 정의 경로 일치 만들기

Angular Router는 사용자가 애플리케이션을 탐색하는 데 도움을 줄 수 있는 강력한 일치 전략을 지원합니다. 
이 일치 전략은 정적 경로, 매개변수가 있는 가변 경로, 와일드카드 경로 등을 지원합니다. 
또한, URL이 더 복잡한 상황을 위해 자신만의 사용자 정의 패턴 일치를 구축할 수 있습니다.

이 튜토리얼에서는 Angular의 `UrlMatcher`를 사용하여 사용자 정의 경로 매처를 구축합니다. 
이 매처는 URL에서 트위터 핸들을 찾습니다.

## 목표

Angular의 `UrlMatcher`를 구현하여 사용자 정의 경로 매처를 생성합니다.

## 샘플 애플리케이션 만들기

Angular CLI를 사용하여 새로운 애플리케이션 *angular-custom-route-match*를 만듭니다. 
기본 Angular 애플리케이션 프레임워크 외에도 *profile* 구성 요소를 생성합니다.

1. 새로운 Angular 프로젝트 *angular-custom-route-match*를 만듭니다.

    ```shell
    ng new angular-custom-route-match
    ```

    `Angular 라우팅을 추가하시겠습니까?`라는 메시지가 나타나면 `Y`를 선택합니다.

    `어떤 스타일시트 형식을 사용하시겠습니까?`라는 메시지가 나타나면 `CSS`를 선택합니다.

    잠시 후, 새로운 프로젝트 `angular-custom-route-match`가 준비됩니다.

1. 터미널에서 `angular-custom-route-match` 디렉토리로 이동합니다.
1. 구성 요소 *profile*을 생성합니다.

    ```shell
    ng generate component profile
    ```

1. 코드 편집기에서 `profile.component.html` 파일을 찾아 자리 표시자 콘텐츠를 다음 HTML로 바꿉니다.

    <docs-code header="src/app/profile/profile.component.html" path="adev/src/content/examples/routing-with-urlmatcher/src/app/profile/profile.component.html"/>

1. 코드 편집기에서 `app.component.html` 파일을 찾아 자리 표시자 콘텐츠를 다음 HTML로 바꿉니다.

    <docs-code header="src/app/app.component.html" path="adev/src/content/examples/routing-with-urlmatcher/src/app/app.component.html"/>

## 애플리케이션을 위한 경로 구성

애플리케이션 프레임워크가 갖춰졌으므로, 다음으로 `app.config.ts` 파일에 라우팅 기능을 추가해야 합니다. 
이 과정의 일환으로 URL에서 Twitter 핸들을 찾는 사용자 정의 URL 매처를 생성할 것입니다. 
이 핸들은 앞에 `@` 기호로 식별됩니다.

1. 코드 편집기에서 `app.config.ts` 파일을 엽니다.
1. Angular의 `provideRouter` 및 `withComponentInputBinding`에 대한 `import` 문과 애플리케이션 경로를 추가합니다.

    ```ts
    import {provideRouter, withComponentInputBinding} from '@angular/router';

    import {routes} from './app.routes';
    ```

1. providers 배열에 `provideRouter(routes, withComponentInputBinding())` 문을 추가합니다.

1. 애플리케이션 경로에 사용자 정의 경로 매처를 정의하기 위해 다음 코드를 추가합니다.

    <docs-code header="src/app/app.routes.ts" path="adev/src/content/examples/routing-with-urlmatcher/src/app/app.routes.ts" visibleRegion="matcher"/>

이 사용자 정의 매처는 다음 작업을 수행하는 함수입니다:

* 매처는 배열이 오직 하나의 세그먼트만 포함하는지 확인합니다.
* 매처는 정규 표현식을 사용하여 사용자 이름의 형식이 일치하는지 확인합니다.
* 일치하는 경우, 함수는 전체 URL을 반환하며, 경로의 부분 문자열로서 `username` 경로 매개변수를 정의합니다.
* 일치하지 않는 경우, 함수는 null을 반환하고 라우터는 URL과 일치하는 다른 경로를 계속 찾습니다.

도움말: 사용자 정의 URL 매처는 다른 경로 정의와 마찬가지로 동작합니다. 다른 경로와 마찬가지로 자식 경로나 지연 로드 경로를 정의하십시오.

## 경로 매개변수 읽기

사용자 정의 매처가 설정되었으므로 이제 `profile` 구성 요소에서 경로 매개변수를 바인딩할 수 있습니다.

코드 편집기에서 `profile.component.ts` 파일을 열고 `username` 매개변수에 해당하는 `Input`을 만듭니다. 
우리는 이전에 `provideRouter`에서 `withComponentInputBinding` 기능을 추가했습니다. 
이것은 `Router`가 정보를 경로 구성 요소에 직접 바인딩할 수 있게 합니다.

```ts
@Input() username!: string;
```

## 사용자 정의 URL 매처 테스트 

코드가 준비되었으므로 이제 사용자 정의 URL 매처를 테스트할 수 있습니다.

1. 터미널 창에서 `ng serve` 명령을 실행합니다.

    <docs-code language="shell">
    ng serve
    </docs-code>

1. 브라우저를 열어 `http://localhost:4200`로 이동합니다.

    `내 프로필로 이동`이라고 적힌 문장으로 구성된 단일 웹 페이지를 볼 수 있어야 합니다.

1. **내 프로필** 하이퍼링크를 클릭합니다.

    `안녕하세요, Angular!`라는 새로운 문장이 페이지에 나타납니다.

## 다음 단계

Angular Router의 패턴 일치는 애플리케이션에 동적 URL이 있을 때 많은 유연성을 제공합니다. 
Angular Router에 대해 더 알아보려면 다음 주제를 참조하십시오:

<docs-pill-row>
  <docs-pill href="guide/routing/common-router-tasks" title="애플리케이션 내 라우팅 및 탐색"/>
  <docs-pill href="api/router/Router" title="라우터 API"/>
</docs-pill-row>

도움말: 이 콘텐츠는 [Angular Router로 사용자 정의 경로 매칭](https://medium.com/@brandontroberts/custom-route-matching-with-the-angular-router-fbdd48665483), [Brandon Roberts](https://twitter.com/brandontroberts) 작성에 기반합니다.