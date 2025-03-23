/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// 우리는 기존 viewEngine_from core를 임시로 가져와서
// 이전 호환성을 위해 정확하게 인터페이스를 구현하고 있는지 확인할 수 있습니다.

import {ProviderToken} from '../../di/provider_token';
import {createElementRef, ElementRef as ViewEngine_ElementRef} from '../../linker/element_ref';
import {QueryList} from '../../linker/query_list';
import {createTemplateRef, TemplateRef as ViewEngine_TemplateRef} from '../../linker/template_ref';
import {createContainerRef, ViewContainerRef} from '../../linker/view_container_ref';
import {assertDefined, assertIndexInRange, assertNumber, throwError} from '../../util/assert';
import {stringify} from '../../util/stringify';

import {assertFirstCreatePass, assertLContainer} from '../assert';
import {getNodeInjectable, locateDirectiveOrProvider} from '../di';
import {CONTAINER_HEADER_OFFSET, LContainer, MOVED_VIEWS} from '../interfaces/container';
import {
  TContainerNode,
  TElementContainerNode,
  TElementNode,
  TNode,
  TNodeType,
} from '../interfaces/node';
import {LQueries, LQuery, QueryFlags, TQueries, TQuery, TQueryMetadata} from '../interfaces/query';
import {DECLARATION_LCONTAINER, LView, PARENT, QUERIES, TVIEW, TView} from '../interfaces/view';
import {assertTNodeType} from '../node_assert';
import {getCurrentTNode, getLView, getTView} from '../state';
import {storeCleanupWithContext} from '../util/view_utils';

class LQuery_<T> implements LQuery<T> {
  matches: (T | null)[] | null = null;
  constructor(public queryList: QueryList<T>) {}
  clone(): LQuery<T> {
    return new LQuery_(this.queryList);
  }
  setDirty(): void {
    this.queryList.setDirty();
  }
}

class LQueries_ implements LQueries {
  constructor(public queries: LQuery<any>[] = []) {}

  createEmbeddedView(tView: TView): LQueries | null {
    const tQueries = tView.queries;
    if (tQueries !== null) {
      const noOfInheritedQueries =
        tView.contentQueries !== null ? tView.contentQueries[0] : tQueries.length;
      const viewLQueries: LQuery<any>[] = [];

      // 임베디드 뷰는 선언 뷰에서 전파된 쿼리가 TQueries 컬렉션의 시작 부분과
      // 임베디드 뷰에 선언된 첫 번째 콘텐츠 쿼리까지입니다. 이 시점에서는 전파된 LQueries만 생성됩니다.
      for (let i = 0; i < noOfInheritedQueries; i++) {
        const tQuery = tQueries.getByIndex(i);
        const parentLQuery = this.queries[tQuery.indexInDeclarationView];
        viewLQueries.push(parentLQuery.clone());
      }

      return new LQueries_(viewLQueries);
    }

    return null;
  }

  insertView(tView: TView): void {
    this.dirtyQueriesWithMatches(tView);
  }

  detachView(tView: TView): void {
    this.dirtyQueriesWithMatches(tView);
  }

  finishViewCreation(tView: TView): void {
    this.dirtyQueriesWithMatches(tView);
  }

  private dirtyQueriesWithMatches(tView: TView) {
    for (let i = 0; i < this.queries.length; i++) {
      if (getTQuery(tView, i).matches !== null) {
        this.queries[i].setDirty();
      }
    }
  }
}

export class TQueryMetadata_ implements TQueryMetadata {
  public predicate: ProviderToken<unknown> | string[];
  constructor(
    predicate: ProviderToken<unknown> | string[] | string,
    public flags: QueryFlags,
    public read: any = null,
  ) {
    // 컴파일러가 여러 선택기를 미리 최적화하고 분할하지 못할 수 있습니다.
    if (typeof predicate === 'string') {
      this.predicate = splitQueryMultiSelectors(predicate);
    } else {
      this.predicate = predicate;
    }
  }
}

class TQueries_ implements TQueries {
  constructor(private queries: TQuery[] = []) {}

  elementStart(tView: TView, tNode: TNode): void {
    ngDevMode &&
      assertFirstCreatePass(tView, '쿼리는 첫 번째 템플릿 패스에서만 결과를 수집해야 합니다.');
    for (let i = 0; i < this.queries.length; i++) {
      this.queries[i].elementStart(tView, tNode);
    }
  }
  elementEnd(tNode: TNode): void {
    for (let i = 0; i < this.queries.length; i++) {
      this.queries[i].elementEnd(tNode);
    }
  }
  embeddedTView(tNode: TNode): TQueries | null {
    let queriesForTemplateRef: TQuery[] | null = null;

    for (let i = 0; i < this.length; i++) {
      const childQueryIndex = queriesForTemplateRef !== null ? queriesForTemplateRef.length : 0;
      const tqueryClone = this.getByIndex(i).embeddedTView(tNode, childQueryIndex);

      if (tqueryClone) {
        tqueryClone.indexInDeclarationView = i;
        if (queriesForTemplateRef !== null) {
          queriesForTemplateRef.push(tqueryClone);
        } else {
          queriesForTemplateRef = [tqueryClone];
        }
      }
    }

    return queriesForTemplateRef !== null ? new TQueries_(queriesForTemplateRef) : null;
  }

  template(tView: TView, tNode: TNode): void {
    ngDevMode &&
      assertFirstCreatePass(tView, '쿼리는 첫 번째 템플릿 패스에서만 결과를 수집해야 합니다.');
    for (let i = 0; i < this.queries.length; i++) {
      this.queries[i].template(tView, tNode);
    }
  }

  getByIndex(index: number): TQuery {
    ngDevMode && assertIndexInRange(this.queries, index);
    return this.queries[index];
  }

  get length(): number {
    return this.queries.length;
  }

  track(tquery: TQuery): void {
    this.queries.push(tquery);
  }
}

class TQuery_ implements TQuery {
  matches: number[] | null = null;
  indexInDeclarationView = -1;
  crossesNgTemplate = false;

  /**
   * 쿼리가 선언된 노드 인덱스 (-1은 뷰 쿼리 및 선언 템플릿에서 상속된 것을 나타냅니다).
   * 우리는 이 인덱스 (_appliesToNextNode 플래그와 함께)를 사용하여
   * 템플릿의 요소에 콘텐츠 쿼리를 적용할 시기를 알 수 있습니다.
   */
  private _declarationNodeIndex: number;

  /**
   * 주어진 쿼리가 여전히 교차하는 노드에 적용되는지를 나타내는 플래그입니다.
   * 우리는 이 플래그 (_declarationNodeIndex와 함께)를 사용하여
   * 템플릿의 요소에 콘텐츠 쿼리를 적용할 때 중단할 시기를 알 수 있습니다.
   */
  private _appliesToNextNode = true;

  constructor(
    public metadata: TQueryMetadata,
    nodeIndex: number = -1,
  ) {
    this._declarationNodeIndex = nodeIndex;
  }

  elementStart(tView: TView, tNode: TNode): void {
    if (this.isApplyingToNode(tNode)) {
      this.matchTNode(tView, tNode);
    }
  }

  elementEnd(tNode: TNode): void {
    if (this._declarationNodeIndex === tNode.index) {
      this._appliesToNextNode = false;
    }
  }

  template(tView: TView, tNode: TNode): void {
    this.elementStart(tView, tNode);
  }

  embeddedTView(tNode: TNode, childQueryIndex: number): TQuery | null {
    if (this.isApplyingToNode(tNode)) {
      this.crossesNgTemplate = true;
      // `<ng-template>` 요소를 나타내는 마커(이 `<ng-template>`을 기반으로 생성된
      // 임베디드 뷰의 쿼리 결과를 위한 자리 표시자).
      this.addMatch(-tNode.index, childQueryIndex);
      return new TQuery_(this.metadata);
    }
    return null;
  }

  private isApplyingToNode(tNode: TNode): boolean {
    if (
      this._appliesToNextNode &&
      (this.metadata.flags & QueryFlags.descendants) !== QueryFlags.descendants
    ) {
      const declarationNodeIdx = this._declarationNodeIndex;
      let parent = tNode.parent;
      // 주어진 TNode가 콘텐츠 쿼리가 선언된 노드의 "직접적인" 자식인지 확인합니다.
      // 쿼리의 호스트 노드의 직접 자식만이 descendants: false 옵션과 일치할 수 있습니다.
      // 여기에서 고려해야 할 주요 사용 사례/조건이 3개 있습니다:
      // - <needs-target><i #target></i></needs-target>: 여기서 <i #target> 부모 노드는 쿼리 호스트 노드입니다.
      // - <needs-target><ng-template [ngIf]="true"><i #target></i></ng-template></needs-target>: 여기서 <i #target> 부모 노드는 null입니다.
      // - <needs-target><ng-container><i #target></i></ng-container></needs-target>: 여기서 우리는 <ng-container>를 넘어 <i #target> 부모 노드를 결정해야 하지만
      // 쿼리의 호스트 노드를 넘어서는 것은 아닙니다.
      while (
        parent !== null &&
        parent.type & TNodeType.ElementContainer &&
        parent.index !== declarationNodeIdx
      ) {
        parent = parent.parent;
      }
      return declarationNodeIdx === (parent !== null ? parent.index : -1);
    }
    return this._appliesToNextNode;
  }

  private matchTNode(tView: TView, tNode: TNode): void {
    const predicate = this.metadata.predicate;
    if (Array.isArray(predicate)) {
      for (let i = 0; i < predicate.length; i++) {
        const name = predicate[i];
        this.matchTNodeWithReadOption(tView, tNode, getIdxOfMatchingSelector(tNode, name));
        // 문자열이 DI 토큰으로 사용될 수 있으므로, 프로바이더와도 일치시켜 봅니다.
        this.matchTNodeWithReadOption(
          tView,
          tNode,
          locateDirectiveOrProvider(tNode, tView, name, false, false),
        );
      }
    } else {
      if ((predicate as any) === ViewEngine_TemplateRef) {
        if (tNode.type & TNodeType.Container) {
          this.matchTNodeWithReadOption(tView, tNode, -1);
        }
      } else {
        this.matchTNodeWithReadOption(
          tView,
          tNode,
          locateDirectiveOrProvider(tNode, tView, predicate, false, false),
        );
      }
    }
  }

  private matchTNodeWithReadOption(tView: TView, tNode: TNode, nodeMatchIdx: number | null): void {
    if (nodeMatchIdx !== null) {
      const read = this.metadata.read;
      if (read !== null) {
        if (
          read === ViewEngine_ElementRef ||
          read === ViewContainerRef ||
          (read === ViewEngine_TemplateRef && tNode.type & TNodeType.Container)
        ) {
          this.addMatch(tNode.index, -2);
        } else {
          const directiveOrProviderIdx = locateDirectiveOrProvider(
            tNode,
            tView,
            read,
            false,
            false,
          );
          if (directiveOrProviderIdx !== null) {
            this.addMatch(tNode.index, directiveOrProviderIdx);
          }
        }
      } else {
        this.addMatch(tNode.index, nodeMatchIdx);
      }
    }
  }

  private addMatch(tNodeIdx: number, matchIdx: number) {
    if (this.matches === null) {
      this.matches = [tNodeIdx, matchIdx];
    } else {
      this.matches.push(tNodeIdx, matchIdx);
    }
  }
}

/**
 * 특정 노드에 대한 로컬 이름을 반복하고 지시자 인덱스를 반환합니다
 * (또는 로컬 이름이 요소를 가리키는 경우 -1).
 *
 * @param tNode 확인할 노드의 정적 데이터
 * @param selector 일치할 선택자
 * @returns 지시자 인덱스, 로컬 이름이 선택자와 일치하지 않는 경우 -1 또는 null
 */
function getIdxOfMatchingSelector(tNode: TNode, selector: string): number | null {
  const localNames = tNode.localNames;
  if (localNames !== null) {
    for (let i = 0; i < localNames.length; i += 2) {
      if (localNames[i] === selector) {
        return localNames[i + 1] as number;
      }
    }
  }
  return null;
}

function createResultByTNodeType(tNode: TNode, currentView: LView): any {
  if (tNode.type & (TNodeType.AnyRNode | TNodeType.ElementContainer)) {
    return createElementRef(tNode, currentView);
  } else if (tNode.type & TNodeType.Container) {
    return createTemplateRef(tNode, currentView);
  }
  return null;
}

function createResultForNode(lView: LView, tNode: TNode, matchingIdx: number, read: any): any {
  if (matchingIdx === -1) {
    // 읽기 토큰 및/또는 전략이 지정되지 않은 경우 적절한 tNode 유형을 사용하여 이를 감지합니다.
    return createResultByTNodeType(tNode, lView);
  } else if (matchingIdx === -2) {
    // 노드 주입기에서 특별한 토큰을 읽습니다.
    return createSpecialToken(lView, tNode, read);
  } else {
    // 토큰을 읽습니다.
    return getNodeInjectable(lView, lView[TVIEW], matchingIdx, tNode as TElementNode);
  }
}

function createSpecialToken(lView: LView, tNode: TNode, read: any): any {
  if (read === ViewEngine_ElementRef) {
    return createElementRef(tNode, lView);
  } else if (read === ViewEngine_TemplateRef) {
    return createTemplateRef(tNode, lView);
  } else if (read === ViewContainerRef) {
    ngDevMode && assertTNodeType(tNode, TNodeType.AnyRNode | TNodeType.AnyContainer);
    return createContainerRef(
      tNode as TElementNode | TContainerNode | TElementContainerNode,
      lView,
    );
  } else {
    ngDevMode &&
      throwError(
        `읽어야 하는 특별한 토큰은 ElementRef, TemplateRef 또는 ViewContainerRef 중 하나여야 하지만 ${stringify(
          read,
        )}를 받았습니다.`,
      );
  }
}

/**
 * 주어진 뷰에 대한 쿼리 결과를 생성하는 헬퍼 함수. 이 함수는 주어진 뷰 인스턴스에 대해
 * 한 번만 처리하는 것을 목표로 합니다 (주어진 뷰에 대한 결과 세트는 변경되지 않음).
 */
function materializeViewResults<T>(
  tView: TView,
  lView: LView,
  tQuery: TQuery,
  queryIndex: number,
): T[] {
  const lQuery = lView[QUERIES]!.queries![queryIndex];
  if (lQuery.matches === null) {
    const tViewData = tView.data;
    const tQueryMatches = tQuery.matches;
    const result: Array<T | null> = [];
    for (let i = 0; tQueryMatches !== null && i < tQueryMatches.length; i += 2) {
      const matchedNodeIdx = tQueryMatches[i];
      if (matchedNodeIdx < 0) {
        // 우리는 이 <ng-template>의 마커에 있으며
        // 이는 이 <ng-template>을 기반으로 생성된 뷰에 결과가 있을 수 있습니다.
        // 그러나 이러한 결과는 별도의 뷰에 있으므로 여기에서는 null을 자리 표시자로 남겨둡니다.
        result.push(null);
      } else {
        ngDevMode && assertIndexInRange(tViewData, matchedNodeIdx);
        const tNode = tViewData[matchedNodeIdx] as TNode;
        result.push(createResultForNode(lView, tNode, tQueryMatches[i + 1], tQuery.metadata.read));
      }
    }
    lQuery.matches = result;
  }

  return lQuery.matches;
}

/**
 * 특정 쿼리가 활성화된 모든 뷰에서 결과를 수집하는 헬퍼 함수.
 * @param lView
 * @param queryIndex
 */
function collectQueryResults<T>(tView: TView, lView: LView, queryIndex: number, result: T[]): T[] {
  const tQuery = tView.queries!.getByIndex(queryIndex);
  const tQueryMatches = tQuery.matches;
  if (tQueryMatches !== null) {
    const lViewResults = materializeViewResults<T>(tView, lView, tQuery, queryIndex);

    for (let i = 0; i < tQueryMatches.length; i += 2) {
      const tNodeIdx = tQueryMatches[i];
      if (tNodeIdx > 0) {
        result.push(lViewResults[i / 2] as T);
      } else {
        const childQueryIndex = tQueryMatches[i + 1];

        const declarationLContainer = lView[-tNodeIdx] as LContainer;
        ngDevMode && assertLContainer(declarationLContainer);

        // 이 컨테이너에 삽입된 뷰에 대한 일치를 수집합니다.
        for (let i = CONTAINER_HEADER_OFFSET; i < declarationLContainer.length; i++) {
          const embeddedLView = declarationLContainer[i];
          if (embeddedLView[DECLARATION_LCONTAINER] === embeddedLView[PARENT]) {
            collectQueryResults(embeddedLView[TVIEW], embeddedLView, childQueryIndex, result);
          }
        }

        // 이 선언 컨테이너에서 생성된 뷰와 서로 다른 컨테이너에 삽입된 뷰의 일치를 수집합니다.
        if (declarationLContainer[MOVED_VIEWS] !== null) {
          const embeddedLViews = declarationLContainer[MOVED_VIEWS]!;
          for (let i = 0; i < embeddedLViews.length; i++) {
            const embeddedLView = embeddedLViews[i];
            collectQueryResults(embeddedLView[TVIEW], embeddedLView, childQueryIndex, result);
          }
        }
      }
    }
  }
  return result;
}

export function loadQueryInternal<T>(lView: LView, queryIndex: number): QueryList<T> {
  ngDevMode &&
    assertDefined(lView[QUERIES], 'LQueries는 쿼리를 로드하려고 할 때 정의되어야 합니다.');
  ngDevMode && assertIndexInRange(lView[QUERIES]!.queries, queryIndex);
  return lView[QUERIES]!.queries[queryIndex].queryList;
}

/**
 * LQuery의 새로운 인스턴스를 생성하고 해당 컬렉션의 인덱스를 반환합니다.
 *
 * @returns LQuery 객체의 컬렉션에서 인덱스
 */
function createLQuery<T>(tView: TView, lView: LView, flags: QueryFlags): number {
  const queryList = new QueryList<T>(
    (flags & QueryFlags.emitDistinctChangesOnly) === QueryFlags.emitDistinctChangesOnly,
  );

  storeCleanupWithContext(tView, lView, queryList, queryList.destroy);

  const lQueries = (lView[QUERIES] ??= new LQueries_()).queries;
  return lQueries.push(new LQuery_(queryList)) - 1;
}

export function createViewQuery<T>(
  predicate: ProviderToken<unknown> | string[] | string,
  flags: QueryFlags,
  read?: any,
): number {
  ngDevMode && assertNumber(flags, '플래그를 기대합니다.');
  const tView = getTView();
  if (tView.firstCreatePass) {
    createTQuery(tView, new TQueryMetadata_(predicate, flags, read), -1);
    if ((flags & QueryFlags.isStatic) === QueryFlags.isStatic) {
      tView.staticViewQueries = true;
    }
  }

  return createLQuery<T>(tView, getLView(), flags);
}

export function createContentQuery<T>(
  directiveIndex: number,
  predicate: ProviderToken<unknown> | string[] | string,
  flags: QueryFlags,
  read?: ProviderToken<T>,
): number {
  ngDevMode && assertNumber(flags, '플래그를 기대합니다.');
  const tView = getTView();
  if (tView.firstCreatePass) {
    const tNode = getCurrentTNode()!;
    createTQuery(tView, new TQueryMetadata_(predicate, flags, read), tNode.index);
    saveContentQueryAndDirectiveIndex(tView, directiveIndex);
    if ((flags & QueryFlags.isStatic) === QueryFlags.isStatic) {
      tView.staticContentQueries = true;
    }
  }

  return createLQuery<T>(tView, getLView(), flags);
}

/** 여러 선택기를 로케이터에서 분할합니다. */
function splitQueryMultiSelectors(locator: string): string[] {
  return locator.split(',').map((s) => s.trim());
}

export function createTQuery(tView: TView, metadata: TQueryMetadata, nodeIndex: number): void {
  if (tView.queries === null) tView.queries = new TQueries_();
  tView.queries.track(new TQuery_(metadata, nodeIndex));
}

export function saveContentQueryAndDirectiveIndex(tView: TView, directiveIndex: number) {
  const tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
  const lastSavedDirectiveIndex = tViewContentQueries.length
    ? tViewContentQueries[tViewContentQueries.length - 1]
    : -1;
  if (directiveIndex !== lastSavedDirectiveIndex) {
    tViewContentQueries.push(tView.queries!.length - 1, directiveIndex);
  }
}

export function getTQuery(tView: TView, index: number): TQuery {
  ngDevMode && assertDefined(tView.queries, 'TQueries는 TQuery를 검색하기 위해 정의되어야 합니다.');
  return tView.queries!.getByIndex(index);
}

/**
 * 주어진 쿼리가 활성화된 모든 뷰에서 결과를 수집하는 헬퍼 함수입니다.
 * @param lView
 * @param queryIndex
 */
export function getQueryResults<V>(lView: LView, queryIndex: number): V[] {
  const tView = lView[TVIEW];
  const tQuery = getTQuery(tView, queryIndex);
  return tQuery.crossesNgTemplate
    ? collectQueryResults<V>(tView, lView, queryIndex, [])
    : materializeViewResults<V>(tView, lView, tQuery, queryIndex);
}
