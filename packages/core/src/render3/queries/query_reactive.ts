/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ComputedNode, createComputed, SIGNAL} from '@angular/core/primitives/signals';

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {unwrapElementRef} from '../../linker/element_ref';
import {QueryList} from '../../linker/query_list';
import {EMPTY_ARRAY} from '../../util/empty';

import {FLAGS, LView, LViewFlags} from '../interfaces/view';
import {Signal} from '../reactivity/api';
import {signal, WritableSignal} from '../reactivity/signal';
import {getLView} from '../state';
import {getQueryResults, loadQueryInternal} from './query';

interface QuerySignalNode<T> extends ComputedNode<T | ReadonlyArray<T>> {
  _lView?: LView;
  _queryIndex?: number;
  _queryList?: QueryList<T>;
  _dirtyCounter: WritableSignal<number>;
  /**
   * 쿼리에 대해 마지막으로 본 평탄화된 결과를 저장합니다. 이는 결과에 영향을 미치지 않는 뷰 조작으로 인해 신호 결과가 더럽게 컴퓨터로 표시되는 것을 피하기 위한 것입니다.
   */
  _flatValue?: T | ReadonlyArray<T>;
}

/**
 * 쿼리 결과를 캡처하는 새로운 계산된 신호를 생성하는 신호 팩토리 함수입니다. 이 중앙 집중식 생성 함수는 모든 유형의 쿼리(자식 / 자식들,
 * 필수 / 선택적)에서 사용됩니다.
 *
 * @param firstOnly 모든 결과 또는 첫 번째 결과만 반환해야 하는지 여부를 나타냅니다.
 * @param required 최소한 하나의 결과가 필요한지 여부를 나타냅니다.
 * @returns 쿼리 결과를 가진 읽기 전용 신호
 */
function createQuerySignalFn<V>(
  firstOnly: boolean,
  required: boolean,
  opts?: {debugName?: string},
) {
  let node: QuerySignalNode<V>;
  const signalFn = createComputed(() => {
    // 쿼리가 더럽힌 상태를 변경할 때마다 값을 증가시키는 전용 신호입니다. 이 신호를 사용하여 쿼리를 계산된 것으로 구현하고
    // 전문적인 반응형 노드 유형의 생성을 피할 수 있습니다. 쿼리가 더럽혀지는 경우는 다음과 같습니다:
    // - 뷰(쿼리가 활성화된 곳)가 첫 번째 생성 패스를 마쳤을 때;
    // - 새로운 뷰가 삽입/삭제되었고 쿼리 결과에 영향을 미쳤을 때.
    node._dirtyCounter();

    const value = refreshSignalQuery<V>(node, firstOnly);

    if (required && value === undefined) {
      throw new RuntimeError(
        RuntimeErrorCode.REQUIRED_QUERY_NO_VALUE,
        ngDevMode && '자식 쿼리 결과가 필요하지만 사용할 수 있는 값이 없습니다.',
      );
    }

    return value;
  });
  node = signalFn[SIGNAL] as QuerySignalNode<V>;
  node._dirtyCounter = signal(0);
  node._flatValue = undefined;

  if (ngDevMode) {
    signalFn.toString = () => `[Query Signal]`;
    node.debugName = opts?.debugName;
  }

  return signalFn;
}

export function createSingleResultOptionalQuerySignalFn<ReadT>(opts?: {
  debugName?: string;
}): Signal<ReadT | undefined> {
  return createQuerySignalFn(/* firstOnly */ true, /* required */ false, opts) as Signal<
    ReadT | undefined
  >;
}

export function createSingleResultRequiredQuerySignalFn<ReadT>(opts?: {
  debugName?: string;
}): Signal<ReadT> {
  return createQuerySignalFn(/* firstOnly */ true, /* required */ true, opts) as Signal<ReadT>;
}

export function createMultiResultQuerySignalFn<ReadT>(opts?: {
  debugName?: string;
}): Signal<ReadonlyArray<ReadT>> {
  return createQuerySignalFn(/* firstOnly */ false, /* required */ false, opts) as Signal<
    ReadonlyArray<ReadT>
  >;
}

export function bindQueryToSignal(target: Signal<unknown>, queryIndex: number): void {
  const node = target[SIGNAL] as QuerySignalNode<unknown>;
  node._lView = getLView();
  node._queryIndex = queryIndex;
  node._queryList = loadQueryInternal(node._lView, queryIndex);
  node._queryList.onDirty(() => node._dirtyCounter.update((v) => v + 1));
}

function refreshSignalQuery<V>(node: QuerySignalNode<V>, firstOnly: boolean): V | ReadonlyArray<V> {
  const lView = node._lView;
  const queryIndex = node._queryIndex;

  // "빈" 결과를 반환하려는 두 가지 조건이 있습니다:
  //
  // 1) 주어진 쿼리가 아직 생성되지 않았습니다(이는 지시문 생성과 쿼리 생성 함수 실행 사이의 시간입니다) - 이 경우 쿼리가 존재하지 않으며 반환할
  // 결과가 없습니다.
  //
  // 2) 우리가 뷰를 구성하는 과정에 있으며(첫 번째 생성 패스가 끝나지 않았음) 쿼리가 부분 결과를 가질 수 있지만 반환하고 싶지 않습니다 - 대신
  // 모든 노드가 일치할 기회를 가질 때까지 결과 수집을 지연하고 일관된 "원자적"(뷰 수준) 결과를 제시합니다.
  if (lView === undefined || queryIndex === undefined || lView[FLAGS] & LViewFlags.CreationMode) {
    return (firstOnly ? undefined : EMPTY_ARRAY) as V;
  }

  const queryList = loadQueryInternal<V>(lView, queryIndex);
  const results = getQueryResults<V>(lView, queryIndex);

  queryList.reset(results, unwrapElementRef);

  if (firstOnly) {
    return queryList.first;
  } else {
    // TODO: 성능 후속 조치를 위해 Signal 기반 쿼리에서 QueryList 사용을 추상화/제거하여 private _changesDetected 필드 접근 제거하기
    const resultChanged = (queryList as any as {_changesDetected: boolean})._changesDetected;
    if (resultChanged || node._flatValue === undefined) {
      return (node._flatValue = queryList.toArray());
    }
    return node._flatValue;
  }
}
