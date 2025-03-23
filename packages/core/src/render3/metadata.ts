/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Type} from '../interface/type';
import {noSideEffects} from '../util/closure';

interface TypeWithMetadata extends Type<any> {
  decorators?: any[];
  ctorParameters?: () => any[];
  propDecorators?: {[field: string]: any};
}

/**
 * Angular이 컴포넌트 클래스에 monkey-patch하는 필드 이름으로,
 * 지연 로드 가능한 종속성을 로드하는 함수를 저장하고
 * 클래스에 메타데이터를 적용합니다.
 */
const ASYNC_COMPONENT_METADATA_FN = '__ngAsyncComponentMetadataFn__';

/**
 * 주어진 컴포넌트에 해결되지 않은 비동기 메타데이터가 있는 경우,
 * 지연 로드 가능한 종속성을 해결한 후 컴포넌트 메타데이터를 적용하는
 * 함수에 대한 참조를 반환합니다. 그렇지 않으면 이 함수는 `null`을 반환합니다.
 */
export function getAsyncClassMetadataFn(
  type: Type<unknown>,
): (() => Promise<Array<Type<unknown>>>) | null {
  const componentClass = type as any; // monkey-patch된 필드를 읽을 수 있도록 `any`로 캐스팅
  return componentClass[ASYNC_COMPONENT_METADATA_FN] ?? null;
}

/**
 * 컴포넌트 템플릿에 지연 블록이 있는 경우,
 * 컴포넌트 클래스에 메타데이터 정보를 적용하는 과정을 처리합니다
 * (따라서 일부 종속성이 지연 가능해졌습니다).
 *
 * @param type 메타데이터를 추가해야 하는 컴포넌트 클래스
 * @param dependencyLoaderFn 종속성을 로드하는 함수
 * @param metadataSetterFn `setClassMetadata`가 호출되는 범위를 형성하는 함수
 */
export function setClassMetadataAsync(
  type: Type<any>,
  dependencyLoaderFn: () => Array<Promise<Type<unknown>>>,
  metadataSetterFn: (...types: Type<unknown>[]) => void,
): () => Promise<Array<Type<unknown>>> {
  const componentClass = type as any; // monkey-patch할 수 있도록 `any`로 캐스팅
  componentClass[ASYNC_COMPONENT_METADATA_FN] = () =>
    Promise.all(dependencyLoaderFn()).then((dependencies) => {
      metadataSetterFn(...dependencies);
      // 메타데이터가 이제 설정되었으므로, 이 컴포넌트가
      // 동기적으로 사용/컴파일될 수 있음을 나타내기 위해 필드 값을 초기화합니다.
      componentClass[ASYNC_COMPONENT_METADATA_FN] = null;

      return dependencies;
    });
  return componentClass[ASYNC_COMPONENT_METADATA_FN];
}

/**
 * 주어진 유형에 정적 메타데이터 필드를 통해 데코레이터, 생성자 및 속성 메타데이터를 추가합니다.
 *
 * 이러한 메타데이터 필드는 나중에 Angular의 `ReflectionCapabilities` API로 읽을 수 있습니다.
 *
 * `setClassMetadata` 호출은 ngDevMode로 보호될 수 있으며,
 * 이로 인해 메타데이터 할당이 프로덕션 빌드 동안 트리 쉐이킹될 수 있습니다.
 */
export function setClassMetadata(
  type: Type<any>,
  decorators: any[] | null,
  ctorParameters: (() => any[]) | null,
  propDecorators: {[field: string]: any} | null,
): void {
  return noSideEffects(() => {
    const clazz = type as TypeWithMetadata;

    if (decorators !== null) {
      if (clazz.hasOwnProperty('decorators') && clazz.decorators !== undefined) {
        clazz.decorators.push(...decorators);
      } else {
        clazz.decorators = decorators;
      }
    }
    if (ctorParameters !== null) {
      // 병합하기 보다는 기존 파라미터를 덮어씌운다. 다른 프로젝트가
      // tsickle 스타일 주석을 사용하고 이를 동일한 방식으로 반사한다면,
      // 이로 인해 문제가 발생할 수 있지만, 이는 거의 불가능합니다.
      clazz.ctorParameters = ctorParameters;
    }
    if (propDecorators !== null) {
      // 속성 데코레이터 객체는 서로 다른 필드가 서로 다른 데코레이터 유형을 가질 수 있으므로 병합됩니다.
      // 개별 필드의 데코레이터는 병합되지 않으며,
      // Angular 데코레이터와 비-Angular 데코레이터가 동시에
      // 사용될 가능성은 극히 낮습니다.
      if (clazz.hasOwnProperty('propDecorators') && clazz.propDecorators !== undefined) {
        clazz.propDecorators = {...clazz.propDecorators, ...propDecorators};
      } else {
        clazz.propDecorators = propDecorators;
      }
    }
  }) as never;
}
