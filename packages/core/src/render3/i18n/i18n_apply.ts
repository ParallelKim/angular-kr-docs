/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {claimDehydratedIcuCase, isI18nHydrationSupportEnabled} from '../../hydration/i18n';
import {locateI18nRNodeByIndex} from '../../hydration/node_lookup_utils';
import {isDisconnectedNode, markRNodeAsClaimedByHydration} from '../../hydration/utils';
import {getPluralCase} from '../../i18n/localization';
import {
  assertDefined,
  assertDomNode,
  assertEqual,
  assertGreaterThan,
  assertIndexInRange,
  throwError,
} from '../../util/assert';
import {assertIndexInExpandoRange, assertTIcu} from '../assert';
import {attachPatchData} from '../context_discovery';
import {elementPropertyInternal, setElementAttribute} from '../instructions/shared';
import {
  ELEMENT_MARKER,
  I18nCreateOpCode,
  I18nCreateOpCodes,
  I18nUpdateOpCode,
  I18nUpdateOpCodes,
  ICU_MARKER,
  IcuCreateOpCode,
  IcuCreateOpCodes,
  IcuType,
  TI18n,
  TIcu,
} from '../interfaces/i18n';
import {TNode} from '../interfaces/node';
import {RElement, RNode, RText} from '../interfaces/renderer_dom';
import {SanitizerFn} from '../interfaces/sanitization';
import {HEADER_OFFSET, HYDRATION, LView, RENDERER, TView} from '../interfaces/view';
import {
  createCommentNode,
  createElementNode,
  createTextNode,
  nativeInsertBefore,
  nativeRemoveNode,
  updateTextNode,
} from '../dom_node_manipulation';
import {
  getBindingIndex,
  isInSkipHydrationBlock,
  lastNodeWasCreated,
  wasLastNodeCreated,
} from '../state';
import {renderStringify} from '../util/stringify_utils';
import {getNativeByIndex, unwrapRNode} from '../util/view_utils';

import {getLocaleId} from './i18n_locale_id';
import {
  getCurrentICUCaseIndex,
  getParentFromIcuCreateOpCode,
  getRefFromIcuCreateOpCode,
  getTIcu,
} from './i18n_util';

/**
 * `ɵɵi18nExp`에서 변경된 입력 바인딩을 추적합니다.
 *
 * 이는 해당 입력이 변경될 때만 i18n 내 표현식을 효율적으로 업데이트하는 데 사용됩니다.
 *
 * 1) 각 비트는 변경된 `ɵɵi18nExp`를 나타냅니다.
 * 2) JS에서는 32비트가 허용됩니다.
 * 3) 32비트는 특별하며 32비트 이상의 모든 변경 사항에 대해 공유됩니다. (즉, 32개 이상의 `ɵɵi18nExp`가 있는 경우, 32번째 `ɵɵi18nExp` 이후의 모든 변경 사항은 동일한 비트로 매핑됩니다. 즉, 우리가 필요 이상으로 변경할 수 있습니다. 그러나 바인딩이 32개인 i18n 표현식은 드물므로 실제로 문제는 되지 않아야 합니다.)
 */
let changeMask = 0b0;

/**
 * `changeMask`에서 업데이트해야 하는 비트를 추적합니다.
 *
 * 이 값은 `ɵɵi18nExp` 호출 시마다 증가합니다.
 */
let changeMaskCounter = 0;

/**
 * `ɵɵi18nExp`에서 변경된 입력 바인딩을 추적합니다.
 *
 * `setMaskBit`는 각 `ɵɵi18nExp` 호출 시 호출됩니다.
 *
 * @param hasChange `ɵɵi18nExp`가 변경 사항을 감지했는지 여부.
 */
export function setMaskBit(hasChange: boolean) {
  if (hasChange) {
    changeMask = changeMask | (1 << Math.min(changeMaskCounter, 31));
  }
  changeMaskCounter++;
}

export function applyI18n(tView: TView, lView: LView, index: number) {
  if (changeMaskCounter > 0) {
    ngDevMode && assertDefined(tView, `tView는 정의되어야 합니다.`);
    const tI18n = tView.data[index] as TI18n | I18nUpdateOpCodes;
    // `index`가 `ɵɵi18nAttributes`를 가리킬 때 배열이 되고, 그렇지 않으면 `TI18n`이 됩니다.
    const updateOpCodes: I18nUpdateOpCodes = Array.isArray(tI18n)
      ? (tI18n as I18nUpdateOpCodes)
      : (tI18n as TI18n).update;
    const bindingsStartIndex = getBindingIndex() - changeMaskCounter - 1;
    applyUpdateOpCodes(tView, lView, updateOpCodes, bindingsStartIndex, changeMask);
  }
  // 다음 업데이트 주기를 위해 changeMask 및 maskBit를 기본값으로 재설정
  changeMask = 0b0;
  changeMaskCounter = 0;
}

function createNodeWithoutHydration(
  lView: LView,
  textOrName: string,
  nodeType: typeof Node.COMMENT_NODE | typeof Node.TEXT_NODE | typeof Node.ELEMENT_NODE,
) {
  const renderer = lView[RENDERER];

  switch (nodeType) {
    case Node.COMMENT_NODE:
      return createCommentNode(renderer, textOrName);

    case Node.TEXT_NODE:
      return createTextNode(renderer, textOrName);

    case Node.ELEMENT_NODE:
      return createElementNode(renderer, textOrName, null);
  }
}

let _locateOrCreateNode: typeof locateOrCreateNodeImpl = (lView, index, textOrName, nodeType) => {
  lastNodeWasCreated(true);
  return createNodeWithoutHydration(lView, textOrName, nodeType);
};

function locateOrCreateNodeImpl(
  lView: LView,
  index: number,
  textOrName: string,
  nodeType: typeof Node.COMMENT_NODE | typeof Node.TEXT_NODE | typeof Node.ELEMENT_NODE,
) {
  const hydrationInfo = lView[HYDRATION];
  const noOffsetIndex = index - HEADER_OFFSET;
  const isNodeCreationMode =
    !isI18nHydrationSupportEnabled() ||
    !hydrationInfo ||
    isInSkipHydrationBlock() ||
    isDisconnectedNode(hydrationInfo, noOffsetIndex);

  lastNodeWasCreated(isNodeCreationMode);
  if (isNodeCreationMode) {
    return createNodeWithoutHydration(lView, textOrName, nodeType);
  }

  const native = locateI18nRNodeByIndex(hydrationInfo!, noOffsetIndex) as RNode;

  // TODO: 개선된 오류 처리
  //
  // 다른 수분 경로는 validateMatchingNode()를 사용하여
  // 개발 모드에서 예상되는 DOM에 대한 자세한 정보를 제공합니다.
  // 그러나 i18n 블록의 모든 노드는 TNode가 없습니다. 대신,
  // 우리는 유사한 메시지를 생성하기 위해 AST를 사용할 수 있어야 합니다.
  ngDevMode && assertDefined(native, '기대되는 네이티브 요소입니다.');
  ngDevMode && assertEqual((native as Node).nodeType, nodeType, '일치하는 nodeType 기대됨');
  ngDevMode &&
    nodeType === Node.ELEMENT_NODE &&
    assertEqual(
      (native as HTMLElement).tagName.toLowerCase(),
      textOrName.toLowerCase(),
      '일치하는 tagName을 기대합니다.',
    );
  ngDevMode && markRNodeAsClaimedByHydration(native);

  return native;
}

export function enableLocateOrCreateI18nNodeImpl() {
  _locateOrCreateNode = locateOrCreateNodeImpl;
}

/**
 * `TI18n.create`에 저장된 `I18nCreateOpCodes` op-codes를 적용합니다.
 *
 * 국제화된 텍스트(및 주석) 노드를 생성합니다.
 *
 * @param lView 현재 lView
 * @param createOpCodes 적용할 op-codes 집합
 * @param parentRNode 부모 노드 (직접 자식을 미리 추가할 수 있도록) 또는 루트 노드인 경우 `null`.
 * @param insertInFrontOf DOM 노드로 앵커로 사용해야 하는 노드.
 */
export function applyCreateOpCodes(
  lView: LView,
  createOpCodes: I18nCreateOpCodes,
  parentRNode: RElement | null,
  insertInFrontOf: RElement | null,
): void {
  const renderer = lView[RENDERER];
  for (let i = 0; i < createOpCodes.length; i++) {
    const opCode = createOpCodes[i++] as any;
    const text = createOpCodes[i] as string;
    const isComment = (opCode & I18nCreateOpCode.COMMENT) === I18nCreateOpCode.COMMENT;
    const appendNow =
      (opCode & I18nCreateOpCode.APPEND_EAGERLY) === I18nCreateOpCode.APPEND_EAGERLY;
    const index = opCode >>> I18nCreateOpCode.SHIFT;
    let rNode = lView[index];
    let lastNodeWasCreated = false;
    if (rNode === null) {
      // 이미 존재하지 않는 경우에만 새로운 DOM 노드를 생성합니다. ICU가 다시 이전
      // 케이스로 전환되면 새로운 DOM 노드를 만들 필요가 없습니다.
      rNode = lView[index] = _locateOrCreateNode(
        lView,
        index,
        text,
        isComment ? Node.COMMENT_NODE : Node.TEXT_NODE,
      );
      lastNodeWasCreated = wasLastNodeCreated();
    }
    if (appendNow && parentRNode !== null && lastNodeWasCreated) {
      nativeInsertBefore(renderer, parentRNode, rNode, insertInFrontOf, false);
    }
  }
}

/**
 * `I18nMutateOpCodes` OpCodes를 적용합니다.
 *
 * @param tView 현재 `TView`
 * @param mutableOpCodes 처리할 Mutable OpCodes
 * @param lView 현재 `LView`
 * @param anchorRNode i18n 노드가 삽입되어야 하는 위치.
 */
export function applyMutableOpCodes(
  tView: TView,
  mutableOpCodes: IcuCreateOpCodes,
  lView: LView,
  anchorRNode: RNode,
): void {
  ngDevMode && assertDomNode(anchorRNode);
  const renderer = lView[RENDERER];
  // `rootIdx` represents the node into which all inserts happen.
  let rootIdx: number | null = null;
  // `rootRNode` represents the real node into which we insert. This can be different from
  // `lView[rootIdx]` if we have projection.
  //  - null we don't have a parent (as can be the case in when we are inserting into a root of
  //    LView which has no parent.)
  //  - `RElement` The element representing the root after taking projection into account.
  let rootRNode!: RElement | null;
  for (let i = 0; i < mutableOpCodes.length; i++) {
    const opCode = mutableOpCodes[i];
    if (typeof opCode == 'string') {
      const textNodeIndex = mutableOpCodes[++i] as number;
      if (lView[textNodeIndex] === null) {
        ngDevMode && assertIndexInRange(lView, textNodeIndex);
        lView[textNodeIndex] = _locateOrCreateNode(lView, textNodeIndex, opCode, Node.TEXT_NODE);
      }
    } else if (typeof opCode == 'number') {
      switch (opCode & IcuCreateOpCode.MASK_INSTRUCTION) {
        case IcuCreateOpCode.AppendChild:
          const parentIdx = getParentFromIcuCreateOpCode(opCode);
          if (rootIdx === null) {
            // 첫 번째 작업은 `rootIdx`를 저장해야 하며, 첫 번째 작업은 루트에 삽입해야 합니다.
            rootIdx = parentIdx;
            rootRNode = renderer.parentNode(anchorRNode);
          }
          let insertInFrontOf: RNode | null;
          let parentRNode: RElement | null;
          if (parentIdx === rootIdx) {
            insertInFrontOf = anchorRNode;
            parentRNode = rootRNode;
          } else {
            insertInFrontOf = null;
            parentRNode = unwrapRNode(lView[parentIdx]) as RElement;
          }
          // FIXME(misko): `processI18nText`로 리팩토링
          if (parentRNode !== null) {
            // This can happen if the `LView` we are adding to is not attached to a parent `LView`.
            // In such a case there is no "root" we can attach to. This is fine, as we still need to
            // create the elements. When the `LView` gets later added to a parent these "root" nodes
            // get picked up and added.
            ngDevMode && assertDomNode(parentRNode);
            const refIdx = getRefFromIcuCreateOpCode(opCode);
            ngDevMode && assertGreaterThan(refIdx, HEADER_OFFSET, 'Missing ref');
            // `unwrapRNode` is not needed here as all of these point to RNodes as part of the i18n
            // which can't have components.
            const child = lView[refIdx] as RElement;
            ngDevMode && assertDomNode(child);
            nativeInsertBefore(renderer, parentRNode, child, insertInFrontOf, false);
            const tIcu = getTIcu(tView, refIdx);
            if (tIcu !== null && typeof tIcu === 'object') {
              // If we just added a comment node which has ICU then that ICU may have already been
              // rendered and therefore we need to re-add it here.
              ngDevMode && assertTIcu(tIcu);
              const caseIndex = getCurrentICUCaseIndex(tIcu, lView);
              if (caseIndex !== null) {
                applyMutableOpCodes(tView, tIcu.create[caseIndex], lView, lView[tIcu.anchorIdx]);
              }
            }
          }
          break;
        case IcuCreateOpCode.Attr:
          const elementNodeIndex = opCode >>> IcuCreateOpCode.SHIFT_REF;
          const attrName = mutableOpCodes[++i] as string;
          const attrValue = mutableOpCodes[++i] as string;
          // This code is used for ICU expressions only, since we don't support
          // directives/components in ICUs, we don't need to worry about inputs here
          setElementAttribute(
            renderer,
            getNativeByIndex(elementNodeIndex, lView) as RElement,
            null,
            null,
            attrName,
            attrValue,
            null,
          );
          break;
        default:
          if (ngDevMode) {
            throw new RuntimeError(
              RuntimeErrorCode.INVALID_I18N_STRUCTURE,
              `mutate 작업의 유형을 결정할 수 없습니다: "${opCode}"`,
            );
          }
      }
    } else {
      switch (opCode) {
        case ICU_MARKER:
          const commentValue = mutableOpCodes[++i] as string;
          const commentNodeIndex = mutableOpCodes[++i] as number;
          if (lView[commentNodeIndex] === null) {
            ngDevMode &&
              assertEqual(
                typeof commentValue,
                'string',
                `기대되는 주석 노드 값은 "${commentValue}"입니다.`,
              );
            ngDevMode && assertIndexInExpandoRange(lView, commentNodeIndex);
            const commentRNode = (lView[commentNodeIndex] = _locateOrCreateNode(
              lView,
              commentNodeIndex,
              commentValue,
              Node.COMMENT_NODE,
            ));
            attachPatchData(commentRNode, lView);
          }
          break;
        case ELEMENT_MARKER:
          const tagName = mutableOpCodes[++i] as string;
          const elementNodeIndex = mutableOpCodes[++i] as number;
          if (lView[elementNodeIndex] === null) {
            ngDevMode &&
              assertEqual(
                typeof tagName,
                'string',
                `기대되는 요소 노드 태그 이름은 "${tagName}"입니다.`,
              );

            ngDevMode && assertIndexInExpandoRange(lView, elementNodeIndex);
            const elementRNode = (lView[elementNodeIndex] = _locateOrCreateNode(
              lView,
              elementNodeIndex,
              tagName,
              Node.ELEMENT_NODE,
            ));
            attachPatchData(elementRNode, lView);
          }
          break;
        default:
          ngDevMode && throwError(`mutate 작업의 유형을 결정할 수 없습니다: "${opCode}"`);
      }
    }
  }
}

/**
 * `I18nUpdateOpCodes` OpCodes를 적용합니다.
 *
 * @param tView 현재 `TView`
 * @param lView 현재 `LView`
 * @param updateOpCodes 처리할 OpCodes
 * @param bindingsStartIndex 첫 번째 `ɵɵi18nApply`의 위치
 * @param changeMask 각 비트는 `ɵɵi18nExp`에 해당합니다 (역방향으로 `bindingsStartIndex`에서 카운팅)
 */
export function applyUpdateOpCodes(
  tView: TView,
  lView: LView,
  updateOpCodes: I18nUpdateOpCodes,
  bindingsStartIndex: number,
  changeMask: number,
) {
  for (let i = 0; i < updateOpCodes.length; i++) {
    // bit code to check if we should apply the next update
    const checkBit = updateOpCodes[i] as number;
    // Number of opCodes to skip until next set of update codes
    const skipCodes = updateOpCodes[++i] as number;
    if (checkBit & changeMask) {
      // The value has been updated since last checked
      let value = '';
      for (let j = i + 1; j <= i + skipCodes; j++) {
        const opCode = updateOpCodes[j];
        if (typeof opCode == 'string') {
          value += opCode;
        } else if (typeof opCode == 'number') {
          if (opCode < 0) {
            // Negative opCode represent `i18nExp` values offset.
            value += renderStringify(lView[bindingsStartIndex - opCode]);
          } else {
            const nodeIndex = opCode >>> I18nUpdateOpCode.SHIFT_REF;
            switch (opCode & I18nUpdateOpCode.MASK_OPCODE) {
              case I18nUpdateOpCode.Attr:
                const propName = updateOpCodes[++j] as string;
                const sanitizeFn = updateOpCodes[++j] as SanitizerFn | null;
                const tNodeOrTagName = tView.data[nodeIndex] as TNode | string;
                ngDevMode && assertDefined(tNodeOrTagName, 'TNode 또는 문자열이 기대됩니다.');
                if (typeof tNodeOrTagName === 'string') {
                  // IF we don't have a `TNode`, then we are an element in ICU (as ICU content does
                  // not have TNode), in which case we know that there are no directives, and hence
                  // we use attribute setting.
                  setElementAttribute(
                    lView[RENDERER],
                    lView[nodeIndex],
                    null,
                    tNodeOrTagName,
                    propName,
                    value,
                    sanitizeFn,
                  );
                } else {
                  elementPropertyInternal(
                    tView,
                    tNodeOrTagName,
                    lView,
                    propName,
                    value,
                    lView[RENDERER],
                    sanitizeFn,
                    false,
                  );
                }
                break;
              case I18nUpdateOpCode.Text:
                const rText = lView[nodeIndex] as RText | null;
                rText !== null && updateTextNode(lView[RENDERER], rText, value);
                break;
              case I18nUpdateOpCode.IcuSwitch:
                applyIcuSwitchCase(tView, getTIcu(tView, nodeIndex)!, lView, value);
                break;
              case I18nUpdateOpCode.IcuUpdate:
                applyIcuUpdateCase(tView, getTIcu(tView, nodeIndex)!, bindingsStartIndex, lView);
                break;
            }
          }
        }
      }
    } else {
      const opCode = updateOpCodes[i + 1] as number;
      if (opCode > 0 && (opCode & I18nUpdateOpCode.MASK_OPCODE) === I18nUpdateOpCode.IcuUpdate) {
        // Special case for the `icuUpdateCase`. It could be that the mask did not match, but
        // we still need to execute `icuUpdateCase` because the case has changed recently due to
        // previous `icuSwitchCase` instruction. (`icuSwitchCase` and `icuUpdateCase` always come in
        // pairs.)
        const nodeIndex = opCode >>> I18nUpdateOpCode.SHIFT_REF;
        const tIcu = getTIcu(tView, nodeIndex)!;
        const currentIndex = lView[tIcu.currentCaseLViewIndex];
        if (currentIndex < 0) {
          applyIcuUpdateCase(tView, tIcu, bindingsStartIndex, lView);
        }
      }
    }
    i += skipCodes;
  }
}

/**
 * 기존 ICU 업데이트와 관련된 OpCodes를 적용합니다.
 *
 * @param tView 현재 `TView`
 * @param tIcu 현재 `TIcu`
 * @param bindingsStartIndex 첫 번째 `ɵɵi18nApply`의 위치
 * @param lView 현재 `LView`
 */
function applyIcuUpdateCase(tView: TView, tIcu: TIcu, bindingsStartIndex: number, lView: LView) {
  ngDevMode && assertIndexInRange(lView, tIcu.currentCaseLViewIndex);
  let activeCaseIndex = lView[tIcu.currentCaseLViewIndex];
  if (activeCaseIndex !== null) {
    let mask = changeMask;
    if (activeCaseIndex < 0) {
      // Clear the flag.
      // Negative number means that the ICU was freshly created and we need to force the update.
      activeCaseIndex = lView[tIcu.currentCaseLViewIndex] = ~activeCaseIndex;
      // -1 is same as all bits on, which simulates creation since it marks all bits dirty
      mask = -1;
    }
    applyUpdateOpCodes(tView, lView, tIcu.update[activeCaseIndex], bindingsStartIndex, mask);
  }
}

/**
 * ICU에서 케이스를 전환하는 것과 관련된 OpCodes를 적용합니다.
 *
 * 기존 케이스를 제거하고 새로운 케이스를 구축하는 것을 포함합니다.
 *
 * @param tView 현재 `TView`
 * @param tIcu 현재 `TIcu`
 * @param lView 현재 `LView`
 * @param value 업데이트할 케이스의 값.
 */
function applyIcuSwitchCase(tView: TView, tIcu: TIcu, lView: LView, value: string) {
  const caseIndex = getCaseIndex(tIcu, value);
  let activeCaseIndex = getCurrentICUCaseIndex(tIcu, lView);
  if (activeCaseIndex !== caseIndex) {
    applyIcuSwitchCaseRemove(tView, tIcu, lView);
    lView[tIcu.currentCaseLViewIndex] = caseIndex === null ? null : ~caseIndex;
    if (caseIndex !== null) {
      const anchorRNode = lView[tIcu.anchorIdx];
      if (anchorRNode) {
        ngDevMode && assertDomNode(anchorRNode);
        applyMutableOpCodes(tView, tIcu.create[caseIndex], lView, anchorRNode);
      }
      claimDehydratedIcuCase(lView, tIcu.anchorIdx, caseIndex);
    }
  }
}

/**
 * ICU 케이스를 제거하는 것과 관련된 OpCodes를 적용합니다.
 *
 * 기존 케이스를 제거하고 새로운 케이스를 구축하는 것을 포함합니다.
 *
 * @param tView 현재 `TView`
 * @param tIcu 현재 `TIcu`
 * @param lView 현재 `LView`
 */
function applyIcuSwitchCaseRemove(tView: TView, tIcu: TIcu, lView: LView) {
  let activeCaseIndex = getCurrentICUCaseIndex(tIcu, lView);
  if (activeCaseIndex !== null) {
    const removeCodes = tIcu.remove[activeCaseIndex];
    for (let i = 0; i < removeCodes.length; i++) {
      const nodeOrIcuIndex = removeCodes[i] as number;
      if (nodeOrIcuIndex > 0) {
        const rNode = getNativeByIndex(nodeOrIcuIndex, lView);
        rNode !== null && nativeRemoveNode(lView[RENDERER], rNode);
      } else {
        applyIcuSwitchCaseRemove(tView, getTIcu(tView, ~nodeOrIcuIndex)!, lView);
      }
    }
  }
}

/**
 * 주 바인딩 값에 따라 ICU 표현식의 현재 케이스 인덱스를 반환합니다.
 *
 * @param icuExpression
 * @param bindingValue 이 ICU 표현식에서 사용되는 주 바인딩의 값
 */
function getCaseIndex(icuExpression: TIcu, bindingValue: string): number | null {
  let index = icuExpression.cases.indexOf(bindingValue);
  if (index === -1) {
    switch (icuExpression.type) {
      case IcuType.plural: {
        const resolvedCase = getPluralCase(bindingValue, getLocaleId());
        index = icuExpression.cases.indexOf(resolvedCase);
        if (index === -1 && resolvedCase !== 'other') {
          index = icuExpression.cases.indexOf('other');
        }
        break;
      }
      case IcuType.select: {
        index = icuExpression.cases.indexOf('other');
        break;
      }
    }
  }
  return index === -1 ? null : index;
}
