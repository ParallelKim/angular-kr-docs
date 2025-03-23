/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  HYDRATE_TRIGGER_CLEANUP_FNS,
  LDeferBlockDetails,
  PREFETCH_TRIGGER_CLEANUP_FNS,
  TRIGGER_CLEANUP_FNS,
  TriggerType,
} from './interfaces';

/**
 * prefetching 트리거 또는 defer 블록의 일반 트리거와 관련된 정리 함수 등록
 */
export function storeTriggerCleanupFn(
  type: TriggerType,
  lDetails: LDeferBlockDetails,
  cleanupFn: VoidFunction,
) {
  const key = getCleanupFnKeyByType(type);
  if (lDetails[key] === null) {
    lDetails[key] = [];
  }
  (lDetails[key]! as VoidFunction[]).push(cleanupFn);
}

/**
 * prefetch 또는 일반 트리거에 대해 등록된 정리 함수 호출
 */
export function invokeTriggerCleanupFns(type: TriggerType, lDetails: LDeferBlockDetails) {
  const key = getCleanupFnKeyByType(type);
  const cleanupFns = lDetails[key] as VoidFunction[];
  if (cleanupFns !== null) {
    for (const cleanupFn of cleanupFns) {
      cleanupFn();
    }
    lDetails[key] = null;
  }
}

/**
 * prefetch, hydrate 및 일반 트리거에 대해 등록된 정리 함수 호출
 */
export function invokeAllTriggerCleanupFns(lDetails: LDeferBlockDetails) {
  invokeTriggerCleanupFns(TriggerType.Prefetch, lDetails);
  invokeTriggerCleanupFns(TriggerType.Regular, lDetails);
  invokeTriggerCleanupFns(TriggerType.Hydrate, lDetails);
}

function getCleanupFnKeyByType(type: TriggerType): number {
  let key = TRIGGER_CLEANUP_FNS;
  if (type === TriggerType.Prefetch) {
    key = PREFETCH_TRIGGER_CLEANUP_FNS;
  } else if (type === TriggerType.Hydrate) {
    key = HYDRATE_TRIGGER_CLEANUP_FNS;
  }
  return key;
}
