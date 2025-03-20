# 파이프로 데이터 포매팅하기

파이프를 구성하여 활용할 수 있는 방법을 더욱 발전시킬 수 있습니다. 파이프는 옵션을 전달하여 구성할 수 있습니다.

이번 활동에서는 몇 가지 파이프와 파이프 매개변수를 사용하게 됩니다.

<hr>

파이프에 매개변수를 전달하려면 `:` 구문을 사용하고 그 뒤에 매개변수 값을 적습니다. 예를 들어:

```ts
template: `{{ date | date:'medium' }}`;
```

출력값은 `2015년 6월 15일 오후 9:43:11` 입니다.

이제 일부 파이프 출력을 사용자 정의해보겠습니다:

<docs-workflow>

<docs-step title="DecimalPipe로 숫자 포맷하기">

`app.component.ts`에서 `decimal` 파이프에 대한 매개변수를 포함하도록 템플릿을 업데이트합니다.

<docs-code language="ts" highlight="[3]">
template: `
    ...
    <li>Decimal로 포맷된 숫자 {{ num | number:"3.2-2" }}</li>
`
</docs-code>

참고: 그 포맷은 무엇인가요? `DecimalPipe`의 매개변수는 `digitsInfo`라고 불리며, 이 매개변수는 다음 형식을 사용합니다: `{minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}`

</docs-step>

<docs-step title="DatePipe로 날짜 포맷하기">

이제 템플릿을 업데이트하여 `date` 파이프를 사용합니다.

<docs-code language="ts" highlight="[3]">
template: `
    ...
    <li>Date로 포맷된 날짜 {{ birthday | date: 'medium' }}</li>
`
</docs-code>

추가 재미를 위해 `date`에 대한 다양한 매개변수를 시도해보세요. 더 많은 정보는 [Angular 문서](guide/templates/pipes)에서 찾을 수 있습니다.

</docs-step>

<docs-step title="CurrencyPipe로 통화 포맷하기">

마지막 작업으로, 템플릿을 업데이트하여 `currency` 파이프를 사용합니다.

<docs-code language="ts" highlight="[3]">
template: `
    ...
    <li>Currency로 포맷된 통화 {{ cost | currency }}</li>
`
</docs-code>

`currency`에 대한 다양한 매개변수를 시도해볼 수도 있습니다. 더 많은 정보는 [Angular 문서](guide/templates/pipes)에서 찾을 수 있습니다.

</docs-step>

</docs-workflow>

파이프 작업을 잘 해주셨습니다. 지금까지 훌륭한 진전을 이루었습니다.

응용 프로그램에서 사용할 수 있는 더 많은 내장 파이프가 있습니다. 목록은 [Angular 문서](guide/templates/pipes)에서 찾을 수 있습니다.

내장 파이프가 필요를 충족하지 않는 경우, 사용자 정의 파이프를 생성할 수도 있습니다. 다음 레슨에서 더 많은 정보를 확인해보세요.