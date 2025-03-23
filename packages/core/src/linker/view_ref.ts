/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ChangeDetectorRef} from '../change_detection/change_detector_ref';

/**
 * Angular 뷰를 나타냅니다.
 *
 * @see {@link /api/core/ChangeDetectorRef?tab=usage-notes 변경 감지 사용}
 *
 * @publicApi
 */
export abstract class ViewRef extends ChangeDetectorRef {
  /**
   * 이 뷰 및 그것과 관련된 모든 데이터 구조를 파괴합니다.
   */
  abstract destroy(): void;

  /**
   * 이 뷰가 파괴되었는지 여부를 보고합니다.
   * @returns `destroy()` 메소드가 호출된 후 true, 그렇지 않으면 false.
   */
  abstract get destroyed(): boolean;

  /**
   * 뷰에 대한 추가 개발자 정의 정리 기능을 제공하는 생명 주기 훅입니다.
   * @param callback 뷰와 관련된 개발자 정의 데이터를 정리하는 핸들러 함수입니다.
   * `destroy()` 메소드가 호출될 때 호출됩니다.
   */
  abstract onDestroy(callback: Function): void;
}

/**
 * 뷰 컨테이너 내의 Angular 뷰를 나타냅니다.
 * 임베디드 뷰는 그것을 정의하는 템플릿을 가진 호스팅 컴포넌트 외부의
 * 컴포넌트에서 참조되거나, 독립적으로 `TemplateRef`에 의해 정의될 수 있습니다.
 *
 * 뷰 내의 요소의 속성은 변경될 수 있지만,
 * 뷰 내의 요소의 구조(숫자 및 순서)는 변경될 수 없습니다.
 * 뷰 컨테이너에서 중첩 뷰를 삽입, 이동 또는 제거하여 요소의 구조를 변경합니다.
 *
 * @see {@link ViewContainerRef}
 *
 * @usageNotes
 *
 * 다음 템플릿은 두 개의 별도의 `TemplateRef` 인스턴스로 분해됩니다.
 * 외부 인스턴스와 내부 인스턴스입니다.
 *
 * ```html
 * Count: {{items.length}}
 * <ul>
 *   <li *ngFor="let  item of items">{{item}}</li>
 * </ul>
 * ```
 *
 * 이것은 외부 `TemplateRef`입니다:
 *
 * ```html
 * Count: {{items.length}}
 * <ul>
 *   <ng-template ngFor let-item [ngForOf]="items"></ng-template>
 * </ul>
 * ```
 *
 * 이것은 내부 `TemplateRef`입니다:
 *
 * ```html
 *   <li>{{item}}</li>
 * ```
 *
 * 외부 및 내부 `TemplateRef` 인스턴스는 다음과 같이 뷰에 조립됩니다:
 *
 * ```html
 * <!-- ViewRef: outer-0 -->
 * Count: 2
 * <ul>
 *   <ng-template view-container-ref></ng-template>
 *   <!-- ViewRef: inner-1 --><li>first</li><!-- /ViewRef: inner-1 -->
 *   <!-- ViewRef: inner-2 --><li>second</li><!-- /ViewRef: inner-2 -->
 * </ul>
 * <!-- /ViewRef: outer-0 -->
 * ```
 * @publicApi
 */
export abstract class EmbeddedViewRef<C> extends ViewRef {
  /**
   * 이 뷰의 컨텍스트, 앵커 요소에서 상속됩니다.
   */
  abstract context: C;

  /**
   * 이 임베디드 뷰의 루트 노드입니다.
   */
  abstract get rootNodes(): any[];
}
