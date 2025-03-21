# Runtime performance optimization

빠른 렌더링은 Angular에서 매우 중요하며, 우리는 성능이 뛰어난 앱을 개발할 수 있도록 많은 최적화가 포함된 프레임워크를 구축했습니다. 앱의 성능을 더 잘 이해하기 위해 [Angular DevTools](tools/devtools)와 Chrome DevTools를 사용하여 프로파일링하는 방법에 대한 [비디오 가이드](https://www.youtube.com/watch?v=FjyX_hkscII)를 제공합니다. 이 섹션에서는 가장 일반적인 성능 최적화 기술을 다룹니다.

**변경 감지**는 Angular가 애플리케이션 상태가 변경되었는지 확인하고 DOM이 업데이트되어야 하는지를 검사하는 과정입니다. 높은 수준에서 Angular는 변경 사항을 찾기 위해 구성 요소를 위에서 아래로 탐색합니다. Angular는 데이터 모델의 변경 사항이 애플리케이션의 뷰에 반영되도록 정기적으로 변경 감지 메커니즘을 실행합니다. 변경 감지는 수동 또는 비동기 이벤트(예: 사용자 상호작용 또는 XMLHttpRequest 완료)를 통해 트리거될 수 있습니다.

변경 감지는 매우 최적화되고 성능이 뛰어나지만, 애플리케이션이 너무 자주 실행되면 여전히 느려질 수 있습니다.

이 가이드에서는 애플리케이션의 일부를 건너뛰고 필요한 경우에만 변경 감지를 실행하여 변경 감지 메커니즘을 제어하고 최적화하는 방법을 배우게 됩니다.

미디어 형식으로 성능 최적화에 대해 더 배우고 싶다면 이 비디오를 시청하십시오:

<docs-video src="https://www.youtube.com/embed/f8sA-i6gkGQ"/>