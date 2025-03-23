/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {TNode, TNodeType} from '../render3/interfaces/node';
import {getCurrentTNode} from '../render3/state';

import {InjectionToken} from './injection_token';
import {InternalInjectFlags} from './interface/injector';

/**
 * 호스트 노드의 태그 이름을 주입하는 데 사용할 수 있는 토큰입니다.
 *
 * @usageNotes
 * ### 존재하는 것으로 알려진 태그 이름 주입
 * ```ts
 * @Directive()
 * class MyDir {
 *   tagName: string = inject(HOST_TAG_NAME);
 * }
 * ```
 *
 * ### 선택적으로 태그 이름 주입
 * ```ts
 * @Directive()
 * class MyDir {
 *   tagName: string | null = inject(HOST_TAG_NAME, {optional: true});
 * }
 * ```
 * @publicApi
 */
export const HOST_TAG_NAME = new InjectionToken<string>(ngDevMode ? 'HOST_TAG_NAME' : '');

// HOST_TAG_NAME은 ElementRef와 유사한 현재 노드에서 해결되어야 하므로,
// 공장을 사용하지 않고 여기에서 __NG_ELEMENT_ID__를 수동으로 지정합니다.
// tslint:disable-next-line:no-toplevel-property-access
(HOST_TAG_NAME as any).__NG_ELEMENT_ID__ = (flags: InternalInjectFlags) => {
  const tNode = getCurrentTNode();
  if (tNode === null) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_INJECTION_TOKEN,
      ngDevMode &&
        'HOST_TAG_NAME은 생성 시(클래스 생성자 또는 클래스 필드 초기화기에서) ' +
          '지시문 및 구성 요소에서만 주입될 수 있습니다.',
    );
  }
  if (tNode.type & TNodeType.Element) {
    return tNode.value;
  }
  if (flags & InternalInjectFlags.Optional) {
    return null;
  }
  throw new RuntimeError(
    RuntimeErrorCode.INVALID_INJECTION_TOKEN,
    ngDevMode &&
      `HOST_TAG_NAME은 DOM에 기본 요소가 없는 ${getDevModeNodeName(tNode)}에서 사용되었습니다. ` +
        `이는 유효하지 않으므로 종속성을 선택사항으로 표시해야 합니다.`,
  );
};

function getDevModeNodeName(tNode: TNode) {
  if (tNode.type & TNodeType.ElementContainer) {
    return 'an <ng-container>';
  } else if (tNode.type & TNodeType.Container) {
    return 'an <ng-template>';
  } else if (tNode.type & TNodeType.LetDeclaration) {
    return 'an @let declaration';
  } else {
    return 'a node';
  }
}
