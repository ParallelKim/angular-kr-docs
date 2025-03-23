/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Observable, Subject} from 'rxjs';

import {EventEmitter} from '../event_emitter';
import {Writable} from '../interface/type';
import {arrayEquals, flatten} from '../util/array_utils';

function symbolIterator<T>(this: QueryList<T>): Iterator<T> {
  // @ts-expect-error accessing a private member
  return this._results[Symbol.iterator]();
}

/**
 * Angular가 응용 프로그램의 상태가 변경될 때 업데이트하는 변경할 수 없는 항목 목록입니다.
 *
 * {@link ViewChildren}, {@link ContentChildren}, 및 {@link QueryList}
 * 가 제공하는 객체 유형입니다.
 *
 * iterable 인터페이스를 구현하므로 ES6
 * 자바스크립트 `for (var i of items)` 루프와 Angular 템플릿에서
 * `*ngFor="let i of myList"`와 동시에 사용할 수 있습니다.
 *
 * 변경 사항은 변경 `Observable`에 구독하여 관찰할 수 있습니다.
 *
 * 주의: 미래에 이 클래스는 `Observable` 인터페이스를 구현할 것입니다.
 *
 * @usageNotes
 * ### 예제
 * ```ts
 * @Component({...})
 * class Container {
 *   @ViewChildren(Item) items:QueryList<Item>;
 * }
 * ```
 *
 * @publicApi
 */
export class QueryList<T> implements Iterable<T> {
  public readonly dirty = true;
  private _onDirty?: () => void = undefined;
  private _results: Array<T> = [];
  private _changesDetected: boolean = false;
  private _changes: Subject<QueryList<T>> | undefined = undefined;

  readonly length: number = 0;
  readonly first: T = undefined!;
  readonly last: T = undefined!;

  /**
   * 변경 사항을 알리는 `QueryList`의 `Observable`을 반환합니다.
   */
  get changes(): Observable<any> {
    return (this._changes ??= new Subject());
  }

  /**
   * @param emitDistinctChangesOnly 실제 변경이 발생할 때만 `QueryList.changes`가 발생해야 하는지.
   *     또는 쿼리가 재계산될 때 발생해야 하는지 여부. (재계산이 동일한 결과로 이어질 수 있음)
   */
  constructor(private _emitDistinctChangesOnly: boolean = false) {}

  /**
   * `index`에서 QueryList 항목을 반환합니다.
   */
  get(index: number): T | undefined {
    return this._results[index];
  }

  /**
   * See
   * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
   */
  map<U>(fn: (item: T, index: number, array: T[]) => U): U[] {
    return this._results.map(fn);
  }

  /**
   * See
   * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
   */
  filter<S extends T>(predicate: (value: T, index: number, array: readonly T[]) => value is S): S[];
  filter(predicate: (value: T, index: number, array: readonly T[]) => unknown): T[];
  filter(fn: (item: T, index: number, array: T[]) => boolean): T[] {
    return this._results.filter(fn);
  }

  /**
   * See
   * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
   */
  find(fn: (item: T, index: number, array: T[]) => boolean): T | undefined {
    return this._results.find(fn);
  }

  /**
   * See
   * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
   */
  reduce<U>(fn: (prevValue: U, curValue: T, curIndex: number, array: T[]) => U, init: U): U {
    return this._results.reduce(fn, init);
  }

  /**
   * See
   * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
   */
  forEach(fn: (item: T, index: number, array: T[]) => void): void {
    this._results.forEach(fn);
  }

  /**
   * See
   * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
   */
  some(fn: (value: T, index: number, array: T[]) => boolean): boolean {
    return this._results.some(fn);
  }

  /**
   * 내부 결과 목록의 복사본을 배열로 반환합니다.
   */
  toArray(): T[] {
    return this._results.slice();
  }

  toString(): string {
    return this._results.toString();
  }

  /**
   * 쿼리 목록의 저장된 데이터를 업데이트하고 `dirty` 플래그를 `false`로 재설정하여
   * 변경 감지시 쿼리에 대한 변경 사항을 알리지 않도록 하며, 새 변경 사항이 발생하지 않는 한
   * 알리지 않습니다.
   *
   * @param resultsTree 저장할 쿼리 결과
   * @param identityAccessor 안정적인 객체 식별성을 값에서 추출하기 위한 선택적 함수
   *    배열의. 이 함수는 쿼리 결과 목록의 각 요소에 대해 실행되며
   *    현재 쿼리 목록과 새 쿼리 목록(첫 번째 인수로 제공됨)을 비교하여
   *    목록이 다른지 확인합니다. 함수가 제공되지 않으면 요소는
   *    있는 그대로 비교됩니다 (사전 처리 없이).
   */
  reset(resultsTree: Array<T | any[]>, identityAccessor?: (value: T) => unknown): void {
    (this as {dirty: boolean}).dirty = false;
    const newResultFlat = flatten(resultsTree);
    if ((this._changesDetected = !arrayEquals(this._results, newResultFlat, identityAccessor))) {
      this._results = newResultFlat;
      (this as Writable<this>).length = newResultFlat.length;
      (this as Writable<this>).last = newResultFlat[this.length - 1];
      (this as Writable<this>).first = newResultFlat[0];
    }
  }

  /**
   * `changes` {@link EventEmitter}에서 방출하여 변경 이벤트를 발생시킵니다.
   */
  notifyOnChanges(): void {
    if (this._changes !== undefined && (this._changesDetected || !this._emitDistinctChangesOnly))
      this._changes.next(this);
  }

  /** @internal */
  onDirty(cb: () => void) {
    this._onDirty = cb;
  }

  /** internal */
  setDirty() {
    (this as {dirty: boolean}).dirty = true;
    this._onDirty?.();
  }

  /** internal */
  destroy(): void {
    if (this._changes !== undefined) {
      this._changes.complete();
      this._changes.unsubscribe();
    }
  }

  [Symbol.iterator]: () => Iterator<T> = /** @__PURE__*/ (() => symbolIterator)();
}
