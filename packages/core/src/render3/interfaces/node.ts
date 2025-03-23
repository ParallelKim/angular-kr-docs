/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {Type} from '../../interface/type';
import {KeyValueArray} from '../../util/array_utils';
import {TStylingRange} from '../interfaces/styling';
import {AttributeMarker} from './attribute_marker';

import {TIcu} from './i18n';
import {CssSelector} from './projection';
import {RNode} from './renderer_dom';
import type {LView, TView} from './view';

/**
 * TNodeType는 {@link TNode}의 `type` 속성과 일치합니다.
 *
 * NOTE: type ID는 각 비트를 사용하여 유형을 나타내기 위해 설계되었습니다. 이것은
 * `TNode`가 여러 유형인지 쉽게 확인할 수 있도록 하려는 것입니다.
 *
 * `if (tNode.type === TNodeType.Text || tNode.type === TNode.Element)`
 * 다음과 같이 작성할 수 있습니다:
 * `if (tNode.type & (TNodeType.Text | TNodeType.Element))`
 *
 * 그러나 주어진 `TNode`는 하나의 유형만 가질 수 있습니다.
 */
export const enum TNodeType {
  /**
   * TNode는 DOM 요소에 대한 정보를 포함합니다. 즉, {@link RText}.
   */
  Text = 0b1,

  /**
   * TNode는 DOM 요소에 대한 정보를 포함합니다. 즉, {@link RElement}.
   */
  Element = 0b10,

  /**
   * TNode는 임베디드 뷰에 대한 {@link LContainer} 정보를 포함합니다.
   */
  Container = 0b100,

  /**
   * TNode는 `<ng-container>` 요소 {@link RNode}에 대한 정보를 포함합니다.
   */
  ElementContainer = 0b1000,

  /**
   * TNode는 `<ng-content>` 프로젝션에 대한 정보를 포함합니다.
   */
  Projection = 0b10000,

  /**
   * TNode는 `i18n`에서 사용되는 ICU 주석에 대한 정보를 포함합니다.
   */
  Icu = 0b100000,

  /**
   * 향후 `TNode`를 위한 자리 표시자를 나타내는 특수 노드 유형입니다.
   *
   * I18n 번역 블록은 포함된 요소 노드보다 먼저 생성됩니다. (I18n 블록은 여러 요소를 가로지를 수 있습니다.)
   * i18n `TNode` (텍스트를 나타내는)은 먼저 생성된 후 그렇지 않은 경우,
   * 아직 생성되지 않은 요소 `TNode`를 가리켜야 할 수도 있습니다. 이러한 경우를 위해
   * `Placeholder` `TNode`를 생성합니다. 이는 i18n이
   * 해당 위치에 있는 미래 노드에 대한 정보를 모른 채로 `TNode`를 구조적으로 연결할 수 있게 해줍니다.
   *
   * `firstCreatePass`에서 요소 지침이 실행되면 해당 위치에 `TNode`를 생성하려고 시도합니다.
   * 이미 `Placeholder` `TNode`가 존재한다면 시스템에 기존의 `TNode`를
   * 재사용해야 한다고 알려줍니다 (새로 생성하는 것이 아니라).
   * 그리고 누락된 정보만 업데이트합니다.
   */
  Placeholder = 0b1000000,

  /**
   * TNode는 `@let` 선언에 대한 정보를 포함합니다.
   */
  LetDeclaration = 0b10000000,

  // 조합 유형. 이것은 `TNode.type`에만 사용되어야 하며
  // `TNode.type`이 여러 선택 중 하나인지 확인하는 유용한 방법입니다.

  // 참고: https://github.com/microsoft/TypeScript/issues/35875 현재 열거형을 참조할 수 없는 이유.
  AnyRNode = 0b11, // Text | Element
  AnyContainer = 0b1100, // Container | ElementContainer
}

/**
 * `TNodeType`을 사람이 읽을 수 있는 텍스트로 변환합니다.
 * 항상 `TNodeType`와 일치하는지 확인하세요.
 */
export function toTNodeTypeAsString(tNodeType: TNodeType): string {
  let text = '';
  tNodeType & TNodeType.Text && (text += '|Text');
  tNodeType & TNodeType.Element && (text += '|Element');
  tNodeType & TNodeType.Container && (text += '|Container');
  tNodeType & TNodeType.ElementContainer && (text += '|ElementContainer');
  tNodeType & TNodeType.Projection && (text += '|Projection');
  tNodeType & TNodeType.Icu && (text += '|IcuContainer');
  tNodeType & TNodeType.Placeholder && (text += '|Placeholder');
  tNodeType & TNodeType.LetDeclaration && (text += '|LetDeclaration');
  return text.length > 0 ? text.substring(1) : text;
}

/**
 * 주어진 값이 `TNode` 모양과 일치하는지 감지하는 도우미 함수입니다.
 *
 * 이 논리는 `insertBeforeIndex`와 그 가능한 값을 사용하여
 * `TView.data` 내의 다른 유형의 객체와 `TNode` 모양을 구별합니다.
 * 이는 완벽한 검사 방법은 아니지만, 나름의 구별 방법이 될 수 있습니다.
 * 왜냐하면 우리는 `TView.data` 내의 객체 형태를 제어하기 때문입니다.
 */
export function isTNodeShape(value: unknown): value is TNode {
  return (
    value != null &&
    typeof value === 'object' &&
    ((value as TNode).insertBeforeIndex === null ||
      typeof (value as TNode).insertBeforeIndex === 'number' ||
      Array.isArray((value as TNode).insertBeforeIndex))
  );
}

export function isLetDeclaration(tNode: TNode): boolean {
  return !!(tNode.type & TNodeType.LetDeclaration);
}

/**
 * TNode.flags 속성과 일치합니다.
 */
export const enum TNodeFlags {
  /** 비트 #1 - 이 비트는 노드가 모든 디렉티브(컴포넌트 포함)의 호스트인 경우 설정됩니다. */
  isDirectiveHost = 0x1,

  /** 비트 #2 - 이 비트는 노드가 투영된 경우 설정됩니다. */
  isProjected = 0x2,

  /** 비트 #3 - 이 비트는 이 노드의 디렉티브가 내용 쿼리를 갖는 경우 설정됩니다. */
  hasContentQuery = 0x4,

  /** 비트 #4 - 이 비트는 노드가 "class" 입력을 갖는 경우 설정됩니다. */
  hasClassInput = 0x8,

  /** 비트 #5 - 이 비트는 노드가 "style" 입력을 갖는 경우 설정됩니다. */
  hasStyleInput = 0x10,

  /** 비트 #6 - 이 비트는 노드가 i18n에 의해 분리된 경우 설정됩니다. */
  isDetached = 0x20,

  /**
   * 비트 #7 - 이 비트는 노드가 호스트 바인딩이 있는 디렉티브를 갖는 경우 설정됩니다.
   *
   * 이 플래그는 호스트 바인딩 로직을 보호하고 실제로 호스트 바인딩이 있는 노드에서만 호출할 수 있게 해줍니다.
   */
  hasHostBindings = 0x40,

  /**
   * 비트 #8 - 이 비트는 노드가 건너뛸 수 있는 수분화 블록에 존재하는 경우 설정됩니다.
   */
  inSkipHydrationBlock = 0x80,
}

/**
 * TNode.providerIndexes 속성과 일치합니다.
 */
export const enum TNodeProviderIndexes {
  /** 이 노드의 첫 번째 제공자의 인덱스는 최하위 비트에 인코딩됩니다. */
  ProvidersStartIndexMask = 0b00000000000011111111111111111111,

  /**
   * 이 노드의 컴포넌트에서 내려오는 뷰 제공자의 수는
   * 가장 상위 20비트에 인코딩됩니다.
   */
  CptViewProvidersCountShift = 20,
  CptViewProvidersCountShifter = 0b00000000000100000000000000000000,
}

/**
 * 조합:
 * - 속성 이름과 값.
 * - 속성 처리 방식을 변경하는 플래그 역할을 하는 특수 마커들.
 * - ngProjectAs 선택자를 구문 분석한 것.
 */
export type TAttributes = (string | AttributeMarker | CssSelector)[];

/**
 * 뷰와 관련된 상수입니다. 포함:
 * - 속성 배열.
 * - 로컬 정의 배열.
 * - 번역된 메시지 (i18n).
 */
export type TConstants = (TAttributes | string)[];

/**
 * consts 배열을 반환하는 팩토리 함수. consts는 목록에 consts를 정의하는 데 필요한 추가 문이 있을 경우 함수로 표현될 수 있습니다.
 * 예를 들어 i18n의 경우 추가 i18n 호출이 생성되며, 이것은 consts가 처음 요청될 때 실행되어야 합니다.
 */
export type TConstantsFactory = () => TConstants;

/**
 * TConstants 유형은 `consts` 필드가 ComponentDef에서 생성되는 방식을 설명합니다.
 * 배열이거나 그 배열을 반환하는 팩토리 함수일 수 있습니다.
 */
export type TConstantsOrFactory = TConstants | TConstantsFactory;

/**
 * 특정 노드에 대해 템플릿의 모든 인스턴스에서 공유되는 바인딩 데이터 (플라이웨이트).
 *
 * 속성이란:
 * - PropertyAliases: 해당 속성의 데이터가 생성되었고
 * - Null: 해당 속성의 데이터가 이미 생성되었고 아무것도 발견되지 않았습니다.
 * - Undefined: 해당 속성의 데이터가 아직 생성되지 않았습니다.
 *
 * 자세한 내용은: https://en.wikipedia.org/wiki/Flyweight_pattern
 */
export interface TNode {
  /** TNode의 유형입니다. TNodeType 참조. */
  type: TNodeType;

  /**
   * TView.data에서 TNode의 인덱스와 LView의 해당 네이티브 요소.
   *
   * 이는 TNode에서 해당 네이티브 요소를 얻을 때 필요합니다.
   *
   * 인덱스가 -1이면 이는 동적으로 생성된 컨테이너 노드 또는 임베디드 뷰 노드입니다.
   */
  index: number;

  /**
   * 기존 DOM 노드 인덱스 앞에 삽입합니다.
   *
   * DOM 노드가 삽입될 때 일반적으로 생성되는 대로 첨가됩니다.
   * i18n의 경우, 변환된 텍스트 노드는 `ɵɵi18nStart` 명령의 일환으로 미리 생성됩니다.
   * 따라서 이 `TNode`는 단순히 첨가될 수 없으며 대신 `insertBeforeIndex` 의미론을 사용하여 삽입해야 합니다.
   *
   * 추가적으로 이 `TNode`의 하위에 새 텍스트 노드를 삽입하는 것이 필요할 수도 있습니다.
   * 그런 경우 값은 삽입할 텍스트 노드의 배열을 저장합니다.
   *
   * 예시:
   * ```html
   * <div i18n>
   *   Hello <span>World</span>!
   * </div>
   * ```
   * 위의 예에서 `ɵɵi18nStart` 명령은 `Hello `, `World` 및 `!` 텍스트 노드를 생성할 수 있습니다.
   * 또한 `Hello ` 및 `!` 텍스트 노드를 `<div>`의 자식으로 삽입할 수 있지만,
   * `<span>` 노드가 아직 생성되지 않았기 때문에 `World`를 삽입할 수는 없습니다.
   * 그런 경우 `<span>` `TNode`는 배열을 가지고 있으며 이를 사용하여
   * `<span>` 자신의 앞에 자신을 삽입하고 `World`(생성된 `ɵɵi18nStart`)를
   * `<span>`에 삽입하도록 지시합니다.
   *
   * 의사 코드:
   * ```ts
   *   if (insertBeforeIndex === null) {
   *     // 정상적으로 첨가
   *   } else if (Array.isArray(insertBeforeIndex)) {
   *     // 먼저 현재 `TNode`를 올바른 위치에 삽입
   *     const currentNode = lView[this.index];
   *     parentNode.insertBefore(currentNode, lView[this.insertBeforeIndex[0]]);
   *     // 이제 모든 자식 추가
   *     for(let i=1; i<this.insertBeforeIndex; i++) {
   *       currentNode.appendChild(lView[this.insertBeforeIndex[i]]);
   *     }
   *   } else {
   *     parentNode.insertBefore(lView[this.index], lView[this.insertBeforeIndex])
   *   }
   * ```
   * - null: 정상적으로 `parentNode.appendChild`를 사용하여 추가
   * - `number`: `parentNode.insertBefore(lView[this.index], lView[this.insertBeforeIndex])`를 사용하여 추가
   *
   * *초기화*
   *
   * `ɵɵi18nStart`는 노드가 생성되기 전에 실행되기 때문에
   * `TView.firstCreatePass`에 대해 `ɵɵi18nStart`가 해당하는 `TNode`의
   * `insertBeforeIndex` 값을 설정하는 것은 불가능하다.
   * 이런 이유로 `ɵɵi18nStart`는 해당 위치에 `TNodeType.Placeholder`
   * `TNode`를 생성합니다. `TNodeType.Placeholder`를 참조하여
   * 자세한 사항을 알아보세요.
   */
  insertBeforeIndex: InsertBeforeIndex;

  /**
   * 이 노드의 LView에서 가장 가까운 주입기의 인덱스입니다.
   *
   * 인덱스가 -1이면 이 노드 또는 이 뷰의 조상 노드에 주입기가 없습니다.
   *
   * 인덱스가 -1이 아닌 경우, 이는 이 노드의 주입기 인덱스이거나
   * 동일한 뷰에서 부모 주입기의 인덱스입니다. 부모 주입기 인덱스를
   * 노드 트리 아래로 전달하여
   * 깊은 노드 트리를 탐색하지 않고도 부모 주입기를 찾을 수 있습니다.
   * 주입기 인덱스는 뷰 경계를 넘지 않도록 설정되지 않으므로
   * 여러 컴포넌트 호스트가 있을 수 있습니다.
   *
   * tNode.injectorIndex === tNode.parent.injectorIndex이면,
   * 그러면 인덱스는 부모 주입기에 속합니다.
   */
  injectorIndex: number;

  /** 지시문의 시작 인덱스를 저장합니다. */
  directiveStart: number;

  /**
   * 지시문의 최종 배타적 인덱스를 저장합니다.
   *
   * `directiveStart-directiveEnd` 범위 바로 뒤의 영역은
   * `HostBindingFunction` `vars`를 할당하는 데 사용됩니다
   * (또는 바인딩이 없는 경우 null).
   * 그렇기 때문에 `directiveEnd`는 `HostBindingFunction`이 실행되기 전에
   * `LFrame.bindingRootIndex`를 설정하는 데 사용됩니다.
   */
  directiveEnd: number;

  /**
   * 노드의 구성 요소(하나)가 저장되는 `directiveStart` 오프셋입니다.
   * 노드에 구성 요소가 적용되지 않은 경우 -1로 설정합니다. 구성 요소 인덱스는
   * `directiveStart + componentOffset`를 사용하여 찾을 수 있습니다.
   */
  componentOffset: number;

  /**
   * 마지막으로 스타일링 지침이 있었던 지시문을 저장합니다.
   *
   * 초기 값은 `-1`이며 이는 `hostBindings` 스타일링 지침이 실행되지 않았음을 의미합니다.
   * `hostBindings` 지침이 실행되면 해당 값은 마지막 `hostBindings` 스타일링 지침을 포함한
   * `DirectiveDef`의 인덱스로 설정됩니다.
   *
   * 유효한 값:
   * - `-1`: `hostBindings` 지침이 실행되지 않았습니다.
   * - `directiveStart <= directiveStylingLast < directiveEnd`:
   *   `hostBindings`에서 실행된 마지막 스타일링 지침의
   *   `DirectiveDef`를 가리킵니다.
   *
   * 이 데이터는 스타일링 지침이 `DirectiveDef.hostAttrs`에서 어떤 정적 스타일링 데이터를 수집해야 하는지를 알기 위해 필요합니다.
   * 스타일링 지침은 마지막 스타일링 지침 이후에 모든 데이터를 수집해야 합니다.
   */
  directiveStylingLast: number;

  /**
   * 속성 바인딩의 인덱스를 저장합니다.
   * 이 필드는 ngDevMode에서만 설정되며,
   * 주어진 노드에 대해 바인딩된 속성 메타데이터를 검색할 수 있도록
   * 속성 바인딩의 인덱스를 보유합니다.
   */
  propertyBindings: number[] | null;

  /**
   * 노드가 Component인지, Projected인지, ContentQuery가 있는지,
   * ClassInput 및 StyleInput이 있는지 등의 정보를 저장합니다.
   */
  flags: TNodeFlags;

  /**
   * 이 숫자는 두 값을 비트로 저장합니다:
   *
   * - 해당 노드의 첫 번째 제공자의 인덱스 (첫 16비트)
   * - 이 노드에서 컴포넌트에서 뷰 제공자의 수 (마지막 16비트)
   */
  // TODO(misko): 실제 변수로 분해합니다.
  providerIndexes: TNodeProviderIndexes;

  /**
   * 이 노드와 관련된 값 이름입니다.
   * 유형이 다음 경우:
   *   `TNodeType.Text`: 텍스트 값
   *   `TNodeType.Element`: 태그 이름
   *   `TNodeType.ICUContainer`: `TIcu`
   */
  value: any;

  /**
   * 요소와 관련된 속성입니다. 다양한 사용 사례(속성 주입, 선택자가 있는 콘텐츠 프로젝션, 지시문 일치)를 지원하기 위해 속성을 저장해야 합니다.
   * 속성은 정적으로 저장됩니다. 왜냐하면 DOM에서 읽는 것은 콘텐츠 프로젝션과 쿼리에 대해 너무 느리기 때문입니다.
   *
   * attrs가 항상 먼저 계산되므로 다른 지침에 의해 정의되지 않아야 합니다.
   *
   * 일반적인 속성에 대해 속성의 이름과 값이 배열에서 번갈아 저장됩니다.
   * 예: ['role', 'checkbox']
   * 이 배열은 "특수 속성"을 나타내는 플래그를 포함할 수 있습니다
   * (네임스페이스가 있는 속성, 바인딩 및 출력에서 추출된 속성).
   */
  attrs: TAttributes | null;

  /**
   * `TNode.attrs`와 동일하지만,
   * 모든 지시문 호스트 바인딩의 병합된 데이터를 포함합니다.
   *
   * `attrs`는 선택자 속성을 위해 사용할 수 있도록 병합하지 않은 상태로 유지해야 합니다.
   * 여기에서 attrs를 병합하여 초기 렌더링을 위한 성능을 높일 수 있습니다.
   *
   * `attrs`는 다음 순서로 첫 번째 패스로 병합됩니다:
   * - 구성 요소의 `hostAttrs`
   * - 지시문의 `hostAttrs`
   * - 현재 `TNode`와 관련된 템플릿 `TNode.attrs`.
   */
  mergedAttrs: TAttributes | null;

  /**
   * 주어진 요소가 템플릿에서 내보내지며 쿼리에 노출되는 지역 이름의 집합입니다.
   * 이 배열의 항목은 여러 가지 이유로 생성될 수 있습니다:
   * - 요소 자체가 참조되는 경우, 예: `<div #foo>`
   * - 구성 요소가 참조되는 경우, 예: `<my-cmpt #foo>`
   * - 지시문이 참조되는 경우, 예: `<my-cmpt #foo="directiveExportAs">`.
   *
   * 주어진 요소는 서로 다른 로컬 이름을 가질 수 있으며, 이러한 이름은 지시문과 연관될 수 있습니다.
   * 우리는 짝수 인덱스에서 지역 이름을 저장하고 홀수 인덱스는 뷰에서의 지시문 인덱스를 위해 예약됩니다
   * (-1이면 연관된 지시문이 없습니다).
   *
   * 몇 가지 예:
   * - `<div #foo>` => `["foo", -1]`
   * - `<my-cmpt #foo>` => `["foo", myCmptIdx]`
   * - `<my-cmpt #foo #bar="directiveExportAs">` => `["foo", myCmptIdx, "bar", directiveIdx]`
   * - `<div #foo #bar="directiveExportAs">` => `["foo", -1, "bar", directiveIdx]`
   */
  localNames: (string | number)[] | null;

  /** 속성 데이터에서 한 번 설정해야 할 입력 속성에 대한 정보입니다. */
  initialInputs: InitialInputData | null;

  /**
   * 이 노드의 모든 지시문에 대한 입력 데이터입니다. `null`은 이 노드에 입력이 있는 지시문이 없음을 의미합니다.
   */
  inputs: NodeInputBindings | null;

  /**
   * 이 노드에 적용된 호스트 지시문에 대한 입력 데이터입니다.
   */
  hostDirectiveInputs: HostDirectiveInputs | null;

  /**
   * 이 노드의 모든 지시문에 대한 출력 데이터입니다. `null`은 이 노드에 출력이 있는 지시문이 없음을 의미합니다.
   */
  outputs: NodeOutputBindings | null;

  /**
   * 이 노드에 적용된 호스트 지시문에 대한 출력 데이터입니다.
   */
  hostDirectiveOutputs: HostDirectiveOutputs | null;

  /**
   * 노드에 적용된 지시문 클래스와 그 인덱스 간의 매핑입니다.
   */
  directiveToIndex: DirectiveIndexMap | null;

  /**
   * 이 노드에 연결된 TView입니다.
   *
   * 이 TNode가 템플릿이 있는 LContainer와 대응하는 경우(예: 구조적 지시문), 템플릿의 TView가 여기 저장됩니다.
   *
   * 이 TNode가 요소와 대응하는 경우, tView는 `null`이 됩니다.
   */
  tView: TView | null;

  /**
   * 다음 형제 노드입니다. 이를 통해 뷰의 루트 노드를 통과하여
   * DOM에 삽입하거나 제거할 수 있도록 합니다.
   */
  next: TNode | null;

  /**
   * 이전 형제 노드입니다.
   * 이를 통해 이전 노드에 대한 포인터를 가져오는 작업이 간소화됩니다.
   */
  prev: TNode | null;

  /**
   * 다음 프로젝션된 형제입니다. 앵귤러에서 콘텐츠 프로젝션은 노드 단위로 작동하므로
   * 노드의 프로젝션 행위는 삽입 지점(대상 뷰)에서 노드 관계를 변경할 수 있습니다.
   * 동시에 콘텐츠 뷰에서 표현된 노드 간의 초기 관계를 유지해야 합니다.
   */
  projectionNext: TNode | null;

  /**
   * 현재 노드의 첫 번째 자식입니다.
   *
   * 컴포넌트 노드의 경우, 자식은 항상 ContentChild(같은 뷰)입니다.
   * 임베디드 뷰 노드의 경우, 자식은 그들의 자식 뷰에 있습니다.
   */
  child: TNode | null;

  /**
   * 부모 노드 (동일한 뷰 내에서만).
   *
   * 노드를 올바른 시점에 부모의 네이티브 요소에 추가할 수 있도록
   * 노드의 부모에 대한 참조가 필요합니다.
   *
   * 부모가 다른 뷰에 있다면 (예: 컴포넌트 호스트), 이 속성은 null이 됩니다.
   * 부모를 가져오는 동안 컴포넌트 경계를 넘어가는 것을 피하는 것이 중요합니다.
   * 왜냐하면 부모는 컴포넌트를 사용하는 위치에 따라 변경될 수 있기 때문입니다.
   * 이러한 경우, 우리는 대신 LView.node를 통해 부모를 검색합니다
   * (이것은 인스턴스별임).
   *
   * 이것이 인라인 뷰 노드(V)인 경우, 부모는 그들의 컨테이너가 됩니다.
   */
  parent: TElementNode | TContainerNode | null;

  /**
   * 주어진 컴포넌트 호스트 요소에 대한 프로젝션된 TNode 목록 또는
   * 해당 노드에 대한 인덱스입니다.
   *
   * 더 쉽게 논의하기 위해 이 예시를 가정합니다:
   * `<parent>`의 뷰 정의:
   * ```html
   * <child id="c1">content1</child>
   * <child id="c2"><span>content2</span></child>
   * ```
   * `<child>`의 뷰 정의:
   * ```html
   * <ng-content id="cont1"></ng-content>
   * ```
   *
   * `Array.isArray(projection)`이면 `TNode`는 호스트 요소입니다:
   * - `projection`에는 투영될 콘텐츠 노드가 저장됩니다.
   *    - 노드는 선택자로 정의된 카테고리를 나타냅니다. 예를 들어:
   *      `<ng-content/><ng-content select="abc"/>`는 `<ng-content/>`
   *      및 `<ng-content select="abc"/>`에 대한 헤드를 나타냅니다.
   *    - `projection`에 저장되는 노드는 헤드만 포함됩니다.
   *    - 노드의 `.next`는 프로젝션 설정의 일환으로 정렬/재작성됩니다.
   *    - `projection` 크기는 `<ng-content>`의 수와 같습니다.
   *      `c1`의 크기는 `1`이 될 것입니다. 왜냐하면 `<child>`에는
   *      단 하나의 `<ng-content>`가 존재하기 때문입니다.
   * - 우리는 `<ng-content>`(`cont1`)가 아니라 호스트(`c1`, `c2`)와 함께
   *   `projection`을 저장합니다. 왜냐하면 동일한 컴포넌트(`<child>`)가
   *   여러 위치(`c1`, `c2`)에서 사용될 수 있고
   *   그 결과 서로 다른 프로젝션 노드 세트를 가질 수 있기 때문입니다.
   * - `projection`이 없으면 효율적으로 프로젝트할 노드를 탐색하기 어렵습니다.
   *
   * `typeof projection == 'number'`인 경우 `TNode`는 `<ng-content>` 요소입니다:
   * - `projection`은 호스트의 `projection` 노드의 인덱스입니다.
   *   - 이는 프로젝션할 첫 헤드 노드를 반환합니다:
   *     `getHost(currentTNode).projection[currentTNode.projection]`.
   * - 노드를 프로젝션할 때 검색된 부모 노드는
   *   `<ng-content>` 노드일 수 있으며, 이런 경우에는
   *   프로세스가 재귀적입니다.
   *
   * `projection`이 `RNode[][]` 유형인 경우
   * 동적으로 구성 요소 생성하는 동안 전달된 네이티브 노드의 집합입니다.
   */
  projection: (TNode | RNode[])[] | number | null;

  /**
   * 요소에 대한 모든 `style` 정적 값의 컬렉션입니다.
   * (호스트에서 포함됨).
   *
   * 이 필드는 다음과 같이 채워질 수 있습니다:
   *
   * - 요소에 하나 이상의 초기 `style`이 있는 경우
   *   (예: `<div style="width:200px;">`)
   * - 지시문/컴포넌트 호스트에 대한 초기 `style`이 하나 이상 있는 경우
   *   (예: `@Directive({host: {style: "width:200px;" } }`)
   */
  styles: string | null;

  /**
   * 요소에 대한 모든 `style` 정적 값의 컬렉션입니다.
   * 호스트 소스를 제외합니다.
   *
   * 요소에 하나 이상의 초기 `style`이 있는 경우
   * (예: `<div style="width:200px;">`) 채워집니다.
   * 지시문 입력을 설정하기 위해 호스트에서 `style` 속성을 가려야 하므로
   * `tNode.styles`와 개별적으로 저장해야 합니다.
   * 만약 그렇지 않으면, 매번 템플릿 패스에서 `tNode.attrs`를 사용해야 했을 것입니다.
   * 대신, 우리는 첫 번째 생성 패스에서 한 번 처리하고 여기에 저장합니다.
   */
  stylesWithoutHost: string | null;

  /**
   * 잔여 `styles`의 `KeyValueArray` 버전입니다.
   *
   * 스타일링 지침이 있을 경우 각 명령문은
   * 그것보다 낮은 우선순위의 정적 스타일링을 저장합니다.
   * 이는 지침보다 높은 우선 순위의 스타일링이 있을 수 있음을 의미합니다.
   *
   * 상상해 보세요:
   * ```angular-ts
   * <div style="color: highest;" my-dir>
   *
   * @Directive({
   *   host: {
   *     style: 'color: lowest; ',
   *     '[styles.color]': 'exp' // ɵɵstyleProp('color', ctx.exp);
   *   }
   * })
   * ```
   *
   * 위의 경우:
   * - `color: lowest`는 `ɵɵstyleProp('color', ctx.exp);` 지침과 함께 저장됩니다.
   * -  `color: highest`는 잔여용으로 여기 저장됩니다.
   *
   * - `undefined': 초기화되지 않음.
   * - `null`: 초기화되었으나 `styles`는 `null`입니다.
   * - `KeyValueArray`: 구문 분석된 `styles`의 버전입니다.
   */
  residualStyles: KeyValueArray<any> | undefined | null;

  /**
   * 요소에 대한 모든 클래스 정적 값의 컬렉션입니다.
   * (호스트에서 포함됨).
   *
   * 이 필드는 다음과 같이 채워질 수 있습니다:
   *
   * - 요소에 하나 이상의 초기 클래스가 있는 경우
   *   (예: `<div class="one two three">`)
   * - 지시문/컴포넌트 호스트에 대한 초기 클래스가 하나 이상 있는 경우
   *   (예: `@Directive({host: {class: "SOME_CLASS" } }`)
   */
  classes: string | null;

  /**
   * 요소에 대한 모든 클래스 정적 값의 컬렉션입니다.
   * 호스트 소스를 제외합니다.
   *
   * 요소에 하나 이상의 초기 클래스가 있는 경우
   * (예: `<div class="SOME_CLASS">`) 채워집니다.
   * 지시문 입력을 설정하기 위해 호스트에서 `classes` 속성을 가려야 하므로
   * `tNode.classes`와 개별적으로 저장해야 합니다.
   * 만약 그렇지 않으면, 매번 템플릿 패스에서 `tNode.classes`를 사용해야 했을 것입니다.
   * 대신, 우리는 첫 번째 생성 패스에서 한 번 처리하고 여기에 저장합니다.
   */
  classesWithoutHost: string | null;

  /**
   * 잔여 `classes`의 `KeyValueArray` 버전입니다.
   *
   * `TNode.residualStyles`와 동일하지만 클래스에 적용됩니다.
   *
   * - `undefined': 초기화되지 않음.
   * - `null`: 초기화되었으나 `classes`는 `null`입니다.
   * - `KeyValueArray`: 구문 분석된 `classes`의 버전입니다.
   */
  residualClasses: KeyValueArray<any> | undefined | null;

  /**
   * 클래스 바인딩의 헤드/테일 인덱스를 저장합니다.
   *
   * - 바인딩이 없으면 헤드와 테일이 모두 0이 됩니다.
   * - 템플릿 바인딩이 있는 경우, 템플릿 내 클래스 바인딩의 헤드/테일을 저장합니다.
   * - 템플릿 바인딩이 없지만 호스트 바인딩이 있는 경우,
   *   헤드 값은 "class"에 대한 마지막 호스트 바인딩을 가리키며
   *   (연결 목록의 헤드가 아닌), 테일은 0이 됩니다.
   *
   * 세부 정보는 `style_binding_list.ts`를 참조하세요.
   *
   * 이는 `insertTStylingBinding`가 다음 스타일링 바인딩이
   * 어디에 삽입되어야 하는지 알 수 있도록 사용하는 데 필요합니다.
   */
  classBindings: TStylingRange;

  /**
   * 스타일 바인딩의 헤드/테일 인덱스를 저장합니다.
   *
   * - 바인딩이 없으면 헤드와 테일이 모두 0이 됩니다.
   * - 템플릿 바인딩이 있는 경우, 템플릿 내 스타일 바인딩의 헤드/테일을 저장합니다.
   * - 템플릿 바인딩이 없지만 호스트 바인딩이 있는 경우,
   *   헤드 값은 "style"에 대한 마지막 호스트 바인딩을 가리키며
   *   (연결 목록의 헤드가 아닌), 테일은 0이 됩니다.
   *
   * 세부 정보는 `style_binding_list.ts`를 참조하세요.
   *
   * 이는 `insertTStylingBinding`가 다음 스타일링 바인딩이
   * 어디에 삽입되어야 하는지 알 수 있도록 사용하는 데 필요합니다.
   */
  styleBindings: TStylingRange;
}

/**
 * `TNode.insertBeforeIndex`를 참조합니다.
 */
export type InsertBeforeIndex = null | number | number[];

/** 요소에 대한 정적 데이터  */
export interface TElementNode extends TNode {
  /** 데이터[] 배열의 인덱스 */
  index: number;
  child: TElementNode | TTextNode | TElementContainerNode | TContainerNode | TProjectionNode | null;
  /**
   * 요소 노드는 부모를 가지며, 부모가 컴포넌트의 첫 번째 노드이거나
   * 임베디드 뷰인 경우(부모가 다른 뷰에 있고
   * viewData[HOST_NODE]를 사용하여 검색해야 함).
   */
  parent: TElementNode | TElementContainerNode | null;
  tView: null;

  /**
   * 이 TNode가 프로젝션이 있는 경우,
   * 이는 프로젝션된 TNode 또는 네이티브 노드의 배열입니다
   * (자세한 사항은 TNode.projection 참조).
   * 일반 요소 노드이거나 프로젝션이 없는 컴포넌트이면,
   * null이 됩니다.
   */
  projection: (TNode | RNode[])[] | null;

  /**
   * 태그 이름을 저장합니다.
   */
  value: string;
}

/** 텍스트 노드에 대한 정적 데이터 */
export interface TTextNode extends TNode {
  /** 데이터[] 배열의 인덱스 */
  index: number;
  child: null;
  /**
   * 텍스트 노드는 부모를 가지며,
   * 부모가 컴포넌트의 첫 번째 노드이거나
   * 임베디드 뷰인 경우에는 (부모가 다른 뷰에 있고
   * LView.node를 사용하여 검색해야 함).
   */
  parent: TElementNode | TElementContainerNode | null;
  tView: null;
  projection: null;
}

/** LContainer에 대한 정적 데이터 */
export interface TContainerNode extends TNode {
  /**
   * 데이터[] 배열의 인덱스입니다.
   *
   * -1이면 이는 동적으로 생성된 컨테이너 노드이며
   * 데이터[]에 저장되지 않습니다 (예: ViewContainerRef를 주입할 때).
   */
  index: number;
  child: null;

  /**
   * 컨테이너 노드는 부모를 가지며,
   * 부모가 다음과 같은 경우에는:
   *
   * - 컴포넌트의 첫 번째 노드이거나 임베디드 뷰인 경우
   * - 동적으로 생성된 경우
   */
  parent: TElementNode | TElementContainerNode | null;
  tView: TView | null;
  projection: null;
  value: null;
}

/** <ng-container>에 대한 정적 데이터 */
export interface TElementContainerNode extends TNode {
  /** LView[] 배열의 인덱스입니다. */
  index: number;
  child: TElementNode | TTextNode | TContainerNode | TElementContainerNode | TProjectionNode | null;
  parent: TElementNode | TElementContainerNode | null;
  tView: null;
  projection: null;
}

/** ICU 표현식에 대한 정적 데이터 */
export interface TIcuContainerNode extends TNode {
  /** LView[] 배열의 인덱스입니다. */
  index: number;
  child: null;
  parent: TElementNode | TElementContainerNode | null;
  tView: null;
  projection: null;
  value: TIcu;
}

/** LProjectionNode에 대한 정적 데이터  */
export interface TProjectionNode extends TNode {
  /** 데이터[] 배열의 인덱스 */
  child: null;
  /**
   * 프로젝션 노드는 부모를 가지며,
   * 부모가 컴포넌트의 첫 번째 노드이거나
   * 임베디드 뷰인 경우(부모가 다른 뷰에 있고
   * LView.node를 사용하여 검색해야 함).
   */
  parent: TElementNode | TElementContainerNode | null;
  tView: null;

  /** 프로젝션 노드의 인덱스입니다. (자세한 사항은 TNode.projection 참조) */
  projection: number;
  value: null;
}

/**
 * `@let` 선언에 대한 정적 데이터. 이 노드는 필요합니다.
 * `@let` 선언의 표현식이 노드 주입기를 사용할 수 있는 코드를 포함할 수 있기 때문입니다.
 * 노드 주입기가 작동하기 위해서는 이 `TNode`가 필요합니다.
 */
export interface TLetDeclarationNode extends TNode {
  index: number;
  child: null;
  parent: TElementNode | TElementContainerNode | null;
  tView: null;
  projection: null;
  value: null; // TODO(crisbeto): 여기에서 이름을 캡처할 수 있을까요? 개발 도구에 유용할 수 있습니다.
}

/**
 * 디렉티브를 호스트할 수 있는 모든 TNode 유형을 나타내는 유니온 유형입니다.
 */
export type TDirectiveHostNode = TElementNode | TContainerNode | TElementContainerNode;

/**
 * 특정 노드에서 사용할 수 있는 출력을 공용 이름으로 매핑하여
 * 출력을 정의하는 지시문 인스턴스의 인덱스를 찾습니다. 예를 들어:
 *
 * ```
 * {
 *   "publicName": [0, 5]
 * }
 * ```
 */
export type NodeOutputBindings = Record<string, number[]>;

/**
 * 특정 노드에 적용된 입력의 공용 이름을 지시문 인스턴스의
 * 인덱스에 매핑하는 방식입니다. 예를 들어:
 *
 * ```
 * {
 *   "publicName": [0, 5]
 * }
 * ```
 */
export type NodeInputBindings = Record<string, number[]>;

/**
 * 이 배열은 속성 데이터에서 한 번 설정해야 할 입력 속성에 대한 정보를 포함합니다.
 * 지시문 인덱스에 따라 정렬되어 있어 특정 지시문의 초기 입력 데이터를 쉽게 조회할 수 있습니다.
 *
 * 각 서브 배열 내:
 *
 * i+0: 공용 이름
 * i+1: 초기 값
 *
 * 노드의 지시문에 속성에서 설정해야 하는 입력 속성이 없으면,
 * 해당 인덱스는 null로 설정되어 희소 배열을 방지합니다.
 *
 * 예: [null, ['role-min', 'minified-input', 'button']]
 */
export type InitialInputData = (InitialInputs | null)[];

/**
 * InitialInputData에 의해 속성에서 한 번 설정해야 하는
 * 입력 속성을 저장하는 데 사용됩니다.
 *
 * i+0: 속성 이름
 * i+1: 축소/내부 입력 이름
 * i+2: 입력 플래그
 * i+3: 초기 값
 *
 * 예: ['role-min', 'minified-input', 'button']
 */
export type InitialInputs = string[];

/**
 * 호스트 지시문에서 오는 입력을 나타내며 TNode에 노출됩니다.
 *
 * - 키는 특정 노드에 노출된 입력의 공용 이름입니다.
 * - 값은 다음과 같은 배열입니다:
 *   - i+0: 쓰기 위한 호스트 지시문 인덱스.
 *   - i+1: 노출된 입력의 공용 이름은 호스트 지시문에서 별칭을 지정한 것입니다.
 */
export type HostDirectiveInputs = Record<string, (number | string)[]>;

/**
 * 호스트 지시문에서 오는 출력을 나타내며 TNode에 노출됩니다.
 *
 * - 키는 특정 노드에 노출된 출력의 공용 이름입니다.
 * - 값은 다음과 같은 배열입니다:
 *   - i+0: 출력이 정의된 호스트 지시문의 인덱스.
 *   - i+1: 호스트 지시문에서 별칭을 지정하기 전의 출력의 공용 이름입니다.
 */
export type HostDirectiveOutputs = Record<string, (number | string)[]>;

/**
 * TNode에서 호스트 지시문이 있는 지시문 클래스와 그 인덱스 간의 매핑을 나타냅니다.
 * 값은 다음과 같을 수 있습니다:
 * 1. 숫자는 노드에 하나의 선택기와 일치하는 지시문이 있으며,
 *    호스트 지시문이 없음을 나타냅니다.
 * 2. 배열은 선택기와 일치하는 지시문이 있으며,
 *    호스트 지시문이 있습니다. 배열 구조는 다음과 같습니다:
 *      - 0: 선택기와 일치하는 지시문의 인덱스.
 *      - 1: 호스트 지시문이 정의된 범위 내의 시작 인덱스.
 *      - 2: 호스트 지시문 범위의 종료 지점.
 *
 * 예:
 * ```
 * Map {
 *   [NoHostDirectives]: 5,
 *   [HasHostDirectives]: [10, 6, 8],
 * }
 * ```
 */
export type DirectiveIndexMap = Map<
  Type<unknown>,
  number | [directiveIndex: number, hostDirectivesStart: number, hostDirectivesEnd: number]
>;

/**
 * 지역 레퍼런스가 배치될 수 있는 TNode 집합을 나타내는 유형입니다.
 */
export type TNodeWithLocalRefs = TContainerNode | TElementNode | TElementContainerNode;

/**
 * 지역 레퍼런스를 위한 값을 추출하는 함수 유형입니다.
 * 예시:
 * - `<div #nativeDivEl>` - `nativeDivEl`은 네이티브 `<div>` 요소를 가리켜야 합니다.
 * - `<ng-template #tplRef>` - `tplRef`는 `TemplateRef` 인스턴스를 가리켜야 합니다.
 */
export type LocalRefExtractor = (tNode: TNodeWithLocalRefs, currentView: LView) => any;

/**
 * `TNode`에 `class` 바인딩을 위한 `@Input()`을 가진 지시문이 있는지
 * 확인하고 `true`를 반환합니다.
 *
 * ```html
 * <div my-dir [class]="exp"></div>
 * ```
 * 그리고
 * ```ts
 * @Directive({
 * })
 * class MyDirective {
 *   @Input()
 *   class: string;
 * }
 * ```
 *
 * 위의 경우, 조정된 스타일링 정보를 지시문의 입력으로 작성하는 것이 필요합니다.
 *
 * @param tNode
 */
export function hasClassInput(tNode: TNode) {
  return (tNode.flags & TNodeFlags.hasClassInput) !== 0;
}

/**
 * `TNode`에 `style` 바인딩을 위한 `@Input()`을 가진 지시문이 있는지
 * 확인하고 `true`를 반환합니다.
 *
 * ```html
 * <div my-dir [style]="exp"></div>
 * ```
 * 그리고
 * ```ts
 * @Directive({
 * })
 * class MyDirective {
 *   @Input()
 *   class: string;
 * }
 * ```
 *
 * 위의 경우, 조정된 스타일링 정보를 지시문의 입력으로 작성하는 것이 필요합니다.
 *
 * @param tNode
 */
export function hasStyleInput(tNode: TNode) {
  return (tNode.flags & TNodeFlags.hasStyleInput) !== 0;
}
