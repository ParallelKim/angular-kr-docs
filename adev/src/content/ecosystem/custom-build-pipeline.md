# 커스텀 빌드 파이프라인

Angular 앱을 빌드할 때 Angular CLI를 사용하는 것을 강력히 권장합니다. 이를 통해 구조 종속 업데이트 기능 및 빌드 시스템 추상화를 활용할 수 있습니다. 이렇게 하면 프로젝트는 최신 보안, 성능 및 API 개선 사항과 투명한 빌드 개선의 혜택을 누리게 됩니다.

이 페이지에서는 Angular CLI를 사용하지 않는 커스텀 빌드 파이프라인이 필요한 **드문 사용 사례**를 탐구합니다. 아래에 나열된 모든 도구는 Angular 커뮤니티의 구성원들이 유지 관리하는 오픈 소스 빌드 플러그인입니다. 그들의 지원 모델 및 유지 관리 상태에 대해 자세히 알아보려면 문서 및 GitHub 리포지토리 URL을 확인하세요.

## 커스텀 빌드 파이프라인을 언제 사용해야 하나요?

커스텀 빌드 파이프라인을 유지 관리하려는 몇 가지 틈새 사용 사례가 있습니다. 예를 들어:

* 다른 도구 체인을 사용하는 기존 앱이 있으며 Angular를 추가하고 싶다
* [모듈 연합](https://module-federation.io/)에 강하게 결합되어 있으며 번들러에 구애받지 않는 [네이티브 연합](https://www.npmjs.com/package/@angular-architects/native-federation)을 채택할 수 없다
* 좋아하는 빌드 도구를 사용하여 단기적 실험을 만들고 싶다

## 옵션은 무엇인가요?

현재 커뮤니티에서 잘 지원되는 두 가지 도구가 있습니다. 이를 통해 [Vite 플러그인](https://www.npmjs.com/package/@analogjs/vite-plugin-angular)과 [Rspack 플러그인](https://www.npmjs.com/package/@ng-rspack/build)을 사용하여 커스텀 빌드 파이프라인을 만들 수 있습니다. 둘 다 Angular CLI의 기반 추상화를 사용합니다. 유연한 빌드 파이프라인을 만들 수 있도록 하며 수동 유지 관리가 필요하고 자동 업데이트 경험이 없습니다.

### Rspack

Rspack은 웹팩 플러그인 생태계와의 호환성을 제공하는 것을 목표로 하는 Rust 기반 번들러입니다.

프로젝트가 웹팩 생태계와 강하게 결합되어 있으며 맞춤형 웹팩 구성에 의존하는 경우 Rspack을 사용하여 빌드 시간을 개선할 수 있습니다.

Angular Rspack에 대한 자세한 내용은 프로젝트의 [문서 웹사이트](https://angular-rspack.dev/guide/migration/from-webpack)에서 확인할 수 있습니다.

### Vite

Vite는 현대 웹 프로젝트를 위한 더 빠르고 슬림한 개발 경험을 제공하는 프론트엔드 빌드 도구입니다. Vite는 또한 플러그인 시스템을 통해 확장 가능하여, Vitest(단위 및 브라우저 테스트용), 스토리북(고립된 컴포넌트 작성용) 등과 같은 생태계와 Vite 간의 통합을 구축할 수 있습니다. Angular CLI도 개발 서버로 Vite를 사용합니다.

[Angular를 위한 AnalogJS Vite 플러그인](https://www.npmjs.com/package/@analogjs/vite-plugin-angular)은 Vite를 사용하거나 Vite 위에 구축된 프로젝트나 프레임워크에서 Angular를 채택할 수 있게 해줍니다. 이는 Vite를 통해 Angular 프로젝트를 직접 개발하고 빌드하거나 기존 프로젝트나 파이프라인에 Angular를 추가하는 것을 포함할 수 있습니다. 한 예로는 [Astro와 Starlight](https://analogjs.org/docs/packages/astro-angular/overview)를 사용하여 문서 웹사이트에 Angular UI 컴포넌트를 통합하는 경우가 있습니다.

AnalogJS 및 플러그인을 사용하는 방법에 대해 더 알아보려면 [문서 페이지](https://analogjs.org/docs/packages/vite-plugin-angular/overview)를 확인하세요.