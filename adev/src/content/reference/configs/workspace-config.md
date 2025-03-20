# Angular 작업 공간 구성

Angular 작업 공간의 루트 수준에 있는 `angular.json` 파일은 작업 공간 전체 및 프로젝트별 구성 기본값을 제공합니다. 이러한 구성은 Angular CLI에서 제공하는 빌드 및 개발 도구에 사용됩니다. 구성에 제공된 경로 값은 작업 공간 디렉토리의 루트를 기준으로 상대적입니다.

## 일반 JSON 구조

`angular.json`의 최상위에서 몇 가지 속성이 작업 공간을 구성하고 `projects` 섹션은 나머지 프로젝트별 구성 옵션을 포함합니다. 프로젝트 수준에서 설정된 기본값을 통해 작업 공간 수준에서 Angular CLI 기본값을 재정의할 수 있습니다. 명령줄을 사용하여 프로젝트 수준에서 설정된 기본값도 재정의할 수 있습니다.

파일의 최상위에서 다음 속성들은 작업 공간을 구성합니다.

| 속성             | 세부정보                                                                                                                                                                          |
|:---              |:---                                                                                                                                                                              |
| `version`        | 구성 파일 버전입니다.                                                                                                                                                          |
| `newProjectRoot` | `ng generate application` 또는 `ng generate library`와 같은 도구를 통해 새로운 프로젝트가 생성되는 경로입니다. 경로는 작업 공간 디렉토리에 대해 절대적이거나 상대적일 수 있습니다. 기본값은 `projects`입니다. |
| `cli`            | [Angular CLI](tools/cli)를 사용자 정의하는 옵션 세트입니다. 아래의 [Angular CLI 구성 옵션](#angular-cli-configuration-options)을 참조하십시오.                               |
| `schematics`     | 이 작업 공간에 대한 `ng generate` 하위 명령 옵션 기본값을 사용자 정의하는 [schematics](tools/cli/schematics) 세트입니다. 아래의 [schematics](#schematics)을 참조하십시오.                              |
| `projects`       | 작업 공간 내의 각 애플리케이션 또는 라이브러리에 대한 하위 섹션을 포함하며, 프로젝트별 구성 옵션을 포함합니다.                                                                 |

`ng new app-name`으로 생성하는 초기 애플리케이션은 "projects" 아래에 나열됩니다:

`ng generate library`로 라이브러리 프로젝트를 만들면, 라이브러리 프로젝트도 `projects` 섹션에 추가됩니다.

도움말: 구성 파일의 `projects` 섹션은 작업 공간 파일 구조와 정확히 일치하지 않습니다.
<!-- markdownlint-disable-next-line MD032 -->
* `ng new`로 생성된 초기 애플리케이션은 작업 공간 파일 구조의 최상위에 있습니다.
* 다른 애플리케이션과 라이브러리는 기본적으로 `projects` 디렉토리 아래에 있습니다.

자세한 정보는 [작업 공간 및 프로젝트 파일 구조](reference/configs/file-structure)를 참조하시기 바랍니다.

## Angular CLI 구성 옵션

다음 속성은 Angular CLI를 사용자 정의하는 옵션 세트입니다.

| 속성                 | 세부정보                                                                                                                                    | 값 유형                        | 기본값   |
|:---                  |:---                                                                                                                                         |:---                           |:---      |
| `analytics`          | Angular 팀과 익명 사용 데이터를 공유합니다. 부울 값은 데이터를 공유할지 여부를 나타내며, UUID 문자열은 가명 식별자를 사용해 데이터를 공유합니다. | `boolean` \| `string`         | `false`  |
| `cache`              | [Angular CLI Builders](tools/cli/cli-builder)에서 사용하는 [영구 디스크 캐시](cli/cache)를 제어합니다.                                           | [캐시 옵션](#cache-options)   | `{}`     |
| `schematicCollections`| `ng generate`에서 사용할 schematics 컬렉션 목록입니다.                                                                                          | `string[]`                    | `[]`     |
| `packageManager`     | 사용하려는 기본 패키지 관리자 도구입니다.                                                                                                | `npm` \| `cnpm` \| `pnpm` \| `yarn` | `npm`    |
| `warnings`           | Angular CLI 특정 콘솔 경고를 제어합니다.                                                                                                   | [경고 옵션](#warnings-options) | `{}`     |

### 캐시 옵션

| 속성           | 세부정보                                                                                                                                                                                                                                       | 값 유형               | 기본값     |
|:---            |:---                                                                                                                                                                                                                                           |:---                   |:---        |
| `enabled`      | 빌드에 대해 디스크 캐싱이 활성화되어 있는지 구성합니다.                                                                                                                                                                                   | `boolean`             | `true`     |
| `environment`  | 디스크 캐시가 활성화되는 환경을 구성합니다.<br><br>* `ci`는 지속적인 통합(CI) 환경에서만 캐싱을 활성화합니다.<br>* `local`은 CI 환경 외부에서만 캐싱을 활성화합니다.<br>* `all`은 모든 곳에서 캐싱을 활성화합니다. | `local` \| `ci` \| `all` | `local`    |
| `path`         | 캐시 결과를 저장하는 데 사용되는 디렉토리입니다.                                                                                                                                                                                              | `string`              | `.angular/cache` |

### 경고 옵션

| 속성               | 세부정보                                                                | 값 유형 | 기본값   |
|:---                |:---                                                                    |:---      |:---      |
| `versionMismatch`  | 전역 Angular CLI 버전이 로컬 버전보다 최신일 때 경고를 보여줍니다.   | `boolean` | `true`   |

## 프로젝트 구성 옵션

다음 최상위 구성 속성은 `projects['project-name']` 아래에서 각 프로젝트에 사용할 수 있습니다.

| 속성            | 세부정보                                                                                                                | 값 유형                                   | 기본값          |
|:---             |:---                                                                                                                    |:---                                        |:---             |
| `root`          | 작업 공간 디렉토리에 상대하여 이 프로젝트 파일의 루트 디렉토리입니다. 초기 애플리케이션의 경우 비어 있으며, 작업 공간의 최상위에 있습니다. | `string`                                   | 없음(필수)      |
| `projectType`   | "application" 또는 "library" 중 하나입니다. 애플리케이션은 브라우저에서 독립적으로 실행될 수 있지만, 라이브러리는 그럴 수 없습니다.     | `application` \| `library`                | 없음(필수)      |
| `sourceRoot`    | 이 프로젝트의 소스 파일 루트 디렉토리입니다.                                                                        | `string`                                   | `''`            |
| `prefix`        | Angular가 새로운 구성 요소, 디렉티브 및 파이프를 생성할 때 선택자에 추가하는 문자열입니다. 애플리케이션 또는 기능 영역을 식별하도록 사용자 정의할 수 있습니다. | `string`                                   | `'app'`         |
| `schematics`    | 이 프로젝트에 대한 `ng generate` 하위 명령 옵션 기본값을 사용자 정의하는 schematics 세트입니다. [생성 schematics](#schematics) 섹션을 참조하십시오. | [schematics](#schematics)를 참조하십시오. | `{}`            |
| `architect`     | 이 프로젝트의 Architect 빌더 타겟에 대한 구성 기본값입니다.                                                             | [빌더 타겟 구성](#configuring-builder-targets)를 참조하십시오. | `{}`            |

## Schematics

[Angular schematics](tools/cli/schematics)는 새로운 파일을 추가하거나 기존 파일을 수정하여 프로젝트를 수정하는 지침입니다. 이러한 지침은 schematic 이름을 기본 옵션 세트에 매핑하여 구성할 수 있습니다.

schematic의 "name"은 다음 형식입니다: `<schematic-package>:<schematic-name>`.  
기본 Angular CLI `ng generate` 하위 명령에 대한 schematics는 [`@schematics/angular`](https://github.com/angular/angular-cli/blob/main/packages/schematics/angular/application/schema.json) 패키지에 수집되어 있습니다.  
예를 들어, `ng generate component`로 구성 요소를 생성하는 schematic은 `@schematics/angular:component`입니다.

제공된 schematic의 스키마 필드는 Angular CLI 하위 명령 옵션에 대한 허용된 명령줄 인수 값 및 기본값에 해당합니다.  
다른 기본값을 설정하려면 작업 공간 스키마 파일을 업데이트할 수 있습니다. 예를 들어, 기본적으로 `ng generate component`의 `standalone`을 비활성화하려면:

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "schematics": {
        "@schematics/angular:component": {
          "standalone": false
        }
      }
    }
  }
}

</docs-code>

## CLI 빌더 구성

Architect는 Angular CLI가 컴파일 및 테스트 실행과 같은 복잡한 작업을 수행하는 데 사용하는 도구입니다.  
Architect는 특정 빌더를 실행하여 주어진 작업을 수행하는 쉘입니다.  
새 빌더와 타겟을 정의하고 구성하여 Angular CLI를 확장할 수 있습니다.  
[Angular CLI Builders](tools/cli/cli-builder)를 참조하십시오.

### 기본 Architect 빌더 및 타겟

Angular는 특정 명령 또는 일반 `ng run` 명령과 함께 사용할 기본 빌더를 정의합니다.  
각 빌더의 옵션과 기본값을 정의하는 JSON 스키마는 [`@angular-devkit/build-angular`](https://github.com/angular/angular-cli/blob/main/packages/angular_devkit/build_angular/builders.json) 패키지에 수집되어 있습니다.  
스키마는 다음 빌더에 대한 옵션을 구성합니다.

### 빌더 타겟 구성

`angular.json`의 `architect` 섹션에는 일련의 Architect 타겟이 포함되어 있습니다.  
많은 타겟이 Angular CLI 명령과 일치합니다.  
기타 타겟은 `ng run` 명령을 사용하여 실행할 수 있으며, 사용자 정의 타겟을 정의할 수 있습니다.

각 타겟 객체는 해당 타겟에 대한 `builder`를 지정하며, 이는 Architect가 실행하는 도구의 npm 패키지입니다.  
각 타겟은 기본 옵션을 구성하는 `options` 섹션과 타겟에 대한 대체 구성을 지정하는 `configurations` 섹션도 가집니다.  
아래 [빌드 타겟](#build-target) 예제를 참조하십시오.

| 속성         | 세부정보                                                                                                                                                                                               |
|:---          |:---                                                                                                                                                                                                   |
| `build`      | `ng build` 명령의 옵션 기본값을 구성합니다. 더 많은 정보는 [빌드 타겟](#build-target) 섹션을 참조하십시오.                                                                                               |
| `serve`      | 빌드 기본값을 재정의하고 `ng serve` 명령을 위한 추가 제공 기본값을 제공합니다. `ng build` 명령에 사용할 수 있는 옵션 외에 애플리케이션 제공과 관련된 옵션이 추가됩니다.                      |
| `e2e`        | `ng e2e` 명령을 사용하여 끝까지 테스트 응용 프로그램 빌드를 위한 빌드 기본값을 재정의합니다.                                                                                                     |
| `test`       | 테스트 빌드를 위한 빌드 기본값을 재정의하고 `ng test` 명령을 위한 추가 테스트 실행 기본값을 제공합니다.                                                                                           |
| `lint`       | 프로젝트 소스 파일에 대한 정적 코드 분석을 수행하는 `ng lint` 명령의 옵션 기본값을 구성합니다.                                                                                                   |
| `extract-i18n` | 소스 코드에서 지역화된 메시지 문자열을 추출하고 국제화를 위한 번역 파일을 출력하는 `ng extract-i18n` 명령의 옵션 기본값을 구성합니다.                                                                 |

도움말: 구성 파일의 모든 옵션은 명령줄에서 사용하는 `dash-case`가 아닌 `camelCase`를 사용해야 합니다.

## 빌드 타겟

`architect` 아래 각 타겟은 다음 속성들을 가집니다:

| 속성          | 세부정보                                                                                                                                                                                                                                             |
|:---           |:---                                                                                                                                                                                                                                                 |
| `builder`     | `<package-name>:<builder-name>` 형식으로 이 타겟을 생성하는 데 사용되는 CLI 빌더입니다.                                                                                                                                                              |
| `options`     | 빌드 타겟 기본 옵션입니다.                                                                                                                                                                                                                            |
| `configurations`| 타겟을 실행하기 위한 대체 구성입니다. 각 구성은 의도된 환경에 대한 기본 옵션을 설정하고, `options` 아래의 값을 재정의합니다. [대체 빌드 구성](#alternate-build-configurations) 아래를 참조하십시오.                                 |

예를 들어, 최적화가 비활성화된 빌드를 구성하려면:

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "optimization": false
          }
        }
      }
    }
  }
}

</docs-code>

### 대체 빌드 구성

Angular CLI에는 두 개의 빌트 구성인 `production`과 `development`가 함께 제공됩니다.  
기본적으로 `ng build` 명령은 여러 빌드 최적화를 적용하는 `production` 구성을 사용합니다. 최적화의 예시는 다음과 같습니다:

* 파일 번들링
* 과도한 공백 최소화
* 주석 및 죽은 코드 제거
* 코드를 짧고 혼란스러운 이름으로 축소

개발 프로세스에 적합한 추가 대체 구성을 정의하고 이름을 지정할 수 있습니다 (예: `staging`).  
`--configuration` 명령줄 플래그에 이름을 전달하여 대체 구성을 선택할 수 있습니다.

예를 들어, 최적화를 생산 빌드에만 활성화하도록 빌드를 구성하려면 (`ng build --configuration production`):

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "optimization": false
          },
          "configurations": {
            "production": {
              "optimization": true
            }
          }
        }
      }
    }
  }
}

</docs-code>

쉼표로 구분된 목록으로 두 개 이상의 구성 이름을 전달할 수도 있습니다.  
예를 들어, `staging` 및 `french` 빌드 구성을 모두 적용하려면 명령어 `ng build --configuration staging,french`를 사용하십시오.  
이 경우 명령은 왼쪽에서 오른쪽으로 설정된 구성을 분석합니다.  
여러 구성에서 동일한 설정을 변경하는 경우 마지막에 설정된 값이 최종값이 됩니다.  
이 예제에서 `staging` 및 `french` 구성이 모두 출력 경로를 설정하면, `french`의 값이 사용됩니다.

### 추가 빌드 및 테스트 옵션

기본 또는 대상 빌드에 대한 구성 가능한 옵션은 일반적으로 [`ng build`](cli/build), [`ng serve`](cli/serve) 및 [`ng test`](cli/test) 명령에 사용할 수 있는 옵션과 일치합니다.  
이 옵션 및 가능한 값에 대한 자세한 내용은 [Angular CLI 참조](cli)를 참조하시기 바랍니다.

| 옵션 속성                | 세부정보                                                                                                                                                                                                                                                   |
|:---                       |:---                                                                                                                                                                                                                                                           |
| `assets`                  | 응용 프로그램과 함께 제공할 정적 자산에 대한 경로를 포함하는 개체입니다. 기본 경로는 프로젝트의 `public` 디렉터리를 가리킵니다. [자산 구성](#assets-configuration) 섹션을 참조하십시오.                                              |
| `styles`                  | 프로젝트의 글로벌 컨텍스트에 추가할 CSS 파일의 배열입니다. Angular CLI는 CSS 가져오기 및 모든 주요 CSS 전처리기를 지원합니다. [스타일 및 스크립트 구성](#styles-and-scripts-configuration) 섹션을 참조하십시오.                        |
| `stylePreprocessorOptions`| 스타일 전처리기에 전달할 옵션-값 쌍을 포함하는 개체입니다. [스타일 및 스크립트 구성](#styles-and-scripts-configuration) 섹션을 참조하십시오.                                                                                                     |
| `scripts`                 | 응용 프로그램에 추가할 JavaScript 파일을 포함하는 개체입니다. 스크립트는 `index.html` 내에서 `<script>` 태그를 추가한 것처럼 로드됩니다. [스타일 및 스크립트 구성](#styles-and-scripts-configuration) 섹션을 참조하십시오. |
| `budgets`                 | 애플리케이션의 전체 또는 일부에 대한 기본 크기 예산 유형 및 임계값입니다. 출력이 임계값 크기에 도달하거나 초과할 때 경고 또는 오류를 보고하도록 빌더를 구성할 수 있습니다. [크기 예산 구성](tools/cli/build#configure-size-budgets)를 참조하십시오.     |
| `fileReplacements`        | 파일 및 해당 컴파일 시간 대체를 포함하는 개체입니다. [대상 특정 파일 대체 구성](tools/cli/build#configure-target-specific-file-replacements) 섹션을 참조하십시오.                                                                |
| `index`                   | 응용 프로그램을 로드하는 기본 HTML 문서입니다. [인덱스 구성](#index-configuration) 섹션을 참조하십시오.                                                                                                                                              |

## 복잡한 구성 값

`assets`, `index`, `outputPath`, `styles`, 및 `scripts` 옵션은 간단한 경로 문자열 값 또는 특정 필드를 가진 개체 값을 가질 수 있습니다.  
`sourceMap` 및 `optimization` 옵션은 간단한 부울 값으로 설정할 수 있습니다. 구성 파일을 사용하여 복잡한 값을 제공할 수도 있습니다.

다음 섹션에서는 이러한 복잡한 값이 각 경우에 어떻게 사용되는지에 대한 자세한 정보를 제공합니다.

### 자산 구성

각 `build` 타겟 구성은 프로젝트를 빌드할 때 기존 파일을 그대로 복사할 파일 또는 폴더 목록을 나열하는 `assets` 배열을 포함할 수 있습니다.  
기본적으로 `public/` 디렉토리의 내용이 복사됩니다.

자산을 제외하려면 자산 구성에서 제거할 수 있습니다.

자산을 복사하도록 추가로 구성하려면 자산을 작업 공간 루트에 상대적인 간단한 경로가 아닌 개체로 지정할 수 있습니다.  
자산 사양 개체는 다음 필드를 가질 수 있습니다.

| 필드                | 세부정보                                                                                                                                    |
|:---                 |:---                                                                                                                                         |
| `glob`              | `input`을 기준 디렉토리로 사용하는 [node-glob](https://github.com/isaacs/node-glob/blob/master/README.md)입니다.                                   |
| `input`             | 작업 공간 루트에 상대적인 경로입니다.                                                                                                    |
| `output`            | `outDir`에 상대적인 경로입니다. 보안 때문에 Angular CLI는 프로젝트 출력 경로 외부에 파일을 작성하지 않습니다.                           |
| `ignore`            | 제외할 glob 목록입니다.                                                                                                                 |
| `followSymlinks`    | glob 패턴이 심볼릭 링크 디렉토리를 따르도록 허용합니다. 이로 인해 심볼릭 링크의 하위 디렉토리를 검색할 수 있습니다. 기본값은 `false`입니다.   |

예를 들어, 기본 자산 경로는 다음 개체를 사용하여 더 자세하게 표현할 수 있습니다.

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "assets": [
              {
                "glob": "**/*",
                "input": "src/assets/",
                "output": "/assets/"
              },
              {
                "glob": "favicon.ico",
                "input": "src/",
                "output": "/"
              }
            ]
          }
        }
      }
    }
  }
}

</docs-code>

다음 예제는 `ignore` 필드를 사용하여 자산 디렉토리에서 특정 파일을 빌드에 복사하지 않도록 합니다:

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "assets": [
              {
                "glob": "**/*",
                "input": "src/assets/",
                "ignore": ["**/*.svg"],
                "output": "/assets/"
              }
            ]
          }
        }
      }
    }
  }
}

</docs-code>

### 스타일 및 스크립트 구성

`styles` 및 `scripts` 옵션의 배열 항목은 간단한 경로 문자열일 수도 있고, 추가 엔트리 포인트 파일을 가리키는 개체일 수도 있습니다.  
연관된 빌더는 빌드 중에 별도로 해당 파일 및 종속성을 로드합니다.  
구성 개체를 사용하면 `bundleName` 필드를 사용하여 엔트리 포인트의 번들을 명명하는 옵션이 제공됩니다.

번들은 기본적으로 삽입되지만, 삽입에서 번들을 제외하려면 `inject`를 `false`로 설정할 수 있습니다.  
예를 들어, 다음 개체 값은 스타일 및 스크립트를 포함하고 있는 번들을 생성하고, 삽입에서 제외합니다:

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "styles": [
              {
                "input": "src/external-module/styles.scss",
                "inject": false,
                "bundleName": "external-module"
              }
            ],
            "scripts": [
              {
                "input": "src/external-module/main.js",
                "inject": false,
                "bundleName": "external-module"
              }
            ]
          }
        }
      }
    }
  }
}

</docs-code>

#### 스타일 전처리기 옵션

Sass에서는 구성 요소 및 전역 스타일 모두에 대해 `includePaths` 기능을 사용할 수 있습니다. 이를 통해 가져오기를 위해 추가 기본 경로를 추가할 수 있습니다.

경로를 추가하려면 `stylePreprocessorOptions` 옵션을 사용하십시오:

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "stylePreprocessorOptions": {
              "includePaths": [
                "src/style-paths"
              ]
            }
          }
        }
      }
    }
  }
}

</docs-code>

해당 디렉토리의 파일(예: `src/style-paths/_variables.scss`)을 프로젝트의 어느 곳에서나 상대 경로 없이 가져올 수 있습니다:

<docs-code language="scss">

// src/app/app.component.scss
// 상대 경로가 작동합니다
@import '../style-paths/variables';

// 그러나 이제 이것도 작동합니다
@import 'variables';

</docs-code>

도움말: 단위 테스트에 필요한 경우 `test` 빌더에도 모든 스타일 또는 스크립트를 추가해야 합니다.  
[애플리케이션 내에서 런타임 글로벌 라이브러리 사용](tools/libraries/using-libraries#using-runtime-global-libraries-inside-your-app)도 참조하십시오.

### 최적화 구성

`optimization` 옵션은 부울 또는 더 세밀한 구성 옵션을 위한 객체일 수 있습니다.  
이 옵션은 빌드 출력의 다양한 최적화를 활성화합니다. 예를 들어:

* 스크립트 및 스타일 최소화
* 트리 흔들기
* 죽은 코드 제거
* 중요한 CSS 인라인
* 폰트 인라인

여러 옵션을 사용하여 애플리케이션의 최적화를 세밀하게 조정할 수 있습니다.

| 옵션      | 세부정보                                                    | 값 유형                                                                      | 기본값   |
|:---       |:---                                                        |:---                                                                         |:---      |
| `scripts` | 스크립트 출력을 최적화합니다.                              | `boolean`                                                                   | `true`   |
| `styles`  | 스타일 출력을 최적화합니다.                               | `boolean` \| [스타일 최적화 옵션](#styles-optimization-options) | `true`   |
| `fonts`   | 폰트 최적화를 활성화합니다. 이 작업은 인터넷 액세스가 필요합니다. | `boolean` \| [폰트 최적화 옵션](#fonts-optimization-options)   | `true`   |

#### 스타일 최적화 옵션

| 옵션                | 세부정보                                                                                                                  | 값 유형 | 기본값   |
|:---                 |:---                                                                                                                      |:---      |:---      |
| `minify`            | 불필요한 공백 및 주석을 제거하고, 식별자를 병합하며, 값을 최소화하여 CSS 정의를 최소화합니다.                            | `boolean` | `true`   |
| `inlineCritical`    | [First Contentful Paint](https://web.dev/first-contentful-paint)를 개선하기 위해 중요한 CSS 정의를 추출하고 인라인으로 삽입합니다. | `boolean` | `true`   |
| `removeSpecialComments` | `@license` 또는 `@preserve`가 포함된 CSS의 전역 주석 또는 `//!` 또는 `/*!`로 시작하는 주석을 제거합니다.                    | `boolean` | `true`   |

#### 폰트 최적화 옵션

| 옵션     | 세부정보                                                                                                                                                                                                    | 값 유형 | 기본값   |
|:---      |:---                                                                                                                                                                                                        |:---      |:---      |
| `inline` | 외부 Google Fonts 및 Adobe Fonts CSS 정의를 애플리케이션의 HTML 인덱스 파일에 인라인화하여 [렌더 차단 요청](https://web.dev/render-blocking-resources)을 줄입니다. 이 작업은 인터넷 액세스가 필요합니다. | `boolean` | `true`   |

다음과 같은 값을 제공하여 하나 또는 다른 것에 대한 최적화를 적용할 수 있습니다:

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "optimization": {
              "scripts": true,
              "styles": {
                "minify": true,
                "inlineCritical": true
              },
              "fonts": true
            }
          }
        }
      }
    }
  }
}

</docs-code>

### 소스 맵 구성

`sourceMap` 빌더 옵션은 부울 또는 애플리케이션의 소스 맵을 제어하기 위한 더 세밀한 구성 옵션일 수 있습니다.

| 옵션     | 세부정보                                        | 값 유형 | 기본값   |
|:---      |:---                                            |:---      |:---      |
| `scripts` | 모든 스크립트에 대한 소스 맵을 출력합니다.      | `boolean` | `true`   |
| `styles`  | 모든 스타일에 대한 소스 맵을 출력합니다.       | `boolean` | `true`   |
| `vendor`  | 공급업체 패키지 소스 맵을 확인합니다.          | `boolean` | `false`  |
| `hidden`  | 출력 JavaScript에서 소스 맵에 대한 링크를 생략합니다. | `boolean` | `false`  |

아래의 예제는 하나 이상의 값을 토글하여 소스 맵 출력을 구성하는 방법을 보여줍니다:

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "sourceMap": {
              "scripts": true,
              "styles": false,
              "hidden": true,
              "vendor": true
            }
          }
        }
      }
    }
  }
}

</docs-code>

도움말: 숨겨진 소스 맵을 사용할 때, 소스 맵이 번들에 참조되지 않습니다.  
이러한 소스 맵은 브라우저 개발자 도구에 표시되지 않고, 오류 보고 도구의 스택 추적을 매핑하는 데 유용합니다.  
숨겨진 소스 맵이 출력 번들에 연결되지 않도록 해도, 배포 프로세스는 생성된 소스 맵을 프로덕션에서 제공하지 않도록 주의해야 하며, 그렇지 않으면 정보가 여전히 유출될 수 있습니다.

### 인덱스 구성

응용 프로그램의 HTML 인덱스 생성을 구성합니다.

`index` 옵션은 문자열 또는 더 세밀한 구성 옵션을 위한 객체일 수 있습니다.

문자열로 값을 제공할 때 지정된 경로의 파일 이름이 생성 파일에 사용되며, 애플리케이션의 구성된 출력 경로의 루트에 생성됩니다.

#### 인덱스 옵션

| 옵션     | 세부정보                                                                                                                                                | 값 유형 | 기본값         |
|:---      |:---                                                                                                                                                        |:---      |:---            |
| `input`  | 애플리케이션의 생성된 HTML 인덱스에 사용할 파일의 경로입니다.                                                                                                | `string` | 없음(필수)     |
| `output` | 애플리케이션의 생성된 HTML 인덱스 파일의 출력 경로입니다. 제공된 전체 경로가 사용되며, 애플리케이션의 구성된 출력 경로에 상대적입니다.                     | `string` | `index.html`    |

### 출력 경로 구성

`outputPath` 옵션은 문자열일 수 있으며, `base` 값을 사용하거나 더 세밀한 구성을 위한 객체일 수 있습니다.

여러 옵션을 사용하여 애플리케이션의 출력 구조를 세밀하게 조정할 수 있습니다.

| 옵션         | 세부정보                                                                                      | 값 유형 | 기본값     |
|:---          |:---                                                                                          |:---      |:---        |
| `base`       | 작업 공간 루트에 대해 출력 경로를 지정합니다.                                               | `string` |            |
| `browser`    | 브라우저 빌드의 출력 디렉토리 이름이 기본 출력 경로 내에 있습니다. 사용자에게 안전하게 제공할 수 있습니다.       | `string` | `browser`  |
| `server`     | 출력 경로 기본 내의 서버 빌드의 출력 디렉토리 이름입니다.                                   | `string` | `server`   |
| `media`      | 출력 브라우저 디렉토리 내에 위치한 미디어 파일의 출력 디렉토리 이름입니다. 이러한 미디어 파일은 CSS 파일에서 리소스로 일반적으로 언급됩니다. | `string` | `media`    |