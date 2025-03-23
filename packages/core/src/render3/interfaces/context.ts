/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {getLViewById} from './lview_tracking';
import {RNode} from './renderer_dom';
import {LView} from './view';

/**
 * 주어진 DOM 요소, 지시문 또는 컴포넌트 인스턴스에 특정한 내부 뷰 컨텍스트입니다. 여기의 각 값(LView 및 요소 노드 세부 정보 제외)은 존재할 수 있으며, null 또는 undefined일 수 있습니다. undefined이면 값이 아직 조회되지 않았음을 의미하고, null이면 조회가 실행되었으나 아무것도 발견되지 않았음을 의미합니다.
 *
 * 각 값은 getContext 함수 내에서 해당 값이 검토될 때 채워집니다. 컴포넌트, 요소 및 각 지시문 인스턴스는 같은 컨텍스트 인스턴스를 공유합니다.
 */
export class LContext {
  /**
   * 컴포넌트 노드의 인스턴스입니다.
   */
  public component: {} | null | undefined;

  /**
   * 이 요소에 존재하는 활성 지시문의 목록입니다.
   */
  public directives: any[] | null | undefined;

  /**
   * 이 요소에 존재하는 지역 참조(지역 참조 이름 => 요소 또는 지시문 인스턴스)의 맵입니다.
   */
  public localRefs: {[key: string]: any} | null | undefined;

  /** 컴포넌트 부모 뷰 데이터. */
  get lView(): LView | null {
    return getLViewById(this.lViewId);
  }

  constructor(
    /**
     * 컴포넌트 부모 뷰 데이터의 ID입니다.
     */
    private lViewId: number,

    /**
     * 노드의 인덱스 인스턴스입니다.
     */
    public nodeIndex: number,

    /**
     * lNode에 연결된 DOM 노드의 인스턴스입니다.
     */
    public native: RNode,
  ) {}
}
