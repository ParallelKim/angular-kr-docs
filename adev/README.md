# [Angular.dev](https://www.angular.dev)

이 사이트는 Angular로 구축되었습니다.

내용은 주로 `src/content`에 위치한 Markdown 형식으로 작성되어 있습니다. 간단한 수정의 경우, GitHub에서 파일을 직접 수정하고 Pull Request를 생성할 수 있습니다.

## 로컬 개발

로컬 개발을 위해 [yarn](https://yarnpkg.com/)이 선호되는 패키지 관리자입니다. 다음 명령어로 로컬 환경을 설정할 수 있습니다:

```bash
# Angular 레포지토리 클론
git clone https://github.com/angular/angular.git

# 프로젝트 디렉토리로 이동
cd angular

# 의존성 설치
yarn

# 로컬 개발 서버 빌드 및 실행
# 주의: 초기 빌드는 시간이 걸릴 수 있습니다
yarn docs
```

문서 빌드에 문제가 있는 경우, [자주 묻는 질문(FAQs)](#faqs) 섹션을 참조하세요.

## 기여

버그를 보고하거나, 코드를 기여하거나, 문서를 개선하고 싶으신가요? 훌륭합니다!

우리의 [기여 가이드라인](/CONTRIBUTING.md)을 읽고 제출 프로세스, 코딩 규칙 등을 알아보세요.

그리고 새로 오셨다면, <kbd>[도움 필요](https://github.com/angular/angular/labels/help%20wanted)</kbd> 또는 <kbd>[좋은 첫 문제](https://github.com/angular/angular/labels/good%20first%20issue)</kbd>로 라벨이 붙은 문제 중 하나를 확인해 보세요.

### 행동 강령

Angular를 개방적이고 포용적으로 유지하는 데 도움을 주세요. 우리의 [행동 강령](/CODE_OF_CONDUCT.md)을 읽고 따르세요.

## 자주 묻는 질문(FAQs)

### 빌드에 실패하고 `bazel:bazel failed: missing input file` 메시지가 표시됩니다.

이는 대부분 bazel 의존성 / 캐싱 문제 때문일 가능성이 높습니다. 이를 해결하려면 다음 명령어를 실행하세요:

```
# 먼저 이걸 시도하세요
yarn bazel clean

# 그것이 작동하지 않으면, expunge 플래그와 함께 시도하세요
yarn bazel clean --expunge