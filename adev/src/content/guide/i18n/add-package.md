# 로컬라이즈 패키지 추가

Angular의 로컬라이즈 기능을 활용하기 위해 [Angular CLI][CliMain]를 사용하여 프로젝트에 `@angular/localize` 패키지를 추가하십시오.

`@angular/localize` 패키지를 추가하려면, 다음 명령어를 사용하여 프로젝트의 `package.json` 및 TypeScript 구성 파일을 업데이트하십시오.

<docs-code path="adev/src/content/examples/i18n/doc-files/commands.sh" visibleRegion="add-localize"/>

TypeScript 구성 파일에 `types: ["@angular/localize"]`가 추가됩니다.
또한 `main.ts` 파일의 상단에 `/// <reference types="@angular/localize" />` 줄이 추가되며, 이는 타입 정의에 대한 참조입니다.

도움말: `package.json` 및 `tsconfig.json` 파일에 대한 자세한 내용은 [작업 공간 npm 종속성][GuideNpmPackages] 및 [TypeScript 구성][GuideTsConfig]를 참조하십시오. 트리플 슬래시 지시문에 대해 배우려면 [TypeScript 핸드북](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-types-)을 방문하십시오.

`@angular/localize`가 설치되지 않고 지역화된 버전을 빌드하려고 하면(예: 템플릿에서 `i18n` 속성을 사용하는 경우) [Angular CLI][CliMain]가 오류를 생성하며, 이 오류에는 프로젝트에 대한 i18n을 활성화하기 위해 취할 수 있는 단계가 포함됩니다.

## 옵션

| 옵션              | 설명       | 값 유형   | 기본값
|:---               |:---       |:------    |:------
| `--project`      | 프로젝트 이름입니다. | `string` |
| `--use-at-runtime` | 설정하면 `$localize`를 런타임에 사용할 수 있습니다. 또한 `@angular/localize`가 기본값인 `devDependencies`가 아닌 `package.json`의 `dependencies` 섹션에 포함됩니다.  | `boolean` | `false`

더 많은 사용 가능한 옵션은 [Angular CLI][CliMain]에서 `ng add`를 참조하십시오.

## 다음 단계

<docs-pill-row>
  <docs-pill href="guide/i18n/locale-id" title="ID로 로케일 참조"/>
</docs-pill-row>

[CliMain]: cli "CLI 개요 및 명령 참조 | Angular"

[GuideNpmPackages]: reference/configs/npm-packages "작업 공간 npm 종속성 | Angular"

[GuideTsConfig]: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html "TypeScript 구성"