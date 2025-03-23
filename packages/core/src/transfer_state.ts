/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {APP_ID} from './application/application_tokens';
import {inject} from './di/injector_compatibility';
import {ɵɵdefineInjectable} from './di/interface/defs';
import {getDocument} from './render3/interfaces/document';

/**
 * `TransferState`와 함께 사용할 수 있는 타입 안전한 키입니다.
 *
 * 예제:
 *
 * ```ts
 * const COUNTER_KEY = makeStateKey<number>('counter');
 * let value = 10;
 *
 * transferState.set(COUNTER_KEY, value);
 * ```
 *
 * @publicApi
 */
export type StateKey<T> = string & {
  __not_a_string: never;
  __value_type?: T;
};

/**
 * `TransferState`와 함께 타입 T의 값을 저장하는 데 사용할 수 있는 `StateKey<T>`를 생성합니다.
 *
 * 예제:
 *
 * ```ts
 * const COUNTER_KEY = makeStateKey<number>('counter');
 * let value = 10;
 *
 * transferState.set(COUNTER_KEY, value);
 * ```
 *
 * @publicApi
 */
export function makeStateKey<T = void>(key: string): StateKey<T> {
  return key as StateKey<T>;
}

function initTransferState(): TransferState {
  const transferState = new TransferState();
  if (typeof ngServerMode === 'undefined' || !ngServerMode) {
    transferState.store = retrieveTransferredState(getDocument(), inject(APP_ID));
  }

  return transferState;
}

/**
 * 서버 측에서 클라이언트 측 애플리케이션으로 전송되는 키-값 저장소입니다.
 *
 * `TransferState`는 주입 가능한 토큰으로 사용 가능합니다.
 * 클라이언트에서는 DI를 사용하여 이 토큰을 주입하고 사용하면, 지연 초기화됩니다.
 * 서버에서는 `renderApplication` 함수를 사용하면 이미 포함되어 있습니다. 그렇지 않으면
 * `ServerTransferStateModule` 모듈을 가져와서 `TransferState`를 사용할 수 있도록 합니다.
 *
 * 저장소의 값은 JSON.stringify/JSON.parse를 사용하여 직렬화/역직렬화됩니다. 따라서
 * 불리언, 숫자, 문자열, null 및 비클래스 객체만 손실 없이 직렬화 및 역직렬화됩니다.
 *
 * @publicApi
 */
export class TransferState {
  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: TransferState,
    providedIn: 'root',
    factory: initTransferState,
  });

  /** @internal */
  store: Record<string, unknown | undefined> = {};

  private onSerializeCallbacks: {[k: string]: () => unknown | undefined} = {};

  /**
   * 키에 해당하는 값을 가져옵니다. 키를 찾을 수 없으면 `defaultValue`를 반환합니다.
   */
  get<T>(key: StateKey<T>, defaultValue: T): T {
    return this.store[key] !== undefined ? (this.store[key] as T) : defaultValue;
  }

  /**
   * 키에 해당하는 값을 설정합니다.
   */
  set<T>(key: StateKey<T>, value: T): void {
    this.store[key] = value;
  }

  /**
   * 저장소에서 키를 제거합니다.
   */
  remove<T>(key: StateKey<T>): void {
    delete this.store[key];
  }

  /**
   * 저장소에 키가 존재하는지 여부를 테스트합니다.
   */
  hasKey<T>(key: StateKey<T>): boolean {
    return this.store.hasOwnProperty(key);
  }

  /**
   * 상태가 비어 있는지 여부를 나타냅니다.
   */
  get isEmpty(): boolean {
    return Object.keys(this.store).length === 0;
  }

  /**
   * `toJson`이 호출될 때 키에 대한 값을 제공하는 콜백을 등록합니다.
   */
  onSerialize<T>(key: StateKey<T>, callback: () => T): void {
    this.onSerializeCallbacks[key] = callback;
  }

  /**
   * 저장소의 현재 상태를 JSON으로 직렬화합니다.
   */
  toJson(): string {
    // onSerialize 콜백을 호출하고 그 값을 저장소에 넣습니다.
    for (const key in this.onSerializeCallbacks) {
      if (this.onSerializeCallbacks.hasOwnProperty(key)) {
        try {
          this.store[key] = this.onSerializeCallbacks[key]();
        } catch (e) {
          console.warn('onSerialize 콜백 중 예외: ', e);
        }
      }
    }

    // 직렬화된 출력에서 <script> 태그 밖으로 벗어나지 않도록 스크립트 태그를 이스케이프합니다.
    // `<`의 인코딩은 G3 스크립트 빌더와 동일한 동작입니다.
    return JSON.stringify(this.store).replace(/</g, '\\u003C');
  }
}

function retrieveTransferredState(
  doc: Document,
  appId: string,
): Record<string, unknown | undefined> {
  // 서버에서 전송된 JSON 데이터가 있는 스크립트 태그를 찾습니다.
  // 스크립트 태그의 ID는 Angular appId + 'state'로 설정됩니다.
  const script = doc.getElementById(appId + '-state');
  if (script?.textContent) {
    try {
      // google3에서 lint 오류를 유발하지 않기 위해 여기서 any를 사용하지 마세요 (any는 허용되지 않음).
      // `<`의 디코딩은 브라우저와 node.js가 기본적으로 처리합니다. G3
      // 스크립트 빌더와 동일한 동작입니다.
      return JSON.parse(script.textContent) as {};
    } catch (e) {
      console.warn('Exception while restoring TransferState for app ' + appId, e);
    }
  }

  return {};
}
