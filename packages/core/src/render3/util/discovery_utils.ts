/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ChangeDetectionStrategy} from '../../change_detection/constants';
import {Injector} from '../../di/injector';
import {ViewEncapsulation} from '../../metadata/view';
import {assertLView} from '../assert';
import {
  discoverLocalRefs,
  getComponentAtNodeIndex,
  getDirectivesAtNodeIndex,
  getLContext,
  readPatchedLView,
} from '../context_discovery';
import {getComponentDef, getDirectiveDef} from '../def_getters';
import {NodeInjector} from '../di';
import {DirectiveDef} from '../interfaces/definition';
import {TElementNode, TNode, TNodeProviderIndexes} from '../interfaces/node';
import {isRootView} from '../interfaces/type_checks';
import {CLEANUP, CONTEXT, LView, TVIEW, TViewType} from '../interfaces/view';

import {getRootContext} from './view_traversal_utils';
import {getLViewParent, unwrapRNode} from './view_utils';

/**
 * 주어진 DOM 요소와 관련된 컴포넌트 인스턴스를 검색합니다.
 *
 * @usageNotes
 * 다음 DOM 구조를 고려하십시오:
 *
 * ```html
 * <app-root>
 *   <div>
 *     <child-comp></child-comp>
 *   </div>
 * </app-root>
 * ```
 *
 * `<child-comp>`에 대한 `getComponent`를 호출하면 이 DOM 요소와 관련된 `ChildComponent`의 인스턴스를 반환합니다.
 *
 * `<app-root>`에 대한 함수를 호출하면 `MyApp` 인스턴스를 반환합니다.
 *
 *
 * @param element 컴포넌트를 검색할 DOM 요소입니다.
 * @returns 요소와 연결된 컴포넌트 인스턴스 또는 연결된 컴포넌트가 없는 경우 `null`을 반환합니다.
 *
 * @publicApi
 */
export function getComponent<T>(element: Element): T | null {
  ngDevMode && assertDomElement(element);
  const context = getLContext(element);
  if (context === null) return null;

  if (context.component === undefined) {
    const lView = context.lView;
    if (lView === null) {
      return null;
    }
    context.component = getComponentAtNodeIndex(context.nodeIndex, lView);
  }

  return context.component as unknown as T;
}

/**
 * 임베디드 뷰(예: `*ngIf` 또는 `*ngFor`) 내에 있는 경우 요소가 포함된 임베디드
 * 뷰의 컨텍스트를 검색합니다. 그렇지 않으면 요소를 소유한 컴포넌트의 인스턴스를 검색합니다.
 * (이 경우 결과는 `getOwningComponent`를 호출하는 것과 동일합니다.)
 *
 * @param element 주위의 컴포넌트 인스턴스를 가져오기 위한 요소입니다.
 * @returns 요소 주위에 있는 컴포넌트의 인스턴스 또는 요소가 어떤 컴포넌트에도 속하지 않은 경우 null을 반환합니다.
 *
 * @publicApi
 */
export function getContext<T extends {}>(element: Element): T | null {
  assertDomElement(element);
  const context = getLContext(element)!;
  const lView = context ? context.lView : null;
  return lView === null ? null : (lView[CONTEXT] as T);
}

/**
 * DOM 요소를 포함하는 뷰의 컴포넌트 인스턴스를 검색합니다.
 *
 * 예를 들어, `<child-comp>`가 `<app-comp>`의 템플릿에서 사용되는 경우
 * (즉, `<app-comp>`의 `ViewChild`와 같이), `<child-comp>`에 대한 `getOwningComponent`를 호출하면
 * `<app-comp>`를 반환합니다.
 *
 * @param elementOrDir 루트 컴포넌트를 검색할 DOM 요소, 컴포넌트 또는 지시어 인스턴스입니다.
 * @returns DOM 요소의 뷰를 소유하는 컴포넌트 인스턴스 또는 요소가 컴포넌트 뷰의 일부가 아닌 경우 null을 반환합니다.
 *
 * @publicApi
 */
export function getOwningComponent<T>(elementOrDir: Element | {}): T | null {
  const context = getLContext(elementOrDir)!;
  let lView = context ? context.lView : null;
  if (lView === null) return null;

  let parent: LView | null;
  while (lView[TVIEW].type === TViewType.Embedded && (parent = getLViewParent(lView)!)) {
    lView = parent;
  }
  return isRootView(lView) ? null : (lView[CONTEXT] as unknown as T);
}

/**
 * DOM 요소, 지시어 또는 컴포넌트 인스턴스와 관련된 모든 루트 컴포넌트를 검색합니다.
 * 루트 컴포넌트는 Angular에서 부트스트랩된 컴포넌트입니다.
 *
 * @param elementOrDir 루트 컴포넌트를 검색할 DOM 요소, 컴포넌트 또는 지시어 인스턴스입니다.
 * @returns 대상 객체와 관련된 루트 컴포넌트입니다.
 *
 * @publicApi
 */
export function getRootComponents(elementOrDir: Element | {}): {}[] {
  const lView = readPatchedLView<{}>(elementOrDir);
  return lView !== null ? [getRootContext(lView)] : [];
}

/**
 * 요소, 컴포넌트 또는 지시어 인스턴스와 관련된 `Injector`를 검색합니다.
 *
 * @param elementOrDir 검색할 injector를 위한 DOM 요소, 컴포넌트 또는 지시어 인스턴스입니다.
 * @returns 요소, 컴포넌트 또는 지시어 인스턴스와 관련된 Injector입니다.
 *
 * @publicApi
 */
export function getInjector(elementOrDir: Element | {}): Injector {
  const context = getLContext(elementOrDir)!;
  const lView = context ? context.lView : null;
  if (lView === null) return Injector.NULL;

  const tNode = lView[TVIEW].data[context.nodeIndex] as TElementNode;
  return new NodeInjector(tNode, lView);
}

/**
 * 주어진 DOM 노드에서 주입 토큰 집합을 검색합니다.
 *
 * @param element 주입 토큰을 검색할 요소입니다.
 */
export function getInjectionTokens(element: Element): any[] {
  const context = getLContext(element)!;
  const lView = context ? context.lView : null;
  if (lView === null) return [];
  const tView = lView[TVIEW];
  const tNode = tView.data[context.nodeIndex] as TNode;
  const providerTokens: any[] = [];
  const startIndex = tNode.providerIndexes & TNodeProviderIndexes.ProvidersStartIndexMask;
  const endIndex = tNode.directiveEnd;
  for (let i = startIndex; i < endIndex; i++) {
    let value = tView.data[i];
    if (isDirectiveDefHack(value)) {
      // 우리가 때때로 Type와 DirectiveDef를 이 위치에 저장하는 것은
      // 설계 결함입니다. 우리는 항상 동일한 유형을 저장해야 모노모픽할 수 있습니다.
      // 문제는 컴포넌트/지시어의 경우 정의를 저장하지 않고 유형을 저장하기 때문입니다.
      // 올바른 동작은 항상 주입 가능한 유형을 이 위치에 저장해야 한다는 것입니다.
      value = value.type;
    }
    providerTokens.push(value);
  }
  return providerTokens;
}

/**
 * 주어진 DOM 노드와 관련된 지시어 인스턴스를 검색합니다. 컴포넌트 인스턴스는 포함되지 않습니다.
 *
 * @usageNotes
 * 다음 DOM 구조를 고려하십시오:
 *
 * ```html
 * <app-root>
 *   <button my-button></button>
 *   <my-comp></my-comp>
 * </app-root>
 * ```
 *
 * `<button>`에서 `getDirectives`를 호출하면 이 DOM 노드와 관련된 `MyButton`
 * 지시어의 인스턴스를 포함하는 배열을 반환합니다.
 *
 * `<my-comp>`에서 `getDirectives`를 호출하면 빈 배열을 반환합니다.
 *
 * @param node 지시어를 가져올 DOM 노드입니다.
 * @returns 노드와 관련된 지시어의 배열입니다.
 *
 * @publicApi
 */
export function getDirectives(node: Node): {}[] {
  // 텍스트 노드는 지시어와 연결될 수 없으므로 건너뜁니다.
  if (node instanceof Text) {
    return [];
  }

  const context = getLContext(node)!;
  const lView = context ? context.lView : null;
  if (lView === null) {
    return [];
  }

  const tView = lView[TVIEW];
  const nodeIndex = context.nodeIndex;
  if (!tView?.data[nodeIndex]) {
    return [];
  }
  if (context.directives === undefined) {
    context.directives = getDirectivesAtNodeIndex(nodeIndex, lView);
  }

  // 이 경우 `directives`는 `LComponentView`라는 이름이 붙은 배열입니다.
  // 결과를 복제하여 사용자 콘솔에 내부 데이터 구조를 노출하지 않도록 합니다.
  return context.directives === null ? [] : [...context.directives];
}

/**
 * 주어진 지시어 인스턴스를 위한 부분 메타데이터입니다.
 * 이 정보는 디버깅 목적이나 도구에 유용할 수 있습니다.
 * 현재는 `inputs`와 `outputs` 메타데이터만 사용할 수 있습니다.
 *
 * @publicApi
 */
export interface DirectiveDebugMetadata {
  inputs: Record<string, string>;
  outputs: Record<string, string>;
}

/**
 * 주어진 컴포넌트 인스턴스를 위한 부분 메타데이터입니다.
 * 이 정보는 디버깅 목적이나 도구에 유용할 수 있습니다.
 * 현재 다음 필드가 제공됩니다:
 *  - inputs
 *  - outputs
 *  - encapsulation
 *  - changeDetection
 *
 * @publicApi
 */
export interface ComponentDebugMetadata extends DirectiveDebugMetadata {
  encapsulation: ViewEncapsulation;
  changeDetection: ChangeDetectionStrategy;
}

/**
 * 특정 지시어 또는 컴포넌트 인스턴스에 대한 디버그(부분) 메타데이터를 반환합니다.
 * 이 함수는 지시어 또는 컴포넌트의 인스턴스를 수용하고 해당 메타데이터를 반환합니다.
 *
 * @param directiveOrComponentInstance 지시어 또는 컴포넌트 인스턴스입니다.
 * @returns 전달된 지시어 또는 컴포넌트의 메타데이터입니다.
 *
 * @publicApi
 */
export function getDirectiveMetadata(
  directiveOrComponentInstance: any,
): ComponentDebugMetadata | DirectiveDebugMetadata | null {
  const {constructor} = directiveOrComponentInstance;
  if (!constructor) {
    throw new Error('인스턴스 생성자를 찾을 수 없습니다.');
  }
  // 컴포넌트가 지시어로부터 상속되는 경우 지시어와 컴포넌트 메타데이터를 모두 가질 수 있습니다.
  // 지시어의 메타데이터를 받지 않도록 하기 위해 먼저 `getComponentDef`를 호출하고 싶습니다.
  const componentDef = getComponentDef(constructor);
  if (componentDef) {
    const inputs = extractInputDebugMetadata(componentDef.inputs);
    return {
      inputs,
      outputs: componentDef.outputs,
      encapsulation: componentDef.encapsulation,
      changeDetection: componentDef.onPush
        ? ChangeDetectionStrategy.OnPush
        : ChangeDetectionStrategy.Default,
    };
  }
  const directiveDef = getDirectiveDef(constructor);
  if (directiveDef) {
    const inputs = extractInputDebugMetadata(directiveDef.inputs);
    return {inputs, outputs: directiveDef.outputs};
  }
  return null;
}

/**
 * 로컬 참조의 맵을 검색합니다.
 *
 * 참조는 로컬 참조 이름을 요소 또는 지시어 인스턴스로 매핑한 맵으로 검색됩니다.
 *
 * @param target 로컬 참조를 검색할 DOM 요소, 컴포넌트 또는 지시어 인스턴스입니다.
 */
export function getLocalRefs(target: {}): {[key: string]: any} {
  const context = getLContext(target);
  if (context === null) return {};

  if (context.localRefs === undefined) {
    const lView = context.lView;
    if (lView === null) {
      return {};
    }
    context.localRefs = discoverLocalRefs(lView, context.nodeIndex);
  }

  return context.localRefs || {};
}

/**
 * 컴포넌트 또는 지시어 인스턴스의 호스트 요소를 검색합니다.
 * 호스트 요소는 지시어의 선택자와 일치하는 DOM 요소입니다.
 *
 * @param componentOrDirective 호스트 요소를 검색할 컴포넌트 또는 지시어 인스턴스입니다.
 * @returns 대상의 호스트 요소입니다.
 *
 * @publicApi
 */
export function getHostElement(componentOrDirective: {}): Element {
  return getLContext(componentOrDirective)!.native as unknown as Element;
}

/**
 * 주어진 컴포넌트에 대한 렌더링된 텍스트를 검색합니다.
 *
 * 이 함수는 컴포넌트의 호스트 요소를 검색한 다음
 * 해당 요소의 `textContent`를 반환합니다. 이는 반환된 텍스트에
 * 컴포넌트의 재투영된 콘텐츠가 포함됨을 의미합니다.
 *
 * @param component 콘텐츠 텍스트를 반환할 컴포넌트입니다.
 */
export function getRenderedText(component: any): string {
  const hostElement = getHostElement(component);
  return hostElement.textContent || '';
}

/**
 * `getListeners`에서 반환된 이벤트 리스너 구성입니다.
 * @publicApi
 */
export interface Listener {
  /** 이벤트 리스너의 이름. */
  name: string;
  /** 리스너가 바인딩된 요소. */
  element: Element;
  /** 이벤트가 발생할 때 호출되는 콜백. */
  callback: (value: any) => any;
  /** 리스너가 이벤트 캡처링을 사용하는지 여부. */
  useCapture: boolean;
  /**
   * 리스너 유형(예: 네이티브 DOM 이벤트 또는 사용자 정의 @Output).
   */
  type: 'dom' | 'output';
}

/**
 * DOM 요소와 관련된 이벤트 리스너 목록을 검색합니다. 이 목록에는 호스트 리스너가 포함되지만,
 * Angular 컨텍스트 외부에서 정의된 이벤트 리스너는 포함되지 않습니다
 * (예: `addEventListener`를 통해).
 *
 * @usageNotes
 * 다음 DOM 구조를 고려하십시오:
 *
 * ```html
 * <app-root>
 *   <div (click)="doSomething()"></div>
 * </app-root>
 * ```
 *
 * `<div>`에서 `getListeners`를 호출하면 다음과 같은 객체가 반환됩니다:
 *
 * ```ts
 * {
 *   name: 'click',
 *   element: <div>,
 *   callback: () => doSomething(),
 *   useCapture: false
 * }
 * ```
 *
 * @param element DOM 리스너를 검색할 요소입니다.
 * @returns DOM 요소의 이벤트 리스너 배열입니다.
 *
 * @publicApi
 */
export function getListeners(element: Element): Listener[] {
  ngDevMode && assertDomElement(element);
  const lContext = getLContext(element);
  const lView = lContext === null ? null : lContext.lView;
  if (lView === null) return [];

  const tView = lView[TVIEW];
  const lCleanup = lView[CLEANUP];
  const tCleanup = tView.cleanup;
  const listeners: Listener[] = [];
  if (tCleanup && lCleanup) {
    for (let i = 0; i < tCleanup.length; ) {
      const firstParam = tCleanup[i++];
      const secondParam = tCleanup[i++];
      if (typeof firstParam === 'string') {
        const name: string = firstParam;
        const listenerElement = unwrapRNode(lView[secondParam]) as any as Element;
        const callback: (value: any) => any = lCleanup[tCleanup[i++]];
        const useCaptureOrIndx = tCleanup[i++];
        // if useCaptureOrIndx가 boolean이면 그대로 리포트합니다.
        // useCaptureOrIndx가 양수이면 구독 해제 메서드에 있습니다.
        // useCaptureOrIndx가 음수이면 Subscription입니다.
        const type =
          typeof useCaptureOrIndx === 'boolean' || useCaptureOrIndx >= 0 ? 'dom' : 'output';
        const useCapture = typeof useCaptureOrIndx === 'boolean' ? useCaptureOrIndx : false;
        if (element == listenerElement) {
          listeners.push({element, name, callback, useCapture, type});
        }
      }
    }
  }
  listeners.sort(sortListeners);
  return listeners;
}

function sortListeners(a: Listener, b: Listener) {
  if (a.name == b.name) return 0;
  return a.name < b.name ? -1 : 1;
}

/**
 * 이 함수는 존재해서는 안 됩니다. 왜냐하면 그것은 메가형이며,
 * 대체로만 정확하기 때문입니다.
 *
 * 더 많은 정보를 원하시면 호출 위치를 참고하십시오.
 */
function isDirectiveDefHack(obj: any): obj is DirectiveDef<any> {
  return (
    obj.type !== undefined &&
    obj.declaredInputs !== undefined &&
    obj.resolveHostDirectives !== undefined
  );
}

/**
 * 컴포넌트/요소에서 컴포넌트 `LView`를 검색합니다.
 *
 * NOTE: `LView`는 비공식적인 것이며 외부에 노출되지 않아야 합니다.
 *       이 메서드를 `ng.*`에 내보내지 마십시오.
 *
 * @param target LView를 반환할 DOM 요소 또는 컴포넌트 인스턴스입니다.
 */
export function getComponentLView(target: any): LView {
  const lContext = getLContext(target)!;
  const nodeIndx = lContext.nodeIndex;
  const lView = lContext.lView!;
  ngDevMode && assertLView(lView);
  const componentLView = lView[nodeIndx];
  ngDevMode && assertLView(componentLView);
  return componentLView;
}

/** 값이 DOM 요소인지 확인합니다. */
function assertDomElement(value: any) {
  if (typeof Element !== 'undefined' && !(value instanceof Element)) {
    throw new Error('DOM Element의 인스턴스를 기대합니다.');
  }
}

/**
 * 지시어 정의는 비트 플래그를 사용하여 추가 메타데이터를 보유하고 있습니다.
 * 예를 들어 신호 기반인지를 나타냅니다.
 *
 * 이 정보는 이전 버전의 호환성을 위해
 * `publicName -> minifiedName` 매핑과 분리되어야 합니다.
 */
function extractInputDebugMetadata<T>(inputs: DirectiveDef<T>['inputs']) {
  const res: DirectiveDebugMetadata['inputs'] = {};

  for (const key in inputs) {
    if (inputs.hasOwnProperty(key)) {
      const value = inputs[key];

      if (value !== undefined) {
        res[key] = value[0];
      }
    }
  }

  return res;
}
