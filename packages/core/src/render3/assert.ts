/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../errors';
import {assertDefined, assertEqual, assertNumber, throwError} from '../util/assert';

import {getComponentDef, getNgModuleDef} from './def_getters';
import {LContainer} from './interfaces/container';
import {DirectiveDef} from './interfaces/definition';
import {TIcu} from './interfaces/i18n';
import {NodeInjectorOffset} from './interfaces/injector';
import {TNode} from './interfaces/node';
import {isLContainer, isLView} from './interfaces/type_checks';
import {
  DECLARATION_COMPONENT_VIEW,
  FLAGS,
  HEADER_OFFSET,
  LView,
  LViewFlags,
  T_HOST,
  TVIEW,
  TView,
} from './interfaces/view';

// [Assert 함수는 진리 값에 의해 보호될 때 유형을 제약하지 않습니다.
//](https://github.com/microsoft/TypeScript/issues/37295)

export function assertTNodeForLView(tNode: TNode, lView: LView) {
  assertTNodeForTView(tNode, lView[TVIEW]);
}

export function assertTNodeForTView(tNode: TNode, tView: TView) {
  assertTNode(tNode);
  const tData = tView.data;
  for (let i = HEADER_OFFSET; i < tData.length; i++) {
    if (tData[i] === tNode) {
      return;
    }
  }
  throwError('이 TNode는 이 TView에 속하지 않습니다.');
}

export function assertTNode(tNode: TNode) {
  assertDefined(tNode, 'TNode는 정의되어야 합니다');
  if (!(tNode && typeof tNode === 'object' && tNode.hasOwnProperty('directiveStylingLast'))) {
    throwError('TNode 유형이 아닙니다, 받아온 값: ' + tNode);
  }
}

export function assertTIcu(tIcu: TIcu) {
  assertDefined(tIcu, 'TIcu는 정의되어야 합니다');
  if (!(typeof tIcu.currentCaseLViewIndex === 'number')) {
    throwError('객체는 TIcu 타입이 아닙니다.');
  }
}

export function assertComponentType(
  actual: any,
  msg: string = "전달된 유형은 ComponentType이 아닙니다, 'ɵcmp' 속성이 없습니다.",
) {
  if (!getComponentDef(actual)) {
    throwError(msg);
  }
}

export function assertNgModuleType(
  actual: any,
  msg: string = "전달된 유형은 NgModuleType이 아닙니다, 'ɵmod' 속성이 없습니다.",
) {
  if (!getNgModuleDef(actual)) {
    throwError(msg);
  }
}

export function assertCurrentTNodeIsParent(isParent: boolean) {
  assertEqual(isParent, true, 'currentTNode는 부모여야 합니다');
}

export function assertHasParent(tNode: TNode | null) {
  assertDefined(tNode, 'currentTNode는 존재해야 합니다!');
  assertDefined(tNode!.parent, 'currentTNode는 부모를 가져야 합니다');
}

export function assertLContainer(value: any): asserts value is LContainer {
  assertDefined(value, 'LContainer는 정의되어야 합니다');
  assertEqual(isLContainer(value), true, 'LContainer를 예상합니다');
}

export function assertLViewOrUndefined(value: any): asserts value is LView | null | undefined {
  value && assertEqual(isLView(value), true, 'LView 또는 undefined 또는 null을 예상합니다');
}

export function assertLView(value: any): asserts value is LView {
  assertDefined(value, 'LView는 정의되어야 합니다');
  assertEqual(isLView(value), true, 'LView를 예상합니다');
}

export function assertFirstCreatePass(tView: TView, errMessage?: string) {
  assertEqual(
    tView.firstCreatePass,
    true,
    errMessage || '첫 번째 생성 패스에서만 호출되어야 합니다.',
  );
}

export function assertFirstUpdatePass(tView: TView, errMessage?: string) {
  assertEqual(
    tView.firstUpdatePass,
    true,
    errMessage || '첫 번째 업데이트 패스에서만 호출되어야 합니다.',
  );
}

/**
 * 이 객체가 아마도 지시어 정의일 가능성을 확인하는 기본적인 검증입니다. DirectiveDef는
 * 인터페이스이므로 직접 instanceof 확인을 수행할 수 없습니다.
 */
export function assertDirectiveDef<T>(obj: any): asserts obj is DirectiveDef<T> {
  if (obj.type === undefined || obj.selectors == undefined || obj.inputs === undefined) {
    throwError(
      `DirectiveDef/ComponentDef를 예상했으나 이 객체는 예상하는 형태가 아닌 것 같습니다.`,
    );
  }
}

export function assertIndexInDeclRange(tView: TView, index: number) {
  assertBetween(HEADER_OFFSET, tView.bindingStartIndex, index);
}

export function assertIndexInExpandoRange(lView: LView, index: number) {
  const tView = lView[1];
  assertBetween(tView.expandoStartIndex, lView.length, index);
}

export function assertBetween(lower: number, upper: number, index: number) {
  if (!(lower <= index && index < upper)) {
    throwError(`인덱스가 범위를 벗어났습니다 (예상: ${lower} <= ${index} < ${upper})`);
  }
}

export function assertProjectionSlots(lView: LView, errMessage?: string) {
  assertDefined(lView[DECLARATION_COMPONENT_VIEW], 'Component views는 존재해야 합니다.');
  assertDefined(
    lView[DECLARATION_COMPONENT_VIEW][T_HOST]!.projection,
    errMessage ||
      '프로젝션 노드(<ng-content>)가 있는 구성 요소는 정의된 프로젝션 슬롯을 가져야 합니다.',
  );
}

export function assertParentView(lView: LView | null, errMessage?: string) {
  assertDefined(
    lView,
    errMessage || 'Component views는 항상 부모 뷰(구성 요소의 호스트 뷰)를 가져야 합니다.',
  );
}

export function assertNoDuplicateDirectives(directives: DirectiveDef<unknown>[]): void {
  // 배열은 중복을 가지기 위해 최소 두 개의 요소가 있어야 합니다.
  if (directives.length < 2) {
    return;
  }

  const seenDirectives = new Set<DirectiveDef<unknown>>();

  for (const current of directives) {
    if (seenDirectives.has(current)) {
      throw new RuntimeError(
        RuntimeErrorCode.DUPLICATE_DIRECTIVE,
        `지시어 ${current.type.name}가 동일한 요소에서 여러 번 일치합니다. ` +
          `지시어는 요소에서 한 번만 일치해야 합니다.`,
      );
    }
    seenDirectives.add(current);
  }
}

/**
 * `injectorIndex`가 NodeInjector 데이터 구조를 가리키는 것 같다는 기본적인 검증입니다.
 *
 * @param lView 체크할 `LView`.
 * @param injectorIndex `NodeInjector`가 예상되는 `LView` 내 인덱스.
 */
export function assertNodeInjector(lView: LView, injectorIndex: number) {
  assertIndexInExpandoRange(lView, injectorIndex);
  assertIndexInExpandoRange(lView, injectorIndex + NodeInjectorOffset.PARENT);
  assertNumber(lView[injectorIndex + 0], 'injectorIndex는 블룸 필터를 가리켜야 합니다');
  assertNumber(lView[injectorIndex + 1], 'injectorIndex는 블룸 필터를 가리켜야 합니다');
  assertNumber(lView[injectorIndex + 2], 'injectorIndex는 블룸 필터를 가리켜야 합니다');
  assertNumber(lView[injectorIndex + 3], 'injectorIndex는 블룸 필터를 가리켜야 합니다');
  assertNumber(lView[injectorIndex + 4], 'injectorIndex는 블룸 필터를 가리켜야 합니다');
  assertNumber(lView[injectorIndex + 5], 'injectorIndex는 블룸 필터를 가리켜야 합니다');
  assertNumber(lView[injectorIndex + 6], 'injectorIndex는 블룸 필터를 가리켜야 합니다');
  assertNumber(lView[injectorIndex + 7], 'injectorIndex는 블룸 필터를 가리켜야 합니다');
  assertNumber(
    lView[injectorIndex + NodeInjectorOffset.PARENT],
    'injectorIndex는 부모 주입기를 가리켜야 합니다',
  );
}
