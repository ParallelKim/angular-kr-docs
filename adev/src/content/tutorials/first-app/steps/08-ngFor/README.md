# *ngFor를 사용하여 컴포넌트에서 객체 나열하기

이 튜토리얼 수업에서는 Angular 템플릿에서 `ngFor` 지시자를 사용하는 방법을 보여주며, 템플릿에서 동적으로 반복되는 데이터를 표시합니다.

<docs-video src="https://www.youtube.com/embed/eM3zi_n7lNs?si=MIl5NcRxvcLjYt5f&amp;start=477"/>

## 배울 내용

* 앱에 데이터 세트를 추가했습니다.
* 앱이 `ngFor`를 사용하여 새 데이터 세트의 요소 목록을 표시합니다.

## ngFor 개념 미리 보기

Angular에서 `ngFor`는 템플릿에서 데이터를 동적으로 반복하기 위해 사용되는 특정 유형의 [지시자](guide/directives)입니다. 일반 JavaScript에서는 for 루프를 사용할 수 있으며, ngFor은 Angular 템플릿에 유사한 기능을 제공합니다.

`ngFor`를 사용하여 배열 및 비동기 값에 대해 반복할 수 있습니다. 이 수업에서는 반복할 새 데이터 배열을 추가합니다.

자세한 설명은 [내장 지시자](guide/directives#ngFor) 가이드를 참조하세요.

<docs-workflow>

<docs-step title="HomeComponent에 주택 데이터 추가하기">

`HomeComponent`에는 단일 주택 위치만 있습니다. 이 단계에서는 `HousingLocation` 항목의 배열을 추가합니다.

1. `src/app/home/home.component.ts`에서 `HomeComponent` 클래스에서 `housingLocation` 속성을 제거합니다.
1. `HomeComponent` 클래스에 `housingLocationList`라는 속성을 추가합니다. 다음의 코드와 일치하도록 코드를 업데이트하세요:
    <docs-code header="housingLocationList 속성 추가" path="adev/src/content/tutorials/first-app/steps/09-services/src/app/home/home.component.ts" visibleLines="26-131"/>

    중요: `@Component` 데코레이터를 제거하지 마세요. 이 코드는 다음 단계에서 업데이트합니다.

</docs-step>

<docs-step title="HomeComponent 템플릿을 ngFor 사용하도록 업데이트하기">
이제 앱에는 브라우저에서 항목을 `ngFor` 지시자를 사용하여 표시할 수 있는 데이터 세트가 있습니다.

1. 템플릿 코드에서 `<app-housing-location>` 태그를 다음과 같이 업데이트하세요:
    <docs-code header="HomeComponent 템플릿에 ngFor 추가" path="adev/src/content/tutorials/first-app/steps/09-services/src/app/home/home.component.ts" visibleLines="[17,22]"/>

    코드 `[housingLocation] = "housingLocation"`에서 `housingLocation` 값은 이제 `ngFor` 지시자에서 사용되는 변수를 참조합니다. 이 변경 전에는 `HomeComponent` 클래스의 속성을 참조했습니다.

1. 모든 변경 사항을 저장합니다.

1. 브라우저를 새로 고치고 앱이 이제 주택 위치의 그리드를 렌더링하는지 확인합니다.

    <section class="lightbox">
    <img alt="로고, 필터 텍스트 입력 상자, 검색 버튼 및 주택 위치 카드의 그리드를 표시하는 homes-app의 브라우저 프레임" src="assets/images/tutorials/first-app/homes-app-lesson-08-step-2.png">
    </section>

</docs-step>

</docs-workflow>

요약: 이 수업에서는 `ngFor` 지시자를 사용하여 Angular 템플릿에서 데이터를 동적으로 반복했습니다. 또한 Angular 앱에서 사용할 새 데이터 배열을 추가했습니다. 이제 애플리케이션은 브라우저에서 주택 위치 목록을 동적으로 렌더링합니다.

앱이 형태를 갖추고 있습니다. 잘 하셨습니다.

이 수업에서 다룬 주제에 대한 더 많은 정보를 보려면 방문하세요:

<docs-pill-row>
  <docs-pill href="guide/directives/structural-directives" title="구조적 지시자"/>
  <docs-pill href="guide/directives#ngFor" title="ngFor 가이드"/>
  <docs-pill href="api/common/NgFor" title="ngFor"/>
</docs-pill-row>