# Self-closing Tags로의 마이그레이션

Self-closing tags는 [v16](https://blog.angular.dev/angular-v16-is-here-4d7a28ec680d#7065) 이후 Angular 템플릿에서 지원됩니다.

이 스키매틱은 애플리케이션의 템플릿을 Self-closing tags를 사용하도록 마이그레이션합니다.

다음 명령어를 사용하여 스키매틱을 실행하십시오:

<docs-code language="shell">

ng generate @angular/core:self-closing-tag

</docs-code>


#### 이전

<docs-code language="angular-html">

<!-- 이전 -->
<hello-world></hello-world>

<!-- 이후 -->
<hello-world />

</docs-code>