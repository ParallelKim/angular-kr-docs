# 앱에 검색 기능 추가하기

이번 튜토리얼 수업에서는 Angular 앱에 검색 기능을 추가하는 방법을 보여줍니다.

이 앱은 사용자가 앱에서 제공하는 데이터를 검색하고 입력한 용어와 일치하는 결과만 표시할 수 있도록 합니다.

<docs-video src="https://www.youtube.com/embed/5K10oYJ5Y-E?si=TiuNKx_teR9baO7k&amp;start=457"/>

중요: 이 튜토리얼 단계에서는 로컬 환경을 사용하는 것을 권장합니다.

## 배울 내용

- 앱은 양식의 데이터를 사용하여 일치하는 주택 위치를 검색합니다.
- 앱은 일치하는 주택 위치만 표시합니다.

<docs-workflow>

<docs-step title="홈 컴포넌트 속성 업데이트">
이 단계에서는 `HomeComponent` 클래스를 업데이트하여 필터링에 사용할 새 배열 속성에 데이터를 저장합니다.

1. `src/app/home/home.component.ts`에서 클래스에 `filteredLocationList`라는 새 속성을 추가합니다.

   <docs-code header="필터된 결과 속성 추가" path="adev/src/content/tutorials/first-app/steps/14-http/src/app/home/home.component.ts" visibleLines="[30]"/>

   `filteredLocationList`는 사용자가 입력한 검색 기준과 일치하는 값을 보관합니다.

1. 페이지가 로드될 때 기본적으로 전체 주택 위치 값 세트를 포함해야 합니다. `HomeComponent`의 `constructor`를 업데이트하여 값을 설정합니다.

<docs-code header="filteredLocationList의 값 설정" path="adev/src/content/tutorials/first-app/steps/14-http/src/app/home/home.component.ts" visibleLines="[31,34]"/>

</docs-step>

<docs-step title="홈 컴포넌트 템플릿 업데이트">
`HomeComponent`는 이미 사용자의 입력을 캡처하기 위해 사용할 입력 필드를 포함하고 있습니다. 이 문자열 텍스트는 결과를 필터링하는 데 사용됩니다.

1. `HomeComponent` 템플릿을 업데이트하여 `input` 요소에 `#filter`라는 템플릿 변수를 포함합니다.

   <docs-code header="HomeComponent의 템플릿에 템플릿 변수 추가" language="html">
       <input type="text" placeholder="도시별 필터링" #filter>
   </docs-code>

   이 예제는 [템플릿 참조 변수](guide/templates)를 사용하여 해당 값의 `input` 요소에 접근합니다.

1. 다음으로, "검색" 버튼에 이벤트 핸들러를 연결하도록 컴포넌트 템플릿을 업데이트합니다.

   <docs-code header="클릭 이벤트 바인딩" language="html">
       <button class="primary" type="button" (click)="filterResults(filter.value)">검색</button>
   </docs-code>

   `button` 요소의 `click` 이벤트에 바인딩함으로써 `filterResults` 함수를 호출할 수 있습니다. 함수의 인수는 `filter` 템플릿 변수의 `value` 속성입니다. 구체적으로, `input` HTML 요소의 `.value` 속성입니다.

1. 마지막 템플릿 업데이트는 `ngFor` 지시어입니다. `ngFor` 값을 `filteredLocationList` 배열의 값을 반복하도록 업데이트합니다.

<docs-code header="ngFor 지시어 값 업데이트" language="html">
    <app-housing-location *ngFor="let housingLocation of filteredLocationList" [housingLocation]="housingLocation"></app-housing-location>
</docs-code>

</docs-step>

<docs-step title="이벤트 핸들러 함수 구현">
템플릿은 `filterResults` 함수를 `click` 이벤트에 바인딩하도록 업데이트되었습니다. 다음으로, `HomeComponent` 클래스에서 `filterResults` 함수를 구현하는 작업을 수행합니다.

1. `HomeComponent` 클래스를 업데이트하여 `filterResults` 함수 구현을 추가합니다.

   <docs-code header="filterResults 함수 구현 추가" path="adev/src/content/tutorials/first-app/steps/14-http/src/app/home/home.component.ts" visibleLines="[35,44]"/>

   이 함수는 `String` `filter` 함수를 사용하여 `text` 매개변수의 값을 `housingLocation.city` 속성과 비교합니다. 재미있는 연습을 위해 이 함수를 수정하여 모든 속성 또는 여러 속성과 일치하도록 할 수 있습니다.

1. 코드를 저장합니다.

1. 브라우저를 새로 고치고 텍스트를 입력한 후 "검색" 버튼을 클릭하여 도시별로 주택 위치 데이터를 검색할 수 있는지 확인합니다.

<img alt="사용자 입력에 따라 필터링된 검색 결과" src="assets/images/tutorials/first-app/homes-app-lesson-13-step-3.png">
</docs-step>

</docs-workflow>

요약: 이번 수업에서는 앱을 업데이트하여 템플릿 변수로 템플릿 값과 상호작용하고, 이벤트 바인딩 및 배열 함수를 사용하여 검색 기능을 추가했습니다.

이번 수업에서 다룬 주제에 대한 자세한 정보를 보려면 다음을 방문하십시오:

<docs-pill-row>
  <docs-pill href="guide/templates" title="템플릿 변수"/>
  <docs-pill href="guide/templates/event-listeners" title="이벤트 처리"/>
</docs-pill-row>