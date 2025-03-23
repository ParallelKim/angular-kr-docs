/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {formatRuntimeError, RuntimeError, RuntimeErrorCode} from '../../errors';
import {Type} from '../../interface/type';
import {CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, SchemaMetadata} from '../../metadata/schema';
import {throwError} from '../../util/assert';
import {getComponentDef} from '../def_getters';
import {ComponentDef} from '../interfaces/definition';
import {TNodeType} from '../interfaces/node';
import {RComment, RElement} from '../interfaces/renderer_dom';
import {CONTEXT, DECLARATION_COMPONENT_VIEW, LView} from '../interfaces/view';
import {isAnimationProp} from '../util/attrs_utils';

let shouldThrowErrorOnUnknownElement = false;

/**
 * JIT 컴파일된 컴포넌트의 엄격 모드를 설정하여 알 수 없는 요소에서
 * 오류를 발생시키도록 합니다. 단순히 오류를 기록하는 것이 아니라
 * (AOT 컴파일된 경우 이 검사는 빌드 시 발생합니다).
 */
export function ɵsetUnknownElementStrictMode(shouldThrow: boolean) {
  shouldThrowErrorOnUnknownElement = shouldThrow;
}

/**
 * 현재 엄격 모드 값을 가져옵니다.
 */
export function ɵgetUnknownElementStrictMode() {
  return shouldThrowErrorOnUnknownElement;
}

let shouldThrowErrorOnUnknownProperty = false;

/**
 * JIT 컴파일된 컴포넌트의 엄격 모드를 설정하여 알 수 없는 속성에서
 * 오류를 발생시키도록 합니다. 단순히 오류를 기록하는 것이 아니라
 * (AOT 컴파일된 경우 이 검사는 빌드 시 발생합니다).
 */
export function ɵsetUnknownPropertyStrictMode(shouldThrow: boolean) {
  shouldThrowErrorOnUnknownProperty = shouldThrow;
}

/**
 * 현재 엄격 모드 값을 가져옵니다.
 */
export function ɵgetUnknownPropertyStrictMode() {
  return shouldThrowErrorOnUnknownProperty;
}

/**
 * 요소가 런타임에 알려진 것인지 확인하고
 * 그렇지 않은 경우 오류를 발생시킵니다.
 * 이 검사는 JIT 컴파일된 컴포넌트에 관련이 있습니다
 * (AOT 컴파일된 경우 이 검사는 빌드 시 발생합니다).
 *
 * 요소가 알려진 것으로 간주되는 경우:
 * - 알려진 HTML 요소인 경우
 * - 알려진 커스텀 요소인 경우
 * - 그 요소가 어떤 지시어와 일치하는 경우
 * - 그 요소가 스키마 중 하나에 의해 허용된 경우
 *
 * @param element 검증할 요소
 * @param lView 렌더링되고 있는 현재 컴포넌트를 나타내는 `LView`
 * @param tagName 확인할 태그 이름
 * @param schemas 스키마 배열
 * @param hasDirectives 요소가 어떤 지시어와 일치하는지를 나타내는 부울
 */
export function validateElementIsKnown(
  element: RElement,
  lView: LView,
  tagName: string | null,
  schemas: SchemaMetadata[] | null,
  hasDirectives: boolean,
): void {
  // 만약 `schemas`가 `null`로 설정되면, 이는 이 컴포넌트가 AOT 모드에서 컴파일되었다는 것을 나타냅니다.
  // 이 경우 이 검사는 컴파일 시 발생합니다. JIT 모드에서는 `schemas`가 항상 존재하며
  // 배열로 정의됩니다 (정의되지 않은 경우 빈 배열로).
  if (schemas === null) return;

  // 요소가 어떤 지시어와 일치하면 유효한 것으로 간주됩니다.
  if (!hasDirectives && tagName !== null) {
    // 요소가 HTMLUnknownElement의 인스턴스이거나 커스텀 요소로 등록되지 않으면 알 수 없는 요소입니다.
    // 이름에 대시가 포함된 알 수 없는 요소는 웹 컴포넌트를 지원하는 브라우저에서
    // HTMLUnknownElement의 인스턴스가 아닙니다.
    const isUnknown =
      // `typeof HTMLUnknownElement === 'function'`을 체크할 수 없는 이유는
      // Domino가 HTMLUnknownElement를 전역적으로 노출하지 않기 때문입니다.
      (typeof HTMLUnknownElement !== 'undefined' &&
        HTMLUnknownElement &&
        element instanceof HTMLUnknownElement) ||
      (typeof customElements !== 'undefined' &&
        tagName.indexOf('-') > -1 &&
        !customElements.get(tagName));

    if (isUnknown && !matchingSchemas(schemas, tagName)) {
      const isHostStandalone = isHostComponentStandalone(lView);
      const templateLocation = getTemplateLocationDetails(lView);
      const schemas = `'${isHostStandalone ? '@Component' : '@NgModule'}.schemas'`;

      let message = `'${tagName}'는 알려진 요소가 아닙니다${templateLocation}:\n`;
      message += `1. '${tagName}'가 Angular 컴포넌트라면, 그것이 ${
        isHostStandalone
          ? "'@Component.imports'에 포함되어 있는지 확인하세요."
          : '@NgModule의 일부로 선언되어 있는지 확인하세요.'
      }.\n`;
      if (tagName && tagName.indexOf('-') > -1) {
        message += `2. '${tagName}'가 웹 컴포넌트라면, 이 메시지를 억제하기 위해 이 컴포넌트의 ${schemas}에 'CUSTOM_ELEMENTS_SCHEMA'를 추가하세요.`;
      } else {
        message += `2. 모든 요소를 허용하려면 이 컴포넌트의 ${schemas}에 'NO_ERRORS_SCHEMA'를 추가하세요.`;
      }
      if (shouldThrowErrorOnUnknownElement) {
        throw new RuntimeError(RuntimeErrorCode.UNKNOWN_ELEMENT, message);
      } else {
        console.error(formatRuntimeError(RuntimeErrorCode.UNKNOWN_ELEMENT, message));
      }
    }
  }
}

/**
 * 요소의 속성이 런타임에 알려진 것인지 확인하고
 * 그렇지 않으면 false를 반환합니다.
 * 이 검사는 JIT 컴파일된 컴포넌트에 관련이 있습니다
 * (AOT 컴파일된 경우 이 검사는 빌드 시 발생합니다).
 *
 * 속성이 알려진 것으로 간주되는 경우:
 * - 요소의 알려진 속성인 경우
 * - 그 요소가 스키마 중 하나에 의해 허용된 경우
 * - 속성이 애니메이션에 사용되는 경우
 *
 * @param element 검증할 요소
 * @param propName 확인할 속성 이름
 * @param tagName 속성을 호스트하는 태그 이름
 * @param schemas 스키마 배열
 */
export function isPropertyValid(
  element: RElement | RComment,
  propName: string,
  tagName: string | null,
  schemas: SchemaMetadata[] | null,
): boolean {
  // 만약 `schemas`가 `null`로 설정되면, 이는 이 컴포넌트가 AOT 모드에서 컴파일되었다는 것을 나타냅니다.
  // 이 경우 이 검사는 컴파일 시 발생합니다. JIT 모드에서는 `schemas`가 항상 존재하며
  // 배열로 정의됩니다 (정의되지 않은 경우 빈 배열로).
  if (schemas === null) return true;

  // 그 속성이 스키마에 맞거나, 요소에 존재하거나,
  // 또는 합성인 경우 속성은 유효한 것으로 간주됩니다.
  if (matchingSchemas(schemas, tagName) || propName in element || isAnimationProp(propName)) {
    return true;
  }

  // 참고: `typeof Node`는 대부분의 브라우저에서 'function'을 반환하지만, domino에서는 정의되지 않습니다.
  return typeof Node === 'undefined' || Node === null || !(element instanceof Node);
}

/**
 * 요소에서 지원되지 않는 속성이 있을 때 오류를 로그하거나 발생시킵니다.
 *
 * @param propName 유효하지 않은 속성의 이름
 * @param tagName 속성을 호스트하는 태그 이름
 * @param nodeType 속성을 호스트하는 노드의 유형
 * @param lView 현재 컴포넌트를 나타내는 `LView`
 */
export function handleUnknownPropertyError(
  propName: string,
  tagName: string | null,
  nodeType: TNodeType,
  lView: LView,
): void {
  // 구조적 지시어가 `<ng-template>` 요소에 적용된 경우를 특별히 처리합니다. 예: `<ng-template *ngIf="true">`.
  // 이 경우 컴파일러는 `null`을 태그 이름으로 사용하는 `ɵɵtemplate` 지시문을 생성합니다.
  // 런타임의 지시어 매칭 로직은 이 효과에 의존합니다(기억하세요 `isInlineTemplate`).
  // 따라서 이 순간 `tNode.value`의 기본값으로 'ng-template'을 사용하는 것은 실현 가능하지 않습니다.
  if (!tagName && nodeType === TNodeType.Container) {
    tagName = 'ng-template';
  }

  const isHostStandalone = isHostComponentStandalone(lView);
  const templateLocation = getTemplateLocationDetails(lView);

  let message = `'${tagName}'의 알려진 속성이 아닌 '${propName}'에 바인딩할 수 없습니다.${templateLocation}.`;

  const schemas = `'${isHostStandalone ? '@Component' : '@NgModule'}.schemas'`;
  const importLocation = isHostStandalone
    ? "'@Component.imports'에 포함된"
    : '@NgModule의 일부로 선언된';
  if (KNOWN_CONTROL_FLOW_DIRECTIVES.has(propName)) {
    // 아마도 템플릿에서 사용된 제어 흐름 지시어(예: `*ngIf`)일 가능성이 있지만,
    // 지시어 또는 `CommonModule`이 가져오지 않았을 수 있습니다.
    const correspondingImport = KNOWN_CONTROL_FLOW_DIRECTIVES.get(propName);
    message +=
      `\n'${propName}'가 Angular 제어 흐름 지시어라면, ` +
      ` '${correspondingImport}' 지시어 또는 'CommonModule'이 ${importLocation}인지 확인하세요.`;
  } else {
    // 가져오거나 선언되지 않음? 아마도 Angular 컴포넌트?
    message +=
      `\n1. '${tagName}'가 Angular 컴포넌트이고 '${propName}' 입력이 있다면, ` +
      `그것이 ${importLocation}인지 확인하세요.`;
    // 웹 컴포넌트일 가능성?
    if (tagName && tagName.indexOf('-') > -1) {
      message +=
        `\n2. '${tagName}'가 웹 컴포넌트라면, 이 메시지를 억제하기 위해 ` +
        `이 컴포넌트의 ${schemas}에 'CUSTOM_ELEMENTS_SCHEMA'를 추가하세요.`;
      message += `\n3. 모든 속성을 허용하려면 이 컴포넌트의 ${schemas}에 'NO_ERRORS_SCHEMA'를 추가하세요.`;
    } else {
      // 예상된 경우, 이 오류는 `NO_ERRORS_SCHEMA` 스키마로 억제될 수 있습니다.
      message += `\n2. 모든 속성을 허용하려면 이 컴포넌트의 ${schemas}에 'NO_ERRORS_SCHEMA'를 추가하세요.`;
    }
  }

  reportUnknownPropertyError(message);
}

export function reportUnknownPropertyError(message: string) {
  if (shouldThrowErrorOnUnknownProperty) {
    throw new RuntimeError(RuntimeErrorCode.UNKNOWN_BINDING, message);
  } else {
    console.error(formatRuntimeError(RuntimeErrorCode.UNKNOWN_BINDING, message));
  }
}

/**
 * 경고: 이는 **개발 모드 전용** 함수입니다 (항상 `ngDevMode`로 보호되어야 하며)
 * 생산 번들에서 **사용해서는 안 됩니다**. 이 함수는 메가모픽 읽기를 수행하여
 * 생산 모드에서는 너무 느릴 수 있으며 생성자 함수가 사용 가능해야 합니다.
 *
 * 호스트 컴포넌트 정의에 대한 참조를 가져옵니다 (현재 컴포넌트가 선언된 위치).
 *
 * @param lView 렌더링되고 있는 현재 컴포넌트를 나타내는 `LView`.
 */
export function getDeclarationComponentDef(lView: LView): ComponentDef<unknown> | null {
  !ngDevMode && throwError('생산 모드에서는 호출되어서는 안 됩니다.');

  const declarationLView = lView[DECLARATION_COMPONENT_VIEW] as LView<Type<unknown>>;
  const context = declarationLView[CONTEXT];

  // 컨텍스트를 얻을 수 없습니다.
  if (!context) return null;

  return context.constructor ? getComponentDef(context.constructor) : null;
}

/**
 * 경고: 이는 **개발 모드 전용** 함수입니다 (항상 `ngDevMode`로 보호되어야 하며)
 * 생산 번들에서 **사용해서는 안 됩니다**. 이 함수는 메가모픽 읽기를 수행하여
 * 생산 모드에서는 너무 느릴 수 있습니다.
 *
 * 현재 컴포넌트가 독립형 컴포넌트 템플릿 내에서 선언되었는지 확인합니다.
 *
 * @param lView 렌더링되고 있는 현재 컴포넌트를 나타내는 `LView`.
 */
export function isHostComponentStandalone(lView: LView): boolean {
  !ngDevMode && throwError('생산 모드에서는 호출되어서는 안 됩니다.');

  const componentDef = getDeclarationComponentDef(lView);
  // 정의를 얻을 수 없다면 호스트 컴포넌트를 비독립형으로 간주합니다.
  return !!componentDef?.standalone;
}

/**
 * 경고: 이는 **개발 모드 전용** 함수입니다 (항상 `ngDevMode`로 보호되어야 하며)
 * 생산 번들에서 **사용해서는 안 됩니다**. 이 함수는 메가모픽 읽기를 수행하여
 * 생산 모드에서는 너무 느릴 수 있습니다.
 *
 * 호스트 컴포넌트 템플릿의 위치를 설명하는 문자열을 만듭니다. 이 함수는
 * 오류 메시지를 생성하기 위해 개발 모드에서 사용됩니다.
 *
 * @param lView 렌더링되고 있는 현재 컴포넌트를 나타내는 `LView`.
 */
export function getTemplateLocationDetails(lView: LView): string {
  !ngDevMode && throwError('생산 모드에서는 호출되어서는 안 됩니다.');

  const hostComponentDef = getDeclarationComponentDef(lView);
  const componentClassName = hostComponentDef?.type?.name;
  return componentClassName ? ` ( '${componentClassName}' 컴포넌트 템플릿에서 사용됨 )` : '';
}

/**
 * 알려진 제어 흐름 지시어와 그에 해당하는 가져오기를 포함하는 집합입니다.
 * 우리는 이 집합을 사용하여 `CommonModule`도 포함되어야 한다는 메모와 함께
 * 더 정확한 오류 메시지를 생성합니다.
 */
export const KNOWN_CONTROL_FLOW_DIRECTIVES = new Map([
  ['ngIf', 'NgIf'],
  ['ngFor', 'NgFor'],
  ['ngSwitchCase', 'NgSwitchCase'],
  ['ngSwitchDefault', 'NgSwitchDefault'],
]);

/**
 * 태그 이름이 지정된 스키마에 의해 허용되는 경우 true를 반환합니다.
 * @param schemas 스키마 배열
 * @param tagName 태그 이름
 */
export function matchingSchemas(schemas: SchemaMetadata[] | null, tagName: string | null): boolean {
  if (schemas !== null) {
    for (let i = 0; i < schemas.length; i++) {
      const schema = schemas[i];
      if (
        schema === NO_ERRORS_SCHEMA ||
        (schema === CUSTOM_ELEMENTS_SCHEMA && tagName && tagName.indexOf('-') > -1)
      ) {
        return true;
      }
    }
  }

  return false;
}
