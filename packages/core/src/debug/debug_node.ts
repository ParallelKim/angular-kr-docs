/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../di/injector';
import {assertTNodeForLView} from '../render3/assert';
import {getLContext} from '../render3/context_discovery';
import {CONTAINER_HEADER_OFFSET, LContainer, NATIVE} from '../render3/interfaces/container';
import {TElementNode, TNode, TNodeFlags, TNodeType} from '../render3/interfaces/node';
import {isComponentHost, isLContainer} from '../render3/interfaces/type_checks';
import {
  DECLARATION_COMPONENT_VIEW,
  LView,
  PARENT,
  T_HOST,
  TData,
  TVIEW,
} from '../render3/interfaces/view';
import {
  getComponent,
  getContext,
  getInjectionTokens,
  getInjector,
  getListeners,
  getLocalRefs,
  getOwningComponent,
} from '../render3/util/discovery_utils';
import {INTERPOLATION_DELIMITER} from '../render3/util/misc_utils';
import {renderStringify} from '../render3/util/stringify_utils';
import {getComponentLViewByIndex, getNativeByTNodeOrNull} from '../render3/util/view_utils';
import {assertDomNode} from '../util/assert';

/**
 * @publicApi
 */
export class DebugEventListener {
  constructor(
    public name: string,
    public callback: Function,
  ) {}
}

/**
 * @publicApi
 */
export function asNativeElements(debugEls: DebugElement[]): any {
  return debugEls.map((el) => el.nativeElement);
}

/**
 * @publicApi
 */
export class DebugNode {
  /**
   * 기본 DOM 노드.
   */
  readonly nativeNode: any;

  constructor(nativeNode: Node) {
    this.nativeNode = nativeNode;
  }

  /**
   * `DebugElement` 부모. 이 요소가 루트 요소이면 `null`이 됩니다.
   */
  get parent(): DebugElement | null {
    const parent = this.nativeNode.parentNode as Element;
    return parent ? new DebugElement(parent) : null;
  }

  /**
   * 호스트 의존성 주입기. 예를 들어, 루트 요소의 컴포넌트 인스턴스 주입기입니다.
   */
  get injector(): Injector {
    return getInjector(this.nativeNode);
  }

  /**
   * 해당 요소의 개인 컴포넌트 인스턴스가 있을 경우 그것을 반환합니다.
   */
  get componentInstance(): any {
    const nativeElement = this.nativeNode;
    return (
      nativeElement && (getComponent(nativeElement as Element) || getOwningComponent(nativeElement))
    );
  }

  /**
   * 이 요소에 대한 부모 컨텍스트를 제공하는 객체입니다. 종종 이 요소를 관리하는
   * 조상 컴포넌트 인스턴스입니다.
   *
   * 요소가 *ngFor 내에서 반복될 때, 컨텍스트는 `$implicit` 속성이 행 인스턴스 값의 값인
   * `NgForOf`입니다. 예를 들어, `*ngFor="let hero of heroes"`에서의 `hero`입니다.
   */
  get context(): any {
    return getComponent(this.nativeNode as Element) || getContext(this.nativeNode as Element);
  }

  /**
   * 컴포넌트의 @Output 속성 및/또는 요소의 이벤트 속성에 연결된 콜백입니다.
   */
  get listeners(): DebugEventListener[] {
    return getListeners(this.nativeNode as Element).filter((listener) => listener.type === 'dom');
  }

  /**
   * 템플릿 지역 변수를 나타내는 객체의 사전입니다 (예: #foo), 지역 변수 이름으로 키가 지정됩니다.
   */
  get references(): {[key: string]: any} {
    return getLocalRefs(this.nativeNode);
  }

  /**
   * 이 컴포넌트의 주입기 조회 토큰입니다. 컴포넌트 자체와 함께 컴포넌트가
   * 제공자 메타데이터에 나열하는 토큰을 포함합니다.
   */
  get providerTokens(): any[] {
    return getInjectionTokens(this.nativeNode as Element);
  }
}

/**
 * @publicApi
 *
 * @see [컴포넌트 테스트 시나리오](guide/testing/components-scenarios)
 * @see [컴포넌트 테스트의 기초](guide/testing/components-basics)
 * @see [테스트 유틸리티 API](guide/testing/utility-apis)
 */
export class DebugElement extends DebugNode {
  constructor(nativeNode: Element) {
    ngDevMode && assertDomNode(nativeNode);
    super(nativeNode);
  }

  /**
   * 컴포넌트의 루트에 있는 기본 DOM 요소입니다.
   */
  get nativeElement(): any {
    return this.nativeNode.nodeType == Node.ELEMENT_NODE ? (this.nativeNode as Element) : null;
  }

  /**
   * 요소인 경우 요소 태그 이름을 반환합니다.
   */
  get name(): string {
    const context = getLContext(this.nativeNode)!;
    const lView = context ? context.lView : null;

    if (lView !== null) {
      const tData = lView[TVIEW].data;
      const tNode = tData[context.nodeIndex] as TNode;
      return tNode.value!;
    } else {
      return this.nativeNode.nodeName;
    }
  }

  /**
   * 요소에 대한 속성 이름과 속성 값의 맵을 가져옵니다.
   *
   * 이 맵에는 다음이 포함됩니다:
   * - 일반 속성 바인딩 (예: `[id]="id"`)
   * - 호스트 속성 바인딩 (예: `host: { '[id]': "id" }`)
   * - 보간된 속성 바인딩 (예: `id="{{ value }}"`)
   *
   * 포함되지 않는 항목:
   * - 입력 속성 바인딩 (예: `[myCustomInput]="value"`)
   * - 속성 바인딩 (예: `[attr.role]="menu"`)
   */
  get properties(): {[key: string]: any} {
    const context = getLContext(this.nativeNode)!;
    const lView = context ? context.lView : null;

    if (lView === null) {
      return {};
    }

    const tData = lView[TVIEW].data;
    const tNode = tData[context.nodeIndex] as TNode;

    const properties: {[key: string]: string} = {};
    // DOM에서 속성을 수집합니다.
    copyDomProperties(this.nativeElement, properties);
    // 바인딩에서 속성을 수집합니다. 이것은 애니메이션 렌더러에 필요하며,
    // DOM에 반영되지 않는 합성 속성이 있습니다.
    collectPropertyBindings(properties, tNode, lView, tData);
    return properties;
  }

  /**
   * 요소에 대한 속성 이름과 속성 값의 맵을 가져옵니다.
   */
  // TODO: 반환 유형에서 null을 undefined로 대체
  get attributes(): {[key: string]: string | null} {
    const attributes: {[key: string]: string | null} = {};
    const element = this.nativeElement as Element | undefined;

    if (!element) {
      return attributes;
    }

    const context = getLContext(element)!;
    const lView = context ? context.lView : null;

    if (lView === null) {
      return {};
    }

    const tNodeAttrs = (lView[TVIEW].data[context.nodeIndex] as TNode).attrs;
    const lowercaseTNodeAttrs: string[] = [];

    // 디버그 노드의 경우, DOM에서 직접 요소의 속성을 가져와야 합니다. 이렇게 하면
    // 바인딩을 통해 설정되지 않은 속성을 고려할 수 있습니다 (예: ViewEngine은 `Renderer2`
    // 를 통해 설정된 속성을 추적합니다). 단점은 브라우저가 모든 이름을 소문자로 만들 수 있는
    // 반면, TNode에 이미 있는 속성을 통해 대소문자를 보존할 수 있습니다.
    if (tNodeAttrs) {
      let i = 0;
      while (i < tNodeAttrs.length) {
        const attrName = tNodeAttrs[i];

        // 마커가 발견되면 중지합니다. 일반 속성만을 고려합니다.
        // 나머지는 DOM에서 최종 속성을 읽을 때 처리됩니다.
        if (typeof attrName !== 'string') break;

        const attrValue = tNodeAttrs[i + 1];
        attributes[attrName] = attrValue as string;
        lowercaseTNodeAttrs.push(attrName.toLowerCase());

        i += 2;
      }
    }

    for (const attr of element.attributes) {
      // 동일한 속성을 대소문자 구분 형식과 브라우저에서의 소문자 형식 모두에 할당하지
      // 않도록 확인합니다.
      if (!lowercaseTNodeAttrs.includes(attr.name)) {
        attributes[attr.name] = attr.value;
      }
    }

    return attributes;
  }

  /**
   * DOM 요소의 인라인 스타일입니다.
   */
  // TODO: 반환 유형에서 null을 undefined로 대체
  get styles(): {[key: string]: string | null} {
    const element = this.nativeElement as HTMLElement | null;
    return (element?.style ?? {}) as {[key: string]: string | null};
  }

  /**
   * 요소에서 클래스 이름을 키로 포함하는 맵입니다.
   *
   * 이 맵은 DOM 요소의 `className` 속성에서 파생됩니다.
   *
   * 주의: 이 객체의 값은 항상 `true`입니다. 클래스 키가 요소에 존재하지 않으면 KV
   * 객체에 나타나지 않습니다.
   *
   * @see [Element.className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className)
   */
  get classes(): {[key: string]: boolean} {
    const result: {[key: string]: boolean} = {};
    const element = this.nativeElement as HTMLElement | SVGElement;

    // SVG 요소는 `className`에 대해 단순 문자열 대신 `SVGAnimatedString`을 반환합니다.
    const className = element.className as string | SVGAnimatedString;
    const classes =
      typeof className !== 'string' ? className.baseVal.split(' ') : className.split(' ');

    classes.forEach((value: string) => (result[value] = true));

    return result;
  }

  /**
   * DOM 요소의 `childNodes`를 `DebugNode` 배열로 반환합니다.
   *
   * @see [Node.childNodes](https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes)
   */
  get childNodes(): DebugNode[] {
    const childNodes = this.nativeNode.childNodes;
    const children: DebugNode[] = [];
    for (let i = 0; i < childNodes.length; i++) {
      const element = childNodes[i];
      children.push(getDebugNode(element)!);
    }
    return children;
  }

  /**
   * 즉각적인 `DebugElement` 자식. `children`을 통해 트리를 따라 내려갑니다.
   */
  get children(): DebugElement[] {
    const nativeElement = this.nativeElement;
    if (!nativeElement) return [];
    const childNodes = nativeElement.children;
    const children: DebugElement[] = [];
    for (let i = 0; i < childNodes.length; i++) {
      const element = childNodes[i];
      children.push(getDebugNode(element) as DebugElement);
    }
    return children;
  }

  /**
   * @returns 하위 트리의 모든 깊이에서 조건에 일치하는 첫 번째 `DebugElement`.
   */
  query(predicate: Predicate<DebugElement>): DebugElement {
    const results = this.queryAll(predicate);
    return results[0] || null;
  }

  /**
   * @returns 하위 트리의 모든 깊이에서 조건과 일치하는 모든 `DebugElement`.
   */
  queryAll(predicate: Predicate<DebugElement>): DebugElement[] {
    const matches: DebugElement[] = [];
    _queryAll(this, predicate, matches, true);
    return matches;
  }

  /**
   * @returns 하위 트리의 모든 깊이에서 조건과 일치하는 모든 `DebugNode`.
   */
  queryAllNodes(predicate: Predicate<DebugNode>): DebugNode[] {
    const matches: DebugNode[] = [];
    _queryAll(this, predicate, matches, false);
    return matches;
  }

  /**
   * 해당 요소의 `listeners` 컬렉션에 해당하는 리스너가 있는 경우 이벤트를 발생시킵니다.
   *
   * 이벤트에 리스너가 없거나 다른 문제가 있는 경우, `nativeElement.dispatchEvent(eventObject)`를
   * 호출을 고려하십시오.
   *
   * @param eventName 트리거할 이벤트의 이름
   * @param eventObj 핸들러가 예상하는 _이벤트 객체_
   *
   * @see [테스트 컴포넌트 시나리오](guide/testing/components-scenarios#trigger-event-handler)
   */
  triggerEventHandler(eventName: string, eventObj?: any): void {
    const node = this.nativeNode as any;
    const invokedListeners: Function[] = [];

    this.listeners.forEach((listener) => {
      if (listener.name === eventName) {
        const callback = listener.callback;
        callback.call(node, eventObj);
        invokedListeners.push(callback);
      }
    });

    // `eventListeners`가 존재하는지 확인합니다. 이는 Zone.js가 browser 환경에서
    // `EventTarget`에만 추가하는 것입니다.
    if (typeof node.eventListeners === 'function') {
      // Ivy에서는 경우에 따라 이벤트 리스너를 `event.preventDefault`를 호출하여 감싸는 것이
      // 있습니다. 우리는 '.__ngUnwrap__'를 특별한 토큰으로 사용하여 실제 이벤트
      // 리스너에 접근합니다.
      node.eventListeners(eventName).forEach((listener: Function) => {
        // 우리는 위에서 설명한 특별한 __ngUnwrap__ 토큰을 감지할 수 있도록 하기 위해,
        // 리스너에 대해 `toString`을 사용하고 토큰이 포함되어 있는지 확인합니다.
        // 이 접근 방식은 컴파일된 코드와 연산의 상관없이 여전히 작동하기 위해 사용됩니다,
        // 문자열 리터럴을 제거하거나 이름을 변경할 수 없기 때문입니다.
        // 우리는 특별한 함수 이름(예: if(listener.name === special))을 사용하는 것을
        // 고려했지만 더 번거로웠고 컴파일된 코드가 이름을 제거할 수 있다는 우려가 있었습니다.
        if (listener.toString().indexOf('__ngUnwrap__') !== -1) {
          const unwrappedListener = listener('__ngUnwrap__');
          return (
            invokedListeners.indexOf(unwrappedListener) === -1 &&
            unwrappedListener.call(node, eventObj)
          );
        }
      });
    }
  }
}

function copyDomProperties(element: Element | null, properties: {[name: string]: string}): void {
  if (element) {
    // 자기 속성을 건너뜁니다 (이것들은 패치됩니다)
    let obj = Object.getPrototypeOf(element);
    const NodePrototype: any = Node.prototype;
    while (obj !== null && obj !== NodePrototype) {
      const descriptors = Object.getOwnPropertyDescriptors(obj);
      for (let key in descriptors) {
        if (!key.startsWith('__') && !key.startsWith('on')) {
          // `__`와 `on`으로 시작하는 속성을 포함하지 않습니다.
          // `__`는 포함되어서는 안 되는 패치된 값입니다.
          // `on`은 포함되어서는 안 되는 리스너입니다.
          const value = (element as any)[key];
          if (isPrimitiveValue(value)) {
            properties[key] = value;
          }
        }
      }
      obj = Object.getPrototypeOf(obj);
    }
  }
}

function isPrimitiveValue(value: any): boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    value === null
  );
}

/**
 * TNode 트리를 탐색하여 조건에 일치하는 항목을 찾습니다.
 *
 * @param parentElement 탐색이 시작되는 요소
 * @param predicate 일치할 조건
 * @param matches 긍정적인 일치 목록
 * @param elementsOnly 요소만 검색해야 하는지 여부
 */
function _queryAll(
  parentElement: DebugElement,
  predicate: Predicate<DebugElement>,
  matches: DebugElement[],
  elementsOnly: true,
): void;
function _queryAll(
  parentElement: DebugElement,
  predicate: Predicate<DebugNode>,
  matches: DebugNode[],
  elementsOnly: false,
): void;
function _queryAll(
  parentElement: DebugElement,
  predicate: Predicate<DebugElement> | Predicate<DebugNode>,
  matches: DebugElement[] | DebugNode[],
  elementsOnly: boolean,
) {
  const context = getLContext(parentElement.nativeNode)!;
  const lView = context ? context.lView : null;
  if (lView !== null) {
    const parentTNode = lView[TVIEW].data[context.nodeIndex] as TNode;
    _queryNodeChildren(
      parentTNode,
      lView,
      predicate,
      matches,
      elementsOnly,
      parentElement.nativeNode,
    );
  } else {
    // context가 null이면, `parentElement`는 Renderer2 또는 기본 DOM API로 생성된 것입니다.
    _queryNativeNodeDescendants(parentElement.nativeNode, predicate, matches, elementsOnly);
  }
}

/**
 * 현재 TNode를 조건과 비교하고 다음 것으로 진행합니다.
 *
 * @param tNode 현재 TNode
 * @param lView 이 TNode의 LView
 * @param predicate 일치할 조건
 * @param matches 긍정적인 일치 목록
 * @param elementsOnly 요소만 검색해야 하는지 여부
 * @param rootNativeNode 조건과 일치하지 않아야 하는 루트 기본 노드
 */
function _queryNodeChildren(
  tNode: TNode,
  lView: LView,
  predicate: Predicate<DebugElement> | Predicate<DebugNode>,
  matches: DebugElement[] | DebugNode[],
  elementsOnly: boolean,
  rootNativeNode: any,
) {
  ngDevMode && assertTNodeForLView(tNode, lView);
  const nativeNode = getNativeByTNodeOrNull(tNode, lView);
  // 각 TNode 유형에 대해 특정 논리가 실행됩니다.
  if (tNode.type & (TNodeType.AnyRNode | TNodeType.ElementContainer)) {
    // Case 1: TNode가 요소인 경우
    // 기본 노드를 체크해야 합니다.
    _addQueryMatch(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
    if (isComponentHost(tNode)) {
      // 요소가 컴포넌트의 호스트인 경우 해당 뷰의 모든 노드를 처리해야 합니다.
      // 참고: 컴포넌트의 컨텐츠(tNode.child)는 삽입 지점에서 처리됩니다.
      const componentView = getComponentLViewByIndex(tNode.index, lView);
      if (componentView && componentView[TVIEW].firstChild) {
        _queryNodeChildren(
          componentView[TVIEW].firstChild!,
          componentView,
          predicate,
          matches,
          elementsOnly,
          rootNativeNode,
        );
      }
    } else {
      if (tNode.child) {
        // 그렇지 않으면, 자식을 처리해야 합니다.
        _queryNodeChildren(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
      }

      // Renderer2를 통해 삽입된 요소를 포착하려면 DOM에서 직접 쿼리해야 합니다.
      // 이는 최적화하지 않는 방법이며, 비슷한 트리를 여러 번 탐색하게 됩니다.
      // ViewEngine은 모든 삽입이 Renderer2를 거치기 때문에 더 효율적으로 처리할 수 있지만,
      // Ivy에서는 그렇지 않습니다. 이 접근 방식은 다음과 같은 이유로 사용됩니다:
      // 1. ViewEngine 동작과 일치하려면, `Renderer2`와 Ivy 간의 의존성을 도입할 가능성이 있으며,
      //    이는 Ivy 코드를 ViewEngine으로 가져올 수 있습니다.
      // 2. DOM을 통해 직접 삽입된 노드를 포착할 수 있습니다.
      nativeNode && _queryNativeNodeDescendants(nativeNode, predicate, matches, elementsOnly);
    }
    // 모든 경우에, 이 노드에 대한 동적 컨테이너가 존재하는 경우 각 뷰를 처리해야 합니다.
    const nodeOrContainer = lView[tNode.index];
    if (isLContainer(nodeOrContainer)) {
      _queryNodeChildrenInContainer(
        nodeOrContainer,
        predicate,
        matches,
        elementsOnly,
        rootNativeNode,
      );
    }
  } else if (tNode.type & TNodeType.Container) {
    // Case 2: TNode가 컨테이너인 경우
    // 기본 노드를 체크해야 합니다.
    const lContainer = lView[tNode.index];
    _addQueryMatch(lContainer[NATIVE], predicate, matches, elementsOnly, rootNativeNode);
    // 각 컨테이너 내의 뷰를 처리해야 합니다.
    _queryNodeChildrenInContainer(lContainer, predicate, matches, elementsOnly, rootNativeNode);
  } else if (tNode.type & TNodeType.Projection) {
    // Case 3: TNode가 프로젝션 삽입 지점(예: <ng-content>)인 경우
    // 이 위치에에서 프로젝션된 모든 노드를 처리해야 합니다.
    const componentView = lView![DECLARATION_COMPONENT_VIEW];
    const componentHost = componentView[T_HOST] as TElementNode;
    const head: TNode | null = (componentHost.projection as (TNode | null)[])[
      tNode.projection as number
    ];

    if (Array.isArray(head)) {
      for (let nativeNode of head) {
        _addQueryMatch(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
      }
    } else if (head) {
      const nextLView = componentView[PARENT]! as LView;
      const nextTNode = nextLView[TVIEW].data[head.index] as TNode;
      _queryNodeChildren(nextTNode, nextLView, predicate, matches, elementsOnly, rootNativeNode);
    }
  } else if (tNode.child) {
    // Case 4: TNode가 뷰인 경우
    _queryNodeChildren(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
  }

  // 우리는 루트 노드의 다음 형제로 가지 않기를 원합니다.
  if (rootNativeNode !== nativeNode) {
    // 처리할 다음 노드를 결정하기 위해, 다음 링크 또는 프로젝션 다음 링크를 사용해야 합니다.
    // 현재 노드가 프로젝션되었는지 여부에 따라 다릅니다.
    const nextTNode = tNode.flags & TNodeFlags.isProjected ? tNode.projectionNext : tNode.next;
    if (nextTNode) {
      _queryNodeChildren(nextTNode, lView, predicate, matches, elementsOnly, rootNativeNode);
    }
  }
}

/**
 * 주어진 컨테이너의 모든 TNodes를 처리합니다.
 *
 * @param lContainer 처리할 컨테이너
 * @param predicate 일치할 조건
 * @param matches 긍정적인 일치 목록
 * @param elementsOnly 요소만 검색해야 하는지 여부
 * @param rootNativeNode 조건과 일치하지 않아야 하는 루트 기본 노드
 */
function _queryNodeChildrenInContainer(
  lContainer: LContainer,
  predicate: Predicate<DebugElement> | Predicate<DebugNode>,
  matches: DebugElement[] | DebugNode[],
  elementsOnly: boolean,
  rootNativeNode: any,
) {
  for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
    const childView = lContainer[i] as LView;
    const firstChild = childView[TVIEW].firstChild;
    if (firstChild) {
      _queryNodeChildren(firstChild, childView, predicate, matches, elementsOnly, rootNativeNode);
    }
  }
}

/**
 * 현재 기본 노드를 조건과 비교합니다.
 *
 * @param nativeNode 현재 기본 노드
 * @param predicate 일치할 조건
 * @param matches 긍정적인 일치 목록
 * @param elementsOnly 요소만 검색해야 하는지 여부
 * @param rootNativeNode 조건과 일치하지 않아야 하는 루트 기본 노드
 */
function _addQueryMatch(
  nativeNode: any,
  predicate: Predicate<DebugElement> | Predicate<DebugNode>,
  matches: DebugElement[] | DebugNode[],
  elementsOnly: boolean,
  rootNativeNode: any,
) {
  if (rootNativeNode !== nativeNode) {
    const debugNode = getDebugNode(nativeNode);
    if (!debugNode) {
      return;
    }
    // "predicate"와 "matches" 배열의 유형은 "elementsOnly" 매개변수의 값에 따라 설정됩니다.
    // TypeScript는 이러한 유형을 제네릭으로 적절하게 추론할 수 없으므로 매개변수를
    // 수동으로 캐스팅합니다.
    if (
      elementsOnly &&
      debugNode instanceof DebugElement &&
      predicate(debugNode) &&
      matches.indexOf(debugNode) === -1
    ) {
      matches.push(debugNode);
    } else if (
      !elementsOnly &&
      (predicate as Predicate<DebugNode>)(debugNode) &&
      (matches as DebugNode[]).indexOf(debugNode) === -1
    ) {
      (matches as DebugNode[]).push(debugNode);
    }
  }
}

/**
 * DOM 노드의 모든 자손을 조건과 일치시킵니다.
 *
 * @param nativeNode 현재 기본 노드
 * @param predicate 일치할 조건
 * @param matches 저장할 일치 목록
 * @param elementsOnly 요소만 검색해야 하는지 여부
 */
function _queryNativeNodeDescendants(
  parentNode: any,
  predicate: Predicate<DebugElement> | Predicate<DebugNode>,
  matches: DebugElement[] | DebugNode[],
  elementsOnly: boolean,
) {
  const nodes = parentNode.childNodes;
  const length = nodes.length;

  for (let i = 0; i < length; i++) {
    const node = nodes[i];
    const debugNode = getDebugNode(node);

    if (debugNode) {
      if (
        elementsOnly &&
        debugNode instanceof DebugElement &&
        predicate(debugNode) &&
        matches.indexOf(debugNode) === -1
      ) {
        matches.push(debugNode);
      } else if (
        !elementsOnly &&
        (predicate as Predicate<DebugNode>)(debugNode) &&
        (matches as DebugNode[]).indexOf(debugNode) === -1
      ) {
        (matches as DebugNode[]).push(debugNode);
      }

      _queryNativeNodeDescendants(node, predicate, matches, elementsOnly);
    }
  }
}

/**
 * 주어진 노드에 대한 속성 바인딩을 반복하고
 * 속성 이름과 값을 매핑합니다. 이 맵은 템플릿에서 정의된
 * 속성 바인딩만 포함합니다.
 */
function collectPropertyBindings(
  properties: {[key: string]: string},
  tNode: TNode,
  lView: LView,
  tData: TData,
): void {
  let bindingIndexes = tNode.propertyBindings;

  if (bindingIndexes !== null) {
    for (let i = 0; i < bindingIndexes.length; i++) {
      const bindingIndex = bindingIndexes[i];
      const propMetadata = tData[bindingIndex] as string;
      const metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
      const propertyName = metadataParts[0];
      if (metadataParts.length > 1) {
        let value = metadataParts[1];
        for (let j = 1; j < metadataParts.length - 1; j++) {
          value += renderStringify(lView[bindingIndex + j - 1]) + metadataParts[j + 1];
        }
        properties[propertyName] = value;
      } else {
        properties[propertyName] = lView[bindingIndex];
      }
    }
  }
}

// 여러 개의 Angular 앱을 지원하기 위해 노드를 전역 Map에 유지해야 합니다.
const _nativeNodeToDebugNode = new Map<any, DebugNode>();

const NG_DEBUG_PROPERTY = '__ng_debug__';

/**
 * @publicApi
 */
export function getDebugNode(nativeNode: any): DebugNode | null {
  if (nativeNode instanceof Node) {
    if (!nativeNode.hasOwnProperty(NG_DEBUG_PROPERTY)) {
      (nativeNode as any)[NG_DEBUG_PROPERTY] =
        nativeNode.nodeType == Node.ELEMENT_NODE
          ? new DebugElement(nativeNode as Element)
          : new DebugNode(nativeNode);
    }
    return (nativeNode as any)[NG_DEBUG_PROPERTY];
  }
  return null;
}

export function getAllDebugNodes(): DebugNode[] {
  return Array.from(_nativeNodeToDebugNode.values());
}

export function indexDebugNode(node: DebugNode) {
  _nativeNodeToDebugNode.set(node.nativeNode, node);
}

export function removeDebugNodeFromIndex(node: DebugNode) {
  _nativeNodeToDebugNode.delete(node.nativeNode);
}

/**
 * 주어진 값을 기반으로 하는 부울 값의 함수입니다.
 * 해당 값의 위치와 관련된 컨텍스트 정보를 포함할 수 있습니다.
 *
 * @publicApi
 */
export type Predicate<T> = (value: T) => boolean;
