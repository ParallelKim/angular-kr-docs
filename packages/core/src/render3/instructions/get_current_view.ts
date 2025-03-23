/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {OpaqueViewState} from '../interfaces/view';
import {getLView} from '../state';

/**
 * 현재 OpaqueViewState 인스턴스를 반환합니다.
 *
 * restoreView() 명령어와 함께 사용되어 현재 뷰의 스냅샷을 저장하고
 * 리스너가 호출될 때 복원합니다. 이를 통해 리스너에서
 * 부모 뷰의 변수를 가져오기 위해 선언 뷰 트리를 탐색할 수 있습니다.
 *
 * @codeGenApi
 */
export function ɵɵgetCurrentView(): OpaqueViewState {
  return getLView() as any as OpaqueViewState;
}
