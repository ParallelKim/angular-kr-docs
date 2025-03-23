/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {setActiveConsumer} from '@angular/core/primitives/signals';

import {TrackByFunction} from '../../change_detection';
import {formatRuntimeError, RuntimeErrorCode} from '../../errors';
import {DehydratedContainerView} from '../../hydration/interfaces';
import {findMatchingDehydratedView} from '../../hydration/views';
import {assertDefined, assertFunction} from '../../util/assert';
import {performanceMarkFeature} from '../../util/performance';
import {assertLContainer, assertLView, assertTNode} from '../assert';
import {bindingUpdated} from '../bindings';
import {CONTAINER_HEADER_OFFSET, LContainer} from '../interfaces/container';
import {ComponentTemplate} from '../interfaces/definition';
import {TNode} from '../interfaces/node';
import {
  CONTEXT,
  DECLARATION_COMPONENT_VIEW,
  HEADER_OFFSET,
  HYDRATION,
  LView,
  TVIEW,
  TView,
} from '../interfaces/view';
import {LiveCollection, reconcile} from '../list_reconciliation';
import {destroyLView} from '../node_manipulation';
import {getLView, getSelectedIndex, getTView, nextBindingIndex} from '../state';
import {NO_CHANGE} from '../tokens';
import {getConstant, getTNode} from '../util/view_utils';
import {createAndRenderEmbeddedLView, shouldAddViewToDom} from '../view_manipulation';

import {declareTemplate} from './template';
import {
  addLViewToLContainer,
  detachView,
  getLViewFromLContainer,
  removeLViewFromLContainer,
} from '../view/container';

/**
 * 조건부 명령문은 런타임 측에서 기본 빌딩 블록을 나타내며 내장된 "if"와 "switch"를 지원합니다.
 * 높은 수준에서 이 명령문은 조건부 표현식에 의해 선택된 뷰를 추가 및 제거하는 역할을 합니다.
 *
 * @param matchingTemplateIndex 삽입될 조건부 뷰를 나타내는 템플릿 TNode의 인덱스; -1은 삽입할 뷰가 없을 때의 특수 케이스를 나타냅니다.
 * @param contextValue 조건부의 컨텍스트로 노출해야 할 값입니다.
 * @codeGenApi
 */
export function ɵɵconditional<T>(matchingTemplateIndex: number, contextValue?: T) {
  performanceMarkFeature('NgControlFlow');

  const hostLView = getLView();
  const bindingIndex = nextBindingIndex();
  const prevMatchingTemplateIndex: number =
    hostLView[bindingIndex] !== NO_CHANGE ? hostLView[bindingIndex] : -1;

  const prevContainer =
    prevMatchingTemplateIndex !== -1
      ? getLContainer(hostLView, HEADER_OFFSET + prevMatchingTemplateIndex)
      : undefined;
  const viewInContainerIdx = 0;

  if (bindingUpdated(hostLView, bindingIndex, matchingTemplateIndex)) {
    const prevConsumer = setActiveConsumer(null);
    try {
      // 보여줄 뷰의 인덱스가 변경되었습니다 - 이전에 표시된 것을 제거합니다
      // (컨테이너에 활성 뷰가 없으면 noop입니다).
      if (prevContainer !== undefined) {
        removeLViewFromLContainer(prevContainer, viewInContainerIdx);
      }

      // 인덱스 -1은 조건이 모두 진리값으로 평가되지 않고, 결과적으로 보여줄 뷰가 없을 때의 특수 케이스입니다.
      if (matchingTemplateIndex !== -1) {
        const nextLContainerIndex = HEADER_OFFSET + matchingTemplateIndex;
        const nextContainer = getLContainer(hostLView, nextLContainerIndex);
        const templateTNode = getExistingTNode(hostLView[TVIEW], nextLContainerIndex);

        const dehydratedView = findMatchingDehydratedView(
          nextContainer,
          templateTNode.tView!.ssrId,
        );
        const embeddedLView = createAndRenderEmbeddedLView(hostLView, templateTNode, contextValue, {
          dehydratedView,
        });

        addLViewToLContainer(
          nextContainer,
          embeddedLView,
          viewInContainerIdx,
          shouldAddViewToDom(templateTNode, dehydratedView),
        );
      }
    } finally {
      setActiveConsumer(prevConsumer);
    }
  } else if (prevContainer !== undefined) {
    // 동일한 템플릿을 계속 표시할 수 있지만 실제 표현식의 값이 변경되었을 수 있습니다 - 컨텍스트에서 재바인딩합니다.
    const lView = getLViewFromLContainer<T | undefined>(prevContainer, viewInContainerIdx);
    if (lView !== undefined) {
      lView[CONTEXT] = contextValue;
    }
  }
}

export class RepeaterContext<T> {
  constructor(
    private lContainer: LContainer,
    public $implicit: T,
    public $index: number,
  ) {}

  get $count(): number {
    return this.lContainer.length - CONTAINER_HEADER_OFFSET;
  }
}

/**
 * 사용자가 컬렉션 인덱스를 추적 표현식으로 지정한 상황에서 사용되는 내장 trackBy 함수입니다.
 * 이 함수 본체를 런타임에 포함시키면 불필요한 코드 생성을 피할 수 있습니다.
 *
 * @param index
 * @returns
 */
export function ɵɵrepeaterTrackByIndex(index: number) {
  return index;
}

/**
 * 사용자들이 컬렉션 항목 참조를 추적 표현식으로 지정한 상황에서 사용되는 내장 trackBy 함수입니다.
 * 이 함수 본체를 런타임에 포함시키면 불필요한 코드 생성을 피할 수 있습니다.
 *
 * @param index
 * @returns
 */
export function ɵɵrepeaterTrackByIdentity<T>(_: number, value: T) {
  return value;
}

class RepeaterMetadata {
  constructor(
    public hasEmptyBlock: boolean,
    public trackByFn: TrackByFunction<unknown>,
    public liveCollection?: LiveCollectionLContainerImpl,
  ) {}
}

/**
 * repeaterCreate 명령문은 템플릿 패스의 생성 부분에서 실행되며 내장 repeater 로직의 업데이트 패스를 위해 필요한 내부 데이터 구조를 초기화합니다.
 * repeater 메타데이터는 LView의 데이터 부분에서 다음과 같은 레이아웃으로 할당됩니다:
 * - LView[HEADER_OFFSET + index] - 메타데이터
 * - LView[HEADER_OFFSET + index + 1] - 항목을 렌더링하는 템플릿 기능에 대한 참조
 * - LView[HEADER_OFFSET + index + 2] - 비어있는 블록을 렌더링하는 템플릿 기능에 대한 선택적 참조
 *
 * @param index 리피터의 메타데이터를 저장할 인덱스입니다.
 * @param templateFn 주요 리피터 블록의 템플릿에 대한 참조입니다.
 * @param decls 주요 블록에 대한 노드, 로컬 참조 및 파이프의 수입니다.
 * @param vars 주요 블록에 대한 바인딩의 수입니다.
 * @param tagName 해당되는 경우 컨테이너 요소의 이름입니다.
 * @param attrsIndex `consts` 배열에서 템플릿 속성의 인덱스입니다.
 * @param trackByFn 추적 함수에 대한 참조입니다.
 * @param trackByUsesComponentInstance 추적 함수가 구성 요소 인스턴스에 대한 참조를 갖고 있는지 여부입니다.
 * 만약 없다면 재바인딩을 피할 수 있습니다.
 * @param emptyTemplateFn 비어있는 블록의 템플릿 기능에 대한 참조입니다.
 * @param emptyDecls 비어있는 블록에 대한 노드, 로컬 참조 및 파이프의 수입니다.
 * @param emptyVars 비어있는 블록에 대한 바인딩의 수입니다.
 * @param emptyTagName 해당되는 경우 비어있는 블록 컨테이너 요소의 이름입니다.
 * @param emptyAttrsIndex `consts` 배열에서 비어있는 블록 템플릿 속성의 인덱스입니다.
 *
 * @codeGenApi
 */
export function ɵɵrepeaterCreate(
  index: number,
  templateFn: ComponentTemplate<unknown>,
  decls: number,
  vars: number,
  tagName: string | null,
  attrsIndex: number | null,
  trackByFn: TrackByFunction<unknown>,
  trackByUsesComponentInstance?: boolean,
  emptyTemplateFn?: ComponentTemplate<unknown>,
  emptyDecls?: number,
  emptyVars?: number,
  emptyTagName?: string | null,
  emptyAttrsIndex?: number | null,
): void {
  performanceMarkFeature('NgControlFlow');

  ngDevMode &&
    assertFunction(
      trackByFn,
      `트랙 표현식은 함수여야 하며, ${typeof trackByFn} 대신 사용되었습니다.`,
    );

  const lView = getLView();
  const tView = getTView();
  const hasEmptyBlock = emptyTemplateFn !== undefined;
  const hostLView = getLView();
  const boundTrackBy = trackByUsesComponentInstance
    ? // 새로운 함수를 생성하므로 필요할 때만 바인딩하고 싶습니다.
      // 순수 함수에 대해서는 필요하지 않습니다.
      trackByFn.bind(hostLView[DECLARATION_COMPONENT_VIEW][CONTEXT])
    : trackByFn;
  const metadata = new RepeaterMetadata(hasEmptyBlock, boundTrackBy);
  hostLView[HEADER_OFFSET + index] = metadata;

  declareTemplate(
    lView,
    tView,
    index + 1,
    templateFn,
    decls,
    vars,
    tagName,
    getConstant(tView.consts, attrsIndex),
  );

  if (hasEmptyBlock) {
    ngDevMode && assertDefined(emptyDecls, '비어있는 리피터 블록에 대한 선언 수가 누락되었습니다.');
    ngDevMode &&
      assertDefined(emptyVars, '비어있는 리피터 블록에 대한 바인딩 수가 누락되었습니다.');

    declareTemplate(
      lView,
      tView,
      index + 2,
      emptyTemplateFn,
      emptyDecls!,
      emptyVars!,
      emptyTagName,
      getConstant(tView.consts, emptyAttrsIndex),
    );
  }
}

function isViewExpensiveToRecreate(lView: LView): boolean {
  // 가정: 바인딩이 있는 텍스트 노드 이상이면 "비용이 많이 든다"고 간주됩니다.
  return lView.length - HEADER_OFFSET > 2;
}

class OperationsCounter {
  created = 0;
  destroyed = 0;

  reset() {
    this.created = 0;
    this.destroyed = 0;
  }

  recordCreate() {
    this.created++;
  }

  recordDestroy() {
    this.destroyed++;
  }

  /**
   * 수집이 다시 생성되었는지 여부를 나타내는 메서드입니다.
   * 과도한 양의 뷰 생성/파괴 작업을 초래할 수 있는 추적 함수 사용에 대해 개발자에게 경고하는 데 사용됩니다.
   *
   * @returns 라이브 컬렉션이 재생성되었는지를 나타내는 부울 값
   */
  wasReCreated(collectionLen: number): boolean {
    return collectionLen > 0 && this.created === this.destroyed && this.created === collectionLen;
  }
}

class LiveCollectionLContainerImpl extends LiveCollection<
  LView<RepeaterContext<unknown>>,
  unknown
> {
  operationsCounter = ngDevMode ? new OperationsCounter() : undefined;

  /**
   리피터 컨텍스트의 인덱스가 라이브 컬렉션 변경 후 업데이트되어야 하는지 여부를 나타내는 속성입니다. 
   뷰가 LContainer의 중간에 삽입되거나 제거되면 인덱스 업데이트가 필요합니다. 
   마지막에 추가되거나 제거되는 것은 인덱스 업데이트를 요구하지 않습니다.
   */
  private needsIndexUpdate = false;
  constructor(
    private lContainer: LContainer,
    private hostLView: LView,
    private templateTNode: TNode,
  ) {
    super();
  }

  override get length(): number {
    return this.lContainer.length - CONTAINER_HEADER_OFFSET;
  }
  override at(index: number): unknown {
    return this.getLView(index)[CONTEXT].$implicit;
  }
  override attach(index: number, lView: LView<RepeaterContext<unknown>>): void {
    const dehydratedView = lView[HYDRATION] as DehydratedContainerView;
    this.needsIndexUpdate ||= index !== this.length;
    addLViewToLContainer(
      this.lContainer,
      lView,
      index,
      shouldAddViewToDom(this.templateTNode, dehydratedView),
    );
  }
  override detach(index: number): LView<RepeaterContext<unknown>> {
    this.needsIndexUpdate ||= index !== this.length - 1;
    return detachExistingView<RepeaterContext<unknown>>(this.lContainer, index);
  }
  override create(index: number, value: unknown): LView<RepeaterContext<unknown>> {
    const dehydratedView = findMatchingDehydratedView(
      this.lContainer,
      this.templateTNode.tView!.ssrId,
    );
    const embeddedLView = createAndRenderEmbeddedLView(
      this.hostLView,
      this.templateTNode,
      new RepeaterContext(this.lContainer, value, index),
      {dehydratedView},
    );
    this.operationsCounter?.recordCreate();

    return embeddedLView;
  }
  override destroy(lView: LView<RepeaterContext<unknown>>): void {
    destroyLView(lView[TVIEW], lView);
    this.operationsCounter?.recordDestroy();
  }
  override updateValue(index: number, value: unknown): void {
    this.getLView(index)[CONTEXT].$implicit = value;
  }

  reset(): void {
    this.needsIndexUpdate = false;
    this.operationsCounter?.reset();
  }

  updateIndexes(): void {
    if (this.needsIndexUpdate) {
      for (let i = 0; i < this.length; i++) {
        this.getLView(i)[CONTEXT].$index = i;
      }
    }
  }

  private getLView(index: number): LView<RepeaterContext<unknown>> {
    return getExistingLViewFromLContainer(this.lContainer, index);
  }
}

/**
 * 리피터 명령문은 제공된 컬렉션을 업데이트 타임에서 비교하고
 * 변경 사항을 뷰 구조에 매핑합니다 (필요에 따라 뷰를 추가, 제거 또는 이동함).
 * @param collection - 변경 여부를 확인할 컬렉션 인스턴스
 * @codeGenApi
 */
export function ɵɵrepeater(collection: Iterable<unknown> | undefined | null): void {
  const prevConsumer = setActiveConsumer(null);
  const metadataSlotIdx = getSelectedIndex();
  try {
    const hostLView = getLView();
    const hostTView = hostLView[TVIEW];
    const metadata = hostLView[metadataSlotIdx] as RepeaterMetadata;
    const containerIndex = metadataSlotIdx + 1;
    const lContainer = getLContainer(hostLView, containerIndex);

    if (metadata.liveCollection === undefined) {
      const itemTemplateTNode = getExistingTNode(hostTView, containerIndex);
      metadata.liveCollection = new LiveCollectionLContainerImpl(
        lContainer,
        hostLView,
        itemTemplateTNode,
      );
    } else {
      metadata.liveCollection.reset();
    }

    const liveCollection = metadata.liveCollection;
    reconcile(liveCollection, collection, metadata.trackByFn);

    // 전체 컬렉션이 재생성되었습니다는 경고 메시지입니다.
    // 이 경고는 "과잉 반응"일 수 있으며, 재생성이 의도된 행동일 수 있습니다.
    if (
      ngDevMode &&
      metadata.trackByFn === ɵɵrepeaterTrackByIdentity &&
      liveCollection.operationsCounter?.wasReCreated(liveCollection.length) &&
      isViewExpensiveToRecreate(getExistingLViewFromLContainer(lContainer, 0))
    ) {
      const message = formatRuntimeError(
        RuntimeErrorCode.LOOP_TRACK_RECREATE,
        `구성된 추적 표현식(track by identity)이 ${liveCollection.length} 크기의 전체 컬렉션을 재생성했습니다. ` +
          '이것은 DOM 노드, 지시문, 구성 요소 등의 파괴 및 이후 생성을 요구하는 비용이 많이 드는 작업입니다. ' +
          ' "track expression"을 검토하고 컬렉션의 항목을 고유하게 식별하는지 확인하십시오.',
      );
      console.warn(message);
    }

    // 컨테이너에서의 이동으로 인해 컨텍스트의 인덱스가 순서에서 벗어날 수 있으므로, 필요에 따라 다시 조정합니다.
    liveCollection.updateIndexes();

    // 빈 블록을 처리합니다.
    if (metadata.hasEmptyBlock) {
      const bindingIndex = nextBindingIndex();
      const isCollectionEmpty = liveCollection.length === 0;
      if (bindingUpdated(hostLView, bindingIndex, isCollectionEmpty)) {
        const emptyTemplateIndex = metadataSlotIdx + 2;
        const lContainerForEmpty = getLContainer(hostLView, emptyTemplateIndex);
        if (isCollectionEmpty) {
          const emptyTemplateTNode = getExistingTNode(hostTView, emptyTemplateIndex);
          const dehydratedView = findMatchingDehydratedView(
            lContainerForEmpty,
            emptyTemplateTNode.tView!.ssrId,
          );
          const embeddedLView = createAndRenderEmbeddedLView(
            hostLView,
            emptyTemplateTNode,
            undefined,
            {dehydratedView},
          );
          addLViewToLContainer(
            lContainerForEmpty,
            embeddedLView,
            0,
            shouldAddViewToDom(emptyTemplateTNode, dehydratedView),
          );
        } else {
          removeLViewFromLContainer(lContainerForEmpty, 0);
        }
      }
    }
  } finally {
    setActiveConsumer(prevConsumer);
  }
}

function getLContainer(lView: LView, index: number): LContainer {
  const lContainer = lView[index];
  ngDevMode && assertLContainer(lContainer);

  return lContainer;
}

function detachExistingView<T>(lContainer: LContainer, index: number): LView<T> {
  const existingLView = detachView(lContainer, index);
  ngDevMode && assertLView(existingLView);

  return existingLView as LView<T>;
}

function getExistingLViewFromLContainer<T>(lContainer: LContainer, index: number): LView<T> {
  const existingLView = getLViewFromLContainer<T>(lContainer, index);
  ngDevMode && assertLView(existingLView);

  return existingLView!;
}

function getExistingTNode(tView: TView, index: number): TNode {
  const tNode = getTNode(tView, index);
  ngDevMode && assertTNode(tNode);

  return tNode;
}
