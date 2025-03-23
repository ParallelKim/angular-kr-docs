/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  getCompilerFacade,
  JitCompilerUsage,
  R3InjectableMetadataFacade,
} from '../../compiler/compiler_facade';
import {Type} from '../../interface/type';
import {NG_FACTORY_DEF} from '../../render3/fields';
import {getClosureSafeProperty} from '../../util/property';
import {resolveForwardRef} from '../forward_ref';
import type {Injectable} from '../injectable';
import {NG_PROV_DEF} from '../interface/defs';
import {
  ClassSansProvider,
  ExistingSansProvider,
  FactorySansProvider,
  ValueProvider,
  ValueSansProvider,
} from '../interface/provider';

import {angularCoreDiEnv} from './environment';
import {convertDependencies, reflectDependencies} from './util';

/**
 * Angular 주입 가능성을 `@Injectable` 메타데이터에 따라 컴파일하고,
 * 결과 주입 가능성 정의(`ɵprov`)를 주입 가능성 타입에 패치합니다.
 */
export function compileInjectable(type: Type<any>, meta?: Injectable): void {
  let ngInjectableDef: any = null;
  let ngFactoryDef: any = null;

  // 이 클래스에 NG_PROV_DEF가 이미 정의되어 있으면 덮어쓰지 않습니다.
  if (!type.hasOwnProperty(NG_PROV_DEF)) {
    Object.defineProperty(type, NG_PROV_DEF, {
      get: () => {
        if (ngInjectableDef === null) {
          const compiler = getCompilerFacade({
            usage: JitCompilerUsage.Decorator,
            kind: 'injectable',
            type,
          });
          ngInjectableDef = compiler.compileInjectable(
            angularCoreDiEnv,
            `ng:///${type.name}/ɵprov.js`,
            getInjectableMetadata(type, meta),
          );
        }
        return ngInjectableDef;
      },
    });
  }

  // 이 클래스에 NG_FACTORY_DEF가 이미 정의되어 있으면 덮어쓰지 않습니다.
  if (!type.hasOwnProperty(NG_FACTORY_DEF)) {
    Object.defineProperty(type, NG_FACTORY_DEF, {
      get: () => {
        if (ngFactoryDef === null) {
          const compiler = getCompilerFacade({
            usage: JitCompilerUsage.Decorator,
            kind: 'injectable',
            type,
          });
          ngFactoryDef = compiler.compileFactory(angularCoreDiEnv, `ng:///${type.name}/ɵfac.js`, {
            name: type.name,
            type,
            typeArgumentCount: 0, // JIT 모드에서는 타입이 사용 가능하지 않음.
            deps: reflectDependencies(type),
            target: compiler.FactoryTarget.Injectable,
          });
        }
        return ngFactoryDef;
      },
      // 이 부분은 조정 가능하게 두어, 디렉티브나 파이프의 팩토리들이 우선순위를 가질 수 있도록 합니다.
      configurable: true,
    });
  }
}

type UseClassProvider = Injectable & ClassSansProvider & {deps?: any[]};

const USE_VALUE = getClosureSafeProperty<ValueProvider>({
  provide: String,
  useValue: getClosureSafeProperty,
});

function isUseClassProvider(meta: Injectable): meta is UseClassProvider {
  return (meta as UseClassProvider).useClass !== undefined;
}

function isUseValueProvider(meta: Injectable): meta is Injectable & ValueSansProvider {
  return USE_VALUE in meta;
}

function isUseFactoryProvider(meta: Injectable): meta is Injectable & FactorySansProvider {
  return (meta as FactorySansProvider).useFactory !== undefined;
}

function isUseExistingProvider(meta: Injectable): meta is Injectable & ExistingSansProvider {
  return (meta as ExistingSansProvider).useExisting !== undefined;
}

function getInjectableMetadata(type: Type<any>, srcMeta?: Injectable): R3InjectableMetadataFacade {
  // 매개변수 없이 `@Injectable()` 데코레이터가 있는 클래스의 컴파일을 허용합니다.
  const meta: Injectable = srcMeta || {providedIn: null};
  const compilerMeta: R3InjectableMetadataFacade = {
    name: type.name,
    type: type,
    typeArgumentCount: 0,
    providedIn: meta.providedIn,
  };
  if ((isUseClassProvider(meta) || isUseFactoryProvider(meta)) && meta.deps !== undefined) {
    compilerMeta.deps = convertDependencies(meta.deps);
  }
  // 사용자가 명시적으로 `useXxxx` 속성을 제공했는지 확인합니다.
  if (isUseClassProvider(meta)) {
    compilerMeta.useClass = meta.useClass;
  } else if (isUseValueProvider(meta)) {
    compilerMeta.useValue = meta.useValue;
  } else if (isUseFactoryProvider(meta)) {
    compilerMeta.useFactory = meta.useFactory;
  } else if (isUseExistingProvider(meta)) {
    compilerMeta.useExisting = meta.useExisting;
  }
  return compilerMeta;
}
