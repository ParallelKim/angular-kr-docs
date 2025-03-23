/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ViewEncapsulation} from '../metadata/view';

/**
 * `RendererFactory2`에 의해 사용자 지정 렌더링 데이터 및 스타일을
 * 렌더링 구현과 연관시키기 위해 사용됩니다.
 *  @publicApi
 */
export interface RendererType2 {
  /**
   * 고유 식별 문자열로 새로운 렌더러를 식별하는 데 사용되며,
   * 캡슐화를 위한 고유 스타일을 생성할 때 사용됩니다.
   */
  id: string;
  /**
   * 뷰 캡슐화 유형으로, 스타일이 DOM 요소에 적용되는 방식을 결정합니다. 다음 중 하나입니다.
   * - `Emulated` (기본값): 스타일의 네이티브 스코프를 에뮬레이트합니다.
   * - `Native`: 렌더러의 네이티브 캡슐화 메커니즘을 사용합니다.
   * - `ShadowDom`: 현대 [Shadow
   * DOM](https://w3c.github.io/webcomponents/spec/shadow/)을 사용하고
   * 컴포넌트의 호스트 요소에 대한 ShadowRoot를 생성합니다.
   * - `None`: 템플릿이나 스타일 캡슐화를 제공하지 않습니다.
   */
  encapsulation: ViewEncapsulation;
  /**
   * 렌더러 인스턴스에 저장될 CSS 스타일을 정의합니다.
   */
  styles: string[];
  /**
   * 렌더러 인스턴스에 저장될 개발자가 정의한 임의의 데이터를 정의합니다.
   * 다른 렌더러에 위임하는 렌더러에 유용합니다.
   */
  data: {[kind: string]: any};

  /**
   * 외부 런타임 스타일 URL 목록을 생성하는 데 프레임워크에서 사용하는 함수입니다.
   */
  getExternalStyles?: ((encapsulationId?: string) => string[]) | null;
}

/**
 * 렌더러별 스타일 수정자를 위한 플래그입니다.
 * @publicApi
 */
export enum RendererStyleFlags2 {
  // TODO(misko): 이를 별도의 파일로 리팩토링하여 `node_manipulation.ts`에서 가져올 수 있도록 해야 합니다.
  // 현재 가져오기는 해상도 순서를 변경하고 테스트를 실패하게 만듭니다.
  // 지금은 `node_manipulation.ts`에 하드 코딩된 값을 두는 것이 해결 방법입니다.
  /**
   * 스타일을 중요하게 표시합니다.
   */
  Important = 1 << 0,
  /**
   * 대시 케이스 명명법(예: this-is-dash-case) 사용을 표시합니다.
   */
  DashCase = 1 << 1,
}
