# Angular without ZoneJS (Zoneless)

## Zoneless를 사용하는 이유는 무엇인가요?

ZoneJS를 종속성에서 제거함으로써 얻는 주요 장점은 다음과 같습니다:

- **성능 개선**: ZoneJS는 DOM 이벤트와 비동기 작업을 애플리케이션 상태가 _업데이트될 수 있는_ 시점의 지표로 사용하며, 이후 애플리케이션을 동기화하여 애플리케이션의 뷰에서 변경 감지를 실행합니다. ZoneJS는 애플리케이션 상태가 실제로 변경되었는지에 대한 통찰력이 없기 때문에 이 동기화는 필요 이상으로 자주 발생합니다.
- **Core Web Vitals 개선**: ZoneJS는 부하의 크기와 시작 시간 비용 모두에서 꽤 많은 오버헤드를 가져옵니다.
- **디버깅 경험 개선**: ZoneJS는 코드 디버깅을 더 어렵게 만듭니다. ZoneJS와 함께하는 스택 추적은 이해하기가 더 어렵습니다. 또한 코드는 Angular Zone 밖에 있는 결과로 인해 언제 중단되는지를 이해하기 어렵습니다.
- **생태계 호환성 개선**: ZoneJS는 브라우저 API를 패치하여 작동하지만, 새로운 브라우저 API에 대한 패치를 자동으로 제공하지 않습니다. `async`/`await`와 같이 효과적으로 패치할 수 없는 일부 API가 있으며, 이를 ZoneJS와 함께 사용하려면 다운레벨해야 합니다. 생태계 내의 라이브러리 또한 ZoneJS가 네이티브 API를 패치하는 방식과 호환되지 않을 수 있습니다. ZoneJS를 종속성에서 제거함으로써 복잡성의 원천인 몽키 패칭과 지속적인 유지 관리를 제거하여 장기적으로 더 나은 호환성을 보장합니다.

## 애플리케이션에서 Zoneless 활성화하기

Zoneless 활성화 API는 현재 실험적입니다. 형태나 기본 동작 모두 안정적이지 않으며 패치 버전에서 변경될 수 있습니다. 알려진 기능 공백이 있으며, 서버 사이드 렌더링과 함께 너무 일찍 직렬화 되는 것을 방지하는 인체공학적인 API가 부족합니다.

```typescript
// 독립형 부트스트랩
bootstrapApplication(MyApp, {providers: [
  provideExperimentalZonelessChangeDetection(),
]});

// NgModule 부트스트랩
platformBrowser().bootstrapModule(AppModule);
@NgModule({
  providers: [provideExperimentalZonelessChangeDetection()]
})
export class AppModule {}
```

## ZoneJS 제거하기

Zoneless 애플리케이션은 번들 크기를 줄이기 위해 ZoneJS를 빌드에서 완전히 제거해야 합니다. ZoneJS는 일반적으로 `angular.json`의 `polyfills` 옵션을 통해 로드되며, `build` 및 `test` 타겟 모두에서 포함됩니다. 빌드에서 제거하기 위해 `zone.js` 및 `zone.js/testing`을 모두 삭제하십시오. 명시적으로 `polyfills.ts` 파일을 사용하는 프로젝트는 파일에서 `import 'zone.js';` 및 `import 'zone.js/testing';`을 삭제해야 합니다.

ZoneJS를 빌드에서 제거한 후에는 더 이상 `zone.js` 종속성이 필요하지 않으며 패키지를 완전히 제거할 수 있습니다:

```shell
npm uninstall zone.js
```

## Zoneless 호환성 요구 사항

Angular는 변경 감지를 실행할 때 및 어떤 뷰에서 실행할지 결정하기 위해 core API의 알림에 의존합니다. 이 알림에는 다음이 포함됩니다:

- `ChangeDetectorRef.markForCheck` (자동으로 `AsyncPipe`에 의해 호출됨)
- `ComponentRef.setInput`
- 템플릿에서 읽히는 신호 업데이트
- 바인드된 호스트 또는 템플릿리스너 콜백
- 위의 것 중 하나에 의해 더러워진 것으로 표시된 뷰 연결

### `OnPush` 호환 구성 요소

구성 요소가 위의 올바른 알림 메커니즘을 사용하고 있는지 확인하는 한 가지 방법은 [ChangeDetectionStrategy.OnPush](/best-practices/skipping-subtrees#using-onpush)를 사용하는 것입니다.

`OnPush` 변경 감지 전략은 필수는 아니지만, 애플리케이션 구성 요소의 Zoneless 호환성을 위한 권장 단계입니다. 라이브러리 구성 요소가 `ChangeDetectionStrategy.OnPush`를 사용하는 것은 항상 가능하지 않습니다. 라이브러리 구성 요소가 `ChangeDetectionStrategy.Default`를 사용할 수 있는 사용자 구성 요소의 호스트인 경우, 이 구성 요소는 `OnPush`를 사용할 수 없습니다. 왜냐하면 그렇게 하면 자식 구성 요소가 최신 상태로 업데이트되지 않아야 하기 때문입니다. 구성 요소는 변경 감지가 실행되어야 할 때 Angular에 알리기만 하면 `Default` 전략을 사용할 수 있습니다(예: `markForCheck` 호출, 신호 사용, `AsyncPipe` 등). 사용자 구성 요소의 호스트가 된다는 것은 `ViewContainerRef.createComponent`와 같은 API를 사용해야 하며, 사용자 구성 요소의 일부 템플릿을 호스팅하는 것만으로는 충분하지 않습니다(즉, 콘텐츠 프로젝션 또는 템플릿 참조 입력 사용).

### `NgZone.onMicrotaskEmpty`, `NgZone.onUnstable`, `NgZone.isStable`, 또는 `NgZone.onStable` 제거

애플리케이션과 라이브러리는 `NgZone.onMicrotaskEmpty`, `NgZone.onUnstable` 및 `NgZone.onStable`의 사용을 제거해야 합니다. 이 옵저버블은 애플리케이션이 Zoneless 변경 감지를 활성화하면 결코 방출되지 않습니다. 마찬가지로 `NgZone.isStable`은 항상 `true`가 되며 코드 실행의 조건으로 사용되어서는 안 됩니다.

`NgZone.onMicrotaskEmpty` 및 `NgZone.onStable` 옵저버블은 일반적으로 Angular가 변경 감지를 완료할 때까지 작업을 수행하기 위해 사용됩니다. 대신, 단일 변경 감지를 기다릴 필요가 있다면 `afterNextRender`로 대체할 수 있습니다. 여러 변경 감지 라운드를 거치는 조건이 있다면 `afterRender`를 사용할 수 있습니다. 다른 경우에서 이러한 옵저버블은 친숙하고 필요한 것과 유사한 타이밍으로 인해 사용되었습니다. 더 직관적이거나 직접적인 DOM API를 대신 사용할 수 있습니다. 예를 들어, 코드가 특정 DOM 상태를 기다려야 할 때 `MutationObserver`를 사용할 수 있습니다(Angular의 렌더 훅을 통한 간접적인 방법으로 기다리는 것이 아닙니다).

<docs-callout title="NgZone.run 및 NgZone.runOutsideAngular는 Zoneless와 호환됩니다">
`NgZone.run` 및 `NgZone.runOutsideAngular`는 코드가 Zoneless 애플리케이션과 호환되도록 제거할 필요가 없습니다. 사실, 이러한 호출을 제거하면 ZoneJS에 여전히 의존하는 애플리케이션에서 사용되는 라이브러리의 성능 저하로 이어질 수 있습니다.
</docs-callout>

### 서버 사이드 렌더링(SSR)을 위한 `PendingTasks`

Angular와 함께 SSR을 사용하는 경우, 이 프레임워크가 ZoneJS에 의존하여 애플리케이션이 "안정적"이 되고 직렬화될 수 있는 시점을 결정함을 알 수 있습니다. 직렬화를 방지해야 할 비동기 작업이 발생하는 경우, ZoneJS를 사용하지 않는 애플리케이션은 [PendingTasks](/api/core/PendingTasks) 서비스를 통해 이러한 비동기 작업을 Angular에 알리야 합니다. 직렬화는 모든 대기 작업이 제거된 첫 번째 순간을 기다립니다.

대기 작업의 두 가지 간단한 사용 사례는 `run` 메서드입니다:

```typescript
const taskService = inject(PendingTasks);
taskService.run(async () => {
  const someResult = await doSomeWorkThatNeedsToBeRendered();
  this.someState.set(someResult);
});
```

더 복잡한 사용 사례의 경우, 대기 작업을 수동으로 추가하고 제거할 수 있습니다:

```typescript
const taskService = inject(PendingTasks);
const taskCleanup = taskService.add();
try {
  await doSomeWorkThatNeedsToBeRendered();
} catch {
  // 에러 처리
} finally {
  taskCleanup();
}
```

또한, `rxjs-interop`의 [pendingUntilEvent](/api/core/rxjs-interop/pendingUntilEvent#) 헬퍼는 옵저버블이 방출되거나 완료되거나 에러가 발생하거나 구독이 취소될 때까지 애플리케이션이 불안정한 상태로 유지되도록 보장합니다.

```typescript
readonly myObservableState = someObservable.pipe(pendingUntilEvent());
```

프레임워크는 비동기 작업이 완료될 때까지 직렬화를 방지하기 위해 이 서비스를 내부적으로도 사용합니다. 여기에는ongoing Router 내비게이션 및 미완료된 `HttpClient` 요청이 포함되며, 이에 국한되지 않습니다.

## 테스트 및 디버깅

### `TestBed`에서 Zoneless 사용하기

Zoneless 공급자 함수는 `TestBed`와 함께 사용하여 테스트 중인 구성 요소가 Zoneless Angular 애플리케이션과 호환되는지 확인하는 데 도움을 줄 수 있습니다.

```typescript
TestBed.configureTestingModule({
  providers: [provideExperimentalZonelessChangeDetection()]
});

const fixture = TestBed.createComponent(MyComponent);
await fixture.whenStable();
```

테스트가 프로덕션 코드와 가장 유사한 동작을 가지도록 하려면 가능한 경우 `fixture.detectChanges()`를 사용하는 것을 피하십시오. 이는 Angular가 그렇지 않을 경우 변경 감지를 예약하도록 강제합니다. 테스트는 이러한 알림이 발생하는지 확인하고 Angular가 상태를 동기화할 시점을 처리하도록 허용해야 하며, 테스트에서 수동으로 발생시키는 것을 피해야 합니다.

기존 테스트 스위트에서 `fixture.detectChanges()`를 사용하는 것은 일반적인 패턴이며, 이를 `await fixture.whenStable()`로 변환하는 것은 해당 노력을 들일 가치가 없을 것입니다. `TestBed`는 여전히 고정 장치의 구성 요소가 `OnPush` 호환성을 갖추고 있는지를 강제하며, 변경 알림 없이 템플릿 값을 업데이트한 경우 `ExpressionChangedAfterItHasBeenCheckedError`를 발생시킵니다(예: `fixture.componentInstance.someValue = 'newValue';`). 구성 요소가 프로덕션에서 사용되는 경우, 이 문제는 상태를 위한 신호를 사용하거나 `ChangeDetectorRef.markForCheck()`를 호출하여 업데이트하여 해결되어야 합니다. 구성 요소가 단지 테스트 래퍼로만 사용되고 애플리케이션에서 사용되지 않는다면, `fixture.changeDetectorRef.markForCheck()`를 사용하는 것은 허용됩니다.

### 업데이트가 감지되는지 확인하기 위한 디버그 모드 검사

Angular는 애플리케이션이 Zoneless 호환 방식으로 상태 업데이트를 수행하고 있는지를 검증하는 데 도움을 주는 추가 도구도 제공합니다. `provideExperimentalCheckNoChangesForDebug`를 사용하여 주기적으로 바인딩이 알림 없이 업데이트되지 않았는지 확인할 수 있습니다. 업데이트된 바인딩이 Zoneless 변경 탐지에 의해 새로 고쳐지지 않을 경우 Angular는 `ExpressionChangedAfterItHasBeenCheckedError`를 발생시킵니다.