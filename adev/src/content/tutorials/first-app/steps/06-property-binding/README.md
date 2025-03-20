# 구성 요소 템플릿에 속성 바인딩 추가하기

이 튜토리얼에서는 템플릿에 속성 바인딩을 추가하고 이를 사용하여 구성 요소에 동적 데이터를 전달하는 방법을 설명합니다.

<docs-video src="https://www.youtube.com/embed/eM3zi_n7lNs?si=AsiczpWnMz5HhJqB&amp;start=599"/>

## 배울 내용

* 귀하의 앱은 `HomeComponent` 템플릿에서 데이터 바인딩을 가지고 있습니다.
* 귀하의 앱은 `HomeComponent`에서 `HousingLocationComponent`로 데이터를 전송합니다.

## 입력의 개념 미리보기

이 수업에서는 부모 구성 요소에서 자식 구성 요소로 데이터를 공유하는 과정을 계속 진행하며, 속성 바인딩을 사용하여 템플릿의 해당 속성에 데이터를 바인딩합니다.

속성 바인딩은 Angular 템플릿의 `Input`에 변수를 연결할 수 있게 해줍니다. 그런 다음 데이터는 `Input`에 동적으로 바인딩됩니다.

더 깊이 있는 설명을 보려면 [속성 바인딩](guide/templates/property-binding) 가이드를 참조하세요.

<docs-workflow>

<docs-step title="`HomeComponent` 템플릿 업데이트하기">
이 단계에서는 `<app-housing-location>` 태그에 속성 바인딩을 추가합니다.

코드 편집기에서:

1. `src/app/home/home.component.ts`로 이동합니다.
1. `@Component` 데코레이터의 템플릿 속성에서 코드를 아래의 코드와 일치하도록 업데이트합니다:
    <docs-code header="housingLocation 속성 바인딩 추가" path="adev/src/content/tutorials/first-app/steps/07-dynamic-template-values/src/app/home/home.component.ts" visibleLines="[17,19]"/>

    구성 요소 태그에 속성 바인딩을 추가할 때는 `[attribute] = "value"` 구문을 사용하여 Angular에게 할당된 값을 구성 요소 클래스의 속성으로 처리해야 한다는 것을 알립니다. 문자열 값이 아닙니다.

    오른쪽에 있는 값은 `HomeComponent`의 속성 이름입니다.
</docs-step>

<docs-step title="코드가 여전히 작동하는지 확인하기">
1. 변경 사항을 저장하고 앱에 오류가 없는지 확인합니다.
1. 다음 단계로 진행하기 전에 오류를 수정합니다.
</docs-step>

</docs-workflow>

요약: 이번 수업에서는 새로운 속성 바인딩을 추가하고 클래스 속성에 대한 참조를 전달했습니다. 이제 `HousingLocationComponent`는 구성 요소의 디스플레이를 사용자 지정하는 데 사용할 수 있는 데이터에 액세스할 수 있습니다.

이번 수업에서 다룬 주제에 대한 더 많은 정보는 다음을 방문하세요:

<docs-pill-row>
  <docs-pill href="/guide/templates/property-binding" title="속성 바인딩"/>
</docs-pill-row>