/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertDefined} from '../../util/assert';
import {CONTEXT, DECLARATION_COMPONENT_VIEW} from '../interfaces/view';
import {getLView} from '../state';

/**
 * 현재 명령이 실행되고 있는 컴포넌트 인스턴스를 반환하는 명령입니다.
 * 이는 특정 템플릿의 컨텍스트가 아닌 컴포넌트 인스턴스가 필요하다는 것을 아는 경우에 대해
 * `nextContent`의 상수 시간 버전입니다.
 *
 * @codeGenApi
 */
export function ɵɵcomponentInstance(): unknown {
  const instance = getLView()[DECLARATION_COMPONENT_VIEW][CONTEXT];
  ngDevMode && assertDefined(instance, '정의된 컴포넌트 인스턴스가 필요합니다.');
  return instance;
}
