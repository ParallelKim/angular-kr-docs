/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ɵɵinjectAttribute} from '../render3/instructions/di_attr';

/**
 * 호스트 노드의 정적 속성을 주입하는 데 사용할 수 있는 토큰을 만듭니다.
 *
 * @usageNotes
 * ### 존재하는 것으로 알려진 속주입
 * ```ts
 * @Directive()
 * class MyDir {
 *   attr: string = inject(new HostAttributeToken('some-attr'));
 * }
 * ```
 *
 * ### 선택적으로 속주입
 * ```ts
 * @Directive()
 * class MyDir {
 *   attr: string | null = inject(new HostAttributeToken('some-attr'), {optional: true});
 * }
 * ```
 * @publicApi
 */
export class HostAttributeToken {
  constructor(private attributeName: string) {}

  /** @internal */
  __NG_ELEMENT_ID__ = () => ɵɵinjectAttribute(this.attributeName);

  toString(): string {
    return `HostAttributeToken ${this.attributeName}`;
  }
}
