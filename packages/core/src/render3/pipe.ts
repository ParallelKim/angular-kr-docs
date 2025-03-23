/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {PipeTransform} from '../change_detection/pipe_transform';
import {setInjectImplementation} from '../di/inject_switch';
import {formatRuntimeError, RuntimeError, RuntimeErrorCode} from '../errors';
import {Type} from '../interface/type';

import {InjectorProfilerContext, setInjectorProfilerContext} from './debug/injector_profiler';
import {getFactoryDef} from './definition_factory';
import {NodeInjector, setIncludeViewProviders} from './di';
import {store, ɵɵdirectiveInject} from './instructions/all';
import {isHostComponentStandalone} from './instructions/element_validation';
import {PipeDef, PipeDefList} from './interfaces/definition';
import {TTextNode} from './interfaces/node';
import {CONTEXT, DECLARATION_COMPONENT_VIEW, HEADER_OFFSET, LView, TVIEW} from './interfaces/view';
import {
  pureFunction1Internal,
  pureFunction2Internal,
  pureFunction3Internal,
  pureFunction4Internal,
  pureFunctionVInternal,
} from './pure_function';
import {getBindingRoot, getCurrentTNode, getLView, getTView} from './state';
import {load} from './util/view_utils';

/**
 * 파이프를 생성합니다.
 *
 * @param index 파이프가 저장될 파이프 인덱스입니다.
 * @param pipeName 파이프의 이름
 * @returns T 파이프의 인스턴스입니다.
 *
 * @codeGenApi
 */
export function ɵɵpipe(index: number, pipeName: string): any {
  const tView = getTView();
  let pipeDef: PipeDef<any>;
  const adjustedIndex = index + HEADER_OFFSET;

  if (tView.firstCreatePass) {
    // 주어진 이름의 파이프가 발견되지 않으면 `getPipeDef`가 오류를 발생시킵니다
    // (따라서 아래에서 널이 아님을 보장합니다).
    pipeDef = getPipeDef(pipeName, tView.pipeRegistry)!;
    tView.data[adjustedIndex] = pipeDef;
    if (pipeDef.onDestroy) {
      (tView.destroyHooks ??= []).push(adjustedIndex, pipeDef.onDestroy);
    }
  } else {
    pipeDef = tView.data[adjustedIndex] as PipeDef<any>;
  }

  const pipeFactory = pipeDef.factory || (pipeDef.factory = getFactoryDef(pipeDef.type, true));

  let previousInjectorProfilerContext: InjectorProfilerContext;
  if (ngDevMode) {
    previousInjectorProfilerContext = setInjectorProfilerContext({
      injector: new NodeInjector(getCurrentTNode() as TTextNode, getLView()),
      token: pipeDef.type,
    });
  }
  const previousInjectImplementation = setInjectImplementation(ɵɵdirectiveInject);
  try {
    // 파이프에 대한 DI는 구성 요소 호스트 노드에 배치될 때 지시문처럼 동작해야 하며,
    // 그러므로 `viewProviders`에 대한 접근을 비활성화해야 합니다.
    const previousIncludeViewProviders = setIncludeViewProviders(false);
    const pipeInstance = pipeFactory();
    setIncludeViewProviders(previousIncludeViewProviders);
    store(tView, getLView(), adjustedIndex, pipeInstance);
    return pipeInstance;
  } finally {
    // 파이프 생성 중 오류가 발생할 경우를 대비하여 finally에서 인젝터 구현을 복원해야 합니다.
    setInjectImplementation(previousInjectImplementation);
    ngDevMode && setInjectorProfilerContext(previousInjectorProfilerContext!);
  }
}

/**
 * 주어진 이름의 파이프를 파이프 레지스트리에서 검색합니다. 하나가 발견되면,
 * 해당 파이프를 반환합니다. 그렇지 않으면, 파이프를 해결할 수 없기 때문에 오류가 발생합니다.
 *
 * @param name 해결할 파이프의 이름
 * @param registry 사용 가능한 파이프의 전체 목록
 * @returns 일치하는 PipeDef
 */
function getPipeDef(name: string, registry: PipeDefList | null): PipeDef<any> | undefined {
  if (registry) {
    if (ngDevMode) {
      const pipes = registry.filter((pipe) => pipe.name === name);
      // TODO: 다음 주요 릴리스에서 오류 발생
      if (pipes.length > 1) {
        console.warn(
          formatRuntimeError(
            RuntimeErrorCode.MULTIPLE_MATCHING_PIPES,
            getMultipleMatchingPipesMessage(name),
          ),
        );
      }
    }
    for (let i = registry.length - 1; i >= 0; i--) {
      const pipeDef = registry[i];
      if (name === pipeDef.name) {
        return pipeDef;
      }
    }
  }
  if (ngDevMode) {
    throw new RuntimeError(RuntimeErrorCode.PIPE_NOT_FOUND, getPipeNotFoundErrorMessage(name));
  }
  return;
}

/**
 * 이름이 일치하는 파이프가 여러 개일 때 사용자에게 유용한 오류 메시지를 생성합니다.
 *
 * @param name 파이프의 이름
 * @returns 오류 메시지
 */
function getMultipleMatchingPipesMessage(name: string) {
  const lView = getLView();
  const declarationLView = lView[DECLARATION_COMPONENT_VIEW] as LView<Type<unknown>>;
  const context = declarationLView[CONTEXT];
  const hostIsStandalone = isHostComponentStandalone(lView);
  const componentInfoMessage = context ? ` '${context.constructor.name}' 구성 요소 내에서` : '';
  const verifyMessage = `확인 ${
    hostIsStandalone ? "'@Component.imports'의 이 구성 요소" : '이 모듈의 가져오기'
  }`;
  const errorMessage = `여러 개의 파이프가 이름 \`${name}\`과 일치합니다${componentInfoMessage}. ${verifyMessage}`;
  return errorMessage;
}

/**
 * 파이프를 찾을 수 없을 때 사용자에게 유용한 오류 메시지를 생성합니다.
 *
 * @param name 누락된 파이프의 이름
 * @returns 오류 메시지
 */
function getPipeNotFoundErrorMessage(name: string) {
  const lView = getLView();
  const declarationLView = lView[DECLARATION_COMPONENT_VIEW] as LView<Type<unknown>>;
  const context = declarationLView[CONTEXT];
  const hostIsStandalone = isHostComponentStandalone(lView);
  const componentInfoMessage = context ? ` '${context.constructor.name}' 구성 요소 내에서` : '';
  const verifyMessage = `확인합니다 ${
    hostIsStandalone
      ? "'@Component.imports'에 포함되어야 합니다."
      : '이 모듈에서 선언되거나 가져와야 합니다.'
  }`;
  const errorMessage = `파이프 '${name}'를 찾을 수 없습니다${componentInfoMessage}. ${verifyMessage}`;
  return errorMessage;
}

/**
 * 1개의 인수로 파이프를 호출합니다.
 *
 * 이 지시는 {@link PipeTransform#transform} 호출에 대한 보호 역할을 하며
 * 파이프 입력이 변경될 때만 파이프를 호출합니다.
 *
 * @param index 파이프가 생성 중에 저장된 파이프 인덱스입니다.
 * @param offset 바인딩 오프셋
 * @param v1 {@link PipeTransform#transform}의 1번째 인수입니다.
 *
 * @codeGenApi
 */
export function ɵɵpipeBind1(index: number, offset: number, v1: any): any {
  const adjustedIndex = index + HEADER_OFFSET;
  const lView = getLView();
  const pipeInstance = load<PipeTransform>(lView, adjustedIndex);
  return isPure(lView, adjustedIndex)
    ? pureFunction1Internal(
        lView,
        getBindingRoot(),
        offset,
        pipeInstance.transform,
        v1,
        pipeInstance,
      )
    : pipeInstance.transform(v1);
}

/**
 * 2개의 인수로 파이프를 호출합니다.
 *
 * 이 지시는 {@link PipeTransform#transform} 호출에 대한 보호 역할을 하며
 * 파이프 입력이 변경될 때만 파이프를 호출합니다.
 *
 * @param index 파이프가 생성 중에 저장된 파이프 인덱스입니다.
 * @param slotOffset 예약된 슬롯 공간의 오프셋입니다.
 * @param v1 {@link PipeTransform#transform}의 1번째 인수입니다.
 * @param v2 {@link PipeTransform#transform}의 2번째 인수입니다.
 *
 * @codeGenApi
 */
export function ɵɵpipeBind2(index: number, slotOffset: number, v1: any, v2: any): any {
  const adjustedIndex = index + HEADER_OFFSET;
  const lView = getLView();
  const pipeInstance = load<PipeTransform>(lView, adjustedIndex);
  return isPure(lView, adjustedIndex)
    ? pureFunction2Internal(
        lView,
        getBindingRoot(),
        slotOffset,
        pipeInstance.transform,
        v1,
        v2,
        pipeInstance,
      )
    : pipeInstance.transform(v1, v2);
}

/**
 * 3개의 인수로 파이프를 호출합니다.
 *
 * 이 지시는 {@link PipeTransform#transform} 호출에 대한 보호 역할을 하며
 * 파이프 입력이 변경될 때만 파이프를 호출합니다.
 *
 * @param index 파이프가 생성 중에 저장된 파이프 인덱스입니다.
 * @param slotOffset 예약된 슬롯 공간의 오프셋입니다.
 * @param v1 {@link PipeTransform#transform}의 1번째 인수입니다.
 * @param v2 {@link PipeTransform#transform}의 2번째 인수입니다.
 * @param v3 {@link PipeTransform#transform}의 3번째 인수입니다.
 *
 * @codeGenApi
 */
export function ɵɵpipeBind3(index: number, slotOffset: number, v1: any, v2: any, v3: any): any {
  const adjustedIndex = index + HEADER_OFFSET;
  const lView = getLView();
  const pipeInstance = load<PipeTransform>(lView, adjustedIndex);
  return isPure(lView, adjustedIndex)
    ? pureFunction3Internal(
        lView,
        getBindingRoot(),
        slotOffset,
        pipeInstance.transform,
        v1,
        v2,
        v3,
        pipeInstance,
      )
    : pipeInstance.transform(v1, v2, v3);
}

/**
 * 4개의 인수로 파이프를 호출합니다.
 *
 * 이 지시는 {@link PipeTransform#transform} 호출에 대한 보호 역할을 하며
 * 파이프 입력이 변경될 때만 파이프를 호출합니다.
 *
 * @param index 파이프가 생성 중에 저장된 파이프 인덱스입니다.
 * @param slotOffset 예약된 슬롯 공간의 오프셋입니다.
 * @param v1 {@link PipeTransform#transform}의 1번째 인수입니다.
 * @param v2 {@link PipeTransform#transform}의 2번째 인수입니다.
 * @param v3 {@link PipeTransform#transform}의 3번째 인수입니다.
 * @param v4 {@link PipeTransform#transform}의 4번째 인수입니다.
 *
 * @codeGenApi
 */
export function ɵɵpipeBind4(
  index: number,
  slotOffset: number,
  v1: any,
  v2: any,
  v3: any,
  v4: any,
): any {
  const adjustedIndex = index + HEADER_OFFSET;
  const lView = getLView();
  const pipeInstance = load<PipeTransform>(lView, adjustedIndex);
  return isPure(lView, adjustedIndex)
    ? pureFunction4Internal(
        lView,
        getBindingRoot(),
        slotOffset,
        pipeInstance.transform,
        v1,
        v2,
        v3,
        v4,
        pipeInstance,
      )
    : pipeInstance.transform(v1, v2, v3, v4);
}

/**
 * 가변 개수의 인수로 파이프를 호출합니다.
 *
 * 이 지시는 {@link PipeTransform#transform} 호출에 대한 보호 역할을 하며
 * 파이프 입력이 변경될 때만 파이프를 호출합니다.
 *
 * @param index 파이프가 생성 중에 저장된 파이프 인덱스입니다.
 * @param slotOffset 예약된 슬롯 공간의 오프셋입니다.
 * @param values {@link PipeTransform#transform} 메서드에 전달할 인수 배열입니다.
 *
 * @codeGenApi
 */
export function ɵɵpipeBindV(index: number, slotOffset: number, values: [any, ...any[]]): any {
  const adjustedIndex = index + HEADER_OFFSET;
  const lView = getLView();
  const pipeInstance = load<PipeTransform>(lView, adjustedIndex);
  return isPure(lView, adjustedIndex)
    ? pureFunctionVInternal(
        lView,
        getBindingRoot(),
        slotOffset,
        pipeInstance.transform,
        values,
        pipeInstance,
      )
    : pipeInstance.transform.apply(pipeInstance, values);
}

function isPure(lView: LView, index: number): boolean {
  return (<PipeDef<any>>lView[TVIEW].data[index]).pure;
}
