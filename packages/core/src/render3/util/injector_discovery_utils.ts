/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ENVIRONMENT_INITIALIZER} from '../../di/initializer_token';
import {InjectionToken} from '../../di/injection_token';
import {Injector} from '../../di/injector';
import {getInjectorDef, InjectorType} from '../../di/interface/defs';
import {InternalInjectFlags} from '../../di/interface/injector';
import {ValueProvider} from '../../di/interface/provider';
import {INJECTOR_DEF_TYPES} from '../../di/internal_tokens';
import {NullInjector} from '../../di/null_injector';
import {SingleProvider, walkProviderTree} from '../../di/provider_collection';
import {EnvironmentInjector, R3Injector} from '../../di/r3_injector';
import {Type} from '../../interface/type';
import {NgModuleRef as viewEngine_NgModuleRef} from '../../linker/ng_module_factory';
import {deepForEach} from '../../util/array_utils';
import {throwError} from '../../util/assert';
import {assertTNode, assertTNodeForLView} from '../assert';
import {ChainedInjector} from '../chained_injector';
import {getFrameworkDIDebugData} from '../debug/framework_injector_profiler';
import {InjectedService, ProviderRecord} from '../debug/injector_profiler';
import {getComponentDef} from '../def_getters';
import {
  getNodeInjectorLView,
  getNodeInjectorTNode,
  getParentInjectorLocation,
  NodeInjector,
} from '../di';
import {NodeInjectorOffset} from '../interfaces/injector';
import {TContainerNode, TElementContainerNode, TElementNode, TNode} from '../interfaces/node';
import {RElement} from '../interfaces/renderer_dom';
import {INJECTOR, LView, TVIEW} from '../interfaces/view';

import {
  getParentInjectorIndex,
  getParentInjectorView,
  hasParentInjector,
  isRouterOutletInjector,
} from './injector_utils';
import {getNativeByTNode} from './view_utils';

/**
 * 주입 가능한 인스턴스의 의존성을 발견합니다. 주입 가능한 인스턴스가 생성된 각 의존성
 * 에 대한 DI 정보를 제공합니다. 이 정보에는 제공된 출처가 포함됩니다.
 *
 * @param injector 주입기 인스턴스
 * @param token 주어진 주입기 인스턴스에 의해 생성된 DI 토큰
 * @returns 생성된 인스턴스와 함께 인스턴스화된 모든 의존성을 포함하는 객체
 *  또는 주어진 주입기 내에서 토큰이 생성되지 않은 경우 undefined.
 */
export function getDependenciesFromInjectable<T>(
  injector: Injector,
  token: Type<T> | InjectionToken<T>,
): {instance: T; dependencies: Omit<InjectedService, 'injectedIn'>[]} | undefined {
  // 먼저 주어진 토큰이 주어진 주입기에서 실제 인스턴스에 매핑되는지 확인합니다.
  // `self: true`를 사용하여 주어진 주입기만 확인하고자 합니다.
  // `optional: true`를 사용하여 주어진 토큰이 주어진 주입기에 의해 생성되지 않았을 가능성이
  // 있기 때문입니다.
  const instance = injector.get(token, null, {self: true, optional: true});
  if (instance === null) {
    throw new Error(`주어진 주입기에서 ${token}의 인스턴스를 결정할 수 없습니다.`);
  }

  const unformattedDependencies = getDependenciesForTokenInInjector(token, injector);
  const resolutionPath = getInjectorResolutionPath(injector);

  const dependencies = unformattedDependencies.map((dep) => {
    // injectedIn은 비공식 필드를 포함하므로 응답에서 생략합니다.
    const formattedDependency: Omit<InjectedService, 'injectedIn'> = {
      value: dep.value,
    };

    // 주입 플래그를 부울로 변환
    const flags = dep.flags as InternalInjectFlags;
    formattedDependency.flags = {
      optional: (InternalInjectFlags.Optional & flags) === InternalInjectFlags.Optional,
      host: (InternalInjectFlags.Host & flags) === InternalInjectFlags.Host,
      self: (InternalInjectFlags.Self & flags) === InternalInjectFlags.Self,
      skipSelf: (InternalInjectFlags.SkipSelf & flags) === InternalInjectFlags.SkipSelf,
    };

    // 의존성을 제공한 주입기를 찾습니다.
    for (let i = 0; i < resolutionPath.length; i++) {
      const injectorToCheck = resolutionPath[i];

      // skipSelf가 true인 경우 첫 번째 주입기를 건너뜁니다.
      if (i === 0 && formattedDependency.flags.skipSelf) {
        continue;
      }

      // host는 NodeInjectors에만 적용됩니다.
      if (formattedDependency.flags.host && injectorToCheck instanceof EnvironmentInjector) {
        break;
      }

      const instance = injectorToCheck.get(dep.token as Type<unknown>, null, {
        self: true,
        optional: true,
      });

      if (instance !== null) {
        // host 플래그가 true인 경우 첫 번째 요소에서 서비스를 가져올 수 있는지 두 번 확인합니다.
        // 해결 경로의 첫 번째 요소를 사용하여. 이는 적절한 제공 주입기를 찾았는지 확인하기 위한 것입니다.
        // 우리 경로와 연결된 노드 주입기가 아닙니다.
        if (formattedDependency.flags.host) {
          const firstInjector = resolutionPath[0];
          const lookupFromFirstInjector = firstInjector.get(dep.token as Type<unknown>, null, {
            ...formattedDependency.flags,
            optional: true,
          });

          if (lookupFromFirstInjector !== null) {
            formattedDependency.providedIn = injectorToCheck;
          }

          break;
        }

        formattedDependency.providedIn = injectorToCheck;
        break;
      }

      // self가 true인 경우 첫 번째 주입기 후에 중단합니다.
      if (i === 0 && formattedDependency.flags.self) {
        break;
      }
    }

    if (dep.token) formattedDependency.token = dep.token;

    return formattedDependency;
  });

  return {instance, dependencies};
}

function getDependenciesForTokenInInjector<T>(
  token: Type<T> | InjectionToken<T>,
  injector: Injector,
): InjectedService[] {
  const {resolverToTokenToDependencies} = getFrameworkDIDebugData();

  if (!(injector instanceof NodeInjector)) {
    return resolverToTokenToDependencies.get(injector)?.get?.(token as Type<T>) ?? [];
  }

  const lView = getNodeInjectorLView(injector);
  const tokenDependencyMap = resolverToTokenToDependencies.get(lView);
  const dependencies = tokenDependencyMap?.get(token as Type<T>) ?? [];

  // NodeInjector의 경우 모든 노드에 대한 모든 주입이 동일한 lView에 저장됩니다.
  // 여기서 주입된 필드를 사용하여 현재 보고 있는 인스턴스와 동일한 노드에서
  // 유래하지 않는 의존성을 필터링합니다.
  return dependencies.filter((dependency) => {
    const dependencyNode = dependency.injectedIn?.tNode;
    if (dependencyNode === undefined) {
      return false;
    }

    const instanceNode = getNodeInjectorTNode(injector);
    assertTNode(dependencyNode);
    assertTNode(instanceNode!);

    return dependencyNode === instanceNode;
  });
}

/**
 * 공급자가 `imports` 배열을 포함하는 주입기와 연결된 클래스를 가져옵니다.
 *
 * 모듈 주입기의 경우 NgModule 생성자를 반환합니다.
 *
 * 독립형 주입기의 경우 독립형 구성 요소 생성자를 반환합니다.
 *
 * @param injector 주입기 인스턴스
 * @returns 이 주입기를 구성하는 `imports` 배열이 위치한 생성자
 */
function getProviderImportsContainer(injector: Injector): Type<unknown> | null {
  const {standaloneInjectorToComponent} = getFrameworkDIDebugData();

  // 독립형 구성 요소는 구성 요소 정의를 통해 공급자를 구성하므로,
  // 이 주입기가 독립형 구성 요소의 EnvironmentInjector를 나타내는 경우
  // 연결된 독립형 구성 요소를 사용해야 합니다.
  if (standaloneInjectorToComponent.has(injector)) {
    return standaloneInjectorToComponent.get(injector)!;
  }

  // 모듈 주입기는 NgModule 정의를 통해 공급자를 구성하므로,
  // 주입기를 사용하여 NgModuleRef를 찾아 이를 통해 인스턴스를 가져옵니다.
  const defTypeRef = injector.get(viewEngine_NgModuleRef, null, {self: true, optional: true})!;

  // 관련된 imports 컨테이너를 찾을 수 없는 경우 null을 반환합니다.
  // 이는 이 함수가 독립형 구성 요소나 NgModule을 나타내지 않는 R3Injector로 호출될 경우 발생할 수 있습니다.
  if (defTypeRef === null) {
    return null;
  }

  // 독립형 응용 프로그램에서 bootstrapApplication에 의해 생성된 루트 환경 주입기는
  // 관련된 "인스턴스"가 없을 수 있습니다.
  if (defTypeRef.instance === null) {
    return null;
  }

  return defTypeRef.instance.constructor;
}

/**
 * NodeInjector에서 구성된 공급자를 가져옵니다.
 *
 * @param injector NodeInjector 인스턴스
 * @returns ProviderRecord[] 이 주입기에서 구성된 공급자를 나타내는 객체 배열
 */
function getNodeInjectorProviders(injector: NodeInjector): ProviderRecord[] {
  const diResolver = getNodeInjectorTNode(injector);
  const {resolverToProviders} = getFrameworkDIDebugData();
  return resolverToProviders.get(diResolver as TNode) ?? [];
}

/**
 * 주입기에 구성된 공급자의 경로를 가져옵니다.
 *
 * ModuleA -> imports ModuleB
 * ModuleB -> imports ModuleC
 * ModuleB -> provides MyServiceA
 * ModuleC -> provides MyServiceB
 *
 * getProviderImportPaths(ModuleA)
 * > Map(2) {
 *   MyServiceA => [ModuleA, ModuleB]
 *   MyServiceB => [ModuleA, ModuleB, ModuleC]
 * }
 *
 * @param providerImportsContainer `imports` 배열을 포함하는 정의의 클래스 생성자
 * @returns 공급자를 해당 수입 경로를 나타내는 생성자 배열에 매핑하는 Map 객체
 */
function getProviderImportPaths(
  providerImportsContainer: Type<unknown>,
): Map<SingleProvider, (Type<unknown> | InjectorType<unknown>)[]> {
  const providerToPath = new Map<SingleProvider, (Type<unknown> | InjectorType<unknown>)[]>();
  const visitedContainers = new Set<Type<unknown>>();
  const visitor = walkProviderTreeToDiscoverImportPaths(providerToPath, visitedContainers);

  walkProviderTree(providerImportsContainer, visitor, [], new Set());

  return providerToPath;
}

/**
 *
 * WalkProviderTree에 대한 방문자를 반환하는 고차 함수
 *
 * 방문한 공급자 및 컨테이너를 추적하는 맵과 세트를 받아서
 * 이러한 공급자의 수입 경로를 발견합니다.
 *
 * 이 방문자는 walkProviderTree가 제공한 컨테이너에 대한 공급자 트리를 후위 순회
 * 수행한다는 사실을 활용합니다. 후위 순회는 리프 노드에서
 * 서브트리를 재귀적으로 처리한 후 루트에 도달하는 방식입니다.
 * 따라서 공급자 수입 경로를 역순으로 구성하는 방문자를 작성합니다.
 *
 * 외부에서 정의된 visitedContainers 세트를 사용하여
 * 각 트리에서 컨테이너에 대해 로직을 한 번만 실행하도록 합니다.
 * 이 로직은 다음과 같이 설명할 수 있습니다:
 *
 * 1. 이미 발견된 공급자와 incompletely discovered_path를 위해
 * 2. 발견된 경로에서 첫 번째 컨테이너를 얻습니다.
 * 3. 해당 첫 번째 컨테이너가 현재 방문하는 컨테이너의 imports 배열에 있는 경우
 *    현재 방문하는 컨테이너도 발견된 공급자의 수입 경로에 있으므로,
 *    현재 방문하는 컨테이너를 discovered_path의 앞에 추가합니다.
 *
 * 예시 실행:
 * ```
 *                 ┌──────────┐
 *                 │containerA│
 *      ┌─imports-─┤          ├──imports─┐
 *      │          │  provA   │          │
 *      │          │  provB   │          │
 *      │          └──────────┘          │
 *      │                                │
 *     ┌▼─────────┐             ┌────────▼─┐
 *     │containerB│             │containerC│
 *     │          │             │          │
 *     │  provD   │             │  provF   │
 *     │  provE   │             │  provG   │
 *     └──────────┘             └──────────┘
 * ```
 *
 * 트리 순회의 각 단계:
 *
 * ```
 * visitor(provD, containerB)
 * providerToPath === Map { provD => [containerB] }
 * visitedContainers === Set { containerB }
 *
 * visitor(provE, containerB)
 * providerToPath === Map { provD => [containerB], provE => [containerB] }
 * visitedContainers === Set { containerB }
 *
 * visitor(provF, containerC)
 * providerToPath === Map { provD => [containerB], provE => [containerB], provF => [containerC] }
 * visitedContainers === Set { containerB, containerC }
 *
 * visitor(provG, containerC)
 * providerToPath === Map {
 *   provD => [containerB], provE => [containerB], provF => [containerC], provG => [containerC]
 * }
 * visitedContainers === Set { containerB, containerC }
 *
 * visitor(provA, containerA)
 * providerToPath === Map {
 *   provD => [containerA, containerB],
 *   provE => [containerA, containerB],
 *   provF => [containerA, containerC],
 *   provG => [containerA, containerC],
 *   provA => [containerA]
 * }
 * visitedContainers === Set { containerB, containerC, containerA }
 *
 * visitor(provB, containerA)
 * providerToPath === Map {
 *   provD => [containerA, containerB],
 *   provE => [containerA, containerB],
 *   provF => [containerA, containerC],
 *   provG => [containerA, containerC],
 *   provA => [containerA]
 *   provB => [containerA]
 * }
 * visitedContainers === Set { containerB, containerC, containerA }
 * ```
 *
 * @param providerToPath Map 이 기능이 채우는 공급자에 대한 경로
 * @param visitedContainers Set 방문할 컨테이너를 추적하는 세트
 * @return function(provider SingleProvider, container: Type<unknown> | InjectorType<unknown>) =>
 *     void
 */
function walkProviderTreeToDiscoverImportPaths(
  providerToPath: Map<SingleProvider, (Type<unknown> | InjectorType<unknown>)[]>,
  visitedContainers: Set<Type<unknown>>,
): (provider: SingleProvider, container: Type<unknown> | InjectorType<unknown>) => void {
  return (provider: SingleProvider, container: Type<unknown> | InjectorType<unknown>) => {
    // providerToPath 맵에 공급자가 없다면,
    // 공급자를 키로, 현재 컨테이너를 포함한 배열을 값으로 추가합니다.
    if (!providerToPath.has(provider)) {
      providerToPath.set(provider, [container]);
    }

    // 이 블록은 import 트리의 각 컨테이너에 대해 한 번만 실행됩니다.
    // 이는 현재 발견된 공급자의 경로에 대한 다음 컨테이너를
    // 체크하기 위해 현재 컨테이너의 imports 배열을 확인하는 로직을 실행합니다.
    if (!visitedContainers.has(container)) {
      // 이미 확인한 공급자를 반복합니다.
      for (const prov of providerToPath.keys()) {
        const existingImportPath = providerToPath.get(prov)!;

        let containerDef = getInjectorDef(container);
        if (!containerDef) {
          const ngModule: Type<unknown> | undefined = (container as any).ngModule as
            | Type<unknown>
            | undefined;
          containerDef = getInjectorDef(ngModule);
        }

        if (!containerDef) {
          return;
        }

        const lastContainerAddedToPath = existingImportPath[0];

        let isNextStepInPath = false;
        deepForEach(containerDef.imports, (moduleImport) => {
          if (isNextStepInPath) {
            return;
          }

          isNextStepInPath =
            (moduleImport as any).ngModule === lastContainerAddedToPath ||
            moduleImport === lastContainerAddedToPath;

          if (isNextStepInPath) {
            providerToPath.get(prov)?.unshift(container);
          }
        });
      }
    }

    visitedContainers.add(container);
  };
}

/**
 * EnvironmentInjector에서 구성된 공급자를 가져옵니다.
 *
 * @param injector EnvironmentInjector
 * @returns 주어진 주입기의 공급자를 나타내는 객체 배열
 */
function getEnvironmentInjectorProviders(injector: EnvironmentInjector): ProviderRecord[] {
  const providerRecordsWithoutImportPaths =
    getFrameworkDIDebugData().resolverToProviders.get(injector) ?? [];

  // 플랫폼 주입기는 공급자 임포트 컨테이너가 없으므로
  // 임포트 경로를 찾으려는 것을 건너뛸 수 있습니다.
  if (isPlatformInjector(injector)) {
    return providerRecordsWithoutImportPaths;
  }

  const providerImportsContainer = getProviderImportsContainer(injector);
  if (providerImportsContainer === null) {
    // 환경 주입기가 관련 공급자 임포트 컨테이너 없이 존재한다면
    // 그러한 컨테이너 없이 생성되었다고 가정합니다. 몇 가지 예시:
    // - 독립형 응용 프로그램의 루트 주입기
    // - 지연 로딩 경로의 공급자 배열을 사용하여 생성된 라우터 주입기
    // - 주입기 트리에 연결된 수동으로 생성된 주입기
    // 이들 각 경우는 공급자 컨테이너가 없으므로
    // 수입 경로의 개념도 존재하지 않으므로 공급자 기록을 반환할 수 있습니다.
    return providerRecordsWithoutImportPaths;
  }

  const providerToPath = getProviderImportPaths(providerImportsContainer);
  const providerRecords = [];

  for (const providerRecord of providerRecordsWithoutImportPaths) {
    const provider = providerRecord.provider;
    // 현재로서는 프레임워크에 의해 제공되는 것인지 사용자가 제공하는 것인지 결정하는
    // 보다 깔끔한 방법이 생길 때까지 이러한 특별한 공급자는 무시합니다.
    const token = (provider as ValueProvider).provide;
    if (token === ENVIRONMENT_INITIALIZER || token === INJECTOR_DEF_TYPES) {
      continue;
    }

    let importPath = providerToPath.get(provider) ?? [];

    const def = getComponentDef(providerImportsContainer);
    const isStandaloneComponent = !!def?.standalone;
    // 독립형 경우 구성 요소 생성자를 가장 앞에 추가합니다.
    // walkProviderTree는 순회 도중 이 생성자를 방문하지 않기 때문입니다.
    if (isStandaloneComponent) {
      importPath = [providerImportsContainer, ...importPath];
    }

    providerRecords.push({...providerRecord, importPath});
  }
  return providerRecords;
}

function isPlatformInjector(injector: Injector) {
  return injector instanceof R3Injector && injector.scopes.has('platform');
}

/**
 * 주입기에서 구성된 공급자를 가져옵니다.
 *
 * @param injector 공급자의 주입기를 조회
 * @returns ProviderRecord[] 주어진 주입기의 공급자를 나타내는 객체 배열
 */
export function getInjectorProviders(injector: Injector): ProviderRecord[] {
  if (injector instanceof NodeInjector) {
    return getNodeInjectorProviders(injector);
  } else if (injector instanceof EnvironmentInjector) {
    return getEnvironmentInjectorProviders(injector as EnvironmentInjector);
  }

  throwError('getInjectorProviders는 NodeInjector 및 EnvironmentInjector만 지원합니다.');
}

/**
 *
 * 주입기를 주어지면, 이 함수는 주입기의 유형과 출처를 포함하는 객체를 반환합니다.
 *
 * |              | type        | source                                                      |
 * |--------------|-------------|-------------------------------------------------------------|
 * | NodeInjector | element     | DOM element that created this injector                      |
 * | R3Injector   | environment | `injector.source`                                           |
 * | NullInjector | null        | null                                                        |
 *
 * @param injector 메타데이터를 가져올 주입기
 * @returns 주어진 주입기의 유형과 출처를 포함하는 객체. 주입기 메타데이터를 결정할 수 없는 경우 null을 반환합니다.
 */
export function getInjectorMetadata(
  injector: Injector,
):
  | {type: 'element'; source: RElement}
  | {type: 'environment'; source: string | null}
  | {type: 'null'; source: null}
  | null {
  if (injector instanceof NodeInjector) {
    const lView = getNodeInjectorLView(injector);
    const tNode = getNodeInjectorTNode(injector)!;
    assertTNodeForLView(tNode, lView);

    return {type: 'element', source: getNativeByTNode(tNode, lView) as RElement};
  }

  if (injector instanceof R3Injector) {
    return {type: 'environment', source: injector.source ?? null};
  }

  if (injector instanceof NullInjector) {
    return {type: 'null', source: null};
  }

  return null;
}

export function getInjectorResolutionPath(injector: Injector): Injector[] {
  const resolutionPath: Injector[] = [injector];
  getInjectorResolutionPathHelper(injector, resolutionPath);
  return resolutionPath;
}

function getInjectorResolutionPathHelper(
  injector: Injector,
  resolutionPath: Injector[],
): Injector[] {
  const parent = getInjectorParent(injector);

  // getInjectorParent가 부모를 찾지 못하면 경로의 끝에 도달했거나
  // Element Injector 트리에서 모듈 주입기 트리로 이동해야 하며,
  // 이동할 위치의 첫 번째 주입기를 연결 지점으로 사용합니다.
  if (parent === null) {
    if (injector instanceof NodeInjector) {
      const firstInjector = resolutionPath[0];
      if (firstInjector instanceof NodeInjector) {
        const moduleInjector = getModuleInjectorOfNodeInjector(firstInjector);
        if (moduleInjector === null) {
          throwError('NodeInjector는 모듈 주입기 트리에 반드시 연결되어 있어야 합니다.');
        }

        resolutionPath.push(moduleInjector);
        getInjectorResolutionPathHelper(moduleInjector, resolutionPath);
      }

      return resolutionPath;
    }
  } else {
    resolutionPath.push(parent);
    getInjectorResolutionPathHelper(parent, resolutionPath);
  }

  return resolutionPath;
}

/**
 * 주입기의 부모를 가져옵니다.
 *
 * 이 함수는 Element Injector 트리에서 모듈 주입기 트리로 점프할 수 없습니다.
 * 이는 루트 NodeInjector의 "부모" (해결 경로의 다음 단계)는
 * DI 조회를 시작한 NodeInjector 조상에 따라 달라지기 때문입니다.
 * getInjectorResolutionPath를 참조하세요.
 *
 * 아래 도표에서:
 * ```ts
 * getInjectorParent(NodeInjectorB)
 *  > NodeInjectorA
 * getInjectorParent(NodeInjectorA) // 또는 getInjectorParent(getInjectorParent(NodeInjectorB))
 *  > null // ModuleInjector 트리로 점프할 수 없음
 * ```
 *
 * ```
 *                ┌───────┐                ┌───────────────────┐
 *    ┌───────────┤ModuleA├───Injector────►│EnvironmentInjector│
 *    │           └───┬───┘                └───────────────────┘
 *    │               │
 *    │           bootstraps
 *    │               │
 *    │               │
 *    │          ┌────▼─────┐                 ┌─────────────┐
 * declares      │ComponentA├────Injector────►│NodeInjectorA│
 *    │          └────┬─────┘                 └─────▲───────┘
 *    │               │                             │
 *    │            renders                        parent
 *    │               │                             │
 *    │          ┌────▼─────┐                 ┌─────┴───────┐
 *    └─────────►│ComponentB├────Injector────►│NodeInjectorB│
 *               └──────────┘                 └─────────────┘
 * ```
 *
 * @param injector 부모를 가져올 주입기
 * @returns Injector 주어진 주입기의 부모
 */
function getInjectorParent(injector: Injector): Injector | null {
  if (injector instanceof R3Injector) {
    const parent = injector.parent;
    if (isRouterOutletInjector(parent)) {
      // 이는 Router의 OutletInjector와 EnvironmentInjector의 조합을 나타내는
      // `ChainedInjector` 인스턴스의 특별한 경우입니다.
      // OutletInjector는 토큰을 저장하지 않으므로 부모 주입기를 가리킵니다.
      // 추가 정보는 `OutletInjector.__ngOutletInjector` 필드를 참조하세요.
      return (parent as ChainedInjector).parentInjector;
    }
    return parent;
  }

  let tNode: TElementNode | TContainerNode | TElementContainerNode | null;
  let lView: LView<unknown>;
  if (injector instanceof NodeInjector) {
    tNode = getNodeInjectorTNode(injector);
    lView = getNodeInjectorLView(injector);
  } else if (injector instanceof NullInjector) {
    return null;
  } else if (injector instanceof ChainedInjector) {
    return injector.parentInjector;
  } else {
    throwError(
      'getInjectorParent는 R3Injector, NodeInjector, NullInjector 타입의 주입기만 지원합니다.',
    );
  }

  const parentLocation = getParentInjectorLocation(
    tNode as TElementNode | TContainerNode | TElementContainerNode,
    lView,
  );

  if (hasParentInjector(parentLocation)) {
    const parentInjectorIndex = getParentInjectorIndex(parentLocation);
    const parentLView = getParentInjectorView(parentLocation, lView);
    const parentTView = parentLView[TVIEW];
    const parentTNode = parentTView.data[parentInjectorIndex + NodeInjectorOffset.TNODE] as TNode;
    return new NodeInjector(
      parentTNode as TElementNode | TContainerNode | TElementContainerNode,
      parentLView,
    );
  } else {
    const chainedInjector = lView[INJECTOR] as ChainedInjector;

    // 경우 chainedInjector.injector가 OutletInjector이고 chainedInjector.injector.parent가
    // NodeInjector인 경우입니다.
    // todo(aleksanderbodurri): 이상적으로는 packages/core에서는 라우터 관련 사항을 직접 다루어서는 안 됩니다.
    // NodeInjector -> OutletInjector -> NodeInjector로 점프할 수 있도록
    // packages/router의 타입 계약을 명시적으로 의존하지 않도록 리팩토링합니다.
    const injectorParent = (chainedInjector.injector as any)?.parent as Injector;

    if (injectorParent instanceof NodeInjector) {
      return injectorParent;
    }
  }

  return null;
}

/**
 * NodeInjector의 모듈 주입기를 가져옵니다.
 *
 * @param injector NodeInjector의 모듈 주입기를 가져올 수 있습니다.
 * @returns 주어진 NodeInjector의 모듈 주입기를 나타내는 Injector
 */
function getModuleInjectorOfNodeInjector(injector: NodeInjector): Injector {
  let lView: LView<unknown>;
  if (injector instanceof NodeInjector) {
    lView = getNodeInjectorLView(injector);
  } else {
    throwError('getModuleInjectorOfNodeInjector는 NodeInjector로 호출되어야 합니다.');
  }

  const inj = lView[INJECTOR] as R3Injector | ChainedInjector;
  const moduleInjector = inj instanceof ChainedInjector ? inj.parentInjector : inj.parent;
  if (!moduleInjector) {
    throwError('NodeInjector는 모듈 주입기 트리에 연결되어야 합니다.');
  }

  return moduleInjector;
}
