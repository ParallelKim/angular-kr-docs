/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {RuntimeError, RuntimeErrorCode} from '../../errors';
import {Writable} from '../../interface/type';
import {DoCheck, OnChanges, OnInit} from '../../interface/lifecycle_hooks';
import {
  assertGreaterThan,
  assertGreaterThanOrEqual,
  assertNotEqual,
  assertSame,
} from '../../util/assert';
import {assertFirstCreatePass} from '../assert';
import {getFactoryDef} from '../definition_factory';
import {diPublicInInjector, getOrCreateNodeInjectorForNode} from '../di';
import {ɵɵdirectiveInject} from '../instructions/di';
import {AttributeMarker} from '../interfaces/attribute_marker';
import type {
  ComponentDef,
  DirectiveDef,
  HostDirectiveDef,
  HostDirectiveDefs,
  HostDirectiveRanges,
} from '../interfaces/definition';
import {NodeInjectorFactory} from '../interfaces/injector';
import {
  HostDirectiveInputs,
  HostDirectiveOutputs,
  InitialInputs,
  NodeInputBindings,
  NodeOutputBindings,
  TNodeFlags,
  type TContainerNode,
  type TElementContainerNode,
  type TElementNode,
  type TNode,
} from '../interfaces/node';
import {isComponentDef} from '../interfaces/type_checks';
import {HEADER_OFFSET, HostBindingOpCodes, type LView, type TView} from '../interfaces/view';
import {isInlineTemplate} from '../node_selector_matcher';
import {NO_CHANGE} from '../tokens';
import {mergeHostAttrs} from '../util/attrs_utils';
import {allocExpando} from './construction';

export type DirectiveMatcherStrategy = (
  tView: TView,
  tNode: TElementNode | TContainerNode | TElementContainerNode,
) => DirectiveDef<unknown>[] | null;

/**
 * 노드에서 일치하는 디렉티브를 해결합니다.
 */
export function resolveDirectives(
  tView: TView,
  lView: LView,
  tNode: TElementNode | TContainerNode | TElementContainerNode,
  localRefs: string[] | null,
  directiveMatcher: DirectiveMatcherStrategy,
): void {
  // `exportsMap`에 대해 명시적인 타입을 가져야 함을 확인하십시오. 유추된 타입은 tsickle에서 버그를 유발합니다.
  ngDevMode && assertFirstCreatePass(tView);

  const exportsMap: Record<string, number> | null = localRefs === null ? null : {'': -1};
  const matchedDirectiveDefs = directiveMatcher(tView, tNode);

  if (matchedDirectiveDefs !== null) {
    let directiveDefs = matchedDirectiveDefs;
    let hostDirectiveDefs: HostDirectiveDefs | null = null;
    let hostDirectiveRanges: HostDirectiveRanges | null = null;

    for (const def of matchedDirectiveDefs) {
      if (def.resolveHostDirectives !== null) {
        [directiveDefs, hostDirectiveDefs, hostDirectiveRanges] =
          def.resolveHostDirectives(matchedDirectiveDefs);
        break;
      }
    }

    ngDevMode && assertNoDuplicateDirectives(directiveDefs);

    initializeDirectives(
      tView,
      lView,
      tNode,
      directiveDefs,
      exportsMap,
      hostDirectiveDefs,
      hostDirectiveRanges,
    );
  }
  if (exportsMap !== null && localRefs !== null) {
    cacheMatchingLocalNames(tNode, localRefs, exportsMap);
  }
}

/** 로컬 이름과 해당 디렉티브 인덱스를 쿼리 및 템플릿 조회를 위해 캐시합니다. */
function cacheMatchingLocalNames(
  tNode: TNode,
  localRefs: string[],
  exportsMap: {[key: string]: number},
): void {
  const localNames: (string | number)[] = (tNode.localNames = []);

  // 로컬 이름은 로컬 참조가 정의된 것과 동일한 순서로 tNode에 저장되어야 하며,
  // 이는 데이터가 템플릿의 참조와 동일한 슬롯에 로드되도록 보장합니다.
  for (let i = 0; i < localRefs.length; i += 2) {
    const index = exportsMap[localRefs[i + 1]];
    if (index == null)
      throw new RuntimeError(
        RuntimeErrorCode.EXPORT_NOT_FOUND,
        ngDevMode && `이름 '${localRefs[i + 1]}'의 내보내기가 발견되지 않았습니다!`,
      );
    localNames.push(localRefs[i], index);
  }
}

/**
 * 주어진 TNode를 컴포넌트의 호스트로 표시합니다. 다음과 같은 작업을 수행합니다:
 * - TNode의 컴포넌트 오프셋 설정.
 * - 뷰 갱신을 위해 큐에 넣기 위해 컴포넌트의 호스트 요소 인덱스를 저장합니다.
 */
function markAsComponentHost(tView: TView, hostTNode: TNode, componentOffset: number): void {
  ngDevMode && assertFirstCreatePass(tView);
  ngDevMode && assertGreaterThan(componentOffset, -1, 'componentOffset는 -1보다 커야 합니다');
  hostTNode.componentOffset = componentOffset;
  (tView.components ??= []).push(hostTNode.index);
}

/** 디렉티브 목록을 인스턴스화하는 데 필요한 데이터 구조를 초기화합니다. */
function initializeDirectives(
  tView: TView,
  lView: LView<unknown>,
  tNode: TElementNode | TContainerNode | TElementContainerNode,
  directives: DirectiveDef<unknown>[],
  exportsMap: {[key: string]: number} | null,
  hostDirectiveDefs: HostDirectiveDefs | null,
  hostDirectiveRanges: HostDirectiveRanges | null,
) {
  ngDevMode && assertFirstCreatePass(tView);

  const directivesLength = directives.length;
  let hasSeenComponent = false;

  // DI에 디렉티브 타입을 발행하여 주입 가능하게 합니다. TNode 플래그가 초기화되기 전에 별도의 패스로 수행되어야 합니다.
  for (let i = 0; i < directivesLength; i++) {
    const def = directives[i];
    if (!hasSeenComponent && isComponentDef(def)) {
      hasSeenComponent = true;
      markAsComponentHost(tView, tNode, i);
    }
    diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), tView, def.type);
  }

  initTNodeFlags(tNode, tView.data.length, directivesLength);

  // 동일한 토큰이 동일한 노드의 여러 디렉티브에 의해 제공될 때 몇 가지 규칙이 적용됩니다.
  // - viewProviders는 providers보다 우선합니다.
  // - NgModule.declarations의 마지막 디렉티브가 이전 디렉티브보다 우선합니다.
  // 따라서 이러한 규칙에 맞추기 위해 제공자를 배열에 추가하는 순서가 매우 중요합니다.
  for (let i = 0; i < directivesLength; i++) {
    const def = directives[i];
    if (def.providersResolver) def.providersResolver(def);
  }
  let preOrderHooksFound = false;
  let preOrderCheckHooksFound = false;
  let directiveIdx = allocExpando(tView, lView, directivesLength, null);
  ngDevMode &&
    assertSame(
      directiveIdx,
      tNode.directiveStart,
      'TNode.directiveStart는 방금 할당된 공간을 가리켜야 합니다',
    );

  // 디렉티브가 최소 하나 이상 있다면, 이를 추적하기 위해 맵을 초기화합니다.
  if (directivesLength > 0) {
    tNode.directiveToIndex = new Map();
  }

  for (let i = 0; i < directivesLength; i++) {
    const def = directives[i];
    // 일치하는 순서로 attrs를 병합합니다. 여기서는 첫 번째 디렉티브가 컴포넌트 자체라는 것을 가정합니다.
    tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, def.hostAttrs);

    configureViewWithDirective(tView, tNode, lView, directiveIdx, def);
    saveNameToExportMap(directiveIdx, def, exportsMap);

    // 디렉티브가 호스트 디렉티브를 가지면, 해당 인덱스와 선언된 범위를 모두 추적해야 합니다.
    if (hostDirectiveRanges !== null && hostDirectiveRanges.has(def)) {
      const [start, end] = hostDirectiveRanges.get(def)!;
      tNode.directiveToIndex!.set(def.type, [
        directiveIdx,
        start + tNode.directiveStart,
        end + tNode.directiveStart,
      ]);
    } else if (hostDirectiveDefs === null || !hostDirectiveDefs.has(def)) {
      tNode.directiveToIndex!.set(def.type, directiveIdx);
    }

    if (def.contentQueries !== null) tNode.flags |= TNodeFlags.hasContentQuery;
    if (def.hostBindings !== null || def.hostAttrs !== null || def.hostVars !== 0)
      tNode.flags |= TNodeFlags.hasHostBindings;

    const lifeCycleHooks: Partial<OnChanges & OnInit & DoCheck> = def.type.prototype;
    // 이 노드에서 첫 번째 사전 순서 훅을 찾은 경우에만 preOrderHooks 배열에 노드 인덱스를 추가합니다.
    if (
      !preOrderHooksFound &&
      (lifeCycleHooks.ngOnChanges || lifeCycleHooks.ngOnInit || lifeCycleHooks.ngDoCheck)
    ) {
      // 디렉티브 인스턴스화 중에 실제 훅 함수를 이 배열에 추가할 것입니다.
      // 지금은 할 수 없습니다. 훅이 디렉티브가 생성된 것과 동일한 순서로 등록되도록 보장해야 합니다 (즉, 주입 순서).
      (tView.preOrderHooks ??= []).push(tNode.index);
      preOrderHooksFound = true;
    }

    if (!preOrderCheckHooksFound && (lifeCycleHooks.ngOnChanges || lifeCycleHooks.ngDoCheck)) {
      (tView.preOrderCheckHooks ??= []).push(tNode.index);
      preOrderCheckHooksFound = true;
    }

    directiveIdx++;
  }

  initializeInputAndOutputAliases(tView, tNode, hostDirectiveDefs);
}

/**
 * 디렉티브 입력 및 출력을 처리하기 위한 데이터 구조를 초기화합니다.
 * 특정 TNode에서 일치하는 모든 디렉티브에 대해 초기화가 수행됩니다.
 */
function initializeInputAndOutputAliases(
  tView: TView,
  tNode: TNode,
  hostDirectiveDefs: HostDirectiveDefs | null,
): void {
  ngDevMode && assertFirstCreatePass(tView);

  for (let index = tNode.directiveStart; index < tNode.directiveEnd; index++) {
    const directiveDef = tView.data[index] as DirectiveDef<any>;

    if (hostDirectiveDefs === null || !hostDirectiveDefs.has(directiveDef)) {
      setupSelectorMatchedInputsOrOutputs(BindingType.Inputs, tNode, directiveDef, index);
      setupSelectorMatchedInputsOrOutputs(BindingType.Outputs, tNode, directiveDef, index);
      setupInitialInputs(tNode, index, false);
    } else {
      const hostDirectiveDef = hostDirectiveDefs.get(directiveDef)!;
      setupHostDirectiveInputsOrOutputs(BindingType.Inputs, tNode, hostDirectiveDef, index);
      setupHostDirectiveInputsOrOutputs(BindingType.Outputs, tNode, hostDirectiveDef, index);
      setupInitialInputs(tNode, index, true);
    }
  }
}

/** 디렉티브에 의해 노출될 수 있는 바인딩 유형. */
const enum BindingType {
  Inputs,
  Outputs,
}

/**
 * 템플릿에서 선택자를 통해 일치한 디렉티브의 입력/출력 바인딩을 설정합니다.
 * 이 메서드는 노드의 모든 사용 가능한 입력을 구성하기 위해 반복적으로 호출됩니다.
 *
 * @param mode 입력 또는 출력이 구성되고 있는지 여부.
 * @param tNode 바인딩이 설정될 노드.
 * @param def 바인딩이 설정될 디렉티브 정의.
 * @param directiveIndex LView에 디렉티브 인스턴스가 저장될 인덱스.
 */
function setupSelectorMatchedInputsOrOutputs<T>(
  mode: BindingType,
  tNode: TNode,
  def: DirectiveDef<T>,
  directiveIndex: number,
): void {
  const aliasMap = mode === BindingType.Inputs ? def.inputs : def.outputs;

  for (const publicName in aliasMap) {
    if (aliasMap.hasOwnProperty(publicName)) {
      let bindings: NodeInputBindings | NodeOutputBindings;
      if (mode === BindingType.Inputs) {
        bindings = tNode.inputs ??= {};
      } else {
        bindings = tNode.outputs ??= {};
      }
      bindings[publicName] ??= [];
      bindings[publicName].push(directiveIndex);
      setShadowStylingInputFlags(tNode, publicName);
    }
  }
}

/**
 * 특정 노드에서 호스트 디렉티브를 통해 정의된 입력/출력 바인딩을 설정합니다.
 * @param mode 입력 또는 출력이 구성되고 있는지 여부.
 * @param tNode 바인딩이 설정될 노드.
 * @param config 설정할 호스트 디렉티브 정의.
 * @param directiveIndex LView에 디렉티브 인스턴스가 저장될 인덱스.
 */
function setupHostDirectiveInputsOrOutputs(
  mode: BindingType,
  tNode: TNode,
  config: HostDirectiveDef,
  directiveIndex: number,
): void {
  const aliasMap = mode === BindingType.Inputs ? config.inputs : config.outputs;

  for (const initialName in aliasMap) {
    if (aliasMap.hasOwnProperty(initialName)) {
      const publicName = aliasMap[initialName];
      let bindings: HostDirectiveInputs | HostDirectiveOutputs;
      if (mode === BindingType.Inputs) {
        bindings = tNode.hostDirectiveInputs ??= {};
      } else {
        bindings = tNode.hostDirectiveOutputs ??= {};
      }
      bindings[publicName] ??= [];
      bindings[publicName].push(directiveIndex, initialName);
      setShadowStylingInputFlags(tNode, publicName);
    }
  }
}

function setShadowStylingInputFlags(tNode: TNode, publicName: string): void {
  if (publicName === 'class') {
    tNode.flags |= TNodeFlags.hasClassInput;
  } else if (publicName === 'style') {
    tNode.flags |= TNodeFlags.hasStyleInput;
  }
}

/**
 * 노드에 대한 initialInputData를 설정하고 이를 템플릿의 정적 저장소에 저장합니다.
 * 이후의 템플릿 호출이 다시 계산할 필요가 없도록 합니다.
 *
 * initialInputData는 이 노드의 디렉티브에 대한 입력 properties로 설정해야 하는 값들을 포함하는 배열입니다.
 * 그러나 생성 시 한 번만 설정합니다. 이러한 배열이 필요한 이유는 @Input 속성을
 * attribute-like 구문을 사용하여 설정하는 경우를 지원하기 위해서입니다.
 * 예를 들어, `name` @Input이 있는 경우 다음과 같이 한 번 설정할 수 있습니다.
 *
 * <my-component name="Bess"></my-component>
 *
 * @param tNode 초기 속성을 설정할 TNode.
 * @param directiveIndex 현재 처리 중인 디렉티브의 인덱스.
 */
function setupInitialInputs(tNode: TNode, directiveIndex: number, isHostDirective: boolean): void {
  const {attrs, inputs, hostDirectiveInputs} = tNode;

  if (
    attrs === null ||
    (!isHostDirective && inputs === null) ||
    (isHostDirective && hostDirectiveInputs === null) ||
    // 구조적 디렉티브에 대해 바인딩되지 않은 속성을 입력으로 사용하지 않도록 합니다.
    isInlineTemplate(tNode)
  ) {
    tNode.initialInputs ??= [];
    tNode.initialInputs.push(null);
    return;
  }

  let inputsToStore: InitialInputs | null = null;
  let i = 0;
  while (i < attrs.length) {
    const attrName = attrs[i];
    if (attrName === AttributeMarker.NamespaceURI) {
      // 우리는 네임스페이스가 있는 속성에서 입력을 허용하지 않습니다.
      i += 4;
      continue;
    } else if (attrName === AttributeMarker.ProjectAs) {
      // `ngProjectAs` 값을 건너뜁니다.
      i += 2;
      continue;
    } else if (typeof attrName === 'number') {
      // 다른 속성 마커에 도달하면 이미 완료된 것입니다. 그 중 어느 것도 유효한 입력이 아닙니다.
      break;
    }

    if (!isHostDirective && inputs!.hasOwnProperty(attrName as string)) {
      // 입력 저장소에서 입력의 공개 이름을 찾습니다. 우리는 디렉티브 정의를 통해 쉽게 찾을 수 있지만,
      // 호스트 디렉티브 별칭을 고려하기 위해 입력 저장소를 사용하고자 합니다.
      const inputConfig = inputs![attrName as string];

      for (const index of inputConfig) {
        if (index === directiveIndex) {
          inputsToStore ??= [];
          inputsToStore.push(attrName as string, attrs[i + 1] as string);
          // 디렉티브는 동일한 이름으로 여러 개의 입력을 가질 수 없으므로 여기에서 중단할 수 있습니다.
          break;
        }
      }
    } else if (isHostDirective && hostDirectiveInputs!.hasOwnProperty(attrName as string)) {
      const config = hostDirectiveInputs![attrName as string];
      for (let j = 0; j < config.length; j += 2) {
        if (config[j] === directiveIndex) {
          inputsToStore ??= [];
          inputsToStore.push(config[j + 1] as string, attrs[i + 1] as string);
          break;
        }
      }
    }

    i += 2;
  }

  tNode.initialInputs ??= [];
  tNode.initialInputs.push(inputsToStore);
}

/**
 * 디렉티브를 인스턴스화하기 위해 설정합니다.
 *
 * 우리는 `NodeInjectorFactory`를 생성해야 하며, 이는 `Blueprint`와 `LView` 모두에 삽입됩니다.
 * `TView`는 `DirectiveDef`를 받습니다.
 *
 * @param tView `TView`
 * @param tNode `TNode`
 * @param lView `LView`
 * @param directiveIndex 디렉티브가 Expando에 저장될 인덱스.
 * @param def `DirectiveDef`
 */
function configureViewWithDirective<T>(
  tView: TView,
  tNode: TNode,
  lView: LView,
  directiveIndex: number,
  def: DirectiveDef<T>,
): void {
  ngDevMode &&
    assertGreaterThanOrEqual(directiveIndex, HEADER_OFFSET, 'Expando 섹션에 있어야 합니다');
  tView.data[directiveIndex] = def;
  const directiveFactory =
    def.factory || ((def as Writable<DirectiveDef<T>>).factory = getFactoryDef(def.type, true));
  // `directiveFactory`가 이미 생성된 코드에서 `ɵɵdirectiveInject`를 사용하게 되지만,
  // 디렉티브 생성자 컨텍스트에서 `inject()`를 직접 지원하고자 하므로 여기에서도 `ɵɵdirectiveInject`를 설정합니다.
  const nodeInjectorFactory = new NodeInjectorFactory(
    directiveFactory,
    isComponentDef(def),
    ɵɵdirectiveInject,
  );
  tView.blueprint[directiveIndex] = nodeInjectorFactory;
  lView[directiveIndex] = nodeInjectorFactory;

  registerHostBindingOpCodes(
    tView,
    tNode,
    directiveIndex,
    allocExpando(tView, lView, def.hostVars, NO_CHANGE),
    def,
  );
}

/**
 * `TView.hostBindingOpCodes`에 `hostBindings`를 추가합니다.
 *
 * @param tView `TView`에 `hostBindings`를 추가해야 합니다.
 * @param tNode 디렉티브가 포함된 요소의 `TNode`
 * @param directiveIdx 뷰에서의 디렉티브 인덱스.
 * @param directiveVarsIdx 디렉티브의 변수가 저장될 위치
 * @param def `hostVars`/`hostBindings`를 포함하는 `ComponentDef`/`DirectiveDef`.
 */
export function registerHostBindingOpCodes(
  tView: TView,
  tNode: TNode,
  directiveIdx: number,
  directiveVarsIdx: number,
  def: ComponentDef<any> | DirectiveDef<any>,
): void {
  ngDevMode && assertFirstCreatePass(tView);

  const hostBindings = def.hostBindings;
  if (hostBindings) {
    let hostBindingOpCodes = tView.hostBindingOpCodes;
    if (hostBindingOpCodes === null) {
      hostBindingOpCodes = tView.hostBindingOpCodes = [] as any as HostBindingOpCodes;
    }
    const elementIndx = ~tNode.index;
    if (lastSelectedElementIdx(hostBindingOpCodes) != elementIndx) {
      // 기준을 추가하여 실행에서 더 효율적으로 할 수 있도록 합니다.
      // NOTE: 이것은 엄밀히 필요하지 않으며 코드 크기를 실행 성능과 교환합니다.
      // (항상 추가할 수 있습니다.)
      hostBindingOpCodes.push(elementIndx);
    }
    hostBindingOpCodes.push(directiveIdx, directiveVarsIdx, hostBindings);
  }
}

/**
 * `HostBindingOpCodes`에서 마지막 선택된 요소 인덱스를 반환합니다.
 *
 * 성능 상 이유로 선택된 요소 인덱스가 변경된 경우에만 `HostBindingOpCodes`에서 업데이트할 필요가 없습니다.
 * 이 메서드는 마지막 인덱스(또는 없으면 '0')를 반환합니다.
 *
 * 선택된 요소 인덱스는 부호가 있는 값만 포함됩니다.
 */
function lastSelectedElementIdx(hostBindingOpCodes: HostBindingOpCodes): number {
  let i = hostBindingOpCodes.length;
  while (i > 0) {
    const value = hostBindingOpCodes[--i];
    if (typeof value === 'number' && value < 0) {
      return value;
    }
  }
  return 0;
}

/**
 * 디렉티브가 생성될 때 내보내기 맵을 구축하여 로컬 참조를 해당
 * 디렉티브 인스턴스에 빠르게 매핑할 수 있도록 합니다.
 */
function saveNameToExportMap(
  directiveIdx: number,
  def: DirectiveDef<any> | ComponentDef<any>,
  exportsMap: {[key: string]: number} | null,
) {
  if (exportsMap) {
    if (def.exportAs) {
      for (let i = 0; i < def.exportAs.length; i++) {
        exportsMap[def.exportAs[i]] = directiveIdx;
      }
    }
    if (isComponentDef(def)) exportsMap[''] = directiveIdx;
  }
}

/**
 * 현재 노드의 플래그를 초기화하고 모든 인덱스를 초기 인덱스로 설정
 * 디렉티브 수를 0으로 설정하고 isComponent 플래그를 추가합니다.
 * @param index 초기 인덱스
 */
function initTNodeFlags(tNode: TNode, index: number, numberOfDirectives: number) {
  ngDevMode &&
    assertNotEqual(
      numberOfDirectives,
      tNode.directiveEnd - tNode.directiveStart,
      '최대 디렉티브 수에 도달했습니다',
    );
  tNode.flags |= TNodeFlags.isDirectiveHost;
  // 노드에 첫 번째 디렉티브가 생성되면 인덱스를 저장합니다.
  tNode.directiveStart = index;
  tNode.directiveEnd = index + numberOfDirectives;
  tNode.providerIndexes = index;
}

function assertNoDuplicateDirectives(directives: DirectiveDef<unknown>[]): void {
  // 배열에는 중복이 있을 수 있으려면 최소 두 개의 요소가 필요합니다.
  if (directives.length < 2) {
    return;
  }

  const seenDirectives = new Set<DirectiveDef<unknown>>();

  for (const current of directives) {
    if (seenDirectives.has(current)) {
      throw new RuntimeError(
        RuntimeErrorCode.DUPLICATE_DIRECTIVE,
        `디렉티브 ${current.type.name}가 동일한 요소에서 여러 번 일치합니다. ` +
          `디렉티브는 요소에서 한 번만 일치할 수 있습니다.`,
      );
    }
    seenDirectives.add(current);
  }
}
