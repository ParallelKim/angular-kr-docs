/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {XSS_SECURITY_URL} from '../error_details_base_url';
import {TrustedHTML} from '../util/security/trusted_type_defs';
import {trustedHTMLFromString} from '../util/security/trusted_types';

import {getInertBodyHelper, InertBodyHelper} from './inert_body';
import {_sanitizeUrl} from './url_sanitizer';

function tagSet(tags: string): {[k: string]: boolean} {
  const res: {[k: string]: boolean} = {};
  for (const t of tags.split(',')) res[t] = true;
  return res;
}

function merge(...sets: {[k: string]: boolean}[]): {[k: string]: boolean} {
  const res: {[k: string]: boolean} = {};
  for (const s of sets) {
    for (const v in s) {
      if (s.hasOwnProperty(v)) res[v] = true;
    }
  }
  return res;
}

// 요소 및 속성에 대한 좋은 정보 소스
// https://html.spec.whatwg.org/#semantics
// https://simon.html5.org/html-elements

// 안전한 무효 요소 - HTML5
// https://html.spec.whatwg.org/#void-elements
const VOID_ELEMENTS = tagSet('area,br,col,hr,img,wbr');

// 일부러 열어 두어야 하는 요소(자체적으로 닫히는 요소)
// https://html.spec.whatwg.org/#optional-tags
const OPTIONAL_END_TAG_BLOCK_ELEMENTS = tagSet('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr');
const OPTIONAL_END_TAG_INLINE_ELEMENTS = tagSet('rp,rt');
const OPTIONAL_END_TAG_ELEMENTS = merge(
  OPTIONAL_END_TAG_INLINE_ELEMENTS,
  OPTIONAL_END_TAG_BLOCK_ELEMENTS,
);

// 안전한 블록 요소 - HTML5
const BLOCK_ELEMENTS = merge(
  OPTIONAL_END_TAG_BLOCK_ELEMENTS,
  tagSet(
    'address,article,' +
      'aside,blockquote,caption,center,del,details,dialog,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
      'h6,header,hgroup,hr,ins,main,map,menu,nav,ol,pre,section,summary,table,ul',
  ),
);

// 인라인 요소 - HTML5
const INLINE_ELEMENTS = merge(
  OPTIONAL_END_TAG_INLINE_ELEMENTS,
  tagSet(
    'a,abbr,acronym,audio,b,' +
      'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,picture,q,ruby,rp,rt,s,' +
      'samp,small,source,span,strike,strong,sub,sup,time,track,tt,u,var,video',
  ),
);

export const VALID_ELEMENTS = merge(
  VOID_ELEMENTS,
  BLOCK_ELEMENTS,
  INLINE_ELEMENTS,
  OPTIONAL_END_TAG_ELEMENTS,
);

// href 속성이 있는 속성으로, 따라서 정리를 필요로 함
export const URI_ATTRS = tagSet('background,cite,href,itemtype,longdesc,poster,src,xlink:href');

const HTML_ATTRS = tagSet(
  'abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,' +
    'compact,controls,coords,datetime,default,dir,download,face,headers,height,hidden,hreflang,hspace,' +
    'ismap,itemscope,itemprop,kind,label,lang,language,loop,media,muted,nohref,nowrap,open,preload,rel,rev,role,rows,rowspan,rules,' +
    'scope,scrolling,shape,size,sizes,span,srclang,srcset,start,summary,tabindex,target,title,translate,type,usemap,' +
    'valign,value,vspace,width',
);

// WAI-ARIA 1.1에 따른 접근성 속성 (W3C Working Draft 2018년 12월 14일)
const ARIA_ATTRS = tagSet(
  'aria-activedescendant,aria-atomic,aria-autocomplete,aria-busy,aria-checked,aria-colcount,aria-colindex,' +
    'aria-colspan,aria-controls,aria-current,aria-describedby,aria-details,aria-disabled,aria-dropeffect,' +
    'aria-errormessage,aria-expanded,aria-flowto,aria-grabbed,aria-haspopup,aria-hidden,aria-invalid,' +
    'aria-keyshortcuts,aria-label,aria-labelledby,aria-level,aria-live,aria-modal,aria-multiline,' +
    'aria-multiselectable,aria-orientation,aria-owns,aria-placeholder,aria-posinset,aria-pressed,aria-readonly,' +
    'aria-relevant,aria-required,aria-roledescription,aria-rowcount,aria-rowindex,aria-rowspan,aria-selected,' +
    'aria-setsize,aria-sort,aria-valuemax,aria-valuemin,aria-valuenow,aria-valuetext',
);

// 주: 현재 SVG를 지원하지 않습니다. SVG 정리는 과거에 여러 보안 문제를 일으켰기 때문에 가능한 한 제외하는 것이 더 안전해 보입니다.
// innerHTML을 통해 SVG 바인딩을 지원해야 하는 경우, 여기에 SVG 속성을 추가해야 합니다.

// 주: 정리는 <form> 요소 또는 기타 활성 요소(<button> 등)를 허용하지 않습니다. 이러한 요소는 정리할 수 있지만,
// 정당한 사용 사례 없이 보안 표면을 증가시키므로 여기서는 제외합니다.

export const VALID_ATTRS = merge(URI_ATTRS, HTML_ATTRS, ARIA_ATTRS);

// 요소 자체가 잘못된 경우 해당 콘텐츠를 순회/보존하지 않아야 합니다.
//
// 일반적으로 `<invalid>Some content</invalid>`는 (이 경우 보존)
// `Some content`를 순회하겠지만 `invalid-element` 개폐 태그는 제거합니다. 하지만 일부 요소는,
// 요소 자체가 제거될 경우 콘텐츠를 보존하고 싶지 않습니다.
const SKIP_TRAVERSING_CONTENT_IF_INVALID_ELEMENTS = tagSet('script,style,template');

/**
 * SanitizingHtmlSerializer는 DOM 조각을 직렬화하여 안전하지 않은 요소와 안전하지 않은
 * 속성을 제거합니다.
 */
class SanitizingHtmlSerializer {
  // 무언가가 제거된 것을 명시적으로 추적하여, 단지 문자가 다시 인코딩되었기 때문에 정리에 대한 경고를
  // 실수로 하지 않도록 합니다.
  public sanitizedSomething = false;
  private buf: string[] = [];

  sanitizeChildren(el: Element): string {
    // 이것은 Angular의 다양한 DOM 어댑터에서 실행되어야 하므로 TreeWalker를 사용할 수 없습니다.
    // 그러나 이 코드는 `document`의 속성에 접근하는 일을 하지 않으므로 DOM 클로버링에 취약하지 않아야 합니다.
    let current: Node = el.firstChild!;
    let traverseContent = true;
    let parentNodes = [];
    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        traverseContent = this.startElement(current as Element);
      } else if (current.nodeType === Node.TEXT_NODE) {
        this.chars(current.nodeValue!);
      } else {
        // 비요소, 비텍스트 노드를 제거합니다.
        this.sanitizedSomething = true;
      }
      if (traverseContent && current.firstChild) {
        // 콘텐츠에 들어가기 전에 현재 노드를 부모 스택에 푸시합니다.
        parentNodes.push(current);
        current = getFirstChild(current)!;
        continue;
      }
      while (current) {
        // 요소를 떠납니다.
        // 닫는 태그와 함께 위쪽으로 및 오른쪽으로 이동합니다.
        if (current.nodeType === Node.ELEMENT_NODE) {
          this.endElement(current as Element);
        }

        let next = getNextSibling(current)!;

        if (next) {
          current = next;
          break;
        }

        // 다음 형제 노드가 없으므로 부모 노드로 올라갑니다 (스택에서 추출).
        current = parentNodes.pop()!;
      }
    }
    return this.buf.join('');
  }

  /**
   * 열기 요소 태그를 정리하고(유효한 경우) 요소의 콘텐츠를 순회해야 하는지 반환합니다.
   * 요소 콘텐츠는 항상 순회해야 합니다(요소 자체가 유효/안전하지 않더라도),
   * `SKIP_TRAVERSING_CONTENT_IF_INVALID_ELEMENTS` 중 하나가 아닌 경우에만 예외입니다.
   *
   * @param element 정리할 요소.
   * @return 요소의 콘텐츠를 순회해야 하는지 여부.
   */
  private startElement(element: Element): boolean {
    const tagName = getNodeName(element).toLowerCase();
    if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
      this.sanitizedSomething = true;
      return !SKIP_TRAVERSING_CONTENT_IF_INVALID_ELEMENTS.hasOwnProperty(tagName);
    }
    this.buf.push('<');
    this.buf.push(tagName);
    const elAttrs = element.attributes;
    for (let i = 0; i < elAttrs.length; i++) {
      const elAttr = elAttrs.item(i);
      const attrName = elAttr!.name;
      const lower = attrName.toLowerCase();
      if (!VALID_ATTRS.hasOwnProperty(lower)) {
        this.sanitizedSomething = true;
        continue;
      }
      let value = elAttr!.value;
      // TODO(martinprobst): data:image/...의 이미지 URI에 대한 특수 사례 처리
      if (URI_ATTRS[lower]) value = _sanitizeUrl(value);
      this.buf.push(' ', attrName, '="', encodeEntities(value), '"');
    }
    this.buf.push('>');
    return true;
  }

  private endElement(current: Element) {
    const tagName = getNodeName(current).toLowerCase();
    if (VALID_ELEMENTS.hasOwnProperty(tagName) && !VOID_ELEMENTS.hasOwnProperty(tagName)) {
      this.buf.push('</');
      this.buf.push(tagName);
      this.buf.push('>');
    }
  }

  private chars(chars: string) {
    this.buf.push(encodeEntities(chars));
  }
}

/**
 * 주어진 자식 노드가 주어진 부모 노드의 자손인지 확인합니다.
 * `.firstChild`와 같은 속성이 클로버링될 때는 그렇지 않을 수 있고,
 * `.firstChild`에 접근 시 예상치 못한 노드가 반환되기 때문입니다.
 */
function isClobberedElement(parentNode: Node, childNode: Node): boolean {
  return (
    (parentNode.compareDocumentPosition(childNode) & Node.DOCUMENT_POSITION_CONTAINED_BY) !==
    Node.DOCUMENT_POSITION_CONTAINED_BY
  );
}

/**
 * 다음 형제 노드를 검색하고 `nextSibling` 속성이 클로버링되었는지 확인합니다.
 */
function getNextSibling(node: Node): Node | null {
  const nextSibling = node.nextSibling;
  // `nextSibling`이 클로버링되지 않았는지 확인합니다: 다음 형제로 탐색한 후,
  // 이전 노드로 돌아갈 때 원래 노드가 반환되어야 합니다.
  if (nextSibling && node !== nextSibling.previousSibling) {
    throw clobberedElementError(nextSibling);
  }
  return nextSibling;
}

/**
 * 첫 번째 자식 노드를 검색하고 `firstChild` 속성이 클로버링되지 않았는지 확인합니다.
 */
function getFirstChild(node: Node): Node | null {
  const firstChild = node.firstChild;
  if (firstChild && isClobberedElement(node, firstChild)) {
    throw clobberedElementError(firstChild);
  }
  return firstChild;
}

/** 합리적인 nodeName을 가져옵니다. 클로버링된 노드에도 적용됩니다. */
export function getNodeName(node: Node): string {
  const nodeName = node.nodeName;
  // 속성이 클로버링되었으면 `HTMLFormElement`로 가정합니다.
  return typeof nodeName === 'string' ? nodeName : 'FORM';
}

function clobberedElementError(node: Node) {
  return new Error(`HTML 정리를 실패했습니다. 요소가 클로버링됨: ${(node as Element).outerHTML}`);
}

// 태그 및 속성을 파싱하기 위한 정규 표현식
const SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
// !부터 ~까지의 ASCII 범위.
const NON_ALPHANUMERIC_REGEXP = /([^\#-~ |!])/g;

/**
 * 잠재적으로 위험한 모든 문자를 이스케이프하여
 * 결과 문자열이 속성 또는 요소 텍스트에 안전하게 삽입될 수 있도록 합니다.
 * @param value
 */
function encodeEntities(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(SURROGATE_PAIR_REGEXP, function (match: string) {
      const hi = match.charCodeAt(0);
      const low = match.charCodeAt(1);
      return '&#' + ((hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000) + ';';
    })
    .replace(NON_ALPHANUMERIC_REGEXP, function (match: string) {
      return '&#' + match.charCodeAt(0) + ';';
    })
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let inertBodyHelper: InertBodyHelper;

/**
 * 주어진 안전하지 않은, 신뢰할 수 없는 HTML 조각을 정리하고,
 * 브라우저 환경에서 DOM에 추가하기에 안전한 HTML 텍스트를 반환합니다.
 */
export function _sanitizeHtml(defaultDoc: any, unsafeHtmlInput: string): TrustedHTML | string {
  let inertBodyElement: HTMLElement | null = null;
  try {
    inertBodyHelper = inertBodyHelper || getInertBodyHelper(defaultDoc);
    // unsafeHtml가 실제로 문자열인지 확인합니다 (TypeScript 타입은 런타임에서 강제 적용되지 않습니다).
    let unsafeHtml = unsafeHtmlInput ? String(unsafeHtmlInput) : '';
    inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);

    // mXSS 보호. 문서를 반복적으로 파싱하여 안정성을 보장합니다.
    // 브라우저가 잘못된 HTML을 자동으로 수정하려고 할 때, 비활성 HTML이 위험해지는 일을 방지합니다.
    let mXSSAttempts = 5;
    let parsedHtml = unsafeHtml;

    do {
      if (mXSSAttempts === 0) {
        throw new Error('입력을 안정적으로 하기 위해 HTML 정리를 실패했습니다.');
      }
      mXSSAttempts--;

      unsafeHtml = parsedHtml;
      parsedHtml = inertBodyElement!.innerHTML;
      inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
    } while (unsafeHtml !== parsedHtml);

    const sanitizer = new SanitizingHtmlSerializer();
    const safeHtml = sanitizer.sanitizeChildren(
      (getTemplateContent(inertBodyElement!) as Element) || inertBodyElement,
    );
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && sanitizer.sanitizedSomething) {
      console.warn(
        `경고: HTML 정리로 일부 콘텐츠가 제거되었습니다. ${XSS_SECURITY_URL}을 확인하세요.`,
      );
    }

    return trustedHTMLFromString(safeHtml);
  } finally {
    // 문제가 발생할 경우, inertElement를 지워 DOM 구조를 초기화합니다.
    if (inertBodyElement) {
      const parent = getTemplateContent(inertBodyElement) || inertBodyElement;
      while (parent.firstChild) {
        parent.firstChild.remove();
      }
    }
  }
}

export function getTemplateContent(el: Node): Node | null {
  return 'content' in (el as any) /** Microsoft/TypeScript#21517 */ && isTemplateElement(el)
    ? el.content
    : null;
}
function isTemplateElement(el: Node): el is HTMLTemplateElement {
  return el.nodeType === Node.ELEMENT_NODE && el.nodeName === 'TEMPLATE';
}
