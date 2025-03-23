/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {DehydratedContainerView} from '../../hydration/interfaces';

import {TNode} from './node';
import {RComment, RElement} from './renderer_dom';
import {FLAGS, HOST, LView, NEXT, PARENT, T_HOST} from './view';

/**
 * 유형을 쉽게 식별할 수 있도록 특별한 위치. `LView`에서 검색한 배열이
 * `TYPE` 위치에 `true`가 있으면 이는 `LContainer`임을 알 수 있습니다.
 */
export const TYPE = 1;

/**
 * 아래는 LContainer 멤버를 조회하는 데 도움이 되는 LContainer 인덱스 상수입니다
 * 특정 인덱스를 기억할 필요가 없습니다.
 * Uglify는 축소할 때 이들을 인라인 하므로 비용이 발생하지 않아야 합니다.
 */

// FLAGS, PARENT, NEXT, 및 T_HOST는 인덱스 2, 3, 4, 및 5입니다.
// 이미 LView에 이러한 상수가 있으므로 다시 생성할 필요가 없습니다.

export const DEHYDRATED_VIEWS = 6;
export const NATIVE = 7;
export const VIEW_REFS = 8;
export const MOVED_VIEWS = 9;

/**
 * LContainer의 헤더 크기. 모든 뷰가
 * 컨테이너에 삽입된 이후의 인덱스를 나타냅니다. 현재 뷰를 기록해야
 * 이전에 DOM에 있는 뷰(다시 추가할 필요 없음)를 알 수 있고
 * 더 이상 필요하지 않을 때 DOM에서 뷰를 제거할 수 있습니다.
 */
export const CONTAINER_HEADER_OFFSET = 10;

/**
 * 컨테이너와 관련된 상태.
 *
 * 구조가 LView와 더 가까워지도록 배열입니다. 이는
 * 뷰 트리를 탐색할 때 도움이 됩니다(컨테이너와 구성 요소
 * 뷰의 혼합), 그래서 우리는 유형에 관계없이 viewOrContainer[NEXT]로 점프할 수 있습니다.
 */
export interface LContainer extends Array<any> {
  /**
   * 이 LContainer의 호스트 요소.
   *
   * 호스트는 이 컨테이너가 구성 요소 노드에 있는 경우 LView가 될 수 있습니다.
   * 그런 경우, 구성 요소 LView는 그 호스트입니다.
   */
  readonly [HOST]: RElement | RComment | LView;

  /**
   * 이는 `LContainer`를 `StylingContext`와 효율적으로 구별할 수 있도록 하는 유형 필드입니다.
   * 값은 항상 `true`로 설정됩니다.
   */
  [TYPE]: true;

  /** 이 컨테이너에 대한 플래그입니다. 더 많은 정보는 LContainerFlags를 참조하십시오. */
  [FLAGS]: LContainerFlags;

  /**
   * 상위 뷰에 대한 접근이 필요하여 컨테이너 내부에서 상위[NEXT]로
   * 다시 전파할 수 있습니다.
   */
  [PARENT]: LView;

  /**
   * 이는 같은 부모를 가진 형제 컨테이너 또는 구성 요소
   * 뷰로 점프할 수 있게 해주어 리스너를 효율적으로 제거할 수 있습니다.
   */
  [NEXT]: LView | LContainer | null;

  /**
   * 기본 `<ng-template>` 요소를 기반으로 생성된 뷰의 컬렉션이지만
   * 다른 `LContainer`에 삽입됩니다. 쿼리가 포함된 뷰 선언 지점에서
   * 일치 항목을 수집하고 _삽입 지점이 아닌 점에서 선언 지점에 따라
   * 뷰를 생성한 것을 추적해야 합니다.
   */
  [MOVED_VIEWS]: LView[] | null;

  /**
   * 컨테이너의 호스트를 나타내는 `TNode`에 대한 포인터입니다.
   */
  [T_HOST]: TNode;

  /** 이 LContainer의 기준 역할을 하는 주석 요소입니다. */
  [NATIVE]: RComment;

  /**
   * 이 컨테이너를 가리키는 `ViewContainerRef`에 의해 사용되는 `ViewRef`의 배열입니다.
   *
   * 이는 첫 번째 뷰가 삽입될 때 `ViewContainerRef`에 의해 게으르게 초기화됩니다.
   *
   * 주의: 이는 `any[]`로 저장됩니다. 이유는 render3가
   * `ViewRef`를 알아서는 안 되며, 그렇게 하는 것이 순환 종속성을 생성하기 때문입니다.
   */
  [VIEW_REFS]: unknown[] | null;

  /**
   * 이 컨테이너 내의 탈수된 뷰의 배열입니다.
   *
   * 이 정보는 클라이언트의 수분 공급 프로세스 중에 사용됩니다.
   * 수분 공급 로직은 일치하는 탈수된 뷰를 찾으려고 시도하고, 그것을 "claim"하여
   * 이 정보를 사용하여 추가 일치를 수행합니다. 그 후, 이 "claim된"
   * 뷰는 목록에서 제거됩니다. 남은 "unclaimed" 뷰는
   * 나중에 "가비지 수집"되어 DOM에서 제거됩니다.
   */
  [DEHYDRATED_VIEWS]: DehydratedContainerView[] | null;
}

/** LContainer와 관련된 플래그 (LContainer[FLAGS]에 저장됨) */
export const enum LContainerFlags {
  None = 0,
  /**
   * 이 `LContainer`에 변화 감지해야 하는 이식된 뷰가 있을 수 있음을 나타내는 플래그입니다.
   * (참조: `LView[DECLARATION_COMPONENT_VIEW])`.
   *
   * 이 플래그는 설정되면 `LContainer`에 대해 해제되지 않습니다.
   */
  HasTransplantedViews = 1 << 1,
}
