# 다국어 배포

`myapp`이 프로젝트의 배포 파일을 포함하는 디렉터리인 경우, 일반적으로 로케일 디렉터리에서 서로 다른 로케일에 대해 다른 버전을 제공합니다. 예를 들어, 프랑스어 버전은 `myapp/fr` 디렉터리에 위치하고 스페인어 버전은 `myapp/es` 디렉터리에 위치합니다.

HTML `base` 태그의 `href` 속성은 상대 링크에 대한 기본 URI 또는 URL을 지정합니다. [`angular.json`][GuideWorkspaceConfig] 작업 공간 빌드 구성 파일에서 `"localize"` 옵션을 `true`로 설정하거나 로케일 ID 배열로 설정하면 CLI가 각 애플리케이션 버전에 대한 기본 `href`를 조정합니다. 각 애플리케이션 버전에 대한 기본 `href`를 조정하기 위해 CLI는 구성된 `"subPath"`에 로케일을 추가합니다. 각각의 로케일에 대한 `"subPath"`를 [`angular.json`][GuideWorkspaceConfig] 작업 공간 빌드 구성 파일에 지정하십시오. 다음 예제는 `"subPath"`가 빈 문자열로 설정된 모습을 보여줍니다.

<docs-code header="angular.json" path="adev/src/content/examples/i18n/angular.json" visibleRegion="i18n-subPath"/>

## 서버 구성

다국어의 일반적인 배포는 각 언어를 서로 다른 하위 디렉터리에서 제공합니다. 사용자는 `Accept-Language` HTTP 헤더를 사용하여 브라우저에서 정의된 기본 언어로 리디렉션됩니다. 사용자가 선호하는 언어를 정의하지 않았거나 선호하는 언어가 사용 불가능한 경우, 서버는 기본 언어로 되돌아 갑니다. 언어를 변경하려면 현재 위치를 다른 하위 디렉터리로 변경하십시오. 하위 디렉터리의 변경은 종종 애플리케이션에 구현된 메뉴를 사용하여 발생합니다.

원격 서버에 앱을 배포하는 방법에 대한 자세한 정보는 [배포][GuideDeployment]를 참조하십시오.

중요: `outputMode`가 `server`로 설정된 [서버 렌더링](guide/ssr)을 사용하는 경우 Angular는 `Accept-Language` HTTP 헤더에 따라 동적으로 리디렉션을 자동으로 처리합니다. 이는 수동 서버 또는 구성 조정이 필요 없으므로 배포를 단순화합니다.

### Nginx 예제

다음 예제는 Nginx 구성 파일을 보여줍니다.

<docs-code path="adev/src/content/examples/i18n/doc-files/nginx.conf" language="nginx"/>

### Apache 예제

다음 예제는 Apache 구성 파일을 보여줍니다.

<docs-code path="adev/src/content/examples/i18n/doc-files/apache2.conf" language="apache"/>

[CliBuild]: cli/build "ng build | CLI | Angular"

[GuideDeployment]: tools/cli/deployment "배포 | Angular"

[GuideWorkspaceConfig]: reference/configs/workspace-config "Angular 작업 공간 구성 | Angular"