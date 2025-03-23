/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {KeyValueArray} from '../../util/array_utils';
import {assertNumber, assertNumberInRange} from '../../util/assert';

/**
 * 스타일을 다시 연결하는 데 필요한 `TData`에 저장된 값입니다.
 *
 * 참고: `TStylingKeyPrimitive` 및 `TStylingStatic`
 */
export type TStylingKey = TStylingKeyPrimitive | TStylingStatic;

/**
 * 스타일을 다시 연결하는 데 필요한 `TData`에 저장된 값의 원시 부분(`TStylingStatic`이 제거됨).
 *
 * - `string`: 속성 이름을 저장합니다. `ɵɵstyleProp`/`ɵɵclassProp` 지시어와 함께 사용됩니다.
 * - `null`: 맵을 나타내므로 이름이 없습니다. `ɵɵstyleMap`/`ɵɵclassMap`과 함께 사용됩니다.
 * - `false`: 무시 케이스를 나타냅니다. 이는 `ɵɵstyleProp`/`ɵɵclassProp` 지시어가
 *   입력 `@Input('class')`를 그림자 처리하는 지시어와 결합될 때 발생합니다. 이 경우 바인딩은
 *   스타일링 해석에 참여해서는 안 됩니다.
 */
export type TStylingKeyPrimitive = string | null | false;

/**
 * 스타일 바인딩에 대한 정적 값을 저장합니다.
 *
 * `TStylingStatic`은 키가 `""`(위치 0에 저장됨)이고 `TStylingKey`가
 * (위치 1에 저장됨) 포함된 `KeyValueArray`에 불과합니다. 즉, 이것은 `TStylingKey`를 포장하여
 * `""`가 포장된 값을 포함합니다.
 *
 * 지시어가 스타일을 해결할 때 값 해석을 위해 연결 목록을 앞으로하거나 뒤로 봐야 할 수 있습니다.
 * 이 때문에 연결 목록에도 정적 값이 포함되어야 합니다. 그러나 목록은 각 스타일링 지시어에 대해
 * 하나의 항목만 저장할 수 있습니다. 그렇기 때문에 우리는 이곳에 정적 값을 `TStylingKey`의 일부로 저장합니다.
 * 이는 값 해석 함수가 값을 찾을 때 바인딩 값을 먼저 살펴보고 나서 `TStylingKey`를 확인해야 함을 의미합니다
 * (존재하는 경우).
 *
 * 다음과 같은 경우를 상상해 보십시오:
 *
 * ```angular-ts
 * <div class="TEMPLATE" my-dir>
 *
 * @Directive({
 *   host: {
 *     class: 'DIR',
 *     '[class.dynamic]': 'exp' // ɵɵclassProp('dynamic', ctx.exp);
 *   }
 * })
 * ```
 *
 * 위의 경우 연결 목록은 하나의 항목을 포함합니다:
 *
 * ```ts
 *   // 바인딩 위치: 10으로 가정하여 `ɵɵclassProp('dynamic', ctx.exp);`
 *   tData[10] = <TStylingStatic>[
 *     '': 'dynamic', // 이것은 `TStylingKey`의 포장된 값입니다.
 *     'DIR': true,   // 이것은 지시어 바인딩의 기본 정적 값입니다.
 *   ];
 *   tData[10 + 1] = 0; // 이전/다음이 없습니다.
 *
 *   lView[10] = undefined;     // `ctx.exp`가 `undefined`라고 가정합니다.
 *   lView[10 + 1] = undefined; // 단순히 `lView[10]`을 정규화했습니다.
 * ```
 *
 * 따라서 함수가 스타일링 값을 해석할 때, 먼저 연결 목록을 살펴봐야하고
 * (없는 경우) 정적 `TStylingStatic`도 확인해야 하며, `dynamic`에 대한 기본 값이 있는지 확인합니다
 * (없는 경우). 따라서 제거해도 안전합니다.
 *
 * `true`를 설정하는 경우:
 * ```ts
 *   lView[10] = true;     // `ctx.exp`가 `true`라고 가정합니다.
 *   lView[10 + 1] = true; // 단순히 `lView[10]`을 정규화했습니다.
 * ```
 * 따라서 함수가 스타일링 값을 해석할 때, 먼저 연결 목록을 살펴봐야 하고
 * (없는 경우) `TNode.residualClass` (TNode.residualStyle)로 이동하고,
 * ```ts
 *   tNode.residualClass = [
 *     'TEMPLATE': true,
 *   ];
 * ```
 *
 * 이는 클래스를 추가해도 안전하다는 것을 의미합니다.
 */
export interface TStylingStatic extends KeyValueArray<any> {}

/**
 * 이것은 이전 및 다음 인덱스를 포함하는 브랜드 숫자입니다.
 *
 * 스타일 지시어를 만나면, 올바른 순서로 `TStylingKey`를 저장하여
 * 원하는 우선 순위로 스타일 값이 다시 연결되도록 합니다.
 *
 * 삽입은 다음에서 발생할 수 있습니다:
 * - 추가 스타일 지시어를 만나 템플릿 끝에서
 * - `hostBindings`의 추가 지시어를 만나 템플릿 앞에서
 *
 * 우리는 `TStylingRange`를 사용하여 템플릿 바인딩을 찾을 수 있는 `TData`에
 * 이전 및 다음 인덱스를 저장합니다.
 *
 * - 비트 0은 현재 값에 대한 이전 인덱스에 중복이 있음을 표시하는 데 사용됩니다.
 * - 비트 1은 현재 값에 대한 다음 인덱스에 중복이 있음을 표시하는 데 사용됩니다.
 * - 비트 2-16은 템플릿의 다음/끝을 인코딩하는 데 사용됩니다.
 * - 비트 17-32는 템플릿의 이전/시작을 인코딩하는 데 사용됩니다.
 *
 * NODE: *중복* false는 이 바인딩이 다른 바인딩과 충돌하지 않을 것이라는
 * 정적으로 알려진 것을 의미하므로 다른 바인딩을 확인할 필요가 없습니다.
 * 예를 들어 `<div [style.color]="exp" [style.width]="exp">`의 바인딩은 결코 충돌하지 않으며
 * 해당 비트는 적절하게 설정됩니다. 이전 중복은 현재 바인딩이 `null`일 때 이전을 확인해야 할 수 있음을
 * 의미합니다. 다음 중복은 현재 바인딩이 `null`이 아닐 때 다음 바인딩을 확인해야 할 수 있음을 의미합니다.
 *
 * NOTE: `0`은 특수한 의미를 가지며 `null`을 나타내며 추가 포인터가 없음을 의미합니다.
 */
export type TStylingRange = number & {
  __brand__: 'TStylingRange';
};

/**
 * 두 숫자와 중복 정보를 하나의 숫자로 인코딩하기 위한 상수 시프트 및 마스크입니다.
 */
export const enum StylingRange {
  /// 이전 포인터에 대한 비트 시프트 수
  PREV_SHIFT = 17,
  /// 이전 포인터 마스크.
  PREV_MASK = 0xfffe0000,

  /// 다음 포인터에 대한 비트 시프트 수
  NEXT_SHIFT = 2,
  /// 다음 포인터 마스크.
  NEXT_MASK = 0x001fffc,

  // 음수 비트를 제거하기 위한 마스크. (숫자를 양수로 해석)
  UNSIGNED_MASK = 0x7fff,

  /**
   * 이 비트는 이전 바인딩이 중복을 유발할 수 있는 바인딩을 포함하고 있음을 나타냅니다.
   * 예를 들어: `<div [style]="map" [style.width]="width">`, `width` 바인딩은
   * 이전 중복으로 설정됩니다. 이 경우 `width` 바인딩이 `null`이 되면, `map.width`에 값을
   * 지연시키는 것이 필요합니다. (왜냐하면 `width`가 `map.width`를 덮어쓰니까요.)
   */
  PREV_DUPLICATE = 0x02,

  /**
   * 이 비트는 다음 바인딩이 중복을 유발할 수 있는 바인딩을 포함하고 있음을 나타냅니다.
   * 예를 들어: `<div [style]="map" [style.width]="width">`, `map` 바인딩은
   * 다음 중복으로 설정됩니다. 이 경우 `map.width` 바인딩이 `null`이 아니게 되면, `width`에
   * 값을 지연시키는 것이 필요합니다. (왜냐하면 `width`가 `map.width`를 덮어쓰니까요.)
   */
  NEXT_DUPLICATE = 0x01,
}

export function toTStylingRange(prev: number, next: number): TStylingRange {
  ngDevMode && assertNumberInRange(prev, 0, StylingRange.UNSIGNED_MASK);
  ngDevMode && assertNumberInRange(next, 0, StylingRange.UNSIGNED_MASK);
  return ((prev << StylingRange.PREV_SHIFT) | (next << StylingRange.NEXT_SHIFT)) as TStylingRange;
}

export function getTStylingRangePrev(tStylingRange: TStylingRange): number {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  return (tStylingRange >> StylingRange.PREV_SHIFT) & StylingRange.UNSIGNED_MASK;
}

export function getTStylingRangePrevDuplicate(tStylingRange: TStylingRange): boolean {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  return (tStylingRange & StylingRange.PREV_DUPLICATE) == StylingRange.PREV_DUPLICATE;
}

export function setTStylingRangePrev(
  tStylingRange: TStylingRange,
  previous: number,
): TStylingRange {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  ngDevMode && assertNumberInRange(previous, 0, StylingRange.UNSIGNED_MASK);
  return ((tStylingRange & ~StylingRange.PREV_MASK) |
    (previous << StylingRange.PREV_SHIFT)) as TStylingRange;
}

export function setTStylingRangePrevDuplicate(tStylingRange: TStylingRange): TStylingRange {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  return (tStylingRange | StylingRange.PREV_DUPLICATE) as TStylingRange;
}

export function getTStylingRangeNext(tStylingRange: TStylingRange): number {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  return (tStylingRange & StylingRange.NEXT_MASK) >> StylingRange.NEXT_SHIFT;
}

export function setTStylingRangeNext(tStylingRange: TStylingRange, next: number): TStylingRange {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  ngDevMode && assertNumberInRange(next, 0, StylingRange.UNSIGNED_MASK);
  return ((tStylingRange & ~StylingRange.NEXT_MASK) | //
    (next << StylingRange.NEXT_SHIFT)) as TStylingRange;
}

export function getTStylingRangeNextDuplicate(tStylingRange: TStylingRange): boolean {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  return (tStylingRange & StylingRange.NEXT_DUPLICATE) === StylingRange.NEXT_DUPLICATE;
}

export function setTStylingRangeNextDuplicate(tStylingRange: TStylingRange): TStylingRange {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  return (tStylingRange | StylingRange.NEXT_DUPLICATE) as TStylingRange;
}

export function getTStylingRangeTail(tStylingRange: TStylingRange): number {
  ngDevMode && assertNumber(tStylingRange, 'expected number');
  const next = getTStylingRangeNext(tStylingRange);
  return next === 0 ? getTStylingRangePrev(tStylingRange) : next;
}
