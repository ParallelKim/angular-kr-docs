# 애플리케이션에 세부 정보 페이지 통합하기

이 튜토리얼 수업에서는 세부 정보 페이지를 앱에 연결하는 방법을 보여줍니다.

<docs-video src="https://www.youtube.com/embed/-jRxG84AzCI?si=CbqIpmRpwp5ZZDnu&amp;start=345"/>

중요: 라우팅을 배우기 위해 로컬 환경을 사용하는 것을 권장합니다.

## 배울 내용

이 수업의 끝에서 귀하의 애플리케이션은 세부 정보 페이지로의 라우팅 지원을 갖게 됩니다.

## 경로 매개변수를 사용한 라우팅 개념 미리보기

각 주택 위치에는 사용자가 해당 항목의 세부 정보 페이지로 탐색할 때 표시해야 할 특정 세부 정보가 있습니다. 이 목표를 달성하기 위해 경로 매개변수를 사용해야 합니다.

경로 매개변수는 경로 URL의 일부로 동적 정보를 포함할 수 있게 해줍니다. 사용자가 클릭한 주택 위치를 식별하기 위해 `HousingLocation` 유형의 `id` 속성을 사용합니다.

<docs-workflow>

<docs-step title="동적 탐색을 위한 `routerLink` 사용">
10번째 수업에서 `src/app/routes.ts`에 라우트 매개변수인 `id`를 식별하는 특별한 세그먼트를 포함한 두 번째 경로를 추가했습니다:

<docs-code language="javascript">
'details/:id'
</docs-code>

이 경우 `:id`는 동적이며 코드가 요청된 방식에 따라 변경됩니다.

1. `src/app/housing-location/housing-location.component.ts`에 앵커 태그를 `section` 요소에 추가하고 `routerLink` 지시어를 포함합니다:

    <docs-code header="housing-location.component.ts에 routerLink 지시어가 있는 앵커 추가" path="adev/src/content/tutorials/first-app/steps/12-forms/src/app/housing-location/housing-location.component.ts" visibleLines="[20]"/>

    `routerLink` 지시어는 Angular의 라우터가 애플리케이션 내에서 동적 링크를 생성할 수 있게 해줍니다. `routerLink`에 할당된 값은 경로의 정적 부분과 동적 데이터가 있는 두 개의 항목으로 구성된 배열입니다.

    템플릿에서 `routerLink`가 작동하려면 '@angular/router'에서 `RouterLink` 및 `RouterOutlet`의 파일 수준 가져오기를 추가하고, 구성 요소의 `imports` 배열에 `RouterLink`와 `RouterOutlet`을 포함합니다.
1. 이 시점에서 라우팅이 앱에서 작동하는지 확인할 수 있습니다. 브라우저에서 홈 페이지를 새로 고치고 주택 위치의 "자세히 알아보기" 버튼을 클릭합니다.

    <img alt="세부 정보 페이지에 'details works!' 텍스트가 표시됨" src="assets/images/tutorials/first-app/homes-app-lesson-11-step-1.png">

</docs-step>

<docs-step title="경로 매개변수 가져오기">
이 단계에서는 `DetailsComponent`에서 경로 매개변수를 가져옵니다. 현재 앱은 `details works!`를 표시합니다. 다음에 코드를 업데이트하여 경로 매개변수를 사용하여 전달된 `id` 값을 표시합니다.

1. `src/app/details/details.component.ts`에서 템플릿을 업데이트하여 `DetailsComponent`에서 사용할 함수, 클래스 및 서비스를 가져옵니다:

    <docs-code header="파일 수준 가져오기 업데이트" path="adev/src/content/tutorials/first-app/steps/12-forms/src/app/details/details.component.ts" visibleLines="[1,5]"/>

1. `@Component` 데코레이터의 `template` 속성을 업데이트하여 `housingLocationId` 값을 표시합니다:

    <docs-code language="javascript">
      template: `<p>details works! {{ housingLocationId }}</p>`,
    </docs-code>

1. `DetailsComponent` 클래스의 본문을 다음 코드로 업데이트합니다:

    <docs-code language="javascript">
        export class DetailsComponent {
            route: ActivatedRoute = inject(ActivatedRoute);
            housingLocationId = -1;
            constructor() {
                this.housingLocationId = Number(this.route.snapshot.params['id']);
            }
        }
    </docs-code>

    이 코드는 `DetailsComponent`에 현재 라우트에 대한 데이터에 접근할 수 있는 `ActivatedRoute` 라우터 기능을 제공합니다. `constructor`에서 이 코드는 라우트에서 획득한 `id` 매개변수를 문자열에서 숫자로 변환합니다.

1. 모든 변경 사항을 저장합니다.

1. 브라우저에서 주택 위치의 "Learn More" 링크 중 하나를 클릭하고 페이지에 표시된 숫자 값이 해당 위치의 데이터에서 `id` 속성과 일치하는지 확인합니다.
</docs-step>

<docs-step title="`DetailComponent` 사용자 정의">
현재 애플리케이션에서 라우팅이 제대로 작동하고 있으므로 경로 매개변수에 대한 주택 위치가 나타내는 특정 데이터를 표시하는 `DetailsComponent`의 템플릿을 업데이트할 좋은 시기입니다.

데이터에 접근하기 위해 `HousingService`를 호출할 것입니다.

1. 템플릿 코드를 다음 코드에 맞게 업데이트합니다:

    <docs-code header="src/app/details/details.component.ts에서 DetailsComponent 템플릿 업데이트" path="adev/src/content/tutorials/first-app/steps/12-forms/src/app/details/details.component.ts" visibleLines="[11,32]"/>

    `housingLocation` 속성이 선택적 체이닝 연산자 `?`로 액세스되고 있음을 주목하세요. 이는 `housingLocation` 값이 null이거나 정의되지 않은 경우 애플리케이션이 중단되지 않도록 보장합니다.

1. `DetailsComponent` 클래스의 본문을 다음 코드에 맞게 업데이트합니다:

    <docs-code header="src/app/details/details.component.ts에서 DetailsComponent 클래스 업데이트" path="adev/src/content/tutorials/first-app/steps/12-forms/src/app/details/details.component.ts" visibleLines="[35,44]"/>

    이제 구성 요소는 선택한 주택 위치에 따라 올바른 정보를 표시할 수 있는 코드를 가집니다. `constructor`에는 이제 라우트 매개변수를 `getHousingLocationById` 서비스 함수에 인수로 전달하기 위해 `HousingService`를 호출하는 코드가 포함되어 있습니다.

1. 다음 스타일을 `src/app/details/details.component.css` 파일에 복사합니다:

    <docs-code header="DetailsComponent에 대한 스타일 추가" path="adev/src/content/tutorials/first-app/steps/12-forms/src/app/details/details.component.css" visibleLines="[1,71]"/>

1. 변경 사항을 저장합니다.

1. 브라우저에서 페이지를 새로 고치고 특정 주택 위치의 "Learn More" 링크를 클릭했을 때 세부 정보 페이지가 해당 선택된 항목의 데이터에 따라 올바른 정보를 표시하는지 확인합니다.

    <img alt="홈 정보 나열이 있는 세부 정보 페이지" src="assets/images/tutorials/first-app/homes-app-lesson-11-step-3.png">

</docs-step>

<docs-step title="`HomeComponent`에 탐색 추가">
이전 수업에서는 `AppComponent` 템플릿을 업데이트하여 `routerLink`를 포함했습니다. 해당 코드를 추가하면 로고를 클릭할 때마다 앱에서 `HomeComponent`로 돌아갈 수 있게 됩니다.

1. 코드가 다음과 일치하는지 확인합니다:

    <docs-code header="AppComponent에 routerLink 추가" path="adev/src/content/tutorials/first-app/steps/12-forms/src/app/app.component.ts" visibleLines="[8,20]"/>

    귀하의 코드는 이미 최신일 수 있지만 확인해 보세요.
</docs-step>

</docs-workflow>

요약: 이 수업에서는 세부 정보 페이지를 표시하기 위해 라우팅을 추가했습니다.

이제 다음을 할 수 있습니다:

* 경로 매개변수를 사용하여 경로에 데이터를 전달하기
* 동적 데이터를 사용하여 경로를 생성하기 위해 `routerLink` 지시어 사용하기
* `HousingService`에서 데이터를 검색하여 특정 주택 위치 정보를 표시하기 위한 경로 매개변수 사용하기.

지금까지 정말 훌륭한 작업입니다.

이 수업에서 다룬 주제에 대한 자세한 정보는 다음을 방문하세요:

<docs-pill-row>
  <docs-pill href="guide/routing/common-router-tasks#accessing-query-parameters-and-fragments" title="경로 매개변수"/>
  <docs-pill href="guide/routing" title="Angular에서의 라우팅 개요"/>
  <docs-pill href="guide/routing/common-router-tasks" title="공통 라우팅 작업"/>
  <docs-pill href="https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/Optional_chaining" title="선택적 체이닝 연산자"/>
</docs-pill-row>