/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isForwardRef, resolveForwardRef} from '../di/forward_ref';
import {Type} from '../interface/type';
import {flatten} from '../util/array_utils';
import {noSideEffects} from '../util/closure';
import {EMPTY_ARRAY} from '../util/empty';
import {getNgModuleDef} from './def_getters';

import {extractDefListOrFactory} from './definition';
import {depsTracker} from './deps_tracker/deps_tracker';
import {
  ComponentDef,
  ComponentType,
  NgModuleScopeInfoFromDecorator,
  RawScopeInfoFromDecorator,
} from './interfaces/definition';
import {isModuleWithProviders} from './jit/util';

/**
 * NgModules 옆에 생성되어 컴포넌트 정의에서 지시문 및 파이프 참조를 원숭이 패치하는 역할을 하며,
 * 이는 컴포넌트 파일에서 직접 참조를 생성할 때 임포트 사이클을 발생시킬 수 있습니다.
 *
 * 더 자세한 정보는 [이 설명](https://hackmd.io/Odw80D0pR6yfsOjg_7XCJg?view)을 참조하세요.
 *
 * @codeGenApi
 */
export function ɵɵsetComponentScope(
  type: ComponentType<any>,
  directives: Type<any>[] | (() => Type<any>[]),
  pipes: Type<any>[] | (() => Type<any>[]),
): void {
  const def = type.ɵcmp as ComponentDef<any>;
  def.directiveDefs = extractDefListOrFactory(directives, /* pipeDef */ false);
  def.pipeDefs = extractDefListOrFactory(pipes, /* pipeDef */ true);
}

/**
 * 기존 모듈 정의에 모듈의 전이 범위를 계산하는 데 필요한 모듈 메타데이터를 추가합니다.
 *
 * 모듈의 범위 메타데이터는 프로덕션 빌드에서 사용되지 않으므로 이 함수의 호출은
 * 순수한 것으로 표시되어 번들에서 제거될 수 있으며, 모든 참조된 선언이
 * 트리 샤킹의 자격을 갖게 됩니다.
 *
 * @codeGenApi
 */
export function ɵɵsetNgModuleScope(type: any, scope: NgModuleScopeInfoFromDecorator): unknown {
  return noSideEffects(() => {
    const ngModuleDef = getNgModuleDef(type, true);
    ngModuleDef.declarations = convertToTypeArray(scope.declarations || EMPTY_ARRAY);
    ngModuleDef.imports = convertToTypeArray(scope.imports || EMPTY_ARRAY);
    ngModuleDef.exports = convertToTypeArray(scope.exports || EMPTY_ARRAY);

    if (scope.bootstrap) {
      // 이것은 로컬 컴파일 모드에서만 발생합니다.
      ngModuleDef.bootstrap = convertToTypeArray(scope.bootstrap);
    }

    depsTracker.registerNgModule(type, scope);
  });
}

function convertToTypeArray(
  values: Type<any>[] | (() => Type<any>[]) | RawScopeInfoFromDecorator[],
): Type<any>[] | (() => Type<any>[]) {
  if (typeof values === 'function') {
    return values;
  }

  const flattenValues = flatten(values);

  if (flattenValues.some(isForwardRef)) {
    return () => flattenValues.map(resolveForwardRef).map(maybeUnwrapModuleWithProviders);
  } else {
    return flattenValues.map(maybeUnwrapModuleWithProviders);
  }
}

function maybeUnwrapModuleWithProviders(value: any): Type<any> {
  return isModuleWithProviders(value) ? value.ngModule : (value as Type<any>);
}
