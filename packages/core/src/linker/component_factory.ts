/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {ChangeDetectorRef} from '../change_detection/change_detection';
import type {Injector} from '../di/injector';
import type {EnvironmentInjector} from '../di/r3_injector';
import type {Type} from '../interface/type';
import type {Binding, DirectiveWithBindings} from '../render3/dynamic_bindings';

import type {ElementRef} from './element_ref';
import type {NgModuleRef} from './ng_module_factory';
import type {ViewRef} from './view_ref';

/**
 * `ComponentFactory`에 의해 생성된 컴포넌트를 나타냅니다.
 * 컴포넌트 인스턴스와 관련된 객체에 대한 액세스를 제공하며,
 * 인스턴스를 파괴하는 수단을 제공합니다.
 *
 * @publicApi
 */
export abstract class ComponentRef<C> {
  /**
   * 지정된 입력 이름을 새 값으로 업데이트합니다. 이 방법을 사용하면 `OnPush` 변경 감지 전략을 사용하는
   * 컴포넌트가 적절하게 확인 표시됩니다. 또한 동적으로 생성된 컴포넌트가 변경 감지될 때
   * `OnChanges` 생명 주기 훅이 실행되도록 보장합니다.
   *
   * @param name 입력의 이름입니다.
   * @param value 입력의 새 값입니다.
   */
  abstract setInput(name: string, value: unknown): void;

  /**
   * 이 컴포넌트 인스턴스를 위한 호스트 또는 앵커 요소입니다.
   */
  abstract get location(): ElementRef;

  /**
   * 이 컴포넌트 인스턴스에 대한 의존성 주입기입니다.
   */
  abstract get injector(): Injector;

  /**
   * 이 컴포넌트 인스턴스입니다.
   */
  abstract get instance(): C;

  /**
   * 이 컴포넌트 인스턴스를 위한 템플릿에 의해 정의된 호스트 뷰입니다.
   */
  abstract get hostView(): ViewRef;

  /**
   * 이 컴포넌트 인스턴스의 변경 감지기입니다.
   */
  abstract get changeDetectorRef(): ChangeDetectorRef;

  /**
   * 이 컴포넌트의 유형( `ComponentFactory` 클래스에 의해 생성됨)입니다.
   */
  abstract get componentType(): Type<any>;

  /**
   * 컴포넌트 인스턴스 및 이에 관련된 모든 데이터 구조를 파괴합니다.
   */
  abstract destroy(): void;

  /**
   * 컴포넌트에 대한 추가 개발자 정의 정리 기능을 제공하는 생명 주기 훅입니다.
   * @param callback 이 컴포넌트와 관련된 개발자 정의 데이터를 정리하는 핸들러 함수입니다.
   * `destroy()` 메서드를 호출할 때 호출됩니다.
   */
  abstract onDestroy(callback: Function): void;
}

/**
 * 동적으로 컴포넌트를 생성할 수 있는 팩토리의 기본 클래스입니다.
 * `resolveComponentFactory()`를 사용하여 주어진 유형의 컴포넌트에 대한 팩토리를 인스턴스화합니다.
 * 결과적인 `ComponentFactory.create()` 메서드를 사용하여 해당 유형의 컴포넌트를 생성합니다.
 *
 * @publicApi
 *
 * @deprecated Angular는 더 이상 컴포넌트 팩토리를 요구하지 않습니다. 컴포넌트 클래스가 직접 사용할 수 있는
 *     다른 API를 사용해 주십시오.
 */
export abstract class ComponentFactory<C> {
  /**
   * 컴포넌트의 HTML 선택자입니다.
   */
  abstract get selector(): string;
  /**
   * 팩토리가 생성할 컴포넌트의 유형입니다.
   */
  abstract get componentType(): Type<any>;
  /**
   * 컴포넌트의 모든 <ng-content> 요소의 선택자입니다.
   */
  abstract get ngContentSelectors(): string[];
  /**
   * 컴포넌트의 입력 값입니다.
   */
  abstract get inputs(): {
    propName: string;
    templateName: string;
    transform?: (value: any) => any;
    isSignal: boolean;
  }[];
  /**
   * 컴포넌트의 출력 값입니다.
   */
  abstract get outputs(): {propName: string; templateName: string}[];
  /**
   * 새 컴포넌트를 생성합니다.
   */
  abstract create(
    injector: Injector,
    projectableNodes?: any[][],
    rootSelectorOrNode?: string | any,
    environmentInjector?: EnvironmentInjector | NgModuleRef<any>,
    directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[],
    bindings?: Binding[],
  ): ComponentRef<C>;
}
