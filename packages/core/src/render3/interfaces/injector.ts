/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InternalInjectFlags} from '../../di/interface/injector';
import {ProviderToken} from '../../di/provider_token';
import {assertDefined, assertEqual} from '../../util/assert';

import {TDirectiveHostNode} from './node';
import {LView, TData} from './view';

/**
 * Expando에서 `NodeInjector` 데이터 구조의 오프셋.
 *
 * `NodeInjector`는 `LView`와 `TView.data` 모두에 저장됩니다. 모든 저장소는 9개의 단어를 필요로 합니다.
 * 처음 8개는 블룸 필터를 위해 예약되어 있으며, 9번째는 관련된 `TNode`와 부모 `NodeInjector` 포인터를 위해 예약되어 있습니다. 모든 인덱스는 `index`로 시작하며 오프셋이 있습니다.
 *
 * `LView` 레이아웃:
 * ```
 * index + 0: 누적 블룸 필터
 * index + 1: 누적 블룸 필터
 * index + 2: 누적 블룸 필터
 * index + 3: 누적 블룸 필터
 * index + 4: 누적 블룸 필터
 * index + 5: 누적 블룸 필터
 * index + 6: 누적 블룸 필터
 * index + 7: 누적 블룸 필터
 * index + 8: 누적 블룸 필터
 * index + PARENT: 부모 주입기 인덱스. `RelativeInjectorLocation` 참조
 *                 `const parent = lView[index + NodeInjectorOffset.PARENT]`
 * ```
 *
 * `TViewData` 레이아웃:
 * ```
 * index + 0: 누적 블룸 필터
 * index + 1: 누적 블룸 필터
 * index + 2: 누적 블룸 필터
 * index + 3: 누적 블룸 필터
 * index + 4: 누적 블룸 필터
 * index + 5: 누적 블룸 필터
 * index + 6: 누적 블룸 필터
 * index + 7: 누적 블룸 필터
 * index + 8: 누적 블룸 필터
 * index + TNODE: 이 `NodeInjector`와 관련된 TNode
 *                `const tNode = tView.data[index + NodeInjectorOffset.TNODE]`
 * ```
 */
export const enum NodeInjectorOffset {
  TNODE = 8,
  PARENT = 8,
  BLOOM_SIZE = 8,
  SIZE = 9,
}

/**
 * 부모 주입기의 상대 위치를 나타냅니다.
 *
 * 이 인터페이스는 탐색할 부모 `LView`의 수와 부모 주입기를 가리키는 `LView`의 인덱스를 인코딩합니다.
 */
export type RelativeInjectorLocation = number & {
  __brand__: 'RelativeInjectorLocationFlags';
};

export const enum RelativeInjectorLocationFlags {
  InjectorIndexMask = 0b111111111111111,
  ViewOffsetShift = 16,
  NO_PARENT = -1,
}

export const NO_PARENT_INJECTOR = -1 as RelativeInjectorLocation;

/**
 * 각 주입기는 `LView`의 9개의 연속된 슬롯에 저장되고 `TView.data`의 9개의 연속된 슬롯에 저장됩니다.
 * 이는 현재 노드의 토큰(이를 `TView`에서 공유할 수 있음)과 조상 노드의 토큰(이를 공유할 수 없어 `LView`에서 존재함)에 대한 정보를 저장할 수 있게 해줍니다.
 *
 * 이러한 슬롯의 각 슬롯(마지막 슬롯 제외)에는 블룸 필터가 포함됩니다. 이 블룸 필터는 관련 노드에서 지시문이 사용 가능한지 여부를 결정합니다.
 * 이로 인해 지시문이 그 안에 있을 가능성이 없지 않는 한, 이 수준에서 지시문 배열을 검색하는 것을 방지합니다.
 *
 * 블룸 필터에 대한 자세한 내용은: https://en.wikipedia.org/wiki/Bloom_filter 를 참조하십시오.
 *
 * 모든 주입기가 `LView` 및 `TViewData`로 평탄화되었기 때문에, 이전처럼 인터페이스를 사용하여 유형을 지정할 수 없습니다. 각 `LInjector` 및 `TInjector`의 시작 인덱스는 주 배열로 평탄화되는 위치에 따라 다르므로, 미리 인덱스를 알 수 없고 여기에 유형을 저장할 수 없습니다. 인터페이스는 여전히 문서화 목적으로 포함되어 있습니다.
 *
 * export interface LInjector extends Array<any> {
 *
 *    // 지시문 ID 0-31의 누적 블룸 (ID는 % BLOOM_SIZE)
 *    [0]: number;
 *
 *    // 지시문 ID 32-63의 누적 블룸
 *    [1]: number;
 *
 *    // 지시문 ID 64-95의 누적 블룸
 *    [2]: number;
 *
 *    // 지시문 ID 96-127의 누적 블룸
 *    [3]: number;
 *
 *    // 지시문 ID 128-159의 누적 블룸
 *    [4]: number;
 *
 *    // 지시문 ID 160 - 191의 누적 블룸
 *    [5]: number;
 *
 *    // 지시문 ID 192 - 223의 누적 블룸
 *    [6]: number;
 *
 *    // 지시문 ID 224 - 255의 누적 블룸
 *    [7]: number;
 *
 *    // DI가 종속성을 찾을 때까지 주입기 트리를 계속 검색할 수 있도록 주입기의 부모에 대한 참조를 저장해야 합니다.
 *    [PARENT_INJECTOR]: number;
 * }
 *
 * export interface TInjector extends Array<any> {
 *
 *    // 지시문 ID 0-31의 공유 노드 블룸 (ID는 % BLOOM_SIZE)
 *    [0]: number;
 *
 *    // 지시문 ID 32-63의 공유 노드 블룸
 *    [1]: number;
 *
 *    // 지시문 ID 64-95의 공유 노드 블룸
 *    [2]: number;
 *
 *    // 지시문 ID 96-127의 공유 노드 블룸
 *    [3]: number;
 *
 *    // 지시문 ID 128-159의 공유 노드 블룸
 *    [4]: number;
 *
 *    // 지시문 ID 160 - 191의 공유 노드 블룸
 *    [5]: number;
 *
 *    // 지시문 ID 192 - 223의 공유 노드 블룸
 *    [6]: number;
 *
 *    // 지시문 ID 224 - 255의 공유 노드 블룸
 *    [7]: number;
 *
 *    // 특정 노드에 대한 지시문 인덱스를 찾는 데 필요합니다.
 *    [TNODE]: TElementNode|TElementContainerNode|TContainerNode;
 *  }
 */

/**
 * NodeInjector에서 인스턴스를 생성하기 위한 팩토리.
 *
 * 이 팩토리는 `multi` 팩토리를 해결할 수 있다는 사실로 인해 복잡해집니다.
 *
 * NOTE: 일부 필드는 선택 사항으로, 이는 이 클래스에 두 개의 숨겨진 클래스가 있음을 의미합니다.
 * - `multi` 지원이 없는 하나(가장 일반적)
 * - `multi` 값을 가진 하나(희귀).
 *
 * VM이 최대 4개의 인라인 숨겨진 클래스를 캐시할 수 있으므로 괜찮습니다.
 *
 * - 단일 팩토리: `resolving`과 `factory`만 정의됨.
 * - `providers` 팩토리: `componentProviders`는 숫자이고 `index = -1`.
 * - `viewProviders` 팩토리: `componentProviders`는 숫자이고 `index`는 `providers`를 가리킴.
 */
export class NodeInjectorFactory {
  /**
   * 팩토리를 사용할 때 활성화할 주입 구현.
   */
  injectImpl: null | (<T>(token: ProviderToken<T>, flags?: InternalInjectFlags) => T);

  /**
   * 재귀 루프에 진입하고 있는지 확인하기 위해 팩토리 호출 중에 true로 설정된 마커.
   * 재귀 루프는 오류가 표시되게 합니다.
   */
  resolving = false;

  /**
   * 토큰이 같은 노드에서 `viewProviders`에 선언된 다른 토큰을 볼 수 있음을 표시합니다.
   */
  canSeeViewProviders: boolean;

  /**
   * `multi` 제공자의 경우 사용할 팩토리 배열.
   */
  multi?: Array<() => any>;

  /**
   * 구성 요소에 속하는 `multi` 제공자의 수입니다.
   *
   * 여러 구성 요소와 지시문이 `multi` 제공자를 선언할 때 올바른 순서로 연결되기 때문에 필요합니다.
   *
   * 예시:
   *
   * 여기서 선언된 단일 요소에서 활성화된 구성 요소와 지시문이 있는 경우
   * ```ts
   * component:
   *   providers: [ {provide: String, useValue: 'component', multi: true} ],
   *   viewProviders: [ {provide: String, useValue: 'componentView', multi: true} ],
   *
   * directive:
   *   providers: [ {provide: String, useValue: 'directive', multi: true} ],
   * ```
   *
   * 그러면 예상 결과는 다음과 같습니다:
   *
   * ```ts
   * providers: ['component', 'directive']
   * viewProviders: ['component', 'componentView', 'directive']
   * ```
   *
   * 생각할 수 있는 방법은 `viewProviders`가 구성 요소 뒤에 삽입되고 지시문 앞에 삽입되었다는 것입니다.
   * 그래서 우리는 구성 요소에 의해 몇 개의 `multi`가 선언되었는지 알아야 합니다.
   */
  componentProviders?: number;

  /**
   * `data`의 현재 팩토리 인덱스. `viewProviders` 및 `providers` 병합에 필요합니다.
   * `providerFactory`를 보십시오.
   */
  index?: number;

  /**
   * 같은 `multi` 제공자가 `providers`와 `viewProviders`에 선언될 수 있기 때문에 `viewProviders`가 `providers`를 가릴 수 있습니다.
   * 이러한 이유로 우리는 `providers`의 `provideFactory`를 저장하여 `providers`를 `viewProviders`로 확장할 수 있도록 합니다.
   *
   * 예시:
   *
   * 주어진:
   * ```ts
   * providers: [ {provide: String, useValue: 'all', multi: true} ],
   * viewProviders: [ {provide: String, useValue: 'viewOnly', multi: true} ],
   * ```
   *
   * 우리는 콘텐츠 주입의 경우 `['all']`을 반환해야 하지만, 뷰 주입의 경우 `['all', 'viewOnly']`을 반환해야 합니다.
   * 우리는 또한 공유 인스턴스(우리 경우 `all`)가 콘텐츠와 뷰 주입 모두에서 정확히 동일한 인스턴스인지 확인해야 합니다. (이중 인스턴스화되지 않도록 해야 합니다.)
   * 이러한 이유로 `viewProviders`의 `Factory`는 가려진 `providers` 팩토리에 대한 포인터를 가지고 있어야 `providers`(`['all']`)를 인스턴스화한 다음 `viewProviders`(`['all'] + ['viewOnly'] =
   * ['all', 'viewOnly']`)로 확장할 수 있습니다.
   */
  providerFactory?: NodeInjectorFactory | null;

  constructor(
    /**
     * 새 인스턴스를 생성하기 위해 호출할 팩토리.
     */
    public factory: (
      this: NodeInjectorFactory,
      _: undefined,
      /**
       * 주입 가능한 토큰이 저장되는 배열. 이는 오류 보고 사례에서 더 친근한 오류를 생성하는 데 사용됩니다.
       */
      tData: TData,
      /**
       * 기존 인스턴스의 배열이 저장됩니다. 이는 다중 그림자가 필요한 경우에 사용됩니다.
       * `multi` 필드 문서화를 참조하십시오.
       */
      lView: LView,
      /**
       * 동일한 요소 주입기의 TNode.
       */
      tNode: TDirectiveHostNode,
    ) => any,
    /**
     * 토큰이 `viewProviders`에 선언된 경우(true)로 설정합니다. (또는 구성 요소일 경우).
     */
    isViewProvider: boolean,
    injectImplementation: null | (<T>(token: ProviderToken<T>, flags?: InternalInjectFlags) => T),
  ) {
    ngDevMode && assertDefined(factory, '팩토리가 지정되지 않았습니다.');
    ngDevMode && assertEqual(typeof factory, 'function', '팩토리 함수여야 합니다.');
    this.canSeeViewProviders = isViewProvider;
    this.injectImpl = injectImplementation;
  }
}
