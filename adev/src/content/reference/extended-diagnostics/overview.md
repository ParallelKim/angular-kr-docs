# 확장 진단

컴파일러나 런타임에 기술적으로 유효하지만 복잡한 뉘앙스나 주의 사항이 있는 많은 코딩 패턴이 있습니다.  
이러한 패턴은 개발자가 기대하는 의도된 효과를 내지 못할 수 있으며, 이로 인해 버그가 발생하는 경우가 많습니다.  
Angular 컴파일러는 이러한 패턴의 많은 부분을 식별하여 개발자에게 잠재적인 문제를 경고하고 코드베이스 내에서 일반적인 모범 사례를 강제하기 위해 "확장 진단"을 포함하고 있습니다.

## 진단

현재 Angular는 다음과 같은 확장 진단을 지원합니다:

| 코드     | 이름                                                              |
| :------- | :---------------------------------------------------------------- |
| `NG8101` | [`invalidBananaInBox`](extended-diagnostics/NG8101)               |
| `NG8102` | [`nullishCoalescingNotNullable`](extended-diagnostics/NG8102)     |
| `NG8103` | [`missingControlFlowDirective`](extended-diagnostics/NG8103)      |
| `NG8104` | [`textAttributeNotBinding`](extended-diagnostics/NG8104)          |
| `NG8105` | [`missingNgForOfLet`](extended-diagnostics/NG8105)                |
| `NG8106` | [`suffixNotSupported`](extended-diagnostics/NG8106)               |
| `NG8107` | [`optionalChainNotNullable`](extended-diagnostics/NG8107)         |
| `NG8108` | [`skipHydrationNotStatic`](extended-diagnostics/NG8108)           |
| `NG8109` | [`interpolatedSignalNotInvoked`](extended-diagnostics/NG8109)     |
| `NG8111` | [`uninvokedFunctionInEventBinding`](extended-diagnostics/NG8111)  |
| `NG8113` | [`unusedStandaloneImports`](extended-diagnostics/NG8113)          |
| `NG8114` | [`unparenthesizedNullishCoalescing`](extended-diagnostics/NG8114) |

## 구성

확장 진단은 기본적으로 경고이며 컴파일을 차단하지 않습니다.  
각 진단은 다음 중 하나로 구성할 수 있습니다:

| 오류 카테고리 | 효과                                                                                                                                                                    |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `warning`      | 기본값 - 컴파일러는 진단을 경고로 출력하지만 컴파일을 차단하지 않습니다. 경고가 발생하더라도 컴파일러는 여전히 상태 코드 0으로 존재합니다.                                   |
| `error`        | 컴파일러는 진단을 오류로 출력하고 컴파일에 실패합니다. 하나 이상의 오류가 발생하면 컴파일러는 비제로 상태 코드로 종료됩니다.                                    |
| `suppress`     | 컴파일러는 진단을 전혀 출력하지 않습니다.                                                                                                                              |

점검의 심각도는 [Angular 컴파일러 옵션](reference/configs/angular-compiler-options)으로 구성할 수 있습니다:

<docs-code language="json">
{
  "angularCompilerOptions": {
    "extendedDiagnostics": {
      // 특정 진단에 사용할 카테고리입니다.
      "checks": {
        // 점검 이름을 해당 카테고리에 매핑합니다.
        "invalidBananaInBox": "suppress"
      },

      // 위의 `checks`에 나열되지 않은 진단에 사용할 카테고리입니다.
      "defaultCategory": "error"
    }
  }
}
</docs-code>

`checks` 필드는 개별 진단의 이름을 해당 카테고리에 매핑합니다.  
자세한 확장 진단 및 구성에 사용할 이름의 전체 목록은 [진단](#진단)을 참조하십시오.

`defaultCategory` 필드는 `checks` 아래에 명시적으로 나열되지 않은 진단에 사용됩니다.  
설정되지 않은 경우, 이러한 진단은 `warning`으로 간주됩니다.

확장 진단은 [`strictTemplates`](tools/cli/template-typecheck#strict-mode)가 활성화되면 발생합니다.  
이는 컴파일러가 Angular 템플릿 유형을 더 잘 이해하고 정확하고 의미 있는 진단을 제공하기 위해 필요합니다.

## 의미 있는 버전 관리

Angular 팀은 Angular의 **마이너** 버전에 새 확장 진단을 추가하거나 활성화할 계획입니다 (자세한 내용은 [semver](https://docs.npmjs.com/about-semantic-versioning) 참조).  
이는 Angular를 업그레이드하면 기존 코드베이스에 새로운 경고가 표시될 수 있음을 의미합니다.  
이는 팀이 기능을 더 빠르게 제공하고 확장 진단을 개발자에게 더 쉽게 접근할 수 있도록 만듭니다.

그러나 `"defaultCategory": "error"`로 설정하면 이러한 경고가 심각한 오류로 승격됩니다.  
이로 인해 마이너 버전 업그레이드가 컴파일 오류를 도입할 수 있으며, 이는 semver 비준수의 브레이킹 변경으로 간주될 수 있습니다.  
새로운 진단은 위의 [구성](#구성)을 통해 숨기거나 경고로 낮출 수 있으므로 새로운 진단의 영향은 기본적으로 확장 진단을 오류로 처리하는 프로젝트에는 최소한이 될 것입니다.  
기본값을 오류로 설정하는 것은 매우 강력한 도구입니다. `error`가 귀하의 프로젝트에 적합한 기본값인지 결정할 때 이 semver 경고 사항을 인식하십시오.

## 새로운 진단

Angular 팀은 추가할 수 있는 새로운 진단에 대한 제안을 항상 열어두고 있습니다.  
확장 진단은 일반적으로 다음을 수행해야 합니다:

- Angular 템플릿에서 흔히 발생하는 비직관적인 개발자 실수를 감지합니다.
- 이 패턴이 버그나 원치 않는 동작으로 이어질 수 있는 이유를 명확하게 설명합니다.
- 하나 이상의 명확한 해결책을 제안합니다.
- 낮거나 바람직하게는 제로의 오탐률을 가집니다.
- 대부분의 Angular 애플리케이션에 적용됩니다 (비공식 라이브러리에 특정하지 않음).
- 프로그램의 정확성이나 성능을 향상시킵니다 (스타일이 아니라, 그 책임은 린터에게 있습니다).

이 기준에 맞는 확장 진단에 대한 아이디어가 있다면 [기능 요청](https://github.com/angular/angular/issues/new?template=2-feature-request.yaml)을 제출하는 것을 고려해 보십시오.