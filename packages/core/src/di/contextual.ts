/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {
  InjectorProfilerContext,
  setInjectorProfilerContext,
} from '../render3/debug/injector_profiler';

import {getInjectImplementation, setInjectImplementation} from './inject_switch';
import type {Injector} from './injector';
import {getCurrentInjector, setCurrentInjector, RetrievingInjector} from './injector_compatibility';
import {assertNotDestroyed, R3Injector} from './r3_injector';
import {Injector as PrimitivesInjector} from '@angular/core/primitives/di';

/**
 * 주어진 `Injector`의 [context](guide/di/dependency-injection-context)에서 주어진 함수를 실행합니다.
 *
 * 함수의 스택 프레임 내에서 [`inject`](api/core/inject)를 사용하여 주어진 `Injector`에서
 * 의존성을 주입할 수 있습니다. `inject`는 동기적으로만 사용할 수 있으며,
 * 비동기 콜백이나 `await` 포인트 이후에 사용할 수 없습니다.
 *
 * @param injector `fn`이 실행되는 동안 [`inject`](api/core/inject)를 만족할 injector
 * @param fn `injector`의 context에서 실행될 클로저
 * @returns 함수의 반환값, 있을 경우
 * @publicApi
 */
export function runInInjectionContext<ReturnT>(injector: Injector, fn: () => ReturnT): ReturnT {
  let internalInjector: PrimitivesInjector;
  if (injector instanceof R3Injector) {
    assertNotDestroyed(injector);
    internalInjector = injector;
  } else {
    internalInjector = new RetrievingInjector(injector);
  }

  let prevInjectorProfilerContext: InjectorProfilerContext;
  if (ngDevMode) {
    prevInjectorProfilerContext = setInjectorProfilerContext({injector, token: null});
  }
  const prevInjector = setCurrentInjector(internalInjector);
  const previousInjectImplementation = setInjectImplementation(undefined);
  try {
    return fn();
  } finally {
    setCurrentInjector(prevInjector);
    ngDevMode && setInjectorProfilerContext(prevInjectorProfilerContext!);
    setInjectImplementation(previousInjectImplementation);
  }
}

/**
 * 현재 스택 프레임이 주입 컨텍스트 내부인지 여부를 확인합니다.
 */
export function isInInjectionContext(): boolean {
  return getInjectImplementation() !== undefined || getCurrentInjector() != null;
}

/**
 * 현재 스택 프레임이 [주입 컨텍스트](guide/di/dependency-injection-context) 내에 있으며
 * `inject`에 접근할 수 있는지 확인합니다.
 *
 * @param debugFn assertion을 하는 함수에 대한 참조(오류 메시지에 사용).
 *
 * @publicApi
 */
export function assertInInjectionContext(debugFn: Function): void {
  // 여기서 `Function`을 문자열 이름 대신 사용하면 함수의 비축소된 이름이
  // 축소와 관계없이 번들에 유지되는 것을 방지합니다.
  if (!isInInjectionContext()) {
    throw new RuntimeError(
      RuntimeErrorCode.MISSING_INJECTION_CONTEXT,
      ngDevMode &&
        debugFn.name +
          '()는 생성자, 팩토리 함수, 필드 초기화기 또는 `runInInjectionContext`와 함께 사용되는 함수와 같은 주입 컨텍스트 내부에서만 사용할 수 있습니다.',
    );
  }
}
