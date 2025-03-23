/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

// i18nPostprocess 상수
const ROOT_TEMPLATE_ID = 0;
const PP_MULTI_VALUE_PLACEHOLDERS_REGEXP = /\[(�.+?�?)\]/;
const PP_PLACEHOLDERS_REGEXP = /\[(�.+?�?)\]|(�\/?\*\d+:\d+�)/g;
const PP_ICU_VARS_REGEXP = /({\s*)(VAR_(PLURAL|SELECT)(_\d+)?)(\s*,)/g;
const PP_ICU_PLACEHOLDERS_REGEXP = /{([A-Z0-9_]+)}/g;
const PP_ICUS_REGEXP = /�I18N_EXP_(ICU(_\d+)?)�/g;
const PP_CLOSE_TEMPLATE_REGEXP = /\/\*/;
const PP_TEMPLATE_ID_REGEXP = /\d+\:(\d+)/;

// 후처리에 사용되는 구문 분석된 자리 표시자 구조 (i18nPostprocess 함수 내)
// 다음 필드를 포함합니다: [templateId, isCloseTemplateTag, placeholder]
type PostprocessPlaceholder = [number, boolean, string];

/**
 * 국제화를 위한 메시지 문자열 후처리를 처리합니다.
 *
 * 후처리는 중간 형식 (교체해야 할 일부 마커가 포함될 수 있음)에서 최종 형식으로 변환하여
 * i18nStart 명령에서 사용할 수 있도록 합니다. 후처리 단계는 다음을 포함합니다:
 *
 * 1. 모든 다중 값 사례 해결 (예: [�*1:1��#2:1�|�#4:1�|�5�])
 * 2. 모든 ICU 변수 교체 (예: "VAR_PLURAL")
 * 3. {PLACEHOLDER} 형식으로 ICU 내부에서 사용되는 모든 자리 표시자 교체
 * 4. 여러 ICU가 동일한 자리 표시자 이름을 가질 경우 대응하는 값으로 모든 ICU 참조 교체
 *
 * @param message 후처리를 위한 원시 번역 문자열
 * @param replacements 적용해야 할 교체 집합
 *
 * @returns i18nStart 명령에서 사용할 수 있는 변환된 문자열
 *
 * @codeGenApi
 */
export function i18nPostprocess(
  message: string,
  replacements: {[key: string]: string | string[]} = {},
): string {
  /**
   * 단계 1: [�#5�|�*1:1��#2:1�|�#4:1�]와 같은 모든 다중 값 자리 표시자를 해결합니다.
   *
   * 주의: 중첩 템플릿을 처리하는 방식 (BFS)으로 인해, 다중 값 자리 표시자는 일반적으로
   * 템플릿별로 그룹화됩니다. 예: [�#5�|�#6�|�#1:1�|�#3:2�] 에서 �#5�와 �#6�는 루트
   * 템플릿에 속하고, �#1:1�은 인덱스 1의 중첩 템플릿에 속하며, �#1:2�는 인덱스
   * 3의 중첩 템플릿에 속합니다. 그러나 실제 템플릿에서는 순서가 다를 수 있습니다:
   * 즉, �#1:1� 및/or �#3:2�가 �#6� 앞에 올 수 있습니다. 후처리 단계는
   * 템플릿 id 스택을 추적하여 현재 활성 템플릿에 속하는 자리 표시자를 찾습니다.
   */
  let result: string = message;
  if (PP_MULTI_VALUE_PLACEHOLDERS_REGEXP.test(message)) {
    const matches: {[key: string]: PostprocessPlaceholder[]} = {};
    const templateIdsStack: number[] = [ROOT_TEMPLATE_ID];
    result = result.replace(PP_PLACEHOLDERS_REGEXP, (m: any, phs: string, tmpl: string): string => {
      const content = phs || tmpl;
      const placeholders: PostprocessPlaceholder[] = matches[content] || [];
      if (!placeholders.length) {
        content.split('|').forEach((placeholder: string) => {
          const match = placeholder.match(PP_TEMPLATE_ID_REGEXP);
          const templateId = match ? parseInt(match[1], 10) : ROOT_TEMPLATE_ID;
          const isCloseTemplateTag = PP_CLOSE_TEMPLATE_REGEXP.test(placeholder);
          placeholders.push([templateId, isCloseTemplateTag, placeholder]);
        });
        matches[content] = placeholders;
      }

      if (!placeholders.length) {
        throw new Error(`i18n postprocess: unmatched placeholder - ${content}`);
      }

      const currentTemplateId = templateIdsStack[templateIdsStack.length - 1];
      let idx = 0;
      // 현재 템플릿 id와 일치하는 자리 표시자 인덱스를 찾습니다.
      for (let i = 0; i < placeholders.length; i++) {
        if (placeholders[i][0] === currentTemplateId) {
          idx = i;
          break;
        }
      }
      // 추출된 현재 태그에 따라 템플릿 id 스택을 업데이트합니다.
      const [templateId, isCloseTemplateTag, placeholder] = placeholders[idx];
      if (isCloseTemplateTag) {
        templateIdsStack.pop();
      } else if (currentTemplateId !== templateId) {
        templateIdsStack.push(templateId);
      }
      // 처리된 태그를 목록에서 제거합니다.
      placeholders.splice(idx, 1);
      return placeholder;
    });
  }

  // 교체가 지정되지 않은 경우 현재 결과를 반환합니다.
  if (!Object.keys(replacements).length) {
    return result;
  }

  /**
   * 단계 2: 모든 ICU 변수 (예: "VAR_PLURAL")를 교체합니다.
   */
  result = result.replace(PP_ICU_VARS_REGEXP, (match, start, key, _type, _idx, end): string => {
    return replacements.hasOwnProperty(key) ? `${start}${replacements[key]}${end}` : match;
  });

  /**
   * 단계 3: {PLACEHOLDER} 형식으로 ICU 내부에서 사용되는 모든 자리 표시자를 교체합니다.
   */
  result = result.replace(PP_ICU_PLACEHOLDERS_REGEXP, (match, key): string => {
    return replacements.hasOwnProperty(key) ? (replacements[key] as string) : match;
  });

  /**
   * 단계 4: 여러 ICU가 동일한 자리 표시자 이름을 가질 경우 대응하는 값으로 모든 ICU 참조를 교체합니다.
   */
  result = result.replace(PP_ICUS_REGEXP, (match, key): string => {
    if (replacements.hasOwnProperty(key)) {
      const list = replacements[key] as string[];
      if (!list.length) {
        throw new Error(`i18n postprocess: unmatched ICU - ${match} with key: ${key}`);
      }
      return list.shift()!;
    }
    return match;
  });

  return result;
}
