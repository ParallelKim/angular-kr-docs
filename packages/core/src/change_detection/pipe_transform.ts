/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/**
 * 변환을 수행하기 위하여 파이프에서 구현되는 인터페이스입니다.
 * Angular는 데이터 바인딩의 값을 첫 번째 인수로,
 * 다른 매개변수를 두 번째 인수로 리스트 형식으로 사용하여 `transform` 메소드를 호출합니다.
 *
 * @usageNotes
 *
 * 다음 예제에서 `TruncatePipe`는 생략 부호가 추가된 짧은 값을 반환합니다.
 *
 * <code-example path="core/ts/pipes/simple_truncate.ts" header="simple_truncate.ts"></code-example>
 *
 * 템플릿에서 `{{ 'It was the best of times' | truncate }}`를 호출하면 `It was...`가 생성됩니다.
 *
 * 다음 예제에서 `TruncatePipe`는 잘린 길이와 추가할 문자열을 설정하는 매개변수를 사용합니다.
 *
 * <code-example path="core/ts/pipes/truncate.ts" header="truncate.ts"></code-example>
 *
 * 템플릿에서 `{{ 'It was the best of times' | truncate:4:'....' }}`를 호출하면 `It
 * was the best....`가 생성됩니다.
 *
 * @publicApi
 */
export interface PipeTransform {
  transform(value: any, ...args: any[]): any;
}
