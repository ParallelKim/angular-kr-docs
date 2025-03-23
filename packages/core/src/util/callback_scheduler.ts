/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {noop} from './noop';

/**
 * setTimeout과 requestAnimationFrame이 해결된 후 콜백을 실행하는 스케줄링 함수를 가져옵니다.
 *
 * - `requestAnimationFrame`은 변경 감지가 브라우저 리페인트 전에 실행되도록 보장합니다.
 * 이는 변경 감지의 생성 및 업데이트 패스가 항상 동일한 프레임에서 발생하도록 보장합니다.
 * - 브라우저의 리소스가 부족할 때, `rAF`는 렌더링이 우선순위가 매우 높은 프로세스이기 때문에
 * `setTimeout` 이전에 실행될 수 있습니다. 이는 `setTimeout`이 동일한 프레임 생성 및 업데이트 패스를
 * 보장하지 않는다는 것을 의미하며, 업데이트 단계를 스케줄링하는 데 `setTimeout`이 사용될 때 그렇습니다.
 * - `rAF`는 우리가 원하는 동일한 프레임 업데이트를 제공하지만, 혼자서 사용되는 것을 방지하는 두 가지 제한이 있습니다.
 * 첫째, 백그라운드 탭에서 실행되지 않으므로 예를 들어 새로운 탭에서 열릴 때 Angular가 응용 프로그램을 초기화하는 것을 방지합니다.
 * 둘째, requestAnimationFrame에 대한 반복 호출은 하드웨어의 새로 고침 속도(~60Hz 디스플레이의 경우 ~16ms)로 실행됩니다.
 * 이는 "update; await stable; assert;" 형식의 여러 업데이트와 assert가 작성된 테스트의 значительного
 * 속도 저하를 초래할 것입니다.
 * - `setTimeout`과 `rAF` 모두 단일 사용자 상호작용에서 여러 이벤트를 단일 변경 감지로 "병합"할 수 있습니다.
 * 중요하게도, 이는 변경 감지가 각 이벤트 간에 간섭되는 `queueMicrotask`와 같은 대체 타이밍 메커니즘과 비교할 때
 * 보기 트리 트래버설을 줄입니다.
 *
 * `setTimeout`과 `rAF` 중 첫 번째 실행 후 변경 감지를 실행함으로써 두 세계의 장점을 얻을 수 있습니다.
 *
 * @returns 스케줄된 콜백을 취소하는 함수
 */
export function scheduleCallbackWithRafRace(callback: Function): () => void {
  let timeoutId: number;
  let animationFrameId: number;
  function cleanup() {
    callback = noop;
    try {
      if (animationFrameId !== undefined && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(animationFrameId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    } catch {
      // 클리어/취소는 함수가 패치되고 언패치되는 타이밍 때문에 테스트에서 실패할 수 있습니다.
      // 오류를 무시하세요 - 우리는 콜백을 no-op로 만들어 이 문제로부터 스스로를 보호합니다.
    }
  }
  timeoutId = setTimeout(() => {
    callback();
    cleanup();
  }) as unknown as number;
  if (typeof requestAnimationFrame === 'function') {
    animationFrameId = requestAnimationFrame(() => {
      callback();
      cleanup();
    });
  }

  return () => cleanup();
}

export function scheduleCallbackWithMicrotask(callback: Function): () => void {
  queueMicrotask(() => callback());

  return () => {
    callback = noop;
  };
}
