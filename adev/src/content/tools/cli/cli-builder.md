# Angular CLI builders

다수의 Angular CLI 명령어는 애플리케이션을 빌드, 테스트 또는 제공하는 것과 같은 복잡한 프로세스를 코드에서 실행합니다.
이 명령어는 *CLI builders*를 실행하기 위해 Architect라는 내부 도구를 사용하며, 이 도구는 원하는 작업을 수행하기 위해 다른 도구(번들러, 테스트 실행기, 서버)를 호출합니다.
사용자 정의 빌더는 전혀 새로운 작업을 수행하거나 기존 명령어에서 사용되는 서드파티 도구를 변경할 수 있습니다.

이 문서는 CLI 빌더가 작업 공간 구성 파일과 통합되는 방법을 설명하고, 사용자 빌더를 만들어 보는 방법을 보여줍니다.

도움이 되는 정보: 여기서 사용된 예제의 코드는 이 [GitHub 리포지토리](https://github.com/mgechev/cli-builders-demo)에서 확인할 수 있습니다.

## CLI builders

내부 Architect 도구는 *builders*라고 불리는 핸들러 함수에 작업을 위임합니다.
빌더 핸들러 함수는 두 개의 인수를 받습니다:

| 인수      | 타입               |
|:---       |:---                |
| `options` | `JSONObject`       |
| `context` | `BuilderContext`   |

여기서 관심사의 분리는 코드에 접근하는 다른 CLI 명령어에 사용되는 [schematics](tools/cli/schematics-authoring)와 동일합니다 (예: `ng generate`).

* `options` 객체는 CLI 사용자의 옵션 및 구성에 의해 제공되며, `context` 객체는 CLI Builder API에 의해 자동으로 제공됩니다.
* 문맥 정보 외에도 `context` 객체는 `context.scheduleTarget()`라는 스케줄링 메소드에 대한 접근을 제공합니다.
    스케줄러는 주어진 대상 구성으로 빌더 핸들러 함수를 실행합니다.

빌더 핸들러 함수는 동기적(값을 반환), 비동기적(‘Promise’를 반환) 또는 여러 값을 반환하는 감시 가능(‘Observable’을 반환)일 수 있습니다.
반환값은 항상 `BuilderOutput` 타입이어야 합니다.
이 객체는 Boolean `success` 필드와 선택적인 `error` 필드를 포함하여 에러 메시지를 담을 수 있습니다.

Angular는 `ng build` 및 `ng test`와 같은 명령어에 의해 사용되는 빌더를 제공합니다.
이들 및 다른 내장 CLI 빌더에 대한 기본 대상 구성은 [워크스페이스 구성 파일](reference/configs/workspace-config)인 `angular.json`의 "architect" 섹션에서 찾고 구성할 수 있습니다.
또한, [`ng run` CLI 명령어](cli/run)를 사용하여 직접 실행할 수 있는 사용자 빌더를 만들어 Angular를 확장하고 사용자 정의할 수 있습니다.

### Builder project structure

빌더는 Angular 작업 공간과 유사한 구조를 가진 "project" 폴더에 위치하며, 상위 수준에는 전역 구성 파일이 있고, 코드 파일이 있는 소스 폴더에 보다 구체적인 구성이 있습니다.
예를 들어, `myBuilder` 폴더에는 다음 파일이 포함될 수 있습니다.

| 파일                     | 용도                                                                                                   |
|:---                      | :---                                                                                                      |
| `src/my-builder.ts`      | 빌더 정의를 위한 주요 소스 파일.                                                              |
| `src/my-builder.spec.ts` | 테스트를 위한 소스 파일.                                                                                    |
| `src/schema.json`        | 빌더 입력 옵션의 정의.                                                                      |
| `builders.json`          | 빌더 정의.                                                                                      |
| `package.json`           | 의존성. [https://docs.npmjs.com/files/package.json](https://docs.npmjs.com/files/package.json)을 참조하세요. |
| `tsconfig.json`          | [TypeScript 구성](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).              |

빌더는 `npm`에 게시될 수 있으며, [라이브러리 게시](tools/libraries/creating-libraries) 참조.

## Creating a builder

예를 들어, 파일을 새 위치로 복사하는 빌더를 생성하겠습니다.
빌더를 생성하려면 `createBuilder()` CLI Builder 함수를 사용하고, `Promise<BuilderOutput>` 객체를 반환합니다.

<docs-code header="src/my-builder.ts (builder skeleton)" path="adev/src/content/examples/cli-builder/src/my-builder.ts" visibleRegion="builder-skeleton"/>

이제 여기에 일부 로직을 추가합시다.
다음 코드는 사용자 옵션에서 소스 및 대상 파일 경로를 가져오고 소스에서 대상으로 파일을 복사합니다 \(내장 NodeJS `copyFile()` 함수의 [Promise 버전](https://nodejs.org/api/fs.html#fs_fspromises_copyfile_src_dest_mode)을 사용\).
복사 작업에 실패하면 기저 문제에 대한 메시지와 함께 오류를 반환합니다.

<docs-code header="src/my-builder.ts (builder)" path="adev/src/content/examples/cli-builder/src/my-builder.ts" visibleRegion="builder"/>

### Handling output

기본적으로 `copyFile()`은 프로세스의 표준 출력 또는 오류에 아무것도 출력하지 않습니다.
오류가 발생하면 문제가 발생했을 때 빌더가 정확히 무엇을 하려고 했는지 이해하기 어려울 수 있습니다.
`Logger` API를 사용하여 추가 정보를 로깅함으로써 추가 문맥을 추가합니다.
이렇게 하면 표준 출력 및 오류가 비활성화되어도 빌더 자체가 별도의 프로세스에서 실행될 수 있습니다.

`context`에서 `Logger` 인스턴스를 검색할 수 있습니다.

<docs-code header="src/my-builder.ts (handling output)" path="adev/src/content/examples/cli-builder/src/my-builder.ts" visibleRegion="handling-output"/>

### Progress and status reporting

CLI Builder API는 특정 함수 및 인터페이스에 대한 힌트를 제공할 수 있는 진행 상황 및 상태 보고 도구를 포함합니다.

진행 상황을 보고하려면 현재 값, 선택적 총계 및 상태 문자열을 인수로 사용하는 `context.reportProgress()` 메소드를 사용하십시오.
총계는 어떤 숫자일 수 있습니다. 예를 들어 처리해야 할 파일 수를 알고 있다면, 총계는 파일 수일 수 있으며 현재 처리된 파일 수는 현재 값으로 전달합니다.
상태 문자열은 새 문자열 값을 전달하지 않는 한 수정되지 않습니다.

우리의 예에서 복사 작업은 완료되거나 여전히 실행 중이므로 진행 보고가 필요하지 않지만, 부모 빌더가 우리 빌더를 호출했을 때 어떤 일이 진행되고 있는지 알 수 있도록 상태를 보고할 수 있습니다.
어떤 길이의 상태 문자열을 생성하기 위해 `context.reportStatus()` 메소드를 사용하십시오.

도움이 되는 정보: 긴 문자열이 전체적으로 표시된다는 보장은 없으며; UI에 맞게 잘릴 수 있습니다.

상태를 제거하려면 빈 문자열을 전달하십시오.

<docs-code header="src/my-builder.ts (progress reporting)" path="adev/src/content/examples/cli-builder/src/my-builder.ts" visibleRegion="progress-reporting"/>

## Builder input

빌더는 `ng build`와 같은 CLI 명령어를 통해 간접적으로 호출하거나, Angular CLI `ng run` 명령어로 직접 호출할 수 있습니다.
어느 쪽이든 필수 입력을 제공해야 하지만 특정 *대상*에 대해 미리 구성된 값으로 기본값을 설정할 수 있습니다. 이는 [구성](tools/cli/environments) 또는 명령줄에서 설정할 수 있습니다.

### Input validation

빌더 입력은 해당 빌더와 연결된 JSON 스키마에서 정의됩니다.
Schematics와 유사하게 Architect 도구는 해결된 입력 값을 `options` 객체에 수집하고, 이를 빌더 함수에 전달하기 전에 스키마에 대해 유형을 검증합니다.

우리 예제 빌더의 경우 `options`는 두 개의 키를 가진 `JsonObject`여야 합니다:
`source`와 `destination`, 각각 문자열이어야 합니다.

다음 스키마를 제공하여 이러한 값의 유형 검증을 할 수 있습니다.

<docs-code header="src/schema.json" language="json">

{
  "$schema": "http://json-schema.org/schema",
  "type": "object",
  "properties": {
    "source": {
      "type": "string"
    },
    "destination": {
      "type": "string"
    }
  }
}

</docs-code>

도움이 되는 정보: 이것은 최소한의 예제이지만, 검증을 위한 스키마 사용은 매우 강력할 수 있습니다.
자세한 정보는 [JSON 스키마 웹사이트](http://json-schema.org)를 참조하십시오.

빌더 구현을 스키마와 이름에 연결하려면 `package.json`에서 참조할 수 있는 *빌더 정의* 파일을 생성해야 합니다.

`builders.json`이라는 파일을 다음과 같이 만드십시오:

<docs-code header="builders.json" language="json">

{
  "builders": {
    "copy": {
      "implementation": "./dist/my-builder.js",
      "schema": "./src/schema.json",
      "description": "Copies a file."
    }
  }
}

</docs-code>

`package.json` 파일에 다음과 같이 우리 빌더 정의 파일을 찾는 `builders` 키를 추가합니다.

<docs-code header="package.json" language="json">

{
  "name": "@example/copy-file",
  "version": "1.0.0",
  "description": "Builder for copying files",
  "builders": "builders.json",
  "dependencies": {
    "@angular-devkit/architect": "~0.1200.0",
    "@angular-devkit/core": "^12.0.0"
  }
}

</docs-code>

우리 빌더의 공식 이름은 이제 `@example/copy-file:copy`입니다.
이의 첫 번째 부분은 패키지 이름이며, 두 번째 부분은 `builders.json` 파일에 지정된 빌더 이름입니다.

이 값들은 `options.source` 및 `options.destination`에서 접근할 수 있습니다.

<docs-code header="src/my-builder.ts (report status)" path="adev/src/content/examples/cli-builder/src/my-builder.ts" visibleRegion="report-status"/>

### Target configuration

빌더는 특정 입력 구성 및 프로젝트와 연결되는 정의된 대상을 가져야 합니다.

대상은 `angular.json` [CLI 구성 파일](reference/configs/workspace-config)에서 정의됩니다.
대상은 사용할 빌더, 기본 옵션 구성 및 이름이 지정된 대체 구성을 지정합니다.
Angular CLI의 Architect는 주어진 실행에 대한 입력 옵션을 해결하기 위해 대상 정의를 사용합니다.

`angular.json` 파일은 각 프로젝트에 대한 섹션이 있으며 각 프로젝트의 "architect" 섹션은 'build', 'test' 및 'serve'와 같이 CLI 명령어에 의해 사용되는 빌더의 대상을 구성합니다.
예를 들어 `ng build` 명령어는 빌더 `@angular-devkit/build-angular:browser`를 실행하여 빌드 작업을 수행하고, `angular.json`에서 `build` 대상에 대해 지정된 기본 옵션 값을 전달합니다.

<docs-code header="angular.json" language="json">

…

"myApp": {
  …
  "architect": {
    "build": {
      "builder": "@angular-devkit/build-angular:browser",
      "options": {
        "outputPath": "dist/myApp",
        "index": "src/index.html",
        …
      },
      "configurations": {
        "production": {
          "fileReplacements": [
            {
              "replace": "src/environments/environment.ts",
              "with": "src/environments/environment.prod.ts"
            }
          ],
          "optimization": true,
          "outputHashing": "all",
          …
        }
      }
    },
    …
  }
}

…

</docs-code>

명령어는 "options" 섹션에 지정된 기본 옵션 집합을 빌더에 전달합니다.
`--configuration=production` 플래그를 전달하면 `production` 구성에 지정된 재정의 값을 사용합니다.
추가 옵션 재정의를 명령줄에서 개별적으로 지정합니다.

#### Target strings

일반적인 `ng run` CLI 명령어는 다음 형식의 대상 문자열을 첫 번째 인수로 사용합니다.

<docs-code language="shell">

project:target[:configuration]

</docs-code>

|               | 세부정보 |
|:---           |:---     |
| project       | 대상과 연결된 Angular CLI 프로젝트의 이름입니다.                                               |
| target        | `angular.json` 파일의 `architect` 섹션에서 지정된 이름 있는 빌더 구성입니다.                                |
| configuration | (선택 사항) 주어진 대상에 대한 특정 구성 재정의의 이름으로, `angular.json` 파일에서 정의됩니다. |

빌더가 또 다른 빌더를 호출하면 전달된 대상 문자열을 읽어야 할 수도 있습니다.
이 문자열을 객체로 구문 분석하려면 `@angular-devkit/architect`의 `targetFromTargetString()` 유틸리티 함수를 사용하십시오.

## Schedule and run

Architect는 빌더를 비동기적으로 실행합니다.
빌더를 호출하려면 모든 구성 해결이 완료될 때 실행될 작업을 예약해야 합니다.

빌더 함수는 스케줄러가 `BuilderRun` 제어 객체를 반환할 때까지 실행되지 않습니다.
CLI는 일반적으로 `context.scheduleTarget()` 함수를 호출하여 작업을 예약하고, 그런 다음 `angular.json` 파일의 대상 정의를 사용하여 입력 옵션을 해결합니다.

Architect는 기본 옵션 객체를 가져온 다음 구성에서 값들을 덮어쓰고, 그 다음 `context.scheduleTarget()`에 전달된 재정의 객체에서 추가로 값을 덮어쓰기하여 주어진 대상에 대한 입력 옵션을 해결합니다.
Angular CLI의 경우, 재정의 객체는 명령줄 인수에서 빌드됩니다.

Architect는 결과 옵션 값이 빌더의 스키마에 대해 유효한지 검증합니다.
입력이 유효하면 Architect는 컨텍스트를 생성하고 빌더를 실행합니다.

자세한 정보는 [워크스페이스 구성](reference/configs/workspace-config)을 참조하십시오.

도움이 되는 정보: 다른 빌더나 테스트에서 `context.scheduleBuilder()`를 호출하여 빌더를 직접 호출할 수도 있습니다.
인수를 메소드를 통해 직접 전달하며, 이러한 옵션 값은 추가 조정 없이 빌더의 스키마에 대해 검증됩니다.

오직 `context.scheduleTarget()` 메소드만이 `angular.json` 파일을 통해 구성을 해결하고 재정의를 적용합니다.

### Default architect configuration

대상 구성을 컨텍스트에 넣는 간단한 `angular.json` 파일을 생성합시다.

빌더를 npm에 게시할 수 있습니다 (자세한 정보는 [라이브러리 게시](tools/libraries/creating-libraries#publishing-your-library)를 참조) 및 다음 명령어를 사용하여 설치할 수 있습니다:

<docs-code language="shell">

npm install @example/copy-file

</docs-code>

`ng new builder-test`로 새 프로젝트를 생성하면 생성된 `angular.json` 파일은 다음과 같이 기본 빌더 구성만 포함됩니다.

<docs-code header="angular.json" language="json">

{
  "projects": {
    "builder-test": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            // 더 많은 옵션...
            "outputPath": "dist/builder-test",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "src/tsconfig.app.json"
          },
          "configurations": {
            "production": {
              // 더 많은 옵션...
              "optimization": true,
              "aot": true,
              "buildOptimizer": true
            }
          }
        }
      }
    }
  }
}

</docs-code>

### Adding a target

파일을 복사하기 위해 우리의 빌더를 실행할 새 대상을 추가합니다.
이 대상은 빌더에게 `package.json` 파일을 복사하도록 지시합니다.

* 프로젝트의 `architect` 객체에 새로운 대상 섹션을 추가합니다.
* `copy-package`라는 이름의 대상은 `@example/copy-file`로 게시된 우리 빌더를 사용합니다.
* 옵션 객체는 정의한 두 개의 입력에 대한 기본값을 제공합니다.
  * `source` - 복사할 기존 파일입니다.
  * `destination` - 복사할 경로입니다.

<docs-code header="angular.json" language="json">

{
  "projects": {
    "builder-test": {
      "architect": {
        "copy-package": {
          "builder": "@example/copy-file:copy",
          "options": {
            "source": "package.json",
            "destination": "package-copy.json"
          }
        },

        // 기존 대targets...
      }
    }
  }
}

</docs-code>

### Running the builder

새 대상의 기본 구성을 가진 빌더를 실행하려면 다음 CLI 명령어를 사용하십시오.

<docs-code language="shell">

ng run builder-test:copy-package

</docs-code>

이 명령어는 `package.json` 파일을 `package-copy.json`으로 복사합니다.

명령줄 인수를 사용하여 구성된 기본값을 재정의할 수 있습니다.
예를 들어, 다른 `destination` 값을 사용하려면 다음 CLI 명령어를 사용하십시오.

<docs-code language="shell">

ng run builder-test:copy-package --destination=package-other.json

</docs-code>

이 명령어는 파일을 `package-other.json`으로 복사하며, 기본 `package.json` 파일에서 복사할 것입니다.

## Testing a builder

빌더에 대한 통합 테스트를 사용하여 Architect 스케줄러를 사용하여 컨텍스트를 생성할 수 있습니다. 이는 이 [예제](https://github.com/mgechev/cli-builders-demo)에서 볼 수 있습니다.
빌더 소스 디렉토리에서 새로운 테스트 파일 `my-builder.spec.ts`을 생성합니다. 테스트는 `JsonSchemaRegistry`(스키마 검증용), `TestingArchitectHost`(인메모리 구현체 `ArchitectHost`), 및 `Architect`의 새로운 인스턴스를 생성합니다.

다음은 복사 파일 빌더를 실행하는 테스트의 예입니다.
이 테스트는 빌더를 사용하여 `package.json` 파일을 복사하고 복사된 파일의 내용이 원본과 같음을 검증합니다.

<docs-code header="src/my-builder.spec.ts" path="adev/src/content/examples/cli-builder/src/my-builder.spec.ts"/>

도움이 되는 정보: 리포지토리에서 이 테스트를 실행할 때는 [`ts-node`](https://github.com/TypeStrong/ts-node) 패키지가 필요합니다.
`my-builder.spec.ts`를 `my-builder.spec.js`로 이름을 변경하면 이 패키지를 피할 수 있습니다.

### Watch mode

대부분의 빌더는 한 번 실행되고 반환되지만, 이러한 동작은 변경 사항을 감시하는 빌더와 완전히 호환되지는 않습니다(예: 개발 서버).
Architect는 감시 모드를 지원할 수 있지만 몇 가지 주의할 사항이 있습니다.

* 감시 모드에서 사용하려면 빌더 핸들러 함수가 `Observable`을 반환해야 합니다.
    Architect는 `Observable`이 완료될 때까지 구독하며, 동일한 인수로 빌더가 다시 스케줄될 경우 재사용할 수 있습니다.

* 빌더는 각 실행 후 항상 `BuilderOutput` 객체를 방출해야 합니다.
    실행된 후 외부 이벤트로 트리거될 때 감시 모드에 들어갈 수 있습니다.
    외부 이벤트가 이를 다시 시작하도록 트리거하면 빌더는 `context.reportRunning()` 함수를 실행하여 Architect에 다시 실행 중임을 알려야 합니다.
    이렇게 하면 다른 실행이 예약된 경우 Architect가 빌더를 останов하지 않게 됩니다.

빌더가 감시 모드에서 종료하려고 `BuilderRun.stop()`을 호출하면 Architect는 빌더의 `Observable`에서 구독을 취소하고 빌더의 테어다운 로직을 호출하여 정리합니다.
이 동작은 장시간 실행되는 빌드를 중단하고 정리할 수 있도록 허용합니다.

일반적으로 빌더가 외부 이벤트를 감시하고 있다면 실행을 세 가지 단계로 나누어야 합니다.

| 단계      | 세부정보 |
|:---       |:---     |
| 실행      | 수행 중인 작업, 예를 들어 컴파일러를 호출하는 것입니다. 이는 컴파일러가 완료되고 빌더가 `BuilderOutput` 객체를 방출할 때 종료됩니다.                                                                                                  |
| 감시      | 두 실행 사이에 외부 이벤트 스트림을 감시합니다. 예를 들어 파일 시스템에서 변경 사항을 감시하는 것입니다. 이는 컴파일러가 다시 시작될 때 종료되며, `context.reportRunning()`이 호출됩니다.                                                          |
| 완료      | 작업이 완전히 완료되었거나 컴파일러가 여러 번 실행해야 하는 상황이거나 빌더 실행이 중단된 경우( `BuilderRun.stop()` 사용)입니다. Architect는 테어다운 로직을 실행하고 빌더의 `Observable`에서 구독을 취소합니다. |

## Summary

CLI 빌더 API는 빌더를 사용하여 Angular CLI의 동작을 변경하는 수단을 제공합니다.

* 빌더는 동기적 또는 비동기적일 수 있으며 한 번 실행하거나 외부 이벤트를 감시할 수 있으며 다른 빌더나 대상을 예약할 수 있습니다.
* 빌더는 `angular.json` 구성 파일에 지정된 옵션 기본값을 가지며, 대체 구성에 대한 값을 덮어쓸 수 있고, 명령줄 플래그로 추가로 재정의할 수 있습니다.
* Angular 팀은 Architect 빌더를 테스트하기 위해 통합 테스트를 사용하도록 권장합니다. 유닛 테스트는 빌더가 실행하는 로직을 검증하는 데 사용하십시오.
* 빌더가 `Observable`을 반환하는 경우 해당 `Observable`의 테어다운 로직에서 빌더를 정리해야 합니다.