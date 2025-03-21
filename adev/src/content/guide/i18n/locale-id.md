# ID로 로케일 참조

Angular는 Unicode *로케일 식별자* \(Unicode locale ID\)를 사용하여 텍스트 문자열의 국제화를 위한 올바른 로케일 데이터를 찾습니다.

<docs-callout title="Unicode 로케일 ID">

* 로케일 ID는 [Unicode Common Locale Data Repository (CLDR) 코어 사양][UnicodeCldrDevelopmentCoreSpecification]에 부합합니다.
    로케일 ID에 대한 자세한 내용은 [Unicode 언어 및 로케일 식별자][UnicodeCldrDevelopmentCoreSpecificationLocaleIDs]를 참조하세요.

* CLDR와 Angular는 로케일 ID의 기반으로 [BCP 47 태그][RfcEditorInfoBcp47]를 사용합니다.

</docs-callout>

로케일 ID는 언어, 국가 및 추가 변형이나 세분화를 위한 선택적 코드를 지정합니다.
로케일 ID는 언어 식별자, 하이픈 \(`-`\) 문자, 및 로케일 확장자로 구성됩니다.

<docs-code language="html">
{language_id}-{locale_extension}
</docs-code>

유용한 정보: Angular 프로젝트를 정확하게 번역하려면 국제화의 대상이 되는 언어와 로케일을 결정해야 합니다.

많은 국가가 같은 언어를 사용하지만 사용법이 다릅니다.
차이점에는 문법, 구두점, 통화, 소수점 숫자, 날짜 형식 등이 포함됩니다.

이 가이드의 예시를 위해 다음 언어 및 로케일을 사용하세요.

| 언어     | 로케일                       | Unicode 로케일 ID |
|:---      |:---                          |:---               |
| 영어     | 캐나다                       | `en-CA`           |
| 영어     | 미국                         | `en-US`           |
| 프랑스어  | 캐나다                       | `fr-CA`           |
| 프랑스어  | 프랑스                       | `fr-FR`           |

[Angular 저장소][GithubAngularAngularTreeMasterPackagesCommonLocales]에는 일반 로케일이 포함되어 있습니다.

<docs-callout>
언어 코드 목록은 [ISO 639-2](https://www.loc.gov/standards/iso639-2)를 참조하세요.
</docs-callout>

## 소스 로케일 ID 설정

Angular CLI를 사용하여 컴포넌트 템플릿 및 코드 작성에 사용할 소스 언어를 설정합니다.

기본적으로 Angular는 프로젝트의 소스 로케일로 `en-US`를 사용합니다.

프로젝트의 빌드를 위한 소스 로케일을 변경하려면 다음 작업을 완료하세요.

1. [`angular.json`][GuideWorkspaceConfig] 작업공간 빌드 구성 파일을 엽니다.
2. `i18n` 섹션 내에서 `sourceLocale` 필드를 추가하거나 수정합니다:
```json
{
  "projects": {
    "your-project": {
      "i18n": {
        "sourceLocale": "ca"  // 원하는 로케일 코드를 사용하세요
      }
    }
  }
}
```

## 다음은 무엇인가요

<docs-pill-row>
  <docs-pill href="guide/i18n/format-data-locale" title="로케일에 따라 데이터 형식화하기"/>
</docs-pill-row>

[GuideWorkspaceConfig]: reference/configs/workspace-config "Angular 작업공간 구성 | Angular"

[GithubAngularAngularTreeMasterPackagesCommonLocales]: <https://github.com/angular/angular/tree/main/packages/common/locales> "angular/packages/common/locales | angular/angular | GitHub"

[RfcEditorInfoBcp47]: https://www.rfc-editor.org/info/bcp47 "BCP 47 | RFC Editor"

[UnicodeCldrDevelopmentCoreSpecification]: https://cldr.unicode.org/index/cldr-spec "코어 사양 | Unicode CLDR Project"

[UnicodeCldrDevelopmentCoreSpecificationLocaleID]: https://cldr.unicode.org/index/cldr-spec/picking-the-right-language-code "Unicode 언어 및 로케일 식별자 - 코어 사양 | Unicode CLDR Project"