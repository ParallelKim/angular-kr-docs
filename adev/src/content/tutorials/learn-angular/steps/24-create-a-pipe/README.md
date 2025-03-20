# 사용자 정의 파이프 만들기

Angular에서 데이터 변환 요구 사항에 맞게 사용자 정의 파이프를 만들 수 있습니다.

이번 활동에서는 사용자 정의 파이프를 생성하고 템플릿에서 사용하는 방법을 배웁니다.

<hr>

파이프는 `@Pipe` 데코레이터가 있는 TypeScript 클래스입니다. 다음은 예제입니다:

```ts
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'star',
})
export class StarPipe implements PipeTransform {
  transform(value: string): string {
    return `⭐️ ${value} ⭐️`;
  }
}
```

`StarPipe`는 문자열 값을 받고 해당 문자열 주위에 별을 추가하여 반환합니다. 다음 사항에 유의하세요:

- `@Pipe` 데코레이터 구성에서의 이름은 템플릿에서 사용될 이름입니다.
- `transform` 함수는 로직을 작성하는 곳입니다.

좋습니다, 이제 당신의 차례입니다 — `ReversePipe`를 생성해 보세요:

<docs-workflow>

<docs-step title="Create the `ReversePipe`">

`reverse.pipe.ts` 파일에서 `ReversePipe` 클래스에 `@Pipe` 데코레이터를 추가하고 다음 구성을 제공하세요:

```ts
@Pipe({
    name: 'reverse'
})
```

</docs-step>

<docs-step title="Implement the `transform` function">

이제 `ReversePipe` 클래스는 파이프입니다. `transform` 함수를 업데이트하여 역전 로직을 추가하세요:

<docs-code language="ts" highlight="[3,4,5,6,7,8,9]">
export class ReversePipe implements PipeTransform {
    transform(value: string): string {
        let reverse = '';

        for (let i = value.length - 1; i >= 0; i--) {
            reverse += value[i];
        }

        return reverse;
    }

}
</docs-code>

</docs-step>

<docs-step title="Use the `ReversePipe` in the template"></docs-step>
파이프 로직을 구현한 후 마지막 단계는 템플릿에서 사용하는 것입니다. `app.component.ts`에서 템플릿에 파이프를 포함하고 구성 요소 가져오기에 추가하세요:

<docs-code language="angular-ts" highlight="[3,4]">
@Component({
    ...
    template: `역방향 기계: {{ word | reverse }}`
    imports: [ReversePipe]
})
</docs-code>

</docs-workflow>

이로써 작업을 완료했습니다. 이 활동을 마친 것을 축하합니다. 이제 파이프 사용법과 자신만의 사용자 정의 파이프를 구현하는 방법을 알게 되었습니다.