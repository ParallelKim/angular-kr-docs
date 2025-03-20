# 디버깅 테스트

테스트가 예상대로 작동하지 않는 경우, 브라우저에서 검사 및 디버깅할 수 있습니다.

애플리케이션을 디버깅하는 방식으로 브라우저에서 스펙을 디버깅하십시오.

1. Karma 브라우저 창을 표시합니다.
    이 단계에 대한 도움이 필요하면 [테스트 설정](guide/testing#set-up-testing)을 참조하세요.

1. **DEBUG** 버튼을 클릭하여 새 브라우저 탭을 열고 테스트를 다시 실행합니다.
1. 브라우저의 **개발자 도구**를 엽니다. Windows에서는 `Ctrl-Shift-I`를 누릅니다. macOS에서는 `Command-Option-I`를 누릅니다.
1. **소스** 섹션을 선택합니다.
1. `Control/Command-P`를 누른 후 테스트 파일의 이름을 입력하여 엽니다.
1. 테스트에 중단점을 설정합니다.
1. 브라우저를 새로 고침하고 중단점에서 중단되는지 확인합니다.

<img alt="Karma 디버깅" src="assets/images/guide/testing/karma-1st-spec-debug.png">