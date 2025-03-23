/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {resolveForwardRef} from '../../di';
import {assertInjectImplementationNotEqual} from '../../di/inject_switch';
import {ɵɵinject} from '../../di/injector_compatibility';
import {InternalInjectFlags} from '../../di/interface/injector';
import {ProviderToken} from '../../di/provider_token';
import {Type} from '../../interface/type';
import {emitInjectEvent} from '../debug/injector_profiler';
import {getOrCreateInjectable} from '../di';
import {TDirectiveHostNode} from '../interfaces/node';
import {getCurrentTNode, getLView} from '../state';

/**
 * 주어진 토큰과 연관된 값을 주입기에서 반환합니다.
 *
 * `directiveInject`는 디렉티브, 컴포넌트 및 파이프 팩토리를 위해 사용되도록 설계되었습니다.
 * 다른 모든 주입은 노드 주입기 트리를 걷지 않는 `inject`를 사용합니다.
 *
 * 사용 예제 (팩토리 함수 내):
 *
 * ```ts
 * class SomeDirective {
 *   constructor(directive: DirectiveA) {}
 *
 *   static ɵdir = ɵɵdefineDirective({
 *     type: SomeDirective,
 *     factory: () => new SomeDirective(ɵɵdirectiveInject(DirectiveA))
 *   });
 * }
 * ```
 * @param token 주입할 유형 또는 토큰
 * @param flags 주입 플래그
 * @returns 주입기에서의 값 또는 찾을 수 없는 경우 `null`
 *
 * @codeGenApi
 */
export function ɵɵdirectiveInject<T>(token: ProviderToken<T>): T;
export function ɵɵdirectiveInject<T>(token: ProviderToken<T>, flags: InternalInjectFlags): T;
export function ɵɵdirectiveInject<T>(
  token: ProviderToken<T>,
  flags = InternalInjectFlags.Default,
): T | null {
  const lView = getLView();
  // 뷰가 생성되지 않은 경우 inject()로 되돌립니다. 이 상황은 부트스트랩 전에 주입 유틸리티가 사용되면 테스트에서 발생할 수 있습니다.
  if (lView === null) {
    // 무한 루프에 빠지지 않을 것임을 확인합니다.
    ngDevMode && assertInjectImplementationNotEqual(ɵɵdirectiveInject);
    return ɵɵinject(token, flags);
  }
  const tNode = getCurrentTNode();
  const value = getOrCreateInjectable<T>(
    tNode as TDirectiveHostNode,
    lView,
    resolveForwardRef(token),
    flags,
  );
  ngDevMode && emitInjectEvent(token as Type<unknown>, value, flags);
  return value;
}

/**
 * 특정 클래스에 대해 컴파일러에 의해 팩토리 함수를 생성할 수 없음을 나타내는 오류를 발생시킵니다.
 *
 * 이 명령은 ngDevMode가 꺼져 있을 때 실제 오류 메시지가 최적화되도록 하여 생성된 코드의 바이트를 절약하면서도 개발 모드에서 좋은 경험을 제공합니다.
 *
 * 클래스의 이름은 여기에서 언급되지 않지만, 생성된 팩토리 함수 이름 및 스택 추적에 포함됩니다.
 *
 * @codeGenApi
 */
export function ɵɵinvalidFactory(): never {
  const msg = ngDevMode ? `이 생성자는 종속성 주입과 호환되지 않았습니다.` : '무효';
  throw new Error(msg);
}
