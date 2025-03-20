# 사용하지 않는 임포트 정리

버전 19부터 Angular는 컴포넌트의 `imports` 배열에 템플릿에서 사용되지 않는 기호가 포함되어 있을 때 경고합니다.

이 스키마를 실행하면 프로젝트 내의 모든 사용하지 않는 임포트를 정리합니다.

다음 명령어를 사용하여 스키마를 실행하세요:

<docs-code language="shell">

ng generate @angular/core:cleanup-unused-imports

</docs-code>

#### 이전

<docs-code language="typescript">
import { Component } from '@angular/core';
import { UnusedDirective } from './unused';

@Component({
  template: 'Hello',
  imports: [UnusedDirective],
})
export class MyComp {}
</docs-code>

#### 이후

<docs-code language="typescript">
import { Component } from '@angular/core';

@Component({
  template: 'Hello',
  imports: [],
})
export class MyComp {}
</docs-code>