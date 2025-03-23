/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../../interface/type';
import {getComponentDef} from '../def_getters';
import {ClassDebugInfo} from '../interfaces/definition';

/**
 * Angular 클래스의 디버그 정보를 설정합니다.
 *
 * 이 런타임은 ngDevMode 플래그로 보호됩니다.
 */
export function ɵsetClassDebugInfo(type: Type<any>, debugInfo: ClassDebugInfo): void {
  const def = getComponentDef(type);
  if (def !== null) {
    def.debugInfo = debugInfo;
  }
}
