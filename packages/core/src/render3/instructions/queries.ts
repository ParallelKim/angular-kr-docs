/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ProviderToken} from '../../di';
import {unwrapElementRef} from '../../linker/element_ref';
import {QueryList} from '../../linker/query_list';
import {QueryFlags} from '../interfaces/query';
import {
  createContentQuery,
  createViewQuery,
  getQueryResults,
  getTQuery,
  loadQueryInternal,
} from '../queries/query';
import {getCurrentQueryIndex, getLView, getTView, setCurrentQueryIndex} from '../state';
import {isCreationMode} from '../util/view_utils';

/**
 * 나중에 새로 고침을 위해 콘텐츠 쿼리와 연결된 QueryList를 등록합니다 (보기
 * 새로 고침의 일부).
 *
 * @param directiveIndex 현재 지시문 인덱스
 * @param predicate 쿼리가 검색할 유형
 * @param flags 쿼리와 관련된 플래그
 * @param read 쿼리에 저장할 내용
 * @returns QueryList<T>
 *
 * @codeGenApi
 */
export function ɵɵcontentQuery<T>(
  directiveIndex: number,
  predicate: ProviderToken<unknown> | string | string[],
  flags: QueryFlags,
  read?: any,
): void {
  createContentQuery<T>(directiveIndex, predicate, flags, read);
}

/**
 * 내부 데이터 구조를 초기화하여 새 뷰 쿼리를 생성합니다.
 *
 * @param predicate 쿼리가 검색할 유형
 * @param flags 쿼리와 관련된 플래그
 * @param read 쿼리에 저장할 내용
 *
 * @codeGenApi
 */
export function ɵɵviewQuery<T>(
  predicate: ProviderToken<unknown> | string | string[],
  flags: QueryFlags,
  read?: any,
): void {
  createViewQuery(predicate, flags, read);
}

/**
 * 모든 활성 뷰에서 일치 항목을 결합하고 삭제된
 * 뷰에서 일치 항목을 제거하여 쿼리를 새로 고칩니다.
 *
 * @returns 변경 감지 중 쿼리가 더러워졌거나 생성 모드에서 해결되는 정적 쿼리인 경우 `true`를 반환하고, 그렇지 않으면 `false`를 반환합니다.
 *
 * @codeGenApi
 */
export function ɵɵqueryRefresh(queryList: QueryList<any>): boolean {
  const lView = getLView();
  const tView = getTView();
  const queryIndex = getCurrentQueryIndex();

  setCurrentQueryIndex(queryIndex + 1);

  const tQuery = getTQuery(tView, queryIndex);
  if (
    queryList.dirty &&
    isCreationMode(lView) ===
      ((tQuery.metadata.flags & QueryFlags.isStatic) === QueryFlags.isStatic)
  ) {
    if (tQuery.matches === null) {
      queryList.reset([]);
    } else {
      const result = getQueryResults(lView, queryIndex);
      queryList.reset(result, unwrapElementRef);
      queryList.notifyOnChanges();
    }
    return true;
  }

  return false;
}

/**
 * 현재 뷰 또는 콘텐츠 쿼리에 해당하는 QueryList를 로드합니다.
 *
 * @codeGenApi
 */
export function ɵɵloadQuery<T>(): QueryList<T> {
  return loadQueryInternal<T>(getLView(), getCurrentQueryIndex());
}
