/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Inject, Injectable, InjectionToken} from '../di';
import {NgZone} from '../zone/ng_zone';

/**
 * 테스트 가능성 API.
 * `declare` 키워드는 tsickle이 externs를 생성하게 하므로, 이 메서드는
 * Closure Compiler에 의해 이름이 바뀌지 않습니다.
 * @publicApi
 */
export declare interface PublicTestability {
  isStable(): boolean;
  whenStable(callback: Function, timeout?: number, updateCallback?: Function): void;
  findProviders(using: any, provider: string, exactMatch: boolean): any[];
}

// Angular 내부, 공개 API를 의도하지 않음.
export interface PendingMacrotask {
  source: string;
  creationLocation: Error;
  runCount?: number;
  data?: TaskData;
}

export interface TaskData {
  target?: XMLHttpRequest;
  delay?: number;
  isPeriodic?: boolean;
}

interface WaitCallback {
  // 'any'여야 함 - setTimeout은 ES6에 따라 숫자를 반환하지만,
  // NodeJS에서는 Timer를 반환합니다.
  timeoutId: any;
  doneCb: Function;
  updateCb?: Function;
}

/**
 * Testability 클래스의 인스턴스에 접근할 수 있는 내부 주입 토큰.
 *
 * 이 토큰은 기본 부트스트랩 코드와 `Testability` 클래스 사이의 브릿지 역할을 합니다.
 * `Testability` 클래스를 직접 참고하지 않도록 보장하기 위해 필요하며,
 * 이를 통해 트리 쉐이킹이 가능해집니다(참조되지 않을 경우).
 * `Testability` 클래스가 사용 가능한 환경/설정에서는 이 토큰을 사용하여
 * `Testability` 클래스를 참조하는 프로바이더를 추가합니다. 그렇지 않으면,
 * 이 토큰만 번들에 유지되고, `Testability` 클래스는 유지되지 않습니다.
 */
export const TESTABILITY = new InjectionToken<Testability>('');

/**
 * Testability getter 클래스 인스턴스를 검색하기 위한 내부 주입 토큰.
 */
export const TESTABILITY_GETTER = new InjectionToken<GetTestability>('');

/**
 * Testability 서비스는 브라우저에서 접근할 수 있는 테스트 훅을 제공합니다.
 *
 * NgModule(를 통해 `@NgModule.bootstrap` 필드 사용)으로 부트스트랩된 Angular 애플리케이션은
 * 기본적으로 Testability를 인스턴스화합니다(개발 및 프로덕션 모드 모두).
 *
 * `bootstrapApplication` 함수를 사용하여 부트스트랩된 애플리케이션의 경우,
 * 기본적으로 Testability는 포함되지 않습니다.
 * `provideProtractorTestingSupport()` 함수를 사용하여 필요한 프로바이더 목록을 가져오고,
 * 이를 `options.providers` 배열에 추가하여 애플리케이션에 포함시킬 수 있습니다. 예시:
 *
 * ```ts
 * import {provideProtractorTestingSupport} from '@angular/platform-browser';
 *
 * await bootstrapApplication(RootComponent, providers: [provideProtractorTestingSupport()]);
 * ```
 *
 * @publicApi
 */
@Injectable()
export class Testability implements PublicTestability {
  private _isZoneStable: boolean = true;
  private _callbacks: WaitCallback[] = [];

  private taskTrackingZone: {macroTasks: Task[]} | null = null;

  constructor(
    private _ngZone: NgZone,
    private registry: TestabilityRegistry,
    @Inject(TESTABILITY_GETTER) testabilityGetter: GetTestability,
  ) {
    // 이전에 전역 범위에 Testability 로직이 등록되지 않았다면
    // 현재의 테스트 가능성 getter를 전역으로 등록합니다.
    if (!_testabilityGetter) {
      setTestabilityGetter(testabilityGetter);
      testabilityGetter.addToWindow(registry);
    }
    this._watchAngularEvents();
    _ngZone.run(() => {
      this.taskTrackingZone =
        typeof Zone == 'undefined' ? null : Zone.current.get('TaskTrackingZone');
    });
  }

  private _watchAngularEvents(): void {
    this._ngZone.onUnstable.subscribe({
      next: () => {
        this._isZoneStable = false;
      },
    });

    this._ngZone.runOutsideAngular(() => {
      this._ngZone.onStable.subscribe({
        next: () => {
          NgZone.assertNotInAngularZone();
          queueMicrotask(() => {
            this._isZoneStable = true;
            this._runCallbacksIfReady();
          });
        },
      });
    });
  }

  /**
   * 관련 애플리케이션이 안정적인지 여부
   */
  isStable(): boolean {
    return this._isZoneStable && !this._ngZone.hasPendingMacrotasks;
  }

  private _runCallbacksIfReady(): void {
    if (this.isStable()) {
      // 항상 비동기 처리가 되도록 새로운 프레임에 콜백을 스케줄합니다.
      queueMicrotask(() => {
        while (this._callbacks.length !== 0) {
          let cb = this._callbacks.pop()!;
          clearTimeout(cb.timeoutId);
          cb.doneCb();
        }
      });
    } else {
      // 여전히 안정적이지 않습니다, 업데이트를 보냅니다.
      let pending = this.getPendingTasks();
      this._callbacks = this._callbacks.filter((cb) => {
        if (cb.updateCb && cb.updateCb(pending)) {
          clearTimeout(cb.timeoutId);
          return false;
        }

        return true;
      });
    }
  }

  private getPendingTasks(): PendingMacrotask[] {
    if (!this.taskTrackingZone) {
      return [];
    }

    // 작업 데이터의 복사본을 만들어 작업이 유출되지 않도록 합니다.
    return this.taskTrackingZone.macroTasks.map((t: Task) => {
      return {
        source: t.source,
        // TaskTrackingZone에서:
        // https://github.com/angular/zone.js/blob/master/lib/zone-spec/task-tracking.ts#L40
        creationLocation: (t as any).creationLocation as Error,
        data: t.data,
      };
    });
  }

  private addCallback(cb: Function, timeout?: number, updateCb?: Function) {
    let timeoutId: any = -1;
    if (timeout && timeout > 0) {
      timeoutId = setTimeout(() => {
        this._callbacks = this._callbacks.filter((cb) => cb.timeoutId !== timeoutId);
        cb();
      }, timeout);
    }
    this._callbacks.push(<WaitCallback>{doneCb: cb, timeoutId: timeoutId, updateCb: updateCb});
  }

  /**
   * 애플리케이션이 안정해질 때까지 대기하며 타임아웃을 설정합니다.
   * 타임아웃이 도달하기 전에 안정해지지 않으면, 콜백은 대기 중인 매크로 작업의 목록을 받습니다.
   * 그렇지 않으면 null이 됩니다.
   *
   * @param doneCb Angular가 안정해지거나 타임아웃이 만료될 때 호출되는 콜백
   *    둘 중 먼저 발생하는 이벤트입니다.
   * @param timeout 선택 사항. Angular가 안정해지는 데 대기할 최대 시간입니다.
   *    지정되지 않으면, whenStable()은 영원히 대기합니다.
   * @param updateCb 선택 사항. 지정되는 경우, 이 콜백은 대기 중인 매크로 작업 세트가 변경될 때마다 호출됩니다.
   *    이 콜백이 true를 반환하면 doneCb는 호출되지 않으며, 추가 업데이트는 발행되지 않습니다.
   */
  whenStable(doneCb: Function, timeout?: number, updateCb?: Function): void {
    if (updateCb && !this.taskTrackingZone) {
      throw new Error(
        '업데이트 콜백을 whenStable()에 전달할 때 작업 추적 존이 필요합니다. ' +
          '"zone.js/plugins/task-tracking"이 로드되었습니까?',
      );
    }
    this.addCallback(doneCb, timeout, updateCb);
    this._runCallbacksIfReady();
  }

  /**
   * 테스트 가능성 훅을 가진 애플리케이션을 등록하여 추적할 수 있도록 합니다.
   * @param token 애플리케이션의 토큰, 루트 요소
   *
   * @internal
   */
  registerApplication(token: any) {
    this.registry.registerApplication(token, this);
  }

  /**
   * 애플리케이션을 등록 해제합니다.
   * @param token 애플리케이션의 토큰, 루트 요소
   *
   * @internal
   */
  unregisterApplication(token: any) {
    this.registry.unregisterApplication(token);
  }

  /**
   * 이름으로 프로바이더를 찾습니다.
   * @param using 검색할 루트 요소
   * @param provider 바인딩 변수의 이름
   * @param exactMatch 정확한 일치를 사용할지 여부
   */
  findProviders(using: any, provider: string, exactMatch: boolean): any[] {
    // TODO(juliemr): 구현하기.
    return [];
  }
}

/**
 * 특정 요소에 대한 {@link Testability} 인스턴스의 글로벌 레지스트리.
 * @publicApi
 */
@Injectable({providedIn: 'platform'})
export class TestabilityRegistry {
  /** @internal */
  _applications = new Map<any, Testability>();

  /**
   * 테스트 가능성 훅을 가진 애플리케이션을 등록하여 추적할 수 있도록 합니다.
   * @param token 애플리케이션의 토큰, 루트 요소
   * @param testability 테스트 가능성 훅
   */
  registerApplication(token: any, testability: Testability) {
    this._applications.set(token, testability);
  }

  /**
   * 애플리케이션을 등록 해제합니다.
   * @param token 애플리케이션의 토큰, 루트 요소
   */
  unregisterApplication(token: any) {
    this._applications.delete(token);
  }

  /**
   * 모든 애플리케이션 등록을 해제합니다.
   */
  unregisterAllApplications() {
    this._applications.clear();
  }

  /**
   * 애플리케이션과 연결된 테스트 가능성 훅을 가져옵니다.
   * @param elem 루트 요소
   */
  getTestability(elem: any): Testability | null {
    return this._applications.get(elem) || null;
  }

  /**
   * 모든 등록된 테스트 가능성을 가져옵니다.
   */
  getAllTestabilities(): Testability[] {
    return Array.from(this._applications.values());
  }

  /**
   * 모든 등록된 애플리케이션(루트 요소)을 가져옵니다.
   */
  getAllRootElements(): any[] {
    return Array.from(this._applications.keys());
  }

  /**
   * 트리에서 노드의 테스트 가능성을 찾습니다.
   * @param elem 노드
   * @param findInAncestors 현재 노드에서 테스트 가능성이 발견되지 않은 경우
   *    조상에서 찾을지 여부
   */
  findTestabilityInTree(elem: Node, findInAncestors: boolean = true): Testability | null {
    return _testabilityGetter?.findTestabilityInTree(this, elem, findInAncestors) ?? null;
  }
}

/**
 * 특정 컨텍스트와 연결된 `Testability` 서비스를 검색하기 위한 어댑터 인터페이스.
 *
 * @publicApi
 */
export interface GetTestability {
  addToWindow(registry: TestabilityRegistry): void;
  findTestabilityInTree(
    registry: TestabilityRegistry,
    elem: any,
    findInAncestors: boolean,
  ): Testability | null;
}

/**
 * Angular 테스트 프레임워크에서 사용하는 {@link GetTestability} 구현을 설정합니다.
 * @publicApi
 */
export function setTestabilityGetter(getter: GetTestability): void {
  _testabilityGetter = getter;
}

let _testabilityGetter: GetTestability | undefined;
