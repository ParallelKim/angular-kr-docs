# 컴포넌트에 입력 매개변수 추가하기

이번 튜토리얼 수업에서는 `@Input()` 컴포넌트를 생성하고 이를 사용하여 구성 요소에 데이터를 전달하는 방법을 설명합니다.

<docs-video src="https://www.youtube.com/embed/eM3zi_n7lNs?si=WvRGFSkW_7_zDIFD&amp;start=241"/>

## 배울 내용

앱의 `HousingLocationComponent` 템플릿에는 입력을 받을 `HousingLocation` 속성이 있습니다.

## 입력의 개념적 미리보기

[입력](api/core/Input)은 컴포넌트가 데이터를 공유할 수 있게 합니다. 데이터 공유의 방향은 부모 컴포넌트에서 자식 컴포넌트로 향합니다.

이 강의에서는 `HousingLocationComponent` 컴포넌트에서 `@Input()` 속성을 정의하여 컴포넌트에 표시될 데이터를 사용자 정의할 수 있도록 합니다.

자세한 내용은 [입력 속성으로 데이터 수신하기](guide/components/inputs) 및 [출력을 통한 사용자 정의 이벤트](guide/components/outputs) 가이드를 참조하세요.

<docs-workflow>

<docs-step title="Input 데코레이터 가져오기">
이 단계에서는 클래스에 `Input` 데코레이터를 가져옵니다.

코드 편집기에서:

1. `src/app/housing-location/housing-location.component.ts`로 이동합니다.
1. 파일 import를 `Input` 및 `HousingLocation`을 포함하도록 업데이트합니다:

    <docs-code header="src/app/housing-location/housing-location.component.ts에서 HousingLocationComponent와 Input 가져오기" path="adev/src/content/tutorials/first-app/steps/06-property-binding/src/app/housing-location/housing-location.component.ts" visibleLines="[1,3]"/>

</docs-step>

<docs-step title="Input 속성 추가하기">
1. 같은 파일에서 `HousingLocationComponent` 클래스에 `HousingLocation` 타입의 `housingLocation`이라는 속성을 추가합니다. 속성 이름 뒤에 `!`를 추가하고 `@Input()` 데코레이터로 접두사를 붙입니다:

    <docs-code header="src/app/housing-location/housing-location.component.ts에서 HousingLocationComponent와 Input 가져오기" path="adev/src/content/tutorials/first-app/steps/06-property-binding/src/app/housing-location/housing-location.component.ts" visibleLines="[13,15]"/>

    입력은 값이 전달될 것으로 예상하므로 `!`를 추가해야 합니다. 이 경우 기본값이 없습니다. 예제 애플리케이션에서는 값이 전달된다는 것을 알고 있습니다 - 이는 설계상 결정입니다. 느낌표는 넌-null 단정 연산자(non-null assertion operator)라고 하며, 이 속성의 값이 null 또는 undefined가 아님을 TypeScript 컴파일러에 알려줍니다.

1. 변경 사항을 저장하고 앱에 오류가 없는지 확인합니다.

1. 다음 단계로 진행하기 전에 오류를 수정합니다.
</docs-step>

</docs-workflow>

요약: 이번 강의에서는 `@Input()` 데코레이터로 장식된 새로운 속성을 생성했습니다. 또한 넌-null 단정 연산자를 사용하여 새 속성의 값이 `null`이나 `undefined`가 아님을 컴파일러에 알렸습니다.

<docs-pill-row>
  <docs-pill href="guide/components/inputs" title="입력 속성으로 데이터 수신하기"/>
  <docs-pill href="guide/components/outputs" title="출력을 통한 사용자 정의 이벤트"/>
</docs-pill-row>