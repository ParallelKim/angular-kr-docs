/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {DefaultIterableDifferFactory} from './differs/default_iterable_differ';
import {DefaultKeyValueDifferFactory} from './differs/default_keyvalue_differ';
import {IterableDifferFactory, IterableDiffers} from './differs/iterable_differs';
import {KeyValueDifferFactory, KeyValueDiffers} from './differs/keyvalue_differs';

export {SimpleChange, SimpleChanges} from '../interface/simple_change';
export {devModeEqual} from '../util/comparison';
export {ChangeDetectorRef} from './change_detector_ref';
export {ChangeDetectionStrategy} from './constants';
export {
  DefaultIterableDiffer,
  DefaultIterableDifferFactory,
} from './differs/default_iterable_differ';
export {DefaultKeyValueDifferFactory} from './differs/default_keyvalue_differ';
export {
  IterableChangeRecord,
  IterableChanges,
  IterableDiffer,
  IterableDifferFactory,
  IterableDiffers,
  NgIterable,
  TrackByFunction,
} from './differs/iterable_differs';
export {
  KeyValueChangeRecord,
  KeyValueChanges,
  KeyValueDiffer,
  KeyValueDifferFactory,
  KeyValueDiffers,
} from './differs/keyvalue_differs';
export {PipeTransform} from './pipe_transform';

/**
 * `Object`와 `Map`에 대한 구조적 차이.
 */
const keyValDiff: KeyValueDifferFactory[] = [new DefaultKeyValueDifferFactory()];

/**
 * `Array`와 같은 `Iterable` 타입에 대한 구조적 차이.
 */
const iterableDiff: IterableDifferFactory[] = [new DefaultIterableDifferFactory()];

export const defaultIterableDiffers = new IterableDiffers(iterableDiff);

export const defaultKeyValueDiffers = new KeyValueDiffers(keyValDiff);
