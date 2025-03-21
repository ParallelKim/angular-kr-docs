# 지연 가능한 뷰란 무엇인가요?

완전히 렌더링된 Angular 페이지는 다양한 구성 요소, 지시어 및 파이프를 포함할 수 있습니다. 페이지의 특정 부분은 사용자가 즉시 볼 수 있어야 하지만, 나중에 표시될 수 있는 부분도 있을 수 있습니다. Angular의 *지연 가능한 뷰*는 `@defer` 문법을 사용하여 즉시 표시할 필요가 없는 페이지의 부분을 다운로드하는 데 Angular가 기다리도록 지시하여 애플리케이션 속도를 높일 수 있도록 도와줍니다.

이 활동에서는 지연 가능한 뷰를 사용하여 구성 요소 템플릿의 섹션을 지연 로드하는 방법을 배웁니다.

<hr>

<docs-workflow>

<docs-step title="템플릿의 섹션에 `@defer` 블록 추가">
`app.component.ts`에서 `article-comments` 구성 요소를 `@defer` 블록으로 래핑하여 지연 로드하도록 설정하세요.

<docs-code language="angular-html">
@defer {
  <article-comments />
}
</docs-code>

기본적으로 `@defer`는 브라우저가 유휴 상태일 때 `article-comments` 구성 요소를 로드합니다.

브라우저의 개발자 콘솔에서 `article-comments-component` 지연 청크 파일이 별도로 로드되는 것을 볼 수 있습니다(특정 파일 이름은 실행마다 변경될 수 있습니다):

<docs-code language="markdown">
초기 청크 파일  | 이름                       |  원본 크기
chunk-NNSQHFIE.js | -                         | 769.00 kB | 
main.js            | main                      | 229.25 kB | 

지연 청크 파일    | 이름                       |  원본 크기
chunk-T5UYXUSI.js  | article-comments-component |   1.84 kB |
</docs-code>

</docs-step>
</docs-workflow>

훌륭한 작업입니다! 지연 가능한 뷰의 기본을 배웠습니다.