/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Optional, SkipSelf, StaticProvider, ɵɵdefineInjectable} from '../../di';
import {RuntimeError, RuntimeErrorCode} from '../../errors';

import {DefaultKeyValueDifferFactory} from './default_keyvalue_differ';

/**
 * 시간이 지남에 따라 객체에 가해진 변화를 추적하는 differ입니다.
 *
 * @publicApi
 */
export interface KeyValueDiffer<K, V> {
  /**
   * 이전 상태와 새로운 `object` 상태 간의 차이를 계산합니다.
   *
   * @param object 새로운 값을 포함하는 객체입니다.
   * @returns 차이를 설명하는 객체입니다. 반환 값은 다음
   * `diff()` 호출까지 유효합니다.
   */
  diff(object: Map<K, V>): KeyValueChanges<K, V> | null;

  /**
   * 이전 상태와 새로운 `object` 상태 간의 차이를 계산합니다.
   *
   * @param object 새로운 값을 포함하는 객체입니다.
   * @returns 차이를 설명하는 객체입니다. 반환 값은 다음
   * `diff()` 호출까지 유효합니다.
   */
  diff(object: {[key: string]: V}): KeyValueChanges<string, V> | null;
  // TODO(TS2.1): diff<KP extends string>(this: KeyValueDiffer<KP, V>, object: Record<KP, V>):
  // KeyValueDiffer<KP, V>;
}

/**
 * 마지막 `KeyValueDiffer#diff()` 호출 이후 `Map` 또는 `{[k:string]: string}`의 변화를 설명하는 객체입니다.
 *
 * @publicApi
 */
export interface KeyValueChanges<K, V> {
  /**
   * 모든 변경 사항을 반복합니다. `KeyValueChangeRecord`는 각 항목에 대한 변경 정보가 포함됩니다.
   */
  forEachItem(fn: (r: KeyValueChangeRecord<K, V>) => void): void;

  /**
   * 원래 Map의 순서로 변경 사항을 반복하여 원래 항목이 이동한 위치를 보여줍니다.
   */
  forEachPreviousItem(fn: (r: KeyValueChangeRecord<K, V>) => void): void;

  /**
   * 값이 변경된 모든 키를 반복합니다.
   */
  forEachChangedItem(fn: (r: KeyValueChangeRecord<K, V>) => void): void;

  /**
   * 추가된 모든 항목을 반복합니다.
   */
  forEachAddedItem(fn: (r: KeyValueChangeRecord<K, V>) => void): void;

  /**
   * 제거된 모든 항목을 반복합니다.
   */
  forEachRemovedItem(fn: (r: KeyValueChangeRecord<K, V>) => void): void;
}

/**
 * 항목 변경 정보를 나타내는 레코드입니다.
 *
 * @publicApi
 */
export interface KeyValueChangeRecord<K, V> {
  /**
   * Map의 현재 키입니다.
   */
  readonly key: K;

  /**
   * 키에 대한 현재 값 또는 제거된 경우 `null`입니다.
   */
  readonly currentValue: V | null;

  /**
   * 키에 대한 이전 값 또는 추가된 경우 `null`입니다.
   */
  readonly previousValue: V | null;
}

/**
 * {@link KeyValueDiffer}의 팩토리를 제공합니다.
 *
 * @publicApi
 */
export interface KeyValueDifferFactory {
  /**
   * differ가 이 종류의 객체를 diff하는 방법을 알고 있는지 테스트합니다.
   */
  supports(objects: any): boolean;

  /**
   * `KeyValueDiffer`를 생성합니다.
   */
  create<K, V>(): KeyValueDiffer<K, V>;
}

export function defaultKeyValueDiffersFactory() {
  return new KeyValueDiffers([new DefaultKeyValueDifferFactory()]);
}

/**
 * NgClass, NgStyle 및 기타에서 사용되는 여러 Map diffing 전략의 저장소입니다.
 *
 * @publicApi
 */
export class KeyValueDiffers {
  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: KeyValueDiffers,
    providedIn: 'root',
    factory: defaultKeyValueDiffersFactory,
  });

  private readonly factories: KeyValueDifferFactory[];

  constructor(factories: KeyValueDifferFactory[]) {
    this.factories = factories;
  }

  static create<S>(factories: KeyValueDifferFactory[], parent?: KeyValueDiffers): KeyValueDiffers {
    if (parent) {
      const copied = parent.factories.slice();
      factories = factories.concat(copied);
    }
    return new KeyValueDiffers(factories);
  }

  /**
   * {@link KeyValueDifferFactory}의 배열을 받아들여 제공된 팩토리로 상속된 {@link KeyValueDiffers} 인스턴스를 확장하고 새로운
   * {@link KeyValueDiffers} 인스턴스를 반환하는 공급자를 반환합니다.
   *
   * @usageNotes
   * ### 예제
   *
   * 다음 예제에서는 기존의 팩토리 목록을 확장하는 방법을 보여줍니다.
   * 이는 이 컴포넌트와 그 자식의 주입기에만 적용됩니다.
   * 이 단계는 새로운 {@link KeyValueDiffer}를 사용할 수 있도록 하기 위해 필요한 전부입니다.
   *
   * ```ts
   * @Component({
   *   viewProviders: [
   *     KeyValueDiffers.extend([new ImmutableMapDiffer()])
   *   ]
   * })
   * ```
   */
  static extend<S>(factories: KeyValueDifferFactory[]): StaticProvider {
    return {
      provide: KeyValueDiffers,
      useFactory: (parent: KeyValueDiffers) => {
        // 부모가 null인 경우, 우리는 루트 주입기에 있으며
        // KeyValueDiffers의 기본 주입 메커니즘을 덮어썼음을 의미합니다. 그런 경우
        // `defaultKeyValueDiffersFactory`를 가정합니다.
        return KeyValueDiffers.create(factories, parent || defaultKeyValueDiffersFactory());
      },
      // 의존성은 기술적으로 선택적이지 않지만, 이렇게 하면 더 나은 오류 메시지를 제공할 수 있습니다.
      deps: [[KeyValueDiffers, new SkipSelf(), new Optional()]],
    };
  }

  find(kv: any): KeyValueDifferFactory {
    const factory = this.factories.find((f) => f.supports(kv));
    if (factory) {
      return factory;
    }
    throw new RuntimeError(
      RuntimeErrorCode.NO_SUPPORTING_DIFFER_FACTORY,
      ngDevMode && `서포트하는 differ factory를 찾을 수 없습니다 '${kv}'`,
    );
  }
}
