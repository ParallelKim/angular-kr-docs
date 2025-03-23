/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../../di/injector';
import {INTERNAL_APPLICATION_ERROR_HANDLER} from '../../error_handler';
import {hasSkipHydrationAttrOnRElement} from '../../hydration/skip_hydration';
import {PRESERVE_HOST_CONTENT, PRESERVE_HOST_CONTENT_DEFAULT} from '../../hydration/tokens';
import {processTextNodeMarkersBeforeHydration} from '../../hydration/utils';
import {ViewEncapsulation} from '../../metadata/view';
import {
  validateAgainstEventAttributes,
  validateAgainstEventProperties,
} from '../../sanitization/sanitization';
import {assertIndexInRange, assertNotSame} from '../../util/assert';
import {escapeCommentText} from '../../util/dom';
import {normalizeDebugBindingName, normalizeDebugBindingValue} from '../../util/ng_reflect';
import {stringify} from '../../util/stringify';
import {assertFirstCreatePass, assertLView} from '../assert';
import {attachPatchData} from '../context_discovery';
import {getNodeInjectable, getOrCreateNodeInjectorForNode} from '../di';
import {throwMultipleComponentError} from '../errors';
import {ComponentDef, ComponentTemplate, DirectiveDef, RenderFlags} from '../interfaces/definition';
import {
  InitialInputData,
  InitialInputs,
  LocalRefExtractor,
  TContainerNode,
  TDirectiveHostNode,
  TElementContainerNode,
  TElementNode,
  TNode,
  TNodeFlags,
  TNodeType,
} from '../interfaces/node';
import {Renderer} from '../interfaces/renderer';
import {RComment, RElement} from '../interfaces/renderer_dom';
import {SanitizerFn} from '../interfaces/sanitization';
import {isComponentDef, isComponentHost} from '../interfaces/type_checks';
import {
  CONTEXT,
  FLAGS,
  HEADER_OFFSET,
  INJECTOR,
  LView,
  LViewFlags,
  RENDERER,
  TData,
  TView,
} from '../interfaces/view';
import {assertTNodeType} from '../node_assert';
import {isNodeMatchingSelectorList} from '../node_selector_matcher';
import {profiler} from '../profiler';
import {ProfilerEvent} from '../profiler_types';
import {
  getCurrentDirectiveIndex,
  getSelectedIndex,
  isInCheckNoChangesMode,
  setCurrentDirectiveIndex,
  setSelectedIndex,
} from '../state';
import {NO_CHANGE} from '../tokens';
import {INTERPOLATION_DELIMITER} from '../util/misc_utils';
import {renderStringify} from '../util/stringify_utils';
import {getComponentLViewByIndex, getNativeByTNode, unwrapLView} from '../util/view_utils';

import {clearElementContents} from '../dom_node_manipulation';
import {createComponentLView} from '../view/construction';
import {selectIndexInternal} from './advance';
import {handleUnknownPropertyError, isPropertyValid, matchingSchemas} from './element_validation';
import {writeToDirectiveInput} from './write_to_directive_input';

export function executeTemplate<T>(
  tView: TView,
  lView: LView<T>,
  templateFn: ComponentTemplate<T>,
  rf: RenderFlags,
  context: T,
) {
  const prevSelectedIndex = getSelectedIndex();
  const isUpdatePhase = rf & RenderFlags.Update;
  try {
    setSelectedIndex(-1);
    if (isUpdatePhase && lView.length > HEADER_OFFSET) {
      // 업데이트 중일 때 기본적으로 0을 선택하여 대부분의 업데이트 블록에 대한
      // 해당 지시문을 생성할 필요가 없습니다.
      selectIndexInternal(tView, lView, HEADER_OFFSET, !!ngDevMode && isInCheckNoChangesMode());
    }

    const preHookType = isUpdatePhase
      ? ProfilerEvent.TemplateUpdateStart
      : ProfilerEvent.TemplateCreateStart;
    profiler(preHookType, context as unknown as {}, templateFn);
    templateFn(rf, context);
  } finally {
    setSelectedIndex(prevSelectedIndex);

    const postHookType = isUpdatePhase
      ? ProfilerEvent.TemplateUpdateEnd
      : ProfilerEvent.TemplateCreateEnd;
    profiler(postHookType, context as unknown as {}, templateFn);
  }
}

/**
 * 지시문 인스턴스를 생성합니다.
 */
export function createDirectivesInstances(tView: TView, lView: LView, tNode: TDirectiveHostNode) {
  instantiateAllDirectives(tView, lView, tNode);
  if ((tNode.flags & TNodeFlags.hasHostBindings) === TNodeFlags.hasHostBindings) {
    invokeDirectivesHostBindings(tView, lView, tNode);
  }
}

/**
 * 로컬 이름 목록과 인덱스를 가져와서 로드된 템플릿과 동일한 순서로
 * LView에 해결된 로컬 변수 값을 푸시합니다.
 */
export function saveResolvedLocalsInData(
  viewData: LView,
  tNode: TDirectiveHostNode,
  localRefExtractor: LocalRefExtractor = getNativeByTNode,
): void {
  const localNames = tNode.localNames;
  if (localNames !== null) {
    let localIndex = tNode.index + 1;
    for (let i = 0; i < localNames.length; i += 2) {
      const index = localNames[i + 1] as number;
      const value =
        index === -1
          ? localRefExtractor(
              tNode as TElementNode | TContainerNode | TElementContainerNode,
              viewData,
            )
          : viewData[index];
      viewData[localIndex++] = value;
    }
  }
}

/**
 * 호스트 네이티브 요소를 찾고, 렌더링 파이프라인에 기존 노드를 부트스트랩하는 데 사용됩니다.
 *
 * @param renderer 요소를 찾는 데 사용되는 렌더러입니다.
 * @param elementOrSelector 렌더 요소 또는 요소를 찾기 위한 CSS 선택기입니다.
 * @param encapsulation 호스트 요소를 요청하는 구성요소에 대해 정의된 뷰 캡슐화입니다.
 * @param injector 루트 뷰 주입기 인스턴스입니다.
 */
export function locateHostElement(
  renderer: Renderer,
  elementOrSelector: RElement | string,
  encapsulation: ViewEncapsulation,
  injector: Injector,
): RElement {
  // 참고: 이것은 기본 값이므로, `PRESERVE_HOST_CONTENT`는,
  // tree-shakable 것(제공된 예: 'root')입니다. 이 코드 경로는 동적
  // 구성 요소 생성 중에(예: ViewContainerRef.createComponent 호출 후)
  // 인젝터 인스턴스가 제공될 수 있습니다. 인젝터 인스턴스는 메인 DI
  // 트리에서 분리될 수 있으므로 `PRESERVE_HOST_CONTENT`를 인스턴스화할 수 없습니다.
  // 이 경우 기본 값이 사용됩니다.
  const preserveHostContent = injector.get(PRESERVE_HOST_CONTENT, PRESERVE_HOST_CONTENT_DEFAULT);

  // 네이티브 섀도우 DOM을 사용하는 경우 네이티브 슬롯 프로젝션을 허용하기 위해
  // 호스트 요소를 지우지 않습니다.
  const preserveContent = preserveHostContent || encapsulation === ViewEncapsulation.ShadowDom;
  const rootElement = renderer.selectRootElement(elementOrSelector, preserveContent);
  applyRootElementTransform(rootElement as HTMLElement);
  return rootElement;
}

/**
 * 필요한 경우 루트 요소에 변환을 적용합니다. 수화가 활성화되면
 * 손상된 텍스트 노드를 처리합니다.
 *
 * @param rootElement 앱 루트 HTML 요소
 */
export function applyRootElementTransform(rootElement: HTMLElement) {
  _applyRootElementTransformImpl(rootElement as HTMLElement);
}

/**
 * 앱의 루트 HTML 요소에 변환을 적용하는 함수에 대한 참조입니다.
 * 수화가 활성화되면 손상된 텍스트 노드를 처리하여 클라이언트에서 올바르게 수화할 수 있도록 합니다.
 *
 * @param rootElement 앱 루트 HTML 요소
 */
let _applyRootElementTransformImpl: typeof applyRootElementTransformImpl = () => null;

/**
 * 수화가 시작되기 전에 텍스트 노드 마커를 처리합니다.
 * 이는 직렬화 이전에 추가된 특수 주석 노드를 교체하여 수화 전에
 * 적절한 텍스트 노드를 복원합니다.
 *
 * @param rootElement 앱 루트 HTML 요소
 */
export function applyRootElementTransformImpl(rootElement: HTMLElement) {
  if (hasSkipHydrationAttrOnRElement(rootElement)) {
    // `ngSkipHydration` 속성이 애플리케이션의 루트 노드에 적용된 경우를 처리합니다.
    // 이 경우, 우리는 내용을 지우고 모든 것을 처음부터 다시 렌더링해야 합니다.
    clearElementContents(rootElement as RElement);
  } else {
    processTextNodeMarkersBeforeHydration(rootElement);
  }
}

/**
 * `applyRootElementTransform` 함수의 구현을 설정합니다.
 */
export function enableApplyRootElementTransformImpl() {
  _applyRootElementTransformImpl = applyRootElementTransformImpl;
}

/**
 * 속성 이름과 해당 요소 속성 이름이 일치하지 않는 매핑입니다.
 *
 * 성능 주의: 이 함수는 성능상의 이유로 일련의 if 검사로 작성되었습니다.
 * 일련의 `if` 검사가 속성 이름 매핑의 가장 빠른 방법인 것으로 보입니다.
 * 벤치마킹 없이 변경하지 마십시오.
 *
 * 참고: 이 매핑은 ngtsc의 템플릿 유형 검사 기계 내에서 같은 이름의 매핑과 동기화되어야 합니다.
 */
function mapPropName(name: string): string {
  if (name === 'class') return 'className';
  if (name === 'for') return 'htmlFor';
  if (name === 'formaction') return 'formAction';
  if (name === 'innerHtml') return 'innerHTML';
  if (name === 'readonly') return 'readOnly';
  if (name === 'tabindex') return 'tabIndex';
  return name;
}

export function elementPropertyInternal<T>(
  tView: TView,
  tNode: TNode,
  lView: LView,
  propName: string,
  value: T,
  renderer: Renderer,
  sanitizer: SanitizerFn | null | undefined,
  nativeOnly: boolean,
): void {
  ngDevMode && assertNotSame(value, NO_CHANGE as any, 'Incoming value should never be NO_CHANGE.');

  if (!nativeOnly) {
    const hasSetInput = setAllInputsForProperty(tNode, tView, lView, propName, value);

    if (hasSetInput) {
      isComponentHost(tNode) && markDirtyIfOnPush(lView, tNode.index);
      ngDevMode && setNgReflectProperties(lView, tView, tNode, propName, value);
      return; // 일치하는 입력이 적어도 하나 있는 경우 처리 중지.
    }
  }

  if (tNode.type & TNodeType.AnyRNode) {
    const element = getNativeByTNode(tNode, lView) as RElement | RComment;
    propName = mapPropName(propName);

    if (ngDevMode) {
      validateAgainstEventProperties(propName);
      if (!isPropertyValid(element, propName, tNode.value, tView.schemas)) {
        handleUnknownPropertyError(propName, tNode.value, tNode.type, lView);
      }
    }

    // 속성이 위험하다고 판단되면, sanitizer는 추가 확인 없이 사용됩니다.
    value = sanitizer != null ? (sanitizer(value, tNode.value || '', propName) as any) : value;
    renderer.setProperty(element as RElement, propName, value);
  } else if (tNode.type & TNodeType.AnyContainer) {
    // 노드가 컨테이너이고 속성이 입력이나 스키마와 일치하지 않으면 오류를 발생시켜야 합니다.
    if (ngDevMode && !matchingSchemas(tView.schemas, tNode.value)) {
      handleUnknownPropertyError(propName, tNode.value, tNode.type, lView);
    }
  }
}

/** 노드가 OnPush 구성 요소인 경우 해당 LView를 더럽힙니다. */
export function markDirtyIfOnPush(lView: LView, viewIndex: number): void {
  ngDevMode && assertLView(lView);
  const childComponentLView = getComponentLViewByIndex(viewIndex, lView);
  if (!(childComponentLView[FLAGS] & LViewFlags.CheckAlways)) {
    childComponentLView[FLAGS] |= LViewFlags.Dirty;
  }
}

function setNgReflectProperty(lView: LView, tNode: TNode, attrName: string, value: any) {
  const element = getNativeByTNode(tNode, lView) as RElement | RComment;
  const renderer = lView[RENDERER];
  attrName = normalizeDebugBindingName(attrName);
  const debugValue = normalizeDebugBindingValue(value);
  if (tNode.type & TNodeType.AnyRNode) {
    if (value == null) {
      renderer.removeAttribute(element as RElement, attrName);
    } else {
      renderer.setAttribute(element as RElement, attrName, debugValue);
    }
  } else {
    const textContent = escapeCommentText(
      `bindings=${JSON.stringify({[attrName]: debugValue}, null, 2)}`,
    );
    renderer.setValue(element as RComment, textContent);
  }
}

function setNgReflectProperties(
  lView: LView,
  tView: TView,
  tNode: TNode,
  publicName: string,
  value: any,
) {
  if (!(tNode.type & (TNodeType.AnyRNode | TNodeType.Container))) {
    return;
  }

  const inputConfig = tNode.inputs?.[publicName];
  const hostInputConfig = tNode.hostDirectiveInputs?.[publicName];

  if (hostInputConfig) {
    for (let i = 0; i < hostInputConfig.length; i += 2) {
      const index = hostInputConfig[i] as number;
      const publicName = hostInputConfig[i + 1] as string;
      const def = tView.data[index] as DirectiveDef<unknown>;
      setNgReflectProperty(lView, tNode, def.inputs[publicName][0], value);
    }
  }

  // Note: 우리는 반사된 속성으로 입력의 비공식 이름을 설정합니다, 공용 이름이 아닙니다.
  if (inputConfig) {
    for (const index of inputConfig) {
      const def = tView.data[index] as DirectiveDef<unknown>;
      setNgReflectProperty(lView, tNode, def.inputs[publicName][0], value);
    }
  }
}

/**
 * 현재 노드에서 이전에 해결된 모든 지시문을 인스턴스화합니다.
 */
function instantiateAllDirectives(tView: TView, lView: LView, tNode: TDirectiveHostNode) {
  const start = tNode.directiveStart;
  const end = tNode.directiveEnd;

  // 일부 특별한 기호를 주입하기 위해 노드 주입기를 생성하기 전에 컴포넌트 뷰
  //를 생성해야 합니다.
  if (isComponentHost(tNode)) {
    ngDevMode && assertTNodeType(tNode, TNodeType.AnyRNode);
    createComponentLView(
      lView,
      tNode as TElementNode,
      tView.data[start + tNode.componentOffset] as ComponentDef<unknown>,
    );
  }

  if (!tView.firstCreatePass) {
    getOrCreateNodeInjectorForNode(tNode, lView);
  }

  const initialInputs = tNode.initialInputs;
  for (let i = start; i < end; i++) {
    const def = tView.data[i] as DirectiveDef<any>;
    const directive = getNodeInjectable(lView, tView, i, tNode);
    attachPatchData(directive, lView);

    if (initialInputs !== null) {
      setInputsFromAttrs(lView, i - start, directive, def, tNode, initialInputs!);
    }

    if (isComponentDef(def)) {
      const componentView = getComponentLViewByIndex(tNode.index, lView);
      componentView[CONTEXT] = getNodeInjectable(lView, tView, i, tNode);
    }
  }
}

export function invokeDirectivesHostBindings(tView: TView, lView: LView, tNode: TNode) {
  const start = tNode.directiveStart;
  const end = tNode.directiveEnd;
  const elementIndex = tNode.index;
  const currentDirectiveIndex = getCurrentDirectiveIndex();
  try {
    setSelectedIndex(elementIndex);
    for (let dirIndex = start; dirIndex < end; dirIndex++) {
      const def = tView.data[dirIndex] as DirectiveDef<unknown>;
      const directive = lView[dirIndex];
      setCurrentDirectiveIndex(dirIndex);
      if (def.hostBindings !== null || def.hostVars !== 0 || def.hostAttrs !== null) {
        invokeHostBindingsInCreationMode(def, directive);
      }
    }
  } finally {
    setSelectedIndex(-1);
    setCurrentDirectiveIndex(currentDirectiveIndex);
  }
}

/**
 * 생성 모드에서 호스트 바인딩을 호출합니다.
 *
 * @param def `hostBindings` 함수를 포함할 수 있는 `DirectiveDef`입니다.
 * @param directive 지시문 인스턴스입니다.
 */
export function invokeHostBindingsInCreationMode(def: DirectiveDef<any>, directive: any) {
  if (def.hostBindings !== null) {
    def.hostBindings!(RenderFlags.Create, directive);
  }
}

/**
 * 현재 노드를 모든 사용 가능한 선택기와 대조합니다.
 * 구성 요소가 일치하면, 배열의 첫 번째 위치에 반환됩니다(최대 1개).
 */
export function findDirectiveDefMatches(
  tView: TView,
  tNode: TElementNode | TContainerNode | TElementContainerNode,
): DirectiveDef<unknown>[] | null {
  ngDevMode && assertFirstCreatePass(tView);
  ngDevMode && assertTNodeType(tNode, TNodeType.AnyRNode | TNodeType.AnyContainer);

  const registry = tView.directiveRegistry;
  let matches: DirectiveDef<unknown>[] | null = null;
  if (registry) {
    for (let i = 0; i < registry.length; i++) {
      const def = registry[i] as ComponentDef<any> | DirectiveDef<any>;
      if (isNodeMatchingSelectorList(tNode, def.selectors!, /* isProjectionMode */ false)) {
        matches ??= [];

        if (isComponentDef(def)) {
          if (ngDevMode) {
            assertTNodeType(
              tNode,
              TNodeType.Element,
              `"${tNode.value}" 태그는 구성 요소 호스트로 사용할 수 없습니다. ` +
                `다른 태그를 사용하여 ${stringify(def.type)} 구성 요소를 활성화하십시오.`,
            );

            if (matches.length && isComponentDef(matches[0])) {
              throwMultipleComponentError(tNode, matches.find(isComponentDef)!.type, def.type);
            }
          }

          matches.unshift(def);
        } else {
          matches.push(def);
        }
      }
    }
  }

  return matches;
}

export function elementAttributeInternal(
  tNode: TNode,
  lView: LView,
  name: string,
  value: any,
  sanitizer: SanitizerFn | null | undefined,
  namespace: string | null | undefined,
) {
  if (ngDevMode) {
    assertNotSame(value, NO_CHANGE as any, 'Incoming value should never be NO_CHANGE.');
    validateAgainstEventAttributes(name);
    assertTNodeType(
      tNode,
      TNodeType.Element,
      `컨테이너 노드에 대해 \`${name}\` 속성을 설정하려고 시도했습니다. ` +
        `호스트 바인딩은 ng-container 또는 ng-template에서 유효하지 않습니다.`,
    );
  }
  const element = getNativeByTNode(tNode, lView) as RElement;
  setElementAttribute(lView[RENDERER], element, namespace, tNode.value, name, value, sanitizer);
}

export function setElementAttribute(
  renderer: Renderer,
  element: RElement,
  namespace: string | null | undefined,
  tagName: string | null,
  name: string,
  value: any,
  sanitizer: SanitizerFn | null | undefined,
) {
  if (value == null) {
    renderer.removeAttribute(element, name, namespace);
  } else {
    const strValue =
      sanitizer == null ? renderStringify(value) : sanitizer(value, tagName || '', name);

    renderer.setAttribute(element, name, strValue as string, namespace);
  }
}

/**
 * 속성 데이터에서 지시문 인스턴스에 대한 초기 입력 속성을 설정합니다.
 *
 * @param lView 현재 처리 중인 LView입니다.
 * @param directiveIndex 지시문의 인덱스입니다(지시문 배열 내).
 * @param instance 초기 입력을 설정할 지시문 인스턴스입니다.
 * @param def 입력 목록을 포함하는 지시문 정의입니다.
 * @param tNode 이 노드에 대한 정적 데이터입니다.
 */
function setInputsFromAttrs<T>(
  lView: LView,
  directiveIndex: number,
  instance: T,
  def: DirectiveDef<T>,
  tNode: TNode,
  initialInputData: InitialInputData,
): void {
  const initialInputs: InitialInputs | null = initialInputData![directiveIndex];
  if (initialInputs !== null) {
    for (let i = 0; i < initialInputs.length; i += 2) {
      const lookupName = initialInputs[i];
      const value = initialInputs[i + 1];

      writeToDirectiveInput<T>(def, instance, lookupName, value);

      if (ngDevMode) {
        setNgReflectProperty(lView, tNode, def.inputs[lookupName][0], value);
      }
    }
  }
}

///////////////////////////////
//// 바인딩 및 보간
///////////////////////////////

/**
 * TestBed의 `DebugElement.properties`에 의해 사용되는 속성 바인딩에 대한 메타데이터를 저장합니다.
 *
 * TestBed의 `DebugElement.properties`를 지원하기 위해, 각 바인딩에 대해
 * - 바운드 속성 이름;
 * - 보간된 문자열의 정적 부분이 필요합니다;
 *
 * 주어진 속성 메타데이터는 `TView.data`의 바인딩 인덱스에 저장됩니다.
 * 즉, 속성 바인딩 메타데이터는 `LView`에서 바인딩된 값과 같은 인덱스에
 * `TView.data`에 저장됩니다. 메타데이터는 다음 형식의 `INTERPOLATION_DELIMITER`로 구분된 문자열로 나타냅니다:
 * - 바운드 속성에 대한 `propertyName`;
 * - 보간된 속성에 대한 `propertyName�prefix�interpolation_static_part1�..interpolation_static_partN�suffix`.
 *
 * @param tData 메타데이터가 저장될 `TData`;
 * @param tNode 바인딩의 대상인 `TNode`;
 * @param propertyName 바운드 속성 이름;
 * @param bindingIndex `LView`의 바인딩 인덱스
 * @param interpolationParts 정적 보간 부분(속성 보간에 대해서)
 */
export function storePropertyBindingMetadata(
  tData: TData,
  tNode: TNode,
  propertyName: string,
  bindingIndex: number,
  ...interpolationParts: string[]
) {
  // 바인딩 메타데이터는 주어진 속성 지시문이 첫 번째로 처리될 때만 저장됩니다.
  // "첫 번째 업데이트 패스"의 개념이 없기 때문에
  // 바인딩 메타데이터의 존재를 확인하여 저장 여부를 결정해야 합니다.
  if (tData[bindingIndex] === null) {
    if (!tNode.inputs?.[propertyName] && !tNode.hostDirectiveInputs?.[propertyName]) {
      const propBindingIdxs = tNode.propertyBindings || (tNode.propertyBindings = []);
      propBindingIdxs.push(bindingIndex);
      let bindingMetadata = propertyName;
      if (interpolationParts.length > 0) {
        bindingMetadata +=
          INTERPOLATION_DELIMITER + interpolationParts.join(INTERPOLATION_DELIMITER);
      }
      tData[bindingIndex] = bindingMetadata;
    }
  }
}

/**
 * 서브 컴포넌트의 렌더러가 현재 렌더러 대신 포함되어야 하는 경우가 있습니다.
 * (see the componentSyntheticHost* instructions).
 */
export function loadComponentRenderer(
  currentDef: DirectiveDef<any> | null,
  tNode: TNode,
  lView: LView,
): Renderer {
  // TODO(FW-2043): the `currentDef` is null when host bindings are invoked while creating root
  // component (see packages/core/src/render3/component.ts). This is not consistent with the process
  // of creating inner components, when current directive index is available in the state. In order
  // to avoid relying on current def being `null` (thus special-casing root component creation), the
  // process of creating root component should be unified with the process of creating inner
  // components.
  if (currentDef === null || isComponentDef(currentDef)) {
    lView = unwrapLView(lView[tNode.index])!;
  }
  return lView[RENDERER];
}

/** Handles an error thrown in an LView. */
export function handleUncaughtError(lView: LView, error: any): void {
  const injector = lView[INJECTOR];
  if (!injector) {
    return;
  }
  const errorHandler = injector.get(INTERNAL_APPLICATION_ERROR_HANDLER, null);
  errorHandler?.(error);
}

/**
 * Set all directive inputs with the specific public name on the node.
 *
 * @param tNode TNode on which the input is being set.
 * @param tView Current TView
 * @param lView `LView` which contains the directives.
 * @param publicName Public name of the input being set.
 * @param value Value to set.
 */
export function setAllInputsForProperty(
  tNode: TNode,
  tView: TView,
  lView: LView,
  publicName: string,
  value: unknown,
): boolean {
  const inputs = tNode.inputs?.[publicName];
  const hostDirectiveInputs = tNode.hostDirectiveInputs?.[publicName];
  let hasMatch = false;

  if (hostDirectiveInputs) {
    for (let i = 0; i < hostDirectiveInputs.length; i += 2) {
      const index = hostDirectiveInputs[i] as number;
      ngDevMode && assertIndexInRange(lView, index);
      const publicName = hostDirectiveInputs[i + 1] as string;
      const def = tView.data[index] as DirectiveDef<unknown>;
      writeToDirectiveInput(def, lView[index], publicName, value);
      hasMatch = true;
    }
  }

  if (inputs) {
    for (const index of inputs) {
      ngDevMode && assertIndexInRange(lView, index);
      const instance = lView[index];
      const def = tView.data[index] as DirectiveDef<any>;
      writeToDirectiveInput(def, instance, publicName, value);
      hasMatch = true;
    }
  }

  return hasMatch;
}

/**
 * Sets an input value only on a specific directive and its host directives.
 * @param tNode TNode on which the input is being set.
 * @param tView Current TView
 * @param lView `LView` which contains the directives.
 * @param target Directive on which to set the input.
 * @param publicName Public name of the input being set.
 * @param value Value to set.
 */
export function setDirectiveInput(
  tNode: TNode,
  tView: TView,
  lView: LView,
  target: DirectiveDef<unknown>,
  publicName: string,
  value: unknown,
): boolean {
  let hostIndex: number | null = null;
  let hostDirectivesStart: number | null = null;
  let hostDirectivesEnd: number | null = null;
  let hasSet = false;

  if (ngDevMode && !tNode.directiveToIndex?.has(target.type)) {
    throw new Error(`Node does not have a directive with type ${target.type.name}`);
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
    tNode.hostDirectiveInputs?.hasOwnProperty(publicName)
  ) {
    const hostDirectiveInputs = tNode.hostDirectiveInputs[publicName];

    for (let i = 0; i < hostDirectiveInputs.length; i += 2) {
      const index = hostDirectiveInputs[i] as number;

      if (index >= hostDirectivesStart && index <= hostDirectivesEnd) {
        ngDevMode && assertIndexInRange(lView, index);
        const def = tView.data[index] as DirectiveDef<unknown>;
        const hostDirectivePublicName = hostDirectiveInputs[i + 1] as string;
        writeToDirectiveInput(def, lView[index], hostDirectivePublicName, value);
        hasSet = true;
      } else if (index > hostDirectivesEnd) {
        // Directives here are in ascending order so we can stop looking once we're past the range.
        break;
      }
    }
  }

  if (hostIndex !== null && target.inputs.hasOwnProperty(publicName)) {
    ngDevMode && assertIndexInRange(lView, hostIndex);
    writeToDirectiveInput(target, lView[hostIndex], publicName, value);
    hasSet = true;
  }

  return hasSet;
}
