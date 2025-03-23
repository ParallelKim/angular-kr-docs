/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {Writable} from '../../interface/type';
import {isListLikeIterable, iterateListLike} from '../../util/iterable';
import {stringify} from '../../util/stringify';

import type {
  IterableChangeRecord,
  IterableChanges,
  IterableDiffer,
  IterableDifferFactory,
  NgIterable,
  TrackByFunction,
} from './iterable_differs';

export class DefaultIterableDifferFactory implements IterableDifferFactory {
  constructor() {}
  supports(obj: Object | null | undefined): boolean {
    return isListLikeIterable(obj);
  }

  create<V>(trackByFn?: TrackByFunction<V>): DefaultIterableDiffer<V> {
    return new DefaultIterableDiffer<V>(trackByFn);
  }
}

const trackByIdentity = (index: number, item: any) => item;

/**
 * @deprecated v4.0.0 - 공용 API의 일부여서는 안 됩니다.
 * @publicApi
 */
export class DefaultIterableDiffer<V> implements IterableDiffer<V>, IterableChanges<V> {
  public readonly length: number = 0;
  // TODO: 사용되지 않는 read-only인 `collection`의 사용 확인 필요.
  public readonly collection!: V[] | Iterable<V> | null;
  // 언제든지 사용된 레코드를 추적합니다 ( `_check()` 호출 중 및 호출 간에)
  private _linkedRecords: _DuplicateMap<V> | null = null;
  // `_check()` 호출 중 언제든지 제거된 레코드를 추적합니다.
  private _unlinkedRecords: _DuplicateMap<V> | null = null;
  private _previousItHead: IterableChangeRecord_<V> | null = null;
  private _itHead: IterableChangeRecord_<V> | null = null;
  private _itTail: IterableChangeRecord_<V> | null = null;
  private _additionsHead: IterableChangeRecord_<V> | null = null;
  private _additionsTail: IterableChangeRecord_<V> | null = null;
  private _movesHead: IterableChangeRecord_<V> | null = null;
  private _movesTail: IterableChangeRecord_<V> | null = null;
  private _removalsHead: IterableChangeRecord_<V> | null = null;
  private _removalsTail: IterableChangeRecord_<V> | null = null;
  // 사용자 지정 트랙이 동일하지만 항목 ID가 변경된 레코드 추적
  private _identityChangesHead: IterableChangeRecord_<V> | null = null;
  private _identityChangesTail: IterableChangeRecord_<V> | null = null;
  private _trackByFn: TrackByFunction<V>;

  constructor(trackByFn?: TrackByFunction<V>) {
    this._trackByFn = trackByFn || trackByIdentity;
  }

  forEachItem(fn: (record: IterableChangeRecord_<V>) => void) {
    let record: IterableChangeRecord_<V> | null;
    for (record = this._itHead; record !== null; record = record._next) {
      fn(record);
    }
  }

  forEachOperation(
    fn: (
      item: IterableChangeRecord<V>,
      previousIndex: number | null,
      currentIndex: number | null,
    ) => void,
  ) {
    let nextIt = this._itHead;
    let nextRemove = this._removalsHead;
    let addRemoveOffset = 0;
    let moveOffsets: number[] | null = null;
    while (nextIt || nextRemove) {
      // 처리할 다음 레코드 구하기
      // 순서: 제거, 추가, 이동
      const record: IterableChangeRecord<V> =
        !nextRemove ||
        (nextIt &&
          nextIt.currentIndex! < getPreviousIndex(nextRemove, addRemoveOffset, moveOffsets))
          ? nextIt!
          : nextRemove;
      const adjPreviousIndex = getPreviousIndex(record, addRemoveOffset, moveOffsets);
      const currentIndex = record.currentIndex;

      // 항목을 소비하고 addRemoveOffset을 조정하며 필요시 moveDistance 업데이트
      if (record === nextRemove) {
        addRemoveOffset--;
        nextRemove = nextRemove._nextRemoved;
      } else {
        nextIt = nextIt!._next;
        if (record.previousIndex == null) {
          addRemoveOffset++;
        } else {
          // 불변성:  currentIndex < previousIndex
          if (!moveOffsets) moveOffsets = [];
          const localMovePreviousIndex = adjPreviousIndex - addRemoveOffset;
          const localCurrentIndex = currentIndex! - addRemoveOffset;
          if (localMovePreviousIndex != localCurrentIndex) {
            for (let i = 0; i < localMovePreviousIndex; i++) {
              const offset = i < moveOffsets.length ? moveOffsets[i] : (moveOffsets[i] = 0);
              const index = offset + i;
              if (localCurrentIndex <= index && index < localMovePreviousIndex) {
                moveOffsets[i] = offset + 1;
              }
            }
            const previousIndex = record.previousIndex;
            moveOffsets[previousIndex] = localCurrentIndex - localMovePreviousIndex;
          }
        }
      }

      if (adjPreviousIndex !== currentIndex) {
        fn(record, adjPreviousIndex, currentIndex);
      }
    }
  }

  forEachPreviousItem(fn: (record: IterableChangeRecord_<V>) => void) {
    let record: IterableChangeRecord_<V> | null;
    for (record = this._previousItHead; record !== null; record = record._nextPrevious) {
      fn(record);
    }
  }

  forEachAddedItem(fn: (record: IterableChangeRecord_<V>) => void) {
    let record: IterableChangeRecord_<V> | null;
    for (record = this._additionsHead; record !== null; record = record._nextAdded) {
      fn(record);
    }
  }

  forEachMovedItem(fn: (record: IterableChangeRecord_<V>) => void) {
    let record: IterableChangeRecord_<V> | null;
    for (record = this._movesHead; record !== null; record = record._nextMoved) {
      fn(record);
    }
  }

  forEachRemovedItem(fn: (record: IterableChangeRecord_<V>) => void) {
    let record: IterableChangeRecord_<V> | null;
    for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
      fn(record);
    }
  }

  forEachIdentityChange(fn: (record: IterableChangeRecord_<V>) => void) {
    let record: IterableChangeRecord_<V> | null;
    for (record = this._identityChangesHead; record !== null; record = record._nextIdentityChange) {
      fn(record);
    }
  }

  diff(collection: NgIterable<V> | null | undefined): DefaultIterableDiffer<V> | null {
    if (collection == null) collection = [];
    if (!isListLikeIterable(collection)) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_DIFFER_INPUT,
        ngDevMode &&
          `Error trying to diff '${stringify(collection)}'. 배열과 반복 가능한 객체만 허용됩니다`,
      );
    }

    if (this.check(collection)) {
      return this;
    } else {
      return null;
    }
  }

  onDestroy() {}

  check(collection: NgIterable<V>): boolean {
    this._reset();

    let record: IterableChangeRecord_<V> | null = this._itHead;
    let mayBeDirty: boolean = false;
    let index: number;
    let item: V;
    let itemTrackBy: any;
    if (Array.isArray(collection)) {
      (this as Writable<this>).length = collection.length;

      for (let index = 0; index < this.length; index++) {
        item = collection[index];
        itemTrackBy = this._trackByFn(index, item);
        if (record === null || !Object.is(record.trackById, itemTrackBy)) {
          record = this._mismatch(record, item, itemTrackBy, index);
          mayBeDirty = true;
        } else {
          if (mayBeDirty) {
            // TODO(misko): 중복만으로 제한할 수 있나요?
            record = this._verifyReinsertion(record, item, itemTrackBy, index);
          }
          if (!Object.is(record.item, item)) this._addIdentityChange(record, item);
        }

        record = record._next;
      }
    } else {
      index = 0;
      iterateListLike(collection, (item: V) => {
        itemTrackBy = this._trackByFn(index, item);
        if (record === null || !Object.is(record.trackById, itemTrackBy)) {
          record = this._mismatch(record, item, itemTrackBy, index);
          mayBeDirty = true;
        } else {
          if (mayBeDirty) {
            // TODO(misko): 중복만으로 제한할 수 있나요?
            record = this._verifyReinsertion(record, item, itemTrackBy, index);
          }
          if (!Object.is(record.item, item)) this._addIdentityChange(record, item);
        }
        record = record._next;
        index++;
      });
      (this as Writable<this>).length = index;
    }

    this._truncate(record);
    (this as Writable<this>).collection = collection;
    return this.isDirty;
  }

  /* CollectionChanges는 추가, 이동, 제거 또는 ID 변경이 하나라도 있을 경우 더럽혀진 것으로 간주됩니다.
   */
  get isDirty(): boolean {
    return (
      this._additionsHead !== null ||
      this._movesHead !== null ||
      this._removalsHead !== null ||
      this._identityChangesHead !== null
    );
  }

  /**
   * 변경 객체의 상태를 초기화하여 변경 사항이 없음을 표시합니다. 즉, 이전 키를 현재 키로 설정하고,
   * 모든 대기열(추가, 이동, 제거)을 지웁니다. 이동 및 추가 된 항목의 previousIndexes를 currentIndexes로 설정합니다.
   * 추가, 이동 및 제거 목록을 초기화합니다.
   *
   * @internal
   */
  _reset() {
    if (this.isDirty) {
      let record: IterableChangeRecord_<V> | null;

      for (record = this._previousItHead = this._itHead; record !== null; record = record._next) {
        record._nextPrevious = record._next;
      }

      for (record = this._additionsHead; record !== null; record = record._nextAdded) {
        record.previousIndex = record.currentIndex;
      }
      this._additionsHead = this._additionsTail = null;

      for (record = this._movesHead; record !== null; record = record._nextMoved) {
        record.previousIndex = record.currentIndex;
      }
      this._movesHead = this._movesTail = null;
      this._removalsHead = this._removalsTail = null;
      this._identityChangesHead = this._identityChangesTail = null;

      // TODO(vicb): assert 지원되면
      // assert(!this.isDirty);
    }
  }

  /**
   * 이것은 컬렉션 간의 차이를 처리하는 핵심 기능입니다.
   *
   * - `record`는 마지막으로 이 위치에서 본 레코드입니다. null이면 새 항목입니다.
   * - `item`은 컬렉션의 현재 항목입니다.
   * - `index`는 컬렉션에서 항목의 위치입니다.
   *
   * @internal
   */
  _mismatch(
    record: IterableChangeRecord_<V> | null,
    item: V,
    itemTrackBy: any,
    index: number,
  ): IterableChangeRecord_<V> {
    // 현재 추가할 레코드 이후의 이전 레코드입니다.
    let previousRecord: IterableChangeRecord_<V> | null;

    if (record === null) {
      previousRecord = this._itTail;
    } else {
      previousRecord = record._prev;
      // 항목과 일치하지 않기 때문에 컬렉션에서 레코드를 제거합니다.
      this._remove(record);
    }

    // 이전 위치에 있었던 아이템을 확인할 수 있습니다.
    record = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
    if (record !== null) {
      // 이전에 제거했던 아이템입니다: 리스트에 다시 삽입합니다.
      // 그러나 먼저 ID가 변경되었는지 확인해야 하므로 필요한 경우 뷰를 업데이트할 수 있습니다.
      if (!Object.is(record.item, item)) this._addIdentityChange(record, item);

      this._reinsertAfter(record, previousRecord, index);
    } else {
      // 아이템이 _itHead 리스트의 후위 위치에 있는지 확인합니다.
      record = this._linkedRecords === null ? null : this._linkedRecords.get(itemTrackBy, index);
      if (record !== null) {
        // `index` 위치에서 _itHead에 해당 아이템이 있습니다. 컬렉션에서 앞으로 이동해야합니다.
        // 그러나 먼저 ID가 변경되었는지 확인해야 하므로 필요한 경우 뷰를 업데이트할 수 있습니다.
        if (!Object.is(record.item, item)) this._addIdentityChange(record, item);

        this._moveAfter(record, previousRecord, index);
      } else {
        // 새로운 항목입니다: 추가합니다.
        record = this._addAfter(
          new IterableChangeRecord_<V>(item, itemTrackBy),
          previousRecord,
          index,
        );
      }
    }
    return record;
  }

  /**
   * 이 검사는 배열 내에 중복이 포함될 경우에만 필요합니다. (더러운 것이 없는 단축 회로)
   *
   * 사용 사례: `[a, a]` => `[b, a, a]`
   *
   * 이 검사가 없으면 `b`의 삽입 결과는 다음과 같습니다:
   *   1) 첫 번째 `a` 제거
   *   2) `b`를 `0` 인덱스에 삽입.
   *   3) `a`를 인덱스 `1`에 그대로 두기. <-- 이건 잘못된거에요!
   *   3) `a`를 인덱스 `2`에 다시 삽입. <-- 이건 잘못된거에요!
   *
   * 올바른 동작은:
   *   1) 첫 번째 `a` 제거
   *   2) `b`를 `0` 인덱스에 삽입.
   *   3) `a`를 인덱스 `1`에 다시 삽입.
   *   3) `a`를 `1`에서 `2`로 이동.
   *
   *
   * 중복 항목을 제거하지 않았는지 두 번 확인합니다. 항목 유형이 이미 제거되었을 가능성이 있습니다:
   * `b`의 삽입은 첫 번째 'a'를 제거합니다. 이제 다시 삽입하지 않으면 마지막에 다시 삽입됩니다.
   * 이렇게 하면 두 개의 'a'가 위치를 바꾸는 것으로 나타납니다. 이는 올바르지 않으며,
   * 이를 삽입으로 보는 것이 더 나은 방법입니다.
   *
   * @internal
   */
  _verifyReinsertion(
    record: IterableChangeRecord_<V>,
    item: V,
    itemTrackBy: any,
    index: number,
  ): IterableChangeRecord_<V> {
    let reinsertRecord: IterableChangeRecord_<V> | null =
      this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
    if (reinsertRecord !== null) {
      record = this._reinsertAfter(reinsertRecord, record._prev!, index);
    } else if (record.currentIndex != index) {
      record.currentIndex = index;
      this._addToMoves(record, index);
    }
    return record;
  }

  /**
   * 이전 컬렉션에서 초과 {@link IterableChangeRecord_}를 제거합니다.
   *
   * - `record` 첫 번째 초과 {@link IterableChangeRecord_}.
   *
   * @internal
   */
  _truncate(record: IterableChangeRecord_<V> | null) {
    // 그 이후의 모든 항목은 제거되어야 합니다.
    while (record !== null) {
      const nextRecord: IterableChangeRecord_<V> | null = record._next;
      this._addToRemovals(this._unlink(record));
      record = nextRecord;
    }
    if (this._unlinkedRecords !== null) {
      this._unlinkedRecords.clear();
    }

    if (this._additionsTail !== null) {
      this._additionsTail._nextAdded = null;
    }
    if (this._movesTail !== null) {
      this._movesTail._nextMoved = null;
    }
    if (this._itTail !== null) {
      this._itTail._next = null;
    }
    if (this._removalsTail !== null) {
      this._removalsTail._nextRemoved = null;
    }
    if (this._identityChangesTail !== null) {
      this._identityChangesTail._nextIdentityChange = null;
    }
  }

  /** @internal */
  _reinsertAfter(
    record: IterableChangeRecord_<V>,
    prevRecord: IterableChangeRecord_<V> | null,
    index: number,
  ): IterableChangeRecord_<V> {
    if (this._unlinkedRecords !== null) {
      this._unlinkedRecords.remove(record);
    }
    const prev = record._prevRemoved;
    const next = record._nextRemoved;

    if (prev === null) {
      this._removalsHead = next;
    } else {
      prev._nextRemoved = next;
    }
    if (next === null) {
      this._removalsTail = prev;
    } else {
      next._prevRemoved = prev;
    }

    this._insertAfter(record, prevRecord, index);
    this._addToMoves(record, index);
    return record;
  }

  /** @internal */
  _moveAfter(
    record: IterableChangeRecord_<V>,
    prevRecord: IterableChangeRecord_<V> | null,
    index: number,
  ): IterableChangeRecord_<V> {
    this._unlink(record);
    this._insertAfter(record, prevRecord, index);
    this._addToMoves(record, index);
    return record;
  }

  /** @internal */
  _addAfter(
    record: IterableChangeRecord_<V>,
    prevRecord: IterableChangeRecord_<V> | null,
    index: number,
  ): IterableChangeRecord_<V> {
    this._insertAfter(record, prevRecord, index);

    if (this._additionsTail === null) {
      // TODO(vicb):
      // assert(this._additionsHead === null);
      this._additionsTail = this._additionsHead = record;
    } else {
      // TODO(vicb):
      // assert(_additionsTail._nextAdded === null);
      // assert(record._nextAdded === null);
      this._additionsTail = this._additionsTail._nextAdded = record;
    }
    return record;
  }

  /** @internal */
  _insertAfter(
    record: IterableChangeRecord_<V>,
    prevRecord: IterableChangeRecord_<V> | null,
    index: number,
  ): IterableChangeRecord_<V> {
    // TODO(vicb):
    // assert(record != prevRecord);
    // assert(record._next === null);
    // assert(record._prev === null);

    const next: IterableChangeRecord_<V> | null =
      prevRecord === null ? this._itHead : prevRecord._next;
    // TODO(vicb):
    // assert(next != record);
    // assert(prevRecord != record);
    record._next = next;
    record._prev = prevRecord;
    if (next === null) {
      this._itTail = record;
    } else {
      next._prev = record;
    }
    if (prevRecord === null) {
      this._itHead = record;
    } else {
      prevRecord._next = record;
    }

    if (this._linkedRecords === null) {
      this._linkedRecords = new _DuplicateMap<V>();
    }
    this._linkedRecords.put(record);

    record.currentIndex = index;
    return record;
  }

  /** @internal */
  _remove(record: IterableChangeRecord_<V>): IterableChangeRecord_<V> {
    return this._addToRemovals(this._unlink(record));
  }

  /** @internal */
  _unlink(record: IterableChangeRecord_<V>): IterableChangeRecord_<V> {
    if (this._linkedRecords !== null) {
      this._linkedRecords.remove(record);
    }

    const prev = record._prev;
    const next = record._next;

    // TODO(vicb):
    // assert((record._prev = null) === null);
    // assert((record._next = null) === null);

    if (prev === null) {
      this._itHead = next;
    } else {
      prev._next = next;
    }
    if (next === null) {
      this._itTail = prev;
    } else {
      next._prev = prev;
    }

    return record;
  }

  /** @internal */
  _addToMoves(record: IterableChangeRecord_<V>, toIndex: number): IterableChangeRecord_<V> {
    // TODO(vicb):
    // assert(record._nextMoved === null);

    if (record.previousIndex === toIndex) {
      return record;
    }

    if (this._movesTail === null) {
      // TODO(vicb):
      // assert(_movesHead === null);
      this._movesTail = this._movesHead = record;
    } else {
      // TODO(vicb):
      // assert(_movesTail._nextMoved === null);
      this._movesTail = this._movesTail._nextMoved = record;
    }

    return record;
  }

  private _addToRemovals(record: IterableChangeRecord_<V>): IterableChangeRecord_<V> {
    if (this._unlinkedRecords === null) {
      this._unlinkedRecords = new _DuplicateMap<V>();
    }
    this._unlinkedRecords.put(record);
    record.currentIndex = null;
    record._nextRemoved = null;

    if (this._removalsTail === null) {
      // TODO(vicb):
      // assert(_removalsHead === null);
      this._removalsTail = this._removalsHead = record;
      record._prevRemoved = null;
    } else {
      // TODO(vicb):
      // assert(_removalsTail._nextRemoved === null);
      // assert(record._nextRemoved === null);
      record._prevRemoved = this._removalsTail;
      this._removalsTail = this._removalsTail._nextRemoved = record;
    }
    return record;
  }

  /** @internal */
  _addIdentityChange(record: IterableChangeRecord_<V>, item: V) {
    record.item = item;
    if (this._identityChangesTail === null) {
      this._identityChangesTail = this._identityChangesHead = record;
    } else {
      this._identityChangesTail = this._identityChangesTail._nextIdentityChange = record;
    }
    return record;
  }
}

export class IterableChangeRecord_<V> implements IterableChangeRecord<V> {
  currentIndex: number | null = null;
  previousIndex: number | null = null;

  /** @internal */
  _nextPrevious: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _prev: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _next: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _prevDup: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _nextDup: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _prevRemoved: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _nextRemoved: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _nextAdded: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _nextMoved: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _nextIdentityChange: IterableChangeRecord_<V> | null = null;

  constructor(
    public item: V,
    public trackById: any,
  ) {}
}

// 같은 IterableChangeRecord_.item을 가진 IterableChangeRecord의 연결 리스트
class _DuplicateItemRecordList<V> {
  /** @internal */
  _head: IterableChangeRecord_<V> | null = null;
  /** @internal */
  _tail: IterableChangeRecord_<V> | null = null;

  /**
   * 중복된 목록에 레코드를 추가합니다.
   *
   * 참고: 설계상 중복 목록의 모든 레코드는 record.item의 동일한 값을 유지합니다.
   */
  add(record: IterableChangeRecord_<V>): void {
    if (this._head === null) {
      this._head = this._tail = record;
      record._nextDup = null;
      record._prevDup = null;
    } else {
      // TODO(vicb):
      // assert(record.item ==  _head.item ||
      //       record.item is num && record.item.isNaN && _head.item is num && _head.item.isNaN);
      this._tail!._nextDup = record;
      record._prevDup = this._tail;
      record._nextDup = null;
      this._tail = record;
    }
  }

  // IterableChangeRecord_.trackById == trackById 및 IterableChangeRecord_.currentIndex >= atOrAfterIndex를 가진 IterableChangeRecord_를 반환합니다.
  get(trackById: any, atOrAfterIndex: number | null): IterableChangeRecord_<V> | null {
    let record: IterableChangeRecord_<V> | null;
    for (record = this._head; record !== null; record = record._nextDup) {
      if (
        (atOrAfterIndex === null || atOrAfterIndex <= record.currentIndex!) &&
        Object.is(record.trackById, trackById)
      ) {
        return record;
      }
    }
    return null;
  }

  /**
   * 중복 목록에서 하나의 {@link IterableChangeRecord_}를 제거합니다.
   *
   * 중복 목록이 비어 있으면 제거됩니다.
   */
  remove(record: IterableChangeRecord_<V>): boolean {
    // TODO(vicb):
    // assert(() {
    //  // 제거되고 있는 레코드가 목록에 있는지 확인합니다.
    //  for (IterableChangeRecord_ cursor = _head; cursor != null; cursor = cursor._nextDup) {
    //    if (identical(cursor, record)) return true;
    //  }
    //  return false;
    //});

    const prev: IterableChangeRecord_<V> | null = record._prevDup;
    const next: IterableChangeRecord_<V> | null = record._nextDup;
    if (prev === null) {
      this._head = next;
    } else {
      prev._nextDup = next;
    }
    if (next === null) {
      this._tail = prev;
    } else {
      next._prevDup = prev;
    }
    return this._head === null;
  }
}

class _DuplicateMap<V> {
  map = new Map<any, _DuplicateItemRecordList<V>>();

  put(record: IterableChangeRecord_<V>) {
    const key = record.trackById;

    let duplicates = this.map.get(key);
    if (!duplicates) {
      duplicates = new _DuplicateItemRecordList<V>();
      this.map.set(key, duplicates);
    }
    duplicates.add(record);
  }

  /**
   * 키를 사용하여 `value`를 검색합니다. IterableChangeRecord_ 값은 이미 반복된 것일 수 있으므로,
   * 가상으로 `atOrAfterIndex`를 사용하여 존재하지 않는 것처럼 처리합니다.
   *
   * 사용 사례: `[a, b, c, a, a]` 인덱스 `3`에 해당하는 두 번째 `a`에서는 모든 `a`가 있는지 확인해야합니다.
   */
  get(trackById: any, atOrAfterIndex: number | null): IterableChangeRecord_<V> | null {
    const key = trackById;
    const recordList = this.map.get(key);
    return recordList ? recordList.get(trackById, atOrAfterIndex) : null;
  }

  /**
   * 중복 목록에서 {@link IterableChangeRecord_}를 제거합니다.
   *
   * 목록이 비어 있으면 맵에서도 제거됩니다.
   */
  remove(record: IterableChangeRecord_<V>): IterableChangeRecord_<V> {
    const key = record.trackById;
    const recordList: _DuplicateItemRecordList<V> = this.map.get(key)!;
    // 목록이 비어 있으면 제거
    if (recordList.remove(record)) {
      this.map.delete(key);
    }
    return record;
  }

  get isEmpty(): boolean {
    return this.map.size === 0;
  }

  clear() {
    this.map.clear();
  }
}

function getPreviousIndex(
  item: any,
  addRemoveOffset: number,
  moveOffsets: number[] | null,
): number {
  const previousIndex = item.previousIndex;
  if (previousIndex === null) return previousIndex;
  let moveOffset = 0;
  if (moveOffsets && previousIndex < moveOffsets.length) {
    moveOffset = moveOffsets[previousIndex];
  }
  return previousIndex + addRemoveOffset + moveOffset;
}
