/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * 이 소스 코드 사용은 https://angular.dev/license 주소의 LICENSE 파일에 있는 MIT 스타일 라이선스에 의해 규정됩니다.
 */
import {AnimationPlayer, NoopAnimationPlayer} from '@angular/animations';
import {Injectable} from '@angular/core';

import {containsElement, getParentElement, invokeQuery, validateStyleProperty} from './shared';

/**
 * @publicApi
 *
 * `AnimationDriver`  Noop 애니메이션을 위한 구현체
 */
@Injectable()
export class NoopAnimationDriver implements AnimationDriver {
  /**
   * @returns `prop`가 유효한 CSS 속성인지 여부
   */
  validateStyleProperty(prop: string): boolean {
    return validateStyleProperty(prop);
  }

  /**
   *
   * @returns elm1이 elm2를 포함하는지 여부.
   */
  containsElement(elm1: any, elm2: any): boolean {
    return containsElement(elm1, elm2);
  }

  /**
   * @returns 주어진 요소의 부모를 반환하거나 요소가 `document`인 경우 `null`을 반환합니다.
   */
  getParentElement(element: unknown): unknown {
    return getParentElement(element);
  }

  /**
   * @returns 요소에 대한 쿼리 선택기의 결과. 배열은 `multi`가 `false`인 경우 최대 1개의 항목을 포함합니다.
   */
  query(element: any, selector: string, multi: boolean): any[] {
    return invokeQuery(element, selector, multi);
  }

  /**
   * @returns `defaultValue` 또는 빈 문자열
   */
  computeStyle(element: any, prop: string, defaultValue?: string): string {
    return defaultValue || '';
  }

  /**
   * @returns `NoopAnimationPlayer`
   */
  animate(
    element: any,
    keyframes: Array<Map<string, string | number>>,
    duration: number,
    delay: number,
    easing: string,
    previousPlayers: any[] = [],
    scrubberAccessRequested?: boolean,
  ): AnimationPlayer {
    return new NoopAnimationPlayer(duration, delay);
  }
}

/**
 * @publicApi
 */
export abstract class AnimationDriver {
  /**
   * @deprecated NoopAnimationDriver 클래스를 사용하십시오.
   */
  static NOOP: AnimationDriver = /* @__PURE__ */ new NoopAnimationDriver();

  abstract validateStyleProperty(prop: string): boolean;

  abstract validateAnimatableStyleProperty?: (prop: string) => boolean;

  abstract containsElement(elm1: any, elm2: any): boolean;

  /**
   * 부모 요소를 얻습니다. 요소에 부모가 없는 경우 `null`이 반환됩니다.
   */
  abstract getParentElement(element: unknown): unknown;

  abstract query(element: any, selector: string, multi: boolean): any[];

  abstract computeStyle(element: any, prop: string, defaultValue?: string): string;

  abstract animate(
    element: any,
    keyframes: Array<Map<string, string | number>>,
    duration: number,
    delay: number,
    easing?: string | null,
    previousPlayers?: any[],
    scrubberAccessRequested?: boolean,
  ): any;
}
