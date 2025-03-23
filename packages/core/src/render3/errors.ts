/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {Type} from '../interface/type';

import {getComponentDef} from './def_getters';
import {getDeclarationComponentDef} from './instructions/element_validation';
import {TNode} from './interfaces/node';
import {LView, TVIEW} from './interfaces/view';
import {INTERPOLATION_DELIMITER} from './util/misc_utils';
import {stringifyForError} from './util/stringify_utils';

/**
 * 에러 메시지에서 값의 문자열 표현의 최대 길이
 */
const VALUE_STRING_LENGTH_LIMIT = 200;

/** 주어진 타입이 독립형 컴포넌트인지 확인합니다. */
export function assertStandaloneComponentType(type: Type<unknown>) {
  assertComponentDef(type);
  const componentDef = getComponentDef(type)!;
  if (!componentDef.standalone) {
    throw new RuntimeError(
      RuntimeErrorCode.TYPE_IS_NOT_STANDALONE,
      `The ${stringifyForError(type)} 컴포넌트는 독립형으로 표시되지 않았습니다, ` +
        `그러나 Angular는 여기에서 독립형 컴포넌트를 기대합니다. ` +
        `확인하고 ${stringifyForError(type)} 컴포넌트에 ` +
        `장식자에서 \`standalone: true\` 플래그가 있는지 확인해 주세요.`,
    );
  }
}

/** 주어진 타입이 컴포넌트인지 확인합니다. */
export function assertComponentDef(type: Type<unknown>) {
  if (!getComponentDef(type)) {
    throw new RuntimeError(
      RuntimeErrorCode.MISSING_GENERATED_DEF,
      `The ${stringifyForError(type)}는 Angular 컴포넌트가 아닙니다, ` +
        `\`@Component\` 장식자가 있는지 확인하세요.`,
    );
  }
}

/** 주어진 노드와 일치하는 여러 컴포넌트 선택기가 있을 때 호출됩니다. */
export function throwMultipleComponentError(
  tNode: TNode,
  first: Type<unknown>,
  second: Type<unknown>,
): never {
  throw new RuntimeError(
    RuntimeErrorCode.MULTIPLE_COMPONENTS_MATCH,
    `여러 컴포넌트가 태그 이름 ${tNode.value}의 노드와 일치합니다: ` +
      `${stringifyForError(first)} 및 ` +
      `${stringifyForError(second)}`,
  );
}

/** checkNoChanges 모드가 켜져 있으면 ExpressionChangedAfterChecked 오류를 발생시킵니다. */
export function throwErrorIfNoChangesMode(
  creationMode: boolean,
  oldValue: any,
  currValue: any,
  propName: string | undefined,
  lView: LView,
): never {
  const hostComponentDef = getDeclarationComponentDef(lView);
  const componentClassName = hostComponentDef?.type?.name;
  const field = propName ? ` '${propName}'에 대해` : '';
  let msg = `ExpressionChangedAfterItHasBeenCheckedError: 표현식이 체크된 후 변경되었습니다. 이전 값${field}: '${formatValue(
    oldValue,
  )}'. 현재 값: '${formatValue(currValue)}'.${
    componentClassName ? ` 표현식 위치: ${componentClassName} 컴포넌트` : ''
  }`;
  if (creationMode) {
    msg +=
      ` 뷰가 부모와 자식이 더티 체크된 후 생성된 것 같습니다.` +
      ` 변경 감지 훅에서 생성되었습니까?`;
  }
  throw new RuntimeError(RuntimeErrorCode.EXPRESSION_CHANGED_AFTER_CHECKED, msg);
}

function formatValue(value: unknown): string {
  let strValue: string = String(value);

  // JSON.stringify는 순환 참조에서 오류를 발생시킵니다.
  try {
    if (Array.isArray(value) || strValue === '[object Object]') {
      strValue = JSON.stringify(value);
    }
  } catch (error) {}
  return strValue.length > VALUE_STRING_LENGTH_LIMIT
    ? strValue.substring(0, VALUE_STRING_LENGTH_LIMIT) + '…'
    : strValue;
}

function constructDetailsForInterpolation(
  lView: LView,
  rootIndex: number,
  expressionIndex: number,
  meta: string,
  changedValue: any,
) {
  const [propName, prefix, ...chunks] = meta.split(INTERPOLATION_DELIMITER);
  let oldValue = prefix,
    newValue = prefix;
  for (let i = 0; i < chunks.length; i++) {
    const slotIdx = rootIndex + i;
    oldValue += `${lView[slotIdx]}${chunks[i]}`;
    newValue += `${slotIdx === expressionIndex ? changedValue : lView[slotIdx]}${chunks[i]}`;
  }
  return {propName, oldValue, newValue};
}

/**
 * ExpressionChangedAfterItHasBeenCheckedError에 대한 세부 정보를 포함하는 객체를 구성합니다:
 * - 속성 이름 (속성 바인딩 또는 보간을 위한)
 * - 이전 및 새 값, 메타데이터의 정보를 사용하여 보강됨.
 *
 * 메타데이터 저장 형식에 대한 더 많은 정보는 `storePropertyBindingMetadata`
 * 함수 설명에서 찾을 수 있습니다.
 */
export function getExpressionChangedErrorDetails(
  lView: LView,
  bindingIndex: number,
  oldValue: any,
  newValue: any,
): {propName?: string; oldValue: any; newValue: any} {
  const tData = lView[TVIEW].data;
  const metadata = tData[bindingIndex];

  if (typeof metadata === 'string') {
    // 속성 보간을 위한 메타데이터
    if (metadata.indexOf(INTERPOLATION_DELIMITER) > -1) {
      return constructDetailsForInterpolation(
        lView,
        bindingIndex,
        bindingIndex,
        metadata,
        newValue,
      );
    }
    // 속성 바인딩을 위한 메타데이터
    return {propName: metadata, oldValue, newValue};
  }

  // 이 표현식에 대한 메타데이터가 사용 불가능하면, 현재 바인딩 색인을 왼쪽으로 이동하면서
  // INTERPOLATION_DELIMITER를 포함하는 문자열이 있는지 확인합니다,
  // 이 경우 tView.data에서 레이아웃은 다음과 같이 보일 것입니다:
  // [..., 'id�Prefix � and � suffix', null, null, null, ...]
  if (metadata === null) {
    let idx = bindingIndex - 1;
    while (typeof tData[idx] !== 'string' && tData[idx + 1] === null) {
      idx--;
    }
    const meta = tData[idx];
    if (typeof meta === 'string') {
      const matches = meta.match(new RegExp(INTERPOLATION_DELIMITER, 'g'));
      // 첫 번째 보간 구분자는 속성 이름과 보간 부분을 분리합니다 (속성 보간의 경우).
      // 따라서 찾은 구분자의 총 수에서 하나를 뺍니다.
      if (matches && matches.length - 1 > bindingIndex - idx) {
        return constructDetailsForInterpolation(lView, idx, bindingIndex, meta, newValue);
      }
    }
  }
  return {propName: undefined, oldValue, newValue};
}
