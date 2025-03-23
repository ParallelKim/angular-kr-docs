/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 지시문 인스턴스의 단일 속성에 대한 이전 값에서 새 값으로의 기본 변경을 나타냅니다.
 * `ngOnChanges` 훅에 {@link SimpleChanges} 객체의 값으로 전달됩니다.
 *
 * @see {@link OnChanges}
 *
 * @publicApi
 */
export class SimpleChange {
  constructor(
    public previousValue: any,
    public currentValue: any,
    public firstChange: boolean,
  ) {}
  /**
   * 새 값이 할당된 첫 번째 값인지 여부를 확인합니다.
   */
  isFirstChange(): boolean {
    return this.firstChange;
  }
}

/**
 * 지시문 또는 구성 요소에 속하는 선언된 속성 이름에 저장된 {@link SimpleChange} 객체로 표현되는 변화의 해시테이블입니다.
 * 이것은 `ngOnChanges` 훅에 전달되는 타입입니다.
 *
 * @see {@link OnChanges}
 *
 * @publicApi
 */
export interface SimpleChanges {
  [propName: string]: SimpleChange;
}
