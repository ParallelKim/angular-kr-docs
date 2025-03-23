/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {resolveForwardRef} from '../forward_ref';
import {ɵɵinject, ɵɵinvalidFactoryDep} from '../injector_compatibility';
import {ɵɵdefineInjectable, ɵɵdefineInjector} from '../interface/defs';

/**
 * 생성된 표현식에서 사용되는 @angular/core API 표면의 실제 기호에 대한 매핑입니다.
 *
 * 이는 @angular/core의 공개 내보내기와 함께 최신 상태로 유지되어야 합니다.
 */
export const angularCoreDiEnv: {[name: string]: Function} = {
  'ɵɵdefineInjectable': ɵɵdefineInjectable,
  'ɵɵdefineInjector': ɵɵdefineInjector,
  'ɵɵinject': ɵɵinject,
  'ɵɵinvalidFactoryDep': ɵɵinvalidFactoryDep,
  'resolveForwardRef': resolveForwardRef,
};
