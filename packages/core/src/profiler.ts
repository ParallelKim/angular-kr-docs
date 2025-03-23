/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

export const PERFORMANCE_MARK_PREFIX = '🅰️';

let enablePerfLogging = false;

/**
 * 성능 API에 대한 측정을 시작하는 함수
 * stopMeasuring와 쌍으로 사용해야 합니다.
 */
export function startMeasuring<T>(label: string): void {
  if (!enablePerfLogging) {
    return;
  }

  const {startLabel} = labels(label);
  /* tslint:disable:ban */
  performance.mark(startLabel);
  /* tslint:enable:ban */
}

/**
 * 성능 API에 대한 측정을 멈추는 함수
 * stopMeasuring와 쌍으로 사용해야 합니다.
 */
export function stopMeasuring(label: string): void {
  if (!enablePerfLogging) {
    return;
  }

  const {startLabel, labelName, endLabel} = labels(label);
  /* tslint:disable:ban */
  performance.mark(endLabel);
  performance.measure(labelName, startLabel, endLabel);
  performance.clearMarks(startLabel);
  performance.clearMarks(endLabel);
  /* tslint:enable:ban */
}

export function labels(label: string) {
  const labelName = `${PERFORMANCE_MARK_PREFIX}:${label}`;
  return {
    labelName,
    startLabel: `start:${labelName}`,
    endLabel: `end:${labelName}`,
  };
}

let warningLogged = false;
/**
 * 내부 성능 프로파일러를 활성화합니다.
 *
 * 애플리케이션 코드에 가져와서는 안 됩니다.
 */
export function enableProfiling() {
  if (
    !warningLogged &&
    (typeof performance === 'undefined' || !performance.mark || !performance.measure)
  ) {
    warningLogged = true;
    console.warn('이 플랫폼에서 성능 API를 지원하지 않습니다.');
    return;
  }

  enablePerfLogging = true;
}
export function disableProfiling() {
  enablePerfLogging = false;
}
