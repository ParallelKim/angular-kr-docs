# Angular i18n 국제화 예제

이 샘플은 Angular 문서의 "[예제 Angular 국제화 애플리케이션](https://angular.dev/guide/i18n/example)" 페이지에서 가져온 것입니다.

## 다운로드 및 실행

1. `npm install`로 node_module 패키지를 설치합니다.
2. `npm start`로 영어로 실행되는 것을 확인합니다.
3. `npm run start:fr`로 프랑스어 번역으로 실행되는 것을 확인합니다.

>이 명령어들에 대한 설명은 `package.json` 스크립트를 참고하세요.

## Stackblitz에서 실행

Stackblitz는 기본적으로 영어 버전을 컴파일하고 실행합니다.

Angular i18n을 사용하여 예제를 프랑스어로 번역하려면:

1. `project.json` 파일을 열고 아래와 같이 추가하세요:

```json
  "stackblitz": {
    "startCommand": "npm run start:fr"
  }
```

2. Stackblitz 헤더의 "Fork" 버튼을 클릭하세요. 그러면 이 변경 사항으로 새로운 복사본이 생성되고 예제가 프랑스어로 다시 실행됩니다.