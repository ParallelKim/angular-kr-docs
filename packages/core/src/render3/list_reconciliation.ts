/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TrackByFunction} from '../change_detection';
import {formatRuntimeError, RuntimeErrorCode} from '../errors';

import {stringifyForError} from './util/stringify_utils';

/**
 * 새로운(들어오는) 컬렉션과 일치시킬 라이브 컬렉션을 나타내는 타입입니다. 이
 * 어댑터 클래스는 들어오는 컬렉션의 실제 값과 관계없이 다양한 내부 데이터 구조로 작업할 수 있게 합니다.
 */
export abstract class LiveCollection<T, V> {
  abstract get length(): number;
  abstract at(index: number): V;
  abstract attach(index: number, item: T): void;
  abstract detach(index: number): T;
  abstract create(index: number, value: V): T;
  destroy(item: T): void {
    // 기본적으로는 아무 작업도 하지 않음
  }
  updateValue(index: number, value: V): void {
    // 기본적으로는 아무 작업도 하지 않음
  }

  // 아래 작업은 지금까지 정의된 작업을 기반으로 구현될 수 있지만,
  // 명시적으로 작업을 명확하게 표현하고 더 성능을 향상시킬 수 있습니다.
  swap(index1: number, index2: number): void {
    const startIdx = Math.min(index1, index2);
    const endIdx = Math.max(index1, index2);
    const endItem = this.detach(endIdx);
    if (endIdx - startIdx > 1) {
      const startItem = this.detach(startIdx);
      this.attach(startIdx, endItem);
      this.attach(endIdx, startItem);
    } else {
      this.attach(startIdx, endItem);
    }
  }
  move(prevIndex: number, newIdx: number): void {
    this.attach(newIdx, this.detach(prevIndex));
  }
}

function valuesMatching<V>(
  liveIdx: number,
  liveValue: V,
  newIdx: number,
  newValue: V,
  trackBy: TrackByFunction<V>,
): number {
  if (liveIdx === newIdx && Object.is(liveValue, newValue)) {
    // 일치하고 업데이트할 값의 정체성이 없음
    return 1;
  } else if (Object.is(trackBy(liveIdx, liveValue), trackBy(newIdx, newValue))) {
    // 일치하지만 값의 정체성 업데이트가 필요함
    return -1;
  }

  return 0;
}

function recordDuplicateKeys(keyToIdx: Map<unknown, Set<number>>, key: unknown, idx: number): void {
  const idxSoFar = keyToIdx.get(key);

  if (idxSoFar !== undefined) {
    idxSoFar.add(idx);
  } else {
    keyToIdx.set(key, new Set([idx]));
  }
}

/**
 * 새로운(들어오는) 컬렉션의 내용을 반영하기 위해 다양한 제자리 작업을 수행하는
 * 라이브 컬렉션 조정 알고리즘입니다.
 *
 * 조정 알고리즘은 2개의 코드 경로를 가지고 있습니다:
 * - 메모리 할당이 필요 없는 "빠른" 경로;
 * - 라이브 컬렉션에 대한 추가 정보를 수집하는 데 사용되는 중간 데이터 구조를 위한 추가 메모리 할당이 필요한 "느린" 경로.
 * 알고리즘은 단일 조정 경로에서 두 모드 간에 전환될 수 있습니다 - 일반적으로 가능한 한 "빠른" 경로를 유지하려고 합니다.
 *
 * 알고리즘의 전체 복잡도는 O(n + m) 속도와 O(n) 메모리입니다(여기서 n은
 * 라이브 컬렉션의 길이이고 m은 들어오는 컬렉션의 길이입니다). 문제의 특성상 복잡도/성능 제약이 있기 때문에
 * 두 컬렉션을 조정하는 데 필요한 최소 작업을 수행하는 것이 불가능합니다. 알고리즘은 합리적인 성능 한계 내에서 머무르기 위해
 * 다양한 거래를 하며 특정 상황에서 부분 최적의 작업 수를 적용할 수 있습니다.
 *
 * @param liveCollection 현재의 라이브 컬렉션;
 * @param newCollection 새로운 들어오는 컬렉션;
 * @param trackByFn 라이브 및 들어오는 컬렉션의 항목 간 동등성을 결정하는 키 생성 함수;
 */
export function reconcile<T, V>(
  liveCollection: LiveCollection<T, V>,
  newCollection: Iterable<V> | undefined | null,
  trackByFn: TrackByFunction<V>,
): void {
  let detachedItems: UniqueValueMultiKeyMap<unknown, T> | undefined = undefined;
  let liveKeysInTheFuture: Set<unknown> | undefined = undefined;

  let liveStartIdx = 0;
  let liveEndIdx = liveCollection.length - 1;

  const duplicateKeys = ngDevMode ? new Map<unknown, Set<number>>() : undefined;

  if (Array.isArray(newCollection)) {
    let newEndIdx = newCollection.length - 1;

    while (liveStartIdx <= liveEndIdx && liveStartIdx <= newEndIdx) {
      // 시작 부분에서 비교
      const liveStartValue = liveCollection.at(liveStartIdx);
      const newStartValue = newCollection[liveStartIdx];

      if (ngDevMode) {
        recordDuplicateKeys(duplicateKeys!, trackByFn(liveStartIdx, newStartValue), liveStartIdx);
      }

      const isStartMatching = valuesMatching(
        liveStartIdx,
        liveStartValue,
        liveStartIdx,
        newStartValue,
        trackByFn,
      );
      if (isStartMatching !== 0) {
        if (isStartMatching < 0) {
          liveCollection.updateValue(liveStartIdx, newStartValue);
        }
        liveStartIdx++;
        continue;
      }

      // 끝 부분에서 비교
      // TODO(perf): 끝에서의 모든 일치를 수행
      const liveEndValue = liveCollection.at(liveEndIdx);
      const newEndValue = newCollection[newEndIdx];

      if (ngDevMode) {
        recordDuplicateKeys(duplicateKeys!, trackByFn(newEndIdx, newEndValue), newEndIdx);
      }

      const isEndMatching = valuesMatching(
        liveEndIdx,
        liveEndValue,
        newEndIdx,
        newEndValue,
        trackByFn,
      );
      if (isEndMatching !== 0) {
        if (isEndMatching < 0) {
          liveCollection.updateValue(liveEndIdx, newEndValue);
        }
        liveEndIdx--;
        newEndIdx--;
        continue;
      }

      // 교환 및 이동 감지:
      const liveStartKey = trackByFn(liveStartIdx, liveStartValue);
      const liveEndKey = trackByFn(liveEndIdx, liveEndValue);
      const newStartKey = trackByFn(liveStartIdx, newStartValue);
      if (Object.is(newStartKey, liveEndKey)) {
        const newEndKey = trackByFn(newEndIdx, newEndValue);
        // 양쪽 끝에서의 교환 감지;
        if (Object.is(newEndKey, liveStartKey)) {
          liveCollection.swap(liveStartIdx, liveEndIdx);
          liveCollection.updateValue(liveEndIdx, newEndValue);
          newEndIdx--;
          liveEndIdx--;
        } else {
          // 새로운 항목이 끝 포인터에 있는 라이브 항목과 동일함 - 이는 이전 인덱스로의 이동임
          liveCollection.move(liveEndIdx, liveStartIdx);
        }
        liveCollection.updateValue(liveStartIdx, newStartValue);
        liveStartIdx++;
        continue;
      }

      // 느린 경로로 대체: 라이브 및 새로운 컬렉션의 내용에 대해 더 많은 정보를 알아내야 합니다.
      detachedItems ??= new UniqueValueMultiKeyMap();
      liveKeysInTheFuture ??= initLiveItemsInTheFuture(
        liveCollection,
        liveStartIdx,
        liveEndIdx,
        trackByFn,
      );

      // 이전에 분리된 항목을 삽입하는 경우: 여기에서 연결합니다
      if (attachPreviouslyDetached(liveCollection, detachedItems, liveStartIdx, newStartKey)) {
        liveCollection.updateValue(liveStartIdx, newStartValue);
        liveStartIdx++;
        liveEndIdx++;
      } else if (!liveKeysInTheFuture.has(newStartKey)) {
        // 오래된 컬렉션에 존재하지 않는 새 항목을 보았고 삽입해야 함
        const newItem = liveCollection.create(liveStartIdx, newCollection[liveStartIdx]);
        liveCollection.attach(liveStartIdx, newItem);
        liveStartIdx++;
        liveEndIdx++;
      } else {
        // 우리는 새로운 항목이 오래된 컬렉션에서 나중에 존재한다는 것을 알고 있지만,
        // 그 인덱스를 알 수 없으므로 이동할 수 없습니다 (찾는 방법을 모릅니다). 오래된 항목을 분리하여,
        // 다시 빠른 경로를 열기 희망합니다.
        detachedItems.set(liveStartKey, liveCollection.detach(liveStartIdx));
        liveEndIdx--;
      }
    }

    // 최종 정리 단계:
    // - 새로운 컬렉션에서 더 많은 아이템 => 삽입
    while (liveStartIdx <= newEndIdx) {
      createOrAttach(
        liveCollection,
        detachedItems,
        trackByFn,
        liveStartIdx,
        newCollection[liveStartIdx],
      );
      liveStartIdx++;
    }
  } else if (newCollection != null) {
    // iterable - 즉시 느린 경로로 대체
    const newCollectionIterator = newCollection[Symbol.iterator]();
    let newIterationResult = newCollectionIterator.next();
    while (!newIterationResult.done && liveStartIdx <= liveEndIdx) {
      const liveValue = liveCollection.at(liveStartIdx);
      const newValue = newIterationResult.value;

      if (ngDevMode) {
        recordDuplicateKeys(duplicateKeys!, trackByFn(liveStartIdx, newValue), liveStartIdx);
      }

      const isStartMatching = valuesMatching(
        liveStartIdx,
        liveValue,
        liveStartIdx,
        newValue,
        trackByFn,
      );
      if (isStartMatching !== 0) {
        // 일치하는 항목을 찾음 - 넘어가지만 값을 업데이트 함
        if (isStartMatching < 0) {
          liveCollection.updateValue(liveStartIdx, newValue);
        }
        liveStartIdx++;
        newIterationResult = newCollectionIterator.next();
      } else {
        detachedItems ??= new UniqueValueMultiKeyMap();
        liveKeysInTheFuture ??= initLiveItemsInTheFuture(
          liveCollection,
          liveStartIdx,
          liveEndIdx,
          trackByFn,
        );

        // 이전에 분리된 항목을 삽입하는 경우: 여기에서 연결합니다
        const newKey = trackByFn(liveStartIdx, newValue);
        if (attachPreviouslyDetached(liveCollection, detachedItems, liveStartIdx, newKey)) {
          liveCollection.updateValue(liveStartIdx, newValue);
          liveStartIdx++;
          liveEndIdx++;
          newIterationResult = newCollectionIterator.next();
        } else if (!liveKeysInTheFuture.has(newKey)) {
          liveCollection.attach(liveStartIdx, liveCollection.create(liveStartIdx, newValue));
          liveStartIdx++;
          liveEndIdx++;
          newIterationResult = newCollectionIterator.next();
        } else {
          // 앞으로 이동입니다 - 컬렉션에서 진행 없이 현재 항목을 분리합니다
          const liveKey = trackByFn(liveStartIdx, liveValue);
          detachedItems.set(liveKey, liveCollection.detach(liveStartIdx));
          liveEndIdx--;
        }
      }
    }

    // 구 항목이 없으므로 이것은 새로운 항목입니다 - 이전에 분리된 항목을 생성하거나 연결합니다
    while (!newIterationResult.done) {
      createOrAttach(
        liveCollection,
        detachedItems,
        trackByFn,
        liveCollection.length,
        newIterationResult.value,
      );
      newIterationResult = newCollectionIterator.next();
    }
  }

  // 배열 및 iterable 모두에 공통된 정리:
  // - 라이브 컬렉션에서 더 많은 항목 => 끝에서 시작하여 삭제;
  while (liveStartIdx <= liveEndIdx) {
    liveCollection.destroy(liveCollection.detach(liveEndIdx--));
  }

  // - 다시 연결되지 않은 항목을 파괴합니다.
  detachedItems?.forEach((item) => {
    liveCollection.destroy(item);
  });

  // 중복된 키 보고 (디벨롭 모드만 해당)
  if (ngDevMode) {
    let duplicatedKeysMsg = [];
    for (const [key, idxSet] of duplicateKeys!) {
      if (idxSet.size > 1) {
        const idx = [...idxSet].sort((a, b) => a - b);
        for (let i = 1; i < idx.length; i++) {
          duplicatedKeysMsg.push(
            `key "${stringifyForError(key)}" at index "${idx[i - 1]}" and "${idx[i]}"`,
          );
        }
      }
    }

    if (duplicatedKeysMsg.length > 0) {
      const message = formatRuntimeError(
        RuntimeErrorCode.LOOP_TRACK_DUPLICATE_KEYS,
        '제공된 트랙 표현식이 주어진 컬렉션에 대해 중복 키를 발생시켰습니다. ' +
          '트래킹 표현식을 조정하여 컬렉션 내 모든 항목을 고유하게 식별하게 하십시오. ' +
          '중복 키는: \n' +
          duplicatedKeysMsg.join(', \n') +
          '.',
      );

      console.warn(message);
    }
  }
}

function attachPreviouslyDetached<T, V>(
  prevCollection: LiveCollection<T, V>,
  detachedItems: UniqueValueMultiKeyMap<unknown, T> | undefined,
  index: number,
  key: unknown,
): boolean {
  if (detachedItems !== undefined && detachedItems.has(key)) {
    prevCollection.attach(index, detachedItems.get(key)!);
    detachedItems.delete(key);
    return true;
  }
  return false;
}

function createOrAttach<T, V>(
  liveCollection: LiveCollection<T, V>,
  detachedItems: UniqueValueMultiKeyMap<unknown, T> | undefined,
  trackByFn: TrackByFunction<unknown>,
  index: number,
  value: V,
) {
  if (!attachPreviouslyDetached(liveCollection, detachedItems, index, trackByFn(index, value))) {
    const newItem = liveCollection.create(index, value);
    liveCollection.attach(index, newItem);
  } else {
    liveCollection.updateValue(index, value);
  }
}

function initLiveItemsInTheFuture<T>(
  liveCollection: LiveCollection<unknown, unknown>,
  start: number,
  end: number,
  trackByFn: TrackByFunction<unknown>,
): Set<unknown> {
  const keys = new Set();
  for (let i = start; i <= end; i++) {
    keys.add(trackByFn(i, liveCollection.at(i)));
  }
  return keys;
}

/**
 * 다음과 같은 특성을 가진 맵 인터페이스의 특정 부분 구현입니다:
 * - 주어진 키에 대해 여러 값을 허용;
 * - 주어진 키에 해당하는 여러 값에 대해 FIFO 순서를 유지;
 * - 모든 값이 고유하다고 가정합니다.
 *
 * 이 구현은 키가 중복되지 않은 경우(리스트 조정 알고리즘의 가장 일반적인 경우) 최소한의 오버헤드를 가지는 것을 목표로 합니다. 이를 위해, 주어진 키에 대한 첫 번째 값은 일반 맵에 저장됩니다. 그런 다음 주어진 키에 대해 더 많은 값이 설정되면, 별도의 맵에서 일종의 연결리스트를 유지합니다. 이 연결리스트를 유지하기 위해 전체 컬렉션의 모든 값이 고유하다고 가정합니다.
 */
export class UniqueValueMultiKeyMap<K, V> {
  // 키에서 해당 키에 대한 첫 번째 값으로의 맵입니다.
  private kvMap = new Map<K, V>();
  // 값의 연결 리스트로 작용하는 맵 - 각 값은 이 "연결 리스트"의 다음 값에 매핑됩니다(이는 값이 고유할 때만 작동합니다). 중복 값이 없을 때 메모리 소비를 피하기 위해 게으르게 할당됩니다.
  private _vMap: Map<V, V> | undefined = undefined;

  has(key: K): boolean {
    return this.kvMap.has(key);
  }

  delete(key: K): boolean {
    if (!this.has(key)) return false;

    const value = this.kvMap.get(key)!;
    if (this._vMap !== undefined && this._vMap.has(value)) {
      this.kvMap.set(key, this._vMap.get(value)!);
      this._vMap.delete(value);
    } else {
      this.kvMap.delete(key);
    }

    return true;
  }

  get(key: K): V | undefined {
    return this.kvMap.get(key);
  }

  set(key: K, value: V): void {
    if (this.kvMap.has(key)) {
      let prevValue = this.kvMap.get(key)!;

      // 노트: 값이 중복되는 경우를 감지하기 위해 'assertNotSame'을 사용하지 않습니다.
      // 오류가 없는 경우에도 값이 문자열화되어야 하므로, 큰 값을 사용할 경우 브라우저가 얼 수 있습니다(참고: #58509).
      if (ngDevMode && prevValue === value) {
        throw new Error(`키 ${key}에 대한 중복 값 ${value}가 감지되었습니다.`);
      }

      if (this._vMap === undefined) {
        this._vMap = new Map();
      }

      const vMap = this._vMap;
      while (vMap.has(prevValue)) {
        prevValue = vMap.get(prevValue)!;
      }
      vMap.set(prevValue, value);
    } else {
      this.kvMap.set(key, value);
    }
  }

  forEach(cb: (v: V, k: K) => void) {
    for (let [key, value] of this.kvMap) {
      cb(value, key);
      if (this._vMap !== undefined) {
        const vMap = this._vMap;
        while (vMap.has(value)) {
          value = vMap.get(value)!;
          cb(value, key);
        }
      }
    }
  }
}
