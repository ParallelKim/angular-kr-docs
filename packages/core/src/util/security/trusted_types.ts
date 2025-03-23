/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * @fileoverview
 * Angular 내부에서 Trusted Types 정책을 사용하기 쉽게 해주는 모듈입니다.
 * Trusted Types 정책을 지연 생성하며, 문자열을 Trusted Types로 승격시키기 위한 도우미
 * 유틸리티를 제공합니다. Trusted Types를 사용할 수 없는 경우 문자열이 폴백으로 사용됩니다.
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
 * Trusted Types 정책을 나타내며, Trusted Types가
 * 활성화/지원되지 않는 경우 null, 정책이 아직 생성되지 않은 경우 undefined입니다.
 */
let policy: TrustedTypePolicy | null | undefined;

/**
 * Trusted Types 정책을 반환하며, Trusted Types가
 * 활성화/지원되지 않는 경우 null을 반환합니다. 이 함수의 첫 번째 호출은 정책을 생성합니다.
 */
function getPolicy(): TrustedTypePolicy | null {
  if (policy === undefined) {
    policy = null;
    if (global.trustedTypes) {
      try {
        policy = (global.trustedTypes as TrustedTypePolicyFactory).createPolicy('angular', {
          createHTML: (s: string) => s,
          createScript: (s: string) => s,
          createScriptURL: (s: string) => s,
        });
      } catch {
        // trustedTypes.createPolicy는 이미 등록된 이름으로 호출할 경우
        // 예외를 발생합니다. API가 변경될 때까지, 애플리케이션이
        // 기능적으로 중단되지 않도록 예외를 잡습니다. 이런 경우,
        // 코드는 문자열을 사용하는 것으로 떨어집니다.
      }
    }
  }
  return policy;
}

/**
 * 문자열을 TrustedHTML로 안전하지 않게 승격시키며,
 * Trusted Types가 사용할 수 없는 경우 문자열로 폴백합니다.
 * @security 이 함수는 보안에 민감한 함수입니다; 이 함수를 사용하는 모든
 * 경우에는 보안 검토를 거쳐야 합니다. 특히, 제공된 문자열이
 * 브라우저에 의해 HTML로 해석되는 컨텍스트에서 사용될 경우 XSS
 * 취약점을 유발하지 않도록 보장해야 합니다. 예: element.innerHTML에 할당할 경우.
 */
export function trustedHTMLFromString(html: string): TrustedHTML | string {
  return getPolicy()?.createHTML(html) || html;
}

/**
 * 문자열을 TrustedScript로 안전하지 않게 승격시키며,
 * Trusted Types가 사용 가능한 경우 문자열로 폴백합니다.
 * @security 특히, 제공된 문자열이
 * 브라우저에 의해 스크립트로 해석되고 실행되는 컨텍스트에서 사용될 경우
 * XSS 취약점을 유발하지 않도록 보장해야 합니다. 예: eval 호출 시.
 */
export function trustedScriptFromString(script: string): TrustedScript | string {
  return getPolicy()?.createScript(script) || script;
}

/**
 * 문자열을 TrustedScriptURL로 안전하지 않게 승격시키며,
 * Trusted Types가 사용 가능한 경우 문자열로 폴백합니다.
 * @security 이 함수는 보안에 민감한 함수입니다; 이 함수를 사용하는 모든
 * 경우에는 보안 검토를 거쳐야 합니다. 특히, 제공된 문자열이
 * 브라우저가 리소스를 로드하고 실행하도록 유발하는 컨텍스트에서 사용될 경우
 * XSS 취약점을 유발하지 않도록 보장해야 합니다. 예: script.src에 할당할 경우.
 */
export function trustedScriptURLFromString(url: string): TrustedScriptURL | string {
  return getPolicy()?.createScriptURL(url) || url;
}

/**
 * 주어진 문자열 인수로 Function 생성자를 안전하지 않게 호출합니다.
 * 개발 모드에서만 사용할 수 있으며,
 * 프로덕션 코드에서는 제거되어야 합니다.
 * @security 이 함수는 보안에 민감한 함수입니다; 이 함수를 사용하는 모든
 * 경우에는 보안 검토를 거쳐야 합니다. 특히, 프로덕션 코드에서 사용할 경우
 * XSS 취약점을 유발하지 않도록 개발 코드에서만 호출되도록 보장해야 합니다.
 */
export function newTrustedFunctionForDev(...args: string[]): Function {
  if (typeof ngDevMode === 'undefined') {
    throw new Error('newTrustedFunctionForDev는 프로덕션에서 호출해서는 안 됩니다.');
  }
  if (!global.trustedTypes) {
    // Trusted Types를 지원하지 않는 환경에서 가장
    // 간단한 구현으로 폴백합니다.
    return new Function(...args);
  }

  // Chrome은 현재 TrustedScript를 Function
  // 생성자에 전달하는 것을 지원하지 않습니다. 아래 페이지에서 제안한 우회 방법을 구현합니다.
  // https://github.com/w3c/webappsec-trusted-types/wiki/Trusted-Types-for-function-constructor
  const fnArgs = args.slice(0, -1).join(',');
  const fnBody = args[args.length - 1];
  const body = `(function anonymous(${fnArgs}
) { ${fnBody}
})`;

  // eval을 직접 사용하는 것은 컴파일러를 혼란스럽게 하며, 이 모듈이
  // 사용할 수 없을 경우에도 JS 바이너리에서 제거되는 것을 방지합니다.
  const fn = global['eval'](trustedScriptFromString(body)) as Function;
  if (fn.bind === undefined) {
    // TrustedScript를 eval로 전달할 경우 TrustedScript가
    // 평가되지 않고 다시 돌아오는 Chrome 83에서만 존재하는 브라우저 버그에 대한 우회입니다.
    // 이 경우 가장 간단한 구현으로 폴백합니다.
    return new Function(...args);
  }

  // "new Function"을 호출하는 것과 같은 행동을 완전히 모방하기 위해
  // 두 가지 일이 더 발생해야 합니다:
  // 1. 결과 함수의 문자열화는 그 소스 코드를 반환해야 합니다.
  fn.toString = () => body;
  // 2. 결과 함수를 호출할 때 `this`는 `global`을 가리켜야 합니다.
  return fn.bind(global);

  // Function 생성자에서 Trusted Types 지원이 널리 제공되면,
  // 이 함수의 구현을 간단하게 할 수 있습니다:
  // return new Function(...args.map(a => trustedScriptFromString(a)));
}
