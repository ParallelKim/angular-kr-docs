/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {DeferBlockTrigger} from '../defer/interfaces';
import type {I18nICUNode} from '../render3/interfaces/i18n';
import {RNode} from '../render3/interfaces/renderer_dom';

/** 이 컴포넌트의 호스트 노드에서 노드 검색이 시작되어야 함을 인코딩합니다. */
export const REFERENCE_NODE_HOST = 'h';

/** 문서 본문 노드에서 노드 검색이 시작되어야 함을 인코딩합니다. */
export const REFERENCE_NODE_BODY = 'b';

/**
 * 주어진 (알려진) 요소에서 시작하여 런타임 로직이 수행해야 하는 내비게이션 단계를 설명합니다.
 * 코드 오버헤드를 줄이기 위해 enum `NodeNavigationStep`을 사용하지 않고,
 * 일반 `const`를 사용하여 여분의 바이트를 제거합니다. 단일 파일 컴파일 제한으로 인해
 * `const enum`을 사용할 수 없습니다.
 */

export type NodeNavigationStep = 'f' | 'n';

export const NODE_NAVIGATION_STEP_FIRST_CHILD = 'f';
export const NODE_NAVIGATION_STEP_NEXT_SIBLING = 'n';

/**
 * 다양한 부분을 나타내기 위한 직렬화된 뷰 데이터 구조 내의 키.
 * 추가 정보는 아래의 `SerializedView` 인터페이스를 참조하십시오.
 */
export const ELEMENT_CONTAINERS = 'e';
export const TEMPLATES = 't';
export const CONTAINERS = 'c';
export const MULTIPLIER = 'x';
export const NUM_ROOT_NODES = 'r';
export const TEMPLATE_ID = 'i'; // 이는 "id" 역할도 하므로
export const NODES = 'n';
export const DISCONNECTED_NODES = 'd';
export const I18N_DATA = 'l';
export const DEFER_BLOCK_ID = 'di';
export const DEFER_BLOCK_STATE = 's';
export const DEFER_PARENT_BLOCK_ID = 'p';
export const DEFER_HYDRATE_TRIGGERS = 't';
export const DEFER_PREFETCH_TRIGGERS = 'pt';

/**
 * 이 뷰 내의 요소 컨테이너를 나타내며,
 * 키는 LView의 컨테이너 인덱스(또한 `elementContainerStart` 지침에 사용됨)
 * 이며, 값은 이 컨테이너의 루트 노드 수입니다.
 * 이 정보는 모든 컨테이너 노드 뒤에 오는 앵커 주석 노드를 찾는 데 필요합니다.
 */
export interface SerializedElementContainers {
  [key: number]: number;
}

/**
 * 특정 수분 경계(예: 컴포넌트)를 설명하는 관련 수분 주석 정보가 포함된
 * 직렬화된 데이터 구조입니다.
 */
export interface SerializedView {
  /**
   * <ng-container>에 대한 직렬화된 정보.
   */
  [ELEMENT_CONTAINERS]?: SerializedElementContainers;

  /**
   * 템플릿에 대한 직렬화된 정보.
   * 키-값 쌍으로, 키는 해당 `template` 지침의 인덱스이며,
   * 값은 수분 시 해당 템플릿을 식별하는 데 사용할 수 있는 고유 id입니다.
   */
  [TEMPLATES]?: Record<number, string>;

  /**
   * 뷰 컨테이너에 대한 직렬화된 정보.
   * 키-값 쌍으로, 키는 LView 내의 해당 LContainer 항목의 인덱스이며,
   * 값은 이 컨테이너 내의 뷰에 대한 직렬화된 정보 목록입니다.
   */
  [CONTAINERS]?: Record<number, SerializedContainerView[]>;

  /**
   * 템플릿 내의 노드에 대한 직렬화된 정보.
   * 키-값 쌍으로, 키는 LView 내의 해당 DOM 노드의 인덱스이며
   * 값은 이 노드의 위치를 설명하는 경로(내비게이션 지침의 집합)입니다.
   */
  [NODES]?: Record<number, string>;

  /**
   * 직렬화 시간에 DOM 트리에서 분리된 노드 집합을 나타내는 id 목록입니다.
   *
   * 이러한 노드에 대해 수분 로직을 트리거하는 것을 피하고 대신 일반 "생성 모드"
   * 를 사용하는 데 이 정보가 사용됩니다.
   */
  [DISCONNECTED_NODES]?: number[];

  /**
   * 템플릿 내의 i18n 블록에 대한 직렬화된 정보.
   * 키-값 쌍으로, 키는 LView 내의 해당 i18n 항목의 인덱스이며,
   * 값은 활성 ICU 사례 목록입니다.
   */
  [I18N_DATA]?: Record<number, number[]>;

  /**
   * 이 뷰가 `@defer` 블록을 나타내는 경우, 이 필드는 블록의
   * 고유 id를 포함합니다.
   */
  [DEFER_BLOCK_ID]?: string;

  /**
   * 이 필드는 `DeferBlockState` enum을 기반으로 한 상태를 나타냅니다.
   */
  [DEFER_BLOCK_STATE]?: number;
}

/**
 * ViewContainer 컬렉션의 일부인 뷰에 대한 관련 수분 주석 정보를 포함하는
 * 직렬화된 데이터 구조입니다.
 */
export interface SerializedContainerView extends SerializedView {
  /**
   * 주어진 뷰 인스턴스를 만드는 데 사용된 TView를 나타내는 고유 id:
   *  - TViewType.Embedded: 서버에서 직렬화된 동안 생성된 고유 id
   *  - TViewType.Component: 컴포넌트 속성을 기반으로 생성된 id
   *                        (세부정보는 `getComponentId` 함수 참조)
   */
  [TEMPLATE_ID]: string;

  /**
   * 이 뷰에 속한 루트 노드 수.
   * 이 정보는 DOM 트리를 효과적으로 탐색하고
   * 서로 다른 뷰에 속하는 세그먼트를 식별하는 데 필요합니다.
   */
  [NUM_ROOT_NODES]: number;

  /**
   * 이 뷰가 반복되는 횟수.
   * 이는 유사한 뷰에 대한 동일한 수분 정보를 직렬화하고 전송하는 것을 피하는 데 사용됩니다
   * (예를 들어, *ngFor에 의해 생성됨).
   */
  [MULTIPLIER]?: number;
}

/**
 * 주어진 점진적인 수분 경계를 설명하는 관련 지연 블록 정보를 포함하는
 * 직렬화된 데이터 구조입니다.
 */
export interface SerializedDeferBlock {
  /**
   * 존재하는 경우 이 지연 블록의 부모에 대한 고유 id를 포함합니다.
   */
  [DEFER_PARENT_BLOCK_ID]?: string;

  /**
   * 이 필드는 `DeferBlockState` enum을 기반으로 한 상태를 나타냅니다.
   */
  [DEFER_BLOCK_STATE]?: number;

  /**
   * 이 지연 블록의 템플릿에 속한 루트 노드 수입니다.
   * 이 정보는 DOM 트리를 효과적으로 탐색하고
   * 점진적인 수분을 위해 루트 노드에 jsaction 속성을 적절히 추가하는 데 필요합니다.
   */
  [NUM_ROOT_NODES]: number;

  /**
   * 점진적인 수분을 위한 트리거 목록, `Trigger` enum을 기반으로.
   */
  [DEFER_HYDRATE_TRIGGERS]?: (DeferBlockTrigger | SerializedTriggerDetails)[];
}

export interface SerializedTriggerDetails {
  trigger: DeferBlockTrigger;
  delay?: number;
}

/**
 * 수분 과정을 용이하게 하기 위한 DOM 세그먼트에 대한 필요한 참조와 함께
 * 서버에서 직렬화된 수분 관련 정보를 포함하는 객체입니다.
 *
 * 클라이언트의 주어진 수분 경계에 대한 것입니다.
 */
export interface DehydratedView {
  /**
   * 읽기 전용 수분 주석 데이터입니다.
   */
  data: Readonly<SerializedView>;

  /**
   * 주어진 수분 경계와 관련된 DOM 세그먼트의 첫 번째 자식에 대한 참조입니다.
   *
   * 뷰가 수분되면 값은 `null`로 설정되어,
   * 이후의 분리/부착 뷰 작업은 해당 DOM 작업을 호출하는 결과를 가져와야 함을 나타냅니다
   * (수분 시 DOM 노드 부착 작업은 건너뛰며, 이미 DOM에 노드가 있음).
   */
  firstChild: RNode | null;

  /**
   * <ng-container> 또는 뷰 컨테이너를 나타내는 DOM 세그먼트의 첫 번째 노드에 대한 참조를 저장합니다.
   */
  segmentHeads?: {[index: number]: RNode | null};

  /**
   * 직렬화 시간에 DOM 트리에서 분리된 노드를 나타내는 Set입니다.
   *
   * Set은 `SerializedView[DISCONNECTED_NODES]` 데이터에 기반하며 상수 시간 조회를 위해 필요합니다.
   *
   * 값이 `null`이면 직렬화 시간에 이 뷰에서 발견된 분리된 노드가 없음을 의미합니다.
   */
  disconnectedNodes?: Set<number> | null;

  /**
   * 노드를 청구하기 시작하는 첫 번째 자식으로의 뷰 매핑입니다.
   *
   * 이 매핑은 i18n 블록에 의해 생성되며, 그 내부에 있는 노드의 진실의 원천입니다.
   */
  i18nNodes?: Map<number, RNode | null>;

  /**
   * ICU 노드의 인덱스에서 해당하는 탈수 데이터로 매핑합니다.
   *
   * 이 정보는 클라이언트의 수분 과정에서 사용됩니다.
   * 서버 측 렌더링 중 활성 상태였던 ICU 사례가 매핑에 추가됩니다.
   * 수분 로직은 일치하는 사례를 "청구"하고 이를 매핑에서 제거합니다.
   * 나머지 항목은 "청구되지 않음"이며 수분 정리 중 DOM에서 제거됩니다.
   */
  dehydratedIcuData?: Map<number, DehydratedIcuData>;
}

/**
 * 뷰 컨테이너 내의 주어진 뷰에 대한 수분 관련 정보를 포함하는 객체입니다.
 * (임베디드 뷰 또는 컴포넌트에 대해 생성된 뷰).
 */
export interface DehydratedContainerView extends DehydratedView {
  data: Readonly<SerializedContainerView>;
}

/**
 * 서버에서 직렬화된 탈수 ICU 사례에 대한 정보를 포함하는 객체입니다.
 * 수분 중 활성 상태였던 ICU 사례를 청소하는 데 필요합니다.
 */
export interface DehydratedIcuData {
  /**
   * 이 데이터가 나타내는 사례 인덱스입니다.
   */
  case: number;

  /**
   * ICU 노드에 대한 AST에 대한 참조입니다.
   * 이를 통해 AST를 사용하여 탈수 노드를 청소할 수 있습니다.
   */
  node: I18nICUNode;
}

/**
 * DOM의 특정 유형의 트리거의 존재를 요약합니다.
 */
export interface BlockSummary {
  data: SerializedDeferBlock;
  hydrate: {idle: boolean; immediate: boolean; viewport: boolean; timer: number | null};
}

/**
 * 특정 요소의 트리거 세부 정보와 블록에 어떻게 연관되어 있는지를 명시합니다.
 */
export interface ElementTrigger {
  el: HTMLElement;
  blockName: string;
  delay?: number;
}
