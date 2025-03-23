/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import '../util/ng_dev_mode';

import {assertDefined, assertDomNode} from '../util/assert';
import {EMPTY_ARRAY} from '../util/empty';

import {assertLView} from './assert';
import {LContext} from './interfaces/context';
import {getLViewById, registerLView} from './interfaces/lview_tracking';
import {TNode} from './interfaces/node';
import {RElement, RNode} from './interfaces/renderer_dom';
import {isComponentHost, isLView} from './interfaces/type_checks';
import {CONTEXT, HEADER_OFFSET, HOST, ID, LView, TVIEW} from './interfaces/view';
import {getComponentLViewByIndex, unwrapRNode} from './util/view_utils';

/**
 * 주어진 DOM 노드, 지시어 또는 컴포넌트 인스턴스에 대한 일치하는 `LContext` 데이터를 반환합니다.
 *
 * 이 함수는 제공된 DOM 요소, 컴포넌트 또는 지시어 인스턴스의
 * 몽키 패치된 속성을 검사하여 `LContext` 데이터를 유도합니다. 한번 호출되면 몽키 패치된
 * 값은 새로 생성된 `LContext`의 값이 됩니다.
 *
 * 몽키 패치된 값이 `LView` 인스턴스인 경우 해당
 * 대상에 대한 컨텍스트 값이 생성되며 몽키 패치 참조가 업데이트됩니다. 따라서 이
 * 함수가 호출되면 제공된 요소, 컴포넌트 또는 관련된
 * 지시어의 몽키 패치 값을 변경할 수 있습니다.
 *
 * 몽키 패치된 값이 감지되지 않으면 코드는 DOM을 위로 올라가며 몽키 패치 참조를 포함하는 요소를 찾습니다.
 * 그런 일이 발생하면 제공된 요소가 새 컨텍스트로 업데이트됩니다(그 후 반환됨). 컴포넌트/지시어 인스턴스의
 * 몽키 패치 값이 감지되지 않으면 오류가 발생합니다(모든 컴포넌트와
 * 지시어는 ivy에 의해 자동으로 몽키 패치되어야 함).
 *
 * @param target 컴포넌트, 지시어 또는 DOM 노드.
 */
export function getLContext(target: any): LContext | null {
  let mpValue = readPatchedData(target);
  if (mpValue) {
    // 배열일 경우에만 LView 인스턴스로 간주됨
    // ... 그렇지 않으면 이미 구성된 LContext 인스턴스
    if (isLView(mpValue)) {
      const lView: LView = mpValue!;
      let nodeIndex: number;
      let component: any = undefined;
      let directives: any[] | null | undefined = undefined;

      if (isComponentInstance(target)) {
        nodeIndex = findViaComponent(lView, target);
        if (nodeIndex == -1) {
          throw new Error('제공된 컴포넌트를 애플리케이션에서 찾을 수 없습니다.');
        }
        component = target;
      } else if (isDirectiveInstance(target)) {
        nodeIndex = findViaDirective(lView, target);
        if (nodeIndex == -1) {
          throw new Error('제공된 지시어를 애플리케이션에서 찾을 수 없습니다.');
        }
        directives = getDirectivesAtNodeIndex(nodeIndex, lView);
      } else {
        nodeIndex = findViaNativeElement(lView, target as RElement);
        if (nodeIndex == -1) {
          return null;
        }
      }

      // 목표는 데이터로 가득 찬 전체 컨텍스트를 채우지 않는 것입니다. 검색이
      // 비용이 많이 들기 때문입니다. 대신, 목표 데이터(요소, 컴포넌트, 컨테이너, ICU
      // 표현 또는 지시어 세부정보)만 컨텍스트에 채워집니다. 서로 다른 목표 값으로
      // 여러 번 호출되면 누락된 목표 데이터가 채워집니다.
      const native = unwrapRNode(lView[nodeIndex]);
      const existingCtx = readPatchedData(native);
      const context: LContext =
        existingCtx && !Array.isArray(existingCtx)
          ? existingCtx
          : createLContext(lView, nodeIndex, native);

      // 컴포넌트가 발견되면 몽키 패치를 업데이트합니다.
      if (component && context.component === undefined) {
        context.component = component;
        attachPatchData(context.component, context);
      }

      // 지시어가 발견되면 몽키 패치를 업데이트합니다.
      if (directives && context.directives === undefined) {
        context.directives = directives;
        for (let i = 0; i < directives.length; i++) {
          attachPatchData(directives[i], context);
        }
      }

      attachPatchData(context.native, context);
      mpValue = context;
    }
  } else {
    const rElement = target as RElement;
    ngDevMode && assertDomNode(rElement);

    // 컨텍스트를 찾을 수 없으면 DOM을 위로 이동해야 합니다.
    // 데이터로 이미 몽키 패치된 가장 가까운 요소를 찾기 위해
    let parent = rElement as any;
    while ((parent = parent.parentNode)) {
      const parentContext = readPatchedData(parent);
      if (parentContext) {
        const lView = Array.isArray(parentContext) ? (parentContext as LView) : parentContext.lView;

        // 다른 방법으로 애플리케이션의 끝에도 도달했습니다
        // (DOM이 수동으로 변경되었기 때문일 수 있음).
        if (!lView) {
          return null;
        }

        const index = findViaNativeElement(lView, rElement);
        if (index >= 0) {
          const native = unwrapRNode(lView[index]);
          const context = createLContext(lView, index, native);
          attachPatchData(native, context);
          mpValue = context;
          break;
        }
      }
    }
  }
  return (mpValue as LContext) || null;
}

/**
 * `LContext`의 빈 인스턴스를 생성합니다.
 */
function createLContext(lView: LView, nodeIndex: number, native: RNode): LContext {
  return new LContext(lView[ID], nodeIndex, native);
}

/**
 * 컴포넌트 인스턴스를 가져와 해당 컴포넌트의 뷰를 반환합니다.
 *
 * @param componentInstance
 * @returns 컴포넌트의 뷰
 */
export function getComponentViewByInstance(componentInstance: {}): LView {
  let patchedData = readPatchedData(componentInstance);
  let lView: LView;

  if (isLView(patchedData)) {
    const contextLView: LView = patchedData;
    const nodeIndex = findViaComponent(contextLView, componentInstance);
    lView = getComponentLViewByIndex(nodeIndex, contextLView);
    const context = createLContext(contextLView, nodeIndex, lView[HOST] as RElement);
    context.component = componentInstance;
    attachPatchData(componentInstance, context);
    attachPatchData(context.native, context);
  } else {
    const context = patchedData as unknown as LContext;
    const contextLView = context.lView!;
    ngDevMode && assertLView(contextLView);
    lView = getComponentLViewByIndex(context.nodeIndex, contextLView);
  }
  return lView;
}

/**
 * 이 속성은 요소, 컴포넌트 및 지시어에 몽키 패치됩니다.
 */
const MONKEY_PATCH_KEY_NAME = '__ngContext__';

export function attachLViewId(target: any, data: LView) {
  target[MONKEY_PATCH_KEY_NAME] = data[ID];
}

/**
 * 대상(컴포넌트, 지시어 또는 DOM 노드일 수 있음)에서
 * 현재 존재하는 몽키 패치 값 데이터를 반환합니다.
 */
export function readLView(target: any): LView | null {
  const data = readPatchedData(target);
  if (isLView(data)) {
    return data;
  }
  return data ? data.lView : null;
}

/**
 * 주어진 데이터(컴포넌트, 지시어 또는 DOM 노드 인스턴스일 수 있음)를
 * 몽키 패치를 사용하여 주어진 대상에 할당합니다.
 */
export function attachPatchData(target: any, data: LView | LContext) {
  ngDevMode && assertDefined(target, '대상이 예상됩니다.');
  // 메모리 누수를 방지하기 위해 보기의 ID만 연결합니다(참조 #41047). 우리는 이것만 수행합니다.
  // `LView`의 경우, 우리는 `LView`가 생성되고 파괴될 때를 제어할 수 있지만,
  // `LContext`를 언제 제거할지 알 수 없습니다.
  if (isLView(data)) {
    target[MONKEY_PATCH_KEY_NAME] = data[ID];
    registerLView(data);
  } else {
    target[MONKEY_PATCH_KEY_NAME] = data;
  }
}

/**
 * 주어진 대상(컴포넌트, 지시어 또는 DOM 노드일 수 있음)에서
 * 현재 존재하는 몽키 패치 값 데이터를 반환합니다.
 */
export function readPatchedData(target: any): LView | LContext | null {
  ngDevMode && assertDefined(target, '대상이 예상됩니다.');
  const data = target[MONKEY_PATCH_KEY_NAME];
  return typeof data === 'number' ? getLViewById(data) : data || null;
}

export function readPatchedLView<T>(target: any): LView<T> | null {
  const value = readPatchedData(target);
  if (value) {
    return (isLView(value) ? value : value.lView) as LView<T>;
  }
  return null;
}

export function isComponentInstance(instance: any): boolean {
  return instance && instance.constructor && instance.constructor.ɵcmp;
}

export function isDirectiveInstance(instance: any): boolean {
  return instance && instance.constructor && instance.constructor.ɵdir;
}

/**
 * 주어진 LView 내에서 요소를 찾아 일치하는 인덱스를 반환합니다.
 */
function findViaNativeElement(lView: LView, target: RElement): number {
  const tView = lView[TVIEW];
  for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
    if (unwrapRNode(lView[i]) === target) {
      return i;
    }
  }

  return -1;
}

/**
 * 다음 tNode(자식, 형제 또는 부모)를 찾습니다.
 */
function traverseNextElement(tNode: TNode): TNode | null {
  if (tNode.child) {
    return tNode.child;
  } else if (tNode.next) {
    return tNode.next;
  } else {
    // 다음 템플릿을 가져가 보겠습니다: <div><span>text</span></div><component/>
    // 텍스트 노드를 확인한 후 "다음" TNode가 있는 다음 상위를 찾아야 합니다.
    // 이 경우는 부모 `div`로, 그래서 컴포넌트를 찾을 수 있습니다.
    while (tNode.parent && !tNode.parent.next) {
      tNode = tNode.parent;
    }
    return tNode.parent && tNode.parent.next;
  }
}

/**
 * 주어진 LView 내에서 컴포넌트를 찾아 일치하는 인덱스를 반환합니다.
 */
function findViaComponent(lView: LView, componentInstance: {}): number {
  const componentIndices = lView[TVIEW].components;
  if (componentIndices) {
    for (let i = 0; i < componentIndices.length; i++) {
      const elementComponentIndex = componentIndices[i];
      const componentView = getComponentLViewByIndex(elementComponentIndex, lView);
      if (componentView[CONTEXT] === componentInstance) {
        return elementComponentIndex;
      }
    }
  } else {
    const rootComponentView = getComponentLViewByIndex(HEADER_OFFSET, lView);
    const rootComponent = rootComponentView[CONTEXT];
    if (rootComponent === componentInstance) {
      // 우리는 여기에서 루트 요소를 다루고 있으므로
      // 요소가 lView의 HEADER 데이터 이후의 첫 번째 요소임을 알고 있습니다.
      return HEADER_OFFSET;
    }
  }
  return -1;
}

/**
 * 주어진 LView 내에서 지시어를 찾아 일치하는 인덱스를 반환합니다.
 */
function findViaDirective(lView: LView, directiveInstance: {}): number {
  // 지시어가 몽키 패치되면 기본적으로
  // 현재 뷰의 LView에 대한 참조를 갖습니다.
  // 검색할 지시어가 바인딩된 요소는 뷰 데이터 어딘가에 위치하고 있습니다.
  // 우리는 노드를 반복하여 인스턴스를 위한 지시어 목록을 확인합니다.
  let tNode = lView[TVIEW].firstChild;
  while (tNode) {
    const directiveIndexStart = tNode.directiveStart;
    const directiveIndexEnd = tNode.directiveEnd;
    for (let i = directiveIndexStart; i < directiveIndexEnd; i++) {
      if (lView[i] === directiveInstance) {
        return tNode.index;
      }
    }
    tNode = traverseNextElement(tNode);
  }
  return -1;
}

/**
 * 특정 인덱스의 노드에 적용된 지시어 목록을 반환합니다. 목록에는
 * 선택자와 일치하는 지시어 및 모든 호스트 지시어가 포함되지만, 컴포넌트는 제외됩니다.
 * 노드에 적용된 컴포넌트를 찾으려면 `getComponentAtNodeIndex`를 사용하십시오.
 *
 * @param nodeIndex 노드 인덱스
 * @param lView 목표 뷰 데이터
 */
export function getDirectivesAtNodeIndex(nodeIndex: number, lView: LView): any[] | null {
  const tNode = lView[TVIEW].data[nodeIndex] as TNode;
  if (tNode.directiveStart === 0) return EMPTY_ARRAY;
  const results: any[] = [];
  for (let i = tNode.directiveStart; i < tNode.directiveEnd; i++) {
    const directiveInstance = lView[i];
    if (!isComponentInstance(directiveInstance)) {
      results.push(directiveInstance);
    }
  }
  return results;
}

export function getComponentAtNodeIndex(nodeIndex: number, lView: LView): {} | null {
  const tNode = lView[TVIEW].data[nodeIndex] as TNode;
  return isComponentHost(tNode) ? lView[tNode.directiveStart + tNode.componentOffset] : null;
}

/**
 * 주어진 요소에 존재하는 로컬 참조(로컬 참조 이름 => 요소 또는 지시어 인스턴스)의 맵을 반환합니다.
 */
export function discoverLocalRefs(lView: LView, nodeIndex: number): {[key: string]: any} | null {
  const tNode = lView[TVIEW].data[nodeIndex] as TNode;
  if (tNode && tNode.localNames) {
    const result: {[key: string]: any} = {};
    let localIndex = tNode.index + 1;
    for (let i = 0; i < tNode.localNames.length; i += 2) {
      result[tNode.localNames[i]] = lView[localIndex];
      localIndex++;
    }
    return result;
  }

  return null;
}
