# 번역을 위한 구성 요소 준비

프로젝트를 번역할 준비를 하려면 다음 작업을 완료하십시오.

- `i18n` 속성을 사용하여 구성 요소 템플릿에서 텍스트를 표시합니다.
- `i18n-` 속성을 사용하여 구성 요소 템플릿에서 속성 텍스트 문자열을 표시합니다.
- `$localize` 태그가 있는 메시지 문자열을 사용하여 구성 요소 코드에서 텍스트 문자열을 표시합니다.

## 구성 요소 템플릿에서 텍스트 표시

구성 요소 템플릿에서는 i18n 메타데이터가 `i18n` 속성의 값입니다.

<docs-code language="html">
<element i18n="{i18n_metadata}">{string_to_translate}</element>
</docs-code>

구성 요소 템플릿에서 번역을 위한 정적 텍스트 메시지를 표시하기 위해 `i18n` 속성을 사용하십시오. 
번역하려는 고정 텍스트가 포함된 모든 요소 태그에 배치하십시오.

도움말: `i18n` 속성은 Angular 도구 및 컴파일러가 인식하는 사용자 지정 속성입니다.

### `i18n` 예시

다음 `<h1>` 태그는 간단한 영어 인사말 "Hello i18n!"을 표시합니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="greeting"/>

인사말을 번역할 수 있도록 하려면 `<h1>` 태그에 `i18n` 속성을 추가하십시오.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="i18n-attribute"/>


### `i18n`와 조건문 사용

다음 `<div>` 태그는 토글 상태에 따라 `div` 및 `aria-label`의 일부로 번역된 텍스트를 표시합니다.

<docs-code-multifile>
    <docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/src/app/app.component.html"  visibleRegion="i18n-conditional"/>
    <docs-code header="src/app/app.component.ts" path="adev/src/content/examples/i18n/src/app/app.component.ts" visibleLines="[[14,21],[33,37]]"/>
</docs-code-multifile>

### HTML 요소 없이 인라인 텍스트 번역

특정 텍스트에 대한 번역 동작을 연관시키기 위해 `<ng-container>` 요소를 사용하되, 텍스트 표시 방식을 변경하지 마십시오.

도움말: 각 HTML 요소는 새로운 DOM 요소를 생성합니다. 
새로운 DOM 요소 생성 방지를 위해 `<ng-container>` 요소 안에 텍스트를 감싸세요. 
다음 예시는 `<ng-container>` 요소가 표시되지 않는 HTML 주석으로 변환된 예를 보여줍니다.

<docs-code path="adev/src/content/examples/i18n/src/app/app.component.html" visibleRegion="i18n-ng-container"/>

## 번역을 위한 요소 속성 표시

구성 요소 템플릿에서는 i18n 메타데이터가 `i18n-{attribute_name}` 속성의 값입니다.

<docs-code language="html">
<element i18n-{attribute_name}="{i18n_metadata}" {attribute_name}="{attribute_value}" />
</docs-code>

HTML 요소의 속성에는 구성 요소 템플릿에서 표시되는 텍스트와 함께 번역되어야 할 텍스트가 포함됩니다.

어떤 요소의 모든 속성과 함께 `i18n-{attribute_name}`을 사용하고 `{attribute_name}`을 속성 이름으로 교체하십시오. 
의미, 설명 및 사용자 지정 ID를 할당하는 다음 구문을 사용하십시오.

<!--todo: replace with docs-code -->

<docs-code language="html">
i18n-{attribute_name}="{meaning}|{description}@@{id}"
</docs-code>

### `i18n-title` 예시

이미지의 제목을 번역하려면 이 예시를 참고하십시오. 
다음 예시는 `title` 속성이 있는 이미지를 표시합니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="i18n-title"/>

제목 속성을 번역을 위해 표시하려면 다음 작업을 수행하십시오.

1. `i18n-title` 속성 추가

   다음 예시는 `i18n-title`을 추가하여 `img` 태그의 `title` 속성을 표시하는 방법을 보여줍니다.

   <docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/src/app/app.component.html" visibleRegion="i18n-title-translate"/>

## 구성 요소 코드에서 텍스트 표시

구성 요소 코드에서 번역 원본 텍스트와 메타데이터는 백틱 \(<code>&#96;</code>\) 문자로 둘러싸여 있습니다.

번역을 위해 코드에서 문자열을 표시하려면 [`$localize`][ApiLocalizeInitLocalize] 태그가 있는 메시지 문자열을 사용하십시오.

<!--todo: replace with docs-code -->

<docs-code language="typescript">
$localize`string_to_translate`;
</docs-code>

i18n 메타데이터는 콜론 \(`:`\) 문자로 둘러싸여 있으며 번역 원본 텍스트에 추가됩니다.

<!--todo: replace with docs-code -->

<docs-code language="typescript">
$localize`:{i18n_metadata}:string_to_translate`
</docs-code>

### 보간된 텍스트 포함

[`$localize`][ApiLocalizeInitLocalize] 태그가 있는 메시지 문자열에 [보간](guide/templates/binding#render-dynamic-text-with-text-interpolation)을 포함하십시오.

<!--todo: replace with docs-code -->

<docs-code language="typescript">
$localize`string_to_translate ${variable_name}`;
</docs-code>

### 보간 플레이스홀더 명명

<docs-code language="typescript">
$localize`string_to_translate ${variable_name}:placeholder_name:`;
</docs-code>

### 번역을 위한 조건부 구문

<docs-code language="typescript">
return this.show ? $localize`Show Tabs` : $localize`Hide tabs`;
</docs-code>

## 번역을 위한 i18n 메타데이터

<!--todo: replace with docs-code -->

<docs-code language="html">
{meaning}|{description}@@{custom_id}
</docs-code>

다음 매개변수는 번역자를 위한 혼란을 줄이기 위해 문맥과 추가 정보를 제공합니다.

| 메타데이터 매개변수 | 세부 사항                                         |
| :------------------- | :--------------------------------------------------- |
| 사용자 지정 ID      | 사용자 지정 식별자를 제공합니다.                  |
| 설명                | 추가 정보 또는 문맥을 제공합니다.                |
| 의미                | 특정 문맥에서 텍스트의 의미나 의도를 제공합니다. |

사용자 지정 ID에 대한 추가 정보는 [사용자 지정 ID로 표시된 텍스트 관리][GuideI18nOptionalManageMarkedText]를 참조하십시오.

### 유용한 설명 및 의미 추가

텍스트 메시지를 정확하게 번역하려면 번역자를 위한 추가 정보 또는 문맥을 제공합니다.

`i18n` 속성 또는 [`$localize`][ApiLocalizeInitLocalize] 태그가 있는 메시지 문자열의 값으로 텍스트 메시지에 대한 _설명_을 추가합니다.

다음 예시는 `i18n` 속성의 값을 보여줍니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="i18n-attribute-desc"/>

다음 예시는 설명이 있는 [`$localize`][ApiLocalizeInitLocalize] 태그가 있는 메시지 문자열의 값을 보여줍니다.

<!--todo: replace with docs-code -->

<docs-code language="typescript">

$localize`:An introduction header for this sample:Hello i18n!`;

</docs-code>

번역자는 또한 특정 애플리케이션 문맥 내에서 텍스트 메시지의 의미 또는 의도를 알아야 할 수 있으며, 따라서 동일한 의미를 가진 다른 텍스트와 동일한 방식으로 번역할 수 있습니다. 
`i18n` 속성 값을 _의미_로 시작하고 `_설명_`과는 `|` 문자로 구분하십시오: `{meaning}|{description}`.

#### `h1` 예시

예를 들어, `<h1>` 태그가 사이트 제목이라는 것을 명시하여, 헤더로 사용되든 다른 섹션의 텍스트로 참조되든 동일한 방식으로 번역되도록 하고 싶을 수 있습니다.

다음 예시는 `<h1>` 태그가 헤더로 번역되거나 다른 곳에서 참조되어야 함을 명시하는 방법을 보여줍니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/doc-files/app.component.html" visibleRegion="i18n-attribute-meaning"/>

결과는 `site header`로 표시된 모든 텍스트가 _의미_대로 정확하게 번역됩니다.

다음 코드 예시는 의미와 설명이 있는 [`$localize`][ApiLocalizeInitLocalize] 태그가 있는 메시지 문자열의 값을 보여줍니다.

<!--todo: replace with docs-code -->

<docs-code language="typescript">

$localize`:site header|An introduction header for this sample:Hello i18n!`;

</docs-code>

<docs-callout title="의미가 텍스트 추출 및 병합을 제어하는 방법">

Angular 추출 도구는 템플릿의 각 `i18n` 속성에 대한 번역 단위 항목을 생성합니다.
Angular 추출 도구는 각 번역 단위에 의미 및 설명에 기반하여 고유 ID를 할당합니다.

도움말: Angular 추출 도구에 대한 자세한 내용은 [번역 파일 작업하기](guide/i18n/translation-files)를 참조하십시오.

서로 다른 _의미_가 있는 동일한 텍스트 요소는 서로 다른 ID로 추출됩니다. 
예를 들어, "right"라는 단어가 두 개의 다른 위치에서 다음 두 정의를 사용할 경우, 단어는 다르게 번역되며 서로 다른 번역 항목으로 애플리케이션에 병합됩니다.

- `correct`는 "you are right"에서와 같이 
- `direction`은 "turn right"에서와 같이 

동일한 텍스트 요소가 다음 조건을 충족하면 텍스트 요소는 한 번만 추출되고 동일한 ID를 사용합니다.

- 동일한 의미 또는 정의
- 다른 설명

해당 하나의 번역 항목은 동일한 텍스트 요소가 나타나는 모든 곳에서 애플리케이션에 병합됩니다.

</docs-callout>

## ICU 표현식

ICU 표현식은 구성 요소 템플릿에 조건을 충족하는 대체 텍스트를 표시하는 데 도움이 됩니다. 
ICU 표현식에는 구성 요소 속성, ICU 절 및 열린 중괄호 \(`{`\) 및 닫힌 중괄호 \(`}`\) 문자로 둘러싸인 사례 문이 포함됩니다.

<!--todo: replace with docs-code -->

<docs-code language="html">

{ component_property, icu_clause, case_statements }

</docs-code>

구성 요소 속성은 변수를 정의하고, ICU 절은 조건부 텍스트 유형을 정의합니다.

| ICU 절                                                            | 세부 사항                                                    |
| :---------------------------------------------------------------- | :---------------------------------------------------------- |
| [`plural`][GuideI18nCommonPrepareMarkPlurals]                   | 복수 숫자의 사용을 표시합니다.                             |
| [`select`][GuideI18nCommonPrepareMarkAlternatesAndNestedExpressions] | 정의된 문자열 값에 따라 대체 텍스트에 대한 선택을 표시합니다. |

번역을 간소화하려면 정규 표현식과 함께 국제화 구성 요소(ICU 절)를 사용하십시오.

도움말: ICU 절은 [CLDR 복수화 규칙][UnicodeCldrIndexCldrSpecPluralRules]에서 규정한 [ICU 메시지 형식][GithubUnicodeOrgIcuUserguideFormatParseMessages]을 준수합니다.

### 복수 표기

다양한 언어는 번역의 어려움을 증가시키는 다른 복수화 규칙을 가지고 있습니다. 
다른 로케일은 수량을 다르게 표현하므로 영어와 일치하지 않는 복수화 범주를 설정해야 할 수도 있습니다. 
`plural` 절을 사용하여 단어 그대로 번역할 경우 의미가 없을 수 있는 표현을 표시합니다.

<!--todo: replace with docs-code -->

<docs-code language="html">

{ component_property, plural, pluralization_categories }

</docs-code>

복수화 범주 뒤에 기본 텍스트(영어)를 열린 중괄호 \(`{`\)와 닫힌 중괄호 \(`}`\) 문자로 둘러싸서 입력하십시오.

<!--todo: replace with docs-code -->

<docs-code language="html">

pluralization_category { }

</docs-code>

다음 복수화 범주는 영어로 사용 가능하며 로케일에 따라 변경될 수 있습니다.

| 복수화 범주 | 세부 사항                      | 예제                      |
| :----------- | :----------------------------- | :------------------------ |
| `zero`       | 수량이 0                       | `=0 { }` <br /> `zero { }` |
| `one`        | 수량이 1                       | `=1 { }` <br /> `one { }`  |
| `two`        | 수량이 2                       | `=2 { }` <br /> `two { }`  |
| `few`        | 수량이 2개 이상               | `few { }`                 |
| `many`       | 수량이 많음                   | `many { }`                |
| `other`      | 기본 수량                     | `other { }`               |

어떤 복수화 범주도 일치하지 않는 경우, Angular는 `other`을 사용하여 누락된 범주에 대한 표준 폴백을 일치시킵니다.

<!--todo: replace with docs-code -->

<docs-code language="html">

other { default_quantity }

</docs-code>

도움말: 복수화 범주에 대한 자세한 내용은 [복수화 범주 이름 선택][UnicodeCldrIndexCldrSpecPluralRulesTocChoosingPluralCategoryNames]를 CLDR - Unicode 공통 로케일 데이터 리포지토리에서 확인하십시오.

<docs-callout header='배경: 로케일은 일부 복수화 범주를 지원하지 않을 수 있음'>

많은 로케일은 일부 복수화 범주를 지원하지 않습니다. 
기본 로케일(`en-US`)은 `few` 복수화 범주를 지원하지 않는 매우 간단한 `plural()` 함수를 사용합니다. 
다른 간단한 `plural()` 함수를 사용하는 로케일은 `es`입니다. 
다음 코드 예시는 [en-US `plural()`][GithubAngularAngularBlobEcffc3557fe1bff9718c01277498e877ca44588dPackagesCoreSrcI18nLocaleEnTsL14L18] 함수입니다.

<docs-code path="adev/src/content/examples/i18n/doc-files/locale_plural_function.ts" class="no-box" hideCopy/>

`plural()` 함수는 1(`one`) 또는 5(`other`)만 반환합니다. `few` 범주는 절대 일치하지 않습니다.

</docs-callout>

#### `minutes` 예시

`x`가 숫자인 경우 영어에서 다음 문구를 표시하려고 합니다.

<!--todo: replace output docs-code with screen capture image --->

<docs-code language="html">

updated x minutes ago

</docs-code>

그리고 또한 `x`의 수량에 따라 다음 문구를 표시하려고 합니다.

<!--todo: replace output docs-code with screen capture image --->

<docs-code language="html">

updated just now

</docs-code>

<!--todo: replace output docs-code with screen capture image --->

<docs-code language="html">

updated one minute ago

</docs-code>

HTML 마크업 및 [보간](guide/templates/binding#render-dynamic-text-with-text-interpolation)을 사용합니다. 
다음 코드 예시는 세 가지 상황을 `<span>` 요소에서 표현하기 위해 `plural` 절을 사용하는 방법을 보여줍니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/src/app/app.component.html" visibleRegion="i18n-plural"/>

이전 코드 예시에서 다음 세부 사항을 검토하십시오.

| 매개변수            | 세부 사항                                                                             |
| :------------------ | :------------------------------------------------------------------------------------ |
| `minutes`           | 첫 번째 매개변수는 구성 요소 속성이 `minutes`이고 분 수를 결정합니다.                     |
| `plural`            | 두 번째 매개변수는 ICU 절이 `plural`임을 나타냅니다.                                  |
| `=0 {just now}`     | 0 분일 경우, 복수화 범주는 `=0`입니다. 값은 `just now`입니다.                           |
| `=1 {one minute}`   | 1 분일 경우, 복수화 범주는 `=1`입니다. 값은 `one minute`입니다.                         |
| `other {{{minutes}} minutes ago}` | 일치하지 않는 수량의 경우 기본 복수화 범주는 `other`입니다. 값은 `{{minutes}} minutes ago`입니다. |

`{{minutes}}`는 [보간](guide/templates/binding#render-dynamic-text-with-text-interpolation)입니다.

### 대체 및 중첩 표현 표시

`select` 절은 정의된 문자열 값에 따라 대체 텍스트에 대한 선택을 표시합니다.

<!--todo: replace with docs-code -->

<docs-code language="html">

{ component_property, select, selection_categories }

</docs-code>

모든 대체를 번역하여 변수의 값에 따라 대체 텍스트를 표시합니다.

선택 범주 뒤에 열린 중괄호 \(`{`\) 및 닫힌 중괄호 \(`}`\) 문자로 둘러싸인 텍스트(영어)를 입력하십시오.

<!--todo: replace with docs-code -->

<docs-code language="html">

selection_category { text }

</docs-code>

다양한 로케일은 문법 구조가 달라 번역의 어려움을 증가합니다. 
HTML 마크업을 사용하십시오. 
일치하는 선택 범주가 없는 경우, Angular는 `other`를 사용하여 누락된 범주에 대한 표준 폴백을 일치시킵니다.

<!--todo: replace with docs-code -->

<docs-code language="html">

other { default_value }

</docs-code>

#### `gender` 예시

영어에서 다음 문구를 표시하고 싶습니다.

<!--todo: replace output docs-code with screen capture image --->

<docs-code language="html">

The author is other

</docs-code>

그리고 또한 구성 요소의 `gender` 속성을 기반으로 다음 문구를 표시하고 싶습니다.

<!--todo: replace output docs-code with screen capture image --->

<docs-code language="html">

The author is female

</docs-code>

<!--todo: replace output docs-code with screen capture image --->

<docs-code language="html">

The author is male

</docs-code>

다음 코드 예시는 구성 요소의 `gender` 속성을 바인딩하고 `select` 절을 사용하여 이전 세 가지 상황을 `<span>` 요소에서 표현하는 방법을 보여줍니다.

`gender` 속성은 각 다음 문자열 값으로 출력을 바인딩합니다.

| 값    | 영어 값      |
| :----- | :----------------- |
| female | `female`         |
| male   | `male`           |
| other  | `other`          |

`select` 절은 값을 적절한 번역에 매핑합니다. 
다음 코드 예시는 `gender` 속성이 `select` 절과 함께 사용되는 방법을 보여줍니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/src/app/app.component.html" visibleRegion="i18n-select"/>

#### `gender` 및 `minutes` 예시

`plural` 및 `select` 절과 같은 다양한 절을 함께 결합하십시오. 
다음 코드 예시는 `gender` 및 `minutes` 예시에 기반하여 중첩 절을 보여줍니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/src/app/app.component.html" visibleRegion="i18n-nested"/>

## 다음 단계

<docs-pill-row>
  <docs-pill href="guide/i18n/translation-files" title="번역 파일 작업하기"/>
</docs-pill-row>

[ApiLocalizeInitLocalize]: api/localize/init/$localize '$localize | init - localize - API  | Angular'
[GuideI18nCommonPrepareMarkAlternatesAndNestedExpressions]: guide/i18n/prepare#mark-alternates-and-nested-expressions '대체 및 중첩 표현 표시 - 번역을 위한 구성 요소 준비 | Angular'
[GuideI18nCommonPrepareMarkPlurals]: guide/i18n/prepare#mark-plurals '복수 표시 - 번역을 위한 구성 요소 준비 | Angular'
[GuideI18nOptionalManageMarkedText]: guide/i18n/manage-marked-text '사용자 지정 ID로 표시된 텍스트 관리 | Angular'
[GithubAngularAngularBlobEcffc3557fe1bff9718c01277498e877ca44588dPackagesCoreSrcI18nLocaleEnTsL14L18]: https://github.com/angular/angular/blob/ecffc3557fe1bff9718c01277498e877ca44588d/packages/core/src/i18n/locale_en.ts#L14-L18 '14-18라인 - angular/packages/core/src/i18n/locale_en.ts | angular/angular | GitHub'
[GithubUnicodeOrgIcuUserguideFormatParseMessages]: https://unicode-org.github.io/icu/userguide/format_parse/messages 'ICU 메시지 형식 - ICU 문서 | Unicode | GitHub'
[UnicodeCldrMain]: https://cldr.unicode.org 'Unicode CLDR 프로젝트'
[UnicodeCldrIndexCldrSpecPluralRules]: http://cldr.unicode.org/index/cldr-spec/plural-rules '복수 규칙 | CLDR - Unicode 공통 로케일 데이터 리포지토리 | Unicode'
[UnicodeCldrIndexCldrSpecPluralRulesTocChoosingPluralCategoryNames]: http://cldr.unicode.org/index/cldr-spec/plural-rules#TOC-Choosing-Plural-Category-Names '복수화 범주 이름 선택 - 복수 규칙 | CLDR - Unicode 공통 로케일 데이터 리포지토리 | Unicode'