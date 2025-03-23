/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  createSignal,
  SIGNAL,
  SignalGetter,
  SignalNode,
  signalSetFn,
  signalUpdateFn,
} from '@angular/core/primitives/signals';

import {isSignal, Signal, ValueEqualityFn} from './api';

/** `WritableSignal`을 다른 비쓰기 가능한 신호 및 함수와 구별하는 데 사용되는 심볼입니다. */
export const ɵWRITABLE_SIGNAL = /* @__PURE__ */ Symbol('WRITABLE_SIGNAL');

/**
 * 설정자 인터페이스를 통해 변형할 수 있는 값을 가진 `Signal`입니다.
 */
export interface WritableSignal<T> extends Signal<T> {
  [ɵWRITABLE_SIGNAL]: T;

  /**
   * 신호를 새로운 값으로 직접 설정하고 모든 종속성에 알립니다.
   */
  set(value: T): void;

  /**
   * 현재 값을 기반으로 신호의 값을 업데이트하고
   * 모든 종속성에 알립니다.
   */
  update(updateFn: (value: T) => T): void;

  /**
   * 이 신호의 읽기 전용 버전을 반환합니다. 읽기 전용 신호는 값을 읽기 위해 접근할 수 있지만
   * set 또는 update 메소드를 사용하여 변경할 수 없습니다. 읽기 전용 신호는 _아니요_
   * 값의 깊은 변화를 방지하는 내장 메커니즘을 가지고 있지 않습니다.
   */
  asReadonly(): Signal<T>;
}

/**
 * `WritableSignal`에서 값을 추출하기 위해 템플릿 타입 확인 중에 사용되는 유틸리티 함수입니다.
 * @codeGenApi
 */
export function ɵunwrapWritableSignal<T>(value: T | {[ɵWRITABLE_SIGNAL]: T}): T {
  // 주의: 이 함수는 비신호 getter 함수를 잘못 풀지 않기 위해 브랜드 대신 `WRITABLE_SIGNAL`을 사용합니다.
  return null!;
}

/**
 * `signal` 생성 함수에 전달된 옵션입니다.
 */
export interface CreateSignalOptions<T> {
  /**
   * 신호 값의 동등성을 정의하는 비교 함수입니다.
   */
  equal?: ValueEqualityFn<T>;

  /**
   * 신호에 대한 디버그 이름입니다. Angular DevTools에서 신호를 식별하는 데 사용됩니다.
   */
  debugName?: string;
}

/**
 * 직접 설정하거나 업데이트할 수 있는 `Signal`을 생성합니다.
 */
export function signal<T>(initialValue: T, options?: CreateSignalOptions<T>): WritableSignal<T> {
  const signalFn = createSignal(initialValue, options?.equal) as SignalGetter<T> &
    WritableSignal<T>;

  const node = signalFn[SIGNAL];

  signalFn.set = (newValue: T) => signalSetFn(node, newValue);
  signalFn.update = (updateFn: (value: T) => T) => signalUpdateFn(node, updateFn);
  signalFn.asReadonly = signalAsReadonlyFn.bind(signalFn as any) as () => Signal<T>;

  if (ngDevMode) {
    signalFn.toString = () => `[Signal: ${signalFn()}]`;
    node.debugName = options?.debugName;
  }

  return signalFn as WritableSignal<T>;
}

export function signalAsReadonlyFn<T>(this: SignalGetter<T>): Signal<T> {
  const node = this[SIGNAL] as SignalNode<T> & {readonlyFn?: Signal<T>};
  if (node.readonlyFn === undefined) {
    const readonlyFn = () => this();
    (readonlyFn as any)[SIGNAL] = node;
    node.readonlyFn = readonlyFn as Signal<T>;
  }
  return node.readonlyFn;
}

/**
 * 주어진 `value`가 쓸 수 있는 신호인지 확인합니다.
 */
export function isWritableSignal(value: unknown): value is WritableSignal<unknown> {
  return isSignal(value) && typeof (value as any).set === 'function';
}
