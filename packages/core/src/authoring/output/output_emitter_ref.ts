/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer} from '@angular/core/primitives/signals';

import {inject} from '../../di/injector_compatibility';
import {ErrorHandler} from '../../error_handler';
import {formatRuntimeError, RuntimeError, RuntimeErrorCode} from '../../errors';
import {DestroyRef} from '../../linker/destroy_ref';

import {OutputRef, OutputRefSubscription} from './output_ref';

/**
 * `OutputEmitterRef`는 `output()` 함수에 의해 생성되며,
 * 지시어나 컴포넌트의 소비자에게 값을 방출하는 데 사용될 수 있습니다.
 *
 * 지시어/컴포넌트의 소비자는 출력을 바인딩하고
 * 바인딩된 이벤트 구문을 통해 변경 사항에 구독할 수 있습니다. 예를 들어:
 *
 * ```html
 * <my-comp (valueChange)="processNewValue($event)" />
 * ```
 *
 * @publicAPI
 */
export class OutputEmitterRef<T> implements OutputRef<T> {
  private destroyed = false;
  private listeners: Array<(value: T) => void> | null = null;
  private errorHandler = inject(ErrorHandler, {optional: true});

  /** @internal */
  destroyRef: DestroyRef = inject(DestroyRef);

  constructor() {
    // 파괴 시 모든 리스너를 정리하고 파괴됨으로 표시합니다.
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.listeners = null;
    });
  }

  subscribe(callback: (value: T) => void): OutputRefSubscription {
    if (this.destroyed) {
      throw new RuntimeError(
        RuntimeErrorCode.OUTPUT_REF_DESTROYED,
        ngDevMode &&
          '파괴된 `OutputRef`에 대한 예기치 않은 구독입니다. ' +
            '소유하는 지시어/컴포넌트가 파괴되었습니다.',
      );
    }

    (this.listeners ??= []).push(callback);

    return {
      unsubscribe: () => {
        const idx = this.listeners?.indexOf(callback);
        if (idx !== undefined && idx !== -1) {
          this.listeners?.splice(idx, 1);
        }
      },
    };
  }

  /** 출력을 위한 새 값을 방출합니다. */
  emit(value: T): void {
    if (this.destroyed) {
      console.warn(
        formatRuntimeError(
          RuntimeErrorCode.OUTPUT_REF_DESTROYED,
          ngDevMode &&
            '파괴된 `OutputRef`에 대한 예기치 않은 방출입니다. ' +
              '소유하는 지시어/컴포넌트가 파괴되었습니다.',
        ),
      );
      return;
    }

    if (this.listeners === null) {
      return;
    }

    const previousConsumer = setActiveConsumer(null);
    try {
      for (const listenerFn of this.listeners) {
        try {
          listenerFn(value);
        } catch (err: unknown) {
          this.errorHandler?.handleError(err);
        }
      }
    } finally {
      setActiveConsumer(previousConsumer);
    }
  }
}

/** 주어진 출력의 소유 `DestroyRef`를 가져옵니다. */
export function getOutputDestroyRef(ref: OutputRef<unknown>): DestroyRef | undefined {
  return ref.destroyRef;
}
