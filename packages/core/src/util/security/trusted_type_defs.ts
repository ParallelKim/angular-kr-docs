/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * @fileoverview
 * Angular는 현재 Trusted Types를 내부적으로만 사용하지만,
 * Trusted Types에 대한 참조가 core.d.ts로 누출될 수 있으며, 이는
 * @angular/core에 대해 컴파일하는 모든 사람이
 * @types/trusted-types 패키지를 컴파일 단위에 제공해야 함을 강제할 수 있습니다.
 *
 * https://github.com/microsoft/TypeScript/issues/30024가 해결될 때까지,
 * Angular의 공용 API 영역은 Trusted Types에 대한 참조 없이 유지됩니다.
 * Trusted Types를 참조해야 하는 내부 및 반공식 API의 경우,
 * 이 모듈에서 제공하는 Trusted Types API에 대한 최소한의 타입 정의를 대신 사용해야 합니다.
 * 최적화에 의해 이름이 바뀌는 것을 방지하기 위해 "declare"로 표시되어 있습니다.
 *
 * 다음에서 수정되었습니다:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/trusted-types/index.d.ts
 * 그러나 Angular 내에서 사용되는 API 영역으로 제한됩니다.
 */

export type TrustedHTML = string & {
  __brand__: 'TrustedHTML';
};
export type TrustedScript = string & {
  __brand__: 'TrustedScript';
};
export type TrustedScriptURL = string & {
  __brand__: 'TrustedScriptURL';
};

export interface TrustedTypePolicyFactory {
  createPolicy(
    policyName: string,
    policyOptions: {
      createHTML?: (input: string) => string;
      createScript?: (input: string) => string;
      createScriptURL?: (input: string) => string;
    },
  ): TrustedTypePolicy;
  getAttributeType(tagName: string, attribute: string): string | null;
}

export interface TrustedTypePolicy {
  createHTML(input: string): TrustedHTML;
  createScript(input: string): TrustedScript;
  createScriptURL(input: string): TrustedScriptURL;
}
