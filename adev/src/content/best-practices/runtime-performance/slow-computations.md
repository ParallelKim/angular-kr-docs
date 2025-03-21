# 느린 계산

모든 변경 감지 주기에서 Angular는 동기적으로:

* 각 구성 요소의 감지 전략에 따라 지정되지 않은 경우 모든 구성 요소의 모든 템플릿 표현식을 평가합니다.
* `ngDoCheck`, `ngAfterContentChecked`, `ngAfterViewChecked`, 및 `ngOnChanges` 생명주기 후크를 실행합니다. 템플릿이나 생명주기 후크 내에서 단일 느린 계산이 전체 변경 감지 프로세스를 느리게 할 수 있습니다. Angular는 계산을 순차적으로 실행하기 때문입니다.

## 느린 계산 식별

Angular DevTools의 프로파일러를 사용하여 무거운 계산을 식별할 수 있습니다. 성능 타임라인에서 막대를 클릭하여 특정 변경 감지 주기를 미리 볼 수 있습니다. 이렇게 하면 각 구성 요소에 대해 프레임워크가 변경 감지에 얼마나 많은 시간을 소비했는지를 보여주는 막대 차트가 표시됩니다. 구성 요소를 클릭하면 Angular가 해당 템플릿과 생명주기 후크를 평가하는 데 얼마나 많은 시간을 소비했는지 미리 볼 수 있습니다.

<img alt="Angular DevTools 프로파일러 미리보기 - 느린 계산" src="assets/images/best-practices/runtime-performance/slow-computations.png">

예를 들어, 이전 스크린샷에서 두 번째로 기록된 변경 감지 주기가 선택되었습니다. Angular는 이 주기에 573ms 이상을 소모했으며, 가장 많은 시간이 `EmployeeListComponent`에서 소모되었습니다. 세부 정보 패널에서 Angular가 `EmployeeListComponent`의 템플릿을 평가하는 데 297ms 이상을 소모했다는 것을 볼 수 있습니다.

## 느린 계산 최적화

다음은 느린 계산을 제거하기 위한 몇 가지 기술입니다:

* **기본 알고리즘 최적화**. 이것이 권장되는 접근 방식입니다. 문제의 원인이 되는 알고리즘을 가속화할 수 있다면 전체 변경 감지 메커니즘을 가속화할 수 있습니다.
* **순수 파이프를 통한 캐싱**. 무거운 계산을 순수 [파이프](guide/pipes)로 이동할 수 있습니다. Angular는 입력이 이전에 Angular가 호출했을 때와 비교하여 변경된 경우에만 순수 파이프를 재평가합니다.
* **메모이제이션 사용**. [메모이제이션](https://en.wikipedia.org/wiki/Memoization)은 순수 파이프와 유사한 기술로, 메모이제이션은 여러 결과를 저장할 수 있는 반면 순수 파이프는 계산의 마지막 결과만 유지합니다.
* **생명주기 후크에서 repaint/reflow 피하기**. 특정 [작업](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/)은 브라우저가 페이지의 레이아웃을 동기적으로 재계산하거나 재렌더링하도록 합니다. 리플로우와 리페인트는 일반적으로 느리므로 모든 변경 감지 주기에서 이를 수행하는 것을 피하고 싶습니다.

순수 파이프와 메모이제이션은 서로 다른 장단점이 있습니다. 순수 파이프는 메모이제이션에 비해 Angular의 내장 개념입니다. 메모이제이션은 함수 결과를 캐싱하기 위한 일반 소프트웨어 공학 관행입니다. 무거운 계산을 자주 다양한 인수로 호출하면 메모이제이션의 메모리 오버헤드가 상당할 수 있습니다.