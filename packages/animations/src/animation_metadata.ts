/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 애니메이션 스타일에서 사용할 CSS 스타일 세트를 나타냅니다.
 */
export interface ɵStyleData {
  [key: string]: string | number;
}

/**
 * 애니메이션 스타일에서 사용할 CSS 스타일 세트를 Map 형태로 나타냅니다.
 */
export type ɵStyleDataMap = Map<string, string | number>;

/**
 * 애니메이션 스텝을 위한 타이밍 매개변수를 나타냅니다.
 * @see {@link animate}
 *
 * @publicApi
 */
export declare type AnimateTimings = {
  /**
   * 애니메이션 스텝의 전체 기간. 숫자와 선택적 시간 단위,
   * 예를 들어 "1s" 또는 "10ms"는 각각 1초 및 10밀리초입니다.
   * 기본 단위는 밀리초입니다.
   */
  duration: number;
  /**
   * 애니메이션 스텝을 적용하는 지연 시간. 숫자와 선택적 시간 단위.
   * 기본 단위는 밀리초입니다.
   */
  delay: number;
  /**
   * 애니메이션 스텝이 실행되는 동안 가속 및 감속을 제어하는 완화 스타일.
   * `cubic-bezier()`와 같은 완화 함수나 다음 상수 중 하나:
   * - `ease-in`
   * - `ease-out`
   * - `ease-in-and-out`
   */
  easing: string | null;
};

/**
 * @description 애니메이션 스타일링 및 타이밍을 제어하는 옵션.
 *
 * 다음 애니메이션 함수는 `AnimationOptions` 데이터를 받아들입니다:
 *
 * - `transition()`
 * - `sequence()`
 * - `{@link /api/animations/group group()}`
 * - `query()`
 * - `animation()`
 * - `useAnimation()`
 * - `animateChild()`
 *
 * `AnimationBuilder` 서비스를 사용하여 구축된 프로그래밍적 애니메이션도
 * `AnimationOptions`를 사용합니다.
 *
 * @publicApi
 */
export declare interface AnimationOptions {
  /**
   * 애니메이션 작업을 시작하기 위한 시간 지연을 설정합니다.
   * 숫자와 선택적 시간 단위, 예를 들어 "1s" 또는 "10ms"는 각각 1초
   * 및 10밀리초입니다. 기본 단위는 밀리초입니다.
   * 기본값은 0으로, 지연이 없음을 의미합니다.
   */
  delay?: number | string;
  /**
   * 애니메이션 작업이 시작될 때 스타일링 및 타이밍을 수정하는 개발자 정의 매개변수 세트입니다.
   * 기본값으로 사용되는 키-값 쌍의 배열입니다.
   */
  params?: {[name: string]: any};
}

/**
 * 자식 애니메이션에 대한 애니메이션 스타일링 및 타이밍을 제어하는 지속 시간 옵션을 추가합니다.
 *
 * @see {@link animateChild}
 *
 * @publicApi
 */
export declare interface AnimateChildOptions extends AnimationOptions {
  duration?: number | string;
}

/**
 * @description 애니메이션을 정의할 수 있는 매개변수의 카테고리에 대한 상수입니다.
 *
 * 해당 기능에 따라 각 카테고리의 매개변수를 정의하고
 * 이를 해당 `AnimationMetadata` 객체로 수집합니다.
 *
 * @publicApi
 */
export enum AnimationMetadataType {
  /**
   * 이름이 지정된 애니메이션 상태를 CSS 스타일 세트와 연결합니다.
   * [`state()`](api/animations/state)를 참조하십시오.
   */
  State = 0,
  /**
   * 한 애니메이션 상태에서 다른 상태로의 전환에 대한 데이터입니다.
   * `transition()`을 참조하십시오.
   */
  Transition = 1,
  /**
   * 애니메이션 스텝 세트를 포함합니다.
   * `sequence()`를 참조하십시오.
   */
  Sequence = 2,
  /**
   * 애니메이션 스텝 세트를 포함합니다.
   * {@link /api/animations/group group()}를 참조하십시오.
   */
  Group = 3,
  /**
   * 애니메이션 스텝을 포함합니다.
   * `animate()`를 참조하십시오.
   */
  Animate = 4,
  /**
   * 애니메이션 스텝 세트를 포함합니다.
   * `keyframes()`를 참조하십시오.
   */
  Keyframes = 5,
  /**
   * CSS 속성-값 쌍 세트를 이름이 있는 스타일로 포함합니다.
   * `style()`을 참조하십시오.
   */
  Style = 6,
  /**
   * 요소에 첨부할 수 있는 진입 트리거와 애니메이션을 연결합니다.
   * `trigger()`를 참조하십시오.
   */
  Trigger = 7,
  /**
   * 재사용 가능한 애니메이션을 포함합니다.
   * `animation()`을 참조하십시오.
   */
  Reference = 8,
  /**
   * 쿼리에서 반환된 자식 애니메이션을 실행하는 데 사용할 데이터를 포함합니다.
   * `animateChild()`를 참조하십시오.
   */
  AnimateChild = 9,
  /**
   * 재사용 가능한 애니메이션에 대한 애니메이션 매개변수를 포함합니다.
   * `useAnimation()`을 참조하십시오.
   */
  AnimateRef = 10,
  /**
   * 자식 애니메이션 쿼리 데이터를 포함합니다.
   * `query()`를 참조하십시오.
   */
  Query = 11,
  /**
   * 애니메이션 시퀀스를 비대칭으로 만드는 데이터입니다.
   * `stagger()`를 참조하십시오.
   */
  Stagger = 12,
}

/**
 * 자동 스타일링을 지정합니다.
 *
 * @publicApi
 */
export const AUTO_STYLE = '*';

/**
 * 애니메이션 데이터 구조의 기초입니다.
 *
 * @publicApi
 */
export interface AnimationMetadata {
  type: AnimationMetadataType;
}

/**
 * 애니메이션 트리거를 포함합니다. `trigger()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationTriggerMetadata extends AnimationMetadata {
  /**
   * 트리거 이름, 요소와 연결하는 데 사용됩니다. 구성 요소 내에서 고유합니다.
   */
  name: string;
  /**
   * 상태 및 전환 선언 배열을 포함하는 애니메이션 정의 객체입니다.
   */
  definitions: AnimationMetadata[];
  /**
   * 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
   * 호출 시 오버라이드할 수 있습니다. 기본 지연은 0입니다.
   */
  options: {params?: {[name: string]: any}} | null;
}

/**
 * 애니메이션 상태를 캡슐화합니다. 상태 이름과 CSS 스타일 세트를 연결합니다.
 * [`state()`](api/animations/state) 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationStateMetadata extends AnimationMetadata {
  /**
   * 상태 이름, 구성 요소 내에서 고유합니다.
   */
  name: string;
  /**
   * 이 상태와 연결된 CSS 스타일입니다.
   */
  styles: AnimationStyleMetadata;
  /**
   * 호출 시 오버라이드할 수 있는 스타일 기본값을 제공하는
   * 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
   */
  options?: {params: {[name: string]: any}};
}

/**
 * 애니메이션 전환을 캡슐화합니다. `transition()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationTransitionMetadata extends AnimationMetadata {
  /**
   * 상태 변경을 설명하는 표현식입니다.
   */
  expr:
    | string
    | ((
        fromState: string,
        toState: string,
        element?: any,
        params?: {[key: string]: any},
      ) => boolean);
  /**
   * 이 전환에 적용되는 하나 이상의 애니메이션 객체입니다.
   */
  animation: AnimationMetadata | AnimationMetadata[];
  /**
   * 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
   * 호출 시 오버라이드할 수 있습니다. 기본 지연은 0입니다.
   */
  options: AnimationOptions | null;
}

/**
 * 재사용 가능한 애니메이션을 캡슐화합니다. 개별 애니메이션 스텝의 모음입니다.
 * `animation()` 함수에 의해 인스턴스화되고 반환되며,
 * `useAnimation()` 함수에 전달됩니다.
 *
 * @publicApi
 */
export interface AnimationReferenceMetadata extends AnimationMetadata {
  /**
   * 하나 이상의 애니메이션 스텝 객체입니다.
   */
  animation: AnimationMetadata | AnimationMetadata[];
  /**
   * 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
   * 호출 시 오버라이드할 수 있습니다. 기본 지연은 0입니다.
   */
  options: AnimationOptions | null;
}

/**
 * 애니메이션 쿼리를 캡슐화합니다. `query()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationQueryMetadata extends AnimationMetadata {
  /**
   * 이 쿼리의 CSS 선택자입니다.
   */
  selector: string;
  /**
   * 하나 이상의 애니메이션 스텝 객체입니다.
   */
  animation: AnimationMetadata | AnimationMetadata[];
  /**
   * 쿼리 옵션 객체입니다.
   */
  options: AnimationQueryOptions | null;
}

/**
 * 키프레임 시퀀스를 캡슐화합니다. `keyframes()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationKeyframesSequenceMetadata extends AnimationMetadata {
  /**
   * 애니메이션 스타일 배열입니다.
   */
  steps: AnimationStyleMetadata[];
}

/**
 * 애니메이션 스타일을 캡슐화합니다. `style()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationStyleMetadata extends AnimationMetadata {
  /**
   * CSS 스타일 속성 세트입니다.
   */
  styles: '*' | {[key: string]: string | number} | Array<{[key: string]: string | number} | '*'>;
  /**
   * 스타일이 적용되는 총 애니메이션 시간의 백분율입니다.
   */
  offset: number | null;
}

/**
 * 애니메이션 스텝을 캡슐화합니다. `animate()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationAnimateMetadata extends AnimationMetadata {
  /**
   * 스텝의 타이밍 데이터입니다.
   */
  timings: string | number | AnimateTimings;
  /**
   * 스텝에서 사용되는 스타일 세트입니다.
   */
  styles: AnimationStyleMetadata | AnimationKeyframesSequenceMetadata | null;
}

/**
 * 자식 애니메이션을 캡슐화합니다. 부모가 실행될 때 명시적으로 실행할 수 있습니다.
 * `animateChild` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationAnimateChildMetadata extends AnimationMetadata {
  /**
   * 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
   * 호출 시 오버라이드할 수 있습니다. 기본 지연은 0입니다.
   */
  options: AnimationOptions | null;
}

/**
 * 재사용 가능한 애니메이션을 캡슐화합니다.
 * `useAnimation()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationAnimateRefMetadata extends AnimationMetadata {
  /**
   * 애니메이션 참조 객체입니다.
   */
  animation: AnimationReferenceMetadata;
  /**
   * 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
   * 호출 시 오버라이드할 수 있습니다. 기본 지연은 0입니다.
   */
  options: AnimationOptions | null;
}

/**
 * 애니메이션 시퀀스를 캡슐화합니다.
 * `sequence()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationSequenceMetadata extends AnimationMetadata {
  /**
   * 애니메이션 스텝 객체 배열입니다.
   */
  steps: AnimationMetadata[];
  /**
   * 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
   * 호출 시 오버라이드할 수 있습니다. 기본 지연은 0입니다.
   */
  options: AnimationOptions | null;
}

/**
 * 애니메이션 그룹을 캡슐화합니다.
 * `group()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 */
export interface AnimationGroupMetadata extends AnimationMetadata {
  /**
   * 이 그룹을 형성하는 하나 이상의 애니메이션 또는 스타일 스텝입니다.
   */
  steps: AnimationMetadata[];
  /**
   * 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
   * 호출 시 오버라이드할 수 있습니다. 기본 지연은 0입니다.
   */
  options: AnimationOptions | null;
}

/**
 * 애니메이션 쿼리 옵션을 캡슐화합니다.
 * `query()` 함수에 전달됩니다.
 *
 * @publicApi
 */
export declare interface AnimationQueryOptions extends AnimationOptions {
  /**
   * 이 쿼리가 선택적인 경우 true이며, 필요하면 false입니다. 기본값은 false입니다.
   * 필수 쿼리는 쿼리가 실행될 때 요소를 검색하지 않으면 오류를 발생시킵니다. 선택적 쿼리는 그렇지 않습니다.
   */
  optional?: boolean;
  /**
   * 쿼리에서 반환할 최대 총 결과 수입니다.
   * 음수인 경우, 결과는 쿼리 목록의 끝에서 시작하여 초기 방향으로 제한됩니다.
   * 기본적으로 결과는 제한되지 않습니다.
   */
  limit?: number;
}

/**
 * 애니메이션 스텝의 시작 시간을 비대칭으로 만드는 매개변수를 캡슐화합니다.
 * `stagger()` 함수에 의해 인스턴스화되고 반환됩니다.
 *
 * @publicApi
 **/
export interface AnimationStaggerMetadata extends AnimationMetadata {
  /**
   * 스텝에 대한 타이밍 데이터입니다.
   */
  timings: string | number;
  /**
   * 하나 이상의 애니메이션 스텝입니다.
   */
  animation: AnimationMetadata | AnimationMetadata[];
}

/**
 * 이름이 지정된 애니메이션 트리거를 생성합니다. [`state()`](api/animations/state)
 * 및 `transition()` 항목의 목록을 포함하며, 이는 표현식이 바인딩될 때 평가됩니다
 * 트리거입니다.
 *
 * @param name 식별 문자열입니다.
 * @param definitions 애니메이션 정의 객체로, [`state()`](api/animations/state)
 * 및 `transition()` 선언의 배열을 포함합니다.
 *
 * @return 트리거 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * `@Component` 메타데이터의 `animations` 섹션에서 애니메이션 트리거를 정의합니다.
 * 템플릿에서 트리거를 이름으로 참조하고 트리거 표현식에 바인딩하여 정의된
 * 애니메이션 상태로 평가되도록 할 수 있습니다. 다음과 같은 형식을 사용합니다:
 *
 * `[@triggerName]="expression"`
 *
 * 애니메이션 트리거 바인딩은 모든 값을 문자열로 변환한 다음 이전 및 현재
 * 값이 링크된 전환과 일치하는지 확인합니다.
 * 부울은 `1` 또는 `true` 및 `0` 또는 `false`로 지정할 수 있습니다.
 *
 * ### 사용 예
 *
 * 다음 예제는 제공된 이름 값을 기반으로 애니메이션 트리거 참조를 만듭니다.
 * 제공된 애니메이션 값은 상태 및 전환 선언으로 구성된 배열이어야 합니다.
 *
 * ```ts
 * @Component({
 *   selector: "my-component",
 *   templateUrl: "my-component-tpl.html",
 *   animations: [
 *     trigger("myAnimationTrigger", [
 *       state(...),
 *       state(...),
 *       transition(...),
 *       transition(...)
 *     ])
 *   ]
 * })
 * class MyComponent {
 *   myStatusExp = "something";
 * }
 * ```
 *
 * 이 구성 요소와 연결된 템플릿은 템플릿 코드 내의 요소에 바인딩하여 정의된 트리거를 사용합니다.
 *
 * ```html
 * <!-- my-component-tpl.html 내부의 어딘가 -->
 * <div [@myAnimationTrigger]="myStatusExp">...</div>
 * ```
 *
 * ### 인라인 함수 사용
 * `transition` 애니메이션 메서드는 인라인 함수를 읽는 것도 지원합니다. 이 함수는
 * 연결된 애니메이션이 실행될지 결정할 수 있습니다.
 *
 * ```ts
 * // 이 메서드는 `myAnimationTrigger` 트리거 값이 변경될 때마다 실행됩니다.
 * function myInlineMatcherFn(fromState: string, toState: string, element: any, params: {[key:
 string]: any}): boolean {
 *   // `element` 및 `params`가 여기서도 사용할 수 있음을 주목하십시오.
 *   return toState == 'yes-please-animate';
 * }
 *
 * @Component({
 *   selector: 'my-component',
 *   templateUrl: 'my-component-tpl.html',
 *   animations: [
 *     trigger('myAnimationTrigger', [
 *       transition(myInlineMatcherFn, [
 *         // 애니메이션 시퀀스 코드
 *       ]),
 *     ])
 *   ]
 * })
 * class MyComponent {
 *   myStatusExp = "yes-please-animate";
 * }
 * ```
 *
 * ### 애니메이션 비활성화
 * true인 경우, 특수 애니메이션 제어 바인딩 `@.disabled` 바인딩은 모든 애니메이션의 렌더링을 방지합니다.
 * `@.disabled` 바인딩을 요소에 배치하여 요소 자체 및 그 요소 내의 모든 내부 애니메이션 트리거에 대한 애니메이션을 비활성화할 수 있습니다.
 *
 * 다음 예제는 이 기능을 사용하는 방법을 보여줍니다:
 *
 * ```angular-ts
 * @Component({
 *   selector: 'my-component',
 *   template: `
 *     <div [@.disabled]="isDisabled">
 *       <div [@childAnimation]="exp"></div>
 *     </div>
 *   `,
 *   animations: [
 *     trigger("childAnimation", [
 *       // ...
 *     ])
 *   ]
 * })
 * class MyComponent {
 *   isDisabled = true;
 *   exp = '...';
 * }
 * ```
 *
 * `@.disabled`가 true인 경우, `@childAnimation` 트리거가 애니메이션을 실행하지 않도록 방지하며,
 * 모든 내부 애니메이션도 마찬가지입니다.
 *
 * ### 애플리케이션 전반에 걸쳐 애니메이션 비활성화
 * 템플릿의 특정 영역에서 애니메이션이 비활성화되면,
 * **모든** 내부 구성 요소의 애니메이션도 비활성화됩니다.
 * 즉, 호스트 바인딩을 `@.disabled`로 설정하여 최상위 Angular 구성 요소에 대해
 * 앱의 모든 애니메이션을 비활성화할 수 있습니다.
 *
 * ```ts
 * import {Component, HostBinding} from '@angular/core';
 *
 * @Component({
 *   selector: 'app-component',
 *   templateUrl: 'app.component.html',
 * })
 * class AppComponent {
 *   @HostBinding('@.disabled')
 *   public animationsDisabled = true;
 * }
 * ```
 *
 * ### 내부 애니메이션의 비활성화를 Override
 * 내부 애니메이션이 비활성화되더라도, 부모 애니메이션이 비활성화된 템플릿의 내부 요소에 대해 `query()`
 *를 수행하고 필요할 경우 애니메이션을 실행할 수 있습니다. 이는 부모가 하위 애니메이션을 호출할 때도 마찬가지입니다.
 *
 * ### 애니메이션이 비활성화될 때 감지
 * DOM의 특정 영역(또는 전체 애플리케이션)에서 애니메이션이 비활성화된 경우,
 * 애니메이션 트리거 콜백은 여전히 작동하지만 0초 동안만 발생합니다. 콜백이 발생할 때,
 * `AnimationEvent`의 인스턴스를 제공하며, 애니메이션이 비활성화된 경우
 * 이벤트의 `.disabled` 플래그가 true입니다.
 *
 * @publicApi
 */
export function trigger(name: string, definitions: AnimationMetadata[]): AnimationTriggerMetadata {
  return {type: AnimationMetadataType.Trigger, name, definitions, options: {}};
}

/**
 * 스타일 정보와 타이밍 정보를 결합한 애니메이션 스텝을 정의합니다.
 *
 * @param timings 부모 애니메이션에 대한 `AnimateTimings`를 설정합니다.
 * "duration [delay] [easing]" 형식의 문자열입니다.
 *  - 지속 시간 및 지연은 숫자와 선택적 시간 단위로 표현되며,
 * 예를 들어 "1s" 또는 "10ms"는 각각 1초 및 10밀리초입니다.
 * 기본 단위는 밀리초입니다.
 *  - 완화 값은 애니메이션이 실행되는 동안 가속 및 감속하는 방법을 제어합니다. 값은
 * `ease`, `ease-in`, `ease-out`,
 * `ease-in-out` 중 하나이거나 `cubic-bezier()` 함수 호출이어야 합니다.
 * 제공되지 않으면 완화가 적용되지 않습니다.
 *
 * 예를 들어, "1s 100ms ease-out" 문자열은 1000밀리초의 지속 시간과
 * 100밀리초의 지연 및 "ease-out" 완화 스타일을 지정합니다.
 * @param styles 부모 애니메이션을 위한 AnimationStyles를 설정합니다.
 * `style()` 또는 `keyframes()` 함수 호출로 CSS 스타일 항목을 적용하는 함수입니다.
 * null인 경우, 대상 상태의 스타일을 사용합니다.
 * 최종 애니메이션을 완성하는 애니메이션 스텝을 설명할 때 유용합니다.
 * `transitions()`의 "최종 상태로 애니메이션 하기"를 참조하십시오.
 * @returns 애니메이션 스텝을 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * 애니메이션 `sequence()`, {@link /api/animations/group group()}, 또는
 * `transition()` 호출 내에서 호출하여 주어진 시간 동안 부모 애니메이션에
 * 주어진 스타일 데이터를 적용하는 애니메이션 스텝을 지정합니다.
 *
 * ### 구문 예제
 * **타이밍 예제**
 *
 * 다음 예제에서는 다양한 `timings` 사양을 보여줍니다.
 * - `animate(500)` : 지속 시간은 500밀리초입니다.
 * - `animate("1s")` : 지속 시간은 1000밀리초입니다.
 * - `animate("100ms 0.5s")` : 지속 시간은 100밀리초, 지연은 500밀리초입니다.
 * - `animate("5s ease-in")` : 지속 시간은 5000밀리초, 완화가 있습니다.
 * - `animate("5s 10ms cubic-bezier(.17,.67,.88,.1)")` : 지속 시간은 5000밀리초, 지연은 10
 * 밀리초이며, 베지어 곡선에 따라 완화됩니다.
 *
 * **스타일 예제**
 *
 * 다음 예제에서는 `style()`을 호출하여 단일 CSS 스타일을 설정합니다.
 * ```ts
 * animate(500, style({ background: "red" }))
 * ```
 * 다음 예제에서는 `keyframes()`를 호출하여 CSS 스타일을
 * 서로 다른 값으로 설정합니다.
 * ```ts
 * animate(500, keyframes(
 *  [
 *   style({ background: "blue" }),
 *   style({ background: "red" })
 *  ])
 * ```
 *
 * @publicApi
 */
export function animate(
  timings: string | number,
  styles: AnimationStyleMetadata | AnimationKeyframesSequenceMetadata | null = null,
): AnimationAnimateMetadata {
  return {type: AnimationMetadataType.Animate, styles, timings};
}

/**
 * @description 동시에 실행되는 애니메이션 스텝의 목록을 정의합니다.
 *
 * @param steps 애니메이션 스텝 객체 배열입니다.
 * - `style()` 또는 `animate()`
 * 함수 호출로 정의된 스텝에서 각 호출은 즉시 실행됩니다.
 * - 나중에 적용할 오프셋 스타일을 지정하려면,
 * `keyframes()`로 스텝을 정의하거나 지연 값이 있는 `animate()`
 * 호출을 사용합니다. 예를 들면:
 *
 * ```ts
 * group([
 *   animate("1s", style({ background: "black" })),
 *   animate("2s", style({ color: "white" }))
 * ])
 * ```
 *
 * @param options 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
 *
 * @return 그룹 데이터 를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * 그룹화된 애니메이션은 일련의 스타일을
 * 서로 다른 시작 시간에 애니메이션하고 다른 종료 시간에 종료해야 할 때 유용합니다.
 *
 * `sequence()` 또는
 * `transition()` 호출 내에서 호출될 때까지 내부 애니메이션 스텝이 완료될 때까지
 * 진행하지 않습니다.
 *
 * @publicApi
 */
export function group(
  steps: AnimationMetadata[],
  options: AnimationOptions | null = null,
): AnimationGroupMetadata {
  return {type: AnimationMetadataType.Group, steps, options};
}

/**
 * 순차적으로 한 번에 실행되는 애니메이션 스텝 목록을 정의합니다.
 *
 * @param steps 애니메이션 스텝 객체 배열입니다.
 * - `style()` 호출로 정의된 스텝은 스타일 데이터를 즉시 적용합니다.
 * - `animate()` 호출로 정의된 스텝은
 * 타이밍 데이터에 의해 정해진 대로 시간이 지남에 따라 스타일 데이터를 적용합니다.
 *
 * ```ts
 * sequence([
 *   style({ opacity: 0 }),
 *   animate("1s", style({ opacity: 1 }))
 * ])
 * ```
 *
 * @param options 지연 및 스타일 기본값을 제공하는 개발자 정의 매개변수를 포함하는 옵션 객체입니다.
 *
 * @return 시퀀스 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * `transition()` 호출에 스텝 배열을 전달하면
 * 스텝이 기본적으로 순차적으로 실행됩니다.
 * {@link /api/animations/group group()} 호출과 비교하면,
 * 애니메이션 스텝은 동시에 실행됩니다.
 *
 * 시퀀스가 {@link /api/animations/group group()} 또는 `transition()` 호출 내에서 사용될 때
 * 각 내부 애니메이션 스텝이 완료될 때까지 다음 지침으로 계속 진행하지 않습니다.
 *
 * @publicApi
 **/
export function sequence(
  steps: AnimationMetadata[],
  options: AnimationOptions | null = null,
): AnimationSequenceMetadata {
  return {type: AnimationMetadataType.Sequence, steps, options};
}

/**
 * 애니메이션 [`state`](api/animations/state)에서 사용될 수 있는 CSS 속성/스타일을 포함하는
 * 키/값 객체를 선언합니다.
 *
 * @param tokens 애니메이션 상태와 연관된 CSS 스타일 또는 HTML 스타일 세트입니다.
 * 값은 다음 중 하나일 수 있습니다:
 * - CSS 속성의 값을 연관짓는 키-값 스타일 쌍.
 * - 키-값 스타일 쌍의 배열.
 * - 자동 스타일링을 사용하기 위한 별표(*)로, 스타일은
 * 애니메이션 시작 시 애니메이션되는 요소에서 유래하여 적용됩니다.
 *
 * 자동 스타일링은 레이아웃이나 기타 환경적 요인에 따라 달라지는 상태를 정의하는 데 사용할 수 있습니다.
 *
 * @return 스타일 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * 다음 예제는 CSS 속성 값 세트를 수집하는 애니메이션 스타일을 생성합니다:
 *
 * ```ts
 * // CSS 속성을 위한 문자열 값
 * style({ background: "red", color: "blue" })
 *
 * // 숫자 픽셀 값
 * style({ width: 100, height: 0 })
 * ```
 *
 * 다음 예제는 자동 스타일링을 사용하여 요소가 0의 높이에서
 * 전체 높이로 애니메이션되도록 합니다:
 *
 * ```ts
 * style({ height: 0 }),
 * animate("1s", style({ height: "*" }))
 * ```
 *
 * @publicApi
 **/
export function style(
  tokens: '*' | {[key: string]: string | number} | Array<'*' | {[key: string]: string | number}>,
): AnimationStyleMetadata {
  return {type: AnimationMetadataType.Style, styles: tokens, offset: null};
}

/**
 * 요소에 부착된 트리거 내에서 애니메이션 상태를 선언합니다.
 *
 * @param name 정의된 상태의 하나 이상의 이름으로, 쉼표로 구분된 문자열입니다.
 * 다음 예약된 상태 이름으로 특정 사용 사례에 대한 스타일을 정의할 수 있습니다:
 *
 * - `void` 이 이름과 연결된 스타일을 사용하여 애플리케이션에서 요소가 분리될 때 사용합니다.
 * 예를 들어, `ngIf`가 false로 평가되면 해당 요소의 상태가 void입니다.
 *  - `*` (별표)은 기본 상태를 나타냅니다. 이는 애니메이션되고 있는 상태가
 * 트리거 내에 선언되어 있지 않을 때 사용될 기본 스타일입니다.
 *
 * @param styles 이 상태와 연결된 CSS 스타일 세트로,
 * `style()` 함수를 사용하여 생성됩니다.
 * 상태에 도달하면 이 스타일 세트가 요소에 지속됩니다.
 * @param options 호출 시 상태에 전달될 수 있는 매개변수입니다.
 * 0개 이상의 키-값 쌍입니다.
 * @return 새로운 상태 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * `trigger()` 함수를 사용하여 애니메이션 트리거에 상태를 등록합니다.
 * `transition()` 함수를 사용하여 상태 간 애니메이션을 실행합니다.
 * 구성 요소 내에서 상태가 활성화되면,
 * 해당 상태에 연결된 스타일은 애니메이션이 끝날 때까지도 요소에 유지됩니다.
 *
 * @publicApi
 **/
export function state(
  name: string,
  styles: AnimationStyleMetadata,
  options?: {params: {[name: string]: any}},
): AnimationStateMetadata {
  return {type: AnimationMetadataType.State, name, styles, options};
}

/**
 * 각 스타일을 선택적 `offset` 값과 연관시키는 애니메이션 스타일 세트를 정의합니다.
 *
 * @param steps 선택적 오프셋 데이터를 포함하는 애니메이션 스타일 세트입니다.
 * 스타일에 대한 선택적 `offset` 값은 해당 스타일이 적용되는 
 * 총 애니메이션 시간의 백분율을 지정합니다.
 * @returns 키프레임 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * `animate()` 호출과 함께 사용합니다. 현재 상태에서
 * 최종 상태로 애니메이션하는 대신, 키프레임은 
 * 각 스타일 항목이 적용되는 방법과 애니메이션 호의 내에서
 * 적용되는 시점을 설명합니다.
 * [CSS 키프레임 애니메이션](https://www.w3schools.com/css/css3_animations.asp)와 비교하세요.
 *
 * ### 사용 예
 * 다음 예제에서는 오프셋 값이 각 `backgroundColor` 값이 적용되는 시점을 설명합니다.
 * 색상은 시작할 때 빨간색이며,
 * 전체 시간의 20%가 경과했을 때 파란색으로 바뀝니다.
 *
 * ```ts
 * // 제공된 오프셋 값
 * animate("5s", keyframes([
 *   style({ backgroundColor: "red", offset: 0 }),
 *   style({ backgroundColor: "blue", offset: 0.2 }),
 *   style({ backgroundColor: "orange", offset: 0.3 }),
 *   style({ backgroundColor: "black", offset: 1 })
 * ]))
 * ```
 *
 * 스타일 항목에 오프셋 값이 지정되지 않은 경우,
 * 오프셋은 자동으로 계산됩니다.
 *
 * ```ts
 * animate("5s", keyframes([
 *   style({ backgroundColor: "red" }) // offset = 0
 *   style({ backgroundColor: "blue" }) // offset = 0.33
 *   style({ backgroundColor: "orange" }) // offset = 0.66
 *   style({ backgroundColor: "black" }) // offset = 1
 * ]))
 *```

 * @publicApi
 */
export function keyframes(steps: AnimationStyleMetadata[]): AnimationKeyframesSequenceMetadata {
  return {type: AnimationMetadataType.Keyframes, steps};
}

/**
 * 특정 조건이 충족될 때 실행되는 애니메이션 전환을 선언합니다.
 *
 * @param stateChangeExpr 애니메이션 전환이 발생해야 하는 때를 지정하는 특정 형식의 문자열 또는 함수입니다.
 * (자세한 내용은 [상태 변경 표현식](#state-change-expression)을 참조하십시오).
 *
 * @param steps 애니메이션의 지침을 나타내는 하나 이상의 애니메이션 객체입니다.
 *
 * @param options 애니메이션 지연을 지정하거나
 * 사용자 정의 매개변수를 제공하는 데 사용할 수 있는 옵션 객체입니다.
 *
 * @returns 전환 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 *
 * ### 상태 변경 표현식
 *
 * 상태 변경 표현식은 Angular에 전환의 애니메이션을 실행할 때의 타이밍을 알려줍니다.
 *  다음 두 가지 중 하나일 수 있습니다:
 *  - 특정 구문을 가진 문자열
 *  - 이전 및 현재 상태(요소의 트리거에 바인딩된 표현식 값)를 비교하여
 * 전환이 발생해야 하는 경우 `true`, 그렇지 않으면 `false` 를 반환하는 함수입니다.
 *
 * 문자열 형식은 다음과 같습니다:
 *  - `fromState => toState` 이는 전환 애니메이션이
 * 트리거의 요소에서 `fromState`로부터 `toState`로 이동 할 때 발생해야 함을 의미합니다.
 *
 *    _예시:_
 *      ```ts
 *        transition('open => closed', animate('.5s ease-out', style({ height: 0 }) ))
 *      ```
 *
 *  - `fromState <=> toState`, 이는 전환 애니메이션이
 * 트리거 요소의 상태 변화가 `fromState`에서 `toState`로 또는 그 반대의 경우에 발생해야 함을 의미합니다.
 *
 *    _예시:_
 *      ```ts
 *        transition('enabled <=> disabled', animate('1s cubic-bezier(0.8,0.3,0,1)'))
 *      ```
 *
 *  - `:enter`/`:leave`, 이는 요소가 DOM에 진입하거나 존재할 때 전환 애니메이션이 발생해야 함을 나타냅니다.
 *
 *    _예시:_
 *      ```ts
 *        transition(':enter', [
 *          style({ opacity: 0 }),
 *          animate('500ms', style({ opacity: 1 }))
 *        ])
 *      ```
 *
 *  - `:increment`/`:decrement`, 은 애니메이션 요소의
 * 수치 표현에 바인딩된 표현식이 증가 또는 감소하는 경우 전환 애니메이션이 발생해야 한다는 의미입니다.
 *
 *    _예시:_
 *      ```ts
 *        transition(':increment', query('@counter', animateChild()))
 *      ```
 *
 *  - 위의 내용을 모두 포함한 시퀀스로, 이는 전환 애니메이션이 상태 변경 표현식이
 * 하나라도 일치할 때마다 발생해야 함을 의미합니다.
 *
 *    _예시:_
 *      ```ts
 *        transition(':increment, * => enabled, :enter', animate('1s ease', keyframes([
 *          style({ transform: 'scale(1)', offset: 0}),
 *          style({ transform: 'scale(1.1)', offset: 0.7}),
 *          style({ transform: 'scale(1)', offset: 1})
 *        ]))),
 *      ```
 *
 * 다음 사항을 주의하십시오:
 *  - `void`는 요소가 없음을 나타내는 데 사용될 수 있습니다.
 *  - 별표는 모든 상태와 일치하는 와일드카드로 사용될 수 있습니다.
 *  - (위 내용의 결과로, `void => *`는 `:enter`와 동일하며,
 * `* => void`는 `:leave`와 동일합니다.)
 *  - `true`와 `false`는 각각 표현식 값인 `1`과 `0`에 일치합니다
 * (하지만 사실 이 값들은 _참_ 또는 _거짓_ 값과는 일치하지 않습니다).
 *
 * <div class="docs-alert docs-alert-helpful">
 *
 *  요소의 진입 및 퇴거는 개발자에게 일반적인 함정으로 작용하므로 주의하십시오.
 *
 *  트리거가 있는 요소가 DOM에 들어올 경우 `:enter`
 * 전환이 항상 실행되지만, 요소가 부모와 함께 제거될 경우
 * `:leave` 전환이 실행되지 않습니다
 * (전환을 실행할 기회를 가지지 않고 "경고 없이" 제거됩니다.
 * 이러한 전환이 발생할 수 있는 유일한 방법은 요소가 스스로 DOM을 떠나는 경우입니다).
 *
 * </div>
 *
 * ### 최종 상태로 애니메이션하기
 *
 * 전환의 마지막 단계가 `animate()` 호출로
 * 스타일 데이터 없이 시간 값만 사용하는 경우, 해당 단계는 자동으로
 * 최종 애니메이션 아크로 간주됩니다.
 * 최종 상태에 도달하기 위해 Angular는 스타일이 올바른 최종 상태에 있도록
 * 필요한 CSS 스타일을 자동으로 추가하거나 제거합니다.
 *
 * ### 사용 예제
 *
 *  - 트리거의 표현식 값을 기반으로 적용된 전환 애니메이션
 *
 *   ```html
 *   <div [@myAnimationTrigger]="myStatusExp">
 *    ...
 *   </div>
 *   ```
 *
 *   ```ts
 *   trigger("myAnimationTrigger", [
 *     ..., // states
 *     transition("on => off, open => closed", animate(500)),
 *     transition("* <=> error", query('.indicator', animateChild()))
 *   ])
 *   ```
 *
 *  - 트리거의 표현식 값 및 제공된 매개변수에 따라 사용자 정의 논리에 기반하여 적용된 전환 애니메이션
 *
 *    ```html
 *    <div [@myAnimationTrigger]="{
 *     value: stepName,
 *     params: { target: currentTarget }
 *    }">
 *     ...
 *    </div>
 *    ```
 *
 *    ```ts
 *    trigger("myAnimationTrigger", [
 *      ..., // states
 *      transition(
 *        (fromState, toState, _element, params) =>
 *          ['firststep', 'laststep'].includes(fromState.toLowerCase())
 *          && toState === params?.['target'],
 *        animate('1s')
 *      )
 *    ])
 *    ```
 *
 * @publicApi
 **/
export function transition(
  stateChangeExpr:
    | string
    | ((
        fromState: string,
        toState: string,
        element?: any,
        params?: {[key: string]: any},
      ) => boolean),
  steps: AnimationMetadata | AnimationMetadata[],
  options: AnimationOptions | null = null,
): AnimationTransitionMetadata {
  return {type: AnimationMetadataType.Transition, expr: stateChangeExpr, animation: steps, options};
}

/**
 * `useAnimation()` 함수를 호출하여 다른 애니메이션이나 시퀀스에서
 * 호출할 수 있는 재사용 가능한 애니메이션을 생성합니다.
 *
 * @param steps `animate()` 또는 `sequence()` 함수가 반환하는 하나 이상의 애니메이션 객체로,
 * 하나의 상태에서 다른 상태로의 변환을 형성합니다.
 * 배열을 전달하면 기본적으로 시퀀스가 사용됩니다.
 * @param options 애니메이션 시작을 위한 지연 값과 추가적인 개발자 정의 매개변수를
 * 포함할 수 있는 옵션 객체입니다.
 * 추가 매개변수에 제공된 값은 기본값으로 사용되며,
 * 호출 시 오버라이드 값을 전달할 수 있습니다.
 * @returns 애니메이션 데이터를 캡슐화하는 객체를 반환합니다.
 *
 * @usageNotes
 * 다음 예제는 일부 기본 매개변수 값을 제공하는 재사용 가능한 애니메이션을 정의합니다.
 *
 * ```ts
 * var fadeAnimation = animation([
 *   style({ opacity: '{{ start }}' }),
 *   animate('{{ time }}',
 *   style({ opacity: '{{ end }}'}))
 *   ],
 *   { params: { time: '1000ms', start: 0, end: 1 }});
 * ```
 *
 * 다음은 `useAnimation()`을 호출하여 정의된 애니메이션을 호출하고,
 * 오버라이드 매개변수 값을 전달하는 예제입니다.
 *
 * ```js
 * useAnimation(fadeAnimation, {
 *   params: {
 *     time: '2s',
 *     start: 1,
 *     end: 0
 *   }
 * })
 * ```
 *
 * 이 호출에서 전달된 매개변수 값 중 일부가 누락된 경우,
 * 기본값이 사용됩니다. 단계가 애니메이션되기 전에 하나 이상의 매개변수 값이 누락된 경우,
 * `useAnimation()`은 오류를 발생시킵니다.
 *
 * @publicApi
 */
export function animation(
  steps: AnimationMetadata | AnimationMetadata[],
  options: AnimationOptions | null = null,
): AnimationReferenceMetadata {
  return {type: AnimationMetadataType.Reference, animation: steps, options};
}

/**
 * 애니메이션 시퀀스 내에서 쿼리된 내부 애니메이션 요소를 실행합니다.
 *
 * @param options 애니메이션 시작을 위한 지연 값과 개발자 정의 매개변수에 대한
 * 추가 오버라이드 값을 포함할 수 있는 옵션 객체입니다.
 * @return 자식 애니메이션 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * Angular에서 애니메이션이 트리거될 때마다 부모 애니메이션이
 * 우선순위를 가지고 모든 자식 애니메이션은 차단됩니다.
 * 자식 애니메이션을 실행하기 위해서는 부모 애니메이션이 자식 애니메이션을
 * 포함하는 각 요소를 쿼리하고, 이 함수를 사용하여 실행해야 합니다.
 *
 * 이 기능은 `query()`와 함께 사용하도록 설계되었으며,
 * Angular 애니메이션 라이브러리를 사용하여 할당된 애니메이션에서만 작동합니다.
 * CSS 키프레임과 트랜지션은 이 API에서 처리되지 않습니다.
 *
 * @publicApi
 */
export function animateChild(
  options: AnimateChildOptions | null = null,
): AnimationAnimateChildMetadata {
  return {type: AnimationMetadataType.AnimateChild, options};
}

/**
 * `animation()` 함수로 생성된 재사용 가능한 애니메이션을 시작합니다.
 *
 * @param animation 시작할 재사용 가능한 애니메이션입니다.
 * @param options 시작을 위한 지연 값 및
 * 개발자 정의 매개변수에 대한 추가 오버라이드 값을 포함할 수 있는 옵션 객체입니다.
 * @return 애니메이션 매개변수를 포함하는 객체입니다.
 *
 * @publicApi
 */
export function useAnimation(
  animation: AnimationReferenceMetadata,
  options: AnimationOptions | null = null,
): AnimationAnimateRefMetadata {
  return {type: AnimationMetadataType.AnimateRef, animation, options};
}

/**
 * 현재 요소 내의 하나 이상의 내부 요소를 찾습니다.
 * 시퀀스 내에서 애니메이션됩니다. `animate()`와 함께 사용됩니다.
 *
 * @param selector 쿼리할 요소, 또는 다음 중 하나 이상의 토큰으로
 * Angular 전용 특성을 포함하는 요소의 세트입니다.
 *  - `query(":enter")` 또는 `query(":leave")`: 새로 삽입된/제거된 요소 쿼리.
 *     (모든 요소가 이러한 토큰을 통해 쿼리될 수 없습니다. [Entering and Leaving Elements](#entering-and-leaving-elements)를 참조하십시오.)
 *  - `query(":animating")`: 현재 애니메이션 중인 모든 요소 쿼리.
 *  - `query("@triggerName")`: 애니메이션 트리거를 포함하는 요소 쿼리.
 *  - `query("@*")`: 애니메이션 트리거를 포함하는 모든 요소 쿼리.
 *  - `query(":self")`: 애니메이션 시퀀스에 현재 요소 포함.
 *
 * @param animation 쿼리된 요소 또는 요소에 적용될 하나 이상의 애니메이션 스텝입니다.
 * 배열은 애니메이션 시퀀스로 처리됩니다.
 * @param options 옵션 객체. 'limit' 필드를 사용하여 수집할 총 항목 수를 제한합니다.
 * @return 쿼리 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 *
 * ### 여러 토큰
 *
 * 토큰은 결합된 쿼리 선택자 문자열로 병합될 수 있습니다. 예를 들어:
 *
 * ```ts
 *  query(':self, .record:enter, .record:leave, @subTrigger', [...])
 * ```
 *
 * `query()` 함수는 여러 요소를 수집하며 내부적으로
 * `element.querySelectorAll`을 사용합니다. 옵션 객체의 `limit` 필드를 사용하여
 * 수집할 총 항목 수를 제한합니다. 예를 들어:
 *
 * ```js
 * query('div', [
 *   animate(...),
 *   animate(...)
 * ], { limit: 1 })
 * ```
 *
 * 기본적으로 0개의 항목을 찾았을 때 오류를 발생시킵니다.
 * `optional` 플래그를 설정하여 이 오류를 무시할 수 있습니다. 예를 들어:
 *
 * ```js
 * query('.some-element-that-may-not-be-there', [
 *   animate(...),
 *   animate(...)
 * ], { optional: true })
 * ```
 *
 * ### 진입 및 퇴거하는 요소
 *
 * 모든 요소가 `:enter` 및 `:leave` 토큰을 통해 쿼리될 수 있는 것은 아닙니다.
 * Angular가 자신의 논리에 의해 들어가거나 나갈 수 있다고 가정하는 요소만 가능합니다.
 * (삽입/제거가 단순히 부모의 결과라면
 * 다른 토큰을 통해 쿼리되어야 합니다.)
 *
 * Angular가 자신의 논리에 따라 들어가거나 나간다고 가정하는 유일한 요소는:
 *  - 동적으로 삽입된 요소 (ViewContainerRef를 통해)
 *  - 구조적 지시가 있는 요소 (이는 이전 요소들의 서브셋입니다)
 *
 * <div class="docs-alert docs-alert-helpful">
 *
 *  요소가 `:enter`/`:leave`를 통해 성공적으로 쿼리되더라도
 *  삽입/제거가 ViewContainerRef를 통해 수동으로 이루어지지 않거나 구조적 지시로 인한 경우
 *  (이들은 부모와 함께 들어가거나 나갈 수 있습니다)은
 *  주의하십시오.
 *
 * </div>
 *
 * <div class="docs-alert docs-alert-important">
 *
 *  이전에 언급된 내용의 예외가 있습니다.
 * 자신 논리에 의해 들어가거나 나가는 요소 외에도,
 * 애니메이션 트리거가 있는 요소는 부모가 나갈 때
 * 항상 `:leave`를 통해 쿼리될 수 있습니다.
 *
 * </div>
 *
 * ### 사용 예제
 *
 * 다음 예제는 내부 요소를 쿼리하고
 * 각각을 `animate()`를 사용하여 개별적으로 애니메이션합니다.
 *
 * ```angular-ts
 * @Component({
 *   selector: 'inner',
 *   template: `
 *     <div [@queryAnimation]="exp">
 *       <h1>제목</h1>
 *       <div class="content">
 *         블라 블라 블라
 *       </div>
 *     </div>
 *   `,
 *   animations: [
 *    trigger('queryAnimation', [
 *      transition('* => goAnimate', [
 *        // 내부 요소 숨기기
 *        query('h1', style({ opacity: 0 })),
 *        query('.content', style({ opacity: 0 })),
 *
 *        // 내부 요소를 하나씩 애니메이션합니다.
 *        query('h1', animate(1000, style({ opacity: 1 }))),
 *        query('.content', animate(1000, style({ opacity: 1 }))),
 *      ])
 *    ])
 *  ]
 * })
 * class Cmp {
 *   exp = '';
 *
 *   goAnimate() {
 *     this.exp = 'goAnimate';
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export function query(
  selector: string,
  animation: AnimationMetadata | AnimationMetadata[],
  options: AnimationQueryOptions | null = null,
): AnimationQueryMetadata {
  return {type: AnimationMetadataType.Query, selector, animation, options};
}

/**
 * 애니메이션 쿼리() 호출 내에서 사용하여
 * 각 쿼리된 항목이 애니메이션될 때 타이밍 간격을 발생시킵니다.
 *
 * @param timings 지연 값입니다.
 * @param animation 하나 이상의 애니메이션 스텝입니다.
 * @returns 비대칭 데이터를 캡슐화하는 객체입니다.
 *
 * @usageNotes
 * 다음 예제에서 컨테이너 요소는
 * `ngFor`로 채워진 항목 목록을 래핑합니다.
 * 컨테이너 요소는 나중에 내부 항목을 쿼리하도록 설정된 애니메이션 트리거를 포함합니다.
 *
 * 항목이 추가될 때마다 불투명도 페이드 인 애니메이션이 실행되고,
 * 제거된 각 항목은 사라집니다.
 * 이러한 애니메이션이 발생할 때마다 각 항목의 애니메이션이 시작된 후
 * 비대칭 효과가 적용됩니다.
 *
 * ```html
 * <!-- list.component.html -->
 * <button (click)="toggle()">항목 표시 / 숨기기</button>
 * <hr />
 * <div [@listAnimation]="items.length">
 *   <div *ngFor="let item of items">
 *     {{ item }}
 *   </div>
 * </div>
 * ```
 *
 * 다음은 구성 요소 코드입니다:
 *
 * ```ts
 * import {trigger, transition, style, animate, query, stagger} from '@angular/animations';
 * @Component({
 *   templateUrl: 'list.component.html',
 *   animations: [
 *     trigger('listAnimation', [
 *     ...
 *     ])
 *   ]
 * })
 * class ListComponent {
 *   items = [];
 *
 *   showItems() {
 *     this.items = [0,1,2,3,4];
 *   }
 *
 *   hideItems() {
 *     this.items = [];
 *   }
 *
 *   toggle() {
 *     this.items.length ? this.hideItems() : this.showItems();
 *    }
 *  }
 * ```
 *
 * 애니메이션 트리거 코드입니다:
 *
 * ```ts
 * trigger('listAnimation', [
 *   transition('* => *', [ // 바인딩 값이 변경될 때마다
 *     query(':leave', [
 *       stagger(100, [
 *         animate('0.5s', style({ opacity: 0 }))
 *       ])
 *     ]),
 *     query(':enter', [
 *       style({ opacity: 0 }),
 *       stagger(100, [
 *         animate('0.5s', style({ opacity: 1 }))
 *       ])
 *     ])
 *   ])
 * ])
 * ```
 *
 * @publicApi
 */
export function stagger(
  timings: string | number,
  animation: AnimationMetadata | AnimationMetadata[],
): AnimationStaggerMetadata {
  return {type: AnimationMetadataType.Stagger, timings, animation};
}
