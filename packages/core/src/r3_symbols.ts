/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/*
 * 이 파일은 Ivy 모드에서 @angular/core의 컴파일을 지원하기 위해 존재합니다.
 *
 * Angular 컴파일러가 컴파일 단위를 처리할 때 일반적으로 @angular/core에 대한
 * import 문을 작성합니다. 코어 패키지 자체를 컴파일할 때는 이 전략을 사용할 수 없습니다.
 * 대신, 컴파일러는 이 파일에 import 문을 작성합니다.
 *
 * 이러한 import의 하위 집합만 지원됩니다 - 코어는 구성 요소나 파이프를 선언할 수 없습니다.
 * ngtsc의 `R3SymbolsImportRewriter`에서 이 조건을 확인합니다. 리라이터는
 * @angular/core를 컴파일할 때만 사용되며, 외부 이름 (prefix가 ɵ인) 을
 * 아래와 같이 내보낸 내부 기호 이름으로 변환하는 역할을 합니다.
 *
 * 아래 기호는 @Injectable 및 @NgModule 컴파일에 사용됩니다.
 */

export {ɵɵinject} from './di/injector_compatibility';
export {ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵInjectableDeclaration} from './di/interface/defs';
export {NgModuleDef} from './metadata/ng_module_def';
export {ɵɵdefineNgModule} from './render3/definition';
export {
  ɵɵFactoryDeclaration,
  ɵɵInjectorDeclaration,
  ɵɵNgModuleDeclaration,
} from './render3/interfaces/public_definitions';
export {setClassMetadata, setClassMetadataAsync} from './render3/metadata';
export {NgModuleFactory} from './render3/ng_module_ref';
export {noSideEffects as ɵnoSideEffects} from './util/closure';

/**
 * 이 상수의 존재 (이 특정 파일에서)는 Angular 컴파일러에게 현재 프로그램이
 * 실제로 @angular/core라는 것을 알리며, 이는 특별히 컴파일되어야 합니다.
 */
export const ITS_JUST_ANGULAR = true;
