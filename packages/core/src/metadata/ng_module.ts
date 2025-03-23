/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {EnvironmentProviders, ModuleWithProviders, Provider} from '../di/interface/provider';
import {Type} from '../interface/type';
import {SchemaMetadata} from '../metadata/schema';
import {compileNgModule} from '../render3/jit/module';
import {makeDecorator, TypeDecorator} from '../util/decorators';

/**
 * NgModule 데코레이터 / 생성자 함수의 유형.
 *
 * @publicApi
 */
export interface NgModuleDecorator {
  /**
   * 클래스를 NgModule로 표시하고 구성 메타데이터를 제공합니다.
   */
  (obj?: NgModule): TypeDecorator;
  new (obj?: NgModule): NgModule;
}

/**
 * NgModule 메타데이터의 유형.
 *
 * @publicApi
 */
export interface NgModule {
  /**
   * 이 모듈의 주입기에 사용할 수 있는 주입 가능한 객체 집합입니다.
   *
   * @see [의존성 주입 가이드](guide/di/dependency-injection)
   * @see [NgModule 가이드](guide/ngmodules/providers)
   *
   * @usageNotes
   *
   * 여기 나열된 프로바이더의 의존성은 이 주입기의 자식인 모든 구성 요소, 디렉티브, 파이프 또는 서비스에 주입할 수 있습니다.
   * 부트스트랩에 사용된 NgModule은 루트 주입기를 사용하며, 앱의 모든 부분에 의존성을 제공할 수 있습니다.
   *
   * 지연 로드된 모듈은 자신만의 주입기를 가지며, 일반적으로 앱 루트 주입기의 자식입니다.
   * 지연 로드된 서비스는 지연 로드된 모듈의 주입기에 스코프가 지정됩니다.
   * 만약 지연 로드된 모듈이 `UserService`를 제공한다면, 해당 모듈의 컨텍스트 내에서 생성된 구성 요소(예: 라우터 탐색에 의해서)는
   * 루트 주입기의 인스턴스가 아닌 서비스의 로컬 인스턴스를 가져옵니다.
   * 외부 모듈의 구성 요소는 계속해서 해당 주입기에서 제공하는 인스턴스를 받습니다.
   *
   * ### 예제
   *
   * 다음 예제는 HelloWorld NgModule에 주입된 클래스를 정의합니다:
   *
   * ```ts
   * class Greeter {
   *    greet(name:string) {
   *      return 'Hello ' + name + '!';
   *    }
   * }
   *
   * @NgModule({
   *   providers: [
   *     Greeter
   *   ]
   * })
   * class HelloWorld {
   *   greeter:Greeter;
   *
   *   constructor(greeter:Greeter) {
   *     this.greeter = greeter;
   *   }
   * }
   * ```
   */
  providers?: Array<Provider | EnvironmentProviders>;

  /**
   * 이 모듈에 속하는 구성 요소, 디렉티브 및 파이프(선언 가능 항목)의 집합입니다.
   *
   * @usageNotes
   *
   * 템플릿에서 사용할 수 있는 선택자의 집합은 여기 선언된 것과
   * 가져온 NgModules에서 내보낸 선택자를 포함합니다.
   *
   * 선언 가능 항목은 정확히 하나의 모듈에 속해야 합니다.
   * 동일한 클래스를 여러 모듈에 선언하려고 하면 컴파일러가 오류를 발생시킵니다.
   * 다른 모듈에서 가져온 클래스를 선언하지 않도록 주의하십시오.
   *
   * ### 예제
   *
   * 다음 예제는 CommonModule이 `NgFor` 디렉티브를 사용할 수 있게 합니다.
   *
   * ```javascript
   * @NgModule({
   *   declarations: [NgFor]
   * })
   * class CommonModule {
   * }
   * ```
   */
  declarations?: Array<Type<any> | any[]>;

  /**
   * 이 모듈의 템플릿에서 사용할 수 있는 내보내진 선언 가능 항목이 있는 NgModules의 집합입니다.
   *
   * @usageNotes
   *
   * 템플릿은 가져온 모듈의 내보내진 선언 가능 항목을 사용할 수 있습니다.
   * 여기에는 간접적으로 가져오고 재내보내는 모듈의 항목이 포함됩니다.
   * 예를 들어, `ModuleA`가 `ModuleB`를 가져오고, 이를 내보내면
   * `ModuleA`가 가져온 곳 어디에서로나 `ModuleB`의 선언 가능 항목을 사용할 수 있습니다.
   *
   * ### 예제
   *
   * 다음 예제는 MainModule이 `CommonModule`이 내보낸 모든 것을 사용할 수 있게 합니다:
   *
   * ```javascript
   * @NgModule({
   *   imports: [CommonModule]
   * })
   * class MainModule {
   * }
   * ```
   *
   */
  imports?: Array<Type<any> | ModuleWithProviders<{}> | any[]>;

  /**
   * 이 NgModule에 선언된 구성 요소, 디렉티브 및 파이프집합으로, 이
   * NgModule를 가져오는 NgModule의 모든 구성 요소의 템플릿에서 사용할 수 있습니다. 내보낸 선언은 모듈의 공개 API입니다.
   *
   * 선언 가능 항목은 하나의 NgModule에만 속합니다.
   * 모듈은 자신의 내보내기 목록에 다른 모듈을 나열할 수 있으며, 이 경우 해당 모듈의 모든
   * 공개 선언이 내보내집니다.
   *
   * @usageNotes
   *
   * 기본적으로 선언은 비공식입니다.
   * 이 ModuleA가 UserComponent를 내보내지 않으면, 오직 이
   * ModuleA 내의 구성 요소만이 UserComponent를 사용할 수 있습니다.
   *
   * ModuleA는 ModuleB를 가져오고 그것을 내보내어 ModuleA를 가져오는 NgModule에 ModuleB의 내보내기를 사용할 수 있습니다.
   *
   * ### 예제
   *
   * 다음 예제는 CommonModule에서 `NgFor` 디렉티브를 내보냅니다.
   *
   * ```javascript
   * @NgModule({
   *   exports: [NgFor]
   * })
   * class CommonModule {
   * }
   * ```
   */
  exports?: Array<Type<any> | any[]>;

  /**
   * 이 모듈이 부트스트랩 될 때 부트스트랩되는 구성 요소의 집합입니다.
   */
  bootstrap?: Array<Type<any> | any[]>;

  /**
   * NgModule에서 사용이 허용된 요소를 선언하는 스키마 집합입니다.
   * Angular 구성 요소나 디렉티브가 아닌 요소 및 속성은
   * 스키마에 선언해야 합니다.
   *
   * 허용된 값은 `NO_ERRORS_SCHEMA` 및 `CUSTOM_ELEMENTS_SCHEMA`입니다.
   *
   * @security `NO_ERRORS_SCHEMA` 또는 `CUSTOM_ELEMENTS_SCHEMA` 중 하나를 사용할 때
   * 허용된 요소와 속성이 입력을 안전하게 이스케이프하도록 해야 합니다.
   */
  schemas?: Array<SchemaMetadata | any[]>;

  /**
   * `getNgModuleById`에서 이 NgModule을 고유하게 식별하는 이름 또는 경로입니다.
   * `undefined`로 두면 NgModule은 `getNgModuleById`에 등록되지 않습니다.
   */
  id?: string;

  /**
   * 존재하는 경우, 이 모듈은 AOT 컴파일러에 의해 무시됩니다.
   * 배포 코드에 남아 있으며, JIT 컴파일러는 런타임에 이를 컴파일하려고 시도합니다.
   * 올바른 동작을 보장하려면 앱이 `@angular/compiler`를 가져와야 합니다.
   */
  jit?: true;
}

/**
 * @Annotation
 */
export const NgModule: NgModuleDecorator = makeDecorator(
  'NgModule',
  (ngModule: NgModule) => ngModule,
  undefined,
  undefined,
  /**
   * 다음 클래스를 NgModule로 표시하고 이에 대한 구성 메타데이터를 제공합니다.
   *
   * * `declarations` 옵션은 NgModule에 속하는 항목에 대한 정보를 사용하여
   * 컴파일러를 구성합니다.
   * * `providers` 옵션은 NgModule 멤버에 대한 의존성을 제공하기 위해
   * NgModule의 주입기를 구성합니다.
   * * `imports` 및 `exports` 옵션은 다른 모듈의 멤버를 가져오고
   * 이 모듈의 멤버를 다른 모듈에 제공합니다.
   */
  (type: Type<any>, meta: NgModule) => compileNgModule(type, meta),
);
