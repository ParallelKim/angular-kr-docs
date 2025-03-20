# 영역 오염 해결

**Zone.js**는 Angular가 애플리케이션 상태가 변경될 수 있을 때를 감지하기 위해 사용하는 신호 메커니즘입니다. 이는 `setTimeout`, 네트워크 요청 및 이벤트 리스너와 같은 비동기 작업을 포착합니다. Angular는 Zone.js의 신호를 기반으로 변경 감지를 예약합니다.

일부 경우에 예약된 [작업](https://developer.mozilla.org/docs/Web/API/HTML_DOM_API/Microtask_guide#tasks) 또는 [마이크로작업](https://developer.mozilla.org/docs/Web/API/HTML_DOM_API/Microtask_guide#microtasks)이 데이터 모델에 어떠한 변경도 하지 않으며, 이로 인해 변경 감지 실행이 불필요해집니다. 일반적인 예는 다음과 같습니다:

* `requestAnimationFrame`, `setTimeout` 또는 `setInterval`
* 제3자 라이브러리에 의한 작업 또는 마이크로작업 예약

이 섹션에서는 이러한 조건을 식별하는 방법과 불필요한 변경 감지 호출을 피하기 위해 Angular 영역 밖에서 코드를 실행하는 방법을 설명합니다.

## 불필요한 변경 감지 호출 식별하기

Angular DevTools를 사용하여 불필요한 변경 감지 호출을 탐지할 수 있습니다. 종종 이는 프로파일러의 타임라인에서 `setTimeout`, `setInterval`, `requestAnimationFrame` 또는 이벤트 핸들러를 소스로 하는 연속적인 막대로 나타납니다. 애플리케이션 내에서 이러한 API 호출이 제한적일 때 변경 감지 호출은 일반적으로 제3자 라이브러리에 의해 발생합니다.

<img alt="Angular DevTools profiler preview showing Zone pollution" src="assets/images/best-practices/runtime-performance/zone-pollution.png">

위 이미지에서는 요소와 연결된 이벤트 핸들러에 의해 트리거된 일련의 변경 감지 호출이 있습니다. 이는 기본 `NgZone`의 동작을 변경하지 않는 제3자 비네이티브 Angular 컴포넌트를 사용할 때 자주 발생하는 도전 과제입니다.

## `NgZone` 외부에서 작업 실행하기

이러한 경우, Angular에 특정 코드 조각에 의해 예약된 작업에 대해 변경 감지를 호출하지 않도록 지시할 수 있습니다 [NgZone](/api/core/NgZone)를 사용하여.

<docs-code header="영역 밖에서 실행하기" language='ts' linenums>
import { Component, NgZone, OnInit } from '@angular/core';

@Component(...)
class AppComponent implements OnInit {
  constructor(private ngZone: NgZone) {}
  ngOnInit() {
    this.ngZone.runOutsideAngular(() => setInterval(pollForUpdates), 500);
  }
}
</docs-code>

위의 코드 조각은 Angular에 `setInterval`을 Angular Zone 외부에서 호출하도록 지시하고, `pollForUpdates`가 실행된 후 변경 감지를 건너뛰도록 합니다.

제3자 라이브러리는 종종 그들의 API가 Angular 영역 내에서 호출될 때 불필요한 변경 감지 사이클을 유발합니다. 이러한 현상은 이벤트 리스너를 설정하거나 다른 작업(예: 타이머, XHR 요청 등)을 시작하는 라이브러리에 특히 영향을 미칩니다. 라이브러리 API를 Angular 영역 밖에서 호출하여 이러한 추가 사이클을 피하세요:

<docs-code header="플롯 초기화를 영역 밖으로 이동하기" language='ts' linenums>
import { Component, NgZone, OnInit } from '@angular/core';
import * as Plotly from 'plotly.js-dist-min';

@Component(...)
class AppComponent implements OnInit {

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      Plotly.newPlot('chart', data);
    });
  }
}
</docs-code>

`runOutsideAngular` 내에서 `Plotly.newPlot('chart', data);`를 실행하면 초기화 로직에 의해 예약된 작업 실행 후 변경 감지를 실행하지 않도록 프레임워크에 지시합니다.

예를 들어 `Plotly.newPlot('chart', data)`가 DOM 요소에 이벤트 리스너를 추가하면, Angular는 이 핸들러들이 실행된 후 변경 감지를 실행하지 않습니다.

하지만 때때로, 당신은 제3자 API가 전송하는 이벤트를 듣고 싶을 수 있습니다. 이러한 경우, 초기화 로직이 그곳에서 수행되었다면 해당 이벤트 리스너도 Angular 영역 밖에서 실행된다는 것을 기억하는 것이 중요합니다:

<docs-code header="핸들러가 영역 밖에서 호출되는지 확인하기" language='ts' linenums>
import { Component, NgZone, OnInit, output } from '@angular/core';
import * as Plotly from 'plotly.js-dist-min';

@Component(...)
class AppComponent implements OnInit {
  plotlyClick = output<Plotly.PlotMouseEvent>();

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.createPlotly();
    });
  }

  private async createPlotly() {
    const plotly = await Plotly.newPlot('chart', data);

    plotly.on('plotly_click', (event: Plotly.PlotMouseEvent) => {
      // 이 핸들러는 초기화 로직이 영역 밖에서 호출되기 때문에 
      // Angular 영역 밖에서 호출됩니다. 우리가 Angular 영역에 있는지 확인하기 위해서는 
      // 다음을 호출할 수 있습니다:
      console.log(NgZone.isInAngularZone());
      this.plotlyClick.emit(event);
    });
  }
}
</docs-code>

부모 컴포넌트에 이벤트를 전송하고 특정 뷰 업데이트 로직을 실행해야 하는 경우, 변경 감지를 실행하도록 프레임워크에 지시하거나 수동으로 변경 감지를 실행하기 위해 Angular 영역에 재진입하는 것을 고려해야 합니다:

<docs-code header="이벤트 전송 시 Angular 영역에 재진입하기" language='ts' linenums>
import { Component, NgZone, OnInit, output } from '@angular/core';
import * as Plotly from 'plotly.js-dist-min';

@Component(...)
class AppComponent implements OnInit {
  plotlyClick = output<Plotly.PlotMouseEvent>();

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.createPlotly();
    });
  }

  private async createPlotly() {
    const plotly = await Plotly.newPlot('chart', data);

    plotly.on('plotly_click', (event: Plotly.PlotMouseEvent) => {
      this.ngZone.run(() => {
        this.plotlyClick.emit(event);
      });
    });
  }
}
</docs-code>

Angular 영역 외부에서 이벤트를 전송하는 상황도 발생할 수 있습니다. 변경 감지를 트리거하는 것(예: 수동으로)은 Angular 영역 외부에서 뷰의 생성/업데이트를 초래할 수 있다는 점을 기억하는 것이 중요합니다.