/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  FactoryTarget,
  getCompilerFacade,
  JitCompilerUsage,
  R3DeclareComponentFacade,
  R3DeclareDirectiveFacade,
  R3DeclareFactoryFacade,
  R3DeclareInjectableFacade,
  R3DeclareInjectorFacade,
  R3DeclareNgModuleFacade,
  R3DeclarePipeFacade,
} from '../../compiler/compiler_facade';
import {Type} from '../../interface/type';
import {setClassMetadata, setClassMetadataAsync} from '../metadata';

import {angularCoreEnv} from './environment';

/**
 * 부분 디렉티브 선언 객체를 전체 디렉티브 정의 객체로 컴파일합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclareDirective(decl: R3DeclareDirectiveFacade): unknown {
  const compiler = getCompilerFacade({
    usage: JitCompilerUsage.PartialDeclaration,
    kind: 'directive',
    type: decl.type,
  });
  return compiler.compileDirectiveDeclaration(
    angularCoreEnv,
    `ng:///${decl.type.name}/ɵfac.js`,
    decl,
  );
}

/**
 * 클래스 메타데이터 선언을 평가합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclareClassMetadata(decl: {
  type: Type<any>;
  decorators: any[];
  ctorParameters?: () => any[];
  propDecorators?: {[field: string]: any};
}): void {
  setClassMetadata(
    decl.type,
    decl.decorators,
    decl.ctorParameters ?? null,
    decl.propDecorators ?? null,
  );
}

/**
 * 지연 블록을 포함하는 컴포넌트의 클래스 메타데이터를 평가합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclareClassMetadataAsync(decl: {
  type: Type<any>;
  resolveDeferredDeps: () => Promise<Type<unknown>>[];
  resolveMetadata: (...types: Type<unknown>[]) => {
    decorators: any[];
    ctorParameters: (() => any[]) | null;
    propDecorators: {[field: string]: any} | null;
  };
}): void {
  setClassMetadataAsync(decl.type, decl.resolveDeferredDeps, (...types: Type<unknown>[]) => {
    const meta = decl.resolveMetadata(...types);
    setClassMetadata(decl.type, meta.decorators, meta.ctorParameters, meta.propDecorators);
  });
}

/**
 * 부분 컴포넌트 선언 객체를 전체 컴포넌트 정의 객체로 컴파일합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclareComponent(decl: R3DeclareComponentFacade): unknown {
  const compiler = getCompilerFacade({
    usage: JitCompilerUsage.PartialDeclaration,
    kind: 'component',
    type: decl.type,
  });
  return compiler.compileComponentDeclaration(
    angularCoreEnv,
    `ng:///${decl.type.name}/ɵcmp.js`,
    decl,
  );
}

/**
 * 부분 팝 선언 객체를 전체 팝 정의 객체로 컴파일합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclareFactory(decl: R3DeclareFactoryFacade): unknown {
  const compiler = getCompilerFacade({
    usage: JitCompilerUsage.PartialDeclaration,
    kind: getFactoryKind(decl.target),
    type: decl.type,
  });
  return compiler.compileFactoryDeclaration(
    angularCoreEnv,
    `ng:///${decl.type.name}/ɵfac.js`,
    decl,
  );
}

function getFactoryKind(target: FactoryTarget) {
  switch (target) {
    case FactoryTarget.Directive:
      return 'directive';
    case FactoryTarget.Component:
      return 'component';
    case FactoryTarget.Injectable:
      return 'injectable';
    case FactoryTarget.Pipe:
      return 'pipe';
    case FactoryTarget.NgModule:
      return 'NgModule';
  }
}

/**
 * 부분 주입 가능 선언 객체를 전체 주입 가능 정의 객체로 컴파일합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclareInjectable(decl: R3DeclareInjectableFacade): unknown {
  const compiler = getCompilerFacade({
    usage: JitCompilerUsage.PartialDeclaration,
    kind: 'injectable',
    type: decl.type,
  });
  return compiler.compileInjectableDeclaration(
    angularCoreEnv,
    `ng:///${decl.type.name}/ɵprov.js`,
    decl,
  );
}

/**
 * 이 열거형은 부분 팩토리 선언 호출에 사용됩니다.
 */
export {FactoryTarget} from '../../compiler/compiler_facade';

/**
 * 부분 Injector 선언 객체를 전체 Injector 정의 객체로 컴파일합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclareInjector(decl: R3DeclareInjectorFacade): unknown {
  const compiler = getCompilerFacade({
    usage: JitCompilerUsage.PartialDeclaration,
    kind: 'NgModule',
    type: decl.type,
  });
  return compiler.compileInjectorDeclaration(
    angularCoreEnv,
    `ng:///${decl.type.name}/ɵinj.js`,
    decl,
  );
}

/**
 * 부분 NgModule 선언 객체를 전체 NgModule 정의 객체로 컴파일합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclareNgModule(decl: R3DeclareNgModuleFacade): unknown {
  const compiler = getCompilerFacade({
    usage: JitCompilerUsage.PartialDeclaration,
    kind: 'NgModule',
    type: decl.type,
  });
  return compiler.compileNgModuleDeclaration(
    angularCoreEnv,
    `ng:///${decl.type.name}/ɵmod.js`,
    decl,
  );
}

/**
 * 부분 팝 선언 객체를 전체 팝 정의 객체로 컴파일합니다.
 *
 * @codeGenApi
 */
export function ɵɵngDeclarePipe(decl: R3DeclarePipeFacade): unknown {
  const compiler = getCompilerFacade({
    usage: JitCompilerUsage.PartialDeclaration,
    kind: 'pipe',
    type: decl.type,
  });
  return compiler.compilePipeDeclaration(angularCoreEnv, `ng:///${decl.type.name}/ɵpipe.js`, decl);
}
