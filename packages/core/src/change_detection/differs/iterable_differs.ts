/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ɵɵdefineInjectable} from '../../di/interface/defs';
import {StaticProvider} from '../../di/interface/provider';
import {Optional, SkipSelf} from '../../di/metadata';
import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {DefaultIterableDifferFactory} from '../differs/default_iterable_differ';

/**
 * 지원되는 iterable 유형을 설명하는 타입입니다.
 *
 * @publicApi
 */
export type NgIterable<T> = Array<T> | Iterable<T>;

/**
 * iterable의 시간 경과에 따른 변경 사항을 추적하는 전략입니다. {@link /api/common/NgForOf NgForOf}에서 사용되어
 * iterable의 변경에 반응하여 DOM에서 동등한 변경을 수행합니다.
 *
 * @publicApi
 */
export interface IterableDiffer<V> {
  /**
   * 이전 상태와 새로운 `object` 상태 간의 차이를 계산합니다.
   *
   * @param object 새로운 값을 포함하는 개체입니다.
   * @returns 차이를 설명하는 개체입니다. 반환 값은 다음
   * `diff()` 호출까지 유효합니다.
   */
  diff(object: NgIterable<V> | undefined | null): IterableChanges<V> | null;
}

/**
 * 마지막으로 `IterableDiffer#diff()`가 호출된 이후의 `Iterable` 컬렉션에서 변경 사항을 설명하는 개체입니다.
 *
 * @publicApi
 */
export interface IterableChanges<V> {
  /**
   * 모든 변경 사항을 반복합니다. `IterableChangeRecord`는 각 항목의 변경 사항에 대한 정보를 포함합니다.
   */
  forEachItem(fn: (record: IterableChangeRecord<V>) => void): void;

  /**
   * 원래 `Iterable`에 적용될 때 새 `Iterable`을 생성하는 일련의 작업을 반복합니다.
   *
   * NOTE: 이것들은 원래
   * `Iterable`에 적용된 실제 작업이 반드시 아니라, 적용된 것과는 다를 수 있는 계산된 작업 세트입니다.
   *
   * @param record 적용해야 하는 변경 사항
   * @param previousIndex `record`의 `IterableChangeRecord#previousIndex`는 원래 `Iterable` 위치를 나타내고,
   *        `previousIndex`는 이 시점까지의 작업을 적용한 후 항목의 일시적인 위치를 나타냅니다.
   * @param currentIndex `record`의 `IterableChangeRecord#currentIndex`는 원래 `Iterable` 위치를 나타내고,
   *        `currentIndex`는 이 시점까지의 작업을 적용한 후 항목의 일시적인 위치를 나타냅니다.
   */
  forEachOperation(
    fn: (
      record: IterableChangeRecord<V>,
      previousIndex: number | null,
      currentIndex: number | null,
    ) => void,
  ): void;

  /**
   * 원래 `Iterable`의 순서로 변경 사항을 반복하여 원래 항목이 이동한 위치를 보여줍니다.
   */
  forEachPreviousItem(fn: (record: IterableChangeRecord<V>) => void): void;

  /** 추가된 모든 항목을 반복합니다. */
  forEachAddedItem(fn: (record: IterableChangeRecord<V>) => void): void;

  /** 이동된 모든 항목을 반복합니다. */
  forEachMovedItem(fn: (record: IterableChangeRecord<V>) => void): void;

  /** 제거된 모든 항목을 반복합니다. */
  forEachRemovedItem(fn: (record: IterableChangeRecord<V>) => void): void;

  /**
   * 신원( `TrackByFunction`에 의해 계산됨)이 변경된 모든 항목을 반복합니다.
   */
  forEachIdentityChange(fn: (record: IterableChangeRecord<V>) => void): void;
}

/**
 * 항목 변경 정보를 나타내는 레코드입니다.
 *
 * @publicApi
 */
export interface IterableChangeRecord<V> {
  /** `Iterable` 내에서 항목의 현재 인덱스 또는 제거된 경우 null입니다. */
  readonly currentIndex: number | null;

  /** `Iterable` 내에서 항목의 이전 인덱스 또는 추가된 경우 null입니다. */
  readonly previousIndex: number | null;

  /** 항목입니다. */
  readonly item: V;

  /** `TrackByFunction`에 의해 계산된 신원으로 추적합니다. */
  readonly trackById: any;
}

/**
 * `NgForOf` 지시문에 선택적으로 전달되어 `NgForOf`가 iterable 내에서 항목을 고유하게 식별하는 방식을 사용자 정의하는 함수입니다.
 *
 * `NgForOf`는 iterable 내의 항목이 재정렬되거나 새로운 항목이 추가되거나 기존 항목이 제거될 때
 * DOM 업데이트를 올바르게 수행하기 위해 iterable 내의 항목을 고유하게 식별해야 합니다.
 *
 *
 * 모든 이러한 시나리오에서 일반적으로 변경의 영향을 받는 항목과 연결된 DOM 요소만 업데이트하는 것이 바람직합니다.
 * 이 동작은 다음과 같은 중요성이 있습니다:
 *
 * - iterable이 수정될 때 DOM-specific UI 상태(예: 커서 위치, 포커스, 텍스트 선택)를 유지합니다.
 * - 항목 추가, 제거 및 iterable 재정렬의 애니메이션을 가능하게 합니다.
 * - 중첩된 `<option>` 요소가 동적으로
 *   `NgForOf`를 사용하여 채워지고 바인딩된 iterable이 업데이트될 때 `<select>` 요소의 값을 유지합니다.
 *
 * 사용자 정의 `trackBy` 함수의 일반적인 용도는 `NgForOf`가 반복하는 모델에 유일한 식별자가 있는 속성이 포함된 경우입니다. 예를 들어, 주어진 모델:
 *
 * ```ts
 * class User {
 *   id: number;
 *   name: string;
 *   ...
 * }
 * ```
 * 사용자 정의 `trackBy` 함수는 다음과 같이 보일 수 있습니다:
 * ```ts
 * function userTrackBy(index, user) {
 *   return user.id;
 * }
 * ```
 *
 * 사용자 정의 `trackBy` 함수는 여러 속성을 가져야 합니다:
 *
 * - [idempotent](https://en.wikipedia.org/wiki/Idempotence)이어야 하며(부작용이 없고 주어진 입력에 대해 항상 동일한 값을 반환해야 함)
 * - 모든 고유 입력에 대해 고유한 값을 반환해야 함
 * - 빠르게 작동해야 함
 *
 * @see [`NgForOf#ngForTrackBy`](api/common/NgForOf#ngForTrackBy)
 * @publicApi
 */
export interface TrackByFunction<T> {
  // 참고: 타입 매개변수 `U`는 반복 유형의 기본 유형을 사용하여 trackBy 함수를 선언할 경우 더 정확한 템플릿 타입 검사를 가능하게 합니다.
  // `U` 유형은 TypeScript가 `item` 매개변수 유형에 대해 좁은 유형을 추론하도록 추가 자유를 제공합니다.
  // trackBy가 선언한 항목 유형을 T에 대한 추론된 유형으로 강제 적용하지 않습니다.
  // https://github.com/angular/angular/issues/40125 참고

  /**
   * @param index iterable 내에서 항목의 인덱스입니다.
   * @param item iterable 내의 항목입니다.
   */
  <U extends T>(index: number, item: T & U): any;
}

/**
 * {@link IterableDiffer}를 위한 팩토리를 제공합니다.
 *
 * @publicApi
 */
export interface IterableDifferFactory {
  supports(objects: any): boolean;
  create<V>(trackByFn?: TrackByFunction<V>): IterableDiffer<V>;
}

export function defaultIterableDiffersFactory() {
  return new IterableDiffers([new DefaultIterableDifferFactory()]);
}

/**
 * NgFor, NgClass 및 기타에서 사용되는 다양한 iterable 차별 전략의 저장소입니다.
 *
 * @publicApi
 */
export class IterableDiffers {
  /** @nocollapse */
  static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ ɵɵdefineInjectable({
    token: IterableDiffers,
    providedIn: 'root',
    factory: defaultIterableDiffersFactory,
  });

  constructor(private factories: IterableDifferFactory[]) {}

  static create(factories: IterableDifferFactory[], parent?: IterableDiffers): IterableDiffers {
    if (parent != null) {
      const copied = parent.factories.slice();
      factories = factories.concat(copied);
    }

    return new IterableDiffers(factories);
  }

  /**
   * {@link IterableDifferFactory}의 배열을 가져와 제공된 팩토리로 상속된 {@link IterableDiffers} 인스턴스를 확장하고
   * 새 {@link IterableDiffers} 인스턴스를 반환합니다.
   *
   * @usageNotes
   * ### 예제
   *
   * 다음 예제는 기존 팩토리 목록을 확장하는 방법을 보여줍니다.
   * 이는 이 구성 요소와 자식 구성 요소의 주입기에서만 적용됩니다.
   * 이 단계는 새 {@link IterableDiffer}를 사용 가능하게 만드는 데 필요한 모든 것입니다.
   *
   * ```ts
   * @Component({
   *   viewProviders: [
   *     IterableDiffers.extend([new ImmutableListDiffer()])
   *   ]
   * })
   * ```
   */
  static extend(factories: IterableDifferFactory[]): StaticProvider {
    return {
      provide: IterableDiffers,
      useFactory: (parent: IterableDiffers | null) => {
        // 부모가 null인 경우 루트 주입기에서 우리가 기본
        // IterableDiffers에 대한 주입 메커니즘을 오버라이드했음을 의미합니다. 이 경우
        // `defaultIterableDiffersFactory`를 가정합니다.
        return IterableDiffers.create(factories, parent || defaultIterableDiffersFactory());
      },
      // 종속성이 기술적으로 옵션이 아니지만 이렇게 하면 더 나은 오류 메시지를 제공할 수 있습니다.
      deps: [[IterableDiffers, new SkipSelf(), new Optional()]],
    };
  }

  find(iterable: any): IterableDifferFactory {
    const factory = this.factories.find((f) => f.supports(iterable));
    if (factory != null) {
      return factory;
    } else {
      throw new RuntimeError(
        RuntimeErrorCode.NO_SUPPORTING_DIFFER_FACTORY,
        ngDevMode &&
          `형식 '${getTypeNameForDebugging(
            iterable,
          )}'의 객체 '${iterable}'를 지원하는 차별자를 찾을 수 없습니다.`,
      );
    }
  }
}

export function getTypeNameForDebugging(type: any): string {
  return type['name'] || typeof type;
}
