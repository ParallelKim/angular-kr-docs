/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {Type, Writable} from '../../interface/type';
import {EMPTY_ARRAY, EMPTY_OBJ} from '../../util/empty';
import {fillProperties} from '../../util/property';
import {
  ComponentDef,
  ContentQueriesFunction,
  DirectiveDef,
  DirectiveDefFeature,
  HostBindingsFunction,
  RenderFlags,
  ViewQueriesFunction,
} from '../interfaces/definition';
import {TAttributes} from '../interfaces/node';
import {isComponentDef} from '../interfaces/type_checks';
import {mergeHostAttrs} from '../util/attrs_utils';
import {stringifyForError} from '../util/stringify_utils';

export function getSuperType(
  type: Type<any>,
): Type<any> & {ɵcmp?: ComponentDef<any>; ɵdir?: DirectiveDef<any>} {
  return Object.getPrototypeOf(type.prototype).constructor;
}

type WritableDef = Writable<DirectiveDef<any> | ComponentDef<any>>;

/**
 * 슈퍼 클래스로부터 서브 클래스로 정의를 병합합니다.
 * @param definition 다른 지시어 또는 컴포넌트의 서브 클래스인 정의
 *
 * @codeGenApi
 */
export function ɵɵInheritDefinitionFeature(
  definition: DirectiveDef<any> | ComponentDef<any>,
): void {
  let superType = getSuperType(definition.type);
  let shouldInheritFields = true;
  const inheritanceChain: WritableDef[] = [definition];

  while (superType) {
    let superDef: DirectiveDef<any> | ComponentDef<any> | undefined = undefined;
    if (isComponentDef(definition)) {
      // getComponentDef/getDirectiveDef를 사용하지 마세요. 이 로직은 상속에 의존합니다.
      superDef = superType.ɵcmp || superType.ɵdir;
    } else {
      if (superType.ɵcmp) {
        throw new RuntimeError(
          RuntimeErrorCode.INVALID_INHERITANCE,
          ngDevMode &&
            `지시어는 컴포넌트를 상속할 수 없습니다. 지시어 ${stringifyForError(
              definition.type,
            )}가 컴포넌트 ${stringifyForError(superType)}를 확장하려고 합니다.`,
        );
      }
      // getComponentDef/getDirectiveDef를 사용하지 마세요. 이 로직은 상속에 의존합니다.
      superDef = superType.ɵdir;
    }

    if (superDef) {
      if (shouldInheritFields) {
        inheritanceChain.push(superDef);
        // 정의의 어떤 필드는 비어 있을 수 있습니다. 비어 있는 경우
        // 객체 생성이 정당화되지 않았습니다. 필요시 해제하십시오.
        const writeableDef = definition as WritableDef;
        writeableDef.inputs = maybeUnwrapEmpty(definition.inputs);
        writeableDef.declaredInputs = maybeUnwrapEmpty(definition.declaredInputs);
        writeableDef.outputs = maybeUnwrapEmpty(definition.outputs);

        // hostBindings 병합
        const superHostBindings = superDef.hostBindings;
        superHostBindings && inheritHostBindings(definition, superHostBindings);

        // 쿼리 병합
        const superViewQuery = superDef.viewQuery;
        const superContentQueries = superDef.contentQueries;
        superViewQuery && inheritViewQuery(definition, superViewQuery);
        superContentQueries && inheritContentQueries(definition, superContentQueries);

        // 입력 및 출력 병합
        mergeInputsWithTransforms(definition, superDef);
        fillProperties(definition.outputs, superDef.outputs);

        // 애니메이션 메타데이터 병합.
        // `superDef`이 컴포넌트인 경우 `data` 필드가 존재합니다 (기본값은 빈 객체).
        if (isComponentDef(superDef) && superDef.data.animation) {
          // super def가 컴포넌트인 경우, `definition`도 컴포넌트입니다. 지시어는
          // 컴포넌트를 상속할 수 없으므로 (위에서 오류를 발생시키며 이 코드에 도달할 수 없습니다).
          const defData = (definition as ComponentDef<any>).data;
          defData.animation = (defData.animation || []).concat(superDef.data.animation);
        }
      }

      // 부모 기능 실행
      const features = superDef.features;
      if (features) {
        for (let i = 0; i < features.length; i++) {
          const feature = features[i];
          if (feature && feature.ngInherit) {
            (feature as DirectiveDefFeature)(definition);
          }
          // `InheritDefinitionFeature`가 현재 `superDef`의 일부라면, 이
          // def는 이미 상위 클래스에서 상속된 필요한 모든 정보를 가집니다. 따라서
          // 슈퍼 클래스의 필드에서 더 이상 병합할 필요가 없습니다. 그러나
          // 원래 `definition`에 대해 호출해야 하는 다른 "features"가 포함되어 있을 수 있는
          // 클래스를 찾기 위해 프로토타입 체인을 반복해야 합니다.
          // 우리는 필드 상속 논리를 건너뛰고 "features" 목록에서 함수만 호출하는 것을
          // 나타내기 위해 `shouldInheritFields` 플래그를 설정합니다.
          if (feature === ɵɵInheritDefinitionFeature) {
            shouldInheritFields = false;
          }
        }
      }
    }

    superType = Object.getPrototypeOf(superType);
  }
  mergeHostAttrsAcrossInheritance(inheritanceChain);
}

function mergeInputsWithTransforms<T>(target: WritableDef, source: DirectiveDef<any>) {
  for (const key in source.inputs) {
    if (!source.inputs.hasOwnProperty(key)) {
      continue;
    }
    if (target.inputs.hasOwnProperty(key)) {
      continue;
    }

    const value = source.inputs[key];

    if (value !== undefined) {
      target.inputs[key] = value;
      target.declaredInputs[key] = source.declaredInputs[key];
    }
  }
}

/**
 * 상속된 부모로부터 `hostAttrs`와 `hostVars`를 기본 클래스에 병합합니다.
 *
 * @param inheritanceChain 가장 상위 타입에서 시작하여 서브 타입을 순서대로 나열하는
 * `WritableDefs` 목록. 각 타입에 대해 `hostAttrs`와 `hostVars`를 취합하여 자식
 * 타입과 병합합니다.
 */
function mergeHostAttrsAcrossInheritance(inheritanceChain: WritableDef[]) {
  let hostVars: number = 0;
  let hostAttrs: TAttributes | null = null;
  // 여기에 베이스에서 리프까지 상속 순서를 처리합니다.
  for (let i = inheritanceChain.length - 1; i >= 0; i--) {
    const def = inheritanceChain[i];
    // 각 `hostVars`에 대해 슈퍼클래스 양을 추가해야 합니다.
    def.hostVars = hostVars += def.hostVars;
    // 각 `hostAttrs`에 대해 슈퍼클래스와 병합해야 합니다.
    def.hostAttrs = mergeHostAttrs(
      def.hostAttrs,
      (hostAttrs = mergeHostAttrs(hostAttrs, def.hostAttrs)),
    );
  }
}

function maybeUnwrapEmpty<T>(value: T[]): T[];
function maybeUnwrapEmpty<T>(value: T): T;
function maybeUnwrapEmpty(value: any): any {
  if (value === EMPTY_OBJ) {
    return {};
  } else if (value === EMPTY_ARRAY) {
    return [];
  } else {
    return value;
  }
}

function inheritViewQuery(definition: WritableDef, superViewQuery: ViewQueriesFunction<any>) {
  const prevViewQuery = definition.viewQuery;
  if (prevViewQuery) {
    definition.viewQuery = (rf, ctx) => {
      superViewQuery(rf, ctx);
      prevViewQuery(rf, ctx);
    };
  } else {
    definition.viewQuery = superViewQuery;
  }
}

function inheritContentQueries(
  definition: WritableDef,
  superContentQueries: ContentQueriesFunction<any>,
) {
  const prevContentQueries = definition.contentQueries;
  if (prevContentQueries) {
    definition.contentQueries = (rf, ctx, directiveIndex) => {
      superContentQueries(rf, ctx, directiveIndex);
      prevContentQueries(rf, ctx, directiveIndex);
    };
  } else {
    definition.contentQueries = superContentQueries;
  }
}

function inheritHostBindings(
  definition: WritableDef,
  superHostBindings: HostBindingsFunction<any>,
) {
  const prevHostBindings = definition.hostBindings;
  if (prevHostBindings) {
    definition.hostBindings = (rf: RenderFlags, ctx: any) => {
      superHostBindings(rf, ctx);
      prevHostBindings(rf, ctx);
    };
  } else {
    definition.hostBindings = superHostBindings;
  }
}
