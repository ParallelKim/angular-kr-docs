/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {stringify} from '../util/stringify';

import type {ComponentFactory} from './component_factory';

class _NullComponentFactoryResolver implements ComponentFactoryResolver {
  resolveComponentFactory<T>(component: {new (...args: any[]): T}): ComponentFactory<T> {
    throw Error(`No component factory found for ${stringify(component)}.`);
  }
}

/**
 * `Components`를 생성된 `ComponentFactory` 클래스에 매핑하는 간단한 레지스트리입니다.
 * 이 클래스는 컴포넌트 인스턴스를 생성하는 데 사용됩니다.
 * 주어진 컴포넌트 유형의 팩토리를 얻으려면 사용하고,
 * 그런 다음 팩토리의 `create()` 메서드를 사용하여 해당 유형의 컴포넌트를 생성합니다.
 *
 * 참고: v13부터 동적 컴포넌트 생성을 위해
 * [`ViewContainerRef.createComponent`](api/core/ViewContainerRef#createComponent)
 * 컴포넌트 팩토리를 해결할 필요가 없습니다: 컴포넌트 클래스를 직접 사용할 수 있습니다.
 *
 * @publicApi
 *
 * @deprecated Angular는 더 이상 컴포넌트 팩토리를 요구하지 않습니다. 컴포넌트 클래스가 직접 사용될 수 있는 다른 API를 사용하세요.
 */
export abstract class ComponentFactoryResolver {
  static NULL: ComponentFactoryResolver = /* @__PURE__ */ new _NullComponentFactoryResolver();
  /**
   * 주어진 유형의 컴포넌트를 생성하는 팩토리 객체를 반환합니다.
   * @param component 컴포넌트 유형.
   */
  abstract resolveComponentFactory<T>(component: Type<T>): ComponentFactory<T>;
}
