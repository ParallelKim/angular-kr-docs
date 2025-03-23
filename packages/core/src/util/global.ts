/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

const _global: any = globalThis;

/**
 * 주의: 새로운 값을 제공할 때마다
 * 해당하는 `....externs.js` 파일에 항목을 추가해야 합니다,
 * 그래야 클로저가 그 글로벌을 자신의 목적에 사용하지 않을 것입니다.
 */
export {_global as global};
