/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {getTemplateLocationDetails} from '../render3/instructions/element_validation';
import {TNodeType} from '../render3/interfaces/node';
import {RComment, RElement} from '../render3/interfaces/renderer_dom';
import {RENDERER} from '../render3/interfaces/view';
import {nativeRemoveNode} from '../render3/dom_node_manipulation';
import {getLView, getSelectedTNode} from '../render3/state';
import {getNativeByTNode} from '../render3/util/view_utils';
import {trustedHTMLFromString} from '../util/security/trusted_types';

/**
 * 런타임에서 호출되는 검증 함수로, 잠재적으로
 * <iframe>의 보안 민감 속성을 나타낼 수 있는 각 바인딩에 대해 호출됩니다.
 * 이러한 속성의 전체 목록은
 * `packages/compiler/src/schema/dom_security_schema.ts` 스크립트에서 `IFRAME_SECURITY_SENSITIVE_ATTRS`를 참조하십시오.
 *
 * @codeGenApi
 */
export function ɵɵvalidateIframeAttribute(attrValue: any, tagName: string, attrName: string) {
  const lView = getLView();
  const tNode = getSelectedTNode()!;
  const element = getNativeByTNode(tNode, lView) as RElement | RComment;

  // 보안상의 이유로 <iframe>의 보안 민감 속성/속성의 동적 바인딩을 제한합니다.
  if (tNode.type === TNodeType.Element && tagName.toLowerCase() === 'iframe') {
    const iframe = element as HTMLIFrameElement;

    // 보안 민감 속성이 나중에 속성/속성 바인딩을 통해 설정되는 경우
    // 이전에 적용된 `src` 및 `srcdoc`을 지웁니다.
    iframe.src = '';
    iframe.srcdoc = trustedHTMLFromString('') as unknown as string;

    // 또한 문서에서 <iframe>을 제거합니다.
    nativeRemoveNode(lView[RENDERER], iframe);

    const errorMessage =
      ngDevMode &&
      `Angular는 \`${attrName}\`이 <iframe>에 바인딩으로 적용되었다고 감지했습니다. ${getTemplateLocationDetails(lView)} ` +
        `보안상의 이유로, \`${attrName}\`는 <iframe>에 정적 속성으로만 설정할 수 있습니다. \n` +
        `이를 수정하려면, \`${attrName}\` 바인딩을 템플릿이나 호스트 바인딩 섹션의 정적 속성으로 전환하십시오.`;
    throw new RuntimeError(RuntimeErrorCode.UNSAFE_IFRAME_ATTRS, errorMessage);
  }
  return attrValue;
}
