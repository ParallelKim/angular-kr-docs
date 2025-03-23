/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';

import type {Component} from './directives';

/**
 * JIT 컴파일과 함께 사용될 때 `@Component`에서 리소스 URL을 해결하는 데 사용됩니다.
 *
 * 예:
 * ```ts
 * @Component({
 *   selector: 'my-comp',
 *   templateUrl: 'my-comp.html', // 이는 비동기 해결이 필요합니다
 * })
 * class MyComponent{
 * }
 *
 * // `renderComponent`를 호출하면 실패합니다. 왜냐하면 `renderComponent`는 동기적 프로세스이며
 * // `MyComponent`의 `@Component.templateUrl`은 비동기적으로 해결되어야 합니다.
 *
 * // `resolveComponentResources()`를 호출하면 `@Component.templateUrl`이
 * // `@Component.template`로 해결되어 `renderComponent`가 동기적 방식으로 진행할 수 있습니다.
 *
 * // 브라우저의 `fetch()` 함수를 기본 리소스 해결 전략으로 사용합니다.
 * resolveComponentResources(fetch).then(() => {
 *   // 해결 후 모든 URL이 `template` 문자열로 변환되었습니다.
 *   renderComponent(MyComponent);
 * });
 *
 * ```
 *
 * 참고: AOT에서는 해결이 컴파일 중에 발생하므로 JIT 모드 외부에서 이 메소드를 호출할 필요가 없습니다.
 *
 * @param resourceResolver 해결된 URL의 내용을 반환할 `Promise`를 반환하는 기능입니다.
 * 브라우저의 `fetch()` 메서드는 좋은 기본 구현입니다.
 */
export function resolveComponentResources(
  resourceResolver: (url: string) => Promise<string | {text(): Promise<string>}>,
): Promise<void> {
  // 리소스를 가져오는 모든 약속을 저장합니다.
  const componentResolved: Promise<void>[] = [];

  // 같은 리소스를 두 번 이상 가져오지 않도록 캐시를 만듭니다.
  const urlMap = new Map<string, Promise<string>>();
  function cachedResourceResolve(url: string): Promise<string> {
    let promise = urlMap.get(url);
    if (!promise) {
      const resp = resourceResolver(url);
      urlMap.set(url, (promise = resp.then(unwrapResponse)));
    }
    return promise;
  }

  componentResourceResolutionQueue.forEach((component: Component, type: Type<any>) => {
    const promises: Promise<void>[] = [];
    if (component.templateUrl) {
      promises.push(
        cachedResourceResolve(component.templateUrl).then((template) => {
          component.template = template;
        }),
      );
    }
    const styles =
      typeof component.styles === 'string' ? [component.styles] : component.styles || [];
    component.styles = styles;

    if (component.styleUrl && component.styleUrls?.length) {
      throw new Error(
        '@Component는 `styleUrl`과 `styleUrls`를 동시에 정의할 수 없습니다. ' +
          '하나의 스타일시트가 있을 경우 `styleUrl`을 사용하고, 여러 개의 스타일시트가 있을 경우 `styleUrls`를 사용하세요.',
      );
    } else if (component.styleUrls?.length) {
      const styleOffset = component.styles.length;
      const styleUrls = component.styleUrls;
      component.styleUrls.forEach((styleUrl, index) => {
        styles.push(''); // 배열 미리 할당.
        promises.push(
          cachedResourceResolve(styleUrl).then((style) => {
            styles[styleOffset + index] = style;
            styleUrls.splice(styleUrls.indexOf(styleUrl), 1);
            if (styleUrls.length == 0) {
              component.styleUrls = undefined;
            }
          }),
        );
      });
    } else if (component.styleUrl) {
      promises.push(
        cachedResourceResolve(component.styleUrl).then((style) => {
          styles.push(style);
          component.styleUrl = undefined;
        }),
      );
    }

    const fullyResolved = Promise.all(promises).then(() => componentDefResolved(type));
    componentResolved.push(fullyResolved);
  });
  clearResolutionOfComponentResourcesQueue();
  return Promise.all(componentResolved).then(() => undefined);
}

let componentResourceResolutionQueue = new Map<Type<any>, Component>();

// Type에 대해 기존 ɵcmp가 리소스를 기다리고 있는지 추적합니다.
const componentDefPendingResolution = new Set<Type<any>>();

export function maybeQueueResolutionOfComponentResources(type: Type<any>, metadata: Component) {
  if (componentNeedsResolution(metadata)) {
    componentResourceResolutionQueue.set(type, metadata);
    componentDefPendingResolution.add(type);
  }
}

export function isComponentDefPendingResolution(type: Type<any>): boolean {
  return componentDefPendingResolution.has(type);
}

export function componentNeedsResolution(component: Component): boolean {
  return !!(
    (component.templateUrl && !component.hasOwnProperty('template')) ||
    (component.styleUrls && component.styleUrls.length) ||
    component.styleUrl
  );
}
export function clearResolutionOfComponentResourcesQueue(): Map<Type<any>, Component> {
  const old = componentResourceResolutionQueue;
  componentResourceResolutionQueue = new Map();
  return old;
}

export function restoreComponentResolutionQueue(queue: Map<Type<any>, Component>): void {
  componentDefPendingResolution.clear();
  queue.forEach((_, type) => componentDefPendingResolution.add(type));
  componentResourceResolutionQueue = queue;
}

export function isComponentResourceResolutionQueueEmpty() {
  return componentResourceResolutionQueue.size === 0;
}

function unwrapResponse(response: string | {text(): Promise<string>}): string | Promise<string> {
  return typeof response == 'string' ? response : response.text();
}

function componentDefResolved(type: Type<any>): void {
  componentDefPendingResolution.delete(type);
}
