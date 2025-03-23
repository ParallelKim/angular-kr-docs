/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {SimpleChanges} from './simple_change';

/**
 * @description
 * 지시자의 데이터 바인딩된 속성이 변경될 때 호출되는 생명 주기 후크입니다.
 * 변경 사항을 처리하기 위해 `ngOnChanges()` 메서드를 정의합니다.
 *
 * @see {@link DoCheck}
 * @see {@link OnInit}
 * @see [생명 주기 후크 가이드](guide/components/lifecycle)
 *
 * @usageNotes
 * 다음 코드 조각은 구성요소가 이 인터페이스를 구현하여
 * 입력 속성에 대한 변경 처리기를 정의하는 방법을 보여줍니다.
 *
 * {@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnChanges'}
 *
 * @publicApi
 */
export interface OnChanges {
  /**
   * 기본 변경 탐지기가 데이터 바인딩된 속성을 확인한 직후에 호출되는 콜백 메서드입니다.
   * 최소한 하나 이상의 속성이 변경된 경우에만 호출되며, 뷰 및 콘텐츠
   * 자식이 확인되기 이전입니다.
   * @param changes 변경된 속성입니다.
   */
  ngOnChanges(changes: SimpleChanges): void;
}

/**
 * @description
 * Angular가 지시자의 모든 데이터 바인딩된 속성을 초기화한 후 호출되는 생명 주기 후크입니다.
 * 추가 초기화 작업을 처리하기 위해 `ngOnInit()` 메서드를 정의합니다.
 *
 * @see {@link AfterContentInit}
 * @see [생명 주기 후크 가이드](guide/components/lifecycle)
 *
 * @usageNotes
 * 다음 코드 조각은 구성요소가 이 인터페이스를 구현하여
 * 자신의 초기화 메서드를 정의하는 방법을 보여줍니다.
 *
 * {@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnInit'}
 *
 * @publicApi
 */
export interface OnInit {
  /**
   * 기본 변경 탐지기가 지시자의
   * 데이터 바인딩된 속성을 처음으로 확인한 직후에 호출되는 콜백 메서드입니다.
   * 뷰나 콘텐츠 자식이 확인되기 이전에 호출되며,
   * 지시자가 인스턴스화될 때 한 번만 호출됩니다.
   */
  ngOnInit(): void;
}

/**
 * 지시자를 위한 사용자 정의 변경 탐지 기능을 호출하는 생명 주기 후크입니다.
 * 기본 변경 탐지기가 수행하는 검사 외에도 호출됩니다.
 *
 * 기본 변경 탐지 알고리즘은 변경 탐지 실행 간에 참조를 통해
 * 바인딩된 속성 값의 차이를 찾아냅니다. 이 훅을 사용하여
 * 다른 방법에 따라 변경 사항을 확인하고 응답할 수 있습니다.
 *
 * 기본 변경 탐지기가 변경 사항을 감지하면,
 * 추가 변경 탐지를 수행하지 않더라도 제공된 경우 `ngOnChanges()`를 호출합니다.
 * 일반적으로 동일한 입력의 변경 사항에 응답하기 위해 `DoCheck`와 `OnChanges`를 함께 사용하지 않아야 합니다.
 *
 * @see {@link OnChanges}
 * @see [생명 주기 후크 가이드](guide/components/lifecycle)
 *
 * @usageNotes
 * 다음 코드 조각은 구성요소가 이 인터페이스를 구현하여
 * 자신의 변경 탐지 주기를 호출하는 방법을 보여줍니다.
 *
 * {@example core/ts/metadata/lifecycle_hooks_spec.ts region='DoCheck'}
 *
 * 보다 완벽한 예제와 논의에 대해서는
 * [사용자 정의 변경 탐지 정의](guide/components/lifecycle#defining-custom-change-detection)를 참조하세요.
 *
 * @publicApi
 */
export interface DoCheck {
  /**
   * 변경 탐지를 수행하는 콜백 메서드로, 기본 변경 탐지기가 실행된 후 호출됩니다.
   * 컬렉션에 대해 사용자 정의 변경 검사를 구현하기 위해
   * `KeyValueDiffers` 및 `IterableDiffers`를 참조하세요.
   *
   */
  ngDoCheck(): void;
}

/**
 * 지시자, 파이프 또는 서비스가 파괴될 때 호출되는 생명 주기 후크입니다.
 * 인스턴스가 파괴될 때 발생해야 하는 모든 사용자 정의 정리 작업을 위해 사용합니다.
 * @see [생명 주기 후크 가이드](guide/components/lifecycle)
 *
 * @usageNotes
 * 다음 코드 조각은 구성요소가 이 인터페이스를 구현하여
 * 자신의 사용자 정의 정리 메서드를 정의하는 방법을 보여줍니다.
 *
 * {@example core/ts/metadata/lifecycle_hooks_spec.ts region='OnDestroy'}
 *
 * @publicApi
 */
export interface OnDestroy {
  /**
   * 지시자, 파이프 또는 서비스 인스턴스가 파괴되기 직전에 호출되는 사용자 정의 정리 작업을 수행하는 콜백 메서드입니다.
   */
  ngOnDestroy(): void;
}

/**
 * @description
 * Angular가 지시자의 모든 콘텐츠를 완전히 초기화한 후 호출되는 생명 주기 후크입니다.
 * 프로젝션된 콘텐츠가 초기화될 때 한 번만 실행됩니다.
 * 추가 초기화 작업을 처리하기 위해 `ngAfterContentInit()` 메서드를 정의합니다.
 *
 * @see {@link OnInit}
 * @see {@link AfterViewInit}
 * @see [생명 주기 후크 가이드](guide/components/lifecycle)
 *
 * @usageNotes
 * 다음 코드 조각은 구성요소가 이 인터페이스를 구현하여
 * 자신의 콘텐츠 초기화 메서드를 정의하는 방법을 보여줍니다.
 *
 * {@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterContentInit'}
 *
 * @publicApi
 */
export interface AfterContentInit {
  /**
   * Angular가 지시자의 모든 콘텐츠 초기화를 완료한 직후에 호출되는 콜백 메서드입니다.
   * 지시자가 인스턴스화될 때 한 번만 호출됩니다.
   */
  ngAfterContentInit(): void;
}

/**
 * @description
 * 기본 변경 탐지기가 지시자의 모든 콘텐츠 검사를 완료한 후 호출되는 생명 주기 후크입니다.
 * 콘텐츠가 확인된 후 실행되며, 대부분 변경 탐지 주기 중입니다.
 *
 * @see {@link AfterViewChecked}
 * @see [생명 주기 후크 가이드](guide/components/lifecycle)
 *
 * @usageNotes
 * 다음 코드 조각은 구성요소가 이 인터페이스를 구현하여
 * 자신의 검사 후 기능을 정의하는 방법을 보여줍니다.
 *
 * {@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterContentChecked'}
 *
 * @publicApi
 */
export interface AfterContentChecked {
  /**
   * 기본 변경 탐지기가 지시자의 모든 콘텐츠 검사를 완료한 직후 호출되는 콜백 메서드입니다.
   */
  ngAfterContentChecked(): void;
}

/**
 * @description
 * Angular가 컴포넌트의 뷰를 완전히 초기화한 후 호출되는 생명 주기 후크입니다.
 * 추가 초기화 작업을 처리하기 위해 `ngAfterViewInit()` 메서드를 정의합니다.
 *
 * @see {@link OnInit}
 * @see {@link AfterContentInit}
 * @see [생명 주기 후크 가이드](guide/components/lifecycle)
 *
 * @usageNotes
 * 다음 코드 조각은 구성요소가 이 인터페이스를 구현하여
 * 자신의 뷰 초기화 메서드를 정의하는 방법을 보여줍니다.
 *
 * {@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterViewInit'}
 *
 * @publicApi
 */
export interface AfterViewInit {
  /**
   * Angular가 컴포넌트의 뷰 초기화를 완료한 직후 호출되는 콜백 메서드입니다.
   * 뷰가 인스턴스화될 때 한 번만 호출됩니다.
   *
   */
  ngAfterViewInit(): void;
}

/**
 * @description
 * 기본 변경 탐지기가 컴포넌트의 뷰에서 변경 사항을 검사 완료한 후 호출되는 생명 주기 후크입니다.
 *
 * @see {@link AfterContentChecked}
 * @see [생명 주기 후크 가이드](guide/components/lifecycle)
 *
 * @usageNotes
 * 다음 코드 조각은 구성요소가 이 인터페이스를 구현하여
 * 자신의 검사 후 기능을 정의하는 방법을 보여줍니다.
 *
 * {@example core/ts/metadata/lifecycle_hooks_spec.ts region='AfterViewChecked'}
 *
 * @publicApi
 */
export interface AfterViewChecked {
  /**
   * 기본 변경 탐지기가 컴포넌트의 뷰에 대해 하나의 변경 검사 주기를 완료한 직후 호출되는 콜백 메서드입니다.
   */
  ngAfterViewChecked(): void;
}
