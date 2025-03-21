# 관리되는 텍스트에 맞춤 ID 사용하기

Angular 추출기는 다음 인스턴스 각각에 대해 번역 단위 항목이 포함된 파일을 생성합니다.

* 구성 요소 템플릿의 각 `i18n` 속성
* 구성 요소 코드의 각 [`$localize`][ApiLocalizeInitLocalize] 태그 메시지 문자열

[의미가 텍스트 추출 및 병합을 제어하는 방법][GuideI18nCommonPrepareHowMeaningsControlTextExtractionAndMerges]에서 설명한 바와 같이, Angular는 각 번역 단위에 고유한 ID를 할당합니다.

다음 예제는 고유한 ID가 있는 번역 단위를 표시합니다.

<docs-code header="messages.fr.xlf.html" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="generated-id"/>

변환 가능한 텍스트를 변경하면, 추출기는 해당 번역 단위에 대해 새로운 ID를 생성합니다.
대부분의 경우, 소스 텍스트의 변경은 번역을 변경해야 합니다.
따라서 새로운 ID를 사용하면 텍스트 변경이 번역과 동기화됩니다.

그러나 일부 번역 시스템은 ID에 대해 특정 형식이나 구문을 요구합니다.
요구 사항을 해결하기 위해 텍스트를 표시할 때 맞춤 ID를 사용하십시오.
대부분의 개발자는 맞춤 ID를 사용할 필요가 없습니다.
추가 메타데이터를 전달하기 위해 고유한 구문을 사용하려면 맞춤 ID를 사용하십시오.
추가 메타데이터에는 텍스트가 나타나는 라이브러리, 구성 요소 또는 애플리케이션의 영역이 포함될 수 있습니다.

`i18n` 속성 또는 [`$localize`][ApiLocalizeInitLocalize] 태그 메시지 문자열에 맞춤 ID를 지정하려면 `@@` 접두사를 사용하세요.
다음 예제는 머리글 요소에서 `introductionHeader` 맞춤 ID를 정의합니다.

<docs-code header="app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="i18n-attribute-solo-id"/>

다음 예제는 변수를 위한 `introductionHeader` 맞춤 ID를 정의합니다.

<!--todo: 코드 예제로 교체 -->

<docs-code language="typescript">

variableText1 = $localize`:@@introductionHeader:Hello i18n!`;

</docs-code>

맞춤 ID를 지정하면 추출기가 맞춤 ID를 가진 번역 단위를 생성합니다.

<docs-code header="messages.fr.xlf.html" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="custom-id"/>

텍스트를 변경하면 추출기는 ID를 변경하지 않습니다.
그 결과, 번역을 업데이트하기 위해 추가 단계를 수행할 필요가 없습니다.
맞춤 ID를 사용하면 텍스트를 변경하는 경우 번역이 새로 변경된 소스 텍스트와 동기화되지 않을 수 있는 단점이 있습니다.

## 설명과 함께 맞춤 ID 사용하기

설명과 의미와 함께 맞춤 ID를 사용하여 번역자를 더 돕습니다.

다음 예제는 설명을 포함하고, 그 뒤에 맞춤 ID가 있습니다.

<docs-code header="app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="i18n-attribute-id"/>

다음 예제는 변수를 위한 `introductionHeader` 맞춤 ID와 설명을 정의합니다.

<!--todo: 코드 예제로 교체 -->

<docs-code language="typescript">

variableText2 = $localize`:An introduction header for this sample@@introductionHeader:Hello i18n!`;

</docs-code>

다음 예제는 의미를 추가합니다.

<docs-code header="app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="i18n-attribute-meaning-and-id"/>

다음 예제는 변수를 위한 `introductionHeader` 맞춤 ID를 정의합니다.

<!--todo: 코드 예제로 교체 -->

<docs-code language="typescript">

variableText3 = $localize`:site header|An introduction header for this sample@@introductionHeader:Hello i18n!`;

</docs-code>

### 고유한 맞춤 ID 정의하기

고유한 맞춤 ID를 정의해야 합니다.
두 개의 서로 다른 텍스트 요소에 동일한 ID를 사용하면 추출 도구는 첫 번째 것만 추출하며, Angular는 두 원래 텍스트 요소 모두에 대해 번역을 사용합니다.

예를 들어, 다음 코드 조각에서는 두 개의 서로 다른 텍스트 요소에 대해 동일한 `myId` 맞춤 ID가 정의되어 있습니다.

<docs-code header="app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="i18n-duplicate-custom-id"/>

다음은 프랑스어 번역을 표시합니다.

<docs-code header="src/locale/messages.fr.xlf" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="i18n-duplicate-custom-id"/>

이제 두 요소는 동일한 번역 (`Bonjour`) 을 사용합니다. 두 요소 모두 동일한 맞춤 ID로 정의되었기 때문입니다.

<docs-code path="adev/src/content/examples/i18n/doc-files/rendered-output.html"/>

[ApiLocalizeInitLocalize]: api/localize/init/$localize "$localize | init - localize - API | Angular"

[GuideI18nCommonPrepareHowMeaningsControlTextExtractionAndMerges]: guide/i18n/prepare#h1-example "의미가 텍스트 추출 및 병합을 제어하는 방법 - 번역을 위해 구성 요소 준비 | Angular"