# 애플리케이션에 HTTP 통신 추가하기

이 튜토리얼은 애플리케이션에 HTTP와 API를 통합하는 방법을 보여줍니다.

지금까지 애플리케이션은 Angular 서비스의 정적 배열에서 데이터를 읽어왔습니다. 다음 단계는 애플리케이션이 HTTP를 통해 통신할 JSON 서버를 사용하는 것입니다. HTTP 요청은 서버의 데이터 작업을 시뮬레이션합니다.

<docs-video src="https://www.youtube.com/embed/5K10oYJ5Y-E?si=TiuNKx_teR9baO7k"/>

중요: 이 튜토리얼의 이 단계에서는 로컬 환경을 사용하는 것을 권장합니다.

## 배울 내용

애플리케이션은 JSON 서버의 데이터를 사용합니다.

<docs-workflow>

<docs-step title="JSON 서버 구성하기">
JSON 서버는 모의 REST API를 생성하는 데 사용되는 오픈 소스 도구입니다. 현재 주택 서비스에 저장된 주택 위치 데이터를 제공하는 데 사용할 것입니다.

1. 다음 명령어를 사용하여 npm에서 `json-server`를 설치합니다.
    <docs-code language="bash">
        npm install -g json-server
    </docs-code>

1. 프로젝트의 루트 디렉토리에 `db.json`이라는 파일을 만듭니다. 여기서 `json-server`의 데이터를 저장합니다.

1. `db.json`을 열고 다음 코드를 파일에 복사합니다.
    <docs-code language="json">
        {
            "locations": [
                {
                    "id": 0,
                    "name": "Acme Fresh Start Housing",
                    "city": "Chicago",
                    "state": "IL",
                    "photo": "https://angular.dev/assets/images/tutorials/common/bernard-hermant-CLKGGwIBTaY-unsplash.jpg",
                    "availableUnits": 4,
                    "wifi": true,
                    "laundry": true
                },
                {
                    "id": 1,
                    "name": "A113 Transitional Housing",
                    "city": "Santa Monica",
                    "state": "CA",
                    "photo": "https://angular.dev/assets/images/tutorials/common/brandon-griggs-wR11KBaB86U-unsplash.jpg",
                    "availableUnits": 0,
                    "wifi": false,
                    "laundry": true
                },
                {
                    "id": 2,
                    "name": "Warm Beds Housing Support",
                    "city": "Juneau",
                    "state": "AK",
                    "photo": "https://angular.dev/assets/images/tutorials/common/i-do-nothing-but-love-lAyXdl1-Wmc-unsplash.jpg",
                    "availableUnits": 1,
                    "wifi": false,
                    "laundry": false
                },
                {
                    "id": 3,
                    "name": "Homesteady Housing",
                    "city": "Chicago",
                    "state": "IL",
                    "photo": "https://angular.dev/assets/images/tutorials/common/ian-macdonald-W8z6aiwfi1E-unsplash.jpg",
                    "availableUnits": 1,
                    "wifi": true,
                    "laundry": false
                },
                {
                    "id": 4,
                    "name": "Happy Homes Group",
                    "city": "Gary",
                    "state": "IN",
                    "photo": "https://angular.dev/assets/images/tutorials/common/krzysztof-hepner-978RAXoXnH4-unsplash.jpg",
                    "availableUnits": 1,
                    "wifi": true,
                    "laundry": false
                },
                {
                    "id": 5,
                    "name": "Hopeful Apartment Group",
                    "city": "Oakland",
                    "state": "CA",
                    "photo": "https://angular.dev/assets/images/tutorials/common/r-architecture-JvQ0Q5IkeMM-unsplash.jpg",
                    "availableUnits": 2,
                    "wifi": true,
                    "laundry": true
                },
                {
                    "id": 6,
                    "name": "Seriously Safe Towns",
                    "city": "Oakland",
                    "state": "CA",
                    "photo": "https://angular.dev/assets/images/tutorials/common/phil-hearing-IYfp2Ixe9nM-unsplash.jpg",
                    "availableUnits": 5,
                    "wifi": true,
                    "laundry": true
                },
                {
                    "id": 7,
                    "name": "Hopeful Housing Solutions",
                    "city": "Oakland",
                    "state": "CA",
                    "photo": "https://angular.dev/assets/images/tutorials/common/r-architecture-GGupkreKwxA-unsplash.jpg",
                    "availableUnits": 2,
                    "wifi": true,
                    "laundry": true
                },
                {
                    "id": 8,
                    "name": "Seriously Safe Towns",
                    "city": "Oakland",
                    "state": "CA",
                    "photo": "https://angular.dev/assets/images/tutorials/common/saru-robert-9rP3mxf8qWI-unsplash.jpg",
                    "availableUnits": 10,
                    "wifi": false,
                    "laundry": false
                },
                {
                    "id": 9,
                    "name": "Capital Safe Towns",
                    "city": "Portland",
                    "state": "OR",
                    "photo": "https://angular.dev/assets/images/tutorials/common/webaliser-_TPTXZd9mOo-unsplash.jpg",
                    "availableUnits": 6,
                    "wifi": true,
                    "laundry": true
                }
            ]
        }
    </docs-code>

1. 이 파일을 저장합니다.

1. 구성을 테스트할 시간입니다. 명령줄에서 프로젝트의 루트에서 다음 명령어를 실행합니다.

    <docs-code language="bash">
        json-server --watch db.json
    </docs-code>

1. 웹 브라우저에서 `http://localhost:3000/locations`로 이동하여 응답에 `db.json`에 저장된 데이터가 포함되어 있는지 확인합니다.

구성에 문제가 있는 경우 [공식 문서](https://www.npmjs.com/package/json-server)에서 더 많은 정보를 찾을 수 있습니다.
</docs-step>

<docs-step title="로컬 배열 대신 웹 서버를 사용하도록 서비스 업데이트하기">
데이터 출처가 구성되었으므로 다음 단계는 웹 애플리케이션을 업데이트하여 이를 연결하는 것입니다.

1. `src/app/housing.service.ts`에서 다음과 같은 변경을 합니다:

    1. `housingLocationList` 속성과 데이터를 포함하는 배열을 제거하도록 코드를 업데이트합니다.

    1. `url`이라는 문자열 속성을 추가하고 그 값을 `'http://localhost:3000/locations'`으로 설정합니다.

        <docs-code language="javascript">
        url = 'http://localhost:3000/locations';
        </docs-code>

        이 코드는 나머지 파일에서 `housingLocationList` 속성에 의존하기 때문에 오류를 발생시킵니다. 이제 서비스 메서드를 업데이트할 것입니다.

    1. `getAllHousingLocations` 함수를 업데이트하여 구성한 웹 서버에 호출하도록 합니다.

        <docs-code header="" path="adev/src/content/tutorials/first-app/steps/14-http/src-final/app/housing.service.ts" visibleLines="[10,13]"/>

        이제 이 코드는 HTTP를 통해 **GET** 요청을 수행하기 위해 비동기 코드를 사용합니다.

        도움이 되는 정보: 이 예제에서는 `fetch`를 사용합니다. 더 고급 사용 사례의 경우 Angular에서 제공하는 `HttpClient`를 사용하는 것을 고려하십시오.

    1. `getHousingLocationsById` 함수를 업데이트하여 구성한 웹 서버에 호출하도록 합니다.

        <docs-code header="" path="adev/src/content/tutorials/first-app/steps/14-http/src-final/app/housing.service.ts" visibleLines="[15,18]"/>

    1. 모든 업데이트가 완료되면 업데이트된 서비스는 다음 코드와 일치해야 합니다.

        <docs-code header="housing.service.ts의 최종 버전" path="adev/src/content/tutorials/first-app/steps/14-http/src-final/app/housing.service.ts" visibleLines="[1,24]" />

</docs-step>

<docs-step title="주택 서비스에 비동기 호출을 사용하도록 구성 요소 업데이트하기">
서버는 이제 HTTP 요청에서 데이터를 읽고 있지만, 서비스에 의존하는 구성 요소는 동기 버전을 사용하도록 프로그래밍되어 있었기 때문에 오류가 발생합니다.

1. `src/app/home/home.component.ts`에서 `constructor`를 업데이트하여 새로운 비동기 버전의 `getAllHousingLocations` 메서드를 사용하도록 합니다.

    <docs-code header="" path="adev/src/content/tutorials/first-app/steps/14-http/src-final/app/home/home.component.ts" visibleLines="[32,37]"/>

1. `src/app/details/details.component.ts`에서 `constructor`를 업데이트하여 새로운 비동기 버전의 `getHousingLocationById` 메서드를 사용하도록 합니다.

    <docs-code header="" path="adev/src/content/tutorials/first-app/steps/14-http/src-final/app/details/details.component.ts" visibleLines="[61,66]"/>

1. 코드를 저장합니다.

1. 브라우저에서 애플리케이션을 열고 오류 없이 실행되는지 확인합니다.
</docs-step>

</docs-workflow>

참고: 이 강의는 `fetch` 브라우저 API에 의존합니다. 인터셉터 지원에 대한 자세한 내용은 [Http Client 문서](/guide/http)를 참조하십시오.

요약: 이 강의에서는 로컬 웹 서버(`json-server`)를 사용하도록 애플리케이션을 업데이트하고 비동기 서비스 메서드를 사용하여 데이터를 검색하도록 했습니다.

축하합니다! 이 튜토리얼을 성공적으로 완료했으며, 더 복잡한 Angular Apps를 구축하는 여정을 계속할 준비가 되었습니다.

더 배우고 싶다면 Angular의 다른 개발자 [튜토리얼](tutorials)과 [가이드](overview)을 완료하는 것을 고려해 보세요.