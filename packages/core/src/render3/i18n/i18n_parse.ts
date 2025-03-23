/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import '../../util/ng_dev_mode';
import '../../util/ng_i18n_closure_mode';

import {XSS_SECURITY_URL} from '../../error_details_base_url';
import {
  getTemplateContent,
  URI_ATTRS,
  VALID_ATTRS,
  VALID_ELEMENTS,
} from '../../sanitization/html_sanitizer';
import {getInertBodyHelper} from '../../sanitization/inert_body';
import {_sanitizeUrl} from '../../sanitization/url_sanitizer';
import {
  assertDefined,
  assertEqual,
  assertGreaterThanOrEqual,
  assertOneOf,
  assertString,
} from '../../util/assert';
import {CharCode} from '../../util/char_code';
import {loadIcuContainerVisitor} from '../instructions/i18n_icu_container_visitor';

import {getDocument} from '../interfaces/document';
import {
  ELEMENT_MARKER,
  I18nCreateOpCode,
  I18nCreateOpCodes,
  I18nElementNode,
  I18nNode,
  I18nNodeKind,
  I18nPlaceholderNode,
  I18nPlaceholderType,
  I18nRemoveOpCodes,
  I18nUpdateOpCode,
  I18nUpdateOpCodes,
  ICU_MARKER,
  IcuCreateOpCode,
  IcuCreateOpCodes,
  IcuExpression,
  IcuType,
  TI18n,
  TIcu,
} from '../interfaces/i18n';
import {TNode, TNodeType} from '../interfaces/node';
import {SanitizerFn} from '../interfaces/sanitization';
import {HEADER_OFFSET, LView, TView} from '../interfaces/view';
import {getCurrentParentTNode, getCurrentTNode, setCurrentTNode} from '../state';

import {
  i18nCreateOpCodesToString,
  i18nRemoveOpCodesToString,
  i18nUpdateOpCodesToString,
  icuCreateOpCodesToString,
} from './i18n_debug';
import {addTNodeAndUpdateInsertBeforeIndex} from './i18n_insert_before_index';
import {ensureIcuContainerVisitorLoaded} from './i18n_tree_shaking';
import {
  createTNodePlaceholder,
  icuCreateOpCode,
  isRootTemplateMessage,
  setTIcu,
  setTNodeInsertBeforeIndex,
} from './i18n_util';
import {createTNodeAtIndex} from '../tnode_manipulation';
import {allocExpando} from '../view/construction';

const BINDING_REGEXP = /�(\d+):?\d*�/gi;
const ICU_REGEXP = /({\s*�\d+:?\d*�\s*,\s*\S{6}\s*,[\s\S]*})/gi;
const NESTED_ICU = /�(\d+)�/;
const ICU_BLOCK_REGEXP = /^\s*(�\d+:?\d*�)\s*,\s*(select|plural)\s*,/;

const MARKER = `�`;
const SUBTEMPLATE_REGEXP = /�\/?\*(\d+:\d+)�/gi;
const PH_REGEXP = /�(\/?[#*]\d+):?\d*�/gi;

/**
 * Angular는 특수 엔티티 &ngsp;를 제거할 수 없는 공간의 플레이스홀더로 사용합니다.
 * 이는 0xE500 PUA(Private Use Areas) 유니코드 문자로 대체되며 이후 공백으로 대체됩니다.
 * 우리는 번역에 이 특수 문자가 포함될 수 있으므로 동일한 아이디어를 재구현하고 있습니다.
 */
const NGSP_UNICODE_REGEXP = /\uE500/g;
function replaceNgsp(value: string): string {
  return value.replace(NGSP_UNICODE_REGEXP, ' ');
}

/**
 * 기존 객체 위에 `debug` 속성 getter를 패치합니다.
 *
 * 주의: 항상 `ngDevMode && attachDebugObject(...)`와 함께 이 메소드를 호출하십시오.
 *
 * @param obj 패치할 객체
 * @param debugGetter 값을 반환하는 getter
 */
function attachDebugGetter<T>(obj: T, debugGetter: (this: T) => any): void {
  if (ngDevMode) {
    Object.defineProperty(obj, 'debug', {get: debugGetter, enumerable: false});
  } else {
    throw new Error(
      '이 메소드는 `ngDevMode`로 보호되어야 하며, 그렇지 않으면 프로덕션에서 트리 섬유화될 수 없습니다!',
    );
  }
}

/**
 * i18n 번역 블록에서 동적 노드를 생성합니다.
 *
 * - 텍스트 노드는 동기적으로 생성됩니다.
 * - TNodes는 게으르게 트리에 연결됩니다.
 *
 * @param tView 현재 `TView`
 * @parentTNodeIndex 이 i18n 블록의 부모 TNode에 대한 인덱스
 * @param lView 현재 `LView`
 * @param index `ɵɵi18nStart` 명령의 인덱스.
 * @param message 번역할 메시지.
 * @param subTemplateIndex 메시지 번역의 서브 템플릿에 대한 인덱스입니다. (예: `ngIf`의 경우) (-1인 경우)
 */
export function i18nStartFirstCreatePass(
  tView: TView,
  parentTNodeIndex: number,
  lView: LView,
  index: number,
  message: string,
  subTemplateIndex: number,
) {
  const rootTNode = getCurrentParentTNode();
  const createOpCodes: I18nCreateOpCodes = [] as any;
  const updateOpCodes: I18nUpdateOpCodes = [] as any;
  const existingTNodeStack: TNode[][] = [[]];
  const astStack: Array<Array<I18nNode>> = [[]];
  if (ngDevMode) {
    attachDebugGetter(createOpCodes, i18nCreateOpCodesToString);
    attachDebugGetter(updateOpCodes, i18nUpdateOpCodesToString);
  }

  message = getTranslationForTemplate(message, subTemplateIndex);
  const msgParts = replaceNgsp(message).split(PH_REGEXP);
  for (let i = 0; i < msgParts.length; i++) {
    let value = msgParts[i];
    if ((i & 1) === 0) {
      // 짝수 인덱스는 텍스트입니다 (바인딩 및 ICU 표현식 포함)
      const parts = i18nParseTextIntoPartsAndICU(value);
      for (let j = 0; j < parts.length; j++) {
        let part = parts[j];
        if ((j & 1) === 0) {
          // `j`가 홀수이므로 `part`는 문자열입니다.
          const text = part as string;
          ngDevMode && assertString(text, '구문 분석된 ICU 부분은 문자열이어야 합니다.');
          if (text !== '') {
            i18nStartFirstCreatePassProcessTextNode(
              astStack[0],
              tView,
              rootTNode,
              existingTNodeStack[0],
              createOpCodes,
              updateOpCodes,
              lView,
              text,
            );
          }
        } else {
          // `j`가 짝수이므로 `part`는 `ICUExpression`입니다.
          const icuExpression: IcuExpression = part as IcuExpression;
          // ICU 표현식이 올바른 형태인지 확인합니다. 번역에는 잘못된 구성이 포함될 수 있습니다(원래 메시지는 올바른 경우에도), 따라서 런타임에서 ICU 구문 분석이 성공하지 않을 수 있습니다(따라서 `icuExpression`은 문자열로 남습니다).
          // 참고: 우리는 `ngDevMode`를 사용하지 않아서 여기에 오류를 의도적으로 유지합니다. 왜냐하면 값은 로케일에 따라 변경될 수 있으며 사용자가 개발하는 동안 잘못된 문자열에 도달할 것이라는 보장이 없기 때문입니다.
          if (typeof icuExpression !== 'object') {
            throw new Error(`"${message}" 메시지에서 ICU 표현식을 파싱할 수 없습니다.`);
          }
          const icuContainerTNode = createTNodeAndAddOpCode(
            tView,
            rootTNode,
            existingTNodeStack[0],
            lView,
            createOpCodes,
            ngDevMode ? `ICU ${index}:${icuExpression.mainBinding}` : '',
            true,
          );
          const icuNodeIndex = icuContainerTNode.index;
          ngDevMode &&
            assertGreaterThanOrEqual(
              icuNodeIndex,
              HEADER_OFFSET,
              '인덱스는 절대 LView 오프셋에 있어야 합니다.',
            );
          icuStart(
            astStack[0],
            tView,
            lView,
            updateOpCodes,
            parentTNodeIndex,
            icuExpression,
            icuNodeIndex,
          );
        }
      }
    } else {
      // 홀수 인덱스는 플레이스홀더입니다 (요소 및 서브 템플릿)
      // 현재 값은 '/#1:2'와 같은 형태입니다. (원래는 '�/#1:2�'에서 오름)
      const isClosing = value.charCodeAt(0) === CharCode.SLASH;
      const type = value.charCodeAt(isClosing ? 1 : 0);
      ngDevMode && assertOneOf(type, CharCode.STAR, CharCode.HASH);
      const index = HEADER_OFFSET + Number.parseInt(value.substring(isClosing ? 2 : 1));
      if (isClosing) {
        existingTNodeStack.shift();
        astStack.shift();
        setCurrentTNode(getCurrentParentTNode()!, false);
      } else {
        const tNode = createTNodePlaceholder(tView, existingTNodeStack[0], index);
        existingTNodeStack.unshift([]);
        setCurrentTNode(tNode, true);

        const placeholderNode: I18nPlaceholderNode = {
          kind: I18nNodeKind.PLACEHOLDER,
          index,
          children: [],
          type:
            type === CharCode.HASH ? I18nPlaceholderType.ELEMENT : I18nPlaceholderType.SUBTEMPLATE,
        };
        astStack[0].push(placeholderNode);
        astStack.unshift(placeholderNode.children);
      }
    }
  }

  tView.data[index] = <TI18n>{
    create: createOpCodes,
    update: updateOpCodes,
    ast: astStack[0],
    parentTNodeIndex,
  };
}

/**
 * i18n 범위에서 공간을 할당하고 텍스트 또는 주석 노드를 생성하는 OpCode 지시문을 추가합니다.
 *
 * @param tView 현재 `TView`는 i18n 범위에서 공간을 할당하는 데 필요합니다.
 * @param rootTNode i18n 블록의 루트 `TNode`. 이 노드는 새 TNode가 `i18nStart` 명령의 일부로 추가될지 또는 `TNode.insertBeforeIndex`의 일부로 추가될지를 결정합니다.
 * @param existingTNodes `addTNodeAndUpdateInsertBeforeIndex`의 내부 상태.
 * @param lView 현재 `LView`는 i18n 범위에서 공간을 할당하는 데 필요합니다.
 * @param createOpCodes 새 opCodes가 추가될 `I18nCreateOpCodes`를 저장하는 배열입니다.
 * @param text `Text` 또는 `Comment` 노드가 생성될 때 추가될 텍스트입니다.
 * @param isICU `Comment` 노드가 ICU(대신 `Text`) 노드로 생성되어야 하면 true입니다.
 */
function createTNodeAndAddOpCode(
  tView: TView,
  rootTNode: TNode | null,
  existingTNodes: TNode[],
  lView: LView,
  createOpCodes: I18nCreateOpCodes,
  text: string | null,
  isICU: boolean,
): TNode {
  const i18nNodeIdx = allocExpando(tView, lView, 1, null);
  let opCode = i18nNodeIdx << I18nCreateOpCode.SHIFT;
  let parentTNode = getCurrentParentTNode();

  if (rootTNode === parentTNode) {
    // FIXME(misko): null `parentTNode`는 `LView` 경계를 벗어난 경우를 나타내야 합니다.
    // (부모가 없음), 그러나 어떤 경우에는 (우리가 `previousOrParentTNode`를 설정하는 방식에 따라 불일치가 있기 때문에) `rootTNode`를 가리킬 수 있습니다. 그래서 이것은 우회입니다.
    parentTNode = null;
  }
  if (parentTNode === null) {
    // 부모가 없는 경우 노드를 즉시 추가할 수 있음을 의미합니다.
    // 부모가 있는 경우, 이 노드는 지금 추가될 수 없으며(부모가 아직 생성되지 않았음), 대신 `parentTNode`가 그것을 추가해야 합니다. `TNode.insertBeforeIndex`를 참조하십시오.
    opCode |= I18nCreateOpCode.APPEND_EAGERLY;
  }
  if (isICU) {
    opCode |= I18nCreateOpCode.COMMENT;
    ensureIcuContainerVisitorLoaded(loadIcuContainerVisitor);
  }
  createOpCodes.push(opCode, text === null ? '' : text);
  // 우리가 `{{?}}`를 저장하므로 `debug`에서 `TNodeType.template`을 볼 때 바인딩이 어디에 있는지 볼 수 있습니다.
  const tNode = createTNodeAtIndex(
    tView,
    i18nNodeIdx,
    isICU ? TNodeType.Icu : TNodeType.Text,
    text === null ? (ngDevMode ? '{{?}}' : '') : text,
    null,
  );
  addTNodeAndUpdateInsertBeforeIndex(existingTNodes, tNode);
  const tNodeIdx = tNode.index;
  setCurrentTNode(tNode, false /* 텍스트 노드는 자체 종료됩니다. */);
  if (parentTNode !== null && rootTNode !== parentTNode) {
    // 우리는 더 깊은 노드의 자식입니다 (즉 `i18nStart` 명령의 직접적 자식이 아닙니다.)
    // 우리는 부모에 추가해야 합니다.
    setTNodeInsertBeforeIndex(parentTNode, tNodeIdx);
  }
  return tNode;
}

/**
 * i18n 블록의 텍스트 노드를 처리합니다.
 *
 * 텍스트 노드는 다음을 가질 수 있습니다:
 * - 텍스트 노드를 생성하기 위한 `createOpCodes` 내의 생성 지시문.
 * - `LView`의 i18n 범위에서 텍스트 노드의 사양을 할당합니다.
 * - 바인딩이 포함되어 있는 경우:
 *    - 바인딩 => 바인딩 값을 저장하기 위해 `LView`의 i18n 범위에서 공간을 할당합니다.
 *    - 업데이트 지침으로 `updateOpCodes`를 채웁니다.
 *
 * @param tView 현재 `TView`
 * @param rootTNode i18n 블록의 루트 `TNode`. 이 노드는 새 TNode가 `i18nStart` 명령의 일부로 추가될지를 결정합니다.
 * @param existingTNodes `addTNodeAndUpdateInsertBeforeIndex`의 내부 상태.
 * @param createOpCodes 생성될 OpCodes가 저장될 위치.
 * @param lView 현재 `LView`
 * @param text 번역된 텍스트(바 인딩을 포함할 수 있음)
 */
function i18nStartFirstCreatePassProcessTextNode(
  ast: I18nNode[],
  tView: TView,
  rootTNode: TNode | null,
  existingTNodes: TNode[],
  createOpCodes: I18nCreateOpCodes,
  updateOpCodes: I18nUpdateOpCodes,
  lView: LView,
  text: string,
): void {
  const hasBinding = text.match(BINDING_REGEXP);
  const tNode = createTNodeAndAddOpCode(
    tView,
    rootTNode,
    existingTNodes,
    lView,
    createOpCodes,
    hasBinding ? null : text,
    false,
  );
  const index = tNode.index;
  if (hasBinding) {
    generateBindingUpdateOpCodes(updateOpCodes, text, index, null, 0, null);
  }
  ast.push({kind: I18nNodeKind.TEXT, index});
}

/**
 * 위의 `i18nAttributes`를 참조하십시오.
 */
export function i18nAttributesFirstPass(tView: TView, index: number, values: string[]) {
  const previousElement = getCurrentTNode()!;
  const previousElementIndex = previousElement.index;
  const updateOpCodes: I18nUpdateOpCodes = [] as any;
  if (ngDevMode) {
    attachDebugGetter(updateOpCodes, i18nUpdateOpCodesToString);
  }
  if (tView.firstCreatePass && tView.data[index] === null) {
    for (let i = 0; i < values.length; i += 2) {
      const attrName = values[i];
      const message = values[i + 1];

      if (message !== '') {
        // 속성 값에 ICU가 포함되어 있는지 확인하고 그렇다면 오류를 발생시킵니다.
        // 요소 속성의 ICU는 지원되지 않습니다.
        // 참고: 우리는 `ngDevMode`를 사용하지 않아서 여기에 오류를 의도적으로 유지합니다. 왜냐하면 `value`는 로케일에 따라 변경될 수 있으며 사용자가 개발하는 동안 잘못된 문자열에 도달할 것이라는 보장이 없기 때문입니다.
        if (ICU_REGEXP.test(message)) {
          throw new Error(`속성에 ICU 표현식이 지원되지 않습니다. 메시지: "${message}".`);
        }

        // 이 코드 경로에 도달하는 i18n 속성은 바인딩이 있는 것이 보장됩니다. 왜냐하면 컴파일러는 정적 i18n 속성을 정규 속성 바인딩으로 처리하기 때문입니다.
        // 이 요소의 첫 번째 i18n 속성이 아닐 수 있으므로 이전에 몇 개의 바인딩이 있었는지 전달해야 합니다.
        generateBindingUpdateOpCodes(
          updateOpCodes,
          message,
          previousElementIndex,
          attrName,
          countBindings(updateOpCodes),
          null,
        );
      }
    }
    tView.data[index] = updateOpCodes;
  }
}

/**
 * 문자열의 바인딩을 업데이트하는 OpCodes를 생성합니다.
 *
 * @param updateOpCodes 업데이트 opcodes가 저장될 장소입니다.
 * @param str 바인딩을 포함하는 문자열.
 * @param destinationNode 바인딩을 받을 대상 노드의 인덱스입니다.
 * @param attrName 문자열이 속성에 속하는 경우 속성의 이름입니다.
 * @param sanitizeFn 필요하다면 업데이트 후 문자열을 정리하는 데 사용되는 세정 함수입니다.
 * @param bindingStart opCode를 통해 바인딩될 수 있는 다음 표현식의 lView 인덱스입니다.
 * @returns 이러한 바인딩의 마스크 값
 */
function generateBindingUpdateOpCodes(
  updateOpCodes: I18nUpdateOpCodes,
  str: string,
  destinationNode: number,
  attrName: string | null,
  bindingStart: number,
  sanitizeFn: SanitizerFn | null,
): number {
  ngDevMode &&
    assertGreaterThanOrEqual(
      destinationNode,
      HEADER_OFFSET,
      '인덱스는 절대 LView 오프셋에 있어야 합니다.',
    );
  const maskIndex = updateOpCodes.length; // 마스크의 위치
  const sizeIndex = maskIndex + 1; // 건너뛰기를 위한 크기 위치
  updateOpCodes.push(null, null); // 마스크와 크기 공간 할당
  const startIndex = maskIndex + 2; // 첫 번째 할당 위치입니다.
  if (ngDevMode) {
    attachDebugGetter(updateOpCodes, i18nUpdateOpCodesToString);
  }
  const textParts = str.split(BINDING_REGEXP);
  let mask = 0;

  for (let j = 0; j < textParts.length; j++) {
    const textValue = textParts[j];

    if (j & 1) {
      // 홀수 인덱스는 바인딩입니다.
      const bindingIndex = bindingStart + parseInt(textValue, 10);
      updateOpCodes.push(-1 - bindingIndex);
      mask = mask | toMaskBit(bindingIndex);
    } else if (textValue !== '') {
      // 짝수 인덱스는 텍스트입니다.
      updateOpCodes.push(textValue);
    }
  }

  updateOpCodes.push(
    (destinationNode << I18nUpdateOpCode.SHIFT_REF) |
      (attrName ? I18nUpdateOpCode.Attr : I18nUpdateOpCode.Text),
  );
  if (attrName) {
    updateOpCodes.push(attrName, sanitizeFn);
  }
  updateOpCodes[maskIndex] = mask;
  updateOpCodes[sizeIndex] = updateOpCodes.length - startIndex;
  return mask;
}

/**
 * 주어진 `opCodes`에서 바인딩의 수를 계산합니다.
 *
 * `generateBindingUpdateOpCodes()`에서 발견된 바인딩 수를 `i18nAttributesFirstPass()`로 전달하면 속도가 빨라질 수 있지만, 이렇게 하면 코드의 복잡성이 증가하거나 일시적인 객체를 생성해야 합니다.
 *
 * 이 함수는 템플릿이 인스턴스화될 때 한 번만 호출되며, 첫 번째 인스턴스에서(옵코드가 빈 배열이므로) 사소하고 요소에 여러 개의 i18n 바인딩 속성이 포함되는 것은 흔치 않기 때문에 이는 합리적인 타협인 것 같습니다.
 */
function countBindings(opCodes: I18nUpdateOpCodes): number {
  let count = 0;
  for (let i = 0; i < opCodes.length; i++) {
    const opCode = opCodes[i];
    // 바인딩은 음수입니다.
    if (typeof opCode === 'number' && opCode < 0) {
      count++;
    }
  }
  return count;
}

/**
 * 바인딩 인덱스를 마스크 비트로 변환합니다.
 *
 * 각 인덱스는 비트 마스크의 단일 비트를 나타냅니다. 비트 마스크에는 32비트만 있으므로 32비트를 초과하는 모든 바인딩에 대해 32비트가 공유되도록 합니다. 32개 이상의 바인딩이 있는 것은 극히 드물기 때문에 이 경우는 드물게 발생합니다. 이 코너 케이스가 발생하는 단점은 바인딩 코드를 필요 이상으로 자주 실행하게 된다는 것입니다. (성능의 페널티)
 */
function toMaskBit(bindingIndex: number): number {
  return 1 << Math.min(bindingIndex, 31);
}

/**
 * 메시지의 서브 템플릿 내부의 모든 것을 제거합니다.
 */
function removeInnerTemplateTranslation(message: string): string {
  let match;
  let res = '';
  let index = 0;
  let inTemplate = false;
  let tagMatched;

  while ((match = SUBTEMPLATE_REGEXP.exec(message)) !== null) {
    if (!inTemplate) {
      res += message.substring(index, match.index + match[0].length);
      tagMatched = match[1];
      inTemplate = true;
    } else {
      if (match[0] === `${MARKER}/*${tagMatched}${MARKER}`) {
        index = match.index;
        inTemplate = false;
      }
    }
  }

  ngDevMode &&
    assertEqual(
      inTemplate,
      false,
      `태그 불일치: 번역 "${message}"에서 서브 템플릿의 끝을 찾을 수 없습니다.`,
    );

  res += message.slice(index);
  return res;
}

/**
 * 메시지의 일부를 추출하고 나머지를 제거합니다.
 *
 * 이 메소드는 템플릿과 관련된 메시지의 일부를 추출하는 데 사용됩니다. 번역된 메시지는 여러 템플릿에 걸칠 수 있습니다.
 *
 * 예:
 * ```html
 * <div i18n>Translate <span *ngIf>me</span>!</div>
 * ```
 *
 * @param message 잘라낼 메시지
 * @param subTemplateIndex 추출할 서브 템플릿의 인덱스입니다. 정의되지 않은 경우 외부 템플릿을 반환하고 모든 서브 템플릿을 제거합니다.
 */
export function getTranslationForTemplate(message: string, subTemplateIndex: number) {
  if (isRootTemplateMessage(subTemplateIndex)) {
    // 우리는 루트 템플릿 메시지를 원하므로 모든 서브 템플릿을 무시합니다.
    return removeInnerTemplateTranslation(message);
  } else {
    // 우리는 특정 서브 템플릿을 원합니다.
    const start =
      message.indexOf(`:${subTemplateIndex}${MARKER}`) + 2 + subTemplateIndex.toString().length;
    const end = message.search(new RegExp(`${MARKER}\\/\\*\\d+:${subTemplateIndex}${MARKER}`));
    return removeInnerTemplateTranslation(message.substring(start, end));
  }
}

/**
 * ICU 표현식에 대한 OpCodes를 생성합니다.
 *
 * @param icuExpression
 * @param index 앵커가 저장된 인덱스 및 선택적 `TIcuContainerNode`
 *   - `lView[anchorIdx]`는 ICU의 앵커를 나타내는 `Comment` 노드를 가리킵니다.
 *   - `tView.data[anchorIdx]`는 ICU가 루트인 경우(`null`이 아닌 경우) `TIcuContainerNode`를 가리킵니다.
 */
function icuStart(
  ast: I18nNode[],
  tView: TView,
  lView: LView,
  updateOpCodes: I18nUpdateOpCodes,
  parentIdx: number,
  icuExpression: IcuExpression,
  anchorIdx: number,
) {
  ngDevMode && assertDefined(icuExpression, 'ICU 표현식은 정의되어야 합니다.');
  let bindingMask = 0;
  const tIcu: TIcu = {
    type: icuExpression.type,
    currentCaseLViewIndex: allocExpando(tView, lView, 1, null),
    anchorIdx,
    cases: [],
    create: [],
    remove: [],
    update: [],
  };
  addUpdateIcuSwitch(updateOpCodes, icuExpression, anchorIdx);
  setTIcu(tView, anchorIdx, tIcu);
  const values = icuExpression.values;
  const cases: I18nNode[][] = [];
  for (let i = 0; i < values.length; i++) {
    // 각 값은 문자열 및 기타 ICU 표현식의 배열입니다.
    const valueArr = values[i];
    const nestedIcus: IcuExpression[] = [];
    for (let j = 0; j < valueArr.length; j++) {
      const value = valueArr[j];
      if (typeof value !== 'string') {
        // 이는 중첩된 ICU 표현식입니다.
        const icuIndex = nestedIcus.push(value as IcuExpression) - 1;
        // 중첩된 ICU 표현식을 주석 노드로 대체합니다.
        valueArr[j] = `<!--�${icuIndex}�-->`;
      }
    }
    const caseAst: I18nNode[] = [];
    cases.push(caseAst);
    bindingMask =
      parseIcuCase(
        caseAst,
        tView,
        tIcu,
        lView,
        updateOpCodes,
        parentIdx,
        icuExpression.cases[i],
        valueArr.join(''),
        nestedIcus,
      ) | bindingMask;
  }
  if (bindingMask) {
    addUpdateIcuUpdate(updateOpCodes, bindingMask, anchorIdx);
  }
  ast.push({
    kind: I18nNodeKind.ICU,
    index: anchorIdx,
    cases,
    currentCaseLViewIndex: tIcu.currentCaseLViewIndex,
  });
}

/**
 * ICU 표현식을 포함하는 텍스트를 파싱하고 JSON 객체를 생성합니다.
 * 클로저 라이브러리에서 원래 코드로, Angular를 위해 수정되었습니다.
 *
 * @param pattern 파싱해야 하는 ICU 표현식이 포함된 텍스트입니다.
 *
 */
function parseICUBlock(pattern: string): IcuExpression {
  const cases = [];
  const values: (string | IcuExpression)[][] = [];
  let icuType = IcuType.plural;
  let mainBinding = 0;
  pattern = pattern.replace(
    ICU_BLOCK_REGEXP,
    function (str: string, binding: string, type: string) {
      if (type === 'select') {
        icuType = IcuType.select;
      } else {
        icuType = IcuType.plural;
      }
      mainBinding = parseInt(binding.slice(1), 10);
      return '';
    },
  );

  const parts = i18nParseTextIntoPartsAndICU(pattern) as string[];
  // (key block)+ 시퀀스를 찾습니다. 키 중 하나는 "other"여야 합니다.
  for (let pos = 0; pos < parts.length; ) {
    let key = parts[pos++].trim();
    if (icuType === IcuType.plural) {
      // 키는 "=x"일 수 있으며, 우리는 "x"만 원합니다.
      key = key.replace(/\s*(?:=)?(\w+)\s*/, '$1');
    }
    if (key.length) {
      cases.push(key);
    }

    const blocks = i18nParseTextIntoPartsAndICU(parts[pos++]) as string[];
    if (cases.length > values.length) {
      values.push(blocks);
    }
  }

  // TODO(ocombe): 속성에서 ICU 표현식을 지원하도록 해 주세요. #21615 참조
  return {type: icuType, mainBinding: mainBinding, cases, values};
}

/**
 * 패턴을 문자열과 최상위 {...} 블록으로 나눕니다.
 * 메시지를 텍스트와 ICU 표현식으로 나누거나 ICU 표현식을 키와 경우로 나눌 때 사용할 수 있습니다.
 * 클로저 라이브러리에서 원래 코드로, Angular를 위해 수정되었습니다.
 *
 * @param pattern (서브)패턴을 나눕니다.
 * @returns `Array<string|IcuExpression>`:
 *   - 홀수 위치: `string` => ICU 표현식 사이의 텍스트
 *   - 짝수 위치: `ICUExpression` => `ICUExpression` 레코드로 파싱된 ICU 표현식.
 */
function i18nParseTextIntoPartsAndICU(pattern: string): (string | IcuExpression)[] {
  if (!pattern) {
    return [];
  }

  let prevPos = 0;
  const braceStack = [];
  const results: (string | IcuExpression)[] = [];
  const braces = /[{}]/g;
  // lastIndex는 0으로 설정되지 않으므로 그렇게 해야 합니다.
  braces.lastIndex = 0;

  let match;
  while ((match = braces.exec(pattern))) {
    const pos = match.index;
    if (match[0] == '}') {
      braceStack.pop();

      if (braceStack.length == 0) {
        // 블록의 끝.
        const block = pattern.substring(prevPos, pos);
        if (ICU_BLOCK_REGEXP.test(block)) {
          results.push(parseICUBlock(block));
        } else {
          results.push(block);
        }

        prevPos = pos + 1;
      }
    } else {
      if (braceStack.length == 0) {
        const substring = pattern.substring(prevPos, pos);
        results.push(substring);
        prevPos = pos + 1;
      }
      braceStack.push('{');
    }
  }

  const substring = pattern.substring(prevPos);
  results.push(substring);
  return results;
}

/**
 * 노드, 그 자식 및 형제들을 파싱하고 변형 및 업데이트 OpCodes를 생성합니다.
 *
 */
function parseIcuCase(
  ast: I18nNode[],
  tView: TView,
  tIcu: TIcu,
  lView: LView,
  updateOpCodes: I18nUpdateOpCodes,
  parentIdx: number,
  caseName: string,
  unsafeCaseHtml: string,
  nestedIcus: IcuExpression[],
): number {
  const create: IcuCreateOpCodes = [] as any;
  const remove: I18nRemoveOpCodes = [] as any;
  const update: I18nUpdateOpCodes = [] as any;
  if (ngDevMode) {
    attachDebugGetter(create, icuCreateOpCodesToString);
    attachDebugGetter(remove, i18nRemoveOpCodesToString);
    attachDebugGetter(update, i18nUpdateOpCodesToString);
  }
  tIcu.cases.push(caseName);
  tIcu.create.push(create);
  tIcu.remove.push(remove);
  tIcu.update.push(update);

  const inertBodyHelper = getInertBodyHelper(getDocument());
  const inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeCaseHtml);
  ngDevMode && assertDefined(inertBodyElement, '상속된 body element 를 생성할 수 없습니다.');
  const inertRootNode = (getTemplateContent(inertBodyElement!) as Element) || inertBodyElement;
  if (inertRootNode) {
    return walkIcuTree(
      ast,
      tView,
      tIcu,
      lView,
      updateOpCodes,
      create,
      remove,
      update,
      inertRootNode,
      parentIdx,
      nestedIcus,
      0,
    );
  } else {
    return 0;
  }
}

function walkIcuTree(
  ast: I18nNode[],
  tView: TView,
  tIcu: TIcu,
  lView: LView,
  sharedUpdateOpCodes: I18nUpdateOpCodes,
  create: IcuCreateOpCodes,
  remove: I18nRemoveOpCodes,
  update: I18nUpdateOpCodes,
  parentNode: Element,
  parentIdx: number,
  nestedIcus: IcuExpression[],
  depth: number,
): number {
  let bindingMask = 0;
  let currentNode = parentNode.firstChild;
  while (currentNode) {
    const newIndex = allocExpando(tView, lView, 1, null);
    switch (currentNode.nodeType) {
      case Node.ELEMENT_NODE:
        const element = currentNode as Element;
        const tagName = element.tagName.toLowerCase();
        if (VALID_ELEMENTS.hasOwnProperty(tagName)) {
          addCreateNodeAndAppend(create, ELEMENT_MARKER, tagName, parentIdx, newIndex);
          tView.data[newIndex] = tagName;
          const elAttrs = element.attributes;
          for (let i = 0; i < elAttrs.length; i++) {
            const attr = elAttrs.item(i)!;
            const lowerAttrName = attr.name.toLowerCase();
            const hasBinding = !!attr.value.match(BINDING_REGEXP);
            // 우리는 입력 문자열이 안전할 것이라고 가정합니다. 바인딩을 사용하지 않는 경우
            if (hasBinding) {
              if (VALID_ATTRS.hasOwnProperty(lowerAttrName)) {
                if (URI_ATTRS[lowerAttrName]) {
                  generateBindingUpdateOpCodes(
                    update,
                    attr.value,
                    newIndex,
                    attr.name,
                    0,
                    _sanitizeUrl,
                  );
                } else {
                  generateBindingUpdateOpCodes(update, attr.value, newIndex, attr.name, 0, null);
                }
              } else {
                ngDevMode &&
                  console.warn(
                    `경고: 요소 ${tagName}에서 ${lowerAttrName}의 안전하지 않은 속성 값을 무시합니다. ` +
                      `(자세한 내용은 ${XSS_SECURITY_URL})`,
                  );
              }
            } else {
              addCreateAttribute(create, newIndex, attr);
            }
          }
          const elementNode: I18nElementNode = {
            kind: I18nNodeKind.ELEMENT,
            index: newIndex,
            children: [],
          };
          ast.push(elementNode);
          // 이 노드의 자식들을 파싱합니다. (있다면)
          bindingMask =
            walkIcuTree(
              elementNode.children,
              tView,
              tIcu,
              lView,
              sharedUpdateOpCodes,
              create,
              remove,
              update,
              currentNode as Element,
              newIndex,
              nestedIcus,
              depth + 1,
            ) | bindingMask;
          addRemoveNode(remove, newIndex, depth);
        }
        break;
      case Node.TEXT_NODE:
        const value = currentNode.textContent || '';
        const hasBinding = value.match(BINDING_REGEXP);
        addCreateNodeAndAppend(create, null, hasBinding ? '' : value, parentIdx, newIndex);
        addRemoveNode(remove, newIndex, depth);
        if (hasBinding) {
          bindingMask =
            generateBindingUpdateOpCodes(update, value, newIndex, null, 0, null) | bindingMask;
        }
        ast.push({
          kind: I18nNodeKind.TEXT,
          index: newIndex,
        });
        break;
      case Node.COMMENT_NODE:
        // 주석 노드가 중첩된 ICU를 위한 플레이스홀더인지 확인합니다.
        const isNestedIcu = NESTED_ICU.exec(currentNode.textContent || '');
        if (isNestedIcu) {
          const nestedIcuIndex = parseInt(isNestedIcu[1], 10);
          const icuExpression: IcuExpression = nestedIcus[nestedIcuIndex];
          // ICU 표현식의 앵커가 될 주석 노드를 생성합니다.
          addCreateNodeAndAppend(
            create,
            ICU_MARKER,
            ngDevMode ? `중첩 ICU ${nestedIcuIndex}` : '',
            parentIdx,
            newIndex,
          );
          icuStart(ast, tView, lView, sharedUpdateOpCodes, parentIdx, icuExpression, newIndex);
          addRemoveNestedIcu(remove, newIndex, depth);
        }
        break;
    }
    currentNode = currentNode.nextSibling;
  }
  return bindingMask;
}

function addRemoveNode(remove: I18nRemoveOpCodes, index: number, depth: number) {
  if (depth === 0) {
    remove.push(index);
  }
}

function addRemoveNestedIcu(remove: I18nRemoveOpCodes, index: number, depth: number) {
  if (depth === 0) {
    remove.push(~index); // `index`에서 ICU를 제거합니다.
    remove.push(index); // `index`에서 ICU 주석을 제거합니다.
  }
}

function addUpdateIcuSwitch(
  update: I18nUpdateOpCodes,
  icuExpression: IcuExpression,
  index: number,
) {
  update.push(
    toMaskBit(icuExpression.mainBinding),
    2,
    -1 - icuExpression.mainBinding,
    (index << I18nUpdateOpCode.SHIFT_REF) | I18nUpdateOpCode.IcuSwitch,
  );
}

function addUpdateIcuUpdate(update: I18nUpdateOpCodes, bindingMask: number, index: number) {
  update.push(bindingMask, 1, (index << I18nUpdateOpCode.SHIFT_REF) | I18nUpdateOpCode.IcuUpdate);
}

function addCreateNodeAndAppend(
  create: IcuCreateOpCodes,
  marker: null | ICU_MARKER | ELEMENT_MARKER,
  text: string,
  appendToParentIdx: number,
  createAtIdx: number,
) {
  if (marker !== null) {
    create.push(marker);
  }
  create.push(
    text,
    createAtIdx,
    icuCreateOpCode(IcuCreateOpCode.AppendChild, appendToParentIdx, createAtIdx),
  );
}

function addCreateAttribute(create: IcuCreateOpCodes, newIndex: number, attr: Attr) {
  create.push(
    (newIndex << IcuCreateOpCode.SHIFT_REF) | IcuCreateOpCode.Attr,
    attr.name,
    attr.value,
  );
}
