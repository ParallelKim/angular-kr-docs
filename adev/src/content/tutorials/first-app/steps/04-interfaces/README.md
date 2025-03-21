# 인터페이스 만들기

이 튜토리얼 수업은 인터페이스를 생성하고 이를 앱의 구성 요소에 포함시키는 방법을 보여줍니다.

<docs-video src="https://www.youtube.com/embed/eM3zi_n7lNs?si=YkFSeUeV8Ixtz8pm"/>

## 배울 내용

* 당신의 앱은 데이터 유형으로 사용할 수 있는 새로운 인터페이스를 갖습니다.
* 당신의 앱은 샘플 데이터가 있는 새로운 인터페이스의 인스턴스를 갖습니다.

## 인터페이스의 개념적 미리보기

[인터페이스](https://www.typescriptlang.org/docs/handbook/interfaces.html)는 당신의 앱을 위한 사용자 정의 데이터 유형입니다.

앵귤러는 TypeScript를 사용하여 강력하게 타입이 지정된 프로그래밍 환경에서 작업하는 이점을 활용합니다.
강력한 타입 검사로 인해 앱 내의 한 요소가 잘못된 형식의 데이터를 다른 요소에 전송할 가능성이 줄어듭니다.
이러한 타입 불일치 오류는 TypeScript 컴파일러에 의해 포착되며, 많은 오류는 IDE에서도 확인할 수 있습니다.

이 수업에서는 단일 주거 위치에 대한 데이터를 나타내는 속성을 정의하는 인터페이스를 생성할 것입니다.

<docs-workflow>

<docs-step title="새 Angular 인터페이스 생성">
이 단계는 앱에서 새로운 인터페이스를 생성합니다.

**터미널** 패널에서:

1. 프로젝트 디렉토리에서 `first-app` 디렉토리로 이동합니다.
1. `first-app` 디렉토리에서 새로운 인터페이스를 생성하기 위해 다음 명령을 실행합니다.

    <docs-code language="shell">

    ng generate interface housinglocation

    </docs-code>

1. `ng serve`를 실행하여 앱을 빌드하고 `http://localhost:4200`에서 제공됩니다.
1. 브라우저에서 `http://localhost:4200`을 열어 앱을 확인합니다.
1. 앱이 오류 없이 빌드되는지 확인합니다.
   오류가 발생하면 다음 단계로 진행하기 전에 수정해야 합니다.
</docs-step>

<docs-step title="새 인터페이스에 속성 추가">
이 단계에서는 앱에서 주거 위치를 나타내기 위해 인터페이스에 속성을 추가합니다.

1. **터미널** 패널에서 `ng serve` 명령을 실행하여 앱을 빌드하고 `http://localhost:4200`에서 제공됩니다. 
1. **편집** 패널에서 `src/app/housinglocation.ts` 파일을 엽니다.
1. `housinglocation.ts`에서 기본 내용을 다음 코드로 교체하여 새로운 인터페이스가 이 예제와 일치하도록 합니다.

    <docs-code header="src/app/housinglocation.ts 업데이트" path="adev/src/content/tutorials/first-app/steps/05-inputs/src/app/housinglocation.ts" visibleLines="[1,10]" />

1. 변경 사항을 저장하고 앱에 오류가 표시되지 않는지 확인합니다. 오류가 발생하면 다음 단계로 진행하기 전에 수정해야 합니다.

이 시점에서, `id`, `name`, 및 위치 정보를 포함하여 주거 위치에 대한 데이터를 나타내는 인터페이스를 정의했습니다.
</docs-step>

<docs-step title="앱을 위한 테스트 주택 생성">
인터페이스는 있지만, 아직 사용하지 않고 있습니다.

이 단계에서는 인터페이스의 인스턴스를 생성하고 샘플 데이터를 할당합니다.
이 샘플 데이터는 아직 앱에 나타나지 않을 것입니다.
그 일이 일어나기 전에 완료해야 할 수업이 몇 가지 더 있습니다.

1. **터미널** 패널에서 `ng serve` 명령을 실행하여 앱을 빌드하고 `http://localhost:4200`에서 제공됩니다.
1. **편집** 패널에서 `src/app/home/home.component.ts` 파일을 엽니다.
1. `src/app/home/home.component.ts`에서 기존의 `import` 문 뒤에 이 import 문을 추가하여 `HomeComponent`가 새로운 인터페이스를 사용할 수 있도록 합니다.

    <docs-code header="src/app/home/home.component.ts에 HomeComponent 가져오기" path="adev/src/content/tutorials/first-app/steps/05-inputs/src/app/home/home.component.ts" visibleLines="[4]"/>

1. `src/app/home/home.component.ts`에서 빈 `export class HomeComponent {}` 정의를 다음 코드로 교체하여 구성 요소 내에 새로운 인터페이스의 단일 인스턴스를 생성합니다.

    <docs-code header="src/app/home/home.component.ts에 샘플 데이터 추가" path="adev/src/content/tutorials/first-app/steps/05-inputs/src/app/home/home.component.ts" visibleLines="[23,36]"/>

1. `home.component.ts` 파일이 이 예제와 일치하는지 확인합니다.

    <docs-code header="src/app/home/home.component.ts" path="adev/src/content/tutorials/first-app/steps/05-inputs/src/app/home/home.component.ts" visibleLines="[1,36]" />

    `HomeComponent` 클래스에 `HousingLocation` 유형의 `housingLocation` 속성을 추가함으로써 데이터가 인터페이스의 설명과 일치함을 확인할 수 있습니다. 데이터가 인터페이스의 설명을 만족하지 않으면, IDE에는 유용한 오류를 제공할 수 있는 충분한 정보가 있습니다.

1. 변경 사항을 저장하고 앱에 오류가 없는지 확인합니다. 브라우저를 열고 애플리케이션이 여전히 "housing-location works!" 메시지를 표시하는지 확인합니다.

    <img alt="로고, 필터 텍스트 입력 상자 및 검색 버튼과 'housing-location works!'라는 메시지를 표시하는 homes-app의 브라우저 프레임" src="assets/images/tutorials/first-app/homes-app-lesson-03-step-2.png">

1. 다음 단계로 진행하기 전에 오류를 수정합니다.
</docs-step>

</docs-workflow>

요약: 이번 수업에서 당신은 앱을 위한 새로운 데이터 유형을 생성하는 인터페이스를 만들었습니다.
이 새로운 데이터 유형은 `HousingLocation` 데이터가 필요한 위치를 지정할 수 있게 해줍니다.
이 새로운 데이터 유형은 IDE와 TypeScript 컴파일러가 `HousingLocation` 데이터가 필요한 곳에서 사용되는지 보장할 수 있게 합니다.

이번 수업에서 다룬 주제에 대한 추가 정보는 다음 링크를 방문하십시오:

<docs-pill-row>
  <docs-pill href="cli/generate/interface" title="ng generate interface"/>
  <docs-pill href="cli/generate" title="ng generate"/>
</docs-pill-row>