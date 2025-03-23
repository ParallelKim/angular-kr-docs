/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InternalInjectFlags} from '../di/interface/injector';
import {TNode, TNodeType} from '../render3/interfaces/node';
import {isComponentHost} from '../render3/interfaces/type_checks';
import {DECLARATION_COMPONENT_VIEW, LView} from '../render3/interfaces/view';
import {getCurrentTNode, getLView} from '../render3/state';
import {getComponentLViewByIndex} from '../render3/util/view_utils';
import {ViewRef} from '../render3/view_ref';

/**
 * 변경 감지 기능을 제공하는 기본 클래스입니다.
 * 변경 감지 트리는 변경 사항이 확인될 뷰를 수집합니다.
 * 이 메서드를 사용하여 트리에 뷰를 추가 및 제거하고, 변경 감지를 시작하며,
 * 뷰를 _더러운_ 상태로 표시하여 변경되었고 다시 렌더링될 필요가 있음을 나타냅니다.
 *
 * @see [변경 감지 훅 사용하기](guide/components/lifecycle#using-change-detection-hooks)
 * @see [사용자 정의 변경 감지 정의하기](guide/components/lifecycle#defining-custom-change-detection)
 *
 * @usageNotes
 *
 * 다음 예제는 필요한 경우 명시적 감지를 수행하도록 기본 변경 감지 동작을 수정하는 방법을 보여줍니다.
 *
 * ### `markForCheck()`를 `CheckOnce` 전략과 함께 사용
 *
 * 다음 예제는 구성 요소에 대해 `OnPush` 변경 감지 전략
 * (`CheckOnce`, 기본 `CheckAlways`가 아님)를 설정한 후, 간격 후에 두 번째 확인을 강제로 수행합니다.
 *
 * {@example core/ts/change_detect/change-detection.ts region='mark-for-check'}
 *
 * ### 변경 감지기를 분리하여 확인 빈도를 제한
 *
 * 다음 예제는 읽기 전용 데이터의 큰 목록이 포함된 구성 요소를 정의합니다.
 * 이 목록은 초당 여러 번 지속적으로 변경될 것으로 예상됩니다.
 * 성능을 향상시키기 위해, 우리는 변경이 실제로 발생하는 것보다 덜 자주 목록을 확인하고 업데이트하기를 원합니다. 이를 위해
 * 구성 요소의 변경 감지기를 분리하고 매 5초마다 명시적 로컬 체크를 수행합니다.
 *
 * {@example core/ts/change_detect/change-detection.ts region='detach'}
 *
 *
 * ### 분리된 구성 요소 재부착
 *
 * 다음 예제는 실시간 데이터를 표시하는 구성 요소를 생성합니다.
 * 구성 요소는 `live` 속성이 false로 설정될 때 주요 변경 감지 트리에서
 * 변경 감지기를 분리하고, 속성이 true가 되면 다시 부착합니다.
 *
 * {@example core/ts/change_detect/change-detection.ts region='reattach'}
 *
 * @publicApi
 */
export abstract class ChangeDetectorRef {
  /**
   * 뷰가 {@link ChangeDetectionStrategy#OnPush} (checkOnce) 변경 감지 전략을 사용할 때,
   * 뷰를 변경된 것으로 명시적으로 표시하여 다시 확인할 수 있도록 합니다.
   *
   * 일반적으로 구성 요소는 입력 값이 변경되거나 뷰에서 이벤트가 발생했을 때 더러운 상태로 표시됩니다.
   * 이 메서드를 호출하여 이러한 트리거가 발생하지 않았더라도 구성 요소가 확인되도록 합니다.
   *
   * <!-- TODO: OnPush 구성 요소에 대한 장 링크 추가 -->
   *
   */
  abstract markForCheck(): void;

  /**
   * 이 뷰를 변경 감지 트리에서 분리합니다.
   * 분리된 뷰는 다시 부착될 때까지 확인되지 않습니다.
   * 로컬 변경 감지 체크를 구현하기 위해 `detectChanges()`와 함께 사용합니다.
   *
   * 분리된 뷰는 변경 감지 실행 중에 다시 부착될 때까지 확인되지 않으며,
   * 더러운 상태로 표시된 경우에도 마찬가지입니다.
   *
   * <!-- TODO: 분리/재부착/로컬 다이제스트에 대한 장 링크 추가 -->
   * <!-- TODO: ref.detectChanges가 master에 병합되면 라이브 데모 추가 -->
   *
   */
  abstract detach(): void;

  /**
   * 이 뷰와 그 자식을 확인합니다. {@link ChangeDetectorRef#detach}와 함께 사용하여
   * 로컬 변경 감지 체크를 구현합니다.
   *
   * <!-- TODO: 분리/재부착/로컬 다이제스트에 대한 장 링크 추가 -->
   * <!-- TODO: ref.detectChanges가 master에 병합되면 라이브 데모 추가 -->
   *
   */
  abstract detectChanges(): void;

  /**
   * 변경 감지기를 확인하고 자식을 확인하며, 변경 사항이 감지되면 예외를 발생시킵니다.
   *
   * 개발 모드에서 사용하여 변경 감지가 다른 변경 사항을 초래하지 않는지 확인합니다.
   * 프로덕션 모드에서 호출하는 것은 실행하지 않습니다.
   *
   * @deprecated 이 API는 테스트 전용으로, 프로덕션 인터페이스에는 필요하지 않습니다.
   * `checkNoChanges`는 앱이 개발 모드에서 실행될 때 `ApplicationRef` 틱의 일부입니다.
   * 보다 세밀한 `checkNoChanges` 검증을 위해 `ComponentFixture`를 사용합니다.
   */
  abstract checkNoChanges(): void;

  /**
   * 이전에 분리된 뷰를 변경 감지 트리에 다시 부착합니다.
   * 기본적으로 뷰는 트리에 부착됩니다.
   *
   * <!-- TODO: 분리/재부착/로컬 다이제스트에 대한 장 링크 추가 -->
   *
   */
  abstract reattach(): void;

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__: (flags: InternalInjectFlags) => ChangeDetectorRef =
    injectChangeDetectorRef;
}

/** ChangeDetectorRef (일명 ViewRef)를 반환합니다 */
export function injectChangeDetectorRef(flags: InternalInjectFlags): ChangeDetectorRef {
  return createViewRef(
    getCurrentTNode()!,
    getLView(),
    (flags & InternalInjectFlags.ForPipe) === InternalInjectFlags.ForPipe,
  );
}

/**
 * ViewRef를 생성하고 이를 ChangeDetectorRef(공식 별칭)로 주입기에 저장합니다.
 *
 * @param tNode ChangeDetectorRef를 요청하는 노드
 * @param lView 노드가 포함된 뷰
 * @param isPipe 뷰가 파이프에 주입되고 있는지 여부
 * @returns 사용할 ChangeDetectorRef
 */
function createViewRef(tNode: TNode, lView: LView, isPipe: boolean): ChangeDetectorRef {
  if (isComponentHost(tNode) && !isPipe) {
    // LView는 구성 요소가 선언된 위치를 나타냅니다.
    // 대신 구성 요소 뷰에 대한 LView를 원하며, 이를 찾기 위해 탐색해야 합니다.
    const componentView = getComponentLViewByIndex(tNode.index, lView); // 아래로 탐색
    return new ViewRef(componentView, componentView);
  } else if (
    tNode.type &
    (TNodeType.AnyRNode | TNodeType.AnyContainer | TNodeType.Icu | TNodeType.LetDeclaration)
  ) {
    // LView는 주입이 요청되는 위치를 나타냅니다.
    // 포함된 LView를 찾아야 합니다 (lView가 삽입된 뷰인 경우).
    const hostComponentView = lView[DECLARATION_COMPONENT_VIEW]; // 위로 탐색
    return new ViewRef(hostComponentView, lView);
  }
  return null!;
}
