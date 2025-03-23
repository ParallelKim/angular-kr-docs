/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type {Provider} from '../di/interface/provider';
import type {LContainer} from '../render3/interfaces/container';
import type {DependencyType} from '../render3/interfaces/definition';
import type {TNode} from '../render3/interfaces/node';
import type {LView} from '../render3/interfaces/view';

/**
 * 디퍼 블록을 식별하고 디퍼 블록을 트리거하는 데 사용되는 기본 데이터 구조 세트
 */
export interface DehydratedDeferBlock {
  lView: LView;
  tNode: TNode;
  lContainer: LContainer;
}

/**
 * 컴파일러에 의해 생성된 함수를 설명하며, 디퍼 로드할 수 있는 의존성을 다운로드합니다.
 */
export type DependencyResolverFn = () => Array<Promise<DependencyType>>;

/**
 * 디퍼 블록 트리거의 유형을 정의합니다.
 */
export const enum TriggerType {
  /**
   * 정규 트리거를 나타냅니다 (예: `@defer (on idle) { ... }`).
   */
  Regular,

  /**
   * 사전 로드 트리거를 나타냅니다 (예: `@defer (prefetch on idle) { ... }`).
   */
  Prefetch,

  /**
   * 하이드레이트 트리거를 나타냅니다 (예: `@defer (hydrate on idle) { ... }`).
   */
  Hydrate,
}

/**
 * 디퍼 블록 의존성 로드 상태를 설명합니다.
 */
export enum DeferDependenciesLoadingState {
  /** 초기 상태, 의존성 로드가 아직 트리거되지 않음 */
  NOT_STARTED,

  /** 의존성 로드 진행 중 */
  IN_PROGRESS,

  /** 의존성 로드가 성공적으로 완료됨 */
  COMPLETE,

  /** 의존성 로드 실패 */
  FAILED,
}

/** `minimum` 매개변수 값이 저장되는 슬롯 인덱스. */
export const MINIMUM_SLOT = 0;

/** `after` 매개변수 값이 저장되는 슬롯 인덱스. */
export const LOADING_AFTER_SLOT = 1;

/** 구성 개체가 컴포넌트 상수에 저장되는 로딩 블록입니다. */
export type DeferredLoadingBlockConfig = [minimumTime: number | null, afterTime: number | null];

/** 구성 개체가 컴포넌트 상수에 저장되는 자리 표시자 블록입니다. */
export type DeferredPlaceholderBlockConfig = [minimumTime: number | null];

/**
 * 디퍼 블록의 모든 인스턴스에서 공유되는 데이터를 설명합니다.
 */
export interface TDeferBlockDetails {
  /**
   * 기본 콘텐츠를 위한 템플릿을 찾을 수 있는 LView 및 TData 배열의 인덱스
   */
  primaryTmplIndex: number;

  /**
   * 로딩 블록의 템플릿을 찾을 수 있는 LView 및 TData 배열의 인덱스
   */
  loadingTmplIndex: number | null;

  /**
   * 로딩 블록을 위한 추가 구성 매개변수 (예: `after` 및 `minimum`).
   */
  loadingBlockConfig: DeferredLoadingBlockConfig | null;

  /**
   * 자리 표시자 블록의 템플릿을 찾을 수 있는 LView 및 TData 배열의 인덱스
   */
  placeholderTmplIndex: number | null;

  /**
   * 자리 표시자 블록을 위한 추가 구성 매개변수 (예: `after` 및 `minimum`).
   */
  placeholderBlockConfig: DeferredPlaceholderBlockConfig | null;

  /**
   * 오류 블록의 템플릿을 찾을 수 있는 LView 및 TData 배열의 인덱스
   */
  errorTmplIndex: number | null;

  /**
   * 디퍼 블록의 모든 의존성을 로드하는 컴파일러 생성 함수.
   */
  dependencyResolverFn: DependencyResolverFn | null;

  /**
   * 디퍼 블록 의존성의 현재 로딩 상태를 추적합니다.
   */
  loadingState: DeferDependenciesLoadingState;

  /**
   * 의존성 로드 Promise. 이 Promise는 디퍼 블록의 여러 인스턴스가
   * 같은 수의 의존성을 기다릴 때 유용합니다 (예: *ngFor 내부에 사용된 경우).
   */
  loadingPromise: Promise<unknown> | null;

  /**
   * 이 디퍼 블록 내에서 사용된 독립형 컴포넌트에 의해 임포트된
   * 모든 NgModule에서 수집된 공급자 목록입니다.
   */
  providers: Provider[] | null;

  /**
   * 주어진 블록에 대한 하이드레이트 트리거의 목록
   */
  hydrateTriggers: Map<DeferBlockTrigger, HydrateTriggerDetails | null> | null;

  /**
   * 특정 디퍼 블록의 모든 인스턴스에 사용해야 하는 디퍼 블록 플래그입니다
   * (런타임에 `TDeferDetails`에 배치되어야 할 플래그).
   */
  flags: TDeferDetailsFlags;

  /**
   * 디퍼 블록에 대한 디버깅 정보를 추적합니다.
   */
  debug: {
    /** 블록의 트리거에 대한 텍스트 표현. */
    triggers?: Set<string>;
  } | null;
}

/**
 * 특정 디퍼 블록의 모든 인스턴스에 사용해야 하는 디퍼 블록 플래그를 지정합니다.
 * (런타임에 `TDeferDetails`에 배치되어야 할 플래그).
 */
export const enum TDeferDetailsFlags {
  Default = 0,

  /**
   * 디퍼 블록에 하이드레이트 트리거가 있는지 여부.
   */
  HasHydrateTriggers = 1 << 0,
}

/**
 * 이 디퍼 블록 인스턴스의 현재 상태를 설명합니다.
 *
 * @publicApi
 */
export enum DeferBlockState {
  /** 자리 표시자 블록 콘텐츠가 렌더링됨 */
  Placeholder = 0,

  /** 로딩 블록 콘텐츠가 렌더링됨 */
  Loading = 1,

  /** 기본 콘텐츠 블록 콘텐츠가 렌더링됨 */
  Complete = 2,

  /** 오류 블록 콘텐츠가 렌더링됨 */
  Error = 3,
}

/**
 * 디퍼 트리거 유형을 나타냅니다.
 */
export const enum DeferBlockTrigger {
  Idle,
  Immediate,
  Viewport,
  Interaction,
  Hover,
  Timer,
  When,
  Never,
}

/** * `타이머()` 트리거에서 지정된 지연(밀리초)을 설명합니다. */
export interface HydrateTimerTriggerDetails {
  delay: number;
}

/** * 템플릿에서 지정된 모든 가능한 하이드레이션 트리거 세부정보를 설명합니다. */
export type HydrateTriggerDetails = HydrateTimerTriggerDetails;

/**
 * 이 디퍼 블록 인스턴스의 초기 상태를 설명합니다.
 *
 * 주의: 이 상태는 내부 전용이며, `DeferBlockState` 열거형의
 * 어떤 값보다 낮은 숫자로 표현되어야 합니다.
 */
export enum DeferBlockInternalState {
  /** 초기 상태. 아직 렌더링된 것이 없습니다. */
  Initial = -1,
}

export const NEXT_DEFER_BLOCK_STATE = 0;
// 주의: 이 슬롯에 상태를 유지하는 것이 *중요*합니다. 왜냐하면 이 슬롯은
// 런타임 로직에 의해 LView, LContainer 및 기타 유형을 구분하는 데 사용되기 때문입니다.
// (참조: `isLView` 및 `isLContainer` 함수). 디퍼 블록의 경우,
// 이 슬롯은 항상 숫자가 됩니다.
export const DEFER_BLOCK_STATE = 1;
export const STATE_IS_FROZEN_UNTIL = 2;
export const LOADING_AFTER_CLEANUP_FN = 3;
export const TRIGGER_CLEANUP_FNS = 4;
export const PREFETCH_TRIGGER_CLEANUP_FNS = 5;
export const SSR_UNIQUE_ID = 6;
export const SSR_BLOCK_STATE = 7;
export const ON_COMPLETE_FNS = 8;
export const HYDRATE_TRIGGER_CLEANUP_FNS = 9;

/**
 * 인스턴스 특정 디퍼 블록 데이터를 설명합니다.
 *
 * 주의: 현재 `state` 슬롯만 있으며, 나중에 `after` 및 `maximum` 기능을
 * 추적하기 위해 더 많은 슬롯이 추가될 것입니다 (각 인스턴스 상태가 필요합니다).
 */
export interface LDeferBlockDetails extends Array<unknown> {
  /**
   * 현재 렌더링된 블록 상태.
   */
  [DEFER_BLOCK_STATE]: DeferBlockState | DeferBlockInternalState;

  /**
   * 다른 상태가 렌더링될 때 요청된 블록 상태.
   */
  [NEXT_DEFER_BLOCK_STATE]: DeferBlockState | null;

  /**
   * 현재 상태가 최소 매개변수를 가질 경우 다음 상태로 전환할 수 있는
   * 타임스탬프를 나타냅니다.
   */
  [STATE_IS_FROZEN_UNTIL]: number | null;

  /**
   * Angular가 로딩 상태 렌더링 전 대기할 때 타임아웃을 취소하는
   * 정리 함수에 대한 참조를 포함합니다. 이는 로딩 블록이
   * `after` 매개변수가 구성된 경우에 사용됩니다.
   */
  [LOADING_AFTER_CLEANUP_FN]: VoidFunction | null;

  /**
   * 정규 트리거에 대한 정리 함수 목록.
   */
  [TRIGGER_CLEANUP_FNS]: VoidFunction[] | null;

  /**
   * 사전 로드 트리거에 대한 정리 함수 목록.
   */
  [PREFETCH_TRIGGER_CLEANUP_FNS]: VoidFunction[] | null;

  /**
   * SSR 동안 할당된 이 디퍼 블록의 고유 ID.
   */
  [SSR_UNIQUE_ID]: string | null;

  /**
   * SSR 후 디퍼 블록 상태.
   */
  [SSR_BLOCK_STATE]: number | null;

  /**
   * 주요 콘텐츠가 렌더링되면 호출될 콜백 집합.
   */
  [ON_COMPLETE_FNS]: VoidFunction[] | null;

  /**
   * 하이드레이트 트리거에 대한 정리 함수 목록.
   */
  [HYDRATE_TRIGGER_CLEANUP_FNS]: VoidFunction[] | null;
}

/**
 * 디퍼 블록 동작 구성을 위한 내부 구조입니다.
 * */
export interface DeferBlockConfig {
  behavior: DeferBlockBehavior;
}

/**
 * 디퍼 블록 동작 구성 옵션.
 * @publicApi
 */
export enum DeferBlockBehavior {
  /**
   * 디퍼 블록의 수동 트리거 모드. 디퍼 블록이 렌더링되는 시점과
   * 어떤 상태로 렌더링되는지를 제어합니다.
   */
  Manual,

  /**
   * 디퍼 블록의 플레이 스루 모드. 이 모드는 디퍼 블록이
   * 브라우저에서 작동하는 방식과 같습니다.
   * 이는 테스트 환경에서 기본 동작입니다.
   */
  Playthrough,
}

/**
 * **내부**, 애플리케이션 코드에서 참조를 피하십시오.
 *
 * 현재 의존성 로드 함수를 검색하기 위한 호출을 가로채고
 * 다른 구현으로 교체할 수 있는 헬퍼 클래스를 설명합니다.
 * 이 인터셉터 클래스는 다양한 상태의 블록을 테스트할 수 있도록
 * 로딩 응답을 시뮬레이션하는 데 필요합니다.
 */
export interface DeferBlockDependencyInterceptor {
  /**
   * 의존성 로드 함수에 접근할 때 각 디퍼 블록에 대해 호출됩니다.
   */
  intercept(dependencyFn: DependencyResolverFn | null): DependencyResolverFn | null;

  /**
   * 인터셉터 함수를 구성할 수 있습니다.
   */
  setInterceptor(interceptorFn: (current: DependencyResolverFn) => DependencyResolverFn): void;
}
