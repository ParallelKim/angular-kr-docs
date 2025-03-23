/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Observable} from 'rxjs';

import {
  EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  runInInjectionContext,
} from '../di';
import {RuntimeError, RuntimeErrorCode} from '../errors';
import {isPromise, isSubscribable} from '../util/lang';

/**
 * 하나 이상의 초기화 함수를 제공하는 데 사용할 수 있는 DI 토큰입니다.
 *
 * 제공된 함수들은 애플리케이션 시작 시 주입되어
 * 앱 초기화 과정에서 실행됩니다. 이러한 함수 중 하나라도 Promise나 Observable을 반환하면,
 * 초기화는 Promise가 해결되거나 Observable이 완료될 때까지 완료되지 않습니다.
 *
 * 예를 들어 언어 데이터 또는 외부 구성을 로드하는 팩토리 함수를 생성하고
 * 해당 함수를 `APP_INITIALIZER` 토큰에 제공할 수 있습니다.
 * 이 함수는 애플리케이션 부팅 과정에서 실행되며,
 * 필요한 데이터가 시작 시 이용 가능하게 됩니다.
 *
 * 제공된 초기화 함수는 주입 컨텍스트에서 실행된다는 점에 유의하세요.
 *
 * @deprecated v19.0.0부터 사용 중단, 대신 provideAppInitializer 사용
 *
 * @see {@link ApplicationInitStatus}
 * @see {@link provideAppInitializer}
 *
 * @usageNotes
 *
 * 다음 예시는 `APP_INITIALIZER` 토큰을 사용하여 Promise를 반환하는 함수로 다중 제공자를 구성하는 방법을 보여줍니다.
 * ### NgModule 기반 애플리케이션 예시
 * ```ts
 *  function initializeApp(): Promise<any> {
 *    const http = inject(HttpClient);
 *    return firstValueFrom(
 *      http
 *        .get("https://someUrl.com/api/user")
 *        .pipe(tap(user => { ... }))
 *    );
 *  }
 *
 *  @NgModule({
 *   imports: [BrowserModule],
 *   declarations: [AppComponent],
 *   bootstrap: [AppComponent],
 *   providers: [{
 *     provide: APP_INITIALIZER,
 *     useValue: initializeApp,
 *     multi: true,
 *    }]
 *   })
 *  export class AppModule {}
 * ```
 *
 * ### 독립형 애플리케이션 예시
 * ```ts
 * function initializeApp() {
 *   const http = inject(HttpClient);
 *   return firstValueFrom(
 *     http
 *       .get("https://someUrl.com/api/user")
 *       .pipe(tap(user => { ... }))
 *   );
 * }
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     provideHttpClient(),
 *     {
 *       provide: APP_INITIALIZER,
 *       useValue: initializeApp,
 *       multi: true,
 *     },
 *   ],
 * });
 * ```
 *
 * `APP_INITIALIZER` 토큰과 Observable을 반환하는 함수를 사용하여 다중 제공자를 구성하는 것도 가능합니다.
 * 아래 예시를 참조하세요. 이 예제에서 `HttpClient`는
 * 다른 제공자와 함께 팩토리 함수가 어떻게 작동하는지를 보여주기 위한 데모 용도로 사용됩니다.
 *
 * ### NgModule 기반 애플리케이션 예시
 * ```ts
 * function initializeApp() {
 *   const http = inject(HttpClient);
 *   return firstValueFrom(
 *     http
 *       .get("https://someUrl.com/api/user")
 *       .pipe(tap(user => { ... }))
 *   );
 * }
 *
 * @NgModule({
 *   imports: [BrowserModule, HttpClientModule],
 *   declarations: [AppComponent],
 *   bootstrap: [AppComponent],
 *   providers: [{
 *     provide: APP_INITIALIZER,
 *     useValue: initializeApp,
 *     multi: true,
 *   }]
 * })
 * export class AppModule {}
 * ```
 *
 * ### 독립형 애플리케이션 예시
 * ```ts
 * function initializeApp() {
 *   const http = inject(HttpClient);
 *   return firstValueFrom(
 *     http
 *       .get("https://someUrl.com/api/user")
 *       .pipe(tap(user => { ... }))
 *   );
 * }
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     provideHttpClient(),
 *     {
 *       provide: APP_INITIALIZER,
 *       useValue: initializeApp,
 *       multi: true,
 *     },
 *   ],
 * });
 * ```
 *
 * @publicApi
 */
export const APP_INITIALIZER = new InjectionToken<
  ReadonlyArray<() => Observable<unknown> | Promise<unknown> | void>
>(ngDevMode ? '애플리케이션 초기화기' : '');

/**
 * @description
 * 제공된 함수는 애플리케이션 시작 시 주입되어
 * 앱 초기화 과정에서 실행됩니다. 만약 함수가 Promise나 Observable을 반환하면,
 * 초기화는 Promise가 해결되거나 Observable이 완료될 때까지 완료되지 않습니다.
 *
 * 예를 들어 언어 데이터 또는 외부 구성을 로드하는 함수를 생성하고,
 * `provideAppInitializer()`를 사용하여 해당 함수를 제공할 수 있습니다.
 * 이 함수는 애플리케이션 부팅 과정에서 실행되며,
 * 필요한 데이터가 시작 시 이용 가능하게 됩니다.
 *
 * 제공된 초기화 함수는 주입 컨텍스트에서 실행된다는 점에 유의하세요.
 *
 * 이전에는 `APP_INITIALIZER` 토큰을 사용하여 이러한 작업을 수행했습니다.
 * 지금은 이것이 더 이상 사용되지 않습니다.
 *
 * @see {@link APP_INITIALIZER}
 *
 * @usageNotes
 * 다음 예시는 `provideAppInitializer()`를 사용하여 초기화 함수를 구성하는 방법을 보여줍니다.
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideAppInitializer(() => {
 *       const http = inject(HttpClient);
 *       return firstValueFrom(
 *         http
 *           .get("https://someUrl.com/api/user")
 *           .pipe(tap(user => { ... }))
 *       );
 *     }),
 *     provideHttpClient(),
 *   ],
 * });
 * ```
 *
 * @publicApi
 */
export function provideAppInitializer(
  initializerFn: () => Observable<unknown> | Promise<unknown> | void,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      multi: true,
      useValue: initializerFn,
    },
  ]);
}

/**
 * {@link APP_INITIALIZER} 함수의 실행 상태를 반영하는 클래스입니다.
 *
 * @publicApi
 */
@Injectable({providedIn: 'root'})
export class ApplicationInitStatus {
  // non null assertion을 사용하여, 이러한 필드는 아래에 정의됩니다.
  // `new Promise` 콜백 내에서(동기적으로).
  private resolve!: (...args: any[]) => void;
  private reject!: (...args: any[]) => void;

  private initialized = false;
  public readonly done = false;
  public readonly donePromise: Promise<any> = new Promise((res, rej) => {
    this.resolve = res;
    this.reject = rej;
  });

  private readonly appInits = inject(APP_INITIALIZER, {optional: true}) ?? [];
  private readonly injector = inject(Injector);

  constructor() {
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && !Array.isArray(this.appInits)) {
      throw new RuntimeError(
        RuntimeErrorCode.INVALID_MULTI_PROVIDER,
        '`APP_INITIALIZER` 토큰 값의 예상치 못한 유형 ' +
          `(배열이어야 하며, 그러나 ${typeof this.appInits}가 나왔습니다). ` +
          '`APP_INITIALIZER` 토큰이 `multi: true` 제공자로 구성되었는지 확인하세요.',
      );
    }
  }

  /** @internal */
  runInitializers() {
    if (this.initialized) {
      return;
    }

    const asyncInitPromises = [];
    for (const appInits of this.appInits) {
      const initResult = runInInjectionContext(this.injector, appInits);
      if (isPromise(initResult)) {
        asyncInitPromises.push(initResult);
      } else if (isSubscribable(initResult)) {
        const observableAsPromise = new Promise<void>((resolve, reject) => {
          initResult.subscribe({complete: resolve, error: reject});
        });
        asyncInitPromises.push(observableAsPromise);
      }
    }

    const complete = () => {
      // @ts-expect-error readonly를 덮어쓰기
      this.done = true;
      this.resolve();
    };

    Promise.all(asyncInitPromises)
      .then(() => {
        complete();
      })
      .catch((e) => {
        this.reject(e);
      });

    if (asyncInitPromises.length === 0) {
      complete();
    }
    this.initialized = true;
  }
}
