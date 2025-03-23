/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {ChangeDetectorRef} from '../change_detection/change_detector_ref';
import {NotificationSource} from '../change_detection/scheduling/zoneless_scheduling';
import type {ApplicationRef} from '../core';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import type {EmbeddedViewRef} from '../linker/view_ref';
import {removeFromArray} from '../util/array_utils';
import {assertEqual} from '../util/assert';

import {collectNativeNodes} from './collect_native_nodes';
import {checkNoChangesInternal, detectChangesInternal} from './instructions/change_detection';
import {markViewDirty} from './instructions/mark_view_dirty';
import {CONTAINER_HEADER_OFFSET, VIEW_REFS} from './interfaces/container';
import {isDestroyed, isLContainer, isRootView} from './interfaces/type_checks';
import {
  CONTEXT,
  DECLARATION_LCONTAINER,
  FLAGS,
  LView,
  LViewFlags,
  PARENT,
  TVIEW,
} from './interfaces/view';
import {destroyLView, detachMovedView, detachViewFromDOM} from './node_manipulation';
import {CheckNoChangesMode} from './state';
import {
  markViewForRefresh,
  storeLViewOnDestroy,
  updateAncestorTraversalFlagsOnAttach,
  requiresRefreshOrTraversal,
} from './util/view_utils';
import {detachView, trackMovedView} from './view/container';

// Needed due to tsickle downleveling where multiple `implements` with classes creates
// multiple @extends in Closure annotations, which is illegal. This workaround fixes
// the multiple @extends by making the annotation @implements instead
interface ChangeDetectorRefInterface extends ChangeDetectorRef {}

export class ViewRef<T> implements EmbeddedViewRef<T>, ChangeDetectorRefInterface {
  private _appRef: ApplicationRef | null = null;
  private _attachedToViewContainer = false;

  get rootNodes(): any[] {
    const lView = this._lView;
    const tView = lView[TVIEW];
    return collectNativeNodes(tView, lView, tView.firstChild, []);
  }

  constructor(
    /**
     * 이 것은 ViewRef가 ChangeDetectorRef일 때와 연결된 컴포넌트와 관련된 `LView`를 나타냅니다.
     *
     * ViewRef가 동적 컴포넌트를 위해 생성될 때, 이는 또한 해당
     * 컴포넌트에 대한 `LView`를 나타냅니다.
     *
     * 내장 뷰에 대한 "일반" ViewRef가 생성될 때, 이는 내장 뷰에 대한 `LView`입니다.
     *
     * @internal
     */
    public _lView: LView,

    /**
     * 이 것은 `ChangeDetectorRef`가 요청된 지점과 관련된 `LView`를 나타냅니다.
     *
     * `_cdRefInjectingView`가 내장 뷰이면 `_lView`와 다를 수 있습니다.
     */
    private _cdRefInjectingView?: LView,
  ) {}

  get context(): T {
    return this._lView[CONTEXT] as unknown as T;
  }

  /**
   * @deprecated 전체 컨텍스트 객체를 교체하는 것은 지원되지 않습니다. 컨텍스트를
   *   직접 수정하거나 전체 객체를 교체해야 하는 경우 `Proxy`를 사용하는 것을 고려하세요.
   * // TODO(devversion): 이걸 제거하세요.
   */
  set context(value: T) {
    if (ngDevMode) {
      // 주목: 설정자에 대한 할당에 대해 `@deprecated` JSDoc이 수집되지 않기 때문에
      // 경고 메시지가 여기 있습니다. 우리는 사용자에게 사용이 더 이상 권장되지 않음을 알리고 싶습니다.
      console.warn(
        'Angular: `EmbeddedViewRef`의 `context` 객체를 교체하는 것은 더 이상 권장되지 않습니다.',
      );
    }

    this._lView[CONTEXT] = value as unknown as {};
  }

  get destroyed(): boolean {
    return isDestroyed(this._lView);
  }

  destroy(): void {
    if (this._appRef) {
      this._appRef.detachView(this);
    } else if (this._attachedToViewContainer) {
      const parent = this._lView[PARENT];
      if (isLContainer(parent)) {
        const viewRefs = parent[VIEW_REFS] as ViewRef<unknown>[] | null;
        const index = viewRefs ? viewRefs.indexOf(this) : -1;
        if (index > -1) {
          ngDevMode &&
            assertEqual(
              index,
              parent.indexOf(this._lView) - CONTAINER_HEADER_OFFSET,
              '부착된 뷰는 VIEW_REFS 배열의 ViewRef와 동일한 위치에 있어야 합니다.',
            );
          detachView(parent, index);
          removeFromArray(viewRefs!, index);
        }
      }
      this._attachedToViewContainer = false;
    }
    destroyLView(this._lView[TVIEW], this._lView);
  }

  onDestroy(callback: Function) {
    storeLViewOnDestroy(this._lView, callback as () => void);
  }

  /**
   * 뷰와 그 조상들을 더럽혀진 것으로 표시합니다.
   *
   * 이는 {@link ChangeDetectionStrategy#OnPush} 컴포넌트가 재렌더링이 필요할 때
   * 체크되도록 보장하는 데 사용할 수 있지만, 두 가지 일반 트리거가 더럽혀지지 않은 경우
   * (즉, 입력이 변경되지 않았고 뷰에서 이벤트가 발생하지 않은 경우).
   *
   * <!-- TODO: OnPush 컴포넌트에 대한 장에 대한 링크 추가 -->
   *
   * @usageNotes
   * ### 예제
   *
   * ```ts
   * @Component({
   *   selector: 'app-root',
   *   template: `틱 수: {{numberOfTicks}}`
   *   changeDetection: ChangeDetectionStrategy.OnPush,
   * })
   * class AppComponent {
   *   numberOfTicks = 0;
   *
   *   constructor(private ref: ChangeDetectorRef) {
   *     setInterval(() => {
   *       this.numberOfTicks++;
   *       // 아래는 필수이며, 그렇지 않으면 뷰가 업데이트되지 않음
   *       this.ref.markForCheck();
   *     }, 1000);
   *   }
   * }
   * ```
   */
  markForCheck(): void {
    markViewDirty(this._cdRefInjectingView || this._lView, NotificationSource.MarkForCheck);
  }

  /**
   * 뷰를 변경 감지 트리에서 분리합니다.
   *
   * 분리된 뷰는 깨끗하지 않더라도 변경 감지 실행 중에 체크되지 않습니다.
   * `detach`는 {@link ChangeDetectorRef#detectChanges}와 함께 사용하여
   * 지역 변경 감지 체크를 구현하는 데 사용할 수 있습니다.
   *
   * <!-- TODO: detach/reattach/local digest에 대한 장에 대한 링크 추가 -->
   * <!-- TODO: ref.detectChanges가 마스터에 병합되면 라이브 데모 추가 -->
   *
   * @usageNotes
   * ### 예제
   *
   * 다음 예제는 읽기 전용 데이터의 대량 목록을 가진 컴포넌트를 정의합니다.
   * 데이터가 매초 여러 번 변화한다고 상상해 보세요. 성능상의 이유로,
   * 우리는 5초마다 목록을 체크하고 업데이트하고자 합니다. 우리는 컴포넌트의
   * 변경 감지기를 분리한 다음 5초마다 지역 체크를 수행하는 방법으로 할 수 있습니다.
   *
   * ```ts
   * class DataProvider {
   *   // 실제 애플리케이션에서는 반환된 데이터가 매번 다를 것입니다
   *   get data() {
   *     return [1,2,3,4,5];
   *   }
   * }
   *
   * @Component({
   *   selector: 'giant-list',
   *   template: `
   *     <li *ngFor="let d of dataProvider.data">데이터 {{d}}</li>
   *   `,
   * })
   * class GiantList {
   *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {
   *     ref.detach();
   *     setInterval(() => {
   *       this.ref.detectChanges();
   *     }, 5000);
   *   }
   * }
   *
   * @Component({
   *   selector: 'app',
   *   providers: [DataProvider],
   *   template: `
   *     <giant-list></giant-list>
   *   `,
   * })
   * class App {
   * }
   * ```
   */
  detach(): void {
    this._lView[FLAGS] &= ~LViewFlags.Attached;
  }

  /**
   * 변경 감지 트리에 뷰를 다시 붙입니다.
   *
   * 이는 {@link ChangeDetectorRef#detach}를 사용하여 트리에서 이전에 분리된 뷰를
   * 다시 붙일 때 사용할 수 있습니다. 뷰는 기본적으로 트리에 부착됩니다.
   *
   * <!-- TODO: detach/reattach/local digest에 대한 장에 대한 링크 추가 -->
   *
   * @usageNotes
   * ### 예제
   *
   * 다음 예제는 `live` 데이터를 표시하는 컴포넌트를 생성합니다. 컴포넌트는
   * `live` 속성이 false로 설정될 때 주요 변경 감지 트리에서 변경 감지기를 분리합니다.
   *
   * ```ts
   * class DataProvider {
   *   data = 1;
   *
   *   constructor() {
   *     setInterval(() => {
   *       this.data = this.data * 2;
   *     }, 500);
   *   }
   * }
   *
   * @Component({
   *   selector: 'live-data',
   *   inputs: ['live'],
   *   template: '데이터: {{dataProvider.data}}'
   * })
   * class LiveData {
   *   constructor(private ref: ChangeDetectorRef, private dataProvider: DataProvider) {}
   *
   *   set live(value) {
   *     if (value) {
   *       this.ref.reattach();
   *     } else {
   *       this.ref.detach();
   *     }
   *   }
   * }
   *
   * @Component({
   *   selector: 'app-root',
   *   providers: [DataProvider],
   *   template: `
   *     라이브 업데이트: <input type="checkbox" [(ngModel)]="live">
   *     <live-data [live]="live"></live-data>
   *   `,
   * })
   * class AppComponent {
   *   live = true;
   * }
   * ```
   */
  reattach(): void {
    updateAncestorTraversalFlagsOnAttach(this._lView);
    this._lView[FLAGS] |= LViewFlags.Attached;
  }

  /**
   * 뷰와 그 자식들을 체크합니다.
   *
   * 이는 또한 {@link ChangeDetectorRef#detach}와 함께 사용하여 지역 변경 감지 체크를
   * 구현하는 데 사용할 수 있습니다.
   *
   * <!-- TODO: detach/reattach/local digest에 대한 장에 대한 링크 추가 -->
   * <!-- TODO: ref.detectChanges가 마스터에 병합되면 라이브 데모 추가 -->
   *
   * @usageNotes
   * ### 예제
   *
   * 다음 예제는 읽기 전용 데이터의 대량 목록을 가진 컴포넌트를 정의합니다.
   * 데이터가 매초 여러 번 변화한다고 상상해 보세요. 성능상의 이유로,
   * 우리는 5초마다 목록을 체크하고 업데이트하고자 합니다.
   *
   * 컴포넌트의 변경 감지기를 분리하고 5초마다 지역 변경 감지 체크를 수행함으로써
   * 우리는 이를 수행할 수 있습니다.
   *
   * {@link ChangeDetectorRef#detach}에 대한 추가 정보를 참조하십시오.
   */
  detectChanges(): void {
    // 깨끗하지 않은 경우 뷰가 새로 고쳐지도록 보장하기 위해 `RefreshView` 플래그 추가.
    // `RefreshView` 플래그는 실제 새로 고침 코드가 실행되기 전에 지워지기 때문에
    // 의도적으로 사용되며, `Dirty` 플래그는 새로 고침 끝날 때까지 지워지지 않습니다.
    // `RefreshView`를 사용하면 템플릿 실행 중 LViewFlags의 상태 차이를 방지할 수 있습니다.
    this._lView[FLAGS] |= LViewFlags.RefreshView;
    detectChangesInternal(this._lView);
  }

  /**
   * 변경 감지기와 그 자식들을 체크하며, 변화가 감지되면 예외를 발생시킵니다.
   *
   * 이는 개발 모드에서 변경 감지를 실행해도 다른 변화가 발생하지 않도록 검증하는 데 사용됩니다.
   */
  checkNoChanges(): void {
    if (ngDevMode) {
      checkNoChangesInternal(this._lView, CheckNoChangesMode.OnlyDirtyViews);
    }
  }

  attachToViewContainerRef() {
    if (this._appRef) {
      throw new RuntimeError(
        RuntimeErrorCode.VIEW_ALREADY_ATTACHED,
        ngDevMode && '이 뷰는 이미 ApplicationRef에 직접 연결되어 있습니다!',
      );
    }
    this._attachedToViewContainer = true;
  }

  detachFromAppRef() {
    this._appRef = null;
    const isRoot = isRootView(this._lView);
    const declarationContainer = this._lView[DECLARATION_LCONTAINER];
    if (declarationContainer !== null && !isRoot) {
      detachMovedView(declarationContainer, this._lView);
    }
    detachViewFromDOM(this._lView[TVIEW], this._lView);
  }

  attachToAppRef(appRef: ApplicationRef) {
    if (this._attachedToViewContainer) {
      throw new RuntimeError(
        RuntimeErrorCode.VIEW_ALREADY_ATTACHED,
        ngDevMode && '이 뷰는 이미 ViewContainer에 연결되어 있습니다!',
      );
    }
    this._appRef = appRef;
    const isRoot = isRootView(this._lView);
    const declarationContainer = this._lView[DECLARATION_LCONTAINER];
    if (declarationContainer !== null && !isRoot) {
      trackMovedView(declarationContainer, this._lView);
    }
    updateAncestorTraversalFlagsOnAttach(this._lView);
  }
}

/**
 * 주어진 뷰가 다양한 표시 메커니즘에 따라 더럽혀진 것으로 간주되는지 보고합니다.
 */
export function isViewDirty(view: ViewRef<unknown>): boolean {
  return requiresRefreshOrTraversal(view._lView) || !!(view._lView[FLAGS] & LViewFlags.Dirty);
}

export function markForRefresh(view: ViewRef<unknown>): void {
  markViewForRefresh(view['_cdRefInjectingView'] || view._lView);
}
