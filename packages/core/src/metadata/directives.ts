/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ChangeDetectionStrategy} from '../change_detection/constants';
import {Provider} from '../di/interface/provider';
import {Type} from '../interface/type';
import {compileComponent, compileDirective} from '../render3/jit/directive';
import {compilePipe} from '../render3/jit/pipe';
import {makeDecorator, makePropDecorator, TypeDecorator} from '../util/decorators';

import {SchemaMetadata} from './schema';
import {ViewEncapsulation} from './view';

/**
 * 디렉티브 데코레이터 / 생성자 함수의 타입입니다.
 * @publicApi
 */
export interface DirectiveDecorator {
  /**
   * 클래스를 Angular 디렉티브로 표시하는 데코레이터입니다.
   * DOM의 요소에 사용자 정의 동작을 추가하기 위해 고유한 디렉티브를 정의할 수 있습니다.
   *
   * 옵션은 디렉티브가 어떻게 처리되고, 인스턴스화되고, 런타임에 사용되어야 하는지를 결정하는 구성 메타데이터를 제공합니다.
   *
   * 컴포넌트 클래스와 마찬가지로 디렉티브 클래스는 구성 및 동작에 영향을 주기 위해
   * [생명 주기 훅](guide/components/lifecycle)을 구현할 수 있습니다.
   *
   * @usageNotes
   * 디렉티브를 정의하려면 클래스를 데코레이터로 표시하고 메타데이터를 제공하십시오.
   *
   * ```ts
   * import {Directive} from '@angular/core';
   *
   * @Directive({
   *   selector: 'my-directive',
   * })
   * export class MyDirective {
   * ...
   * }
   * ```
   *
   * ### 디렉티브 선언하기
   *
   * 애플리케이션의 다른 컴포넌트에서 디렉티브를 사용 가능하게 하려면 다음 중 한 가지 작업을 수행해야 합니다.
   *  - 디렉티브를 [독립적](guide/components/importing)으로 표시하거나,
   *  - `declarations` 및 `exports` 필드에 추가하여 NgModule에 선언합니다.
   *
   * ** 디렉티브를 독립적으로 표시하기 **
   *
   * 디렉티브 데코레이터 메타데이터에 `standalone: true` 플래그를 추가하여 그것을
   * [독립적](guide/components/importing)으로 선언할 수 있습니다:
   *
   * ```ts
   * @Directive({
   *   standalone: true,
   *   selector: 'my-directive',
   * })
   * class MyDirective {}
   * ```
   *
   * 디렉티브를 독립적으로 표시할 때는, 이미 NgModule에 선언되지 않았는지 확인하십시오.
   *
   * ** NgModule에 디렉티브 선언하기 **
   *
   * 또 다른 방법은 NgModule에 디렉티브를 선언하는 것입니다:
   *
   * ```ts
   * @Directive({
   *   selector: 'my-directive',
   * })
   * class MyDirective {}
   *
   * @NgModule({
   *   declarations: [MyDirective, SomeComponent],
   *   exports: [MyDirective], // 이 모듈 외부에서 사용 가능하게 하기
   * })
   * class SomeNgModule {}
   * ```
   *
   * NgModule에 디렉티브를 선언할 때는 다음 사항을 확인하십시오:
   *  - 디렉티브는 정확히 하나의 NgModule에 선언되어야 합니다.
   *  - 디렉티브는 독립적이지 않습니다.
   *  - 다른 모듈에서 가져온 디렉티브를 다시 선언하지 않습니다.
   *  - 이 디렉티브를 NgModule 외부의 컴포넌트에서 접근할 수 있도록 하려면,
   *    `exports` 필드에 포함되어야 합니다.
   *
   * @Annotation
   */
  (obj?: Directive): TypeDecorator;

  /**
   * `Directive` 데코레이터를 참조하십시오.
   */
  new (obj?: Directive): Directive;
}

/**
 * 디렉티브 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export interface Directive {
  /**
   * 템플릿에서 이 디렉티브를 식별하고
   * 디렉티브 인스턴스를 생성하도록 트리거하는 CSS 선택자입니다.
   *
   * 다음 중 하나로 선언하십시오:
   *
   * - `element-name`: 요소 이름으로 선택합니다.
   * - `.class`: 클래스 이름으로 선택합니다.
   * - `[attribute]`: 속성 이름으로 선택합니다.
   * - `[attribute=value]`: 속성 이름과 값으로 선택합니다.
   * - `:not(sub_selector)`: 요소가 `sub_selector`와 일치하지 않을 경우 선택합니다.
   * - `selector1, selector2`: `selector1` 또는 `selector2`가 일치하면 선택합니다.
   *
   * Angular는 요소 경계를 넘는 CSS 선택자에 대해서만 디렉티브가 적용될 수 있도록 허용합니다.
   *
   * 다음 템플릿 HTML의 경우, `input[type=text]` 선택자가 있는 디렉티브는
   * `<input type="text">` 요소에서만 인스턴스화됩니다.
   *
   * ```html
   * <form>
   *   <input type="text">
   *   <input type="radio">
   * <form>
   * ```
   *
   */
  selector?: string;

  /**
   * 디렉티브의 데이터 바인딩된 입력 속성 집합을 나열합니다.
   *
   * Angular는 변경 감지 중에 입력 속성을 자동으로 업데이트합니다.
   * `inputs` 속성은 디렉티브 속성을 입력으로 노출하도록 구성하는 문자열 또는 객체 리터럴을 허용합니다.
   *
   * 객체 리터럴이 전달되면, `name` 속성은 입력이 쓸 속성을 나타내고,
   * `alias`는 템플릿 바인딩에서 입력이 사용 가능한 이름을 결정합니다.
   * `required` 속성은 입력이 필수임을 나타내며,
   * 디렉티브가 사용될 때 전달되지 않으면 컴파일 타임 오류를 발생시킵니다.
   *
   * `inputs` 배열에 문자열이 전달되면, 이 문자열은 `'name'` 또는
   * `'name: alias'` 형식이 될 수 있으며,
   * 여기서 `name`은 디렉티브가 쓸 클래스의 속성을 나타내고,
   * `alias`는 템플릿 바인딩에서 입력이 사용 가능한 이름을 결정합니다.
   * 문자열 기반 입력 정의는 선택사항으로 간주됩니다.
   *
   * @usageNotes
   *
   * 다음 예제는 두 데이터 바인딩 속성이 있는 컴포넌트를 생성합니다.
   *
   * ```ts
   * @Component({
   *   selector: 'bank-account',
   *   inputs: ['bankName', {name: 'id', alias: 'account-id'}],
   *   template: `
   *     Bank Name: {{bankName}}
   *     Account Id: {{id}}
   *   `
   * })
   * class BankAccount {
   *   bankName: string;
   *   id: string;
   * }
   * ```
   *
   */
  inputs?: (
    | {
        name: string;
        alias?: string;
        required?: boolean;
        transform?: (value: any) => any;
      }
    | string
  )[];

  /**
   * 이벤트 바인딩된 출력 속성 집합을 나열합니다.
   *
   * 출력 속성이 이벤트를 발생시키면, 템플릿에서 해당 이벤트에 첨부된 이벤트 핸들러가 호출됩니다.
   *
   * `outputs` 속성은 `directiveProperty`를 `alias`에 매핑하는 구성을 정의합니다:
   *
   * - `directiveProperty`는 이벤트를 발생시키는 컴포넌트 속성을 지정합니다.
   * - `alias`는 이벤트 핸들러가 첨부되는 DOM 속성을 지정합니다.
   *
   * @usageNotes
   *
   * ```ts
   * @Component({
   *   selector: 'child-dir',
   *   outputs: [ 'bankNameChange' ],
   *   template: `<input (input)="bankNameChange.emit($event.target.value)" />`
   * })
   * class ChildDir {
   *  bankNameChange: EventEmitter<string> = new EventEmitter<string>();
   * }
   *
   * @Component({
   *   selector: 'main',
   *   template: `
   *     {{ bankName }} <child-dir (bankNameChange)="onBankNameChange($event)"></child-dir>
   *   `
   * })
   * class MainComponent {
   *  bankName: string;
   *
   *   onBankNameChange(bankName: string) {
   *     this.bankName = bankName;
   *   }
   * }
   * ```
   *
   */
  outputs?: string[];

  /**
   * 이 디렉티브 또는 컴포넌트의 주입기를
   * 의존성 공급자의 토큰으로 구성합니다.
   */
  providers?: Provider[];

  /**
   * 템플릿에서 이 디렉티브를 변수에 할당하기 위해 사용할 수 있는 이름을 정의합니다.
   *
   * @usageNotes
   *
   * ```ts
   * @Directive({
   *   selector: 'child-dir',
   *   exportAs: 'child'
   * })
   * class ChildDir {
   * }
   *
   * @Component({
   *   selector: 'main',
   *   template: `<child-dir #c="child"></child-dir>`
   * })
   * class MainComponent {
   * }
   * ```
   *
   */
  exportAs?: string;

  /**
   * 디렉티브에 주입될 쿼리를 구성합니다.
   *
   * 콘텐츠 쿼리는 `ngAfterContentInit` 콜백이 호출되기 전에 설정됩니다.
   * 뷰 쿼리는 `ngAfterViewInit` 콜백이 호출되기 전에 설정됩니다.
   *
   * @usageNotes
   *
   * 다음 예제는 쿼리가 어떻게 정의되고 생명 주기 훅에서 결과를 사용할 수 있는지 보여줍니다:
   *
   * ```ts
   * @Component({
   *   selector: 'someDir',
   *   queries: {
   *     contentChildren: new ContentChildren(ChildDirective),
   *     viewChildren: new ViewChildren(ChildDirective)
   *   },
   *   template: '<child-directive></child-directive>'
   * })
   * class SomeDir {
   *   contentChildren: QueryList<ChildDirective>,
   *   viewChildren: QueryList<ChildDirective>
   *
   *   ngAfterContentInit() {
   *     // contentChildren이 설정됨
   *   }
   *
   *   ngAfterViewInit() {
   *     // viewChildren이 설정됨
   *   }
   * }
   * ```
   *
   * @Annotation
   */
  queries?: {[key: string]: any};

  /**
   * 클래스 속성을 호스트 요소 바인딩으로 매핑합니다.
   * 속성, 속성 및 이벤트에 대해 키-값 쌍을 사용합니다.
   *
   * Angular는 변경 감지 중에 호스트 속성 바인딩을 자동으로 확인합니다.
   * 바인딩이 변경되면 Angular는 디렉티브의 호스트 요소를 업데이트합니다.
   *
   * 키가 호스트 요소의 속성일 경우, 속성 값은
   * 지정된 DOM 속성으로 전파됩니다.
   *
   * 키가 DOM의 정적 속성일 경우, 속성 값은
   * 호스트 요소의 지정된 속성으로 전파됩니다.
   *
   * 이벤트 처리의 경우:
   * - 키는 디렉티브가 수신하는 DOM 이벤트입니다.
   * 전역 이벤트를 수신하려면, 이벤트 이름에 대상을 추가하십시오.
   * 대상은 `window`, `document` 또는 `body`일 수 있습니다.
   * - 값은 이벤트가 발생했을 때 실행할 문장입니다. 만약
   * 문장이 `false`로 평가되면, `preventDefault`가 DOM
   * 이벤트에 적용됩니다. 핸들러 메서드는 `$event` 지역 변수를 참조할 수 있습니다.
   *
   */
  host?: {[key: string]: string};

  /**
   * 현재 존재하는 경우, 이 디렉티브/컴포넌트는 AOT 컴파일러에 의해 무시됩니다.
   * 배포된 코드에 남아 있으며, JIT 컴파일러가 런타임에
   * 브라우저에서 컴파일을 시도합니다.
   * 올바른 동작을 보장하기 위해 애플리케이션은 `@angular/compiler`를 가져와야 합니다.
   */
  jit?: true;

  /**
   * `standalone`으로 표시된 Angular 디렉티브는 NgModule에 선언할 필요가 없습니다. 이러한
   * 디렉티브는 NgModule의 "중간 컨텍스트"(ex. 구성된 공급자)에 의존하지 않습니다.
   *
   * 독립형 컴포넌트, 디렉티브 및 파이프에 대한 자세한 정보는 [이 가이드](guide/components/importing)에서 확인할 수 있습니다.
   */
  standalone?: boolean;

  /**
   * // TODO(signals): 내부 항목 제거 및 공개 문서 추가
   *
   * @internal
   */
  signals?: boolean;

  /**
   * 디렉티브가 일치하는 경우 호스트에 적용되어야 하는 독립형 디렉티브입니다.
   * 기본적으로 호스트 디렉티브의 입력 또는 출력은
   * `inputs` 또는 `outputs` 속성에 지정되지 않는 한 호스트에서 사용할 수 없습니다.
   *
   * 입력 또는 출력 이름 뒤에 콜론과 별칭을 추가하여 입력 및 출력을 추가적으로 별칭할 수 있습니다.
   * 예를 들어, `hostDirectives`를 통해 적용된 디렉티브가 `menuDisabled`라는 입력을 정의하는 경우,
   * `'menuDisabled: disabled'`을 `inputs`에 추가하여 `disabled`로 별칭을 지정할 수 있습니다.
   */
  hostDirectives?: (
    | Type<unknown>
    | {
        directive: Type<unknown>;
        inputs?: string[];
        outputs?: string[];
      }
  )[];
}

/**
 * 디렉티브 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export const Directive: DirectiveDecorator = makeDecorator(
  'Directive',
  (dir: Directive = {}) => dir,
  undefined,
  undefined,
  (type: Type<any>, meta: Directive) => compileDirective(type, meta),
);

/**
 * 컴포넌트 데코레이터 인터페이스
 *
 * @publicApi
 */
export interface ComponentDecorator {
  /**
   * 클래스를 Angular 컴포넌트로 표시하고
   * 구성 메타데이터를 제공하는 데코레이터입니다.
   * 이 메타데이터는 컴포넌트가 어떻게 처리되고,
   * 인스턴스화되고, 런타임에 사용되어야 하는지를 결정합니다.
   *
   * 컴포넌트는 Angular 앱의 가장 기본적인 UI 빌딩 블록입니다.
   * Angular 앱은 Angular 컴포넌트의 트리로 구성됩니다.
   *
   * Angular 컴포넌트는 디렉티브의 하위 집합이며 항상 템플릿과 관련이 있습니다.
   * 다른 디렉티브와 달리, 주어진 요소에 대한 템플릿에서는
   * 하나의 컴포넌트만 인스턴스화될 수 있습니다.
   *
   * 독립형 컴포넌트는 다른 독립형 컴포넌트나 NgModule에 직접 임포트할 수 있습니다.
   * NgModule 기반 앱은 다른 컴포넌트나 애플리케이션에서
   * 사용 가능하도록 컴포넌트가 NgModule에 속해야 합니다.
   * 컴포넌트를 NgModule의 구성원으로 만들려면 컴포넌트를 `declarations` 필드에 나열하십시오.
   *
   * 디렉티브를 구성하기 위한 이러한 옵션 외에도,
   * 생명 주기 훅을 구현하여 컴포넌트의 런타임 동작을 제어할 수 있습니다.
   * 더 많은 정보는 [생명 주기 훅](guide/components/lifecycle) 가이드를 참조하십시오.
   *
   * @usageNotes
   *
   * ### 컴포넌트 입력 설정
   *
   * 다음 예제는 두 데이터 바인딩 속성이 있는 컴포넌트를 생성합니다.
   * 이는 `inputs` 값을 통해 지정됩니다.
   *
   * {@example core/ts/metadata/directives.ts region='component-input'}
   *
   * ### 컴포넌트 출력 설정
   *
   * 다음 예제는 간격마다 이벤트를 발생시키는 두 개의 이벤트 방출기를 보여줍니다.
   * 하나는 매초 출력을 발생시키고, 다른 하나는 매 5초마다 발생시킵니다.
   *
   * {@example core/ts/metadata/directives.ts region='component-output-interval'}
   *
   * ### 뷰 제공자를 사용하여 클래스 주입
   *
   * 다음 간단한 예제는 컴포넌트 메타데이터에서 지정된 뷰 제공자를 사용하여
   * 클래스를 컴포넌트에 주입합니다:
   *
   * ```ts
   * class Greeter {
   *    greet(name:string) {
   *      return 'Hello ' + name + '!';
   *    }
   * }
   *
   * @Directive({
   *   selector: 'needs-greeter'
   * })
   * class NeedsGreeter {
   *   greeter:Greeter;
   *
   *   constructor(greeter:Greeter) {
   *     this.greeter = greeter;
   *   }
   * }
   *
   * @Component({
   *   selector: 'greet',
   *   viewProviders: [
   *     Greeter
   *   ],
   *   template: `<needs-greeter></needs-greeter>`
   * })
   * class HelloWorld {
   * }
   *
   * ```
   *
   * ### 공백 유지
   *
   * 공백을 제거하면 AOT 생성된 코드 크기를 크게 줄이고 뷰 생성 속도를 높일 수 있습니다.
   * Angular 6부터 `preserveWhitespaces`의 기본값은 false입니다(공백 삭제).
   * 애플리케이션의 모든 컴포넌트에 대한 기본 설정을 변경하려면,
   * AOT 컴파일러의 `preserveWhitespaces` 옵션을 설정합니다.
   *
   * 기본적으로 AOT 컴파일러는 다음과 같이 공백 문자를 제거합니다.
   * * 템플릿의 시작과 끝에서 모든 공백을 다듬습니다.
   * * 공백만 있는 텍스트 노드를 제거합니다. 예를 들어,
   *
   * ```html
   * <button>Action 1</button>  <button>Action 2</button>
   * ```
   *
   * 방법은 다음과 같습니다:
   *
   * ```html
   * <button>Action 1</button><button>Action 2</button>
   * ```
   *
   * * 텍스트 노드에서 연속된 공백 문자를 단일 공백으로 대체합니다.
   * 예를 들어, `<span>\n some text\n</span>`는 `<span> some text </span>`로 변환됩니다.
   * * HTML 태그 내의 텍스트 노드(예: `<pre>` 또는 `<textarea>`) 내의 텍스트는
   * 중요하기 때문에 변경되지 않습니다.
   *
   * 이러한 변환은 DOM 노드 레이아웃에 영향을 줄 수 있지만,
   * 영향은 최소화되어야 합니다.
   *
   * 특정 템플릿 조각에서 공백 문자를 보존해야 하는 경우 기본 동작을 재정의할 수 있습니다.
   * 예를 들어, `ngPreserveWhitespaces` 속성을 사용하여 전체 DOM 하위 트리를 제외할 수 있습니다:
   *
   * ```html
   * <div ngPreserveWhitespaces>
   *     공백은 여기에서 보존됩니다
   *     <span>    그리고 여기에서도 </span>
   * </div>
   * ```
   *
   * 텍스트 노드에서 단일 공백을 강제로 보존하려면 `&ngsp;`를 사용하십시오.
   * Angular의 템플릿 컴파일러가 이를 공백 문자로 대체합니다:
   *
   * ```html
   * <a>Spaces</a>&ngsp;<a>between</a>&ngsp;<a>links.</a>
   * <!-- 다음과 같이 컴파일됩니다:
   *  <a>Spaces</a> <a>between</a> <a>links.</a>  -->
   * ```
   *
   * `&ngsp;`의 시퀀스는 여전히 단일 공백 문자로 축약됩니다,
   * `preserveWhitespaces` 옵션이 `false`로 설정될 때
   *
   * ```html
   * <a>before</a>&ngsp;&ngsp;&ngsp;<a>after</a>
   * <!-- 다음과 같이 컴파일됩니다:
   *  <a>before</a> <a>after</a> -->
   * ```
   *
   * 공백 문자 시퀀스를 보존하려면
   * `ngPreserveWhitespaces` 속성을 사용하십시오.
   *
   * @Annotation
   */
  (obj: Component): TypeDecorator;
  /**
   * `Component` 데코레이터를 참조하십시오.
   */
  new (obj: Component): Component;
}

/**
 * Angular 컴포넌트에 대한 구성 메타데이터를 제공합니다.
 *
 * @publicApi
 */
export interface Component extends Directive {
  /**
   * 이 컴포넌트에 사용할 변경 감지 전략입니다.
   *
   * 컴포넌트가 인스턴스화되면 Angular는 변경 감지기를 생성합니다,
   * 이는 컴포넌트의 바인딩을 전파할 책임이 있습니다.
   * 전략의 종류는:
   * - `ChangeDetectionStrategy#OnPush`는 전략을 `CheckOnce`로 설정합니다(필요 시).
   * - `ChangeDetectionStrategy#Default`는 전략을 `CheckAlways`로 설정합니다.
   */
  changeDetection?: ChangeDetectionStrategy;

  /**
   * 뷰 DOM 자식에 대해 볼 수 있는 주입 가능한 객체 집합을 정의합니다.
   * [예제](#injecting-a-class-with-a-view-provider) 를 참조하십시오.
   *
   */
  viewProviders?: Provider[];

  /**
   * 컴포넌트를 포함하는 모듈의 모듈 ID입니다.
   * 컴포넌트는 템플릿 및 스타일의 상대 URL을 확인할 수 있어야 합니다.
   * SystemJS는 각 모듈 내에서 `__moduleName` 변수를 노출합니다.
   * CommonJS에서는 이를 `module.id`로 설정할 수 있습니다.
   *
   * @deprecated 이 옵션은 아무런 효과가 없습니다. Angular v17에서 제거됩니다.
   */
  moduleId?: string;

  /**
   * Angular 컴포넌트의 템플릿 파일의 상대 경로 또는 절대 URL입니다.
   * 제공하는 경우 `template`을 사용하여 인라인 템플릿을 제공하지 마십시오.
   *
   */
  templateUrl?: string;

  /**
   * Angular 컴포넌트의 인라인 템플릿입니다. 제공하는 경우,
   * `templateUrl`을 사용하여 템플릿 파일을 제공하지 마십시오.
   *
   */
  template?: string;

  /**
   * 이 컴포넌트에서 사용할 CSS 스타일시트가 포함된 파일의 상대 경로 또는 절대 URL입니다.
   */
  styleUrl?: string;

  /**
   * 이 컴포넌트에서 사용할 CSS 스타일시트가 포함된 파일의 상대 경로 또는 절대 URL입니다.
   */
  styleUrls?: string[];

  /**
   * 이 컴포넌트에서 사용할 수 있는 인라인 CSS 스타일시트입니다.
   */
  styles?: string | string[];

  /**
   * 애니메이션 `trigger()` 호출로 포함된 하나 이상의 애니메이션입니다.
   * [`state()`](api/animations/state) 및 `transition()` 정의가 포함됩니다.
   * [애니메이션 가이드](guide/animations)와 애니메이션 API 문서를 참조하십시오.
   *
   */
  animations?: any[];

  /**
   * 컴포넌트 스타일에 대한 캡슐화 정책입니다.
   * 가능한 값:
   * - `ViewEncapsulation.Emulated`: 기본 Shadow DOM CSS 캡슐화 동작을 에뮬레이트하기 위해 수정된
   *                                 컴포넌트 스타일을 적용합니다.
   * - `ViewEncapsulation.None`: 어떤 종류의 캡슐화 없이 전역적으로 컴포넌트 스타일을 적용합니다.
   * - `ViewEncapsulation.ShadowDom`: 브라우저의 네이티브 Shadow DOM API를 사용하여 스타일을 캡슐화합니다.
   *
   * 제공되지 않은 경우, 값은 기본적으로 `ViewEncapsulation.Emulated`인 `CompilerOptions`에서 가져옵니다.
   *
   * 정책이 `ViewEncapsulation.Emulated`여지고, 컴포넌트에 {@link Component#styles styles} 또는
   * {@link Component#styleUrls styleUrls}가 없는 경우,
   * 정책은 자동으로 `ViewEncapsulation.None`으로 변경됩니다.
   */
  encapsulation?: ViewEncapsulation;

  /**
   * 기본 인터폴레이션 시작 및 종료 구분자(`{{` 및 `}}`)를 재정의합니다.
   *
   * @deprecated Angular의 기본 인터폴레이션 구분자를 대신 사용하십시오.
   */
  interpolation?: [string, string];

  /**
   * 컴파일된 템플릿에서 잠재적으로 불필요한 공백 문자를 보존할지 또는 제거할지를 결정합니다.
   * 공백 문자는 JavaScript 정규 표현식에서 `\s` 문자 클래스를 일치시키는 문자입니다.
   * 기본값은 false이며, 컴파일러 옵션에서 재정의하지 않는 한 그렇습니다.
   */
  preserveWhitespaces?: boolean;

  /**
   * `standalone`으로 표시된 Angular 컴포넌트는 NgModule에 선언할 필요가 없습니다. 이러한
   * 컴포넌트는 가져오기 속성을 통해 자신의 템플릿 종속성을 직접 관리합니다.
   *
   * 독립형 컴포넌트, 디렉티브 및 파이프에 대한 자세한 정보는 [이 가이드](guide/components/importing)에서 확인할 수 있습니다.
   */
  standalone?: boolean;

  /**
   * 가져오기 속성은 독립 컴포넌트의 템플릿 종속성 즉,
   * 템플릿 내에서 사용할 수 있는 디렉티브, 컴포넌트 및 파이프를 지정합니다.
   * 독립형 컴포넌트는 다른 독립형 컴포넌트, 디렉티브 및 파이프를 임포트할 수 있으며,
   * 기존 NgModules도 임포트할 수 있습니다.
   *
   * 이 속성은 독립형 컴포넌트에만 사용 가능 - NgModule에서 선언된 컴포넌트에 대해 지정하면 컴파일 오류가 발생합니다.
   *
   * 독립형 컴포넌트, 디렉티브 및 파이프에 대한 자세한 정보는 [이 가이드](guide/components/importing)에서 확인할 수 있습니다.
   */
  imports?: (Type<any> | ReadonlyArray<any>)[];

  /**
   * `deferredImports` 속성은 독립형 컴포넌트의 템플릿 종속성을 지정하며,
   * `@defer` 블록으로서 지연 로드해야 합니다. Angular는 항상 이러한 심볼에 대한 동적 가져오기를 생성하고
   * 일반/즉시 가져오기를 제거합니다. 가져오기가 `deferredImports`에서 사용되는 심볼을 포함하지 않도록하십시오.
   *
   * 참고: 이 필드는 내부 전용 필드이며, 대신 일반 `@Component.imports` 필드를 사용합니다.
   * @internal
   */
  deferredImports?: (Type<any> | ReadonlyArray<any>)[];

  /**
   * 독립형 컴포넌트에서 허용된 요소를 선언하는 스키마 집합입니다. Angular 컴포넌트가 아닌 요소 및 속성은 스키마에 선언해야 합니다.
   *
   * 이 속성은 독립형 컴포넌트에만 사용 가능 - NgModule에서 선언된 컴포넌트에 대해 지정하면 컴파일 오류가 발생합니다.
   *
   * 독립형 컴포넌트, 디렉티브 및 파이프에 대한 자세한 정보는 [이 가이드](guide/components/importing)에서 확인할 수 있습니다.
   */
  schemas?: SchemaMetadata[];
}

/**
 * 컴포넌트 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const Component: ComponentDecorator = makeDecorator(
  'Component',
  (c: Component = {}) => ({changeDetection: ChangeDetectionStrategy.Default, ...c}),
  Directive,
  undefined,
  (type: Type<any>, meta: Component) => compileComponent(type, meta),
);

/**
 * 파이프 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface PipeDecorator {
  /**
   *
   * 클래스를 파이프로 표시하고 구성 메타데이터를 제공합니다.
   *
   * 파이프 클래스는 `PipeTransform` 인터페이스를 구현해야 합니다.
   * 예를 들어, 이름이 "myPipe"인 경우 다음과 같은 템플릿 바인딩 표현식을 사용하십시오:
   *
   * ```html
   * {{ exp | myPipe }}
   * ```
   *
   * 표현식의 결과는 파이프의 `transform()` 메서드로 전달됩니다.
   *
   * 파이프는 템플릿에서 사용 가능하려면 NgModule에 속해야 합니다.
   * NgModule의 구성원으로 만들려면,
   * `NgModule` 메타데이터의 `declarations` 필드에 나열하십시오.
   *
   * @see [스타일 가이드: 파이프 이름](style-guide#02-09)
   *
   */
  (obj: Pipe): TypeDecorator;

  /**
   * `Pipe` 데코레이터를 참조하십시오.
   */
  new (obj: Pipe): Pipe;
}

/**
 * 파이프 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Pipe {
  /**
   * 템플릿 바인딩에 사용할 파이프 이름입니다.
   * 일반적으로는 하이픈을 포함할 수 없기 때문에 lowerCamelCase를 사용합니다.
   */
  name: string;

  /**
   * true일 경우, 파이프는 순수합니다. 즉,
   * `transform()` 메서드는 입력 인자가 변경될 때만 호출됩니다.
   * 기본적으로 파이프는 순수합니다.
   *
   * 파이프에 내부 상태가 있는 경우(즉, 결과가 인자 외의 상태에 따라 달라지는 경우),
   * `pure`를 false로 설정합니다.
   * 이 경우 파이프는 각 변경 감지 사이클에서 호출되며,
   * 인자가 변경되지 않더라도 호출됩니다.
   */
  pure?: boolean;

  /**
   * `standalone`으로 표시된 Angular 파이프는 NgModule에 선언할 필요가 없습니다. 이러한
   * 파이프는 NgModule의 "중간 컨텍스트"(ex. 구성된 공급자)에 의존하지 않습니다.
   *
   * 독립형 컴포넌트, 디렉티브 및 파이프에 대한 자세한 정보는 [이 가이드](guide/components/importing)에서 확인할 수 있습니다.
   */
  standalone?: boolean;
}

/**
 * @Annotation
 * @publicApi
 */
export const Pipe: PipeDecorator = makeDecorator(
  'Pipe',
  (p: Pipe) => ({pure: true, ...p}),
  undefined,
  undefined,
  (type: Type<any>, meta: Pipe) => compilePipe(type, meta),
);

/**
 * @publicApi
 */
export interface InputDecorator {
  /**
   * 클래스 필드를 입력 속성으로 표시하고 구성 메타데이터를 제공합니다.
   * 입력 속성은 템플릿의 DOM 속성에 바인딩됩니다. 변경 감지 중,
   * Angular는 DOM 속성의 값으로 데이터 속성을 자동으로 업데이트합니다.
   *
   * @usageNotes
   *
   * 구성 요소가 인스턴스화될 때 템플릿에서 사용할 선택적 이름을 제공할 수 있습니다.
   * 이는 바인딩된 속성의 이름에 매핑됩니다. 기본적으로 바인딩된
   * 속성의 원래 이름이 입력 바인딩에 사용됩니다.
   *
   * 다음 예제는 두 개의 입력 속성이 있는 컴포넌트를 생성합니다.
   * 이 중 하나는 특별한 바인딩 이름을 부여받습니다.
   *
   * ```ts
   * import { Component, Input, numberAttribute, booleanAttribute } from '@angular/core';
   * @Component({
   *   selector: 'bank-account',
   *   template: `
   *     Bank Name: {{bankName}}
   *     Account Id: {{id}}
   *     Account Status: {{status ? 'Active' : 'InActive'}}
   *   `
   * })
   * class BankAccount {
   *   // 이 속성은 원래 이름을 사용하여 바인딩됩니다.
   *   // Input Decorator 내에서 true로 정의된 인자는 필수 요구 사항으로 만듭니다.
   *   @Input({ required: true }) bankName!: string;
   *   // 인자 별칭은 이 속성 값을 다른 속성 이름에 바인딩합니다.
   *   // 인자 변환은 입력 값을 문자열에서 숫자로 변환합니다.
   *   @Input({ alias:'account-id', transform: numberAttribute }) id: number;
   *   // 인자 변환은 입력 값을 문자열에서 불리언으로 변환합니다.
   *   @Input({ transform: booleanAttribute }) status: boolean;
   *   // 이 속성은 바인딩되지 않으며, Angular에 의해 자동으로 업데이트되지 않습니다.
   *   normalizedBankName: string;
   * }
   *
   * @Component({
   *   selector: 'app',
   *   template: `
   *     <bank-account bankName="RBC" account-id="4747" status="true"></bank-account>
   *   `
   * })
   * class App {}
   * ```
   *
   * @see [입력 속성](guide/components/inputs)
   * @see [출력 속성](guide/components/outputs)
   */
  (arg?: string | Input): any;
  new (arg?: string | Input): any;
}

/**
 * `Input` 속성의 메타데이터 타입입니다.
 *
 * @publicApi
 */
export interface Input {
  /**
   * 입력 속성이 바인딩될 DOM 속성의 이름입니다.
   */
  alias?: string;

  /**
   * 디렉티브가 기능하기 위해 입력이 필수인지 여부입니다.
   */
  required?: boolean;

  /**
   * 입력 값을 디렉티브 인스턴스에 할당하기 전에 변환할 함수를 정의합니다.
   */
  transform?: (value: any) => any;

  /**
   * @internal
   *
   * 입력이 신호 입력인지 여부입니다.
   *
   * 이 옵션은 JIT 호환성을 위해 존재합니다. 사용자가 이를 사용하지 않을 것으로 예상됩니다.
   * Angular는 내부 데이터 구조를 설정하기 위해 클래스로부터 입력을 캡처할 수 있는 방법이 필요합니다.
   * 이 작업은 컴포넌트가 인스턴스화되기 전에 발생해야 합니다.
   * 따라서 JIT 컴파일을 위해 신호 입력은 입력을 선언하는 추가 데코레이터가 필요합니다.
   * Angular는 이러한 JIT 사용을 자동으로 처리하기 위해 TS 변환기를 제공합니다(예: 테스트에서).
   */
  isSignal?: boolean;
}

/**
 * @Annotation
 * @publicApi
 */
export const Input: InputDecorator = makePropDecorator(
  'Input',
  (arg?: string | {alias?: string; required?: boolean}) => {
    if (!arg) {
      return {};
    }
    return typeof arg === 'string' ? {alias: arg} : arg;
  },
);

/**
 * 출력 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface OutputDecorator {
  /**
   * 클래스 필드를 출력 속성으로 표시하고 구성 메타데이터를 제공합니다.
   * 출력 속성에 바인딩된 DOM 속성은 변경 감지 중 자동으로 업데이트됩니다.
   *
   * @usageNotes
   *
   * 구성 요소가 인스턴스화될 때 템플릿에서 사용할 선택적 이름을 제공할 수 있습니다.
   * 이는 바인딩된 속성의 이름에 매핑됩니다. 기본적으로 바인딩된
   * 속성의 원래 이름이 출력 바인딩에 사용됩니다.
   *
   * 바인딩 이름 제공의 예는 `Input` 데코레이터를 참조하십시오.
   *
   * @see [입력 속성](guide/components/inputs)
   * @see [출력 속성](guide/components/outputs)
   *
   */
  (alias?: string): any;
  new (alias?: string): any;
}

/**
 * 출력 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Output {
  /**
   * 출력 속성이 바인딩될 DOM 속성의 이름입니다.
   */
  alias?: string;
}

/**
 * @Annotation
 * @publicApi
 */
export const Output: OutputDecorator = makePropDecorator('Output', (alias?: string) => ({alias}));

/**
 * 호스트 바인딩 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface HostBindingDecorator {
  /**
   * DOM 속성이나 요소 클래스, 스타일 또는 속성을 호스트 바인딩
   * 속성으로 표시하고 구성 메타데이터를 제공합니다. Angular는 변경 감지 중
   * 호스트 바인딩을 자동으로 확인하며,
   * 바인딩이 변경되면 디렉티브의 호스트 요소를 업데이트합니다.
   *
   * @usageNotes
   *
   * 다음 예제는 `ngModel` 디렉티브가 있는 DOM 요소에 대해 `valid` 및 `invalid`
   * 클래스를 설정하는 디렉티브를 생성합니다.
   *
   * ```ts
   * @Directive({selector: '[ngModel]'})
   * class NgModelStatus {
   *   constructor(public control: NgModel) {}
   *   // 클래스 바인딩
   *   @HostBinding('class.valid') get valid() { return this.control.valid; }
   *   @HostBinding('class.invalid') get invalid() { return this.control.invalid; }
   *
   *   // 스타일 바인딩
   *   @HostBinding('style.color') get color() { return this.control.valid ? 'green': 'red'; }
   *
   *   // 스타일 바인딩은 스타일 단위 확장도 지원합니다.
   *   @HostBinding('style.width.px') @Input() width: number = 500;
   *
   *   // 속성 바인딩
   *   @HostBinding('attr.aria-required')
   *   @Input() required: boolean = false;
   *
   *   // 속성 바인딩
   *   @HostBinding('id') get id() { return this.control.value?.length ? 'odd':  'even'; }
   *
   * @Component({
   *   selector: 'app',
   *   template: `<input [(ngModel)]="prop">`,
   * })
   * class App {
   *   prop;
   * }
   * ```
   *
   */
  (hostPropertyName?: string): any;
  new (hostPropertyName?: string): any;
}

/**
 * 호스트 바인딩 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface HostBinding {
  /**
   * 데이터 속성에 바인딩되는 DOM 속성입니다.
   * 이 필드는 다음을 허용합니다:
   *   * 클래스, `class.`로 접두사
   *   * 스타일, `style.`로 접두사
   *   * 속성, `attr.`로 접두사
   */
  hostPropertyName?: string;
}

/**
 * @Annotation
 * @publicApi
 */
export const HostBinding: HostBindingDecorator = makePropDecorator(
  'HostBinding',
  (hostPropertyName?: string) => ({hostPropertyName}),
);

/**
 * 호스트 리스너 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface HostListenerDecorator {
  /**
   * 수신할 DOM 이벤트를 선언하고,
   * 그 이벤트가 발생할 때 실행할 핸들러 메서드를 제공합니다.
   *
   * Angular는 호스트 요소가 지정된 이벤트를 발생시킬 때
   * 제공된 핸들러 메서드를 호출하고,
   * 결과로 바인딩된 요소를 업데이트합니다.
   *
   * 핸들러 메서드가 false를 반환하면, 바인딩된 요소에 대해 `preventDefault`가 적용됩니다.
   *
   * @usageNotes
   *
   * 다음 예제는 버튼에 클릭 리스터를 첨부하고 클릭 수를 계산하는
   * 디렉티브를 선언합니다.
   *
   * ```ts
   * @Directive({selector: 'button[counting]'})
   * class CountClicks {
   *   numberOfClicks = 0;
   *
   *   @HostListener('click', ['$event.target'])
   *   onClick(btn) {
   *     console.log('button', btn, 'number of clicks:', this.numberOfClicks++);
   *   }
   * }
   *
   * @Component({
   *   selector: 'app',
   *   template: '<button counting>Increment</button>',
   * })
   * class App {}
   * ```
   *
   * 다음 예제는 전역 `window`에서 `Enter` 키 입력 이벤트를 수신하는
   * 또 다른 DOM 이벤트 핸들러를 등록합니다.
   * ```ts
   * import { HostListener, Component } from "@angular/core";
   *
   * @Component({
   *   selector: 'app',
   *   template: `<h1>Hello, you have pressed enter {{counter}} number of times!</h1> Press enter
   * key to increment the counter. <button (click)="resetCounter()">Reset Counter</button>`
   * })
   * class AppComponent {
   *   counter = 0;
   *   @HostListener('window:keydown.enter', ['$event'])
   *   handleKeyDown(event: KeyboardEvent) {
   *     this.counter++;
   *   }
   *   resetCounter() {
   *     this.counter = 0;
   *   }
   * }
   * ```
   * 유효한 키 이름 목록은 다음에서 확인할 수 있습니다:
   * https://www.w3.org/TR/DOM-Level-3-Events-key/#named-key-attribute-values
   *
   * 키를 조합할 수도 있습니다. 예: `@HostListener('keydown.shift.a')`.
   *
   * 이벤트 이름 접두사에 사용할 수 있는 전역 대상 이름은
   * `document:`, `window:` 및 `body:`입니다.
   *
   */
  (eventName: string, args?: string[]): any;
  new (eventName: string, args?: string[]): any;
}

/**
 * 호스트 리스너 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface HostListener {
  /**
   * 수신할 DOM 이벤트입니다.
   */
  eventName?: string;
  /**
   * 이벤트가 발생할 때 핸들러 메서드에 전달할 인수 집합입니다.
   */
  args?: string[];
}

/**
 * @Annotation
 * @publicApi
 */
export const HostListener: HostListenerDecorator = makePropDecorator(
  'HostListener',
  (eventName?: string, args?: string[]) => ({eventName, args}),
);
