/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import '../util/ng_dev_mode';

import {assertDefined, assertEqual, assertNotEqual} from '../util/assert';

import {AttributeMarker} from './interfaces/attribute_marker';
import {TAttributes, TNode, TNodeType} from './interfaces/node';
import {CssSelector, CssSelectorList, SelectorFlags} from './interfaces/projection';
import {classIndexOf} from './styling/class_differ';
import {isNameOnlyAttributeMarker} from './util/attrs_utils';

const NG_TEMPLATE_SELECTOR = 'ng-template';

/**
 * `TAttributes`에서 `cssClassToMatch`가 포함되어 있는지 대소문자를 구분하지 않고 확인합니다.
 *
 * @param tNode 일치시킬 노드의 정적 데이터
 * @param attrs 검색할 `TAttributes`.
 * @param cssClassToMatch 일치할 클래스(소문자)
 * @param isProjectionMode 클래스 일치가 `AttributeMarker.Classes`와 함께
 *    `class` 속성도 고려해야 하는지 여부.
 */
function isCssClassMatching(
  tNode: TNode,
  attrs: TAttributes,
  cssClassToMatch: string,
  isProjectionMode: boolean,
): boolean {
  ngDevMode &&
    assertEqual(cssClassToMatch, cssClassToMatch.toLowerCase(), '클래스 이름은 소문자여야 합니다.');
  let i = 0;
  if (isProjectionMode) {
    for (; i < attrs.length && typeof attrs[i] === 'string'; i += 2) {
      // 암시적인 `class` 속성을 찾아 그 값이 `cssClassToMatch`와 일치하는지 확인합니다.
      if (
        attrs[i] === 'class' &&
        classIndexOf((attrs[i + 1] as string).toLowerCase(), cssClassToMatch, 0) !== -1
      ) {
        return true;
      }
    }
  } else if (isInlineTemplate(tNode)) {
    // 일치하는 지시문 (즉, 프로젝션 모드에 대해 일치하지 않을 때)은
    // 인라인 템플릿에 있는 클래스 바인딩을 고려하지 않아야 하며,
    // 이러한 클래스 바인딩은 템플릿의 루트 노드만 대상으로 하므로 템플릿 자체에는 해당되지 않습니다.
    return false;
  }

  // `Classes` 마커 이후에 클래스 검색을 재개합니다.
  i = attrs.indexOf(AttributeMarker.Classes, i);
  if (i > -1) {
    // 클래스 섹션을 찾았습니다. 클래스를 찾기 시작합니다.
    let item: TAttributes[number];
    while (++i < attrs.length && typeof (item = attrs[i]) === 'string') {
      if (item.toLowerCase() === cssClassToMatch) {
        return true;
      }
    }
  }
  return false;
}

/**
 * `tNode`가 인라인 템플릿(예: `*ngFor`)인지 확인합니다.
 *
 * @param tNode 현재 TNode
 */
export function isInlineTemplate(tNode: TNode): boolean {
  return tNode.type === TNodeType.Container && tNode.value !== NG_TEMPLATE_SELECTOR;
}

/**
 * 주어진 tNode가 태그 기반 선택자와 일치하고 유효한 유형인지 확인하는 함수입니다.
 *
 * 일치는 2가지 모드에서 수행할 수 있습니다: 프로젝션 모드(노드를 프로젝션할 때)와 일반 지시문 일치 모드:
 * - "지시문 일치" 모드에서는 NG_TEMPLATE_SELECTOR와 다른 경우 TContainer의 tagName은 고려하지 않습니다
 * (NG_TEMPLATE_SELECTOR와 다른 값은 * 구문에서 태그 이름이 추출되었음을 나타내므로 동일한 지시문이 두 번 일치함);
 * - "프로젝션" 모드에서는 * 구문 처리에서 잠재적으로 추출된 태그 이름을 사용합니다
 * (TNodeType.Container에만 적용됨).
 */
function hasTagAndTypeMatch(
  tNode: TNode,
  currentSelector: string,
  isProjectionMode: boolean,
): boolean {
  const tagNameToCompare =
    tNode.type === TNodeType.Container && !isProjectionMode ? NG_TEMPLATE_SELECTOR : tNode.value;
  return currentSelector === tagNameToCompare;
}

/**
 * Ivy 노드 정적 데이터를 간단한 CSS 선택자와 일치시키는 유틸리티 함수입니다.
 *
 * @param tNode 일치시킬 노드의 정적 데이터
 * @param selector 노드와 일치시킬 선택자.
 * @param isProjectionMode `true`인 경우 콘텐츠 프로젝션에 대해 일치시키고, 그렇지 않으면
 * 지시문 일치를 수행하고 있습니다.
 * @returns 노드가 선택자와 일치하는 경우 true.
 */
export function isNodeMatchingSelector(
  tNode: TNode,
  selector: CssSelector,
  isProjectionMode: boolean,
): boolean {
  ngDevMode && assertDefined(selector[0], '선택자는 태그 이름이 있어야 합니다.');
  let mode: SelectorFlags = SelectorFlags.ELEMENT;
  const nodeAttrs = tNode.attrs;

  // 값이 없는 첫 번째 속성의 인덱스를 찾습니다. 이름만 있습니다.
  const nameOnlyMarkerIdx = nodeAttrs !== null ? getNameOnlyMarkerIndex(nodeAttrs) : 0;

  // ":not" 선택자를 처리할 때 현재 선택자가 일치하지 않으면 다음 ":not"으로 건너뜁니다.
  let skipToNextSelector = false;

  for (let i = 0; i < selector.length; i++) {
    const current = selector[i];
    if (typeof current === 'number') {
      // :not 선택자를 처리한 후 실패하지 않았다면 false를 반환합니다.
      if (!skipToNextSelector && !isPositive(mode) && !isPositive(current)) {
        return false;
      }
      // 현재 :not()를 건너뛰고 있고 이 모드 플래그가 양수인 경우,
      // 이는 현재 :not() 선택자의 일부이며 계속 건너뛰어야 합니다.
      if (skipToNextSelector && isPositive(current)) continue;
      skipToNextSelector = false;
      mode = (current as number) | (mode & SelectorFlags.NOT);
      continue;
    }

    if (skipToNextSelector) continue;

    if (mode & SelectorFlags.ELEMENT) {
      mode = SelectorFlags.ATTRIBUTE | (mode & SelectorFlags.NOT);
      if (
        (current !== '' && !hasTagAndTypeMatch(tNode, current, isProjectionMode)) ||
        (current === '' && selector.length === 1)
      ) {
        if (isPositive(mode)) return false;
        skipToNextSelector = true;
      }
    } else if (mode & SelectorFlags.CLASS) {
      if (nodeAttrs === null || !isCssClassMatching(tNode, nodeAttrs, current, isProjectionMode)) {
        if (isPositive(mode)) return false;
        skipToNextSelector = true;
      }
    } else {
      const selectorAttrValue = selector[++i];
      const attrIndexInNode = findAttrIndexInNode(
        current,
        nodeAttrs,
        isInlineTemplate(tNode),
        isProjectionMode,
      );

      if (attrIndexInNode === -1) {
        if (isPositive(mode)) return false;
        skipToNextSelector = true;
        continue;
      }

      if (selectorAttrValue !== '') {
        let nodeAttrValue: string;
        if (attrIndexInNode > nameOnlyMarkerIdx) {
          nodeAttrValue = '';
        } else {
          ngDevMode &&
            assertNotEqual(
              nodeAttrs![attrIndexInNode],
              AttributeMarker.NamespaceURI,
              '우리는 네임스페이스 속성에서 지시문과 일치하지 않습니다.',
            );
          // 선택자를 대소문자 구분 없이 일치시키기 위해 속성 값을 소문자로 변환합니다.
          // (선택자는 이미 생성 시 소문자입니다.)
          nodeAttrValue = (nodeAttrs![attrIndexInNode + 1] as string).toLowerCase();
        }

        if (mode & SelectorFlags.ATTRIBUTE && selectorAttrValue !== nodeAttrValue) {
          if (isPositive(mode)) return false;
          skipToNextSelector = true;
        }
      }
    }
  }

  return isPositive(mode) || skipToNextSelector;
}

function isPositive(mode: SelectorFlags): boolean {
  return (mode & SelectorFlags.NOT) === 0;
}

/**
 * 노드의 속성 정의 배열을 검사하여 주어진 `name`과 일치하는 속성의 인덱스를 찾습니다.
 *
 * NOTE: 이것은 네임스페이스 속성과 일치하지 않습니다.
 *
 * 속성 일치는 `isInlineTemplate` 및 `isProjectionMode`에 따라 다릅니다.
 * 다음 표는 일치시키려는 속성 유형을 요약합니다:
 *
 * ===========================================================================================================
 * 모드                   | 일반 속성 | 바인딩 속성 | 템플릿 속성 | I18n 속성
 * ===========================================================================================================
 * 인라인 + 프로젝션     | 예               | 예                 | 아니요                  | 예
 * -----------------------------------------------------------------------------------------------------------
 * 인라인 + 지시문      | 아니요                | 아니요                  | 예                 | 아니요
 * -----------------------------------------------------------------------------------------------------------
 * 비인라인 + 프로젝션 | 예               | 예                 | 아니요                  | 예
 * -----------------------------------------------------------------------------------------------------------
 * 비인라인 + 지시문  | 예               | 예                 | 아니요                  | 예
 * ===========================================================================================================
 *
 * @param name 찾을 속성의 이름
 * @param attrs 검사할 속성 배열
 * @param isInlineTemplate 노드가 인라인 템플릿(예: `*ngFor`)인 경우 true
 * 대신 수동으로 확장된 템플릿 노드(예: `<ng-template>`).
 * @param isProjectionMode true 인 경우 콘텐츠 프로젝션에 대해 일치하고,
 * 그렇지 않으면 지시문에 대해 일치하고 있습니다.
 */
function findAttrIndexInNode(
  name: string,
  attrs: TAttributes | null,
  isInlineTemplate: boolean,
  isProjectionMode: boolean,
): number {
  if (attrs === null) return -1;

  let i = 0;

  if (isProjectionMode || !isInlineTemplate) {
    let bindingsMode = false;
    while (i < attrs.length) {
      const maybeAttrName = attrs[i];
      if (maybeAttrName === name) {
        return i;
      } else if (
        maybeAttrName === AttributeMarker.Bindings ||
        maybeAttrName === AttributeMarker.I18n
      ) {
        bindingsMode = true;
      } else if (
        maybeAttrName === AttributeMarker.Classes ||
        maybeAttrName === AttributeMarker.Styles
      ) {
        let value = attrs[++i];
        // 우리는 이곳에서 클래스를 건너뛰어야 하며,
        // 프로젝션 모드에서 클래스를 일치시키기 위한 별도의 메커니즘이 있습니다.
        while (typeof value === 'string') {
          value = attrs[++i];
        }
        continue;
      } else if (maybeAttrName === AttributeMarker.Template) {
        // 이 시나리오에서 템플릿 속성에 대해 신경 쓰지 않습니다.
        break;
      } else if (maybeAttrName === AttributeMarker.NamespaceURI) {
        // 전체 네임스페이스 속성 및 값을 건너뜁니다. 이는 설계된 것입니다.
        i += 4;
        continue;
      }
      // 바인딩 모드에서 이름-값 쌍이 아닌 이름만 있습니다.
      i += bindingsMode ? 1 : 2;
    }
    // 속성과 일치하지 않았습니다.
    return -1;
  } else {
    return matchTemplateAttribute(attrs, name);
  }
}

export function isNodeMatchingSelectorList(
  tNode: TNode,
  selector: CssSelectorList,
  isProjectionMode: boolean = false,
): boolean {
  for (let i = 0; i < selector.length; i++) {
    if (isNodeMatchingSelector(tNode, selector[i], isProjectionMode)) {
      return true;
    }
  }

  return false;
}

export function getProjectAsAttrValue(tNode: TNode): CssSelector | null {
  const nodeAttrs = tNode.attrs;
  if (nodeAttrs != null) {
    const ngProjectAsAttrIdx = nodeAttrs.indexOf(AttributeMarker.ProjectAs);
    // 속성 이름에서만 ngProjectAs를 확인하고, 속성의 값과 우연히 일치하지 않도록 합니다.
    // (속성 이름은 짝수 인덱스에 저장됩니다.)
    if ((ngProjectAsAttrIdx & 1) === 0) {
      return nodeAttrs[ngProjectAsAttrIdx + 1] as CssSelector;
    }
  }
  return null;
}

function getNameOnlyMarkerIndex(nodeAttrs: TAttributes) {
  for (let i = 0; i < nodeAttrs.length; i++) {
    const nodeAttr = nodeAttrs[i];
    if (isNameOnlyAttributeMarker(nodeAttr)) {
      return i;
    }
  }
  return nodeAttrs.length;
}

function matchTemplateAttribute(attrs: TAttributes, name: string): number {
  let i = attrs.indexOf(AttributeMarker.Template);
  if (i > -1) {
    i++;
    while (i < attrs.length) {
      const attr = attrs[i];
      // 템플릿 속성을 모두 검사하고, 속성 어레이에서 다음 섹션으로 전환하므로 반환합니다.
      // (이는 속성 마커를 나타내는 숫자로 시작하는 섹션입니다.)
      if (typeof attr === 'number') return -1;
      if (attr === name) return i;
      i++;
    }
  }
  return -1;
}

/**
 * 선택자가 CssSelectorList 안에 있는지 확인합니다.
 * @param selector 확인할 선택자.
 * @param list 선택자를 찾을 목록.
 */
export function isSelectorInSelectorList(selector: CssSelector, list: CssSelectorList): boolean {
  selectorListLoop: for (let i = 0; i < list.length; i++) {
    const currentSelectorInList = list[i];
    if (selector.length !== currentSelectorInList.length) {
      continue;
    }
    for (let j = 0; j < selector.length; j++) {
      if (selector[j] !== currentSelectorInList[j]) {
        continue selectorListLoop;
      }
    }
    return true;
  }
  return false;
}

function maybeWrapInNotSelector(isNegativeMode: boolean, chunk: string): string {
  return isNegativeMode ? ':not(' + chunk.trim() + ')' : chunk;
}

function stringifyCSSSelector(selector: CssSelector): string {
  let result = selector[0] as string;
  let i = 1;
  let mode = SelectorFlags.ATTRIBUTE;
  let currentChunk = '';
  let isNegativeMode = false;
  while (i < selector.length) {
    let valueOrMarker = selector[i];
    if (typeof valueOrMarker === 'string') {
      if (mode & SelectorFlags.ATTRIBUTE) {
        const attrValue = selector[++i] as string;
        currentChunk +=
          '[' + valueOrMarker + (attrValue.length > 0 ? '="' + attrValue + '"' : '') + ']';
      } else if (mode & SelectorFlags.CLASS) {
        currentChunk += '.' + valueOrMarker;
      } else if (mode & SelectorFlags.ELEMENT) {
        currentChunk += ' ' + valueOrMarker;
      }
    } else {
      //
      // SelectorFlag를 만나면 현재 청크를 최종 결과에 추가합니다.
      // 이는 선택자의 이전 섹션이 끝났음을 나타냅니다.
      // 선택자 사이에 있는 내용을 누적하여 나중에 필요한 경우 :not() 선택기에 청크를 감싸야 합니다.
      // ```
      //  ['', Flags.CLASS, '.classA', Flags.CLASS | Flags.NOT, '.classB', '.classC']
      // ```
      // `.classA :not(.classB .classC)`로 변환되어야 합니다.
      //
      // 음수 선택자 부분의 경우, 다음 음수 플래그를 찾을 때까지 플래그 사이에 내용을 누적합니다.
      // 이는 `:not()` 규칙에 둘 이상의 청크가 포함될 수 있는 경우를 지원하기 위해 필요합니다.
      // 예를 들어,
      // ```
      //  ['', Flags.ELEMENT | Flags.NOT, 'p', Flags.CLASS, 'foo', Flags.CLASS | Flags.NOT, 'bar']
      // ```
      // `:not(p.foo) :not(.bar)`로 문자열화되어야 합니다.
      //
      if (currentChunk !== '' && !isPositive(valueOrMarker)) {
        result += maybeWrapInNotSelector(isNegativeMode, currentChunk);
        currentChunk = '';
      }
      mode = valueOrMarker;
      // CssSelector 사양에 따르면, 한 번이라도 `SelectorFlags.NOT` 플래그를 만나면
      // 선택자의 나머지 조각에 대해 음수 모드를 유지합니다.
      isNegativeMode = isNegativeMode || !isPositive(mode);
    }
    i++;
  }
  if (currentChunk !== '') {
    result += maybeWrapInNotSelector(isNegativeMode, currentChunk);
  }
  return result;
}

/**
 * 구문 분석된 형식의 CSS 선택자의 문자열 표현을 생성합니다.
 *
 * ComponentDef 및 DirectiveDef는 구문 분석된 형식의 선택자를 사용하여 생성되어
 * 런타임 시 추가 파싱을 방지합니다 (예: 지시문 일치의 경우). 그러나 일부 경우(예: 구성 요소 부트스트랩 시)
 * 페이지의 호스트 요소를 조회하기 위해 선택자의 문자열 버전이 필요합니다.
 * 이 함수는 선택자의 구문 분석된 형식을 가져와 문자열 표현을 반환합니다.
 *
 * @param selectorList 구문 분석된 형식의 선택자
 * @returns 주어진 선택자의 문자열 표현
 */
export function stringifyCSSSelectorList(selectorList: CssSelectorList): string {
  return selectorList.map(stringifyCSSSelector).join(',');
}

/**
 * 주어진 CSS 선택자에서 속성 및 클래스 정보를 추출합니다.
 *
 * 이 함수는 구성 요소를 동적으로 생성할 때 사용됩니다. 이 경우 동적으로 생성된
 * 호스트 요소는 구성 요소의 CSS 선택자에 지정된 속성 및 클래스를 포함해야 합니다.
 *
 * @param selector 구문 분석된 형식의 CSS 선택자 (배열 형태)
 * @returns 추출된 정보를 포함하는 `attrs` 및 `classes` 필드가 있는 객체
 */
export function extractAttrsAndClassesFromSelector(selector: CssSelector): TAttributes {
  const attrs: TAttributes = [];
  const classes: string[] = [];
  let i = 1;
  let mode = SelectorFlags.ATTRIBUTE;
  while (i < selector.length) {
    let valueOrMarker = selector[i];
    if (typeof valueOrMarker === 'string') {
      if (mode === SelectorFlags.ATTRIBUTE) {
        if (valueOrMarker !== '') {
          attrs.push(valueOrMarker, selector[++i] as string);
        }
      } else if (mode === SelectorFlags.CLASS) {
        classes.push(valueOrMarker);
      }
    } else {
      // CssSelector 사양에 따르면, 한 번이라도 `SelectorFlags.NOT` 플래그를 만나면,
      // 나머지 조각에 대해 음수 모드가 유지됩니다. 속성과 클래스는
      // 선택자의 "양수" 부분에 대해서만 추출되므로, 우리는 여기서 멈출 수 있습니다.
      if (!isPositive(mode)) break;
      mode = valueOrMarker;
    }
    i++;
  }
  if (classes.length) {
    attrs.push(AttributeMarker.Classes, ...classes);
  }

  return attrs;
}
