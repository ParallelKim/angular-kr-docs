/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {ProcessProvidersFunction, Provider} from '../../di/interface/provider';
import {providersResolver} from '../di_setup';
import {DirectiveDef} from '../interfaces/definition';

/**
 * 이 기능은 지시어(또는 컴포넌트)의 프로바이더를 해결하고,
 * DI 시스템에 등록하여 다른 부분에서 주입할 수 있도록 합니다.
 *
 * 예시:
 * ```ts
 * class ComponentWithProviders {
 *   constructor(private greeter: GreeterDE) {}
 *
 *   static ɵcmp = defineComponent({
 *     type: ComponentWithProviders,
 *     selectors: [['component-with-providers']],
 *    factory: () => new ComponentWithProviders(directiveInject(GreeterDE as any)),
 *    decls: 1,
 *    vars: 1,
 *    template: function(fs: RenderFlags, ctx: ComponentWithProviders) {
 *      if (fs & RenderFlags.Create) {
 *        ɵɵtext(0);
 *      }
 *      if (fs & RenderFlags.Update) {
 *        ɵɵtextInterpolate(ctx.greeter.greet());
 *      }
 *    },
 *    features: [ɵɵProvidersFeature([GreeterDE])]
 *  });
 * }
 * ```
 *
 * @param definition
 *
 * @codeGenApi
 */
export function ɵɵProvidersFeature<T>(providers: Provider[], viewProviders: Provider[] = []) {
  return (definition: DirectiveDef<T>) => {
    definition.providersResolver = (
      def: DirectiveDef<T>,
      processProvidersFn?: ProcessProvidersFunction,
    ) => {
      return providersResolver(
        def, //
        processProvidersFn ? processProvidersFn(providers) : providers, //
        viewProviders,
      );
    };
  };
}
