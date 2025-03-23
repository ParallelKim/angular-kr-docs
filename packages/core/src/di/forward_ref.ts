/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {getClosureSafeProperty} from '../util/property';
import {stringify} from '../util/stringify';

/**
 * `forwardRef`에 전달된 함수가 구현해야 하는 인터페이스입니다.
 *
 * @usageNotes
 * ### 예제
 *
 * {@example core/di/ts/forward_ref/forward_ref_spec.ts region='forward_ref_fn'}
 * @publicApi
 */
export interface ForwardRefFn {
  (): any;
}

const __forward_ref__ = getClosureSafeProperty({__forward_ref__: getClosureSafeProperty});

/**
 * 정의되지 않은 참조를 참조할 수 있도록 허용합니다.
 *
 * 예를 들어, DI를 위해 참조해야 하는 `token`이 선언되었으나 아직 정의되지 않았을 때 `forwardRef`가 사용됩니다.
 * 또한 쿼리를 생성할 때 사용하는 `token`이 아직 정의되지 않았을 때도 사용됩니다.
 *
 * `forwardRef`는 독립형 구성 요소 가져오기에서 순환성을 끊는 데에도 사용됩니다.
 *
 * @usageNotes
 * ### 순환 의존성 예제
 * {@example core/di/ts/forward_ref/forward_ref_spec.ts region='forward_ref'}
 *
 * ### 순환 독립형 참조 가져오기 예제
 * ```angular-ts
 * @Component({
 *   standalone: true,
 *   imports: [ChildComponent],
 *   selector: 'app-parent',
 *   template: `<app-child [hideParent]="hideParent"></app-child>`,
 * })
 * export class ParentComponent {
 *   @Input() hideParent: boolean;
 * }
 *
 *
 * @Component({
 *   standalone: true,
 *   imports: [CommonModule, forwardRef(() => ParentComponent)],
 *   selector: 'app-child',
 *   template: `<app-parent *ngIf="!hideParent"></app-parent>`,
 * })
 * export class ChildComponent {
 *   @Input() hideParent: boolean;
 * }
 * ```
 *
 * @publicApi
 */
export function forwardRef(forwardRefFn: ForwardRefFn): Type<any> {
  (<any>forwardRefFn).__forward_ref__ = forwardRef;
  (<any>forwardRefFn).toString = function () {
    return stringify(this());
  };
  return <Type<any>>(<any>forwardRefFn);
}

/**
 * forwardRef에서 참조 값을 지연 검색합니다.
 *
 * 비forward-ref 값이 주어지면 항등 함수로 작용합니다.
 *
 * @usageNotes
 * ### 예제
 *
 * {@example core/di/ts/forward_ref/forward_ref_spec.ts region='resolve_forward_ref'}
 *
 * @see {@link forwardRef}
 * @publicApi
 */
export function resolveForwardRef<T>(type: T): T {
  return isForwardRef(type) ? type() : type;
}

/** 함수가 `forwardRef`에 의해 래핑되었는지 확인합니다. */
export function isForwardRef(fn: any): fn is () => any {
  return (
    typeof fn === 'function' &&
    fn.hasOwnProperty(__forward_ref__) &&
    fn.__forward_ref__ === forwardRef
  );
}
