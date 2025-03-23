/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ComponentDef, ComponentDefFeature} from '../interfaces/definition';

/**
 * 구성 요소에 대한 외부 런타임 스타일을 지원하는 기능입니다.
 * 외부 런타임 스타일은 주어진 구성 요소에 대한 스타일이 포함된 CSS 스타일시트의 URL입니다.
 * 브라우저의 경우 이 URL은 구성 요소가 렌더링될 때 추가된 `link` 요소에서 사용됩니다.
 * 이 기능은 일반적으로 기존의 전역 스타일시트를 활용하여 구성 요소 스타일시트의 핫 모듈 교체
 * (HMR)를 위해 사용됩니다. 이는 대부분의 개발 서버에서 사용할 수 있습니다.
 *
 * @codeGenApi
 */
export function ɵɵExternalStylesFeature(styleUrls: string[]): ComponentDefFeature {
  return (definition: ComponentDef<unknown>) => {
    if (styleUrls.length < 1) {
      return;
    }

    definition.getExternalStyles = (encapsulationId) => {
      // 외부 스타일 캡슐화 및 사용 추적을 위한 캡슐화 모드를 지원하기 위해 캡슐화 ID 검색 매개변수 `ngcomp`를 추가합니다.
      const urls = styleUrls.map(
        (value) =>
          value +
          '?ngcomp' +
          (encapsulationId ? '=' + encodeURIComponent(encapsulationId) : '') +
          '&e=' +
          definition.encapsulation,
      );

      return urls;
    };
  };
}
