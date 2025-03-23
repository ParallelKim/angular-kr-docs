/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertIndexInDeclRange} from '../render3/assert';
import {DependencyDef} from '../render3/interfaces/definition';
import {TContainerNode, TNode} from '../render3/interfaces/node';
import {HEADER_OFFSET, LView, TVIEW, TView} from '../render3/interfaces/view';
import {getTNode} from '../render3/util/view_utils';
import {assertEqual, throwError} from '../util/assert';

import {
  DeferBlockState,
  DeferDependenciesLoadingState,
  LDeferBlockDetails,
  LOADING_AFTER_SLOT,
  MINIMUM_SLOT,
  TDeferBlockDetails,
} from './interfaces';

/**
 * 주어진 지연 명령어의 인덱스를 기반으로 지연 블록 정보의 데이터 슬롯 인덱스를 계산합니다.
 */
export function getDeferBlockDataIndex(deferBlockIndex: number) {
  // 인스턴스 상태는 LView 또는 TView.data의 지연 블록 슬롯 바로 다음 위치에 있습니다.
  return deferBlockIndex + 1;
}

/** 블록을 나타내는 TNode가 주어졌을 때 LView에서 지연 블록 상태를 검색합니다. */
export function getLDeferBlockDetails(lView: LView, tNode: TNode): LDeferBlockDetails {
  const tView = lView[TVIEW];
  const slotIndex = getDeferBlockDataIndex(tNode.index);
  ngDevMode && assertIndexInDeclRange(tView, slotIndex);
  return lView[slotIndex];
}

/** LView에서 지연 블록 인스턴스 상태를 저장합니다. */
export function setLDeferBlockDetails(
  lView: LView,
  deferBlockIndex: number,
  lDetails: LDeferBlockDetails,
) {
  const tView = lView[TVIEW];
  const slotIndex = getDeferBlockDataIndex(deferBlockIndex);
  ngDevMode && assertIndexInDeclRange(tView, slotIndex);
  lView[slotIndex] = lDetails;
}

/** 블록을 나타내는 TNode와 TView가 주어졌을 때 지연 블록에 대한 정적 정보를 검색합니다. */
export function getTDeferBlockDetails(tView: TView, tNode: TNode): TDeferBlockDetails {
  const slotIndex = getDeferBlockDataIndex(tNode.index);
  ngDevMode && assertIndexInDeclRange(tView, slotIndex);
  return tView.data[slotIndex] as TDeferBlockDetails;
}

/** `TView.data`에 지연 블록의 정적 정보를 저장합니다. */
export function setTDeferBlockDetails(
  tView: TView,
  deferBlockIndex: number,
  deferBlockConfig: TDeferBlockDetails,
) {
  const slotIndex = getDeferBlockDataIndex(deferBlockIndex);
  ngDevMode && assertIndexInDeclRange(tView, slotIndex);
  tView.data[slotIndex] = deferBlockConfig;
}

export function getTemplateIndexForState(
  newState: DeferBlockState,
  hostLView: LView,
  tNode: TNode,
): number | null {
  const tView = hostLView[TVIEW];
  const tDetails = getTDeferBlockDetails(tView, tNode);

  switch (newState) {
    case DeferBlockState.Complete:
      return tDetails.primaryTmplIndex;
    case DeferBlockState.Loading:
      return tDetails.loadingTmplIndex;
    case DeferBlockState.Error:
      return tDetails.errorTmplIndex;
    case DeferBlockState.Placeholder:
      return tDetails.placeholderTmplIndex;
    default:
      ngDevMode && throwError(`예상치 못한 지연 블록 상태: ${newState}`);
      return null;
  }
}

/**
 * 주어진 상태가 렌더링되어야 하는 최소 시간을 반환합니다.
 * `minimum` 매개변수 값을 고려합니다. `minimum` 값이
 * 지정되지 않은 경우 - `null`을 반환합니다.
 */
export function getMinimumDurationForState(
  tDetails: TDeferBlockDetails,
  currentState: DeferBlockState,
): number | null {
  if (currentState === DeferBlockState.Placeholder) {
    return tDetails.placeholderBlockConfig?.[MINIMUM_SLOT] ?? null;
  } else if (currentState === DeferBlockState.Loading) {
    return tDetails.loadingBlockConfig?.[MINIMUM_SLOT] ?? null;
  }
  return null;
}

/** @loading 블록의 `after` 매개변수 값을 검색합니다. */
export function getLoadingBlockAfter(tDetails: TDeferBlockDetails): number | null {
  return tDetails.loadingBlockConfig?.[LOADING_AFTER_SLOT] ?? null;
}

/**
 * 다운로드된 종속성을 지시문 또는 파이프 레지스트리에 추가합니다.
 * 종속성이 레지스트리에 존재하지 않는지 확인합니다.
 */
export function addDepsToRegistry<T extends DependencyDef[]>(currentDeps: T | null, newDeps: T): T {
  if (!currentDeps || currentDeps.length === 0) {
    return newDeps;
  }

  const currentDepSet = new Set(currentDeps);
  for (const dep of newDeps) {
    currentDepSet.add(dep);
  }

  // `currentDeps`가 같은 길이인 경우 새 의존성이 없으며
  // 원래 배열을 반환할 수 있습니다.
  return currentDeps.length === currentDepSet.size ? currentDeps : (Array.from(currentDepSet) as T);
}

/** 지연 블록의 주요 내용을 나타내는 TNode를 검색합니다. */
export function getPrimaryBlockTNode(tView: TView, tDetails: TDeferBlockDetails): TContainerNode {
  const adjustedIndex = tDetails.primaryTmplIndex + HEADER_OFFSET;
  return getTNode(tView, adjustedIndex) as TContainerNode;
}

/**
 * 지연 블록의 모든 종속성이 로드되었는지 확인합니다.
 * 완료 상태로 지연 블록을 렌더링하기 전에 항상 이 함수를 실행하세요 (개발 모드에서).
 */
export function assertDeferredDependenciesLoaded(tDetails: TDeferBlockDetails) {
  assertEqual(
    tDetails.loadingState,
    DeferDependenciesLoadingState.COMPLETE,
    '모든 지연된 종속성이 로드되기를 기대합니다.',
  );
}

/**
 * 주어진 값이 지연 블록의 예상 구조와 일치하는지 확인합니다.
 *
 * 모든 지연 블록에는 기본 템플릿이 필요하므로 primaryTmplIndex를
 * 안전하게 사용할 수 있습니다. 다른 템플릿 옵션은 선택적입니다.
 */
export function isTDeferBlockDetails(value: unknown): value is TDeferBlockDetails {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as TDeferBlockDetails).primaryTmplIndex === 'number'
  );
}

/**
 * 주어진 TNode가 지연 블록을 나타내는지 여부.
 */
export function isDeferBlock(tView: TView, tNode: TNode): boolean {
  let tDetails: TDeferBlockDetails | null = null;
  const slotIndex = getDeferBlockDataIndex(tNode.index);
  // 슬롯 인덱스가 합리적인 범위 내에 있는지 체크합니다.
  // 참고: 지연 블록 세부정보가 `n+1` 슬롯에 저장되므로 오른쪽 경계에서 `-1`을 수행합니다.
  if (HEADER_OFFSET < slotIndex && slotIndex < tView.bindingStartIndex) {
    tDetails = getTDeferBlockDetails(tView, tNode);
  }
  return !!tDetails && isTDeferBlockDetails(tDetails);
}

/**
 * 트리거에 대한 디버깅 정보를 추적합니다.
 * @param tView 트리거가 선언된 TView.
 * @param tNode 트리거가 선언된 TNode.
 * @param textRepresentation 디버깅 목적으로 사용될 트리거의 텍스트 표현.
 */
export function trackTriggerForDebugging(tView: TView, tNode: TNode, textRepresentation: string) {
  const tDetails = getTDeferBlockDetails(tView, tNode);
  tDetails.debug ??= {};
  tDetails.debug.triggers ??= new Set();
  tDetails.debug.triggers.add(textRepresentation);
}
