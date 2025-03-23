/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  ComputationFn,
  createLinkedSignal,
  LinkedSignalGetter,
  LinkedSignalNode,
  linkedSignalSetFn,
  linkedSignalUpdateFn,
  SIGNAL,
} from '@angular/core/primitives/signals';
import {Signal, ValueEqualityFn} from './api';
import {signalAsReadonlyFn, WritableSignal} from './signal';

const identityFn = <T>(v: T) => v;

/**
 * 연결된 반응적 계산에 의해 값이 초기화되고 재설정되는 쓰기 가능한 신호를 생성합니다.
 *
 * @developerPreview
 */
export function linkedSignal<D>(
  computation: () => D,
  options?: {equal?: ValueEqualityFn<NoInfer<D>>},
): WritableSignal<D>;

/**
 * 연결된 반응적 계산에 의해 값이 초기화되고 재설정되는 쓰기 가능한 신호를 생성합니다.
 * 이는 계산이 신호의 이전 값과 계산 결과에 접근할 수 있는 고급 API 형태입니다.
 *
 * 참고: 계산은 반응적이며, 연결된 신호는 계산 내에서 사용되는 신호 중 하나가 변경될 때마다 자동으로 업데이트됩니다.
 *
 * @developerPreview
 */
export function linkedSignal<S, D>(options: {
  source: () => S;
  computation: (source: NoInfer<S>, previous?: {source: NoInfer<S>; value: NoInfer<D>}) => D;
  equal?: ValueEqualityFn<NoInfer<D>>;
}): WritableSignal<D>;

export function linkedSignal<S, D>(
  optionsOrComputation:
    | {
        source: () => S;
        computation: ComputationFn<S, D>;
        equal?: ValueEqualityFn<D>;
      }
    | (() => D),
  options?: {equal?: ValueEqualityFn<D>},
): WritableSignal<D> {
  if (typeof optionsOrComputation === 'function') {
    const getter = createLinkedSignal<D, D>(
      optionsOrComputation,
      identityFn<D>,
      options?.equal,
    ) as LinkedSignalGetter<D, D> & WritableSignal<D>;
    return upgradeLinkedSignalGetter(getter);
  } else {
    const getter = createLinkedSignal<S, D>(
      optionsOrComputation.source,
      optionsOrComputation.computation,
      optionsOrComputation.equal,
    );
    return upgradeLinkedSignalGetter(getter);
  }
}

function upgradeLinkedSignalGetter<S, D>(getter: LinkedSignalGetter<S, D>): WritableSignal<D> {
  if (ngDevMode) {
    getter.toString = () => `[LinkedSignal: ${getter()}]`;
  }

  const node = getter[SIGNAL] as LinkedSignalNode<S, D>;
  const upgradedGetter = getter as LinkedSignalGetter<S, D> & WritableSignal<D>;

  upgradedGetter.set = (newValue: D) => linkedSignalSetFn(node, newValue);
  upgradedGetter.update = (updateFn: (value: D) => D) => linkedSignalUpdateFn(node, updateFn);
  upgradedGetter.asReadonly = signalAsReadonlyFn.bind(getter as any) as () => Signal<D>;

  return upgradedGetter;
}
