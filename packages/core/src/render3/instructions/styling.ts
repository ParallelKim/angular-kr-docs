/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {SafeValue, unwrapSafeValue} from '../../sanitization/bypass';
import {KeyValueArray, keyValueArrayGet, keyValueArraySet} from '../../util/array_utils';
import {
  assertDefined,
  assertEqual,
  assertLessThan,
  assertNotEqual,
  throwError,
} from '../../util/assert';
import {EMPTY_ARRAY} from '../../util/empty';
import {concatStringsWithSpace, stringify} from '../../util/stringify';
import {assertFirstUpdatePass} from '../assert';
import {bindingUpdated} from '../bindings';
import {AttributeMarker} from '../interfaces/attribute_marker';
import {DirectiveDef} from '../interfaces/definition';
import {TAttributes, TNode, TNodeFlags, TNodeType} from '../interfaces/node';
import {Renderer} from '../interfaces/renderer';
import {RElement} from '../interfaces/renderer_dom';
import {
  getTStylingRangeNext,
  getTStylingRangeNextDuplicate,
  getTStylingRangePrev,
  getTStylingRangePrevDuplicate,
  TStylingKey,
  TStylingRange,
} from '../interfaces/styling';
import {LView, RENDERER, TData, TView} from '../interfaces/view';
import {applyStyling} from '../node_manipulation';
import {
  getCurrentDirectiveDef,
  getLView,
  getSelectedIndex,
  getTView,
  incrementBindingIndex,
} from '../state';
import {insertTStylingBinding} from '../styling/style_binding_list';
import {
  getLastParsedKey,
  getLastParsedValue,
  parseClassName,
  parseClassNameNext,
  parseStyle,
  parseStyleNext,
} from '../styling/styling_parser';
import {NO_CHANGE} from '../tokens';
import {getNativeByIndex} from '../util/view_utils';

import {setDirectiveInputsWhichShadowsStyling} from './property';

/**
 * 주어진 값으로 요소의 스타일 바인딩을 업데이트합니다.
 *
 * 스타일 값이 falsy인 경우 요소에서 제거됩니다
 * (또는 스타일이 있는 경우, `styleMap` 또는 요소가 `styling`으로 생성될 때부터
 * 존재했던 정적 스타일에 따라 다른 값이 할당됩니다).
 *
 * 스타일링 요소는 `stylingApply`의 일부로 업데이트됩니다.
 *
 * @param prop 유효한 CSS 속성.
 * @param value 새로 작성할 값(`null` 또는 빈 문자열로 제거).
 * @param suffix 선택적 접미사. 스칼라 값과 함께 사용하여 `px`와 같은 단위를 추가합니다.
 *
 * 이 함수는 호스트 바인딩 함수 내에서 호출되는 경우 제공된 스타일 값을 호스트 요소에 적용합니다.
 *
 * @codeGenApi
 */
export function ɵɵstyleProp(
  prop: string,
  value: string | number | SafeValue | undefined | null,
  suffix?: string | null,
): typeof ɵɵstyleProp {
  checkStylingProperty(prop, value, suffix, false);
  return ɵɵstyleProp;
}

/**
 * 주어진 값으로 요소의 클래스 바인딩을 업데이트합니다.
 *
 * 이 명령은 `[class.foo]="exp"`의 경우를 처리하도록 설계되었으므로,
 * 클래스 바인딩 자체는 생성 블록 내에서
 * `styling`을 사용하여 이미 할당되어야 합니다.
 *
 * @param prop 유효한 CSS 클래스(하나만).
 * @param value 클래스를 켜거나 끄는 true/false 값.
 *
 * 이 함수는 호스트 바인딩 함수 내에서 호출되는 경우 제공된 클래스 값을 호스트 요소에 적용됩니다.
 *
 * @codeGenApi
 */
export function ɵɵclassProp(
  className: string,
  value: boolean | undefined | null,
): typeof ɵɵclassProp {
  checkStylingProperty(className, value, null, true);
  return ɵɵclassProp;
}

/**
 * 요소에 대한 개체 리터럴을 사용하여 스타일 바인딩을 업데이트합니다.
 *
 * 이 명령은 `[style]="exp"` 템플릿 바인딩을 통해 스타일링을 적용하는 것을 목표로 합니다.
 * 스타일이 요소에 적용되면, `styleProp`을 통해 설정된
 * 모든 스타일/클래스를 고려하여 업데이트됩니다. falsy인 스타일이 있을 경우,
 * 요소에서 제거됩니다.
 *
 * 주의: 스타일링 명령은 `stylingApply`가 호출될 때까지 적용되지 않습니다.
 *
 * @param styles 주어진 요소에 적용될 스타일의 키/값 스타일 맵.
 *        미리 요소에 적용된 누락된 스타일은 스타일에서
 *        제거됩니다 (unset).
 *
 * 이 함수는 호스트 바인딩 내에서 호출되는 경우 제공된 styleMap 값을 호스트 요소에 적용합니다.
 *
 * @codeGenApi
 */
export function ɵɵstyleMap(styles: {[styleName: string]: any} | string | undefined | null): void {
  checkStylingMap(styleKeyValueArraySet, styleStringParser, styles, false);
}

/**
 * 텍스트를 스타일로 구문 분석하고 KeyValueArray에 값을 추가합니다.
 *
 * 이 코드는 필요하지 않을 경우 트리에서 제거될 수 있도록 별도의 함수로
 * 분리되었습니다. `ɵɵstyleMap`에서만 참조됩니다.
 *
 * @param keyValueArray 추가할 parsed 값을 포함하는 KeyValueArray.
 * @param text 구문 분석할 텍스트.
 */
export function styleStringParser(keyValueArray: KeyValueArray<any>, text: string): void {
  for (let i = parseStyle(text); i >= 0; i = parseStyleNext(text, i)) {
    styleKeyValueArraySet(keyValueArray, getLastParsedKey(text), getLastParsedValue(text));
  }
}

/**
 * 요소에 대해 객체 리터럴 또는 클래스 문자열을 사용하여 클래스 바인딩을 업데이트합니다.
 *
 * 이 명령은 `[class]="exp"` 템플릿 바인딩을 통해 스타일링을 적용하도록 설계되었습니다.
 * 클래스를 요소에 적용하면,
 * `classProp`을 통해 설정된 모든 스타일/클래스와 관련하여 업데이트됩니다. falsy인
 * 클래스가 있을 경우 요소에서 제거됩니다.
 *
 * 스타일링 명령은 `stylingApply`가 호출될 때까지 적용되지 않습니다.
 * 이 함수는 호스트 바인딩 내에서 호출되는 경우 제공된 classMap 값을 호스트 요소에 적용합니다.
 *
 * @param classes 추가될 CSS 클래스의 키/값 맵 또는 문자열. 모든 누락된 클래스는
 *        요소의 CSS 클래스 목록에서 제거됩니다 (unset).
 *
 * @codeGenApi
 */
export function ɵɵclassMap(
  classes: {[className: string]: boolean | undefined | null} | string | undefined | null,
): void {
  checkStylingMap(classKeyValueArraySet, classStringParser, classes, true);
}

/**
 * 텍스트를 클래스 형식으로 구문 분석하고 KeyValueArray에 값을 추가합니다.
 *
 * 이 코드는 필요하지 않을 경우 트리에서 제거될 수 있도록 별도의 함수로
 * 분리되었습니다. `ɵɵclassMap`에서만 참조됩니다.
 *
 * @param keyValueArray 추가할 parsed 값을 포함하는 KeyValueArray.
 * @param text 구문 분석할 텍스트.
 */
export function classStringParser(keyValueArray: KeyValueArray<any>, text: string): void {
  for (let i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
    keyValueArraySet(keyValueArray, getLastParsedKey(text), true);
  }
}

/**
 * `ɵɵclassProp`와 `ɵɵstyleProp` 간의 일반 코드.
 *
 * @param prop 속성 이름.
 * @param value 바인딩 값.
 * @param suffix 속성의 접미사 (예: `em` 또는 `px`)
 * @param isClassBased `true`는 `class` 변경 (`false`는 `style`)
 */
export function checkStylingProperty(
  prop: string,
  value: any | NO_CHANGE,
  suffix: string | undefined | null,
  isClassBased: boolean,
): void {
  const lView = getLView();
  const tView = getTView();
  // 스타일링 명령은 바인딩 당 2 슬롯을 사용합니다.
  // 1. 값 / TStylingKey에 대한 하나
  // 2. 간헐적 값 / TStylingRange에 대한 하나
  const bindingIndex = incrementBindingIndex(2);
  if (tView.firstUpdatePass) {
    stylingFirstUpdatePass(tView, prop, bindingIndex, isClassBased);
  }
  if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
    const tNode = tView.data[getSelectedIndex()] as TNode;
    updateStyling(
      tView,
      tNode,
      lView,
      lView[RENDERER],
      prop,
      (lView[bindingIndex + 1] = normalizeSuffix(value, suffix)),
      isClassBased,
      bindingIndex,
    );
  }
}

/**
 * `ɵɵclassMap`와 `ɵɵstyleMap` 간의 일반 코드.
 *
 * @param keyValueArraySet (See `keyValueArraySet` in "util/array_utils") style을
 *        처리하기 위해 함수로 전달됩니다. 이는 트리 흔들기 목적을 위해 수행됩니다.
 * @param stringParser `value`가 문자열인 경우 구문 분석하는 데 사용되는 파서입니다.
 * @param value 애플리케이션의 바인딩 값
 * @param isClassBased `true`는 `class` 변경 (`false`는 `style`)
 */
export function checkStylingMap(
  keyValueArraySet: (keyValueArray: KeyValueArray<any>, key: string, value: any) => void,
  stringParser: (styleKeyValueArray: KeyValueArray<any>, text: string) => void,
  value: any | NO_CHANGE,
  isClassBased: boolean,
): void {
  const tView = getTView();
  const bindingIndex = incrementBindingIndex(2);
  if (tView.firstUpdatePass) {
    stylingFirstUpdatePass(tView, null, bindingIndex, isClassBased);
  }
  const lView = getLView();
  if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
    // `getSelectedIndex()`는 여기에 있어야 하며 (명령이 아닌)
    // 이렇게 하면 필요하지 않게 읽지 않도록 보호됩니다.
    const tNode = tView.data[getSelectedIndex()] as TNode;
    if (hasStylingInputShadow(tNode, isClassBased) && !isInHostBindings(tView, bindingIndex)) {
      if (ngDevMode) {
        // 그림자가 있는 경우 `TData`가 적절히 표시되었는지 확인하여
        // 이 바인딩의 스타일링 해결에서 처리를 건너뜁니다.
        const tStylingKey = tView.data[bindingIndex];
        assertEqual(
          Array.isArray(tStylingKey) ? tStylingKey[1] : tStylingKey,
          false,
          "스타일링 연결 목록 그림자 입력은 'false'로 표시되어야 합니다.",
        );
      }
      // VE는 우리가 여기에서 하는 것처럼 정적 부분을 연결하지 않습니다.
      // 대신 VE는 동적 바인딩이 존재하는 경우 정적을 완전히 무시합니다.
      // 지역성 때문에 정적 부분이 이미 설정되었으며 동적 부분이 있다는 것을 나중에 보지 않는 경우
      // 이를 무시하면 바인딩이 이를 제거한 것으로 보일 것입니다. 이는 `[ngStyle]`/`[ngClass]`가 잘못된 것을 수행하게 할 수 있습니다.
      // 이 때문에 연관성을 유지하기 위해 `[ngStyle]`/`[ngClass]`가 계속 작동할 수 있도록 concatenation을 수행합니다.
      let staticPrefix = isClassBased ? tNode.classesWithoutHost : tNode.stylesWithoutHost;
      ngDevMode &&
        isClassBased === false &&
        staticPrefix !== null &&
        assertEqual(staticPrefix.endsWith(';'), true, "정적 부분이 ';'로 끝나는 기대.");
      if (staticPrefix !== null) {
        // `value`의 falsy 값이 빈 문자열이 되도록 해야 합니다.
        value = concatStringsWithSpace(staticPrefix, value ? value : '');
      }
      // `<div [style] my-dir>`가 있으며 `my-dir`가 `@Input('style')`를 가지고 있습니다.
      // 이는 `[style]` 바인딩을 덮어씁니다. (`[class]`와 동일)
      setDirectiveInputsWhichShadowsStyling(tView, tNode, lView, value, isClassBased);
    } else {
      updateStylingMap(
        tView,
        tNode,
        lView,
        lView[RENDERER],
        lView[bindingIndex + 1],
        (lView[bindingIndex + 1] = toStylingKeyValueArray(keyValueArraySet, stringParser, value)),
        isClassBased,
        bindingIndex,
      );
    }
  }
}

/**
 * 바인딩이 `hostBindings` 섹션에 있는지 여부를 결정합니다.
 *
 * @param tView 현재 `TView`
 * @param bindingIndex `hostBindings`에 있는 경우 바인딩의 인덱스
 */
function isInHostBindings(tView: TView, bindingIndex: number): boolean {
  // 모든 호스트 바인딩은 expando 섹션 이후에 배치됩니다.
  return bindingIndex >= tView.expandoStartIndex;
}

/**
 * 스타일 바인딩의 연결 목록에 바인딩을 삽입하기 위해 필요한 정보를 수집합니다.
 *
 * @param tView 바인딩 연결 목록이 저장될 `TView`.
 * @param tStylingKey 바인딩의 속성/키.
 * @param bindingIndex `prop`와 연결된 바인딩의 인덱스
 * @param isClassBased `true`는 `class` 변경 (`false`는 `style`)
 */
function stylingFirstUpdatePass(
  tView: TView,
  tStylingKey: TStylingKey,
  bindingIndex: number,
  isClassBased: boolean,
): void {
  ngDevMode && assertFirstUpdatePass(tView);
  const tData = tView.data;
  if (tData[bindingIndex + 1] === null) {
    // 위의 검사는 첫 번째 성공적인 템플릿 실행까지 초기 업데이트 패스를 지우지 않기 때문에 필요합니다.
    // 이는 스타일링 명령이 자체적으로 목록에 반복 추가되는 것을 방지합니다.
    // `getSelectedIndex()`는 여기에서 발생해야 하며 (명령 내에서가 아닌)
    // 필요하지 않게 읽지 않도록 보호됩니다.
    const tNode = tData[getSelectedIndex()] as TNode;
    ngDevMode && assertDefined(tNode, 'TNode가 예상됩니다.');
    const isHostBindings = isInHostBindings(tView, bindingIndex);
    if (hasStylingInputShadow(tNode, isClassBased) && tStylingKey === null && !isHostBindings) {
      // `tStylingKey === null`은 `[style]` 또는 `[class]` 바인딩임을 나타냅니다.
      // `@Input('style')` 또는 `@Input('class')`를 사용하는 지시문이 있는 경우 이 바인딩을 무효화해야 합니다.
      // 이를 noop으로 변환하여 키를 `false`로 설정합니다.
      tStylingKey = false;
    }
    tStylingKey = wrapInStaticStylingKey(tData, tNode, tStylingKey, isClassBased);
    insertTStylingBinding(tData, tNode, tStylingKey, bindingIndex, isHostBindings, isClassBased);
  }
}

/**
 * 적용 가능한 경우 바인딩에 정적 스타일링 정보를 추가합니다.
 *
 * 스타일 목록은 목록 및 키를 저장할 뿐만 아니라 일부 키에 대한 정적 스타일링 정보도 저장합니다.
 * 이 함수는 키가 스타일링 정보를 포함해야 하는지 결정하고 이를 계산합니다.
 *
 * `TStylingStatic`을 자세히 참조하십시오.
 *
 * @param tData 연결 목록이 저장되는 `TData`.
 * @param tNode 스타일이 계산되는 `TNode`.
 * @param stylingKey `TStylingKeyPrimitive` 스타일링 키에 래핑될 수 있음
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 */
export function wrapInStaticStylingKey(
  tData: TData,
  tNode: TNode,
  stylingKey: TStylingKey,
  isClassBased: boolean,
): TStylingKey {
  const hostDirectiveDef = getCurrentDirectiveDef(tData);
  let residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
  if (hostDirectiveDef === null) {
    // 우리는 템플릿 노드에 있습니다.
    // 템플릿 노드가 이미 스타일링 명령을 가졌다면,
    // 정적 스타일링을 수집할 필요가 없습니다. 이는 우리가 첫 번째 스타일링
    // 명령인지 알 수 있습니다.  `TNode.*Bindings`는 0(아무것도 삽입되지 않음)을 가리킵니다.
    const isFirstStylingInstructionInTemplate =
      ((isClassBased ? tNode.classBindings : tNode.styleBindings) as any as number) === 0;
    if (isFirstStylingInstructionInTemplate) {
      // 정적 속성을 `mergeAttrs`에서 가져오면 좋겠지만 그 시점에 이미 병합되어
      // 속성이 우선순위에 따라 어떤 속성에 속하는지 알 수 없습니다.
      stylingKey = collectStylingFromDirectives(null, tData, tNode, stylingKey, isClassBased);
      stylingKey = collectStylingFromTAttrs(stylingKey, tNode.attrs, isClassBased);
      // 템플릿에 스타일 바인딩이 있는 경우 잔여물이 없음을 알 수 있습니다.
      residual = null;
    }
  } else {
    // 호스트 바인딩 노드에 있으며 템플릿 노드에 바인딩 명령이 없었습니다.
    // 이는 잔여물을 계산해야 함을 의미합니다.
    const directiveStylingLast = tNode.directiveStylingLast;
    const isFirstStylingInstructionInHostBinding =
      directiveStylingLast === -1 || tData[directiveStylingLast] !== hostDirectiveDef;
    if (isFirstStylingInstructionInHostBinding) {
      stylingKey = collectStylingFromDirectives(
        hostDirectiveDef,
        tData,
        tNode,
        stylingKey,
        isClassBased,
      );
      if (residual === null) {
        // - `null`일 경우:
        //    - 템플릿 스타일링 명령이 이미 실행되었으며 정적을 소비했음을 의미합니다.
        //      스타일링은 첫 번째 템플릿 노드 명령과 연결된 `TStylingKey`에서 업데이트할 필요가 없습니다. OR
        //    - 다른 스타일링 명령이 실행되어 잔여물이 없음을 결정했습니다.
        let templateStylingKey = getTemplateHeadTStylingKey(tData, tNode, isClassBased);
        if (templateStylingKey !== undefined && Array.isArray(templateStylingKey)) {
          // `templateStylingKey`에 정적 값이 있는 경우에만 다시 계산합니다.
          // (정적 값을 찾을 수 없는 경우, 이는 아무 작업도 할 수 없으며,
          // 이 작업은 더 많은 정적 키를 생성할 수 없습니다.)
          templateStylingKey = collectStylingFromDirectives(
            null,
            tData,
            tNode,
            templateStylingKey[1] /* 이전의 정적을 추출 */,
            isClassBased,
          );
          templateStylingKey = collectStylingFromTAttrs(
            templateStylingKey,
            tNode.attrs,
            isClassBased,
          );
          setTemplateHeadTStylingKey(tData, tNode, isClassBased, templateStylingKey);
        }
      } else {
        // 잔여물이 `null`이 아닐 경우에만 재계산할 필요가 있습니다.
        // - 기존 잔여물이 있다면(템플릿 스타일링이 없음을 의미합니다). 정적 부분이
        //   잔여물에서 스타일링 키로 이동했을 수 있으며 따라서 다시 계산해야 합니다.
        // - `undefined`일 경우 이 것이 처음 실행되는 것입니다.
        residual = collectResidual(tData, tNode, isClassBased);
      }
    }
  }
  if (residual !== undefined) {
    isClassBased ? (tNode.residualClasses = residual) : (tNode.residualStyles = residual);
  }
  return stylingKey;
}

/**
 * 템플릿 스타일링 명령의 `TStylingKey`를 검색합니다.
 *
 * 호스트 바인딩 스타일링 명령은 템플릿 명령 이후에 삽입됩니다.
 * 템플릿 명령은 `TNode`의 잔여물을 업데이트해야 하고,
 * 호스트 바인딩 명령은 템플릿 명령의 `TStylingKey`를 업데이트해야 합니다.
 *
 * @param tData 연결 목록이 저장되는 `TData`.
 * @param tNode 스타일이 계산되는 `TNode`.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 * @return 발견된 경우 `TStylingKey` 또는 발견되지 않은 경우 `undefined`.
 */
function getTemplateHeadTStylingKey(
  tData: TData,
  tNode: TNode,
  isClassBased: boolean,
): TStylingKey | undefined {
  const bindings = isClassBased ? tNode.classBindings : tNode.styleBindings;
  if (getTStylingRangeNext(bindings) === 0) {
    // `template`에 스타일링 명령이 없는 것처럼 보입니다.
    return undefined;
  }
  return tData[getTStylingRangePrev(bindings)] as TStylingKey;
}

/**
 * `TNode`의 첫 번째 템플릿 명령의 `TStylingKey`를 업데이트합니다.
 *
 * 논리적으로 `hostBindings` 스타일링 명령은 템플릿보다 우선 순위가 낮습니다.
 * 그러나 템플릿 스타일링 명령 이후에 실행됩니다. 이는 템플릿 스타일링 명령 앞에 삽입됨을 의미합니다.
 *
 * 템플릿 스타일링 명령과 새로운 `hostBindings` 스타일링 명령이 있을 때,
 * 템플릿 명령의 정적 필드를 가져와야 할 수 있습니다. 이 방법을 사용하면
 * 첫 번째 템플릿 명령의 `TStylingKey`를 새 값으로 업데이트할 수 있습니다.
 *
 * 가정:
 * ```angular-ts
 * <div my-dir style="color: red" [style.color]="tmplExp"></div>
 *
 * @Directive({
 *   host: {
 *     'style': 'width: 100px',
 *     '[style.color]': 'dirExp',
 *   }
 * })
 * class MyDir {}
 * ```
 *
 * `[style.color]="tmplExp"`가 실행될 때 이 데이터 구조를 생성합니다.
 * ```ts
 *  ['', 'color', 'color', 'red', 'width', '100px'],
 * ```
 *
 * 이 이유는 템플릿 명령이 스타일링 지시 사항이 있는지 알 수 없으므로,
 * 모든 정적 스타일링을 수집해야 함을 의미합니다.
 * (`color`와 `width` 모두)
 *
 * `'[style.color]': 'dirExp',`가 실행될 때 연결 목록에 새 데이터를 삽입해야 합니다.
 * ```ts
 *  ['', 'color', 'width', '100px'],  // 새로 삽입됨
 *  ['', 'color', 'color', 'red', 'width', '100px'], // 이건 잘못됨
 * ```
 *
 * 템플릿의 정적 내용이 잘못되었음을 알 수 있습니다. 현재 `width`가 잘못 포함되어 있으므로 업데이트해야 합니다:
 * ```ts
 *  ['', 'color', 'width', '100px'],
 *  ['', 'color', 'color', 'red'],    // 업데이트
 * ```
 *
 * @param tData 연결 목록이 저장되는 `TData`.
 * @param tNode 스타일이 계산되는 `TNode`.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 * @param tStylingKey 새 `TStylingKey`로 이전 것을 대체합니다.
 */
function setTemplateHeadTStylingKey(
  tData: TData,
  tNode: TNode,
  isClassBased: boolean,
  tStylingKey: TStylingKey,
): void {
  const bindings = isClassBased ? tNode.classBindings : tNode.styleBindings;
  ngDevMode &&
    assertNotEqual(
      getTStylingRangeNext(bindings),
      0,
      '최소한 하나의 템플릿 스타일링 바인딩이 존재해야 합니다.',
    );
  tData[getTStylingRangePrev(bindings)] = tStylingKey;
}

/**
 * 현재의 `TNode.directiveStylingLast` 인덱스 이후의 모든 정적 값을 수집합니다.
 *
 * 기존 스타일링 명령에 의해 이미 수집되지 않은 나머지 스타일링 정보를 수집합니다.
 *
 * @param tData `TData`에서 `DirectiveDefs`가 저장됩니다.
 * @param tNode `TNode`는 지시문 범위를 포함합니다.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 */
function collectResidual(
  tData: TData,
  tNode: TNode,
  isClassBased: boolean,
): KeyValueArray<any> | null {
  let residual: KeyValueArray<any> | null | undefined = undefined;
  const directiveEnd = tNode.directiveEnd;
  ngDevMode &&
    assertNotEqual(
      tNode.directiveStylingLast,
      -1,
      '이 함수가 호출될 때까지 최소한 하나의 hostBindings-node 스타일링 명령이 실행되었어야 합니다.',
    );
  // 현재 지시문(호스트 바인딩 규칙이 실행된 후 나머지를 수집하는 것)을 건너뛰기 위해 `1 + tNode.directiveStart`를 추가합니다.
  for (let i = 1 + tNode.directiveStylingLast; i < directiveEnd; i++) {
    const attrs = (tData[i] as DirectiveDef<any>).hostAttrs;
    residual = collectStylingFromTAttrs(residual, attrs, isClassBased) as KeyValueArray<any> | null;
  }
  return collectStylingFromTAttrs(residual, tNode.attrs, isClassBased) as KeyValueArray<any> | null;
}

/**
 * `hostDirectiveDef`보다 우선 순위가 낮은 스타일링 정보를 수집합니다.
 *
 * (이는 잔여 스타일링의 반대입니다.)
 *
 * @param hostDirectiveDef 수집하려는 우선 순위가 낮은 정적 스타일링에 대한 `DirectiveDef`.
 *        (템플릿 스타일링의 경우 `null`)
 * @param tData 연결 목록이 저장되는 `TData`.
 * @param tNode 스타일이 계산되는 `TNode`.
 * @param stylingKey 업데이트하거나 래핑할 기존 `TStylingKey`.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 */
function collectStylingFromDirectives(
  hostDirectiveDef: DirectiveDef<any> | null,
  tData: TData,
  tNode: TNode,
  stylingKey: TStylingKey,
  isClassBased: boolean,
): TStylingKey {
  // 호스트 속성은 있지만 호스트 바인딩이 없는 지시문이 있을 수 있으므로,
  // 이 루프는 현재 지시문에 맞춰 계속 진행됩니다.
  let currentDirective: DirectiveDef<any> | null = null;
  const directiveEnd = tNode.directiveEnd;
  let directiveStylingLast = tNode.directiveStylingLast;
  if (directiveStylingLast === -1) {
    directiveStylingLast = tNode.directiveStart;
  } else {
    directiveStylingLast++;
  }
  while (directiveStylingLast < directiveEnd) {
    currentDirective = tData[directiveStylingLast] as DirectiveDef<any>;
    ngDevMode && assertDefined(currentDirective, '정의되어 있어야 함');
    stylingKey = collectStylingFromTAttrs(stylingKey, currentDirective.hostAttrs, isClassBased);
    if (currentDirective === hostDirectiveDef) break;
    directiveStylingLast++;
  }
  if (hostDirectiveDef !== null) {
    // 호스트 바인딩으로부터 데이터를 수집할 때만 스타일링 커서를 진행합니다.
    // 템플릿은 호스트 바인딩 전에 실행되므로 인덱스를 업데이트하면 호스트 바인딩이
    // 정적 속성을 얻지 못하게 됩니다.
    tNode.directiveStylingLast = directiveStylingLast;
  }
  return stylingKey;
}

/**
 * `TAttrs`를 `TStylingStatic`으로 변환합니다.
 *
 * @param stylingKey 업데이트하거나 래핑할 기존 `TStylingKey`.
 * @param attrs 처리할 `TAttributes`.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 */
function collectStylingFromTAttrs(
  stylingKey: TStylingKey | undefined,
  attrs: TAttributes | null,
  isClassBased: boolean,
): TStylingKey {
  const desiredMarker = isClassBased ? AttributeMarker.Classes : AttributeMarker.Styles;
  let currentMarker = AttributeMarker.ImplicitAttributes;
  if (attrs !== null) {
    for (let i = 0; i < attrs.length; i++) {
      const item = attrs[i] as number | string;
      if (typeof item === 'number') {
        currentMarker = item;
      } else {
        if (currentMarker === desiredMarker) {
          if (!Array.isArray(stylingKey)) {
            stylingKey = stylingKey === undefined ? [] : (['', stylingKey] as any);
          }
          keyValueArraySet(
            stylingKey as KeyValueArray<any>,
            item,
            isClassBased ? true : attrs[++i],
          );
        }
      }
    }
  }
  return stylingKey === undefined ? null : stylingKey;
}

/**
 * 사용자 입력을 `KeyValueArray`로 변환합니다.
 *
 * 이 함수는 사용자 입력을 `string`, 객체 리터럴 또는 iterable로 받아들이고,
 * 이를 일관된 표현으로 변환합니다. 이 출력은 `KeyValueArray`입니다.
 * (여기서 짝수 인덱스는 키를 포함하고 홀수 인덱스는 해당 키의 값을 포함합니다).
 *
 * `KeyValueArray`로 변환하는 장점은 입력에 대해 독립적인 방식으로
 * 차이를 수행할 수 있다는 것입니다.
 * (예: `foo bar`와 `['bar', 'baz']`를 비교하여 적용해야 할 변경 세트를 결정할 수 있습니다.)
 *
 * `KeyValueArray`가 정렬되어 있는 것은 매우 중요한데, 이는 이전 값과 현재 값 간의 차이를
 * 선형적으로 계산할 수 있게 해줍니다. 추가 데이터를 할당할 필요가 없습니다.
 *
 * 예를 들어, 이를 `Map`으로 유지하면 이전 `Map`을 반복하여 삭제해야 할 값을 파악하고,
 * 새 `Map`을 반복하여 추가 사항을 파악해야 할 것이며,
 * 중복 항목이나 아직 방문하지 않은 항목을 추적하기 위해 추가 `Map`을 유지해야 합니다.
 *
 * @param keyValueArraySet (See `keyValueArraySet` in "util/array_utils") style을
 *        처리하기 위해 함수로 전달됩니다. 이는 트리 흔들기 목적을 위해 수행됩니다.
 * @param stringParser 파서는 트리 흔들리기 가능하게 하기 위해 전달됩니다.
 *        `styleStringParser`와 `classStringParser`를 참조하세요.
 * @param value `KeyValueArray`로 구문 분석/변환할 값
 */
export function toStylingKeyValueArray(
  keyValueArraySet: (keyValueArray: KeyValueArray<any>, key: string, value: any) => void,
  stringParser: (styleKeyValueArray: KeyValueArray<any>, text: string) => void,
  value: string | string[] | {[key: string]: any} | SafeValue | null | undefined,
): KeyValueArray<any> {
  if (value == null /*|| value === undefined */ || value === '') return EMPTY_ARRAY as any;
  const styleKeyValueArray: KeyValueArray<any> = [] as any;
  const unwrappedValue = unwrapSafeValue(value) as string | string[] | {[key: string]: any};
  if (Array.isArray(unwrappedValue)) {
    for (let i = 0; i < unwrappedValue.length; i++) {
      keyValueArraySet(styleKeyValueArray, unwrappedValue[i], true);
    }
  } else if (typeof unwrappedValue === 'object') {
    for (const key in unwrappedValue) {
      if (unwrappedValue.hasOwnProperty(key)) {
        keyValueArraySet(styleKeyValueArray, key, unwrappedValue[key]);
      }
    }
  } else if (typeof unwrappedValue === 'string') {
    stringParser(styleKeyValueArray, unwrappedValue);
  } else {
    ngDevMode &&
      throwError('지원되지 않는 스타일링 타입 ' + typeof unwrappedValue + ': ' + unwrappedValue);
  }
  return styleKeyValueArray;
}

/**
 * `key`에 대한 `value`를 설정합니다.
 *
 * `keyValueArraySet`를 참조하십시오.
 *
 * @param keyValueArray 추가할 KeyValueArray.
 * @param key 추가할 스타일 키.
 * @param value 설정할 값.
 */
export function styleKeyValueArraySet(keyValueArray: KeyValueArray<any>, key: string, value: any) {
  keyValueArraySet(keyValueArray, key, unwrapSafeValue(value));
}

/**
 * 클래스 바인딩 전용 함수로, `key`에 대해 `value`를 설정합니다.
 *
 * `keyValueArraySet`를 참조하십시오.
 *
 * @param keyValueArray 추가할 KeyValueArray.
 * @param key 추가할 스타일 키.
 * @param value 설정할 값.
 */
export function classKeyValueArraySet(keyValueArray: KeyValueArray<any>, key: unknown, value: any) {
  // CSS 클래스를 DOM 노드에 추가하기 위해 `classList.add`를 사용합니다. `add`에 전달된 값은
  // 문자열로 변환되어 `class` 속성에 추가됩니다. 예를 들어 null, undefined 또는 숫자도 추가됩니다.
  // 우리 내부 데이터 구조가 DOM의 값과 일치하도록 여기에서 키를 문자열로 변환합니다. 유일한 예외는
  // 빈 문자열과 공백을 포함한 문자열입니다. 브라우저는 오류를 발생시키므로 이러한 값은 무시합니다.
  const stringKey = String(key);
  if (stringKey !== '' && !stringKey.includes(' ')) {
    keyValueArraySet(keyValueArray, stringKey, value);
  }
}

/**
 * 매핑 기반 스타일링을 업데이트합니다.
 *
 * 매핑 기반 스타일링은 하나 이상의 바인딩을 포함할 수 있는 모든 것입니다.
 * 예를 들어 `string` 또는 객체 리터럴입니다. 이러한 모든 유형을 처리하면 로직이 복잡해지므로
 * 이 함수는 복잡한 입력이 먼저 정규화된 `KeyValueArray`로 변환되는 것을 기대합니다.
 * 정규화의 장점은 값이 정렬되어 이전 값과 현재 값 간의 차이를 계산하는 것이 매우 저렴하다는 것입니다.
 *
 * @param tView 관련된 `TView.data` 연결 목록의 바인딩 우선순위를 포함합니다.
 * @param tNode 바인딩이 위치한 `TNode`.
 * @param lView 다른 스타일링 바인딩과 관련된 값이 포함된 `LView`입니다.
 * @param renderer 업데이트에 사용할 렌더러입니다.
 * @param oldKeyValueArray 이전 값을 `KeyValueArray`로 나타냅니다.
 * @param newKeyValueArray 현재 값을 `KeyValueArray`로 나타냅니다.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 * @param bindingIndex 바인딩의 바인딩 인덱스.
 */
function updateStylingMap(
  tView: TView,
  tNode: TNode,
  lView: LView,
  renderer: Renderer,
  oldKeyValueArray: KeyValueArray<any>,
  newKeyValueArray: KeyValueArray<any>,
  isClassBased: boolean,
  bindingIndex: number,
) {
  if ((oldKeyValueArray as KeyValueArray<any> | NO_CHANGE) === NO_CHANGE) {
    // 첫 번째 실행 시 oldKeyValueArray가 NO_CHANGE입니다 => 이를 빈 KeyValueArray로 취급합니다.
    oldKeyValueArray = EMPTY_ARRAY as any;
  }
  let oldIndex = 0;
  let newIndex = 0;
  let oldKey: string | null = 0 < oldKeyValueArray.length ? oldKeyValueArray[0] : null;
  let newKey: string | null = 0 < newKeyValueArray.length ? newKeyValueArray[0] : null;
  while (oldKey !== null || newKey !== null) {
    ngDevMode && assertLessThan(oldIndex, 999, '무한 루프에 갇혔나요?');
    ngDevMode && assertLessThan(newIndex, 999, '무한 루프에 갇혔나요?');
    const oldValue =
      oldIndex < oldKeyValueArray.length ? oldKeyValueArray[oldIndex + 1] : undefined;
    const newValue =
      newIndex < newKeyValueArray.length ? newKeyValueArray[newIndex + 1] : undefined;
    let setKey: string | null = null;
    let setValue: any = undefined;
    if (oldKey === newKey) {
      // 업데이트: 키가 같음 => 새 값이 이전 값을 덮어씁니다.
      oldIndex += 2;
      newIndex += 2;
      if (oldValue !== newValue) {
        setKey = newKey;
        setValue = newValue;
      }
    } else if (newKey === null || (oldKey !== null && oldKey < newKey!)) {
      // 삭제: oldKey 키가 누락되었거나 새 값에서 oldKey를 찾지 못했습니다.
      // (keyValueArray가 정렬되어 있으며 `newKey`가 나중에 알파벳순으로 발견됩니다).
      // `"background" < "color"`이므로 `"background"`를 삭제해야 합니다.
      oldIndex += 2;
      setKey = oldKey;
    } else {
      // 생성: newKey가 알파벳순으로 oldKey보다 앞선 경우 (또는 oldKey가 없는 경우) => 새 키가 있습니다.
      // `"color" > "background"`이므로 `color`를 추가해야 합니다.
      ngDevMode && assertDefined(newKey, '유효한 키 있어야 함');
      newIndex += 2;
      setKey = newKey;
      setValue = newValue;
    }
    if (setKey !== null) {
      updateStyling(tView, tNode, lView, renderer, setKey, setValue, isClassBased, bindingIndex);
    }
    oldKey = oldIndex < oldKeyValueArray.length ? oldKeyValueArray[oldIndex] : null;
    newKey = newIndex < newKeyValueArray.length ? newKeyValueArray[newIndex] : null;
  }
}

/**
 * 단순한 (속성 이름) 스타일링을 업데이트합니다.
 *
 * 이 함수는 `prop`을 가져와서 DOM을 해당 값으로 업데이트합니다. 이 함수는 바인딩
 * 값과 바인딩 우선순위를 고려하여 어떤 값을 DOM에 기록할지를 결정합니다.
 * (예를 들어, 더 높은 우선 순위의 덮어쓰기가 DOM 기록을 차단하거나 값이 `undefined`가 될 경우, 더 낮은
 * 우선 순위의 덮어쓰기를 참조할 수 있습니다.)
 *
 * @param tView 관련된 `TView.data` 연결 목록의 바인딩 우선순위를 포함합니다.
 * @param tNode 바인딩이 위치한 `TNode`.
 * @param lView 다른 스타일링 바인딩과 관련된 값이 포함된 `LView`입니다.
 * @param renderer 업데이트에 사용할 렌더러입니다.
 * @param prop 스타일 속성 이름 또는 클래스 이름.
 * @param value `prop`에 대한 스타일 값 또는 `true`/`false`가 `prop`이 클래스인 경우.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 * @param bindingIndex 바인딩 인덱스.
 */
function updateStyling(
  tView: TView,
  tNode: TNode,
  lView: LView,
  renderer: Renderer,
  prop: string,
  value: string | undefined | null | boolean,
  isClassBased: boolean,
  bindingIndex: number,
) {
  if (!(tNode.type & TNodeType.AnyRNode)) {
    // 비요소(예: ng-container)에서 스타일링이 있을 수 있습니다.
    // 이는 드물지만 발생합니다. 이런 경우, 바인딩을 무시합니다.
    return;
  }
  const tData = tView.data;
  const tRange = tData[bindingIndex + 1] as TStylingRange;
  const higherPriorityValue = getTStylingRangeNextDuplicate(tRange)
    ? findStylingValue(tData, tNode, lView, prop, getTStylingRangeNext(tRange), isClassBased)
    : undefined;
  if (!isStylingValuePresent(higherPriorityValue)) {
    // 다음 중복이 없거나 중복 값을 찾지 못했습니다.
    if (!isStylingValuePresent(value)) {
      // 현재 값을 삭제하거나 더 낮은 우선 순위 값으로 복원해야 합니다.
      if (getTStylingRangePrevDuplicate(tRange)) {
        // 가능한 이전 중복이 있으므로 이를 검색합니다.
        value = findStylingValue(tData, null, lView, prop, bindingIndex, isClassBased);
      }
    }
    const rNode = getNativeByIndex(getSelectedIndex(), lView) as RElement;
    applyStyling(renderer, isClassBased, rNode, prop, value);
  }
}

/**
 * 현재 값을 덮어쓰는 더 높은 우선 순위의 스타일링 값을 찾거나,
 * 값이 `undefined`인 경우 되돌릴 하위 우선 순위의 값을 찾습니다.
 *
 * 값이 위치에서 적용되는 경우 관련된 값을 참조해야 합니다.
 * - 더 높은 우선 순위의 바인딩이 있을 경우, 해당 바인딩을 사용해야 합니다.
 *   예를 들어 `<div  [style]="{color:exp1}" [style.color]="exp2">`에서 `exp1`을 변경하는 경우
 *   `exp2`가 `undefined`가 아닌 값을 설정하고 있는지 확인해야 합니다.
 * - 더 낮은 우선 순위의 바인딩이 있고 `undefined`로 변경할 경우
 *   예를 들어 `<div  [style]="{color:exp1}" [style.color]="exp2">`에서 `exp2`를
 *   `undefined`로 변경하는 경우 `exp1`(및 정적 값)을 확인하여 이를 새 값으로 사용해야 합니다.
 *
 * 주의: 스타일링은 두 개의 값을 저장합니다.
 * 1. 애플리케이션에서 명령한 원시 값은 `index + 0` 위치에 저장됩니다. (이 값은 더러운 확인에 사용됩니다).
 * 2. 정규화된 값은 `index + 1`에 저장됩니다.
 *
 * @param tData 우선 순위를 탐색하는 데 사용되는 `TData`.
 * @param tNode 정적 스타일링을 해결하는 데 사용할 `TNode`. 검색 방향도 제어합니다.
 *   - `TNode` 다음을 검색하며 `isStylingValuePresent(value)`가 true인 경우 종료합니다.
 *      값이 없으면 `tNode.residualStyle`/`tNode.residualClass`에서 기본값을 참조합니다.
 *   - `null`의 경우 이전으로 검색하며 끝까지 이동합니다. 마지막 값
 *     `isStylingValuePresent(value)`가 true인 경우 반환합니다.
 * @param lView 실제 값을 검색하는 데 사용되는 `LView`.
 * @param prop 관심 있는 속성.
 * @param index 검색을 시작해야 할 스타일링 바인딩의 연결 목록에서 시작 인덱스.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 */
function findStylingValue(
  tData: TData,
  tNode: TNode | null,
  lView: LView,
  prop: string,
  index: number,
  isClassBased: boolean,
): any {
  // 정적 스타일링을 해결하는 데 사용할 `TNode`. 검색 방향도 제어합니다.
  //   - `TNode` 다음을 검색하며 `isStylingValuePresent(value)`가 true인 경우 종료합니다.
  //      값이 없으면 `tNode.residualStyle`/`tNode.residualClass`에서 기본값을 참조합니다.
  //   - `null`의 경우 이전으로 검색하며 끝까지 이동합니다. 마지막 값
  //     `isStylingValuePresent(value)`가 true인 경우 반환합니다.
  const isPrevDirection = tNode === null;
  let value: any = undefined;
  while (index > 0) {
    const rawKey = tData[index] as TStylingKey;
    const containsStatics = Array.isArray(rawKey);
    // 정적 값이 포함된 경우 키를 unwrapped합니다.
    const key = containsStatics ? (rawKey as string[])[1] : rawKey;
    const isStylingMap = key === null;
    let valueAtLViewIndex = lView[index + 1];
    if (valueAtLViewIndex === NO_CHANGE) {
      // 첫 번째 업데이트 패스에서는 스타일링 명령이 스타일링 목록을 만듭니다.
      // 이후 패스에서는 스타일링 명령이 실행되지 않은 바인딩을 시도할 수 있습니다.
      // 이 경우 NO_CHANGE를 찾고, 대신 `undefined`(또는 스타일링-맵 명령의 경우 빈 배열)를
      // 사용해야 합니다. 이는 후에 바인딩이 실행될 때 값을 적용할 수 있게 합니다.
      valueAtLViewIndex = isStylingMap ? EMPTY_ARRAY : undefined;
    }
    let currentValue = isStylingMap
      ? keyValueArrayGet(valueAtLViewIndex, prop)
      : key === prop
        ? valueAtLViewIndex
        : undefined;
    if (containsStatics && !isStylingValuePresent(currentValue)) {
      currentValue = keyValueArrayGet(rawKey as KeyValueArray<any>, prop);
    }
    if (isStylingValuePresent(currentValue)) {
      value = currentValue;
      if (isPrevDirection) {
        return value;
      }
    }
    const tRange = tData[index + 1] as TStylingRange;
    index = isPrevDirection ? getTStylingRangePrev(tRange) : getTStylingRangeNext(tRange);
  }
  if (tNode !== null) {
    // 다음 방향으로 가고 있으며 아무것도 찾지 못하는 경우, 잔여 스타일링에 대한 참고가 필요합니다.
    let residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
    if (residual != null /** OR residual !=== undefined */) {
      value = keyValueArrayGet(residual!, prop);
    }
  }
  return value;
}

/**
 * 바인딩 값이 사용되어야 하는지(또는 값이 'undefined'인 경우 우선 순위 해결을 사용해야 함) 여부를 결정합니다.
 *
 * @param value 바인딩 스타일 값.
 */
function isStylingValuePresent(value: any): boolean {
  // 현재만 `undefined` 값을 비바인딩으로 간주합니다. 이는 `undefined`가 이 바인딩이 무엇이어야 하는지에 대한 의견이 없음을 나타내며,
  // 우선 순위에 따라 유효한 값을 결정하기 위해 다른 바인딩을 참조해야 함을 나타냅니다.
  // 이는 이 기능에 대한 제어를 단일 위치에서 수행할 수 있도록 단일 함수로 추출됩니다.
  return value !== undefined;
}

/**
 * 값을 정규화하고/또는 접미사를 추가합니다.
 *
 * 값이 `null`/`undefined`인 경우 접미사가 추가되지 않습니다.
 * @param value
 * @param suffix
 */
function normalizeSuffix(
  value: any,
  suffix: string | undefined | null,
): string | null | undefined | boolean {
  if (value == null || value === '') {
    // 아무 것도 하지 않음
    // 값이 비어 있을 경우 접미사를 추가하지 마십시오.
    // 이는 유효하지 않은 CSS를 생성하며, 브라우저는 이를 자동으로 생략하지만 Domino는 아닙니다.
    // 예: `"left": "px;"`가 아닌 `"left": ""`.
  } else if (typeof suffix === 'string') {
    value = value + suffix;
  } else if (typeof value === 'object') {
    value = stringify(unwrapSafeValue(value));
  }
  return value;
}

/**
 * `TNode`가 입력 그림자가 있는지 테스트합니다.
 *
 * 입력 그림자는 지시문이 `@Input('style')` 또는 `@Input('class')`를 사용하여 입력을 훔치는 경우입니다.
 *
 * @param tNode 그림자가 있는지 확인하고 싶은 `TNode`.
 * @param isClassBased `true`는 `class` (`false`는 `style`)
 */
export function hasStylingInputShadow(tNode: TNode, isClassBased: boolean) {
  return (tNode.flags & (isClassBased ? TNodeFlags.hasClassInput : TNodeFlags.hasStyleInput)) !== 0;
}
