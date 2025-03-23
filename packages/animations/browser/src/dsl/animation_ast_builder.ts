/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * 이 소스 코드의 사용은 https://angular.dev/license의 LICENSE 파일에 기재된 MIT 스타일 라이센스에 의해 관리됩니다.
 */
import {
  AnimateTimings,
  AnimationAnimateChildMetadata,
  AnimationAnimateMetadata,
  AnimationAnimateRefMetadata,
  AnimationGroupMetadata,
  AnimationKeyframesSequenceMetadata,
  AnimationMetadata,
  AnimationMetadataType,
  AnimationOptions,
  AnimationQueryMetadata,
  AnimationQueryOptions,
  AnimationReferenceMetadata,
  AnimationSequenceMetadata,
  AnimationStaggerMetadata,
  AnimationStateMetadata,
  AnimationStyleMetadata,
  AnimationTransitionMetadata,
  AnimationTriggerMetadata,
  AUTO_STYLE,
  style,
  ɵStyleDataMap,
} from '@angular/animations';

import {
  invalidDefinition,
  invalidKeyframes,
  invalidOffset,
  invalidParallelAnimation,
  invalidProperty,
  invalidStagger,
  invalidState,
  invalidStyleValue,
  invalidTrigger,
  keyframeOffsetsOutOfOrder,
  keyframesMissingOffsets,
} from '../error_helpers';
import {AnimationDriver} from '../render/animation_driver';
import {getOrSetDefaultValue} from '../render/shared';
import {
  extractStyleParams,
  NG_ANIMATING_SELECTOR,
  NG_TRIGGER_SELECTOR,
  normalizeAnimationEntry,
  resolveTiming,
  SUBSTITUTION_EXPR_START,
  validateStyleParams,
  visitDslNode,
} from '../util';
import {pushUnrecognizedPropertiesWarning} from '../warning_helpers';

import {
  AnimateAst,
  AnimateChildAst,
  AnimateRefAst,
  Ast,
  DynamicTimingAst,
  GroupAst,
  KeyframesAst,
  QueryAst,
  ReferenceAst,
  SequenceAst,
  StaggerAst,
  StateAst,
  StyleAst,
  TimingAst,
  TransitionAst,
  TriggerAst,
} from './animation_ast';
import {AnimationDslVisitor} from './animation_dsl_visitor';
import {parseTransitionExpr} from './animation_transition_expr';

const SELF_TOKEN = ':self';
const SELF_TOKEN_REGEX = /* @__PURE__ */ new RegExp(`s*${SELF_TOKEN}s*,?`, 'g');

/*
 * [유효성 검사]
 * 아래의 방문자 코드는 애니메이션 동사 함수에 의해 생성된 애니메이션 AST를 탐색하며
 * (출력은 객체의 트리입니다) 데이터에 대해 일련의 유효성 검사를 수행합니다.
 * 다음과 같은 가장자리 사례가 유효성이 검사를 받을 것입니다:
 *
 * 1. 애니메이션의 오버랩
 * CSS 속성은 동시에 여러 장소에서 애니메이션할 수 없으므로,
 * 이 행동이 감지되고 유효성이 검사가 중요합니다. 이는 스타일 속성이 검사될 때마다
 * 해당 속성이 애니메이션 단계 내에서 사용될 때의 시작 및 종료 시간을 포함하는 문자열-지도에
 * 속성이 업데이트되는 방식으로 발생합니다.
 *
 * 만약 현재 실행 중인 두 개 이상의 병렬 애니메이션이(이는 group()에 의해 호출됨)
 * 동일한 요소에서 실행되고 있다면, 유효성 검사기가 오류를 발생시킵니다. 현재 애니메이션 단게가
 * 같은 속성을 애니메이션하고 있고 그 타이밍 값이 현재 애니메이션 중인 시간 창에
 * 해당 속성의 타이밍 값이 포함된다면 오류를 발생시킵니다.
 *
 * 2. 타이밍 값
 * 유효성 검사기는 `duration delay easing` 또는
 * `durationNumber`의 타이밍 값이 유효한지 확인합니다.
 *
 * (유효성 검사 시 다음 코드는 타이밍 데이터를 {duration,delay,easing}을 포함하는 객체로
 * 대체합니다.)
 *
 * 3. 오프셋 유효성 검사
 * style() 호출은 keyframes() 내에 있을 때 오프셋 값을 가질 수 있습니다.
 * keyframes() 내의 오프셋은 다음과 같은 경우에 유효하다고 간주됩니다:
 *
 *   - 전혀 오프셋을 사용하지 않을 때
 *   - 각 style() 항목이 오프셋 값을 포함할 때
 *   - 각 오프셋이 0과 1 사이일 때
 *   - 각 오프셋이 이전 오프셋보다 크거나 같을 때
 *
 * 그렇지 않으면 오류가 발생합니다.
 */
export function buildAnimationAst(
  driver: AnimationDriver,
  metadata: AnimationMetadata | AnimationMetadata[],
  errors: Error[],
  warnings: string[],
): Ast<AnimationMetadataType> {
  return new AnimationAstBuilderVisitor(driver).build(metadata, errors, warnings);
}

const ROOT_SELECTOR = '';

export class AnimationAstBuilderVisitor implements AnimationDslVisitor {
  constructor(private _driver: AnimationDriver) {}

  build(
    metadata: AnimationMetadata | AnimationMetadata[],
    errors: Error[],
    warnings: string[],
  ): Ast<AnimationMetadataType> {
    const context = new AnimationAstBuilderContext(errors);
    this._resetContextStyleTimingState(context);
    const ast = <Ast<AnimationMetadataType>>(
      visitDslNode(this, normalizeAnimationEntry(metadata), context)
    );

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (context.unsupportedCSSPropertiesFound.size) {
        pushUnrecognizedPropertiesWarning(warnings, [
          ...context.unsupportedCSSPropertiesFound.keys(),
        ]);
      }
    }

    return ast;
  }

  private _resetContextStyleTimingState(context: AnimationAstBuilderContext) {
    context.currentQuerySelector = ROOT_SELECTOR;
    context.collectedStyles = new Map<string, Map<string, StyleTimeTuple>>();
    context.collectedStyles.set(ROOT_SELECTOR, new Map());
    context.currentTime = 0;
  }

  visitTrigger(
    metadata: AnimationTriggerMetadata,
    context: AnimationAstBuilderContext,
  ): TriggerAst {
    let queryCount = (context.queryCount = 0);
    let depCount = (context.depCount = 0);
    const states: StateAst[] = [];
    const transitions: TransitionAst[] = [];
    if (metadata.name.charAt(0) == '@') {
      context.errors.push(invalidTrigger());
    }

    metadata.definitions.forEach((def) => {
      this._resetContextStyleTimingState(context);
      if (def.type == AnimationMetadataType.State) {
        const stateDef = def as AnimationStateMetadata;
        const name = stateDef.name;
        name
          .toString()
          .split(/\s*,\s*/)
          .forEach((n) => {
            stateDef.name = n;
            states.push(this.visitState(stateDef, context));
          });
        stateDef.name = name;
      } else if (def.type == AnimationMetadataType.Transition) {
        const transition = this.visitTransition(def as AnimationTransitionMetadata, context);
        queryCount += transition.queryCount;
        depCount += transition.depCount;
        transitions.push(transition);
      } else {
        context.errors.push(invalidDefinition());
      }
    });

    return {
      type: AnimationMetadataType.Trigger,
      name: metadata.name,
      states,
      transitions,
      queryCount,
      depCount,
      options: null,
    };
  }

  visitState(metadata: AnimationStateMetadata, context: AnimationAstBuilderContext): StateAst {
    const styleAst = this.visitStyle(metadata.styles, context);
    const astParams = (metadata.options && metadata.options.params) || null;
    if (styleAst.containsDynamicStyles) {
      const missingSubs = new Set<string>();
      const params = astParams || {};
      styleAst.styles.forEach((style) => {
        if (style instanceof Map) {
          style.forEach((value) => {
            extractStyleParams(value).forEach((sub) => {
              if (!params.hasOwnProperty(sub)) {
                missingSubs.add(sub);
              }
            });
          });
        }
      });
      if (missingSubs.size) {
        context.errors.push(invalidState(metadata.name, [...missingSubs.values()]));
      }
    }

    return {
      type: AnimationMetadataType.State,
      name: metadata.name,
      style: styleAst,
      options: astParams ? {params: astParams} : null,
    };
  }

  visitTransition(
    metadata: AnimationTransitionMetadata,
    context: AnimationAstBuilderContext,
  ): TransitionAst {
    context.queryCount = 0;
    context.depCount = 0;
    const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
    const matchers = parseTransitionExpr(metadata.expr, context.errors);

    return {
      type: AnimationMetadataType.Transition,
      matchers,
      animation,
      queryCount: context.queryCount,
      depCount: context.depCount,
      options: normalizeAnimationOptions(metadata.options),
    };
  }

  visitSequence(
    metadata: AnimationSequenceMetadata,
    context: AnimationAstBuilderContext,
  ): SequenceAst {
    return {
      type: AnimationMetadataType.Sequence,
      steps: metadata.steps.map((s) => visitDslNode(this, s, context)),
      options: normalizeAnimationOptions(metadata.options),
    };
  }

  visitGroup(metadata: AnimationGroupMetadata, context: AnimationAstBuilderContext): GroupAst {
    const currentTime = context.currentTime;
    let furthestTime = 0;
    const steps = metadata.steps.map((step) => {
      context.currentTime = currentTime;
      const innerAst = visitDslNode(this, step, context);
      furthestTime = Math.max(furthestTime, context.currentTime);
      return innerAst;
    });

    context.currentTime = furthestTime;
    return {
      type: AnimationMetadataType.Group,
      steps,
      options: normalizeAnimationOptions(metadata.options),
    };
  }

  visitAnimate(
    metadata: AnimationAnimateMetadata,
    context: AnimationAstBuilderContext,
  ): AnimateAst {
    const timingAst = constructTimingAst(metadata.timings, context.errors);
    context.currentAnimateTimings = timingAst;
    let styleAst: StyleAst | KeyframesAst;
    let styleMetadata: AnimationStyleMetadata | AnimationKeyframesSequenceMetadata = metadata.styles
      ? metadata.styles
      : style({});
    if (styleMetadata.type == AnimationMetadataType.Keyframes) {
      styleAst = this.visitKeyframes(styleMetadata as AnimationKeyframesSequenceMetadata, context);
    } else {
      let styleMetadata = metadata.styles as AnimationStyleMetadata;
      let isEmpty = false;
      if (!styleMetadata) {
        isEmpty = true;
        const newStyleData: {[prop: string]: string | number} = {};
        if (timingAst.easing) {
          newStyleData['easing'] = timingAst.easing;
        }
        styleMetadata = style(newStyleData);
      }
      context.currentTime += timingAst.duration + timingAst.delay;
      const _styleAst = this.visitStyle(styleMetadata, context);
      _styleAst.isEmptyStep = isEmpty;
      styleAst = _styleAst;
    }

    context.currentAnimateTimings = null;
    return {
      type: AnimationMetadataType.Animate,
      timings: timingAst,
      style: styleAst,
      options: null,
    };
  }

  visitStyle(metadata: AnimationStyleMetadata, context: AnimationAstBuilderContext): StyleAst {
    const ast = this._makeStyleAst(metadata, context);
    this._validateStyleAst(ast, context);
    return ast;
  }

  private _makeStyleAst(
    metadata: AnimationStyleMetadata,
    context: AnimationAstBuilderContext,
  ): StyleAst {
    const styles: Array<ɵStyleDataMap | string> = [];
    const metadataStyles = Array.isArray(metadata.styles) ? metadata.styles : [metadata.styles];

    for (let styleTuple of metadataStyles) {
      if (typeof styleTuple === 'string') {
        if (styleTuple === AUTO_STYLE) {
          styles.push(styleTuple);
        } else {
          context.errors.push(invalidStyleValue(styleTuple));
        }
      } else {
        styles.push(new Map(Object.entries(styleTuple)));
      }
    }

    let containsDynamicStyles = false;
    let collectedEasing: string | null = null;
    styles.forEach((styleData) => {
      if (styleData instanceof Map) {
        if (styleData.has('easing')) {
          collectedEasing = styleData.get('easing') as string;
          styleData.delete('easing');
        }
        if (!containsDynamicStyles) {
          for (let value of styleData.values()) {
            if (value!.toString().indexOf(SUBSTITUTION_EXPR_START) >= 0) {
              containsDynamicStyles = true;
              break;
            }
          }
        }
      }
    });

    return {
      type: AnimationMetadataType.Style,
      styles,
      easing: collectedEasing,
      offset: metadata.offset,
      containsDynamicStyles,
      options: null,
    };
  }

  private _validateStyleAst(ast: StyleAst, context: AnimationAstBuilderContext): void {
    const timings = context.currentAnimateTimings;
    let endTime = context.currentTime;
    let startTime = context.currentTime;
    if (timings && startTime > 0) {
      startTime -= timings.duration + timings.delay;
    }

    ast.styles.forEach((tuple) => {
      if (typeof tuple === 'string') return;

      tuple.forEach((value, prop) => {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
          if (!this._driver.validateStyleProperty(prop)) {
            tuple.delete(prop);
            context.unsupportedCSSPropertiesFound.add(prop);
            return;
          }
        }

        // 이 쿼리 선택자 위치에는 정의된 Map이 있음을 보장하며
        // 여기서 단언을 추가하는 것이 안전합니다. 이전 메소드에서 기본적으로 빈 맵으로 설정됩니다.
        const collectedStyles = context.collectedStyles.get(context.currentQuerySelector!)!;
        const collectedEntry = collectedStyles.get(prop);
        let updateCollectedStyle = true;
        if (collectedEntry) {
          if (
            startTime != endTime &&
            startTime >= collectedEntry.startTime &&
            endTime <= collectedEntry.endTime
          ) {
            context.errors.push(
              invalidParallelAnimation(
                prop,
                collectedEntry.startTime,
                collectedEntry.endTime,
                startTime,
                endTime,
              ),
            );
            updateCollectedStyle = false;
          }

          // 우리는 항상 더 작은 시작 시간 값을 선택합니다.
          // 왜냐하면 우리는 스타일 속성이 애니메이션되는 전체 애니메이션 창을 기록하고 싶기 때문입니다.
          startTime = collectedEntry.startTime;
        }

        if (updateCollectedStyle) {
          collectedStyles.set(prop, {startTime, endTime});
        }

        if (context.options) {
          validateStyleParams(value, context.options, context.errors);
        }
      });
    });
  }

  visitKeyframes(
    metadata: AnimationKeyframesSequenceMetadata,
    context: AnimationAstBuilderContext,
  ): KeyframesAst {
    const ast: KeyframesAst = {type: AnimationMetadataType.Keyframes, styles: [], options: null};
    if (!context.currentAnimateTimings) {
      context.errors.push(invalidKeyframes());
      return ast;
    }

    const MAX_KEYFRAME_OFFSET = 1;

    let totalKeyframesWithOffsets = 0;
    const offsets: number[] = [];
    let offsetsOutOfOrder = false;
    let keyframesOutOfRange = false;
    let previousOffset: number = 0;

    const keyframes: StyleAst[] = metadata.steps.map((styles) => {
      const style = this._makeStyleAst(styles, context);
      let offsetVal: number | null =
        style.offset != null ? style.offset : consumeOffset(style.styles);
      let offset: number = 0;
      if (offsetVal != null) {
        totalKeyframesWithOffsets++;
        offset = style.offset = offsetVal;
      }
      keyframesOutOfRange = keyframesOutOfRange || offset < 0 || offset > 1;
      offsetsOutOfOrder = offsetsOutOfOrder || offset < previousOffset;
      previousOffset = offset;
      offsets.push(offset);
      return style;
    });

    if (keyframesOutOfRange) {
      context.errors.push(invalidOffset());
    }

    if (offsetsOutOfOrder) {
      context.errors.push(keyframeOffsetsOutOfOrder());
    }

    const length = metadata.steps.length;
    let generatedOffset = 0;
    if (totalKeyframesWithOffsets > 0 && totalKeyframesWithOffsets < length) {
      context.errors.push(keyframesMissingOffsets());
    } else if (totalKeyframesWithOffsets == 0) {
      generatedOffset = MAX_KEYFRAME_OFFSET / (length - 1);
    }

    const limit = length - 1;
    const currentTime = context.currentTime;
    const currentAnimateTimings = context.currentAnimateTimings!;
    const animateDuration = currentAnimateTimings.duration;
    keyframes.forEach((kf, i) => {
      const offset = generatedOffset > 0 ? (i == limit ? 1 : generatedOffset * i) : offsets[i];
      const durationUpToThisFrame = offset * animateDuration;
      context.currentTime = currentTime + currentAnimateTimings.delay + durationUpToThisFrame;
      currentAnimateTimings.duration = durationUpToThisFrame;
      this._validateStyleAst(kf, context);
      kf.offset = offset;

      ast.styles.push(kf);
    });

    return ast;
  }

  visitReference(
    metadata: AnimationReferenceMetadata,
    context: AnimationAstBuilderContext,
  ): ReferenceAst {
    return {
      type: AnimationMetadataType.Reference,
      animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context),
      options: normalizeAnimationOptions(metadata.options),
    };
  }

  visitAnimateChild(
    metadata: AnimationAnimateChildMetadata,
    context: AnimationAstBuilderContext,
  ): AnimateChildAst {
    context.depCount++;
    return {
      type: AnimationMetadataType.AnimateChild,
      options: normalizeAnimationOptions(metadata.options),
    };
  }

  visitAnimateRef(
    metadata: AnimationAnimateRefMetadata,
    context: AnimationAstBuilderContext,
  ): AnimateRefAst {
    return {
      type: AnimationMetadataType.AnimateRef,
      animation: this.visitReference(metadata.animation, context),
      options: normalizeAnimationOptions(metadata.options),
    };
  }

  visitQuery(metadata: AnimationQueryMetadata, context: AnimationAstBuilderContext): QueryAst {
    const parentSelector = context.currentQuerySelector!;
    const options = (metadata.options || {}) as AnimationQueryOptions;

    context.queryCount++;
    context.currentQuery = metadata;
    const [selector, includeSelf] = normalizeSelector(metadata.selector);
    context.currentQuerySelector = parentSelector.length
      ? parentSelector + ' ' + selector
      : selector;
    getOrSetDefaultValue(context.collectedStyles, context.currentQuerySelector, new Map());

    const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
    context.currentQuery = null;
    context.currentQuerySelector = parentSelector;

    return {
      type: AnimationMetadataType.Query,
      selector,
      limit: options.limit || 0,
      optional: !!options.optional,
      includeSelf,
      animation,
      originalSelector: metadata.selector,
      options: normalizeAnimationOptions(metadata.options),
    };
  }

  visitStagger(
    metadata: AnimationStaggerMetadata,
    context: AnimationAstBuilderContext,
  ): StaggerAst {
    if (!context.currentQuery) {
      context.errors.push(invalidStagger());
    }
    const timings =
      metadata.timings === 'full'
        ? {duration: 0, delay: 0, easing: 'full'}
        : resolveTiming(metadata.timings, context.errors, true);

    return {
      type: AnimationMetadataType.Stagger,
      animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context),
      timings,
      options: null,
    };
  }
}

function normalizeSelector(selector: string): [string, boolean] {
  const hasAmpersand = selector.split(/\s*,\s*/).find((token) => token == SELF_TOKEN)
    ? true
    : false;
  if (hasAmpersand) {
    selector = selector.replace(SELF_TOKEN_REGEX, '');
  }

  // 참고: :enter 및 :leave는 여기에서 정규화되지 않으며,
  // 해당 선택자는 시간표 구축 시 런타임 동안 채워집니다.
  selector = selector
    .replace(/@\*/g, NG_TRIGGER_SELECTOR)
    .replace(/@\w+/g, (match) => NG_TRIGGER_SELECTOR + '-' + match.slice(1))
    .replace(/:animating/g, NG_ANIMATING_SELECTOR);

  return [selector, hasAmpersand];
}

function normalizeParams(obj: {[key: string]: any} | any): {[key: string]: any} | null {
  return obj ? {...obj} : null;
}

export type StyleTimeTuple = {
  startTime: number;
  endTime: number;
};

export class AnimationAstBuilderContext {
  public queryCount: number = 0;
  public depCount: number = 0;
  public currentTransition: AnimationTransitionMetadata | null = null;
  public currentQuery: AnimationQueryMetadata | null = null;
  public currentQuerySelector: string | null = null;
  public currentAnimateTimings: TimingAst | null = null;
  public currentTime: number = 0;
  public collectedStyles = new Map<string, Map<string, StyleTimeTuple>>();
  public options: AnimationOptions | null = null;
  public unsupportedCSSPropertiesFound: Set<string> = new Set<string>();
  constructor(public errors: Error[]) {}
}

type OffsetStyles = string | ɵStyleDataMap;

function consumeOffset(styles: OffsetStyles | Array<OffsetStyles>): number | null {
  if (typeof styles == 'string') return null;

  let offset: number | null = null;

  if (Array.isArray(styles)) {
    styles.forEach((styleTuple) => {
      if (styleTuple instanceof Map && styleTuple.has('offset')) {
        const obj = styleTuple as ɵStyleDataMap;
        offset = parseFloat(obj.get('offset') as string);
        obj.delete('offset');
      }
    });
  } else if (styles instanceof Map && styles.has('offset')) {
    const obj = styles;
    offset = parseFloat(obj.get('offset') as string);
    obj.delete('offset');
  }
  return offset;
}

function constructTimingAst(value: string | number | AnimateTimings, errors: Error[]) {
  if (value.hasOwnProperty('duration')) {
    return value as AnimateTimings;
  }

  if (typeof value == 'number') {
    const duration = resolveTiming(value, errors).duration;
    return makeTimingAst(duration, 0, '');
  }

  const strValue = value as string;
  const isDynamic = strValue.split(/\s+/).some((v) => v.charAt(0) == '{' && v.charAt(1) == '{');
  if (isDynamic) {
    const ast = makeTimingAst(0, 0, '') as any;
    ast.dynamic = true;
    ast.strValue = strValue;
    return ast as DynamicTimingAst;
  }

  const timings = resolveTiming(strValue, errors);
  return makeTimingAst(timings.duration, timings.delay, timings.easing);
}

function normalizeAnimationOptions(options: AnimationOptions | null): AnimationOptions {
  if (options) {
    options = {...options};
    if (options['params']) {
      options['params'] = normalizeParams(options['params'])!;
    }
  } else {
    options = {};
  }
  return options;
}

function makeTimingAst(duration: number, delay: number, easing: string | null): TimingAst {
  return {duration, delay, easing};
}
