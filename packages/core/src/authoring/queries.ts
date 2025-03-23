/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {assertInInjectionContext} from '../di';
import {ProviderToken} from '../di/provider_token';
import {
  createMultiResultQuerySignalFn,
  createSingleResultOptionalQuerySignalFn,
  createSingleResultRequiredQuerySignalFn,
} from '../render3/queries/query_reactive';
import {Signal} from '../render3/reactivity/api';

function viewChildFn<LocatorT, ReadT>(
  locator: ProviderToken<LocatorT> | string,
  opts?: {read?: ProviderToken<ReadT>; debugName?: string},
): Signal<ReadT | undefined> {
  ngDevMode && assertInInjectionContext(viewChild);
  return createSingleResultOptionalQuerySignalFn<ReadT>(opts);
}

function viewChildRequiredFn<LocatorT, ReadT>(
  locator: ProviderToken<LocatorT> | string,
  opts?: {read?: ProviderToken<ReadT>; debugName?: string},
): Signal<ReadT> {
  ngDevMode && assertInInjectionContext(viewChild);
  return createSingleResultRequiredQuerySignalFn<ReadT>(opts);
}

/**
 * `viewChild` 함수의 유형. viewChild 함수는 단일 뷰 쿼리를 생성합니다.
 *
 * 이 함수는 `viewChild.required` 속성을 통해 필수 쿼리 결과에 접근할 수 있는 특별한 기능을 제공합니다.
 *
 * @publicAPI
 * @docsPrivate `viewChild`가 표준 API 엔트리이므로 무시됩니다.
 */
export interface ViewChildFunction {
  /**
   * 뷰 자식 쿼리를 초기화합니다. 항상 일치해야 하는 쿼리에는 `viewChild.required`를 사용하는 것을 고려하십시오.
   *
   * @publicAPI
   */

  <LocatorT, ReadT>(
    locator: ProviderToken<LocatorT> | string,
    opts: {
      read: ProviderToken<ReadT>;
      debugName?: string;
    },
  ): Signal<ReadT | undefined>;

  <LocatorT>(
    locator: ProviderToken<LocatorT> | string,
    opts?: {
      debugName?: string;
    },
  ): Signal<LocatorT | undefined>;

  /**
   * 항상 요소와 일치할 것으로 예상되는 뷰 자식 쿼리를 초기화합니다.
   *
   * @publicAPI
   */
  required: {
    <LocatorT>(
      locator: ProviderToken<LocatorT> | string,
      opts?: {
        debugName?: string;
      },
    ): Signal<LocatorT>;

    <LocatorT, ReadT>(
      locator: ProviderToken<LocatorT> | string,
      opts: {
        read: ProviderToken<ReadT>;
        debugName?: string;
      },
    ): Signal<ReadT>;
  };
}

/**
 * 뷰 자식 쿼리를 초기화합니다.
 *
 * 항상 일치해야 하는 쿼리에는 `viewChild.required`를 사용하는 것을 고려하십시오.
 *
 * @usageNotes
 * 컴포넌트에서 class 필드를 선언하고 `viewChild()` 함수로 초기화하여 자식 쿼리를 생성하십시오.
 *
 * ```angular-ts
 * @Component({template: '<div #el></div><my-component #cmp />'})
 * export class TestComponent {
 *   divEl = viewChild<ElementRef>('el');                   // Signal<ElementRef|undefined>
 *   divElRequired = viewChild.required<ElementRef>('el');  // Signal<ElementRef>
 *   cmp = viewChild(MyComponent);                          // Signal<MyComponent|undefined>
 *   cmpRequired = viewChild.required(MyComponent);         // Signal<MyComponent>
 * }
 * ```
 *
 * @publicAPI
 * @initializerApiFunction
 */
export const viewChild: ViewChildFunction = (() => {
  // 참고: 이것은 부작용으로 간주될 수 있지만, 사용자가 보는 `viewChild` 내보내기를
  // 접근하지 않는 한 이 할당에 의존하는 것은 없습니다. 사용자가
  // 보는 `viewChild` 내보내기에 국한된 자급자족 부작용입니다.
  (viewChildFn as any).required = viewChildRequiredFn;
  return viewChildFn as typeof viewChildFn & {required: typeof viewChildRequiredFn};
})();

export function viewChildren<LocatorT>(
  locator: ProviderToken<LocatorT> | string,
  opts?: {debugName?: string},
): Signal<ReadonlyArray<LocatorT>>;
export function viewChildren<LocatorT, ReadT>(
  locator: ProviderToken<LocatorT> | string,
  opts: {
    read: ProviderToken<ReadT>;
    debugName?: string;
  },
): Signal<ReadonlyArray<ReadT>>;

/**
 * 뷰 자식 쿼리를 초기화합니다.
 *
 * 쿼리 결과는 일치하는 모든 요소를 포함하는 읽기 전용 컬렉션의 신호로 표현됩니다.
 *
 * @usageNotes
 * 컴포넌트에서 class 필드를 선언하고 `viewChildren()` 함수로 초기화하여 자식 쿼리를 생성하십시오.
 *
 * ```ts
 * @Component({...})
 * export class TestComponent {
 *   divEls = viewChildren<ElementRef>('el');   // Signal<ReadonlyArray<ElementRef>>
 * }
 * ```
 *
 * @initializerApiFunction
 * @publicAPI
 */
export function viewChildren<LocatorT, ReadT>(
  locator: ProviderToken<LocatorT> | string,
  opts?: {
    read?: ProviderToken<ReadT>;
    debugName?: string;
  },
): Signal<ReadonlyArray<ReadT>> {
  ngDevMode && assertInInjectionContext(viewChildren);
  return createMultiResultQuerySignalFn<ReadT>(opts);
}

export function contentChildFn<LocatorT, ReadT>(
  locator: ProviderToken<LocatorT> | string,
  opts?: {
    descendants?: boolean;
    read?: ProviderToken<ReadT>;
    debugName?: string;
  },
): Signal<ReadT | undefined> {
  ngDevMode && assertInInjectionContext(contentChild);
  return createSingleResultOptionalQuerySignalFn<ReadT>(opts);
}

function contentChildRequiredFn<LocatorT, ReadT>(
  locator: ProviderToken<LocatorT> | string,
  opts?: {
    descendants?: boolean;
    read?: ProviderToken<ReadT>;
    debugName?: string;
  },
): Signal<ReadT> {
  ngDevMode && assertInInjectionContext(contentChildren);
  return createSingleResultRequiredQuerySignalFn<ReadT>(opts);
}

/**
 * `contentChild` 함수의 유형.
 *
 * contentChild 함수는 단일 콘텐츠 쿼리를 생성합니다. 이 함수는
 * `.required` 속성을 통해 필수 쿼리 결과에 접근할 수 있는 특별한 기능을 제공합니다.
 *
 * @publicAPI
 * @docsPrivate `contentChild`가 표준 API 엔트리이므로 무시됩니다.
 */
export interface ContentChildFunction {
  /**
   * 콘텐츠 자식 쿼리를 초기화합니다.
   *
   * 항상 일치해야 하는 쿼리에는 `contentChild.required`를 사용하는 것을 고려하십시오.
   * @publicAPI
   */
  <LocatorT>(
    locator: ProviderToken<LocatorT> | string,
    opts?: {
      descendants?: boolean;
      read?: undefined;
      debugName?: string;
    },
  ): Signal<LocatorT | undefined>;

  <LocatorT, ReadT>(
    locator: ProviderToken<LocatorT> | string,
    opts: {
      descendants?: boolean;
      read: ProviderToken<ReadT>;
      debugName?: string;
    },
  ): Signal<ReadT | undefined>;

  /**
   * 항상 일치할 것으로 예상되는 콘텐츠 자식 쿼리를 초기화합니다.
   */
  required: {
    <LocatorT>(
      locator: ProviderToken<LocatorT> | string,
      opts?: {
        descendants?: boolean;
        read?: undefined;
        debugName?: string;
      },
    ): Signal<LocatorT>;

    <LocatorT, ReadT>(
      locator: ProviderToken<LocatorT> | string,
      opts: {
        descendants?: boolean;
        read: ProviderToken<ReadT>;
        debugName?: string;
      },
    ): Signal<ReadT>;
  };
}

/**
 * 콘텐츠 자식 쿼리를 초기화합니다. 항상 일치해야 하는 쿼리에는 `contentChild.required`를 사용하는 것을 고려하십시오.
 *
 * @usageNotes
 * 컴포넌트에서 클래스 필드를 선언하고 `contentChild()` 함수로 초기화하여 자식 쿼리를 생성하십시오.
 *
 * ```ts
 * @Component({...})
 * export class TestComponent {
 *   headerEl = contentChild<ElementRef>('h');                    // Signal<ElementRef|undefined>
 *   headerElRequired = contentChild.required<ElementRef>('h'); // Signal<ElementRef>
 *   header = contentChild(MyHeader);                             // Signal<MyHeader|undefined>
 *   headerRequired = contentChild.required(MyHeader);            // Signal<MyHeader>
 * }
 * ```
 *
 * @initializerApiFunction
 * @publicAPI
 */
export const contentChild: ContentChildFunction = (() => {
  // 참고: 이것은 부작용으로 간주될 수 있지만, 사용자가 보는 `viewChild` 내보내기를
  // 접근하지 않는 한 이 할당에 의존하는 것은 없습니다. 사용자가
  // 보는 `viewChild` 내보내기에 국한된 자급자족 부작용입니다.
  (contentChildFn as any).required = contentChildRequiredFn;
  return contentChildFn as typeof contentChildFn & {required: typeof contentChildRequiredFn};
})();

export function contentChildren<LocatorT>(
  locator: ProviderToken<LocatorT> | string,
  opts?: {
    descendants?: boolean;
    read?: undefined;
    debugName?: string;
  },
): Signal<ReadonlyArray<LocatorT>>;
export function contentChildren<LocatorT, ReadT>(
  locator: ProviderToken<LocatorT> | string,
  opts: {
    descendants?: boolean;
    read: ProviderToken<ReadT>;
    debugName?: string;
  },
): Signal<ReadonlyArray<ReadT>>;

/**
 * 콘텐츠 자식 쿼리를 초기화합니다.
 *
 * 쿼리 결과는 일치하는 모든 요소를 포함하는 읽기 전용 컬렉션의 신호로 표현됩니다.
 *
 * @usageNotes
 * 컴포넌트에서 클래스 필드를 선언하고 `contentChildren()` 함수로 초기화하여 자식 쿼리를 생성하십시오.
 *
 * ```ts
 * @Component({...})
 * export class TestComponent {
 *   headerEl = contentChildren<ElementRef>('h');   // Signal<ReadonlyArray<ElementRef>>
 * }
 * ```
 *
 * @initializerApiFunction
 * @publicAPI
 */
export function contentChildren<LocatorT, ReadT>(
  locator: ProviderToken<LocatorT> | string,
  opts?: {
    descendants?: boolean;
    read?: ProviderToken<ReadT>;
    debugName?: string;
  },
): Signal<ReadonlyArray<ReadT>> {
  return createMultiResultQuerySignalFn<ReadT>(opts);
}
