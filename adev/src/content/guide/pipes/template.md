# 템플릿에서 파이프 사용하기

파이프를 적용하려면, 다음 코드 예제와 같이 템플릿 표현식 내에서 파이프 연산자(`|`)를 사용합니다.

<docs-code language="angular-html" header="app.component.html">
<p>영웅의 생일은 {{ birthday | date }}</p>
</docs-code>

컴포넌트의 `birthday` 값은 파이프 연산자(`|`)를 통해 [`DatePipe`](api/common/DatePipe)로 전달되며, 그 파이프 이름은 `date`입니다.
파이프는 날짜를 기본 형식으로 **2023년 4월 07일**과 같이 렌더링합니다.

<docs-code header="app.component.ts" preview>
import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  templateUrl: './app.component.html',
  imports: [DatePipe],
})
export class AppComponent {
  birthday = new Date();
}
</docs-code>

## 파이프에 대한 추가 매개변수

파이프는 변환을 구성하는 추가 매개변수를 받을 수 있습니다. 매개변수는 선택적일 수도 있고 필수일 수도 있습니다.

예를 들어, `date` 파이프는 날짜의 표시 형식을 제어하는 선택적 매개변수를 받습니다.
매개변수를 지정하려면, 파이프 이름 뒤에 콜론(`:`)과 매개변수 값(형식)을 따릅니다.

<docs-code language="angular-html" header="app.component.html">
<p>영웅의 생일은 {{ birthday | date:'yyyy' }}</p>
</docs-code>

파이프는 또한 여러 매개변수를 받을 수 있습니다. 매개변수를 콜론(`:`)으로 구분하여 여러 매개변수를 전달할 수 있습니다.
예를 들어, `date` 파이프는 시간대를 제어하기 위한 두 번째 선택적 매개변수를 허용합니다.

<docs-code header="app.component.html">
<p>현재 시간은: {{ currentTime | date:'hh:mm':'UTC' }}</p>
</docs-code>

이 코드는 `UTC` 시간대에서 현재 시간(예: `10:53`)을 표시합니다.

## 파이프 연결하기

여러 파이프를 연결하여 한 파이프의 출력이 다음 파이프의 입력이 되도록 할 수 있습니다.

다음 예제는 날짜를 `DatePipe`로 전달하고 결과를 [`UpperCasePipe`](api/common/UpperCasePipe 'API reference') 파이프로 전달합니다.

<docs-code language="angular-html" header="app.component.html">
<p>영웅의 생일은 {{ birthday | date }}</p>
<p>영웅의 생일은 {{ birthday | date:'yyyy' | uppercase }}</p>
</docs-code>