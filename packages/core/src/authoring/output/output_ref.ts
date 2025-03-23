/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {DestroyRef} from '../../linker/destroy_ref';

/**
 * 프로그래밍 방식의 {@link OutputRef#subscribe} 구독을 수동으로 정리하는 데 사용할 수 있는 함수입니다.
 *
 * 참고: Angular는 출력의 지시어/구성 요소가 파괴될 때
 * 자동으로 구독을 정리합니다.
 *
 * @publicAPI
 */
export interface OutputRefSubscription {
  unsubscribe(): void;
}

/**
 * Angular 출력에 대한 참조입니다.
 *
 * @publicAPI
 */
export interface OutputRef<T> {
  /**
   * 출력이 타입 `T`의 새 값을 방출할 때마다 호출되는 콜백을 등록합니다.
   *
   * Angular는 출력의 지시어/구성 요소가 파괴될 때
   * 자동으로 구독을 정리합니다.
   */
  subscribe(callback: (value: T) => void): OutputRefSubscription;

  /**
   * 출력을 선언하는 지시어/구성 요소의 `DestroyRef`에 대한 참조입니다.
   * `DestroyRef`는 `outputToObservable`과 같은 도우미가 파괴 시
   * 관찰 가능한 것을 완료할 수 있도록 캡처됩니다.
   *
   * 참고: 삽입 컨텍스트에 대한 종속성을 추가하고 싶지 않은 경우,
   * `EventEmitter`의 경우 `undefined`일 수 있습니다.
   *
   * @internal
   */
  destroyRef: DestroyRef | undefined;
}
