/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../di/injector';
import {Signal, ValueEqualityFn} from '../render3/reactivity/api';
import {WritableSignal} from '../render3/reactivity/signal';

/**
 * `Resource`의 상태입니다.
 *
 * @experimental
 */
export enum ResourceStatus {
  /**
   * 리소스에 유효한 요청이 없으며 로드를 수행하지 않습니다.
   *
   * `value()`는 `undefined`가 됩니다.
   */
  Idle,

  /**
   * 오류로 인해 로딩이 실패했습니다.
   *
   * `value()`는 `undefined`가 됩니다.
   */
  Error,

  /**
   * 리소스가 `request`의 변경으로 인해 새 값을 로딩 중입니다.
   *
   * `value()`는 `undefined`가 됩니다.
   */
  Loading,

  /**
   * 리소스가 동일한 요청을 위한 새 값을 다시 로딩 중입니다.
   *
   * `value()`는 다시 로딩 작업 중에 이전에 가져온 값을 계속 반환합니다.
   */
  Reloading,

  /**
   * 로딩이 완료되었고 리소스가 로더에서 반환된 값을 가지고 있습니다.
   */
  Resolved,

  /**
   * 리소스의 값이 `.set()` 또는 `.update()`를 통해 로컬로 설정되었습니다.
   */
  Local,
}

/**
 * 리소스는 비동기 종속성(예: API 호출의 결과)으로,
 * 신호를 통해 관리되고 전달됩니다.
 *
 * `Resource`를 생성하는 일반적인 방법은 `resource` 함수를 사용하는 것이지만,
 * 다양한 다른 API가 자체 개념을 설명하기 위해 `Resource` 인스턴스를 제공할 수 있습니다.
 *
 * @experimental
 */
export interface Resource<T> {
  /**
   * `Resource`의 현재 값이나 현재 값이 없으면 `undefined`.
   */
  readonly value: Signal<T>;

  /**
   * 리소스의 현재 상태로, 리소스가 현재 수행하는 작업과
   * `value`에서 예상할 수 있는 내용을 설명합니다.
   */
  readonly status: Signal<ResourceStatus>;

  /**
   * `error` 상태에 있을 때, 이 속성은 리소스의 마지막 알려진 오류를 반환합니다.
   */
  readonly error: Signal<unknown>;

  /**
   * 이 리소스가 새 값을 로딩 중인지(또는 기존 값을 다시 로딩 중인지) 여부입니다.
   */
  readonly isLoading: Signal<boolean>;

  /**
   * 이 리소스가 유효한 현재 값을 가지고 있는지 여부입니다.
   *
   * 이 함수는 반응형입니다.
   */
  hasValue(): this is Resource<Exclude<T, undefined>>;

  /**
   * 리소스에 비동기 종속성을 다시 로드하라는 지시입니다.
   *
   * 실제 백엔드 요청이 이루어질 때까지 리소스는 다시 로딩 상태로 들어가지 않습니다.
   *
   * @returns 재로드가 시작되었으면 true, 재로드가 불필요하거나 지원되지 않으면 false
   */
  reload(): boolean;
}

/**
 * 변경 가능한 값을 가진 `Resource`입니다.
 *
 * 리소스의 값을 덮어쓰면 '로컬' 상태로 설정됩니다.
 *
 * @experimental
 */
export interface WritableResource<T> extends Resource<T> {
  readonly value: WritableSignal<T>;
  hasValue(): this is WritableResource<Exclude<T, undefined>>;

  /**
   * `value.set`에 대한 편리한 래퍼입니다.
   */
  set(value: T): void;

  /**
   * `value.update`에 대한 편리한 래퍼입니다.
   */
  update(updater: (value: T) => T): void;
  asReadonly(): Resource<T>;
}

/**
 * `resource` 함수를 통해 생성된 `WritableResource`입니다.
 *
 * @experimental
 */
export interface ResourceRef<T> extends WritableResource<T> {
  hasValue(): this is ResourceRef<Exclude<T, undefined>>;

  /**
   * 리소스를 수동으로 삭제하여 보류 중인 요청을 취소하고 `idle` 상태로 돌아갑니다.
   */
  destroy(): void;
}

/**
 * 현재 로딩 작업에 대한 요청 및 기타 옵션을 제공하는 `ResourceLoader`의 매개변수입니다.
 *
 * @experimental
 */
export interface ResourceLoaderParams<R> {
  request: Exclude<NoInfer<R>, undefined>;
  abortSignal: AbortSignal;
  previous: {
    status: ResourceStatus;
  };
}

/**
 * `Resource`의 로딩 함수입니다.
 *
 * @experimental
 */
export type ResourceLoader<T, R> = (param: ResourceLoaderParams<R>) => PromiseLike<T>;

/**
 * `Resource`에 대한 스트리밍 로더입니다.
 *
 * @experimental
 */
export type ResourceStreamingLoader<T, R> = (
  param: ResourceLoaderParams<R>,
) => PromiseLike<Signal<ResourceStreamItem<T>>>;

/**
 * 리소스를 생성하기 위한 `resource` 함수의 옵션입니다.
 *
 * @experimental
 */
export interface BaseResourceOptions<T, R> {
  /**
   * 수행될 요청을 결정하는 반응형 함수입니다. 요청이 변경되면
   * 로더가 리소스의 새 값을 가져오도록 트리거됩니다.
   *
   * 요청 함수가 제공되지 않으면 리소스가 다시 로드되지 않는 한 로더는 다시 실행되지 않습니다.
   */
  request?: () => R;

  /**
   * 서버 값이 사용할 수 없을 때 리소스에서 반환될 값으로,
   * 예를 들어 리소스가 여전히 로딩 중이거나 오류 상태에 있을 때 사용됩니다.
   */
  defaultValue?: NoInfer<T>;

  /**
   * 로더의 반환 값을 비교하는 데 사용되는 동등성 함수입니다.
   */
  equal?: ValueEqualityFn<T>;

  /**
   * `resource`에서 사용하는 `Injector`를 재정의합니다.
   */
  injector?: Injector;
}

/**
 * 리소스를 생성하기 위한 `resource` 함수의 옵션입니다.
 *
 * @experimental
 */
export interface PromiseResourceOptions<T, R> extends BaseResourceOptions<T, R> {
  /**
   * 주어진 요청에 대한 리소스 값을 `Promise`로 반환하는 로딩 함수입니다.
   */
  loader: ResourceLoader<T, R>;

  /**
   * `stream`과 `loader`를 동시에 지정할 수 없습니다.
   */
  stream?: never;
}

/**
 * 리소스를 생성하기 위한 `resource` 함수의 옵션입니다.
 *
 * @experimental
 */
export interface StreamingResourceOptions<T, R> extends BaseResourceOptions<T, R> {
  /**
   * 주어진 요청에 대한 리소스의 값을 포함하는 신호의 `Promise`를 반환하는 로딩 함수로, 새 값이 스트림에서 수신되면 시간이 지남에 따라 변경될 수 있습니다.
   */
  stream: ResourceStreamingLoader<T, R>;

  /**
   * `stream`과 `loader`를 동시에 지정할 수 없습니다.
   */
  loader?: never;
}

/**
 * @experimental
 */
export type ResourceOptions<T, R> = PromiseResourceOptions<T, R> | StreamingResourceOptions<T, R>;

/**
 * @experimental
 */
export type ResourceStreamItem<T> = {value: T} | {error: unknown};
