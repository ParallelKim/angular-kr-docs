/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InternalInjectFlags} from '../di/interface/injector';
import {
  assertDefined,
  assertEqual,
  assertGreaterThanOrEqual,
  assertLessThan,
  assertNotEqual,
  throwError,
} from '../util/assert';

import {assertLViewOrUndefined, assertTNodeForLView, assertTNodeForTView} from './assert';
import {DirectiveDef} from './interfaces/definition';
import {TNode, TNodeType} from './interfaces/node';
import {
  CONTEXT,
  DECLARATION_VIEW,
  HEADER_OFFSET,
  LView,
  OpaqueViewState,
  T_HOST,
  TData,
  TVIEW,
  TView,
  TViewType,
} from './interfaces/view';
import {MATH_ML_NAMESPACE, SVG_NAMESPACE} from './namespaces';
import {getTNode, walkUpViews} from './util/view_utils';

/**
 *
 */
interface LFrame {
  /**
   * 상위 LFrame.
   *
   * `leaveView`가 호출될 때 이전 상태를 복원하는 데 필요합니다.
   */
  parent: LFrame;

  /**
   * 하위 LFrame.
   *
   * 메모리 압박을 해소하기 위해 기존 LFrames를 캐시하는 데 사용됩니다.
   */
  child: LFrame | null;

  /**
   * 현재 처리 중인 뷰의 상태.
   *
   * 노드(텍스트, 요소, 컨테이너 등), 파이프, 바인딩 및 호출 간에 저장되어야 하는
   * 로컬 변수를 포함한 배열입니다.
   */
  lView: LView;

  /**
   * `LFrame.lView`와 관련된 현재 `TView`.
   *
   * `lFrame[TVIEW]`에서 `TView`를 가져올 수 있지만, 너무 일반적이기 때문에
   * 성능 이유로 `LFrame`에 저장하는 것이 좋습니다.
   */
  tView: TView;

  /**
   * 노드가 생성될 때 부모 속성을 설정하고 쿼리 결과를 추적하는 데 사용됩니다.
   *
   * `isParent`와 함께 사용됩니다.
   */
  currentTNode: TNode | null;

  /**
   * `isParent`가 다음과 같은 경우:
   *  - `true`: `currentTNode`는 부모 노드를 가리킵니다.
   *  - `false`: `currentTNode`는 이전 노드(형제)를 가리킵니다.
   */
  isParent: boolean;

  /**
   * LView에서 현재 선택된 요소의 인덱스.
   *
   * 바인딩 지침이 사용합니다. 고급 지침의 일부로 업데이트됩니다.
   */
  selectedIndex: number;

  /**
   * 바인딩 인덱스에 대한 현재 포인터.
   */
  bindingIndex: number;

  /**
   * nextContext()에 의해 검색된 마지막 viewData.
   * nextContext() 및 reference() 호출을 구축할 수 있게 합니다.
   *
   * 예: const inner = x().$implicit; const outer = x().$implicit;
   */
  contextLView: LView | null;

  /**
   * 요소 깊이 수를 저장합니다. 이는 템플릿의 루트 요소를 식별하는 데 사용되어
   * 이후에 패치 데이터를 특정 요소에만 연결할 수 있도록 합니다. 우리는
   * 패치 데이터가 변경될 수 있는 유일한 장소가 그곳이라는 것을 알고 있기 때문에,
   * 패치가 발생하는 장소의 수를 줄일 수 있습니다.
   */
  elementDepthCount: number;

  /**
   * 요소를 생성할 때 사용할 현재 네임스페이스
   */
  currentNamespace: string | null;

  /**
   * 순수 함수 지침이 바인딩 인덱스를 계산해야 하는 루트 인덱스입니다.
   * 컴포넌트 뷰에서는 TView.bindingStartIndex입니다. 호스트 바인딩
   * 컨텍스트에서는 TView.expandoStartIndex + 주어진 dir 이전의 모든 dirs/hostVars입니다.
   */
  bindingRootIndex: number;

  /**
   * 다음에 처리해야 할 쿼리 또는 콘텐츠 쿼리의 현재 인덱스입니다.
   * 우리는 쿼리 목록을 반복하고 매 단계마다 현재 쿼리 인덱스를 증가시킵니다.
   */
  currentQueryIndex: number;

  /**
   * 호스트 바인딩이 실행될 때 이 값은 지시어 인덱스를 가리킵니다.
   * `TView.data[currentDirectiveIndex]`는 `DirectiveDef`
   * `LView[currentDirectiveIndex]`는 지시어 인스턴스입니다.
   */
  currentDirectiveIndex: number;

  /**
   * `ɵɵelementStart`와 `ɵɵelementEnd`로 표시된 i18n 블록의 중간에 있는지 여부입니다.
   *
   * 이 정보는 i18n 블록 내에서 모든 요소가 번역에서 미리 선언되어야 하기 때문에 필요합니다.
   * (예: `Hello �#2�World�/#2�!`는 `�#2�` 위치에 요소를 미리 선언합니다.)
   * 이는 위치 `2`에 `TNodeType.Placeholder` 요소를 할당합니다. 번역자가
   * 번역에서 `�#2�`를 제거하면 런타임은 위치 `2`에 요소가 삽입되지 않는지 확인해야 합니다.
   * 번역에는 삭제된 요소에 대한 정보가 포함되지 않습니다. 따라서 요소가 삭제되었다는 것을
   * 아는 유일한 방법은 번역에서 미리 선언되지 않았다는 것입니다.
   *
   * 이 플래그는 미리 선언 없이 생성된 요소
   * (`TNodeType.Placeholder`)가 DOM 렌더 트리에 삽입되지 않도록 보장하여 작동합니다.
   * (즉, 요소가 여전히 모든 동작 [지시어]와 함께 인스턴스화된다는 것을 의미합니다.)
   */
  inI18n: boolean;
}

/**
 * 모든 암시적 지침 상태는 여기 저장됩니다.
 *
 * 모든 상태가 저장되는 단일 객체를 갖는 것이 정신 모델로서 유용합니다
 * (여러 다른 변수에 분산되어 있는 것보다).
 *
 * 성능 주의: 실제 전역 변수에 쓰는 것은
 * 속성이 있는 중간 객체를 사용하는 것보다 느립니다.
 */
interface InstructionState {
  /**
   * 현재 `LFrame`
   *
   * `enterView`를 호출하지 않았다면 `null`
   */
  lFrame: LFrame;

  /**
   * 지시어가 요소와 일치해야 하는지 여부를 저장합니다.
   *
   * 템플릿이 `ngNonBindable`을 포함하면 해당 요소의 자식에
   * 지시어가 일치하지 않도록 런타임을 방지해야 합니다.
   *
   * 예시:
   * ```html
   * <my-comp my-directive>
   *   컴포넌트 / 지시어와 일치해야 합니다.
   * </my-comp>
   * <div ngNonBindable>
   *   <my-comp my-directive>
   *     ngNonBindable에 있기 때문에 컴포넌트 / 지시어와 일치해서는 안 됩니다.
   *   </my-comp>
   * </div>
   * ```
   */
  bindingsEnabled: boolean;

  /**
   * 나중에 참조할 'ngSkipHydration' 속성이 있는 루트 TNode를 저장합니다.
   *
   * 예시:
   * ```html
   * <my-comp ngSkipHydration>
   *   이 루트 노드를 참조해야 합니다.
   * </my-comp>
   * ```
   */
  skipHydrationRootTNode: TNode | null;
}

const instructionState: InstructionState = {
  lFrame: createLFrame(null),
  bindingsEnabled: true,
  skipHydrationRootTNode: null,
};

export enum CheckNoChangesMode {
  Off,
  Exhaustive,
  OnlyDirtyViews,
}

/**
 * 이 모드에서는 바인딩의 변경이 있을 경우 ExpressionChangedAfterChecked 오류가 발생합니다.
 *
 * ChangeDetectorRef.checkNoChanges()를 지원하기 위해 필요합니다.
 *
 * `checkNoChanges` 함수는 ngDevMode=true 시에만 호출되며
 * 변경 감지기나 그 자식에 의도하지 않은 변경이 없는지 확인합니다.
 */
let _checkNoChangesMode: CheckNoChangesMode = 0; /* CheckNoChangesMode.Off */

/**
 * 뷰에서 변경 감지를 실행하는 중임을 나타내는 플래그입니다.
 *
 * @see detectChangesInViewWhileDirty
 */
let _isRefreshingViews = false;

/**
 * 지침 상태 스택이 비어 있다면 true를 반환합니다.
 *
 * 테스트에서만 호출되도록 의도되었습니다 (그렇지 않으면 트리에서 제외됩니다).
 */
export function specOnlyIsInstructionStateEmpty(): boolean {
  return instructionState.lFrame.parent === null;
}

export function getElementDepthCount() {
  return instructionState.lFrame.elementDepthCount;
}

export function increaseElementDepthCount() {
  instructionState.lFrame.elementDepthCount++;
}

export function decreaseElementDepthCount() {
  instructionState.lFrame.elementDepthCount--;
}

export function getBindingsEnabled(): boolean {
  return instructionState.bindingsEnabled;
}

/**
 * 현재 스킵 수화 블록 내에 있다면 true를 반환합니다.
 * @returns boolean
 */
export function isInSkipHydrationBlock(): boolean {
  return instructionState.skipHydrationRootTNode !== null;
}

/**
 * 이것이 스킵 수화 블록의 루트 TNode인지 여부를 반환합니다.
 * @param tNode 현재 TNode
 * @returns boolean
 */
export function isSkipHydrationRootTNode(tNode: TNode): boolean {
  return instructionState.skipHydrationRootTNode === tNode;
}

/**
 * 요소에서 지시어 매칭을 활성화합니다.
 *
 *  * 예시:
 * ```html
 * <my-comp my-directive>
 *   컴포넌트 / 지시어와 일치해야 합니다.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- ɵɵdisableBindings() -->
 *   <my-comp my-directive>
 *     ngNonBindable에 있기 때문에 컴포넌트 / 지시어와 일치해서는 안 됩니다.
 *   </my-comp>
 *   <!-- ɵɵenableBindings() -->
 * </div>
 * ```
 *
 * @codeGenApi
 */
export function ɵɵenableBindings(): void {
  instructionState.bindingsEnabled = true;
}

/**
 * TNode가 스킵 수화 블록에 있음을 나타내는 플래그를 설정합니다.
 * @param tNode 현재 TNode
 */
export function enterSkipHydrationBlock(tNode: TNode): void {
  instructionState.skipHydrationRootTNode = tNode;
}

/**
 * 요소에서 지시어 매칭을 비활성화합니다.
 *
 *  * 예시:
 * ```html
 * <my-comp my-directive>
 *   컴포넌트 / 지시어와 일치해야 합니다.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- ɵɵdisableBindings() -->
 *   <my-comp my-directive>
 *     ngNonBindable에 있기 때문에 컴포넌트 / 지시어와 일치해서는 안 됩니다.
 *   </my-comp>
 *   <!-- ɵɵenableBindings() -->
 * </div>
 * ```
 *
 * @codeGenApi
 */
export function ɵɵdisableBindings(): void {
  instructionState.bindingsEnabled = false;
}

/**
 * 스킵 수화 블록을 떠날 때 루트 스킵 수화 노드를 지웁니다.
 */
export function leaveSkipHydrationBlock(): void {
  instructionState.skipHydrationRootTNode = null;
}

/**
 * 현재 `LView`를 반환합니다.
 */
export function getLView<T>(): LView<T> {
  return instructionState.lFrame.lView as LView<T>;
}

/**
 * 현재 `TView`를 반환합니다.
 */
export function getTView(): TView {
  return instructionState.lFrame.tView;
}

/**
 * 주어진 OpaqueViewState 인스턴스에 `contextViewData`를 복원합니다.
 *
 * 현재 뷰의 스냅샷을 저장하고 리스너가 호출될 때 복원하기 위해
 * getCurrentView() 지침과 함께 사용됩니다. 이로써
 * 리스너에서 부모 뷰에서 변수를 가져오기 위해 선언 뷰 트리를 탐색할 수 있게 됩니다.
 *
 * @param viewToRestore 복원할 OpaqueViewState 인스턴스
 * @returns 복원된 OpaqueViewState 인스턴스의 컨텍스트
 *
 * @codeGenApi
 */
export function ɵɵrestoreView<T = any>(viewToRestore: OpaqueViewState): T {
  instructionState.lFrame.contextLView = viewToRestore as any as LView;
  return (viewToRestore as any as LView)[CONTEXT] as unknown as T;
}

/**
 * `ɵɵrestoreView`에서 설정된 뷰를 메모리에서 지웁니다. 전달된 값을 반환하여
 * 지침의 반환 값으로 사용할 수 있습니다.
 *
 * @codeGenApi
 */
export function ɵɵresetView<T>(value?: T): T | undefined {
  instructionState.lFrame.contextLView = null;
  return value;
}

export function getCurrentTNode(): TNode | null {
  let currentTNode = getCurrentTNodePlaceholderOk();
  while (currentTNode !== null && currentTNode.type === TNodeType.Placeholder) {
    currentTNode = currentTNode.parent;
  }
  return currentTNode;
}

export function getCurrentTNodePlaceholderOk(): TNode | null {
  return instructionState.lFrame.currentTNode;
}

export function getCurrentParentTNode(): TNode | null {
  const lFrame = instructionState.lFrame;
  const currentTNode = lFrame.currentTNode;
  return lFrame.isParent ? currentTNode : currentTNode!.parent;
}

export function setCurrentTNode(tNode: TNode | null, isParent: boolean) {
  ngDevMode && tNode && assertTNodeForTView(tNode, instructionState.lFrame.tView);
  const lFrame = instructionState.lFrame;
  lFrame.currentTNode = tNode;
  lFrame.isParent = isParent;
}

export function isCurrentTNodeParent(): boolean {
  return instructionState.lFrame.isParent;
}

export function setCurrentTNodeAsNotParent(): void {
  instructionState.lFrame.isParent = false;
}

export function getContextLView(): LView {
  const contextLView = instructionState.lFrame.contextLView;
  ngDevMode && assertDefined(contextLView, 'contextLView must be defined.');
  return contextLView!;
}

export function isInCheckNoChangesMode(): boolean {
  !ngDevMode && throwError('Must never be called in production mode');
  return _checkNoChangesMode !== CheckNoChangesMode.Off;
}

export function isExhaustiveCheckNoChanges(): boolean {
  !ngDevMode && throwError('Must never be called in production mode');
  return _checkNoChangesMode === CheckNoChangesMode.Exhaustive;
}

export function setIsInCheckNoChangesMode(mode: CheckNoChangesMode): void {
  !ngDevMode && throwError('Must never be called in production mode');
  _checkNoChangesMode = mode;
}

export function isRefreshingViews(): boolean {
  return _isRefreshingViews;
}

export function setIsRefreshingViews(mode: boolean): boolean {
  const prev = _isRefreshingViews;
  _isRefreshingViews = mode;
  return prev;
}

// 성능 이유로 최상위 변수는 내보내면 안 됩니다 (PERF_NOTES.md)
export function getBindingRoot() {
  const lFrame = instructionState.lFrame;
  let index = lFrame.bindingRootIndex;
  if (index === -1) {
    index = lFrame.bindingRootIndex = lFrame.tView.bindingStartIndex;
  }
  return index;
}

export function getBindingIndex(): number {
  return instructionState.lFrame.bindingIndex;
}

export function setBindingIndex(value: number): number {
  return (instructionState.lFrame.bindingIndex = value);
}

export function nextBindingIndex(): number {
  return instructionState.lFrame.bindingIndex++;
}

export function incrementBindingIndex(count: number): number {
  const lFrame = instructionState.lFrame;
  const index = lFrame.bindingIndex;
  lFrame.bindingIndex = lFrame.bindingIndex + count;
  return index;
}

export function isInI18nBlock() {
  return instructionState.lFrame.inI18n;
}

export function setInI18nBlock(isInI18nBlock: boolean): void {
  instructionState.lFrame.inI18n = isInI18nBlock;
}

/**
 * 호스트 템플릿 함수가 실행될 수 있도록 새 바인딩 루트 인덱스를 설정합니다.
 *
 * 호스트 템플릿 내의 바인딩은 인덱스 0입니다. 그러나 사전에 얼마나 많은 호스트 바인딩이 있는지 알 수 없기 때문에
 * 미리 계산할 수 없습니다. 이러한 이유로 모든 것이 인덱스 0이 되어 다음 사용 가능한 위치와 일치하도록 루트를 이동합니다.
 *
 * @param bindingRootIndex `hostBindings`의 루트 인덱스
 * @param currentDirectiveIndex 지시어의 `hostBindings`가 처리되고 있는 현재 지시어의 지표
 */
export function setBindingRootForHostBindings(
  bindingRootIndex: number,
  currentDirectiveIndex: number,
) {
  const lFrame = instructionState.lFrame;
  lFrame.bindingIndex = lFrame.bindingRootIndex = bindingRootIndex;
  setCurrentDirectiveIndex(currentDirectiveIndex);
}

/**
 * 호스트 바인딩이 실행될 때 이 값은 지시어 인덱스를 가리킵니다.
 * `TView.data[getCurrentDirectiveIndex()]`는 `DirectiveDef`
 * `LView[getCurrentDirectiveIndex()]`는 지시어 인스턴스입니다.
 */
export function getCurrentDirectiveIndex(): number {
  return instructionState.lFrame.currentDirectiveIndex;
}

/**
 * 처리 중인 `hostBindings`의 지시어 인덱스를 설정합니다.
 *
 * @param currentDirectiveIndex 현재 지시어 인스턴스를 찾을 수 있는 `TData` 인덱스.
 */
export function setCurrentDirectiveIndex(currentDirectiveIndex: number): void {
  instructionState.lFrame.currentDirectiveIndex = currentDirectiveIndex;
}

/**
 * `hostBindings` 지침이 실행될 때 활성화된 현재 `DirectiveDef`를 조회합니다.
 *
 * @param tData `DirectiveDef`를 조회할 현재 `TData`.
 */
export function getCurrentDirectiveDef(tData: TData): DirectiveDef<any> | null {
  const currentDirectiveIndex = instructionState.lFrame.currentDirectiveIndex;
  return currentDirectiveIndex === -1 ? null : (tData[currentDirectiveIndex] as DirectiveDef<any>);
}

export function getCurrentQueryIndex(): number {
  return instructionState.lFrame.currentQueryIndex;
}

export function setCurrentQueryIndex(value: number): void {
  instructionState.lFrame.currentQueryIndex = value;
}

/**
 * 현재 `LView`가 선언된 위치의 `TNode`를 반환합니다.
 *
 * @param lView 부모 `TNode`를 찾고자 하는 `LView`.
 */
function getDeclarationTNode(lView: LView): TNode | null {
  const tView = lView[TVIEW];

  // 내장 뷰에 대한 선언 부모를 반환합니다.
  if (tView.type === TViewType.Embedded) {
    ngDevMode && assertDefined(tView.declTNode, 'Embedded TNodes should have declaration parents.');
    return tView.declTNode;
  }

  // 컴포넌트는 각 컴포넌트 인스턴스가 서로 다른 위치에 삽입될 수 있기 때문에
  // `TView.declTNode`를 가지고 있지 않습니다. 따라서 컴포넌트 경계를 넘기 위해 `T_HOST`로 돌아갑니다.
  if (tView.type === TViewType.Component) {
    return lView[T_HOST];
  }

  // 나머지 TNode 유형은 부모 TNode가 없는 `TViewType.Root`입니다.
  return null;
}

/**
 * DI 시스템에서 필요한 `enterView`의 경량 버전입니다.
 *
 * @param lView DI 컨텍스트의 `LView` 위치입니다.
 * @param tNode DI 컨텍스트의 `TNode`
 * @param flags DI 컨텍스트 플래그. `SkipSelf` 플래그가 설정된 경우 `tNode`에서
 *     부모의 선언된 `TElementNode`를 찾을 때까지 선언 트리를 올라갑니다.
 * @returns `tNode`와 연관된 DI에 성공적으로 들어갔으면 `true`. DI에 들어가지 못하면
 *     관련된 `NodeInjector`를 찾을 수 없으며, 대신 `ModuleInjector`를 사용해야 합니다.
 *     - `true`인 경우 이 호출은 `leaveDI`에 의해 따라야 하며
 *     - `false`인 경우 이 호출이 실패했음을 나타내며 `leaveDI`를 호출하면 안 됩니다.
 */
export function enterDI(lView: LView, tNode: TNode, flags: InternalInjectFlags) {
  ngDevMode && assertLViewOrUndefined(lView);

  if (flags & InternalInjectFlags.SkipSelf) {
    ngDevMode && assertTNodeForTView(tNode, lView[TVIEW]);

    let parentTNode = tNode as TNode | null;
    let parentLView = lView;

    while (true) {
      ngDevMode && assertDefined(parentTNode, 'Parent TNode should be defined');
      parentTNode = parentTNode!.parent as TNode | null;
      if (parentTNode === null && !(flags & InternalInjectFlags.Host)) {
        parentTNode = getDeclarationTNode(parentLView);
        if (parentTNode === null) break;

        // 이 경우 부모가 존재하며 반드시 요소입니다. 따라서
        // 선언 뷰로서 기존 lView가 반드시 정의된 것으로 가정할 수 있습니다.
        ngDevMode && assertDefined(parentLView, 'Parent LView should be defined');
        parentLView = parentLView[DECLARATION_VIEW]!;

        // Ivy에서는 ngIf 및 NgFor 내장 지시어에 해당하는 주석 노드가 있습니다.
        // 우리는 그것들을 건너뛰고 요소와 요소 컨테이너만 찾아 진정한 부모 노드를
        // 탐색하려고 합니다.
        if (parentTNode.type & (TNodeType.Element | TNodeType.ElementContainer)) {
          break;
        }
      } else {
        break;
      }
    }
    if (parentTNode === null) {
      // 부모 TNode를 찾지 못했다면 모듈 인젝터를 사용해야 함을 나타냅니다.
      return false;
    } else {
      tNode = parentTNode;
      lView = parentLView;
    }
  }

  ngDevMode && assertTNodeForLView(tNode, lView);
  const lFrame = (instructionState.lFrame = allocLFrame());
  lFrame.currentTNode = tNode;
  lFrame.lView = lView;

  return true;
}

/**
 * 현재 lView를 새 lView로 전환합니다.
 *
 * 성능 이유로 모듈의 최상위에 lView를 저장합니다.
 * 이렇게 하면 읽어야 할 속성 수를 최소화할 수 있습니다. 새로운 뷰에 들어갈 때
 * lView를 저장하고 뷰를 나갈 때 상태를 복원해야 합니다.
 *
 * @param newView 활성화될 새 lView
 * @returns 이전에 활성화된 lView;
 */
export function enterView(newView: LView): void {
  ngDevMode && assertNotEqual(newView[0], newView[1] as any, '????');
  ngDevMode && assertLViewOrUndefined(newView);
  const newLFrame = allocLFrame();
  if (ngDevMode) {
    assertEqual(newLFrame.isParent, true, 'Expected clean LFrame');
    assertEqual(newLFrame.lView, null, 'Expected clean LFrame');
    assertEqual(newLFrame.tView, null, 'Expected clean LFrame');
    assertEqual(newLFrame.selectedIndex, -1, 'Expected clean LFrame');
    assertEqual(newLFrame.elementDepthCount, 0, 'Expected clean LFrame');
    assertEqual(newLFrame.currentDirectiveIndex, -1, 'Expected clean LFrame');
    assertEqual(newLFrame.currentNamespace, null, 'Expected clean LFrame');
    assertEqual(newLFrame.bindingRootIndex, -1, 'Expected clean LFrame');
    assertEqual(newLFrame.currentQueryIndex, 0, 'Expected clean LFrame');
  }
  const tView = newView[TVIEW];
  instructionState.lFrame = newLFrame;
  ngDevMode && tView.firstChild && assertTNodeForTView(tView.firstChild, tView);
  newLFrame.currentTNode = tView.firstChild!;
  newLFrame.lView = newView;
  newLFrame.tView = tView;
  newLFrame.contextLView = newView;
  newLFrame.bindingIndex = tView.bindingStartIndex;
  newLFrame.inI18n = false;
}

/**
 * 다음의 무료 LFrame을 할당합니다. 이 함수는 메모리 압박을 낮추기 위해 `LFrame`s를 재사용하려고 합니다.
 */
function allocLFrame() {
  const currentLFrame = instructionState.lFrame;
  const childLFrame = currentLFrame === null ? null : currentLFrame.child;
  const newLFrame = childLFrame === null ? createLFrame(currentLFrame) : childLFrame;
  return newLFrame;
}

function createLFrame(parent: LFrame | null): LFrame {
  const lFrame: LFrame = {
    currentTNode: null,
    isParent: true,
    lView: null!,
    tView: null!,
    selectedIndex: -1,
    contextLView: null,
    elementDepthCount: 0,
    currentNamespace: null,
    currentDirectiveIndex: -1,
    bindingRootIndex: -1,
    bindingIndex: -1,
    currentQueryIndex: 0,
    parent: parent!,
    child: null,
    inI18n: false,
  };
  parent !== null && (parent.child = lFrame); // 재사용을 위해 새로운 LFrame을 연결합니다.
  return lFrame;
}

/**
 * DI와 함께 사용되는 leave의 경량 버전입니다.
 *
 * 이 함수는 DI와 함께 사용되는 유일한 속성인 `currentTNode`와 `LView`만 재설정합니다.
 *
 * 주의: 이 함수는 `leaveDI`로 재export됩니다. 그러나 `leaveDI`는 `void`의 반환 타입을 가지므로 `leaveViewLight`는 `LFrame`을 가집니다.
 * `leaveViewLight`를 `leaveView`에서 사용할 수 있도록 하기 위함입니다.
 */
function leaveViewLight(): LFrame {
  const oldLFrame = instructionState.lFrame;
  instructionState.lFrame = oldLFrame.parent;
  oldLFrame.currentTNode = null!;
  oldLFrame.lView = null!;
  return oldLFrame;
}

/**
 * DI 시스템에서 필요한 `leaveView`의 경량 버전입니다.
 *
 * 주의: 이 함수는 별칭으로, 반환 타입을 `void`로 변경할 수 있도록 합니다.
 */
export const leaveDI: () => void = leaveViewLight;

/**
 * 현재 `LView`를 떠납니다.
 *
 * 이 작업은 연결된 `LView`와 함께 `LFrame`을 스택에서 팝합니다.
 *
 * 중요: 여기서 `LFrame` 값을 0으로 설정하지 않으면 값이 유지됩니다. 성능 이유로
 * `LFrame`을 해제하지 않기 때문이며, 다음 사용을 위해 유지합니다.
 */
export function leaveView() {
  const oldLFrame = leaveViewLight();
  oldLFrame.isParent = true;
  oldLFrame.tView = null!;
  oldLFrame.selectedIndex = -1;
  oldLFrame.contextLView = null;
  oldLFrame.elementDepthCount = 0;
  oldLFrame.currentDirectiveIndex = -1;
  oldLFrame.currentNamespace = null;
  oldLFrame.bindingRootIndex = -1;
  oldLFrame.bindingIndex = -1;
  oldLFrame.currentQueryIndex = 0;
}

export function nextContextImpl<T = any>(level: number): T {
  const contextLView = (instructionState.lFrame.contextLView = walkUpViews(
    level,
    instructionState.lFrame.contextLView!,
  ));
  return contextLView[CONTEXT] as unknown as T;
}

/**
 * 현재 선택된 요소 인덱스를 가져옵니다.
 *
 * 현재 `LView`에서 작동할 인덱스를 식별하기 위해 {@link property} 지침(및 향후 더 많은)에 사용됩니다.
 */
export function getSelectedIndex() {
  return instructionState.lFrame.selectedIndex;
}

/**
 * {@link select}에 전달된 가장 최근 인덱스를 설정합니다.
 *
 * 현재 `LView`에서 작동할 인덱스를 식별하기 위해 {@link property} 지침(및 향후 더 많은)에 사용됩니다.
 *
 * (이전에 "exit 함수"가 설정되었다면(`setElementExitFn()`을 통해) 제공된 `index` 값이
 * 현재 선택된 인덱스 값과 다르면 그 함수가 실행됩니다.)
 */
export function setSelectedIndex(index: number) {
  ngDevMode &&
    index !== -1 &&
    assertGreaterThanOrEqual(index, HEADER_OFFSET, 'Index must be past HEADER_OFFSET (or -1).');
  ngDevMode &&
    assertLessThan(
      index,
      instructionState.lFrame.lView.length,
      "Can't set index passed end of LView",
    );
  instructionState.lFrame.selectedIndex = index;
}

/**
 * 현재 선택된 요소를 나타내는 `tNode`를 가져옵니다.
 */
export function getSelectedTNode() {
  const lFrame = instructionState.lFrame;
  return getTNode(lFrame.tView, lFrame.selectedIndex);
}

/**
 * 요소를 생성하는 데 사용되는 네임스페이스를 `'http://www.w3.org/2000/svg'`로 설정합니다.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceSVG() {
  instructionState.lFrame.currentNamespace = SVG_NAMESPACE;
}

/**
 * 요소를 생성하는 데 사용되는 네임스페이스를 `'http://www.w3.org/1998/MathML/'`로 설정합니다.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceMathML() {
  instructionState.lFrame.currentNamespace = MATH_ML_NAMESPACE;
}

/**
 * 요소를 생성하는 데 사용되는 네임스페이스를 `null`로 설정하여
 * `createElementNS` 대신 `createElement`를 사용하도록 강제합니다.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceHTML() {
  namespaceHTMLInternal();
}

/**
 * 요소를 생성하는 데 사용되는 네임스페이스를 `null`로 설정하여
 * `createElementNS` 대신 `createElement`를 사용하도록 강제합니다.
 */
export function namespaceHTMLInternal() {
  instructionState.lFrame.currentNamespace = null;
}

export function getNamespace(): string | null {
  return instructionState.lFrame.currentNamespace;
}

let _wasLastNodeCreated = true;

/**
 * 가장 최근의 DOM 노드가 생성되었거나 수화되었는지를 나타내는 전역 플래그를 검색합니다.
 */
export function wasLastNodeCreated(): boolean {
  return _wasLastNodeCreated;
}

/**
 * 가장 최근의 DOM 노드가 생성되었거나 수화되었음을 나타내는 전역 플래그를 설정합니다.
 */
export function lastNodeWasCreated(flag: boolean): void {
  _wasLastNodeCreated = flag;
}
