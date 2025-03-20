# 지연 트리거

`@defer`의 기본 옵션은 구성 요소의 일부를 지연 로드하는 데 유용하지만, 지연 로드 경험을 더욱 사용자 정의하는 것이 바람직할 수 있습니다.

기본적으로 지연된 콘텐츠는 브라우저가 유휴 상태일 때 로드됩니다. 그러나 **트리거**를 지정하여 이 로드 시점을 사용자 정의할 수 있습니다. 이렇게 하면 구성 요소에 가장 적합한 로드 동작을 선택할 수 있습니다.

지연 가능한 뷰는 두 가지 유형의 로드 트리거를 제공합니다:

<div class="docs-table docs-scroll-track-transparent">
  <table>
    <tr>
      <td><code>on</code></td>
      <td>
        내장 트리거 목록에서 트리거를 사용하는 트리거 조건입니다.<br/>
        예: <code>@defer (on viewport)</code>
      </td>
    </tr>
    <tr>
      <td><code>when</code></td>
      <td>
        진리값을 평가하는 표현식으로서의 조건입니다. 표현식이 참일 때 플레이스홀더는 지연 로드된 콘텐츠로 교체됩니다.<br/>
        예: <code>@defer (when customizedCondition)</code>
      </td>
    </tr>
  </table>
</div>

`when` 조건이 `false`로 평가되면 `defer` 블록은 플레이스홀더로 되돌아가지 않습니다. 교체는 일회성 작업입니다.

한 번에 여러 이벤트 트리거를 정의할 수 있으며, 이러한 트리거는 OR 조건으로 평가됩니다.

* 예: `@defer (on viewport; on timer(2s))`
* 예: `@defer (on viewport; when customizedCondition)`

이번 활동에서는 트리거를 사용하여 지연 가능한 뷰를 로드할 조건을 지정하는 방법을 배웁니다.

<hr>

<docs-workflow>

<docs-step title="‘on hover’ 트리거 추가">
`app.component.ts`에서 `@defer` 블록에 `on hover` 트리거를 추가합니다.

<docs-code language="angular-html" hightlight="[1]">
@defer (on hover) {
  <article-comments />
} @placeholder (minimum 1s) {
  <p>댓글 플레이스홀더</p>
} @loading (minimum 1s; after 500ms) {
  <p>댓글 로딩 중...</p>
} @error {
  <p>댓글 로드 실패</p>
}
</docs-code>

이제 페이지는 플레이스홀더에 마우스를 올릴 때까지 댓글 섹션을 렌더링하지 않습니다.
</docs-step>

<docs-step title="‘모든 댓글 보기’ 버튼 추가">
다음으로, "모든 댓글 보기"라는 레이블이 있는 버튼을 포함하도록 템플릿을 업데이트합니다. 버튼과 함께 `#showComments`라는 템플릿 변수를 포함합니다.

<docs-code language="angular-html" hightlight="[1]">
<button type="button" #showComments>모든 댓글 보기</button>

@defer (on hover) {
  <article-comments />
} @placeholder (minimum 1s) {
  <p>댓글 플레이스홀더</p>
} @loading (minimum 1s; after 500ms) {
  <p>댓글 로딩 중...</p>
} @error {
  <p>댓글 로드 실패</p>
}
</docs-code>

참고: [템플릿 변수에 대한 더 많은 정보는 문서를 확인하세요](https://angular.dev/guide/templates/reference-variables#).

</docs-step>

<docs-step title="‘on interaction’ 트리거 추가">
템플릿의 `@defer` 블록을 업데이트하여 `on interaction` 트리거를 사용합니다. `interaction`에 대한 매개변수로 `showComments` 템플릿 변수를 제공합니다.

<docs-code language="angular-html" hightlight="[3]">
<button type="button" #showComments>모든 댓글 보기</button>

@defer (on hover; on interaction(showComments)) {
  <article-comments />
} @placeholder (minimum 1s) {
  <p>댓글 플레이스홀더</p>
} @loading (minimum 1s; after 500ms) {
  <p>댓글 로딩 중...</p>
} @error {
  <p>댓글 로드 실패</p>
}
</docs-code>

이러한 변경 사항으로 인해 페이지는 댓글 섹션을 렌더링하기 전에 다음 조건 중 하나를 기다립니다:
* 사용자가 댓글 섹션의 플레이스홀더에 마우스를 올림
* 사용자가 "모든 댓글 보기" 버튼을 클릭함

페이지를 새로 고쳐서 댓글 섹션을 렌더링하기 위한 다양한 트리거를 시도해 볼 수 있습니다.
</docs-step>
</docs-workflow>

더 알아보려면 [지연 가능한 뷰](https://angular.dev/guide/defer)에 대한 문서를 확인하세요.
Angular의 훌륭한 기능을 더 많이 잠금 해제하려면 계속 배우세요.