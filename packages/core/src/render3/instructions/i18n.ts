/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import '../../util/ng_dev_mode';
import '../../util/ng_i18n_closure_mode';

import {prepareI18nBlockForHydration} from '../../hydration/i18n';
import {assertDefined} from '../../util/assert';
import {bindingUpdated} from '../bindings';
import {applyCreateOpCodes, applyI18n, setMaskBit} from '../i18n/i18n_apply';
import {i18nAttributesFirstPass, i18nStartFirstCreatePass} from '../i18n/i18n_parse';
import {i18nPostprocess} from '../i18n/i18n_postprocess';
import {TI18n} from '../interfaces/i18n';
import {TElementNode, TNodeType} from '../interfaces/node';
import {
  DECLARATION_COMPONENT_VIEW,
  FLAGS,
  HEADER_OFFSET,
  LViewFlags,
  T_HOST,
  TViewType,
} from '../interfaces/view';
import {getClosestRElement} from '../node_manipulation';
import {
  getCurrentParentTNode,
  getLView,
  getTView,
  nextBindingIndex,
  setInI18nBlock,
} from '../state';
import {getConstant} from '../util/view_utils';

/**
 * 번역 가능한 텍스트 블록을 표시합니다.
 *
 * `i18nStart` 및 `i18nEnd` 명령어는 템플릿에서 번역 블록을 표시합니다.
 * 번역 `message`는 로케일에 따라 특정한 값입니다. 번역 문자열에는
 * 번역 내의 내부 요소 및 하위 템플릿과 연관된 자리 표시자가 포함될 수 있습니다.
 *
 * 번역 `message` 자리 표시자는 다음과 같습니다:
 * - `�{index}(:{block})�`: *Binding Placeholder*: 표현식이 삽입될 위치를 표시합니다.
 *   자리 표시자 `index`는 표현식 바인딩 인덱스를 가리킵니다. 선언된 하위 템플릿과 일치하는
 *   선택적 `block`이 있습니다.
 * - `�#{index}(:{block})�`/`�/#{index}(:{block})�`: *Element Placeholder*: 원래 번역 블록에
 *   삽입된 DOM 요소의 시작과 끝을 표시합니다. 자리 표시자 `index`는 템플릿 명령어 세트에서
 *   요소 인덱스를 가리킵니다. 선언된 하위 템플릿과 일치하는 선택적 `block`이 있습니다.
 * - `�*{index}:{block}�`/`�/*{index}:{block}�`: *Sub-template Placeholder*: 하위 템플릿은
 *   분할되어 각 Angular 템플릿 함수에서 별도로 번역되어야 합니다. `index`는
 *   `template` 명령어 인덱스를 가리킵니다. 선언된 하위 템플릿과 일치하는 `block`이 있습니다.
 *
 * @param index 정적 블록의 번역에 대한 고유 인덱스입니다.
 * @param messageIndex `def.consts` 배열의 번역 메시지 인덱스입니다.
 * @param subTemplateIndex 선택적 하위 템플릿 인덱스입니다.
 *
 * @codeGenApi
 */
export function ɵɵi18nStart(
  index: number,
  messageIndex: number,
  subTemplateIndex: number = -1,
): void {
  const tView = getTView();
  const lView = getLView();
  const adjustedIndex = HEADER_OFFSET + index;
  ngDevMode && assertDefined(tView, `tView는 정의되어야 합니다.`);
  const message = getConstant<string>(tView.consts, messageIndex)!;
  const parentTNode = getCurrentParentTNode() as TElementNode | null;
  if (tView.firstCreatePass) {
    i18nStartFirstCreatePass(
      tView,
      parentTNode === null ? 0 : parentTNode.index,
      lView,
      adjustedIndex,
      message,
      subTemplateIndex,
    );
  }

  // 이 LView가 i18n 블록을 가지고 있다는 플래그를 설정합니다.
  // 이 플래그는 나중에 이 컴포넌트가 수화되어야 하는지 여부를 결정하는 데 사용됩니다.
  // (현재 수화는 i18n 블록에 대해 지원되지 않습니다).
  if (tView.type === TViewType.Embedded) {
    // 호스트 컴포넌트의 LView에 주석을 추가합니다(임베디드 뷰의 LView가 아닙니다).
    // 수화는 컴포넌트 단위로만 건너뛸 수 있습니다.
    const componentLView = lView[DECLARATION_COMPONENT_VIEW];
    componentLView[FLAGS] |= LViewFlags.HasI18n;
  } else {
    lView[FLAGS] |= LViewFlags.HasI18n;
  }

  const tI18n = tView.data[adjustedIndex] as TI18n;
  const sameViewParentTNode = parentTNode === lView[T_HOST] ? null : parentTNode;
  const parentRNode = getClosestRElement(tView, sameViewParentTNode, lView);
  // `parentTNode`가 `ElementContainer`인 경우 `<!--ng-container--->`가 있습니다.
  // 삽입 시 `<!--ng-container--->` 앞에 삽입해야 합니다.
  const insertInFrontOf =
    parentTNode && parentTNode.type & TNodeType.ElementContainer ? lView[parentTNode.index] : null;
  prepareI18nBlockForHydration(lView, adjustedIndex, parentTNode, subTemplateIndex);
  applyCreateOpCodes(lView, tI18n.create, parentRNode, insertInFrontOf);
  setInI18nBlock(true);
}

/**
 * `i18nStart` 및 `i18nEnd`로 표시된 번역 블록을 번역합니다. 텍스트/ICU 노드를
 * 렌더 트리에 삽입하고, 자리 표시자 노드를 이동하고, 삭제된 노드를 제거합니다.
 *
 * @codeGenApi
 */
export function ɵɵi18nEnd(): void {
  setInI18nBlock(false);
}

/**
 *
 * 자리 표시자가 포함되지 않은 번역 블록을 만들기 위해 이 명령어를 사용합니다.
 * {@link i18nStart} 및 {@link i18nEnd}를 단일 명령어에서 모두 호출합니다.
 *
 * 번역 `message`는 로케일에 따라 특정한 값입니다. 번역 문자열에는
 * 번역 내의 내부 요소 및 하위 템플릿과 연관된 자리 표시자가 포함될 수 있습니다.
 *
 * 번역 `message` 자리 표시자는 다음과 같습니다:
 * - `�{index}(:{block})�`: *Binding Placeholder*: 표현식이 삽입될 위치를 표시합니다.
 *   자리 표시자 `index`는 표현식 바인딩 인덱스를 가리킵니다. 선언된 하위 템플릿과 일치하는
 *   선택적 `block`이 있습니다.
 * - `�#{index}(:{block})�`/`�/#{index}(:{block})�`: *Element Placeholder*: 원래 번역 블록에
 *   삽입된 DOM 요소의 시작과 끝을 표시합니다. 자리 표시자 `index`는 템플릿 명령어 세트에서
 *   요소 인덱스를 가리킵니다. 선언된 하위 템플릿과 일치하는 선택적 `block`이 있습니다.
 * - `�*{index}:{block}�`/`�/*{index}:{block}�`: *Sub-template Placeholder*: 하위 템플릿은
 *   분할되어 각 Angular 템플릿 함수에서 별도로 번역되어야 합니다. `index`는
 *   `template` 명령어 인덱스를 가리킵니다. 선언된 하위 템플릿과 일치하는 `block`이 있습니다.
 *
 * @param index 정적 블록의 번역에 대한 고유 인덱스입니다.
 * @param messageIndex `def.consts` 배열의 번역 메시지 인덱스입니다.
 * @param subTemplateIndex 선택적 하위 템플릿 인덱스입니다.
 *
 * @codeGenApi
 */
export function ɵɵi18n(index: number, messageIndex: number, subTemplateIndex?: number): void {
  ɵɵi18nStart(index, messageIndex, subTemplateIndex);
  ɵɵi18nEnd();
}

/**
 * 번역 가능한 속성 목록을 표시합니다.
 *
 * @param index 정적 블록의 고유 인덱스입니다.
 * @param values
 *
 * @codeGenApi
 */
export function ɵɵi18nAttributes(index: number, attrsIndex: number): void {
  const tView = getTView();
  ngDevMode && assertDefined(tView, `tView는 정의되어야 합니다.`);
  const attrs = getConstant<string[]>(tView.consts, attrsIndex)!;
  i18nAttributesFirstPass(tView, index + HEADER_OFFSET, attrs);
}

/**
 * 번역된 노드를 업데이트해야 하는지 결정하기 위해 각 업데이트 주기 동안 바인딩 값을 저장합니다.
 *
 * @param value 바인딩의 값입니다.
 * @returns 이 함수는 자신을 반환하여 체인할 수 있도록 합니다.
 * (예: `i18nExp(ctx.name)(ctx.title)`)
 *
 * @codeGenApi
 */
export function ɵɵi18nExp<T>(value: T): typeof ɵɵi18nExp {
  const lView = getLView();
  setMaskBit(bindingUpdated(lView, nextBindingIndex(), value));
  return ɵɵi18nExp;
}

/**
 * 바인딩이 변경되었을 때 번역 블록 또는 i18n 속성을 업데이트합니다.
 *
 * @param index {@link i18nStart} (번역 블록) 또는 {@link i18nAttributes}
 * (i18n 속성) 중에서 업데이트할 내용을 지정하는 인덱스입니다.
 *
 * @codeGenApi
 */
export function ɵɵi18nApply(index: number) {
  applyI18n(getTView(), getLView(), index + HEADER_OFFSET);
}

/**
 * 국제화를 위한 메시지 문자열 후처리를 처리합니다.
 *
 * 메시지 문자열 후처리를 처리하여 중간 형식(대체해야 하는 일부 마커가 포함될 수 있음)
 * 에서 최종 형식으로 변환하여 i18nStart 명령어에서 소비할 수 있도록 합니다. 후처리 단계는 다음과 같습니다:
 *
 * 1. 모든 다중 값 사례 해결 (예: [�*1:1��#2:1�|�#4:1�|�5�])
 * 2. 모든 ICU 변수 대체 (예: "VAR_PLURAL")
 * 3. ICU 내에서 사용된 모든 자리 표시자를 {PLACEHOLDER} 형식으로 대체
 * 4. 여러 ICU가 동일한 자리 표시자 이름을 가질 경우 해당 값으로 모든 ICU 참조 대체
 *
 * @param message 후처리를 위한 원시 번역 문자열입니다.
 * @param replacements 적용되어야 하는 대체 세트입니다.
 *
 * @returns i18nStart 명령어에서 소비할 수 있는 변환된 문자열입니다.
 *
 * @codeGenApi
 */
export function ɵɵi18nPostprocess(
  message: string,
  replacements: {[key: string]: string | string[]} = {},
): string {
  return i18nPostprocess(message, replacements);
}
