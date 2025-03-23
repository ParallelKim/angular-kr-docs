/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {getDeclarationComponentDef} from '../render3/instructions/element_validation';
import {TNode, TNodeType} from '../render3/interfaces/node';
import {RNode} from '../render3/interfaces/renderer_dom';
import {HOST, LView, TVIEW} from '../render3/interfaces/view';
import {getParentRElement} from '../render3/node_manipulation';
import {unwrapRNode} from '../render3/util/view_utils';

import {markRNodeAsHavingHydrationMismatch} from './utils';

const AT_THIS_LOCATION = '<-- AT THIS LOCATION';

/**
 * Retrieves a user friendly string for a given TNodeType for use in
 * friendly error messages
 *
 * @param tNodeType
 * @returns
 */
function getFriendlyStringFromTNodeType(tNodeType: TNodeType): string {
  switch (tNodeType) {
    case TNodeType.Container:
      return 'view container';
    case TNodeType.Element:
      return 'element';
    case TNodeType.ElementContainer:
      return 'ng-container';
    case TNodeType.Icu:
      return 'icu';
    case TNodeType.Placeholder:
      return 'i18n';
    case TNodeType.Projection:
      return 'projection';
    case TNodeType.Text:
      return 'text';
    case TNodeType.LetDeclaration:
      return '@let';
    default:
      // 이 경우는 발생해서는 안 됩니다. 위에서 모든 가능한 TNode 유형을 다루었기 때문입니다.
      return '<unknown>';
  }
}

/**
 * Validates that provided nodes match during the hydration process.
 */
export function validateMatchingNode(
  node: RNode | null,
  nodeType: number,
  tagName: string | null,
  lView: LView,
  tNode: TNode,
  isViewContainerAnchor = false,
): void {
  if (
    !node ||
    (node as Node).nodeType !== nodeType ||
    ((node as Node).nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).tagName.toLowerCase() !== tagName?.toLowerCase())
  ) {
    const expectedNode = shortRNodeDescription(nodeType, tagName, null);
    let header = `수분 과정 중 Angular는 ${expectedNode}를 기대했지만 `;

    const hostComponentDef = getDeclarationComponentDef(lView);
    const componentClassName = hostComponentDef?.type?.name;

    const expectedDom = describeExpectedDom(lView, tNode, isViewContainerAnchor);
    const expected = `Angular는 이 DOM을 기대했습니다:\n\n${expectedDom}\n\n`;

    let actual = '';
    const componentHostElement = unwrapRNode(lView[HOST]!);
    if (!node) {
      // 수분 중 노드를 찾을 수 없습니다.
      header += `노드를 찾을 수 없었습니다.\n\n`;

      // 노드가 누락되어 있으므로 오류를 연결할 가장 가까운 노드를 사용합니다.
      markRNodeAsHavingHydrationMismatch(componentHostElement, expectedDom);
    } else {
      const actualNode = shortRNodeDescription(
        (node as Node).nodeType,
        (node as HTMLElement).tagName ?? null,
        (node as HTMLElement).textContent ?? null,
      );

      header += `찾은 ${actualNode}입니다.\n\n`;
      const actualDom = describeDomFromNode(node);
      actual = `실제 DOM은:\n\n${actualDom}\n\n`;

      // DevTools는 컴포넌트 수준에서만 수분 문제를 보고하므로,
      // 추가 디버그 정보를 컴포넌트 호스트 요소에 연결하여 DevTools에서 사용할 수 있습니다.
      markRNodeAsHavingHydrationMismatch(componentHostElement, expectedDom, actualDom);
    }

    const footer = getHydrationErrorFooter(componentClassName);
    const message = header + expected + actual + getHydrationAttributeNote() + footer;
    throw new RuntimeError(RuntimeErrorCode.HYDRATION_NODE_MISMATCH, message);
  }
}

/**
 * Validates that a given node has sibling nodes
 */
export function validateSiblingNodeExists(node: RNode | null): void {
  validateNodeExists(node);
  if (!node!.nextSibling) {
    const header = '수분 과정 중 Angular는 더 많은 형제 노드가 존재할 것으로 예상했습니다.\n\n';
    const actual = `실제 DOM은:\n\n${describeDomFromNode(node!)}\n\n`;
    const footer = getHydrationErrorFooter();

    const message = header + actual + footer;

    markRNodeAsHavingHydrationMismatch(node!, '', actual);
    throw new RuntimeError(RuntimeErrorCode.HYDRATION_MISSING_SIBLINGS, message);
  }
}

/**
 * Validates that a node exists or throws
 */
export function validateNodeExists(
  node: RNode | null,
  lView: LView | null = null,
  tNode: TNode | null = null,
): void {
  if (!node) {
    const header = '수분 중 Angular는 이 위치에 요소가 존재할 것으로 예상했습니다.\n\n';
    let expected = '';
    let footer = '';
    if (lView !== null && tNode !== null) {
      expected = describeExpectedDom(lView, tNode, false);
      footer = getHydrationErrorFooter();

      // 노드가 누락되어 있으므로 오류를 연결할 가장 가까운 노드를 사용합니다.
      markRNodeAsHavingHydrationMismatch(unwrapRNode(lView[HOST]!), expected, '');
    }

    throw new RuntimeError(
      RuntimeErrorCode.HYDRATION_MISSING_NODE,
      `${header}${expected}\n\n${footer}`,
    );
  }
}

/**
 * Builds the hydration error message when a node is not found
 *
 * @param lView the LView where the node exists
 * @param tNode the TNode
 */
export function nodeNotFoundError(lView: LView, tNode: TNode): Error {
  const header = '직렬화 중 Angular는 DOM에서 요소를 찾을 수 없습니다:\n\n';
  const expected = `${describeExpectedDom(lView, tNode, false)}\n\n`;
  const footer = getHydrationErrorFooter();

  throw new RuntimeError(RuntimeErrorCode.HYDRATION_MISSING_NODE, header + expected + footer);
}

/**
 * Builds a hydration error message when a node is not found at a path location
 *
 * @param host the Host Node
 * @param path the path to the node
 */
export function nodeNotFoundAtPathError(host: Node, path: string): Error {
  const header =
    `수분 중 Angular는 "${path}" 경로를 사용하여 노드를 찾을 수 없습니다. ` +
    ` ${describeRNode(host)} 노드에서 시작합니다.\n\n`;
  const footer = getHydrationErrorFooter();

  markRNodeAsHavingHydrationMismatch(host);
  throw new RuntimeError(RuntimeErrorCode.HYDRATION_MISSING_NODE, header + footer);
}

/**
 * Builds the hydration error message in the case that dom nodes are created outside of
 * the Angular context and are being used as projected nodes
 *
 * @param lView the LView
 * @param tNode the TNode
 * @returns an error
 */
export function unsupportedProjectionOfDomNodes(rNode: RNode): Error {
  const header =
    '직렬화 중 Angular는 Angular 컨텍스트 외부에서 생성되고 ' +
    '프로젝션 가능한 노드로 제공된 DOM 노드를 감지했습니다. ' +
    '이러한 경우에 대해서는 수분이 지원되지 않습니다. 이 패턴을 피하도록 코드를 리팩토링하거나 ' +
    '`ngSkipHydration`을 컴포넌트의 호스트 요소에 사용해주세요.\n\n';
  const actual = `${describeDomFromNode(rNode)}\n\n`;
  const message = header + actual + getHydrationAttributeNote();
  return new RuntimeError(RuntimeErrorCode.UNSUPPORTED_PROJECTION_DOM_NODES, message);
}

/**
 * Builds the hydration error message in the case that ngSkipHydration was used on a
 * node that is not a component host element or host binding
 *
 * @param rNode the HTML Element
 * @returns an error
 */
export function invalidSkipHydrationHost(rNode: RNode): Error {
  const header =
    '`ngSkipHydration` 플래그가 컴포넌트 호스트로 작용하지 않는 노드에 적용되었습니다. ' +
    '수분은 컴포넌트별로만 건너뛸 수 있습니다.\n\n';
  const actual = `${describeDomFromNode(rNode)}\n\n`;
  const footer = '부디 `ngSkipHydration` 속성을 컴포넌트 호스트 요소로 이동해주세요.\n\n';
  const message = header + actual + footer;
  return new RuntimeError(RuntimeErrorCode.INVALID_SKIP_HYDRATION_HOST, message);
}

// Stringification methods

/**
 * Stringifies a given TNode's attributes
 *
 * @param tNode a provided TNode
 * @returns string
 */
function stringifyTNodeAttrs(tNode: TNode): string {
  const results = [];
  if (tNode.attrs) {
    for (let i = 0; i < tNode.attrs.length; ) {
      const attrName = tNode.attrs[i++];
      // 플래그에 도달하면 속성 목록이 끝났음을 알 수 있습니다.
      if (typeof attrName == 'number') {
        break;
      }
      const attrValue = tNode.attrs[i++];
      results.push(`${attrName}="${shorten(attrValue as string)}"`);
    }
  }
  return results.join(' ');
}

/**
 * The list of internal attributes that should be filtered out while
 * producing an error message.
 */
const internalAttrs = new Set(['ngh', 'ng-version', 'ng-server-context']);

/**
 * Stringifies an HTML Element's attributes
 *
 * @param rNode an HTML Element
 * @returns string
 */
function stringifyRNodeAttrs(rNode: HTMLElement): string {
  const results = [];
  for (let i = 0; i < rNode.attributes.length; i++) {
    const attr = rNode.attributes[i];
    if (internalAttrs.has(attr.name)) continue;
    results.push(`${attr.name}="${shorten(attr.value)}"`);
  }
  return results.join(' ');
}

// Methods for Describing the DOM

/**
 * Converts a tNode to a helpful readable string value for use in error messages
 *
 * @param tNode a given TNode
 * @param innerContent the content of the node
 * @returns string
 */
function describeTNode(tNode: TNode, innerContent: string = '…'): string {
  switch (tNode.type) {
    case TNodeType.Text:
      const content = tNode.value ? `(${tNode.value})` : '';
      return `#text${content}`;
    case TNodeType.Element:
      const attrs = stringifyTNodeAttrs(tNode);
      const tag = tNode.value.toLowerCase();
      return `<${tag}${attrs ? ' ' + attrs : ''}>${innerContent}</${tag}>`;
    case TNodeType.ElementContainer:
      return '<!-- ng-container -->';
    case TNodeType.Container:
      return '<!-- container -->';
    default:
      const typeAsString = getFriendlyStringFromTNodeType(tNode.type);
      return `#node(${typeAsString})`;
  }
}

/**
 * Converts an RNode to a helpful readable string value for use in error messages
 *
 * @param rNode a given RNode
 * @param innerContent the content of the node
 * @returns string
 */
function describeRNode(rNode: RNode, innerContent: string = '…'): string {
  const node = rNode as HTMLElement;
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      const tag = node.tagName!.toLowerCase();
      const attrs = stringifyRNodeAttrs(node);
      return `<${tag}${attrs ? ' ' + attrs : ''}>${innerContent}</${tag}>`;
    case Node.TEXT_NODE:
      const content = node.textContent ? shorten(node.textContent) : '';
      return `#text${content ? `(${content})` : ''}`;
    case Node.COMMENT_NODE:
      return `<!-- ${shorten(node.textContent ?? '')} -->`;
    default:
      return `#node(${node.nodeType})`;
  }
}

/**
 * Builds the string containing the expected DOM present given the LView and TNode
 * values for a readable error message
 *
 * @param lView the lView containing the DOM
 * @param tNode the tNode
 * @param isViewContainerAnchor boolean
 * @returns string
 */
function describeExpectedDom(lView: LView, tNode: TNode, isViewContainerAnchor: boolean): string {
  const spacer = '  ';
  let content = '';
  if (tNode.prev) {
    content += spacer + '…\n';
    content += spacer + describeTNode(tNode.prev) + '\n';
  } else if (tNode.type && tNode.type & TNodeType.AnyContainer) {
    content += spacer + '…\n';
  }
  if (isViewContainerAnchor) {
    content += spacer + describeTNode(tNode) + '\n';
    content += spacer + `<!-- container -->  ${AT_THIS_LOCATION}\n`;
  } else {
    content += spacer + describeTNode(tNode) + `  ${AT_THIS_LOCATION}\n`;
  }
  content += spacer + '…\n';

  const parentRNode = tNode.type ? getParentRElement(lView[TVIEW], tNode, lView) : null;
  if (parentRNode) {
    content = describeRNode(parentRNode as unknown as Node, '\n' + content);
  }
  return content;
}

/**
 * Builds the string containing the DOM present around a given RNode for a
 * readable error message
 *
 * @param node the RNode
 * @returns string
 */
function describeDomFromNode(node: RNode): string {
  const spacer = '  ';
  let content = '';
  const currentNode = node as HTMLElement;
  if (currentNode.previousSibling) {
    content += spacer + '…\n';
    content += spacer + describeRNode(currentNode.previousSibling) + '\n';
  }
  content += spacer + describeRNode(currentNode) + `  ${AT_THIS_LOCATION}\n`;
  if (node.nextSibling) {
    content += spacer + '…\n';
  }
  if (node.parentNode) {
    content = describeRNode(currentNode.parentNode as Node, '\n' + content);
  }
  return content;
}

/**
 * Shortens the description of a given RNode by its type for readability
 *
 * @param nodeType the type of node
 * @param tagName the node tag name
 * @param textContent the text content in the node
 * @returns string
 */
function shortRNodeDescription(
  nodeType: number,
  tagName: string | null,
  textContent: string | null,
): string {
  switch (nodeType) {
    case Node.ELEMENT_NODE:
      return `<${tagName!.toLowerCase()}>`;
    case Node.TEXT_NODE:
      const content = textContent ? ` (with the "${shorten(textContent)}" content)` : '';
      return `a text node${content}`;
    case Node.COMMENT_NODE:
      return 'a comment node';
    default:
      return `#node(nodeType=${nodeType})`;
  }
}

/**
 * Builds the footer hydration error message
 *
 * @param componentClassName the name of the component class
 * @returns string
 */
function getHydrationErrorFooter(componentClassName?: string): string {
  const componentInfo = componentClassName ? `the "${componentClassName}"` : 'corresponding';
  return (
    `이 문제를 해결하려면:\n` +
    `  * ${componentInfo} 컴포넌트에서 수분 관련 문제를 확인하세요\n` +
    `  * 템플릿에 유효한 HTML 구조가 있는지 확인하세요\n` +
    `  * 또는 템플릿의 호스트 노드에 \`ngSkipHydration\` 속성을 추가하여 수분을 건너뛸 수 있습니다\n\n`
  );
}

/**
 * An attribute related note for hydration errors
 */
function getHydrationAttributeNote(): string {
  return (
    '참고: 속성은 DOM을 더 잘 표현하기 위해 표시되지만 ' +
    '수분 불일치에는 영향을 미치지 않습니다.\n\n'
  );
}

// Node string utility functions

/**
 * Strips all newlines out of a given string
 *
 * @param input a string to be cleared of new line characters
 * @returns
 */
function stripNewlines(input: string): string {
  return input.replace(/\s+/gm, '');
}

/**
 * Reduces a string down to a maximum length of characters with ellipsis for readability
 *
 * @param input a string input
 * @param maxLength a maximum length in characters
 * @returns string
 */
function shorten(input: string | null, maxLength = 50): string {
  if (!input) {
    return '';
  }
  input = stripNewlines(input);
  return input.length > maxLength ? `${input.substring(0, maxLength - 1)}…` : input;
}
