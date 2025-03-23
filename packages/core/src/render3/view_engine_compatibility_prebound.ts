/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createTemplateRef, TemplateRef} from '../linker/template_ref';
import {TNode} from './interfaces/node';
import {LView} from './interfaces/view';

/**
 * '<ng-template>' 요소에 로컬 참조가 설정될 때 `Injector`에서 `TemplateRef` 인스턴스를 가져옵니다.
 *
 * @codeGenApi
 */
export function ɵɵtemplateRefExtractor(tNode: TNode, lView: LView): TemplateRef<any> | null {
  return createTemplateRef(tNode, lView);
}
