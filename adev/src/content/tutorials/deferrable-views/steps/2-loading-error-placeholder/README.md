# @loading, @error 및 @placeholder 블록

Deferrable views를 사용하면 다양한 로딩 상태에서 보여줄 내용을 정의할 수 있습니다.

<div class="docs-table docs-scroll-track-transparent">
  <table>
    <tr>
      <td><code>@placeholder</code></td>
      <td>
        기본적으로 defer 블록은 트리거되기 전까지 아무 콘텐츠도 렌더링하지 않습니다. <code>@placeholder</code>는 지연된 콘텐츠가 로드되기 전에 보여줄 콘텐츠를 선언하는 선택적 블록입니다. Angular는 로딩이 완료된 후 자리 표시자를 지연된 콘텐츠로 교체합니다. 이 블록은 선택적이지만 Angular 팀에서는 항상 자리 표시자를 포함할 것을 권장합니다.
        <a href="https://angular-kr-docs.web.app/guide/defer#triggers" target="_blank">
          전체 deferable views 문서에서 자세히 알아보기
        </a>
      </td>
    </tr>
    <tr>
      <td><code>@loading</code></td>
      <td>
        이 선택적 블록은 지연된 종속성이 로드되는 동안 보여줄 콘텐츠를 선언할 수 있습니다.
      </td>
    </tr>
    <tr>
      <td><code>@error</code></td>
      <td>
        이 블록은 지연 로딩이 실패했을 때 보여줄 콘텐츠를 선언할 수 있습니다.
      </td>
    </tr>
  </table>
</div>

위의 모든 하위 블록의 내용은 즉시 로드됩니다. 또한 일부 기능은 `@placeholder` 블록이 필요합니다.

이 활동에서는 `@loading`, `@error` 및 `@placeholder` 블록을 사용하여 deferrable views의 상태를 관리하는 방법을 배울 것입니다.

<hr>

<docs-workflow>

<docs-step title="Add `@placeholder` block">
`app.component.ts`에서 `@defer` 블록에 `@placeholder` 블록을 추가합니다.

<docs-code language="angular-html" highlight="[3,4,5]">
@defer {
  <article-comments />
} @placeholder {
  <p>코멘트를 위한 자리 표시자</p>
}
</docs-code>
</docs-step>

<docs-step title="Configure the `@placeholder` block">
`@placeholder` 블록은 이 자리 표시자가 보여져야 하는 `minimum` 시간을 지정하는 선택적 매개변수를 허용합니다. 이 `minimum` 매개변수는 밀리초(ms) 또는 초(s) 단위로 지정됩니다. 이 매개변수는 지연된 종속성이 빠르게 가져올 경우 자리 표시자 콘텐츠의 빠른 깜박임을 방지하기 위해 존재합니다.

<docs-code language="angular-html" highlight="[3,4,5]">
@defer {
  <article-comments />
} @placeholder (minimum 1s) {
  <p>코멘트를 위한 자리 표시자</p>
}
</docs-code>
</docs-step>

<docs-step title="Add `@loading` block">
다음으로 컴포넌트 템플릿에 `@loading` 블록을 추가합니다.

`@loading` 블록은 두 개의 선택적 매개변수를 허용합니다:

* `minimum`: 이 블록이 보여져야 하는 시간
* `after`: 로딩이 시작된 후 로딩 템플릿을 보여주기 전에 기다릴 시간

두 매개변수는 밀리초(ms) 또는 초(s) 단위로 지정됩니다.

`app.component.ts`를 업데이트하여 `@loading` 블록에 최소 매개변수로 `1s` 및 후 매개변수로 `500ms` 값을 추가합니다.

<docs-code language="angular-html" highlight="[5,6,7]">
@defer {
  <article-comments />
} @placeholder (minimum 1s) {
  <p>코멘트를 위한 자리 표시자</p>
} @loading (minimum 1s; after 500ms) {
  <p>로딩 중인 코멘트...</p>
}
</docs-code>

참고: 이 예제는 ; 문자로 구분된 두 개의 매개변수를 사용합니다.

</docs-step>

<docs-step title="Add `@error` block">
마지막으로 `@defer` 블록에 `@error` 블록을 추가합니다.

<docs-code language="angular-html" highlight="[7,8,9]">
@defer {
  <article-comments />
} @placeholder (minimum 1s) {
  <p>코멘트를 위한 자리 표시자</p>
} @loading (minimum 1s; after 500ms) {
  <p>로딩 중인 코멘트...</p>
} @error {
  <p>코멘트를 로드하는 데 실패했습니다.</p>
}
</docs-code>
</docs-step>
</docs-workflow>

축하합니다! 현재 여러분은 deferrable views에 대해 잘 이해하고 있습니다. 훌륭한 작업을 계속하고 다음에 트리거에 대해 배워봅시다.
