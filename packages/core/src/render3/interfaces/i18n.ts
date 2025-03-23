/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {SanitizerFn} from './sanitization';

/**
 * 제거해야 하는 노드 목록을 저장합니다.
 *
 * 숫자는 `LView`의 인덱스입니다.
 * - index > 0: `removeRNode(lView[0])`
 * - index < 0: `removeICU(~lView[0])`
 */
export interface I18nRemoveOpCodes extends Array<number> {
  __brand__: 'I18nRemoveOpCodes';
}

/**
 * `I18nMutateOpCode`는 `I18nMutateOpCodes` 배열에 대한 OpCodes를 정의합니다.
 *
 * OpCodes는 DOM에 적용되어 업데이트할 수 있는 효율적인 작업입니다. (예를 들어, 새로운 ICU 케이스로 업데이트하려면 이전 요소를 정리하고 새 요소를 만들어야 합니다.)
 *
 * OpCodes는 세 부분으로 구성됩니다:
 *  1) 부모 노드 인덱스 오프셋. (p)
 *  2) 참조 노드 인덱스 오프셋. (r)
 *  3) 실행할 명령. (i)
 *
 * pppp pppp pppp pppp rrrr rrrr rrrr riii
 * 3322 2222 2222 1111 1111 1110 0000 0000
 * 1098 7654 3210 9876 5432 1098 7654 3210
 *
 * ```ts
 * var parent = lView[opCode >>> SHIFT_PARENT];
 * var refNode = lView[((opCode & MASK_REF) >>> SHIFT_REF)];
 * var instruction = opCode & MASK_OPCODE;
 * ```
 *
 * 사용 예는 `I18nCreateOpCodes`를 참조하십시오.
 */
export const enum IcuCreateOpCode {
  /**
   * 참조 인덱스를 포함하는 비트 17-3의 shift 양을 저장합니다.
   */
  SHIFT_REF = 1,
  /**
   * 부모 인덱스를 포함하는 비트 31-17의 shift 양을 저장합니다.
   */
  SHIFT_PARENT = 17,
  /**
   * OpCode의 마스크
   */
  MASK_INSTRUCTION = 0b1,

  /**
   * 참조 노드를 위한 마스크 (비트 16-3)
   */
  MASK_REF = 0b11111111111111110,
  //           11111110000000000
  //           65432109876543210

  /**
   * 현재 노드를 `PARENT`에 추가하는 명령입니다.
   */
  AppendChild = 0b0,

  /**
   * 노드의 속성을 설정하는 명령입니다.
   */
  Attr = 0b1,
}

/**
 * 동적으로 `i18n` 블록을 생성하기 위한 OpCode를 저장하는 배열입니다.
 *
 * 예시:
 * ```ts
 * <I18nCreateOpCode>[
 *   // 텍스트 노드를 추가하기 위한 것
 *   // ---------------------
 *   // 이에 해당합니다:
 *   //   lView[1].appendChild(lView[0] = document.createTextNode('xyz'));
 *   'xyz', 0, 1 << SHIFT_PARENT | 0 << SHIFT_REF | AppendChild,
 *
 *   // 엘리먼트 노드를 추가하기 위한 것
 *   // ---------------------
 *   // 이에 해당합니다:
 *   //   lView[1].appendChild(lView[0] = document.createElement('div'));
 *   ELEMENT_MARKER, 'div', 0, 1 << SHIFT_PARENT | 0 << SHIFT_REF | AppendChild,
 *
 *   // 코멘트 노드를 추가하기 위한 것
 *   // ---------------------
 *   // 이에 해당합니다:
 *   //   lView[1].appendChild(lView[0] = document.createComment(''));
 *   ICU_MARKER, '', 0, 1 << SHIFT_PARENT | 0 << SHIFT_REF | AppendChild,
 *
 *   // 기존 노드를 다른 위치로 이동하기 위한 것
 *   // --------------------------------------------------
 *   // 이에 해당합니다:
 *   //   const node = lView[1];
 *   //   lView[2].appendChild(node);
 *   1 << SHIFT_REF | Select, 2 << SHIFT_PARENT | 0 << SHIFT_REF | AppendChild,
 *
 *   // 기존 노드를 제거하기 위한 것
 *   // --------------------------------------------------
 *   //   const node = lView[1];
 *   //   removeChild(tView.data(1), node, lView);
 *   1 << SHIFT_REF | Remove,
 *
 *   // 속성 쓰기 위한 것
 *   // --------------------------------------------------
 *   //   const node = lView[1];
 *   //   node.setAttribute('attr', 'value');
 *   1 << SHIFT_REF | Attr, 'attr', 'value'
 * ];
 * ```
 */
export interface IcuCreateOpCodes
  extends Array<number | string | ELEMENT_MARKER | ICU_MARKER | null>,
    I18nDebug {
  __brand__: 'I18nCreateOpCodes';
}

export const enum I18nUpdateOpCode {
  /**
   * 참조 인덱스를 포함하는 비트 17-2의 shift 양을 저장합니다.
   */
  SHIFT_REF = 2,
  /**
   * OpCode의 마스크
   */
  MASK_OPCODE = 0b11,

  /**
   * 텍스트 노드를 업데이트하는 명령입니다.
   */
  Text = 0b00,
  /**
   * 노드의 속성을 업데이트하는 명령입니다.
   */
  Attr = 0b01,
  /**
   * 현재 ICU 케이스를 전환하는 명령입니다.
   */
  IcuSwitch = 0b10,
  /**
   * 현재 ICU 케이스를 업데이트하는 명령입니다.
   */
  IcuUpdate = 0b11,
}

/**
 * 다음 문자열이 엘리먼트 이름임을 표시합니다.
 *
 * `I18nMutateOpCodes` 문서를 참조하십시오.
 */
export const ELEMENT_MARKER: ELEMENT_MARKER = {
  marker: 'element',
};
export interface ELEMENT_MARKER {
  marker: 'element';
}

/**
 * 다음 문자열이 ICU에 필요한 코멘트 텍스트임을 표시합니다.
 *
 * `I18nMutateOpCodes` 문서를 참조하십시오.
 */
export const ICU_MARKER: ICU_MARKER = {
  marker: 'ICU',
};

export interface ICU_MARKER {
  marker: 'ICU';
}

export interface I18nDebug {
  /**
   * OpCode 배열의 사람이 읽을 수 있는 표현입니다.
   *
   * NOTE: 이 속성은 `ngDevMode`가 `true`로 설정된 경우에만 존재하며, 프로덕션에서는 존재하지 않습니다. 이 속성은 개발 중 문제를 디버그하는 데만 사용되며, 프로덕션 애플리케이션에서는 의존하지 않아야 합니다.
   */
  debug?: string[];
}

/**
 * 동적으로 `i18n` 번역 DOM 요소를 생성하기 위한 OpCode를 저장하는 배열입니다.
 *
 * 이 배열은 `Text`와 `Comment`(ICU 앵커로서)의 DOM 요소 시퀀스를 생성합니다. 이는 번역 블록 생성을 위한 작업을 인코딩하는 `number`와 `string` 쌍으로 구성됩니다.
 *
 * 숫자는 `I18nCreateOpCode`에 따라 shift되고 인코딩됩니다.
 *
 * 의사 코드:
 * ```ts
 * const i18nCreateOpCodes = [
 *   10 << I18nCreateOpCode.SHIFT, "DOM에 텍스트 노드 추가",
 *   11 << I18nCreateOpCode.SHIFT | I18nCreateOpCode.COMMENT, "DOM에 코멘트 노드 추가",
 *   12 << I18nCreateOpCode.SHIFT | I18nCreateOpCode.APPEND_LATER, "나중에 추가된 텍스트 노드"
 * ];
 *
 * for(var i=0; i<i18nCreateOpCodes.length; i++) {
 *   const opcode = i18NCreateOpCodes[i++];
 *   const index = opcode >> I18nCreateOpCode.SHIFT;
 *   const text = i18NCreateOpCodes[i];
 *   let node: Text|Comment;
 *   if (opcode & I18nCreateOpCode.COMMENT === I18nCreateOpCode.COMMENT) {
 *     node = lView[~index] = document.createComment(text);
 *   } else {
 *     node = lView[index] = document.createText(text);
 *   }
 *   if (opcode & I18nCreateOpCode.APPEND_EAGERLY !== I18nCreateOpCode.APPEND_EAGERLY) {
 *     parentNode.appendChild(node);
 *   }
 * }
 * ```
 */
export interface I18nCreateOpCodes extends Array<number | string>, I18nDebug {
  __brand__: 'I18nCreateOpCodes';
}

/**
 * `I18nCreateOpCodes`를 참조하십시오.
 */
export enum I18nCreateOpCode {
  /**
   * `APPEND_EAGERLY` 및 `COMMENT`와 결합될 수 있도록 인덱스를 shift하기 위한 비트 수입니다.
   */
  SHIFT = 2,

  /**
   * 노드는 생성 직후 부모에 즉시 추가되어야 합니다.
   */
  APPEND_EAGERLY = 0b01,

  /**
   * 노드는 코멘트(텍스트가 아닌) 노드여야 합니다.
   */
  COMMENT = 0b10,
}

/**
 * 표현식의 변경으로 인해 DOM 렌더 트리를 업데이트하기 위해 적용해야 하는 DOM 작업을 저장합니다.
 *
 * 기본 아이디어는 `i18nExp` OpCodes가 표현식 변경사항을 캡처하고 변경 마스크 비트를 업데이트하는 것입니다. (비트 1은 표현식 1, 비트 2는 표현식 2 등..., 비트 32는 표현식 32 및 그 이상입니다.) OpCodes는 자체 변경 마스크를 표현식 변경 마스크와 비교하여 OpCodes를 실행할지 결정합니다.
 *
 * NOTE: 32번째 비트는 특수하며 32번째 또는 그 이상의 것을 나타냅니다. 이렇게 하면 32개 이상의 바인딩이 있어도 코드가 여전히 작동하지만 효율성은 감소합니다. (번역이 32개 이상의 바인딩을 가질 가능성은 적습니다.)
 *
 * 이러한 OpCodes는 i18n 블록과 ICU 하위 블록 모두에서 사용할 수 있습니다.
 *
 * ## 예시
 *
 * 다음과 같다고 가정합니다.
 * ```ts
 *   if (rf & RenderFlags.Update) {
 *    i18nExp(ctx.exp1); // 변경된 경우 마스크 비트 1 설정
 *    i18nExp(ctx.exp2); // 변경된 경우 마스크 비트 2 설정
 *    i18nExp(ctx.exp3); // 변경된 경우 마스크 비트 3 설정
 *    i18nExp(ctx.exp4); // 변경된 경우 마스크 비트 4 설정
 *    i18nApply(0);            // OpCodes를 실행하여 모든 변경사항 적용.
 *  }
 * ```
 * 각 `i18nExp` 호출이 인덱스에 따라 내부 `changeMask` 비트를 설정한다고 가정할 수 있습니다.
 *
 * ### OpCodes
 * ```ts
 * <I18nUpdateOpCodes>[
 *   // 다음 OpCodes는: `<div i18n-title="pre{{exp1}}in{{exp2}}post">`
 *   // 만약 `changeMask & 0b11`
 *   //        변경되었다면 업데이트 OpCodes를 실행합니다.
 *   //        변경되지 않았다면 `8` 값 건너뛰고 다음 OpCodes 처리 시작.
 *   0b11, 8,
 *   // `newValue = 'pre'+lView[bindIndex-4]+'in'+lView[bindIndex-3]+'post';`로 연결합니다.
 *   'pre', -4, 'in', -3, 'post',
 *   // 속성 업데이트: `elementAttribute(1, 'title', sanitizerFn(newValue));`
 *   1 << SHIFT_REF | Attr, 'title', sanitizerFn,
 *
 *   // 다음 OpCodes는: `<div i18n>Hello {{exp3}}!">`
 *   // 만약 `changeMask & 0b100`
 *   //        변경되었다면 업데이트 OpCodes를 실행합니다.
 *   //        변경되지 않았다면 `4` 값 건너뛰고 다음 OpCodes 처리 시작.
 *   0b100, 4,
 *   // `newValue = 'Hello ' + lView[bindIndex -2] + '!';`로 연결합니다.
 *   'Hello ', -2, '!',
 *   // 텍스트 업데이트: `lView[1].textContent = newValue;`
 *   1 << SHIFT_REF | Text,
 *
 *   // 다음 OpCodes는: `<div i18n>{exp4, plural, ... }">`
 *   // 만약 `changeMask & 0b1000`
 *   //        변경되었다면 업데이트 OpCodes를 실행합니다.
 *   //        변경되지 않았다면 `2` 값 건너뛰고 다음 OpCodes 처리 시작.
 *   0b1000, 2,
 *   // `newValue = lView[bindIndex -1];`로 연결합니다.
 *   -1,
 *   // ICU 전환: `icuSwitchCase(lView[1], 0, newValue);`
 *   0 << SHIFT_ICU | 1 << SHIFT_REF | IcuSwitch,
 *
 *   // 주의: `changeMask & -1`은 항상 참이므로 IcuUpdate는 항상 실행됩니다.
 *   -1, 1,
 *   // ICU 업데이트: `icuUpdateCase(lView[1], 0);`
 *   0 << SHIFT_ICU | 1 << SHIFT_REF | IcuUpdate,
 *
 * ];
 * ```
 *
 */
export interface I18nUpdateOpCodes extends Array<string | number | SanitizerFn | null>, I18nDebug {
  __brand__: 'I18nUpdateOpCodes';
}

/**
 * i18n 번역 블록에 대한 정보를 저장합니다.
 */
export interface TI18n {
  /**
   * 번역 블록의 텍스트 노드와 ICU 앵커를 생성하는 OpCode 집합입니다.
   *
   * NOTE: ICU 앵커는 ICU 업데이트 OpCode로 채워집니다.
   */
  create: I18nCreateOpCodes;

  /**
   * DOM 변경이 필요한지 판단하기 위해 각 변경 감지에서 실행되는 OpCode 집합입니다.
   */
  update: I18nUpdateOpCodes;

  /**
   * 변환된 메시지를 나타내는 AST입니다. 이는 수화(hydration, 직렬화)와 함께 사용되며,
   * 업데이트 및 생성 OpCodes는 런타임에서 사용됩니다.
   */
  ast: Array<I18nNode>;

  /**
   * 이 i18n 블록의 호스트 노드를 나타내는 부모 TNode의 인덱스입니다.
   */
  parentTNodeIndex: number;
}

/**
 * `select` 또는 `plural`의 ICU 유형을 정의합니다.
 */
export const enum IcuType {
  select = 0,
  plural = 1,
}

export interface TIcu {
  /**
   * `select` 또는 `plural`의 ICU 유형을 정의합니다.
   */
  type: IcuType;

  /**
   * 앵커 노드가 저장되는 `LView`의 인덱스. `<!-- ICU 0:0 -->`
   */
  anchorIdx: number;

  /**
   * 현재 선택된 ICU 케이스 포인터입니다.
   *
   * `lView[currentCaseLViewIndex]`는 현재 선택된 케이스를 저장합니다. 이는 새로운 케이스로 전환할 때 현재 케이스를 정리하는 방법을 아는 데 필요합니다.
   *
   * 저장된 값이:
   * `null`: 현재 선택된 케이스가 없습니다.
   *   `<0`: ICU가 방금 전환되었음을 의미하는 플래그로, `mask`와 관계없이 `icuUpdate`를 실행해야 함을 나타냅니다. (실행 후 플래그는 초기화됩니다)
   *   `>=0` 현재 선택된 케이스 인덱스입니다.
   */
  currentCaseLViewIndex: number;

  /**
   * 현재 ICU가 일치시키려는 케이스 값 목록입니다.
   *
   * 마지막 값은 `other`입니다.
   */
  cases: any[];

  /**
   * ICU의 DOM 렌더 트리를 구축하기 위해 적용해야 하는 OpCode 집합입니다.
   */
  create: IcuCreateOpCodes[];

  /**
   * ICU의 DOM 렌더 트리를 제거하기 위해 적용해야 하는 OpCode 집합입니다.
   */
  remove: I18nRemoveOpCodes[];

  /**
   * ICU 바인딩의 DOM 렌더 트리를 업데이트하기 위해 적용해야 하는 OpCode 집합입니다.
   */
  update: I18nUpdateOpCodes[];
}

/**
 * 구문 분석된 ICU 표현식입니다.
 */
export interface IcuExpression {
  type: IcuType;
  mainBinding: number;
  cases: string[];
  values: (string | IcuExpression)[][];
}

// 구문 분석된 I18n AST 노드
export type I18nNode = I18nTextNode | I18nElementNode | I18nICUNode | I18nPlaceholderNode;

/**
 * 번역에서 텍스트 블록을 나타냅니다. 예: `Hello, {{ name }}!`.
 */
export interface I18nTextNode {
  /** AST 노드 종류 */
  kind: I18nNodeKind.TEXT;

  /** LView 인덱스 */
  index: number;
}

/**
 * 번역에서 간단한 DOM 요소를 나타냅니다. 예: `<div>...</div>`
 */
export interface I18nElementNode {
  /** AST 노드 종류 */
  kind: I18nNodeKind.ELEMENT;

  /** LView 인덱스 */
  index: number;

  /** 자식 노드 */
  children: Array<I18nNode>;
}

/**
 * 번역의 ICU를 나타냅니다.
 */
export interface I18nICUNode {
  /** AST 노드 종류 */
  kind: I18nNodeKind.ICU;

  /** LView 인덱스 */
  index: number;

  /** 가지 치기 케이스 */
  cases: Array<Array<I18nNode>>;

  /** 활성 케이스를 저장하는 LView 인덱스 */
  currentCaseLViewIndex: number;
}

/**
 * 번역에 포함된 특별한 콘텐츠를 나타냅니다. 이는 <ng-container> 및 <ng-content>와 같은 내장 요소일 수도 있고,
 * 구조 지시문에서 가져온 서브 템플릿일 수도 있습니다.
 */
export interface I18nPlaceholderNode {
  /** AST 노드 종류 */
  kind: I18nNodeKind.PLACEHOLDER;

  /** LView 인덱스 */
  index: number;

  /** 자식 노드 */
  children: Array<I18nNode>;

  /** 플레이스홀더 타입 */
  type: I18nPlaceholderType;
}

export const enum I18nPlaceholderType {
  ELEMENT,
  SUBTEMPLATE,
}

export const enum I18nNodeKind {
  TEXT,
  ELEMENT,
  PLACEHOLDER,
  ICU,
}
