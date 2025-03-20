# 파이프 이해하기

문자열, 통화 금액, 날짜 및 기타 데이터를 표시하기 위해 파이프를 사용하세요.

## 파이프란 무엇인가

파이프는 템플릿에서 입력 값을 받고 변환된 값을 반환하는 간단한 함수입니다. 파이프는 애플리케이션 전역에서 사용할 수 있으므로 각 파이프를 한 번만 선언하면 됩니다.
예를 들어, 날짜를 원시 문자열 형식이 아닌 **1988년 4월 15일**로 표시하기 위해 파이프를 사용할 수 있습니다.

사용할 수 있는 재사용 가능한 변환을 템플릿에 노출하기 위해 자신만의 사용자 정의 파이프를 만들 수 있습니다.

## 내장 파이프

Angular는 국제화(i18n)를 포함한 일반적인 데이터 변환을 위해 내장 파이프를 제공합니다. 이는 데이터 형식을 지정하는 데 로케일 정보를 사용합니다.
다음은 데이터 형식 지정에 일반적으로 사용되는 내장 파이프입니다:

- [`DatePipe`](api/common/DatePipe): 로케일 규칙에 따라 날짜 값을 형식화합니다.
- [`UpperCasePipe`](api/common/UpperCasePipe): 텍스트를 모두 대문자로 변환합니다.
- [`LowerCasePipe`](api/common/LowerCasePipe): 텍스트를 모두 소문자로 변환합니다.
- [`CurrencyPipe`](api/common/CurrencyPipe): 숫자를 로케일 규칙에 따라 형식화된 통화 문자열로 변환합니다.
- [`DecimalPipe`](/api/common/DecimalPipe): 로케일 규칙에 따라 형식화된 소수점이 있는 문자열로 숫자를 변환합니다.
- [`PercentPipe`](api/common/PercentPipe): 숫자를 로케일 규칙에 따라 형식화된 백분율 문자열로 변환합니다.
- [`AsyncPipe`](api/common/AsyncPipe): 옵저버블과 같은 비동기 소스에 구독하고 구독 취소합니다.
- [`JsonPipe`](api/common/JsonPipe): 디버깅을 위해 컴포넌트 객체 속성을 JSON 형식으로 화면에 표시합니다.

참고: 내장 파이프의 전체 목록은 [파이프 API 문서](/api?type=pipe "Pipes API reference summary")를 참조하세요.
국제화(i18n) 작업을 위해 파이프를 사용하는 방법에 대해 알아보려면 [로케일에 따라 데이터 형식 지정](guide/i18n/format-data-locale)을 참고하세요.