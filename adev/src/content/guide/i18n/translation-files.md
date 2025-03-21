# 번역 파일 작업

번역할 구성 요소를 준비한 후, [`extract-i18n`][CliExtractI18n] [Angular CLI][CliMain] 명령을 사용하여 구성 요소에서 표시된 텍스트를 *소스 언어* 파일로 추출합니다.

표시된 텍스트에는 `i18n`로 표시된 텍스트, `i18n-`*속성*으로 표시된 속성 및 [번역을 위한 구성 요소 준비][GuideI18nCommonPrepare]에 설명된 대로 `$localize` 태그가 있는 텍스트가 포함됩니다.

프로젝트의 번역 파일을 생성하고 업데이트하려면 다음 단계를 완료하십시오.

1. [소스 언어 파일 추출][GuideI18nCommonTranslationFilesExtractTheSourceLanguageFile].
    1. 선택적으로 위치, 형식 및 이름을 변경합니다.
1. 각 언어에 대한 번역 파일을 생성하기 위해 소스 언어 파일을 복사합니다. [각 언어에 대한 번역 파일 생성][GuideI18nCommonTranslationFilesCreateATranslationFileForEachLanguage].
1. [각 번역 파일 번역][GuideI18nCommonTranslationFilesTranslateEachTranslationFile].
1. 복수 형태와 대체 표현을 별도로 번역합니다.
    1. [복수 형태 번역][GuideI18nCommonTranslationFilesTranslatePlurals].
    1. [대체 표현 번역][GuideI18nCommonTranslationFilesTranslateAlternateExpressions].
    1. [중첩 표현 번역][GuideI18nCommonTranslationFilesTranslateNestedExpressions].

## 소스 언어 파일 추출

소스 언어 파일을 추출하려면 다음 작업을 완료하십시오.

1. 터미널 창을 엽니다.
1. 프로젝트의 루트 디렉토리로 변경합니다.
1. 다음 CLI 명령을 실행합니다.

    <docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="extract-i18n-default"/>

`extract-i18n` 명령은 프로젝트의 루트 디렉토리에 `messages.xlf`라는 이름의 소스 언어 파일을 생성합니다.
XML 로컬라이제이션 교환 파일 형식(XLIFF, 버전 1.2)에 대한 자세한 내용은 [XLIFF][WikipediaWikiXliff]를 참조하십시오.

소스 언어 파일의 위치, 형식 및 파일 이름을 변경하려면 다음 [`extract-i18n`][CliExtractI18n] 명령 옵션을 사용하십시오.

| 명령 옵션       | 세부사항                       |
|:---             |:---                           |
| `--format`      | 출력 파일의 형식을 설정합니다.      |
| `--out-file`    | 출력 파일의 이름을 설정합니다.      |
| `--output-path` | 출력 디렉토리의 경로를 설정합니다. |

### 소스 언어 파일 위치 변경

`src/locale` 디렉토리에 파일을 생성하려면 출력 경로를 옵션으로 지정합니다.

#### `extract-i18n --output-path` 예제

다음 예제는 출력 경로를 옵션으로 지정합니다.

<docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="extract-i18n-output-path"/>

### 소스 언어 파일 형식 변경

`extract-i18n` 명령은 다음 번역 형식으로 파일을 생성합니다.

| 번역 형식       | 세부사항                                                                 | 파일 확장자    |
|:---              |:---                                                                       |:---            |
| ARB              | [응용 프로그램 리소스 번들][GithubGoogleAppResourceBundleWikiApplicationresourcebundlespecification] | `.arb`         |
| JSON             | [자바스크립트 객체 표기법][JsonMain]                                       | `.json`        |
| XLIFF 1.2        | [XML 로컬라이제이션 교환 파일 형식, 버전 1.2][OasisOpenDocsXliffXliffCoreXliffCoreHtml] | `.xlf`         |
| XLIFF 2          | [XML 로컬라이제이션 교환 파일 형식, 버전 2][OasisOpenDocsXliffXliffCoreV20Cos01XliffCoreV20Cose01Html] | `.xlf`         |
| XMB              | [XML 메시지 번들][UnicodeCldrDevelopmentDevelopmentProcessDesignProposalsXmb] | `.xmb` \(`.xtb`\) |

`--format` 명령 옵션으로 번역 형식을 명시적으로 지정하십시오.

도움이 되는 정보: XMB 형식은 `.xmb` 소스 언어 파일을 생성하지만 `.xtb` 번역 파일을 사용합니다.

#### `extract-i18n --format` 예제

다음 예제는 여러 번역 형식을 보여줍니다.

<docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="extract-i18n-formats"/>

### 소스 언어 파일 이름 변경

추출 도구에서 생성된 소스 언어 파일의 이름을 변경하려면 `--out-file` 명령 옵션을 사용하십시오.

#### `extract-i18n --out-file` 예제

다음 예제는 출력 파일의 이름을 보여줍니다.

<docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="extract-i18n-out-file"/>

## 각 언어에 대한 번역 파일 생성

로캘 또는 언어에 대한 번역 파일을 생성하려면 다음 작업을 완료하십시오.

1. [소스 언어 파일 추출][GuideI18nCommonTranslationFilesExtractTheSourceLanguageFile].
1. 각 언어에 대한 *번역* 파일을 생성하기 위해 소스 언어 파일을 복사합니다.
1. 로캘을 추가하기 위해 *번역* 파일의 이름을 바꿉니다.

    <docs-code language="file">

    messages.xlf --> messages.{locale}.xlf

    </docs-code>

1. 프로젝트 루트에 `locale`이라는 새 디렉토리를 생성합니다.

    <docs-code language="file">

    src/locale

    </docs-code>

1. *번역* 파일을 새 디렉토리로 이동합니다.
1. *번역* 파일을 번역자에게 보냅니다.
1. 애플리케이션에 추가할 각 언어에 대해 위 단계를 반복합니다.

### 프랑스어에 대한 `extract-i18n` 예제

예를 들어 프랑스어 번역 파일을 생성하려면 다음 작업을 완료하십시오.

1. `extract-i18n` 명령을 실행합니다.
1. `messages.xlf` 소스 언어 파일을 복사합니다.
1. 복사본의 이름을 프랑스어 \(`fr`\) 번역을 위해 `messages.fr.xlf`로 변경합니다.
1. `fr` 번역 파일을 `src/locale` 디렉토리로 이동합니다.
1. `fr` 번역 파일을 번역자에게 보냅니다.

## 각 번역 파일 번역

해당 언어에 능숙하고 번역을 편집할 시간이 없다면 다음 단계를 완료할 가능성이 높습니다.

1. 각 번역 파일을 번역자에게 보냅니다.
1. 번역자는 XLIFF 파일 편집기를 사용하여 다음 작업을 완료합니다.
    1. 번역을 생성합니다.
    1. 번역을 편집합니다.

### 프랑스어 번역 프로세스 예제

프로세스를 보여주기 위해, [예제 Angular 국제화 애플리케이션][GuideI18nExample]의 `messages.fr.xlf` 파일을 검토하십시오. [예제 Angular 국제화 애플리케이션][GuideI18nExample]에는 특별한 XLIFF 편집기 없이 수정할 수 있는 프랑스어 번역이 포함되어 있습니다.

다음 작업은 프랑스어 번역 프로세스를 설명합니다.

1. `messages.fr.xlf`를 열고 첫 번째 `<trans-unit>` 요소를 찾습니다.
    이것은 `i18n` 속성으로 이전에 표시된 `<h1>` 인사 태그의 번역을 나타내는 *번역 단위*입니다.

    <docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translated-hello-before"/>

    `id="introductionHeader"`는 [사용자 정의 ID][GuideI18nOptionalManageMarkedText]이며, 소스 HTML에서 필요한 `@@` 접두사가 없습니다.

1. 텍스트 노드에서 `<source>... </source>` 요소를 복제하고 `target`으로 이름을 바꾼 다음 내용을 프랑스어 텍스트로 대체합니다.

    <docs-code header="src/locale/messages.fr.xlf (<trans-unit>, after translation)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translated-hello"/>

    더 복잡한 번역에서는 [설명 및 의미 요소][GuideI18nCommonPrepareAddHelpfulDescriptionsAndMeanings]에 포함된 정보와 맥락이 올바른 단어 선택에 도움을 줍니다.

1. 다른 텍스트 노드를 번역합니다.
    다음 예제는 번역 방식에 대한 표시입니다.

    <docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translated-other-nodes"/>

중요: 번역 단위의 ID를 변경하지 마십시오.
각 `id` 속성은 Angular에 의해 생성되며 구성 요소 텍스트의 내용과 할당된 의미에 따라 달라집니다.

텍스트 또는 의미를 변경하면 `id` 속성이 변경됩니다.
텍스트 업데이트 및 ID 관리를 위한 자세한 내용은 [사용자 정의 ID][GuideI18nOptionalManageMarkedText]를 참조하십시오.

## 복수형 번역

각 언어에 필요에 따라 복수 형태를 추가하거나 제거합니다.

도움이 되는 정보: 언어 복수 규칙에 대한 내용은 [CLDR 복수 규칙][GithubUnicodeOrgCldrStagingChartsLatestSupplementalLanguagePluralRulesHtml]을 참조하십시오.

### `minute` `plural` 예제

`plural`을 번역하려면 ICU 형식의 일치 값을 번역합니다.

* 지금 막
* 1분 전
* `<x id="INTERPOLATION" equiv-text="{{minutes}}"/> 분 전`

다음 예제는 번역 방식에 대한 표시입니다.

<docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translated-plural"/>

## 대체 표현 번역

Angular는 또한 대체 `select` ICU 표현을 별도의 번역 단위로 추출합니다.

### `gender` `select` 예제

다음 예제는 구성 요소 템플릿에서 `select` ICU 표현을 보여줍니다.

<docs-code header="src/app/app.component.html" path="adev/src/content/examples/i18n/src/app/app.component.html" visibleRegion="i18n-select"/>

이 예에서 Angular는 표현을 두 개의 번역 단위로 추출합니다.
첫 번째 단위에는 `select` 절 외부의 텍스트가 포함되고, `select`에 대한 플레이스홀더가 사용됩니다 \(`<x id="ICU">`\):

<docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translate-select-1"/>

중요: 텍스트를 번역할 때 필요 시 플레이스홀더를 이동하되, 제거하지 마십시오.
플레이스홀더를 제거하면 ICU 표현이 번역된 애플리케이션에서 제거됩니다.

다음 예제는 `select` 절이 포함된 두 번째 번역 단위를 표시합니다.

<docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translate-select-2"/>

다음 예제는 번역이 완료된 후 두 개의 번역 단위를 모두 표시합니다.

<docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translated-select"/>

## 중첩 표현 번역

Angular는 중첩 표현을 대체 표현과 동일하게 처리합니다.
Angular는 표현을 두 개의 번역 단위로 추출합니다.

### 중첩 `plural` 예제

다음 예제는 중첩 표현 외부의 텍스트를 포함하는 첫 번째 번역 단위를 표시합니다.

<docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translate-nested-1"/>

다음 예제는 전체 중첩 표현을 포함하는 두 번째 번역 단위를 표시합니다.

<docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translate-nested-2"/>

다음 예제는 번역한 후 두 개의 번역 단위를 모두 표시합니다.

<docs-code header="src/locale/messages.fr.xlf (<trans-unit>)" path="adev/src/content/examples/i18n/doc-files/messages.fr.xlf.html" visibleRegion="translate-nested"/>

## 다음 단계

<docs-pill-row>
  <docs-pill href="guide/i18n/merge" title="앱에 번역 병합"/>
</docs-pill-row>

[CliMain]: cli "CLI 개요 및 명령 참조 | Angular"
[CliExtractI18n]: cli/extract-i18n "ng extract-i18n | CLI | Angular"

[GuideI18nCommonPrepare]: guide/i18n/prepare "번역을 위한 구성 요소 준비 | Angular"
[GuideI18nCommonPrepareAddHelpfulDescriptionsAndMeanings]: guide/i18n/prepare#add-helpful-descriptions-and-meanings "유용한 설명 및 의미 추가 - 번역을 위한 구성 요소 준비 | Angular"

[GuideI18nCommonTranslationFilesCreateATranslationFileForEachLanguage]: guide/i18n/translation-files#create-a-translation-file-for-each-language "각 언어에 대한 번역 파일 생성 - 번역 파일 작업 | Angular"
[GuideI18nCommonTranslationFilesExtractTheSourceLanguageFile]: guide/i18n/translation-files#extract-the-source-language-file "소스 언어 파일 추출 - 번역 파일 작업 | Angular"
[GuideI18nCommonTranslationFilesTranslateAlternateExpressions]: guide/i18n/translation-files#translate-alternate-expressions "대체 표현 번역 - 번역 파일 작업 | Angular"
[GuideI18nCommonTranslationFilesTranslateEachTranslationFile]: guide/i18n/translation-files#translate-each-translation-file "각 번역 파일 번역 - 번역 파일 작업 | Angular"
[GuideI18nCommonTranslationFilesTranslateNestedExpressions]: guide/i18n/translation-files#translate-nested-expressions "중첩 표현 번역 - 번역 파일 작업 | Angular"
[GuideI18nCommonTranslationFilesTranslatePlurals]: guide/i18n/translation-files#translate-plurals "복수형 번역 - 번역 파일 작업 | Angular"

[GuideI18nExample]: guide/i18n/example "예제 Angular 국제화 애플리케이션 | Angular"

[GuideI18nOptionalManageMarkedText]: guide/i18n/manage-marked-text "사용자 정의 ID로 표시된 텍스트 관리 | Angular"

[GithubGoogleAppResourceBundleWikiApplicationresourcebundlespecification]: https://github.com/google/app-resource-bundle/wiki/ApplicationResourceBundleSpecification "응용 프로그램 리소스 번들 사양 | google/app-resource-bundle | GitHub"

[GithubUnicodeOrgCldrStagingChartsLatestSupplementalLanguagePluralRulesHtml]: https://cldr.unicode.org/index/cldr-spec/plural-rules "언어 복수 규칙 - CLDR 차트 | Unicode | GitHub"

[JsonMain]: https://www.json.org "JSON 소개 | JSON"

[OasisOpenDocsXliffXliffCoreXliffCoreHtml]: http://docs.oasis-open.org/xliff/xliff-core/xliff-core.html "XLIFF 버전 1.2 사양 | Oasis Open Docs"
[OasisOpenDocsXliffXliffCoreV20Cos01XliffCoreV20Cose01Html]: http://docs.oasis-open.org/xliff/xliff-core/v2.0/cos01/xliff-core-v2.0-cos01.html "XLIFF 버전 2.0 | Oasis Open Docs"

[UnicodeCldrDevelopmentDevelopmentProcessDesignProposalsXmb]: http://cldr.unicode.org/development/development-process/design-proposals/xmb "XMB | CLDR - Unicode 공통 로캘 데이터 저장소 | Unicode"

[WikipediaWikiXliff]: https://en.wikipedia.org/wiki/XLIFF "XLIFF | Wikipedia"