/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';

import {noSideEffects} from './closure';

/**
 * 모든 Angular 타입 데코레이터가 구현하는 인터페이스로, 이를 데코레이터 및 Angular 문법으로 사용할 수 있게 합니다.
 *
 * ```ts
 * @ng.Component({...})
 * class MyClass {...}
 * ```
 *
 * @publicApi
 */
export interface TypeDecorator {
  /**
   * 데코레이터로 호출합니다.
   */
  <T extends Type<any>>(type: T): T;

  // TypeDecorator를 내장 ParameterDecorator 타입에 할당 가능하게 만듭니다.
  // ParameterDecorator는 lib.d.ts에서 `declare type`로 선언되므로
  // 이 인터페이스를 하위 타입으로 선언할 수 없습니다.
  // see https://github.com/angular/angular/issues/3379#issuecomment-126169417
  (target: Object, propertyKey?: string | symbol, parameterIndex?: number): void;
  // 표준(비실험적) 데코레이터 서명이 TS 5.0+ 특정 타입의 직접 사용을 피합니다.
  (target: unknown, context: unknown): void;
}

export const ANNOTATIONS = '__annotations__';
export const PARAMETERS = '__parameters__';
export const PROP_METADATA = '__prop__metadata__';

/**
 * @suppress {globalThis}
 */
export function makeDecorator<T>(
  name: string,
  props?: (...args: any[]) => any,
  parentClass?: any,
  additionalProcessing?: (type: Type<T>) => void,
  typeFn?: (type: Type<T>, ...args: any[]) => void,
): {new (...args: any[]): any; (...args: any[]): any; (...args: any[]): (cls: any) => any} {
  return noSideEffects(() => {
    const metaCtor = makeMetadataCtor(props);

    function DecoratorFactory(
      this: unknown | typeof DecoratorFactory,
      ...args: any[]
    ): (cls: Type<T>) => any {
      if (this instanceof DecoratorFactory) {
        metaCtor.call(this, ...args);
        return this as typeof DecoratorFactory;
      }

      const annotationInstance = new (DecoratorFactory as any)(...args);
      return function TypeDecorator(cls: Type<T>) {
        if (typeFn) typeFn(cls, ...args);
        // Object.defineProperty의 사용은 중요합니다. 이는 열거할 수 없는 속성을 생성하여
        // 서브 클래스에서 속성이 복사되는 것을 방지합니다.
        const annotations = cls.hasOwnProperty(ANNOTATIONS)
          ? (cls as any)[ANNOTATIONS]
          : (Object.defineProperty(cls, ANNOTATIONS, {value: []}) as any)[ANNOTATIONS];
        annotations.push(annotationInstance);

        if (additionalProcessing) additionalProcessing(cls);

        return cls;
      };
    }

    if (parentClass) {
      DecoratorFactory.prototype = Object.create(parentClass.prototype);
    }

    DecoratorFactory.prototype.ngMetadataName = name;
    (DecoratorFactory as any).annotationCls = DecoratorFactory;
    return DecoratorFactory as any;
  });
}

function makeMetadataCtor(props?: (...args: any[]) => any): any {
  return function ctor(this: any, ...args: any[]) {
    if (props) {
      const values = props(...args);
      for (const propName in values) {
        this[propName] = values[propName];
      }
    }
  };
}

export function makeParamDecorator(
  name: string,
  props?: (...args: any[]) => any,
  parentClass?: any,
): any {
  return noSideEffects(() => {
    const metaCtor = makeMetadataCtor(props);
    function ParamDecoratorFactory(
      this: unknown | typeof ParamDecoratorFactory,
      ...args: any[]
    ): any {
      if (this instanceof ParamDecoratorFactory) {
        metaCtor.apply(this, args);
        return this;
      }
      const annotationInstance = new (<any>ParamDecoratorFactory)(...args);

      (<any>ParamDecorator).annotation = annotationInstance;
      return ParamDecorator;

      function ParamDecorator(cls: any, unusedKey: any, index: number): any {
        // Use of Object.defineProperty is important since it creates non-enumerable property which
        // prevents the property is copied during subclassing.
        const parameters = cls.hasOwnProperty(PARAMETERS)
          ? (cls as any)[PARAMETERS]
          : Object.defineProperty(cls, PARAMETERS, {value: []})[PARAMETERS];

        // 일부 매개 변수가 주석이 없으면 간격이 생길 수 있습니다.
        // 우리는 null로 채웁니다.
        while (parameters.length <= index) {
          parameters.push(null);
        }

        (parameters[index] = parameters[index] || []).push(annotationInstance);
        return cls;
      }
    }
    if (parentClass) {
      ParamDecoratorFactory.prototype = Object.create(parentClass.prototype);
    }
    ParamDecoratorFactory.prototype.ngMetadataName = name;
    (<any>ParamDecoratorFactory).annotationCls = ParamDecoratorFactory;
    return ParamDecoratorFactory;
  });
}

export function makePropDecorator(
  name: string,
  props?: (...args: any[]) => any,
  parentClass?: any,
  additionalProcessing?: (target: any, name: string, ...args: any[]) => void,
): any {
  return noSideEffects(() => {
    const metaCtor = makeMetadataCtor(props);

    function PropDecoratorFactory(
      this: unknown | typeof PropDecoratorFactory,
      ...args: any[]
    ): any {
      if (this instanceof PropDecoratorFactory) {
        metaCtor.apply(this, args);
        return this;
      }

      const decoratorInstance = new (<any>PropDecoratorFactory)(...args);

      function PropDecorator(target: any, name: string) {
        // target은 표준 데코레이터에서 정의되지 않았습니다. 이 경우는 지원되지 않으며
        // 표준 데코레이터와 함께 JIT 모드에서 이 데코레이터가 사용될 경우 오류가 발생합니다.
        if (target === undefined) {
          throw new Error('표준 Angular 필드 데코레이터는 JIT 모드에서 지원되지 않습니다.');
        }

        const constructor = target.constructor;
        // Object.defineProperty의 사용은 중요합니다. 이는 열거할 수 없는 속성을 생성하여
        // 서브 클래스에서 속성이 복사되는 것을 방지합니다.
        const meta = constructor.hasOwnProperty(PROP_METADATA)
          ? (constructor as any)[PROP_METADATA]
          : Object.defineProperty(constructor, PROP_METADATA, {value: {}})[PROP_METADATA];
        meta[name] = (meta.hasOwnProperty(name) && meta[name]) || [];
        meta[name].unshift(decoratorInstance);

        if (additionalProcessing) additionalProcessing(target, name, ...args);
      }

      return PropDecorator;
    }

    if (parentClass) {
      PropDecoratorFactory.prototype = Object.create(parentClass.prototype);
    }

    PropDecoratorFactory.prototype.ngMetadataName = name;
    (<any>PropDecoratorFactory).annotationCls = PropDecoratorFactory;
    return PropDecoratorFactory;
  });
}
