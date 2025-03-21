# 컴포넌트 템플릿에 인터폴레이션 추가하기

이 튜토리얼 수업에서는 Angular 템플릿에 인터폴레이션을 추가하여 템플릿에서 동적 데이터를 표시하는 방법을 보여줍니다.

<docs-video src="https://www.youtube.com/embed/eM3zi_n7lNs?si=IFAly3Ss8dwqFx8N&amp;start=338"/>

## 배울 내용

- `HousingLocationComponent` 템플릿에서 인터폴레이션된 값을 표시할 수 있습니다.
- 앱이 브라우저에 주택 위치 데이터를 렌더링합니다.

## 인터폴레이션의 개념적 미리보기

이 단계에서는 인터폴레이션을 사용하여 템플릿에 값(속성 및 `Input` 값)을 표시합니다.

Angular 템플릿에서 `{{ expression }}`을 사용하여 속성, `Inputs` 및 유효한 JavaScript 표현식에서 값을 렌더링할 수 있습니다.

더 깊이 있는 설명은 [인터폴레이션으로 값 표시](guide/templates/binding#render-dynamic-text-with-text-interpolation) 가이드를 참조하세요.

<docs-workflow>

<docs-step title="인터폴레이션된 값을 포함하도록 `HousingLocationComponent` 템플릿 업데이트">
이 단계에서는 `HousingLocationComponent` 템플릿에 새로운 HTML 구조와 인터폴레이션된 값을 추가합니다.

코드 편집기에서:

1. `src/app/housing-location/housing-location.component.ts`로 이동합니다.
1. `@Component` 데코레이터의 템플릿 속성에서 기존 HTML 마크업을 다음 코드로 교체합니다:

<docs-code header="HousingLocationComponent 템플릿 업데이트" path="adev/src/content/tutorials/first-app/steps/08-ngFor/src/app/housing-location/housing-location.component.ts" visibleLines="[9,20]"/>

  이 업데이트된 템플릿 코드에서는 `housingLocation.photo`를 `src` 속성에 바인딩하기 위해 속성 바인딩을 사용했습니다. `alt` 속성에는 이미지의 대체 텍스트에 대한 더 많은 컨텍스트를 제공하기 위해 인터폴레이션을 사용합니다.

  인터폴레이션을 사용하여 `housingLocation` 속성의 `name`, `city` 및 `state`에 대한 값을 포함합니다.

</docs-step>

<docs-step title="변경 사항이 브라우저에서 렌더링되는지 확인">
1. 모든 변경 사항을 저장합니다.
1. 브라우저를 열고 앱이 사진, 도시 및 주 샘플 데이터를 렌더링하는지 확인합니다.
    <img alt="로고, 필터 텍스트 입력 상자, 검색 버튼 및 동일한 주택 위치 UI 카드가 표시된 homes-app의 브라우저 프레임" src="assets/images/tutorials/first-app/homes-app-lesson-07-step-2.png">
</docs-step>

</docs-workflow>

요약: 이 수업에서는 새로운 HTML 구조를 추가하고 Angular 템플릿 구문을 사용하여 `HousingLocation` 템플릿에 값을 렌더링했습니다.

이제 두 가지 중요한 기술을 습득했습니다:

- 컴포넌트에 데이터 전달
- 템플릿에 값 인터폴레이션

이 기술로 이제 앱이 데이터를 공유하고 브라우저에서 동적 값을 표시할 수 있습니다. 지금까지 잘 하고 있습니다.

이번 수업에서 다룬 주제에 대한 자세한 정보는 다음을 방문하세요:

<docs-pill-row>
  <docs-pill href="guide/templates" title="템플릿 구문"/>
  <docs-pill href="guide/templates/binding#render-dynamic-text-with-text-interpolation" title="인터폴레이션으로 값 표시"/>
</docs-pill-row>