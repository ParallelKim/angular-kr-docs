/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ComponentDef, DirectiveDef} from '../interfaces/definition';
import {isComponentDef} from '../interfaces/type_checks';

import {getSuperType} from './inherit_definition_feature';

/**
 * 지시어 또는 구성 요소 정의에 존재하는 필드이며 `ɵɵCopyDefinitionFeature`에 의해 부모
 * 클래스에서 자식 클래스으로 복사되어야 합니다.
 */
const COPY_DIRECTIVE_FIELDS: (keyof DirectiveDef<unknown>)[] = [
  // 자식 클래스는 부모의 제공자를 사용해야 합니다.
  'providersResolver',

  // 여기에 나열되지 않은 필드는 `ɵɵInheritDefinitionFeature`에 의해 처리되는 필드이며,
  // 입력, 출력 및 호스트 바인딩 함수와 같은 것들이 포함됩니다.
];

/**
 * 구성 요소 정의에만 존재하는 필드이며 `ɵɵCopyDefinitionFeature`에 의해 부모 클래스에서 자식
 * 클래스으로 복사되어야 합니다.
 *
 * 여기서의 타입은 `DirectiveDef`의 속성이 아닌 `ComponentDef`의 모든 필드를 허용합니다.
 * 이는 위의 `COPY_DIRECTIVE_FIELDS`에 포함되어야 합니다.
 */
const COPY_COMPONENT_FIELDS: Exclude<keyof ComponentDef<unknown>, keyof DirectiveDef<unknown>>[] = [
  // 자식 클래스는 부모의 템플릿 함수와 모든 템플릿 구문을 사용해야 합니다.
  'template',
  'decls',
  'consts',
  'vars',
  'onPush',
  'ngContentSelectors',

  // 자식 클래스는 부모의 CSS 스타일과 모든 스타일링 구문을 사용해야 합니다.
  'styles',
  'encapsulation',

  // 자식 클래스는 부모와 동일한 방식으로 런타임에서 검사되어야 합니다.
  'schemas',
];

/**
 * 정의의 상위 유형에서 `ɵɵInheritDefinitionFeature`에 의해 처리되지 않는 필드를 복사합니다.
 *
 * 이 기능은 주로 부모에서 자식 클래스로 전체 데코레이터가 상속되는 기존 View Engine 패턴의
 * ngcc 마이그레이션을 지원하기 위해 존재합니다. ngcc가 이 경우를 감지하면 자식 클래스에서
 * 스켈레톤 정의를 생성하고 이 기능을 적용합니다.
 *
 * 이후 `ɵɵCopyDefinitionFeature`가 부모 클래스 정의에서 필요한 필드를 복사하며,
 * 구성 요소 템플릿 함수와 같은 것들을 포함합니다.
 *
 * @param definition 자신의 정의가 있는 부모 클래스에서 상속되는 자식 클래스의 정의입니다.
 *
 * @codeGenApi
 */
export function ɵɵCopyDefinitionFeature(definition: DirectiveDef<any> | ComponentDef<any>): void {
  let superType = getSuperType(definition.type)!;

  let superDef: DirectiveDef<any> | ComponentDef<any> | undefined = undefined;
  if (isComponentDef(definition)) {
    // getComponentDef/getDirectiveDef를 사용하지 마세요. 이 로직은 상속에 의존합니다.
    superDef = superType.ɵcmp!;
  } else {
    // getComponentDef/getDirectiveDef를 사용하지 마세요. 이 로직은 상속에 의존합니다.
    superDef = superType.ɵdir!;
  }

  // `definition` 필드는 읽기 전용이기 때문에 필요합니다.
  const defAny = definition as any;

  // 지시어 또는 구성 요소에 적용되는 모든 필드를 복사합니다.
  for (const field of COPY_DIRECTIVE_FIELDS) {
    defAny[field] = superDef[field];
  }

  if (isComponentDef(superDef)) {
    // 구성 요소에 특정 필드를 복사합니다.
    for (const field of COPY_COMPONENT_FIELDS) {
      defAny[field] = superDef[field];
    }
  }
}
