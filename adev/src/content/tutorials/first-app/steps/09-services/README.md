# Angular 서비스

이 튜토리얼 수업에서는 Angular 서비스를 생성하고 종속성 주입을 사용하여 앱에 포함하는 방법을 보여줍니다.

<docs-video src="https://www.youtube.com/embed/-jRxG84AzCI?si=rieGfJawp9xJ00Sz"/>

## 배울 내용

귀하의 앱은 데이터를 제공하는 서비스를 가지고 있습니다.
이 수업의 끝에서 서비스는 로컬의 정적 데이터를 읽습니다.
나중의 수업에서는 웹 서비스에서 데이터를 가져오도록 서비스를 업데이트할 것입니다.

## 서비스에 대한 개념적 미리보기

이 튜토리얼은 Angular 서비스와 종속성 주입을 소개합니다.

### Angular 서비스

*Angular 서비스*는 여러 구성 요소에서 사용할 수 있는 Angular 앱 데이터 및 함수를 분리하는 방법을 제공합니다.
여러 구성 요소에서 사용되기 위해서는 서비스가 *주입 가능*해야 합니다.
주입 가능하고 구성 요소에서 사용되는 서비스는 해당 구성 요소의 종속성이 됩니다.
구성 요소는 이러한 서비스에 의존하며, 서비스 없이는 기능을 수행할 수 없습니다.

### 종속성 주입

*종속성 주입*은 앱의 구성 요소 및 다른 구성 요소에서 사용할 수 있는 서비스의 종속성을 관리하는 메커니즘입니다.

<docs-workflow>

<docs-step title="앱을 위한 새로운 서비스 생성">
이 단계에서는 앱을 위한 주입 가능한 서비스를 생성합니다.

**Terminal** 창에서:

1. 프로젝트 디렉토리에서 `first-app` 디렉토리로 이동합니다.
1. `first-app` 디렉토리에서 다음 명령을 실행하여 새로운 서비스를 생성합니다.

    <docs-code language="shell">
    ng generate service housing --skip-tests
    </docs-code>

1. `ng serve`를 실행하여 앱을 빌드하고 `http://localhost:4200`에서 제공합니다.
1. 앱이 오류 없이 빌드되는지 확인합니다.
    다음 단계로 넘어가기 전에 모든 오류를 수정하세요.
</docs-step>

<docs-step title="새 서비스에 정적 데이터 추가">
이 단계에서는 새 서비스에 샘플 데이터를 추가합니다.
나중의 수업에서 정적 데이터를 실제 앱이 가져오는 것처럼 웹 인터페이스로 교체할 것입니다.
현재 앱의 새 서비스는 이제까지 `HomeComponent`에서 로컬로 생성된 데이터를 사용합니다.

**Edit** 창에서:

1. `src/app/home/home.component.ts`에서 `HomeComponent`의 `housingLocationList` 변수를 복사하고 그 배열 값을 복사합니다.
1. `src/app/housing.service.ts`에서:
    1. `HousingService` 클래스 내부에, 이전 단계에서 `HomeComponent`에서 복사한 변수를 붙여넣습니다.
    1. `HousingService` 클래스 내부에, 방금 복사한 데이터 이후에 이러한 함수를 붙여넣습니다.
        이러한 함수는 종속성이 서비스의 데이터에 접근할 수 있도록 합니다.

        <docs-code header="src/app/housing.service.ts의 서비스 함수" path="adev/src/content/tutorials/first-app/steps/10-routing/src/app/housing.service.ts" visibleLines="[112,118]"/>

        향후 수업에서 이러한 함수가 필요할 것입니다. 현재로서는 이 함수들이 특정 `HousingLocation`을 id로 반환하거나 전체 목록을 반환한다는 것을 이해하면 충분합니다.

    1. `HousingLocation`에 대한 파일 수준 임포트를 추가합니다.

        <docs-code header="src/app/housing.service.ts에서 HousingLocation 타입 가져오기" path="adev/src/content/tutorials/first-app/steps/10-routing/src/app/housing.service.ts" visibleLines="[2]"/>

1. 앱이 오류 없이 빌드되는지 확인합니다.
    다음 단계로 넘어가기 전에 모든 오류를 수정하세요.
</docs-step>

<docs-step title="새 서비스를 `HomeComponent`에 주입">
이 단계에서는 새 서비스를 앱의 `HomeComponent`에 주입하여 앱 데이터에 서비스를 통해 접근할 수 있도록 합니다.
나중의 수업에서 정적 데이터를 실제 앱처럼 라이브 데이터 소스로 교체할 것입니다.

**Edit** 창에서, `src/app/home/home.component.ts`에서:

1. `src/app/home/home.component.ts`의 맨 위에, `@angular/core`에서 가져온 항목에 `inject`를 추가합니다. 이것은 `HomeComponent` 클래스에 `inject` 함수를 가져옵니다.

    <docs-code header="src/app/home/home.component.ts 업데이트" path="adev/src/content/tutorials/first-app/steps/10-routing/src/app/home/home.component.ts" visibleLines="[1]"/>

1. `HousingService`에 대한 새로운 파일 수준 임포트를 추가합니다:

    <docs-code header="src/app/home/home.component.ts에 임포트 추가" path="adev/src/content/tutorials/first-app/steps/10-routing/src/app/home/home.component.ts" visibleLines="[5]"/>

1. `HomeComponent`에서 `housingLocationList` 배열 항목을 삭제하고 `housingLocationList`에 빈 배열(`[]`) 값을 할당합니다. 몇 단계 후에 코드를 업데이트하여 `HousingService`에서 데이터를 가져올 것입니다.

1. `HomeComponent`에서 아래 코드를 추가하여 새 서비스를 주입하고 앱의 데이터를 초기화합니다. `constructor`는 이 구성 요소가 생성될 때 실행되는 첫 번째 함수입니다. `constructor`의 코드는 `getAllHousingLocations` 호출에서 반환된 값으로 `housingLocationList`를 할당합니다.

    <docs-code header="src/app/home/home.component.ts에서 서비스로부터 데이터 초기화" path="adev/src/content/tutorials/first-app/steps/10-routing/src/app/home/home.component.ts" visibleLines="[28,32]"/>

1. `src/app/home/home.component.ts`에 대한 변경 사항을 저장하고 앱이 오류 없이 빌드되는지 확인합니다.
    다음 단계로 넘어가기 전에 모든 오류를 수정하세요.
</docs-step>

</docs-workflow>

요약: 이 수업에서는 Angular 서비스를 앱에 추가하고 `HomeComponent` 클래스에 주입했습니다.
이것은 앱이 데이터를 얻는 방식을 구분합니다.
현재 새로운 서비스는 정적 데이터 배열에서 데이터를 가져옵니다.
나중의 수업에서는 API 엔드포인트에서 데이터를 가져오도록 서비스를 리팩토링할 것입니다.

이 수업에서 다룬 주제에 대한 자세한 정보는 다음을 방문하세요:

<docs-pill-row>
  <docs-pill href="guide/di/creating-injectable-service" title="주입 가능한 서비스 생성"/>
  <docs-pill href="guide/di" title="Angular의 종속성 주입"/>
  <docs-pill href="cli/generate/service" title="ng generate service"/>
  <docs-pill href="cli/generate" title="ng generate"/>
</docs-pill-row>