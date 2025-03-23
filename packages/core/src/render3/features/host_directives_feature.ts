/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {resolveForwardRef} from '../../di';
import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {assertEqual} from '../../util/assert';
import {EMPTY_OBJ} from '../../util/empty';
import {getComponentDef, getDirectiveDef} from '../def_getters';
import {isComponentDef} from '../interfaces/type_checks';
import type {
  DirectiveDef,
  DirectiveDefFeature,
  HostDirectiveBindingMap,
  HostDirectiveConfig,
  HostDirectiveDef,
  HostDirectiveDefs,
  HostDirectiveRanges,
  HostDirectiveResolution,
} from '../interfaces/definition';

/**
 * 이 기능은 호스트 지시자의 동작을 지시자 정의에 추가하여
 * 이에 함수를 패치합니다. 런타임에서 지시자를 매칭하는 동안
 * 함수가 호출될 것으로 예상됩니다.
 *
 * 예를 들어:
 * ```ts
 * class ComponentWithHostDirective {
 *   static ɵcmp = defineComponent({
 *    type: ComponentWithHostDirective,
 *    features: [ɵɵHostDirectivesFeature([
 *      SimpleHostDirective,
 *      {directive: AdvancedHostDirective, inputs: ['foo: alias'], outputs: ['bar']},
 *    ])]
 *  });
 * }
 * ```
 *
 * @codeGenApi
 */
export function ɵɵHostDirectivesFeature(
  rawHostDirectives: HostDirectiveConfig[] | (() => HostDirectiveConfig[]),
) {
  const feature: DirectiveDefFeature = (definition: DirectiveDef<unknown>) => {
    const isEager = Array.isArray(rawHostDirectives);

    if (definition.hostDirectives === null) {
      definition.resolveHostDirectives = resolveHostDirectives;
      definition.hostDirectives = isEager
        ? rawHostDirectives.map(createHostDirectiveDef)
        : [rawHostDirectives];
    } else if (isEager) {
      definition.hostDirectives.unshift(...rawHostDirectives.map(createHostDirectiveDef));
    } else {
      definition.hostDirectives.unshift(rawHostDirectives);
    }
  };
  feature.ngInherit = true;
  return feature;
}

/**
 * 호스트 지시자를 활성화하기 위해 정의에 패치될 함수입니다.
 * 이 함수는 지시자 매칭 중에 한 번 호출되며 모든 정의에 대해 동일합니다.
 * @param matches 선택자 매칭을 통해 해결된 지시자들.
 */
function resolveHostDirectives(matches: DirectiveDef<unknown>[]): HostDirectiveResolution {
  const allDirectiveDefs: DirectiveDef<unknown>[] = [];
  let hasComponent = false;
  let hostDirectiveDefs: HostDirectiveDefs | null = null;
  let hostDirectiveRanges: HostDirectiveRanges | null = null;

  // 구성 요소는 매칭 배열의 앞쪽에 삽입되어 생명 주기
  // 후크가 모든 지시자 생명 주기 후크 이전에 실행되도록 합니다.
  // 이는 ViewEngine 호환성을 위한 것으로 보입니다.
  // 이 로직은 호스트 지시자와는 잘 맞지 않으며
  // 호스트가 수행했을 수 있는 오버라이드를 호스트 지시자가 해제할 수 있게 합니다.
  // 이 경우를 처리하기 위해 구성 요소의 호스트 지시자는 배열의 시작 부분에 삽입되고
  // 그 다음에 구성 요소가 옵니다. 따라서 삽입 순서는 다음과 같습니다:
  // 1. 선택자와 일치하는 구성 요소에 소속된 호스트 지시자.
  // 2. 선택자와 일치하는 구성 요소.
  // 3. 선택자와 일치하는 지시자에 소속된 호스트 지시자.
  // 4. 선택자와 일치하는 지시자.
  for (let i = 0; i < matches.length; i++) {
    const def = matches[i];

    if (def.hostDirectives !== null) {
      const start = allDirectiveDefs.length;

      hostDirectiveDefs ??= new Map();
      hostDirectiveRanges ??= new Map();

      // TODO(pk): 아마도 배열을 채우기 위해 매칭을 반환할 수 있을 것입니다?
      findHostDirectiveDefs(def, allDirectiveDefs, hostDirectiveDefs);

      // 이 인덱스는 `directiveStart`에 의해 오프셋되어 있습니다.
      // 여기서 오프셋할 수는 없으며 `directiveStart`는
      // TNode에서 아직 초기화되지 않았기 때문입니다.
      hostDirectiveRanges.set(def, [start, allDirectiveDefs.length - 1]);
    }

    // 구성 요소 정의는 항상 첫 번째여야 하며
    // 올바른 순서를 유지하기 위해 빨리 푸시해야 합니다.
    if (i === 0 && isComponentDef(def)) {
      hasComponent = true;
      allDirectiveDefs.push(def);
    }
  }

  for (let i = hasComponent ? 1 : 0; i < matches.length; i++) {
    allDirectiveDefs.push(matches[i]);
  }

  return [allDirectiveDefs, hostDirectiveDefs, hostDirectiveRanges];
}

function findHostDirectiveDefs(
  currentDef: DirectiveDef<unknown>,
  matchedDefs: DirectiveDef<unknown>[],
  hostDirectiveDefs: HostDirectiveDefs,
): void {
  if (currentDef.hostDirectives !== null) {
    for (const configOrFn of currentDef.hostDirectives) {
      if (typeof configOrFn === 'function') {
        const resolved = configOrFn();
        for (const config of resolved) {
          trackHostDirectiveDef(createHostDirectiveDef(config), matchedDefs, hostDirectiveDefs);
        }
      } else {
        trackHostDirectiveDef(configOrFn, matchedDefs, hostDirectiveDefs);
      }
    }
  }
}

/** 지시자 매칭 중 단일 호스트 지시자를 추적합니다. */
function trackHostDirectiveDef(
  def: HostDirectiveDef,
  matchedDefs: DirectiveDef<unknown>[],
  hostDirectiveDefs: HostDirectiveDefs,
) {
  const hostDirectiveDef = getDirectiveDef(def.directive)!;

  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    validateHostDirective(def, hostDirectiveDef);
  }

  // `ngOnChanges`가 속성을 올바르게 매핑할 수 있도록
  // `declaredInputs`를 패치해야 합니다.
  patchDeclaredInputs(hostDirectiveDef.declaredInputs, def.inputs);

  // 호스트 지시자는 호스트 전에 실행되므로
  // 호스트 바인딩을 덮어쓸 수 있습니다.
  findHostDirectiveDefs(hostDirectiveDef, matchedDefs, hostDirectiveDefs);
  hostDirectiveDefs.set(hostDirectiveDef, def);
  matchedDefs.push(hostDirectiveDef);
}

/** 사용자 정의 호스트 지시자 구성에서 `HostDirectiveDef`를 생성합니다. */
function createHostDirectiveDef(config: HostDirectiveConfig): HostDirectiveDef {
  return typeof config === 'function'
    ? {directive: resolveForwardRef(config), inputs: EMPTY_OBJ, outputs: EMPTY_OBJ}
    : {
        directive: resolveForwardRef(config.directive),
        inputs: bindingArrayToMap(config.inputs),
        outputs: bindingArrayToMap(config.outputs),
      };
}

/**
 * `'publicName', 'alias', 'otherPublicName', 'otherAlias'` 형식의 배열을
 * `{publicName: 'alias', otherPublicName: 'otherAlias'}` 형식의 맵으로 변환합니다.
 */
function bindingArrayToMap(bindings: string[] | undefined): HostDirectiveBindingMap {
  if (bindings === undefined || bindings.length === 0) {
    return EMPTY_OBJ;
  }

  const result: HostDirectiveBindingMap = {};

  for (let i = 0; i < bindings.length; i += 2) {
    result[bindings[i]] = bindings[i + 1];
  }

  return result;
}

/**
 * `ngOnChanges`에는 일부 남은 레거시 ViewEngine 동작이 존재하여
 * `SimpleChanges` 이벤트 내의 키는 입력의 *정의된* 이름을 가리키며
 * 공개 이름이나 축소된 이름이 아닙니다.
 * 예를 들어 `@Input('alias') foo: string`에서
 * `SimpleChanges` 객체의 이름은 항상 `foo`입니다.
 * `alias` 또는 속성 축소를 사용하는 앱에서 `foo`의 축소된 이름이 아닙니다.
 *
 * 이는 정의가 선언될 때 생성되는 `DirectiveDef.declaredInputs` 맵을 통해 달성됩니다.
 * 속성이 지시자 인스턴스에 작성될 때 `NgOnChangesFeature`는
 * 작성되고 있는 속성 이름을 `declaredInputs`를 사용하여 재매핑하려고 합니다.
 *
 * 호스트 지시자 입력 재매핑은 지시자 매칭 중에 발생하므로
 * `declaredInputs`에는 입력이 사용 가능한 새로운 별명이 포함되지 않습니다.
 * 이 함수는 호스트 지시자 별명을 `declaredInputs`에 패치하여
 * 문제를 해결합니다. 이 패치로 인해 호스트 지시자에
 * 새로운 입력이 우연히 도입될 위험이 없습니다.
 * 왜냐하면 `declaredInputs`는 입력이 존재하지 않는 경우에
 * 도달하지 않는 `SimpleChanges` 객체의 어떤 이름이 사용되는지를 결정하기 위해
 * 오직 `NgOnChangesFeature`에 의해 사용되기 때문입니다.
 */
function patchDeclaredInputs(
  declaredInputs: Record<string, string>,
  exposedInputs: HostDirectiveBindingMap,
): void {
  for (const publicName in exposedInputs) {
    if (exposedInputs.hasOwnProperty(publicName)) {
      const remappedPublicName = exposedInputs[publicName];
      const privateName = declaredInputs[publicName];

      // 우리가 여러 개의 속성에 대해 동일한 입력을 가질 수 없으므로
      // 기술적으로는 이 상황에 부딪힐 수 없습니다.
      // `validateMappings`에서 충돌하는 별명에 대한 검증이 있기 때문입니다.
      // 만약 그랬다면, 잘못된 이름으로 `ngOnChanges`가 호출되도록
      // 이어질 것입니다. 따라서 만일에 대비해 비사용자 친화적인
      // 단정문이 있습니다.
      if (
        (typeof ngDevMode === 'undefined' || ngDevMode) &&
        declaredInputs.hasOwnProperty(remappedPublicName)
      ) {
        assertEqual(
          declaredInputs[remappedPublicName],
          declaredInputs[publicName],
          `충돌하는 호스트 지시자 입력 별명 ${publicName}.`,
        );
      }

      declaredInputs[remappedPublicName] = privateName;
    }
  }
}

/**
 * 호스트 지시자가 올바르게 구성되었는지 확인합니다.
 * @param hostDirectiveConfig 호스트 지시자 구성 객체.
 * @param directiveDef 호스트 지시자의 지시자 정의.
 */
function validateHostDirective(
  hostDirectiveConfig: HostDirectiveDef<unknown>,
  directiveDef: DirectiveDef<any> | null,
): asserts directiveDef is DirectiveDef<unknown> {
  const type = hostDirectiveConfig.directive;

  if (directiveDef === null) {
    if (getComponentDef(type) !== null) {
      throw new RuntimeError(
        RuntimeErrorCode.HOST_DIRECTIVE_COMPONENT,
        `호스트 지시자 ${type.name}는 구성 요소일 수 없습니다.`,
      );
    }

    throw new RuntimeError(
      RuntimeErrorCode.HOST_DIRECTIVE_UNRESOLVABLE,
      `호스트 지시자 ${type.name}의 메타데이터를 해결할 수 없습니다. ` +
        `${type.name} 클래스에 @Directive 데코레이터가 주석으로 추가되어 있는지 확인하세요.`,
    );
  }

  if (!directiveDef.standalone) {
    throw new RuntimeError(
      RuntimeErrorCode.HOST_DIRECTIVE_NOT_STANDALONE,
      `호스트 지시자 ${directiveDef.type.name}는 독립형이어야 합니다.`,
    );
  }

  validateMappings('input', directiveDef, hostDirectiveConfig.inputs);
  validateMappings('output', directiveDef, hostDirectiveConfig.outputs);
}

/**
 * 호스트 지시자의 입력/출력 구성이 유효한지 확인합니다.
 * @param bindingType 검증되는 바인딩의 종류. 오류 메시지에 사용됩니다.
 * @param def 검증되는 호스트 지시자의 정의.
 * @param hostDirectiveBindings 검증되어야 하는 호스트 지시자 매핑 객체.
 */
function validateMappings<T>(
  bindingType: 'input' | 'output',
  def: DirectiveDef<T>,
  hostDirectiveBindings: HostDirectiveBindingMap,
) {
  const className = def.type.name;
  const bindings = bindingType === 'input' ? def.inputs : def.outputs;

  for (const publicName in hostDirectiveBindings) {
    if (hostDirectiveBindings.hasOwnProperty(publicName)) {
      if (!bindings.hasOwnProperty(publicName)) {
        throw new RuntimeError(
          RuntimeErrorCode.HOST_DIRECTIVE_UNDEFINED_BINDING,
          `지시자 ${className}는 공개 이름이 ${publicName}인 ${bindingType}을 가지고 있지 않습니다.`,
        );
      }

      const remappedPublicName = hostDirectiveBindings[publicName];

      if (bindings.hasOwnProperty(remappedPublicName) && remappedPublicName !== publicName) {
        throw new RuntimeError(
          RuntimeErrorCode.HOST_DIRECTIVE_CONFLICTING_ALIAS,
          `호스트 지시자 ${className}의 ${publicName} ${bindingType} 별명을 ${remappedPublicName}로 지정할 수 없습니다. 
          이미 동일한 공개 이름을 가진 다른 ${bindingType}이 있습니다.`,
        );
      }
    }
  }
}
