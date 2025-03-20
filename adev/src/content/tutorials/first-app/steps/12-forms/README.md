# Angular 앱에 양식 추가하기

이 튜토리얼 레슨에서는 사용자 데이터를 수집하는 양식을 Angular 앱에 추가하는 방법을 보여줍니다. 이 레슨은 기능적인 Angular 앱으로 시작하며, 양식을 추가하는 방법을 보여줍니다.

양식이 수집하는 데이터는 앱의 서비스로만 전송되며, 브라우저의 콘솔에 기록됩니다. 양식의 데이터를 보내고 받기 위한 REST API 사용은 이 레슨에서 다루지 않습니다.

<docs-video src="https://www.youtube.com/embed/kWbk-dOJaNQ?si=FYMXGdUiT-qh321h"/>

중요: 이 튜토리얼 단계에서는 로컬 환경을 사용하는 것을 권장합니다.

## 배울 내용

- 사용자가 데이터를 입력할 수 있는 양식이 앱에 추가되며, 이 데이터는 앱의 서비스로 전송됩니다.
- 서비스는 양식에서 수집된 데이터를 브라우저의 콘솔 로그에 기록합니다.

<docs-workflow>

<docs-step title="양식 데이터를 전송하는 메서드 추가하기">
이 단계에서는 양식 데이터를 수신하여 데이터의 목적지로 전송하는 앱의 서비스에 메서드를 추가합니다. 이 예제에서는 메서드가 양식의 데이터를 브라우저의 콘솔 로그에 기록합니다.

**편집** 창에서 IDE의:

1. `src/app/housing.service.ts`에서 `HousingService` 클래스 안에, 클래스 정의 하단에 다음 메서드를 붙여넣습니다.

<docs-code header="src/app/housing.service.ts의 제출 메서드" path="adev/src/content/tutorials/first-app/steps/13-search/src/app/housing.service.ts" visibleLines="[120,124]"/>

1. 앱이 오류 없이 빌드되는지 확인합니다.
   다음 단계로 진행하기 전에 오류를 수정합니다.
   </docs-step>

<docs-step title="상세 페이지에 양식 기능 추가하기">
이 단계에서는 양식의 상호작용을 처리하는 코드가 상세 페이지에 추가됩니다.

**편집** 창에서 IDE의 `src/app/details/details.component.ts`에서:

1. 파일 상단의 `import` 문 이후에 Angular 양식 클래스를 가져오는 다음 코드를 추가합니다.

<docs-code header="src/app/details/details.component.ts의 양식 가져오기" path="adev/src/content/tutorials/first-app/steps/13-search/src/app/details/details.component.ts" visibleLines="[6]"/>

1. `DetailsComponent` 데코레이터 메타데이터에서 `imports` 속성을 다음 코드로 업데이트합니다.

<docs-code header="src/app/details/details.component.ts의 imports 지시문" path="adev/src/content/tutorials/first-app/steps/13-search/src/app/details/details.component.ts" visibleLines="[10]"/>

1. `DetailsComponent` 클래스에서 `constructor()` 메서드 전에 양식 객체를 생성하는 다음 코드를 추가합니다.

   <docs-code header="src/app/details/details.component.ts의 템플릿 지시문" path="adev/src/content/tutorials/first-app/steps/13-search/src/app/details/details.component.ts" visibleLines="[53,57]"/>

   Angular에서 `FormGroup`과 `FormControl`은 양식을 생성할 수 있게 해주는 타입입니다. `FormControl` 타입은 기본 값을 제공하고 양식 데이터를 형성할 수 있습니다. 이 예제에서는 `firstName`이 `string`이며 기본 값은 빈 문자열입니다.

1. `DetailsComponent` 클래스에서 `constructor()` 메서드 이후에 **지금 신청하기** 클릭을 처리하는 다음 코드를 추가합니다.

   <docs-code header="src/app/details/details.component.ts의 템플릿 지시문" path="adev/src/content/tutorials/first-app/steps/13-search/src/app/details/details.component.ts" visibleLines="[63,69]"/>

   이 버튼은 아직 존재하지 않습니다 - 다음 단계에서 추가할 것입니다. 위 코드에서 `FormControl`은 `null`을 반환할 수 있습니다. 이 코드는 값이 `null`일 경우 빈 문자열로 기본값을 설정하기 위해 nullish 병합 연산자를 사용합니다.

1. 앱이 오류 없이 빌드되는지 확인합니다.
   다음 단계로 진행하기 전에 오류를 수정합니다.
   </docs-step>

<docs-step title="상세 페이지에 양식의 마크업 추가하기">
이 단계에서는 양식의 마크업을 상세 페이지에 추가하여 양식을 표시합니다.

**편집** 창에서 IDE의 `src/app/details/details.component.ts`에서:

1. `DetailsComponent` 데코레이터 메타데이터에서 다음 코드와 일치하도록 `template` HTML을 업데이트하여 양식의 마크업을 추가합니다.

   <docs-code header="src/app/details/details.component.ts의 템플릿 지시문" path="adev/src/content/tutorials/first-app/steps/13-search/src/app/details/details.component.ts" visibleLines="[11,46]"/>

   이제 템플릿에는 이벤트 핸들러 `(submit)="submitApplication()"`가 포함되어 있습니다. Angular는 템플릿 코드에서 이벤트를 정의하기 위해 이벤트 이름 주위에 괄호 구문을 사용합니다. 등호 오른쪽의 코드는 이 이벤트가 발생할 때 실행되어야 하는 코드입니다. 브라우저 이벤트와 사용자 정의 이벤트에 바인딩할 수 있습니다.

1. 앱이 오류 없이 빌드되는지 확인합니다.
   다음 단계로 진행하기 전에 오류를 수정합니다.

<img alt="이 위치에 살기 위한 신청 양식이 있는 상세 페이지" src="assets/images/tutorials/first-app/homes-app-lesson-12-step-3.png">

</docs-step>

<docs-step title="앱의 새로운 양식 테스트하기">
이 단계에서는 양식 데이터가 앱에 제출될 때 콘솔 로그에 양식 데이터가 표시되는지 확인하기 위해 새로운 양식을 테스트합니다.

1. IDE의 **터미널** 창에서 `ng serve`를 실행합니다. 이미 실행 중이 아닌 경우.
1. 브라우저에서 `http://localhost:4200`에서 앱을 엽니다.
1. 브라우저에서 앱을 오른쪽 클릭하고 컨텍스트 메뉴에서 **검사**를 선택합니다.
1. 개발자 도구 창에서 **콘솔** 탭을 선택합니다.
   다음 단계에 대비해 개발자 도구 창이 표시되는지 확인하세요.
1. 앱에서:
   1. 주택 위치를 선택하고 **자세히 알아보기**를 클릭하여 주택 세부정보를 봅니다.
   1. 주택 세부정보 페이지에서 하단으로 스크롤하여 새 양식을 찾습니다.
   1. 양식 필드에 데이터를 입력합니다 - 아무 데이터나 괜찮습니다.
   1. **지금 신청하기**를 선택하여 데이터를 제출합니다.
1. 개발자 도구 창에서 로그 출력을 검토하여 양식 데이터를 찾습니다.
   </docs-step>

</docs-workflow>

요약: 이 레슨에서는 Angular의 양식 기능을 사용하여 양식을 추가하고, 양식에서 캡처된 데이터를 이벤트 핸들러를 사용하여 구성 요소에 연결하는 방법을 업데이트했습니다.

이 레슨에서 다룬 주제에 대한 자세한 내용은 다음을 방문하세요:

<docs-pill-row>
  <docs-pill href="guide/forms" title="Angular 양식"/>
  <docs-pill href="guide/templates/event-listeners" title="이벤트 처리"/>
</docs-pill-row>