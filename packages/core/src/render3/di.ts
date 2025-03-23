/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isForwardRef, resolveForwardRef} from '../di/forward_ref';
import {injectRootLimpMode, setInjectImplementation} from '../di/inject_switch';
import {Injector} from '../di/injector';
import {BackwardsCompatibleInjector, convertToBitFlags} from '../di/injector_compatibility';
import {InjectorMarkers} from '../di/injector_marker';
import {InternalInjectFlags, InjectOptions} from '../di/interface/injector';
import {ProviderToken} from '../di/provider_token';
import {Type} from '../interface/type';
import {assertDefined, assertEqual, assertIndexInRange} from '../util/assert';
import {noSideEffects} from '../util/closure';

import {assertDirectiveDef, assertNodeInjector, assertTNodeForLView} from './assert';
import {
  emitInjectorToCreateInstanceEvent,
  emitInstanceCreatedByInjectorEvent,
  InjectorProfilerContext,
  runInInjectorProfilerContext,
  setInjectorProfilerContext,
} from './debug/injector_profiler';
import {getFactoryDef} from './definition_factory';
import {throwCyclicDependencyError, throwProviderNotFoundError} from './errors_di';
import {NG_ELEMENT_ID, NG_FACTORY_DEF} from './fields';
import {registerPreOrderHooks} from './hooks';
import {AttributeMarker} from './interfaces/attribute_marker';
import {ComponentDef, DirectiveDef} from './interfaces/definition';
import {
  NO_PARENT_INJECTOR,
  NodeInjectorFactory,
  NodeInjectorOffset,
  RelativeInjectorLocation,
  RelativeInjectorLocationFlags,
} from './interfaces/injector';
import {
  TContainerNode,
  TDirectiveHostNode,
  TElementContainerNode,
  TElementNode,
  TNode,
  TNodeProviderIndexes,
  TNodeType,
} from './interfaces/node';
import {isComponentDef, isComponentHost, isRootView} from './interfaces/type_checks';
import {
  DECLARATION_COMPONENT_VIEW,
  DECLARATION_VIEW,
  EMBEDDED_VIEW_INJECTOR,
  FLAGS,
  INJECTOR,
  LView,
  LViewFlags,
  T_HOST,
  TData,
  TVIEW,
  TView,
  TViewType,
} from './interfaces/view';
import {assertTNodeType} from './node_assert';
import {enterDI, getCurrentTNode, getLView, leaveDI} from './state';
import {isNameOnlyAttributeMarker} from './util/attrs_utils';
import {
  getParentInjectorIndex,
  getParentInjectorView,
  hasParentInjector,
} from './util/injector_utils';
import {stringifyForError} from './util/stringify_utils';

/**
 * `inject` 호출이 `viewProviders`를 포함해야 하는지를 정의합니다.
 *
 * 이것은 우리가 컴포넌트를 인스턴스화하려고 할 때 true로 설정됩니다. 이 값은
 * `getNodeInjectable`에서 인스턴스화할 수 있는 토큰의 선언 위치와 일치하는 값으로
 * 재설정됩니다. 이는 `viewProviders` 외부에 선언된 토큰을 주입하고자 할 때
 * 우연히 `viewProviders`를 포함하지 않도록 하기 위함입니다.
 *
 * 예:
 *
 * ```ts
 * @Injectable()
 * class MyService {
 *   constructor(public value: String) {}
 * }
 *
 * @Component({
 *   providers: [
 *     MyService,
 *     {provide: String, value: 'providers' }
 *   ]
 *   viewProviders: [
 *     {provide: String, value: 'viewProviders'}
 *   ]
 * })
 * class MyComponent {
 *   constructor(myService: MyService, value: String) {
 *     // 우리는 컴포넌트가 `viewProviders`를 볼 수 있을 것이라고 기대합니다.
 *     expect(value).toEqual('viewProviders');
 *     // `MyService`는 `viewProviders`에 선언되지 않았으므로 볼 수 없습니다.
 *     expect(myService.value).toEqual('providers');
 *   }
 * }
 *
 * ```
 */
let includeViewProviders = true;

export function setIncludeViewProviders(v: boolean): boolean {
  const oldValue = includeViewProviders;
  includeViewProviders = v;
  return oldValue;
}

/**
 * 각 블룸 필터의 슬롯 수입니다 (DI에 의해 사용됨). 이 숫자가 커질수록 슬롯을 공유하는
 * 디렉티브가 적어지며 따라서 디렉티브 존재 여부를 확인할 때의 오탐지가 줄어듭니다.
 */
const BLOOM_SIZE = 256;
const BLOOM_MASK = BLOOM_SIZE - 1;

/**
 * 단일 블룸 버킷에 의해 표현되는 비트 수입니다. JS 비트 연산은 32비트이므로 각 버킷은
 * 32개의 고유한 토큰을 나타내며 로그2(32) = 5 비트의 블룸 해시 숫자를 account합니다.
 */
const BLOOM_BUCKET_BITS = 5;

/** 디렉티브를 위한 고유 ID를 생성하는 데 사용되는 카운터입니다. */
let nextNgElementId = 0;

/** 인젝터에 의해 어떤 것이 발견되지 않았을 때 사용되는 값입니다. */
const NOT_FOUND = {};

/**
 * 이 지시어를 해당 노드의 인젝터에 존재하는 것으로 등록하여 인젝터의 블룸 필터에서
 * 지시어의 해당 비트를 뒤집습니다.
 *
 * @param injectorIndex 이 토큰이 등록되어야 하는 노드 인젝터의 인덱스
 * @param tView 인젝터의 블룸 필터를 위한 TView
 * @param type 등록할 지시어 토큰
 */
export function bloomAdd(
  injectorIndex: number,
  tView: TView,
  type: ProviderToken<any> | string,
): void {
  ngDevMode && assertEqual(tView.firstCreatePass, true, 'expected firstCreatePass to be true');
  let id: number | undefined;
  if (typeof type === 'string') {
    id = type.charCodeAt(0) || 0;
  } else if (type.hasOwnProperty(NG_ELEMENT_ID)) {
    id = (type as any)[NG_ELEMENT_ID];
  }

  // 지시어 유형에 고유 ID를 설정하여, 누군가가 지시어를 주입하려고 할 때
  // ID를 쉽게 검색하고 확인할 수 있게 합니다.
  if (id == null) {
    id = (type as any)[NG_ELEMENT_ID] = nextNgElementId++;
  }

  // 블룸 필터에는 BLOOM_SIZE(256) 슬롯만 있으므로 모든 고유 ID는 0 - 255의 숫자로
  // 모듈러 연산을 통해 적합해야 합니다.
  const bloomHash = id & BLOOM_MASK;

  // 지시어에 연관된 특정 비트를 대상으로 하는 마스크를 생성합니다.
  // JS 비트 연산은 32비트이므로, 이는 2^0에서 2^31까지의 숫자가 되며,
  // 32비트 정수에서 비트 위치 0 - 31에 해당합니다.
  const mask = 1 << bloomHash;

  // `tData`의 각 블룸 버킷은 `bloomHash`의 `BLOOM_BUCKET_BITS` 수의 비트를 나타냅니다.
  // `BLOOM_BUCKET_BITS`를 초과하는 `bloomHash`의 비트는 마스크가 기록되어야 하는
  // 버킷 오프셋을 나타냅니다.
  (tView.data as number[])[injectorIndex + (bloomHash >> BLOOM_BUCKET_BITS)] |= mask;
}

/**
 * 주어진 요소 또는 컨테이너에 대한 (또는 기존) 인젝터를 생성합니다.
 *
 * @param tNode 인젝터를 검색/생성해야 하는 노드
 * @param lView 노드가 저장된 뷰
 * @returns 노드 인젝터
 */
export function getOrCreateNodeInjectorForNode(
  tNode: TElementNode | TContainerNode | TElementContainerNode,
  lView: LView,
): number {
  const existingInjectorIndex = getInjectorIndex(tNode, lView);
  if (existingInjectorIndex !== -1) {
    return existingInjectorIndex;
  }

  const tView = lView[TVIEW];
  if (tView.firstCreatePass) {
    tNode.injectorIndex = lView.length;
    insertBloom(tView.data, tNode); // 노드 블룸의 기초
    insertBloom(lView, null); // 누적 블룸의 기초
    insertBloom(tView.blueprint, null);
  }

  const parentLoc = getParentInjectorLocation(tNode, lView);
  const injectorIndex = tNode.injectorIndex;

  // 부모 인젝터를 찾을 수 없는 경우, 그 위치가 -1로 설정됩니다.
  // 그런 경우, 누적 블룸을 설정할 필요가 없습니다.
  if (hasParentInjector(parentLoc)) {
    const parentIndex = getParentInjectorIndex(parentLoc);
    const parentLView = getParentInjectorView(parentLoc, lView);
    const parentData = parentLView[TVIEW].data as any;
    // 부모의 블룸 필터와 자신의 누적 블룸(모든 조상의 토큰 포함)을 합병하는 누적 블룸 필터를 생성합니다.
    for (let i = 0; i < NodeInjectorOffset.BLOOM_SIZE; i++) {
      lView[injectorIndex + i] = parentLView[parentIndex + i] | parentData[parentIndex + i];
    }
  }

  lView[injectorIndex + NodeInjectorOffset.PARENT] = parentLoc;
  return injectorIndex;
}

function insertBloom(arr: any[], footer: TNode | null): void {
  arr.push(0, 0, 0, 0, 0, 0, 0, 0, footer);
}

export function getInjectorIndex(tNode: TNode, lView: LView): number {
  if (
    tNode.injectorIndex === -1 ||
    // 인젝터 인덱스가 부모의 인젝터 인덱스와 동일하면, 해당 인덱스는 부모 노드로부터
    // 복사된 것입니다. 이 노드에는 인젝터가 아직 생성되지 않았습니다.
    (tNode.parent && tNode.parent.injectorIndex === tNode.injectorIndex) ||
    // 첫 번째 템플릿 패스 이후에 인젝터 인덱스가 존재할 수 있지만, 부모 값이
    // 이 인스턴스에 대해 아직 계산되지 않았을 수 있습니다.
    lView[tNode.injectorIndex + NodeInjectorOffset.PARENT] === null
  ) {
    return -1;
  } else {
    ngDevMode && assertIndexInRange(lView, tNode.injectorIndex);
    return tNode.injectorIndex;
  }
}

/**
 * 부모 인젝터의 인덱스를 찾습니다. 적용 가능한 경우 뷰 오프셋 포함. 부모 인젝터를
 * 처음에 설정하는 데 사용됩니다.
 *
 * @returns LView를 포함하는 부모 인젝터를 찾기 위해 올라가야 하는 LViews의 수와
 * 해당 LView 내 인젝터의 인덱스의 조합으로서의 숫자입니다.
 */
export function getParentInjectorLocation(tNode: TNode, lView: LView): RelativeInjectorLocation {
  if (tNode.parent && tNode.parent.injectorIndex !== -1) {
    // 부모 `TNode`가 있고 그와 연관된 인젝터가 있다면 현재 `LView` 내에 부모 인젝터가 있습니다.
    return tNode.parent.injectorIndex as RelativeInjectorLocation; // ViewOffset은 0입니다.
  }

  // 부모 인젝터의 위치가 계산될 때 현재 뷰 외부에 있을 수 있습니다. (즉, 선언된 부모 위치를
  // 가리킬 수 있습니다). 이 변수는 부모 인젝터 위치를 찾기 위해 올라가야 할 선언 부모의 수를
  // 저장합니다.
  let declarationViewOffset = 0;
  let parentTNode: TNode | null = null;
  let lViewCursor: LView | null = lView;

  // 부모 인젝터가 현재 `LView` 내에 없습니다. 선언된 부모 LView 계층을 따라가야 합니다.
  // 우리가 가장 위로 올라간다면, 그 의미는 부모 NodeInjector가 없다는 것입니다.
  while (lViewCursor !== null) {
    parentTNode = getTNodeFromLView(lViewCursor);

    if (parentTNode === null) {
      // 부모가 없다면, 우리는 종료됩니다.
      return NO_PARENT_INJECTOR;
    }

    ngDevMode && parentTNode && assertTNodeForLView(parentTNode!, lViewCursor[DECLARATION_VIEW]!);
    // 반복당시 선언된 부모로 가야 합니다.
    declarationViewOffset++;
    lViewCursor = lViewCursor[DECLARATION_VIEW];

    if (parentTNode.injectorIndex !== -1) {
      // NodeInjector가 발견되었습니다.
      return (parentTNode.injectorIndex |
        (declarationViewOffset <<
          RelativeInjectorLocationFlags.ViewOffsetShift)) as RelativeInjectorLocation;
    }
  }
  return NO_PARENT_INJECTOR;
}

/**
 * DI 시스템에 대한 유형 또는 주입 토큰을 공개하여 인젝터의 블룸 필터에 추가합니다.
 *
 * @param di 지시어가 추가될 노드 인젝터
 * @param token 공개될 유형 또는 주입 토큰
 */
export function diPublicInInjector(
  injectorIndex: number,
  tView: TView,
  token: ProviderToken<any>,
): void {
  bloomAdd(injectorIndex, tView, token);
}

/**
 * 정적 속성 값을 지시어 생성자에 주입합니다.
 *
 * 이 메소드는 `defineDirective` 또는 `defineComponent`의 일환으로 생성된 `factory`
 * 함수와 함께 사용됩니다. 이 메소드는 속성의 정적 값을 검색합니다. (동적 속성은 주입 시점에
 * 해결되지 않으며 시간이 지남에 따라 변경될 수 없으므로 지원되지 않습니다.)
 *
 * # 예
 * 주어진:
 * ```ts
 * @Component(...)
 * class MyComponent {
 *   constructor(@Attribute('title') title: string) { ... }
 * }
 * ```
 * 다음과 같이 인스턴스화될 때
 * ```html
 * <my-component title="Hello"></my-component>
 * ```
 *
 * 생성된 팩토리 메소드는 다음과 같습니다:
 * ```ts
 * MyComponent.ɵcmp = defineComponent({
 *   factory: () => new MyComponent(injectAttribute('title'))
 *   ...
 * })
 * ```
 *
 * @publicApi
 */
export function injectAttributeImpl(tNode: TNode, attrNameToInject: string): string | null {
  ngDevMode && assertTNodeType(tNode, TNodeType.AnyContainer | TNodeType.AnyRNode);
  ngDevMode && assertDefined(tNode, 'expecting tNode');
  if (attrNameToInject === 'class') {
    return tNode.classes;
  }
  if (attrNameToInject === 'style') {
    return tNode.styles;
  }

  const attrs = tNode.attrs;
  if (attrs) {
    const attrsLength = attrs.length;
    let i = 0;
    while (i < attrsLength) {
      const value = attrs[i];

      // `Bindings` 또는 `Template` 마커에 도달하면 우리는 종료됩니다.
      if (isNameOnlyAttributeMarker(value)) break;

      // 네임스페이스가 있는 속성은 건너뜁니다.
      if (value === AttributeMarker.NamespaceURI) {
        // 우리는 다음 두 값을 건너뜁니다.
        // 네임스페이스가 있는 속성은 다음과 같습니다:
        // [..., AttributeMarker.NamespaceURI, 'http://someuri.com/test', 'test:exist',
        // 'existValue', ...]
        i = i + 2;
      } else if (typeof value === 'number') {
        // 마커 속성의 첫 번째 값으로 건너뜁니다.
        i++;
        while (i < attrsLength && typeof attrs[i] === 'string') {
          i++;
        }
      } else if (value === attrNameToInject) {
        return attrs[i + 1] as string;
      } else {
        i = i + 2;
      }
    }
  }
  return null;
}

function notFoundValueOrThrow<T>(
  notFoundValue: T | null,
  token: ProviderToken<T>,
  flags: InternalInjectFlags,
): T | null {
  if (flags & InternalInjectFlags.Optional || notFoundValue !== undefined) {
    return notFoundValue;
  } else {
    throwProviderNotFoundError(token, 'NodeInjector');
  }
}

/**
 * 주어진 토큰과 관련된 값을 ModuleInjector에서 반환하거나 예외를 발생시킵니다.
 *
 * @param lView `tNode`를 포함하는 `LView`
 * @param token 찾을 토큰
 * @param flags 주입 플래그
 * @param notFoundValue 주입 플래그가 `InternalInjectFlags.Optional`일 때 반환할 값
 * @returns 인젝터의 값 또는 예외를 발생시킵니다.
 */
function lookupTokenUsingModuleInjector<T>(
  lView: LView,
  token: ProviderToken<T>,
  flags: InternalInjectFlags,
  notFoundValue?: any,
): T | null {
  if (flags & InternalInjectFlags.Optional && notFoundValue === undefined) {
    // 이것은 설정되어야 합니다. 그렇지 않으면 NullInjector가 선택적 deps에 대해 오류를 발생시킵니다.
    notFoundValue = null;
  }

  if ((flags & (InternalInjectFlags.Self | InternalInjectFlags.Host)) === 0) {
    const moduleInjector = lView[INJECTOR];
    // 모듈 인젝터를 위한 `injectInjectorOnly` 구현으로 전환합니다. 모듈 인젝터는
    // 컴포넌트/디렉티브 DI 범위에 접근할 수 없어야 합니다 (이는 `directiveInject` 구현을 통해 발생할 수 있습니다).
    const previousInjectImplementation = setInjectImplementation(undefined);
    try {
      if (moduleInjector) {
        return (moduleInjector as BackwardsCompatibleInjector).get(
          token,
          notFoundValue,
          flags & InternalInjectFlags.Optional,
        );
      } else {
        return injectRootLimpMode(token, notFoundValue, flags & InternalInjectFlags.Optional);
      }
    } finally {
      setInjectImplementation(previousInjectImplementation);
    }
  }
  return notFoundValueOrThrow<T>(notFoundValue, token, flags);
}

/**
 * NodeInjectors에서 ModuleInjector로 주어진 토큰과 관련된 값을 반환합니다.
 *
 * 노드 인젝터 트리를 올라가면서 토큰을 제공하는 인젝터를 찾습니다.
 *
 * 이 함수는 `__NG_ELEMENT_ID__`로 `token`에 패치합니다. 이는 블룸 필터의 ID를 포함합니다.
 * `-1`은 `Injector` 주입을 위해 예약되어 있습니다 (NodeInjector에 의해 구현됨).
 *
 * @param tNode 인젝터 검색이 시작될 노드
 * @param lView `tNode`를 포함하는 `LView`
 * @param token 찾을 토큰
 * @param flags 주입 플래그
 * @param notFoundValue 주입 플래그가 `InternalInjectFlags.Optional`일 때 반환할 값
 * @returns 인젝터에서의 값, 찾을 수 없을 때 `null`, 제공된 경우 `notFoundValue`
 */
export function getOrCreateInjectable<T>(
  tNode: TDirectiveHostNode | null,
  lView: LView,
  token: ProviderToken<T>,
  flags: InternalInjectFlags = InternalInjectFlags.Default,
  notFoundValue?: any,
): T | null {
  if (tNode !== null) {
    // 뷰나 그 조상 중 하나에 내장된 뷰 인젝터가 있다면
    // 먼저 거기에서 검색해야 합니다.
    if (
      lView[FLAGS] & LViewFlags.HasEmbeddedViewInjector &&
      // `Self` 플래그가 설정될 때, 현재 노드 인젝터에서 토큰이 존재해야 하므로
      // 내장 뷰 인젝터를건너뛰어야 합니다.
      !(flags & InternalInjectFlags.Self)
    ) {
      const embeddedInjectorValue = lookupTokenUsingEmbeddedInjector(
        tNode,
        lView,
        token,
        flags,
        NOT_FOUND,
      );
      if (embeddedInjectorValue !== NOT_FOUND) {
        return embeddedInjectorValue;
      }
    }

    // 그렇지 않으면 노드 인젝터를 시도합니다.
    const value = lookupTokenUsingNodeInjector(tNode, lView, token, flags, NOT_FOUND);
    if (value !== NOT_FOUND) {
      return value;
    }
  }

  // 마침내 모듈 인젝터로 되돌아갑니다.
  return lookupTokenUsingModuleInjector<T>(lView, token, flags, notFoundValue);
}

/**
 * 노드 인젝터에서 주어진 토큰과 관련된 값을 반환합니다.
 *
 * @param tNode 인젝터 검색이 시작될 노드
 * @param lView `tNode`를 포함하는 `LView`
 * @param token 찾을 토큰
 * @param flags 주입 플래그
 * @param notFoundValue 주입 플래그가 `InternalInjectFlags.Optional`일 때 반환할 값
 * @returns 인젝터의 값, 찾을 수 없을 때 `null`, 제공된 경우 `notFoundValue`
 */
function lookupTokenUsingNodeInjector<T>(
  tNode: TDirectiveHostNode,
  lView: LView,
  token: ProviderToken<T>,
  flags: InternalInjectFlags,
  notFoundValue?: any,
) {
  const bloomHash = bloomHashBitOrFactory(token);
  // 여기에 저장된 ID가 함수라면, 이는 ElementRef 또는 TemplateRef와 같은 특수 객체이므로
  // 공장 함수를 호출하여 생성해야 합니다.
  if (typeof bloomHash === 'function') {
    if (!enterDI(lView, tNode, flags)) {
      // DI에 진입하지 못했습니다. 대신 모듈 인젝터를 시도하세요. @Host 플래그가 붙은 토큰이 주입되면,
      // Ivy에서는 해당 토큰에 대한 모듈 인젝터를 검색하지 않습니다.
      return flags & InternalInjectFlags.Host
        ? notFoundValueOrThrow<T>(notFoundValue, token, flags)
        : lookupTokenUsingModuleInjector<T>(lView, token, flags, notFoundValue);
    }
    try {
      let value: unknown;

      if (ngDevMode) {
        runInInjectorProfilerContext(
          new NodeInjector(getCurrentTNode() as TElementNode, getLView()),
          token as Type<T>,
          () => {
            emitInjectorToCreateInstanceEvent(token);
            value = bloomHash(flags);
            emitInstanceCreatedByInjectorEvent(value);
          },
        );
      } else {
        value = bloomHash(flags);
      }

      if (value == null && !(flags & InternalInjectFlags.Optional)) {
        throwProviderNotFoundError(token);
      } else {
        return value;
      }
    } finally {
      leaveDI();
    }
  } else if (typeof bloomHash === 'number') {
    // 요소 인젝터 트리를 오르는 동안 발견된 이전 인젝터 TView에 대한 참조입니다.
    // 이는 현재 인젝터에서 viewProviders에 접근할 수 있는지 아는 데 사용됩니다.
    let previousTView: TView | null = null;
    let injectorIndex = getInjectorIndex(tNode, lView);
    let parentLocation = NO_PARENT_INJECTOR;
    let hostTElementNode: TNode | null =
      flags & InternalInjectFlags.Host ? lView[DECLARATION_COMPONENT_VIEW][T_HOST] : null;

    // 인젝터를 건너뛰거나 이 노드에 인젝터가 없다면 부모 인젝터를 검색하여 시작합니다.
    if (injectorIndex === -1 || flags & InternalInjectFlags.SkipSelf) {
      parentLocation =
        injectorIndex === -1
          ? getParentInjectorLocation(tNode, lView)
          : lView[injectorIndex + NodeInjectorOffset.PARENT];

      if (parentLocation === NO_PARENT_INJECTOR || !shouldSearchParent(flags, false)) {
        injectorIndex = -1;
      } else {
        previousTView = lView[TVIEW];
        injectorIndex = getParentInjectorIndex(parentLocation);
        lView = getParentInjectorView(parentLocation, lView);
      }
    }

    // 인젝터 트리를 따라 올라가면서 잠재적인 일치를 찾거나 일치하는 것이 없는지 확인합니다.
    while (injectorIndex !== -1) {
      ngDevMode && assertNodeInjector(lView, injectorIndex);

      // 현재 인젝터를 확인합니다. 만약 일치한다면, 토큰이 포함되어 있는지 확인합니다.
      const tView = lView[TVIEW];
      ngDevMode &&
        assertTNodeForLView(tView.data[injectorIndex + NodeInjectorOffset.TNODE] as TNode, lView);
      if (bloomHasToken(bloomHash, injectorIndex, tView.data)) {
        // 이 시점에서 토큰을 포함할 수 있는 인젝터를 가지므로, 인젝터의 해당 노드와 관련된
        // 프로바이더 및 지시어를 검색합니다.
        const instance: T | {} | null = searchTokensOnInjector<T>(
          injectorIndex,
          lView,
          token,
          previousTView,
          flags,
          hostTElementNode,
        );
        if (instance !== NOT_FOUND) {
          return instance;
        }
      }
      parentLocation = lView[injectorIndex + NodeInjectorOffset.PARENT];
      if (
        parentLocation !== NO_PARENT_INJECTOR &&
        shouldSearchParent(
          flags,
          lView[TVIEW].data[injectorIndex + NodeInjectorOffset.TNODE] === hostTElementNode,
        ) &&
        bloomHasToken(bloomHash, injectorIndex, lView)
      ) {
        // 이 노드에서 정의가 발견되지 않았으므로 잘못된 긍정입니다.
        // 트리를 오르면서 계속 검색합니다.
        previousTView = tView;
        injectorIndex = getParentInjectorIndex(parentLocation);
        lView = getParentInjectorView(parentLocation, lView);
      } else {
        // 부모를 검색하면 안 되거나 조상 블룸 필터 값이 지시어에 해당하는 비트를 가지지 않는 경우,
        // 특정 인젝터를 찾기 위해 상승하는 것을 포기할 수 있습니다.
        injectorIndex = -1;
      }
    }
  }

  return notFoundValue;
}

function searchTokensOnInjector<T>(
  injectorIndex: number,
  lView: LView,
  token: ProviderToken<T>,
  previousTView: TView | null,
  flags: InternalInjectFlags,
  hostTElementNode: TNode | null,
) {
  const currentTView = lView[TVIEW];
  const tNode = currentTView.data[injectorIndex + NodeInjectorOffset.TNODE] as TNode;
  // 먼저 시작 요소가 뷰 프로바이더에 접근할 수 있는지 결정해야 합니다.
  // 두 가지 가능성이 있습니다.
  const canAccessViewProviders =
    previousTView == null
      ? // 1) 첫 번째 호출 `previousTView == null`, 이는 인젝터가 토큰을 검색하기 시작한
        // `TNode`에 있는 경우입니다. 이 경우 뷰 프로바이더를 조회할 수 있는 유일한 경우는:
        // - 우리는 컴포넌트에 있으며
        // - 인젝터가 `includeViewProviders`를 true로 설정합니다. (이는 토큰이 컴포넌트이거나
        // 필요한 경우 뷰 프로바이더 내에서 선언된 서비스라는 것을 의미합니다.)
        isComponentHost(tNode) && includeViewProviders
      : // 2) `previousTView != null`, 즉 우리는 부모 노드를 가로지고 있습니다.
        // 이 경우, 뷰 프로바이더를 조회할 수 있는 경우는:
        // - 컴포넌트의 뷰에 있으며 `previousTView != currentTView`일 경우
        // - 그리고 부모 TNode가 요소입니다.
        // 즉, 우리는 컴포넌트의 뷰에서 나갔고 따라서 뷰 프로바이더를 볼 수 있습니다.
        previousTView != currentTView && (tNode.type & TNodeType.AnyRNode) !== 0;

  // 이 특별한 경우는 @host가 주입되고 우리가 호스트 요소 노드에서 검색할 때 발생합니다.
  const isHostSpecialCase = flags & InternalInjectFlags.Host && hostTElementNode === tNode;

  const injectableIdx = locateDirectiveOrProvider(
    tNode,
    currentTView,
    token,
    canAccessViewProviders,
    isHostSpecialCase,
  );
  if (injectableIdx !== null) {
    return getNodeInjectable(lView, currentTView, injectableIdx, tNode as TElementNode);
  } else {
    return NOT_FOUND;
  }
}

/**
 * 노드의 지시어 및 프로바이더 중에서 주어진 토큰을 검색합니다.
 *
 * @param tNode 지시어가 있는 TNode
 * @param tView 현재 처리 중인 tView
 * @param token 찾을 프로바이더 토큰 또는 지시어 유형
 * @param canAccessViewProviders 뷰 프로바이더를 고려해야 하는지 여부
 * @param isHostSpecialCase 호스트 특별 케이스 여부
 * @returns 발견된 지시어 또는 프로바이더의 인덱스, 없으면 null
 */
export function locateDirectiveOrProvider<T>(
  tNode: TNode,
  tView: TView,
  token: ProviderToken<T> | string,
  canAccessViewProviders: boolean,
  isHostSpecialCase: boolean | number,
): number | null {
  const nodeProviderIndexes = tNode.providerIndexes;
  const tInjectables = tView.data;

  const injectablesStart = nodeProviderIndexes & TNodeProviderIndexes.ProvidersStartIndexMask;
  const directivesStart = tNode.directiveStart;
  const directiveEnd = tNode.directiveEnd;
  const cptViewProvidersCount =
    nodeProviderIndexes >> TNodeProviderIndexes.CptViewProvidersCountShift;
  const startingIndex = canAccessViewProviders
    ? injectablesStart
    : injectablesStart + cptViewProvidersCount;
  // 호스트 특별 케이스가 적용되면, 뷰 프로바이더와 컴포넌트만 볼 수 있습니다.
  const endIndex = isHostSpecialCase ? injectablesStart + cptViewProvidersCount : directiveEnd;
  for (let i = startingIndex; i < endIndex; i++) {
    const providerTokenOrDef = tInjectables[i] as ProviderToken<any> | DirectiveDef<any> | string;
    if (
      (i < directivesStart && token === providerTokenOrDef) ||
      (i >= directivesStart && (providerTokenOrDef as DirectiveDef<any>).type === token)
    ) {
      return i;
    }
  }
  if (isHostSpecialCase) {
    const dirDef = tInjectables[directivesStart] as DirectiveDef<any>;
    if (dirDef && isComponentDef(dirDef) && dirDef.type === token) {
      return directivesStart;
    }
  }
  return null;
}

/**
 * 특정 `index`에서 `LView`로부터 주입 가능한 값을 검색하거나 인스턴스화합니다.
 *
 * 이 함수는 값이 이미 인스턴스화되었는지 확인하고, 그렇다면 캐시된 `injectable`을 반환합니다.
 * 그렇지 않으면 값이 여전히 공장인 경우 `injectable`을 인스턴스화하고 값을 캐시합니다.
 */
export function getNodeInjectable(
  lView: LView,
  tView: TView,
  index: number,
  tNode: TDirectiveHostNode,
): any {
  let value = lView[index];
  const tData = tView.data;
  if (value instanceof NodeInjectorFactory) {
    const factory: NodeInjectorFactory = value;
    if (factory.resolving) {
      throwCyclicDependencyError(stringifyForError(tData[index]));
    }
    const previousIncludeViewProviders = setIncludeViewProviders(factory.canSeeViewProviders);
    factory.resolving = true;

    // tData 인덱스는 해당 LView에서의 구체적인 인스턴스를 반영합니다.
    // lView[index]는 주입 가능한 인스턴스 자체 또는 공장일 수 있으므로,
    // 따라서 tData[index]는 해당 주입 가능한 항목의 구성자 또는 정의 객체가
    // `.type` 필드에 포함되어 있습니다.
    const token =
      (tData[index] as DirectiveDef<unknown> | ComponentDef<unknown>).type || tData[index];

    let prevInjectContext: InjectorProfilerContext | undefined;
    if (ngDevMode) {
      const injector = new NodeInjector(tNode, lView);
      prevInjectContext = setInjectorProfilerContext({injector, token});
    }

    const previousInjectImplementation = factory.injectImpl
      ? setInjectImplementation(factory.injectImpl)
      : null;
    const success = enterDI(lView, tNode, InternalInjectFlags.Default);
    ngDevMode &&
      assertEqual(
        success,
        true,
        "플래그에 `SkipSelf'가 포함되어 있지 않으므로 항상 성공할 것으로 예상합니다.",
      );
    try {
      ngDevMode && emitInjectorToCreateInstanceEvent(token);

      value = lView[index] = factory.factory(undefined, tData, lView, tNode);

      ngDevMode && emitInstanceCreatedByInjectorEvent(value);

      // 이 코드 경로는 지시어와 프로바이더 모두에 적용됩니다.
      // 성능상의 이유로, 프로바이더의 훅을 검색하는 것을 피하려고 합니다.
      // 해가 되지 않도록 시도하지만 (훅은 존재하지 않을 것입니다), 추가 확인은 필요 없으며
      // 이는 중요한 경로임을 고려해야 합니다. 따라서 종속성의 인덱스가 이
      // tNode에 대한 지시어 범위에 있는지 확인합니다. 그렇지 않으면, 이는 프로바이더임을 알고
      // 훅 등록을 건너뛰게 됩니다.
      if (tView.firstCreatePass && index >= tNode.directiveStart) {
        ngDevMode && assertDirectiveDef(tData[index]);
        registerPreOrderHooks(index, tData[index] as DirectiveDef<any>, tView);
      }
    } finally {
      ngDevMode && setInjectorProfilerContext(prevInjectContext!);

      previousInjectImplementation !== null &&
        setInjectImplementation(previousInjectImplementation);
      setIncludeViewProviders(previousIncludeViewProviders);
      factory.resolving = false;
      leaveDI();
    }
  }
  return value;
}

/**
 * 인젝터의 블룸 필터에서 토큰이 인젝터가 이 지시어를 제공할 수 있는지를 결정하기 위해
 * 사용해야 하는 비트를 반환합니다.
 *
 * 지시어가 공개되면, 블룸 필터에 추가되고 고유 ID를 부여받아 Type에서 검색할 수 있습니다.
 * 지시어가 공개되지 않거나 토큰이 지시어가 아닌 경우 `null`이 반환됩니다.
 *
 * @param token 주입 토큰
 * @returns 블룸 필터에서 확인할 일치하는 비트 또는 알려지지 않은 토큰인 경우 `null`.
 *   반환된 값이 음수이면, 이는 `Injector`와 같은 특수 값을 나타냅니다.
 */
export function bloomHashBitOrFactory(
  token: ProviderToken<any> | string,
): number | Function | undefined {
  ngDevMode && assertDefined(token, 'token must be defined');
  if (typeof token === 'string') {
    return token.charCodeAt(0) || 0;
  }
  const tokenId: number | undefined =
    // 상속된 ID를 가져오지 않기 위해 `hasOwnProperty`로 먼저 확인합니다.
    token.hasOwnProperty(NG_ELEMENT_ID) ? (token as any)[NG_ELEMENT_ID] : undefined;
  // 음수 토큰 ID는 `Injector`와 같은 특수 객체에 사용됩니다.
  if (typeof tokenId === 'number') {
    if (tokenId >= 0) {
      return tokenId & BLOOM_MASK;
    } else {
      ngDevMode &&
        assertEqual(tokenId, InjectorMarkers.Injector, 'Expecting to get Special Injector Id');
      return createNodeInjector;
    }
  } else {
    return tokenId;
  }
}

export function bloomHasToken(
  bloomHash: number,
  injectorIndex: number,
  injectorView: LView | TData,
) {
  // 지시어와 관련된 특정 비트를 대상으로 하는 마스크를 생성합니다.
  // JS 비트 연산은 32비트이므로, 이는 2^0에서 2^31까지의 숫자가 되며,
  // 32비트 정수에서 비트 위치 0 - 31에 해당합니다.
  const mask = 1 << bloomHash;

  // `injectorView`의 각 블룸 버킷은 `bloomHash`의 `BLOOM_BUCKET_BITS` 수의 비트를 나타냅니다.
  // `BLOOM_BUCKET_BITS`를 초과하는 `bloomHash`의 비트는 사용되어야 할 버킷 오프셋을 나타냅니다.
  const value = injectorView[injectorIndex + (bloomHash >> BLOOM_BUCKET_BITS)];

  // 블룸 필터 값이 지시어의 bloomBit에 해당하는 비트를 포함하고 있으면,
  // 이 인젝터는 잠재적인 일치입니다.
  return !!(value & mask);
}

/** 플래그가 토큰을 위한 부모 인젝터 검색을 방지할 경우 true를 반환합니다 */
function shouldSearchParent(
  flags: InternalInjectFlags,
  isFirstHostTNode: boolean,
): boolean | number {
  return (
    !(flags & InternalInjectFlags.Self) && !(flags & InternalInjectFlags.Host && isFirstHostTNode)
  );
}

export function getNodeInjectorLView(nodeInjector: NodeInjector): LView {
  return (nodeInjector as any)._lView as LView;
}

export function getNodeInjectorTNode(
  nodeInjector: NodeInjector,
): TElementNode | TContainerNode | TElementContainerNode | null {
  return (nodeInjector as any)._tNode as
    | TElementNode
    | TContainerNode
    | TElementContainerNode
    | null;
}

export class NodeInjector implements Injector {
  constructor(
    private _tNode: TElementNode | TContainerNode | TElementContainerNode | null,
    private _lView: LView,
  ) {}

  get(token: any, notFoundValue?: any, flags?: InternalInjectFlags | InjectOptions): any {
    return getOrCreateInjectable(
      this._tNode,
      this._lView,
      token,
      convertToBitFlags(flags),
      notFoundValue,
    );
  }
}

/** 현재 노드에 대한 `NodeInjector`를 생성합니다. */
export function createNodeInjector(): Injector {
  return new NodeInjector(getCurrentTNode()! as TDirectiveHostNode, getLView()) as any;
}

/**
 * @codeGenApi
 */
export function ɵɵgetInheritedFactory<T>(type: Type<any>): (type: Type<T>) => T {
  return noSideEffects(() => {
    const ownConstructor = type.prototype.constructor;
    const ownFactory = ownConstructor[NG_FACTORY_DEF] || getFactoryOf(ownConstructor);
    const objectPrototype = Object.prototype;
    let parent = Object.getPrototypeOf(type.prototype).constructor;

    // `Object`에 도달할 때까지 프로토타입을 위로 이동합니다.
    while (parent && parent !== objectPrototype) {
      const factory = parent[NG_FACTORY_DEF] || getFactoryOf(parent);

      // 공장이 있는 것을 발견하고 그 공장이 유형과 같지 않으면,
      // 상속된 공장을 찾았습니다. 공장이 유형의 고유한 공장이 아니라는 확인은
      // 대부분의 경우 불필요하지만 사용자가 클래스에서 사용자 정의 데코레이터가 있으면,
      // 이 조회는 프로토타입 체인에서 한 수준 아래에서 시작하여 우연히
      // 자신의 공장을 최초로 발견하고 잠재적으로 하류에서 무한 루프를 트리거할 수 있습니다.
      if (factory && factory !== ownFactory) {
        return factory;
      }

      parent = Object.getPrototypeOf(parent);
    }

    // 정의된 공장이 없습니다. 이는 상속이 부적절하게 사용되었거나
    // (슈퍼클래스에 Angular 데코레이터가 없음) 상속 체인에 구성자가 전혀 없는 경우입니다.
    // 두 경우를 구분할 수 없으므로 후자가 가정되어야 합니다.
    return (t: Type<T>) => new t();
  });
}

function getFactoryOf<T>(type: Type<any>): ((type?: Type<T>) => T | null) | null {
  if (isForwardRef(type)) {
    return () => {
      const factory = getFactoryOf<T>(resolveForwardRef(type));
      return factory && factory();
    };
  }
  return getFactoryDef<T>(type);
}

/**
 * 가장 가까운 내장 인젝터 또는 노드 인젝터에서 값을 반환합니다.
 *
 * @param tNode 인젝터 검색이 시작될 노드
 * @param lView `tNode`를 포함하는 `LView`
 * @param token 찾을 토큰
 * @param flags 주입 플래그
 * @param notFoundValue 주입 플래그가 `InternalInjectFlags.Optional`일 때 반환할 값
 * @returns 인젝터에서의 값, 찾을 수 없을 때 `null`, 제공된 경우 `notFoundValue`
 */
function lookupTokenUsingEmbeddedInjector<T>(
  tNode: TDirectiveHostNode,
  lView: LView,
  token: ProviderToken<T>,
  flags: InternalInjectFlags,
  notFoundValue?: any,
) {
  let currentTNode: TDirectiveHostNode | null = tNode;
  let currentLView: LView | null = lView;

  // 내장 뷰 인젝터가 삽입될 때, 노드에 인젝터가 있을 가능성이 높습니다.
  // 노드 인젝터 -> 내장 뷰 인젝터 -> 노드 인젝터 순서로 있을 수 있습니다.
  // 노드 인젝터의 블룸 필터가 이미 구성되었고 인젝터의 기록을 추출할 방법이 없으므로,
  // 각 레벨에서 값을 확인하려면 노드 단위로 아래로 내려가야 합니다.
  while (
    currentTNode !== null &&
    currentLView !== null &&
    currentLView[FLAGS] & LViewFlags.HasEmbeddedViewInjector &&
    !isRootView(currentLView)
  ) {
    ngDevMode && assertTNodeForLView(currentTNode, currentLView);

    // 노드 인젝터에서 이 조회는 `Self` 플래그를 사용하고 있습니다, 왜냐하면
    // 노드 인젝터가 부모 인젝터를 참조하지 않아야 하므로, 먼저 내장 뷰 인젝터에
    // 도달할 수 있기 때문입니다.
    const nodeInjectorValue = lookupTokenUsingNodeInjector(
      currentTNode,
      currentLView,
      token,
      flags | InternalInjectFlags.Self,
      NOT_FOUND,
    );
    if (nodeInjectorValue !== NOT_FOUND) {
      return nodeInjectorValue;
    }

    // TS 버그로 인한 명시적 유형: https://github.com/microsoft/TypeScript/issues/33191
    let parentTNode: TElementNode | TContainerNode | null = currentTNode.parent;

    // `TNode.parent`는 현재 뷰 내의 부모를 포함합니다. 존재하지 않으면,
    // 뷰 경계를 만났음을 의미하며 다음 뷰로 올라가야 합니다.
    if (!parentTNode) {
      // 다음 LView로 이동하기 전에 현재 내장 인젝터에서의 토큰이 존재하는지 확인합니다.
      const embeddedViewInjector = currentLView[EMBEDDED_VIEW_INJECTOR];
      if (embeddedViewInjector) {
        const embeddedViewInjectorValue = (embeddedViewInjector as BackwardsCompatibleInjector).get(
          token,
          NOT_FOUND as T | {},
          flags,
        );
        if (embeddedViewInjectorValue !== NOT_FOUND) {
          return embeddedViewInjectorValue;
        }
      }

      // 그렇지 않으면, 트리를 계속 올라갑니다.
      parentTNode = getTNodeFromLView(currentLView);
      currentLView = currentLView[DECLARATION_VIEW];
    }

    currentTNode = parentTNode;
  }

  return notFoundValue;
}

/** 선언된 뷰 내에서 LView와 관련된 TNode를 가져옵니다. */
function getTNodeFromLView(lView: LView): TElementNode | TElementContainerNode | null {
  const tView = lView[TVIEW];
  const tViewType = tView.type;

  // 부모 포인터는 `TView.type`에 따라 다릅니다.
  if (tViewType === TViewType.Embedded) {
    ngDevMode && assertDefined(tView.declTNode, 'Embedded TNodes should have declaration parents.');
    return tView.declTNode as TElementContainerNode;
  } else if (tViewType === TViewType.Component) {
    // 컴포넌트는 `TView.declTNode`가 없으므로,
    // 각 컴포넌트 인스턴스가 서로 다른 위치에 삽입될 수 있습니다.
    return lView[T_HOST] as TElementNode;
  }

  return null;
}
