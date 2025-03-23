/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ProviderToken} from '../../di/provider_token';
import {QueryList} from '../../linker/query_list';

import {TNode} from './node';
import {TView} from './view';

/**
 * 쿼리 주석에서 추출된 쿼리 메타데이터를 나타내는 객체입니다.
 */
export interface TQueryMetadata {
  predicate: ProviderToken<unknown> | string[];
  read: any;
  flags: QueryFlags;
}

/**
 * 쿼리에 사용되는 플래그 집합입니다.
 *
 * NOTE: 여기서의 변경 사항이 `packages/compiler/src/render3/view/compiler.ts`에 반영되도록 해야 합니다.
 */
export const enum QueryFlags {
  /**
   * 플래그 없음
   */
  none = 0b0000,

  /**
   * 쿼리가 자식으로 내려가야 하는지 여부입니다.
   */
  descendants = 0b0001,

  /**
   * 쿼리를 정적으로 계산할 수 있으므로 조기 할당될 수 있습니다.
   *
   * NOTE: ViewEngine과의 호환성 유지.
   */
  isStatic = 0b0010,

  /**
   * `QueryList`가 실제 쿼리에 대한 변경 사항이 계산된 경우에만 변경 이벤트를 발생시키는지 여부입니다
   * (재계산된 쿼리가 동일한 목록을 결과로 내놓더라도 변경 사항이 발생했을 때의 이전 동작).
   */
  emitDistinctChangesOnly = 0b0100,
}

/**
 * TQuery 객체는 뷰 인스턴스에서 다른 인스턴스로 동일하게 유지되고 첫 번째 템플릿 패스에서
 * 결정할 수 있는 모든 쿼리 관련 데이터를 나타냅니다. 특히, TQuery는 특정 뷰에 대한 모든 매치를 보유합니다.
 */
export interface TQuery {
  /**
   * 쿼리 주석에서 추출된 쿼리 메타데이터입니다.
   */
  metadata: TQueryMetadata;

  /**
   * 임베디드 뷰로 전파되는 쿼리의 선언 뷰에서 쿼리의 인덱스, 주어진 뷰에서 선언된 쿼리의 경우 -1입니다.
   * 임베디드 뷰가 생성될 때 복제할 부모 쿼리를 찾을 수 있도록 이 인덱스를 저장합니다.
   */
  indexInDeclarationView: number;

  /**
   * 첫 번째 템플릿 패스에서 수집된 매치입니다. 각 매치는 다음의 쌍입니다:
   * - TNode 인덱스;
   * - 매치 인덱스;
   *
   * TNode 인덱스는 다음과 같습니다:
   * - 양의 정수 (가장 일반적인 경우)는 일치하는 TNode를 나타냅니다;
   * - 음의 정수는 주어진 쿼리가 <ng-template> 요소를 넘고
   * TemplateRef를 기반으로 생성된 뷰의 결과를 이 위치에 삽입해야 함을 나타냅니다.
   *
   * 매치 인덱스는 쿼리 결과가 구체화될 때 특정 노드에 대한 실제 값을 찾는 데 사용되는 숫자입니다.
   * 이 인덱스는 다음 값 중 하나를 가질 수 있습니다:
   * - -2 - 특별 토큰 (TemplateRef, ViewContainerRef 등)을 읽어야 함을 나타냅니다;
   * - -1 - 노드 유형에 따라 기본 값을 읽어야 함을 나타냅니다 (ng-template용 TemplateRef 및 기타 요소용 ElementRef);
   * - 양의 정수 - 요소 주입기에서 읽어야 할 주입 가능 항목의 인덱스입니다.
   */
  matches: number[] | null;

  /**
   * 주어진 쿼리가 <ng-template> 요소를 넘는지 여부를 나타내는 플래그입니다. 이 플래그는 성능상의
   * 이유로 존재합니다: <ng-template> 요소를 넘지 않는 쿼리는
   * 특정 뷰의 매치만 갖게 된다는 것을 알 수 있습니다 (따라서 처리를 조정합니다).
   */
  crossesNgTemplate: boolean;

  /**
   * 주어진 쿼리가 요소(또는 요소 컨테이너)를 넘을 때 호출되는 메서드입니다. 여기서
   * 주어진 TNode는 쿼리 프레디케이트와 일치합니다.
   * @param tView
   * @param tNode
   */
  elementStart(tView: TView, tNode: TNode): void;

  /**
   * elementEnd 지시를 처리할 때 호출되는 메서드입니다 - 이는 특정 콘텐츠 쿼리가
   * 이 지점을 넘어서는 노드와 일치해야 하는지 여부를 결정하는 데 주로 유용합니다.
   * @param tNode
   */
  elementEnd(tNode: TNode): void;

  /**
   * 템플릿 지시를 처리할 때 호출되는 메서드입니다. 여기서
   * 주어진 TContainerNode가 쿼리 프레디케이트와 일치합니다.
   * @param tView
   * @param tNode
   */
  template(tView: TView, tNode: TNode): void;

  /**
   * <ng-template> 요소의 콘텐츠를 기반으로 임베디드 TView가 생성될 때 호출되는 쿼리 관련 메서드입니다.
   * 주어진 쿼리가 임베디드 뷰로 전파되어야 하는지 여부를 결정하기 위해 이 메서드를 호출하며,
   * 만약 그렇다면 이 임베디드 뷰에 대한 복제된 TQuery를 반환합니다.
   * @param tNode
   * @param childQueryIndex
   */
  embeddedTView(tNode: TNode, childQueryIndex: number): TQuery | null;
}

/**
 * TQueries는 주어진 뷰에서 추적되는 개별 TQuery 객체의 컬렉션을 나타냅니다. 이 인터페이스의
 * 대부분의 메서드는 TQuery의 해당 기능에 대한 간단한 프록시 메서드입니다.
 */
export interface TQueries {
  /**
   * 주어진 뷰에서 추적되는 쿼리 컬렉션에 새 TQuery를 추가합니다.
   * @param tQuery
   */
  track(tQuery: TQuery): void;

  /**
   * 쿼리 배열의 주어진 인덱스에서 TQuery 인스턴스를 반환합니다.
   * @param index
   */
  getByIndex(index: number): TQuery;

  /**
   * 주어진 뷰에서 추적되는 쿼리의 수를 반환합니다.
   */
  length: number;

  /**
   * 주어진 TView의 모든 TQueries를 반복하여 각 TQuery에서 해당 `elementStart`를 호출하는 프록시 메서드입니다.
   * @param tView
   * @param tNode
   */
  elementStart(tView: TView, tNode: TNode): void;

  /**
   * 주어진 TView의 모든 TQueries를 반복하여 각 TQuery에서 해당 `elementEnd`를 호출하는 프록시 메서드입니다.
   * @param tNode
   */
  elementEnd(tNode: TNode): void;

  /**
   * 주어진 TView의 모든 TQueries를 반복하여 각 TQuery에서 해당 `template`을 호출하는 프록시 메서드입니다.
   * @param tView
   * @param tNode
   */
  template(tView: TView, tNode: TNode): void;

  /**
   * 주어진 TView의 모든 TQueries를 반복하여 각 TQuery에서 해당 `embeddedTView`를 호출하는 프록시 메서드입니다.
   * @param tNode
   */
  embeddedTView(tNode: TNode): TQueries | null;
}

/**
 * 쿼리 관련 정보를 뷰 인스턴스에 특정적으로 나타내는 인터페이스입니다. 특히 포함하고 있습니다:
 * - 구체화된 쿼리 매치;
 * - 구체화된 쿼리 결과를 보고해야 하는 QueryList에 대한 포인터.
 */
export interface LQuery<T> {
  /**
   * 주어진 뷰에 대한 구체화된 쿼리 매치만 포함합니다 (!). 결과는 지연 초기화되므로
   * 매치 배열은 처음에 `null`로 설정됩니다.
   */
  matches: (T | null)[] | null;

  /**
   * 구체화된 쿼리 결과를 보고해야 하는 QueryList입니다.
   */
  queryList: QueryList<T>;

  /**
   * 임베디드 뷰에 대해 LQuery를 복제합니다. 복제된 쿼리는 동일한 `QueryList`를 공유하지만
   * 구체화된 매치의 별도 컬렉션을 가집니다.
   */
  clone(): LQuery<T>;

  /**
   * 이 쿼리의 결과에 영향을 미치는 임베디드 뷰가 삽입되거나 제거될 때 호출됩니다.
   */
  setDirty(): void;
}

/**
 * lQueries는 주어진 뷰에서 추적되는 개별 LQuery 객체의 컬렉션을 나타냅니다.
 */
export interface LQueries {
  /**
   * 주어진 뷰에서 추적되는 쿼리의 컬렉션입니다.
   */
  queries: LQuery<any>[];

  /**
   * 새 임베디드 뷰가 생성될 때 호출되는 메서드입니다.
   * 그 결과 새 임베디드 뷰에 적용 가능한 LQueries 집합이 선언 뷰에서 인스턴스화(복제)됩니다.
   * @param tView
   */
  createEmbeddedView(tView: TView): LQueries | null;

  /**
   * 임베디드 뷰가 컨테이너에 삽입될 때 호출되는 메서드입니다.
   * 그 결과 영향을 받는 모든 `LQuery` 객체 (및 관련 `QueryList`)가 더럽혀진 것으로 표시됩니다.
   * @param tView
   */
  insertView(tView: TView): void;

  /**
   * 임베디드 뷰가 컨테이너에서 분리될 때 호출되는 메서드입니다.
   * 그 결과 영향을 받는 모든 `LQuery` 객체 (및 관련 `QueryList`)가 더럽혀진 것으로 표시됩니다.
   * @param tView
   */
  detachView(tView: TView): void;

  /**
   * 뷰가 생성 패스를 마치면 호출되는 메서드입니다.
   * 그 결과 영향을 받는 모든 `LQuery` 객체 (및 관련 `QueryList`)가 더럽혀진 것으로 표시됩니다.
   * 이 추가적인 더럽게 표시하기는 주어진 뷰에 대한 결과를 원자적으로 수집할 수 있는 정확한 시점을 제공합니다.
   * @param tView
   */
  finishViewCreation(tView: TView): void;
}
