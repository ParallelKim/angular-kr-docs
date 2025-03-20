# Angular 코딩 스타일 가이드

Angular 구문, 규칙 및 애플리케이션 구조에 대한 의견이 반영된 가이드를 찾고 계십니까?  
바로 들어오세요.  
이 스타일 가이드는 선호하는 규칙을 제시하고, 그 이유를 설명합니다.

## 스타일 용어

각 지침은 좋은 또는 나쁜 관행을 설명하며, 모두 일관된 표현을 가지고 있습니다.  
각 지침의 표현은 권장 정도를 나타냅니다.

**Do**는 항상 따르야 하는 규칙입니다.  
*항상* 이라는 단어는 다소 강할 수 있습니다.  
정말로 항상 준수해야 하는 규칙은 극히 드뭅니다.  
반면, *Do* 지침을 위반해야 하는 경우는 정말로 특별한 경우입니다.

**Consider** 지침은 일반적으로 따르는 것이 좋습니다.  
규칙의 의미를 완전히 이해하고 따르지 않을 이유가 분명하다면 그렇게 하십시오.  
일관성을 유지하는 것이 목표입니다.

**Avoid**는 거의 하지 말아야 할 것을 의미합니다.  
*Avoid*할 코드 예시는 눈에 띄는 빨간색 머리글이 있습니다.

**왜**? <br />
이전 권장 사항을 따르는 이유를 제공합니다.

## 파일 구조 규칙

일부 코드 예시는 하나 이상의 유사한 이름의 보조 파일이 있는 파일을 표시합니다.  
예를 들어, `hero.component.ts` 및 `hero.component.html`.

지침에서는 이러한 다양한 파일을 나타내기 위해 단축키 `hero.component.ts|html|css|spec`를 사용합니다.  
이 단축키를 사용하면 이 가이드의 파일 구조를 더 쉽게 읽을 수 있습니다.

## 단일 책임

모든 구성 요소, 서비스 및 기타 기호에 [*단일 책임 원칙(SRP)*](https://wikipedia.org/wiki/Single_responsibility_principle)를 적용합니다.  
이것은 애플리케이션을 더 깔끔하고 읽기 쉬우며 유지 보수가 용이하고 테스트 가능하게 만듭니다.

### 하나의 규칙

#### 스타일 01-01

**Do** 파일당 하나의 서비스나 구성 요소와 같은 것만 정의하십시오.

**Consider** 파일을 400줄로 제한하는 것을 고려하십시오.

**왜**? <br />
파일당 하나의 구성 요소는 읽기, 유지 보수 및 소스 제어에서 팀 간 충돌을 피하는 데 훨씬 쉽게 만듭니다.

**왜**? <br />
파일당 하나의 구성 요소는 변수 공유, 원치 않는 클로저 생성 또는 종속성과의 원치 않는 결합이 발생할 수 있는 파일 내에서 구성 요소를 결합할 때 종종 발생하는 숨겨진 버그를 방지합니다.

**왜**? <br />
단일 구성 요소는 해당 파일의 기본 내보내기가 될 수 있어 라우터와 함께 지연 로딩을 용이하게 합니다.

핵심은 코드를 더 재사용 가능하게 하고, 읽기 쉽게 만들고, 실수를 덜 하게 만드는 것입니다.

다음 *부정적인* 예시는 `AppComponent`를 정의하고, 앱을 부트스트랩하고, `Hero` 모델 객체를 정의하며, 서버에서 영웅을 모두 같은 파일에서 로드합니다.  
*이런 식으로 하지 마세요*.

<docs-code path="adev/src/content/examples/styleguide/src/01-01/app/heroes/hero.component.avoid.ts" language="typescript" header="app/heroes/hero.component.ts"/>

구성 요소와 해당 지원 클래스를 전용 파일로 재배포하는 것이 더 나은 관행입니다.

<docs-code-multifile>
    <docs-code header="main.ts" path="adev/src/content/examples/styleguide/src/01-01/main.ts"/>
    <docs-code header="app/app.module.ts" path="adev/src/content/examples/styleguide/src/01-01/app/app.module.ts"/>
    <docs-code header="app/app.component.ts" path="adev/src/content/examples/styleguide/src/01-01/app/app.component.ts"/>
    <docs-code header="app/heroes/heroes.component.ts" path="adev/src/content/examples/styleguide/src/01-01/app/heroes/heroes.component.ts"/>
    <docs-code header="app/heroes/shared/hero.service.ts" path="adev/src/content/examples/styleguide/src/01-01/app/heroes/shared/hero.service.ts"/>
    <docs-code header="app/heroes/shared/hero.model.ts" path="adev/src/content/examples/styleguide/src/01-01/app/heroes/shared/hero.model.ts"/>
    <docs-code header="app/heroes/shared/mock-heroes.ts" path="adev/src/content/examples/styleguide/src/01-01/app/heroes/shared/mock-heroes.ts"/>
</docs-code-multifile>

애플리케이션이 성장함에 따라 이 규칙은 더욱 중요해집니다.

## 명명

명명 규칙은 유지 보수성과 가독성에 매우 중요합니다.  
이 가이드는 파일 이름과 기호 이름에 대한 명명 규칙을 추천합니다.

### 일반 명명 규칙

#### 스타일 02-01

**Do** 모든 기호에 대해 일관된 이름을 사용하십시오.

**Do** 기호의 기능을 설명하는 패턴을 따르고 그 다음에는 타입을 설명하십시오.  
추천 패턴은 `feature.type.ts`입니다.

**왜**? <br />
명명 규칙은 내용을 한눈에 쉽게 찾을 수 있는 일관된 방법을 제공하는 데 도움이 됩니다.  
프로젝트 내의 일관성이 중요합니다.  
팀 내 일관성도 중요합니다.  
회사의 일관성은 엄청난 효율성을 제공합니다.

**왜**? <br />
명명 규칙은 원하는 코드를 더 빨리 찾을 수 있도록 도와주고 이해하기 쉽게 만듭니다.

**왜**? <br />
폴더와 파일의 이름은 그 의도를 명확하게 전달해야 합니다.  
예를 들어, `app/heroes/hero-list.component.ts`는 영웅 목록을 관리하는 구성 요소를 포함할 수 있습니다.

### 파일 이름을 점과 대시로 구분

#### 스타일 02-02

**Do** 설명적인 이름의 단어를 구분하기 위해 대시를 사용하십시오.

**Do** 설명적인 이름과 타입 이름을 구분하기 위해 점을 사용하십시오.

**Do** 모든 구성 요소에 대해 일관된 타입 이름을 사용하십시오. 구성 요소의 기능을 설명하는 패턴을 따르십시오.  
추천 패턴은 `feature.type.ts`입니다.

**Do** `.service`, `.component`, `.pipe`, `.module`, 및 `.directive`와 같은 관습적인 타입 이름을 사용하십시오.  
추가 타입 이름을 만들 필요가 있다면 너무 많이 만들지 않도록 주의하십시오.

**왜**? <br />
타입 이름은 파일에 무엇이 들어 있는지를 빠르게 식별할 수 있는 일관된 방법을 제공합니다.

**왜**? <br />
타입 이름은 에디터나 IDE의 퍼지 검색 기술을 사용하여 특정 파일 유형을 쉽게 찾을 수 있도록 합니다.

**왜**? <br />
`.service`와 같은 비축약 방식의 타입 이름은 설명적이며 모호하지 않습니다.  
`.srv`, `.svc`, 및 `.serv`와 같은 약어는 혼란을 줄 수 있습니다.

**왜**? <br />
타입 이름은 자동화 작업을 위한 패턴 매칭을 제공합니다.

### 기호 및 파일 이름

#### 스타일 02-03

**Do** 자신이 나타내는 것에 따라 이름을 붙인 모든 자산에 대해 일관된 이름을 사용하십시오.

**Do** 클래스 이름에 대해 대문자 카멜 표기법을 사용하십시오.

**Do** 기호의 이름을 파일의 이름과 일치시킵니다.

**Do** 해당 유형의 항목에 대한 전통적인 접미사 \(예: `Component`, `Directive`, `Module`, `Pipe`, 또는 `Service`\)로 기호 이름을 추가하십시오.

**Do** 해당 유형의 파일에 대해 전통적인 접미사 \(예: `.component.ts`, `.directive.ts`, `.module.ts`, `.pipe.ts`, 또는 `.service.ts`\)를 파일 이름에 추가하십시오.

**왜**? <br />
일관된 규칙은 다양한 유형의 자산을 빠르게 식별하고 참조할 수 있도록 쉽게 만듭니다.

| 기호 이름                                                                                                                                                                          | 파일 이름 |
|:---                                                                                                                                                                                  |:---       |
| <docs-code hideCopy language="typescript"> @Component({ … }) <br>export class AppComponent { } </docs-code>                             | app.component.ts |
| <docs-code hideCopy language="typescript"> @Component({ … }) <br>export class HeroesComponent { } </docs-code>                          | heroes.component.ts |
| <docs-code hideCopy language="typescript"> @Component({ … }) <br>export class HeroListComponent { } </docs-code>                        | hero-list.component.ts |
| <docs-code hideCopy language="typescript"> @Component({ … }) <br>export class HeroDetailComponent { } </docs-code>                      | hero-detail.component.ts |
| <docs-code hideCopy language="typescript"> @Directive({ … }) <br>export class ValidationDirective { } </docs-code>                      | validation.directive.ts |
| <docs-code hideCopy language="typescript"> @NgModule({ … }) <br>export class AppModule </docs-code>                                     | app.module.ts |
| <docs-code hideCopy language="typescript"> @Pipe({ name: 'initCaps' }) <br>export class InitCapsPipe implements PipeTransform { } </docs-code> | init-caps.pipe.ts |
| <docs-code hideCopy language="typescript"> @Injectable() <br>export class UserProfileService { } </docs-code>                                  | user-profile.service.ts |

### 서비스 이름

#### 스타일 02-04

**Do** 자신들의 기능에 따라 이름을 붙인 모든 서비스에 대해 일관된 이름을 사용하십시오.

**Do** 서비스 클래스 이름에 `Service`를 접미사로 붙이십시오.  
예를 들어, 데이터를 가져오거나 영웅을 가져오는 항목은 `DataService` 또는 `HeroService`로 불려야 합니다.

몇 가지 용어는 서비스임을 명확히 나타냅니다.  
그들은 일반적으로 "-er"로 끝나는 에이전시를 나타냅니다.  
메시지를 기록하는 서비스를 `LoggerService`보다 `Logger`라고 명명하는 것을 선호할 수 있습니다.  
이 예외가 프로젝트에서 수용 가능한지 결정하십시오.  
항상 일관성을 유지하기 위해 노력하십시오.

**왜**? <br />
서비스를 빠르게 식별하고 참조할 수 있는 일관된 방법을 제공합니다.

**왜**? <br />
`Logger`와 같은 명확한 서비스 이름은 접미사가 필요 없습니다.

**왜**? <br />
`Credit`와 같은 서비스 이름은 명사이고 접미사가 필요하며 서비스인지 다른 것인지 명확하지 않을 경우 접미사를 붙여야 합니다.

| 기호 이름                                                                                                                                      | 파일 이름 |
|:---                                                                                                                                              |:---       |
| <docs-code hideCopy language="typescript"> @Injectable() <br>export class HeroDataService { } </docs-code> | hero-data.service.ts |
| <docs-code hideCopy language="typescript"> @Injectable() <br>export class CreditService { } </docs-code>   | credit.service.ts    |
| <docs-code hideCopy language="typescript"> @Injectable() <br>export class Logger { } </docs-code>          | logger.service.ts    |

### 부트스트래핑

#### 스타일 02-05

**Do** 애플리케이션의 부트스트래핑 및 플랫폼 로직을 `main.ts`라는 파일에 넣으십시오.

**Do** 부트스트래핑 로직에 오류 처리를 포함하십시오.

**Avoid** `main.ts`에 애플리케이션 로직을 넣지 마십시오.  
대신, 이를 구성 요소 또는 서비스에 두는 것이 좋습니다.

**왜**? <br />
앱의 시작 로직에 대해 일관된 규칙을 따릅니다.

**왜**? <br />
다른 기술 플랫폼에서 익숙한 규칙을 따릅니다.

<docs-code header="main.ts" path="adev/src/content/examples/styleguide/src/02-05/main.ts"/>

### 구성 요소 선택자

#### 스타일 05-02

**Do** 구성 요소의 요소 선택자를 이름 짓는 데 *대시 대소문자* 또는 *케밥 대소문자*를 사용하십시오.

**왜**? <br />
요소 이름을 [Custom Elements](https://www.w3.org/TR/custom-elements) 사양과 일치시킵니다.

<docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/05-02/app/heroes/shared/hero-button/hero-button.component.avoid.ts" visibleRegion="example"/>

<docs-code-multifile>
    <docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/05-02/app/heroes/shared/hero-button/hero-button.component.ts" visibleRegion="example"/>
    <docs-code header="app/app.component.html" path="adev/src/content/examples/styleguide/src/05-02/app/app.component.html"/>
</docs-code-multifile>

### 구성 요소 사용자 정의 접두사

#### 스타일 02-07

**Do** 하이픈이 있는 소문자 요소 선택기 값을 사용하십시오. 예를 들어, `admin-users`.

**Do** 기능 영역이나 애플리케이션 자체를 식별하는 접두사를 사용하십시오.

**왜**? <br />
다른 애플리케이션의 구성 요소 및 기본 HTML 요소와 이름 충돌을 방지합니다.

**왜**? <br />
다른 애플리케이션에서 구성 요소를 홍보하고 공유하기 쉽게 만듭니다.

**왜**? <br />
DOM에서 구성 요소를 쉽게 식별할 수 있습니다.

<docs-code header="app/heroes/hero.component.ts" path="adev/src/content/examples/styleguide/src/02-07/app/heroes/hero.component.avoid.ts" visibleRegion="example"/>

<docs-code header="app/users/users.component.ts" path="adev/src/content/examples/styleguide/src/02-07/app/users/users.component.avoid.ts" visibleRegion="example"/>

<docs-code header="app/heroes/hero.component.ts" path="adev/src/content/examples/styleguide/src/02-07/app/heroes/hero.component.ts" visibleRegion="example"/>

<docs-code header="app/users/users.component.ts" path="adev/src/content/examples/styleguide/src/02-07/app/users/users.component.ts" visibleRegion="example"/>

### 지시자 선택자

#### 스타일 02-06

**Do** 지시자의 선택자 이름에 대해 소문자 카멜 표기법을 사용하십시오.

**왜**? <br />
보기와 바인딩된 지시자에서 정의된 속성 이름이 속성 이름과 일치하게 유지됩니다.

**왜**? <br />
Angular HTML 파서는 대소문자를 구분하며 소문자 카멜 표기법을 인식합니다.

### 지시자 사용자 정의 접두사

#### 스타일 02-08

**Do** 요소가 아닌 선택자는 소문자 카멜 표기법으로 표기합니다. 지시자가 기본 HTML 속성과 일치하는 경우는 제외입니다.

**Don't** 지시자 이름에 `ng`로 접두어를 붙이지 마십시오. 그 접두사는 Angular에 예약되어 있으며, 사용하면 진단하기 어려운 버그를 초래할 수 있습니다.

**왜**? <br />
이름 충돌을 방지합니다.

**왜**? <br />
지시자를 쉽게 식별할 수 있습니다.

<docs-code header="app/shared/validate.directive.ts" path="adev/src/content/examples/styleguide/src/02-08/app/shared/validate.directive.avoid.ts" visibleRegion="example"/>

<docs-code header="app/shared/validate.directive.ts" path="adev/src/content/examples/styleguide/src/02-08/app/shared/validate.directive.ts" visibleRegion="example"/>

### 파이프 이름

#### 스타일 02-09

**Do** 모든 파이프에 대해 일관된 이름을 사용하십시오. 각 파이프는 그 기능에 맞춰 이름을 붙여야 합니다.  
파이프 클래스 이름은 `UpperCamelCase` \(클래스 이름의 일반 규칙\)를 사용하고, 해당하는 `name` 문자열은 *lowerCamelCase*를 사용해야 합니다.  
`name` 문자열은 하이픈을 사용할 수 없습니다 \("대시 대소문자" 또는 "케밥 대소문자"\).

**왜**? <br />
파이프를 빠르게 식별하고 참조할 수 있는 일관된 방법을 제공합니다.

| 기호 이름                                                                                                                                                                          | 파일 이름 |
|:---                                                                                                                                                                                  |:---       |
| <docs-code hideCopy language="typescript"> @Pipe({ name: 'ellipsis' }) <br>export class EllipsisPipe implements PipeTransform { } </docs-code> | ellipsis.pipe.ts  |
| <docs-code hideCopy language="typescript"> @Pipe({ name: 'initCaps' }) <br>export class InitCapsPipe implements PipeTransform { } </docs-code> | init-caps.pipe.ts |

### 단위 테스트 파일 이름

#### 스타일 02-10

**Do** 테스트 사양 파일의 이름을 해당 테스트의 구성 요소와 동일하게 지정하십시오.

**Do** 테스트 사양 파일 이름에 `.spec` 접미사를 붙이십시오.

**왜**? <br />
테스트를 빠르게 식별할 수 있는 일관된 방법을 제공합니다.

**왜**? <br />
[karma](https://karma-runner.github.io) 또는 기타 테스트 실행기를 위한 패턴 매칭을 제공합니다.

| 테스트 유형 | 파일 이름 |
|:---        |:---        |
| 구성 요소 | heroes.component.spec.ts <br /> hero-list.component.spec.ts <br /> hero-detail.component.spec.ts |
| 서비스   | logger.service.spec.ts <br /> hero.service.spec.ts <br /> filter-text.service.spec.ts            |
| 파이프      | ellipsis.pipe.spec.ts <br /> init-caps.pipe.spec.ts                                              |

## 애플리케이션 구조 및 NgModules

구현에 대한 단기적 관점을 갖고 장기적 비전을 세우십시오.  
작게 시작하되 애플리케이션이 향후 나아갈 방향을 염두에 두십시오.

애플리케이션의 모든 코드는 `src`라는 폴더에 저장됩니다.  
모든 기능 영역은 각각의 폴더에 위치합니다.

모든 콘텐츠는 파일당 하나의 자산입니다.  
각 구성 요소, 서비스 및 파이프는 각자의 파일에 있습니다.  
모든 서드파티 벤더 스크립트는 다른 폴더에 저장되고 `src` 폴더에 저장되지 않습니다.  
파일에 대한 이 가이드의 명명 규칙을 사용하십시오.

### 전체 구조 규칙

#### 스타일 04-06

**Do** 작게 시작하되 애플리케이션이 향후 나아갈 방향을 염두에 두십시오.

**Do** 구현에 대해 단기적 관점을 갖고 장기적 비전을 세우십시오.

**Do** 애플리케이션의 모든 코드를 `src`라는 폴더에 넣으십시오.

**Consider** 여러 개의 보조 파일 \(`.ts`, `.html`, `.css`, 및 `.spec`\)이 있는 경우 구성 요소 폴더를 만드는 것을 고려하십시오.

**왜**? <br />
애플리케이션 구조를 작고 유지 보수하기 쉽게 만드는 데 도움이 되며, 애플리케이션이 성장할수록 발전하기 쉬워집니다.

**왜**? <br />
구성 요소는 종종 네 개의 파일 \(`*.html`, `*.css`, `*.ts`, 및 `*.spec.ts`\)을 가지며 빠르게 폴더를 혼잡하게 만들 수 있습니다.

다음은 준수하는 폴더 및 파일 구조입니다:

```markdown
project root
├── src
│ ├── app
│ │ ├── core
│ │ │ └── exception.service.ts|spec.ts
│ │ │ └── user-profile.service.ts|spec.ts
│ │ ├── heroes
│ │ │ ├── hero
│ │ │ │ └── hero.component.ts|html|css|spec.ts
│ │ │ ├── hero-list
│ │ │ │ └── hero-list.component.ts|html|css|spec.ts
│ │ │ ├── shared
│ │ │ │ └── hero-button.component.ts|html|css|spec.ts
│ │ │ │ └── hero.model.ts
│ │ │ │ └── hero.service.ts|spec.ts
│ │ │ └── heroes.component.ts|html|css|spec.ts
│ │ │ └── heroes.routes.ts
│ │ ├── shared
│ │ │ └── init-caps.pipe.ts|spec.ts
│ │ │ └── filter-text.component.ts|spec.ts
│ │ │ └── filter-text.service.ts|spec.ts
│ │ ├── villains
│ │ │ ├── villain
│ │ │ │ └── …
│ │ │ ├── villain-list
│ │ │ │ └── …
│ │ │ ├── shared
│ │ │ │ └── …
│ │ │ └── villains.component.ts|html|css|spec.ts
│ │ │ └── villains.module.ts
│ │ │ └── villains-routing.module.ts
│ │ └── app.component.ts|html|css|spec.ts
│ │ └── app.routes.ts
│ └── main.ts
│ └── index.html
│ └── …
└── node_modules/…
└── …
```

유용한 팁: 전용 폴더에 구성 요소를 두는 것이 널리 선호되지만, 작은 애플리케이션의 경우 구성 요소를 평면으로 유지하는 것도 선택할 수 있습니다 \(전용 폴더에 두지 않음\).  
이렇게 하면 기존 폴더에 최대 네 개의 파일이 추가되지만 폴더의 중첩도 줄어듭니다.  
어떤 것을 선택하든 일관성을 유지해야 합니다.

### *기능별 폴더* 구조

#### 스타일 04-07

**Do** 그 기능 영역을 나타내는 이름의 폴더를 만드십시오.

**왜**? <br />
개발자는 코드를 찾고 각 파일이 무엇을 나타내는지 한눈에 식별할 수 있습니다.  
구조는 가능한 한 평면이며 반복되거나 불필요한 이름이 없습니다.

**왜**? <br />
내용을 정리하여 애플리케이션이 복잡해지지 않도록 도와줍니다.

**왜**? <br />
파일이 많을 때, 예를 들어 10개 이상일 경우에는 일관된 폴더 구조로 찾기가 편하고 평면 구조에서는 더 어렵습니다.

더 많은 정보는 [이 폴더 및 파일 구조 예제](#overall-structural-guidelines)를 참조하십시오.

### 앱 *루트 모듈*

중요: 다음 스타일 가이드 권장 사항은 `NgModule` 기반 애플리케이션에 해당됩니다. 새 애플리케이션은 독립형 구성 요소, 지시자 및 파이프를 사용해야 합니다.

#### 스타일 04-08

**Do** 애플리케이션의 루트 폴더에 NgModule을 생성하십시오. 예를 들어, `/src/app`에 `NgModule` 기반 앱을 만들 때.

**왜**? <br />
모든 `NgModule` 기반 애플리케이션은 최소한 하나의 루트 NgModule이 필요합니다.

**Consider** 루트 모듈의 이름을 `app.module.ts`로 하십시오.

**왜**? <br />
루트 모듈을 식별하고 찾기 쉽게 만듭니다.

<docs-code path="adev/src/content/examples/styleguide/src/04-08/app/app.module.ts" language="typescript" visibleRegion="example" header="app/app.module.ts"/>

### 기능 모듈

#### 스타일 04-09

**Do** 애플리케이션의 모든 특정 기능에 대해 NgModule을 만드십시오. 예를 들어, `Heroes` 기능.

**Do** 기능 모듈을 기능 영역과 동일한 이름의 폴더에 배치하십시오. 예를 들어, `app/heroes`에.

**Do** 기능 모듈 파일을 기능 영역 및 폴더의 이름을 반영하여 이름 지으십시오. 예를 들어, `app/heroes/heroes.module.ts`.

**Do** 기능 모듈 기호를 기능 영역, 폴더 및 파일 이름을 반영하여 이름 지으십시오. 예를 들어, `app/heroes/heroes.module.ts`는 `HeroesModule`을 정의합니다.

**왜**? <br />
기능 모듈은 구현을 다른 모듈에서 노출하거나 숨길 수 있습니다.

**왜**? <br />
기능 모듈은 기능 영역을 구성하는 관련된 구성 요소의 특정 세트를 식별합니다.

**왜**? <br />
기능 모듈은 열기 및 지연 로드 모두에 쉽게 라우팅될 수 있습니다.

**왜**? <br />
기능 모듈은 특정 기능과 다른 애플리케이션 기능 간의 명확한 경계를 정의합니다.

**왜**? <br />
기능 모듈은 개발 책임을 여러 팀에 원활하게 배분할 수 있습니다.

**왜**? <br />
기능 모듈은 쉽게 테스트를 위해 격리될 수 있습니다.

### 공유 기능 모듈

#### 스타일 04-10

**Do** `SharedModule`라는 기능 모듈을 `shared` 폴더에 만드십시오. 예를 들어, `app/shared/shared.module.ts`는 `SharedModule`을 정의합니다.

**Do** 구성 요소, 지시자 및 파이프를 공유 모듈에 선언하십시오. 이러한 항목이 다른 기능 모듈에서 정의된 구성 요소에 의해 재사용되고 참조될 것입니다.

**Consider** 공유 모듈의 내용이 전체 애플리케이션에서 참조되는 경우 `SharedModule`이라는 이름을 사용하는 것을 고려하십시오.

**Consider** 공유 모듈에서 서비스를 제공하지 마십시오.  
서비스는 일반적으로 전체 애플리케이션이나 특정 기능 모듈에 대해 한 번 제공되는 단일 객체입니다.  
그러나 예외가 있을 수 있습니다.  
예를 들어, 아래의 샘플 코드에서 `SharedModule`이 `FilterTextService`를 제공하는 것을 확인하십시오.  
여기서 서비스가 상태가 없기 때문에 허용됩니다. 즉, 서비스 소비자는 새로운 인스턴스의 영향을 받지 않습니다.

**Do** `SharedModule`의 자산에 필요한 모든 모듈을 가져오십시오. 예를 들어, `CommonModule` 및 `FormsModule`.

**왜**? <br />
`SharedModule`은 다른 공통 모듈의 기능이 필요할 수 있는 구성 요소, 지시자 및 파이프를 포함합니다. 예를 들어, `CommonModule`의 `ngFor`.

**Do** `SharedModule`의 모든 구성 요소, 지시자 및 파이프를 선언하십시오.

**Do** 다른 기능 모듈에서 사용하기 위해 `SharedModule`에서 필요한 모든 기호를 내보내십시오.

**왜**? <br />
`SharedModule`은 여러 다른 모듈의 구성 요소 템플릿에서 사용할 수 있는 일반적으로 사용되는 구성 요소, 지시자 및 파이프를 만들기 위해 존재합니다.

**Avoid** `SharedModule`에서 애플리케이션 전역 단일 제공자를 지정하십시오.  
의도적인 단일 제공자는 괜찮습니다.  
주목하십시오.

**왜**? <br />
지연 로드된 기능 모듈이 공유 모듈을 가져오면 서비스의 자체 복사본이 생성되고 원하지 않는 결과가 발생할 수 있습니다.

**왜**? <br />
각 모듈이 단일 서비스의 별도 인스턴스를 갖게 하지 않으려면 그렇지 않으면 `SharedModule`이 서비스를 제공하면 발생할 수 있습니다.

```markdown
project root
├──src
├──├──app
├──├──├── shared
├──├──├──└── shared.module.ts
├──├──├──└── init-caps.pipe.ts|spec.ts
├──├──├──└── filter-text.component.ts|spec.ts
├──├──├──└── filter-text.service.ts|spec.ts
├──├──└── app.component.ts|html|css|spec.ts
├──├──└── app.module.ts
├──├──└── app-routing.module.ts
├──└── main.ts
├──└── index.html
└── …
```

<docs-code-multifile>
    <docs-code header="app/shared/shared.module.ts" path="adev/src/content/examples/styleguide/src/04-10/app/shared/shared.module.ts"/>
    <docs-code header="app/shared/init-caps.pipe.ts" path="adev/src/content/examples/styleguide/src/04-10/app/shared/init-caps.pipe.ts"/>
    <docs-code header="app/shared/filter-text/filter-text.component.ts" path="adev/src/content/examples/styleguide/src/04-10/app/shared/filter-text/filter-text.component.ts"/>
    <docs-code header="app/shared/filter-text/filter-text.service.ts" path="adev/src/content/examples/styleguide/src/04-10/app/shared/filter-text/filter-text.service.ts"/>
    <docs-code header="app/heroes/heroes.component.ts" path="adev/src/content/examples/styleguide/src/04-10/app/heroes/heroes.component.ts"/>
    <docs-code header="app/heroes/heroes.component.html" path="adev/src/content/examples/styleguide/src/04-10/app/heroes/heroes.component.html"/>
</docs-code-multifile>

### 지연 로드 폴더

#### 스타일 04-11

특정 애플리케이션 기능이나 워크플로를 *지연 로드* 또는 *요청 시 로드* 할 수 있습니다. 애플리케이션이 시작될 때가 아닌 경우입니다.

**Do** 지연 로드된 기능의 내용을 *지연 로드 폴더*에 넣으십시오.  
일반적인 *지연 로드 폴더*는 *라우팅 구성 요소*, 자식 구성 요소 및 관련 자산을 포함합니다.

**왜**? <br />
폴더가 기능 콘텐츠를 식별하고 격리하는 것을 쉽게 만듭니다.

## 구성 요소

### 요소로서의 구성 요소

#### 스타일 05-03

**Consider** 구성 요소에 *요소* 선택기를 부여하십시오. *속성* 또는 *클래스* 선택기 대신에.

**왜**? <br />
구성 요소에는 HTML 및 선택적 Angular 템플릿 구문이 포함된 템플릿이 있습니다.  
그들은 콘텐츠를 표시합니다.  
개발자는 구성 요소를 페이지에 원래 HTML 요소 및 웹 구성 요소처럼 배치합니다.

**왜**? <br />
템플릿의 HTML을 보고 기호가 구성 요소임을 인식하기가 더 쉽습니다.

유용한 팁: 기본 요소를 증강하려는 경우와 같이 구성 요소에 속성을 부여하는 몇 가지 사례가 있습니다.  
예를 들어, [Material Design](https://material.angular.io/components/button/overview)은 `<button mat-button>`에서 이 기술을 사용합니다.  
그러나 사용자 정의 요소에서는 이 기술을 사용하지 않을 것입니다.

<docs-code header="app/heroes/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/05-03/app/heroes/shared/hero-button/hero-button.component.avoid.ts" visibleRegion="example"/>

<docs-code header="app/app.component.html" path="adev/src/content/examples/styleguide/src/05-03/app/app.component.avoid.html"/>

<docs-code-multifile>
    <docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/05-03/app/heroes/shared/hero-button/hero-button.component.ts" visibleRegion="example"/>
    <docs-code header="app/app.component.html" path="adev/src/content/examples/styleguide/src/05-03/app/app.component.html"/>
</docs-code-multifile>

### 템플릿 및 스타일을 별도의 파일로 추출

#### 스타일 05-04

**Do** 3줄 이상일 때 템플릿 및 스타일을 별도의 파일로 추출하십시오.

**Do** 템플릿 파일의 이름을 `[component-name].component.html`로 지정하십시오. 여기서 [component-name]은 구성 요소의 이름입니다.

**Do** 스타일 파일의 이름을 `[component-name].component.css`로 지정하십시오. 여기서 [component-name]은 구성 요소의 이름입니다.

**Do** `./`로 접두사된 *구성 요소 상대* URL을 지정하십시오.

**왜**? <br />
큰 인라인 템플릿과 스타일은 구성 요소의 목적과 구현을 흐릿하게 하여 가독성과 유지 보수성을 감소시킵니다.

**왜**? <br />
대부분의 에디터에서 인라인 템플릿 및 스타일을 개발할 때 구문 힌트 및 코드 스니펫을 사용할 수 없습니다.  
Angular TypeScript 언어 서비스 \(곧 출시 예정\)는 이러한 에디터에서 HTML 템플릿을 지원하여 이 결점을 극복할 수 있습니다. 그러나 CSS 스타일에 대해서는 도움이 되지 않습니다.

**왜**? <br />
구성 요소 파일을 이동할 때 파일이 함께 유지되는 한 *구성 요소 상대* URL은 변경이 필요 없습니다.

**왜**? <br />
`./` 접두사는 상대 URL의 표준 구문입니다. Angular의 현재 기능에 의존해서는 안 됩니다.

<docs-code header="app/heroes/heroes.component.ts" path="adev/src/content/examples/styleguide/src/05-04/app/heroes/heroes.component.avoid.ts" visibleRegion="example"/>

<docs-code-multifile>
    <docs-code header="app/heroes/heroes.component.ts" path="adev/src/content/examples/styleguide/src/05-04/app/heroes/heroes.component.ts" visibleRegion="example"/>
    <docs-code header="app/heroes/heroes.component.html" path="adev/src/content/examples/styleguide/src/05-04/app/heroes/heroes.component.html"/>
    <docs-code header="app/heroes/heroes.component.css" path="adev/src/content/examples/styleguide/src/05-04/app/heroes/heroes.component.css"/>
</docs-code-multifile>

### `input` 및 `output` 속성 장식

#### 스타일 05-12

**Do** `@Input()` 및 `@Output()` 클래스 장식자를 사용하고, `@Directive` 및 `@Component` 메타데이터의 `inputs` 및 `outputs` 속성은 사용하지 마십시오:

**Consider** `@Input()` 또는 `@Output()`를 장식하는 속성과 같은 줄에 배치하는 것을 고려하십시오.

**왜**? <br />
클래스의 어떤 속성이 입력인지 출력인지 식별하는 것이 더 쉽고 가독성이 향상됩니다.

**왜**? <br />
`@Input()` 또는 `@Output()`와 관련된 속성이나 이벤트 이름을 변경해야 하는 경우, 한 곳에서 수정할 수 있습니다.

**왜**? <br />
지시자에 대한 메타데이터 선언이 더 짧고 가독성이 뛰어납니다.

**왜**? <br />
장식자를 같은 줄에 배치하는 것은 *대개* 더 짧은 코드를 만들고 속성이 입력 또는 출력임을 쉽게 식별할 수 있습니다.  
더 가독성이 좋으면 이전 줄에 두십시오.

<docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/05-12/app/heroes/shared/hero-button/hero-button.component.avoid.ts" visibleRegion="example"/>

<docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/05-12/app/heroes/shared/hero-button/hero-button.component.ts" visibleRegion="example"/>

### `inputs` 및 `outputs` 별칭 피하기

#### 스타일 05-13

**Avoid** `input` 및 `output` 별칭은 중요한 목적이 필요 없는 한 사용하지 마십시오.

**왜**? <br />
같은 속성에 대해 두 가지 이름 \(`하나는 비공식적이고 다른 하나는 공식적`\)을 두는 것은 본질적으로 혼란스럽습니다.

**왜**? <br />
지시자 이름이 `input` 속성이기도 하고, 지시자 이름이 속성을 설명하지 않는 경우 알리아스 사용을 고려해야 합니다.

<docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/05-13/app/heroes/shared/hero-button/hero-button.component.avoid.ts" visibleRegion="example"/>

<docs-code header="app/app.component.html" path="adev/src/content/examples/styleguide/src/05-13/app/app.component.avoid.html"/>

<docs-code-multifile>
    <docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/05-13/app/heroes/shared/hero-button/hero-button.component.ts" visibleRegion="example"/>
    <docs-code header="app/heroes/shared/hero-button/hero-highlight.directive.ts" path="adev/src/content/examples/styleguide/src/05-13/app/heroes/shared/hero-highlight.directive.ts"/>
    <docs-code header="app/app.component.html" path="adev/src/content/examples/styleguide/src/05-13/app/app.component.html"/>
</docs-code-multifile>

### 복잡한 구성 요소 논리를 서비스에 위임

#### 스타일 05-15

**Do** 구성 요소의 논리를 뷰에 필요한 논리로 제한하십시오.  
나머지 모든 논리는 서비스에 위임해야 합니다.

**Do** 재사용 가능한 논리를 서비스를 통해 이동시키고 구성 요소는 단순하고 의도한 목적에 집중하게 하십시오.

**왜**? <br />
로직은 서비스 내에 배치되어 함수로 노출될 때 여러 구성 요소에서 재사용할 수 있습니다.

**왜**? <br />
서비스 내의 로직은 단위 테스트에서 더 쉽게 격리될 수 있으며, 구성 요소에서 호출되는 로직을 쉽게 모의할 수 있습니다.

**왜**? <br />
구성 요소에서 종속성을 제거하고 구현 세부사항을 숨깁니다.

**왜**? <br />
구성 요소를 날씬하고 간결하며 집중하도록 유지합니다.

<docs-code header="app/heroes/hero-list/hero-list.component.ts" path="adev/src/content/examples/styleguide/src/05-15/app/heroes/hero-list/hero-list.component.avoid.ts"/>

<docs-code header="app/heroes/hero-list/hero-list.component.ts" path="adev/src/content/examples/styleguide/src/05-15/app/heroes/hero-list/hero-list.component.ts" visibleRegion="example"/>

### `output` 속성에 접두어를 붙이지 마십시오.

#### 스타일 05-16

**Do** 이벤트의 이름 앞에 `on` 접두어를 붙이지 마십시오.

**Do** 이벤트 핸들러 메서드에 이벤트 이름 다음에 `on` 접두어를 붙이십시오.

**왜**? <br />
이는 버튼 클릭과 같은 내장 이벤트와 일관성이 있습니다.

**왜**? <br />
Angular는 [대체 구문](guide/templates/binding) `on-*`을 허용합니다.  
이벤트 이름에 `on` 접두사가 붙으면 `on-onEvent` 바인딩 표현식이 생성됩니다.

<docs-code header="app/heroes/hero.component.ts" path="adev/src/content/examples/styleguide/src/05-16/app/heroes/hero.component.avoid.ts" visibleRegion="example"/>

<docs-code header="app/app.component.html" path="adev/src/content/examples/styleguide/src/05-16/app/app.component.avoid.html"/>

<docs-code-multifile>
    <docs-code header="app/heroes/hero.component.ts" path="adev/src/content/examples/styleguide/src/05-16/app/heroes/hero.component.ts" visibleRegion="example"/>
    <docs-code header="app/app.component.html" path="adev/src/content/examples/styleguide/src/05-16/app/app.component.html"/>
</docs-code-multifile>

### 표현 논리를 구성 요소 클래스에 넣으십시오.

#### 스타일 05-17

**Do** 표현 논리를 구성 요소 클래스에 두고 템플릿에 두지 마십시오.

**왜**? <br />
논리가 한 곳 \(구성 요소 클래스\)에 저장되므로 두 육각형에 분산되지 않습니다.

**왜**? <br />
구성 요소의 표현 논리를 템플릿 대신 클래스에 보관하면 테스트 가능성, 유지 보수성 및 재사용성이 향상됩니다.

<docs-code header="app/heroes/hero-list/hero-list.component.ts" path="adev/src/content/examples/styleguide/src/05-17/app/heroes/hero-list/hero-list.component.avoid.ts" visibleRegion="example"/>

<docs-code header="app/heroes/hero-list/hero-list.component.ts" path="adev/src/content/examples/styleguide/src/05-17/app/heroes/hero-list/hero-list.component.ts" visibleRegion="example"/>
### 입력 초기화

#### 스타일 05-18

TypeScript의 `--strictPropertyInitialization` 컴파일러 옵션은 클래스가 생성하는 동안 속성을 초기화하도록 보장합니다.  
이 옵션이 활성화되면 클래스가 명시적으로 선택란로 표시되지 않은 속성에 값을 설정하지 않으면 TypeScript 컴파일러가 오류를 보고합니다.

설계상 Angular는 모든 `@Input` 속성을 선택적으로 처리합니다.  
가능할 경우 기본값을 제공하여 `--strictPropertyInitialization`을 충족해야 합니다.

<docs-code header="app/heroes/hero/hero.component.ts" path="adev/src/content/examples/styleguide/src/05-18/app/heroes/hero/hero.component.ts" visibleRegion="example"/>

기본값을 생성하기 어려운 속성이 있다면 `?`를 사용하여 해당 속성을 명시적 선택적 속성으로 표시하십시오.

<docs-code header="app/heroes/hero/hero.component.ts" path="adev/src/content/examples/styleguide/src/05-18/app/heroes/hero/hero.component.optional.ts" visibleRegion="example"/>

필수 `@Input` 필드를 가져오고 싶다는 의미이기에 모든 구성 요소 사용자는 해당 속성을 전달해야 합니다.  
이런 경우에는 기본값을 사용해야 합니다.  
TypeScript 오류를 `!`로 억제하는 것은 충분하지 않으며 피해야 합니다. 이는 입력 값이 제공되도록 유형 검사기가 확인하는 것을 방해합니다.

<docs-code header="app/heroes/hero/hero.component.ts" path="adev/src/content/examples/styleguide/src/05-18/app/heroes/hero/hero.component.avoid.ts" visibleRegion="example"/>

## 지시자

### 요소를 향상시키기 위해 지시자를 사용하십시오.

#### 스타일 06-01

**Do** 프레젠테이션 로직이 템플릿 없이 있는 경우 속성 지시자를 사용하십시오.

**왜**? <br />
속성 지시자는 관련된 템플릿이 없습니다.

**왜**? <br />
하나의 요소에 여러 개의 속성 지시자가 적용될 수 있습니다.

<docs-code header="app/shared/highlight.directive.ts" path="adev/src/content/examples/styleguide/src/06-01/app/shared/highlight.directive.ts" visibleRegion="example"/>

<docs-code header="app/app.component.html" path="adev/src/content/examples/styleguide/src/06-01/app/app.component.html"/>

### `HostListener`/`HostBinding` 장식자 대 `host` 메타데이터

#### 스타일 06-03

**Consider** `@Directive` 및 `@Component` 장식자의 `host` 속성 대신 `@HostListener`와 `@HostBinding`을 선호하십시오.

**Do** 선택 사항에서 일관성을 유지하십시오.

**왜**? <br />
`@HostBinding`과 관련된 속성이나 `@HostListener`와 관련된 메서드는 단일 위치에서만 수정될 수 있습니다. 이러한 지시자의 클래스에서 변수를 조정해야 합니다.  
`host` 메타데이터 속성을 사용하는 경우, 속성/메서드 선언과 지시자와 관련된 장식자에서 모두 수정해야 합니다.

<docs-code header="app/shared/validator.directive.ts" path="adev/src/content/examples/styleguide/src/06-03/app/shared/validator.directive.ts"/>

덜 선호되는 `host` 메타데이터 대안과 비교하십시오.

**왜**? <br />
`host` 메타데이터는 한 가지 기억할 용어만 필요하며 추가 ES 가져오기를 요구하지 않습니다.

<docs-code header="app/shared/validator2.directive.ts" path="adev/src/content/examples/styleguide/src/06-03/app/shared/validator2.directive.ts"/>
## 서비스

### 서비스는 단일 객체입니다.

#### 스타일 07-01

**Do** 서비스를 동일한 주입기에서 단일 객체로 사용하십시오.  
데이터 및 기능 공유 용도로 사용합니다.

**왜**? <br />
서비스는 기능 영역 또는 앱 전체에서 메서드를 공유하는 데 이상적입니다.

**왜**? <br />
서비스는 상태가 있는 메모리 내 데이터를 공유하는 데 이상적입니다.

<docs-code header="app/heroes/shared/hero.service.ts" path="adev/src/content/examples/styleguide/src/07-01/app/heroes/shared/hero.service.ts" visibleRegion="example"/>

### 서비스를 제공하기

#### 스타일 07-03

**Do** 서비스를 `@Injectable` decorators의 루트 주입기에서 제공합니다.

**왜**? <br />
Angular 주입기는 계층적입니다.

**왜**? <br />
루트 주입기에 서비스를 제공할 때 해당 서비스의 인스턴스가 공유되며 서비스를 필요로 하는 모든 클래스에서 사용할 수 있습니다.  
서비스가 메서드나 상태를 공유할 때 이상적입니다.

**왜**? <br />
서비스를 `@Injectable` 장식자의 `@Injectable`에서 등록할 때 Angular CLI의 프로덕션 빌드에서 사용하는 최적화 도구가 트리 흔들기 및 앱에서 사용되지 않는 서비스를 제거할 수 있습니다.

**왜**? <br />
이는 서로 다른 두 개의 구성 요소가 서비스의 서로 다른 인스턴스가 필요할 때 이상적이지 않습니다.  
이 경우 새로운 및 별도의 인스턴스를 필요로 하는 구성 요소 수준에서 서비스를 제공하면 더 나은 솔루션이 됩니다.

<docs-code header="src/app/treeshaking/service.ts" path="adev/src/content/examples/dependency-injection/src/app/tree-shaking/service.ts"/>

### @Injectable() 클래스 장식자 사용

#### 스타일 07-04

**Do** 서비스의 의존성에 대한 토큰으로 유형을 사용할 때 `@Inject` 매개변수 장식자 대신 `@Injectable()` 클래스 장식자를 사용하십시오.

**왜**? <br />
Angular의 종속성 주입 \(DI\) 메커니즘은 서비스의 생성자 매개변수로 선언된 유형을 기반으로 자신의 종속성을 해결합니다.

**왜**? <br />
서비스가 유형 토큰과 연관된 종속성만 수용할 때, `@Injectable()` 구문은 각 개별 생성자 매개변수에 대해 `@Inject()`를 사용하는 것보다 훨씬 간단합니다.

<docs-code header="app/heroes/shared/hero-arena.service.ts" path="adev/src/content/examples/styleguide/src/07-04/app/heroes/shared/hero-arena.service.avoid.ts" visibleRegion="example"/>

<docs-code header="app/heroes/shared/hero-arena.service.ts" path="adev/src/content/examples/styleguide/src/07-04/app/heroes/shared/hero-arena.service.ts" visibleRegion="example"/>
## 데이터 서비스

### 서버와 소통하기

#### 스타일 08-01

**Do** 데이터 작업 및 데이터와의 상호 작용에 대한 로직을 서비스로 리팩토링하십시오.

**Do** 데이터 서비스가 XHR 호출, 로컬 저장소, 메모리에서 저장, 또는 기타 데이터 작업을 담당하게 하십시오.

**왜**? <br />
구성 요소의 책임은 프레젠테이션이며, 뷰를 위한 정보를 모으는 것입니다.  
데이터를 얻는 방법은 신경 쓰지 않고 단지 요청할 사람이 누구인지 알아야 합니다.  
데이터 서비스로 로직을 분리하면 이를 얻는 방법을 데이터 서비스에 맡기고 구성 요소 논리를 단순하게 유지할 수 있습니다.

**왜**? <br />
이를 통해 데이터 서비스를 사용하는 구성 요소를 테스트할 때 \(모의 또는 실제\) 데이터 호출 테스트가 더 쉬워집니다.

**왜**? <br />
헤더, HTTP 메서드, 캐싱, 오류 처리 및 재시도 로직과 같은 데이터 관리의 세부 사항은 구성 요소 및 기타 데이터 소비자에게는 중요하지 않습니다.  
데이터 서비스는 이러한 세부 사항을 캡슐화합니다.  
서비스 내에서 이러한 세부 사항을 발전시키는 것이 소비자에게 영향을 주지 않고 더 쉽습니다.  
그리고 모의 서비스 구현으로 소비자를 테스트하는 것이 더 쉽습니다.

## 생명 주기 훅

Angular가 노출하는 중요 이벤트에 참여하는 생명 주기 훅을 사용하십시오.

### 생명 주기 훅 인터페이스 구현

#### 스타일 09-01

**Do** 생명 주기 훅 인터페이스를 구현하십시오.

**왜**? <br />
생명 주기 인터페이스는 형식화된 메서드 시그니처를 규정합니다.  
오타 및 구문 오류에 대해 해당 서명을 사용하십시오.

<docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/09-01/app/heroes/shared/hero-button/hero-button.component.avoid.ts" visibleRegion="example"/>

<docs-code header="app/heroes/shared/hero-button/hero-button.component.ts" path="adev/src/content/examples/styleguide/src/09-01/app/heroes/shared/hero-button/hero-button.component.ts" visibleRegion="example"/>
## 부록

Angular에 유용한 도구와 팁입니다.

### 파일 템플릿 및 스니펫

#### 스타일 A-02

**Do** 일관된 스타일 및 패턴을 따르도록 도와주는 파일 템플릿이나 스니펫을 사용하십시오.  
다음은 일부 웹 개발 에디터와 IDE를 위한 템플릿 및/또는 스니펫입니다.

**Consider** 이 스타일 및 규칙을 따르는 [Visual Studio Code](https://code.visualstudio.com)용 [스니펫](https://marketplace.visualstudio.com/items?itemName=johnpapa.Angular2)을 사용하는 것을 고려하십시오.

<a href="https://marketplace.visualstudio.com/items?itemName=johnpapa.Angular2">

<img alt="Use Extension" src="assets/images/guide/styleguide/use-extension.gif">

</a>

**Consider** 이 스타일 및 규칙을 따르는 [Sublime Text](https://www.sublimetext.com)용 [스니펫](https://github.com/orizens/sublime-angular2-snippets)을 사용하는 것을 고려하십시오.

**Consider** 이 스타일 및 규칙을 따르는 [Vim](https://www.vim.org)용 [스니펫](https://github.com/mhartington/vim-angular2-snippets)을 사용하는 것을 고려하십시오.