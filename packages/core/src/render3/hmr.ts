/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {assertDefined, assertEqual, assertNotEqual} from '../util/assert';
import {assertLView} from './assert';
import {getComponentDef} from './def_getters';
import {assertComponentDef} from './errors';
import {refreshView} from './instructions/change_detection';
import {renderView} from './instructions/render';
import {CONTAINER_HEADER_OFFSET} from './interfaces/container';
import {ComponentDef} from './interfaces/definition';
import {getTrackedLViews} from './interfaces/lview_tracking';
import {isTNodeShape, TElementNode, TNodeFlags, TNodeType} from './interfaces/node';
import {isLContainer, isLView, isRootView} from './interfaces/type_checks';
import {
  CHILD_HEAD,
  CHILD_TAIL,
  CONTEXT,
  ENVIRONMENT,
  HEADER_OFFSET,
  HOST,
  INJECTOR,
  LView,
  NEXT,
  PARENT,
  RENDERER,
  T_HOST,
  TVIEW,
} from './interfaces/view';
import {assertTNodeType} from './node_assert';
import {destroyLView, removeViewFromDOM} from './node_manipulation';
import {RendererFactory} from './interfaces/renderer';
import {NgZone} from '../zone';
import {ViewEncapsulation} from '../metadata/view';
import {NG_COMP_DEF} from './fields';
import {
  createLView,
  getInitialLViewFlagsFromDef,
  getOrCreateComponentTView,
} from './view/construction';

/** `import.meta`를 나타내며, 내장 타입에 없는 정보가 추가되어 있습니다. */
type ImportMetaExtended = ImportMeta & {
  hot?: {
    send?: (name: string, payload: unknown) => void;
  };
};

/**
 * 컴포넌트 타입의 메타데이터를 교체하고 모든 라이브 인스턴스를 다시 렌더링합니다.
 * @param type 메타데이터가 교체될 클래스입니다.
 * @param applyMetadata 호출 시 `type`에 새 메타데이터 세트를 적용할 콜백입니다.
 * @param environment 콜백에 전달되어야 하는 합성 네임스페이스 가져오기입니다.
 * @param locals 콜백에 노출해야 하는 소스 위치의 로컬 심볼입니다.
 * @param importMeta 교체 함수의 호출 위치에서의 `import.meta`입니다. 내부적으로 사용되지 않으므로 선택적입니다.
 * @param id 교체되는 클래스의 ID입니다. **컴포넌트 정의 ID와는 다릅니다.** 내부에서 ID가 이용할 수 없을 수 있으므로 선택적입니다.
 * @codeGenApi
 */
export function ɵɵreplaceMetadata(
  type: Type<unknown>,
  applyMetadata: (...args: [Type<unknown>, unknown[], ...unknown[]]) => void,
  namespaces: unknown[],
  locals: unknown[],
  importMeta: ImportMetaExtended | null = null,
  id: string | null = null,
) {
  ngDevMode && assertComponentDef(type);
  const currentDef = getComponentDef(type)!;

  // `applyMetadata`가 거의 즉시 호출되는 콜백인 이유는 컴파일러가
  // 일반적으로 컴포넌트 정의보다 더 많은 코드를 생성하기 때문입니다. 예를 들어,
  // 내장 뷰의 함수, 상수 풀의 변수 및 `setClassMetadata` 호출이 있을 수 있습니다.
  // 콜백을 사용하면 이러한 것들이 나머지 앱과 격리되어 있고
  // 적절한 시점에 호출되도록 할 수 있습니다.
  applyMetadata.apply(null, [type, namespaces, ...locals]);

  const {newDef, oldDef} = mergeWithExistingDefinition(currentDef, getComponentDef(type)!);

  // TODO(crisbeto): 위의 `applyMetadata` 호출은 타입의 정의를 교체합니다.
  // 이상적으로는 컴파일러 출력을 조정하여 메타데이터가 반환되도록 해야 합니다.
  // 그러나 이는 내부 변경이 필요합니다. 우리는 여기서 메타데이터를 수동으로 다시 추가합니다.
  (type as any)[NG_COMP_DEF] = newDef;

  // `tView`가 아직 생성되지 않았다면, 이는 이 컴포넌트가 이전에 인스턴스화되지 않았음을 의미합니다.
  // 이 경우 우리는 패치하는 것 외에 할 일이 없습니다.
  if (oldDef.tView) {
    const trackedViews = getTrackedLViews().values();
    for (const root of trackedViews) {
      // 참고: `IsRoot`는 `createComponent`와 같은 방법을 통해 생성된 컴포넌트도 나타낼 수 있습니다.
      if (isRootView(root) && root[PARENT] === null) {
        recreateMatchingLViews(importMeta, id, newDef, oldDef, root);
      }
    }
  }
}

/**
 * 두 개의 컴포넌트 정의를 병합하면서 원래 정의를 그대로 유지합니다.
 * @param currentDef 새로운 메타데이터를 받을 정의입니다.
 * @param newDef 새로운 메타데이터의 출처입니다.
 */
function mergeWithExistingDefinition(
  currentDef: ComponentDef<unknown>,
  newDef: ComponentDef<unknown>,
) {
  // 교체 과정에서 원본 데이터를 더 이상 참조하지 않도록 현재 정의를 클론합니다.
  const clone = {...currentDef};

  // 객체 리터럴을 유지하면서 제자리에 새 메타데이터를 할당합니다.
  // 객체를 제자리에 두는 것이 중요합니다. 그 이유는 다른 정의의
  // `directiveDefs`와 같이 이를 참조할 수 있기 때문입니다.
  const replacement = Object.assign(currentDef, newDef, {
    // 기존 디렉티브 및 파이프 정의가 유지되어야 하며,
    // 원래 모듈 파일에서 `setComponentScope`를 호출하여 패치될 수 있습니다.
    // 해당 호출은 완전히 다른 파일에 존재하므로 HMR 교체 함수에 포함되지는 않습니다.
    directiveDefs: clone.directiveDefs,
    pipeDefs: clone.pipeDefs,

    // 상태가 있는 오래된 `setInput` 함수를 유지합니다.
    // 이는 괜찮습니다. 컴포넌트 인스턴스도 보존되기 때문입니다.
    setInput: clone.setInput,

    // 외부적으로는 이 정의를 원래 타입으로 재선언하므로 중복입니다.
    // 내부적으로는 교체할 정의가 대체하지만 동일한 타입일 수 있으므로
    // 원래 정의가 보존되도록 해야 합니다.
    type: clone.type,
  });

  ngDevMode && assertEqual(replacement, currentDef, 'Expected definition to be merged in place');
  return {newDef: replacement, oldDef: clone};
}

/**
 * 특정 컴포넌트 정의와 일치하는 모든 LViews를 찾아서 재생성합니다.
 * @param importMeta `import.meta` 정보입니다.
 * @param id 컴포넌트의 HMR ID입니다.
 * @param oldDef 검색할 컴포넌트 정의입니다.
 * @param rootLView 검색을 시작할 뷰입니다.
 */
function recreateMatchingLViews(
  importMeta: ImportMetaExtended | null,
  id: string | null,
  newDef: ComponentDef<unknown>,
  oldDef: ComponentDef<unknown>,
  rootLView: LView,
): void {
  ngDevMode &&
    assertDefined(oldDef.tView, '최소한 한 번 인스턴스화된 컴포넌트 정의가 예상되었습니다.');

  const tView = rootLView[TVIEW];

  // `tView`를 사용하여 LView와 일치시킵니다.
  // 왜냐하면 상속을 사용할 때 `instanceof`가
  // 잘못된 긍정을 생성할 수 있기 때문입니다.
  if (tView === oldDef.tView) {
    ngDevMode && assertComponentDef(oldDef.type);
    recreateLView(importMeta, id, newDef, oldDef, rootLView);
    return;
  }

  for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
    const current = rootLView[i];

    if (isLContainer(current)) {
      // 호스트는 컴포넌트가 `ViewContainerRef`를 주입하는 경우 LView일 수 있습니다.
      if (isLView(current[HOST])) {
        recreateMatchingLViews(importMeta, id, newDef, oldDef, current[HOST]);
      }

      for (let j = CONTAINER_HEADER_OFFSET; j < current.length; j++) {
        recreateMatchingLViews(importMeta, id, newDef, oldDef, current[j]);
      }
    } else if (isLView(current)) {
      recreateMatchingLViews(importMeta, id, newDef, oldDef, current);
    }
  }
}

/**
 * 제공된 타입에 대한 모든 캐시된 렌더러를 팩토리에서 제거합니다.
 * 이는 현재 HMR 로직에 의해 사용되어 렌더러가 정의 메타데이터 업데이트와
 * 동기화되는 것이 보장됩니다.
 * @param factory RendererFactory2 인스턴스입니다.
 * @param def ComponentDef 인스턴스입니다.
 */
function clearRendererCache(factory: RendererFactory, def: ComponentDef<unknown>) {
  // 비공식 필드를 읽기 위해 캐스팅합니다.
  // NOTE: 이는 platform-browser 및 platform-browser/animations의
  // 렌더러 팩토리 구현과 동기화되어야 합니다.
  (factory as {componentReplaced?: (id: string) => void}).componentReplaced?.(def.id);
}

/**
 * 새 컴포넌트 정의에서 인-플레이스에서 LView를 재생성합니다.
 * @param importMeta `import.meta` 정보입니다.
 * @param id 컴포넌트의 HMR ID입니다.
 * @param newDef 뷰를 재생성하는 데 사용되는 정의입니다.
 * @param oldDef 교체되는 이전 컴포넌트 정의입니다.
 * @param lView 재생성될 뷰입니다.
 */
function recreateLView(
  importMeta: ImportMetaExtended | null,
  id: string | null,
  newDef: ComponentDef<unknown>,
  oldDef: ComponentDef<unknown>,
  lView: LView<unknown>,
): void {
  const instance = lView[CONTEXT];
  let host = lView[HOST]! as HTMLElement;
  // 이론적으로 부모도 LContainer가 될 수 있지만,
  // 이는 여기서 교체되지 않을 내장 뷰에만 해당하는 것 같습니다.
  const parentLView = lView[PARENT] as LView;
  ngDevMode && assertLView(parentLView);
  const tNode = lView[T_HOST] as TElementNode;
  ngDevMode && assertTNodeType(tNode, TNodeType.Element);
  ngDevMode && assertNotEqual(newDef, oldDef, '기대되는 다른 컴포넌트 정의입니다.');
  const zone = lView[INJECTOR].get(NgZone, null);
  const recreate = () => {
    // 그림자 DOM 캡슐화를 가진 컴포넌트를 재생성하는 경우,
    // 그림자 루트가 첨부될 것입니다.
    // 또 다른 그림자를 붙이려고 하면 브라우저가 오류를 발생시키고
    // 이를 분리할 방법이 없습니다. 우리의 유일한 선택은 루트 노드만을 클론하여
    // 노드를 클론으로 교체하고 이를 새로 생성된 LView에 사용하는 것입니다.
    if (oldDef.encapsulation === ViewEncapsulation.ShadowDom) {
      const newHost = host.cloneNode(false) as HTMLElement;
      host.replaceWith(newHost);
      host = newHost;
    }

    // 템플릿이 변경되었을 수 있으므로 TView를 다시 생성합니다.
    const newTView = getOrCreateComponentTView(newDef);

    // 기존 TNode 및 DOM 노드를 재사용하되 새 TView에서 새 LView를 생성합니다.
    const newLView = createLView(
      parentLView,
      newTView,
      instance,
      getInitialLViewFlagsFromDef(newDef),
      host,
      tNode,
      null,
      null, // 렌더러는 이전 것이 파괴된 후 조금 더 아래에서 생성됩니다.
      null,
      null,
      null,
    );

    // LView를 현재 트리 구조에서 분리하여 형제를 탐색하고
    // 그 구조를 수정하지 않도록 합니다.
    replaceLViewInTree(parentLView, lView, newLView, tNode.index);

    // 분리된 LView를 파괴합니다.
    destroyLView(lView[TVIEW], lView);

    // 새 컴포넌트 정의와의 상태 일관성을 보장하기 위해
    // 항상 새 렌더러를 생성하게 하며 모든 오래된 캐시된 팩토리를 지웁니다.
    const rendererFactory = lView[ENVIRONMENT].rendererFactory;
    clearRendererCache(rendererFactory, oldDef);

    // 구식 뷰가 파괴된 후에만 새 뷰에 새로운 렌더러를 패치합니다.
    // 그렇지 않으면 런타임이 이를 재사용하려 할 수 있습니다.
    newLView[RENDERER] = rendererFactory.createRenderer(host, newDef);

    // 파괴된 LView와 관련된 노드를 제거합니다. 이는 하위 요소를 제거하지만,
    // 우리는 위치에 남아 있는 호스트를 원합니다.
    removeViewFromDOM(lView[TVIEW], lView);

    // 첫 번째 렌더링 전 TNode의 콘텐츠 투영 상태를 재설정합니다.
    // LView가 파괴된 후에 이것이 발생해야 합니다. 그렇지 않으면
    // 일부 투영된 노드가 올바르게 제거되지 않을 수 있습니다.
    resetProjectionState(tNode);

    // 새 뷰 생성을 위한 패스입니다.
    renderView(newTView, newLView, instance);

    // 새 뷰에 대한 업데이트 패스입니다.
    refreshView(newTView, newLView, newTView.template, instance);
  };

  // 콜백이 반드시 Zone 안에 있는 것은 아니므로 직접 가져와야 합니다.
  if (zone === null) {
    executeWithInvalidateFallback(importMeta, id, recreate);
  } else {
    zone.run(() => executeWithInvalidateFallback(importMeta, id, recreate));
  }
}

/**
 * HMR 관련 기능을 실행하며
 * 오류가 발생하면 HMR 데이터를 무효화하도록 폴백합니다.
 */
function executeWithInvalidateFallback(
  importMeta: ImportMetaExtended | null,
  id: string | null,
  callback: () => void,
) {
  try {
    callback();
  } catch (e) {
    const error = e as {message?: string; stack?: string};

    // 무효화 요청을 보내기에 필요한 모든 정보와 API가 준비되어 있는 경우,
    // 다시 던지기 전에 요청을 보내도록 하여 개발 서버가
    // 어떤 조치를 취해야 할지를 결정할 수 있습니다.
    if (id !== null && error.message) {
      const toLog = error.message + (error.stack ? '\n' + error.stack : '');
      importMeta?.hot?.send?.('angular:invalidate', {id, message: toLog, error: true});
    }

    // 페이지가 새로 고쳐지지 않도록 오류를 던집니다.
    throw e;
  }
}

/**
 * 트리에서 하나의 LView를 다른 LView로 교체합니다.
 * @param parentLView 교체되는 LView의 부모입니다.
 * @param oldLView 교체되는 LView입니다.
 * @param newLView 삽입될 교체 LView입니다.
 * @param index LView가 삽입되어야 하는 인덱스입니다.
 */
function replaceLViewInTree(
  parentLView: LView,
  oldLView: LView,
  newLView: LView,
  index: number,
): void {
  // 이전 뷰를 가리키는 `NEXT` 포인터를 업데이트합니다.
  for (let i = HEADER_OFFSET; i < parentLView[TVIEW].bindingStartIndex; i++) {
    const current = parentLView[i];

    if ((isLView(current) || isLContainer(current)) && current[NEXT] === oldLView) {
      current[NEXT] = newLView;
      break;
    }
  }

  // 이전 뷰가 최초인 경우 새 뷰를 헤드로 설정합니다.
  if (parentLView[CHILD_HEAD] === oldLView) {
    parentLView[CHILD_HEAD] = newLView;
  }

  // 이전 뷰가 마지막인 경우 새 뷰를 테일로 설정합니다.
  if (parentLView[CHILD_TAIL] === oldLView) {
    parentLView[CHILD_TAIL] = newLView;
  }

  // `NEXT` 포인터를 이전 뷰와 동일하게 설정합니다.
  newLView[NEXT] = oldLView[NEXT];

  // 이전 뷰의 `NEXT`를 지웁니다.
  oldLView[NEXT] = null;

  // 올바른 인덱스에 새 LView를 삽입합니다.
  parentLView[index] = newLView;
}

/**
 * 자식 노드는 투영되는 동안 부모 노드의 `projection` 상태를 변경합니다.
 * 이 함수는 `project`를 초기 상태로 재설정합니다.
 * @param tNode
 */
function resetProjectionState(tNode: TElementNode): void {
  // 자식 노드에 의해 투영되는 동안 `projection`이 변경됩니다.
  // 우리는 템플릿이 교체된 후에 투영이 작동하도록 초기 상태로 재설정할 필요가 있습니다.
  if (tNode.projection !== null) {
    for (const current of tNode.projection) {
      if (isTNodeShape(current)) {
        // 투영 중 순회 순서에 영향을 줄 수 있는 `projectionNext`를 재설정합니다.
        current.projectionNext = null;
        current.flags &= ~TNodeFlags.isProjected;
      }
    }
    tNode.projection = null;
  }
}
