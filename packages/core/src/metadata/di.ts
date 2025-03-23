/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ProviderToken} from '../di/provider_token';
import {makePropDecorator} from '../util/decorators';

/**
 * `Attribute` 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface AttributeDecorator {
  /**
   * 상수 속성 값이 주입되어야 함을 지정합니다.
   *
   * 지시자는 호스트 요소 속성의 상수 문자열 리터럴을 주입할 수 있습니다.
   *
   * @usageNotes
   *
   * `<input>` 요소가 있고 그 `type`을 알고 싶다고 가정합니다.
   *
   * ```html
   * <input type="text">
   * ```
   *
   * 데코레이터는 다음 예와 같이 문자열 리터럴 `text`를 주입할 수 있습니다.
   *
   * {@example core/ts/metadata/metadata.ts region='attributeMetadata'}
   *
   * @publicApi
   */
  (name: string): any;
  new (name: string): Attribute;
}

/**
 * Attribute 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Attribute {
  /**
   * 생성자에 주입될 속성의 이름입니다.
   */
  attributeName?: string;
}

/**
 * 쿼리 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export interface Query {
  descendants: boolean;
  emitDistinctChangesOnly: boolean;
  first: boolean;
  read: any;
  isViewQuery: boolean;
  selector: any;
  static?: boolean;

  /**
   * @internal
   *
   * 쿼리가 신호 쿼리인지 여부입니다.
   *
   * 이 옵션은 JIT 호환성을 위해 존재합니다. 사용자가 이 옵션을 사용할 것으로 예상하지 않습니다.
   * Angular는 내부 쿼리 기능을 생성할 수 있도록 클래스로부터 쿼리를 캡처하는 방법이 필요합니다.
   * 이는 구성 요소가 인스턴스화되기 전에 발생해야 합니다.
   * 이로 인해 JIT 컴파일을 위해 신호 쿼리는 쿼리를 선언하는 추가 데코레이터가 필요합니다.
   * Angular는 JIT 사용에 대해 이를 자동으로 처리하는 TS 변환기를 제공합니다(예: 테스트에서).
   */
  isSignal?: boolean;
}

// `emitDistinctChangesOnly`가 명시적으로 설정되지 않았을 때의 기본값을 저장합니다.
export const emitDistinctChangesOnlyDefaultValue = true;

/**
 * 쿼리 메타데이터의 기본 클래스입니다.
 *
 * @see {@link ContentChildren}
 * @see {@link ContentChild}
 * @see {@link ViewChildren}
 * @see {@link ViewChild}
 *
 * @publicApi
 */
export abstract class Query {}

/**
 * ContentChildren 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @see {@link ContentChildren}
 * @publicApi
 */
export interface ContentChildrenDecorator {
  /**
   * @description
   * 콘텐츠 쿼리를 구성하는 속성 데코레이터입니다.
   *
   * 콘텐츠 DOM에서 요소 또는 지시자의 `QueryList`를 가져오는 데 사용합니다.
   * 자식 요소가 추가, 제거 또는 이동할 때마다 쿼리 리스트가 업데이트되고,
   * 쿼리 리스트의 변경 관찰자는 새 값을 방출합니다.
   *
   * 콘텐츠 쿼리는 `ngAfterContentInit` 콜백이 호출되기 전에 설정됩니다.
   *
   * 구성 요소의 템플릿은 항상 조상에게 블랙 박스이므로 다른 구성 요소의 템플릿에 있는 요소
   * 또는 지시자를 검색하지 않습니다.
   *
   * **메타데이터 속성**:
   *
   * * **selector** - 쿼리에 사용되는 지시자 유형 또는 이름입니다.
   * * **descendants** - `true`인 경우 요소의 모든 하위 요소를 포함합니다. `false`인 경우
   *   요소의 직접 자식만 쿼리합니다.
   * * **emitDistinctChangesOnly** - `QueryList#changes` 관찰자는 QueryList 결과가 변경된 경우에만
   *   새 값을 방출합니다. `false`인 경우 QueryList가 변경되지 않아도 `changes` 관찰자가
   *   방출될 수 있습니다.
   *   **주: ** 이 구성 옵션은 **사용 중단**, 영구적으로 `true`로 설정되며,
   *   향후 Angular 버전에서 제거됩니다.
   * * **read** - 쿼리된 요소에서 다른 토큰을 읽는 데 사용됩니다.
   *
   * 다음 선택자가 지원됩니다.
   *   * `@Component` 또는 `@Directive` 데코레이터가 있는 모든 클래스
   *   * 문자열로서의 템플릿 참조 변수 (예: `<my-component #cmp></my-component>` 쿼리와 함께
   *   `@ContentChildren('cmp')`)
   *   * 현재 구성 요소의 자식 구성 요소 트리에서 정의된 모든 공급자 (예:
   *   `@ContentChildren(SomeService) someService: SomeService`)
   *   * 문자열 토큰을 통해 정의된 모든 공급자 (예: `@ContentChildren('someToken')
   *   someTokenVal: any`)
   *   * `TemplateRef` (예: `<ng-template></ng-template>` 쿼리와 함께
   *   `@ContentChildren(TemplateRef) template;`)
   *
   * 추가로, 여러 개의 문자열 선택자는 쉼표로 구분할 수 있습니다 (예:
   * `@ContentChildren('cmp1,cmp2')`)
   *
   * `read`에서 지원되는 다음 값:
   *   * `@Component` 또는 `@Directive` 데코레이터가 있는 모든 클래스
   *   * 이 쿼리의 `selector`에 의해 일치하는 구성 요소의 인젝터에 정의된 모든 공급자
   *   * 문자열 토큰을 통해 정의된 모든 공급자 (예: `{provide: 'token', useValue: 'val'}`)
   *   * `TemplateRef`, `ElementRef`, 및 `ViewContainerRef`
   *
   * @usageNotes
   *
   * 아래는 `ContentChildren` 데코레이터를 사용하는 방법에 대한 간단한 시연입니다.
   *
   * {@example core/di/ts/contentChildren/content_children_howto.ts region='HowTo'}
   *
   * ### 탭 패널 예시
   *
   * 아래는 `ContentChildren` 데코레이터를 사용하여 탭 패널 구성 요소를 구현하는 방법을
   * 보여주는 약간 더 현실적인 예시입니다.
   *
   * {@example core/di/ts/contentChildren/content_children_example.ts region='Component'}
   *
   * @Annotation
   */
  (
    selector: ProviderToken<unknown> | Function | string,
    opts?: {
      descendants?: boolean;
      emitDistinctChangesOnly?: boolean;
      read?: any;
    },
  ): any;
  new (
    selector: ProviderToken<unknown> | Function | string,
    opts?: {descendants?: boolean; emitDistinctChangesOnly?: boolean; read?: any},
  ): Query;
}

/**
 * ContentChildren 메타데이터의 타입입니다.
 *
 * @Annotation
 * @publicApi
 */
export type ContentChildren = Query;

/**
 * ContentChildren 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const ContentChildren: ContentChildrenDecorator = makePropDecorator(
  'ContentChildren',
  (selector?: any, opts: any = {}) => ({
    selector,
    first: false,
    isViewQuery: false,
    descendants: false,
    emitDistinctChangesOnly: emitDistinctChangesOnlyDefaultValue,
    ...opts,
  }),
  Query,
);

/**
 * ContentChild 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @publicApi
 */
export interface ContentChildDecorator {
  /**
   * @description
   * 콘텐츠 쿼리를 구성하는 속성 데코레이터입니다.
   *
   * 콘텐츠 DOM에서 선택자와 일치하는 첫 번째 요소 또는 지시자를 가져오는 데 사용합니다.
   * 콘텐츠 DOM이 변경되고 새로운 자식이 선택자와 일치하면,
   * 속성이 업데이트됩니다.
   *
   * 구성 요소의 템플릿은 항상 조상에게 블랙 박스이므로 다른 구성 요소의 템플릿에 있는 요소
   * 또는 지시자를 검색하지 않습니다.
   *
   * **메타데이터 속성**:
   *
   * * **selector** - 쿼리에 사용되는 지시자 유형 또는 이름입니다.
   * * **descendants** - `true` (기본값)인 경우 요소의 모든 하위 요소를 포함합니다. `false`인 경우
   *   요소의 직접 자식만 쿼리합니다.
   * * **read** - 쿼리된 요소에서 다른 토큰을 읽는 데 사용됩니다.
   * * **static** - 변경 감지 실행 전에 쿼리 결과를 해결하려면 `true`로,
   * 변경 감지 후에 해결하려면 `false`로 설정합니다. 기본값은 false입니다.
   *
   * 다음 선택자가 지원됩니다.
   *   * `@Component` 또는 `@Directive` 데코레이터가 있는 모든 클래스
   *   * 문자열로서의 템플릿 참조 변수 (예: `<my-component #cmp></my-component>` 쿼리와 함께
   *   `@ContentChild('cmp')`)
   *   * 현재 구성 요소의 자식 구성 요소 트리에서 정의된 모든 공급자 (예:
   *   `@ContentChild(SomeService) someService: SomeService`)
   *   * 문자열 토큰을 통해 정의된 모든 공급자 (예: `@ContentChild('someToken') someTokenVal:
   * any`)
   *   * `TemplateRef` (예: `<ng-template></ng-template>` 쿼리와 함께
   *   `@ContentChild(TemplateRef) template;`)
   *
   * `read`에서 지원되는 다음 값:
   *   * `@Component` 또는 `@Directive` 데코레이터가 있는 모든 클래스
   *   * 이 쿼리의 `selector`에 의해 일치하는 구성 요소의 인젝터에 정의된 모든 공급자
   *   * 문자열 토큰을 통해 정의된 모든 공급자 (예: `{provide: 'token', useValue: 'val'}`)
   *   * `TemplateRef`, `ElementRef`, 및 `ViewContainerRef`
   *
   * 동적 쿼리와 정적 쿼리의 차이:
   *
   * | 쿼리                             | 세부사항 |
   * |:---                               |:---     |
   * | 동적 쿼리 \(`static: false`\)   | 쿼리는 `ngAfterContentInit()` 콜백이 호출되기 전에 해결됩니다.
   *   결과는 `ngIf` 및 `ngFor` 블록에 대한 변경 사항과 같은 뷰 변경 사항에 대해 업데이트됩니다. |
   * | 정적 쿼리 \(`static: true`\)     | 쿼리는 뷰가 생성된 후 한 번만 해결되지만
   *   변경 감지가 실행되기 전 ( `ngOnInit()` 콜백이 호출되기 전에) 해결됩니다.
   *   그러나 결과는 뷰의 변경 사항(예: `ngIf` 및 `ngFor` 블록의 변경 사항)을 반영하도록 업데이트되지 않습니다.  |
   *
   * @usageNotes
   *
   * {@example core/di/ts/contentChild/content_child_howto.ts region='HowTo'}
   *
   * ### 예시
   *
   * {@example core/di/ts/contentChild/content_child_example.ts region='Component'}
   *
   * @Annotation
   */
  (
    selector: ProviderToken<unknown> | Function | string,
    opts?: {descendants?: boolean; read?: any; static?: boolean},
  ): any;
  new (
    selector: ProviderToken<unknown> | Function | string,
    opts?: {descendants?: boolean; read?: any; static?: boolean},
  ): ContentChild;
}

/**
 * ContentChild 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export type ContentChild = Query;

/**
 * ContentChild 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 *
 * @publicApi
 */
export const ContentChild: ContentChildDecorator = makePropDecorator(
  'ContentChild',
  (selector?: any, opts: any = {}) => ({
    selector,
    first: true,
    isViewQuery: false,
    descendants: true,
    ...opts,
  }),
  Query,
);

/**
 * ViewChildren 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @see {@link ViewChildren}
 *
 * @publicApi
 */
export interface ViewChildrenDecorator {
  /**
   * @description
   * 뷰 쿼리를 구성하는 속성 데코레이터입니다.
   *
   * 뷰 DOM에서 요소 또는 지시자의 `QueryList`를 가져오는 데 사용합니다.
   * 자식 요소가 추가, 제거 또는 이동할 때마다 쿼리 리스트가 업데이트되고,
   * 쿼리 리스트의 변경 관찰자는 새 값을 방출합니다.
   *
   * View 쿼리는 `ngAfterViewInit` 콜백이 호출되기 전에 설정됩니다.
   *
   * **메타데이터 속성**:
   *
   * * **selector** - 쿼리에 사용되는 지시자 유형 또는 이름입니다.
   * * **read** - 쿼리된 요소에서 다른 토큰을 읽는 데 사용됩니다.
   * * **emitDistinctChangesOnly** - `QueryList#changes` 관찰자는 QueryList 결과가 변경된 경우에만
   *   새 값을 방출합니다. `false`인 경우 QueryList가 변경되지 않아도 `changes` 관찰자가
   *   방출될 수 있습니다.
   *   **주: ** 이 구성 옵션은 **사용 중단**, 영구적으로 `true`로 설정되며
   *   향후 Angular 버전에서 제거됩니다.
   *
   * 다음 선택자가 지원됩니다.
   *   * `@Component` 또는 `@Directive` 데코레이터가 있는 모든 클래스
   *   * 문자열로서의 템플릿 참조 변수 (예: `<my-component #cmp></my-component>`
   *   쿼리와 함께 `@ViewChildren('cmp')`)
   *   * 현재 구성 요소의 자식 구성 요소 트리에서 정의된 모든 공급자 (예:
   *   `@ViewChildren(SomeService) someService!: SomeService`)
   *   * 문자열 토큰을 통해 정의된 모든 공급자 (예: `@ViewChildren('someToken')
   *   someTokenVal!: any`)
   *   * `TemplateRef` (예: `<ng-template></ng-template>` 쿼리와 함께
   *   `@ViewChildren(TemplateRef) template;`)
   *
   * 추가로, 여러 개의 문자열 선택자는 쉼표로 구분할 수 있습니다 (예:
   *   `@ViewChildren('cmp1,cmp2')`)
   *
   * `read`에서 지원되는 다음 값:
   *   * `@Component` 또는 `@Directive` 데코레이터가 있는 모든 클래스
   *   * 이 쿼리의 `selector`에 의해 일치하는 구성 요소의 인젝터에 정의된 모든 공급자
   *   * 문자열 토큰을 통해 정의된 모든 공급자 (예: `{provide: 'token', useValue: 'val'}`)
   *   * `TemplateRef`, `ElementRef`, 및 `ViewContainerRef`
   *
   * @usageNotes
   *
   * {@example core/di/ts/viewChildren/view_children_howto.ts region='HowTo'}
   *
   * ### 또 다른 예시
   *
   * {@example core/di/ts/viewChildren/view_children_example.ts region='Component'}
   *
   * @Annotation
   */
  (
    selector: ProviderToken<unknown> | Function | string,
    opts?: {read?: any; emitDistinctChangesOnly?: boolean},
  ): any;
  new (
    selector: ProviderToken<unknown> | Function | string,
    opts?: {read?: any; emitDistinctChangesOnly?: boolean},
  ): ViewChildren;
}

/**
 * ViewChildren 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export type ViewChildren = Query;

/**
 * ViewChildren 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const ViewChildren: ViewChildrenDecorator = makePropDecorator(
  'ViewChildren',
  (selector?: any, opts: any = {}) => ({
    selector,
    first: false,
    isViewQuery: true,
    descendants: true,
    emitDistinctChangesOnly: emitDistinctChangesOnlyDefaultValue,
    ...opts,
  }),
  Query,
);

/**
 * ViewChild 데코레이터 / 생성자 함수의 타입입니다.
 *
 * @see {@link ViewChild}
 * @publicApi
 */
export interface ViewChildDecorator {
  /**
   * @description
   * 뷰 쿼리를 구성하는 속성 데코레이터입니다.
   * 변경 감지기는 뷰 DOM에서 선택자와 일치하는 첫 번째 요소 또는 지시자를 찾습니다.
   * 뷰 DOM이 변경되고 새로운 자식이 선택자와 일치하면,
   * 속성이 업데이트됩니다.
   *
   * **메타데이터 속성**:
   *
   * * **selector** - 쿼리에 사용되는 지시자 유형 또는 이름입니다.
   * * **read** - 쿼리된 요소에서 다른 토큰을 읽는 데 사용됩니다.
   * * **static** - 변경 감지 실행 전에 쿼리 결과를 해결하려면 `true`로,
   *   변경 감지 후에 해결하려면 `false`로 설정합니다. 기본값은 `false`입니다.
   *
   *
   * 다음 선택자가 지원됩니다.
   *   * `@Component` 또는 `@Directive` 데코레이터가 있는 모든 클래스
   *   * 문자열로서의 템플릿 참조 변수 (예: `<my-component #cmp></my-component>`
   *   쿼리와 함께 `@ViewChild('cmp')`)
   *   * 현재 구성 요소의 자식 구성 요소 트리에서 정의된 모든 공급자 (예:
   *   `@ViewChild(SomeService) someService: SomeService`)
   *   * 문자열 토큰을 통해 정의된 모든 공급자 (예: `@ViewChild('someToken') someTokenVal:
   * any`)
   *   * `TemplateRef` (예: `<ng-template></ng-template>` 쿼리와 함께
   *   `@ViewChild(TemplateRef) template;`)
   *
   * `read`에서 지원되는 다음 값:
   *   * `@Component` 또는 `@Directive` 데코레이터가 있는 모든 클래스
   *   * 이 쿼리의 `selector`에 의해 일치하는 구성 요소의 인젝터에 정의된 모든 공급자
   *   * 문자열 토큰을 통해 정의된 모든 공급자 (예: `{provide: 'token', useValue: 'val'}`)
   *   * `TemplateRef`, `ElementRef`, 및 `ViewContainerRef`
   *
   * 동적 쿼리와 정적 쿼리의 차이:
   *   * 동적 쿼리 \(`static: false`\) - 쿼리는 `ngAfterViewInit()` 콜백이 호출되기 전에
   *   해결됩니다. 결과는 `ngIf` 및 `ngFor` 블록과 같은 뷰 변경 사항에 대해 업데이트됩니다.
   *   * 정적 쿼리 \(`static: true`\) - 쿼리는 뷰가 생성된 후 한 번만 해결되지만,
   *   변경 감지 실행 전 ( `ngOnInit()` 콜백이 호출되기 전에) 해결됩니다.
   *   그러나 결과는 뷰의 변경 사항(예: `ngIf` 및 `ngFor` 블록의 변경 사항)을 반영하도록
   *   업데이트되지 않습니다.
   *
   * @usageNotes
   *
   * ### 예시 1
   *
   * {@example core/di/ts/viewChild/view_child_example.ts region='Component'}
   *
   * ### 예시 2
   *
   * {@example core/di/ts/viewChild/view_child_howto.ts region='HowTo'}
   *
   * @Annotation
   */
  (
    selector: ProviderToken<unknown> | Function | string,
    opts?: {read?: any; static?: boolean},
  ): any;
  new (
    selector: ProviderToken<unknown> | Function | string,
    opts?: {read?: any; static?: boolean},
  ): ViewChild;
}

/**
 * ViewChild 메타데이터의 타입입니다.
 *
 * @publicApi
 */
export type ViewChild = Query;

/**
 * ViewChild 데코레이터 및 메타데이터입니다.
 *
 * @Annotation
 * @publicApi
 */
export const ViewChild: ViewChildDecorator = makePropDecorator(
  'ViewChild',
  (selector: any, opts: any) => ({
    selector,
    first: true,
    isViewQuery: true,
    descendants: true,
    ...opts,
  }),
  Query,
);
