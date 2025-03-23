/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../di/injector';
import {EnvironmentInjector, getNullInjector} from '../di/r3_injector';
import {Type} from '../interface/type';
import {ComponentRef} from '../linker/component_factory';

import {ComponentFactory} from './component_ref';
import {getComponentDef} from './def_getters';
import {Binding, DirectiveWithBindings} from './dynamic_bindings';
import {assertComponentDef} from './errors';

/**
 * 제공된 컴포넌트 유형과 옵션 집합에 따라 `ComponentRef` 인스턴스를 생성합니다.
 *
 * @usageNotes
 *
 * 아래 예제에서는 `createComponent` 함수를 사용하여 프로그램matically
 * ComponentRef의 인스턴스를 생성하고 이것을 ApplicationRef에 연결하여
 * 변경 감지 주기에 포함시킬 수 있는 방법을 보여줍니다.
 *
 * 주: 예제는 독립형 컴포넌트를 사용하지만, 이 함수는 비독립형 컴포넌트(NgModule에 선언된)에도 사용될 수 있습니다.
 *
 * ```angular-ts
 * @Component({
 *   standalone: true,
 *   template: `안녕하세요 {{ name }}!`
 * })
 * class HelloComponent {
 *   name = 'Angular';
 * }
 *
 * @Component({
 *   standalone: true,
 *   template: `<div id="hello-component-host"></div>`
 * })
 * class RootComponent {}
 *
 * // 애플리케이션 부트스트랩하기.
 * const applicationRef = await bootstrapApplication(RootComponent);
 *
 * // 호스트로 사용할 DOM 노드를 찾기.
 * const hostElement = document.getElementById('hello-component-host');
 *
 * // `ApplicationRef`에서 `EnvironmentInjector` 인스턴스를 가져오기.
 * const environmentInjector = applicationRef.injector;
 *
 * // 이제 `ComponentRef` 인스턴스를 생성할 수 있습니다.
 * const componentRef = createComponent(HelloComponent, {hostElement, environmentInjector});
 *
 * // 마지막 단계는 `ApplicationRef` 인스턴스를 사용하여 새로 생성된 참조를 등록하여
 * // 컴포넌트 뷰를 변경 감지 주기에 포함시키는 것입니다.
 * applicationRef.attachView(componentRef.hostView);
 * componentRef.changeDetectorRef.detectChanges();
 * ```
 *
 * @param component 컴포넌트 클래스 참조.
 * @param options 사용할 옵션 집합:
 *  * `environmentInjector`: 컴포넌트에 사용할 `EnvironmentInjector` 인스턴스.
 *  * `hostElement` (선택적): 컴포넌트의 호스트 노드 역할을 해야 하는 DOM 노드. 제공되지 않으면,
 * Angular는 컴포넌트 선택자에서 사용되는 태그 이름에 따라 하나를 생성합니다(선택자에 태그 이름 정보가 없으면 `div`로 대체됩니다).
 *  * `elementInjector` (선택적): `ElementInjector` 인스턴스, 추가 정보를 보려면
 * [여기](guide/di/hierarchical-dependency-injection#elementinjector)를 참조하세요.
 *  * `projectableNodes` (선택적): 새 컴포넌트 인스턴스의 [`<ng-content>`](api/core/ng-content)를 통과해야 할 DOM 노드 목록, 예를 들어,
 * `[[element1, element2]]`: `element1`과 `element2`를 동일한 `<ng-content>`에 투사합니다.
 * `[[element1, element2], [element3]]`: `element1`과 `element2`를 하나의 `<ng-content>`에 투사하고,
 * `element3`를 별도의 `<ng-content>`에 투사합니다.
 *  * `directives` (선택적): 컴포넌트에 적용해야 할 지시어.
 *  * `binding` (선택적): 루트 컴포넌트에 적용할 바인딩.
 * @returns 주어진 컴포넌트를 나타내는 ComponentRef 인스턴스.
 *
 * @publicApi
 */
export function createComponent<C>(
  component: Type<C>,
  options: {
    environmentInjector: EnvironmentInjector;
    hostElement?: Element;
    elementInjector?: Injector;
    projectableNodes?: Node[][];
    directives?: (Type<unknown> | DirectiveWithBindings<unknown>)[];
    bindings?: Binding[];
  },
): ComponentRef<C> {
  ngDevMode && assertComponentDef(component);
  const componentDef = getComponentDef(component)!;
  const elementInjector = options.elementInjector || getNullInjector();
  const factory = new ComponentFactory<C>(componentDef);
  return factory.create(
    elementInjector,
    options.projectableNodes,
    options.hostElement,
    options.environmentInjector,
    options.directives,
    options.bindings,
  );
}

/**
 * `reflectComponentType` 함수를 사용하여 검색할 수 있는
 * 컴포넌트 메타데이터의 하위 집합을 설명하는 인터페이스입니다.
 *
 * @publicApi
 */
export interface ComponentMirror<C> {
  /**
   * 컴포넌트의 HTML 선택자입니다.
   */
  get selector(): string;
  /**
   * 팩토리가 생성할 컴포넌트의 유형입니다.
   */
  get type(): Type<C>;
  /**
   * 컴포넌트의 입력값.
   */
  get inputs(): ReadonlyArray<{
    readonly propName: string;
    readonly templateName: string;
    readonly transform?: (value: any) => any;
    readonly isSignal: boolean;
  }>;
  /**
   * 컴포넌트의 출력값.
   */
  get outputs(): ReadonlyArray<{readonly propName: string; readonly templateName: string}>;
  /**
   * 컴포넌트 내의 모든 <ng-content> 요소에 대한 선택자입니다.
   */
  get ngContentSelectors(): ReadonlyArray<string>;
  /**
   * 이 컴포넌트가 독립형으로 표시되는지 여부입니다.
   * 주: `ComponentFactory`에는 없는 추가 플래그입니다.
   */
  get isStandalone(): boolean;
  /**
   * // TODO(시그널): 내부를 제거하고 공개 문서 추가하기
   * @internal
   */
  get isSignal(): boolean;
}

/**
 * 컴포넌트 메타데이터를 가져올 수 있는 객체를 생성합니다.
 *
 * @usageNotes
 *
 * 아래 예제에서는 이 함수를 사용하는 방법과 반환된 객체의 필드가 컴포넌트 메타데이터와 어떻게 매핑되는지를 보여줍니다.
 *
 * ```angular-ts
 * @Component({
 *   standalone: true,
 *   selector: 'foo-component',
 *   template: `
 *     <ng-content></ng-content>
 *     <ng-content select="content-selector-a"></ng-content>
 *   `,
 * })
 * class FooComponent {
 *   @Input('inputName') inputPropName: string;
 *   @Output('outputName') outputPropName = new EventEmitter<void>();
 * }
 *
 * const mirror = reflectComponentType(FooComponent);
 * expect(mirror.type).toBe(FooComponent);
 * expect(mirror.selector).toBe('foo-component');
 * expect(mirror.isStandalone).toBe(true);
 * expect(mirror.inputs).toEqual([{propName: 'inputName', templateName: 'inputPropName'}]);
 * expect(mirror.outputs).toEqual([{propName: 'outputName', templateName: 'outputPropName'}]);
 * expect(mirror.ngContentSelectors).toEqual([
 *   '*',                 // 템플릿의 첫 번째 `<ng-content>`, 선택자는 기본적으로 `*`입니다.
 *   'content-selector-a' // 템플릿의 두 번째 `<ng-content>`
 * ]);
 * ```
 *
 * @param component 컴포넌트 클래스 참조.
 * @returns 컴포넌트 메타데이터를 검색할 수 있는 객체.
 *
 * @publicApi
 */
export function reflectComponentType<C>(component: Type<C>): ComponentMirror<C> | null {
  const componentDef = getComponentDef(component);
  if (!componentDef) return null;

  const factory = new ComponentFactory<C>(componentDef);
  return {
    get selector(): string {
      return factory.selector;
    },
    get type(): Type<C> {
      return factory.componentType;
    },
    get inputs(): ReadonlyArray<{
      propName: string;
      templateName: string;
      transform?: (value: any) => any;
      isSignal: boolean;
    }> {
      return factory.inputs;
    },
    get outputs(): ReadonlyArray<{propName: string; templateName: string}> {
      return factory.outputs;
    },
    get ngContentSelectors(): ReadonlyArray<string> {
      return factory.ngContentSelectors;
    },
    get isStandalone(): boolean {
      return componentDef.standalone;
    },
    get isSignal(): boolean {
      return componentDef.signals;
    },
  };
}
