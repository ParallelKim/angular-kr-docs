# 지역에 따라 데이터 포맷 지정하기

Angular는 다음과 같은 내장 데이터 변환 [파이프](guide/templates/pipes)를 제공합니다.  
데이터 변환 파이프는 [`LOCALE_ID`][ApiCoreLocaleId] 토큰을 사용하여 각 지역의 규칙에 따라 데이터를 포맷합니다.

| 데이터 변환 파이프                       | 세부 사항                                    |
|:---                                      |:---                                         |
| [`DatePipe`][ApiCommonDatepipe]       | 날짜 값을 포맷합니다.                          |
| [`CurrencyPipe`][ApiCommonCurrencypipe] | 숫자를 통화 문자열로 변환합니다.               |
| [`DecimalPipe`][ApiCommonDecimalpipe] | 숫자를 소수 문자열로 변환합니다.               |
| [`PercentPipe`][ApiCommonPercentpipe] | 숫자를 백분율 문자열로 변환합니다.             |

## 현재 날짜를 표시하기 위해 DatePipe 사용하기

현재 지역의 포맷으로 현재 날짜를 표시하기 위해 `DatePipe`의 다음 포맷을 사용합니다.

<!--todo: replace with docs-code -->

<docs-code language="typescript">

{{ today | date }}

</docs-code>

## CurrencyPipe에 대한 현재 지역 재정의하기

파이프에 `locale` 매개변수를 추가하여 현재 `LOCALE_ID` 토큰의 값을 재정의합니다.

통화를 미국 영어 \(`en-US`\)로 강제 적용하려면 `CurrencyPipe`의 다음 포맷을 사용합니다.

<!--todo: replace with docs-code -->

<docs-code language="typescript">

{{ amount | currency : 'en-US' }}

</docs-code>

도움이 됩니다: `CurrencyPipe`에 지정된 지역은 애플리케이션의 전역 `LOCALE_ID` 토큰을 재정의합니다.

## 다음 단계

<docs-pill-row>
  <docs-pill href="guide/i18n/prepare" title="번역을 위한 컴포넌트 준비하기"/>
</docs-pill-row>

[ApiCommonCurrencypipe]: api/common/CurrencyPipe "CurrencyPipe | Common - API | Angular"

[ApiCommonDatepipe]: api/common/DatePipe "DatePipe | Common - API | Angular"  
[ApiCommonDecimalpipe]: api/common/DecimalPipe "DecimalPipe | Common - API | Angular"  
[ApiCommonPercentpipe]: api/common/PercentPipe "PercentPipe | Common - API | Angular"  
[ApiCoreLocaleId]: api/core/LOCALE_ID "LOCALE_ID | Core - API | Angular"