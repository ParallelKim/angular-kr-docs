/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {NodeNavigationStep, REFERENCE_NODE_BODY, REFERENCE_NODE_HOST} from './interfaces';

/**
 * 압축된 노드 위치에서 참조 노드 정보를 추출하는 정규 표현식.
 * 참조 노드는 다음 중 하나로 표현됩니다:
 *  - LView 슬롯을 가리키는 숫자
 *  - `document.body`에서 검색을 시작해야 함을 나타내는 `b` 문자
 *  - 컴포넌트 호스트 노드(`lView[HOST]`)에서 검색을 시작하기 위해 `h` 문자
 */
const REF_EXTRACTOR_REGEXP = /* @__PURE__ */ new RegExp(
  `^(\\d+)*(${REFERENCE_NODE_BODY}|${REFERENCE_NODE_HOST})*(.*)`,
);

/**
 * 참조 노드 위치와 목표 노드까지의 탐색 단계 세트를 받아
 * 위치를 나타내는 문자열을 출력하는 도우미 함수.
 *
 * 예를 들어: referenceNode = 'b' (body) 및 path = ['firstChild', 'firstChild',
 * 'nextSibling']인 경우, 함수는: `bf2n`을 반환합니다.
 */
export function compressNodeLocation(referenceNode: string, path: NodeNavigationStep[]): string {
  const result: Array<string | number> = [referenceNode];
  for (const segment of path) {
    const lastIdx = result.length - 1;
    if (lastIdx > 0 && result[lastIdx - 1] === segment) {
      // 카운트 슬롯의 빈 문자열은 명령어의 1회 발생을 나타냅니다.
      const value = (result[lastIdx] || 1) as number;
      result[lastIdx] = value + 1;
    } else {
      // 경로에 새로운 세그먼트를 추가합니다.
      // 카운터 필드에서 빈 문자열을 사용하여 경로에 `1`s를 인코딩하지 않도록
      // 합니다. 왜냐하면 그것들은 암시적이기 때문입니다 (예: `f1n1` vs `fn`),
      // 따라서 이 경우에는 단일 문자만 있으면 충분합니다.
      result.push(segment, '');
    }
  }
  return result.join('');
}

/**
 * `compressNodeLocation`을 되돌리고 주어진
 * 문자열을 0번째 위치에 참조 노드 정보가 있고
 * 그 다음에는 탐색 단계와 반복 횟수에 대한 정보(짝)로 구성된 배열로 변환하는
 * 도우미 함수.
 *
 * 예를 들어, 'bf2n'과 같은 경로는 다음으로 변환됩니다:
 * ['b', 'firstChild', 2, 'nextSibling', 1].
 *
 * 이 정보는 후에 주어진 노드를 위치로 찾아 DOM을 탐색하는 코드에 의해 사용됩니다.
 */
export function decompressNodeLocation(
  path: string,
): [string | number, ...(number | NodeNavigationStep)[]] {
  const matches = path.match(REF_EXTRACTOR_REGEXP)!;
  const [_, refNodeId, refNodeName, rest] = matches;
  // 참조 노드가 인덱스로 표현되면, 숫자로 변환합니다.
  const ref = refNodeId ? parseInt(refNodeId, 10) : refNodeName;
  const steps: (number | NodeNavigationStep)[] = [];
  // 경로에서 모든 세그먼트를 매치합니다.
  for (const [_, step, count] of rest.matchAll(/(f|n)(\d*)/g)) {
    const repeat = parseInt(count, 10) || 1;
    steps.push(step as NodeNavigationStep, repeat);
  }
  return [ref, ...steps];
}
