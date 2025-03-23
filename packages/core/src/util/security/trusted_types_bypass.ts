/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * @fileoverview
 * Angular 내부에서 Trusted Types 정책을 활용하기 위한 모듈로,
 * 특히 bypassSecurityTrust* 및 사용자 정의 세정기를 위한 것입니다. 이를 통해
 * Trusted Types 정책을 지연 생성하며, 문자열을 Trusted Types로
 * 변환하는 데 유용한 도우미 유틸리티를 제공합니다. Trusted Types가
 * 사용 가능한 경우, 문자열은 대체로 사용됩니다.
 * @security 이 모듈의 모든 사용은 보안에 민감하며 보안 검토를 거쳐야 합니다.
 */

import {global} from '../global';
import {
  TrustedHTML,
  TrustedScript,
  TrustedScriptURL,
  TrustedTypePolicy,
  TrustedTypePolicyFactory,
} from './trusted_type_defs';

/**
 * Trusted Types 정책 또는 Trusted Types가
 * 활성화되어 있지 않거나 지원되지 않는 경우 null, 또는 정책이 아직
 * 생성되지 않은 경우 undefined입니다.
 */
let policy: TrustedTypePolicy | null | undefined;

/**
 * Trusted Types 정책을 반환하거나 Trusted Types가
 * 활성화되지 않거나 지원되지 않는 경우 null을 반환합니다. 이 함수의 첫 번째 호출은
 * 정책을 생성합니다.
 */
function getPolicy(): TrustedTypePolicy | null {
  if (policy === undefined) {
    policy = null;
    if (global.trustedTypes) {
      try {
        policy = (global.trustedTypes as TrustedTypePolicyFactory).createPolicy(
          'angular#unsafe-bypass',
          {
            createHTML: (s: string) => s,
            createScript: (s: string) => s,
            createScriptURL: (s: string) => s,
          },
        );
      } catch {
        // trustedTypes.createPolicy는 이미 등록된 이름으로 호출될 경우
        // 예외를 발생시킵니다. API가 변경될 때까지,
        // 애플리케이션 기능이 손상되지 않도록 오류를 포착합니다. 이러한 경우,
        // 코드는 문자열 사용으로 대체됩니다.
      }
    }
  }
  return policy;
}

/**
 * Trusted HTML로 문자열을 안전하게 프로모션하지만,
 * Trusted Types가 사용 가능하지 않은 경우 문자열을 대체로 사용합니다.
 * @security 이 함수는 보안에 민감하며, 이 함수를 사용하는 모든 경우
 * 보안 검토를 거쳐야 합니다. 특히, 사용자 정의 세정기 또는
 * bypassSecurityTrust* 함수에서 직접 오는 문자열만 전달되도록 해야 합니다.
 */
export function trustedHTMLFromStringBypass(html: string): TrustedHTML | string {
  return getPolicy()?.createHTML(html) || html;
}

/**
 * Trusted Script로 문자열을 안전하게 프로모션하지만,
 * Trusted Types가 사용 가능하지 않은 경우 문자열을 대체로 사용합니다.
 * @security 이 함수는 보안에 민감하며, 이 함수를 사용하는 모든 경우
 * 보안 검토를 거쳐야 합니다. 특히, 사용자 정의 세정기 또는
 * bypassSecurityTrust* 함수에서 직접 오는 문자열만 전달되도록 해야 합니다.
 */
export function trustedScriptFromStringBypass(script: string): TrustedScript | string {
  return getPolicy()?.createScript(script) || script;
}

/**
 * Trusted ScriptURL로 문자열을 안전하게 프로모션하지만,
 * Trusted Types가 사용 가능하지 않은 경우 문자열을 대체로 사용합니다.
 * @security 이 함수는 보안에 민감하며, 이 함수를 사용하는 모든 경우
 * 보안 검토를 거쳐야 합니다. 특히, 사용자 정의 세정기 또는
 * bypassSecurityTrust* 함수에서 직접 오는 문자열만 전달되도록 해야 합니다.
 */
export function trustedScriptURLFromStringBypass(url: string): TrustedScriptURL | string {
  return getPolicy()?.createScriptURL(url) || url;
}
