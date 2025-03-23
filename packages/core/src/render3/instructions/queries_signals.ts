/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ProviderToken} from '../../di/provider_token';
import {QueryFlags} from '../interfaces/query';
import {createContentQuery, createViewQuery} from '../queries/query';
import {bindQueryToSignal} from '../queries/query_reactive';
import {Signal} from '../reactivity/api';
import {getCurrentQueryIndex, setCurrentQueryIndex} from '../state';

/**
 * 새로운 콘텐츠 쿼리를 생성하고 저자화 함수에 의해 생성된 신호에 바인딩합니다.
 *
 * @param directiveIndex 현재 디렉티브 인덱스
 * @param target 쿼리를 바인딩할 대상 신호
 * @param predicate 쿼리가 검색할 유형
 * @param flags 쿼리와 관련된 플래그
 * @param read 쿼리에 저장할 내용
 *
 * @codeGenApi
 */
export function ɵɵcontentQuerySignal<T>(
  directiveIndex: number,
  target: Signal<T>,
  predicate: ProviderToken<unknown> | string[],
  flags: QueryFlags,
  read?: any,
): void {
  bindQueryToSignal(target, createContentQuery(directiveIndex, predicate, flags, read));
}

/**
 * 내부 데이터 구조를 초기화하고 새로운 쿼리를 대상 신호에 바인딩하여 새로운 뷰 쿼리를 생성합니다.
 *
 * @param target 쿼리 결과를 할당할 대상 신호
 * @param predicate 주어진 쿼리와 일치해야 하는 유형 또는 레이블
 * @param flags 쿼리와 관련된 플래그
 * @param read 쿼리에 저장할 내용
 *
 * @codeGenApi
 */
export function ɵɵviewQuerySignal(
  target: Signal<unknown>,
  predicate: ProviderToken<unknown> | string[],
  flags: QueryFlags,
  read?: ProviderToken<unknown>,
): void {
  bindQueryToSignal(target, createViewQuery(predicate, flags, read));
}

/**
 * 현재 쿼리 인덱스를 지정된 오프셋만큼 증가시킵니다.
 *
 * 현재 쿼리 인덱스를 조정하는 것은 주어진 디렉티브가 영역 기반 쿼리와 신호 기반 쿼리를 혼합할 때 필요합니다.
 * 신호 기반 쿼리는 현재 인덱스를 추적할 필요가 없으며(변경 감지 중에가 아니라 수요에 따라 새로 고쳐집니다)
 * 따라서 이 지침은 이전 호환성에만 필요합니다.
 *
 * @param index 오프셋을 현재 쿼리 인덱스에 적용하기 위한 값 (기본값은 1)
 *
 * @codeGenApi
 */
export function ɵɵqueryAdvance(indexOffset: number = 1): void {
  setCurrentQueryIndex(getCurrentQueryIndex() + indexOffset);
}
