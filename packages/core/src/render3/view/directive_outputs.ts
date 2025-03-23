/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {assertIndexInRange} from '../../util/assert';
import {DirectiveDef} from '../interfaces/definition';
import {TNode} from '../interfaces/node';
import {CONTEXT, LView, TVIEW, TView} from '../interfaces/view';
import {stringifyForError} from '../util/stringify_utils';
import {getOrCreateLViewCleanup, getOrCreateTViewCleanup} from '../util/view_utils';
import {wrapListener} from './listeners';

/** 구독 가능한 출력 필드 값을 설명합니다. */
interface SubscribableOutput<T> {
  subscribe(listener: (v: T) => void): {unsubscribe: () => void};
}

export function createOutputListener<T = unknown>(
  tNode: TNode,
  lView: LView<{} | null>,
  listenerFn: (e?: any) => any,
  targetDef: DirectiveDef<unknown>,
  eventName: string,
) {
  // TODO(pk): 실제 바인딩에서 검사를 분리합니다.
  const wrappedListener = wrapListener(tNode, lView, lView[CONTEXT], listenerFn);

  // TODO(pk): listenToDirectiveOutput의 서명을 단순화합니다.
  const hasBound = listenToDirectiveOutput(
    tNode,
    lView[TVIEW],
    lView,
    targetDef,
    eventName,
    wrappedListener,
  );

  if (!hasBound && ngDevMode) {
    throw new RuntimeError(
      RuntimeErrorCode.INVALID_BINDING_TARGET,
      `${stringifyForError(targetDef.type)} 에는 "${eventName}"의 공용 이름을 가진 출력이 없습니다.`,
    );
  }
}

/** 특정 지시문에서 출력을 듣습니다. */
function listenToDirectiveOutput(
  tNode: TNode,
  tView: TView,
  lView: LView,
  target: DirectiveDef<unknown>,
  eventName: string,
  listenerFn: (e?: any) => any,
): boolean {
  const tCleanup = tView.firstCreatePass ? getOrCreateTViewCleanup(tView) : null;
  const lCleanup = getOrCreateLViewCleanup(lView);
  let hostIndex: number | null = null;
  let hostDirectivesStart: number | null = null;
  let hostDirectivesEnd: number | null = null;
  let hasOutput = false;

  if (ngDevMode && !tNode.directiveToIndex?.has(target.type)) {
    throw new Error(`노드에는 ${target.type.name} 유형의 지시문이 없습니다.`);
  }

  const data = tNode.directiveToIndex!.get(target.type)!;

  if (typeof data === 'number') {
    hostIndex = data;
  } else {
    [hostIndex, hostDirectivesStart, hostDirectivesEnd] = data;
  }

  if (
    hostDirectivesStart !== null &&
    hostDirectivesEnd !== null &&
    tNode.hostDirectiveOutputs?.hasOwnProperty(eventName)
  ) {
    const hostDirectiveOutputs = tNode.hostDirectiveOutputs[eventName];

    for (let i = 0; i < hostDirectiveOutputs.length; i += 2) {
      const index = hostDirectiveOutputs[i] as number;

      if (index >= hostDirectivesStart && index <= hostDirectivesEnd) {
        ngDevMode && assertIndexInRange(lView, index);
        hasOutput = true;
        listenToOutput(
          tNode,
          tView,
          lView,
          index,
          hostDirectiveOutputs[i + 1] as string,
          eventName,
          listenerFn,
          lCleanup,
          tCleanup,
        );
      } else if (index > hostDirectivesEnd) {
        break;
      }
    }
  }

  if (target.outputs.hasOwnProperty(eventName)) {
    ngDevMode && assertIndexInRange(lView, hostIndex);
    hasOutput = true;
    listenToOutput(
      tNode,
      tView,
      lView,
      hostIndex,
      eventName,
      eventName,
      listenerFn,
      lCleanup,
      tCleanup,
    );
  }

  return hasOutput;
}

export function listenToOutput(
  tNode: TNode,
  tView: TView,
  lView: LView,
  index: number,
  lookupName: string,
  eventName: string,
  listenerFn: (e?: any) => any,
  lCleanup: any[],
  tCleanup: any[] | null,
) {
  ngDevMode && assertIndexInRange(lView, index);
  const instance = lView[index];
  const def = tView.data[index] as DirectiveDef<unknown>;
  const propertyName = def.outputs[lookupName];
  const output = instance[propertyName];

  if (ngDevMode && !isOutputSubscribable(output)) {
    throw new Error(
      `@Output ${propertyName}가 '${instance.constructor.name}'에서 초기화되지 않았습니다.`,
    );
  }

  const subscription = (output as SubscribableOutput<unknown>).subscribe(listenerFn);
  const idx = lCleanup.length;
  lCleanup.push(listenerFn, subscription);
  tCleanup && tCleanup.push(eventName, tNode.index, idx, -(idx + 1));
}

/**
 * 주어진 값이 구독 가능한 출력을 나타내는지 여부입니다.
 *
 * 예를 들어, `EventEmitter`, `Subject`, `Observable` 또는
 * `OutputEmitter`가 해당됩니다.
 */
function isOutputSubscribable(value: unknown): value is SubscribableOutput<unknown> {
  return (
    value != null && typeof (value as Partial<SubscribableOutput<unknown>>).subscribe === 'function'
  );
}
