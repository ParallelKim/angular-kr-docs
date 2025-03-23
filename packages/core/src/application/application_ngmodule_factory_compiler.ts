/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {getCompilerFacade, JitCompilerUsage} from '../compiler/compiler_facade';
import {Injector} from '../di/injector';
import {Type} from '../interface/type';
import {COMPILER_OPTIONS, CompilerOptions} from '../linker/compiler';
import {NgModuleFactory} from '../linker/ng_module_factory';
import {
  isComponentResourceResolutionQueueEmpty,
  resolveComponentResources,
} from '../metadata/resource_loading';
import {assertNgModuleType} from '../render3/assert';
import {setJitOptions} from '../render3/jit/jit_options';
import {NgModuleFactory as R3NgModuleFactory} from '../render3/ng_module_ref';

export function compileNgModuleFactory<M>(
  injector: Injector,
  options: CompilerOptions,
  moduleType: Type<M>,
): Promise<NgModuleFactory<M>> {
  ngDevMode && assertNgModuleType(moduleType);

  const moduleFactory = new R3NgModuleFactory(moduleType);

  // 아래의 모든 로직은 AOT-컴파일된 코드와 관련이 없습니다.
  if (typeof ngJitMode !== 'undefined' && !ngJitMode) {
    return Promise.resolve(moduleFactory);
  }

  const compilerOptions = injector.get(COMPILER_OPTIONS, []).concat(options);

  // 제공된 옵션을 사용하도록 컴파일러를 구성합니다. 이 호출은 여러 모듈을
  // 호환되지 않는 옵션으로 부트스트랩하는 경우 실패할 수 있습니다. 컴포넌트는 오직
  // 단일 옵션 세트에 따라 컴파일될 수 있습니다.
  setJitOptions({
    defaultEncapsulation: _lastDefined(compilerOptions.map((opts) => opts.defaultEncapsulation)),
    preserveWhitespaces: _lastDefined(compilerOptions.map((opts) => opts.preserveWhitespaces)),
  });

  if (isComponentResourceResolutionQueueEmpty()) {
    return Promise.resolve(moduleFactory);
  }

  const compilerProviders = compilerOptions.flatMap((option) => option.providers ?? []);

  // 컴파일러 제공자가 없으면 모듈 팩토리를 반환합니다.
  // 리소스 로더가 없기 때문입니다. Ivy의 경우 AOT 컴파일된
  // 모듈이 여전히 "bootstrapModule"을 통해 전달될 수 있습니다. 이 경우
  // 불필요하게 JIT 컴파일러를 요구하지 말아야 합니다.
  if (compilerProviders.length === 0) {
    return Promise.resolve(moduleFactory);
  }

  const compiler = getCompilerFacade({
    usage: JitCompilerUsage.Decorator,
    kind: 'NgModule',
    type: moduleType,
  });
  const compilerInjector = Injector.create({providers: compilerProviders});
  const resourceLoader = compilerInjector.get(compiler.ResourceLoader);
  // 리소스 로더는 문자열을 반환할 수 있고 "resolveComponentResources"
  //는 항상 프로미스를 기대합니다. 따라서 반환된 값을 프로미스로 감싸야 합니다.
  return resolveComponentResources((url) => Promise.resolve(resourceLoader.get(url))).then(
    () => moduleFactory,
  );
}

function _lastDefined<T>(args: T[]): T | undefined {
  for (let i = args.length - 1; i >= 0; i--) {
    if (args[i] !== undefined) {
      return args[i];
    }
  }
  return undefined;
}
