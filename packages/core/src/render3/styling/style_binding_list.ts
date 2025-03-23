/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {KeyValueArray, keyValueArrayIndexOf} from '../../util/array_utils';
import {assertEqual, assertIndexInRange, assertNotEqual} from '../../util/assert';
import {assertFirstUpdatePass} from '../assert';
import {TNode} from '../interfaces/node';
import {
  getTStylingRangeNext,
  getTStylingRangePrev,
  setTStylingRangeNext,
  setTStylingRangeNextDuplicate,
  setTStylingRangePrev,
  setTStylingRangePrevDuplicate,
  toTStylingRange,
  TStylingKey,
  TStylingKeyPrimitive,
  TStylingRange,
} from '../interfaces/styling';
import {TData} from '../interfaces/view';
import {getTView} from '../state';

/**
 * 주의: "styling"이라는 단어는 스타일 또는 클래스 스타일링으로 서로 바꿔 사용할 수 있습니다.
 *
 * 이 파일은 스타일링 지침들을 연결하여 우선 순위 순서로 재생할 수 있도록 하는 코드를 포함합니다.
 * 이 파일은 Ivy 스타일링 지침 실행 순서가 우선 순위 순서와 일치하지 않기 때문에 존재합니다.
 * 이 코드는 스타일을 계산할 때 지침을 우선 순위 순서로 탐색할 수 있도록 연결 리스트를 생성하는 것이 목적입니다.
 *
 * 다음 코드와 관련이 있다고 가정해 보세요:
 * ```angular-ts
 * @Component({
 *   template: `
 *     <my-cmp [style]=" {color: '#001'} "
 *             [style.color]=" #002 "
 *             dir-style-color-1
 *             dir-style-color-2> `
 * })
 * class ExampleComponent {
 *   static ngComp = ... {
 *     ...
 *     // 컴파일러는 `ɵɵstyleProp`가 `ɵɵstyleMap` 이후에 오도록 보장합니다.
 *     ɵɵstyleMap({color: '#001'});
 *     ɵɵstyleProp('color', '#002');
 *     ...
 *   }
 * }
 *
 * @Directive({
 *   selector: `[dir-style-color-1]',
 * })
 * class Style1Directive {
 *   @HostBinding('style') style = {color: '#005'};
 *   @HostBinding('style.color') color = '#006';
 *
 *   static ngDir = ... {
 *     ...
 *     // 컴파일러는 `ɵɵstyleProp`가 `ɵɵstyleMap` 이후에 오도록 보장합니다.
 *     ɵɵstyleMap({color: '#005'});
 *     ɵɵstyleProp('color', '#006');
 *     ...
 *   }
 * }
 *
 * @Directive({
 *   selector: `[dir-style-color-2]',
 * })
 * class Style2Directive {
 *   @HostBinding('style') style = {color: '#007'};
 *   @HostBinding('style.color') color = '#008';
 *
 *   static ngDir = ... {
 *     ...
 *     // 컴파일러는 `ɵɵstyleProp`가 `ɵɵstyleMap` 이후에 오도록 보장합니다.
 *     ɵɵstyleMap({color: '#007'});
 *     ɵɵstyleProp('color', '#008');
 *     ...
 *   }
 * }
 *
 * @Directive({
 *   selector: `my-cmp',
 * })
 * class MyComponent {
 *   @HostBinding('style') style = {color: '#003'};
 *   @HostBinding('style.color') color = '#004';
 *
 *   static ngComp = ... {
 *     ...
 *     // 컴파일러는 `ɵɵstyleProp`가 `ɵɵstyleMap` 이후에 오도록 보장합니다.
 *     ɵɵstyleMap({color: '#003'});
 *     ɵɵstyleProp('color', '#004');
 *     ...
 *   }
 * }
 * ```
 *
 * 지침 실행 순서:
 *
 * 주의: 주석 바인딩 위치는 설명을 위해서만 제공됩니다.
 *
 * ```ts
 * // 템플릿: (ExampleComponent)
 *     ɵɵstyleMap({color: '#001'});   // 바인딩 인덱스: 10
 *     ɵɵstyleProp('color', '#002');  // 바인딩 인덱스: 12
 * // MyComponent
 *     ɵɵstyleMap({color: '#003'});   // 바인딩 인덱스: 20
 *     ɵɵstyleProp('color', '#004');  // 바인딩 인덱스: 22
 * // Style1Directive
 *     ɵɵstyleMap({color: '#005'});   // 바인딩 인덱스: 24
 *     ɵɵstyleProp('color', '#006');  // 바인딩 인덱스: 26
 * // Style2Directive
 *     ɵɵstyleMap({color: '#007'});   // 바인딩 인덱스: 28
 *     ɵɵstyleProp('color', '#008');  // 바인딩 인덱스: 30
 * ```
 *
 * 올바른 연결의 우선 순위는 다음과 같습니다:
 *
 * ```ts
 * // MyComponent
 *     ɵɵstyleMap({color: '#003'});   // 바인딩 인덱스: 20
 *     ɵɵstyleProp('color', '#004');  // 바인딩 인덱스: 22
 * // Style1Directive
 *     ɵɵstyleMap({color: '#005'});   // 바인딩 인덱스: 24
 *     ɵɵstyleProp('color', '#006');  // 바인딩 인덱스: 26
 * // Style2Directive
 *     ɵɵstyleMap({color: '#007'});   // 바인딩 인덱스: 28
 *     ɵɵstyleProp('color', '#008');  // 바인딩 인덱스: 30
 * // 템플릿: (ExampleComponent)
 *     ɵɵstyleMap({color: '#001'});   // 바인딩 인덱스: 10
 *     ɵɵstyleProp('color', '#002');  // 바인딩 인덱스: 12
 * ```
 *
 * 어떤 색상이 렌더링 되어야 할까요?
 *
 * 아이템이 목록에서 올바르게 정렬되면, 답은 단순히 연결 목록의 마지막 아이템인 `#002`입니다.
 *
 * 이를 위해 우리는 이 요소와 관련된 모든 바인딩의 연결 리스트를 유지합니다.
 * 바인딩은 실행 순서에 따라 삽입되지만, `TView.data`는 우선 순위 순서로 탐색할 수 있도록 합니다.
 *
 * |Idx|`TView.data`|`LView`          | 비고
 * |---|------------|-----------------|--------------
 * |...|            |                 |
 * |10 |`null`      |`{color: '#001'}`| `ɵɵstyleMap('color', {color: '#001'})`
 * |11 |`30 | 12`   | ...             |
 * |12 |`color`     |`'#002'`         | `ɵɵstyleProp('color', '#002')`
 * |13 |`10 | 0`    | ...             |
 * |...|            |                 |
 * |20 |`null`      |`{color: '#003'}`| `ɵɵstyleMap('color', {color: '#003'})`
 * |21 |`0 | 22`    | ...             |
 * |22 |`color`     |`'#004'`         | `ɵɵstyleProp('color', '#004')`
 * |23 |`20 | 24`   | ...             |
 * |24 |`null`      |`{color: '#005'}`| `ɵɵstyleMap('color', {color: '#005'})`
 * |25 |`22 | 26`   | ...             |
 * |26 |`color`     |`'#006'`         | `ɵɵstyleProp('color', '#006')`
 * |27 |`24 | 28`   | ...             |
 * |28 |`null`      |`{color: '#007'}`| `ɵɵstyleMap('color', {color: '#007'})`
 * |29 |`26 | 30`   | ...             |
 * |30 |`color`     |`'#008'`         | `ɵɵstyleProp('color', '#008')`
 * |31 |`28 | 10`   | ...             |
 *
 * 위의 데이터 구조는 어떤 데이터 바인딩이 변경되더라도 스타일링을 재결합할 수 있게 해줍니다.
 *
 * 주의: 다음/이전 인덱스를 추적하는 것 외에도 `TView.data`는 이전/다음 중복 비트를 저장합니다.
 * 중복 비트가 true일 경우, 동일한 이름을 가진 바인딩이 존재하거나 해당 이름을 포함할 수 있는 맵이 있다는 것을 의미합니다. 이 정보는 우선 순위가 더 높은 다른 스타일을 검색해야 할 필요성을 아는 데 유용합니다.
 *
 * 주의: 작동 예제는 `tnode_linked_list_spec.ts`의 `tnode_linked_list.ts` 문서에서 확인할 수 있습니다.
 */
let __unused_const_as_closure_does_not_like_standalone_comment_blocks__: undefined;

/**
 * 새로운 `tStyleValue`를 `TData`에 삽입하고 기존 스타일 바인딩을 연결하여 연결 리스트를 유지하고 중복 플래그를 계산합니다.
 *
 * 참고: 이 함수는 `firstUpdatePass` 동안에만 실행되어 `TView.data`를 채웁니다.
 *
 * 이 함수는 스타일의 템플릿 부분의 머리/꼬리를 가리키는 두 개의 포인터를 포함하는 `tStylingRange`를 추적하여 작동합니다.
 *  - `isHost === false`인 경우(템플릿일 때) `TStylingRange`의 꼬리에 삽입됩니다.
 *  - `isHost === true`인 경우(호스트 바인딩일 때) `TStylingRange`의 머리에 삽입됩니다.
 *
 * @param tData 삽입할 `TData`.
 * @param tNode 스타일링 요소와 관련된 `TNode`.
 * @param tStylingKey `TStylingKey` 참조.
 * @param index `tStyleValue`가 저장(및 리스트에 연결)되어야 하는 위치.
 * @param isHostBinding `true`이면 삽입이 `hostBinding`에 해당합니다. (삽입은 템플릿 앞에 이루어집니다.)
 * @param isClassBinding `true`이면 관련된 `tStylingKey`가 `class` 스타일링입니다.
 *                       `tNode.classBindings`를 사용해야 하며 (그렇지 않으면 `tNode.styleBindings` 사용).
 */
export function insertTStylingBinding(
  tData: TData,
  tNode: TNode,
  tStylingKeyWithStatic: TStylingKey,
  index: number,
  isHostBinding: boolean,
  isClassBinding: boolean,
): void {
  ngDevMode && assertFirstUpdatePass(getTView());
  let tBindings = isClassBinding ? tNode.classBindings : tNode.styleBindings;
  let tmplHead = getTStylingRangePrev(tBindings);
  let tmplTail = getTStylingRangeNext(tBindings);

  tData[index] = tStylingKeyWithStatic;
  let isKeyDuplicateOfStatic = false;
  let tStylingKey: TStylingKeyPrimitive;
  if (Array.isArray(tStylingKeyWithStatic)) {
    // 여기서는 `TStylingKey`가 정적 필드를 포함하는 경우입니다.
    const staticKeyValueArray = tStylingKeyWithStatic as KeyValueArray<any>;
    tStylingKey = staticKeyValueArray[1]; // 해제.
    // 정적에서 우리의 키가 존재하는지 확인하여 중복으로 표시할 수 있습니다.
    if (
      tStylingKey === null ||
      keyValueArrayIndexOf(staticKeyValueArray, tStylingKey as string) > 0
    ) {
      // tStylingKey는 정적에 존재하므로 중복으로 표시해야 합니다.
      isKeyDuplicateOfStatic = true;
    }
  } else {
    tStylingKey = tStylingKeyWithStatic;
  }
  if (isHostBinding) {
    // 호스트 바인딩을 삽입하고 있습니다.

    // 템플릿 바인딩이 없으면 `tail`은 0입니다.
    const hasTemplateBindings = tmplTail !== 0;
    // 이것은 중요합니다. 즉, `head`가 첫 번째 템플릿 바인딩을 가리킬 수 없다는 것을 의미합니다 (없기 때문입니다).
    // 대신 `head`는 템플릿의 꼬리를 가리킵니다.
    if (hasTemplateBindings) {
      // 템플릿 헤드의 "이전"은 마지막 호스트 바인딩 또는 호스트 바인딩이 없으면 0을 가리킵니다.
      const previousNode = getTStylingRangePrev(tData[tmplHead + 1] as TStylingRange);
      tData[index + 1] = toTStylingRange(previousNode, tmplHead);
      // 이미 등록된 호스트 바인딩이 있다면, 그 호스트 바인딩의 다음을 현재로 가리키게 업데이트해야 합니다.
      if (previousNode !== 0) {
        // 템플릿-테일 값을 현재로 업데이트해야 합니다.
        tData[previousNode + 1] = setTStylingRangeNext(
          tData[previousNode + 1] as TStylingRange,
          index,
        );
      }
      // 템플릿 바인딩 헤드의 "이전"은 이 호스트 바인딩을 가리켜야 합니다.
      tData[tmplHead + 1] = setTStylingRangePrev(tData[tmplHead + 1] as TStylingRange, index);
    } else {
      tData[index + 1] = toTStylingRange(tmplHead, 0);
      // 호스트 바인딩이 이미 등록되었다면, 그 호스트 바인딩의 다음을 현재로 가리키게 업데이트해야 합니다.
      if (tmplHead !== 0) {
        // 템플릿-테일 값을 현재로 업데이트해야 합니다.
        tData[tmplHead + 1] = setTStylingRangeNext(tData[tmplHead + 1] as TStylingRange, index);
      }
      // 템플릿이 없으면 머리는 템플릿-테일을 가리키고 진행해야 합니다.
      tmplHead = index;
    }
  } else {
    // 템플릿 섹션에 삽입하고 있습니다.
    // 이 바인딩의 "이전"을 현재 템플릿 테일로 설정해야 합니다.
    tData[index + 1] = toTStylingRange(tmplTail, 0);
    ngDevMode &&
      assertEqual(
        tmplHead !== 0 && tmplTail === 0,
        false,
        '호스트 바인딩 이후에 템플릿 바인딩을 추가하는 것은 허용되지 않습니다.',
      );
    if (tmplHead === 0) {
      tmplHead = index;
    } else {
      // 이전 값의 "다음"을 현재 바인딩을 가리키도록 업데이트해야 합니다.
      tData[tmplTail + 1] = setTStylingRangeNext(tData[tmplTail + 1] as TStylingRange, index);
    }
    tmplTail = index;
  }

  // 이제 중복을 업데이트/계산해야 합니다.
  // 머리를 향한 위치 검색으로 시작합니다 (우선 순위가 낮음)
  if (isKeyDuplicateOfStatic) {
    tData[index + 1] = setTStylingRangePrevDuplicate(tData[index + 1] as TStylingRange);
  }
  markDuplicates(tData, tStylingKey, index, true);
  markDuplicates(tData, tStylingKey, index, false);
  markDuplicateOfResidualStyling(tNode, tStylingKey, tData, index, isClassBinding);

  tBindings = toTStylingRange(tmplHead, tmplTail);
  if (isClassBinding) {
    tNode.classBindings = tBindings;
  } else {
    tNode.styleBindings = tBindings;
  }
}

/**
 * 잔여 스타일링을 살펴보고 현재 `tStylingKey`가 잔여의 중복인지 확인합니다.
 *
 * @param tNode 잔여가 저장된 `TNode`.
 * @param tStylingKey 저장할 `TStylingKey`.
 * @param tData 현재 `LView`와 관련된 `TData`.
 * @param index `tStyleValue`가 저장(및 리스트에 연결)되어야 하는 위치.
 * @param isClassBinding `true`이면 관련된 `tStylingKey`가 `class` 스타일링입니다.
 *                       `tNode.classBindings`를 사용해야 하며 (그렇지 않으면 `tNode.styleBindings` 사용).
 */
function markDuplicateOfResidualStyling(
  tNode: TNode,
  tStylingKey: TStylingKey,
  tData: TData,
  index: number,
  isClassBinding: boolean,
) {
  const residual = isClassBinding ? tNode.residualClasses : tNode.residualStyles;
  if (
    residual != null /* 또는 undefined */ &&
    typeof tStylingKey == 'string' &&
    keyValueArrayIndexOf(residual, tStylingKey) >= 0
  ) {
    // 잔여에서 중복이 있으므로 자신을 중복으로 표시합니다.
    tData[index + 1] = setTStylingRangeNextDuplicate(tData[index + 1] as TStylingRange);
  }
}

/**
 * 리스트의 다른 스타일 바인딩이 동일한 `TStyleValue`를 가진 경우 중복으로 `TStyleValue`를 표시합니다.
 *
 * 주의: 이 함수는 `isPrevDir`가 `true`로 설정된 상태에서 한 번, `false`로 설정된 상태에서 한 번 호출되도록 설계되었습니다. 두 가지 모두 이전 및 다음 항목을 검색합니다.
 *
 * 중복이 없는 경우
 * ```
 *   [style.color]
 *   [style.width.px] <<- 인덱스
 *   [style.height.px]
 * ```
 *
 * 위의 경우에 `[style.width.px]`를 기존의 `[style.color]`에 추가해도 중복이 발생하지 않습니다. 왜냐하면 `width`는 연결 리스트의 다른 부분에서 발견되지 않기 때문입니다.
 *
 * 중복 사례
 * ```
 *   [style.color]
 *   [style.width.em]
 *   [style.width.px] <<- 인덱스
 * ```
 * 위의 경우에 `[style.width.px]`를 추가하면 `[style.width.em]`과 중복이 발생합니다. 이는 `width`가 체인에서 발견되기 때문입니다.
 *
 * 맵 경우 1
 * ```
 *   [style.width.px]
 *   [style.color]
 *   [style]  <<- 인덱스
 * ```
 * 위의 경우에 `[style]`를 추가하면 다른 바인딩과 중복이 발생합니다. 왜냐하면 `[style]`는 맵이므로 완전히 동적이며 `color` 또는 `width`를 생성할 수 있기 때문입니다.
 *
 * 맵 경우 2
 * ```
 *   [style]
 *   [style.width.px]
 *   [style.color]  <<- 인덱스
 * ```
 * 위의 경우에 `[style.color]`를 추가하면 이미 `[style]` 바인딩이 있어야 하므로 중복이 발생합니다. 이는 맵이므로 완전히 동적이며 `color` 또는 `width`를 생성할 수 있기 때문입니다.
 *
 * 주의: 시스템에 `[style]`(맵)이 추가되면 모든 것이 중복으로 매핑됩니다.
 * 주의: `style`을 예시로 사용하였지만 같은 로직이 `class`에도 적용됩니다.
 *
 * @param tData 연결 리스트가 저장된 `TData`.
 * @param tStylingKey `TStylingKeyPrimitive`로 연결 리스트의 다른 키와 비교할 값을 포함합니다.
 * @param index 연결 리스트에서 검색을 시작할 위치.
 * @param isPrevDir 방향.
 *        - `true`는 이전(우선 순위가 낮음);
 *        - `false`는 다음(우선 순위가 높음).
 */
function markDuplicates(
  tData: TData,
  tStylingKey: TStylingKeyPrimitive,
  index: number,
  isPrevDir: boolean,
) {
  const tStylingAtIndex = tData[index + 1] as TStylingRange;
  const isMap = tStylingKey === null;
  let cursor = isPrevDir
    ? getTStylingRangePrev(tStylingAtIndex)
    : getTStylingRangeNext(tStylingAtIndex);
  let foundDuplicate = false;
  // 우리는 커서가 있는 한 계속 반복합니다
  // 그리고
  // - 우리가 찾고 있는 것을 발견했거나,
  // - 맵이며, 우리가 찾고 있는 것을 발견했더라도 계속 검색해야 해야만 중복으로 바뀌기 때문입니다.
  while (cursor !== 0 && (foundDuplicate === false || isMap)) {
    ngDevMode && assertIndexInRange(tData, cursor);
    const tStylingValueAtCursor = tData[cursor] as TStylingKey;
    const tStyleRangeAtCursor = tData[cursor + 1] as TStylingRange;
    if (isStylingMatch(tStylingValueAtCursor, tStylingKey)) {
      foundDuplicate = true;
      tData[cursor + 1] = isPrevDir
        ? setTStylingRangeNextDuplicate(tStyleRangeAtCursor)
        : setTStylingRangePrevDuplicate(tStyleRangeAtCursor);
    }
    cursor = isPrevDir
      ? getTStylingRangePrev(tStyleRangeAtCursor)
      : getTStylingRangeNext(tStyleRangeAtCursor);
  }
  if (foundDuplicate) {
    // 중복이 발견되면, 자신을 표시합니다.
    tData[index + 1] = isPrevDir
      ? setTStylingRangePrevDuplicate(tStylingAtIndex)
      : setTStylingRangeNextDuplicate(tStylingAtIndex);
  }
}

/**
 * 두 개의 `TStylingKey`가 일치하는지 결정합니다.
 *
 * 바인딩에 중복이 포함되어 있는지 계산하는 동안, 우리는 지침 `TStylingKey`가 일치하는지 비교해야 합니다.
 *
 * 다음과 같은 `TStylingKey`의 예가 주어졌을 때 `tStylingKeyCursor`가 일치하는 경우:
 * - `color`
 *    - `color`    // 다른 색상과 일치
 *    - `null`     // 즉, `tStylingKey`는 `classMap`/`styleMap` 지침임을 의미
 *    - `['', 'color', 'other', true]` // 래핑된 `color`로 일치
 *    - `['', null, 'other', true]`       // 래핑된 `null`로 일치
 *    - `['', 'width', 'color', 'value']` // 래핑된 정적 값에 `'color'`에 대한 일치 포함
 * - `null`       // `tStylingKeyCursor`는 항상 `classMap`/`styleMap` 지침과 일치
 *
 * @param tStylingKeyCursor
 * @param tStylingKey
 */
function isStylingMatch(tStylingKeyCursor: TStylingKey, tStylingKey: TStylingKeyPrimitive) {
  ngDevMode &&
    assertNotEqual(Array.isArray(tStylingKey), true, "'tStylingKey'가 해제되었다고 기대합니다.");
  if (
    tStylingKeyCursor === null || // 커서가 `null`이면 그 위치에 맵이 있다는 것을 의미하므로 우리는 일치한다고 가정합니다.
    tStylingKey == null || // `tStylingKey`가 `null`이면 맵이라는 것이므로 일치한다고 가정합니다.
    (Array.isArray(tStylingKeyCursor) ? tStylingKeyCursor[1] : tStylingKeyCursor) === tStylingKey // 키가 명시적으로 일치하면 일치합니다.
  ) {
    return true;
  } else if (Array.isArray(tStylingKeyCursor) && typeof tStylingKey === 'string') {
    // 일치를 발견하지 못한 경우, 하지만 `tStylingKeyCursor`가 `KeyValueArray` 경우, 커서가 정적을 가리킵니다.
    // 그리고 우리는 그것 역시 확인해야 합니다.
    return keyValueArrayIndexOf(tStylingKeyCursor, tStylingKey) >= 0; // 키가 일치하는지 확인합니다.
  }
  return false;
}
