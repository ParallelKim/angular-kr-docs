/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {untracked} from '../render3/reactivity/untracked';
import {computed} from '../render3/reactivity/computed';
import {signal, signalAsReadonlyFn, WritableSignal} from '../render3/reactivity/signal';
import {Signal} from '../render3/reactivity/api';
import {effect, EffectRef} from '../render3/reactivity/effect';
import {
  ResourceOptions,
  ResourceStatus,
  WritableResource,
  Resource,
  ResourceRef,
  ResourceStreamingLoader,
  StreamingResourceOptions,
  ResourceStreamItem,
} from './api';

import {ValueEqualityFn} from '@angular/core/primitives/signals';

import {Injector} from '../di/injector';
import {assertInInjectionContext} from '../di/contextual';
import {inject} from '../di/injector_compatibility';
import {PendingTasks} from '../pending_tasks';
import {linkedSignal} from '../render3/reactivity/linked_signal';
import {DestroyRef} from '../linker/destroy_ref';

/**
 * 비동기 작업 정의에 대한 반응형 요청을 프로젝트하는 `Resource`를 구성합니다.
 * 로더 기능에 의해 정의되며, 신호를 통해 로딩 작업의 결과를 노출합니다.
 *
 * `resource`는 _읽기_ 작업을 위해 설계되었으며, 변이를 수행하는 작업에는 적합하지 않습니다.
 * `resource`는 파괴되거나 새로운 요청 객체가 사용 가능해지면 진행 중인 로드를 `AbortSignal`을 통해 취소합니다. 이는 변이를 조기에 중단할 수 있습니다.
 *
 * @experimental
 */
export function resource<T, R>(
  options: ResourceOptions<T, R> & {defaultValue: NoInfer<T>},
): ResourceRef<T>;

/**
 * 비동기 작업 정의에 대한 반응형 요청을 프로젝트하는 `Resource`를 구성합니다.
 * 로더 기능에 의해 정의되며, 신호를 통해 로딩 작업의 결과를 노출합니다.
 *
 * `resource`는 _읽기_ 작업을 위해 설계되었으며, 변이를 수행하는 작업에는 적합하지 않습니다.
 * `resource`는 파괴되거나 새로운 요청 객체가 사용 가능해지면 진행 중인 로드를 `AbortSignal`을 통해 취소합니다. 이는 변이를 조기에 중단할 수 있습니다.
 *
 * @experimental
 */
export function resource<T, R>(options: ResourceOptions<T, R>): ResourceRef<T | undefined>;
export function resource<T, R>(options: ResourceOptions<T, R>): ResourceRef<T | undefined> {
  options?.injector || assertInInjectionContext(resource);
  const request = (options.request ?? (() => null)) as () => R;
  return new ResourceImpl<T | undefined, R>(
    request,
    getLoader(options),
    options.defaultValue,
    options.equal ? wrapEqualityFn(options.equal) : undefined,
    options.injector ?? inject(Injector),
  );
}

type ResourceInternalStatus =
  | ResourceStatus.Idle
  | ResourceStatus.Loading
  | ResourceStatus.Resolved
  | ResourceStatus.Local;

/**
 * 리소스의 내부 상태입니다.
 */
interface ResourceProtoState<T> {
  extRequest: WrappedRequest;

  // 간단함을 위해 상태는 공개 상태 열거형의 하위 집합으로 내부적으로 추적됩니다.
  // Reloading 및 Error 상태는 다른 상태에 따라 Loading 및 Resolved로부터 투영됩니다.
  status: ResourceInternalStatus;
}

interface ResourceState<T> extends ResourceProtoState<T> {
  previousStatus: ResourceStatus;
  stream: Signal<ResourceStreamItem<T>> | undefined;
}

type WrappedRequest = {request: unknown; reload: number};

/**
 * `.set` 및 `.update`를 위임하여 `.value`를 `WritableSignal`로 구현하는 기본 클래스입니다.
 */
abstract class BaseWritableResource<T> implements WritableResource<T> {
  readonly value: WritableSignal<T>;
  abstract readonly status: Signal<ResourceStatus>;
  abstract readonly error: Signal<unknown>;
  abstract reload(): boolean;

  constructor(value: Signal<T>) {
    this.value = value as WritableSignal<T>;
    this.value.set = this.set.bind(this);
    this.value.update = this.update.bind(this);
    this.value.asReadonly = signalAsReadonlyFn;
  }

  abstract set(value: T): void;

  update(updateFn: (value: T) => T): void {
    this.set(updateFn(untracked(this.value)));
  }

  readonly isLoading = computed(
    () => this.status() === ResourceStatus.Loading || this.status() === ResourceStatus.Reloading,
  );

  hasValue(): this is ResourceRef<Exclude<T, undefined>> {
    return this.value() !== undefined;
  }

  asReadonly(): Resource<T> {
    return this;
  }
}

/**
 * 리소스의 상태를 관리하기 위해 `linkedSignal`을 사용하는 `resource()`에 대한 구현입니다.
 */
export class ResourceImpl<T, R> extends BaseWritableResource<T> implements ResourceRef<T> {
  private readonly pendingTasks: PendingTasks;

  /**
   * 리소스의 현재 상태. 상태, 값 및 오류는 이로부터 유래합니다.
   */
  private readonly state: WritableSignal<ResourceState<T>>;

  /**
   * 현재 요청을 writable reload 신호와 결합하여 리소스를 명령적으로 다시 로드할 수 있도록 합니다.
   */
  protected readonly extRequest: WritableSignal<WrappedRequest>;
  private readonly effectRef: EffectRef;

  private pendingController: AbortController | undefined;
  private resolvePendingTask: (() => void) | undefined = undefined;
  private destroyed = false;

  constructor(
    request: () => R,
    private readonly loaderFn: ResourceStreamingLoader<T, R>,
    private readonly defaultValue: T,
    private readonly equal: ValueEqualityFn<T> | undefined,
    injector: Injector,
  ) {
    super(
      // `BaseWritableResource`에 대한 값으로 계산된 신호를 표시하여
      // `ResourceImpl.set`로 위임되는 `WritableSignal`로 업그레이드 할 수 있습니다.
      computed(
        () => {
          const streamValue = this.state().stream?.();
          return streamValue && isResolved(streamValue) ? streamValue.value : this.defaultValue;
        },
        {equal},
      ),
    );

    // writable reload 신호를 포함하도록 `request()`를 확장합니다.
    this.extRequest = linkedSignal({
      source: request,
      computation: (request) => ({request, reload: 0}),
    });

    // 주 리소스 상태는 `linkedSignal`로 관리되며, 이는 요청 신호 변경 시 리소스가 즉시 상태를 변경할 수 있게 합니다.
    this.state = linkedSignal<WrappedRequest, ResourceState<T>>({
      // 요청이 변경될 때마다,
      source: this.extRequest,
      // 상태 변경에 따라 리소스 상태를 계산합니다.
      computation: (extRequest, previous) => {
        const status =
          extRequest.request === undefined ? ResourceStatus.Idle : ResourceStatus.Loading;
        if (!previous) {
          return {
            extRequest,
            status,
            previousStatus: ResourceStatus.Idle,
            stream: undefined,
          };
        } else {
          return {
            extRequest,
            status,
            previousStatus: projectStatusOfState(previous.value),
            // 요청이 변경되지 않는 한 이전 스트림을 유지합니다.
            stream:
              previous.value.extRequest.request === extRequest.request
                ? previous.value.stream
                : undefined,
          };
        }
      },
    });

    this.effectRef = effect(this.loadEffect.bind(this), {
      injector,
      manualCleanup: true,
    });

    this.pendingTasks = injector.get(PendingTasks);

    // 리소스 자체가 파괴될 때 모든 보류 중인 요청을 취소합니다.
    injector.get(DestroyRef).onDestroy(() => this.destroy());
  }

  override readonly status = computed(() => projectStatusOfState(this.state()));

  override readonly error = computed(() => {
    const stream = this.state().stream?.();
    return stream && !isResolved(stream) ? stream.error : undefined;
  });

  /**
   * `WritableResource.set` 또는 `.value.set()`을 통해 직접 호출됩니다.
   */
  override set(value: T): void {
    if (this.destroyed) {
      return;
    }

    const current = untracked(this.value);
    const state = untracked(this.state);

    if (
      state.status === ResourceStatus.Local &&
      (this.equal ? this.equal(current, value) : current === value)
    ) {
      return;
    }

    // 사용자 정의 값으로 Local 상태에 진입합니다.
    this.state.set({
      extRequest: state.extRequest,
      status: ResourceStatus.Local,
      previousStatus: ResourceStatus.Local,
      stream: signal({value}),
    });

    // 리소스가 이전에 어떤 상태에 있었는지와 상관없이 떠나므로, 진행 중인 로드를 모두 취소합니다.
    this.abortInProgressLoad();
  }

  override reload(): boolean {
    // 진행 중인 로드를 다시 시작하고 싶지 않습니다.
    const {status} = untracked(this.state);
    if (status === ResourceStatus.Idle || status === ResourceStatus.Loading) {
      return false;
    }

    // 요청 reload를 증가시켜 `상태` 연결 신호를 `Reload`로 전환합니다.
    this.extRequest.update(({request, reload}) => ({request, reload: reload + 1}));
    return true;
  }

  destroy(): void {
    this.destroyed = true;
    this.effectRef.destroy();
    this.abortInProgressLoad();

    // 파괴된 리소스는 Idle 상태로 진입합니다.
    this.state.set({
      extRequest: {request: undefined, reload: 0},
      status: ResourceStatus.Idle,
      previousStatus: ResourceStatus.Idle,
      stream: undefined,
    });
  }

  private async loadEffect(): Promise<void> {
    const extRequest = this.extRequest();

    // 상태 전환 전에 이전 상태를 캡처합니다. 이는 여부를 추적하지 않으므로
    // 리소스의 상태에 영향을 받고 싶어하지 않습니다. 오직 요청에만 의존합니다.
    const {status: currentStatus, previousStatus} = untracked(this.state);

    if (extRequest.request === undefined) {
      // 로드할 내용이 없습니다(그리고 비로딩 상태여야 합니다).
      return;
    } else if (currentStatus !== ResourceStatus.Loading) {
      // 로딩 또는 재로드 상태에 있지 않으므로 이 로딩 요청은 오래되었습니다.
      return;
    }

    // 이전 로딩 시도를 취소합니다.
    this.abortInProgressLoad();

    // 여기서 _이_ 로드의 보류 중인 작업을 로컬 변수에 캡처하는 것이 중요합니다. 우리는 그것을 두 번 해결할 수 있습니다:
    //
    //  1. 로딩 함수의 약속이 해결/거부될 때
    //  2. 로딩 작업을 취소할 때
    //
    // 로딩 작업이 취소된 후, `this.resolvePendingTask`는 더 이상 이 특정 작업을 나타내지 않지만,
    // 이 `await`는 결국 해결/거부될 수 있습니다. 그러므로 아래 (1)에 대한 응답으로 취소할 때,
    // 로컬로 저장된 작업을 취소해야 합니다.
    let resolvePendingTask: (() => void) | undefined = (this.resolvePendingTask =
      this.pendingTasks.add());

    const {signal: abortSignal} = (this.pendingController = new AbortController());

    try {
      // 실제 로드는 `untracked`를 통해 실행됩니다 - 오직 요청 측면의 `resource`만
      // 반응적입니다. 이는 신호 추적과 비추적 간의 혼란을 피합니다.
      const stream = await untracked(() => {
        return this.loaderFn({
          request: extRequest.request as Exclude<R, undefined>,
          abortSignal,
          previous: {
            status: previousStatus,
          },
        });
      });

      // 이 요청이 취소되었거나, 현재 요청이 더 이상
      // 이 로드와 일치하지 않으면, 이 해제를 무시해야 합니다.
      if (abortSignal.aborted || untracked(this.extRequest) !== extRequest) {
        return;
      }

      this.state.set({
        extRequest,
        status: ResourceStatus.Resolved,
        previousStatus: ResourceStatus.Resolved,
        stream,
      });
    } catch (err) {
      if (abortSignal.aborted || untracked(this.extRequest) !== extRequest) {
        return;
      }

      this.state.set({
        extRequest,
        status: ResourceStatus.Resolved,
        previousStatus: ResourceStatus.Error,
        stream: signal({error: err}),
      });
    } finally {
      // 리소스에 값이 생기면 이제 보류 중인 작업을 해결합니다.
      resolvePendingTask?.();
      resolvePendingTask = undefined;
    }
  }

  private abortInProgressLoad(): void {
    untracked(() => this.pendingController?.abort());
    this.pendingController = undefined;

    // 로드가 취소된 후, 우리는 더 이상 해상도에서 안정성을 차단하고 싶지 않습니다.
    this.resolvePendingTask?.();
    this.resolvePendingTask = undefined;
  }
}

/**
 * 하나의 값이 `undefined`일 수 있는 평등 함수를 감싸는 기능입니다.
 */
function wrapEqualityFn<T>(equal: ValueEqualityFn<T>): ValueEqualityFn<T | undefined> {
  return (a, b) => (a === undefined || b === undefined ? a === b : equal(a, b));
}

function getLoader<T, R>(options: ResourceOptions<T, R>): ResourceStreamingLoader<T, R> {
  if (isStreamingResourceOptions(options)) {
    return options.stream;
  }

  return async (params) => {
    try {
      return signal({value: await options.loader(params)});
    } catch (err) {
      return signal({error: err});
    }
  };
}

function isStreamingResourceOptions<T, R>(
  options: ResourceOptions<T, R>,
): options is StreamingResourceOptions<T, R> {
  return !!(options as StreamingResourceOptions<T, R>).stream;
}

/**
 * `ResourceInternalStatus`가 있는 상태에서 사용자에 보이게 하는 `ResourceStatus`로 변환합니다.
 */
function projectStatusOfState(state: ResourceState<unknown>): ResourceStatus {
  switch (state.status) {
    case ResourceStatus.Loading:
      return state.extRequest.reload === 0 ? ResourceStatus.Loading : ResourceStatus.Reloading;
    case ResourceStatus.Resolved:
      return isResolved(untracked(state.stream!)) ? ResourceStatus.Resolved : ResourceStatus.Error;
    default:
      return state.status;
  }
}

function isResolved<T>(state: ResourceStreamItem<T>): state is {value: T} {
  return (state as {error: unknown}).error === undefined;
}
