# 애플리케이션에 번역 병합하기

완료된 번역을 프로젝트에 병합하려면 다음 작업을 완료하십시오.

1. [Angular CLI][CliMain]를 사용하여 배포 가능한 파일의 복사본을 빌드합니다.
1. `"localize"` 옵션을 사용하여 모든 i18n 메시지를 유효한 번역으로 교체하고 로컬화된 변형 애플리케이션을 빌드합니다.
    변형 애플리케이션은 단일 로케일을 위해 번역된 애플리케이션의 배포 가능한 파일의 완전한 복사본입니다.

번역을 병합한 후에는 서버 측 언어 감지 또는 서로 다른 하위 디렉터리를 사용하여 애플리케이션의 각 배포 가능한 복사본을 제공하십시오.

유용 정보: 애플리케이션의 각 배포 가능한 복사본을 제공하는 방법에 대한 자세한 정보는 [여러 로케일 배포하기](guide/i18n/deploy)를 참조하십시오.

애플리케이션의 컴파일 타임 번역을 위해 빌드 프로세스는 선행 컴파일(AOT)을 사용하여 작고 빠르며 즉시 실행 가능한 애플리케이션을 생성합니다.

유용 정보: 빌드 프로세스에 대한 자세한 설명은 [Angular 앱 빌드 및 제공하기][GuideBuild]를 참조하십시오.
빌드 프로세스는 `.xlf` 형식의 번역 파일 또는 Angular가 이해하는 다른 형식(예: `.xtb`)의 번역 파일을 처리합니다.
Angular에서 사용하는 번역 파일 형식에 대한 자세한 정보는 [소스 언어 파일 형식 변경하기][GuideI18nCommonTranslationFilesChangeTheSourceLanguageFileFormat]를 참조하십시오.

각 로케일에 대해 애플리케이션의 별도 배포 가능한 복사본을 빌드하려면 [빌드 구성에서 로케일 정의하기][GuideI18nCommonMergeDefineLocalesInTheBuildConfiguration]를 사용하여 프로젝트의 [`angular.json`][GuideWorkspaceConfig] 작업 공간 빌드 구성 파일에서 로케일을 정의하십시오.

이 방법은 각 로케일에 대해 전체 애플리케이션 빌드를 수행할 필요성을 제거하여 빌드 프로세스를 단축시킵니다.

각 로케일에 대해 [애플리케이션 변형 생성하기][GuideI18nCommonMergeGenerateApplicationVariantsForEachLocale]를 사용하려면 [`angular.json`][GuideWorkspaceConfig] 작업 공간 빌드 구성 파일에서 `"localize"` 옵션을 사용하십시오.
또한 [명령줄에서 빌드하기][GuideI18nCommonMergeBuildFromTheCommandLine] 위해 [`build`][CliBuild] [Angular CLI][CliMain] 명령을 `--localize` 옵션과 함께 사용하십시오.

유용 정보: 특정 로케일 구성에 대해 [단일 로케일에 대해 특정 빌드 옵션 적용하기][GuideI18nCommonMergeApplySpecificBuildOptionsForJustOneLocale]를 선택적으로 적용할 수 있습니다.

## 빌드 구성에서 로케일 정의하기

프로젝트의 [`angular.json`][GuideWorkspaceConfig] 작업 공간 빌드 구성 파일에서 `i18n` 프로젝트 옵션을 사용하여 프로젝트의 로케일을 정의하십시오.

다음 하위 옵션은 소스 언어를 식별하고 컴파일러에 대해 프로젝트의 지원되는 번역을 찾는 위치를 알려줍니다.

| 하위 옵션        | 세부사항 |
|:---              |:--- |
| `sourceLocale`   | 애플리케이션 소스 코드 내에서 사용하는 로케일 \(`en-US` 기본값\) |
| `locales`        | 번역 파일에 대한 로케일 식별자의 맵                         |

### `en-US` 및 `fr`의 `angular.json` 예제

예를 들어, 다음은 [`angular.json`][GuideWorkspaceConfig] 작업 공간 빌드 구성 파일의 발췌로, 소스 로케일을 `en-US`로 설정하고 프랑스어 \(`fr`\) 로케일 번역 파일의 경로를 제공합니다.

<docs-code header="angular.json" path="adev/src/content/examples/i18n/angular.json" visibleRegion="locale-config"/>

## 각 로케일에 대한 애플리케이션 변형 생성하기

빌드 구성에서 로케일 정의를 사용하려면 [`angular.json`][GuideWorkspaceConfig] 작업 공간 빌드 구성 파일에서 `"localize"` 옵션을 사용하여 CLI에 대해 빌드 구성에서 생성할 로케일을 지정하십시오.

* `"localize"`를 빌드 구성에서 이전에 정의된 모든 로케일에 대해 `true`로 설정합니다.
* `"localize"`를 이전에 정의된 로케일 식별자의 하위 집합의 배열로 설정하여 해당 로케일 버전만 빌드합니다.
* `"localize"`를 `false`로 설정하여 로컬화를 비활성화하고 로케일 별 버전을 생성하지 않습니다.

유용 정보: 구성 요소 템플릿을 로컬화하려면 선행 컴파일(AOT)이 필요합니다.

이 설정을 변경한 경우 AOT를 사용하려면 `"aot"`를 `true`로 설정하십시오.

유용 정보: i18n의 배포 복잡성과 리빌드 시간을 최소화해야 하기 때문에 개발 서버는 한 번에 단일 로케일만 로컬화하는 것을 지원합니다.
`"localize"` 옵션을 `true`로 설정하고 여러 로케일을 정의하며 `ng serve`를 사용하면 오류가 발생합니다.
특정 로케일에 대해 개발하려면 `"localize"` 옵션을 특정 로케일로 설정하십시오.
예를 들어, 프랑스어 \(`fr`\)의 경우 `"localize": ["fr"]`를 지정하십시오.

CLI는 로케일 데이터를 로드하고 등록하며, 서로 다른 로케일 버전을 분리하여 각 생성된 버전을 로케일 특정 디렉터리에 배치하고, 프로젝트에 대해 구성된 `outputPath` 내의 디렉터리에 넣습니다.
각 애플리케이션 변형에 대해 `html` 요소의 `lang` 속성은 로케일로 설정됩니다.
CLI는 또한 각 애플리케이션 버전의 HTML 기본 HREF를 조정하여 로케일을 구성된 `baseHref`에 추가합니다.

`"localize"` 속성을 공유 구성으로 설정하여 모든 구성에 대해 효과적으로 상속받을 수 있습니다.
또한 속성을 설정하여 다른 구성을 재정의할 수 있습니다.

### 모든 로케일을 포함하는 `angular.json` 빌드 예제

다음 예제는 [`angular.json`][GuideWorkspaceConfig] 작업 공간 빌드 구성 파일에서 `"localize"` 옵션이 `true`로 설정되어 있어 빌드 구성에 정의된 모든 로케일이 빌드됩니다.

<docs-code header="angular.json" path="adev/src/content/examples/i18n/angular.json" visibleRegion="build-localize-true"/>

## 명령줄에서 빌드하기

또한 기존 `production` 구성과 함께 [`ng build`][CliBuild] 명령으로 `--localize` 옵션을 사용하십시오.
CLI는 빌드 구성에서 정의된 모든 로케일을 빌드합니다.
빌드 구성에서 로케일을 설정하면 `"localize"` 옵션을 `true`로 설정한 것과 유사합니다.

유용 정보: 로케일을 설정하는 방법에 대한 자세한 정보는 [각 로케일에 대한 애플리케이션 변형 생성하기][GuideI18nCommonMergeGenerateApplicationVariantsForEachLocale]를 참조하십시오.

<docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="build-localize"/>

## 단일 로케일에 대해 특정 빌드 옵션 적용하기

단일 로케일에 대해 특정 빌드 옵션을 적용하려면 단일 로케일을 지정하여 사용자 정의 로케일 특정 구성을 생성하십시오.

중요: [Angular CLI][CliMain] 개발 서버 \(`ng serve`\)는 단일 로케일에서만 사용하십시오.

### 프랑스어 빌드 예제

다음 예제는 단일 로케일을 사용하여 사용자 정의 로케일 특정 구성의 예를 보여줍니다.

<docs-code header="angular.json" path="adev/src/content/examples/i18n/angular.json" visibleRegion="build-single-locale"/>

이 구성을 `ng serve` 또는 `ng build` 명령에 전달하십시오.
다음 코드 예제는 프랑스어 언어 파일을 제공하는 방법을 보여줍니다.

<docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="serve-french"/>

프로덕션 빌드의 경우, 두 구성을 실행하기 위한 구성 조합을 사용하십시오.

<docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="build-production-french"/>

<docs-code header="angular.json" path="adev/src/content/examples/i18n/angular.json" visibleRegion="build-production-french" />

## 누락된 번역 보고하기

번역이 누락된 경우 빌드는 성공하지만 `Missing translation for message "{translation_text}"`와 같은 경고가 생성됩니다.
Angular 컴파일러가 생성하는 경고의 수준을 구성하려면 다음 수준 중 하나를 지정하십시오.

| 경고 수준     | 세부사항                                             | 출력 |
|:---           |:---                                                 |:---    |
| `error`       | 오류를 발생시키고 빌드에 실패                     | n/a                                                    |
| `ignore`      | 아무 작업도 하지 않음                              | n/a                                                    |
| `warning`     | 콘솔 또는 셸에 기본 경고 표시                     | `Missing translation for message "{translation_text}"` |

`angular.json`[GuideWorkspaceConfig] 작업 공간 빌드 구성 파일의 `build` 대상의 `options` 섹션에서 경고 레벨을 지정하십시오.

### `angular.json` `error` 경고 예제

다음 예제는 경고 수준을 `error`로 설정하는 방법을 보여줍니다.

<docs-code header="angular.json" path="adev/src/content/examples/i18n/angular.json" visibleRegion="missing-translation-error" />

유용 정보: Angular 프로젝트를 Angular 애플리케이션으로 컴파일할 때, `i18n` 속성의 인스턴스가 [`$localize`][ApiLocalizeInitLocalize] 태그 메시지 문자열의 인스턴스로 대체됩니다.
이는 컴파일 후 Angular 애플리케이션이 번역된다는 것을 의미합니다.
또한 이는 각 로케일에 대해 전체 Angular 프로젝트를 다시 컴파일하지 않고도 Angular 애플리케이션의 로컬화된 버전을 만들 수 있다는 것을 의미합니다.

Angular 애플리케이션을 번역할 때 *번역 변환*은 템플릿 리터럴 문자열의 일부(정적 문자열 및 표현)를 번역 컬렉션의 문자열로 대체하고 재정렬합니다.
자세한 내용은 [`$localize`][ApiLocalizeInitLocalize]를 참조하십시오.

TLDR: 한 번 컴파일한 후 각 로케일에 대해 번역하십시오.

## 다음 단계

<docs-pill-row>
  <docs-pill href="guide/i18n/deploy" title="여러 로케일 배포하기"/>
</docs-pill-row>

[ApiLocalizeInitLocalize]: api/localize/init/$localize "$localize | init - localize - API | Angular"

[CliMain]: cli "CLI 개요 및 명령 참조 | Angular"
[CliBuild]: cli/build "ng build | CLI | Angular"

[GuideBuild]: tools/cli/build "Angular 앱 빌드 및 제공하기 | Angular"

[GuideI18nCommonMergeApplySpecificBuildOptionsForJustOneLocale]: guide/i18n/merge#apply-specific-build-options-for-just-one-locale "단일 로케일에 대해 특정 빌드 옵션 적용하기 - 애플리케이션에 번역 병합하기 | Angular"
[GuideI18nCommonMergeBuildFromTheCommandLine]: guide/i18n/merge#build-from-the-command-line "명령줄에서 빌드하기 - 애플리케이션에 번역 병합하기 | Angular"
[GuideI18nCommonMergeDefineLocalesInTheBuildConfiguration]: guide/i18n/merge#define-locales-in-the-build-configuration "빌드 구성에서 로케일 정의하기 - 애플리케이션에 번역 병합하기 | Angular"
[GuideI18nCommonMergeGenerateApplicationVariantsForEachLocale]: guide/i18n/merge#generate-application-variants-for-each-locale "각 로케일에 대한 애플리케이션 변형 생성하기 - 애플리케이션에 번역 병합하기 | Angular"

[GuideI18nCommonTranslationFilesChangeTheSourceLanguageFileFormat]: guide/i18n/translation-files#change-the-source-language-file-format "소스 언어 파일 형식 변경하기 - 번역 파일 작업하기 | Angular"

[GuideWorkspaceConfig]: reference/configs/workspace-config "Angular 작업 공간 구성 | Angular"