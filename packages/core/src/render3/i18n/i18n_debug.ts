/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertNumber, assertString} from '../../util/assert';
import {
  ELEMENT_MARKER,
  I18nCreateOpCode,
  I18nCreateOpCodes,
  I18nRemoveOpCodes,
  I18nUpdateOpCode,
  I18nUpdateOpCodes,
  ICU_MARKER,
  IcuCreateOpCode,
  IcuCreateOpCodes,
} from '../interfaces/i18n';

import {
  getInstructionFromIcuCreateOpCode,
  getParentFromIcuCreateOpCode,
  getRefFromIcuCreateOpCode,
} from './i18n_util';

/**
 * `I18nCreateOpCodes` 배열을 사람이 읽을 수 있는 형식으로 변환합니다.
 *
 * 이 함수는 `ngDevMode`가 활성화된 경우 `I18nCreateOpCodes.debug` 속성에 연결됩니다.
 * 이 함수는 opcode의 사람이 읽을 수 있는 뷰를 제공합니다. 이는 응용 프로그램을 디버깅할 때와
 * 더 가독성 있는 테스트를 작성할 때 유용합니다.
 *
 * @param this 메소드로 첨부된 경우의 `I18nCreateOpCodes`.
 * @param opcodes 함수로 호출된 경우의 `I18nCreateOpCodes`.
 */
export function i18nCreateOpCodesToString(
  this: I18nCreateOpCodes | void,
  opcodes?: I18nCreateOpCodes,
): string[] {
  const createOpCodes: I18nCreateOpCodes = opcodes || (Array.isArray(this) ? this : ([] as any));
  let lines: string[] = [];
  for (let i = 0; i < createOpCodes.length; i++) {
    const opCode = createOpCodes[i++] as any;
    const text = createOpCodes[i] as string;
    const isComment = (opCode & I18nCreateOpCode.COMMENT) === I18nCreateOpCode.COMMENT;
    const appendNow =
      (opCode & I18nCreateOpCode.APPEND_EAGERLY) === I18nCreateOpCode.APPEND_EAGERLY;
    const index = opCode >>> I18nCreateOpCode.SHIFT;
    lines.push(
      `lView[${index}] = document.${isComment ? 'createComment' : 'createText'}(${JSON.stringify(
        text,
      )});`,
    );
    if (appendNow) {
      lines.push(`parent.appendChild(lView[${index}]);`);
    }
  }
  return lines;
}

/**
 * `I18nUpdateOpCodes` 배열을 사람이 읽을 수 있는 형식으로 변환합니다.
 *
 * 이 함수는 `ngDevMode`가 활성화된 경우 `I18nUpdateOpCodes.debug` 속성에 연결됩니다.
 * 이 함수는 opcode의 사람이 읽을 수 있는 뷰를 제공합니다. 이는 응용 프로그램을 디버깅할 때와
 * 더 가독성 있는 테스트를 작성할 때 유용합니다.
 *
 * @param this 메소드로 첨부된 경우의 `I18nUpdateOpCodes`.
 * @param opcodes 함수로 호출된 경우의 `I18nUpdateOpCodes`.
 */
export function i18nUpdateOpCodesToString(
  this: I18nUpdateOpCodes | void,
  opcodes?: I18nUpdateOpCodes,
): string[] {
  const parser = new OpCodeParser(opcodes || (Array.isArray(this) ? this : []));
  let lines: string[] = [];

  function consumeOpCode(value: number): string {
    const ref = value >>> I18nUpdateOpCode.SHIFT_REF;
    const opCode = value & I18nUpdateOpCode.MASK_OPCODE;
    switch (opCode) {
      case I18nUpdateOpCode.Text:
        return `(lView[${ref}] as Text).textContent = $$$`;
      case I18nUpdateOpCode.Attr:
        const attrName = parser.consumeString();
        const sanitizationFn = parser.consumeFunction();
        const value = sanitizationFn ? `(${sanitizationFn})($$$)` : '$$$';
        return `(lView[${ref}] as Element).setAttribute('${attrName}', ${value})`;
      case I18nUpdateOpCode.IcuSwitch:
        return `icuSwitchCase(${ref}, $$$)`;
      case I18nUpdateOpCode.IcuUpdate:
        return `icuUpdateCase(${ref})`;
    }
    throw new Error('예기치 않은 OpCode');
  }

  while (parser.hasMore()) {
    let mask = parser.consumeNumber();
    let size = parser.consumeNumber();
    const end = parser.i + size;
    const statements: string[] = [];
    let statement = '';
    while (parser.i < end) {
      let value = parser.consumeNumberOrString();
      if (typeof value === 'string') {
        statement += value;
      } else if (value < 0) {
        // 음수는 참조 인덱스입니다.
        // 여기서 `i`는 현재 바인딩 인덱스를 나타냅니다. 이는 값이 절대적인 것이 아니라 상대적임을 의미합니다.
        statement += '${lView[i' + value + ']}';
      } else {
        // 양수는 연산입니다.
        const opCodeText = consumeOpCode(value);
        statements.push(opCodeText.replace('$$$', '`' + statement + '`') + ';');
        statement = '';
      }
    }
    lines.push(`if (mask & 0b${mask.toString(2)}) { ${statements.join(' ')} }`);
  }
  return lines;
}

/**
 * `I18nCreateOpCodes` 배열을 사람이 읽을 수 있는 형식으로 변환합니다.
 *
 * 이 함수는 `ngDevMode`가 활성화된 경우 `I18nCreateOpCodes.debug`에 첨부됩니다. 이
 * 함수는 opcode의 사람이 읽을 수 있는 뷰를 제공합니다. 이는 응용 프로그램을 디버깅할 때와
 * 더 가독성 있는 테스트를 작성할 때 유용합니다.
 *
 * @param this 메소드로 첨부된 경우의 `I18nCreateOpCodes`.
 * @param opcodes 함수로 호출된 경우의 `I18nCreateOpCodes`.
 */
export function icuCreateOpCodesToString(
  this: IcuCreateOpCodes | void,
  opcodes?: IcuCreateOpCodes,
): string[] {
  const parser = new OpCodeParser(opcodes || (Array.isArray(this) ? this : []));
  let lines: string[] = [];

  function consumeOpCode(opCode: number): string {
    const parent = getParentFromIcuCreateOpCode(opCode);
    const ref = getRefFromIcuCreateOpCode(opCode);
    switch (getInstructionFromIcuCreateOpCode(opCode)) {
      case IcuCreateOpCode.AppendChild:
        return `(lView[${parent}] as Element).appendChild(lView[${lastRef}])`;
      case IcuCreateOpCode.Attr:
        return `(lView[${ref}] as Element).setAttribute("${parser.consumeString()}", "${parser.consumeString()}")`;
    }
    throw new Error('예상치 못한 OpCode: ' + getInstructionFromIcuCreateOpCode(opCode));
  }

  let lastRef = -1;
  while (parser.hasMore()) {
    let value = parser.consumeNumberStringOrMarker();
    if (value === ICU_MARKER) {
      const text = parser.consumeString();
      lastRef = parser.consumeNumber();
      lines.push(`lView[${lastRef}] = document.createComment("${text}")`);
    } else if (value === ELEMENT_MARKER) {
      const text = parser.consumeString();
      lastRef = parser.consumeNumber();
      lines.push(`lView[${lastRef}] = document.createElement("${text}")`);
    } else if (typeof value === 'string') {
      lastRef = parser.consumeNumber();
      lines.push(`lView[${lastRef}] = document.createTextNode("${value}")`);
    } else if (typeof value === 'number') {
      const line = consumeOpCode(value);
      line && lines.push(line);
    } else {
      throw new Error('예상치 못한 값');
    }
  }

  return lines;
}

/**
 * `I18nRemoveOpCodes` 배열을 사람이 읽을 수 있는 형식으로 변환합니다.
 *
 * 이 함수는 `ngDevMode`가 활성화된 경우 `I18nRemoveOpCodes.debug`에 첨부됩니다. 이
 * 함수는 opcode의 사람이 읽을 수 있는 뷰를 제공합니다. 이는 응용 프로그램을 디버깅할 때와
 * 더 가독성 있는 테스트를 작성할 때 유용합니다.
 *
 * @param this 메소드로 첨부된 경우의 `I18nRemoveOpCodes`.
 * @param opcodes 함수로 호출된 경우의 `I18nRemoveOpCodes`.
 */
export function i18nRemoveOpCodesToString(
  this: I18nRemoveOpCodes | void,
  opcodes?: I18nRemoveOpCodes,
): string[] {
  const removeCodes = opcodes || (Array.isArray(this) ? this : []);
  let lines: string[] = [];

  for (let i = 0; i < removeCodes.length; i++) {
    const nodeOrIcuIndex = removeCodes[i] as number;
    if (nodeOrIcuIndex > 0) {
      // 양수는 `RNode`입니다.
      lines.push(`remove(lView[${nodeOrIcuIndex}])`);
    } else {
      // 음수는 ICU입니다.
      lines.push(`removeNestedICU(${~nodeOrIcuIndex})`);
    }
  }

  return lines;
}

class OpCodeParser {
  i: number = 0;
  codes: any[];

  constructor(codes: any[]) {
    this.codes = codes;
  }

  hasMore() {
    return this.i < this.codes.length;
  }

  consumeNumber(): number {
    let value = this.codes[this.i++];
    assertNumber(value, 'OpCode에서 숫자를 기대합니다.');
    return value;
  }

  consumeString(): string {
    let value = this.codes[this.i++];
    assertString(value, 'OpCode에서 문자열을 기대합니다.');
    return value;
  }

  consumeFunction(): Function | null {
    let value = this.codes[this.i++];
    if (value === null || typeof value === 'function') {
      return value;
    }
    throw new Error('OpCode에서 함수를 기대합니다.');
  }

  consumeNumberOrString(): number | string {
    let value = this.codes[this.i++];
    if (typeof value === 'string') {
      return value;
    }
    assertNumber(value, 'OpCode에서 숫자 또는 문자열을 기대합니다.');
    return value;
  }

  consumeNumberStringOrMarker(): number | string | ICU_MARKER | ELEMENT_MARKER {
    let value = this.codes[this.i++];
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      value == ICU_MARKER ||
      value == ELEMENT_MARKER
    ) {
      return value;
    }
    assertNumber(value, 'OpCode에서 숫자, 문자열, ICU_MARKER 또는 ELEMENT_MARKER를 기대합니다.');
    return value;
  }
}
