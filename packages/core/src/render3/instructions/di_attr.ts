/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {injectAttributeImpl} from '../di';
import {getCurrentTNode} from '../state';

/**
 * DI로부터 속성 주입의 파사드.
 *
 * @codeGenApi
 */
export function ɵɵinjectAttribute(attrNameToInject: string): string | null {
  return injectAttributeImpl(getCurrentTNode()!, attrNameToInject);
}
