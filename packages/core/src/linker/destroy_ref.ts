/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {EnvironmentInjector} from '../di';
import {LView} from '../render3/interfaces/view';
import {getLView} from '../render3/state';
import {removeLViewOnDestroy, storeLViewOnDestroy} from '../render3/util/view_utils';

/**
 * `DestroyRef`는 클린업 또는 파괴 동작을 위해 실행할 콜백을 설정할 수 있도록 해줍니다.
 * 이 파괴의 범위는 `DestroyRef`가 주입된 위치에 따라 다릅니다. `DestroyRef`
 *가 컴포넌트나 디렉티브에 주입되면, 콜백은 해당 컴포넌트나
 * 디렉티브가 파괴될 때 실행됩니다. 그렇지 않으면 콜백은 해당 인젝터가 파괴될 때 실행됩니다.
 *
 * @publicApi
 */
export abstract class DestroyRef {
  // 여기서 `DestroyRef`는 주로 DI 토큰으로 작용합니다. 이 토큰을 요청할 때
  // 인젝터에서 반환될 수 있는 객체의 (현재) 유형은 다음과 같습니다:
  // - 노드 인젝터에서 검색할 때의 `NodeInjectorDestroyRef`;
  // - 환경 인젝터에서 검색할 때의 `EnvironmentInjector`

  /**
   * 주어진 생명주기 범위에 파괴 콜백을 등록합니다. 콜백 등록 해제를 위해 호출할 수 있는
   * 클린업 함수가 반환됩니다.
   *
   * @usageNotes
   * ### 예제
   * ```ts
   * const destroyRef = inject(DestroyRef);
   *
   * // 파괴 콜백 등록
   * const unregisterFn = destroyRef.onDestroy(() => doSomethingOnDestroy());
   *
   * // 필요한 경우 파괴 콜백 실행 중지
   * unregisterFn();
   * ```
   */
  abstract onDestroy(callback: () => void): () => void;

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__: () => DestroyRef = injectDestroyRef;

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ENV_ID__: (injector: EnvironmentInjector) => DestroyRef = (injector) => injector;
}

export class NodeInjectorDestroyRef extends DestroyRef {
  constructor(readonly _lView: LView) {
    super();
  }

  override onDestroy(callback: () => void): () => void {
    storeLViewOnDestroy(this._lView, callback);
    return () => removeLViewOnDestroy(this._lView, callback);
  }
}

function injectDestroyRef(): DestroyRef {
  return new NodeInjectorDestroyRef(getLView());
}
