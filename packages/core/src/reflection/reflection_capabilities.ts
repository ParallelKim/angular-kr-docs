/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {isType, Type} from '../interface/type';
import {newArray} from '../util/array_utils';
import {ANNOTATIONS, PARAMETERS, PROP_METADATA} from '../util/decorators';
import {global} from '../util/global';

import {PlatformReflectionCapabilities} from './platform_reflection_capabilities';

/*
 * #########################
 * 주의: 이 정규 표현식은 코드가 축소되더라도 유지되어야 합니다!
 * ##########################
 */

/**
 * ES5 출력을 위한 패스스루 생성자를 감지하는 정규 표현식. 이 Regex는
 * TypeScript와 Babel이 출력하는 일반적인 위임 패턴을 캡처하기 위한 것입니다. 또한
 * 기존 생성자가 ES2015에서 ES5로 다운레벨링된 경우의 패턴을 캡처하기 위한 것입니다.
 * 예를 들어:
 *
 * ```ts
 *   function MyClass() {
 *     var _this = _super.apply(this, arguments) || this;
 * ```
 *
 * TypeScript < 4.2의 `downlevelIteration`로 ES5로 다운레벨링:
 * ```ts
 *   function MyClass() {
 *     var _this = _super.apply(this, __spread(arguments)) || this;
 * ```
 *
 * 아니면 TypeScript >= 4.2의 `downlevelIteration`로 ES5로 다운레벨링:
 * ```ts
 *   function MyClass() {
 *     var _this = _super.apply(this, __spreadArray([], __read(arguments), false)) || this;
 * ```
 *
 * 더 많은 세부정보는 다음에서 확인할 수 있습니다: https://github.com/angular/angular/issues/38453.
 */
export const ES5_DELEGATE_CTOR =
  /^function\s+\S+\(\)\s*{[\s\S]+\.apply\(this,\s*(arguments|(?:[^()]+\(\[\],)?[^()]+\(arguments\).*)\)/;
/** 다른 클래스에서 확장된 ES2015 클래스를 감지하는 정규 표현식. */
export const ES2015_INHERITED_CLASS = /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{/;
/**
 * 다른 클래스에서 확장된 ES2015 클래스로 명시적인 생성자가 정의된 것을 감지하는 정규 표현식.
 */
export const ES2015_INHERITED_CLASS_WITH_CTOR =
  /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(/;
/**
 * 다른 클래스에서 확장된 ES2015 클래스와 생성자를 상속하는 클래스를 감지하는 정규 표현식.
 */
export const ES2015_INHERITED_CLASS_WITH_DELEGATE_CTOR =
  /^class\s+[A-Za-z\d$_]*\s*extends\s+[^{]+{[\s\S]*constructor\s*\(\)\s*{[^}]*super\(\.\.\.arguments\)/;

/**
 * 문자열화된 타입이 부모에게 생성자를 위임하는 클래스인지 여부 판단.
 *
 * 이는 컴파일된 코드가 실제로 생성자 함수를 포함할 수 있기 때문에 간단하지 않습니다.
 * 예를 들어, 자식 클래스가 초기화된 인스턴스 속성을 포함하는 경우.
 */
export function isDelegateCtor(typeStr: string): boolean {
  return (
    ES5_DELEGATE_CTOR.test(typeStr) ||
    ES2015_INHERITED_CLASS_WITH_DELEGATE_CTOR.test(typeStr) ||
    (ES2015_INHERITED_CLASS.test(typeStr) && !ES2015_INHERITED_CLASS_WITH_CTOR.test(typeStr))
  );
}

export class ReflectionCapabilities implements PlatformReflectionCapabilities {
  private _reflect: any;

  constructor(reflect?: any) {
    this._reflect = reflect || global['Reflect'];
  }

  factory<T>(t: Type<T>): (args: any[]) => T {
    return (...args: any[]) => new t(...args);
  }

  /** @internal */
  _zipTypesAndAnnotations(paramTypes: any[], paramAnnotations: any[]): any[][] {
    let result: any[][];

    if (typeof paramTypes === 'undefined') {
      result = newArray(paramAnnotations.length);
    } else {
      result = newArray(paramTypes.length);
    }

    for (let i = 0; i < result.length; i++) {
      // TS는 타입이 없는 매개변수에 대해 Object를 출력하며, Traceur는
      // 주석을 생략합니다. 현재로서는 이주를 돕기 위해 Traceur 동작을 보존하겠지만,
      // 이후에 다시 검토할 수 있습니다.
      if (typeof paramTypes === 'undefined') {
        result[i] = [];
      } else if (paramTypes[i] && paramTypes[i] != Object) {
        result[i] = [paramTypes[i]];
      } else {
        result[i] = [];
      }
      if (paramAnnotations && paramAnnotations[i] != null) {
        result[i] = result[i].concat(paramAnnotations[i]);
      }
    }
    return result;
  }

  private _ownParameters(type: Type<any>, parentCtor: any): any[][] | null {
    const typeStr = type.toString();
    // 주석이 없는 경우, function.length만 메타데이터로 제공합니다.
    // 이 경우, 자식 클래스가 고유한 생성자를 선언했는지 여부를 감지하기 위해
    // 해당 생성자의 내부를 살펴보아야 합니다.
    // 이는 또 다른 클래스에서 상속받은 경우와
    // ctor가 선언되어 있지 않을 때 문제가 발생할 수 있는 상황을 피하는 데에도 도움을 줍니다.
    if (isDelegateCtor(typeStr)) {
      return null;
    }

    // 직접 API를 선호합니다.
    if ((<any>type).parameters && (<any>type).parameters !== parentCtor.parameters) {
      return (<any>type).parameters;
    }

    // 클래스의 속성으로 주석을 낮추기 위한 tsickle의 API.
    const tsickleCtorParams = (<any>type).ctorParameters;
    if (tsickleCtorParams && tsickleCtorParams !== parentCtor.ctorParameters) {
      // 더 최신의 tsickle은 함수 클로저를 사용합니다.
      // 이전 tsickle과의 호환성을 위해 비함수 케이스를 보존합니다.
      const ctorParameters =
        typeof tsickleCtorParams === 'function' ? tsickleCtorParams() : tsickleCtorParams;
      const paramTypes = ctorParameters.map((ctorParam: any) => ctorParam && ctorParam.type);
      const paramAnnotations = ctorParameters.map(
        (ctorParam: any) => ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators),
      );
      return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
    }

    // 주석을 호출하여 생성된 메타데이터의 API.
    const paramAnnotations = type.hasOwnProperty(PARAMETERS) && (type as any)[PARAMETERS];
    const paramTypes =
      this._reflect &&
      this._reflect.getOwnMetadata &&
      this._reflect.getOwnMetadata('design:paramtypes', type);
    if (paramTypes || paramAnnotations) {
      return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
    }

    // 클래스에 주석이 없는 경우, 최소한 function.length를 기반으로 메타데이터를 생성합니다.
    // 참고: 위에서 생성자의 내용을 검사했으므로 실제 생성자임을 알고 있습니다.
    return newArray<any[]>(type.length);
  }

  parameters(type: Type<any>): any[][] {
    // 참고: 최소한 하나의 클래스 주석이 있는 경우에만 메타데이터를 보고합니다.
    // 정적 반사와 동기화되도록 합니다.
    if (!isType(type)) {
      return [];
    }
    const parentCtor = getParentCtor(type);
    let parameters = this._ownParameters(type, parentCtor);
    if (!parameters && parentCtor !== Object) {
      parameters = this.parameters(parentCtor);
    }
    return parameters || [];
  }

  private _ownAnnotations(typeOrFunc: Type<any>, parentCtor: any): any[] | null {
    // 직접 API를 선호합니다.
    if ((<any>typeOrFunc).annotations && (<any>typeOrFunc).annotations !== parentCtor.annotations) {
      let annotations = (<any>typeOrFunc).annotations;
      if (typeof annotations === 'function' && annotations.annotations) {
        annotations = annotations.annotations;
      }
      return annotations;
    }

    // 클래스의 속성으로 주석을 낮추기 위한 tsickle의 API.
    if ((<any>typeOrFunc).decorators && (<any>typeOrFunc).decorators !== parentCtor.decorators) {
      return convertTsickleDecoratorIntoMetadata((<any>typeOrFunc).decorators);
    }

    // 주석을 호출하여 생성된 메타데이터의 API.
    if (typeOrFunc.hasOwnProperty(ANNOTATIONS)) {
      return (typeOrFunc as any)[ANNOTATIONS];
    }
    return null;
  }

  annotations(typeOrFunc: Type<any>): any[] {
    if (!isType(typeOrFunc)) {
      return [];
    }
    const parentCtor = getParentCtor(typeOrFunc);
    const ownAnnotations = this._ownAnnotations(typeOrFunc, parentCtor) || [];
    const parentAnnotations = parentCtor !== Object ? this.annotations(parentCtor) : [];
    return parentAnnotations.concat(ownAnnotations);
  }

  private _ownPropMetadata(typeOrFunc: any, parentCtor: any): {[key: string]: any[]} | null {
    // 직접 API를 선호합니다.
    if (
      (<any>typeOrFunc).propMetadata &&
      (<any>typeOrFunc).propMetadata !== parentCtor.propMetadata
    ) {
      let propMetadata = (<any>typeOrFunc).propMetadata;
      if (typeof propMetadata === 'function' && propMetadata.propMetadata) {
        propMetadata = propMetadata.propMetadata;
      }
      return propMetadata;
    }

    // 클래스의 속성으로 주석을 낮추기 위한 tsickle의 API.
    if (
      (<any>typeOrFunc).propDecorators &&
      (<any>typeOrFunc).propDecorators !== parentCtor.propDecorators
    ) {
      const propDecorators = (<any>typeOrFunc).propDecorators;
      const propMetadata = <{[key: string]: any[]}>{};
      Object.keys(propDecorators).forEach((prop) => {
        propMetadata[prop] = convertTsickleDecoratorIntoMetadata(propDecorators[prop]);
      });
      return propMetadata;
    }

    // 주석을 호출하여 생성된 메타데이터의 API.
    if (typeOrFunc.hasOwnProperty(PROP_METADATA)) {
      return (typeOrFunc as any)[PROP_METADATA];
    }
    return null;
  }

  propMetadata(typeOrFunc: any): {[key: string]: any[]} {
    if (!isType(typeOrFunc)) {
      return {};
    }
    const parentCtor = getParentCtor(typeOrFunc);
    const propMetadata: {[key: string]: any[]} = {};
    if (parentCtor !== Object) {
      const parentPropMetadata = this.propMetadata(parentCtor);
      Object.keys(parentPropMetadata).forEach((propName) => {
        propMetadata[propName] = parentPropMetadata[propName];
      });
    }
    const ownPropMetadata = this._ownPropMetadata(typeOrFunc, parentCtor);
    if (ownPropMetadata) {
      Object.keys(ownPropMetadata).forEach((propName) => {
        const decorators: any[] = [];
        if (propMetadata.hasOwnProperty(propName)) {
          decorators.push(...propMetadata[propName]);
        }
        decorators.push(...ownPropMetadata[propName]);
        propMetadata[propName] = decorators;
      });
    }
    return propMetadata;
  }

  ownPropMetadata(typeOrFunc: any): {[key: string]: any[]} {
    if (!isType(typeOrFunc)) {
      return {};
    }
    return this._ownPropMetadata(typeOrFunc, getParentCtor(typeOrFunc)) || {};
  }

  hasLifecycleHook(type: any, lcProperty: string): boolean {
    return type instanceof Type && lcProperty in type.prototype;
  }
}

function convertTsickleDecoratorIntoMetadata(decoratorInvocations: any[]): any[] {
  if (!decoratorInvocations) {
    return [];
  }
  return decoratorInvocations.map((decoratorInvocation) => {
    const decoratorType = decoratorInvocation.type;
    const annotationCls = decoratorType.annotationCls;
    const annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
    return new annotationCls(...annotationArgs);
  });
}

function getParentCtor(ctor: Function): Type<any> {
  const parentProto = ctor.prototype ? Object.getPrototypeOf(ctor.prototype) : null;
  const parentCtor = parentProto ? parentProto.constructor : null;
  // 참고: 단순화를 위해 항상 null 값을 Object로 사용합니다.
  return parentCtor || Object;
}
