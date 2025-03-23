/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * 이 소스 코드는 https://angular.dev/license 의 LICENSE 파일에서 찾을 수 있는
 * MIT 스타일 라이센스에 의해 규정됩니다.
 */
import {ɵStyleDataMap} from '@angular/animations';

import {eraseStyles, setStyles} from '../util';

/**
 * 특별한(애니메이션 가능하지 않은) 스타일이 감지되면 `SpecialCasedStyles`의 인스턴스를 반환합니다.
 *
 * CSS에는 키프레임 애니메이션 내에서 애니메이션할 수 없는 속성이 존재합니다
 * (CSS 키프레임을 통해서든 웹 애니메이션을 통해서든) 그리고 애니메이션 구현은
 * 이를 무시합니다. 이 함수는 이러한 특별한 스타일을 감지하고
 * 애니메이션의 시작과 끝에서 실행될 컨테이너를 반환하도록 설계되었습니다.
 *
 * @returns 특별한 스타일이 감지되면 `SpecialCasedStyles`의 인스턴스를, 그렇지 않으면 `null`
 */
export function packageNonAnimatableStyles(
  element: any,
  styles: ɵStyleDataMap | Array<ɵStyleDataMap>,
): SpecialCasedStyles | null {
  let startStyles: ɵStyleDataMap | null = null;
  let endStyles: ɵStyleDataMap | null = null;
  if (Array.isArray(styles) && styles.length) {
    startStyles = filterNonAnimatableStyles(styles[0]);
    if (styles.length > 1) {
      endStyles = filterNonAnimatableStyles(styles[styles.length - 1]);
    }
  } else if (styles instanceof Map) {
    startStyles = filterNonAnimatableStyles(styles);
  }

  return startStyles || endStyles ? new SpecialCasedStyles(element, startStyles, endStyles) : null;
}

/**
 * 키프레임 기반 애니메이션 동안 실행되도록 설계된 특별한 스타일을 적용합니다.
 *
 * 시작될 때(`start()` 메서드가 실행될 때) 제공된 `startStyles`
 * 가 적용됩니다. 완료되면(`finish()` 메서드가 호출될 때)
 * `endStyles`와 시작 스타일이 적용됩니다. 마지막으로
 * `destroy()`가 호출되면 모든 스타일이 제거됩니다.
 */
export class SpecialCasedStyles {
  static initialStylesByElement = /* @__PURE__ */ new WeakMap<any, ɵStyleDataMap>();

  private _state = SpecialCasedStylesState.Pending;
  private _initialStyles!: ɵStyleDataMap;

  constructor(
    private _element: any,
    private _startStyles: ɵStyleDataMap | null,
    private _endStyles: ɵStyleDataMap | null,
  ) {
    let initialStyles = SpecialCasedStyles.initialStylesByElement.get(_element);
    if (!initialStyles) {
      SpecialCasedStyles.initialStylesByElement.set(_element, (initialStyles = new Map()));
    }
    this._initialStyles = initialStyles;
  }

  start() {
    if (this._state < SpecialCasedStylesState.Started) {
      if (this._startStyles) {
        setStyles(this._element, this._startStyles, this._initialStyles);
      }
      this._state = SpecialCasedStylesState.Started;
    }
  }

  finish() {
    this.start();
    if (this._state < SpecialCasedStylesState.Finished) {
      setStyles(this._element, this._initialStyles);
      if (this._endStyles) {
        setStyles(this._element, this._endStyles);
        this._endStyles = null;
      }
      this._state = SpecialCasedStylesState.Started;
    }
  }

  destroy() {
    this.finish();
    if (this._state < SpecialCasedStylesState.Destroyed) {
      SpecialCasedStyles.initialStylesByElement.delete(this._element);
      if (this._startStyles) {
        eraseStyles(this._element, this._startStyles);
        this._endStyles = null;
      }
      if (this._endStyles) {
        eraseStyles(this._element, this._endStyles);
        this._endStyles = null;
      }
      setStyles(this._element, this._initialStyles);
      this._state = SpecialCasedStylesState.Destroyed;
    }
  }
}

/**
 * `SpecialCasedStyles`의 상태를 반영하는 상태 열거형입니다.
 *
 * `SpecialCasedStyles`와 상호작용하는 방식에 따라 시작 및 종료
 * 스타일이 동일한 방식으로 적용되지 않을 수 있습니다. 이 열거형은
 * 종료 스타일이 적용될 때 시작 스타일이 적용되도록 보장합니다.
 * 또한 특별한 스타일의 현재 상태를 반영하는 데 사용되어
 * 시작/종료 스타일이 중복 적용되지 않도록 도와줍니다.
 * 또한 `SpecialCasedStyles`가 파괴될 때 스타일을 정리하는 데 사용됩니다.
 */
const enum SpecialCasedStylesState {
  Pending = 0,
  Started = 1,
  Finished = 2,
  Destroyed = 3,
}

function filterNonAnimatableStyles(styles: ɵStyleDataMap): ɵStyleDataMap | null {
  let result: ɵStyleDataMap | null = null;
  styles.forEach((val, prop) => {
    if (isNonAnimatableStyle(prop)) {
      result = result || new Map();
      result.set(prop, val);
    }
  });
  return result;
}

function isNonAnimatableStyle(prop: string) {
  return prop === 'display' || prop === 'position';
}
