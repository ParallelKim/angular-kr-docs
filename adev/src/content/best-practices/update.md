# Angular 프로젝트 최신 상태 유지하기

웹 및 전체 웹 생태계와 마찬가지로 Angular는 지속적으로 개선되고 있습니다.
Angular는 지속적인 개선과 안정성, 그리고 업데이트를 즉각적으로 할 수 있도록 하는 데 중점을 두고 있습니다.
Angular 애플리케이션을 최신 상태로 유지하면 최신 기능, 최적화 및 버그 수정을 활용할 수 있습니다.

이 문서는 Angular 애플리케이션 및 라이브러리를 최신 상태로 유지하는 데 도움이 되는 정보와 리소스를 포함하고 있습니다.

버전 관리 정책 및 관행에 대한 정보—지원 및 사용 중단 관행, 출시 일정 포함—은 [Angular 버전 관리 및 출시](reference/releases "Angular 버전 관리 및 출시")를 참조하십시오.

도움됨: 현재 AngularJS를 사용 중인 경우 [AngularJS에서 업그레이드](https://angular.io/guide/upgrade "AngularJS에서 업그레이드")를 참조하십시오.
*AngularJS*는 모든 v1.x 버전의 Angular를 지칭하는 이름입니다.

## 새 릴리스 알림 받기

새 릴리스가 제공될 때 알림을 받으려면 X(옛날 Twitter)에서 [@angular](https://x.com/angular "@angular on X)를 팔로우하거나 [Angular 블로그](https://blog.angular.dev "Angular 블로그")를 구독하십시오.

## 새로운 기능 배우기

새로운 것은 무엇인가요? 무엇이 변경되었나요? Angular 블로그의 [릴리스 발표](https://blog.angular.dev/ "Angular 블로그 - 릴리스 발표")에 가장 중요한 정보를 공유합니다.

변경사항의 전체 목록을 버전별로 검토하려면 [Angular 변경 로그](https://github.com/angular/angular/blob/main/CHANGELOG.md "Angular 변경 로그")를 참조하십시오.

## Angular 버전 확인하기

애플리케이션의 Angular 버전을 확인하려면 프로젝트 디렉터리 내에서 `ng version` 명령을 사용하십시오.

## 현재 Angular 버전 찾기

가장 최근에 안정적으로 출시된 Angular 버전은 [npm](https://www.npmjs.com/package/@angular/core "npm의 Angular")의 "버전" 아래에 표시됩니다. 예: `16.2.4`.

또한 CLI 명령 [`ng update`](cli/update)를 사용하여 최신 Angular 버전을 찾을 수 있습니다.
기본적으로 [`ng update`](cli/update)(추가 인수 없음)는 귀하가 사용할 수 있는 업데이트를 나열합니다.

## 환경 및 애플리케이션 업데이트하기

업데이트를 간단하게 하기 위해 인터랙티브 [Angular 업데이트 가이드](update-guide)에서 완전한 지침을 제공합니다.

Angular 업데이트 가이드는 귀하가 지정한 현재 및 목표 버전에 기반하여 맞춤형 업데이트 지침을 제공합니다.
복잡성에 맞춘 기본 및 고급 업데이트 경로를 포함하고 있습니다.
트러블슈팅 정보와 함께 새로운 릴리스를 최대한 활용하기 위해 필요한 수동 변경 사항도 포함되어 있습니다.

간단한 업데이트의 경우 CLI 명령 [`ng update`](cli/update)만으로 충분합니다.
추가 인수 없이 [`ng update`](cli/update)는 귀하가 사용할 수 있는 업데이트를 나열하고 애플리케이션을 최신 버전으로 업데이트하기 위한 추천 단계를 제공합니다.

[Angular 버전 관리 및 출시](reference/releases#versioning "Angular 출시 관행, 버전 관리")는 릴리스 버전 번호에 따라 기대할 수 있는 변경 수준을 설명합니다.
또한 지원되는 업데이트 경로를 설명합니다.

## 리소스 요약

* 릴리스 발표:
    [Angular 블로그 - 릴리스 발표](https://blog.angular.dev/ "Angular 블로그에서의 최근 릴리스 안내")

* 릴리스 세부정보:
    [Angular 변경 로그](https://github.com/angular/angular/blob/main/CHANGELOG.md "Angular 변경 로그")

* 업데이트 지침:
    [Angular 업데이트 가이드](update-guide)

* 업데이트 명령 참조:
    [Angular CLI `ng update` 명령 참조](cli/update)

* 버전 관리, 릴리스, 지원 및 사용 중단 관행:
    [Angular 버전 관리 및 출시](reference/releases "Angular 버전 관리 및 출시")