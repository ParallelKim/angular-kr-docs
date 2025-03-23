/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/*
 * 이 파일은 이 디렉토리에 포함된 모든 심볼을 재수출합니다.
 *
 * 왜 이 파일은 `index.ts`가 아닐까요?
 *
 * 부모 디렉토리만 참조할 때 `index.ts` 파일의 경로 해결이 일관되지 않는 것 같습니다.
 * 이는 노드 모듈 해상도 구성과 rollup 및/또는 typescript가 다르기 때문일 수 있습니다.
 *
 * 커밋
 * https://github.com/angular/angular/commit/d5e3f2c64bd13ce83e7c70788b7fc514ca4a9918
 * `instructions.ts` 파일이 `instructions/instructions.ts`로 이동했으며,
 * 모든 것을 재수출하기 위해 `index.ts` 파일이 사용되었습니다.
 * `instructions`에서 직접 가져오는 파일 이름이 있었던 것은
 * (하위 파일이나 `index.ts` 파일이 아닌) 이상한 CI 문제를 일으켰습니다.
 * 작동하기 위해 `index.ts`는 `all.ts`로 이름이 변경되어야 했습니다.
 *
 * Jira Issue = FW-1184
 */
export * from '../../defer/instructions';
export * from './advance';
export * from './attribute';
export * from './attribute_interpolation';
export * from './change_detection';
export * from './class_map_interpolation';
export * from './component_instance';
export * from './control_flow';
export * from './di';
export * from './di_attr';
export * from './element';
export * from './element_container';
export {
  ɵgetUnknownElementStrictMode,
  ɵgetUnknownPropertyStrictMode,
  ɵsetUnknownElementStrictMode,
  ɵsetUnknownPropertyStrictMode,
} from './element_validation';
export * from './get_current_view';
export * from './host_property';
export * from './i18n';
export * from './listener';
export * from './namespace';
export * from './next_context';
export * from './projection';
export * from './property';
export * from './property_interpolation';
export * from './queries';
export * from './queries_signals';
export * from './storage';
export * from './style_map_interpolation';
export * from './style_prop_interpolation';
export * from './styling';
export * from './template';
export * from './text';
export * from './text_interpolation';
export * from './two_way';
export * from './let_declaration';
export * from './attach_source_locations';
