/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * 이 소스 코드의 사용은 MIT 스타일 라이센스에 의해 관리되며
 * https://angular.dev/license 의 LICENSE 파일에서 찾을 수 있습니다.
 */

import type {ChangeDetectionScheduler} from '../../change_detection/scheduling/zoneless_scheduling';
import {TDeferBlockDetails} from '../../defer/interfaces';
import type {Injector} from '../../di/injector';
import {ProviderToken} from '../../di/provider_token';
import {DehydratedView} from '../../hydration/interfaces';
import {SchemaMetadata} from '../../metadata/schema';
import {Sanitizer} from '../../sanitization/sanitizer';
import type {AfterRenderSequence} from '../after_render/manager';
import type {ReactiveLViewConsumer} from '../reactive_lview_consumer';
import type {ViewEffectNode} from '../reactivity/effect';

import type {LContainer} from './container';
import {
  ComponentDef,
  ComponentTemplate,
  DirectiveDef,
  DirectiveDefList,
  HostBindingsFunction,
  PipeDef,
  PipeDefList,
  ViewQueriesFunction,
} from './definition';
import {I18nUpdateOpCodes, TI18n, TIcu} from './i18n';
import {TConstants, TNode} from './node';
import type {LQueries, TQueries} from './query';
import {Renderer, RendererFactory} from './renderer';
import {RElement} from './renderer_dom';
import {TStylingKey, TStylingRange} from './styling';

// 아래는 LView 인덱스의 상수로 LView 멤버를 찾는 데 도움이 됩니다
// 특정 인덱스를 기억할 필요 없이.
// Uglify는 압축 시 이러한 내용을 인라인으로 처리하므로 비용이 발생하지 않아야 합니다.
export const HOST = 0;
export const TVIEW = 1;

// LContainer와 공유
export const FLAGS = 2;
export const PARENT = 3;
export const NEXT = 4;
export const T_HOST = 5;
// LContainer와 공유 종료

export const HYDRATION = 6;
export const CLEANUP = 7;
export const CONTEXT = 8;
export const INJECTOR = 9;
export const ENVIRONMENT = 10;
export const RENDERER = 11;
export const CHILD_HEAD = 12;
export const CHILD_TAIL = 13;
// FIXME(misko): 세 가지 선언이 모두 같은 것이 아닌지 조사해야 함.
export const DECLARATION_VIEW = 14;
export const DECLARATION_COMPONENT_VIEW = 15;
export const DECLARATION_LCONTAINER = 16;
export const PREORDER_HOOK_FLAGS = 17;
export const QUERIES = 18;
export const ID = 19;
export const EMBEDDED_VIEW_INJECTOR = 20;
export const ON_DESTROY_HOOKS = 21;
export const EFFECTS_TO_SCHEDULE = 22;
export const EFFECTS = 23;
export const REACTIVE_TEMPLATE_CONSUMER = 24;
export const AFTER_RENDER_SEQUENCES_TO_ADD = 25;

/**
 * LView의 헤더 크기입니다. 슬롯을 설정할 때 이를 조정해야 합니다.
 *
 * 중요: `HEADER_OFFSET`은 `LView` 인덱스로 변환하기 위해 `ɵɵ*` 지침에서만 참조해야 합니다.
 * 모든 다른 인덱스는 `LView` 인덱스 공간에 있어야 하며 `HEADER_OFFSET`을 다른 곳에서 참조할 필요가 없어야 합니다.
 */
export const HEADER_OFFSET = 26;

// 이 인터페이스는 실질적인 LView 인터페이스를 대체합니다. 이는 공용 지침의 인수 또는 반환 값일 경우입니다.
// 이는 실제 인터페이스를 노출할 필요가 없도록 보장합니다. 이는 비공식 유지로 유지되어야 합니다.
export interface OpaqueViewState {
  '__brand__': 'OpaqueViewState와 일치하지 않는 브랜드';
}

/**
 * `LView`는 지침이 템플릿에서 호출될 때 처리하는 데 필요한 모든 정보를 저장합니다.
 * 각 내장 뷰 및 컴포넌트 뷰는 자체 `LView`를 가집니다. 특정 뷰를 처리할 때,
 * 우리는 `viewData`를 해당 `LView`로 설정합니다. 해당 뷰의 처리가 끝나면, 원래의 `viewData`
 * (부모 `LView`)로 되돌립니다.
 *
 * 각 뷰에 대한 개별 상태를 유지하면, 존재하는 뷰를 기반으로 데이터 배열을 수정할 필요가 없습니다.
 */
export interface LView<T = unknown> extends Array<any> {
  /**
   * 이 `LView`가 삽입된 노드입니다.
   */
  [HOST]: RElement | null;

  /**
   * 이 뷰의 정적 데이터입니다. DI에서 노드 트리를 쉽게 오르기 위해
   * TView.data 배열에 대한 참조가 필요합니다 (지시자 정의가 저장됩니다).
   */
  readonly [TVIEW]: TView;

  /** 이 뷰에 대한 플래그입니다. 자세한 내용은 LViewFlags를 참조하세요. */
  [FLAGS]: LViewFlags;

  /**
   * 여기에는 {@link LView} 또는 {@link LContainer}가 저장될 수 있습니다.
   *
   * `LView` - 부모 뷰. 우리는 뷰를 종료할 때 이전 LView로 복원해야 하므로 필요합니다.
   * 이 없이는 렌더 메서드가 템플릿을 재귀적으로 렌더링할 때 뷰 스택을 유지해야 합니다.
   *
   * `LContainer` - 현재 뷰는 컨테이너의 일부이며 내장 뷰입니다.
   */
  [PARENT]: LView | LContainer | null;

  /**
   *
   * 다음 형제 LView 또는 LContainer입니다.
   *
   * 이는 동일한 컨테이너에 있지 않은 형제 뷰 상태 간의 전파를 허용합니다. 내장 뷰는 이미 node.next를 가지지만,
   * 이는 동일한 컨테이너의 뷰에 대해서만 설정됩니다. 컴포넌트 뷰와 컨테이너 간의 뷰를 연결할 방법이 필요합니다.
   */
  [NEXT]: LView | LContainer | null;

  /** 이 뷰에 활성 쿼리 - 노드에서 그 쿼리에 보고됩니다. */
  [QUERIES]: LQueries | null;

  /**
   * 현재 `LView`가 삽입된 위치의 `TNode`를 저장합니다.
   *
   * 주어진:
   * ```html
   * <div>
   *   <ng-template><span></span></ng-template>
   * </div>
   * ```
   *
   * 우리는 두 개의 `TView`를 얻게 됩니다.
   * - `parent` `TView`는 `<div><!-- anchor --></div>`를 포함합니다.
   * - `child` `TView`는 `<span></span>`을 포함합니다.
   *
   * 일반적으로 `child`는 `parent`의 선언 위치에 삽입되지만 어디에나 삽입될 수 있습니다. 선언 정보를 `TView`에 저장할 수 없으므로
   * 대신 `LView[T_HOST]`에 저장해야 합니다.
   *
   * 삽입 부모가 어디인지 결정하려면 다음을 실행해야 합니다:
   * ```ts
   * const parentLView = lView[PARENT];
   * const parentTNode = lView[T_HOST];
   * const insertionParent = parentLView[parentTNode.index];
   * ```
   *
   *
   * `null`인 경우, 이는 애플리케이션의 루트 뷰입니다 (루트 컴포넌트가 이 뷰에 있음) 및 부모가 없습니다.
   */
  [T_HOST]: TNode | null;

  /**
   * 뷰가 파괴될 때, 리스너를 해제하고 출력을 구독 취소해야 합니다. 이 컨텍스트 배열은
   * 특정 뷰에 대한 자신의 컨텍스트와 출력 구독 인스턴스로 감싸진 리스너 기능 모두를 저장합니다.
   *
   * 이는 각 LView 인스턴스마다 변경되므로 TView에 저장할 수 없습니다. 대신 TView.cleanup은
   * 이 배열의 필수 컨텍스트에 대한 인덱스를 저장합니다.
   *
   * `LView`가 생성된 후 추가 인스턴스 전용 함수를 `lView[CLEANUP]`의 끝에 연결할 수 있습니다.
   * 더 이상 `T` 레벨 정리 기능이 여기에 추가되지 않을 것이라는 것을 알고 있기 때문입니다.
   */
  [CLEANUP]: any[] | null;

  /**
   * - 동적 뷰의 경우, 템플릿을 렌더링하는 데 사용할 컨텍스트 (예: `NgForContext`)입니다.
   *   또는 명시적으로 정의되지 않은 경우 `{}`입니다.
   * - 루트 컴포넌트의 루트 뷰의 경우, 컴포넌트 인스턴스 자체에 대한 참조입니다.
   * - 컴포넌트의 경우 해당 컴포넌트 인스턴스에 대한 참조입니다.
   * - 인라인 뷰의 경우 컨텍스트는 null입니다.
   */
  [CONTEXT]: T;

  /** 엘리먼트 인젝터를 참조한 후에 사용될 모듈 인젝터입니다. */
  readonly [INJECTOR]: Injector;

  /**
   * 같은 애플리케이션의 여러 LView 인스턴스에서 공유되는 컨텍스트 데이터입니다.
   */
  [ENVIRONMENT]: LViewEnvironment;

  /** 이 뷰에 사용할 렌더러입니다. */
  [RENDERER]: Renderer;

  /**
   * 이 LView의 계층 구조에 있는 첫 번째 LView 또는 LContainer에 대한 참조입니다.
   *
   * 이는 뷰가 중첩된 뷰를 통해 이동하여 리스너를 제거하고 onDestroy 콜백을 호출할 수 있도록
   * 저장해야 합니다.
   */
  [CHILD_HEAD]: LView | LContainer | null;

  /**
   * 이 LView 하위의 마지막 LView 또는 LContainer입니다.
   *
   * 테일은 뷰 목록의 끝에 새 상태를 빠르게 추가할 수 있도록 합니다
   * 첫 번째 자식에서 시작하여 전파할 필요 없이.
   */
  [CHILD_TAIL]: LView | LContainer | null;

  /**
   * 이 뷰의 템플릿이 선언된 뷰입니다.
   *
   * 동적으로 생성된 뷰의 템플릿은 삽입된 뷰와는 다른 뷰에서 선언될 수 있습니다. 우리는 이미 "삽입 뷰" (템플릿이
   * 삽입된 뷰)를 LView[PARENT]에서 추적하지만, "선언 뷰" (템플릿이 선언된 뷰)에 접근할 수 있어야 합니다.
   * 그렇지 않으면 적절한 컨텍스트로 뷰의 템플릿 기능을 호출할 수 없습니다. 컨텍스트는 삽입 뷰 트리가 아니라
   * 선언 뷰 트리에서 상속되어야 합니다.
   *
   * 예 (AppComponent 템플릿):
   *
   * <ng-template #foo></ng-template>       <-- 여기에서 선언됨 -->
   * <some-comp [tpl]="foo"></some-comp>    <-- 이 컴포넌트 내에서 삽입됨 -->
   *
   * 위의 <ng-template>는 AppComponent 템플릿에서 선언되었지만, SomeComp로 전달되어 그곳에 삽입됩니다. 이 경우,
   * 선언 뷰는 AppComponent가 되고, 삽입 뷰는 SomeComp가 됩니다. 뷰를 제거할 때, 우리는 삽입 뷰를 통해
   * 이동하여 리스너를 정리하고, 변경 감지 중에 적절한 통제를 얻기 위해 선언 뷰를 호출해야 합니다.
   */
  [DECLARATION_VIEW]: LView | null;

  /**
   * 이식된 `LView`s를 추적하는 데 사용되는 선언 컴포넌트 뷰를 가리킵니다.
   *
   * 보십시오: `DECLARATION_VIEW`는 선언된 실제 `LView`를 가리키고, `DECLARATION_COMPONENT_VIEW`는
   * 같은 것이 아닐 수 있는 컴포넌트를 가리킵니다.
   *
   * 예:
   * ```html
   * <#VIEW #myComp>
   *  <div *ngIf="true">
   *   <ng-template #myTmpl>...</ng-template>
   *  </div>
   * </#VIEW>
   * ```
   * 위의 경우 `myTmpl`의 `DECLARATION_VIEW`는 `ngIf`의 `LView`를 가리키고,
   * `DECLARATION_COMPONENT_VIEW`는 템플릿을 소유한 `myComp`의 `LView`를 가리킵니다.
   *
   * 그 이유는 모든 내장 뷰는 항상 체크하듯이, 컴포넌트 뷰는 체크 항상 또는 on-push일 수 있습니다.
   * 이식된 뷰가 있을 때, 이식된 뷰가 체크 항상 선언에서 on-push 삽입 지점으로 이식된 경우를
   * 결정하는 것이 중요합니다. 이러한 경우 이식된 뷰는 선언된 `LView`의 `LContainer`에 추가되어야 하며,
   * 삽입 지점에서의 CD에 추가되어야 합니다.
   *
   * 쿼리는 이미 `LView[DECLARATION_LCONTAINER]`와 `LContainer[MOVED_VIEWS]`에서 이동된 뷰를 추적합니다.
   * 그러나 쿼리는 같은 컴포넌트의 `LView` 내에서 이동된 `LView`s도 추적합니다. 이식된 뷰는 이동된 뷰의 하위 집합이며,
   * `DECLARATION_COMPONENT_VIEW`로 이를 구별합니다. 이 사용 사례와 더욱 같은.
   *
   * 컴포넌트 간 `LView` 이동(이식된 뷰) 예시를 보여줍니다.
   * ```html
   * <#VIEW #myComp>
   *   <ng-template #myTmpl>...</ng-template>
   *   <insertion-component [template]="myTmpl"></insertion-component>
   * </#VIEW>
   * ```
   * 위의 예에서 `myTmpl`은 다른 컴포넌트로 전달됩니다. 만약 `insertion-component`가 `myTmpl`를 인스턴스화하고
   * `insertion-component`가 on-push이면 `LContainer`는 이식된 뷰를 포함하고 있다고 표시되어야 하며,
   * 이 뷰는 선언된 CD의 일환으로 CD되어야 합니다.
   *
   * 변경 감지가 실행될 때, `[MOVED_VIEWS]`를 반복하며 현재 컴포넌트의 `DECLARATION_COMPONENT_VIEW` 및
   * 자식 `LView` 불일치하는 경우 CD를 진행합니다(이는 컴포넌트 간 이식되었습니다).
   *
   * 참고: `[DECLARATION_COMPONENT_VIEW]`는 LView가 컴포넌트 뷰일 경우 자신을 가리킵니다
   *       (가장 간단하고 가장 일반적인 경우).
   *
   * 참고 사항:
   *   - https://hackmd.io/@mhevery/rJUJsvv9H  문제에 대한 설명
   *   - `LContainer[HAS_TRANSPLANTED_VIEWS]` 이식된 뷰가 있는 `LContainer` 표시
   *   - `LContainer[TRANSPLANT_HEAD]` 및 `LContainer[TRANSPLANT_TAIL]` 이식된 저장소
   *   - `LView[DECLARATION_LCONTAINER]` 쿼리와 유사한 문제
   *   - `LContainer[MOVED_VIEWS]` 쿼리와 유사한 문제
   */
  [DECLARATION_COMPONENT_VIEW]: LView;

  /**
   * 내장 뷰의 선언 지점 (Content가 있는 <ng-template>의 내용을 기반으로 인스턴스화됨)이며,
   * 다른 유형의 뷰는 null입니다.
   *
   * 우리는 주어진 선언 지점에서 생성된 모든 내장 뷰를 추적하여 쿼리 매치를 적절한 순서로 준비할 수 있어야 합니다
   * (쿼리 매치는 선언 지점에 따라 순서가 정해지며 삽입 지점은 아님).
   */
  [DECLARATION_LCONTAINER]: LContainer | null;

  /**
   * 이 뷰에 대한 더 많은 플래그입니다. 자세한 내용은 PreOrderHookFlags를 참조하세요.
   */
  [PREORDER_HOOK_FLAGS]: PreOrderHookFlags;

  /** 뷰의 고유 ID입니다. `LView` 레지스트리에서 `__ngContext__` 조회에 사용됩니다. */
  [ID]: number;

  /**
   * 이 LView와 관련된 수화 주석 정보에 대한 컨테이너입니다.
   */
  [HYDRATION]: DehydratedView | null;

  /**
   * 내장 뷰에 할당된 선택적 인젝터로, 엘리먼트 및 모듈 인젝터보다 우선합니다.
   */
  readonly [EMBEDDED_VIEW_INJECTOR]: Injector | null;

  /**
   * 이 뷰의 업데이트 패스 동안 실행할 필요가 있는 효과 일정 작업입니다.
   */
  [EFFECTS_TO_SCHEDULE]: Array<() => void> | null;

  [EFFECTS]: Set<ViewEffectNode> | null;

  /**
   * 주어진 LView가 파괴될 때 실행되는 콜백 함수 모음입니다. 이는
   * 사용자 정의된 LView 전용 파괴 콜백으로, 해당 TView 항목이 없습니다.
   */
  [ON_DESTROY_HOOKS]: Array<() => void> | null;

  /**
   * 이 `LView`의 템플릿을 위한 소비자, 신호 읽기를 추적할 수 있도록 합니다.
   *
   * 이는 처음에 `null`이며, 템플릿 실행 후 신호를 읽을 경우 소비자에게 할당됩니다.
   */
  [REACTIVE_TEMPLATE_CONSUMER]: ReactiveLViewConsumer | null;

  // 예약해야 하는 AfterRenderSequences
  [AFTER_RENDER_SEQUENCES_TO_ADD]: AfterRenderSequence[] | null;
}

/**
 * 같은 애플리케이션 내의 여러 LView 인스턴스 간에 공유되는 컨텍스트 데이터입니다.
 */
export interface LViewEnvironment {
  /** 렌더러 생성을 위한 팩토리입니다. */
  rendererFactory: RendererFactory;

  /** 선택적 사용자 정의 세정기입니다. */
  sanitizer: Sanitizer | null;

  /** 애플리케이션 상태 변화 알림을 위한 변경 감지 스케줄러입니다. */
  changeDetectionScheduler: ChangeDetectionScheduler | null;
}

/** LView에 관련된 플래그 (LView[FLAGS]에 저장됨) */
export const enum LViewFlags {
  /** 첫 2 비트에 초기화 단계의 상태 */
  InitPhaseStateIncrementer = 0b00000000001,
  InitPhaseStateMask = 0b00000000011,

  /**
   * 뷰가 creationMode에 있는지 여부.
   *
   * 이는 내장 뷰를 제대로 지원할 수 있도록 뷰에 저장해야 하고, `data`를 마커로 사용해서는 안 됩니다.
   * 그렇지 않으면 자식 뷰에서 부모 뷰로 다시 돌아갈 때 `data`가 정의되고 생성 모드가
   * 잘못된 결과로 보고되게 됩니다.
   */
  CreationMode = 1 << 2,

  /**
   * 이 LView 인스턴스가 첫 번째 처리 패스를 거치고 있는지 여부.
   *
   * LView 인스턴스는 한 번의 생성 모드 실행과 한 번의 업데이트 모드 실행을 완료할 때까지
   * "첫 번째 패스"로 간주됩니다. 이 시점에서 플래그가 꺼집니다.
   */
  FirstLViewPass = 1 << 3,

  /** 이 뷰가 기본 변경 감지 전략(항상 체크)인지 또는 onPush인지 여부. */
  CheckAlways = 1 << 4,

  /** 이 LView에 i18n 블록이 있는지 여부. */
  HasI18n = 1 << 5,

  /** 이 뷰가 현재 더러운 상태인지 여부(체크 필요). */
  Dirty = 1 << 6,

  /** 이 뷰가 현재 변경 감지 트리에 첨부되어 있는지 여부. */
  Attached = 1 << 7,

  /** 이 뷰가 파괴되었는지 여부. */
  Destroyed = 1 << 8,

  /** 이 뷰가 루트 뷰인지 여부. */
  IsRoot = 1 << 9,

  /**
   * 이 이동된 LView가 새로 고쳐야 하는지 여부. 더러운 플래그와 유사하지만 이식된 뷰와
   * 신호 뷰에서 부모/조상 뷰가 더럽지 않은 경우에 사용됩니다.
   * "이 뷰만 새로 고치기"로 사용됩니다. HAS_CHILD_VIEWS_TO_REFRESH 플래그와 함께 사용됩니다.
   */
  RefreshView = 1 << 10,

  /** 이 뷰 또는 그 조상 중 하나가 내장 뷰 인젝터가 있음을 나타냅니다. */
  HasEmbeddedViewInjector = 1 << 11,

  /** 이 뷰가 `signals: true`로 생성되었음을 나타냅니다. */
  SignalView = 1 << 12,

  /**
   * 이 LView 아래에 있는 뷰가 변경 감지 중에 새로 고쳐야 함을 나타냅니다. 이 플래그는
   * 이 뷰가 더럽지 않은 경우에도, 우리에게는 여전히 자식 뷰를 통해 이동하도록 해야 함을
   * 나타냅니다.
   */
  HasChildViewsToRefresh = 1 << 13,

  /**
   * 비트의 수를 나타냅니다.
   *
   * 1이 위로 이동한 수 (10진수 기준)
   */
  IndexWithinInitPhaseShift = 14,

  /**
   * 마지막 21비트에서 현재 초기화 단계의 인덱스
   */
  IndexWithinInitPhaseIncrementer = 1 << IndexWithinInitPhaseShift,

  // 1을 빼면 초기 이동의 오른쪽에 모든 1이 됩니다.
  // 따라서 `(1 << 3) - 1`은 3개의 1을 제공합니다: 1 << 3 = 0b01000, 1을 빼면 0b00111.
  IndexWithinInitPhaseReset = (1 << IndexWithinInitPhaseShift) - 1,
}

/**
 * 초기화 단계의 가능한 상태:
 * - 00: OnInit 훅이 실행됩니다.
 * - 01: AfterContentInit 훅이 실행됩니다.
 * - 10: AfterViewInit 훅이 실행됩니다.
 * - 11: 모든 초기화 훅이 실행되었습니다.
 */
export const enum InitPhaseState {
  OnInitHooksToBeRun = 0b00,
  AfterContentInitHooksToBeRun = 0b01,
  AfterViewInitHooksToBeRun = 0b10,
  InitPhaseCompleted = 0b11,
}

/** LView에 관련된 더 많은 플래그 (LView[PREORDER_HOOK_FLAGS]에 저장됨) */
export const enum PreOrderHookFlags {
  /**
   * 훅 배열에서 호출될 다음 사전 주문 훅의 인덱스,
   * 첫 16비트에서
   */
  IndexOfTheNextPreOrderHookMaskMask = 0b01111111111111111,

  /**
   * 이미 호출된 초기화 훅의 수, 마지막 16비트에서
   */
  NumberOfInitHooksCalledIncrementer = 0b010000000000000000,
  NumberOfInitHooksCalledShift = 16,
  NumberOfInitHooksCalledMask = 0b11111111111111110000000000000000,
}

/**
 * `HostBindingsFunction`와 관련된 현재 뷰에 대한 OpCodes 세트를 저장합니다.
 *
 * `HostBindingsFunction`을 호출하기 위해서는 다음이 필요합니다.
 * 1. 'elementIdx`: `HostBindingsFunction`과 관련된 요소의 인덱스입니다.
 * 2. 'directiveIdx`: `HostBindingsFunction`과 관련된 지시자의 인덱스입니다. (이는
 *    `HostBindingsFunction` 호출의 컨텍스트가 됩니다.)
 * 3. `bindingRootIdx`: `HostBindingsFunction`의 바인딩이 시작되는 위치입니다. 내부적으로
 *    `HostBindingsFunction` 바인딩 인덱스는 `0`에서 시작하므로 `bindingRootIdx`를 추가해야 합니다.
 * 4. `HostBindingsFunction`: 실행할 호스트 바인딩 함수입니다.
 *
 * 위 정보를 `HostBindingOpCodes`에 효율적으로 인코딩해야 합니다.
 *
 * 1. `elementIdx`는 `HostBindingOpCodes`에 `~elementIdx` (음수로) 인코딩됩니다.
 * 2. `directiveIdx`
 * 3. `bindingRootIdx`
 * 4. `HostBindingsFunction`은 그대로 전달됩니다.
 *
 * `HostBindingOpCodes` 배열에는:
 * - 요소 인덱스를 선택하기 위한 음수.
 * - 그 뒤에 1개 이상의:
 *    - 지시자 인덱스를 선택하기 위한 숫자
 *    - 바인딩 루트 인덱스를 선택하기 위한 숫자
 *    - 호출할 함수를 포함합니다.
 *
 * ## 예제
 *
 * ```ts
 * const hostBindingOpCodes = [
 *   ~30,                               // 요소 30 선택
 *   40, 45, MyDir.ɵdir.hostBindings    // 요소 30에서 MyDir의 호스트 바인딩 호출;
 *                                      // directiveIdx = 40; bindingRootIdx = 45;
 *   50, 55, OtherDir.ɵdir.hostBindings // 요소 30에서 OtherDire의 호스트 바인딩 호출
 *                                      // directiveIdx = 50; bindingRootIdx = 55;
 * ]
 * ```
 *
 * ## 의사 코드
 * ```ts
 * const hostBindingOpCodes = tView.hostBindingOpCodes;
 * if (hostBindingOpCodes === null) return;
 * for (let i = 0; i < hostBindingOpCodes.length; i++) {
 *   const opCode = hostBindingOpCodes[i] as number;
 *   if (opCode < 0) {
 *     // 음수는 요소 인덱스입니다.
 *     setSelectedIndex(~opCode);
 *   } else {
 *     // 양수는 NumberTuple로 바인딩 루트 인덱스 및 지시자 인덱스를 저장합니다.
 *     const directiveIdx = opCode;
 *     const bindingRootIndx = hostBindingOpCodes[++i] as number;
 *     const hostBindingFn = hostBindingOpCodes[++i] as HostBindingsFunction<any>;
 *     setBindingRootForHostBindings(bindingRootIndx, directiveIdx);
 *     const context = lView[directiveIdx];
 *     hostBindingFn(RenderFlags.Update, context);
 *   }
 * }
 * ```
 *
 */
export interface HostBindingOpCodes extends Array<number | HostBindingsFunction<any>> {
  __brand__: 'HostBindingOpCodes';
  debug?: string[];
}

/**
 * `ngDevMode`에서 특정 유형의 `TView`로 명시적으로 표시합니다.
 *
 * 애플리케이션을 디버깅할 때 어떤 유형의 `TView`인지 개념적으로 아는 것이 유용합니다
 * (런타임에서 필요하지 않더라도). 이 정보를 `ngDevMode` `TView`에 저장하고,
 * 더 나은 디버깅 경험을 위해 사용합니다.
 */
export const enum TViewType {
  /**
   * 루트 `TView`는 컴포넌트를 부트스트랩하는 데 사용됩니다. 이는
   * Angular가 소유하지 않는 기존 DOM 노드를 `LView`로 래핑하여
   * 다른 컴포넌트를 로드할 수 있도록 합니다.
   */
  Root = 0,

  /**
   * 컴포넌트에 관련된 `TView`입니다. 이는
   * 컴포넌트 뷰와 직접 연결된 `TView`입니다 (컴포넌트 `TView`의 자식인
   * `Embedded` `TView`와는 반대).
   */
  Component = 1,

  /**
   * 템플릿에 관련된 `TView`입니다. `*ngIf`, `<ng-template>` 등과 같습니다...
   * 컴포넌트는 0개 또는 그 이상의 `Embedded` `TView`를 가질 수 있습니다.
   */
  Embedded = 2,
}

/**
 * 주어진 유형의 모든 템플릿 간에 공유되는 LView의 정적 데이터입니다.
 *
 * `ComponentDef.tView`에 저장됩니다.
 */
export interface TView {
  /**
   * `TView`의 유형(`Root`|`Component`|`Embedded`).
   */
  type: TViewType;

  /**
   * 이 TView에 대한 LView 인스턴스를 생성하는 데 사용되는 청사진입니다. 이
   * 청사진을 복사하는 것은 처음부터 새로운 LView를 만드는 것보다 빠릅니다.
   */
  blueprint: LView;

  /**
   * 동적으로 생성된 뷰 및 컴포넌트의 뷰를 새로 고치는 데 사용되는 템플릿 함수입니다.
   * 인라인 뷰의 경우 null입니다.
   */
  template: ComponentTemplate<{}> | null;

  /**
   * 쿼리 관련 지침을 포함하는 함수입니다.
   */
  viewQuery: ViewQueriesFunction<{}> | null;

  /**
   * 이 `TView`의 선언 위치를 나타내는 `TNode`입니다 (이 `TView`의 일부가 아닙니다).
   */
  declTNode: TNode | null;

  // FIXME(misko): 왜 `TView`에 `declarationTView` 속성이 없습니까?

  /** 이 템플릿이 생성 모드에서 처리되었는지 여부. */
  firstCreatePass: boolean;

  /**
   * 이 템플릿이 업데이트 모드 (예: 변경 감지)에서 처리되었는지 여부입니다.
   *
   * `firstUpdatePass`는 메타데이터에 대한 한계 우선 순위 목록을 구축하기 위해
   * `TData`를 설정하기 위한 스타일링에 사용됩니다.
   *
   * 일반적으로 이 기능은 첫 번째 실행 이후에 지워집니다. 예외가 발생하면 이 플래그는
   * 첫 번째 성공적인 (예외가 없는) 통과가 있을 때까지 켜져 있습니다. 이는
   * 개별 스타일 지침이 연결 목록에 추가되었는지 여부를 추적하도록 합니다.
   */
  firstUpdatePass: boolean;

  /** LView.data[]의 정적 데이터. TNodes, PipeDefInternal 또는 TI18n을 포함합니다. */
  data: TData;

  /**
   * 바인딩 시작 인덱스는 데이터 배열이 바인딩을 저장하기 시작하는 인덱스입니다.
   * 이 값을 저장하면 업데이트 모드에서 적절한 지점에서 배열의 바인딩을 읽기 시작합니다.
   *
   * -1은 초기화되지 않았음을 의미합니다.
   */
  bindingStartIndex: number;

  /**
   * `LView`의 "expando" 섹션이 시작되는 인덱스입니다. expando
   * 섹션에는 인젝터, 지시자 인스턴스 및 호스트 바인딩 값이 포함됩니다.
   * `LView`의 "decls" 및 "vars" 섹션과 달리 이 섹션의 길이는
   * 로컬리티를 보존하기 위해 런타임에서 지시자가 매치되므로 컴파일 시간에 계산할 수 없습니다.
   *
   * 이 시작 인덱스를 저장하여 `setHostBindings`에서 호스트 바인딩 확인을 시작할 수 있습니다.
   */
  expandoStartIndex: number;

  /**
   * 이 뷰에 추적된 정적 뷰 쿼리가 있는지 여부입니다.
   *
   * 이 정보를 저장하여 생성 모드 이후에 정적 쿼리 결과를 수집하기 위해
   * 뷰 쿼리 새로 고침을 수행해야 하는지 알 수 있습니다.
   */
  staticViewQueries: boolean;

  /**
   * 이 뷰에 추적된 정적 콘텐츠 쿼리가 있는지 여부입니다.
   *
   * 이 정보를 저장하여 생성 모드 이후에 정적 쿼리 결과를 수집하기 위해
   * 콘텐츠 쿼리 새로 고침을 수행해야 하는지 알 수 있습니다.
   */
  staticContentQueries: boolean;

  /**
   * 뷰에서 위치한 첫 번째 자식 노드에 대한 참조입니다.
   */
  firstChild: TNode | null;

  /**
   * `HostBindings`를 처리하기 위해 변경 감지 중에 재생할 OpCodes를 저장합니다.
   *
   * `HostBindingOpCodes`에 대한 인코딩 세부정보를 참조하십시오.
   */
  hostBindingOpCodes: HostBindingOpCodes | null;

  /**
   * 이 뷰에서 찾을 수 있는 지시자 및 컴포넌트의 전체 레지스트리입니다.
   *
   * 호스트 컴포넌트 없이 템플릿 기능을 렌더링할 수 있도록 TView에서 전체 정의 목록을
   * 복사해야 합니다.
   */
  directiveRegistry: DirectiveDefList | null;

  /**
   * 이 뷰에서 찾을 수 있는 파이프의 전체 레지스트리입니다.
   *
   * 속성은 `PipeDefs`의 배열 또는 `PipeDefs`의 배열을 반환하는 함수입니다. 이 함수는
   * 사전에 선언을 지원하기 위해 필요합니다.
   *
   * 호스트 컴포넌트 없이 템플릿 기능을 렌더링할 수 있도록 TView에서 전체 정의 목록을
   * 복사해야 합니다.
   */
  pipeRegistry: PipeDefList | null;

  /**
   * 생성 모드에서 이 뷰에서 실행해야 하는 ngOnInit, ngOnChanges 및 ngDoCheck 훅의 배열입니다.
   *
   * 이 배열은 평면 구조를 가지며 TNode 인덱스, 지시자 인덱스 (LView 내에서 인스턴스를 찾을 수 있는) 및 훅 기능을 포함합니다.
   * TNode 인덱스는 지시자 인덱스 및 훅 기능 뒤에 옵니다. 주어진 TNode에 여러 훅이 있는 경우,
   * TNode 인덱스는 반복되지 않으며 다음 생명주기 훅 정보는 이전 훅 기능 바로 뒤에 저장됩니다.
   * 이는 런타임에 시스템이 결정을 내리거나 조회하지 않고 모든 반복을 효율적으로 호출할 수 있도록 하기
   * 위해 설계된 것입니다.
   */
  preOrderHooks: HookData | null;

  /**
   * 업데이트 모드에서 이 뷰에서 실행해야 하는 ngOnChanges 및 ngDoCheck 훅의 배열입니다.
   *
   * 이 배열은 `preOrderHooks`와 동일한 구조를 가집니다.
   */
  preOrderCheckHooks: HookData | null;

  /**
   * 생성 모드에서 ngAfterContentInit 및 ngAfterContentChecked 훅을 위해 실행해야 하는 배열입니다.
   *
   * 짝수 인덱스: 지시자 인덱스
   * 홀수 인덱스: 훅 기능
   */
  contentHooks: HookData | null;

  /**
   * 업데이트 모드에서 ngAfterContentChecked 훅을 실행해야 하는 배열입니다.
   *
   * 짝수 인덱스: 지시자 인덱스
   * 홀수 인덱스: 훅 기능
   */
  contentCheckHooks: HookData | null;

  /**
   * 생성 모드에서 ngAfterViewInit 및 ngAfterViewChecked 훅을 실행해야 하는 배열입니다.
   *
   * 짝수 인덱스: 지시자 인덱스
   * 홀수 인덱스: 훅 기능
   */
  viewHooks: HookData | null;

  /**
   * 업데이트 모드에서 ngAfterViewChecked 훅을 실행해야 하는 배열입니다.
   *
   * 짝수 인덱스: 지시자 인덱스
   * 홀수 인덱스: 훅 기능
   */
  viewCheckHooks: HookData | null;

  /**
   * 이 뷰가 파괴될 때 실행해야 하는 ngOnDestroy 훅의 배열입니다.
   *
   * 짝수 인덱스: 지시자 인덱스
   * 홀수 인덱스: 훅 기능
   */
  destroyHooks: DestroyHookData | null;

  /**
   * 뷰가 파괴될 때, 리스너를 해제하고 출력을 구독 취소해야 합니다. 이 정리 배열은
   * 리스너 데이터 (4개 묶음으로) 및 특정 뷰의 출력 데이터를 저장합니다 (2개 묶음으로).
   * 배열을 결합하면 메모리를 절약할 수 있습니다 (배열당 70바이트) 및 코드 크기도 절약할 수 있습니다(두 개의
   * 별도 for 루프에 대해).
   *
   * 그 값이 기본 DOM 리스너 또는 출력 구독이 저장되면:
   * 1번째 인덱스는: 이벤트 이름 `name = tView.cleanup[i+0]`
   * 2번째 인덱스는: 기본 요소의 인덱스 또는 기본 요소를 기반으로 글로벌 대상(창,
   *               문서 또는 본체)의 참조를 검색하는 함수:
   *    `typeof idxOrTargetGetter === 'function'`: 글로벌 대상 getter 함수
   *    `typeof idxOrTargetGetter === 'number'`: 기본 요소의 인덱스
   *
   * 3번째 인덱스는: 리스너 기능의 인덱스 `listener = lView[CLEANUP][tView.cleanup[i+2]]`
   * 4번째 인덱스는: `useCaptureOrIndx = tView.cleanup[i+3]`
   *    `typeof useCaptureOrIndx == 'boolean' : useCapture 불리언
   *    `typeof useCaptureOrIndx == 'number':
   *         `useCaptureOrIndx >= 0` `removeListener = LView[CLEANUP][useCaptureOrIndx]`
   *         `useCaptureOrIndx <  0` `subscription = LView[CLEANUP][-useCaptureOrIndx]`
   *
   * 출력 구독 또는 쿼리 목록 파괴 훅의 경우:
   * 1번째 인덱스는: 출력 구독 취소 함수 / 쿼리 목록 파괴 함수
   * 2번째 인덱스는: LView.cleanupInstances[]에서 함수 컨텍스트의 인덱스
   *               `tView.cleanup[i+0].call(lView[CLEANUP][tView.cleanup[i+1]])`
   */
  cleanup: any[] | null;

  /**
   * 현재 뷰가 확인을 마친 후 새로 고쳐야 할 자식 컴포넌트에 대한 요소 인덱스 목록입니다.
   * 이러한 인덱스는 이미 HEADER_OFFSET에 대해 조정되었습니다.
   *
   */
  components: number[] | null;

  /**
   * 주어진 뷰에서 추적된 쿼리 모음입니다.
   */
  queries: TQueries | null;

  /**
   * 콘텐츠 쿼리와 함께 지시자의 인덱스를 가리키는 인덱스 배열입니다.
   *
   * 이 배열의 각 항목은 다음의 튜플입니다.
   * - 주어진 지시자가 선언한 첫 번째 콘텐츠 쿼리 인덱스의 인덱스;
   * - 지시자의 인덱스.
   *
   * 뷰 새로 고침 프로세스의 일환으로 콘텐츠 쿼리를 새로 고칠 수 있도록 이 인덱스를 저장합니다.
   */
  contentQueries: number[] | null;

  /**
   * 뷰 내의 허용된 요소를 선언하는 스키마 집합입니다.
   */
  schemas: SchemaMetadata[] | null;

  /**
   * 뷰에 대한 상수 배열. 속성 배열, 로컬 정의 배열 등을 포함합니다.
   * 지시자 매칭, 속성 바인딩, 로컬 정의 등 여러 용도로 사용됩니다.
   */
  consts: TConstants | null;

  /**
   * 뷰의 첫 번째 생성 패스를 완료하기 전에 오류가 발생했음을 나타냅니다.
   * 이는 뷰가 손상되었을 가능성이 높으며, 복구를 시도해야 함을 나타냅니다.
   */
  incompleteFirstPass: boolean;

  /**
   * 수화 목적의 이 TView의 고유 ID:
   * - TViewType.Embedded: 서버의 직렬화 중 생성된 고유 ID
   * - TViewType.Component: 컴포넌트 속성을 기반으로 생성된 ID
   *                        (세부 정보는 `getComponentId` 함수 참조)
   */
  ssrId: string | null;
}

/** 단일 훅 콜백 함수. */
export type HookFn = () => void;

/**
 * 훅을 호출하는 데 필요한 정보. 호출해야 할 콜백과
 * 그 컨텍스트를 찾을 인덱스입니다.
 */
export type HookEntry = number | HookFn;

/**
 * 뷰에 대해 실행해야 하는 훅 및 해당 지시자 인덱스의 배열입니다.
 *
 * 뷰의 각 노드에 대해 다음의 데이터가 저장됩니다.
 * 1) 노드 인덱스 (선택 사항)
 * 2) 숫자/함수 쌍의 시리즈로:
 *  - 짝수 인덱스는 지시자 인덱스
 *  - 홀수 인덱스는 훅 함수
 *
 * 특별한 케이스:
 *  - 음수 지시자 인덱스는 초기화 훅(ngOnInit, ngAfterContentInit, ngAfterViewInit)을 나타냅니다.
 */
export type HookData = HookEntry[];

/**
 * 뷰에 대해 실행해야 하는 파괴 훅과 그들의 지시자 인덱스 배열입니다.
 *
 * 이 배열은 숫자/함수 또는 숫자/(숫자|함수)[]의 시리즈로 설정됩니다:
 * - 짝수 인덱스는 훅을 호출할 컨텍스트를 나타냅니다.
 * - 홀수 인덱스는 훅 함수 자체입니다. 홀수 인덱스의 값이 배열인 경우,
 *   이는 `multi` 제공자에서 파괴 훅을 나타냅니다. 이 경우:
 *     - 짝수 인덱스는 제공자 인덱스를 나타냅니다.
 *     - 홀수 인덱스는 파괴 훅 함수입니다.
 * 예를 들어:
 * LView: `[0, 1, 2, AService, 4, [BService, CService, DService]]`
 * destroyHooks: `[3, AService.ngOnDestroy, 5, [0, BService.ngOnDestroy, 2, DService.ngOnDestroy]]`
 *
 * 위의 예에서 `AService`는 `ngOnDestroy`가 있는 유형 제공자이고, `BService`, `CService`, `DService`는
 * `multi` 제공자의 일원입니다. `BService`와 `DService`만 `ngOnDestroy` 훅이 있습니다.
 */
export type DestroyHookData = (HookEntry | HookData)[];

/**
 * LView의 인스턴스별 데이터 배열에 해당하는 정적 데이터입니다.
 *
 * 각 노드의 정적 데이터는 데이터 배열에 저장된 동일한 인덱스에 tData에 저장됩니다.
 * 정적 데이터가 없는 노드는 tData에 null 값을 저장하여 희소 배열을 피합니다.
 *
 * 각 파이프 정의는 데이터 배열의 해당하는 인덱스에 저장됩니다.
 *
 * 각 호스트 속성의 이름은 데이터 배열의 해당 인덱스에 저장됩니다.
 *
 * 각 속성 바인딩 이름은 데이터 배열의 해당 인덱스에 저장됩니다. 바인딩이 보간인 경우,
 * 정적 문자열 값은 동적 값과 평행하게 저장됩니다. 예를 들면:
 *
 * id="prefix {{ v0 }} a {{ v1 }} b {{ v2 }} suffix"
 *
 * LView       |   TView.data
 *------------------------
 *  v0 값     |   'a'
 *  v1 값     |   'b'
 *  v2 값     |   id � prefix � suffix
 *
 * 인젝터 블룸 필터도 여기 저장됩니다.
 */
export type TData = (
  | TNode
  | PipeDef<any>
  | DirectiveDef<any>
  | ComponentDef<any>
  | number
  | TStylingRange
  | TStylingKey
  | ProviderToken<any>
  | TI18n
  | I18nUpdateOpCodes
  | TIcu
  | null
  | string
  | TDeferBlockDetails
)[];
