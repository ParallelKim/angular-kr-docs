/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 이 간접 참조는 이러한 주석의 데코레이터 버전이 사용할 수 있도록
 * 공개 API에서 Component 등의 기호를 해제하는 데 필요합니다.
 */

export {Attribute, AttributeDecorator} from './di/metadata_attr';
export {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  DoCheck,
  OnChanges,
  OnDestroy,
  OnInit,
} from './interface/lifecycle_hooks';
export {
  ContentChild,
  ContentChildDecorator,
  ContentChildren,
  ContentChildrenDecorator,
  Query,
  ViewChild,
  ViewChildDecorator,
  ViewChildren,
  ViewChildrenDecorator,
} from './metadata/di';
export {
  Component,
  ComponentDecorator,
  Directive,
  DirectiveDecorator,
  HostBinding,
  HostBindingDecorator,
  HostListener,
  HostListenerDecorator,
  Input,
  InputDecorator,
  Output,
  OutputDecorator,
  Pipe,
  PipeDecorator,
} from './metadata/directives';
export {DoBootstrap} from './metadata/do_bootstrap';
export {NgModule, NgModuleDecorator} from './metadata/ng_module';
export {CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, SchemaMetadata} from './metadata/schema';
export {ViewEncapsulation} from './metadata/view';
