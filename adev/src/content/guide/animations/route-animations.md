# 경로 전환 애니메이션

사용자가 하나의 경로에서 다른 경로로 이동할 때 Angular 라우터는 URL 경로를 관련 구성 요소에 매핑하여 해당 보기를 표시합니다. 이러한 경로 전환에 애니메이션을 적용하면 사용자 경험을 크게 향상시킬 수 있습니다. 라우터는 Chrome/Chromium 브라우저에서 경로 간 이동 시 View Transitions API를 지원합니다.

유용한 정보: 라우터의 기본 View Transitions 통합은 현재 [개발자 미리보기](/reference/releases#developer-preview)에 있습니다. 기본 View Transitions는 비교적 새로운 기능이기도 하므로 일부 브라우저에서 지원이 제한될 수 있습니다.

## View Transitions의 작동 원리

뷰 전환에 사용되는 기본 브라우저 방법은 `document.startViewTransition`입니다. `startViewTransition()`가 호출되면 브라우저는 스크린샷을 포함하여 페이지의 현재 상태를 캡처합니다. 이 메서드는 DOM을 업데이트하는 콜백을 받으며, 이 함수는 비동기적일 수 있습니다. 새로운 상태가 캡처되고, 콜백이 반환하는 프로미스가 해결될 때 다음 애니메이션 프레임에서 전환이 시작됩니다.

다음은 startViewTransition API의 예입니다:

```ts
document.startViewTransition(async () => {
  await updateTheDOMSomehow();
});
```

브라우저 API의 세부 사항에 대한 더 많은 정보를 읽고 싶다면, [Chrome 설명서](https://developer.chrome.com/docs/web-platform/view-transitions)는 귀중한 자료입니다.

## 라우터가 뷰 전환을 사용하는 방법

라우터에서 탐색이 시작된 후 여러 가지 일이 발생합니다: 경로 매칭, 지연 로딩 경로 및 구성 요소, 가드 및 리졸버 실행 등의 작업이 있습니다. 이러한 작업이 모두 성공적으로 완료되면 새로운 경로가 활성화될 준비가 됩니다. 이 경로 활성화는 뷰 전환의 일환으로 수행하고자 하는 DOM 업데이트입니다.

뷰 전환 기능이 활성화되면 탐색이 "일시 중지"되고 브라우저의 `startViewTransition` 메서드가 호출됩니다. `startViewTransition` 콜백이 실행되면(이는 사양에 설명된 대로 비동기적으로 발생합니다) 탐색이 "재개"됩니다. 라우터 탐색을 위한 나머지 단계에는 브라우저 URL 업데이트 및 매칭된 경로를 활성화하거나 비활성화하는 것이 포함됩니다 (DOM 업데이트).

마지막으로, `startViewTransition`에 전달된 콜백은 Angular가 렌더링을 완료한 후 해결되는 프로미스를 반환합니다. 위에서 설명한 바와 같이, 이는 브라우저에 새로운 DOM 상태를 캡처하고 전환이 시작되어야 한다고 알립니다.

뷰 전환은 [점진적 향상](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)입니다. 브라우저가 API를 지원하지 않는 경우, 라우터는 `startViewTransition`을 호출하지 않고 DOM 업데이트를 수행하며 탐색은 애니메이션되지 않습니다.

## 라우터에서 View Transitions 활성화

이 기능을 활성화하려면, `provideRouter`에 `withViewTransitions`를 추가하거나 `RouterModule.forRoot`에서 `enableViewTransitions: true`로 설정하기만 하면 됩니다:

```ts
// 독립형 부트스트랩
bootstrapApplication(MyApp, {providers: [
  provideRouter(ROUTES, withViewTransitions()),
]});

// NgModule 부트스트랩
@NgModule({
  imports: [RouterModule.forRoot(routes, {enableViewTransitions: true})]
})
export class AppRouting {}
```

[StackBlitz에서 “카운트” 예시를 시도해보세요](https://stackblitz.com/edit/stackblitz-starters-2dnvtm?file=src%2Fmain.ts)

이 예시는 Chrome 설명서에서 제공되는 카운터 애플리케이션을 사용하며 카운터가 증가할 때 `startViewTransition`에 대한 직접 호출을 라우터 탐색으로 대체합니다.

## CSS를 사용해 전환 사용자 정의하기

뷰 전환은 CSS로 사용자 정의할 수 있습니다. 우리는 또한 뷰 전환 이름을 설정하여 브라우저가 전환을 위한 별도의 요소를 생성하도록 지시할 수 있습니다. 카운터 구성 요소의 .count 스타일에 view-transition-name: count를 추가하여 첫 번째 예제를 확장할 수 있습니다. 그런 다음 전역 스타일에서 이 뷰 전환을 위한 사용자 정의 애니메이션을 정의할 수 있습니다:

```css
/* 사용자 정의 전환 */
@keyframes rotate-out {
 to {
   transform: rotate(90deg);
 }
}
@keyframes rotate-in {
 from {
   transform: rotate(-90deg);
 }
}
::view-transition-old(count),
::view-transition-new(count) {
 animation-duration: 200ms;
 animation-name: -ua-view-transition-fade-in, rotate-in;
}
::view-transition-old(count) {
 animation-name: -ua-view-transition-fade-out, rotate-out;
}
```

뷰 전환 애니메이션이 전역 스타일 파일에 정의되어야 하는 것이 중요합니다. 구성 요소 스타일에 정의할 수 없으며, 기본 뷰 캡슐화로 인해 스타일이 구성 요소에 한정되기 때문입니다.

[StackBlitz에서 업데이트된 “카운트” 예시를 시도해보세요](https://stackblitz.com/edit/stackblitz-starters-fwn4i7?file=src%2Fmain.ts)

## onViewTransitionCreated로 전환 제어하기

`withViewTransitions` 라우터 기능은 `onViewTransitionCreated` 콜백을 포함하는 옵션 객체와 함께 호출될 수도 있습니다. 이 콜백은 [주입 컨텍스트](/guide/di/dependency-injection-context#run-within-an-injection-context) 내에서 실행되며, `startViewTransition`에서 반환된 `ViewTransition`과 탐색이 전환되는 `ActivatedRouteSnapshot`를 받을 수 있습니다.

이 콜백은 여러 가지 사용자 정의를 위해 사용할 수 있습니다. 예를 들어, 특정 조건에서 전환을 건너뛰고 싶을 수 있습니다. 우리는 새로운 angular.dev 문서 사이트에서 이를 사용하고 있습니다:

```ts
withViewTransitions({
 onViewTransitionCreated: ({transition}) => {
   const router = inject(Router);
   const targetUrl = router.getCurrentNavigation()!.finalUrl!;
   // 유일하게 변경되는 것이 조각 및 쿼리 파라미터인 경우 전환을 건너뜁니다
   const config = { 
     paths: 'exact', 
     matrixParams: 'exact',
     fragment: 'ignored',
     queryParams: 'ignored',
   };

   if (router.isActive(targetUrl, config)) {
     transition.skipTransition();
   }
 },
}),
```

이 코드 스니펫에서 탐색할 `ActivatedRouteSnapshot`에서 `UrlTree`를 생성합니다. 그런 다음 조각이나 쿼리 매개변수에서의 차이를 무시하고 이 `UrlTree`가 이미 활성화되어 있는지 Router에 확인합니다. 이미 활성화되어 있다면 skipTransition을 호출하여 뷰 전환의 애니메이션 부분을 건너뜁니다. 동일한 문서 내에서 다른 위치로 스크롤하는 앵커 링크를 클릭할 때의 경우입니다.

## Angular에 맞게 조정된 Chrome 설명서의 사례

우리는 Chrome 팀의 훌륭한 사례 중 일부를 Angular로 재구성했습니다. 탐색해보세요.

### 전환하는 요소는 동일한 DOM 요소일 필요가 없습니다

* [Chrome 설명서](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#transitioning_elements_dont_need_to_be_the_same_dom_element)
* [StackBlitz의 Angular 예제](https://stackblitz.com/edit/stackblitz-starters-dh8npr?file=src%2Fmain.ts)

### 사용자 정의 진입 및 퇴장 애니메이션

* [Chrome 설명서](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#custom_entry_and_exit_transitions)
* [StackBlitz의 Angular 예제](https://stackblitz.com/edit/stackblitz-starters-8kly3o)

### 비동기 DOM 업데이트 및 콘텐츠 대기

* [Chrome 설명서](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#async_dom_updates_and_waiting_for_content)

> 이 시간 동안 페이지가 멈추므로 여기서의 지연은 최소화해야 합니다…경우에 따라 지연을 전혀 피하고 현재 소유하고 있는 콘텐츠를 사용하는 것이 더 좋습니다.

Angular 라우터의 뷰 전환 기능은 애니메이션 지연 방법을 제공하지 않습니다. 현재로서는 사용 가능한 콘텐츠를 사용하는 것이 페이지를 추가 시간 동안 비대화형으로 만드는 것보다 항상 더 나은 입장입니다.

### 뷰 전환 유형으로 여러 뷰 전환 스타일 제어하기

* [Chrome 설명서](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#view-transition-types)
* [StackBlitz의 Angular 예제](https://stackblitz.com/edit/stackblitz-starters-vxzcam)

### 뷰 전환 루트의 클래스 이름으로 여러 뷰 전환 스타일 처리하기 (사용 중단 예정)

* [Chrome 설명서](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#changing-on-navigation-type)
* [StackBlitz의 Angular 예제](https://stackblitz.com/edit/stackblitz-starters-nmnzzg?file=src%2Fmain.ts)

### 다른 애니메이션을 멈추지 않고 전환하기

* [Chrome 설명서](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#transitioning-without-freezing)
* [StackBlitz의 Angular 예제](https://stackblitz.com/edit/stackblitz-starters-76kgww)

### 자바스크립트로 애니메이션 만들기

* [Chrome 설명서](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#animating-with-javascript)
* [StackBlitz의 Angular 예제](https://stackblitz.com/edit/stackblitz-starters-cklnkm)

## 기본 View Transitions 대안

경로 간의 전환 애니메이션은 `@angular/animations` 패키지를 사용하여 수행할 수도 있습니다. 
애니메이션 [트리거 및 전환](/guide/animations/transition-and-triggers)은 현재 URL이나 `ActivatedRoute`와 같은 라우터 상태에서 파생될 수 있습니다.