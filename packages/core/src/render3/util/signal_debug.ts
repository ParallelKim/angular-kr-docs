/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {
  REACTIVE_LVIEW_CONSUMER_NODE,
  ReactiveLViewConsumer,
  TEMPORARY_CONSUMER_NODE,
} from '../reactive_lview_consumer';
import {assertTNode, assertLView} from '../assert';
import {getFrameworkDIDebugData} from '../debug/framework_injector_profiler';
import {NodeInjector, getNodeInjectorTNode, getNodeInjectorLView} from '../di';
import {REACTIVE_TEMPLATE_CONSUMER, HOST, LView} from '../interfaces/view';
import {EffectNode, EffectRefImpl, ROOT_EFFECT_NODE, VIEW_EFFECT_NODE} from '../reactivity/effect';
import {Injector} from '../../di/injector';
import {R3Injector} from '../../di/r3_injector';
import {throwError} from '../../util/assert';
import {
  ComputedNode,
  ReactiveNode,
  SIGNAL,
  SIGNAL_NODE,
  SignalNode,
} from '@angular/core/primitives/signals';

export interface DebugSignalGraphNode {
  kind: string;
  label?: string;
  value?: unknown;
}

export interface DebugSignalGraphEdge {
  /**
   * 신호를 제공하는 프로듀서 노드의 소비자 인덱스.
   */
  consumer: number;

  /**
   * 소비자 노드에서 소비되는 신호를 제공하는 프로듀서 노드의 인덱스.
   */
  producer: number;
}

/**
 * 신호 그래프의 디버그 표현입니다.
 */
export interface DebugSignalGraph {
  nodes: DebugSignalGraphNode[];
  edges: DebugSignalGraphEdge[];
}

function isComputedNode(node: ReactiveNode): node is ComputedNode<unknown> {
  return node.kind === 'computed';
}

function isTemplateEffectNode(node: ReactiveNode): node is ReactiveLViewConsumer {
  return node.kind === 'template';
}

function isEffectNode(node: ReactiveNode): node is EffectNode {
  return node.kind === 'effect';
}

function isSignalNode(node: ReactiveNode): node is SignalNode<unknown> {
  return node.kind === 'signal';
}

/**
 *
 * @param injector
 * @returns 주어진 NodeInjector의 템플릿 소비자
 */
function getTemplateConsumer(injector: NodeInjector): ReactiveLViewConsumer | null {
  const tNode = getNodeInjectorTNode(injector)!;
  assertTNode(tNode);
  const lView = getNodeInjectorLView(injector)!;
  assertLView(lView);
  const templateLView = lView[tNode.index]!;
  assertLView(templateLView);

  return templateLView[REACTIVE_TEMPLATE_CONSUMER];
}

function getNodesAndEdgesFromSignalMap(signalMap: ReadonlyMap<ReactiveNode, ReactiveNode[]>): {
  nodes: DebugSignalGraphNode[];
  edges: DebugSignalGraphEdge[];
} {
  const nodes = Array.from(signalMap.keys());
  const debugSignalGraphNodes: DebugSignalGraphNode[] = [];
  const edges: DebugSignalGraphEdge[] = [];

  for (const [consumer, producers] of signalMap.entries()) {
    const consumerIndex = nodes.indexOf(consumer);

    // 노드 수집
    if (isComputedNode(consumer) || isSignalNode(consumer)) {
      debugSignalGraphNodes.push({
        label: consumer.debugName,
        value: consumer.value,
        kind: consumer.kind,
      });
    } else if (isTemplateEffectNode(consumer)) {
      debugSignalGraphNodes.push({
        label: consumer.debugName ?? consumer.lView?.[HOST]?.tagName?.toLowerCase?.(),
        kind: consumer.kind,
      });
    } else if (isEffectNode(consumer)) {
      debugSignalGraphNodes.push({
        label: consumer.debugName,
        kind: consumer.kind,
      });
    } else {
      debugSignalGraphNodes.push({
        label: consumer.debugName,
        kind: consumer.kind,
      });
    }

    // 노드를 위한 엣지 수집
    for (const producer of producers) {
      edges.push({consumer: consumerIndex, producer: nodes.indexOf(producer)});
    }
  }

  return {nodes: debugSignalGraphNodes, edges};
}

function extractEffectsFromInjector(injector: Injector): ReactiveNode[] {
  let diResolver: Injector | LView<unknown> = injector;
  if (injector instanceof NodeInjector) {
    const lView = getNodeInjectorLView(injector)!;
    diResolver = lView;
  }

  const resolverToEffects = getFrameworkDIDebugData().resolverToEffects as Map<
    Injector | LView<unknown>,
    EffectRefImpl[]
  >;
  const effects = resolverToEffects.get(diResolver) ?? [];

  return effects.map((effect: EffectRefImpl) => effect[SIGNAL]);
}

function extractSignalNodesAndEdgesFromRoots(
  nodes: ReactiveNode[],
  signalDependenciesMap: Map<ReactiveNode, ReactiveNode[]> = new Map(),
): Map<ReactiveNode, ReactiveNode[]> {
  for (const node of nodes) {
    if (signalDependenciesMap.has(node)) {
      continue;
    }

    const producerNodes = (node.producerNode ?? []) as ReactiveNode[];
    signalDependenciesMap.set(node, producerNodes);
    extractSignalNodesAndEdgesFromRoots(producerNodes, signalDependenciesMap);
  }

  return signalDependenciesMap;
}

/**
 * 주어진 인젝터의 신호 그래프의 디버그 표현을 반환합니다.
 *
 * 현재 요소 인젝터만 지원합니다. 소비자 노드를 발견하고
 * 그 다음 프로듀서 노드를 탐색하여 신호 그래프를 작성합니다.
 *
 * @param injector 신호 그래프를 가져올 인젝터.
 * @returns 신호 그래프의 디버그 표현.
 * @throws 인젝터가 환경 인젝터인 경우.
 */
export function getSignalGraph(injector: Injector): DebugSignalGraph {
  let templateConsumer: ReactiveLViewConsumer | null = null;

  if (!(injector instanceof NodeInjector) && !(injector instanceof R3Injector)) {
    return throwError('getSignalGraph은 NodeInjector 또는 R3Injector로 호출되어야 합니다.');
  }

  if (injector instanceof NodeInjector) {
    templateConsumer = getTemplateConsumer(injector as NodeInjector);
  }

  const nonTemplateEffectNodes = extractEffectsFromInjector(injector);

  const signalNodes = templateConsumer
    ? [templateConsumer, ...nonTemplateEffectNodes]
    : nonTemplateEffectNodes;

  const signalDependenciesMap = extractSignalNodesAndEdgesFromRoots(signalNodes);

  return getNodesAndEdgesFromSignalMap(signalDependenciesMap);
}
