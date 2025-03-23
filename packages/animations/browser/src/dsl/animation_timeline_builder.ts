/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {
  AnimateChildOptions,
  AnimateTimings,
  AnimationMetadataType,
  AnimationOptions,
  AnimationQueryOptions,
  AUTO_STYLE,
  ɵPRE_STYLE as PRE_STYLE,
  ɵStyleDataMap,
} from '@angular/animations';

import {invalidQuery} from '../error_helpers';
import {AnimationDriver} from '../render/animation_driver';
import {interpolateParams, resolveTiming, resolveTimingValue, visitDslNode} from '../util';

import {
  AnimateAst,
  AnimateChildAst,
  AnimateRefAst,
  Ast,
  AstVisitor,
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
import {
  AnimationTimelineInstruction,
  createTimelineInstruction,
} from './animation_timeline_instruction';
import {ElementInstructionMap} from './element_instruction_map';

const ONE_FRAME_IN_MILLISECONDS = 1;
const ENTER_TOKEN = ':enter';
const ENTER_TOKEN_REGEX = /* @__PURE__ */ new RegExp(ENTER_TOKEN, 'g');
const LEAVE_TOKEN = ':leave';
const LEAVE_TOKEN_REGEX = /* @__PURE__ */ new RegExp(LEAVE_TOKEN, 'g');

/*
 * 이 파일의 코드는 Angular의
 * animation DSL 코드에서 web-animations 호환 키프레임을 생성하는 것을 목표로 합니다.
 *
 * 아래 코드는 다음과 같이 변환됩니다:
 *
 * ```ts
 * sequence([
 *   style({ opacity: 0 }),
 *   animate(1000, style({ opacity: 0 }))
 * ])
 * ```
 *
 * 다음으로:
 * ```ts
 * keyframes = [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 1 }]
 * duration = 1000
 * delay = 0
 * easing = ''
 * ```
 *
 * 이 작업이 animation 동사의 조합(style, animate, group 등...)을 재미있게 세트할 수 있도록,
 * AST 순회와 merge-sort와 유사한 알고리즘의 조합이 사용됩니다.
 *
 * [AST Traversal]
 * 각 애니메이션 동사는 실행될 때마다
 * 어떤 유형의 작업(스타일, 애니메이트, 그룹 등...)인지와 관련된 데이터로 구성된 문자열 맵 객체를 반환합니다.
 * 이는 이러한 함수들의 기능적 조합이 평가 될 때 (위 예와 같이)
 * 애니메이션 자체를 나타내는 객체의 트리를 생성하게 됨을 의미합니다.
 *
 * 이 애니메이션 객체 트리가 아래 방문자 코드에 의해 처리될 때,
 * 방문자 내의 각 동사 문장을 방문하게 됩니다.
 * 그리고 각 방문 동안, `TimelineBuilder`와 상호 작용하여
 * 애니메이션 키프레임의 컨텍스트를 구축하게 됩니다.
 *
 * [TimelineBuilder]
 * 이 클래스는 스타일을 추적하고 시작 및 종료 시간 사이의 키프레임 객체 시리즈를 구축하는 책임이 있습니다.
 * 빌더는 초기 타임라인으로 시작하며, AST가 `group()`, `keyframes()` 또는
 * 두 가지 조합을 `sequence()` 내에서 발견할 때마다
 * 각 단계에 대한 하위 타임라인과 후속 타임라인을 생성합니다.
 *
 * AST가 순회되는 동안, 각 타임라인의 타이밍 상태가 증가됩니다.
 * 만약 하위 타임라인이 생성되었다면 (위의 경우 중 하나를 기반으로) 상위 타임라인는
 * 하위 타임라인 내에서 사용된 스타일을 자신에 합병하려고 합니다 (이것은 group() 유형일 때 발생합니다).
 * 이는 mergeSort의 merge처럼 합병 작업을 통해 이루어지며,
 * 하위 타임라인에서 가장 최근에 사용된 스타일만 상위 타임라인에 복사합니다.
 * 이는 스타일이 애니메이션의 다른 단계에서 나중에 사용될 경우
 * 가장 최신 값이 되도록 보장합니다.
 *
 * [How Missing Styles Are Updated]
 * 각 타임라인은
 * 이미 처리된 키프레임에 새로운 스타일을 채우는 책임이 있는 `backFill` 속성을 가집니다.
 *
 * ```ts
 * sequence([
 *   style({ width: 0 }),
 *   animate(1000, style({ width: 100 })),
 *   animate(1000, style({ width: 200 })),
 *   animate(1000, style({ width: 300 }))
 *   animate(1000, style({ width: 400, height: 400 })) // `height`는 어디에도 존재하지 않음을 유의하십시오
 * else
 * ])
 * ```
 *
 * 여기서 발생하는 것은 `height` 값이 나중에 시퀀스에 추가되지만
 * 모든 이전 애니메이션 단계에서는 누락됩니다. 따라서 키프레임이 생성될 때
 * 이는 처음 사용될 때까지 모든 이전 키프레임에서 누락됩니다.
 * 타임라인 키프레임 생성을 위해 스타일이 적절히 채워질 수 있도록
 * 이전 값(상위 타임라인의 값)이나 기본값 `*`이 backFill 맵에 배치됩니다.
 *
 * 하위 타임라인이 생성될 때마다
 * 고유한 backFill 속성을 갖습니다.
 * 이는 하위 타임라인 내의 스타일이 실수로 이전/미래 타임라인 키프레임으로 누출되지 않도록 하기 위해 수행됩니다.
 *
 * [Validation]
 * 이 파일의 코드는 유효성 검사에 대한 책임이 없습니다.
 * 해당 기능은 `AnimationValidatorVisitor` 코드 내에서 처리됩니다.
 */
export function buildAnimationTimelines(
  driver: AnimationDriver,
  rootElement: any,
  ast: Ast<AnimationMetadataType>,
  enterClassName: string,
  leaveClassName: string,
  startingStyles: ɵStyleDataMap = new Map(),
  finalStyles: ɵStyleDataMap = new Map(),
  options: AnimationOptions,
  subInstructions?: ElementInstructionMap,
  errors: Error[] = [],
): AnimationTimelineInstruction[] {
  return new AnimationTimelineBuilderVisitor().buildKeyframes(
    driver,
    rootElement,
    ast,
    enterClassName,
    leaveClassName,
    startingStyles,
    finalStyles,
    options,
    subInstructions,
    errors,
  );
}

export class AnimationTimelineBuilderVisitor implements AstVisitor {
  buildKeyframes(
    driver: AnimationDriver,
    rootElement: any,
    ast: Ast<AnimationMetadataType>,
    enterClassName: string,
    leaveClassName: string,
    startingStyles: ɵStyleDataMap,
    finalStyles: ɵStyleDataMap,
    options: AnimationOptions,
    subInstructions?: ElementInstructionMap,
    errors: Error[] = [],
  ): AnimationTimelineInstruction[] {
    subInstructions = subInstructions || new ElementInstructionMap();
    const context = new AnimationTimelineContext(
      driver,
      rootElement,
      subInstructions,
      enterClassName,
      leaveClassName,
      errors,
      [],
    );
    context.options = options;
    const delay = options.delay ? resolveTimingValue(options.delay) : 0;
    context.currentTimeline.delayNextStep(delay);
    context.currentTimeline.setStyles([startingStyles], null, context.errors, options);

    visitDslNode(this, ast, context);

    // 실제 애니메이션이 발생했는지 확인합니다.
    const timelines = context.timelines.filter((timeline) => timeline.containsAnimation());

    // 주의: 우리는 단지 rootElement에 대한 최종 스타일만 적용하고 싶습니다.
    //        따라서 마지막 타임라인이 아닌 마지막 타임라인이 root one인 경우에만 적용합니다.
    if (timelines.length && finalStyles.size) {
      let lastRootTimeline: TimelineBuilder | undefined;
      for (let i = timelines.length - 1; i >= 0; i--) {
        const timeline = timelines[i];
        if (timeline.element === rootElement) {
          lastRootTimeline = timeline;
          break;
        }
      }
      if (lastRootTimeline && !lastRootTimeline.allowOnlyTimelineStyles()) {
        lastRootTimeline.setStyles([finalStyles], null, context.errors, options);
      }
    }
    return timelines.length
      ? timelines.map((timeline) => timeline.buildKeyframes())
      : [createTimelineInstruction(rootElement, [], [], [], 0, delay, '', false)];
  }

  visitTrigger(ast: TriggerAst, context: AnimationTimelineContext): any {
    // 이 AST에서는 이러한 값이 방문되지 않습니다.
  }

  visitState(ast: StateAst, context: AnimationTimelineContext): any {
    // 이 AST에서는 이러한 값이 방문되지 않습니다.
  }

  visitTransition(ast: TransitionAst, context: AnimationTimelineContext): any {
    // 이 AST에서는 이러한 값이 방문되지 않습니다.
  }

  visitAnimateChild(ast: AnimateChildAst, context: AnimationTimelineContext): any {
    const elementInstructions = context.subInstructions.get(context.element);
    if (elementInstructions) {
      const innerContext = context.createSubContext(ast.options);
      const startTime = context.currentTimeline.currentTime;
      const endTime = this._visitSubInstructions(
        elementInstructions,
        innerContext,
        innerContext.options as AnimateChildOptions,
      );
      if (startTime != endTime) {
        // 이는 상위 컨텍스트에서 수행되며,
        // 하위 자식 애니메이션을 위한 하위 컨텍스트를 생성했기 때문입니다.
        context.transformIntoNewTimeline(endTime);
      }
    }
    context.previousNode = ast;
  }

  visitAnimateRef(ast: AnimateRefAst, context: AnimationTimelineContext): any {
    const innerContext = context.createSubContext(ast.options);
    innerContext.transformIntoNewTimeline();
    this._applyAnimationRefDelays([ast.options, ast.animation.options], context, innerContext);
    this.visitReference(ast.animation, innerContext);
    context.transformIntoNewTimeline(innerContext.currentTimeline.currentTime);
    context.previousNode = ast;
  }

  private _applyAnimationRefDelays(
    animationsRefsOptions: (AnimationOptions | null)[],
    context: AnimationTimelineContext,
    innerContext: AnimationTimelineContext,
  ) {
    for (const animationRefOptions of animationsRefsOptions) {
      const animationDelay = animationRefOptions?.delay;
      if (animationDelay) {
        const animationDelayValue =
          typeof animationDelay === 'number'
            ? animationDelay
            : resolveTimingValue(
                interpolateParams(
                  animationDelay,
                  animationRefOptions?.params ?? {},
                  context.errors,
                ),
              );
        innerContext.delayNextStep(animationDelayValue);
      }
    }
  }

  private _visitSubInstructions(
    instructions: AnimationTimelineInstruction[],
    context: AnimationTimelineContext,
    options: AnimateChildOptions,
  ): number {
    const startTime = context.currentTimeline.currentTime;
    let furthestTime = startTime;

    // 이는 사용자가 하위 애니메이션을 완전히 건너뛰고 싶어할 때의 특별한 경우입니다.
    const duration = options.duration != null ? resolveTimingValue(options.duration) : null;
    const delay = options.delay != null ? resolveTimingValue(options.delay) : null;
    if (duration !== 0) {
      instructions.forEach((instruction) => {
        const instructionTimings = context.appendInstructionToTimeline(
          instruction,
          duration,
          delay,
        );
        furthestTime = Math.max(
          furthestTime,
          instructionTimings.duration + instructionTimings.delay,
        );
      });
    }

    return furthestTime;
  }

  visitReference(ast: ReferenceAst, context: AnimationTimelineContext) {
    context.updateOptions(ast.options, true);
    visitDslNode(this, ast.animation, context);
    context.previousNode = ast;
  }

  visitSequence(ast: SequenceAst, context: AnimationTimelineContext) {
    const subContextCount = context.subContextCount;
    let ctx = context;
    const options = ast.options;

    if (options && (options.params || options.delay)) {
      ctx = context.createSubContext(options);
      ctx.transformIntoNewTimeline();

      if (options.delay != null) {
        if (ctx.previousNode.type == AnimationMetadataType.Style) {
          ctx.currentTimeline.snapshotCurrentStyles();
          ctx.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
        }

        const delay = resolveTimingValue(options.delay);
        ctx.delayNextStep(delay);
      }
    }

    if (ast.steps.length) {
      ast.steps.forEach((s) => visitDslNode(this, s, ctx));

      // 이는 내부 단계가 style() 호출만 포함하거나 그것으로 끝날 경우에 대비하여 존재합니다.
      ctx.currentTimeline.applyStylesToKeyframe();

      // 이는 시퀀스 내의 일부 애니메이션 함수가 하위 타임라인을 생성한 것을 의미합니다.
      // (이는 현재 타임라인이 시퀀스의 내용과 겹칠 수 없음을 의미합니다.)
      if (ctx.subContextCount > subContextCount) {
        ctx.transformIntoNewTimeline();
      }
    }

    context.previousNode = ast;
  }

  visitGroup(ast: GroupAst, context: AnimationTimelineContext) {
    const innerTimelines: TimelineBuilder[] = [];
    let furthestTime = context.currentTimeline.currentTime;
    const delay = ast.options && ast.options.delay ? resolveTimingValue(ast.options.delay) : 0;

    ast.steps.forEach((s) => {
      const innerContext = context.createSubContext(ast.options);
      if (delay) {
        innerContext.delayNextStep(delay);
      }

      visitDslNode(this, s, innerContext);
      furthestTime = Math.max(furthestTime, innerContext.currentTimeline.currentTime);
      innerTimelines.push(innerContext.currentTimeline);
    });

    // 이 작업은 AST 루프 후에 실행됩니다.
    // 그렇지 않으면 상위 타임라인의 수집된 스타일이 업데이트되어
    // 새로 포크된 항목에 잘못된 데이터를 전달하게 됩니다.
    innerTimelines.forEach((timeline) =>
      context.currentTimeline.mergeTimelineCollectedStyles(timeline),
    );
    context.transformIntoNewTimeline(furthestTime);
    context.previousNode = ast;
  }

  private _visitTiming(ast: TimingAst, context: AnimationTimelineContext): AnimateTimings {
    if ((ast as DynamicTimingAst).dynamic) {
      const strValue = (ast as DynamicTimingAst).strValue;
      const timingValue = context.params
        ? interpolateParams(strValue, context.params, context.errors)
        : strValue;
      return resolveTiming(timingValue, context.errors);
    } else {
      return {duration: ast.duration, delay: ast.delay, easing: ast.easing};
    }
  }

  visitAnimate(ast: AnimateAst, context: AnimationTimelineContext) {
    const timings = (context.currentAnimateTimings = this._visitTiming(ast.timings, context));
    const timeline = context.currentTimeline;
    if (timings.delay) {
      context.incrementTime(timings.delay);
      timeline.snapshotCurrentStyles();
    }

    const style = ast.style;
    if (style.type == AnimationMetadataType.Keyframes) {
      this.visitKeyframes(style, context);
    } else {
      context.incrementTime(timings.duration);
      this.visitStyle(style as StyleAst, context);
      timeline.applyStylesToKeyframe();
    }

    context.currentAnimateTimings = null;
    context.previousNode = ast;
  }

  visitStyle(ast: StyleAst, context: AnimationTimelineContext) {
    const timeline = context.currentTimeline;
    const timings = context.currentAnimateTimings!;

    // 이는 style() 호출이 animate() 호출 바로 뒤에 오는 특별한 경우입니다
    // (그러나 animate() 호출 내부는 아님).
    if (!timings && timeline.hasCurrentStyleProperties()) {
      timeline.forwardFrame();
    }

    const easing = (timings && timings.easing) || ast.easing;
    if (ast.isEmptyStep) {
      timeline.applyEmptyStep(easing);
    } else {
      timeline.setStyles(ast.styles, easing, context.errors, context.options);
    }

    context.previousNode = ast;
  }

  visitKeyframes(ast: KeyframesAst, context: AnimationTimelineContext) {
    const currentAnimateTimings = context.currentAnimateTimings!;
    const startTime = context.currentTimeline!.duration;
    const duration = currentAnimateTimings.duration;
    const innerContext = context.createSubContext();
    const innerTimeline = innerContext.currentTimeline;
    innerTimeline.easing = currentAnimateTimings.easing;

    ast.styles.forEach((step) => {
      const offset: number = step.offset || 0;
      innerTimeline.forwardTime(offset * duration);
      innerTimeline.setStyles(step.styles, step.easing, context.errors, context.options);
      innerTimeline.applyStylesToKeyframe();
    });

    // 이는 상위 타임라인이 하위에서 모든 스타일을 받게 보장합니다.
    // 아래 새 타임라인이 사용되지 않더라도요.
    context.currentTimeline.mergeTimelineCollectedStyles(innerTimeline);

    // 이들 사이의 빈틈을 유지해야 합니다. 타임라인과 하위 타임라인은
    // 내부의 스타일이 이전과 정확히 동일해야 하기 때문입니다.
    context.transformIntoNewTimeline(startTime + duration);
    context.previousNode = ast;
  }

  visitQuery(ast: QueryAst, context: AnimationTimelineContext) {
    // 이 이전 단계가 style 단계인 경우 자식 애니메이션 전에
    // 스타일이 적용되도록 해야 합니다.
    const startTime = context.currentTimeline.currentTime;
    const options = (ast.options || {}) as AnimationQueryOptions;
    const delay = options.delay ? resolveTimingValue(options.delay) : 0;

    if (
      delay &&
      (context.previousNode.type === AnimationMetadataType.Style ||
        (startTime == 0 && context.currentTimeline.hasCurrentStyleProperties()))
    ) {
      context.currentTimeline.snapshotCurrentStyles();
      context.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
    }

    let furthestTime = startTime;
    const elms = context.invokeQuery(
      ast.selector,
      ast.originalSelector,
      ast.limit,
      ast.includeSelf,
      options.optional ? true : false,
      context.errors,
    );

    context.currentQueryTotal = elms.length;
    let sameElementTimeline: TimelineBuilder | null = null;
    elms.forEach((element, i) => {
      context.currentQueryIndex = i;
      const innerContext = context.createSubContext(ast.options, element);
      if (delay) {
        innerContext.delayNextStep(delay);
      }

      if (element === context.element) {
        sameElementTimeline = innerContext.currentTimeline;
      }

      visitDslNode(this, ast.animation, innerContext);

      // 이는 내부 단계가 style() 호출만 포함하거나 그것으로 끝날 경우에 대비하여 존재합니다.
      innerContext.currentTimeline.applyStylesToKeyframe();

      const endTime = innerContext.currentTimeline.currentTime;
      furthestTime = Math.max(furthestTime, endTime);
    });

    context.currentQueryIndex = 0;
    context.currentQueryTotal = 0;
    context.transformIntoNewTimeline(furthestTime);

    if (sameElementTimeline) {
      context.currentTimeline.mergeTimelineCollectedStyles(sameElementTimeline);
      context.currentTimeline.snapshotCurrentStyles();
    }

    context.previousNode = ast;
  }

  visitStagger(ast: StaggerAst, context: AnimationTimelineContext) {
    const parentContext = context.parentContext!;
    const tl = context.currentTimeline;
    const timings = ast.timings;
    const duration = Math.abs(timings.duration);
    const maxTime = duration * (context.currentQueryTotal - 1);
    let delay = duration * context.currentQueryIndex;

    let staggerTransformer = timings.duration < 0 ? 'reverse' : timings.easing;
    switch (staggerTransformer) {
      case 'reverse':
        delay = maxTime - delay;
        break;
      case 'full':
        delay = parentContext.currentStaggerTime;
        break;
    }

    const timeline = context.currentTimeline;
    if (delay) {
      timeline.delayNextStep(delay);
    }

    const startingTime = timeline.currentTime;
    visitDslNode(this, ast.animation, context);
    context.previousNode = ast;

    // time = duration + delay
    // 이 계산이 복잡한 이유는
    // 내부 타임라인이 지연 값이나 늘어난
    // 키프레임을 가질 수 있기 때문입니다.
    parentContext.currentStaggerTime =
      tl.currentTime - startingTime + (tl.startTime - parentContext.currentTimeline.startTime);
  }
}

export declare type StyleAtTime = {
  time: number;
  value: string | number;
};

const DEFAULT_NOOP_PREVIOUS_NODE = <Ast<AnimationMetadataType>>{};
export class AnimationTimelineContext {
  public parentContext: AnimationTimelineContext | null = null;
  public currentTimeline: TimelineBuilder;
  public currentAnimateTimings: AnimateTimings | null = null;
  public previousNode: Ast<AnimationMetadataType> = DEFAULT_NOOP_PREVIOUS_NODE;
  public subContextCount = 0;
  public options: AnimationOptions = {};
  public currentQueryIndex: number = 0;
  public currentQueryTotal: number = 0;
  public currentStaggerTime: number = 0;

  constructor(
    private _driver: AnimationDriver,
    public element: any,
    public subInstructions: ElementInstructionMap,
    private _enterClassName: string,
    private _leaveClassName: string,
    public errors: Error[],
    public timelines: TimelineBuilder[],
    initialTimeline?: TimelineBuilder,
  ) {
    this.currentTimeline = initialTimeline || new TimelineBuilder(this._driver, element, 0);
    timelines.push(this.currentTimeline);
  }

  get params() {
    return this.options.params;
  }

  updateOptions(options: AnimationOptions | null, skipIfExists?: boolean) {
    if (!options) return;

    const newOptions = options as any;
    let optionsToUpdate = this.options;

    // NOTE: 이는 다른 애니메이션 메서드가 기간 오버라이드를 지원할 때 수정될 것입니다.
    if (newOptions.duration != null) {
      (optionsToUpdate as any).duration = resolveTimingValue(newOptions.duration);
    }

    if (newOptions.delay != null) {
      optionsToUpdate.delay = resolveTimingValue(newOptions.delay);
    }

    const newParams = newOptions.params;
    if (newParams) {
      let paramsToUpdate: {[name: string]: any} = optionsToUpdate.params!;
      if (!paramsToUpdate) {
        paramsToUpdate = this.options.params = {};
      }

      Object.keys(newParams).forEach((name) => {
        if (!skipIfExists || !paramsToUpdate.hasOwnProperty(name)) {
          paramsToUpdate[name] = interpolateParams(newParams[name], paramsToUpdate, this.errors);
        }
      });
    }
  }

  private _copyOptions() {
    const options: AnimationOptions = {};
    if (this.options) {
      const oldParams = this.options.params;
      if (oldParams) {
        const params: {[name: string]: any} = (options['params'] = {});
        Object.keys(oldParams).forEach((name) => {
          params[name] = oldParams[name];
        });
      }
    }
    return options;
  }

  createSubContext(
    options: AnimationOptions | null = null,
    element?: any,
    newTime?: number,
  ): AnimationTimelineContext {
    const target = element || this.element;
    const context = new AnimationTimelineContext(
      this._driver,
      target,
      this.subInstructions,
      this._enterClassName,
      this._leaveClassName,
      this.errors,
      this.timelines,
      this.currentTimeline.fork(target, newTime || 0),
    );
    context.previousNode = this.previousNode;
    context.currentAnimateTimings = this.currentAnimateTimings;

    context.options = this._copyOptions();
    context.updateOptions(options);

    context.currentQueryIndex = this.currentQueryIndex;
    context.currentQueryTotal = this.currentQueryTotal;
    context.parentContext = this;
    this.subContextCount++;
    return context;
  }

  transformIntoNewTimeline(newTime?: number) {
    this.previousNode = DEFAULT_NOOP_PREVIOUS_NODE;
    this.currentTimeline = this.currentTimeline.fork(this.element, newTime);
    this.timelines.push(this.currentTimeline);
    return this.currentTimeline;
  }

  appendInstructionToTimeline(
    instruction: AnimationTimelineInstruction,
    duration: number | null,
    delay: number | null,
  ): AnimateTimings {
    const updatedTimings: AnimateTimings = {
      duration: duration != null ? duration : instruction.duration,
      delay: this.currentTimeline.currentTime + (delay != null ? delay : 0) + instruction.delay,
      easing: '',
    };
    const builder = new SubTimelineBuilder(
      this._driver,
      instruction.element,
      instruction.keyframes,
      instruction.preStyleProps,
      instruction.postStyleProps,
      updatedTimings,
      instruction.stretchStartingKeyframe,
    );
    this.timelines.push(builder);
    return updatedTimings;
  }

  incrementTime(time: number) {
    this.currentTimeline.forwardTime(this.currentTimeline.duration + time);
  }

  delayNextStep(delay: number) {
    // 음수 지연은 아직 지원되지 않습니다.
    if (delay > 0) {
      this.currentTimeline.delayNextStep(delay);
    }
  }

  invokeQuery(
    selector: string,
    originalSelector: string,
    limit: number,
    includeSelf: boolean,
    optional: boolean,
    errors: Error[],
  ): any[] {
    let results: any[] = [];
    if (includeSelf) {
      results.push(this.element);
    }
    if (selector.length > 0) {
      // :self가 사용될 경우에만 선택자가 비어 있을 수 있습니다.
      selector = selector.replace(ENTER_TOKEN_REGEX, '.' + this._enterClassName);
      selector = selector.replace(LEAVE_TOKEN_REGEX, '.' + this._leaveClassName);
      const multi = limit != 1;
      let elements = this._driver.query(this.element, selector, multi);
      if (limit !== 0) {
        elements =
          limit < 0
            ? elements.slice(elements.length + limit, elements.length)
            : elements.slice(0, limit);
      }
      results.push(...elements);
    }

    if (!optional && results.length == 0) {
      errors.push(invalidQuery(originalSelector));
    }
    return results;
  }
}

export class TimelineBuilder {
  public duration: number = 0;
  public easing: string | null = null;
  private _previousKeyframe: ɵStyleDataMap = new Map();
  private _currentKeyframe: ɵStyleDataMap = new Map();
  private _keyframes = new Map<number, ɵStyleDataMap>();
  private _styleSummary = new Map<string, StyleAtTime>();
  private _localTimelineStyles: ɵStyleDataMap = new Map();
  private _globalTimelineStyles: ɵStyleDataMap;
  private _pendingStyles: ɵStyleDataMap = new Map();
  private _backFill: ɵStyleDataMap = new Map();
  private _currentEmptyStepKeyframe: ɵStyleDataMap | null = null;

  constructor(
    private _driver: AnimationDriver,
    public element: any,
    public startTime: number,
    private _elementTimelineStylesLookup?: Map<any, ɵStyleDataMap>,
  ) {
    if (!this._elementTimelineStylesLookup) {
      this._elementTimelineStylesLookup = new Map<any, ɵStyleDataMap>();
    }

    this._globalTimelineStyles = this._elementTimelineStylesLookup.get(element)!;
    if (!this._globalTimelineStyles) {
      this._globalTimelineStyles = this._localTimelineStyles;
      this._elementTimelineStylesLookup.set(element, this._localTimelineStyles);
    }
    this._loadKeyframe();
  }

  containsAnimation(): boolean {
    switch (this._keyframes.size) {
      case 0:
        return false;
      case 1:
        return this.hasCurrentStyleProperties();
      default:
        return true;
    }
  }

  hasCurrentStyleProperties(): boolean {
    return this._currentKeyframe.size > 0;
  }

  get currentTime() {
    return this.startTime + this.duration;
  }

  delayNextStep(delay: number) {
    // style() 단계가 stagger() 보다 직전에 배치될 경우에는
    // style() 단계가 애니메이션 내의 첫 번째 style() 값이라면
    // 지연 적용을 위해 keyframe [0, 복사, 1]을 만듭니다.
    const hasPreStyleStep = this._keyframes.size === 1 && this._pendingStyles.size;

    if (this.duration || hasPreStyleStep) {
      this.forwardTime(this.currentTime + delay);
      if (hasPreStyleStep) {
        this.snapshotCurrentStyles();
      }
    } else {
      this.startTime += delay;
    }
  }

  fork(element: any, currentTime?: number): TimelineBuilder {
    this.applyStylesToKeyframe();
    return new TimelineBuilder(
      this._driver,
      element,
      currentTime || this.currentTime,
      this._elementTimelineStylesLookup,
    );
  }

  private _loadKeyframe() {
    if (this._currentKeyframe) {
      this._previousKeyframe = this._currentKeyframe;
    }
    this._currentKeyframe = this._keyframes.get(this.duration)!;
    if (!this._currentKeyframe) {
      this._currentKeyframe = new Map();
      this._keyframes.set(this.duration, this._currentKeyframe);
    }
  }

  forwardFrame() {
    this.duration += ONE_FRAME_IN_MILLISECONDS;
    this._loadKeyframe();
  }

  forwardTime(time: number) {
    this.applyStylesToKeyframe();
    this.duration = time;
    this._loadKeyframe();
  }

  private _updateStyle(prop: string, value: string | number) {
    this._localTimelineStyles.set(prop, value);
    this._globalTimelineStyles.set(prop, value);
    this._styleSummary.set(prop, {time: this.currentTime, value});
  }

  allowOnlyTimelineStyles() {
    return this._currentEmptyStepKeyframe !== this._currentKeyframe;
  }

  applyEmptyStep(easing: string | null) {
    if (easing) {
      this._previousKeyframe.set('easing', easing);
    }

    // animate(duration)에 대한 특별한 경우입니다:
    // 모든 누락된 스타일들은 `*` 값으로 채워진 다음
    // 동일한 키프레임에서 목적지 스타일이 나중에 채워지면
    // 이전 스타일을 오버라이드합니다.
    // 우리는 여기에서 `_globalTimelineStyles`를 사용합니다.
    // 이전 키프레임에서 이 타임라인에 없는 스타일이 존재할 수 있기 때문입니다.
    for (let [prop, value] of this._globalTimelineStyles) {
      this._backFill.set(prop, value || AUTO_STYLE);
      this._currentKeyframe.set(prop, AUTO_STYLE);
    }
    this._currentEmptyStepKeyframe = this._currentKeyframe;
  }

  setStyles(
    input: Array<ɵStyleDataMap | string>,
    easing: string | null,
    errors: Error[],
    options?: AnimationOptions,
  ) {
    if (easing) {
      this._previousKeyframe.set('easing', easing);
    }
    const params = (options && options.params) || {};
    const styles = flattenStyles(input, this._globalTimelineStyles);
    for (let [prop, value] of styles) {
      const val = interpolateParams(value, params, errors);
      this._pendingStyles.set(prop, val);
      if (!this._localTimelineStyles.has(prop)) {
        this._backFill.set(prop, this._globalTimelineStyles.get(prop) ?? AUTO_STYLE);
      }
      this._updateStyle(prop, val);
    }
  }

  applyStylesToKeyframe() {
    if (this._pendingStyles.size == 0) return;

    this._pendingStyles.forEach((val, prop) => {
      this._currentKeyframe.set(prop, val);
    });
    this._pendingStyles.clear();

    this._localTimelineStyles.forEach((val, prop) => {
      if (!this._currentKeyframe.has(prop)) {
        this._currentKeyframe.set(prop, val);
      }
    });
  }

  snapshotCurrentStyles() {
    for (let [prop, val] of this._localTimelineStyles) {
      this._pendingStyles.set(prop, val);
      this._updateStyle(prop, val);
    }
  }

  getFinalKeyframe() {
    return this._keyframes.get(this.duration);
  }

  get properties() {
    const properties: string[] = [];
    for (let prop in this._currentKeyframe) {
      properties.push(prop);
    }
    return properties;
  }

  mergeTimelineCollectedStyles(timeline: TimelineBuilder) {
    timeline._styleSummary.forEach((details1, prop) => {
      const details0 = this._styleSummary.get(prop);
      if (!details0 || details1.time > details0.time) {
        this._updateStyle(prop, details1.value);
      }
    });
  }

  buildKeyframes(): AnimationTimelineInstruction {
    this.applyStylesToKeyframe();
    const preStyleProps = new Set<string>();
    const postStyleProps = new Set<string>();
    const isEmpty = this._keyframes.size === 1 && this.duration === 0;

    let finalKeyframes: Array<ɵStyleDataMap> = [];
    this._keyframes.forEach((keyframe, time) => {
      const finalKeyframe = new Map([...this._backFill, ...keyframe]);
      finalKeyframe.forEach((value, prop) => {
        if (value === PRE_STYLE) {
          preStyleProps.add(prop);
        } else if (value === AUTO_STYLE) {
          postStyleProps.add(prop);
        }
      });
      if (!isEmpty) {
        finalKeyframe.set('offset', time / this.duration);
      }
      finalKeyframes.push(finalKeyframe);
    });

    const preProps: string[] = [...preStyleProps.values()];
    const postProps: string[] = [...postStyleProps.values()];

    // 스타일을 화면에 표시하기 위한 0초 애니메이션에 대한 특별한 경우입니다.
    if (isEmpty) {
      const kf0 = finalKeyframes[0];
      const kf1 = new Map(kf0);
      kf0.set('offset', 0);
      kf1.set('offset', 1);
      finalKeyframes = [kf0, kf1];
    }

    return createTimelineInstruction(
      this.element,
      finalKeyframes,
      preProps,
      postProps,
      this.duration,
      this.startTime,
      this.easing,
      false,
    );
  }
}

class SubTimelineBuilder extends TimelineBuilder {
  public timings: AnimateTimings;

  constructor(
    driver: AnimationDriver,
    element: any,
    public keyframes: Array<ɵStyleDataMap>,
    public preStyleProps: string[],
    public postStyleProps: string[],
    timings: AnimateTimings,
    private _stretchStartingKeyframe: boolean = false,
  ) {
    super(driver, element, timings.delay);
    this.timings = {duration: timings.duration, delay: timings.delay, easing: timings.easing};
  }

  override containsAnimation(): boolean {
    return this.keyframes.length > 1;
  }

  override buildKeyframes(): AnimationTimelineInstruction {
    let keyframes = this.keyframes;
    let {delay, duration, easing} = this.timings;
    if (this._stretchStartingKeyframe && delay) {
      const newKeyframes: Array<ɵStyleDataMap> = [];
      const totalTime = duration + delay;
      const startingGap = delay / totalTime;

      // 원래 시작 키프레임이 이제 지연이 끝난 후 시작됩니다.
      const newFirstKeyframe = new Map(keyframes[0]);
      newFirstKeyframe.set('offset', 0);
      newKeyframes.push(newFirstKeyframe);

      const oldFirstKeyframe = new Map(keyframes[0]);
      oldFirstKeyframe.set('offset', roundOffset(startingGap));
      newKeyframes.push(oldFirstKeyframe);

      /*
        키프레임이 늘어나면 애니메이션 시작 전에 지연이 없어진 것입니다.
        대신 첫 번째 키프레임은 애니메이션 시작 시점에 놓이게 되고
        원래의 지연이 끝나면 그곳에 복사됩니다. 이는 기본적으로
        지연 동안 애니메이션이 발생하지 않고 스타일만 렌더링되도록 합니다.
        이를 위해 원래 키프레임의 기존 오프셋 값들은 
        키프레임 늘리기를 고려하여 "왜곡"되어야 합니다.

        delay=1000, duration=1000, keyframes = 0 .5 1

        은

        delay=0, duration=2000, keyframes = 0 .33 .66 1
       */

      // 1 ... n -1 간의 오프셋은 모두 키프레임 스트레치로 왜곡됩니다.
      const limit = keyframes.length - 1;
      for (let i = 1; i <= limit; i++) {
        let kf = new Map(keyframes[i]);
        const oldOffset = kf.get('offset') as number;
        const timeAtKeyframe = delay + oldOffset * duration;
        kf.set('offset', roundOffset(timeAtKeyframe / totalTime));
        newKeyframes.push(kf);
      }

      // 새로운 시작 키프레임이 시작 시점에 추가되어야 합니다.
      duration = totalTime;
      delay = 0;
      easing = '';

      keyframes = newKeyframes;
    }

    return createTimelineInstruction(
      this.element,
      keyframes,
      this.preStyleProps,
      this.postStyleProps,
      duration,
      delay,
      easing,
      true,
    );
  }
}

function roundOffset(offset: number, decimalPoints = 3): number {
  const mult = Math.pow(10, decimalPoints - 1);
  return Math.round(offset * mult) / mult;
}

function flattenStyles(input: Array<ɵStyleDataMap | string>, allStyles: ɵStyleDataMap) {
  const styles: ɵStyleDataMap = new Map();
  let allProperties: string[] | IterableIterator<string>;
  input.forEach((token) => {
    if (token === '*') {
      allProperties ??= allStyles.keys();
      for (let prop of allProperties) {
        styles.set(prop, AUTO_STYLE);
      }
    } else {
      for (let [prop, val] of token as ɵStyleDataMap) {
        styles.set(prop, val);
      }
    }
  });
  return styles;
}
