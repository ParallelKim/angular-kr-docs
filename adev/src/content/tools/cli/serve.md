# Angular 애플리케이션 개발을 위한 제공

`ng serve` 명령어로 Angular CLI 애플리케이션을 제공할 수 있습니다.
이 명령어는 애플리케이션을 컴파일하고, 불필요한 최적화를 건너뛰며, 개발 서버를 시작하고, 이후 변경사항을 자동으로 다시 빌드하고 라이브 리로드합니다.
서버를 중지하려면 `Ctrl+C`를 누르십시오.

`ng serve`는 `angular.json`에서 지정된 기본 프로젝트의 `serve` 타겟에 대한 빌더만 실행합니다.
여기에서 어떤 빌더라도 사용할 수 있지만, 가장 일반적이고 기본적인 빌더는 `@angular-devkit/build-angular:dev-server`입니다.

특정 프로젝트에 어떤 빌더가 사용되고 있는지 알아보려면 해당 프로젝트의 `serve` 타겟을 확인하십시오.

<docs-code language="json">

{
  "projects": {
    "my-app": {
      "architect": {
        // `ng serve`는 `serve`라는 이름의 Architect 타겟을 호출합니다.
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          // ...
        },
        "build": { /* ... */ }
        "test": { /* ... */ }
      }
    }
  }
}

</docs-code>

이 페이지는 `@angular-devkit/build-angular:dev-server`의 사용 및 옵션에 대해 설명합니다.

## 백엔드 서버로 프록시

[프록시 지원](https://webpack.js.org/configuration/dev-server/#devserverproxy)을 사용하여 특정 URL을 백엔드 서버로 전환하려면 `--proxy-config` 빌드 옵션에 파일을 전달하십시오.
예를 들어, `http://localhost:4200/api`에 대한 모든 호출을 `http://localhost:3000/api`에서 실행 중인 서버로 전환하려면 다음 단계를 따르십시오.

1. 프로젝트의 `src/` 폴더에 `proxy.conf.json` 파일을 생성합니다.
1. 새 프록시 파일에 다음 내용을 추가합니다:

    <docs-code language="json">

    {
      "/api": {
        "target": "http://localhost:3000",
        "secure": false
      }
    }

    </docs-code>

1. CLI 구성 파일인 `angular.json`에서 `serve` 타겟에 `proxyConfig` 옵션을 추가합니다:

    <docs-code language="json">

    {
      "projects": {
        "my-app": {
          "architect": {
            "serve": {
              "builder": "@angular-devkit/build-angular:dev-server",
              "options": {
                "proxyConfig": "src/proxy.conf.json"
              }
            }
          }
        }
      }
    }

    </docs-code>

1. 이 프록시 구성으로 개발 서버를 실행하려면 `ng serve`를 호출하십시오.

프록시 구성 파일을 편집하여 구성 옵션을 추가하십시오. 다음은 몇 가지 예입니다.
모든 옵션에 대한 자세한 설명은 `@angular-devkit/build-angular:browser`를 사용할 때 [webpack DevServer 문서](https://webpack.js.org/configuration/dev-server/#devserverproxy)를 참조하거나, `@angular-devkit/build-angular:browser-esbuild` 또는 `@angular-devkit/build-angular:application`을 사용할 때는 [Vite DevServer 문서](https://vite.dev/config/server-options#server-proxy)를 참조하십시오.

참고: 프록시 구성 파일을 편집한 경우 변경 사항을 적용하려면 `ng serve` 프로세스를 다시 시작해야 합니다.

## `localhost` 해상도

Node 버전 17부터는 각 머신의 구성에 따라 Node가 `http://localhost:<port>`를 항상 `http://127.0.0.1:<port>`로 해소하지 않습니다.

프록시가 `localhost` URL을 대상으로 할 때 `ECONNREFUSED` 오류가 발생하는 경우,
대상을 `http://localhost:<port>`에서 `http://127.0.0.1:<port>`로 업데이트하여 이 문제를 해결할 수 있습니다.

자세한 내용은 [http-proxy-middleware 문서](https://github.com/chimurai/http-proxy-middleware#nodejs-17-econnrefused-issue-with-ipv6-and-localhost-705)를 참조하십시오.