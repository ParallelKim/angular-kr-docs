/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {CharCode} from '../../util/char_code';
import {AttributeMarker} from '../interfaces/attribute_marker';
import {TAttributes} from '../interfaces/node';
import {CssSelector} from '../interfaces/projection';
import {Renderer} from '../interfaces/renderer';
import {RElement} from '../interfaces/renderer_dom';

/**
 * 추론된 렌더러를 통해 제공된 요소에 모든 속성 값을 할당합니다.
 *
 * 이 함수는 두 가지 형태의 속성 항목을 허용합니다:
 *
 * 기본: (key, value):
 *  attrs = [key1, value1, key2, value2]
 *
 * 네임스페이스: (NAMESPACE_MARKER, uri, name, value)
 *  attrs = [NAMESPACE_MARKER, uri, name, value, NAMESPACE_MARKER, uri, name, value]
 *
 * `attrs` 배열은 기본 항목과 네임스페이스 항목의 혼합을 포함할 수 있습니다.
 * "기본" 값은 마커 없이 설정되지만, 함수가 마커 값을 만나면 네임스페이스 값을 설정하려고 시도합니다.
 * 마커가 네임스페이스 값이 아닌 경우 함수는 종료되고 attrs 배열의 반복 중에 중지된 인덱스 값을 반환합니다.
 *
 * 네임스페이스 마커 값이 무엇인지 이해하려면 [AttributeMarker]를 참조하세요.
 *
 * 이 명령은 요소에 스타일 및 클래스 값을 할당하는 것을 지원하지 않습니다.
 * 요소에 스타일링 값이 적용되는 방법을 배우려면 `elementStart` 및 `elementHostAttrs`를 참조하세요.
 * @param renderer 사용될 렌더러
 * @param native 속성이 할당될 요소
 * @param attrs 요소에 할당될 값의 속성 배열
 * @returns 속성 배열에서 마지막으로 접근한 인덱스 값
 */
export function setUpAttributes(renderer: Renderer, native: RElement, attrs: TAttributes): number {
  let i = 0;
  while (i < attrs.length) {
    const value = attrs[i];
    if (typeof value === 'number') {
      // 네임스페이스만 지원됩니다. 다른 값 유형(스타일/클래스 항목 등)은 이 함수에서 지원되지 않습니다.
      if (value !== AttributeMarker.NamespaceURI) {
        break;
      }

      // 우리는 방금 마커 값에 도달했습니다 ... 따라서
      // 다음 항목으로 건너뛰어야 합니다.
      i++;

      const namespaceURI = attrs[i++] as string;
      const attrName = attrs[i++] as string;
      const attrVal = attrs[i++] as string;
      renderer.setAttribute(native, attrName, attrVal, namespaceURI);
    } else {
      // attrName은 문자열입니다;
      const attrName = value as string;
      const attrVal = attrs[++i];
      // 표준 속성
      if (isAnimationProp(attrName)) {
        renderer.setProperty(native, attrName, attrVal);
      } else {
        renderer.setAttribute(native, attrName, attrVal as string);
      }
      i++;
    }
  }

  // 다른 코드 조각이 같은 속성 배열을 반복할 수 있습니다. 따라서
  // 속성 배열이 지원되지 않는 마커에 도달하거나 모든 정적 값이
  // 반복되었는지 여부에 따라 정확한 위치를 반환하는 것이 도움이 될 수 있습니다.
  return i;
}

/**
 * 주어진 값이 `TAttributes` 배열에서 다음 속성 값이 이름-값 쌍이 아닌
 * 속성 이름만 있는지를 나타내는 마커인지 테스트합니다.
 * @param marker 테스트할 속성 마커.
 * @returns 마커가 "이름 전용" 마커(예: `Bindings`, `Template` 또는 `I18n`)인 경우 true를 반환합니다.
 */
export function isNameOnlyAttributeMarker(marker: string | AttributeMarker | CssSelector) {
  return (
    marker === AttributeMarker.Bindings ||
    marker === AttributeMarker.Template ||
    marker === AttributeMarker.I18n
  );
}

export function isAnimationProp(name: string): boolean {
  // 성능 메모: 문자열의 첫 번째 문자를 확인하기 위해 charCodeAt 접근하는 것이
  // 인덱스 0 (예: name[0])의 문자가 수확하는 것보다 빠릅니다. 그 주요 이유는
  // charCodeAt이 하위 문자열을 반환하는 데 메모리를 할당하지 않기 때문입니다.
  return name.charCodeAt(0) === CharCode.AT_SIGN;
}

/**
 * `src` `TAttributes`를 `dst` `TAttributes`로 병합하면서 중복 항목을 제거합니다.
 *
 * 이 병합 함수는 attrs의 순서를 동일하게 유지합니다.
 *
 * @param dst 병합된 `TAttributes`가 위치할 곳.
 * @param src `dst`에 추가해야 할 `TAttributes`
 */
export function mergeHostAttrs(
  dst: TAttributes | null,
  src: TAttributes | null,
): TAttributes | null {
  if (src === null || src.length === 0) {
    // 아무것도 하지 않음
  } else if (dst === null || dst.length === 0) {
    // 소스가 있지만 dst가 비어 있으므로 복사합니다.
    dst = src.slice();
  } else {
    let srcMarker: AttributeMarker = AttributeMarker.ImplicitAttributes;
    for (let i = 0; i < src.length; i++) {
      const item = src[i];
      if (typeof item === 'number') {
        srcMarker = item;
      } else {
        if (srcMarker === AttributeMarker.NamespaceURI) {
          // `key1`, `key2`, `value` 항목을 소비해야 하는 경우.
        } else if (
          srcMarker === AttributeMarker.ImplicitAttributes ||
          srcMarker === AttributeMarker.Styles
        ) {
          // `key1`과 `value`만 소비해야 하는 경우.
          mergeHostAttribute(dst, srcMarker, item as string, null, src[++i] as string);
        } else {
          // `key1`만 소비해야 하는 경우.
          mergeHostAttribute(dst, srcMarker, item as string, null, null);
        }
      }
    }
  }
  return dst;
}

/**
 * 기존 `TAttributes`에 `key`/`value`를 추가하면서 지역 마커와 중복을 고려합니다.
 *
 * @param dst 추가할 `TAttributes`.
 * @param marker `key`/`value`가 추가될 지역.
 * @param key1 `TAttributes`에 추가할 키.
 * @param key2 `TAttributes`에 추가할 키(`AttributeMarker.NamespaceURI`의 경우).
 * @param value `TAttributes`에 추가하거나 덮어쓸 값. `marker`가 Class가 아닌 경우에만 사용됩니다.
 */
export function mergeHostAttribute(
  dst: TAttributes,
  marker: AttributeMarker,
  key1: string,
  key2: string | null,
  value: string | null,
): void {
  let i = 0;
  // 새로운 마커가 끝에 삽입될 것으로 가정합니다.
  let markerInsertPosition = dst.length;
  // 올바른 유형까지 스캔합니다.
  if (marker === AttributeMarker.ImplicitAttributes) {
    markerInsertPosition = -1;
  } else {
    while (i < dst.length) {
      const dstValue = dst[i++];
      if (typeof dstValue === 'number') {
        if (dstValue === marker) {
          markerInsertPosition = -1;
          break;
        } else if (dstValue > marker) {
          // 특정 순서로 마커를 삽입하기 위해 이 값을 저장해야 합니다.
          markerInsertPosition = i - 1;
          break;
        }
      }
    }
  }

  // 삽입할 위치를 찾을 때까지 검색합니다.
  while (i < dst.length) {
    const item = dst[i];
    if (typeof item === 'number') {
      // `i`가 마커 이후의 인덱스에서 시작되었기 때문에
      // 다음 마커에 도달하면 찾지 못한 것입니다.
      break;
    } else if (item === key1) {
      // 이미 같은 토큰을 가지고 있습니다.
      if (key2 === null) {
        if (value !== null) {
          dst[i + 1] = value;
        }
        return;
      } else if (key2 === dst[i + 1]) {
        dst[i + 2] = value!;
        return;
      }
    }
    // 카운터를 증가시킵니다.
    i++;
    if (key2 !== null) i++;
    if (value !== null) i++;
  }

  // 위치에 삽입합니다.
  if (markerInsertPosition !== -1) {
    dst.splice(markerInsertPosition, 0, marker);
    i = markerInsertPosition + 1;
  }
  dst.splice(i++, 0, key1);
  if (key2 !== null) {
    dst.splice(i++, 0, key2);
  }
  if (value !== null) {
    dst.splice(i++, 0, value);
  }
}
