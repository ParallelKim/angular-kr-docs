# 파이프를 사용한 변경 감지

파이프는 사용자 행동에 따라 변경될 수 있는 데이터 바인딩 값과 함께 자주 사용됩니다.
데이터가 `String`이나 `Number`와 같은 기본 입력 값이거나 `Date`나 `Array`와 같은 객체 참조일 경우, Angular는 값의 변화를 감지할 때마다 파이프를 실행합니다.

<docs-code-multifile path="adev/src/content/examples/pipes/src/app/power-booster.component.ts">
  <docs-code header="src/app/exponential-strength.pipe.ts" path="adev/src/content/examples/pipes/src/app/exponential-strength.pipe.ts"
             highlight="[16]" visibleRegion="pipe-class" />
  <docs-code header="src/app/power-booster.component.ts" path="adev/src/content/examples/pipes/src/app/power-booster.component.ts"/>
</docs-code-multifile>

`exponentialStrength` 파이프는 사용자가 값을 변경하거나 지수를 변경할 때마다 실행됩니다. 위의 강조 표시된 줄을 참조하세요.

Angular는 각 변화를 감지하고 즉시 파이프를 실행합니다.
이는 기본 입력 값에 대해서는 괜찮습니다.
하지만 복합 객체(예: 날짜의 월, 배열의 요소 또는 객체 속성) 내부의 무언가를 변경하면, 변경 감지가 어떻게 작동하는지와 `impure` 파이프를 사용하는 방법을 이해해야 합니다.

## 변경 감지가 작동하는 방식

Angular는 DOM 이벤트 후에 실행되는 변경 감지 프로세스에서 데이터 바인딩 값의 변화를 찾습니다: 각 키 입력, 마우스 이동, 타이머 틱 및 서버 응답.
다음 예제는 파이프를 사용하지 않고 Angular가 기본 변경 감지 전략을 사용하여 `heroes` 배열의 모든 영웅을 모니터링하고 업데이트하는 방법을 보여줍니다.
예제 탭은 다음과 같습니다:

| 파일                                | 세부사항 |
|:---                                 |:---     |
| `flying-heroes.component.html (v1)` | `*ngFor` 반복기가 영웅 이름을 표시합니다.                     |
| `flying-heroes.component.ts (v1)`   | 영웅을 제공하고, 배열에 영웅을 추가하고, 배열을 재설정합니다. |

<docs-code-multifile>
    <docs-code header="src/app/flying-heroes.component.html (v1)" path="adev/src/content/examples/pipes/src/app/flying-heroes.component.html" visibleRegion="template-1"/>
    <docs-code header="src/app/flying-heroes.component.ts (v1)" path="adev/src/content/examples/pipes/src/app/flying-heroes.component.ts" visibleRegion="v1"/>
</docs-code-multifile>

Angular는 사용자가 영웅을 추가할 때마다 디스플레이를 업데이트합니다.
사용자가 **Reset** 버튼을 클릭하면 Angular는 `heroes`를 원래 영웅의 새로운 배열로 교체하고 디스플레이를 업데이트합니다.
영웅을 제거하거나 변경할 능력을 추가하면, Angular는 이러한 변화를 감지하고 디스플레이를 업데이트합니다.

하지만 매번 변경할 때마다 디스플레이를 업데이트하기 위해 파이프를 실행하면 애플리케이션 성능이 저하됩니다.
따라서 Angular는 다음 섹션에서 설명한 대로 파이프를 실행하는 데 더 빠른 변경 감지 알고리즘을 사용합니다.

## 원시 값과 객체 참조에 대한 순수 변경 감지

기본적으로, 파이프는 *순수*로 정의되어 있으며, Angular는 입력 값이나 매개변수에 대한 *순수 변경*을 감지할 때만 파이프를 실행합니다.
순수 변경이란 기본 입력 값(예: `String`, `Number`, `Boolean` 또는 `Symbol`)의 변경이거나 변경된 객체 참조(예: `Date`, `Array`, `Function` 또는 `Object`)입니다.

순수 파이프는 부작용 없이 입력을 처리하고 값을 반환하는 순수 함수를 사용해야 합니다.
즉, 동일한 입력이 주어졌을 때, 순수 함수는 항상 동일한 출력을 반환해야 합니다.

순수 파이프를 사용하면 Angular는 객체와 배열 내의 변경 사항을 무시합니다. 왜냐하면 기본 값이나 객체 참조를 확인하는 것이 객체 내의 차이를 깊이 검사하는 것보다 훨씬 빠르기 때문입니다.
Angular는 파이프를 실행하고 뷰를 업데이트하는 것을 건너뛸 수 있는지를 빠르게 결정할 수 있습니다.

그러나 배열을 입력으로 가진 순수 파이프는 원하는 방식으로 작동하지 않을 수 있습니다.
이 문제를 보여주기 위해, 이전 예제를 변경하여 비행할 수 있는 영웅 목록으로 필터링합니다.

이를 위해 다음 코드에서 `*ngFor` 반복기에 `FlyingHeroesPipe`를 사용한다고 가정해보겠습니다.
예제 탭은 다음과 같습니다:

| 파일                             | 세부사항 |
|:---                              |:---     |
| flying-heroes.component.html      | 새 파이프가 사용된 템플릿. |
| flying-heroes.pipe.ts             | 비행 영웅을 필터링하는 사용자 정의 파이프가 있는 파일. |

<docs-code-multifile>
    <docs-code header="src/app/flying-heroes.component.html" path="adev/src/content/examples/pipes/src/app/flying-heroes.component.html" visibleRegion="template-flying-heroes"/>
    <docs-code header="src/app/flying-heroes.pipe.ts" path="adev/src/content/examples/pipes/src/app/flying-heroes.pipe.ts" visibleRegion="pure"/>
</docs-code-multifile>

이제 애플리케이션은 예상치 못한 동작을 보여줍니다: 사용자가 비행 영웅을 추가할 때 "비행하는 영웅들" 아래에 아무것도 나타나지 않습니다.
이는 영웅을 추가하는 코드가 영웅을 `flyingHeroes` 파이프의 입력으로 사용되는 `heroes` 배열에 푸시하기 때문입니다.

<docs-code header="src/app/flying-heroes.component.ts" path="adev/src/content/examples/pipes/src/app/flying-heroes.component.ts" visibleRegion="push"/>

변경 감지기는 배열의 요소 내의 변경을 무시하므로 파이프가 실행되지 않습니다.
Angular가 변경된 배열 요소를 무시하는 이유는 배열에 대한 *참조*가 변경되지 않았기 때문입니다.
배열이 동일하기 때문에 Angular는 디스플레이를 업데이트하지 않습니다.

원하는 동작을 얻는 한 가지 방법은 객체 참조 자체를 변경하는 것입니다.
배열을 새로 변경된 요소가 포함된 새로운 배열로 교체한 다음, 새 배열을 파이프에 입력합니다.
이전 예제에서는 새 영웅이 추가된 배열을 만들고 이를 `heroes`에 할당합니다.
Angular는 배열 참조의 변화를 감지하고 파이프를 실행합니다.

요약하자면, 입력 배열을 변형하면 순수 파이프가 실행되지 않습니다.
입력 배열을 *교체*하면, 파이프가 실행되고 디스플레이가 업데이트됩니다.
대안으로, 다음 섹션에서 설명할 배열과 같은 복합 객체 내의 변경을 감지하려면 *impure* 파이프를 사용하십시오.

## 복합 객체 내의 불순한 변경 감지

복합 객체 내부의 요소에 대한 변경, 예를 들어 배열의 요소에 대한 변경 후에 사용자 정의 파이프를 실행하려면 불순한 변경을 감지하기 위해 파이프를 `impure`로 정의해야 합니다.
Angular는 변경이 감지될 때마다 모든 비순수 파이프를 실행합니다(예: 각 키 입력이나 마우스 이벤트).

중요: 불순한 파이프는 유용할 수 있지만 주의해서 사용해야 합니다.
장시간 실행되는 불순한 파이프는 애플리케이션을 극적으로 느리게 할 수 있습니다.

파이프의 `pure` 플래그를 `false`로 설정하여 파이프를 불순하게 만듭니다:

<docs-code header="src/app/flying-heroes.pipe.ts" path="adev/src/content/examples/pipes/src/app/flying-heroes.pipe.ts"
           visibleRegion="pipe-decorator" highlight="[19]"/>

다음 코드는 `FlyingHeroesPipe`의 특성을 상속하는 `FlyingHeroesImpurePipe`의 전체 구현을 보여줍니다.
예제는 다른 것을 변경할 필요가 없음을 보여줍니다. 유일한 차이는 파이프 메타데이터에서 `pure` 플래그를 `false`로 설정하는 것입니다.

<docs-code-multifile>
    <docs-code header="src/app/flying-heroes.pipe.ts (FlyingHeroesImpurePipe)" path="adev/src/content/examples/pipes/src/app/flying-heroes.pipe.ts" visibleRegion="impure"/>
    <docs-code header="src/app/flying-heroes.pipe.ts (FlyingHeroesPipe)" path="adev/src/content/examples/pipes/src/app/flying-heroes.pipe.ts" visibleRegion="pure"/>
</docs-code-multifile>

`FlyingHeroesImpurePipe`는 `transform` 함수가 사소하고 빠르기 때문에 불순한 파이프의 적절한 후보입니다:

<docs-code header="src/app/flying-heroes.pipe.ts (filter)" path="adev/src/content/examples/pipes/src/app/flying-heroes.pipe.ts" visibleRegion="filter"/>

`FlyingHeroesComponent`에서 `FlyingHeroesImpureComponent`를 파생할 수 있습니다.
다음 코드에서 보여주듯이, 템플릿에서 파이프만 변경됩니다.

<docs-code header="src/app/flying-heroes-impure.component.html (excerpt)" path="adev/src/content/examples/pipes/src/app/flying-heroes-impure.component.html" visibleRegion="template-flying-heroes"/>