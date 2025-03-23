/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {concatStringsWithSpace} from '../../util/stringify';
import {assertFirstCreatePass} from '../assert';
import {AttributeMarker} from '../interfaces/attribute_marker';
import {TAttributes, TNode} from '../interfaces/node';
import {getTView} from '../state';

/**
 * `TAttributes`에서 정적 스타일(class/style)을 계산합니다.
 *
 * 이 함수는 `firstCreatePass` 동안에만 호출되어야 합니다.
 *
 * @param tNode 스타일 정보가 로드되어야 하는 `TNode`.
 * @param attrs 스타일 정보를 포함하는 `TAttributes`.
 * @param writeToHost 결과 정적 스타일이 어디에 쓰여져야 합니까?
 *   - `false` `TNode.stylesWithoutHost` / `TNode.classesWithoutHost`에 기록
 *   - `true` `TNode.styles` / `TNode.classes`에 기록
 */
export function computeStaticStyling(
  tNode: TNode,
  attrs: TAttributes | null,
  writeToHost: boolean,
): void {
  ngDevMode && assertFirstCreatePass(getTView(), '첫 번째 템플릿 패스에서만 호출되어야 합니다.');
  let styles: string | null = writeToHost ? tNode.styles : null;
  let classes: string | null = writeToHost ? tNode.classes : null;
  let mode: AttributeMarker | 0 = 0;
  if (attrs !== null) {
    for (let i = 0; i < attrs.length; i++) {
      const value = attrs[i];
      if (typeof value === 'number') {
        mode = value;
      } else if (mode == AttributeMarker.Classes) {
        classes = concatStringsWithSpace(classes, value as string);
      } else if (mode == AttributeMarker.Styles) {
        const style = value as string;
        const styleValue = attrs[++i] as string;
        styles = concatStringsWithSpace(styles, style + ': ' + styleValue + ';');
      }
    }
  }
  writeToHost ? (tNode.styles = styles) : (tNode.stylesWithoutHost = styles);
  writeToHost ? (tNode.classes = classes) : (tNode.classesWithoutHost = classes);
}
