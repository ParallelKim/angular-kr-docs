/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TNodeType} from '../interfaces/node';
import {RElement} from '../interfaces/renderer_dom';
import {HEADER_OFFSET, RENDERER} from '../interfaces/view';
import {assertTNodeType} from '../node_assert';
import {getLView, getTView} from '../state';
import {getNativeByIndex, getTNode} from '../util/view_utils';

/**
 * 현재 뷰의 각 요소가 정의된 소스 템플릿 내 위치를 설정합니다.
 *
 * @param index DOM 노드가 생성된 위치의 인덱스입니다.
 * @param templatePath 노드가 정의된 템플릿의 경로입니다.
 * @param locations 소스 위치에 연결할 요소 위치입니다.
 *
 * @codeGenApi
 */
export function ɵɵattachSourceLocations(
  templatePath: string,
  locations: [index: number, offset: number, line: number, column: number][],
) {
  const tView = getTView();
  const lView = getLView();
  const renderer = lView[RENDERER];
  const attributeName = 'data-ng-source-location';

  for (const [index, offset, line, column] of locations) {
    const tNode = getTNode(tView, index + HEADER_OFFSET);
    // 컴파일러는 비요소 노드에 대한 명령어를 생성해서는 안 되지만, 만일을 대비해 확인합니다.
    ngDevMode && assertTNodeType(tNode, TNodeType.Element);
    const node = getNativeByIndex(index + HEADER_OFFSET, lView) as RElement;

    // DOM에서 직접 속성을 설정하여 지시어 일치에 참여하지 않도록 합니다.
    if (!node.hasAttribute(attributeName)) {
      const attributeValue = `${templatePath}@o:${offset},l:${line},c:${column}`;
      renderer.setAttribute(node, attributeName, attributeValue);
    }
  }
}
