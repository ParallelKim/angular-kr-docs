/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../../interface/type';
import {NG_COMP_DEF} from '../fields';

/**
 * 아이비에서 렌더 출력의 문자열화를 위해 사용됩니다.
 * 중요! 이 함수는 성능에 민감하며, 메가모픽 읽기를 도입하지 않도록 조심해야 합니다.
 * 벤치마크와 대체 구현을 보려면 `core/test/render3/perf/render_stringify`를 확인하세요.
 */
export function renderStringify(value: any): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  // `String`을 사용하여 값의 `toString` 메서드를 호출합니다. 이는
  // `value.toString`을 호출하는 것보다 빠른 것으로 보입니다 (참조: `render_stringify` 벤치마크).
  return String(value);
}

/**
 * 오류 메시지에 표시될 수 있도록 값을 문자열화하는 데 사용됩니다.
 *
 * 중요! 이 함수는 메가모픽 읽기를 포함하며, 오류 메시지에만 사용해야 합니다.
 */
export function stringifyForError(value: any): string {
  if (typeof value === 'function') return value.name || value.toString();
  if (typeof value === 'object' && value != null && typeof value.type === 'function') {
    return value.type.name || value.type.toString();
  }

  return renderStringify(value);
}

/**
 * 디버깅 경험을 위해 정의된 파일 경로와 라인 번호를 포함하여 `Type`을 문자열화하는 데 사용됩니다.
 *
 * 중요! 이 함수는 메가모픽 읽기를 포함하며, 오류 메시지에만 사용해야 합니다.
 */
export function debugStringifyTypeForError(type: Type<any>): string {
  // TODO(pmvald): 순환 의존성을 생성하지 않고 여기에서 getComponentDef를 사용할 수 있도록 일부 리팩토링을 합니다.
  let componentDef = (type as any)[NG_COMP_DEF] || null;
  if (componentDef !== null && componentDef.debugInfo) {
    return stringifyTypeFromDebugInfo(componentDef.debugInfo);
  }

  return stringifyForError(type);
}

// TODO(pmvald): 순환 의존성을 생성하지 않고 여기에서 매개변수로 Type ClassDebugInfo를 사용할 수 있도록 일부 리팩토링을 합니다.
function stringifyTypeFromDebugInfo(debugInfo: any): string {
  if (!debugInfo.filePath || !debugInfo.lineNumber) {
    return debugInfo.className;
  } else {
    return `${debugInfo.className} (at ${debugInfo.filePath}:${debugInfo.lineNumber})`;
  }
}
